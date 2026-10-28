import { isUuid } from "../auth/nexus-request";

export const MAX_RESUME_BODY_BYTES = 16 * 1024;
export const MAX_RESUME_ID_LENGTH = 128;
export const RESUME_STALE_MS = 5 * 60 * 1000;

export type ResumeBody = { projectId?: string; approved?: boolean };

/**
 * Parse and bound the POST /api/nexus/executions/[id]/resume body.
 * Previously the route used an unbounded `request.json()` and silently treated
 * malformed JSON as `{}`; non-UUID projectIds and non-boolean `approved` values
 * reached the database layer. Everything here fails closed with a 400.
 */
export function parseResumeBody(text: string): { ok: true; body: ResumeBody } | { ok: false; error: string } {
  if (new TextEncoder().encode(text).byteLength > MAX_RESUME_BODY_BYTES) {
    return { ok: false, error: "Request body exceeds the 16 KiB limit." };
  }
  if (!text.trim()) return { ok: true, body: {} };
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: "Invalid JSON body." }; }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "Body must be a JSON object." };
  const { projectId, approved } = raw as Record<string, unknown>;
  if (projectId !== undefined && !isUuid(projectId)) return { ok: false, error: "projectId must be a UUID." };
  if (approved !== undefined && typeof approved !== "boolean") return { ok: false, error: "approved must be a boolean." };
  return { ok: true, body: { projectId: projectId as string | undefined, approved: approved as boolean | undefined } };
}

export function isValidResumeId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= MAX_RESUME_ID_LENGTH && !/[\u0000-\u001f\u007f]/.test(id);
}

export interface StoredExecutionRequest {
  status: string;
  updated_at?: string | null;
  response?: unknown;
}

/** True when the stored response carries the intent recorded at approval time. */
export function hasResumableApproval(existing: StoredExecutionRequest): boolean {
  const response = existing.response;
  if (!response || typeof response !== "object") return false;
  const { intent } = response as { intent?: unknown };
  return Boolean(intent && typeof intent === "object");
}

/**
 * Decide whether an approved resume may claim this request.
 *
 * - `waiting` rows with a stored approval intent are resumable.
 * - A stale `accepted` row is only reclaimable when it carries a stored approval
 *   intent (i.e. a resume that crashed mid-execution). A plain execution that
 *   is still running, or crashed before composing, has no stored response; it must
 *   NOT be claimed here, because the old route then marked it `failed`, letting any
 *   project member clobber another caller's in-flight execution.
 */
export function resumeEligibility(existing: StoredExecutionRequest, now = Date.now()):
  | { ok: true; stuck: boolean }
  | { ok: false; status: 404 | 409; error: string } {
  const stale = existing.status === "accepted"
    && Boolean(existing.updated_at)
    && now - new Date(existing.updated_at as string).getTime() > RESUME_STALE_MS;
  if (existing.status !== "waiting" && !stale) {
    return { ok: false, status: 409, error: `Execution request is not awaiting approval (status: ${existing.status}).` };
  }
  if (!hasResumableApproval(existing)) {
    return stale
      ? { ok: false, status: 409, error: "Execution request is in progress and has no stored approval to resume." }
      : { ok: false, status: 404, error: "No resumable approval_required intent found for id" };
  }
  return { ok: true, stuck: stale };
}

/**
 * Outcome of a conditional (compare-and-set) update on nexus_execution_requests.
 * A Supabase error is NOT "someone else claimed it": reporting it as 409 hid
 * transient DB failures behind a non-retryable conflict. Errors map to
 * `db_error` (route answers a generic 500, logs server-side, never echoes it).
 */
export function conditionalUpdateOutcome(result: { data: unknown; error: unknown }): "updated" | "not_matched" | "db_error" {
  if (result.error) return "db_error";
  return result.data ? "updated" : "not_matched";
}
