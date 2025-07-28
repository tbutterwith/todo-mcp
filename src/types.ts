import { z } from "zod";

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

export const CreateTodoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  priority: z.nativeEnum(TodoPriority),
  status: z.nativeEnum(TodoStatus).optional(),
  due_date: z.date().optional(),
});

export const UpdateTodoSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  priority: z.nativeEnum(TodoPriority).optional(),
  status: z.nativeEnum(TodoStatus).optional(),
  notes: z.string().optional(),
  due_date: z.date().optional(),
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