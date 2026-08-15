import type { OrchestratorTask } from "./types.js";

export function recoverTasks(
  tasks: OrchestratorTask[],
): OrchestratorTask[] {
  return tasks.map((task) => {
    if (task.status === "running") {
      return {
        ...task,
        status: "pending",
      };
    }

    return task;
  });
}
