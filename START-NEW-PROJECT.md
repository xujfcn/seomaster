# 如何用 SEOMaster 开始一个新项目

> 从零开始，10 分钟完成新项目知识库配置

## 方式 1：自动初始化（推荐）⭐

### 步骤 1：运行初始化脚本

```bash
cd seomaster
node scripts/init-new-project.js
```

脚本会询问：
- Obsidian Vault 路径（如 `D:/my-project`）
- 项目名称（如 `MyProduct`）
- 项目官网（如 `https://myproduct.com`）
- 一句话描述

### 步骤 2：在 Obsidian 中打开

1. 打开 Obsidian
2. 点击"打开其他仓库"
3. 选择你刚才输入的路径

### 步骤 3：填写产品信息

编辑 `Core/Product.md`，填写：
- 产品定位
- 核心功能（至少 2-3 个）
- 目标用户（至少 1-2 个群体）
- 品牌声音

### 步骤 4：添加领域知识

使用模板创建 2-3 个领域知识文件：

```bash
# 在 Obsidian 中
1. 复制 Templates/Domain-Knowledge-Template.md
2. 粘贴到 Domain/ 目录
3. 重命名为 Pricing.md（或其他主题）
4. 填写内容和关键词
```

推荐创建的领域知识：
- `Domain/Pricing.md` - 定价信息
- `Domain/Features.md` - 功能详解
- `Domain/Integration.md` - 集成指南

### 步骤 5：添加竞品分析（可选）

```bash
# 在 Obsidian 中
1. 复制 Templates/Competitor-Template.md
2. 粘贴到 Competitors/ 目录
3. 重命名为竞品名称（如 CompetitorA.md）
4. 填写对比信息
```

### 步骤 6：测试生成文章

```bash
cd seomaster
seomaster new "your product name" -i --words 1500
```

检查生成的文章是否包含你的产品信息。

---

## 方式 2：手动创建

### 步骤 1：创建 Obsidian Vault

```bash
# 创建目录
mkdir D:/my-project
cd D:/my-project

# 创建子目录
mkdir Core Domain Competitors Cases Templates
```

### 步骤 2：创建核心产品文件

创建 `Core/Product.md`：

```markdown
---
type: core
priority: critical
keywords: [myproduct]
tags: [product, core]
last_updated: 2026-03-06
always_load: true
---

# MyProduct 产品核心信息

## 产品定位

- **品牌名**: MyProduct
- **一句话**: 用一句话描述你的产品
- **官网**: https://myproduct.com
- **核心定位**: 你的产品在市场中的独特定位

## 核心功能

### 功能 1（核心差异化）

- 详细描述
- 技术实现
- 用户价值

## 目标用户

### 主要受众：[用户群体]

- **痛点**: [列出痛点]
- **目标**: [列出目标]
```

### 步骤 3：配置 SEOMaster

编辑 `seomaster/.env`，添加：

```bash
OBSIDIAN_VAULT_PATH=D:/my-project
```

### 步骤 4：在 Obsidian 中打开

1. 打开 Obsidian
2. 点击"打开其他仓库"
3. 选择 `D:/my-project`

### 步骤 5：继续填充内容

参考方式 1 的步骤 4-6。

---

## 最小可用配置（MVP）

如果你想快速开始，最少只需要：

### 1. 创建 Core/Product.md

```markdown
---
type: core
priority: critical
keywords: [myproduct]
always_load: true
---

# MyProduct

- **一句话**: 产品描述
- **核心功能**: 功能 1、功能 2、功能 3
- **目标用户**: 用户群体
- **官网**: https://myproduct.com
```

### 2. 配置 .env

```bash
OBSIDIAN_VAULT_PATH=D:/my-project
```

### 3. 生成文章

```bash
seomaster new "test keyword" -i --words 1500
```

---

## 知识库结构建议

### 核心知识（Core/）- 必需

- `Product.md` - 产品核心信息（500-1000 字）

### 领域知识（Domain/）- 推荐

- `Pricing.md` - 定价信息
- `Features.md` - 功能详解
- `Integration.md` - 集成指南
- `Performance.md` - 性能数据
- `Security.md` - 安全特性

### 竞品分析（Competitors/）- 可选

- `Overview.md` - 竞品概览
- `CompetitorA.md` - 竞品 A 分析
- `CompetitorB.md` - 竞品 B 分析

### 使用案例（Cases/）- 可选

- `Startup.md` - 创业公司案例
- `Enterprise.md` - 企业案例

---

## 元数据最佳实践

### 关键词（keywords）

列出所有可能的关键词变体：

```yaml
# 定价相关
keywords: [price, pricing, cost, cheap, affordable, save, money, discount, free, plan]

# 功能相关
keywords: [feature, function, capability, tool, integration, api]

# 性能相关
keywords: [performance, speed, fast, latency, throughput, benchmark]
```

### 优先级（priority）

- `critical` - 核心产品信息（总是加载）
- `high` - 重要领域知识（优先加载）
- `medium` - 一般领域知识
- `low` - 补充信息

---

## 多项目管理

### 方案 A：多个 Vault

```
obsidian-vaults/
├── project-a/
│   ├── Core/
│   └── Domain/
├── project-b/
│   ├── Core/
│   └── Domain/
└── project-c/
    ├── Core/
    └── Domain/
```

切换项目：

```bash
# 编辑 .env
OBSIDIAN_VAULT_PATH=D:/obsidian-vaults/project-a
```

### 方案 B：Git 分支

```bash
cd D:/my-vault

# 创建项目分支
git checkout -b project-a
# 编辑知识库...
git commit -am "Update for project A"

git checkout -b project-b
# 编辑知识库...
git commit -am "Update for project B"

# 切换项目
git checkout project-a
```

---

## 常见问题

### Q1: 最少需要多少内容才能开始？

最少只需要 `Core/Product.md`（500 字左右）。

### Q2: 如何快速填充知识库？

1. 从官网复制产品介绍
2. 从文档复制功能说明
3. 从竞品网站复制对比信息
4. 逐步完善和优化

### Q3: 知识库需要多详细？

- 核心信息：精简（500-1000 字）
- 领域知识：详细（1000-2000 字/文件）
- 竞品分析：适中（500-1000 字/竞品）

### Q4: 如何测试知识库是否有效？

```bash
# 生成测试文章
seomaster new "your product name" -i --words 1500

# 检查生成的文章是否包含：
# - 你的产品名称
# - 核心功能
# - 目标用户
# - 真实数据
```

### Q5: 如何备份知识库？

```bash
# 方案 A：Git
cd D:/my-project
git init
git add .
git commit -m "Initial knowledge base"
git remote add origin https://github.com/your-username/my-project-kb.git
git push -u origin main

# 方案 B：简单复制
cp -r D:/my-project D:/my-project-backup-$(date +%Y%m%d)
```

---

## 下一步

- 📖 阅读 [知识库优化指南](KNOWLEDGE-BASE-OPTIMIZATION.md)
- 🎨 阅读 [自动图片生成指南](IMAGE_WORKFLOW.md)
- 📋 阅读 [快速参考卡](QUICK_REFERENCE.md)

---

**祝你的内容营销成功！🚀**
