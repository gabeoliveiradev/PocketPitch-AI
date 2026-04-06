import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*"],
  trailingSlash: true, // Crucial for Django compatibility (prevents POST -> GET redirects)

  async rewrites() {
    return [
      {
        source: "/api/:path*/", // Match with trailing slash
        destination: `${backendUrl}/api/:path*/`,
      },
      {
        source: "/api/:path*", // Match without trailing slash as fallback
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
