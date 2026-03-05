// seomaster/scripts/lib/draft-generator.js
const fetch = require('node-fetch');
const config = require('./config');
const { loadDraftKnowledge } = require('./knowledge');

const CONTEXT_TAIL_CHARS = 800; // 上一段末尾传入的字符数

/**
 * 生成文章 intro 段落
 */
async function generateIntro(concept, forbiddenWords, aiPatterns, voice) {
  const prompt = buildSystemPrompt(forbiddenWords, aiPatterns, voice) + `

## Your Task: Write the Article Introduction

Article title: "${concept.title}"
Keyword: "${concept.keyword}"
Thesis: "${concept.thesis?.final || concept.thesis?.statement || ''}"

IMPORTANT: The article subject is "${concept.keyword}". If this is NOT our product (Crazyrouter/LemonData), do NOT attribute our product's features/data to it. Only mention our product where it naturally fits as a related tool or alternative.

Opening style options (pick the most suitable):
- Data shock: lead with a surprising statistic
- Pain point: start with a specific developer frustration
- Counter-intuitive finding: challenge a common assumption
- Real case: open with a verifiable user scenario

Requirements:
- 150-250 words
- First sentence must contain specific information (data/case/problem) — NO "In today's era..." or "As AI develops..."
- Must make the reader understand what value this article provides
- MUST include the exact keyword "${concept.keyword}" at least once, preferably in bold: **${concept.keyword}**
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

## Task: Write Section "${section.title}"

Keyword: "${concept.keyword}"
Key point: ${section.key_point}
Target: ~${section.word_count} words

${previousTail ? `Previous context:\n...${previousTail}\n\n` : ''}Structure:
${subsectionsText}

Rules:
- Start with ## ${section.title}
- Cover all H3/H4 points
- Include keyword "${concept.keyword}" naturally 1-2 times
- Insert <!-- IMAGE: ... --> where marked
- Use [DATA: ...] for missing data
- No signpost words (first/second/finally)
- No meta-narrative (let's explore/本文)
- Use tables for comparisons
- Cite sources: (Source: name, date)
- Mention Crazyrouter naturally where relevant

Output: Markdown with headings.`;

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

[DATA: This section requires manual writing due to complexity. Key points to cover: ${section.key_point}]

${(section.subsections || []).map(sub => `### ${sub.title}\n\n[DATA: ${sub.points?.join(', ') || 'Content needed'}]\n`).join('\n')}`;
}

/**
 * 生成 FAQ 段落
 */
async function generateFAQ(concept, forbiddenWords, aiPatterns, voice, previousTail) {
  const faqItems = (concept.faq || []).map((f) =>
    `Q: ${f.question}\nHint: ${f.answer_hint}`
  ).join('\n\n');

  const prompt = `Write FAQ section for article about "${concept.keyword}".

FAQ items:
${faqItems}

Format:
## Frequently Asked Questions

### [Question 1]
[50-100 word answer with specific details]

### [Question 2]
[50-100 word answer]

Rules:
- Include keyword "${concept.keyword}" in 2+ answers
- Be specific, no vague statements
- Use data/examples where possible

Output: Markdown only.`;

  return callAI(prompt);
}

/**
 * 生成 CTA 结尾
 */
async function generateCTA(concept, previousTail) {
  const ctaText = concept.cta?.text || 'Try Crazyrouter for free';
  const ctaUrl = concept.cta?.url || 'https://api.lemondata.cc/signup';

  try {
    const prompt = `Write 2-3 sentence closing for article about "${concept.keyword}".

Requirements:
- Summarize key takeaway (no "In conclusion")
- Mention how Crazyrouter helps (use "You can use..." not "Crazyrouter provides...")
- End with: [${ctaText}](${ctaUrl})

Output: Markdown paragraph.`;

    const result = await callAI(prompt);
    if (result && result.length > 20) {
      return result;
    }
  } catch (e) {
    console.warn('  ⚠️  CTA generation failed, using fallback');
  }

  // Fallback: generate simple CTA
  return `Ready to simplify your AI API integration? You can use Crazyrouter to access 300+ models with one API key, native protocol support, and transparent pricing. [${ctaText}](${ctaUrl})`;
}

function buildSystemPrompt(forbiddenWords, aiPatterns, voice) {
  // 加载知识库上下文
  const knowledge = loadDraftKnowledge();
  const knowledgeSection = knowledge
    ? `\nREFERENCE DATA — This is OUR product (Crazyrouter/LemonData) and industry data. Use it for accuracy when relevant, but do NOT confuse our product data with the article's subject. If the article is about a different product, clearly distinguish between them:\n${knowledge}\n`
    : '';

  return `You are a technical content writer. Voice: "${voice.tone}". Style: "${voice.style}".
${knowledgeSection}
FORBIDDEN words/phrases (never use these):
${forbiddenWords.map((w) => `- "${w}"`).join('\n')}

FORBIDDEN AI patterns (never use these sentence structures):
${aiPatterns.map((p) => `- ${p}`).join('\n')}

STRICT FORMATTING RULES:
- Use **bold** MAXIMUM 3 times in the entire article. Reserve it only for the single most critical insight.
- Use em dash (——) MAXIMUM 3 times total.
- Use exclamation mark (!) MAXIMUM 2 times total.
- Do NOT bold product names, section labels, or list items. Plain text only.

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
      max_tokens: 8192, // Add max_tokens to prevent truncation
    }),
  });

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

  // Now strip excess bold from non-code content
  let count = 0;
  textWithoutCode = textWithoutCode.replace(/\*\*(.+?)\*\*/g, (match, inner) => {
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
    .replace(/，，/g, '，')
    .replace(/。。/g, '。')
    .replace(/  +/g, ' ')
    .replace(/^ +/gm, '')
    .replace(/\n{3,}/g, '\n\n');

  // Strip em dashes (——) - replace with comma or period depending on context
  result = result.replace(/——/g, ', ');

  // Add external links
  result = addExternalLinks(result);

  return stripExcessBold(result);
}

/**
 * Add external reference links to first mentions of key terms
 */
function addExternalLinks(text) {
  const links = {
    'OpenAI API': 'https://platform.openai.com/docs/api-reference',
    'Anthropic API': 'https://docs.anthropic.com/en/api/getting-started',
    'Google Gemini': 'https://ai.google.dev/gemini-api/docs',
    'OpenRouter': 'https://openrouter.ai/docs',
    'Together AI': 'https://docs.together.ai/',
  };

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
