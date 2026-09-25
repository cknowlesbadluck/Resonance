import type { NexusEvidence, NexusExecution } from "./types";

export interface ScopedExecutionRecord {
  projectId: string;
  execution: NexusExecution;
}

export interface ScopedEvidenceRecord {
  projectId: string;
  item: NexusEvidence;
}

/** Process-local execution state. Reads are always project-scoped. */
export class ScopedExecutionMemory {
  private executions: ScopedExecutionRecord[] = [];
  private evidence: ScopedEvidenceRecord[] = [];

  upsertExecution(projectId: string, execution: NexusExecution) {
    const index = this.executions.findIndex((item) => item.projectId === projectId && item.execution.id === execution.id);
    if (index >= 0) this.executions[index] = { projectId, execution };
    else this.executions.unshift({ projectId, execution });
  }

  addEvidence(projectId: string, item: NexusEvidence) {
    this.evidence.unshift({ projectId, item });
  }

  list(projectId: string) {
    return {
      executions: this.executions.filter((item) => item.projectId === projectId).map((item) => item.execution),
      evidence: this.evidence.filter((item) => item.projectId === projectId).map((item) => item.item),
    };
  }
}
