import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTasks } from "../src/core/orchestrator.js";
import { StateStore } from "../src/core/state-store.js";
import type { OrchestratorTask } from "../src/core/types.js";

const testDirectory = await mkdtemp(
  join(tmpdir(), "codex-orchestrator-checkpoint-"),
);
const stateFile = join(testDirectory, "state.json");
const originalDirectory = process.cwd();
const originalSave = StateStore.prototype.save;

let saveCallCount = 0;

StateStore.prototype.save = async function (
  tasks: OrchestratorTask[],
): Promise<void> {
  saveCallCount += 1;

  if (saveCallCount === 1) {
    await originalSave.call(this, tasks);
    return;
  }

  throw new Error("CHECKPOINT_WRITE_FAILED");
};

const tasks: OrchestratorTask[] = [
  {
    id: "checkpoint-worker-1",
    prompt: "This task must not reach Codex.",
    status: "pending",
  },
  {
    id: "checkpoint-worker-2",
    prompt: "This task must not reach Codex.",
    status: "pending",
  },
  {
    id: "checkpoint-worker-3",
    prompt: "This task must not reach Codex.",
    status: "pending",
  },
];

try {
  process.chdir(testDirectory);

  const results = await runTasks(tasks, 2, stateFile);

  if (results.size !== tasks.length) {
    throw new Error("Not all workers settled after checkpoint failures.");
  }

  if (tasks.some((task) => task.status !== "failed")) {
    throw new Error("Checkpoint failures did not mark every task as failed.");
  }

  for (const result of results.values()) {
    if (
      result.status !== "failed" ||
      !result.error?.includes("CHECKPOINT_WRITE_FAILED")
    ) {
      throw new Error(
        "Checkpoint failure was not returned as a structured result.",
      );
    }
  }

  console.log("ORCHESTRATOR_CHECKPOINT_FAILURE_TEST_OK");
} finally {
  StateStore.prototype.save = originalSave;
  process.chdir(originalDirectory);

  await rm(testDirectory, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}