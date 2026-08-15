import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { adminClient } from "../../../../lib/server";

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

  try {
    const payload = JSON.parse(raw);
    const event = request.headers.get("x-github-event") ?? "unknown";
    const externalId = request.headers.get("x-github-delivery");
    const { error } = await adminClient().from("events").insert({
      source: "github",
      type: `github.${event}`,
      status: "received",
      external_id: externalId,
      payload,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ accepted: true, event: `github.${event}`, external_id: externalId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook payload" }, { status: 400 });
  }
}
