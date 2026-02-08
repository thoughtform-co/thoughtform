/**
 * Figma Export API Route
 *
 * GET /api/figma/export - Export nodes as SVG/PNG/JPG/PDF
 * Query params:
 *   ?ids=1:2,3:4  (required, comma-separated node IDs)
 *   ?format=svg    (optional, default "svg". Options: svg, png, jpg, pdf)
 *   ?scale=2       (optional, default 1. Range: 0.01-4)
 *   ?fileKey=...   (optional)
 *   ?raw=true      (optional, if format=svg, returns raw SVG content instead of URL)
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth-server";
import { getImages, fetchSvgContent } from "@/lib/figma/client";
import type { FigmaExportOptions } from "@/lib/figma/types";

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",").filter(Boolean);
    const format = (searchParams.get("format") || "svg") as FigmaExportOptions["format"];
    const scale = searchParams.get("scale") ? parseFloat(searchParams.get("scale")!) : undefined;
    const fileKey = searchParams.get("fileKey") || undefined;
    const raw = searchParams.get("raw") === "true";

    if (!ids?.length) {
      return NextResponse.json(
        { error: "ids parameter is required (comma-separated node IDs)" },
        { status: 400 }
      );
    }

    const result = await getImages(ids, fileKey, { format, scale });

    if (result.err) {
      return NextResponse.json({ error: result.err }, { status: 500 });
    }

    // If raw SVG requested, fetch the content and return it
    if (raw && format === "svg") {
      const svgContents: Record<string, string | null> = {};
      for (const [nodeId, url] of Object.entries(result.images)) {
        if (url) {
          try {
            svgContents[nodeId] = await fetchSvgContent(url);
          } catch {
            svgContents[nodeId] = null;
          }
        } else {
          svgContents[nodeId] = null;
        }
      }
      return NextResponse.json({ format, svgContents });
    }

    return NextResponse.json({
      format,
      scale: scale || 1,
      images: result.images,
    });
  } catch (error) {
    console.error("[figma/export] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not set") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
