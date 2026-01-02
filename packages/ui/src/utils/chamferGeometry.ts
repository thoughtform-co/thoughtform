// Chamfer Geometry Utilities
// =============================================================================
// Generate polygon points and layout metrics for chamfered/notched frames

import type { FrameShape, Corner, TicketNotchShape } from "../tokens/chamfers";

export interface Point {
  x: number;
  y: number;
}

/**
 * Layout metrics derived from the shape geometry
 * Used for positioning title, toolbar, and content areas
 */
export interface ChamferLayoutMetrics {
  /** Width available for title in the step-down area (ticket notch only) */
  titleWidthPx: number;
  /** Top position for content clipping (below notch area with safety margin) */
  contentClipTopPx: number;
  /** Height of the notch/step-down area */
  notchHeightPx: number;
  /** The polygon points as a string for SVG */
  polygonPoints: string;
  /** The polygon points as an array of [x, y] tuples */
  points: Point[];
}

/**
 * Generate polygon points for a ticket notch shape (single corner step-down)
 *
 * Ticket notch creates a "tab" effect where one corner has a diagonal cut
 * creating a step-down area typically used for titles.
 *
 * For TOP-RIGHT corner (default inspector):
 * ```
 *    ┌─────────────┬────────┐
 *    │ title area  ╱        │
 *    ├────────────╱         │
 *    │                      │
 *    │     content          │
 *    │                      │
 *    └──────────────────────┘
 * ```
 */
function generateTicketNotchPoints(
  width: number,
  height: number,
  shape: TicketNotchShape
): Point[] {
  const { corner, notchWidthPx, notchHeightPx } = shape;

  // Clamp notch dimensions to prevent self-intersection
  const maxNotchWidth = Math.min(notchWidthPx, width * 0.8);
  const maxNotchHeight = Math.min(notchHeightPx, height * 0.3);
  const nw = maxNotchWidth;
  const nh = maxNotchHeight;

  // The diagonal length is based on the notch height (45-degree angle)
  const diag = nh;

  switch (corner) {
    case "tr":
      // Top-right notch (default inspector layout)
      // Start from bottom-left of step-down, go clockwise
      return [
        { x: 0, y: nh }, // Bottom-left of step-down
        { x: nw - diag, y: nh }, // Bottom-right of step-down
        { x: nw, y: 0 }, // Top-right of chamfer (diagonal)
        { x: width, y: 0 }, // Top-right corner
        { x: width, y: height }, // Bottom-right corner
        { x: 0, y: height }, // Bottom-left corner
      ];

    case "tl":
      // Top-left notch (mirrored)
      return [
        { x: width - nw, y: 0 }, // Top edge after notch
        { x: width, y: 0 }, // Top-right corner
        { x: width, y: height }, // Bottom-right corner
        { x: 0, y: height }, // Bottom-left corner
        { x: 0, y: nh }, // Left edge after step-down
        { x: diag, y: nh }, // Bottom-left of step-down
        { x: nw, y: 0 }, // Top-left of chamfer (diagonal)
      ];

    case "br":
      // Bottom-right notch
      return [
        { x: 0, y: 0 }, // Top-left corner
        { x: width, y: 0 }, // Top-right corner
        { x: width, y: height - nh }, // Right edge before step
        { x: nw, y: height - nh }, // Top-right of step area
        { x: nw - diag, y: height }, // Bottom after diagonal
        { x: 0, y: height }, // Bottom-left corner
      ];

    case "bl":
      // Bottom-left notch
      return [
        { x: 0, y: 0 }, // Top-left corner
        { x: width, y: 0 }, // Top-right corner
        { x: width, y: height }, // Bottom-right corner
        { x: width - nw + diag, y: height }, // Bottom edge before diagonal
        { x: width - nw, y: height - nh }, // Top-left of step area
        { x: 0, y: height - nh }, // Left edge before step
      ];

    default:
      // Fallback to rectangle
      return [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ];
  }
}

/**
 * Generate polygon points for cut corners shape
 * Creates 45-degree chamfers at specified corners
 */
function generateCutCornersPoints(
  width: number,
  height: number,
  cutsPx: Partial<Record<Corner, number>>
): Point[] {
  const tl = Math.min(cutsPx.tl || 0, width / 2, height / 2);
  const tr = Math.min(cutsPx.tr || 0, width / 2, height / 2);
  const br = Math.min(cutsPx.br || 0, width / 2, height / 2);
  const bl = Math.min(cutsPx.bl || 0, width / 2, height / 2);

  const points: Point[] = [];

  // Start from top-left, go clockwise
  if (tl > 0) {
    points.push({ x: tl, y: 0 });
  } else {
    points.push({ x: 0, y: 0 });
  }

  // Top-right
  if (tr > 0) {
    points.push({ x: width - tr, y: 0 });
    points.push({ x: width, y: tr });
  } else {
    points.push({ x: width, y: 0 });
  }

  // Bottom-right
  if (br > 0) {
    points.push({ x: width, y: height - br });
    points.push({ x: width - br, y: height });
  } else {
    points.push({ x: width, y: height });
  }

  // Bottom-left
  if (bl > 0) {
    points.push({ x: bl, y: height });
    points.push({ x: 0, y: height - bl });
  } else {
    points.push({ x: 0, y: height });
  }

  // Close back to top-left
  if (tl > 0) {
    points.push({ x: 0, y: tl });
  }

  return points;
}

/**
 * Convert points array to SVG polygon points string
 */
export function pointsToString(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

/**
 * Generate chamfer geometry and layout metrics
 *
 * @param width - Container width in pixels
 * @param height - Container height in pixels
 * @param shape - Shape configuration
 * @returns Layout metrics and polygon points
 *
 * @example
 * ```tsx
 * const { polygonPoints, titleWidthPx, contentClipTopPx } = generateChamferGeometry(
 *   340, 734,
 *   { kind: "ticketNotch", corner: "tr", notchWidthPx: 220, notchHeightPx: 32 }
 * );
 * ```
 */
export function generateChamferGeometry(
  width: number,
  height: number,
  shape: FrameShape
): ChamferLayoutMetrics {
  // Handle zero dimensions gracefully
  if (width <= 0 || height <= 0) {
    return {
      titleWidthPx: 0,
      contentClipTopPx: 0,
      notchHeightPx: 0,
      polygonPoints: "",
      points: [],
    };
  }

  let points: Point[];
  let titleWidthPx = 0;
  let notchHeightPx = 0;
  const safetyMargin = 14; // Additional margin below notch for content clipping

  switch (shape.kind) {
    case "ticketNotch": {
      points = generateTicketNotchPoints(width, height, shape);

      // Calculate title width (for top corners)
      if (shape.corner === "tr" || shape.corner === "tl") {
        // Title width = notch width - diagonal - padding
        const diag = Math.min(shape.notchHeightPx, height * 0.3);
        titleWidthPx = Math.min(shape.notchWidthPx, width * 0.8) - diag - 16;
      }

      notchHeightPx = Math.min(shape.notchHeightPx, height * 0.3);
      break;
    }

    case "cutCorners": {
      points = generateCutCornersPoints(width, height, shape.cutsPx);
      // Cut corners don't have a dedicated title area
      titleWidthPx = 0;
      notchHeightPx = 0;
      break;
    }

    default:
      points = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ];
  }

  return {
    titleWidthPx,
    contentClipTopPx: notchHeightPx + safetyMargin,
    notchHeightPx,
    polygonPoints: pointsToString(points),
    points,
  };
}

/**
 * Generate CSS clip-path polygon string from points
 * Uses percentages for responsive clipping
 */
export function generateClipPath(points: Point[], width: number, height: number): string {
  if (points.length === 0 || width <= 0 || height <= 0) {
    return "none";
  }

  const percentPoints = points
    .map((p) => `${((p.x / width) * 100).toFixed(2)}% ${((p.y / height) * 100).toFixed(2)}%`)
    .join(", ");

  return `polygon(${percentPoints})`;
}
