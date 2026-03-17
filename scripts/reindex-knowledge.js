#!/usr/bin/env node

const fs = require('fs');
const { parseArgs } = require('./lib/parse-args');
const { buildArticleIndex, saveArticleIndex } = require('./lib/article-index');
const { loadProjects } = require('./lib/project-manager');
const { ensureVaultStructure } = require('./lib/topic-manager');

function resolveProject(projectId) {
  const config = loadProjects();
  const resolvedId = projectId || config.current_project;
  if (!resolvedId || !config.projects[resolvedId]) {
    throw new Error(`Project not found: ${resolvedId || '(none)'}`);
  }

  return {
    projectId: resolvedId,
    project: config.projects[resolvedId],
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const { projectId, project } = resolveProject(args.project);

  if (!project.vault_path) {
    throw new Error(`Project "${projectId}" does not define vault_path`);
  }

  if (!fs.existsSync(project.vault_path)) {
    throw new Error(`Vault path does not exist: ${project.vault_path}`);
  }

  if (args['ensure-structure']) {
    const created = ensureVaultStructure(project.vault_path);
    if (created.length > 0) {
      console.log(`Created ${created.length} vault director${created.length === 1 ? 'y' : 'ies'}:`);
      created.forEach((item) => console.log(`  - ${item}`));
      console.log('');
    }
  }

  const index = buildArticleIndex(project.vault_path, projectId);
  const indexPath = saveArticleIndex(index);

  console.log(`Project: ${projectId}`);
  console.log(`Vault: ${project.vault_path}`);
  console.log(`Topics: ${index.stats.topic_count}`);
  console.log(`Drafts: ${index.stats.draft_count}`);
  console.log(`Published: ${index.stats.published_count}`);
  console.log(`Index: ${indexPath}`);
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}`);
  process.exit(1);
});
