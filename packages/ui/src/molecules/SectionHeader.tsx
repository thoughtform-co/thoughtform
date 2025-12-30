// SectionHeader Molecule
// =============================================================================
// Number + Label + optional line

import * as React from "react";
import { cn } from "../utils/cn";
import { gold, dawn } from "../tokens/colors";
import { fontFamily, fontSize, letterSpacing } from "../tokens/typography";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section number (e.g., "01") */
  index?: string;
  /** Section label */
  label: string;
  /** Show decorative line */
  showLine?: boolean;
}

/**
 * SectionHeader - Section header with index and label
 *
 * @example
 * ```tsx
 * <SectionHeader index="01" label="Navigation" />
 * <SectionHeader label="Services" showLine />
 * ```
 */
export function SectionHeader({
  index,
  label,
  showLine = false,
  className,
  style,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn("flex items-baseline gap-4", className)}
      style={{
        marginBottom: "32px",
        ...style,
      }}
      {...props}
    >
      {index && (
        <span
          style={{
            fontFamily: fontFamily.data,
            fontSize: fontSize.sm,
            fontWeight: 400,
            color: gold.DEFAULT,
            letterSpacing: letterSpacing.wide,
          }}
        >
          {index}
        </span>
      )}

      <span
        style={{
          fontFamily: fontFamily.data,
          fontSize: fontSize.sm,
          fontWeight: 400,
          color: dawn[30],
          textTransform: "uppercase",
          letterSpacing: letterSpacing.wider,
        }}
      >
        {label}
      </span>

      {showLine && (
        <div
          style={{
            flex: 1,
            height: 1,
            background: dawn["08"],
            marginLeft: "8px",
          }}
        />
      )}
    </div>
  );
}
