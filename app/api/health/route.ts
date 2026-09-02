import { NextResponse } from "next/server";
import { liveness } from "../../../src/deploy/health";

export const dynamic = "force-dynamic";

/** Unauthenticated liveness. No secrets, no persistence calls. */
export async function GET() {
  return NextResponse.json(liveness(), {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
