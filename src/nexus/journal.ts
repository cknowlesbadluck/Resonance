/**
 * Durable execution journal: interface + in-memory implementation (RFC: docs/ARCHITECTURE.md,
 * "Durable execution journal"). The Supabase-backed store is a later PR with its own owner-applied
 * migration; this module has no persistence and is not wired into routes yet.
 *
 * The journal is an append-only, per-execution sequence. State is derived by folding entries, never
 * stored separately, so a restart rebuilds the same state from the same rows. Approve and resume are
 * idempotent on (executionId, idempotencyKey): a retry with the same key replays the original outcome,
 * and a different key after the decision is refused rather than applied twice.
 */

export type JournalEntryKind =
  | "planned"
  | "step_started"
  | "step_completed"
  | "step_failed"
  | "approval_requested"
  | "approved"
  | "rejected"
  | "resumed"
  | "completed"
  | "failed"
  | "cancelled";

export type JournalEntry = {
  executionId: string;
  projectId: string;
  seq: number;
  kind: JournalEntryKind;
  at: string;
  actorId: string | null;
  idempotencyKey: string | null;
  approvalId: string | null;
  stepId: string | null;
  /** Small, already-redacted detail. Never credentials or raw provider bodies. */
  detail: Record<string, unknown> | null;
};

export type JournalAppend = Omit<JournalEntry, "seq" | "at" | "actorId" | "idempotencyKey" | "approvalId" | "stepId" | "detail"> &
  Partial<Pick<JournalEntry, "actorId" | "idempotencyKey" | "approvalId" | "stepId" | "detail">>;

export type ExecutionPhase = "unknown" | "running" | "waiting_approval" | "approved" | "rejected" | "completed" | "failed" | "cancelled";

export type JournalState = {
  executionId: string;
  projectId: string | null;
  phase: ExecutionPhase;
  lastSeq: number;
  pendingApprovalId: string | null;
  /** Approval granted but not yet consumed by a resume. */
  resumableApprovalId: string | null;
};

export type DecisionResult =
  | { ok: true; replayed: boolean; entry: JournalEntry }
  | { ok: false; error: "not_found" | "no_pending_approval" | "approval_mismatch" | "already_decided" | "not_resumable" | "already_resumed" | "terminal" | "project_mismatch" | "idempotency_key_required" };

export class JournalConflictError extends Error {
  constructor(readonly executionId: string, readonly expectedSeq: number, readonly actualSeq: number) {
    super(`journal_conflict execution=${executionId} expected=${expectedSeq} actual=${actualSeq}`);
  }
}

export interface ExecutionJournal {
  /** Append one entry. With expectedSeq set, fails with JournalConflictError unless it equals the current lastSeq (optimistic concurrency). */
  append(entry: JournalAppend, options?: { expectedSeq?: number }): Promise<JournalEntry>;
  entries(executionId: string, options?: { afterSeq?: number; limit?: number }): Promise<JournalEntry[]>;
  state(executionId: string): Promise<JournalState>;
  requestApproval(input: { executionId: string; projectId: string; approvalId: string; actorId?: string; detail?: Record<string, unknown> }): Promise<DecisionResult>;
  decide(input: { executionId: string; projectId: string; approvalId: string; approve: boolean; actorId: string; idempotencyKey: string }): Promise<DecisionResult>;
  resume(input: { executionId: string; projectId: string; actorId: string; idempotencyKey: string }): Promise<DecisionResult>;
}

const TERMINAL: ReadonlySet<ExecutionPhase> = new Set(["completed", "failed", "cancelled", "rejected"]);
export const JOURNAL_PAGE_MAX = 500;

export function foldJournal(executionId: string, entries: readonly JournalEntry[]): JournalState {
  const state: JournalState = { executionId, projectId: null, phase: "unknown", lastSeq: 0, pendingApprovalId: null, resumableApprovalId: null };
  for (const e of entries) {
    state.lastSeq = e.seq;
    state.projectId ??= e.projectId;
    switch (e.kind) {
      case "planned": case "step_started": case "step_completed": case "step_failed":
        if (!TERMINAL.has(state.phase) && state.phase !== "waiting_approval") state.phase = "running";
        break;
      case "approval_requested": state.phase = "waiting_approval"; state.pendingApprovalId = e.approvalId; state.resumableApprovalId = null; break;
      case "approved": state.phase = "approved"; state.resumableApprovalId = e.approvalId; state.pendingApprovalId = null; break;
      case "rejected": state.phase = "rejected"; state.pendingApprovalId = null; state.resumableApprovalId = null; break;
      case "resumed": state.phase = "running"; state.resumableApprovalId = null; break;
      case "completed": case "failed": case "cancelled": state.phase = e.kind; state.pendingApprovalId = null; state.resumableApprovalId = null; break;
    }
  }
  return state;
}

/** In-memory journal for tests and the memory runtime. Single-process; the Supabase store keeps the same contract. */
export class MemoryExecutionJournal implements ExecutionJournal {
  private readonly rows = new Map<string, JournalEntry[]>();
  constructor(private readonly now: () => Date = () => new Date()) {}

  async append(input: JournalAppend, options: { expectedSeq?: number } = {}): Promise<JournalEntry> {
    const list = this.rows.get(input.executionId) ?? [];
    const lastSeq = list.at(-1)?.seq ?? 0;
    if (options.expectedSeq !== undefined && options.expectedSeq !== lastSeq) throw new JournalConflictError(input.executionId, options.expectedSeq, lastSeq);
    if (list.length > 0 && list[0].projectId !== input.projectId) throw new Error("journal_project_mismatch");
    const entry: JournalEntry = {
      executionId: input.executionId, projectId: input.projectId, seq: lastSeq + 1, kind: input.kind, at: this.now().toISOString(),
      actorId: input.actorId ?? null, idempotencyKey: input.idempotencyKey ?? null, approvalId: input.approvalId ?? null, stepId: input.stepId ?? null, detail: input.detail ?? null,
    };
    list.push(entry);
    this.rows.set(input.executionId, list);
    return entry;
  }

  async entries(executionId: string, options: { afterSeq?: number; limit?: number } = {}): Promise<JournalEntry[]> {
    const limit = Math.min(JOURNAL_PAGE_MAX, Math.max(1, Math.floor(options.limit ?? JOURNAL_PAGE_MAX)));
    return (this.rows.get(executionId) ?? []).filter((e) => e.seq > (options.afterSeq ?? 0)).slice(0, limit).map((e) => ({ ...e }));
  }

  async state(executionId: string): Promise<JournalState> {
    return foldJournal(executionId, this.rows.get(executionId) ?? []);
  }

  private replay(executionId: string, kinds: JournalEntryKind[], idempotencyKey: string): JournalEntry | undefined {
    return (this.rows.get(executionId) ?? []).find((e) => e.idempotencyKey === idempotencyKey && kinds.includes(e.kind));
  }

  private scoped(state: JournalState, projectId: string): DecisionResult | null {
    if (state.lastSeq === 0) return { ok: false, error: "not_found" };
    if (state.projectId !== projectId) return { ok: false, error: "project_mismatch" };
    return null;
  }

  async requestApproval(input: { executionId: string; projectId: string; approvalId: string; actorId?: string; detail?: Record<string, unknown> }): Promise<DecisionResult> {
    const state = await this.state(input.executionId);
    const denied = this.scoped(state, input.projectId);
    if (denied) return denied;
    if (TERMINAL.has(state.phase)) return { ok: false, error: "terminal" };
    if (state.pendingApprovalId === input.approvalId) {
      const existing = (this.rows.get(input.executionId) ?? []).findLast((e) => e.kind === "approval_requested" && e.approvalId === input.approvalId)!;
      return { ok: true, replayed: true, entry: { ...existing } };
    }
    const entry = await this.append({ executionId: input.executionId, projectId: input.projectId, kind: "approval_requested", approvalId: input.approvalId, actorId: input.actorId, detail: input.detail }, { expectedSeq: state.lastSeq });
    return { ok: true, replayed: false, entry };
  }

  async decide(input: { executionId: string; projectId: string; approvalId: string; approve: boolean; actorId: string; idempotencyKey: string }): Promise<DecisionResult> {
    if (!input.idempotencyKey) return { ok: false, error: "idempotency_key_required" };
    const state = await this.state(input.executionId);
    const denied = this.scoped(state, input.projectId);
    if (denied) return denied;
    const prior = this.replay(input.executionId, ["approved", "rejected"], input.idempotencyKey);
    if (prior) return prior.approvalId === input.approvalId ? { ok: true, replayed: true, entry: { ...prior } } : { ok: false, error: "approval_mismatch" };
    if (!state.pendingApprovalId) {
      const decided = (this.rows.get(input.executionId) ?? []).some((e) => (e.kind === "approved" || e.kind === "rejected") && e.approvalId === input.approvalId);
      return { ok: false, error: decided ? "already_decided" : "no_pending_approval" };
    }
    if (state.pendingApprovalId !== input.approvalId) return { ok: false, error: "approval_mismatch" };
    const entry = await this.append({ executionId: input.executionId, projectId: input.projectId, kind: input.approve ? "approved" : "rejected", approvalId: input.approvalId, actorId: input.actorId, idempotencyKey: input.idempotencyKey }, { expectedSeq: state.lastSeq });
    return { ok: true, replayed: false, entry };
  }

  async resume(input: { executionId: string; projectId: string; actorId: string; idempotencyKey: string }): Promise<DecisionResult> {
    if (!input.idempotencyKey) return { ok: false, error: "idempotency_key_required" };
    const state = await this.state(input.executionId);
    const denied = this.scoped(state, input.projectId);
    if (denied) return denied;
    const prior = this.replay(input.executionId, ["resumed"], input.idempotencyKey);
    if (prior) return { ok: true, replayed: true, entry: { ...prior } };
    if (TERMINAL.has(state.phase)) return { ok: false, error: "terminal" };
    if (!state.resumableApprovalId) {
      const resumed = (this.rows.get(input.executionId) ?? []).some((e) => e.kind === "resumed");
      return { ok: false, error: resumed && state.phase === "running" ? "already_resumed" : "not_resumable" };
    }
    const entry = await this.append({ executionId: input.executionId, projectId: input.projectId, kind: "resumed", approvalId: state.resumableApprovalId, actorId: input.actorId, idempotencyKey: input.idempotencyKey }, { expectedSeq: state.lastSeq });
    return { ok: true, replayed: false, entry };
  }
}
