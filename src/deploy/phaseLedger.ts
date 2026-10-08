/**
 * Executable 10-phase portfolio ledger for the Resonance host.
 * Does not invent SUPABASE_SERVICE_ROLE_KEY. A ledger is not a deploy.
 */

export const OWNER_SECRET = "SUPABASE_SERVICE_ROLE_KEY";

export type PhaseState = "met" | "owner_blocked" | "open" | "refused";

export type Phase = { id: number; name: string; state: PhaseState; exit: string };

export type Snapshot = {
  conduitReady: boolean;
  resonanceStatus: number;
  resonanceMissing: string[];
  resonanceLeaksContract: boolean;
  vercelAliasAbsent: boolean;
  witnessBudgetSpent: boolean;
  hardwareRunRecorded: boolean;
};

export function evaluatePhases(snapshot: Snapshot): Phase[] {
  const ownerBlocked =
    snapshot.resonanceStatus === 503 &&
    snapshot.resonanceMissing.length === 1 &&
    snapshot.resonanceMissing[0] === OWNER_SECRET &&
    !snapshot.resonanceLeaksContract;
  return [
    { id: 1, name: "Owner gate", state: ownerBlocked ? "owner_blocked" : "open", exit: "public /api/ready 200" },
    { id: 2, name: "Deploy-lag kill", state: snapshot.vercelAliasAbsent ? "open" : "met", exit: "canonical host carries contractRevision" },
    { id: 3, name: "Entropy governor", state: snapshot.witnessBudgetSpent ? "met" : "open", exit: "witness budget refuses a third status pull" },
    { id: 4, name: "Collapse planners", state: "open", exit: "one squash or explicit close; no red CI merged" },
    { id: 5, name: "Device fence", state: snapshot.hardwareRunRecorded ? "met" : "owner_blocked", exit: "iPhone 16e hardware run" },
    { id: 6, name: "Chamber fail-closed", state: "open", exit: "non-executable capability stays denied" },
    { id: 7, name: "Hygiene prune", state: "open", exit: "no new witness pull; orphan fences deleted" },
    { id: 8, name: "Single iOS peer", state: "open", exit: "one client after phase 1" },
    { id: 9, name: "Grants deny-by-default", state: "refused", exit: "no secret in a resource record" },
    { id: 10, name: "Cross-plane acceptance", state: snapshot.conduitReady && snapshot.resonanceStatus === 200 ? "met" : "open", exit: "production ready 200, not a unit test" },
  ];
}

export function bindingPhase(phases: Phase[]): number {
  return phases.find((phase) => phase.state === "owner_blocked")?.id ?? 0;
}
