export function validateConcurrencyLimit(
  limit: number,
): void {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(
      "Concurrency limit must be a positive integer.",
    );
  }
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  validateConcurrencyLimit(limit);

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const index = nextIndex++;

      if (index >= items.length) {
        return;
      }

      results[index] = await worker(items[index]);
    }
  }

  const workerCount = Math.min(limit, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, () => runWorker()),
  );

  return results;
}
