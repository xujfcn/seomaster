// seomaster/scripts/lib/knowledge.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// 支持两种知识库模式
const LEGACY_KNOWLEDGE_DIR = path.join(__dirname, '../../knowledge');
let OBSIDIAN_VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH;

/**
 * Set knowledge base path dynamically (for multi-project support)
 */
function setKnowledgeBasePath(vaultPath) {
  OBSIDIAN_VAULT_PATH = vaultPath;
}

/**
 * Get current knowledge base path
 */
function getKnowledgeBasePath() {
  return OBSIDIAN_VAULT_PATH;
}

/**
 * 解析 YAML Front Matter
 * @param {string} content - 文件内容
 * @returns {object} { metadata, content }
 */
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const yamlContent = match[1];
  const mainContent = match[2];

  // 简单的 YAML 解析（仅支持基本格式）
  const metadata = {};
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // 处理数组格式 [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim());
    }
    // 处理布尔值
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;

    metadata[key] = value;
  }

  return { metadata, content: mainContent };
}

/**
 * 递归读取目录下所有 .md 文件
 * @param {string} dir - 目录路径
 * @returns {Array} 文件信息数组 [{ path, relativePath, metadata, content }]
 */
function readAllMarkdownFiles(dir, baseDir = dir) {
  const files = [];

  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip Templates directory and .obsidian directory
    if (entry.isDirectory() && (entry.name === 'Templates' || entry.name === '.obsidian')) {
      continue;
    }

    if (entry.isDirectory()) {
      // 递归读取子目录
      files.push(...readAllMarkdownFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md' && entry.name !== 'GUIDE.md') {
      // 读取 markdown 文件（排除 README 和 GUIDE）
      const content = fs.readFileSync(fullPath, 'utf-8');
      const { metadata, content: mainContent } = parseFrontMatter(content);
      const relativePath = path.relative(baseDir, fullPath);

      files.push({
        path: fullPath,
        relativePath,
        filename: entry.name,
        metadata,
        content: mainContent,
      });
    }
  }

  return files;
}

/**
 * 根据关键词匹配文件
 * @param {Array} files - 文件列表
 * @param {string} keyword - 关键词
 * @returns {Array} 匹配的文件列表（按优先级排序）
 */
function matchFilesByKeyword(files, keyword) {
  const matched = [];
  const keywordLower = keyword.toLowerCase();

  for (const file of files) {
    const { metadata } = file;

    // 检查是否总是加载
    if (metadata.always_load === true) {
      matched.push({ ...file, score: 1000 }); // 最高优先级
      continue;
    }

    // 检查关键词匹配
    if (metadata.keywords && Array.isArray(metadata.keywords)) {
      const hasMatch = metadata.keywords.some(kw => {
        const kwLower = kw.toLowerCase();
        return keywordLower.includes(kwLower) || kwLower.includes(keywordLower);
      });

      if (hasMatch) {
        // 计算优先级分数
        const priorityScores = {
          critical: 100,
          high: 80,
          medium: 50,
          low: 20,
        };
        const score = priorityScores[metadata.priority] || 50;
        matched.push({ ...file, score });
      }
    }
  }

  // 按分数降序排序
  matched.sort((a, b) => b.score - a.score);

  return matched;
}

/**
 * 从 Obsidian vault 加载知识库
 * @param {string} keyword - 关键词（用于匹配）
 * @param {number} maxChars - 最大字符数
 * @returns {string} 拼接后的知识库内容
 */
function loadObsidianKnowledge(keyword, maxChars = 15000) {
  if (!OBSIDIAN_VAULT_PATH) {
    console.warn('⚠️  OBSIDIAN_VAULT_PATH not set, using legacy knowledge base');
    return loadLegacyKnowledge();
  }

  // 读取所有文件
  const allFiles = readAllMarkdownFiles(OBSIDIAN_VAULT_PATH);

  // 匹配关键词
  const matchedFiles = matchFilesByKeyword(allFiles, keyword);

  // 拼接内容
  const parts = [];
  let totalChars = 0;
  const loadedFiles = [];

  for (const file of matchedFiles) {
    const fileContent = `=== ${file.relativePath} ===\n${file.content}`;

    if (totalChars + fileContent.length > maxChars) {
      // 截断到剩余空间
      const remaining = maxChars - totalChars;
      if (remaining > 500) {
        parts.push(fileContent.slice(0, remaining) + '\n[...]');
        loadedFiles.push(file.filename);
      }
      break;
    }

    parts.push(fileContent);
    totalChars += fileContent.length;
    loadedFiles.push(file.filename);
  }

  console.log(`📚 knowledge: ${loadedFiles.length} files (${loadedFiles.join(', ')})`);

  return parts.join('\n\n');
}

/**
 * 从旧的 knowledge/ 目录加载知识库（向后兼容）
 */
function loadLegacyKnowledge() {
  const files = [
    'product.md',
    'competitors.md',
    'models_pricing.md',
    'benchmarks.md',
  ];

  const parts = [];
  let totalChars = 0;
  const maxChars = 15000;

  for (const file of files) {
    const filePath = path.join(LEGACY_KNOWLEDGE_DIR, file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');

    if (totalChars + content.length > maxChars) {
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
 * 主入口：加载知识库
 * @param {string} keyword - 关键词
 * @param {number} maxChars - 最大字符数
 * @returns {string} 知识库内容
 */
function loadKnowledge(keyword, maxChars = 15000) {
  if (OBSIDIAN_VAULT_PATH && fs.existsSync(OBSIDIAN_VAULT_PATH)) {
    return loadObsidianKnowledge(keyword, maxChars);
  } else {
    return loadLegacyKnowledge();
  }
}

// 向后兼容的函数
function loadConceptKnowledge(keyword = '') {
  return loadKnowledge(keyword, 15000);
}

function loadDraftKnowledge(keyword = '') {
  return loadKnowledge(keyword, 15000);
}

function readKnowledge(filename) {
  const filePath = path.join(LEGACY_KNOWLEDGE_DIR, filename);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

function loadKnowledgeContext(files, maxChars = 20000) {
  const parts = [];
  let totalChars = 0;

  for (const file of files) {
    const content = readKnowledge(file);
    if (!content) continue;

    if (totalChars + content.length > maxChars) {
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

function listKnowledgeFiles() {
  if (!fs.existsSync(LEGACY_KNOWLEDGE_DIR)) return [];
  return fs.readdirSync(LEGACY_KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
}

module.exports = {
  loadKnowledge,
  loadObsidianKnowledge,
  loadConceptKnowledge,
  loadDraftKnowledge,
  readKnowledge,
  loadKnowledgeContext,
  listKnowledgeFiles,
  setKnowledgeBasePath,
  getKnowledgeBasePath,
  KNOWLEDGE_DIR: LEGACY_KNOWLEDGE_DIR,
  OBSIDIAN_VAULT_PATH,
};
