import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds for development
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during builds for development
    ignoreBuildErrors: true,
  },
  // Ensure native/server-only packages aren't bundled into edge runtime
  serverExternalPackages: [
    'ssh2',
    'ssh2-sftp-client'
  ],
};

export default nextConfig;
