function normalizeText(value) {
  return String(value || '').trim();
}

function toNumber(value) {
  if (!value) return 0;
  const normalized = String(value).toUpperCase();
  const roman = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
  };
  if (roman[normalized]) return roman[normalized];

  const chineseDigits = {
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };
  if (chineseDigits[normalized]) return chineseDigits[normalized];
  if (/^十[一二三四五六七八九]$/.test(normalized)) {
    return 10 + chineseDigits[normalized[1]];
  }
  if (/^[一二三四五六七八九]十$/.test(normalized)) {
    return chineseDigits[normalized[0]] * 10;
  }
  if (/^[一二三四五六七八九]十[一二三四五六七八九]$/.test(normalized)) {
    return chineseDigits[normalized[0]] * 10 + chineseDigits[normalized[2]];
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function extractRequiredListCount(...values) {
  const text = values.map(normalizeText).filter(Boolean).join('\n');
  if (!text) return null;

  const patterns = [
    /\btop\s*([0-9]{1,2}|[ivx]{1,5})\b/i,
    /(?:排行榜|榜单|排名|推荐|清单|列表|前|最佳|精选|盘点)\s*(?:top\s*)?([0-9]{1,2}|[一二两三四五六七八九十]{1,3})\s*(?:个|款|种|名|项|条|大)?/i,
    /(?:top\s*)?([0-9]{1,2}|[一二两三四五六七八九十]{1,3})\s*(?:个|款|种|名|项|条|大)?(?:排行榜|榜单|排名|推荐|清单|列表|前|最佳|精选|盘点)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const count = toNumber(match?.[1]);
    if (count >= 2 && count <= 50) return count;
  }

  return null;
}

function inferStructuredRequirements({ keyword = '', keywords = [], brief = '', intent = '' } = {}) {
  const requiredListCount = extractRequiredListCount(keyword, ...(keywords || []), brief);
  const combined = [keyword, ...(keywords || []), brief, intent].map(normalizeText).join(' ');
  const looksLikeRanking = Boolean(requiredListCount)
    || /排行榜|榜单|排名|推荐对比|top\s*\d+|best\s+\d+|前\s*[一二两三四五六七八九十\d]+/i.test(combined);

  return {
    requiredListCount,
    listStyle: looksLikeRanking,
  };
}

function sectionTitle(section) {
  return normalizeText(section?.h2 || section?.title);
}

function sectionLooksLikeRankedItem(section) {
  const title = sectionTitle(section);
  if (/^(?:no\.?\s*)?\d{1,2}[\.、:：\s-]/i.test(title)) return true;
  if (/^第\s*[一二两三四五六七八九十\d]+\s*(?:名|款|个|种|项|条)/.test(title)) return true;
  if (/^top\s*\d{1,2}\b/i.test(title)) return true;
  return false;
}

function h3Items(section) {
  if (Array.isArray(section?.h3_items)) return section.h3_items;
  if (Array.isArray(section?.subsections)) {
    return section.subsections.map((item) => ({
      h3: item.title,
      h4_items: item.points || [],
      word_count: item.word_count,
      image_needed: item.image_needed,
      image_description: item.image_description,
    }));
  }
  return [];
}

function subsectionLooksLikeRankedItem(item) {
  return sectionLooksLikeRankedItem({ h2: item?.h3 || item?.title });
}

function rankedSectionsFromSubsections(sections, count, options = {}) {
  const ranked = [];
  for (const section of sections) {
    for (const item of h3Items(section)) {
      if (!subsectionLooksLikeRankedItem(item)) continue;
      ranked.push({
        h2: item.h3 || item.title,
        key_point: section.key_point || (options.lang === 'zh'
          ? '说明该榜单项的排名理由、适用场景和注意事项。'
          : 'Explain this ranked item with reasons, fit, and cautions.'),
        evidence: Array.isArray(section.evidence) ? section.evidence : [],
        h3_items: [
          {
            h3: options.lang === 'zh' ? '推荐理由与注意事项' : 'Reasons and cautions',
            h4_items: item.h4_items || item.points || [],
            word_count: item.word_count || 180,
            image_needed: item.image_needed || false,
            image_description: item.image_description || '',
          },
        ],
        word_count: item.word_count || section.word_count || 220,
      });
    }
  }
  return ranked.slice(0, count);
}

function rankedItemLabel(index, lang = 'zh') {
  return lang === 'zh' ? `第${index}名` : `Rank ${index}`;
}

function normalizeRankedOutline(outline, requirements = {}, options = {}) {
  const count = Number(requirements.requiredListCount || 0);
  if (!count) return outline;

  const next = { ...outline };
  const sections = Array.isArray(next.sections) ? [...next.sections] : [];
  const rankedSections = sections.filter(sectionLooksLikeRankedItem);
  const rankedSubsections = rankedSections.length < count
    ? rankedSectionsFromSubsections(sections, count, options)
    : [];
  const shouldUseSubsections = rankedSubsections.length === count;
  const shouldFlatten = rankedSections.length === count || (rankedSections.length >= Math.min(3, count) && sections.length !== count);

  if (shouldUseSubsections) {
    next.sections = rankedSubsections;
  } else if (shouldFlatten) {
    next.sections = rankedSections.slice(0, count);
  } else {
    next.sections = sections;
  }

  next.sections = next.sections.slice(0, count).map((section, index) => {
    const title = sectionTitle(section);
    const hasRankPrefix = sectionLooksLikeRankedItem(section);
    return {
      ...section,
      h2: hasRankPrefix ? title : `${rankedItemLabel(index + 1, options.lang)}：${title || '待补充推荐对象'}`,
      key_point: section.key_point || (options.lang === 'zh'
        ? `说明第 ${index + 1} 个榜单项的排名理由、适用场景和注意事项。`
        : `Explain why ranked item ${index + 1} belongs here, who it fits, and what to watch for.`),
    };
  });

  return next;
}

function validateStructuredOutline(outline, requirements = {}) {
  const count = Number(requirements.requiredListCount || 0);
  if (!count) return [];
  const sections = Array.isArray(outline?.sections) ? outline.sections : [];
  const errors = [];
  if (sections.length !== count) {
    errors.push(`Expected exactly ${count} ranked sections, got ${sections.length}.`);
  }
  return errors;
}

function formatStructuredRequirementPrompt(requirements = {}, lang = 'zh') {
  const count = Number(requirements.requiredListCount || 0);
  if (!count) return '';
  if (lang === 'zh') {
    return [
      `硬性结构要求：用户要求榜单/TOP${count}，最终大纲必须生成且仅生成 ${count} 个主要 H2 榜单项。`,
      `每个 H2 必须对应一个独立排名项，标题以“第1名：...”“第2名：...”直到“第${count}名：...”呈现。`,
      '不要把 TOP 数量理解为竞品抓取数量；竞品数只用于外部页面参考。正文必须完整覆盖全部排名项。',
    ].join('\n');
  }
  return [
    `Hard structure requirement: the user asked for a TOP ${count} ranking/list. The outline must contain exactly ${count} main H2 ranked items.`,
    `Each H2 must be one distinct ranked item, titled "Rank 1: ...", "Rank 2: ..." through "Rank ${count}: ...".`,
    'Do not treat this TOP count as the competitor scrape count; competitor count is only for external research pages.',
  ].join('\n');
}

module.exports = {
  extractRequiredListCount,
  formatStructuredRequirementPrompt,
  inferStructuredRequirements,
  normalizeRankedOutline,
  validateStructuredOutline,
};
