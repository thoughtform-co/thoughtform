"use client";

import { useEffect, useRef } from "react";

import { clamp01 } from "@/lib/math";
import { rowArrive, type RowArrive } from "@/lib/musings/arrive";
import {
  HEAD_OUT_SPEEDUP,
  headFrame,
  headParked,
  headRunLive,
  headSpan,
  headTarget,
  type HeadMode,
  type HeadRun,
  type HeadWant,
} from "@/lib/musings/headDecode";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";

/**
 * The musings station's ONE scroll writer (ADR-119 → ADR-121 → ADR-122).
 *
 * It owns everything that moves in this beat and it publishes ATTRIBUTES and
 * custom properties only: `--mu-head` (the head's level), `data-mu-ready` /
 * `data-mu-arrive` on `.mu`, `data-mu-mode` and `data-station-edge` on the
 * STATION (the second tells the HUD's readout that a welded stage is active
 * at its PIN, ADR-121 U3), `data-mu-open` on ONE note, `data-live` on the
 * head's cursor hosts. (Its `<html>` stamp, `data-ft-reveal`, went with the
 * footer's bed in ADR-105 U4: the footer now rises OVER the pinned stage,
 * welded on `data-mu-ready` alone, so there is nothing left to arm.)
 *
 * ⚠ **IT RENDERS NOTHING, EVER.** ADR-119 kept one piece of React state; the
 * list has none. The open note is one attribute moved on an EVENT —
 * `pointerover` / `focusin` on the list — never a `setState` (ADR-002: one
 * writer, CSS custom properties). The sheet does the rest: the note's cover
 * column and its excerpt's row transition on `[data-mu-open]`.
 *
 * ⚠ **THE OPEN NOTE STAYS WHERE THE READER LEFT IT (ADR-122).** ADR-121's row
 * snapped back to the newest on `pointerleave`; a list whose open card is
 * taller than the rest cannot — a card closing as the pointer leaves the list
 * moves every note below it, and the way out with them, under the hand that
 * is travelling to them. It goes home only when the writer parks.
 *
 * ⚠ **THE HEAD IS THE ONE THING HERE WITH A CLOCK OF ITS OWN** (ADR-119 U2):
 * scroll decides where it is going, a bounded burst walks it there, and it
 * snaps blank the moment the stage is not parked. The list's arrival is a
 * second bounded burst on a hysteresis (`lib/musings/arrive.ts`), held until
 * the head has resolved — the owner's order.
 *
 * ⚠ **IT READS THE LAYOUT VIEWPORT, NOT `innerHeight`** (ADR-113): the runway
 * is authored in `svh`, and on iOS `innerHeight` follows the toolbar.
 */

/**
 * The rung the list opens on hover on (the name is ADR-121's row; the rung is
 * unchanged).
 *
 * ⚠ **BYTE-EQUAL TO `SERVICES_SCROLL_OWNED_MEDIA`, AND MIRRORED BY HAND IN
 * `musings.css`.** It is not an alias of it: that constant answers "does
 * `#services` own the wheel", and coupling this station's layout to that
 * question would mean a change there silently re-rung this list.
 * `tests/lib/musings-row.test.ts` asserts the sheet carries the same query.
 * Below it — every phone, and a reduced-motion reader at any width — the list
 * rests with its newest note open, which is the finished page.
 */
export const MUSINGS_ROW_MEDIA = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

/**
 * The rung the station becomes a TRANSPARENT STAGE on (ADR-119 U1).
 *
 * ⚠ **THREE RUNGS, NOT TWO.** The list opens from 961px; the era stage is only a
 * hologram from **1101px**, and this station may only go transparent where
 * there is a live corridor behind it. 961–1100 is a real rung with a hover
 * list and an OPAQUE station.
 *
 * ⚠ **THE ERA'S MODE IS READ OFF THE DOM, NEVER COPIED AS A FLAG** —
 * `#voidwalker[data-vw-mode="hologram"]` is written under the era's own full
 * capability gate, so reading it is reading the answer.
 */
export const MUSINGS_STAGE_MEDIA =
  "(min-width: 1101px) and (prefers-reduced-motion: no-preference)";

interface HeadTarget extends HeadRun {
  el: HTMLElement;
  /** The line this run's CRT cursor hangs on, if it has one. */
  host: HTMLElement | null;
}

export function useMusingsScroll(
  runwayRef: React.RefObject<HTMLElement | null>,
  stationRef: React.RefObject<HTMLElement | null>,
  listRef: React.RefObject<HTMLElement | null>,
  count: number
): void {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (count <= 0) return;

    const mq = window.matchMedia(MUSINGS_ROW_MEDIA);
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

    /* ── The open note (ADR-121 → ADR-122) ──────────────────────────────
       ONE attribute, on ONE note, moved on events. `data-mu-open` is
       rendered on the newest note by React (the owner's rest state: the
       newest is open, no timer) and this writer moves it — it is never
       re-derived, never timed, never React state. ⚠ The current holder is
       QUERIED, not cached: the lab re-keys the whole list when its count
       changes, and a cached element would be a detached one. */
    const notes = () => {
      const list = listRef.current;
      return list ? [...list.querySelectorAll<HTMLElement>(":scope > .mu-note")] : [];
    };
    const openNote = (el: HTMLElement | null) => {
      const list = listRef.current;
      if (!list || !el || el.hasAttribute("data-mu-open")) return;
      for (const c of list.querySelectorAll<HTMLElement>(".mu-note[data-mu-open]"))
        c.removeAttribute("data-mu-open");
      el.setAttribute("data-mu-open", "");
    };
    /** Back to the newest note — the rest state, and what every rung rests on. */
    const openRest = () => openNote(notes()[0] ?? null);
    const noteOf = (t: EventTarget | null) =>
      t instanceof Element ? t.closest<HTMLElement>(".mu-note") : null;
    /* ⚠ GATED ON THE RUNG, so the rested list — a phone, a reduced-motion
       reader — never moves: the newest note open, the rest links. */
    const onPointerOver = (e: PointerEvent) => {
      if (!mq.matches) return;
      const note = noteOf(e.target);
      if (note && listRef.current?.contains(note)) openNote(note);
    };
    const onFocusIn = (e: FocusEvent) => {
      if (!mq.matches) return;
      const note = noteOf(e.target);
      if (note && listRef.current?.contains(note)) openNote(note);
    };

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
     * because the list's arrival waits on the head (the owner's order).
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
     * reduced-motion reader and a page whose script never ran all get the list
     * with its newest note open, which is the finished page and not a fallback.
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
         (ADR-008 rule 1). The readout's edge goes with the mode: an unwelded
         station is active at the viewport's middle like every other. */
      section()?.removeAttribute("data-mu-mode");
      section()?.removeAttribute("data-station-edge");
      restoreHead();
      /* The open note goes home: the list rests with the newest open. */
      openRest();
    };

    /**
     * The rise, in pixels (ADR-105 U4): the runway's last `--mu-rise`, during
     * which the stage stays pinned while the footer rises over it.
     *
     * ⚠ A CUSTOM PROPERTY IS A STRING UNTIL SOMETHING LAYS IT OUT, so the value
     * is read off a probe box sized by it — in the STATION, where the property
     * is declared and which is not React's to reconcile. It is `0px` wherever no
     * footer follows the station (the labs), so the clock there is the runway.
     */
    let riseProbe: HTMLElement | null = null;
    const risePx = (): number => {
      const sec = section();
      if (!sec) return 0;
      if (!riseProbe || !riseProbe.isConnected || riseProbe.parentElement !== sec) {
        riseProbe?.remove();
        riseProbe = document.createElement("i");
        riseProbe.setAttribute("aria-hidden", "true");
        riseProbe.style.cssText =
          "position:absolute;left:0;top:0;width:0;height:var(--mu-rise,0px);visibility:hidden;pointer-events:none";
        sec.appendChild(riseProbe);
      }
      return riseProbe.offsetHeight;
    };

    const tick = () => {
      const runway = runwayRef.current;
      const station = stationRef.current;
      if (!runway || !station) return;

      if (!mq.matches) {
        park();
        return;
      }

      /* ⚠ THE READY STAMP LANDS BEFORE THE MEASURE. The runway's height (the
         dwell plus the rise) and the footer's weld both key on `data-mu-ready`
         (ADR-105 U4), so a rect read before it is the FLOWING list's — and on
         the first tick after a deep reload that put `travel` at 1 (a rest-height
         runway minus two viewports), saturated `p`, and seeded the head off a
         layout no reader sees; a second tick corrected it only where the era's
         mode observer happened to fire. Stamped here, the same tick lays out and
         measures the pinned runway. The attribute is idempotent, so this is one
         forced layout on the first tick and a plain read on every other. It is
         also what keeps the runway's rise and `#contact`'s weld turning on and
         off in the same frame, so the two can never disagree. */
      if (!station.hasAttribute("data-mu-ready")) station.setAttribute("data-mu-ready", "");

      /* The stage stamp, before anything reads it. `useCorridorExitScroll`
         resolves its cover off this attribute on its own cadence. */
      const sec = section();
      const stage = stageMode();
      if (sec) {
        if (stage) {
          if (sec.dataset.muMode !== "stage") sec.dataset.muMode = "stage";
          /* ⚠ THE WELDED STATION IS ACTIVE AT ITS PIN (ADR-121 U3). The sheet
             pulls the station one viewport over the era stage on this mode,
             so its top crosses the viewport's middle 8svh BEFORE the era's
             exit begins; `useLandingScroll` reads this edge and lights the
             corner when the top reaches the frame's top — the frame the head
             decodes in. Written and cleared with the mode, never apart. */
          if (sec.getAttribute("data-station-edge") !== "pin")
            sec.setAttribute("data-station-edge", "pin");
        } else if (sec.dataset.muMode) {
          sec.removeAttribute("data-mu-mode");
          sec.removeAttribute("data-station-edge");
        }
      }

      const vh = layoutViewportHeight();
      const rect = runway.getBoundingClientRect();

      /* The pinned clock: how far the runway's top has passed the frame's
         top, over ONE dwell, `--mu-dwell` (ADR-121). ⚠ THE RISE IS NOT PART
         OF IT (ADR-105 U4): the runway is the dwell plus the rise, and the
         clock is measured over the dwell alone, so `p` saturates at 1 while
         the footer rises and every threshold keeps the meaning it had.
         `offsetHeight` rather than the rect's height, so a transform above
         cannot enter it. */
      const rise = risePx();
      const travel = Math.max(1, runway.offsetHeight - vh - rise);
      const p = clamp01(-rect.top / travel);
      /* ⚠ PARKED IS THE RUNWAY COVERING THE FRAME, which is exactly when the
         sticky stage is still — OR THE FRAME COVERED BY THE FOOTER (ADR-105
         U4): where the footer is taller than the frame the document runs past
         the runway's end and the stage travels under a footer that already
         covers everything, and snapping the head blank there re-armed a decode
         the footer's descent then uncovered mid-shuffle. `headParked` is the
         pure test; `p` alone cannot say either: it clamps to 0 all the way up
         the approach and to 1 all the way through the release. */
      const parked = headParked(rect.top, rect.bottom, vh, rise);

      /* ── The head: decide where it is going, then get it there. ── */
      targets();
      const want = headTarget(headWant, p, parked);
      if (!parked) {
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

      /* ── The list's arrival, AFTER the head (the owner's order). ── */
      let nextArrive = rowArrive(arrive, p);
      if (nextArrive === "in" && arrive !== "in" && (headLevel ?? 0) < 1)
        nextArrive = arrive ?? "await";
      if (nextArrive !== arrive) {
        arrive = nextArrive;
        station.dataset.muArrive = nextArrive;
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

    const list = listRef.current;
    list?.addEventListener("pointerover", onPointerOver);
    list?.addEventListener("focusin", onFocusIn);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onMq);
    mqStage.addEventListener("change", onMq);
    document.addEventListener("visibilitychange", onVisibility);
    /* ⚠ THE STAGE MODE FOLLOWS THE ERA'S, AND THE ERA STAMPS LATE (ADR-121
       U3). `stageMode()` reads `#voidwalker`'s `data-vw-mode`, which lands
       after its codec probe — later than this writer's first tick. Left to
       scroll and resize alone, the stamp (and with it the weld, the
       promotion and the band) arrived on the reader's first scroll rather
       than at load, and a spec reading the page at rest saw an unwelded
       station. One observer, one attribute, the same rAF-coalesced tick. */
    const vwEl = document.getElementById("voidwalker");
    const vwObserver = vwEl ? new MutationObserver(onScroll) : null;
    vwObserver?.observe(vwEl as HTMLElement, {
      attributes: true,
      attributeFilter: ["data-vw-mode"],
    });
    tick();

    return () => {
      vwObserver?.disconnect();
      list?.removeEventListener("pointerover", onPointerOver);
      list?.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onMq);
      mqStage.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      riseProbe?.remove();
      /* ⚠ The mode lives on the STATION, which this component does not
         render — left behind, it would hold a transparent, promoted station
         over a dead corridor for the rest of the document. The readout's
         edge goes with it. */
      section()?.removeAttribute("data-mu-mode");
      section()?.removeAttribute("data-station-edge");
      /* ⚠ And the decoded runs go back to the strings React rendered. A fast
         refresh re-runs the effect against a node that survives, and a head
         left mid-scramble there stays mid-scramble on the page. */
      restoreHead();
    };
  }, [runwayRef, stationRef, listRef, count]);
}
