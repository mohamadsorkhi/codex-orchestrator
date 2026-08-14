import { Codex } from "@openai/codex-sdk";
import type { OrchestratorTask } from "./types.js";

const codex = new Codex();

export async function runTask(task: OrchestratorTask): Promise<string> {
  task.status = "running";

  try {
    const thread = codex.startThread({
      workingDirectory: process.cwd(),
      skipGitRepoCheck: true,
    });

    const turn = await thread.run(task.prompt);

    task.status = "completed";
    return turn.finalResponse;
  } catch (error) {
    task.status = "failed";
    throw error;
  }
}
