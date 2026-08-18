import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TaskWorktree {
  path: string;
  cleanup(): Promise<void>;
}

export async function createTaskWorktree(): Promise<TaskWorktree> {
  const callerDirectory = process.cwd();

  const { stdout } = await execFileAsync(
    "git",
    ["rev-parse", "--show-toplevel"],
    { cwd: callerDirectory },
  );

  const repositoryRoot = stdout.trim();
  const callerRelativePath = relative(repositoryRoot, callerDirectory);

  const worktreePath = await mkdtemp(
    join(tmpdir(), "codex-orchestrator-"),
  );

  await execFileAsync(
    "git",
    ["worktree", "add", "--detach", worktreePath, "HEAD"],
    { cwd: repositoryRoot },
  );

  const workerDirectory = join(worktreePath, callerRelativePath);

  return {
    path: workerDirectory,

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