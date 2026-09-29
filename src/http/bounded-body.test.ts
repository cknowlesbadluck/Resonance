import { describe, expect, it } from "vitest";
import { readBoundedText } from "./bounded-body";

function streamRequest(chunks: string[], headers: Record<string, string> = {}): Request {
  const encoder = new TextEncoder();
  let pulled = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (pulled < chunks.length) controller.enqueue(encoder.encode(chunks[pulled++]));
      else controller.close();
    },
  });
  return new Request("https://example.test/hook", { method: "POST", body, headers, duplex: "half" } as RequestInit);
}

describe("readBoundedText", () => {
  it("returns the body when under the limit", async () => {
    const result = await readBoundedText(new Request("https://example.test", { method: "POST", body: "hello" }), 10);
    expect(result).toEqual({ ok: true, text: "hello" });
  });

  it("rejects a declared Content-Length over the limit without reading", async () => {
    const request = streamRequest(["x"], { "content-length": "11" });
    const result = await readBoundedText(request, 10);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it("rejects an invalid Content-Length", async () => {
    const request = streamRequest(["x"], { "content-length": "abc" });
    const result = await readBoundedText(request, 10);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("caps a streamed body with no Content-Length", async () => {
    let pulls = 0;
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(encoder.encode("0123456789"));
        if (pulls > 1000) controller.close();
      },
    });
    const request = new Request("https://example.test", { method: "POST", body, duplex: "half" } as RequestInit);
    const result = await readBoundedText(request, 25);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
    expect(pulls).toBeLessThan(10);
  });

  it("accepts a body exactly at the limit", async () => {
    const result = await readBoundedText(streamRequest(["12345", "67890"]), 10);
    expect(result).toEqual({ ok: true, text: "1234567890" });
  });
});
