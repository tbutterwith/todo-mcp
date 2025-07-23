#!/bin/bash

# Convert backup JSON to markdown table script wrapper
# Usage: ./scripts/backup-to-markdown.sh

set -e

echo "🔄 Converting backup to markdown table..."
npx tsx scripts/backup-to-markdown.ts

echo "✅ Markdown conversion completed!" 