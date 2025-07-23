#!/bin/bash

# Database backup script wrapper
# Usage: ./scripts/backup.sh [--markdown]

set -e

if [[ "$1" == "--markdown" ]]; then
    echo "🔄 Running database backup with markdown table generation..."
    npx tsx scripts/backup-database.ts --markdown
else
    echo "🔄 Running database backup..."
    npx tsx scripts/backup-database.ts
fi

echo "✅ Backup script completed!" 