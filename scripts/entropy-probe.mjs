#!/usr/bin/env node
/**
 * Entropy Probe Dashboard
 * Scores open PRs for noise (docs mirrors, Jules/Bolt micro-opts, age, overlap risk).
 * Usage: GITHUB_TOKEN=... node scripts/entropy-probe.mjs
 * Requires @octokit/rest or use gh CLI in CI.
 * Outputs close candidates prioritized by score.
 */
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = 'cknowlesbadluck';
const REPOS = ['QuicksilverV1', 'Resonance', 'Conduit'];

async function scorePR(repo, pr) {
  let score = 0;
  const title = (pr.title || '').toLowerCase();
  const body = (pr.body || '').toLowerCase();
  const ageDays = (Date.now() - new Date(pr.created_at)) / (1000 * 60 * 60 * 24);

  if (title.includes('docs:') || title.includes('mirror') || title.includes('audit')) score += 40;
  if (title.includes('bolt') || title.includes('jules') || body.includes('created automatically by jules')) score += 50;
  if (title.includes('optimize') || title.includes('micro') || title.includes('⚡')) score += 30;
  if (ageDays > 14) score += 20;
  if (pr.draft) score += 10;
  if ((pr.comments || 0) < 2) score += 5;

  return { number: pr.number, title: pr.title, score, ageDays: Math.round(ageDays), url: pr.html_url };
}

async function main() {
  const results = [];
  for (const repo of REPOS) {
    const { data: prs } = await octokit.pulls.list({
      owner: OWNER,
      repo,
      state: 'open',
      per_page: 100,
    });
    for (const pr of prs) {
      const scored = await scorePR(repo, pr);
      scored.repo = repo;
      results.push(scored);
    }
  }
  results.sort((a, b) => b.score - a.score);
  console.log('Entropy Probe — Close Candidates (higher score = more noise):');
  console.table(results.slice(0, 20));
  console.log(`Total open: ${results.length}. Target <10 per repo.`);
}

main().catch(console.error);
