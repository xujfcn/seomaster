# SEOMaster 全自动化方案

## 1. 目标

本文档定义 `D:\lemondata-free\lemondata-content\seomaster` 的完整自动化内容生产、知识库管理、去重控制与发布方案。

系统目标：

- 文章自动生成
- 已发布文章可追踪、可检索、可更新
- 避免重复选题、重复发文、重复改写
- 文章本身可沉淀为知识库
- 支持本地测试、人工审核、正式发布分层
- 支持多项目、多语言、多发布目标

不建议把 Obsidian 或本地脚本直接连接生产数据库做日常编辑与测试。推荐采用：

- 生产 PostgreSQL：正式发布与线上查询
- 本地 PostgreSQL：镜像同步、去重、测试、索引
- Obsidian Vault：知识库、主题卡、草稿、已发布文章镜像
- SEOMaster：工作流编排、索引管理、自动发布

---

## 2. 总体架构

推荐架构：

```text
Production PostgreSQL
   ↓ 增量同步
Local PostgreSQL Mirror
   ↔ SEOMaster CLI / Workflow
   ↔ Obsidian Vault
   ↓ Publish Adapter / API
Production PostgreSQL
```

职责划分：

### 2.1 Production PostgreSQL

作为线上真实发布数据源，负责：

- 已发布文章
- 线上主题关系
- 线上 slug / URL / 语言版本
- 发布记录
- SSR 查询

### 2.2 Local PostgreSQL Mirror

作为本地操作与测试数据库，负责：

- 同步线上文章元数据
- 构建本地去重索引
- 支持本地测试与调试
- 给 SEOMaster 提供高性能查询能力
- 存储 embedding / hash / workflow state

### 2.3 Obsidian Vault

作为主内容编辑层与知识库，负责：

- 产品知识
- 主题规划
- 研究素材
- 草稿
- 已发布文章镜像
- 更新建议
- 操作文档与审核记录

### 2.4 SEOMaster

作为自动化执行层，负责：

- 主题决策
- 研究抓取
- 大纲生成
- 草稿生成
- 质检
- 重复检测
- 发布
- 回写 Obsidian 与本地索引

---

## 3. 为什么不直接连接线上 PostgreSQL

不推荐让 Obsidian 或 SEOMaster 日常直接写生产库，原因如下：

- 生产库是发布库，不适合作为知识库编辑入口
- 本地测试脚本容易误写正式数据
- Front matter、知识抽取、批量 reindex 属于重写型操作，风险高
- 生产 schema 调整会直接影响写作流程
- 线上网络、权限、延迟会让工作流变脆弱

允许直接访问生产环境的场景应仅限于：

- 只读同步
- 受控发布 API

原则：

- 不做本地脚本直接改线上表
- 不做数据库双向同步
- 正式写入线上只走 publish adapter 或正式发布接口

---

## 4. 推荐目录结构

基于现有 `seomaster` 与 Obsidian 集成，建议 Vault 升级为以下结构：

```text
Vault/
  Core/
  Domain/
  Competitors/
  Cases/
  Research/
  Topics/
  Drafts/
  Published/
  Updates/
  Operations/
  Templates/
  Archive/
```

目录职责：

### 4.1 `Core/`

始终加载的基础产品信息。

内容示例：

- 产品介绍
- 定价
- 目标用户
- 品牌术语
- 禁止误写的信息

### 4.2 `Domain/`

领域知识，用于文章生成时按关键词加载。

内容示例：

- 定价策略
- API 网关知识
- GEO/SEO 框架
- 技术术语解释

### 4.3 `Competitors/`

竞品档案与对比事实。

### 4.4 `Cases/`

案例、行业场景、用户故事。

### 4.5 `Research/`

自动抓取的研究材料，按日期归档。

### 4.6 `Topics/`

核心新增目录。

每个主题一张卡，作为是否“已经写过”的唯一判断入口。

### 4.7 `Drafts/`

待审核或人工修改文章。

### 4.8 `Published/`

已发文章镜像，保留 Markdown 正文与发布元数据。

### 4.9 `Updates/`

那些应更新旧文而非新发的需求。

### 4.10 `Operations/`

流程日志、发布日志、同步日志、人工审核备注。

---

## 5. Source of Truth 设计

系统不采用单一事实源，而采用分层事实源：

### 5.1 内容事实源

`Obsidian Vault`

用于：

- 草稿
- 主题卡
- 知识卡
- 已发布文章镜像

### 5.2 发布事实源

`Production PostgreSQL`

用于：

- 线上真实文章状态
- 正式 URL
- 发布结果
- 多语言映射

### 5.3 工作流事实源

`Local PostgreSQL Mirror`

用于：

- 去重索引
- hash / embedding
- workflow step 状态
- 待发布队列
- 本地测试

原则：

- 文章编辑在 Obsidian
- 线上是否已发布看生产库
- 本地工作流判定与调度看本地镜像库

---

## 6. 文章同时作为知识库的实现方式

文章既是发布内容，也是知识资产，但不能直接把所有全文塞回 prompt。

推荐两层使用方式：

### 6.1 Published 文章全文

用途：

- 归档
- 检索
- 相似度判断
- 历史版本追踪
- 人工复盘

### 6.2 从文章抽取出的知识卡

用途：

- 后续 prompt 的高质量上下文
- 固化事实、结论、框架、案例
- 避免重复从长文中扫描噪音信息

结论：

- `Published/` 负责保存全文
- `Domain/Topics/Cases/` 负责保存提炼后的知识
- SEOMaster 在生成时优先加载提炼后的知识卡，而不是无差别加载历史全文

---

## 7. Obsidian 文档规范

## 7.1 Topic 卡片 Front Matter

建议 `Topics/*.md`：

```yaml
---
type: topic
project: lemondata
topic_key: openai-api-pricing
status: active
canonical_keyword: openai api pricing
intent: commercial
cluster: pricing
primary_article_id: lemondata-en-openai-api-pricing-001
published_count: 2
last_published_at: 2026-03-17
aliases:
  - openai pricing
  - api pricing
related_topics:
  - api-cost-comparison
  - ai-api-pricing
---
```

字段说明：

- `topic_key`: 唯一主题键
- `canonical_keyword`: 该主题的标准关键词
- `primary_article_id`: 主文章
- `published_count`: 已发布数量
- `related_topics`: 相关主题

## 7.2 Published 文章 Front Matter

建议 `Published/YYYY-MM/*.md`：

```yaml
---
type: article
project: lemondata
topic_key: openai-api-pricing
article_id: lemondata-en-openai-api-pricing-001
status: published
lang: en
keyword: openai api pricing
slug: openai-api-pricing-guide
intent: commercial
cluster: pricing
canonical: true
published_url: https://example.com/en/blog/openai-api-pricing-guide
cms_target: new-api
cms_post_id: 123
content_hash: sha256:xxx
summary_hash: sha256:yyy
source_of_truth: vault
created_at: 2026-03-17
updated_at: 2026-03-17
published_at: 2026-03-17
duplicate_of:
supersedes:
review_status: approved
quality_score: 92
---
```

## 7.3 Draft 文档 Front Matter

建议 `Drafts/*.md`：

```yaml
---
type: article
status: draft
project: lemondata
topic_key: openai-api-pricing
article_id: lemondata-en-openai-api-pricing-001
lang: en
keyword: openai api pricing
slug: openai-api-pricing-guide
review_status: pending
quality_score:
publish_target: new-api
---
```

---

## 8. 数据库设计

建议在 `seomaster` 中新增本地数据库，例如：

```text
D:\lemondata-free\lemondata-content\seomaster\data\seomaster.db
```

如果全部采用 PostgreSQL，本地也建议单独一个数据库，例如：

- `seomaster_local`
- `seomaster_mirror`

推荐表结构如下。

## 8.1 `topics`

```sql
CREATE TABLE topics (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL,
  topic_key TEXT NOT NULL,
  canonical_keyword TEXT NOT NULL,
  cluster TEXT,
  intent TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  canonical_article_id TEXT,
  obsidian_path TEXT,
  published_count INTEGER NOT NULL DEFAULT 0,
  last_published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, topic_key)
);
```

## 8.2 `articles`

```sql
CREATE TABLE articles (
  id BIGSERIAL PRIMARY KEY,
  article_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  topic_key TEXT NOT NULL,
  lang TEXT NOT NULL,
  title TEXT,
  keyword TEXT,
  slug TEXT NOT NULL,
  status TEXT NOT NULL,
  vault_path TEXT,
  output_path TEXT,
  published_url TEXT,
  cms_target TEXT,
  cms_post_id TEXT,
  content_hash TEXT,
  summary_hash TEXT,
  review_status TEXT,
  quality_score INTEGER,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, article_id),
  UNIQUE (project_id, lang, slug)
);
```

## 8.3 `article_embeddings`

```sql
CREATE TABLE article_embeddings (
  id BIGSERIAL PRIMARY KEY,
  article_id TEXT NOT NULL,
  embedding_model TEXT NOT NULL,
  title_embedding JSONB,
  summary_embedding JSONB,
  content_embedding JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (article_id, embedding_model)
);
```

如果你后续使用 pgvector，可把 `JSONB` 换成 vector 列。

## 8.4 `publish_jobs`

```sql
CREATE TABLE publish_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_id TEXT NOT NULL,
  article_id TEXT NOT NULL,
  target TEXT NOT NULL,
  payload_path TEXT,
  status TEXT NOT NULL,
  response JSONB,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (job_id)
);
```

## 8.5 `remote_blogs`

用于同步线上正式文章元数据：

```sql
CREATE TABLE remote_blogs (
  id BIGSERIAL PRIMARY KEY,
  remote_blog_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  lang TEXT,
  slug TEXT,
  title TEXT,
  topic_key TEXT,
  published_url TEXT,
  remote_updated_at TIMESTAMP,
  raw_payload JSONB,
  synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, remote_blog_id)
);
```

---

## 9. 同步策略

## 9.1 推荐方式

采用“线上只读增量同步到本地”的模式。

同步方向：

- `Production PostgreSQL -> Local PostgreSQL`

不同步方向：

- `Local PostgreSQL -> Production PostgreSQL` 直接数据库写入

正式发布走 API，不走数据库回写。

## 9.2 同步内容

建议同步以下对象：

- 已发布博客文章
- 文章语言版本关系
- 线上主题映射
- 发布任务状态
- 更新时间戳

## 9.3 同步条件

采用增量字段：

- `updated_at`
- `published_at`
- `deleted_at`（如有）

同步规则：

- 首次全量同步
- 后续按 `updated_at > last_sync_time` 增量同步
- 保留 `raw_payload` 方便排查差异

## 9.4 本地同步命令

建议新增命令：

```bash
seomaster sync:remote
seomaster sync:remote --project lemondata
seomaster sync:remote --since 2026-03-01T00:00:00Z
```

用途：

- 更新本地镜像表
- 触发去重索引刷新
- 修正 Published 文档的线上状态

---

## 10. 去重体系

避免重复不能只看 slug，必须四层判断。

## 10.1 L1: Topic 去重

规则：

- 若存在相同 `topic_key` 的 canonical 已发布文章，则默认不允许新建
- 默认转入 `update existing article`

这是最高优先级规则。

## 10.2 L2: Slug / Keyword 去重

规则：

- slug 完全相同，直接拦截
- canonical keyword 完全相同，默认提示重复

## 10.3 L3: 标题和摘要相似

规则：

- 标题相似度超过阈值，例如 0.8
- 摘要相似度超过阈值，例如 0.82
- 进入人工审核或提示“建议更新旧文”

## 10.4 L4: Embedding 语义相似

规则：

- 文章 embedding 相似度 > 0.86
- 标题 embedding > 0.90 且关键词 cluster 相同
- 标记为 `review_duplicate`

## 10.5 决策矩阵

### 场景 A

- 已有相同 `topic_key`
- 结果：`update`

### 场景 B

- 无相同 topic
- 但标题和 embedding 高相似
- 结果：`review_duplicate`

### 场景 C

- 仅部分相关
- 结果：`allow_new`

### 场景 D

- slug 完全相同
- 结果：`block`

---

## 11. SEOMaster 工作流升级

现有工作流为：

- Research
- Concept
- Draft
- Images
- Quality Check
- Vault Import

建议升级为：

```text
Topic Check
→ Knowledge Load
→ Research
→ Concept
→ Duplicate Check
→ Draft
→ Quality Check
→ Review Gate
→ Publish
→ Sync Back
→ Knowledge Extract
→ Reindex
```

## 11.1 Topic Check

输入关键词后，先执行：

- 查询本地镜像库
- 查询 `Topics/`
- 判断是新建主题还是更新旧文

输出之一：

- `new_topic`
- `update_existing`
- `review_duplicate`
- `blocked`

## 11.2 Knowledge Load

沿用现有 [scripts/lib/knowledge.js] 的读取逻辑，但增加：

- 优先加载 `Core/`
- 加载匹配的 `Domain/`
- 加载相关 `Topics/`
- 只加载 `Published/` 中的摘要，不加载全文

## 11.3 Research

继续使用 Google/Apify 抓取竞品资料，并保存到 `Research/`。

## 11.4 Concept

生成 concept 前，把 topic 决策写入 concept 文件：

- `topic_key`
- `action: new|update`
- `duplicate_risk`
- `related_articles`

## 11.5 Duplicate Check

在 draft 前再次检测：

- slug
- title
- topic
- embedding

因为 concept 可能已把文章引向已有主题。

## 11.6 Draft

沿用现有生成逻辑，但将 front matter 补齐。

## 11.7 Quality Check

保留现有 `quality-check.js`，额外增加：

- 是否违背已验证知识
- 是否误用价格
- 是否出现与已发布文高度重合段落

## 11.8 Review Gate

根据规则决定：

- 自动发布
- 等待人工审核
- 强制转为更新旧文

## 11.9 Publish

通过 publish adapter 发布到线上，而不是直接写线上数据库。

## 11.10 Sync Back

发布成功后：

- 回写本地 `articles` 和 `publish_jobs`
- 更新 `Published/*.md` front matter
- 更新 `Topics/*.md`

## 11.11 Knowledge Extract

从新发布文章抽取：

- 事实卡
- 观点卡
- FAQ 卡
- 案例卡

保存回 `Domain/` 或 `Cases/`。

## 11.12 Reindex

重建索引，确保本地数据库、Obsidian、线上状态一致。

---

## 12. 发布适配器设计

不要把发布逻辑直接耦合在 workflow 中。建议做 adapter 模式：

```text
scripts/lib/publishers/
  new-api.js
  wordpress.js
  ghost.js
  webhook.js
```

统一接口：

```js
async function publishArticle(article, config) {
  return {
    success: true,
    cms_post_id: '123',
    published_url: 'https://.../blog/slug',
    raw_response: {}
  };
}
```

## 12.1 `new-api` 适配器

推荐通过正式 API 调用：

- 创建文章
- 更新文章
- 发布文章

而不是直接连线上 PostgreSQL。

项目配置增加：

```json
{
  "publish_target": "new-api",
  "publish_config": {
    "base_url": "http://localhost:4000",
    "token_env": "NEW_API_BLOG_TOKEN"
  }
}
```

## 12.2 发布命令

建议新增：

```bash
seomaster publish output/openai-api-pricing-draft.md
seomaster publish --article-id lemondata-en-openai-api-pricing-001
seomaster publish:retry --job-id xxx
```

---

## 13. 需要新增的 CLI 命令

建议扩展 `seomaster` 命令：

### 13.1 主题与去重

```bash
seomaster topics:list
seomaster topics:check "openai api pricing"
seomaster topics:create "openai api pricing"
```

### 13.2 索引与同步

```bash
seomaster kb:reindex
seomaster sync:remote
seomaster sync:published
```

### 13.3 发布

```bash
seomaster publish <draft-or-article>
seomaster publish:retry <job-id>
seomaster publish:status <job-id>
```

### 13.4 更新流程

```bash
seomaster update "openai api pricing"
seomaster update --topic openai-api-pricing
```

用途：

- 自动找到 canonical 文章
- 生成更新任务而不是新建文章

---

## 14. 推荐新增模块

针对 `seomaster` 现状，建议新增以下模块：

## 14.1 `scripts/lib/article-index.js`

职责：

- 扫描 Vault
- 扫描 output
- 扫描本地镜像表
- 统一写入 `articles/topics`

## 14.2 `scripts/lib/topic-manager.js`

职责：

- 生成 topic_key
- 读取和更新 `Topics/*.md`
- 判断 `new` 还是 `update`

## 14.3 `scripts/lib/duplicate-detector.js`

职责：

- slug 检查
- topic 检查
- 标题相似度
- hash 相似度
- embedding 相似度

## 14.4 `scripts/lib/publish-manager.js`

职责：

- 根据 `publish_target` 分发到 adapter
- 创建 `publish_jobs`
- 处理重试和失败记录

## 14.5 `scripts/lib/frontmatter-sync.js`

职责：

- 发布后回写 `Published/*.md`
- 保持 front matter 与线上状态一致

## 14.6 `scripts/reindex-knowledge.js`

职责：

- 一键重建索引
- 用于修复状态漂移

---

## 15. 对现有代码的改造建议

基于当前仓库现状：

- `scripts/lib/knowledge.js` 已具备知识库加载能力
- `scripts/lib/knowledge-checker.js` 已具备知识充足性判断
- `scripts/lib/vault-writer.js` 已具备导入 vault 的基础能力
- `scripts/lib/automated-workflow.js` 已具备自动流水线骨架

建议改造如下。

## 15.1 改造 `vault-writer.js`

当前仅写简单 front matter。应扩展为：

- 支持 `Drafts/` 与 `Published/` 分流
- 支持写入完整 article metadata
- 支持更新已存在文章，而不是只新增
- 发布后支持回写 `published_url/cms_post_id/status`

## 15.2 改造 `automated-workflow.js`

在 concept 前增加：

- `topic check`
- `duplicate check`

在 vault import 后增加：

- `publish`
- `sync back`
- `knowledge extract`
- `reindex`

## 15.3 改造 `knowledge.js`

增加选择性加载：

- 不直接加载全部 `Published/`
- 优先加载 `Core/`, `Domain/`, `Topics/`
- 历史文章只抽取摘要与相关段落

## 15.4 增加项目级配置

在 `projects.json` 中新增字段：

```json
{
  "publish_target": "new-api",
  "publish_config": {
    "base_url": "http://localhost:4000",
    "token_env": "NEW_API_BLOG_TOKEN"
  },
  "mirror_db": {
    "type": "postgres",
    "dsn_env": "SEOMASTER_LOCAL_DSN"
  },
  "remote_sync": {
    "enabled": true,
    "source": "new-api",
    "base_url": "http://localhost:4000",
    "token_env": "NEW_API_SYNC_TOKEN"
  }
}
```

---

## 16. 状态机设计

建议文章状态机如下：

```text
idea
→ topic_checked
→ researching
→ concept_ready
→ duplicate_review
→ drafting
→ quality_checked
→ approved
→ publishing
→ published
→ synced
→ extracted
→ indexed
```

异常状态：

- `blocked_duplicate`
- `needs_manual_review`
- `publish_failed`
- `sync_failed`
- `archived`

主题状态：

- `active`
- `published`
- `update_needed`
- `merged`
- `archived`

---

## 17. 自动更新旧文策略

很多关键词不该新写，而应更新旧文。推荐规则：

触发 `update` 的条件：

- 相同 `topic_key`
- 主文章仍有效且权重更高
- 新关键词只是旧主题变体
- 新 research 主要是补充而非新主题

更新流程：

1. 找到 canonical article
2. 生成 `Updates/xxx.md`
3. AI 只输出新增段落、替换建议、结构调整建议
4. 人工确认或自动合并
5. 重新发布并更新版本

优点：

- 避免 cannibalization
- 保留已有 SEO 权重
- 主题管理更清晰

---

## 18. 本地测试与预发环境建议

推荐三层环境：

### 18.1 Local Draft Environment

用于：

- 生成草稿
- 质检
- Obsidian 编辑
- 去重调试

### 18.2 Local Mirror Environment

用于：

- 同步线上发布数据
- 验证更新与去重逻辑
- 模拟发布目标

### 18.3 Production Publish Environment

用于：

- 最终正式发布

原则：

- 日常开发只操作本地镜像库
- 不直接动生产库
- 发布动作必须显式执行

---

## 19. 推荐实施阶段

## Phase 1: 索引和主题化

目标：先解决重复与可管理性。

实施内容：

- 增加 `Topics/` 目录
- 增加 `topics/articles` 本地表
- 增加 `kb:reindex`
- 增加 `topics:check`
- 每篇文章必须绑定 `topic_key`
- 扩展 `Published` front matter

交付结果：

- 可查询是否写过
- 可识别应该新建还是更新
- 已发布文章有统一索引

## Phase 2: 本地镜像与自动发布

目标：打通发布闭环。

实施内容：

- 线上只读同步到本地 PostgreSQL
- 新增 `publish-manager`
- 新增 `new-api` adapter
- 新增 `sync:remote`
- 发布成功后回写 front matter

交付结果：

- 本地知道线上已发布状态
- 可一键发布
- 发布与知识库状态一致

## Phase 3: 语义去重和知识提炼

目标：提升智能化与长期可维护性。

实施内容：

- embedding 去重
- 自动更新建议
- 从 Published 抽取知识卡
- 支持多语言绑定与版本管理

交付结果：

- 减少重复文章
- 提升知识库质量
- 形成“文章反哺知识库”的闭环

---

## 20. 推荐的最终工作流

建议最终固定成下面这条主线：

1. 输入关键词
2. 检查 `Topics/` 和本地镜像库
3. 决定 `new` / `update` / `review` / `block`
4. 加载知识库
5. 抓取 research
6. 生成 concept
7. 重复检测
8. 生成 draft
9. 质量检查
10. 进入人工审核或自动通过
11. 发布到目标 CMS / new-api
12. 同步结果回本地
13. 回写 `Published/*.md`
14. 更新 `Topics/*.md`
15. 抽取知识卡到 `Domain/` / `Cases/`
16. 执行 `reindex`

---

## 21. 最终结论

对 `seomaster` 来说，最优解不是把 Obsidian 当 CMS，也不是让本地脚本直接操作线上 PostgreSQL。

正确方案是：

- 用 `Obsidian` 作为主内容库和知识库
- 用 `Local PostgreSQL` 作为本地镜像与索引中枢
- 用 `Production PostgreSQL` 作为正式发布结果库
- 用 `SEOMaster` 作为自动化编排和发布入口
- 用 `publish adapter` 对接 `new-api` 或其他发布平台

这套方案同时满足：

- 自动发布
- 文章管理
- 避免重复
- 多项目扩展
- 本地测试安全
- 文章即知识库
- 后续可演进为更强的内容操作系统

---

## 22. 下一步建议

建议按以下顺序落地：

1. 先加 `Topics/` 与完整 front matter 规范
2. 再加本地 PostgreSQL 索引与 `kb:reindex`
3. 再做 `sync:remote` 和 `publish` adapter
4. 最后补 embedding 去重和知识抽取

如果进入实现阶段，建议优先新增：

- `scripts/lib/article-index.js`
- `scripts/lib/topic-manager.js`
- `scripts/lib/duplicate-detector.js`
- `scripts/lib/publish-manager.js`
- `scripts/reindex-knowledge.js`
- `scripts/publish.js`

这样可以最小代价把现有 `seomaster` 平滑升级到可长期维护的全自动化系统。
