# SEOMaster 新手入门指南

> 从零开始，5 分钟完成第一篇 AI 生成的 SEO 文章

## 前置要求

- Node.js 16+ 
- Git
- AI API Key（支持 OpenAI 兼容接口）

## 第一步：克隆项目

```bash
# 克隆 SEOMaster 项目
git clone https://github.com/xujfcn/seomaster.git

# 进入项目目录
cd seomaster
```

## 第二步：安装依赖

```bash
# 安装 Node.js 依赖
npm install
```

## 第三步：配置环境变量

创建 `.env` 文件（复制示例配置）：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写必需的 API Keys：

```bash
# AI API 配置（必需）
AI_API_KEY=sk-your-api-key-here
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4

# Apify API（用于搜索和抓取，必需）
APIFY_API_TOKEN=apify_api_your-token-here

# GitHub 图床配置（可选，用于自动生成图片）
GITHUB_TOKEN=ghp_your-github-token-here
GITHUB_REPO=your-username/images
GITHUB_BRANCH=main
```

### 如何获取 API Keys？

#### 1. AI API Key

**选项 A：使用 OpenAI 官方**
- 访问 https://platform.openai.com/api-keys
- 创建新的 API Key
- 设置：
  ```
  AI_API_KEY=sk-xxxxx
  AI_API_BASE_URL=https://api.openai.com/v1
  AI_MODEL=gpt-4
  ```

**选项 B：使用第三方代理（推荐国内用户）**
- 使用支持 OpenAI 兼容接口的服务（如 CrazyRouter、OpenRouter 等）
- 设置：
  ```
  AI_API_KEY=sk-xxxxx
  AI_API_BASE_URL=https://your-proxy.com/v1
  AI_MODEL=claude-sonnet-4-6
  ```

#### 2. Apify API Token

- 访问 https://console.apify.com/account/integrations
- 注册账号（免费额度足够测试使用）
- 复制 API Token

#### 3. GitHub Token（可选）

如果需要自动生成图片功能：
- 访问 https://github.com/settings/tokens
- 创建 Personal Access Token
- 权限选择：`repo`（完整仓库访问）
- 创建一个公开仓库用于存储图片（如 `your-username/images`）

## 第四步：安装 CLI 工具

```bash
# 全局安装 CLI 工具
npm install -g .

# 验证安装
seomaster --version
```

## 第五步：生成第一篇文章

### 方式 A：交互式模式（推荐新手）

```bash
seomaster new "your keyword" -i --words 2500
```

例如：
```bash
seomaster new "best ai api" -i --words 2500
```

流程：
1. 自动搜索 Google 前 10 个结果
2. 抓取竞品文章大纲
3. AI 生成优化的文章大纲（concept）
4. **显示预览，等待你确认**
5. 生成完整文章（draft）
6. 自动生成配图（最多 3 张）
7. 质量检查

### 方式 B：自动全流程（推荐熟练用户）

```bash
seomaster new "your keyword" --words 2500
```

跳过确认步骤，直接生成完整文章。

### 方式 C：分步执行（推荐需要精细控制）

```bash
# 1. 只生成 concept
seomaster concept "your keyword"

# 2. 预览 concept
seomaster preview your-keyword

# 3. 生成 draft
seomaster draft your-keyword-concept.yaml

# 4. 生成图片
seomaster images your-keyword-draft.md

# 5. 质量检查
seomaster check your-keyword-draft.md
```

## 第六步：查看生成的文件

所有生成的文件都在 `output/` 目录：

```bash
cd output
ls -la

# 你会看到：
# your-keyword-research.json    # 搜索和抓取的原始数据
# your-keyword-concept.yaml     # 文章大纲和结构
# your-keyword-draft.md         # 生成的文章初稿
```

## 第七步：审阅和修改

### 1. 查看质量检查报告

质量检查会自动运行，检查：
- ✅ 字数是否符合目标
- ✅ 是否有 AI 套话（如"本文"、"总之"等）
- ✅ 是否有数据引用
- ✅ 是否有表格
- ✅ 是否有 FAQ 部分

### 2. 手动审阅要点

打开 `output/your-keyword-draft.md`，检查：

- **Thesis 是否清晰**：文章的核心观点是什么？
- **数据是否准确**：所有 `[DATA: ...]` 占位符需要填充真实数据
- **逻辑是否连贯**：段落之间的过渡是否自然
- **CTA 是否有效**：行动号召是否明确

### 3. 修改文章

直接编辑 `output/your-keyword-draft.md` 文件，修改后重新运行质量检查：

```bash
seomaster check your-keyword-draft.md
```

## 常见问题

### Q1: AI 返回空响应怎么办？

如果遇到 "AI returned empty content" 错误，尝试减少搜索结果数：

```bash
seomaster new "your keyword" --results 3 --words 2500
```

### Q2: 如何修改文章语言和市场？

```bash
# 中文文章，面向中国市场
seomaster new "你的关键词" --lang zh --market cn

# 英文文章，面向美国市场（默认）
seomaster new "your keyword" --lang en --market us
```

### Q3: 如何跳过图片生成？

```bash
seomaster new "your keyword" --skip-images
```

### Q4: 生成的文章字数总是超标怎么办？

这是已知问题，AI 通常会超出目标字数 20-30%。建议：
- 设置更保守的目标字数（如目标 2000 字，设置 `--words 1500`）
- 生成后手动删减冗余内容

### Q5: 如何查看所有生成的文章？

```bash
seomaster list
```

## 下一步

- 📖 阅读 [交互式工作流指南](INTERACTIVE_WORKFLOW.md)
- 🎨 阅读 [自动图片生成指南](IMAGE_WORKFLOW.md)
- 🔧 阅读 [故障排查指南](TROUBLESHOOTING.md)
- 📋 阅读 [快速参考卡](QUICK_REFERENCE.md)

## 进阶配置

### 自定义知识库

编辑 `knowledge/` 目录下的文件，添加你的产品信息：

- `product.md` - 产品介绍
- `competitors.md` - 竞品分析
- `models_pricing.md` - 定价信息
- `benchmarks.md` - 性能数据
- `target_keywords.md` - 目标关键词
- `published_articles.md` - 已发布文章

这些信息会被 AI 用于生成更准确、更相关的内容。

### 调整 AI 参数

编辑 `scripts/lib/draft-config.js` 可以调整：
- 温度（temperature）
- 最大 token 数
- 重试次数
- 超时时间

## 技术支持

- 📝 提交 Issue: https://github.com/xujfcn/seomaster/issues
- 📧 联系作者: [在 GitHub 上查看]

---

**祝你使用愉快！🚀**
