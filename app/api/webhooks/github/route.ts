import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function verify(raw: string, signature: string | null) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`);
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verify(raw, request.headers.get("x-hub-signature-256"))) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  const payload = JSON.parse(raw);
  const event = request.headers.get("x-github-event") ?? "unknown";
  const base = new URL(request.url).origin;
  const response = await fetch(`${base}/api/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ source: "github", type: `github.${event}`, external_id: request.headers.get("x-github-delivery"), payload }) });
  return NextResponse.json({ accepted: response.ok });
}
