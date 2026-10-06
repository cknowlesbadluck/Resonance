/**
 * Executable 10-phase portfolio ledger.
 * A phase is not done because a document says so.
 * Advance only when the exit probe matches. Never invent a secret.
 */

export const OWNER_SECRET = "SUPABASE_SERVICE_ROLE_KEY";
export const KEEP_RED = [119, 120, 155, 162] as const;
export const CONTRACT_REVISION = "2026-10-03-ready-surface";

export type PhaseId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type PhaseName =
  | "stabilize_hosts"
  | "owner_ready_gate"
  | "collapse_witness_pile"
  | "postgres_tls_hold"
  | "resonance_capability_plane"
  | "ios_device_gate"
  | "prune_legacy_twin"
  | "chamber_lifecycle"
  | "observability"
  | "release_lock";

export type HostProbe = {
  service: "conduit" | "resonance" | "quicksilver" | "vercel_alias";
  httpStatus: number;
  missingRequired?: string[];
  persistence?: string;
  contractRevision?: string;
  bodyHasOwnerAction?: boolean;
  alias?: "absent" | "present";
};

export type OpenPull = {
  repo: string;
  number: number;
  title: string;
  draft: boolean;
  doNotMerge: boolean;
};

export type PullClass = "keep_red" | "refresh_in_place" | "collapse_candidate" | "owner_blocked" | "product";

export type LedgerState = {
  phase: PhaseId;
  name: PhaseName;
  advanced: boolean;
  reason: string;
};

const ORDER: PhaseName[] = [
  "stabilize_hosts",
  "owner_ready_gate",
  "collapse_witness_pile",
  "postgres_tls_hold",
  "resonance_capability_plane",
  "ios_device_gate",
  "prune_legacy_twin",
  "chamber_lifecycle",
  "observability",
  "release_lock",
];

export function phaseName(id: PhaseId): PhaseName {
  return ORDER[id];
}

export function classifyPull(pull: OpenPull): PullClass {
  if (pull.doNotMerge || KEEP_RED.includes(pull.number as (typeof KEEP_RED)[number])) return "keep_red";
  if (/DO NOT MERGE|KEEP RED/i.test(pull.title)) return "keep_red";
  if (/^⚡ Bolt:|bolt\//i.test(pull.title)) return "collapse_candidate";
  if (/dependabot|bump actions/i.test(pull.title)) return "collapse_candidate";
  if (/degrade planner|admission|phase clock|witness|roadmap/i.test(pull.title)) return "refresh_in_place";
  if (/SUPABASE_SERVICE_ROLE_KEY|service role/i.test(pull.title)) return "owner_blocked";
  return "product";
}

export function classifyAlias(probe: HostProbe | undefined): "alias_absent" | "alias_present" | "unknown" {
  if (!probe) return "unknown";
  if (probe.httpStatus === 404 && probe.alias === "absent") return "alias_absent";
  if (probe.httpStatus === 404 && /DEPLOYMENT_NOT_FOUND/i.test(probe.contractRevision ?? "")) return "alias_absent";
  if (probe.alias === "present") return "alias_present";
  return "unknown";
}

function conduitStable(probes: HostProbe[]): boolean {
  const conduit = probes.find((p) => p.service === "conduit");
  return Boolean(
    conduit &&
      conduit.httpStatus === 200 &&
      conduit.persistence === "postgres" &&
      conduit.contractRevision === CONTRACT_REVISION,
  );
}

function ownerBlocked(probes: HostProbe[]): boolean {
  const resonance = probes.find((p) => p.service === "resonance");
  return Boolean(resonance?.missingRequired?.includes(OWNER_SECRET));
}

function readyIsPublic(probes: HostProbe[]): boolean {
  const resonance = probes.find((p) => p.service === "resonance");
  return Boolean(
    resonance &&
      resonance.httpStatus === 200 &&
      (resonance.missingRequired?.length ?? 0) === 0 &&
      resonance.bodyHasOwnerAction !== true,
  );
}

/**
 * Advance one step. Refuses to skip the owner gate or to treat a 404 alias
 * as the service-role gate. Collapse candidates are named, never auto-closed.
 */
export function advanceLedger(input: {
  probes: HostProbe[];
  pulls: OpenPull[];
  deviceHgPassed?: boolean;
  legacyArchived?: boolean;
  tlsEnvSet?: boolean;
  capabilityPlaneShipped?: boolean;
  chamberLifecycleShipped?: boolean;
  observabilityShipped?: boolean;
}): LedgerState {
  const probes = input.probes;
  if (!conduitStable(probes)) {
    return { phase: 0, name: "stabilize_hosts", advanced: false, reason: "Conduit /ready is not postgres 0.8.0 with the ready-surface stamp." };
  }
  if (ownerBlocked(probes) || !readyIsPublic(probes)) {
    const alias = classifyAlias(probes.find((p) => p.service === "vercel_alias"));
    const aliasNote = alias === "alias_absent" ? " Vercel alias is absent, not the owner gate." : "";
    return {
      phase: 1,
      name: "owner_ready_gate",
      advanced: false,
      reason: `Resonance /api/ready is blocked on ${OWNER_SECRET}. Do not invent it.${aliasNote}`,
    };
  }
  const witnesses = input.pulls.filter((p) => classifyPull(p) === "refresh_in_place");
  if (witnesses.length > 0) {
    return {
      phase: 2,
      name: "collapse_witness_pile",
      advanced: false,
      reason: witnesses.length === 1
        ? `Open witness ${witnesses[0].repo}#${witnesses[0].number} must be refreshed in place. Do not stack another.`
        : `Witness pile still open: ${witnesses.map((p) => p.repo + "#" + p.number).join(", ")}. Refresh in place. Do not stack.`,
    };
  }
  const keepRed = input.pulls.filter((p) => classifyPull(p) === "keep_red");
  if (keepRed.length > 0 && !input.tlsEnvSet) {
    return {
      phase: 3,
      name: "postgres_tls_hold",
      advanced: false,
      reason: `KEEP RED stays unmerged (${keepRed.map((p) => "#" + p.number).join(", ")}) until the named TLS env exists.`,
    };
  }
  if (!input.capabilityPlaneShipped) {
    return { phase: 4, name: "resonance_capability_plane", advanced: false, reason: "Capability plane is still in progress. Do not call the Nexus finished." };
  }
  if (!input.deviceHgPassed) {
    return { phase: 5, name: "ios_device_gate", advanced: false, reason: "Simulator CI is not the iPhone 16e device HG gate." };
  }
  if (!input.legacyArchived) {
    return { phase: 6, name: "prune_legacy_twin", advanced: false, reason: "Legacy cknowlesbadluck/Quicksilver is still a live twin. Archive is an owner action." };
  }
  if (!input.chamberLifecycleShipped) {
    return { phase: 7, name: "chamber_lifecycle", advanced: false, reason: "Agenda-driven Chamber lifecycle is not shipped." };
  }
  if (!input.observabilityShipped) {
    return { phase: 8, name: "observability", advanced: false, reason: "No durable trace from probe to task completion." };
  }
  return { phase: 9, name: "release_lock", advanced: true, reason: "Hosts, owner gate, device HG, and prune all match. Release lock is allowed." };
}
