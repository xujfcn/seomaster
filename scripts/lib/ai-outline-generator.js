// seomaster/scripts/lib/ai-outline-generator.js
const fetch = require('node-fetch');
const config = require('./config');
const { loadFileByName, loadContentByType } = require('./knowledge');
const { isBlogUrl } = require('../../config/domain-filter');

/**
 * 调用 AI API，根据竞品大纲生成本文大纲
 * @param {string} keyword - 目标关键词
 * @param {Array<{ position, title, url, outline }>} competitorData
 * @param {object} options - { lang, maxWords, intent, scenes }
 * @returns {Promise<object>} - 结构化大纲对象
 */
async function generateOutline(keyword, competitorData, options = {}) {
  const { lang = 'en', maxWords = 15000, intent = 'informational', scenes = [] } = options;

  const competitorSummary = formatCompetitorData(competitorData);
  const prompt = buildPrompt(keyword, competitorSummary, lang, maxWords, intent, scenes);

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

  // Debug: 保存完整 API 响应
  const fs = require('fs');
  const debugApiPath = require('path').join(process.cwd(), 'output', 'debug-api-full-response.json');
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
  const debugPath = require('path').join(process.cwd(), 'output', 'debug-ai-response.txt');
  fs.writeFileSync(debugPath, content, 'utf8');
  console.log(`[DEBUG] AI content saved to: ${debugPath}`);
  console.log(`[DEBUG] Content length: ${content.length}`);

  // Debug: 保存完整 prompt
  const debugPromptPath = require('path').join(process.cwd(), 'output', 'debug-prompt.txt');
  fs.writeFileSync(debugPromptPath, prompt, 'utf8');
  console.log(`[DEBUG] Prompt saved to: ${debugPromptPath}`);
  console.log(`[DEBUG] Prompt length: ${prompt.length}`);

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

function buildPrompt(keyword, competitorSummary, lang, maxWords, intent, scenes) {
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

  // 3. 加载 DICloak 基础介绍
  const dicloakIntro = loadFileByName('dicloak-intro.md');
  const introSection = dicloakIntro
    ? `\n## DICloak Product Information\n\n${dicloakIntro}\n`
    : '';

  // 4. 加载选中的业务场景
  let scenesSection = '';
  if (scenes && scenes.length > 0) {
    const sceneParts = [];
    for (const scene of scenes) {
      const sceneContent = loadFileByName(`dicloak-scene-${scene}.md`);
      if (sceneContent) {
        sceneParts.push(sceneContent);
      }
    }
    if (sceneParts.length > 0) {
      scenesSection = `\n## DICloak Business Scenes to Integrate\n\nThe user has selected the following DICloak business scenes. Integrate them naturally according to the outline rules (max 1 main integration section).\n\n${sceneParts.join('\n\n---\n\n')}\n`;
    }
  }

  // 5. 加载的文件统计
  const loadedParts = [];
  if (intentContent) loadedParts.push(`intent-${intent}`);
  if (outlineRules) loadedParts.push('outline-rules');
  if (dicloakIntro) loadedParts.push('dicloak-intro');
  if (scenes && scenes.length > 0) loadedParts.push(`scenes: ${scenes.join(', ')}`);
  if (loadedParts.length > 0) {
    console.log(`  📚 Prompt knowledge: ${loadedParts.join(' | ')}`);
  }

  return `You are an expert SEO content strategist. Generate an optimized article outline for the keyword: "${keyword}"

LANGUAGE RULE: ${langInstruction}
${intentSection}${rulesSection}
## Competitor Outlines

${competitorSummary}
${introSection}${scenesSection}
## Word Count Constraint

Total article must be ${Math.round(maxWords * 0.8)}-${maxWords} words. Sum of all section word_count values MUST NOT exceed ${maxWords}.

## Output Format (JSON only, no markdown wrapper):

{
  "title": "H1 article title (include keyword)",
  "meta_description": "120-160 char SEO description with keyword",
  "keyword": "${keyword}",
  "intent": "${intent}",
  "keyword_variants": ["variant1", "variant2", "variant3"],
  "competitor_insights": {
    "common_topics": ["topic covered by multiple competitors"],
    "gap_opportunities": ["topic missing from most competitors"]
  },
  "sections": [
    {
      "h2": "Section title",
      "key_point": "One sentence: what will reader learn/believe after this section",
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
  "total_word_count": ${maxWords},
  "dicloak_integration": {
    "section_index": 5,
    "integration_type": "natural scene mention",
    "product_angle": "Which specific DICloak feature/benefit solves the problem in this section",
    "talking_points": ["concrete point 1 connecting the section topic to DICloak", "concrete point 2"]
  }
}`;
}

module.exports = { generateOutline };
