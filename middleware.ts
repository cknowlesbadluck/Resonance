import { NextResponse, type NextRequest } from "next/server";
import { FixedWindowLimiter, clientKey, isExempt, limitFromEnv } from "./src/http/rate-limit";

const reads = new FixedWindowLimiter(limitFromEnv(process.env.RESONANCE_RATE_LIMIT_READS_PER_MIN, 120));
const writes = new FixedWindowLimiter(limitFromEnv(process.env.RESONANCE_RATE_LIMIT_WRITES_PER_MIN, 30));

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isExempt(pathname)) return NextResponse.next();
  const write = request.method !== "GET" && request.method !== "HEAD";
  const decision = (write ? writes : reads).check(`${clientKey(request.headers)}:${write ? "w" : "r"}`);
  if (!decision.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Retry later.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(decision.resetSeconds), "X-RateLimit-Limit": String(decision.limit) } },
    );
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
