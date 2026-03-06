# 如何为新项目配置 SEOMaster

> 将 SEOMaster 适配到你的产品，生成高质量的 SEO 内容

## 概述

SEOMaster 是一个通用的 AI 驱动内容生成工具。要为你的产品使用它，需要配置"知识库"，让 AI 了解你的产品信息。

## 配置流程

### 第一步：克隆或 Fork 项目

```bash
# 方式 A：直接克隆（适合个人使用）
git clone https://github.com/xujfcn/seomaster.git
cd seomaster

# 方式 B：Fork 后克隆（适合团队协作）
# 1. 在 GitHub 上 Fork 项目
# 2. 克隆你的 Fork
git clone https://github.com/your-username/seomaster.git
cd seomaster
```

### 第二步：安装依赖和配置环境

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
vim .env  # 填写 API Keys
```

详细的环境配置请参考 [GETTING-STARTED.md](GETTING-STARTED.md)

### 第三步：配置知识库

知识库位于 `knowledge/` 目录，包含 6 个文件：

```
knowledge/
├── product.md              # 产品介绍（必需）
├── competitors.md          # 竞品分析（必需）
├── models_pricing.md       # 定价信息（推荐）
├── benchmarks.md           # 性能数据（推荐）
├── target_keywords.md      # 目标关键词（推荐）
└── published_articles.md   # 已发布文章（可选）
```

#### 3.1 配置 product.md（必需）

这是最重要的文件，AI 会用它来理解你的产品。

**模板结构：**

```markdown
# [你的产品名] 产品知识库

> 最后更新: YYYY-MM-DD
> 数据来源: 官网 + 文档

## 产品定位

- 品牌名: YourProduct
- 一句话: 用一句话描述你的产品核心价值
- 官网: https://yourproduct.com
- 定位: 你的产品在市场中的独特定位

## 核心功能

### 功能 1（核心差异化）
- 详细描述
- 技术实现
- 用户价值

### 功能 2
- 详细描述
- 技术实现
- 用户价值

## 定价优势

- 价格对比
- 免费额度
- 付费方案

## 技术规格

| 指标 | 值 | 来源 | 日期 |
|------|-----|------|------|
| 用户数 | 10,000+ | 官网 | 2026-03 |
| 响应时间 | <100ms | 监控数据 | 2026-03 |

## 目标用户

### 主要用户群体
- 用户画像
- 痛点
- 使用场景

### 次要用户群体
- 用户画像
- 痛点
- 使用场景

## 核心优势

1. **优势 1** - 具体说明
2. **优势 2** - 具体说明
3. **优势 3** - 具体说明

## 使用场景

### 场景 1: [场景名称]
- 问题描述
- 解决方案
- 效果数据

### 场景 2: [场景名称]
- 问题描述
- 解决方案
- 效果数据
```

**填写要点：**
- ✅ 使用真实数据，标注来源和日期
- ✅ 突出核心差异化功能
- ✅ 包含可验证的数字指标
- ✅ 描述具体使用场景
- ❌ 避免空洞的营销话术
- ❌ 避免无法验证的夸大宣传

#### 3.2 配置 competitors.md（必需）

列出你的主要竞品，帮助 AI 理解市场定位。

**模板结构：**

```markdown
# 竞品分析

## 直接竞品

### Competitor A
- 官网: https://competitor-a.com
- 定位: 他们的定位
- 优势: 他们的优势
- 劣势: 他们的劣势
- 定价: 价格对比
- 目标用户: 他们的目标用户

### Competitor B
- 官网: https://competitor-b.com
- 定位: 他们的定位
- 优势: 他们的优势
- 劣势: 他们的劣势
- 定价: 价格对比
- 目标用户: 他们的目标用户

## 间接竞品

### Alternative Solution C
- 类型: 替代方案类型
- 适用场景: 什么情况下用户会选择它
- 对比: 与你的产品对比

## 竞争优势矩阵

| 维度 | 我们 | Competitor A | Competitor B |
|------|------|--------------|--------------|
| 价格 | $10/月 | $20/月 | $15/月 |
| 功能数 | 50+ | 30 | 40 |
| 响应速度 | <100ms | <200ms | <150ms |
| 支持语言 | 10+ | 5 | 8 |
```

#### 3.3 配置 models_pricing.md（推荐）

如果你的产品有定价信息，详细列出。

```markdown
# 定价信息

## 免费方案

- 额度: $1 免费额度
- 限制: 每月 1000 次请求
- 适用场景: 测试和小型项目

## 付费方案

### 基础版 - $10/月
- 功能列表
- 使用限制
- 适用用户

### 专业版 - $50/月
- 功能列表
- 使用限制
- 适用用户

### 企业版 - 定制
- 功能列表
- 使用限制
- 适用用户

## 价格对比

| 功能 | 我们 | Competitor A | Competitor B |
|------|------|--------------|--------------|
| 基础价格 | $10 | $20 | $15 |
| 每 1000 次请求 | $0.5 | $1.0 | $0.8 |
```

#### 3.4 配置 benchmarks.md（推荐）

如果有性能测试数据，添加到这里。

```markdown
# 性能基准测试

## 响应速度

| 模型 | 平均延迟 | P95 延迟 | P99 延迟 |
|------|----------|----------|----------|
| GPT-4 | 850ms | 1200ms | 1500ms |
| Claude | 920ms | 1300ms | 1600ms |

## 吞吐量

- 每秒请求数: 1000+ QPS
- 并发连接数: 10,000+

## 可用性

- 正常运行时间: 99.9%
- 平均故障恢复时间: <5 分钟
```

#### 3.5 配置 target_keywords.md（推荐）

列出你想要排名的关键词。

```markdown
# 目标关键词

## 核心关键词（高优先级）

### "best ai api"
- 搜索量: 10,000/月
- 难度: 高
- 意图: 对比选型
- 目标排名: Top 3

### "cheap ai api"
- 搜索量: 5,000/月
- 难度: 中
- 意图: 价格敏感
- 目标排名: Top 5

## 长尾关键词（中优先级）

### "how to use ai api"
- 搜索量: 2,000/月
- 难度: 低
- 意图: 教程
- 目标排名: Top 10

## 品牌关键词（低优先级）

### "yourproduct vs competitor"
- 搜索量: 500/月
- 难度: 低
- 意图: 对比
- 目标排名: Top 1
```

#### 3.6 配置 published_articles.md（可选）

记录已发布的文章，避免重复内容。

```markdown
# 已发布文章

## 2026-03

### "Best AI API for Developers in 2026"
- 发布日期: 2026-03-01
- 平台: 官网博客
- URL: https://yourproduct.com/blog/best-ai-api-2026
- 关键词: best ai api, ai api comparison
- 核心论点: YourProduct 提供最全面的模型覆盖和最低价格

### "How to Save 40% on AI API Costs"
- 发布日期: 2026-03-05
- 平台: Medium
- URL: https://medium.com/@yourproduct/save-ai-api-costs
- 关键词: ai api cost, save money
- 核心论点: 通过智能路由和缓存优化降低成本
```

### 第四步：测试配置

生成一篇测试文章，验证配置是否正确：

```bash
# 安装 CLI
npm install -g .

# 生成测试文章
seomaster new "your product name" -i --words 1500
```

检查生成的文章：
- ✅ 是否包含你的产品信息？
- ✅ 是否提到了竞品对比？
- ✅ 是否使用了真实数据？
- ✅ 是否符合你的品牌调性？

如果不满意，回到第三步调整知识库。

### 第五步：批量生成内容

根据 `target_keywords.md` 中的关键词列表，批量生成文章：

```bash
# 为每个关键词生成文章
seomaster new "best ai api" --words 2500
seomaster new "cheap ai api" --words 2500
seomaster new "how to use ai api" --words 2000
```

## 进阶配置

### 自定义 AI 提示词

如果需要调整 AI 生成的风格，编辑以下文件：

- `scripts/lib/ai-outline-generator.js` - 大纲生成提示词
- `scripts/lib/draft-generator.js` - 文章生成提示词

### 自定义质量检查规则

编辑 `scripts/quality-check.js`，调整：
- 禁用词列表
- 字数限制
- 表格数量要求
- 数据引用要求

### 自定义输出格式

编辑 `scripts/lib/draft-config.js`，调整：
- 段落长度
- 标题层级
- 列表格式
- 代码块样式

## 最佳实践

### 1. 知识库维护

- ✅ 每月更新一次数据
- ✅ 标注数据来源和日期
- ✅ 删除过时信息
- ✅ 添加新功能和新数据

### 2. 内容生成策略

- ✅ 从长尾关键词开始（难度低，容易排名）
- ✅ 每周生成 2-3 篇文章
- ✅ 人工审阅和修改每篇文章
- ✅ 填充所有 `[DATA: ...]` 占位符

### 3. 质量控制

- ✅ 运行质量检查，确保无硬指标问题
- ✅ 验证所有数据的准确性
- ✅ 确保 Thesis 清晰且有价值
- ✅ 检查 CTA 是否有效

### 4. 多渠道分发

同一篇文章可以适配到不同平台：
- 官网博客：完整版（2500+ 字）
- Medium：精简版（1500 字）
- Twitter：摘要版（280 字 × 10 条）
- LinkedIn：专业版（1000 字）

## 常见问题

### Q1: 知识库文件必须全部填写吗？

不是。最小配置只需要：
- `product.md`（必需）
- `competitors.md`（必需）

其他文件可以逐步完善。

### Q2: 如何处理多语言内容？

为每种语言创建独立的知识库目录：

```
knowledge/
├── en/
│   ├── product.md
│   └── competitors.md
└── zh/
    ├── product.md
    └── competitors.md
```

然后修改脚本，根据 `--lang` 参数加载对应目录。

### Q3: 如何避免生成重复内容？

- 在 `published_articles.md` 中记录已发布文章
- 生成新文章前，检查关键词是否已覆盖
- 使用不同的 Thesis 角度

### Q4: 生成的内容不符合品牌调性怎么办？

在 `product.md` 中添加"品牌调性"部分：

```markdown
## 品牌调性

- 语气: 专业但友好
- 风格: 技术导向，数据驱动
- 避免: 过度营销、夸大宣传
- 偏好: 具体案例、真实数据
```

### Q5: 如何团队协作？

1. Fork 项目到团队 GitHub 组织
2. 每个成员克隆团队的 Fork
3. 知识库更新通过 Pull Request
4. 使用 Git 分支管理不同的内容项目

## 示例项目

参考现有配置（LemonData/Crazyrouter）：
- [knowledge/product.md](knowledge/product.md)
- [knowledge/competitors.md](knowledge/competitors.md)
- [knowledge/models_pricing.md](knowledge/models_pricing.md)

## 下一步

- 📖 阅读 [新手入门指南](GETTING-STARTED.md)
- 🎨 阅读 [自动图片生成指南](IMAGE_WORKFLOW.md)
- 📋 阅读 [快速参考卡](QUICK_REFERENCE.md)

---

**祝你的内容营销成功！🚀**
