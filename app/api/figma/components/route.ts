/**
 * Figma Components API Route
 *
 * GET /api/figma/components - List all components with metadata
 * Query params:
 *   ?fileKey=... (optional)
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth-server";
import { getComponents } from "@/lib/figma/client";

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("fileKey") || undefined;

    const result = await getComponents(fileKey);

    // Transform components into a flat list
    const components = Object.entries(result.components).map(([nodeId, meta]) => ({
      nodeId,
      key: meta.key,
      name: meta.name,
      description: meta.description || null,
      componentSetId: meta.componentSetId || null,
      containingFrame: meta.containing_frame || null,
      documentationLinks: meta.documentationLinks || [],
      remote: meta.remote || false,
    }));

    // Transform component sets
    const componentSets = Object.entries(result.componentSets).map(([nodeId, meta]) => ({
      nodeId,
      key: meta.key,
      name: meta.name,
      description: meta.description || null,
    }));

    // Transform styles
    const styles = Object.entries(result.styles).map(([nodeId, meta]) => ({
      nodeId,
      key: meta.key,
      name: meta.name,
      styleType: meta.styleType,
      description: meta.description || null,
      remote: meta.remote || false,
    }));

    return NextResponse.json({
      components,
      componentSets,
      styles,
      totalComponents: components.length,
      totalComponentSets: componentSets.length,
      totalStyles: styles.length,
    });
  } catch (error) {
    console.error("[figma/components] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not set") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
