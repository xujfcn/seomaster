// seomaster/scripts/lib/config.js
const path = require('path');
const fs = require('fs');

// 加载 .env（如果存在）
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

function getRequired(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}. See .env.example`);
  return val;
}

module.exports = {
  apifyToken: () => getRequired('APIFY_API_TOKEN'),
  aiApiKey: () => getRequired('AI_API_KEY'),
  aiBaseUrl: () => process.env.AI_API_BASE_URL || 'https://api.openai.com/v1',
  aiModel: () => process.env.AI_MODEL || 'gpt-4o',
};
