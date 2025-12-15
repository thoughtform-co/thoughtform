import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import {
  DEFAULT_CONFIG,
  mergeWithDefaults,
  type ParticleSystemConfig,
} from "@/lib/particle-config";

const CONFIG_KEY = "particle-system-config";

/**
 * GET /api/particles/config
 * Returns the current particle system configuration
 */
export async function GET() {
  try {
    // Try to get config from KV store
    const storedConfig = await kv.get<ParticleSystemConfig>(CONFIG_KEY);

    if (storedConfig) {
      // Merge with defaults to ensure all fields exist (handles schema migrations)
      const config = mergeWithDefaults(storedConfig);
      return NextResponse.json(config);
    }

    // Return defaults if no stored config
    return NextResponse.json(DEFAULT_CONFIG);
  } catch (error) {
    // If KV is not configured (local dev), return defaults
    console.warn("Vercel KV not available, using defaults:", error);
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
    // In production, Vercel Auth sets x-vercel-auth-user header for authenticated team members
    const authHeader = request.headers.get("x-vercel-auth-user");
    const isLocalDev = process.env.NODE_ENV === "development";

    // Allow saves in local dev or if authenticated via Vercel
    if (!isLocalDev && !authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      );
    }

    // Parse and validate the config
    const body = await request.json();
    const config = mergeWithDefaults(body) as ParticleSystemConfig;

    // Increment version on save
    config.version = (config.version || 0) + 1;

    // Save to KV store
    await kv.set(CONFIG_KEY, config);

    return NextResponse.json({
      success: true,
      config,
      message: "Configuration saved successfully",
    });
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

    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/particles/config
 * Resets configuration to defaults
 */
export async function DELETE(request: Request) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get("x-vercel-auth-user");
    const isLocalDev = process.env.NODE_ENV === "development";

    if (!isLocalDev && !authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      );
    }

    // Delete from KV store
    await kv.del(CONFIG_KEY);

    return NextResponse.json({
      success: true,
      config: DEFAULT_CONFIG,
      message: "Configuration reset to defaults",
    });
  } catch (error) {
    console.error("Failed to reset particle config:", error);
    return NextResponse.json(
      { error: "Failed to reset configuration" },
      { status: 500 }
    );
  }
}

