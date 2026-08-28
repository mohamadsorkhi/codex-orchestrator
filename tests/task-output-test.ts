import assert from "node:assert/strict";
import { parseTaskOutput } from "../src/core/task-output.js";

const completedOutput = parseTaskOutput(
  JSON.stringify({
    status: "completed",
    output: "Evidence-backed audit completed.",
    error: "",
  }),
);

assert.equal(
  completedOutput,
  "Evidence-backed audit completed.",
);

assert.throws(
  () =>
    parseTaskOutput(
      JSON.stringify({
        status: "blocked",
        output: "",
        error: "Repository access denied.",
      }),
    ),
  /Repository access denied/,
);

assert.throws(
  () =>
    parseTaskOutput(
      JSON.stringify({
        status: "completed",
        output: "",
        error: "",
      }),
    ),
  /non-empty output/,
);

assert.throws(
  () => parseTaskOutput("not-json"),
  /valid JSON/,
);

assert.throws(
  () =>
    parseTaskOutput(
      JSON.stringify({
        status: "unknown",
        output: "Unexpected status.",
        error: "",
      }),
    ),
  /invalid status/,
);

console.log("TASK_OUTPUT_VALIDATION_OK");