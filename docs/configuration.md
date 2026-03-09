# SEOMaster 配置说明

## 图片生成模型配置

### 当前模型

**Gemini 3.1 Flash Image Preview**

```javascript
// scripts/generate-images.js
model: 'gemini-3.1-flash-image-preview'
```

### API 配置

在 `.env` 文件中配置：

```bash
# AI API（用于文本和图片生成）
AI_API_KEY=sk-your-api-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o

# 图片生成使用相同的 API 配置
# 模型在代码中指定为 gemini-3.1-flash-image-preview
```

### 支持的模型

#### Gemini 系列（推荐）

- `gemini-3.1-flash-image-preview` - 快速、高性价比（当前使用）
- `gemini-pro-vision` - 高质量图片生成

#### DALL-E 系列

- `dall-e-3` - OpenAI 官方模型
- `dall-e-2` - 旧版本

### 切换模型

编辑 `scripts/generate-images.js`：

```javascript
// 第 54 行左右
body: JSON.stringify({
  model: 'gemini-3.1-flash-image-preview',  // 修改这里
  messages: [
    {
      role: 'user',
      content: imagePrompt
    }
  ],
  max_tokens: 4096,
  temperature: 0.7
})
```

### 响应格式

#### Gemini 格式

```json
{
  "choices": [
    {
      "message": {
        "content": "data:image/png;base64,iVBORw0KGgoAAAANS...",
        // 或
        "image_url": "https://example.com/image.png"
      }
    }
  ]
}
```

#### DALL-E 格式

```json
{
  "data": [
    {
      "url": "https://example.com/image.png"
    }
  ]
}
```

---

## 大纲生成逻辑配置

### What-Why-How 逻辑

**位置**：`scripts/lib/ai-outline-generator.js`

**当前策略**：

```
1. 分析竞品大纲结构
2. 如果竞品有成功的模式，优先采用
3. 否则，使用 What-Why-How 作为备选
4. 确保结构自然、不生硬
```

### Prompt 配置

```javascript
// scripts/lib/ai-outline-generator.js - buildPrompt()

1. **Structure logic**: Follow natural human thinking patterns (What → Why → How), but adapt to the competitor outlines:
   - **Analyze competitor structures first**: Study how top-ranking articles organize their content
   - **Adapt, don't force**: If competitors use a different logical flow that works well, follow it
   - **General guidance** (use flexibly, not rigidly):
     * What is it? (definition, background, context)
     * Why does it matter? (pain points, benefits, use cases)
     * How to do it? (practical steps, examples, comparisons)
     * What to watch out for? (limitations, alternatives, FAQs)
   - **Priority**: Competitor patterns > What-Why-How template
   - **Natural flow**: Sections should feel organic, not formulaic
```

### 自定义大纲逻辑

如果你想调整大纲生成逻辑，编辑 `scripts/lib/ai-outline-generator.js` 的 `buildPrompt()` 函数：

```javascript
function buildPrompt(keyword, competitorSummary, lang, maxWords) {
  // ...

  return `You are an expert SEO content strategist...

### Rules:

1. **Structure logic**: [在这里修改大纲逻辑]
   - 你的自定义规则
   - ...

2. **Keyword coverage**: ...
  `;
}
```

### 示例：强制使用 What-Why-How

如果你想强制使用 What-Why-How 结构：

```javascript
1. **Structure logic**: STRICTLY follow What-Why-How pattern:
   - Section 1: What is it? (definition, background)
   - Section 2: Why does it matter? (pain points, benefits)
   - Section 3: How to use it? (practical steps)
   - Section 4: What to watch out for? (limitations, FAQs)
```

### 示例：完全自由结构

如果你想让 AI 完全自由发挥：

```javascript
1. **Structure logic**: Analyze competitor structures and create the most effective outline:
   - Study top-ranking articles
   - Identify successful patterns
   - Create a unique, optimized structure
   - No rigid templates - adapt to the topic
```

---

## 域名过滤配置

**位置**：`config/domain-filter.js`

### 黑名单（过滤的域名）

```javascript
const EXCLUDED_DOMAINS = [
  // 英文论坛/问答
  'reddit.com',
  'quora.com',
  'stackoverflow.com',

  // 中文论坛/问答
  'zhihu.com',
  'v2ex.com',

  // 社交媒体
  'twitter.com',
  'facebook.com',

  // 添加你想过滤的域名
  'example.com',
];
```

### 白名单（保留的域名）

```javascript
const ALLOWED_DOMAINS = [
  // 即使在黑名单中也会保留
  'blog.reddit.com',
  'engineering.twitter.com',
];
```

### 禁用过滤

命令行参数：

```bash
seomaster new "keyword" --no-filter
```

或在代码中：

```javascript
// scripts/generate-concept.js
const searchResults = await searchGoogle(keyword, {
  lang,
  market,
  maxResults,
  filterDomains: false  // 禁用过滤
});
```

---

## 知识库配置

**位置**：`projects.json`

### 项目配置

```json
{
  "projects": {
    "my-product": {
      "name": "My Product",
      "vault_path": "D:/my-product-vault",  // Obsidian 知识库路径
      "description": "Product description",
      "output_dir": "output",
      "default_lang": "en",
      "default_market": "us",
      "default_words": 2500,
      "default_results": 5
    }
  },
  "current_project": "my-product"
}
```

### 知识库结构

```
D:/my-product-vault/
├── Core/              # 核心知识（总是加载）
│   └── Product.md
├── Domain/            # 领域知识（按关键词匹配）
│   ├── Pricing.md
│   └── API.md
├── Competitors/       # 竞品分析
└── Cases/             # 使用案例
```

### YAML Front Matter

```yaml
---
type: core|domain|competitor|case
priority: critical|high|medium|low
keywords: [pricing, api, cost]
tags: [feature, comparison]
last_updated: 2026-03-09
always_load: true
---

# 文件内容
```

---

## 质量标准配置

**位置**：`scripts/quality-check.js`

### 禁用词

```javascript
const FORBIDDEN_WORDS = [
  '首先', '其次', '最后',
  '本文', '让我们',
  '颠覆性', '革命性', '赋能',
  // 添加你的禁用词
];
```

### 标点限制

```javascript
const LIMITS = {
  bold: 3,        // Bold ≤ 3
  emDash: 3,      // Em dash (——) ≤ 3
  exclamation: 2  // Exclamation (!) ≤ 2
};
```

---

## 相关文档

- [交互式使用指南](docs/interactive-guide.md)
- [域名过滤说明](docs/domain-filtering.md)
- [快速参考](QUICK-REFERENCE.md)
- [更新日志](CHANGELOG.md)
