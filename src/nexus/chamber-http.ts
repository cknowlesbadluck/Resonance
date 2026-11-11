import type { Agenda } from "./chamber";
import { MemoryChamberStore, runChamberScenario, type ChamberScenarioStore } from "./chamber-scenario";
import type { ChamberSequenceStep } from "./chamber-scenario";
import type { NexusCapability } from "./types";
import type { NexusPolicy } from "./policy";
import { DefaultNexusPolicy } from "./policy";

const MAX_OBJECTIVE = 4_000;

export type ChamberOpenInput = {
  projectId: string;
  objective: string;
  actorId: string;
  capability: NexusCapability;
  idempotencyKey: string;
  input?: unknown;
  approved?: boolean;
  chamberId?: string;
};

export type ChamberHttpResult = { status: number; body: Record<string, unknown> };

export async function openChamber(
  input: ChamberOpenInput,
  store: ChamberScenarioStore & {
    findByIdempotency?: (projectId: string, key: string) => Promise<{ chamber: { id: string; status: string }; cursor: number } | null>;
    tag?: (key: string) => void;
  },
  options: {
    policy?: NexusPolicy;
    invoke?: (capability: NexusCapability, step: ChamberSequenceStep, actorId: string) => Promise<{ ok: boolean; output?: unknown; error?: string }>;
  } = {},
): Promise<ChamberHttpResult> {
  if (!input.idempotencyKey || input.idempotencyKey.length > 128) {
    return { status: 400, body: { error: "Idempotency-Key is required and must be at most 128 characters." } };
  }
  if (!input.objective.trim() || input.objective.length > MAX_OBJECTIVE) {
    return { status: 400, body: { error: "objective is required and must be at most 4000 characters." } };
  }
  if (!input.actorId.trim()) return { status: 400, body: { error: "actorId is required." } };
  if (!input.capability?.key) return { status: 400, body: { error: "capability is required." } };

  const replay = store.findByIdempotency ? await store.findByIdempotency(input.projectId, input.idempotencyKey) : null;
  if (replay && !input.chamberId) {
    const audit = await store.listAudit(input.projectId, replay.chamber.id);
    return { status: 200, body: { replayed: true, chamber: replay.chamber, cursor: replay.cursor, status: replay.chamber.status, audit } };
  }

  store.tag?.(input.idempotencyKey);
  const agenda: Agenda = {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    objective: input.objective.trim(),
    createdBy: input.actorId,
  };
  try {
    const result = await runChamberScenario({
      agenda,
      participants: [{ id: input.actorId, projectId: input.projectId }],
      permittedCapabilityKeys: [input.capability.key],
      capabilities: [input.capability],
      context: [],
      sequence: [{ capabilityKey: input.capability.key, input: input.input }],
      store,
      policy: options.policy ?? new DefaultNexusPolicy(),
      chamberId: input.chamberId,
      actorId: input.actorId,
      approved: input.approved,
      invoke: options.invoke ?? (async (capability, step) => ({
        ok: true,
        output: { invocation: "governed-record", capabilityKey: capability.key, input: step.input ?? null },
      })),
    });
    const audit = await store.listAudit(input.projectId, result.chamber.id);
    const httpStatus = result.status === "waiting_approval" ? 202 : 200;
    return { status: httpStatus, body: { replayed: false, chamber: result.chamber, status: result.status, cursor: result.cursor, evidenceIds: result.evidenceIds, audit } };
  } catch (error) {
    return { status: 409, body: { error: error instanceof Error ? error.message : "Chamber refused." } };
  }
}

export function memoryChamberStore(): MemoryChamberStore & { findByIdempotency(projectId: string, key: string): Promise<null> } {
  const store = new MemoryChamberStore();
  return Object.assign(store, { async findByIdempotency() { return null; } });
}
