import { mapWithConcurrency } from "../src/core/concurrency.js";

const startedItems: number[] = [];
const completedItems: number[] = [];
let activeWorkers = 0;
let receivedError: unknown;

try {
  await mapWithConcurrency(
    [1, 2, 3, 4, 5],
    2,
    async (item) => {
      startedItems.push(item);
      activeWorkers += 1;

      try {
        if (item === 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 20),
          );

          throw new Error("SIMULATED_WORKER_FAILURE");
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 100),
        );

        completedItems.push(item);
        return item;
      } finally {
        activeWorkers -= 1;
      }
    },
  );
} catch (error) {
  receivedError = error;
}

if (
  !(receivedError instanceof Error) ||
  receivedError.message !== "SIMULATED_WORKER_FAILURE"
) {
  throw new Error("Expected worker failure was not propagated.");
}

if (activeWorkers !== 0) {
  throw new Error(
    "mapWithConcurrency rejected before active workers settled.",
  );
}

if (startedItems.join(",") !== "1,2") {
  throw new Error(
    `Workers claimed queued items after failure: ${startedItems.join(",")}`,
  );
}

if (completedItems.join(",") !== "2") {
  throw new Error(
    "The active non-failing worker did not settle before rejection.",
  );
}

const startedSnapshot = startedItems.join(",");
const completedSnapshot = completedItems.join(",");

await new Promise((resolve) =>
  setTimeout(resolve, 150),
);

if (
  startedItems.join(",") !== startedSnapshot ||
  completedItems.join(",") !== completedSnapshot
) {
  throw new Error(
    "Workers continued producing side effects after rejection.",
  );
}

console.log("CONCURRENCY_FAILURE_SETTLEMENT_OK");