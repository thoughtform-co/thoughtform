"use client";

import { useEffect, type RefObject } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import {
  VW_BEAT_WINDOW,
  beatProgress,
  beatsPassed,
  headArmed,
  readLineY,
  spineProgress,
} from "@/lib/voidwalker/voidwalkerClock";

/** Seconds between consecutive decode targets (title, then each lede run). */
const DECODE_STAGGER_S = 0.14;

/**
 * useVoidwalkerScroll — the `#voidwalker` section's single scroll writer
 * (ADR-074). Writes, all delta-gated, all removed on disengage:
 *
 *   - `data-vw-ready` on the `.vw` root — the CSS mode switch. ABSENT is
 *     the rest state (every panel on, the spine drawn, the diamonds
 *     filled), which is also the no-JS and the reduced-motion state: the
 *     sheet's motion block is gated on the attribute, so a path that never
 *     engages reads as a finished page, never a dark one.
 *   - `--vw-b` on the head and on EACH beat — that beat's own 0…1 arrival
 *     (`beatProgress`), from which its children derive `--ci` through the
 *     `--ci-off` ladder (about-stage.css's terminal power-on). Hosted on
 *     the beat, never on the root: a root-hosted channel invalidates every
 *     beat's subtree on every frame (the ADR-056 U4 lesson).
 *   - `--vw-p` on the spine — the drawn fraction of the gold segment.
 *   - `data-vw-beat` on the root — how many markers the reading line has
 *     passed (an integer; a cheap hook for the smoke and for CSS).
 *   - the masthead's `[data-vw-decode]` runs (the title, the lede's runs)
 *     — decoded by the caption kernel on arm, un-typed on disarm (the
 *     masthead law: it never moves or fades; it types in and un-types out,
 *     in place). Each run is its own target so the lede's gold emphasis
 *     survives the kernel's `textContent` writes.
 *
 * Measurement is the OFFSET CHAIN (transform-independent — the ladder's
 * 2.5px tear rides the panels, never the markers), taken on mount, on
 * resize, when fonts land, and whenever the section OR the document body
 * resizes (the services runway inflates the page above this station
 * asynchronously; a ResizeObserver on the body is what catches that
 * without a per-frame layout read). Per frame the hook reads `scrollY`
 * and `innerHeight` and nothing else — zero layout reads on the scroll
 * path.
 *
 * Reversible by construction: every value is a pure function of the
 * current scroll and the cached layout (`voidwalkerClock.ts`, unit-pinned).
 *
 * Gate: `(prefers-reduced-motion: no-preference)` only — the clock runs on
 * every width. ⚠ If a width gate is ever added here, the sheet's rest
 * block must take the SAME pair (the proof.md "PRM unwraps the console
 * too" convention) or one path gets a dark section.
 */
export function useVoidwalkerScroll(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motionMedia = window.matchMedia("(prefers-reduced-motion: no-preference)");

    let frame = 0;
    let disposed = false;
    let engaged = false;
    let armed = false;
    /** The decode runs and their finals, read ONCE from the rendered text
     *  (the live spans render WITH their copy — pre-rendering them blank
     *  would break hydration). */
    const decodes: { el: HTMLElement; to: string }[] = Array.from(
      root.querySelectorAll<HTMLElement>("[data-vw-decode]")
    ).map((el) => ({ el, to: el.textContent ?? "" }));
    const jobs: ScrambleJob[] = [];

    // Cached layout (page-Y). Refreshed by `measure`, never per frame.
    let headTop = 0;
    let spineTop = 0;
    let spineH = 0;
    let markerYs: number[] = [];
    let beats: HTMLElement[] = [];
    let head: HTMLElement | null = null;
    let spine: HTMLElement | null = null;
    let sectionTop = 0;
    let sectionH = 0;
    let outOfBandFlushed: "above" | "below" | null = null;

    // Last-written values, so a frame that changes nothing writes nothing.
    let lastP = -1;
    let lastCount = -1;
    const lastB: number[] = [];
    let lastHeadB = -1;

    const pageTop = (el: HTMLElement) => {
      let y = 0;
      let n: HTMLElement | null = el;
      while (n && n !== document.body) {
        y += n.offsetTop;
        n = n.offsetParent as HTMLElement | null;
      }
      return y;
    };

    const measure = () => {
      head = root.querySelector<HTMLElement>(".vw-head");
      spine = root.querySelector<HTMLElement>(".vw__spine");
      beats = Array.from(root.querySelectorAll<HTMLElement>(".vw-beat"));
      headTop = head ? pageTop(head) : pageTop(root);
      if (spine) {
        spineTop = pageTop(spine);
        spineH = spine.offsetHeight;
      }
      markerYs = beats.map((b) => {
        const d = b.querySelector<HTMLElement>(".vw-beat__diamond");
        return d ? pageTop(d) + d.offsetHeight / 2 : pageTop(b);
      });
      sectionTop = pageTop(root);
      sectionH = root.offsetHeight;
      // Layout moved under the cached values — force the next frame to
      // re-write everything.
      lastP = -1;
      lastCount = -1;
      lastB.length = 0;
      lastHeadB = -1;
      outOfBandFlushed = null;
    };

    const setVar = (el: HTMLElement, name: string, v: number) => {
      el.style.setProperty(name, v.toFixed(4));
    };

    const disengage = () => {
      if (!engaged) return;
      engaged = false;
      root.removeAttribute("data-vw-ready");
      root.removeAttribute("data-vw-beat");
      spine?.style.removeProperty("--vw-p");
      head?.style.removeProperty("--vw-b");
      for (const b of beats) b.style.removeProperty("--vw-b");
      // Restore the finals — the rest state letters the full masthead.
      jobs.length = 0;
      for (const d of decodes) d.el.textContent = d.to;
      armed = false;
    };

    /** One full write for a given scroll position. */
    const writeAt = (scrollY: number, vh: number) => {
      const lineY = readLineY(scrollY, vh);
      const win = vh * VW_BEAT_WINDOW;

      const p = spineProgress(lineY, spineTop, spineH);
      if (spine && Math.abs(p - lastP) >= 0.002) {
        setVar(spine, "--vw-p", p);
        lastP = p;
      }
      // Delta-gated, but the ENDPOINTS always land: a clock resting at
      // 0.0024 because the last write was inside the gate is a panel at
      // 1 % opacity that should be dark.
      const moved = (next: number, prev: number) =>
        next !== prev && (next === 0 || next === 1 || Math.abs(next - prev) >= 0.004);
      if (head) {
        const hb = beatProgress(lineY, headTop + vh * 0.12, win);
        if (moved(hb, lastHeadB)) {
          setVar(head, "--vw-b", hb);
          lastHeadB = hb;
        }
      }
      for (let i = 0; i < beats.length; i++) {
        const b = beatProgress(lineY, markerYs[i] ?? 0, win);
        const prev = lastB[i] ?? -1;
        if (moved(b, prev)) {
          setVar(beats[i]!, "--vw-b", b);
          lastB[i] = b;
        }
      }
      const count = beatsPassed(lineY, markerYs);
      if (count !== lastCount) {
        root.setAttribute("data-vw-beat", String(count));
        lastCount = count;
      }
    };

    const tick = () => {
      frame = 0;
      if (disposed) return;
      if (!motionMedia.matches) {
        disengage();
        return;
      }
      if (!engaged) {
        engaged = true;
        root.setAttribute("data-vw-ready", "");
        measure();
      }
      const scrollY = window.scrollY;
      const vh = window.innerHeight || 1;

      // Out of band (more than a viewport above or below the section): one
      // terminal flush, then nothing until the section comes back.
      const viewTop = scrollY;
      const viewBottom = scrollY + vh;
      const band: "above" | "below" | null =
        viewBottom < sectionTop - vh
          ? "above"
          : viewTop > sectionTop + sectionH + vh
            ? "below"
            : null;
      if (band) {
        if (outOfBandFlushed !== band) {
          writeAt(scrollY, vh);
          outOfBandFlushed = band;
        }
      } else {
        outOfBandFlushed = null;
        writeAt(scrollY, vh);
      }

      // The masthead decode — hysteresis around the arm line.
      const nextArmed = headArmed(armed, scrollY, vh, headTop);
      if (nextArmed !== armed) {
        armed = nextArmed;
        const now = performance.now() / 1000;
        decodes.forEach((d, i) => {
          const at = now + i * DECODE_STAGGER_S;
          if (armed) {
            // Type in: blank, then decode toward the final (the kernel
            // no-ops on equal text, so an already-decoded run is left be —
            // nothing the reader can already see is blanked).
            if (d.el.textContent !== d.to) {
              d.el.textContent = "";
              queueScramble(jobs, d.el, d.to, at);
            }
          } else {
            // Un-type: scramble back to nothing — the reverse of the
            // arrival, never a fade (the masthead law).
            queueScramble(jobs, d.el, "", at);
          }
        });
      }
      if (jobs.length) {
        advanceScrambles(jobs, performance.now() / 1000);
        // A decode must finish even if the reader stops scrolling.
        if (jobs.length) requestTick();
      }
    };

    const requestTick = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(tick);
    };
    const remeasure = () => {
      if (!engaged) return;
      measure();
      requestTick();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        // rAF stops in a hidden document — settle every in-flight decode
        // to its target so a tab switch never strands half-typed copy.
        for (const j of jobs) j.el.textContent = j.to;
        jobs.length = 0;
      } else {
        requestTick();
      }
    };

    // First measure + frame. If the head is already above the arm line
    // (deep link, reload mid-page) the first tick arms it and the kernel
    // sees from === to, so nothing the reader can already see is blanked.
    requestTick();
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", remeasure);
    document.addEventListener("visibilitychange", onVisibility);
    motionMedia.addEventListener?.("change", requestTick);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(remeasure) : null;
    ro?.observe(root);
    ro?.observe(document.body);
    document.fonts?.ready.then(remeasure).catch(() => {});
    // Late-hydration settle passes (the services runway above inflates
    // asynchronously — the about hook's precedent).
    const t1 = window.setTimeout(remeasure, 600);
    const t2 = window.setTimeout(remeasure, 1800);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", remeasure);
      document.removeEventListener("visibilitychange", onVisibility);
      motionMedia.removeEventListener?.("change", requestTick);
      ro?.disconnect();
      disengage();
    };
  }, [rootRef]);
}
