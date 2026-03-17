// seomaster/scripts/lib/vault-writer.js

const fs = require('fs');
const path = require('path');
const { writeMarkdownDocument } = require('./frontmatter');

function getBucketDirectory(vaultPath, subDir, date = new Date()) {
  const rootDir = path.join(vaultPath, subDir);
  fs.mkdirSync(rootDir, { recursive: true });

  const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const bucketDir = path.join(rootDir, yearMonth);
  fs.mkdirSync(bucketDir, { recursive: true });
  return bucketDir;
}

function buildArticleFrontMatter(metadata, subDir, date) {
  const isPublished = subDir === 'Published';

  return {
    type: 'article',
    project: metadata.project || 'unknown',
    topic_key: metadata.topic_key || '',
    article_id: metadata.article_id || metadata.slug || '',
    status: metadata.status || (isPublished ? 'published' : 'draft'),
    lang: metadata.lang || 'en',
    keyword: metadata.keyword || '',
    slug: metadata.slug || '',
    intent: metadata.intent || '',
    cluster: metadata.cluster || '',
    canonical: metadata.canonical !== undefined ? metadata.canonical : isPublished,
    published_url: metadata.published_url || '',
    cms_target: metadata.cms_target || '',
    cms_post_id: metadata.cms_post_id || '',
    content_hash: metadata.content_hash || '',
    summary_hash: metadata.summary_hash || '',
    source_of_truth: 'vault',
    created_at: metadata.created_at || date.toISOString().split('T')[0],
    updated_at: metadata.updated_at || date.toISOString().split('T')[0],
    published_at: metadata.published_at || (isPublished ? date.toISOString().split('T')[0] : ''),
    duplicate_of: metadata.duplicate_of || '',
    supersedes: metadata.supersedes || '',
    review_status: metadata.review_status || (isPublished ? 'approved' : 'pending'),
    quality_score: metadata.quality_score || '',
    word_count: metadata.word_count || '',
  };
}

/**
 * 将生成的文章保存到 Obsidian vault
 * @param {string} draftContent - 文章内容
 * @param {object} metadata - 元数据
 * @param {string} vaultPath - Obsidian vault 路径
 * @param {string} subDir - 子目录名称（默认：Drafts）
 * @returns {string} 保存的文件路径
 */
function saveToVault(draftContent, metadata, vaultPath, subDir = 'Drafts', dateOverride = null) {
  if (!vaultPath || !fs.existsSync(vaultPath)) {
    throw new Error(`Vault path does not exist: ${vaultPath}`);
  }

  const date = dateOverride ? new Date(dateOverride) : new Date();
  const monthDir = getBucketDirectory(vaultPath, subDir, date);
  const frontMatter = buildArticleFrontMatter(metadata, subDir, date);

  // 保存文件
  const filename = `${metadata.slug}.md`;
  const filepath = path.join(monthDir, filename);
  writeMarkdownDocument(filepath, frontMatter, draftContent);

  return filepath;
}

/**
 * 检查是否应该保存到 vault
 * @param {object} project - 项目配置
 * @returns {boolean}
 */
function shouldSaveToVault(project) {
  return project && project.vault_path && project.save_to_vault !== false;
}

module.exports = {
  buildArticleFrontMatter,
  saveToVault,
  shouldSaveToVault,
};
