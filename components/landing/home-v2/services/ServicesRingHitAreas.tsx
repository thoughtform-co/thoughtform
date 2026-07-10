"use client";

import { useRef } from "react";

import { RING_CARD_CTA_BOX } from "./hologram/ServicesCardRing";
import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { SERVICE_PLATES } from "./servicePlateData";
import type { ServiceId } from "./serviceData";

/**
 * ServicesRingHitAreas — invisible DOM targets over the ADR-029 ring cards,
 * so the orbiting planes stay interactive while the corridor canvas remains
 * `pointer-events: none`.
 *
 * `ServicesCardRing` projects each card's screen rect into
 * `hologramConnectorStore.ringAnchors` once the instrument is parked; this
 * layer rebases those viewport-px rects into its own box (the
 * `PlateConnectorOverlay` origin-rect lesson — the stage is not guaranteed
 * to sit at the viewport origin). SIDE/BACK cards get a button that scrolls
 * the runway to their beat; the FRONT card gets a real <a> over its baked
 * CTA box (the card carries its full C3 copy on the texture).
 */
/** Minimum clickable width (px). Side cards can project as thin ¾ slivers
 *  (the rig's bounded drift makes one side narrower than the other at any
 *  instant); the button widens to a standard touch target centred on the
 *  card so the sliver stays reliably clickable. */
const MIN_HIT_WIDTH = 44;

export function ServicesRingHitAreas({
  onSelectService,
}: {
  onSelectService: (serviceId: ServiceId) => void;
}) {
  const ringAnchors = useHologramConnectors((s) => s.ringAnchors);
  const hostRef = useRef<HTMLDivElement>(null);
  // Rebase published viewport coords into this layer's own box. Reading the
  // rect during render is the established overlay pattern here (the layer
  // re-renders off store pushes, same as PlateConnectorOverlay).
  const origin = hostRef.current?.getBoundingClientRect();

  return (
    <div ref={hostRef} className="svc-ring-hits">
      {origin &&
        ringAnchors
          .filter((anchor) => anchor.visible && anchor.w > 8)
          .map((anchor) => {
            const plate = SERVICE_PLATES.find((p) => p.id === anchor.serviceId);
            if (anchor.front) {
              // Front card: a real link over the baked CTA box. The card is
              // face-on when front, so mapping the normalized box linearly
              // onto the published rect is exact enough for a hit target.
              if (!plate) return null;
              return (
                <a
                  key={anchor.serviceId}
                  className="svc-ring-hits__hit svc-ring-hits__hit--cta"
                  href={plate.ctaHref}
                  style={{
                    left: `${(anchor.x + anchor.w * RING_CARD_CTA_BOX.x - origin.left).toFixed(1)}px`,
                    top: `${(anchor.y + anchor.h * RING_CARD_CTA_BOX.y - origin.top).toFixed(1)}px`,
                    width: `${(anchor.w * RING_CARD_CTA_BOX.w).toFixed(1)}px`,
                    height: `${(anchor.h * RING_CARD_CTA_BOX.h).toFixed(1)}px`,
                  }}
                  aria-label={plate.ctaLabel}
                />
              );
            }
            const width = Math.max(anchor.w, MIN_HIT_WIDTH);
            const left = anchor.x - (width - anchor.w) / 2 - origin.left;
            return (
              <button
                key={anchor.serviceId}
                type="button"
                className="svc-ring-hits__hit"
                style={{
                  left: `${left.toFixed(1)}px`,
                  top: `${(anchor.y - origin.top).toFixed(1)}px`,
                  width: `${width.toFixed(1)}px`,
                  height: `${anchor.h.toFixed(1)}px`,
                }}
                aria-label={`View ${plate?.chip ?? anchor.serviceId}`}
                onClick={() => onSelectService(anchor.serviceId)}
              />
            );
          })}
    </div>
  );
}
