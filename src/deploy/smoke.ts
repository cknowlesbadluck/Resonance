export type SmokeMethod = "GET" | "POST";

export type SmokeCase = {
  id: string;
  method: SmokeMethod;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  /** Statuses that pass today. */
  expectStatus: number[];
  /** Fail-closed target; when set and the live status is outside it, the case passes as "transitional". */
  targetStatus?: number[];
  why: string;
};

/** Public, unauthenticated probes; everything else must refuse anonymous callers. */
export const PUBLIC_SMOKE_PATHS = ["/api/health", "/api/ready"];

/**
 * Host-neutral production smoke. Mirrors scripts/production-smoke-cases.mjs (parity is tested).
 * Every non-public route must accept 401 and never 200 for an anonymous caller.
 */
export function productionSmokeCases(): SmokeCase[] {
  return [
    { id: "health", method: "GET", path: "/api/health", expectStatus: [200], why: "Process liveness must succeed without secrets." },
    { id: "ready", method: "GET", path: "/api/ready", expectStatus: [200, 503], why: "Readiness is structured even when the env contract is incomplete." },
    {
      id: "executions-post-unauth",
      method: "POST",
      path: "/api/nexus/executions",
      headers: { "content-type": "application/json" },
      body: { objective: "deployment-stage smoke", requirements: [{ key: "demo.read" }], projectId: "00000000-0000-4000-8000-000000000001" },
      expectStatus: [400, 401],
      targetStatus: [401],
      why: "Unauthenticated initiation must be refused. 400 (missing Idempotency-Key) is accepted only until #244 (401 before validation) is live.",
    },
    { id: "executions-get-unauth", method: "GET", path: "/api/nexus/executions?projectId=00000000-0000-4000-8000-000000000001", expectStatus: [401], why: "Production requires auth for listing." },
    { id: "executions-get-bad-limit", method: "GET", path: "/api/nexus/executions?limit=abc", expectStatus: [401], why: "Auth precedes query validation." },
    { id: "events-get-unauth", method: "GET", path: "/api/events", expectStatus: [401], why: "Event reads require auth." },
    { id: "events-post-unauth", method: "POST", path: "/api/events", headers: { "content-type": "application/json" }, body: {}, expectStatus: [400, 401], targetStatus: [401], why: "400 accepted only until #244 is live." },
    { id: "skills-resolve-post-unauth", method: "POST", path: "/api/nexus/skills/resolve", headers: { "content-type": "application/json" }, body: {}, expectStatus: [400, 401], targetStatus: [401], why: "400 accepted only until #243 is live." },
    { id: "intents-post-unauth", method: "POST", path: "/api/nexus/intents", headers: { "content-type": "application/json" }, body: {}, expectStatus: [401], why: "Intent composition requires auth." },
    { id: "resume-post-unauth", method: "POST", path: "/api/nexus/executions/smoke-id/resume", headers: { "content-type": "application/json" }, body: {}, expectStatus: [401], why: "Resume requires auth." },
    { id: "resume-long-id-unauth", method: "POST", path: `/api/nexus/executions/${"a".repeat(600)}/resume`, headers: { "content-type": "application/json" }, body: {}, expectStatus: [400, 401], targetStatus: [401], why: "400 (id too long) accepted only until #246 is live." },
    { id: "webhook-github-unsigned", method: "POST", path: "/api/webhooks/github", headers: { "content-type": "application/json" }, body: {}, expectStatus: [401], why: "Unsigned webhooks are rejected." },
  ];
}

export function smokePassed(status: number, expectStatus: number[]): boolean {
  return expectStatus.includes(status);
}
