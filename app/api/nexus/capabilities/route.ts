import { NextResponse } from "next/server";
import { nexusRegistry } from "../../../../src/nexus/runtime";

export async function GET() {
  return NextResponse.json({ capabilities: nexusRegistry.list() });
}
