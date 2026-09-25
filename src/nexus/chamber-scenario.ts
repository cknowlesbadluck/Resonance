import type { Agenda, Chamber } from "./chamber";
import { activateChamber, dissolveChamber, formChamber } from "./chamber";
import { DefaultNexusPolicy, type NexusPolicy } from "./policy";
import type { ContextEntry, NexusCapability, NexusEvidence } from "./types";

export interface ChamberParticipantRef {
  id: string;
  projectId: string;
}

export interface ChamberSequenceStep {
  capabilityKey: string;
  input?: unknown;
}

export interface ChamberAuditRecord {
  id: string;
  projectId: string;
  chamberId: string;
  type: string;
  payload: unknown;
  createdAt: string;
}

export interface ChamberScenarioStore {
  saveChamber(chamber: Chamber, cursor: number): Promise<void>;
  saveContext(projectId: string, entry: ContextEntry): Promise<void>;
  saveAudit(record: ChamberAuditRecord): Promise<void>;
  saveEvidence(projectId: string, evidence: NexusEvidence): Promise<void>;
  listAudit(projectId: string, chamberId: string): Promise<ChamberAuditRecord[]>;
  listEvidence(projectId: string): Promise<NexusEvidence[]>;
  getChamber(projectId: string, chamberId: string): Promise<{ chamber: Chamber; cursor: number } | null>;
}

export interface ChamberScenarioResult {
  chamber: Chamber;
  status: Chamber["status"] | "cancelled";
  cursor: number;
  evidenceIds: string[];
}

export class MemoryChamberStore implements ChamberScenarioStore {
  private readonly chambers = new Map<string, { chamber: Chamber; cursor: number }>();
  private readonly context: ContextEntry[] = [];
  private readonly audit: ChamberAuditRecord[] = [];
  private readonly evidence: Array<{ projectId: string; item: NexusEvidence }> = [];

  async saveChamber(chamber: Chamber, cursor: number) {
    this.chambers.set(`${chamber.projectId}\n${chamber.id}`, { chamber, cursor });
  }

  async saveContext(projectId: string, entry: ContextEntry) {
    if (!entry.persistent) return;
    this.context.push({ ...entry, scope: projectId });
  }

  async saveAudit(record: ChamberAuditRecord) {
    this.audit.push(record);
  }

  async saveEvidence(projectId: string, item: NexusEvidence) {
    this.evidence.push({ projectId, item });
  }

  async listAudit(projectId: string, chamberId: string) {
    return this.audit.filter((record) => record.projectId === projectId && record.chamberId === chamberId);
  }

  async listEvidence(projectId: string) {
    return this.evidence.filter((record) => record.projectId === projectId).map((record) => record.item);
  }

  async getChamber(projectId: string, chamberId: string) {
    return this.chambers.get(`${projectId}\n${chamberId}`) ?? null;
  }
}

function assertSameProject(agenda: Agenda, participants: ChamberParticipantRef[]) {
  const outsider = participants.find((participant) => participant.projectId !== agenda.projectId);
  if (outsider) {
    throw new Error(`Participant ${outsider.id} is not in project ${agenda.projectId}.`);
  }
  if (!participants.some((participant) => participant.id === agenda.createdBy)) {
    throw new Error("Agenda creator must be a participant in the same project.");
  }
}

export async function runChamberScenario(input: {
  agenda: Agenda;
  participants: ChamberParticipantRef[];
  permittedCapabilityKeys: string[];
  capabilities: NexusCapability[];
  context: ContextEntry[];
  sequence: ChamberSequenceStep[];
  store: ChamberScenarioStore;
  invoke: (capability: NexusCapability, step: ChamberSequenceStep, actorId: string) => Promise<{ ok: boolean; output?: unknown; error?: string }>;
  policy?: NexusPolicy;
  chamberId?: string;
  actorId?: string;
  approved?: boolean;
}): Promise<ChamberScenarioResult> {
  if (input.sequence.length > 8) throw new Error("Chamber sequence exceeds the bounded limit of 8 steps.");
  assertSameProject(input.agenda, input.participants);
  const actorId = input.actorId ?? input.agenda.createdBy;
  if (!input.participants.some((participant) => participant.id === actorId && participant.projectId === input.agenda.projectId)) {
    throw new Error("Actor is not a permitted participant in this project.");
  }

  const policy = input.policy ?? new DefaultNexusPolicy();
  const permitted = new Set(input.permittedCapabilityKeys);
  const toolkit = input.capabilities.filter((capability) => permitted.has(capability.key));
  let chamber = input.chamberId
    ? (await input.store.getChamber(input.agenda.projectId, input.chamberId))?.chamber
    : undefined;
  let cursor = 0;
  if (input.chamberId) {
    const existing = await input.store.getChamber(input.agenda.projectId, input.chamberId);
    if (!existing) throw new Error("Chamber was not found in this project.");
    chamber = existing.chamber;
    cursor = existing.cursor;
  } else {
    chamber = activateChamber(formChamber(input.agenda, toolkit));
    await input.store.saveAudit({
      id: crypto.randomUUID(),
      projectId: input.agenda.projectId,
      chamberId: chamber.id,
      type: "chamber.opened",
      payload: { participantIds: input.participants.map((participant) => participant.id), permittedCapabilityKeys: [...permitted] },
      createdAt: new Date().toISOString(),
    });
    for (const entry of input.context) {
      if (entry.createdBy !== actorId && entry.visibility === "private") {
        throw new Error("Private context from another actor cannot be seeded.");
      }
      await input.store.saveContext(input.agenda.projectId, { ...entry, persistent: entry.persistent });
    }
  }
  if (!chamber) throw new Error("Chamber was not found in this project.");

  const evidenceIds: string[] = [];
  while (cursor < input.sequence.length) {
    const step = input.sequence[cursor];
    const capability = toolkit.find((item) => item.key === step.capabilityKey);
    if (!capability) throw new Error(`Capability ${step.capabilityKey} is not permitted in this chamber.`);
    const decision = policy.evaluate(actorId, capability);
    if (!decision.allowed) throw new Error(decision.reason ?? `Capability ${capability.key} denied by policy.`);
    if (decision.requiresApproval && input.approved !== true) {
      chamber = { ...chamber, status: "waiting_approval" };
      await input.store.saveChamber(chamber, cursor);
      await input.store.saveAudit({
        id: crypto.randomUUID(),
        projectId: chamber.projectId,
        chamberId: chamber.id,
        type: "chamber.waiting_approval",
        payload: { cursor, capabilityKey: capability.key, reason: decision.reason },
        createdAt: new Date().toISOString(),
      });
      return { chamber, status: "waiting_approval", cursor, evidenceIds };
    }
    const result = await input.invoke(capability, step, actorId);
    const evidence: NexusEvidence = {
      id: crypto.randomUUID(),
      executionId: chamber.id,
      type: result.ok ? "event" : "audit",
      summary: result.ok ? `Chamber step ${capability.key} completed.` : `Chamber step ${capability.key} failed.`,
      payload: result.ok ? result.output : result.error,
      createdAt: new Date().toISOString(),
    };
    await input.store.saveEvidence(chamber.projectId, evidence);
    evidenceIds.push(evidence.id);
    await input.store.saveAudit({
      id: crypto.randomUUID(),
      projectId: chamber.projectId,
      chamberId: chamber.id,
      type: result.ok ? "chamber.step.completed" : "chamber.step.failed",
      payload: { cursor, capabilityKey: capability.key, evidenceId: evidence.id },
      createdAt: new Date().toISOString(),
    });
    if (!result.ok) throw new Error(result.error ?? `Capability ${capability.key} failed.`);
    cursor += 1;
    input.approved = false;
  }

  const dissolved = dissolveChamber(chamber);
  await input.store.saveChamber(dissolved, cursor);
  await input.store.saveAudit({
    id: crypto.randomUUID(),
    projectId: dissolved.projectId,
    chamberId: dissolved.id,
    type: "chamber.dissolved",
    payload: { cursor, evidenceIds },
    createdAt: new Date().toISOString(),
  });
  return { chamber: dissolved, status: "dissolved", cursor, evidenceIds };
}

export async function cancelChamberScenario(input: {
  agendaProjectId: string;
  chamberId: string;
  actorId: string;
  participants: ChamberParticipantRef[];
  store: ChamberScenarioStore;
}): Promise<ChamberScenarioResult> {
  if (!input.participants.some((participant) => participant.id === input.actorId && participant.projectId === input.agendaProjectId)) {
    throw new Error("Actor is not a permitted participant in this project.");
  }
  const existing = await input.store.getChamber(input.agendaProjectId, input.chamberId);
  if (!existing) throw new Error("Chamber was not found in this project.");
  const chamber: Chamber = {
    ...existing.chamber,
    status: "dissolved",
    dissolvedAt: new Date().toISOString(),
    toolkitCapabilityKeys: [],
  };
  await input.store.saveChamber(chamber, existing.cursor);
  await input.store.saveAudit({
    id: crypto.randomUUID(),
    projectId: input.agendaProjectId,
    chamberId: chamber.id,
    type: "chamber.cancelled",
    payload: { actorId: input.actorId, cursor: existing.cursor },
    createdAt: new Date().toISOString(),
  });
  return { chamber, status: "cancelled", cursor: existing.cursor, evidenceIds: [] };
}
