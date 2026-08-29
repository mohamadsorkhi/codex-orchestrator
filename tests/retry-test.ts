import assert from "node:assert/strict";
import { withRetry } from "../src/core/retry.js";

let retryableAttempts = 0;

const result = await withRetry(
  async (attempt) => {
    retryableAttempts = attempt;
    console.log(`retryable attempt: ${attempt}`);

    if (attempt < 3) {
      throw new Error(
        `Simulated failure on attempt ${attempt}`,
      );
    }

    return "RETRY_TEST_OK";
  },
  {
    maxAttempts: 3,
    delayMs: 100,
  },
);

assert.equal(
  result,
  "RETRY_TEST_OK",
);

assert.equal(
  retryableAttempts,
  3,
);

const deterministicError = new Error(
  "DETERMINISTIC_BLOCKER",
);

let nonRetryableAttempts = 0;

await assert.rejects(
  () =>
    withRetry(
      async () => {
        nonRetryableAttempts += 1;
        throw deterministicError;
      },
      {
        maxAttempts: 3,
        delayMs: 100,
        shouldRetry: (error) =>
          error !== deterministicError,
      },
    ),
  /DETERMINISTIC_BLOCKER/,
);

assert.equal(
  nonRetryableAttempts,
  1,
);

console.log("RETRY_BEHAVIOR_OK");