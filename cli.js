#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const inquirer = require('inquirer');
const yaml = require('js-yaml');
const { initWorkflow, getProjectDefaults } = require('./scripts/lib/cli-workflow');
const { runAutomatedWorkflow } = require('./scripts/lib/automated-workflow');
const { buildArticleIndex, saveArticleIndex, slugify } = require('./scripts/lib/article-index');
const { detectDuplicates } = require('./scripts/lib/duplicate-detector');
const { createOrUpdateTopicFromInput, ensureVaultStructure } = require('./scripts/lib/topic-manager');
const { loadProjects } = require('./scripts/lib/project-manager');

const VERSION = '1.0.0';

function keywordToSlug(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: __dirname
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script exited with code ${code}`));
    });
  });
}

function previewConcept(conceptFile) {
  try {
    const content = fs.readFileSync(conceptFile, 'utf-8');
    const concept = yaml.load(content);

    console.log(chalk.cyan('\n📋 Concept Preview:\n'));
    console.log(chalk.white(`Title: ${concept.title}`));
    console.log(chalk.gray(`Slug: ${concept.slug}`));

    const targetWords = typeof concept.word_count === 'object'
      ? concept.word_count.target
      : concept.word_count;
    console.log(chalk.gray(`Target: ${targetWords} words\n`));

    console.log(chalk.cyan('Sections:'));
    concept.sections.forEach((section, i) => {
      console.log(chalk.white(`  ${i + 1}. ${section.title} (${section.word_count} words)`));
    });

    console.log(chalk.cyan('\nFAQ:'));
    concept.faq.forEach((q, i) => {
      console.log(chalk.white(`  ${i + 1}. ${q.question}`));
    });

    console.log('');
  } catch (error) {
    console.error(chalk.red('Failed to preview concept:'), error.message);
  }
}

async function confirmConcept(conceptFile, keyword, options) {
  previewConcept(conceptFile);

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: '✓ Continue to draft generation', value: 'continue' },
      { name: '↻ Regenerate concept', value: 'retry' },
      { name: '✎ Edit concept file manually', value: 'edit' },
      { name: '✕ Cancel', value: 'cancel' }
    ]
  }]);

  if (action === 'continue') {
    return true;
  } else if (action === 'retry') {
    console.log(chalk.yellow('\n↻ Regenerating concept...\n'));
    const args = [
      '--keyword', keyword,
      '--intent', options.intent || 'informational',
      '--scene', options.scene || '',
      '--lang', options.lang,
      '--market', options.market,
      '--results', options.results,
      '--words', options.words,
      '--out', options.outputDir
    ];
    if (options.filter === false) {
      args.push('--no-filter');
    }
    await runScript('./scripts/generate-concept.js', args);
    return confirmConcept(conceptFile, keyword, options);
  } else if (action === 'edit') {
    console.log(chalk.cyan(`\n✎ Please edit: ${conceptFile}`));
    console.log(chalk.gray('Press Enter when done...'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: '' }]);
    return confirmConcept(conceptFile, keyword, options);
  } else {
    return false;
  }
}

function printWorkflowSummary(report) {
  console.log(chalk.green('\n✅ Workflow finished\n'));
  console.log(chalk.gray(`  Status: ${report.status}`));
  console.log(chalk.cyan('Files:'));
  console.log(chalk.gray(`  Concept: ${report.files.concept}`));
  console.log(chalk.gray(`  Draft: ${report.files.draft}`));
  if (report.files.vault) {
    console.log(chalk.gray(`  Vault: ${report.files.vault}`));
  }
  if (report.files.index) {
    console.log(chalk.gray(`  Index: ${report.files.index}`));
  }
  console.log(chalk.gray(`  Report: ${report.files.report}`));

  if (report.status === 'needs_review') {
    console.log(chalk.yellow('\n⚠️  Duplicate risk or quality issues require review. See the workflow report for details.\n'));
  } else if (report.status === 'update_ready') {
    console.log(chalk.yellow('\n⚠️  Existing topic detected. Treat this run as an update candidate, not a net-new article.\n'));
  }
}

function workflowSucceeded(report) {
  return report.status === 'completed' || report.status === 'update_ready';
}

function getProjectContext(projectId) {
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

program
  .command('new <keyword>')
  .description('Generate article end-to-end; use -i to confirm the concept manually')
  .option('-p, --project <name>', 'Project name (skip project selection)')
  .option('-l, --lang <lang>', 'Language (en/zh)')
  .option('-m, --market <market>', 'Market (us/cn)')
  .option('-r, --results <number>', 'Search results')
  .option('-w, --words <number>', 'Target word count')
  .option('-o, --out <dir>', 'Output directory override')
  .option('-i, --interactive', 'Interactive mode with confirmations')
  .option('--intent <type>', 'Keyword intent (informational/navigational/commercial/transactional)')
  .option('--scene <scenes>', 'DICloak business scenes, comma-separated')
  .option('--skip-images', 'Skip image generation')
  .option('--skip-import', 'Skip automatic vault import')
  .option('--force-import', 'Import draft into vault even if quality check fails')
  .option('--import-dir <name>', 'Vault subdirectory for automatic import', 'Drafts')
  .option('--no-filter', 'Disable domain filtering for research')
  .action(async (keyword, options) => {
    if (!options.interactive) {
      try {
        const report = await runAutomatedWorkflow(keyword, {
          project: options.project,
          lang: options.lang,
          market: options.market,
          results: options.results,
          words: options.words,
          intent: options.intent,
          scene: options.scene,
          skipImages: options.skipImages,
          skipImport: options.skipImport,
          forceImport: options.forceImport,
          importDir: options.importDir,
          outputDir: options.out,
          filterDomains: options.filter !== false,
        });
        printWorkflowSummary(report);
        if (!workflowSucceeded(report)) {
          process.exit(1);
        }
        return;
      } catch (error) {
        console.error(chalk.red('\n❌ Failed:'), error.message);
        process.exit(1);
      }
    }

    // Initialize workflow with project selection
    const project = await initWorkflow({ project: options.project });
    const defaults = getProjectDefaults(project);

    // Merge options with project defaults
    const lang = options.lang || defaults.lang;
    const market = options.market || defaults.market;
    const results = options.results || defaults.results;
    const words = options.words || defaults.words;
    const intent = options.intent || 'informational';
    const scene = options.scene || '';
    const rawOutputDir = options.out || defaults.outputDir;
    const outputDir = path.isAbsolute(rawOutputDir)
      ? rawOutputDir
      : path.join(__dirname, rawOutputDir);

    console.log(chalk.cyan(`🚀 Generating article: "${keyword}"\n`));
    console.log(chalk.gray(`  Intent: ${intent}`));
    if (scene) console.log(chalk.gray(`  Scenes: ${scene}`));

    try {
      console.log(chalk.cyan('[1/4] Generating concept...\n'));
      const conceptArgs = [
        '--keyword', keyword,
        '--intent', intent,
        '--scene', scene,
        '--lang', lang,
        '--market', market,
        '--results', results.toString(),
        '--words', words.toString(),
        '--out', outputDir
      ];
      if (options.filter === false) {
        conceptArgs.push('--no-filter');
      }
      await runScript('./scripts/generate-concept.js', conceptArgs);

      const slug = keywordToSlug(keyword);
      const conceptFile = path.join(outputDir, `${slug}-concept.yaml`);
      const draftFile = path.join(outputDir, `${slug}-draft.md`);

      // Interactive mode: confirm concept before continuing
      if (options.interactive) {
        const shouldContinue = await confirmConcept(conceptFile, keyword, {
          intent,
          scene,
          lang,
          market,
          results,
          words,
          outputDir,
          filter: options.filter,
        });
        if (!shouldContinue) {
          console.log(chalk.yellow('\n⚠️  Workflow cancelled\n'));
          return;
        }
      }

      console.log(chalk.cyan('\n[2/4] Generating draft...\n'));
      await runScript('./scripts/generate-draft.js', ['--concept', conceptFile, '--out', outputDir]);

      // 自动生成配图（最多3张）
      if (!options.skipImages) {
        console.log(chalk.cyan('\n[3/4] Generating images (max 3)...\n'));
        try {
          await runScript('./scripts/generate-images.js', ['--draft', draftFile]);
        } catch (err) {
          console.log(chalk.yellow('  ⚠️  Image generation failed, continuing...'));
        }
      } else {
        console.log(chalk.gray('\n[3/4] Skipping image generation\n'));
      }

      // 质量检查
      console.log(chalk.cyan('\n[4/4] Quality check...\n'));
      try {
        await runScript('./scripts/quality-check.js', [draftFile]);
      } catch (err) {
        console.log(chalk.yellow('  ⚠️  Quality check found issues'));
      }

      console.log(chalk.green('\n✅ Done!\n'));
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.gray('  1. Review draft: output/' + slug + '-draft.md'));
      console.log(chalk.gray('  2. Fix any quality issues'));
      console.log(chalk.gray('  3. Publish article'));

    } catch (error) {
      console.error(chalk.red('\n❌ Failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('auto <keyword>')
  .description('Run the unattended workflow: concept -> draft -> images -> quality -> vault import')
  .option('-p, --project <name>', 'Project name (skip project selection)')
  .option('-l, --lang <lang>', 'Language (en/zh)')
  .option('-m, --market <market>', 'Market (us/cn)')
  .option('-r, --results <number>', 'Search results')
  .option('-w, --words <number>', 'Target word count')
  .option('-o, --out <dir>', 'Output directory override')
  .option('--intent <type>', 'Keyword intent (informational/navigational/commercial/transactional)')
  .option('--scene <scenes>', 'DICloak business scenes, comma-separated')
  .option('--skip-images', 'Skip image generation')
  .option('--skip-import', 'Skip automatic vault import')
  .option('--force-import', 'Import draft into vault even if quality check fails')
  .option('--import-dir <name>', 'Vault subdirectory for automatic import', 'Drafts')
  .option('--no-filter', 'Disable domain filtering for research')
  .action(async (keyword, options) => {
    try {
      const report = await runAutomatedWorkflow(keyword, {
        project: options.project,
        lang: options.lang,
        market: options.market,
        results: options.results,
        words: options.words,
        intent: options.intent,
        scene: options.scene,
        skipImages: options.skipImages,
        skipImport: options.skipImport,
        forceImport: options.forceImport,
        importDir: options.importDir,
        outputDir: options.out,
        filterDomains: options.filter !== false,
      });
      printWorkflowSummary(report);
      if (!workflowSucceeded(report)) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('concept <keyword>')
  .description('Generate concept only (with preview)')
  .option('-l, --lang <lang>', 'Language', 'en')
  .option('-m, --market <market>', 'Market', 'us')
  .option('-r, --results <number>', 'Results', '10')
  .option('-w, --words <number>', 'Words', '2500')
  .option('--intent <type>', 'Keyword intent (informational/navigational/commercial/transactional)', 'informational')
  .option('--scene <scenes>', 'DICloak business scenes, comma-separated', '')
  .option('--no-preview', 'Skip preview')
  .action(async (keyword, options) => {
    await runScript('./scripts/generate-concept.js', [
      '--keyword', keyword,
      '--intent', options.intent,
      '--scene', options.scene,
      '--lang', options.lang,
      '--market', options.market,
      '--results', options.results,
      '--words', options.words
    ]);

    if (options.preview !== false) {
      const slug = keywordToSlug(keyword);
      const conceptFile = path.join(__dirname, 'output', `${slug}-concept.yaml`);
      previewConcept(conceptFile);

      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.gray(`  1. Review: ${conceptFile}`));
      console.log(chalk.gray(`  2. Generate draft: seomaster draft ${slug}-concept.yaml`));
      console.log(chalk.gray(`  3. Or use interactive mode: seomaster new "${keyword}" -i\n`));
    }
  });

program
  .command('draft <concept-file>')
  .description('Generate draft from concept')
  .action(async (conceptFile) => {
    // Auto-resolve path
    let filePath = conceptFile;
    if (!fs.existsSync(filePath)) {
      const outputPath = path.join(__dirname, 'output', conceptFile);
      if (fs.existsSync(outputPath)) {
        filePath = outputPath;
      } else {
        const withSuffix = path.join(__dirname, 'output', `${conceptFile}-concept.yaml`);
        if (fs.existsSync(withSuffix)) {
          filePath = withSuffix;
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`\n❌ File not found: ${conceptFile}\n`));
      process.exit(1);
    }

    await runScript('./scripts/generate-draft.js', ['--concept', filePath]);
  });

program
  .command('preview <concept-file>')
  .description('Preview concept file')
  .action((conceptFile) => {
    // Auto-resolve path
    let filePath = conceptFile;
    if (!fs.existsSync(filePath)) {
      const outputPath = path.join(__dirname, 'output', conceptFile);
      if (fs.existsSync(outputPath)) {
        filePath = outputPath;
      } else {
        const withSuffix = path.join(__dirname, 'output', `${conceptFile}-concept.yaml`);
        if (fs.existsSync(withSuffix)) {
          filePath = withSuffix;
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`\n❌ File not found: ${conceptFile}\n`));
      process.exit(1);
    }

    previewConcept(filePath);

    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray(`  1. Edit: ${filePath}`));
    console.log(chalk.gray(`  2. Generate draft: seomaster draft ${filePath}\n`));
  });

program
  .command('check <draft-file>')
  .description('Quality check')
  .action(async (draftFile) => {
    // Auto-resolve path: if file doesn't exist, try output/ directory
    let filePath = draftFile;
    if (!fs.existsSync(filePath)) {
      const outputPath = path.join(__dirname, 'output', draftFile);
      if (fs.existsSync(outputPath)) {
        filePath = outputPath;
      } else {
        // Try adding -draft.md suffix
        const withSuffix = path.join(__dirname, 'output', `${draftFile}-draft.md`);
        if (fs.existsSync(withSuffix)) {
          filePath = withSuffix;
        }
      }
    }
    await runScript('./scripts/quality-check.js', [filePath]);
  });

program
  .command('list')
  .description('List all articles')
  .action(() => {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      console.log(chalk.yellow('No articles found'));
      return;
    }
    
    const files = fs.readdirSync(outputDir);
    const articles = {};
    
    files.forEach(file => {
      if (file.endsWith('-concept.yaml')) {
        const slug = file.replace('-concept.yaml', '');
        articles[slug] = articles[slug] || {};
        articles[slug].concept = true;
      } else if (file.endsWith('-draft.md')) {
        const slug = file.replace('-draft.md', '');
        articles[slug] = articles[slug] || {};
        articles[slug].draft = true;
      }
    });
    
    console.log(chalk.cyan('\n📄 Articles:\n'));
    
    Object.entries(articles).forEach(([slug, status]) => {
      const marker = (status.concept && status.draft) ? chalk.green('✓') : chalk.yellow('○');
      console.log(`${marker} ${slug}`);
      if (status.concept) console.log(chalk.gray('   ├─ concept.yaml'));
      if (status.draft) console.log(chalk.gray('   └─ draft.md'));
      console.log('');
    });
  });

program
  .command('images <draft-file>')
  .description('Generate images for draft (max 3 per article)')
  .action(async (draftFile) => {
    // Auto-resolve path
    let filePath = draftFile;
    if (!fs.existsSync(filePath)) {
      const outputPath = path.join(__dirname, 'output', draftFile);
      if (fs.existsSync(outputPath)) {
        filePath = outputPath;
      } else {
        const withSuffix = path.join(__dirname, 'output', `${draftFile}-draft.md`);
        if (fs.existsSync(withSuffix)) {
          filePath = withSuffix;
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`\n❌ File not found: ${draftFile}\n`));
      process.exit(1);
    }

    console.log(chalk.cyan(`\n🎨 Generating images for: ${filePath}\n`));

    try {
      await runScript('./scripts/generate-images.js', ['--draft', filePath]);
      console.log(chalk.green('\n✅ Images generated!\n'));
    } catch (error) {
      console.error(chalk.red('\n❌ Failed:'), error.message);
      process.exit(1);
    }
  });

program
  .name('seomaster')
  .version(VERSION)
  .description('AI-driven SEO content workflow');

// Project management commands
program
  .command('project')
  .description('Manage projects')
  .action(async () => {
    const { selectProject } = require('./scripts/lib/project-manager');
    await selectProject();
    console.log(chalk.green('\n✅ Project selected\n'));
  });

program
  .command('project:list')
  .description('List all projects')
  .action(() => {
    const { listProjects } = require('./scripts/lib/project-manager');
    const projects = listProjects();

    console.log(chalk.cyan('\n📁 Projects:\n'));
    projects.forEach(p => {
      const marker = p.current ? chalk.green('●') : chalk.gray('○');
      console.log(`${marker} ${chalk.white(p.name)} (${p.id})`);
      console.log(chalk.gray(`  ${p.description}`));
      console.log(chalk.gray(`  Vault: ${p.vault_path}\n`));
    });
  });

program
  .command('project:add')
  .description('Add a new project')
  .action(async () => {
    const { createNewProject } = require('./scripts/lib/project-manager');
    await createNewProject();
  });

program
  .command('vault:import <draft-file>')
  .description('Import article to Obsidian vault')
  .option('--dir <name>', 'Vault subdirectory', 'Drafts')
  .action(async (draftFile, options) => {
    await runScript('./scripts/import-to-vault.js', [
      '--draft', draftFile,
      '--dir', options.dir
    ]);
  });

program
  .command('kb:reindex')
  .description('Rebuild the local article/topic index for the current project vault')
  .option('-p, --project <name>', 'Project name')
  .option('--ensure-structure', 'Create standard vault directories if missing')
  .action(async (options) => {
    try {
      const args = [];
      if (options.project) {
        args.push('--project', options.project);
      }
      if (options.ensureStructure) {
        args.push('--ensure-structure');
      }
      await runScript('./scripts/reindex-knowledge.js', args);
    } catch (error) {
      console.error(chalk.red('\n❌ Failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('topics:list')
  .description('List topic cards for the current project')
  .option('-p, --project <name>', 'Project name')
  .action((options) => {
    try {
      const { projectId, project } = getProjectContext(options.project);
      const index = buildArticleIndex(project.vault_path, projectId);
      saveArticleIndex(index);

      console.log(chalk.cyan('\nTopics\n'));
      if (index.topics.length === 0) {
        console.log(chalk.yellow('No topics found.\n'));
        return;
      }

      index.topics.forEach((topic) => {
        console.log(chalk.white(`- ${topic.topic_key}`));
        console.log(chalk.gray(`  keyword: ${topic.canonical_keyword || '(none)'}`));
        console.log(chalk.gray(`  status: ${topic.status}`));
        console.log(chalk.gray(`  file: ${topic.relative_path}`));
      });
      console.log('');
    } catch (error) {
      console.error(chalk.red('\n❌ Failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('topics:check <keyword>')
  .description('Check whether a keyword should create a new article, update an existing topic, or be blocked')
  .option('-p, --project <name>', 'Project name')
  .option('--slug <slug>', 'Slug override')
  .action((keyword, options) => {
    try {
      const { projectId, project } = getProjectContext(options.project);
      const index = buildArticleIndex(project.vault_path, projectId);
      const duplicate = detectDuplicates({
        keyword,
        slug: options.slug || slugify(keyword),
        title: keyword,
        topic_key: slugify(keyword),
      }, index);

      saveArticleIndex(index);

      console.log(chalk.cyan('\nTopic Check\n'));
      console.log(chalk.gray(`  Project: ${projectId}`));
      console.log(chalk.gray(`  Vault: ${project.vault_path}`));
      console.log(chalk.white(`  Topic key: ${duplicate.topic_key}`));
      console.log(chalk.white(`  Decision: ${duplicate.decision}`));
      if (duplicate.reasons.length > 0) {
        console.log(chalk.cyan('\nReasons:'));
        duplicate.reasons.forEach((reason) => console.log(chalk.gray(`  - ${reason}`)));
      }
      if (duplicate.matched_topic) {
        console.log(chalk.cyan('\nMatched Topic:'));
        console.log(chalk.gray(`  ${duplicate.matched_topic.topic_key}`));
      }
      if (duplicate.similar_articles.length > 0) {
        console.log(chalk.cyan('\nSimilar Articles:'));
        duplicate.similar_articles.forEach((item) => {
          console.log(chalk.gray(`  - ${item.relative_path}`));
        });
      }
      console.log('');
    } catch (error) {
      console.error(chalk.red('\n❌ Failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('topics:create <keyword>')
  .description('Create a topic card in the current project vault')
  .option('-p, --project <name>', 'Project name')
  .option('--intent <type>', 'Keyword intent', 'informational')
  .option('--cluster <name>', 'Topic cluster', '')
  .action((keyword, options) => {
    try {
      const { projectId, project } = getProjectContext(options.project);
      ensureVaultStructure(project.vault_path);
      const result = createOrUpdateTopicFromInput(project.vault_path, projectId, {
        keyword,
        intent: options.intent,
        cluster: options.cluster,
      });

      console.log(chalk.green('\n✅ Topic ready\n'));
      console.log(chalk.gray(`  Topic key: ${result.topicKey}`));
      console.log(chalk.gray(`  File: ${result.topicPath}`));
      console.log(chalk.gray(`  Index: ${result.indexPath}\n`));
    } catch (error) {
      console.error(chalk.red('\n❌ Failed:'), error.message);
      process.exit(1);
    }
  });

// 如果没有提供任何命令，启动交互式菜单
if (!process.argv.slice(2).length) {
  const interactiveProcess = spawn('node', [path.join(__dirname, 'interactive.js')], {
    stdio: 'inherit',
  });
  interactiveProcess.on('exit', (code) => process.exit(code));
} else {
  program.parse(process.argv);
}
