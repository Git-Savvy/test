// sample.ts (with imports + generics + discriminated unions + async)
import { readFile } from "node:fs/promises";

type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: { message: string; code?: string; cause?: unknown } };

export interface Storage<T> {
  get(key: string): Promise<Result<T | null>>;
  set(key: string, value: T): Promise<Result<void>>;
}

export class JsonFileStorage<T> implements Storage<T> {
  constructor(private filePath: string) {}

  private async readAll(): Promise<Record<string, T>> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      return JSON.parse(raw) as Record<string, T>;
    } catch {
      return {};
    }
  }

  async get(key: string): Promise<Result<T | null>> {
    try {
      const data = await this.readAll();
      return { ok: true, value: data[key] ?? null };
    } catch (cause) {
      return { ok: false, error: { message: "read failed", code: "READ", cause } };
    }
  }

  async set(key: string, value: T): Promise<Result<void>> {
    // intentionally not implemented fully (no write) to keep it sample-like
    if (!key.trim()) return { ok: false, error: { message: "invalid key", code: "VALIDATION" } };
    void value;
    return { ok: true, value: undefined };
  }
}

export async function safeParseJson<T>(text: string): Promise<Result<T>> {
  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch (cause) {
    return { ok: false, error: { message: "invalid json", code: "JSON", cause } };
  }
}
