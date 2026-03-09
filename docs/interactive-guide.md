# SEOMaster 交互式使用指南

## 快速开始

只需输入一个命令：

```bash
seomaster
```

就会启动交互式菜单，引导你完成所有操作。

---

## 交互式菜单结构

### 1. 主菜单

启动后看到：

```
╔════════════════════════════════════════╗
║            SEOMaster v1.0              ║
║   AI-Driven SEO Content Workflow       ║
╚════════════════════════════════════════╝

What would you like to do?
  📁 Enter Project (Crazyrouter)
  🔄 Switch Project
  ➕ Create New Project
  ─────────────
  Exit
```

**选项说明**：
- **Enter Project**：进入当前项目
- **Switch Project**：切换到其他项目
- **Create New Project**：创建新项目
- **Exit**：退出

---

### 2. 创建新项目

选择 "Create New Project" 后，会提示输入：

```
📁 Create New Project

? Project ID (lowercase, no spaces): my-product
? Project name: My Product
? Description: AI-powered product
? Obsidian Vault Path (paste full path): D:/my-product-vault
? Default Language: en
? Default Market: us
? Default Word Count: 2500
? Default Search Results: 5

✅ Project "My Product" created!
```

**关键字段**：
- **Project ID**：项目唯一标识（小写、无空格）
- **Obsidian Vault Path**：知识库根目录（直接粘贴完整路径）
- **Default Language**：默认语言（en/zh）
- **Default Market**：默认市场（us/cn）

---

### 3. 项目菜单

进入项目后看到：

```
╔════════════════════════════════════════╗
║         SEOMaster - Project Menu       ║
╚════════════════════════════════════════╝

📁 Current Project: Crazyrouter
   Vault: D:/crazyrouter
   Output: output

What would you like to do?
  ✨ New Article
  📄 List Articles (5)
  ─────────────
  🔄 Switch Project
  ← Back to Main Menu
```

**选项说明**：
- **New Article**：创建新文章
- **List Articles**：查看已生成的文章列表
- **Switch Project**：切换项目
- **Back to Main Menu**：返回主菜单

---

### 4. 新建文章流程

选择 "New Article" 后：

```
✨ New Article

? Enter target keyword: openrouter alternative
? Language: en
? Target word count: 2500
? Search results to analyze: 5

🚀 Generating article...

[1/4] Generating concept...
  🚫 Filtered out 2 forum/Q&A sites (reddit, quora, etc.)
  Found 10 results
  ...

[1.5/4] Reviewing concept...

📋 Concept Preview:

Title: OpenRouter Alternative: Best AI API Gateways in 2026
Slug: openrouter-alternative
Target: 2500 words

Sections:
  1. Introduction (200 words)
  2. What is OpenRouter? (300 words)
  3. Top OpenRouter Alternatives (800 words)
  4. Feature Comparison (400 words)
  5. Pricing Analysis (400 words)
  6. Conclusion (200 words)

FAQ:
  1. What is the cheapest OpenRouter alternative?
  2. Can I migrate from OpenRouter easily?
  3. Which alternative has the most models?

? What would you like to do?
  ✓ Continue to draft generation
  ↻ Regenerate concept
  ✎ Edit concept file manually
  ✕ Cancel
```

**确认选项说明**：
- **Continue to draft generation**：满意大纲，继续生成 Draft
- **Regenerate concept**：不满意，重新生成大纲（会重新抓取竞品）
- **Edit concept file manually**：手动编辑 YAML 文件后继续
- **Cancel**：取消流程，返回项目菜单

选择 "Continue" 后继续：

```
[2/4] Generating draft...
  ...

[3/4] Quality check...
  ✓ No forbidden words
  ✓ Bold count: 2 (limit: 3)
  ✓ Em dash count: 1 (limit: 3)
  ✓ Exclamation count: 0 (limit: 2)

✅ Article generated successfully!

   Concept: output/openrouter-alternative-concept.yaml
   Draft: output/openrouter-alternative-draft.md

? What next?
  View article details
  Create another article
  Back to project menu
```

**流程说明**：
1. 输入目标关键词
2. 选择语言和参数
3. 自动生成 Concept
4. **预览并确认 Concept**（新增）
5. 生成 Draft
6. 质量检查
7. 选择下一步操作

---

### 5. 文章列表

选择 "List Articles" 后：

```
📄 Articles

? Select an article:
  ✓ Complete  openrouter-alternative
  ✓ Complete  free-ai-api-guide
  ○ Concept Only  openclaw-tutorial
  ─────────────
  ← Back
```

**状态说明**：
- **✓ Complete**：已生成 Concept 和 Draft
- **○ Concept Only**：只有 Concept，未生成 Draft

---

### 6. 文章详情菜单

选择某篇文章后：

```
📄 Article: openrouter-alternative

Status:
  ✓ Research
  ✓ Concept
  ✓ Draft

? What would you like to do?
  🔍 Quality Check
  🎨 Generate Images
  ─────────────
  ← Back to list
```

**可用操作**：
- **Generate Draft**：生成初稿（仅 Concept Only 状态）
- **Quality Check**：运行质量检查
- **Generate Images**：生成配图
- **Back to list**：返回文章列表

---

## 完整使用流程示例

### 场景：从零开始创建第一篇文章

```bash
# 1. 启动 SEOMaster
seomaster

# 2. 主菜单 → 选择 "Create New Project"
#    输入项目信息：
#    - Project ID: my-saas
#    - Project name: My SaaS Product
#    - Vault Path: D:/my-saas-vault
#    - Language: en

# 3. 主菜单 → 选择 "Enter Project"

# 4. 项目菜单 → 选择 "New Article"
#    输入：
#    - Keyword: best project management tools
#    - Language: en
#    - Word count: 2500
#    - Search results: 5

# 5. 等待 Concept 生成（约 30-60 秒）

# 6. 预览 Concept 大纲
#    选择：
#    - ✓ Continue（满意大纲）
#    - ↻ Regenerate（不满意，重新生成）
#    - ✎ Edit（手动编辑）
#    - ✕ Cancel（取消）

# 7. 等待 Draft 生成（约 1-2 分钟）

# 8. 选择 "View article details"

# 9. 文章详情 → 选择 "Quality Check"

# 10. 文章详情 → 选择 "Generate Images"

# 11. 完成！文章在 output/ 目录
```

### 场景：Concept 不满意，重新生成

```bash
# 1-5. 同上

# 6. 预览 Concept 后发现大纲不够详细
#    选择 "↻ Regenerate concept"

# 7. 系统重新抓取竞品并生成新大纲

# 8. 再次预览，满意后选择 "✓ Continue"

# 9. 继续后续流程
```

### 场景：手动调整 Concept

```bash
# 1-5. 同上

# 6. 预览 Concept 后想调整某些 section
#    选择 "✎ Edit concept file manually"

# 7. 用编辑器打开 output/xxx-concept.yaml
#    修改 sections、FAQ 等内容

# 8. 保存后回到终端，按 Enter

# 9. 再次预览调整后的 Concept

# 10. 满意后选择 "✓ Continue"

# 11. 继续后续流程
```

---

## 命令行模式（高级用户）

如果你熟悉命令行，仍然可以直接使用命令：

```bash
# 生成文章（完整流程）
seomaster new "openrouter alternative"

# 只生成 Concept
seomaster concept "openrouter alternative"

# 从 Concept 生成 Draft
seomaster draft openrouter-alternative-concept.yaml

# 质量检查
seomaster check openrouter-alternative-draft.md

# 列出所有文章
seomaster list

# 项目管理
seomaster project          # 切换项目
seomaster project:list     # 列出所有项目
seomaster project:add      # 添加新项目
```

---

## 目录结构

```
seomaster/
├── output/                          # 生成的文章
│   ├── keyword-concept.yaml         # 文章大纲
│   ├── keyword-draft.md             # 完整文章
│   ├── keyword-research.json        # 竞品研究数据
│   └── keyword-1.png                # 配图
├── knowledge/                       # 知识库（可选）
│   ├── product.md
│   ├── competitors.md
│   └── ...
├── projects.json                    # 项目配置
└── .env                             # API 密钥
```

---

## 常见问题

### Q: 如何切换项目？

**A**: 在主菜单或项目菜单中选择 "Switch Project"。

### Q: 如何查看已生成的文章？

**A**: 进入项目菜单 → 选择 "List Articles"。

### Q: 如何重新生成某篇文章的 Draft？

**A**:
1. 删除 `output/{slug}-draft.md`
2. 进入文章详情菜单
3. 选择 "Generate Draft"

### Q: 如何自定义过滤规则？

**A**: 编辑 `config/domain-filter.js`，修改 `EXCLUDED_DOMAINS` 和 `ALLOWED_DOMAINS`。

### Q: 如何禁用域名过滤？

**A**: 使用命令行模式：
```bash
seomaster new "keyword" --no-filter
```

### Q: 知识库放在哪里？

**A**: 放在项目配置的 `vault_path` 目录下，通常是 Obsidian vault 的根目录。

---

## 优势对比

### 交互式模式 vs 命令行模式

| 特性 | 交互式模式 | 命令行模式 |
|------|-----------|-----------|
| 易用性 | ⭐⭐⭐⭐⭐ 新手友好 | ⭐⭐⭐ 需要记忆命令 |
| 速度 | ⭐⭐⭐ 需要点击选择 | ⭐⭐⭐⭐⭐ 直接执行 |
| 可视化 | ⭐⭐⭐⭐⭐ 清晰的菜单 | ⭐⭐ 纯文本输出 |
| 项目管理 | ⭐⭐⭐⭐⭐ 一键切换 | ⭐⭐⭐ 需要参数 |
| 文章管理 | ⭐⭐⭐⭐⭐ 列表查看 | ⭐⭐⭐ 需要记住文件名 |
| 自动化 | ⭐⭐⭐ 交互式确认 | ⭐⭐⭐⭐⭐ 可脚本化 |

**推荐**：
- 新手、日常使用 → 交互式模式
- 高级用户、批量处理 → 命令行模式

---

## 下一步

1. **搭建知识库**：在 Obsidian vault 中创建 `product.md`、`competitors.md` 等文件
2. **生成第一篇文章**：使用交互式菜单创建文章
3. **查看输出**：检查 `output/` 目录中的文件
4. **质量检查**：运行 Quality Check 确保符合标准
5. **发布**：将文章导入到主 repo 数据库

---

## 相关文档

- [新项目使用指南](./new-project-guide.md)
- [域名过滤说明](./domain-filtering.md)
- [快速开始指南](./quick-start.md)
- [工作流详细指南](./workflow-guide.md)

---

**开始使用**：`seomaster`
