/**
 * Privacy floor for anything the executor persists or returns (evidence payloads, step
 * errors). Adapter output and error text are untrusted: a provider error can echo a token.
 * Redaction is structural (sensitive key names) plus pattern-based (well-known credential
 * shapes). It is deliberately conservative and bounded (depth, size) so it can never hang.
 */
export const REDACTED = "[REDACTED]";

const SENSITIVE_KEY = /^(authorization|cookie|set-cookie|password|passwd|secret|client_secret|api[-_]?key|access[-_]?token|refresh[-_]?token|id[-_]?token|token|private[-_]?key|service[-_]?role[-_]?key)$/i;

const PATTERNS: RegExp[] = [
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g, // GitHub tokens
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\blin_(?:api|oauth)_[A-Za-z0-9]{20,}\b/g, // Linear
  /\bsk-[A-Za-z0-9_-]{20,}\b/g, // OpenAI-style
  /\bsb[ps]_[A-Za-z0-9]{20,}\b/g, // Supabase secret/publishable keys
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key id
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, // JWTs
  /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi,
];

export function redactString(value: string): string {
  let out = value;
  for (const pattern of PATTERNS) out = out.replace(pattern, (m) => (/^(bearer|basic)\s/i.test(m) ? `${m.split(/\s+/)[0]} ${REDACTED}` : REDACTED));
  return out;
}

export function redactSecrets(value: unknown, depth = 0): unknown {
  if (depth > 8) return REDACTED; // fail closed on pathological nesting
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.slice(0, 1000).map((item) => redactSecrets(item, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 1000)) {
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redactSecrets(item, depth + 1);
    }
    return out;
  }
  return value;
}
