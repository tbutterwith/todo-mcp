import { z } from "zod";

import { parseDateString } from "./utils.js";

export enum TodoStatus {
  PENDING = "Pending",
  WAITING_ON_OTHERS = "Waiting on others",
  STAY_AWARE = "Stay aware",
  IN_PROGRESS = "In progress",
  DONE = "Done"
}

export enum TodoPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  URGENT = "Urgent"
}

export const TodoSchema = z.object({
  id: z.number(),
  name: z.string(),
  priority: z.nativeEnum(TodoPriority),
  status: z.nativeEnum(TodoStatus),
  notes: z.string().nullable(),
  due_date: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

export type Todo = z.infer<typeof TodoSchema>;

// Custom date string schema that transforms to Date
const DateStringSchema = z.string().transform((val, ctx) => {
  const parsed = parseDateString(val);
  if (parsed === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid date format: "${val}". Supported formats include: ISO 8601 (2024-01-15), US format (01/15/2024), UK format (15/01/2024), natural language (tomorrow, next week), and relative dates (in 3 days).`
    });
    return z.NEVER;
  }
  return parsed;
});

export const CreateTodoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  priority: z.nativeEnum(TodoPriority),
  status: z.nativeEnum(TodoStatus).optional(),
  due_date: DateStringSchema.optional(),
});

export const UpdateTodoSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  priority: z.nativeEnum(TodoPriority).optional(),
  status: z.nativeEnum(TodoStatus).optional(),
  notes: z.string().optional(),
  due_date: DateStringSchema.optional(),
});

export const GetTodosSchema = z.object({
  status: z.nativeEnum(TodoStatus).optional().or(z.literal("").transform(() => undefined)),
  priority: z.array(z.nativeEnum(TodoPriority)).optional()
});

export const MarkTodoDoneSchema = z.object({
  id: z.number(),
  notes: z.string().min(1, "Notes are required when marking a todo as done")
});

export const AppendTodoNotesSchema = z.object({
  id: z.number(),
  notes: z.string().min(1, "Notes cannot be empty")
});

export const TodoReportSchema = z.object({
  days: z.number().min(1).max(365).default(7).describe("Number of days to look back for updated/completed todos (default: 7)")
});

export const GetTodoNotesSchema = z.object({
  id: z.number()
}); 