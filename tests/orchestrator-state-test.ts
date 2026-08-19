import { rm } from "node:fs/promises";
import { runTasks } from "../src/core/orchestrator.js";
import { StateStore } from "../src/core/state-store.js";
import type { OrchestratorTask } from "../src/core/types.js";

const stateFile = "./state/orchestrator-test.json";

const tasks: OrchestratorTask[] = [
  {
    id: "state-worker-1",
    prompt: "Reply with exactly: STATE_WORKER_1_OK",
    status: "pending",
  },
  {
    id: "state-worker-2",
    prompt: "Reply with exactly: STATE_WORKER_2_OK",
    status: "pending",
  },
];

const results = await runTasks(tasks, 2, stateFile);

const store = new StateStore(stateFile);
const savedTasks = await store.load();

if (results.size !== 2) {
  throw new Error("Expected 2 task results.");
}

if (savedTasks.length !== 2) {
  throw new Error("Expected 2 persisted tasks.");
}

if (savedTasks.some((task) => task.status !== "completed")) {
  throw new Error("Persisted task state is incorrect.");
}

console.log("saved-state:", savedTasks);
console.log("ORCHESTRATOR_STATE_TEST_OK");

await rm(stateFile, { force: true });
