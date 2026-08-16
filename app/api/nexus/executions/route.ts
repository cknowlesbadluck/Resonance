import { NextResponse } from "next/server";

const executions: unknown[] = [];

export async function GET() { return NextResponse.json({ executions }); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.plan) return NextResponse.json({ error: "plan is required" }, { status: 400 });
  if (body.plan.approvalRequired) return NextResponse.json({ error: "approval_required", plan: body.plan }, { status: 202 });
  const execution = { id: crypto.randomUUID(), planId: body.plan.id, status: "completed", createdAt: new Date().toISOString(), output: { status: "simulated", steps: body.plan.steps?.length ?? 0 } };
  executions.unshift(execution);
  return NextResponse.json({ execution }, { status: 201 });
}
