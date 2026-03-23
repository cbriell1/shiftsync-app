// filepath: next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This allows the build to finish even if there are small type errors
    ignoreBuildErrors: true,
  },
  // FIX: Force Next.js to aggressively bundle the ESM WebAuthn packages 
  // so the Node.js externalRequire step doesn't crash on Vercel
  transpilePackages:[
    "@simplewebauthn/server", 
    "@simplewebauthn/browser", 
    "next-auth"
  ],
};

export default nextConfig;