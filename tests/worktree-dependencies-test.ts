import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createTaskWorktree } from "../src/core/worktree.js";

const execFileAsync = promisify(execFile);
const worktree = await createTaskWorktree();

try {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      "await import('@openai/codex-sdk'); console.log('DEPENDENCY_RESOLUTION_OK');",
    ],
    {
      cwd: worktree.path,
    },
  );

  if (!stdout.includes("DEPENDENCY_RESOLUTION_OK")) {
    throw new Error(
      "Worker could not resolve dependencies from its worktree.",
    );
  }

  console.log("WORKTREE_DEPENDENCIES_OK");
} finally {
  await worktree.cleanup();
}
