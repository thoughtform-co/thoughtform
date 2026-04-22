import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // Fix for OpenTelemetry clientModules error
  experimental: {
    instrumentationHook: false,
  },
  async redirects() {
    return [
      { source: "/v7", destination: "/", permanent: true },
    ];
  },
  // Suppress OpenTelemetry warnings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default bundleAnalyzer(nextConfig);
