export function classifyPublicReady(body: unknown): {
  deployLag: boolean;
  missingContractFields: string[];
  ownerGateOpen: boolean;
  expectedContractRevision: string;
  liveContractRevision: string | null;
  countsAsProof: false;
};
export function classifyProbeSurface(input: {
  url: string;
  httpStatus: number;
  bodyText: string;
  json: unknown;
}): {
  kind: string;
  aliasAbsent: boolean;
  deployLag: boolean;
  ownerGateOpen: boolean;
  countsAsProof: false;
  note?: string;
};
