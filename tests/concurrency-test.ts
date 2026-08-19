import { mapWithConcurrency } from "../src/core/concurrency.js";

let active = 0;
let maxActive = 0;

const items = [1, 2, 3, 4, 5];

const results = await mapWithConcurrency(
  items,
  2,
  async (item) => {
    active++;
    maxActive = Math.max(maxActive, active);

    await new Promise((resolve) => setTimeout(resolve, 100));

    active--;
    return item * 10;
  },
);

console.log("results:", results.join(", "));
console.log("max-active:", maxActive);

if (maxActive !== 2) {
  throw new Error(`Expected max concurrency 2, got ${maxActive}`);
}

if (results.join(",") !== "10,20,30,40,50") {
  throw new Error("Results are incorrect or out of order.");
}

console.log("CONCURRENCY_TEST_OK");
