import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4050',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.hygraph.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.graphassets.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.graphassets.dev',
        pathname: '/**',
      },
    ],
  },
  // Suppress warning about lockfiles
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
