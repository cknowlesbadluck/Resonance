#!/usr/bin/env node
/**
 * Portfolio Entropy Scorer
 * Scores open PRs across QuicksilverV1, Resonance, Conduit by age + noise flags.
 * Surfaces close candidates (docs mirrors, pure Bolt/Jules micro-opts).
 *
 * Usage: GITHUB_TOKEN=... node scripts/portfolio-entropy-score.mjs
 * Or with --json for CI.
 *
 * Never claims device acceptance. Never invents owner evidence.
 */

const REPOS = [
  { owner: 'cknowlesbadluck', repo: 'QuicksilverV1', label: 'QS' },
  { owner: 'cknowlesbadluck', repo: 'Resonance', label: 'Res' },
  { owner: 'cknowlesbadluck', repo: 'Conduit', label: 'Cond' },
];

const NOISE_PATTERNS = [
  /docs?:\s*mirror/i,
  /portfolio audit/i,
  /⚡\s*Bolt:/i,
  /Jules/i,
  /chore:\s*migrate/i,
  /fix:\s*update gemini/i,
];

async function fetchOpenPRs(owner, repo, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portfolio-entropy-scorer',
    },
  });
  if (!res.ok) throw new Error(`${repo} ${res.status}`);
  return res.json();
}

function scorePR(pr) {
  const created = new Date(pr.created_at);
  const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  const title = pr.title || '';
  const isNoise = NOISE_PATTERNS.some((p) => p.test(title));
  const isDocs = /docs?:/i.test(title);
  let score = Math.min(ageDays * 2, 40);
  if (isNoise) score += 30;
  if (isDocs) score += 10;
  if (pr.draft) score += 15;
  return { ageDays: ageDays.toFixed(1), isNoise, isDocs, score: Math.round(score), title, number: pr.number, html_url: pr.html_url };
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN required');
    process.exit(1);
  }
  const json = process.argv.includes('--json');
  const results = [];
  for (const r of REPOS) {
    try {
      const prs = await fetchOpenPRs(r.owner, r.repo, token);
      const scored = prs.map(scorePR).sort((a, b) => b.score - a.score);
      results.push({ repo: r.label, count: prs.length, scored, closeCandidates: scored.filter((s) => s.isNoise || s.score > 40).slice(0, 10) });
    } catch (e) {
      results.push({ repo: r.label, error: e.message });
    }
  }
  if (json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const r of results) {
      console.log(`\n=== ${r.repo} (${r.count ?? 'err'} open) ===`);
      if (r.error) { console.log(r.error); continue; }
      console.log('Close candidates (noise or high age):');
      for (const c of r.closeCandidates) {
        console.log(`  #${c.number} score=${c.score} age=${c.ageDays}d ${c.isNoise ? '[NOISE]' : ''} ${c.title}`);
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
