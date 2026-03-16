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
const { listKnowledgeFiles } = require('./lib/knowledge');
const { parseArgs } = require('./lib/parse-args');

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

  const SEOMASTER_ROOT = path.join(__dirname, '..');
  const outputDir = args.out
    ? resolvePath(args.out)
    : path.join(SEOMASTER_ROOT, 'output');

  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n✍️  SEOMaster: Generating draft from concept\n`);
  console.log(`  concept: ${conceptPath}`);
  console.log(`  output:  ${outputDir}`);

  // 显示知识库状态
  const knowledgeFiles = listKnowledgeFiles();
  if (knowledgeFiles.length > 0) {
    console.log(`  📚 knowledge: ${knowledgeFiles.length} files (${knowledgeFiles.join(', ')})`);
  } else {
    console.log(`  ⚠️  knowledge: empty (add files to knowledge/ for better accuracy)`);
  }
  console.log('');

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

  // Step 2: 并发生成所有 section（共享同一个 intro tail 作为上下文）
  const sections = concept.sections || [];
  console.log(`[2-${sections.length + 1}/${sections.length + 3}] Writing ${sections.length} sections in parallel...`);
  const introTail = getTail(fullText);
  const sectionResults = await Promise.all(
    sections.map((section, i) =>
      generateSection(section, concept, forbiddenWords, aiPatterns, voice, introTail)
        .then((text) => {
          const wc = countWords(text);
          const target = section.word_count || 0;
          const warn = target && wc > target * 1.3 ? ` ⚠️  (target: ${target})` : '';
          console.log(`  ✓ [${i + 1}/${sections.length}] "${section.title}" — ${wc} words${warn}`);
          return text;
        })
    )
  );
  for (const sectionText of sectionResults) {
    parts.push(sectionText);
    fullText += '\n\n' + sectionText;
  }
  console.log('');

  // Step 3: FAQ
  console.log(`[3/4] Writing FAQ...`);
  const faq = await generateFAQ(concept, forbiddenWords, aiPatterns, voice, getTail(fullText));
  parts.push(faq);
  fullText += '\n\n' + faq;
  console.log(`  ✓ FAQ (${countWords(faq)} words)\n`);

  // Step 4: CTA
  console.log(`[4/4] Writing CTA...`);
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
  console.log(`   2. Review image positions (<!-- IMAGE: ... -->)`);
  console.log(`   3. Import to vault or continue the automated workflow`);
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
