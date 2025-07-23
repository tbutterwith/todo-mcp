#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
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

async function restoreDatabase(backupFile?: string) {
  const prisma = new PrismaClient();
  
  try {
    // Determine backup file to use
    let filepath: string;
    
    if (backupFile) {
      // Use provided file path
      filepath = backupFile;
    } else {
      // Find the most recent backup file
      const backupsDir = join(process.cwd(), "backups");
      const fs = await import("fs");
      const path = await import("path");
      
      if (!existsSync(backupsDir)) {
        throw new Error("Backups directory not found. Run backup first.");
      }
      
      const files = fs.readdirSync(backupsDir)
        .filter(file => file.startsWith("todo-backup-") && file.endsWith(".json"))
        .sort()
        .reverse();
      
      if (files.length === 0) {
        throw new Error("No backup files found in backups directory.");
      }
      
      filepath = join(backupsDir, files[0]);
      console.log(`Using most recent backup: ${files[0]}`);
    }
    
    if (!existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filepath}`);
    }
    
    console.log("Starting database restore...");
    console.log(`📁 Reading backup from: ${filepath}`);
    
    // Read and parse backup file
    const backupContent = readFileSync(filepath, "utf-8");
    const backupData: BackupData = JSON.parse(backupContent);
    
    console.log(`📊 Found ${backupData.todos.length} todos to restore`);
    console.log(`📅 Backup created: ${backupData.timestamp}`);
    
    // Confirm before proceeding
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question("⚠️  This will DELETE ALL existing todos and replace them with the backup. Continue? (yes/no): ", resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== "yes") {
      console.log("❌ Restore cancelled.");
      return;
    }
    
    // Start transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all existing todos
      console.log("🗑️  Clearing existing todos...");
      await tx.todo.deleteMany();
      
      // Insert todos from backup
      console.log("📥 Restoring todos...");
      for (const todo of backupData.todos) {
        await tx.todo.create({
          data: {
            id: todo.id,
            name: todo.name,
            priority: todo.priority,
            status: todo.status,
            notes: todo.notes,
            created_at: new Date(todo.created_at),
            updated_at: new Date(todo.updated_at)
          }
        });
      }
    });
    
    console.log("✅ Database restore completed successfully!");
    console.log(`📊 Total todos restored: ${backupData.todos.length}`);
    
  } catch (error) {
    console.error("❌ Restore failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get backup file from command line argument
const backupFile = process.argv[2];

// Run the restore
restoreDatabase(backupFile); 