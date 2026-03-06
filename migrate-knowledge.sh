#!/bin/bash

echo "🔄 Migrating legacy knowledge base to Obsidian vault..."
echo ""

LEGACY_DIR="D:/lemondata-free/lemondata-content/seomaster/knowledge"
OBSIDIAN_DIR="D:/crazyrouter"

# Check if legacy directory exists
if [ ! -d "$LEGACY_DIR" ]; then
  echo "❌ Legacy knowledge directory not found: $LEGACY_DIR"
  exit 1
fi

# Check if Obsidian directory exists
if [ ! -d "$OBSIDIAN_DIR" ]; then
  echo "❌ Obsidian vault not found: $OBSIDIAN_DIR"
  exit 1
fi

# Migrate benchmarks.md
echo "[1/4] Migrating benchmarks.md → Domain/Performance.md"
cat > "$OBSIDIAN_DIR/Domain/Performance.md" << 'ENDFILE'
---
type: domain
priority: high
keywords: [performance, speed, fast, latency, throughput, benchmark, optimization, response time, scalability]
tags: [performance, technical]
last_updated: 2026-03-06
---

# Performance Benchmarks

ENDFILE
cat "$LEGACY_DIR/benchmarks.md" >> "$OBSIDIAN_DIR/Domain/Performance.md"
echo "✅ Performance.md created"

# Migrate competitors.md
echo "[2/4] Migrating competitors.md → Competitors/Overview.md"
cat > "$OBSIDIAN_DIR/Competitors/Overview.md" << 'ENDFILE'
---
type: competitor
priority: high
keywords: [competitor, alternative, vs, versus, compare, comparison, openai, anthropic, google]
tags: [competitor]
last_updated: 2026-03-06
---

# Competitor Overview

ENDFILE
cat "$LEGACY_DIR/competitors.md" >> "$OBSIDIAN_DIR/Competitors/Overview.md"
echo "✅ Overview.md created"

# Migrate published_articles.md
echo "[3/4] Migrating published_articles.md → Domain/Published.md"
cat > "$OBSIDIAN_DIR/Domain/Published.md" << 'ENDFILE'
---
type: domain
priority: low
keywords: [article, blog, post, content, published]
tags: [content, reference]
last_updated: 2026-03-06
---

# Published Articles

ENDFILE
cat "$LEGACY_DIR/published_articles.md" >> "$OBSIDIAN_DIR/Domain/Published.md"
echo "✅ Published.md created"

# Migrate target_keywords.md
echo "[4/4] Migrating target_keywords.md → Domain/Keywords.md"
cat > "$OBSIDIAN_DIR/Domain/Keywords.md" << 'ENDFILE'
---
type: domain
priority: medium
keywords: [keyword, seo, search, ranking, target]
tags: [seo, strategy]
last_updated: 2026-03-06
---

# Target Keywords

ENDFILE
cat "$LEGACY_DIR/target_keywords.md" >> "$OBSIDIAN_DIR/Domain/Keywords.md"
echo "✅ Keywords.md created"

echo ""
echo "✅ Migration complete!"
echo ""
echo "📁 New files created:"
echo "  - $OBSIDIAN_DIR/Domain/Performance.md"
echo "  - $OBSIDIAN_DIR/Competitors/Overview.md"
echo "  - $OBSIDIAN_DIR/Domain/Published.md"
echo "  - $OBSIDIAN_DIR/Domain/Keywords.md"
echo ""
echo "📋 Next steps:"
echo "  1. Review migrated files in Obsidian"
echo "  2. Test: node test-knowledge.js"
echo "  3. Backup legacy: cp -r knowledge knowledge-backup-$(date +%Y%m%d)"
echo "  4. Delete legacy: rm -rf knowledge/"
