#!/usr/bin/env node
// Presence-only probe. Never prints secret values. Exit 0 ready, 2 owner-blocked, 1 other failure.
const url = process.argv[2] ?? process.env.RESONANCE_READY_URL ?? "https://resonancenexus.netlify.app/api/ready";
const response = await fetch(url, { headers: { "cache-control": "no-store" } });
const body = await response.json();
const missing = Array.isArray(body.missingRequired) ? body.missingRequired : [];
const summary = {
  url,
  http: response.status,
  status: body.status ?? "unknown",
  missingRequired: missing,
  persistenceConfigured: body.persistenceConfigured === true,
  githubAdapterConfigured: body.githubAdapterConfigured === true,
};
console.log(JSON.stringify(summary));
if (response.status === 200 && body.status === "ready") process.exit(0);
if (missing.length > 0) process.exit(2);
process.exit(1);
