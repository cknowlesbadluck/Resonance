import type { NexusAdapter } from "./adapters/types";
import type { NexusEvent, NexusExecution, NexusExecutionPlan, NexusEvidence, ExecutionRetryPolicy } from "./types";

export interface ExecutionSink {
  recordEvidence(evidence: NexusEvidence): Promise<void>;
  recordEvent?(event: NexusEvent): Promise<void>;
  recordExecution?(execution: NexusExecution): Promise<void>;
}

const DEFAULT_RETRY: ExecutionRetryPolicy = { maxAttempts: 1, backoffMs: 0 };
const sleep = (ms: number) => ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

export class NexusExecutor {
  constructor(private readonly adapters: NexusAdapter[], private readonly sink: ExecutionSink) {}

  private async persistExecution(execution: NexusExecution) {
    if (this.sink.recordExecution) await this.sink.recordExecution(execution);
  }

  private async emitEvent(plan: NexusExecutionPlan, execution: NexusExecution, type: string, status: string, payload: unknown) {
    if (!this.sink.recordEvent) return;
    const event: NexusEvent = {
      id: crypto.randomUUID(),
      source: "resonance.executor",
      type,
      status,
      correlationId: execution.id,
      actorId: plan.actorId,
      projectId: plan.projectId,
      resourceId: execution.id,
      payload,
      createdAt: new Date().toISOString(),
    };
    await this.sink.recordEvent(event);
  }

  async execute(plan: NexusExecutionPlan): Promise<{ execution: NexusExecution; evidence: NexusEvidence[] }> {
    const execution: NexusExecution = { id: crypto.randomUUID(), planId: plan.id, status: "running", startedAt: new Date().toISOString() };
    const evidence: NexusEvidence[] = [];
    const retry = plan.retry ?? DEFAULT_RETRY;
    const maxAttempts = Math.max(1, retry.maxAttempts);

    await this.persistExecution(execution);
    await this.emitEvent(plan, execution, "execution.started", "running", { planId: plan.id, stepCount: plan.steps.length });

    try {
      const outputs: unknown[] = [];
      for (const step of plan.steps) {
        if (step.requiresApproval) {
          execution.status = "waiting";
          execution.error = "Approval required before execution.";
          await this.persistExecution(execution);
          await this.emitEvent(plan, execution, "execution.waiting", "waiting", { stepId: step.id, reason: execution.error });
          return { execution, evidence };
        }
        const adapter = this.adapters.find((item) => item.id === step.adapterId);
        if (!adapter) throw new Error(`Adapter ${step.adapterId} not found`);
        let result: Awaited<ReturnType<NexusAdapter["invoke"]>> | undefined;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            result = await adapter.invoke({ capabilityId: step.capabilityId, input: step.input, actorId: plan.actorId, correlationId: execution.id });
          } catch (error) {
            if (attempt === maxAttempts) {
              result = { ok: false, error: error instanceof Error ? error.message : String(error) };
              break;
            }
            await this.emitEvent(plan, execution, "execution.retrying", "retrying", { stepId: step.id, attempt, nextAttempt: attempt + 1 });
            await sleep(retry.backoffMs * attempt);
            continue;
          }
          if (result.ok || attempt === maxAttempts) break;
          await this.emitEvent(plan, execution, "execution.retrying", "retrying", { stepId: step.id, attempt, nextAttempt: attempt + 1 });
          await sleep(retry.backoffMs * attempt);
        }
        if (!result) throw new Error(`Capability ${step.capabilityId} produced no invocation result.`);
        const item: NexusEvidence = {
          id: crypto.randomUUID(),
          executionId: execution.id,
          type: result.ok ? "event" : "audit",
          summary: result.ok ? `Capability ${step.capabilityId} completed.` : `Capability ${step.capabilityId} failed.`,
          payload: result.ok ? result.output : result.error,
          createdAt: new Date().toISOString(),
        };
        evidence.push(item);
        await this.sink.recordEvidence(item);
        await this.emitEvent(plan, execution, result.ok ? "execution.step.completed" : "execution.step.failed", result.ok ? "completed" : "failed", { stepId: step.id, capabilityId: step.capabilityId });
        if (!result.ok) throw new Error(result.error ?? "Adapter invocation failed");
        outputs.push(result.output);
      }
      execution.status = "completed";
      execution.completedAt = new Date().toISOString();
      execution.output = outputs;
      await this.persistExecution(execution);
      await this.emitEvent(plan, execution, "execution.completed", "completed", { outputCount: outputs.length });
      return { execution, evidence };
    } catch (error) {
      execution.status = "failed";
      execution.completedAt = new Date().toISOString();
      execution.error = error instanceof Error ? error.message : String(error);
      await this.persistExecution(execution);
      await this.emitEvent(plan, execution, "execution.failed", "failed", { error: execution.error });
      return { execution, evidence };
    }
  }
}
