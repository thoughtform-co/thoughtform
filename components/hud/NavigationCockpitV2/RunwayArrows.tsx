"use client";

import { useEffect, useState } from "react";

interface RunwayArrowsProps {
  /** Hero→Definition transition progress (0-1) */
  transitionProgress: number;
  /** Overall scroll progress for fade-out timing */
  scrollProgress: number;
  /** Click handler to navigate to services section */
  onNavigate: () => void;
  /** Definition→Manifesto transition progress (0-1) - button fades out during this */
  tDefToManifesto: number;
  /** Bridge frame bottom position (for positioning button below frame) */
  frameBottom?: string;
  /** Bridge frame left position */
  frameLeft?: string;
  /** Bridge frame width */
  frameWidth?: string;
  /** Bridge frame transform (for centering) */
  frameTransform?: string;
  /** Ref to frame button to get its actual DOM position */
  frameButtonRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * Runway arrows that transform from "› › › › › ›" in hero
 * to a framed "START YOUR JOURNEY" button in the interface section bottom-left
 */
export function RunwayArrows({
  transitionProgress,
  scrollProgress,
  onNavigate,
  tDefToManifesto,
  frameBottom,
  frameLeft,
  frameWidth,
  frameTransform,
  frameButtonRef,
}: RunwayArrowsProps) {
  const t = transitionProgress;

  // Track frame button position
  const [frameButtonPos, setFrameButtonPos] = useState<{ bottom: number; left: number } | null>(
    null
  );

  // Update frame button position when it becomes available
  useEffect(() => {
    if (!frameButtonRef?.current || t < 0.7) {
      setFrameButtonPos(null);
      return;
    }

    const updatePosition = () => {
      if (frameButtonRef.current) {
        const rect = frameButtonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        setFrameButtonPos({
          bottom: viewportHeight - rect.bottom,
          left: rect.left,
        });
      }
    };

    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      cancelAnimationFrame(rafId);
    };
  }, [frameButtonRef, t]);

  // Visibility timing
  // Button stays visible during definition section, fades out when manifesto transition starts
  // Fade out during manifesto transition (tDefToManifesto 0 → 1)
  const manifestoFadeStart = 0;
  const manifestoFadeEnd = 0.3; // Fade out in first 30% of manifesto transition

  let exitOpacity = 1;
  if (tDefToManifesto > manifestoFadeStart && tDefToManifesto < manifestoFadeEnd) {
    exitOpacity =
      1 - (tDefToManifesto - manifestoFadeStart) / (manifestoFadeEnd - manifestoFadeStart);
  } else if (tDefToManifesto >= manifestoFadeEnd) {
    exitOpacity = 0;
  }

  const isVisible = exitOpacity > 0;
  // Button is interactive once frame is fully visible (t >= 0.85) and before manifesto starts
  const isInteractive = t >= 0.85 && tDefToManifesto < 0.1;

  // Transform progress: frame and START YOUR JOURNEY text appear
  // Frame starts appearing at t=0.5, fully visible by t=0.85
  // Stays visible and fades out as the index.tsx button fades in (cross-fade)
  const frameOpacity =
    t < 0.5 ? 0 : t < 0.85 ? (t - 0.5) / 0.35 : Math.max(0, 1 - (t - 0.85) / 0.15);

  // Apply manifesto fade to frame as well
  const finalFrameOpacity = frameOpacity * exitOpacity;

  // Extra arrows (first 3) fade out during transition
  const extraArrowsOpacity = t < 0.3 ? 1 - t / 0.3 : 0;

  // Main arrows fade out as frame appears
  const mainArrowsOpacity = t < 0.5 ? 1 : t < 0.7 ? 1 - (t - 0.5) / 0.2 : 0;

  // Calculate wrapper position
  // During hero (t < 0.7): original positioning with arrows
  // During transition (0.7 <= t < 0.85): smoothly move to frame position
  // At t >= 0.85: button positioned inside frame (fades out as frame button appears)
  const wrapperStyle: any = {
    opacity: exitOpacity,
    visibility: isVisible ? ("visible" as const) : ("hidden" as const),
    position: "fixed" as const,
    zIndex: 5,
  };

  // Calculate transition progress for smooth movement
  const transitionStart = 0.7;
  const transitionEnd = 0.85;
  const transitionT =
    t < transitionStart
      ? 0
      : t > transitionEnd
        ? 1
        : (t - transitionStart) / (transitionEnd - transitionStart);
  const easeT =
    transitionT < 0.5 ? 2 * transitionT * transitionT : 1 - Math.pow(-2 * transitionT + 2, 2) / 2;

  if (t < transitionStart) {
    // Hero state: original positioning with arrows
    wrapperStyle.top = `calc(50% + ${t * 35}vh)`;
    wrapperStyle.left = `calc(var(--rail-width, 64px) + 120px)`;
    wrapperStyle.transform = "translateY(-50%)";
  } else if (frameBottom && frameLeft && frameButtonPos) {
    // Transition and definition state: use actual DOM position of frame button
    const buttonBottomFromViewportBottom = frameButtonPos.bottom;
    const buttonLeftFromViewportLeft = frameButtonPos.left;

    if (transitionT < 1) {
      // During transition: interpolate between hero and frame button positions
      const heroTopVh = 50 + 0.7 * 35; // top: calc(50% + 0.7*35 vh) = 74.5vh
      const heroLeftPx = 120; // left: calc(var(--rail-width) + 120px)
      const viewportHeight = window.innerHeight;
      const heroTopPx = (heroTopVh / 100) * viewportHeight;
      const heroBottomFromViewportBottom = viewportHeight - heroTopPx;

      // Interpolate
      const currentBottom =
        heroBottomFromViewportBottom * (1 - easeT) + buttonBottomFromViewportBottom * easeT;
      const currentLeft = heroLeftPx * (1 - easeT) + (buttonLeftFromViewportLeft - 64) * easeT; // Subtract rail width

      wrapperStyle.bottom = `${currentBottom}px`;
      wrapperStyle.left = `calc(var(--rail-width, 64px) + ${currentLeft}px)`;
      wrapperStyle.transform = `translateY(${(1 - easeT) * -50}%) ${frameTransform ? `translateX(${easeT * -50}%)` : ""}`;
    } else {
      // At definition state: match frame button position exactly
      wrapperStyle.bottom = `${buttonBottomFromViewportBottom}px`;
      wrapperStyle.left = `${buttonLeftFromViewportLeft}px`;
      wrapperStyle.transform = frameTransform || "none";
    }
  } else if (frameBottom && frameLeft) {
    // Fallback: use calculated position if frame button ref not available
    const parseCalc = (calcStr: string): { px: number; vh: number; pct?: number } => {
      const pxMatch = calcStr.match(/([-\d.]+)px/);
      const vhMatch = calcStr.match(/([-\d.]+)vh/);
      const pctMatch = calcStr.match(/([-\d.]+)%/);
      return {
        px: pxMatch ? parseFloat(pxMatch[1]) : 0,
        vh: vhMatch ? parseFloat(vhMatch[1]) : 0,
        pct: pctMatch ? parseFloat(pctMatch[1]) : undefined,
      };
    };

    const frameBottomParsed = parseCalc(frameBottom);
    const frameLeftParsed = parseCalc(frameLeft);
    const buttonHeight = 50;
    const targetBottomPx = frameBottomParsed.px + 24 + buttonHeight;
    const targetBottomVh = frameBottomParsed.vh;
    const targetLeftPx = frameLeftParsed.px + 24;

    wrapperStyle.bottom = `calc(${targetBottomPx}px + ${targetBottomVh}vh)`;
    wrapperStyle.left = `calc(var(--rail-width, 64px) + ${targetLeftPx}px)`;
    wrapperStyle.transform = frameTransform || "none";
  } else {
    // Fallback
    wrapperStyle.top = `calc(50% + ${t * 35}vh)`;
    wrapperStyle.left = `calc(var(--rail-width, 64px) + 120px)`;
    wrapperStyle.transform = "translateY(-50%)";
  }

  return (
    <>
      <div className="runway-arrows-wrapper" style={wrapperStyle}>
        {/* Hero state: Individual arrows */}
        <div
          className="hero-arrows"
          style={{
            opacity: 1 - frameOpacity,
            visibility: frameOpacity < 1 ? "visible" : "hidden",
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const isExtra = i < 3;
            const arrowOpacity = isExtra ? extraArrowsOpacity : mainArrowsOpacity;

            return (
              <span
                key={`arrow-${i}`}
                className="arrow"
                style={{
                  opacity: arrowOpacity * 0.6,
                  visibility: arrowOpacity > 0 ? "visible" : "hidden",
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                ›
              </span>
            );
          })}
        </div>

        {/* Interface state: Framed button with arrows */}
        <button
          className="services-frame"
          onClick={onNavigate}
          style={{
            opacity: finalFrameOpacity,
            visibility: finalFrameOpacity > 0 ? "visible" : "hidden",
            pointerEvents: isInteractive ? "auto" : "none",
            cursor: isInteractive ? "pointer" : "default",
            position: "absolute",
            left: "4px",
            // Smooth transition using bottom positioning throughout to avoid positioning strategy switches
            // Button height is approximately 50px (padding 14px*2 + content ~22px)
            // When centered: button bottom is at ~50% of wrapper height
            // When at bottom: button bottom is at 0
            // Use calc() to account for button height when transitioning
            ...(t < transitionStart
              ? {
                  // Hero state: centered vertically (temporary top positioning)
                  top: "50%",
                  bottom: "auto",
                  transform: `translateY(-50%) scale(${0.9 + frameOpacity * 0.1})`,
                }
              : transitionT < 1
                ? {
                    // Transition: use bottom positioning with smooth interpolation
                    // Start from equivalent of centered position: calc(50% - 25px) ≈ center accounting for button height
                    // End at 0 (bottom)
                    top: "auto",
                    bottom: `calc(${50 * (1 - easeT)}% - ${25 * (1 - easeT)}px)`, // Smoothly interpolate to 0
                    transform: `scale(${0.9 + frameOpacity * 0.1})`,
                  }
                : {
                    // Definition state: bottom-aligned
                    top: "auto",
                    bottom: 0,
                    transform: `scale(${0.9 + frameOpacity * 0.1})`,
                  }),
          }}
        >
          {/* Corner brackets */}
          <div className="frame-corner frame-corner-tl" />
          <div className="frame-corner frame-corner-tr" />
          <div className="frame-corner frame-corner-bl" />
          <div className="frame-corner frame-corner-br" />

          {/* Left arrows >>> */}
          <span className="frame-arrows frame-arrows-left">›››</span>

          {/* Text content */}
          <span className="frame-text">START YOUR JOURNEY</span>

          {/* Right arrows <<< */}
          <span className="frame-arrows frame-arrows-right">‹‹‹</span>

          {/* Subtle glow */}
          <div className="frame-glow" />
        </button>
      </div>

      <style jsx>{`
        .runway-arrows-wrapper {
          /* Positioning handled via inline styles */
        }

        /* Hero arrows container */
        .hero-arrows {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 230px;
          transition: opacity 0.3s ease;
        }

        .arrow {
          font-size: 32px;
          color: var(--gold, #caa554);
          animation: arrow-pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes arrow-pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.9;
          }
        }

        /* Framed button - positioning handled via inline styles */
        .services-frame {
          position: absolute;

          display: flex;
          align-items: center;
          gap: 10px;

          background: rgba(10, 9, 8, 0.9);
          border: 1px solid rgba(202, 165, 84, 0.25);
          padding: 14px 24px; /* Matched to index.tsx button */

          /* No transition - position is driven by JavaScript scroll updates for smooth animation */
          transition:
            opacity 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease;
        }

        .services-frame:hover {
          background: rgba(15, 14, 12, 0.95);
          border-color: rgba(202, 165, 84, 0.5);
        }

        .services-frame:hover .frame-glow {
          opacity: 1;
        }

        .services-frame:hover .frame-arrows {
          opacity: 1;
        }

        /* Corner brackets */
        .frame-corner {
          position: absolute;
          width: 10px;
          height: 10px;
          pointer-events: none;
        }

        .frame-corner-tl {
          top: -1px;
          left: -1px;
          border-top: 2px solid var(--gold, #caa554);
          border-left: 2px solid var(--gold, #caa554);
        }

        .frame-corner-tr {
          top: -1px;
          right: -1px;
          border-top: 2px solid var(--gold, #caa554);
          border-right: 2px solid var(--gold, #caa554);
        }

        .frame-corner-bl {
          bottom: -1px;
          left: -1px;
          border-bottom: 2px solid var(--gold, #caa554);
          border-left: 2px solid var(--gold, #caa554);
        }

        .frame-corner-br {
          bottom: -1px;
          right: -1px;
          border-bottom: 2px solid var(--gold, #caa554);
          border-right: 2px solid var(--gold, #caa554);
        }

        /* Arrows in frame */
        .frame-arrows {
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 16px;
          color: var(--gold, #caa554);
          opacity: 0.7;
          letter-spacing: -2px;
          transition: opacity 0.2s ease;
        }

        /* Text */
        .frame-text {
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--dawn, #ece3d6);
          white-space: nowrap;
        }

        /* Glow effect */
        .frame-glow {
          position: absolute;
          inset: -8px;
          background: radial-gradient(
            ellipse at center,
            rgba(202, 165, 84, 0.12) 0%,
            transparent 70%
          );
          pointer-events: none;
          z-index: -1;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        /* Mobile: hide entirely */
        @media (max-width: 768px) {
          .runway-arrows-wrapper {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
