const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const yaml = require('js-yaml');
const { initWorkflow, getProjectDefaults } = require('./cli-workflow');
const { readMarkdownDocument } = require('./frontmatter');
const { saveToVault, shouldSaveToVault } = require('./vault-writer');
const { buildArticleIndex, saveArticleIndex, slugify } = require('./article-index');
const { detectDuplicates } = require('./duplicate-detector');
const { ensureTopicCard, ensureVaultStructure } = require('./topic-manager');
const { loadProjects } = require('./project-manager');

const SEOMASTER_ROOT = path.join(__dirname, '../..');

function keywordToSlug(keyword) {
  return slugify(keyword);
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
  const { metadata: draftMetadata, content } = readMarkdownDocument(draftPath);
  const titleMatch = content.match(/^#\s+(.+)$/m);

  return {
    keyword: draftMetadata.keyword || (titleMatch ? titleMatch[1] : keyword),
    slug: draftMetadata.slug || slug,
    word_count: countWords(content),
    quality_score: qualityStatus === 'passed' ? 'PASS' : 'CHECK_FAILED',
    cover_image_url: draftMetadata.cover_image_url || '',
  };
}

function persistReport(report, outputDir, slug) {
  report.files.report = path.join(outputDir, `${slug}-workflow-report.json`);
  fs.writeFileSync(report.files.report, JSON.stringify(report, null, 2), 'utf-8');
}

function getProjectId(project, explicitProjectId) {
  if (explicitProjectId) return explicitProjectId;
  const config = loadProjects();
  if (config.current_project && config.projects[config.current_project] && config.projects[config.current_project].vault_path === project.vault_path) {
    return config.current_project;
  }
  const matched = Object.entries(config.projects).find(([, item]) => item.vault_path === project.vault_path);
  return matched ? matched[0] : project.name;
}

function buildArticleId(projectId, lang, topicKey) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `${projectId}-${lang}-${topicKey}-${stamp}`;
}

function updateConceptMetadata(conceptFile, workflowMetadata) {
  const raw = fs.readFileSync(conceptFile, 'utf-8');
  const concept = yaml.load(raw);
  concept.topic_key = workflowMetadata.topic_key;
  concept.article_id = workflowMetadata.article_id;
  concept.workflow = {
    action: workflowMetadata.action,
    duplicate_risk: workflowMetadata.duplicate_risk,
    related_articles: workflowMetadata.related_articles,
  };
  fs.writeFileSync(conceptFile, yaml.dump(concept, {
    indent: 2,
    lineWidth: 120,
    quotingType: '"',
  }), 'utf-8');
}

async function runAutomatedWorkflow(keyword, options = {}) {
  const project = await initWorkflow({ project: options.project });
  const projectId = getProjectId(project, options.project);
  const defaults = getProjectDefaults(project);
  const slug = keywordToSlug(keyword);
  const topicKey = slug;
  const lang = options.lang || defaults.lang;
  const market = options.market || defaults.market;
  const results = String(options.results || defaults.results);
  const words = String(options.words || defaults.words);
  const intent = options.intent || 'informational';
  const scene = options.scene || '';
  const importDir = options.importDir || 'Drafts';
  const outputDir = resolveOutputDir(options.outputDir || defaults.outputDir);
  const filterDomains = options.filterDomains !== false;
  const articleId = buildArticleId(projectId, lang, topicKey);

  ensureVaultStructure(project.vault_path);

  fs.mkdirSync(outputDir, { recursive: true });

  const conceptFile = path.join(outputDir, `${slug}-concept.yaml`);
  const draftFile = path.join(outputDir, `${slug}-draft.md`);

  const report = {
    status: 'running',
    keyword,
    slug,
    started_at: new Date().toISOString(),
    project: {
      id: projectId,
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
    topic: {
      topic_key: topicKey,
      article_id: articleId,
    },
    files: {
      concept: conceptFile,
      draft: draftFile,
    },
    steps: {},
  };

  const currentIndex = buildArticleIndex(project.vault_path, projectId);
  const duplicate = detectDuplicates({
    keyword,
    slug,
    title: keyword,
    topic_key: topicKey,
  }, currentIndex);

  report.steps.topic_check = {
    status: 'completed',
    decision: duplicate.decision,
    reasons: duplicate.reasons,
    matched_topic: duplicate.matched_topic?.topic_key || '',
    similar_articles: (duplicate.similar_articles || []).map((item) => item.relative_path),
  };

  if (duplicate.decision === 'block') {
    report.status = 'blocked_duplicate';
    report.finished_at = new Date().toISOString();
    persistReport(report, outputDir, slug);
    throw new Error(`Workflow blocked: ${duplicate.reasons.join('; ')}`);
  }

  if (duplicate.decision === 'allow_new') {
    const topicPath = ensureTopicCard(project.vault_path, {
      projectId,
      topicKey,
      keyword,
      intent,
      primaryArticleId: articleId,
    });
    report.steps.topic_card = { status: 'created', path: topicPath };
  } else {
    report.steps.topic_card = { status: 'reused' };
  }

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
  updateConceptMetadata(conceptFile, {
    topic_key: topicKey,
    article_id: articleId,
    action: duplicate.decision === 'update_existing' ? 'update' : 'new',
    duplicate_risk: duplicate.decision,
    related_articles: (duplicate.similar_articles || []).map((item) => ({
      article_id: item.article_id,
      path: item.relative_path,
      title: item.title,
    })),
  });
  report.steps.concept = { status: 'completed' };

  await runScript(path.join(SEOMASTER_ROOT, 'scripts', 'generate-draft.js'), [
    '--concept', conceptFile,
    '--out', outputDir,
  ]);
  report.steps.draft = { status: 'completed' };

  if (options.skipImages) {
    report.steps.images = {
      status: 'blocked',
      reason: 'Image generation is required by the workflow',
    };
    report.status = 'blocked_missing_images';
    report.finished_at = new Date().toISOString();
    persistReport(report, outputDir, slug);
    throw new Error('Image generation is required by the workflow. Remove --skip-images.');
  }

  try {
    await runScript(path.join(SEOMASTER_ROOT, 'scripts', 'generate-images.js'), ['--draft', draftFile]);
    report.steps.images = { status: 'completed' };
  } catch (error) {
    report.steps.images = { status: 'failed', error: error.message };
    report.status = 'blocked_missing_images';
    report.finished_at = new Date().toISOString();
    persistReport(report, outputDir, slug);
    throw new Error(`Image generation failed: ${error.message}`);
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
    const metadata = {
      ...extractDraftMetadata(draftFile, keyword, slug, qualityPassed ? 'passed' : 'failed'),
      project: projectId,
      topic_key: topicKey,
      article_id: articleId,
      lang,
      intent,
      review_status: qualityPassed ? (duplicate.decision === 'review_duplicate' ? 'manual_review' : 'approved') : 'pending',
      status: importDir === 'Published' ? 'published' : 'draft',
      canonical: duplicate.decision !== 'review_duplicate',
    };
    const savedPath = saveToVault(content, metadata, project.vault_path, importDir);
    report.steps.vault_import = { status: 'completed', path: savedPath };
    report.files.vault = savedPath;
  }

  const refreshedIndex = buildArticleIndex(project.vault_path, projectId);
  report.files.index = saveArticleIndex(refreshedIndex);
  report.steps.reindex = { status: 'completed', path: report.files.index };

  if (!qualityPassed || duplicate.decision === 'review_duplicate') {
    report.status = 'needs_review';
  } else if (duplicate.decision === 'update_existing') {
    report.status = 'update_ready';
  } else {
    report.status = 'completed';
  }
  report.finished_at = new Date().toISOString();
  persistReport(report, outputDir, slug);

  return report;
}

module.exports = {
  keywordToSlug,
  resolveOutputDir,
  runAutomatedWorkflow,
  runScript,
};
