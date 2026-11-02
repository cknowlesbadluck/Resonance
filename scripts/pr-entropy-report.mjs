#!/usr/bin/env node
/**
 * PR Entropy Report — read-only close-candidate prioritizer
 * Scores open PRs by age, title keywords (docs, Jules, Bolt), and flags low-value noise.
 * Usage: node scripts/pr-entropy-report.mjs
 * Requires GH_TOKEN or gh auth for API access.
 */
import { execSync } from 'child_process';

const REPOS = [
  { owner: 'cknowlesbadluck', repo: 'QuicksilverV1' },
  { owner: 'cknowlesbadluck', repo: 'Conduit' },
  { owner: 'cknowlesbadluck', repo: 'Resonance' },
];

function getOpenPRs(owner, repo) {
  try {
    const cmd = `gh pr list --repo ${owner}/${repo} --state open --limit 100 --json number,title,createdAt,author,isDraft`;
    const out = execSync(cmd, { encoding: 'utf8' });
    return JSON.parse(out);
  } catch (e) {
    console.error(`Failed to list PRs for ${owner}/${repo}: ${e.message}`);
    return [];
  }
}

function scorePR(pr) {
  let score = 0;
  const title = (pr.title || '').toLowerCase();
  const ageDays = (Date.now() - new Date(pr.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > 14) score += 2;
  if (ageDays > 7) score += 1;
  if (title.includes('docs:') || title.includes('audit') || title.includes('roadmap')) score += 3;
  if (title.includes('bolt') || title.includes('jules') || title.includes('⚡')) score += 4;
  if (title.includes('hygiene') || title.includes('prune')) score += 1;
  if (pr.isDraft) score += 1;
  return { score, ageDays: Math.round(ageDays) };
}

console.log('# Portfolio PR Entropy Report');
console.log(`Generated: ${new Date().toISOString()}`);
console.log('Close-candidates: high score (docs-only, Jules micro-opts, old)\n');

let total = 0;
for (const { owner, repo } of REPOS) {
  const prs = getOpenPRs(owner, repo);
  total += prs.length;
  console.log(`## ${owner}/${repo} (${prs.length} open)`);
  const scored = prs.map(pr => ({ ...pr, ...scorePR(pr) })).sort((a, b) => b.score - a.score);
  for (const p of scored.slice(0, 10)) {
    console.log(`- #${p.number} [score ${p.score}, ${p.ageDays}d] ${p.title}`);
  }
  console.log('');
}
console.log(`Total open PRs: ${total}. Target <10 per repo.`);
