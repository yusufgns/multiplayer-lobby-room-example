import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  async rewrites() {
    return [
      {
        source: '/trpc/:path*',
        destination: 'http://localhost:3001/trpc/:path*',
      },
    ];
  },
};

export default nextConfig;
