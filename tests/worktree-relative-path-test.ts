import { access } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { createTaskWorktree } from "../src/core/worktree.js";

const originalDirectory = process.cwd();
const callerDirectory = join(originalDirectory, "src", "core");

let worktree: Awaited<ReturnType<typeof createTaskWorktree>> | undefined;

try {
  await access(callerDirectory);

  process.chdir(callerDirectory);

  worktree = await createTaskWorktree();

  await access(worktree.path);

  const expectedSuffix = normalize(join("src", "core"));
  const workerDirectory = normalize(worktree.path);

  if (!workerDirectory.endsWith(`${sep}${expectedSuffix}`)) {
    throw new Error(
      `Expected worker directory to preserve "${expectedSuffix}", got "${workerDirectory}".`,
    );
  }

  console.log("WORKTREE_RELATIVE_PATH_OK");
} finally {
  process.chdir(originalDirectory);
  await worktree?.cleanup();
}