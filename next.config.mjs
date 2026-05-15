import withBundleAnalyzer from "@next/bundle-analyzer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// When set, build a self-contained static export of just the marketing page
// (used by `scripts/package-homepage-static.mjs` to produce a shareable zip).
// Static export is incompatible with redirects(), middleware, and API routes,
// so the package script also quarantines those before invoking `next build`.
const exportMode = process.env.NEXT_OUTPUT_EXPORT === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // Pin the workspace root so Next 16 doesn't pick up the stray lockfile in $HOME.
  // Applies to both Turbopack and webpack build paths.
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
  ...(exportMode
    ? {
        output: "export",
        images: { unoptimized: true },
        // The shareable static export quarantines API routes; some non-route
        // files type-import from them. Those are erased at runtime, so we
        // skip the typecheck/lint pass for this one-off build.
        typescript: { ignoreBuildErrors: true },
        eslint: { ignoreDuringBuilds: true },
      }
    : {
        async redirects() {
          return [{ source: "/v7", destination: "/", permanent: true }];
        },
      }),
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
