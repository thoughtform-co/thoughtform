"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";

import { ServicesMasthead } from "@/components/landing/home-v2/services/ServicesMasthead";
import { ServicesRingHitAreas } from "@/components/landing/home-v2/services/ServicesRingHitAreas";
import type { ServiceId } from "@/components/landing/home-v2/services/serviceData";
import type { ServicePlateId } from "@/components/landing/home-v2/services/servicePlateData";

/**
 * CardFaceFrame — the verbatim #services snapshot, forked from
 * `/test/services-anchor-lab`.
 *
 * Real production surface, parked at its end-state: the parse-injected HUD
 * chrome, the real `ServicesMasthead` inside a hand-built `.services-stage`,
 * the real `ServicesRingHitAreas` over the
 * WebGL cards. The V2 open state is IN CANVAS (the card's own drawer, from
 * `ServicesCardRing`) — this frame only carries its DOM hit shims.
 *
 * The anchor lab's two deliberate departures are inherited verbatim, and both
 * are load-bearing:
 *
 * 1. `.scfl-stationbox` reproduces the `.stations` content box
 *    (`padding: 0 var(--hud-content-inset)`). The masthead's columns resolve
 *    `--masthead-inset: var(--rail-inset)` = `--band-margin −
 *    --hud-content-inset` (ADR-048) against the STATION CONTENT BOX, so
 *    mounting full-bleed puts every text edge one inset too far outboard.
 *
 * 2. We mount `ServicesMasthead` directly rather than `ServicesStage`, which
 *    would drag in `useServicesStageScroll` (needs the 500svh runway and the
 *    corridor-exit dissipate clock) plus the plate cluster and designation
 *    layer. The masthead is faithful standalone: bare-class selectors, and its
 *    arrival clock fails OPEN to 1 when `--svc-content-in` is missing.
 */

/** Parked envelopes — the masthead's end-state. MODULE CONSTANT on purpose: a
 *  fresh object literal each render would make React re-apply the style
 *  attribute and clobber the imperative `--svc-content-in` writes the replay
 *  does (the masthead's MutationObserver watches exactly that property). */
const STAGE_STYLE = {
  "--svc-content-in": "1",
  "--svc-exit": "0",
  "--svc-arrive": "1",
  "--svc-arrive-op": "1",
} as CSSProperties;

interface CardFaceFrameProps {
  hudHtml: string;
  /** V2 only — mount the DOM spec plate and route front-card clicks into it. */
  openPlateEnabled: boolean;
  /** The service whose plate is open, or null. */
  openServiceId: ServicePlateId | null;
  onOpenService: (serviceId: ServicePlateId) => void;
  onCloseService: () => void;
  /** Side-card click → park that service (production scrolls the runway; the
   *  lab writes the ring progress instead). */
  onSelectService: (serviceId: ServiceId) => void;
  /** Receives the replay trigger so the console can re-run the reveal. */
  onReplayReady: (replay: () => void) => void;
}

export function CardFaceFrame({
  hudHtml,
  openPlateEnabled,
  openServiceId,
  onOpenService,
  onCloseService,
  onSelectService,
  onReplayReady,
}: CardFaceFrameProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  /**
   * Replay the masthead reveal by re-driving its arrival clock: drop to 0
   * (below the masthead's REARM_BELOW floor) to re-arm, then to 1 (past its
   * REVEAL_AT crossing) to fire — the endpoints, not the thresholds, so this
   * replay survives any retune of the constants. Spaced by a TIMEOUT, not
   * rAF — the two writes must land as separate mutation records (synchronous
   * writes to the same property coalesce), and rAF is throttled to a
   * standstill in hidden documents, which strands the masthead
   * blanked-and-armed during headed verification.
   */
  const replay = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--svc-content-in", "0");
    window.setTimeout(() => {
      stage.style.setProperty("--svc-content-in", "1");
    }, 60);
  }, []);

  useEffect(() => {
    onReplayReady(replay);
  }, [onReplayReady, replay]);

  return (
    <>
      {/* Void bed — the corridor canvas is opaque in production; here the ring
          canvas floats over this. */}
      <div className="scfl-scene" aria-hidden="true" />

      {/* Real v7 HUD chrome — rails, ticks, brackets, wordmark. */}
      <div
        className="scfl__hud home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      {/* Station content box → parked stage → real masthead + hits + plate. */}
      <div className="scfl-stationbox">
        <div ref={stageRef} className="services-stage" data-card-ring="on" style={STAGE_STYLE}>
          <div className="services-stage__items">
            <ServicesMasthead />
            {/* The open state itself is IN CANVAS now (ADR-050 rev 3 — the
                card's own drawer, rendered by ServicesCardRing). This layer
                only shims the interactive regions of the baked textures:
                the front card's open target, and — while the drawer is out —
                its CTA, its close control, and its screen-reader copy. */}
            <ServicesRingHitAreas
              onSelectService={onSelectService}
              // Only V2 opens a drawer; V0/V1 keep the ADR-029 CTA-box link
              // so the reference stays honest.
              onOpenFront={
                openPlateEnabled ? (id) => onOpenService(id as ServicePlateId) : undefined
              }
              onCloseDrawer={openPlateEnabled ? onCloseService : undefined}
              openServiceId={openPlateEnabled ? openServiceId : null}
            />
          </div>
        </div>
      </div>

      {/* (The journey menu that used to mount here retired with ADR-055 —
          the readout lives in the nav corner now, which this lab does not
          reproduce. It was ambient chrome parity, never part of what this
          study measures.) */}
    </>
  );
}
