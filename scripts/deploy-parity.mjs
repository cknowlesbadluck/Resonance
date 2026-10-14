#!/usr/bin/env node
/**
 * Deploy parity (read-only): compares the commit SHA served by GET <base>/api/ready
 * with the head of main on GitHub (public API, unauthenticated GET). No writes, no secrets.
 *
 *   node scripts/deploy-parity.mjs [base=https://resonancenexus.netlify.app] [repo=cknowlesbadluck/Resonance]
 * Exit 0 = parity, 1 = drift or unknown (fail closed), 2 = probe error.
 */
export function compareParity(liveSha, mainSha) {
  if (!liveSha) return { parity: false, reason: "live_sha_missing" };
  if (!mainSha) return { parity: false, reason: "main_sha_unknown" };
  return liveSha.toLowerCase() === mainSha.toLowerCase()
    ? { parity: true, reason: "match" }
    : { parity: false, reason: "drift" };
}

async function main() {
  const base = process.argv[2] ?? "https://resonancenexus.netlify.app";
  const repo = process.argv[3] ?? "cknowlesbadluck/Resonance";
  try {
    const [ready, head] = await Promise.all([
      fetch(`${base}/api/ready`, { signal: AbortSignal.timeout(15000) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) })),
      fetch(`https://api.github.com/repos/${repo}/commits/main`, { headers: { accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(15000) }).then((r) => r.json()),
    ]);
    const result = { base, readyStatus: ready.status, liveSha: ready.body.commitSha ?? null, mainSha: head.sha ?? null, contractRevision: ready.body.contractRevision ?? null, ...compareParity(ready.body.commitSha, head.sha) };
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.parity ? 0 : 1);
  } catch (error) {
    console.error(JSON.stringify({ parity: false, reason: "probe_error", error: String(error) }));
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
