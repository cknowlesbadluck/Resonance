import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guard: every server-side outbound fetch carries an AbortSignal (a timeout). Adapters take an
 * injected `fetchImpl`, so both `fetch(` and `fetchImpl(` calls are checked. Browser code under
 * app/ (same-origin API calls from the control surface) is out of scope.
 */
const ROOT = path.resolve(__dirname, "..", "..");
const SCAN = ["src", "lib", "scripts"];

function files(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  let entries: string[] = [];
  try { entries = readdirSync(abs); } catch { return []; }
  return entries.flatMap((name) => {
    const full = path.join(abs, name);
    if (statSync(full).isDirectory()) return name === "node_modules" ? [] : files(path.join(dir, name));
    return /\.(ts|mjs)$/.test(name) && !/\.test\.(ts|mjs)$/.test(name) && !name.endsWith(".d.ts") ? [full] : [];
  });
}

describe("outbound fetch timeouts", () => {
  it("every fetch()/fetchImpl() call in src, lib and scripts passes a signal", () => {
    const offenders: string[] = [];
    for (const file of SCAN.flatMap(files)) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/\b(?:fetch|fetchImpl)\(/g)) {
        const window = text.slice(match.index, match.index + 700);
        if (!/signal\s*:|signal\b,/.test(window)) offenders.push(`${path.relative(ROOT, file)}:${text.slice(0, match.index).split("\n").length}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
