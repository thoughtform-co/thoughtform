// ═══════════════════════════════════════════════════════════════
// SURVEY MOTIFS API
// Extract and vectorize UI motifs from segment masks
// Enables true "shape transfer" - keep geometry, change colors
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

const BUCKET_NAME = "survey-media";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface SegmentData {
  id: string;
  survey_item_id: string;
  ai_label?: string;
  ai_description?: string;
  label?: string;
  bbox_x: number;
  bbox_y: number;
  bbox_width: number;
  bbox_height: number;
  area: number;
  mask_path?: string;
  crop_path?: string;
}

export interface MotifPrimitive {
  id: string;
  segmentId: string;
  label: string;
  description?: string;
  // Bounding box (normalized 0-1)
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // SVG path (simplified outline)
  svgPath?: string;
  // Motif classification
  motifType: "bracket" | "reticle" | "grid" | "icon" | "panel" | "label" | "ornament" | "unknown";
  // Aspect ratio for layout
  aspectRatio: number;
  // Area as fraction of total image
  areaFraction: number;
}

// ═══════════════════════════════════════════════════════════════
// MOTIF TYPE CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

function classifyMotifType(
  label?: string,
  description?: string,
  aspectRatio?: number,
  areaFraction?: number
): MotifPrimitive["motifType"] {
  const text = `${label || ""} ${description || ""}`.toLowerCase();

  // Brackets / corners / frames
  if (
    text.includes("bracket") ||
    text.includes("corner") ||
    text.includes("frame") ||
    text.includes("border")
  ) {
    return "bracket";
  }

  // Reticles / targeting / crosshairs
  if (
    text.includes("reticle") ||
    text.includes("crosshair") ||
    text.includes("target") ||
    text.includes("scope")
  ) {
    return "reticle";
  }

  // Grids / patterns / matrices
  if (
    text.includes("grid") ||
    text.includes("pattern") ||
    text.includes("matrix") ||
    text.includes("array")
  ) {
    return "grid";
  }

  // Icons / symbols
  if (
    text.includes("icon") ||
    text.includes("symbol") ||
    text.includes("logo") ||
    text.includes("mark")
  ) {
    return "icon";
  }

  // Panels / containers / cards
  if (
    text.includes("panel") ||
    text.includes("card") ||
    text.includes("container") ||
    text.includes("box") ||
    text.includes("module")
  ) {
    return "panel";
  }

  // Labels / text / typography
  if (
    text.includes("label") ||
    text.includes("text") ||
    text.includes("title") ||
    text.includes("caption") ||
    text.includes("heading")
  ) {
    return "label";
  }

  // Decorative / ornamental elements
  if (
    text.includes("ornament") ||
    text.includes("decoration") ||
    text.includes("divider") ||
    text.includes("line") ||
    text.includes("tick")
  ) {
    return "ornament";
  }

  // Use geometry heuristics as fallback
  if (aspectRatio !== undefined && areaFraction !== undefined) {
    // Very thin elements are likely ornaments/dividers
    if (aspectRatio > 10 || aspectRatio < 0.1) {
      return "ornament";
    }
    // Square-ish small elements are likely icons
    if (areaFraction < 0.02 && aspectRatio > 0.5 && aspectRatio < 2) {
      return "icon";
    }
    // Large elements are likely panels
    if (areaFraction > 0.1) {
      return "panel";
    }
  }

  return "unknown";
}

// ═══════════════════════════════════════════════════════════════
// SVG PATH GENERATION (Simplified)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a simplified SVG rect path from bounding box.
 * Full contour vectorization would require image processing (e.g., potrace).
 * This is a placeholder that creates a basic outline.
 */
function generateSimpleSvgPath(
  bbox: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number
): string {
  // Normalize to viewBox coordinates (0-100)
  const x = (bbox.x / imageWidth) * 100;
  const y = (bbox.y / imageHeight) * 100;
  const w = (bbox.width / imageWidth) * 100;
  const h = (bbox.height / imageHeight) * 100;

  // Generate a simple rectangle path
  // For true motif extraction, we'd use the mask to generate actual contours
  return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { itemId, segmentIds } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // ─── Load survey item for image dimensions ───
    const { data: item, error: fetchError } = await supabase
      .from("survey_items")
      .select("id, image_width, image_height")
      .eq("id", itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const imageWidth = item.image_width || 1920;
    const imageHeight = item.image_height || 1080;
    const totalArea = imageWidth * imageHeight;

    // ─── Load segments ───
    let segmentsQuery = supabase
      .from("survey_segments")
      .select(
        "id, survey_item_id, ai_label, ai_description, label, bbox_x, bbox_y, bbox_width, bbox_height, area, mask_path, crop_path"
      )
      .eq("survey_item_id", itemId)
      .order("area", { ascending: false });

    // Filter by specific segment IDs if provided
    if (segmentIds && Array.isArray(segmentIds) && segmentIds.length > 0) {
      segmentsQuery = segmentsQuery.in("id", segmentIds);
    } else {
      // Limit to top 20 by area if no specific IDs
      segmentsQuery = segmentsQuery.limit(20);
    }

    const { data: segments, error: segmentsError } = await segmentsQuery;

    if (segmentsError) {
      console.error("Failed to load segments:", segmentsError);
      return NextResponse.json({ error: "Failed to load segments" }, { status: 500 });
    }

    if (!segments || segments.length === 0) {
      return NextResponse.json({
        item: { id: item.id },
        motifs: [],
        message: "No segments found for this item",
      });
    }

    // ─── Convert segments to motif primitives ───
    const motifs: MotifPrimitive[] = (segments as SegmentData[]).map((seg) => {
      const aspectRatio = seg.bbox_width / seg.bbox_height;
      const areaFraction = seg.area / totalArea;
      const label = seg.ai_label || seg.label || "unlabeled";
      const description = seg.ai_description || undefined;

      return {
        id: `motif-${seg.id}`,
        segmentId: seg.id,
        label,
        description,
        bounds: {
          x: seg.bbox_x / imageWidth,
          y: seg.bbox_y / imageHeight,
          width: seg.bbox_width / imageWidth,
          height: seg.bbox_height / imageHeight,
        },
        svgPath: generateSimpleSvgPath(
          {
            x: seg.bbox_x,
            y: seg.bbox_y,
            width: seg.bbox_width,
            height: seg.bbox_height,
          },
          imageWidth,
          imageHeight
        ),
        motifType: classifyMotifType(label, description, aspectRatio, areaFraction),
        aspectRatio,
        areaFraction,
      };
    });

    // ─── Group motifs by type ───
    const motifsByType = motifs.reduce(
      (acc, motif) => {
        if (!acc[motif.motifType]) {
          acc[motif.motifType] = [];
        }
        acc[motif.motifType].push(motif);
        return acc;
      },
      {} as Record<string, MotifPrimitive[]>
    );

    return NextResponse.json({
      item: { id: item.id },
      motifs,
      motifsByType,
      summary: {
        total: motifs.length,
        byType: Object.fromEntries(
          Object.entries(motifsByType).map(([type, items]) => [type, items.length])
        ),
      },
    });
  } catch (error) {
    console.error("POST /api/survey/style/motifs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// GET HANDLER - Retrieve motifs for an item
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const motifType = searchParams.get("type");

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId query param" }, { status: 400 });
    }

    // Load item for dimensions
    const { data: item } = await supabase
      .from("survey_items")
      .select("id, image_width, image_height")
      .eq("id", itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const imageWidth = item.image_width || 1920;
    const imageHeight = item.image_height || 1080;
    const totalArea = imageWidth * imageHeight;

    // Load segments
    const { data: segments } = await supabase
      .from("survey_segments")
      .select("id, ai_label, ai_description, label, bbox_x, bbox_y, bbox_width, bbox_height, area")
      .eq("survey_item_id", itemId)
      .order("area", { ascending: false })
      .limit(30);

    if (!segments || segments.length === 0) {
      return NextResponse.json({ motifs: [] });
    }

    // Convert to motifs
    let motifs: MotifPrimitive[] = (segments as SegmentData[]).map((seg) => {
      const aspectRatio = seg.bbox_width / seg.bbox_height;
      const areaFraction = seg.area / totalArea;
      const label = seg.ai_label || seg.label || "unlabeled";

      return {
        id: `motif-${seg.id}`,
        segmentId: seg.id,
        label,
        description: seg.ai_description,
        bounds: {
          x: seg.bbox_x / imageWidth,
          y: seg.bbox_y / imageHeight,
          width: seg.bbox_width / imageWidth,
          height: seg.bbox_height / imageHeight,
        },
        svgPath: generateSimpleSvgPath(
          { x: seg.bbox_x, y: seg.bbox_y, width: seg.bbox_width, height: seg.bbox_height },
          imageWidth,
          imageHeight
        ),
        motifType: classifyMotifType(label, seg.ai_description, aspectRatio, areaFraction),
        aspectRatio,
        areaFraction,
      };
    });

    // Filter by type if specified
    if (motifType) {
      motifs = motifs.filter((m) => m.motifType === motifType);
    }

    return NextResponse.json({ motifs });
  } catch (error) {
    console.error("GET /api/survey/style/motifs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
