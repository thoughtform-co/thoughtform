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
  beatDepthUnproject,
  beatDetail,
  beatOpacity,
  beatPowerOn,
  beatRotDeg,
  beatScreenXFrac,
  beatScreenYFrac,
  beatTravelT,
  entryT,
  footT,
  ringsPassed,
  travelChase,
  travelFlight,
  travelHeadArmed,
  travelPerspectivePx,
  travelYear,
  wholeYears,
  type VwSide,
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
 *   - `--vw-z` / `--vw-o` / `--vw-blur` / `--vw-x` / `--vw-y` /
 *     `--vw-rot` / `--vw-b` / `--vw-d` on EACH beat — its depth, its
 *     opacity, its defocus, its PATH (lateral, vertical and yaw, all
 *     un-projected from a curve authored in screen fractions), its
 *     ADR-074 power-on ladder and its DETAIL gate. Hosted on the beat,
 *     never on the root (the ADR-056 U4 lesson: a root-hosted channel
 *     invalidates every beat's subtree per frame).
 *   - `data-vw-far` on beats past the fog, and `data-vw-lit` on the one
 *     close enough to show its body.
 *   - `--vw-axis` / `--vw-year` / `data-on` on `.vw-rail` — the HUD's
 *     own LEFT RAIL, which is this record's time axis (owner,
 *     2026-08-25). `data-vw-stop` stays on the root.
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

    /* The HUD's left rail is the time axis (see `RailDates`). Its host
       is created by React in an effect, so it may not exist for the
       hook's first ticks — looked up lazily, like the corridor stage
       above, and re-looked-up if it is ever replaced. */
    let railHost: HTMLElement | null = null;
    const rail = () => {
      if (!railHost || !railHost.isConnected) {
        railHost = document.querySelector<HTMLElement>(".vw-rail");
      }
      return railHost;
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
    /* ⚠ FLOORED at the source — see `wholeYears`. The DOM carries the
       record's `sortYear`, which is fractional for beats that share a
       year, and every date on this surface has to be a year the record
       actually prints. */
    const years = wholeYears(stops.map((el) => Number(el.dataset.vwYear ?? "0")));
    /* The record's own alternation, read once. ⚠ NEVER `:nth-child` — the
       film interlude is a row in this same list, so a parity selector
       flips every beat under it (ADR-074 U2). The interlude itself has no
       side and flies straight down the axis. */
    const sides: VwSide[] = stops.map((el) => (el.dataset.side === "right" ? 1 : -1));
    const axial = stops.map((el) => el.dataset.side === undefined);

    const decodes: { el: HTMLElement; to: string }[] = Array.from(
      root.querySelectorAll<HTMLElement>("[data-vw-decode]")
    ).map((el) => ({ el, to: el.textContent ?? "" }));
    const jobs: ScrambleJob[] = [];

    // Last-written values, so a frame that changes nothing writes nothing.
    const lastZ: number[] = [];
    const lastO: number[] = [];
    const lastB: number[] = [];
    const lastD: number[] = [];
    const lastX: number[] = [];
    const lastFar: boolean[] = [];
    const lastLit: boolean[] = [];
    let lastStop = -1;
    let lastAxis = -1;
    let lastEntry = -1;
    let lastFootV = -1;
    let lastPersp = -1;
    let lastYear = -1;

    /* ── THE ONE CLOCK ────────────────────────────────────────────
       The damped flight position. Every SPATIAL channel on this
       surface — the beats' depth and path, the camera's pose, the
       tunnel's flow and its ring cadence — is a function of THIS
       value, and the hook is its only writer.

       ⚠ Before it existed, the camera flew the motion follower's
       damped `voidTravel` channel while these beats were written from
       raw scroll in this rAF: one projection, two clocks, so the cards
       snapped with the wheel while the walls glided behind them.

       ⚠ The LETTERED channels deliberately stay on raw `p` — the
       active stop, the rolling year, the rail marker, the masthead's
       arm. A readout that lags reads as broken, and a damped year
       rubber-bands across its own ticks. */
    let flight = 0;
    let lastFrameMs = 0;

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
      const rl = rail();
      if (rl) {
        rl.removeAttribute("data-on");
        rl.removeAttribute("data-yr");
        rl.style.removeProperty("--vw-axis");
        rl.querySelector(".vw-rail__yr[data-now]")?.removeAttribute("data-now");
      }
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
        el.style.removeProperty("--vw-x");
        el.style.removeProperty("--vw-y");
        el.style.removeProperty("--vw-rot");
        el.style.removeProperty("--vw-d");
        el.removeAttribute("data-vw-far");
        el.removeAttribute("data-vw-lit");
      }
      lastZ.length = lastO.length = lastB.length = lastD.length = 0;
      lastX.length = lastFar.length = lastLit.length = 0;
      lastStop = lastAxis = lastEntry = lastFootV = lastPersp = lastYear = -1;
      flight = 0;
      lastFrameMs = 0;
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

      // ── the chase ───────────────────────────────────────────────
      // `p` is where the reader is; `flight` is where the FIELD is, and
      // it follows on the scene camera's own time constant. The first
      // frame of an engagement snaps (a scroll-restore or a hash-nav
      // must not fly the whole wormhole to catch up).
      const nowMs = performance.now();
      const dt = lastFrameMs > 0 ? (nowMs - lastFrameMs) / 1000 : 0;
      lastFrameMs = nowMs;
      flight = dt > 0 ? travelChase(flight, p, dt) : p;
      const settled = flight === p;

      // ── the cross-root transport ────────────────────────────────
      // ⚠ THE CAMERA CLAIM IS POSITIONAL, NOT MODAL. `engaged` above is
      // the one-time MODE setup (it runs as soon as the path is capable);
      // THIS flag is what `FlyingCameraRig` reads to TAKE the camera, and
      // it may only be true while the runway is actually under the
      // viewport.
      //
      // Set from "the page is capable" it was true from the first paint,
      // so the rig's early return parked the camera at the tunnel mouth
      // for the WHOLE PAGE: the corridor still ran its own DOM beats —
      // station titles, caption cards — while the brandmark, the
      // substrate sphere and the Arc's notation sat off-camera. Nothing
      // threw, nothing failed to load, and every guard stayed green,
      // because the scene was intact and simply not being looked at.
      //
      // `p` alone cannot carry this: it clamps to 0 both BEFORE the
      // runway and at its first pixel, so "parked at the mouth" and "a
      // whole page away from it" are the same number.
      //
      // Every consumer wants the positional reading — the camera, the
      // quality governor's engagement sample, the frame pump and the
      // tunnel painter all mean "is the reader flying right now".
      const running = r.top <= 0 && r.bottom > 0;
      // ⚠ SPATIAL, so it rides the damped value: the dive, the flow and
      // the ring cadence are the same motion the beats are making.
      const entry = entryT(flight);
      const t = vwTravelRef.current;
      t.engaged = running;
      t.p = running ? flight : 0;
      t.entry = running ? entry : 0;
      t.flight = running ? travelFlight(flight) : 0;
      t.rings = running ? ringsPassed(flight, years) : 0;
      // Within reach but not yet flying — the reader is still in
      // `#about`, a couple of viewports out. The tunnel painter warms
      // its shaders on this, so the dive's first frame is not also a
      // compile. Deliberately generous: warming early costs one draw
      // call at zero alpha, warming late costs a hitch.
      t.near = !running && r.top > 0 && r.top < vh * 2.5;

      // ── the stage's own channels ───────────────────────────────
      if (Math.abs(entry - lastEntry) >= 0.002) {
        setVar(stage, "--vw-entry", entry.toFixed(4));
        lastEntry = entry;
      }
      const ft = footT(flight);
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
      const railEl = rail();
      if (railEl) {
        // ⚠ POSITIONAL, exactly like the camera claim. Set from "the
        // page is capable" the rail would letter years for the whole
        // document and the journey diamond would be faded out on the
        // hero — which is ADR-081 U1's defect in a second place.
        if (running !== (railEl.hasAttribute("data-on") as boolean)) {
          if (running) railEl.setAttribute("data-on", "");
          else railEl.removeAttribute("data-on");
        }
        const ax = axisYearFrac(p, years);
        if (Math.abs(ax - lastAxis) >= 0.001) {
          setVar(railEl, "--vw-axis", ax.toFixed(4));
          lastAxis = ax;
        }
        // ⚠ THE RUNG THE CAR IS ON GOES GOLD — there is no second
        // readout. A year lettered beside the car sat a few pixels from
        // the rail's own label for the same year, overlapping it at
        // every rung; on a graduated axis the year IS the position.
        //
        // Discrete, so this runs a handful of times across the whole
        // travel rather than per frame — and it rides RAW `p`, not the
        // damped flight: a date that lags the reader reads as broken.
        const yr = Math.round(travelYear(p, years));
        if (yr !== lastYear) {
          lastYear = yr;
          railEl.setAttribute("data-yr", String(yr));
          railEl.querySelector(".vw-rail__yr[data-now]")?.removeAttribute("data-now");
          railEl.querySelector(`.vw-rail__yr[data-y="${yr}"]`)?.setAttribute("data-now", "");
        }
      }
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

      // The stage's live perspective, needed to un-project the authored
      // screen-space path back into CSS offsets at each beat's own depth.
      const persp =
        lastPersp > 1 ? lastPersp : travelPerspectivePx(vh, (window.innerWidth || 1) / vh);
      const vwPx = window.innerWidth || 1;

      for (let i = 0; i < n; i++) {
        const el = stops[i]!;
        const tt = beatTravelT(flight, i, n);
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
          // ⚠ QUANTISED, and it is not a rounding convenience. `filter`
          // is not a compositor-only property: a blur radius that changes
          // every frame re-rasterises the whole 680px card, three at a
          // time, and that cost lands exactly during the fastest motion.
          // Half-pixel steps are invisible at flight speed and let the
          // browser reuse the raster between them.
          const blur = Math.round(beatBlurPx(tt) * 2) / 2;
          setVar(el, "--vw-blur", `${blur.toFixed(1)}px`);
          lastO[i] = o;
        }
        const b = beatPowerOn(tt);
        if (moved(b, lastB[i] ?? -1, 0.004)) {
          setVar(el, "--vw-b", b.toFixed(4));
          lastB[i] = b;
        }

        // ── the path ─────────────────────────────────────────────
        // The interlude flies straight down the axis (it is the one stop
        // with no side); every beat swings in from its own.
        const side = sides[i]!;
        const k = beatDepthUnproject(z, persp);
        const x = axial[i] ? 0 : beatScreenXFrac(tt, side) * vwPx * k;
        if (moved(x, lastX[i] ?? -1e9, 0.6)) {
          const y = axial[i] ? 0 : beatScreenYFrac(tt, side) * vh * k;
          setVar(el, "--vw-x", `${x.toFixed(1)}px`);
          setVar(el, "--vw-y", `${y.toFixed(1)}px`);
          setVar(el, "--vw-rot", `${(axial[i] ? 0 : beatRotDeg(tt, side)).toFixed(2)}deg`);
          lastX[i] = x;
        }

        // ── slim in flight, full on park ─────────────────────────
        const d = beatDetail(tt);
        if (moved(d, lastD[i] ?? -1, 0.004)) {
          setVar(el, "--vw-d", d.toFixed(4));
          lastD[i] = d;
        }
        // The discrete half: below this the body is `content-visibility:
        // hidden`, so a wireframe drawing is never rastered in motion.
        const lit = d > 0.002;
        if (lit !== (lastLit[i] ?? false)) {
          if (lit) el.setAttribute("data-vw-lit", "");
          else el.removeAttribute("data-vw-lit");
          lastLit[i] = lit;
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

      // ⚠ THE CHASE OUTLIVES THE SCROLL EVENT. Scroll events stop the
      // instant the reader's finger does, and the field is still gliding
      // — without this the beats freeze part-way to their target and the
      // tunnel behind them (which is pumped by the corridor's own loop)
      // keeps going. Same shape as the corridor's `FrameInvalidator`: the
      // loop is kept alive by the MOTION, not by the input.
      if (!settled) requestTick();
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
