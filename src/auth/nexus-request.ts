import { createClient } from "@supabase/supabase-js";

export type NexusRequestAuth = { userId: string; projectId: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Explicit local-development opt-in that allows `auto` mode to run without auth when
 * Supabase is not configured. Never set this in a deployed environment.
 */
export const DEV_ANONYMOUS_OPT_IN_ENV = "RESONANCE_DEV_ALLOW_ANONYMOUS";

function devAnonymousOptIn(): boolean {
  const raw = (process.env[DEV_ANONYMOUS_OPT_IN_ENV] ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/**
 * RESONANCE_AUTH_MODE:
 * - required: always demand Bearer + membership (fail closed if env incomplete)
 * - optional: never demand auth (explicit opt-out; production-boundary still refuses it in prod)
 * - auto (default): demand auth. If Supabase URL + service role are missing this fails
 *   closed (every request is rejected) unless RESONANCE_DEV_ALLOW_ANONYMOUS=true is set
 *   for local development.
 */
export function authRequired(): boolean {
  const mode = (process.env.RESONANCE_AUTH_MODE ?? "").trim().toLowerCase() || "auto";
  if (mode === "required") return true;
  if (mode === "optional") return false;
  if (mode === "auto") {
    const supabaseConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (supabaseConfigured) return true;
    return !devAnonymousOptIn();
  }
  // Fail closed on any unrecognized mode
  return true;
}

/**
 * When a request is not authenticated, a client-supplied `requestedBy` is only a claim.
 * Prefix it so it can never be confused with (or impersonate) a verified user id.
 */
export function unauthenticatedActor(claimed: unknown): string {
  const value = typeof claimed === "string" ? claimed.trim().slice(0, 128) : "";
  return value ? `unauthenticated:${value}` : "unauthenticated";
}

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
