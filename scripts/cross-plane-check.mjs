#!/usr/bin/env node
/**
 * Cross-plane consistency check (read-only, no secrets).
 * The PortfolioPosture classifier is copied into Resonance, Conduit and QuicksilverV1
 * (scripts/portfolio-posture.mjs). This verifies the posture vocabularies agree and,
 * with --live, that the Resonance /api/ready body carries the expected contractRevision.
 * Network: public raw.githubusercontent.com GETs only. Never writes anything.
 *
 *   node scripts/cross-plane-check.mjs [--live https://resonancenexus.netlify.app]
 */
import { readFileSync } from "node:fs";

export const CANONICAL_POSTURES = [
  "alias_absent", "cold_start", "deploy_lag", "device_not_recorded", "device_recorded",
  "incomplete_ready", "owner_gate", "ready", "stranger", "unknown",
];

export const PLANES = [
  { plane: "conduit", repo: "cknowlesbadluck/Conduit", path: "scripts/portfolio-posture.mjs" },
  { plane: "quicksilver", repo: "cknowlesbadluck/QuicksilverV1", path: "scripts/portfolio-posture.mjs" },
];

/** Posture literals a classifier can emit: `posture: 'x'` or `return 'x'`. */
export function extractPostures(source) {
  const found = new Set();
  for (const m of source.matchAll(/(?:posture:\s*|return\s+)['"]([a-z_]+)['"]/g)) found.add(m[1]);
  return [...found].sort();
}

export function compareVocabulary(plane, postures, canonical = CANONICAL_POSTURES) {
  const unknown = postures.filter((p) => !canonical.includes(p));
  const missing = canonical.filter((p) => !postures.includes(p));
  return { plane, ok: unknown.length === 0, unknown, missing };
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

async function main() {
  const results = [];
  const local = readFileSync(new URL("./portfolio-posture.mjs", import.meta.url), "utf8");
  results.push(compareVocabulary("resonance", extractPostures(local)));
  for (const { plane, repo, path } of PLANES) {
    try {
      const src = await fetchText(`https://raw.githubusercontent.com/${repo}/HEAD/${path}`);
      results.push(compareVocabulary(plane, extractPostures(src)));
    } catch (error) {
      results.push({ plane, ok: false, error: String(error) });
    }
  }
  const liveIdx = process.argv.indexOf("--live");
  if (liveIdx > 0) {
    const base = process.argv[liveIdx + 1];
    const deployLag = readFileSync(new URL("../src/deploy/deployLag.ts", import.meta.url), "utf8");
    const expected = deployLag.match(/EXPECTED_CONTRACT_REVISION = "([^"]+)"/)?.[1];
    try {
      const res = await fetch(`${base}/api/ready`, { signal: AbortSignal.timeout(15000) });
      const body = await res.json().catch(() => ({}));
      results.push({ plane: "resonance-live", ok: body.contractRevision === expected, expected, got: body.contractRevision ?? null, status: res.status });
    } catch (error) {
      results.push({ plane: "resonance-live", ok: false, error: String(error) });
    }
  }
  console.log(JSON.stringify(results, null, 2));
  // Unknown postures are drift (exit 1); "missing" is informational (a plane may emit a subset).
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
