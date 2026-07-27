"use client";

import { useEffect, useRef } from "react";
import { epilogueBand, dissipateBand } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedEpilogueProgress } from "./DepthGatewayScene/motionFollower";

/**
 * MobileEpilogueSignal — the epilogue "EVERYONE IS RACING TO BUILD THIS
 * CAPABILITY." title + "WE HELP YOU OWN YOURS" CTA on the mobile
 * corridor composition (ADR-018 mobile epilogue fix, 2026-07-15).
 *
 * On desktop this content lives inside `CorridorStationHeaders` (the
 * 2D header layer) with typewriter animation, a ticker, and the
 * planet-limb arc. That whole layer is `display: none` at ≤760px so
 * the world-anchored `StationTitle` straddle can own the portrait
 * composition — but that also stripped the epilogue title and CTA
 * out of the mobile page, and the mobile-anchored Build title had
 * no BUILD_OUT fade, so users only ever saw "BUILD ON THE LAYER."
 * through the epilogue.
 *
 * This component is the mobile equivalent: a small viewport-fixed
 * block that fades in on `TITLE_IN` (once Build has cleared via the
 * matching `BUILD_OUT` drain on the world-anchored intelligence
 * title/support, see `gateMobileBuildTitle` in `sceneGeom.ts`), then
 * fades out on the same `SIGNAL_OUT` dissipate band the desktop
 * signal uses. No typewriter, no ticker arc, no planet-limb math —
 * just the title + CTA + note, centred, with the same wording so
 * the mobile visitor lands on the same closing chord.
 *
 * Rendered only on the mobile branch of `CopyAnchors` (see
 * `CopyAnchors.tsx`); desktop keeps the full-fidelity block inside
 * `CorridorStationHeaders`.
 */
export function MobileEpilogueSignal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let lastOpacity = -1;
    let lastLiftPx = -1;

    const tick = () => {
      const t = useDepthGatewayStore.getState().transform;
      const { docked, active, armed, epilogueProgress } = t;
      const inEpilogue = epilogueProgress > 0.001;
      const engaged = active || armed;

      // Read the SMOOTHED epilogue scrub — same channel the desktop
      // signal reads so both surfaces stay in lock-step across the
      // epilogue climax + dock lift.
      const ep = getSmoothedEpilogueProgress();
      const titleIn = epilogueBand(ep, "TITLE_IN");
      const dissipateStr =
        typeof document !== "undefined"
          ? document.documentElement.style.getPropertyValue("--corridor-dissipate")
          : "";
      const exitDissipate = dissipateStr ? parseFloat(dissipateStr) || 0 : 0;
      const titleOut = dissipateBand(exitDissipate, "SIGNAL_OUT");

      // Visible while the corridor is engaged inside the epilogue
      // (title fades in on TITLE_IN) OR while the dock is holding the
      // sphere for the corridor-exit dissipate (fades out on SIGNAL_OUT).
      const shouldShow = docked || (engaged && inEpilogue);
      const opacity = shouldShow ? titleIn * (1 - titleOut) : 0;

      // Match the desktop signal's exit lift so the mobile block also
      // scrolls up with the dissipating sphere instead of just fading
      // in place.
      const vhNow = typeof window !== "undefined" ? window.innerHeight || 1 : 1;
      const liftPx = -exitDissipate * vhNow;

      if (Math.abs(opacity - lastOpacity) > 0.002) {
        lastOpacity = opacity;
        el.style.opacity = opacity.toFixed(3);
      }
      if (Math.abs(liftPx - lastLiftPx) > 0.5) {
        lastLiftPx = liftPx;
        el.style.transform = `translate3d(-50%, ${liftPx.toFixed(1)}px, 0)`;
      }
      // Toggle interactivity so the CTA only accepts taps when it is
      // actually visible.
      if (opacity >= 0.6) el.removeAttribute("inert");
      else el.setAttribute("inert", "");

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="home-v2-mobile-signal"
      role="region"
      aria-label="Everyone is racing to build this capability"
      aria-hidden="false"
    >
      {/* Keep in lockstep with SIGNAL_CONTENT.titleHtml
          (CorridorStationHeaders) — same beat, two surfaces. The title's
          BUILD and the CTA's OWN below are a deliberate inversion; move
          them together. */}
      <h2 className="home-v2-mobile-signal__title">
        EVERYONE IS RACING TO
        <br />
        <em>BUILD THIS CAPABILITY.</em>
      </h2>
      <div className="home-v2-mobile-signal__actions">
        <a className="home-v2-mobile-signal__cta" href="#contact">
          <span className="home-v2-mobile-signal__cta-label">WE HELP YOU OWN YOURS</span>
          <span className="home-v2-mobile-signal__cta-chevrons" aria-hidden="true">
            <span className="home-v2-mobile-signal__cta-chev" />
            <span className="home-v2-mobile-signal__cta-chev" />
            <span className="home-v2-mobile-signal__cta-chev" />
          </span>
        </a>
        <p className="home-v2-mobile-signal__note">Before the labs sell it back to you.</p>
      </div>
    </div>
  );
}
