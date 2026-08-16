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
  throw new Error("Worktree directory still exists after cleanup.");
} catch {
  console.log("WORKTREE_CLEANUP_OK");
}