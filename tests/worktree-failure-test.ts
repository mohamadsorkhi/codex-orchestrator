import { OrchestratorTask } from "../src/core/types.js";
import { runTask } from "../src/core/task-runner.js";

const task: OrchestratorTask = {
  id: "worktree-failure",
  prompt: "This task must not run.",
  status: "pending",
};

const originalPath = process.env.PATH;

try {
  process.env.PATH = "";

  try {
    await runTask(task);
    throw new Error("Expected worktree creation to fail.");
  } catch {
    if (task.status !== "failed") {
      throw new Error(
        `Expected task status to be failed, got: ${task.status}`,
      );
    }
  }

  console.log("WORKTREE_FAILURE_STATUS_OK");
} finally {
  process.env.PATH = originalPath;
}