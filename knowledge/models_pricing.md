# 主流模型定价表

> 最后更新: 2026-03-05
> 数据来源: 已发布博客 blog-pricing-comparison.md, blog-claude-vs-gpt5-vs-gemini-2026.md
> 注意: 价格变动频繁，发布前务必核实

## 旗舰模型

| 模型 | 供应商 | Input/1M | Output/1M | Context | 发布日期 |
|------|--------|---------|----------|---------|---------|
| GPT-5.2 Pro | OpenAI | $21.00 | $168.00 | 200K | 2026 |
| GPT-5.2 | OpenAI | $1.75 | $14.00 | 200K | 2026 |
| GPT-5 | OpenAI | $1.25–$2.00 | $8.00–$10.00 | 128K | 2025 |
| Claude Opus 4.6 | Anthropic | $5.00 | $25.00 | 200K | 2025 |
| Claude Sonnet 4.6 | Anthropic | $3.00 | $15.00 | 200K | 2025 |
| Gemini 3 Pro (preview) | Google | $2.00 | $12.00 | 200K+ | 2026 |
| Gemini 2.5 Pro | Google | $1.25 | $10.00 | 1M–2M | 2025 |
| Grok 4 | xAI | $3.00 | $15.00 | 2M | 2026 |

## 中端模型

| 模型 | 供应商 | Input/1M | Output/1M | Context |
|------|--------|---------|----------|---------|
| GPT-5 Mini | OpenAI | $0.25 | $2.00 | 200K |
| GPT-4.1 | OpenAI | $2.00 | $8.00 | 1M |
| GPT-4.1 Mini | OpenAI | $0.40 | $1.60 | — |
| GPT-4o | OpenAI | $2.50 | $10.00 | 128K |
| Claude Haiku 4.5 | Anthropic | $1.00 | $5.00 | 200K |
| Gemini 2.5 Flash | Google | $0.15–$0.30 | $0.60–$2.50 | 2M |

## 推理模型

| 模型 | 供应商 | Input/1M | Output/1M | Context | 特点 |
|------|--------|---------|----------|---------|------|
| o3 | OpenAI | $2.00 | $8.00 | — | 推理优化 |
| o4-mini | OpenAI | $1.10 | $4.40 | — | 推理小模型 |
| DeepSeek R1 | DeepSeek | $0.55 | $2.19 | 128K | MIT 开源, 671B MoE |

## 高性价比模型

| 模型 | 供应商 | Input/1M | Output/1M | Context | 特点 |
|------|--------|---------|----------|---------|------|
| DeepSeek V3 | DeepSeek | $0.14 | $0.28 | 128K | 最便宜旗舰级 |
| Gemini 2.5 Flash | Google | $0.15 | $0.60 | 2M | 最大上下文 |
| GPT-5 Mini | OpenAI | $0.25 | $2.00 | 200K | OpenAI 最便宜 |

## Prompt Caching 定价

### OpenAI
- 自动缓存（>1024 tokens）
- 缓存价格 = 输入价格的 50%
- 无额外写入费

### Anthropic
- 显式 `cache_control` 标记
- 写入: 输入价格的 125%（25% 溢价）
- 读取: 输入价格的 10%（90% 折扣）
- TTL: 5 分钟
- 示例 (Sonnet 4.6): write $3.75/1M, read $0.30/1M

### Google
- Context caching
- 价格因模型而异

## 免费层对比

| 平台 | 免费内容 | 限制 |
|------|---------|------|
| Google AI Studio | Gemini 2.5 Flash 500 req/day, 2.0 Flash 1500 req/day, 2.5 Pro 25 req/day | 限速 |
| Groq | Llama 3.3 70B / Mixtral 8x7B / Gemma 2 9B | 30 req/min |
| Mistral | Mistral Small + Codestral | 限量 |
| Cloudflare Workers AI | 10,000 req/day | 限量 |
| OpenRouter | 25+ models | 50 req/day |
| Crazyrouter | 所有 300+ 模型 | $1 credit, 无限速 |

## DeepSeek R1 详情

- 架构: 671B total params, 37B activated (MoE), 128K context
- 开源协议: MIT（完全开源，商用可用）
- 本地运行: ~336GB RAM (Q4 量化)
- 蒸馏版本: R1-Distill-Qwen-1.5B/7B/14B/32B, R1-Distill-Llama-8B/70B
- vs o3: 输入输出均便宜 4x
- vs Claude Sonnet 4.6: 输入便宜 5x
