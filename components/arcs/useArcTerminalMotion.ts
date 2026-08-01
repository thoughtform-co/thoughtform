"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";

import { advanceScrambles, queueScramble } from "@/lib/home-v2/captionScramble";
import type { ScrambleJob } from "@/lib/home-v2/captionScramble";
import type { ArcMotion } from "@/lib/arcs/types";

import {
  ARC_TERMINAL_MEDIA,
  FORCE_BLANK_OUT,
  NEAR_MARGIN,
  PARK_STRIKE_PX,
  RETYPE_OUT,
  STRIKE_SETTLE_MS,
  TITLE_STAGGER_S,
  TYPE_CHARS_PER_S,
  TYPE_START_DELAY_S,
  UNTYPE_CPS,
  UNTYPE_OUT,
  UNTYPE_UP_PX,
  WRITE_EPS,
  beatIn,
  beatOut,
  headPinOffset,
} from "./arcMotion";

/**
 * useArcTerminalMotion — the beat registry, the clocks and the decode
 * scheduler for terminal-motion arc pages (ADR-057).
 *
 * It adds NO scroll listener. `useArcScroll` stays the page's one scroll
 * writer (ADR-002); this hook returns a stable `onFrame` that runs as
 * the tail of that existing rAF. Its own rAF exists only to advance
 * in-flight decodes and stops the moment the last job resolves.
 *
 * THE MASTHEAD LAW (owner, twice — services 2026-07-27, arcs
 * 2026-08-01): the masthead NEVER moves and NEVER fades. It comes into
 * view only by TYPING and leaves only by UN-TYPING, in both scroll
 * directions, and either can play only while the head is
 * screen-stationary. The phase machine below is that law:
 *
 *   armed ──(pinned ∧ in dwell ∧ [down ∨ settled])──▶ typing ──▶ done
 *   typing/done ──(tail opening ∨ upward pin runway low)──▶ untyping ──▶ armed
 *
 * plus two force-blank guards — the moment resolved text would travel
 * (upward unpin) or the iris could reach it (smoothed out ≥ 0.5), it
 * blanks instantly. A slow reader always sees the full reverse effect;
 * a flick sees a truncation, never a slide.
 *
 * Beats TALLER than the viewport have no all-visible park for their
 * head, so their masthead sticky-pins at `--arc-head-pin` (written here,
 * consumed by the CSS — one number, gate parity) and the content reads
 * through beneath it. The clocks treat "head pinned" as the stationary
 * gate for short and tall beats through one formula: `pinStartY`.
 */

type Phase = "armed" | "typing" | "done" | "untyping";

interface TypeJob {
  el: HTMLElement;
  text: string;
  startSec: number;
  fromLen: number;
  toLen: number;
  cps: number;
}

interface Beat {
  section: HTMLElement;
  stage: HTMLElement;
  tail: HTMLElement | null;
  /** The masthead host (`[data-arc-still]`) — the element the law guards. */
  still: HTMLElement | null;
  decode: HTMLElement[];
  typed: HTMLElement[];
  topDoc: number;
  stageH: number;
  tailPx: number;
  /** Head's offset within the stage — the tall-beat pin geometry. */
  headTop: number;
  /** scrollY at which the head becomes screen-stationary. */
  pinStartY: number;
  tall: boolean;
  /** No tail (the close band): types once, never churns. */
  notail: boolean;
  near: boolean;
  phase: Phase;
  /** performance.now() when the beat last ENTERED its dwell. */
  dwellSinceMs: number;
  /** Upward travel accumulated while this beat shows resolved text. */
  upPx: number;
  lastIn: number;
  lastOut: number;
  live: boolean;
  parked: boolean;
}

interface Options {
  rootRef: RefObject<HTMLElement | null>;
  motion: ArcMotion;
}

const nowSec = () => performance.now() / 1000;

/**
 * Deadbanded channel write. Sub-epsilon deltas are dropped (under 0.3%
 * of an opacity ramp, under 0.15px of travel), but an exact 0 or 1 is
 * always committed — the rest states have to be exact, or the
 * zero-at-rest law becomes an approximation.
 */
function writeChannel(el: HTMLElement, name: string, value: number, last: number): number {
  const settling = value !== last && (value === 0 || value === 1);
  if (!settling && Math.abs(value - last) < WRITE_EPS) return last;
  el.style.setProperty(name, value.toFixed(4));
  return value;
}

export function useArcTerminalMotion({ rootRef, motion }: Options) {
  const frameRef = useRef<((scrollY: number, vh: number) => void) | null>(null);

  const onFrame = useCallback((scrollY: number, vh: number) => {
    frameRef.current?.(scrollY, vh);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (motion !== "terminal") return;
    if (!window.matchMedia(ARC_TERMINAL_MEDIA).matches) return;

    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-arc-beat]"));
    if (sections.length === 0) return;

    const beats: Beat[] = [];
    for (const section of sections) {
      const stage = section.querySelector<HTMLElement>(".arc-stage");
      if (!stage) continue;
      beats.push({
        section,
        stage,
        tail: section.querySelector<HTMLElement>(".arc-beat__tail"),
        still: stage.querySelector<HTMLElement>("[data-arc-still]"),
        decode: Array.from(stage.querySelectorAll<HTMLElement>("[data-arc-decode]")),
        typed: Array.from(stage.querySelectorAll<HTMLElement>("[data-arc-type]")),
        topDoc: 0,
        stageH: 0,
        tailPx: 0,
        headTop: 0,
        pinStartY: 0,
        tall: false,
        notail: section.hasAttribute("data-arc-notail"),
        near: false,
        phase: "done",
        dwellSinceMs: 0,
        upPx: 0,
        lastIn: -1,
        lastOut: -1,
        live: false,
        parked: false,
      });
    }
    if (beats.length === 0) return;

    const jobs: ScrambleJob[] = [];
    const typeJobs: TypeJob[] = [];
    let raf: number | null = null;
    let lastScrollY = window.scrollY;

    function tick() {
      raf = null;
      const t = nowSec();
      advanceScrambles(jobs, t);

      for (let i = typeJobs.length - 1; i >= 0; i--) {
        const job = typeJobs[i];
        if (!job) continue;
        const elapsed = t - job.startSec;
        if (elapsed <= 0) {
          job.el.textContent = job.text.slice(0, job.fromLen);
          continue;
        }
        const step = Math.floor(elapsed * job.cps);
        const shown =
          job.toLen >= job.fromLen
            ? Math.min(job.toLen, job.fromLen + step)
            : Math.max(job.toLen, job.fromLen - step);
        job.el.textContent = job.text.slice(0, shown);
        if (shown === job.toLen) typeJobs.splice(i, 1);
      }

      // A beat's phase resolves once nothing of its own is in flight.
      for (const beat of beats) {
        if (beat.phase !== "typing" && beat.phase !== "untyping") continue;
        const busy =
          jobs.some((j) => beat.decode.includes(j.el as HTMLElement)) ||
          typeJobs.some((j) => beat.typed.includes(j.el));
        if (busy) continue;
        if (beat.phase === "typing") {
          beat.phase = "done";
          beat.stage.setAttribute("data-reveal", "done");
        } else {
          beat.phase = "armed";
          beat.stage.setAttribute("data-reveal", "armed");
        }
      }

      if (jobs.length > 0 || typeJobs.length > 0) raf = window.requestAnimationFrame(tick);
    }

    const wake = () => {
      if (raf === null) raf = window.requestAnimationFrame(tick);
    };

    const dropJobs = (beat: Beat) => {
      for (let i = jobs.length - 1; i >= 0; i--) {
        if (beat.decode.includes(jobs[i]?.el as HTMLElement)) jobs.splice(i, 1);
      }
      for (let i = typeJobs.length - 1; i >= 0; i--) {
        const el = typeJobs[i]?.el;
        if (el && beat.typed.includes(el)) typeJobs.splice(i, 1);
      }
    };

    /**
     * Instant blank — the force-blank guard's landing state, and the
     * reset an off-screen beat re-arms into. DESTRUCTIVE by design:
     * `queueScramble` no-ops when the element already shows its target,
     * and SSR ships resolved copy, so the blank is what makes a decode
     * possible at all. Never pre-rendered (no-JS contract, hydration).
     */
    const arm = (beat: Beat) => {
      if (beat.phase === "armed") return;
      beat.phase = "armed";
      beat.stage.setAttribute("data-reveal", "armed");
      dropJobs(beat);
      for (const el of beat.decode) el.textContent = "";
      for (const el of beat.typed) el.textContent = "";
    };

    /** Type in — from blank, or mid-flight from a reversing un-type. */
    const strike = (beat: Beat) => {
      if (beat.phase === "typing" || beat.phase === "done") return;
      if (beat.decode.length === 0 && beat.typed.length === 0) {
        beat.phase = "done";
        beat.stage.setAttribute("data-reveal", "done");
        return;
      }
      beat.phase = "typing";
      beat.stage.setAttribute("data-reveal", "typing");
      dropJobs(beat);
      const t0 = nowSec();
      beat.decode.forEach((el, i) => {
        queueScramble(jobs, el, el.dataset.arcDecode ?? "", t0 + i * TITLE_STAGGER_S);
      });
      // Typewriter targets CHAIN in DOM order (a quote line's segments
      // type as one continuous line; a lone intro paragraph is the
      // degenerate single-link chain, timing-identical to before).
      let at = t0 + TYPE_START_DELAY_S;
      for (const el of beat.typed) {
        const text = el.dataset.arcType ?? "";
        const fromLen = el.textContent?.length ?? 0;
        typeJobs.push({
          el,
          text,
          startSec: at,
          fromLen,
          toLen: text.length,
          cps: TYPE_CHARS_PER_S,
        });
        at += Math.max(0, text.length - fromLen) / TYPE_CHARS_PER_S;
      }
      wake();
    };

    /**
     * The reverse effect — the masthead leaves the way it arrived.
     * Scramble targets dissolve back through the glyph pool (queue to
     * "", last segment first); typewriter targets backspace from their
     * current text, chained in reverse DOM order.
     */
    const untype = (beat: Beat) => {
      if (beat.phase !== "typing" && beat.phase !== "done") return;
      beat.phase = "untyping";
      beat.stage.setAttribute("data-reveal", "untyping");
      dropJobs(beat);
      const t0 = nowSec();
      for (let i = beat.decode.length - 1; i >= 0; i--) {
        const el = beat.decode[i];
        if (!el) continue;
        const rank = beat.decode.length - 1 - i;
        queueScramble(jobs, el, "", t0 + rank * TITLE_STAGGER_S * 0.6);
      }
      let at = t0;
      for (let i = beat.typed.length - 1; i >= 0; i--) {
        const el = beat.typed[i];
        if (!el) continue;
        const fromLen = el.textContent?.length ?? 0;
        typeJobs.push({
          el,
          text: el.dataset.arcType ?? "",
          startSec: at,
          fromLen,
          toLen: 0,
          cps: UNTYPE_CPS,
        });
        at += fromLen / UNTYPE_CPS;
      }
      if (beat.decode.length === 0 && beat.typed.length === 0) {
        beat.phase = "armed";
        beat.stage.setAttribute("data-reveal", "armed");
        return;
      }
      wake();
    };

    /**
     * Resolve immediately, no replay — first sync on a mid-page reload,
     * and `visibilitychange` (the decode is destructive and rAF halts in
     * a hidden document; an un-settled beat would strand blank copy).
     */
    const settle = (beat: Beat) => {
      dropJobs(beat);
      for (const el of beat.decode) el.textContent = el.dataset.arcDecode ?? "";
      for (const el of beat.typed) el.textContent = el.dataset.arcType ?? "";
      beat.phase = "done";
      beat.stage.setAttribute("data-reveal", "done");
    };

    /** Cached geometry — one layout pass at mount, resize and settle. */
    const measure = () => {
      const vh = window.innerHeight || 1;
      const pin = headPinOffset(vh);
      for (const beat of beats) {
        const rect = beat.section.getBoundingClientRect();
        beat.topDoc = rect.top + window.scrollY;
        beat.stageH = beat.stage.offsetHeight;
        beat.tailPx = beat.tail?.offsetHeight ?? 0;
        beat.tall = beat.stageH > vh + 1;
        // The stage's pin: `top: vh − stageH` — 0 for a fitting stage,
        // negative for a tall one (it reads through its overflow, THEN
        // pins on its last viewport). Same numbers as beatOut's park.
        if (beat.tall) {
          beat.stage.style.setProperty("--arc-stage-pin", `${vh - beat.stageH}px`);
        } else {
          beat.stage.style.removeProperty("--arc-stage-pin");
        }
        beat.headTop = beat.still
          ? beat.still.getBoundingClientRect().top - beat.stage.getBoundingClientRect().top
          : 0;
        if (beat.tall) {
          // Tall beat: the head sticky-pins at `pin` from the viewport
          // top, which happens `headTop − pin` after the stage top
          // crosses it. One number for the CSS and the clock.
          beat.section.setAttribute("data-arc-tall", "");
          beat.section.style.setProperty("--arc-head-pin", `${pin}px`);
          beat.pinStartY = beat.topDoc + beat.headTop - pin;
        } else {
          beat.section.removeAttribute("data-arc-tall");
          beat.section.style.removeProperty("--arc-head-pin");
          // Fitting beat: the whole stage parks at once.
          beat.pinStartY = beat.topDoc;
        }
      }
    };

    let settleTimer: number | null = null;
    /**
     * Re-check a beat that is waiting out `STRIKE_SETTLE_MS`.
     *
     * ⚠ `frame` runs only from the scroll writer's rAF, so it stops
     * firing the instant the reader stops moving. Without this timer the
     * settle branch can never be re-evaluated — scroll UP into a beat,
     * stop, and its masthead stays blank FOREVER (reproduced: 3.5s
     * parked in the dwell, --sec-out 0, still armed). The downward path
     * strikes on `down` in the same frame and never needs it.
     */
    function scheduleSettleCheck(delayMs: number) {
      if (settleTimer !== null) return;
      settleTimer = window.setTimeout(
        () => {
          settleTimer = null;
          frame(window.scrollY, window.innerHeight || 1);
        },
        Math.max(16, delayMs)
      );
    }

    const frame = (scrollY: number, vh: number) => {
      const dy = scrollY - lastScrollY;
      const down = dy > 0;
      lastScrollY = scrollY;
      const nowMs = performance.now();

      for (const beat of beats) {
        if (!beat.near) continue;
        const topVp = beat.topDoc - scrollY;
        const inV = beatIn(topVp, vh);
        const outV = beatOut(topVp, vh, beat.stageH, beat.tailPx);

        beat.lastIn = writeChannel(beat.stage, "--sec-in", inV, beat.lastIn);
        beat.lastOut = writeChannel(beat.stage, "--sec-out", outV, beat.lastOut);

        const live = inV > 0.01 && outV < 0.999;
        if (live !== beat.live) {
          beat.live = live;
          if (live) beat.stage.setAttribute("data-sec-live", "");
          else beat.stage.removeAttribute("data-sec-live");
        }

        // ── The masthead law ──────────────────────────────────────────
        // pinned    the head is screen-stationary (stage parked, or the
        //           tall head sticky-engaged)
        // inDwell   pinned and the fold has barely begun — the only
        //           state text may TYPE in. Read on the SMOOTHED
        //           channel, so "in the dwell" means what it looks like.
        const pinned = scrollY >= beat.pinStartY - PARK_STRIKE_PX;
        const inDwell = pinned && outV <= RETYPE_OUT;
        // The settle clock measures STILLNESS in the dwell, not mere
        // presence — otherwise an upward-triggered un-type would re-type
        // the very next frame (the reader is still in the dwell when
        // they start leaving; only stopping should re-engage).
        if (!inDwell || dy !== 0) beat.dwellSinceMs = nowMs;

        if (pinned !== beat.parked) {
          beat.parked = pinned;
          if (pinned) beat.stage.setAttribute("data-sec-park", "");
          else beat.stage.removeAttribute("data-sec-park");
        }

        if (beat.notail) {
          // The close band: types once at the page foot, never churns.
          if (pinned && beat.phase === "armed") strike(beat);
          continue;
        }

        const showing = beat.phase === "typing" || beat.phase === "done";
        // Upward-departure intent: accumulate up-travel only while this
        // beat is showing resolved text AT ITS PIN; any downward motion
        // resets it. (The pinned guard plus layout-stable decode boxes
        // is what keeps scroll-anchoring noise from ever reading as
        // intent — the 720p churn bug.)
        if (showing && pinned && dy < 0) beat.upPx += -dy;
        else if (dy > 0) beat.upPx = 0;

        if (!pinned && beat.phase !== "armed") {
          // Text would TRAVEL — the hard guard. A deliberate exit began
          // its un-type on the first upward pixels below; a flick from
          // the exact park point is truncated to blank, never a slide.
          arm(beat);
        } else if (outV >= FORCE_BLANK_OUT && beat.phase !== "armed") {
          // The iris opens at 0.56 — text must be gone before any crop
          // could reach it.
          arm(beat);
        } else if (showing && outV >= UNTYPE_OUT) {
          // Downward exit. The masthead is the TOP of the LIFO ladder,
          // so it holds while the numbers and cards fold and only then
          // un-types — finishing before the iris (0.56) can crop it.
          beat.upPx = 0;
          untype(beat);
        } else if (showing && beat.upPx >= UNTYPE_UP_PX) {
          // Upward exit: the reader is leaving through the top. Begin
          // the reverse effect immediately, while the head is still
          // pinned — the stage holds through the tail, so a normal
          // upward scroll watches it un-type in place.
          beat.upPx = 0;
          untype(beat);
        } else if ((beat.phase === "armed" || beat.phase === "untyping") && inDwell) {
          // Type — immediately on a downward arrival; on an upward
          // return only once the reader has settled, so a flick up
          // THROUGH the beat never flashes a type-then-blank.
          const waited = nowMs - beat.dwellSinceMs;
          if (down || waited >= STRIKE_SETTLE_MS) strike(beat);
          // Scrolling has stopped mid-wait: nothing else will call this
          // frame, so the settle has to wake itself.
          else scheduleSettleCheck(STRIKE_SETTLE_MS - waited);
        }
      }
    };

    measure();

    // First sync: the beat whose dwell holds the restored scroll settles
    // silently (no replay of choreography the reader never saw start);
    // everything else arms blank off-screen.
    {
      const vh0 = window.innerHeight || 1;
      const scrollY0 = window.scrollY;
      for (const beat of beats) {
        const topVp0 = beat.topDoc - scrollY0;
        const out0 = beatOut(topVp0, vh0, beat.stageH, beat.tailPx);
        const pinned0 = scrollY0 >= beat.pinStartY - PARK_STRIKE_PX;
        if ((pinned0 && out0 <= UNTYPE_OUT) || (beat.notail && pinned0)) settle(beat);
        else arm(beat);
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const beat = beats.find((b) => b.section === entry.target);
          if (!beat) continue;
          beat.near = entry.isIntersecting;
          if (beat.near) continue;
          // Park the far state. A beat left in EITHER direction rests
          // blank — it un-typed on the way out (or is force-blanked
          // here), so nothing off-screen holds resolved copy except the
          // tailless close band.
          const above = entry.boundingClientRect.top < 0;
          const restIn = above ? 1 : 0;
          const restOut = above && beat.tailPx > 0 ? 1 : 0;
          beat.stage.style.setProperty("--sec-in", restIn.toFixed(4));
          beat.stage.style.setProperty("--sec-out", restOut.toFixed(4));
          beat.lastIn = restIn;
          beat.lastOut = restOut;
          beat.live = false;
          beat.parked = false;
          beat.stage.removeAttribute("data-sec-live");
          beat.stage.removeAttribute("data-sec-park");
          if (beat.notail && above) settle(beat);
          else arm(beat);
        }
      },
      { rootMargin: NEAR_MARGIN, threshold: 0 }
    );
    for (const beat of beats) io.observe(beat.section);

    let resizeTimer: number | null = null;
    const onResize = () => {
      measure();
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 150);
    };
    window.addEventListener("resize", onResize);

    // Fonts and images settling shift every cached offset under them.
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);

    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      for (const beat of beats) {
        // Finish every in-flight effect in its own direction — rAF is
        // about to halt, and a half-typed line must not strand.
        if (beat.phase === "typing") settle(beat);
        else if (beat.phase === "untyping") arm(beat);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    frameRef.current = frame;

    return () => {
      frameRef.current = null;
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      if (raf !== null) window.cancelAnimationFrame(raf);
      jobs.length = 0;
      typeJobs.length = 0;
      for (const beat of beats) {
        // Restore the served text — this may be a Strict Mode remount,
        // and it must never leave blanks behind.
        for (const el of beat.decode) el.textContent = el.dataset.arcDecode ?? "";
        for (const el of beat.typed) el.textContent = el.dataset.arcType ?? "";
        beat.stage.removeAttribute("data-reveal");
        beat.stage.removeAttribute("data-sec-live");
        beat.stage.removeAttribute("data-sec-park");
        beat.stage.style.removeProperty("--sec-in");
        beat.stage.style.removeProperty("--sec-out");
        beat.stage.style.removeProperty("--arc-stage-pin");
        beat.section.removeAttribute("data-arc-tall");
        beat.section.style.removeProperty("--arc-head-pin");
      }
    };
  }, [rootRef, motion]);

  return onFrame;
}
