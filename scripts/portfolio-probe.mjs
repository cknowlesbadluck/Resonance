#!/usr/bin/env node
// Pure cross-plane probe. No secrets. Not production proof.
// Usage: node scripts/portfolio-probe.mjs

const targets = [
  { name: 'resonance-ready', url: 'https://resonancenexus.netlify.app/api/ready' },
  { name: 'resonance-health', url: 'https://resonancenexus.netlify.app/api/health' },
  { name: 'conduit-health', url: 'https://conduit-feco.onrender.com/health' },
  { name: 'conduit-ready', url: 'https://conduit-feco.onrender.com/ready' },
  { name: 'vercel-alias', url: 'https://resonanceplane.vercel.app/api/ready' },
];

async function probe(t) {
  try {
    const res = await fetch(t.url, { signal: AbortSignal.timeout(12000) });
    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* plain */ }
    const missing = body?.missingRequired ?? [];
    const classification =
      res.status === 503 && missing.includes('SUPABASE_SERVICE_ROLE_KEY') ? 'owner-gate' :
      res.status === 404 && text.includes('DEPLOYMENT_NOT_FOUND') ? 'alias-absent' :
      res.status === 200 ? 'live' :
      'other';
    return { name: t.name, status: res.status, classification, missing, bodySnippet: text.slice(0, 240) };
  } catch (e) {
    return { name: t.name, error: String(e) };
  }
}

const results = await Promise.all(targets.map(probe));
const ownerGate = results.find(r => r.classification === 'owner-gate');
console.log(JSON.stringify({
  probedAt: new Date().toISOString(),
  bindingConstraint: ownerGate ? 'SUPABASE_SERVICE_ROLE_KEY on Netlify' : 'unknown',
  results,
}, null, 2));
process.exit(ownerGate ? 0 : 1); // exit 0 while the known owner gate is still the constraint
