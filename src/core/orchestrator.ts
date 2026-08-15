import type { OrchestratorTask } from "./types.js";
import { runTask } from "./task-runner.js";
import { mapWithConcurrency } from "./concurrency.js";

export async function runTasks(
  tasks: OrchestratorTask[],
  concurrency = 3,
): Promise<Map<string, string>> {
  const entries = await mapWithConcurrency(
    tasks,
    concurrency,
    async (task) => {
      const result = await runTask(task);
      return [task.id, result] as const;
    },
  );

  return new Map(entries);
}
