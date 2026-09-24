/**
 * How many frames each WebGL canvas has painted (ADR-123 §Part 1, commit A).
 *
 * The question the phone bisect asks is "what is drawing while the reader is
 * inside the pile?", and a frame COUNT is the one measurement that answers
 * it without a profiler: a `useFrame` inside each Canvas increments its
 * counter, the diag panel shows the delta per second, and the phone smokes
 * assert the corridor's counter is still at rest in the pile and advancing on
 * the band.
 *
 * Three-free (the `useFrame` lives in the Canvases; this is the number they
 * write to), DOM-free, a module ref like `vwTravelRef`. Exposed on `window`
 * ONLY under `navigator.webdriver` — the governor's own carve-out — so a
 * Playwright run can read it and a visitor's page carries nothing extra.
 */

export interface FrameCounters {
  /** The corridor scene's Canvas (`DepthGatewayScene`). */
  corridor: number;
  /** The brandmark particle canvas (`BrandmarkParticleCanvas`). */
  brandmark: number;
}

export const frameCounterRef: { current: FrameCounters } = {
  current: { corridor: 0, brandmark: 0 },
};

export function bumpFrame(which: keyof FrameCounters): void {
  frameCounterRef.current[which] += 1;
}

declare global {
  interface Window {
    __tfFrames?: FrameCounters;
  }
}

/** Publish the counters on `window` for an automated reader. Idempotent. */
export function exposeFrameCountersForAutomation(): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (navigator.webdriver !== true) return;
  window.__tfFrames = frameCounterRef.current;
}
