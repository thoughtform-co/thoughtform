import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import {
  DEFAULT_CONFIG,
  mergeWithDefaults,
  type ParticleSystemConfig,
} from "@/lib/particle-config";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

const CONFIG_KEY = "particle-system-config";

/**
 * GET /api/particles/config
 * Returns the current particle system configuration
 * Priority: User-specific Supabase > Global Supabase > Vercel KV > defaults
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // 1. Try Supabase first (server-side with service role key)
    const supabase = createServerClient();
    if (supabase) {
      // If user ID provided, try user-specific config first
      if (userId) {
        const { data, error } = await supabase
          .from("particle_config")
          .select("config")
          .eq("user_id", userId)
          .single();

        if (!error && data?.config) {
          const config = mergeWithDefaults(data.config);
          return NextResponse.json(config);
        }
      }

      // Fall back to global default config
      const { data, error } = await supabase
        .from("particle_config")
        .select("config")
        .eq("id", "default")
        .single();

      if (!error && data?.config) {
        const config = mergeWithDefaults(data.config);
        return NextResponse.json(config);
      }
    }

    // 2. Fall back to Vercel KV
    try {
      const storedConfig = await kv.get<ParticleSystemConfig>(CONFIG_KEY);
      if (storedConfig) {
        const config = mergeWithDefaults(storedConfig);
        return NextResponse.json(config);
      }
    } catch (kvError) {
      // KV not configured, continue to defaults
      console.warn("Vercel KV not available:", kvError);
    }

    // 3. Return defaults
    return NextResponse.json(DEFAULT_CONFIG);
  } catch (error) {
    console.error("Failed to load particle config:", error);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

/**
 * POST /api/particles/config
 * Saves the particle system configuration
 * Requires admin authentication (checked via Vercel Auth header)
 */
export async function POST(request: Request) {
  try {
    // Check for admin authorization
    // In dev: allow all. In production: check Supabase session
    const isLocalDev = process.env.NODE_ENV === "development";
    const authorized = isLocalDev || (await isAuthorized());

    // Allow saves in local dev or if authenticated via Supabase
    if (!isLocalDev && !authorized) {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    // Parse and validate the config
    const body = await request.json();
    const userId = body.userId;
    const config = mergeWithDefaults(body) as ParticleSystemConfig;
    delete (config as any).userId; // Remove userId from config object

    // Increment version on save
    config.version = (config.version || 0) + 1;

    // 1. Try to save to Supabase first (server-side with service role key)
    const supabase = createServerClient();
    if (supabase) {
      // If user ID provided, save as user-specific config
      if (userId) {
        const { error: supabaseError } = await supabase.from("particle_config").upsert(
          {
            id: userId, // Use user ID as primary key (text)
            user_id: userId,
            config: config,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id", // Use user_id for conflict resolution
          }
        );

        if (!supabaseError) {
          return NextResponse.json({
            success: true,
            config,
            message: "Configuration saved successfully to Supabase (user-specific)",
          });
        }
        console.warn("Supabase user config save failed, falling back:", supabaseError);
      }

      // Fall back to global default config (if no user ID or user save failed)
      const { error: supabaseError } = await supabase.from("particle_config").upsert(
        {
          id: "default",
          config: config,
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
          message: userId
            ? "Configuration saved successfully to Supabase (user-specific)"
            : "Configuration saved successfully to Supabase (global)",
        });
      }
      console.warn("Supabase save failed, falling back to KV:", supabaseError);
    }

    // 2. Fall back to Vercel KV
    try {
      await kv.set(CONFIG_KEY, config);
      return NextResponse.json({
        success: true,
        config,
        message: "Configuration saved successfully to KV",
      });
    } catch (kvError) {
      // If KV also fails, return error
      throw kvError;
    }
  } catch (error) {
    console.error("Failed to save particle config:", error);

    // Check if it's a KV connection error
    if (error instanceof Error && error.message.includes("KV")) {
      return NextResponse.json(
        {
          error: "Vercel KV not configured",
          message:
            "Please set up Vercel KV in your project dashboard and link the environment variables.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}

/**
 * DELETE /api/particles/config
 * Resets configuration to defaults
 */
export async function DELETE(request: Request) {
  try {
    // Check for admin authorization
    // In dev: allow all. In production: check Supabase session
    const isLocalDev = process.env.NODE_ENV === "development";
    const authorized = isLocalDev || (await isAuthorized());

    if (!isLocalDev && !authorized) {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // 1. Try to delete from Supabase first
    const supabase = createServerClient();
    if (supabase) {
      // If user ID provided, delete user-specific config
      if (userId) {
        const { error: supabaseError } = await supabase
          .from("particle_config")
          .delete()
          .eq("user_id", userId);

        if (!supabaseError) {
          return NextResponse.json({
            success: true,
            config: DEFAULT_CONFIG,
            message: "Configuration reset to defaults (user-specific)",
          });
        }
      }

      // Fall back to deleting global default
      const { error: supabaseError } = await supabase
        .from("particle_config")
        .delete()
        .eq("id", "default");

      if (!supabaseError) {
        return NextResponse.json({
          success: true,
          config: DEFAULT_CONFIG,
          message: userId
            ? "Configuration reset to defaults (user-specific)"
            : "Configuration reset to defaults (global)",
        });
      }
      console.warn("Supabase delete failed, falling back to KV:", supabaseError);
    }

    // 2. Fall back to Vercel KV
    try {
      await kv.del(CONFIG_KEY);
      return NextResponse.json({
        success: true,
        config: DEFAULT_CONFIG,
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
