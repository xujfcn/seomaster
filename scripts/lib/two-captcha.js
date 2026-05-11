// seomaster/scripts/lib/two-captcha.js
const fetch = require('node-fetch');
const config = require('./config');

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_POLLING_INTERVAL = 5000;
const DEFAULT_SOLVE_TIMEOUT = 180000;

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function getClientKey(clientKey) {
  return clientKey || config.twoCaptchaApiKey();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickDefined(input) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null)
  );
}

class TwoCaptchaClient {
  constructor(options = {}) {
    this.clientKey = getClientKey(options.clientKey);
    this.baseUrl = trimTrailingSlash(options.baseUrl || config.twoCaptchaBaseUrl());
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.pollingInterval = options.pollingInterval || DEFAULT_POLLING_INTERVAL;
    this.solveTimeout = options.solveTimeout || DEFAULT_SOLVE_TIMEOUT;
  }

  async request(method, payload = {}, options = {}) {
    const res = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: options.timeout || this.timeout,
      body: JSON.stringify({ clientKey: this.clientKey, ...payload }),
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      throw new Error(`2Captcha returned non-JSON response: ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      throw new Error(`2Captcha ${method} failed: HTTP ${res.status} ${text}`);
    }

    if (data.errorId && data.errorId !== 0) {
      const details = data.errorDescription || data.errorCode || 'Unknown 2Captcha error';
      throw new Error(`2Captcha ${method} failed: ${details}`);
    }

    return data;
  }

  async getBalance() {
    const data = await this.request('getBalance');
    return data.balance;
  }

  async createTask(task, options = {}) {
    if (!task || typeof task !== 'object') {
      throw new Error('2Captcha createTask requires a task object');
    }

    if (!task.type) {
      throw new Error('2Captcha task.type is required');
    }

    const data = await this.request('createTask', {
      task,
      ...pickDefined({
        languagePool: options.languagePool,
        callbackUrl: options.callbackUrl,
        softId: options.softId,
      }),
    });

    return data.taskId;
  }

  async getTaskResult(taskId) {
    if (!taskId) {
      throw new Error('2Captcha taskId is required');
    }

    return this.request('getTaskResult', { taskId });
  }

  async waitForResult(taskId, options = {}) {
    const startedAt = Date.now();
    const timeout = options.timeout || this.solveTimeout;
    const pollingInterval = options.pollingInterval || this.pollingInterval;

    while (Date.now() - startedAt < timeout) {
      const result = await this.getTaskResult(taskId);
      if (result.status === 'ready') {
        return result;
      }

      if (result.status !== 'processing') {
        throw new Error(`Unexpected 2Captcha task status: ${result.status || '(empty)'}`);
      }

      if (typeof options.onPoll === 'function') {
        options.onPoll(result);
      }

      await sleep(pollingInterval);
    }

    throw new Error(`2Captcha task ${taskId} timed out after ${timeout}ms`);
  }

  async solveTask(task, options = {}) {
    const taskId = await this.createTask(task, options);
    const result = await this.waitForResult(taskId, options);
    return { taskId, result };
  }

  async reportCorrect(taskId) {
    return this.request('reportCorrect', { taskId });
  }

  async reportIncorrect(taskId) {
    return this.request('reportIncorrect', { taskId });
  }
}

async function getBalance(options = {}) {
  return new TwoCaptchaClient(options).getBalance();
}

async function request(method, payload = {}, options = {}) {
  return new TwoCaptchaClient(options).request(method, payload, options);
}

module.exports = {
  TwoCaptchaClient,
  getBalance,
  request,
};
