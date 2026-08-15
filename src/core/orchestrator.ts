import type { OrchestratorTask, TaskResult } from "./types.js";
import { runTask } from "./task-runner.js";
import { mapWithConcurrency } from "./concurrency.js";
import { StateStore } from "./state-store.js";

export async function runTasks(
  tasks: OrchestratorTask[],
  concurrency = 3,
  stateFile?: string,
): Promise<Map<string, TaskResult>> {
  const store = stateFile ? new StateStore(stateFile) : undefined;

  if (store) {
    await store.save(tasks);
  }
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

      if (store) {
        await store.save(tasks);
      }

      return [task.id, result] as const;
    },
  );

  return new Map(entries);
}







