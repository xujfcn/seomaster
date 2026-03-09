# 域名过滤功能说明

## 概述

在生成文章大纲（Concept）时，SEOMaster 会从 Google 搜索结果中抓取竞品文章的结构。为了确保参考内容的质量，系统默认启用 **Blog-Only 模式**，自动过滤掉论坛、问答、社交媒体等网站。

## 为什么需要过滤？

### 问题

不同类型的网站内容质量和结构差异很大：

| 网站类型 | 内容特点 | 是否适合参考 |
|---------|---------|------------|
| 技术博客 | 结构化、深度内容、专业写作 | ✅ 适合 |
| 公司官网 | 产品介绍、案例研究、教程 | ✅ 适合 |
| 论坛帖子 | 讨论式、多人回复、结构松散 | ❌ 不适合 |
| 问答网站 | 问题+答案、碎片化、质量参差 | ❌ 不适合 |
| 社交媒体 | 短内容、非正式、缺乏结构 | ❌ 不适合 |

### 影响

如果不过滤，可能导致：
- AI 生成的大纲结构混乱（受论坛讨论式结构影响）
- 内容深度不足（受问答式碎片化影响）
- 专业性下降（受社交媒体非正式语言影响）

## 默认过滤规则

### 英文网站

**论坛/问答**：
- reddit.com
- quora.com
- stackoverflow.com
- stackexchange.com
- news.ycombinator.com (Hacker News)

**社交媒体**：
- twitter.com / x.com
- facebook.com
- linkedin.com
- youtube.com
- instagram.com
- tiktok.com

**其他**：
- producthunt.com
- wikipedia.org

### 中文网站

**论坛/问答**：
- zhihu.com（知乎）
- v2ex.com
- segmentfault.com（思否）

**技术社区**（可选）：
- juejin.cn（掘金）- 默认不过滤，质量参差不齐
- csdn.net（CSDN）- 默认不过滤，质量参差不齐

## 使用方法

### 默认模式（启用过滤）

```bash
node scripts/generate-concept.js \
  --keyword "openrouter alternative" \
  --slug openrouter-alternative
```

输出示例：
```
[1/4] Searching Google for top 10 results...
  🚫 Filtered out 3 forum/Q&A sites (reddit, quora, etc.)
  Found 10 results
```

### 禁用过滤

如果你想包含所有类型的网站：

```bash
node scripts/generate-concept.js \
  --keyword "openrouter alternative" \
  --slug openrouter-alternative \
  --no-filter
```

## 自定义过滤规则

编辑 `seomaster/config/domain-filter.js`：

```javascript
// 黑名单：会被过滤的域名
const EXCLUDED_DOMAINS = [
  'reddit.com',
  'quora.com',
  // 添加你想过滤的域名
  'example.com',
];

// 白名单：即使在黑名单中也会保留
const ALLOWED_DOMAINS = [
  // 例如：Reddit 官方博客
  'blog.reddit.com',
];
```

### 示例：过滤 CSDN

如果你觉得 CSDN 质量不够好，可以添加到黑名单：

```javascript
const EXCLUDED_DOMAINS = [
  // ... 其他域名
  'csdn.net',
];
```

### 示例：保留知乎专栏

如果你想过滤知乎问答但保留知乎专栏：

```javascript
const EXCLUDED_DOMAINS = [
  'zhihu.com',
];

const ALLOWED_DOMAINS = [
  'zhuanlan.zhihu.com',  // 知乎专栏
];
```

## 工作原理

### 过滤流程

```
Google 搜索结果（前 20 条）
    ↓
检查每个 URL 的域名
    ↓
白名单检查（优先级最高）
    ↓
黑名单检查
    ↓
保留前 10 条通过过滤的结果
```

### 代码实现

```javascript
function shouldFilterUrl(url) {
  const hostname = new URL(url).hostname.toLowerCase();

  // 1. 检查白名单
  if (ALLOWED_DOMAINS.some(d => hostname.endsWith(d))) {
    return false; // 保留
  }

  // 2. 检查黑名单
  if (EXCLUDED_DOMAINS.some(d => hostname.endsWith(d))) {
    return true; // 过滤
  }

  return false; // 默认保留
}
```

## 最佳实践

### 何时启用过滤（推荐）

- 生成技术博客文章
- 生成产品对比文章
- 生成教程类文章
- 目标是高质量、结构化的内容

### 何时禁用过滤

- 研究用户讨论和痛点（Reddit/Quora 有价值）
- 分析社区反馈
- 需要多样化的视角
- 关键词搜索结果中博客文章很少

### 混合策略

1. **第一次运行**：启用过滤，生成高质量大纲
2. **补充研究**：禁用过滤，单独抓取论坛讨论
3. **人工整合**：将论坛中的用户痛点整合到大纲中

```bash
# 步骤 1: 生成博客大纲
node scripts/generate-concept.js --keyword "ai api pricing" --slug ai-api-pricing

# 步骤 2: 抓取论坛讨论（用于补充用户痛点）
node scripts/generate-concept.js --keyword "ai api pricing reddit" --slug ai-api-pricing-reddit --no-filter
```

## 效果对比

### 启用过滤（Blog-Only）

**抓取结果**：
1. blog.openai.com - "API Pricing Guide"
2. anthropic.com/blog - "Claude API Pricing"
3. dev.to/user - "Comparing AI API Costs"
4. medium.com/@author - "AI API Price Analysis"

**生成的大纲**：
- 结构清晰（Introduction → Comparison → Conclusion）
- 深度内容（每个 section 有 3-5 个子标题）
- 专业语言（技术术语准确）

### 禁用过滤（All Sites）

**抓取结果**：
1. blog.openai.com - "API Pricing Guide"
2. reddit.com/r/MachineLearning - "Which API is cheapest?"
3. quora.com - "What's the best AI API?"
4. stackoverflow.com - "How to reduce API costs?"

**生成的大纲**：
- 结构混乱（受讨论式影响）
- 深度不足（受问答式影响）
- 语言非正式（受社交媒体影响）

## 故障排除

### 问题：过滤后结果太少

**原因**：关键词搜索结果中博客文章本来就少

**解决方案**：
1. 调整关键词（添加 "blog", "guide", "tutorial" 等）
2. 增加抓取数量：`--results 15`
3. 临时禁用过滤：`--no-filter`

### 问题：想保留某个特定网站

**解决方案**：
添加到白名单 `ALLOWED_DOMAINS`

### 问题：想过滤更多网站

**解决方案**：
添加到黑名单 `EXCLUDED_DOMAINS`

## 相关文档

- [新项目使用指南](./new-project-guide.md)
- [快速开始指南](./quick-start.md)
- [配置文件](../config/domain-filter.js)

---

**推荐设置**：保持默认的 Blog-Only 模式，确保生成高质量的文章大纲。
