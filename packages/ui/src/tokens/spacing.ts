// Spacing Tokens
// =============================================================================
// 8px base grid system

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 96,
} as const;

// Named spacing for specific uses
export const layout = {
  /** HUD padding from viewport edge */
  hudPadding: "clamp(32px, 4vw, 64px)",
  /** Rail width for measurement scales */
  railWidth: 60,
  /** Maximum content width */
  contentMaxWidth: 1200,
  /** Corner bracket size */
  cornerSize: 40,
  /** Grid gap */
  gridGap: 24,
  /** Content inset from rails */
  contentInset: 40,
} as const;

// Frame sizing tokens
export const frame = {
  maxWidth: "min(90vw, 560px)",
  paddingX: "clamp(16px, 4vw, 32px)",
  paddingY: "clamp(16px, 3vw, 24px)",
  corner: 16,
} as const;

// CSS variable mappings
export const spacingCssVars = {
  "--space-xs": `${spacing.xs}px`,
  "--space-sm": `${spacing.sm}px`,
  "--space-md": `${spacing.md}px`,
  "--space-lg": `${spacing.lg}px`,
  "--space-xl": `${spacing.xl}px`,
  "--space-2xl": `${spacing["2xl"]}px`,
  "--space-3xl": `${spacing["3xl"]}px`,
  "--space-4xl": `${spacing["4xl"]}px`,
  "--hud-padding": layout.hudPadding,
  "--rail-width": `${layout.railWidth}px`,
  "--content-max-width": `${layout.contentMaxWidth}px`,
  "--corner-size": `${layout.cornerSize}px`,
  "--grid-gap": `${layout.gridGap}px`,
  "--content-inset": `${layout.contentInset}px`,
  "--frame-max-w": frame.maxWidth,
  "--frame-pad-x": frame.paddingX,
  "--frame-pad-y": frame.paddingY,
  "--frame-corner": `${frame.corner}px`,
} as const;

export type SpacingToken = keyof typeof spacing;

/**
 * Get spacing value in pixels
 */
export function getSpacing(token: SpacingToken): number {
  return spacing[token];
}

/**
 * Get spacing as CSS value
 */
export function getSpacingCss(token: SpacingToken): string {
  return `${spacing[token]}px`;
}
