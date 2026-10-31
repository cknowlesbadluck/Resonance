#!/usr/bin/env node
/**
 * Portfolio Entropy Reporter — read-only hygiene tool.
 * Lists open PR counts per plane and flags docs-only / potential close candidates.
 * Never merges. Never invents evidence. Fail-closed on network errors.
 *
 * Usage: node scripts/portfolio-entropy-report.mjs
 * Requires GH_TOKEN or gh auth.
 */

import { execSync } from 'node:child_process';

const planes = [
  { name: 'QuicksilverV1', owner: 'cknowlesbadluck', repo: 'QuicksilverV1' },
  { name: 'Conduit', owner: 'cknowlesbadluck', repo: 'Conduit' },
  { name: 'Resonance', owner: 'cknowlesbadluck', repo: 'Resonance' },
];

function countOpenPRs(owner, repo) {
  try {
    const out = execSync(
      `gh pr list --repo ${owner}/${repo} --state open --limit 100 --json number,title,labels,isDraft`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const prs = JSON.parse(out);
    const docsOnly = prs.filter(p => 
      /docs|audit|roadmap|hygiene|portfolio/i.test(p.title) && 
      !p.labels?.some(l => /enhancement|bug|security/i.test(l.name || ''))
    );
    return { total: prs.length, docsOnly: docsOnly.length, prs: prs.slice(0, 5).map(p => `#${p.number} ${p.title}`) };
  } catch (e) {
    return { total: 'error', docsOnly: 'error', prs: [e.message.slice(0, 100)] };
  }
}

console.log('# Portfolio Entropy Report — ' + new Date().toISOString());
console.log('Target: <10 open PRs per repo. Docs-only are close candidates if superseded.\n');

for (const p of planes) {
  const r = countOpenPRs(p.owner, p.repo);
  console.log(`## ${p.name}`);
  console.log(`Open PRs: ${r.total}`);
  console.log(`Potential docs-only: ${r.docsOnly}`);
  if (r.prs.length) {
    console.log('Sample:');
    r.prs.forEach(t => console.log('  - ' + t));
  }
  console.log('');
}

console.log('Highest-leverage: merge green non-overlapping hardens after CI. Do not invent device evidence.');
