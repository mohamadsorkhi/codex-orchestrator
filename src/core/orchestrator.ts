import type { OrchestratorTask } from "./types.js";
import { runTask } from "./task-runner.js";

export async function runTasks(
  tasks: OrchestratorTask[],
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    tasks.map(async (task) => {
      const result = await runTask(task);
      return [task.id, result] as const;
    }),
  );

  return new Map(entries);
}
