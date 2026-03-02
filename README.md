# SEOMaster - 通用内容写作工作流

> 一个可复用的、AI 驱动的内容生产工作流系统，专为技术产品的 SEO 内容营销设计。

## 核心特点

- ✅ **Thesis 优先** - 动笔前必须明确核心论点
- ✅ **数据驱动** - 每个判断都有可验证的证据
- ✅ **质量把控** - 硬指标检查，杜绝 AI 套话
- ✅ **多渠道分发** - 一份源文件，多形态输出
- ✅ **AI + 人工** - 明确决策分层，效率与质量兼顾

## 工作流程

```
Research → Thesis确认 → Concept → Write → Review → Rewrite → Publish
```

| 阶段 | 核心问题 | 输出 | 决策者 |
|------|----------|------|--------|
| Research | 有哪些可验证的数据？竞品怎么说？ | 研究笔记 | AI |
| Thesis确认 | 这篇文章的核心卖点是什么？ | 一句话 thesis | 🔴 人工 |
| Concept | 结构是什么？每个部分服务于 thesis 吗？ | article-concept.yaml | 🟡 AI + 人工 |
| Write | 执行 brief，生成初稿 | 初稿 | AI |
| Review | 硬指标 + 质量对照 | 评分 + 修改清单 | AI |
| Rewrite | 修复所有未通过项 | 正式稿 | AI |
| Publish | 多渠道分发 | 各平台发布 | 🔴 人工 |

## 快速开始

### 1. 初始化项目

```bash
# 复制 SEOMaster 到你的项目
cp -r seomaster /path/to/your-project/

# 进入项目目录
cd /path/to/your-project/seomaster

# 复制配置模板
cp templates/project-config.yaml ../project-config.yaml
```

### 2. 填写项目配置

编辑 `project-config.yaml`，填写你的产品信息：

```yaml
project:
  name: "YourProduct"
  tagline: "一句话产品定位"
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
    source: "官网模型列表"
    verified: true
    date: "2026-03-02"
```

**最小配置清单：**
- ✅ 产品名称和定位
- ✅ 目标读者和痛点
- ✅ 3-5 个核心数据点
- ✅ 2-3 个主要竞品
- ✅ 发布平台列表

### 3. 创建第一篇文章

```bash
# 复制文章任务模板
cp templates/article-task.yaml articles/my-first-article.yaml

# 编辑文章任务
vim articles/my-first-article.yaml
```

填写关键信息：

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
  - platform: "知乎"
```

### 4. 生成 Concept

```bash
# 使用 AI 生成 Concept（需要配置 API Key）
node scripts/generate-concept.js articles/my-first-article.yaml

# 或手动填写
cp templates/article-concept.yaml articles/my-first-article-concept.yaml
vim articles/my-first-article-concept.yaml
```

### 5. 生成初稿

```bash
# AI 生成初稿
node scripts/generate-draft.js articles/my-first-article-concept.yaml

# 输出：articles/my-first-article-draft.md
```

### 6. 质量检查

```bash
# 运行质量检查脚本
node scripts/quality-check.js articles/my-first-article-draft.md

# 输出：
# ✅ 硬指标通过
# ❌ 发现 2 处「本文」，需要修复
# ✅ 字数 2,150（目标 2,000）
# 总分：85/100
```

### 7. 人工审阅和修改

根据质量检查报告，修改文章：
- 修复所有硬指标问题
- 验证数据准确性
- 确认 Thesis 清晰
- 检查 CTA 有效性

### 8. 发布

```bash
# 翻译（如果需要）
node scripts/translate.js articles/my-first-article-final.md --to en

# 发布到各平台（手动或自动）
node scripts/publish.js articles/my-first-article-final.md
```

## 目录结构

```
seomaster/
├── templates/              # 配置模板
│   ├── project-config.yaml       # 项目配置
│   ├── content-types.yaml        # 内容类型定义
│   ├── quality-standards.yaml    # 质量标准
│   ├── article-task.yaml         # 文章任务模板
│   └── article-concept.yaml      # Concept 模板
├── scripts/                # 自动化脚本
│   ├── generate-concept.js       # 生成 Concept
│   ├── generate-draft.js         # 生成初稿
│   ├── quality-check.js          # 质量检查
│   ├── translate.js              # 翻译
│   └── publish.js                # 发布
├── docs/                   # 文档
│   ├── workflow-guide.md         # 工作流详细指南
│   ├── writing-principles.md     # 写作原则
│   └── quality-checklist.md      # 质量检查清单
├── examples/               # 示例
│   ├── lemondata/                # LemonData 完整示例
│   └── saas-product/             # SaaS 产品示例
└── README.md               # 本文件
```

## 配置文件说明

### project-config.yaml
项目级配置，包含：
- 产品基本信息
- 品牌声音
- 目标读者
- 竞品信息
- 核心数据点
- 发布渠道
- SEO 关键词

### content-types.yaml
定义不同内容类型的规范：
- 技术博客（1500-3000 字）
- 平台对比（1000-2000 字）
- 教程（800-1500 字）
- 社交帖子（100-500 字）
- 产品更新（300-800 字）

### quality-standards.yaml
质量标准配置：
- 硬指标（标点、禁用词、AI 句式）
- 开篇规范
- 结尾规范
- 核心写作原则
- 质量检查清单

### article-task.yaml
单篇文章的任务配置：
- 基本信息（ID、标题、类型）
- Thesis
- 目标和受众
- 发布平台
- SEO 配置
- 数据点
- 文章结构

### article-concept.yaml
文章立意（Concept）：
- 核心论点
- 文章结构
- 数据支撑
- 开篇方式
- CTA

## 决策分层

### 🔴 必须人工决策
- Thesis 方向（AI 提 2-3 个候选，人选）
- 核心卖点的表述
- 价格/数据的准确性确认
- 发布决定

### 🟡 AI 建议 + 人工快速确认
- 文章结构骨架
- 开篇切入角度
- SEO 关键词选择
- 竞品对比角度

### 🟢 AI 自主执行
- 硬指标修复（机械层）
- AI 句式替换
- 翻译（中↔英）
- 格式规范化

## 内容类型

| 类型 | 篇幅 | 目标 | 示例 |
|------|------|------|------|
| 技术博客 | 1500-3000字 | SEO + 教育 | 「如何用一个 API Key 访问 300+ AI 模型」 |
| 平台对比 | 1000-2000字 | 转化 | 「OpenRouter vs LemonData：价格、速度、模型数」 |
| 迁移指南 | 800-1500字 | 转化 | 「从 OpenAI 官方 API 迁移到 LemonData 只需改一行」 |
| 社交帖子 | 100-500字 | 传播 | 知乎回答、小红书、Twitter Thread |
| 产品更新 | 300-800字 | 留存 | 「本周新增 15 个模型，含 Claude 4.5」 |

## 质量标准

### 硬指标速查

| 指标 | 上限 | 超标处理 |
|------|------|----------|
| —— | ≤3/篇 | 替换为冒号/逗号/句号 |
| ** | ≤3/篇 | 仅保留核心卖点句 |
| 路标词 | 0 | 首先/其次/最后 → 删除 |
| 揭示类 | 0 | 揭示了/佐证了 → 删除 |
| 元叙事 | 0 | 让我们/本文 → 删除 |
| 营销腔 | 0 | 颠覆性/赋能 → 具体功能 |

### 核心原则

1. **Thesis 优先** - 动笔前必须能用一句话回答：「读完后，读者会记住什么？」
2. **证据驱动** - 每个核心判断需要数据支撑，案例必须可核实
3. **开发者视角** - 代码示例 > 文字描述，具体数字 > 模糊修饰

## 脚本使用

### generate-concept.js
根据 article-task.yaml 和 project-config.yaml 生成 Concept

```bash
node scripts/generate-concept.js articles/my-article.yaml
```

### generate-draft.js
根据 Concept 生成初稿

```bash
node scripts/generate-draft.js articles/my-article-concept.yaml
```

### quality-check.js
检查文章质量，输出评分和修改建议

```bash
node scripts/quality-check.js articles/my-article-draft.md

# 输出示例：
# ✅ 硬指标通过
# ❌ 发现 2 处「本文」
# ✅ 字数 2,150
# 总分：85/100
```

### translate.js
翻译文章

```bash
node scripts/translate.js articles/my-article.md --to en
# 输出：articles/my-article.en.md
```

### publish.js
发布到各平台

```bash
node scripts/publish.js articles/my-article.md --platforms blog,zhihu
```

## 示例项目

### LemonData 示例
完整的 LemonData 内容营销案例，包含：
- 项目配置
- 21 篇博客文章规划
- 完整的 Concept 和初稿
- 质量检查报告

查看：`examples/lemondata/`

### SaaS 产品示例
通用 SaaS 产品的内容营销模板

查看：`examples/saas-product/`

## 环境配置

### API Keys

在项目根目录创建 `.env` 文件：

```bash
# 文本生成 API
OPENAI_API_KEY=sk-xxxxx
OPENAI_API_BASE=https://api.openai.com/v1

# 图片生成 API（可选）
IMAGE_API_KEY=sk-xxxxx
IMAGE_API_BASE=https://api.openai.com/v1
```

### 依赖安装

```bash
npm install
# 或
yarn install
```

## 常见问题

### Q: 如何自定义质量标准？
A: 编辑 `templates/quality-standards.yaml`，修改硬指标限制和禁用词列表。

### Q: 如何添加新的内容类型？
A: 在 `templates/content-types.yaml` 中添加新类型的定义。

### Q: 如何集成到现有的 CMS？
A: 修改 `scripts/publish.js`，添加你的 CMS API 调用。

### Q: 支持哪些语言？
A: 默认支持中英文，可以通过修改翻译脚本支持更多语言。

### Q: 如何处理图片？
A: 在 Concept 中标注需要的图片，使用 `<!-- SCREENSHOT: 描述 -->` 标记位置。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

本工作流改编自 Pentos 研究报告流水线，并结合了 LemonData 内容营销的实践经验。

---

**开始你的第一篇文章：**

```bash
cp templates/project-config.yaml ../project-config.yaml
vim ../project-config.yaml
# 填写你的产品信息，然后开始写作！
```
