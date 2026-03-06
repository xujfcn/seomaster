#!/usr/bin/env node

/**
 * 初始化新项目的知识库
 * 用法: node scripts/init-new-project.js [vault-path] [project-name]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🚀 SEOMaster - 新项目初始化\n');

  // 1. 获取项目信息
  const vaultPath = process.argv[2] || await question('Obsidian Vault 路径 (如 D:/my-project): ');
  const projectName = process.argv[3] || await question('项目名称 (如 MyProduct): ');
  const projectUrl = await question('项目官网 (如 https://myproduct.com): ');
  const tagline = await question('一句话描述: ');

  console.log('\n📁 创建目录结构...');

  // 2. 创建目录结构
  const dirs = ['Core', 'Domain', 'Competitors', 'Cases', 'Templates'];
  for (const dir of dirs) {
    const dirPath = path.join(vaultPath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  ✓ ${dir}/`);
    }
  }

  // 3. 创建 README
  const readme = `# ${projectName} 知识库

> 用于 SEOMaster 的 ${projectName} 产品知识库
> 创建时间: ${new Date().toISOString().split('T')[0]}

## 目录结构

- \`Core/\` - 核心产品信息（总是加载）
- \`Domain/\` - 领域知识（按关键词匹配加载）
- \`Competitors/\` - 竞品分析
- \`Cases/\` - 使用案例
- \`Templates/\` - 文档模板

## 快速开始

1. 在 Obsidian 中打开此仓库
2. 编辑 \`Core/Product.md\` 填写产品信息
3. 使用 \`Templates/\` 中的模板创建新文档
4. 运行 \`seomaster new "keyword" -i\` 生成文章

## 元数据规范

每个文件应包含 YAML Front Matter：

\`\`\`yaml
---
type: core|domain|competitor|case
priority: critical|high|medium|low
keywords: [keyword1, keyword2]
tags: [tag1, tag2]
last_updated: YYYY-MM-DD
---
\`\`\`
`;

  fs.writeFileSync(path.join(vaultPath, 'README.md'), readme, 'utf-8');
  console.log('  ✓ README.md');

  // 4. 创建核心产品文件
  const today = new Date().toISOString().split('T')[0];
  const productMd = `---
type: core
priority: critical
keywords: [${projectName.toLowerCase()}]
tags: [product, core]
last_updated: ${today}
always_load: true
---

# ${projectName} 产品核心信息

> 最后更新: ${today}
> 数据来源: 官网 + 文档

## 产品定位

- **品牌名**: ${projectName}
- **一句话**: ${tagline}
- **官网**: ${projectUrl}
- **核心定位**: [填写你的产品在市场中的独特定位]

## 核心功能

### 功能 1（核心差异化）

- 详细描述
- 技术实现
- 用户价值

### 功能 2

- 详细描述
- 技术实现
- 用户价值

## 定价优势

- 价格对比
- 免费额度
- 付费方案

## 技术规格

| 指标 | 值 | 来源 | 日期 |
|------|-----|------|------|
| 用户数 | [填写] | 官网 | ${today} |
| 响应时间 | [填写] | 监控数据 | ${today} |

## 目标用户

### 主要受众：[用户群体]

- **痛点**: [列出痛点]
- **目标**: [列出目标]

### 次要受众：[用户群体]

- **痛点**: [列出痛点]
- **目标**: [列出目标]

## 品牌声音

- **语气**: [描述语气]
- **风格**: [描述风格]
- **原则**: [描述原则]

## 相关链接

- [[Domain/Pricing]] - 详细定价信息
- [[Competitors/Overview]] - 竞品对比
`;

  fs.writeFileSync(path.join(vaultPath, 'Core', 'Product.md'), productMd, 'utf-8');
  console.log('  ✓ Core/Product.md');

  // 5. 创建模板
  const domainTemplate = `---
type: domain
priority: medium
keywords: []
tags: []
last_updated: ${today}
---

# {{标题}}

## 概述

简短描述这个领域知识的内容...

## 详细内容

### 子主题 1

内容...

### 子主题 2

内容...

## 数据来源

- 来源 1: [URL]
- 来源 2: [URL]

## 相关链接

- [[Core/Product]]
- [[其他相关页面]]
`;

  fs.writeFileSync(path.join(vaultPath, 'Templates', 'Domain-Knowledge-Template.md'), domainTemplate, 'utf-8');
  console.log('  ✓ Templates/Domain-Knowledge-Template.md');

  const competitorTemplate = `---
type: competitor
priority: medium
keywords: []
tags: [competitor]
last_updated: ${today}
---

# {{竞品名称}}

## 基本信息

- **官网**: [URL]
- **定位**: [描述]
- **目标用户**: [描述]

## 优势

- 优势 1
- 优势 2

## 劣势

- 劣势 1
- 劣势 2

## 定价对比

| 维度 | 我们 | {{竞品名称}} |
|------|------|-------------|
| 价格 | [填写] | [填写] |
| 功能 | [填写] | [填写] |

## 相关链接

- [[Core/Product]]
`;

  fs.writeFileSync(path.join(vaultPath, 'Templates', 'Competitor-Template.md'), competitorTemplate, 'utf-8');
  console.log('  ✓ Templates/Competitor-Template.md');

  // 6. 创建使用指南
  const guide = `# ${projectName} 知识库使用指南

## 🚀 快速开始

### 1. 在 Obsidian 中打开

1. 打开 Obsidian
2. 点击左下角的"打开其他仓库"
3. 选择 \`${vaultPath}\`

### 2. 填写产品信息

编辑 \`Core/Product.md\`，填写：
- 产品定位
- 核心功能
- 目标用户
- 品牌声音

### 3. 添加领域知识

1. 复制 \`Templates/Domain-Knowledge-Template.md\`
2. 粘贴到 \`Domain/\` 目录
3. 重命名并填写内容

### 4. 添加竞品分析

1. 复制 \`Templates/Competitor-Template.md\`
2. 粘贴到 \`Competitors/\` 目录
3. 重命名并填写内容

### 5. 生成文章

\`\`\`bash
cd ${path.dirname(path.dirname(__dirname))}
seomaster new "your keyword" -i --words 2500
\`\`\`

## 📝 元数据说明

### type（文件类型）

- \`core\`: 核心知识，总是加载
- \`domain\`: 领域知识，按关键词匹配
- \`competitor\`: 竞品分析
- \`case\`: 使用案例

### priority（优先级）

- \`critical\`: 最高优先级
- \`high\`: 高优先级
- \`medium\`: 中优先级
- \`low\`: 低优先级

### keywords（关键词）

用于匹配文章关键词，例如：

\`\`\`yaml
keywords: [price, pricing, cost, cheap, affordable]
\`\`\`

当生成包含这些关键词的文章时，此文件会被加载。

## 💡 最佳实践

1. **核心知识保持精简** - Core/ 目录的文件总是加载，保持在 500-1000 字
2. **领域知识按主题拆分** - 不要创建巨大的文件
3. **关键词要全面** - 列出所有可能的关键词变体
4. **定期更新日期** - 每次修改后更新 last_updated
5. **使用双向链接** - 用 [[文件名]] 连接相关文档

## 🎯 下一步

1. ✅ 在 Obsidian 中打开知识库
2. ✅ 填写 Core/Product.md
3. ✅ 创建 2-3 个领域知识文件
4. ✅ 添加 1-2 个竞品分析
5. ✅ 运行测试生成文章

---

**需要帮助？** 查看 [SEOMaster 文档](https://github.com/xujfcn/seomaster)
`;

  fs.writeFileSync(path.join(vaultPath, '使用指南.md'), guide, 'utf-8');
  console.log('  ✓ 使用指南.md');

  // 7. 更新 .env
  console.log('\n⚙️  配置 SEOMaster...');
  const seomasterDir = path.dirname(__dirname);
  const envPath = path.join(seomasterDir, '.env');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    // 更新或添加 OBSIDIAN_VAULT_PATH
    if (envContent.includes('OBSIDIAN_VAULT_PATH=')) {
      envContent = envContent.replace(/OBSIDIAN_VAULT_PATH=.*/g, `OBSIDIAN_VAULT_PATH=${vaultPath}`);
    } else {
      envContent += `\n# Obsidian Vault Path\nOBSIDIAN_VAULT_PATH=${vaultPath}\n`;
    }
  } else {
    envContent = `# Obsidian Vault Path\nOBSIDIAN_VAULT_PATH=${vaultPath}\n`;
  }
  
  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log(`  ✓ 更新 .env: OBSIDIAN_VAULT_PATH=${vaultPath}`);

  // 8. 完成
  console.log('\n✅ 初始化完成！\n');
  console.log('📋 下一步：');
  console.log(`  1. 在 Obsidian 中打开: ${vaultPath}`);
  console.log(`  2. 编辑 Core/Product.md 填写产品信息`);
  console.log(`  3. 使用模板创建领域知识和竞品分析`);
  console.log(`  4. 运行: seomaster new "test keyword" -i\n`);

  rl.close();
}

main().catch(console.error);
