import type { OrchestratorTask, TaskResult } from "./types.js";
import { runTask } from "./task-runner.js";
import { mapWithConcurrency } from "./concurrency.js";
import { StateStore } from "./state-store.js";

export async function runTasks(
  tasks: OrchestratorTask[],
  concurrency = 3,
  stateFile?: string,
): Promise<Map<string, TaskResult>> {
  const taskIds = new Set<string>();

  for (const task of tasks) {
    if (taskIds.has(task.id)) {
      throw new Error(`Duplicate task id: ${task.id}`);
    }

    taskIds.add(task.id);
  }

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
        try {
          await store.save(tasks);
        } catch (error) {
          task.status = "failed";

          result = {
            taskId: task.id,
            status: "failed",
            error: `Checkpoint failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      }

      return [task.id, result] as const;
    },
  );

  return new Map(entries);
}