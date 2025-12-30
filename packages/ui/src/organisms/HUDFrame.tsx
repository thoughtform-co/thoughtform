// HUDFrame Organism
// =============================================================================
// Full viewport frame with corners and rails

import * as React from "react";
import { cn } from "../utils/cn";
import { CornerBracket } from "../atoms/CornerBracket";
import { Rail } from "../atoms/Rail";
import { gold } from "../tokens/colors";
import { cornerArm, cornerThickness } from "../tokens/corners";

export interface HUDFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show corner brackets */
  showCorners?: boolean;
  /** Show measurement rails */
  showRails?: boolean;
  /** Show tick marks on rails */
  showTicks?: boolean;
  /** Corner arm length */
  cornerSize?: number;
  /** Corner color */
  cornerColor?: string;
  /** HUD padding from viewport edges (CSS value) */
  padding?: string;
  /** Children content */
  children?: React.ReactNode;
}

/**
 * HUDFrame - Full viewport HUD container
 *
 * Creates the distinctive Thoughtform viewport frame with
 * corner brackets and measurement rails.
 *
 * @example
 * ```tsx
 * <HUDFrame showCorners showRails showTicks>
 *   <main>Page content</main>
 * </HUDFrame>
 * ```
 */
export function HUDFrame({
  showCorners = true,
  showRails = true,
  showTicks = true,
  cornerSize = cornerArm.xl,
  cornerColor = gold.DEFAULT,
  padding = "clamp(32px, 4vw, 64px)",
  children,
  className,
  style,
  ...props
}: HUDFrameProps) {
  const railWidth = 60;

  return (
    <div
      className={cn("fixed inset-0", className)}
      style={{
        ...style,
      }}
      {...props}
    >
      {/* Corner brackets */}
      {showCorners && (
        <>
          <CornerBracket
            position="tl"
            arm={cornerSize}
            thickness={cornerThickness.default}
            color={cornerColor}
            style={{ top: padding, left: padding }}
          />
          <CornerBracket
            position="tr"
            arm={cornerSize}
            thickness={cornerThickness.default}
            color={cornerColor}
            style={{ top: padding, right: padding }}
          />
          <CornerBracket
            position="bl"
            arm={cornerSize}
            thickness={cornerThickness.default}
            color={cornerColor}
            style={{ bottom: padding, left: padding }}
          />
          <CornerBracket
            position="br"
            arm={cornerSize}
            thickness={cornerThickness.default}
            color={cornerColor}
            style={{ bottom: padding, right: padding }}
          />
        </>
      )}

      {/* Left rail */}
      {showRails && (
        <div
          style={{
            position: "absolute",
            left: padding,
            top: `calc(${padding} + ${cornerSize}px + 20px)`,
            bottom: `calc(${padding} + ${cornerSize}px + 20px)`,
            width: railWidth,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            zIndex: 150,
          }}
        >
          <Rail
            orientation="vertical"
            ticks={showTicks ? 21 : 0}
            showTicks={showTicks}
            length="100%"
            color={cornerColor}
          />
        </div>
      )}

      {/* Right rail */}
      {showRails && (
        <div
          style={{
            position: "absolute",
            right: padding,
            top: `calc(${padding} + ${cornerSize}px + 20px)`,
            bottom: `calc(${padding} + ${cornerSize}px + 20px)`,
            width: railWidth,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            zIndex: 150,
          }}
        >
          <Rail
            orientation="vertical"
            ticks={showTicks ? 21 : 0}
            showTicks={showTicks}
            length="100%"
            color={cornerColor}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10" style={{ height: "100%" }}>
        {children}
      </div>
    </div>
  );
}
