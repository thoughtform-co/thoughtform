"use client";

import { useEffect, useRef } from "react";
import { epilogueBand, dissipateBand } from "@/lib/home-v2/epilogueTimeline";
import { readCorridorDissipate } from "@/lib/home-v2/corridorDissipateRef";
import {
  SIGNAL_FRAME_WINDOW,
  SIGNAL_KILL_VH,
  SIGNAL_LABEL_WINDOW,
  SIGNAL_TITLE_WINDOW,
  cardTopForEnter,
  signalHandoffT,
  windowT,
} from "@/lib/home-v2/signalHandoff";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedEpilogueProgress } from "./DepthGatewayScene/motionFollower";
import {
  measureDecodeLayer,
  mountDecodeLayer,
  setDecodeLayerLive,
  unmountDecodeLayer,
  writeDecodeRun,
  type DecodeLayer,
  type DecodeRunSpec,
} from "./decodeLayer";

/** The phone pile's first slot — present only where the pile is split, which
 *  is exactly where its slots are sticky and its hook publishes `--pc-enter`
 *  (`PROOF_STACK_SPLIT_MEDIA`). */
const FIRST_CARD = "#services .pf-stack--split [data-pc-slot]";

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
 *
 * ⚠ AND WHERE THE PHONE PILE IS SPLIT, ITS EXIT IS THE FIRST CARD'S (ADR-116).
 * Owner, 2026-09-21: the block "disappears a bit too quickly, resulting in a
 * bit of a void on top … stay a bit longer and disappear in sync with the
 * cards of the proof section". Measured at 390×844 it was gone with
 * #services' top still 1.25 viewports BELOW the fold — the CSS belt was keyed
 * on `data-corridor-exit`, which ADR-108 made live on phones at DOCK ENGAGE —
 * and even without the belt it lifted off from the moment #services entered
 * and was cut at 45 % with the first card still low on the screen. On that
 * rung it now HOLDS its seat (no lift, no `SIGNAL_OUT`) and UN-TYPES in place
 * on the card's own clock (`signalHandoff.ts`): whole until the card has
 * risen into view, gone as the card's top reaches the block's bottom edge.
 * The masthead law — never move, never fade, the type effect both ways — and
 * the house decode (`decodeLayer`, ADR-115), reversible on the way back up.
 * The kill is the CARD's rect crossing `SIGNAL_KILL_VH`, observed; the
 * corridor path below is untouched wherever there is no split pile.
 */
export function MobileEpilogueSignal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let lastOpacity = -1;
    let lastLiftPx = -1;

    /* ── The hand-off (ADR-116) ──────────────────────────────────────────
       The first card is resolved LAZILY: #services is a nested root that
       mounts after this effect, and the pile REMOUNTS when its media flips
       (`ServicesStage`'s key), so a slot found once can be a stale node. */
    let card: HTMLElement | null = null;
    let cardPin = 0;
    let cardKill: IntersectionObserver | null = null;
    let cardKilled = false;
    let blockBottom = Number.NaN;
    let layer: DecodeLayer | null = null;
    let measured = false;
    let lastU = -1;
    let lastFrame = -1;
    const title = el.querySelector<HTMLElement>(".home-v2-mobile-signal__title");
    const label = el.querySelector<HTMLElement>(".home-v2-mobile-signal__cta-label");
    const specs: DecodeRunSpec[] = [];
    if (title) specs.push({ el: title, mode: "scramble" });
    if (label) specs.push({ el: label, mode: "scramble" });

    const resolveCard = (): HTMLElement | null => {
      if (card?.isConnected) return card;
      cardKill?.disconnect();
      cardKill = null;
      cardKilled = false;
      card = document.querySelector<HTMLElement>(FIRST_CARD);
      if (!card) return null;
      cardPin = Number.parseFloat(getComputedStyle(card).top) || 0;
      /* ⚠ A HUGE TOP MARGIN, SO "INTERSECTING" MEANS "THE CARD'S TOP IS ABOVE
         THE LINE" — including once the pile has scrolled away above the
         viewport. Without it both of those states are non-intersecting, and
         a jump from past the pile back to the corridor (the drawer, a hash)
         would cross neither edge: no callback, the flag stuck on, the
         epilogue dead on the reader's return. */
      cardKill = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (entry) cardKilled = entry.isIntersecting;
        },
        { rootMargin: `100000px 0px -${(1 - SIGNAL_KILL_VH) * 100}% 0px`, threshold: 0 }
      );
      cardKill.observe(card);
      return card;
    };

    /* The block's own bottom edge, measured — never per frame. It does not
       move on this path (no lift), so it changes only with the viewport and
       the fonts, which is when this runs again. */
    const measureLeaves = () => {
      if (!layer) return;
      measureDecodeLayer(layer, el, specs, "home-v2-mobile-signal__decode__line");
      measured = true;
    };
    const remeasure = () => {
      measured = false;
      blockBottom = Number.NaN;
      lastU = -1; // the next frame re-poses the leaves even if `u` has not moved
      if (card?.isConnected) cardPin = Number.parseFloat(getComputedStyle(card).top) || 0;
    };
    window.addEventListener("resize", remeasure, { passive: true });
    void document.fonts?.ready.then(remeasure);

    /* One write per change of `u`: the stamp that hides the real text, the
       leaves over it, and the button's frame closing centre-out over what its
       label left. The stamp mirrors `ServicesMasthead`'s phone branch —
       absent · `live` · `gone`. */
    const writeHandoff = (u: number) => {
      if (u === lastU) return;
      lastU = u;
      const live = u > 0 && u < 1;
      if (live && !layer) layer = mountDecodeLayer(el, "home-v2-mobile-signal__decode");
      if (live && !measured) measureLeaves();
      if (layer) {
        layer.runs.forEach((run) => {
          const w = run.spec.el === label ? SIGNAL_LABEL_WINDOW : SIGNAL_TITLE_WINDOW;
          writeDecodeRun(run, windowT(u, w), "out", live);
        });
        setDecodeLayerLive(layer, live);
      }
      const frame = windowT(u, SIGNAL_FRAME_WINDOW);
      if (Math.abs(frame - lastFrame) > 0.002) {
        lastFrame = frame;
        el.style.setProperty("--sig-frame", frame.toFixed(3));
      }
      const state = u <= 0 ? null : u >= 1 ? "gone" : "live";
      if (state) el.setAttribute("data-untype", state);
      else el.removeAttribute("data-untype");
    };
    const clearHandoff = () => {
      if (lastU === -1 && !el.hasAttribute("data-untype")) return;
      lastU = -1;
      lastFrame = -1;
      if (layer) setDecodeLayerLive(layer, false);
      el.removeAttribute("data-untype");
      el.style.removeProperty("--sig-frame");
    };

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
      const vhNow = typeof window !== "undefined" ? layoutViewportHeight() : 1;

      /* ADR-116: where the first proof card publishes its entrance, the block
         leaves on THAT clock and nothing else. NaN — no split pile, or its
         hook has not written yet — is the corridor path below, unchanged. */
      const first = shouldShow || cardKilled ? resolveCard() : card;
      const enter = first ? Number.parseFloat(first.style.getPropertyValue("--pc-enter")) : NaN;
      const handoff = Number.isFinite(enter);

      let opacity: number;
      let liftPx: number;
      let dead: boolean;
      if (handoff) {
        if (!Number.isFinite(blockBottom)) {
          // Measured at its seat: the corridor path may have left a lift on it.
          el.style.transform = "translate3d(-50%, 0px, 0)";
          lastLiftPx = 0;
          blockBottom = el.getBoundingClientRect().bottom;
        }
        const u = signalHandoffT(cardTopForEnter(enter, vhNow, cardPin), blockBottom, vhNow);
        dead = cardKilled;
        // It HOLDS its seat and leaves by un-typing: no lift, no SIGNAL_OUT.
        // The one opacity step is at `u = 1`, where nothing is left to paint.
        opacity = dead || !shouldShow || u >= 1 ? 0 : titleIn;
        liftPx = 0;
        writeHandoff(dead ? 1 : u);
      } else {
        // `killed` short-circuits the whole corridor computation — see the
        // observer above. It is a FAIL-SAFE, so it is a multiplication by
        // zero rather than another band to blend.
        dead = killed;
        opacity = killed ? 0 : shouldShow ? titleIn * (1 - titleOut) : 0;
        // Match the desktop signal's exit lift so the mobile block also
        // scrolls up with the dissipating sphere instead of just fading
        // in place.
        liftPx = -exitDissipate * vhNow;
        clearHandoff();
      }

      if (Math.abs(opacity - lastOpacity) > 0.002) {
        lastOpacity = opacity;
        el.style.opacity = opacity.toFixed(3);
      }
      if (Math.abs(liftPx - lastLiftPx) > 0.5) {
        lastLiftPx = liftPx;
        el.style.transform = `translate3d(-50%, ${liftPx.toFixed(1)}px, 0)`;
      }
      // Toggle interactivity so the CTA only accepts taps when it is
      // actually visible. The kill is checked explicitly rather than
      // inferred from `opacity === 0`: the attribute is what the guard
      // spec asserts, and it must not depend on the opacity write above
      // having cleared its own delta threshold first. On the hand-off a
      // button whose frame has started closing takes no taps either.
      const leaving = handoff && el.hasAttribute("data-untype");
      if (!dead && !leaving && opacity >= 0.6) el.removeAttribute("inert");
      else el.setAttribute("inert", "");

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      kill?.disconnect();
      cardKill?.disconnect();
      window.removeEventListener("resize", remeasure);
      unmountDecodeLayer(layer);
      el.removeAttribute("data-untype");
      el.style.removeProperty("--sig-frame");
    };
  }, []);

  return (
    <div
      ref={ref}
      className="home-v2-mobile-signal"
      role="region"
      aria-label="AI capability your team owns"
      aria-hidden="false"
    >
      {/* ⚠ KEEP IN LOCKSTEP WITH `SIGNAL_CONTENT.titleHtml`
          (CorridorStationHeaders) — same beat, two surfaces, and the full
          reasoning for this copy lives there. In short: the title is the
          CAPABILITY in the services masthead's own words (owner,
          2026-09-14), the race demoted to the ticker that was already its
          evidence, and the word "self-sufficient" is banned in copy — say
          the behaviour. The aria-label above is the third thing to move. */}
      {/* ⚠ NO AUTHORED `<br>` HERE — the one place this surface may diverge
          from the desktop string, for fit rather than copy: the desktop's
          two authored lines are set against a phone-width box, and the GOLD
          `<em>` marks the break the line break does on desktop. (The
          previous title bound its compound noun with an NBSP; this one has
          none.) */}
      <h2 className="home-v2-mobile-signal__title">
        AI CAPABILITY <em>YOUR TEAM OWNS.</em>
      </h2>
      <div className="home-v2-mobile-signal__actions">
        {/* `#services`, not `#contact` — see the note beside the desktop
            CTA: this is a move now, not the beat's argument, and the label
            names where it lands (the proof). The note that followed it is
            deleted (owner, 2026-09-14); the label reads HOW IT LOOKS IN
            PRACTICE since 2026-09-21 (owner). */}
        <a className="home-v2-mobile-signal__cta" href="#services">
          <span className="home-v2-mobile-signal__cta-label">HOW IT LOOKS IN PRACTICE</span>
          <span className="home-v2-mobile-signal__cta-chevrons" aria-hidden="true">
            <span className="home-v2-mobile-signal__cta-chev" />
            <span className="home-v2-mobile-signal__cta-chev" />
            <span className="home-v2-mobile-signal__cta-chev" />
          </span>
        </a>
      </div>
    </div>
  );
}
