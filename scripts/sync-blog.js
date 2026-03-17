#!/usr/bin/env node

const { parseArgs } = require('./lib/parse-args');
const { syncBlogs } = require('./lib/blog-sync');

async function main() {
  const args = parseArgs(process.argv);
  const mode = args._[0];

  if (!mode || !['full', 'incremental', 'repair', 'export-obsidian'].includes(mode)) {
    console.error('Usage: node scripts/sync-blog.js <full|incremental|repair|export-obsidian> [--project <name>]');
    process.exit(1);
  }

  const result = await syncBlogs(mode, {
    project: args.project,
  });

  console.log(`Mode: ${result.mode}`);
  console.log(`Mirrored: ${result.mirrored}`);
  console.log(`Indexed: ${result.indexed}`);
  console.log(`Exported: ${result.exported}`);
  if (result.lastRemoteUpdatedAt) {
    console.log(`Last remote updated_at: ${result.lastRemoteUpdatedAt}`);
  }
  if (result.indexPath) {
    console.log(`Index: ${result.indexPath}`);
  }
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}`);
  process.exit(1);
});
