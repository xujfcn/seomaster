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

## Obsidian API 和自动化

### Obsidian 的 API 支持

Obsidian 本身**没有官方的 REST API**，但有多种自动化方案：

#### 方案 A：直接文件系统操作（推荐）✅

Obsidian vault 本质上就是一个文件夹，包含 Markdown 文件。我们可以直接读写：

```javascript
// 无需 Obsidian API，直接操作文件
const vaultPath = '/path/to/vault';
const filePath = path.join(vaultPath, 'Domain', 'Pricing.md');

// 读取
const content = fs.readFileSync(filePath, 'utf-8');

// 写入
fs.writeFileSync(filePath, newContent, 'utf-8');

// Obsidian 会自动检测文件变化并刷新
```

**优点**：
- ✅ 简单直接，无需额外依赖
- ✅ Obsidian 会自动检测文件变化
- ✅ 可以在 Obsidian 打开时操作

**缺点**：
- ❌ 需要处理文件锁（Obsidian 打开文件时）
- ❌ 需要自己解析 Obsidian 链接语法

#### 方案 B：Obsidian Local REST API 插件

安装社区插件 "Local REST API"，提供 HTTP 接口：

```bash
# 安装插件后，启动 API 服务器（默认端口 27123）
```

```javascript
// 通过 HTTP API 操作
const fetch = require('node-fetch');

// 读取文件
const response = await fetch('http://localhost:27123/vault/Domain/Pricing.md', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});
const content = await response.text();

// 写入文件
await fetch('http://localhost:27123/vault/Domain/Pricing.md', {
  method: 'PUT',
  headers: { 
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'text/markdown'
  },
  body: newContent
});

// 搜索
const searchResults = await fetch('http://localhost:27123/search/?query=pricing', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});
```

**优点**：
- ✅ 标准 REST API
- ✅ 支持搜索、标签查询
- ✅ 更安全（需要 API Key）

**缺点**：
- ❌ 需要安装插件
- ❌ 需要 Obsidian 运行
- ❌ 额外的配置

#### 方案 C：Obsidian Git 插件（自动同步）

使用 "Obsidian Git" 插件，自动提交和推送：

```bash
# 插件配置
- 自动提交间隔：10 分钟
- 自动推送：启用
- 提交消息模板：vault backup: {{date}}
```

**优点**：
- ✅ 自动版本控制
- ✅ 团队协作友好
- ✅ 可以回滚

**缺点**：
- ❌ 需要 Git 仓库
- ❌ 可能有冲突

### 推荐方案：直接文件系统 + Git

```javascript
// scripts/lib/obsidian-knowledge.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ObsidianKnowledge {
  constructor(vaultPath) {
    this.vaultPath = vaultPath;
  }
  
  // 读取文件
  read(relativePath) {
    const fullPath = path.join(this.vaultPath, relativePath);
    return fs.readFileSync(fullPath, 'utf-8');
  }
  
  // 写入文件
  write(relativePath, content) {
    const fullPath = path.join(this.vaultPath, relativePath);
    const dir = path.dirname(fullPath);
    
    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf-8');
    
    // 自动提交（可选）
    if (process.env.AUTO_COMMIT === 'true') {
      this.gitCommit(relativePath);
    }
  }
  
  // 搜索文件
  search(keyword) {
    const files = this.listAllFiles();
    const matches = [];
    
    for (const file of files) {
      const content = this.read(file);
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        matches.push(file);
      }
    }
    
    return matches;
  }
  
  // Git 提交
  gitCommit(file) {
    try {
      execSync(`cd "${this.vaultPath}" && git add "${file}" && git commit -m "Update ${file}"`, {
        stdio: 'ignore'
      });
    } catch (e) {
      // 忽略错误（可能没有变化）
    }
  }
  
  // 列出所有文件
  listAllFiles(dir = '') {
    const fullDir = path.join(this.vaultPath, dir);
    const files = [];
    
    for (const item of fs.readdirSync(fullDir)) {
      if (item.startsWith('.')) continue;
      
      const fullPath = path.join(fullDir, item);
      const relativePath = path.join(dir, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        files.push(...this.listAllFiles(relativePath));
      } else if (item.endsWith('.md')) {
        files.push(relativePath);
      }
    }
    
    return files;
  }
}

module.exports = ObsidianKnowledge;
```

### 使用示例

```javascript
const ObsidianKnowledge = require('./lib/obsidian-knowledge');

const kb = new ObsidianKnowledge('/path/to/vault');

// 读取
const pricing = kb.read('Domain/Pricing.md');

// 写入
kb.write('Domain/NewTopic.md', `---
tags: [new]
---

# New Topic

Content...
`);

// 搜索
const results = kb.search('pricing');
console.log('Found in:', results);
```

## 2. 重置知识库的便利性

### 不同方案的重置难度

#### 方案 1：分层知识库

**重置方式**：
```bash
# 完全重置
rm -rf knowledge/
mkdir -p knowledge/core knowledge/domain knowledge/competitors

# 部分重置（只清空领域知识）
rm -rf knowledge/domain/*

# 恢复默认
git checkout knowledge/
```

**便利性**：⭐⭐⭐⭐⭐
- ✅ 非常简单，删除文件夹即可
- ✅ 可以用 Git 回滚
- ✅ 可以保留部分内容

#### 方案 2：Obsidian Vault

**重置方式**：
```bash
# 完全重置
rm -rf /path/to/vault
mkdir /path/to/vault

# 或者在 Obsidian 中创建新 vault
# Settings → Vault → Create new vault

# 从模板恢复
cp -r vault-template/* /path/to/vault/
```

**便利性**：⭐⭐⭐⭐⭐
- ✅ 非常简单，删除文件夹或创建新 vault
- ✅ Obsidian 提供 UI 操作
- ✅ 可以维护多个 vault（不同项目）

#### 方案 3：向量数据库

**重置方式**：
```javascript
// Chroma
await client.deleteCollection({ name: 'knowledge' });
await client.createCollection({ name: 'knowledge' });

// Pinecone
await pinecone.deleteIndex('knowledge');
await pinecone.createIndex('knowledge', { dimension: 1536 });
```

**便利性**：⭐⭐⭐
- ⚠️ 需要代码操作
- ⚠️ 重新向量化需要时间
- ⚠️ 可能有成本（API 调用）

### 推荐：知识库版本管理

#### 使用 Git 管理知识库

```bash
# 初始化
cd knowledge
git init
git add .
git commit -m "Initial knowledge base"

# 创建分支（不同项目）
git checkout -b project-a
# 修改知识库...
git commit -am "Update for project A"

git checkout -b project-b
# 修改知识库...
git commit -am "Update for project B"

# 切换项目
git checkout project-a  # 切换到项目 A 的知识库
git checkout project-b  # 切换到项目 B 的知识库
```

#### 使用知识库模板

创建 `knowledge-templates/` 目录：

```
knowledge-templates/
├── saas-product/          # SaaS 产品模板
│   ├── core/
│   ├── domain/
│   └── README.md
├── api-service/           # API 服务模板
│   ├── core/
│   ├── domain/
│   └── README.md
└── ecommerce/             # 电商模板
    ├── core/
    ├── domain/
    └── README.md
```

**快速初始化脚本**：

```javascript
// scripts/init-knowledge.js
const fs = require('fs');
const path = require('path');

function initKnowledge(template = 'saas-product') {
  const templateDir = path.join(__dirname, '../knowledge-templates', template);
  const targetDir = path.join(__dirname, '../knowledge');
  
  // 备份现有知识库
  if (fs.existsSync(targetDir)) {
    const backup = `${targetDir}.backup.${Date.now()}`;
    fs.renameSync(targetDir, backup);
    console.log(`Backed up to: ${backup}`);
  }
  
  // 复制模板
  copyDir(templateDir, targetDir);
  console.log(`Initialized knowledge base from template: ${template}`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 使用
// node scripts/init-knowledge.js saas-product
const template = process.argv[2] || 'saas-product';
initKnowledge(template);
```

### 多项目知识库管理

#### 方案 A：多个 Vault（推荐）

```
obsidian-vaults/
├── project-a/
│   ├── Core/
│   └── Domain/
├── project-b/
│   ├── Core/
│   └── Domain/
└── project-c/
    ├── Core/
    └── Domain/
```

在 `.env` 中配置：

```bash
# 当前项目
CURRENT_PROJECT=project-a
OBSIDIAN_VAULT_PATH=./obsidian-vaults/${CURRENT_PROJECT}
```

#### 方案 B：单个 Vault + 命名空间

```
knowledge-vault/
├── Projects/
│   ├── ProjectA/
│   │   ├── Core/
│   │   └── Domain/
│   ├── ProjectB/
│   │   ├── Core/
│   │   └── Domain/
└── Shared/
    ├── Templates/
    └── Common/
```

### 总结

| 操作 | 分层知识库 | Obsidian | 向量数据库 |
|------|-----------|----------|-----------|
| 完全重置 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 部分重置 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 版本管理 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 多项目切换 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 备份恢复 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**推荐组合**：
- 使用 Obsidian 管理知识库（用户友好）
- 使用 Git 进行版本控制（可回滚）
- 使用模板快速初始化（提高效率）
- 直接文件系统操作（无需 API）
