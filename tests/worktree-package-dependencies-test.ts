import { execFile } from "node:child_process";
import {
  access,
  mkdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { createTaskWorktree } from "../src/core/worktree.js";

const execFileAsync = promisify(execFile);
const originalDirectory = process.cwd();
const packageRootDirectory = join(
  originalDirectory,
  "src",
);
const callerDirectory = join(
  packageRootDirectory,
  "core",
);
const packageDirectory = join(
  packageRootDirectory,
  "node_modules",
  "worktree-local-dependency",
);
const sourceMarker = join(
  packageDirectory,
  ".worker-marker",
);

let worktree:
  | Awaited<ReturnType<typeof createTaskWorktree>>
  | undefined;

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

try {
  await mkdir(packageDirectory, {
    recursive: true,
  });

  await writeFile(
    join(packageDirectory, "package.json"),
    JSON.stringify({
      name: "worktree-local-dependency",
      version: "1.0.0",
      type: "module",
      exports: "./index.js",
    }),
    "utf8",
  );

  await writeFile(
    join(packageDirectory, "index.js"),
    "export const value = 'PACKAGE_LOCAL_DEPENDENCY_OK';\n",
    "utf8",
  );

  process.chdir(callerDirectory);
  worktree = await createTaskWorktree();

  const { stdout } = await execFileAsync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      "const module = await import('worktree-local-dependency'); console.log(module.value);",
    ],
    {
      cwd: worktree.path,
    },
  );

  if (!stdout.includes("PACKAGE_LOCAL_DEPENDENCY_OK")) {
    throw new Error(
      "Worker could not resolve dependencies from an intermediate package root.",
    );
  }

  const workerMarker = join(
    worktree.path,
    "..",
    "node_modules",
    "worktree-local-dependency",
    ".worker-marker",
  );

  await writeFile(workerMarker, "isolated", "utf8");

  if (await pathExists(sourceMarker)) {
    throw new Error(
      "Worker modified intermediate package dependencies.",
    );
  }

  console.log("WORKTREE_PACKAGE_DEPENDENCIES_OK");
} finally {
  process.chdir(originalDirectory);
  await worktree?.cleanup();

  await rm(packageDirectory, {
    recursive: true,
    force: true,
  });
}
