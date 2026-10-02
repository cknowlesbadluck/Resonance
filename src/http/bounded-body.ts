/**
 * Read a request body as UTF-8 text without buffering more than `maxBytes`.
 *
 * - Rejects early when a declared Content-Length exceeds the limit (no body read).
 * - Otherwise streams the body and aborts as soon as the running total exceeds the
 *   limit, so a missing or lying Content-Length cannot force an unbounded read.
 */
export type BoundedBodyResult = { ok: true; text: string } | { ok: false; status: 413 | 400; error: string };

export async function readBoundedText(request: Request, maxBytes: number): Promise<BoundedBodyResult> {
  const tooLarge = { ok: false as const, status: 413 as const, error: `Request body exceeds the ${maxBytes} byte limit.` };
  const declared = request.headers.get("content-length");
  if (declared !== null && declared.trim() !== "") {
    const length = Number(declared);
    if (!Number.isFinite(length) || length < 0) return { ok: false, status: 400, error: "Invalid Content-Length header." };
    if (length > maxBytes) return tooLarge;
  }
  if (!request.body) return { ok: true, text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return tooLarge;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(merged) };
}
