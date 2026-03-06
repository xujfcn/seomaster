# SEOMaster CLI 使用指南

## 安装

```bash
# 方式 1：全局安装（推荐）
cd seomaster
npm install -g .

# 之后可以在任何地方使用
seomaster new "your keyword"

# 方式 2：本地使用
cd seomaster
node cli.js new "your keyword"

# 方式 3：使用 npm script
npm run seo -- new "your keyword"
```

## 核心命令

### 1. 生成文章（最常用）

```bash
# 一键生成 concept + draft
seomaster new "openrouter alternative"

# 自定义参数
seomaster new "best ai chatbot" \
  --lang en \
  --market us \
  --results 10 \
  --words 2500
```

**参数说明**：
- `--lang` - 语言（en/zh），默认 en
- `--market` - 市场（us/cn），默认 us
- `--results` - Google 搜索结果数量，默认 10
- `--words` - 目标字数，默认 2500

### 2. 分步生成

```bash
# 只生成 concept
seomaster concept "nsfw gpt" --lang en --words 2500

# 从 concept 生成 draft
seomaster draft output/nsfw-gpt-concept.yaml
```

### 3. 质量检查

```bash
# 检查 draft 质量
seomaster check output/nsfw-gpt-draft.md
```

### 4. 查看文章列表

```bash
# 列出所有文章及状态
seomaster list
```

输出示例：
```
📄 Articles:

✓ nsfw-gpt
   ├─ concept.yaml
   └─ draft.md

○ best-ai-chatbot
   ├─ concept.yaml
```

- ✓ = 已完成（有 concept + draft）
- ○ = 进行中（只有 concept）

## 完整工作流示例

```bash
# 1. 生成文章
seomaster new "free ai api guide" --words 2500

# 输出：
# output/free-ai-api-guide-research.json
# output/free-ai-api-guide-concept.yaml
# output/free-ai-api-guide-draft.md

# 2. 质量检查
seomaster check output/free-ai-api-guide-draft.md

# 3. 查看所有文章
seomaster list

# 4. 手动编辑后重新生成（如果需要）
# 编辑 concept.yaml
vim output/free-ai-api-guide-concept.yaml

# 重新生成 draft
seomaster draft output/free-ai-api-guide-concept.yaml
```

## 多项目管理（即将支持）

当前版本使用单一的 `knowledge/` 和 `output/` 目录。

多项目支持正在开发中，将支持：
```bash
seomaster init lemondata
seomaster use lemondata
seomaster new "keyword"
```

**临时方案**：使用符号链接切换项目
```bash
# 备份当前项目
mv knowledge knowledge-project1
mv output output-project1

# 切换到项目 2
ln -sf knowledge-project2 knowledge
ln -sf output-project2 output
```

## 常见问题

### Q: 如何修改默认字数？
A: 使用 `--words` 参数：
```bash
seomaster new "keyword" --words 3000
```

### Q: 生成失败怎么办？
A: 检查：
1. `.env` 文件中的 API 配置是否正确
2. `knowledge/` 目录是否有知识库文件
3. 网络连接是否正常

### Q: 如何只重新生成 draft？
A: 编辑 concept.yaml 后运行：
```bash
seomaster draft output/article-slug-concept.yaml
```

### Q: 支持中文吗？
A: 支持，使用 `--lang zh`：
```bash
seomaster new "AI 工具推荐" --lang zh --market cn
```

## 帮助信息

```bash
# 查看所有命令
seomaster --help

# 查看特定命令帮助
seomaster new --help
```
