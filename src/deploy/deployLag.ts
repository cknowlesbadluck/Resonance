/**
 * Compare a live readiness body to the contract the repo serializes.
 * A missing field, or a contractRevision that is not the current stamp,
 * is deploy lag. It is not proof the owner gate is closed, and it is not
 * an agent defect in the current source tree.
 *
 * A classifier result never counts as proof. Setting SUPABASE_SERVICE_ROLE_KEY
 * remains an owner action. Do not invent the secret.
 */

export const EXPECTED_CONTRACT_REVISION = "2026-10-03-owner-gate";

export const contractReadinessFields = [
  "status",
  "ownerActionRequired",
  "ownerKeys",
  "agentActionRequired",
  "missingRequired",
  "contractRevision",
] as const;

export type DeployLag = {
  deployLag: boolean;
  missingContractFields: string[];
  ownerGateOpen: boolean;
  adapterUnconfigured: boolean;
  countsAsProof: false;
};

export function classifyReadyBody(body: unknown): DeployLag {
  const record = isRecord(body) ? body : {};
  const missingContractFields = contractReadinessFields.filter((field) => !fieldMatches(record, field));
  const missingRequired = Array.isArray(record.missingRequired)
    ? record.missingRequired.filter((item): item is string => typeof item === "string")
    : [];
  const contractShaped = missingContractFields.length === 0;
  // Contract-shaped: only the owner flag opens the owner gate.
  // agentActionRequired alone must not. Lagging bodies fall back to status.
  const ownerGateOpen = contractShaped
    ? record.ownerActionRequired === true
    : missingRequired.length > 0 || record.status !== "ready";
  return {
    deployLag: missingContractFields.length > 0,
    missingContractFields: [...missingContractFields],
    ownerGateOpen,
    adapterUnconfigured: record.githubAdapterConfigured === false,
    countsAsProof: false,
  };
}

function fieldMatches(record: Record<string, unknown>, field: (typeof contractReadinessFields)[number]): boolean {
  if (!(field in record)) return false;
  if (field === "contractRevision") return record.contractRevision === EXPECTED_CONTRACT_REVISION;
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
