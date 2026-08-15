import { NextResponse } from "next/server";
import { adminClient, authenticate, audit } from "../../../lib/server";

export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    const { data, error } = await adminClient()
      .from("project_members")
      .select("project_id,role,projects(id,name,slug,description,created_at,updated_at)")
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ projects: data ?? [] });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!name || !slug) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const supabase = adminClient();
    const { data: project, error } = await supabase
      .from("projects")
      .insert({ name, slug, description: body.description ?? null, created_by: user.id })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });

    const { error: membershipError } = await supabase.from("project_members").insert({ project_id: project.id, user_id: user.id, role: "owner" });
    if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
    await audit(project.id, user.id, "project.created", "project", project.id, { name, slug });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
