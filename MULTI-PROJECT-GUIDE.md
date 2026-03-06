# 多项目工作流指南

## 概述

SEOMaster 现在支持多项目管理，可以为不同的产品/项目使用不同的知识库和配置。

## 核心概念

### 项目 (Project)
每个项目包含：
- **知识库路径** (vault_path): Obsidian vault 目录
- **输出目录** (output_dir): 文章输出位置
- **默认配置**: 语言、字数、搜索结果数等

### 工作流
1. 启动 SEOMaster
2. 选择项目（自动加载对应知识库）
3. 开始写作

## 快速开始

### 1. 查看现有项目

```bash
seomaster project:list
```

输出示例：
```
📁 Projects:

● Crazyrouter (LemonData) (crazyrouter)
  Multi-protocol AI API gateway
  Vault: D:/crazyrouter

○ MyProduct (myproduct)
  Another product
  Vault: D:/myproduct-kb
```

- `●` 表示当前项目
- `○` 表示其他项目

### 2. 添加新项目

```bash
seomaster project:add
```

交互式问答：
```
📝 Create New Project

? Project ID (lowercase, no spaces): myproduct
? Project name: My Product
? Description: My awesome product
? Knowledge base path (Obsidian vault): D:/myproduct-kb
? Output directory: output
? Default language: en
? Default word count: 2500

✅ Project "My Product" created and set as current.
```

### 3. 切换项目

```bash
seomaster project
```

会显示项目列表供选择：
```
? Select a project:
  ● Crazyrouter (LemonData) - Multi-protocol AI API gateway
  ○ My Product - My awesome product
  + Add new project
```

### 4. 生成文章

#### 方式 1: 使用当前项目（推荐）

```bash
seomaster new "your keyword"
```

启动时会自动：
1. 显示当前项目
2. 加载对应知识库
3. 使用项目默认配置

#### 方式 2: 指定项目

```bash
seomaster new "your keyword" --project myproduct
```

跳过项目选择，直接使用指定项目。

#### 方式 3: 覆盖默认配置

```bash
seomaster new "your keyword" --words 3000 --lang zh
```

使用项目默认配置，但覆盖特定参数。

## 项目配置

### 配置文件位置

`seomaster/projects.json`

### 配置格式

```json
{
  "projects": {
    "crazyrouter": {
      "name": "Crazyrouter (LemonData)",
      "vault_path": "D:/crazyrouter",
      "description": "Multi-protocol AI API gateway",
      "output_dir": "output",
      "default_lang": "en",
      "default_market": "us",
      "default_words": 2500,
      "default_results": 5
    },
    "myproduct": {
      "name": "My Product",
      "vault_path": "D:/myproduct-kb",
      "description": "My awesome product",
      "output_dir": "output",
      "default_lang": "zh",
      "default_market": "cn",
      "default_words": 3000,
      "default_results": 3
    }
  },
  "current_project": "crazyrouter"
}
```

### 配置字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| `name` | 项目名称 | "Crazyrouter (LemonData)" |
| `vault_path` | 知识库路径 | "D:/crazyrouter" |
| `description` | 项目描述 | "Multi-protocol AI API gateway" |
| `output_dir` | 输出目录 | "output" |
| `default_lang` | 默认语言 | "en" 或 "zh" |
| `default_market` | 默认市场 | "us" 或 "cn" |
| `default_words` | 默认字数 | 2500 |
| `default_results` | 默认搜索结果数 | 5 |

## 知识库组织

### 推荐目录结构

```
D:/
├── crazyrouter/              # 项目 1 知识库
│   ├── Core/
│   ├── Domain/
│   ├── Competitors/
│   └── Cases/
├── myproduct-kb/             # 项目 2 知识库
│   ├── Core/
│   ├── Domain/
│   ├── Competitors/
│   └── Cases/
└── lemondata-free/
    └── lemondata-content/
        └── seomaster/
            ├── output/       # 默认输出目录
            └── projects.json # 项目配置
```

### 创建新项目知识库

```bash
# 1. 创建目录
mkdir -p D:/myproduct-kb/{Core,Domain,Competitors,Cases,Templates}

# 2. 复制模板
cp D:/crazyrouter/Templates/* D:/myproduct-kb/Templates/

# 3. 创建核心产品文件
cat > D:/myproduct-kb/Core/Product.md << 'ENDFILE'
---
type: core
priority: critical
keywords: []
tags: [core, product]
last_updated: 2026-03-06
always_load: true
---

# My Product

## 产品定位

[填写产品定位]

## 核心价值

- 价值 1
- 价值 2
- 价值 3
ENDFILE

# 4. 在 Obsidian 中打开
# Open Obsidian → Open folder → D:/myproduct-kb
```

## 使用场景

### 场景 1: 单一产品，多个市场

```json
{
  "projects": {
    "product-us": {
      "name": "Product (US Market)",
      "vault_path": "D:/product-kb",
      "default_lang": "en",
      "default_market": "us"
    },
    "product-cn": {
      "name": "Product (China Market)",
      "vault_path": "D:/product-kb-cn",
      "default_lang": "zh",
      "default_market": "cn"
    }
  }
}
```

### 场景 2: 多个产品

```json
{
  "projects": {
    "product-a": {
      "name": "Product A",
      "vault_path": "D:/product-a-kb"
    },
    "product-b": {
      "name": "Product B",
      "vault_path": "D:/product-b-kb"
    }
  }
}
```

### 场景 3: 同一产品，不同内容类型

```json
{
  "projects": {
    "product-blog": {
      "name": "Product Blog",
      "vault_path": "D:/product-kb",
      "output_dir": "output/blog",
      "default_words": 2000
    },
    "product-docs": {
      "name": "Product Documentation",
      "vault_path": "D:/product-kb",
      "output_dir": "output/docs",
      "default_words": 1500
    }
  }
}
```

## 命令参考

### 项目管理

```bash
# 查看所有项目
seomaster project:list

# 添加新项目
seomaster project:add

# 切换项目
seomaster project
```

### 文章生成

```bash
# 使用当前项目
seomaster new "keyword"

# 指定项目
seomaster new "keyword" --project myproduct

# 覆盖配置
seomaster new "keyword" --words 3000 --lang zh

# 交互式模式
seomaster new "keyword" -i

# 完整示例
seomaster new "ai api pricing" \
  --project crazyrouter \
  --words 2500 \
  --results 5 \
  --interactive
```

### 其他命令

```bash
# 生成 concept
seomaster concept "keyword"

# 预览 concept
seomaster preview output/keyword-concept.yaml

# 生成 draft
seomaster draft output/keyword-concept.yaml

# 生成图片
seomaster images output/keyword-draft.md

# 质量检查
seomaster check output/keyword-draft.md

# 查看所有文章
seomaster list
```

## 最佳实践

### 1. 项目命名

- 使用小写字母和连字符
- 简短且有意义
- 示例: `crazyrouter`, `my-product`, `blog-us`

### 2. 知识库组织

- 每个项目独立的知识库目录
- 使用统一的目录结构（Core, Domain, Competitors, Cases）
- 定期更新知识库内容

### 3. 配置管理

- 为不同市场设置不同的默认语言
- 根据内容类型调整默认字数
- 使用描述性的项目名称

### 4. 工作流程

```bash
# 1. 切换到目标项目
seomaster project

# 2. 生成文章
seomaster new "keyword" -i

# 3. 查看输出
ls output/

# 4. 切换到另一个项目
seomaster project

# 5. 继续生成
seomaster new "another keyword"
```

## 故障排除

### 问题 1: 项目不存在

```
❌ Project not found: myproduct

Available projects:
  - crazyrouter
```

**解决**: 使用 `seomaster project:list` 查看可用项目，或使用 `seomaster project:add` 添加新项目。

### 问题 2: 知识库路径不存在

```
Path does not exist: D:/myproduct-kb. Create it first.
```

**解决**: 先创建目录：
```bash
mkdir -p D:/myproduct-kb/{Core,Domain,Competitors,Cases}
```

### 问题 3: 知识库未加载

**检查**:
1. 项目配置中的 `vault_path` 是否正确
2. 知识库目录是否存在
3. 知识库中是否有 .md 文件

**测试**:
```bash
cd seomaster
node test-knowledge.js
```

## 迁移指南

### 从单项目迁移到多项目

如果你之前使用 `.env` 中的 `OBSIDIAN_VAULT_PATH`：

1. **创建项目配置**:
```bash
seomaster project:add
```

2. **输入现有配置**:
- Project ID: `crazyrouter`
- Vault path: 使用 `.env` 中的路径

3. **删除 .env 配置**（可选）:
```bash
# 注释掉或删除这一行
# OBSIDIAN_VAULT_PATH=D:/crazyrouter
```

4. **测试**:
```bash
seomaster new "test keyword"
```

## 总结

多项目工作流让你可以：
- ✅ 为不同产品使用不同知识库
- ✅ 为不同市场使用不同配置
- ✅ 轻松切换项目
- ✅ 集中管理所有项目配置

开始使用：
```bash
seomaster project:add  # 添加新项目
seomaster project      # 切换项目
seomaster new "keyword"  # 生成文章
```

---

**版本**: 1.0.0  
**更新日期**: 2026-03-06
