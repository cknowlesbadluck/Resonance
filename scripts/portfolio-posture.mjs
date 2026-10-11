#!/usr/bin/env node
/**
 * PortfolioPosture classifier — pure, no secrets, fail-closed.
 * Classifies live probe responses into owner_gate | deploy_lag | alias_absent | device_not_recorded | cold_start | ready | unknown.
 * Unit-testable. Used by portfolio-probe.sh and cross-repo evidence.
 */

export function classifyResonanceReady(body, status) {
  if (status !== 503 && status !== 200) return { posture: 'unknown', reason: `unexpected_status_${status}` };
  if (status === 200) return { posture: 'ready', reason: 'ok' };
  if (!body || typeof body !== 'object') return { posture: 'unknown', reason: 'no_body' };
  const missing = body.missingRequired || [];
  if (missing.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    return { posture: 'owner_gate', reason: 'missing_SUPABASE_SERVICE_ROLE_KEY', ownerActionRequired: true };
  }
  if (body.status === 'not_ready' && body.stage === 'deployment') {
    return { posture: 'deploy_lag', reason: body.stage };
  }
  return { posture: 'unknown', reason: 'unclassified_503' };
}

export function classifyConduitReady(body, status) {
  if (status === 0) return { posture: 'cold_start', reason: 'timeout_or_zero' };
  if (status === 200 && body?.status === 'ready' && body?.persistence === 'postgres') {
    return { posture: 'ready', reason: 'stamped', contractRevision: body.contractRevision };
  }
  if (status === 503) return { posture: 'deploy_lag', reason: 'not_ready' };
  return { posture: 'unknown', reason: `status_${status}` };
}

export function classifyDevice(healthBody) {
  if (healthBody?.deviceAcceptance === 'not_recorded' || healthBody?.acceptanceGate === 'CHR-55') {
    return { posture: 'device_not_recorded', reason: 'CHR-55_pending' };
  }
  if (healthBody?.deviceAcceptance === 'recorded') return { posture: 'device_recorded', reason: 'ok' };
  return { posture: 'unknown', reason: 'no_device_field' };
}

// Alias / stranger: 404 or unexpected 200 never owner_gate or ready
export function classifyAlias(status, body) {
  if (status === 404) return { posture: 'alias_absent', reason: '404' };
  if (status === 200 && (!body || body.status !== 'ready')) return { posture: 'stranger', reason: 'unexpected_200' };
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // CLI smoke
  const sampleResonance = { status: 'not_ready', missingRequired: ['SUPABASE_SERVICE_ROLE_KEY'] };
  console.log(JSON.stringify(classifyResonanceReady(sampleResonance, 503), null, 2));
}
