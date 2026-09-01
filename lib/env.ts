/**
 * Centralized environment-variable accessors for the server.
 *
 * Why this module exists:
 *
 * - 30+ API routes were each calling `process.env.*` with bespoke
 *   `!` assertions and ad-hoc fallback strings. A single typo or a
 *   missing Vercel env in production leaked through as a runtime
 *   500 deep in a route handler instead of a clear configuration
 *   error.
 * - The Sentinel security skill requires that "All secrets should
 *   be declared in a validated env schema." This module is the
 *   minimum viable schema — pure TypeScript, no extra dependency,
 *   no boot-time crash (we still want the marketing page to render
 *   even if the Anthropic key is unset).
 *
 * Usage:
 *
 *     import { serverEnv, requireServerEnv } from "@/lib/env";
 *
 *     const supabaseUrl = serverEnv.NEXT_PUBLIC_SUPABASE_URL;       // string | undefined
 *     const anthropicKey = requireServerEnv("ANTHROPIC_API_KEY");   // string, throws clear error
 *
 * The `serverEnv` accessor is read-only on the snapshot taken at
 * module init. `requireServerEnv` is the preferred form for any
 * code path that must NOT silently fall back (e.g. mutating API
 * routes that need the service-role key).
 */

import { logger } from "@/lib/logger";

/**
 * Schema of every environment variable the server-side code reads.
 *
 * Keep client-safe variables (`NEXT_PUBLIC_*`) and server-only
 * secrets clearly separated; never read a `NEXT_PUBLIC_*` value as
 * if it were a secret — it ships in the client bundle.
 */
export interface ServerEnvSchema {
  // ─── Supabase ────────────────────────────────────────────────
  /** Public anon Supabase URL (also exposed to the browser). */
  NEXT_PUBLIC_SUPABASE_URL?: string;
  /** Public anon key (browser session client). */
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  /** Service-role key — server-only. Bypasses RLS. */
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // ─── Auth allowlist ──────────────────────────────────────────
  /** Allowlisted admin email (single-admin model, ADR-003). */
  NEXT_PUBLIC_ALLOWED_EMAIL?: string;

  // ─── Vercel KV (optional) ────────────────────────────────────
  KV_URL?: string;
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
  KV_REST_API_READ_ONLY_TOKEN?: string;

  // ─── External AI providers (server-only secrets) ─────────────
  ANTHROPIC_API_KEY?: string;
  VOYAGE_API_KEY?: string;
  VOYAGE_EMBED_MODEL?: string;
  REPLICATE_API_TOKEN?: string;
  REPLICATE_SAM2_MODEL?: string;

  // ─── Design MCP (/api/design/mcp) ────────────────────────────
  /**
   * Bearer token for the design MCP. The route fails CLOSED with 503 when this
   * is unset — an unconfigured token must never mean an open endpoint.
   */
  DESIGN_MCP_TOKEN?: string;
  /**
   * Optional overrides for the design corpus's two embedding spaces. Left
   * unset, the route trusts what `design_meta` says the corpus was built with.
   * Set one to a model the corpus was NOT embedded with and the route refuses
   * to search rather than comparing vectors across two unrelated spaces.
   */
  VOYAGE_TEXT_MODEL?: string;
  VOYAGE_IMAGE_MODEL?: string;
  /** Where scripts/design-corpus/sync.mjs reads the substrate vault from. */
  DESIGN_VAULT_ROOT?: string;

  // ─── Figma bridge (server-only) ──────────────────────────────
  FIGMA_ACCESS_TOKEN?: string;
  FIGMA_FILE_KEY?: string;
  /** Public Figma file key for the astrogation overlay (browser). */
  NEXT_PUBLIC_FIGMA_FILE_KEY?: string;

  // ─── Custom services ─────────────────────────────────────────
  SEGMENTER_URL?: string;

  // ─── Build / runtime ─────────────────────────────────────────
  NODE_ENV?: "development" | "production" | "test";
  BASE_URL?: string;
  /** "1" enables the static export mode in next.config.mjs. */
  NEXT_OUTPUT_EXPORT?: string;
  /** "true" enables the bundle analyzer. */
  ANALYZE?: string;
  /** Vercel runtime flag. */
  CI?: string;
}

type EnvKey = keyof ServerEnvSchema;

const SECRET_KEYS = new Set<EnvKey>([
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "VOYAGE_API_KEY",
  "REPLICATE_API_TOKEN",
  "FIGMA_ACCESS_TOKEN",
  "KV_REST_API_TOKEN",
  "DESIGN_MCP_TOKEN",
]);

const PUBLIC_KEY_PREFIX = "NEXT_PUBLIC_";

/**
 * Read-only proxy over `process.env` that exposes only the keys
 * declared in `ServerEnvSchema`. Safer than passing `process.env`
 * around: typos surface as type errors, and there's a single place
 * to extend when new secrets land.
 */
export const serverEnv: Readonly<ServerEnvSchema> = new Proxy({} as ServerEnvSchema, {
  get(_target, prop: string) {
    return process.env[prop];
  },
});

/**
 * Strict accessor: returns the env value or throws a descriptive
 * error. Use in routes/services where falling back silently would
 * hide a misconfiguration.
 */
export function requireServerEnv(key: EnvKey): string {
  const value = process.env[key];
  if (typeof value !== "string" || value.length === 0) {
    const isSecret = SECRET_KEYS.has(key);
    const guidance = key.startsWith(PUBLIC_KEY_PREFIX)
      ? "Add it to Vercel → Project Settings → Environment Variables (exposed to the browser)."
      : isSecret
        ? "Add it to Vercel → Project Settings → Environment Variables as a server-only secret."
        : "Set it in `.env.local` for development or in Vercel for production.";
    throw new Error(`Missing required environment variable: ${key}. ${guidance}`);
  }
  return value;
}

/**
 * Soft accessor: returns the env value or `null`. Use in code paths
 * that have a graceful fallback.
 */
export function optionalServerEnv(key: EnvKey): string | null {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Boot-time sanity check — logs a single warning when expected
 * production secrets are missing. Designed to be safe in dev (warns
 * once) and visible in Vercel logs (single line per missing var).
 *
 * Call from a place that runs on cold-start (e.g. instrumentation,
 * or once at the top of a route's module scope) — this module does
 * NOT auto-invoke it so import order can't affect test runs.
 */
export function reportMissingProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const required: EnvKey[] = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_ALLOWED_EMAIL",
    // The landing's SSR reads celestial slots through createServerClient(),
    // which needs the service-role key — without it the homepage silently
    // renders the SEED connector art with only a log line to say so.
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = required.filter((key) => !optionalServerEnv(key));
  if (missing.length > 0) {
    logger.warn(`[env] Missing required production variables: ${missing.join(", ")}`);
  }
}

/**
 * Determine whether a given variable name is a public (browser-
 * exposed) variable. Useful when generating .env templates or
 * deciding whether to log a value.
 */
export function isPublicEnvKey(key: string): boolean {
  return key.startsWith(PUBLIC_KEY_PREFIX);
}

/**
 * Dev-boot env doctor — the loud counterpart to the silent runtime
 * fallbacks. Production keeps degrading gracefully (seed celestial
 * slots, DEFAULT_CONFIG particles); in dev that same grace made a
 * broken `.env.local` look like "the site renders different content
 * on localhost than on Vercel" with only a buried console.warn as
 * evidence. This prints an unmissable console.error once per server
 * boot instead.
 *
 * Called from `instrumentation.ts` alongside
 * `reportMissingProductionEnv()`.
 */
export function reportDevEnvHealth(): void {
  if (process.env.NODE_ENV !== "development") return;

  const critical: EnvKey[] = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const missing = critical.filter((key) => !optionalServerEnv(key));
  if (missing.length > 0) {
    console.error(
      `\n[env-doctor] Missing in .env.local: ${missing.join(", ")}\n` +
        `  Supabase is DISABLED — celestial connectors render SEED data and\n` +
        `  particle config falls back to DEFAULT_CONFIG, so localhost will NOT\n` +
        `  match production. Copy .env.example -> .env.local and fill values.\n`
    );
  }

  // The landing SSR reads celestial slots through the service-role
  // client (`createServerClient`); without this key it silently
  // returns null and the page renders seed connectors even when the
  // anon key works. Surface that as its own line.
  if (!optionalServerEnv("SUPABASE_SERVICE_ROLE_KEY")) {
    console.error(
      `[env-doctor] SUPABASE_SERVICE_ROLE_KEY is not set — landing celestial\n` +
        `  content renders SEED data locally (Vercel renders live rows).\n`
    );
  }
}
