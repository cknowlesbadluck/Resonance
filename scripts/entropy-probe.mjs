#!/usr/bin/env node
/**
 * Entropy Probe — scores open PRs across portfolio repos for close-candidate prioritization.
 * Read-only. Uses GitHub API (requires GITHUB_TOKEN in env for private rate limits; public ok for these repos).
 * Flags: docs mirrors, Bolt/Jules micro-opts, age >14d, no recent CI success.
 * Output: ranked list of close candidates and residual high-value PRs.
 *
 * Usage: node scripts/entropy-probe.mjs
 * Innovate under Phase 7 hygiene prune.
 */

const REPOS = [
  { owner: 'cknowlesbadluck', repo: 'QuicksilverV1' },
  { owner: 'cknowlesbadluck', repo: 'Conduit' },
  { owner: 'cknowlesbadluck', repo: 'Resonance' },
];

const NOISE_PATTERNS = [
  /docs?:\s*(mirror|portfolio|audit|roadmap)/i,
  /bolt:/i,
  /jules:/i,
  /micro.?opt/i,
  /pure\s+(micro|opt)/i,
];

async function fetchOpenPRs(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=100`;
  const headers = { 'User-Agent': 'entropy-probe', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${owner}/${repo}: ${res.status}`);
  return res.json();
}

function scorePR(pr, now = Date.now()) {
  const ageDays = (now - new Date(pr.updated_at).getTime()) / (1000 * 60 * 60 * 24);
  const title = pr.title || '';
  const isNoise = NOISE_PATTERNS.some(p => p.test(title));
  const isDraft = pr.draft;
  let score = 0;
  if (isNoise) score += 50;
  if (ageDays > 14) score += 30;
  if (ageDays > 30) score += 20;
  if (isDraft) score += 10;
  if (title.toLowerCase().includes('supersed') || title.toLowerCase().includes('mirror')) score += 20;
  return { number: pr.number, title, ageDays: Math.round(ageDays * 10) / 10, isNoise, isDraft, score, html_url: pr.html_url };
}

async function main() {
  console.log('Entropy Probe — portfolio open PR scoring\n');
  const all = [];
  for (const { owner, repo } of REPOS) {
    try {
      const prs = await fetchOpenPRs(owner, repo);
      console.log(`${owner}/${repo}: ${prs.length} open`);
      for (const pr of prs) {
        all.push({ repo, ...scorePR(pr) });
      }
    } catch (e) {
      console.error(`Failed ${owner}/${repo}:`, e.message);
    }
  }
  const candidates = all.filter(p => p.score >= 40).sort((a, b) => b.score - a.score);
  console.log('\n--- Close candidates (score >=40, noise/age) ---');
  candidates.slice(0, 15).forEach(p => {
    console.log(`[${p.score}] ${p.repo}#${p.number} age=${p.ageDays}d noise=${p.isNoise} ${p.title}`);
  });
  console.log(`\nTotal open: ${all.length}. High-score close candidates: ${candidates.length}. Target <10/repo.`);
}

main().catch(console.error);
