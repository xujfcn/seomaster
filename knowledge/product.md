# Crazyrouter (LemonData) 产品知识库

> 最后更新: 2026-03-05
> 数据来源: 官网 + 已发布博客文章

## 产品定位

- 品牌名: Crazyrouter (对外也称 LemonData)
- 一句话: Multi-protocol AI API gateway — one key, all models, cheaper pricing
- 官网: https://api.lemondata.cc
- 定位: 不是兼容层，是原生多协议网关

## 核心功能

### 多协议原生支持（核心差异化）
同一域名 `api.lemondata.cc` 支持 3 种原生协议：
- `/v1/chat/completions` — OpenAI 原生
- `/v1/messages` — Anthropic 原生（保留 extended thinking、cache 语义）
- `/v1beta/models/:model:generateContent` — Gemini 原生（保留 grounding）

### 模型覆盖
- 300+ 模型，覆盖 15+ 供应商
- OpenAI / Anthropic / Google / DeepSeek / Meta / Mistral / xAI 等
- 包含文本、图像、视频、音频多模态模型

### 定价优势
- 比官方 API 低 30-50%
- 注册送 $1 免费额度，无需信用卡
- 最低充值 $5
- 支持 CNY 支付：微信支付、支付宝（竞品不支持）

### 智能错误处理
- 48 个错误码，8 大分类
- 结构化错误提示：`did_you_mean`、`suggestions`、`alternatives`、`retryable` 标志
- 3 层语义别名解析 + Levenshtein 拼写纠错（阈值 ≤3）

### 缓存定价透明
- `cache_pricing` 字段：每个模型的缓存读写成本（来自 9 个供应商）
- 帮助开发者精确计算 prompt caching 成本

### Agent-First 设计
- 为 AI Agent 场景优化的 API 设计
- 支持 tool_use、function_calling 等 agent 原语

## 技术规格

| 指标 | 值 | 来源 | 日期 |
|------|-----|------|------|
| 支持模型数 | 300+ | 官网模型列表 | 2026-03 |
| 供应商数 | 15+ | 官网 | 2026-03 |
| 支持协议 | 3 (OpenAI/Anthropic/Gemini) | 官网 | 2026-03 |
| 支持语言 | 13 (hreflang) | 官网 | 2026-03 |
| 免费额度 | $1 | 注册页 | 2026-03 |
| 最低充值 | $5 | 定价页 | 2026-03 |
| 错误码数 | 48 (8 类) | API 文档 | 2026-03 |

## 目标用户

### 主要受众：独立开发者
- 痛点：API 价格高、多平台配置繁琐、模型切换麻烦
- 目标：降低成本、简化开发、快速测试多模型

### 次要受众：AI 创业团队
- 痛点：预算有限、不想被单一供应商锁定
- 目标：控制成本、保持灵活性

### 中国开发者
- 痛点：无法直接访问 OpenAI/Anthropic API、支付困难
- 目标：稳定访问、CNY 支付

## 品牌声音

- 语气：技术老手的实话实说
- 风格：数据驱动，不吹不黑
- 原则：让读者自己判断，不说"我们最好"，说"这是数据，你来决定"

## CTA 模板

- 默认：立即注册 Crazyrouter，新用户赠送 $1 体验额度
- 教程类：跟随教程，5 分钟完成部署
- 对比类：查看完整对比，选择最适合你的方案
- 注册链接：https://api.lemondata.cc/signup
