import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

import { DatabaseService } from "./database.js";
import {
  GetTodosSchema,
  CreateTodoSchema,
  UpdateTodoSchema,
  MarkTodoDoneSchema,
  AppendTodoNotesSchema,
  TodoReportSchema,
  TodoStatus
} from "./types.js";

// Load environment variables
dotenv.config();

const db = new DatabaseService();

const server = new McpServer({
  name: "todo-mcp",
  version: "1.0.0",
});

// Register tools
server.registerTool(
  "get-todos",
  {
    description: "Retrieve a list of to-do items. You can optionally filter the results by status (e.g., Pending, In progress, Done) and/or priority (Low, Medium, High, Urgent). Returns all matching to-dos.",
    inputSchema: GetTodosSchema.shape,
  },
  async (args) => {
    const { status, priority } = args;
    const excludedStatus = status ? undefined : TodoStatus.DONE;
    const todos = await db.getTodos(status, excludedStatus, priority);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            todos.map(({ created_at: _created_at, updated_at: _updated_at, ...rest }) => rest),
            null,
            2
          )
        }
      ]
    };
  }
);

server.registerTool(
  "create-todo",
  {
    description: "Create a new to-do item with name and priority. If status is not provided, it will default to IN_PROGRESS.",
    inputSchema: CreateTodoSchema.shape,
  },
  async (args) => {
    const { name: todoName, priority, status } = args;
    const todo = await db.createTodo({ name: todoName, priority, status });
    
    return {
      content: [
        {
          type: "text",
          text: `Created to-do: ${JSON.stringify(todo, null, 2)}`
        }
      ]
    };
  }
);



server.registerTool(
  "mark-todo-done",
  {
    description: "Mark a to-do as done by its ID and add a mandatory completion note",
    inputSchema: MarkTodoDoneSchema.shape,
  },
  async (args) => {
    const { id, notes } = args;
    const todo = await db.markTodoDone(id, notes);
    
    if (!todo) {
      return {
        content: [
          {
            type: "text",
            text: `To-do with ID ${id} not found`
          }
        ]
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Marked to-do as done with completion note: ${JSON.stringify(todo, null, 2)}`
        }
      ]
    };
  }
);

server.registerTool(
  "update-todo",
  {
    description: "Update a to-do item's properties (name, priority, status, notes). Notes are optional and will be appended to the existing notes.",
    inputSchema: UpdateTodoSchema.shape,
  },
  async (args) => {
    const { id, ...updateData } = args;
    const todo = await db.updateTodo(id, updateData);
    
    if (!todo) {
      return {
        content: [
          {
            type: "text",
            text: `To-do with ID ${id} not found`
          }
        ]
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Updated to-do: ${JSON.stringify(todo, null, 2)}`
        }
      ]
    };
  }
);

server.registerTool(
  "get-todo-statuses",
  {
    description: "Get all available statuses for to-do items",
    inputSchema: {},
  },
  async () => {
    const statuses = Object.values(TodoStatus);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(statuses, null, 2)
        }
      ]
    };
  }
);

server.registerTool(
  "append-todo-notes",
  {
    description: "Add or append notes to a to-do item (append-only, preserves existing notes)",
    inputSchema: AppendTodoNotesSchema.shape,
  },
  async (args) => {
    const { id, notes } = args;
    const todo = await db.appendTodoNotes(id, notes);
    
    if (!todo) {
      return {
        content: [
          {
            type: "text",
            text: `To-do with ID ${id} not found`
          }
        ]
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Appended notes to to-do: ${JSON.stringify(todo, null, 2)}`
        }
      ]
    };
  }
);

server.registerTool(
  "generate-todo-report",
  {
    description: "Generate a report of todos that have been updated or completed in the last N days. The timeframe is configurable via the days parameter.",
    inputSchema: TodoReportSchema.shape,
  },
  async (args) => {
    const { days } = args;
    const todos = await db.getTodosUpdatedInLastDays(days);
    
    const report = {
      timeframe: `${days} days`,
      totalTodos: todos.length,
      completedTodos: todos.filter(todo => todo.status === TodoStatus.DONE).length,
      updatedTodos: todos.filter(todo => todo.status !== TodoStatus.DONE).length,
      todos: todos.map(({ created_at: _created_at, updated_at: _updated_at, ...rest }) => rest)
    };
    
    return {
      content: [
        {
          type: "text",
          text: `Todo Activity Report (Last ${days} days):\n\n${JSON.stringify(report, null, 2)}`
        }
      ]
    };
  }
);

// Initialize database and start server
async function main() {
  try {
    await db.initialize();
    console.error("Database initialized successfully");
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP server started");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down...");
  await db.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Shutting down...");
  await db.close();
  process.exit(0);
});

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});