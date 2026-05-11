// seomaster/scripts/lib/two-captcha.js
const fetch = require('node-fetch');
const config = require('./config');

const DEFAULT_TIMEOUT = 30000;

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function getClientKey(clientKey) {
  return clientKey || config.twoCaptchaApiKey();
}

async function request(method, payload = {}, options = {}) {
  const baseUrl = trimTrailingSlash(options.baseUrl || config.twoCaptchaBaseUrl());
  const clientKey = getClientKey(options.clientKey);

  const res = await fetch(`${baseUrl}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    timeout: options.timeout || DEFAULT_TIMEOUT,
    body: JSON.stringify({ clientKey, ...payload }),
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

async function getBalance(options = {}) {
  const data = await request('getBalance', {}, options);
  return data.balance;
}

module.exports = {
  getBalance,
  request,
};
