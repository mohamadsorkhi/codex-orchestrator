import { Codex } from "@openai/codex-sdk";
import type { OrchestratorTask } from "./types.js";
import { withRetry } from "./retry.js";
import {
  BlockedTaskError,
  buildTaskPrompt,
  parseTaskOutput,
  taskOutputSchema,
} from "./task-output.js";
import { createTaskWorktree } from "./worktree.js";

const codex = new Codex();

export async function runTask(
  task: OrchestratorTask,
): Promise<string> {
  task.status = "running";

  let worktree:
    | Awaited<ReturnType<typeof createTaskWorktree>>
    | undefined;

  try {
    worktree = await createTaskWorktree();

    const result = await withRetry(
      async () => {
        const thread = codex.startThread({
          workingDirectory: worktree!.path,
          skipGitRepoCheck: true,
        });

        const turn = await thread.run(
          buildTaskPrompt(task.prompt),
          {
            outputSchema: taskOutputSchema,
          },
        );

        return parseTaskOutput(
          turn.finalResponse,
        );
      },
      {
        maxAttempts: 3,
        delayMs: 1000,
        shouldRetry: (error) =>
          !(
            error instanceof
            BlockedTaskError
          ),
      },
    );

    task.status = "completed";

    return result;
  } catch (error) {
    task.status = "failed";

    throw error;
  } finally {
    await worktree?.cleanup();
  }
}