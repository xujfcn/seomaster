// seomaster/scripts/lib/draft-config.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SEOMASTER_ROOT = path.join(__dirname, '../..');
const TEMPLATES_DIR = path.join(SEOMASTER_ROOT, 'templates');

/**
 * 读取写作所需的所有配置
 * @param {string} conceptPath - concept.yaml 的绝对路径
 * @returns {{ concept, forbiddenWords, voice, aiPatterns }}
 */
function loadDraftConfig(conceptPath) {
  // 读取 concept.yaml
  const concept = yaml.load(fs.readFileSync(conceptPath, 'utf-8'));

  // 读取 quality-standards.yaml
  const qualityPath = path.join(TEMPLATES_DIR, 'quality-standards.yaml');
  const quality = yaml.load(fs.readFileSync(qualityPath, 'utf-8'));

  // 提取所有禁用词（扁平化）
  const fw = quality.hard_metrics?.forbidden_words || {};
  const forbiddenWords = Object.values(fw)
    .flatMap((cat) => cat.words || []);

  // 提取 AI 句式禁令
  const aiPatterns = (quality.hard_metrics?.ai_patterns || [])
    .map((p) => p.pattern);

  // 读取 project-config.yaml（可选，不存在则用默认值）
  const projectConfigPath = path.join(SEOMASTER_ROOT, 'project-config.yaml');
  let voice = {
    tone: '技术老手的实话实说',
    style: '数据驱动，不吹不黑',
  };
  if (fs.existsSync(projectConfigPath)) {
    const projectConfig = yaml.load(fs.readFileSync(projectConfigPath, 'utf-8'));
    if (projectConfig.voice) voice = projectConfig.voice;
  }

  return { concept, forbiddenWords, voice, aiPatterns };
}

module.exports = { loadDraftConfig };
