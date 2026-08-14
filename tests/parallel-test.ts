import type { OrchestratorTask } from "../src/core/types.js";
import { runTasks } from "../src/core/orchestrator.js";

const tasks: OrchestratorTask[] = [
  {
    id: "worker-1",
    prompt: "Reply with exactly: WORKER_1_OK",
    status: "pending",
  },
  {
    id: "worker-2",
    prompt: "Reply with exactly: WORKER_2_OK",
    status: "pending",
  },
];

const results = await runTasks(tasks);

for (const [id, result] of results) {
  console.log(`${id}: ${result}`);
}

console.log(
  "statuses:",
  tasks.map((task) => `${task.id}=${task.status}`).join(", "),
);
