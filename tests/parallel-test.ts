import type { OrchestratorTask } from "../src/core/types.js";
import { runTasks } from "../src/core/orchestrator.js";

const tasks: OrchestratorTask[] = Array.from({ length: 5 }, (_, index) => ({
  id: `worker-${index + 1}`,
  prompt: `Reply with exactly: WORKER_${index + 1}_OK`,
  status: "pending",
}));

const results = await runTasks(tasks, 2);

for (const [id, result] of results) {
  if (result.status === "completed") {
    console.log(`${id}: ${result.output}`);
  } else {
    console.log(`${id}: FAILED - ${result.error}`);
  }
}

console.log(
  "statuses:",
  tasks.map((task) => `${task.id}=${task.status}`).join(", "),
);
