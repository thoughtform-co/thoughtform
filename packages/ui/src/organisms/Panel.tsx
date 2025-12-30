// Panel Organism
// =============================================================================
// Scrollable panel with header

import * as React from "react";
import { cn } from "../utils/cn";
import {
  Frame,
  type CornerToken,
  type CornerPreset,
  type SurfaceVariant,
} from "../molecules/Frame";
import { gold, dawn } from "../tokens/colors";
import { fontFamily, fontSize, letterSpacing } from "../tokens/typography";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Panel header title */
  header?: string;
  /** Corner configuration */
  corners?: CornerToken;
  /** Corner preset */
  cornerPreset?: CornerPreset;
  /** Corner color */
  cornerColor?: string;
  /** Show border */
  border?: boolean;
  /** Border color */
  borderColor?: string;
  /** Surface variant */
  surface?: SurfaceVariant;
  /** Max height for scrolling */
  maxHeight?: string | number;
  /** Children content */
  children?: React.ReactNode;
}

/**
 * Panel - Scrollable container with header
 *
 * Used for sidebars, tool panels, and scrollable content areas.
 *
 * @example
 * ```tsx
 * <Panel header="COMPONENTS" maxHeight={400}>
 *   <ul>...</ul>
 * </Panel>
 * ```
 */
export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      header,
      corners = "none",
      cornerPreset = "panel",
      cornerColor = gold.DEFAULT,
      border = true,
      borderColor = gold[30],
      surface = "transparent",
      maxHeight,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const maxHeightValue = typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

    return (
      <div
        ref={ref}
        className={cn("flex flex-col", className)}
        style={{
          ...(maxHeight && { maxHeight: maxHeightValue }),
          ...style,
        }}
        {...props}
      >
        {/* Header */}
        {header && (
          <div
            style={{
              padding: "10px 8px",
              border: `1px solid ${borderColor}`,
              fontFamily: fontFamily.mono,
              fontSize: "18px",
              fontWeight: 500,
              letterSpacing: letterSpacing.wide,
              color: gold.DEFAULT,
              textAlign: "center",
              flexShrink: 0,
              marginBottom: "8px",
            }}
          >
            {header}
          </div>
        )}

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "12px 8px",
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

Panel.displayName = "Panel";
