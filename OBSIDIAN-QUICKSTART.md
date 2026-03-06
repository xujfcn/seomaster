# Obsidian Knowledge Base - Quick Start

This guide will get you up and running with the Obsidian knowledge base in 5 minutes.

## Prerequisites

- Obsidian installed (download from https://obsidian.md)
- SEOMaster installed and configured
- `.env` file with `OBSIDIAN_VAULT_PATH` set

## Step 1: Open Obsidian Vault (1 minute)

1. Open Obsidian
2. Click "Open folder as vault"
3. Select `D:\crazyrouter`
4. Click "Open"

You should see:
```
D:/crazyrouter/
├── Core/
│   └── Product.md
├── Domain/
│   └── Pricing.md
├── Competitors/
├── Cases/
└── Templates/
```

## Step 2: Verify Configuration (30 seconds)

Check your `.env` file:

```bash
cd D:\lemondata-free\lemondata-content\seomaster
cat .env | grep OBSIDIAN
```

Should show:
```
OBSIDIAN_VAULT_PATH=D:/crazyrouter
```

If not, add it:
```bash
echo "OBSIDIAN_VAULT_PATH=D:/crazyrouter" >> .env
```

## Step 3: Test Knowledge Loading (30 seconds)

```bash
cd D:\lemondata-free\lemondata-content\seomaster
node test-knowledge.js
```

Expected output:
```
=== Test 1: Keyword "pricing" ===
📚 knowledge: 2 files (Product.md, Pricing.md)
Length: 1932 chars
```

✅ If you see this, knowledge loading is working!

## Step 4: Create Your First Knowledge File (2 minutes)

### Option A: Use Template (Recommended)

1. In Obsidian, open `Templates/Domain-Knowledge-Template.md`
2. Copy all content (Ctrl+A, Ctrl+C)
3. Create new file in `Domain/` folder (e.g., `Domain/Features.md`)
4. Paste content (Ctrl+V)
5. Replace `{{标题}}` with "Features"
6. Fill in keywords:
   ```yaml
   keywords: [feature, function, capability, tool, integration, api, sdk]
   ```
7. Fill in content
8. Save (Ctrl+S)

### Option B: Manual Creation

Create `Domain/Features.md`:

```markdown
---
type: domain
priority: high
keywords: [feature, function, capability, tool, integration, api, sdk]
tags: [features, technical]
last_updated: 2026-03-06
---

# Features

## Core Features

- **Multi-protocol Support**: OpenAI, Anthropic, Google, Gemini
- **Unified API**: One API key for all models
- **Cost Savings**: 30-50% cheaper than official APIs

## Integration

- Compatible with OpenAI SDK
- No code changes required
- Drop-in replacement

## Related Links

- [[Core/Product]]
- [[Domain/Pricing]]
```

## Step 5: Generate Article with New Knowledge (1 minute)

```bash
cd D:\lemondata-free\lemondata-content\seomaster
seomaster new "ai api features" --results 3 --words 1500
```

Watch the output:
```
📚 knowledge: 3 files (Product.md, Features.md, Pricing.md)
```

✅ Your new `Features.md` file is being used!

## What's Next?

### Add More Knowledge Files

Create files for:
- `Domain/Performance.md` - Performance benchmarks
- `Domain/Security.md` - Security features
- `Domain/Integration.md` - Integration guides
- `Competitors/OpenAI.md` - OpenAI comparison
- `Competitors/Anthropic.md` - Anthropic comparison

### Optimize Keywords

For each file, add comprehensive keywords:

```yaml
# Good: Comprehensive
keywords: [price, pricing, cost, cheap, affordable, save, money, discount, free, plan, subscription, payment, pay, how much, expensive, budget]

# Bad: Too few
keywords: [price, pricing]
```

### Use Obsidian Features

- **Links**: Use `[[Other File]]` to link between files
- **Tags**: Use `#tag` in content for organization
- **Search**: Use Ctrl+Shift+F to search all files
- **Graph View**: Click graph icon to see relationships

## Troubleshooting

### Knowledge not loading?

Check:
1. `OBSIDIAN_VAULT_PATH` is set in `.env`
2. Files have YAML Front Matter
3. Keywords match article keyword
4. Files are in correct directories (not in `Templates/`)

### Test specific keyword:

```javascript
// test-knowledge.js
const { loadKnowledge } = require('./scripts/lib/knowledge');
const knowledge = loadKnowledge('your-keyword', 5000);
console.log(knowledge);
```

### Files not matching?

Check keyword matching:
- Article keyword: "ai api pricing"
- File keywords: `[price, pricing, cost]`
- Match: ✅ "pricing" is in both

## Tips

1. **Keep Core files small** (500-1000 words) - they're always loaded
2. **Make Domain files detailed** (1000-2000 words) - they're loaded on demand
3. **Use specific keywords** - "pricing" not just "price"
4. **Update `last_updated`** - helps track freshness
5. **Link related files** - use `[[Other File]]` syntax

## Resources

- Full Guide: `D:/crazyrouter/GUIDE.md`
- Integration Doc: `seomaster/OBSIDIAN-INTEGRATION.md`
- Changelog: `seomaster/CHANGELOG.md`

---

**Time to complete**: ~5 minutes
**Difficulty**: Easy
**Next step**: Create 5-10 domain knowledge files for your product
