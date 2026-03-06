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
 * Create a new project interactively
 */
async function createNewProject() {
  console.log('\n📝 Create New Project\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Project ID (lowercase, no spaces):',
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
      name: 'name',
      message: 'Project name:',
      validate: (input) => input ? true : 'Project name is required'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: ''
    },
    {
      type: 'input',
      name: 'vault_path',
      message: 'Knowledge base path (Obsidian vault):',
      validate: (input) => {
        if (!input) return 'Vault path is required';
        if (!fs.existsSync(input)) {
          return `Path does not exist: ${input}. Create it first.`;
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'output_dir',
      message: 'Output directory:',
      default: 'output'
    },
    {
      type: 'list',
      name: 'default_lang',
      message: 'Default language:',
      choices: ['en', 'zh'],
      default: 'en'
    },
    {
      type: 'input',
      name: 'default_words',
      message: 'Default word count:',
      default: '2500',
      validate: (input) => {
        const num = parseInt(input);
        return !isNaN(num) && num > 0 ? true : 'Must be a positive number';
      },
      filter: (input) => parseInt(input)
    }
  ]);

  const projectData = {
    name: answers.name,
    vault_path: answers.vault_path,
    description: answers.description,
    output_dir: answers.output_dir,
    default_lang: answers.default_lang,
    default_market: answers.default_lang === 'zh' ? 'cn' : 'us',
    default_words: answers.default_words,
    default_results: 5
  };

  addProject(answers.id, projectData);
  setCurrentProject(answers.id);

  console.log(`\n✅ Project "${answers.name}" created and set as current.\n`);

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
  createNewProject
};
