export interface RetryOptions {
  maxAttempts: number;
  delayMs?: number;
  shouldRetry?: (
    error: unknown,
    attempt: number,
  ) => boolean;
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const {
    maxAttempts,
    delayMs = 0,
    shouldRetry,
  } = options;

  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts < 1
  ) {
    throw new Error(
      "maxAttempts must be a positive integer.",
    );
  }

  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      const attemptsRemain =
        attempt < maxAttempts;

      const retryAllowed =
        shouldRetry?.(error, attempt) ?? true;

      if (
        !attemptsRemain ||
        !retryAllowed
      ) {
        throw error;
      }

      if (delayMs > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs),
        );
      }
    }
  }

  throw lastError;
}