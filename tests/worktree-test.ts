import { access } from "node:fs/promises";
import { createTaskWorktree } from "../src/core/worktree.js";

const worktree = await createTaskWorktree();

try {
  await access(worktree.path);

  console.log("worktree:", worktree.path);
  console.log("WORKTREE_CREATE_OK");
} finally {
  await worktree.cleanup();
}

try {
  await access(worktree.path);
} catch (error) {
  if (
    error instanceof Error &&
    "code" in error &&
    error.code === "ENOENT"
  ) {
    console.log("WORKTREE_CLEANUP_OK");
    process.exit(0);
  }

  throw error;
}

throw new Error("Worktree directory still exists after cleanup.");