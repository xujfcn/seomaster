// seomaster/scripts/lib/outline-scraper.js
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4'];
const FETCH_TIMEOUT = 10000; // 10秒超时，慢站直接跳过
const CONCURRENCY = 5; // 同时抓取数量

/**
 * 并发抓取多篇文章的 H1-H4 大纲
 * @param {Array<{ position, title, url }>} articles
 * @returns {Promise<Array<{ position, title, url, outline, error }>>}
 */
async function scrapeOutlines(articles) {
  const results = [];
  // 分批并发，每批 CONCURRENCY 个
  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const batch = articles.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(scrapeOne));
    results.push(...batchResults);
    if (i + CONCURRENCY < articles.length) {
      await sleep(500); // 批次间短暂休息，避免被封
    }
  }
  return results;
}

async function scrapeOne(article) {
  const { position, title, url } = article;
  console.log(`  [${position}] Scraping: ${url}`);
  try {
    const res = await fetch(url, {
      timeout: FETCH_TIMEOUT,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SEOMaster/1.0; +https://lemondata.ai)',
        Accept: 'text/html',
      },
    });

    if (!res.ok) {
      return { position, title, url, outline: [], error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const outline = extractOutline(html);

    return { position, title, url, outline, error: null };
  } catch (err) {
    return { position, title, url, outline: [], error: err.message };
  }
}

/**
 * 从 HTML 提取 H1-H4 大纲
 * @param {string} html
 * @returns {Array<{ level: number, text: string }>}
 */
function extractOutline(html) {
  const $ = cheerio.load(html);

  // 移除 nav、header、footer、aside 中的标题（避免噪音）
  $('nav, header, footer, aside, .sidebar, .menu, .navigation').remove();

  const headings = [];
  $(HEADING_TAGS.join(',')).each((_, el) => {
    const tag = el.name.toLowerCase();
    const level = parseInt(tag[1]);
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (text && text.length > 2 && text.length < 200) {
      headings.push({ level, text });
    }
  });

  return headings;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { scrapeOutlines };
