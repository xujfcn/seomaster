#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');
const config = require('./lib/config');
const { parseArgs } = require('./lib/parse-args');
const { readMarkdownDocument, writeMarkdownDocument } = require('./lib/frontmatter');
const { buildImagePromptDetails } = require('./lib/image-rules');

const DEFAULT_IMAGE_MODELS = [
  'gpt-image-2',
  'doubao-seedream-5-0',
  'qwen-image-max',
  'gemini-3.1-flash-image-preview',
  'gemini-2.5-flash-image-preview',
  'imagen-4.0-generate-001',
];
const MAX_IMAGE_PROMPT_CHARS = 6000;

function getImageModels() {
  const configured = (process.env.IMAGE_MODELS || process.env.IMAGE_MODEL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return configured.length > 0 ? configured : DEFAULT_IMAGE_MODELS;
}

function getImageStorageConfig() {
  return {
    githubToken: process.env.GITHUB_TOKEN || '',
    githubRepo: process.env.GITHUB_REPO || '',
    githubBranch: process.env.GITHUB_BRANCH || 'main',
    imageBasePath: process.env.IMAGE_BASE_PATH || 'seomaster',
    publicBaseUrl: (process.env.IMAGE_PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
  };
}

function extractImageMarkers(content) {
  const regex = /<!--\s*IMAGE:\s*(.*?)\s*-->/gi;
  const markers = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const description = String(match[1] || '').trim();
    if (!description) continue;
    markers.push({
      fullMatch: match[0],
      description,
      index: match.index
    });
  }
  
  return markers;
}

function isChartImageDescription(description) {
  return /图表|表格|对比表|清单|打卡表|流程图|时间轴|chart|table|checklist|timeline|matrix/i.test(String(description || ''));
}

function getInlineImageLimits(args = {}) {
  const regular = Number(args['max-images'] || process.env.MAX_ARTICLE_IMAGES || process.env.MAX_INLINE_IMAGES || 3);
  const charts = Number(args['max-charts'] || process.env.MAX_CHART_IMAGES || 3);
  return {
    regular: Number.isFinite(regular) && regular >= 0 ? regular : 3,
    charts: Number.isFinite(charts) && charts >= 0 ? charts : 3,
  };
}

function selectImageMarkers(markers, limits) {
  let regularCount = 0;
  let chartCount = 0;
  const selected = [];
  const skipped = [];

  for (const marker of markers) {
    const isChart = isChartImageDescription(marker.description);
    if (isChart) {
      if (chartCount < limits.charts) {
        selected.push({ ...marker, imageKind: 'chart' });
        chartCount++;
      } else {
        skipped.push(marker);
      }
      continue;
    }

    if (regularCount < limits.regular) {
      selected.push({ ...marker, imageKind: 'image' });
      regularCount++;
    } else {
      skipped.push(marker);
    }
  }

  return { selected, skipped, regularCount, chartCount };
}

async function generateImage(imagePrompt, label) {
  const result = await generateImageResult(imagePrompt, label);
  return result.imageBuffer;
}

async function generateImageResult(imagePrompt, label, options = {}) {
  console.log(`  Generating ${label}...`);
  const referenceImage = normalizeReferenceImage(options.referenceImage);
  const models = getRequestedImageModels(options.model, { referenceImage });
  const failures = [];

  for (const model of models) {
    try {
      if (usesImagesApi(model)) {
        const imageBuffer = await generateImageWithImagesApi(model, imagePrompt, { referenceImage });
        console.log(`    ✓ ${model} generated (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
        return { imageBuffer, model };
      }

      const content = referenceImage
        ? [
            {
              type: 'text',
              text: `${imagePrompt}\n\nUse the attached reference image as visual guidance for subject, layout, style, colors, and composition. Do not copy any visible text, logos, or watermark from it.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: referenceImage.dataUrl,
              },
            },
          ]
        : imagePrompt;

      const res = await fetch(`${config.aiBaseUrl()}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.aiApiKey()}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content
            }
          ],
          max_tokens: 4096,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const error = await res.text();
        const message = `${model} failed: ${error}`;
        failures.push(message);
        console.warn(`    ⚠️  ${message}`);
        continue;
      }

      const data = await res.json();
      const extracted = extractImageFromResponse(data);

      let imageBuffer = extracted.imageBuffer;

      if (extracted.imageUrl) {
        const imageRes = await fetch(extracted.imageUrl);
        if (!imageRes.ok) {
          throw new Error(`${model} image download failed: ${imageRes.status}`);
        }
        imageBuffer = await imageRes.buffer();
      }

      if (imageBuffer) {
        console.log(`    ✓ ${model} generated (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
        return { imageBuffer, model };
      }

      const message = `${model} returned no usable image data`;
      failures.push(message);
      console.warn(`    ⚠️  ${message}`);
    } catch (error) {
      const message = `${model} error: ${error.message}`;
      failures.push(message);
      console.warn(`    ⚠️  ${message}`);
    }
  }

  const error = new Error(`Image generation returned no image. Tried: ${models.join(', ')}`);
  error.failures = failures;
  if (failures.length > 0) {
    error.message = `${error.message}\n${failures.slice(-4).join('\n')}`;
  }
  throw error;
}

function getRequestedImageModels(model, options = {}) {
  const configured = getImageModels();
  const requested = String(model || '').trim();
  const supportsCurrentMode = (candidate) => !options.referenceImage || supportsImageEditApi(candidate);
  const candidates = configured.filter(supportsCurrentMode);
  if (!requested) return candidates;
  if (configured.includes(requested)) {
    return [requested, ...candidates.filter((candidate) => candidate !== requested)];
  }
  console.warn(`    ⚠️  Unknown image model "${requested}", falling back to configured model list`);
  return candidates;
}

function normalizeReferenceImage(input) {
  if (!input) return null;
  const dataUrl = String(input.dataUrl || input.data_url || '').trim();
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) {
    throw new Error('Reference image must be a valid base64 data URL');
  }
  return {
    dataUrl: `data:${match[1].toLowerCase()};base64,${match[2].replace(/\s+/g, '')}`,
    mimeType: match[1].toLowerCase(),
    name: input.name ? String(input.name) : '',
    size: Number(input.size || 0) || 0,
    buffer: Buffer.from(match[2].replace(/\s+/g, ''), 'base64'),
  };
}

function usesImagesApi(model) {
  return model.startsWith('gpt-image')
    || model.startsWith('doubao-seedream')
    || model.startsWith('qwen-image');
}

function supportsImageEditApi(model) {
  return model.startsWith('gpt-image');
}

function getImageApiOutputParams(model) {
  if (model.startsWith('gpt-image')) {
    return {
      size: '1536x1024',
      output_format: 'png',
    };
  }

  if (model.startsWith('doubao-seedream')) {
    return {
      size: '2K',
      response_format: 'url',
      watermark: false,
    };
  }

  return {
    size: '1024x1024',
    response_format: 'url',
  };
}

function getImagesApiPayload(model, prompt, options = {}) {
  const referenceImage = normalizeReferenceImage(options.referenceImage);
  const finalPrompt = truncateImagePrompt(referenceImage
    ? `${prompt}\n\nUse the uploaded reference image as visual guidance for subject, layout, style, colors, and composition. Do not copy visible text, logos, or watermark from it.`
    : prompt);
  const payload = {
    model,
    prompt: finalPrompt,
    n: 1,
    ...getImageApiOutputParams(model),
  };

  if (referenceImage && supportsImageEditApi(model)) {
    payload.reference_image = referenceImage.dataUrl;
  }
  return payload;
}

async function generateImageWithImagesApi(model, prompt, options = {}) {
  const referenceImage = normalizeReferenceImage(options.referenceImage);
  if (referenceImage) {
    if (!supportsImageEditApi(model)) {
      throw new Error(`${model} does not support image-to-image regeneration through this API. Remove the source image or choose a gpt-image model.`);
    }
    return generateImageWithImageEditApi(model, prompt, referenceImage);
  }

  return generateImageWithGenerationApi(model, prompt, options);
}

async function generateImageWithGenerationApi(model, prompt, options = {}) {
  const res = await fetch(`${config.aiBaseUrl()}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.aiApiKey()}`
    },
    body: JSON.stringify(getImagesApiPayload(model, prompt, options)),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`${model} images generations API failed: ${error}`);
  }

  const data = await res.json();
  return extractImageBufferFromImagesApiResponse(model, data);
}

async function generateImageWithImageEditApi(model, prompt, referenceImage) {
  const multipart = buildImageEditMultipartBody(model, prompt, referenceImage);
  const res = await fetch(`${config.aiBaseUrl()}/images/edits`, {
    method: 'POST',
    headers: {
      'Content-Type': multipart.contentType,
      'Authorization': `Bearer ${config.aiApiKey()}`,
      'Content-Length': String(multipart.body.length),
    },
    body: multipart.body,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`${model} images edits API failed: ${error}`);
  }

  const data = await res.json();
  return extractImageBufferFromImagesApiResponse(model, data);
}

function buildImageEditMultipartBody(model, prompt, referenceImage) {
  const boundary = `----seomaster-${crypto.randomBytes(12).toString('hex')}`;
  const parts = [];

  const addField = (name, value) => {
    if (value === undefined || value === null || value === '') return;
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${String(value)}\r\n`));
  };

  const addFile = (name, file) => {
    const filename = sanitizeImageFilename(file.name || `reference${extensionForMimeType(file.mimeType)}`);
    const mimeType = file.mimeType || 'image/png';
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
    parts.push(file.buffer || Buffer.from(file.dataUrl.split(',')[1], 'base64'));
    parts.push(Buffer.from('\r\n'));
  };

  addField('model', model);
  addField('prompt', truncateImagePrompt(`${prompt}\n\nUse the uploaded image as the source image for image-to-image regeneration. Preserve the useful subject/composition cues while applying the prompt requirements. Do not copy visible text, logos, or watermark from the source image.`));
  addField('n', 1);
  Object.entries(getImageApiOutputParams(model)).forEach(([key, value]) => addField(key, value));
  addFile('image', referenceImage);
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    body: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

function truncateImagePrompt(prompt, maxChars = MAX_IMAGE_PROMPT_CHARS) {
  const text = String(prompt || '').trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 120)).trim()}\n\n[Prompt truncated to fit image generation request limits.]`;
}

function extensionForMimeType(mimeType) {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/gif') return '.gif';
  return '.png';
}

function sanitizeImageFilename(filename) {
  const safe = path.basename(String(filename || 'reference.png')).replace(/[^a-zA-Z0-9._-]/g, '-');
  return safe || 'reference.png';
}

async function extractImageBufferFromImagesApiResponse(model, data) {
  const item = Array.isArray(data.data) ? data.data[0] : null;
  if (item?.b64_json) {
    return Buffer.from(item.b64_json, 'base64');
  }
  if (item?.url) {
    const imageRes = await fetch(item.url);
    if (!imageRes.ok) {
      throw new Error(`${model} image download failed: ${imageRes.status}`);
    }
    return imageRes.buffer();
  }

  throw new Error(`${model} returned no usable image data`);
}

function getImageGenerationParams(model) {
  if (!model) return {};
  if (usesImagesApi(model)) {
    const { prompt, ...params } = getImagesApiPayload(model, '');
    return params;
  }
  return {
    model,
    endpoint: 'chat/completions',
    max_tokens: 4096,
    temperature: 0.7,
  };
}

function getMarkdownTitle(content, metadata, fallbackSlug) {
  if (metadata.title) return String(metadata.title).trim();
  const match = String(content || '').match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return String(fallbackSlug || 'untitled')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getArticleSlug(filePath, metadata) {
  if (metadata.slug) return String(metadata.slug).trim();
  return path.basename(filePath, '.md').replace(/-draft$/, '');
}

function extractMarkdownImage(content) {
  if (typeof content !== 'string') {
    return { imageUrl: null, imageBuffer: null };
  }

  const dataUrlMatch = content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=\s]+)/);
  if (dataUrlMatch) {
    return {
      imageUrl: null,
      imageBuffer: Buffer.from(dataUrlMatch[1].replace(/\s+/g, ''), 'base64'),
    };
  }

  const markdownUrlMatch = content.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
  if (markdownUrlMatch) {
    return { imageUrl: markdownUrlMatch[1], imageBuffer: null };
  }

  const rawUrlMatch = content.match(/https?:\/\/\S+/);
  if (rawUrlMatch) {
    return { imageUrl: rawUrlMatch[0], imageBuffer: null };
  }

  return { imageUrl: null, imageBuffer: null };
}

function extractImageFromContentPart(part) {
  if (!part) {
    return { imageUrl: null, imageBuffer: null };
  }

  if (typeof part === 'string') {
    return extractMarkdownImage(part);
  }

  if (part.image_url) {
    if (typeof part.image_url === 'string') {
      return { imageUrl: part.image_url, imageBuffer: null };
    }
    if (part.image_url.url) {
      return { imageUrl: part.image_url.url, imageBuffer: null };
    }
  }

  if (part.url && typeof part.url === 'string') {
    return { imageUrl: part.url, imageBuffer: null };
  }

  if (part.b64_json) {
    return {
      imageUrl: null,
      imageBuffer: Buffer.from(part.b64_json, 'base64'),
    };
  }

  if (part.inline_data && part.inline_data.data) {
    return {
      imageUrl: null,
      imageBuffer: Buffer.from(part.inline_data.data, 'base64'),
    };
  }

  if (part.data && typeof part.data === 'string' && part.mime_type && part.mime_type.startsWith('image/')) {
    return {
      imageUrl: null,
      imageBuffer: Buffer.from(part.data, 'base64'),
    };
  }

  if (part.text) {
    return extractMarkdownImage(part.text);
  }

  return { imageUrl: null, imageBuffer: null };
}

function extractImageFromResponse(data) {
  if (data && Array.isArray(data.data)) {
    for (const item of data.data) {
      const extracted = extractImageFromContentPart(item);
      if (extracted.imageUrl || extracted.imageBuffer) {
        return extracted;
      }
    }
  }

  if (!data || !Array.isArray(data.choices)) {
    return { imageUrl: null, imageBuffer: null };
  }

  for (const choice of data.choices) {
    if (!choice.message) continue;

    const directImage = extractImageFromContentPart(choice.message.image_url || choice.message);
    if (directImage.imageUrl || directImage.imageBuffer) {
      return directImage;
    }

    const content = choice.message.content;
    if (Array.isArray(content)) {
      for (const part of content) {
        const extracted = extractImageFromContentPart(part);
        if (extracted.imageUrl || extracted.imageBuffer) {
          return extracted;
        }
      }
    } else {
      const extracted = extractImageFromContentPart(content);
      if (extracted.imageUrl || extracted.imageBuffer) {
        return extracted;
      }
    }
  }

  return { imageUrl: null, imageBuffer: null };
}

function buildImagePrompt(description, options = {}) {
  return buildImagePromptDetails({
    ...options,
    imageType: 'inline',
    description,
  }).promptFinal;
}

function buildCoverPrompt(title, keyword = '', content = '', options = {}) {
  return buildCoverPromptDetails(title, keyword, content, options).promptFinal;
}

function buildCoverPromptDetails(title, keyword = '', content = '', options = {}) {
  return buildImagePromptDetails({
    ...options,
    imageType: 'cover',
    title,
    keyword,
    content,
  });
}

function getPromptContextOptions(args = {}, metadata = {}) {
  return {
    projectId: args.project || args['project-id'] || metadata.project || '',
    vaultPath: args['vault-path'] || args.vault || '',
  };
}

function getCoverMetadataPatch(details, model = '') {
  return {
    cover_image_rule_sources: details.ruleSources,
    ...(model ? { cover_image_model: model } : {}),
  };
}

async function uploadToGitHub(imageBuffer, filename) {
  const storage = getImageStorageConfig();
  if (!storage.githubToken) {
    console.warn('    ⚠️  GITHUB_TOKEN not set, skipping upload');
    return null;
  }
  if (!storage.githubRepo || !/^[^/\s]+\/[^/\s]+$/.test(storage.githubRepo)) {
    throw new Error('GITHUB_REPO is required and must use owner/repo format');
  }
  
  const filePath = `${storage.imageBasePath.replace(/^\/+|\/+$/g, '')}/${filename}`;
  const base64Content = imageBuffer.toString('base64');
  
  try {
    const checkRes = await fetch(
      `https://api.github.com/repos/${storage.githubRepo}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `token ${storage.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    let sha = null;
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }
    
    const uploadRes = await fetch(
      `https://api.github.com/repos/${storage.githubRepo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${storage.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add image: ${filename}`,
          content: base64Content,
          branch: storage.githubBranch,
          ...(sha && { sha })
        })
      }
    );
    
    if (!uploadRes.ok) {
      const error = await uploadRes.text();
      console.warn(`    ⚠️  Upload failed: ${error}`);
      return null;
    }
    
    const result = await uploadRes.json();
    const imageUrl = storage.publicBaseUrl
      ? `${storage.publicBaseUrl}/${filePath.split('/').map(encodeURIComponent).join('/')}`
      : result.content.download_url;
    
    console.log(`    ✓ Uploaded to GitHub`);
    return imageUrl;
    
  } catch (error) {
    console.warn(`    ⚠️  Upload error: ${error.message}`);
    return null;
  }
}

function replaceImageMarkers(content, replacements) {
  let newContent = content;
  
  [...replacements].reverse().forEach(({ marker, imageUrl, altText }) => {
    const replacement = `![${altText}](${imageUrl})`;
    newContent = newContent.replace(marker, replacement);
  });
  
  return newContent;
}

function resolveStoredImageReference(imageBuffer, imageUrl, outputPath, allowLocal) {
  if (imageUrl) {
    return {
      imageRef: imageUrl,
      isPublic: true,
      savedPath: '',
    };
  }

  if (!allowLocal) {
    throw new Error(`Image upload failed for ${outputPath}; public image URL is required.`);
  }

  fs.writeFileSync(outputPath, imageBuffer);
  return {
    imageRef: `./${path.basename(outputPath)}`,
    isPublic: false,
    savedPath: outputPath,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  
  if (!args.draft) {
    console.error('Usage: node scripts/generate-images.js --draft <draft-file.md>');
    process.exit(1);
  }
  
  const draftPath = args.draft;
  const imageLimits = getInlineImageLimits(args);
  const allowLocal = args['allow-local'] === true;
  const skipCover = args['skip-cover'] === true;
  const storage = getImageStorageConfig();
  
  if (!fs.existsSync(draftPath)) {
    console.error(`Error: File not found: ${draftPath}`);
    process.exit(1);
  }
  
  console.log('\n🎨 SEOMaster: Auto Image Generation\n');
  console.log(`  Draft: ${draftPath}`);
  console.log(`  GitHub: ${storage.githubRepo}\n`);
  
  const { metadata, content } = readMarkdownDocument(draftPath);
  const slug = getArticleSlug(draftPath, metadata);
  const title = getMarkdownTitle(content, metadata, slug);
  const markers = extractImageMarkers(content);
  const selection = selectImageMarkers(markers, imageLimits);
  const markersToProcess = selection.selected;

  if (selection.skipped.length > 0) {
    console.log(`⚠️  Found ${markers.length} markers, limiting to ${imageLimits.regular} image(s) and ${imageLimits.charts} chart/table image(s)\n`);
  }

  const nextMetadata = {
    ...metadata,
    slug,
  };

  console.log('[1/4] Generating cover image...\n');

  if (skipCover) {
    console.log('  ↷ Cover image skipped by option\n');
  } else if (!nextMetadata.cover_image_url) {
    const promptContext = getPromptContextOptions(args, nextMetadata);
    const coverDetails = buildCoverPromptDetails(title, nextMetadata.keyword || title, content, promptContext);
    const coverResult = await generateImageResult(coverDetails.promptFinal, `cover for "${title}"`);

    const coverUploadUrl = await uploadToGitHub(coverResult.imageBuffer, `${slug}-cover.png`);
    const coverRef = resolveStoredImageReference(
      coverResult.imageBuffer,
      coverUploadUrl,
      path.join(path.dirname(draftPath), `${slug}-cover.png`),
      allowLocal
    );
    nextMetadata.cover_image_url = coverRef.imageRef;
    Object.assign(nextMetadata, getCoverMetadataPatch(coverDetails, coverResult.model));
    if (coverRef.savedPath) {
      console.log(`    → Saved cover: ${coverRef.savedPath}\n`);
    } else {
      console.log(`    → Cover: ${coverRef.imageRef}\n`);
    }
  } else {
    console.log(`  ✓ Existing cover found: ${nextMetadata.cover_image_url}\n`);
  }

  if (markersToProcess.length === 0) {
    writeMarkdownDocument(draftPath, nextMetadata, content);
    console.log('✅ Cover image ready. No inline image markers found.\n');
    return;
  }

  console.log(`[2/4] Processing ${markersToProcess.length} inline image marker(s)\n`);
  console.log('[3/4] Generating inline images...\n');

  const replacements = [];
  const failures = [];

  for (let i = 0; i < markersToProcess.length; i++) {
    const marker = markersToProcess[i];
    const filename = `${slug}-${i + 1}.png`;
    const promptContext = getPromptContextOptions(args, nextMetadata);
    const imageDetails = buildImagePromptDetails({
      ...promptContext,
      imageType: 'inline',
      title,
      keyword: nextMetadata.keyword || title,
      content,
      description: marker.description,
    });

    const imageResult = await generateImageResult(
      imageDetails.promptFinal,
      `inline image ${i + 1}: "${marker.description.slice(0, 60)}..."`
    );

    const imageUrl = await uploadToGitHub(imageResult.imageBuffer, filename);
    try {
      const imageRef = resolveStoredImageReference(
        imageResult.imageBuffer,
        imageUrl,
        path.join(path.dirname(draftPath), filename),
        allowLocal
      );
      replacements.push({
        marker: marker.fullMatch,
        imageUrl: imageRef.imageRef,
        altText: marker.description.slice(0, 100),
        promptRaw: imageDetails.promptRaw,
        promptFinal: imageDetails.promptFinal,
        brief: imageDetails.brief,
        ruleSources: imageDetails.ruleSources,
        model: imageResult.model,
      });
      if (imageRef.savedPath) {
        console.log(`    → Saved: ${imageRef.savedPath}\n`);
      } else {
        console.log(`    → ${imageRef.imageRef}\n`);
      }
    } catch (error) {
      failures.push(error.message);
    }
  }

  if (failures.length > 0 || replacements.length !== markersToProcess.length) {
    throw new Error(`Image generation incomplete: ${failures.join('; ') || 'some inline images were not updated'}`);
  }

  console.log('[4/4] Updating draft...\n');

  let newContent = replaceImageMarkers(content, replacements);
  for (const skipped of selection.skipped) {
    newContent = newContent.replace(skipped.fullMatch, '');
  }
  nextMetadata.inline_image_prompts = replacements.map((item, index) => ({
    index: index + 1,
    alt: item.altText,
    model: item.model,
    rule_sources: item.ruleSources,
  }));
  writeMarkdownDocument(draftPath, nextMetadata, newContent);

  console.log(`  ✓ Updated cover + ${replacements.length} inline image(s)\n`);
  console.log('✅ Done!\n');
}

if (require.main === module) {
  main().catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  buildCoverPrompt,
  buildCoverPromptDetails,
  buildImagePrompt,
  extractImageMarkers,
  getInlineImageLimits,
  isChartImageDescription,
  selectImageMarkers,
  generateImage,
  generateImageResult,
  getCoverMetadataPatch,
  getImageModels,
  getImageStorageConfig,
  getImageGenerationParams,
  getRequestedImageModels,
  getArticleSlug,
  getMarkdownTitle,
  uploadToGitHub,
  supportsImageEditApi,
  truncateImagePrompt,
};
