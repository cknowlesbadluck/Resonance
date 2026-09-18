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

  async execute(plan: NexusExecutionPlan): Promise<{ execution: NexusExecution; evidence: NexusEvidence[] }> {
    const execution: NexusExecution = { id: crypto.randomUUID(), planId: plan.id, status: "running", startedAt: new Date().toISOString() };
    const evidence: NexusEvidence[] = [];
    const retry = plan.retry ?? DEFAULT_RETRY;
    const maxAttempts = Math.max(1, retry.maxAttempts);

    await this.persistExecution(execution);
    await this.emitEvent(plan, execution, "execution.started", "running", { planId: plan.id, stepCount: plan.steps.length });

    try {
      const outputs: unknown[] = [];
      const completedSteps = new Set<string>();
      const pendingSteps = new Set(plan.steps);

      while (pendingSteps.size > 0) {
        // Find steps ready to execute in this wave
        const wave = Array.from(pendingSteps).filter(step =>
          !step.dependsOn || step.dependsOn.every(dep => completedSteps.has(dep))
        );

        if (wave.length === 0) {
          throw new Error("Deadlock detected: unresolvable step dependencies.");
        }

        // Check for approvals before firing any external calls for this wave
        for (const step of wave) {
          if (step.requiresApproval) {
            execution.status = "waiting";
            execution.error = "Approval required before execution.";
            await this.persistExecution(execution);
            await this.emitEvent(plan, execution, "execution.waiting", "waiting", { stepId: step.id, reason: execution.error });
            return { execution, evidence };
          }
        }

        // Execute wave concurrently
        const waveResults = await Promise.all(wave.map(async (step) => {
          const adapter = this.adapterMap.get(step.adapterId);
          if (!adapter) return { step, error: `Adapter ${step.adapterId} not found` };

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

          if (!result) return { step, error: `Capability ${step.capabilityId} produced no invocation result.` };

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

          if (!result.ok) return { step, error: result.error ?? "Adapter invocation failed" };

          return { step, output: result.output };
        }));

        // Process wave results - first pass registers success, second checks for error to prevent ignoring successes from the wave
        for (const res of waveResults) {
          if (!res.error) {
            outputs.push(res.output);
            completedSteps.add(res.step.id);
            pendingSteps.delete(res.step);
          }
        }

        for (const res of waveResults) {
          if (res.error) {
            throw new Error(res.error);
          }
        }
      }

      execution.status = "completed";
      execution.completedAt = new Date().toISOString();
      // Only set outputs if we executed strictly sequentially without complex DAGs
      // or we accept outputs not matching original step order.
      // The original just pushed to outputs.
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
