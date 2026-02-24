/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
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
