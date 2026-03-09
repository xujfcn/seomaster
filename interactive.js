#!/usr/bin/env node

/**
 * SEOMaster Interactive CLI
 *
 * 交互式主菜单，简化用户操作流程
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '.env') });

const yaml = require('js-yaml');

const {
  listProjects,
  getCurrentProject,
  selectProject,
  createNewProject,
} = require('./scripts/lib/project-manager');

// 运行脚本
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: __dirname,
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script exited with code ${code}`));
    });
  });
}

// 预览 Concept
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

    if (concept.faq && concept.faq.length > 0) {
      console.log(chalk.cyan('\nFAQ:'));
      concept.faq.forEach((q, i) => {
        console.log(chalk.white(`  ${i + 1}. ${q.question}`));
      });
    }

    console.log('');
  } catch (error) {
    console.error(chalk.red('Failed to preview concept:'), error.message);
  }
}

// 确认 Concept
async function confirmConcept(conceptFile, keyword, options) {
  previewConcept(conceptFile);

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: chalk.green('✓ Continue to draft generation'), value: 'continue' },
        { name: chalk.yellow('↻ Regenerate concept'), value: 'retry' },
        { name: chalk.blue('✎ Edit concept file manually'), value: 'edit' },
        { name: chalk.gray('✕ Cancel'), value: 'cancel' },
      ],
    },
  ]);

  if (action === 'continue') {
    return true;
  } else if (action === 'retry') {
    console.log(chalk.yellow('\n↻ Regenerating concept...\n'));
    await runScript('./scripts/generate-concept.js', [
      '--keyword',
      keyword,
      '--lang',
      options.lang,
      '--market',
      options.market,
      '--results',
      options.results.toString(),
      '--words',
      options.words.toString(),
      '--out',
      path.join(__dirname, options.outputDir),
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

// 列出项目的文章
function listArticles(projectId) {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    return [];
  }

  const files = fs.readdirSync(outputDir);
  const articles = {};

  files.forEach((file) => {
    if (file.endsWith('-concept.yaml')) {
      const slug = file.replace('-concept.yaml', '');
      articles[slug] = articles[slug] || {};
      articles[slug].concept = true;
      articles[slug].conceptFile = path.join(outputDir, file);
    } else if (file.endsWith('-draft.md')) {
      const slug = file.replace('-draft.md', '');
      articles[slug] = articles[slug] || {};
      articles[slug].draft = true;
      articles[slug].draftFile = path.join(outputDir, file);
    } else if (file.endsWith('-research.json')) {
      const slug = file.replace('-research.json', '');
      articles[slug] = articles[slug] || {};
      articles[slug].research = true;
    }
  });

  return Object.entries(articles).map(([slug, data]) => ({
    slug,
    ...data,
  }));
}

// 项目菜单
async function projectMenu(project) {
  console.clear();
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         SEOMaster - Project Menu       ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════╝\n'));
  console.log(chalk.white(`📁 Current Project: ${chalk.green(project.name)}`));
  console.log(chalk.gray(`   Vault: ${project.vault_path}`));
  console.log(chalk.gray(`   Output: ${project.output_dir}\n`));

  const articles = listArticles();
  const articleCount = articles.length;

  const choices = [
    {
      name: `${chalk.green('✨')} New Article`,
      value: 'new',
    },
    {
      name: `${chalk.blue('📄')} List Articles (${articleCount})`,
      value: 'list',
      disabled: articleCount === 0 ? 'No articles yet' : false,
    },
    new inquirer.Separator(),
    {
      name: `${chalk.yellow('🔄')} Switch Project`,
      value: 'switch',
    },
    {
      name: `${chalk.gray('← Back to Main Menu')}`,
      value: 'back',
    },
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
    },
  ]);

  switch (action) {
    case 'new':
      await newArticleFlow(project);
      break;
    case 'list':
      await listArticlesMenu(project, articles);
      break;
    case 'switch':
      await selectProject();
      const newProject = getCurrentProject();
      if (newProject) {
        await projectMenu(newProject);
      } else {
        await mainMenu();
      }
      break;
    case 'back':
      await mainMenu();
      break;
  }
}

// 新建文章流程
async function newArticleFlow(project) {
  console.clear();
  console.log(chalk.cyan.bold('\n✨ New Article\n'));

  const { keyword } = await inquirer.prompt([
    {
      type: 'input',
      name: 'keyword',
      message: 'Enter target keyword:',
      validate: (input) => (input ? true : 'Keyword is required'),
    },
  ]);

  const { lang } = await inquirer.prompt([
    {
      type: 'list',
      name: 'lang',
      message: 'Language:',
      choices: ['en', 'zh'],
      default: project.default_lang || 'en',
    },
  ]);

  const { words } = await inquirer.prompt([
    {
      type: 'number',
      name: 'words',
      message: 'Target word count:',
      default: project.default_words || 2500,
    },
  ]);

  const { results } = await inquirer.prompt([
    {
      type: 'number',
      name: 'results',
      message: 'Search results to analyze:',
      default: project.default_results || 5,
    },
  ]);

  console.log(chalk.cyan('\n🚀 Generating article...\n'));

  try {
    // Step 1: Generate concept
    console.log(chalk.cyan('[1/4] Generating concept...\n'));
    await runScript('./scripts/generate-concept.js', [
      '--keyword',
      keyword,
      '--lang',
      lang,
      '--market',
      lang === 'zh' ? 'cn' : 'us',
      '--results',
      results.toString(),
      '--words',
      words.toString(),
      '--out',
      path.join(__dirname, project.output_dir),
    ]);

    const slug = keyword
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const conceptFile = path.join(__dirname, project.output_dir, `${slug}-concept.yaml`);

    // Step 1.5: 确认 Concept
    console.log(chalk.cyan('\n[1.5/4] Reviewing concept...\n'));
    const shouldContinue = await confirmConcept(conceptFile, keyword, {
      lang,
      market: lang === 'zh' ? 'cn' : 'us',
      results,
      words,
      outputDir: project.output_dir,
    });

    if (!shouldContinue) {
      console.log(chalk.yellow('\n⚠️  Workflow cancelled\n'));
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
      await projectMenu(project);
      return;
    }

    // Step 2: Generate draft
    console.log(chalk.cyan('\n[2/4] Generating draft...\n'));
    await runScript('./scripts/generate-draft.js', ['--concept', conceptFile]);

    // Step 3: Quality check
    console.log(chalk.cyan('\n[3/4] Quality check...\n'));
    const draftFile = path.join(__dirname, project.output_dir, `${slug}-draft.md`);
    try {
      await runScript('./scripts/quality-check.js', [draftFile]);
    } catch (err) {
      console.log(chalk.yellow('  ⚠️  Quality check found issues'));
    }

    console.log(chalk.green('\n✅ Article generated successfully!\n'));
    console.log(chalk.gray(`   Concept: ${conceptFile}`));
    console.log(chalk.gray(`   Draft: ${draftFile}\n`));

    const { next } = await inquirer.prompt([
      {
        type: 'list',
        name: 'next',
        message: 'What next?',
        choices: [
          { name: 'View article details', value: 'view' },
          { name: 'Create another article', value: 'new' },
          { name: 'Back to project menu', value: 'back' },
        ],
      },
    ]);

    if (next === 'view') {
      await articleDetailsMenu(project, { slug, concept: true, draft: true, conceptFile, draftFile });
    } else if (next === 'new') {
      await newArticleFlow(project);
    } else {
      await projectMenu(project);
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Failed:'), error.message);
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    await projectMenu(project);
  }
}

// 文章列表菜单
async function listArticlesMenu(project, articles) {
  console.clear();
  console.log(chalk.cyan.bold('\n📄 Articles\n'));

  const choices = articles.map((article) => {
    const status = article.draft ? chalk.green('✓ Complete') : chalk.yellow('○ Concept Only');
    return {
      name: `${status}  ${article.slug}`,
      value: article.slug,
    };
  });

  choices.push(new inquirer.Separator());
  choices.push({ name: chalk.gray('← Back'), value: '__back__' });

  const { slug } = await inquirer.prompt([
    {
      type: 'list',
      name: 'slug',
      message: 'Select an article:',
      choices,
    },
  ]);

  if (slug === '__back__') {
    await projectMenu(project);
    return;
  }

  const article = articles.find((a) => a.slug === slug);
  await articleDetailsMenu(project, article);
}

// 文章详情菜单
async function articleDetailsMenu(project, article) {
  console.clear();
  console.log(chalk.cyan.bold(`\n📄 Article: ${article.slug}\n`));

  console.log(chalk.white('Status:'));
  console.log(chalk.gray(`  ${article.research ? '✓' : '○'} Research`));
  console.log(chalk.gray(`  ${article.concept ? '✓' : '○'} Concept`));
  console.log(chalk.gray(`  ${article.draft ? '✓' : '○'} Draft\n`));

  const choices = [];

  if (article.concept && !article.draft) {
    choices.push({ name: chalk.green('✨ Generate Draft'), value: 'draft' });
  }

  if (article.draft) {
    choices.push({ name: chalk.blue('🔍 Quality Check'), value: 'check' });
    choices.push({ name: chalk.magenta('🎨 Generate Images'), value: 'images' });
  }

  choices.push(new inquirer.Separator());
  choices.push({ name: chalk.gray('← Back to list'), value: 'back' });

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
    },
  ]);

  try {
    switch (action) {
      case 'draft':
        console.log(chalk.cyan('\n🚀 Generating draft...\n'));
        await runScript('./scripts/generate-draft.js', ['--concept', article.conceptFile]);
        console.log(chalk.green('\n✅ Draft generated!\n'));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        article.draft = true;
        article.draftFile = article.conceptFile.replace('-concept.yaml', '-draft.md');
        await articleDetailsMenu(project, article);
        break;

      case 'check':
        console.log(chalk.cyan('\n🔍 Running quality check...\n'));
        await runScript('./scripts/quality-check.js', [article.draftFile]);
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        await articleDetailsMenu(project, article);
        break;

      case 'images':
        console.log(chalk.cyan('\n🎨 Generating images...\n'));
        await runScript('./scripts/generate-images.js', ['--draft', article.draftFile]);
        console.log(chalk.green('\n✅ Images generated!\n'));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        await articleDetailsMenu(project, article);
        break;

      case 'back':
        const articles = listArticles();
        await listArticlesMenu(project, articles);
        break;
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Failed:'), error.message);
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    await articleDetailsMenu(project, article);
  }
}

// 主菜单
async function mainMenu() {
  console.clear();
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║            SEOMaster v1.0              ║'));
  console.log(chalk.cyan.bold('║   AI-Driven SEO Content Workflow       ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════╝\n'));

  const projects = listProjects();
  const currentProject = getCurrentProject();

  if (projects.length === 0) {
    console.log(chalk.yellow('⚠️  No projects found. Let\'s create your first project!\n'));
    await createNewProject();
    await mainMenu();
    return;
  }

  const choices = [
    {
      name: `${chalk.green('📁')} Enter Project ${currentProject ? `(${currentProject.name})` : ''}`,
      value: 'enter',
    },
    {
      name: `${chalk.blue('🔄')} Switch Project`,
      value: 'switch',
      disabled: projects.length === 1 ? 'Only one project' : false,
    },
    {
      name: `${chalk.cyan('➕')} Create New Project`,
      value: 'new',
    },
    new inquirer.Separator(),
    {
      name: `${chalk.gray('Exit')}`,
      value: 'exit',
    },
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
    },
  ]);

  switch (action) {
    case 'enter':
      if (currentProject) {
        await projectMenu(currentProject);
      } else {
        await selectProject();
        const project = getCurrentProject();
        if (project) {
          await projectMenu(project);
        } else {
          await mainMenu();
        }
      }
      break;

    case 'switch':
      await selectProject();
      await mainMenu();
      break;

    case 'new':
      await createNewProject();
      await mainMenu();
      break;

    case 'exit':
      console.log(chalk.cyan('\n👋 Goodbye!\n'));
      process.exit(0);
      break;
  }
}

// 启动
mainMenu().catch((error) => {
  console.error(chalk.red('\n❌ Error:'), error.message);
  process.exit(1);
});
