"use client";

import { useEffect, useMemo, useRef } from "react";
import { ServiceCard, type ServiceData } from "./ServiceCard";
import { type SigilConfig, DEFAULT_SIGIL_CONFIG } from "./SigilCanvas";

// ═══════════════════════════════════════════════════════════════════
// SERVICES DECK
// ═══════════════════════════════════════════════════════════════════
//
// Manages the 3-card services layout that emerges from the manifesto
// terminal during scroll. The right card (Strategies) is rendered as
// part of the bridge-frame; this component renders the left (Keynotes)
// and center (Workshop) cards that slide out from behind it.
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ SCROLL-DRIVEN ANIMATION (Sentinel Best Practice)               │
// │                                                                 │
// │ • Progress value (0-1) drives all card animations.             │
// │ • Staggered emergence: center card leads, left card follows.   │
// │ • Uses easeInOutCubic for smooth acceleration/deceleration.    │
// │ • No CSS transitions - all transforms computed per-frame.      │
// │                                                                 │
// │ Animation timeline:                                             │
// │ t=0.00: Cards hidden behind bridge-frame                       │
// │ t=0.14: Center card (Workshop) begins emerging                 │
// │ t=0.26: Left card (Keynotes) begins emerging                   │
// │ t=0.55: Cards become interactive (pointerEvents: auto)         │
// │ t=1.00: Cards fully separated, deck complete                   │
// └─────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ LAYOUT GEOMETRY                                                 │
// │                                                                 │
// │ Deck total width = 3 × 340px + 2 × 40px = 1100px               │
// │                                                                 │
// │     ┌────────┐  40px  ┌────────┐  40px  ┌────────┐             │
// │     │Keynotes│  gap   │Workshop│  gap   │Strategy│             │
// │     │ 340px  │        │ 340px  │        │ 340px  │             │
// │     └────────┘        └────────┘        └────────┘             │
// │     index: 0          index: 1          index: 2               │
// │     (this deck)       (this deck)       (bridge-frame)         │
// └─────────────────────────────────────────────────────────────────┘
//
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// SHARED LAYOUT CONSTANTS
// These values are used by both ServicesDeck and NavigationCockpitV2
// to ensure the 3-card deck aligns properly with the bridge-frame.
// See: sentinel/BEST-PRACTICES.md → "Sync Animation Timing to Shared Constants"
// ─────────────────────────────────────────────────────────────────
export const SERVICES_CARD_WIDTH = 340; // Individual card width (px)
export const SERVICES_CARD_HEIGHT = 420; // Individual card height (px)
export const SERVICES_CARD_GAP = 40; // Gap between cards (px)

// ─────────────────────────────────────────────────────────────────
// SERVICE CONTENT DATA
// Static content for the three service cards. Each service represents
// a key Thoughtform offering with distinct sigil geometry:
//
// • Keynotes (gateway): Portal/threshold shape - opening minds
// • Workshop (torus): Continuous flow - hands-on practice loop
// • Strategies (spiral): Expanding pattern - organizational growth
//
// Note: Content is static; sigil configs are editable via admin panel
// and persisted to Supabase (see: lib/contexts/SigilConfigContext.tsx)
// ─────────────────────────────────────────────────────────────────
export const SERVICES_DATA: ServiceData[] = [
  {
    id: "inspire",
    title: "Keynotes.",
    body: "See AI for what it actually is; not software, but an alien intelligence.",
  },
  {
    id: "practice",
    title: "Workshop.",
    body: "Transform ChatGPT, Claude, ... from tool into a creative and strategic partner.",
  },
  {
    id: "transform",
    title: "Strategies:",
    body: "Build a culture where AI amplifies human potential.",
  },
];

// ─────────────────────────────────────────────────────────────────
// DEFAULT SIGIL CONFIGURATIONS
// Fallback sigil shapes used before Supabase config loads.
// Each shape corresponds to a LIVING_GEOMETRY pattern from the
// Thoughtform brandworld (see: lib/sigil-geometries.ts for shapes).
//
// Admin can override these via the sigil editor panel, which
// persists to the `service_sigils` Supabase table.
// ─────────────────────────────────────────────────────────────────
export const DEFAULT_SIGIL_CONFIGS: SigilConfig[] = [
  { ...DEFAULT_SIGIL_CONFIG, shape: "gateway" }, // Keynotes: threshold/portal
  { ...DEFAULT_SIGIL_CONFIG, shape: "torus" }, // Workshop: continuous loop
  { ...DEFAULT_SIGIL_CONFIG, shape: "spiral" }, // Strategies: expanding growth
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
  // ─────────────────────────────────────────────────────────────────
  // CARD ANIMATION CALCULATION
  // Computes transform values for each card based on scroll progress.
  // Memoized to avoid recalculation on every render.
  //
  // Animation properties per card:
  // • offsetX: Horizontal slide distance from bridge-frame origin
  // • opacity: Fade in (0 → 1) synced with movement
  // • scale: Slight scale-up (0.97 → 1.0) for depth effect
  // • translateY: Subtle vertical lift (12px → 0px) for emergence feel
  //
  // See: sentinel/BEST-PRACTICES.md → "Sync Animation Timing to Shared Constants"
  // ─────────────────────────────────────────────────────────────────
  const cards = useMemo(() => {
    // Easing function: smooth acceleration and deceleration
    // Creates natural "weight" to the card movement
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const t = clamp01(progress);
    const spacing = cardWidthPx + SERVICES_CARD_GAP; // 340 + 40 = 380px per card slot

    // ─────────────────────────────────────────────────────────────
    // STAGGERED TIMING CONSTANTS
    // Center card leads (earlier start), left card follows (delayed).
    // This creates a "fanning out" effect rather than simultaneous movement.
    //
    // centerT starts at t=0.14 (14% into transition)
    // leftT starts at t=0.26 (26% into transition)
    // ─────────────────────────────────────────────────────────────
    const centerT = easeInOutCubic(clamp01((t - 0.14) / 0.86));
    const leftT = easeInOutCubic(clamp01((t - 0.26) / 0.74));

    // Only render the two cards that slide out from behind bridge-frame:
    // • Center card (Workshop): ends at -1 × spacing = -380px
    // • Left card (Keynotes): ends at -2 × spacing = -760px
    // The right card (Strategies, index 2) is rendered by bridge-frame itself
    return [
      { cardIndex: 1, offsetMultiplier: -1, cardT: centerT },
      { cardIndex: 0, offsetMultiplier: -2, cardT: leftT },
    ].map(({ cardIndex, offsetMultiplier, cardT }) => {
      const offsetX = offsetMultiplier * spacing * cardT;
      const opacity = cardT; // Opacity syncs with position (no pop)
      const scale = 0.97 + 0.03 * cardT; // 3% scale growth
      const translateY = (1 - cardT) * 12; // 12px lift that settles to 0
      return { cardIndex, offsetX, opacity, scale, translateY };
    });
  }, [progress, cardWidthPx]);

  // ─────────────────────────────────────────────────────────────────
  // EARLY EXIT: Don't render DOM nodes until transition actually starts.
  // This prevents invisible cards from affecting layout/perf.
  // ─────────────────────────────────────────────────────────────────
  if (!enabled && progress <= 0) return null;

  return (
    <div className="services-deck" aria-hidden={progress < 0.05}>
      {cards.map(({ cardIndex, offsetX, opacity, scale, translateY }) => {
        const service = SERVICES_DATA[cardIndex];
        const sigilConfig = sigilConfigs[cardIndex] ?? DEFAULT_SIGIL_CONFIGS[cardIndex];

        return (
          // ─────────────────────────────────────────────────────────
          // CARD POSITIONING WRAPPER
          // Fixed position anchored to same coordinates as bridge-frame.
          // Transform chain: anchor → slide → lift → scale
          //
          // GPU Acceleration (Sentinel Best Practice):
          // • will-change: transform, opacity - hints browser to optimize
          // • backfaceVisibility: hidden - prevents flicker during transforms
          // See: sentinel/BEST-PRACTICES.md → "Canvas & Three.js"
          // ─────────────────────────────────────────────────────────
          <div
            key={service.id}
            style={{
              position: "fixed",
              bottom: anchorBottom,
              left: anchorLeft,
              width: `${cardWidthPx}px`,
              height: `${cardHeightPx}px`,
              maxWidth: `${cardWidthPx}px`,
              // Transform order matters: anchor translation first, then card-specific offsets
              transform: `${anchorTransform} translateX(${offsetX}px) translateY(${translateY}px) scale(${scale})`,
              transformOrigin: "center",
              opacity,
              // Must sit above `.scroll-container` (z=10) to receive hover/click.
              // We keep the bridge-frame above this deck by raising the bridge-frame z-index.
              zIndex: 11,
              // Interaction disabled during emergence for normal users to avoid accidental clicks
              // while the cards are still fanning out.
              //
              // Admin override: allow interaction at all times so the "Edit Sigil" affordance
              // works reliably even when the transition progress is < 0.55.
              pointerEvents: isAdmin ? "auto" : progress > 0.55 ? "auto" : "none",
              // GPU acceleration for smooth 60fps scroll-driven animation
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
            }}
          >
            <ServiceCard
              service={service}
              sigilConfig={sigilConfig}
              sigilSeed={sigilConfig.seed ?? 42 + cardIndex * 1000} // Editable seed with deterministic fallback
              index={cardIndex}
              isAdmin={isAdmin}
              onEditClick={onEditClick}
              width={cardWidthPx}
              height={cardHeightPx}
              opacity={1} // Card handles its own internal opacity
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
