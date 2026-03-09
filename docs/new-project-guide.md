# SEOMaster 新项目使用指南

从零开始构建知识库并生成高质量 SEO 文章的完整指南。

## 核心理念

SEOMaster 是一个 **AI 驱动的 SEO 内容生成工具**，通过知识库驱动的方式生成高质量文章。关键特点：

- **知识库驱动**：所有文章基于结构化知识库生成，确保数据准确性
- **7 步工作流**：Research → Thesis → Concept → Write → Review → Rewrite → Publish
- **多项目支持**：可为不同产品维护独立知识库

---

## 完整流程（7 步）

```
Step 0: 配置 API 密钥（.env）
Step 1: 搭建知识库（knowledge/）
Step 2: [可选] 生成项目配置（init-project → project-config.yaml）
Step 3: 生成文章大纲（generate-concept → concept.yaml）
Step 4: 生成初稿（generate-draft → draft.md）
Step 5: 硬指标检查（quality-check）
Step 6: SOP 评审（seo-review）
Step 7: 人工完善 → 发布
```

---

## Step 0: 配置 API 密钥

在 `seomaster/.env` 创建配置文件：

```env
# AI API（OpenAI 兼容格式）
AI_API_KEY=sk-your-api-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o

# Apify（用于 Google 搜索抓取）
APIFY_API_TOKEN=apify_api_your-token
```

---

## Step 1: 搭建知识库（核心步骤）

知识库是所有文章的数据源，放在 `seomaster/knowledge/` 目录下。

### 知识库结构

```
knowledge/
├── product.md              # 产品功能、定价、技术规格、目标用户
├── competitors.md          # 竞品功能对比、SEO 竞争格局
├── models_pricing.md       # 主流模型定价表（旗舰/中端/高性价比）
├── benchmarks.md           # 模型 benchmark 数据（编程/推理/数学）
├── published_articles.md   # 已发布文章索引（避免重复选题）
└── target_keywords.md      # 目标关键词库（搜索量/KD/状态）
```

### 知识库维护原则

- 所有数据标注 **来源 + 日期**
- 价格数据变动时及时更新
- 新文章发布后更新 `published_articles.md`
- 新竞品出现时更新 `competitors.md`

### 示例：product.md

```markdown
# LemonData 产品信息

## 基本信息
- 产品名称：LemonData (Crazyrouter)
- 定位：多协议 AI API 网关
- 官网：https://lemondata.com
- 成立时间：2024

## 核心功能
- 支持 300+ AI 模型（来源：官网模型列表，2026-03-09）
- 价格比官方低 30-50%（来源：价格对比页，2026-03-09）
- 多协议支持：OpenAI、Anthropic、Gemini 原生协议

## 目标用户
- 独立开发者
- AI 创业团队
- 需要成本优化的企业
```

---

## Step 2: [可选] 生成项目配置

如果你有原始文档（产品介绍、竞品分析等），可以用 AI 自动生成结构化配置。

### 准备原始文档

```
raw-docs/
├── product-intro.md        # 产品介绍
├── pricing.md              # 价格信息
├── competitor-analysis.md  # 竞品分析
└── features.yaml           # 功能列表
```

### 运行初始化脚本

```bash
cd seomaster
node scripts/init-project.js --input ../raw-docs
```

输出 `project-config.yaml`，包含：
- 产品基本信息
- 价值主张
- 目标受众和痛点
- 竞品信息
- 核心数据点
- 品牌声音

**注意**：生成的配置需要人工审核，补充标记为 TODO 的字段。

---

## Step 3: 生成文章大纲（Concept）

给定目标关键词，自动抓取 Google 前 10 篇竞品文章，AI 分析后生成文章结构。

```bash
cd seomaster
node scripts/generate-concept.js \
  --keyword "openrouter alternative" \
  --slug openrouter-alternative \
  --out ../articles/blog/
```

### 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--keyword` | 必填 | 目标关键词 |
| `--slug` | 必填 | URL slug |
| `--lang` | en | 搜索语言（en/zh） |
| `--market` | us | 目标市场（us/cn） |
| `--results` | 10 | 抓取竞品数量 |
| `--out` | 当前目录 | 输出目录 |
| `--no-filter` | false | 禁用域名过滤（默认启用） |

### 域名过滤（Blog-Only 模式）

默认情况下，系统会自动过滤掉论坛、问答、社交媒体等网站，只保留高质量的博客文章：

**过滤的网站类型**：
- 论坛：Reddit, Quora, Stack Overflow, V2EX, 知乎
- 社交媒体：Twitter, Facebook, LinkedIn, YouTube
- 产品平台：Product Hunt
- 其他：Wikipedia

**自定义过滤规则**：
编辑 `seomaster/config/domain-filter.js` 文件：
- `EXCLUDED_DOMAINS`：黑名单（会被过滤）
- `ALLOWED_DOMAINS`：白名单（优先级更高）

**禁用过滤**：
```bash
node scripts/generate-concept.js \
  --keyword "your keyword" \
  --slug your-slug \
  --no-filter
```

### 输出文件

- `{slug}-concept.yaml` — 文章大纲（sections、FAQ、keyword variants）
- `{slug}-research.json` — 竞品研究数据

检查 concept.yaml，确认结构合理后进入下一步。

---

## Step 4: 生成初稿（Draft）

基于 concept.yaml 分段调用 AI 生成完整文章。

```bash
node scripts/generate-draft.js \
  --concept ../articles/blog/openrouter-alternative-concept.yaml
```

### 自动后处理

- 去除禁用词（首先/其次/本文/至关重要 等）
- 限制 bold 最多 3 处
- 插入 `[DATA: ...]` 占位符标记需要补充的数据
- 插入 `<!-- IMAGE: ... -->` 标记配图位置

输出 `{slug}-draft.md`。

---

## Step 5: 质量检查（硬指标）

```bash
node scripts/quality-check.js ../articles/blog/openrouter-alternative-draft.md
```

检查项：
- 禁用词（首先/其次/本文/颠覆性/赋能 等）
- Bold ≤ 3
- Em dash (——) ≤ 3
- 感叹号 ≤ 2

---

## Step 6: 人工完善

通过质量检查后，人工完成：

1. 替换所有 `[DATA: ...]` 占位符为真实数据（价格、性能、用户案例）
2. 在 `<!-- IMAGE: ... -->` 位置配图
3. 确认 thesis 和 CTA
4. 再跑一次 quality-check 确认

---

## 命令速查表

| 步骤 | 命令 | 输入 | 输出 |
|------|------|------|------|
| 初始化项目 | `node scripts/init-project.js --input <docs-folder>` | 原始文档文件夹 | project-config.yaml |
| 生成大纲 | `node scripts/generate-concept.js --keyword <kw> --slug <slug>` | 关键词 | concept.yaml + research.json |
| 生成初稿 | `node scripts/generate-draft.js --concept <path>` | concept.yaml | draft.md |
| 质量检查 | `node scripts/quality-check.js <path>` | draft.md | 检查报告 |

---

## 最佳实践

### 关键词选择

✅ 好的关键词：
- "ai api pricing comparison"
- "best ai tools for developers"
- "how to use openai api"

❌ 避免：
- 太宽泛："ai"
- 太长："how to use openai api to build..."

### 字数设置

- **短文章**（1000-1500 字）：快速生成
- **中等文章**（2000-3000 字）：平衡深度和速度（推荐）
- **长文章**（4000-5000 字）：深度内容

### 搜索结果数

- **3-5 个**：快速生成
- **5-8 个**：平衡质量和速度（推荐）
- **8-10 个**：最高质量

---

## 示例：完整流程演示

```bash
# 1. 配置 API 密钥
cd seomaster
cat > .env << EOF
AI_API_KEY=sk-your-key
AI_API_BASE_URL=https://crazyrouter.com/v1
AI_MODEL=gpt-4o
APIFY_API_TOKEN=apify_api_your-token
EOF

# 2. 搭建知识库（手动创建 knowledge/ 目录和文件）

# 3. 生成文章大纲
node scripts/generate-concept.js \
  --keyword "openrouter alternative" \
  --slug openrouter-alternative \
  --out ../articles/blog/

# 4. 生成初稿
node scripts/generate-draft.js \
  --concept ../articles/blog/openrouter-alternative-concept.yaml

# 5. 质量检查
node scripts/quality-check.js ../articles/blog/openrouter-alternative-draft.md

# 6. 人工完善（手动编辑 draft.md）

# 7. 发布（导入到主 repo 数据库）
cd ../../  # 回到主 repo
node scripts/import-blog-article.mjs content/articles/blog/openrouter-alternative-draft.md
```

---

## 故障排除

### 命令不存在
```bash
npm link
```

### API 错误
检查 `.env` 中的 `AI_API_KEY` 是否正确。

### 知识库为空
检查 `knowledge/` 目录是否存在且包含 `.md` 文件。

---

## 相关文档

- [SEOMaster 主文档](../README.md)
- [快速开始指南](./quick-start.md)
- [工作流详细指南](./workflow-guide.md)
- [项目初始化工作流](./init-workflow.md)

---

**开始使用**：先搭建知识库，然后运行 `node scripts/generate-concept.js --keyword "your keyword" --slug your-slug`
