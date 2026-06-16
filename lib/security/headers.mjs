/**
 * Security headers for the Thoughtform.co marketing site.
 *
 * Implemented in `.mjs` so `next.config.mjs` can import it directly
 * at build time. A thin `.ts` wrapper re-exports the same module for
 * runtime callers and tests (TypeScript's `allowJs: true` makes the
 * types flow through cleanly).
 *
 * Strategy (Phase 2 of the Homepage Refactor And Hardening Plan):
 *
 *   - Always-on: X-Content-Type-Options, X-Frame-Options,
 *     Referrer-Policy, Permissions-Policy, Strict-Transport-Security
 *     (production only).
 *   - Staged: Content-Security-Policy is delivered in
 *     **Report-Only** mode for now so we can collect violations from
 *     the live homepage (R3F shaders, the v7 prototype's inline
 *     styles, the supabase realtime websocket) without breaking it.
 *     Promote to enforced (`Content-Security-Policy`) once the
 *     report queue is empty across all production routes.
 *
 * The CSP is intentionally permissive on `style-src` and `script-src`
 * because the prototype HTML still ships inline `<style>` blocks and
 * scripts. Tightening either one before the prototype is fully
 * Reactified would block the homepage from rendering.
 */

const SUPABASE_HOST_GLOB = "*.supabase.co";

/**
 * Build the CSP directive list. Exposed as a function so tests can
 * snapshot it and so the `next.config.mjs` import stays trivial.
 *
 * @param {{ allowUnsafeEval?: boolean }} [options]
 * @returns {string}
 */
export function buildContentSecurityPolicy(options = {}) {
  const directives = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],

    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(options.allowUnsafeEval ? ["'unsafe-eval'"] : []),
    ],

    "style-src": ["'self'", "'unsafe-inline'"],

    "font-src": ["'self'", "data:"],

    "img-src": ["'self'", "data:", "blob:", `https://${SUPABASE_HOST_GLOB}`],

    "media-src": ["'self'", "blob:"],

    "worker-src": ["'self'", "blob:"],

    "connect-src": [
      "'self'",
      `https://${SUPABASE_HOST_GLOB}`,
      `wss://${SUPABASE_HOST_GLOB}`,
      "https://vitals.vercel-insights.com",
      "https://va.vercel-scripts.com",
    ],

    "object-src": ["'none'"],

    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([key, values]) => (values.length === 0 ? key : `${key} ${values.join(" ")}`))
    .join("; ");
}

/**
 * Build the canonical Thoughtform.co header set.
 *
 * @param {{ isDevelopment?: boolean; enforceCsp?: boolean }} [options]
 * @returns {Array<{ key: string; value: string }>}
 */
export function buildSecurityHeaders(options = {}) {
  const isDev = options.isDevelopment ?? process.env.NODE_ENV !== "production";
  const csp = buildContentSecurityPolicy({ allowUnsafeEval: isDev });
  const cspHeaderName = options.enforceCsp
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";

  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: [
        "camera=()",
        "microphone=()",
        "geolocation=()",
        "payment=()",
        "interest-cohort=()",
      ].join(", "),
    },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: cspHeaderName, value: csp },
  ];

  if (!isDev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}

/**
 * The default Thoughtform.co header set, evaluated against the
 * current `process.env.NODE_ENV`. Used by tests + as a convenience
 * for runtime callers that want the same baseline set.
 */
export const THOUGHTFORM_SECURITY_HEADERS = buildSecurityHeaders();
