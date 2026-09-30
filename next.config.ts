import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { securityHeaders } from "./src/deploy/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

export default nextConfig;