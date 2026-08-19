import { execFile } from "node:child_process";
import {
  access,
  cp,
  mkdtemp,
  rm,
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

async function copyDependenciesIfPresent(
  sourcePath: string,
  destinationPath: string,
): Promise<void> {
  try {
    await access(sourcePath);

    await cp(sourcePath, destinationPath, {
      recursive: true,
      force: false,
      errorOnExist: true,
    });
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
  const workerDirectory = join(
    worktreePath,
    callerRelativePath,
  );
  const rootDependenciesPath = join(
    repositoryRoot,
    "node_modules",
  );
  const worktreeRootDependenciesPath = join(
    worktreePath,
    "node_modules",
  );
  const callerDependenciesPath = join(
    callerDirectory,
    "node_modules",
  );
  const workerDependenciesPath = join(
    workerDirectory,
    "node_modules",
  );

  const dependencyCopies = [
    worktreeRootDependenciesPath,
  ];

  if (callerRelativePath) {
    dependencyCopies.push(workerDependenciesPath);
  }

  try {
    await execFileAsync(
      "git",
      ["worktree", "add", "--detach", worktreePath, "HEAD"],
      { cwd: repositoryRoot },
    );

    await copyDependenciesIfPresent(
      rootDependenciesPath,
      worktreeRootDependenciesPath,
    );

    if (callerRelativePath) {
      await copyDependenciesIfPresent(
        callerDependenciesPath,
        workerDependenciesPath,
      );
    }
  } catch (error) {
    await Promise.all(
      dependencyCopies.map((path) =>
        rm(path, {
          recursive: true,
          force: true,
        }),
      ),
    );

    try {
      await execFileAsync(
        "git",
        ["worktree", "remove", "--force", worktreePath],
        { cwd: repositoryRoot },
      );
    } catch {
      // The worktree may not have been registered.
    }

    await rm(worktreePath, {
      recursive: true,
      force: true,
    });

    throw error;
  }

  return {
    path: workerDirectory,

    async cleanup(): Promise<void> {
      await Promise.all(
        dependencyCopies.map((path) =>
          rm(path, {
            recursive: true,
            force: true,
          }),
        ),
      );

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
