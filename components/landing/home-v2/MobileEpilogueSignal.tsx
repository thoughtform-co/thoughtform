"use client";

import { useEffect, useRef } from "react";
import { epilogueBand, dissipateBand } from "@/lib/home-v2/epilogueTimeline";
import { readCorridorDissipate } from "@/lib/home-v2/corridorDissipateRef";
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
 *
 * ⚠ IT IS `position: fixed`, SO ITS EXIT IS A CLAIM ABOUT THE WHOLE
 * DOCUMENT, NOT ABOUT THE CORRIDOR. Every input to `opacity` above is a
 * corridor channel, and `readCorridorDissipate(0)` — the one that fades it
 * out — DEFAULTS TO 0 when the module ref is absent, i.e. "the exit has not
 * started". That default is correct on the corridor and catastrophic after
 * it: a phone whose exit clock never armed (no WebGL, a dropped GL context,
 * the quality governor standing the corridor down, a resize that remounted
 * the hook) holds `titleOut` at 0 for the rest of the page, and the signal
 * strands itself over #services — the epilogue's closing line printed over
 * the offer. So the kill condition is checked against an OBSERVABLE the
 * corridor cannot lie about: where #services actually is on screen.
 */
export function MobileEpilogueSignal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let lastOpacity = -1;
    let lastLiftPx = -1;

    /* ── The fail-safe (2026-09-01) ─────────────────────────────────
       `killed` is written ONLY by the observer below and read by the
       frame loop; it is the one new input and it costs no per-frame
       layout read (an IntersectionObserver reports from the compositor,
       `getBoundingClientRect` in `tick` would be a forced reflow at
       60 Hz on the phone the corridor is already taxing).

       rootMargin `0px 0px -55% 0px` shrinks the root's BOTTOM edge up to
       45 % of the viewport, so the band is [0, 0.45·vh] and
       `isIntersecting` is exactly "#services' top has crossed 45 % of the
       viewport" — the beat where the offer owns the screen. Reversible in
       both directions by construction: scrolling back up drops #services'
       top below the band and the observer clears the flag, and scrolling
       clean past #services takes its bottom above the band and clears it
       too (by then `shouldShow` is false on its own — the belt in
       home-v2.css, `html[data-corridor-exit="true"]`, covers the seam). */
    let killed = false;
    const services = document.getElementById("services");
    const kill = services
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1];
            if (entry) killed = entry.isIntersecting;
          },
          { rootMargin: "0px 0px -55% 0px", threshold: 0 }
        )
      : null;
    kill?.observe(services!);

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
      // Module-ref transport since 2026-07-29 (same read the desktop
      // signal takes); absent ⇒ 0, the "exit not started" default.
      const exitDissipate = readCorridorDissipate(0);
      const titleOut = dissipateBand(exitDissipate, "SIGNAL_OUT");

      // Visible while the corridor is engaged inside the epilogue
      // (title fades in on TITLE_IN) OR while the dock is holding the
      // sphere for the corridor-exit dissipate (fades out on SIGNAL_OUT).
      const shouldShow = docked || (engaged && inEpilogue);
      // `killed` short-circuits the whole corridor computation — see the
      // observer above. It is a FAIL-SAFE, so it is a multiplication by
      // zero rather than another band to blend.
      const opacity = killed ? 0 : shouldShow ? titleIn * (1 - titleOut) : 0;

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
      // actually visible. `killed` is checked explicitly rather than
      // inferred from `opacity === 0`: the attribute is what the guard
      // spec asserts, and it must not depend on the opacity write above
      // having cleared its own delta threshold first.
      if (!killed && opacity >= 0.6) el.removeAttribute("inert");
      else el.setAttribute("inert", "");

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      kill?.disconnect();
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
