# 如何初始化一个全新的项目

## 方式 1：快速开始（5 分钟）

适合：已有产品文档，想快速生成文章

### 步骤 1：安装依赖

```bash
cd seomaster
npm install
```

### 步骤 2：配置 API

复制 `.env.example` 并填写：

```bash
cp .env.example .env
vim .env
```

填写内容：
```bash
AI_API_BASE_URL=https://crazyrouter.com/v1
AI_MODEL=claude-sonnet-4-6
APIFY_API_TOKEN=apify_api_xxxxx
```

### 步骤 3：准备知识库

在 `knowledge/` 目录创建以下文件：

```bash
knowledge/
├── product.md          # 产品介绍（必需）
├── competitors.md      # 竞品分析（推荐）
├── models_pricing.md   # 价格信息（推荐）
└── target_keywords.md  # 目标关键词（可选）
```

**最小配置**（只需 `product.md`）：
```markdown
# 产品名称

## 简介
[产品是什么，解决什么问题]

## 核心功能
- 功能 1
- 功能 2
- 功能 3

## 价格
[价格信息]

## 目标用户
[谁会用这个产品]
```

### 步骤 4：生成第一篇文章

```bash
seomaster new "your keyword" --words 2500
```

完成！

---

## 方式 2：完整配置（推荐用于长期项目）

适合：需要管理多个项目，或需要详细配置

### 步骤 1-2：同上

### 步骤 3：准备原始文档

创建一个文件夹，放入所有产品相关文档：

```bash
mkdir raw-docs
# 将以下文件放入 raw-docs/
# - 产品介绍.md
# - 对话记录.txt
# - 竞品分析.xlsx (转为 .md)
# - 价格表.yaml
# - 任何其他资料
```

### 步骤 4：自动生成项目配置

```bash
node scripts/init-project.js --input raw-docs
```

这会生成 `project-config.yaml`，包含：
- 产品定位
- 目标用户
- 竞品信息
- SEO 关键词库
- 品牌语气

### 步骤 5：完善配置

编辑 `project-config.yaml`，填写标注 `TODO` 的项目。

### 步骤 6：生成知识库文件

从 `project-config.yaml` 提取信息，创建 `knowledge/` 文件：

```bash
# 手动创建，或使用脚本（待开发）
knowledge/
├── product.md          # 从 project-config.yaml 提取
├── competitors.md      # 从 competitors 部分提取
├── models_pricing.md   # 从 key_metrics 提取
└── target_keywords.md  # 从 seo_keywords 提取
```

### 步骤 7：开始生成文章

```bash
seomaster new "your keyword"
```

---

## 方式 3：多项目管理（高级）

适合：同时管理多个产品的内容

### 当前方案（使用符号链接）

```bash
# 1. 为每个项目创建独立目录
mkdir -p projects/project-a/{knowledge,output}
mkdir -p projects/project-b/{knowledge,output}

# 2. 准备项目 A 的知识库
cp your-docs/* projects/project-a/knowledge/

# 3. 切换到项目 A
cd seomaster
rm -rf knowledge output
ln -s ../projects/project-a/knowledge knowledge
ln -s ../projects/project-a/output output

# 4. 生成文章
seomaster new "keyword"

# 5. 切换到项目 B
rm knowledge output
ln -s ../projects/project-b/knowledge knowledge
ln -s ../projects/project-b/output output
```

### 未来方案（CLI 支持，开发中）

```bash
# 初始化项目
seomaster init project-a --knowledge ./projects/project-a/knowledge

# 切换项目
seomaster use project-a

# 生成文章
seomaster new "keyword"
```

---

## 知识库文件详解

### product.md（必需）

```markdown
# 产品名称

## 产品定位
一句话说明产品是什么

## 核心功能
- 功能 1：说明
- 功能 2：说明
- 功能 3：说明

## 技术特点
- 特点 1
- 特点 2

## 价格
- 免费版：功能列表
- 付费版：$X/月，功能列表

## 目标用户
- 用户群体 1：痛点
- 用户群体 2：痛点

## 官网
https://yourproduct.com
```

### competitors.md（推荐）

```markdown
# 竞品分析

## 竞品 1
- 名称：XXX
- 网址：https://xxx.com
- 优势：
  - 优势 1
  - 优势 2
- 劣势：
  - 劣势 1
  - 劣势 2
- 价格：$X/月

## 竞品 2
[同上]
```

### models_pricing.md（推荐）

```markdown
# 模型和价格

## 支持的模型
- GPT-4.1: $X per 1M tokens
- Claude Opus 4.6: $X per 1M tokens
- Gemini 2.5 Pro: $X per 1M tokens

## 价格对比
| 模型 | 官方价格 | 我们的价格 | 节省 |
|------|---------|-----------|------|
| GPT-4.1 | $X | $Y | Z% |
```

### target_keywords.md（可选）

```markdown
# 目标关键词

## 核心关键词
- keyword 1
- keyword 2

## 长尾关键词
- long tail keyword 1
- long tail keyword 2
```

---

## 常见问题

### Q: 知识库文件必须都有吗？
A: 不是。最少只需要 `product.md`。其他文件会提高文章质量。

### Q: 知识库文件可以用中文吗？
A: 可以。AI 会自动翻译。但如果生成英文文章，建议用英文知识库。

### Q: 如何更新知识库？
A: 直接编辑 `knowledge/` 下的文件，下次生成文章时会自动使用新内容。

### Q: 可以不用 init-project.js 吗？
A: 可以。直接手动创建 `knowledge/` 文件即可。`init-project.js` 只是辅助工具。

### Q: 多个项目如何管理？
A: 当前使用符号链接切换。未来会支持 `seomaster init/use` 命令。

---

## 下一步

初始化完成后：

1. 生成第一篇文章：`seomaster new "your keyword"`
2. 查看文章列表：`seomaster list`
3. 质量检查：`seomaster check article-slug`
4. 阅读 [CLI-GUIDE.md](./CLI-GUIDE.md) 了解更多用法
