#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const config = require('./lib/config');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'username/image-repo';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const IMAGE_BASE_PATH = 'seomaster';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] || true;
      i++;
    }
  }
  return args;
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

async function generateImage(description, index) {
  console.log(`  [${index + 1}] Generating: "${description.slice(0, 60)}..."`);

  const imagePrompt = buildImagePrompt(description);

  try {
    // 使用 Gemini 3.1 Flash Image Preview 模型
    const res = await fetch(`${config.aiBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.aiApiKey()}`
      },
      body: JSON.stringify({
        model: 'gemini-3.1-flash-image-preview',
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
      console.warn(`    ⚠️  Generation failed: ${error}`);
      return null;
    }

    const data = await res.json();

    // Gemini 返回的图片可能在 message.content 中（base64 或 URL）
    // 需要根据实际 API 响应格式调整
    let imageUrl = null;
    let imageBuffer = null;

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const message = data.choices[0].message;

      // 检查是否有图片 URL
      if (message.image_url) {
        imageUrl = message.image_url;
      } else if (message.content && typeof message.content === 'string') {
        // 检查是否是 base64 图片
        if (message.content.startsWith('data:image')) {
          const base64Data = message.content.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (message.content.startsWith('http')) {
          imageUrl = message.content;
        }
      }
    }

    // 如果有 URL，下载图片
    if (imageUrl) {
      const imageRes = await fetch(imageUrl);
      imageBuffer = await imageRes.buffer();
    }

    if (!imageBuffer) {
      console.warn(`    ⚠️  No image data in response`);
      return null;
    }

    console.log(`    ✓ Generated (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
    return imageBuffer;

  } catch (error) {
    console.warn(`    ⚠️  Error: ${error.message}`);
    return null;
  }
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

async function main() {
  const args = parseArgs(process.argv);
  
  if (!args.draft) {
    console.error('Usage: node scripts/generate-images.js --draft <draft-file.md>');
    process.exit(1);
  }
  
  const draftPath = args.draft;
  
  if (!fs.existsSync(draftPath)) {
    console.error(`Error: File not found: ${draftPath}`);
    process.exit(1);
  }
  
  console.log('\n🎨 SEOMaster: Auto Image Generation\n');
  console.log(`  Draft: ${draftPath}`);
  console.log(`  GitHub: ${GITHUB_REPO}\n`);
  
  const content = fs.readFileSync(draftPath, 'utf-8');
  const markers = extractImageMarkers(content);
  
  if (markers.length === 0) {
    console.log('✅ No image markers found.\n');
    return;
  }
  
  // 限制最多3张配图
  const maxImages = 3;
  const markersToProcess = markers.slice(0, maxImages);

  if (markers.length > maxImages) {
    console.log(`⚠️  Found ${markers.length} markers, limiting to ${maxImages} images\n`);
  }

  console.log(`[1/3] Processing ${markersToProcess.length} image marker(s)\n`);
  console.log('[2/3] Generating images...\n');

  const replacements = [];
  const slug = path.basename(draftPath, '-draft.md');

  for (let i = 0; i < markersToProcess.length; i++) {
    const marker = markersToProcess[i];
    const filename = `${slug}-${i + 1}.png`;
    
    const imageBuffer = await generateImage(marker.description, i);
    
    if (!imageBuffer) {
      console.log(`    ⚠️  Skipping\n`);
      continue;
    }
    
    const imageUrl = await uploadToGitHub(imageBuffer, filename);
    
    if (imageUrl) {
      replacements.push({
        marker: marker.fullMatch,
        imageUrl,
        altText: marker.description.slice(0, 100)
      });
      console.log(`    → ${imageUrl}\n`);
    } else {
      const localPath = path.join(path.dirname(draftPath), filename);
      fs.writeFileSync(localPath, imageBuffer);
      console.log(`    → Saved: ${localPath}\n`);
      
      replacements.push({
        marker: marker.fullMatch,
        imageUrl: `./${filename}`,
        altText: marker.description.slice(0, 100)
      });
    }
  }
  
  if (replacements.length > 0) {
    console.log('[3/3] Updating draft...\n');
    
    const newContent = replaceImageMarkers(content, replacements);
    fs.writeFileSync(draftPath, newContent, 'utf-8');
    
    console.log(`  ✓ Updated ${replacements.length} image(s)\n`);
  }
  
  console.log('✅ Done!\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
