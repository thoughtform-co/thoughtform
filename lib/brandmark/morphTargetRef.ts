/**
 * morphTargetRef — a route's way of telling the corridor's parked brandmark
 * to become a SECOND shape (ADR-095).
 *
 * The corridor is prop-less from `LandingPage` down: the only seam a route
 * has into the WebGL frame loop is a module ref or an `<html>` attribute
 * read at mount (the `data-services-ring="off"` precedent). This ref is
 * that seam for the client-mark morph: a page registers a SPEC before the
 * lazy corridor chunk mounts (a layout effect in the route's portal leaf,
 * which runs in the same commit as `useCorridorMount`'s), the actor reads
 * it ONCE at mount and builds the target, and the page's own scroll writer
 * drives `progress` per frame.
 *
 * Contracts:
 *   - `readBrandmarkMorph()` is 0 whenever no spec is registered — every
 *     consumer (the vertex mix, the colour lerp, the orbit fade) is an exact
 *     identity at 0, which is what keeps `/` and `/claude-workshop`
 *     pixel-identical without a flag.
 *   - ONE writer of `progress`: the registering route's turn writer. The
 *     actor and the armillary only read it, per frame, never per scroll
 *     event.
 *   - `load()` is a dynamic import on the route side, so `three` never
 *     enters the route page's static graph (landing-import-doctrine) and
 *     the corridor never imports route code — it calls a function it was
 *     handed.
 *   - `buildTarget(base, count)` receives the mark's own normalised homes
 *     (group-local, ±0.5 half-extent, one `vec3` per particle slot) and
 *     must return `count * 3` finite floats in the SAME space, one target
 *     per slot. Pairing slot ↔ target is the builder's job.
 *
 * THREE-FREE on purpose (landing-performance doctrine): DOM components
 * import this, so a `three` import here would drag the WebGL stack into
 * the landing's First Load JS.
 */

export interface BrandmarkMorphTarget {
  buildTarget(base: Float32Array, count: number): Float32Array;
}

export interface BrandmarkMorphSpec {
  /** A route id, for the record; nothing branches on it. */
  id: string;
  /** Resolves the builder — a dynamic `import()` on the route side. */
  load: () => Promise<BrandmarkMorphTarget>;
  /** The body colour the mark settles on at progress 1. */
  color: string;
  /** The rim/limb accent at progress 1 (defaults to `color` in the core). */
  accent: string;
  /** Mid-flight bulge, group-local units — how far a particle leaves the
   *  straight line between its two homes at the flight's midpoint. */
  lift: number;
}

export interface BrandmarkMorphState {
  spec: BrandmarkMorphSpec | null;
  /** 0 → 1, the eased morph clock. Meaningless without a spec. */
  progress: number;
}

export const brandmarkMorphRef: { current: BrandmarkMorphState } = {
  current: { spec: null, progress: 0 },
};

/** The morph clock as every consumer should read it: 0 whenever nothing is
 *  registered, so the unregistered path is identity by construction. */
export function readBrandmarkMorph(): number {
  const c = brandmarkMorphRef.current;
  return c.spec ? c.progress : 0;
}

/** Reset to the unregistered state (a route's cleanup). */
export function clearBrandmarkMorph(): void {
  brandmarkMorphRef.current = { spec: null, progress: 0 };
}
