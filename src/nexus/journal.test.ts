import { describe, expect, it } from "vitest";
import { JournalConflictError, MemoryExecutionJournal, foldJournal } from "./journal";

const P = "11111111-1111-4111-8111-111111111111";
const at = () => new Date("2026-10-17T11:00:00.000Z");

async function waiting(journal = new MemoryExecutionJournal(at)) {
  await journal.append({ executionId: "e1", projectId: P, kind: "planned" });
  await journal.append({ executionId: "e1", projectId: P, kind: "step_started", stepId: "s1" });
  const req = await journal.requestApproval({ executionId: "e1", projectId: P, approvalId: "a1", actorId: "agent" });
  expect(req.ok).toBe(true);
  return journal;
}

describe("execution journal", () => {
  it("derives state by folding append-only entries", async () => {
    const journal = await waiting();
    expect(await journal.state("e1")).toMatchObject({ phase: "waiting_approval", lastSeq: 3, pendingApprovalId: "a1", projectId: P });
    expect((await journal.entries("e1")).map((e) => e.seq)).toEqual([1, 2, 3]);
    expect((await journal.entries("e1", { afterSeq: 2 })).map((e) => e.kind)).toEqual(["approval_requested"]);
    expect(foldJournal("none", []).phase).toBe("unknown");
  });

  it("approve then resume, each idempotent on its key", async () => {
    const journal = await waiting();
    const first = await journal.decide({ executionId: "e1", projectId: P, approvalId: "a1", approve: true, actorId: "owner", idempotencyKey: "k-approve" });
    const retry = await journal.decide({ executionId: "e1", projectId: P, approvalId: "a1", approve: true, actorId: "owner", idempotencyKey: "k-approve" });
    expect(first).toMatchObject({ ok: true, replayed: false });
    expect(retry).toMatchObject({ ok: true, replayed: true });
    expect(await journal.decide({ executionId: "e1", projectId: P, approvalId: "a1", approve: false, actorId: "other", idempotencyKey: "k-other" })).toEqual({ ok: false, error: "already_decided" });
    expect((await journal.state("e1")).phase).toBe("approved");

    const resumed = await journal.resume({ executionId: "e1", projectId: P, actorId: "ios", idempotencyKey: "k-resume" });
    expect(resumed).toMatchObject({ ok: true, replayed: false });
    expect(await journal.resume({ executionId: "e1", projectId: P, actorId: "ios", idempotencyKey: "k-resume" })).toMatchObject({ ok: true, replayed: true });
    expect(await journal.resume({ executionId: "e1", projectId: P, actorId: "web", idempotencyKey: "k-second" })).toEqual({ ok: false, error: "already_resumed" });
    expect((await journal.entries("e1")).filter((e) => e.kind === "resumed")).toHaveLength(1);
  });

  it("refuses resume before approval, after rejection, and across projects", async () => {
    const journal = await waiting();
    expect(await journal.resume({ executionId: "e1", projectId: P, actorId: "x", idempotencyKey: "k" })).toEqual({ ok: false, error: "not_resumable" });
    expect(await journal.decide({ executionId: "e1", projectId: "other", approvalId: "a1", approve: true, actorId: "x", idempotencyKey: "k1" })).toEqual({ ok: false, error: "project_mismatch" });
    expect(await journal.decide({ executionId: "e1", projectId: P, approvalId: "wrong", approve: true, actorId: "x", idempotencyKey: "k2" })).toEqual({ ok: false, error: "approval_mismatch" });
    expect(await journal.decide({ executionId: "e1", projectId: P, approvalId: "a1", approve: false, actorId: "owner", idempotencyKey: "k3" })).toMatchObject({ ok: true });
    expect(await journal.resume({ executionId: "e1", projectId: P, actorId: "x", idempotencyKey: "k4" })).toEqual({ ok: false, error: "terminal" });
    expect(await journal.decide({ executionId: "missing", projectId: P, approvalId: "a1", approve: true, actorId: "x", idempotencyKey: "k5" })).toEqual({ ok: false, error: "not_found" });
    expect(await journal.resume({ executionId: "e1", projectId: P, actorId: "x", idempotencyKey: "" })).toEqual({ ok: false, error: "idempotency_key_required" });
  });

  it("optimistic concurrency: a stale expectedSeq is a conflict, not a lost write", async () => {
    const journal = await waiting();
    await expect(journal.append({ executionId: "e1", projectId: P, kind: "step_completed" }, { expectedSeq: 1 })).rejects.toBeInstanceOf(JournalConflictError);
    await expect(journal.append({ executionId: "e1", projectId: "other", kind: "step_completed" })).rejects.toThrow("journal_project_mismatch");
    expect((await journal.state("e1")).lastSeq).toBe(3);
  });

  it("re-requesting the same pending approval replays; a new approval after resume works", async () => {
    const journal = await waiting();
    expect(await journal.requestApproval({ executionId: "e1", projectId: P, approvalId: "a1" })).toMatchObject({ ok: true, replayed: true });
    await journal.decide({ executionId: "e1", projectId: P, approvalId: "a1", approve: true, actorId: "o", idempotencyKey: "k1" });
    await journal.resume({ executionId: "e1", projectId: P, actorId: "o", idempotencyKey: "k2" });
    expect(await journal.requestApproval({ executionId: "e1", projectId: P, approvalId: "a2" })).toMatchObject({ ok: true, replayed: false });
    expect(await journal.decide({ executionId: "e1", projectId: P, approvalId: "a2", approve: true, actorId: "o", idempotencyKey: "k1" })).toEqual({ ok: false, error: "approval_mismatch" });
    await journal.append({ executionId: "e1", projectId: P, kind: "completed" });
    expect(await journal.requestApproval({ executionId: "e1", projectId: P, approvalId: "a3" })).toEqual({ ok: false, error: "terminal" });
  });
});
