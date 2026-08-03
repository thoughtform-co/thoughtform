/**
 * Next.js instrumentation hook — runs once per server cold start
 * (dev boot, `next start`, and each serverless cold start), for both
 * the nodejs and edge runtimes.
 *
 * Used for the env doctor: dev boots get a loud console.error when
 * `.env.local` is missing the keys that make localhost content match
 * production (the runtime fallbacks are deliberately silent —
 * see lib/env.ts); production cold starts get the single-line
 * missing-variable warning that already existed in lib/env.ts but was
 * never invoked.
 */
export async function register(): Promise<void> {
  // The env doctor reads process.env and logs — nodejs runtime only.
  // The edge runtime (`proxy.ts`) has no need for it and its logger
  // pulls in nodejs-flavored modules.
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { reportDevEnvHealth, reportMissingProductionEnv } = await import("@/lib/env");
  reportDevEnvHealth();
  reportMissingProductionEnv();
}
