"use client";

import { useMemo } from "react";
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
    // Delay the fan-out slightly so it feels like cards emerge after the frame starts shrinking.
    const t = Math.max(0, Math.min(1, (progress - 0.08) / 0.92));
    const spacing = cardWidthPx + SERVICES_CARD_GAP;

    // We render only the two cards that should appear from behind the bridge-frame:
    // - Left card: index 0 (Inspire) ends at -2 * spacing
    // - Center card: index 1 (Practice) ends at -1 * spacing
    return [
      { cardIndex: 0, offsetMultiplier: -2 },
      { cardIndex: 1, offsetMultiplier: -1 },
    ].map(({ cardIndex, offsetMultiplier }) => {
      const offsetX = offsetMultiplier * spacing * t;
      const opacity = 0.08 + 0.92 * t;
      const scale = 0.96 + 0.04 * t;
      const translateY = (1 - t) * 14;
      return {
        cardIndex,
        offsetX,
        opacity,
        scale,
        translateY,
      };
    });
  }, [progress, cardWidthPx]);

  // Don't render until transition starts
  if (progress <= 0) return null;

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
