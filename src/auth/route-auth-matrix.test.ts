import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Route-auth matrix: walks every app/api/** /route.ts and asserts that an
 * unauthenticated caller gets 401 before any validation, for GET with no
 * query and for POST with `{}` and with a non-JSON body.
 *
 * PUBLIC routes are intentionally unauthenticated (health/ready probes).
 * SIGNED routes authenticate by HMAC signature, not Bearer; they must still refuse (401/403/503).
 * KNOWN_GAPS validate before auth on main today; they are `it.fails` so CI stays green while
 * documenting the gap. When #243 (skills/resolve) and #244 (executions, events) merge, these
 * cases start passing, `it.fails` turns red, and the entry must be deleted (intended ratchet).
 */
const PUBLIC = new Set(["health", "ready"]);
const SIGNED = new Set(["webhooks/github"]);
const KNOWN_GAPS = new Set([
  "POST nexus/executions {}", "POST nexus/executions not-json",
  "POST events {}", "POST events not-json",
  "POST nexus/skills/resolve {}", "POST nexus/skills/resolve not-json",
]);
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : n === "route.ts" ? [p] : [];
  });
}

const API = join(process.cwd(), "app", "api");
const routes = walk(API).map((file) => ({ file, name: relative(API, file).split(sep).slice(0, -1).join("/") })).sort((a, b) => a.name.localeCompare(b.name));

const urlFor = (name: string) => `http://x/api/${name.replace("[id]", "00000000-0000-4000-8000-000000000001")}`;
const ctx = { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }) };

describe("route-auth matrix (unauthenticated => 401 first)", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env.RESONANCE_AUTH_MODE = "required";
    for (const k of ["NETLIFY", "CONTEXT", "VERCEL_ENV", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GITHUB_WEBHOOK_SECRET"]) delete process.env[k];
  });
  afterEach(() => { process.env = { ...saved }; });

  it("discovers the route tree", () => {
    expect(routes.length).toBeGreaterThanOrEqual(11);
  });

  for (const { file, name } of routes) {
    if (PUBLIC.has(name)) continue;
    describe(name, async () => {
      const mod = (await import(pathToFileURL(file).href)) as Record<string, (r: Request, c?: unknown) => Promise<Response>>;
      for (const method of METHODS) {
        const handler = mod[method];
        if (typeof handler !== "function") continue;
        const bodies: Array<[string, string | undefined]> = method === "GET" || method === "DELETE" ? [["no-query", undefined]] : [["{}", "{}"], ["not-json", "not json"]];
        for (const [label, body] of bodies) {
          const key = `${method} ${name} ${label}`;
          const run = async () => {
            const res = await handler(new Request(urlFor(name), { method, body, headers: body ? { "content-type": "application/json" } : {} }), ctx);
            if (SIGNED.has(name)) expect([401, 403, 503]).toContain(res.status);
            else expect(res.status).toBe(401);
          };
          if (KNOWN_GAPS.has(key)) it.fails(`${key} (known gap; fixed by #243/#244)`, run);
          else it(key, run);
        }
      }
    });
  }
});
