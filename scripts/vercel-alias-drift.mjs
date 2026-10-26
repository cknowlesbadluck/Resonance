#!/usr/bin/env node
// Report-only: what do the public Vercel aliases serve vs Resonance main? Public HTTP only; never exits non-zero on drift.
import { classifyAlias } from "../src/deploy/aliasDrift.mjs";

const ALIASES = (process.env.ALIAS_HOSTS || "resonance.vercel.app,resonancenexus.vercel.app,resonanceplane.vercel.app").split(",");
const REPO = process.env.REPO || "cknowlesbadluck/Resonance";

async function get(url, accept) {
  const res = await fetch(url, { headers: { "User-Agent": "resonance-alias-drift", Accept: accept }, signal: AbortSignal.timeout(15000), redirect: "follow" });
  return { status: res.status, contentType: res.headers.get("content-type") || "", body: await res.text() };
}

let mainSha = null;
try { const r = await get(`https://api.github.com/repos/${REPO}/commits/main`, "application/vnd.github+json"); mainSha = JSON.parse(r.body).sha || null; } catch { /* offline: aliases report comparison_unavailable */ }

const results = [];
for (const host of ALIASES) {
  try { const r = await get(`https://${host.trim()}/api/ready`, "application/json"); results.push({ host, status: r.status, ...classifyAlias(r, mainSha) }); }
  catch (e) { results.push({ host, status: null, outcome: "unreachable", drift: true, error: String(e?.name || e) }); }
}
const out = { at: new Date().toISOString(), mainSha, drift: results.some((r) => r.drift === true), verified: results.every((r) => r.drift !== null), results };
if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 2));
else { console.log(`main ${mainSha ?? "unknown"}`); for (const r of results) console.log(`${r.host}\t${r.status}\t${r.outcome}${r.drift === true ? "\tDRIFT" : r.drift === null ? "\tUNVERIFIED" : ""}`); }
