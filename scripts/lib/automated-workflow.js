const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { initWorkflow, getProjectDefaults } = require('./cli-workflow');
const { saveToVault, shouldSaveToVault } = require('./vault-writer');

const SEOMASTER_ROOT = path.join(__dirname, '../..');

function keywordToSlug(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveOutputDir(dir) {
  return path.isAbsolute(dir) ? dir : path.join(SEOMASTER_ROOT, dir);
}

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: SEOMASTER_ROOT,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Script exited with code ${code}`));
    });
  });
}

function countWords(text) {
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
}

function extractDraftMetadata(draftPath, keyword, slug, qualityStatus) {
  const content = fs.readFileSync(draftPath, 'utf-8');
  const titleMatch = content.match(/^#\s+(.+)$/m);

  return {
    keyword: titleMatch ? titleMatch[1] : keyword,
    slug,
    word_count: countWords(content),
    quality_score: qualityStatus === 'passed' ? 'PASS' : 'CHECK_FAILED',
  };
}

async function runAutomatedWorkflow(keyword, options = {}) {
  const project = await initWorkflow({ project: options.project });
  const defaults = getProjectDefaults(project);
  const slug = keywordToSlug(keyword);
  const lang = options.lang || defaults.lang;
  const market = options.market || defaults.market;
  const results = String(options.results || defaults.results);
  const words = String(options.words || defaults.words);
  const intent = options.intent || 'informational';
  const scene = options.scene || '';
  const importDir = options.importDir || 'Published';
  const outputDir = resolveOutputDir(options.outputDir || defaults.outputDir);
  const filterDomains = options.filterDomains !== false;

  fs.mkdirSync(outputDir, { recursive: true });

  const conceptFile = path.join(outputDir, `${slug}-concept.yaml`);
  const draftFile = path.join(outputDir, `${slug}-draft.md`);

  const report = {
    status: 'running',
    keyword,
    slug,
    started_at: new Date().toISOString(),
    project: {
      name: project.name,
      vault_path: project.vault_path,
      output_dir: outputDir,
    },
    options: {
      lang,
      market,
      results: Number(results),
      words: Number(words),
      intent,
      scene,
      skip_images: !!options.skipImages,
      skip_import: !!options.skipImport,
      force_import: !!options.forceImport,
      filter_domains: filterDomains,
    },
    files: {
      concept: conceptFile,
      draft: draftFile,
    },
    steps: {},
  };

  const conceptArgs = [
    '--keyword', keyword,
    '--intent', intent,
    '--scene', scene,
    '--lang', lang,
    '--market', market,
    '--results', results,
    '--words', words,
    '--out', outputDir,
  ];
  if (!filterDomains) {
    conceptArgs.push('--no-filter');
  }

  await runScript(path.join(SEOMASTER_ROOT, 'scripts', 'generate-concept.js'), conceptArgs);
  report.steps.concept = { status: 'completed' };

  await runScript(path.join(SEOMASTER_ROOT, 'scripts', 'generate-draft.js'), [
    '--concept', conceptFile,
    '--out', outputDir,
  ]);
  report.steps.draft = { status: 'completed' };

  if (options.skipImages) {
    report.steps.images = { status: 'skipped' };
  } else {
    try {
      await runScript(path.join(SEOMASTER_ROOT, 'scripts', 'generate-images.js'), ['--draft', draftFile]);
      report.steps.images = { status: 'completed' };
    } catch (error) {
      report.steps.images = { status: 'failed', error: error.message };
    }
  }

  let qualityPassed = true;
  try {
    await runScript(path.join(SEOMASTER_ROOT, 'scripts', 'quality-check.js'), [draftFile]);
    report.steps.quality_check = { status: 'passed' };
  } catch (error) {
    qualityPassed = false;
    report.steps.quality_check = { status: 'failed', error: error.message };
  }

  const canImport = !options.skipImport && shouldSaveToVault(project);
  if (!canImport) {
    report.steps.vault_import = { status: 'skipped' };
  } else if (!qualityPassed && !options.forceImport) {
    report.steps.vault_import = {
      status: 'skipped',
      reason: 'quality-check failed; use --force-import to override',
    };
  } else {
    const content = fs.readFileSync(draftFile, 'utf-8');
    const metadata = extractDraftMetadata(draftFile, keyword, slug, qualityPassed ? 'passed' : 'failed');
    const savedPath = saveToVault(content, metadata, project.vault_path, importDir);
    report.steps.vault_import = { status: 'completed', path: savedPath };
    report.files.vault = savedPath;
  }

  report.status = qualityPassed ? 'completed' : 'needs_review';
  report.finished_at = new Date().toISOString();
  report.files.report = path.join(outputDir, `${slug}-workflow-report.json`);
  fs.writeFileSync(report.files.report, JSON.stringify(report, null, 2), 'utf-8');

  return report;
}

module.exports = {
  keywordToSlug,
  resolveOutputDir,
  runAutomatedWorkflow,
  runScript,
};
