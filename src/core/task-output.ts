export const taskOutputSchema = {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["completed", "blocked"],
      },
      output: {
        type: "string",
      },
      error: {
        type: "string",
      },
    },
    required: [
      "status",
      "output",
      "error",
    ],
    additionalProperties: false,
  } as const;

  interface AgentTaskOutput {
    status: "completed" | "blocked";
    output: string;
    error: string;
  }

  export function buildTaskPrompt(prompt: string): string {
    return `${prompt.trim()}

  Result contract:
  - Set status to "completed" only when you successfully accessed the required evidence and completed the requested task.
  - Set status to "blocked" when access, permissions, missing files, unavailable tools, or another blocker prevents evidence-backed completion.
  - Put the successful task result in output.
  - Put the blocker reason in error.
  - Never report a blocked or incomplete task as completed.`;
  }

  export function parseTaskOutput(response: string): string {
    let parsed: unknown;

    try {
      parsed = JSON.parse(response);
    } catch {
      throw new Error(
        "Agent task output must be valid JSON.",
      );
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error(
        "Agent task output must be a JSON object.",
      );
    }

    const candidate = parsed as Partial<AgentTaskOutput>;

    if (
      candidate.status !== "completed" &&
      candidate.status !== "blocked"
    ) {
      throw new Error(
        "Agent task output has an invalid status.",
      );
    }

    if (typeof candidate.output !== "string") {
      throw new Error(
        "Agent task output must include an output string.",
      );
    }

    if (typeof candidate.error !== "string") {
      throw new Error(
        "Agent task output must include an error string.",
      );
    }

    if (candidate.status === "blocked") {
      const reason =
        candidate.error.trim() ||
        candidate.output.trim() ||
        "Agent reported that the task was blocked.";

      throw new Error(`Task blocked: ${reason}`);
    }

    if (candidate.output.trim() === "") {
      throw new Error(
        "Completed agent task output requires non-empty output.",
      );
    }

    return candidate.output;
  }