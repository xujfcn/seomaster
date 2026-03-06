#!/usr/bin/env node

/**
 * SEOMaster 完整工作流
 * 从概念到发布的自动化流程
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function runStep(command, description) {
  console.log(`\n📍 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✓ ${description} 完成`);
    return true;
  } catch (error) {
    console.error(`✗ ${description} 失败`);
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  
  if (!args.topic) {
    console.error('Usage: node scripts/workflow.js --topic "your topic"');
    console.error('\nOptions:');
    console.error('  --skip-concept    跳过概念生成');
    console.error('  --skip-research   跳过研究阶段');
    console.error('  --skip-draft      跳过草稿生成');
    console.error('  --skip-images     跳过配图生成');
    console.error('  --skip-review     跳过质量检查');
    process.exit(1);
  }
  
  const topic = args.topic;
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const outputDir = path.join(__dirname, '../output');
  
  console.log('\n🚀 SEOMaster 工作流启动\n');
  console.log(`  主题: ${topic}`);
  console.log(`  输出: ${outputDir}\n`);
  
  // 1. 生成概念
  if (!args['skip-concept']) {
    const success = runStep(
      `node scripts/generate-concept.js --topic "${topic}"`,
      '生成文章概念'
    );
    if (!success) process.exit(1);
  }
  
  // 2. 生成草稿
  if (!args['skip-draft']) {
    const conceptFile = path.join(outputDir, `${slug}-concept.yaml`);
    const success = runStep(
      `node scripts/generate-draft.js --concept "${conceptFile}"`,
      '生成文章草稿'
    );
    if (!success) process.exit(1);
  }
  
  // 3. 生成配图（最多3张）
  if (!args['skip-images']) {
    const draftFile = path.join(outputDir, `${slug}-draft.md`);
    if (fs.existsSync(draftFile)) {
      runStep(
        `node scripts/generate-images.js --draft "${draftFile}"`,
        '生成配图（最多3张）'
      );
    }
  }
  
  // 4. 质量检查
  if (!args['skip-review']) {
    const draftFile = path.join(outputDir, `${slug}-draft.md`);
    if (fs.existsSync(draftFile)) {
      runStep(
        `node scripts/quality-check.js --draft "${draftFile}"`,
        '质量检查'
      );
    }
  }
  
  // 5. SEO 审查
  const draftFile = path.join(outputDir, `${slug}-draft.md`);
  if (fs.existsSync(draftFile)) {
    runStep(
      `node scripts/seo-review.js --draft "${draftFile}"`,
      'SEO 审查'
    );
  }
  
  console.log('\n✅ 工作流完成！\n');
  console.log(`  草稿文件: ${draftFile}`);
  console.log(`  下一步: 人工审核并发布\n`);
}

main().catch(err => {
  console.error('\n❌ 工作流错误:', err.message);
  process.exit(1);
});
