import { describe, expect, it } from "vitest";
import { NexusExecutor } from "./executor";
import type { NexusAdapter, InvocationResult } from "./adapters/types";
import type { NexusEvent, NexusExecutionPlan } from "./types";
import { sideEffectForGrants, classifyRetry, effectiveMaxAttempts, failureCodeOf, MAX_RETRY_ATTEMPTS, MAX_RETRY_DELAY_MS, retryAfterMsOf, retryDelayMs } from "./retry-policy";

const read = { sideEffect: false };
const write = { sideEffect: true };

describe("classifyRetry", () => {
  it.each(["invalid_input", "unsupported_capability", "unauthorized", "forbidden", "not_found", "malformed_response"])("never retries permanent code %s", (code) => {
    expect(classifyRetry(code, read, 1, 3)).toEqual({ retry: false, reason: "permanent" });
    expect(classifyRetry(code, write, 1, 3)).toEqual({ retry: false, reason: "permanent" });
  });

  it("retries rate_limited even on side-effecting steps (provider did not act)", () => {
    expect(classifyRetry("rate_limited", write, 1, 3)).toEqual({ retry: true, reason: "transient" });
  });

  it.each(["timeout", "unavailable"])("retries ambiguous %s only when the step is not side-effecting", (code) => {
    expect(classifyRetry(code, read, 1, 3)).toEqual({ retry: true, reason: "transient" });
    expect(classifyRetry(code, write, 1, 3)).toEqual({ retry: false, reason: "ambiguous_side_effect" });
  });

  it("keeps retrying unclassified failures (backwards compatible) and stops at the last attempt", () => {
    expect(classifyRetry(undefined, write, 1, 3)).toEqual({ retry: true, reason: "unclassified" });
    expect(classifyRetry(undefined, read, 3, 3)).toEqual({ retry: false, reason: "attempts_exhausted" });
  });
});

describe("sideEffectForGrants (single capability model)", () => {
  it("read/analyze-only or no grants are not side-effecting", () => {
    expect(sideEffectForGrants([])).toBe(false);
    expect(sideEffectForGrants(["read"])).toBe(false);
    expect(sideEffectForGrants(["read", "analyze"])).toBe(false);
  });
  it("modify and above, or any unrecognized grant, are side-effecting (fail closed)", () => {
    expect(sideEffectForGrants(["modify"])).toBe(true);
    expect(sideEffectForGrants(["read", "merge"])).toBe(true);
    expect(sideEffectForGrants(["definitely.not.a.grant"])).toBe(true);
  });
});

describe("bounds", () => {
  it("clamps attempts to [1, MAX_RETRY_ATTEMPTS] and rejects non-finite input", () => {
    expect(effectiveMaxAttempts({ maxAttempts: 1000, backoffMs: 0 })).toBe(MAX_RETRY_ATTEMPTS);
    expect(effectiveMaxAttempts({ maxAttempts: 0, backoffMs: 0 })).toBe(1);
    expect(effectiveMaxAttempts({ maxAttempts: Number.NaN, backoffMs: 0 })).toBe(1);
    expect(effectiveMaxAttempts({ maxAttempts: 2.9, backoffMs: 0 })).toBe(2);
  });

  it("linear backoff, capped, with a larger provider Retry-After winning", () => {
    expect(retryDelayMs({ maxAttempts: 3, backoffMs: 250 }, 2)).toBe(500);
    expect(retryDelayMs({ maxAttempts: 3, backoffMs: 250 }, 1, 5_000)).toBe(5_000);
    expect(retryDelayMs({ maxAttempts: 3, backoffMs: 10_000_000 }, 4)).toBe(MAX_RETRY_DELAY_MS);
    expect(retryDelayMs({ maxAttempts: 3, backoffMs: 0 }, 1, 10 ** 9)).toBe(MAX_RETRY_DELAY_MS);
    expect(retryDelayMs({ maxAttempts: 3, backoffMs: -5 }, 1)).toBe(0);
  });

  it("extracts only well-formed codes and retry-after hints", () => {
    expect(failureCodeOf({ provider: "github", code: "forbidden" })).toBe("forbidden");
    expect(failureCodeOf({ code: 42 })).toBeUndefined();
    expect(failureCodeOf("forbidden")).toBeUndefined();
    expect(failureCodeOf({ code: "x".repeat(65) })).toBeUndefined();
    expect(retryAfterMsOf({ retryAfterMs: 1500 })).toBe(1500);
    expect(retryAfterMsOf({ retryAfterMs: -1 })).toBeUndefined();
    expect(retryAfterMsOf({ retryAfterMs: "1500" })).toBeUndefined();
  });
});

const adapterFrom = (invoke: () => Promise<InvocationResult>): NexusAdapter & { calls: number } => {
  const wrapped = {
    id: "provider",
    kind: "test",
    calls: 0,
    async describe() { return { identity: { id: "provider", type: "connector" as const, name: "provider" }, capabilities: [] }; },
    async invoke() { wrapped.calls += 1; return invoke(); },
  };
  return wrapped;
};

const planFor = (sideEffect: boolean): NexusExecutionPlan => ({
  id: "plan",
  intentId: "intent",
  projectId: "project",
  actorId: "actor",
  mode: "direct",
  steps: [{ id: "step", capabilityId: "provider.capability", adapterId: "provider", input: {}, requiresApproval: false, sideEffect }],
  contextRefs: [],
  approvalRequired: false,
  rationale: [],
  retry: { maxAttempts: 3, backoffMs: 0 },
});

async function run(result: InvocationResult, sideEffect = false) {
  const adapter = adapterFrom(async () => result);
  const events: NexusEvent[] = [];
  const outcome = await new NexusExecutor([adapter], { recordEvidence: async () => undefined, recordEvent: async (event) => { events.push(event); } }).execute(planFor(sideEffect));
  return { adapter, events, outcome };
}

describe("NexusExecutor retry classification", () => {
  it("does not burn attempts on a permanent provider failure and records why", async () => {
    const { adapter, events, outcome } = await run({ ok: false, error: "nope", evidence: { provider: "github", code: "forbidden" } });
    expect(adapter.calls).toBe(1);
    expect(outcome.execution.status).not.toBe("completed");
    const skipped = events.find((event) => event.type === "execution.retry_skipped");
    expect(skipped?.payload).toMatchObject({ stepId: "step", attempt: 1, code: "forbidden", reason: "permanent" });
    expect(events.some((event) => event.type === "execution.retrying")).toBe(false);
  });

  it("does not blindly re-run a side-effecting step after an ambiguous timeout", async () => {
    const { adapter, events } = await run({ ok: false, error: "timed out", evidence: { provider: "linear", code: "timeout" } }, true);
    expect(adapter.calls).toBe(1);
    expect(events.find((event) => event.type === "execution.retry_skipped")?.payload).toMatchObject({ reason: "ambiguous_side_effect" });
  });

  it("retries rate_limited up to the policy limit with code and delay in the event", async () => {
    const { adapter, events } = await run({ ok: false, error: "slow down", evidence: { provider: "github", code: "rate_limited" } }, true);
    expect(adapter.calls).toBe(3);
    const retrying = events.filter((event) => event.type === "execution.retrying");
    expect(retrying).toHaveLength(2);
    expect(retrying[0].payload).toMatchObject({ code: "rate_limited", reason: "transient", delayMs: 0, nextAttempt: 2 });
    expect(events.some((event) => event.type === "execution.retry_skipped")).toBe(false);
  });

  it("classifies thrown errors carrying a code", async () => {
    const adapter = adapterFrom(async () => { throw Object.assign(new Error("bad input"), { code: "invalid_input" }); });
    await new NexusExecutor([adapter], { recordEvidence: async () => undefined }).execute(planFor(false));
    expect(adapter.calls).toBe(1);
  });

  it("still retries an ambiguous timeout on a read step", async () => {
    const { adapter } = await run({ ok: false, error: "timed out", evidence: { provider: "github", code: "timeout" } }, false);
    expect(adapter.calls).toBe(3);
  });

  it("caps an oversized retry policy at MAX_RETRY_ATTEMPTS", async () => {
    const adapter = adapterFrom(async () => ({ ok: false, error: "flaky" }));
    const plan = { ...planFor(false), retry: { maxAttempts: 50, backoffMs: 0 } };
    await new NexusExecutor([adapter], { recordEvidence: async () => undefined }).execute(plan);
    expect(adapter.calls).toBe(MAX_RETRY_ATTEMPTS);
  });
});
