import withBundleAnalyzer from "@next/bundle-analyzer";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSecurityHeaders } from "./lib/security/headers.mjs";

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

// Security headers are computed once per build (not per request) — the
// shape doesn't depend on request state. The CSP is ENFORCED as of
// 2026-09-01 (pre-launch): Report-Only had shipped with no report-uri, so
// its "promote once the report queue is empty" gate described a queue
// that never existed. Enforcement was earned by a headed sweep instead —
// scripts/sweep-csp-enforced.mjs, 5 routes × 2 themes, zero violations —
// which first surfaced (and fixed) the two real breakers: the brandmark's
// Draco decoder (self-hosted under public/draco/ now) and the hologram
// codec probe's data: video. Re-run that sweep before widening or
// tightening any directive.
const securityHeaders = buildSecurityHeaders({
  isDevelopment: process.env.NODE_ENV !== "production",
  enforceCsp: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build output directory. Overridable so verification builds can target an
  // alternate dir (e.g. `NEXT_DIST_DIR=.next-verify npm run build`) without
  // clobbering the `.next` that a running dev server is serving from.
  // Defaults to `.next` — behavior is byte-identical when the env var is unset.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // Pin the workspace root so Next 16 doesn't pick up the stray lockfile in $HOME.
  // Applies to both Turbopack and webpack build paths.
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
  // The design MCP serves BRAND TRUTH READ LIVE FROM THE REPO — token values
  // parsed from the shipped CSS, law text from the ADR that owns it — which is
  // what stops it going stale against the code. Next's tracer follows imports,
  // and these are opened by path at request time, so it cannot see them: without
  // this list the route works in dev and 500s on Vercel with "cannot read ...".
  // ⚠ Adding a file to LAW_SOURCES in the route means adding it here too.
  outputFileTracingIncludes: {
    "/api/design/mcp": [
      "./DESIGN.md",
      "./app/styles/variables.css",
      "./components/landing/v7/theme.css",
      "./sentinel/decisions/065-corner-law.md",
      "./docs/design/card-reference-analysis.md",
      "./.claude/skills/thoughtform-design/references/navigation-grammar.md",
      "./.claude/skills/thoughtform-design/references/particle-icon-grammar.md",
      "./.claude/skills/thoughtform-design/references/tokens.md",
    ],
  },
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
        async headers() {
          return [
            {
              source: "/:path*",
              headers: securityHeaders,
            },
          ];
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
