import { isProductionRuntime } from "../deploy/contract";

/**
 * Production must not answer with process memory or with auth turned off.
 * Returns an error string when the request must be refused, otherwise null.
 */
export function productionUserDataBlock(env: NodeJS.Dict<string> = process.env): string | null {
  if (!isProductionRuntime(env)) return null;
  const missing: string[] = [];
  if (!env.NEXT_PUBLIC_SUPABASE_URL?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if ((env.RESONANCE_AUTH_MODE ?? "").trim().toLowerCase() !== "required") missing.push("RESONANCE_AUTH_MODE=required");
  if (missing.length === 0) return null;
  return `Production configuration is incomplete (${missing.join(", ")}). Refusing in-memory or unauthenticated user data.`;
}
