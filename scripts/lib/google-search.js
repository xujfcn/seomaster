// seomaster/scripts/lib/google-search.js
const fetch = require('node-fetch');

const APIFY_BASE = 'https://api.apify.com/v2';
const ACTOR_ID = 'apify~google-search-scraper';

/**
 * 用 Apify 搜索 Google，返回前 maxResults 条 organic results
 * @param {string} keyword - 搜索关键词
 * @param {object} options - { lang: 'en', market: 'us', maxResults: 10 }
 * @returns {Promise<Array<{ position, title, url, description }>>}
 */
async function searchGoogle(keyword, options = {}) {
  const { lang = 'en', market = 'us', maxResults = 10 } = options;
  const token = require('./config').apifyToken();

  // Apify 需要完整的语言代码（zh-CN 而不是 zh）
  const langMap = { zh: 'zh-CN', 'zh-tw': 'zh-TW', pt: 'pt-BR' };
  const languageCode = langMap[lang.toLowerCase()] || lang;

  // 启动 Actor run
  const runRes = await fetch(
    `${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  const runData = await runRes.json();
  const runId = runData.data.id;

  // 轮询等待完成（最多 120 秒）
  console.log(`  Apify run started: ${runId}, waiting...`);
  const datasetId = await waitForRun(runId, token);

  // 取结果
  const itemsRes = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&limit=1`
  );
  const items = await itemsRes.json();

  if (!items || !items.length) throw new Error('Apify returned empty dataset');

  const organic = items[0].organicResults || [];
  return organic.slice(0, maxResults).map((r, i) => ({
    position: i + 1,
    title: r.title,
    url: r.url,
    description: r.description || '',
  }));
}

async function waitForRun(runId, token, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(3000);
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
    const data = await res.json();
    const status = data.data.status;
    if (status === 'SUCCEEDED') return data.data.defaultDatasetId;
    if (status === 'FAILED' || status === 'ABORTED') {
      throw new Error(`Apify run ${status}: ${runId}`);
    }
  }
  throw new Error(`Apify run timeout after ${timeoutMs}ms`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { searchGoogle };
