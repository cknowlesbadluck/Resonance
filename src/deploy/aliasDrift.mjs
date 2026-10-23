// Report-only Vercel alias drift classifier (public HTTP only, no secrets).
// Given what an alias serves at /api/ready, classify it against main.
export function classifyAlias({ status, contentType = "", body = "" }, mainSha = null) {
  if (status === 404 && /DEPLOYMENT_NOT_FOUND|deployment could not be found on Vercel/i.test(body)) return { outcome: "alias_absent", drift: true };
  let json = null;
  if (/json/i.test(contentType) || /^\s*\{/.test(body)) { try { json = JSON.parse(body); } catch { json = null; } }
  if (!json || json.service !== "resonance-nexus") {
    return status >= 200 && status < 500 ? { outcome: "stranger_occupant", drift: true } : { outcome: "unreachable", drift: true };
  }
  const sha = typeof json.commitSha === "string" ? json.commitSha : null;
  if (!sha || sha === "unknown" || !mainSha) return { outcome: "resonance_unstamped", drift: false };
  return mainSha.startsWith(sha) || sha.startsWith(mainSha)
    ? { outcome: "resonance_at_main", drift: false }
    : { outcome: "resonance_stale", drift: true };
}
