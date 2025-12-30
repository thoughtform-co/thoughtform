// Surface Atom
// =============================================================================
// Background container with opacity and border variants

import * as React from "react";
import { cn } from "../utils/cn";
import { void_, surface, dawn } from "../tokens/colors";

export type SurfaceVariant = "void" | "elevated" | "glass" | "transparent";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface background variant */
  variant?: SurfaceVariant;
  /** Show border */
  border?: boolean;
  /** Border color (CSS color value) */
  borderColor?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Children content */
  children?: React.ReactNode;
  /** HTML element to render as */
  as?: "div" | "section" | "article" | "aside" | "main";
}

/**
 * Get background style for surface variant
 */
function getBackgroundStyle(variant: SurfaceVariant): string {
  switch (variant) {
    case "void":
      return void_.DEFAULT;
    case "elevated":
      return `rgba(10, 9, 8, 0.85)`;
    case "glass":
      return `rgba(10, 9, 8, 0.4)`;
    case "transparent":
      return "transparent";
    default:
      return void_.DEFAULT;
  }
}

/**
 * Surface - Background container component
 *
 * Provides consistent background styling with optional borders.
 * Used as a building block for frames and cards.
 *
 * @example
 * ```tsx
 * <Surface variant="elevated" border>
 *   <p>Content on elevated surface</p>
 * </Surface>
 *
 * <Surface variant="glass" borderColor="rgba(202, 165, 84, 0.15)">
 *   <p>Glassmorphism effect</p>
 * </Surface>
 * ```
 */
export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  (
    {
      variant = "void",
      border = false,
      borderColor = dawn["08"],
      borderWidth = 1,
      children,
      className,
      style,
      as: Component = "div",
      ...props
    },
    ref
  ) => {
    const backgroundStyle = getBackgroundStyle(variant);

    const surfaceStyle: React.CSSProperties = {
      background: backgroundStyle,
      ...(border && {
        border: `${borderWidth}px solid ${borderColor}`,
      }),
      ...(variant === "glass" && {
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }),
      ...style,
    };

    return (
      <Component ref={ref} className={cn("relative", className)} style={surfaceStyle} {...props}>
        {children}
      </Component>
    );
  }
);

Surface.displayName = "Surface";
