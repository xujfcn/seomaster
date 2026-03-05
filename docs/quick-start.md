# SEOMaster 快速开始指南

5 分钟上手 SEOMaster，开始你的第一篇 SEO 文章。

## 前置要求

- Node.js 16+
- AI API Key（OpenAI 兼容格式）
- Apify API Token（用于 Google 搜索）

## 完整流程

```
Step 0: .env 配置 API 密钥
Step 1: knowledge/ 搭建知识库（产品、竞品、定价、benchmark）
Step 2: init-project → project-config.yaml（可选，从知识库生成）
Step 3: generate-concept → concept.yaml（关键词 → 竞品抓取 → AI 大纲）
Step 4: generate-draft → draft.md（分段 AI 写作，自动引用知识库）
Step 5: quality-check → 硬指标检查
Step 6: seo-review → SOP 评审报告（AI 评分 + 改进建议）
Step 7: 人工修复评审问题 → 再次评审 → 发布
```

---

## 步骤 1: 配置 API 密钥

在 `seomaster/.env` 中配置：

```env
AI_API_KEY=sk-your-api-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o
APIFY_API_TOKEN=apify_api_your-token
```

---

## 步骤 2: 搭建知识库

知识库是所有文章的数据源，放在 `seomaster/knowledge/` 下，generate-concept 和 generate-draft 会自动读取。

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

### 维护原则
- 所有数据标注 **来源 + 日期**
- 价格数据变动时及时更新
- 新文章发布后更新 `published_articles.md`
- 新竞品出现时更新 `competitors.md`

---

## 步骤 3: 初始化项目（可选）

准备一个知识库文件夹，放入产品文档、竞品分析、功能说明等原始资料：

```
raw-docs/
├── product-intro.md        # 产品介绍
├── pricing.md              # 价格信息
├── competitor-analysis.md  # 竞品分析
└── features.yaml           # 功能列表
```

运行初始化：

```bash
cd seomaster
node scripts/init-project.js --input ../raw-docs
```

输出 `project-config.yaml`，包含产品信息、受众画像、竞品、关键词等。检查并完善其中的 TODO 项。

---

## 步骤 3: 生成文章大纲（关键词 → Concept）

给定一个目标关键词，自动抓取 Google 前 10 篇竞品文章的大纲，AI 分析后生成文章结构：

```bash
node scripts/generate-concept.js \
  --keyword "openrouter alternative" \
  --slug openrouter-alternative \
  --out ../articles/blog/
```

输出：
- `{slug}-concept.yaml` — 文章大纲（sections、FAQ、keyword variants）
- `{slug}-research.json` — 竞品研究数据

检查 concept.yaml，确认结构合理后进入下一步。

---

## 步骤 4: 生成初稿（Concept → Draft）

基于 concept.yaml 分段调用 AI 生成完整文章：

```bash
node scripts/generate-draft.js --concept ../articles/blog/openrouter-alternative-concept.yaml
```

输出 `{slug}-draft.md`，自动后处理：
- 去除禁用词（首先/其次/本文/至关重要 等）
- 限制 bold 最多 3 处
- 插入 `[DATA: ...]` 占位符标记需要补充的数据
- 插入 `<!-- IMAGE: ... -->` 标记配图位置

---

## 步骤 5: 质量检查

```bash
node scripts/quality-check.js ../articles/blog/openrouter-alternative-draft.md
```

检查硬指标：禁用词、bold ≤3、em dash ≤3、感叹号 ≤2。

---

## 步骤 6: 人工完善

通过质量检查后，人工完成：

1. 替换所有 `[DATA: ...]` 占位符为真实数据（价格、性能、用户案例）
2. 在 `<!-- IMAGE: ... -->` 位置配图
3. 确认 thesis 和 CTA
4. 再跑一次 quality-check 确认

---

## 命令速查

| 步骤 | 命令 | 输入 | 输出 |
|------|------|------|------|
| 初始化项目 | `node scripts/init-project.js --input <docs-folder>` | 知识库文件夹 | project-config.yaml |
| 生成大纲 | `node scripts/generate-concept.js --keyword <kw> --slug <slug>` | 关键词 | concept.yaml + research.json |
| 生成初稿 | `node scripts/generate-draft.js --concept <path>` | concept.yaml | draft.md |
| 质量检查 | `node scripts/quality-check.js <path>` | draft.md | 检查报告 |

---

## 可选参数

### generate-concept.js

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--keyword` | 必填 | 目标关键词 |
| `--slug` | 必填 | URL slug |
| `--lang` | en | 搜索语言 |
| `--market` | us | 目标市场 |
| `--results` | 10 | 抓取竞品数量 |
| `--out` | 当前目录 | 输出目录 |

### generate-draft.js

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--concept` | 必填 | concept.yaml 路径 |
| `--out` | concept 同目录 | 输出目录 |
