import { rm } from "node:fs/promises";
import { StateStore } from "../src/core/state-store.js";
import type { OrchestratorTask } from "../src/core/types.js";

const filePath = "./state/recovery-after-failure/state.json";
const tempPath = `${filePath}.tmp`;

await rm("./state/recovery-after-failure", {
  recursive: true,
  force: true,
});

const store = new StateStore(filePath);

const firstState: OrchestratorTask[] = [
  {
    id: "first-save",
    prompt: "First save",
    status: "running",
  },
];

const secondState: OrchestratorTask[] = [
  {
    id: "second-save",
    prompt: "Second save",
    status: "completed",
  },
];

// Create a directory where StateStore expects its temporary file.
// This forces the first save to fail.
const { mkdir } = await import("node:fs/promises");
await mkdir(tempPath, { recursive: true });

let failed = false;

try {
  await store.save(firstState);
} catch {
  failed = true;
}

if (!failed) {
  throw new Error("Expected first save to fail.");
}

// Remove the temporary obstruction.
await rm(tempPath, { recursive: true, force: true });

// The same StateStore instance must recover and accept another save.
await store.save(secondState);

const loaded = await store.load();

if (JSON.stringify(loaded) !== JSON.stringify(secondState)) {
  throw new Error("StateStore did not recover after failed save.");
}

console.log("STATE_STORE_RECOVERY_AFTER_FAILURE_OK");

await rm("./state/recovery-after-failure", {
  recursive: true,
  force: true,
});