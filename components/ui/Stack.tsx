"use client";

import React from "react";

interface StackProps {
  /** Gap between children in pixels (default: 20) */
  gap?: number;
  /** Alignment of children along the cross axis */
  align?: "start" | "center" | "end" | "stretch";
  /** Additional CSS class name */
  className?: string;
  /** Inline styles to merge */
  style?: React.CSSProperties;
  /** Child elements */
  children: React.ReactNode;
}

/**
 * Stack component - A flex column container with controlled gap spacing.
 * Use this to vertically stack elements with consistent spacing.
 */
export function Stack({
  gap = 20,
  align = "start",
  className,
  style,
  children,
}: StackProps) {
  const alignMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
  };

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: alignMap[align],
        gap: `${gap}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
