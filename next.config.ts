// filepath: next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disable PWA in dev mode
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // FIX: Force Turbopack to completely ignore these heavy backend modules during the build
  serverExternalPackages:[
    "@prisma/client", 
    "@auth/prisma-adapter", 
    "next-auth", 
    "@simplewebauthn/server",
    "@simplewebauthn/browser"
  ],
};

export default withPWA(nextConfig);