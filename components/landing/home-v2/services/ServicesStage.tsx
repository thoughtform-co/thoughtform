"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { ServicesDesignationLayer } from "./ServicesDesignationLayer";
import { ServicesMasthead } from "./ServicesMasthead";
import { ServicesPlateCluster } from "./ServicesPlateCluster";
import { ServicesRingHitAreas } from "./ServicesRingHitAreas";
import { ServicesStationReadout } from "./ServicesStationReadout";
import { SERVICES, type ServiceId } from "./serviceData";
import { useServicesStageScroll } from "../hooks/useServicesStageScroll";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { servicesBeatScrollTarget } from "@/lib/services-ring/beatScrollTarget";
import { startRingScrollTween } from "@/lib/services-ring/ringScrollTween";
import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { SERVICES_CARD_RING, UNIFIED_SERVICES_ARMILLARY } from "../unifiedServicesInstrument";

// Flag-off / lab path only (see showServicesCanvas below). Lazy so the
// postprocessing stack never enters the marketing route's initial JS —
// with UNIFIED_SERVICES_ARMILLARY on, production never fetches this
// chunk at all. The hologram/ barrel itself must stay statically
// importable elsewhere (CorridorArmillary uses HologramOrbits inside
// the corridor canvas) — only this canvas subtree is split.
const ServicesHologramCanvas = dynamic(
  () => import("./ServicesHologramCanvas").then((m) => m.ServicesHologramCanvas),
  { ssr: false }
);

/**
 * ServicesStage - the `#services` interaction as a section-owned holographic
 * instrument.
 *
 * Desktop renders the real Thoughtform brandmark hologram and service orbits
 * in one R3F scene. The scan notes and the expanded card are DOM overlays that
 * receive projected anchors from that scene. Mobile/reduced-motion keeps the
 * existing static brandmark + SVG orbit fallback and the same scan-card UI.
 *
 * This is intentionally NOT the retired fixed in-Services brandmark/pixel
 * choreography from ADR-021. No `data-services-brandmark`, no seam pixel field,
 * and no fixed viewport actor are reintroduced.
 */
export function ServicesStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  // `activeServiceId` drives the backdrop wireframe designations, the bottom
  // readout, and the ambient orbit highlight — always a real service. The
  // OPEN plate is tracked separately so the section can enter with every card
  // collapsed (`expandedServiceId = null`) and open one per scroll beat.
  const [activeServiceId, setActiveServiceId] = useState<ServiceId>(SERVICES[0].id);
  const [expandedServiceId, setExpandedServiceId] = useState<ServiceId | null>(null);
  const useHologramCanvas = useMediaQuery(
    "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
  );

  // Bridge the active service to the unified corridor instrument (the armillary
  // lives in the corridor canvas) so the active orbit ring still highlights in
  // the ambient backdrop behind the plates. Harmless when the flag is off.
  const setActiveServiceIdStore = useHologramConnectors((s) => s.setActiveServiceId);
  useEffect(() => {
    setActiveServiceIdStore(activeServiceId);
  }, [activeServiceId, setActiveServiceIdStore]);
  useEffect(() => () => setActiveServiceIdStore(null), [setActiveServiceIdStore]);

  // When the corridor supplies the unified instrument (desktop, flag on), the
  // section does NOT mount its own hologram canvas — the persistent corridor
  // brandmark + CorridorArmillary ARE the ambient backdrop the signal plates
  // sit on. Only the flag-off / lab path mounts the standalone canvas.
  const showServicesCanvas = useHologramCanvas && !UNIFIED_SERVICES_ARMILLARY;

  // ADR-029 card-ring mode (desktop): the corridor instrument carries the
  // four cards as orbiting WebGL planes (`ServicesCardRing`, mounted by
  // `CorridorArmillary` behind the same media gate) and the racks hide via
  // CSS (`data-card-ring`). Each card bakes its FULL C3 copy onto the
  // plane. Mobile / reduced motion never enters ring mode — the plate
  // accordion stays exactly as before regardless of the flag.
  const cardRingActive = SERVICES_CARD_RING && useHologramCanvas;

  // Step 0 is the collapsed lead-in (no plate open); steps 1..N open service
  // 0..N-1 in turn; the final step is the ADR-030 exit-hold beat (the #tools
  // cover rises over the pinned stage) — the UPPER clamp keeps the LAST
  // service active there instead of wrapping `SERVICES[N]` → undefined →
  // first service (see useServicesStageScroll STEP_COUNT = services + 2).
  // The backdrop/readout follow the plate that is (or is about to be) open.
  const setActiveByStep = useCallback((step: number) => {
    const serviceIndex = Math.min(SERVICES.length - 1, Math.max(0, step - 1));
    setActiveServiceId(SERVICES[serviceIndex].id);
    setExpandedServiceId(step <= 0 ? null : SERVICES[serviceIndex].id);
  }, []);

  // Click-to-scroll (proven ServiceScanInterface behavior): scroll owns the
  // open plate (the scroll hook maps runway progress → step), so a seed click
  // navigates the PAGE to the middle of that service's scroll segment instead
  // of forcing local state that the next scroll tick would overwrite. When the
  // runway has no travel (mobile / reduced-motion — the CSS drops the pin),
  // fall back to setting the state directly so taps still open seeds.
  const selectService = useCallback((serviceId: ServiceId) => {
    const index = SERVICES.findIndex((service) => service.id === serviceId);
    if (index < 0) return;
    // Inert layouts (mobile / reduced motion): the stage is a static stacked
    // accordion and the scroll hook parks the step, so a tap must set the open
    // plate directly — scrolling would do nothing (and the stacked content can
    // still give the runway rect > 100vh, so the travel check alone is not a
    // reliable gate; mirror useServicesStageScroll's isInert()).
    const inert =
      (window.matchMedia?.("(max-width: 960px)").matches ?? false) ||
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    const runway = stageRef.current?.parentElement; // .services-stage-root
    // Beat-target math is shared with the cartridge dock's seated buttons
    // (ADR-046) via `servicesBeatScrollTarget` — service i opens on step
    // i+1 of the 6-beat runway; aim for the middle of its beat. `null`
    // covers the unmeasurable / no-travel cases alongside the inert gate.
    const targetY = inert || !runway ? null : servicesBeatScrollTarget(index, runway);
    if (targetY === null) {
      setActiveServiceId(serviceId);
      setExpandedServiceId(serviceId);
      return;
    }
    if (SERVICES_CARD_RING) {
      // Ring mode: the runway scroll owns the ring rotation, so the snap
      // rides an explicit smootherstep tween — the ring's speed ramp IS
      // this tween. The browser's native smooth scroll was both abrupt and
      // occasionally dropped mid-gesture (ADR-029 Update 5).
      startRingScrollTween(targetY);
    } else {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  }, []);

  // Reads the corridor-exit dissipate → publishes `--svc-content-in` (cluster
  // entrance) + `--svc-arrive` on the stage, and maps the runway scroll to
  // `data-active-step` — the step that owns which plate is open.
  useServicesStageScroll(stageRef, setActiveByStep);

  // Ring rotation is NATIVE-SCROLL-OWNED (2026-07-15 pass): the wheel-snap
  // hijack is retired so scrubbing over the cards reads as continuous
  // scroll and scrolling in the dead space around them advances the runway
  // normally. `useServicesStageScroll` (above) maps runway scroll → the
  // ring spring; the tightened follower (ringMath) tracks it crisply.
  // Clicking a side card still glides it to front via `selectService`
  // (the ringScrollTween — an explicit programmatic scroll, unchanged).

  return (
    <div
      className="services-stage"
      ref={stageRef}
      data-active-step="0"
      data-card-ring={SERVICES_CARD_RING ? "on" : "off"}
    >
      <div className="services-stage__items">
        {/* Section masthead (ADR-044): title left / intro right in the upper
            band. Ring-mode only (the flag-off racks own the upper corners);
            FIRST in DOM so the mobile/PRM accordion flow puts it above the
            plates for free — on desktop it is absolutely positioned. */}
        {SERVICES_CARD_RING && <ServicesMasthead />}

        {showServicesCanvas ? <ServicesHologramCanvas activeServiceId={activeServiceId} /> : null}

        {/* Designation layer sits under the plate cluster so an open plate
            always paints on top of a stray callout that lands near a
            rack edge (rare, but possible on narrow desktops). Hidden on
            mobile / reduced motion via CSS + a JS gate in the layer. */}
        <ServicesDesignationLayer fallbackActiveServiceId={activeServiceId} />

        {/* Kept mounted in ring mode: below 961px the accordion IS the
            services UI (CSS owns visibility via data-card-ring). Leader
            lines retire with the racks when the ring carries the cards. */}
        <ServicesPlateCluster
          activeServiceId={activeServiceId}
          expandedServiceId={expandedServiceId}
          onSelectService={selectService}
          plateVariant="wireframe"
          showConnectors={!SERVICES_CARD_RING}
        />

        {/* Click targets over the orbiting cards (rects published by
            ServicesCardRing): side/back cards scroll the runway to their
            beat, the front card exposes its baked CTA as a real link.
            The cards carry ALL their copy on the baked face — one plate,
            exactly like the open C3 card (2026-07-10 Vince red-alert:
            never split the card into a photo plane + a text console). */}
        {cardRingActive && <ServicesRingHitAreas onSelectService={selectService} />}

        {/* Station readout — the mono row along the bottom of the stage
            that ties the racks + designation layer into one instrument. */}
        <ServicesStationReadout activeServiceId={activeServiceId} />
      </div>
    </div>
  );
}
