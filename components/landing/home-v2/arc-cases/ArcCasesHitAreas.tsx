"use client";

import { useRef } from "react";

import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";

/**
 * ArcCasesHitAreas — invisible DOM targets over the ADR-033 cases orbit,
 * so the orbiting cards stay interactive while the corridor canvas remains
 * `pointer-events: none` (the ServicesRingHitAreas pattern verbatim; the
 * DOM hit layer was chosen OVER a canvas raycast opt-in — real buttons,
 * focus, aria, and no viewport-wide raycasting through the Build band).
 *
 * `ArcCasesRing` publishes each card's screen rect into
 * `hologramConnectorStore.arcRingAnchors` while the orbit is armed; this
 * layer rebases those viewport-px rects into its own box. SIDE/BACK cards
 * get a button that steps the ring to their slot; the FRONT card is a
 * showcase, not a link — its face carries the full baked copy and there is
 * no per-case page (the ADR-032 detail surfaces were deliberately
 * retired), so it renders no hit target at all.
 */

/** Minimum clickable width (px) — side cards can project as thin ¾
 *  slivers; the button widens to a touch target centred on the card. */
const MIN_HIT_WIDTH = 44;

export function ArcCasesHitAreas() {
  const arcRingAnchors = useHologramConnectors((s) => s.arcRingAnchors);
  const stepToCase = useArcCasesStore((s) => s.stepToCase);
  const hostRef = useRef<HTMLDivElement>(null);
  // Rebase published viewport coords into this layer's own box (the
  // PlateConnectorOverlay origin-rect lesson).
  const origin = hostRef.current?.getBoundingClientRect();

  return (
    <div ref={hostRef} className="arc-cases-hits" aria-hidden={arcRingAnchors.length === 0}>
      {origin &&
        arcRingAnchors
          .filter((anchor) => anchor.visible && !anchor.front && anchor.w > 8)
          .map((anchor) => {
            const projectCase = PROJECT_CASES[anchor.slot];
            const width = Math.max(anchor.w, MIN_HIT_WIDTH);
            const left = anchor.x - (width - anchor.w) / 2 - origin.left;
            return (
              <button
                key={anchor.caseId}
                type="button"
                className="arc-cases-hits__hit"
                style={{
                  left: `${left.toFixed(1)}px`,
                  top: `${(anchor.y - origin.top).toFixed(1)}px`,
                  width: `${width.toFixed(1)}px`,
                  height: `${anchor.h.toFixed(1)}px`,
                }}
                aria-label={`View ${projectCase?.codename ?? anchor.caseId}`}
                onClick={() => stepToCase(anchor.slot)}
              />
            );
          })}
    </div>
  );
}
