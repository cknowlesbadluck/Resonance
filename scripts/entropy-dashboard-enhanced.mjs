#!/usr/bin/env node
/**
 * Enhanced Portfolio Entropy Dashboard (innovate 2026-11-10)
 * Scores open PRs, generates close-candidate forms, outputs markdown report.
 * Report-only. Never auto-closes. Never invents owner evidence.
 *
 * Usage: GITHUB_TOKEN=... node scripts/entropy-dashboard-enhanced.mjs
 */

const REPOS = [
  { owner: 'cknowlesbadluck', repo: 'QuicksilverV1', label: 'QS' },
  { owner: 'cknowlesbadluck', repo: 'Resonance', label: 'Res' },
  { owner: 'cknowlesbadluck', repo: 'Conduit', label: 'Cond' },
];

const NOISE_PATTERNS = [
  /docs?:\\s*mirror/i,
  /portfolio audit/i,
  /⚡\\s*Bolt:/i,
  /Jules/i,
  /chore:\\s*update gemini/i,
  /fix:\\s*update gemini/i,
];

async function fetchOpenPRs(owner, repo, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'entropy-dashboard-enhanced',
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
  let score = Math.min(ageDays * 0.4, 20);
  if (isNoise) score += 30;
  if (isDocs) score += 15;
  if (pr.draft) score += 10;
  return {
    ageDays: ageDays.toFixed(1),
    isNoise,
    isDocs,
    score: Math.round(score),
    title,
    number: pr.number,
    html_url: pr.html_url,
    closeForm: isNoise ? `Close #${pr.number} as pure noise (docs mirror or Bolt micro-opt). No functional change.` : null,
  };
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN required');
    process.exit(1);
  }
  const results = [];
  let totalOpen = 0;
  for (const r of REPOS) {
    try {
      const prs = await fetchOpenPRs(r.owner, r.repo, token);
      totalOpen += prs.length;
      const scored = prs.map(scorePR).sort((a, b) => b.score - a.score);
      results.push({
        repo: r.label,
        count: prs.length,
        closeCandidates: scored.filter((s) => s.isNoise).slice(0, 8),
        highScore: scored.slice(0, 5),
      });
    } catch (e) {
      results.push({ repo: r.label, error: e.message });
    }
  }

  console.log(`# Portfolio Entropy Dashboard — ${new Date().toISOString()}`);
  console.log(`Total open PRs: ${totalOpen} (target <10 per repo)\n`);
  for (const r of results) {
    console.log(`## ${r.repo} (${r.count ?? 'error'} open)`);
    if (r.error) { console.log(r.error); continue; }
    console.log('### Pure noise close candidates:');
    if (r.closeCandidates.length === 0) console.log('  None');
    for (const c of r.closeCandidates) {
      console.log(`- #${c.number} (score ${c.score}, age ${c.ageDays}d) ${c.title}`);
      console.log(`  Form: ${c.closeForm}`);
    }
    console.log('');
  }
  console.log('\\nStabilization holds. Prune noise before new features. Do not invent owner evidence.');
}

main().catch((e) => { console.error(e); process.exit(1); });
