/**
 * 域名过滤配置
 *
 * 用于 generate-concept.js 过滤不适合作为文章参考的网站类型
 */

// 需要过滤的域名（论坛、问答、社交媒体等）
const EXCLUDED_DOMAINS = [
  // 英文论坛/问答
  'reddit.com',
  'quora.com',
  'stackoverflow.com',
  'stackexchange.com',
  'news.ycombinator.com',
  'hackernews.com',

  // 社交媒体
  'facebook.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'youtube.com',
  'instagram.com',
  'tiktok.com',

  // 中文论坛/问答
  'zhihu.com',
  'v2ex.com',
  'segmentfault.com',

  // 中文技术社区（可选）
  // 'juejin.cn',      // 掘金：质量参差不齐，可选择性过滤
  // 'csdn.net',       // CSDN：质量参差不齐，可选择性过滤

  // 产品发布平台
  'producthunt.com',

  // 其他
  'wikipedia.org',    // 维基百科：通常不适合作为 SEO 文章参考
];

// 允许的域名（白名单，优先级高于黑名单）
// 如果某个域名在黑名单中但你想保留，可以添加到这里
const ALLOWED_DOMAINS = [
  // 例如：'blog.reddit.com',  // Reddit 官方博客
];

/**
 * 检查 URL 是否应该被过滤
 * @param {string} url
 * @returns {boolean} true 表示应该过滤掉
 */
function shouldFilterUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // 检查白名单
    const isAllowed = ALLOWED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
    if (isAllowed) return false;

    // 检查黑名单
    return EXCLUDED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false; // URL 解析失败，保留
  }
}

module.exports = {
  EXCLUDED_DOMAINS,
  ALLOWED_DOMAINS,
  shouldFilterUrl,
};
