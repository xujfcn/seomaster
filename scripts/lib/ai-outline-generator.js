// seomaster/scripts/lib/ai-outline-generator.js
const fetch = require('node-fetch');
const config = require('./config');
const { loadConceptKnowledge } = require('./knowledge');

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
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error(`AI API returned no choices. Response: ${JSON.stringify(data).slice(0, 500)}`);
  }
  const content = data.choices[0].message.content;

  // Debug: 保存完整响应到文件
  const fs = require('fs');
  const debugPath = require('path').join(process.cwd(), 'output', 'debug-ai-response.txt');
  fs.writeFileSync(debugPath, content, 'utf8');
  console.log(`\n[DEBUG] Full AI response saved to: ${debugPath}`);
  console.log(`[DEBUG] Content length: ${content.length}`);

  try {
    // 剥离 markdown 代码块包裹（```json ... ``` 或 ``` ... ```），支持前后空行
    let cleaned = content.trim();
    // 移除开头的 ```json 或 ```
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    // 移除结尾的 ```
    cleaned = cleaned.replace(/\s*```\s*$/, '');
    return JSON.parse(cleaned.trim());
  } catch (e) {
    throw new Error(`AI returned invalid JSON: ${content.slice(0, 300)}`);
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

  // 加载知识库上下文
  const knowledge = loadConceptKnowledge();
  const knowledgeSection = knowledge
    ? `\n## Internal Knowledge Base (use this data for accuracy)\n${knowledge}\n`
    : '';

  return `You are an expert SEO content strategist. Analyze the following competitor articles for the keyword "${keyword}", then generate an optimized article outline.
${knowledgeSection}
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
