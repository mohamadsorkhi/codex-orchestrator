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
