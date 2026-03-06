#!/usr/bin/env node

/**
 * Quality Check Script
 *
 * Usage: node quality-check.js <article-draft.md>
 *
 * Checks article against quality-standards.yaml and outputs:
 * - Hard metrics score
 * - List of issues found
 * - Suggestions for improvement
 */

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node quality-check.js <article-file.md>');
  process.exit(1);
}

const articlePath = process.argv[2];

if (!fs.existsSync(articlePath)) {
  console.error(`Error: File not found: ${articlePath}`);
  process.exit(1);
}

const content = fs.readFileSync(articlePath, 'utf-8');

console.log('🔍 Quality Check Report (SOP Compliance)');
console.log('='.repeat(50));
console.log('');

// Hard Metrics Checks
console.log('📊 Hard Metrics:');
console.log('');

let issuesFound = 0;
const warnings = [];

// 1. Check for forbidden words (Chinese)
const forbiddenWords = [
  '本文', '值得注意', '不难发现', '综上所述', '不言而喻',
  '揭示了', '佐证了', '让我们', '接下来', '此外',
  '至关重要', '深入探讨', '颠覆性', '革命性', '赋能'
];

forbiddenWords.forEach(word => {
  const regex = new RegExp(word, 'g');
  const matches = content.match(regex);
  if (matches) {
    console.log(`  ❌ Found "${word}": ${matches.length} occurrence(s)`);
    issuesFound += matches.length;
  }
});

// 2. Check for forbidden AI patterns (English)
const forbiddenPatterns = [
  { pattern: /In today's era/gi, name: "In today's era" },
  { pattern: /As AI develops/gi, name: "As AI develops" },
  { pattern: /In recent years/gi, name: "In recent years" },
  { pattern: /Let's explore/gi, name: "Let's explore" },
  { pattern: /We will discuss/gi, name: "We will discuss" },
  { pattern: /In conclusion/gi, name: "In conclusion" },
  { pattern: /To sum up/gi, name: "To sum up" },
  { pattern: /First,.*Second,.*Finally/gis, name: "First/Second/Finally pattern" }
];

forbiddenPatterns.forEach(({ pattern, name }) => {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`  ❌ Found "${name}": ${matches.length} occurrence(s)`);
    issuesFound += matches.length;
  }
});

// 3. Check punctuation
const emDashCount = (content.match(/——/g) || []).length;
const boldCount = (content.match(/\*\*/g) || []).length / 2;
const exclamationCount = (content.match(/!/g) || []).length;

if (emDashCount > 3) {
  console.log(`  ❌ Em dash (——): ${emDashCount} (limit: 3)`);
  issuesFound++;
} else {
  console.log(`  ✅ Em dash (——): ${emDashCount} (limit: 3)`);
}

if (boldCount > 3) {
  console.log(`  ❌ Bold (**): ${boldCount} (limit: 3)`);
  issuesFound++;
} else {
  console.log(`  ✅ Bold (**): ${boldCount} (limit: 3)`);
}

if (exclamationCount > 2) {
  console.log(`  ⚠️  Exclamation (!): ${exclamationCount} (limit: 2)`);
  warnings.push(`Too many exclamation marks: ${exclamationCount}`);
}

// 4. Check keyword in title (extract from first H1)
const h1Match = content.match(/^#\s+(.+)$/m);
if (h1Match) {
  const title = h1Match[1];
  console.log(`  ℹ️  Title: "${title}"`);
} else {
  console.log(`  ⚠️  No H1 title found`);
  warnings.push('Missing H1 title');
}

// 5. Check for data sources
const sourcePattern = /\(Source:\s*[^,)]+,\s*\d{4}\)/gi;
const sources = content.match(sourcePattern) || [];
console.log(`  ℹ️  Data sources cited: ${sources.length}`);
if (sources.length === 0) {
  warnings.push('No data sources cited (Source: Name, Year)');
}

// 6. Check for [DATA: ...] placeholders
const dataPlaceholders = content.match(/\[DATA:[^\]]+\]/g) || [];
if (dataPlaceholders.length > 0) {
  console.log(`  ⚠️  Data placeholders: ${dataPlaceholders.length} (need manual fill)`);
  warnings.push(`${dataPlaceholders.length} [DATA: ...] placeholders need filling`);
}

// 7. Check for tables (comparison content should have tables)
const tableCount = (content.match(/^\|.+\|$/gm) || []).length;
if (tableCount > 0) {
  console.log(`  ✅ Tables found: ${Math.floor(tableCount / 3)} table(s)`);
} else {
  console.log(`  ⚠️  No tables found (use tables for comparisons)`);
  warnings.push('No tables found - consider adding comparison tables');
}

// 8. Check for images
const imageCount = (content.match(/<!--\s*IMAGE:/g) || []).length;
console.log(`  ℹ️  Image placeholders: ${imageCount}`);

// 9. Word count
const words = content.split(/\s+/).filter(w => w.length > 0).length;
const charCount = content.length;
console.log(`  ℹ️  Word count: ${words} words`);
console.log(`  ℹ️  Character count: ${charCount}`);

// 10. Check intro has keyword in bold
const introSection = content.split(/^##\s/m)[0]; // Before first H2
const boldInIntro = (introSection.match(/\*\*[^*]+\*\*/g) || []).length;
if (boldInIntro === 0) {
  warnings.push('Intro should have keyword in bold');
}

// 11. Check FAQ section
if (content.includes('## Frequently Asked Questions') || content.includes('## FAQ')) {
  console.log(`  ✅ FAQ section found`);
} else {
  console.log(`  ⚠️  No FAQ section found`);
  warnings.push('Missing FAQ section');
}

console.log('');
console.log('='.repeat(50));

if (issuesFound === 0 && warnings.length === 0) {
  console.log('✅ All checks passed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Fill [DATA: ...] placeholders with real data');
  console.log('2. Add images for <!-- IMAGE: --> markers');
  console.log('3. Verify all sources are accurate');
  console.log('4. Check internal/external links');
  process.exit(0);
} else if (issuesFound > 0) {
  console.log(`❌ Found ${issuesFound} CRITICAL issue(s) that MUST be fixed.`);
  console.log('');
  console.log('Please fix these issues before publishing.');
  process.exit(1);
} else {
  console.log(`✅ No critical issues found.`);
  if (warnings.length > 0) {
    console.log('');
    console.log('⚠️  Warnings (recommended to fix):');
    warnings.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w}`);
    });
  }
  console.log('');
  console.log('Next steps:');
  console.log('1. Review warnings above');
  console.log('2. Fill [DATA: ...] placeholders');
  console.log('3. Add images for <!-- IMAGE: --> markers');
  process.exit(0);
}

console.log('');
