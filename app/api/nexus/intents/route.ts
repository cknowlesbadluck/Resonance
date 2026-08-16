import { NextResponse } from "next/server";
import { composeDemoIntent } from "../../../../src/nexus/runtime";
import type { NexusIntent } from "../../../../src/nexus/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Partial<NexusIntent> | null;
  if (!body?.objective || !body.requestedBy || !Array.isArray(body.requirements)) return NextResponse.json({ error: "objective, requestedBy and requirements are required" }, { status: 400 });
  try {
    const intent: NexusIntent = { id: body.id ?? crypto.randomUUID(), projectId: body.projectId ?? "demo", objective: body.objective, requestedBy: body.requestedBy, requirements: body.requirements, contextRefs: body.contextRefs ?? [] };
    return NextResponse.json({ intent, plan: composeDemoIntent(intent) }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
