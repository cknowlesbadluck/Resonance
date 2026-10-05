#!/usr/bin/env node
/**
 * Public-host pin for resonancenexus.
 * Exit 0 when the live /api/ready body matches the repo contract stamp.
 * Exit 2 on deploy lag (missing fields or a stale contractRevision).
 * Exit 3 when the target is a dead or protected alias, not the public host.
 * A 503 with the current stamp is an owner gate, not lag, and not proof.
 * Never prints secret values. Never treats this classification as proof.
 */
const EXPECTED_CONTRACT_REVISION = "2026-10-03-owner-gate";
export const CANONICAL_PUBLIC_HOST = "resonancenexus.netlify.app";
const CONTRACT_FIELDS = [
  "status",
  "ownerActionRequired",
  "ownerKeys",
  "agentActionRequired",
  "missingRequired",
  "contractRevision",
];

export function hostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function classifyPublicReady(body) {
  const record = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const missingContractFields = CONTRACT_FIELDS.filter((field) => {
    if (!(field in record)) return true;
    if (field === "contractRevision") return record.contractRevision !== EXPECTED_CONTRACT_REVISION;
    return false;
  });
  return {
    deployLag: missingContractFields.length > 0,
    missingContractFields,
    ownerGateOpen: record.ownerActionRequired === true || missingContractFields.length > 0,
    expectedContractRevision: EXPECTED_CONTRACT_REVISION,
    liveContractRevision: typeof record.contractRevision === "string" ? record.contractRevision : null,
    countsAsProof: false,
  };
}

/**
 * A Vercel alias, including DEPLOYMENT_NOT_FOUND, is never the public gate.
 * Non-JSON alias text must not be parsed as an owner-gate body.
 */
export function classifyProbeSurface({ url, httpStatus, bodyText, json }) {
  const host = hostname(url);
  const text = typeof bodyText === "string" ? bodyText : "";
  const aliasAbsent =
    host.endsWith(".vercel.app") ||
    text.includes("DEPLOYMENT_NOT_FOUND") ||
    (httpStatus === 404 && /deployment could not be found/i.test(text));
  if (aliasAbsent) {
    return {
      kind: "alias_absent",
      aliasAbsent: true,
      deployLag: false,
      missingContractFields: [],
      ownerGateOpen: false,
      expectedContractRevision: EXPECTED_CONTRACT_REVISION,
      liveContractRevision: null,
      countsAsProof: false,
      note: "vercel_alias_is_not_the_public_gate",
    };
  }
  const classified = classifyPublicReady(json);
  return {
    ...classified,
    kind: classified.deployLag ? "deploy_lag" : classified.ownerGateOpen ? "owner_gate" : "ready_unproven",
    aliasAbsent: false,
    note: host === CANONICAL_PUBLIC_HOST ? "canonical_public_host" : "unknown_host",
  };
}

async function main() {
  const base = (process.env.PIN_BASE_URL ?? `https://${CANONICAL_PUBLIC_HOST}`).replace(/\/$/, "");
  const host = hostname(base);
  if (host.endsWith(".vercel.app")) {
    const result = classifyProbeSurface({ url: base, httpStatus: 0, bodyText: "", json: null });
    console.log(JSON.stringify({ base, httpStatus: 0, ...result }));
    process.exit(3);
  }
  const response = await fetch(`${base}/api/ready`);
  const bodyText = await response.text();
  let json = null;
  try {
    json = JSON.parse(bodyText);
  } catch {
    json = null;
  }
  const result = classifyProbeSurface({
    url: base,
    httpStatus: response.status,
    bodyText,
    json,
  });
  console.log(JSON.stringify({ base, httpStatus: response.status, ...result }));
  if (result.aliasAbsent) process.exit(3);
  if (result.deployLag) process.exit(2);
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop());
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
