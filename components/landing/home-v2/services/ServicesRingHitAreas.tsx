"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";

import { DRAWER_CLOSE_BOX, DRAWER_CTA_BOX, RING_CARD_CTA_BOX } from "./hologram/ringCtaBox";
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
  onOpenFront,
  onCloseDrawer,
  openServiceId,
}: {
  onSelectService: (serviceId: ServiceId) => void;
  /**
   * ADR-050. When provided, the FRONT card's hit target becomes a full-rect
   * button that opens the DOM spec plate, instead of the narrow `<a>` shimmed
   * over the baked CTA box. Required by the tight face, which carries no CTA
   * to shim onto — and correct regardless, since the whole card is now the
   * affordance (the baked `OPEN` tick is the visible signal).
   *
   * Omit it and the front card keeps the ADR-029 CTA link byte-identically,
   * so the shipped surface and the `full` face variant are unaffected.
   */
  onOpenFront?: (serviceId: ServiceId) => void;
  /**
   * ADR-050 rev 3. The in-canvas drawer's text is BAKED, so this layer is the
   * only place its CTA, its close control and its screen-reader text can
   * exist. Provided together with `onOpenFront` by the drawer lab.
   */
  onCloseDrawer?: () => void;
  /** The service whose drawer is currently out, for `aria-expanded`. */
  openServiceId?: ServiceId | null;
}) {
  const ringAnchors = useHologramConnectors((s) => s.ringAnchors);
  const hostRef = useRef<HTMLDivElement>(null);
  // Rebase published viewport coords into this layer's own box. The origin
  // is CACHED (2026-07-29 perf pass) — the old render-time
  // `getBoundingClientRect()` forced a layout on every store push, i.e.
  // every frame the ring moved. Measured once per empty→non-empty anchors
  // edge (the host cannot move while anchors publish: the publish gate
  // only opens with the stage pinned, and anchors clear on unpark before
  // it travels), refreshed on resize / tab return.
  const [origin, setOrigin] = useState<{ left: number; top: number } | null>(null);
  const hasAnchors = ringAnchors.length > 0;
  useLayoutEffect(() => {
    if (!hasAnchors) return;
    const measure = () => {
      const r = hostRef.current?.getBoundingClientRect();
      if (!r) return;
      setOrigin((prev) =>
        prev && prev.left === r.left && prev.top === r.top ? prev : { left: r.left, top: r.top }
      );
    };
    measure();
    window.addEventListener("resize", measure);
    document.addEventListener("visibilitychange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", measure);
    };
  }, [hasAnchors]);

  return (
    <div ref={hostRef} className="svc-ring-hits">
      {origin &&
        ringAnchors
          .filter((anchor) => anchor.visible && anchor.w > 8)
          .map((anchor) => {
            const plate = SERVICE_PLATES.find((p) => p.id === anchor.serviceId);
            if (anchor.front && onOpenFront) {
              const isOpen = openServiceId === anchor.serviceId;
              // Front card, ADR-050: the whole face opens the drawer. When
              // the drawer is out we ALSO shim its baked controls — the
              // drawer's text lives on a texture, so these are the only
              // reachable versions of its CTA and close control, and the
              // sr-only block is the only readable copy of its spec.
              return (
                <Fragment key={anchor.serviceId}>
                  <button
                    type="button"
                    className="svc-ring-hits__hit svc-ring-hits__hit--front"
                    style={{
                      left: `${(anchor.x - origin.left).toFixed(1)}px`,
                      top: `${(anchor.y - origin.top).toFixed(1)}px`,
                      width: `${anchor.w.toFixed(1)}px`,
                      height: `${anchor.h.toFixed(1)}px`,
                    }}
                    aria-label={`Open ${plate?.chip ?? anchor.serviceId} details`}
                    aria-expanded={isOpen}
                    onClick={() => onOpenFront(anchor.serviceId)}
                  />
                  {anchor.drawer && plate && (
                    <>
                      <a
                        className="svc-ring-hits__hit svc-ring-hits__hit--cta"
                        href={plate.ctaHref}
                        style={{
                          left: `${(anchor.drawer.x + anchor.drawer.w * DRAWER_CTA_BOX.x - origin.left).toFixed(1)}px`,
                          top: `${(anchor.drawer.y + anchor.drawer.h * DRAWER_CTA_BOX.y - origin.top).toFixed(1)}px`,
                          width: `${(anchor.drawer.w * DRAWER_CTA_BOX.w).toFixed(1)}px`,
                          height: `${(anchor.drawer.h * DRAWER_CTA_BOX.h).toFixed(1)}px`,
                        }}
                        aria-label={plate.ctaLabel}
                      />
                      {onCloseDrawer && (
                        <button
                          type="button"
                          className="svc-ring-hits__hit"
                          style={{
                            left: `${(anchor.drawer.x + anchor.drawer.w * DRAWER_CLOSE_BOX.x - origin.left).toFixed(1)}px`,
                            top: `${(anchor.drawer.y + anchor.drawer.h * DRAWER_CLOSE_BOX.y - origin.top).toFixed(1)}px`,
                            width: `${(anchor.drawer.w * DRAWER_CLOSE_BOX.w).toFixed(1)}px`,
                            height: `${(anchor.drawer.h * DRAWER_CLOSE_BOX.h).toFixed(1)}px`,
                          }}
                          aria-label={`Close ${plate.chip} details`}
                          onClick={onCloseDrawer}
                        />
                      )}
                      {/* The baked drawer copy, readable. */}
                      <p className="svc-ring-hits__sr">
                        {plate.breakdown.join(". ")}. Duration: {plate.spec.duration}. Participants:{" "}
                        {plate.spec.participants}. Format: {plate.spec.format}. Language:{" "}
                        {plate.spec.language}. Leaves with: {plate.spec.leavesWith}.
                      </p>
                    </>
                  )}
                </Fragment>
              );
            }
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
