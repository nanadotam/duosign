/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/translate/:path*",
        destination: `${BACKEND_URL}/api/translate/:path*`,
      },
      {
        source: "/api/vocabulary/:path*",
        destination: `${BACKEND_URL}/api/vocabulary/:path*`,
      },
      {
        source: "/api/export/:path*",
        destination: `${BACKEND_URL}/api/export/:path*`,
      },
      {
        source: "/api/video/:path*",
        destination: `${BACKEND_URL}/api/video/:path*`,
      },
      {
        source: "/api/pose/:path*",
        destination: `${BACKEND_URL}/api/pose/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // pose-format imports 'fs' for its fromLocal() method.
      // We only use fromRemote()/from() in the browser, so stub fs out.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
