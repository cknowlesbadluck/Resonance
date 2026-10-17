/**
 * Input bounds for the read-only discovery routes (GET /api/nexus/capabilities and
 * GET /api/nexus/skills). These routes previously accepted unbounded `ids`, `tags`,
 * `query` and `namespace` query params, which let one request fan out into an
 * arbitrarily large catalog resolution. Anything outside the bounds is rejected with 400
 * (fail closed) instead of being truncated silently.
 */

export const DISCOVERY_LIMITS = {
  maxListItems: 50,
  maxIdLength: 128,
  maxTagLength: 64,
  maxQueryLength: 200,
  maxNamespaceLength: 128,
} as const;

type Ok<T> = { ok: true; value: T };
type Err = { ok: false; error: string };

// C0/C1 control characters and DEL. Ids, tags and namespaces are identifiers, never free text with control bytes.
const CONTROL_RE = /[\u0000-\u001f\u007f-\u009f]/;

function parseList(raw: string | null, name: string, maxItemLength: number): Ok<string[]> | Err {
  if (raw === null) return { ok: true, value: [] };
  const items = raw.split(",").map((value) => value.trim()).filter(Boolean);
  if (items.length > DISCOVERY_LIMITS.maxListItems) {
    return { ok: false, error: `${name} accepts at most ${DISCOVERY_LIMITS.maxListItems} comma-separated values.` };
  }
  for (const item of items) {
    if (item.length > maxItemLength) return { ok: false, error: `Each ${name} value must be at most ${maxItemLength} characters.` };
    if (CONTROL_RE.test(item)) return { ok: false, error: `${name} values must not contain control characters.` };
  }
  return { ok: true, value: [...new Set(items)] };
}

export function parseCapabilityIds(params: URLSearchParams): Ok<string[]> | Err {
  return parseList(params.get("ids"), "ids", DISCOVERY_LIMITS.maxIdLength);
}

export type SkillDiscoveryFilter = { query?: string; namespace?: string; tags?: string[] };

export function parseSkillDiscoveryParams(params: URLSearchParams): Ok<SkillDiscoveryFilter> | Err {
  const tags = parseList(params.get("tags"), "tags", DISCOVERY_LIMITS.maxTagLength);
  if (!tags.ok) return tags;

  const query = params.get("query")?.trim() || undefined;
  if (query && query.length > DISCOVERY_LIMITS.maxQueryLength) {
    return { ok: false, error: `query must be at most ${DISCOVERY_LIMITS.maxQueryLength} characters.` };
  }
  if (query && CONTROL_RE.test(query)) return { ok: false, error: "query must not contain control characters." };

  const namespace = params.get("namespace")?.trim() || undefined;
  if (namespace && namespace.length > DISCOVERY_LIMITS.maxNamespaceLength) {
    return { ok: false, error: `namespace must be at most ${DISCOVERY_LIMITS.maxNamespaceLength} characters.` };
  }
  if (namespace && CONTROL_RE.test(namespace)) return { ok: false, error: "namespace must not contain control characters." };

  return { ok: true, value: { query, namespace, tags: tags.value.length ? tags.value : undefined } };
}
