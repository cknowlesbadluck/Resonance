import { describe, expect, it } from "vitest";
// @ts-expect-error untyped .mjs helper shared with scripts/vercel-alias-drift.mjs
import { classifyAlias } from "./aliasDrift.mjs";

const ready = (extra: object) => JSON.stringify({ service: "resonance-nexus", status: "not_ready", ...extra });

describe("classifyAlias", () => {
  it("flags Vercel DEPLOYMENT_NOT_FOUND as alias_absent", () => {
    expect(classifyAlias({ status: 404, body: "The deployment could not be found on Vercel.\n\nDEPLOYMENT_NOT_FOUND" })).toEqual({ outcome: "alias_absent", drift: true });
  });
  it("flags Vercel JSON 404 as alias_absent", () => {
    expect(classifyAlias({ status: 404, contentType: "application/json", body: '{"error": {"code": "404", "message": "The deployment could not be found on Vercel."}}' }).outcome).toBe("alias_absent");
  });
  it("flags HTML or foreign JSON as stranger_occupant", () => {
    expect(classifyAlias({ status: 200, contentType: "text/html", body: "<!DOCTYPE html>" }).outcome).toBe("stranger_occupant");
    expect(classifyAlias({ status: 200, contentType: "application/json", body: '{"service":"other"}' }).outcome).toBe("stranger_occupant");
  });
  it("treats 5xx non-resonance as unreachable", () => {
    expect(classifyAlias({ status: 502, body: "bad gateway" }).outcome).toBe("unreachable");
  });
  it("compares commitSha to main", () => {
    expect(classifyAlias({ status: 503, contentType: "application/json", body: ready({ commitSha: "9422def" }) }, "9422def2b106").outcome).toBe("resonance_at_main");
    expect(classifyAlias({ status: 503, contentType: "application/json", body: ready({ commitSha: "abc1234" }) }, "9422def2b106")).toEqual({ outcome: "resonance_stale", drift: true });
    expect(classifyAlias({ status: 503, contentType: "application/json", body: ready({}) }, "9422def")).toEqual({ outcome: "resonance_unstamped", drift: null });
    expect(classifyAlias({ status: 503, contentType: "application/json", body: ready({ commitSha: "unknown" }) }, "9422def").drift).toBeNull();
  });
  it("reports a missing main SHA as comparison_unavailable, never as clean", () => {
    expect(classifyAlias({ status: 503, contentType: "application/json", body: ready({ commitSha: "9422def" }) }, null)).toEqual({ outcome: "comparison_unavailable", drift: null });
  });
});
