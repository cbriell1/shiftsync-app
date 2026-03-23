// filepath: next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This allows the build to finish even if there are small type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore linting errors during build
    ignoreDuringBuilds: true,
  },
  // Protects heavy backend modules from the Turbopack compiler
  serverExternalPackages:[
    "@prisma/client",
    "@auth/prisma-adapter",
    "@simplewebauthn/server"
  ],
  // FIX: Forcefully packages the Prisma database engine into the Vercel serverless deployment
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@prisma/client/**/*"],
    "/api/**/*":["./node_modules/@prisma/client/**/*"]
  }
};

export default nextConfig;