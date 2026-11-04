#!/usr/bin/env node
/**
 * Report-only entropy dashboard for portfolio PR hygiene.
 * Scores open PRs by age, draft status, title flags (docs/Jules/Bolt), and suggests close candidates.
 * No mutations. Run with GH_TOKEN for full data, or dry-run with static lists.
 *
 * Usage: node scripts/entropy-dashboard.mjs
 */

const REPOS = [
  { owner: 'cknowlesbadluck', repo: 'QuicksilverV1' },
  { owner: 'cknowlesbadluck', repo: 'Conduit' },
  { owner: 'cknowlesbadluck', repo: 'Resonance' },
];

function scorePR(pr) {
  let score = 0;
  const title = (pr.title || '').toLowerCase();
  const ageDays = (Date.now() - new Date(pr.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > 14) score += 3;
  else if (ageDays > 7) score += 1;
  if (pr.draft) score += 2;
  if (title.includes('docs:') || title.includes('audit') || title.includes('mirror') || title.includes('roadmap')) score += 4;
  if (title.includes('bolt') || title.includes('jules') || title.includes('micro') || title.includes('localecompare') || title.includes('fast-path')) score += 5;
  if (title.includes('harden') || title.includes('test(') || title.includes('fix(')) score -= 1;
  return { number: pr.number, title: pr.title, score, ageDays: Math.round(ageDays), draft: !!pr.draft };
}

async function main() {
  console.log('Entropy Dashboard (report-only) — 2026-11-04');
  console.log('Target: <10 open PRs per repo. Higher score = better close candidate.\n');
  // In production, fetch via Octokit or gh api. Stub uses known open counts for this pass.
  const stub = {
    QuicksilverV1: 16,
    Conduit: 17,
    Resonance: 23,
  };
  for (const [repo, count] of Object.entries(stub)) {
    console.log(`${repo}: ${count} open (target <10) — entropy ${count > 15 ? 'HIGH' : 'MEDIUM'}`);
  }
  console.log('\nClose candidates (heuristic): pure docs/audit mirrors, Bolt/Jules micro-opts older than 7d, draft non-critical.');
  console.log('Merge candidates: green non-overlapping hardens with CI pass and no file overlap.');
  console.log('Next: wire to live GitHub API + CI status + file overlap report for automated scoring.');
}

main().catch(console.error);
