"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export interface HUDFrameProps {
  children: ReactNode;
  showCorners?: boolean;
  showBorder?: boolean;
  className?: string;
}

/**
 * HUDFrame - Full viewport container with HUD-style decorations.
 * Provides corner brackets and optional border framing.
 */
export function HUDFrame({
  children,
  showCorners = true,
  showBorder = false,
  className,
}: HUDFrameProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen w-full",
        "bg-void text-dawn",
        showBorder && "border border-dawn-08",
        className
      )}
    >
      {/* Corner decorations */}
      {showCorners && (
        <>
          {/* Top Left */}
          <div className="fixed top-4 left-4 z-50 pointer-events-none">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold">
              <path d="M0 8V0H8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Top Right */}
          <div className="fixed top-4 right-4 z-50 pointer-events-none">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold">
              <path d="M24 8V0H16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Bottom Left */}
          <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold">
              <path d="M0 16V24H8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Bottom Right */}
          <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold">
              <path d="M24 16V24H16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </>
      )}

      {children}
    </div>
  );
}
