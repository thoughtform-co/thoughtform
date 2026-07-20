"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";

import { CorridorSectionMenu } from "@/components/landing/home-v2/CorridorSectionMenu";
import { ServicesMasthead } from "@/components/landing/home-v2/services/ServicesMasthead";
import { ServicesRailRegisterPortal } from "@/components/landing/home-v2/services/ServicesRailRegister";
import { ServicesRingHitAreas } from "@/components/landing/home-v2/services/ServicesRingHitAreas";
import type { ServiceId } from "@/components/landing/home-v2/services/serviceData";

/**
 * ServicesFrame — the VERBATIM #services snapshot.
 *
 * Everything here is the real production surface, parked at its end-state:
 *   · the parse-injected HUD chrome (rails, 13-tick ladders, "2"/"5" majors,
 *     corner brackets, wordmark) via `hudHtml`;
 *   · the real `ServicesMasthead` inside a hand-built `.services-stage`;
 *   · the real `CorridorSectionMenu` (both reels — left sections, right
 *     service verbs), lit by the `html[data-active-station]` bus the shell
 *     writes;
 *   · optionally the real `ServicesRailRegister` (SOURCE BUS · 04) portalled
 *     into the injected HUD's `[data-tools-rail-root]` slot.
 *
 * TWO deliberate departures from production, both to keep the study honest:
 *
 * 1. `.sal-stationbox` reproduces the `.stations` content box
 *    (`padding: 0 var(--hud-content-inset)`, landing.css). The masthead's
 *    columns resolve `--masthead-inset: var(--rail-inset)` — which is
 *    defined as `--band-margin − --hud-content-inset` (landing.css :root) —
 *    against the STATION CONTENT BOX, so without this padding the text edges
 *    land a full `--hud-content-inset` too far outboard and the whole
 *    anchoring judgement is made against the wrong geometry. See the ADR-048
 *    note in services.css.
 *
 * 2. We mount `ServicesMasthead` directly rather than the whole
 *    `ServicesStage`. The stage drags in `useServicesStageScroll` (which
 *    needs the 500svh runway and the corridor-exit dissipate clock), the
 *    plate cluster, the designation layer and the ring hit areas — none of
 *    which serve a parked masthead study. The masthead is fully faithful
 *    standalone: its CSS selectors are bare classes (no `#services`
 *    ancestor), and its arrival clock FAILS OPEN to 1 when `--svc-content-in`
 *    is missing, so it paints the full text silently on first sync.
 */

/** Parked envelopes — the masthead's end-state. MODULE CONSTANT on purpose:
 *  a fresh object literal each render would make React re-apply the style
 *  attribute and clobber the imperative `--svc-content-in` writes the replay
 *  does (the masthead's MutationObserver watches exactly that property). */
const STAGE_STYLE = {
  "--svc-content-in": "1",
  "--svc-exit": "0",
  "--svc-arrive": "1",
  "--svc-arrive-op": "1",
} as CSSProperties;

interface ServicesFrameProps {
  hudHtml: string;
  showRegister: boolean;
  /** Receives the replay trigger so the console can re-run the reveal. */
  onReplayReady: (replay: () => void) => void;
  /** Side-card click → park that service (production scrolls the runway;
   *  the lab writes the ring progress instead). */
  onSelectService: (serviceId: ServiceId) => void;
}

export function ServicesFrame({
  hudHtml,
  showRegister,
  onReplayReady,
  onSelectService,
}: ServicesFrameProps) {
  const hudRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  /**
   * Replay the masthead reveal by re-driving its arrival clock: drop below
   * REARM_BELOW (0.05) to re-arm, then cross REVEAL_AT (0.2) to fire. Both
   * are inline-style writes, which is exactly what the masthead's
   * MutationObserver listens for. Spaced by a TIMEOUT, not rAF: the two
   * writes must land as separate mutation records (synchronous writes to the
   * same property coalesce), and rAF is throttled to a standstill in hidden
   * documents (the headed-verification pane quirk) — a rAF-spaced replay
   * triggered while hidden strands the masthead blanked-and-armed.
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
      {/* ── Void bed (the corridor canvas is opaque in production; here the
             ring canvas floats over this) ── */}
      <div className="sal-scene" aria-hidden="true" />

      {/* ── Real v7 HUD chrome — rails, ticks, brackets, wordmark ── */}
      <div
        ref={hudRef}
        className="sal__hud home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      {/* ── Station content box → parked stage → real masthead + hits ── */}
      <div className="sal-stationbox">
        <div ref={stageRef} className="services-stage" data-card-ring="on" style={STAGE_STYLE}>
          <div className="services-stage__items">
            <ServicesMasthead />
            {/* Real production hit targets over the WebGL cards — the ring
                publishes per-card screen rects (publishAnchors) and this
                layer rebases them into its own box, exactly as in
                production. Doubles as the lab's measurement instrument: the
                hit rects ARE the projected card geometry, which is how the
                backdrop camera got calibrated against the live corridor. */}
            <ServicesRingHitAreas onSelectService={onSelectService} />
          </div>
        </div>
      </div>

      {/* Real journey menus — no props; visibility is pure CSS off the
          `html[data-active-station="services"]` bus the shell writes. */}
      <CorridorSectionMenu />

      {/* Real right-rail register, portalled into the injected HUD's
          `[data-tools-rail-root]` slot (the legacy ADR-033 name). Toggled so
          the V1 rail caps can be judged against — or without — it. */}
      {showRegister && <ServicesRailRegisterPortal containerRef={hudRef} />}
    </>
  );
}
