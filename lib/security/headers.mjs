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

    /* `va.vercel-scripts.com` is Vercel Analytics + Speed Insights
       (mounted in app/layout.tsx, 2026-09-01). In production the packages
       inject a script from that host; connect-src below already carried
       both measurement hosts from the original policy design. Pinned by
       `tests/lib/security-headers.test.ts` — a third script host has to
       argue for itself there.
       ⚠ `'wasm-unsafe-eval'` is the Draco decoder (2026-09-01): the
       brandmark GLB requires KHR_draco_mesh_compression and the decoder
       is self-hosted WASM under /draco/ — Chrome refuses
       WebAssembly.instantiate without this token even for same-origin
       wasm. It permits ONLY wasm compilation, never JS eval; the dev-only
       'unsafe-eval' below is the broader one HMR needs. */
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'wasm-unsafe-eval'",
      "https://va.vercel-scripts.com",
      ...(options.allowUnsafeEval ? ["'unsafe-eval'"] : []),
    ],

    "style-src": ["'self'", "'unsafe-inline'"],

    "font-src": ["'self'", "data:"],

    /* ⚠ `i.ytimg.com` IS THE EMBEDDED PLAYER'S OWN POSTER, and it is here
       because it was MEASURED under an enforced policy, not guessed: with
       `frame-src` allowed the film plays fine, but Chrome still checks that
       one image against this directive and logs a violation. Playback never
       depended on it — the poster is the pre-roll frame — but the report
       queue emptying is the stated gate for turning enforcement on
       (`next.config.mjs`), so a violation nobody can action is a violation
       that keeps the gate shut. Named host, no wildcard. */
    "img-src": ["'self'", "data:", "blob:", `https://${SUPABASE_HOST_GLOB}`, "https://i.ytimg.com"],

    /* ⚠ SELF-HOSTED ONLY, AND THAT IS LOAD-BEARING. Every film and
       walkthrough on this site lives in `public/videos/` because of this
       line — a remote `src` is blocked the moment the CSP leaves
       report-only, so video can never quietly move to a bucket. Pinned by
       `tests/lib/security-headers.test.ts`.
       ⚠ `data:` is the hologram's codec probe (2026-09-01, found by the
       enforcement sweep): `lib/voidwalker/holoAlphaSupport.ts` decodes a
       tiny inline `data:video/webm` to decide the alpha branch, and with
       data: blocked the probe fails SILENTLY — verdict null — and every
       browser takes the Safari floor path. A data: URI is inline content,
       not a remote host, so the no-bucket law is intact. */
    "media-src": ["'self'", "blob:", "data:"],

    /* THE ONE FRAME WE EMBED (ADR-074 U2): the through-line's Save The
       Expanse film, on the owner's own channel. `frame-src` was ABSENT
       before this, which meant it fell back to `default-src 'self'` — an
       iframe rendered under the report-only header today and would have
       hard-blocked the day `enforceCsp` flips (which `next.config.mjs`
       states as the standing intent). Named explicitly rather than left to
       the fallback.
       ⚠ `-nocookie`, not `youtube.com`: nothing is set until the viewer
       presses play, and the player only ever mounts inside the lightbox
       after a click. Widening this list is a decision, not a detail — the
       pin in the header test is what makes a fifth host argue for itself. */
    "frame-src": ["https://www.youtube-nocookie.com"],

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
