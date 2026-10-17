import { describe, expect, it } from "vitest";
import { MAX_RESUME_BODY_BYTES, RESUME_STALE_MS, isValidResumeId, parseResumeBody, resumeEligibility } from "./resume-guard";

const PROJECT = "11111111-1111-4111-8111-111111111111";
const NOW = Date.parse("2026-10-17T04:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const stored = { intent: { id: "i1", objective: "x" }, plan: { steps: [] }, status: "approval_required" };

describe("parseResumeBody", () => {
  it("accepts an empty body as {}", () => {
    expect(parseResumeBody("")).toEqual({ ok: true, body: {} });
  });
  it("accepts a valid body", () => {
    expect(parseResumeBody(JSON.stringify({ projectId: PROJECT, approved: true }))).toEqual({ ok: true, body: { projectId: PROJECT, approved: true } });
  });
  it("rejects malformed JSON instead of silently treating it as {}", () => {
    expect(parseResumeBody("{not json")).toEqual({ ok: false, error: "Invalid JSON body." });
  });
  it("rejects non-object bodies", () => {
    expect(parseResumeBody("[]").ok).toBe(false);
    expect(parseResumeBody("null").ok).toBe(false);
    expect(parseResumeBody("\"approved\"").ok).toBe(false);
  });
  it("rejects a non-UUID projectId", () => {
    expect(parseResumeBody(JSON.stringify({ projectId: "'; drop table x; --", approved: true }))).toEqual({ ok: false, error: "projectId must be a UUID." });
  });
  it("rejects truthy-but-not-boolean approval", () => {
    for (const approved of ["true", 1, {}, null]) {
      expect(parseResumeBody(JSON.stringify({ projectId: PROJECT, approved }))).toEqual({ ok: false, error: "approved must be a boolean." });
    }
  });
  it("rejects bodies over the byte limit (multi-byte aware)", () => {
    const big = JSON.stringify({ approved: true, pad: "é".repeat(MAX_RESUME_BODY_BYTES / 2 + 1) });
    expect(parseResumeBody(big)).toEqual({ ok: false, error: "Request body exceeds the 16 KiB limit." });
  });
});

describe("isValidResumeId", () => {
  it("accepts ordinary keys and UUIDs", () => {
    expect(isValidResumeId("sprint-key-1")).toBe(true);
    expect(isValidResumeId(PROJECT)).toBe(true);
  });
  it("rejects empty, oversized and control-character ids", () => {
    expect(isValidResumeId("")).toBe(false);
    expect(isValidResumeId("a".repeat(129))).toBe(false);
    expect(isValidResumeId("a\nb")).toBe(false);
    expect(isValidResumeId(undefined)).toBe(false);
  });
});

describe("resumeEligibility", () => {
  it("allows a waiting request with a stored approval intent", () => {
    expect(resumeEligibility({ status: "waiting", updated_at: ago(1000), response: stored }, NOW)).toEqual({ ok: true, stuck: false });
  });
  it("refuses a waiting request without a stored intent (404, no claim)", () => {
    expect(resumeEligibility({ status: "waiting", updated_at: ago(1000), response: null }, NOW)).toMatchObject({ ok: false, status: 404 });
  });
  it("refuses a fresh accepted request", () => {
    expect(resumeEligibility({ status: "accepted", updated_at: ago(1000), response: stored }, NOW)).toMatchObject({ ok: false, status: 409 });
  });
  it("reclaims a stale accepted resume that carries a stored approval intent", () => {
    expect(resumeEligibility({ status: "accepted", updated_at: ago(RESUME_STALE_MS + 1), response: stored }, NOW)).toEqual({ ok: true, stuck: true });
  });
  it("never claims a stale accepted plain execution (no stored response) — it must not be clobbered to failed", () => {
    expect(resumeEligibility({ status: "accepted", updated_at: ago(RESUME_STALE_MS + 1), response: null }, NOW)).toMatchObject({ ok: false, status: 409 });
  });
  it("refuses terminal statuses", () => {
    for (const status of ["completed", "failed", "cancelled", "partial"]) {
      expect(resumeEligibility({ status, updated_at: ago(RESUME_STALE_MS * 10), response: stored }, NOW)).toMatchObject({ ok: false, status: 409 });
    }
  });
  it("treats a missing updated_at as not stale", () => {
    expect(resumeEligibility({ status: "accepted", updated_at: null, response: stored }, NOW)).toMatchObject({ ok: false, status: 409 });
  });
});
