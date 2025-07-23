#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

interface BackupData {
  version: string;
  timestamp: string;
  todos: Array<{
    id: number;
    name: string;
    priority: "Low" | "Medium" | "High" | "Urgent";
    status: "PENDING" | "WAITING_ON_OTHERS" | "STAY_AWARE" | "IN_PROGRESS" | "DONE";
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getPriorityEmoji(priority: string): string {
  switch (priority) {
    case "Urgent": return "🔴";
    case "High": return "🟠";
    case "Medium": return "🟡";
    case "Low": return "🟢";
    default: return "⚪";
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case "DONE": return "✅";
    case "IN_PROGRESS": return "🔄";
    case "WAITING_ON_OTHERS": return "⏳";
    case "STAY_AWARE": return "👀";
    case "PENDING": return "📋";
    default: return "❓";
  }
}

function truncateText(text: string | null, maxLength: number = 50): string {
  if (!text) return "-";
  // Replace newlines with <br> tags to preserve line breaks in markdown
  return text.replace(/\n/g, '<br>');
}

function generateMarkdownTable(backupData: BackupData): string {
  const { version, timestamp, todos } = backupData;
  
  let markdown = `# Todo Backup Report\n\n`;
  markdown += `**Backup Version:** ${version}\n`;
  markdown += `**Generated:** ${formatDate(timestamp)}\n`;
  markdown += `**Total Todos:** ${todos.length}\n\n`;
  
  // Table header
  markdown += `| ID | Name | Priority | Status | Notes | Created | Updated |\n`;
  markdown += `|----|------|----------|--------|-------|---------|---------|\n`;
  
  // Table rows
  todos.forEach(todo => {
    const priorityWithEmoji = `${getPriorityEmoji(todo.priority)} ${todo.priority}`;
    const statusWithEmoji = `${getStatusEmoji(todo.status)} ${todo.status.replace(/_/g, ' ')}`;
    const truncatedNotes = truncateText(todo.notes);
    const createdDate = formatDate(todo.created_at);
    const updatedDate = formatDate(todo.updated_at);
    
    markdown += `| ${todo.id} | ${todo.name} | ${priorityWithEmoji} | ${statusWithEmoji} | ${truncatedNotes} | ${createdDate} | ${updatedDate} |\n`;
  });
  
  // Summary statistics
  markdown += `\n## Summary\n\n`;
  
  const priorityCounts = todos.reduce((acc, todo) => {
    acc[todo.priority] = (acc[todo.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusCounts = todos.reduce((acc, todo) => {
    acc[todo.status] = (acc[todo.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  markdown += `### Priority Distribution\n`;
  Object.entries(priorityCounts).forEach(([priority, count]) => {
    markdown += `- ${getPriorityEmoji(priority)} ${priority}: ${count}\n`;
  });
  
  markdown += `\n### Status Distribution\n`;
  Object.entries(statusCounts).forEach(([status, count]) => {
    markdown += `- ${getStatusEmoji(status)} ${status.replace(/_/g, ' ')}: ${count}\n`;
  });
  
  return markdown;
}

function findLatestBackupFile(): string | null {
  const backupsDir = join(process.cwd(), "backups");
  
  if (!existsSync(backupsDir)) {
    console.error("❌ Backups directory not found!");
    return null;
  }
  
  // For now, we'll use the most recent backup file
  // In a more sophisticated version, we could scan for the latest file
  const fs = require('fs');
  const files = fs.readdirSync(backupsDir)
    .filter((file: string) => file.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.error("❌ No backup files found!");
    return null;
  }
  
  return join(backupsDir, files[0]);
}

async function convertBackupToMarkdown() {
  try {
    console.log("🔄 Converting backup to markdown table...");
    
    // Find the latest backup file
    const backupFilePath = findLatestBackupFile();
    if (!backupFilePath) {
      process.exit(1);
    }
    
    console.log(`📁 Reading backup file: ${backupFilePath}`);
    
    // Read and parse the backup file
    const backupContent = readFileSync(backupFilePath, 'utf-8');
    const backupData: BackupData = JSON.parse(backupContent);
    
    console.log(`📊 Found ${backupData.todos.length} todos in backup`);
    
    // Generate markdown table
    const markdownContent = generateMarkdownTable(backupData);
    
    // Create markdown file
    const backupsDir = join(process.cwd(), "backups");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
    const markdownFilename = `todo-backup-${timestamp}.md`;
    const markdownFilepath = join(backupsDir, markdownFilename);
    
    // Write markdown file
    writeFileSync(markdownFilepath, markdownContent);
    
    console.log(`✅ Markdown table generated successfully!`);
    console.log(`📁 Markdown saved to: ${markdownFilepath}`);
    console.log(`📊 Total todos in table: ${backupData.todos.length}`);
    
  } catch (error) {
    console.error("❌ Conversion failed:", error);
    process.exit(1);
  }
}

// Run the conversion
convertBackupToMarkdown(); 