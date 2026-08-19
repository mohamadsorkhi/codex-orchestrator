import type { OrchestratorTask } from "../src/core/types.js";
import { runTasks } from "../src/core/orchestrator.js";

const tasks: OrchestratorTask[] = [
  {
    id: "duplicate-task",
    prompt: "First task",
    status: "pending",
  },
  {
    id: "duplicate-task",
    prompt: "Second task",
    status: "pending",
  },
];

let failed = false;

try {
  await runTasks(tasks);
} catch (error) {
  failed = true;

  if (
    !(error instanceof Error) ||
    error.message !== "Duplicate task id: duplicate-task"
  ) {
    throw error;
  }
}

if (!failed) {
  throw new Error("Expected duplicate task IDs to be rejected.");
}

if (tasks.some((task) => task.status !== "pending")) {
  throw new Error("Duplicate IDs must be rejected before task execution.");
}

console.log("DUPLICATE_TASK_ID_TEST_OK");