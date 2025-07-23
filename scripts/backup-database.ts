#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
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

async function backupDatabase() {
  const prisma = new PrismaClient();
  
  // Check if --markdown flag is provided
  const generateMarkdown = process.argv.includes('--markdown');
  
  try {
    console.log("Starting database backup...");
    
    // Fetch all todos from the database
    const todos = await prisma.todo.findMany({
      orderBy: {
        created_at: 'asc'
      }
    });
    
    console.log(`Found ${todos.length} todos to backup`);
    
    // Create backup data structure
    const backupData: BackupData = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      todos: todos.map(todo => ({
        id: todo.id,
        name: todo.name,
        priority: todo.priority,
        status: todo.status,
        notes: todo.notes,
        created_at: todo.created_at.toISOString(),
        updated_at: todo.updated_at.toISOString()
      }))
    };
    
    // Create backups directory if it doesn't exist
    const backupsDir = join(process.cwd(), "backups");
    mkdirSync(backupsDir, { recursive: true });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
    const filename = `todo-backup-${timestamp}.json`;
    const filepath = join(backupsDir, filename);
    
    // Write backup to file
    writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup completed successfully!`);
    console.log(`📁 Backup saved to: ${filepath}`);
    console.log(`📊 Total todos backed up: ${todos.length}`);
    
    // Generate markdown table if requested
    if (generateMarkdown) {
      console.log("📝 Generating markdown table...");
      const markdownContent = generateMarkdownTable(backupData);
      const markdownFilename = `todo-backup-${timestamp}.md`;
      const markdownFilepath = join(backupsDir, markdownFilename);
      
      writeFileSync(markdownFilepath, markdownContent);
      console.log(`📄 Markdown table saved to: ${markdownFilepath}`);
    }
    
  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backup
backupDatabase(); 