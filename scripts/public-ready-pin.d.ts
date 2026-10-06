/** Ambient types for the public-host pin script. The .mjs stays the runtime source. */
export function hostname(url: string): string;

export function classifyPublicReady(body: unknown): {
  deployLag: boolean;
  missingContractFields: string[];
  ownerGateOpen: boolean;
  expectedContractRevision: string;
  liveContractRevision: string | null;
  countsAsProof: boolean;
};

export function classifyProbeSurface(input: {
  url: string;
  httpStatus: number;
  bodyText: string;
  json: unknown;
}): {
  kind: "alias_absent" | "deploy_lag" | "owner_gate" | "ready_unproven";
  aliasAbsent: boolean;
  deployLag: boolean;
  missingContractFields: string[];
  ownerGateOpen: boolean;
  expectedContractRevision: string;
  liveContractRevision: string | null;
  countsAsProof: boolean;
  note: string;
};
