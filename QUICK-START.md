# SEOMaster 快速开始

## 5 分钟上手

### 1. 安装依赖

```bash
cd seomaster
npm install
```

### 2. 配置 API

编辑 `.env` 文件：
```bash
AI_API_BASE_URL=https://crazyrouter.com/v1
AI_MODEL=claude-sonnet-4-6
APIFY_API_TOKEN=apify_api_xxxxx
```

### 3. 准备知识库

在 `knowledge/` 目录添加产品信息：
```bash
knowledge/
├── product.md          # 产品介绍
├── competitors.md      # 竞品分析
├── models_pricing.md   # 价格信息
└── ...
```

### 4. 生成第一篇文章

```bash
# 使用 CLI（推荐）
node cli.js new "openrouter alternative"

# 或使用原始脚本
node scripts/generate-concept.js --keyword "openrouter alternative"
node scripts/generate-draft.js --concept output/openrouter-alternative-concept.yaml
```

### 5. 查看结果

```bash
# 查看所有文章
node cli.js list

# 质量检查
node cli.js check output/openrouter-alternative-draft.md
```

## CLI 命令速查

```bash
# 生成文章（concept + draft）
node cli.js new "keyword"

# 只生成 concept
node cli.js concept "keyword"

# 从 concept 生成 draft
node cli.js draft output/article-concept.yaml

# 质量检查
node cli.js check output/article-draft.md

# 列出所有文章
node cli.js list

# 查看帮助
node cli.js --help
```

## 下一步

- 阅读 [CLI-GUIDE.md](./CLI-GUIDE.md) 了解详细用法
- 阅读 [README.md](./README.md) 了解工作流原理
- 查看 `examples/` 目录的示例项目
