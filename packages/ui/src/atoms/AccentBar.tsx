// AccentBar Atom
// =============================================================================
// Colored accent line for emphasis

import * as React from "react";
import { cn } from "../utils/cn";
import { gold } from "../tokens/colors";

export type AccentBarPosition = "top" | "bottom" | "left" | "right";

export interface AccentBarProps {
  /** Position of the accent bar */
  position?: AccentBarPosition;
  /** Bar color (CSS color value) */
  color?: string;
  /** Bar thickness in pixels */
  thickness?: number;
  /** Length (percentage or CSS value) */
  length?: string;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * AccentBar - Colored line for visual emphasis
 *
 * Used to add colored accents to cards and frames.
 *
 * @example
 * ```tsx
 * <AccentBar position="top" color="#caa554" thickness={3} />
 * <AccentBar position="left" color="#39ff14" />
 * ```
 */
export function AccentBar({
  position = "top",
  color = gold.DEFAULT,
  thickness = 3,
  length = "100%",
  className,
  style,
}: AccentBarProps) {
  const isHorizontal = position === "top" || position === "bottom";

  const positionStyles: React.CSSProperties = {
    position: "absolute",
    background: color,
    ...(position === "top" && {
      top: 0,
      left: 0,
      width: length,
      height: thickness,
    }),
    ...(position === "bottom" && {
      bottom: 0,
      left: 0,
      width: length,
      height: thickness,
    }),
    ...(position === "left" && {
      top: 0,
      left: 0,
      width: thickness,
      height: length,
    }),
    ...(position === "right" && {
      top: 0,
      right: 0,
      width: thickness,
      height: length,
    }),
  };

  return (
    <div
      className={cn("pointer-events-none", className)}
      style={{
        ...positionStyles,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
