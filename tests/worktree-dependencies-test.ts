import { execFile } from "node:child_process";
import {
  access,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { createTaskWorktree } from "../src/core/worktree.js";

const execFileAsync = promisify(execFile);

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

const firstWorktree = await createTaskWorktree();
const secondWorktree = await createTaskWorktree();

try {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      "await import('@openai/codex-sdk'); console.log('DEPENDENCY_RESOLUTION_OK');",
    ],
    {
      cwd: firstWorktree.path,
    },
  );

  if (!stdout.includes("DEPENDENCY_RESOLUTION_OK")) {
    throw new Error(
      "Worker could not resolve dependencies from its worktree.",
    );
  }

  const markerName = ".worktree-isolation-marker";
  const originalMarker = join(
    process.cwd(),
    "node_modules",
    markerName,
  );
  const firstMarker = join(
    firstWorktree.path,
    "node_modules",
    markerName,
  );
  const secondMarker = join(
    secondWorktree.path,
    "node_modules",
    markerName,
  );

  await writeFile(firstMarker, "isolated", "utf8");

  if (await pathExists(originalMarker)) {
    throw new Error(
      "Worker modified the caller's installed dependencies.",
    );
  }

  if (await pathExists(secondMarker)) {
    throw new Error(
      "Workers share writable installed dependencies.",
    );
  }

  console.log("WORKTREE_DEPENDENCIES_OK");
} finally {
  await Promise.allSettled([
    firstWorktree.cleanup(),
    secondWorktree.cleanup(),
  ]);
}
