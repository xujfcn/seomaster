const fs = require('fs');
const path = require('path');
const { buildArticleIndex, saveArticleIndex, slugify } = require('./article-index');
const { detectDuplicates } = require('./duplicate-detector');
const { writeMarkdownDocument } = require('./frontmatter');

const STANDARD_VAULT_DIRS = [
  'Core',
  'Domain',
  'Competitors',
  'Cases',
  'Research',
  'Topics',
  'Drafts',
  'Published',
  'Updates',
  'Operations',
  'Templates',
  'Archive',
];

function getTopicPath(vaultPath, topicKey) {
  return path.join(vaultPath, 'Topics', `${topicKey}.md`);
}

function ensureVaultStructure(vaultPath) {
  const created = [];

  for (const dir of STANDARD_VAULT_DIRS) {
    const fullPath = path.join(vaultPath, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      created.push(fullPath);
    }
  }

  return created;
}

function buildTopicFrontMatter(input) {
  return {
    type: 'topic',
    project: input.projectId,
    topic_key: input.topicKey,
    status: input.status || 'active',
    canonical_keyword: input.keyword,
    intent: input.intent || 'informational',
    cluster: input.cluster || '',
    primary_article_id: input.primaryArticleId || '',
    published_count: input.publishedCount || 0,
    last_published_at: input.lastPublishedAt || '',
    aliases: input.aliases || [],
    related_topics: input.relatedTopics || [],
  };
}

function buildTopicBody(input) {
  return `# ${input.keyword}

## Topic Summary

- Canonical keyword: ${input.keyword}
- Intent: ${input.intent || 'informational'}
- Cluster: ${input.cluster || 'general'}
- Status: ${input.status || 'active'}

## Notes

- Created by SEOMaster topic manager
- Use this card to track whether the topic should create a new article or update an existing one

## Related Articles

- Primary article id: ${input.primaryArticleId || '(none yet)'}
`;
}

function ensureTopicCard(vaultPath, input) {
  const topicKey = input.topicKey || slugify(input.keyword);
  const topicPath = getTopicPath(vaultPath, topicKey);
  fs.mkdirSync(path.dirname(topicPath), { recursive: true });

  if (!fs.existsSync(topicPath)) {
    writeMarkdownDocument(
      topicPath,
      buildTopicFrontMatter({
        ...input,
        topicKey,
      }),
      buildTopicBody({
        ...input,
        topicKey,
      })
    );
  }

  return topicPath;
}

function checkTopicDecision(vaultPath, projectId, input) {
  const index = buildArticleIndex(vaultPath, projectId);
  const duplicate = detectDuplicates(input, index);

  return {
    index,
    duplicate,
  };
}

function createOrUpdateTopicFromInput(vaultPath, projectId, input) {
  const topicKey = input.topicKey || slugify(input.keyword);
  const topicPath = ensureTopicCard(vaultPath, {
    ...input,
    topicKey,
    projectId,
  });
  const index = buildArticleIndex(vaultPath, projectId);
  const indexPath = saveArticleIndex(index);

  return {
    topicKey,
    topicPath,
    index,
    indexPath,
  };
}

module.exports = {
  STANDARD_VAULT_DIRS,
  checkTopicDecision,
  createOrUpdateTopicFromInput,
  ensureTopicCard,
  ensureVaultStructure,
  getTopicPath,
};
