# Obsidian 知识库集成 - 完整说明

## 📊 当前状态总结

### ✅ 已实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 读取知识库 | ✅ 完成 | 生成文章时自动加载 Obsidian vault 中的知识 |
| 关键词匹配 | ✅ 完成 | 根据文章关键词智能匹配相关知识文件 |
| YAML Front Matter | ✅ 完成 | 支持解析文件元数据（priority, keywords, tags） |
| 优先级排序 | ✅ 完成 | 按 critical > high > medium > low 排序 |
| 多项目支持 | ✅ 完成 | 每个项目可配置独立的 vault 路径 |
| 导入到 vault | ✅ 新增 | 手动命令将生成的文章导入到 vault |

### ❌ 未实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 自动存入 vault | ❌ 未实现 | 生成文章后自动保存到 vault（可选功能） |
| 双向同步 | ❌ 未实现 | vault 中的修改同步回 output/ |
| 版本管理 | ❌ 未实现 | 文章版本历史追踪 |

---

## 🔄 工作流程

### 当前工作流（单向读取 + 手动导入）

```
1. 准备知识库
   ↓
   在 Obsidian vault 中创建知识文件
   D:/crazyrouter/Core/Product.md
   D:/crazyrouter/Domain/Pricing.md

2. 生成文章
   ↓
   seomaster new "openrouter alternative"
   ↓
   系统自动读取 vault 中的相关知识
   ↓
   生成文章到 output/

3. 导入到 vault（可选）
   ↓
   seomaster vault:import output/openrouter-alternative-draft.md
   ↓
   文章保存到 vault/Published/2026-03/
```

---

## 📁 目录结构

### Obsidian Vault 结构

```
D:/crazyrouter/                    # Obsidian vault 根目录
├── .obsidian/                     # Obsidian 配置（自动生成）
├── Core/                          # 核心知识（总是加载）
│   └── Product.md
├── Domain/                        # 领域知识（按关键词匹配）
│   ├── Pricing.md
│   ├── API.md
│   └── Performance.md
├── Competitors/                   # 竞品分析
│   ├── OpenRouter.md
│   └── AIGateway.md
├── Cases/                         # 使用案例
│   └── Success-Stories.md
├── Published/                     # 生成的文章（导入后）
│   ├── 2026-03/
│   │   ├── openrouter-alternative.md
│   │   └── ai-api-pricing.md
│   └── 2026-04/
│       └── ...
├── Templates/                     # 模板（不加载）
│   ├── Domain-Knowledge-Template.md
│   └── Competitor-Template.md
├── README.md                      # 知识库说明
└── GUIDE.md                       # 使用指南
```

### SEOMaster 输出结构

```
seomaster/output/                  # 生成的文章
├── keyword-concept.yaml           # 文章大纲
├── keyword-draft.md               # 完整文章
├── keyword-research.json          # 竞品研究
├── keyword-1.png                  # 配图 1
├── keyword-2.png                  # 配图 2
└── keyword-3.png                  # 配图 3
```

---

## 🔧 配置说明

### 项目配置（projects.json）

```json
{
  "projects": {
    "crazyrouter": {
      "name": "Crazyrouter (LemonData)",
      "vault_path": "D:/crazyrouter",        // Obsidian vault 路径
      "output_dir": "output",                // 输出目录
      "default_lang": "en",
      "default_market": "us",
      "default_words": 2500,
      "default_results": 5
    }
  },
  "current_project": "crazyrouter"
}
```

### 知识文件 YAML Front Matter

```yaml
---
type: core|domain|competitor|case
priority: critical|high|medium|low
keywords: [pricing, api, cost, comparison]
tags: [feature, technical]
last_updated: 2026-03-09
always_load: true                    # 总是加载（可选）
---

# 文件内容

## 产品定价

- 基础版：$0/月
- 专业版：$29/月
- 企业版：联系销售

数据来源：官网价格页，2026-03-09
```

---

## 💻 使用命令

### 基本命令

```bash
# 1. 生成文章（自动读取 vault 知识）
seomaster new "openrouter alternative"

# 2. 导入文章到 vault
seomaster vault:import output/openrouter-alternative-draft.md

# 3. 指定 vault 子目录
seomaster vault:import output/keyword-draft.md --dir Published

# 4. 在 Obsidian 中查看
# 打开 Obsidian → 打开 vault (D:/crazyrouter) → 查看 Published/2026-03/
```

### 完整工作流示例

```bash
# Step 1: 创建项目（首次）
seomaster
# → Create New Project
# → 输入 vault_path: D:/my-product-vault

# Step 2: 在 Obsidian 中准备知识库
# 打开 Obsidian → 打开 vault (D:/my-product-vault)
# 创建 Core/Product.md, Domain/Pricing.md 等

# Step 3: 生成文章
seomaster new "best ai api"
# 系统自动读取 vault 中的知识
# 输出到 output/best-ai-api-draft.md

# Step 4: 导入到 vault
seomaster vault:import output/best-ai-api-draft.md
# 保存到 vault/Published/2026-03/best-ai-api.md

# Step 5: 在 Obsidian 中编辑和发布
# 打开 Obsidian → 编辑文章 → 发布到网站
```

---

## 📝 知识库最佳实践

### 1. 文件组织

**按类型分类**：
- `Core/` - 产品核心信息（总是加载）
- `Domain/` - 领域知识（按需加载）
- `Competitors/` - 竞品分析
- `Cases/` - 使用案例

**命名规范**：
- 使用描述性文件名：`Pricing.md` 而不是 `p1.md`
- 使用 PascalCase：`API-Integration.md`

### 2. YAML Front Matter

**必填字段**：
```yaml
---
type: domain
priority: high
keywords: [pricing, cost]
---
```

**可选字段**：
```yaml
---
tags: [feature, comparison]
last_updated: 2026-03-09
always_load: false
author: John Doe
---
```

### 3. 内容维护

**定期更新**：
- 价格信息：每月更新
- 竞品分析：每季度更新
- 产品功能：每次发布后更新

**标注来源**：
```markdown
## 定价信息

- 基础版：$0/月
- 专业版：$29/月

数据来源：官网价格页
更新日期：2026-03-09
验证状态：已验证
```

### 4. 关键词策略

**精准匹配**：
```yaml
keywords: [pricing, cost, price comparison]
```

**覆盖变体**：
```yaml
keywords: [api, API, application programming interface]
```

**长尾关键词**：
```yaml
keywords: [ai api pricing, best ai api for developers]
```

---

## 🎯 使用场景

### 场景 1：新产品启动

```bash
# 1. 创建 Obsidian vault
mkdir D:/my-product-vault
cd D:/my-product-vault

# 2. 创建基础知识文件
mkdir Core Domain Competitors
echo "# Product Info" > Core/Product.md

# 3. 在 SEOMaster 中配置
seomaster project:add
# vault_path: D:/my-product-vault

# 4. 生成第一篇文章
seomaster new "my product introduction"

# 5. 导入到 vault
seomaster vault:import output/my-product-introduction-draft.md
```

### 场景 2：多产品管理

```bash
# 产品 A
seomaster project
# → 选择 product-a
seomaster new "product a features"

# 产品 B
seomaster project
# → 选择 product-b
seomaster new "product b pricing"

# 每个产品使用独立的 vault
# product-a: D:/product-a-vault
# product-b: D:/product-b-vault
```

### 场景 3：知识库迁移

```bash
# 从旧的 knowledge/ 迁移到 Obsidian vault

# 1. 创建 vault 目录
mkdir D:/my-vault/Core

# 2. 复制旧文件
cp knowledge/product.md D:/my-vault/Core/Product.md

# 3. 添加 YAML Front Matter
# 编辑 D:/my-vault/Core/Product.md
# 在文件开头添加：
---
type: core
priority: critical
keywords: [product, feature]
always_load: true
---

# 4. 更新项目配置
# 编辑 projects.json
"vault_path": "D:/my-vault"

# 5. 测试
seomaster new "test keyword"
# 检查是否正确加载知识库
```

---

## 🔍 故障排除

### 问题 1：知识库未加载

**症状**：生成文章时显示 "knowledge: 0 files"

**解决方案**：
```bash
# 1. 检查 vault 路径
cat projects.json | grep vault_path

# 2. 检查目录是否存在
ls -la D:/crazyrouter

# 3. 检查文件是否有 YAML Front Matter
cat D:/crazyrouter/Core/Product.md | head -10

# 4. 检查关键词匹配
# 确保文件的 keywords 包含相关关键词
```

### 问题 2：导入失败

**症状**：`seomaster vault:import` 报错

**解决方案**：
```bash
# 1. 检查文件是否存在
ls -la output/keyword-draft.md

# 2. 检查 vault 路径
seomaster project:list

# 3. 手动创建 Published 目录
mkdir -p D:/crazyrouter/Published/2026-03

# 4. 重试
seomaster vault:import output/keyword-draft.md
```

### 问题 3：Obsidian 无法打开 vault

**症状**：Obsidian 提示 "Not a valid vault"

**解决方案**：
```bash
# 1. 创建 .obsidian 目录
mkdir D:/crazyrouter/.obsidian

# 2. 在 Obsidian 中重新打开
# File → Open folder as vault → 选择 D:/crazyrouter

# 3. Obsidian 会自动创建配置文件
```

---

## 📚 相关文档

- [obsidian-integration-status.md](./obsidian-integration-status.md) - 集成状态详解
- [configuration.md](./configuration.md) - 配置说明
- [interactive-guide.md](./interactive-guide.md) - 交互式使用指南
- [CHANGELOG.md](../CHANGELOG.md) - 更新日志

---

## 🚀 下一步计划

### 短期（可立即实现）

- [x] 手动导入命令（已完成）
- [ ] 自动存入选项（配置开关）
- [ ] 批量导入命令

### 中期（需要开发）

- [ ] 自动存入 vault（生成后自动保存）
- [ ] 文章状态管理（draft/reviewed/published）
- [ ] 版本历史追踪

### 长期（需要研究）

- [ ] Obsidian 插件开发
- [ ] 双向同步
- [ ] 知识图谱可视化

---

## 总结

### 当前能力

✅ **读取知识库**：生成文章时自动加载 Obsidian vault 中的知识
✅ **智能匹配**：根据关键词匹配相关知识文件
✅ **手动导入**：使用命令将生成的文章导入到 vault

### 推荐工作流

1. 在 Obsidian 中维护知识库
2. 使用 SEOMaster 生成文章
3. 使用 `vault:import` 命令导入到 vault
4. 在 Obsidian 中编辑和发布

### 快速开始

```bash
# 1. 生成文章
seomaster new "your keyword"

# 2. 导入到 vault
seomaster vault:import output/your-keyword-draft.md

# 3. 在 Obsidian 中查看
# 打开 vault/Published/2026-03/your-keyword.md
```
