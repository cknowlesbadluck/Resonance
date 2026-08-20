import { createClient } from "@supabase/supabase-js";

export type NexusRequestAuth = { userId: string; projectId: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Authenticate a Nexus API request.
 * Requires Bearer token + project membership.
 * Returns null when auth fails (caller maps to 401).
 */
export async function authenticateNexusRequest(
  request: Request,
  projectId: unknown,
): Promise<NexusRequestAuth | null> {
  if (!isUuid(projectId)) return null;
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !serviceKey) return null;

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userError,
  } = await db.auth.getUser(token);
  if (userError || !user) return null;

  const { data: membership, error: membershipError } = await db
    .from("project_members")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError || !membership) return null;

  return { userId: user.id, projectId };
}
