/**
 * Generic JSON file storage utility for the data/ directory.
 */

import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJSON<T>(filename: string, defaultValue: T): Promise<T> {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filepath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    await writeJSON(filename, defaultValue);
    return defaultValue;
  }
}

export async function writeJSON<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");
}
