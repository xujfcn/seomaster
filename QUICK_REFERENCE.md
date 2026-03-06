# SEOMaster Quick Reference

## 三种工作模式

### 🎯 交互式模式（推荐新手）
```bash
seomaster new "keyword" -i
```
- 大纲生成后等待确认
- 可重试、编辑或取消
- 适合首次使用或重要文章

### ⚡ 自动模式（推荐熟练用户）
```bash
seomaster new "keyword"
```
- 一键完成全流程
- 无需人工干预
- 适合批量生产

### 🔧 分步模式（精细控制）
```bash
seomaster concept "keyword"    # 生成大纲
seomaster preview keyword      # 预览
seomaster draft concept.yaml   # 生成正文
seomaster images draft.md      # 配图
seomaster check draft.md       # 检查
```
- 每步独立执行
- 可随时编辑
- 适合深度定制

## 常用命令速查

```bash
# 生成文章
seomaster new "api guide" -i --words 2500

# 预览大纲
seomaster preview api-guide

# 生成正文
seomaster draft output/api-guide-concept.yaml

# 配图（最多3张）
seomaster images output/api-guide-draft.md

# 质量检查
seomaster check api-guide

# 列出所有文章
seomaster list
```

## 参数说明

| 参数 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `-i, --interactive` | 交互式模式 | false | `-i` |
| `-w, --words <n>` | 目标字数 | 2500 | `--words 3000` |
| `-l, --lang <lang>` | 语言 | en | `--lang zh` |
| `-m, --market <market>` | 市场 | us | `--market cn` |
| `-r, --results <n>` | 搜索结果数 | 10 | `--results 15` |
| `--skip-images` | 跳过配图 | false | `--skip-images` |
| `--no-preview` | 跳过预览 | false | `--no-preview` |

## 文件结构

```
output/
├── keyword-concept.yaml      # 大纲
├── keyword-draft.md          # 正文
├── keyword-research.json     # 竞品数据
├── keyword-1.png            # 配图1
├── keyword-2.png            # 配图2
└── keyword-3.png            # 配图3
```

## 交互式选项

生成大纲后的选择：

- **✓ Continue** - 继续生成正文
- **↻ Regenerate** - 重新生成大纲
- **✎ Edit** - 手动编辑 YAML 文件
- **✕ Cancel** - 取消流程

## 配图标记

在 draft 中使用：

```markdown
<!-- IMAGE: Comparison table showing API pricing -->
```

支持的图片类型：
- Comparison table（对比表格）
- Flowchart（流程图）
- Dashboard screenshot（仪表盘）
- Decision tree（决策树）
- Diagram（技术图表）

## 环境变量

`.env` 文件配置：

```bash
# AI API
AI_API_KEY=sk-xxx
AI_API_BASE_URL=https://crazyrouter.com/v1
AI_MODEL=claude-sonnet-4-6

# Apify（搜索引擎）
APIFY_API_TOKEN=apify_api_xxx

# GitHub 图床
GITHUB_TOKEN=ghp_xxx
GITHUB_REPO=username/images
GITHUB_BRANCH=main
```

## 质量检查指标

- ✅ 禁用词检查（AI 套话）
- ✅ 数据来源引用
- ✅ 表格使用
- ✅ FAQ 完整性
- ✅ 字数统计
- ✅ Bold/Em dash/Exclamation 限制

## 故障排查

### 大纲质量不佳
```bash
# 增加搜索结果数
seomaster concept "keyword" --results 15

# 或使用交互式重试
seomaster new "keyword" -i
# 选择 "↻ Regenerate"
```

### 配图生成失败
```bash
# 检查 AI API Key
echo $AI_API_KEY

# 单独重试配图
seomaster images output/keyword-draft.md
```

### 字数超标
```bash
# 降低目标字数
seomaster new "keyword" --words 2000
```

## 快捷别名

添加到 `.bashrc` 或 `.zshrc`：

```bash
alias seonew='seomaster new -i'
alias seoprev='seomaster preview'
alias seocheck='seomaster check'
alias seolist='seomaster list'
```

使用：
```bash
seonew "api guide"
seoprev api-guide
seocheck api-guide
```

## 工作流时间估算

| 步骤 | 时间 | 说明 |
|------|------|------|
| Concept | 1-2 min | 搜索 + 抓取 + AI 生成 |
| 人工确认 | 1-2 min | 仅交互式模式 |
| Draft | 2-3 min | AI 生成正文 |
| Images | 1-2 min | 生成 3 张配图 |
| Quality Check | 10 sec | 自动检查 |
| **总计** | **4-7 min** | 不含人工编辑 |

## 更多文档

- [交互式工作流详解](INTERACTIVE_WORKFLOW.md)
- [自动配图指南](IMAGE_WORKFLOW.md)
- [完整 README](README.md)
