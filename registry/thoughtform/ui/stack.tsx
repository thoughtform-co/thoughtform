"use client";

import { cn } from "@/lib/utils";
import { type ReactNode, type CSSProperties } from "react";

export type StackDirection = "column" | "row";
export type StackAlign = "start" | "center" | "end" | "stretch";
export type StackJustify = "start" | "center" | "end" | "between" | "around";
export type StackGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

export interface StackProps {
  children: ReactNode;
  direction?: StackDirection;
  align?: StackAlign;
  justify?: StackJustify;
  gap?: StackGap | number;
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
}

const alignMap: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyMap: Record<StackJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

const gapMap: Record<StackGap, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

/**
 * Stack - Flex container with controlled gap spacing.
 * Use for consistent vertical or horizontal layouts.
 */
export function Stack({
  children,
  direction = "column",
  align = "stretch",
  justify = "start",
  gap = "md",
  wrap = false,
  className,
  style,
}: StackProps) {
  const gapStyle = typeof gap === "number" ? { gap: `${gap}px` } : undefined;
  const gapClass = typeof gap === "string" ? gapMap[gap] : undefined;

  return (
    <div
      className={cn(
        "flex",
        direction === "column" ? "flex-col" : "flex-row",
        alignMap[align],
        justifyMap[justify],
        gapClass,
        wrap && "flex-wrap",
        className
      )}
      style={{ ...gapStyle, ...style }}
    >
      {children}
    </div>
  );
}
