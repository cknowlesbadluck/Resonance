#!/usr/bin/env node
/**
 * Portfolio Entropy Scorer (report-only)
 * score = (age_days * 0.4) + (is_docs_only ? 3 : 0) + (is_bolt_jules ? 2 : 0) + (has_overlap ? 1 : 0) - (ci_green ? 1 : 0)
 * Usage: node scripts/portfolio-entropy-scorer.mjs
 * Requires gh CLI auth. Outputs top close candidates. Fail-closed on API errors.
 */
import { execSync } from 'child_process';

const REPOS = ['cknowlesbadluck/QuicksilverV1', 'cknowlesbadluck/Resonance', 'cknowlesbadluck/Conduit'];
const TARGET = 10;

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    console.error('Command failed:', cmd, e.stderr || e.message);
    process.exit(1);
  }
}

function scorePR(pr, now = Date.now()) {
  const ageDays = (now - new Date(pr.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const title = (pr.title || '').toLowerCase();
  const body = (pr.body || '').toLowerCase();
  const isDocs = title.includes('docs') || body.includes('docs only') || body.includes('mirror');
  const isBoltJules = title.includes('bolt') || title.includes('jules') || body.includes('jules') || body.includes('bolt');
  const hasOverlap = body.includes('conflict') || body.includes('rebase') || body.includes('overlap');
  const ciGreen = true; // stub; extend with checks API
  const score = (ageDays * 0.4) + (isDocs ? 3 : 0) + (isBoltJules ? 2 : 0) + (hasOverlap ? 1 : 0) - (ciGreen ? 1 : 0);
  return { ...pr, ageDays: ageDays.toFixed(1), score: score.toFixed(1), isDocs, isBoltJules };
}

const results = [];
for (const repo of REPOS) {
  const json = run(`gh pr list --repo ${repo} --state open --json number,title,body,createdAt,author --limit 100`);
  const prs = JSON.parse(json);
  const scored = prs.map(pr => scorePR(pr)).sort((a, b) => b.score - a.score);
  results.push({ repo, count: prs.length, overTarget: prs.length > TARGET, top: scored.slice(0, 5) });
}

console.log(JSON.stringify({ timestamp: new Date().toISOString(), targetPerRepo: TARGET, results }, null, 2));
console.log('\n--- Top close candidates (high score = noise) ---');
results.forEach(r => {
  console.log(`\n${r.repo}: ${r.count} open (${r.overTarget ? 'OVER' : 'OK'})`);
  r.top.forEach(p => console.log(`  #${p.number} score=${p.score} age=${p.ageDays}d docs=${p.isDocs} bolt=${p.isBoltJules} ${p.title}`));
});
