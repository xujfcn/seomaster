# 项目初始化工作流

> 从原始文档自动生成 project-config.yaml

## 概述

这个工作流允许你将一个文件夹中的原始文档（项目介绍、对话记录、产品文档等）自动转换为结构化的 `project-config.yaml` 配置文件。

## 工作流程

```
原始文档文件夹 → AI 分析 → 提取结构化信息 → 生成 project-config.yaml
```

## 使用方法

### 1. 准备原始文档

创建一个文件夹，放入所有与项目相关的原始文档：

```bash
mkdir raw-docs
```

支持的文件类型：
- `.md` - Markdown 文档
- `.txt` - 纯文本文件
- `.yaml` / `.yml` - YAML 配置文件
- `.json` - JSON 数据文件

示例文档内容：
- 产品介绍文档
- 项目 README
- 与客户的对话记录
- 产品需求文档
- 竞品分析笔记
- 市场调研报告

### 2. 配置 API Key

在项目根目录创建 `.env` 文件：

```bash
# OpenAI API
OPENAI_API_KEY=sk-xxxxx
OPENAI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-4o

# 或使用 Anthropic API
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 3. 运行初始化脚本

```bash
node scripts/init-project.js ./raw-docs
```

或指定输出文件：

```bash
node scripts/init-project.js ./raw-docs ./my-project-config.yaml
```

### 4. 检查和完善配置

脚本会生成一个初始的 `project-config.yaml`，包含：

✅ 自动提取的信息：
- 产品名称和定位
- 目标受众和痛点
- 竞品信息
- 核心数据点
- 品牌声音

⚠️ 需要人工补充的信息（标记为 TODO）：
- 竞品网址和价格
- 数据来源链接
- SEO 关键词
- 社交媒体账号

## 示例

### 输入：原始文档

**raw-docs/product-intro.md:**
```markdown
# MyAPI - AI API 聚合平台

MyAPI 是一个为独立开发者设计的 AI API 聚合平台。

## 核心功能
- 支持 300+ AI 模型
- 价格比官方低 40%
- 一个 API Key 访问所有模型

## 目标用户
独立开发者和小型 AI 创业团队

## 竞品
- OpenRouter: 知名度高，但价格贵
- AIGateway: 免费额度大，但速度慢
```

### 输出：project-config.yaml

```yaml
project:
  name: "MyAPI"
  tagline: "AI API 聚合平台"
  website: "https://myapi.com"
  industry: "Developer Tools"

value_proposition:
  product: "MyAPI"
  audience: "独立开发者"
  action: "用一个 API 访问 300+ AI 模型"
  result: "省 40% API 费用"
  full: "MyAPI 让独立开发者用一个 API 访问 300+ AI 模型，省 40% API 费用"

audience:
  primary:
    title: "独立开发者"
    pain_points:
      - "API 价格高，成本难控制"
      - "多平台配置繁琐"
    goals:
      - "降低 API 成本"
      - "简化开发流程"

competitors:
  - name: "OpenRouter"
    strengths:
      - "知名度高"
    weaknesses:
      - "价格贵"

  - name: "AIGateway"
    strengths:
      - "免费额度大"
    weaknesses:
      - "速度慢"

key_metrics:
  - metric: "支持模型数量"
    value: "300+"
    source: "产品介绍"
    verified: false

  - metric: "价格优势"
    value: "比官方低 40%"
    source: "产品介绍"
    verified: false
```

## 工作原理

### 1. 文档读取
脚本递归读取指定文件夹中的所有支持格式的文件。

### 2. AI 分析
将所有文档内容合并，发送给 AI 模型进行分析，提取：
- 产品基本信息
- 价值主张
- 目标受众
- 竞品信息
- 核心数据点
- 品牌声音

### 3. 配置生成
根据 AI 分析结果，生成符合 SEOMaster 规范的 `project-config.yaml`。

### 4. 人工审核
生成的配置文件需要人工审核和完善：
- 验证数据准确性
- 补充缺失信息
- 添加来源链接
- 完善 SEO 关键词

## 无 API Key 模式

如果没有配置 API Key，脚本会生成一个模板配置文件，你需要手动填写所有信息。

```bash
# 不配置 API Key，直接运行
node scripts/init-project.js ./raw-docs
# ⚠️  警告: 未配置 API Key，将生成模板配置
```

## 最佳实践

### 1. 提供丰富的原始文档
文档越详细，AI 提取的信息越准确：
- ✅ 包含具体数字和数据
- ✅ 描述目标用户的痛点
- ✅ 提及竞品和对比
- ✅ 说明产品的核心价值

### 2. 多种文档类型
不同类型的文档提供不同维度的信息：
- 产品介绍 → 基本信息、价值主张
- 对话记录 → 用户痛点、真实需求
- 竞品分析 → 竞品优劣势
- 市场调研 → 目标受众、市场定位

### 3. 验证生成的数据
AI 可能会推测或补充信息，务必验证：
- ✅ 检查所有数字和数据
- ✅ 确认竞品信息准确
- ✅ 验证价值主张清晰
- ✅ 补充数据来源链接

### 4. 迭代优化
初次生成后，可以：
1. 补充更多原始文档
2. 重新运行脚本
3. 对比新旧配置
4. 合并最佳内容

## 故障排除

### 问题：AI 提取的信息不准确

**解决方案：**
1. 检查原始文档是否足够详细
2. 添加更多相关文档
3. 手动编辑生成的配置文件

### 问题：脚本报错 "API 请求失败"

**解决方案：**
1. 检查 API Key 是否正确
2. 检查网络连接
3. 确认 API 额度是否充足
4. 使用无 API Key 模式生成模板

### 问题：生成的配置文件缺少信息

**解决方案：**
1. 查找标记为 "TODO" 的字段
2. 参考 `templates/project-config.yaml` 模板
3. 手动补充缺失信息

## 下一步

生成 `project-config.yaml` 后：

1. **完善配置** - 补充所有 TODO 项
2. **验证数据** - 确认所有数据准确
3. **创建文章任务** - 使用 `templates/article-task.yaml`
4. **生成 Concept** - 运行 `node scripts/generate-concept.js`
5. **开始写作** - 进入完整的 SEOMaster 工作流

## 相关文档

- [SEOMaster 主文档](../README.md)
- [工作流详细指南](./workflow-guide.md)
- [快速开始指南](./quick-start.md)
