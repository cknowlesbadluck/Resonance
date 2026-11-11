import { createClient } from "@supabase/supabase-js";

export type NexusRequestAuth = { userId: string; projectId: string };
export type NexusRequestUser = { userId: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * RESONANCE_AUTH_MODE (fail closed):
 * - required (and the DEFAULT when unset/blank): demand Bearer + project membership.
 *   With Supabase env missing, every protected request is refused (401).
 * - optional: LOCAL DEV OPT-OUT ONLY. Honoured only outside production
 *   (NODE_ENV !== "production" and RESONANCE_DEPLOY_STAGE !== "production").
 *   In production it is ignored and auth is required.
 * - auto: legacy; requires auth when Supabase URL + service role are configured,
 *   and always in production.
 * - anything else: required.
 */
function isProductionEnv(env: NodeJS.Dict<string>): boolean {
  return env.NODE_ENV === "production" || env.RESONANCE_DEPLOY_STAGE === "production";
}

export function authRequired(env: NodeJS.Dict<string> = process.env): boolean {
  const mode = (env.RESONANCE_AUTH_MODE ?? "").trim().toLowerCase();
  const production = isProductionEnv(env);
  if (mode === "optional") return production;
  if (mode === "auto") {
    return production || Boolean(env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL);
  }
  return true;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Verify the Bearer token independently of a project ID so routes can fail closed before parsing request bodies. */
export async function authenticateNexusUser(request: Request): Promise<NexusRequestUser | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;
  const db = adminClient();
  if (!db) return null;
  const {
    data: { user },
    error,
  } = await db.auth.getUser(token);
  if (error || !user) return null;
  return { userId: user.id };
}

/** Check project membership only after the route has safely parsed its project identifier. */
export async function authorizeNexusProject(userId: string, projectId: unknown): Promise<boolean> {
  if (!isUuid(projectId)) return false;
  const db = adminClient();
  if (!db) return false;
  const { data: membership, error } = await db
    .from("project_members")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && Boolean(membership);
}

export async function authenticateNexusRequest(
  request: Request,
  projectId: unknown,
): Promise<NexusRequestAuth | null> {
  const user = await authenticateNexusUser(request);
  if (!user || !(await authorizeNexusProject(user.userId, projectId)) || !isUuid(projectId)) return null;
  return { userId: user.userId, projectId };
}
