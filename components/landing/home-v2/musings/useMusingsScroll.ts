"use client";

import { useEffect, useRef, useState } from "react";

import { clamp01 } from "@/lib/math";
import {
  HEAD_OUT_SPEEDUP,
  headFrame,
  headRunLive,
  headSpan,
  headTarget,
  type HeadMode,
  type HeadRun,
  type HeadWant,
} from "@/lib/musings/headDecode";
import {
  rowArrive,
  rowGeom,
  rowIndex,
  rowPose,
  rowReadIndex,
  type RowArrive,
} from "@/lib/musings/rowMath";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";

/**
 * The musings station's ONE scroll writer (ADR-119).
 *
 * It owns everything that moves in this beat, and it publishes two kinds of
 * thing: the row's per-card pose, assigned straight onto the elements, and
 * a handful of attributes — `data-mu-ready` / `data-mu-arrive` on `.mu`,
 * `data-mu-mode` on the STATION and **`data-ft-reveal` on `<html>`**, which is
 * what arms the footer's held bed (ADR-105 U3).
 *
 * ⚠ **IT RENDERS NOTHING PER FRAME.** The only React state is the front card's
 * index, which changes at a DETENT — a handful of times across the station.
 * ADR-002's law is one writer publishing CSS custom properties.
 *
 * ⚠ **THE ROW IS A PURE FUNCTION OF ONE RECT, SO SCROLLING BACK UNWINDS IT
 * EXACTLY** (ADR-021). The HEAD is the one thing here with a clock of its own
 * (ADR-119 U2): scroll decides where it is going, a bounded burst walks it
 * there, and it snaps blank the moment the stage is not parked.
 *
 * ⚠ **IT READS THE LAYOUT VIEWPORT, NOT `innerHeight`** (ADR-113): the runway
 * is authored in `svh`, and on iOS `innerHeight` follows the toolbar.
 */

/**
 * The rung the 3D row draws on.
 *
 * ⚠ **BYTE-EQUAL TO `SERVICES_SCROLL_OWNED_MEDIA`, AND MIRRORED BY HAND IN
 * `musings.css`.** It is not an alias of it: that constant answers "does
 * `#services` own the wheel", and coupling this station's geometry to that
 * question would mean a change there silently re-rung this row.
 * `tests/lib/musings-row.test.ts` asserts the sheet carries the same query.
 */
export const MUSINGS_RACK_MEDIA = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

/**
 * The rung the station becomes a TRANSPARENT STAGE on (ADR-119 U1).
 *
 * ⚠ **THREE RUNGS, NOT TWO.** The row draws from 961px; the era stage is only a
 * hologram from **1101px**, and this station may only go transparent where
 * there is a live corridor behind it. 961–1100 is a real rung with a 3D row
 * and an OPAQUE station.
 *
 * ⚠ **THE ERA'S MODE IS READ OFF THE DOM, NEVER COPIED AS A FLAG** —
 * `#voidwalker[data-vw-mode="hologram"]` is written under the era's own full
 * capability gate, so reading it is reading the answer.
 */
export const MUSINGS_STAGE_MEDIA =
  "(min-width: 1101px) and (prefers-reduced-motion: no-preference)";

export interface MusingsScrollState {
  /** The detented front card. React state — it changes a handful of times. */
  front: number;
  /** False on the inert rung: the row rests as a list and nothing is posed. */
  live: boolean;
}

interface HeadTarget extends HeadRun {
  el: HTMLElement;
  /** The line this run's CRT cursor hangs on, if it has one. */
  host: HTMLElement | null;
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
     * The `#musings` STATION — not `.mu`, which is what `stationRef` holds.
     *
     * ⚠ `stationRef` is the portal's own root one level inside the authored
     * `[data-musings-root]` slot, so every rule written against
     * `#musings[data-mu-mode]` needs the station itself. Resolved by climbing.
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
     * Re-read EVERY frame: a resize across 1101px and the era's own
     * engage/disengage both change the answer. ⚠ BOTH transparent modes,
     * `hologram` and `travel` — the pair `home-v2.css` and `voidwalker.css`
     * key on (ADR-030 §6).
     */
    const stageMode = () => {
      if (!mqStage.matches) return false;
      const mode = document.getElementById("voidwalker")?.dataset.vwMode;
      return mode === "hologram" || mode === "travel";
    };

    /* ⚠ THE ARRIVAL IS STATE, DECIDED ONCE PER CROSSING — never re-derived
       from `p` each frame, which is what makes it a burst and not a channel. */
    let arrive: RowArrive | null = null;

    /* ── The head (ADR-119 U2) ──────────────────────────────────────────
       `level` is 0 blank → 1 whole, and null until the first live frame, so a
       deep reload that lands parked inside the band can show the head WHOLE
       with no replay (the services masthead's silent reconstruction). */
    let headLevel: number | null = null;
    let headWant: HeadWant | null = null;
    let burstRaf: number | null = null;
    let burstLast = 0;

    /**
     * The decode's targets, cached on first sight, FROM THE DOM. React renders
     * the finished strings — what a reader with no script keeps — so the true
     * text is whatever was in the element before this writer touched it.
     */
    let decodeTargets: HeadTarget[] | null = null;
    let span = 0;
    const targets = () => {
      const station = stationRef.current;
      if (!station) return [];
      if (decodeTargets && decodeTargets.every((t) => t.el.isConnected)) return decodeTargets;
      decodeTargets = [...station.querySelectorAll<HTMLElement>("[data-mu-decode]")].map((el) => ({
        el,
        text: el.textContent ?? "",
        mode: (el.dataset.muDecode === "type" ? "type" : "scramble") as HeadMode,
        order: Number(el.dataset.muOrder ?? 0) || 0,
        host: el.closest<HTMLElement>("[data-mu-cursor]"),
      }));
      span = headSpan(decodeTargets);
      return decodeTargets;
    };

    /** Write the head at `level`: every run's frame, the chrome's channel, the cursor. */
    const writeHead = (level: number, rising: boolean) => {
      const station = stationRef.current;
      if (station) station.style.setProperty("--mu-head", level.toFixed(4));
      const runs = targets();
      /* The CRT cursor rides the FIRST title line still decoding and the
         paragraph while it types — services' own rule — and only on the way
         IN: an un-type is a leaving, not a typing. */
      let titleCursor = false;
      for (const t of runs) {
        const next = headFrame(t, level, span);
        if (t.el.textContent !== next) t.el.textContent = next;
        if (!t.host) continue;
        let live = rising && headRunLive(t, level, span);
        if (live && t.mode === "scramble") {
          if (titleCursor) live = false;
          else titleCursor = true;
        }
        t.host.toggleAttribute("data-live", live);
      }
    };

    const stopBurst = () => {
      if (burstRaf != null) window.cancelAnimationFrame(burstRaf);
      burstRaf = null;
    };

    /** Snap the head to a level with no burst: the park gate and the deep reload. */
    const setHead = (level: number) => {
      stopBurst();
      headLevel = level;
      writeHead(level, false);
    };

    /**
     * The bounded burst. It walks `headLevel` toward `headWant` at 1/span per
     * second going up and `HEAD_OUT_SPEEDUP`/span going down, and it stops the
     * frame it arrives. Reaching 1 asks the scroll writer for one more frame,
     * because the row's arrival waits on the head (the owner's order).
     */
    const burst = (now: number) => {
      burstRaf = null;
      if (headLevel == null || headWant == null) return;
      const dt = Math.min(0.1, Math.max(0, (now - burstLast) / 1000));
      burstLast = now;
      const rate = span > 0 ? 1 / span : Infinity;
      const rising = headWant > headLevel;
      const step = (rising ? rate : rate * HEAD_OUT_SPEEDUP) * dt;
      headLevel = rising
        ? Math.min(headWant, headLevel + step)
        : Math.max(headWant, headLevel - step);
      writeHead(headLevel, rising);
      if (headLevel !== headWant) {
        burstRaf = window.requestAnimationFrame(burst);
      } else if (headLevel === 1) {
        onScroll();
      }
    };

    const startBurst = () => {
      if (burstRaf != null) return;
      burstLast = performance.now();
      burstRaf = window.requestAnimationFrame(burst);
    };

    /** Put every decoded run back to the string React rendered. */
    const restoreHead = () => {
      stopBurst();
      headLevel = null;
      headWant = null;
      const station = stationRef.current;
      if (station) {
        station.style.removeProperty("--mu-head");
        station.removeAttribute("data-mu-arrive");
      }
      if (!decodeTargets) return;
      for (const t of decodeTargets) {
        if (t.el.textContent !== t.text) t.el.textContent = t.text;
        t.host?.removeAttribute("data-live");
      }
    };

    /**
     * Put everything back the way the sheet rests it.
     *
     * ⚠ **AN ABSENT STAMP MEANS SHOWN** — the house's polarity law. The phone, a
     * reduced-motion reader and a page whose script never ran all get the row
     * as a plain rail of cards, which is the finished page and not a fallback.
     */
    const park = () => {
      const station = stationRef.current;
      if (station) {
        station.removeAttribute("data-mu-ready");
        /* ⚠ AND THE ARRIVAL'S STAMP, OR A PARKED ROW STAYS SHUT. */
        station.removeAttribute("data-mu-arrive");
        arrive = null;
      }
      /* ⚠ THE STAGE MODE GOES WITH IT, AND THE STATION IS OPAQUE AGAIN, or a
         reader on the inert rung gets a transparent box over a dead corridor
         (ADR-008 rule 1). */
      section()?.removeAttribute("data-mu-mode");
      restoreHead();
      for (const el of cardsRef.current) {
        if (!el) continue;
        el.style.removeProperty("transform");
        el.style.removeProperty("z-index");
        delete el.dataset.muTilt;
      }
      /* ⚠ THE FOOTER'S BED IS DISARMED TOO: left stamped on a rung that never
         writes again, `#contact` would be sticky for the rest of the document. */
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
         resolves its cover off this attribute on its own cadence. */
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
         rather than the rect's height, so a transform above cannot enter it. */
      const travel = Math.max(1, runway.offsetHeight - vh);
      const p = clamp01(-rect.top / travel);
      /* ⚠ PARKED IS THE RUNWAY COVERING THE FRAME, which is exactly when the
         sticky stage is still. `p` alone cannot say it: it clamps to 0 all the
         way up the approach and to 1 all the way through the release. */
      const pinned = rect.top <= 0.5 && rect.bottom >= vh - 0.5;

      /* ── The head: decide where it is going, then get it there. ── */
      targets();
      const want = headTarget(headWant, p, pinned);
      if (!pinned) {
        /* ⚠ TEXT NEVER TRAVELS. Unparked, the head is blank NOW — a burst
           still playing would print on a moving stage. */
        headWant = 0;
        if (headLevel !== 0) setHead(0);
      } else if (headLevel == null) {
        /* The first live frame: a deep reload parked inside the band shows the
           head whole, with no replay; anything else starts blank. */
        headWant = want;
        setHead(want);
      } else if (want !== headWant || headLevel !== want) {
        headWant = want;
        if (headLevel !== want) startBurst();
      }

      /* ── The row's arrival, AFTER the head (the owner's order). ── */
      let nextArrive = rowArrive(arrive, p);
      if (nextArrive === "in" && arrive !== "in" && (headLevel ?? 0) < 1)
        nextArrive = arrive ?? "await";
      if (nextArrive !== arrive) {
        arrive = nextArrive;
        station.dataset.muArrive = nextArrive;
      }
      if (!station.hasAttribute("data-mu-ready")) station.setAttribute("data-mu-ready", "");

      const open = rowIndex(rowReadIndex(p, count), count);
      const cards = cardsRef.current;
      /* ⚠ THE FACE'S SIZE IS MEASURED, AND IT IS `offsetWidth`/`offsetHeight`.
         Both come from `clamp()`s, so no constant can stand in for them, and
         the LAYOUT box is what a transform does not move — the rect would
         report a tipped card's projection. */
      const first = cards.find((el) => el);
      const w = first?.offsetWidth ?? 0;
      const h = first?.offsetHeight ?? 0;
      if (w > 0 && h > 0) {
        const g = rowGeom(w, h);
        for (let i = 0; i < cards.length; i++) {
          const el = cards[i];
          if (!el) continue;
          const pose = rowPose(i, count, open, g);
          el.style.transform = pose.transform;
          el.style.zIndex = String(pose.zIndex);
          if (el.dataset.muTilt !== String(pose.tilt)) el.dataset.muTilt = String(pose.tilt);
        }
      }

      /**
       * ⚠ **THE FOOTER'S BED IS ARMED ON THE COVER'S TOP REACHING THE FRAME'S,
       * AND IT MUST BE REVERSIBLE.** `#contact` becomes `position: sticky;
       * bottom: 0` while this attribute is present, and a sticky-bottom box is
       * pulled UP to the frame's floor from anywhere above its seat — armed a
       * station early it would paint the whole footer through the transparent
       * era stage. On the stage rung the edge is the BAND's (the station is
       * transparent there); off it the station is opaque and its runway's own
       * top is right.
       */
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

    function onScroll() {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        tick();
      });
    }

    /* A rung change re-asks the whole question, including the two stamps. */
    const onMq = () => onScroll();

    /* ⚠ A HIDDEN TAB STOPS rAF MID-BURST. On the way back the head settles
       where it was going — never left half-shuffled over a parked stage. */
    const onVisibility = () => {
      if (document.hidden || headWant == null || headLevel == null) return;
      if (headLevel !== headWant) setHead(headWant);
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onMq);
    mqStage.addEventListener("change", onMq);
    document.addEventListener("visibilitychange", onVisibility);
    tick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onMq);
      mqStage.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      /* ⚠ The stamp lives on `<html>`, outside this station's subtree, so
         unmounting without clearing it leaves the footer sticky forever. */
      document.documentElement.removeAttribute("data-ft-reveal");
      /* ⚠ And the mode lives on the STATION, which this component does not
         render — left behind, it would hold a transparent, promoted station
         over a dead corridor for the rest of the document. */
      section()?.removeAttribute("data-mu-mode");
      /* ⚠ And the decoded runs go back to the strings React rendered. A fast
         refresh re-runs the effect against a node that survives, and a head
         left mid-scramble there stays mid-scramble on the page. */
      restoreHead();
    };
  }, [runwayRef, stationRef, cardsRef, bandRef, count]);

  return state;
}
