import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import { resolveSigilShape } from "@/lib/sigil-geometries";

// ═══════════════════════════════════════════════════════════════════
// SIGIL CONFIG API
// Manages sigil configurations for the 3 service cards
// Now supports new Thoughtform shapes with legacy fallback
// ═══════════════════════════════════════════════════════════════════

/** Render mode for sigil */
type SigilRenderMode = "sigil" | "landmark";

interface SigilConfig {
  shape: string; // Shape ID from registry (with fallback)
  particleCount: number;
  color: string;
  size?: number;
  offsetX?: number;
  offsetY?: number;
  seed?: number;
  renderMode?: SigilRenderMode;
  animationParams: {
    drift?: number;
    pulse?: number;
    glitch?: number;
    density?: number;
  };
}

// New default configs using Thoughtform shapes
const DEFAULT_SIGIL_CONFIGS: SigilConfig[] = [
  {
    shape: "tf_constellationMesh",
    particleCount: 200,
    color: "202, 165, 84",
    animationParams: { drift: 1, pulse: 1, glitch: 0.1 },
  },
  {
    shape: "tf_trefoilKnot",
    particleCount: 200,
    color: "202, 165, 84",
    animationParams: { drift: 1, pulse: 1, glitch: 0.1 },
  },
  {
    shape: "tf_vortexBloom",
    particleCount: 200,
    color: "202, 165, 84",
    animationParams: { drift: 1, pulse: 1, glitch: 0.1 },
  },
];

/** Row shape returned from service_sigils table (seed is optional for backwards compat) */
type ServiceSigilRow = {
  card_index: number;
  shape: string;
  particle_count: number;
  color: string;
  size?: number;
  offset_x?: number;
  offset_y?: number;
  seed?: number;
  render_mode?: SigilRenderMode;
  animation_params?: Record<string, number>;
};

/**
 * Resolve config shape (handles legacy shapes)
 */
function resolveConfig(row: ServiceSigilRow): SigilConfig {
  return {
    shape: resolveSigilShape(row.shape), // Resolve legacy → new
    particleCount: row.particle_count,
    color: row.color,
    size: row.size,
    offsetX: row.offset_x,
    offsetY: row.offset_y,
    seed: row.seed,
    renderMode: row.render_mode || "sigil",
    animationParams: row.animation_params || { drift: 1, pulse: 1, glitch: 0.1 },
  };
}

/**
 * GET /api/sigils/config
 * Returns the GLOBAL sigil configurations for all 3 service cards
 * Automatically resolves legacy shapes to new Thoughtform shapes
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    if (supabase) {
      // Prefer the newest schema (includes seed). If the DB hasn't been migrated yet,
      // gracefully fall back to the older schema selection.
      const selectWithSeed =
        "card_index, shape, particle_count, color, size, offset_x, offset_y, seed, render_mode, animation_params";
      const selectWithoutSeed =
        "card_index, shape, particle_count, color, size, offset_x, offset_y, render_mode, animation_params";

      let data: ServiceSigilRow[] | null = null;
      let error: { message: string } | null = null;

      const result1 = await supabase
        .from("service_sigils")
        .select(selectWithSeed)
        .order("card_index", { ascending: true });

      data = result1.data as ServiceSigilRow[] | null;
      error = result1.error;

      // Fallback if seed column doesn't exist yet
      if (error) {
        const result2 = await supabase
          .from("service_sigils")
          .select(selectWithoutSeed)
          .order("card_index", { ascending: true });

        data = result2.data as ServiceSigilRow[] | null;
        error = result2.error;
      }

      if (!error && data && data.length === 3) {
        // Resolve legacy shapes during read
        const configs = data.map((row) => resolveConfig(row));
        return NextResponse.json({ configs });
      }
    }

    // Return defaults if no data found
    return NextResponse.json({ configs: DEFAULT_SIGIL_CONFIGS });
  } catch (error) {
    console.error("Failed to load sigil configs:", error);
    return NextResponse.json({ configs: DEFAULT_SIGIL_CONFIGS });
  }
}

/**
 * POST /api/sigils/config
 * Saves the GLOBAL sigil configurations
 * Requires admin authentication
 */
export async function POST(request: Request) {
  try {
    // Check for admin authorization
    const authorized = await isAuthorized(request);

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const configs: SigilConfig[] = body.configs;

    if (!configs || !Array.isArray(configs) || configs.length !== 3) {
      return NextResponse.json(
        { error: "Invalid configs - must be an array of 3 sigil configurations" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Upsert all 3 configs (resolving shapes on save as well)
    for (let i = 0; i < 3; i++) {
      const config = configs[i];
      const resolvedShape = resolveSigilShape(config.shape);

      const row: Record<string, unknown> = {
        card_index: i,
        shape: resolvedShape, // Save resolved shape
        particle_count: config.particleCount,
        color: config.color,
        size: config.size,
        offset_x: config.offsetX,
        offset_y: config.offsetY,
        render_mode: config.renderMode || "sigil",
        animation_params: config.animationParams,
        updated_at: new Date().toISOString(),
      };

      // Only send seed when explicitly set to avoid breaking older schemas.
      if (typeof config.seed === "number") {
        row.seed = config.seed;
      }

      let { error } = await supabase.from("service_sigils").upsert(row, {
        onConflict: "card_index",
      });

      // Backwards-compatible retry: if the DB doesn't have the `seed` column yet,
      // retry the upsert without seed so other changes still persist.
      if (error && typeof row.seed === "number") {
        const msg = (error as { message?: string })?.message ?? "";
        const code = (error as { code?: string })?.code ?? "";
        const looksLikeMissingSeed =
          code === "PGRST204" ||
          msg.includes("Could not find the 'seed' column") ||
          msg.includes("seed");

        if (looksLikeMissingSeed) {
          const retryRow: Record<string, unknown> = { ...row };
          delete retryRow.seed;
          ({ error } = await supabase.from("service_sigils").upsert(retryRow, {
            onConflict: "card_index",
          }));
        }
      }

      if (error) {
        logger.warn(`Failed to save sigil config for card ${i}:`, error);
        return NextResponse.json(
          { error: `Failed to save configuration for card ${i}` },
          { status: 500 }
        );
      }
    }

    // Return with resolved shapes
    const resolvedConfigs = configs.map((c) => ({
      ...c,
      shape: resolveSigilShape(c.shape),
    }));

    return NextResponse.json({
      success: true,
      configs: resolvedConfigs,
      message: "Sigil configurations saved globally",
    });
  } catch (error) {
    console.error("Failed to save sigil configs:", error);
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}

/**
 * DELETE /api/sigils/config
 * Resets sigil configurations to defaults
 */
export async function DELETE(request: Request) {
  try {
    // Check for admin authorization
    const authorized = await isAuthorized(request);

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Reset all 3 configs to defaults
    for (let i = 0; i < 3; i++) {
      const config = DEFAULT_SIGIL_CONFIGS[i];
      const { error } = await supabase.from("service_sigils").upsert(
        {
          card_index: i,
          shape: config.shape,
          particle_count: config.particleCount,
          color: config.color,
          animation_params: config.animationParams,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "card_index",
        }
      );

      if (error) {
        logger.warn(`Failed to reset sigil config for card ${i}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      configs: DEFAULT_SIGIL_CONFIGS,
      message: "Sigil configurations reset to defaults",
    });
  } catch (error) {
    console.error("Failed to reset sigil configs:", error);
    return NextResponse.json({ error: "Failed to reset configuration" }, { status: 500 });
  }
}
