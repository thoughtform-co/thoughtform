// TargetReticle Atom
// =============================================================================
// Selection/targeting frame with corner brackets and label

import * as React from "react";
import { cn } from "../utils/cn";
import { dawn } from "../tokens/colors";
import { fontFamily, letterSpacing } from "../tokens/typography";

export interface TargetReticleProps {
  /** Label text displayed at top */
  label?: string;
  /** Show crosshair marks */
  showCrosshairs?: boolean;
  /** Show scanning animation */
  scanning?: boolean;
  /** Animate on mount */
  animate?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Children content (the targeted element) */
  children?: React.ReactNode;
}

/**
 * TargetReticle - Subtle selection indicator
 *
 * Wraps content with a soft dotted frame for selection state.
 * Uses dawn colors to stay subtle and not compete with component styling.
 *
 * @example
 * ```tsx
 * <TargetReticle label="BUTTON">
 *   <Button>Click me</Button>
 * </TargetReticle>
 * ```
 */
export function TargetReticle({
  label,
  showCrosshairs = false,
  scanning = false,
  animate = true,
  className,
  style,
  children,
}: TargetReticleProps) {
  // Subtle dawn color for selection - not competing with gold
  const frameColor = dawn[15];
  const labelColor = dawn[40];
  const frameOffset = 20;

  return (
    <div
      className={cn("relative", className)}
      style={{
        ...style,
      }}
    >
      {/* Label at top - subtle dawn color */}
      {label && (
        <div
          style={{
            position: "absolute",
            top: -frameOffset - 16,
            left: -frameOffset,
            fontFamily: fontFamily.data,
            fontSize: "10px",
            letterSpacing: letterSpacing.wide,
            textTransform: "uppercase",
            color: labelColor,
            animation: animate ? "reticle-label-in 0.3s ease-out" : undefined,
          }}
        >
          {label}
        </div>
      )}

      {/* Dotted frame border */}
      <div
        style={{
          position: "absolute",
          inset: -frameOffset,
          border: `1px dashed ${frameColor}`,
          pointerEvents: "none",
          animation: animate ? "reticle-frame-in 0.2s ease-out" : undefined,
        }}
      />

      {/* Optional crosshair marks - very subtle */}
      {showCrosshairs && (
        <>
          <div
            style={{
              position: "absolute",
              top: -frameOffset - 6,
              left: "50%",
              transform: "translateX(-50%)",
              width: 1,
              height: 6,
              background: frameColor,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -frameOffset - 6,
              left: "50%",
              transform: "translateX(-50%)",
              width: 1,
              height: 6,
              background: frameColor,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -frameOffset - 6,
              top: "50%",
              transform: "translateY(-50%)",
              width: 6,
              height: 1,
              background: frameColor,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -frameOffset - 6,
              top: "50%",
              transform: "translateY(-50%)",
              width: 6,
              height: 1,
              background: frameColor,
            }}
          />
        </>
      )}

      {/* Scanning line (optional) */}
      {scanning && (
        <div
          style={{
            position: "absolute",
            inset: -frameOffset,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent 0%, ${dawn[30]} 50%, transparent 100%)`,
              animation: "reticle-scan 2s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ position: "relative" }}>{children}</div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes reticle-frame-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes reticle-label-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes reticle-scan {
          0% {
            top: 0;
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
