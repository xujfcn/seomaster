# Generate Concept Script Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 改造 `generate-concept.js`，输入一个关键词，自动抓取 Google 前 10 篇文章大纲，AI 分析后生成结构化的 `article-concept.yaml`。

**Architecture:**
1. Apify Google Search Scraper API → 获取前 10 条 organic results（标题 + URL）
2. node-fetch + cheerio → 并发抓取每篇文章的 H1-H4 标签
3. Crazyrouter/OpenAI-compatible API → 分析 10 篇大纲，按「是什么→为什么→怎么做」逻辑生成本文大纲
4. 输出 `{slug}-research.json`（原始数据）+ `{slug}-concept.yaml`（结构化大纲）

**Tech Stack:** Node.js, node-fetch (已有), cheerio (新增), js-yaml (新增), Apify API, OpenAI-compatible API

**约束:**
- 文章字数上限 15000 字（大纲 sections 数量据此控制）
- 每篇文章配图位置标注 1-2 处（IMAGE marker）
- H1-H4 每层包含关键词的不同角度/变体

---

## Task 1: 安装依赖

**Files:**
- Modify: `seomaster/package.json`

**Step 1: 安装 cheerio 和 js-yaml**

```bash
cd D:/lemondata-free/lemondata-content/seomaster
npm install cheerio js-yaml
```

Expected: package.json dependencies 新增 `cheerio` 和 `js-yaml`

**Step 2: 验证安装**

```bash
node -e "require('cheerio'); require('js-yaml'); console.log('OK')"
```

Expected: 输出 `OK`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add cheerio and js-yaml dependencies for generate-concept"
```

---

## Task 2: 创建 .env 配置和环境变量读取模块

**Files:**
- Create: `seomaster/.env.example`
- Create: `seomaster/scripts/lib/config.js`

**Step 1: 创建 .env.example**

```bash
# seomaster/.env.example
APIFY_API_TOKEN=apify_api_xxxx
AI_API_KEY=sk-xxxx
AI_API_BASE_URL=https://crazyrouter.com/v1
AI_MODEL=gpt-4o
```

**Step 2: 创建 config.js**

```js
// seomaster/scripts/lib/config.js
const path = require('path');
const fs = require('fs');

// 加载 .env（如果存在）
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

function getRequired(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}. See .env.example`);
  return val;
}

module.exports = {
  apifyToken: () => getRequired('APIFY_API_TOKEN'),
  aiApiKey: () => getRequired('AI_API_KEY'),
  aiBaseUrl: () => process.env.AI_API_BASE_URL || 'https://api.openai.com/v1',
  aiModel: () => process.env.AI_MODEL || 'gpt-4o',
};
```

**Step 3: 验证 config.js 加载正常**

```bash
node -e "const c = require('./scripts/lib/config'); console.log('config OK')"
```

Expected: 输出 `config OK`（不会报错，因为没有调用 getRequired）

**Step 4: Commit**

```bash
git add seomaster/.env.example seomaster/scripts/lib/config.js
git commit -m "feat: add env config loader for generate-concept"
```

---

## Task 3: 实现 Apify Google Search 模块

**Files:**
- Create: `seomaster/scripts/lib/google-search.js`

**Step 1: 创建 google-search.js**

功能：调用 Apify `apify/google-search-scraper` Actor，返回前 N 条 organic results。

```js
// seomaster/scripts/lib/google-search.js
const fetch = require('node-fetch');

const APIFY_BASE = 'https://api.apify.com/v2';
const ACTOR_ID = 'apify~google-search-scraper';

/**
 * 用 Apify 搜索 Google，返回前 maxResults 条 organic results
 * @param {string} keyword - 搜索关键词
 * @param {object} options - { lang: 'en', market: 'us', maxResults: 10 }
 * @returns {Promise<Array<{ position, title, url, description }>>}
 */
async function searchGoogle(keyword, options = {}) {
  const { lang = 'en', market = 'us', maxResults = 10 } = options;
  const token = require('./config').apifyToken();

  // 启动 Actor run
  const runRes = await fetch(
    `${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: keyword,
        languageCode: lang,
        countryCode: market.toUpperCase(),
        maxPagesPerQuery: 1,
        resultsPerPage: maxResults,
        saveHtml: false,
        saveHtmlToKeyValueStore: false,
      }),
    }
  );

  if (!runRes.ok) {
    const text = await runRes.text();
    throw new Error(`Apify run failed: ${runRes.status} ${text}`);
  }

  const runData = await runRes.json();
  const runId = runData.data.id;

  // 轮询等待完成（最多 120 秒）
  console.log(`  Apify run started: ${runId}, waiting...`);
  const datasetId = await waitForRun(runId, token);

  // 取结果
  const itemsRes = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&limit=1`
  );
  const items = await itemsRes.json();

  if (!items || !items.length) throw new Error('Apify returned empty dataset');

  const organic = items[0].organicResults || [];
  return organic.slice(0, maxResults).map((r, i) => ({
    position: i + 1,
    title: r.title,
    url: r.url,
    description: r.description || '',
  }));
}

async function waitForRun(runId, token, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(3000);
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
    const data = await res.json();
    const status = data.data.status;
    if (status === 'SUCCEEDED') return data.data.defaultDatasetId;
    if (status === 'FAILED' || status === 'ABORTED') {
      throw new Error(`Apify run ${status}: ${runId}`);
    }
  }
  throw new Error(`Apify run timeout after ${timeoutMs}ms`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { searchGoogle };
```

**Step 2: 手动测试（需要有效 APIFY_API_TOKEN）**

```bash
cd seomaster
node -e "
const { searchGoogle } = require('./scripts/lib/google-search');
searchGoogle('openrouter alternative', { maxResults: 3 })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error);
"
```

Expected: 输出 3 条结果，每条包含 position、title、url、description

**Step 3: Commit**

```bash
git add seomaster/scripts/lib/google-search.js
git commit -m "feat: add Apify Google Search module"
```

---

## Task 4: 实现文章大纲抓取模块

**Files:**
- Create: `seomaster/scripts/lib/outline-scraper.js`

**Step 1: 创建 outline-scraper.js**

功能：给定 URL 列表，并发抓取每篇文章的 H1-H4 标题，返回结构化大纲。

```js
// seomaster/scripts/lib/outline-scraper.js
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4'];
const FETCH_TIMEOUT = 15000; // 15秒超时
const CONCURRENCY = 3; // 同时抓取数量

/**
 * 并发抓取多篇文章的 H1-H4 大纲
 * @param {Array<{ position, title, url }>} articles
 * @returns {Promise<Array<{ position, title, url, outline, error }>>}
 */
async function scrapeOutlines(articles) {
  const results = [];
  // 分批并发，每批 CONCURRENCY 个
  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const batch = articles.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(scrapeOne));
    results.push(...batchResults);
    if (i + CONCURRENCY < articles.length) {
      await sleep(1000); // 批次间休息 1 秒，避免被封
    }
  }
  return results;
}

async function scrapeOne(article) {
  const { position, title, url } = article;
  console.log(`  [${position}] Scraping: ${url}`);
  try {
    const res = await fetch(url, {
      timeout: FETCH_TIMEOUT,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SEOMaster/1.0; +https://crazyrouter.com)',
        Accept: 'text/html',
      },
    });

    if (!res.ok) {
      return { position, title, url, outline: [], error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const outline = extractOutline(html);

    return { position, title, url, outline, error: null };
  } catch (err) {
    return { position, title, url, outline: [], error: err.message };
  }
}

/**
 * 从 HTML 提取 H1-H4 大纲
 * @param {string} html
 * @returns {Array<{ level: number, text: string }>}
 */
function extractOutline(html) {
  const $ = cheerio.load(html);

  // 移除 nav、header、footer、aside 中的标题（避免噪音）
  $('nav, header, footer, aside, .sidebar, .menu, .navigation').remove();

  const headings = [];
  $(HEADING_TAGS.join(',')).each((_, el) => {
    const tag = el.name.toLowerCase();
    const level = parseInt(tag[1]);
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (text && text.length > 2 && text.length < 200) {
      headings.push({ level, text });
    }
  });

  return headings;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { scrapeOutlines };
```

**Step 2: 验证 cheerio 解析逻辑（离线测试）**

```bash
node -e "
const cheerio = require('cheerio');
const html = '<html><body><h1>Title</h1><h2>Section 1</h2><h3>Sub</h3><nav><h2>Nav noise</h2></nav></body></html>';
const \$ = cheerio.load(html);
\$('nav').remove();
\$('h1,h2,h3,h4').each((_, el) => console.log(el.name, \$(el).text()));
"
```

Expected:
```
h1 Title
h2 Section 1
h3 Sub
```
（nav 里的 h2 不出现）

**Step 3: Commit**

```bash
git add seomaster/scripts/lib/outline-scraper.js
git commit -m "feat: add H1-H4 outline scraper with cheerio"
```

---

## Task 5: 实现 AI 大纲生成模块

**Files:**
- Create: `seomaster/scripts/lib/ai-outline-generator.js`

**Step 1: 创建 ai-outline-generator.js**

功能：把 10 篇竞品大纲发给 AI，输出本文的结构化大纲（JSON），包含 sections + image 标注位置。

```js
// seomaster/scripts/lib/ai-outline-generator.js
const fetch = require('node-fetch');
const config = require('./config');

/**
 * 调用 AI API，根据竞品大纲生成本文大纲
 * @param {string} keyword - 目标关键词
 * @param {Array<{ position, title, url, outline }>} competitorData
 * @param {object} options - { lang: 'en', maxWords: 15000 }
 * @returns {Promise<object>} - 结构化大纲对象
 */
async function generateOutline(keyword, competitorData, options = {}) {
  const { lang = 'en', maxWords = 15000 } = options;

  const competitorSummary = formatCompetitorData(competitorData);
  const prompt = buildPrompt(keyword, competitorSummary, lang, maxWords);

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
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;

  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`AI returned invalid JSON: ${content.slice(0, 200)}`);
  }
}

function formatCompetitorData(competitorData) {
  return competitorData
    .filter((c) => c.outline && c.outline.length > 0)
    .map((c) => {
      const outlineText = c.outline
        .map((h) => `${'  '.repeat(h.level - 1)}H${h.level}: ${h.text}`)
        .join('\n');
      return `[#${c.position}] ${c.title}\nURL: ${c.url}\n${outlineText}`;
    })
    .join('\n\n---\n\n');
}

function buildPrompt(keyword, competitorSummary, lang, maxWords) {
  const langInstruction =
    lang === 'zh'
      ? '用中文输出大纲标题。'
      : 'Output outline titles in English.';

  return `You are an expert SEO content strategist. Analyze the following ${competitorSummary.split('---').length} competitor articles for the keyword "${keyword}", then generate an optimized article outline.

## Competitor Outlines
${competitorSummary}

## Your Task

Generate a comprehensive article outline for the keyword: "${keyword}"

### Rules:

1. **Structure logic**: Follow the natural human thinking pattern:
   - What is it? (definition, background, context)
   - Why does it matter? (pain points, benefits, use cases)
   - How to do it? (practical steps, examples, comparisons)
   - What to watch out for? (limitations, alternatives, FAQs)

2. **Keyword coverage**: Each heading level (H1→H2→H3→H4) must include different angles/variants of the keyword:
   - H1: exact keyword or close variant
   - H2: topic + keyword context (e.g., "why use X", "best X for Y")
   - H3: specific subtopics, long-tail variants, use cases
   - H4: detailed breakdowns, comparisons, edge cases

3. **Gap analysis**: Find topics covered by ALL competitors (must include) and topics MISSING from most competitors (differentiation opportunity). Note which is which.

4. **Word count**: Target total ~${Math.round(maxWords * 0.8)}-${maxWords} words. Each section's estimated word count should reflect depth.

5. **Images**: Mark exactly 1-2 sections where an image/diagram would be most valuable (set image_needed: true).

6. **${langInstruction}**

## Output Format (JSON only, no markdown wrapper):

{
  "title": "H1 article title (include keyword)",
  "meta_description": "120-160 char SEO description with keyword",
  "keyword": "${keyword}",
  "keyword_variants": ["variant1", "variant2", "variant3"],
  "competitor_insights": {
    "common_topics": ["topic covered by 7+ competitors"],
    "gap_opportunities": ["topic missing from most competitors"]
  },
  "sections": [
    {
      "h2": "Section title",
      "key_point": "One sentence: what will reader learn/believe after this section (judgment, not description)",
      "h3_items": [
        {
          "h3": "Subsection title",
          "h4_items": ["H4 point 1", "H4 point 2"],
          "word_count": 300,
          "image_needed": false,
          "image_description": ""
        }
      ],
      "word_count": 600
    }
  ],
  "faq": [
    { "question": "FAQ question with keyword", "answer_hint": "brief answer direction" }
  ],
  "total_word_count": 3000,
  "cta_placement": "after section 2 and at end"
}`;
}

module.exports = { generateOutline };
```

**Step 2: Commit**

```bash
git add seomaster/scripts/lib/ai-outline-generator.js
git commit -m "feat: add AI outline generator with competitor analysis prompt"
```

---

## Task 6: 实现 YAML 输出模块

**Files:**
- Create: `seomaster/scripts/lib/concept-writer.js`

**Step 1: 创建 concept-writer.js**

功能：把 AI 生成的大纲结构转换为 `article-concept.yaml` 格式，写入文件。

```js
// seomaster/scripts/lib/concept-writer.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * 把 AI 大纲结构写入 article-concept.yaml
 * @param {string} slug - 文章 slug（用于文件名）
 * @param {string} keyword - 原始关键词
 * @param {object} outline - AI 生成的大纲对象
 * @param {Array} competitorData - 原始竞品数据
 * @param {string} outputDir - 输出目录
 */
function writeConceptYaml(slug, keyword, outline, competitorData, outputDir) {
  // 转换 sections 格式
  const sections = outline.sections.map((s) => {
    const allH3 = s.h3_items || [];
    return {
      title: s.h2,
      key_point: s.key_point,
      evidence: ['[待填写：发布前补充支撑数据]'],
      word_count: s.word_count,
      subsections: allH3.map((h3) => ({
        title: h3.h3,
        points: h3.h4_items || [],
        word_count: h3.word_count,
        image_needed: h3.image_needed || false,
        image_description: h3.image_description || '',
      })),
    };
  });

  const concept = {
    // 基本信息
    title: outline.title,
    slug: slug,
    type: 'technical_blog',
    keyword: keyword,
    keyword_variants: outline.keyword_variants || [],
    meta_description: outline.meta_description,

    // 竞品分析摘要
    competitor_analysis: {
      sources: competitorData
        .filter((c) => c.outline && c.outline.length)
        .map((c) => ({ position: c.position, title: c.title, url: c.url })),
      common_topics: outline.competitor_insights?.common_topics || [],
      gap_opportunities: outline.competitor_insights?.gap_opportunities || [],
    },

    // 论点（需人工填写）
    thesis: {
      statement: '[待确认：用一句话说清读者读完后记住什么]',
      candidates: [],
      final: '',
    },

    // 文章结构
    sections: sections,

    // FAQ
    faq: outline.faq || [],

    // CTA
    cta: {
      text: '[待填写]',
      url: '[待填写]',
      placement: outline.cta_placement || '文末',
    },

    // 配图汇总
    images_needed: extractImageRequirements(outline.sections),

    // 字数
    word_count: {
      target: outline.total_word_count,
      max: 15000,
    },

    // 质量检查点
    review_checkpoints: [
      'Thesis 是否清晰？一句话能说清吗？',
      '每个 section 的 key_point 是否服务于 Thesis？',
      '所有数据是否已验证？是否标注来源和日期？',
      '配图位置是否合理？图片描述是否清晰？',
      '是否避免了所有 AI 套话和营销腔？',
    ],

    // 元数据
    generated_at: new Date().toISOString().split('T')[0],
    status: 'concept',
  };

  const yamlStr = yaml.dump(concept, {
    indent: 2,
    lineWidth: 120,
    quotingType: '"',
  });

  const outputPath = path.join(outputDir, `${slug}-concept.yaml`);
  fs.writeFileSync(outputPath, yamlStr, 'utf-8');
  return outputPath;
}

function extractImageRequirements(sections) {
  const images = [];
  for (const s of sections) {
    for (const h3 of s.h3_items || []) {
      if (h3.image_needed) {
        images.push({
          section: s.h2,
          subsection: h3.h3,
          description: h3.image_description,
          status: 'pending',
        });
      }
    }
  }
  return images;
}

/**
 * 把原始竞品数据写入 research JSON
 */
function writeResearchJson(slug, keyword, searchResults, outlineData, outputDir) {
  const research = {
    keyword,
    generated_at: new Date().toISOString(),
    search_results: searchResults,
    scraped_outlines: outlineData,
  };

  const outputPath = path.join(outputDir, `${slug}-research.json`);
  fs.writeFileSync(outputPath, JSON.stringify(research, null, 2), 'utf-8');
  return outputPath;
}

module.exports = { writeConceptYaml, writeResearchJson };
```

**Step 2: Commit**

```bash
git add seomaster/scripts/lib/concept-writer.js
git commit -m "feat: add concept YAML writer module"
```

---

## Task 7: 改造主入口 generate-concept.js

**Files:**
- Modify: `seomaster/scripts/generate-concept.js`

**Step 1: 完整替换 generate-concept.js**

```js
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

  const keyword = args.keyword;
  const slug = args.slug || keywordToSlug(keyword);
  const lang = args.lang || 'en';
  const market = args.market || 'us';
  const maxResults = Math.min(parseInt(args.results) || 10, 10);
  const outputDir = path.resolve(__dirname, '../../', args.out || 'articles/blog');

  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n🔍 SEOMaster: Generating concept for keyword "${keyword}"\n`);
  console.log(`  slug:    ${slug}`);
  console.log(`  lang:    ${lang}`);
  console.log(`  market:  ${market}`);
  console.log(`  output:  ${outputDir}\n`);

  // Step 1: Google Search
  console.log(`[1/4] Searching Google for top ${maxResults} results...`);
  const searchResults = await searchGoogle(keyword, { lang, market, maxResults });
  console.log(`  Found ${searchResults.length} results\n`);

  // Step 2: 抓取大纲
  console.log(`[2/4] Scraping H1-H4 outlines from ${searchResults.length} articles...`);
  const outlineData = await scrapeOutlines(searchResults);
  const successCount = outlineData.filter((o) => !o.error).length;
  console.log(`  Scraped ${successCount}/${searchResults.length} articles successfully\n`);

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
```

**Step 2: 测试 help 输出（不需要 API key）**

```bash
cd seomaster
node scripts/generate-concept.js
```

Expected:
```
Usage: node scripts/generate-concept.js --keyword "your keyword"
```

**Step 3: Commit**

```bash
git add seomaster/scripts/generate-concept.js
git commit -m "feat: implement generate-concept.js with Apify + cheerio + AI outline"
```

---

## Task 8: 更新 workflow-guide.md 的 Research/Concept 阶段说明

**Files:**
- Modify: `seomaster/docs/workflow-guide.md`

在阶段 3（Concept）开头，替换原来的"AI 生成 Concept"说明，改为：

```markdown
### 使用脚本自动生成 Concept

```bash
# 基本用法（英文关键词，美国市场）
node scripts/generate-concept.js --keyword "openrouter alternative"

# 中文关键词
node scripts/generate-concept.js --keyword "AI API 聚合平台" --lang zh --market cn

# 自定义输出目录
node scripts/generate-concept.js --keyword "llm proxy" --out articles/blog
```

脚本会自动：
1. 搜索 Google 前 10 条结果
2. 抓取每篇文章 H1-H4 大纲
3. AI 分析竞品大纲 → 生成本文大纲（is what / why / how 逻辑）
4. 标注 1-2 处配图位置（image_needed: true）
5. 输出 `{slug}-concept.yaml` 和 `{slug}-research.json`

脚本生成后，人工需要确认：
- [ ] thesis.final 是否清晰？
- [ ] 竞品 gap_opportunities 是否可以作为差异化亮点？
- [ ] 配图位置是否合理？
```

**Step 2: Commit**

```bash
git add seomaster/docs/workflow-guide.md
git commit -m "docs: update workflow-guide with generate-concept script usage"
```

---

## Task 9: 端到端验证

**Step 1: 配置 .env**

```bash
cp seomaster/.env.example seomaster/.env
# 编辑 .env，填入真实 API key
```

**Step 2: 运行完整流程**

```bash
cd seomaster
node scripts/generate-concept.js --keyword "openrouter alternative" --results 5
```

（先用 5 条结果测试，节省 API 用量）

Expected:
```
✅ Concept generated successfully!

📄 Files created:
   .../articles/blog/openrouter-alternative-research.json
   .../articles/blog/openrouter-alternative-concept.yaml

📋 Next steps:
   1. Review openrouter-alternative-concept.yaml
   ...
```

**Step 3: 检查生成的 YAML 质量**

打开生成的 `*-concept.yaml`，验证：
- [ ] sections 数量合理（通常 5-8 个 H2）
- [ ] H2→H3→H4 层级清晰
- [ ] 至少 1 个 `image_needed: true`
- [ ] keyword_variants 包含 3+ 个变体
- [ ] total_word_count 在 3000-15000 之间

**Step 4: 检查 research.json**

```bash
node -e "
const d = require('./articles/blog/openrouter-alternative-research.json');
console.log('Search results:', d.search_results.length);
console.log('Outlines scraped:', d.scraped_outlines.filter(o => !o.error).length);
"
```

---

## 依赖关系图

```
Task 1 (依赖安装)
  └── Task 2 (config)
        ├── Task 3 (google-search)
        ├── Task 4 (outline-scraper)
        └── Task 5 (ai-outline-generator)
              └── Task 6 (concept-writer)
                    └── Task 7 (main entry)
                          └── Task 8 (docs update)
                                └── Task 9 (验证)
```

Tasks 3、4、5 可以并行开发（都依赖 Task 2，互相独立）。

---

## 注意事项

**Apify 费用预估**
- 每次运行抓取 10 条结果 = 约 $0.0025（非常便宜）
- 月跑 100 篇文章 ≈ $0.25

**抓取失败处理**
- 部分网站会拒绝抓取（返回 403/paywall），这是正常现象
- 只要成功抓取 5+ 篇，AI 分析质量就够用
- 失败的 URL 会在 research.json 中记录 error 字段

**AI API 配置**
- 项目默认使用 Crazyrouter/OpenAI 兼容 API
- 修改 `.env` 中的 `AI_API_BASE_URL` 即可切换到 Crazyrouter 端点
- 推荐模型：gpt-4o（支持 JSON mode）
