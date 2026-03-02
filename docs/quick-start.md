# SEOMaster 快速开始指南

5 分钟上手 SEOMaster，开始你的第一篇文章。

## 前置要求

- Node.js 16+
- 文本编辑器
- OpenAI API Key（或其他兼容 API）

## 步骤 1: 复制模板（1 分钟）

```bash
# 假设你已经有了 seomaster 文件夹
cd your-project/

# 复制项目配置模板
cp seomaster/templates/project-config.yaml project-config.yaml
```

## 步骤 2: 填写最小配置（2 分钟）

编辑 `project-config.yaml`，只填写必填项：

```yaml
project:
  name: "YourProduct"                    # 你的产品名
  tagline: "一句话产品定位"               # 例如："AI API 聚合平台"
  website: "https://yourproduct.com"

value_proposition:
  full: "YourProduct 让独立开发者用一个 API 访问 300+ AI 模型，省 40% API 费用"

audience:
  primary:
    title: "独立开发者"
    pain_points:
      - "API 价格高"
      - "多平台配置繁琐"

key_metrics:
  - metric: "支持模型数量"
    value: "300+"
    source: "官网"
    verified: true
    date: "2026-03-02"

competitors:
  - name: "Competitor A"
    weaknesses:
      - "价格贵"

channels:
  blog:
    enabled: true
  chinese:
    - platform: "知乎"
      enabled: true
```

## 步骤 3: 创建第一篇文章（2 分钟）

```bash
# 复制文章任务模板
cp seomaster/templates/article-task.yaml articles/my-first-article.yaml
```

编辑 `articles/my-first-article.yaml`，填写核心信息：

```yaml
article:
  id: "blog-001"
  type: "technical_blog"

thesis:
  statement: "用 YourProduct 替代 Competitor，每月省 40% 费用"

goal:
  primary: "转化"

target_platforms:
  - platform: "官网博客"
```

## 步骤 4: 开始写作

### 方式 A: 手动写作（推荐新手）

```bash
# 复制 Concept 模板
cp seomaster/templates/article-concept.yaml articles/my-first-article-concept.yaml

# 填写 Concept
vim articles/my-first-article-concept.yaml

# 根据 Concept 手动写作
vim articles/my-first-article-draft.md
```

### 方式 B: AI 辅助（需要 API Key）

```bash
# 配置 API Key
echo "OPENAI_API_KEY=sk-xxxxx" > .env

# AI 生成 Concept
node seomaster/scripts/generate-concept.js articles/my-first-article.yaml

# AI 生成初稿
node seomaster/scripts/generate-draft.js articles/my-first-article-concept.yaml
```

## 步骤 5: 质量检查

```bash
# 运行质量检查
node seomaster/scripts/quality-check.js articles/my-first-article-draft.md

# 查看评分和修改建议
```

## 步骤 6: 发布

```bash
# 手动发布到各平台
# 或使用发布脚本（需要配置平台 API）
node seomaster/scripts/publish.js articles/my-first-article-final.md
```

---

## 最小配置清单

只需填写这 5 项就能开始：

1. ✅ 产品名称和定位
2. ✅ 目标读者和痛点
3. ✅ 3 个核心数据点
4. ✅ 1-2 个主要竞品
5. ✅ 发布平台列表

---

## 下一步

- 📖 阅读 [工作流详细指南](docs/workflow-guide.md)
- 📝 查看 [LemonData 示例](examples/lemondata/)
- 🎯 学习 [写作原则](docs/writing-principles.md)

---

**遇到问题？** 查看 [常见问题](README.md#常见问题) 或提交 Issue。
