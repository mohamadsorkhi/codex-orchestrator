import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTasks } from "../src/core/orchestrator.js";
import { StateStore } from "../src/core/state-store.js";
import type { OrchestratorTask } from "../src/core/types.js";

const testDirectory = await mkdtemp(
  join(tmpdir(), "codex-orchestrator-invalid-concurrency-"),
);
const stateFile = join(testDirectory, "state.json");
const store = new StateStore(stateFile);

const recoveryTasks: OrchestratorTask[] = [
  {
    id: "recovery-task",
    prompt: "Previously persisted task.",
    status: "pending",
  },
];

const replacementTasks: OrchestratorTask[] = [
  {
    id: "replacement-task",
    prompt: "Must not replace recovery state.",
    status: "pending",
  },
];

try {
  await store.save(recoveryTasks);

  let rejected = false;

  try {
    await runTasks(replacementTasks, 0, stateFile);
  } catch (error) {
    if (
      !(
        error instanceof Error &&
        error.message ===
          "Concurrency limit must be a positive integer."
      )
    ) {
      throw error;
    }

    rejected = true;
  }

  if (!rejected) {
    throw new Error("Invalid concurrency was not rejected.");
  }

  const savedTasks = await store.load();

  if (
    JSON.stringify(savedTasks) !==
    JSON.stringify(recoveryTasks)
  ) {
    throw new Error(
      "Invalid concurrency replaced the existing recovery state.",
    );
  }

  console.log(
    "ORCHESTRATOR_INVALID_CONCURRENCY_STATE_TEST_OK",
  );
} finally {
  await rm(testDirectory, {
    recursive: true,
    force: true,
  });
}
