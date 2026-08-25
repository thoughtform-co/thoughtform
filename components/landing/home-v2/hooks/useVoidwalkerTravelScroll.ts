"use client";

import { useEffect, type RefObject } from "react";

import { VOIDWALKER_TIME_TUNNEL } from "../unifiedServicesInstrument";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { clearVwTravel, vwTravelRef } from "@/lib/home-v2/vwTravelRef";
import {
  activeStop,
  axisYearFrac,
  beatBlurPx,
  beatDepthPx,
  beatOpacity,
  beatPowerOn,
  beatTravelT,
  entryT,
  footT,
  ringsPassed,
  travelFlight,
  travelHeadArmed,
  travelPerspectivePx,
  travelYear,
} from "@/lib/voidwalker/voidwalkerTravelClock";
import { clamp01 } from "@/lib/math";

/** Seconds between consecutive decode targets (title, then each lede run). */
const DECODE_STAGGER_S = 0.14;

/** |t| at or past which a stop is fully invisible and can stop painting.
 *  Written as a discrete attribute, not a per-frame style, so the browser
 *  drops the subtree's paint work without a var read. */
const FAR_CUTOFF = 0.995;

/**
 * useVoidwalkerTravelScroll — the VOIDWALKER TIME TUNNEL's single scroll
 * writer (ADR-081). It is the `useAboutStageScroll` pinned-stage recipe
 * applied to the through-line, and it writes:
 *
 *   - `data-vw-mode="travel"` on `#voidwalker` — the CSS mode switch that
 *     turns the runway on, makes the station transparent over the live
 *     corridor canvas, and flips the beats into the perspective field.
 *     Removed on ANY disengage (flag off, media gate, corridor fallback,
 *     unmount), so every failure mode collapses to the ADR-074 vertical
 *     timeline (fail-static).
 *   - `--vw-bg-in` on `#voidwalker` — the fail-opaque shield's channel
 *     (unwritten ⇒ 1 ⇒ opaque station). Written 0 once at engage; only
 *     the disengage var-clear restores it. This is the `--about-bg-in`
 *     recipe, and it is why a JS failure mid-travel leaves an ordinary
 *     opaque station rather than a hole onto the canvas.
 *   - `--vw-persp` on the stage — the CSS perspective DERIVED from the
 *     scene camera's own FOV, so the DOM beats and the WebGL tunnel
 *     project identically. Two layers with different projections read as
 *     a sticker over a video; this is the one number that prevents it.
 *   - `--vw-z` / `--vw-o` / `--vw-blur` / `--vw-b` on EACH beat — its
 *     depth, opacity, defocus and its own ADR-074 power-on ladder.
 *     Hosted on the beat, never on the root (the ADR-056 U4 lesson: a
 *     root-hosted channel invalidates every beat's subtree per frame).
 *   - `data-vw-far` on beats that are past the fog at either end.
 *   - `--vw-axis` / `--vw-year` / `data-vw-stop` on the root — the
 *     graduated axis's marker, its rolling year readout, and the active
 *     stop (ADR-081's date grammar: the years are POSITIONS).
 *   - `--vw-entry` / `--vw-foot` on the stage — the dive and the tail.
 *   - `vwTravelRef` — the cross-root transport the canvas reads.
 *   - the masthead's `[data-vw-decode]` runs — typed in as the wormhole
 *     opens, un-typed as the first beat takes the plane (the masthead
 *     law: it never moves and never fades).
 *
 * Progress is `clamp01(−root.top / (root.height − vh))` over the
 * `.vw-travel-root` runway — the `useAboutStageScroll` formula, clamping
 * to 0 above and 1 below with no latch and no release guard.
 *
 * Per frame this reads ONE rect (the runway's) and nothing else; the
 * per-beat numbers are pure functions of that one clamped scalar
 * (`voidwalkerTravelClock.ts`, unit-pinned). Reversible by construction.
 *
 * ⚠ Gate: the flag AND `(min-width: 961px) and (prefers-reduced-motion:
 * no-preference)` AND not the corridor fallback — the SAME pair the rest
 * of the site's 3D beats use. Below it `useVoidwalkerScroll` keeps
 * driving the vertical timeline exactly as it does today; the two hooks
 * are mutually exclusive by construction (see `enabled` in the station),
 * so `--vw-b` never has two writers.
 */
export function useVoidwalkerTravelScroll(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean
): void {
  useEffect(() => {
    if (!VOIDWALKER_TIME_TUNNEL || !enabled) return;
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    let disposed = false;
    let engaged = false;
    let armed = false;

    const capableMedia = window.matchMedia(
      "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
    );
    let corridorStage: HTMLElement | null = null;
    const fallbackActive = () => {
      if (!corridorStage || !corridorStage.isConnected) {
        corridorStage = document.querySelector<HTMLElement>(".home-v2-stage");
      }
      return !corridorStage || corridorStage.dataset.fallback === "true";
    };

    const station = root.closest<HTMLElement>("#voidwalker");
    const runway = root.querySelector<HTMLElement>(".vw-travel-root");
    const stage = root.querySelector<HTMLElement>(".vw-travel-stage");
    const head = root.querySelector<HTMLElement>(".vw-head");
    const foot = root.querySelector<HTMLElement>(".vw-foot");
    /* ⚠ THE INTERLUDE IS A STOP HERE, unlike in the vertical clock. In 2D
       it is deliberately not a beat (it carries no marker chip and must
       not shift the beats under it); in the tunnel it is a thing that
       flies at you like any other, so it takes a stop of its own and the
       schedule counts it. */
    const stops = Array.from(root.querySelectorAll<HTMLElement>(".vw-beat"));
    const years = stops.map((el) => Number(el.dataset.vwYear ?? "0"));

    const decodes: { el: HTMLElement; to: string }[] = Array.from(
      root.querySelectorAll<HTMLElement>("[data-vw-decode]")
    ).map((el) => ({ el, to: el.textContent ?? "" }));
    const jobs: ScrambleJob[] = [];

    // Last-written values, so a frame that changes nothing writes nothing.
    const lastZ: number[] = [];
    const lastO: number[] = [];
    const lastB: number[] = [];
    const lastFar: boolean[] = [];
    let lastStop = -1;
    let lastAxis = -1;
    let lastEntry = -1;
    let lastFootV = -1;
    let lastPersp = -1;

    const setVar = (el: HTMLElement, name: string, v: string) => {
      el.style.setProperty(name, v);
    };

    const applyPerspective = () => {
      if (!stage) return;
      const vh = window.innerHeight || 1;
      const aspect = (window.innerWidth || 1) / vh;
      const px = travelPerspectivePx(vh, aspect);
      if (Math.abs(px - lastPersp) < 0.5) return;
      setVar(stage, "--vw-persp", `${px.toFixed(1)}px`);
      lastPersp = px;
    };

    const disengage = () => {
      if (!engaged) return;
      engaged = false;
      station?.removeAttribute("data-vw-mode");
      station?.style.removeProperty("--vw-bg-in");
      root.removeAttribute("data-vw-ready");
      root.removeAttribute("data-vw-stop");
      root.style.removeProperty("--vw-axis");
      root.style.removeProperty("--vw-year");
      stage?.style.removeProperty("--vw-persp");
      stage?.style.removeProperty("--vw-entry");
      stage?.style.removeProperty("--vw-foot");
      head?.style.removeProperty("--vw-b");
      foot?.style.removeProperty("--vw-b");
      for (const el of stops) {
        el.style.removeProperty("--vw-z");
        el.style.removeProperty("--vw-o");
        el.style.removeProperty("--vw-blur");
        el.style.removeProperty("--vw-b");
        el.removeAttribute("data-vw-far");
      }
      lastZ.length = lastO.length = lastB.length = lastFar.length = 0;
      lastStop = lastAxis = lastEntry = lastFootV = lastPersp = -1;
      // Restore the finals — the rest state letters the full masthead.
      jobs.length = 0;
      for (const d of decodes) d.el.textContent = d.to;
      armed = false;
      clearVwTravel();
    };

    const tick = () => {
      frame = 0;
      if (disposed) return;
      if (!runway || !stage || !station) return;

      const capable = capableMedia.matches && !fallbackActive();
      if (!capable) {
        disengage();
        return;
      }

      if (!engaged) {
        engaged = true;
        station.setAttribute("data-vw-mode", "travel");
        station.style.setProperty("--vw-bg-in", "0");
        // ⚠ `data-vw-ready` GATES THE WHOLE MOTION BLOCK in voidwalker.css
        // — the `--ci-off` power-on ladder, the per-word title brighten AND
        // the masthead's decode two-layer recipe (the ghost only goes
        // transparent under it). Without it every `--vw-b` this hook writes
        // is inert and the masthead's ghost stays painted over the field,
        // which is exactly what the light capture caught. The travel is a
        // motion mode like the vertical one; it declares itself the same way.
        root.setAttribute("data-vw-ready", "");
        // The mode flip changes layout (the runway inflates from nothing
        // to 14 viewports) — measure the perspective AFTER it applies.
        window.requestAnimationFrame(() => {
          applyPerspective();
          requestTick();
        });
      }

      const vh = window.innerHeight || 1;
      const r = runway.getBoundingClientRect();
      const travel = r.height - vh;
      const p = travel > 0 ? clamp01(-r.top / travel) : 0;
      const n = stops.length;

      // ── the cross-root transport ────────────────────────────────
      const entry = entryT(p);
      const t = vwTravelRef.current;
      t.engaged = true;
      t.p = p;
      t.entry = entry;
      t.flight = travelFlight(p);
      t.rings = ringsPassed(p, years);

      // ── the stage's own channels ───────────────────────────────
      if (Math.abs(entry - lastEntry) >= 0.002) {
        setVar(stage, "--vw-entry", entry.toFixed(4));
        lastEntry = entry;
      }
      const ft = footT(p);
      if (Math.abs(ft - lastFootV) >= 0.002) {
        setVar(stage, "--vw-foot", ft.toFixed(4));
        lastFootV = ft;
      }
      // The head and the foot ride the same power-on ladder the beats do,
      // so their `--ci-off` children behave identically in both modes.
      head?.style.setProperty("--vw-b", entry.toFixed(4));
      foot?.style.setProperty("--vw-b", ft.toFixed(4));

      // ── the graduated axis ─────────────────────────────────────
      // ⚠ Measured in YEARS, not runway (see `axisYearFrac`): the ticks
      // are placed proportionally to elapsed time, so a marker driven by
      // scroll fraction would land between its own ticks.
      const ax = axisYearFrac(p, years);
      if (Math.abs(ax - lastAxis) >= 0.001) {
        setVar(root, "--vw-axis", ax.toFixed(4));
        lastAxis = ax;
      }
      const yr = travelYear(p, years);
      // The readout letters whole years — a fractional year is not a date.
      root.style.setProperty("--vw-year", `"${Math.round(yr)}"`);
      const stop = activeStop(p, n);
      if (stop !== lastStop) {
        root.setAttribute("data-vw-stop", String(stop));
        lastStop = stop;
      }

      // ── the field ──────────────────────────────────────────────
      // Endpoints always land: a beat resting at 0.0024 because the last
      // write fell inside the delta gate is a plate at 1 % opacity that
      // should be gone (the ADR-074 `moved()` rule).
      const moved = (next: number, prev: number, q: number) =>
        next !== prev && (next === 0 || next === 1 || Math.abs(next - prev) >= q);

      for (let i = 0; i < n; i++) {
        const el = stops[i]!;
        const tt = beatTravelT(p, i, n);
        const z = beatDepthPx(tt);
        const o = beatOpacity(tt);
        const far = Math.abs(tt) >= FAR_CUTOFF;

        if (far !== (lastFar[i] ?? false)) {
          if (far) el.setAttribute("data-vw-far", "");
          else el.removeAttribute("data-vw-far");
          lastFar[i] = far;
        }
        // A stop that is not painting needs no per-frame numbers.
        if (far) continue;

        if (moved(z, lastZ[i] ?? -1e9, 0.6)) {
          setVar(el, "--vw-z", `${z.toFixed(1)}px`);
          lastZ[i] = z;
        }
        if (moved(o, lastO[i] ?? -1, 0.004)) {
          setVar(el, "--vw-o", o.toFixed(4));
          setVar(el, "--vw-blur", `${beatBlurPx(tt).toFixed(2)}px`);
          lastO[i] = o;
        }
        const b = beatPowerOn(tt);
        if (moved(b, lastB[i] ?? -1, 0.004)) {
          setVar(el, "--vw-b", b.toFixed(4));
          lastB[i] = b;
        }
      }

      // ── the masthead decode ────────────────────────────────────
      const nextArmed = travelHeadArmed(armed, p);
      if (nextArmed !== armed) {
        armed = nextArmed;
        const now = performance.now() / 1000;
        decodes.forEach((d, i) => {
          const at = now + i * DECODE_STAGGER_S;
          if (armed) {
            if (d.el.textContent !== d.to) {
              d.el.textContent = "";
              queueScramble(jobs, d.el, d.to, at);
            }
          } else {
            queueScramble(jobs, d.el, "", at);
          }
        });
      }
      if (jobs.length) {
        advanceScrambles(jobs, performance.now() / 1000);
        if (jobs.length) requestTick();
      }
    };

    const requestTick = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(tick);
    };
    const onResize = () => {
      applyPerspective();
      requestTick();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        // rAF stops in a hidden document — settle every in-flight decode
        // so a tab switch never strands half-typed copy.
        for (const j of jobs) j.el.textContent = j.to;
        jobs.length = 0;
      } else {
        requestTick();
      }
    };

    requestTick();
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    capableMedia.addEventListener?.("change", onResize);
    // Late-hydration settle passes: the services runway above inflates the
    // page asynchronously, so the runway's rect is not final on mount (the
    // about hook's precedent).
    const t1 = window.setTimeout(onResize, 600);
    const t2 = window.setTimeout(onResize, 1800);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      capableMedia.removeEventListener?.("change", onResize);
      disengage();
    };
  }, [rootRef, enabled]);
}
