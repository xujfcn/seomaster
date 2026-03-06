# Auto Image Generation Workflow

## 功能说明

SEOMaster 现在支持自动配图功能：
- 自动识别 draft 中的 `<!-- IMAGE: description -->` 标记
- 使用 DALL-E 3 生成专业技术配图
- 自动上传到 GitHub 图床（xujfcn/images）
- 每篇文章最多 3 张配图

## 使用方法

### 1. 完整工作流（推荐）

```bash
seomaster new "your keyword" --words 2500
```

自动执行：
1. 生成 concept
2. 生成 draft
3. **生成配图（最多 3 张）**
4. 质量检查

### 2. 跳过配图

```bash
seomaster new "your keyword" --skip-images
```

### 3. 单独生成配图

```bash
# 为已有 draft 生成配图
seomaster images output/article-draft.md

# 或使用 slug
seomaster images article-slug
```

## 配图标记格式

在 draft 中使用以下格式：

```markdown
<!-- IMAGE: Comparison table showing API pricing across providers -->
```

**描述要求**：
- 清晰描述图片内容
- 包含关键词（如 "comparison table", "flowchart", "dashboard"）
- 英文描述

**支持的图片类型**：
- Comparison table（对比表格）
- Flowchart（流程图）
- Dashboard screenshot（仪表盘截图）
- Decision tree（决策树）
- Diagram（技术图表）

## 配置要求

`.env` 文件需包含：

```bash
# AI API（用于 DALL-E 3）
AI_API_KEY=sk-xxx
AI_API_BASE_URL=https://crazyrouter.com/v1

# GitHub 图床
GITHUB_TOKEN=ghp_xxx
GITHUB_REPO=xujfcn/images
GITHUB_BRANCH=main
```

## 输出示例

```
🎨 SEOMaster: Auto Image Generation

  Draft: output/free-api-draft.md
  GitHub: xujfcn/images

⚠️  Found 4 markers, limiting to 3 images

[1/3] Processing 3 image marker(s)

[2/3] Generating images...

  [1] Generating: "Comparison table: Free tier limits..."
    ✓ Generated (465.6 KB)
    ✓ Uploaded to GitHub
    → https://raw.githubusercontent.com/xujfcn/images/main/seomaster/free-api-1.png

[3/3] Updating draft...

  ✓ Updated 3 image(s)

✅ Done!
```

## 注意事项

1. **数量限制**：每篇文章最多 3 张配图（超出部分会被忽略）
2. **生成时间**：每张图片约 10-20 秒
3. **失败处理**：如果上传失败，图片会保存到本地 `output/` 目录
4. **图片命名**：`{article-slug}-{index}.png`

## 故障排查

### 图片生成失败
- 检查 AI_API_KEY 是否有效
- 确认 DALL-E 3 模型可用

### 上传失败
- 检查 GITHUB_TOKEN 权限（需要 repo 权限）
- 确认仓库 xujfcn/images 存在
- 图片会自动保存到本地作为备份

### 图片不显示
- 确认 GitHub 仓库为 public
- 使用 raw.githubusercontent.com 链接
- 检查图片文件是否成功上传
