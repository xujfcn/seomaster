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

IMPORTANT: The article subject is "${concept.keyword}". If this is NOT our product (Crazyrouter/LemonData), do NOT attribute our product's features/data to it. Only mention our product where it naturally fits as a related tool or alternative.

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
- When comparing tools or listing alternatives, use a Markdown comparison table (| Feature | A | B |)
- Cite sources inline: add (Source: name, date) after factual claims
- If mentioning competitor products, naturally mention Crazyrouter/LemonData as an alternative where relevant. Use human as subject: "You can use Crazyrouter to..." NOT "Crazyrouter provides..."
- Use simple vocabulary and short sentences. Target 8th-grade reading level.

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
  const ctaText = concept.cta?.text || 'Try Crazyrouter for free';
  const ctaUrl = concept.cta?.url || 'https://api.lemondata.cc/signup';

  const prompt = `Write a 2-3 sentence closing paragraph for an article about "${concept.keyword}".

Previous content ending:
...${previousTail}

The closing should:
- Summarize the key takeaway in one sentence (no "In conclusion" or "To sum up")
- Naturally mention how Crazyrouter (LemonData) can help with the topic (e.g., as an API gateway for accessing AI models). Use human as subject: "You can use..." not "Crazyrouter provides..."
- End with: [${ctaText}](${ctaUrl})

Output: Markdown paragraph only.`;

  return callAI(prompt);
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

/**
 * Strip excess bold markers, keeping at most maxBold occurrences
 */
function stripExcessBold(text, maxBold = 3) {
  let count = 0;
  return text.replace(/\*\*(.+?)\*\*/g, (match, inner) => {
    count++;
    return count <= maxBold ? match : inner;
  });
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

  return stripExcessBold(result);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { generateIntro, generateSection, generateFAQ, generateCTA, getTail, postProcessDraft };
