// sample.js (with imports + classes + async + generators + nested blocks)
import fs from "node:fs/promises";
import path from "node:path";

export class RepoScanner {
  #root;
  #ignore = new Set(["node_modules", ".git", "dist", "build"]);

  constructor(rootDir) {
    this.#root = rootDir;
  }

  shouldSkip(p) {
    const parts = p.split(path.sep);
    return parts.some((x) => this.#ignore.has(x));
  }

  async *walk(dir = this.#root) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (this.shouldSkip(full)) continue;

      if (e.isDirectory()) {
        yield* this.walk(full);
      } else if (e.isFile()) {
        yield full;
      }
    }
  }

  async summarize(maxFiles = 50) {
    const out = { total: 0, files: [] };
    for await (const p of this.walk()) {
      out.total++;
      if (out.files.length < maxFiles) out.files.push(p);
    }
    return out;
  }
}

export async function parseMaybeJson(text) {
  // handles: valid json, json w/ trailing commas, or plain text
  try {
    return JSON.parse(text);
  } catch {
    // small “best effort” cleanup
    const cleaned = text.replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(cleaned);
    } catch {
      return { raw: text };
    }
  }
}

export async function main() {
  const scanner = new RepoScanner(process.cwd());
  const sum = await scanner.summarize(10);
  console.log(sum);

  // nested long blocks + edge cases
  const samples = [
    '{"ok": true, "items": [1,2,3]}',
    '{"ok": true, "items": [1,2,],}', // trailing commas
    "not json at all",
  ];

  for (const s of samples) {
    const v = await parseMaybeJson(s);
    if (v.ok === true) {
      if (Array.isArray(v.items)) {
        const total = v.items.reduce((a, b) => a + b, 0);
        console.log("sum:", total);
      } else {
        console.log("ok, but items missing");
      }
    } else {
      console.log("fallback:", v.raw?.slice(0, 30));
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("fatal:", e);
    process.exitCode = 1;
  });
}
