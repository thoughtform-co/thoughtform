// Frame Molecule
// =============================================================================
// Composable frame combining Surface + CornerBrackets

import * as React from "react";
import { cn } from "../utils/cn";
import { Surface, type SurfaceVariant } from "../atoms/Surface";
import { CornerBrackets, type CornerToken, type CornerPreset } from "../atoms/CornerBracket";
import { gold, dawn } from "../tokens/colors";

export interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which corners to show */
  corners?: CornerToken;
  /** Preset size for corners */
  cornerPreset?: CornerPreset;
  /** Custom corner arm length (overrides preset) */
  cornerArm?: number;
  /** Custom corner thickness (overrides preset) */
  cornerThickness?: number;
  /** Corner bracket color */
  cornerColor?: string;
  /** Show border around content */
  border?: boolean;
  /** Border color */
  borderColor?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Surface background variant */
  surface?: SurfaceVariant;
  /** Padding preset */
  padding?: "none" | "sm" | "md" | "lg";
  /** Children content */
  children?: React.ReactNode;
}

const paddingMap = {
  none: "0",
  sm: "12px",
  md: "16px 20px",
  lg: "24px 32px",
} as const;

/**
 * Frame - Composable frame component
 *
 * Combines Surface (background) with CornerBrackets (decorations)
 * to create the distinctive Thoughtform frame aesthetic.
 *
 * @example
 * ```tsx
 * // Basic four-corner frame
 * <Frame corners="four" cornerPreset="card" border>
 *   <p>Card content</p>
 * </Frame>
 *
 * // Diagonal corners with glass effect
 * <Frame corners="tr-bl" surface="glass" cornerColor="#caa554">
 *   <p>Glassmorphism card</p>
 * </Frame>
 *
 * // Custom corner configuration
 * <Frame
 *   corners="four"
 *   cornerArm={24}
 *   cornerThickness={1.5}
 *   cornerColor="rgba(202, 165, 84, 0.7)"
 *   border
 *   borderColor="rgba(235, 227, 214, 0.08)"
 * >
 *   <p>Custom frame</p>
 * </Frame>
 * ```
 */
export const Frame = React.forwardRef<HTMLDivElement, FrameProps>(
  (
    {
      corners = "four",
      cornerPreset = "card",
      cornerArm,
      cornerThickness,
      cornerColor = gold.DEFAULT,
      border = false,
      borderColor = dawn["08"],
      borderWidth = 1,
      surface = "transparent",
      padding = "md",
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const showCorners = corners !== "none";

    // Calculate corner offset to account for border width
    // Corners should sit at the outer edge of the frame, not inside the border
    const cornerOffset = border ? -borderWidth : 0;

    return (
      <Surface
        ref={ref}
        variant={surface}
        border={border}
        borderColor={borderColor}
        borderWidth={borderWidth}
        className={cn("relative", className)}
        style={{
          padding: paddingMap[padding],
          ...style,
        }}
        {...props}
      >
        {/* Corner brackets - offset to sit outside the border */}
        {showCorners && (
          <div
            style={{
              position: "absolute",
              inset: cornerOffset,
              pointerEvents: "none",
            }}
          >
            <CornerBrackets
              corners={corners}
              preset={cornerPreset}
              arm={cornerArm}
              thickness={cornerThickness}
              color={cornerColor}
            />
          </div>
        )}

        {/* Content with relative positioning to sit above corners */}
        <div className="relative" style={{ zIndex: 1 }}>
          {children}
        </div>
      </Surface>
    );
  }
);

Frame.displayName = "Frame";

// Re-export types for convenience
export type { CornerToken, CornerPreset, SurfaceVariant };
