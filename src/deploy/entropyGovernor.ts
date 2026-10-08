/**
 * Portfolio entropy governor for the Resonance public host.
 * A classifier is not a deploy. Do not invent SUPABASE_SERVICE_ROLE_KEY.
 */

export const HEALTH_CONTRACT_REVISION = "2026-10-03-ready-surface";
export const OWNER_SECRET = "SUPABASE_SERVICE_ROLE_KEY";
export const WITNESS_BUDGET = 2;

export type ProbeName = "conduit_health" | "conduit_ready" | "resonance_ready" | "vercel_alias";
export type ProbeClass =
  | "conduit_ready"
  | "resonance_owner_gate"
  | "alias_absent"
  | "contract_leak"
  | "unexpected";
export type AdmissionKind = "witness" | "implementation" | "owner";

export function classifyProbe(name: ProbeName, status: number, body: Record<string, unknown>): ProbeClass {
  if (name === "vercel_alias") {
    return status === 404 && body.vercelError === "DEPLOYMENT_NOT_FOUND" ? "alias_absent" : "unexpected";
  }
  if (name === "resonance_ready" && ("ownerActionRequired" in body || "contractRevision" in body)) {
    return "contract_leak";
  }
  if (name === "conduit_health" || name === "conduit_ready") {
    const ok =
      status === 200 &&
      body.version === "0.8.0" &&
      body.contractRevision === HEALTH_CONTRACT_REVISION &&
      (name === "conduit_health" || body.persistence === "postgres");
    return ok ? "conduit_ready" : "unexpected";
  }
  const missing = body.missingRequired;
  const ownerGate =
    status === 503 &&
    Array.isArray(missing) &&
    missing.length === 1 &&
    missing[0] === OWNER_SECRET;
  return ownerGate ? "resonance_owner_gate" : "unexpected";
}

export function admitWork(input: { kind: AdmissionKind; openWitnessPulls: number }): {
  admit: boolean;
  reason: "owner_action_is_not_an_agent_pr" | "witness_budget_spent" | "implementation_allowed";
} {
  if (input.kind === "owner") return { admit: false, reason: "owner_action_is_not_an_agent_pr" };
  if (input.kind === "witness" && input.openWitnessPulls >= WITNESS_BUDGET) {
    return { admit: false, reason: "witness_budget_spent" };
  }
  return { admit: true, reason: "implementation_allowed" };
}

export function bindingConstraint(classes: ProbeClass[]): "owner_secret" | "alias_absent" | "contract_leak" | "none" {
  if (classes.includes("contract_leak")) return "contract_leak";
  if (classes.includes("resonance_owner_gate")) return "owner_secret";
  if (classes.includes("alias_absent")) return "alias_absent";
  return "none";
}
