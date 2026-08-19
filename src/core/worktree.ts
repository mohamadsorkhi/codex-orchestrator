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

  const ancestorRelativePaths = [""];
  let currentRelativePath = "";

  for (
    const segment of callerRelativePath
      .split(/[\\/]+/)
      .filter(Boolean)
  ) {
    currentRelativePath = join(
      currentRelativePath,
      segment,
    );
    ancestorRelativePaths.push(currentRelativePath);
  }

  const dependencyCopies = ancestorRelativePaths.map(
    (ancestorRelativePath) => ({
      source: join(
        repositoryRoot,
        ancestorRelativePath,
        "node_modules",
      ),
      destination: join(
        worktreePath,
        ancestorRelativePath,
        "node_modules",
      ),
    }),
  );

  try {
    await execFileAsync(
      "git",
      ["worktree", "add", "--detach", worktreePath, "HEAD"],
      { cwd: repositoryRoot },
    );

    for (const dependencyCopy of dependencyCopies) {
      await copyDependenciesIfPresent(
        dependencyCopy.source,
        dependencyCopy.destination,
      );
    }
  } catch (error) {
    await Promise.all(
      dependencyCopies.map((dependencyCopy) =>
        rm(dependencyCopy.destination, {
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
        dependencyCopies.map((dependencyCopy) =>
          rm(dependencyCopy.destination, {
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
