/**
 * Saturation governor for the public host.
 * A classifier is not a deploy and not a secret.
 */

export type HostProbe = {
  httpStatus: number;
  body?: unknown;
};

export type OpenRecord = {
  number: number;
  title: string;
  draft?: boolean;
};

export type GovernorDecision = {
  mutation: "refresh_in_place" | "close_noise" | "owner_only" | "hold";
  openNewPullRequest: false;
  closeNumbers: number[];
  holdNumbers: number[];
  reason: string;
};

const KEEP_RED = /do not merge|keep red|draft keep red/i;
const NOISE = /^\s*(?:⚡\s*)?Bolt\b/i;

function text(body: unknown): string {
  if (typeof body === "string") return body.slice(0, 2000);
  if (body == null) return "";
  try {
    return JSON.stringify(body).slice(0, 2000);
  } catch {
    return "";
  }
}

function ownerBlocked(probe: HostProbe | undefined): boolean {
  if (!probe) return false;
  const record = probe.body && typeof probe.body === "object" && !Array.isArray(probe.body) ? (probe.body as Record<string, unknown>) : undefined;
  const missing = Array.isArray(record?.missingRequired) ? record.missingRequired : [];
  return missing.length > 0 && (probe.httpStatus === 503 || probe.httpStatus === 424);
}

export function governSaturation(input: {
  product?: HostProbe;
  alias?: HostProbe;
  openRecords: OpenRecord[];
  keepRedNumbers?: number[];
  roadmapAlreadyOpen?: boolean;
}): GovernorDecision {
  const keepRed = input.keepRedNumbers ?? [];
  const holdNumbers = input.openRecords
    .filter((record) => record.draft || keepRed.includes(record.number) || KEEP_RED.test(record.title))
    .map((record) => record.number);
  const closeNumbers = input.openRecords
    .filter((record) => NOISE.test(record.title) && !holdNumbers.includes(record.number))
    .map((record) => record.number);
  const aliasAbsent = input.alias?.httpStatus === 404 && /DEPLOYMENT_NOT_FOUND/.test(text(input.alias.body));
  const blocked = ownerBlocked(input.product);
  if (blocked && input.roadmapAlreadyOpen) {
    return {
      mutation: closeNumbers.length > 0 ? "close_noise" : "refresh_in_place",
      openNewPullRequest: false,
      closeNumbers,
      holdNumbers,
      reason: aliasAbsent
        ? "owner secret blocks the public host; alias 404 is absence, not a deploy; refresh in place"
        : "owner secret blocks the public host; refresh the open roadmap",
    };
  }
  if (blocked) {
    return {
      mutation: "owner_only",
      openNewPullRequest: false,
      closeNumbers,
      holdNumbers,
      reason: "owner secret is missing; do not invent it",
    };
  }
  return {
    mutation: "hold",
    openNewPullRequest: false,
    closeNumbers,
    holdNumbers,
    reason: "no product probe; do not open a witness",
  };
}
