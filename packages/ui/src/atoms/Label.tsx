// Label Atom
// =============================================================================
// HUD-style labels with index and text

import * as React from "react";
import { cn } from "../utils/cn";
import { gold, dawn } from "../tokens/colors";
import { fontFamily, fontSize, letterSpacing } from "../tokens/typography";

export type LabelVariant = "gold" | "dawn" | "muted";

export interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Index number (e.g., "01") */
  index?: string;
  /** Label text */
  text?: string;
  /** Color variant */
  variant?: LabelVariant;
  /** Show separator between index and text */
  separator?: string;
  /** Text size */
  size?: "xs" | "sm" | "md";
}

const variantColors: Record<LabelVariant, { index: string; text: string }> = {
  gold: { index: gold.DEFAULT, text: dawn[30] },
  dawn: { index: dawn.DEFAULT, text: dawn[50] },
  muted: { index: dawn[50], text: dawn[30] },
};

const sizeMap = {
  xs: fontSize.xs,
  sm: fontSize.sm,
  md: fontSize.base,
};

/**
 * Label - HUD-style label component
 *
 * Displays an optional index and label text in the Thoughtform style.
 *
 * @example
 * ```tsx
 * <Label index="01" text="Navigation" />
 * <Label text="Section Header" variant="dawn" />
 * <Label index="03" text="Services" separator=" · " />
 * ```
 */
export function Label({
  index,
  text,
  variant = "gold",
  separator = " · ",
  size = "xs",
  className,
  style,
  children,
  ...props
}: LabelProps) {
  const colors = variantColors[variant];

  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{
        fontFamily: fontFamily.data,
        fontSize: sizeMap[size],
        letterSpacing: letterSpacing.wide,
        textTransform: "uppercase",
        ...style,
      }}
      {...props}
    >
      {index && <span style={{ color: colors.index }}>{index}</span>}
      {index && text && <span style={{ color: colors.text }}>{separator}</span>}
      {text && <span style={{ color: colors.text }}>{text}</span>}
      {children}
    </span>
  );
}
