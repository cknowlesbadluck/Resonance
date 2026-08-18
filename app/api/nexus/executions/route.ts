import { NextResponse } from "next/server";
import { composeDemoIntent, nexusAdapters } from "../../../../src/nexus/runtime";
import { NexusExecutor } from "../../../../src/nexus/executor";
import { createNexusPersistenceFromEnv } from "../../../../src/nexus/persistence/supabase";
import type { NexusEvidence, NexusIntent } from "../../../../src/nexus/types";

const executions: unknown[] = [];
const evidence: unknown[] = [];
const persistence = createNexusPersistenceFromEnv();
const sink = {
  recordEvidence: async (item: NexusEvidence) => {
    evidence.unshift(item);
    if (persistence) await persistence.saveEvidence(item, process.env.RESONANCE_PROJECT_ID);
  },
};

export async function GET() { return NextResponse.json({ executions, evidence }); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Partial<NexusIntent> | null;
  if (!body?.objective || !body.requestedBy || !Array.isArray(body.requirements)) return NextResponse.json({ error: "objective, requestedBy and requirements are required" }, { status: 400 });
  const intent: NexusIntent = {
    id: body.id ?? crypto.randomUUID(),
    projectId: body.projectId ?? process.env.RESONANCE_PROJECT_ID ?? "00000000-0000-4000-8000-000000000001",
    objective: body.objective,
    requestedBy: body.requestedBy,
    requirements: body.requirements,
    contextRefs: body.contextRefs ?? [],
  };
  try {
    const plan = composeDemoIntent(intent);
    if (plan.approvalRequired) return NextResponse.json({ intent, plan, status: "approval_required" }, { status: 202 });
    const result = await new NexusExecutor(nexusAdapters, sink).execute(plan);
    executions.unshift(result.execution);
    if (persistence) await persistence.saveExecution(result.execution, intent.projectId);
    return NextResponse.json({ intent, plan, ...result }, { status: result.execution.status === "completed" ? 201 : 422 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
