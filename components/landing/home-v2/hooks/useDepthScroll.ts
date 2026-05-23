"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  INITIAL_TRANSFORM,
  type ChamberId,
  cameraTravelT,
  deriveChambers,
  useDepthGatewayStore,
} from "@/lib/stores/depthGatewayStore";

/**
 * useDepthScroll — rAF-throttled scroll watcher for the home-v2
 * depth-corridor stage (ADR-018, world-owned rebuild).
 *
 * Per frame, computes the global 0..1 progress across the sticky
 * stage and writes:
 *
 *   1. CSS custom properties on the stage root:
 *      - `--depth-progress`, `--camera-t`, `--beat-gate-progress`
 *      - `--velocity-mag` (used to drive HUD intensity)
 *
 *   2. v7 HUD readout elements (the depth-rail diamond, %, coord
 *      readouts, sector text) so the v7 HUD chrome reads as a live
 *      travel signal.
 *
 *   3. `depthGatewayStore` — single store the R3F painters read
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

    const progress = clamp01(-rect.top / scrubHeight);
    const cameraT = cameraTravelT(progress);

    const { chamberA, chamberB, chamberC, chamberId, beat, gateProgress } =
      deriveChambers(progress);

    // ── Global progress + camera channels ─────────────────────────
    stage.style.setProperty("--depth-progress", progress.toFixed(4));
    stage.style.setProperty("--camera-t", cameraT.toFixed(4));
    stage.style.setProperty("--beat-gate-progress", gateProgress.toFixed(4));

    // ── v7 HUD readouts ─────────────────────────────────────────
    writeV7HudReadouts(progress, chamberId);

    // ── Active state + velocity ─────────────────────────────────
    // `active` flips on only once the stage has fully reached the
    // top of the viewport (rect.top <= 0). The previous looser
    // criterion (`rect.top < vh`) flipped active true the moment
    // the stage entered the viewport even slightly — but during the
    // hero scroll the sticky stage is still below the viewport, so
    // painting then meant the projected brandmark appeared over the
    // hero with no compass around it. Gating on `rect.top <= 0`
    // means the corridor only engages once the user has actually
    // arrived at the Thoughtform section, so the compass + brand-
    // mark are already in place the moment they become visible.
    const active = rect.bottom > 0 && rect.top <= 0;

    const now = performance.now();
    const lastT = lastFrameTime.current;
    lastFrameTime.current = now;
    const lastP = lastProgress.current;

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
      // Surface velocity decay even when progress hasn't changed,
      // so streak intensity settles back to 0 quickly when idle.
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
