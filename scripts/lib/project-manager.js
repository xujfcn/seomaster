// seomaster/scripts/lib/project-manager.js
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

const PROJECTS_FILE = path.join(__dirname, '../../projects.json');

/**
 * Load projects configuration
 */
function loadProjects() {
  if (!fs.existsSync(PROJECTS_FILE)) {
    return {
      projects: {},
      current_project: null
    };
  }
  return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
}

/**
 * Save projects configuration
 */
function saveProjects(config) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Get current project
 */
function getCurrentProject() {
  const config = loadProjects();
  if (!config.current_project) return null;
  return config.projects[config.current_project];
}

/**
 * Set current project
 */
function setCurrentProject(projectId) {
  const config = loadProjects();
  if (!config.projects[projectId]) {
    throw new Error(`Project not found: ${projectId}`);
  }
  config.current_project = projectId;
  saveProjects(config);
}

/**
 * List all projects
 */
function listProjects() {
  const config = loadProjects();
  return Object.entries(config.projects).map(([id, project]) => ({
    id,
    ...project,
    current: config.current_project === id
  }));
}

/**
 * Add a new project
 */
function addProject(id, projectData) {
  const config = loadProjects();
  config.projects[id] = projectData;
  if (!config.current_project) {
    config.current_project = id;
  }
  saveProjects(config);
}

/**
 * Interactive project selection
 */
async function selectProject() {
  const projects = listProjects();
  
  if (projects.length === 0) {
    console.log('\n⚠️  No projects configured. Please add a project first.\n');
    return null;
  }

  if (projects.length === 1) {
    console.log(`\n📁 Using project: ${projects[0].name}\n`);
    return projects[0];
  }

  const choices = projects.map(p => ({
    name: `${p.current ? '● ' : '○ '}${p.name} - ${p.description}`,
    value: p.id,
    short: p.name
  }));

  choices.push({ name: '+ Add new project', value: '__new__' });

  const { projectId } = await inquirer.prompt([{
    type: 'list',
    name: 'projectId',
    message: 'Select a project:',
    choices
  }]);

  if (projectId === '__new__') {
    return await createNewProject();
  }

  setCurrentProject(projectId);
  const config = loadProjects();
  return config.projects[projectId];
}

/**
 * 将项目名称转换为 ID（slug 化）
 */
function nameToId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Create a new project interactively
 */
async function createNewProject() {
  console.log('\n📝 Create New Project\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: (input) => input ? true : 'Project name is required'
    },
    {
      type: 'input',
      name: 'id',
      message: 'Project ID (auto-generated, press Enter to accept):',
      default: (answers) => nameToId(answers.name),
      validate: (input) => {
        if (!input) return 'Project ID is required';
        if (!/^[a-z0-9-]+$/.test(input)) return 'Only lowercase letters, numbers, and hyphens allowed';
        const config = loadProjects();
        if (config.projects[input]) return 'Project ID already exists';
        return true;
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):',
      default: ''
    },
    {
      type: 'input',
      name: 'vault_path',
      message: 'Obsidian vault path (paste full path):',
      validate: (input) => {
        if (!input) return 'Vault path is required';
        if (!fs.existsSync(input)) {
          return `Path does not exist: ${input}. Create it first.`;
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'default_lang',
      message: 'Default language:',
      choices: ['en', 'zh'],
      default: 'en'
    },
    {
      type: 'number',
      name: 'default_words',
      message: 'Default word count:',
      default: 2500,
      validate: (input) => {
        return !isNaN(input) && input > 0 ? true : 'Must be a positive number';
      }
    }
  ]);

  // 在 Obsidian vault 中创建必要的文件夹
  const vaultPath = answers.vault_path;

  // 自动设置输出目录为 vault 内的 Published 目录
  const outputDir = path.join(vaultPath, 'Published');

  const requiredDirs = [
    'Core',           // 核心知识
    'Domain',         // 领域知识
    'Competitors',    // 竞品分析
    'Cases',          // 使用案例
    'Research',       // Google 爬取的研究数据
    'Published',      // 生成的文章输出
    'Templates'       // 模板
  ];

  console.log('\n📁 Setting up Obsidian vault structure...\n');

  for (const dir of requiredDirs) {
    const dirPath = path.join(vaultPath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  ✓ Created: ${dir}/`);
    } else {
      console.log(`  ○ Exists: ${dir}/`);
    }
  }

  // 创建 README 文件
  const readmePath = path.join(vaultPath, 'README.md');
  if (!fs.existsSync(readmePath)) {
    const readmeContent = `# ${answers.name} - Knowledge Base

This is the Obsidian vault for ${answers.name} content production.

## Directory Structure

- **Core/** - Core product information (always loaded)
- **Domain/** - Domain-specific knowledge (keyword-matched)
- **Competitors/** - Competitor analysis
- **Cases/** - Use cases and success stories
- **Research/** - Google search research data (auto-saved)
- **Published/** - Generated articles (auto-saved)
- **Templates/** - Document templates

## Usage

1. Add knowledge files to Core/, Domain/, Competitors/, Cases/
2. Use SEOMaster to generate articles
3. Generated articles will be saved to Published/
4. Research data will be saved to Research/

## YAML Front Matter

Add metadata to your knowledge files:

\`\`\`yaml
---
type: core|domain|competitor|case
priority: critical|high|medium|low
keywords: [keyword1, keyword2]
tags: [tag1, tag2]
last_updated: ${new Date().toISOString().split('T')[0]}
always_load: true|false
---
\`\`\`

## Project Info

- Project ID: ${answers.id} (internal identifier)
- Project Name: ${answers.name} (display name)
- Output Directory: Published/ (inside vault)
- Created: ${new Date().toISOString().split('T')[0]}
- SEOMaster Version: 1.0.0

## Directory Structure

All generated content will be saved inside this vault:
- **Published/** - Generated articles (auto-saved here)
- **Research/** - Google search research data (auto-saved here)
`;
    fs.writeFileSync(readmePath, readmeContent, 'utf-8');
    console.log(`  ✓ Created: README.md`);
  }

  const projectData = {
    name: answers.name,
    vault_path: answers.vault_path,
    description: answers.description,
    output_dir: outputDir,  // 使用 vault 内的 Published 目录
    default_lang: answers.default_lang,
    default_market: answers.default_lang === 'zh' ? 'cn' : 'us',
    default_words: answers.default_words,
    default_results: 5
  };

  addProject(answers.id, projectData);
  setCurrentProject(answers.id);

  console.log(`\n✅ Project "${answers.name}" created and set as current.`);
  console.log(`   Project ID: ${answers.id} (auto-generated)`);
  console.log(`\n📚 Obsidian vault structure created at: ${vaultPath}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Open Obsidian and open this vault: ${vaultPath}`);
  console.log(`   2. Add knowledge files to Core/, Domain/, etc.`);
  console.log(`   3. Start generating articles with: seomaster new "keyword"`);
  console.log(`   4. Generated articles will be saved to: ${outputDir}\n`);

  return projectData;
}

module.exports = {
  loadProjects,
  saveProjects,
  getCurrentProject,
  setCurrentProject,
  listProjects,
  addProject,
  selectProject,
  createNewProject,
  nameToId
};
