#!/usr/bin/env node
/**
 * Portfolio Entropy Dashboard
 * Probes owned planes, counts open PRs, flags close candidates.
 * Fail-closed. No writes.
 * Usage: node portfolio-entropy-dashboard.mjs
 */
const REPOS = [
  { name: 'QuicksilverV1', owner: 'cknowlesbadluck' },
  { name: 'Resonance', owner: 'cknowlesbadluck' },
  { name: 'Conduit', owner: 'cknowlesbadluck' },
];

const PLANES = {
  conduit: 'https://conduit-feco.onrender.com/ready',
  resonance: 'https://resonancenexus.netlify.app/api/ready',
};

async function probe(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text.slice(0, 300) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function main() {
  console.log('=== Portfolio Entropy Dashboard ===');
  console.log(new Date().toISOString());

  console.log('\n--- Plane Probes ---');
  for (const [name, url] of Object.entries(PLANES)) {
    const p = await probe(url);
    console.log(`${name}: ${p.ok ? 'READY' : 'NOT READY'} (${p.status || p.error})`);
    if (p.body) console.log(`  ${p.body.replace(/\n/g, ' ')}`);
  }

  console.log('\n--- Open PR Counts (manual / requires GH token in real use) ---');
  console.log('Target: <10 per repo. Current known (2026-11-08): QS 17, Resonance 25, Conduit 19.');
  console.log('Noise close candidates:');
  console.log('  QS #413 (docs mirror)');
  console.log('  Resonance #253 (docs), #254 (gemini model), #255 (emit_event)');
  console.log('  Conduit #347 (docs), #348/#349 (Bolt micro-opts)');

  console.log('\n--- Recommendation ---');
  console.log('1. Close pure noise PRs (docs mirrors + pure micro-opts).');
  console.log('2. Merge green non-overlapping hardens after CI.');
  console.log('3. Record CHR-55 device IPA on real iPhone 16e / iOS 27.');
  console.log('4. Configure Resonance githubAdapter (GITHUB_TOKEN + webhook secret).');
  console.log('Entropy is the current killer. Do not invent owner evidence.');
}

main().catch(console.error);
