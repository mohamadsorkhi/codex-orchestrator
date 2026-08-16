import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { OrchestratorTask } from "./types.js";

export class StateStore {
  private saveQueue: Promise<void> = Promise.resolve();
  constructor(private readonly filePath: string) {}

  async save(tasks: OrchestratorTask[]): Promise<void> {
    const data = JSON.stringify(tasks, null, 2);

    this.saveQueue = this.saveQueue.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true });
      const tempPath = `${this.filePath}.tmp`;

      await writeFile(tempPath, data, "utf8");
      await rename(tempPath, this.filePath);
    });

    await this.saveQueue;
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



