"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ServiceCard, type ServiceData } from "./ServiceCard";
import { SERVICES_DATA, DEFAULT_SIGIL_CONFIGS } from "./ServicesDeck";
import type { SigilConfig } from "./SigilCanvas";

// ═══════════════════════════════════════════════════════════════════
// SERVICES STACK MOBILE - BACK CARDS ONLY
// ═══════════════════════════════════════════════════════════════════
//
// Mobile-only component that renders Keynotes (0) and Workshop (1)
// cards stacked behind the bridge-frame (which becomes Strategies card).
//
// Architecture:
// • Front card (Strategies, index 2) renders inside bridge-frame
// • Back cards (Keynotes, Workshop) render here with stack offsets
// • Swipe interaction cycles which card is "front" (moves content to bridge-frame)
//
// Behavior:
// • Cards stack with offsets creating depth
// • Swipe up → next card, swipe down → previous card
// • Tap anywhere on the stack as fallback to cycle to next card
// • Smooth animation on cycle using Framer Motion
// • Respects prefers-reduced-motion
// • Only enables swipe after morph is complete (progress >= 0.95)
//
// ═══════════════════════════════════════════════════════════════════

// Swipe threshold in pixels - must drag at least this far to trigger cycle
const SWIPE_THRESHOLD = 50;
// Velocity threshold - fast swipes below distance threshold still count
const VELOCITY_THRESHOLD = 300;

interface ServicesStackMobileProps {
  /** Progress of the services reveal (0-1) */
  progress: number;
  /** Sigil configs from admin/Supabase */
  sigilConfigs?: SigilConfig[];
  /** Whether the stack is visible */
  isVisible: boolean;
  /** Which card index is currently at front (rendered in bridge-frame) */
  frontCardIndex: number;
  /** Callback when front card changes (for parent to update bridge-frame content) */
  onFrontCardChange?: (index: number) => void;
  /** Bridge-frame position props (to align back cards behind it) */
  bridgeFrameTop?: string;
  bridgeFrameTransform?: string;
  bridgeFrameWidth?: string | number;
  bridgeFrameHeight?: string | number;
}

export function ServicesStackMobile({
  progress,
  sigilConfigs = DEFAULT_SIGIL_CONFIGS,
  isVisible,
  frontCardIndex: controlledFrontCardIndex,
  onFrontCardChange,
  bridgeFrameTop,
  bridgeFrameTransform,
  bridgeFrameWidth,
  bridgeFrameHeight,
}: ServicesStackMobileProps) {
  // Use controlled frontCardIndex if provided, otherwise manage internally
  const [internalFrontCardIndex, setInternalFrontCardIndex] = useState(2); // Start with Strategies (index 2)
  const frontCardIndex = controlledFrontCardIndex ?? internalFrontCardIndex;
  const setFrontCardIndex = onFrontCardChange ?? setInternalFrontCardIndex;

  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Only enable swipe interaction after morph is complete
  const canSwipe = progress >= 0.95;

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Cycle to next card
  const cycleNext = useCallback(() => {
    if (isAnimating || !canSwipe) return;
    setIsAnimating(true);
    const next = (frontCardIndex + 1) % SERVICES_DATA.length;
    setFrontCardIndex(next);
    setTimeout(() => setIsAnimating(false), prefersReducedMotion ? 50 : 350);
  }, [isAnimating, prefersReducedMotion, canSwipe, frontCardIndex, setFrontCardIndex]);

  // Cycle to previous card
  const cyclePrev = useCallback(() => {
    if (isAnimating || !canSwipe) return;
    setIsAnimating(true);
    const prev = (frontCardIndex - 1 + SERVICES_DATA.length) % SERVICES_DATA.length;
    setFrontCardIndex(prev);
    setTimeout(() => setIsAnimating(false), prefersReducedMotion ? 50 : 350);
  }, [isAnimating, prefersReducedMotion, canSwipe, frontCardIndex, setFrontCardIndex]);

  // Handle drag end - determine if swipe was significant enough
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      const { offset, velocity } = info;
      const absOffsetY = Math.abs(offset.y);
      const absVelocityY = Math.abs(velocity.y);

      // Swipe up (negative Y) → next card
      // Swipe down (positive Y) → previous card
      const isSignificantSwipe = absOffsetY > SWIPE_THRESHOLD || absVelocityY > VELOCITY_THRESHOLD;

      if (isSignificantSwipe) {
        if (offset.y < 0 || velocity.y < -VELOCITY_THRESHOLD) {
          // Swipe up → next
          cycleNext();
        } else if (offset.y > 0 || velocity.y > VELOCITY_THRESHOLD) {
          // Swipe down → previous
          cyclePrev();
        }
      }
    },
    [cycleNext, cyclePrev]
  );

  // Tap fallback (only if not dragging and swipe is enabled)
  const handleTap = useCallback(() => {
    if (isDragging || isAnimating || !canSwipe) return;
    cycleNext();
  }, [isDragging, isAnimating, canSwipe, cycleNext]);

  if (!isVisible) return null;

  // Calculate opacity for back cards based on progress
  // Back cards start appearing as soon as we start the transition
  const backCardsOpacity = Math.min(1, progress / 0.3);

  // Animation variants for reduced motion
  const cardTransition = prefersReducedMotion
    ? { duration: 0.05 }
    : { type: "spring", stiffness: 400, damping: 30 };

  // Only render back cards (Keynotes=0, Workshop=1)
  // Front card (Strategies=2) is rendered in bridge-frame
  const backCards = [0, 1]
    .map((index) => {
      const service = SERVICES_DATA[index];
      // Calculate position relative to front card
      const relativePosition =
        (index - frontCardIndex + SERVICES_DATA.length) % SERVICES_DATA.length;

      // If this card is front, it's not rendered here (it's in bridge-frame)
      if (relativePosition === 0) return null;

      // Stack offsets: cards behind front have larger offsets to be seen
      // Offset UPWARDS to peek from the top
      const offsetY = -relativePosition * 36;
      const offsetX = 0; // Keep horizontal centered
      const scale = 1 - relativePosition * 0.04;
      const zIndex = SERVICES_DATA.length - relativePosition;
      const cardOpacity = (1 - relativePosition * 0.1) * backCardsOpacity;

      return { index, service, relativePosition, offsetY, offsetX, scale, zIndex, cardOpacity };
    })
    .filter(Boolean) as Array<{
    index: number;
    service: ServiceData;
    relativePosition: number;
    offsetY: number;
    offsetX: number;
    scale: number;
    zIndex: number;
    cardOpacity: number;
  }>;

  // Top back card is the one closest to front (smallest relativePosition)
  const topBackCardRelativePosition =
    backCards.length > 0 ? Math.min(...backCards.map((c) => c.relativePosition)) : Infinity;

  return (
    <div
      className="services-stack-mobile-back-cards"
      style={{
        position: "fixed",
        left: "50%",
        top: bridgeFrameTop ?? "50%",
        transform: bridgeFrameTransform ?? "translate(-50%, -50%)",
        width: bridgeFrameWidth
          ? typeof bridgeFrameWidth === "number"
            ? `${bridgeFrameWidth}px`
            : bridgeFrameWidth
          : "340px",
        height: bridgeFrameHeight
          ? typeof bridgeFrameHeight === "number"
            ? `${bridgeFrameHeight}px`
            : bridgeFrameHeight
          : "420px",
        pointerEvents: isVisible ? "auto" : "none",
        opacity: backCardsOpacity,
        zIndex: 11, // Behind bridge-frame (z-index 12)
        display: "block",
      }}
    >
      {/* Stack indicator dots */}
      <div className="stack-dots">
        {SERVICES_DATA.map((_, index) => (
          <span key={index} className={`stack-dot ${index === frontCardIndex ? "active" : ""}`} />
        ))}
      </div>

      {/* Back cards stack */}
      {backCards.map(
        ({ index, service, relativePosition, offsetY, offsetX, scale, zIndex, cardOpacity }) => {
          // Top back card is the one closest to front (smallest relativePosition)
          const isTopBackCard = relativePosition === topBackCardRelativePosition;

          return (
            <motion.div
              key={service.id}
              className="stack-card-wrapper"
              // Only the top back card is draggable (closest to front)
              drag={isTopBackCard && canSwipe && !prefersReducedMotion ? "y" : false}
              dragConstraints={{ top: -80, bottom: 80 }}
              dragElastic={0.3}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={isTopBackCard ? handleDragEnd : undefined}
              onClick={isTopBackCard && canSwipe ? handleTap : undefined}
              initial={false}
              animate={{
                y: offsetY,
                x: offsetX,
                scale,
                opacity: cardOpacity,
                zIndex,
              }}
              transition={cardTransition}
              style={{
                position: "absolute",
                inset: 0,
                transformOrigin: "center bottom",
                cursor: isTopBackCard && canSwipe ? "grab" : "default",
                touchAction: isTopBackCard && canSwipe ? "none" : "auto",
              }}
              whileDrag={isTopBackCard ? { cursor: "grabbing", scale: scale * 1.02 } : undefined}
            >
              <ServiceCard
                service={service}
                sigilConfig={sigilConfigs[index] || DEFAULT_SIGIL_CONFIGS[index]}
                sigilSeed={
                  (sigilConfigs[index] || DEFAULT_SIGIL_CONFIGS[index]).seed ?? 42 + index * 1000
                }
                index={index}
                width={undefined} // Let CSS handle width
                opacity={1}
                zIndex={1}
              />
            </motion.div>
          );
        }
      )}

      {/* Swipe hint */}
      <div className="swipe-hint">
        <span className="swipe-hint-icon">↕</span>
        <span className="swipe-hint-text">{prefersReducedMotion ? "TAP TO CYCLE" : "SWIPE"}</span>
      </div>

      <style jsx>{`
        .services-stack-mobile-back-cards {
          transition:
            opacity 0.3s ease,
            transform 0.3s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .stack-dots {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 20;
          pointer-events: none;
        }

        .stack-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(236, 227, 214, 0.25);
          transition: all 0.3s ease;
        }

        .stack-dot.active {
          background: var(--gold, #caa554);
          box-shadow: 0 0 8px rgba(202, 165, 84, 0.5);
        }

        .stack-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        /* ServiceCard width override for mobile */
        .stack-container :global(.service-card) {
          width: 100% !important;
          height: 100% !important;
        }

        .swipe-hint {
          position: absolute;
          left: 50%;
          bottom: 10px;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          opacity: 0.5;
          z-index: 20;
          pointer-events: none;
        }

        .swipe-hint-icon {
          font-size: 12px;
          color: rgba(236, 227, 214, 0.5);
        }

        .swipe-hint-text {
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.15em;
          color: rgba(236, 227, 214, 0.5);
          text-transform: uppercase;
        }

        /* Reduce motion: simpler animations */
        @media (prefers-reduced-motion: reduce) {
          .stack-dot {
            transition: none;
          }
          .services-stack-mobile-back-cards {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
