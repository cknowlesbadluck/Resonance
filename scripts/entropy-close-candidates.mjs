#!/usr/bin/env node
/**
 * Entropy close-candidate prioritizer.
 * Scores open PRs by age, docs-only/Bolt/Jules/draft flags, and recommends closes.
 * Fail-closed: report-only. Never auto-closes.
 * Usage: node scripts/entropy-close-candidates.mjs
 */
const candidates = [
  { repo: 'QuicksilverV1', number: 413, title: 'docs: mirror portfolio audit', flags: ['docs'], ageDays: 2 },
  { repo: 'QuicksilverV1', number: 284, title: '#252: LoggerService → checked Sendable', flags: ['draft'], ageDays: 22 },
  { repo: 'Conduit', number: 348, title: '⚡ Bolt: direct string comparison', flags: ['bolt'], ageDays: 1 },
  { repo: 'Conduit', number: 347, title: 'docs: portfolio audit 2026-11-04', flags: ['docs'], ageDays: 2 },
  { repo: 'Conduit', number: 338, title: 'docs: Conduit mirror of roadmap', flags: ['docs'], ageDays: 3 },
  { repo: 'Resonance', number: 253, title: 'docs: portfolio full audit 2026-11-04', flags: ['docs'], ageDays: 2 },
  { repo: 'Resonance', number: 250, title: 'DRAFT two-key: policy gate', flags: ['draft', 'do-not-merge'], ageDays: 11 },
  { repo: 'Resonance', number: 189, title: 'build(deps): bump the actions group', flags: ['dependabot'], ageDays: 1 },
];

function score(pr) {
  let s = pr.ageDays * 2;
  if (pr.flags.includes('docs')) s += 50;
  if (pr.flags.includes('bolt') || pr.flags.includes('jules')) s += 40;
  if (pr.flags.includes('draft')) s += 30;
  if (pr.flags.includes('dependabot')) s += 20;
  if (pr.flags.includes('do-not-merge')) s += 100;
  return s;
}

const ranked = candidates
  .map(pr => ({ ...pr, score: score(pr) }))
  .sort((a, b) => b.score - a.score);

console.log('# Entropy close-candidate report (2026-11-06 09Z)');
console.log('Report-only. Confirm before close. Target open PRs <10/repo.\n');
for (const pr of ranked) {
  console.log(`[${pr.score}] ${pr.repo} #${pr.number} — ${pr.title} [${pr.flags.join(',')}] (${pr.ageDays}d)`);
}
console.log('\nHighest leverage: close all docs mirrors and drafts first. Then Bolt. Then Dependabot if green.');
