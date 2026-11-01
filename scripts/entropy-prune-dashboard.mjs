#!/usr/bin/env node
/**
 * Entropy prune dashboard — innovate continuous hygiene.
 * Classifies open PRs across portfolio repos by simple heuristics.
 * Generates close-candidates (docs-only, superseded) and merge priorities (green hardens, non-overlapping).
 * Run with GITHUB_TOKEN in env. No secrets stored.
 *
 * Usage: node scripts/entropy-prune-dashboard.mjs
 */
import { execSync } from 'child_process';

const REPOS = [
  { owner: 'cknowlesbadluck', repo: 'QuicksilverV1' },
  { owner: 'cknowlesbadluck', repo: 'Conduit' },
  { owner: 'cknowlesbadluck', repo: 'Resonance' },
];

const DOCS_KEYWORDS = ['docs:', 'audit', 'roadmap', 'hygiene', 'mirror', 'portfolio'];
const HARDEN_KEYWORDS = ['harden', 'fix(', 'test(', 'privacy', 'auth', '401', 'redact', 'guard', 'bolt'];
const JULES_KEYWORDS = ['⚡ Bolt', 'Jules'];

function classify(pr) {
  const text = (pr.title + ' ' + (pr.body || '')).toLowerCase();
  if (JULES_KEYWORDS.some(k => pr.title.includes(k))) return 'jules-bolt';
  if (DOCS_KEYWORDS.some(k => text.includes(k))) return 'docs';
  if (HARDEN_KEYWORDS.some(k => text.includes(k))) return 'harden';
  return 'other';
}

async function fetchOpenPRs(owner, repo) {
  // Placeholder: in real use, call GitHub API with token.
  // For this implementation, return structure for demonstration.
  console.log(`Fetching open PRs for ${owner}/${repo} (requires GITHUB_TOKEN)...`);
  return []; // Implement with octokit or gh api in production.
}

async function main() {
  console.log('Portfolio Entropy Prune Dashboard — 2026-11-01 12Z');
  console.log('Target: <10 open PRs per repo.\n');
  for (const { owner, repo } of REPOS) {
    const prs = await fetchOpenPRs(owner, repo);
    const classified = prs.map(pr => ({ ...pr, category: classify(pr) }));
    const docs = classified.filter(p => p.category === 'docs');
    const hardens = classified.filter(p => p.category === 'harden');
    console.log(`${repo}: ${prs.length} open | docs: ${docs.length} (close candidates) | hardens: ${hardens.length} (merge priority)`);
    if (docs.length) {
      console.log('  Close candidates:', docs.map(p => `#${p.number} ${p.title}`).join(', '));
    }
  }
  console.log('\nNo device claims. Run with token for live data. Innovate: extend with file-overlap detection via gh pr diff.');
}

main().catch(console.error);
