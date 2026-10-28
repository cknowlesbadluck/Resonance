#!/usr/bin/env node
// portfolio-ready-check.mjs
// Fail-closed probe of owned planes: Conduit + Resonance Netlify.
// Exits 0 only if both ready. Exponential backoff for cold-start.
// No secrets. Read-only. No writes.

import { setTimeout as sleep } from 'node:timers/promises';

const planes = [
  { name: 'conduit', url: 'https://conduit-feco.onrender.com/ready', expect: (j) => j.status === 'ready' && j.production === true },
  { name: 'resonance-netlify', url: 'https://resonancenexus.netlify.app/api/ready', expect: (j) => j.status === 'ready' && j.missingRequired?.length === 0 && j.posture === 'contract_passed' },
];

async function probe(url, retries = 4) {
  const delays = [0, 10000, 20000, 30000, 45000];
  for (let i = 0; i <= retries; i++) {
    if (delays[i]) await sleep(delays[i]);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } });
      clearTimeout(t);
      if (!res.ok) continue;
      const j = await res.json();
      return { ok: true, body: j };
    } catch (e) {
      if (i === retries) return { ok: false, error: String(e) };
    }
  }
  return { ok: false, error: 'exhausted retries' };
}

async function main() {
  let allReady = true;
  const results = [];
  for (const p of planes) {
    const r = await probe(p.url);
    const ready = r.ok && p.expect(r.body);
    results.push({ name: p.name, ready, detail: r.ok ? r.body : r.error });
    if (!ready) allReady = false;
    console.log(`${p.name}: ${ready ? 'READY' : 'NOT READY'}`);
  }
  if (!allReady) {
    console.error('PORTFOLIO NOT READY');
    process.exit(1);
  }
  console.log('PORTFOLIO READY');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
