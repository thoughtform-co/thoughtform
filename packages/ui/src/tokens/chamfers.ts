// Chamfer Tokens
// =============================================================================
// Shape configuration types and presets for chamfered/notched frames

/**
 * Corner position identifier
 */
export type Corner = "tl" | "tr" | "bl" | "br";

/**
 * Ticket notch shape - single corner notch (like a tab or ticket stub)
 */
export interface TicketNotchShape {
  kind: "ticketNotch";
  /** Which corner has the notch */
  corner: Corner;
  /** Horizontal distance from corner to notch diagonal (px) */
  notchWidthPx: number;
  /** Vertical depth of the step-down/notch (px) */
  notchHeightPx: number;
}

/**
 * Cut corners shape - chamfered corners
 */
export interface CutCornersShape {
  kind: "cutCorners";
  /** Per-corner cut size in pixels (45-degree diagonal cut) */
  cutsPx: Partial<Record<Corner, number>>;
}

/**
 * Union of all supported frame shapes
 */
export type FrameShape = TicketNotchShape | CutCornersShape;

/**
 * Named presets for common shape configurations
 */
export type ShapePreset =
  | "inspectorTicket"
  | "inspectorTicketCompact"
  | "cutCornersSm"
  | "cutCornersMd"
  | "cutCornersTopRight";

/**
 * Preset configurations
 * These match the existing Astrogation inspector frame geometry
 */
export const shapePresets: Record<ShapePreset, FrameShape> = {
  // Default inspector frame - matches current CSS implementation
  inspectorTicket: {
    kind: "ticketNotch",
    corner: "tr",
    notchWidthPx: 220,
    notchHeightPx: 32,
  },
  // Compact variant for smaller panels
  inspectorTicketCompact: {
    kind: "ticketNotch",
    corner: "tr",
    notchWidthPx: 160,
    notchHeightPx: 24,
  },
  // Small cut corners (all four)
  cutCornersSm: {
    kind: "cutCorners",
    cutsPx: { tl: 8, tr: 8, bl: 8, br: 8 },
  },
  // Medium cut corners (all four)
  cutCornersMd: {
    kind: "cutCorners",
    cutsPx: { tl: 16, tr: 16, bl: 16, br: 16 },
  },
  // Single cut corner top-right
  cutCornersTopRight: {
    kind: "cutCorners",
    cutsPx: { tr: 24 },
  },
};

/**
 * Get a shape configuration from a preset name or custom config
 */
export function resolveShape(shape: ShapePreset | FrameShape): FrameShape {
  if (typeof shape === "string") {
    return shapePresets[shape];
  }
  return shape;
}

/**
 * Default colors for chamfered frames
 * Match the current Astrogation inspector colors
 */
export const chamferColors = {
  /** Default fill color - translucent void */
  fill: "rgba(10, 9, 8, 0.4)",
  /** Default stroke color - gold at 30% */
  stroke: "rgba(202, 165, 84, 0.3)",
  /** Danger/alert stroke color */
  strokeDanger: "rgba(255, 107, 53, 0.5)",
  /** Muted stroke for secondary panels */
  strokeMuted: "rgba(235, 227, 214, 0.15)",
} as const;
