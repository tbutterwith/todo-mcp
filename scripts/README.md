# Database Backup and Restore Scripts

This directory contains scripts for backing up and restoring your Postgres database, with optional markdown table generation.

## Files

- `backup-database.ts` - TypeScript script that exports all todos to JSON
- `backup-to-markdown.ts` - TypeScript script that converts backup JSON to markdown table
- `restore-database.ts` - TypeScript script that imports todos from JSON
- `backup.sh` - Shell wrapper for the backup script
- `backup-to-markdown.sh` - Shell wrapper for the markdown conversion script
- `restore.sh` - Shell wrapper for the restore script

## Usage

### Creating a Backup

```bash
# Using the shell wrapper (recommended)
./scripts/backup.sh

# Create backup with markdown table generation
./scripts/backup.sh --markdown

# Or directly with tsx
npx tsx scripts/backup-database.ts
npx tsx scripts/backup-database.ts --markdown
```

This will:
- Connect to your Postgres database
- Export all todos to a JSON file
- Save the backup to `backups/todo-backup-YYYY-MM-DD.json`
- Optionally generate a markdown table at `backups/todo-backup-YYYY-MM-DD.md`
- Preserve all data including IDs, timestamps, and notes

### Converting Existing Backup to Markdown

If you already have a backup file and want to convert it to a markdown table:

```bash
# Using the shell wrapper
./scripts/backup-to-markdown.sh

# Or directly with tsx
npx tsx scripts/backup-to-markdown.ts
```

This will:
- Find the most recent backup file in the `backups/` directory
- Convert it to a nicely formatted markdown table
- Include emojis for priority and status
- Show full notes text (not truncated)
- Add summary statistics
- Save to `backups/todo-backup-YYYY-MM-DD.md`

### Restoring from a Backup

```bash
# Restore from the most recent backup
./scripts/restore.sh

# Restore from a specific backup file
./scripts/restore.sh backups/todo-backup-2024-01-15.json

# Or directly with tsx
npx tsx scripts/restore-database.ts
npx tsx scripts/restore-database.ts backups/todo-backup-2024-01-15.json
```

**⚠️ Warning**: The restore script will:
- Delete ALL existing todos in the database
- Replace them with the data from the backup file
- Ask for confirmation before proceeding

## Backup File Format

Backup files are stored in JSON format with the following structure:

```json
{
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "todos": [
    {
      "id": 1,
      "name": "Example todo",
      "priority": "Medium",
      "status": "PENDING",
      "notes": "Some notes",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Markdown Table Format

The generated markdown table includes:

- **Header information**: Backup version, generation timestamp, total todos
- **Main table**: ID, Name, Priority (with emojis), Status (with emojis), Notes (full text), Created date, Updated date
- **Summary statistics**: Priority distribution and status distribution with counts

Example markdown output:
```markdown
# Todo Backup Report

**Backup Version:** 1.0.0
**Generated:** Jan 15, 2024, 10:30 AM
**Total Todos:** 5

| ID | Name | Priority | Status | Notes | Created | Updated |
|----|------|----------|--------|-------|---------|---------|
| 1 | Example todo | 🟡 Medium | 📋 PENDING | Some notes | Jan 15, 2024, 10:30 AM | Jan 15, 2024, 10:30 AM |

## Summary

### Priority Distribution
- 🟢 Low: 2
- 🟡 Medium: 2
- 🟠 High: 1

### Status Distribution
- 📋 PENDING: 3
- ✅ DONE: 2
```

## Priority and Status Emojis

The markdown table uses the following emojis:

**Priority:**
- 🔴 Urgent
- 🟠 High  
- 🟡 Medium
- 🟢 Low

**Status:**
- ✅ DONE
- 🔄 IN PROGRESS
- ⏳ WAITING ON OTHERS
- 👀 STAY AWARE
- 📋 PENDING

## Backup Schedule

For regular backups, you can:

1. **Manual backups**: Run `./scripts/backup.sh` whenever you want
2. **Automated backups**: Set up a cron job or GitHub Actions workflow
3. **Before major changes**: Always backup before running migrations or major updates

## Safety Features

- **Atomic operations**: Restore uses database transactions to ensure consistency
- **Confirmation prompts**: Restore asks for confirmation before deleting data
- **Error handling**: Scripts exit with error codes if something goes wrong
- **Backup validation**: Restore validates backup file format before proceeding

## Troubleshooting

### Common Issues

1. **Database connection errors**: Make sure your `DATABASE_URL` environment variable is set
2. **Permission errors**: Ensure the scripts are executable (`chmod +x scripts/*.sh`)
3. **Missing dependencies**: Run `npm install` to ensure all dependencies are installed

### Backup File Location

Backups are stored in the `backups/` directory in your project root. The directory is created automatically when you run your first backup. 