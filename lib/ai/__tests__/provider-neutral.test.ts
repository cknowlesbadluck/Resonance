import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Provider-neutral guard (static, read-only). Vendor SDK imports and vendor API
 * hosts may appear only in the adapter layer lib/ai/providers/. Everything else
 * (routes, nexus, UI) must go through lib/ai. Fails closed: an unreadable tree
 * or an empty scan fails the test instead of passing silently.
 */
const ROOT = join(__dirname, "..", "..", "..");
const SCAN_DIRS = ["app", "lib", "src", "components"];
const ADAPTER_DIR = ["lib", "ai", "providers"].join(sep) + sep;
const SDK_IMPORT =
  /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["'](openai|@anthropic-ai\/[^"']+|@google\/(?:generative-ai|genai)|groq-sdk|@mistralai\/[^"']+|ollama|cohere-ai|@ai-sdk\/[^"']+|ai)["']/;
const VENDOR_HOST =
  /https?:\/\/(?:api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|api\.groq\.com|api\.mistral\.ai|api\.x\.ai|openrouter\.ai)/;

function walk(dir: string, out: string[]): void {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return; // absent top-level dir is fine; the non-empty check below catches a broken scan
  }
  for (const n of names) {
    if (n === "node_modules" || n.startsWith(".")) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mts|js|mjs)$/.test(n)) out.push(p);
  }
}

function violations(files: { path: string; text: string }[]): string[] {
  const bad: string[] = [];
  for (const { path, text } of files) {
    if (path.startsWith(ADAPTER_DIR) || path.includes(`${sep}__tests__${sep}`)) continue;
    if (SDK_IMPORT.test(text)) bad.push(`${path}: vendor SDK import`);
    if (VENDOR_HOST.test(text)) bad.push(`${path}: vendor API host`);
  }
  return bad;
}

describe("provider-neutral guard", () => {
  it("keeps vendor SDKs and hosts inside lib/ai/providers", () => {
    const files: string[] = [];
    for (const d of SCAN_DIRS) walk(join(ROOT, d), files);
    expect(files.length).toBeGreaterThan(20); // fail closed on an empty scan
    const scanned = files.map((f) => ({ path: relative(ROOT, f), text: readFileSync(f, "utf8") }));
    expect(scanned.some((f) => f.path.startsWith(ADAPTER_DIR))).toBe(true); // adapter layer must exist
    expect(violations(scanned)).toEqual([]);
  });

  it("flags a route that imports an SDK or calls a vendor host directly", () => {
    const r = ["app", "api", "x", "route.ts"].join(sep);
    expect(violations([{ path: r, text: 'import OpenAI from "openai";' }])).toHaveLength(1);
    expect(violations([{ path: r, text: 'await fetch("https://api.anthropic.com/v1/messages")' }])).toHaveLength(1);
    expect(violations([{ path: r, text: 'const m = await import("@google/genai");' }])).toHaveLength(1);
    expect(violations([{ path: ADAPTER_DIR + "openai.ts", text: 'fetch("https://api.openai.com")' }])).toEqual([]);
    expect(violations([{ path: r, text: 'import { run } from "@/lib/ai";' }])).toEqual([]);
  });
});
