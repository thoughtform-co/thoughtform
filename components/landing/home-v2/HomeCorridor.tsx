"use client";

import { useEffect, useRef, useState } from "react";
import type { V7CorridorText } from "@/lib/v7-parse";
import { probeWebGL } from "@/lib/webgl/probe";
import { corridorCapable } from "@/lib/hooks/useDeviceTier";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { stationById } from "@/lib/home-v2/corridorMap";
import { CopyAnchors } from "./CopyAnchors";
// ADR-021 amendment (2026-06-19): CorridorSeamPixelField is RETIRED on
// the production path. `#services` is now a content section (Keynote /
// Workshop / Embedded terminal cards), not a brandmark runway, and the
// brandmark fades out with the dissipating sphere instead of dissolving
// into a pixel field inside the section. The component file remains in
// the tree as a reusable reference for any future "particle dissolve at
// a section seam" composition.
import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { prefetchCaseCardImages } from "./arc-cases";
import { CorridorStationHeaders } from "./CorridorStationHeaders";
import { DepthGatewayScene } from "./DepthGatewayScene";
import { useDepthScroll } from "./hooks/useDepthScroll";
import { ProjectedBrandmarkActor } from "./ProjectedBrandmarkActor";

interface HomeCorridorProps {
  /** Structured corridor copy extracted from the v7 prototype HTML
   *  via `extractV7Text()`. */
  text: V7CorridorText;
  /** Whether to render the debug `StageHud` readout. Defaults to
   *  `true` for /test/home-v2 (where it's a development aid) and is
   *  set to `false` on production so the live homepage doesn't
   *  paint progress numbers in the corner. */
  debug?: boolean;
}

/**
 * HomeCorridor — the world-owned 3D depth corridor stage (ADR-018).
 *
 * Renders just the 460svh sticky scrub stage: the R3F canvas hosting
 * all four world-rigid gate groups (Thoughtform compass, Diagnostic
 * orbits, Interstitial waypoint, Intelligence sphere), the DOM copy
 * overlay positioned per-frame by `useWorldDomTracker`, and the
 * perspective-correct projected brandmark actor.
 *
 * Owns three lifecycle concerns:
 *
 *   1. `useDepthScroll(stageRef)` — per-frame scroll watcher that
 *      writes the depth-store transform + v7 HUD readouts.
 *   2. WebGL / reduced-motion / device-capability probe that decides
 *      between the corridor (R3F) and the static text fallback. Capable
 *      phones run the corridor; only no-WebGL, reduced-motion, or
 *      genuinely low-end devices get the static fallback
 *      (`corridorCapable()`, ADR-018 mobile revision).
 *   3. `data-brandmark-mode="off"` lifecycle so the global v7
 *      brandmark canvas (if mounted on the same route) doesn't
 *      paint over the corridor.
 *
 * Does NOT render the hero or any tail. Both the `/test/home-v2`
 * test route (`HomeV2Page`) and the production home page wire
 * surrounding context (hero, post-corridor sections) themselves.
 */
export function HomeCorridor({ text, debug = true }: HomeCorridorProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [webglOK, setWebglOK] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Corridor capability replaces the old blanket `innerWidth < 760`
  // phone block (ADR-018 mobile revision): capable phones now run the
  // real 3D corridor; only no-WebGL / genuinely low-end devices fall
  // back. Capability is effectively static for the session, so unlike
  // the old viewport check it is not re-evaluated on resize.
  const [capable, setCapable] = useState<boolean | null>(null);

  useDepthScroll(stageRef);

  useEffect(() => {
    setWebglOK(probeWebGL());
    setCapable(corridorCapable());
    // Warm the case-screenshot HTTP cache at corridor entry so the
    // deferred Build-park face bake isn't a cold image burst on first arm.
    prefetchCaseCardImages(PROJECT_CASES);
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, []);

  // Suppress the global v7 brandmark canvas (if mounted on the same
  // render tree) only WHILE the corridor is the engaged owner of
  // the brandmark — armed (rising into pin) or active (pinned). On
  // /test/home-v2 there is no global painter, so this is effectively
  // a constant `"off"` (the corridor is engaged for the whole stage
  // height). On the production homepage (the corridor is portaled
  // into LandingPage between #hero and #buildQuote) we MUST hand the
  // brandmark back to the journey-driven global painter once the
  // user scrolls past the corridor into Continuum / Practice — that
  // happens by restoring the previous `data-brandmark-mode` value
  // (set to `"particle"` by `useBrandmarkJourney`) the moment
  // engagement drops to false.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute("data-brandmark-mode");

    const apply = (engaged: boolean) => {
      if (engaged) {
        html.setAttribute("data-brandmark-mode", "off");
      } else {
        // Hand the brandmark back to the global v7 painter. The
        // journey hook on the v7 LandingPage rewrites
        // `data-brandmark-mode` whenever it remounts; while we hold
        // engagement we own `"off"`, and on disengagement we revert
        // to what the journey hook had set (captured as `prev`
        // above) — `"particle"` in WebGL + animated mode, `"svg"`
        // in reduced-motion / no-WebGL fallback. On /test/home-v2
        // there is no journey hook so `prev` is `null`; in that
        // case we just remove the attribute.
        const current = html.getAttribute("data-brandmark-mode");
        if (current !== "off") return; // some other writer owns it
        if (prev !== null && prev !== "off") html.setAttribute("data-brandmark-mode", prev);
        else html.removeAttribute("data-brandmark-mode");
      }
    };

    // Apply immediately based on current engagement so the first
    // paint already matches the desired state.
    const initial = useDepthGatewayStore.getState().transform;
    apply(initial.active || initial.armed || initial.docked);

    const unsubscribe = useDepthGatewayStore.subscribe((state) => {
      apply(state.transform.active || state.transform.armed || state.transform.docked);
    });

    return () => {
      unsubscribe();
      if (prev === null) html.removeAttribute("data-brandmark-mode");
      else html.setAttribute("data-brandmark-mode", prev);
    };
  }, []);

  const fallback = webglOK === false || reducedMotion || capable === false;

  return (
    <div
      ref={stageRef}
      className="home-v2-stage"
      data-fallback={fallback ? "true" : "false"}
      aria-label="Depth corridor: Thoughtform, Diagnostic, Intelligence layer"
    >
      <div className="home-v2-stage__sticky">
        {!fallback && (
          <div className="home-v2-stage__canvas">
            {/* Boundary fallback = the boundary's built-in dark void
                plane (absolute inset-0), NOT the static-text corridor:
                swapping composition mid-scroll would violate the
                layered-composite rules (ADR-008). A crashed scene
                degrades to a dark backdrop behind the DOM copy overlay,
                which keeps reading. */}
            <CanvasErrorBoundary>
              <DepthGatewayScene />
            </CanvasErrorBoundary>
          </div>
        )}

        {/* Copy + label overlay — DOM text positioned by
            `useWorldDomTracker` (mounted inside `CopyAnchors`). */}
        {!fallback && <CopyAnchors text={text} />}

        {/* Linear-style station headers (Navigate / Encode / Build).
            Desktop-only 2D overlay rendered in viewport coordinates so
            the headers don't skew with the 3D camera or shift with
            aspect ratio. Mobile keeps the legacy world-anchored
            straddle inside `CopyAnchors`. (2026-06-08 2D pivot.) */}
        {!fallback && <CorridorStationHeaders />}
        {/* The Arc Cases pager + ✕ moved to a baked-into-the-card face with a
            transparent hit layer (`ArcCasesHitLayer`, ADR-041 addendum),
            mounted in `CopyAnchors` next to the sigil — the floating stepper
            row is retired. */}

        {/* The right-rail Arc register (`CorridorProgressRail`, "THE ARC ·
            03") is RETIRED (ADR-031 Update 12). The Navigate → Encode →
            Build subsections now live in the left-side journey overview
            (`CorridorSectionMenu`, mounted page-level in LandingPage), which
            unfolds them while the reader is inside the Arc. The component
            stays on disk for rollback, like `ServicesRailRegister`. */}

        {/* Projected brandmark — lives inside the sticky stage so
            armed prepaint is clipped to the incoming Thoughtform
            section instead of floating over the hero. */}
        {!fallback && <ProjectedBrandmarkActor />}

        {/* Seam pixel field — retired on the production path (ADR-021
            amendment, 2026-06-19). See the comment on the import. */}

        {/* Debug HUD — progress + active beat readout. */}
        {!fallback && debug && <StageHud />}

        {/* Static fallback (no WebGL / reduced motion). */}
        {fallback && (
          <div className="home-v2-stage__fallback">
            <FallbackCorridor text={text} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Tiny readout — shows progress + active beat as a debug aid. */
function StageHud() {
  const transform = useDepthGatewayStore((s) => s.transform);
  const progressPct = Math.round(transform.progress * 100);
  return (
    <div className="home-v2-stage__hud" aria-hidden="true">
      <div className="home-v2-stage__hud-progress">{String(progressPct).padStart(2, "0")}%</div>
      <div>{transform.beat}</div>
    </div>
  );
}

/** Strip a leading station ordinal ("01 · ", "02 — ", etc.) from a
 *  kicker so the static fallback reads "Navigate" / "Encode" / "Build"
 *  without the numbers — matching the numberless HUD breadcrumb. */
function stripStationIndex(kicker: string): string {
  return kicker.replace(/^\s*\d+\s*[·.\u2013\u2014-]\s*/, "");
}

/** Simple stacked-text fallback — paints the corridor copy in plain
 *  flow when WebGL or motion is unavailable. */
function FallbackCorridor({ text }: { text: V7CorridorText }) {
  // Encode + Build copy comes from the corridor map (single source);
  // the opening setup section keeps its v7 spine copy.
  const enc = stationById("diagnostic")?.content;
  const bld = stationById("intelligence")?.content;
  return (
    <div className="home-v2-fallback-text">
      <section>
        <h2 dangerouslySetInnerHTML={{ __html: text.thoughtform.titleHtml }} />
        <p dangerouslySetInnerHTML={{ __html: text.thoughtform.body1Html }} />
        <p dangerouslySetInnerHTML={{ __html: text.thoughtform.body2Html }} />
        <p dangerouslySetInnerHTML={{ __html: text.thoughtform.body3Html }} />
      </section>
      {enc && (
        <section>
          <p className="home-v2-fallback-text__bridge">{stripStationIndex(enc.kicker)}</p>
          <h2 dangerouslySetInnerHTML={{ __html: enc.titleHtml }} />
          {enc.supportHtml && <p dangerouslySetInnerHTML={{ __html: enc.supportHtml }} />}
        </section>
      )}
      {bld && (
        <section>
          <p className="home-v2-fallback-text__bridge">{stripStationIndex(bld.kicker)}</p>
          <h2 dangerouslySetInnerHTML={{ __html: bld.titleHtml }} />
          {bld.supportHtml && <p dangerouslySetInnerHTML={{ __html: bld.supportHtml }} />}
          {/* ADR-033 §5 / ADR-035: the interactive cases reveal never
              mounts on the fallback path — the four production cases
              surface as one plain text line. */}
          <p className="home-v2-fallback-text__cases">
            {PROJECT_CASES.map((projectCase) => projectCase.codename).join(" · ")}
          </p>
        </section>
      )}
    </div>
  );
}
