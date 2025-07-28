import { PrismaClient, Priority, Status } from "@prisma/client";

import { Todo, TodoStatus, TodoPriority } from "./types.js";

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async initialize(): Promise<void> {
    // Prisma automatically handles connection management
    // No explicit initialization needed
  }

  async getTodos(status?: TodoStatus, exludedStatus?: TodoStatus, priority?: TodoPriority | TodoPriority[]): Promise<Todo[]> {
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = this.mapTodoStatusToPrismaStatus(status);
    } else if (exludedStatus) {
      where.status = { not: this.mapTodoStatusToPrismaStatus(exludedStatus) };
    }

    if (priority) {
      if (Array.isArray(priority)) {
        where.priority = { in: priority.map(p => this.mapTodoPriorityToPrismaPriority(p)) };
      } else {
        where.priority = this.mapTodoPriorityToPrismaPriority(priority);
      }
    }

    const todos = await this.prisma.todo.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      }
    });

    const mappedTodos = todos.map(todo => ({
      id: todo.id,
      name: todo.name,
      priority: this.mapPrismaPriorityToTodoPriority(todo.priority),
      status: this.mapPrismaStatusToTodoStatus(todo.status),
      notes: todo.notes,
      due_date: todo.due_date,
      created_at: todo.created_at,
      updated_at: todo.updated_at
    }));

    // Sort by priority first, then by status, then by due date (earliest first)
    return mappedTodos.sort((a, b) => {
      // Priority sorting: Urgent first, then High, Medium, Low
      const priorityOrder = {
        [TodoPriority.URGENT]: 0,
        [TodoPriority.HIGH]: 1,
        [TodoPriority.MEDIUM]: 2,
        [TodoPriority.LOW]: 3
      };
      
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // Status sorting: In progress first, then Waiting on others, then Stay aware, then Pending
      const statusOrder = {
        [TodoStatus.IN_PROGRESS]: 0,
        [TodoStatus.WAITING_ON_OTHERS]: 1,
        [TodoStatus.STAY_AWARE]: 2,
        [TodoStatus.PENDING]: 3,
        [TodoStatus.DONE]: 4
      };
      
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }
      
      // Due date sorting: earliest due dates first, null due dates last
      if (a.due_date && b.due_date) {
        return a.due_date.getTime() - b.due_date.getTime();
      } else if (a.due_date && !b.due_date) {
        return -1; // a has due date, b doesn't - a comes first
      } else if (!a.due_date && b.due_date) {
        return 1; // b has due date, a doesn't - b comes first
      }
      
      // Both have no due date - maintain current order
      return 0;
    });
  }

  async createTodo(data: { name: string; priority: TodoPriority; status?: TodoStatus; due_date?: Date }): Promise<Todo> {
    // If status is undefined, set it to IN_PROGRESS
    const status = data.status ?? TodoStatus.IN_PROGRESS;

    const todo = await this.prisma.todo.create({
      data: {
        name: data.name,
        priority: this.mapTodoPriorityToPrismaPriority(data.priority),
        status: this.mapTodoStatusToPrismaStatus(status),
        due_date: data.due_date
      }
    });

    return {
      id: todo.id,
      name: todo.name,
      priority: this.mapPrismaPriorityToTodoPriority(todo.priority),
      status: this.mapPrismaStatusToTodoStatus(todo.status),
      notes: todo.notes,
      due_date: todo.due_date,
      created_at: todo.created_at,
      updated_at: todo.updated_at
    };
  }

  async updateTodo(id: number, data: Partial<{ name: string; priority: TodoPriority; status: TodoStatus; notes: string; due_date: Date }>): Promise<Todo | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.priority !== undefined) {
      updateData.priority = this.mapTodoPriorityToPrismaPriority(data.priority);
    }

    if (data.status !== undefined) {
      updateData.status = this.mapTodoStatusToPrismaStatus(data.status);
    }

    if (data.due_date !== undefined) {
      updateData.due_date = data.due_date;
    }

    // Handle notes appending
    if (data.notes !== undefined) {
      try {
        // First get the current todo to see if it exists and get current notes
        const currentTodo = await this.prisma.todo.findUnique({
          where: { id }
        });

        if (!currentTodo) {
          return null;
        }

        // Append new notes to existing notes (or start with new notes if none exist)
        const updatedNotes = currentTodo.notes 
          ? `${currentTodo.notes}\n\n${data.notes}`
          : data.notes;

        updateData.notes = updatedNotes;
      } catch {
        // Record not found
        return null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return null;
    }

    try {
      const todo = await this.prisma.todo.update({
        where: { id },
        data: updateData
      });

      return {
        id: todo.id,
        name: todo.name,
        priority: this.mapPrismaPriorityToTodoPriority(todo.priority),
        status: this.mapPrismaStatusToTodoStatus(todo.status),
        notes: todo.notes,
        due_date: todo.due_date,
        created_at: todo.created_at,
        updated_at: todo.updated_at
      };
    } catch {
      // Record not found
      return null;
    }
  }

  async appendTodoNotes(id: number, newNotes: string): Promise<Todo | null> {
    try {
      // First get the current todo to see if it exists and get current notes
      const currentTodo = await this.prisma.todo.findUnique({
        where: { id }
      });

      if (!currentTodo) {
        return null;
      }

      // Append new notes to existing notes (or start with new notes if none exist)
      const updatedNotes = currentTodo.notes 
        ? `${currentTodo.notes}\n\n${newNotes}`
        : newNotes;

      const todo = await this.prisma.todo.update({
        where: { id },
        data: { notes: updatedNotes }
      });

      return {
        id: todo.id,
        name: todo.name,
        priority: this.mapPrismaPriorityToTodoPriority(todo.priority),
        status: this.mapPrismaStatusToTodoStatus(todo.status),
        notes: todo.notes,
        due_date: todo.due_date,
        created_at: todo.created_at,
        updated_at: todo.updated_at
      };
    } catch {
      // Record not found or other error
      return null;
    }
  }

  async markTodoDone(id: number, notes: string): Promise<Todo | null> {
    try {
      // First get the current todo to see if it exists and get current notes
      const currentTodo = await this.prisma.todo.findUnique({
        where: { id }
      });

      if (!currentTodo) {
        return null;
      }

      // Append completion notes to existing notes (or start with completion notes if none exist)
      const completionNote = `[COMPLETED] ${notes}`;
      const updatedNotes = currentTodo.notes 
        ? `${currentTodo.notes}\n\n${completionNote}`
        : completionNote;

      const todo = await this.prisma.todo.update({
        where: { id },
        data: { 
          status: this.mapTodoStatusToPrismaStatus(TodoStatus.DONE),
          notes: updatedNotes
        }
      });

      return {
        id: todo.id,
        name: todo.name,
        priority: this.mapPrismaPriorityToTodoPriority(todo.priority),
        status: this.mapPrismaStatusToTodoStatus(todo.status),
        notes: todo.notes,
        due_date: todo.due_date,
        created_at: todo.created_at,
        updated_at: todo.updated_at
      };
    } catch {
      // Record not found or other error
      return null;
    }
  }

  async getTodosUpdatedInLastDays(days: number): Promise<Todo[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const todos = await this.prisma.todo.findMany({
      where: {
        OR: [
          {
            updated_at: {
              gte: cutoffDate
            }
          },
          {
            AND: [
              {
                status: this.mapTodoStatusToPrismaStatus(TodoStatus.DONE)
              },
              {
                updated_at: {
                  gte: cutoffDate
                }
              }
            ]
          }
        ]
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    return todos.map(todo => ({
      id: todo.id,
      name: todo.name,
      priority: this.mapPrismaPriorityToTodoPriority(todo.priority),
      status: this.mapPrismaStatusToTodoStatus(todo.status),
      notes: todo.notes,
      due_date: todo.due_date,
      created_at: todo.created_at,
      updated_at: todo.updated_at
    })).sort((a, b) => {
      // Priority sorting: Urgent first, then High, Medium, Low
      const priorityOrder = {
        [TodoPriority.URGENT]: 0,
        [TodoPriority.HIGH]: 1,
        [TodoPriority.MEDIUM]: 2,
        [TodoPriority.LOW]: 3
      };
      
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // Status sorting: In progress first, then Waiting on others, then Stay aware, then Pending
      const statusOrder = {
        [TodoStatus.IN_PROGRESS]: 0,
        [TodoStatus.WAITING_ON_OTHERS]: 1,
        [TodoStatus.STAY_AWARE]: 2,
        [TodoStatus.PENDING]: 3,
        [TodoStatus.DONE]: 4
      };
      
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }
      
      // Due date sorting: earliest due dates first, null due dates last
      if (a.due_date && b.due_date) {
        return a.due_date.getTime() - b.due_date.getTime();
      } else if (a.due_date && !b.due_date) {
        return -1; // a has due date, b doesn't - a comes first
      } else if (!a.due_date && b.due_date) {
        return 1; // b has due date, a doesn't - b comes first
      }
      
      // Both have no due date - maintain current order
      return 0;
    });
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // Helper methods to map between our enum types and Prisma enum types
  private mapTodoStatusToPrismaStatus(status: TodoStatus): Status {
    switch (status) {
      case TodoStatus.PENDING:
        return Status.PENDING;
      case TodoStatus.WAITING_ON_OTHERS:
        return Status.WAITING_ON_OTHERS;
      case TodoStatus.STAY_AWARE:
        return Status.STAY_AWARE;
      case TodoStatus.IN_PROGRESS:
        return Status.IN_PROGRESS;
      case TodoStatus.DONE:
        return Status.DONE;
      default:
        throw new Error(`Unknown status: ${status}`);
    }
  }

  private mapPrismaStatusToTodoStatus(status: Status): TodoStatus {
    switch (status) {
      case Status.PENDING:
        return TodoStatus.PENDING;
      case Status.WAITING_ON_OTHERS:
        return TodoStatus.WAITING_ON_OTHERS;
      case Status.STAY_AWARE:
        return TodoStatus.STAY_AWARE;
      case Status.IN_PROGRESS:
        return TodoStatus.IN_PROGRESS;
      case Status.DONE:
        return TodoStatus.DONE;
      default:
        throw new Error(`Unknown status: ${status}`);
    }
  }

  private mapTodoPriorityToPrismaPriority(priority: TodoPriority): Priority {
    switch (priority) {
      case TodoPriority.LOW:
        return Priority.Low;
      case TodoPriority.MEDIUM:
        return Priority.Medium;
      case TodoPriority.HIGH:
        return Priority.High;
      case TodoPriority.URGENT:
        return Priority.Urgent;
      default:
        throw new Error(`Unknown priority: ${priority}`);
    }
  }

  private mapPrismaPriorityToTodoPriority(priority: Priority): TodoPriority {
    switch (priority) {
      case Priority.Low:
        return TodoPriority.LOW;
      case Priority.Medium:
        return TodoPriority.MEDIUM;
      case Priority.High:
        return TodoPriority.HIGH;
      case Priority.Urgent:
        return TodoPriority.URGENT;
      default:
        throw new Error(`Unknown priority: ${priority}`);
    }
  }
} 