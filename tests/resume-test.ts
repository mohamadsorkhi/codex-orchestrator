import { rm } from "node:fs/promises";
import { StateStore } from "../src/core/state-store.js";
import { loadResumableTasks } from "../src/core/resume.js";
import type { OrchestratorTask } from "../src/core/types.js";

const stateFile = "./state/resume-test.json";
const store = new StateStore(stateFile);

const tasks: OrchestratorTask[] = [
  {
    id: "task-running",
    prompt: "Running task",
    status: "running",
  },
  {
    id: "task-pending",
    prompt: "Pending task",
    status: "pending",
  },
  {
    id: "task-completed",
    prompt: "Completed task",
    status: "completed",
  },
  {
    id: "task-failed",
    prompt: "Failed task",
    status: "failed",
  },
];

await store.save(tasks);

const resumable = await loadResumableTasks(stateFile);
const ids = resumable.map((task) => task.id);

if (!ids.includes("task-running")) {
  throw new Error("Interrupted running task should be resumable.");
}

if (!ids.includes("task-pending")) {
  throw new Error("Pending task should be resumable.");
}

if (ids.includes("task-completed")) {
  throw new Error("Completed task must not be resumed.");
}

if (ids.includes("task-failed")) {
  throw new Error("Failed task must not be resumed automatically.");
}

console.log("resumable:", resumable);
console.log("RESUME_TEST_OK");

await rm(stateFile, { force: true });
