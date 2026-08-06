import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["@electric-sql/pglite"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // bill photo evidence is sent inline with the submit action (compressed)
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};
export default nextConfig;
