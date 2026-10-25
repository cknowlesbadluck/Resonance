#!/usr/bin/env node
/**
 * Host-neutral production smoke for Resonance.
 * Set SMOKE_BASE_URL to the live control plane (currently Netlify).
 * Exits 0 when every case matches its allowed status set.
 */
import { productionSmokeCases } from "./production-smoke-cases.mjs";

const base = (process.env.SMOKE_BASE_URL ?? "").replace(/\/$/, "");
if (!base) {
  console.log("production-smoke: skip (SMOKE_BASE_URL unset)");
  process.exit(0);
}

const cases = productionSmokeCases();

const results = [];
for (const item of cases) {
  const response = await fetch(`${base}${item.path}`, {
    method: item.method,
    headers: item.headers,
    body: item.body === undefined ? undefined : JSON.stringify(item.body),
  });
  const ok = item.expectStatus.includes(response.status);
  const transitional = ok && Array.isArray(item.targetStatus) && !item.targetStatus.includes(response.status);
  let snippet = "";
  try {
    snippet = (await response.text()).slice(0, 240);
  } catch {
    snippet = "";
  }
  results.push({ id: item.id, status: response.status, ok, transitional, snippet });
  console.log(`${ok ? (transitional ? "PASS (transitional, target " + item.targetStatus.join(",") + ")" : "PASS") : "FAIL"} ${item.id.padEnd(28)} → ${response.status} (allowed ${item.expectStatus.join(",")})`);
}

if (results.some((item) => !item.ok)) {
  console.error(JSON.stringify({ base, results }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ base, passed: results.length, transitional: results.filter((r) => r.transitional).map((r) => r.id) }));
