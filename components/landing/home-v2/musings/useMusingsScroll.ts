"use client";

import { useEffect, useRef, useState } from "react";

import { clamp01 } from "@/lib/math";
import { shelfClock, shelfGeom, shelfIndex, shelfPose } from "@/lib/musings/shelfMath";
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

/**
 * The rung the station becomes a TRANSPARENT STAGE on (ADR-119 U1).
 *
 * ⚠ **THERE ARE THREE RUNGS HERE, NOT TWO, AND CONFLATING THEM IS THE DEFECT
 * THIS CONSTANT EXISTS TO PREVENT.** The rack draws from 961px
 * (`MUSINGS_RACK_MEDIA`); the era stage is only a hologram from **1101px**, and
 * this station may only go transparent where there is a live corridor behind it
 * to be transparent ONTO. So 961–1100 is a real rung with a 3D rack and an
 * OPAQUE station, and it must stay byte-identical to what shipped in ADR-119 —
 * every new behaviour (the transparency, the promotion, the band as the cover,
 * the band as the footer's reveal edge) hangs on the stamp this gate writes.
 *
 * ⚠ **THE ERA'S MODE IS READ OFF THE DOM, NEVER COPIED AS A FLAG.** A second
 * copy of "is the corridor live and capable" is how two surfaces end up
 * disagreeing about one fact; `#voidwalker[data-vw-mode="hologram"]` is written
 * by `useVoidwalkerHologramScroll` under its own full capability gate, so
 * reading it is reading the answer rather than re-deriving it. It is also the
 * exact predicate `voidwalker.css`'s own transparency rule keys on.
 */
export const MUSINGS_STAGE_MEDIA =
  "(min-width: 1101px) and (prefers-reduced-motion: no-preference)";

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
  count: number,
  bandRef: React.RefObject<HTMLElement | null>
): MusingsScrollState {
  const [state, setState] = useState<MusingsScrollState>({ front: 0, live: false });
  const rafRef = useRef<number | null>(null);
  /** Last written front index — so `setState` fires only at a detent. */
  const frontRef = useRef(-1);

  useEffect(() => {
    if (count <= 0) return;

    const mq = window.matchMedia(MUSINGS_RACK_MEDIA);
    const mqStage = window.matchMedia(MUSINGS_STAGE_MEDIA);

    /**
     * The `#musings` STATION — not `.mu`, which is what `stationRef` actually
     * holds.
     *
     * ⚠ **THE WRITER HAD NO HANDLE ON THE STATION AT ALL**, and that is a trap
     * worth naming: `stationRef` is the portal's own root (`<div class="mu">`)
     * one level inside the authored `[data-musings-root]` slot, so every rule
     * written against `#musings[data-mu-mode]` would have matched NOTHING —
     * silently, with the page simply reading as it did before. Resolved by
     * climbing rather than by a second ref, because the portal mounts into the
     * parsed HTML and the station is not this component's to render.
     */
    let sectionEl: HTMLElement | null = null;
    const section = () => {
      if (!sectionEl || !sectionEl.isConnected) {
        sectionEl = stationRef.current?.closest<HTMLElement>("#musings") ?? null;
      }
      return sectionEl;
    };

    /**
     * Is the station a transparent stage over a live corridor this frame?
     *
     * Re-read EVERY frame, never hoisted: a resize across 1101px and the era's
     * own engage/disengage both change the answer, and `useCorridorExitScroll`
     * re-derives its cover from this same stamp on its own cadence.
     */
    const stageMode = () => {
      if (!mqStage.matches) return false;
      /* ⚠ BOTH TRANSPARENT MODES, THE SAME PAIR `home-v2.css` AND
         `voidwalker.css` KEY ON. `travel` is the retained time-tunnel path and
         it shares the hologram's contract exactly: a pinned TRANSPARENT stage
         the ambient survives. Naming only `hologram` here would make this
         station opaque on a path where the corridor is still live behind it —
         the two sheets and this writer have to answer one question the same
         way (ADR-030 §6). */
      const mode = document.getElementById("voidwalker")?.dataset.vwMode;
      return mode === "hologram" || mode === "travel";
    };

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
        station.style.removeProperty("--mu-drift");
      }
      /* ⚠ THE STAGE MODE GOES WITH IT, AND THE STATION IS OPAQUE AGAIN. The
         transparency, the promotion and the band all key on this stamp, so a
         parked writer must leave a station that paints its own ground — or a
         reader on the inert rung gets a transparent box over a dead corridor,
         which is the gateway radial bleeding through (ADR-008 rule 1). */
      section()?.removeAttribute("data-mu-mode");
      for (const el of cardsRef.current) {
        if (!el) continue;
        el.style.removeProperty("transform");
        el.style.removeProperty("z-index");
        delete el.dataset.muTurn;
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

      /* The stage stamp, before anything reads it. `useCorridorExitScroll`
         resolves its cover off this attribute on its own cadence, so it is
         written on the way in and removed the frame the rung stops matching —
         never left behind for another writer to find. */
      const sec = section();
      const stage = stageMode();
      if (sec) {
        if (stage) {
          if (sec.dataset.muMode !== "stage") sec.dataset.muMode = "stage";
        } else if (sec.dataset.muMode) {
          sec.removeAttribute("data-mu-mode");
        }
      }

      const vh = layoutViewportHeight();
      const rect = runway.getBoundingClientRect();

      /* The pinned clock: how far the runway's top has passed the frame's
         top, over the travel the sticky child actually has. `offsetHeight`
         rather than the rect's height, so a transform anywhere above cannot
         enter the arithmetic. */
      const travel = Math.max(1, runway.offsetHeight - vh);
      const p = clamp01(-rect.top / travel);

      const clock = shelfClock(p, count);
      const open = shelfIndex(clock.index, count);

      station.style.setProperty("--mu-entry", clock.entry.toFixed(4));
      station.style.setProperty("--mu-drift", `${clock.drift.toFixed(3)}deg`);
      if (!station.hasAttribute("data-mu-ready")) station.setAttribute("data-mu-ready", "");

      const cards = cardsRef.current;
      /* ⚠ THE FACE'S WIDTH IS MEASURED, AND IT IS `offsetWidth`. It comes
         from `--mu-card-w`, a `clamp()`, so no constant can stand in for it
         (ADR-102's law: a custom property is a string until something lays it
         out). `offsetWidth` is the border-box LAYOUT width, which a transform
         does not move — the rect would report the slab's projection and
         collapse to a few px the moment it turned. */
      const w = cards.find((el) => el)?.offsetWidth ?? 0;
      if (w > 0) {
        const g = shelfGeom(w);
        for (let i = 0; i < cards.length; i++) {
          const el = cards[i];
          if (!el) continue;
          const pose = shelfPose(i, count, open, g);
          el.style.transform = pose.transform;
          el.style.zIndex = String(pose.zIndex);
          if (el.dataset.muTurn !== String(pose.turn)) el.dataset.muTurn = String(pose.turn);
        }
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
      /* ⚠ ON THE STAGE RUNG THE EDGE IS THE BAND'S, NOT THE RUNWAY'S. The
         paragraph above is the whole argument, and it turns on the station
         being OPAQUE — which on this rung it is not. What fills the screen and
         hides the snap is the band; it is also the frame in which the corridor
         has just died, so the bed arms exactly where the canvas stops painting
         rather than three viewports earlier over a live one. Off the stage rung
         the station is opaque again and the runway's own top is still right. */
      const revealTop =
        stage && bandRef.current ? bandRef.current.getBoundingClientRect().top : rect.top;
      if (revealTop <= 0) document.documentElement.setAttribute("data-ft-reveal", "");
      else document.documentElement.removeAttribute("data-ft-reveal");

      if (open !== frontRef.current) {
        frontRef.current = open;
        setState({ front: open, live: true });
      } else {
        setState((s) => (s.live ? s : { front: open, live: true }));
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
    mqStage.addEventListener("change", onMq);
    tick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onMq);
      mqStage.removeEventListener("change", onMq);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      /* ⚠ The stamp lives on `<html>`, outside this station's subtree, so
         unmounting without clearing it leaves the footer sticky forever. */
      document.documentElement.removeAttribute("data-ft-reveal");
      /* ⚠ And the mode lives on the STATION, which this component does not
         render — the portal's root unmounts and the authored section stays.
         Left behind, it would hold a transparent, promoted station over a dead
         corridor for the rest of the document. */
      section()?.removeAttribute("data-mu-mode");
    };
  }, [runwayRef, stationRef, cardsRef, bandRef, count]);

  return state;
}
