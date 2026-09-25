import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Executable architecture rules.
 *
 * `src/nexus/capability-bridge.ts` previously imported `lib/capabilities`, which inverted
 * the dependency arrow and coupled the Nexus contract to a hard-coded fixture list.
 * Nothing in the build caught it, because an inverted import is still a valid import.
 * These tests make the layering a property the suite enforces rather than a convention
 * the docs assert.
 *
 * Layering, innermost first:
 *   src/nexus  →  (nothing outward)
 *   src/composition  →  src/nexus, lib      ← the only module allowed to know both
 *   app/  →  src/composition, src/nexus, lib
 */

const ROOT = join(__dirname, "..", "..");

function sourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return full.endsWith(".ts") || full.endsWith(".tsx") ? [full] : [];
  });
}

const IMPORT_RE = /(?:from|import)\s+["']([^"']+)["']/g;

function importsOf(file: string): string[] {
  const contents = readFileSync(file, "utf8");
  const found: string[] = [];
  for (const match of contents.matchAll(IMPORT_RE)) found.push(match[1]);
  return found;
}

/** Resolves a relative specifier to a repo-root-relative path, ignoring packages. */
function resolveLocal(file: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const dir = join(file, "..");
  return relative(ROOT, join(dir, specifier)).replace(/\\/g, "/");
}

describe("architecture: dependency direction", () => {
  const nexusFiles = sourceFiles(join(ROOT, "src", "nexus"));

  it("finds the nexus core sources", () => {
    expect(nexusFiles.length).toBeGreaterThan(10);
  });

  it("src/nexus never imports from lib/", () => {
    const violations: string[] = [];
    for (const file of nexusFiles) {
      for (const specifier of importsOf(file)) {
        const resolved = resolveLocal(file, specifier);
        if (resolved?.startsWith("lib/")) {
          violations.push(`${relative(ROOT, file)} → ${specifier}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("src/nexus never imports from app/ or src/composition", () => {
    const violations: string[] = [];
    for (const file of nexusFiles) {
      for (const specifier of importsOf(file)) {
        const resolved = resolveLocal(file, specifier);
        if (resolved?.startsWith("app/") || resolved?.startsWith("src/composition")) {
          violations.push(`${relative(ROOT, file)} → ${specifier}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("only the composition root bridges src/nexus and lib/", () => {
    const bridging = sourceFiles(join(ROOT, "src"))
      .filter((file) => {
        const specifiers = importsOf(file).map((s) => resolveLocal(file, s));
        const touchesLib = specifiers.some((s) => s?.startsWith("lib/"));
        const touchesNexus = specifiers.some((s) => s?.startsWith("src/nexus"));
        return touchesLib && touchesNexus;
      })
      .map((file) => relative(ROOT, file).replace(/\\/g, "/"));

    expect(bridging).toEqual(["src/composition/root.ts"]);
  });
});

describe("architecture: execution-path contracts", () => {
  it("every execution-creating route enforces idempotency by header or by atomic claim", () => {
    const routes = sourceFiles(join(ROOT, "app", "api"))
      .filter((file) => file.endsWith("route.ts"))
      .filter((file) => /export\s+async\s+function\s+POST/.test(readFileSync(file, "utf8")))
      .filter((file) => /NexusExecutor|\.execute\(/.test(readFileSync(file, "utf8")));

    expect(routes.length).toBeGreaterThan(0);

    // Two mechanisms are acceptable, and only two:
    //  1. An `Idempotency-Key` header (POST /executions — caller-supplied key).
    //  2. A path-scoped compare-and-swap (POST /executions/[id]/resume — the path id *is*
    //     the key, and the conditional status update means a second concurrent resume
    //     matches zero rows and gets a 409).
    // Anything else is a new execution path that can double-execute.
    const unprotected = routes.filter((file) => {
      const contents = readFileSync(file, "utf8");
      const hasHeader = contents.includes("Idempotency-Key");
      const hasAtomicClaim = /\.update\(/.test(contents)
        && /\.eq\("status"/.test(contents)
        && /claimed|claim_token/.test(contents);
      return !hasHeader && !hasAtomicClaim;
    });

    expect(unprotected.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it("no route composes intents without going through the composition root", () => {
    const offenders = sourceFiles(join(ROOT, "app"))
      .filter((file) => {
        const contents = readFileSync(file, "utf8");
        return contents.includes("composeNexusIntent") && !contents.includes("composition/root");
      })
      .map((file) => relative(ROOT, file));

    expect(offenders).toEqual([]);
  });
});
