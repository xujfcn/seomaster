// seomaster/scripts/lib/vault-writer.js

const fs = require('fs');
const path = require('path');

/**
 * 将生成的文章保存到 Obsidian vault
 * @param {string} draftContent - 文章内容
 * @param {object} metadata - 元数据 { keyword, slug, word_count, quality_score }
 * @param {string} vaultPath - Obsidian vault 路径
 * @param {string} subDir - 子目录名称（默认：Published）
 * @returns {string} 保存的文件路径
 */
function saveToVault(draftContent, metadata, vaultPath, subDir = 'Published') {
  if (!vaultPath || !fs.existsSync(vaultPath)) {
    throw new Error(`Vault path does not exist: ${vaultPath}`);
  }

  // 创建 Published 目录
  const publishedDir = path.join(vaultPath, subDir);
  if (!fs.existsSync(publishedDir)) {
    fs.mkdirSync(publishedDir, { recursive: true });
  }

  // 按月份组织
  const date = new Date();
  const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthDir = path.join(publishedDir, yearMonth);

  if (!fs.existsSync(monthDir)) {
    fs.mkdirSync(monthDir, { recursive: true });
  }

  // 添加 YAML Front Matter
  const frontMatter = `---
type: published
status: draft
created: ${date.toISOString().split('T')[0]}
keyword: ${metadata.keyword || 'N/A'}
slug: ${metadata.slug || 'N/A'}
word_count: ${metadata.word_count || 'N/A'}
quality_score: ${metadata.quality_score || 'N/A'}
source: SEOMaster
---

`;

  const fullContent = frontMatter + draftContent;

  // 保存文件
  const filename = `${metadata.slug}.md`;
  const filepath = path.join(monthDir, filename);

  fs.writeFileSync(filepath, fullContent, 'utf-8');

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
  saveToVault,
  shouldSaveToVault,
};
