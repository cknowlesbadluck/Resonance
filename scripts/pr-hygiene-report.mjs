#!/usr/bin/env node
/**
 * Basic PR hygiene report for portfolio entropy prune.
 * Lists open PRs across QuicksilverV1, Resonance, Conduit with close-candidate flags
 * for docs-only, Jules/Bolt, or age >14 days.
 * Read-only. No merges or closes. Fail-closed on API errors.
 * Usage: node scripts/pr-hygiene-report.mjs
 */
import { execSync } from 'child_process';

const REPOS = ['cknowlesbadluck/QuicksilverV1', 'cknowlesbadluck/Resonance', 'cknowlesbadluck/Conduit'];

function getOpenPRs(repo) {
  try {
    const out = execSync(`gh pr list --repo ${repo} --state open --json number,title,createdAt,author,labels --limit 50`, { encoding: 'utf8' });
    return JSON.parse(out);
  } catch (e) {
    console.error(`Failed to list PRs for ${repo}: ${e.message}`);
    process.exit(1);
  }
}

const now = Date.now();
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

console.log('# Portfolio PR Hygiene Report');
console.log(`Generated: ${new Date().toISOString()}`);
console.log('');

let total = 0;
for (const repo of REPOS) {
  const prs = getOpenPRs(repo);
  total += prs.length;
  console.log(`## ${repo} (${prs.length} open)`);
  for (const pr of prs) {
    const ageDays = Math.floor((now - new Date(pr.createdAt).getTime()) / (24 * 60 * 60 * 1000));
    const isDocs = /docs|audit|roadmap|mirror/i.test(pr.title);
    const isJules = /Bolt|Jules|micro/i.test(pr.title) || pr.author.login.includes('jules') || pr.author.login.includes('bolt');
    const isOld = ageDays > 14;
    const closeCandidate = isDocs || isJules || isOld;
    console.log(`- #${pr.number} ${pr.title} (age ${ageDays}d) ${closeCandidate ? '[CLOSE CANDIDATE]' : ''}`);
  }
  console.log('');
}
console.log(`Total open: ${total}. Target <10 per repo.`);
console.log('Close candidates flagged for docs/Jules/Bolt or age >14d. Review before closing.');
