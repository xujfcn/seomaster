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

console.log('🔍 Quality Check Report');
console.log('='.repeat(50));
console.log('');

// Hard Metrics Checks
console.log('📊 Hard Metrics:');
console.log('');

// Check for forbidden words
const forbiddenWords = [
  '本文', '值得注意', '不难发现', '综上所述', '不言而喻',
  '揭示了', '佐证了', '让我们', '接下来', '此外',
  '至关重要', '深入探讨', '颠覆性', '革命性', '赋能'
];

let issuesFound = 0;

forbiddenWords.forEach(word => {
  const regex = new RegExp(word, 'g');
  const matches = content.match(regex);
  if (matches) {
    console.log(`  ❌ Found "${word}": ${matches.length} occurrence(s)`);
    issuesFound += matches.length;
  }
});

// Check punctuation
const emDashCount = (content.match(/——/g) || []).length;
const boldCount = (content.match(/\*\*/g) || []).length / 2;

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

// Word count
const wordCount = content.length;
console.log(`  ℹ️  Character count: ${wordCount}`);

console.log('');
console.log('='.repeat(50));

if (issuesFound === 0) {
  console.log('✅ All hard metrics passed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Manual review for soft metrics (Thesis clarity, evidence, etc.)');
  console.log('2. Verify all data points are accurate');
  console.log('3. Check code examples are runnable');
} else {
  console.log(`❌ Found ${issuesFound} issue(s) that need to be fixed.`);
  console.log('');
  console.log('Please fix these issues before publishing.');
}

console.log('');
