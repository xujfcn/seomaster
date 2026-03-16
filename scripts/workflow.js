#!/usr/bin/env node

const { parseArgs } = require('./lib/parse-args');
const { runAutomatedWorkflow } = require('./lib/automated-workflow');

async function main() {
  const args = parseArgs(process.argv);
  const keyword = args.keyword || args.topic;

  if (!keyword) {
    console.error('Usage: node scripts/workflow.js --keyword "your keyword"');
    console.error('');
    console.error('Options:');
    console.error('  --project <name>      Project ID');
    console.error('  --lang <en|zh>        Article language');
    console.error('  --market <us|cn>      Search market');
    console.error('  --words <number>      Target word count');
    console.error('  --results <number>    Search result count');
    console.error('  --intent <type>       Search intent');
    console.error('  --scene <items>       Business scenes, comma-separated');
    console.error('  --skip-images         Skip image generation');
    console.error('  --skip-import         Skip vault import');
    console.error('  --force-import        Import even if quality check fails');
    console.error('  --no-filter           Disable blog-only filtering');
    process.exit(1);
  }

  const report = await runAutomatedWorkflow(keyword, {
    project: args.project,
    lang: args.lang,
    market: args.market,
    words: args.words,
    results: args.results,
    intent: args.intent,
    scene: args.scene,
    skipImages: !!args['skip-images'],
    skipImport: !!args['skip-import'],
    forceImport: !!args['force-import'],
    filterDomains: !args['no-filter'],
    importDir: args['import-dir'],
    outputDir: args.out,
  });

  console.log('\n✅ Workflow finished\n');
  console.log(`  Status: ${report.status}`);
  console.log(`  Concept: ${report.files.concept}`);
  console.log(`  Draft: ${report.files.draft}`);
  if (report.files.vault) {
    console.log(`  Vault: ${report.files.vault}`);
  }
  console.log(`  Report: ${report.files.report}\n`);

  if (report.status !== 'completed') {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n❌ Workflow failed:', err.message);
  process.exit(1);
});
