#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const config = require('./lib/config');
const { parseArgs } = require('./lib/parse-args');
const { readMarkdownDocument, writeMarkdownDocument } = require('./lib/frontmatter');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'username/image-repo';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const IMAGE_BASE_PATH = 'seomaster';
const DEFAULT_IMAGE_MODELS = [
  'gemini-3.1-flash-image-preview',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
  'imagen-4.0-generate-001',
];

function getImageModels() {
  const configured = (process.env.IMAGE_MODELS || process.env.IMAGE_MODEL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return configured.length > 0 ? configured : DEFAULT_IMAGE_MODELS;
}

function extractImageMarkers(content) {
  const regex = /<!-- IMAGE: (.+?) -->/g;
  const markers = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    markers.push({
      fullMatch: match[0],
      description: match[1],
      index: match.index
    });
  }
  
  return markers;
}

async function generateImage(imagePrompt, label) {
  console.log(`  Generating ${label}...`);
  const models = getImageModels();

  for (const model of models) {
    try {
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
              content: imagePrompt
            }
          ],
          max_tokens: 4096,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const error = await res.text();
        console.warn(`    ⚠️  ${model} failed: ${error}`);
        continue;
      }

      const data = await res.json();
      const extracted = extractImageFromResponse(data);

      let imageBuffer = extracted.imageBuffer;

      if (extracted.imageUrl) {
        const imageRes = await fetch(extracted.imageUrl);
        imageBuffer = await imageRes.buffer();
      }

      if (imageBuffer) {
        console.log(`    ✓ ${model} generated (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
        return imageBuffer;
      }

      console.warn(`    ⚠️  ${model} returned no usable image data`);
    } catch (error) {
      console.warn(`    ⚠️  ${model} error: ${error.message}`);
    }
  }

  return null;
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

function buildImagePrompt(description) {
  const basePrompt = 'Create a clean, professional technical diagram. Style: modern, minimalist. Colors: blue and white. ';
  
  if (description.includes('comparison') || description.includes('table')) {
    return basePrompt + `Comparison table: ${description}. Clear labels and data.`;
  } else if (description.includes('flowchart') || description.includes('flow')) {
    return basePrompt + `Flowchart: ${description}. Arrows and boxes.`;
  } else if (description.includes('screenshot') || description.includes('dashboard')) {
    return basePrompt + `Dashboard mockup: ${description}. Realistic UI.`;
  } else if (description.includes('decision tree')) {
    return basePrompt + `Decision tree: ${description}. Yes/no branches.`;
  } else {
    return basePrompt + `Diagram: ${description}. Icons and visual elements.`;
  }
}

function buildCoverPrompt(title, keyword = '') {
  return [
    'Create a cinematic 16:9 blog cover illustration for a technical SEO article.',
    `Article title: ${title}.`,
    keyword ? `Primary keyword: ${keyword}.` : '',
    'Style: modern technical editorial hero image, crisp lighting, premium product-style composition.',
    'Subject: AI video generation workflow, API orchestration, monitoring dashboard, motion pipeline.',
    'Constraints: no text, no logos, no watermark, no UI chrome, no stock-photo look, no people close-up.',
    'Colors: clean blue, cyan, graphite, subtle gradients.',
    'Output should feel polished enough for a SaaS blog hero image.'
  ].filter(Boolean).join(' ');
}

async function uploadToGitHub(imageBuffer, filename) {
  if (!GITHUB_TOKEN) {
    console.warn('    ⚠️  GITHUB_TOKEN not set, skipping upload');
    return null;
  }
  
  const filePath = `${IMAGE_BASE_PATH}/${filename}`;
  const base64Content = imageBuffer.toString('base64');
  
  try {
    const checkRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
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
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add image: ${filename}`,
          content: base64Content,
          branch: GITHUB_BRANCH,
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
    const imageUrl = result.content.download_url;
    
    console.log(`    ✓ Uploaded to GitHub`);
    return imageUrl;
    
  } catch (error) {
    console.warn(`    ⚠️  Upload error: ${error.message}`);
    return null;
  }
}

function replaceImageMarkers(content, replacements) {
  let newContent = content;
  
  replacements.reverse().forEach(({ marker, imageUrl, altText }) => {
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
  const maxImages = Number(args['max-images'] || process.env.MAX_INLINE_IMAGES || 3);
  const allowLocal = args['allow-local'] === true;
  
  if (!fs.existsSync(draftPath)) {
    console.error(`Error: File not found: ${draftPath}`);
    process.exit(1);
  }
  
  console.log('\n🎨 SEOMaster: Auto Image Generation\n');
  console.log(`  Draft: ${draftPath}`);
  console.log(`  GitHub: ${GITHUB_REPO}\n`);
  
  const { metadata, content } = readMarkdownDocument(draftPath);
  const slug = getArticleSlug(draftPath, metadata);
  const title = getMarkdownTitle(content, metadata, slug);
  const markers = extractImageMarkers(content);
  const markersToProcess = markers.slice(0, maxImages);

  if (markers.length > maxImages) {
    console.log(`⚠️  Found ${markers.length} markers, limiting to ${maxImages} images\n`);
  }

  const nextMetadata = {
    ...metadata,
    slug,
  };

  console.log('[1/4] Generating cover image...\n');

  if (!nextMetadata.cover_image_url) {
    const coverBuffer = await generateImage(
      buildCoverPrompt(title, nextMetadata.keyword || title),
      `cover for "${title}"`
    );

    if (!coverBuffer) {
      throw new Error('Cover image generation failed.');
    }

    const coverUploadUrl = await uploadToGitHub(coverBuffer, `${slug}-cover.png`);
    const coverRef = resolveStoredImageReference(
      coverBuffer,
      coverUploadUrl,
      path.join(path.dirname(draftPath), `${slug}-cover.png`),
      allowLocal
    );
    nextMetadata.cover_image_url = coverRef.imageRef;
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

    const imageBuffer = await generateImage(
      buildImagePrompt(marker.description),
      `inline image ${i + 1}: "${marker.description.slice(0, 60)}..."`
    );

    if (!imageBuffer) {
      failures.push(`Inline image ${i + 1} failed to generate`);
      continue;
    }

    const imageUrl = await uploadToGitHub(imageBuffer, filename);
    try {
      const imageRef = resolveStoredImageReference(
        imageBuffer,
        imageUrl,
        path.join(path.dirname(draftPath), filename),
        allowLocal
      );
      replacements.push({
        marker: marker.fullMatch,
        imageUrl: imageRef.imageRef,
        altText: marker.description.slice(0, 100)
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

  const newContent = replaceImageMarkers(content, replacements);
  writeMarkdownDocument(draftPath, nextMetadata, newContent);

  console.log(`  ✓ Updated cover + ${replacements.length} inline image(s)\n`);
  console.log('✅ Done!\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
