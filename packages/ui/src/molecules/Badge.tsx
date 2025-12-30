// Badge Molecule
// =============================================================================
// Label with optional accent

import * as React from "react";
import { cn } from "../utils/cn";
import { gold, dawn } from "../tokens/colors";
import { fontFamily, fontSize, letterSpacing } from "../tokens/typography";

export type BadgeVariant = "default" | "gold" | "muted";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge text */
  children: React.ReactNode;
  /** Color variant */
  variant?: BadgeVariant;
  /** Show border */
  border?: boolean;
}

const variantStyles: Record<
  BadgeVariant,
  { color: string; borderColor: string; background: string }
> = {
  default: {
    color: dawn[50],
    borderColor: dawn["08"],
    background: "transparent",
  },
  gold: {
    color: gold.DEFAULT,
    borderColor: gold[15],
    background: gold["05"],
  },
  muted: {
    color: dawn[30],
    borderColor: dawn["08"],
    background: "transparent",
  },
};

/**
 * Badge - Small label with optional border
 *
 * @example
 * ```tsx
 * <Badge variant="gold">NEW</Badge>
 * <Badge border>CATEGORY</Badge>
 * ```
 */
export function Badge({
  children,
  variant = "default",
  border = true,
  className,
  style,
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{
        fontFamily: fontFamily.data,
        fontSize: fontSize.xs,
        letterSpacing: letterSpacing.wide,
        textTransform: "uppercase",
        padding: "4px 8px",
        color: styles.color,
        background: styles.background,
        ...(border && {
          border: `1px solid ${styles.borderColor}`,
        }),
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
