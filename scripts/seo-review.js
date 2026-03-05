#!/usr/bin/env node

/**
 * SEO Article Review - AI 评审脚本
 *
 * 基于 seo_article_writing_sop.md 标准，对生成的文章进行自动评审
 *
 * Usage:
 *   node scripts/seo-review.js --draft output/xxx-draft.md --concept output/xxx-concept.yaml
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const yaml = require('js-yaml');
const config = require('./lib/config');
const { readKnowledge } = require('./lib/knowledge');

const SEOMASTER_ROOT = path.join(__dirname, '..');

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

function resolvePath(p) {
  if (path.isAbsolute(p)) return p;
  return path.resolve(process.cwd(), p);
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.draft) {
    console.log('Usage: node scripts/seo-review.js --draft <draft.md> [--concept <concept.yaml>]');
    process.exit(1);
  }

  const draftPath = resolvePath(args.draft);
  if (!fs.existsSync(draftPath)) {
    console.error(`❌ Draft not found: ${draftPath}`);
    process.exit(1);
  }

  const draft = fs.readFileSync(draftPath, 'utf-8');

  let concept = null;
  if (args.concept) {
    const conceptPath = resolvePath(args.concept);
    if (fs.existsSync(conceptPath)) {
      concept = yaml.load(fs.readFileSync(conceptPath, 'utf-8'));
    }
  }

  // 读取 SOP 标准
  const sopPath = path.join(SEOMASTER_ROOT, 'seo_article_writing_sop.md');
  const sop = fs.existsSync(sopPath) ? fs.readFileSync(sopPath, 'utf-8') : '';

  // 读取产品知识（用于检查产品植入）
  const product = readKnowledge('product.md');
  const published = readKnowledge('published_articles.md');

  console.log('\n📝 SEO Article Review\n');
  console.log(`  draft: ${draftPath}`);
  if (concept) console.log(`  keyword: ${concept.keyword}`);
  console.log('');

  // Step 1: 硬指标检查（本地）
  console.log('[1/3] 硬指标检查...');
  const hardResults = checkHardMetrics(draft, concept);
  printHardResults(hardResults);

  // Step 2: AI 评审（基于 SOP）
  console.log('[2/3] AI SOP 评审...');
  const aiReview = await runAIReview(draft, concept, sop, product, published);
  console.log(aiReview);

  // Step 3: 输出评审报告
  console.log('[3/3] 生成评审报告...');
  const reportPath = draftPath.replace('-draft.md', '-review.md');
  const report = buildReport(hardResults, aiReview, draftPath, concept);
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n📄 评审报告: ${reportPath}\n`);
}

// ============================================
// 硬指标检查（本地，不需要 AI）
// ============================================
function checkHardMetrics(draft, concept) {
  const results = [];

  // 1. 禁用词
  const forbiddenWords = [
    '本文', '值得注意', '不难发现', '综上所述', '不言而喻',
    '揭示了', '佐证了', '让我们', '接下来', '此外',
    '至关重要', '深入探讨', '颠覆性', '革命性', '赋能',
    '首先', '其次', '最后', '无缝对接', '一站式',
  ];
  const foundForbidden = [];
  forbiddenWords.forEach(w => {
    const count = (draft.match(new RegExp(w, 'g')) || []).length;
    if (count > 0) foundForbidden.push({ word: w, count });
  });
  results.push({
    name: '禁用词',
    pass: foundForbidden.length === 0,
    detail: foundForbidden.length === 0 ? '无禁用词' : foundForbidden.map(f => `"${f.word}" x${f.count}`).join(', '),
  });

  // 2. Bold 限制
  const boldCount = (draft.match(/\*\*[^*]+\*\*/g) || []).length;
  results.push({
    name: 'Bold 限制 (≤3)',
    pass: boldCount <= 3,
    detail: `${boldCount} 处`,
  });

  // 3. Em dash 限制
  const emDash = (draft.match(/——/g) || []).length;
  results.push({
    name: 'Em dash 限制 (≤3)',
    pass: emDash <= 3,
    detail: `${emDash} 处`,
  });

  // 4. 标题结构 (exclude code blocks)
  const draftWithoutCode = draft.replace(/```[\s\S]*?```/g, ''); // Remove code blocks
  const h1 = (draftWithoutCode.match(/^# [^#]/mg) || []).length;
  const h2 = (draftWithoutCode.match(/^## /mg) || []).length;
  const h3 = (draftWithoutCode.match(/^### /mg) || []).length;
  results.push({
    name: '标题结构',
    pass: h1 === 1 && h2 >= 3,
    detail: `H1:${h1} H2:${h2} H3:${h3}`,
  });

  // 5. 关键词覆盖
  if (concept?.keyword) {
    const kw = concept.keyword.toLowerCase();
    const titleMatch = draft.split('\n')[0].toLowerCase().includes(kw);
    const bodyCount = (draft.toLowerCase().match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    results.push({
      name: '核心关键词覆盖',
      pass: titleMatch && bodyCount >= 5,
      detail: `标题:${titleMatch ? '✓' : '✗'} 正文:${bodyCount}次`,
    });

    // 次要关键词
    if (concept.keyword_variants?.length) {
      const variantHits = concept.keyword_variants.filter(v =>
        draft.toLowerCase().includes(v.toLowerCase())
      );
      results.push({
        name: '次要关键词覆盖',
        pass: variantHits.length >= Math.ceil(concept.keyword_variants.length * 0.5),
        detail: `${variantHits.length}/${concept.keyword_variants.length} (${variantHits.join(', ') || 'none'})`,
      });
    }
  }

  // 6. FAQ 存在
  const hasFAQ = /^## .*FAQ|^## .*Frequently/mi.test(draft);
  results.push({
    name: 'FAQ 段落',
    pass: hasFAQ,
    detail: hasFAQ ? '有' : '缺失',
  });

  // 7. CTA 存在
  const hasCTA = /\[.+\]\(https?:\/\/.+\)/.test(draft) || /\[.+\]\(.+\)/.test(draft.slice(-500));
  results.push({
    name: 'CTA 链接',
    pass: hasCTA && !/待填写/.test(draft.slice(-500)),
    detail: hasCTA ? (/待填写/.test(draft.slice(-500)) ? '有但未填写' : '有') : '缺失',
  });

  // 8. IMAGE 标记
  const imageCount = (draft.match(/<!-- IMAGE:/g) || []).length;
  results.push({
    name: '配图标记 (≥1)',
    pass: imageCount >= 1,
    detail: `${imageCount} 处`,
  });

  // 9. 内链检查
  const internalLinks = (draft.match(/\[.+?\]\(https?:\/\/(api\.lemondata|lemondata|crazyrouter)/g) || []).length;
  results.push({
    name: '内链 (≥1)',
    pass: internalLinks >= 1,
    detail: `${internalLinks} 条`,
  });

  // 10. 外链检查
  const allLinks = (draft.match(/\[.+?\]\(https?:\/\//g) || []).length;
  const externalLinks = allLinks - internalLinks;
  results.push({
    name: '外链 (≥2)',
    pass: externalLinks >= 2,
    detail: `${externalLinks} 条`,
  });

  // 11. 对比表格
  const hasTable = /\|.+\|.+\|/.test(draft) && /\|[-:]+\|/.test(draft);
  results.push({
    name: '对比表格',
    pass: hasTable,
    detail: hasTable ? '有' : '缺失',
  });

  // 12. [DATA:] 占位符
  const dataPlaceholders = (draft.match(/\[DATA:/g) || []).length;
  results.push({
    name: '[DATA:] 占位符已清除',
    pass: dataPlaceholders === 0,
    detail: dataPlaceholders === 0 ? '全部已填' : `剩余 ${dataPlaceholders} 个`,
  });

  // 13. 产品植入
  const hasProduct = /crazyrouter|lemondata/i.test(draft);
  results.push({
    name: '产品植入 (Crazyrouter/LemonData)',
    pass: hasProduct,
    detail: hasProduct ? '有' : '缺失',
  });

  // 14. SEO description
  const hasMeta = /^meta_description:|^description:/m.test(draft) || (concept?.meta_description && concept.meta_description.length > 50);
  results.push({
    name: 'SEO Description',
    pass: hasMeta,
    detail: hasMeta ? '有 (in concept)' : '缺失',
  });

  // 15. 字数
  const chinese = (draft.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (draft.match(/[a-zA-Z]+/g) || []).length;
  const wordCount = chinese + english;
  results.push({
    name: '字数 (1500-15000)',
    pass: wordCount >= 1500 && wordCount <= 15000,
    detail: `${wordCount} words`,
  });

  return results;
}

function printHardResults(results) {
  let passCount = 0;
  results.forEach(r => {
    const icon = r.pass ? '✅' : '❌';
    console.log(`  ${icon} ${r.name}: ${r.detail}`);
    if (r.pass) passCount++;
  });
  console.log(`\n  硬指标: ${passCount}/${results.length} 通过\n`);
}

// ============================================
// AI 评审
// ============================================
async function runAIReview(draft, concept, sop, product, published) {
  const keyword = concept?.keyword || '(unknown)';
  const variants = (concept?.keyword_variants || []).join(', ');

  // 截断 draft 到 15000 字符避免超 token
  const draftTruncated = draft.length > 15000 ? draft.slice(0, 15000) + '\n[... truncated ...]' : draft;

  const prompt = `You are a senior SEO content reviewer. Review the following article draft against the SOP standards.

## Article Info
- Keyword: "${keyword}"
- Keyword variants: ${variants}
- Our product: Crazyrouter (LemonData) — AI API gateway, 300+ models, one key

## SOP Key Requirements (summarized)
1. E-E-A-T: Experience (real usage examples), Expertise (technical depth), Authoritativeness (cite sources), Trustworthiness (accurate data)
2. Search intent: content must directly answer what users search for
3. Originality: unique insights, not just rehashing competitors
4. Accuracy: all data must cite source + date, code examples must be runnable
5. Visual elements: images, comparison tables, diagrams
6. CTA: clear call-to-action with link
7. Keyword coverage: primary keyword in title/H2/URL/description/body; secondary keywords in H3/H4/body
8. Article structure: intro → main sections → product mention (natural) → FAQ
9. Links: internal links (our site) + external links (references)
10. Language: simple vocabulary, short sentences, natural tone, 8th-grade reading level
11. No competitor promotion without mentioning our product as alternative
12. Product mention must use human as subject ("You can use Crazyrouter to..." not "Crazyrouter can...")

## Article Draft
${draftTruncated}

## Your Review

Score each dimension 1-10 and provide specific, actionable feedback. Output in this exact format:

### E-E-A-T Score: X/10
[specific issues and how to fix them]

### Search Intent Score: X/10
[does it answer what users search for?]

### Originality Score: X/10
[unique insights vs generic content]

### Data Accuracy Score: X/10
[are claims backed by sources? any unverified data?]

### Visual Elements Score: X/10
[tables, images, diagrams]

### CTA Score: X/10
[is there a clear, filled CTA?]

### Keyword Coverage Score: X/10
[primary + secondary keyword usage]

### Article Structure Score: X/10
[intro quality, section flow, FAQ]

### Links Score: X/10
[internal + external links]

### Language Quality Score: X/10
[readability, tone, repetition]

### Product Integration Score: X/10
[natural product mention, not forced]

### Overall Score: X/100
[weighted sum, brief summary]

### Top 5 Issues to Fix (priority order)
1. [most critical issue + specific fix]
2. ...
3. ...
4. ...
5. ...`;

  const res = await fetch(`${config.aiBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.aiApiKey()}`,
    },
    body: JSON.stringify({
      model: config.aiModel(),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// ============================================
// 生成评审报告
// ============================================
function buildReport(hardResults, aiReview, draftPath, concept) {
  const today = new Date().toISOString().split('T')[0];
  const passCount = hardResults.filter(r => r.pass).length;

  let report = `# SEO Article Review Report\n\n`;
  report += `> Generated: ${today}\n`;
  report += `> Draft: ${path.basename(draftPath)}\n`;
  if (concept?.keyword) report += `> Keyword: ${concept.keyword}\n`;
  report += '\n---\n\n';

  // 硬指标
  report += `## 硬指标检查 (${passCount}/${hardResults.length})\n\n`;
  report += '| 检查项 | 结果 | 详情 |\n|--------|------|------|\n';
  hardResults.forEach(r => {
    report += `| ${r.name} | ${r.pass ? '✅' : '❌'} | ${r.detail} |\n`;
  });
  report += '\n---\n\n';

  // AI 评审
  report += `## AI SOP 评审\n\n${aiReview}\n`;

  return report;
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
