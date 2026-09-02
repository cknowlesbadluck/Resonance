import { NextResponse } from "next/server";
import { evaluateDeployContract } from "../../../src/deploy/contract";
import { readiness, readinessStatus } from "../../../src/deploy/health";

export const dynamic = "force-dynamic";

/** Unauthenticated readiness. Presence only — never echo secret values. */
export async function GET() {
  const body = readiness(evaluateDeployContract());
  return NextResponse.json(body, {
    status: readinessStatus(body),
    headers: { "Cache-Control": "no-store" },
  });
}
