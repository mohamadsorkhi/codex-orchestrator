import { withRetry } from "../src/core/retry.js";

let attempts = 0;

const result = await withRetry(
  async (attempt) => {
    attempts = attempt;
    console.log(`attempt: ${attempt}`);

    if (attempt < 3) {
      throw new Error(`Simulated failure on attempt ${attempt}`);
    }

    return "RETRY_TEST_OK";
  },
  {
    maxAttempts: 3,
    delayMs: 100,
  },
);

console.log("result:", result);
console.log("attempts:", attempts);

if (result !== "RETRY_TEST_OK") {
  throw new Error("Retry result is incorrect.");
}

if (attempts !== 3) {
  throw new Error(`Expected 3 attempts, got ${attempts}`);
}

console.log("RETRY_BEHAVIOR_OK");
