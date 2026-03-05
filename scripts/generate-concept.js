#!/usr/bin/env node

/**
 * Generate Article Concept from Keyword
 *
 * Usage:
 *   node scripts/generate-concept.js --keyword "openrouter alternative" [options]
 *
 * Options:
 *   --keyword   目标关键词（必填）
 *   --slug      文章 slug（选填，默认从 keyword 生成）
 *   --lang      语言 en|zh（默认 en）
 *   --market    市场 us|cn 等（默认 us）
 *   --results   抓取竞品数量（默认 10，最多 10）
 *   --out       输出目录（默认 articles/blog）
 */

const path = require('path');
const fs = require('fs');
const { searchGoogle } = require('./lib/google-search');
const { scrapeOutlines } = require('./lib/outline-scraper');
const { generateOutline } = require('./lib/ai-outline-generator');
const { writeConceptYaml, writeResearchJson } = require('./lib/concept-writer');
const { listKnowledgeFiles } = require('./lib/knowledge');

// 解析命令行参数
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

function keywordToSlug(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.keyword) {
    console.error('Usage: node scripts/generate-concept.js --keyword "your keyword"');
    process.exit(1);
  }

  const keyword = args.keyword.trim();
  const slug = args.slug || keywordToSlug(keyword);
  const lang = args.lang || 'en';
  const market = args.market || 'us';
  const maxResults = Math.min(parseInt(args.results) || 10, 10);
  const outputDir = args.out
    ? path.resolve(process.cwd(), args.out)
    : path.resolve(process.cwd(), 'articles/blog');

  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n🔍 SEOMaster: Generating concept for keyword "${keyword}"\n`);
  console.log(`  slug:    ${slug}`);
  console.log(`  lang:    ${lang}`);
  console.log(`  market:  ${market}`);
  console.log(`  output:  ${outputDir}`);

  // 显示知识库状态
  const knowledgeFiles = listKnowledgeFiles();
  if (knowledgeFiles.length > 0) {
    console.log(`  📚 knowledge: ${knowledgeFiles.length} files (${knowledgeFiles.join(', ')})`);
  } else {
    console.log(`  ⚠️  knowledge: empty (run init-project.js or add files to knowledge/)`);
  }
  console.log('');

  // Step 1: Google Search
  console.log(`[1/4] Searching Google for top ${maxResults} results...`);
  const searchResults = await searchGoogle(keyword, { lang, market, maxResults });
  console.log(`  Found ${searchResults.length} results\n`);

  // Step 2: 抓取大纲
  console.log(`[2/4] Scraping H1-H4 outlines from ${searchResults.length} articles...`);
  const outlineData = await scrapeOutlines(searchResults);
  const successCount = outlineData.filter((o) => !o.error).length;
  console.log(`  Scraped ${successCount}/${searchResults.length} articles successfully\n`);

  if (successCount === 0) {
    throw new Error('Failed to scrape any articles. All URLs may be behind a paywall or blocking scraping.');
  }
  if (successCount < 3) {
    console.warn(`  ⚠️  Warning: Only ${successCount} articles scraped successfully. AI outline quality may be reduced.\n`);
  }

  // 保存原始数据
  const researchPath = writeResearchJson(slug, keyword, searchResults, outlineData, outputDir);
  console.log(`  Research data saved: ${researchPath}\n`);

  // Step 3: AI 生成大纲
  console.log(`[3/4] Generating optimized outline with AI...`);
  const outline = await generateOutline(keyword, outlineData, { lang, maxWords: 15000 });
  console.log(`  Generated ${outline.sections?.length || 0} sections\n`);

  // Step 4: 写入 YAML
  console.log(`[4/4] Writing article-concept.yaml...`);
  const conceptPath = writeConceptYaml(slug, keyword, outline, outlineData, outputDir);
  console.log(`  Concept saved: ${conceptPath}\n`);

  // 输出摘要
  console.log('─'.repeat(60));
  console.log(`✅ Concept generated successfully!\n`);
  console.log(`📄 Files created:`);
  console.log(`   ${researchPath}`);
  console.log(`   ${conceptPath}\n`);
  console.log(`📋 Next steps:`);
  console.log(`   1. Review ${path.basename(conceptPath)}`);
  console.log(`   2. Fill in the thesis.final field`);
  console.log(`   3. Add data evidence for each section`);
  console.log(`   4. Run: node scripts/generate-draft.js --concept ${conceptPath}`);
  console.log('─'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
