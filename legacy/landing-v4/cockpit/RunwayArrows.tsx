"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface RunwayArrowsProps {
  /** Hero→Definition transition progress (0-1) */
  transitionProgress: number;
  /** Definition→Manifesto transition progress (0-1) - button fades out during this */
  tDefToManifesto: number;
  /** Ref to the real CTA button in `index.tsx` so arrows can target its arrow spans */
  frameButtonRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * Runway arrows that transform from "› › › › › ›" in hero
 * into the actual "START YOUR JOURNEY" CTA arrows (››› and ‹‹‹) in the interface section.
 *
 * Important: This component should NOT render its own button (to avoid duplicates).
 */
export function RunwayArrows({
  transitionProgress,
  tDefToManifesto,
  frameButtonRef,
}: RunwayArrowsProps) {
  const t = transitionProgress;

  const [mounted, setMounted] = useState(false);
  const [targetsReady, setTargetsReady] = useState(false);
  const railWidthRef = useRef<number>(64);
  const arrowTargetsRef = useRef<{ left: DOMRect; right: DOMRect } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Read rail width (for correct hero starting position)
  useEffect(() => {
    if (!mounted) return;

    const readRailWidth = () => {
      try {
        const raw = getComputedStyle(document.documentElement)
          .getPropertyValue("--rail-width")
          .trim();
        const parsed = parseFloat(raw);
        railWidthRef.current = Number.isFinite(parsed) && parsed > 0 ? parsed : 64;
      } catch {
        railWidthRef.current = 64;
      }
    };

    readRailWidth();
    window.addEventListener("resize", readRailWidth);
    return () => window.removeEventListener("resize", readRailWidth);
  }, [mounted]);

  // Measure the CTA arrow spans so the 6 hero arrows can animate into them.
  // This runs on scroll-driven rerenders (via `t`) and updates rects via RAF.
  useEffect(() => {
    if (!mounted) return;
    if (!frameButtonRef?.current) return;

    const raf = requestAnimationFrame(() => {
      const root = frameButtonRef.current;
      const leftEl = root?.querySelector<HTMLElement>('[data-role="journey-arrows-left"]');
      const rightEl = root?.querySelector<HTMLElement>('[data-role="journey-arrows-right"]');
      if (!leftEl || !rightEl) return;

      arrowTargetsRef.current = {
        left: leftEl.getBoundingClientRect(),
        right: rightEl.getBoundingClientRect(),
      };

      if (!targetsReady) setTargetsReady(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [mounted, frameButtonRef, t, targetsReady]);

  // Visibility timing
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
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  // Animate late (around when the CTA row appears) so the user actually sees the morph.
  const moveStart = 0.7;
  const moveEnd = 0.9;
  const rawMoveT = clamp01((t - moveStart) / (moveEnd - moveStart));
  const moveT = targetsReady ? rawMoveT : 0;
  const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
  const easeT = easeOutCubic(moveT);

  // Fade out as the real button arrow spans fade in (see `index.tsx` opacity ramp 0.8 → 0.9)
  const fadeOutT = clamp01((t - 0.82) / 0.08);
  const overlayOpacity = exitOpacity * (1 - fadeOutT);

  const arrows = useMemo(() => [0, 1, 2, 3, 4, 5], []);

  if (!mounted) return null;
  if (!isVisible) return null;
  if (overlayOpacity <= 0.001) return null;

  const railWidth = railWidthRef.current ?? 64;
  const baseLeftPx = railWidth + 120;
  const baseYPx = window.innerHeight * (0.5 + t * 0.35);
  const arrowSpacing = 38;

  return (
    <>
      {arrows.map((i) => {
        const isLeftGroup = i < 3;
        const indexInGroup = isLeftGroup ? i : i - 3;

        // Hero state positions (6 arrows in a line)
        const startX = baseLeftPx + i * arrowSpacing;
        const startY = baseYPx;

        let endX = startX;
        let endY = startY;

        const targets = arrowTargetsRef.current;
        if (targets) {
          const rect = isLeftGroup ? targets.left : targets.right;
          const charW = rect.width / 3;
          endX = rect.left + charW * (indexInGroup + 0.5);
          endY = rect.top + rect.height / 2;
        } else {
          // Pre-target grouping: compress into two groups around the original line center
          const lineCenterX = baseLeftPx + (5 * arrowSpacing) / 2;
          const groupGap = 70;
          const inGroupSpacing = 11;
          const groupCenterX = isLeftGroup ? lineCenterX - groupGap : lineCenterX + groupGap;
          endX = groupCenterX + (indexInGroup - 1) * inGroupSpacing;
          endY = startY;
        }

        const x = startX + (endX - startX) * easeT;
        const y = startY + (endY - startY) * easeT;

        // Shrink from 32px to ~16px as they merge into the CTA arrow spans
        const scale = 1 - 0.5 * easeT;
        // Right group rotates to become ‹‹‹
        const rotation = isLeftGroup ? 0 : 180 * easeT;

        return (
          <span
            key={`runway-arrow-${i}`}
            className="runway-arrow"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              opacity: overlayOpacity,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
              animationPlayState: moveT > 0 ? ("paused" as const) : ("running" as const),
              animationDelay: `${i * 0.1}s`,
            }}
          >
            ›
          </span>
        );
      })}

      <style jsx>{`
        .runway-arrow {
          position: fixed;
          font-size: 32px;
          color: var(--gold, #caa554);
          transform-origin: center center;
          will-change: transform, left, top, opacity;
          pointer-events: none;
          user-select: none;
          z-index: 6;
          animation: arrow-pulse 2s ease-in-out infinite;
        }

        @keyframes arrow-pulse {
          0%,
          100% {
            filter: drop-shadow(0 0 0 rgba(202, 165, 84, 0));
          }
          50% {
            filter: drop-shadow(0 0 6px rgba(202, 165, 84, 0.35));
          }
        }

        /* Mobile: hide entirely (component isn't rendered on mobile, but keep as safety) */
        @media (max-width: 768px) {
          .runway-arrow {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
