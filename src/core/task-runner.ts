import { Codex } from "@openai/codex-sdk";
import type { OrchestratorTask } from "./types.js";
import { withRetry } from "./retry.js";
import { createTaskWorktree } from "./worktree.js";

const codex = new Codex();

export async function runTask(task: OrchestratorTask): Promise<string> {
  task.status = "running";

  const worktree = await createTaskWorktree();

  try {
    const result = await withRetry(
      async () => {
        const thread = codex.startThread({
          workingDirectory: worktree.path,
          skipGitRepoCheck: true,
        });

        const turn = await thread.run(task.prompt);
        return turn.finalResponse;
      },
      {
        maxAttempts: 3,
        delayMs: 1000,
      },
    );

    task.status = "completed";
    return result;
  } catch (error) {
    task.status = "failed";
    throw error;
  } finally {
    await worktree.cleanup();
  }
}