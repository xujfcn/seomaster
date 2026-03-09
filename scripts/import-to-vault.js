#!/usr/bin/env node

/**
 * Import article to Obsidian vault
 *
 * Usage:
 *   node scripts/import-to-vault.js --draft <draft-file.md>
 *   node scripts/import-to-vault.js --draft output/keyword-draft.md --dir Published
 */

const fs = require('fs');
const path = require('path');
const { saveToVault } = require('./lib/vault-writer');
const { getCurrentProject } = require('./lib/project-manager');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] || true;
      i++;
    }
  }
  return args;
}

function extractMetadata(draftPath) {
  const filename = path.basename(draftPath, '-draft.md');
  const content = fs.readFileSync(draftPath, 'utf-8');

  // 尝试从文件名提取 slug
  const slug = filename;

  // 尝试从内容提取关键词（第一个 # 标题）
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const keyword = titleMatch ? titleMatch[1] : slug;

  // 计算字数
  const wordCount = content.split(/\s+/).length;

  return {
    slug,
    keyword,
    word_count: wordCount,
    quality_score: 'N/A',
  };
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.draft) {
    console.error('Usage: node scripts/import-to-vault.js --draft <draft-file.md>');
    console.error('');
    console.error('Options:');
    console.error('  --draft <file>    Draft file to import (required)');
    console.error('  --dir <name>      Vault subdirectory (default: Published)');
    console.error('');
    console.error('Example:');
    console.error('  node scripts/import-to-vault.js --draft output/keyword-draft.md');
    process.exit(1);
  }

  const draftPath = args.draft;

  if (!fs.existsSync(draftPath)) {
    console.error(`Error: File not found: ${draftPath}`);
    process.exit(1);
  }

  // 获取当前项目
  const project = getCurrentProject();

  if (!project) {
    console.error('Error: No current project. Run "seomaster project" to select a project.');
    process.exit(1);
  }

  if (!project.vault_path) {
    console.error(`Error: Project "${project.name}" does not have a vault_path configured.`);
    process.exit(1);
  }

  console.log('\n📚 SEOMaster: Import to Vault\n');
  console.log(`  Project: ${project.name}`);
  console.log(`  Vault: ${project.vault_path}`);
  console.log(`  Draft: ${draftPath}\n`);

  // 读取文章内容
  const content = fs.readFileSync(draftPath, 'utf-8');

  // 提取元数据
  const metadata = extractMetadata(draftPath);

  console.log(`  Keyword: ${metadata.keyword}`);
  console.log(`  Slug: ${metadata.slug}`);
  console.log(`  Word count: ${metadata.word_count}\n`);

  // 保存到 vault
  const subDir = args.dir || 'Published';

  try {
    const savedPath = saveToVault(content, metadata, project.vault_path, subDir);
    console.log(`✅ Saved to vault: ${savedPath}\n`);
    console.log('You can now view and edit this article in Obsidian.\n');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
