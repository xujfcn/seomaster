const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { getLocalMirrorDsn } = require('./db-config');
const { loadProjects } = require('./project-manager');
const { buildArticleIndex, saveArticleIndex, slugify } = require('./article-index');
const { ensureTopicCard, ensureVaultStructure } = require('./topic-manager');
const { loadProjectConfig } = require('./project-config');
const { writeMarkdownDocument } = require('./frontmatter');

const EXPECTED_BLOG_COLUMNS = [
  'id', 'title', 'slug', 'content', 'content_type', 'summary', 'cover_image_url', 'tag',
  'language', 'group_id', 'status', 'author_id', 'view_count', 'sort_order',
  'created_at', 'updated_at', 'published_at', 'deleted_at', 'type', 'video_url',
  'video_id', 'channel_name', 'channel_url', 'video_duration', 'video_published_at',
  'key_information', 'timeline', 'faqs', 'subtitle_source', 'subtitle_content',
];

function normalizeTimestamp(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function toDateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function getProjectContext(projectId) {
  const config = loadProjects();
  const resolvedId = projectId || config.current_project;
  if (!resolvedId || !config.projects[resolvedId]) {
    throw new Error(`Project not found: ${resolvedId || '(none)'}`);
  }

  return {
    projectId: resolvedId,
    project: config.projects[resolvedId],
  };
}

async function withClient(fn) {
  const connectionString = getLocalMirrorDsn();
  if (!connectionString) {
    throw new Error('Missing local mirror DSN. Set SEOMASTER_LOCAL_DSN or SQL_DSN.');
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function ensureMirrorSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS remote_blogs (
      remote_blog_id BIGINT PRIMARY KEY,
      title TEXT,
      slug TEXT NOT NULL,
      content TEXT,
      content_type TEXT,
      summary TEXT,
      cover_image_url TEXT,
      tag TEXT,
      language TEXT,
      group_id TEXT,
      status INTEGER,
      author_id BIGINT,
      view_count INTEGER,
      sort_order INTEGER,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      published_at TIMESTAMP,
      deleted_at TIMESTAMP,
      type TEXT,
      video_url TEXT,
      video_id TEXT,
      channel_name TEXT,
      channel_url TEXT,
      video_duration INTEGER,
      video_published_at TIMESTAMP,
      key_information TEXT,
      timeline TEXT,
      faqs TEXT,
      subtitle_source TEXT,
      subtitle_content TEXT,
      synced_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blog_sync_state (
      sync_key TEXT PRIMARY KEY,
      last_full_sync_at TIMESTAMP,
      last_incremental_sync_at TIMESTAMP,
      last_remote_updated_at TIMESTAMP,
      last_success_at TIMESTAMP,
      last_error TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blog_local_index (
      article_id TEXT PRIMARY KEY,
      remote_blog_id BIGINT,
      topic_key TEXT,
      slug TEXT,
      lang TEXT,
      title TEXT,
      status TEXT,
      published_url TEXT,
      obsidian_path TEXT,
      content_hash TEXT,
      summary_hash TEXT,
      duplicate_risk TEXT,
      review_status TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blog_publish_jobs (
      job_id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      target TEXT NOT NULL,
      status TEXT NOT NULL,
      response JSONB,
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

async function getExistingBlogColumns(client) {
  const result = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blogs'
    ORDER BY ordinal_position
  `);

  const columns = result.rows.map((row) => row.column_name);
  return EXPECTED_BLOG_COLUMNS.filter((column) => columns.includes(column));
}

async function getSyncState(client) {
  const result = await client.query(
    'SELECT * FROM blog_sync_state WHERE sync_key = $1',
    ['blogs']
  );
  return result.rows[0] || null;
}

function buildBlogQuery(columns, mode, syncState) {
  const selectClause = columns.map((column) => `"${column}"`).join(', ');
  let text = `SELECT ${selectClause} FROM blogs`;
  const values = [];

  if (mode === 'incremental' && syncState?.last_remote_updated_at) {
    text += " WHERE updated_at > (SELECT last_remote_updated_at FROM blog_sync_state WHERE sync_key = 'blogs')";
  }

  text += ' ORDER BY updated_at ASC NULLS LAST, id ASC';
  return { text, values };
}

async function fetchBlogs(client, mode) {
  const syncState = await getSyncState(client);
  const columns = await getExistingBlogColumns(client);
  if (columns.length === 0) {
    throw new Error('The blogs table was not found or has no expected columns.');
  }

  const query = buildBlogQuery(columns, mode, syncState);
  const result = await client.query(query);
  return {
    rows: result.rows,
    columns,
    syncState,
  };
}

function buildUpsertStatement(tableName, columns, conflictColumn, rows) {
  const allColumns = [...columns, 'synced_at'];
  const valuePlaceholders = [];
  const values = [];
  let paramIndex = 1;

  rows.forEach((row) => {
    const placeholders = [];
    columns.forEach((column) => {
      placeholders.push(`$${paramIndex++}`);
      values.push(row[column] ?? null);
    });
    placeholders.push(`$${paramIndex++}`);
    values.push(new Date());
    valuePlaceholders.push(`(${placeholders.join(', ')})`);
  });

  const updateAssignments = allColumns
    .filter((column) => column !== conflictColumn)
    .map((column) => `"${column}" = EXCLUDED."${column}"`)
    .join(', ');

  return {
    text: `
      INSERT INTO ${tableName} (${allColumns.map((column) => `"${column}"`).join(', ')})
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT ("${conflictColumn}") DO UPDATE
      SET ${updateAssignments}
    `,
    values,
  };
}

async function upsertRemoteBlogs(client, rows, columns) {
  if (rows.length === 0) {
    return 0;
  }

  const targetColumns = columns.map((column) => (column === 'id' ? 'remote_blog_id' : column));
  const statement = buildUpsertStatement('remote_blogs', targetColumns, 'remote_blog_id', rows.map((row) => ({
    ...row,
    remote_blog_id: row.id,
  })));

  await client.query(statement.text, statement.values);
  return rows.length;
}

function hashText(text) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(String(text || ''), 'utf-8').digest('hex');
}

function inferTopicKey(blog) {
  if (blog.slug) return slugify(blog.slug);
  if (blog.title) return slugify(blog.title);
  return `blog-${blog.id}`;
}

function inferStatus(blog) {
  if (blog.deleted_at) return 'deleted';
  if (blog.published_at) return 'published';
  if (blog.status === 1) return 'published';
  return 'draft';
}

function buildPublishedUrl(projectConfig, blog) {
  const base = projectConfig?.channels?.blog?.base_url || '';
  if (!base || !blog.slug) return '';
  return `${String(base).replace(/\/+$/, '')}/${blog.slug}`;
}

async function rebuildLocalIndex(client, projectId, vaultPath) {
  const projectConfig = loadProjectConfig();
  const blogsResult = await client.query('SELECT * FROM remote_blogs ORDER BY updated_at DESC NULLS LAST, remote_blog_id DESC');
  const blogs = blogsResult.rows;

  await client.query('DELETE FROM blog_local_index');

  for (const blog of blogs) {
    const topicKey = inferTopicKey(blog);
    const articleId = `${projectId}-remote-${blog.remote_blog_id}`;
    const publishedUrl = buildPublishedUrl(projectConfig, blog);
    const obsidianPath = blog.published_at
      ? path.join(vaultPath, 'Published', `${toDateOnly(blog.published_at).slice(0, 7)}`, `${blog.slug}.md`)
      : '';

    await client.query(`
      INSERT INTO blog_local_index (
        article_id, remote_blog_id, topic_key, slug, lang, title, status,
        published_url, obsidian_path, content_hash, summary_hash,
        duplicate_risk, review_status, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, NOW()
      )
      ON CONFLICT (article_id) DO UPDATE SET
        remote_blog_id = EXCLUDED.remote_blog_id,
        topic_key = EXCLUDED.topic_key,
        slug = EXCLUDED.slug,
        lang = EXCLUDED.lang,
        title = EXCLUDED.title,
        status = EXCLUDED.status,
        published_url = EXCLUDED.published_url,
        obsidian_path = EXCLUDED.obsidian_path,
        content_hash = EXCLUDED.content_hash,
        summary_hash = EXCLUDED.summary_hash,
        duplicate_risk = EXCLUDED.duplicate_risk,
        review_status = EXCLUDED.review_status,
        updated_at = NOW()
    `, [
      articleId,
      blog.remote_blog_id,
      topicKey,
      blog.slug || '',
      blog.language || '',
      blog.title || '',
      inferStatus(blog),
      publishedUrl,
      obsidianPath,
      hashText(blog.content || ''),
      hashText(blog.summary || ''),
      '',
      'synced',
    ]);
  }

  return blogs.length;
}

async function updateSyncState(client, mode, rows) {
  const lastRemoteUpdatedAt = getLatestUpdatedAt(rows);

  await client.query(`
    INSERT INTO blog_sync_state (
      sync_key,
      last_full_sync_at,
      last_incremental_sync_at,
      last_remote_updated_at,
      last_success_at,
      last_error,
      updated_at
    ) VALUES (
      'blogs',
      $1,
      $2,
      $3,
      NOW(),
      NULL,
      NOW()
    )
    ON CONFLICT (sync_key) DO UPDATE SET
      last_full_sync_at = COALESCE(EXCLUDED.last_full_sync_at, blog_sync_state.last_full_sync_at),
      last_incremental_sync_at = COALESCE(EXCLUDED.last_incremental_sync_at, blog_sync_state.last_incremental_sync_at),
      last_remote_updated_at = COALESCE(EXCLUDED.last_remote_updated_at, blog_sync_state.last_remote_updated_at),
      last_success_at = NOW(),
      last_error = NULL,
      updated_at = NOW()
  `, [
    mode === 'full' ? new Date() : null,
    mode === 'incremental' ? new Date() : null,
    lastRemoteUpdatedAt,
  ]);
}

function buildPublishedMarkdown(blog) {
  const summary = blog.summary ? `\n\n## Summary\n\n${blog.summary}` : '';
  const content = blog.content || '';
  return `${content}${summary}`.trim();
}

function getLatestUpdatedAt(rows) {
  let latest = null;

  for (const row of rows) {
    if (!row.updated_at) continue;
    const candidate = new Date(row.updated_at);
    if (Number.isNaN(candidate.getTime())) continue;
    if (!latest || candidate.getTime() > latest.getTime()) {
      latest = candidate;
    }
  }

  return latest;
}

function normalizeRemoteBlogRow(blog) {
  return {
    id: blog.id ?? blog.remote_blog_id ?? blog.remoteBlogId ?? null,
    title: blog.title ?? '',
    slug: blog.slug ?? '',
    content: blog.content ?? '',
    content_type: blog.content_type ?? blog.contentType ?? 'markdown',
    summary: blog.summary ?? '',
    cover_image_url: blog.cover_image_url ?? blog.coverImageUrl ?? '',
    tag: blog.tag ?? '',
    language: blog.language ?? '',
    group_id: blog.group_id ?? blog.groupId ?? '',
    status: blog.status ?? null,
    author_id: blog.author_id ?? blog.authorId ?? null,
    view_count: blog.view_count ?? blog.viewCount ?? 0,
    sort_order: blog.sort_order ?? blog.sortOrder ?? 0,
    created_at: blog.created_at ?? blog.createdAt ?? null,
    updated_at: blog.updated_at ?? blog.updatedAt ?? null,
    published_at: blog.published_at ?? blog.publishedAt ?? null,
    deleted_at: blog.deleted_at ?? blog.deletedAt ?? null,
    type: blog.type ?? '',
    video_url: blog.video_url ?? blog.videoUrl ?? '',
    video_id: blog.video_id ?? blog.videoId ?? '',
    channel_name: blog.channel_name ?? blog.channelName ?? '',
    channel_url: blog.channel_url ?? blog.channelUrl ?? '',
    video_duration: blog.video_duration ?? blog.videoDuration ?? null,
    video_published_at: blog.video_published_at ?? blog.videoPublishedAt ?? null,
    key_information: blog.key_information ?? blog.keyInformation ?? '',
    timeline: blog.timeline ?? '',
    faqs: blog.faqs ?? '',
    subtitle_source: blog.subtitle_source ?? blog.subtitleSource ?? '',
    subtitle_content: blog.subtitle_content ?? blog.subtitleContent ?? '',
  };
}

function exportBlogToObsidian(blog, projectId, vaultPath, projectConfig, overrides = {}) {
  const topicKey = overrides.topicKey || inferTopicKey(blog);
  const articleId = overrides.articleId || `${projectId}-remote-${blog.remote_blog_id}`;
  const keyword = overrides.keyword || blog.slug || blog.title || '';
  const publishedAt = blog.published_at || blog.updated_at || blog.created_at || new Date();
  const yearMonth = toDateOnly(publishedAt).slice(0, 7) || new Date().toISOString().slice(0, 7);
  const targetDir = path.join(vaultPath, 'Published', yearMonth);
  fs.mkdirSync(targetDir, { recursive: true });

  ensureTopicCard(vaultPath, {
    projectId,
    topicKey,
    keyword: keyword || topicKey,
    intent: 'informational',
    primaryArticleId: articleId,
  });

  const targetPath = path.join(targetDir, `${blog.slug || topicKey}.md`);
  writeMarkdownDocument(targetPath, {
    type: 'article',
    project: projectId,
    topic_key: topicKey,
    article_id: articleId,
    remote_blog_id: blog.remote_blog_id,
    status: 'published',
    lang: blog.language || '',
    keyword,
    slug: blog.slug || topicKey,
    canonical: true,
    published_url: buildPublishedUrl(projectConfig, blog),
    group_id: blog.group_id || '',
    remote_status: blog.status,
    sync_source: 'remote',
    sync_time: new Date().toISOString(),
    created_at: toDateOnly(blog.created_at),
    updated_at: toDateOnly(blog.updated_at),
    published_at: toDateOnly(blog.published_at),
    quality_score: '',
    review_status: 'synced',
    view_count: blog.view_count || 0,
    tag: blog.tag || '',
    cover_image_url: blog.cover_image_url || '',
  }, buildPublishedMarkdown(blog));

  return targetPath;
}

async function exportRemoteBlogsToObsidian(client, projectId, vaultPath) {
  ensureVaultStructure(vaultPath);

  const projectConfig = loadProjectConfig();
  const result = await client.query(`
    SELECT *
    FROM remote_blogs
    WHERE deleted_at IS NULL
    ORDER BY published_at DESC NULLS LAST, updated_at DESC NULLS LAST, remote_blog_id DESC
  `);

  let exported = 0;
  for (const blog of result.rows) {
    exportBlogToObsidian(blog, projectId, vaultPath, projectConfig);
    exported++;
  }

  const articleIndex = buildArticleIndex(vaultPath, projectId);
  const indexPath = saveArticleIndex(articleIndex);

  return {
    exported,
    indexPath,
  };
}

async function backfillRemoteBlog(blog, options = {}) {
  const { projectId, project } = getProjectContext(options.project);
  if (!project.vault_path) {
    throw new Error(`Project "${projectId}" does not define vault_path`);
  }

  const normalizedBlog = normalizeRemoteBlogRow(blog);

  return withClient(async (client) => {
    await ensureMirrorSchema(client);
    await upsertRemoteBlogs(client, [normalizedBlog], EXPECTED_BLOG_COLUMNS);
    const indexed = await rebuildLocalIndex(client, projectId, project.vault_path);
    ensureVaultStructure(project.vault_path);
    const publishedPath = exportBlogToObsidian({
      remote_blog_id: normalizedBlog.id,
      ...normalizedBlog,
    }, projectId, project.vault_path, loadProjectConfig(), {
      articleId: options.articleId,
      topicKey: options.topicKey,
      keyword: options.keyword,
    });
    const indexPath = saveArticleIndex(buildArticleIndex(project.vault_path, projectId));

    return {
      mirrored: 1,
      exported: 1,
      indexed,
      publishedPath,
      indexPath,
    };
  });
}

async function syncBlogs(mode, options = {}) {
  const { projectId, project } = getProjectContext(options.project);
  if (!project.vault_path) {
    throw new Error(`Project "${projectId}" does not define vault_path`);
  }

  return withClient(async (client) => {
    await ensureMirrorSchema(client);

    if (mode === 'repair') {
      const indexed = await rebuildLocalIndex(client, projectId, project.vault_path);
      const exported = await exportRemoteBlogsToObsidian(client, projectId, project.vault_path);
      return {
        mode,
        mirrored: 0,
        indexed,
        exported: exported.exported,
        indexPath: exported.indexPath,
      };
    }

    if (mode === 'export-obsidian') {
      const exported = await exportRemoteBlogsToObsidian(client, projectId, project.vault_path);
      return {
        mode,
        mirrored: 0,
        indexed: 0,
        exported: exported.exported,
        indexPath: exported.indexPath,
      };
    }

    const fetched = await fetchBlogs(client, mode);
    const mirrored = await upsertRemoteBlogs(client, fetched.rows, fetched.columns);
    const indexed = await rebuildLocalIndex(client, projectId, project.vault_path);
    await updateSyncState(client, mode, fetched.rows);
    const exported = await exportRemoteBlogsToObsidian(client, projectId, project.vault_path);
    const latestUpdatedAt = getLatestUpdatedAt(fetched.rows);

    return {
      mode,
      mirrored,
      indexed,
      exported: exported.exported,
      indexPath: exported.indexPath,
      lastRemoteUpdatedAt: latestUpdatedAt ? normalizeTimestamp(latestUpdatedAt) : '',
    };
  });
}

module.exports = {
  backfillRemoteBlog,
  ensureMirrorSchema,
  exportRemoteBlogsToObsidian,
  getProjectContext,
  syncBlogs,
  withClient,
};
