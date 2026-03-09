# SEOMaster 知识库优先工作流

## 概述

SEOMaster 现在采用**知识库优先**的工作流程，确保生成的文章使用准确的产品信息，特别是价格、竞品等关键数据。

---

## 🔄 新的工作流程

### 旧流程（已废弃）

```
1. Google 搜索
2. 抓取竞品大纲
3. AI 生成文章
```

**问题**：
- 价格信息可能过时
- 竞品信息可能不准确
- 缺乏产品特定知识

### 新流程（推荐）

```
1. 检查知识库
   ├─ 有足够信息 → 优先使用知识库
   └─ 信息不足 → Google 搜索补充

2. 保存研究数据到 Obsidian
   ├─ Research/ 目录
   └─ 按日期组织

3. AI 生成文章
   ├─ 严格使用知识库中的价格
   ├─ 严格使用知识库中的竞品信息
   └─ 禁止 AI 自动修改关键数据

4. 输出到 Obsidian
   ├─ Published/ 目录
   └─ 按月份组织
```

---

## 📁 Obsidian Vault 结构

### 自动创建的目录

创建新项目时，SEOMaster 会自动在 Obsidian vault 中创建以下目录：

```
D:/your-vault/
├── Core/              # 核心知识（总是加载）
│   └── Product.md
├── Domain/            # 领域知识（按关键词匹配）
│   ├── Pricing.md
│   └── Features.md
├── Competitors/       # 竞品分析
│   ├── Competitor-A.md
│   └── Competitor-B.md
├── Cases/             # 使用案例
│   └── Success-Stories.md
├── Research/          # Google 爬取数据（自动保存）⭐
│   └── 2026-03-09/
│       └── keyword-2026-03-09T12-00-00.md
├── Published/         # 生成的文章（自动保存）⭐
│   └── 2026-03/
│       └── keyword.md
├── Templates/         # 模板
└── README.md          # 自动生成的说明文档
```

---

## 🔧 创建新项目

### 步骤 1：启动创建流程

```bash
seomaster
# → Create New Project
```

### 步骤 2：输入项目信息

```
? Project ID: my-product
? Project name: My Product
? Description: AI-powered product
? Obsidian vault path: D:/my-product-vault  # 粘贴完整路径
? Default Language: en
? Default Word Count: 2500
```

### 步骤 3：自动创建目录结构

SEOMaster 会自动：
- ✅ 创建 Core/, Domain/, Competitors/, Cases/ 目录
- ✅ 创建 Research/ 目录（存放 Google 爬取数据）
- ✅ 创建 Published/ 目录（存放生成的文章）
- ✅ 创建 Templates/ 目录
- ✅ 生成 README.md 说明文档

输出示例：
```
📁 Setting up Obsidian vault structure...

  ✓ Created: Core/
  ✓ Created: Domain/
  ✓ Created: Competitors/
  ✓ Created: Cases/
  ✓ Created: Research/
  ✓ Created: Published/
  ✓ Created: Templates/
  ✓ Created: README.md

✅ Project "My Product" created and set as current.

📚 Obsidian vault structure created at: D:/my-product-vault

💡 Next steps:
   1. Open Obsidian and open this vault: D:/my-product-vault
   2. Add knowledge files to Core/, Domain/, etc.
   3. Start generating articles with: seomaster new "keyword"
```

---

## 📝 准备知识库

### 1. 核心产品信息（Core/Product.md）

```yaml
---
type: core
priority: critical
keywords: [product, feature, pricing]
always_load: true
last_updated: 2026-03-09
---

# My Product - Core Information

## Product Overview

- Name: My Product
- Category: AI API Gateway
- Target Users: Developers, Startups

## Pricing (VERIFIED - DO NOT MODIFY)

- Free Plan: $0/month
  - 100 requests/day
  - Basic support

- Pro Plan: $29/month
  - 10,000 requests/day
  - Priority support
  - Advanced features

- Enterprise: Custom pricing
  - Unlimited requests
  - Dedicated support
  - SLA guarantee

**Data Source**: Official pricing page
**Last Verified**: 2026-03-09
**DO NOT MODIFY**: These prices are verified and must be used exactly as shown
```

### 2. 竞品信息（Competitors/Competitor-A.md）

```yaml
---
type: competitor
priority: high
keywords: [competitor, comparison, alternative]
last_updated: 2026-03-09
---

# Competitor A

## Overview

- Name: Competitor A
- Category: AI API Gateway
- Market Position: Market leader

## Pricing (VERIFIED - DO NOT MODIFY)

- Basic: $0/month
- Pro: $49/month
- Enterprise: $299/month

**Data Source**: Competitor's pricing page
**Last Verified**: 2026-03-09
**DO NOT MODIFY**: These prices are verified

## Strengths

- Large user base
- Comprehensive documentation
- 24/7 support

## Weaknesses

- Higher pricing
- Complex setup
- Limited free tier
```

### 3. 领域知识（Domain/Pricing.md）

```yaml
---
type: domain
priority: high
keywords: [pricing, cost, price comparison]
last_updated: 2026-03-09
---

# Pricing Strategy

## Our Pricing Philosophy

- Transparent pricing
- No hidden fees
- Pay-as-you-go option

## Price Comparison (VERIFIED)

| Feature | My Product | Competitor A | Competitor B |
|---------|-----------|--------------|--------------|
| Free Tier | 100 req/day | 50 req/day | 200 req/day |
| Pro Plan | $29/month | $49/month | $39/month |
| Enterprise | Custom | $299/month | Custom |

**Data Source**: Official pricing pages
**Last Verified**: 2026-03-09
```

---

## 🚀 生成文章

### 步骤 1：生成文章

```bash
seomaster new "best ai api gateway"
```

### 步骤 2：系统检查知识库

```
[0/4] Checking knowledge base...
  ✓ Knowledge base has sufficient information (3500 chars)
  ✓ Competitor info: Yes
  ✓ Pricing info: Yes
  ✓ Feature info: Yes
  → Will prioritize knowledge base data over Google search
```

### 步骤 3：Google 搜索（补充）

```
[1/4] Searching Google for top 5 results...
  🚫 Filtered out 2 forum/Q&A sites (reddit, quora, etc.)
  Found 5 results
```

### 步骤 4：保存研究数据

```
[2/4] Scraping H1-H4 outlines from 5 articles...
  Scraped 5/5 articles successfully

  Research data saved: output/best-ai-api-gateway-research.json
  📚 Research saved to vault: best-ai-api-gateway-2026-03-09T12-00-00.md
```

**保存位置**：`vault/Research/2026-03-09/best-ai-api-gateway-2026-03-09T12-00-00.md`

### 步骤 5：AI 生成大纲

AI 会收到以下指令：

```
## Internal Knowledge Base (CRITICAL: Use this data for accuracy)

**IMPORTANT RULES FOR KNOWLEDGE BASE DATA**:
1. **Pricing Information**: MUST use exact prices from knowledge base. DO NOT modify, estimate, or update prices.
2. **Competitor Data**: MUST use exact competitor information from knowledge base. DO NOT add or modify competitor details.
3. **Product Features**: MUST use exact feature descriptions from knowledge base.
4. **Data Sources**: All data from knowledge base is verified and must be used as-is.
5. **DO NOT**: Make up prices, features, or competitor information not in the knowledge base.

[知识库内容]

**REMINDER**: The above data is authoritative. Use it exactly as provided. Do not modify prices or competitor information.
```

---

## 🔒 价格信息保护机制

### 保护规则

1. **知识库中的价格**：
   - ✅ 必须使用知识库中的确切价格
   - ❌ 禁止 AI 修改、估算或更新价格
   - ❌ 禁止 AI 添加未验证的价格

2. **竞品信息**：
   - ✅ 必须使用知识库中的确切竞品信息
   - ❌ 禁止 AI 添加或修改竞品详情

3. **产品功能**：
   - ✅ 必须使用知识库中的确切功能描述
   - ❌ 禁止 AI 添加未验证的功能

### 标记方式

在知识库文件中使用以下标记：

```markdown
## Pricing (VERIFIED - DO NOT MODIFY)

- Free Plan: $0/month
- Pro Plan: $29/month

**Data Source**: Official pricing page
**Last Verified**: 2026-03-09
**DO NOT MODIFY**: These prices are verified and must be used exactly as shown
```

---

## 📊 Research 数据格式

保存到 `vault/Research/` 的文件格式：

```markdown
---
type: research
keyword: best ai api gateway
created: 2026-03-09
source: Google Search
results_count: 5
successful_scrapes: 5
---

# Research: best ai api gateway

**Date**: 2026-03-09
**Results**: 5 URLs, 5 successfully scraped

---

## Search Results

### 1. Best AI API Gateways in 2026

- **URL**: https://example.com/article
- **Description**: Comprehensive guide to AI API gateways

---

## Article Outlines

### 1. Best AI API Gateways in 2026 ✓

- **URL**: https://example.com/article
- **Outline**:

- H1: Best AI API Gateways in 2026
  - H2: What is an AI API Gateway?
  - H2: Top 5 AI API Gateways
    - H3: Gateway A
    - H3: Gateway B
  - H2: Pricing Comparison
  - H2: Conclusion

---

## Notes

- This research data was automatically generated by SEOMaster
- Use this data to understand competitor content strategies
- Update your knowledge base based on insights from this research
```

---

## 🎯 最佳实践

### 1. 定期更新知识库

```bash
# 每月更新价格信息
# 编辑 vault/Domain/Pricing.md
# 更新 last_updated 字段
```

### 2. 验证数据来源

```markdown
**Data Source**: Official pricing page (https://example.com/pricing)
**Last Verified**: 2026-03-09
**Verification Method**: Manual check
```

### 3. 使用 Research 数据

```bash
# 1. 生成文章后，查看 Research/ 目录
# 2. 分析竞品策略
# 3. 更新知识库
# 4. 重新生成文章
```

### 4. 保护关键信息

```markdown
## Pricing (VERIFIED - DO NOT MODIFY)

[价格信息]

**DO NOT MODIFY**: These prices are verified
```

---

## 🔍 故障排除

### 问题 1：知识库未检测到

**症状**：
```
[0/4] Checking knowledge base...
  ⚠️  Knowledge base has limited information
```

**解决方案**：
1. 检查 vault 路径配置
2. 确保文件有 YAML Front Matter
3. 确保 keywords 包含相关关键词

### 问题 2：Research 未保存

**症状**：没有看到 "Research saved to vault" 消息

**解决方案**：
1. 检查 vault_path 配置
2. 确保 Research/ 目录存在
3. 检查文件权限

### 问题 3：AI 修改了价格

**症状**：生成的文章中价格与知识库不一致

**解决方案**：
1. 在知识库中添加 "DO NOT MODIFY" 标记
2. 使用 "VERIFIED" 标记
3. 提供数据来源和验证日期

---

## 📚 相关文档

- [obsidian-complete-guide.md](./obsidian-complete-guide.md) - Obsidian 完整指南
- [configuration.md](./configuration.md) - 配置说明
- [interactive-guide.md](./interactive-guide.md) - 交互式使用指南

---

## 总结

### 核心改进

1. ✅ **自动创建目录**：创建项目时自动设置 Obsidian vault 结构
2. ✅ **保存研究数据**：Google 爬取的数据自动保存到 Research/
3. ✅ **知识库优先**：先检查知识库，再决定是否 Google 搜索
4. ✅ **价格保护**：严格保护知识库中的价格和竞品信息

### 工作流程

```
创建项目 → 自动创建目录 → 添加知识 → 生成文章 → 自动保存研究 → 自动保存文章
```

### 快速开始

```bash
# 1. 创建项目
seomaster
# → Create New Project
# → 粘贴 Obsidian vault 路径

# 2. 添加知识
# 在 Obsidian 中编辑 Core/Product.md, Domain/Pricing.md

# 3. 生成文章
seomaster new "your keyword"

# 4. 查看结果
# - Research/: Google 爬取数据
# - Published/: 生成的文章
```
