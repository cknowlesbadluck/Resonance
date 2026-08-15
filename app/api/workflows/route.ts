import { NextResponse } from "next/server";
import { adminClient, audit, requireProjectMember } from "../../../lib/server";
import { validateDefinition } from "../../../lib/workflow-engine";

export async function GET(request: Request) {
  try {
    const projectId = new URL(request.url).searchParams.get("project_id");
    if (!projectId) return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    await requireProjectMember(request, projectId);
    const { data, error } = await adminClient().from("workflows").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ workflows: data ?? [] });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = typeof body.project_id === "string" ? body.project_id : "";
    if (!projectId) return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    const { user, role } = await requireProjectMember(request, projectId);
    if (role === "viewer") return NextResponse.json({ error: "Viewer role cannot create workflows" }, { status: 403 });

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!name || !slug) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const definition = validateDefinition(body.definition);

    const { data: workflow, error } = await adminClient().from("workflows").insert({
      project_id: projectId,
      name,
      slug,
      description: body.description ?? null,
      definition,
      enabled: body.enabled !== false,
    }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    await audit(projectId, user.id, "workflow.created", "workflow", workflow.id, { name, slug });
    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 400 });
  }
}
