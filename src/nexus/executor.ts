import type { NexusAdapter } from "./adapters/types";
import type { NexusExecution, NexusExecutionPlan, NexusEvidence, ExecutionRetryPolicy } from "./types";

export interface ExecutionSink { recordEvidence(evidence: NexusEvidence): Promise<void>; }
const DEFAULT_RETRY: ExecutionRetryPolicy = { maxAttempts: 1, backoffMs: 0 };
const sleep = (ms: number) => ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

export class NexusExecutor {
  constructor(private readonly adapters: NexusAdapter[], private readonly sink: ExecutionSink) {}
  async execute(plan: NexusExecutionPlan): Promise<{ execution: NexusExecution; evidence: NexusEvidence[] }> {
    const execution: NexusExecution = { id: crypto.randomUUID(), planId: plan.id, status: "running", startedAt: new Date().toISOString() };
    const evidence: NexusEvidence[] = [];
    const retry = plan.retry ?? DEFAULT_RETRY;
    const maxAttempts = Math.max(1, retry.maxAttempts);
    try {
      const outputs: unknown[] = [];
      for (const step of plan.steps) {
        if (step.requiresApproval) { execution.status = "waiting"; execution.error = "Approval required before execution."; return { execution, evidence }; }
        const adapter = this.adapters.find((item) => item.id === step.adapterId);
        if (!adapter) throw new Error(`Adapter ${step.adapterId} not found`);
        let result;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          result = await adapter.invoke({ capabilityId: step.capabilityId, input: step.input, actorId: plan.actorId, correlationId: execution.id });
          if (result.ok || attempt === maxAttempts) break;
          await sleep(retry.backoffMs * attempt);
        }
        const item: NexusEvidence = { id: crypto.randomUUID(), executionId: execution.id, type: result.ok ? "event" : "audit", summary: result.ok ? `Capability ${step.capabilityId} completed.` : `Capability ${step.capabilityId} failed.`, payload: result.ok ? result.output : result.error, createdAt: new Date().toISOString() };
        evidence.push(item); await this.sink.recordEvidence(item);
        if (!result.ok) throw new Error(result.error ?? "Adapter invocation failed");
        outputs.push(result.output);
      }
      execution.status = "completed"; execution.completedAt = new Date().toISOString(); execution.output = outputs;
      return { execution, evidence };
    } catch (error) {
      execution.status = "failed"; execution.completedAt = new Date().toISOString(); execution.error = error instanceof Error ? error.message : String(error);
      return { execution, evidence };
    }
  }
}
