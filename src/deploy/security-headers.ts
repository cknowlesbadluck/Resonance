export type SecurityHeader = { key: string; value: string };

const BASE_HEADERS: readonly SecurityHeader[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

function supabaseConnectSources(env: NodeJS.Dict<string>): string[] {
  const raw = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return [];
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return [];
    return [url.origin, `wss://${url.host}`];
  } catch {
    return [];
  }
}

/**
 * Host-neutral response headers. CSP allows the control surface and the configured
 * Supabase project, and nothing else. No eval. Frame ancestors are denied.
 */
export function contentSecurityPolicy(env: NodeJS.Dict<string> = process.env): string {
  const production = env.NODE_ENV === "production" || env.RESONANCE_DEPLOY_STAGE === "production";
  const connect = ["'self'", ...supabaseConnectSources(env)].join(" ");
  // Next.js dev uses eval for refresh. Production must not.
  const scriptSrc = !production && env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${connect}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export function securityHeaders(env: NodeJS.Dict<string> = process.env): SecurityHeader[] {
  const headers: SecurityHeader[] = [...BASE_HEADERS];
  const production = env.NODE_ENV === "production" || env.RESONANCE_DEPLOY_STAGE === "production";
  if (production) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  }
  headers.push({ key: "Content-Security-Policy", value: contentSecurityPolicy(env) });
  return headers;
}
