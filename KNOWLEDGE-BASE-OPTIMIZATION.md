# 知识库优化方案

## 当前问题

当前知识库设计存在可扩展性问题：
- ✅ 简单直接，易于理解
- ❌ 随着内容增多，提示词越来越长
- ❌ 可能超出模型上下文限制
- ❌ Token 消耗大，成本高
- ❌ 响应变慢

## 解决方案对比

| 方案 | 优点 | 缺点 | 复杂度 | 推荐度 |
|------|------|------|--------|--------|
| 1. 向量数据库 + RAG | 可扩展性强 | 需要额外服务 | 高 | ⭐⭐⭐ |
| 2. 分层知识库 | 简单，无依赖 | 需要手动分类 | 低 | ⭐⭐⭐⭐⭐ |
| 3. 关键词索引 | 精准匹配 | 需要维护标签 | 中 | ⭐⭐⭐⭐ |
| 4. Obsidian 集成 | 用户友好 | 需要解析逻辑 | 中 | ⭐⭐⭐⭐ |

## 推荐方案：分层知识库 + 关键词索引

### 架构设计

```
knowledge/
├── core/                    # 核心知识（总是加载）
│   ├── product.md          # 产品核心信息
│   └── brand.md            # 品牌调性
├── domain/                  # 领域知识（按关键词匹配）
│   ├── pricing.md
│   ├── performance.md
│   └── integration.md
├── competitors/             # 竞品分析（按需加载）
│   ├── openai.md
│   └── anthropic.md
└── archive/                 # 历史数据（不自动加载）
    └── published_articles.md
```

### 元数据标注（YAML Front Matter）

每个文件添加元数据：

```markdown
---
tags: [pricing, cost]
priority: high
keywords: [price, cost, cheap, affordable]
last_updated: 2026-03-06
---

# 定价信息

内容...
```

### 智能加载逻辑

```javascript
function loadSmartKnowledge(keyword, context = 'concept') {
  // 1. 总是加载核心知识
  const knowledge = loadCore();
  
  // 2. 根据关键词匹配领域知识
  const domainFiles = matchDomainKnowledge(keyword);
  knowledge.push(...domainFiles);
  
  // 3. 限制总长度
  return truncateKnowledge(knowledge, 15000);
}
```

## 方案 1：快速实现（推荐）

### 1.1 重构知识库目录

```bash
mkdir -p knowledge/core knowledge/domain knowledge/competitors knowledge/archive
mv knowledge/product.md knowledge/core/
mv knowledge/competitors.md knowledge/competitors/overview.md
```

### 1.2 添加元数据

编辑 `knowledge/domain/pricing.md`：

```markdown
---
type: domain
priority: high
keywords: [price, cost, cheap, affordable, save, money]
---

# 定价信息

详细内容...
```

### 1.3 更新 knowledge.js

```javascript
const yaml = require('js-yaml');

function parseMetadata(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { keywords: [], priority: 'low' };
  return yaml.load(match[1]);
}

function keywordMatches(searchKeyword, fileKeywords = []) {
  const search = searchKeyword.toLowerCase();
  return fileKeywords.some(kw => 
    search.includes(kw.toLowerCase())
  );
}

function loadSmartKnowledge(keyword, options = {}) {
  const knowledge = [];
  let totalChars = 0;
  const maxChars = options.maxChars || 15000;
  
  // 1. 加载核心知识
  const coreFiles = listFiles('core');
  for (const file of coreFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const cleaned = removeMetadata(content);
    knowledge.push(cleaned);
    totalChars += cleaned.length;
  }
  
  // 2. 加载匹配的领域知识
  const domainFiles = listFiles('domain');
  const matches = [];
  
  for (const file of domainFiles) {
    const metadata = parseMetadata(file);
    if (keywordMatches(keyword, metadata.keywords)) {
      const content = fs.readFileSync(file, 'utf-8');
      matches.push({
        content: removeMetadata(content),
        priority: priorityScore(metadata.priority)
      });
    }
  }
  
  matches.sort((a, b) => b.priority - a.priority);
  
  for (const match of matches) {
    if (totalChars + match.content.length > maxChars) break;
    knowledge.push(match.content);
    totalChars += match.content.length;
  }
  
  return knowledge.join('\n\n');
}
```

## 方案 2：Obsidian 集成

### 为什么选择 Obsidian？

- ✅ 基于 Markdown，与现有格式兼容
- ✅ 支持 YAML Front Matter
- ✅ 双向链接，方便组织知识
- ✅ 标签系统，便于分类
- ✅ 图形化界面，用户友好

### Obsidian Vault 结构

```
knowledge-vault/
├── Core/
│   ├── Product.md
│   └── Brand Voice.md
├── Domain/
│   ├── Pricing.md
│   └── Performance.md
├── Competitors/
│   ├── OpenAI.md
│   └── Anthropic.md
└── Templates/
    └── Domain Knowledge.md
```

### Obsidian 模板

创建 `Templates/Domain Knowledge.md`：

```markdown
---
type: domain
priority: medium
keywords: []
tags: []
created: {{date}}
---

# {{title}}

## 概述

简短描述...

## 详细内容

内容...

## 相关链接

- [[Product]]
- [[Competitors/OpenAI]]
```

### 配置

在 `.env` 中添加：

```bash
OBSIDIAN_VAULT_PATH=/path/to/knowledge-vault
```

## 方案 3：向量数据库 + RAG（高级）

### 架构

```
Keyword → Vector Search → Top-K Results → Inject to Prompt
```

### 实现（使用 Chroma）

```bash
npm install chromadb openai
```

```javascript
const { ChromaClient } = require('chromadb');

async function retrieveKnowledge(keyword, topK = 5) {
  const collection = await client.getCollection({ name: 'knowledge' });
  const queryEmbedding = await getEmbedding(keyword);
  
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });
  
  return results.documents[0].join('\n\n');
}
```

## 实施建议

### 阶段 1：快速优化（1-2 天）
1. 重构目录结构
2. 添加元数据
3. 实现智能加载
4. 测试调优

### 阶段 2：Obsidian 集成（3-5 天）
1. 创建 Obsidian vault
2. 迁移现有知识
3. 实现读取逻辑

### 阶段 3：向量数据库（可选，1-2 周）
1. 选择数据库
2. 实现向量化
3. 性能测试

## 效果预期

| 指标 | 当前 | 优化后（方案1） | 优化后（方案3） |
|------|------|----------------|----------------|
| 提示词长度 | 15,000 字符 | 8,000 字符 | 5,000 字符 |
| Token 消耗 | 5,000 | 2,500 | 1,500 |
| 可扩展性 | ❌ 有限 | ✅ 良好 | ✅ 优秀 |

## 下一步

建议先实施**方案 1（分层知识库）**：
- ✅ 实现简单，1-2 天完成
- ✅ 无额外依赖
- ✅ 立即见效

如果需要更好的用户体验，再考虑**方案 2（Obsidian）**。

如果知识库超过 100MB，再考虑**方案 3（向量数据库）**。
