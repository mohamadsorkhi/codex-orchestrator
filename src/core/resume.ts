import { StateStore } from "./state-store.js";
import { recoverTasks } from "./recovery.js";
import type { OrchestratorTask } from "./types.js";

export async function loadResumableTasks(
  stateFile: string,
): Promise<OrchestratorTask[]> {
  const store = new StateStore(stateFile);
  const savedTasks = await store.load();
  const recoveredTasks = recoverTasks(savedTasks);

  return recoveredTasks.filter(
    (task) => task.status === "pending",
  );
}
