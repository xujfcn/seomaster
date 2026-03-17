# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

SEOMaster is an AI-driven SEO content production CLI tool. It generates articles through a pipeline: **Research → Concept → Draft → Images → Quality Check**. The system uses Apify for web scraping, an OpenAI-compatible AI API for text generation, and GitHub for image hosting. It supports multi-project management with Obsidian vault integration for knowledge bases.

## Commands

```bash
# Install dependencies
npm install

# Install CLI globally (provides `seomaster` and `seo` alias commands)
npm install -g .

# Or link for development
npm link

# Full workflow (auto mode)
seomaster new "keyword" --words 2500

# Full workflow (interactive — prompts for concept confirmation)
seomaster new "keyword" -i --words 2500

# Individual steps
seomaster concept "keyword"              # Generate concept/outline only
seomaster preview <slug>                  # Preview concept
seomaster draft <concept-file>            # Generate draft from concept
seomaster images <draft-file>             # Generate images (max 3)
seomaster check <draft-file>              # Quality check
seomaster list                            # List all articles
seomaster vault:import <draft-file>       # Import article to Obsidian vault

# Project management
seomaster project:list                    # List all projects
seomaster project:add                     # Add new project (interactive)
seomaster project                         # Switch project

# Run scripts directly (npm scripts)
npm run init                                                                        # Initialize new project
npm run concept -- --keyword "keyword" --lang en --market us --results 10 --words 2500
npm run draft -- --concept output/keyword-concept.yaml --out output/
npm run check -- output/keyword-draft.md
```

### CLI Flags
```
-p, --project <name>      Specify project
-l, --lang <en|zh>        Language (default: en)
-w, --words <number>      Word count (default: 2500)
-r, --results <number>    Search results count (default: 5)
-i, --interactive         Interactive mode (confirm concept before draft)
--skip-images             Skip image generation
--no-filter               Disable domain filtering (default filters forums/Q&A sites)
--intent <type>           Keyword intent (informational/navigational/commercial/transactional)
--scene <scenes>          Business scenes, comma-separated
```

**Note:** Interactive mode (`-i`) and `seomaster` (no args) require a real terminal with stdin. They will fail in non-interactive environments due to `inquirer` readline errors.

## Architecture

### Entry Points
- `cli.js` — Commander-based CLI. Defines all commands. When invoked with no args, spawns `interactive.js`.
- `interactive.js` — Inquirer-based interactive menu. Full workflow with project selection, concept confirmation, and article management.

### Pipeline Scripts (`scripts/`)
Each step is a standalone Node.js script:
- `generate-concept.js` — Searches Google via Apify, scrapes competitor outlines, calls AI to generate a structured YAML concept
- `generate-draft.js` — Takes a concept YAML, generates each H2 section in parallel via AI, then assembles intro + sections + FAQ + CTA
- `generate-images.js` — Parses `<!-- IMAGE: description -->` markers from draft, generates images, uploads to GitHub
- `quality-check.js` — Checks draft against rules in `templates/quality-standards.yaml`
- `seo-review.js` — SEO-specific review
- `init-project.js` — Interactive project initialization (creates vault structure, project config)

### Shared Libraries (`scripts/lib/`)
Key modules:
- `config.js` — Manually parses `.env` file, exports lazy getters: `apifyToken()`, `aiApiKey()`, `aiBaseUrl()`, `aiModel()`
- `knowledge.js` — Reads knowledge files from Obsidian vault. `loadConceptKnowledge(keyword)` and `loadDraftKnowledge(keyword)` load different file subsets based on YAML front matter matching.
- `project-manager.js` — Multi-project CRUD via `projects.json`
- `ai-outline-generator.js` — Builds the concept prompt from competitor data + knowledge base, parses JSON response
- `draft-generator.js` — Builds section-by-section AI prompts. All H2 sections generated in parallel via `Promise.all`.
- `draft-config.js` — Loads concept YAML + quality standards + voice config into a single config object for draft generation
- `cli-workflow.js` — Initializes workflow: project selection, sets knowledge base path, merges project defaults with CLI options
- `google-search.js` — Apify Google Search wrapper with domain filtering. Uses `run-sync-get-dataset-items` (150s timeout) to avoid client-side polling.
- `outline-scraper.js` — Scrapes competitor page headings/structure via Apify
- `concept-writer.js` — Serializes AI-generated outline into the `{slug}-concept.yaml` file
- `research-saver.js` — Saves raw Google search + competitor data to `{slug}-research.json`
- `vault-writer.js` — Imports finished drafts into the Obsidian vault's `Published/` directory

### Data Flow
```
keyword → google-search (Apify) → outline-scraper (Apify) → ai-outline-generator (AI API)
  → concept-writer → {slug}-concept.yaml
  → draft-generator (AI API, parallel H2 sections) → {slug}-draft.md
  → generate-images (AI API + GitHub) → {slug}-{n}.png
  → quality-check → console report
```

### Multi-Project System
- `projects.json` — Stores all project configs (vault path, output dir, defaults). Located at repo root.
- Each project points to an **Obsidian vault** directory with subdirectories: `Core/`, `Domain/`, `Competitors/`, `Cases/`, `Research/`, `Published/`, `Templates/`
- `Core/` files are always loaded; `Domain/` files are loaded by keyword matching via front matter
- Knowledge files support YAML front matter: `type`, `priority`, `keywords`, `always_load`, `tags`
- Output directory can be absolute (e.g., `C:\my-vault\Published`) or relative to repo root (e.g., `output`). All path joins must handle both cases with `path.isAbsolute()`.

### AI Prompt Locations
- **Concept/outline generation prompt**: `scripts/lib/ai-outline-generator.js` → `buildPrompt()` function
- **Draft section prompts**: `scripts/lib/draft-generator.js` → `buildSystemPrompt()`, `generateIntro()`, `generateSection()`, `generateFAQ()`, `generateCTA()`
- **Voice/style config**: `templates/project-config.yaml` (template) or `project-config.yaml` at repo root (active)

### Configuration Files
- `config/domain-filter.js` — Blacklist/whitelist for filtering Google results (excludes Reddit, Quora, Wikipedia, social media, etc.)
- `templates/quality-standards.yaml` — Forbidden words, punctuation limits, AI pattern detection, scoring (80/100 passing)
- `templates/project-config.yaml` — Template for project voice, audience, competitors, CTA, SEO keywords
- `templates/article-concept.yaml` — Concept structure template

## Environment Variables

Required in `.env`:
- `APIFY_API_TOKEN` — For Google search and web scraping
- `AI_API_KEY` — OpenAI-compatible API key
- `AI_API_BASE_URL` — API base URL (default: `https://api.openai.com/v1`)
- `AI_MODEL` — Model name (default: `gpt-4o`)
- `GITHUB_TOKEN` — For image upload to GitHub repo
- `GITHUB_REPO` — Format: `username/repo`
- `GITHUB_BRANCH` — Target branch (default: `main`)

## Key Conventions

- All AI calls use OpenAI-compatible chat completions API (not Anthropic SDK)
- Concept files are YAML; drafts are Markdown
- Image markers in drafts: `<!-- IMAGE: description -->`
- Quality standards enforce: ≤3 em dashes, ≤3 bold, ≤2 exclamations, zero forbidden words (signpost, meta-narrative, marketing clichés)
- Keyword-to-slug conversion: lowercase, non-alphanumeric replaced with hyphens
- **Path handling**: Output directories from projects.json can be absolute paths. Always use `path.isAbsolute()` before joining with `__dirname`. Never assume relative paths.
- Draft generation runs all H2 sections in parallel (`Promise.all`) sharing only the intro tail as context
- Post-processing strips excess bold, forbidden words, and adds external links to known terms
- Slug generation includes CJK characters: `/[^a-z0-9\u4e00-\u9fa5]+/g` → hyphens
- CLI auto-resolves file paths: tries exact path → `output/` prefix → slug-based suffix (`-concept.yaml`, `-draft.md`)
- `config.js` parses `.env` manually (not via `dotenv` library) — reads `../../.env` relative to `scripts/lib/`. Note: `dotenv` is in package.json dependencies but is not used by the core code.
- No test framework configured; there are no automated tests. `test-knowledge.js` at repo root is a standalone utility to verify knowledge base loading for a project.
- `templates/writing-rules.md` — Additional writing style rules referenced during draft generation
