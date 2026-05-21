"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  BEAT_WINDOWS,
  INITIAL_TRANSFORM,
  type Beat,
  type ChamberId,
  cameraTravelT,
  deriveChambers,
  useDepthGatewayStore,
} from "@/lib/stores/depthGatewayStore";

/**
 * useDepthScroll — rAF-throttled scroll watcher for the home-v2
 * depth-corridor stage (ADR-018).
 *
 * Per frame, computes the global 0..1 progress across the sticky
 * stage and writes:
 *
 *   1. CSS custom properties on the stage root:
 *      - `--depth-progress`, `--camera-t`
 *      - `--beat-thoughtform-active` etc. (1 when this is the current
 *         beat, 0 otherwise, with a short fade window at the boundary
 *         so DOM copy can crossfade cleanly)
 *      - `--beat-gate-progress` (0..1 inside the current beat)
 *      - `--velocity-mag` (|velocity|, used to drive HUD intensity)
 *      - Legacy `--chamber-{a,b,c}-progress` +
 *         `--chamber-{A,B,C}-section-opacity` for the migration
 *         period.
 *
 *   2. v7 HUD readout elements (the depth-rail diamond, %, coord
 *      readouts, sector text) so the v7 HUD chrome reads as a live
 *      travel signal.
 *
 *   3. `depthGatewayStore` — single store the R3F painters read
 *      imperatively inside `useFrame` so per-frame work stays at
 *      uniform writes only.
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

    const progress = clamp01(-rect.top / scrubHeight);
    const cameraT = cameraTravelT(progress);

    const { chamberA, chamberB, chamberC, chamberId, beat, gateProgress } =
      deriveChambers(progress);

    // ── Global progress + camera channels ─────────────────────────
    stage.style.setProperty("--depth-progress", progress.toFixed(4));
    stage.style.setProperty("--camera-t", cameraT.toFixed(4));
    stage.style.setProperty("--beat-gate-progress", gateProgress.toFixed(4));

    // ── Beat active flags (for DOM copy crossfade) ───────────────
    // Each beat's "active" var is 1 inside its window and 0 elsewhere
    // with a small (FADE px in scroll units) fade at the boundary so
    // section copy crossfades cleanly without driving the diagram
    // visuals (which now live in R3F).
    const FADE = 0.02;
    for (const { beat: b, start, end } of BEAT_WINDOWS) {
      // Trapezoid envelope: 0 outside [start - FADE, end + FADE],
      // ramps to 1 inside [start, end].
      let active = 0;
      if (progress >= start && progress <= end) {
        active = 1;
      } else if (progress > start - FADE && progress < start) {
        active = (progress - (start - FADE)) / FADE;
      } else if (progress > end && progress < end + FADE) {
        active = 1 - (progress - end) / FADE;
      }
      stage.style.setProperty(`--beat-${b}-active`, active.toFixed(4));
    }

    // ── Legacy chamber progress + section-opacity vars ───────────
    // Kept for the existing painters (BrandmarkPointCloud,
    // IntelligenceChamber) and the DOM cross-fade layer during
    // migration. The corridor mode CSS hides the diagram visuals
    // and only uses these for COPY visibility.
    stage.style.setProperty("--chamber-a-progress", chamberA.toFixed(4));
    stage.style.setProperty("--chamber-b-progress", chamberB.toFixed(4));
    stage.style.setProperty("--chamber-c-progress", chamberC.toFixed(4));

    // Chamber section opacity — copy fades in/out around the parked
    // beats. Thoughtform's copy is visible during thoughtform +
    // passthrough-01; diagnostic during diagnostic; intelligence
    // during passthrough-02 + intelligence.
    const aOpacity = visibilityForBeats(progress, ["thoughtform", "passthrough-01"]);
    const bOpacity = visibilityForBeats(progress, ["diagnostic"]);
    const cOpacity = visibilityForBeats(progress, ["passthrough-02", "intelligence"]);
    stage.style.setProperty("--chamber-A-section-opacity", aOpacity.toFixed(4));
    stage.style.setProperty("--chamber-B-section-opacity", bOpacity.toFixed(4));
    stage.style.setProperty("--chamber-C-section-opacity", cOpacity.toFixed(4));

    // ── v7 HUD readouts ─────────────────────────────────────────
    writeV7HudReadouts(progress, chamberId);

    // ── Active state + velocity ─────────────────────────────────
    const active = rect.bottom > 0 && rect.top < vh;

    const now = performance.now();
    const lastT = lastFrameTime.current;
    lastFrameTime.current = now;
    const lastP = lastProgress.current;

    // velocity in progress-units-per-second. Default to 0 on the
    // first frame (no lastT yet), and on idle (delta progress = 0).
    // Negative when scrolling upward. We deliberately keep the sign
    // so painters can distinguish forward vs backward travel.
    let velocity = 0;
    if (lastT > 0 && lastP >= 0) {
      const dtSec = Math.max(0.001, (now - lastT) / 1000);
      velocity = (progress - lastP) / dtSec;
    }
    stage.style.setProperty("--velocity-mag", Math.abs(velocity).toFixed(4));

    if (Math.abs(progress - lastProgress.current) > 0.00005 || active !== getActive()) {
      lastProgress.current = progress;
      useDepthGatewayStore.getState().setTransform({
        progress,
        cameraT,
        beat,
        gateProgress,
        chamberId,
        chamberA,
        chamberB,
        chamberC,
        active,
        velocity,
      });
    } else if (Math.abs(velocity) > 0.0001) {
      // Even when progress didn't change meaningfully, surface
      // velocity decay so the streaks settle back to 0 quickly.
      useDepthGatewayStore.getState().setTransform({
        progress,
        cameraT,
        beat,
        gateProgress,
        chamberId,
        chamberA,
        chamberB,
        chamberC,
        active,
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

  // Decay velocity to zero on idle. The scroll listener only fires
  // when the user actually scrolls — but the streak system wants to
  // see velocity tend back toward 0 between scroll events. Schedule
  // a follow-up rAF ~200ms after the last scroll so the velocity
  // calculation naturally produces ~0 (progress didn't change).
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
    };
  }, [onScroll, writeFrame]);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function getActive(): boolean {
  return useDepthGatewayStore.getState().transform.active;
}

const SECTOR_BY_CHAMBER: Record<ChamberId, string> = {
  definition: "North star",
  diagnostic: "Missing layer",
  intelligence: "Substrate",
};

/**
 * Mirror the v7 HUD readouts so the depth diamond + status numbers
 * track stage progress.
 */
function writeV7HudReadouts(progress: number, chamberId: ChamberId): void {
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
    sectorEl.textContent = SECTOR_BY_CHAMBER[chamberId] ?? "Origin";
  }
}

/**
 * Visibility envelope for a SET of consecutive beats. Returns 1 while
 * the user is inside any of the beats, with short fade-in / fade-out
 * windows at the outer boundaries so DOM copy crossfades cleanly.
 * Inside the set of beats, opacity is 1 throughout — no notch at
 * passthrough boundaries.
 */
function visibilityForBeats(progress: number, beats: Beat[]): number {
  const windows = BEAT_WINDOWS.filter((b) => beats.includes(b.beat));
  if (windows.length === 0) return 0;
  const start = Math.min(...windows.map((w) => w.start));
  const end = Math.max(...windows.map((w) => w.end));
  const FADE = 0.04;
  if (progress >= start && progress <= end) return 1;
  if (progress > start - FADE && progress < start) return (progress - (start - FADE)) / FADE;
  if (progress > end && progress < end + FADE) return 1 - (progress - end) / FADE;
  return 0;
}
