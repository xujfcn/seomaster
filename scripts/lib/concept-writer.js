// seomaster/scripts/lib/concept-writer.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { getDefaultCta, getDefaultThesis } = require('./project-config');
const { inferStructuredRequirements } = require('./structured-requirements');

function isFilled(value) {
  return typeof value === 'string' && value.trim() && !value.trim().startsWith('[待');
}

function firstFilled(...values) {
  return values.find((value) => isFilled(value)) || '';
}

function normalizeCandidates(candidates, fallback) {
  const items = Array.isArray(candidates) ? candidates.filter(isFilled) : [];
  if (fallback && !items.includes(fallback)) {
    items.unshift(fallback);
  }
  return items;
}

/**
 * 把 AI 大纲结构写入 article-concept.yaml
 * @param {string} slug - 文章 slug（用于文件名）
 * @param {string} keyword - 原始关键词
 * @param {object} outline - AI 生成的大纲对象
 * @param {Array} competitorData - 原始竞品数据
 * @param {string} outputDir - 输出目录
 * @param {object} options - { lang, market, intent }
 */
function writeConceptYaml(slug, keyword, outline, competitorData, outputDir, options = {}) {
  if (!outline.sections || !Array.isArray(outline.sections)) {
    throw new Error('AI outline missing sections array. Raw response may be malformed.');
  }
  const defaultThesis = getDefaultThesis();
  const defaultCta = getDefaultCta();
  const canUseGlobalDefaults = [outline.title, keyword, options.project || '']
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(String(defaultCta.product || '').toLowerCase()))
    && defaultCta.product;
  const resolvedThesis = firstFilled(
    outline.thesis?.recommended,
    outline.thesis?.final,
    outline.thesis?.statement,
    canUseGlobalDefaults ? defaultThesis : '',
    outline.meta_description,
    outline.title
  );
  const thesisCandidates = normalizeCandidates(outline.thesis?.candidates, resolvedThesis);
  const structuredRequirements = inferStructuredRequirements({
    keyword,
    keywords: options.keywords || [],
    brief: options.brief || '',
    intent: options.intent || outline.intent || '',
  });

  // 转换 sections 格式
  const sections = outline.sections.map((s) => {
    const allH3 = s.h3_items || [];
    return {
      title: s.h2,
      key_point: s.key_point,
      evidence: Array.isArray(s.evidence) && s.evidence.length > 0
        ? s.evidence
        : ['Use a verifiable source or product data point to support this section.'],
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
    lang: options.lang || outline.lang || 'en',
    market: options.market || outline.market || '',
    intent: options.intent || outline.intent || '',
    keyword_variants: Array.from(new Set([...(options.keywords || []), ...(outline.keyword_variants || [])])).filter(Boolean),
    writing_brief: options.brief || '',
    structured_requirements: structuredRequirements,
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
      statement: resolvedThesis,
      candidates: thesisCandidates,
      final: resolvedThesis,
    },

    // 文章结构
    sections: sections,

    // FAQ
    faq: outline.faq || [],

    // 产品融合信息（可选，必须来自当前项目知识库）
    product_integration: outline.product_integration || null,

    // CTA
    cta: {
      text: firstFilled(outline.cta?.text, canUseGlobalDefaults ? defaultCta.text : '', options.lang === 'zh' ? '查看产品说明' : `Learn more about ${keyword}`),
      url: firstFilled(outline.cta?.url, canUseGlobalDefaults ? defaultCta.url : '', '#'),
      placement: firstFilled(outline.cta?.placement, outline.cta_placement, '文末'),
    },

    // 配图汇总
    images_needed: extractImageRequirements(outline.sections),

    // 字数
    word_count: {
      target: outline.total_word_count,
      max: outline.total_word_count,
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
    status: 'ready_for_draft',
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
