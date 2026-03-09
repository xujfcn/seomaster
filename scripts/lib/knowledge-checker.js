//seomaster/scripts/lib/knowledge-checker.js

const { loadObsidianKnowledge, getKnowledgeBasePath } = require('./knowledge');
const fs = require('fs');

/**
 * 检查知识库中是否有足够的信息来生成文章
 * @param {string} keyword - 关键词
 * @returns {object} { hasEnoughInfo: boolean, knowledge: string, suggestions: [] }
 */
function checkKnowledgeBase(keyword) {
  const vaultPath = getKnowledgeBasePath();

  if (!vaultPath || !fs.existsSync(vaultPath)) {
    return {
      hasEnoughInfo: false,
      knowledge: '',
      suggestions: ['No knowledge base configured']
    };
  }

  // 加载知识库
  const knowledge = loadObsidianKnowledge(keyword, 15000);

  if (!knowledge || knowledge.length < 500) {
    return {
      hasEnoughInfo: false,
      knowledge,
      suggestions: [
        'Knowledge base has insufficient information',
        'Will proceed with Google search for competitor research'
      ]
    };
  }

  // 检查是否包含关键信息
  const hasCompetitorInfo = knowledge.toLowerCase().includes('competitor') ||
                           knowledge.toLowerCase().includes('竞品');
  const hasPricingInfo = knowledge.toLowerCase().includes('pricing') ||
                        knowledge.toLowerCase().includes('price') ||
                        knowledge.toLowerCase().includes('价格');
  const hasFeatureInfo = knowledge.toLowerCase().includes('feature') ||
                        knowledge.toLowerCase().includes('功能');

  const suggestions = [];
  if (!hasCompetitorInfo) suggestions.push('Consider adding competitor analysis to knowledge base');
  if (!hasPricingInfo) suggestions.push('Consider adding pricing information to knowledge base');
  if (!hasFeatureInfo) suggestions.push('Consider adding feature descriptions to knowledge base');

  return {
    hasEnoughInfo: knowledge.length >= 1000,
    knowledge,
    suggestions,
    stats: {
      hasCompetitorInfo,
      hasPricingInfo,
      hasFeatureInfo,
      knowledgeLength: knowledge.length
    }
  };
}

module.exports = {
  checkKnowledgeBase
};
