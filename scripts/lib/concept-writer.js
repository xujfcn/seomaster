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
  if (!outline.sections || !Array.isArray(outline.sections)) {
    throw new Error('AI outline missing sections array. Raw response may be malformed.');
  }
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

    // DICloak 融合信息
    dicloak_integration: outline.dicloak_integration || null,

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
