// seomaster/scripts/lib/ai-outline-generator.js
const fetch = require('node-fetch');
const config = require('./config');
const { loadConceptKnowledge, loadFileByName } = require('./knowledge');
const { isBlogUrl } = require('../../config/domain-filter');
const { fetchWithTimeout } = require('./fetch-timeout');
const {
  formatStructuredRequirementPrompt,
  inferStructuredRequirements,
  normalizeRankedOutline,
  validateStructuredOutline,
} = require('./structured-requirements');

/**
 * 调用 AI API，根据竞品大纲生成本文大纲
 * @param {string} keyword - 目标关键词
 * @param {Array<{ position, title, url, outline }>} competitorData
 * @param {object} options - { lang, maxWords, intent, scenes }
 * @returns {Promise<object>} - 结构化大纲对象
 */
async function generateOutline(keyword, competitorData, options = {}) {
  const { lang = 'en', maxWords = 15000, intent = 'informational', scenes = [], keywords = [keyword], brief = '' } = options;
  const structuredRequirements = inferStructuredRequirements({ keyword, keywords, brief, intent });

  const competitorSummary = formatCompetitorData(competitorData);
  const knowledgeContext = await loadOutlineKnowledgeContext(keyword);
  const prompt = buildPrompt(keyword, competitorSummary, lang, maxWords, intent, scenes, keywords, brief, knowledgeContext, structuredRequirements);

  const res = await fetchWithTimeout(fetch, `${config.aiBaseUrl()}/chat/completions`, {
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
  }, config.aiRequestTimeoutMs(), 'AI outline request');

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  // Debug: 保存完整 API 响应
  const fs = require('fs');
  const path = require('path');
  const debugDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(debugDir, { recursive: true });
  const debugApiPath = path.join(debugDir, 'debug-api-full-response.json');
  fs.writeFileSync(debugApiPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n[DEBUG] Full API response saved to: ${debugApiPath}`);

  if (!data.choices || data.choices.length === 0) {
    throw new Error(`AI API returned no choices. Response: ${JSON.stringify(data).slice(0, 500)}`);
  }

  const content = data.choices[0].message?.content || '';

  if (!content || content.trim().length === 0) {
    throw new Error(`AI returned empty content. Full response saved to ${debugApiPath}`);
  }

  // Debug: 保存 AI 文本响应
  const debugPath = path.join(debugDir, 'debug-ai-response.txt');
  fs.writeFileSync(debugPath, content, 'utf8');
  console.log(`[DEBUG] AI content saved to: ${debugPath}`);
  console.log(`[DEBUG] Content length: ${content.length}`);

  // Debug: 保存完整 prompt
  const debugPromptPath = path.join(debugDir, 'debug-prompt.txt');
  fs.writeFileSync(debugPromptPath, prompt, 'utf8');
  console.log(`[DEBUG] Prompt saved to: ${debugPromptPath}`);
  console.log(`[DEBUG] Prompt length: ${prompt.length}`);

  const outline = normalizeRankedOutline(parseOutlineJson(content), structuredRequirements, { lang });
  const structureErrors = validateStructuredOutline(outline, structuredRequirements);
  if (structureErrors.length > 0) {
    throw new Error(`AI outline failed hard structure requirements: ${structureErrors.join('; ')}`);
  }
  return outline;
}

function parseOutlineJson(content) {
  const candidates = buildJsonCandidates(content);
  let lastError = null;

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  const preview = String(content || '').trim().slice(0, 300);
  throw new Error(`AI returned invalid JSON (${lastError?.message || 'parse failed'}): ${preview}`);
}

function buildJsonCandidates(content) {
  const cleaned = stripMarkdownFence(String(content || '').trim());
  const extracted = extractFirstJsonObject(cleaned) || cleaned;
  const withoutTrailingCommas = extracted.replace(/,\s*([}\]])/g, '$1');
  const repaired = closeJsonTail(withoutTrailingCommas);
  return Array.from(new Set([
    cleaned,
    extracted,
    withoutTrailingCommas,
    repaired,
  ].map((item) => item.trim()).filter(Boolean)));
}

function stripMarkdownFence(content) {
  return content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

function extractFirstJsonObject(content) {
  const start = content.indexOf('{');
  if (start === -1) return '';

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < content.length; index += 1) {
    const char = content[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      return content.slice(start, index + 1);
    }
  }

  return content.slice(start);
}

function closeJsonTail(content) {
  const stack = [];
  let inString = false;
  let escaped = false;

  for (const char of content) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') stack.push('}');
    if (char === '[') stack.push(']');
    if ((char === '}' || char === ']') && stack[stack.length - 1] === char) {
      stack.pop();
    }
  }

  let repaired = content.trimEnd();
  if (inString) repaired += '"';
  repaired = repaired.replace(/,\s*$/g, '');
  return repaired + stack.reverse().join('');
}

function formatCompetitorData(competitorData) {
  const valid = competitorData.filter((c) => c.outline && c.outline.length > 0);

  // 博客/文章类 URL：不限数量，完整 H1-H4
  const blogArticles = valid.filter(c => isBlogUrl(c.url));
  const blogText = blogArticles.map((c) => {
    const outlineText = c.outline
      .map((h) => `${'  '.repeat(h.level - 1)}H${h.level}: ${h.text}`)
      .join('\n');
    return `[Blog #${c.position}] ${c.title}\n${outlineText}`;
  }).join('\n\n---\n\n');

  // 非博客 URL：限制 4 篇，H1-H3，每篇最多 20 个标题
  const nonBlogArticles = valid.filter(c => !isBlogUrl(c.url)).slice(0, 4);
  const nonBlogText = nonBlogArticles.map((c) => {
    const outlineText = c.outline
      .filter(h => h.level <= 3)
      .slice(0, 20)
      .map((h) => `${'  '.repeat(h.level - 1)}H${h.level}: ${h.text}`)
      .join('\n');
    return `[#${c.position}] ${c.title}\n${outlineText}`;
  }).join('\n\n---\n\n');

  const parts = [blogText, nonBlogText].filter(Boolean);
  if (blogArticles.length > 0) {
    console.log(`  📝 Blog/article sources: ${blogArticles.length} (full H1-H4), other sources: ${nonBlogArticles.length} (H1-H3, max 4)`);
  }
  return parts.join('\n\n---\n\n');
}

async function loadOutlineKnowledgeContext(keyword) {
  const knowledge = loadConceptKnowledge(keyword);
  if (process.env.SEOMASTER_KNOWLEDGE_TRACE_FILE && !String(knowledge || '').trim()) {
    throw new Error('Knowledge base context is required for outline generation, but no current project knowledge was loaded.');
  }
  return knowledge;
}

function buildPrompt(keyword, competitorSummary, lang, maxWords, intent, scenes, keywords = [keyword], brief = '', knowledgeContext = '', structuredRequirements = {}) {
  const langInstruction =
    lang === 'zh'
      ? '用中文输出大纲标题。整篇大纲必须全部用中文，不得混入英文。'
      : 'Output ENTIRELY in English. Do NOT use any Chinese characters, even if the knowledge base below contains Chinese text.';

  // 1. 加载意图文件
  const intentContent = loadFileByName(`intent-${intent}.md`);
  const intentSection = intentContent
    ? `\n## Keyword Intent: ${intent}\n\nThe user has selected the following keyword intent. You MUST follow its preferred article type and writing focus.\n\n${intentContent}\n`
    : '';

  // 2. 加载大纲规则 (always_load: true)
  const outlineRules = loadFileByName('outline-rules.md');
  const rulesSection = outlineRules
    ? `\n## Outline Generation Rules (MUST FOLLOW)\n\n${outlineRules}\n`
    : '';

  // 3. 加载选中的业务场景（通用知识库文件，不绑定具体品牌）
  let scenesSection = '';
  if (scenes && scenes.length > 0) {
    const sceneParts = [];
    for (const scene of scenes) {
      const sceneContent = loadFileByName(`scene-${scene}.md`);
      if (sceneContent) {
        sceneParts.push(sceneContent);
      }
    }
    if (sceneParts.length > 0) {
      scenesSection = `\n## Business Scenes\n\nUse these selected scene notes only when they match the keyword. Do not force product mentions.\n\n${sceneParts.join('\n\n---\n\n')}\n`;
    }
  }

  // 5. 加载的文件统计
  const loadedParts = [];
  if (intentContent) loadedParts.push(`intent-${intent}`);
  if (outlineRules) loadedParts.push('outline-rules');
  if (scenes && scenes.length > 0) loadedParts.push(`scenes: ${scenes.join(', ')}`);
  if (loadedParts.length > 0) {
    console.log(`  📚 Prompt knowledge: ${loadedParts.join(' | ')}`);
  }

  const projectKnowledgeSection = knowledgeContext
    ? `\n## Current Project Knowledge\n\nUse this current project knowledge as the primary factual source. Competitor outlines are only for structure and coverage gaps. Do not expose internal labels, file names, workflow notes, vault names, or knowledge-base process details.\n\n${knowledgeContext}\n`
    : '';
  const structuredSection = formatStructuredRequirementPrompt(structuredRequirements, lang);

  return `You are an expert SEO content strategist. Generate an optimized article outline for the keyword: "${keyword}"

LANGUAGE RULE: ${langInstruction}
PRIMARY KEYWORD: "${keyword}"
SECONDARY KEYWORDS: ${(keywords || []).filter((item) => item && item !== keyword).join(', ') || 'none'}
WRITING BRIEF / LIMITS: ${brief || 'none'}

Use the primary keyword as the main topic. Use secondary keywords only when natural. Follow the writing brief strictly.
If WRITING BRIEF / LIMITS is not "none", the title, thesis, section angles, and FAQ MUST visibly reflect that brief. For repeated keywords, do not reuse a generic title when the brief changes; make the title specific to the requested angle, audience, constraint, or scenario.
${structuredSection ? `\n## Hard Structured Requirements\n\n${structuredSection}\n` : ''}
${intentSection}${rulesSection}
${projectKnowledgeSection}
## Competitor Outlines

${competitorSummary}
${scenesSection}
## Word Count Constraint

Total article must be ${Math.round(maxWords * 0.8)}-${maxWords} words. Sum of all section word_count values MUST NOT exceed ${maxWords}.
For a ${maxWords}-word article, prefer 3-4 H2 sections. Keep FAQ brief.

## GEO Heading Rules

- H2 headings must read like natural user questions or decisions, not keyword-stuffed SEO labels.
- Use helpful phrases a reader would ask in an AI search answer.
- Avoid mechanical headings like "keyword + guide", "keyword recommendation", or internal workflow terms.
- Do not mention internal research, competitor scraping, data sources, workflow, report, outline, vault, or knowledge base in public headings.

## Output Format (JSON only, no markdown wrapper):

{
  "title": "H1 article title (include keyword)",
  "meta_description": "120-160 char SEO description with keyword",
  "keyword": "${keyword}",
  "intent": "${intent}",
  "keyword_variants": ["variant1", "variant2", "variant3"],
  "thesis": {
    "candidates": ["publishable thesis option 1", "publishable thesis option 2"],
    "recommended": "one clear sentence stating the core takeaway for the reader"
  },
  "competitor_insights": {
    "common_topics": ["topic covered by multiple competitors"],
    "gap_opportunities": ["topic missing from most competitors"]
  },
  "sections": [
    {
      "h2": "Section title",
      "key_point": "One sentence: what will reader learn/believe after this section",
      "evidence": ["specific proof point, product fact, or source-backed angle to mention"],
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
  "cta": {
    "text": "action-oriented CTA text",
    "url": "official product or docs URL when available",
    "placement": "文末"
  },
  "total_word_count": ${maxWords},
  "product_integration": null
}`;
}

module.exports = { generateOutline };
