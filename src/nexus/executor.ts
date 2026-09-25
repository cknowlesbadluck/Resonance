import type { NexusAdapter } from "./adapters/types";
import type { NexusEvent, NexusExecution, NexusExecutionPlan, NexusEvidence, ExecutionRetryPolicy, ExecutionStep, StepOutcome } from "./types";

export interface ExecutionSink {
  recordEvidence(evidence: NexusEvidence): Promise<void>;
  recordEvent?(event: NexusEvent): Promise<void>;
  recordExecution?(execution: NexusExecution): Promise<void>;
}

const DEFAULT_RETRY: ExecutionRetryPolicy = { maxAttempts: 1, backoffMs: 0 };
const sleep = (ms: number) => ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

export function stepsSafeToRetry(plan: NexusExecutionPlan, outcomes: Array<Pick<StepOutcome, "stepId" | "ok">> = []): ExecutionStep[] {
  const succeeded = new Set(outcomes.filter((outcome) => outcome.ok).map((outcome) => outcome.stepId));
  return plan.steps.filter((step) => !succeeded.has(step.id));
}

interface StepRun {
  outcome: StepOutcome;
  output?: unknown;
  evidence: NexusEvidence | null;
}

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

  private async runStep(plan: NexusExecutionPlan, execution: NexusExecution, step: ExecutionStep, retry: ExecutionRetryPolicy): Promise<StepRun> {
    const adapter = this.adapterMap.get(step.adapterId);
    if (!adapter) {
      return {
        outcome: { stepId: step.id, capabilityId: step.capabilityId, ok: false, error: `Adapter ${step.adapterId} not found` },
        evidence: null,
      };
    }
    const maxAttempts = Math.max(1, retry.maxAttempts);
    let ok = false;
    let output: unknown;
    let error = "Adapter invocation failed";
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await adapter.invoke({ capabilityId: step.capabilityId, input: step.input, actorId: plan.actorId, correlationId: execution.id });
        if (result.ok) {
          ok = true;
          output = result.output;
          error = "";
          break;
        }
        error = result.error ?? "Adapter invocation failed";
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      }
      if (attempt < maxAttempts) {
        await this.emitEvent(plan, execution, "execution.retrying", "retrying", { stepId: step.id, attempt, nextAttempt: attempt + 1 });
        await sleep(retry.backoffMs * attempt);
      }
    }
    return {
      outcome: { stepId: step.id, capabilityId: step.capabilityId, ok, error: ok ? undefined : error },
      output,
      evidence: {
        id: crypto.randomUUID(),
        executionId: execution.id,
        type: ok ? "event" : "audit",
        summary: ok ? `Capability ${step.capabilityId} completed.` : `Capability ${step.capabilityId} failed.`,
        payload: ok ? output : error,
        createdAt: new Date().toISOString(),
      },
    };
  }

  private async stop(
    plan: NexusExecutionPlan,
    execution: NexusExecution,
    evidence: NexusEvidence[],
    stepOutcomes: StepOutcome[],
    outputsMap: Map<string, unknown>,
    status: "failed" | "partial",
    error: string,
  ) {
    execution.status = status;
    execution.completedAt = new Date().toISOString();
    execution.error = error;
    execution.stepOutcomes = stepOutcomes;
    execution.output = plan.steps.map((step) => outputsMap.get(step.id) ?? null);
    await this.persistExecution(execution);
    await this.emitEvent(plan, execution, status === "partial" ? "execution.partial" : "execution.failed", status, {
      error,
      succeededStepIds: stepOutcomes.filter((outcome) => outcome.ok).map((outcome) => outcome.stepId),
      failedStepIds: stepOutcomes.filter((outcome) => !outcome.ok).map((outcome) => outcome.stepId),
    });
    return { execution, evidence };
  }

  async execute(plan: NexusExecutionPlan): Promise<{ execution: NexusExecution; evidence: NexusEvidence[] }> {
    const execution: NexusExecution = { id: crypto.randomUUID(), planId: plan.id, status: "running", startedAt: new Date().toISOString() };
    const evidence: NexusEvidence[] = [];
    const stepOutcomes: StepOutcome[] = [];
    const retry = plan.retry ?? DEFAULT_RETRY;
    const outputsMap = new Map<string, unknown>();
    const completedSteps = new Set<string>();

    await this.persistExecution(execution);
    await this.emitEvent(plan, execution, "execution.started", "running", { planId: plan.id, stepCount: plan.steps.length });

    try {
      while (completedSteps.size < plan.steps.length) {
        const currentWave = plan.steps.filter((step) =>
          !completedSteps.has(step.id) &&
          (!step.dependsOn || step.dependsOn.every((dependency) => completedSteps.has(dependency))),
        );

        if (currentWave.length === 0) {
          return this.stop(
            plan,
            execution,
            evidence,
            stepOutcomes,
            outputsMap,
            stepOutcomes.some((outcome) => outcome.ok) ? "partial" : "failed",
            "Cyclic dependency detected or unresolved dependencies in plan steps.",
          );
        }

        const requiresApprovalStep = currentWave.find((step) => step.requiresApproval);
        if (requiresApprovalStep) {
          execution.status = "waiting";
          execution.error = "Approval required before execution.";
          execution.stepOutcomes = stepOutcomes;
          execution.output = plan.steps.map((step) => outputsMap.get(step.id) ?? null);
          await this.persistExecution(execution);
          await this.emitEvent(plan, execution, "execution.waiting", "waiting", { stepId: requiresApprovalStep.id, reason: execution.error });
          return { execution, evidence };
        }

        const runs = await Promise.all(currentWave.map((step) => this.runStep(plan, execution, step, retry)));
        for (const run of runs) {
          if (run.evidence) {
            evidence.push(run.evidence);
            await this.sink.recordEvidence(run.evidence);
          }
          await this.emitEvent(
            plan,
            execution,
            run.outcome.ok ? "execution.step.completed" : "execution.step.failed",
            run.outcome.ok ? "completed" : "failed",
            { stepId: run.outcome.stepId, capabilityId: run.outcome.capabilityId },
          );
          stepOutcomes.push(run.outcome);
          if (run.outcome.ok) {
            outputsMap.set(run.outcome.stepId, run.output);
            completedSteps.add(run.outcome.stepId);
          }
        }

        if (runs.some((run) => !run.outcome.ok)) {
          const succeeded = stepOutcomes.some((outcome) => outcome.ok);
          const failed = stepOutcomes.filter((outcome) => !outcome.ok);
          const detail = failed.map((outcome) => outcome.error ?? "failed").join("; ");
          return this.stop(
            plan,
            execution,
            evidence,
            stepOutcomes,
            outputsMap,
            succeeded ? "partial" : "failed",
            succeeded
              ? `Partial failure after successful side effects. Do not retry succeeded steps. ${failed.map((outcome) => `${outcome.stepId}: ${outcome.error ?? "failed"}`).join("; ")}`
              : detail,
          );
        }
      }

      execution.status = "completed";
      execution.completedAt = new Date().toISOString();
      execution.output = plan.steps.map((step) => outputsMap.get(step.id));
      execution.stepOutcomes = stepOutcomes;
      await this.persistExecution(execution);
      await this.emitEvent(plan, execution, "execution.completed", "completed", { outputCount: plan.steps.length });
      return { execution, evidence };
    } catch (error) {
      const succeeded = stepOutcomes.some((outcome) => outcome.ok);
      return this.stop(
        plan,
        execution,
        evidence,
        stepOutcomes,
        outputsMap,
        succeeded ? "partial" : "failed",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
