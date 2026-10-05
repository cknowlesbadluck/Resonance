#!/usr/bin/env node
/**
 * Public-host pin for resonancenexus.
 * Exit 0 when the live /api/ready body matches the repo contract stamp.
 * Exit 2 on deploy lag (missing fields or a stale contractRevision).
 * A 503 with the current stamp is an owner gate, not lag, and not proof.
 * Never prints secret values. Never treats this classification as proof.
 */
const EXPECTED_CONTRACT_REVISION = "2026-10-03-owner-gate";
const CONTRACT_FIELDS = [
  "status",
  "ownerActionRequired",
  "ownerKeys",
  "agentActionRequired",
  "missingRequired",
  "contractRevision",
];

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

async function main() {
  const base = (process.env.PIN_BASE_URL ?? "https://resonancenexus.netlify.app").replace(/\/$/, "");
  const response = await fetch(`${base}/api/ready`);
  const body = await response.json();
  const result = classifyPublicReady(body);
  console.log(JSON.stringify({ base, httpStatus: response.status, ...result }));
  if (result.deployLag) process.exit(2);
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop());
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
