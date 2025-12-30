// Typography Tokens
// =============================================================================
// Font stacks, sizes, and weights

/**
 * Font family stacks
 */
export const fontFamily = {
  /** Display font for headlines - PP Mondwest */
  display: "var(--font-mondwest), 'PP Mondwest', serif",
  /** Body font for text - IBM Plex Mono */
  body: "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace",
  /** Data/UI font - IBM Plex Mono */
  data: "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace",
  /** Alias for consistency */
  mono: "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace",
} as const;

/**
 * Fluid typography scale
 * Uses clamp() for responsive sizing across 430px-1440px viewports
 */
export const fontSize = {
  /** 9-10px - Tiny labels */
  xs: "clamp(9px, 0.5rem + 0.1vw, 10px)",
  /** 10-12px - Small labels, metadata */
  sm: "clamp(10px, 0.6rem + 0.15vw, 12px)",
  /** 13-15px - Base body text */
  base: "clamp(13px, 0.75rem + 0.2vw, 15px)",
  /** 14-16px - Slightly larger body */
  md: "clamp(14px, 0.8rem + 0.25vw, 16px)",
  /** 16-20px - Large text */
  lg: "clamp(16px, 0.9rem + 0.4vw, 20px)",
  /** 18-26px - Section titles */
  xl: "clamp(18px, 1rem + 0.6vw, 26px)",
  /** 22-32px - Large headlines */
  "2xl": "clamp(22px, 1.2rem + 1vw, 32px)",
  /** 28-48px - Display headlines */
  display: "clamp(28px, 1.5rem + 2vw, 48px)",
} as const;

/**
 * Font weights
 */
export const fontWeight = {
  light: 300,
  normal: 400,
  medium: 500,
} as const;

/**
 * Letter spacing
 */
export const letterSpacing = {
  tight: "0.02em",
  normal: "0.04em",
  wide: "0.08em",
  wider: "0.1em",
  widest: "0.15em",
} as const;

/**
 * Line heights
 */
export const lineHeight = {
  tight: 1.2,
  snug: 1.4,
  normal: 1.5,
  relaxed: 1.6,
  loose: 1.7,
} as const;

// CSS variable mappings
export const typographyCssVars = {
  "--font-display": fontFamily.display,
  "--font-body": fontFamily.body,
  "--font-data": fontFamily.data,
  "--font-mono": fontFamily.mono,
  "--type-xs": fontSize.xs,
  "--type-sm": fontSize.sm,
  "--type-base": fontSize.base,
  "--type-md": fontSize.md,
  "--type-lg": fontSize.lg,
  "--type-xl": fontSize.xl,
  "--type-2xl": fontSize["2xl"],
  "--type-display": fontSize.display,
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type FontFamilyToken = keyof typeof fontFamily;
export type FontWeightToken = keyof typeof fontWeight;

/**
 * Typography preset for HUD labels
 */
export const hudLabel = {
  fontFamily: fontFamily.data,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.normal,
  letterSpacing: letterSpacing.wide,
  textTransform: "uppercase" as const,
};

/**
 * Typography preset for section headers
 */
export const sectionHeader = {
  fontFamily: fontFamily.display,
  fontSize: fontSize.display,
  fontWeight: fontWeight.normal,
  letterSpacing: letterSpacing.normal,
  textTransform: "uppercase" as const,
};

/**
 * Typography preset for body text
 */
export const bodyText = {
  fontFamily: fontFamily.body,
  fontSize: fontSize.base,
  fontWeight: fontWeight.light,
  lineHeight: lineHeight.loose,
};
