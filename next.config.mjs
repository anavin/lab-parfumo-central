import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
// The receipt PDF (react-pdf) reads the Thai font + logo + QR from /public via
// path.join(process.cwd(), ...). Next traces those into the download route, but
// NOT into the receipt page's server action (emailReceipt) — so emailing a
// receipt hit ENOENT. Force those files into every function bundle that renders
// a receipt (the page/action and the API route).
const RECEIPT_ASSETS = ["./public/fonts/*.ttf", "./public/lab-parfumo-logo.png", "./public/lab-parfumo-qr.png"];

const nextConfig = {
  outputFileTracingRoot: __dirname,
  outputFileTracingIncludes: {
    "/receipt/[ref]": RECEIPT_ASSETS,
    "/api/receipt/[ref]/pdf": RECEIPT_ASSETS,
  },
  serverExternalPackages: ["@electric-sql/pglite"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // bill photo evidence is sent inline with the submit action (compressed)
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};
export default nextConfig;
