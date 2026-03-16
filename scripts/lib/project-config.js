const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SEOMASTER_ROOT = path.join(__dirname, '../..');
const PROJECT_CONFIG_PATH = path.join(SEOMASTER_ROOT, 'project-config.yaml');

let cachedConfig;

function loadProjectConfig() {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  if (!fs.existsSync(PROJECT_CONFIG_PATH)) {
    cachedConfig = null;
    return cachedConfig;
  }

  cachedConfig = yaml.load(fs.readFileSync(PROJECT_CONFIG_PATH, 'utf-8')) || null;
  return cachedConfig;
}

function fillTemplate(template, values) {
  if (!template) return '';

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key];
    return value === undefined || value === null ? '' : String(value);
  }).replace(/\s{2,}/g, ' ').trim();
}

function getDefaultThesis() {
  const projectConfig = loadProjectConfig();
  return projectConfig?.value_proposition?.full || '';
}

function getDefaultCta() {
  const projectConfig = loadProjectConfig();
  const product = projectConfig?.project?.name || projectConfig?.value_proposition?.product || '';
  const website = projectConfig?.cta?.default?.url || projectConfig?.project?.website || '';
  const textTemplate = projectConfig?.cta?.default?.text || '';
  const offer = projectConfig?.cta?.offer || 'free trial';

  return {
    text: fillTemplate(textTemplate, { product, offer }),
    url: website,
  };
}

module.exports = {
  fillTemplate,
  getDefaultCta,
  getDefaultThesis,
  loadProjectConfig,
};
