// seomaster/scripts/lib/knowledge.js
const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, '../../knowledge');

/**
 * 读取知识库文件，返回内容字符串
 * @param {string} filename - knowledge/ 下的文件名
 * @returns {string} 文件内容，不存在返回空字符串
 */
function readKnowledge(filename) {
  const filePath = path.join(KNOWLEDGE_DIR, filename);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * 读取所有知识库文件，返回拼接后的上下文（带截断）
 * @param {string[]} files - 要读取的文件名列表
 * @param {number} maxChars - 最大字符数（默认 20000）
 * @returns {string} 拼接后的知识库内容
 */
function loadKnowledgeContext(files, maxChars = 20000) {
  const parts = [];
  let totalChars = 0;

  for (const file of files) {
    const content = readKnowledge(file);
    if (!content) continue;

    if (totalChars + content.length > maxChars) {
      // 截断到剩余空间
      const remaining = maxChars - totalChars;
      if (remaining > 500) {
        parts.push(`=== ${file} (truncated) ===\n${content.slice(0, remaining)}\n[...]`);
      }
      break;
    }

    parts.push(`=== ${file} ===\n${content}`);
    totalChars += content.length;
  }

  return parts.join('\n\n');
}

/**
 * 为 generate-concept 准备知识库上下文
 * 优先: 产品 + 竞品 + 关键词
 */
function loadConceptKnowledge() {
  return loadKnowledgeContext([
    'product.md',
    'competitors.md',
    'target_keywords.md',
    'published_articles.md',
  ], 15000);
}

/**
 * 为 generate-draft 准备知识库上下文
 * 优先: 产品 + 定价 + benchmark + 竞品
 */
function loadDraftKnowledge() {
  return loadKnowledgeContext([
    'product.md',
    'models_pricing.md',
    'benchmarks.md',
    'competitors.md',
  ], 15000);
}

/**
 * 列出知识库中所有文件
 */
function listKnowledgeFiles() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) return [];
  return fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
}

module.exports = {
  readKnowledge,
  loadKnowledgeContext,
  loadConceptKnowledge,
  loadDraftKnowledge,
  listKnowledgeFiles,
  KNOWLEDGE_DIR,
};
