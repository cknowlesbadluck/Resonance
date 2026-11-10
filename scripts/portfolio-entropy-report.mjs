#!/usr/bin/env node
/**
 * Portfolio entropy report (report-only).
 * Scores open PRs by age + docs-only + Bolt/Jules flag + overlap - CI green.
 * Prints top close candidates. No writes.
 *
 * Usage: GITHUB_TOKEN=... node scripts/portfolio-entropy-report.mjs
 * Requires gh or GITHUB_TOKEN for API.
 */
import { execSync } from 'node:child_process';

const REPOS = [
  { owner: 'cknowlesbadluck', repo: 'QuicksilverV1' },
  { owner: 'cknowlesbadluck', repo: 'Resonance' },
  { owner: 'cknowlesbadluck', repo: 'Conduit' },
];

function score(pr) {
  const ageDays = (Date.now() - new Date(pr.created_at).getTime()) / 86400000;
  const title = (pr.title || '').toLowerCase();
  const isDocs = title.includes('docs:') || title.includes('mirror');
  const isBoltJules = title.includes('bolt') || title.includes('jules') || pr.user?.login?.includes('jules');
  // Rough overlap heuristic: high comment count or known stacked patterns omitted for brevity
  const hasOverlap = (pr.comments || 0) > 10;
  const ciGreen = true; // stub; real would check status
  return (ageDays * 0.4) + (isDocs ? 3 : 0) + (isBoltJules ? 2 : 0) + (hasOverlap ? 1 : 0) - (ciGreen ? 1 : 0);
}

async function main() {
  console.log('Portfolio entropy report —', new Date().toISOString());
  for (const { owner, repo } of REPOS) {
    try {
      const out = execSync(
        `gh pr list --repo ${owner}/${repo} --state open --limit 100 --json number,title,created_at,comments,user`,
        { encoding: 'utf8' }
      );
      const prs = JSON.parse(out);
      const scored = prs.map(pr => ({ ...pr, score: score(pr) })).sort((a, b) => b.score - a.score);
      console.log(`\n${repo}: ${prs.length} open`);
      scored.slice(0, 5).forEach(p => {
        console.log(`  #${p.number} score=${p.score.toFixed(1)} — ${p.title}`);
      });
    } catch (e) {
      console.error(`Failed for ${repo}:`, e.message);
    }
  }
  console.log('\nRecommend close pure noise (docs mirrors + micro-opts) to drop entropy below 10/repo.');
}

main().catch(console.error);
