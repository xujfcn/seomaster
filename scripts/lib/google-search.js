// seomaster/scripts/lib/google-search.js
const fetch = require('node-fetch');
const { shouldFilterUrl, EXCLUDED_DOMAINS } = require('../../config/domain-filter');

const APIFY_BASE = 'https://api.apify.com/v2';
const ACTOR_ID = 'apify~google-search-scraper';

/**
 * 用 Apify 搜索 Google，返回前 maxResults 条 organic results
 * @param {string} keyword - 搜索关键词
 * @param {object} options - { lang: 'en', market: 'us', maxResults: 10, filterDomains: true }
 * @returns {Promise<Array<{ position, title, url, description }>>}
 */
async function searchGoogle(keyword, options = {}) {
  const { lang = 'en', market = 'us', maxResults = 10, filterDomains = true } = options;
  const token = require('./config').apifyToken();

  // Apify 需要完整的语言代码（zh-CN 而不是 zh）
  const langMap = { zh: 'zh-CN', 'zh-tw': 'zh-TW', pt: 'pt-BR' };
  const languageCode = langMap[lang.toLowerCase()] || lang;

  // 启动 Actor run，使用 waitForFinish=120 让 Apify 服务端等待，避免客户端轮询
  const runRes = await fetch(
    `${APIFY_BASE}/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}&waitForFinish=120`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 150000, // 150s，比 Apify 等待时间多一些
      body: JSON.stringify({
        queries: keyword,
        languageCode: languageCode,
        countryCode: market.toLowerCase(),
        maxPagesPerQuery: 1,
        resultsPerPage: maxResults,
        saveHtml: false,
        saveHtmlToKeyValueStore: false,
      }),
    }
  );

  if (!runRes.ok) {
    const text = await runRes.text();
    throw new Error(`Apify run failed: ${runRes.status} ${text}`);
  }

  const items = await runRes.json();

  if (!items || !items.length) throw new Error('Apify returned empty dataset');

  const organic = items[0].organicResults || [];

  // 过滤结果
  let results = organic.slice(0, maxResults * 2); // 多取一些，以防过滤后不够

  if (filterDomains) {
    const beforeCount = results.length;
    results = results.filter(r => !shouldFilterUrl(r.url));
    const filteredCount = beforeCount - results.length;
    if (filteredCount > 0) {
      console.log(`  🚫 Filtered out ${filteredCount} forum/Q&A sites (reddit, quora, etc.)`);
    }
  }

  // 取前 maxResults 个
  return results.slice(0, maxResults).map((r, i) => ({
    position: i + 1,
    title: r.title,
    url: r.url,
    description: r.description || '',
  }));
}


module.exports = { searchGoogle };
