#!/usr/bin/env node
/**
 * Deploy-parity check — free, zero-dependency, read-only, report-only.
 *
 * Compares the field set of the live /api/ready body with the contract that
 * main serializes (the `Readiness` type in src/deploy/health.ts, plus
 * EXPECTED_CONTRACT_REVISION in src/deploy/deployLag.ts). Missing fields or a
 * stale contractRevision mean "prod is behind main".
 *
 * No secrets: one unauthenticated GET, redirect: "manual", no cookies or
 * Authorization header. Only field NAMES and the public contractRevision
 * stamp are printed; no other values from the live body are echoed.
 *
 * Usage:
 *   node scripts/deploy-parity.mjs [url] [--json] [--strict]
 *   node scripts/deploy-parity.mjs --body-file <path> [--json]   (offline)
 *   node scripts/deploy-parity.mjs --expected --json             (main's contract only)
 *   node scripts/deploy-parity.mjs [url|--body-file f] --plan    (ordered owner unblock plan)
 * Default url: $PARITY_URL or https://resonancenexus.netlify.app/api/ready
 * Exit code: 0 (report-only) unless --strict and the verdict is not in_parity.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_URL = "https://resonancenexus.netlify.app/api/ready";

/** Field names declared in `export type Readiness = { ... };`. */
export function parseReadinessFields(healthSource) {
  const block = /export type Readiness = \{([\s\S]*?)\n\};/.exec(healthSource);
  if (!block) throw new Error("Readiness type not found in src/deploy/health.ts");
  const fields = [...block[1].matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\??\s*:/gm)].map((m) => m[1]);
  if (fields.length === 0) throw new Error("Readiness type has no fields");
  return fields;
}

export function parseExpectedRevision(deployLagSource) {
  const m = /export const EXPECTED_CONTRACT_REVISION\s*=\s*"([^"]+)"/.exec(deployLagSource);
  if (!m) throw new Error("EXPECTED_CONTRACT_REVISION not found in src/deploy/deployLag.ts");
  return m[1];
}

/** Names in `const OWNER_SECRET_KEYS = new Set([...])` (src/deploy/contract.ts): keys only the owner may set. */
export function parseOwnerKeys(contractSource) {
  const block = /const OWNER_SECRET_KEYS = new Set\(\[([\s\S]*?)\]\)/.exec(contractSource);
  if (!block) throw new Error("OWNER_SECRET_KEYS not found in src/deploy/contract.ts");
  return [...block[1].matchAll(/"([A-Z0-9_]+)"/g)].map((m) => m[1]);
}

export async function loadExpected(root = ROOT) {
  const [health, lag, contract] = await Promise.all([
    readFile(path.join(root, "src/deploy/health.ts"), "utf8"),
    readFile(path.join(root, "src/deploy/deployLag.ts"), "utf8"),
    readFile(path.join(root, "src/deploy/contract.ts"), "utf8"),
  ]);
  return { fields: parseReadinessFields(health), contractRevision: parseExpectedRevision(lag), ownerKeys: parseOwnerKeys(contract) };
}

const ENV_NAME = /^[A-Z][A-Z0-9_]{0,63}$/;

/**
 * Ordered, honest path from "prod is down/stale" to "prod serves main", using only public
 * /api/ready signals. Key names come from main's OWNER_SECRET_KEYS allowlist (or are
 * reported as agent-fixable config); values are never read or printed. Pure.
 */
export function unblockPlan(live, parity, expected, site = "resonancenexus") {
  const steps = [];
  const missing = live && typeof live === "object" && Array.isArray(live.missingRequired)
    ? live.missingRequired.filter((k) => typeof k === "string" && ENV_NAME.test(k)) : [];
  const ownerKeys = missing.filter((k) => expected.ownerKeys.includes(k));
  const agentKeys = missing.filter((k) => !expected.ownerKeys.includes(k));
  if (parity.verdict === "not_a_ready_body") {
    steps.push({ who: "owner", action: `Check the Netlify site '${site}' is serving this repo at all (no resonance-nexus /api/ready body).` });
  }
  if (ownerKeys.length) {
    steps.push({ who: "owner", action: `Set ${ownerKeys.join(", ")} in Netlify site '${site}' environment (Production context). Values never go in the repo or chat.` });
  }
  if (agentKeys.length) {
    steps.push({ who: "agent", action: `Non-secret config missing in production: ${agentKeys.join(", ")}; add to netlify.toml / site env via a reviewed PR.` });
  }
  if (live && live.authModeOk === false) steps.push({ who: "owner", action: "Fix RESONANCE_AUTH_MODE in production (must be 'required')." });
  if (parity.behindMain) {
    steps.push({ who: "owner", action: `Redeploy main to '${site}' (prod is behind main's /api/ready contract ${expected.contractRevision}).` });
  }
  if (steps.length) {
    steps.push({ who: "agent", action: "Verify: node scripts/deploy-parity.mjs --strict, then npm run smoke against production; both must pass before calling prod live." });
  }
  return { productionReady: steps.length === 0 && live?.status === "ready", steps };
}

const REVISION = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * Pure comparison. `live` is a parsed JSON body (or anything else).
 * verdict: in_parity | behind_main | differs_from_main | not_a_ready_body
 */
export function compareParity(live, expected) {
  if (!live || typeof live !== "object" || Array.isArray(live) || live.service !== "resonance-nexus") {
    return { verdict: "not_a_ready_body", behindMain: null, missingFields: [], extraFields: [], liveContractRevision: null, expectedContractRevision: expected.contractRevision };
  }
  const liveKeys = Object.keys(live);
  const missingFields = expected.fields.filter((f) => !liveKeys.includes(f));
  const extraFields = liveKeys.filter((f) => !expected.fields.includes(f));
  const rev = typeof live.contractRevision === "string" && REVISION.test(live.contractRevision) ? live.contractRevision : null;
  const revisionMatches = rev === expected.contractRevision;
  const behindMain = missingFields.length > 0 || !revisionMatches;
  const verdict = behindMain ? "behind_main" : extraFields.length > 0 ? "differs_from_main" : "in_parity";
  return { verdict, behindMain, missingFields, extraFields, liveContractRevision: rev, expectedContractRevision: expected.contractRevision };
}

export async function fetchReady(url, { timeoutMs = 20_000, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: controller.signal, redirect: "manual", headers: { accept: "application/json" } });
    const text = (await res.text()).slice(0, 16_384);
    let body;
    try { body = JSON.parse(text); } catch { body = undefined; }
    return { status: res.status, body };
  } catch (error) {
    return { error: controller.signal.aborted || error?.name === "AbortError" ? "timeout" : "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

export function summarize(r) {
  if (r.verdict === "behind_main") {
    const parts = [];
    if (r.missingFields.length) parts.push(`missing fields: ${r.missingFields.join(", ")}`);
    if (r.liveContractRevision !== r.expectedContractRevision) parts.push(`contractRevision ${r.liveContractRevision ?? "(absent)"} != ${r.expectedContractRevision}`);
    return `prod is behind main (${parts.join("; ")})`;
  }
  if (r.verdict === "in_parity") return "prod matches main's /api/ready contract";
  if (r.verdict === "differs_from_main") return `prod has fields main does not declare: ${r.extraFields.join(", ")}`;
  return `could not compare: ${r.reason ?? "not a resonance-nexus ready body"}`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const expected = await loadExpected();
  if (args.includes("--expected")) {
    console.log(json ? JSON.stringify(expected) : `${expected.contractRevision}: ${expected.fields.join(", ")}`);
    process.exit(0);
  }
  const bodyFileIdx = args.indexOf("--body-file");
  let result;
  let source;
  let liveBody;
  if (bodyFileIdx !== -1) {
    source = args[bodyFileIdx + 1];
    liveBody = JSON.parse(await readFile(source, "utf8"));
    result = compareParity(liveBody, expected);
  } else {
    source = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--body-file") ?? process.env.PARITY_URL ?? DEFAULT_URL;
    const obs = await fetchReady(source);
    liveBody = obs.body;
    result = obs.error
      ? { verdict: "not_a_ready_body", behindMain: null, missingFields: [], extraFields: [], liveContractRevision: null, expectedContractRevision: expected.contractRevision, reason: obs.error }
      : { ...compareParity(obs.body, expected), httpStatus: obs.status };
  }
  const out = { at: new Date().toISOString(), source, ...result, summary: summarize(result) };
  if (args.includes("--plan")) {
    out.plan = unblockPlan(liveBody, result, expected);
    if (!json) {
      console.log(`deploy-parity: ${out.summary}`);
      console.log(out.plan.steps.length ? out.plan.steps.map((s, i) => `${i + 1}. [${s.who}] ${s.action}`).join("\n") : "No unblock steps: production is ready and in parity.");
      process.exit(0);
    }
  }
  console.log(json ? JSON.stringify(out, null, 2) : `deploy-parity: ${out.summary}`);
  if (args.includes("--strict") && result.verdict !== "in_parity") process.exitCode = 1;
}
