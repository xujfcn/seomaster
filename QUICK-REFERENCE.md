# SEOMaster 快速参考

## 启动命令

```bash
# 交互式菜单（推荐）
seomaster

# 命令行模式
seomaster new "keyword"
```

---

## 交互式菜单流程

```
主菜单
  ├─ Enter Project → 项目菜单
  │    ├─ New Article → 新建文章流程
  │    │    ├─ 输入关键词
  │    │    ├─ 选择语言/参数
  │    │    ├─ 自动生成 Concept
  │    │    ├─ 预览并确认 Concept ⭐
  │    │    │    ├─ ✓ Continue（继续）
  │    │    │    ├─ ↻ Regenerate（重新生成）
  │    │    │    ├─ ✎ Edit（手动编辑）
  │    │    │    └─ ✕ Cancel（取消）
  │    │    ├─ 生成 Draft
  │    │    ├─ 质量检查
  │    │    └─ 查看详情 / 继续创建
  │    │
  │    └─ List Articles → 文章列表
  │         └─ 选择文章 → 文章详情菜单
  │              ├─ Generate Draft
  │              ├─ Quality Check
  │              └─ Generate Images
  │
  ├─ Switch Project → 切换项目
  ├─ Create New Project → 创建新项目
  └─ Exit
```

**⭐ 新增**：Concept 确认步骤，避免生成不满意的 Draft

---

## 命令行快速参考

### 文章生成

```bash
# 完整流程（推荐）
seomaster new "keyword"

# 交互式模式
seomaster new "keyword" -i

# 自定义参数
seomaster new "keyword" --lang zh --words 3000 --results 5

# 禁用域名过滤
seomaster new "keyword" --no-filter

# 跳过图片生成
seomaster new "keyword" --skip-images
```

### 分步生成

```bash
# 1. 生成 Concept
seomaster concept "keyword"

# 2. 预览 Concept
seomaster preview keyword-concept.yaml

# 3. 生成 Draft
seomaster draft keyword-concept.yaml

# 4. 质量检查
seomaster check keyword-draft.md

# 5. 生成图片
seomaster images keyword-draft.md
```

### 项目管理

```bash
# 列出所有项目
seomaster project:list

# 切换项目
seomaster project

# 添加新项目
seomaster project:add
```

### 文章管理

```bash
# 列出所有文章
seomaster list
```

---

## 文件命名规则

```
output/
├── {slug}-concept.yaml      # 文章大纲
├── {slug}-draft.md          # 完整文章
├── {slug}-research.json     # 竞品研究数据
├── {slug}-1.png             # 配图 1
├── {slug}-2.png             # 配图 2
└── {slug}-3.png             # 配图 3
```

**slug 生成规则**：
- 关键词转小写
- 非字母数字字符替换为 `-`
- 去除首尾 `-`

示例：
- `"OpenRouter Alternative"` → `openrouter-alternative`
- `"AI API 定价"` → `ai-api-定价`

---

## 参数说明

| 参数 | 短参数 | 默认值 | 说明 |
|------|--------|--------|------|
| `--lang` | `-l` | en | 语言（en/zh） |
| `--market` | `-m` | us | 市场（us/cn） |
| `--words` | `-w` | 2500 | 目标字数 |
| `--results` | `-r` | 5 | 搜索结果数 |
| `--interactive` | `-i` | false | 交互式模式 |
| `--no-filter` | - | false | 禁用域名过滤 |
| `--skip-images` | - | false | 跳过图片生成 |
| `--project` | `-p` | current | 指定项目 |
| `--out` | - | output | 输出目录 |

---

## 质量标准

### 硬指标（自动检查）

- ❌ 禁用词：首先/其次/本文/至关重要/颠覆性/赋能
- ✓ Bold ≤ 3
- ✓ Em dash (——) ≤ 3
- ✓ 感叹号 ≤ 2

### 数据要求

- 所有数据标注来源 + 日期
- 价格对比标注检索日期
- 用户案例可验证

---

## 域名过滤（Blog-Only 模式）

### 默认过滤的网站

**论坛/问答**：
- reddit.com, quora.com
- stackoverflow.com, stackexchange.com
- zhihu.com, v2ex.com

**社交媒体**：
- twitter.com, facebook.com
- linkedin.com, youtube.com

**其他**：
- producthunt.com, wikipedia.org

### 自定义过滤

编辑 `config/domain-filter.js`：
```javascript
const EXCLUDED_DOMAINS = [
  'reddit.com',
  // 添加你想过滤的域名
];

const ALLOWED_DOMAINS = [
  'blog.reddit.com',  // 白名单
];
```

---

## 环境配置

`.env` 文件：

```bash
# AI API
AI_API_KEY=sk-your-api-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o

# Apify（Google 搜索）
APIFY_API_TOKEN=apify_api_your-token

# GitHub（图片上传，可选）
GITHUB_TOKEN=your-github-token
GITHUB_REPO=username/repo
GITHUB_BRANCH=main
```

---

## 项目配置

`projects.json`：

```json
{
  "projects": {
    "my-product": {
      "name": "My Product",
      "vault_path": "D:/my-product-vault",
      "description": "Product description",
      "output_dir": "output",
      "default_lang": "en",
      "default_market": "us",
      "default_words": 2500,
      "default_results": 5
    }
  },
  "current_project": "my-product"
}
```

---

## 故障排除

### 命令不存在

```bash
npm link
```

### API 错误

检查 `.env` 中的 `AI_API_KEY`。

### 项目未找到

```bash
seomaster project:list
```

### 知识库为空

检查 `vault_path` 是否正确。

---

## 快捷键（交互式模式）

- `↑` `↓` - 上下选择
- `Enter` - 确认
- `Ctrl+C` - 退出

---

## 相关文档

- [交互式使用指南](docs/interactive-guide.md)
- [新项目使用指南](docs/new-project-guide.md)
- [域名过滤说明](docs/domain-filtering.md)

---

**开始使用**：`seomaster`
