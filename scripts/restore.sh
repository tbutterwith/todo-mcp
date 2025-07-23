#!/bin/bash

# Database restore script wrapper
# Usage: ./scripts/restore.sh [backup-file-path]

set -e

if [ -n "$1" ]; then
    echo "🔄 Running database restore from: $1"
    npx tsx scripts/restore-database.ts "$1"
else
    echo "🔄 Running database restore from most recent backup..."
    npx tsx scripts/restore-database.ts
fi

echo "✅ Restore script completed!" 