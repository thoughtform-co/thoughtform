// CornerBracket Atom
// =============================================================================
// L-shaped corner bracket decoration

import * as React from "react";
import { cn } from "../utils/cn";
import {
  type CornerPosition,
  type CornerToken,
  type CornerPreset,
  cornerArm,
  cornerThickness,
  cornerPresets,
  tokenToPositions,
} from "../tokens/corners";
import { gold } from "../tokens/colors";

export interface CornerBracketProps {
  /** Corner position: tl (top-left), tr (top-right), bl (bottom-left), br (bottom-right) */
  position: CornerPosition;
  /** Length of bracket arms in pixels */
  arm?: number;
  /** Stroke thickness in pixels */
  thickness?: number;
  /** Bracket color (CSS color value) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * CornerBracket - A single L-shaped corner decoration
 *
 * Used to create the distinctive Thoughtform frame aesthetic.
 * Can be combined to create full frames with various configurations.
 *
 * @example
 * ```tsx
 * <CornerBracket position="tl" arm={16} thickness={2} color="#caa554" />
 * ```
 */
export function CornerBracket({
  position,
  arm = cornerArm.sm,
  thickness = cornerThickness.default,
  color = gold.DEFAULT,
  className,
  style,
}: CornerBracketProps) {
  // Generate background gradient for L-shape
  const getBackground = (): string => {
    const horizontal = `linear-gradient(${color}, ${color})`;
    const vertical = `linear-gradient(${color}, ${color})`;

    switch (position) {
      case "tl":
        return `${horizontal} 0 0 / ${arm}px ${thickness}px no-repeat, ${vertical} 0 0 / ${thickness}px ${arm}px no-repeat`;
      case "tr":
        return `${horizontal} 100% 0 / ${arm}px ${thickness}px no-repeat, ${vertical} 100% 0 / ${thickness}px ${arm}px no-repeat`;
      case "bl":
        return `${horizontal} 0 100% / ${arm}px ${thickness}px no-repeat, ${vertical} 0 100% / ${thickness}px ${arm}px no-repeat`;
      case "br":
        return `${horizontal} 100% 100% / ${arm}px ${thickness}px no-repeat, ${vertical} 100% 100% / ${thickness}px ${arm}px no-repeat`;
      default:
        return "";
    }
  };

  // Position styles
  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case "tl":
        return { top: 0, left: 0 };
      case "tr":
        return { top: 0, right: 0 };
      case "bl":
        return { bottom: 0, left: 0 };
      case "br":
        return { bottom: 0, right: 0 };
      default:
        return {};
    }
  };

  return (
    <div
      className={cn("pointer-events-none", className)}
      style={{
        position: "absolute",
        width: arm,
        height: arm,
        background: getBackground(),
        zIndex: 15,
        ...getPositionStyles(),
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

// -----------------------------------------------------------------------------
// CornerBrackets - Multiple corners as a group
// -----------------------------------------------------------------------------

export interface CornerBracketsProps {
  /** Which corners to show */
  corners?: CornerToken;
  /** Preset size configuration */
  preset?: CornerPreset;
  /** Length of bracket arms in pixels (overrides preset) */
  arm?: number;
  /** Stroke thickness in pixels (overrides preset) */
  thickness?: number;
  /** Bracket color (CSS color value) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CornerBrackets - Group of corner brackets based on a token pattern
 *
 * @example
 * ```tsx
 * <CornerBrackets corners="four" preset="card" color="#caa554" />
 * <CornerBrackets corners="tr-bl" arm={24} thickness={1.5} />
 * ```
 */
export function CornerBrackets({
  corners = "four",
  preset = "card",
  arm,
  thickness,
  color = gold.DEFAULT,
  className,
}: CornerBracketsProps) {
  const presetConfig = cornerPresets[preset];
  const finalArm = arm ?? presetConfig.arm;
  const finalThickness = thickness ?? presetConfig.thickness;

  const positions = tokenToPositions(corners);

  return (
    <>
      {positions.map((position) => (
        <CornerBracket
          key={position}
          position={position}
          arm={finalArm}
          thickness={finalThickness}
          color={color}
          className={className}
        />
      ))}
    </>
  );
}

// Re-export types for convenience
export type { CornerPosition, CornerToken, CornerPreset };
