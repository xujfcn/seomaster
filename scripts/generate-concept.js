#!/usr/bin/env node

/**
 * Generate Article Concept from Keyword
 *
 * Usage:
 *   node scripts/generate-concept.js --keyword "openrouter alternative" [options]
 *
 * Options:
 *   --keyword         目标关键词（必填）
 *   --slug            文章 slug（选填，默认从 keyword 生成）
 *   --lang            语言 en|zh（默认 en）
 *   --market          市场 us|cn 等（默认 us）
 *   --results         抓取竞品数量（默认 10，最多 10）
 *   --out             输出目录（默认 articles/blog）
 *   --no-filter       禁用域名过滤（默认启用，会过滤 reddit/quora 等论坛）
 */

const path = require('path');
const fs = require('fs');
const { searchGoogle } = require('./lib/google-search');
const { scrapeOutlines } = require('./lib/outline-scraper');
const { generateOutline } = require('./lib/ai-outline-generator');
const { writeConceptYaml, writeResearchJson } = require('./lib/concept-writer');
const { listKnowledgeFiles, setKnowledgeBasePath } = require('./lib/knowledge');
const { saveResearchToVault } = require('./lib/research-saver');
const { getCurrentProject } = require('./lib/project-manager');
const { checkKnowledgeBase } = require('./lib/knowledge-checker');
const { parseArgs } = require('./lib/parse-args');

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
  const intent = (typeof args.intent === 'string') ? args.intent : 'informational';
  const scene = (typeof args.scene === 'string') ? args.scene : '';
  const scenes = scene ? scene.split(',').filter(Boolean) : [];
  const maxResults = Math.min(parseInt(args.results) || 10, 10);
  const maxWords = parseInt(args.words) || 2500;
  const filterDomains = args['no-filter'] !== true; // 默认启用过滤
  const SEOMASTER_ROOT = path.join(__dirname, '..');
  const outputDir = args.out
    ? path.resolve(process.cwd(), args.out)
    : path.join(SEOMASTER_ROOT, 'output');

  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n🔍 SEOMaster: Generating concept for keyword "${keyword}"\n`);
  console.log(`  slug:    ${slug}`);
  console.log(`  intent:  ${intent}`);
  if (scenes.length > 0) console.log(`  scenes:  ${scenes.join(', ')}`);
  console.log(`  lang:    ${lang}`);
  console.log(`  market:  ${market}`);
  console.log(`  filter:  ${filterDomains ? 'enabled (blog-only)' : 'disabled (all sites)'}`);
  console.log(`  output:  ${outputDir}`);

  // 显示知识库状态
  const knowledgeFiles = listKnowledgeFiles();
  if (knowledgeFiles.length > 0) {
    console.log(`  📚 knowledge: ${knowledgeFiles.length} files (${knowledgeFiles.join(', ')})`);
  } else {
    console.log(`  ⚠️  knowledge: empty (run init-project.js or add files to knowledge/)`);
  }
  console.log('');

  // Step 0.5: 检查知识库
  console.log(`[0/4] Checking knowledge base...`);
  const kbCheck = checkKnowledgeBase(keyword);

  if (kbCheck.hasEnoughInfo) {
    console.log(`  ✓ Knowledge base has sufficient information (${kbCheck.stats.knowledgeLength} chars)`);
    console.log(`  ✓ Competitor info: ${kbCheck.stats.hasCompetitorInfo ? 'Yes' : 'No'}`);
    console.log(`  ✓ Pricing info: ${kbCheck.stats.hasPricingInfo ? 'Yes' : 'No'}`);
    console.log(`  ✓ Feature info: ${kbCheck.stats.hasFeatureInfo ? 'Yes' : 'No'}`);
    console.log(`  → Will prioritize knowledge base data over Google search\n`);
  } else {
    console.log(`  ⚠️  Knowledge base has limited information`);
    if (kbCheck.suggestions.length > 0) {
      kbCheck.suggestions.forEach(s => console.log(`     - ${s}`));
    }
    console.log(`  → Will use Google search for competitor research\n`);
  }

  // Step 1: Google Search
  console.log(`[1/4] Searching Google for top ${maxResults} results...`);
  const searchResults = await searchGoogle(keyword, { lang, market, maxResults, filterDomains });
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

  // 保存原始数据到 output/
  const researchPath = writeResearchJson(slug, keyword, searchResults, outlineData, outputDir);
  console.log(`  Research data saved: ${researchPath}\n`);

  // 保存研究数据到 Obsidian vault
  const project = getCurrentProject();
  if (project && project.vault_path) {
    try {
      const vaultResearchPath = saveResearchToVault(keyword, searchResults, outlineData, project.vault_path);
      if (vaultResearchPath) {
        console.log(`  📚 Research saved to vault: ${path.basename(vaultResearchPath)}\n`);
      }
    } catch (err) {
      console.warn(`  ⚠️  Failed to save research to vault: ${err.message}\n`);
    }
  }

  // Step 3: AI 生成大纲
  console.log(`[3/4] Generating optimized outline with AI...`);
  const outline = await generateOutline(keyword, outlineData, { lang, maxWords, intent, scenes });
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
  console.log(`   1. Generate draft: node scripts/generate-draft.js --concept ${conceptPath}`);
  console.log(`   2. Optional review: ${path.basename(conceptPath)}`);
  console.log(`   3. Continue with the automated workflow if needed`);
  console.log('─'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
