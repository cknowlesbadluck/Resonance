import { describe, expect, it } from "vitest";
import { KEEP_RED_PULLS, classifyHost, decidePosture, type ObservedHost, type OpenPull } from "./host-posture";

const live: ObservedHost[] = [
  { name: "conduit", httpStatus: 200, body: { status: "ready", version: "0.8.0", contractRevision: "2026-10-03-ready-surface", persistence: "postgres" } },
  { name: "resonance", httpStatus: 503, body: { authModeOk: true, missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"], timestamp: "2026-10-08T18:01:50.291Z" } },
  { name: "vercel", httpStatus: 404, body: {}, vercelError: "DEPLOYMENT_NOT_FOUND" },
];

const open: OpenPull[] = [
  { repo: "Resonance", number: 154, title: "feat: portfolio cutover lattice" },
  { repo: "Conduit", number: 162, title: "tls" },
  { repo: "Conduit", number: 155, title: "tls" },
  { repo: "Conduit", number: 119, title: "keep red" },
  { repo: "Conduit", number: 120, title: "keep red" },
];

describe("14:00 host posture", () => {
  it("pins live hosts and refuses a new witness", () => {
    expect(classifyHost(live[0])).toBe("ready");
    expect(classifyHost(live[1])).toBe("owner_gate");
    expect(classifyHost(live[2])).toBe("alias_absent");
    const decision = decidePosture(live, open);
    expect(decision.pinHolds).toBe(true);
    expect(decision.admitNewWitness).toBe(false);
    expect(decision.keepRed).toEqual([162, 155, 119, 120]);
  });

  it("treats a leaked contractRevision as drift", () => {
    const drifted = live.map((host) => host.name === "resonance" ? { ...host, body: { ...host.body, contractRevision: "leaked" } } : host);
    expect(decidePosture(drifted, open).pinHolds).toBe(false);
  });

  it("does not treat extra missing keys as the owner gate", () => {
    const extra = live.map((host) => host.name === "resonance" ? { ...host, body: { ...host.body, missingRequired: ["SUPABASE_SERVICE_ROLE_KEY", "OTHER"] } } : host);
    expect(classifyHost(extra[1])).toBe("drift");
    expect([...KEEP_RED_PULLS]).toEqual([119, 120, 155, 162]);
  });
});
