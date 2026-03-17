const fs = require('fs');
const yaml = require('js-yaml');

function normalizeContent(content) {
  return String(content || '').replace(/\r\n/g, '\n');
}

function parseFrontMatter(rawContent) {
  const content = normalizeContent(rawContent);
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    return {
      metadata: {},
      content,
    };
  }

  let metadata = {};
  try {
    metadata = yaml.load(match[1]) || {};
  } catch (error) {
    metadata = {};
  }

  return {
    metadata,
    content: match[2],
  };
}

function stringifyFrontMatter(metadata) {
  const yamlText = yaml.dump(metadata || {}, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
  }).trimEnd();

  return `---\n${yamlText}\n---\n`;
}

function readMarkdownDocument(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return parseFrontMatter(raw);
}

function writeMarkdownDocument(filePath, metadata, content) {
  const frontMatter = stringifyFrontMatter(metadata);
  const body = normalizeContent(content || '').replace(/^\n+/, '');
  fs.writeFileSync(filePath, `${frontMatter}\n${body}`, 'utf-8');
}

module.exports = {
  normalizeContent,
  parseFrontMatter,
  readMarkdownDocument,
  stringifyFrontMatter,
  writeMarkdownDocument,
};
