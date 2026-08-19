import { recoverTasks } from "../src/core/recovery.js";
import type { OrchestratorTask } from "../src/core/types.js";

const tasks: OrchestratorTask[] = [
  {
    id: "task-running",
    prompt: "Running task",
    status: "running",
  },
  {
    id: "task-completed",
    prompt: "Completed task",
    status: "completed",
  },
  {
    id: "task-failed",
    prompt: "Failed task",
    status: "failed",
  },
];

const recovered = recoverTasks(tasks);

if (recovered[0]?.status !== "pending") {
  throw new Error("Running task should recover to pending.");
}

if (recovered[1]?.status !== "completed") {
  throw new Error("Completed task should remain completed.");
}

if (recovered[2]?.status !== "failed") {
  throw new Error("Failed task should remain failed.");
}

console.log("recovered:", recovered);
console.log("RECOVERY_TEST_OK");
