# Obsidian 知识库集成说明

## 当前状态

### ✅ 已实现的功能

#### 1. **知识库读取**（已完成）

SEOMaster 已经集成了 Obsidian 知识库的读取功能：

**配置位置**：`projects.json`
```json
{
  "projects": {
    "crazyrouter": {
      "name": "Crazyrouter",
      "vault_path": "D:/crazyrouter",  // Obsidian vault 路径
      "output_dir": "output",
      ...
    }
  }
}
```

**知识库结构**：
```
D:/crazyrouter/
├── Core/              # 核心知识（总是加载）
│   └── Product.md
├── Domain/            # 领域知识（按关键词匹配）
│   ├── Pricing.md
│   └── API.md
├── Competitors/       # 竞品分析
├── Cases/             # 使用案例
└── Templates/         # 模板（不加载）
```

**工作原理**：

1. **生成 Concept 时**：
   - 读取 Obsidian vault 中的所有 `.md` 文件
   - 解析 YAML Front Matter（metadata）
   - 根据关键词匹配相关文件
   - 按优先级排序（critical > high > medium > low）
   - 加载到 AI prompt 中作为上下文

2. **生成 Draft 时**：
   - 同样加载知识库内容
   - 确保文章内容基于准确的产品信息

**YAML Front Matter 示例**：
```yaml
---
type: core|domain|competitor|case
priority: critical|high|medium|low
keywords: [pricing, api, cost]
tags: [feature, comparison]
last_updated: 2026-03-09
always_load: true
---

# 文件内容
```

**代码位置**：`scripts/lib/knowledge.js`

---

### ❌ 未实现的功能

#### 2. **生成的文章存入知识库**（未实现）

**当前行为**：
- 生成的文章保存在 `output/` 目录
- **不会**自动存入 Obsidian vault
- **不会**自动添加到知识库

**文件位置**：
```
seomaster/output/
├── keyword-concept.yaml      # 文章大纲
├── keyword-draft.md          # 完整文章
├── keyword-research.json     # 竞品研究
└── keyword-1.png             # 配图
```

---

## 工作流程图

### 当前流程（单向读取）

```
Obsidian Vault (D:/crazyrouter/)
    ↓ 读取
    ↓
SEOMaster (生成文章)
    ↓ 输出
    ↓
output/ 目录
    ↓ 手动
    ↓
发布到网站/博客
```

### 理想流程（双向同步）

```
Obsidian Vault (D:/crazyrouter/)
    ↓ 读取
    ↓
SEOMaster (生成文章)
    ↓ 输出
    ↓
output/ 目录
    ↓ 自动存入
    ↓
Obsidian Vault/Published/
    ↓ 手动
    ↓
发布到网站/博客
```

---

## 实现建议：将生成的文章存入知识库

### 方案 1：自动存入 Published 目录

**目标**：生成的文章自动保存到 Obsidian vault 的 `Published/` 目录

**实现步骤**：

1. **修改 `generate-draft.js`**：
   - 在生成 draft 后，复制到 vault
   - 添加 YAML Front Matter
   - 保存到 `vault_path/Published/`

2. **目录结构**：
```
D:/crazyrouter/
├── Core/              # 输入：核心知识
├── Domain/            # 输入：领域知识
├── Published/         # 输出：生成的文章（新增）
│   ├── 2026-03/
│   │   ├── openrouter-alternative.md
│   │   └── ai-api-pricing.md
│   └── ...
└── Templates/
```

3. **YAML Front Matter**：
```yaml
---
type: published
status: draft|reviewed|published
created: 2026-03-09
keyword: openrouter alternative
word_count: 2500
quality_score: 85
published_url: https://example.com/blog/openrouter-alternative
---

# 文章内容
```

### 方案 2：手动导入

**目标**：提供命令手动将文章导入到 vault

**实现步骤**：

1. **新增命令**：
```bash
seomaster import <draft-file> [--vault-dir Published]
```

2. **功能**：
   - 复制文章到 vault
   - 添加 metadata
   - 可选择目标目录

### 方案 3：Obsidian 插件集成

**目标**：在 Obsidian 中直接管理 SEOMaster

**实现步骤**：

1. 开发 Obsidian 插件
2. 在 Obsidian 中触发文章生成
3. 生成的文章直接保存在 vault 中

---

## 推荐方案：方案 1（自动存入）

### 优势

- ✅ 自动化，无需手动操作
- ✅ 所有文章集中管理
- ✅ 可以在 Obsidian 中查看和编辑
- ✅ 支持 Obsidian 的链接、标签等功能

### 实现代码示例

```javascript
// scripts/lib/vault-writer.js

const fs = require('fs');
const path = require('path');

/**
 * 将生成的文章保存到 Obsidian vault
 */
function saveToVault(draftContent, metadata, vaultPath) {
  const publishedDir = path.join(vaultPath, 'Published');

  // 创建 Published 目录
  if (!fs.existsSync(publishedDir)) {
    fs.mkdirSync(publishedDir, { recursive: true });
  }

  // 按月份组织
  const date = new Date();
  const monthDir = path.join(publishedDir, `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);

  if (!fs.existsSync(monthDir)) {
    fs.mkdirSync(monthDir, { recursive: true });
  }

  // 添加 YAML Front Matter
  const frontMatter = `---
type: published
status: draft
created: ${date.toISOString().split('T')[0]}
keyword: ${metadata.keyword}
word_count: ${metadata.word_count}
quality_score: ${metadata.quality_score || 'N/A'}
---

`;

  const fullContent = frontMatter + draftContent;

  // 保存文件
  const filename = `${metadata.slug}.md`;
  const filepath = path.join(monthDir, filename);

  fs.writeFileSync(filepath, fullContent, 'utf-8');

  console.log(`✅ Saved to vault: ${filepath}`);

  return filepath;
}

module.exports = { saveToVault };
```

### 使用方式

```javascript
// scripts/generate-draft.js

const { saveToVault } = require('./lib/vault-writer');
const { getCurrentProject } = require('./lib/project-manager');

// 生成 draft 后
const project = getCurrentProject();
if (project && project.vault_path) {
  saveToVault(draftContent, {
    keyword: concept.keyword,
    slug: concept.slug,
    word_count: concept.total_word_count,
    quality_score: qualityScore
  }, project.vault_path);
}
```

---

## 配置选项

### 在 projects.json 中添加配置

```json
{
  "projects": {
    "crazyrouter": {
      "name": "Crazyrouter",
      "vault_path": "D:/crazyrouter",
      "output_dir": "output",
      "save_to_vault": true,           // 是否自动保存到 vault
      "vault_published_dir": "Published",  // vault 中的发布目录
      ...
    }
  }
}
```

---

## 使用场景

### 场景 1：纯输出模式（当前）

```bash
seomaster new "keyword"
# 输出到 output/ 目录
# 不保存到 vault
```

### 场景 2：自动存入模式（推荐）

```bash
seomaster new "keyword"
# 输出到 output/ 目录
# 同时保存到 vault/Published/
```

### 场景 3：仅存入 vault

```bash
seomaster new "keyword" --vault-only
# 只保存到 vault
# 不保存到 output/
```

---

## 下一步行动

### 立即可做

1. **手动复制**：
   ```bash
   cp output/keyword-draft.md D:/crazyrouter/Published/
   ```

2. **脚本辅助**：
   ```bash
   # 创建简单的复制脚本
   #!/bin/bash
   cp output/$1-draft.md D:/crazyrouter/Published/$(date +%Y-%m)/$1.md
   ```

### 需要开发

1. **实现 vault-writer.js**
2. **修改 generate-draft.js**
3. **添加配置选项**
4. **更新文档**

---

## 相关文档

- [CHANGELOG.md](../CHANGELOG.md) - 2026-03-06 Obsidian 集成记录
- [configuration.md](./configuration.md) - 知识库配置说明
- [interactive-guide.md](./interactive-guide.md) - 交互式使用指南

---

## 总结

### 当前状态

- ✅ **读取知识库**：已实现，工作正常
- ❌ **写入知识库**：未实现，需要开发

### 推荐方案

实现**自动存入 Published 目录**功能，让生成的文章自动保存到 Obsidian vault，实现完整的知识管理闭环。

### 临时方案

手动复制生成的文章到 vault：
```bash
cp output/keyword-draft.md D:/crazyrouter/Published/
```
