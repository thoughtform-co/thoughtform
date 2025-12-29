"use client";

import React from "react";

/**
 * ═══════════════════════════════════════════════════════════════
 *  CORNER BRACKET - Unified corner decoration primitive
 *
 *  A consistent corner bracket that can be applied to any frame.
 *  Uses CSS background fills with pseudo-elements for crisp rendering.
 *
 *  OPTICAL NOTES:
 *  - Arm length and thickness are decoupled for fine control
 *  - Default ratio (thickness/arm) ~0.08-0.10 for optical balance
 *  - Larger arms need proportionally thicker strokes
 * ═══════════════════════════════════════════════════════════════
 */

export type CornerPosition = "tl" | "tr" | "bl" | "br";

export type CornerMode =
  | "four" // All four corners
  | "diagonal-primary" // Top-right + Bottom-left (ascending)
  | "diagonal-secondary" // Top-left + Bottom-right (descending)
  | "top" // Top-left + Top-right
  | "bottom" // Bottom-left + Bottom-right
  | "left" // Top-left + Bottom-left
  | "right"; // Top-right + Bottom-right

export interface CornerBracketProps {
  /** Which corners to show */
  mode?: CornerMode;
  /** Arm length - how far bracket extends along edge */
  armLength?: number | string;
  /** Stroke thickness */
  thickness?: number | string;
  /** Color - defaults to var(--gold) */
  color?: string;
  /** Offset from parent edge (negative = outside, 0 = flush, positive = inside) */
  offset?: number;
  /** Additional className for the wrapper */
  className?: string;
  /** Z-index for corners */
  zIndex?: number;
}

/**
 * Get which corners should be visible based on mode
 */
function getVisibleCorners(mode: CornerMode): CornerPosition[] {
  switch (mode) {
    case "four":
      return ["tl", "tr", "bl", "br"];
    case "diagonal-primary":
      return ["tr", "bl"];
    case "diagonal-secondary":
      return ["tl", "br"];
    case "top":
      return ["tl", "tr"];
    case "bottom":
      return ["bl", "br"];
    case "left":
      return ["tl", "bl"];
    case "right":
      return ["tr", "br"];
    default:
      return ["tl", "tr", "bl", "br"];
  }
}

/**
 * Individual corner element using background fills
 * More consistent rendering than border-based approach
 */
function Corner({
  position,
  armLength,
  thickness,
  color,
  offset,
  zIndex,
}: {
  position: CornerPosition;
  armLength: number | string;
  thickness: number | string;
  color: string;
  offset: number;
  zIndex: number;
}) {
  const arm = typeof armLength === "number" ? `${armLength}px` : armLength;
  const stroke = typeof thickness === "number" ? `${thickness}px` : thickness;

  // Position styles for each corner
  const positionStyles: Record<CornerPosition, React.CSSProperties> = {
    tl: { top: offset, left: offset },
    tr: { top: offset, right: offset },
    bl: { bottom: offset, left: offset },
    br: { bottom: offset, right: offset },
  };

  // Pseudo-element gradients for L-shaped brackets
  // Each corner needs two rectangles: horizontal arm + vertical arm
  const gradients: Record<CornerPosition, string> = {
    tl: `
      linear-gradient(${color}, ${color}) 0 0 / ${arm} ${stroke} no-repeat,
      linear-gradient(${color}, ${color}) 0 0 / ${stroke} ${arm} no-repeat
    `,
    tr: `
      linear-gradient(${color}, ${color}) 100% 0 / ${arm} ${stroke} no-repeat,
      linear-gradient(${color}, ${color}) 100% 0 / ${stroke} ${arm} no-repeat
    `,
    bl: `
      linear-gradient(${color}, ${color}) 0 100% / ${arm} ${stroke} no-repeat,
      linear-gradient(${color}, ${color}) 0 100% / ${stroke} ${arm} no-repeat
    `,
    br: `
      linear-gradient(${color}, ${color}) 100% 100% / ${arm} ${stroke} no-repeat,
      linear-gradient(${color}, ${color}) 100% 100% / ${stroke} ${arm} no-repeat
    `,
  };

  return (
    <div
      className={`corner-bracket corner-bracket--${position}`}
      style={{
        position: "absolute",
        width: arm,
        height: arm,
        background: gradients[position],
        pointerEvents: "none",
        zIndex,
        ...positionStyles[position],
      }}
      aria-hidden="true"
    />
  );
}

/**
 * CornerBracket - Renders corner brackets for any frame
 *
 * @example
 * // Four corners with default styling
 * <CornerBracket />
 *
 * @example
 * // Diagonal corners (top-right + bottom-left)
 * <CornerBracket mode="diagonal-primary" armLength={24} thickness={1.5} />
 *
 * @example
 * // Custom color and size
 * <CornerBracket
 *   armLength="var(--corner-arm-lg)"
 *   thickness="var(--corner-thickness-thin)"
 *   color="var(--dawn)"
 * />
 */
export function CornerBracket({
  mode = "four",
  armLength = 16,
  thickness = 2,
  color = "var(--gold, #caa554)",
  offset = -1,
  className = "",
  zIndex = 5,
}: CornerBracketProps) {
  const visibleCorners = getVisibleCorners(mode);

  return (
    <div
      className={`corner-bracket-container ${className}`}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {visibleCorners.map((pos) => (
        <Corner
          key={pos}
          position={pos}
          armLength={armLength}
          thickness={thickness}
          color={color}
          offset={offset}
          zIndex={zIndex}
        />
      ))}
    </div>
  );
}

/**
 * CornerBracketCSS - CSS-only version for use in pure CSS contexts
 * Returns an object with CSS custom properties to apply to a parent element
 *
 * @example
 * const styles = getCornerBracketStyles({ armLength: 20, thickness: 2 });
 * <div style={styles} className="has-corner-brackets" />
 */
export function getCornerBracketStyles({
  armLength = 16,
  thickness = 2,
  color = "var(--gold, #caa554)",
}: {
  armLength?: number | string;
  thickness?: number | string;
  color?: string;
}): React.CSSProperties {
  const arm = typeof armLength === "number" ? `${armLength}px` : armLength;
  const stroke = typeof thickness === "number" ? `${thickness}px` : thickness;

  return {
    "--cb-arm": arm,
    "--cb-thickness": stroke,
    "--cb-color": color,
  } as React.CSSProperties;
}

/**
 * Preset configurations matching common use cases
 */
export const CORNER_PRESETS = {
  /** Delicate corners for small labels */
  subtle: { armLength: 10, thickness: 1, color: "var(--gold, #caa554)" },
  /** Standard card corners */
  card: { armLength: 16, thickness: 2, color: "var(--gold, #caa554)" },
  /** Bridge frame / terminal corners */
  frame: { armLength: 20, thickness: 2, color: "var(--gold, #caa554)" },
  /** Panel corners (Astrogation style) */
  panel: { armLength: 24, thickness: 1.5, color: "var(--gold, #caa554)" },
  /** Large HUD viewport corners */
  hud: { armLength: 40, thickness: 2, color: "var(--gold, #caa554)" },
} as const;

export type CornerPreset = keyof typeof CORNER_PRESETS;

/**
 * Helper to get preset values
 */
export function getCornerPreset(preset: CornerPreset): CornerBracketProps {
  return CORNER_PRESETS[preset];
}

export default CornerBracket;
