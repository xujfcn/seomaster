# Interactive Workflow Guide

## 概述

SEOMaster 现在支持交互式工作流，允许你在大纲生成后预览、确认或重试，避免自动进入下一步。

## 使用方法

### 方式 1: 交互式全流程（推荐）

```bash
seomaster new "your keyword" -i
```

**工作流程**：
1. 生成 concept（大纲）
2. **显示预览并等待确认**
3. 选择操作：
   - ✓ 继续生成 draft
   - ↻ 重新生成 concept
   - ✎ 手动编辑 concept 文件
   - ✕ 取消流程
4. 生成 draft
5. 生成配图（最多 3 张）
6. 质量检查

**示例**：
```bash
seomaster new "affordable api guide" -i --words 2500
```

### 方式 2: 分步执行（手动控制）

#### Step 1: 生成大纲
```bash
seomaster concept "your keyword"
```

自动显示预览：
```
📋 Concept Preview:

Title: Your Article Title
Slug: your-keyword
Target: 2500 words

Sections:
  1. Introduction (250 words)
  2. Main Content (1500 words)
  ...

FAQ:
  1. Question 1
  2. Question 2
  ...

Next steps:
  1. Review: output/your-keyword-concept.yaml
  2. Generate draft: seomaster draft output/your-keyword-concept.yaml
```

#### Step 2: 预览大纲（可选）
```bash
# 使用 slug
seomaster preview your-keyword

# 或使用完整路径
seomaster preview output/your-keyword-concept.yaml
```

#### Step 3: 编辑大纲（可选）
```bash
# 手动编辑 YAML 文件
vim output/your-keyword-concept.yaml
```

#### Step 4: 生成正文
```bash
seomaster draft output/your-keyword-concept.yaml
```

#### Step 5: 生成配图
```bash
seomaster images output/your-keyword-draft.md
```

#### Step 6: 质量检查
```bash
seomaster check your-keyword
```

### 方式 3: 自动全流程（无确认）

```bash
seomaster new "your keyword"
```

直接执行所有步骤，无需人工确认。

## 命令对比

| 命令 | 描述 | 适用场景 |
|------|------|----------|
| `seomaster new <keyword> -i` | 交互式全流程 | 需要确认大纲质量 |
| `seomaster new <keyword>` | 自动全流程 | 信任 AI 生成质量 |
| `seomaster concept <keyword>` | 仅生成大纲 | 需要手动编辑大纲 |
| `seomaster preview <slug>` | 预览大纲 | 查看已生成的大纲 |
| `seomaster draft <concept-file>` | 从大纲生成正文 | 大纲已确认 |

## 交互式选项说明

在交互式模式下，生成大纲后会显示以下选项：

### ✓ Continue to draft generation
继续生成正文，使用当前大纲。

### ↻ Regenerate concept
重新生成大纲。AI 会重新抓取竞品、重新分析并生成新的大纲。

**使用场景**：
- 大纲结构不合理
- 关键词覆盖不足
- 字数分配不均

### ✎ Edit concept file manually
暂停流程，允许你手动编辑 YAML 文件。

**编辑后按 Enter 继续**，会重新显示预览供你确认。

**可编辑内容**：
- 标题和描述
- 章节标题和字数
- FAQ 问题
- 关键词变体

### ✕ Cancel
取消整个流程，保留已生成的 concept 文件。

## 大纲预览说明

预览会显示：
- **Title**: 文章标题
- **Slug**: URL slug（文件名）
- **Target**: 目标字数
- **Sections**: 各章节标题和字数分配
- **FAQ**: FAQ 问题列表

**示例**：
```
📋 Concept Preview:

Title: Affordable API Guide: How to Save 90% on AI API Costs
Slug: affordable-api-guide
Target: 2500 words

Sections:
  1. What Makes an API Affordable (400 words)
  2. Top 5 Affordable API Providers (600 words)
  3. Cost Optimization Strategies (500 words)
  4. Pricing Comparison (400 words)
  5. Implementation Guide (400 words)
  6. Common Pitfalls (200 words)

FAQ:
  1. What is the cheapest AI API?
  2. How can I reduce API costs?
  3. Are free APIs reliable?
  4. What is prompt caching?
```

## 重试策略

### 何时重试？

- **结构问题**：章节逻辑不清晰
- **字数问题**：某个章节字数过多或过少
- **关键词问题**：目标关键词覆盖不足
- **竞品问题**：没有参考到重要竞品

### 如何提高重试成功率？

1. **检查竞品数据**：查看 `output/{slug}-research.json`
2. **调整参数**：
   ```bash
   seomaster concept "keyword" --words 3000 --results 15
   ```
3. **手动编辑**：选择 "Edit concept file manually"

## 最佳实践

### 1. 首次使用：交互式模式
```bash
seomaster new "your keyword" -i
```
确保大纲质量，熟悉 AI 生成风格。

### 2. 批量生产：自动模式
```bash
seomaster new "keyword1"
seomaster new "keyword2"
seomaster new "keyword3"
```
信任 AI 后，使用自动模式提高效率。

### 3. 精细控制：分步执行
```bash
seomaster concept "keyword"
# 手动编辑 concept
seomaster draft output/keyword-concept.yaml
# 手动编辑 draft
seomaster images output/keyword-draft.md
```
需要深度定制时使用。

## 常见问题

### Q: 交互式模式会增加多少时间？
A: 仅增加人工确认时间（通常 1-2 分钟），AI 生成时间不变。

### Q: 可以跳过配图吗？
A: 可以，使用 `--skip-images` 选项：
```bash
seomaster new "keyword" -i --skip-images
```

### Q: 重试会重新抓取竞品吗？
A: 是的，每次重试都会重新执行完整的 concept 生成流程。

### Q: 手动编辑后如何验证？
A: 使用 preview 命令：
```bash
seomaster preview your-keyword
```

### Q: 可以只预览不生成吗？
A: 可以，先生成 concept，然后使用 preview：
```bash
seomaster concept "keyword"
seomaster preview keyword
```

## 快捷命令

```bash
# 交互式生成
alias seonew='seomaster new -i'

# 快速预览
alias seoprev='seomaster preview'

# 快速检查
alias seocheck='seomaster check'
```

使用：
```bash
seonew "your keyword"
seoprev your-keyword
seocheck your-keyword
```
