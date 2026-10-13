#!/usr/bin/env node
/**
 * PortfolioPosture classifier — pure, no secrets, fail-closed.
 * Classifies live probe responses into owner_gate | deploy_lag | alias_absent | device_not_recorded | cold_start | ready | incomplete_ready | unknown.
 * Unit-testable. Used by portfolio-probe.sh and cross-repo evidence.
 * cold_start: no HTTP status (0/undefined/null/NaN = timeout, abort, DNS/connection reset) or a
 * gateway timeout (504) from a sleeping serverless function. Always retryable, never ready/owner_gate.
 */

const GATEWAY_TIMEOUT = 504;

export function isColdStart(status) {
  return status === undefined || status === null || status === 0 || Number.isNaN(status) || status === GATEWAY_TIMEOUT;
}

function coldStart(status) {
  return { posture: 'cold_start', reason: status === GATEWAY_TIMEOUT ? 'gateway_timeout_504' : 'timeout_or_zero', retryable: true };
}

export function classifyResonanceReady(body, status) {
  if (isColdStart(status)) return coldStart(status);
  if (status !== 503 && status !== 200) return { posture: 'unknown', reason: `unexpected_status_${status}` };
  // Fail closed: a 200 is only ready when the body says so.
  if (status === 200) {
    return body?.status === 'ready'
      ? { posture: 'ready', reason: 'ok' }
      : { posture: 'incomplete_ready', reason: 'status_200_without_ready_body', incomplete: true };
  }
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
  if (isColdStart(status)) return coldStart(status);
  if (status === 200 && body?.status === 'ready') {
    if (body?.persistence === 'postgres' && body?.contractRevision) {
      return { posture: 'ready', reason: 'stamped', contractRevision: body.contractRevision };
    }
    return { posture: 'incomplete_ready', reason: 'missing_stamp_or_persistence', incomplete: true };
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
  const sampleIncomplete = { status: 'ready' };
  console.log(JSON.stringify(classifyConduitReady(sampleIncomplete, 200), null, 2));
  console.log(JSON.stringify(classifyConduitReady(null, 0), null, 2)); // cold start
}
