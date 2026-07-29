/**
 * corridorDissipateRef — the corridor-exit dissipate clock's transport
 * (2026-07-29 perf pass).
 *
 * `useCorridorExitScroll` used to publish `--corridor-dissipate` as an
 * inline custom property on BOTH `<html>` and `#services`, every scroll
 * frame of the exit window. The var had ZERO CSS `var()` consumers —
 * every consumer was a JS `getPropertyValue` read — yet each write
 * invalidated computed style for the entire document (~1.7k elements),
 * the single largest style-recalc source of the corridor → `#services`
 * transition. The clock now travels through this module ref (the
 * `servicesRingProgressRef` precedent) and never touches the DOM.
 *
 * `live` is the provenance bit: TRUE only while the production exit
 * hook is mounted and writing. Readers go through
 * `readCorridorDissipate(fallback)`, which falls back to the legacy
 * inline-style read when the ref is not live — that is what keeps the
 * lab routes working (`/test/services-orbit` and friends drive the var
 * on `documentElement` themselves and never mount the exit hook), and
 * it preserves each reader's historical absent-value default via the
 * `fallback` argument (the corridor-side readers default to 0 — "exit
 * not started"; the services-side readers default to 1 — "never stuck
 * hidden"). Do not collapse the two defaults.
 *
 * THREE-FREE on purpose (landing-performance doctrine): DOM components
 * import this, so a `three` import here would drag the WebGL stack
 * into the landing's First Load JS.
 */
export const corridorDissipateRef: { current: { value: number; live: boolean } } = {
  current: { value: 0, live: false },
};

/** Read the dissipate clock: the live ref when the exit hook owns it,
 *  else the legacy inline-style channel (labs), else `fallback`. */
export function readCorridorDissipate(fallback: number): number {
  if (corridorDissipateRef.current.live) return corridorDissipateRef.current.value;
  if (typeof document === "undefined") return fallback;
  const raw = Number.parseFloat(
    document.documentElement.style.getPropertyValue("--corridor-dissipate")
  );
  return Number.isFinite(raw) ? raw : fallback;
}
