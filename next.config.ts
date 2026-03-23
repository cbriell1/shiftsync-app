// filepath: next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FIX: Forces Vercel to explicitly trace and bundle the Prisma database engine
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  // FIX: Protects our heavy backend modules from the Turbopack compiler
  serverExternalPackages:[
    "@prisma/client",
    "@auth/prisma-adapter",
    "@simplewebauthn/server"
  ]
};

export default nextConfig;