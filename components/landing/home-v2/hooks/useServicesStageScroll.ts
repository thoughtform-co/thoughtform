"use client";

import { useEffect, type RefObject } from "react";

import {
  activeServiceForProgress,
  exitProgressForRunway,
  splitServicesRunway,
} from "@/lib/services-ring/ringMath";
import { clamp01 } from "@/lib/math";
import { readCorridorDissipate } from "@/lib/home-v2/corridorDissipateRef";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { SERVICES_PROOF_RUNWAY_VH } from "../unifiedServicesInstrument";

/** The pinned stage: the ring holds Advisory front through a short arrival
 *  while the corridor→services dissipate settles, then the first scroll
 *  rotates the remaining services front (arrival remap, 2026-07-17), and the
 *  final `RING_EXIT_START` band is the EXIT-HOLD (ADR-030) during which the
 *  last card dwells while the next station sweeps up. `data-active-step` is
 *  the front-card index (`activeServiceForProgress`, round of the continuous
 *  ring index), so the step clock tracks the ring EXACTLY — they can never
 *  drift (ADR-029 guardrail). The runway `min-height` in services.css keys
 *  off RING_STEP_COUNT for its total scroll length. */

/**
 * Brandmark "arrive" envelopes, in `--corridor-dissipate` units (0..1 —
 * the corridor-exit dissipate clock that `useCorridorExitScroll` writes on
 * `<html>` as the sphere expands and `#services` scrolls in).
 *
 * The centerpiece brandmark hands off from the inside-sphere mark (which
 * fades OUT across dissipate 0.5 → 0.95 in `ProjectedBrandmarkActor`). To
 * avoid a "dives away → gap → reappears" read, the SHRINK (scale) runs the
 * full dive while the FADE-IN (opacity) is kept EARLIER + tighter, so the
 * mark is already prominent and visibly shrinking while the sphere mark is
 * still on screen — a cross-dissolve, not a swap.
 *
 *   SHRINK: scale `--svc-arrive-from` → 1 across [SHRINK_START, SHRINK_END]
 *   FADE:   opacity 0 → 1            across [FADE_START,   FADE_END]
 *
 * These four edges are the timing knobs. Lower the FADE edges to bring the
 * mark on sooner (more overlap with the sphere); widen the SHRINK band for
 * a longer, slower shrink.
 */
const SHRINK_START = 0.35;
const SHRINK_END = 0.97;
const FADE_START = 0.4;
const FADE_END = 0.65;

/**
 * Services content entrance (2026-06-20). The list + paragraph fade/rise
 * IN off the corridor-exit dissipate, DELAYED so the in-sphere particle
 * core has already shrunk to the centred centerpiece before the copy
 * arrives. `smootherstep` (C2-continuous) gives a gentle ease-in/out, and
 * the late start (`CONTENT_IN_START`) is the "delay". `--svc-content-in`
 * (0..1) is mapped to opacity + a small upward translate in `services.css`.
 */
// Delayed so the hologram has finished its dome→wireframe transform before the
// DOM overlays (cards, orbits, scan notes) arrive over it.
const CONTENT_IN_START = 0.7;
const CONTENT_IN_END = 1.0;

/**
 * Proof casefile envelopes (ADR-056), in the two clocks the stage already has.
 *
 * ARRIVAL rides the DISSIPATE — the brandmark's own centering clock — so the
 * panels assemble WITH the mark as it moves to centre, each travelling in
 * from its own direction (the casefile sheet's TERMINAL POWER-ON block).
 * Owner call, 2026-07-28, superseding the earlier runway-travel delay: that
 * delay existed because a static fade-up overlapping the epilogue signal's
 * exit read as the two fighting. With directional travel the overlap IS the
 * choreography — the elements arrive out of the same motion that carries the
 * previous centre away — so the `proofP` arrival factor is gone and the
 * timing question dissolved with it.
 *
 * The band is NOT `CONTENT_IN_*`: that pair also times the services copy
 * (`--svc-content-in`), a different beat. These edges open while the mark is
 * still visibly travelling and close just before it parks.
 *
 * DEPARTURE and RELEASE ride the casefile's runway share, and since
 * 2026-07-29 they deliberately OVERLAP — reversing the earlier call.
 *
 * The old windows were strictly sequential (out ended at 0.86 exactly where
 * release began) on the theory that a gap makes the handover read as a page
 * turn. It did not. With both sides moving as one object each — a whole-plane
 * fade out, then a flat simultaneous opacity ramp in — the gap read as the
 * offer appearing out of nowhere (owner, 2026-07-29). The fix is not more
 * separation but LESS: the casefile now FOLDS INWARD (per-panel LIFO travel +
 * a scrubbed iris, casefile.css) and the offer ASSEMBLES on a ladder
 * (`--sc`, services.css), so they are no longer two blocks that would smear
 * through each other — they are two choreographies that interlock.
 *
 * THE RELEASE OWNS THE WHOLE DWELL (owner, 2026-07-29 round 3: "when you're
 * in the proof section and you scroll, the transition should immediately
 * start"). Measured, `--svc-proof-in` saturates 100px into the runway — the
 * panels assemble during the APPROACH, on the dissipate, so the casefile is
 * already settled when the stage pins. Every runway pixel before the release
 * opened was therefore dead: at a 0.62 start on the old 2.8-viewport dwell,
 * that was 1550px — 1.7 viewports of scrolling with nothing to show for it,
 * which is exactly the complaint. So the release now spans [0, 1] and the
 * dwell shrank to 1.2 viewports. Both moves point the same way: the ramp
 * gets MORE scroll in absolute pixels (~1080 vs ~958) on a runway less than
 * half as long.
 *
 * `smootherstep`'s flat first third IS the settle hold — ~140px where the
 * casefile reads as a stable object before the fold opens at 0.13. Do not
 * add a hold in front of it; that is the dead zone coming back.
 *
 * The fold's edges are then placed by VALUE ON THE RELEASE RAMP, not by
 * eye: 0.13 and 0.66 are where the release reads ≈0.016 and ≈0.78, the two
 * crossings the previous tuning was validated at. That is what keeps
 * `REVEAL_AT` and `PROOF_OWNS_BELOW` — both readings on this ramp — correct
 * through a reshape that is nowhere near proportional. Judge this band by
 * the VALUES at the crossing, never by the edges: at proofP 0.52 the
 * casefile reads ≈0.43 against content-in ≈0.52.
 *
 * The release is also the RING'S ENTRANCE CLOCK (`CorridorArmillary` feeds it
 * into the entrance envelope), so the cards arrive MOVING on their ADR-029
 * directional fly-in rather than fading up in place. Its 0.30 span across a
 * 2.8-viewport dwell gives that fly-in ~0.25 viewports of scroll; the old
 * 0.14 span across 2.4 gave it under 0.07, which is why the cards read as
 * popping in however correct their envelope was.
 *
 * ⚠ Retiming the handoff happens HERE, in proofP space. Never in
 * `RING_ENTRANCE_WINDOWS` — those ride the raw dissipate, which saturated
 * long ago (`.claude/rules/services-ring.md`).
 */
const PROOF_GATE_START = 0.52;
const PROOF_GATE_END = 0.95;
const PROOF_OUT_START = 0.13;
const PROOF_OUT_END = 0.66;
const PROOF_RELEASE_START = 0.0;
const PROOF_RELEASE_END = 1.0;

// `clamp01` now comes from `@/lib/math` (Phase-5 consolidation). The local
// `smoothstep`/`smootherstep` below keep their own implementations because
// of the `edge1 <= edge0` degenerate-edge guard.
/** Smoothstep on [edge0, edge1]. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Smootherstep on [edge0, edge1] — C2-continuous (zero 1st AND 2nd
 *  derivative at both ends), so reveals read as a gentle settle rather
 *  than the slight kick smoothstep has at its endpoints. */
function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * useServicesStageScroll — single-rAF scroll watcher for the pinned
 * Services stage. Writes three channels on the sticky `.services-stage`
 * element:
 *
 *   - `data-active-step` (0..2): which service the runway scroll is on;
 *     `services.css` keys the left-list highlight + right-paragraph
 *     crossfade off it.
 *   - `--svc-arrive` (0..1): the brandmark SHRINK envelope, eased from the
 *     corridor-exit dissipate (`--corridor-dissipate` on `<html>`). 0 =
 *     sphere-scaled, 1 = parked at centerpiece size.
 *   - `--svc-arrive-op` (0..1): the brandmark FADE-IN envelope (kept
 *     earlier/tighter than the shrink so the mark cross-dissolves with the
 *     inside-sphere mark instead of reappearing after it).
 *
 * `services.css` maps `--svc-arrive` to the brandmark's scale and
 * `--svc-arrive-op` to its opacity, so the mark shrinks in as the user
 * dives into `#services` — a continuous handoff from the inside-sphere
 * brandmark. The corridor / sphere are NOT touched; this only READS the
 * dissipate the corridor already publishes.
 *
 * Why a rect-rAF read of the runway (not IntersectionObserver) for the
 * step: the stage is pinned, so its content does not move relative to the
 * viewport during a segment — IO sentinels would only fire at the pin
 * boundaries and leave the active step stale mid-pin.
 *
 * On mobile / reduced motion the stage is a static vertical list — the
 * hook parks `data-active-step="0"` and both envelopes at 1 (no shrink).
 *
 * @param stageRef ref to the sticky `.services-stage` element. Its parent
 *   is the `.services-stage-root` runway the step progress is read from.
 */
export function useServicesStageScroll(
  stageRef: RefObject<HTMLElement | null>,
  onStepChange?: (step: number) => void
): void {
  useEffect(() => {
    let frame = 0;
    let disposed = false;
    let currentStep = -1;
    let currentShrink = -1;
    let currentFade = -1;
    let currentContentIn = -1;
    let currentExit = -1;
    let currentProofIn = -1;
    let currentProofOut = -1;
    let currentProofLive: boolean | null = null;

    const isInert = () =>
      (window.matchMedia?.("(max-width: 960px)").matches ?? false) ||
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

    const setStep = (stage: HTMLElement, step: number) => {
      const stepValue = String(step);
      if (step === currentStep && stage.getAttribute("data-active-step") === stepValue) return;
      stage.setAttribute("data-active-step", stepValue);
      currentStep = step;
      onStepChange?.(step);
    };

    const setArrive = (stage: HTMLElement, shrink: number, fade: number) => {
      if (Math.abs(shrink - currentShrink) >= 0.001) {
        stage.style.setProperty("--svc-arrive", shrink.toFixed(4));
        currentShrink = shrink;
      }
      if (Math.abs(fade - currentFade) >= 0.001) {
        stage.style.setProperty("--svc-arrive-op", fade.toFixed(4));
        currentFade = fade;
      }
    };

    // Write deadband for the two high-fan-out channels (2026-07-29 perf
    // pass): every `--svc-content-in` / `--svc-proof-*` write invalidates
    // computed style for its whole host subtree, and 0.0025 is <0.3% of
    // an opacity ramp / <0.15px of panel travel — invisible, while
    // halving writes on damped settle tails. `--svc-exit` keeps the
    // tighter 0.001 (the decommission seam is threshold-sensitive).
    const WRITE_EPS = 0.0025;

    const setContentIn = (stage: HTMLElement, v: number) => {
      if (Math.abs(v - currentContentIn) >= WRITE_EPS) {
        stage.style.setProperty("--svc-content-in", v.toFixed(4));
        currentContentIn = v;
      }
    };

    // Decommission clock mirror (ADR-030 Update 1) — CSS-readable copy of
    // exitProgressForRunway(p). Not load-bearing for the 3D consumers
    // (they derive the same pure function from the ref), but it gives CSS
    // and the smoke tests a channel.
    const setExit = (stage: HTMLElement, v: number) => {
      if (Math.abs(v - currentExit) >= 0.001) {
        stage.style.setProperty("--svc-exit", v.toFixed(4));
        currentExit = v;
      }
    };

    // Proof casefile channels (ADR-056). Written on the CASEFILE HOST
    // (`.fl-case`), not the stage (2026-07-29 perf pass): every consumer —
    // the sheet's arrival/departure clamps and the casefile controller's
    // own clock read — lives inside that subtree, and stage-hosted writes
    // were invalidating computed style for the stage's ~350 nodes (156 of
    // them a display:none plate rack) every scroll frame of the dwell.
    // `data-proof-live` STAYS on the stage — CSS selectors and the smoke
    // spec key off it there. Null host (flag off ⇒ casefile unmounted) is
    // fine: nothing consumes the channels then.
    let proofHostEl: HTMLElement | null = null;
    const proofHost = (stage: HTMLElement): HTMLElement | null => {
      if (!proofHostEl || !proofHostEl.isConnected) {
        proofHostEl = stage.querySelector<HTMLElement>(".fl-case");
      }
      return proofHostEl;
    };
    const setProof = (stage: HTMLElement, inV: number, outV: number) => {
      const host = proofHost(stage);
      if (host) {
        if (Math.abs(inV - currentProofIn) >= WRITE_EPS) {
          host.style.setProperty("--svc-proof-in", inV.toFixed(4));
          currentProofIn = inV;
        }
        if (Math.abs(outV - currentProofOut) >= WRITE_EPS) {
          host.style.setProperty("--svc-proof-out", outV.toFixed(4));
          currentProofOut = outV;
        }
      }
      // HIT-TESTING GATE. Opacity 0 does NOT remove an element from the hit
      // test, and the casefile's tabs and rows deliberately opt back into
      // `pointer-events: auto` — so a departed casefile at z 6 keeps
      // swallowing clicks meant for the ring's hit areas at z 4. The sheet
      // hangs `visibility` off this attribute, which drops the whole subtree
      // out of hit-testing in one move.
      const live = inV * (1 - outV) > 0.01;
      if (live !== currentProofLive) {
        if (live) stage.setAttribute("data-proof-live", "1");
        else stage.removeAttribute("data-proof-live");
        currentProofLive = live;
      }
    };

    // The runway's height is STATIC CSS on purpose — it has to exist before
    // hydration so `useCorridorExitScroll`'s first `servicesRect` read is
    // stable. That sheet defaults to the flag-ON height, so the rollback path
    // is the one that pays: with the casefile off, collapse the reserved
    // dwell here, once, on mount. Flag on ⇒ no write, no reflow.
    if (SERVICES_PROOF_RUNWAY_VH === 0) {
      stageRef.current?.parentElement?.style.setProperty("--svc-proof-runway", "0svh");
    }

    const write = () => {
      frame = 0;
      if (disposed) return;
      const stage = stageRef.current;
      if (!stage) return;

      // Static layouts (mobile / reduced motion): no stepping, no shrink,
      // content fully in (no scroll-driven entrance).
      if (isInert()) {
        setStep(stage, 0);
        setArrive(stage, 1, 1);
        setContentIn(stage, 1);
        setExit(stage, 0);
        // The casefile is static flow content here, resolved and released —
        // it never gates the accordion below it.
        // Resolved, released, and LIVE — here the casefile is static flow
        // content above the accordion, so it must stay hit-testable.
        setProof(stage, 1, 0);
        servicesRingProgressRef.current.progress = 0;
        servicesRingProgressRef.current.proofRelease = 1;
        // Static flow content, nothing in front of the instrument.
        servicesRingProgressRef.current.proofPresence = 0;
        return;
      }

      // ── READ PHASE (2026-07-29 perf pass: every layout read happens
      // BEFORE the first style write, so this callback can never force
      // a synchronous style+layout flush against its own dirty writes —
      // the old order wrote `--svc-arrive` first and then rect-read the
      // runway, paying a forced layout of the whole stage subtree every
      // frame). The runway rect is ONE read, split two ways (ADR-056).
      //
      // Brandmark arrive — the corridor-exit dissipate the sphere
      // expansion already publishes (module ref since 2026-07-29; the
      // fallback keeps the labs' inline-style channel working).
      // Defaults to 1 (parked) so the mark never gets stuck hidden.
      const dissipate = readCorridorDissipate(1);
      const runway = stage.parentElement; // .services-stage-root (the tall slot)
      if (!runway) return;
      const vh = window.innerHeight || 1;
      const r = runway.getBoundingClientRect();
      const travel = r.height - vh;

      // ── WRITE PHASE ──
      setArrive(
        stage,
        smoothstep(SHRINK_START, SHRINK_END, dissipate),
        smoothstep(FADE_START, FADE_END, dissipate)
      );
      // The casefile owns the FRONT of the runway; the ring owns the rest,
      // over a domain `splitServicesRunway` keeps byte-identical to the
      // pre-casefile 500svh. `proofP` is 1 immediately when the flag is off.
      const { proofP, ringP } = splitServicesRunway(-r.top, travel, SERVICES_PROOF_RUNWAY_VH * vh);

      // Casefile arrival — the mark's centering clock, so the panels travel
      // in WITH it (see the constants block for the owner's supersession).
      const proofIn = smootherstep(PROOF_GATE_START, PROOF_GATE_END, dissipate);
      const proofOut = smootherstep(PROOF_OUT_START, PROOF_OUT_END, proofP);
      setProof(stage, proofIn, proofOut);
      // What the casefile is actually painting — the mark and its haze dim
      // against THIS, not against the release, so the instrument recedes as
      // the surface arrives rather than the moment the stage parks.
      servicesRingProgressRef.current.proofPresence = proofIn * (1 - proofOut);

      // ONE release ramp gates everything the casefile stands in front of.
      // Multiplying it into `--svc-content-in` delays the masthead (and its
      // decode controller), the plate cluster, the designation layer, the
      // orbit draw-on and the scan interface together — no new consumer, no
      // new listener. Flag off ⇒ proofP is 1 ⇒ release is 1 ⇒ unchanged.
      const proofRelease = smootherstep(PROOF_RELEASE_START, PROOF_RELEASE_END, proofP);
      servicesRingProgressRef.current.proofRelease = proofRelease;

      // Services copy entrance — delayed + smootherstep so the list +
      // paragraph rise in gently AFTER the core has shrunk to centre.
      setContentIn(stage, smootherstep(CONTENT_IN_START, CONTENT_IN_END, dissipate) * proofRelease);

      // Continuous runway progress for the card ring (ADR-029) — same read,
      // same writer, bridged across React roots via the module ref. The step
      // below stays the floor() of this value, so ring rotation and the
      // active-service clock can never desync.
      const p = ringP;
      servicesRingProgressRef.current.progress = p;
      setExit(stage, exitProgressForRunway(p));
      // `data-active-step` IS the front-card index (round of the continuous
      // ring index), so the plate highlight / designations track the ring
      // exactly through the arrival-remapped rotation.
      setStep(stage, activeServiceForProgress(p));
    };

    const requestWrite = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);
    // Tab-return re-sync (2026-07-17): this rAF watcher freezes while the
    // tab is hidden and no scroll/resize reliably fires on return, so
    // `--svc-content-in` / `--svc-arrive` / the ring progress can hold a
    // stale pre-hide read — the #services masthead opacity is
    // `--svc-content-in * (1 − --svc-exit)`, so a stale 0 there is the
    // "copy disappeared on tab-return" symptom. Force a fresh write (which
    // re-reads --corridor-dissipate) the instant the tab returns; the
    // resulting `--svc-content-in` mutation also re-fires the masthead
    // reveal controller's clock. Idempotent via the per-property guards.
    // NOTE: this watcher is one of THREE parallel pinned-stage scroll hooks —
    // useAboutStageScroll + useContinuumStageScroll carry the same
    // visibilitychange re-sync; a shared parametrized factory is the eventual
    // convergence fix (plan 7.2 / 5.1). Keep the three in lockstep by hand.
    const onVisibility = () => {
      if (document.hidden) return;
      // Drop the write-dedupe caches so the forced re-sync ALWAYS re-writes
      // the live values — even if a resume race left the DOM vars stale
      // while these caches still hold the last pre-hide value (a plain
      // write() would then skip them, thinking they were already correct).
      currentStep = -1;
      currentShrink = -1;
      currentFade = -1;
      currentContentIn = -1;
      currentExit = -1;
      currentProofIn = -1;
      currentProofOut = -1;
      currentProofLive = null;
      write();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [onStepChange, stageRef]);
}
