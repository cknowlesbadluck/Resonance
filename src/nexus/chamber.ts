import type { NexusCapability, NexusExecutionPlan, NexusIntent } from "./types";

/**
 * Minimal Chamber primitive — temporary coordinated execution space.
 * Agenda-bound; dissolves after work with durable residue owned by executions/evidence.
 */
export type ChamberStatus = "forming" | "active" | "waiting_approval" | "dissolving" | "dissolved";

export interface Agenda {
  id: string;
  projectId: string;
  objective: string;
  constraints?: string[];
  successCriteria?: string[];
  createdBy: string;
}

export interface Chamber {
  id: string;
  agendaId: string;
  projectId: string;
  status: ChamberStatus;
  toolkitCapabilityKeys: string[];
  participantIds: string[];
  createdAt: string;
  dissolvedAt?: string;
}

export function formChamber(agenda: Agenda, seedCapabilities: NexusCapability[]): Chamber {
  return {
    id: crypto.randomUUID(),
    agendaId: agenda.id,
    projectId: agenda.projectId,
    status: "forming",
    toolkitCapabilityKeys: seedCapabilities
      .filter((c) => c.availability === "available" || c.availability === undefined)
      .map((c) => c.key),
    participantIds: [agenda.createdBy],
    createdAt: new Date().toISOString(),
  };
}

export function activateChamber(chamber: Chamber): Chamber {
  return { ...chamber, status: "active" };
}

export function dissolveChamber(chamber: Chamber): Chamber {
  return {
    ...chamber,
    status: "dissolved",
    dissolvedAt: new Date().toISOString(),
    toolkitCapabilityKeys: [],
  };
}

/** Mark plan as chamber mode when multi-step coordinated work is required. */
export function asChamberPlan(plan: NexusExecutionPlan, chamberId: string): NexusExecutionPlan {
  return {
    ...plan,
    mode: "chamber",
    rationale: [...plan.rationale, `chamber:${chamberId}`],
  };
}

export function agendaFromIntent(intent: NexusIntent): Agenda {
  return {
    id: crypto.randomUUID(),
    projectId: intent.projectId,
    objective: intent.objective,
    createdBy: intent.requestedBy,
  };
}
