# Generate Draft Script Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 `generate-draft.js`，读取 `article-concept.yaml`，分段调用 AI 生成完整文章初稿，输出 `{slug}-draft.md`。

**Architecture:**
分段生成策略：intro → 逐 H2 section（携带上一段末尾 200 字作为上下文）→ FAQ + CTA。每段独立 AI 调用，保证质量和 token 控制。生成完成后自动运行 quality-check.js 输出得分。

**Tech Stack:** Node.js, js-yaml (已有), node-fetch (已有), quality-check.js (已有)

**约束:**
- 每篇文章总字数上限 15000
- image_needed: true 的位置插入 `<!-- IMAGE: {description} -->` 占位符
- 写作规范从 `quality-standards.yaml` 提取禁用词注入 prompt
- 品牌声音从 `project-config.yaml` 读取（如果存在），否则用默认值

---

## Task 1: 创建 draft-writer 配置读取模块

**Files:**
- Create: `seomaster/scripts/lib/draft-config.js`

**Step 1: 创建 draft-config.js**

功能：读取 concept.yaml、quality-standards.yaml、project-config.yaml，返回写作所需的配置对象。

```js
// seomaster/scripts/lib/draft-config.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SEOMASTER_ROOT = path.join(__dirname, '../..');
const TEMPLATES_DIR = path.join(SEOMASTER_ROOT, 'templates');

/**
 * 读取写作所需的所有配置
 * @param {string} conceptPath - concept.yaml 的绝对路径
 * @returns {{ concept, forbiddenWords, voice, aiPatterns }}
 */
function loadDraftConfig(conceptPath) {
  // 读取 concept.yaml
  const concept = yaml.load(fs.readFileSync(conceptPath, 'utf-8'));

  // 读取 quality-standards.yaml
  const qualityPath = path.join(TEMPLATES_DIR, 'quality-standards.yaml');
  const quality = yaml.load(fs.readFileSync(qualityPath, 'utf-8'));

  // 提取所有禁用词（扁平化）
  const fw = quality.hard_metrics?.forbidden_words || {};
  const forbiddenWords = Object.values(fw)
    .flatMap((cat) => cat.words || []);

  // 提取 AI 句式禁令
  const aiPatterns = (quality.hard_metrics?.ai_patterns || [])
    .map((p) => p.pattern);

  // 读取 project-config.yaml（可选，不存在则用默认值）
  const projectConfigPath = path.join(SEOMASTER_ROOT, 'project-config.yaml');
  let voice = {
    tone: '技术老手的实话实说',
    style: '数据驱动，不吹不黑',
  };
  if (fs.existsSync(projectConfigPath)) {
    const projectConfig = yaml.load(fs.readFileSync(projectConfigPath, 'utf-8'));
    if (projectConfig.voice) voice = projectConfig.voice;
  }

  return { concept, forbiddenWords, voice, aiPatterns };
}

module.exports = { loadDraftConfig };
```

**Step 2: 验证**

```bash
cd D:/lemondata-free/lemondata-content/seomaster
node -e "
const { loadDraftConfig } = require('./scripts/lib/draft-config');
const path = require('path');
const conceptPath = path.resolve('../articles/blog/openrouter-alternative-concept.yaml');
const cfg = loadDraftConfig(conceptPath);
console.log('concept title:', cfg.concept.title);
console.log('forbidden words count:', cfg.forbiddenWords.length);
console.log('ai patterns count:', cfg.aiPatterns.length);
console.log('voice tone:', cfg.voice.tone);
"
```

Expected:
```
concept title: Best OpenRouter Alternatives for 2026: A Comprehensive Guide
forbidden words count: 30+
ai patterns count: 4
voice tone: 技术老手的实话实说
```

**Step 3: Commit**

```bash
git add scripts/lib/draft-config.js
git commit -m "feat: add draft-config loader for generate-draft"
```

---

## Task 2: 创建分段 AI 写作模块

**Files:**
- Create: `seomaster/scripts/lib/draft-generator.js`

**Step 1: 创建 draft-generator.js**

功能：分段调用 AI，每段携带上下文，返回各段 Markdown 文本。

```js
// seomaster/scripts/lib/draft-generator.js
const fetch = require('node-fetch');
const config = require('./config');

const CONTEXT_TAIL_CHARS = 800; // 上一段末尾传入的字符数

/**
 * 生成文章 intro 段落
 */
async function generateIntro(concept, forbiddenWords, aiPatterns, voice) {
  const opening = concept.sections?.[0];
  const prompt = buildSystemPrompt(forbiddenWords, aiPatterns, voice) + `

## Your Task: Write the Article Introduction

Article title: "${concept.title}"
Keyword: "${concept.keyword}"
Thesis: "${concept.thesis?.final || concept.thesis?.statement || ''}"

Opening style options (pick the most suitable):
- Data shock: lead with a surprising statistic
- Pain point: start with a specific developer frustration
- Counter-intuitive finding: challenge a common assumption
- Real case: open with a verifiable user scenario

Requirements:
- 150-250 words
- First sentence must contain specific information (data/case/problem) — NO "In today's era..." or "As AI develops..."
- Must make the reader understand what value this article provides
- Include the keyword "${concept.keyword}" naturally
- End with a transition into the first section

Output: Markdown paragraph(s) only, no heading.`;

  return callAI(prompt);
}

/**
 * 生成单个 H2 section
 */
async function generateSection(section, concept, forbiddenWords, aiPatterns, voice, previousTail) {
  const subsectionsText = (section.subsections || []).map((sub) => {
    const points = (sub.points || []).map((p) => `    - ${p}`).join('\n');
    const imageMarker = sub.image_needed
      ? `\n    <!-- IMAGE: ${sub.image_description} -->`
      : '';
    return `  ### ${sub.title}\n${points}${imageMarker}`;
  }).join('\n\n');

  const prompt = buildSystemPrompt(forbiddenWords, aiPatterns, voice) + `

## Your Task: Write One Article Section

Article title: "${concept.title}"
Keyword: "${concept.keyword}"
Keyword variants: ${(concept.keyword_variants || []).join(', ')}

${previousTail ? `## Previous content (last part, for continuity):\n...${previousTail}\n` : ''}

## Section to write:
H2: ${section.title}
Key point (what reader should believe after this section): ${section.key_point}
Target word count: ~${section.word_count} words

Structure:
${subsectionsText}

Requirements:
- Start with H2 heading: ## ${section.title}
- Write H3/H4 subsections as shown in the structure
- Each H3 must cover its bullet points
- Insert <!-- IMAGE: description --> exactly where marked in the structure
- Include keyword variants naturally (don't force them)
- Evidence placeholders: where data is needed, write [DATA: describe what data is needed here]
- No signpost words (首先/其次/最后/first/second/finally)
- No meta-narrative (本文/让我们/let's explore)
- No marketing speak (颠覆性/revolutionary/seamless)

Output: Markdown with headings, no preamble.`;

  return callAI(prompt);
}

/**
 * 生成 FAQ 段落
 */
async function generateFAQ(concept, forbiddenWords, aiPatterns, voice, previousTail) {
  const faqItems = (concept.faq || []).map((f) =>
    `Q: ${f.question}\nHint: ${f.answer_hint}`
  ).join('\n\n');

  const prompt = buildSystemPrompt(forbiddenWords, aiPatterns, voice) + `

## Your Task: Write the FAQ Section

Article keyword: "${concept.keyword}"

${previousTail ? `## Previous content (last part):\n...${previousTail}\n` : ''}

## FAQ items to expand:
${faqItems}

Requirements:
- Start with: ## Frequently Asked Questions
- Each Q as H3, answer as paragraph (50-100 words each)
- Include keyword naturally in at least 2 answers
- Answers must be direct and specific, no vague generalities

Output: Markdown only.`;

  return callAI(prompt);
}

/**
 * 生成 CTA 结尾
 */
async function generateCTA(concept, previousTail) {
  const ctaText = concept.cta?.text || '[Register for free]';
  const ctaUrl = concept.cta?.url || '#';

  const prompt = `Write a 2-3 sentence closing paragraph for an article about "${concept.keyword}".

Previous content ending:
...${previousTail}

The closing should:
- Summarize the key takeaway in one sentence (no "In conclusion" or "To sum up")
- Lead naturally into the CTA
- End with: [${ctaText}](${ctaUrl})

Output: Markdown paragraph only.`;

  return callAI(prompt);
}

function buildSystemPrompt(forbiddenWords, aiPatterns, voice) {
  return `You are a technical content writer. Voice: "${voice.tone}". Style: "${voice.style}".

FORBIDDEN words/phrases (never use these):
${forbiddenWords.map((w) => `- "${w}"`).join('\n')}

FORBIDDEN AI patterns (never use these sentence structures):
${aiPatterns.map((p) => `- ${p}`).join('\n')}

Writing principles:
- Vary sentence length: mix short (under 10 words) and long (40+ words) sentences
- Use specific numbers instead of vague terms ("300+ models" not "many models")
- Every claim needs evidence or a [DATA: ...] placeholder
- Write for developers: code > prose, numbers > adjectives`;
}

async function callAI(prompt) {
  const res = await fetch(`${config.aiBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.aiApiKey()}`,
    },
    body: JSON.stringify({
      model: config.aiModel(),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (!data.choices?.length) {
    throw new Error(`AI returned no choices: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data.choices[0].message.content.trim();
}

function getTail(text, chars = CONTEXT_TAIL_CHARS) {
  return text.slice(-chars);
}

module.exports = { generateIntro, generateSection, generateFAQ, generateCTA, getTail };
```

**Step 2: 验证语法**

```bash
cd D:/lemondata-free/lemondata-content/seomaster
node -e "const m = require('./scripts/lib/draft-generator'); console.log('OK, exports:', Object.keys(m).join(', '))"
```

Expected: `OK, exports: generateIntro, generateSection, generateFAQ, generateCTA, getTail`

**Step 3: Commit**

```bash
git add scripts/lib/draft-generator.js
git commit -m "feat: add section-by-section AI draft generator"
```

---

## Task 3: 实现主入口 generate-draft.js

**Files:**
- Modify: `seomaster/scripts/generate-draft.js`

**Step 1: 完整替换 generate-draft.js**

```js
#!/usr/bin/env node

/**
 * Generate Article Draft from Concept
 *
 * Usage:
 *   node scripts/generate-draft.js --concept articles/blog/my-concept.yaml [options]
 *
 * Options:
 *   --concept   concept.yaml 路径（必填，相对于 seomaster 父目录或绝对路径）
 *   --out       输出目录（默认与 concept 文件同目录）
 */

const path = require('path');
const fs = require('fs');
const { loadDraftConfig } = require('./lib/draft-config');
const { generateIntro, generateSection, generateFAQ, generateCTA, getTail } = require('./lib/draft-generator');

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
  // 相对于 seomaster 的父目录（即 lemondata-content）
  return path.resolve(__dirname, '../../', p);
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.concept) {
    console.error('Usage: node scripts/generate-draft.js --concept path/to/concept.yaml');
    process.exit(1);
  }

  const conceptPath = resolvePath(args.concept);
  if (!fs.existsSync(conceptPath)) {
    console.error(`❌ Concept file not found: ${conceptPath}`);
    process.exit(1);
  }

  const outputDir = args.out
    ? resolvePath(args.out)
    : path.dirname(conceptPath);

  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n✍️  SEOMaster: Generating draft from concept\n`);
  console.log(`  concept: ${conceptPath}`);
  console.log(`  output:  ${outputDir}\n`);

  // 加载配置
  const { concept, forbiddenWords, voice, aiPatterns } = loadDraftConfig(conceptPath);
  const slug = concept.slug || path.basename(conceptPath, '-concept.yaml');

  console.log(`  title:   ${concept.title}`);
  console.log(`  sections: ${concept.sections?.length || 0}\n`);

  const parts = [];
  let fullText = '';

  // Step 1: Intro
  console.log(`[1/${(concept.sections?.length || 0) + 3}] Writing intro...`);
  const intro = await generateIntro(concept, forbiddenWords, aiPatterns, voice);
  parts.push(`# ${concept.title}\n\n${intro}`);
  fullText += intro;
  console.log(`  ✓ intro (${countWords(intro)} words)\n`);

  // Step 2: 逐 section 生成
  const sections = concept.sections || [];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    console.log(`[${i + 2}/${sections.length + 3}] Writing section: "${section.title}"...`);
    const sectionText = await generateSection(
      section, concept, forbiddenWords, aiPatterns, voice, getTail(fullText)
    );
    parts.push(sectionText);
    fullText += '\n\n' + sectionText;
    const wc = countWords(sectionText);
    const target = section.word_count || 0;
    const warn = target && wc > target * 1.3 ? ` ⚠️  (target: ${target})` : '';
    console.log(`  ✓ ${wc} words${warn}\n`);
  }

  // Step 3: FAQ
  console.log(`[${sections.length + 2}/${sections.length + 3}] Writing FAQ...`);
  const faq = await generateFAQ(concept, forbiddenWords, aiPatterns, voice, getTail(fullText));
  parts.push(faq);
  fullText += '\n\n' + faq;
  console.log(`  ✓ FAQ (${countWords(faq)} words)\n`);

  // Step 4: CTA
  console.log(`[${sections.length + 3}/${sections.length + 3}] Writing CTA...`);
  const cta = await generateCTA(concept, getTail(fullText));
  parts.push('\n---\n\n' + cta);
  fullText += '\n\n' + cta;
  console.log(`  ✓ CTA\n`);

  // 组装输出
  const draft = parts.join('\n\n');
  const totalWords = countWords(draft);
  const draftPath = path.join(outputDir, `${slug}-draft.md`);
  fs.writeFileSync(draftPath, draft, 'utf-8');

  // 输出摘要
  console.log('─'.repeat(60));
  console.log(`✅ Draft generated!\n`);
  console.log(`📄 File: ${draftPath}`);
  console.log(`📊 Total words: ${totalWords}${totalWords > 15000 ? ' ⚠️  exceeds 15000 limit' : ''}\n`);
  console.log(`📋 Next steps:`);
  console.log(`   1. Run quality check: node scripts/quality-check.js ${draftPath}`);
  console.log(`   2. Fill in [DATA: ...] placeholders with real data`);
  console.log(`   3. Review image positions (<!-- IMAGE: ... -->)`);
  console.log(`   4. Fill in thesis and CTA in concept.yaml`);
  console.log('─'.repeat(60) + '\n');
}

function countWords(text) {
  // 中英文混合字数统计：英文按空格分词，中文按字符计
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
```

**Step 2: 验证 usage 输出**

```bash
cd D:/lemondata-free/lemondata-content/seomaster
node scripts/generate-draft.js
```

Expected:
```
Usage: node scripts/generate-draft.js --concept path/to/concept.yaml
```

**Step 3: 验证 concept not found 错误**

```bash
node scripts/generate-draft.js --concept nonexistent.yaml
```

Expected:
```
❌ Concept file not found: ...
```

**Step 4: Commit**

```bash
git add scripts/generate-draft.js
git commit -m "feat: implement generate-draft.js with section-by-section AI writing"
```

---

## Task 4: 端到端验证

**Step 1: 运行完整生成**

```bash
cd D:/lemondata-free/lemondata-content/seomaster
node scripts/generate-draft.js --concept ../articles/blog/openrouter-alternative-concept.yaml
```

Expected output:
```
✍️  SEOMaster: Generating draft from concept
  ...
✅ Draft generated!
📄 File: .../articles/blog/openrouter-alternative-draft.md
📊 Total words: XXXX
```

**Step 2: 检查生成文件**

```bash
node -e "
const fs = require('fs');
const draft = fs.readFileSync('../articles/blog/openrouter-alternative-draft.md', 'utf-8');
console.log('Has H1:', draft.includes('# Best OpenRouter'));
console.log('Has H2 sections:', (draft.match(/^## /mg) || []).length);
console.log('Has IMAGE markers:', (draft.match(/<!-- IMAGE:/g) || []).length);
console.log('Has DATA placeholders:', (draft.match(/\[DATA:/g) || []).length);
console.log('Has FAQ:', draft.includes('## Frequently Asked Questions'));
console.log('First 300 chars:');
console.log(draft.slice(0, 300));
"
```

Expected:
- Has H1: true
- Has H2 sections: 6+
- Has IMAGE markers: 2
- Has FAQ: true

**Step 3: 运行 quality check**

```bash
node scripts/quality-check.js ../articles/blog/openrouter-alternative-draft.md
```

Expected: 输出质量得分报告

**Step 4: Commit 生成的 draft（可选）**

```bash
cd ..  # 回到 lemondata-content
git add articles/blog/openrouter-alternative-draft.md
git commit -m "content: add openrouter-alternative draft (AI generated, needs review)"
```

---

## 依赖关系

```
Task 1 (draft-config.js)
  └── Task 2 (draft-generator.js)
        └── Task 3 (generate-draft.js)
              └── Task 4 (验证)
```

顺序执行，无并行。

---

## 注意事项

**Token 消耗预估**
- 每篇文章约 6-8 次 AI 调用
- 每次约 1000-2000 tokens input + 500-1500 tokens output
- 总计约 15000-25000 tokens/篇

**[DATA: ...] 占位符**
- AI 在需要真实数据的地方会插入 `[DATA: 描述需要什么数据]`
- 发布前必须替换为真实数据（价格、性能数字、用户案例等）

**quality-check.js 集成**
- 脚本末尾提示运行 quality-check，但不自动运行（避免阻塞流程）
- 用户可手动运行检查禁用词和标点限制
