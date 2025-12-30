// Color Tokens
// =============================================================================
// Semantic color palette for the Thoughtform design system

/**
 * Void - The depths, infinite space
 * Used for backgrounds
 */
export const void_ = {
  DEFAULT: "#0a0908",
  deep: "#050504",
} as const;

/**
 * Surface - Elevated backgrounds
 * Layered on top of void for depth
 */
export const surface = {
  0: "#0D0B07",
  1: "#141210",
  2: "#1A1814",
} as const;

/**
 * Dawn - Emergence into light
 * Used for text, particles, and highlights
 */
export const dawn = {
  DEFAULT: "#ebe3d6",
  90: "rgba(235, 227, 214, 0.9)",
  70: "rgba(235, 227, 214, 0.7)",
  50: "rgba(235, 227, 214, 0.5)",
  30: "rgba(235, 227, 214, 0.3)",
  15: "rgba(235, 227, 214, 0.15)",
  "08": "rgba(235, 227, 214, 0.08)",
  "04": "rgba(235, 227, 214, 0.04)",
} as const;

/**
 * Gold - Navigation & measurement
 * The astrolabe's brass accent color
 */
export const gold = {
  DEFAULT: "#caa554",
  70: "rgba(202, 165, 84, 0.7)",
  50: "rgba(202, 165, 84, 0.5)",
  30: "rgba(202, 165, 84, 0.3)",
  15: "rgba(202, 165, 84, 0.15)",
  10: "rgba(202, 165, 84, 0.10)",
  "08": "rgba(202, 165, 84, 0.08)",
  "05": "rgba(202, 165, 84, 0.05)",
} as const;

/**
 * Alert - Attention and emphasis
 */
export const alert = {
  DEFAULT: "#ff6b35",
} as const;

/**
 * Verde - Secondary accent (used in Atlas)
 */
export const verde = {
  DEFAULT: "#39ff14",
} as const;

// Semantic color aliases
export const colors = {
  void: void_,
  surface,
  dawn,
  gold,
  alert,
  verde,

  // Semantic aliases
  background: void_.DEFAULT,
  backgroundDeep: void_.deep,
  text: dawn.DEFAULT,
  textMuted: dawn[70],
  textSubtle: dawn[50],
  accent: gold.DEFAULT,
  accentMuted: gold[50],
  border: dawn["08"],
  borderHover: dawn[15],
} as const;

// CSS variable mappings
export const colorCssVars = {
  "--void": void_.DEFAULT,
  "--void-deep": void_.deep,
  "--dawn": dawn.DEFAULT,
  "--dawn-90": dawn[90],
  "--dawn-70": dawn[70],
  "--dawn-50": dawn[50],
  "--dawn-30": dawn[30],
  "--dawn-15": dawn[15],
  "--dawn-08": dawn["08"],
  "--dawn-04": dawn["04"],
  "--gold": gold.DEFAULT,
  "--gold-70": gold[70],
  "--gold-50": gold[50],
  "--gold-30": gold[30],
  "--gold-15": gold[15],
  "--gold-10": gold[10],
  "--gold-08": gold["08"],
  "--gold-05": gold["05"],
  "--alert": alert.DEFAULT,
  "--verde": verde.DEFAULT,
} as const;

export type ColorToken = keyof typeof colors;
export type DawnOpacity = keyof typeof dawn;
export type GoldOpacity = keyof typeof gold;
