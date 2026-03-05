#!/usr/bin/env node

/**
 * SEOMaster - 项目初始化脚本
 *
 * 功能：从知识库文件夹中提取产品信息，自动生成 project-config.yaml
 *
 * 使用方法：
 *   node scripts/init-project.js --input <knowledge-base-folder> [--out <output-file>]
 *
 * 示例：
 *   node scripts/init-project.js --input ./raw-docs
 *   node scripts/init-project.js --input ./raw-docs --out ./project-config.yaml
 *
 * 知识库文件夹应包含：
 *   - 产品文档（.md / .txt）
 *   - 竞品分析（.md / .txt）
 *   - 价格/功能表（.yaml / .json）
 *   - 任何能帮助 AI 理解产品的原始资料
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const yaml = require('js-yaml');
const config = require('./lib/config');

const SEOMASTER_ROOT = path.join(__dirname, '..');
const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.yaml', '.yml', '.json'];
const MAX_CONTENT_CHARS = 30000; // AI 输入上限

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] || true;
      i++;
    }
  }
  return args;
}

function resolvePath(p) {
  if (path.isAbsolute(p)) return p;
  return path.resolve(process.cwd(), p);
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.input) {
    console.log('用法: node scripts/init-project.js --input <knowledge-base-folder> [--out <output-file>]');
    console.log('');
    console.log('示例:');
    console.log('  node scripts/init-project.js --input ./raw-docs');
    console.log('  node scripts/init-project.js --input ./raw-docs --out ./project-config.yaml');
    console.log('');
    console.log('知识库文件夹应包含产品文档、竞品分析、价格表等原始资料。');
    process.exit(1);
  }

  const inputFolder = resolvePath(args.input);
  const outputFile = args.out
    ? resolvePath(args.out)
    : path.join(SEOMASTER_ROOT, 'project-config.yaml');

  if (!fs.existsSync(inputFolder)) {
    console.error(`❌ 知识库文件夹不存在: ${inputFolder}`);
    process.exit(1);
  }

  console.log('\n🚀 SEOMaster 项目初始化\n');
  console.log(`  📂 知识库: ${inputFolder}`);
  console.log(`  📄 输出:   ${outputFile}\n`);

  // 1. 读取知识库文档
  console.log('[1/3] 读取知识库文档...');
  const documents = readDocuments(inputFolder);
  if (documents.length === 0) {
    console.error(`❌ 知识库中没有找到支持的文件 (${SUPPORTED_EXTENSIONS.join(', ')})`);
    process.exit(1);
  }
  console.log(`  ✓ 找到 ${documents.length} 个文档\n`);
  documents.forEach((d) => console.log(`    - ${d.name} (${d.size} bytes)`));
  console.log('');

  // 2. AI 分析文档
  console.log('[2/3] AI 分析知识库内容...');
  const analysis = await analyzeDocuments(documents);
  console.log(`  ✓ 分析完成: ${analysis.project?.name || 'Unknown'}\n`);

  // 3. 生成配置文件
  console.log('[3/3] 生成 project-config.yaml...');
  const configYaml = buildConfigYaml(analysis);
  fs.writeFileSync(outputFile, configYaml, 'utf-8');
  console.log(`  ✓ 已写入: ${outputFile}\n`);

  // 输出摘要
  console.log('─'.repeat(60));
  console.log('✅ 项目初始化完成!\n');
  console.log(`📋 下一步:`);
  console.log(`   1. 检查并完善 ${outputFile} 中的 TODO 项`);
  console.log(`   2. 确认 .env 中的 API 配置`);
  console.log(`   3. 运行: node scripts/generate-concept.js --keyword "your keyword" --slug your-slug`);
  console.log('─'.repeat(60) + '\n');
}

// ============================================
// 读取知识库文档
// ============================================
function readDocuments(folderPath) {
  const documents = [];

  function readDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        readDir(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          documents.push({
            path: filePath,
            name: path.relative(folderPath, filePath),
            content,
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
// AI 分析文档
// ============================================
async function analyzeDocuments(documents) {
  // 合并文档，截断到上限
  let combined = documents
    .map((doc) => `=== ${doc.name} ===\n${doc.content}`)
    .join('\n\n');

  if (combined.length > MAX_CONTENT_CHARS) {
    combined = combined.slice(0, MAX_CONTENT_CHARS) + '\n\n[... 内容已截断 ...]';
  }

  const prompt = `你是一个专业的内容营销顾问。请分析以下知识库文档，提取关键信息用于生成 SEO 内容营销配置。

知识库内容：
${combined}

请以 JSON 格式返回以下信息（只返回 JSON，不要其他解释）：

{
  "project": {
    "name": "产品名称",
    "tagline": "一句话产品定位",
    "website": "官网地址（如果文档中有）",
    "industry": "行业分类（SaaS/Developer Tools/AI/E-commerce/FinTech 等）"
  },
  "value_proposition": {
    "product": "产品名称",
    "audience": "目标用户群体",
    "action": "核心动作（用户用产品做什么）",
    "result": "量化结果（用户获得什么）"
  },
  "audience": {
    "primary": {
      "title": "主要受众",
      "pain_points": ["痛点1", "痛点2", "痛点3"],
      "goals": ["目标1", "目标2"]
    },
    "secondary": {
      "title": "次要受众",
      "pain_points": ["痛点1"],
      "goals": ["目标1"]
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
    "tone": "品牌语气（如：技术老手的实话实说）",
    "style": "写作风格（如：数据驱动，不吹不黑）"
  },
  "seo_keywords": {
    "primary": ["核心关键词1", "核心关键词2"],
    "secondary": ["次级关键词1", "次级关键词2"],
    "long_tail": ["长尾关键词1"]
  }
}

注意：
1. 只返回 JSON，不要 markdown 代码块
2. 如果某些信息缺失，用合理的推测填充，并在值中标注 "TODO: 待确认"
3. 确保所有字段都有值`;

  const res = await fetch(`${config.aiBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.aiApiKey()}`,
    },
    body: JSON.stringify({
      model: config.aiModel(),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (!data.choices?.length) {
    throw new Error(`AI returned no choices`);
  }

  const content = data.choices[0].message.content.trim();

  // 提取 JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('无法从 AI 响应中提取 JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

// ============================================
// 生成 YAML 配置
// ============================================
function buildConfigYaml(analysis) {
  const today = new Date().toISOString().split('T')[0];
  const p = analysis.project || {};
  const vp = analysis.value_proposition || {};
  const aud = analysis.audience || {};
  const voice = analysis.voice || {};
  const keywords = analysis.seo_keywords || {};

  const configObj = {
    // 项目基本信息
    project: {
      name: p.name || 'TODO: 产品名称',
      tagline: p.tagline || 'TODO: 一句话产品定位',
      website: p.website || 'TODO: https://yourproduct.com',
      industry: p.industry || 'SaaS',
      initialized_at: today,
    },

    // 品牌声音
    voice: {
      tone: voice.tone || '技术老手的实话实说',
      style: voice.style || '数据驱动，不吹不黑',
      principles: [
        '用数据说话，每个判断都有证据支撑',
        '用开发者能理解的语言，避免营销腔',
        '以「读者会不会觉得这是广告」为标尺',
        '承认产品限制，不做完美承诺',
      ],
    },

    // 核心价值主张
    value_proposition: {
      template: '{product} 让 {audience} {action}，{result}',
      product: vp.product || p.name || 'TODO',
      audience: vp.audience || 'TODO: 目标用户',
      action: vp.action || 'TODO: 核心动作',
      result: vp.result || 'TODO: 量化结果',
      full: `${vp.product || p.name || 'TODO'} 让 ${vp.audience || 'TODO'} ${vp.action || 'TODO'}，${vp.result || 'TODO'}`,
    },

    // 目标读者
    audience: {
      primary: {
        title: aud.primary?.title || 'TODO: 主要受众',
        pain_points: aud.primary?.pain_points || ['TODO: 痛点1'],
        goals: aud.primary?.goals || ['TODO: 目标1'],
      },
      secondary: {
        title: aud.secondary?.title || 'TODO: 次要受众',
        pain_points: aud.secondary?.pain_points || ['TODO: 痛点1'],
        goals: aud.secondary?.goals || ['TODO: 目标1'],
      },
    },

    // 竞品信息
    competitors: (analysis.competitors || []).map((c) => ({
      name: c.name,
      website: 'TODO: 补充网址',
      strengths: c.strengths || [],
      weaknesses: c.weaknesses || [],
      pricing: 'TODO: 补充价格',
    })),

    // 核心数据点
    key_metrics: (analysis.key_metrics || []).map((m) => ({
      metric: m.metric,
      value: m.value,
      source: m.source,
      source_url: 'TODO: 补充来源链接',
      verified: false,
      date: today,
    })),

    // SEO 关键词库
    seo_keywords: {
      primary: (keywords.primary || ['TODO: 核心关键词']).map((k) => ({
        keyword: k,
        search_volume: 0,
        difficulty: 0,
        priority: 'P0',
      })),
      secondary: (keywords.secondary || ['TODO: 次级关键词']).map((k) => ({
        keyword: k,
        search_volume: 0,
        difficulty: 0,
        priority: 'P1',
      })),
      long_tail: (keywords.long_tail || ['TODO: 长尾关键词']).map((k) => ({
        keyword: k,
        search_volume: 0,
        difficulty: 0,
        priority: 'P2',
      })),
    },

    // CTA 模板
    cta: {
      default: {
        text: `立即注册 ${p.name || 'TODO'}，开始使用`,
        url: `${p.website || 'https://yourproduct.com'}/signup`,
      },
    },

    // 发布渠道
    channels: {
      blog: {
        enabled: true,
        base_url: `${p.website || 'https://yourproduct.com'}/blog`,
      },
    },
  };

  // 用 yaml.dump 生成，比手拼字符串更可靠
  const header = `# SEOMaster 项目配置\n# 由 init-project.js 自动生成于 ${today}\n# 请检查并完善标注 TODO 的项目\n\n`;
  return header + yaml.dump(configObj, { lineWidth: 120, noRefs: true });
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
