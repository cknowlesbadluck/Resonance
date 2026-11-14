#!/usr/bin/env node
// owner-action-queue.mjs
// Fail-closed listing of known owner-gated actions for the portfolio.
// Read-only. No secrets. No network. No writes. No invention of evidence.
// Run: node scripts/owner-action-queue.mjs

const queue = [
  {
    id: 'RES-265',
    repo: 'Resonance',
    pr: 265,
    title: 'RLS/ACL lockdown migration',
    status: 'ready, CI green, NOT APPLIED',
    action: 'Owner must review and explicitly authorize production application of the ordered Supabase migration. Live DB still has broader PUBLIC policies until applied.',
    priority: 'CRITICAL',
    risk: 'Security posture incomplete until applied.',
  },
  {
    id: 'RES-208',
    repo: 'Resonance',
    pr: 208,
    title: 'Composite indexes for list queries',
    status: 'migration file only, NOT APPLIED',
    action: 'Owner apply CREATE INDEX CONCURRENTLY after review. Additive.',
    priority: 'HIGH',
    risk: 'List query cost grows with history.',
  },
  {
    id: 'RES-GITHUB',
    repo: 'Resonance',
    pr: null,
    title: 'Configure githubAdapter',
    status: 'githubAdapterConfigured=false on /api/ready',
    action: 'Set GITHUB_TOKEN + webhook secret on Netlify. Low priority until entropy down.',
    priority: 'MEDIUM',
    risk: 'Adapter vertical incomplete.',
  },
  {
    id: 'QS-CHR55',
    repo: 'QuicksilverV1',
    pr: null,
    title: 'CHR-55 device Archive IPA evidence',
    status: 'deviceAcceptance=not_recorded',
    action: 'Record real iPhone 16e / iOS 27 Archive IPA install and acceptance. Simulator/CI insufficient. Sole production gate.',
    priority: 'CRITICAL',
    risk: 'Cannot claim production-ready without it.',
  },
  {
    id: 'CON-HONO',
    repo: 'Conduit',
    pr: null,
    title: 'Hono medium security patches',
    status: 'Dependabot open, upgrade >=4.13.16',
    action: 'Pin or merge Dependabot PR for Hono. Runtime scope.',
    priority: 'MEDIUM',
    risk: 'CSRF, mount bypass, validator issues possible.',
  },
  {
    id: 'QS-UNDICI',
    repo: 'QuicksilverV1',
    pr: null,
    title: 'undici high alerts in gateway',
    status: 'dev scope, open Dependabot',
    action: 'Upgrade undici in gateway/package-lock.json. Dev-only impact today.',
    priority: 'LOW',
    risk: 'TLS/cache/DoS if gateway uses affected paths.',
  },
];

function main() {
  console.log('Owner Action Queue — Portfolio (read-only, no invention)');
  console.log('Generated:', new Date().toISOString());
  console.log('');
  const byPriority = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] };
  for (const item of queue) {
    byPriority[item.priority].push(item);
  }
  for (const p of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
    if (byPriority[p].length === 0) continue;
    console.log(`## ${p}`);
    for (const item of byPriority[p]) {
      console.log(`- [${item.id}] ${item.repo}${item.pr ? ' #' + item.pr : ''}: ${item.title}`);
      console.log(`  Status: ${item.status}`);
      console.log(`  Action: ${item.action}`);
      console.log(`  Risk: ${item.risk}`);
      console.log('');
    }
  }
  console.log('Do not apply migrations or set env without explicit owner authorization.');
  console.log('deviceAcceptance remains not_recorded until owner records real evidence.');
}

main();
