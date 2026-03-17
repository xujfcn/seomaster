const { normalizeText, slugify } = require('./article-index');

function tokenize(text) {
  return normalizeText(text)
    .split(/[^a-z0-9\u4e00-\u9fa5]+/)
    .filter(Boolean);
}

function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));

  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersection++;
    }
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function detectDuplicates(input, index) {
  const topicKey = input.topic_key || slugify(input.keyword || input.slug || input.title);
  const slug = slugify(input.slug || input.keyword || input.title);
  const keyword = normalizeText(input.keyword);
  const title = input.title || input.keyword || '';

  const exactTopic = (index.topics || []).find((topic) => normalizeText(topic.topic_key) === normalizeText(topicKey));
  const exactSlug = (index.articles || []).find((article) => normalizeText(article.slug) === normalizeText(slug));
  const exactKeyword = (index.topics || []).find((topic) => {
    if (normalizeText(topic.canonical_keyword) === keyword) return true;
    return (topic.aliases || []).some((alias) => normalizeText(alias) === keyword);
  });

  const similarArticles = (index.articles || [])
    .map((article) => ({
      ...article,
      title_similarity: jaccardSimilarity(title, article.title || article.keyword || ''),
      keyword_similarity: jaccardSimilarity(keyword, article.keyword || article.title || ''),
    }))
    .filter((article) => article.title_similarity >= 0.75 || article.keyword_similarity >= 0.8)
    .sort((a, b) => Math.max(b.title_similarity, b.keyword_similarity) - Math.max(a.title_similarity, a.keyword_similarity));

  const reasons = [];
  let decision = 'allow_new';

  if (exactSlug) {
    decision = 'block';
    reasons.push(`slug already exists in ${exactSlug.relative_path}`);
  } else if (exactTopic || exactKeyword) {
    decision = 'update_existing';
    const matched = exactTopic || exactKeyword;
    reasons.push(`topic already exists: ${matched.topic_key}`);
  } else if (similarArticles.length > 0) {
    decision = 'review_duplicate';
    reasons.push(`found ${similarArticles.length} similar article(s)`);
  }

  return {
    decision,
    topic_key: topicKey,
    matched_topic: exactTopic || exactKeyword || null,
    matched_slug: exactSlug || null,
    similar_articles: similarArticles.slice(0, 5),
    reasons,
  };
}

module.exports = {
  detectDuplicates,
  jaccardSimilarity,
};
