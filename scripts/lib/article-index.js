const fs = require('fs');
const path = require('path');
const { readMarkdownDocument } = require('./frontmatter');

const SEOMASTER_ROOT = path.join(__dirname, '../..');
const INDEX_DIR = path.join(SEOMASTER_ROOT, 'data', 'indexes');
const ARTICLE_DIRS = ['Drafts', 'Published'];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function ensureIndexDir() {
  fs.mkdirSync(INDEX_DIR, { recursive: true });
}

function getIndexPath(projectId) {
  ensureIndexDir();
  return path.join(INDEX_DIR, `${projectId}-index.json`);
}

function readRecursiveMarkdown(dir) {
  const results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readRecursiveMarkdown(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

function getArticleTitle(filePath, content, metadata) {
  if (metadata.title) return metadata.title;
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return path.basename(filePath, '.md');
}

function buildTopicRecord(filePath, vaultPath) {
  const { metadata, content } = readMarkdownDocument(filePath);
  const topicKey = metadata.topic_key || slugify(metadata.canonical_keyword || path.basename(filePath, '.md'));
  return {
    type: 'topic',
    path: filePath,
    relative_path: path.relative(vaultPath, filePath),
    topic_key: topicKey,
    canonical_keyword: metadata.canonical_keyword || '',
    status: metadata.status || 'active',
    intent: metadata.intent || '',
    cluster: metadata.cluster || '',
    aliases: Array.isArray(metadata.aliases) ? metadata.aliases : [],
    primary_article_id: metadata.primary_article_id || '',
    last_published_at: metadata.last_published_at || '',
    body_length: content.trim().length,
  };
}

function buildArticleRecord(filePath, vaultPath, bucket) {
  const { metadata, content } = readMarkdownDocument(filePath);
  const slug = metadata.slug || slugify(path.basename(filePath, '.md'));
  return {
    type: 'article',
    bucket,
    path: filePath,
    relative_path: path.relative(vaultPath, filePath),
    article_id: metadata.article_id || '',
    topic_key: metadata.topic_key || '',
    status: metadata.status || (bucket === 'Published' ? 'published' : 'draft'),
    review_status: metadata.review_status || '',
    lang: metadata.lang || '',
    keyword: metadata.keyword || '',
    slug,
    title: getArticleTitle(filePath, content, metadata),
    published_url: metadata.published_url || '',
    quality_score: metadata.quality_score || '',
    updated_at: metadata.updated_at || metadata.published_at || metadata.created_at || '',
    content_hash: metadata.content_hash || '',
  };
}

function buildArticleIndex(vaultPath, projectId) {
  const topicsDir = path.join(vaultPath, 'Topics');
  const topicFiles = readRecursiveMarkdown(topicsDir);
  const topics = topicFiles.map((filePath) => buildTopicRecord(filePath, vaultPath));

  const articles = [];
  for (const bucket of ARTICLE_DIRS) {
    const bucketDir = path.join(vaultPath, bucket);
    const files = readRecursiveMarkdown(bucketDir);
    for (const filePath of files) {
      articles.push(buildArticleRecord(filePath, vaultPath, bucket));
    }
  }

  const index = {
    project_id: projectId,
    vault_path: vaultPath,
    generated_at: new Date().toISOString(),
    stats: {
      topic_count: topics.length,
      article_count: articles.length,
      draft_count: articles.filter((item) => item.bucket === 'Drafts').length,
      published_count: articles.filter((item) => item.bucket === 'Published').length,
    },
    topics,
    articles,
  };

  return index;
}

function saveArticleIndex(index) {
  const indexPath = getIndexPath(index.project_id);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  return indexPath;
}

function loadArticleIndex(projectId) {
  const indexPath = getIndexPath(projectId);
  if (!fs.existsSync(indexPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
}

function findArticlesByTopic(index, topicKey) {
  return (index?.articles || []).filter((article) => normalizeText(article.topic_key) === normalizeText(topicKey));
}

module.exports = {
  buildArticleIndex,
  findArticlesByTopic,
  getIndexPath,
  loadArticleIndex,
  normalizeText,
  saveArticleIndex,
  slugify,
};
