#!/usr/bin/env node
// entropy-prune-candidates.mjs — report open PRs that are close candidates
// Usage: node scripts/entropy-prune-candidates.mjs
// Scores by age, Jules/Bolt flag, docs-only title.
// Does not close anything; report-only for hygiene prune.

import { execSync } from 'child_process';

const repos = [
  'cknowlesbadluck/QuicksilverV1',
  'cknowlesbadluck/Resonance',
  'cknowlesbadluck/Conduit',
];

function gh(cmd) {
  return execSync(`gh ${cmd}`, { encoding: 'utf8' });
}

console.log('# Entropy Prune Candidates —', new Date().toISOString());
console.log('Target: open PRs <10 per repo. Close Jules micro-opts and pure docs mirrors first.\n');

for (const repo of repos) {
  const raw = gh(`pr list --repo ${repo} --state open --json number,title,createdAt,author,labels --limit 50`);
  const prs = JSON.parse(raw);
  console.log(`## ${repo} (${prs.length} open)`);
  const candidates = prs
    .map(pr => {
      const ageDays = Math.floor((Date.now() - new Date(pr.createdAt)) / 86400000);
      const isJules = (pr.title || '').includes('Bolt') || (pr.author?.login || '').includes('jules') || pr.labels?.some(l => l.name?.includes('jules'));
      const isDocs = (pr.title || '').toLowerCase().includes('docs') || (pr.title || '').toLowerCase().includes('audit');
      const score = (isJules ? 10 : 0) + (isDocs ? 5 : 0) + Math.min(ageDays, 30);
      return { ...pr, ageDays, isJules, isDocs, score };
    })
    .filter(p => p.score >= 8)
    .sort((a, b) => b.score - a.score);
  if (candidates.length === 0) {
    console.log('  No high-score close candidates.\n');
    continue;
  }
  for (const c of candidates.slice(0, 10)) {
    console.log(`  #${c.number} score=${c.score} age=${c.ageDays}d ${c.isJules ? 'JULES' : ''} ${c.isDocs ? 'DOCS' : ''} — ${c.title}`);
  }
  console.log('');
}

console.log('Highest-value: close Jules and docs-only first, then merge green non-overlapping hardens.');
