# Todo MCP Server

A Model Context Protocol (MCP) server that manages a to-do list application with Prisma ORM and PostgreSQL backend.

## Features

- **Get Todos**: Retrieve all to-dos with optional filtering by status and priority
- **Create Todo**: Create new to-do items with name and priority
- **Mark Todo Done**: Mark a to-do as completed
- **Update Todo**: Update any property of a to-do item
- **Append Notes**: Add notes to existing to-do items

## Todo Properties

- **Name**: String (required)
- **Priority**: `Low`, `Medium`, `High`, `Urgent`
- **Status**: `Pending`, `Waiting on others`, `Stay aware`, `In progress`, `Done`
- **Notes**: String (optional) - Append-only field for additional details

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (create a `.env` file):
   ```bash
   # Database Configuration for Prisma
   # For macOS with Homebrew PostgreSQL (replace 'your_username' with your actual username):
   DATABASE_URL="postgresql://your_username@localhost:5432/todo_mcp"
   
   # For other PostgreSQL installations:
   # DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_mcp"
   ```

3. Create the PostgreSQL database:
   ```sql
   CREATE DATABASE todo_mcp;
   ```

4. Set up the database schema with Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Build the project (this will also run migrations and generate Prisma client):
   ```bash
   npm run build
   ```

## Usage

### Running the Server

```bash
npm run build
node build/index.js
```

### Available Tools

#### get-todos
Retrieve all to-dos with optional filtering.

**Parameters:**
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority

**Example:**
```json
{
  "status": "pending",
  "priority": "high"
}
```

#### create-todo
Create a new to-do item.

**Parameters:**
- `name` (required): Todo name
- `priority` (required): Priority level

**Example:**
```json
{
  "name": "Complete project",
  "priority": "high"
}
```

#### mark-todo-done
Mark a to-do as completed.

**Parameters:**
- `id` (required): Todo ID

**Example:**
```json
{
  "id": 1
}
```

#### update-todo
Update a to-do item's properties.

**Parameters:**
- `id` (required): Todo ID
- `name` (optional): New name
- `priority` (optional): New priority
- `status` (optional): New status

**Example:**
```json
{
  "id": 1,
  "status": "in progress",
  "priority": "urgent"
}
```

#### append-todo-notes
Add notes to an existing to-do item (append-only).

**Parameters:**
- `id` (required): Todo ID
- `notes` (required): Notes to append

**Example:**
```json
{
  "id": 1,
  "notes": "Started working on this task. Need to add authentication next."
}
```

## Development

The server is built with TypeScript and uses:
- **@modelcontextprotocol/sdk**: MCP server implementation
- **@prisma/client**: Prisma ORM for database operations
- **zod**: Schema validation
- **dotenv**: Environment variable management

### Available Scripts

- `npm run build` - Build the project (includes linting, migrations, and TypeScript compilation)
- `npm run lint` - Run ESLint on TypeScript files
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run db:migrate` - Deploy pending migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio for database management
- `npm run db:reset` - Reset database and apply all migrations

## Database Schema

The database schema is managed by Prisma. The schema is defined in `prisma/schema.prisma`:

```prisma
model Todo {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(255)
  priority    Priority
  status      Status   @default(PENDING)
  notes       String?  @db.Text
  created_at  DateTime @default(now())
  updated_at  DateTime @default(now()) @updatedAt

  @@map("todos")
}
```

enum Priority {
  Low
  Medium
  High
  Urgent
}

enum Status {
  PENDING
  WAITING_ON_OTHERS
  STAY_AWARE
  IN_PROGRESS
  DONE
}
```

To apply schema changes:
```bash
npm run build
```

This will automatically run migrations and generate the Prisma client. For development, you can also use:
```bash
npm run db:migrate  # Deploy migrations
npm run db:generate # Generate Prisma client
``` 