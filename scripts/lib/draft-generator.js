// seomaster/scripts/lib/draft-generator.js
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { loadDraftKnowledge } = require('./knowledge');
const { getDefaultCta, getDefaultThesis } = require('./project-config');
const { fetchWithTimeout } = require('./fetch-timeout');

// 加载完整写作规则文件（一次性读取，缓存在内存中）
const WRITING_RULES_PATH = path.join(__dirname, '../../templates/writing-rules.md');
let _writingRulesCache = null;
function loadWritingRules() {
  if (_writingRulesCache === null) {
    try {
      _writingRulesCache = fs.readFileSync(WRITING_RULES_PATH, 'utf-8');
    } catch (e) {
      console.warn('  ⚠️  writing-rules.md not found, using built-in rules only');
      _writingRulesCache = '';
    }
  }
  return _writingRulesCache;
}

const CONTEXT_TAIL_CHARS = 800; // 上一段末尾传入的字符数

function isPlaceholderValue(value) {
  if (typeof value !== 'string') return true;
  const normalized = value.trim();
  return !normalized || normalized === '#' || normalized.startsWith('[待');
}

function resolveThesis(concept) {
  if (!isPlaceholderValue(concept.thesis?.final)) return concept.thesis.final.trim();
  if (!isPlaceholderValue(concept.thesis?.statement)) return concept.thesis.statement.trim();
  const defaultThesis = getDefaultThesis();
  if (!isPlaceholderValue(defaultThesis)) return defaultThesis.trim();
  if (!isPlaceholderValue(concept.meta_description)) return concept.meta_description.trim();
  return concept.title || concept.keyword || '';
}

function resolveCta(concept) {
  const defaultCta = getDefaultCta();
  const text = !isPlaceholderValue(concept.cta?.text)
    ? concept.cta.text.trim()
    : (!isPlaceholderValue(defaultCta.text) ? defaultCta.text.trim() : 'Get started');
  const url = !isPlaceholderValue(concept.cta?.url)
    ? concept.cta.url.trim()
    : (!isPlaceholderValue(defaultCta.url) ? defaultCta.url.trim() : '#');

  return { text, url };
}

function isChineseDraft(concept) {
  return concept.lang === 'zh';
}

function languageRule(concept) {
  return isChineseDraft(concept)
    ? 'LANGUAGE: Write ENTIRELY in Simplified Chinese. Do NOT write English body paragraphs unless a product name, URL, source name, or technical term requires English.'
    : 'LANGUAGE: Write ENTIRELY in English. Do NOT use any Chinese characters, even if the reference data below contains Chinese text.';
}

function faqHeading(concept) {
  return isChineseDraft(concept) ? '## 常见问题' : '## Frequently Asked Questions';
}

function targetWordCount(concept, fallback = 1400) {
  const value = Number(concept.word_count?.target || concept.total_word_count || concept.target_words || fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function formatDraftStructuredRequirements(concept) {
  const count = Number(concept.structured_requirements?.requiredListCount || concept.structured_requirements?.required_list_count || 0);
  if (!count) return '';
  if (isChineseDraft(concept)) {
    return [
      `硬性结构要求：这篇文章是 TOP${count}/排行榜类内容。`,
      `正文必须完整输出 ${count} 个独立排名项，不能只写两三个代表项。`,
      `每个排名项都要包含推荐理由、适用场景、注意事项或对比依据。`,
    ].join('\n');
  }
  return [
    `Hard structure requirement: this is a TOP ${count} ranking/list article.`,
    `The draft must include all ${count} distinct ranked items, not just a few examples.`,
    'Each ranked item needs reasons, best fit, cautions, or comparison criteria.',
  ].join('\n');
}

function clampSectionWordCount(section, concept) {
  const sections = Array.isArray(concept.sections) && concept.sections.length > 0 ? concept.sections.length : 4;
  const budget = Math.max(120, Math.floor((targetWordCount(concept) - 260) / sections));
  const declared = Number(section.word_count || budget);
  return Math.max(120, Math.min(declared || budget, budget));
}

function closingFallback(concept, ctaText, ctaUrl) {
  return isChineseDraft(concept)
    ? `如果你正在为宠物选择驱虫方案，可以先根据体重、年龄和寄生虫风险筛选，再对照产品说明确认用法。[${ctaText}](${ctaUrl})`
    : `Ready to get started? [${ctaText}](${ctaUrl})`;
}

/**
 * 生成文章 intro 段落
 */
async function generateIntro(concept, forbiddenWords, aiPatterns, voice) {
  const thesis = resolveThesis(concept);
  const introMax = isChineseDraft(concept) ? '120-180 Chinese characters' : '90-130 words';
  const systemPrompt = await buildSystemPrompt(forbiddenWords, aiPatterns, voice, concept.keyword, concept.lang);
  const prompt = systemPrompt + `

## Your Task: Write the Article Introduction

Article title: "${concept.title}"
Keyword: "${concept.keyword}"
Thesis: "${thesis}"
Writing brief / limits: ${concept.writing_brief || 'none'}
${formatDraftStructuredRequirements(concept)}

IMPORTANT: The article subject is "${concept.keyword}". Focus on the topic. Only mention products from the knowledge base where they naturally fit the context.

WORD COUNT: ${introMax} (STRICT)

Opening style options (pick the most suitable):
- Data shock: lead with a surprising statistic with source
- Pain point: start with a specific developer frustration
- Counter-intuitive finding: challenge a common assumption with data
- Real case: open with a verifiable user scenario

MANDATORY REQUIREMENTS (SOP Compliance):

1. FIRST SENTENCE:
   - MUST contain specific data/case/problem
   - FORBIDDEN: "In today's era...", "As AI develops...", "In recent years..."
   - Example: "API costs jumped 340% in Q4 2025 according to..."

2. KEYWORD USAGE:
   - Include exact keyword "${concept.keyword}" at least once
   - Preferably in bold: **${concept.keyword}**
   - This is your ONE allowed bold in intro

3. LANGUAGE LEVEL:
   - 8th grade reading level
   - Simple words, short sentences (15-20 words average)
   - Active voice only

4. DATA REQUIREMENTS:
   - Use specific numbers when available from the knowledge base
   - If you don't have exact data, write a concrete statement without making up statistics
   - Do NOT use [DATA: ...] placeholders — write complete, publishable content
   - Do NOT invent statistics or sources

5. VALUE PROPOSITION:
   - Reader must understand: "What will I learn?"
   - Be specific: "This guide shows how to cut API costs by 40%" not "This guide helps you save money"

6. TRANSITION:
   - End with smooth transition to first section
   - No "In this article, we will..."
   - Example: "Here's how developers are doing it."

Output: Markdown paragraph(s) only, no heading. Keep it within ${introMax}.`;

  return callAI(prompt);
}

/**
 * 生成单个 H2 section
 */
async function generateSection(section, concept, forbiddenWords, aiPatterns, voice, previousTail) {
  const sectionLimit = clampSectionWordCount(section, concept);
  const subsectionsText = (section.subsections || []).map((sub) => {
    const points = (sub.points || []).map((p) => `    - ${p}`).join('\n');
    const imageDescription = String(sub.image_description || '').trim();
    const imageMarker = sub.image_needed && imageDescription
      ? `\n    <!-- IMAGE: ${sub.image_description} -->`
      : '';
    return `  ### ${sub.title}\n${points}${imageMarker}`;
  }).join('\n\n');

  // Optional product integration must come from the current project concept only.
  const integration = concept.product_integration;
  const sectionIndex = (concept.sections || []).indexOf(section);
  const isIntegrationSection = integration && integration.section_index === sectionIndex;

  let integrationPrompt = '';
  if (isIntegrationSection) {
    const angle = integration.product_angle || '';
    const points = (integration.talking_points || []).map(p => `- ${p}`).join('\n');
    integrationPrompt = `

PRODUCT INTEGRATION (this is the designated integration section):
This section may naturally weave in the project product only if it directly helps the reader.
Product angle: ${angle}
Key points to cover:
${points}

Requirements:
- Lead with the user's problem, then mention the product only if useful
- Mention only specific features from the current project knowledge base
- Use "You can use..." style, not "[Product] provides..."
- Keep the product mention short and practical
- Do NOT write like a landing page or sales pitch`;
  }

  const systemPrompt = await buildSystemPrompt(forbiddenWords, aiPatterns, voice, concept.keyword, concept.lang);
  const prompt = systemPrompt + `

## Task: Write Section "${section.title}"

Keyword: "${concept.keyword}"
Key point: ${section.key_point}
Writing brief / limits: ${concept.writing_brief || 'none'}
${formatDraftStructuredRequirements(concept)}

WORD COUNT LIMIT (STRICT): ${sectionLimit} words/Chinese characters maximum. This is a HARD LIMIT.

${previousTail ? `Previous context:\n...${previousTail}\n\n` : ''}Structure:
${subsectionsText}
${integrationPrompt}
MANDATORY REQUIREMENTS (SOP Compliance):

1. WORD COUNT: ${sectionLimit} words/Chinese characters MAX. Stop writing when you reach this limit.

2. LANGUAGE LEVEL: 8th grade reading level
   - Use simple words (avoid: utilize → use, commence → start)
   - Short sentences (average 15-20 words)
   - Active voice only
   - No jargon without explanation

3. DATA & SOURCES:
   - Use specific numbers from the knowledge base when available
   - If you don't have exact data, write concrete statements without inventing statistics
   - Do NOT use [DATA: ...] placeholders — write complete, publishable content
   - Do NOT make up sources or statistics

4. STRUCTURE:
   - Start with ## ${section.title}
   - Use tables for ANY comparison (pricing, features, specs)
   - Tables must use GitHub-Flavored Markdown pipe syntax only. Do not output HTML table tags such as <table>, <thead>, <tbody>, <tr>, <th>, or <td>.
   - Add <!-- IMAGE: concrete non-empty description --> only where visual aids help
   - Never output empty image markers
   - H3/H4 should be natural-language subquestions or decision points

5. KEYWORD USAGE:
   - Include "${concept.keyword}" naturally 1-2 times
   - Use variants naturally when useful
   - NO keyword stuffing

6. BOLD USAGE:
   - Maximum 1 bold per section (we have 6 sections, limit is 3 total)
   - Only bold the MOST critical insight
   - Do NOT bold: product names, headings, list items

7. FORBIDDEN:
   - No "In conclusion", "To sum up", "Overall"
   - No "Let's explore", "We will discuss"
   - No "First/Second/Finally" signposting
   - No vague statements without data

8. PRODUCT MENTION:
   ${isIntegrationSection
    ? '- This is the integration section. Follow the PRODUCT INTEGRATION instructions above.\n   - Make the product mention substantial with specific features and use cases'
    : '- Only mention products from the knowledge base where they naturally fit\n   - Use "You can use..." style, not "[Product] provides..."\n   - Only mention if it genuinely fits the context'}

9. CONTENT QUALITY:
   - No repetitive content
   - No filler paragraphs
   - Every sentence must add value
   - Use concrete examples, not abstract concepts

Output: Markdown with headings. STOP at ${sectionLimit} words/Chinese characters.`;

  try {
    const result = await callAI(prompt);
    if (result && result.length > 100) {
      return result;
    }
  } catch (e) {
    console.warn(`  ⚠️  Section generation failed: ${e.message}`);
  }

  // Fallback: generate placeholder
  return `## ${section.title}

This section covers: ${section.key_point}

${(section.subsections || []).map(sub => `### ${sub.title}\n\n${sub.points?.join('. ') || 'Content needed.'}\n`).join('\n')}`;
}

/**
 * 生成 FAQ 段落
 */
async function generateFAQ(concept, forbiddenWords, aiPatterns, voice, previousTail) {
  const faqItems = (concept.faq || []).map((f) =>
    `Q: ${f.question}\nHint: ${f.answer_hint}`
  ).join('\n\n');

  const prompt = `${languageRule(concept)}

Write FAQ section for article about "${concept.keyword}".
Writing brief / limits: ${concept.writing_brief || 'none'}
${formatDraftStructuredRequirements(concept)}

FAQ items:
${faqItems}

WORD COUNT: 120-220 words/Chinese characters total (all Q&A combined)

Format:
${faqHeading(concept)}

### [Question 1]
[25-45 word answer with specific details]

### [Question 2]
[25-45 word answer]

MANDATORY REQUIREMENTS (SOP Compliance):

1. KEYWORD USAGE:
   - Include keyword "${concept.keyword}" in 2+ questions
   - Include keyword in 2+ answers
   - Use naturally, no stuffing

2. ANSWER QUALITY:
   - Be specific, no vague statements
   - Use data/examples where possible from the knowledge base
   - Do NOT use [DATA: ...] placeholders — write complete, publishable answers
   - Do NOT invent statistics or sources

3. LANGUAGE LEVEL:
   - 8th grade reading level
   - Simple words, short sentences
   - Active voice

4. ANSWER LENGTH:
   - 25-45 words/Chinese characters per answer
   - 1-2 short sentences per answer
   - No essay-length answers

5. FORBIDDEN:
   - No "It depends..."
   - No "There are many ways..."
   - No vague generalizations

Output: Markdown only. Keep answers short.`;

  return callAI(prompt);
}

/**
 * 生成 CTA 结尾
 */
async function generateCTA(concept, previousTail) {
  const { text: ctaText, url: ctaUrl } = resolveCta(concept);

  try {
    const prompt = `${languageRule(concept)}

Write 2-3 sentence closing paragraph for an article about "${concept.keyword}".

Requirements:
- Summarize key takeaway (no "In conclusion")
- End with this exact markdown link: [${ctaText}](${ctaUrl})
- Output ONLY the paragraph text in plain markdown. No code blocks, no preamble.
- Do NOT use exclamation marks.

Output: plain markdown paragraph only.`;

    const result = await callAI(prompt);
    if (result && result.length > 20) {
      return result;
    }
  } catch (e) {
    console.warn('  ⚠️  CTA generation failed, using fallback');
  }

  // Fallback: generate simple CTA
  return closingFallback(concept, ctaText, ctaUrl);
}

async function loadDraftKnowledgeContext(keyword) {
  const knowledge = loadDraftKnowledge(keyword);
  if (process.env.SEOMASTER_KNOWLEDGE_TRACE_FILE && !String(knowledge || '').trim()) {
    throw new Error('Knowledge base context is required for draft generation, but no current project knowledge was loaded.');
  }
  return knowledge;
}

async function buildSystemPrompt(forbiddenWords, aiPatterns, voice, keyword = '', lang = 'en') {
  // 加载知识库上下文（优先 Supabase，失败时回退到本地 vault）
  const knowledge = await loadDraftKnowledgeContext(keyword);
  const knowledgeSection = knowledge
    ? `\nREFERENCE DATA — Use only this current project data when relevant. Do NOT mention unrelated products, projects, or brands. Do NOT expose internal labels, file names, data-source notes, workflow notes, vault names, or research process details:\n${knowledge}\n`
    : '';

  return `You are a technical content writer following Google's E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness).

Voice: "${voice.tone}"
Style: "${voice.style}"

${languageRule({ lang })}

${knowledgeSection}
GOOGLE SEO & E-E-A-T REQUIREMENTS:

1. EXPERIENCE & EXPERTISE:
   - Write from a practitioner's perspective
   - Use specific examples, not abstract concepts
   - Show understanding through technical details

2. AUTHORITATIVENESS:
   - Cite sources only when you have real data from the knowledge base
   - Do NOT invent statistics or sources
   - Do NOT use [DATA: ...] placeholders — write complete, publishable content

3. TRUSTWORTHINESS:
   - Be accurate and transparent
   - If you don't have specific data, write concrete statements without making up numbers
   - No exaggeration or misleading claims

4. LANGUAGE LEVEL (8th grade):
   - Simple vocabulary: "use" not "utilize", "start" not "commence"
   - Short sentences: average 15-20 words
   - Active voice: "You can access" not "Access can be obtained"
   - No jargon without explanation

5. SENTENCE VARIETY:
   - Mix short (under 10 words) and long (40+ words) sentences
   - Vary sentence structure
   - Use transitions naturally

FORBIDDEN words/phrases (never use these):
${forbiddenWords.map((w) => `- "${w}"`).join('\n')}

FORBIDDEN AI patterns (never use these sentence structures):
${aiPatterns.map((p) => `- ${p}`).join('\n')}

ADDITIONAL FORBIDDEN PATTERNS (SOP):
- "In today's era...", "As AI develops...", "In recent years..."
- "Let's explore...", "We will discuss..."
- "First/Second/Finally" (use natural transitions)
- "In conclusion", "To sum up", "Overall"
- "It depends...", "There are many ways..."
- Internal production words in public copy: "数据来源", "Source:", "workflow", "流程报告", "竞品研究", "大纲", "知识库", "vault", "Published", "Drafts", "DICloak" unless DICloak is the current project product

STRICT FORMATTING RULES:

1. BOLD USAGE:
   - MAXIMUM 3 times in ENTIRE article (across all sections)
   - Only for the single most critical insight per section
   - Do NOT bold: product names, headings, list items, keywords (except once in intro)

2. EM DASH (——):
   - MAXIMUM 3 times total

3. EXCLAMATION MARK (!):
   - MAXIMUM 2 times total

4. TABLES:
   - REQUIRED for any comparison (pricing, features, specs)
   - Use markdown table format
   - Do not add "source" captions unless the source is meant for public readers

5. DATA FORMAT:
   - Numbers: "40%" not "forty percent"
   - Use concrete statements, not vague claims
   - Do NOT use [DATA: ...] placeholders
   - Do NOT invent statistics or sources

Writing principles:
- Use specific numbers instead of vague terms
- Write concrete, publishable content — no placeholders
- Every sentence must add value
- No filler content or vague generalizations

${loadWritingRules()}`;
}

async function callAI(prompt) {
  const res = await fetchWithTimeout(fetch, `${config.aiBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.aiApiKey()}`,
    },
    body: JSON.stringify({
      model: config.aiModel(),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 8192, // Add max_tokens to prevent truncation
    }),
  }, config.aiRequestTimeoutMs(), 'AI draft request');

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  // Debug: log full response if content is empty
  if (!data.choices?.length || !data.choices[0].message.content) {
    console.error('  [DEBUG] Full API response:', JSON.stringify(data, null, 2).slice(0, 1000));
    throw new Error(`AI returned no content. Response: ${JSON.stringify(data).slice(0, 500)}`);
  }

  const content = data.choices[0].message.content.trim();

  // Warn if content is suspiciously short
  if (content.length < 100) {
    console.warn(`  ⚠️  AI returned short content (${content.length} chars): "${content.slice(0, 100)}"`);
  }

  return content;
}

function getTail(text, chars = CONTEXT_TAIL_CHARS) {
  return text.slice(-chars);
}

/**
 * Strip excess bold markers, keeping at most maxBold occurrences
 * Excludes bold markers inside code blocks
 */
function stripExcessBold(text, maxBold = 3) {
  // First, extract code blocks and replace with placeholders
  const codeBlocks = [];
  let textWithoutCode = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Also handle inline code
  const inlineCode = [];
  textWithoutCode = textWithoutCode.replace(/`[^`]+`/g, (match) => {
    inlineCode.push(match);
    return `__INLINE_CODE_${inlineCode.length - 1}__`;
  });

  // Now strip excess bold from non-code content (s flag = dotAll, matches newlines too)
  let count = 0;
  textWithoutCode = textWithoutCode.replace(/\*\*(.+?)\*\*/gs, (match, inner) => {
    count++;
    return count <= maxBold ? match : inner;
  });

  // Restore inline code
  textWithoutCode = textWithoutCode.replace(/__INLINE_CODE_(\d+)__/g, (match, index) => {
    return inlineCode[parseInt(index)];
  });

  // Restore code blocks
  textWithoutCode = textWithoutCode.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    return codeBlocks[parseInt(index)];
  });

  return textWithoutCode;
}

/**
 * Post-process draft: strip forbidden words by replacing with alternatives or removing
 */
function postProcessDraft(text, forbiddenWords) {
  // Replacement map for common forbidden words that need substitution
  const replacements = {
    '本文': '',
    '本文讨论': '',
    '本文将': '',
    '接下来分析': '',
    '接下来': '',
    '下面介绍': '',
    '让我们来看': '',
    '深入探讨': '',
    '至关重要': '很关键',
    '值得注意的是': '',
    '不难发现': '',
    '综上所述': '',
    '不言而喻': '',
    '此外': '',
    '首先': '',
    '其次': '',
    '最后': '',
    "let's explore": '',
    "let's dive into": '',
    'this article discusses': '',
    'in this article': '',
    "it's worth noting": '',
    'in conclusion': '',
    // AI 企业腔替换
    'comprehensive': 'full',
    'robust': 'solid',
    'leverage': 'use',
    'utilize': 'use',
    'seamless': 'smooth',
    'streamline': 'simplify',
    'optimize': 'improve',
    'enhance': 'improve',
    'maximize': 'increase',
    // 书面过渡词删除
    'moreover': '',
    'furthermore': '',
    'additionally': '',
    'therefore': '',
    'overall': '',
  };

  let result = text;
  for (const word of forbiddenWords) {
    const lower = word.toLowerCase();
    if (lower in replacements) {
      // Case-insensitive replace
      const regex = new RegExp(escapeRegex(word), 'gi');
      const replacement = replacements[lower];
      result = result.replace(regex, replacement);
    }
  }

  // Clean up artifacts: double spaces, leading commas/periods after removal, empty lines
  result = result
    .replace(/<!--\s*IMAGE:\s*-->/gi, '')
    .replace(/<\.\s*--\s*IMAGE:\s*--\s*>/gi, '')
    .replace(/\[DATA:[^\]]*\]/gi, '')
    .replace(/^\s*(数据来源|Source)\s*[:：].*$/gim, '')
    .replace(/\bDICloak\b/gi, '')
    .replace(/\bdicloack\b/gi, '')
    .replace(/流程报告|竞品研究|知识库|内部流程|生产流程|大纲生成|vault|Published|Drafts/gi, '')
    .replace(/，，/g, '，')
    .replace(/。。/g, '。')
    .replace(/  +/g, ' ')
    .replace(/^ +/gm, '')
    .replace(/\n{3,}/g, '\n\n');

  // Strip em dashes (——) - replace with comma or period depending on context
  result = result.replace(/——/g, ', ');

  // Add external links
  result = addExternalLinks(result);

  // Strip excess exclamation marks (keep at most 2)
  let exclamationCount = 0;
  result = result.replace(/!/g, (match) => {
    exclamationCount++;
    return exclamationCount <= 2 ? match : '.';
  });

  return stripExcessBold(result);
}

/**
 * Add external reference links to first mentions of key terms
 */
function addExternalLinks(text) {
  const links = {};

  let result = text;
  const linkedTerms = new Set();

  for (const [term, url] of Object.entries(links)) {
    // Only link the first occurrence (not already in a link)
    if (!linkedTerms.has(term)) {
      const regex = new RegExp(`\\b${escapeRegex(term)}\\b(?!\\])`, 'i');
      if (regex.test(result)) {
        result = result.replace(regex, `[${term}](${url})`);
        linkedTerms.add(term);
      }
    }
  }

  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { generateIntro, generateSection, generateFAQ, generateCTA, getTail, postProcessDraft };
