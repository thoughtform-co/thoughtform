"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  INITIAL_TRANSFORM,
  type ChamberId,
  deriveChambers,
  smoothstep,
  useDepthGatewayStore,
} from "@/lib/stores/depthGatewayStore";

/**
 * useDepthScroll — rAF-throttled scroll watcher for the home-v2
 * depth-gateway stage.
 *
 * Per frame, computes the global 0..1 progress across the sticky
 * stage and writes:
 *
 *   1. CSS custom properties on the stage root —
 *      `--depth-progress`, `--chamber-{a,b,c}-progress`, plus the
 *      three section opacity vars `--chamber-{A,B,C}-section-opacity`
 *      that gate the chamber DOM sections' cross-fade.
 *
 *   2. v7 HUD readout elements (the depth-rail diamond, %, coord
 *      readouts, sector text) so the v7 HUD chrome reads as a
 *      live travel signal — same visual language as production.
 *
 *   3. `depthGatewayStore` — single store the R3F painters read
 *      imperatively inside `useFrame` so per-frame work stays at
 *      uniform writes only. Now includes `velocity` (delta progress
 *      per second) which `StreamingDust` amplifies into faster
 *      particle flow during active scroll.
 *
 * Cross-fade envelopes are SEQUENCED with a small dead-band between
 * sections (no overlap) so the sigil compass fully fades out before
 * the miss orbits fade in. The dead-band is the "passing through"
 * moment — only dust + brandmark + HUD visible.
 *
 *   global progress     0    0.30 0.35 0.36 0.41    0.65 0.70 0.71 0.78  1.0
 *   chamber A opacity   1 ────╲                                              0
 *                              ╲
 *   chamber B opacity   0          0 ╱──────────────╲                        0
 *                                                    ╲
 *   chamber C opacity   0                                  0  ╱──────────────1
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

    const { chamberA, chamberB, chamberC, chamberId } = deriveChambers(progress);

    stage.style.setProperty("--depth-progress", progress.toFixed(4));
    stage.style.setProperty("--chamber-a-progress", chamberA.toFixed(4));
    stage.style.setProperty("--chamber-b-progress", chamberB.toFixed(4));
    stage.style.setProperty("--chamber-c-progress", chamberC.toFixed(4));

    // ── Chamber section cross-fade envelopes ───────────────────
    // SEQUENCED (no overlap zone). Each section fully fades out
    // before the next fades in, leaving a small dead-band where
    // only the brandmark + dust + HUD remain on screen — the
    // "we're passing through" moment.
    //
    // Boundaries (smoothstep ramps):
    //   A out:  0.30 → 0.35  (chamber A opacity 1 → 0)
    //   B in:   0.36 → 0.41  (chamber B opacity 0 → 1)
    //   B out:  0.65 → 0.70  (chamber B opacity 1 → 0)
    //   C in:   0.71 → 0.78  (chamber C opacity 0 → 1)
    //
    // Dead-bands: 0.35..0.36 (A↔B) and 0.70..0.71 (B↔C).
    const aOpacity = 1 - smoothstep(0.3, 0.35, progress);
    const bOpacity = smoothstep(0.36, 0.41, progress) * (1 - smoothstep(0.65, 0.7, progress));
    const cOpacity = smoothstep(0.71, 0.78, progress);

    stage.style.setProperty("--chamber-A-section-opacity", aOpacity.toFixed(4));
    stage.style.setProperty("--chamber-B-section-opacity", bOpacity.toFixed(4));
    stage.style.setProperty("--chamber-C-section-opacity", cOpacity.toFixed(4));

    // ── v7 HUD readouts ─────────────────────────────────────────
    // The v7 HUD HTML rendered by sliceV7Sections contains elements
    // with these ids — production uses useLandingScroll to drive
    // them. We don't run that hook here, so we update them ourselves
    // so the HUD's depth diamond + readouts tick with the stage
    // travel (live signal that we're moving forward through space).
    writeV7HudReadouts(progress, chamberId);

    // ── Active state + velocity ─────────────────────────────────
    const active = rect.bottom > 0 && rect.top < vh;

    const now = performance.now();
    const lastT = lastFrameTime.current;
    lastFrameTime.current = now;
    const lastP = lastProgress.current;

    // velocity in progress-units-per-second. Default to 0 on the
    // first frame (no lastT yet), and on idle (delta progress = 0).
    // Negative when scrolling upward.
    let velocity = 0;
    if (lastT > 0 && lastP >= 0) {
      const dtSec = Math.max(0.001, (now - lastT) / 1000);
      velocity = (progress - lastP) / dtSec;
    }

    if (Math.abs(progress - lastProgress.current) > 0.00005 || active !== getActive()) {
      lastProgress.current = progress;
      useDepthGatewayStore.getState().setTransform({
        progress,
        chamberId,
        chamberA,
        chamberB,
        chamberC,
        active,
        velocity,
      });
    } else if (Math.abs(velocity) > 0.0001) {
      // Even when progress didn't change meaningfully (e.g. user
      // stopped scrolling for a frame), still want to surface the
      // velocity decay to zero so StreamingDust doesn't get stuck
      // amplifying flow forever.
      useDepthGatewayStore.getState().setTransform({
        progress,
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
  // when the user actually scrolls — but the dust system wants to
  // see velocity tend back toward 0 between scroll events so it
  // doesn't keep amplifying forever. Schedule a follow-up rAF that
  // re-writes the frame ~200ms after the last scroll, with the
  // velocity calculation naturally producing ~0 since progress
  // didn't change.
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
 * track stage progress. We query each frame via `getElementById`
 * (constant-time browser lookup) rather than caching refs — HMR /
 * Fast Refresh can swap the underlying DOM elements while keeping
 * the React component instance, so a cached ref would point to a
 * detached node and updates would silently no-op.
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
