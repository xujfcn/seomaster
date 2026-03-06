#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const inquirer = require('inquirer');
const yaml = require('js-yaml');

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
    await runScript('./scripts/generate-concept.js', [
      '--keyword', keyword,
      '--lang', options.lang,
      '--market', options.market,
      '--results', options.results,
      '--words', options.words
    ]);
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

program
  .command('new <keyword>')
  .description('Generate concept + draft + images (full workflow)')
  .option('-l, --lang <lang>', 'Language (en/zh)', 'en')
  .option('-m, --market <market>', 'Market (us/cn)', 'us')
  .option('-r, --results <number>', 'Search results', '10')
  .option('-w, --words <number>', 'Target word count', '2500')
  .option('-i, --interactive', 'Interactive mode with confirmations')
  .option('--skip-images', 'Skip image generation')
  .action(async (keyword, options) => {
    console.log(chalk.cyan(`\n🚀 Generating article: "${keyword}"\n`));

    try {
      console.log(chalk.cyan('[1/4] Generating concept...\n'));
      await runScript('./scripts/generate-concept.js', [
        '--keyword', keyword,
        '--lang', options.lang,
        '--market', options.market,
        '--results', options.results,
        '--words', options.words
      ]);

      const slug = keywordToSlug(keyword);
      const conceptFile = path.join(__dirname, 'output', `${slug}-concept.yaml`);
      const draftFile = path.join(__dirname, 'output', `${slug}-draft.md`);

      // Interactive mode: confirm concept before continuing
      if (options.interactive) {
        const shouldContinue = await confirmConcept(conceptFile, keyword, options);
        if (!shouldContinue) {
          console.log(chalk.yellow('\n⚠️  Workflow cancelled\n'));
          return;
        }
      }

      console.log(chalk.cyan('\n[2/4] Generating draft...\n'));
      await runScript('./scripts/generate-draft.js', ['--concept', conceptFile]);

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
  .command('concept <keyword>')
  .description('Generate concept only (with preview)')
  .option('-l, --lang <lang>', 'Language', 'en')
  .option('-m, --market <market>', 'Market', 'us')
  .option('-r, --results <number>', 'Results', '10')
  .option('-w, --words <number>', 'Words', '2500')
  .option('--no-preview', 'Skip preview')
  .action(async (keyword, options) => {
    await runScript('./scripts/generate-concept.js', [
      '--keyword', keyword,
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

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
