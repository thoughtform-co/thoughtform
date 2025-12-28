import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import {
  DEFAULT_CONFIG,
  mergeWithDefaults,
  type ParticleSystemConfig,
} from "@/lib/particle-config";
import { logger } from "@/lib/logger";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

const CONFIG_KEY = "particle-system-config";

// Preset type for storage
interface ConfigPreset {
  id: string;
  name: string;
  config: ParticleSystemConfig;
  createdAt: number;
  updatedAt: number;
}

/**
 * GET /api/particles/config
 * Returns the GLOBAL particle system configuration (same for all visitors)
 * Only admin can modify it via POST
 */
export async function GET() {
  try {
    // 1. Try Supabase first - always load GLOBAL config
    const supabase = createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("particle_config")
        .select("config, presets, active_preset_id")
        .eq("id", "default")
        .single();

      if (!error && data?.config) {
        // Ensure mobileGateway and mobileManifold are preserved from saved config
        const loadedConfig = data.config as any;
        const config = mergeWithDefaults({
          ...loadedConfig,
          // Explicitly preserve mobile overrides (even if empty objects)
          mobileGateway:
            loadedConfig.mobileGateway !== undefined ? loadedConfig.mobileGateway : undefined,
          mobileManifold:
            loadedConfig.mobileManifold !== undefined ? loadedConfig.mobileManifold : undefined,
        });
        return NextResponse.json({
          config,
          presets: data.presets || [],
          activePresetId: data.active_preset_id || null,
        });
      }
    }

    // 2. Fall back to Vercel KV
    try {
      const storedConfig = await kv.get<ParticleSystemConfig>(CONFIG_KEY);
      if (storedConfig) {
        const config = mergeWithDefaults(storedConfig);
        return NextResponse.json({
          config,
          presets: [],
          activePresetId: null,
        });
      }
    } catch (kvError) {
      // KV not configured, continue to defaults
      logger.warn("Vercel KV not available:", kvError);
    }

    // 3. Return defaults
    return NextResponse.json({
      config: DEFAULT_CONFIG,
      presets: [],
      activePresetId: null,
    });
  } catch (error) {
    console.error("Failed to load particle config:", error);
    return NextResponse.json({
      config: DEFAULT_CONFIG,
      presets: [],
      activePresetId: null,
    });
  }
}

/**
 * POST /api/particles/config
 * Saves the GLOBAL particle system configuration + presets
 * Requires admin authentication - all visitors will see these changes
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
    const presets: ConfigPreset[] = body.presets || [];
    const activePresetId: string | null = body.activePresetId || null;
    // Extract and validate config
    const configData = body.config || body;
    delete configData.presets;
    delete configData.activePresetId;
    delete configData.userId;

    const config = mergeWithDefaults(configData) as ParticleSystemConfig;

    // Ensure mobileGateway and mobileManifold are explicitly included in saved config
    // (even if they're empty objects, so they persist across refreshes)
    if (configData.mobileGateway !== undefined) {
      config.mobileGateway = configData.mobileGateway;
    }
    if (configData.mobileManifold !== undefined) {
      config.mobileManifold = configData.mobileManifold;
    }

    // Increment version on save
    config.version = (config.version || 0) + 1;

    // 1. Try to save to Supabase first - GLOBAL config only
    const supabase = createServerClient();
    if (supabase) {
      const { error: supabaseError } = await supabase.from("particle_config").upsert(
        {
          id: "default",
          config: config,
          presets: presets,
          active_preset_id: activePresetId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

      if (!supabaseError) {
        return NextResponse.json({
          success: true,
          config,
          presets,
          activePresetId,
          message: "Configuration saved globally - all visitors will see this",
        });
      }
      logger.warn("Supabase save failed, falling back to KV:", supabaseError);
    }

    // 2. Fall back to Vercel KV (config only, no presets support)
    try {
      await kv.set(CONFIG_KEY, config);
      return NextResponse.json({
        success: true,
        config,
        presets: [],
        message: "Configuration saved to KV (presets not supported in fallback mode)",
      });
    } catch (kvError) {
      throw kvError;
    }
  } catch (error) {
    console.error("Failed to save particle config:", error);

    if (error instanceof Error && error.message.includes("KV")) {
      return NextResponse.json(
        {
          error: "Vercel KV not configured",
          message: "Please set up Vercel KV or Supabase for storage.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}

/**
 * DELETE /api/particles/config
 * Resets GLOBAL configuration to defaults (clears config and presets)
 */
export async function DELETE(request: Request) {
  try {
    // Check for admin authorization
    const authorized = await isAuthorized(request);

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    // 1. Try to reset in Supabase first
    const supabase = createServerClient();
    if (supabase) {
      // Reset global config to defaults (keep the row, just reset values)
      const { error: supabaseError } = await supabase.from("particle_config").upsert(
        {
          id: "default",
          config: DEFAULT_CONFIG,
          presets: [],
          active_preset_id: null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

      if (!supabaseError) {
        return NextResponse.json({
          success: true,
          config: DEFAULT_CONFIG,
          presets: [],
          message: "Configuration reset to defaults globally",
        });
      }
      logger.warn("Supabase reset failed, falling back to KV:", supabaseError);
    }

    // 2. Fall back to Vercel KV
    try {
      await kv.del(CONFIG_KEY);
      return NextResponse.json({
        success: true,
        config: DEFAULT_CONFIG,
        presets: [],
        message: "Configuration reset to defaults (KV)",
      });
    } catch (kvError) {
      throw kvError;
    }
  } catch (error) {
    console.error("Failed to reset particle config:", error);
    return NextResponse.json({ error: "Failed to reset configuration" }, { status: 500 });
  }
}
