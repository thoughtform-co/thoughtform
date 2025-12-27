"use client";

import { useState, useCallback } from "react";
import { ServiceCard, type ServiceData } from "./ServiceCard";
import { SERVICES_DATA, DEFAULT_SIGIL_CONFIGS } from "./ServicesDeck";
import type { SigilConfig } from "./SigilCanvas";

// ═══════════════════════════════════════════════════════════════════
// SERVICES STACK MOBILE
// ═══════════════════════════════════════════════════════════════════
//
// Mobile-only stacked card deck with tap-to-cycle interaction.
// Reuses ServiceCard component with existing styling.
//
// Behavior:
// • 3 cards stacked with offsets creating depth
// • Tap anywhere on the stack to cycle to next card
// • Smooth animation on cycle using CSS transforms
//
// ═══════════════════════════════════════════════════════════════════

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

  // Cycle to next card on tap
  const handleTap = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setFrontCardIndex((prev) => (prev + 1) % SERVICES_DATA.length);
    // Reset animation lock after transition completes
    setTimeout(() => setIsAnimating(false), 350);
  }, [isAnimating]);

  if (!isVisible || progress < 0.1) return null;

  // Calculate opacity based on progress
  const stackOpacity = Math.min(1, progress * 2);

  return (
    <div
      className="services-stack-mobile"
      onClick={handleTap}
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

          return (
            <div
              key={service.id}
              className="stack-card-wrapper"
              style={{
                transform: `translateY(${offsetY}px) translateX(${offsetX}px) scale(${scale})`,
                zIndex,
                opacity: cardOpacity,
              }}
            >
              <ServiceCard
                service={service}
                sigilConfig={sigilConfigs[index] || DEFAULT_SIGIL_CONFIGS[index]}
                sigilSeed={service.id}
                index={index}
                width={undefined} // Let CSS handle width
                opacity={1}
                zIndex={1}
              />
            </div>
          );
        })}
      </div>

      {/* Tap hint */}
      <div className="tap-hint">
        <span className="tap-hint-text">TAP TO CYCLE</span>
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
          cursor: pointer;
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

        .stack-card-wrapper {
          position: absolute;
          inset: 0;
          transition:
            transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.35s ease;
          transform-origin: center bottom;
        }

        /* ServiceCard width override for mobile */
        .stack-card-wrapper :global(.service-card) {
          width: 100% !important;
          height: 100% !important;
        }

        .tap-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          opacity: 0.5;
        }

        .tap-hint-text {
          font-family: var(--font-data, "PT Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.15em;
          color: rgba(236, 227, 214, 0.5);
          text-transform: uppercase;
        }

        /* Active state feedback */
        .services-stack-mobile:active .stack-container {
          transform: scale(0.98);
        }

        .services-stack-mobile:active .tap-hint {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
