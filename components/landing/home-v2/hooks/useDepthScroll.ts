"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  type Beat,
  INITIAL_TRANSFORM,
  clamp01,
  getCorridorEngagement,
  resolveBeat,
  useDepthGatewayStore,
} from "@/lib/stores/depthGatewayStore";
import { isMobileComposition } from "@/lib/hooks/useDeviceTier";
import { SECTOR_LABELS } from "@/lib/home-v2/corridorMap";
import { getMobilePaintProgress } from "../DepthGatewayScene/sceneGeom";

/** Fraction of the sticky stage that belongs to the calibrated
 *  corridor. The remainder (1 - EPILOGUE_START) is the
 *  "billions on the same layer" epilogue scroll channel. Tied
 *  to the stage height in home-v2.css (`620svh corridor + 200svh
 *  epilogue` -> 620 / 820 ≈ 0.7561). The corridor's normalized
 *  progress (and beat windows) is computed AGAINST EPILOGUE_START,
 *  so the corridor still tiles [0,1] across its physical span and
 *  every CORRIDOR_TIMELINE constant stays byte-identical.
 *
 *  Epilogue v2 (2026-06-08) expanded the epilogue from 180svh to
 *  300svh so the Build header has room to fade out fully BEFORE the
 *  billions title arrives — corridor cadence rule. Sub-bands inside
 *  the epilogue live in `lib/home-v2/epilogueTimeline.ts`.
 *
 *  v3.4 (2026-06-09) expanded the calibrated corridor span from
 *  460svh to 620svh while keeping the epilogue at 300svh. This gives
 *  the Encode -> Build leg real runway so the wormhole mouth can
 *  visibly widen across the transition instead of racing into the
 *  Build park.
 *
 *  Polish round 2 (2026-06-10): compressed the epilogue tail from
 *  300svh to 200svh and pulled TITLE_IN forward inside the band
 *  table so the Build → "billions" handoff resolves in roughly one
 *  viewport of scroll instead of three. The corridor span itself
 *  is byte-identical. */
const EPILOGUE_START = 620 / 820;

/**
 * useDepthScroll — rAF-throttled scroll watcher for the home-v2
 * depth-corridor stage (ADR-018, world-owned rebuild).
 *
 * Per frame, computes the global 0..1 progress across the sticky
 * stage and writes:
 *
 *   1. v7 HUD readout elements (the depth-rail diamond, %, coord
 *      readouts, sector text) so the v7 HUD chrome reads as a live
 *      travel signal.
 *
 *   2. `depthGatewayStore` — single store the R3F painters read
 *      imperatively inside `useFrame` so per-frame work stays at
 *      uniform writes only.
 *
 * The chamber A/B/C section-opacity machinery is GONE — the world-
 * owned model removes the v7 section grid stack from the corridor.
 * Each gate group manages its own visibility envelope from `beat` +
 * `gateProgress`; the DOM copy overlay manages its visibility from
 * `useWorldDomTracker` based on per-anchor `visibilityBeats`.
 */
export function useDepthScroll(stageRef: React.RefObject<HTMLDivElement | null>): void {
  const rafId = useRef<number | null>(null);
  const lastProgress = useRef<number>(-1);
  const lastFrameTime = useRef<number>(-1);

  const writeFrame = useCallback(() => {
    rafId.current = null;
    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const vh = window.innerHeight;
    const stageHeight = rect.height;
    const scrubHeight = Math.max(1, stageHeight - vh);

    // RAW progress runs across the WHOLE sticky stage (corridor +
    // epilogue). We then split it: the calibrated corridor reads a
    // CLAMPED, renormalized progress 0..1 across the corridor span,
    // and the epilogue scrub gets its own independent 0..1 channel
    // across the tail. This keeps every CORRIDOR_TIMELINE constant
    // byte-identical while letting us extend the sticky stage.
    const rawProgress = clamp01(-rect.top / scrubHeight);
    const progress = clamp01(rawProgress / EPILOGUE_START);
    const epilogueProgress = clamp01(
      (rawProgress - EPILOGUE_START) / Math.max(1e-6, 1 - EPILOGUE_START)
    );

    // ── Engagement state + velocity ─────────────────────────────
    // Two-phase engagement (ADR-018 "furnished room on arrival"):
    //   - `armed`: the sticky stage is rising into pin position
    //     (0 < rect.top < vh). Painters pre-position at the parked
    //     Thoughtform layout (paintProgress = 0) with opacity 0,
    //     so the first `active` frame reveals a fully composed
    //     parked beat instead of an empty void that fills in as
    //     the user scrolls.
    //   - `active`: stage is pinned (rect.top <= 0). Painters paint
    //     at the live scroll progress.
    // The hero is sticky-pinned beneath the stage layer; armed
    // painters write opacity 0 so nothing composites over the hero
    // even while transforms are being computed.
    //
    // Engagement is rect-based (not progress-based), so the longer
    // stage just keeps the corridor `active` for the duration of
    // the epilogue as well — exactly what we want.
    const engagement = getCorridorEngagement(rect, vh, progress);
    const { active, armed } = engagement;

    // Mobile two-moment Thoughtform: the beat is sequenced into a copy
    // moment then a brandmark+diagram moment, both with the camera held,
    // before the corridor fly. `getMobilePaintProgress` maps the whole
    // dwell into the camera-hold span so paintProgress stays ≤ dollyHoldEnd
    // across both moments, then runs the fly. Only the PAINT channel is
    // remapped — and only while active (armed keeps paintProgress 0 for
    // the "furnished on arrival" parked prepaint). Every visual reads
    // `paintProgress`, so the camera, mirror camera, rings, brandmark,
    // and copy all shift together. (ADR-018 mobile revision.)
    const mobile = isMobileComposition();
    const paintProgress =
      active && mobile ? getMobilePaintProgress(progress) : engagement.paintProgress;

    // Beat / gateProgress drive cosmetics (brandmark `isParkedBeat`
    // intensity, HUD sector text). On mobile the remap stretches raw
    // progress far from paintProgress, so resolve the beat from the
    // PAINTED value to keep cosmetics aligned with what's on screen.
    // Desktop resolves from raw progress (unchanged).
    const { beat, gateProgress } = resolveBeat(active && mobile ? paintProgress : progress);

    // Mirror engagement to a global DOM flag so co-mounted scroll
    // hooks (notably the v7 LandingPage's `useLandingScroll`) know
    // to defer HUD readouts to the corridor while it owns the rail.
    // The flag covers both armed and active phases — armed is when
    // the corridor is rising into pin, active is when it's pinned.
    // Cleared on unmount inside the cleanup effect below.
    if (typeof document !== "undefined") {
      const engaged = active || armed ? "true" : "false";
      const html = document.documentElement;
      if (html.getAttribute("data-corridor-engaged") !== engaged) {
        html.setAttribute("data-corridor-engaged", engaged);
      }
      // Epilogue gate — when the user is anywhere inside the epilogue
      // scroll channel, flip a `data-corridor-epilogue` attribute on
      // `<html>` so the canvas can opt INTO receiving pointer events
      // (the news-card raycaster needs pointer-events: auto to fire
      // hover / click on the orbiting card meshes). The default for
      // the canvas is `pointer-events: none` so it never steals scroll
      // or hover from DOM siblings outside the epilogue.
      const epilogueOn = epilogueProgress > 0.001 ? "true" : "false";
      if (html.getAttribute("data-corridor-epilogue") !== epilogueOn) {
        html.setAttribute("data-corridor-epilogue", epilogueOn);
      }
    }

    // Only the corridor writes HUD readouts while it's the engaged
    // owner of the depth rail. When idle (the user has scrolled
    // past the corridor into Continuum etc) we leave the readouts
    // alone so `useLandingScroll` can drive them with the global
    // page progress instead.
    if (active || armed) {
      writeV7HudReadouts(progress, beat);
    }

    const now = performance.now();
    const lastT = lastFrameTime.current;
    lastFrameTime.current = now;
    const lastP = lastProgress.current;

    let velocity = 0;
    if (lastT > 0 && lastP >= 0) {
      const dtSec = Math.max(0.001, (now - lastT) / 1000);
      velocity = (progress - lastP) / dtSec;
    }

    const prev = useDepthGatewayStore.getState().transform;
    const engagementChanged = active !== prev.active || armed !== prev.armed;
    const epilogueChanged = Math.abs(epilogueProgress - prev.epilogueProgress) > 0.00005;
    if (
      Math.abs(progress - lastProgress.current) > 0.00005 ||
      engagementChanged ||
      epilogueChanged
    ) {
      lastProgress.current = progress;
      useDepthGatewayStore.getState().setTransform({
        progress,
        beat,
        gateProgress,
        active,
        armed,
        paintProgress,
        epilogueProgress,
        velocity,
      });
    } else if (Math.abs(velocity) > 0.0001) {
      // Surface velocity decay even when progress hasn't changed,
      // so streak intensity settles back to 0 quickly when idle.
      useDepthGatewayStore.getState().setTransform({
        progress,
        beat,
        gateProgress,
        active,
        armed,
        paintProgress,
        epilogueProgress,
        velocity,
      });
    }
  }, [stageRef]);

  const onScroll = useCallback(() => {
    if (rafId.current != null) return;
    rafId.current = window.requestAnimationFrame(writeFrame);
  }, [writeFrame]);

  // First frame synchronously before paint so the canvas + sections
  // don't flash with INITIAL_TRANSFORM during hydration.
  useLayoutEffect(() => {
    writeFrame();
  }, [writeFrame]);

  // Decay velocity to zero on idle: schedule a follow-up rAF ~200ms
  // after the last scroll so the velocity calculation produces ~0.
  useEffect(() => {
    let decayHandle: number | null = null;
    const scheduleDecay = () => {
      if (decayHandle != null) clearTimeout(decayHandle);
      decayHandle = window.setTimeout(() => {
        if (rafId.current == null) rafId.current = window.requestAnimationFrame(writeFrame);
      }, 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", scheduleDecay, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", scheduleDecay);
      window.removeEventListener("resize", onScroll);
      if (rafId.current != null) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (decayHandle != null) clearTimeout(decayHandle);
      useDepthGatewayStore.getState().setTransform(INITIAL_TRANSFORM);
      if (typeof document !== "undefined") {
        document.documentElement.removeAttribute("data-corridor-engaged");
        document.documentElement.removeAttribute("data-corridor-epilogue");
      }
    };
  }, [onScroll, writeFrame]);
}

/** HUD sector text per beat — derived from the declarative corridor
 *  map (`label` on each node). Passthrough beats carry their own label
 *  so the readout doesn't blank during travel. */
function sectorForBeat(beat: Beat): string {
  return SECTOR_LABELS[beat];
}

/**
 * Mirror the v7 HUD readouts so the depth diamond + status numbers
 * track stage progress.
 */
function writeV7HudReadouts(progress: number, beat: Beat): void {
  if (typeof document === "undefined") return;

  const depthEl = document.getElementById("depthIndicator");
  if (depthEl) depthEl.style.top = `${(progress * 100).toFixed(2)}%`;

  const progressEl = document.getElementById("hudProgress");
  if (progressEl) {
    const pct = Math.round(progress * 100);
    progressEl.textContent = `${String(pct).padStart(2, "0")}%`;
  }

  const coordD = document.getElementById("coordD");
  if (coordD) coordD.textContent = (0.2 + progress * 0.55).toFixed(2);

  const coordT = document.getElementById("coordT");
  if (coordT) {
    const deg = Math.round(progress * 359);
    const tenths = Math.round((progress * 10) % 10);
    coordT.textContent = `${String(deg).padStart(3, "0")}.${tenths}\u00b0`;
  }

  const sectorEl = document.getElementById("hudSector");
  if (sectorEl) {
    sectorEl.textContent = sectorForBeat(beat);
  }
}
