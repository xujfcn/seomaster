const state = {
  authenticated: false,
  username: null,
  isAdmin: false,
  hasProjects: true,
  currentPage: 'writing',
  projects: [],
  knowledgeFiles: [],
  knowledgeDocuments: [],
  knowledgeStats: null,
  keywordPool: null,
  keywordPoolExpanded: false,
  knowledgeMode: 'local',
  selectedKnowledgeDocumentId: null,
  selectedKnowledgeDocument: null,
  selectedKnowledgeFile: null,
  selectedKnowledgeChunks: [],
  selectedKnowledgePath: null,
  knowledgeCurrentDir: '',
  generatingKnowledgeKey: '',
  jobs: [],
  selectedProjectId: null,
  selectedProject: null,
  selectedJobId: null,
  selectedJob: null,
  selectedArtifactType: null,
  selectedArtifact: null,
  selectedArtifactContent: '',
  selectedArtifactJobId: null,
  loadingArtifactKey: '',
  artifactViewMode: 'split',
  expandedArtifactType: null,
  artifactAutoExpanded: false,
  imagePlan: null,
  pendingImages: {},
  imageModels: [],
  imageModelParams: {},
  knowledgeBuildStatusTimer: null,
  jobPollTimer: null,
  vaultStatus: null,
  systemConfig: null,
  runtimeConfig: null,
};

const els = {
  loginView: document.getElementById('login-view'),
  signupView: document.getElementById('signup-view'),
  appShell: document.getElementById('app-shell'),
  projectCreatePage: document.getElementById('project-create-page'),
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  signupUsername: document.getElementById('signup-username'),
  signupPassword: document.getElementById('signup-password'),
  loginButton: document.getElementById('login-button'),
  signupButton: document.getElementById('signup-button'),
  loginError: document.getElementById('login-error'),
  signupError: document.getElementById('signup-error'),
  showSignupButton: document.getElementById('show-signup-button'),
  knowledgePage: document.getElementById('knowledge-page'),
  writingPage: document.getElementById('writing-page'),
  settingsPage: document.getElementById('settings-page'),
  knowledgeNavButton: document.getElementById('knowledge-nav-button'),
  writingNavButton: document.getElementById('writing-nav-button'),
  settingsNavButton: document.getElementById('settings-nav-button'),
  knowledgeSearch: document.getElementById('knowledge-search'),
  keywordPoolPanel: document.getElementById('keyword-pool-panel'),
  keywordPoolSummary: document.getElementById('keyword-pool-summary'),
  keywordPoolToggleButton: document.getElementById('keyword-pool-toggle-button'),
  keywordPoolList: document.getElementById('keyword-pool-list'),
  keywordPoolHistory: document.getElementById('keyword-pool-history'),
  importKnowledgeButton: document.getElementById('import-knowledge-button'),
  knowledgeImportFileInput: document.getElementById('knowledge-import-file-input'),
  refreshKnowledgeButton: document.getElementById('refresh-knowledge-button'),
  newKnowledgeDocumentButton: document.getElementById('new-knowledge-document-button'),
  syncSupabaseButton: document.getElementById('sync-supabase-button'),
  requiredKnowledgeSummary: document.getElementById('required-knowledge-summary'),
  requiredKnowledgeSteps: document.getElementById('required-knowledge-steps'),
  knowledgeBreadcrumb: document.getElementById('knowledge-breadcrumb'),
  knowledgeFileList: document.getElementById('knowledge-file-list'),
  knowledgeMeta: document.getElementById('knowledge-meta'),
  knowledgeRendered: document.getElementById('knowledge-rendered'),
  projectList: document.getElementById('project-list'),
  projectTitle: document.getElementById('project-title'),
  projectSubtitle: document.getElementById('project-subtitle'),
  projectDetails: document.getElementById('project-details'),
  projectCreateForm: document.getElementById('project-create-form'),
  projectCreateOutput: document.getElementById('project-create-output'),
  createProjectButton: document.getElementById('create-project-button'),
  vaultStatus: document.getElementById('vault-status'),
  sourceBadge: document.getElementById('source-badge'),
  readyBadge: document.getElementById('ready-badge'),
  jobStatusBadge: document.getElementById('job-status-badge'),
  selectedJobBadge: document.getElementById('selected-job-badge'),
  output: document.getElementById('action-output'),
  jobOutput: document.getElementById('job-output'),
  articleForm: document.getElementById('article-form'),
  articleKeyword: document.getElementById('article-keyword'),
  articleIntent: document.getElementById('article-intent'),
  articleLang: document.getElementById('article-lang'),
  articleMarket: document.getElementById('article-market'),
  articleWords: document.getElementById('article-words'),
  articleResults: document.getElementById('article-results'),
  articleScene: document.getElementById('article-scene'),
  articleBrief: document.getElementById('article-brief'),
  articleSkipImport: document.getElementById('article-skip-import'),
  articleForceImport: document.getElementById('article-force-import'),
  articleSkipCover: document.getElementById('article-skip-cover'),
  articleAutoConfirmOutline: document.getElementById('article-auto-confirm-outline'),
  startArticleButton: document.getElementById('start-article-button'),
  refreshJobsButton: document.getElementById('refresh-jobs-button'),
  clearLogButton: document.getElementById('clear-log-button'),
  workflowArtifacts: document.getElementById('workflow-artifacts'),
  toggleRenderButton: document.getElementById('toggle-render-button'),
  saveArtifactButton: document.getElementById('save-artifact-button'),
  importDraftButton: document.getElementById('import-draft-button'),
  jobList: document.getElementById('job-list'),
  jobDetails: document.getElementById('job-details'),
  artifactActions: document.getElementById('artifact-actions'),
  artifactMeta: null,
  artifactEditorGrid: null,
  artifactEditor: null,
  artifactRendered: null,
  refreshButton: document.getElementById('refresh-button'),
  selectButton: document.getElementById('select-button'),
  logoutButton: document.getElementById('logout-button'),
  settingsForm: document.getElementById('system-settings-form'),
  refreshSettingsButton: document.getElementById('refresh-settings-button'),
  saveSettingsButton: document.getElementById('save-settings-button'),
  settingsOutput: document.getElementById('settings-output'),
  adminUsersPanel: document.getElementById('admin-users-panel'),
  adminCreateUserForm: document.getElementById('admin-create-user-form'),
  adminUserUsername: document.getElementById('admin-user-username'),
  adminUserPassword: document.getElementById('admin-user-password'),
  adminCreateUserButton: document.getElementById('admin-create-user-button'),
  adminUsersOutput: document.getElementById('admin-users-output'),
  imageLightbox: document.getElementById('image-lightbox'),
  imageLightboxImg: document.getElementById('image-lightbox-img'),
  imageLightboxClose: document.getElementById('image-lightbox-close'),
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      showLogin();
    }
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function showLogin(message = '') {
  state.authenticated = false;
  state.username = null;
  state.isAdmin = false;
  state.hasProjects = true;
  if (state.jobPollTimer) {
    clearInterval(state.jobPollTimer);
    state.jobPollTimer = null;
  }
  if (els.signupView) els.signupView.hidden = true;
  els.appShell.hidden = true;
  els.loginView.hidden = false;
  els.loginError.textContent = message;
  if (els.signupError) els.signupError.textContent = '';
  els.loginPassword.value = '';
  window.setTimeout(() => els.loginUsername.focus(), 0);
}

function showApp() {
  els.loginView.hidden = true;
  if (els.signupView) els.signupView.hidden = true;
  els.appShell.hidden = false;
  els.loginError.textContent = '';
  if (els.signupError) els.signupError.textContent = '';
}

function showSignup(message = '') {
  els.loginView.hidden = true;
  if (els.signupView) els.signupView.hidden = false;
  els.appShell.hidden = true;
  if (els.signupError) els.signupError.textContent = message;
  if (els.signupPassword) els.signupPassword.value = '';
  window.setTimeout(() => els.signupUsername.focus(), 0);
}

function showProjectCreate(message = '') {
  if (els.projectCreatePage) {
    els.projectCreatePage.hidden = false;
  }
  if (els.projectCreateOutput) {
    els.projectCreateOutput.textContent = message || 'Create your first project to continue.';
  }
  els.knowledgePage.hidden = true;
  els.writingPage.hidden = true;
  els.settingsPage.hidden = true;
}

function hideProjectCreate() {
  if (els.projectCreatePage) {
    els.projectCreatePage.hidden = true;
  }
}

function setPage(page) {
  if (page === 'settings' && !state.isAdmin) {
    page = 'writing';
  }
  state.currentPage = page;
  els.knowledgePage.hidden = page !== 'knowledge';
  els.writingPage.hidden = page !== 'writing';
  els.settingsPage.hidden = page !== 'settings';
  els.knowledgeNavButton.classList.toggle('active', page === 'knowledge');
  els.writingNavButton.classList.toggle('active', page === 'writing');
  if (els.settingsNavButton) {
    els.settingsNavButton.hidden = !state.isAdmin;
    els.settingsNavButton.classList.toggle('hidden-control', !state.isAdmin);
    els.settingsNavButton.classList.toggle('active', page === 'settings');
  }
  if (page === 'knowledge' && state.selectedProjectId) {
    loadRuntimeSettings()
      .then(() => loadKnowledgeFiles())
      .catch((error) => {
      els.knowledgeMeta.textContent = error.message;
    });
  }
  if (page === 'settings') {
    if (els.adminUsersPanel) {
      els.adminUsersPanel.hidden = !state.isAdmin;
    }
    els.settingsForm.hidden = !state.isAdmin;
    els.saveSettingsButton.hidden = !state.isAdmin;
    els.refreshSettingsButton.hidden = !state.isAdmin;
    if (!state.isAdmin) {
      els.settingsOutput.textContent = 'System settings are only available to local admin.';
      return;
    }
    loadSystemSettings().catch((error) => {
      els.settingsOutput.textContent = error.message;
    });
  }
  if (page === 'writing' && state.selectedProjectId) {
    refreshJobs().catch((error) => {
      printJobOutput(error.message);
    });
  }
}

async function loadSession() {
  const data = await api('/api/auth/session');
  state.authenticated = Boolean(data.authenticated);
  state.username = data.username || null;
  state.isAdmin = Boolean(data.is_admin);
  state.hasProjects = typeof data.project_count === 'number' ? data.project_count > 0 : true;
  if (els.settingsNavButton) {
    els.settingsNavButton.hidden = !state.isAdmin;
    els.settingsNavButton.classList.toggle('hidden-control', !state.isAdmin);
  }
  return state.authenticated;
}

async function login(event) {
  event.preventDefault();
  els.loginButton.disabled = true;
  els.loginError.textContent = '';
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: els.loginUsername.value.trim(),
        password: els.loginPassword.value,
      }),
    });
    state.authenticated = true;
    state.username = data.username || els.loginUsername.value.trim();
    await loadSession();
    showApp();
    await refresh();
  } catch (error) {
    showLogin(error.message);
  } finally {
    els.loginButton.disabled = false;
  }
}

async function signup(event) {
  event.preventDefault();
  if (!els.signupForm) return;
  els.signupButton.disabled = true;
  if (els.signupError) els.signupError.textContent = '';
  try {
    const data = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        username: els.signupUsername.value.trim(),
        password: els.signupPassword.value,
      }),
    });
    state.authenticated = true;
    state.username = data.username || els.signupUsername.value.trim();
    showApp();
    await refresh();
  } catch (error) {
    showSignup(error.message);
  } finally {
    els.signupButton.disabled = false;
  }
}

async function createAdminUser(event) {
  event.preventDefault();
  if (!els.adminCreateUserForm) return;
  els.adminCreateUserButton.disabled = true;
  els.adminUsersOutput.textContent = 'Creating user...';
  try {
    const data = await api('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        username: els.adminUserUsername.value.trim(),
        password: els.adminUserPassword.value,
      }),
    });
    els.adminUsersOutput.textContent = `Created user: ${data.user?.username || data.user?.email || els.adminUserUsername.value.trim()}`;
    els.adminUserPassword.value = '';
  } catch (error) {
    els.adminUsersOutput.textContent = error.message;
  } finally {
    els.adminCreateUserButton.disabled = false;
  }
}

async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    printOutput(error.message);
  } finally {
    showLogin();
  }
}

function printOutput(payload) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  if (els.output) {
    els.output.textContent = text;
    return;
  }
  if (els.jobOutput) {
    els.jobOutput.textContent = text;
  }
}

function printJobOutput(payload) {
  if (!els.jobOutput) return;
  els.jobOutput.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
}

function setBusy(isBusy) {
  const buttons = [
    els.refreshButton,
    els.selectButton,
    els.refreshJobsButton,
    els.refreshKnowledgeButton,
    els.importKnowledgeButton,
    els.newKnowledgeDocumentButton,
    els.syncSupabaseButton,
  ];

  buttons.forEach((button) => {
    button.disabled = isBusy;
  });

  if (!isBusy) {
    applyActionAvailability();
  }
}

function applyActionAvailability() {
  const source = state.selectedProject?.knowledge_source || { type: 'local' };
  const isGit = source.type === 'git';
  els.startArticleButton.disabled = !state.selectedProject;
  els.refreshKnowledgeButton.disabled = !state.selectedProject;
  els.importKnowledgeButton.disabled = !state.selectedProject;
  els.newKnowledgeDocumentButton.disabled = !state.selectedProject;
  els.syncSupabaseButton.disabled = !state.selectedProject;
  applyArtifactAvailability();
}

function resetKnowledgeState(message = '') {
  state.knowledgeFiles = [];
  state.knowledgeDocuments = [];
  state.knowledgeStats = null;
  state.keywordPool = null;
  state.selectedKnowledgePath = null;
  state.selectedKnowledgeDocumentId = null;
  state.selectedKnowledgeDocument = null;
  state.selectedKnowledgeFile = null;
  state.selectedKnowledgeChunks = [];
  state.knowledgeCurrentDir = '';
  if (els.knowledgeFileList) {
    els.knowledgeFileList.innerHTML = '';
  }
  if (els.knowledgeMeta) {
    els.knowledgeMeta.textContent = message;
  }
  if (els.knowledgeRendered) {
    els.knowledgeRendered.innerHTML = '';
  }
  if (els.keywordPoolList) {
    els.keywordPoolList.innerHTML = '';
  }
  if (els.keywordPoolHistory) {
    els.keywordPoolHistory.innerHTML = '';
  }
  if (els.keywordPoolSummary) {
    setBadge(els.keywordPoolSummary, '-', '');
  }
}

function resetWritingState(message = 'Select an article job to view the workflow artifacts.') {
  state.jobs = [];
  state.selectedJobId = null;
  state.selectedJob = null;
  state.selectedArtifactType = null;
  state.selectedArtifact = null;
  state.selectedArtifactContent = '';
  state.selectedArtifactJobId = null;
  state.expandedArtifactType = null;
  state.artifactAutoExpanded = false;
  state.imagePlan = null;
  state.pendingImages = {};
  renderJobs();
  renderSelectedJob();
  printJobOutput(message);
}

function renderDetails(container, rows) {
  container.innerHTML = '';
  rows.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value === undefined || value === null || value === '' ? '-' : String(value);
    container.append(dt, dd);
  });
}

function getKnowledgeStageLabel(stage) {
  const labels = {
    concept: '大纲阶段',
    draft: '正文阶段',
    knowledge: '知识库',
  };
  return labels[stage] || stage || '知识库';
}

function getKnowledgeReasonLabel(reason) {
  const labels = {
    always_load: '固定引用',
    keyword_match: '关键词匹配',
    priority_match: '高优先级匹配',
    chunk_match: '片段匹配',
    legacy_default: '默认知识库',
    matched: '已匹配',
  };
  return labels[reason] || reason || '已匹配';
}

function renderKnowledgeUsage(knowledge, files = {}) {
  if (!knowledge) {
    return `
      <div class="knowledge-usage-empty">
        等待本次任务生成知识库引用记录。
      </div>
    `;
  }

  const stages = knowledge.stages || {};
  const stageEntries = Object.entries(stages)
    .filter(([, entries]) => Array.isArray(entries) && entries.length > 0);
  const statusLabel = knowledge.status === 'passed' ? '已引用' : '未引用';
  const statusTone = knowledge.status === 'passed' ? 'success' : 'danger';
  const traceFile = knowledge.trace_file || files.knowledge_trace || '';

  const stageHtml = stageEntries.length
    ? stageEntries.map(([stage, entries]) => `
      <div class="knowledge-usage-stage">
        <div class="knowledge-usage-stage-title">${escapeHtml(getKnowledgeStageLabel(stage))}</div>
        <div class="knowledge-usage-list">
          ${entries.map((entry) => {
            const label = entry.path || entry.title || entry.id || '知识库文件';
            const meta = [
              entry.source,
              getKnowledgeReasonLabel(entry.reason),
              entry.chars ? `${entry.chars} 字符` : '',
              entry.updated_at ? `最后修改 ${formatKnowledgeTime(entry.updated_at)}` : '',
            ].filter(Boolean).join(' · ');
            return `
              <div class="knowledge-usage-item">
                <strong>${escapeHtml(label)}</strong>
                <span>${escapeHtml(meta || '已记录引用')}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('')
    : `
      <div class="knowledge-usage-warning">
        本次生成没有记录到知识库引用。流程应被阻断，请先完善当前项目知识库后重试。
      </div>
    `;

  return `
    <div class="knowledge-usage-header">
      <div>
        <strong>知识库引用</strong>
        <span>${knowledge.required ? '每次生成强制引用' : '可选引用'} · ${knowledge.total_sources || 0} 个来源 · ${knowledge.total_chars || 0} 字符</span>
      </div>
      <span class="badge ${statusTone}">${statusLabel}</span>
    </div>
    ${stageHtml}
    ${traceFile ? `<div class="knowledge-usage-trace">记录文件：${escapeHtml(traceFile)}</div>` : ''}
  `;
}

function renderSystemSettings() {
  const config = state.systemConfig;
  if (!config || !els.settingsForm) return;
  const groups = new Map();
  (config.fields || []).forEach((field) => {
    if (!groups.has(field.group)) groups.set(field.group, []);
    groups.get(field.group).push(field);
  });

  els.settingsForm.innerHTML = [...groups.entries()].map(([group, fields]) => `
    <fieldset class="settings-group">
      <legend>${escapeHtml(group)}</legend>
      <div class="settings-grid">
        ${fields.map((field) => {
          const inputType = field.secret ? 'password' : (field.type || 'text');
          const value = field.secret ? '' : (field.value || field.fallback || '');
          const hint = field.secret
            ? (field.configured ? `已配置：${field.masked_value}，留空表示不修改。` : '未配置。保存时可填写新值。')
            : field.readonly
              ? '系统内置，不允许在页面修改。'
              : (field.placeholder ? `示例：${field.placeholder}` : '保存后立即用于后续任务。');
          const helpLink = field.help_url
            ? `<a class="settings-help-link" href="${escapeHtml(field.help_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(field.help_label || '官网')}</a>`
            : '';
          const options = Array.isArray(field.options) ? field.options : [];
          const control = field.readonly
            ? `<div class="settings-readonly" aria-label="${escapeHtml(field.label)}">${escapeHtml(value)}</div>`
            : field.type === 'select'
              ? `<select data-config-key="${escapeHtml(field.key)}">${options.map((option) => `<option value="${escapeHtml(option)}" ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select>`
              : field.multiline
                ? `<textarea data-config-key="${escapeHtml(field.key)}" rows="3" placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(value)}</textarea>`
                : `<input data-config-key="${escapeHtml(field.key)}" type="${escapeHtml(inputType)}" value="${escapeHtml(value)}" data-original-value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || '')}" autocomplete="off">`;
          const controlRow = field.requires_confirm
            ? `<div class="settings-control-row">
                ${control}
                <button class="settings-confirm-button" type="button" data-confirm-key="${escapeHtml(field.key)}">确认</button>
              </div>`
            : control;
          return `
            <label class="field settings-field">
              <span>${escapeHtml(field.label)} ${field.required ? '<strong>必填</strong>' : '<em>选填</em>'}</span>
              ${controlRow}
              <small>${escapeHtml(hint)} ${helpLink}<span class="settings-confirm-status" data-confirm-status="${escapeHtml(field.key)}">${field.requires_confirm ? '未确认' : ''}</span></small>
            </label>
          `;
        }).join('')}
      </div>
    </fieldset>
  `).join('');

  els.settingsForm.querySelectorAll('[data-confirm-key]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.confirmKey;
      const input = els.settingsForm.querySelector(`[data-config-key="${CSS.escape(key)}"]`);
      const status = els.settingsForm.querySelector(`[data-confirm-status="${CSS.escape(key)}"]`);
      if (!input || !input.value.trim()) {
        if (status) status.textContent = '请先填写';
        return;
      }
      input.dataset.confirmed = 'true';
      button.textContent = '已确认';
      if (status) status.textContent = '已确认';
    });
  });

  els.settingsForm.querySelectorAll('[data-config-key]').forEach((input) => {
    input.addEventListener('input', () => {
      if (!input.closest('.settings-field')?.querySelector('[data-confirm-key]')) return;
      input.dataset.confirmed = 'false';
      const key = input.dataset.configKey;
      const button = els.settingsForm.querySelector(`[data-confirm-key="${CSS.escape(key)}"]`);
      const status = els.settingsForm.querySelector(`[data-confirm-status="${CSS.escape(key)}"]`);
      if (button) button.textContent = '确认';
      if (status) status.textContent = input.value.trim() ? '未确认' : '未填写';
    });
  });

  els.settingsOutput.textContent = `配置文件：${config.path}`;
}

function formatImageParams(model) {
  if (!model) return '自动按可用模型顺序尝试';
  const params = state.imageModelParams?.[model] || {};
  const entries = Object.entries(params)
    .filter(([key, value]) => key !== 'model' && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${value}`);
  return entries.length ? entries.join(' · ') : '参数随模型默认设置';
}

function openImageLightbox(url, label) {
  if (!url || !els.imageLightbox || !els.imageLightboxImg) return;
  els.imageLightboxImg.src = url;
  els.imageLightboxImg.alt = label || 'image preview';
  els.imageLightbox.hidden = false;
}

function closeImageLightbox() {
  if (!els.imageLightbox || !els.imageLightboxImg) return;
  els.imageLightbox.hidden = true;
  els.imageLightboxImg.src = '';
}

async function loadSystemSettings() {
  els.settingsOutput.textContent = 'Loading settings...';
  const data = await api('/api/settings/system');
  state.systemConfig = data.config;
  renderSystemSettings();
}

async function loadRuntimeSettings() {
  try {
    const data = await api('/api/settings/runtime');
    state.runtimeConfig = data || null;
  } catch (error) {
    state.runtimeConfig = null;
  }
}

async function saveSystemSettings(event) {
  event.preventDefault();
  const values = {};
  const fieldsByKey = new Map((state.systemConfig?.fields || []).map((field) => [field.key, field]));
  for (const input of els.settingsForm.querySelectorAll('[data-config-key]')) {
    const field = fieldsByKey.get(input.dataset.configKey);
    if (!field) continue;
    const value = input.value.trim();
    if (field.required && field.secret && !field.configured && !value) {
      els.settingsOutput.textContent = `${field.label} 为必填，请填写后确认。`;
      return;
    }
    const changed = field.secret ? Boolean(value) : value !== String(input.dataset.originalValue || '').trim();
    if (field.requires_confirm && value && changed && input.dataset.confirmed !== 'true') {
      els.settingsOutput.textContent = `${field.label} 已填写但未确认，请点击“确认”。`;
      return;
    }
  }
  els.settingsForm.querySelectorAll('[data-config-key]').forEach((input) => {
    values[input.dataset.configKey] = input.value;
  });

  els.saveSettingsButton.disabled = true;
  els.settingsOutput.textContent = 'Saving settings...';
  try {
    const data = await api('/api/settings/system', {
      method: 'POST',
      body: JSON.stringify({ values }),
    });
    state.systemConfig = data.config;
    renderSystemSettings();
    els.settingsOutput.textContent = data.hot_reloaded
      ? '已保存并热更新。后续新任务会使用最新配置。'
      : '已保存。';
  } catch (error) {
    els.settingsOutput.textContent = error.message;
  } finally {
    els.saveSettingsButton.disabled = false;
  }
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function formatKnowledgeTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatKeywordUsageLabel(item) {
  if (!item) return '';
  const pieces = [];
  if (item.count > 0) pieces.push(`做过 ${item.count} 次`);
  if (item.last_used_at) pieces.push(`最近 ${formatKnowledgeTime(item.last_used_at)}`);
  return pieces.join(' · ') || '未做过';
}

function renderKeywordPool() {
  const panel = els.keywordPoolPanel;
  if (!panel) return;

  if (!state.selectedProjectId) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;
  const pool = state.keywordPool || { keywords: [], history: [], stats: {} };
  const keywords = Array.isArray(pool.keywords) ? pool.keywords : [];
  const history = Array.isArray(pool.history) ? pool.history : [];
  const visibleKeywords = state.keywordPoolExpanded ? keywords : keywords.slice(0, 3);
  const visibleHistory = state.keywordPoolExpanded ? history : history.slice(0, 3);
  const total = keywords.length;
  const used = keywords.filter((item) => Number(item.count || 0) > 0).length;
  const recent = keywords
    .filter((item) => item.last_used_at)
    .sort((a, b) => String(b.last_used_at || '').localeCompare(String(a.last_used_at || '')))[0];

  if (els.keywordPoolSummary) {
    const label = total
      ? `${used}/${total} 已做过${recent?.last_used_at ? ` · 最近 ${formatKnowledgeTime(recent.last_used_at)}` : ''}`
      : '未配置关键词';
    setBadge(els.keywordPoolSummary, label, used < total ? 'warning' : 'success');
  }

  if (els.keywordPoolToggleButton) {
    els.keywordPoolToggleButton.hidden = total <= 3 && history.length <= 3;
    els.keywordPoolToggleButton.textContent = state.keywordPoolExpanded ? '收起' : `展开全部 ${total}`;
  }

  if (els.keywordPoolList) {
    els.keywordPoolList.innerHTML = keywords.length
      ? visibleKeywords.map((item) => {
        const tone = Number(item.count || 0) > 0 ? 'success' : 'warning';
        const label = item.keyword || item.keyword_normalized || '-';
        const meta = formatKeywordUsageLabel(item);
        return `
          <button class="keyword-pool-item ${item.count > 0 ? 'used' : 'unused'}" type="button" data-keyword="${escapeHtml(label)}">
            <span class="keyword-pool-title">${escapeHtml(label)}</span>
            <span class="keyword-pool-meta">${escapeHtml(meta)}</span>
            <span class="badge ${tone}">${item.count > 0 ? '已做' : '待做'}</span>
          </button>
        `;
      }).join('')
      : '<div class="job-meta">当前项目还没有关键词池。先在 Core/target-keywords.md 里填写。</div>';

    els.keywordPoolList.querySelectorAll('[data-keyword]').forEach((button) => {
      button.addEventListener('click', () => {
        els.articleKeyword.value = button.dataset.keyword || '';
        els.articleKeyword.focus();
      });
    });
  }

  if (els.keywordPoolHistory) {
    els.keywordPoolHistory.innerHTML = visibleHistory.length
      ? visibleHistory.map((entry) => `
        <div class="keyword-history-item">
          <strong>${escapeHtml(entry.keyword || '-')}</strong>
          <span>${escapeHtml([entry.title, entry.status, formatKnowledgeTime(entry.finished_at)].filter(Boolean).join(' · '))}</span>
        </div>
      `).join('')
      : '<div class="job-meta">暂无关键词使用记录。</div>';
  }
}

function normalizeMarketInput(value, fallback = '') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const normalized = raw.toLowerCase().replace(/[\s_-]+/g, '');
  const aliases = {
    ch: '中国',
    cn: '中国',
    china: '中国',
    chinese: '中国',
    mainlandchina: '中国',
    prc: '中国',
    '中国': '中国',
    '中國': '中国',
    us: '美国',
    usa: '美国',
    unitedstates: '美国',
    america: '美国',
    '美国': '美国',
    '美國': '美国',
    uk: '英国',
    gb: '英国',
    unitedkingdom: '英国',
  };
  return aliases[normalized] || raw;
}

function getKnowledgeModelName() {
  return state.runtimeConfig?.knowledge_model
    || state.runtimeConfig?.ai_model
    || state.systemConfig?.fields?.find((field) => field.key === 'AI_MODEL')?.value
    || '当前模型';
}

function getKnowledgeOptimizeButtonLabel() {
  return `模型优化 · ${getKnowledgeModelName()}`;
}

function splitKnowledgePath(filePath) {
  return String(filePath || '').split(/[\\/]+/).filter(Boolean);
}

function joinKnowledgePath(parts) {
  return parts.filter(Boolean).join('/');
}

const requiredKnowledgeSteps = [
  {
    step: '1',
    title: '1. 项目身份与事实边界',
    logic: '在生成大纲和正文前，先确定项目是谁、写给谁、哪些事实不能编造。',
    items: [
      {
        key: 'project-identity',
        label: '项目身份规则',
        preferredPaths: ['Core/project-identity.md'],
        type: 'project_identity',
        category: 'core',
        alwaysLoad: true,
        appliesTo: ['concept', 'draft'],
        matchTerms: ['project-identity', '项目身份', '站点定位', '品牌边界'],
        description: '站点定位、目标用户、默认市场、产品边界和不能偏离的品牌信息。',
        mustInclude: ['站点定位', '目标用户', '市场区域', '产品/品牌介绍', '不能偏离的边界'],
        generator: 'project_identity',
      },
      {
        key: 'brand-voice',
        label: '品牌语气与风格',
        preferredPaths: ['Core/brand-voice.md'],
        type: 'brand_voice',
        category: 'core',
        alwaysLoad: true,
        appliesTo: ['draft'],
        matchTerms: ['brand-voice', '品牌语气', '写作风格', '语气'],
        description: '控制正文语气、表达风格、专业程度、禁用表达和品牌措辞。',
        mustInclude: ['语气', '句式', '专业程度', '禁用词', 'AI 味规避规则'],
      },
      {
        key: 'content-facts',
        label: '内容事实资料',
        preferredPaths: ['Core/content-facts.md'],
        type: 'content_fact',
        category: 'core',
        alwaysLoad: true,
        appliesTo: ['concept', 'draft'],
        matchTerms: ['content-facts', 'product-facts', '产品事实', '资料索引', '文章知识库', '事实边界'],
        description: '产品功能、案例、价格、限制、术语定义和必须引用来源的事实。',
        mustInclude: ['产品功能', '使用限制', '客户案例', '行业术语', '高风险事实来源'],
      },
    ],
  },
  {
    step: '2',
    title: '2. 大纲、意图与 SEO / GEO 规则',
    logic: '生成 concept 时引用这些规则，决定标题结构、搜索意图、FAQ、实体覆盖和 AI 搜索可引用性。',
    items: [
      {
        key: 'outline-rules',
        label: '文章结构 / 大纲规则',
        preferredPaths: ['Core/outline-rules.md'],
        type: 'structure_rule',
        category: 'core',
        alwaysLoad: true,
        appliesTo: ['concept'],
        matchTerms: ['outline-rules', 'structure-rule', '大纲规则', '文章结构'],
        description: '控制 H1/H2/H3、模块顺序、FAQ、CTA 和表格/清单等结构。',
        mustInclude: ['文章类型结构', 'H2/H3 层级', 'FAQ 策略', 'CTA 位置', '表格/清单要求'],
      },
      {
        key: 'intent-rules',
        label: '写作意图规则',
        preferredPaths: [
          'Core/intent-informational.md',
          'Core/intent-commercial.md',
          'Core/intent-transactional.md',
          'Core/intent-navigational.md',
        ],
        requiredMode: 'all',
        type: 'intent_rule',
        category: 'core',
        alwaysLoad: false,
        appliesTo: ['concept'],
        matchTerms: ['intent-informational', 'intent-commercial', 'intent-transactional', 'intent-navigational', '写作意图', '搜索意图'],
        description: '解释 informational / commercial / transactional / navigational 各自应采用的文章重点。',
        mustInclude: ['适用场景', '推荐结构', '正文重点', '不适合的写法'],
      },
      {
        key: 'seo-rules',
        label: 'SEO / AEO 规则',
        preferredPaths: ['Core/seo-rules.md'],
        type: 'seo_rule',
        category: 'core',
        alwaysLoad: true,
        appliesTo: ['concept', 'draft'],
        matchTerms: ['seo-rules', 'aeo-rules', 'SEO', 'AEO', '搜索优化'],
        description: '控制关键词、实体、内链外链、FAQ 和搜索结果可读性。',
        mustInclude: ['主关键词使用', '关键词变体', '实体覆盖', 'FAQ', '内链/外链要求'],
      },
      {
        key: 'geo-rules',
        label: 'GEO / AI 搜索引用规则',
        preferredPaths: ['Core/geo-rules.md'],
        type: 'geo_rule',
        category: 'core',
        alwaysLoad: true,
        appliesTo: ['concept', 'draft'],
        matchTerms: ['geo-rules', 'GEO', 'AI search', 'AI Overview', 'LLM', '引用策略'],
        description: '控制 AI Overview、ChatGPT、Perplexity 等答案引用时更容易提取的表达方式。',
        mustInclude: ['AI 搜索引用策略', '答案段落结构', '实体关系', '可引用定义', '避免空泛总结'],
      },
    ],
  },
  {
    step: '3',
    title: '3. 正文写作与配图规则',
    logic: '生成 draft 和图片时引用这些规则，约束正文表达、封面图、正文配图和视觉风格。',
    items: [
      {
        key: 'writing-rules',
        label: '正文写作规则',
        preferredPaths: ['Core/writing-rules.md'],
        type: 'writing_rule',
        category: 'core',
        alwaysLoad: true,
        appliesTo: ['draft'],
        matchTerms: ['writing-rules', '写作规则', '生成规则库', '正文生成规则'],
        description: '控制段落、句式、禁用词、AI 味规避、口语化程度和正文节奏。',
        mustInclude: ['段落长度', '禁用句式', '禁用词', 'AI 味规避', '标题风格'],
      },
      {
        key: 'image-rules',
        label: '封面与正文配图规则',
        preferredPaths: ['Core/image-rules.md'],
        type: 'image_rule',
        category: 'core',
        alwaysLoad: true,
        appliesTo: ['cover', 'inline'],
        matchTerms: ['image-rules', '配图规则', '封面图', '正文配图', 'visual'],
        description: '控制封面图、正文图、视觉风格、允许元素、禁止元素和模型提示词偏好。',
        mustInclude: ['封面风格', '正文图类型', '禁止元素', '色彩/构图', '模型提示规则'],
      },
      {
        key: 'competitor-rules',
        label: '竞品与差异化规则',
        preferredPaths: ['Core/competitor-rules.md'],
        type: 'competitor_rule',
        category: 'core',
        alwaysLoad: false,
        appliesTo: ['concept', 'draft'],
        matchTerms: ['competitor-rules', '竞品', '差异化', 'Competitors'],
        description: '控制竞品如何比较、哪些维度能比较、哪些表达不能夸大。',
        mustInclude: ['主要竞品', '比较维度', '差异化优势', '不能夸大的说法'],
      },
    ],
  },
  {
    step: '4',
    title: '4. 质量检查、发布与归档规则',
    logic: '文章完成后引用这些规则，决定质检底线、发布字段、归档位置和避免重复选题。',
    items: [
      {
        key: 'quality-rules',
        label: '质量检查规则',
        preferredPaths: ['Core/quality-rules.md'],
        type: 'quality_rule',
        category: 'core',
        alwaysLoad: true,
        appliesTo: ['quality_check'],
        matchTerms: ['quality-rules', '质量检查', '质检', '禁用词', 'quality'],
        description: '定义最低通过分、禁用词、标点限制、格式检查和事实核查要求。',
        mustInclude: ['最低通过分', '禁用词', '标点限制', '事实核查', '格式检查'],
      },
      {
        key: 'publishing-rules',
        label: '发布与导入规则',
        preferredPaths: ['Core/publishing-rules.md'],
        type: 'publishing_rule',
        category: 'core',
        alwaysLoad: true,
        appliesTo: ['publish', 'vault_import'],
        matchTerms: ['publishing-rules', '发布规则', '导入规则', 'frontmatter', 'Published'],
        description: '控制 slug、分类、标签、frontmatter、封面字段、作者和导入目录。',
        mustInclude: ['slug', '分类', '标签', 'frontmatter', '导入目录'],
      },
      {
        key: 'topic-archive-rules',
        label: '选题归档 / 去重规则',
        preferredPaths: ['Topics/topic-index.md'],
        type: 'topic',
        category: 'topics',
        alwaysLoad: false,
        appliesTo: ['concept', 'vault_import'],
        matchTerms: ['topic-index', 'topic key', 'canonical keyword', '选题归档', '去重'],
        description: '记录已写主题、topic key、canonical keyword、发布状态和后续更新计划。',
        mustInclude: ['已写主题', 'topic key', 'canonical keyword', '发布状态', '避免重复选题'],
      },
    ],
  },
];

function getAllRequiredKnowledgeItems() {
  return requiredKnowledgeSteps.flatMap((step) => step.items.map((item) => ({
    ...item,
    step: step.step,
    stepTitle: step.title,
    stepLogic: step.logic,
  })));
}

function findRequiredKnowledgeItem(key) {
  return getAllRequiredKnowledgeItems().find((item) => item.key === key);
}

function normalizeKnowledgeLookup(value) {
  return String(value || '').replace(/\\/g, '/').toLowerCase();
}

function getPreferredKnowledgePaths(item) {
  return Array.isArray(item.preferredPaths) ? item.preferredPaths : [item.preferredPath].filter(Boolean);
}

function pathMatchesPreferredPath(candidatePath, preferredPath) {
  const candidate = normalizeKnowledgeLookup(candidatePath);
  const preferred = normalizeKnowledgeLookup(preferredPath);
  return candidate === preferred || candidate.endsWith(`/${preferred}`) || candidate.endsWith(`/${preferred.split('/').pop()}`);
}

function normalizeKnowledgeMetadataValues(metadata = {}) {
  const collect = (value) => Array.isArray(value) ? value : [value];
  return [
    metadata.type,
    metadata.scope,
    metadata.priority,
    ...collect(metadata.keywords),
    ...collect(metadata.tags),
    ...collect(metadata.applies_to || metadata.appliesTo),
  ].filter((value) => value !== undefined && value !== null);
}

function localFileMatchesRequirement(file, item) {
  const pathValue = normalizeKnowledgeLookup(file.path);
  const nameValue = normalizeKnowledgeLookup(file.name);
  const metadataValues = normalizeKnowledgeMetadataValues(file.metadata || {}).map(normalizeKnowledgeLookup);
  const haystack = [pathValue, nameValue, ...metadataValues].join(' ');
  const preferred = getPreferredKnowledgePaths(item);
  if (preferred.some((target) => pathMatchesPreferredPath(pathValue, target) || pathMatchesPreferredPath(nameValue, target))) return true;
  if (item.type && metadataValues.includes(normalizeKnowledgeLookup(item.type))) return true;
  return (item.matchTerms || []).some((term) => haystack.includes(normalizeKnowledgeLookup(term)));
}

function supabaseDocumentMatchesRequirement(doc, item) {
  const haystack = [
    doc.title,
    doc.slug,
    doc.category,
    doc.source_path,
    ...(doc.keywords || []),
    ...(doc.tags || []),
  ].map(normalizeKnowledgeLookup).join(' ');
  const preferred = getPreferredKnowledgePaths(item);
  if (preferred.some((target) => pathMatchesPreferredPath(doc.source_path || doc.title || '', target))) return true;
  return (item.matchTerms || []).some((term) => haystack.includes(normalizeKnowledgeLookup(term)));
}

function getRequirementMatches(item) {
  if (state.knowledgeMode === 'supabase') {
    return (state.knowledgeDocuments || [])
      .filter((doc) => supabaseDocumentMatchesRequirement(doc, item))
      .map((doc) => ({ type: 'supabase', id: doc.id, label: doc.source_path || doc.title || doc.slug || doc.id, raw: doc }));
  }

  return (state.knowledgeFiles || [])
    .filter((file) => localFileMatchesRequirement(file, item))
    .map((file) => ({ type: 'local', path: file.path, label: file.path, raw: file }));
}

function getMissingKnowledgePaths(item, matches) {
  const preferred = getPreferredKnowledgePaths(item);
  if (item.requiredMode === 'all') {
    return preferred.filter((target) => !matches.some((match) => pathMatchesPreferredPath(match.label, target)));
  }
  return matches.length > 0 ? [] : preferred.slice(0, 1);
}

function getRequirementStatus(item) {
  const matches = getRequirementMatches(item);
  const missingPaths = getMissingKnowledgePaths(item, matches);
  let status = 'missing';
  if (matches.length > 0 && missingPaths.length === 0) status = 'exists';
  if (matches.length > 0 && missingPaths.length > 0) status = 'partial';
  return { status, matches, missingPaths };
}

function statusLabel(status) {
  if (status === 'exists') return '已存在';
  if (status === 'partial') return '部分存在';
  return '缺失';
}

function statusTone(status) {
  if (status === 'exists') return 'success';
  if (status === 'partial') return 'warning';
  return 'danger';
}

function getKnowledgeGeneratorLabel(item) {
  const requirement = getRequirementStatus(item);
  return requirement.matches.length ? '模型优化' : '模型生成';
}

function getKnowledgeActionLabel(item) {
  const requirement = getRequirementStatus(item);
  if (requirement.status === 'missing') return '先生成草稿';
  if (requirement.status === 'partial') return '补齐缺失';
  return '继续优化';
}

function getKnowledgeUserInputHint(item) {
  const hints = {
    'project-identity': '填写：品牌/产品是谁、面向谁、默认市场、不能偏离的边界。',
    'brand-voice': '填写：语气、句式、禁用表达、专业程度和品牌措辞。',
    'content-facts': '填写：产品功能、价格/限制、案例、术语和事实来源。',
    'outline-rules': '维护：不同文章类型的大纲结构、FAQ、CTA、表格/清单规则。',
    'intent-rules': '维护：科普、推荐、购买决策、品牌导航各自怎么写。',
    'seo-rules': '维护：关键词、实体、内链外链、FAQ 和搜索结果可读性。',
    'geo-rules': '维护：适合 AI 搜索引用的定义、答案段落和实体关系。',
    'writing-rules': '维护：正文段落、句式、禁用词、AI 味规避和标题风格。',
    'image-rules': '维护：封面图、正文图、视觉风格、禁止元素和提示词偏好。',
    'competitor-rules': '维护：竞品比较维度、差异化优势和不能夸大的说法。',
    'quality-rules': '维护：最低通过分、禁用词、标点、事实核查和格式底线。',
    'publishing-rules': '维护：slug、分类、标签、frontmatter、封面字段和导入目录。',
    'topic-archive-rules': '维护：已写主题、topic key、canonical keyword 和重复选题规则。',
  };
  return hints[item.key] || item.description || '维护该文件在文章生成流程中的规则和事实。';
}

function isFoundationKnowledgeItem(item) {
  return ['project-identity', 'brand-voice', 'content-facts'].includes(item.key);
}

function itemAppliesToLabel(item) {
  const map = {
    concept: '大纲',
    draft: '正文',
    cover: '封面',
    inline: '正文图',
    quality_check: '质检',
    publish: '发布',
    vault_import: '导入',
  };
  return (item.appliesTo || []).map((value) => map[value] || value).join(' / ') || '按需引用';
}

function itemLoadLabel(item) {
  return item.alwaysLoad === false ? '按关键词/阶段匹配' : '默认优先加载';
}

function getKnowledgeMatchPrimary(match) {
  if (!match) return {};
  if (match.type === 'supabase') {
    return {
      documentId: match.id,
      content: match.raw?.content_markdown || match.raw?.content_text || '',
      path: match.raw?.source_path || match.label || '',
      updatedAt: match.raw?.updated_at || '',
    };
  }
  return {
    documentId: '',
    content: match.raw?.content || '',
    path: match.path || match.label || '',
    updatedAt: match.raw?.updated_at || '',
  };
}

function getKnowledgeGenerationDefaults(targetPath) {
  const project = state.selectedProject || {};
  const brandName = project.name || project.id || state.selectedProjectId || '';
  return {
    targetPath: targetPath || 'Core/project-identity.md',
    brandName,
    officialUrl: project.website_url || project.site_url || project.homepage || project.url || '',
    defaultMarket: normalizeMarketInput(project.default_market || '', '中国'),
    defaultLang: project.default_lang || '',
    productKeywords: '',
    notes: project.description || '',
  };
}

function getProjectOfficialUrl() {
  const project = state.selectedProject || {};
  return project.official_url || project.website_url || project.site_url || project.homepage || project.url || '';
}

function scrollKnowledgeEditorIntoView(focusSelector = '') {
  window.requestAnimationFrame(() => {
    const panel = document.querySelector('.knowledge-preview') || els.knowledgeRendered;
    const focusTarget = focusSelector
      ? document.querySelector(focusSelector)
      : document.querySelector('#knowledge-generation-form input, #knowledge-file-form textarea, #knowledge-document-form textarea, .knowledge-preview input, .knowledge-preview textarea, .knowledge-preview select');

    if (panel?.scrollIntoView) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    window.setTimeout(() => {
      if (focusTarget && typeof focusTarget.focus === 'function') {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch (error) {
          focusTarget.focus();
        }
      }
    }, 280);
  });
}
function buildKnowledgeGenerationForm(item, targetPath, options = {}) {
  const defaults = getKnowledgeGenerationDefaults(targetPath);
  const mode = options.mode || 'generate';
  const isOptimize = mode === 'optimize';
  return `
    <form id="knowledge-generation-form" class="knowledge-generation-form">
      <div class="generation-form-header">
        <div>
          <h4>${isOptimize ? '模型优化' : '模型生成'}：${escapeHtml(item.label)}</h4>
          <p>${escapeHtml(item.description || '')}</p>
        </div>
      </div>
      <div class="knowledge-role-grid">
        <div><span>推荐路径</span><strong>${escapeHtml(targetPath || defaults.targetPath)}</strong></div>
        <div><span>引用阶段</span><strong>${escapeHtml(itemAppliesToLabel(item))}</strong></div>
        <div><span>加载方式</span><strong>${escapeHtml(itemLoadLabel(item))}</strong></div>
      </div>
      <div class="form-row two-columns">
        <label class="field">
          <span>官网 URL <em>推荐</em></span>
          <input name="official_url" value="${escapeHtml(defaults.officialUrl)}" placeholder="https://example.com">
          <small>有官网时会抓取同站关键页面；没有官网时只根据项目配置、人工补充和已有内容生成。</small>
        </label>
        <label class="field">
          <span>品牌 / 产品名</span>
          <input name="brand_name" value="${escapeHtml(defaults.brandName)}" required>
        </label>
      </div>
      <div class="form-row three-columns">
        <label class="field">
          <span>目标市场</span>
          <input name="default_market" value="${escapeHtml(defaults.defaultMarket)}" placeholder="us / cn / global">
        </label>
        <label class="field">
          <span>默认语言</span>
          <input name="default_lang" value="${escapeHtml(defaults.defaultLang)}" placeholder="en / zh">
        </label>
        <label class="field">
          <span>保存路径</span>
          <input name="target_path" value="${escapeHtml(defaults.targetPath)}" required>
        </label>
      </div>
      <label class="field">
        <span>产品关键词 / 品牌关键词</span>
        <input name="product_keywords" value="${escapeHtml(defaults.productKeywords)}" placeholder="comma-separated keywords">
        <small>仅用于帮助模型理解范围，不能替代官网事实。</small>
      </label>
      <label class="field">
        <span>人工补充 / 禁止内容</span>
        <textarea name="notes" rows="4" placeholder="目标用户、不能写的内容、产品边界等">${escapeHtml(defaults.notes)}</textarea>
      </label>
      <div class="form-actions generation-actions">
        <button type="submit">生成草稿</button>
        <button id="cancel-knowledge-generation-button" class="secondary-button" type="button">取消</button>
      </div>
      <div class="chunk-summary">${isOptimize ? '模型会保留已有有效规则并补齐缺失项。' : '生成后请检查来源和“不确定信息”，确认无误后再保存。'}</div>
    </form>
  `;
}

const knowledgeBuildSteps = [
  { key: 'created', label: '项目已创建', description: '已保存项目配置和官网地址。' },
  { key: 'crawl', label: '抓取官网', description: '读取官网首页及同站关键页面。' },
  { key: 'search', label: '搜索补充', description: '调用搜索 API 补充公开信息来源。' },
  { key: 'model', label: '模型整理', description: '整理为项目身份规则草稿。' },
  { key: 'confirm', label: '等待确认', description: '请用户检查并确认写入知识库。' },
  { key: 'saved', label: '已写入', description: '已保存为 Core/project-identity.md。' },
];

function renderKnowledgeBuildStatus(activeKey, options = {}) {
  const activeIndex = knowledgeBuildSteps.findIndex((step) => step.key === activeKey);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const failed = options.status === 'failed';
  const done = options.status === 'completed';
  const title = options.title || '知识库构建状态';
  const message = options.message || knowledgeBuildSteps[safeActiveIndex]?.description || '';
  return `
    <div class="knowledge-build-status ${failed ? 'failed' : done ? 'completed' : ''}">
      <div class="knowledge-build-status-header">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(message)}</span>
        </div>
        <span class="badge ${failed ? 'danger' : done ? 'success' : 'warning'}">${failed ? '失败' : done ? '完成' : '进行中'}</span>
      </div>
      <div class="knowledge-build-steps">
        ${knowledgeBuildSteps.map((step, index) => {
          const stateClass = failed && index === safeActiveIndex
            ? 'failed'
            : index < safeActiveIndex || done ? 'done'
              : index === safeActiveIndex ? 'active' : '';
          return `
            <div class="knowledge-build-step ${stateClass}">
              <span>${index + 1}</span>
              <strong>${escapeHtml(step.label)}</strong>
              <small>${escapeHtml(step.description)}</small>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function setKnowledgeBuildStatus(activeKey, options = {}) {
  if (!els.knowledgeRendered) return;
  els.knowledgeRendered.innerHTML = renderKnowledgeBuildStatus(activeKey, options);
}

function startKnowledgeBuildProgress() {
  stopKnowledgeBuildProgress();
  const sequence = [
    { key: 'crawl', delay: 0, message: '正在抓取官网首页和同站关键页面...' },
    { key: 'search', delay: 9000, message: '正在调用搜索 API 补充公司公开信息...' },
    { key: 'model', delay: 18000, message: '正在调用模型整理项目身份规则草稿...' },
  ];
  sequence.forEach((item) => {
    const timer = window.setTimeout(() => {
      setKnowledgeBuildStatus(item.key, { message: item.message });
      els.knowledgeMeta.textContent = item.message;
    }, item.delay);
    state.knowledgeBuildStatusTimer = state.knowledgeBuildStatusTimer || [];
    state.knowledgeBuildStatusTimer.push(timer);
  });
}

function stopKnowledgeBuildProgress() {
  (state.knowledgeBuildStatusTimer || []).forEach((timer) => window.clearTimeout(timer));
  state.knowledgeBuildStatusTimer = [];
}

function renderProjectIdentityConfirmation(result, officialUrl = '') {
  const content = result.content || '';
  const sources = result.sources || [];
  const warnings = result.warnings || [];
  state.selectedKnowledgePath = 'Core/project-identity.md';
  state.selectedKnowledgeDocumentId = null;
  state.selectedKnowledgeDocument = null;
  els.knowledgeMeta.textContent = '请确认新项目基础信息，确认后写入知识库。';
  els.knowledgeRendered.innerHTML = `
    <form id="project-identity-confirm-form" class="knowledge-generation-form">
      ${renderKnowledgeBuildStatus('confirm', {
        title: '知识库构建状态',
        message: '官网和搜索资料已整理为草稿，当前等待用户确认。',
      })}
      <div class="generation-form-header">
        <div>
          <h4>确认项目基础信息</h4>
          <p>系统已根据公司官网和搜索结果生成最基础的项目身份规则。请先检查，再保存到 Core/project-identity.md。</p>
        </div>
      </div>
      <div class="knowledge-reference-note">
        <strong>公司官网：</strong>${escapeHtml(officialUrl || '未填写')}
        ${sources.length ? `<p><strong>引用来源：</strong>${sources.map((url) => escapeHtml(url)).join('、')}</p>` : ''}
        ${warnings.length ? `<p><strong>需要注意：</strong>${warnings.map((item) => escapeHtml(item)).join('；')}</p>` : ''}
      </div>
      <label class="field">
        <span>知识库内容</span>
        <textarea name="content" class="knowledge-document-editor" rows="22">${escapeHtml(content)}</textarea>
      </label>
      <div class="form-actions generation-actions">
        <button type="submit">确认并写入知识库</button>
        <button id="project-identity-preview-button" class="secondary-button" type="button">刷新预览</button>
      </div>
      <div id="project-identity-preview" class="knowledge-render-preview">${renderKnowledgeFilePreview('Core/project-identity.md', content)}</div>
    </form>
  `;

  const form = document.getElementById('project-identity-confirm-form');
  const preview = document.getElementById('project-identity-preview');
  const updatePreview = () => {
    preview.innerHTML = renderKnowledgeFilePreview('Core/project-identity.md', form.elements.content.value);
  };
  document.getElementById('project-identity-preview-button')?.addEventListener('click', updatePreview);
  form.elements.content.addEventListener('input', () => {
    window.clearTimeout(state.knowledgeRenderTimer);
    state.knowledgeRenderTimer = window.setTimeout(updatePreview, 250);
  });
  form.addEventListener('submit', saveProjectIdentityConfirmation);
  renderKnowledgeFiles();
  scrollKnowledgeEditorIntoView('#project-identity-confirm-form textarea[name="content"]');
}

async function generateProjectIdentityFromOfficialSite() {
  if (!state.selectedProjectId) return;
  const officialUrl = getProjectOfficialUrl();
  if (!officialUrl) {
    els.knowledgeMeta.textContent = '当前项目没有配置公司官网，请先在项目设置中补充官网。';
    return;
  }

  setKnowledgeBuildStatus('created', {
    message: '已读取当前项目官网，准备抓取官网内容。',
  });
  els.knowledgeMeta.textContent = '知识库构建已开始：准备抓取官网。';
  startKnowledgeBuildProgress();

  try {
    const identity = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}/kb/generate/project-identity`, {
      method: 'POST',
      body: JSON.stringify({
        official_url: officialUrl,
        brand_name: state.selectedProject?.name || state.selectedProjectId,
        default_market: normalizeMarketInput(state.selectedProject?.default_market || '中国', '中国'),
        default_lang: state.selectedProject?.default_lang || 'zh',
        notes: state.selectedProject?.description || '',
        target_path: 'Core/project-identity.md',
      }),
    });
    stopKnowledgeBuildProgress();
    renderProjectIdentityConfirmation(identity.result, officialUrl);
  } catch (error) {
    stopKnowledgeBuildProgress();
    els.knowledgeMeta.textContent = `基础知识库草稿生成失败：${error.message}`;
    setKnowledgeBuildStatus('model', {
      status: 'failed',
      message: `基础知识库草稿生成失败：${error.message}`,
    });
  }
}

async function saveProjectIdentityConfirmation(event) {
  event.preventDefault();
  if (!state.selectedProjectId) return;
  const form = event.currentTarget;
  const content = form.elements.content.value;
  els.knowledgeMeta.textContent = '正在写入 Core/project-identity.md...';
  try {
    if (state.knowledgeMode === 'supabase') {
      const data = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}/kb/db/document`, {
        method: 'POST',
        body: JSON.stringify({
          title: '项目身份规则',
          category: 'core',
          source_path: 'Core/project-identity.md',
          keywords: ['project-identity', '项目身份', '品牌介绍'],
          tags: ['required-knowledge', 'core'],
          priority: 'high',
          always_load: true,
          content_markdown: content,
          status: 'active',
        }),
      });
      await loadKnowledgeFiles();
      await previewKnowledgeDocument(data.document.id);
      els.knowledgeMeta.textContent = '已写入 Core/project-identity.md，基础知识库构建完成。';
      return;
    }

    const data = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}/kb/file?path=${encodeURIComponent('Core/project-identity.md')}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    await loadKnowledgeFiles();
    await previewKnowledgeFile(data.file.path);
    els.knowledgeMeta.textContent = '已写入 Core/project-identity.md，基础知识库构建完成。';
  } catch (error) {
    els.knowledgeMeta.textContent = error.message;
  }
}

function startKnowledgeGeneration(requiredKey, targetPath, mode = '') {
  const item = findRequiredKnowledgeItem(requiredKey);
  if (!item) return;
  const resolvedMode = mode || (getRequirementStatus(item).matches.length ? 'optimize' : 'generate');
  state.selectedKnowledgeDocumentId = null;
  state.selectedKnowledgeDocument = null;
  state.selectedKnowledgeChunks = [];
  state.selectedKnowledgePath = targetPath || 'Core/project-identity.md';
  state.selectedKnowledgeFile = null;
  els.knowledgeMeta.textContent = `准备${resolvedMode === 'optimize' ? '优化' : '生成'} ${targetPath || 'Core/project-identity.md'}...`;
  els.knowledgeRendered.innerHTML = buildKnowledgeGenerationForm(item, targetPath || 'Core/project-identity.md', { mode: resolvedMode });
  renderKnowledgeFiles();
  document.getElementById('knowledge-generation-form')?.addEventListener('submit', (event) => generateKnowledgeDraft(event, item));
  document.getElementById('cancel-knowledge-generation-button')?.addEventListener('click', () => {
    createRequiredKnowledgeItem(requiredKey, targetPath || 'Core/project-identity.md');
  });
  scrollKnowledgeEditorIntoView('#knowledge-generation-form input[name="official_url"]');
}

async function generateKnowledgeDraft(event, item) {
  event.preventDefault();
  if (!state.selectedProjectId) return;
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const targetPath = form.elements.target_path.value.trim() || 'Core/project-identity.md';
  submitButton.disabled = true;
  submitButton.textContent = '模型处理中...';
  state.generatingKnowledgeKey = item.key;
  const requirement = getRequirementStatus(item);
  const primaryMatch = getKnowledgeMatchPrimary(requirement.matches[0]);
  const isOptimize = Boolean(primaryMatch.content || primaryMatch.documentId);
  els.knowledgeMeta.textContent = `正在${isOptimize ? '优化' : '生成'} ${targetPath}...`;
  setKnowledgeBuildStatus('model', {
    title: `${isOptimize ? '模型优化' : '模型生成'}进行中`,
    message: `正在处理 ${targetPath}，完成后会展示可编辑草稿。`,
  });
  try {
    await runKnowledgeGeneration(item, targetPath, {
      officialUrl: form.elements.official_url.value.trim(),
      brandName: form.elements.brand_name.value.trim(),
      defaultMarket: normalizeMarketInput(form.elements.default_market.value, '中国'),
      defaultLang: form.elements.default_lang.value.trim(),
      productKeywords: form.elements.product_keywords.value.trim(),
      notes: form.elements.notes.value.trim(),
      documentId: primaryMatch.documentId || '',
      currentContent: primaryMatch.content || '',
      mode: isOptimize ? 'optimize' : 'generate',
    });
  } catch (error) {
    els.knowledgeMeta.textContent = error.message;
    setKnowledgeBuildStatus('model', {
      status: 'failed',
      title: '模型处理失败',
      message: error.message,
    });
    submitButton.disabled = false;
    submitButton.textContent = '生成草稿';
  } finally {
    state.generatingKnowledgeKey = '';
  }
}

async function runKnowledgeGeneration(item, targetPath, options = {}) {
  if (!state.selectedProjectId) return;
  state.generatingKnowledgeKey = item.key;
  els.knowledgeMeta.textContent = `正在${options.mode === 'optimize' ? '优化' : '生成'} ${targetPath}...`;
  setKnowledgeBuildStatus('model', {
    title: `${options.mode === 'optimize' ? '模型优化' : '模型生成'}进行中`,
    message: `正在处理 ${targetPath}，请等待返回草稿。`,
  });
  const data = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}/kb/generate/knowledge-file`, {
    method: 'POST',
    body: JSON.stringify({
      official_url: options.officialUrl || '',
      brand_name: options.brandName || (state.selectedProject?.name || ''),
      default_market: normalizeMarketInput(options.defaultMarket || (state.selectedProject?.default_market || ''), '中国'),
      default_lang: options.defaultLang || (state.selectedProject?.default_lang || ''),
      target_path: targetPath,
      product_keywords: options.productKeywords || '',
      notes: options.notes || '',
      document_id: options.documentId || '',
      current_content: options.currentContent || '',
      item: {
        key: item.key,
        label: item.label,
        type: item.type,
        category: item.category,
        alwaysLoad: item.alwaysLoad,
        appliesTo: item.appliesTo || [],
        description: item.description,
        logic: item.logic || item.stepLogic || '',
        mustInclude: item.mustInclude || [],
      },
    }),
  });
  const result = data.result || {};
  const warningText = (result.warnings || []).length ? ` · 警告：${result.warnings.join('；')}` : '';
  els.knowledgeMeta.textContent = `已${result.mode === 'optimize' ? '优化' : '生成'}草稿：${result.target_path || targetPath} · ${result.model || 'AI model'}${warningText}`;
  if (state.knowledgeMode === 'supabase') {
    state.selectedKnowledgePath = null;
    state.selectedKnowledgeDocumentId = options.documentId || null;
    state.selectedKnowledgeDocument = {
      ...(options.documentId && state.selectedKnowledgeDocument ? state.selectedKnowledgeDocument : {}),
      id: options.documentId || '',
      title: item.label,
      category: item.category || 'core',
      source_path: result.target_path || targetPath,
      keywords: item.matchTerms || [],
      tags: ['required-knowledge', item.type || 'rule', 'generated-draft'],
      priority: 'high',
      always_load: item.alwaysLoad !== false,
      content_markdown: result.content || '',
    };
    state.selectedKnowledgeChunks = [];
    renderKnowledgeFiles();
    renderKnowledgeDocumentEditor();
    scrollKnowledgeEditorIntoView('#knowledge-document-form textarea[name="content_markdown"]');
    return;
  }
  state.selectedKnowledgeDocumentId = null;
  state.selectedKnowledgeDocument = null;
  state.selectedKnowledgePath = result.target_path || targetPath;
  state.selectedKnowledgeFile = {
    path: result.target_path || targetPath,
    readable: true,
    size: (result.content || '').length,
    updated_at: '模型生成，未保存',
    content: result.content || '',
    is_new: true,
  };
  renderKnowledgeFiles();
  renderKnowledgeFileEditor(state.selectedKnowledgeFile);
  scrollKnowledgeEditorIntoView('#knowledge-file-form textarea[name="content"]');
}
function buildRequiredKnowledgeTemplate(item, targetPath) {
  const appliesTo = (item.appliesTo || ['concept', 'draft']).map((value) => `  - ${value}`).join('\n');
  const mustInclude = (item.mustInclude || []).map((value) => `- ${value}`).join('\n');
  return `---\ntype: ${item.type || 'writing_rule'}\nscope: core\npriority: high\nalways_load: ${item.alwaysLoad === false ? 'false' : 'true'}\napplies_to:\n${appliesTo}\n---\n\n# ${item.label}\n\n## 规则用途\n\n${item.description}\n\n## 知识库引用逻辑\n\n${item.logic || '生成文章时按项目、关键词、优先级和 always_load 规则引用。'}\n\n## 必须维护的内容\n\n${mustInclude || '- 补充该规则需要约束的内容。'}\n\n## 当前规则\n\n- 在这里写入 ${targetPath} 的具体要求。\n- 不要写内部流程说明给最终读者；这里只写生成系统应该遵守的约束。\n`;
}

function renderRequiredKnowledgeSteps() {
  if (!els.requiredKnowledgeSteps) return;
  if (!state.selectedProjectId) {
    els.requiredKnowledgeSteps.innerHTML = '<div class="job-meta">请选择项目后查看必需知识库。</div>';
    if (els.requiredKnowledgeSummary) setBadge(els.requiredKnowledgeSummary, '-', '');
    return;
  }

  let total = 0;
  let ready = 0;
  let partial = 0;
  const allItems = getAllRequiredKnowledgeItems();
  allItems.forEach((item) => {
    total += 1;
    const requirement = getRequirementStatus(item);
    if (requirement.status === 'exists') ready += 1;
    if (requirement.status === 'partial') partial += 1;
  });

  const missing = total - ready - partial;
  const percent = total ? Math.round(((ready + partial * 0.5) / total) * 100) : 0;
  const nextItem = allItems.find((item) => getRequirementStatus(item).status !== 'exists');
  const nextRequirement = nextItem ? getRequirementStatus(nextItem) : null;
  const nextTarget = nextRequirement ? (nextRequirement.missingPaths[0] || getKnowledgeMatchPrimary(nextRequirement.matches[0]).path || getPreferredKnowledgePaths(nextItem)[0] || '') : '';
  const nextOpenButton = nextRequirement?.matches?.[0]
    ? (nextRequirement.matches[0].type === 'supabase'
      ? `<button class="knowledge-link-button" type="button" data-knowledge-action="open-doc" data-doc-id="${escapeHtml(nextRequirement.matches[0].id)}">打开文件</button>`
      : `<button class="knowledge-link-button" type="button" data-knowledge-action="open-file" data-path="${escapeHtml(nextRequirement.matches[0].path)}">打开文件</button>`)
    : '';
  const nextAddButton = nextRequirement?.missingPaths?.[0]
    ? `<button class="secondary-button knowledge-add-button" type="button" data-knowledge-action="create-required" data-required-key="${escapeHtml(nextItem.key)}" data-path="${escapeHtml(nextTarget)}">手动填写</button>`
    : '';

  const foundationCards = allItems.filter(isFoundationKnowledgeItem).map((item) => {
    const requirement = getRequirementStatus(item);
    const preferredPaths = getPreferredKnowledgePaths(item);
    const primaryMatch = getKnowledgeMatchPrimary(requirement.matches[0]);
    const openButton = requirement.matches[0]
      ? (requirement.matches[0].type === 'supabase'
        ? `<button class="knowledge-link-button" type="button" data-knowledge-action="open-doc" data-doc-id="${escapeHtml(requirement.matches[0].id)}">打开</button>`
        : `<button class="knowledge-link-button" type="button" data-knowledge-action="open-file" data-path="${escapeHtml(requirement.matches[0].path)}">打开</button>`)
      : '';
    const addButton = requirement.missingPaths[0]
      ? `<button class="secondary-button knowledge-add-button" type="button" data-knowledge-action="create-required" data-required-key="${escapeHtml(item.key)}" data-path="${escapeHtml(requirement.missingPaths[0])}">手动填写</button>`
      : '';
    const officialGenerateButton = item.key === 'project-identity' && getProjectOfficialUrl()
      ? `<button class="secondary-button knowledge-generate-button" type="button" data-knowledge-action="generate-project-identity">抓取官网生成</button>`
      : '';

    return `
      <article class="knowledge-foundation-card ${requirement.status}">
        <div class="knowledge-card-top">
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <p>${escapeHtml(getKnowledgeUserInputHint(item))}</p>
          </div>
          <span class="badge ${statusTone(requirement.status)}">${statusLabel(requirement.status)}</span>
        </div>
        <div class="knowledge-card-path">${escapeHtml(preferredPaths.join(' / '))}</div>
        <div class="knowledge-card-updated">最后修改：${escapeHtml(formatKnowledgeTime(primaryMatch.updatedAt))}</div>
        <div class="knowledge-card-actions">
          ${officialGenerateButton}
          ${openButton}
          ${addButton}
        </div>
      </article>
    `;
  }).join('');

  const maintenanceRows = allItems.filter((item) => !isFoundationKnowledgeItem(item)).map((item) => {
    const requirement = getRequirementStatus(item);
    const preferredPaths = getPreferredKnowledgePaths(item);
    const primaryMatch = getKnowledgeMatchPrimary(requirement.matches[0]);
    const openButton = requirement.matches[0]
      ? (requirement.matches[0].type === 'supabase'
        ? `<button class="knowledge-link-button" type="button" data-knowledge-action="open-doc" data-doc-id="${escapeHtml(requirement.matches[0].id)}">打开</button>`
        : `<button class="knowledge-link-button" type="button" data-knowledge-action="open-file" data-path="${escapeHtml(requirement.matches[0].path)}">打开</button>`)
      : '';
    const addButton = requirement.missingPaths[0]
      ? `<button class="secondary-button knowledge-add-button" type="button" data-knowledge-action="create-required" data-required-key="${escapeHtml(item.key)}" data-path="${escapeHtml(requirement.missingPaths[0])}">添加</button>`
      : '';
    return `
      <tr class="${requirement.status}">
        <td>
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(getKnowledgeUserInputHint(item))}</span>
        </td>
        <td>${escapeHtml(itemAppliesToLabel(item))}</td>
        <td>${escapeHtml(itemLoadLabel(item))}</td>
        <td><span class="badge ${statusTone(requirement.status)}">${statusLabel(requirement.status)}</span></td>
        <td>${escapeHtml(formatKnowledgeTime(primaryMatch.updatedAt))}</td>
        <td class="knowledge-table-actions">
          ${openButton}
          ${addButton}
        </td>
      </tr>
    `;
  }).join('');

  els.requiredKnowledgeSteps.innerHTML = `
    <div class="knowledge-setup-summary">
      <div>
        <span>搭建进度</span>
        <strong>${ready}/${total} 已完成</strong>
        <p>${partial ? `${partial} 个部分完成，` : ''}${missing} 个待补齐。基础资料补齐后再开始批量写作更稳。</p>
      </div>
      <div class="knowledge-progress-bar"><span style="width: ${percent}%"></span></div>
    </div>
    ${nextItem ? `
      <div class="knowledge-next-step">
        <div>
          <span>建议下一步</span>
          <strong>${escapeHtml(nextItem.label)}</strong>
          <p>${escapeHtml(getKnowledgeUserInputHint(nextItem))}</p>
        </div>
        <div class="knowledge-card-actions">${nextOpenButton}${nextAddButton}</div>
      </div>
    ` : `
      <div class="knowledge-next-step complete">
        <div>
          <span>建议下一步</span>
          <strong>基础知识库已完整</strong>
          <p>后续只需要在产品、市场、竞品或写作规则变化时维护对应文件。</p>
        </div>
      </div>
    `}
    <div class="knowledge-section-heading">
      <h4>先填写这 3 个基础资料</h4>
      <p>这些资料会影响所有文章，缺失时最容易导致内容跑偏或编造事实。</p>
    </div>
    <div class="knowledge-foundation-grid">${foundationCards}</div>
    <div class="knowledge-section-heading">
      <h4>后期维护规则</h4>
      <p>这些规则可以逐步补齐，通常在写作效果、配图、质检或发布流程需要调整时维护。</p>
    </div>
    <div class="knowledge-maintenance-table-wrap">
      <table class="knowledge-maintenance-table">
        <thead>
          <tr>
            <th>文件</th>
            <th>影响阶段</th>
            <th>加载方式</th>
            <th>状态</th>
            <th>最后修改</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>${maintenanceRows}</tbody>
      </table>
    </div>
  `;
  if (els.requiredKnowledgeSummary) {
    const label = partial > 0 ? `${ready}/${total} 已完整，${partial} 部分` : `${ready}/${total} 已存在`;
    setBadge(els.requiredKnowledgeSummary, label, missing > 0 || partial > 0 ? 'warning' : 'success');
  }

  els.requiredKnowledgeSteps.querySelectorAll('[data-knowledge-action="open-file"]').forEach((button) => {
    button.addEventListener('click', () => previewKnowledgeFile(button.dataset.path));
  });
  els.requiredKnowledgeSteps.querySelectorAll('[data-knowledge-action="open-doc"]').forEach((button) => {
    button.addEventListener('click', () => previewKnowledgeDocument(button.dataset.docId));
  });
  els.requiredKnowledgeSteps.querySelectorAll('[data-knowledge-action="create-required"]').forEach((button) => {
    button.addEventListener('click', () => createRequiredKnowledgeItem(button.dataset.requiredKey, button.dataset.path));
  });
  els.requiredKnowledgeSteps.querySelectorAll('[data-knowledge-action="generate-required"]').forEach((button) => {
    button.addEventListener('click', () => startKnowledgeGeneration(button.dataset.requiredKey, button.dataset.path));
  });
  els.requiredKnowledgeSteps.querySelectorAll('[data-knowledge-action="generate-project-identity"]').forEach((button) => {
    button.addEventListener('click', generateProjectIdentityFromOfficialSite);
  });
}

function createRequiredKnowledgeItem(requiredKey, targetPath) {
  const item = findRequiredKnowledgeItem(requiredKey);
  if (!item || !targetPath) return;
  const content = buildRequiredKnowledgeTemplate(item, targetPath);
  if (state.knowledgeMode === 'supabase') {
    state.selectedKnowledgePath = null;
    state.selectedKnowledgeFile = null;
    state.selectedKnowledgeDocumentId = null;
    state.selectedKnowledgeDocument = {
      id: '',
      title: item.label,
      category: item.category || 'core',
      source_path: targetPath,
      keywords: item.matchTerms || [],
      tags: ['required-knowledge', item.type || 'rule'],
      priority: 'high',
      always_load: item.alwaysLoad !== false,
      content_markdown: content,
    };
    state.selectedKnowledgeChunks = [];
    renderKnowledgeFiles();
    renderKnowledgeDocumentEditor();
    scrollKnowledgeEditorIntoView('#knowledge-document-form textarea[name="content_markdown"]');
    return;
  }

  state.selectedKnowledgeDocumentId = null;
  state.selectedKnowledgeDocument = null;
  state.selectedKnowledgeChunks = [];
  state.selectedKnowledgePath = targetPath;
  state.selectedKnowledgeFile = {
    path: targetPath,
    readable: true,
    size: 0,
    updated_at: '未保存',
    content,
    is_new: true,
  };
  renderKnowledgeFiles();
  renderKnowledgeFileEditor(state.selectedKnowledgeFile);
  scrollKnowledgeEditorIntoView('#knowledge-file-form textarea[name="content"]');
}

function findKnowledgeItemByPath(filePath) {
  const normalized = normalizeKnowledgeLookup(filePath);
  return getAllRequiredKnowledgeItems().find((item) => {
    return getPreferredKnowledgePaths(item).some((target) => pathMatchesPreferredPath(normalized, target));
  });
}

function fallbackKnowledgeItemForPath(filePath) {
  const name = splitKnowledgePath(filePath).pop() || 'knowledge.md';
  return {
    key: normalizeKnowledgeLookup(name).replace(/\.[^.]+$/, '') || 'custom-knowledge',
    label: name.replace(/\.[^.]+$/, ''),
    type: 'knowledge_rule',
    category: categoryFromKnowledgePath(filePath),
    alwaysLoad: false,
    appliesTo: ['concept', 'draft'],
    description: '当前项目的自定义知识库文件，用于补充文章生成时需要遵守的事实、规则或素材。',
    logic: '生成文章时按项目、关键词、优先级和内容相关性引用。',
    mustInclude: ['文件用途', '适用场景', '具体规则', '禁止或需要人工确认的内容'],
  };
}

function categoryFromKnowledgePath(filePath) {
  const top = splitKnowledgePath(filePath)[0] || '';
  const map = {
    Core: 'core',
    Domain: 'domain',
    Competitors: 'competitors',
    Cases: 'cases',
    Research: 'research',
    Templates: 'templates',
    Topics: 'topics',
  };
  return map[top] || 'domain';
}

async function optimizeOpenKnowledgeFile(filePath, content) {
  const item = findKnowledgeItemByPath(filePath) || fallbackKnowledgeItemForPath(filePath);
  state.selectedKnowledgePath = filePath;
  state.selectedKnowledgeDocumentId = null;
  state.selectedKnowledgeDocument = null;
  await runKnowledgeGeneration(item, filePath, { currentContent: content, mode: 'optimize' });
}

async function optimizeOpenKnowledgeDocument(doc, content) {
  const sourcePath = doc.source_path || doc.title || 'knowledge.md';
  const item = findKnowledgeItemByPath(sourcePath) || {
    ...fallbackKnowledgeItemForPath(sourcePath),
    label: doc.title || fallbackKnowledgeItemForPath(sourcePath).label,
    category: doc.category || fallbackKnowledgeItemForPath(sourcePath).category,
    alwaysLoad: doc.always_load === true,
  };
  state.selectedKnowledgeDocumentId = doc.id || null;
  state.selectedKnowledgePath = null;
  await runKnowledgeGeneration(item, sourcePath, { currentContent: content, documentId: doc.id || '', mode: 'optimize' });
}
function getKnowledgeDirParts() {
  return splitKnowledgePath(state.knowledgeCurrentDir);
}

function setKnowledgeDirectory(directory) {
  state.knowledgeCurrentDir = joinKnowledgePath(splitKnowledgePath(directory));
  renderKnowledgeFiles();
}

function renderKnowledgeDocumentList() {
  const query = els.knowledgeSearch.value.trim().toLowerCase();
  renderKnowledgeBreadcrumb(query || 'Supabase');
  els.knowledgeFileList.innerHTML = '';

  const documents = state.knowledgeDocuments
    .filter((doc) => {
      if (!query || query === 'supabase') return true;
      return [
        doc.title,
        doc.slug,
        doc.category,
        doc.source_path,
        ...(doc.keywords || []),
        ...(doc.tags || []),
      ].some((value) => String(value || '').toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const left = `${a.category || ''}/${a.title || ''}`;
      const right = `${b.category || ''}/${b.title || ''}`;
      return left.localeCompare(right);
    });

  if (documents.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'job-meta';
    empty.textContent = 'No Supabase knowledge documents found.';
    els.knowledgeFileList.appendChild(empty);
    return;
  }

  documents.forEach((doc) => {
    els.knowledgeFileList.appendChild(createKnowledgeDocumentButton(doc));
  });
}

function renderKnowledgeBreadcrumb(query) {
  if (!els.knowledgeBreadcrumb) return;
  els.knowledgeBreadcrumb.innerHTML = '';

  if (query) {
    const label = document.createElement('span');
    label.className = 'knowledge-crumb-current';
    label.textContent = `搜索结果：${query}`;
    els.knowledgeBreadcrumb.appendChild(label);
    return;
  }

  const rootButton = document.createElement('button');
  rootButton.type = 'button';
  rootButton.className = 'knowledge-crumb';
  rootButton.textContent = '知识库';
  rootButton.addEventListener('click', () => setKnowledgeDirectory(''));
  els.knowledgeBreadcrumb.appendChild(rootButton);

  const parts = getKnowledgeDirParts();
  parts.forEach((part, index) => {
    const separator = document.createElement('span');
    separator.className = 'knowledge-crumb-separator';
    separator.textContent = '/';
    els.knowledgeBreadcrumb.appendChild(separator);

    const pathAtIndex = joinKnowledgePath(parts.slice(0, index + 1));
    if (index === parts.length - 1) {
      const current = document.createElement('span');
      current.className = 'knowledge-crumb-current';
      current.textContent = part;
      els.knowledgeBreadcrumb.appendChild(current);
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'knowledge-crumb';
    button.textContent = part;
    button.addEventListener('click', () => setKnowledgeDirectory(pathAtIndex));
    els.knowledgeBreadcrumb.appendChild(button);
  });
}

function createKnowledgeFolderButton(folder) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'knowledge-file-item knowledge-folder-item';
  button.innerHTML = `
    <span class="knowledge-file-name">📁 ${escapeHtml(folder.name)}</span>
    <span class="knowledge-file-meta">${folder.fileCount} 个文件</span>
  `;
  button.addEventListener('click', () => setKnowledgeDirectory(folder.path));
  return button;
}

function createKnowledgeFileButton(file, showDirectory) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `knowledge-file-item ${file.path === state.selectedKnowledgePath ? 'active' : ''}`.trim();
  const meta = showDirectory
    ? `${file.directory || '知识库'} · ${formatSize(file.size)}`
    : `${formatSize(file.size)} · ${file.extension || 'file'}`;
  button.innerHTML = `
    <span class="knowledge-file-name">📄 ${escapeHtml(file.name)}</span>
    <span class="knowledge-file-meta">${escapeHtml(meta)}</span>
  `;
  button.addEventListener('click', () => previewKnowledgeFile(file.path));
  return button;
}

function createKnowledgeDocumentButton(doc) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `knowledge-file-item ${doc.id === state.selectedKnowledgeDocumentId ? 'active' : ''}`.trim();
  const meta = [
    doc.source_path || '根目录',
    doc.category || 'domain',
    doc.priority || 'medium',
    doc.always_load ? 'always load' : '',
    `${Math.ceil(String(doc.content_markdown || doc.content_text || '').length / 1024)} KB`,
  ].filter(Boolean).join(' · ');
  button.innerHTML = `
    <span class="knowledge-file-name">${escapeHtml(doc.title || doc.slug || doc.id)}</span>
    <span class="knowledge-file-meta">${escapeHtml(meta)}</span>
  `;
  button.addEventListener('click', () => previewKnowledgeDocument(doc.id));
  return button;
}

function getSupabaseDocumentPath(doc) {
  return joinKnowledgePath(splitKnowledgePath(doc.source_path || doc.title || doc.slug || ''));
}

function buildSupabaseDocumentDirectoryView(documents, currentDir) {
  const currentParts = splitKnowledgePath(currentDir);
  const currentPrefix = currentDir ? `${currentDir}/` : '';
  const folders = new Map();
  const directDocs = [];

  documents.forEach((doc) => {
    const docPath = getSupabaseDocumentPath(doc);
    const normalizedPath = joinKnowledgePath(splitKnowledgePath(docPath));
    if (currentDir && normalizedPath && !normalizedPath.startsWith(currentPrefix)) return;

    const parts = splitKnowledgePath(normalizedPath);
    const remainder = currentDir ? parts.slice(currentParts.length) : parts;
    if (remainder.length === 0) {
      directDocs.push(doc);
      return;
    }

    if (remainder.length === 1) {
      directDocs.push(doc);
      return;
    }

    const folderName = remainder[0];
    const folderPath = joinKnowledgePath([...currentParts, folderName]);
    const existing = folders.get(folderPath) || { name: folderName, path: folderPath, fileCount: 0 };
    existing.fileCount += 1;
    folders.set(folderPath, existing);
  });

  return {
    folders: [...folders.values()].sort((a, b) => a.name.localeCompare(b.name)),
    docs: directDocs.sort((a, b) => {
      const left = `${getSupabaseDocumentPath(a)}/${a.title || ''}`;
      const right = `${getSupabaseDocumentPath(b)}/${b.title || ''}`;
      return left.localeCompare(right);
    }),
  };
}

function renderKnowledgeDocumentTree() {
  const query = els.knowledgeSearch.value.trim().toLowerCase();
  renderKnowledgeBreadcrumb(query || state.knowledgeCurrentDir || 'Supabase');
  els.knowledgeFileList.innerHTML = '';

  if (query) {
    const documents = state.knowledgeDocuments
      .filter((doc) => {
        return [
          doc.title,
          doc.slug,
          doc.category,
          doc.source_path,
          ...(doc.keywords || []),
          ...(doc.tags || []),
        ].some((value) => String(value || '').toLowerCase().includes(query));
      })
      .sort((a, b) => {
        const left = `${docPathForSort(a)}/${a.title || ''}`;
        const right = `${docPathForSort(b)}/${b.title || ''}`;
        return left.localeCompare(right);
      });

    if (documents.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'job-meta';
      empty.textContent = 'No Supabase knowledge documents found.';
      els.knowledgeFileList.appendChild(empty);
      return;
    }

    documents.forEach((doc) => {
      els.knowledgeFileList.appendChild(createKnowledgeDocumentButton(doc));
    });
    return;
  }

  const { folders, docs } = buildSupabaseDocumentDirectoryView(state.knowledgeDocuments, state.knowledgeCurrentDir);

  if (state.knowledgeCurrentDir) {
    const parentParts = getKnowledgeDirParts().slice(0, -1);
    const upButton = document.createElement('button');
    upButton.type = 'button';
    upButton.className = 'knowledge-file-item knowledge-up-item';
    upButton.innerHTML = `
      <span class="knowledge-file-name">← 返回上级</span>
      <span class="knowledge-file-meta">${parentParts.length ? joinKnowledgePath(parentParts) : '知识库'}</span>
    `;
    upButton.addEventListener('click', () => setKnowledgeDirectory(joinKnowledgePath(parentParts)));
    els.knowledgeFileList.appendChild(upButton);
  }

  if (folders.length === 0 && docs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'job-meta';
    empty.textContent = '当前文件夹没有文档。';
    els.knowledgeFileList.appendChild(empty);
    return;
  }

  folders.forEach((folder) => els.knowledgeFileList.appendChild(createKnowledgeFolderButton(folder)));
  docs.forEach((doc) => els.knowledgeFileList.appendChild(createKnowledgeDocumentButton(doc)));
}

function docPathForSort(doc) {
  return joinKnowledgePath(splitKnowledgePath(doc.source_path || doc.title || doc.slug || ''));
}

function buildKnowledgeDirectoryView(files, currentDir) {
  const currentParts = splitKnowledgePath(currentDir);
  const currentPrefix = currentDir ? `${currentDir}/` : '';
  const folders = new Map();
  const directFiles = [];

  files.forEach((file) => {
    const normalizedPath = joinKnowledgePath(splitKnowledgePath(file.path));
    if (currentDir && !normalizedPath.startsWith(currentPrefix)) return;

    const parts = splitKnowledgePath(normalizedPath);
    const remainder = currentDir ? parts.slice(currentParts.length) : parts;
    if (remainder.length === 0) return;

    if (remainder.length === 1) {
      directFiles.push(file);
      return;
    }

    const folderName = remainder[0];
    const folderPath = joinKnowledgePath([...currentParts, folderName]);
    const existing = folders.get(folderPath) || { name: folderName, path: folderPath, fileCount: 0 };
    existing.fileCount += 1;
    folders.set(folderPath, existing);
  });

  return {
    folders: [...folders.values()].sort((a, b) => a.name.localeCompare(b.name)),
    files: directFiles.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function renderKnowledgeFiles() {
  renderRequiredKnowledgeSteps();
  if (state.knowledgeMode === 'supabase') {
    renderKnowledgeDocumentTree();
    return;
  }

  const query = els.knowledgeSearch.value.trim().toLowerCase();
  renderKnowledgeBreadcrumb(query);
  els.knowledgeFileList.innerHTML = '';

  if (query) {
    const files = state.knowledgeFiles
      .filter((file) => file.path.toLowerCase().includes(query))
      .sort((a, b) => a.path.localeCompare(b.path));

    if (files.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'job-meta';
      empty.textContent = 'No knowledge files found.';
      els.knowledgeFileList.appendChild(empty);
      return;
    }

    files.forEach((file) => {
      els.knowledgeFileList.appendChild(createKnowledgeFileButton(file, true));
    });
    return;
  }

  const { folders, files } = buildKnowledgeDirectoryView(state.knowledgeFiles, state.knowledgeCurrentDir);

  if (state.knowledgeCurrentDir) {
    const parentParts = getKnowledgeDirParts().slice(0, -1);
    const upButton = document.createElement('button');
    upButton.type = 'button';
    upButton.className = 'knowledge-file-item knowledge-up-item';
    upButton.innerHTML = `
      <span class="knowledge-file-name">← 返回上级</span>
      <span class="knowledge-file-meta">${parentParts.length ? joinKnowledgePath(parentParts) : '知识库'}</span>
    `;
    upButton.addEventListener('click', () => setKnowledgeDirectory(joinKnowledgePath(parentParts)));
    els.knowledgeFileList.appendChild(upButton);
  }

  if (folders.length === 0 && files.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'job-meta';
    empty.textContent = '当前文件夹没有文件。';
    els.knowledgeFileList.appendChild(empty);
    return;
  }

  folders.forEach((folder) => els.knowledgeFileList.appendChild(createKnowledgeFolderButton(folder)));
  files.forEach((file) => els.knowledgeFileList.appendChild(createKnowledgeFileButton(file, false)));
}

async function loadKnowledgeFiles() {
  if (!state.selectedProjectId) return;
  const projectId = state.selectedProjectId;
  const projectLabel = state.selectedProject?.name || projectId;
  els.knowledgeMeta.textContent = `Loading knowledge files for ${projectLabel}...`;
  try {
    const data = await api(`/api/projects/${encodeURIComponent(projectId)}/kb/db/documents`);
    if (state.selectedProjectId !== projectId) return;
    if (data.enabled) {
      state.knowledgeMode = 'supabase';
      state.knowledgeDocuments = data.documents || [];
      state.knowledgeStats = data.stats || null;
      state.knowledgeCurrentDir = '';
      renderKnowledgeFiles();
      renderKeywordPool();
      if (state.selectedKnowledgeDocumentId) return;
      const stats = state.knowledgeStats || {};
      els.knowledgeMeta.textContent = `${projectLabel} (${projectId}) · ${stats.documents || 0} Supabase documents · ${stats.chunks || 0} chunks.`;
      els.knowledgeRendered.innerHTML = '';
      return;
    }
  } catch (error) {
    if (state.selectedProjectId !== projectId) return;
    state.knowledgeMode = 'local';
    els.knowledgeMeta.textContent = `${projectLabel} (${projectId}) · Supabase unavailable, loading local vault: ${error.message}`;
  }

  state.knowledgeMode = 'local';
  const data = await api(`/api/projects/${encodeURIComponent(projectId)}/kb/files`);
  if (state.selectedProjectId !== projectId) return;
  state.knowledgeFiles = data.files || [];
  renderKnowledgeFiles();
  renderKeywordPool();
  if (state.selectedKnowledgePath) return;
  els.knowledgeMeta.textContent = `${projectLabel} (${projectId}) · ${state.knowledgeFiles.length} local files in knowledge base.`;
  els.knowledgeRendered.innerHTML = '';
}

function renderKnowledgeFilePreview(filePath, content) {
  const lowerPath = String(filePath || '').toLowerCase();
  if (lowerPath.endsWith('.md')) {
    return renderMarkdown(content || '');
  }
  if (lowerPath.endsWith('.json')) {
    try {
      return `<pre><code>${escapeHtml(JSON.stringify(JSON.parse(content || '{}'), null, 2))}</code></pre>`;
    } catch (error) {
      // Fall through to plain text.
    }
  }
  return `<pre><code>${escapeHtml(content || '')}</code></pre>`;
}

function renderKnowledgeFileEditor(file) {
  state.selectedKnowledgeFile = file;
  const savedLabel = file.is_new ? '未保存' : (file.updated_at || '已加载');
  els.knowledgeMeta.textContent = `${file.path} · ${formatSize(file.size || 0)} · ${savedLabel}`;

  if (!file.readable) {
    els.knowledgeRendered.innerHTML = `<pre><code>${escapeHtml(file.message || 'Preview unavailable.')}</code></pre>`;
    return;
  }

  const content = file.content || '';
  els.knowledgeRendered.innerHTML = `
    <form id="knowledge-file-form" class="knowledge-document-form">
      <label class="field">
        <span>File Path</span>
        <input name="path" value="${escapeHtml(file.path || '')}" ${file.is_new ? '' : 'readonly'} required>
        <small>必须位于当前项目 vault 内。推荐使用 Core、Domain、Competitors、Cases、Topics 等目录。</small>
      </label>
      <label class="field">
        <span>Markdown / Text Content</span>
        <textarea name="content" class="knowledge-document-editor" rows="22">${escapeHtml(content)}</textarea>
      </label>
      <div class="form-actions">
        <button type="submit">Save File</button>
        <button id="knowledge-file-ai-button" class="secondary-button knowledge-generate-button" type="button">${escapeHtml(getKnowledgeOptimizeButtonLabel())}</button>
        <button id="knowledge-file-preview-button" class="secondary-button" type="button">Refresh Preview</button>
      </div>
      <div class="chunk-summary">保存后会刷新“生成文章必须引用的知识库”状态；如需同步 Supabase，请再点击 Sync Supabase。</div>
      <div id="knowledge-file-render-preview" class="knowledge-render-preview">${renderKnowledgeFilePreview(file.path, content)}</div>
    </form>
  `;

  const form = document.getElementById('knowledge-file-form');
  const preview = document.getElementById('knowledge-file-render-preview');
  const updatePreview = () => {
    preview.innerHTML = renderKnowledgeFilePreview(form.elements.path.value, form.elements.content.value);
  };
  form.addEventListener('submit', saveKnowledgeFile);
  document.getElementById('knowledge-file-preview-button')?.addEventListener('click', updatePreview);
  document.getElementById('knowledge-file-ai-button')?.addEventListener('click', () => optimizeOpenKnowledgeFile(file.path, form.elements.content.value));
  form.elements.content.addEventListener('input', () => {
    window.clearTimeout(state.knowledgeRenderTimer);
    state.knowledgeRenderTimer = window.setTimeout(updatePreview, 250);
  });
}

async function saveKnowledgeFile(event) {
  event.preventDefault();
  if (!state.selectedProjectId) return;
  const form = event.currentTarget;
  const filePath = form.elements.path.value.trim();
  if (!filePath) {
    els.knowledgeMeta.textContent = 'File path is required.';
    return;
  }

  els.knowledgeMeta.textContent = `Saving ${filePath}...`;
  try {
    const data = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}/kb/file?path=${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      body: JSON.stringify({ content: form.elements.content.value }),
    });
    state.selectedKnowledgePath = data.file.path;
    state.selectedKnowledgeFile = data.file;
    await loadKnowledgeFiles();
    await previewKnowledgeFile(data.file.path);
  } catch (error) {
    els.knowledgeMeta.textContent = error.message;
  }
}

async function previewKnowledgeFile(filePath) {
  if (!state.selectedProjectId || !filePath) return;
  state.selectedKnowledgePath = filePath;
  state.selectedKnowledgeDocumentId = null;
  state.selectedKnowledgeDocument = null;
  state.selectedKnowledgeChunks = [];
  renderKnowledgeFiles();
  els.knowledgeMeta.textContent = `Loading ${filePath}...`;
  els.knowledgeRendered.innerHTML = '';
  try {
    const data = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}/kb/file?path=${encodeURIComponent(filePath)}`);
    renderKnowledgeFileEditor(data.file);
    scrollKnowledgeEditorIntoView('#knowledge-file-form textarea[name="content"]');
  } catch (error) {
    els.knowledgeMeta.textContent = error.message;
  }
}

async function previewKnowledgeDocument(documentId) {
  if (!state.selectedProjectId || !documentId) return;
  state.selectedKnowledgeDocumentId = documentId;
  state.selectedKnowledgePath = null;
  state.selectedKnowledgeFile = null;
  renderKnowledgeFiles();
  els.knowledgeMeta.textContent = `Loading Supabase document...`;
  els.knowledgeRendered.innerHTML = '';

  try {
    const data = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}/kb/db/document?id=${encodeURIComponent(documentId)}`);
    state.selectedKnowledgeDocument = data.document;
    state.selectedKnowledgeChunks = data.chunks || [];
    renderKnowledgeDocumentEditor();
    scrollKnowledgeEditorIntoView('#knowledge-document-form textarea[name="content_markdown"]');
  } catch (error) {
    els.knowledgeMeta.textContent = error.message;
  }
}

function serializeListInput(value) {
  return String(value || '')
    .split(/[,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderKnowledgeDocumentEditor() {
  const doc = state.selectedKnowledgeDocument;
  if (!doc) return;

  els.knowledgeMeta.textContent = [
    doc.title || doc.slug,
    doc.category || 'domain',
    `${state.selectedKnowledgeChunks.length} chunks`,
    doc.updated_at || '',
  ].filter(Boolean).join(' · ');

  const content = doc.content_markdown || doc.content_text || '';
  els.knowledgeRendered.innerHTML = `
    <form id="knowledge-document-form" class="knowledge-document-form">
      <div class="form-row two-columns">
        <label class="field">
          <span>Title</span>
          <input name="title" value="${escapeHtml(doc.title || '')}" required>
        </label>
        <label class="field">
          <span>Category</span>
          <select name="category">
            ${['core', 'domain', 'competitors', 'cases', 'research', 'templates', 'writing_rules'].map((item) => (
              `<option value="${item}" ${item === doc.category ? 'selected' : ''}>${item}</option>`
            )).join('')}
          </select>
        </label>
      </div>
      <label class="field">
        <span>Source Path</span>
        <input name="source_path" value="${escapeHtml(doc.source_path || '')}" placeholder="Core/writing-rules.md">
        <small>用于按推荐知识库路径识别规则是否已存在，例如 Core/image-rules.md。</small>
      </label>
      <div class="form-row two-columns">
        <label class="field">
          <span>Keywords</span>
          <input name="keywords" value="${escapeHtml((doc.keywords || []).join(', '))}">
        </label>
        <label class="field">
          <span>Tags</span>
          <input name="tags" value="${escapeHtml((doc.tags || []).join(', '))}">
        </label>
      </div>
      <div class="form-row two-columns">
        <label class="field">
          <span>Priority</span>
          <select name="priority">
            ${['critical', 'high', 'medium', 'low'].map((item) => (
              `<option value="${item}" ${item === doc.priority ? 'selected' : ''}>${item}</option>`
            )).join('')}
          </select>
        </label>
        <label class="check-field knowledge-check">
          <input name="always_load" type="checkbox" ${doc.always_load ? 'checked' : ''}>
          <span>Always load <small>优先注入所有生成任务。</small></span>
        </label>
      </div>
      <label class="field">
        <span>Markdown Content</span>
        <textarea name="content_markdown" class="knowledge-document-editor" rows="22">${escapeHtml(content)}</textarea>
      </label>
      <div class="form-actions">
        <button type="submit">Save and Reindex</button>
        <button id="knowledge-document-ai-button" class="secondary-button knowledge-generate-button" type="button">${escapeHtml(getKnowledgeOptimizeButtonLabel())}</button>
      </div>
      <div class="chunk-summary">${state.selectedKnowledgeChunks.length} chunks indexed for retrieval.</div>
    </form>
  `;

  document.getElementById('knowledge-document-form').addEventListener('submit', saveKnowledgeDocument);
  document.getElementById('knowledge-document-ai-button')?.addEventListener('click', () => optimizeOpenKnowledgeDocument(doc, content));
}

async function saveKnowledgeDocument(event) {
  event.preventDefault();
  if (!state.selectedProjectId) return;
  const form = event.currentTarget;
  const payload = {
    id: state.selectedKnowledgeDocument?.id || undefined,
    title: form.elements.title.value.trim(),
    category: form.elements.category.value,
    source_path: form.elements.source_path.value.trim(),
    keywords: serializeListInput(form.elements.keywords.value),
    tags: serializeListInput(form.elements.tags.value),
    priority: form.elements.priority.value,
    always_load: form.elements.always_load.checked,
    content_markdown: form.elements.content_markdown.value,
    status: 'active',
  };

  els.knowledgeMeta.textContent = 'Saving Supabase document and rebuilding chunks...';
  try {
    const data = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}/kb/db/document`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    state.selectedKnowledgeDocumentId = data.document.id;
    state.selectedKnowledgeDocument = data.document;
    await loadKnowledgeFiles();
    await previewKnowledgeDocument(data.document.id);
  } catch (error) {
    els.knowledgeMeta.textContent = error.message;
  }
}

function newKnowledgeDocument() {
  state.knowledgeMode = 'supabase';
  state.selectedKnowledgePath = null;
  state.selectedKnowledgeFile = null;
  state.selectedKnowledgeDocumentId = null;
  state.selectedKnowledgeDocument = {
    id: '',
    title: 'Untitled knowledge document',
    category: 'domain',
    source_path: '',
    keywords: [],
    tags: [],
    priority: 'medium',
    always_load: false,
    content_markdown: '',
  };
  state.selectedKnowledgeChunks = [];
  renderKnowledgeFiles();
  renderKnowledgeDocumentEditor();
}

function showKnowledgeImportForm(files = []) {
  if (!state.selectedProjectId) return;
  const fileSummary = files.length
    ? `<div class="knowledge-import-selected">已选择 ${files.length} 个 Markdown 文件：${files.map((file) => escapeHtml(file.name)).join('、')}</div>`
    : '';
  els.knowledgeMeta.textContent = '导入 Markdown 到当前项目知识库';
  els.knowledgeRendered.innerHTML = `
    <form id="knowledge-import-form" class="knowledge-document-form">
      <div class="knowledge-reference-note">
        <p><strong>自动分类规则：</strong>系统会优先读取 frontmatter 的 source_path/category/type；否则根据标题、文件名和正文关键词写入 Core、Domain、Competitors、Cases、Research 或 Templates。</p>
        <p><strong>示例：</strong>项目介绍会进入 Core/project-identity.md，写作规则会进入 Core/writing-rules.md，竞品资料会进入 Competitors。</p>
      </div>
      ${fileSummary}
      <div class="knowledge-import-path-callout">
        <strong>导入位置</strong>
        <span>填写目标路径可指定写入位置，例如 Core/project-identity.md；留空时系统会自动分类。</span>
      </div>
      <label class="field">
        <span>目标路径（可选）</span>
        <input name="target_path" placeholder="例如 Core/project-identity.md；留空则自动判断">
        <small>选择多个文件时建议留空，让系统按每个文件自动分类。</small>
      </label>
      <label class="field">
        <span>单篇 Markdown 内容（可选）</span>
        <textarea name="content" class="knowledge-document-editor" rows="18" placeholder="也可以直接粘贴客户已有的项目介绍、写作规则、竞品资料等 Markdown。"></textarea>
      </label>
      <div class="form-actions">
        <button type="submit">导入到知识库</button>
        <button id="choose-knowledge-import-files-button" class="secondary-button" type="button">选择 MD 文件</button>
      </div>
      <div id="knowledge-import-result" class="chunk-summary"></div>
    </form>
  `;

  const form = document.getElementById('knowledge-import-form');
  form._selectedFiles = files;
  form.addEventListener('submit', importKnowledgeMarkdown);
  document.getElementById('choose-knowledge-import-files-button')?.addEventListener('click', () => {
    els.knowledgeImportFileInput?.click();
  });
  scrollKnowledgeEditorIntoView('#knowledge-import-form textarea[name="content"]');
}

async function readKnowledgeImportFiles(files) {
  const selected = [...(files || [])].filter((file) => /\.m(?:arkdown|d)$/i.test(file.name));
  if (selected.length === 0) return [];
  return Promise.all(selected.map(async (file) => ({
    name: file.name,
    content: await file.text(),
  })));
}

async function handleKnowledgeImportFiles(event) {
  const files = await readKnowledgeImportFiles(event.target.files);
  event.target.value = '';
  showKnowledgeImportForm(files);
}

async function importKnowledgeMarkdown(event) {
  event.preventDefault();
  if (!state.selectedProjectId) return;
  const form = event.currentTarget;
  const resultEl = document.getElementById('knowledge-import-result');
  const files = form._selectedFiles || [];
  const pastedContent = form.elements.content.value.trim();
  const targetPath = form.elements.target_path.value.trim();
  const payloadFiles = [...files];

  if (pastedContent) {
    payloadFiles.push({
      name: targetPath || 'pasted-knowledge.md',
      target_path: targetPath,
      content: pastedContent,
    });
  } else if (targetPath && payloadFiles.length === 1) {
    payloadFiles[0].target_path = targetPath;
  }

  if (payloadFiles.length === 0) {
    resultEl.textContent = '请选择 Markdown 文件，或粘贴 Markdown 内容。';
    return;
  }

  els.knowledgeMeta.textContent = `正在导入 ${payloadFiles.length} 个 Markdown 文档...`;
  resultEl.textContent = '导入中...';
  try {
    const data = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}/kb/import-md`, {
      method: 'POST',
      body: JSON.stringify({ files: payloadFiles }),
    });
    const result = data.result || {};
    await loadKnowledgeFiles();
    const rows = result.results || [];
    resultEl.innerHTML = rows.length
      ? `<ul>${rows.map((item) => `<li>${escapeHtml(item.source_path || item.title)} · ${escapeHtml(item.category || '')} · ${escapeHtml(item.mode || '')}${item.chunk_count !== undefined ? ` · ${item.chunk_count} chunks` : ''}</li>`).join('')}</ul>`
      : '导入完成。';
    els.knowledgeMeta.textContent = `已导入 ${result.imported || rows.length} 个 Markdown 文档。`;

    const first = rows[0];
    if (first?.document_id) {
      await previewKnowledgeDocument(first.document_id);
    } else if (first?.source_path) {
      await previewKnowledgeFile(first.source_path);
    }
  } catch (error) {
    resultEl.textContent = error.message;
    els.knowledgeMeta.textContent = error.message;
  }
}

async function syncSupabaseKnowledge() {
  if (!state.selectedProjectId) return;
  els.syncSupabaseButton.disabled = true;
  els.knowledgeMeta.textContent = 'Syncing local vault into Supabase...';
  try {
    const data = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}/kb/sync-supabase`, {
      method: 'POST',
    });
    await loadKnowledgeFiles();
    els.knowledgeMeta.textContent = `Synced ${data.result.synced}/${data.result.scanned} files to Supabase.`;
  } catch (error) {
    els.knowledgeMeta.textContent = error.message;
  } finally {
    els.syncSupabaseButton.disabled = false;
  }
}

function setBadge(el, label, tone) {
  el.className = `badge ${tone || ''}`.trim();
  el.textContent = label;
}

function toneForStatus(status) {
  if (status === 'completed') return 'success';
  if (status === 'running' || status === 'pending') return 'warning';
  if (status === 'failed' || status?.startsWith('blocked')) return 'danger';
  if (status === 'needs_review' || status === 'update_ready') return 'warning';
  return '';
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '';
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getStepTiming(step) {
  const info = state.selectedJob?.steps?.[step] || state.selectedJob?.report?.steps?.[step] || {};
  const startedAt = info.started_at || '';
  const finishedAt = info.finished_at || '';
  let durationMs = Number(info.duration_ms);
  const status = info.status || '';

  if (!Number.isFinite(durationMs) && startedAt && finishedAt) {
    durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  }
  if ((!Number.isFinite(durationMs) || durationMs < 0) && startedAt && status === 'running') {
    durationMs = Date.now() - new Date(startedAt).getTime();
  }

  const duration = formatDuration(durationMs);
  if (!duration) return '';
  return status === 'running' ? `已用时 ${duration}` : `耗时 ${duration}`;
}

function renderProjects() {
  els.projectList.innerHTML = '';

  state.projects.forEach((project) => {
    const item = document.createElement('div');
    item.className = `project-item ${project.id === state.selectedProjectId ? 'active' : ''}`.trim();
    item.innerHTML = `
      <button class="project-select-button" type="button">
        <span class="project-name">${escapeHtml(project.name || project.id)}</span>
        <span class="project-meta">${project.current ? 'Current' : 'Project'} · ${escapeHtml(project.knowledge_source?.type || 'local')}</span>
      </button>
      ${project.access?.can_admin ? `<button class="project-delete-button" type="button" title="删除项目" aria-label="删除 ${escapeHtml(project.name || project.id)}">删除</button>` : ''}
    `;
    item.querySelector('.project-select-button').addEventListener('click', () => selectProject(project.id));
    item.querySelector('.project-delete-button')?.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteProject(project);
    });
    els.projectList.appendChild(item);
  });
}

async function deleteProject(project) {
  if (!project?.id) return;
  const label = project.name || project.id;
  if (!window.confirm(`确定删除项目「${label}」吗？该项目将从你的项目列表中移除。`)) return;

  setBusy(true);
  try {
    await api(`/api/projects/${encodeURIComponent(project.id)}`, { method: 'DELETE' });
    if (state.selectedProjectId === project.id) {
      state.selectedProjectId = null;
      state.selectedProject = null;
      resetKnowledgeState('Project deleted.');
      resetWritingState('Project deleted.');
    }
    await refresh();
  } catch (error) {
    printOutput(error.message);
  } finally {
    setBusy(false);
  }
}

function renderProject() {
  const project = state.selectedProject;
  if (!project) {
    els.projectTitle.textContent = state.selectedProjectId || 'No project selected';
    setBadge(els.sourceBadge, '-');
    renderDetails(els.projectDetails, []);
    applyActionAvailability();
    return;
  }

  const source = project.knowledge_source || { type: 'local' };
  els.projectTitle.textContent = project.name || project.id;
  setBadge(els.sourceBadge, source.type || 'local');

  renderDetails(els.projectDetails, [
    ['ID', project.id],
    ['Description', project.description],
    ['Official site', project.official_url || project.website_url],
    ['Vault path', project.vault_path],
    ['Output dir', project.output_dir],
    ['Language', project.default_lang],
    ['Market', project.default_market],
    ['Words', project.default_words],
    ['Repo', source.repo],
    ['Branch', source.branch],
    ['Auto pull', source.auto_pull],
    ['Auto push', source.auto_push],
  ]);

  applyActionAvailability();
  const defaultLang = !project.default_lang || project.default_lang === 'en' ? 'zh' : project.default_lang;
  const defaultMarket = normalizeMarketInput(!project.default_market || project.default_market === 'us' ? '中国' : project.default_market, '中国');
  els.articleLang.value = defaultLang === 'cn' ? 'zh' : defaultLang;
  if (!els.articleMarket.value || els.articleMarket.value === 'us') {
    els.articleMarket.value = defaultMarket;
  }
  els.articleMarket.placeholder = defaultMarket;
  if (!els.articleWords.value) {
    els.articleWords.placeholder = '1400';
  }
  if (project.default_results && !els.articleResults.value) {
    els.articleResults.placeholder = String(project.default_results);
  }
  renderArticleKeywordState();
}

function renderVaultStatus() {
  const status = state.vaultStatus;
  if (!status) {
    setBadge(els.readyBadge, '-');
    renderDetails(els.vaultStatus, []);
    return;
  }

  setBadge(els.readyBadge, status.ready ? 'Ready' : 'Not ready', status.ready ? 'success' : 'warning');
  renderDetails(els.vaultStatus, [
    ['Type', status.type],
    ['Path', status.path],
    ['Ready', status.ready],
    ['Exists', status.exists],
    ['Branch', status.branch],
    ['Expected branch', status.expected_branch],
    ['Commit', status.commit],
    ['Dirty', status.dirty],
    ['Message', status.message],
    ['Changes', Array.isArray(status.changes) ? status.changes.join('\n') : ''],
  ]);
}

function renderJobs() {
  els.jobList.innerHTML = '';

  if (state.jobs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'job-meta';
    empty.textContent = 'No article jobs yet.';
    els.jobList.appendChild(empty);
    return;
  }

  state.jobs.forEach((job) => {
    const item = document.createElement('div');
    item.className = `job-item ${job.id === state.selectedJobId ? 'active' : ''}`.trim();
    const title = job.title || job.keyword;
    const metaKeyword = job.title && job.title !== job.keyword ? `关键词：${job.keyword} · ` : '';
    item.innerHTML = `
      <button class="job-select-button" type="button">
        <span class="job-title">${escapeHtml(title)}</span>
        <span class="job-meta">${escapeHtml(metaKeyword)}${job.status} · ${job.project_id} · ${job.created_at}</span>
      </button>
      <button class="job-delete-button" type="button" ${['pending', 'running'].includes(job.status) ? 'disabled' : ''}>删除</button>
    `;
    item.querySelector('.job-select-button').addEventListener('click', () => selectJob(job.id));
    item.querySelector('.job-delete-button').addEventListener('click', () => deleteJob(job));
    els.jobList.appendChild(item);
  });
}

function renderSelectedJob() {
  const job = state.selectedJob;
  if (!job) {
    setBadge(els.selectedJobBadge, '-');
    setBadge(els.jobStatusBadge, 'Idle');
    renderDetails(els.jobDetails, []);
    els.artifactActions.innerHTML = '';
    els.workflowArtifacts.innerHTML = '<div class="job-meta">Select an article job to view the workflow artifacts.</div>';
    return;
  }

  setBadge(els.selectedJobBadge, job.status, toneForStatus(job.status));
  setBadge(els.jobStatusBadge, job.status, toneForStatus(job.status));

  const files = job.report?.files || {};
  const artifacts = job.artifacts || {};
  renderDetails(els.jobDetails, [
    ['ID', job.id],
    ['Keyword', job.keyword],
    ['Slug', job.slug],
    ['Project', job.project_id],
    ['Status', job.status],
    ['Created', job.created_at],
    ['Started', job.started_at],
    ['Finished', job.finished_at],
    ['Error', job.error],
    ['Concept', files.concept],
    ['Draft', files.draft],
    ['Vault', files.vault],
    ['Report', files.report],
  ]);

  els.artifactActions.innerHTML = '';
  Object.values(artifacts).forEach((artifact) => {
    const chip = document.createElement('span');
    chip.className = 'artifact-chip';
    chip.textContent = `${artifact.type} · ${Math.ceil(artifact.size / 1024)} KB`;
    els.artifactActions.appendChild(chip);
  });

  const knowledgeUsage = document.createElement('section');
  knowledgeUsage.className = 'knowledge-usage-panel';
  knowledgeUsage.innerHTML = renderKnowledgeUsage(job.report?.knowledge, files);
  els.artifactActions.appendChild(knowledgeUsage);

  renderWorkflowArtifacts();
  applyArtifactAvailability();
}

function resetArticleWorkspace(message = 'Starting workflow...') {
  state.selectedJobId = null;
  state.selectedJob = null;
  state.selectedArtifactType = null;
  state.selectedArtifact = null;
  state.selectedArtifactContent = '';
  state.selectedArtifactJobId = null;
  state.loadingArtifactKey = '';
  state.expandedArtifactType = null;
  state.artifactAutoExpanded = false;
  state.imagePlan = null;
  state.pendingImages = {};
  setBadge(els.selectedJobBadge, '-', '');
  setBadge(els.jobStatusBadge, 'Starting', 'warning');
  renderDetails(els.jobDetails, []);
  els.artifactActions.innerHTML = '';
  els.workflowArtifacts.innerHTML = '<div class="job-meta">新任务已开始，等待流程产物生成。</div>';
  printJobOutput(message);
  applyArtifactAvailability();
}

function renderArticleKeywordState() {
  if (!els.articleKeyword) return;
  const current = String(els.articleKeyword.value || '').trim();
  if (!current && state.keywordPool?.keywords?.length) {
    const first = state.keywordPool.keywords.find((item) => Number(item.count || 0) === 0) || state.keywordPool.keywords[0];
    if (first?.keyword) {
      els.articleKeyword.placeholder = first.keyword;
    }
  }
}

function renderJobLogs(logs) {
  if (!state.selectedJob) {
    printJobOutput('No article job selected.');
    return;
  }

  if (!logs || logs.length === 0) {
    printJobOutput('Waiting for workflow output...');
    return;
  }

  printJobOutput(logs.map((item) => `[${item.time}] ${item.type}: ${item.message}`).join('\n'));
}

function applyArtifactAvailability() {
  const artifacts = state.selectedJob?.artifacts || {};
  const hasOpenArtifact = Boolean(state.expandedArtifactType && state.selectedArtifactType === state.expandedArtifactType);
  const editable = hasOpenArtifact && ['concept', 'draft'].includes(state.selectedArtifactType);
  const canRegenerateOutline = Boolean(
    artifacts.concept
    && state.selectedJob
    && !['pending', 'running', 'deleted'].includes(String(state.selectedJob.status || ''))
  );
  const canContinueOutline = state.selectedJob?.status === 'awaiting_concept_review' && artifacts.concept;
  els.importDraftButton.disabled = !artifacts.draft || Boolean(state.selectedJob?.report?.files?.vault);
  els.saveArtifactButton.disabled = !editable;
  els.toggleRenderButton.disabled = !hasOpenArtifact;
  document.querySelector('[data-outline-action="regenerate"]')?.toggleAttribute('disabled', !canRegenerateOutline);
  document.querySelector('[data-outline-action="continue"]')?.toggleAttribute('disabled', !canContinueOutline);
}

const artifactSteps = [
  {
    type: 'research',
    step: 'concept',
    title: '1. 竞品研究',
    description: 'Google 搜索结果、竞品页面和抓取到的页面结构。',
  },
  {
    type: 'concept',
    step: 'concept',
    title: '2. 大纲',
    description: '根据知识库和竞品研究生成的标题、论点、结构、FAQ 和 CTA。',
  },
  {
    type: 'images',
    step: 'images',
    title: '3. 配图',
    description: '自动生成封面和正文配图；不满意可修改提示词重新生成，并确认使用。',
  },
  {
    type: 'draft',
    step: 'draft',
    title: '4. 成品文章',
    description: '根据大纲和知识库生成的 Markdown 正文，默认展示阅读预览。',
  },
  {
    type: 'report',
    step: 'quality_check',
    title: '5. 流程报告',
    description: '记录本次生成参数、每一步状态、文件路径和最终结果。',
  },
];

const runningJobStatuses = new Set(['pending', 'running']);

function getWorkflowStepStatus(step) {
  const status = state.selectedJob?.steps?.[step]?.status;
  if (status) return status;
  const jobStatus = state.selectedJob?.status;
  if (jobStatus === 'awaiting_concept_review' && step === 'concept') return 'waiting_review';
  if (runningJobStatuses.has(jobStatus)) return 'waiting';
  return '';
}

function getArtifactStatus(type, step) {
  const artifacts = state.selectedJob?.artifacts || {};
  if (type === 'images') {
    const status = getWorkflowStepStatus(step);
    if (status === 'completed') return { label: '已生成', tone: 'success' };
    if (status === 'running' || status === 'pending' || status === 'waiting') return { label: '生成中', tone: 'warning' };
    if (status === 'failed') return { label: '失败', tone: 'danger' };
    if (state.selectedJob?.status === 'awaiting_concept_review') return { label: '等待大纲确认', tone: '' };
    return artifacts.draft ? { label: '可编辑', tone: 'warning' } : { label: '等待正文', tone: '' };
  }
  if (artifacts[type]) return { label: '已生成', tone: 'success' };
  const status = getWorkflowStepStatus(step);
  if (status === 'waiting_review') return { label: '待确认', tone: 'warning' };
  if (status === 'running' || status === 'pending' || status === 'waiting') return { label: '等待中', tone: 'warning' };
  if (status === 'failed') return { label: '失败', tone: 'danger' };
  return { label: '未生成', tone: '' };
}

function getPreferredArtifactType(artifacts) {
  if (state.selectedJob?.status === 'awaiting_concept_review' && artifacts.concept) return 'concept';
  return artifacts.draft ? 'draft'
    : artifacts.concept ? 'concept'
      : artifacts.research ? 'research'
        : artifacts.report ? 'report'
          : '';
}

function ensureArtifactPreviewMount(type) {
  const body = document.getElementById(`artifact-body-${type}`);
  if (!body) return;
  if (type === 'images') {
    body.innerHTML = '<div id="image-workspace" class="image-workspace">Loading...</div>';
    return;
  }
  body.innerHTML = `
    <div class="editor-meta" id="artifact-meta">Loading...</div>
    ${type === 'concept' ? `
      <label class="field outline-notes-field">
        <span>大纲补充意见 <em>选填</em></span>
        <textarea id="outline-review-notes" rows="3" placeholder="例如：增加德牧幼犬场景、减少品牌露出、H2 更口语化"></textarea>
        <small>重新生成必须填写补充意见；已生成正文的文章会同步重生成正文、配图和报告。</small>
      </label>
      <div class="action-row outline-actions">
        <button class="secondary-button" data-outline-action="regenerate" type="button">${state.selectedJob?.artifacts?.draft ? '引入补充意见重新生成大纲和文章' : '引入补充意见重新生成大纲'}</button>
        <button data-outline-action="continue" type="button">确认当前大纲并继续写作</button>
      </div>
    ` : ''}
    <div id="artifact-editor-grid" class="artifact-editor-grid">
      <textarea id="artifact-editor" class="artifact-editor" spellcheck="false"></textarea>
      <div id="artifact-rendered" class="artifact-rendered"></div>
    </div>
  `;
  els.artifactMeta = document.getElementById('artifact-meta');
  els.artifactEditorGrid = document.getElementById('artifact-editor-grid');
  els.artifactEditor = document.getElementById('artifact-editor');
  els.artifactRendered = document.getElementById('artifact-rendered');
  els.artifactEditor.addEventListener('input', () => {
    if (state.selectedArtifactType === 'draft' || state.selectedArtifactType === 'concept') {
      window.clearTimeout(state.renderTimer);
      state.renderTimer = window.setTimeout(renderArtifactContent, 250);
    }
  });
  if (type === 'concept') {
    body.querySelector('[data-outline-action="regenerate"]')?.addEventListener('click', regenerateOutline);
    body.querySelector('[data-outline-action="continue"]')?.addEventListener('click', continueAfterOutline);
  }
}

function renderWorkflowArtifacts() {
  const artifacts = state.selectedJob?.artifacts || {};
  const preferred = getPreferredArtifactType(artifacts) || 'research';

  if (state.selectedJob?.status === 'awaiting_concept_review' && artifacts.concept && state.expandedArtifactType !== 'concept') {
    state.expandedArtifactType = 'concept';
    state.artifactAutoExpanded = true;
  } else if (!state.expandedArtifactType && !state.artifactAutoExpanded) {
    state.expandedArtifactType = preferred;
    state.artifactAutoExpanded = true;
  }

  els.workflowArtifacts.innerHTML = '';
  artifactSteps.forEach((item) => {
    const artifact = item.type === 'images' ? artifacts.draft : artifacts[item.type];
    const expanded = state.expandedArtifactType === item.type;
    const status = getArtifactStatus(item.type, item.step);
    const timing = getStepTiming(item.step);
    const canOpen = Boolean(artifact);
    const card = document.createElement('article');
    card.className = `workflow-artifact-step ${expanded ? 'expanded' : ''}`.trim();
    card.innerHTML = `
      <button class="workflow-artifact-header" type="button" ${canOpen ? '' : 'disabled'}>
        <span>
          <strong>${item.title}</strong>
          <small>${item.description}</small>
        </span>
        <span class="workflow-artifact-side">
          <span class="badge ${status.tone}">${status.label}</span>
          ${timing ? `<span class="workflow-step-duration">${escapeHtml(timing)}</span>` : ''}
          ${canOpen ? `<span class="collapse-indicator">${expanded ? '收起' : '展开'}</span>` : ''}
        </span>
      </button>
      <div id="artifact-body-${item.type}" class="workflow-artifact-body" ${expanded ? '' : 'hidden'}></div>
    `;
    const header = card.querySelector('.workflow-artifact-header');
    header.addEventListener('click', () => {
      if (!artifact) return;
      state.expandedArtifactType = expanded ? null : item.type;
      state.artifactAutoExpanded = true;
      renderWorkflowArtifacts();
      if (!expanded) previewArtifact(item.type);
    });
    els.workflowArtifacts.appendChild(card);
  });

  const expandedAvailable = state.expandedArtifactType === 'images'
    ? Boolean(artifacts.draft)
    : Boolean(artifacts[state.expandedArtifactType]);

  if (state.expandedArtifactType && expandedAvailable) {
    ensureArtifactPreviewMount(state.expandedArtifactType);
    if (state.expandedArtifactType === 'images') {
      renderImageWorkspace();
    } else if (state.selectedArtifactType === state.expandedArtifactType && state.selectedArtifactContent !== '') {
      els.artifactEditor.value = state.selectedArtifactContent || '';
      renderArtifactContent();
    } else {
      const artifactKey = `${state.selectedJobId}:${state.expandedArtifactType}`;
      if (state.loadingArtifactKey !== artifactKey) {
        window.setTimeout(() => {
          if (
            state.selectedJobId
            && state.expandedArtifactType
            && state.loadingArtifactKey !== artifactKey
            && (state.selectedArtifactJobId !== state.selectedJobId || state.selectedArtifactType !== state.expandedArtifactType || state.selectedArtifactContent === '')
          ) {
            previewArtifact(state.expandedArtifactType);
          }
        }, 0);
      }
    }
  } else {
    els.artifactMeta = null;
    els.artifactEditorGrid = null;
    els.artifactEditor = null;
    els.artifactRendered = null;
  }
  applyArtifactAvailability();
}

async function loadProjects() {
  const data = await api('/api/projects');
  state.projects = data.projects || [];
  if (!state.selectedProjectId && state.projects.length > 0) {
    const current = state.projects.find((project) => project.current) || state.projects[0];
    state.selectedProjectId = current.id;
  }
  state.hasProjects = state.projects.length > 0;
}

async function loadSelectedProject() {
  if (!state.selectedProjectId) return;
  const projectId = state.selectedProjectId;
  const data = await api(`/api/projects/${encodeURIComponent(projectId)}`);
  if (state.selectedProjectId !== projectId) return;
  state.selectedProject = data.project;
  const statusData = await api(`/api/projects/${encodeURIComponent(projectId)}/kb/status`);
  if (state.selectedProjectId !== projectId) return;
  state.vaultStatus = statusData.status;
  resetKnowledgeState('Loading knowledge files...');
  try {
    const keywordData = await api(`/api/projects/${encodeURIComponent(projectId)}/kb/keywords`);
    if (state.selectedProjectId !== projectId) return;
    state.keywordPool = keywordData.result || null;
  } catch (error) {
    if (state.selectedProjectId !== projectId) return;
    state.keywordPool = { keywords: [], history: [], stats: null };
  }
}

async function loadJobs() {
  const projectId = state.selectedProjectId;
  const data = await api('/api/articles');
  if (state.selectedProjectId !== projectId) return;
  state.jobs = (data.jobs || []).filter((job) => !projectId || job.project_id === projectId);
  if (state.selectedJobId && !state.jobs.some((job) => job.id === state.selectedJobId)) {
    state.selectedJobId = null;
    state.selectedJob = null;
    state.selectedArtifactType = null;
    state.selectedArtifact = null;
    state.selectedArtifactContent = '';
    state.selectedArtifactJobId = null;
    state.expandedArtifactType = null;
    state.artifactAutoExpanded = false;
    state.imagePlan = null;
    state.pendingImages = {};
  }
  if (!state.selectedJobId && state.jobs.length > 0) {
    state.selectedJobId = state.jobs[0].id;
  }
}

async function loadSelectedJob() {
  if (!state.selectedJobId) {
    state.selectedJob = null;
    return;
  }
  const data = await api(`/api/articles/${encodeURIComponent(state.selectedJobId)}`);
  state.selectedJob = data.job;
}

async function loadSelectedJobLogs() {
  if (!state.selectedJobId) {
    renderJobLogs([]);
    return;
  }
  const data = await api(`/api/articles/${encodeURIComponent(state.selectedJobId)}/logs`);
  renderJobLogs(data.logs || []);
}

async function previewArtifact(type) {
  if (!state.selectedJobId) return;
  const artifactKey = `${state.selectedJobId}:${type}`;
  state.loadingArtifactKey = artifactKey;
  state.expandedArtifactType = type;
  renderWorkflowArtifacts();
  ensureArtifactPreviewMount(type);
  if (type === 'images') {
    await loadImagePlan();
    return;
  }
  if (!els.artifactMeta || !els.artifactEditor || !els.artifactRendered) return;
  state.artifactViewMode = (type === 'draft' || type === 'concept') ? 'split' : 'preview';
  els.artifactMeta.textContent = `Loading ${type}...`;
  els.artifactEditor.value = '';
  els.artifactRendered.innerHTML = '';
  try {
    const data = await api(`/api/articles/${encodeURIComponent(state.selectedJobId)}/artifact/${encodeURIComponent(type)}`);
    state.selectedArtifactType = type;
    state.selectedArtifact = data.artifact;
    state.selectedArtifactContent = data.content;
    state.selectedArtifactJobId = state.selectedJobId;
    state.loadingArtifactKey = '';
    els.artifactMeta.textContent = `${data.artifact.type} · ${data.artifact.path} · ${Math.ceil(data.artifact.size / 1024)} KB`;
    els.artifactEditor.value = data.content;
    renderArtifactContent();
    applyArtifactAvailability();
  } catch (error) {
    state.loadingArtifactKey = '';
    els.artifactMeta.textContent = error.message;
  }
}

async function loadImagePlan() {
  if (!state.selectedJobId) return;
  const container = document.getElementById('image-workspace');
  if (container) container.textContent = 'Loading images...';
  try {
    const data = await api(`/api/articles/${encodeURIComponent(state.selectedJobId)}/images`);
    state.imagePlan = data.images;
    state.pendingImages = data.pending || {};
    state.imageModels = data.models || [];
    state.imageModelParams = data.model_params || {};
    renderImageWorkspace();
  } catch (error) {
    if (container) container.textContent = error.message;
  }
}

function renderImageWorkspace() {
  const container = document.getElementById('image-workspace');
  if (!container) return;
  const items = state.imagePlan?.items || [];
  if (items.length === 0) {
    container.innerHTML = '<div class="job-meta">暂无配图。生成正文后会在这里显示封面和正文配图。</div>';
    return;
  }

  container.innerHTML = items.map((item) => {
    const pending = state.pendingImages[item.id];
    const imageUrl = pending?.image_url || item.image_url;
    const selectedModel = pending?.model || '';
    const confirmedModel = pending?.model || item.model || '';
    const referenceImage = pending?.reference_image;
    const referenceStatus = referenceImage
      ? `上次图生图：${referenceImage.name || 'source image'} · ${formatBytes(referenceImage.size)}`
      : '选填。上传 1 张产品白底图后，重新生成会强制使用支持图生图的模型参考产品外观。';
    return `
      <div class="image-card" data-image-id="${escapeHtml(item.id)}">
        <div class="image-card-preview">
          ${imageUrl ? `<button class="image-preview-button" type="button" data-image-url="${escapeHtml(imageUrl)}" data-image-label="${escapeHtml(item.label)}"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.label)}" loading="lazy"></button>` : '<div class="image-placeholder">未生成</div>'}
        </div>
        <div class="image-card-body">
          <div class="image-card-title">${escapeHtml(item.label)} <span class="badge ${pending ? 'warning' : 'success'}">${pending ? '待确认' : item.status}</span></div>
          <label class="field">
            <span>图片提示词</span>
            <textarea class="image-prompt" rows="5">${escapeHtml(pending?.prompt || item.prompt || '')}</textarea>
          </label>
          <label class="field">
            <span>生成模型</span>
            <select class="image-model">
              <option value="" ${selectedModel ? '' : 'selected'}>自动选择</option>
              ${state.imageModels.map((model) => `<option value="${escapeHtml(model)}" ${model === selectedModel ? 'selected' : ''}>${escapeHtml(model)}</option>`).join('')}
            </select>
          </label>
          <label class="field image-reference-field">
            <span>图生图输入图 <em>选填，最多1张</em></span>
            <input class="image-reference-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
            <small class="image-reference-status">${escapeHtml(referenceStatus)}</small>
          </label>
          <div class="editor-meta image-model-summary">当前模型：${escapeHtml(selectedModel || confirmedModel || '自动选择')} · ${escapeHtml(formatImageParams(selectedModel || confirmedModel))}</div>
          ${pending ? `<div class="editor-meta">新图已生成，确认后会写入成品文章。</div>` : ''}
          <div class="action-row">
            <button class="secondary-button regenerate-image-button" type="button">重新生成</button>
            <button class="confirm-image-button" type="button" ${pending ? '' : 'disabled'}>确认使用</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.image-card').forEach((card) => {
    const id = card.dataset.imageId;
    card.querySelector('.regenerate-image-button').addEventListener('click', () => regenerateImage(id, card));
    card.querySelector('.confirm-image-button').addEventListener('click', () => confirmImage(id));
    card.querySelector('.image-preview-button')?.addEventListener('click', (event) => {
      openImageLightbox(event.currentTarget.dataset.imageUrl, event.currentTarget.dataset.imageLabel);
    });
    card.querySelector('.image-model')?.addEventListener('change', (event) => {
      const summary = card.querySelector('.image-model-summary');
      if (summary) {
        summary.textContent = `当前模型：${event.target.value || '自动选择'} · ${formatImageParams(event.target.value)}`;
      }
    });
    card.querySelector('.image-reference-input')?.addEventListener('change', (event) => {
      const status = card.querySelector('.image-reference-status');
      const file = event.target.files?.[0];
      if (status) {
        status.textContent = file
          ? `已选择：${file.name} · ${formatBytes(file.size)}`
          : '选填。上传 1 张产品白底图后，重新生成会强制使用支持图生图的模型参考产品外观。';
      }
    });
  });
}

async function regenerateImage(id, card) {
  const prompt = card.querySelector('.image-prompt').value.trim();
  const model = card.querySelector('.image-model')?.value || '';
  const button = card.querySelector('.regenerate-image-button');
  button.disabled = true;
  button.textContent = '生成中...';
  card.querySelectorAll('button').forEach((item) => {
    item.disabled = true;
  });
  try {
    const referenceImage = await readImageReferenceInput(card.querySelector('.image-reference-input'));
    const data = await api(`/api/articles/${encodeURIComponent(state.selectedJobId)}/images/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ id, prompt, model, reference_image: referenceImage }),
    });
    state.pendingImages = data.pending || {};
    state.imageModelParams = data.model_params || state.imageModelParams;
    renderImageWorkspace();
  } catch (error) {
    const errorBox = card.querySelector('.image-error') || document.createElement('div');
    errorBox.className = 'image-error';
    errorBox.textContent = error.message;
    card.querySelector('.image-card-body').appendChild(errorBox);
  } finally {
    const hasPending = Boolean(state.pendingImages[id]);
    button.disabled = false;
    const confirmButton = card.querySelector('.confirm-image-button');
    if (confirmButton) confirmButton.disabled = !hasPending;
    button.textContent = '重新生成';
  }
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function readImageReferenceInput(input) {
  if (!input || !input.files || input.files.length === 0) return null;
  if (input.files.length > 1) {
    throw new Error('图生图输入图最多只能上传 1 张');
  }

  const file = input.files[0];
  const type = inferImageMimeType(file);
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  if (!allowedTypes.has(type)) {
    throw new Error('图生图输入图仅支持 PNG、JPG、WEBP 或 GIF');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('图生图输入图不能超过 8MB');
  }

  return {
    name: file.name,
    type,
    size: file.size,
    data_url: await readFileAsDataUrl(file),
  };
}

function inferImageMimeType(file) {
  if (file.type) return file.type.toLowerCase();
  const name = String(file.name || '').toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  return '';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('图生图输入图读取失败'));
    reader.readAsDataURL(file);
  });
}

async function confirmImage(id) {
  try {
    const data = await api(`/api/articles/${encodeURIComponent(state.selectedJobId)}/images/confirm`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
    state.imagePlan = data.images;
    state.pendingImages = data.pending || {};
    renderImageWorkspace();
    if (state.selectedArtifactType === 'draft') {
      state.selectedArtifactContent = '';
      state.selectedArtifactJobId = null;
    }
  } catch (error) {
    alert(error.message);
  }
}

async function previewDefaultArtifact() {
  if (!state.selectedJob) return;
  if (
    state.selectedJob.status !== 'awaiting_concept_review'
    && state.selectedArtifactJobId === state.selectedJobId
    && state.selectedArtifactType
  ) {
    renderWorkflowArtifacts();
    return;
  }

  const artifacts = state.selectedJob.artifacts || {};
  const preferred = getPreferredArtifactType(artifacts);

  if (preferred) {
    state.expandedArtifactType = preferred;
    state.artifactAutoExpanded = true;
    renderWorkflowArtifacts();
    await previewArtifact(preferred);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveArticleAssetUrl(url) {
  const value = String(url || '').trim();
  if (!value || /^(https?:|data:|blob:|\/api\/)/i.test(value)) return value;
  if (!state.selectedJobId) return value;

  const clean = value.replace(/\\/g, '/');
  if (clean.includes('\0') || clean.split('/').includes('..')) return value;
  const fileName = clean.split('/').filter(Boolean).pop();
  if (!fileName) return value;
  return `/api/articles/${encodeURIComponent(state.selectedJobId)}/asset/${encodeURIComponent(fileName)}`;
}

function renderInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
      return `<img src="${escapeHtml(resolveArticleAssetUrl(url))}" alt="${escapeHtml(alt)}" loading="lazy">`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderHtmlTableBlock(lines) {
  const raw = lines.join('\n');
  const tagMatch = raw.match(/^<\/?(table|thead|tbody|tr|th|td)>$/i);
  if (tagMatch && !raw.includes('\n')) {
    return escapeHtml(raw);
  }

  let safe = escapeHtml(raw);
  const allowedTags = ['table', 'thead', 'tbody', 'tr', 'th', 'td'];
  allowedTags.forEach((tag) => {
    safe = safe
      .replace(new RegExp(`&lt;${tag}&gt;`, 'gi'), `<${tag}>`)
      .replace(new RegExp(`&lt;/${tag}&gt;`, 'gi'), `</${tag}>`);
  });
  return safe;
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;
  let inCode = false;
  let inTable = false;
  let inHtmlTable = false;
  let tableRows = [];
  let htmlTableRows = [];

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };
  const closeTable = () => {
    if (!inTable) return;
    html.push('<table>');
    tableRows.forEach((row, index) => {
      const cells = row.split('|').slice(1, -1).map((cell) => renderInlineMarkdown(cell.trim()));
      if (index === 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return;
      const tag = index === 0 ? 'th' : 'td';
      html.push(`<tr>${cells.map((cell) => `<${tag}>${cell}</${tag}>`).join('')}</tr>`);
    });
    html.push('</table>');
    tableRows = [];
    inTable = false;
  };
  const closeHtmlTable = () => {
    if (!inHtmlTable) return;
    html.push(renderHtmlTableBlock(htmlTableRows));
    htmlTableRows = [];
    inHtmlTable = false;
  };

  lines.forEach((line) => {
    if (line.startsWith('```')) {
      closeList();
      closeTable();
      closeHtmlTable();
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        html.push('<pre><code>');
        inCode = true;
      }
      return;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      return;
    }

    if (/^<\/?(table|thead|tbody|tr|th|td)>$/i.test(line.trim())) {
      closeList();
      closeTable();
      inHtmlTable = true;
      htmlTableRows.push(line.trim());
      if (/^<\/table>$/i.test(line.trim())) {
        closeHtmlTable();
      }
      return;
    }
    closeHtmlTable();

    if (/^\|.*\|$/.test(line.trim())) {
      closeList();
      inTable = true;
      tableRows.push(line.trim());
      return;
    }
    closeTable();

    if (!line.trim()) {
      closeList();
      html.push('');
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    const list = line.match(/^[-*]\s+(.+)$/);
    if (list) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${renderInlineMarkdown(list[1])}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${renderInlineMarkdown(line)}</p>`);
  });

  closeList();
  closeTable();
  closeHtmlTable();
  if (inCode) html.push('</code></pre>');
  return html.join('\n');
}

function stripYamlQuotes(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

function parseYamlScalar(value) {
  const raw = stripYamlQuotes(value);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null' || raw === '~') return null;
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
  if (/^\[.*\]$/.test(raw)) {
    return raw.slice(1, -1).split(',').map((item) => stripYamlQuotes(item)).filter(Boolean);
  }
  return raw;
}

function parseYamlInlineObject(value) {
  const raw = String(value || '').trim();
  if (!raw.startsWith('{') || !raw.endsWith('}')) return null;
  const result = {};
  raw.slice(1, -1).split(',').forEach((entry) => {
    const match = entry.match(/^\s*([^:]+):\s*(.*?)\s*$/);
    if (!match) return;
    result[match[1].trim()] = parseYamlScalar(match[2]);
  });
  return result;
}

function parseConceptYaml(yamlText) {
  const root = {};
  const stack = [{ indent: -1, value: root }];
  const lines = String(yamlText || '').split(/\r?\n/);

  const peekNextUsefulLine = (fromIndex) => {
    for (let index = fromIndex + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.trim() || line.trim().startsWith('#')) continue;
      return line;
    }
    return '';
  };

  const assignValue = (container, key, value) => {
    if (Array.isArray(container)) {
      container.push(value);
    } else if (key) {
      container[key] = value;
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
    const indent = rawLine.match(/^\s*/)[0].length;
    const line = rawLine.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].value;

    const listMatch = line.match(/^-\s*(.*)$/);
    if (listMatch) {
      if (!Array.isArray(parent)) continue;
      const listValue = listMatch[1];
      if (!listValue) {
        const nextLine = peekNextUsefulLine(index);
        const value = nextLine.trim().startsWith('- ') ? [] : {};
        parent.push(value);
        stack.push({ indent, value });
        continue;
      }
      const objectMatch = listValue.match(/^([^:]+):\s*(.*)$/);
      if (objectMatch) {
        const value = {};
        const key = objectMatch[1].trim();
        const rawValue = objectMatch[2].trim();
        value[key] = rawValue ? (parseYamlInlineObject(rawValue) || parseYamlScalar(rawValue)) : {};
        parent.push(value);
        stack.push({ indent, value });
      } else {
        parent.push(parseYamlInlineObject(listValue) || parseYamlScalar(listValue));
      }
      continue;
    }

    const keyMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (!keyMatch) continue;
    const key = keyMatch[1].trim();
    const rawValue = keyMatch[2].trim();

    if (rawValue === '|' || rawValue === '|-' || rawValue === '>-' || rawValue === '>') {
      const blockLines = [];
      for (let next = index + 1; next < lines.length; next += 1) {
        const nextLine = lines[next];
        if (!nextLine.trim()) {
          blockLines.push('');
          index = next;
          continue;
        }
        const nextIndent = nextLine.match(/^\s*/)[0].length;
        if (nextIndent <= indent) break;
        blockLines.push(nextLine.slice(Math.min(nextIndent, indent + 2)));
        index = next;
      }
      assignValue(parent, key, rawValue.startsWith('|') ? blockLines.join('\n').trim() : blockLines.join(' ').trim());
      continue;
    }

    if (!rawValue) {
      const nextLine = peekNextUsefulLine(index);
      const value = nextLine.trim().startsWith('- ') ? [] : {};
      assignValue(parent, key, value);
      stack.push({ indent, value });
      continue;
    }

    assignValue(parent, key, parseYamlInlineObject(rawValue) || parseYamlScalar(rawValue));
  }

  return root;
}

function parseSimpleYamlFrontmatter(yamlText) {
  const metadata = {};
  const lines = String(yamlText || '').split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const item = line.match(/^([^:#][^:]*):\s*(.*)$/);
    if (!item) continue;
    const key = item[1].trim();
    const rawValue = item[2].trim();

    if (rawValue === '>-' || rawValue === '|' || rawValue === '|-') {
      const blockLines = [];
      for (let next = index + 1; next < lines.length; next += 1) {
        const nextLine = lines[next];
        if (/^\S[^:]*:\s*/.test(nextLine)) break;
        blockLines.push(nextLine.replace(/^\s{2}/, ''));
        index = next;
      }
      metadata[key] = rawValue.startsWith('|')
        ? blockLines.join('\n').trim()
        : blockLines.map((value) => value.trim()).filter(Boolean).join(' ').trim();
      continue;
    }

    if (rawValue === '') {
      const values = [];
      for (let next = index + 1; next < lines.length; next += 1) {
        const nextLine = lines[next];
        if (/^\S[^:]*:\s*/.test(nextLine)) break;
        const listItem = nextLine.match(/^\s*-\s+(.+)$/);
        if (listItem) values.push(stripYamlQuotes(listItem[1]));
        index = next;
      }
      metadata[key] = values.length ? values : '';
      continue;
    }

    metadata[key] = stripYamlQuotes(rawValue);
  }
  return metadata;
}

function parseMarkdownDocument(markdown) {
  const match = String(markdown || '').match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) {
    return { metadata: {}, content: markdown || '' };
  }

  return {
    metadata: parseSimpleYamlFrontmatter(match[1]),
    content: String(markdown || '').slice(match[0].length),
  };
}

function renderConceptList(items) {
  const values = Array.isArray(items) ? items.filter((item) => item !== null && item !== undefined && String(item).trim()) : [];
  if (!values.length) return '<p class="concept-empty">未填写</p>';
  return `<ul>${values.map((item) => `<li>${renderInlineMarkdown(String(item))}</li>`).join('')}</ul>`;
}

function normalizeConceptQuestion(item, index) {
  if (typeof item === 'string') {
    return { question: item, answer: '' };
  }
  return {
    question: item?.question || item?.q || `FAQ ${index + 1}`,
    answer: item?.answer || item?.a || '',
  };
}

function renderConceptPreview(yamlText) {
  let concept;
  try {
    concept = parseConceptYaml(yamlText);
  } catch (error) {
    return `<div class="concept-preview-error">大纲解析失败：${escapeHtml(error.message)}</div><pre><code>${escapeHtml(yamlText)}</code></pre>`;
  }

  const sections = Array.isArray(concept.sections) ? concept.sections : [];
  const faq = Array.isArray(concept.faq) ? concept.faq : [];
  const images = Array.isArray(concept.images_needed) ? concept.images_needed : [];
  const sources = Array.isArray(concept.competitor_analysis?.sources) ? concept.competitor_analysis.sources : [];
  const checkpoints = Array.isArray(concept.review_checkpoints) ? concept.review_checkpoints : [];
  const variants = Array.isArray(concept.keyword_variants) ? concept.keyword_variants : [];
  const targetWords = concept.word_count?.target || concept.word_count?.max || '';

  const sectionHtml = sections.length
    ? sections.map((section, index) => {
        const subsections = Array.isArray(section.subsections) ? section.subsections : [];
        const evidence = Array.isArray(section.evidence) ? section.evidence : [];
        return `
          <article class="concept-section">
            <div class="concept-section-header">
              <span>${index + 1}</span>
              <div>
                <h3>${escapeHtml(section.title || `Section ${index + 1}`)}</h3>
                ${section.word_count ? `<small>${escapeHtml(section.word_count)} 字</small>` : ''}
              </div>
            </div>
            ${section.key_point ? `<p class="concept-key-point">${renderInlineMarkdown(String(section.key_point))}</p>` : ''}
            ${evidence.length ? `<div class="concept-subblock"><strong>证据 / 支撑点</strong>${renderConceptList(evidence)}</div>` : ''}
            ${subsections.length ? `
              <div class="concept-subsections">
                ${subsections.map((subsection) => `
                  <div class="concept-subsection">
                    <div class="concept-subsection-title">
                      <strong>${escapeHtml(subsection.title || '未命名 H3')}</strong>
                      ${subsection.image_needed ? '<span class="badge warning">需配图</span>' : ''}
                    </div>
                    ${renderConceptList(subsection.points)}
                    ${subsection.image_description ? `<small>配图：${escapeHtml(subsection.image_description)}</small>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </article>
        `;
      }).join('')
    : '<p class="concept-empty">未解析到章节结构。</p>';

  return `
    <article class="concept-preview">
      <header class="concept-hero">
        <div class="concept-hero-meta">
          ${concept.lang ? `<span>${escapeHtml(concept.lang)}</span>` : ''}
          ${concept.market ? `<span>${escapeHtml(concept.market)}</span>` : ''}
          ${concept.intent ? `<span>${escapeHtml(concept.intent)}</span>` : ''}
          ${targetWords ? `<span>${escapeHtml(targetWords)} 字</span>` : ''}
        </div>
        <h1>${escapeHtml(concept.title || '未命名大纲')}</h1>
        <p>${renderInlineMarkdown(String(concept.meta_description || ''))}</p>
      </header>

      <section class="concept-summary-grid">
        <div>
          <span class="concept-label">目标关键词</span>
          <strong>${escapeHtml(concept.keyword || '未填写')}</strong>
          ${variants.length ? renderConceptList(variants) : ''}
        </div>
        <div>
          <span class="concept-label">核心论点</span>
          <p>${renderInlineMarkdown(String(concept.thesis?.final || concept.thesis?.statement || '未填写'))}</p>
        </div>
        <div>
          <span class="concept-label">CTA</span>
          <p>${escapeHtml(concept.cta?.text || '未填写')}${concept.cta?.url ? ` · ${escapeHtml(concept.cta.url)}` : ''}</p>
        </div>
        <div>
          <span class="concept-label">竞品来源</span>
          <p>${sources.length ? `${sources.length} 个来源` : '未记录'}</p>
        </div>
      </section>

      <section class="concept-panel">
        <h2>文章结构</h2>
        <div class="concept-section-list">${sectionHtml}</div>
      </section>

      <section class="concept-two-column">
        <div class="concept-panel">
          <h2>竞品机会</h2>
          ${renderConceptList(concept.competitor_analysis?.gap_opportunities)}
        </div>
        <div class="concept-panel">
          <h2>常见问题</h2>
          ${faq.length ? faq.map((item, index) => {
            const normalized = normalizeConceptQuestion(item, index);
            return `<div class="concept-faq"><strong>${escapeHtml(normalized.question)}</strong>${normalized.answer ? `<p>${renderInlineMarkdown(String(normalized.answer))}</p>` : ''}</div>`;
          }).join('') : '<p class="concept-empty">未填写</p>'}
        </div>
      </section>

      <section class="concept-two-column">
        <div class="concept-panel">
          <h2>配图需求</h2>
          ${images.length ? images.map((image) => `
            <div class="concept-image-need">
              <strong>${escapeHtml(image.section || image.subsection || '配图')}</strong>
              <p>${escapeHtml(image.description || '')}</p>
            </div>
          `).join('') : '<p class="concept-empty">未标记配图需求</p>'}
        </div>
        <div class="concept-panel">
          <h2>人工检查点</h2>
          ${renderConceptList(checkpoints)}
        </div>
      </section>
    </article>
  `;
}

function isPublicDraftMetadata(key) {
  return ![
    'cover_image_url',
    'cover_image_prompt_raw',
    'cover_image_prompt_final',
    'cover_image_prompt',
    'cover_image_brief',
    'cover_image_rule_sources',
    'inline_image_prompts',
  ].includes(key);
}

function renderDraftPreview(markdown) {
  const { metadata, content } = parseMarkdownDocument(markdown);
  const metaRows = Object.entries(metadata)
    .filter(([key, value]) => value && isPublicDraftMetadata(key))
    .slice(0, 8);
  const cover = metadata.cover_image_url
    ? `<figure class="draft-cover"><img src="${escapeHtml(resolveArticleAssetUrl(metadata.cover_image_url))}" alt="cover image" loading="lazy"></figure>`
    : '';
  const meta = metaRows.length
    ? `<dl class="draft-meta">${metaRows.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>`
    : '';
  return `${cover}${meta}${renderMarkdown(content)}`;
}

function renderArtifactContent() {
  if (!els.artifactEditor || !els.artifactRendered || !els.artifactEditorGrid) return;
  const content = els.artifactEditor.value;
  const mode = state.artifactViewMode;
  els.artifactEditorGrid.classList.toggle('source-only', mode === 'source');
  els.artifactEditorGrid.classList.toggle('preview-only', mode === 'preview');
  els.artifactEditorGrid.classList.toggle('split-view', mode === 'split');

  if (state.selectedArtifactType === 'draft') {
    els.artifactRendered.innerHTML = renderDraftPreview(content);
    els.toggleRenderButton.textContent = mode === 'split' ? '仅预览' : '对照编辑';
    applyArtifactAvailability();
    return;
  }

  if (state.selectedArtifactType === 'concept') {
    els.artifactRendered.innerHTML = renderConceptPreview(content);
    els.toggleRenderButton.textContent = mode === 'split' ? '仅预览' : '对照编辑';
    applyArtifactAvailability();
    return;
  }

  if (state.selectedArtifactType === 'research' || state.selectedArtifactType === 'report') {
    try {
      els.artifactRendered.innerHTML = `<pre><code>${escapeHtml(JSON.stringify(JSON.parse(content), null, 2))}</code></pre>`;
    } catch (error) {
      els.artifactRendered.innerHTML = `<pre><code>${escapeHtml(content)}</code></pre>`;
    }
    els.toggleRenderButton.textContent = '源码/预览';
    applyArtifactAvailability();
    return;
  }

  els.artifactRendered.innerHTML = `<pre><code>${escapeHtml(content)}</code></pre>`;
  els.toggleRenderButton.textContent = mode === 'source' ? '预览' : '源码';
  applyArtifactAvailability();
}

function toggleArtifactView() {
  if (!state.selectedArtifactType || !state.expandedArtifactType) return;
  if (state.selectedArtifactType === 'draft' || state.selectedArtifactType === 'concept') {
    state.artifactViewMode = state.artifactViewMode === 'split' ? 'preview' : 'split';
  } else {
    state.artifactViewMode = state.artifactViewMode === 'preview' ? 'source' : 'preview';
  }
  renderArtifactContent();
}

async function saveSelectedArtifact() {
  if (!state.selectedJobId || !state.selectedArtifactType || !els.artifactEditor || state.selectedArtifactType === 'report') return;

  els.saveArtifactButton.disabled = true;
  els.artifactMeta.textContent = `Saving ${state.selectedArtifactType}...`;
  try {
    const data = await api(`/api/articles/${encodeURIComponent(state.selectedJobId)}/artifact/${encodeURIComponent(state.selectedArtifactType)}`, {
      method: 'PUT',
      body: JSON.stringify({ content: els.artifactEditor.value }),
    });
    state.selectedArtifact = data.artifact;
    state.selectedArtifactContent = els.artifactEditor.value;
    els.artifactMeta.textContent = `${data.artifact.type} · ${data.artifact.path} · saved`;
    renderArtifactContent();
    await refreshJobs();
  } catch (error) {
    els.artifactMeta.textContent = error.message;
  } finally {
    applyArtifactAvailability();
  }
}

async function continueAfterOutline() {
  if (!state.selectedJobId || state.selectedJob?.status !== 'awaiting_concept_review') return;
  const button = document.querySelector('[data-outline-action="continue"]');
  if (button) {
    button.disabled = true;
    button.textContent = '继续生成中...';
  }
  try {
    if (state.selectedArtifactType === 'concept' && els.artifactEditor) {
      await saveSelectedArtifact();
    }
    const notes = document.getElementById('outline-review-notes')?.value || '';
    const data = await api(`/api/articles/${encodeURIComponent(state.selectedJobId)}/continue`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    state.selectedJob = data.job;
    await refreshJobs();
    startJobPolling();
  } catch (error) {
    printJobOutput(error.message);
  } finally {
    if (button) button.textContent = '确认当前大纲并继续写作';
    applyArtifactAvailability();
  }
}

async function regenerateOutline() {
  if (!state.selectedJobId) return;
  const status = String(state.selectedJob?.status || '');
  if (['pending', 'running', 'deleted'].includes(status)) return;
  const notes = document.getElementById('outline-review-notes')?.value || '';
  if (!notes.trim()) {
    printJobOutput('请先填写大纲补充意见，再重新生成大纲。');
    return;
  }

  const button = document.querySelector('[data-outline-action="regenerate"]');
  const originalText = button?.textContent || '引入补充意见重新生成大纲';
  if (button) {
    button.disabled = true;
    button.textContent = state.selectedJob?.artifacts?.draft ? '已开始重生成...' : '重新生成中...';
  }
  try {
    const data = await api(`/api/articles/${encodeURIComponent(state.selectedJobId)}/outline/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    state.selectedJob = data.job;
    state.selectedArtifactContent = '';
    state.selectedArtifactJobId = null;
    state.selectedArtifactType = null;
    state.selectedArtifact = null;
    if (els.artifactMeta) {
      els.artifactMeta.textContent = '正在引入补充意见重新生成，请等待新大纲完成。';
    }
    if (els.artifactEditor) {
      els.artifactEditor.value = '';
    }
    if (els.artifactRendered) {
      els.artifactRendered.innerHTML = '<div class="concept-preview-error">正在引入补充意见重新生成，请等待新大纲完成。</div>';
    }
    await refreshJobs();
    if (status === 'awaiting_concept_review') {
      await previewArtifact('concept');
    } else {
      startJobPolling();
      renderSelectedJob();
      printJobOutput('已开始根据补充意见重新生成大纲、正文、配图和报告。');
    }
  } catch (error) {
    printJobOutput(error.message);
  } finally {
    if (button) button.textContent = originalText;
    applyArtifactAvailability();
  }
}

async function importSelectedDraft() {
  if (!state.selectedJobId) return;
  els.importDraftButton.disabled = true;
  els.artifactMeta.textContent = 'Importing draft to vault...';
  try {
    const data = await api(`/api/articles/${encodeURIComponent(state.selectedJobId)}/import-draft`, {
      method: 'POST',
      body: JSON.stringify({ import_dir: 'Drafts', review_status: 'pending' }),
    });
    state.selectedJob = data.job;
    renderSelectedJob();
    els.artifactRendered.innerHTML = `<pre><code>${escapeHtml(JSON.stringify(data.result, null, 2))}</code></pre>`;
    await refreshJobs();
  } catch (error) {
    els.artifactMeta.textContent = error.message;
  } finally {
    applyArtifactAvailability();
  }
}

async function refresh() {
  setBusy(true);
  try {
    await loadRuntimeSettings();
    await loadProjects();
    if (!state.hasProjects) {
      showProjectCreate('No project yet. Create your first project to continue.');
      renderProjects();
      els.projectTitle.textContent = 'Create your first project';
      els.projectSubtitle.textContent = 'Projects keep knowledge, jobs, and settings separated.';
      renderDetails(els.projectDetails, []);
      renderVaultStatus();
      els.knowledgeFileList.innerHTML = '';
      els.knowledgeMeta.textContent = 'Create a project first.';
      els.knowledgeRendered.innerHTML = '';
      return;
    }
    hideProjectCreate();
    await loadSelectedProject();
    renderProjects();
    renderProject();
    renderVaultStatus();
    await loadKnowledgeFiles();
    renderKeywordPool();
    await loadJobs();
    await loadSelectedJob();
    renderJobs();
    renderSelectedJob();
    await loadSelectedJobLogs();
    if (!state.artifactAutoExpanded || !state.selectedArtifactType) {
      await previewDefaultArtifact();
    }
  } catch (error) {
    printOutput(error.message);
  } finally {
    setBusy(false);
  }
}

async function selectProject(projectId) {
  if (state.selectedProjectId === projectId) return;
  state.selectedProjectId = projectId;
  state.keywordPoolExpanded = false;
  state.selectedProject = null;
  state.vaultStatus = null;
  resetKnowledgeState('Switching project...');
  resetWritingState(`Switching to ${projectId}...`);
  renderKeywordPool();
  renderProjects();
  renderProject();
  renderVaultStatus();
  try {
    await api(`/api/projects/${encodeURIComponent(projectId)}/select`, { method: 'POST' });
  } catch (error) {
    els.knowledgeMeta.textContent = error.message;
    return;
  }
  await refresh();
}

async function createProject(event) {
  event.preventDefault();
  if (!els.projectCreateForm) return;
  els.projectCreateOutput.textContent = 'Creating project...';
  const form = els.projectCreateForm;
  const payload = {
    name: form.elements.name.value.trim(),
    id: form.elements.id.value.trim(),
    description: form.elements.description.value.trim(),
    official_url: form.elements.official_url.value.trim(),
    vault_path: form.elements.vault_path.value.trim(),
    default_lang: form.elements.default_lang.value || 'zh',
    default_market: normalizeMarketInput(form.elements.default_market.value, '中国'),
    default_words: Number(form.elements.default_words.value || 2500),
    default_results: Number(form.elements.default_results.value || 5),
  };

  let data;
  try {
    data = await api('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    els.projectCreateOutput.textContent = error.message;
    return;
  }

  state.selectedProjectId = data.project.id;
  els.projectCreateOutput.textContent = `Project created: ${data.project.name}. 正在抓取官网并生成基础知识库...`;
  await refresh();
  setPage('knowledge');
  await generateProjectIdentityFromOfficialSite();
}

function openProjectCreate() {
  showProjectCreate('Create a project to start writing.');
}

async function refreshJobs() {
  try {
    await loadJobs();
    await loadSelectedJob();
    renderJobs();
    renderSelectedJob();
    await loadSelectedJobLogs();
    if (!state.artifactAutoExpanded || !state.selectedArtifactType) {
      await previewDefaultArtifact();
    }
  } catch (error) {
    printJobOutput(error.message);
  }
}

async function deleteJob(job) {
  const title = job.title || job.keyword || job.id;
  if (!confirm(`确认删除「${title}」的任务记录和对应文章产物吗？`)) return;

  try {
    await api(`/api/articles/${encodeURIComponent(job.id)}`, { method: 'DELETE' });
    if (state.selectedJobId === job.id) {
      state.selectedJobId = null;
      state.selectedJob = null;
      state.selectedArtifactType = null;
      state.selectedArtifact = null;
      state.selectedArtifactContent = '';
      state.selectedArtifactJobId = null;
      state.expandedArtifactType = null;
      state.artifactAutoExpanded = false;
      state.imagePlan = null;
      state.pendingImages = {};
      printJobOutput('Article job deleted.');
    }
    await refreshJobs();
    applyActionAvailability();
  } catch (error) {
    printJobOutput(error.message);
  }
}

async function selectJob(jobId) {
  state.selectedJobId = jobId;
  state.selectedArtifactType = null;
  state.selectedArtifact = null;
  state.selectedArtifactContent = '';
  state.selectedArtifactJobId = null;
  state.expandedArtifactType = null;
  state.artifactAutoExpanded = false;
  await refreshJobs();
}

async function runAction(label, path, body) {
  if (!state.selectedProjectId) return;
  setBusy(true);
  printOutput(`${label}...`);
  try {
    const data = await api(`/api/projects/${encodeURIComponent(state.selectedProjectId)}${path}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    printOutput(data);
    await loadProjects();
    await loadSelectedProject();
    renderProjects();
    renderProject();
    renderVaultStatus();
  } catch (error) {
    printOutput(error.message);
  } finally {
    setBusy(false);
  }
}

function compactPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  );
}

function parseKeywords(value) {
  return String(value || '')
    .split(/[,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

async function startArticleWorkflow(event) {
  event.preventDefault();
  if (!state.selectedProjectId) return;
  const keywords = parseKeywords(els.articleKeyword.value);
  if (keywords.length === 0) {
    printJobOutput('请至少填写 1 个关键词。');
    return;
  }
  if (parseKeywords(els.articleKeyword.value).length < String(els.articleKeyword.value || '').split(/[,，、\n]/).map((item) => item.trim()).filter(Boolean).length) {
    printJobOutput('最多支持 3 个关键词，已自动取前 3 个。');
  }

  const payload = compactPayload({
    project: state.selectedProjectId,
    keyword: keywords[0],
    keywords,
    intent: els.articleIntent.value,
    lang: els.articleLang.value || 'zh',
    market: normalizeMarketInput(els.articleMarket.value, '中国'),
    words: els.articleWords.value,
    results: els.articleResults.value,
    scene: '',
    brief: els.articleBrief.value.trim(),
    skip_import: els.articleSkipImport.checked,
    force_import: els.articleForceImport.checked,
    skip_cover: els.articleSkipCover.checked,
    auto_confirm_outline: els.articleAutoConfirmOutline.checked,
    filter_domains: true,
  });

  els.startArticleButton.disabled = true;
  resetArticleWorkspace('Starting workflow...');
  try {
    const data = await api('/api/articles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    state.selectedJobId = data.job.id;
    await refreshJobs();
    startJobPolling();
  } catch (error) {
    printJobOutput(error.message);
  } finally {
    els.startArticleButton.disabled = false;
    applyActionAvailability();
  }
}

function startJobPolling() {
  if (state.jobPollTimer) {
    clearInterval(state.jobPollTimer);
  }

  state.jobPollTimer = setInterval(async () => {
    await refreshJobs();
    const status = state.selectedJob?.status;
    if (status && !runningJobStatuses.has(status)) {
      clearInterval(state.jobPollTimer);
      state.jobPollTimer = null;
    }
  }, 2500);
}

els.refreshButton.addEventListener('click', refresh);
els.loginForm.addEventListener('submit', login);
if (els.signupForm) els.signupForm.addEventListener('submit', signup);
els.logoutButton.addEventListener('click', logout);
if (els.showSignupButton) els.showSignupButton.addEventListener('click', () => showSignup());
if (els.adminCreateUserForm) els.adminCreateUserForm.addEventListener('submit', createAdminUser);
els.createProjectButton.addEventListener('click', openProjectCreate);
els.knowledgeNavButton.addEventListener('click', () => setPage('knowledge'));
els.writingNavButton.addEventListener('click', () => setPage('writing'));
els.settingsNavButton.addEventListener('click', () => setPage('settings'));
if (els.keywordPoolToggleButton) {
  els.keywordPoolToggleButton.addEventListener('click', () => {
    state.keywordPoolExpanded = !state.keywordPoolExpanded;
    renderKeywordPool();
  });
}
els.refreshKnowledgeButton.addEventListener('click', loadKnowledgeFiles);
els.importKnowledgeButton.addEventListener('click', () => showKnowledgeImportForm());
els.knowledgeImportFileInput.addEventListener('change', handleKnowledgeImportFiles);
els.newKnowledgeDocumentButton.addEventListener('click', newKnowledgeDocument);
els.syncSupabaseButton.addEventListener('click', syncSupabaseKnowledge);
els.refreshSettingsButton.addEventListener('click', loadSystemSettings);
els.knowledgeSearch.addEventListener('input', renderKnowledgeFiles);
els.refreshJobsButton.addEventListener('click', refreshJobs);
els.clearLogButton.addEventListener('click', () => printJobOutput(''));
els.saveArtifactButton.addEventListener('click', saveSelectedArtifact);
els.toggleRenderButton.addEventListener('click', toggleArtifactView);
els.importDraftButton.addEventListener('click', importSelectedDraft);
els.articleForm.addEventListener('submit', startArticleWorkflow);
els.articleMarket.addEventListener('blur', () => {
  els.articleMarket.value = normalizeMarketInput(els.articleMarket.value, '中国');
});
els.settingsForm.addEventListener('submit', saveSystemSettings);
els.selectButton.addEventListener('click', () => runAction('Selecting project', '/select'));
els.projectCreateForm.addEventListener('submit', createProject);
els.projectCreateForm.elements.default_market?.addEventListener('blur', (event) => {
  event.target.value = normalizeMarketInput(event.target.value, '中国');
});
els.imageLightboxClose.addEventListener('click', closeImageLightbox);
els.imageLightbox.addEventListener('click', (event) => {
  if (event.target === els.imageLightbox) closeImageLightbox();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeImageLightbox();
});

async function boot() {
  try {
    if (await loadSession()) {
      showApp();
      await refresh();
      return;
    }
  } catch (error) {
    showLogin();
    return;
  }
  showLogin();
}

boot();
