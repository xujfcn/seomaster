# SEOMaster 启动运行指南

## 快速启动（3 步）

### 1. 查看现有项目

```bash
cd D:\lemondata-free\lemondata-content\seomaster
seomaster project:list
```

输出示例：
```
📁 Projects:

● Crazyrouter (crazyrouter)
  Multi-protocol AI API gateway
  Vault: D:/crazyrouter
```

### 2. 生成文章

```bash
seomaster new "your keyword"
```

系统会自动：
- 显示当前项目信息
- 加载对应知识库
- 开始生成文章

### 3. 查看结果

```bash
ls output/
```

生成的文件：
- `keyword-concept.yaml` - 文章大纲
- `keyword-draft.md` - 完整文章
- `keyword-research.json` - 研究数据
- `keyword-1.png`, `keyword-2.png` - 配图

## 完整工作流

### 方式 1: 一键生成（推荐）

```bash
# 生成完整文章（concept + draft + images）
seomaster new "ai api pricing"

# 交互式模式（可以预览和确认）
seomaster new "ai api pricing" -i

# 自定义参数
seomaster new "ai api pricing" --words 3000 --results 5
```

### 方式 2: 分步生成

```bash
# 步骤 1: 生成 concept
seomaster concept "ai api pricing"

# 步骤 2: 预览 concept
seomaster preview output/ai-api-pricing-concept.yaml

# 步骤 3: 生成 draft
seomaster draft output/ai-api-pricing-concept.yaml

# 步骤 4: 生成图片
seomaster images output/ai-api-pricing-draft.md

# 步骤 5: 质量检查
seomaster check output/ai-api-pricing-draft.md
```

## 多项目管理

### 添加新项目

```bash
seomaster project:add
```

交互式问答：
```
? Project ID: myproduct
? Project name: My Product
? Description: My awesome product
? Knowledge base path: D:/myproduct-kb
? Output directory: output
? Default language: en
? Default word count: 2500
```

### 切换项目

```bash
seomaster project
```

选择项目：
```
? Select a project:
  ● Crazyrouter
  ○ My Product
  + Add new project
```

### 指定项目生成

```bash
seomaster new "keyword" --project myproduct
```

## 命令参数说明

### new 命令

```bash
seomaster new <keyword> [options]
```

**参数**:
- `<keyword>` - 目标关键词（必填）
- `-p, --project <name>` - 指定项目
- `-l, --lang <lang>` - 语言（en/zh）
- `-m, --market <market>` - 市场（us/cn）
- `-r, --results <number>` - 搜索结果数
- `-w, --words <number>` - 目标字数
- `-i, --interactive` - 交互式模式
- `--skip-images` - 跳过图片生成

**示例**:
```bash
# 基本用法
seomaster new "ai api pricing"

# 中文文章
seomaster new "AI API 定价" --lang zh --market cn

# 长文章
seomaster new "comprehensive guide" --words 5000

# 交互式模式
seomaster new "keyword" -i

# 完整配置
seomaster new "keyword" \
  --project myproduct \
  --lang en \
  --words 3000 \
  --results 5 \
  --interactive
```

## 常见使用场景

### 场景 1: 快速生成英文文章

```bash
seomaster new "best ai tools 2026" --words 2500
```

### 场景 2: 生成中文文章

```bash
seomaster new "最佳 AI 工具" --lang zh --market cn --words 3000
```

### 场景 3: 生成长文章

```bash
seomaster new "complete guide to ai apis" --words 5000 --results 10
```

### 场景 4: 交互式生成（可预览和修改）

```bash
seomaster new "ai api comparison" -i
```

流程：
1. 生成 concept
2. 预览 concept
3. 选择：继续/重新生成/编辑/取消
4. 生成 draft
5. 生成图片
6. 质量检查

### 场景 5: 为不同项目生成文章

```bash
# 为项目 A 生成
seomaster new "keyword" --project product-a

# 为项目 B 生成
seomaster new "keyword" --project product-b
```

## 输出文件说明

生成的文件位于 `output/` 目录：

```
output/
├── ai-api-pricing-concept.yaml    # 文章大纲和结构
├── ai-api-pricing-draft.md        # 完整文章（Markdown）
├── ai-api-pricing-research.json   # 竞品研究数据
├── ai-api-pricing-1.png           # 配图 1
├── ai-api-pricing-2.png           # 配图 2
└── ai-api-pricing-3.png           # 配图 3
```

### concept.yaml 结构

```yaml
keyword: "ai api pricing"
slug: "ai-api-pricing"
title: "AI API Pricing: A Practical Guide..."
thesis:
  statement: "..."
  final: "..."
sections:
  - title: "Section 1"
    word_count: 500
    key_point: "..."
    subsections: [...]
faq:
  - question: "..."
    answer: "..."
```

### draft.md 结构

```markdown
# Title

Introduction...

## Section 1

Content...

![Image description](./ai-api-pricing-1.png)

## Section 2

Content...

## FAQ

### Question 1?

Answer...

## Conclusion

CTA...
```

## 知识库管理

### 查看当前知识库

```bash
# 当前项目使用的知识库路径
seomaster project:list
```

### 编辑知识库

```bash
# 在 Obsidian 中打开
# File → Open folder as vault → D:\crazyrouter
```

### 测试知识库加载

```bash
cd D:\lemondata-free\lemondata-content\seomaster
node test-knowledge.js
```

输出示例：
```
=== Test 1: Keyword "pricing" ===
📚 knowledge: 2 files (Product.md, Pricing.md)
Length: 1932 chars
```

## 故障排除

### 问题 1: 命令不存在

```
'seomaster' is not recognized as an internal or external command
```

**解决**:
```bash
cd D:\lemondata-free\lemondata-content\seomaster
npm link
```

### 问题 2: 项目未找到

```
❌ Project not found: myproduct
```

**解决**:
```bash
# 查看可用项目
seomaster project:list

# 或添加新项目
seomaster project:add
```

### 问题 3: 知识库为空

```
⚠️ knowledge: empty
```

**解决**:
1. 检查项目配置中的 `vault_path`
2. 确保知识库目录存在
3. 确保知识库中有 .md 文件

### 问题 4: API 错误

```
❌ AI API failed: 401
```

**解决**:
检查 `.env` 文件中的 API 配置：
```bash
AI_API_KEY=your-api-key
AI_API_BASE_URL=https://crazyrouter.com/v1
AI_MODEL=claude-sonnet-4-6
```

### 问题 5: 图片上传失败

```
⚠️ Upload failed: 403
```

**解决**:
图片已保存到本地 `output/` 目录，可以手动上传。
检查 GitHub token 权限：
```bash
GITHUB_TOKEN=your-github-token
```

## 性能优化

### 减少 Token 消耗

```bash
# 减少搜索结果数
seomaster new "keyword" --results 3

# 减少字数
seomaster new "keyword" --words 1500

# 跳过图片生成
seomaster new "keyword" --skip-images
```

### 加快生成速度

```bash
# 使用更少的搜索结果
seomaster new "keyword" --results 3

# 生成更短的文章
seomaster new "keyword" --words 1500
```

## 最佳实践

### 1. 关键词选择

✅ 好的关键词：
- "ai api pricing comparison"
- "best ai tools for developers"
- "how to use openai api"

❌ 避免：
- 太宽泛："ai"
- 太长："how to use openai api to build a chatbot application with python and deploy it to production"

### 2. 字数设置

- **短文章**（1000-1500 字）：快速生成，适合博客
- **中等文章**（2000-3000 字）：平衡深度和速度
- **长文章**（4000-5000 字）：深度内容，需要更多时间

### 3. 搜索结果数

- **3-5 个结果**：快速生成，适合测试
- **5-8 个结果**：平衡质量和速度（推荐）
- **8-10 个结果**：最高质量，但较慢

### 4. 交互式模式

使用 `-i` 参数可以：
- 预览 concept 后再决定是否继续
- 发现问题时重新生成
- 手动编辑 concept 文件

## 快速参考

```bash
# 项目管理
seomaster project:list         # 列出项目
seomaster project:add          # 添加项目
seomaster project              # 切换项目

# 文章生成
seomaster new "keyword"        # 完整流程
seomaster concept "keyword"    # 只生成 concept
seomaster draft concept.yaml   # 只生成 draft
seomaster images draft.md      # 只生成图片

# 查看和检查
seomaster preview concept.yaml # 预览 concept
seomaster check draft.md       # 质量检查
seomaster list                 # 列出所有文章

# 帮助
seomaster --help               # 查看帮助
seomaster new --help           # 查看 new 命令帮助
```

## 下一步

1. **添加更多知识** - 在 Obsidian 中编辑知识库
2. **生成测试文章** - 测试不同关键词和配置
3. **优化配置** - 根据结果调整默认参数
4. **添加新项目** - 为其他产品创建项目

## 获取帮助

- **文档**: 查看 `MULTI-PROJECT-GUIDE.md`
- **示例**: 查看 `output/` 目录中的示例文章
- **测试**: 运行 `node test-knowledge.js`

---

**准备好了吗？开始生成你的第一篇文章：**

```bash
seomaster new "your keyword"
```
