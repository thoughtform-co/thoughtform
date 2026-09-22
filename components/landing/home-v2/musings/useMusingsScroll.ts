"use client";

import { useEffect, useRef, useState } from "react";

import { clamp01 } from "@/lib/math";
import { rackClock, rackIndex, rackPose, wrapDistance } from "@/lib/musings/rackMath";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";

/**
 * The musings station's ONE scroll writer (ADR-119).
 *
 * It owns everything that moves in this beat, and it publishes two kinds of
 * thing: the rack's per-card pose, assigned straight onto the elements, and
 * two attributes — `data-mu-ready` on the station and **`data-ft-reveal` on
 * `<html>`**, which is what arms the footer's held bed (ADR-105 U3).
 *
 * ⚠ **IT RENDERS NOTHING PER FRAME.** The drawing this rack is lifted from
 * (`latent-cases/useLatentCaseScroll.ts`) calls `setState` inside its rAF on
 * every scroll event — a React re-render across every card, every frame, on a
 * page that is running a WebGL corridor two stations up. ADR-002's law is one
 * writer publishing CSS custom properties; the only React state here is the
 * front card's index, which changes at a DETENT — a handful of times across
 * the whole station.
 *
 * ⚠ **IT IS A PURE FUNCTION OF ONE RECT, SO SCROLLING BACK UNWINDS EXACTLY**
 * (ADR-021, the motion-sickness ruling). No clock, no latch, no easing state.
 *
 * ⚠ **IT READS THE LAYOUT VIEWPORT, NOT `innerHeight`** (ADR-113): the
 * runway is authored in `svh`, and on iOS `innerHeight` follows the toolbar —
 * a clock dividing one by the other moves while the thumb is still.
 */

/**
 * The rung the 3D rack draws on.
 *
 * ⚠ **BYTE-EQUAL TO `SERVICES_SCROLL_OWNED_MEDIA`, AND MIRRORED BY HAND IN
 * `musings.css`.** It is not an alias of it: that constant answers "does
 * `#services` own the wheel", and coupling this station's geometry to that
 * question would mean a change there silently re-rung this rack. The strings
 * being equal is a fact about the two rungs, not a dependency — and
 * `tests/lib/musings-rack.test.ts` asserts the CSS carries the same query,
 * because a writer and a sheet that disagree about the rung is a rack posed
 * in 3D inside a box laid out as a flat rail.
 */
export const MUSINGS_RACK_MEDIA = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

export interface MusingsScrollState {
  /** The detented front card. React state — it changes a handful of times. */
  front: number;
  /** False on the inert rung: the rack rests as a list and nothing is posed. */
  live: boolean;
}

export function useMusingsScroll(
  runwayRef: React.RefObject<HTMLElement | null>,
  stationRef: React.RefObject<HTMLElement | null>,
  cardsRef: React.MutableRefObject<(HTMLElement | null)[]>,
  count: number
): MusingsScrollState {
  const [state, setState] = useState<MusingsScrollState>({ front: 0, live: false });
  const rafRef = useRef<number | null>(null);
  /** Last written front index — so `setState` fires only at a detent. */
  const frontRef = useRef(-1);

  useEffect(() => {
    if (count <= 0) return;

    const mq = window.matchMedia(MUSINGS_RACK_MEDIA);

    /**
     * Put everything back the way the sheet rests it.
     *
     * ⚠ **AN ABSENT STAMP MEANS SHOWN** — the house's polarity law (ADR-099's
     * ground, ADR-101 §A's awaiting station). The phone, a reduced-motion
     * reader and a page whose script never ran all get the rack as a plain
     * rail of cards, which is the finished page and not a fallback.
     */
    const park = () => {
      const station = stationRef.current;
      if (station) {
        station.removeAttribute("data-mu-ready");
        station.style.removeProperty("--mu-entry");
        station.style.removeProperty("--mu-fan");
        station.style.removeProperty("--mu-drift");
      }
      for (const el of cardsRef.current) {
        if (!el) continue;
        el.style.removeProperty("transform");
        el.style.removeProperty("opacity");
        el.style.removeProperty("filter");
        el.style.removeProperty("z-index");
      }
      /* ⚠ THE FOOTER'S BED IS DISARMED TOO, AND IT HAS TO BE. Left stamped on
         a rung that never writes again, `#contact` would be `position: sticky`
         for the rest of the document — see the `reveal` write below for why
         that is fatal above this station. */
      document.documentElement.removeAttribute("data-ft-reveal");
      if (frontRef.current !== 0) {
        frontRef.current = 0;
        setState({ front: 0, live: false });
      } else {
        setState((s) => (s.live ? { front: s.front, live: false } : s));
      }
    };

    const tick = () => {
      const runway = runwayRef.current;
      const station = stationRef.current;
      if (!runway || !station) return;

      if (!mq.matches) {
        park();
        return;
      }

      const vh = layoutViewportHeight();
      const rect = runway.getBoundingClientRect();

      /* The pinned clock: how far the runway's top has passed the frame's
         top, over the travel the sticky child actually has. `offsetHeight`
         rather than the rect's height, so a transform anywhere above cannot
         enter the arithmetic. */
      const travel = Math.max(1, runway.offsetHeight - vh);
      const p = clamp01(-rect.top / travel);

      const clock = rackClock(p, count);
      const front = rackIndex(clock.index, count);

      station.style.setProperty("--mu-entry", clock.entry.toFixed(4));
      station.style.setProperty("--mu-fan", clock.fan.toFixed(4));
      station.style.setProperty("--mu-drift", `${clock.drift.toFixed(3)}deg`);
      if (!station.hasAttribute("data-mu-ready")) station.setAttribute("data-mu-ready", "");

      const cards = cardsRef.current;
      for (let i = 0; i < cards.length; i++) {
        const el = cards[i];
        if (!el) continue;
        const pose = rackPose(wrapDistance(i, front, count), clock.entry, clock.fan);
        el.style.transform = pose.transform;
        el.style.opacity = pose.opacity.toFixed(4);
        el.style.filter = pose.filter;
        el.style.zIndex = String(pose.zIndex);
      }

      /**
       * ⚠ **THE FOOTER'S BED IS ARMED ON `rect.top <= 0`, AND IT MUST BE
       * REVERSIBLE.** `#contact` becomes `position: sticky; bottom: 0` while
       * this attribute is present, and a sticky-bottom box is pulled UP to
       * the frame's floor from anywhere above its natural seat — so armed one
       * station too early it would paint the whole footer behind
       * `#voidwalker`, which on the capable path is a TRANSPARENT pinned
       * stage over the live corridor. `rect.top <= 0` is exactly "this
       * opaque station's top has passed the frame's top", i.e. the station
       * fills the screen and the snap is invisible behind it; scrolling back
       * above the station clears it in the same frame.
       */
      if (rect.top <= 0) document.documentElement.setAttribute("data-ft-reveal", "");
      else document.documentElement.removeAttribute("data-ft-reveal");

      if (front !== frontRef.current) {
        frontRef.current = front;
        setState({ front, live: true });
      } else {
        setState((s) => (s.live ? s : { front, live: true }));
      }
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        tick();
      });
    };

    /* A rung change re-asks the whole question, including the two stamps. */
    const onMq = () => onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onMq);
    tick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onMq);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      /* ⚠ The stamp lives on `<html>`, outside this station's subtree, so
         unmounting without clearing it leaves the footer sticky forever. */
      document.documentElement.removeAttribute("data-ft-reveal");
    };
  }, [runwayRef, stationRef, cardsRef, count]);

  return state;
}
