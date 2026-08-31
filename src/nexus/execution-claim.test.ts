import { describe, expect, it } from "vitest";
import {
  STALE_ACCEPTED_MS,
  decideInitiationReclaim,
  decideResumeClaim,
  exclusiveResume,
  InMemoryRequestRow,
  isStaleAccepted,
} from "./execution-claim";

describe("isStaleAccepted", () => {
  it("is true only for accepted rows older than the stale window", () => {
    const now = Date.parse("2026-08-31T04:00:00.000Z");
    expect(isStaleAccepted("accepted", new Date(now - STALE_ACCEPTED_MS - 1).toISOString(), now)).toBe(true);
    expect(isStaleAccepted("accepted", new Date(now - STALE_ACCEPTED_MS + 1).toISOString(), now)).toBe(false);
    expect(isStaleAccepted("executing", new Date(now - STALE_ACCEPTED_MS * 3).toISOString(), now)).toBe(false);
    expect(isStaleAccepted("waiting", new Date(now - STALE_ACCEPTED_MS * 3).toISOString(), now)).toBe(false);
  });
});

describe("decideResumeClaim", () => {
  const now = Date.parse("2026-08-31T04:00:00.000Z");

  it("claims waiting without a stale cutoff", () => {
    expect(decideResumeClaim("waiting", new Date(now).toISOString(), now)).toEqual({
      ok: true,
      from: "waiting",
      requireStale: false,
    });
  });

  it("reclaims stale accepted and rejects fresh accepted", () => {
    expect(decideResumeClaim("accepted", new Date(now - STALE_ACCEPTED_MS - 1).toISOString(), now)).toEqual({
      ok: true,
      from: "accepted",
      requireStale: true,
    });
    const fresh = decideResumeClaim("accepted", new Date(now - 1_000).toISOString(), now);
    expect(fresh.ok).toBe(false);
    if (!fresh.ok) expect(fresh.status).toBe(409);
  });

  it("never reclaims executing, even when updated_at is stale", () => {
    const decision = decideResumeClaim("executing", new Date(now - STALE_ACCEPTED_MS * 3).toISOString(), now);
    expect(decision).toEqual({
      ok: false,
      status: 409,
      error: "Execution request is already executing.",
    });
    expect(decideInitiationReclaim("executing", new Date(now - STALE_ACCEPTED_MS * 3).toISOString(), now)).toBe(false);
  });
});

describe("exclusive resume claim (CHR-51)", () => {
  it("runs the executor exactly once when two resumes race a stale-accepted row", async () => {
    const now = Date.now();
    const row = new InMemoryRequestRow("accepted", now - STALE_ACCEPTED_MS - 1);
    let invocations = 0;
    const execute = async () => {
      invocations += 1;
    };

    const [first, second] = await Promise.all([
      exclusiveResume(row, execute, now),
      exclusiveResume(row, execute, now),
    ]);

    expect(first).not.toBe(second);
    expect(invocations).toBe(1);
    expect(row.status).toBe("executing");
  });

  it("runs the executor exactly once when two resumes race a waiting row", async () => {
    const now = Date.now();
    const row = new InMemoryRequestRow("waiting", now);
    let invocations = 0;

    const results = await Promise.all([
      exclusiveResume(row, () => {
        invocations += 1;
      }, now),
      exclusiveResume(row, () => {
        invocations += 1;
      }, now),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(invocations).toBe(1);
  });

  it("does not invoke the executor for a stale executing row", async () => {
    const now = Date.now();
    const row = new InMemoryRequestRow("executing", now - STALE_ACCEPTED_MS * 3);
    let invocations = 0;
    const won = await exclusiveResume(row, () => {
      invocations += 1;
    }, now);
    expect(won).toBe(false);
    expect(invocations).toBe(0);
    expect(row.status).toBe("executing");
  });
});
