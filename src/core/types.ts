export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface OrchestratorTask {
  id: string;
  prompt: string;
  status: TaskStatus;
}

export interface TaskResult {
  taskId: string;
  status: "completed" | "failed";
  output?: string;
  error?: string;
}
