"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ServiceCard, type ServiceData } from "./ServiceCard";
import { SERVICES_DATA, DEFAULT_SIGIL_CONFIGS } from "./ServicesDeck";
import type { SigilConfig } from "./SigilCanvas";

// ═══════════════════════════════════════════════════════════════════
// SERVICES STACK MOBILE
// ═══════════════════════════════════════════════════════════════════
//
// Mobile-only stacked card deck with vertical swipe interaction.
// Reuses ServiceCard component with existing styling.
//
// Behavior:
// • 3 cards stacked with offsets creating depth
// • Swipe up → next card, swipe down → previous card
// • Tap anywhere on the stack as fallback to cycle to next card
// • Smooth animation on cycle using Framer Motion
// • Respects prefers-reduced-motion
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
}

export function ServicesStackMobile({
  progress,
  sigilConfigs = DEFAULT_SIGIL_CONFIGS,
  isVisible,
}: ServicesStackMobileProps) {
  // Track which card is at front (0, 1, or 2)
  const [frontCardIndex, setFrontCardIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
    if (isAnimating) return;
    setIsAnimating(true);
    setFrontCardIndex((prev) => (prev + 1) % SERVICES_DATA.length);
    setTimeout(() => setIsAnimating(false), prefersReducedMotion ? 50 : 350);
  }, [isAnimating, prefersReducedMotion]);

  // Cycle to previous card
  const cyclePrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setFrontCardIndex((prev) => (prev - 1 + SERVICES_DATA.length) % SERVICES_DATA.length);
    setTimeout(() => setIsAnimating(false), prefersReducedMotion ? 50 : 350);
  }, [isAnimating, prefersReducedMotion]);

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

  // Tap fallback (only if not dragging)
  const handleTap = useCallback(() => {
    if (isDragging || isAnimating) return;
    cycleNext();
  }, [isDragging, isAnimating, cycleNext]);

  if (!isVisible) return null;

  // Calculate opacity based on progress
  const stackOpacity = Math.min(1, progress * 2);

  // Animation variants for reduced motion
  const cardTransition = prefersReducedMotion
    ? { duration: 0.05 }
    : { type: "spring", stiffness: 400, damping: 30 };

  return (
    <div
      className="services-stack-mobile"
      style={{
        opacity: stackOpacity,
        transform: `translateY(${(1 - progress) * 30}px)`,
      }}
    >
      {/* Stack indicator dots */}
      <div className="stack-dots">
        {SERVICES_DATA.map((_, index) => (
          <span key={index} className={`stack-dot ${index === frontCardIndex ? "active" : ""}`} />
        ))}
      </div>

      {/* Card stack */}
      <div className="stack-container">
        {SERVICES_DATA.map((service, index) => {
          // Calculate position relative to front card
          const relativePosition =
            (index - frontCardIndex + SERVICES_DATA.length) % SERVICES_DATA.length;

          // Stack offsets: front card has no offset, others are stacked behind
          const offsetY = relativePosition * 8;
          const offsetX = relativePosition * 4;
          const scale = 1 - relativePosition * 0.03;
          const zIndex = SERVICES_DATA.length - relativePosition;
          const cardOpacity = 1 - relativePosition * 0.15;

          const isFrontCard = relativePosition === 0;

          return (
            <motion.div
              key={service.id}
              className="stack-card-wrapper"
              // Only the front card is draggable
              drag={isFrontCard && !prefersReducedMotion ? "y" : false}
              dragConstraints={{ top: -80, bottom: 80 }}
              dragElastic={0.3}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={isFrontCard ? handleDragEnd : undefined}
              onClick={isFrontCard ? handleTap : undefined}
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
                cursor: isFrontCard ? "grab" : "default",
                touchAction: isFrontCard ? "none" : "auto",
              }}
              whileDrag={{ cursor: "grabbing", scale: scale * 1.02 }}
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
        })}
      </div>

      {/* Swipe hint */}
      <div className="swipe-hint">
        <span className="swipe-hint-icon">↕</span>
        <span className="swipe-hint-text">{prefersReducedMotion ? "TAP TO CYCLE" : "SWIPE"}</span>
      </div>

      <style jsx>{`
        .services-stack-mobile {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 0 8px;
          transition:
            opacity 0.3s ease,
            transform 0.3s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .stack-dots {
          display: flex;
          gap: 8px;
          padding: 8px;
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
          position: relative;
          width: 100%;
          max-width: 340px;
          aspect-ratio: 340 / 420;
        }

        /* ServiceCard width override for mobile */
        .stack-container :global(.service-card) {
          width: 100% !important;
          height: 100% !important;
        }

        .swipe-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          opacity: 0.5;
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
          .services-stack-mobile {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
