const path = require('path');
const fs = require('fs');

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

function getLocalMirrorDsn() {
  return process.env.SEOMASTER_LOCAL_DSN || process.env.SQL_DSN || process.env.DATABASE_URL || '';
}

module.exports = {
  getLocalMirrorDsn,
};
