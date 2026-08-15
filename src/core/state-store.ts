import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { OrchestratorTask } from "./types.js";

export class StateStore {
  constructor(private readonly filePath: string) {}

  async save(tasks: OrchestratorTask[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });

    const data = JSON.stringify(tasks, null, 2);
    await writeFile(this.filePath, data, "utf8");
  }

  async load(): Promise<OrchestratorTask[]> {
    try {
      const data = await readFile(this.filePath, "utf8");
      return JSON.parse(data) as OrchestratorTask[];
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return [];
      }

      throw error;
    }
  }
}
