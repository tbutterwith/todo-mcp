# Example Usage

This document shows how to use the Todo MCP server tools.

## Tool Examples

### 1. Create a Todo

```json
{
  "name": "create-todo",
  "arguments": {
    "name": "Build MCP Server",
    "priority": "High"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created to-do: {\n  \"id\": 1,\n  \"name\": \"Build MCP Server\",\n  \"priority\": \"High\",\n  \"status\": \"Pending\",\n  \"due_date\": null,\n  \"created_at\": \"2024-01-15T10:30:00.000Z\",\n  \"updated_at\": \"2024-01-15T10:30:00.000Z\"\n}"
    }
  ]
}
```

### 1a. Create a Todo with Due Date

```json
{
  "name": "create-todo",
  "arguments": {
    "name": "Submit Project Proposal",
    "priority": "Urgent",
    "due_date": "2024-01-20T17:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created to-do: {\n  \"id\": 2,\n  \"name\": \"Submit Project Proposal\",\n  \"priority\": \"Urgent\",\n  \"status\": \"In progress\",\n  \"due_date\": \"2024-01-20T17:00:00.000Z\",\n  \"created_at\": \"2024-01-15T10:30:00.000Z\",\n  \"updated_at\": \"2024-01-15T10:30:00.000Z\"\n}"
    }
  ]
}
```

### 2. Get All Todos

```json
{
  "name": "get-todos",
  "arguments": {}
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "[\n  {\n    \"id\": 1,\n    \"name\": \"Build MCP Server\",\n    \"priority\": \"High\",\n    \"status\": \"Pending\",\n    \"due_date\": null,\n    \"created_at\": \"2024-01-15T10:30:00.000Z\",\n    \"updated_at\": \"2024-01-15T10:30:00.000Z\"\n  }\n]"
    }
  ]
}
```

### 3. Get Todos by Status

```json
{
  "name": "get-todos",
  "arguments": {
    "status": "Pending"
  }
}
```

### 4. Get Todos by Priority

```json
{
  "name": "get-todos",
  "arguments": {
    "priority": "High"
  }
}
```

### 5. Get Todos by Status and Priority

```json
{
  "name": "get-todos",
  "arguments": {
    "status": "Pending",
    "priority": "High"
  }
}
```

### 6. Update a Todo

```json
{
  "name": "update-todo",
  "arguments": {
    "id": 1,
    "status": "In progress"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Updated to-do: {\n  \"id\": 1,\n  \"name\": \"Build MCP Server\",\n  \"priority\": \"High\",\n  \"status\": \"In progress\",\n  \"due_date\": null,\n  \"created_at\": \"2024-01-15T10:30:00.000Z\",\n  \"updated_at\": \"2024-01-15T10:35:00.000Z\"\n}"
    }
  ]
}
```

### 6a. Update a Todo's Due Date

```json
{
  "name": "update-todo",
  "arguments": {
    "id": 1,
    "due_date": "2024-01-25T17:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Updated to-do: {\n  \"id\": 1,\n  \"name\": \"Build MCP Server\",\n  \"priority\": \"High\",\n  \"status\": \"In progress\",\n  \"due_date\": \"2024-01-25T17:00:00.000Z\",\n  \"created_at\": \"2024-01-15T10:30:00.000Z\",\n  \"updated_at\": \"2024-01-15T10:40:00.000Z\"\n}"
    }
  ]
}
```

### 7. Append Notes to Todo

```json
{
  "name": "append-todo-notes",
  "arguments": {
    "id": 1,
    "notes": "Started implementing the MCP server with PostgreSQL backend. Need to add authentication next."
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Appended notes to to-do: {\n  \"id\": 1,\n  \"name\": \"Build MCP Server\",\n  \"priority\": \"High\",\n  \"status\": \"In progress\",\n  \"notes\": \"Started implementing the MCP server with PostgreSQL backend. Need to add authentication next.\",\n  \"due_date\": null,\n  \"created_at\": \"2024-01-15T10:30:00.000Z\",\n  \"updated_at\": \"2024-01-15T11:00:00.000Z\"\n}"
    }
  ]
}
```

### 8. Mark Todo as Done

```json
{
  "name": "mark-todo-done",
  "arguments": {
    "id": 1
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Marked to-do as done: {\n  \"id\": 1,\n  \"name\": \"Build MCP Server\",\n  \"priority\": \"High\",\n  \"status\": \"Done\",\n  \"due_date\": null,\n  \"created_at\": \"2024-01-15T10:30:00.000Z\",\n  \"updated_at\": \"2024-01-15T11:00:00.000Z\"\n}"
    }
  ]
}
```

## Status Values

- `Pending`: Todo is waiting to be started
- `Waiting on others`: Todo depends on someone else
- `Stay aware`: Todo needs attention but no action required
- `In progress`: Todo is currently being worked on
- `Done`: Todo has been completed

## Priority Values

- `Low`: Low priority task
- `Medium`: Medium priority task
- `High`: High priority task
- `Urgent`: Urgent task that needs immediate attention

### 9. Generate Todo Activity Report

```json
{
  "name": "generate-todo-report",
  "arguments": {
    "days": 7
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Todo Activity Report (Last 7 days):\n\n{\n  \"timeframe\": \"7 days\",\n  \"totalTodos\": 3,\n  \"completedTodos\": 1,\n  \"updatedTodos\": 2,\n  \"todos\": [\n    {\n      \"id\": 1,\n      \"name\": \"Build MCP Server\",\n      \"priority\": \"High\",\n      \"status\": \"Done\",\n      \"notes\": \"Started implementing the MCP server with PostgreSQL backend. Need to add authentication next.\\n\\n[COMPLETED] Successfully completed the MCP server implementation\"\n    },\n    {\n      \"id\": 2,\n      \"name\": \"Add Authentication\",\n      \"priority\": \"Medium\",\n      \"status\": \"In progress\",\n      \"notes\": \"Working on JWT authentication implementation\"\n    },\n    {\n      \"id\": 3,\n      \"name\": \"Write Documentation\",\n      \"priority\": \"Low\",\n      \"status\": \"Pending\",\n      \"notes\": null\n    }\n  ]\n}"
    }
  ]
}
```

**Report with different timeframe:**
```json
{
  "name": "generate-todo-report",
  "arguments": {
    "days": 30
  }
}
``` 