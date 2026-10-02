/**
 * Compare a live readiness body to the contract main already serializes.
 * A missing field is deploy lag. It is not proof the owner gate is closed,
 * and it is not an agent defect in the current source tree.
 */

export const contractReadinessFields = [
  "status",
  "ownerActionRequired",
  "ownerKeys",
  "agentActionRequired",
  "missingRequired",
] as const;

export type DeployLag = {
  deployLag: boolean;
  missingContractFields: string[];
  ownerGateOpen: boolean;
  countsAsProof: false;
};

export function classifyReadyBody(body: unknown): DeployLag {
  const record = isRecord(body) ? body : {};
  const missingContractFields = contractReadinessFields.filter((field) => !(field in record));
  const missingRequired = Array.isArray(record.missingRequired)
    ? record.missingRequired.filter((item): item is string => typeof item === "string")
    : [];
  return {
    deployLag: missingContractFields.length > 0,
    missingContractFields: [...missingContractFields],
    ownerGateOpen: missingRequired.length > 0 || record.status !== "ready",
    countsAsProof: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
