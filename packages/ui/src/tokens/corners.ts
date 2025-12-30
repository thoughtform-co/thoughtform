// Corner Bracket Tokens
// =============================================================================
// Unified system for corner bracket decorations

/**
 * Corner arm lengths (how far the bracket extends along each edge)
 */
export const cornerArm = {
  /** 10px - Delicate: small labels, subtle frames */
  xs: 10,
  /** 16px - Cards: content cards, panels */
  sm: 16,
  /** 20px - Standard: bridge frame, terminals */
  md: 20,
  /** 24px - Emphasis: editor panels, modals */
  lg: 24,
  /** 40px - HUD: viewport corner brackets */
  xl: 40,
} as const;

/**
 * Corner stroke thickness (optically weighted for visual consistency)
 */
export const cornerThickness = {
  /** 1px - For xs arms (ratio ~0.10) */
  hairline: 1,
  /** 1.5px - For sm/md arms (ratio ~0.08) */
  thin: 1.5,
  /** 2px - Standard weight (ratio ~0.08-0.10) */
  default: 2,
  /** 3px - For lg/xl arms (ratio ~0.08) */
  bold: 3,
} as const;

/**
 * Corner position types
 */
export type CornerPosition = "tl" | "tr" | "bl" | "br";

/**
 * Corner token patterns
 * Defines which corners are active
 */
export type CornerToken =
  | "four" // All four corners
  | "tr-bl" // Diagonal: top-right + bottom-left
  | "tl-br" // Diagonal: top-left + bottom-right
  | "none" // No corners
  | "tl" // Single corners
  | "tr"
  | "bl"
  | "br"
  | "tl-tr" // Adjacent pairs
  | "bl-br"
  | "tl-bl"
  | "tr-br"
  | "no-tl" // Three corners (missing one)
  | "no-tr"
  | "no-bl"
  | "no-br";

/**
 * Corner preset configurations
 */
export const cornerPresets = {
  /** Subtle - for small labels, delicate frames */
  subtle: { arm: cornerArm.xs, thickness: cornerThickness.hairline },
  /** Card - standard content cards */
  card: { arm: cornerArm.sm, thickness: cornerThickness.default },
  /** Frame - bridge frame, terminals */
  frame: { arm: cornerArm.md, thickness: cornerThickness.default },
  /** Panel - editor panels, modals */
  panel: { arm: cornerArm.lg, thickness: cornerThickness.thin },
  /** HUD - viewport corner brackets */
  hud: { arm: cornerArm.xl, thickness: cornerThickness.default },
} as const;

export type CornerPreset = keyof typeof cornerPresets;

/**
 * Convert corner token to active positions
 */
export function tokenToPositions(token: CornerToken): CornerPosition[] {
  const mapping: Record<CornerToken, CornerPosition[]> = {
    four: ["tl", "tr", "bl", "br"],
    none: [],
    "tr-bl": ["tr", "bl"],
    "tl-br": ["tl", "br"],
    tl: ["tl"],
    tr: ["tr"],
    bl: ["bl"],
    br: ["br"],
    "tl-tr": ["tl", "tr"],
    "bl-br": ["bl", "br"],
    "tl-bl": ["tl", "bl"],
    "tr-br": ["tr", "br"],
    "no-tl": ["tr", "bl", "br"],
    "no-tr": ["tl", "bl", "br"],
    "no-bl": ["tl", "tr", "br"],
    "no-br": ["tl", "tr", "bl"],
  };
  return mapping[token] || ["tl", "tr", "bl", "br"];
}

/**
 * Convert active positions to corner token
 */
export function positionsToToken(positions: CornerPosition[]): CornerToken {
  const sorted = [...positions].sort().join("-");

  if (positions.length === 4) return "four";
  if (positions.length === 0) return "none";

  const mapping: Record<string, CornerToken> = {
    // Single corners
    tl: "tl",
    tr: "tr",
    bl: "bl",
    br: "br",
    // Two corners
    "bl-tl": "tl-bl",
    "tl-tr": "tl-tr",
    "bl-br": "bl-br",
    "br-tr": "tr-br",
    "bl-tr": "tr-bl",
    "br-tl": "tl-br",
    // Three corners (missing one)
    "bl-br-tl": "no-tr",
    "bl-br-tr": "no-tl",
    "bl-tl-tr": "no-br",
    "br-tl-tr": "no-bl",
  };

  return mapping[sorted] || "four";
}

/**
 * Get corner preset configuration
 */
export function getCornerPreset(preset: CornerPreset): { arm: number; thickness: number } {
  return cornerPresets[preset];
}

// CSS variable mappings
export const cornerCssVars = {
  "--corner-arm-xs": `${cornerArm.xs}px`,
  "--corner-arm-sm": `${cornerArm.sm}px`,
  "--corner-arm-md": `${cornerArm.md}px`,
  "--corner-arm-lg": `${cornerArm.lg}px`,
  "--corner-arm-xl": `${cornerArm.xl}px`,
  "--corner-thickness-hairline": `${cornerThickness.hairline}px`,
  "--corner-thickness-thin": `${cornerThickness.thin}px`,
  "--corner-thickness-default": `${cornerThickness.default}px`,
  "--corner-thickness-bold": `${cornerThickness.bold}px`,
} as const;
