import { unstable_cache } from "next/cache";

import { createServerClient } from "../supabase";
import type { CelestialConfig, SlotsMap } from "./schema";
import { SEED_CONFIGS, SEED_SLOT_ASSIGNMENTS } from "./seed-data";

/**
 * Cache tag for everything that renders from celestial_slots /
 * celestial_designs. The mutation routes (`/api/celestial/slots`,
 * `/api/celestial/designs`) call `revalidateTag(CELESTIAL_SLOTS_TAG)`
 * after a successful write so the prerendered marketing pages pick up
 * admin edits without a redeploy.
 */
export const CELESTIAL_SLOTS_TAG = "celestial-slots";

/**
 * Cached variant for the marketing pages. Keeps Supabase out of the
 * visitor request path: the query result lives in the data cache for
 * up to 5 minutes and is invalidated instantly by the admin mutation
 * routes via `revalidateTag`. Deliberately NOT segment-level
 * `export const revalidate` — that would break the
 * `NEXT_OUTPUT_EXPORT=1` static-export packaging build; in export
 * mode this simply runs once at build time.
 */
export const getCelestialSlotsCached = unstable_cache(
  () => getCelestialSlots(),
  ["celestial-slots"],
  { revalidate: 300, tags: [CELESTIAL_SLOTS_TAG] }
);

/** Reasons the landing render served seed data instead of DB rows.
 *  Logged in a stable, greppable shape so a localhost-vs-production
 *  content divergence can be diagnosed from one terminal line. */
type SeedFallbackReason = "env-missing" | "db-error" | "empty" | "timeout" | "exception";

function warnSeedFallback(reason: SeedFallbackReason, detail?: string): void {
  console.warn(
    `[getCelestialSlots] fallback reason=${reason}${detail ? ` detail=${detail}` : ""} — rendering SEED celestial data`
  );
}

/** Hard ceiling on the slots query. The landing SSR awaits this call;
 *  without a timeout a black-holed Supabase connection (stale URL,
 *  VPN, captive network) hangs the entire local render forever —
 *  "localhost never loads" while production is fine. Timing out into
 *  the seed fallback matches what an outright failure already does. */
const SLOTS_QUERY_TIMEOUT_MS = 3500;

/**
 * Server-side: fetch all active celestial slot assignments with their configs.
 * Falls back to hardcoded seed data when Supabase is unavailable.
 */
export async function getCelestialSlots(): Promise<SlotsMap> {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      warnSeedFallback(
        "env-missing",
        "createServerClient returned null (SUPABASE_SERVICE_ROLE_KEY?)"
      );
      return buildSeedFallback();
    }

    const query = supabase
      .from("celestial_slots")
      .select(
        `
        slot_id,
        orientation,
        enabled,
        design_id,
        celestial_designs ( config )
      `
      )
      .eq("enabled", true);

    const TIMEOUT = Symbol("slots-timeout");
    const raced = await Promise.race([
      query,
      new Promise<typeof TIMEOUT>((resolve) =>
        setTimeout(() => resolve(TIMEOUT), SLOTS_QUERY_TIMEOUT_MS)
      ),
    ]);

    if (raced === TIMEOUT) {
      warnSeedFallback("timeout", `${SLOTS_QUERY_TIMEOUT_MS}ms`);
      return buildSeedFallback();
    }

    const { data, error } = raced;

    if (error) {
      warnSeedFallback("db-error", error.message);
      return buildSeedFallback();
    }
    if (!data || data.length === 0) {
      warnSeedFallback("empty");
      return buildSeedFallback();
    }

    const slots: SlotsMap = {};
    for (const row of data) {
      const designs = row.celestial_designs as unknown;
      const config =
        designs && typeof designs === "object" && "config" in (designs as Record<string, unknown>)
          ? (designs as { config: CelestialConfig }).config
          : null;
      if (!config) continue;
      slots[row.slot_id] = {
        slot_id: row.slot_id,
        config,
        orientation: row.orientation as "horizontal" | "vertical",
        enabled: row.enabled,
      };
    }
    return slots;
  } catch (err) {
    warnSeedFallback("exception", err instanceof Error ? err.message : String(err));
    return buildSeedFallback();
  }
}

function buildSeedFallback(): SlotsMap {
  const slots: SlotsMap = {};
  for (const [slotId, designName] of Object.entries(SEED_SLOT_ASSIGNMENTS)) {
    const config = SEED_CONFIGS[designName];
    if (config) {
      slots[slotId] = { slot_id: slotId, config, orientation: "horizontal", enabled: true };
    }
  }
  return slots;
}
