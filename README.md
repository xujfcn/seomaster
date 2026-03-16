# SEOMaster

AI 驱动的 SEO 内容生成工具，支持多项目管理和智能知识库。

## 快速启动

```bash
# 1. 进入目录
cd D:\lemondata-free\lemondata-content\seomaster

# 2. 启动交互式菜单（推荐）
seomaster

# 或直接运行无人值守自动工作流
seomaster auto "your keyword"
```

## 核心特性

- ✅ **交互式菜单** - 零学习成本，图形化操作
- ✅ **AI 驱动** - 使用 Claude/GPT 生成高质量 SEO 文章
- ✅ **多项目支持** - 为不同产品维护独立知识库
- ✅ **智能知识库** - 基于关键词自动加载相关知识（Obsidian 集成）
- ✅ **Blog-Only 模式** - 自动过滤论坛/问答网站，只参考高质量博客
- ✅ **完整工作流** - Concept → Draft → Images → Quality Check → Vault Import
- ✅ **自动配图** - AI 生成文章配图
- ✅ **无人值守模式** - 自动补全 Thesis / CTA，并输出工作流报告

## 使用模式

### 交互式模式（推荐新手）

```bash
seomaster
```

启动后通过菜单操作：
1. 选择或创建项目
2. 新建文章（输入关键词）
3. 查看文章列表
4. 管理文章（生成 Draft、质量检查、配图）

详见：[交互式使用指南](docs/interactive-guide.md)

### 命令行模式（推荐高级用户）

```bash
# 无人值守自动工作流（推荐）
seomaster auto "ai api pricing"

# 生成中文文章
seomaster auto "AI API 定价" --lang zh

# 交互式模式（推荐新手）
seomaster new "keyword" -i

# 自定义参数
seomaster auto "keyword" --words 3000 --results 5

# 跳过图片或导入
seomaster auto "keyword" --skip-images --skip-import
```

### 多项目管理

```bash
# 列出所有项目
seomaster project:list

# 添加新项目
seomaster project:add

# 切换项目
seomaster project

# 为指定项目生成文章
seomaster auto "keyword" --project myproduct
```

## 命令参考

### 项目管理

```bash
seomaster project:list    # 列出所有项目
seomaster project:add     # 添加新项目
seomaster project         # 切换项目
```

### 文章生成

```bash
seomaster auto "keyword"          # 无人值守完整流程（推荐）
seomaster new "keyword"           # 与 auto 相同；加 -i 可进入人工确认
seomaster concept "keyword"       # 只生成 concept
seomaster draft concept.yaml      # 只生成 draft
seomaster images draft.md         # 只生成图片
```

### 查看和检查

```bash
seomaster preview concept.yaml    # 预览 concept
seomaster check draft.md          # 质量检查
seomaster list                    # 列出所有文章
```

## 命令参数

```bash
-p, --project <name>      指定项目
-l, --lang <en|zh>        语言（默认: en）
-w, --words <number>      字数（默认: 2500）
-r, --results <number>    搜索结果数（默认: 5）
-i, --interactive         交互式模式
-o, --out <dir>           自定义输出目录
--skip-images             跳过图片生成
--skip-import             跳过自动导入 Obsidian vault
--force-import            即使质检失败也强制导入
--no-filter               禁用域名过滤（默认过滤论坛/问答网站）
```

### 域名过滤（Blog-Only 模式）

默认启用，自动过滤 Reddit、Quora、知乎等论坛/问答网站，只保留高质量博客文章。

- 查看过滤规则：`seomaster/config/domain-filter.js`
- 禁用过滤：添加 `--no-filter` 参数
- 详细说明：[域名过滤文档](docs/domain-filtering.md)

## 输出文件

```
output/
├── keyword-concept.yaml      # 文章大纲和结构
├── keyword-draft.md          # 完整文章（Markdown）
├── keyword-research.json     # 竞品研究数据
├── keyword-workflow-report.json # 自动工作流执行报告
├── keyword-1.png             # 配图 1
├── keyword-2.png             # 配图 2
└── keyword-3.png             # 配图 3
```

## 项目配置

配置文件：`projects.json`

```json
{
  "projects": {
    "crazyrouter": {
      "name": "Crazyrouter (LemonData)",
      "vault_path": "D:/crazyrouter",
      "description": "Multi-protocol AI API gateway",
      "output_dir": "output",
      "default_lang": "en",
      "default_words": 2500,
      "default_results": 5
    }
  },
  "current_project": "crazyrouter"
}
```

## 知识库管理

### Obsidian 集成

1. 打开 Obsidian
2. Open folder as vault
3. 选择项目的 `vault_path`（如 `D:/crazyrouter`）

### 知识库结构

```
D:/crazyrouter/
├── Core/           # 核心知识（总是加载）
│   └── Product.md
├── Domain/         # 领域知识（按关键词匹配）
│   ├── Pricing.md
│   └── API.md
├── Competitors/    # 竞品分析
├── Cases/          # 使用案例
└── Templates/      # 文档模板
```

### 测试知识库

```bash
node test-knowledge.js
```

## 工作流程

### 推荐流程（交互式）

```bash
seomaster new "keyword" -i
```

1. 生成 concept
2. 预览 concept
3. 选择：继续/重新生成/编辑/取消
4. 生成 draft
5. 生成图片
6. 质量检查

### 快速流程（自动）

```bash
seomaster auto "keyword"
```

自动完成以下步骤：
1. 生成 concept
2. 自动补全 thesis / CTA
3. 生成 draft
4. 生成图片
5. 质量检查
6. 通过质检后自动导入 Obsidian vault
7. 输出 `*-workflow-report.json`

### 分步流程（高级）

```bash
# 步骤 1: 生成 concept
seomaster concept "keyword"

# 步骤 2: 预览
seomaster preview output/keyword-concept.yaml

# 步骤 3: 生成 draft
seomaster draft output/keyword-concept.yaml

# 步骤 4: 生成图片
seomaster images output/keyword-draft.md

# 步骤 5: 质量检查
seomaster check output/keyword-draft.md
```

## 环境配置

`.env` 文件：

```bash
# AI API
AI_API_KEY=your-api-key
AI_API_BASE_URL=https://crazyrouter.com/v1
AI_MODEL=claude-sonnet-4-6

# Apify (for web scraping)
APIFY_API_TOKEN=your-apify-token

# GitHub (for image upload)
GITHUB_TOKEN=your-github-token
GITHUB_REPO=username/repo
GITHUB_BRANCH=main
```

## 文档

- **[交互式使用指南](docs/interactive-guide.md)** - 图形化菜单操作（推荐新手）
- **[新项目使用指南](docs/new-project-guide.md)** - 从零开始构建知识库
- **[域名过滤说明](docs/domain-filtering.md)** - Blog-Only 模式详解
- **[快速开始指南](docs/quick-start.md)** - 命令行快速上手
- **[工作流详细指南](docs/workflow-guide.md)** - 完整工作流程
- **[项目初始化](docs/init-workflow.md)** - 从原始文档生成配置

## 故障排除

### 命令不存在

```bash
npm link
```

### 项目未找到

```bash
seomaster project:list
```

### 知识库为空

检查 `projects.json` 中的 `vault_path` 是否正确。

### API 错误

检查 `.env` 中的 `AI_API_KEY` 是否正确。

## 性能优化

### 减少 Token 消耗

```bash
# 减少搜索结果
seomaster new "keyword" --results 3

# 减少字数
seomaster new "keyword" --words 1500

# 跳过图片
seomaster new "keyword" --skip-images
```

### 加快生成速度

```bash
# 快速测试
seomaster new "keyword" --words 1000 --results 3 --skip-images
```

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

## 技术栈

- **Node.js** - 运行环境
- **Commander.js** - CLI 框架
- **Inquirer.js** - 交互式命令行
- **Apify** - 网页抓取
- **OpenAI/Anthropic API** - AI 生成
- **Obsidian** - 知识库管理

## 版本

当前版本：1.0.0

## 许可

MIT

---

**开始使用**：`seomaster new "your keyword"`
