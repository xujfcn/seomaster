# 竞品知识库

> 最后更新: 2026-03-05
> 数据来源: 已发布博客 + research/competitors/竞品SEO策略分析.md

## OpenRouter

- 官网: https://openrouter.ai
- 定位: AI model aggregator, unified OpenAI-compatible API
- 模型数: 400+, 60+ providers
- 用户规模: 5M+ users, 100T+ tokens/year, 7T tokens/week
- 估值: ~$500M, ~$5M ARR (5% take rate)
- 定价: 0% model markup + 5.5% platform fee
- 免费层: 25+ models, 50 req/day, no credit card
- 最低充值: $5
- 支付: credit card, crypto
- SEO: 500+ indexed pages, per-model pages, 无 Schema.org 标记
- 哲学: 兼容层（所有模型转换为 OpenAI 格式）

### 优势
- 市场知名度最高，社区最大
- 模型数量最多 (400+)
- Collections 功能（按场景分组）
- 免费层门槛低

### 劣势
- 兼容层丢失原生功能（Anthropic caching、Gemini grounding）
- 5.5% platform fee 叠加
- 无 CNY 支付
- 无 Schema.org 结构化数据
- 错误提示不够结构化

### vs Crazyrouter
| 维度 | OpenRouter | Crazyrouter |
|------|-----------|------------|
| 模型数 | 400+ | 300+ |
| 协议 | OpenAI 兼容层 | 3 原生协议 |
| 费用 | markup + 5.5% | 比官方低 30-50% |
| 缓存语义 | 丢失 | 保留 |
| 错误处理 | 通用 | 48 码结构化 |
| CNY 支付 | 不支持 | 微信/支付宝 |
| 免费层 | 50 req/day | $1 credit |

---

## Together AI

- 官网: https://together.ai
- 定位: GPU inference + fine-tuning platform
- 模型数: 200+
- 特色: GPU 硬件租赁 (H100), deploy landing pages
- 量化声明: 3.5x faster inference, 2.3x faster training, 20% lower cost

### 优势
- 推理速度快（自有 GPU 集群）
- Fine-tuning 支持好
- Deploy landing pages 高转化 SEO 策略

### 劣势
- 不是纯 API 网关，偏底层
- 价格不透明

---

## SiliconFlow (硅基流动)

- 官网: https://siliconflow.cn
- 定位: 中国市场 AI 推理平台
- 特色: CNY 定价, 免费模型引流, DeepSeek 关键词绑定
- SEO: 60+ 工具集成文档

### 优势
- 中国市场本土化好
- 免费模型引流策略
- 工具集成文档丰富

### 劣势
- JS 渲染模型列表（SEO 不友好）
- H1→H3 跳级
- Sitemap 错误
- 国际化弱

---

## LiteLLM

- 官网: https://github.com/BerriAI/litellm
- 定位: 开源 LLM API proxy
- 模型数: 100+
- 特色: 可自部署，开源

### 优势
- 开源免费
- 可自部署，数据不出公司
- 社区活跃

### 劣势
- 需要自己运维
- 无 SLA
- 无免费额度

---

## Portkey

- 官网: https://portkey.ai
- 定位: AI gateway + observability
- 特色: 可观测性、日志、追踪

### 优势
- 可观测性强（trace, log, analytics）
- 企业级功能

### 劣势
- 价格偏高
- 面向企业，个人开发者门槛高

---

## Helicone

- 官网: https://helicone.ai
- 定位: AI gateway + analytics
- 特色: 日志分析、成本追踪

---

## Eden AI

- 官网: https://edenai.run
- 定位: Unified multimodal API
- 模型数: 150+
- 特色: 多模态统一 API

---

## Kong AI Gateway

- 官网: https://konghq.com
- 定位: 企业级 API 网关 + AI 扩展
- 特色: 开发者优先，插件生态

---

## SEO 竞争格局

| 竞品 | 索引页数 | Schema.org | hreflang | llms.txt |
|------|---------|-----------|---------|----------|
| OpenRouter | 500+ | 无 | 无 | 无 |
| Together AI | 200+ | 部分 | 无 | 无 |
| SiliconFlow | 100+ | 无 | 无 | 无 |
| Crazyrouter | 50+ | 有 | 13 语言 | 有 |

### Crazyrouter SEO 优势
- Schema.org 标记（Organization, BlogPosting, FAQPage, BreadcrumbList, SoftwareApplication）
- llms.txt（竞品都没有）
- 13 语言 hreflang
- 待建: 模型详情页 300+, 对比页 50+, 集成页 20+
