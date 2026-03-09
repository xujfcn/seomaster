# Project ID vs Project Name - 说明文档

## 概念区别

### Project ID（项目标识符）

**用途**：内部标识符，用于系统内部引用

**特点**：
- 必须唯一
- 只能包含小写字母、数字和连字符
- 不能包含空格
- 不能修改（一旦创建）

**示例**：
- `my-product`
- `ai-gateway`
- `content-platform`

**使用场景**：
- 配置文件中的键名
- 命令行参数
- 文件路径
- 数据库标识

### Project Name（项目名称）

**用途**：显示名称，展示给用户看

**特点**：
- 可以包含空格
- 可以包含大写字母
- 可以包含特殊字符
- 可以修改

**示例**：
- `My Product`
- `AI Gateway Platform`
- `Content Management System`

**使用场景**：
- 用户界面显示
- 报告和文档
- 菜单选项
- 通知消息

---

## 对比示例

| 场景 | Project ID | Project Name |
|------|-----------|--------------|
| 电商平台 | `ecommerce-platform` | `E-Commerce Platform` |
| AI 工具 | `ai-assistant` | `AI Assistant Pro` |
| 博客系统 | `blog-cms` | `Blog Content Management` |
| API 网关 | `api-gateway` | `API Gateway Service` |

---

## 创建项目时的输入

### 旧版流程（已优化）

```
? Project ID: my-product
? Project name: My Product
? Description: AI-powered product
? Obsidian vault path: D:/my-product-vault
? Output directory: output              ❌ 需要手动输入
? Default Language: en
? Default Word Count: 2500
```

### 新版流程（推荐）

```
💡 Tip: Project ID is used internally (e.g., "my-product")
        Project Name is displayed to users (e.g., "My Product")

? Project ID (internal identifier, lowercase, no spaces): my-product
? Project name (display name, can have spaces): My Product
? Description (optional): AI-powered product
? Obsidian vault path (paste full path): D:/my-product-vault
? Default language: en
? Default word count: 2500

✅ Project "My Product" created!

📁 Output directory: D:/my-product-vault/Published  ✅ 自动设置
```

---

## 自动设置输出目录

### 规则

粘贴 Obsidian vault 路径后，系统自动：
1. 设置输出目录为 `{vault_path}/Published`
2. 创建 Published 目录（如果不存在）
3. 所有生成的文章保存到这个目录

### 示例

**输入**：
```
Obsidian vault path: D:/my-product-vault
```

**自动设置**：
```
output_dir: D:/my-product-vault/Published
```

**文件结构**：
```
D:/my-product-vault/
├── Core/
├── Domain/
├── Competitors/
├── Cases/
├── Research/
├── Published/              ← 输出目录（自动设置）
│   ├── 2026-03/
│   │   ├── article-1.md
│   │   └── article-2.md
│   └── 2026-04/
└── Templates/
```

---

## 配置文件示例

### projects.json

```json
{
  "projects": {
    "my-product": {                              // ← Project ID（键名）
      "name": "My Product",                      // ← Project Name（显示名）
      "vault_path": "D:/my-product-vault",
      "output_dir": "D:/my-product-vault/Published",  // ← 自动设置
      "description": "AI-powered product",
      "default_lang": "en",
      "default_market": "us",
      "default_words": 2500,
      "default_results": 5
    },
    "ai-gateway": {                              // ← Project ID
      "name": "AI Gateway Platform",             // ← Project Name
      "vault_path": "D:/ai-gateway-vault",
      "output_dir": "D:/ai-gateway-vault/Published",
      "description": "Multi-protocol AI API gateway",
      "default_lang": "en",
      "default_market": "us",
      "default_words": 2500,
      "default_results": 5
    }
  },
  "current_project": "my-product"                // ← 使用 Project ID
}
```

---

## 使用场景

### 1. 命令行中使用 Project ID

```bash
# 切换项目（使用 Project ID）
seomaster project
# → 选择 "my-product"

# 为特定项目生成文章（使用 Project ID）
seomaster new "keyword" --project my-product
```

### 2. 用户界面显示 Project Name

```
╔════════════════════════════════════════╗
║         SEOMaster - Project Menu       ║
╚════════════════════════════════════════╝

📁 Current Project: My Product            ← 显示 Project Name
   Vault: D:/my-product-vault
   Output: D:/my-product-vault/Published

What would you like to do?
  ✨ New Article
  📄 List Articles
```

### 3. 项目列表显示

```bash
seomaster project:list

📁 Projects:

● My Product (my-product)                 ← Name (ID)
  AI-powered product
  Vault: D:/my-product-vault

○ AI Gateway Platform (ai-gateway)        ← Name (ID)
  Multi-protocol AI API gateway
  Vault: D:/ai-gateway-vault
```

---

## 最佳实践

### Project ID 命名规范

✅ **推荐**：
- `my-product`
- `ai-gateway`
- `content-cms`
- `blog-platform`

❌ **避免**：
- `MyProduct`（包含大写）
- `my product`（包含空格）
- `my_product`（使用下划线，推荐连字符）
- `产品`（使用中文）

### Project Name 命名规范

✅ **推荐**：
- `My Product`
- `AI Gateway Platform`
- `Content Management System`
- `Blog Platform Pro`

✅ **可以使用**：
- 空格
- 大写字母
- 特殊字符（如 `-`, `&`, `+`）
- 中文（如果需要）

---

## 修改项目信息

### 修改 Project Name

可以直接修改 `projects.json`：

```json
{
  "projects": {
    "my-product": {
      "name": "My Product Pro",  // ← 修改这里
      ...
    }
  }
}
```

### 修改 Project ID

⚠️ **不推荐**，因为会影响：
- 配置文件中的键名
- 历史记录
- 文件引用

如果必须修改：
1. 备份 `projects.json`
2. 修改键名
3. 更新 `current_project` 字段
4. 重启 SEOMaster

---

## 故障排除

### 问题 1：Project ID 已存在

**症状**：
```
? Project ID: my-product
✗ Project ID already exists
```

**解决方案**：
- 使用不同的 Project ID
- 或删除现有项目

### 问题 2：输出目录权限错误

**症状**：
```
Error: Cannot create directory: D:/my-product-vault/Published
```

**解决方案**：
1. 检查 vault 路径是否正确
2. 检查文件权限
3. 确保 vault 目录存在

### 问题 3：找不到项目

**症状**：
```
Error: Project not found: my-product
```

**解决方案**：
```bash
# 列出所有项目
seomaster project:list

# 检查 Project ID 是否正确
cat projects.json
```

---

## 总结

### 核心区别

| 特性 | Project ID | Project Name |
|------|-----------|--------------|
| 用途 | 内部标识 | 显示名称 |
| 格式 | 小写、无空格 | 任意格式 |
| 唯一性 | 必须唯一 | 可以重复 |
| 可修改 | 不推荐 | 可以 |
| 使用场景 | 配置、命令 | UI、文档 |

### 新的简化流程

1. ✅ 只需输入 Obsidian vault 路径
2. ✅ 输出目录自动设置为 `{vault}/Published`
3. ✅ 所有内容保存在 vault 内
4. ✅ 符合"知识库优先"理念

### 快速开始

```bash
seomaster
# → Create New Project
# → 输入 Project ID: my-product
# → 输入 Project Name: My Product
# → 粘贴 Obsidian vault 路径
# → 完成！输出目录自动设置
```
