import { NextResponse } from "next/server";
import { adminClient, requireProjectMember } from "../../../lib/server";

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
    return NextResponse.json({
      integrations: integrations.data ?? [],
      agents: agents.data ?? [],
      skills: skills.data ?? [],
      mcp_servers: mcpServers.data ?? [],
      workflows: workflows.data ?? [],
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
