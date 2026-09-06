export type SmokeMethod = "GET" | "POST";

export type SmokeCase = {
  id: string;
  method: SmokeMethod;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  expectStatus: number[];
  why: string;
};

/** Host-neutral production smoke. Fail closed on missing Idempotency-Key. */
export function productionSmokeCases(): SmokeCase[] {
  return [
    {
      id: "health",
      method: "GET",
      path: "/api/health",
      expectStatus: [200],
      why: "Process liveness must succeed without secrets.",
    },
    {
      id: "ready",
      method: "GET",
      path: "/api/ready",
      expectStatus: [200, 503],
      why: "Readiness is structured even when the env contract is incomplete.",
    },
    {
      id: "idempotency-required",
      method: "POST",
      path: "/api/nexus/executions",
      headers: { "content-type": "application/json" },
      body: {
        objective: "deployment-stage smoke",
        requirements: [{ key: "demo.read" }],
        projectId: "00000000-0000-4000-8000-000000000001",
      },
      expectStatus: [400],
      why: "Execution initiation without Idempotency-Key must be 400.",
    },
    {
      id: "executions-auth-boundary",
      method: "GET",
      path: "/api/nexus/executions?projectId=00000000-0000-4000-8000-000000000001",
      expectStatus: [200, 401],
      why: "401 when auth is required; 200 only in optional/auto without a configured store.",
    },
  ];
}

export function smokePassed(status: number, expectStatus: number[]): boolean {
  return expectStatus.includes(status);
}
