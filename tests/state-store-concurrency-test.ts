import { rm } from "node:fs/promises";
import { StateStore } from "../src/core/state-store.js";
import type { OrchestratorTask } from "../src/core/types.js";

const filePath = "./state/concurrent-state-test.json";
const store = new StateStore(filePath);

const states: OrchestratorTask[][] = Array.from(
  { length: 10 },
  (_, index) => [
    {
      id: `task-${index + 1}`,
      prompt: `Concurrent save ${index + 1}`,
      status: "completed",
    },
  ],
);

await Promise.all(states.map((tasks) => store.save(tasks)));

const loaded = await store.load();
const expected = states[states.length - 1];

if (JSON.stringify(loaded) !== JSON.stringify(expected)) {
  throw new Error("Concurrent saves did not preserve the final state.");
}

console.log("loaded:", loaded);
console.log("STATE_STORE_CONCURRENCY_OK");

await rm(filePath, { force: true });