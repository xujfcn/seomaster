#!/usr/bin/env node

/**
 * Generate Article Draft from Concept
 *
 * Usage:
 *   node scripts/generate-draft.js --concept articles/blog/my-concept.yaml [options]
 *
 * Options:
 *   --concept   concept.yaml 路径（必填，相对于 seomaster 父目录或绝对路径）
 *   --out       输出目录（默认与 concept 文件同目录）
 */

const path = require('path');
const fs = require('fs');
const { loadDraftConfig } = require('./lib/draft-config');
const { generateIntro, generateSection, generateFAQ, generateCTA, getTail, postProcessDraft } = require('./lib/draft-generator');

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
  // 相对于当前工作目录解析（从哪里运行就相对于哪里）
  return path.resolve(process.cwd(), p);
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.concept) {
    console.error('Usage: node scripts/generate-draft.js --concept path/to/concept.yaml');
    process.exit(1);
  }

  const conceptPath = resolvePath(args.concept);
  if (!fs.existsSync(conceptPath)) {
    console.error(`❌ Concept file not found: ${conceptPath}`);
    process.exit(1);
  }

  const outputDir = args.out
    ? resolvePath(args.out)
    : path.dirname(conceptPath);

  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n✍️  SEOMaster: Generating draft from concept\n`);
  console.log(`  concept: ${conceptPath}`);
  console.log(`  output:  ${outputDir}\n`);

  // 加载配置
  const { concept, forbiddenWords, voice, aiPatterns } = loadDraftConfig(conceptPath);
  const slug = concept.slug || path.basename(conceptPath, '-concept.yaml');

  console.log(`  title:   ${concept.title}`);
  console.log(`  sections: ${concept.sections?.length || 0}\n`);

  const parts = [];
  let fullText = '';

  // Step 1: Intro
  console.log(`[1/${(concept.sections?.length || 0) + 3}] Writing intro...`);
  const intro = await generateIntro(concept, forbiddenWords, aiPatterns, voice);
  parts.push(`# ${concept.title}\n\n${intro}`);
  fullText += intro;
  console.log(`  ✓ intro (${countWords(intro)} words)\n`);

  // Step 2: 逐 section 生成
  const sections = concept.sections || [];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    console.log(`[${i + 2}/${sections.length + 3}] Writing section: "${section.title}"...`);
    const sectionText = await generateSection(
      section, concept, forbiddenWords, aiPatterns, voice, getTail(fullText)
    );
    parts.push(sectionText);
    fullText += '\n\n' + sectionText;
    const wc = countWords(sectionText);
    const target = section.word_count || 0;
    const warn = target && wc > target * 1.3 ? ` ⚠️  (target: ${target})` : '';
    console.log(`  ✓ ${wc} words${warn}\n`);
  }

  // Step 3: FAQ
  console.log(`[${sections.length + 2}/${sections.length + 3}] Writing FAQ...`);
  const faq = await generateFAQ(concept, forbiddenWords, aiPatterns, voice, getTail(fullText));
  parts.push(faq);
  fullText += '\n\n' + faq;
  console.log(`  ✓ FAQ (${countWords(faq)} words)\n`);

  // Step 4: CTA
  console.log(`[${sections.length + 3}/${sections.length + 3}] Writing CTA...`);
  const cta = await generateCTA(concept, getTail(fullText));
  parts.push('\n---\n\n' + cta);
  fullText += '\n\n' + cta;
  console.log(`  ✓ CTA\n`);

  // 组装输出，后处理：去除禁用词 + 超限 bold
  const draft = postProcessDraft(parts.join('\n\n'), forbiddenWords);
  const totalWords = countWords(draft);
  const draftPath = path.join(outputDir, `${slug}-draft.md`);
  fs.writeFileSync(draftPath, draft, 'utf-8');

  // 输出摘要
  console.log('─'.repeat(60));
  console.log(`✅ Draft generated!\n`);
  console.log(`📄 File: ${draftPath}`);
  console.log(`📊 Total words: ${totalWords}${totalWords > 15000 ? ' ⚠️  exceeds 15000 limit' : ''}\n`);
  console.log(`📋 Next steps:`);
  console.log(`   1. Run quality check: node scripts/quality-check.js ${draftPath}`);
  console.log(`   2. Fill in [DATA: ...] placeholders with real data`);
  console.log(`   3. Review image positions (<!-- IMAGE: ... -->)`);
  console.log(`   4. Fill in thesis and CTA in concept.yaml`);
  console.log('─'.repeat(60) + '\n');
}

function countWords(text) {
  // 中英文混合字数统计：英文按空格分词，中文按字符计
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
