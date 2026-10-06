/**
 * Executable 10-phase exit ledger. A unit result is not production proof.
 * Owner secrets are never accepted as input.
 */

export type PhaseState = "met" | "blocked" | "open" | "not_agent_work";

export type ProbeFacts = {
  conduitReady: boolean;
  conduitContractAligned: boolean;
  publicReadyStatus: number | null;
  publicMissingRequired: string[];
  publicHasContractRevision: boolean;
  publicHasOwnerActionRequired: boolean;
  aliasKind: "alias_absent" | "other";
  openRedDrafts: number;
  legacyArchiveStatus: number | null;
};

export type PhaseExit = {
  id: number;
  name: string;
  state: PhaseState;
  exit: string;
};

const OWNER_KEY = "SUPABASE_SERVICE_ROLE_KEY";

export function evaluatePhaseLedger(facts: ProbeFacts): PhaseExit[] {
  const ownerBlocked =
    facts.publicReadyStatus === 503 &&
    facts.publicMissingRequired.length === 1 &&
    facts.publicMissingRequired[0] === OWNER_KEY;
  const contractOnHost =
    facts.publicHasContractRevision && facts.publicHasOwnerActionRequired;
  return [
    {
      id: 1,
      name: "Owner gate",
      state: ownerBlocked ? "not_agent_work" : facts.publicReadyStatus === 200 ? "met" : "blocked",
      exit: "Public /api/ready is 200 without an invented secret.",
    },
    {
      id: 2,
      name: "Kill split-brain deploy",
      state: facts.aliasKind === "alias_absent" && !contractOnHost ? "blocked" : contractOnHost ? "met" : "open",
      exit: "Public Netlify body carries contractRevision. Vercel 404 is alias_absent, not the gate.",
    },
    {
      id: 3,
      name: "Conduit contract parity",
      state: facts.conduitReady && facts.conduitContractAligned ? "met" : "blocked",
      exit: "/health and /ready share version and contractRevision on the live host.",
    },
    {
      id: 4,
      name: "Quicksilver gateway router",
      state: "open",
      exit: "M3-T20 merges only after simulator build and UI smoke are green.",
    },
    {
      id: 5,
      name: "Persistence proof",
      state: facts.publicReadyStatus === 200 ? "open" : "blocked",
      exit: "Production smoke passes on resonancenexus, not a Vercel alias.",
    },
    {
      id: 6,
      name: "Chamber fail-closed",
      state: "open",
      exit: "Execution stays denied when a capability is not executable.",
    },
    {
      id: 7,
      name: "Hygiene prune",
      state: facts.openRedDrafts === 0 && facts.legacyArchiveStatus === 200 ? "met" : "open",
      exit: "Red drafts stay unmerged. Legacy twin archived when the token can.",
    },
    {
      id: 8,
      name: "One iOS target",
      state: "open",
      exit: "#134 rebases onto main and builds, or it is closed. No second client.",
    },
    {
      id: 9,
      name: "Grants deny-by-default",
      state: facts.conduitReady ? "open" : "blocked",
      exit: "Resource records hold no secrets. Grant tests stay green.",
    },
    {
      id: 10,
      name: "Cross-plane acceptance",
      state:
        facts.conduitReady && facts.publicReadyStatus === 200 && contractOnHost ? "open" : "blocked",
      exit: "One live probe covers Conduit ready, public Resonance ready, and Quicksilver posture.",
    },
  ];
}
