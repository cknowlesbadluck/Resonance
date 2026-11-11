#!/usr/bin/env node
// scripts/entropy-score.mjs
// Simple entropy scorer for open PRs across portfolio repos.
// Usage: node scripts/entropy-score.mjs
// Requires GITHUB_TOKEN for private or rate-limited runs; public works for these repos.

const repos = [
  { owner: 'cknowlesbadluck', name: 'QuicksilverV1' },
  { owner: 'cknowlesbadluck', name: 'Resonance' },
  { owner: 'cknowlesbadluck', name: 'Conduit' },
];

async function fetchOpenPRs(owner, repo) {
  const url = `https://api.github.com/search/issues?q=is:open+is:pr+repo:${owner}/${repo}&per_page=100`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${repo}: ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

function scorePR(pr) {
  const created = new Date(pr.created_at);
  const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  const title = (pr.title || '').toLowerCase();
  const isDocs = title.includes('docs') || title.includes('mirror') || title.includes('audit');
  const isBoltJules = title.includes('bolt') || title.includes('jules') || pr.user?.login?.includes('jules') || false;
  // Simple score: higher = more noise
  return (ageDays * 0.4) + (isDocs ? 3 : 0) + (isBoltJules ? 2 : 0);
}

async function main() {
  console.log('Portfolio Entropy Score —', new Date().toISOString());
  let total = 0;
  const candidates = [];

  for (const r of repos) {
    try {
      const prs = await fetchOpenPRs(r.owner, r.name);
      console.log(`\n${r.name}: ${prs.length} open PRs`);
      total += prs.length;
      for (const pr of prs) {
        const s = scorePR(pr);
        if (s > 5) {
          candidates.push({ repo: r.name, number: pr.number, title: pr.title, score: s.toFixed(1), url: pr.html_url });
        }
      }
    } catch (e) {
      console.error(`Error for ${r.name}:`, e.message);
    }
  }

  console.log(`\nTotal open: ${total} (target <10 per repo)`);
  console.log('\nTop noise candidates (score >5):');
  candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .forEach(c => console.log(`- ${c.repo} #${c.number} (${c.score}): ${c.title}`));
}

main().catch(console.error);
