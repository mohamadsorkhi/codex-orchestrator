import { rm } from "node:fs/promises";
import { StateStore } from "../src/core/state-store.js";
import type { OrchestratorTask } from "../src/core/types.js";

const filePath = "./state/test-state.json";
const store = new StateStore(filePath);

const tasks: OrchestratorTask[] = [
  {
    id: "task-1",
    prompt: "Test task 1",
    status: "completed",
  },
  {
    id: "task-2",
    prompt: "Test task 2",
    status: "failed",
  },
];

await store.save(tasks);

const loaded = await store.load();

if (JSON.stringify(loaded) !== JSON.stringify(tasks)) {
  throw new Error("Loaded state does not match saved state.");
}

console.log("loaded:", loaded);
console.log("STATE_STORE_TEST_OK");

await rm(filePath, { force: true });
