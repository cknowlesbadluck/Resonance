import type { NexusAdapter } from "./adapters/types";
import type { NexusEvent, NexusExecution, NexusExecutionPlan, NexusEvidence, ExecutionRetryPolicy, ExecutionStep } from "./types";

export interface ExecutionSink {
  recordEvidence(evidence: NexusEvidence): Promise<void>;
  recordEvent?(event: NexusEvent): Promise<void>;
  recordExecution?(execution: NexusExecution): Promise<void>;
}

const DEFAULT_RETRY: ExecutionRetryPolicy = { maxAttempts: 1, backoffMs: 0 };
const sleep = (ms: number) => ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

export class NexusExecutor {
  private readonly adapterMap = new Map<string, NexusAdapter>();

  constructor(adapters: NexusAdapter[], private readonly sink: ExecutionSink) {
    for (const adapter of adapters) {
      if (!this.adapterMap.has(adapter.id)) {
        this.adapterMap.set(adapter.id, adapter);
      }
    }
  }

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

  private async handleStepApprovalRequired(
    step: ExecutionStep,
    plan: NexusExecutionPlan,
    execution: NexusExecution
  ): Promise<void> {
    execution.status = "waiting";
    execution.error = "Approval required before execution.";
    await this.persistExecution(execution);
    await this.emitEvent(plan, execution, "execution.waiting", "waiting", {
      stepId: step.id,
      reason: execution.error,
    });
  }

  private async invokeStepWithRetry(
    step: ExecutionStep,
    plan: NexusExecutionPlan,
    execution: NexusExecution,
    maxAttempts: number,
    backoffMs: number
  ): Promise<Awaited<ReturnType<NexusAdapter["invoke"]>>> {
    const adapter = this.adapterMap.get(step.adapterId);
    if (!adapter) throw new Error(`Adapter ${step.adapterId} not found`);

    let result: Awaited<ReturnType<NexusAdapter["invoke"]>> | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        result = await adapter.invoke({
          capabilityId: step.capabilityId,
          input: step.input,
          actorId: plan.actorId,
          correlationId: execution.id,
        });
      } catch (error) {
        if (attempt === maxAttempts) {
          result = { ok: false, error: error instanceof Error ? error.message : String(error) };
          break;
        }
        await this.emitEvent(plan, execution, "execution.retrying", "retrying", {
          stepId: step.id,
          attempt,
          nextAttempt: attempt + 1,
        });
        await sleep(backoffMs * attempt);
        continue;
      }
      if (result.ok || attempt === maxAttempts) break;
      await this.emitEvent(plan, execution, "execution.retrying", "retrying", {
        stepId: step.id,
        attempt,
        nextAttempt: attempt + 1,
      });
      await sleep(backoffMs * attempt);
    }

    if (!result) throw new Error(`Capability ${step.capabilityId} produced no invocation result.`);
    return result;
  }

  private async recordStepEvidence(
    executionId: string,
    capabilityId: string,
    result: Awaited<ReturnType<NexusAdapter["invoke"]>>
  ): Promise<NexusEvidence> {
    const item: NexusEvidence = {
      id: crypto.randomUUID(),
      executionId,
      type: result.ok ? "event" : "audit",
      summary: result.ok ? `Capability ${capabilityId} completed.` : `Capability ${capabilityId} failed.`,
      payload: result.ok ? result.output : result.error,
      createdAt: new Date().toISOString(),
    };
    await this.sink.recordEvidence(item);
    return item;
  }

  private async processStep(
    step: ExecutionStep,
    plan: NexusExecutionPlan,
    execution: NexusExecution,
    evidence: NexusEvidence[],
    maxAttempts: number,
    backoffMs: number
  ): Promise<unknown> {
    const result = await this.invokeStepWithRetry(step, plan, execution, maxAttempts, backoffMs);
    const item = await this.recordStepEvidence(execution.id, step.capabilityId, result);
    evidence.push(item);

    await this.emitEvent(
      plan,
      execution,
      result.ok ? "execution.step.completed" : "execution.step.failed",
      result.ok ? "completed" : "failed",
      { stepId: step.id, capabilityId: step.capabilityId }
    );

    if (!result.ok) throw new Error(result.error ?? "Adapter invocation failed");
    return result.output;
  }

  private async markExecutionCompleted(
    plan: NexusExecutionPlan,
    execution: NexusExecution,
    outputs: unknown[]
  ): Promise<void> {
    execution.status = "completed";
    execution.completedAt = new Date().toISOString();
    execution.output = outputs;
    await this.persistExecution(execution);
    await this.emitEvent(plan, execution, "execution.completed", "completed", { outputCount: outputs.length });
  }

  private async markExecutionFailed(
    plan: NexusExecutionPlan,
    execution: NexusExecution,
    error: unknown
  ): Promise<void> {
    execution.status = "failed";
    execution.completedAt = new Date().toISOString();
    execution.error = error instanceof Error ? error.message : String(error);
    await this.persistExecution(execution);
    await this.emitEvent(plan, execution, "execution.failed", "failed", { error: execution.error });
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
          await this.handleStepApprovalRequired(step, plan, execution);
          return { execution, evidence };
        }
        const output = await this.processStep(step, plan, execution, evidence, maxAttempts, retry.backoffMs);
        outputs.push(output);
      }
      await this.markExecutionCompleted(plan, execution, outputs);
      return { execution, evidence };
    } catch (error) {
      await this.markExecutionFailed(plan, execution, error);
      return { execution, evidence };
    }
  }
}
