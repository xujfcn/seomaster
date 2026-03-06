#!/usr/bin/env node

/**
 * 快速初始化新项目
 * 
 * 使用方法：
 *   node scripts/quick-init.js
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
  console.log('\n🚀 SEOMaster 快速初始化\n');
  
  // 1. 产品信息
  const productName = await question('产品名称: ');
  const productTagline = await question('一句话介绍: ');
  const productWebsite = await question('官网地址: ');
  
  // 2. 核心功能
  console.log('\n核心功能（输入空行结束）:');
  const features = [];
  while (true) {
    const feature = await question(`  功能 ${features.length + 1}: `);
    if (!feature.trim()) break;
    features.push(feature);
  }
  
  // 3. 目标用户
  const targetAudience = await question('\n目标用户: ');
  const painPoint = await question('主要痛点: ');
  
  // 4. 价格
  const pricing = await question('\n价格信息: ');
  
  rl.close();
  
  // 生成 knowledge/product.md
  const knowledgeDir = path.join(__dirname, '..', 'knowledge');
  if (!fs.existsSync(knowledgeDir)) {
    fs.mkdirSync(knowledgeDir, { recursive: true });
  }
  
  const productMd = `# ${productName}

## 产品定位

${productTagline}

## 核心功能

${features.map(f => `- ${f}`).join('\n')}

## 目标用户

${targetAudience}

### 主要痛点
- ${painPoint}

## 价格

${pricing}

## 官网

${productWebsite}

---

生成时间: ${new Date().toISOString().split('T')[0]}
`;

  const productFile = path.join(knowledgeDir, 'product.md');
  fs.writeFileSync(productFile, productMd, 'utf-8');
  
  console.log('\n✅ 初始化完成！\n');
  console.log(`📄 已创建: ${productFile}\n`);
  console.log('📋 下一步:');
  console.log('   1. 检查并完善 knowledge/product.md');
  console.log('   2. (可选) 添加 knowledge/competitors.md');
  console.log('   3. 运行: seomaster new "your keyword"\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
