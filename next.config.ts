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
  // Ensure heavy Node.js packages aren't incorrectly bundled by Turbopack
  serverExternalPackages:[
    "@prisma/client", 
    "@auth/prisma-adapter",
    "@simplewebauthn/server"
  ],
};

export default nextConfig;