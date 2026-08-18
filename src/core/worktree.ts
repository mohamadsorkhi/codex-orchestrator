import { execFile } from "node:child_process";
import {
  access,
  mkdtemp,
  rm,
  symlink,
  unlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TaskWorktree {
  path: string;
  cleanup(): Promise<void>;
}

function hasErrorCode(
  error: unknown,
  code: string,
): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === code
  );
}

async function removeDependencyLink(
  dependencyLinkPath: string,
): Promise<void> {
  try {
    await unlink(dependencyLinkPath);
  } catch (error) {
    if (!hasErrorCode(error, "ENOENT")) {
      throw error;
    }
  }
}

export async function createTaskWorktree(): Promise<TaskWorktree> {
  const callerDirectory = process.cwd();

  const { stdout } = await execFileAsync(
    "git",
    ["rev-parse", "--show-toplevel"],
    { cwd: callerDirectory },
  );

  const repositoryRoot = stdout.trim();
  const callerRelativePath = relative(
    repositoryRoot,
    callerDirectory,
  );

  const worktreePath = await mkdtemp(
    join(tmpdir(), "codex-orchestrator-"),
  );
  const worktreeDependenciesPath = join(
    worktreePath,
    "node_modules",
  );

  try {
    await execFileAsync(
      "git",
      ["worktree", "add", "--detach", worktreePath, "HEAD"],
      { cwd: repositoryRoot },
    );

    const dependenciesPath = join(
      repositoryRoot,
      "node_modules",
    );

    try {
      await access(dependenciesPath);

      await symlink(
        dependenciesPath,
        worktreeDependenciesPath,
        process.platform === "win32" ? "junction" : "dir",
      );
    } catch (error) {
      if (!hasErrorCode(error, "ENOENT")) {
        throw error;
      }
    }
  } catch (error) {
    await removeDependencyLink(worktreeDependenciesPath);

    try {
      await execFileAsync(
        "git",
        ["worktree", "remove", "--force", worktreePath],
        { cwd: repositoryRoot },
      );
    } catch {
      // The worktree may not have been registered.
    }

    await rm(worktreePath, { recursive: true, force: true });
    throw error;
  }

  const workerDirectory = join(
    worktreePath,
    callerRelativePath,
  );

  return {
    path: workerDirectory,

    async cleanup(): Promise<void> {
      await removeDependencyLink(worktreeDependenciesPath);

      try {
        await execFileAsync(
          "git",
          ["worktree", "remove", "--force", worktreePath],
          { cwd: repositoryRoot },
        );
      } finally {
        await rm(worktreePath, {
          recursive: true,
          force: true,
        });
      }
    },
  };
}
