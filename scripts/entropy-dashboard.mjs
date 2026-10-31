#!/usr/bin/env node
/**
 * Entropy Dashboard — read-only portfolio PR hygiene reporter.
 * Innovate for Phase 7: reports open PR counts, age, draft status, and close-candidate hints.
 * Fail-closed: never mutates, never invents data. Requires GH_TOKEN or gh auth for private, but works for public.
 * Usage: node scripts/entropy-dashboard.mjs [--owner cknowlesbadluck]
 */
import { execSync } from 'node:child_process';
import process from 'node:process';

const OWNER = process.argv.includes('--owner') ? process.argv[process.argv.indexOf('--owner') + 1] : 'cknowlesbadluck';
const REPOS = ['QuicksilverV1', 'Conduit', 'Resonance'];
const TARGET_ENTROPY = 10;

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    console.error(`Command failed: ${cmd}\n${e.message}`);
    return '';
  }
}

function getOpenPRs(repo) {
  const json = sh(`gh pr list --repo ${OWNER}/${repo} --state open --limit 100 --json number,title,draft,updatedAt,author,labels,isDraft`);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

console.log(`# Entropy Dashboard — ${new Date().toISOString()}`);
console.log(`Target open PRs per repo: <${TARGET_ENTROPY}\n`);

let total = 0;
for (const repo of REPOS) {
  const prs = getOpenPRs(repo);
  const count = prs.length;
  total += count;
  const drafts = prs.filter(p => p.isDraft || p.draft).length;
  const recent = prs.filter(p => {
    const ageDays = (Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return ageDays < 7;
  }).length;
  const docsOnlyHint = prs.filter(p => /docs|audit|roadmap|hygiene|mirror/i.test(p.title)).length;

  console.log(`## ${repo}`);
  console.log(`- Open: ${count} (target <${TARGET_ENTROPY}) ${count >= TARGET_ENTROPY ? '⚠️ ENTROPY' : '✅'}`);
  console.log(`- Drafts: ${drafts}`);
  console.log(`- Updated last 7d: ${recent}`);
  console.log(`- Docs/audit-ish titles (close candidates): ${docsOnlyHint}`);
  if (count > 0) {
    console.log(`- Top open:`);
    prs.slice(0, 5).forEach(p => {
      const age = Math.round((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`  #${p.number} [${p.isDraft ? 'draft' : 'open'}] ${age}d: ${p.title.slice(0, 80)}`);
    });
  }
  console.log('');
}

console.log(`**Portfolio open PRs: ${total}** (target <${TARGET_ENTROPY * REPOS.length})`);
console.log('Close candidates priority: docs-only / superseded audits / stalled >14d / pure mirrors.');
console.log('Merge candidates: green non-overlapping hardens after CI. Never auto-merge overlapping or untested.');
console.log('No mutations performed. Classifier ≠ proof.');
