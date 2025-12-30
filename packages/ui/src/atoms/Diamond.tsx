// Diamond Atom
// =============================================================================
// Diamond-shaped marker icon

import * as React from "react";
import { cn } from "../utils/cn";
import { gold } from "../tokens/colors";

export interface DiamondProps {
  /** Diamond size in pixels */
  size?: number;
  /** Diamond color */
  color?: string;
  /** Filled or outline */
  filled?: boolean;
  /** Border width for outline variant */
  borderWidth?: number;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Diamond - Diamond-shaped marker icon
 *
 * A distinctive Thoughtform UI element used for
 * markers, bullets, and interactive indicators.
 *
 * @example
 * ```tsx
 * <Diamond size={8} color="#caa554" filled />
 * <Diamond size={12} filled={false} borderWidth={1} />
 * ```
 */
export function Diamond({
  size = 8,
  color = gold.DEFAULT,
  filled = true,
  borderWidth = 1,
  className,
  style,
}: DiamondProps) {
  return (
    <span
      className={cn("inline-block flex-shrink-0", className)}
      style={{
        width: size,
        height: size,
        transform: "rotate(45deg)",
        ...(filled
          ? { background: color }
          : {
              background: "transparent",
              border: `${borderWidth}px solid ${color}`,
            }),
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * DiamondIcon - Diamond as Unicode character
 *
 * For use in text contexts where a CSS-styled diamond isn't needed.
 */
export function DiamondIcon({
  filled = false,
  className,
  style,
}: {
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={className} style={style} aria-hidden="true">
      {filled ? "◆" : "◇"}
    </span>
  );
}
