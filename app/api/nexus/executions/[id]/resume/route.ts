import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authRequired, authenticateNexusRequest } from "../../../../../../src/auth/nexus-request";
import { composeDemoIntent, nexusAdapters } from "../../../../../../src/nexus/runtime";
import { NexusExecutor } from "../../../../../../src/nexus/executor";
import { createNexusPersistenceFromEnv } from "../../../../../../src/nexus/persistence/supabase";
import type { NexusEvidence, NexusIntent } from "../../../../../../src/nexus/types";

function dbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/**
 * Resume an execution that previously returned approval_required.
 * Pre-authorized as non-critical under Two-Key (ARCHITECTURE.md).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "execution or request id is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({})) as {
    projectId?: string;
    approved?: boolean;
  };

  const projectId = body.projectId ?? process.env.RESONANCE_PROJECT_ID ?? null;
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) {
      return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    }
  }

  if (body.approved === false) {
    return NextResponse.json({ status: "cancelled", id }, { status: 200 });
  }

  const db = dbClient();
  const persistence = createNexusPersistenceFromEnv();

  let intent: NexusIntent | null = null;
  if (db && projectId) {
    const { data } = await db
      .from("nexus_execution_requests")
      .select("response,status,idempotency_key")
      .eq("project_id", projectId)
      .or(`execution_id.eq.${id},idempotency_key.eq.${id}`)
      .maybeSingle();

    if (data?.response && typeof data.response === "object" && data.response !== null) {
      const response = data.response as { intent?: NexusIntent; status?: string };
      if (response.intent) intent = response.intent;
    }
  }

  if (!intent) {
    return NextResponse.json(
      { error: "No resumable approval_required intent found for id" },
      { status: 404 },
    );
  }

  try {
    const plan = composeDemoIntent(intent);
    // Force resume past approval for this explicit resume call
    plan.approvalRequired = false;
    for (const step of plan.steps) step.requiresApproval = false;

    const evidence: NexusEvidence[] = [];
    const sink = {
      recordEvidence: async (item: NexusEvidence) => {
        evidence.unshift(item);
        if (persistence) await persistence.saveEvidence(item, intent!.projectId);
      },
    };

    const result = await new NexusExecutor(nexusAdapters, sink).execute(plan);
    if (persistence) await persistence.saveExecution(result.execution, intent.projectId);

    if (db && projectId) {
      await db.from("nexus_execution_requests").update({
        execution_id: result.execution.id,
        status: result.execution.status,
        response: { intent, plan, ...result },
        updated_at: new Date().toISOString(),
      }).eq("project_id", projectId).eq("idempotency_key", id);
    }

    return NextResponse.json(
      { intent, plan, ...result, resumed: true },
      { status: result.execution.status === "completed" ? 200 : 422 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 422 },
    );
  }
}
