const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');
const { loadProjects } = require('./project-manager');
const { loadProjectConfig } = require('./project-config');
const { buildArticleIndex, saveArticleIndex, slugify } = require('./article-index');
const { ensureTopicCard, ensureVaultStructure, getTopicPath } = require('./topic-manager');
const { readMarkdownDocument, writeMarkdownDocument } = require('./frontmatter');
const { saveToVault } = require('./vault-writer');
const { getLocalMirrorDsn } = require('./db-config');
const { backfillRemoteBlog, ensureMirrorSchema, withClient, syncBlogs } = require('./blog-sync');
const { publishArticle: publishToNewApi } = require('./publishers/new-api');

const LOCAL_NEW_API_BASE_URL = 'http://127.0.0.1:4000';

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

function normalizeNewlines(value) {
  return String(value || '').replace(/\r\n/g, '\n');
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function stripBlogSuffix(value) {
  const trimmed = trimTrailingSlash(value);
  return trimmed.replace(/\/blog$/i, '');
}

function isLocalUrl(value) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(String(value || ''));
}

function toDateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function hashText(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf-8').digest('hex');
}

function generateJobId(articleId) {
  return `${articleId || 'publish'}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function getMarkdownTitle(content, metadata, fallbackSlug) {
  if (metadata.title) return String(metadata.title).trim();
  const match = normalizeNewlines(content).match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return String(fallbackSlug || 'untitled')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractSummary(content, metadata) {
  if (metadata.summary) return String(metadata.summary).trim();

  const body = normalizeNewlines(content)
    .replace(/^#\s+.+$/m, '')
    .trim();

  const paragraphs = body.split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    const candidate = paragraph.trim();
    if (!candidate) continue;
    if (/^(#|```|>|- |\* |\|)/.test(candidate)) continue;
    return candidate.length > 200 ? `${candidate.slice(0, 197).trim()}...` : candidate;
  }

  return '';
}

function inferTag(metadata, slug, title) {
  if (metadata.tag) return String(metadata.tag).trim();
  const text = `${slug} ${title}`.toLowerCase();
  if (/\b(vs|versus|comparison|compare|alternative|alternatives)\b/.test(text)) {
    return 'Comparison';
  }
  return 'Tutorial';
}

function resolveMarkdownInput(input, project, projectId) {
  const candidates = [];

  if (input) {
    candidates.push(input);
    candidates.push(path.join(process.cwd(), input));
    candidates.push(path.join(process.cwd(), 'output', input));
    candidates.push(path.join(process.cwd(), 'output', `${input}-draft.md`));
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  const index = buildArticleIndex(project.vault_path, projectId);
  const normalizedInput = String(input || '').trim().toLowerCase();
  const matchedArticle = index.articles.find((article) => {
    return (
      article.article_id.toLowerCase() === normalizedInput ||
      article.slug.toLowerCase() === normalizedInput ||
      article.relative_path.toLowerCase() === normalizedInput ||
      path.basename(article.path).toLowerCase() === normalizedInput
    );
  });

  if (matchedArticle) {
    return matchedArticle.path;
  }

  throw new Error(`Article not found: ${input}`);
}

function buildArticlePayload(filePath, projectId) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { metadata, content } = readMarkdownDocument(filePath);
  const baseName = path.basename(filePath, '.md').replace(/-draft$/, '');
  const slug = metadata.slug || slugify(baseName);
  const title = getMarkdownTitle(content || raw, metadata, slug);
  const articleId = metadata.article_id || `${projectId}-${metadata.lang || metadata.language || 'en'}-${slug}`;
  const keyword = metadata.keyword || title;
  const topicKey = metadata.topic_key || slugify(keyword);
  const summary = extractSummary(content || raw, metadata);

  return {
    filePath,
    metadata,
    content: content || raw,
    projectId,
    articleId,
    topicKey,
    slug,
    title,
    keyword,
    summary,
    language: metadata.lang || metadata.language || 'en',
    tag: inferTag(metadata, slug, title),
    contentType: metadata.content_type || 'markdown',
    coverImageUrl: metadata.cover_image_url || '',
    sortOrder: metadata.sort_order || 0,
    cmsPostId: metadata.cms_post_id || '',
    remoteBlogId: metadata.remote_blog_id || '',
  };
}

async function loadAdminCredentialsFromDatabase() {
  const connectionString = getLocalMirrorDsn();
  if (!connectionString) {
    return null;
  }

  let client = null;
  try {
    client = new Client({ connectionString });
    await client.connect();
    const result = await client.query(`
      SELECT id, access_token
      FROM users
      WHERE role = 100 AND access_token IS NOT NULL AND access_token <> ''
      ORDER BY id ASC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      userId: String(result.rows[0].id),
      token: result.rows[0].access_token,
    };
  } catch (error) {
    return null;
  } finally {
    if (client) {
      await client.end().catch(() => {});
    }
  }
}

async function resolvePublishConfig(projectConfig, overrides = {}) {
  const envBaseUrl = process.env.NEW_API_BLOG_BASE_URL || process.env.API_BASE_URL || '';
  const baseUrl = stripBlogSuffix(
    overrides.baseUrl ||
      envBaseUrl ||
      projectConfig?.publish_config?.base_url ||
      projectConfig?.project?.website ||
      stripBlogSuffix(projectConfig?.channels?.blog?.base_url || '') ||
      LOCAL_NEW_API_BASE_URL
  );

  let token = overrides.token || process.env.NEW_API_BLOG_TOKEN || process.env.ADMIN_TOKEN || '';
  let userId = overrides.userId || process.env.NEW_API_BLOG_USER_ID || process.env.ADMIN_USER_ID || '';

  if (!token || !userId) {
    const dbCredentials = await loadAdminCredentialsFromDatabase();
    if (dbCredentials) {
      token = token || dbCredentials.token;
      userId = userId || dbCredentials.userId;
    }
  }

  if (!token || !userId) {
    throw new Error('Missing publish credentials. Set NEW_API_BLOG_TOKEN/NEW_API_BLOG_USER_ID or ADMIN_TOKEN/ADMIN_USER_ID.');
  }

  let blogBaseUrl =
    overrides.blogBaseUrl ||
    process.env.NEW_API_BLOG_PUBLIC_BASE_URL ||
    projectConfig?.publish_config?.blog_base_url ||
    projectConfig?.channels?.blog?.base_url ||
    '';
  if (!blogBaseUrl) {
    if (isLocalUrl(baseUrl)) {
      blogBaseUrl = `${trimTrailingSlash(baseUrl)}/blog`;
    } else {
      blogBaseUrl = `${trimTrailingSlash(baseUrl)}/blog`;
    }
  }

  return {
    baseUrl,
    blogBaseUrl: trimTrailingSlash(blogBaseUrl),
    token,
    userId,
  };
}

async function createPublishJob(jobId, article, target) {
  const dsn = getLocalMirrorDsn();
  if (!dsn) return false;

  try {
    await withClient(async (client) => {
      await ensureMirrorSchema(client);
      await client.query(`
        INSERT INTO blog_publish_jobs (
          job_id,
          article_id,
          target,
          status,
          response,
          retry_count,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5::jsonb, 0, NOW(), NOW())
        ON CONFLICT (job_id) DO UPDATE SET
          article_id = EXCLUDED.article_id,
          target = EXCLUDED.target,
          status = EXCLUDED.status,
          response = EXCLUDED.response,
          updated_at = NOW()
      `, [
        jobId,
        article.articleId,
        target,
        'publishing',
        JSON.stringify({
          source_path: article.filePath,
          slug: article.slug,
        }),
      ]);
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function updatePublishJob(jobId, status, response, retryCount = null) {
  const dsn = getLocalMirrorDsn();
  if (!dsn) return false;

  try {
    await withClient(async (client) => {
      await ensureMirrorSchema(client);
      const params = [jobId, status, JSON.stringify(response || {})];
      let text = `
        UPDATE blog_publish_jobs
        SET status = $2,
            response = $3::jsonb,
            updated_at = NOW()
      `;

      if (retryCount !== null) {
        params.push(retryCount);
        text += ', retry_count = $4';
      }

      text += ' WHERE job_id = $1';
      await client.query(text, params);
    });
    return true;
  } catch (error) {
    return false;
  }
}

function updateTopicCard(vaultPath, article, publishedAt, publishedCount) {
  ensureTopicCard(vaultPath, {
    projectId: article.projectId,
    topicKey: article.topicKey,
    keyword: article.keyword,
    intent: article.metadata.intent || 'informational',
    primaryArticleId: article.articleId,
  });

  const topicPath = getTopicPath(vaultPath, article.topicKey);
  const existing = readMarkdownDocument(topicPath);
  const metadata = {
    ...existing.metadata,
    project: article.projectId,
    topic_key: article.topicKey,
    canonical_keyword: existing.metadata.canonical_keyword || article.keyword,
    primary_article_id: existing.metadata.primary_article_id || article.articleId,
    published_count: publishedCount,
    last_published_at: publishedAt,
  };
  writeMarkdownDocument(topicPath, metadata, existing.content);
  return topicPath;
}

async function publishArticle(input, options = {}) {
  const { projectId, project } = getProjectContext(options.project);
  if (!project.vault_path) {
    throw new Error(`Project "${projectId}" does not define vault_path`);
  }

  ensureVaultStructure(project.vault_path);

  const sourcePath = resolveMarkdownInput(input, project, projectId);
  const article = buildArticlePayload(sourcePath, projectId);
  const projectConfig = loadProjectConfig();
  const publishTarget = options.target || article.metadata.publish_target || projectConfig?.publish_target || 'new-api';
  const publishConfig = await resolvePublishConfig(projectConfig, options);
  const jobId = generateJobId(article.articleId);

  await createPublishJob(jobId, article, publishTarget);

  try {
    if (publishTarget !== 'new-api') {
      throw new Error(`Unsupported publish target: ${publishTarget}`);
    }

    const result = await publishToNewApi(article, publishConfig);
    const blog = result.blog || {};
    const publishedAt = toDateOnly(blog.published_at) || toDateOnly(new Date());
    const updatedAt = toDateOnly(blog.updated_at) || publishedAt;
    const publishedPath = saveToVault(article.content, {
      ...article.metadata,
      project: projectId,
      topic_key: article.topicKey,
      article_id: article.articleId,
      status: 'published',
      lang: article.language,
      keyword: article.keyword,
      slug: blog.slug || article.slug,
      canonical: true,
      published_url: result.published_url,
      cms_target: publishTarget,
      cms_post_id: result.cms_post_id,
      remote_blog_id: result.cms_post_id,
      created_at: toDateOnly(blog.created_at) || publishedAt,
      updated_at: updatedAt,
      published_at: publishedAt,
      review_status: 'approved',
      quality_score: article.metadata.quality_score || '',
      content_hash: hashText(article.content),
      summary_hash: hashText(article.summary),
      cover_image_url: article.coverImageUrl,
      tag: article.tag,
    }, project.vault_path, 'Published', blog.published_at || new Date());

    const index = buildArticleIndex(project.vault_path, projectId);
    const publishedCount = index.articles.filter((item) => item.bucket === 'Published' && item.topic_key === article.topicKey).length;
    const topicPath = updateTopicCard(project.vault_path, article, publishedAt, publishedCount);
    const indexPath = saveArticleIndex(buildArticleIndex(project.vault_path, projectId));

    let syncResult = null;
    if (!options.skipSync) {
      try {
        syncResult = await backfillRemoteBlog(blog, {
          project: projectId,
          articleId: article.articleId,
          topicKey: article.topicKey,
          keyword: article.keyword,
        });
      } catch (error) {
        try {
          syncResult = await syncBlogs('incremental', { project: projectId });
        } catch (syncError) {
          syncResult = {
            error: `${error.message}; fallback incremental sync failed: ${syncError.message}`,
          };
        }
      }
    }

    const response = {
      job_id: jobId,
      article_id: article.articleId,
      cms_post_id: result.cms_post_id,
      published_url: result.published_url,
      published_at: publishedAt,
      published_path: publishedPath,
      topic_path: topicPath,
      index_path: indexPath,
      sync: syncResult,
      source_path: sourcePath,
      steps: result.steps,
    };

    await updatePublishJob(jobId, 'published', response);

    return response;
  } catch (error) {
    const response = {
      message: error.message,
      source_path: sourcePath,
    };
    await updatePublishJob(jobId, 'failed', response, 1);
    throw error;
  }
}

module.exports = {
  publishArticle,
};
