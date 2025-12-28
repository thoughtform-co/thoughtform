/**
 * Server-side particle config fetching
 * Used in Server Components to pre-load config for instant render
 */

import { createServerClient } from "./supabase";
import { DEFAULT_CONFIG, mergeWithDefaults, type ParticleSystemConfig } from "./particle-config";

/**
 * Fetch particle config from Supabase (server-side only)
 * This allows Server Components to pre-load the config
 * so Client Components don't flash with default values
 */
export async function getParticleConfig(): Promise<ParticleSystemConfig> {
  try {
    const supabase = createServerClient();

    if (!supabase) {
      console.warn("[getParticleConfig] Supabase not configured, using defaults");
      return DEFAULT_CONFIG;
    }

    const { data, error } = await supabase
      .from("particle_config")
      .select("config")
      .eq("id", "default")
      .single();

    if (error) {
      console.warn("[getParticleConfig] Supabase error:", error.message);
      return DEFAULT_CONFIG;
    }

    if (!data?.config) {
      return DEFAULT_CONFIG;
    }

    // Merge with defaults to ensure all fields exist
    const loadedConfig = data.config as any;
    return mergeWithDefaults({
      ...loadedConfig,
      mobileGateway: loadedConfig.mobileGateway,
      mobileManifold: loadedConfig.mobileManifold,
    });
  } catch (err) {
    console.error("[getParticleConfig] Failed to fetch:", err);
    return DEFAULT_CONFIG;
  }
}
