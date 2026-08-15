import { NextResponse } from "next/server";
import { adminClient, audit, requireProjectMember } from "../../../lib/server";
import { capabilities } from "../../../lib/integrations";

export async function GET(request: Request) {
  try {
    const projectId = new URL(request.url).searchParams.get("project_id");
    if (!projectId) return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    await requireProjectMember(request, projectId);
    const supabase = adminClient();
    const [integrations, agents, skills, mcpServers, workflows] = await Promise.all([
      supabase.from("integrations").select("*").eq("project_id", projectId).order("created_at"),
      supabase.from("agents").select("*").eq("project_id", projectId).order("created_at"),
      supabase.from("skills").select("*").eq("project_id", projectId).order("created_at"),
      supabase.from("mcp_servers").select("*").eq("project_id", projectId).order("created_at"),
      supabase.from("workflows").select("*").eq("project_id", projectId).order("created_at"),
    ]);
    const failure = [integrations, agents, skills, mcpServers, workflows].find((result) => result.error);
    if (failure?.error) return NextResponse.json({ error: failure.error.message }, { status: 500 });
    return NextResponse.json({ integrations: integrations.data ?? [], agents: agents.data ?? [], skills: skills.data ?? [], mcp_servers: mcpServers.data ?? [], workflows: workflows.data ?? [] });
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
    if (role === "viewer") return NextResponse.json({ error: "Viewer role cannot modify the registry" }, { status: 403 });

    const kind = body.kind as string;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!name || !slug) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const supabase = adminClient();
    let result;
    if (kind === "integration") {
      const provider = typeof body.provider === "string" ? body.provider : "";
      if (!provider || !capabilities[provider]) return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
      const { data: providerRow } = await supabase.from("providers").select("id").eq("key", provider).single();
      result = await supabase.from("integrations").insert({ project_id: projectId, provider_id: providerRow?.id ?? null, provider, name, status: "pending", capabilities: capabilities[provider], metadata: body.metadata ?? {} }).select("*").single();
    } else if (kind === "agent") {
      result = await supabase.from("agents").insert({ project_id: projectId, name, slug, description: body.description ?? null, model: body.model ?? null, capabilities: body.capabilities ?? [], permissions: body.permissions ?? [], config: body.config ?? {} }).select("*").single();
    } else if (kind === "skill") {
      result = await supabase.from("skills").insert({ project_id: projectId, name, slug, description: body.description ?? null, version: body.version ?? "1.0.0", config: body.config ?? {} }).select("*").single();
    } else if (kind === "mcp_server") {
      result = await supabase.from("mcp_servers").insert({ project_id: projectId, name, slug, endpoint: body.endpoint ?? null, transport: body.transport ?? null, status: "disabled", tools: body.tools ?? [], permissions: body.permissions ?? [], metadata: body.metadata ?? {} }).select("*").single();
    } else {
      return NextResponse.json({ error: "kind must be integration, agent, skill, or mcp_server" }, { status: 400 });
    }

    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 409 });
    await audit(projectId, user.id, `registry.${kind}.created`, kind, result.data.id, { name, slug });
    return NextResponse.json({ item: result.data }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 400 });
  }
}
