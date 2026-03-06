# Changelog

All notable changes to SEOMaster will be documented in this file.

## [Unreleased]

### Added - 2026-03-06

#### Obsidian Knowledge Base Integration
- **Smart Knowledge Loading**: Automatically loads relevant knowledge files based on article keywords
- **YAML Front Matter Support**: Parse metadata from markdown files (type, priority, keywords, tags)
- **Hierarchical Loading**: 
  - Core files (always loaded)
  - Domain files (loaded by keyword matching)
  - Competitor files (loaded by keyword matching)
  - Case files (loaded by keyword matching)
- **Priority-based Sorting**: Files loaded in order of priority (critical > high > medium > low)
- **Token Optimization**: Limits total knowledge base to 15,000 characters to reduce AI costs

#### Knowledge Base Structure
- Created Obsidian vault at `D:/crazyrouter/`
- Directory structure:
  - `Core/` - Core product information (always loaded)
  - `Domain/` - Domain-specific knowledge (keyword-matched)
  - `Competitors/` - Competitor analysis
  - `Cases/` - Use cases and success stories
  - `Templates/` - Document templates

#### Documentation
- `OBSIDIAN-INTEGRATION.md` - Complete Obsidian integration guide
- `D:/crazyrouter/README.md` - Knowledge base quick start
- `D:/crazyrouter/GUIDE.md` - Detailed usage guide (10,000+ words)
- `D:/crazyrouter/Templates/Domain-Knowledge-Template.md` - Template for domain knowledge
- `D:/crazyrouter/Templates/Competitor-Template.md` - Template for competitor analysis

#### Example Files
- `D:/crazyrouter/Core/Product.md` - Core product information
- `D:/crazyrouter/Domain/Pricing.md` - Pricing information with keyword matching

### Changed - 2026-03-06

#### Knowledge Loading System
- **Modified `scripts/lib/knowledge.js`**:
  - Added `parseFrontMatter()` to parse YAML metadata
  - Added `readAllMarkdownFiles()` to recursively read markdown files
  - Added `matchFilesByKeyword()` to match files by keywords
  - Added `loadObsidianKnowledge()` to load from Obsidian vault
  - Modified `loadConceptKnowledge()` and `loadDraftKnowledge()` to accept keyword parameter
  - Backward compatible with legacy `knowledge/` directory

- **Modified `scripts/lib/ai-outline-generator.js`**:
  - Updated `buildPrompt()` to pass keyword to `loadConceptKnowledge()`

- **Modified `scripts/lib/draft-generator.js`**:
  - Updated `buildSystemPrompt()` to accept keyword parameter
  - Updated all calls to `buildSystemPrompt()` to pass `concept.keyword`

#### Dependencies
- Added `dotenv` package for environment variable management

### Configuration

#### Environment Variables
Added support for `OBSIDIAN_VAULT_PATH` in `.env`:
```bash
OBSIDIAN_VAULT_PATH=D:/crazyrouter
```

### Technical Details

#### YAML Front Matter Format
```yaml
---
type: core|domain|competitor|case
priority: critical|high|medium|low
keywords: [keyword1, keyword2, ...]
tags: [tag1, tag2]
last_updated: 2026-03-06
always_load: true|false
---
```

#### Keyword Matching Algorithm
1. Extract article keyword (e.g., "ai api pricing")
2. Iterate through all markdown files in Obsidian vault
3. Check if file's `keywords` array matches article keyword (contains or is contained)
4. Sort matched files by priority score:
   - `critical`: 100 points
   - `high`: 80 points
   - `medium`: 50 points
   - `low`: 20 points
   - `always_load: true`: 1000 points (highest)
5. Load files until reaching 15,000 character limit

#### File Exclusions
- `Templates/` directory (excluded from loading)
- `.obsidian/` directory (excluded from loading)
- `README.md` (excluded from loading)
- `GUIDE.md` (excluded from loading)

### Benefits

1. **Reduced Token Usage**: Only loads relevant knowledge files (estimated 50% reduction)
2. **Better Organization**: Knowledge organized by topic in Obsidian
3. **Easy Maintenance**: Edit knowledge in Obsidian with visual interface
4. **Scalability**: Can add unlimited knowledge files without affecting performance
5. **Backward Compatible**: Still works with legacy `knowledge/` directory

### Migration Guide

For existing users:

1. **Install Obsidian**: Download from https://obsidian.md
2. **Open Vault**: Open `D:/crazyrouter` in Obsidian
3. **Migrate Knowledge**: Copy content from `knowledge/` to appropriate directories:
   - `product.md` → `Core/Product.md`
   - `models_pricing.md` → `Domain/Pricing.md`
   - `competitors.md` → `Competitors/Overview.md`
   - `benchmarks.md` → `Domain/Performance.md`
4. **Add Metadata**: Add YAML Front Matter to each file
5. **Set Environment Variable**: Add `OBSIDIAN_VAULT_PATH=D:/crazyrouter` to `.env`
6. **Test**: Run `node test-knowledge.js` to verify

### Testing

Created `test-knowledge.js` to test knowledge loading:
```bash
cd seomaster
node test-knowledge.js
```

Expected output:
```
=== Test 1: Keyword "pricing" ===
📚 knowledge: 2 files (Product.md, Pricing.md)
Length: 1932 chars

=== Test 2: Keyword "api" ===
📚 knowledge: 2 files (Product.md, API.md)
Length: 5008 chars

=== Test 3: Keyword "unrelated" ===
📚 knowledge: 1 files (Product.md)
Length: 958 chars
```

### Known Issues

None at this time.

### Future Improvements

1. **Vector Database Integration**: Use Chroma/Pinecone for semantic search (70% token reduction)
2. **Auto-tagging**: Automatically suggest keywords based on content
3. **Knowledge Graph**: Visualize relationships between knowledge files
4. **Multi-language Support**: Support for Chinese knowledge base
5. **Knowledge Validation**: Validate knowledge files for completeness and accuracy

---

## Previous Versions

See git history for previous changes.
