import { createServerClient } from "../supabase";
import type { CelestialConfig, SlotsMap } from "./schema";
import { SEED_CONFIGS, SEED_SLOT_ASSIGNMENTS } from "./seed-data";

/**
 * Server-side: fetch all active celestial slot assignments with their configs.
 * Falls back to hardcoded seed data when Supabase is unavailable.
 */
export async function getCelestialSlots(): Promise<SlotsMap> {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      console.warn("[getCelestialSlots] Supabase not configured, using seed fallback");
      return buildSeedFallback();
    }

    const { data, error } = await supabase
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

    if (error || !data || data.length === 0) {
      console.warn(
        "[getCelestialSlots] DB query failed or empty, using seed fallback",
        error?.message
      );
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
    console.error("[getCelestialSlots] Failed:", err);
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
