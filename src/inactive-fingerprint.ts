/**
 * Inactive-fingerprint fence. 18:00 EDT 2026-10-09.
 *
 * A guessed host that answers 200 is not ours. A known stranger title or
 * analytics id beats a spoofed portfolio marker. An INACTIVE Supabase project
 * is not persistence. This module does not fetch, invent secrets, merge
 * pulls, or delete refs.
 */

export const INACTIVE_FINGERPRINT_REVISION = "2026-10-09-inactive-fingerprint";

export const KNOWN_STRANGER_TITLES = ["detail framework", "canawan", "data-cruncher"] as const;
export const KNOWN_STRANGER_ANALYTICS = ["UA-160004791-1"] as const;

const OWNED_MARKERS = ["resonance-nexus", "quicksilverv1"] as const;

export type FingerprintClass = "alias_absent" | "stranger_occupant" | "alias_owned" | "unclassified";

export type HostProbe = {
  host: string;
  status: number;
  body: string;
};

export function classifyFingerprint(probe: HostProbe): {
  revision: string;
  host: string;
  classification: FingerprintClass;
  spoofedMarker: boolean;
  phaseAdmitted: false;
} {
  const body = probe.body ?? "";
  const lower = body.toLowerCase();
  const strangerHit =
    KNOWN_STRANGER_TITLES.some((title) => lower.includes(title)) ||
    KNOWN_STRANGER_ANALYTICS.some((id) => body.includes(id));
  const ownedMarker = OWNED_MARKERS.some((marker) => lower.includes(marker));
  const absent = probe.status === 404 && body.includes("DEPLOYMENT_NOT_FOUND");
  const html = /<!doctype|<html/i.test(body);

  let classification: FingerprintClass = "unclassified";
  if (absent) classification = "alias_absent";
  else if (strangerHit) classification = "stranger_occupant";
  else if (probe.status === 200 && ownedMarker) classification = "alias_owned";
  else if (probe.status === 200 && html) classification = "stranger_occupant";

  return {
    revision: INACTIVE_FINGERPRINT_REVISION,
    host: probe.host,
    classification,
    spoofedMarker: strangerHit && ownedMarker,
    phaseAdmitted: false,
  };
}

export function classifyPersistence(projects: readonly { name: string; status: string }[]): {
  revision: string;
  inactiveNames: string[];
  persistenceProof: false;
  phaseAdmitted: false;
} {
  const inactiveNames = projects.filter((project) => project.status === "INACTIVE").map((project) => project.name);
  return {
    revision: INACTIVE_FINGERPRINT_REVISION,
    inactiveNames,
    persistenceProof: false,
    phaseAdmitted: false,
  };
}

export function classifyPass(probe: {
  missingRequired: readonly string[];
  projects: readonly { status: string }[];
  deviceRecorded: boolean;
}): {
  revision: string;
  classification: "owner_blocked";
  evidenceOnly: true;
  highestAdmittedPhase: 0;
  phaseAdmitted: false;
  bindingConstraint: string;
} {
  const missingKey = probe.missingRequired.length === 1 && probe.missingRequired[0] === "SUPABASE_SERVICE_ROLE_KEY";
  const inactive = probe.projects.some((project) => project.status === "INACTIVE");
  const device = probe.deviceRecorded ? "device recorded" : "device HG unrecorded";
  const bindingConstraint =
    missingKey && inactive
      ? `Resonance owner secret missing, Supabase projects inactive, ${device}`
      : `owner gate unverified, ${device}`;
  return {
    revision: INACTIVE_FINGERPRINT_REVISION,
    classification: "owner_blocked",
    evidenceOnly: true,
    highestAdmittedPhase: 0,
    phaseAdmitted: false,
    bindingConstraint,
  };
}
