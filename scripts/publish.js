#!/usr/bin/env node

const { parseArgs } = require('./lib/parse-args');
const { publishArticle } = require('./lib/publish-manager');

async function main() {
  const args = parseArgs(process.argv);
  const input = args._[0];

  if (!input) {
    console.error('Usage: node scripts/publish.js <draft-or-article> [--project <name>] [--skip-sync]');
    process.exit(1);
  }

  const result = await publishArticle(input, {
    project: args.project,
    target: args.target,
    baseUrl: args['base-url'],
    blogBaseUrl: args['blog-base-url'],
    token: args.token,
    userId: args['user-id'],
    skipSync: args['skip-sync'] === true,
  });

  console.log(`Job: ${result.job_id}`);
  console.log(`Article: ${result.article_id}`);
  console.log(`CMS Post ID: ${result.cms_post_id}`);
  console.log(`Published URL: ${result.published_url}`);
  console.log(`Published At: ${result.published_at}`);
  console.log(`Published File: ${result.published_path}`);
  if (result.sync?.error) {
    console.log(`Sync Backfill: failed (${result.sync.error})`);
  } else if (result.sync) {
    console.log(`Sync Backfill: mirrored ${result.sync.mirrored}, exported ${result.sync.exported}`);
  }
  console.log(`Index: ${result.index_path}`);
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}`);
  process.exit(1);
});
