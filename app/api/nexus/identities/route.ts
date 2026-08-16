import { NextResponse } from "next/server";
import { nexusAdapters } from "../../../../src/nexus/runtime";

export async function GET() {
  const descriptions = await Promise.all(nexusAdapters.map((adapter) => adapter.describe()));
  return NextResponse.json({ identities: descriptions.map((item) => item.identity), resources: descriptions.flatMap((item) => item.resources ?? []) });
}
