"use client";

import { CornerBracket } from "@/components/ui/CornerBracket";
import type { NodeContent } from "@/lib/home-v2/corridorMap";

/**
 * CorridorTitleCard — the framed "tethered readout" plate that labels
 * each corridor gate (Navigate / Encode / Build). One reusable card so
 * all three section titles read as the same instrument annotation
 * rather than detached captions floating over the gate.
 *
 * Composition (HUD grammar — corner ticks, hairline tether, void scrim,
 * no rounded corners; see frontend-design skill):
 *   wrapper[data-world-anchor]   ← positioned + faded by useWorldDomTracker
 *     .home-v2-corridor-card      ← the plate: radial void scrim + corner brackets
 *       <CornerBracket/>          ← gold L-ticks at the outer corners
 *       .__content                ← kicker + title + support (existing typography)
 *     .__tether                   ← hairline + diamond pip pointing down at the reticle
 *
 * The wrapper anchors `bottom-center` so the card sits ABOVE the gate
 * and the tether's pip lands near the reticle below it. The tracker
 * writes `opacity` on the wrapper, so the brackets, scrim, card, and
 * tether all fade together as one group on approach.
 */

interface CorridorTitleCardProps {
  content: NodeContent;
  /** `data-world-anchor` id resolved in `sceneGeom.ts`'s COPY_ANCHORS. */
  anchorId: string;
  /** Modifier for per-phase tuning hooks (navigate/encode/build). */
  variant: "navigate" | "encode" | "build";
}

export function CorridorTitleCard({ content, anchorId, variant }: CorridorTitleCardProps) {
  return (
    <div
      className={`home-v2-corridor-card-anchor home-v2-corridor-card-anchor--${variant}`}
      data-world-anchor={anchorId}
      data-anchor-origin="bottom-center"
    >
      <div className="home-v2-corridor-card">
        <CornerBracket mode="four" armLength={14} thickness={1.5} offset={-1} />
        <div className="home-v2-corridor-card__content">
          <p className="home-v2-copy-bridge">{content.kicker}</p>
          <h2 className="home-v2-copy-title" dangerouslySetInnerHTML={{ __html: content.titleHtml }} />
          {content.supportHtml && (
            <p
              className="home-v2-copy-body"
              dangerouslySetInnerHTML={{ __html: content.supportHtml }}
            />
          )}
        </div>
      </div>
      <div className="home-v2-corridor-card__tether" aria-hidden="true" />
    </div>
  );
}
