"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import type { BrandmarkFeatureId } from "@/components/landing/home-v2/brandmarkScanAnchorsRef";
import { SERVICE_DESIGNATIONS, type ServiceDesignation } from "./serviceDesignations";
import type { ServiceId } from "./serviceData";

/**
 * ServicesDesignationLayer — the spacecraft-cutaway / CV-annotation layer
 * for `#services` (ADR-025 Update 9, 2026-07-09).
 *
 * Four small mono callouts sit on top of the parked brandmark, each pinned
 * to a named wireframe feature via a hairline leader with a diamond
 * terminal. The set swaps with the active service (Keynote → Workshop →
 * Embedded → Guided Build), each swap animated as a scramble-decode
 * through the corridor's caption grammar (`captionScramble.ts`) so the
 * mark reads as being interrogated for the current engagement's substance.
 *
 * Wiring:
 *   - `hologramConnectorStore.featureAnchors`: screen-pixel positions of
 *     the named wireframe features, projected each parked frame by
 *     `CorridorArmillary`. Same gate as the plate connectors — the layer
 *     only shows once the instrument is settled.
 *   - `hologramConnectorStore.activeServiceId`: which designation set to
 *     display. `ServicesStage` writes this from the runway scroll step.
 *
 * The wrapper is `inset:0` inside `.services-stage__items`, and every
 * label is absolutely positioned relative to that box in the same
 * viewport-pixel space as the connector overlay — the store publishes
 * viewport pixels, we rebase to the wrapper's origin here so we don't
 * suffer the HUD rail-inset drift the plate connectors used to hit.
 */

/** SVG viewBox is the wrapper's local box (same rebasing as
 *  `ServicesPlateCluster.PlateConnectorOverlay`). */
interface ViewportSize {
  width: number;
  height: number;
}

const viewportStore = {
  subscribe(callback: () => void) {
    if (typeof window === "undefined") return () => {};
    window.addEventListener("resize", callback);
    return () => window.removeEventListener("resize", callback);
  },
  snapshot() {
    if (typeof window === "undefined") return "0x0";
    return `${window.innerWidth}x${window.innerHeight}`;
  },
};

function parseViewportSnapshot(snapshot: string): ViewportSize {
  const [width, height] = snapshot.split("x").map((value) => Number(value) || 0);
  return { width, height };
}

interface DesignationRenderProps {
  designation: ServiceDesignation;
  /** Leader landing point (label position), layer-local pixels. */
  landX: number;
  landY: number;
  labelRef: (el: HTMLElement | null) => void;
  detailRef: (el: HTMLElement | null) => void;
  /** Stagger index for the entrance stroke + scramble delay. */
  order: number;
}

/** One designation callout — BARE text in the drawing's own ink (NASA
 *  cutaway grammar, 2026-07-09 Vince review: no box, no background, no
 *  ornament — the annotation belongs to the wireframe, not to the UI).
 *  Labels live INSIDE the mark's footprint (second review pass), tight to
 *  their anchors like the IMU reference's interior callouts ("STABLE
 *  MEMBER"), each a short hooked leader from the part into the type. The
 *  text stack aligns toward the leader: right-side labels start at the
 *  landing point and grow away from it, left-side labels end at it. */
function DesignationCallout({
  designation,
  landX,
  landY,
  labelRef,
  detailRef,
  order,
}: DesignationRenderProps) {
  return (
    <div
      className="svc-designation"
      data-side={designation.side}
      data-feature={designation.featureId}
      style={
        {
          "--svc-des-x": `${landX.toFixed(1)}px`,
          "--svc-des-y": `${landY.toFixed(1)}px`,
          "--svc-des-order": String(order),
        } as React.CSSProperties
      }
    >
      <span className="svc-designation__label" ref={(el) => labelRef(el)}>
        {designation.label}
      </span>
      <span className="svc-designation__detail" ref={(el) => detailRef(el)}>
        {designation.detail}
      </span>
    </div>
  );
}

interface ServicesDesignationLayerProps {
  /** Fallback when the store hasn't been set yet (SSR / early hydration). */
  fallbackActiveServiceId: ServiceId;
}

export function ServicesDesignationLayer({
  fallbackActiveServiceId,
}: ServicesDesignationLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const featureAnchors = useHologramConnectors((s) => s.featureAnchors);
  // ADR-029 ring mode: the front orbiting card partially overlaps the mark,
  // so callouts whose anchor/label would land ON the photo are suppressed
  // (they'd read as annotating the photograph, not the wireframe). Empty
  // when the ring is off/unparked — the filter is then a no-op.
  const ringAnchors = useHologramConnectors((s) => s.ringAnchors);
  const activeServiceId =
    useHologramConnectors((s) => s.activeServiceId) ?? fallbackActiveServiceId;
  const viewport = parseViewportSnapshot(
    useSyncExternalStore(viewportStore.subscribe, viewportStore.snapshot, viewportStore.snapshot)
  );

  const designations = SERVICE_DESIGNATIONS[activeServiceId] ?? [];

  // Per-designation refs to <span> elements, keyed by featureId (stable
  // across service swaps because each service reuses the same 4 features
  // in typical usage; on mismatch we simply skip).
  const labelRefs = useRef<Record<BrandmarkFeatureId, HTMLElement | null>>(
    {} as Record<BrandmarkFeatureId, HTMLElement | null>
  );
  const detailRefs = useRef<Record<BrandmarkFeatureId, HTMLElement | null>>(
    {} as Record<BrandmarkFeatureId, HTMLElement | null>
  );

  const setLabelRef = (featureId: BrandmarkFeatureId) => (el: HTMLElement | null) => {
    labelRefs.current[featureId] = el;
  };
  const setDetailRef = (featureId: BrandmarkFeatureId) => (el: HTMLElement | null) => {
    detailRefs.current[featureId] = el;
  };

  // Scramble-decode on active-service change. One rAF loop, self-terminating
  // when all jobs resolve — same shape as the wireframe seed's title decode
  // in `ServicePlateCard`. Kernel is `captionScramble.ts` (shared with the
  // corridor caption chrome).
  const jobsRef = useRef<ScrambleJob[]>([]);
  const rafRef = useRef(0);
  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    const stopLoop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      jobsRef.current.length = 0;
    };

    // Under reduced motion or when the layer isn't visible yet, snap text
    // directly to the target — no scramble.
    if (reducedMotion) {
      stopLoop();
      designations.forEach((designation) => {
        const label = labelRefs.current[designation.featureId];
        const detail = detailRefs.current[designation.featureId];
        if (label) label.textContent = designation.label;
        if (detail) detail.textContent = designation.detail;
      });
      return;
    }

    const nowSec = performance.now() / 1000;
    designations.forEach((designation, i) => {
      const label = labelRefs.current[designation.featureId];
      const detail = detailRefs.current[designation.featureId];
      const start = nowSec + 0.08 + i * 0.06;
      if (label) queueScramble(jobsRef.current, label, designation.label, start);
      if (detail) queueScramble(jobsRef.current, detail, designation.detail, start + 0.09);
    });

    const tick = () => {
      advanceScrambles(jobsRef.current, performance.now() / 1000);
      rafRef.current = jobsRef.current.length ? requestAnimationFrame(tick) : 0;
    };
    if (jobsRef.current.length) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      // Never leave a half-decoded label on unmount / next service.
      stopLoop();
    };
    // Re-run on service change (`designations` is a stable-refed constant
    // per service via the SERVICE_DESIGNATIONS lookup, so activeServiceId
    // is the trigger).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServiceId]);

  // Rebase feature anchors from viewport pixels to the layer's local box —
  // same trick as PlateConnectorOverlay. `useMemo` avoids re-computing when
  // the store publishes new anchors but the rebase origin hasn't moved
  // (getBoundingClientRect is cheap, memoing here is more about intent).
  const originRect = layerRef.current?.getBoundingClientRect();
  const ox = originRect?.left ?? 0;
  const oy = originRect?.top ?? 0;

  const frontCard = ringAnchors.find((a) => a.front && a.visible) ?? null;

  const visibleDesignations = useMemo(
    () =>
      // Interior placement (2026-07-09 second pass): each label sits a
      // SHORT offset from its own anchor, inside the mark's footprint —
      // the leader is a small hook from the part into the type, like the
      // IMU reference's interior callouts. Offsets are data-tuned per
      // designation (`serviceDesignations.ts`); the void text-shadow in
      // CSS keeps the caps legible where wires pass behind.
      designations
        .map((designation, order) => {
          const anchor = featureAnchors.find(
            (a) => a.featureId === designation.featureId && a.visible
          );
          if (!anchor) return null;
          const anchorX = anchor.x - ox;
          const anchorY = anchor.y - oy;
          const sideSign = designation.side === "right" ? 1 : -1;
          return {
            designation,
            order,
            anchorX,
            anchorY,
            landX: anchorX + sideSign * designation.offset.dx,
            landY: anchorY + designation.offset.dy,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null)
        // Ring-mode occlusion (ADR-029): drop callouts whose survey point,
        // landing point, or text run would sit on the front card's photo.
        //
        // ADR-050 promotion: the OPEN card's drawer is tested by the same
        // rule. It is a second slab of the same device, published as its own
        // rect because it carries its own yaw and foreshortening — and it
        // extends into exactly the screen area these callouts occupy, so
        // without it "AI STRATEGY / the standing read" lands on top of the
        // drawer's spec grid. Same reasoning as the card itself: a callout
        // over the drawer reads as annotating the spec sheet, not the mark.
        .filter(({ designation, anchorX, anchorY, landX, landY }) => {
          if (!frontCard) return true;
          const pad = 12;
          const rects = [frontCard, ...(frontCard.drawer ? [frontCard.drawer] : [])];
          const inside = (x: number, y: number) =>
            rects.some(
              (r) =>
                x > r.x - ox - pad &&
                x < r.x + r.w - ox + pad &&
                y > r.y - oy - pad &&
                y < r.y + r.h - oy + pad
            );
          const sideSign = designation.side === "right" ? 1 : -1;
          // Sample the text run ~90px from the landing point (labels grow
          // away from the leader on their side).
          return !(
            inside(anchorX, anchorY) ||
            inside(landX, landY) ||
            inside(landX + sideSign * 90, landY)
          );
        }),
    [designations, featureAnchors, frontCard, ox, oy]
  );

  // Hide entirely below 961px or when no anchors are published (no live
  // mark). CSS also hides via a media query — this JS gate keeps the layer
  // out of the tree so it doesn't take up SSR bytes on mobile.
  if (viewport.width < 961) return null;

  const desktop = viewport.width >= 961;

  return (
    <div
      ref={layerRef}
      className="services-designations"
      data-active-service={activeServiceId}
      aria-hidden="true"
    >
      {/* Leader lines — SVG under the labels so the type paints on top of
          any line that would otherwise clip it. */}
      {desktop && visibleDesignations.length > 0 ? (
        <svg className="services-designations__lines" aria-hidden="true">
          {visibleDesignations.map(({ designation, order, anchorX, anchorY, landX, landY }) => {
            const sideSign = designation.side === "right" ? 1 : -1;
            // NASA-cutaway leader: from the part, one straight diagonal to
            // the band, then a short horizontal dash running into the text.
            const elbowX = landX - sideSign * 10;
            const points = `${anchorX.toFixed(1)},${anchorY.toFixed(1)} ${elbowX.toFixed(1)},${landY.toFixed(1)} ${landX.toFixed(1)},${landY.toFixed(1)}`;
            return (
              <g
                key={designation.featureId}
                className="svc-designation-line"
                style={{ "--svc-des-order": String(order) } as React.CSSProperties}
              >
                <polyline className="svc-designation-line__stroke" points={points} />
                {/* Tiny diamond where the leader lands on the wireframe —
                    the one ornament kept (Thoughtform shape law: diamonds).
                    3px, same ink as the line, reads as a survey point. */}
                <rect
                  className="svc-designation-line__tick"
                  x={anchorX - 1.5}
                  y={anchorY - 1.5}
                  width="3"
                  height="3"
                  transform={`rotate(45 ${anchorX} ${anchorY})`}
                />
              </g>
            );
          })}
        </svg>
      ) : null}

      {visibleDesignations.map(({ designation, order, landX, landY }) => (
        <DesignationCallout
          key={designation.featureId}
          designation={designation}
          landX={landX}
          landY={landY}
          labelRef={setLabelRef(designation.featureId)}
          detailRef={setDetailRef(designation.featureId)}
          order={order}
        />
      ))}
    </div>
  );
}
