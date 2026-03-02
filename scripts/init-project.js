#!/usr/bin/env node

/**
 * SEOMaster - 项目初始化脚本
 *
 * 功能：从原始文档文件夹中提取信息，自动生成 project-config.yaml
 *
 * 使用方法：
 *   node scripts/init-project.js <input-folder> [output-file]
 *
 * 示例：
 *   node scripts/init-project.js ./raw-docs ./project-config.yaml
 */

const fs = require('fs');
const path = require('path');

// ============================================
// 配置
// ============================================
const CONFIG = {
  // 支持的文件类型
  supportedExtensions: ['.md', '.txt', '.yaml', '.yml', '.json'],

  // API 配置（从环境变量读取）
  apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
  apiBase: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
  model: process.env.AI_MODEL || 'gpt-4o',
};

// ============================================
// 主函数
// ============================================
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('用法: node scripts/init-project.js <input-folder> [output-file]');
    console.log('');
    console.log('示例:');
    console.log('  node scripts/init-project.js ./raw-docs');
    console.log('  node scripts/init-project.js ./raw-docs ./my-project-config.yaml');
    process.exit(1);
  }

  const inputFolder = args[0];
  const outputFile = args[1] || './project-config.yaml';

  console.log('🚀 SEOMaster 项目初始化');
  console.log('');
  console.log(`📂 输入文件夹: ${inputFolder}`);
  console.log(`📄 输出文件: ${outputFile}`);
  console.log('');

  // 1. 读取所有文档
  console.log('📖 正在读取原始文档...');
  const documents = readDocuments(inputFolder);
  console.log(`✅ 找到 ${documents.length} 个文档`);
  console.log('');

  // 2. 分析文档内容
  console.log('🤖 正在分析文档内容...');
  const analysis = await analyzeDocuments(documents);
  console.log('✅ 分析完成');
  console.log('');

  // 3. 生成配置文件
  console.log('📝 正在生成配置文件...');
  const config = generateConfig(analysis);

  // 4. 写入文件
  fs.writeFileSync(outputFile, config, 'utf-8');
  console.log(`✅ 配置文件已生成: ${outputFile}`);
  console.log('');
  console.log('🎉 初始化完成！');
  console.log('');
  console.log('下一步:');
  console.log(`  1. 检查并完善 ${outputFile}`);
  console.log('  2. 运行 node scripts/generate-concept.js 生成文章 Concept');
}

// ============================================
// 读取文档
// ============================================
function readDocuments(folderPath) {
  const documents = [];

  if (!fs.existsSync(folderPath)) {
    console.error(`❌ 错误: 文件夹不存在: ${folderPath}`);
    process.exit(1);
  }

  function readDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        readDir(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (CONFIG.supportedExtensions.includes(ext)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          documents.push({
            path: filePath,
            name: file,
            content: content,
            size: stat.size,
          });
        }
      }
    }
  }

  readDir(folderPath);
  return documents;
}

// ============================================
// 分析文档（使用 AI）
// ============================================
async function analyzeDocuments(documents) {
  // 合并所有文档内容
  const combinedContent = documents
    .map((doc) => `=== ${doc.name} ===\n${doc.content}`)
    .join('\n\n');

  // 构建提示词
  const prompt = buildAnalysisPrompt(combinedContent);

  // 调用 AI API
  if (!CONFIG.apiKey) {
    console.warn('⚠️  警告: 未配置 API Key，将生成模板配置');
    return generateTemplateAnalysis();
  }

  try {
    const response = await callAI(prompt);
    return parseAIResponse(response);
  } catch (error) {
    console.error('❌ AI 分析失败:', error.message);
    console.warn('⚠️  将生成模板配置');
    return generateTemplateAnalysis();
  }
}

// ============================================
// 构建分析提示词
// ============================================
function buildAnalysisPrompt(content) {
  return `你是一个专业的内容营销顾问。请分析以下原始文档，提取关键信息用于生成 SEO 内容营销配置。

原始文档内容：
${content}

请以 JSON 格式返回以下信息：

{
  "project": {
    "name": "产品名称",
    "tagline": "一句话产品定位",
    "website": "官网地址",
    "industry": "行业分类"
  },
  "value_proposition": {
    "product": "产品名称",
    "audience": "目标用户",
    "action": "核心动作",
    "result": "量化结果"
  },
  "audience": {
    "primary": {
      "title": "主要受众",
      "pain_points": ["痛点1", "痛点2", "痛点3"],
      "goals": ["目标1", "目标2"]
    }
  },
  "competitors": [
    {
      "name": "竞品名称",
      "strengths": ["优势1", "优势2"],
      "weaknesses": ["劣势1", "劣势2"]
    }
  ],
  "key_metrics": [
    {
      "metric": "指标名称",
      "value": "数值",
      "source": "来源"
    }
  ],
  "voice": {
    "tone": "品牌语气",
    "style": "写作风格"
  }
}

注意：
1. 只返回 JSON，不要其他解释
2. 如果某些信息缺失，用合理的推测填充
3. 确保所有字段都有值`;
}

// ============================================
// 调用 AI API
// ============================================
async function callAI(prompt) {
  const fetch = (await import('node-fetch')).default;

  const response = await fetch(`${CONFIG.apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: CONFIG.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================
// 解析 AI 响应
// ============================================
function parseAIResponse(response) {
  // 尝试提取 JSON
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('无法从 AI 响应中提取 JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

// ============================================
// 生成模板分析（当 AI 不可用时）
// ============================================
function generateTemplateAnalysis() {
  return {
    project: {
      name: 'YourProduct',
      tagline: '一句话产品定位',
      website: 'https://yourproduct.com',
      industry: 'SaaS',
    },
    value_proposition: {
      product: 'YourProduct',
      audience: '目标用户',
      action: '核心动作',
      result: '量化结果',
    },
    audience: {
      primary: {
        title: '主要受众',
        pain_points: ['痛点1', '痛点2', '痛点3'],
        goals: ['目标1', '目标2'],
      },
    },
    competitors: [
      {
        name: 'Competitor A',
        strengths: ['优势1', '优势2'],
        weaknesses: ['劣势1', '劣势2'],
      },
    ],
    key_metrics: [
      {
        metric: '核心指标',
        value: '数值',
        source: '来源',
      },
    ],
    voice: {
      tone: '技术老手的实话实说',
      style: '数据驱动，不吹不黑',
    },
  };
}

// ============================================
// 生成配置文件
// ============================================
function generateConfig(analysis) {
  const today = new Date().toISOString().split('T')[0];

  return `# SEOMaster 项目配置
# 由 init-project.js 自动生成于 ${today}
# 请检查并完善以下配置

# ============================================
# 项目基本信息
# ============================================
project:
  name: "${analysis.project.name}"
  tagline: "${analysis.project.tagline}"
  website: "${analysis.project.website}"
  industry: "${analysis.project.industry}"
  founded: "${new Date().getFullYear()}"

# ============================================
# 品牌声音（Brand Voice）
# ============================================
voice:
  tone: "${analysis.voice.tone}"
  style: "${analysis.voice.style}"

  principles:
    - "用数据说话，每个判断都有证据支撑"
    - "用开发者能理解的语言，避免营销腔"
    - "以「读者会不会觉得这是广告」为标尺"
    - "承认产品限制，不做完美承诺"

  forbidden_phrases:
    - "颠覆性的"
    - "革命性的"
    - "一站式解决方案"
    - "赋能"
    - "无缝对接"

# ============================================
# 核心价值主张（Value Proposition）
# ============================================
value_proposition:
  template: "{product} 让 {audience} {action}，{result}"

  product: "${analysis.value_proposition.product}"
  audience: "${analysis.value_proposition.audience}"
  action: "${analysis.value_proposition.action}"
  result: "${analysis.value_proposition.result}"

  full: "${analysis.value_proposition.product} 让 ${analysis.value_proposition.audience} ${analysis.value_proposition.action}，${analysis.value_proposition.result}"

# ============================================
# 目标读者画像
# ============================================
audience:
  primary:
    title: "${analysis.audience.primary.title}"
    description: "TODO: 补充详细描述"
    pain_points:
${analysis.audience.primary.pain_points.map((p) => `      - "${p}"`).join('\n')}
    goals:
${analysis.audience.primary.goals.map((g) => `      - "${g}"`).join('\n')}

  secondary:
    title: "TODO: 次要受众"
    description: "TODO: 补充描述"
    pain_points:
      - "TODO: 痛点1"
    goals:
      - "TODO: 目标1"

# ============================================
# 竞品信息
# ============================================
competitors:
${analysis.competitors
  .map(
    (c) => `  - name: "${c.name}"
    website: "TODO: 补充网址"
    strengths:
${c.strengths.map((s) => `      - "${s}"`).join('\n')}
    weaknesses:
${c.weaknesses.map((w) => `      - "${w}"`).join('\n')}
    pricing: "TODO: 补充价格"`
  )
  .join('\n\n')}

# ============================================
# 核心数据点（Key Metrics）
# ============================================
key_metrics:
${analysis.key_metrics
  .map(
    (m) => `  - metric: "${m.metric}"
    value: "${m.value}"
    source: "${m.source}"
    source_url: "TODO: 补充来源链接"
    verified: false
    date: "${today}"`
  )
  .join('\n\n')}

# ============================================
# 发布渠道配置
# ============================================
channels:
  blog:
    enabled: true
    auto_publish: false
    base_url: "${analysis.project.website}/blog"

  chinese:
    - platform: "知乎"
      enabled: true
      content_type: "问答、技术文"
      account: "TODO: 补充账号"
    - platform: "掘金"
      enabled: true
      content_type: "技术教程"

  english:
    - platform: "dev.to"
      enabled: false
      content_type: "技术博客"
    - platform: "Hashnode"
      enabled: false
      content_type: "技术博客"

  social:
    - platform: "Twitter/X"
      enabled: false
      account: "TODO: 补充账号"

# ============================================
# SEO 关键词库
# ============================================
seo_keywords:
  primary:
    - keyword: "TODO: 核心关键词1"
      search_volume: 0
      difficulty: 0
      priority: "P0"

  secondary:
    - keyword: "TODO: 次级关键词1"
      search_volume: 0
      difficulty: 0
      priority: "P1"

  long_tail:
    - keyword: "TODO: 长尾关键词1"
      search_volume: 0
      difficulty: 0
      priority: "P2"

# ============================================
# CTA（Call-to-Action）模板
# ============================================
cta:
  default:
    text: "立即注册 ${analysis.project.name}，开始使用"
    url: "${analysis.project.website}/signup"

  scenarios:
    trial:
      text: "免费试用 ${analysis.project.name}，无需信用卡"
      url: "${analysis.project.website}/trial"

    comparison:
      text: "查看完整对比，选择最适合你的方案"
      url: "${analysis.project.website}/compare"

    tutorial:
      text: "跟随教程，快速上手"
      url: "${analysis.project.website}/docs"

# ============================================
# 内容生产配置
# ============================================
content_production:
  monthly_plan:
    week1: "技术教程"
    week2: "竞品对比/价格更新"
    week3: "用户案例/使用技巧"
    week4: "产品更新/新功能"

  publishing_schedule:
    day0: "官网博客上线"
    day1: "中文社区（知乎/掘金）"
    day2: "Twitter Thread"
    day3: "小红书（配图版）"
    day7: "英文社区（dev.to/Reddit）"

# ============================================
# API 配置（用于 AI 生成）
# ============================================
api:
  text_generation:
    provider: "openai"
    api_key_env: "OPENAI_API_KEY"
    base_url: "https://api.openai.com/v1"
    model: "gpt-4o"

  image_generation:
    provider: "dalle"
    api_key_env: "IMAGE_API_KEY"
    base_url: "https://api.openai.com/v1"
    model: "dall-e-3"
`;
}

// ============================================
// 运行主函数
// ============================================
main().catch((error) => {
  console.error('❌ 错误:', error.message);
  process.exit(1);
});

