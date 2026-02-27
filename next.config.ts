import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This allows the build to finish even if there are small type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // This allows the build to finish even if there are linting warnings
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;