# 知识库迁移说明

## 当前状态

### 新知识库（Obsidian）✅ 已启用
- **路径**: `D:/crazyrouter/`
- **状态**: 正在使用
- **配置**: `.env` 中 `OBSIDIAN_VAULT_PATH=D:/crazyrouter`

### 旧知识库（Legacy）⚠️ 仅用于显示
- **路径**: `D:/lemondata-free/lemondata-content/seomaster/knowledge/`
- **状态**: 仅用于状态显示，不影响实际功能
- **文件**: 6 个 .md 文件

## 工作流说明

### 实际知识加载流程

```javascript
// knowledge.js 中的逻辑
function loadKnowledge(keyword, maxChars = 15000) {
  if (OBSIDIAN_VAULT_PATH && fs.existsSync(OBSIDIAN_VAULT_PATH)) {
    return loadObsidianKnowledge(keyword, maxChars);  // ✅ 使用 Obsidian
  } else {
    return loadLegacyKnowledge();  // ⚠️ 回退到旧知识库
  }
}
```

**结论**: 工作流默认读取 `D:/crazyrouter/`（Obsidian vault）

### 为什么测试输出显示旧文件？

在测试输出中看到两种显示：

```
第14行: 📚 knowledge: 6 files (benchmarks.md, competitors.md, ...)  ← 旧目录（仅显示）
第30行: 📚 knowledge: 4 files (Product.md, API.md, ...)            ← Obsidian（实际使用）
```

**原因**:
- 第14行和第63行：`listKnowledgeFiles()` 函数仅用于显示状态，读取的是旧目录
- 第30行和第69行：实际的知识加载使用的是 Obsidian vault

**影响**: 无影响，仅显示信息不准确

## 是否可以删除旧知识库？

### 建议：先备份，再删除 ✅

**原因**:
1. **向后兼容**: 如果 `OBSIDIAN_VAULT_PATH` 未设置或路径不存在，会回退到旧知识库
2. **数据安全**: 旧知识库包含一些可能有用的内容
3. **测试验证**: 删除前确保 Obsidian vault 包含所有必要信息

### 删除步骤

#### 步骤 1: 备份旧知识库
```bash
cd D:/lemondata-free/lemondata-content/seomaster
cp -r knowledge knowledge-backup-20260306
```

#### 步骤 2: 验证 Obsidian vault 正常工作
```bash
cd D:/lemondata-free/lemondata-content/seomaster
node test-knowledge.js
```

预期输出：
```
📚 knowledge: 2 files (Product.md, Pricing.md)
```

#### 步骤 3: 生成测试文章验证
```bash
seomaster new "test keyword" --results 3 --words 1000
```

检查输出中的知识库加载信息。

#### 步骤 4: 删除旧知识库（可选）
```bash
# 如果一切正常，可以删除
rm -rf knowledge/

# 或者重命名（更安全）
mv knowledge knowledge-deprecated
```

### 迁移旧知识库内容（推荐）

在删除前，建议将旧知识库的有用内容迁移到 Obsidian vault：

```bash
# 旧知识库文件
knowledge/
├── product.md           → D:/crazyrouter/Core/Product.md (已迁移)
├── models_pricing.md    → D:/crazyrouter/Domain/Pricing.md (部分迁移)
├── benchmarks.md        → D:/crazyrouter/Domain/Performance.md (待创建)
├── competitors.md       → D:/crazyrouter/Competitors/Overview.md (待创建)
├── published_articles.md → D:/crazyrouter/Domain/Published.md (待创建)
└── target_keywords.md   → D:/crazyrouter/Domain/Keywords.md (待创建)
```

#### 迁移脚本

创建 `migrate-knowledge.sh`:
```bash
#!/bin/bash

# 迁移 benchmarks.md
cat > D:/crazyrouter/Domain/Performance.md << 'ENDFILE'
---
type: domain
priority: high
keywords: [performance, speed, fast, latency, throughput, benchmark, optimization]
tags: [performance, technical]
last_updated: 2026-03-06
---

# Performance Benchmarks

$(cat knowledge/benchmarks.md)
ENDFILE

# 迁移 competitors.md
cat > D:/crazyrouter/Competitors/Overview.md << 'ENDFILE'
---
type: competitor
priority: high
keywords: [competitor, alternative, vs, versus, compare, comparison]
tags: [competitor]
last_updated: 2026-03-06
---

# Competitor Overview

$(cat knowledge/competitors.md)
ENDFILE

# 迁移 published_articles.md
cat > D:/crazyrouter/Domain/Published.md << 'ENDFILE'
---
type: domain
priority: low
keywords: [article, blog, post, content]
tags: [content]
last_updated: 2026-03-06
---

# Published Articles

$(cat knowledge/published_articles.md)
ENDFILE

# 迁移 target_keywords.md
cat > D:/crazyrouter/Domain/Keywords.md << 'ENDFILE'
---
type: domain
priority: medium
keywords: [keyword, seo, search, ranking]
tags: [seo]
last_updated: 2026-03-06
---

# Target Keywords

$(cat knowledge/target_keywords.md)
ENDFILE

echo "Migration complete!"
```

运行迁移：
```bash
chmod +x migrate-knowledge.sh
./migrate-knowledge.sh
```

## 修复状态显示（可选）

如果想让状态显示也使用 Obsidian vault，可以修改 `listKnowledgeFiles()` 函数：

```javascript
// knowledge.js
function listKnowledgeFiles() {
  if (OBSIDIAN_VAULT_PATH && fs.existsSync(OBSIDIAN_VAULT_PATH)) {
    // 列出 Obsidian vault 中的文件
    const files = readAllMarkdownFiles(OBSIDIAN_VAULT_PATH);
    return files.map(f => f.filename);
  } else {
    // 回退到旧知识库
    if (!fs.existsSync(LEGACY_KNOWLEDGE_DIR)) return [];
    return fs.readdirSync(LEGACY_KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
  }
}
```

## 总结

### 问题 1: 旧知识库是否可以删除？
**答案**: 可以，但建议先备份并迁移有用内容

### 问题 2: 工作流是否默认读取 D:/crazyrouter？
**答案**: 是的，只要 `OBSIDIAN_VAULT_PATH` 设置了且路径存在

### 推荐操作顺序

1. ✅ 验证 Obsidian vault 正常工作（已完成）
2. ⏭️ 迁移旧知识库的有用内容到 Obsidian vault
3. ⏭️ 备份旧知识库
4. ⏭️ 删除或重命名旧知识库目录
5. ⏭️ 修复 `listKnowledgeFiles()` 函数（可选）

### 安全建议

- ✅ 保留备份至少 1 个月
- ✅ 在删除前生成 5-10 篇测试文章验证
- ✅ 确保 Obsidian vault 包含所有必要信息
- ✅ 定期备份 Obsidian vault（使用 Git）

---

**状态**: 可以安全删除旧知识库（建议先迁移内容）
**风险**: 低（有向后兼容机制）
**建议**: 先迁移内容，再删除
