/**
 * Host posture pin for the 14:00 EDT 2026-10-08 portfolio probe.
 * Pure classifier. Does not call hosts, invent secrets, or merge pull requests.
 */

export const POSTURE_REVISION = "2026-10-08-1400-host-posture";
export const CONDUIT_CONTRACT = "2026-10-03-ready-surface";
export const OWNER_SECRET = "SUPABASE_SERVICE_ROLE_KEY";
export const KEEP_RED_PULLS = [119, 120, 155, 162] as const;

export type HostName = "conduit" | "resonance" | "vercel";
export type HostClass = "ready" | "owner_gate" | "alias_absent" | "drift";

export type ObservedHost = {
  name: HostName;
  httpStatus: number;
  body: Record<string, unknown>;
  vercelError?: string;
};

export type OpenPull = { repo: string; number: number; title: string };

export type HostPosture = {
  revision: string;
  classes: Record<HostName, HostClass>;
  pinHolds: boolean;
  admitNewWitness: boolean;
  keepRed: number[];
  reason: string;
};

const OMITTED = ["ownerActionRequired", "contractRevision"] as const;

export function classifyHost(host: ObservedHost): HostClass {
  if (host.name === "vercel") {
    if (host.httpStatus === 404 && host.vercelError === "DEPLOYMENT_NOT_FOUND") return "alias_absent";
    return "drift";
  }
  if (host.name === "conduit") {
    if (host.httpStatus === 200 && host.body.status === "ready" && host.body.version === "0.8.0" && host.body.contractRevision === CONDUIT_CONTRACT && host.body.persistence === "postgres") return "ready";
    return "drift";
  }
  const missing = host.body.missingRequired;
  const exactMissing = Array.isArray(missing) && missing.length === 1 && missing[0] === OWNER_SECRET;
  const omitted = OMITTED.every((key) => !Object.prototype.hasOwnProperty.call(host.body, key));
  if (host.httpStatus === 503 && exactMissing && omitted && host.body.authModeOk === true) return "owner_gate";
  return "drift";
}

export function decidePosture(hosts: ObservedHost[], openPulls: OpenPull[]): HostPosture {
  const classes = {
    conduit: classifyHost(required(hosts, "conduit")),
    resonance: classifyHost(required(hosts, "resonance")),
    vercel: classifyHost(required(hosts, "vercel")),
  };
  const pinHolds = classes.conduit === "ready" && classes.resonance === "owner_gate" && classes.vercel === "alias_absent";
  const latticeOpen = openPulls.some((pull) => pull.title.toLowerCase().includes("cutover lattice"));
  return {
    revision: POSTURE_REVISION,
    classes,
    pinHolds,
    admitNewWitness: !(pinHolds && latticeOpen),
    keepRed: openPulls.filter((pull) => (KEEP_RED_PULLS as readonly number[]).includes(pull.number)).map((pull) => pull.number),
    reason: pinHolds
      ? latticeOpen
        ? "Live pin holds and a cutover lattice pull request is open. Refuse a new witness. Do not merge keep-red TLS drafts."
        : "Live pin holds. Owner gate remains owner-only. Do not invent SUPABASE_SERVICE_ROLE_KEY."
      : "Live pin drifted. Do not treat the drift as a closed owner gate.",
  };
}

function required(hosts: ObservedHost[], name: HostName): ObservedHost {
  return hosts.find((host) => host.name === name) ?? { name, httpStatus: 0, body: {} };
}
