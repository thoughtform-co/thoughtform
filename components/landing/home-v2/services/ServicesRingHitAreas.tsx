"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";

import { DRAWER_CLOSE_BOX, DRAWER_CTA_BOX, RING_CARD_CTA_BOX } from "./hologram/ringCtaBox";
import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { SERVICE_PLATES, type ServicePlate } from "./servicePlateData";
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

/** A shim box of at least the 44px touch floor on BOTH axes, centred on the
 *  baked control's own centre (viewport px in, host-relative css out). */
function touchBox(
  cx: number,
  cy: number,
  w: number,
  h: number,
  origin: { left: number; top: number }
): { left: string; top: string; width: string; height: string } {
  const bw = Math.max(MIN_HIT_WIDTH, w);
  const bh = Math.max(MIN_HIT_WIDTH, h);
  return {
    left: `${(cx - bw / 2 - origin.left).toFixed(1)}px`,
    top: `${(cy - bh / 2 - origin.top).toFixed(1)}px`,
    width: `${bw.toFixed(1)}px`,
    height: `${bh.toFixed(1)}px`,
  };
}

export function ServicesRingHitAreas({
  onSelectService,
  onOpenFront,
  onCloseDrawer,
  openServiceId,
  plates = SERVICE_PLATES,
}: {
  onSelectService: (serviceId: ServiceId) => void;
  /**
   * The record the accessible names come from (2026-09-19 lab pass). Defaults
   * to production's; the card-face lab passes its re-cut four so the sr-only
   * copy and the button names follow the card the ring is actually baking.
   */
  plates?: readonly ServicePlate[];
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
            const plate = plates.find((p) => p.id === anchor.serviceId);
            if (anchor.front && onOpenFront) {
              const isOpen = openServiceId === anchor.serviceId;
              /* ADR-110 (phone): the card has TURNED OVER and its back — the
                 spec — is what this rect shows. The back is coplanar with the
                 face, so the ✕ and CTA box fractions map straight onto the
                 card's own rect; the face itself becomes the way back. */
              const isBack = Boolean(anchor.back);
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
                    /* The service this button opens, readable off the DOM
                       (ADR-108's phone smoke follows a tap to the plate that
                       carries the same id). */
                    data-service={anchor.serviceId}
                    style={{
                      left: `${(anchor.x - origin.left).toFixed(1)}px`,
                      top: `${(anchor.y - origin.top).toFixed(1)}px`,
                      width: `${anchor.w.toFixed(1)}px`,
                      height: `${anchor.h.toFixed(1)}px`,
                    }}
                    data-back={isBack ? "1" : undefined}
                    aria-label={
                      isBack
                        ? `Close ${plate?.chip ?? anchor.serviceId} details`
                        : `Open ${plate?.chip ?? anchor.serviceId} details`
                    }
                    aria-expanded={isOpen}
                    onClick={() =>
                      isOpen && isBack && onCloseDrawer
                        ? onCloseDrawer()
                        : onOpenFront(anchor.serviceId)
                    }
                  />
                  {isBack && plate && (
                    <>
                      {/* The back's CTA and ✕, over the CARD rect (the back is
                          coplanar), as LATER siblings so they take the tap
                          before the face's toggle. */}
                      {/* Both shims grow to the 44px touch floor ABOUT THEIR
                          BOX'S CENTRE — a min-size on the box alone anchors
                          at its top-left and lands a 44px square 13px off a
                          17px chit (the visual review's first finding). */}
                      <a
                        className="svc-ring-hits__hit svc-ring-hits__hit--cta"
                        href={plate.ctaHref}
                        style={touchBox(
                          anchor.x + anchor.w * (RING_CARD_CTA_BOX.x + RING_CARD_CTA_BOX.w / 2),
                          anchor.y + anchor.h * (RING_CARD_CTA_BOX.y + RING_CARD_CTA_BOX.h / 2),
                          anchor.w * RING_CARD_CTA_BOX.w,
                          anchor.h * RING_CARD_CTA_BOX.h,
                          origin
                        )}
                        aria-label={plate.ctaLabel}
                      />
                      {onCloseDrawer && (
                        <button
                          type="button"
                          className="svc-ring-hits__hit svc-ring-hits__hit--close"
                          style={touchBox(
                            anchor.x + anchor.w * (DRAWER_CLOSE_BOX.x + DRAWER_CLOSE_BOX.w / 2),
                            anchor.y + anchor.h * (DRAWER_CLOSE_BOX.y + DRAWER_CLOSE_BOX.h / 2),
                            anchor.w * DRAWER_CLOSE_BOX.w,
                            anchor.h * DRAWER_CLOSE_BOX.h,
                            origin
                          )}
                          aria-label={`Close ${plate.chip} details`}
                          onClick={onCloseDrawer}
                        />
                      )}
                      {/* The baked back copy, readable. */}
                      <p className="svc-ring-hits__sr">
                        {plate.chip}. {plate.title} {plate.breakdown.join(". ")}. Duration:{" "}
                        {plate.spec.duration}. Participants: {plate.spec.participants}. Format:{" "}
                        {plate.spec.format}. Language: {plate.spec.language}. Leaves with:{" "}
                        {plate.spec.leavesWith}.
                      </p>
                    </>
                  )}
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
                data-service={anchor.serviceId}
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
