"use client";

import { useEffect, useMemo, useRef } from "react";
import { ServiceCard, type ServiceData } from "./ServiceCard";
import { type SigilConfig, DEFAULT_SIGIL_CONFIG } from "./SigilCanvas";

// ═══════════════════════════════════════════════════════════════════
// SERVICES DECK
// Two service cards (left + center) that spawn from behind the existing bridge-frame (right card)
// ═══════════════════════════════════════════════════════════════════

// Layout constants
export const SERVICES_CARD_WIDTH = 340;
export const SERVICES_CARD_HEIGHT = 420;
export const SERVICES_CARD_GAP = 40;

// Service content data
export const SERVICES_DATA: ServiceData[] = [
  {
    id: "inspire",
    title: "Inspire // Keynotes.",
    body: "See AI for what it actually is; not software, but an alien intelligence.",
  },
  {
    id: "practice",
    title: "Practice // Workshop.",
    body: "Transform ChatGPT, Claude, ... from tool into a creative and strategic partner.",
  },
  {
    id: "transform",
    title: "Transform // Strategies:",
    body: "Build a culture where AI amplifies human potential.",
  },
];

// Default sigil configs (used until Supabase loads)
export const DEFAULT_SIGIL_CONFIGS: SigilConfig[] = [
  { ...DEFAULT_SIGIL_CONFIG, shape: "gateway" },
  { ...DEFAULT_SIGIL_CONFIG, shape: "torus" },
  { ...DEFAULT_SIGIL_CONFIG, shape: "spiral" },
];

interface ServicesDeckProps {
  /** Pre-mount the deck (keeps cards at opacity 0 until progress starts) */
  enabled?: boolean;
  /** Transition progress from manifesto to services (0-1) */
  progress: number;
  /** Anchor positioning copied from the bridge-frame */
  anchorBottom: string; // CSS calc string
  anchorLeft: string; // CSS string (e.g. "calc(...)")
  anchorTransform: string; // CSS transform string
  /** Current card width/height (matches bridge-frame during services morph) */
  cardWidthPx: number;
  cardHeightPx: number;
  /** Sigil configs for all 3 cards (0=left, 1=center, 2=right) */
  sigilConfigs: SigilConfig[];
  /** Whether current user is admin */
  isAdmin?: boolean;
  /** Callback when admin clicks edit on a card */
  onEditClick?: (cardIndex: number) => void;
  /** Which card index is currently being edited */
  editingCardIndex?: number | null;
}

export function ServicesDeck({
  enabled = false,
  progress,
  anchorBottom,
  anchorLeft,
  anchorTransform,
  cardWidthPx,
  cardHeightPx,
  sigilConfigs,
  isAdmin = false,
  onEditClick,
  editingCardIndex = null,
}: ServicesDeckProps) {
  const cards = useMemo(() => {
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    // `progress` is the (slower) services-card progress; apply an additional gentle ease per-card
    // + longer delay so emergence feels like a morph, not a pop.
    const t = clamp01(progress);
    const spacing = cardWidthPx + SERVICES_CARD_GAP;

    // We render only the two cards that should appear from behind the bridge-frame:
    // - Left card: index 0 (Inspire) ends at -2 * spacing
    // - Center card: index 1 (Practice) ends at -1 * spacing
    const centerT = easeInOutCubic(clamp01((t - 0.14) / 0.86));
    const leftT = easeInOutCubic(clamp01((t - 0.26) / 0.74));

    return [
      { cardIndex: 1, offsetMultiplier: -1, cardT: centerT },
      { cardIndex: 0, offsetMultiplier: -2, cardT: leftT },
    ].map(({ cardIndex, offsetMultiplier, cardT }) => {
      // Start fully hidden (no “baseline opacity” pop), then ease in smoothly.
      const offsetX = offsetMultiplier * spacing * cardT;
      const opacity = cardT;
      const scale = 0.97 + 0.03 * cardT;
      const translateY = (1 - cardT) * 12;
      return { cardIndex, offsetX, opacity, scale, translateY };
    });
  }, [progress, cardWidthPx]);

  // Don't render until transition starts
  if (!enabled && progress <= 0) return null;

  return (
    <div className="services-deck" aria-hidden={progress < 0.05}>
      {cards.map(({ cardIndex, offsetX, opacity, scale, translateY }) => {
        const service = SERVICES_DATA[cardIndex];
        const sigilConfig = sigilConfigs[cardIndex] ?? DEFAULT_SIGIL_CONFIGS[cardIndex];

        return (
          <div
            key={service.id}
            style={{
              position: "fixed",
              bottom: anchorBottom,
              left: anchorLeft,
              width: `${cardWidthPx}px`,
              height: `${cardHeightPx}px`,
              maxWidth: `${cardWidthPx}px`,
              transform: `${anchorTransform} translateX(${offsetX}px) translateY(${translateY}px) scale(${scale})`,
              transformOrigin: "center",
              opacity,
              zIndex: 9, // behind the bridge-frame (z=10)
              pointerEvents: progress > 0.55 ? "auto" : "none",
              // GPU acceleration + micro-smoothing for scroll-driven animation
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
            }}
          >
            <ServiceCard
              service={service}
              sigilConfig={sigilConfig}
              sigilSeed={42 + cardIndex * 1000}
              index={cardIndex}
              isAdmin={isAdmin}
              onEditClick={onEditClick}
              width={cardWidthPx}
              height={cardHeightPx}
              opacity={1}
              zIndex={9}
              isEditing={editingCardIndex === cardIndex}
            />
          </div>
        );
      })}
    </div>
  );
}

export default ServicesDeck;
