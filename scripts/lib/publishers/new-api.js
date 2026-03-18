const fetch = require('node-fetch');

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function trimLeadingSlash(value) {
  return String(value || '').replace(/^\/+/, '');
}

function joinUrl(baseUrl, pathname) {
  return `${trimTrailingSlash(baseUrl)}/${trimLeadingSlash(pathname)}`;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const rawText = await response.text();

  let payload = null;
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch (error) {
      payload = {
        success: false,
        message: `Invalid JSON response: ${error.message}`,
        raw: rawText,
      };
    }
  }

  if (!response.ok) {
    const message = payload?.message || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.response = payload;
    throw error;
  }

  if (payload && payload.success === false) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.response = payload;
    throw error;
  }

  return payload;
}

function buildHeaders(config) {
  return {
    Authorization: `Bearer ${config.token}`,
    'Content-Type': 'application/json',
    'New-Api-User': String(config.userId),
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };
}

function buildPublishedUrl(config, slug) {
  const blogBaseUrl = trimTrailingSlash(config.blogBaseUrl || '');
  if (blogBaseUrl) {
    return `${blogBaseUrl}/${slug}`;
  }
  return `${trimTrailingSlash(config.baseUrl)}/blog/${slug}`;
}

function buildDraftPayload(article) {
  return {
    title: article.title,
    slug: article.slug,
    content: article.content,
    content_type: article.contentType || 'markdown',
    summary: article.summary,
    cover_image_url: article.coverImageUrl || '',
    tag: article.tag || 'Tutorial',
    language: article.language || 'en',
    status: 1,
    sort_order: Number(article.sortOrder || 0),
  };
}

async function createBlog(article, config) {
  const payload = buildDraftPayload(article);
  const url = joinUrl(config.baseUrl, '/api/blog/admin/');
  const response = await requestJson(url, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify(payload),
  });

  return {
    payload,
    response,
  };
}

async function updateBlog(article, config, blogId) {
  const payload = buildDraftPayload(article);
  const url = joinUrl(config.baseUrl, `/api/blog/admin/${blogId}`);
  const response = await requestJson(url, {
    method: 'PUT',
    headers: buildHeaders(config),
    body: JSON.stringify(payload),
  });

  return {
    payload,
    response,
  };
}

async function publishBlog(config, blogId) {
  const url = joinUrl(config.baseUrl, `/api/blog/admin/${blogId}/publish`);
  const response = await requestJson(url, {
    method: 'POST',
    headers: buildHeaders(config),
  });

  return response;
}

async function getBlog(config, blogId) {
  const url = joinUrl(config.baseUrl, `/api/blog/admin/${blogId}`);
  const response = await requestJson(url, {
    method: 'GET',
    headers: buildHeaders(config),
  });

  return response?.data || response;
}

async function publishArticle(article, config) {
  const existingId = article.cmsPostId || article.remoteBlogId || '';
  let draftStep;

  if (existingId) {
    draftStep = await updateBlog(article, config, existingId);
  } else {
    draftStep = await createBlog(article, config);
  }

  const cmsPostId = draftStep?.response?.data?.id || existingId;
  if (!cmsPostId) {
    throw new Error('Publish failed: missing blog id after create/update');
  }

  const publishResponse = await publishBlog(config, cmsPostId);
  const blog = await getBlog(config, cmsPostId);

  return {
    success: true,
    cms_post_id: String(cmsPostId),
    published_url: buildPublishedUrl(config, blog.slug || article.slug),
    blog,
    steps: {
      draft: draftStep.response,
      publish: publishResponse,
      detail: blog,
    },
    raw_response: {
      draft: draftStep.response,
      publish: publishResponse,
      detail: blog,
    },
  };
}

module.exports = {
  publishArticle,
};
