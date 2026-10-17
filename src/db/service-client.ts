import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The single place the server builds a service-role Supabase client.
 *
 * Returns null unless both NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set, so callers
 * keep their existing "persistence not configured" fallbacks. The client never persists a session
 * (server-only, no browser storage). Pass `{ autoRefreshToken: false }` for one-shot clients that only
 * verify a caller's token.
 *
 * Server code only: never import this from a client component (the service-role key must not ship).
 */
export type ServiceClientOptions = { autoRefreshToken?: false };

export function serviceRoleConfig(env: NodeJS.ProcessEnv = process.env): { url: string; key: string } | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

export function createServiceRoleClient(
  options: ServiceClientOptions = {},
  env: NodeJS.ProcessEnv = process.env,
): SupabaseClient | null {
  const config = serviceRoleConfig(env);
  if (!config) return null;
  const auth = options.autoRefreshToken === false
    ? { persistSession: false, autoRefreshToken: false }
    : { persistSession: false };
  return createClient(config.url, config.key, { auth });
}
