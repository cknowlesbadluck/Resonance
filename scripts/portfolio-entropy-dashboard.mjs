#!/usr/bin/env node
/**
 * Portfolio Entropy Dashboard
 * Read-only scoring of open PRs across QuicksilverV1, Conduit, Resonance.
 * Prioritizes close candidates (docs mirrors, Bolt micro-opts, old drafts, title overlap).
 * No writes. Uses public GitHub API. Fail-closed on network error.
 *
 * Usage: node scripts/portfolio-entropy-dashboard.mjs
 */
const REPOS = [
  'cknowlesbadluck/QuicksilverV1',
  'cknowlesbadluck/Conduit',
  'cknowlesbadluck/Resonance',
];

const CLOSE_HINTS = /docs:|mirror|audit|Bolt|Jules|chore:|hygiene|stale|supersede|DRAFT/i;

async function fetchPRs(repo) {
  const url = `https://api.github.com/repos/${repo}/pulls?state=open&per_page=100`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'portfolio-entropy' },
  });
  if (!res.ok) throw new Error(`${repo} ${res.status}`);
  return res.json();
}

function scorePR(pr, allTitles) {
  let score = 0;
  const reasons = [];
  if (pr.draft) { score += 40; reasons.push('draft'); }
  if (CLOSE_HINTS.test(pr.title)) { score += 30; reasons.push('title-hint'); }
  const ageDays = (Date.now() - new Date(pr.updated_at).getTime()) / 86400000;
  if (ageDays > 14) { score += Math.min(20, Math.floor(ageDays / 7)); reasons.push(`age-${Math.floor(ageDays)}d`); }
  const words = pr.title.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  const overlaps = allTitles.filter(t => t !== pr.title && words.some(w => t.includes(w))).length;
  if (overlaps > 2) { score += 15; reasons.push('title-overlap'); }
  return { number: pr.number, title: pr.title, score, reasons, html_url: pr.html_url, draft: pr.draft };
}

async function main() {
  const all = [];
  for (const repo of REPOS) {
    try {
      const prs = await fetchPRs(repo);
      const titles = prs.map(p => p.title.toLowerCase());
      const scored = prs.map(p => ({ repo, ...scorePR(p, titles) }));
      all.push(...scored);
      console.log(`\n=== ${repo} === ${prs.length} open`);
    } catch (e) {
      console.error(`FAIL ${repo}: ${e.message}`);
      process.exitCode = 1;
    }
  }
  const closeCandidates = all.filter(p => p.score >= 40).sort((a, b) => b.score - a.score);
  console.log(`\n=== CLOSE CANDIDATES (score >=40) === ${closeCandidates.length}`);
  closeCandidates.slice(0, 15).forEach(p => {
    console.log(`${p.score} ${p.repo}#${p.number} [${p.reasons.join(',')}] ${p.title}`);
  });
  console.log(`\nTotal open across planes: ${all.length}`);
  console.log(`Entropy target: <10/repo. Current highest residual is title-overlap + docs mirrors.`);
}

main().catch(e => { console.error(e); process.exit(1); });
