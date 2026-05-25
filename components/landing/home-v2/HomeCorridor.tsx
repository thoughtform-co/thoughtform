"use client";

import { useEffect, useRef, useState } from "react";
import type { V7CorridorText } from "@/lib/v7-parse";
import { probeWebGL } from "@/lib/webgl/probe";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { CopyAnchors } from "./CopyAnchors";
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
 *   2. WebGL / reduced-motion / `<760px` viewport probe that decides
 *      between the corridor (R3F) and the static text fallback.
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
  const [smallViewport, setSmallViewport] = useState(false);

  useDepthScroll(stageRef);

  useEffect(() => {
    setWebglOK(probeWebGL());
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    const syncViewport = () => setSmallViewport(window.innerWidth < 760);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("resize", syncViewport);
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
    apply(initial.active || initial.armed);

    const unsubscribe = useDepthGatewayStore.subscribe((state) => {
      apply(state.transform.active || state.transform.armed);
    });

    return () => {
      unsubscribe();
      if (prev === null) html.removeAttribute("data-brandmark-mode");
      else html.setAttribute("data-brandmark-mode", prev);
    };
  }, []);

  const fallback = webglOK === false || reducedMotion || smallViewport;

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
            <DepthGatewayScene />
          </div>
        )}

        {/* Copy + label overlay — DOM text positioned by
            `useWorldDomTracker` (mounted inside `CopyAnchors`). */}
        {!fallback && <CopyAnchors text={text} />}

        {/* Projected brandmark — lives inside the sticky stage so
            armed prepaint is clipped to the incoming Thoughtform
            section instead of floating over the hero. */}
        {!fallback && <ProjectedBrandmarkActor />}

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

/** Simple stacked-text fallback — paints the corridor copy in plain
 *  flow when WebGL or motion is unavailable. */
function FallbackCorridor({ text }: { text: V7CorridorText }) {
  return (
    <div className="home-v2-fallback-text">
      <section>
        <p className="home-v2-fallback-text__bridge">{text.thoughtform.bridge}</p>
        <h2 dangerouslySetInnerHTML={{ __html: text.thoughtform.titleHtml }} />
        <p dangerouslySetInnerHTML={{ __html: text.thoughtform.body1Html }} />
        <p dangerouslySetInnerHTML={{ __html: text.thoughtform.body2Html }} />
      </section>
      <section>
        <h2 dangerouslySetInnerHTML={{ __html: text.diagnostic.titleHtml }} />
        <p>{text.diagnostic.bridge}</p>
        <ul>
          {text.diagnostic.labels.map((label) => (
            <li key={label.id}>
              <span>{label.n}</span> {label.tag}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 dangerouslySetInnerHTML={{ __html: text.intelligence.titleHtml }} />
        <p dangerouslySetInnerHTML={{ __html: text.intelligence.ledeHtml }} />
        <p>
          {text.intelligence.leftLabel} · {text.intelligence.rightLabel}
        </p>
      </section>
    </div>
  );
}
