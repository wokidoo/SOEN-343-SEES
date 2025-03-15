import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: 'http://127.0.0.1:8000/api/:path*', // Using 127.0.0.1 instead of localhost
      },
    ];
  },
};

export default nextConfig;
