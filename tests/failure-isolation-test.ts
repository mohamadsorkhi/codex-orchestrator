import { mapWithConcurrency } from "../src/core/concurrency.js";

const tasks = ["task-1", "task-2", "task-3"];

const results = await mapWithConcurrency(
  tasks,
  2,
  async (task) => {
    try {
      if (task === "task-2") {
        throw new Error("SIMULATED_FAILURE");
      }

      return {
        task,
        status: "completed" as const,
      };
    } catch (error) {
      return {
        task,
        status: "failed" as const,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
);

console.log(results);

if (results[0]?.status !== "completed") {
  throw new Error("task-1 should complete.");
}

if (results[1]?.status !== "failed") {
  throw new Error("task-2 should fail.");
}

if (results[2]?.status !== "completed") {
  throw new Error("task-3 should complete.");
}

console.log("FAILURE_ISOLATION_OK");
