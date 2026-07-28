// Cross-root bridge for the services runway progress (ADR-029).
//
// The services DOM tree (nested `ServicesPortal` React root) and the corridor
// R3F canvas are SEPARATE React roots — per-scroll-frame scalars cross that
// seam through module-level refs, not React state (precedent:
// `brandmarkScanAnchorsRef`). Zustand would add subscriber churn for a value
// read once per WebGL frame.
//
// Single-writer contract: `useServicesStageScroll` (the services runway's
// only scroll watcher) writes `progress`; `ServicesCardRing` reads it inside
// `useFrame`. Nobody else writes.

export interface ServicesRingProgress {
  /** RING progress 0..1 (0 while inert). Under ADR-056 the runway carries the
   *  proof casefile's dwell at its front and this is the progress across what
   *  is LEFT — `splitServicesRunway` keeps that domain byte-identical to the
   *  pre-casefile 500svh, so every ring constant still lands where it did. */
  progress: number;
  /** 0 while the proof casefile owns the stage, 1 once it has released
   *  (ADR-056). Multiplied into the ring's and the orbits' master opacity so
   *  the cards cannot paint — or publish hit anchors — over the casefile.
   *
   *  Defaults to 1: a reader that runs before the first write, with the flag
   *  off, or on the inert (mobile / reduced-motion) path must see the ring
   *  exactly as it was. Nothing may ever leave this at 0 as a resting state. */
  proofRelease: number;
  /** The casefile's own on-screen envelope — its arrival times the inverse
   *  of its departure, i.e. exactly the opacity it is painting at (ADR-056).
   *
   *  DISTINCT from `proofRelease` on purpose. The ring must stay dark for the
   *  WHOLE dwell, including the lead-in before the casefile has faded up, so
   *  it reads the release. The parked mark and its haze must only recede
   *  while something is actually in front of them, so they read this — keying
   *  their dim to the release instead drops the instrument the moment the
   *  stage parks, a beat before anything arrives to justify it.
   *
   *  Defaults to 0: nothing on screen ⇒ no dim, which is the resting truth
   *  before the first write, with the flag off, and on the inert path. */
  proofPresence: number;
}

export const servicesRingProgressRef: { current: ServicesRingProgress } = {
  current: { progress: 0, proofRelease: 1, proofPresence: 0 },
};
