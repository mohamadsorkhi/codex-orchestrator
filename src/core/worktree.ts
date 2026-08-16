import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TaskWorktree {
  path: string;
  cleanup(): Promise<void>;
}

export async function createTaskWorktree(): Promise<TaskWorktree> {
  const { stdout } = await execFileAsync(
    "git",
    ["rev-parse", "--show-toplevel"],
    { cwd: process.cwd() },
  );

  const repositoryRoot = stdout.trim();
  const worktreePath = await mkdtemp(
    join(tmpdir(), "codex-orchestrator-"),
  );

  await execFileAsync(
    "git",
    ["worktree", "add", "--detach", worktreePath, "HEAD"],
    { cwd: repositoryRoot },
  );

  return {
    path: worktreePath,

    async cleanup(): Promise<void> {
      try {
        await execFileAsync(
          "git",
          ["worktree", "remove", "--force", worktreePath],
          { cwd: repositoryRoot },
        );
      } finally {
        await rm(worktreePath, { recursive: true, force: true });
      }
    },
  };
}