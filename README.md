# SEOMaster

AI 驱动的 SEO 内容生成工具，支持多项目管理和智能知识库。

## 快速启动

```bash
# 1. 进入目录
cd D:\lemondata-free\lemondata-content\seomaster

# 2. 查看项目
seomaster project:list

# 3. 生成文章
seomaster new "your keyword"
```

## 核心特性

- ✅ **AI 驱动** - 使用 Claude/GPT 生成高质量 SEO 文章
- ✅ **多项目支持** - 为不同产品维护独立知识库
- ✅ **智能知识库** - 基于关键词自动加载相关知识（Obsidian 集成）
- ✅ **完整工作流** - Concept → Draft → Images → Quality Check
- ✅ **交互式模式** - 预览和确认每个步骤
- ✅ **自动配图** - AI 生成文章配图

## 使用示例

### 基本用法

```bash
# 生成英文文章
seomaster new "ai api pricing"

# 生成中文文章
seomaster new "AI API 定价" --lang zh

# 交互式模式（推荐新手）
seomaster new "keyword" -i

# 自定义参数
seomaster new "keyword" --words 3000 --results 5
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
seomaster new "keyword" --project myproduct
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
seomaster new "keyword"           # 完整流程（推荐）
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
--skip-images             跳过图片生成
```

## 输出文件

```
output/
├── keyword-concept.yaml      # 文章大纲和结构
├── keyword-draft.md          # 完整文章（Markdown）
├── keyword-research.json     # 竞品研究数据
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
seomaster new "keyword"
```

自动完成所有步骤。

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

- **[GETTING-STARTED.md](GETTING-STARTED.md)** - 完整启动指南
- **[MULTI-PROJECT-GUIDE.md](MULTI-PROJECT-GUIDE.md)** - 多项目使用指南
- **[OBSIDIAN-QUICKSTART.md](OBSIDIAN-QUICKSTART.md)** - Obsidian 快速开始
- **[CHANGELOG.md](CHANGELOG.md)** - 更新日志

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
