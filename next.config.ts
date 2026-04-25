import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native Node.js addons must be excluded from the webpack bundle
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
