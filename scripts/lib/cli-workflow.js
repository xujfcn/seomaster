// seomaster/scripts/lib/cli-workflow.js
const { selectProject, getCurrentProject } = require('./project-manager');
const { setKnowledgeBasePath } = require('./knowledge');
const chalk = require('chalk');

/**
 * Initialize workflow with project selection
 * Returns project configuration
 */
async function initWorkflow(options = {}) {
  console.log(chalk.cyan('\n🚀 SEOMaster - AI Content Generation Tool\n'));

  // If project is specified via command line
  if (options.project) {
    const { setCurrentProject, loadProjects } = require('./project-manager');
    const config = loadProjects();
    if (!config.projects[options.project]) {
      console.error(chalk.red(`❌ Project not found: ${options.project}`));
      console.log(chalk.gray('\nAvailable projects:'));
      Object.keys(config.projects).forEach(id => {
        console.log(chalk.gray(`  - ${id}`));
      });
      process.exit(1);
    }
    setCurrentProject(options.project);
  }

  // Get current project or select one
  let project = getCurrentProject();
  
  if (!project || options.selectProject) {
    project = await selectProject();
    if (!project) {
      console.error(chalk.red('❌ No project selected'));
      process.exit(1);
    }
  }

  // Set knowledge base path
  setKnowledgeBasePath(project.vault_path);

  // Display project info
  console.log(chalk.green(`✓ Project: ${project.name}`));
  console.log(chalk.gray(`  Knowledge base: ${project.vault_path}`));
  console.log(chalk.gray(`  Output: ${project.output_dir}`));
  console.log('');

  return project;
}

/**
 * Get project defaults for article generation
 */
function getProjectDefaults(project) {
  return {
    lang: project.default_lang || 'en',
    market: project.default_market || 'us',
    words: project.default_words || 2500,
    results: project.default_results || 5,
    outputDir: project.output_dir || 'output'
  };
}

module.exports = {
  initWorkflow,
  getProjectDefaults
};
