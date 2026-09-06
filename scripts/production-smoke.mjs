#!/usr/bin/env node
/**
 * Host-neutral production smoke for Resonance.
 * Set SMOKE_BASE_URL to the live control plane (currently Netlify).
 * Exits 0 when every case matches its allowed status set.
 */
const base = (process.env.SMOKE_BASE_URL ?? "").replace(/\/$/, "");
if (!base) {
  console.log("production-smoke: skip (SMOKE_BASE_URL unset)");
  process.exit(0);
}

const cases = [
  { id: "health", method: "GET", path: "/api/health", expect: [200] },
  { id: "ready", method: "GET", path: "/api/ready", expect: [200, 503] },
  {
    id: "idempotency-required",
    method: "POST",
    path: "/api/nexus/executions",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      objective: "deployment-stage smoke",
      requirements: [{ key: "demo.read" }],
      projectId: "00000000-0000-4000-8000-000000000001",
    }),
    expect: [400],
  },
  {
    id: "executions-auth-boundary",
    method: "GET",
    path: "/api/nexus/executions?projectId=00000000-0000-4000-8000-000000000001",
    expect: [200, 401],
  },
];

const results = [];
for (const item of cases) {
  const response = await fetch(`${base}${item.path}`, {
    method: item.method,
    headers: item.headers,
    body: item.body,
  });
  const ok = item.expect.includes(response.status);
  let snippet = "";
  try {
    snippet = (await response.text()).slice(0, 240);
  } catch {
    snippet = "";
  }
  results.push({ id: item.id, status: response.status, ok, snippet });
  console.log(`${ok ? "PASS" : "FAIL"} ${item.id} → ${response.status} (allowed ${item.expect.join(",")})`);
}

if (results.some((item) => !item.ok)) {
  console.error(JSON.stringify({ base, results }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ base, passed: results.length }));
