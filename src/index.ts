import { Codex } from "@openai/codex-sdk";

const codex = new Codex();

const thread = codex.startThread({
    workingDirectory: process.cwd(),
    skipGitRepoCheck: true
});

const turn = await thread.run(
    "Reply with exactly: SDK_ORCHESTRATOR_READY"
);

console.log(turn.finalResponse);
