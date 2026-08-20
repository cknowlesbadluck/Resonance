import { NextResponse } from "next/server";
import { listCapabilities, resolveCapabilities } from "../../../../lib/capabilities";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams
    .get("ids")
    ?.split(",")
    .map(value => value.trim())
    .filter(Boolean) ?? [];

  if (ids.length === 0) {
    return NextResponse.json({ capabilities: listCapabilities() });
  }

  return NextResponse.json(resolveCapabilities(ids));
}
