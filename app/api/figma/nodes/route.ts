/**
 * Figma Nodes API Route
 *
 * GET /api/figma/nodes - Get specific node details
 * Query params:
 *   ?ids=1:2,3:4 (required, comma-separated node IDs)
 *   ?fileKey=...  (optional)
 *   ?depth=N      (optional)
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth-server";
import { getFileNodes } from "@/lib/figma/client";

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",").filter(Boolean);
    const fileKey = searchParams.get("fileKey") || undefined;
    const depth = searchParams.get("depth") ? parseInt(searchParams.get("depth")!, 10) : undefined;

    if (!ids?.length) {
      return NextResponse.json(
        { error: "ids parameter is required (comma-separated node IDs)" },
        { status: 400 }
      );
    }

    const result = await getFileNodes(ids, fileKey, { depth });

    return NextResponse.json({
      name: result.name,
      lastModified: result.lastModified,
      nodes: result.nodes,
    });
  } catch (error) {
    console.error("[figma/nodes] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not set") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
