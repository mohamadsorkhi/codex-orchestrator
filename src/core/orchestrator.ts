import type { OrchestratorTask, TaskResult } from "./types.js";
import { runTask } from "./task-runner.js";
import { mapWithConcurrency } from "./concurrency.js";

export async function runTasks(
  tasks: OrchestratorTask[],
  concurrency = 3,
): Promise<Map<string, TaskResult>> {
  const entries = await mapWithConcurrency(
    tasks,
    concurrency,
    async (task) => {
      let result: TaskResult;

      try {
        const output = await runTask(task);

        result = {
          taskId: task.id,
          status: "completed",
          output,
        };
      } catch (error) {
        result = {
          taskId: task.id,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        };
      }

      return [task.id, result] as const;
    },
  );

  return new Map(entries);
}
