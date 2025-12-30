// Rail Atom
// =============================================================================
// Measurement rail with tick marks

import * as React from "react";
import { cn } from "../utils/cn";
import { gold } from "../tokens/colors";

export type RailOrientation = "vertical" | "horizontal";

export interface RailProps {
  /** Rail orientation */
  orientation?: RailOrientation;
  /** Number of tick marks */
  ticks?: number;
  /** Show tick marks */
  showTicks?: boolean;
  /** Rail length (CSS value) */
  length?: string | number;
  /** Rail color */
  color?: string;
  /** Major tick interval (every nth tick is major) */
  majorInterval?: number;
  /** Major tick length in pixels */
  majorTickLength?: number;
  /** Minor tick length in pixels */
  minorTickLength?: number;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Rail - Measurement scale with tick marks
 *
 * Used in HUD frames for depth indication and measurement aesthetic.
 *
 * @example
 * ```tsx
 * <Rail orientation="vertical" ticks={11} length={200} />
 * <Rail orientation="horizontal" ticks={21} majorInterval={5} />
 * ```
 */
export function Rail({
  orientation = "vertical",
  ticks = 11,
  showTicks = true,
  length = 200,
  color = gold.DEFAULT,
  majorInterval = 5,
  majorTickLength = 16,
  minorTickLength = 8,
  className,
  style,
}: RailProps) {
  const isVertical = orientation === "vertical";
  const lengthValue = typeof length === "number" ? `${length}px` : length;

  return (
    <div
      className={cn("relative", className)}
      style={{
        width: isVertical ? 60 : lengthValue,
        height: isVertical ? lengthValue : 60,
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        ...style,
      }}
    >
      {/* Main rail line */}
      <div
        style={{
          position: "absolute",
          ...(isVertical
            ? {
                left: 0,
                top: 0,
                bottom: 0,
                width: 1,
              }
            : {
                top: 0,
                left: 0,
                right: 0,
                height: 1,
              }),
          background: `linear-gradient(${isVertical ? "to bottom" : "to right"}, transparent 0%, ${color}80 10%, ${color}80 90%, transparent 100%)`,
        }}
      />

      {/* Tick marks */}
      {showTicks && (
        <div
          style={{
            position: "absolute",
            ...(isVertical ? { left: 0, top: 0, bottom: 0 } : { top: 0, left: 0, right: 0 }),
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            justifyContent: "space-between",
          }}
        >
          {Array.from({ length: ticks }).map((_, i) => {
            const isMajor = i % majorInterval === 0;
            const tickLength = isMajor ? majorTickLength : minorTickLength;

            return (
              <div
                key={i}
                style={{
                  ...(isVertical
                    ? { width: tickLength, height: 1 }
                    : { height: tickLength, width: 1 }),
                  background: isMajor ? color : `${color}80`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
