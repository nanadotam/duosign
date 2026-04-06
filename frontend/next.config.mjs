/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// When USE_BACKEND_POSE_PROXY=true, /api/pose/* is proxied to the backend.
// Leave it unset in local dev so the Next.js route handler
// (src/app/api/pose/[gloss]/route.ts) serves pose files directly without
// going through a backend 302 redirect to Supabase storage.
const usePoseProxy = process.env.USE_BACKEND_POSE_PROXY === "true";

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
      ...(usePoseProxy
        ? [
            {
              source: "/api/pose/:path*",
              destination: `${BACKEND_URL}/api/pose/:path*`,
            },
          ]
        : []),
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
