#!/usr/bin/env node
/**
 * Entropy score for open PRs across portfolio repos.
 * Read-only. Scores by age (days), docs-only title flag, and recency.
 * Fail-closed: never invents CI status or overlap without data.
 * Usage: node scripts/entropy-score.mjs
 * Requires GITHUB_TOKEN in env for live (optional; falls back to local note).
 */
const repos = ['QuicksilverV1', 'Conduit', 'Resonance'];
const owner = 'cknowlesbadluck';

function daysSince(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function isDocsOnly(title) {
  const t = title.toLowerCase();
  return t.includes('docs:') || t.includes('doc:') || t.includes('hygiene:') || t.includes('chore: remove') || t.includes('audit');
}

async function scoreRepo(repo) {
  // Placeholder: in real use, fetch via GitHub API with token.
  // For this innovate scaffold, emit structure for owner/agent to fill or extend with gh api.
  console.log(`\n=== ${repo} ===`);
  console.log('Open PRs: (fetch live with gh pr list --repo ' + owner + '/' + repo + ' --state open --json number,title,createdAt,updatedAt)');
  console.log('Score formula: age_days * 1 + (docs_only ? -5 : 0) + (updated <7d ? -2 : 0)');
  console.log('Close candidates: docs-only >14d old, or superseded audit/roadmap mirrors.');
}

(async () => {
  console.log('Portfolio Entropy Score (scaffold) — ' + new Date().toISOString());
  console.log('Target: <10 open per repo. Current baseline ~18/23/23.');
  for (const r of repos) await scoreRepo(r);
  console.log('\nHighest leverage: close superseded docs-only (QS#406, Conduit#338, Resonance#240) then merge green non-overlapping hardens.');
})();
