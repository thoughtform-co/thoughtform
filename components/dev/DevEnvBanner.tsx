"use client";

/**
 * Dev-only on-page counterpart of the env doctor (lib/env.ts).
 *
 * When the browser-inlined Supabase env is missing, localhost renders
 * seed/fallback content that silently differs from production — the
 * server console gets a loud error from `reportDevEnvHealth()`, and
 * this chip makes the same fact visible on the page itself.
 *
 * Renders nothing in production builds; the mount site in
 * Providers.tsx additionally gates on NODE_ENV so the module is
 * dead-code-eliminated from production bundles entirely.
 */
export function DevEnvBanner() {
  if (process.env.NODE_ENV !== "development") return null;

  // NEXT_PUBLIC_* values are statically inlined into the client
  // bundle at build/dev-compile time, so this is a compile-time
  // constant check, not a runtime fetch.
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 10000,
        padding: "6px 10px",
        borderRadius: 4,
        background: "rgba(120, 20, 20, 0.92)",
        border: "1px solid rgba(255, 120, 120, 0.6)",
        color: "#ffd7d7",
        font: "500 11px/1.4 ui-monospace, monospace",
        pointerEvents: "none",
        maxWidth: 380,
      }}
    >
      DEV: Supabase env missing ({missing.join(", ")}) — seed data active, localhost ≠ production.
      See .env.example.
    </div>
  );
}
