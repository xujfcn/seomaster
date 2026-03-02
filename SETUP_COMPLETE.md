# SEOMaster 创建完成

✅ 通用内容写作工作流已成功创建在 `seomaster/` 目录下。

## 已创建的文件

### 📋 配置模板 (`templates/`)
- ✅ `project-config.yaml` - 项目配置模板（产品信息、品牌声音、竞品、SEO）
- ✅ `content-types.yaml` - 内容类型定义（博客、对比、教程等）
- ✅ `quality-standards.yaml` - 质量标准配置（硬指标、禁用词、写作原则）
- ✅ `article-task.yaml` - 文章任务模板
- ✅ `article-concept.yaml` - 文章立意模板

### 📜 脚本 (`scripts/`)
- ✅ `generate-concept.js` - 生成 Concept（占位脚本）
- ✅ `generate-draft.js` - 生成初稿（占位脚本）
- ✅ `quality-check.js` - 质量检查（可用）

### 📚 文档 (`docs/`)
- ✅ `workflow-guide.md` - 工作流详细指南
- ✅ `quick-start.md` - 快速开始指南

### 📦 示例 (`examples/`)
- ✅ `lemondata/README.md` - LemonData 示例说明

### 📖 主文档
- ✅ `README.md` - 完整的使用说明

## 目录结构

```
seomaster/
├── templates/              # 配置模板
│   ├── project-config.yaml
│   ├── content-types.yaml
│   ├── quality-standards.yaml
│   ├── article-task.yaml
│   └── article-concept.yaml
├── scripts/                # 自动化脚本
│   ├── generate-concept.js
│   ├── generate-draft.js
│   └── quality-check.js
├── docs/                   # 文档
│   ├── workflow-guide.md
│   └── quick-start.md
├── examples/               # 示例
│   └── lemondata/
│       └── README.md
└── README.md               # 主文档
```

## 核心特性

### 1. 完全参数化
所有 LemonData 特定的内容都抽象为配置参数：
- 产品信息 → `project.name`, `project.tagline`
- 品牌声音 → `voice.tone`, `voice.principles`
- 竞品信息 → `competitors[]`
- 核心数据 → `key_metrics[]`
- 发布渠道 → `channels{}`

### 2. 模板化
提供完整的模板系统：
- 项目配置模板
- 内容类型模板（7 种）
- 质量标准模板
- 文章任务模板
- Concept 模板

### 3. 工作流标准化
明确的 7 阶段工作流：
```
Research → Thesis → Concept → Write → Review → Rewrite → Publish
```

### 4. 决策分层
清晰的 AI vs 人工决策分工：
- 🔴 人工：Thesis、数据验证、发布决定
- 🟡 AI+人工：结构、关键词、竞品角度
- 🟢 AI：初稿、翻译、硬指标修复

### 5. 质量把控
严格的质量标准：
- 硬指标（标点、禁用词、AI 句式）
- 软指标（Thesis、证据、可读性）
- 自动化检查脚本

## 如何使用

### 方式 A: 新项目从零开始

```bash
# 1. 复制 seomaster 到你的项目
cp -r seomaster /path/to/your-project/

# 2. 填写项目配置
cp seomaster/templates/project-config.yaml project-config.yaml
vim project-config.yaml

# 3. 创建第一篇文章
cp seomaster/templates/article-task.yaml articles/blog-001.yaml
vim articles/blog-001.yaml

# 4. 开始写作
```

### 方式 B: 基于 LemonData 示例

```bash
# 1. 查看 LemonData 示例
cd seomaster/examples/lemondata/

# 2. 复制并修改配置
cp project-config-lemondata.yaml ../../../your-project-config.yaml

# 3. 参考已完成的文章
# 查看 blog-openclaw-tutorial.md 的写作方式
```

## 最小输入清单

要使用 SEOMaster，你只需提供：

1. **产品名称** - YourProduct
2. **一句话定位** - 解决什么问题
3. **目标读者** - 谁会用你的产品
4. **核心数据** - 3-5 个可验证的事实
5. **竞品** - 2-3 个主要竞品
6. **发布平台** - 计划发布到哪些渠道
7. **品牌声音** - 用什么语气说话

## 下一步

### 立即开始
```bash
cd seomaster
cat docs/quick-start.md
```

### 深入学习
- 📖 阅读 [工作流详细指南](docs/workflow-guide.md)
- 📝 查看 [LemonData 示例](examples/lemondata/)
- 🎯 了解 [质量标准](templates/quality-standards.yaml)

### 开发脚本
当前脚本是占位版本，你可以：
1. 实现 `generate-concept.js` - 调用 AI API 生成 Concept
2. 实现 `generate-draft.js` - 调用 AI API 生成初稿
3. 增强 `quality-check.js` - 添加更多检查项
4. 创建 `translate.js` - 实现翻译功能
5. 创建 `publish.js` - 实现多平台发布

## 与原工作流的对比

| 项目 | 原工作流（LemonData 特定） | SEOMaster（通用） |
|------|---------------------------|------------------|
| 产品信息 | 硬编码在文档中 | 参数化配置 |
| 品牌声音 | 固定为"技术老手" | 可自定义 |
| 竞品 | OpenRouter 等 | 配置化 |
| 发布渠道 | 知乎、掘金等 | 可配置 |
| 质量标准 | 固定规则 | 可自定义 |
| 复用性 | 仅适用 LemonData | 适用任何产品 |

## 贡献

欢迎提交 Issue 和 Pull Request 改进 SEOMaster！

## 许可证

MIT License

---

**开始你的第一篇文章：**

```bash
cd seomaster
cat docs/quick-start.md
```
