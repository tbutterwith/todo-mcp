#!/bin/bash

# CSV to PostgreSQL Upload Script for Todo MCP
# Usage: ./upload_csv.sh <csv_file_path>

set -e  # Exit on any error

# Check if CSV file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <csv_file_path>"
    echo "Example: $0 todos.csv"
    exit 1
fi

CSV_FILE="$1"

# Check if file exists
if [ ! -f "$CSV_FILE" ]; then
    echo "Error: File '$CSV_FILE' not found"
    exit 1
fi

# Check if file is readable
if [ ! -r "$CSV_FILE" ]; then
    echo "Error: File '$CSV_FILE' is not readable"
    exit 1
fi

echo "Processing CSV file: $CSV_FILE"

# Create a temporary Node.js script to process the CSV in the project directory
TEMP_SCRIPT="$(dirname "$0")/temp_upload_script.js"

cat > "$TEMP_SCRIPT" << 'EOF'
import { PrismaClient, Priority, Status } from '@prisma/client';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// Priority mapping from CSV to enum
const priorityMap = {
  'Low': Priority.Low,
  'Medium': Priority.Medium,
  'High': Priority.High,
  'Urgent': Priority.Urgent,
  'low': Priority.Low,
  'medium': Priority.Medium,
  'high': Priority.High,
  'urgent': Priority.Urgent,
  'LOW': Priority.Low,
  'MEDIUM': Priority.Medium,
  'HIGH': Priority.High,
  'URGENT': Priority.Urgent,
  '🔥 ON FIRE 🔥': Priority.Urgent,
  '🔥 ON FIRE🔥': Priority.Urgent,
  'ON FIRE': Priority.Urgent,
  'on fire': Priority.Urgent
};

// Status mapping from CSV to enum
const statusMap = {
  'PENDING': Status.PENDING,
  'WAITING_ON_OTHERS': Status.WAITING_ON_OTHERS,
  'STAY_AWARE': Status.STAY_AWARE,
  'IN_PROGRESS': Status.IN_PROGRESS,
  'DONE': Status.DONE,
  'pending': Status.PENDING,
  'waiting_on_others': Status.WAITING_ON_OTHERS,
  'stay_aware': Status.STAY_AWARE,
  'in_progress': Status.IN_PROGRESS,
  'done': Status.DONE,
  'Pending': Status.PENDING,
  'Waiting on others': Status.WAITING_ON_OTHERS,
  'Stay aware': Status.STAY_AWARE,
  'In progress': Status.IN_PROGRESS,
  'Done': Status.DONE,
  'Waiting on Others': Status.WAITING_ON_OTHERS,
  'Stay Aware': Status.STAY_AWARE,
  'In Progress': Status.IN_PROGRESS
};

async function uploadCSV() {
  try {
    await prisma.todo.deleteMany();
    const csvContent = readFileSync(process.argv[2], 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${records.length} records to process`);

    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {

        

        
        // Extract and validate required fields
        let name = null;
        
        // Try to find the name field by looking for a key that contains "Name"
        for (const [key, value] of Object.entries(record)) {
          if (key.includes('Name') && value && value.trim()) {
            name = value.trim();
            break;
          }
        }
        
        if (!name) {
          console.warn(`Skipping record: Missing or empty Name field. Available fields:`, Object.keys(record));
          errorCount++;
          continue;
        }

        // Map priority
        let priority = Priority.Medium; // default
        let priorityValue = null;
        for (const [key, value] of Object.entries(record)) {
          if (key.includes('Priority') && value && value.trim()) {
            priorityValue = value.trim();
            break;
          }
        }
        if (priorityValue) {
          const mappedPriority = priorityMap[priorityValue];
          if (mappedPriority) {
            priority = mappedPriority;
          } else {
            console.warn(`Unknown priority '${priorityValue}' for '${name}', using default Medium`);
          }
        }

        // Map status
        let status = Status.PENDING; // default
        let statusValue = null;
        for (const [key, value] of Object.entries(record)) {
          if (key.includes('Status') && value && value.trim()) {
            statusValue = value.trim();
            break;
          }
        }
        if (statusValue) {
          const mappedStatus = statusMap[statusValue];
          if (mappedStatus) {
            status = mappedStatus;
          } else {
            console.warn(`Unknown status '${statusValue}' for '${name}', using default PENDING`);
          }
        }

        // Map notes (Follow Up field)
        let notes = null;
        for (const [key, value] of Object.entries(record)) {
          if (key.includes('Follow Up') && value && value.trim()) {
            notes = value.trim();
            break;
          }
        }

        // Create the todo record
        await prisma.todo.create({
          data: {
            name,
            priority,
            status,
            notes
          }
        });

        successCount++;
        console.log(`✓ Created: ${name}`);
      } catch (error) {
        console.error(`✗ Error processing record: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\nUpload completed!`);
    console.log(`Successfully uploaded: ${successCount} records`);
    console.log(`Errors: ${errorCount} records`);

  } catch (error) {
    console.error('Error reading or processing CSV:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

uploadCSV().catch(console.error);
EOF

# Check if csv-parse is installed, install if not
if ! npm list csv-parse > /dev/null 2>&1; then
    echo "Installing csv-parse dependency..."
    npm install csv-parse
fi

# Run the Node.js script
echo "Uploading data to database..."
node "$TEMP_SCRIPT" "$(realpath "$CSV_FILE")"

# Clean up
rm "$TEMP_SCRIPT"

echo "Upload script completed!" 