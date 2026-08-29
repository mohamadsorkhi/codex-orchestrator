import { runTasks } from "../src/core/orchestrator.js";
import type {
  OrchestratorTask,
  TaskResult,
} from "../src/core/types.js";

const tasks: OrchestratorTask[] = [
  {
    id: "frontend-dependency-audit",
    status: "pending",
    prompt: `
Analyze the Engipi repository's frontend dependency security.

Scope:
- package.json
- package-lock.json
- Vite configuration
- npm audit evidence when available

Rules:
- Read-only analysis.
- Do not edit, create, delete, install, or format files.
- Do not commit or push anything.
- Report only concrete findings supported by repository evidence.
- Prioritize findings as P0, P1, or P2.
- Return at most 10 concise findings.
- End with one recommended next task.
`,
  },
  {
    id: "test-gap-audit",
    status: "pending",
    prompt: `
Analyze the Engipi repository for high-risk automated test gaps.

Focus:
- Authentication and profile context
- Authorization
- Data deletion lifecycle
- Project and request workflows
- Deployment-critical runtime behavior

Rules:
- Read-only analysis.
- Do not edit, create, delete, install, or format files.
- Do not commit or push anything.
- Identify only the five highest-risk missing test areas.
- Cite the relevant files or routes for every finding.
- Prioritize findings as P0, P1, or P2.
- End with one recommended next task.
`,
  },
];

const results = await runTasks(tasks, 2);

const output = Array.from(
  results.values(),
).map((result: TaskResult) => ({
  taskId: result.taskId,
  status: result.status,
  output: result.output,
  error: result.error,
}));

console.log(JSON.stringify(output, null, 2));

if (
  results.size !== tasks.length ||
  output.some((result) => result.status !== "completed")
) {
  throw new Error("ENGIPI_MULTITASK_PILOT_FAILED");
}

console.log("ENGIPI_MULTITASK_PILOT_OK");