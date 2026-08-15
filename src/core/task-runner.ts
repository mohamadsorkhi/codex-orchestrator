import { Codex } from "@openai/codex-sdk";
import type { OrchestratorTask } from "./types.js";
import { withRetry } from "./retry.js";

const codex = new Codex();

export async function runTask(task: OrchestratorTask): Promise<string> {
  task.status = "running";

  try {
    const result = await withRetry(
      async () => {
        const thread = codex.startThread({
          workingDirectory: process.cwd(),
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
  }
}
