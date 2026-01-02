// ChamferedFrame Molecule
// =============================================================================
// Unified SVG-driven chamfer/notch frame with ResizeObserver-based geometry
// Uses single SVG layer for fill + stroke with vector-effect for stable borders

"use client";

import * as React from "react";
import { cn } from "../utils/cn";
import { useElementSize } from "../hooks/useElementSize";
import { generateChamferGeometry } from "../utils/chamferGeometry";
import { resolveShape, chamferColors, type FrameShape, type ShapePreset } from "../tokens/chamfers";

export interface ChamferedFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Shape configuration - preset name or custom shape object
   * @default "inspectorTicket"
   */
  shape?: ShapePreset | FrameShape;

  /**
   * Fill color for the frame background
   * @default chamferColors.fill
   */
  fillColor?: string;

  /**
   * Stroke color for the frame border
   * @default chamferColors.stroke
   */
  strokeColor?: string;

  /**
   * Stroke width in pixels
   * @default 1
   */
  strokeWidth?: number;

  /**
   * Content for the title slot (step-down area, top-left for ticket notch)
   * Only visible for ticket notch shapes
   */
  titleSlot?: React.ReactNode;

  /**
   * Content for the toolbar slot (top-right corner)
   */
  toolbarSlot?: React.ReactNode;

  /**
   * Content for the decorations slot (pinned greebles, non-scroll)
   * Positioned above content but below title/toolbar
   */
  decorationsSlot?: React.ReactNode;

  /**
   * Whether to clip content at a horizontal line below the notch
   * Prevents content from appearing in the title area during scroll
   * @default true
   */
  clipContent?: boolean;

  /**
   * Whether content should scroll
   * @default true
   */
  scrollable?: boolean;

  /**
   * Padding inside the content area
   * @default "md"
   */
  contentPadding?: "none" | "sm" | "md" | "lg";

  /**
   * Children content (goes into scrollable area)
   */
  children?: React.ReactNode;
}

const paddingMap = {
  none: "0",
  sm: "8px 12px",
  md: "12px 16px",
  lg: "16px 20px",
} as const;

/**
 * ChamferedFrame - Reusable chamfered/notched frame component
 *
 * Uses a single SVG layer for both fill and stroke, with ResizeObserver
 * for responsive geometry calculation. Supports ticket notch and cut corner
 * shapes with configurable slots for title, toolbar, and decorations.
 *
 * @example
 * ```tsx
 * // Basic inspector frame
 * <ChamferedFrame
 *   shape="inspectorTicket"
 *   titleSlot={<span>TITLE</span>}
 *   toolbarSlot={<button>×</button>}
 * >
 *   <p>Content here...</p>
 * </ChamferedFrame>
 *
 * // Custom shape configuration
 * <ChamferedFrame
 *   shape={{ kind: "ticketNotch", corner: "tr", notchWidthPx: 180, notchHeightPx: 28 }}
 *   strokeColor="rgba(255, 107, 53, 0.5)"
 * >
 *   <p>Alert frame content</p>
 * </ChamferedFrame>
 *
 * // Cut corners variant
 * <ChamferedFrame shape="cutCornersMd">
 *   <p>Chamfered card content</p>
 * </ChamferedFrame>
 * ```
 */
export const ChamferedFrame = React.forwardRef<HTMLDivElement, ChamferedFrameProps>(
  (
    {
      shape = "inspectorTicket",
      fillColor = chamferColors.fill,
      strokeColor = chamferColors.stroke,
      strokeWidth = 1,
      titleSlot,
      toolbarSlot,
      decorationsSlot,
      clipContent = true,
      scrollable = true,
      contentPadding = "md",
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const [sizeRef, size] = useElementSize();
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    // Combine refs
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        sizeRef(node);
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref, sizeRef]
    );

    // Resolve shape configuration
    const resolvedShape = resolveShape(shape);

    // Generate geometry based on current size
    const geometry = React.useMemo(
      () => generateChamferGeometry(size.width, size.height, resolvedShape),
      [size.width, size.height, resolvedShape]
    );

    // Check if this is a ticket notch shape (for title slot positioning)
    const isTicketNotch = resolvedShape.kind === "ticketNotch";
    const hasTopNotch =
      isTicketNotch && (resolvedShape.corner === "tr" || resolvedShape.corner === "tl");

    // Calculate content padding top to clear notch area
    const contentPaddingTop = hasTopNotch
      ? `calc(${geometry.notchHeightPx}px + ${scrollable ? "16px" : "8px"})`
      : undefined;

    // CSS variables for layout coordination
    // Include both new and legacy variable names for backward compatibility
    const cssVars = {
      // New standardized names
      "--tf-notch-w": `${isTicketNotch ? resolvedShape.notchWidthPx : 0}px`,
      "--tf-notch-h": `${geometry.notchHeightPx}px`,
      "--tf-title-w": `${geometry.titleWidthPx}px`,
      "--tf-clip-top": `${geometry.contentClipTopPx}px`,
      // Legacy Astrogation names (for migration compatibility)
      "--survey-notch-w": `${isTicketNotch ? resolvedShape.notchWidthPx : 0}px`,
      "--survey-notch-h": `${geometry.notchHeightPx}px`,
    } as React.CSSProperties;

    return (
      <div
        ref={setRefs}
        className={cn("tf-chamfered-frame", className)}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          ...cssVars,
          ...style,
        }}
        {...props}
      >
        {/* SVG Frame Layer - Fill + Stroke */}
        {size.width > 0 && size.height > 0 && (
          <svg
            className="tf-chamfered-frame__svg"
            viewBox={`0 0 ${size.width} ${size.height}`}
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {/* Background fill */}
            <polygon points={geometry.polygonPoints} fill={fillColor} />
            {/* Border stroke */}
            <polygon
              points={geometry.polygonPoints}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {/* Title Slot - Step-down area (ticket notch only) */}
        {hasTopNotch && titleSlot && (
          <div
            className="tf-chamfered-frame__title"
            style={{
              position: "absolute",
              top: 4,
              left: resolvedShape.corner === "tr" ? 8 : undefined,
              right: resolvedShape.corner === "tl" ? 8 : undefined,
              width: `calc(var(--tf-title-w) - 8px)`,
              height: `calc(var(--tf-notch-h) - 8px)`,
              display: "flex",
              alignItems: "center",
              zIndex: 3,
              overflow: "hidden",
            }}
          >
            {titleSlot}
          </div>
        )}

        {/* Toolbar Slot - Top corner opposite to title */}
        {toolbarSlot && (
          <div
            className="tf-chamfered-frame__toolbar"
            style={{
              position: "absolute",
              top: 6,
              right: hasTopNotch && resolvedShape.corner === "tr" ? 8 : 8,
              left: hasTopNotch && resolvedShape.corner === "tl" ? 8 : undefined,
              display: "flex",
              alignItems: "center",
              gap: 4,
              zIndex: 3,
            }}
          >
            {toolbarSlot}
          </div>
        )}

        {/* Decorations Slot - Non-scrolling decorative elements */}
        {decorationsSlot && (
          <div
            className="tf-chamfered-frame__decorations"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {decorationsSlot}
          </div>
        )}

        {/* Content Area */}
        <div
          className="tf-chamfered-frame__content"
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            zIndex: 1,
            // Clip content at horizontal line below notch
            clipPath: clipContent && hasTopNotch ? `inset(var(--tf-clip-top) 0 0 0)` : undefined,
          }}
        >
          {/* Scrollable inner content */}
          <div
            className="tf-chamfered-frame__scrollable"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: scrollable ? "auto" : "hidden",
              overflowX: "hidden",
              padding: paddingMap[contentPadding],
              paddingTop: contentPaddingTop || paddingMap[contentPadding].split(" ")[0],
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);

ChamferedFrame.displayName = "ChamferedFrame";

// Re-export types for convenience
export type { FrameShape, ShapePreset };
