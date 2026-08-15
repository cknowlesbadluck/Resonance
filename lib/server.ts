import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ResonanceUser = { id: string; email?: string };

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function adminClient(): SupabaseClient {
  return createClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function authenticate(request: Request): Promise<ResonanceUser> {
  const header = request.headers.get("authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });

  const supabase = adminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Response(JSON.stringify({ error: "Invalid access token" }), { status: 401 });
  return { id: data.user.id, email: data.user.email };
}

export async function requireProjectMember(request: Request, projectId: string) {
  const user = await authenticate(request);
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!data) throw new Response(JSON.stringify({ error: "Project access denied" }), { status: 403 });
  return { user, role: data.role as "owner" | "admin" | "member" | "viewer" };
}

export async function audit(
  projectId: string,
  actorUserId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  payload: Record<string, unknown> = {},
) {
  const { error } = await adminClient().from("audit_events").insert({
    project_id: projectId,
    actor_user_id: actorUserId,
    actor_type: "user",
    action,
    resource_type: resourceType ?? null,
    resource_id: resourceId ?? null,
    payload,
  });
  if (error) throw new Error(`Audit write failed: ${error.message}`);
}

export function capabilityAllowed(
  role: "owner" | "admin" | "member" | "viewer",
  level: string | undefined,
) {
  if (!level || level === "read" || level === "analyze") return true;
  return role === "owner" || role === "admin";
}
