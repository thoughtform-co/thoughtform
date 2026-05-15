---
name: brandmark-particle
description: >
  Operational how-to for the brandmark particle artifact (ADR-011). The
  v7 landing brandmark is sampled into a deterministic point cloud at
  mount time and painted by one shared R3F canvas — density, dispersion,
  and tint are dialled per station. Activates on edits to
  `components/brand/BrandmarkParticleField/**`, `lib/brandmark/**`,
  `lib/stores/brandmarkParticleStore.ts`, the `PARTICLE_STATION_DEFAULTS`
  table in `useSigilChoreography.ts`, the `[data-brandmark-mode]` /
  `[data-brand-particle-backdrop]` CSS gates in `landing.css`, or
  anything that changes how the brandmark is painted (vs. choreographed,
  which is the `brandmark-choreography` skill).
---

# Brandmark Particle Artifact

The Thoughtform brandmark is a **runtime substrate**, not a finished
asset. The same paths from
[`BrandmarkGlyph.tsx`](../../components/landing/v7/BrandmarkGlyph.tsx)
(`BRANDMARK_FILLED_PATHS` + `BRANDMARK_VIEWBOX`) are sampled once at mount
into a point cloud; a single shared R3F canvas paints that cloud into
every brandmark site on the page; density, dispersion, opacity, and tint
are dialled per station via a Zustand snapshot bus.

**Canonical record:** [ADR-011 v1](../../../sentinel/decisions/011-brandmark-particle-artifact.md)
**Related choreography (state machine):** [ADR-010 v3](../../../sentinel/decisions/010-brandmark-choreography.md), `brandmark-choreography` skill.
**Related compositing (layers):** [ADR-008](../../../sentinel/decisions/008-landing-v7-background-layers.md), `landing-v7-compositing` skill.

---

## How the engine fits together (one paragraph)

`useSigilChoreography` runs its scroll-derived state machine each frame
and writes a `StationSnapshot` (rect, opacity, density, dispersion, tint)
into `useBrandmarkParticleStore` for whichever station the brandmark is
painting (one of `sigil`, `miss`, `backdrop`, `rail`, `orbit`). One shared
`BrandmarkParticleCanvas` mounts inside `BrandmarkSystem`; it renders one
`BrandmarkParticleStation` per station listed in its `stations` prop.
Each station holds a `THREE.Points` mesh with a buffer geometry sampled
from `BRANDMARK_FILLED_PATHS` (via
[`sampleShape.ts`](../../lib/brandmark/sampleShape.ts)). Inside
`useFrame`, each station imperatively reads its own snapshot from the
store (`getState()` — never `useStore` — so writes don't re-render React)
and writes uniforms (`uCenter`, `uHalfSize`, `uOpacity`, `uVisibleCount`,
`uDispersion`, `uTime`, `uTint`) on the `ShaderMaterial`. The vertex
shader rank-clips particles above `uVisibleCount` (the density dial),
applies sinusoidal wander scaled by `uDispersion`, and projects pixel
coordinates to NDC directly.

The choreography hook **also** writes two attributes on `documentElement`
each frame: `data-brandmark-mode` (the global "particle" / "svg" flag) and
`data-brand-particle-backdrop` (the canvas wrapper fade gate). CSS in
[`landing.css`](../../components/landing/v7/landing.css) uses these to
hide the legacy SVG painters (native dock glyphs + fixed actor) at every
parked station and transit moment in particle mode.

---

## Pre-merge checklist (regression invariants)

Match each item to [ADR-011](../../../sentinel/decisions/011-brandmark-particle-artifact.md) and the related ADR-010 v3 rules:

- [ ] **One canonical shape source** — `BRANDMARK_FILLED_PATHS` +
      `BRANDMARK_VIEWBOX` in
      [`BrandmarkGlyph.tsx`](../../components/landing/v7/BrandmarkGlyph.tsx)
      is the only place the brandmark geometry lives. Adding a new shape
      goes through `lib/brandmark/shapes.ts` (future) + a new entry in
      `PARTICLE_STATION_DEFAULTS`; do **not** copy path strings into
      another file.
- [ ] **Deterministic sampling** — `sampleShape` uses a seeded
      Mulberry32-style PRNG keyed off the `shapeKey` argument. The
      resulting cloud must be stable across mounts and Fast Refresh so
      the choreography stays visually consistent.
- [ ] **One shared canvas** — `BrandmarkSystem` mounts one
      `BrandmarkParticleCanvas`. Never instantiate a second R3F `<Canvas>`
      for brandmark particles; the shared one already supports any
      number of stations.
- [ ] **Imperative reads in `useFrame`** — `BrandmarkParticleStation`
      reads its snapshot via `useBrandmarkParticleStore.getState()`
      inside `useFrame`. Subscribing via `useStore((s) => s.stations.X)`
      would re-render the React tree every scroll frame; don't.
- [ ] **Two-way fallback** — the choreography hook's mode probe
      (`!reduceMotion && probeWebGL()`) sets the store to `"svg"` when
      either fails. In that path the canvas component returns `null` and
      the existing SVG actor + portal'd glyphs paint exactly as they did
      pre-ADR-011. Verify any new station-snapshot writes are wrapped in
      `if (particleModeOK)`.
- [ ] **Five station snapshots + transit + fadeout** — every branch of
      `applyJourney` that paints the brandmark (`parkAt(kind)`,
      `transit(from, to, t)`, post-orbit fade-out) writes the matching
      snapshot or clears via `clearAllStationSnapshots()`. The
      `data-brand-particle-backdrop` gate flips automatically inside the
      writer / clearer.
- [ ] **CSS gate composition** — `[data-brandmark-mode="particle"]`
      composes with `[data-brand-on-missing="parked"]`,
      `[data-brand-on-rail="parked"]`, and `[data-orbit-docked="true"]`
      to hide native dock glyphs at each parked station. The
      `[data-brand-particle-backdrop="true"]` rule hides the SVG actor at
      every painted moment. Both attributes are written to
      `document.documentElement` (not `rootRef`) because the actor +
      canvas are siblings of the v7 root.
- [ ] **Singleton invariant** — `brandmarkSingletonCheck` includes
      `.tf-brandmark-particle-canvas` in its selector list. At any single
      scroll position the page must report exactly one painter (canvas
      in particle mode, actor or native glyph in svg mode), with
      combined effective opacity ≤ 1.25 during gate crossfades.
- [ ] **Pointer events** — the canvas wrapper + R3F inner wrapper +
      `<canvas>` element all have `pointer-events: none`. The full-viewport
      canvas must never intercept clicks meant for the page beneath it.
      (See the inline `<style>` block inside `BrandmarkParticleCanvas`.)
- [ ] **Reduced motion** — `@media (prefers-reduced-motion: reduce)`
      hides the particle canvas wrapper via `display: none`, and the
      hook's mode probe already set the store to `"svg"` so the canvas
      component never even mounted. Belt-and-braces.
- [ ] **Run the dev preview** — open
      [`/test/brandmark-particle`](../../../app/%28internal%29/test/brandmark-particle/page.tsx)
      and verify density/dispersion sliders still feel right after any
      shader or sampling change. The "Phase A target" note in the panel
      pins the asking-gap defaults (`density ≈ 0.22`, `dispersion ≈ 0.42`).

End of session: if this change was non-trivial, run [Cycle A in
MAINTENANCE.md](../../../sentinel/MAINTENANCE.md#cycle-a-post-incident-capture-checklist).

---

## Density tiers (canonical — keep in sync with

`PARTICLE_STATION_DEFAULTS` in [`useSigilChoreography.ts`](../../components/landing/v7/hooks/useSigilChoreography.ts) and ADR-011)

| Station    | Density | Dispersion |
| ---------- | ------- | ---------- |
| `sigil`    | 1.00    | 0.00       |
| `miss`     | 1.00    | 0.00       |
| `backdrop` | 0.22    | 0.42       |
| `rail`     | 1.00    | 0.00       |
| `orbit`    | 1.00    | 0.00       |

Transit between two stations interpolates density and dispersion linearly
with the journey's `power3.inOut` ease, then adds a `sin(πt) * 0.45`
bell-curve bump to dispersion so the cloud scatters mid-flight and
re-coheres at the destination.

When tuning these, **always** update both:

1. `PARTICLE_STATION_DEFAULTS` in
   [`useSigilChoreography.ts`](../../components/landing/v7/hooks/useSigilChoreography.ts)
2. The "Density tiers" table in
   [ADR-011](../../../sentinel/decisions/011-brandmark-particle-artifact.md)

If the dev preview's Phase A target note in
[`page.tsx`](../../../app/%28internal%29/test/brandmark-particle/page.tsx)
gets out of sync, fix it in the same PR.

### Why the dock stations look pixel-perfect at full density

The dock stations (sigil / miss / rail / orbit) are painted by the
**portal'd SVG glyph**, not by the particle field. The choreography
hook silences the particle station's render at full-density parks
(per-station `opacity: 0`) and flips `data-brand-svg-dock="<kind>"`
on `<html>` so the CSS re-shows the portal'd glyph at that anchor
(with a 200 ms crossfade). At rest the brandmark is the canonical
SVG file — true vector crispness, zero stipple.

Particles handle every moment of _cross-section_ motion:

- **Transit between stations** — particles disperse and re-cohere
  with the `sin(πt) × 0.45` bell curve. This is where the
  "pure-math substrate that can transform" story is on screen.
- **Backdrop (asking-gap)** — particles paint the sparse diagnostic
  atmosphere; the SVG glyph stays at opacity 0 because the backdrop's
  density (`0.22`) is below `SVG_DOCK_THRESHOLD`.
- **Post-orbit fade-out** — particles ramp opacity to 0.

The **entrance fade-in into section 02** is intentionally NOT a
particle moment. The original ADR-011 v1 design wrote a sigil
snapshot whose `opacity` ramped 0 → 1 across the band, but the
shader alpha-blends each particle individually so overlapping points
never combine to full opacity — the cloud read as stippled even at
density 1.0. From 2026-05-15 forward, the choreography hook flips
`data-brand-svg-dock="sigil"` as soon as the user crosses into the
fade-in band; the diagram's own entrance scrub
(`#definition top 85% → top 35%`) animates `.sigil__mark` opacity
0 → 1 smoothly, so the canonical SVG glyph fades in as clean vector.
Within-section entries always use the SVG; particles are reserved
for cross-section motion.

The **rail → orbit segment + practice sticky window** also need
explicit handling. The orbit anchor (`.approach__orbit__mark`) is
sticky inside `.approach__stage` (`position: sticky; top: clamp(60px,
12vh, 120px)`) so its rect.top clamps to a constant during sticky
engagement. Two compounding consequences:

1. `stationCenterY(orbit)` advances with `scrollY` in lockstep, so
   the generic rawT-based transit math in the rail → orbit segment
   only approaches 1 asymptotically — `parkAt(orbit)` would never
   fire inside the practice section. `applyJourney` re-bases the
   rail → orbit transit window on the practice section's top edge:
   once `practiceEl.getBoundingClientRect().top <= 0`, the orbit
   is parked.
2. `scrollY > c[lastIdx]` becomes perpetually true once sticky
   engages, so the post-orbit fade-out branch would fire across
   Navigate / Encode / Build — painting a decaying-opacity particle
   cloud over the canonical SVG. `applyJourney` short-circuits to
   `parkAt(orbit)` whenever the practice section straddles viewport
   top (`practiceTop <= 0 && practiceBottom > 0`). The fade-out
   branch then correctly only fires after practice has scrolled
   past (sticky window released, `rect.top` negative,
   `c[orbit] < scrollY` again reflects "past orbit").

The visible effect: orbit reads as canonical SVG across all three
practice sub-sections; fade-out engages cleanly once the user
scrolls past the practice section.

The handoff threshold is `SVG_DOCK_THRESHOLD = 0.95` in
[`useSigilChoreography.ts`](../../components/landing/v7/hooks/useSigilChoreography.ts).
Any station whose default density meets the threshold triggers the
SVG handoff in `parkAt`.

The particle field still exists as the design substrate even at the
dock — the same sampled buffer is loaded into the GPU; the shader
just renders zero opacity at full-density parks. This keeps the
strategic story coherent: the brandmark is always the same point
cloud, just rendered differently per moment, and at full density it
converges to the canonical SVG asset (which is the only thing the
viewer's eye can resolve at that scale).

**Two engine details supporting the in-motion particle look:**

1. **Stratified sampling** in
   [`sampleShape.ts`](../../lib/brandmark/sampleShape.ts). One sample
   per grid cell with intra-cell jitter — no Poisson clumping, so the
   inter-particle pitch is essentially uniform across the filled area.
   This eliminates the "stippled" look that uniform-random rejection
   sampling produces.
2. **Density-aware point sizing** in
   [`BrandmarkParticleStation.tsx`](../../components/brand/BrandmarkParticleField/BrandmarkParticleStation.tsx).
   The shader's `uPointSize` is computed each frame from
   `sqrt(coverage × rectW × rectH × fillRatio / visibleCount)`, where
   `coverage = COVERAGE_AT_FULL_DENSITY × density ^ COVERAGE_FALLOFF_EXP`.
   At full density the points oversize their pitch (overlap each
   neighbour) so the transit cloud reads as a continuous filled
   silhouette; at low densities the coverage exponent makes points
   shrink faster than the count drops, so the diagnostic backdrop
   reads as atmospheric grain rather than chunky confetti.

The four magic numbers live at the top of `BrandmarkParticleStation.tsx`:

| Constant                   | Default | Effect                                                                                                                    |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PARTICLE_COUNT` (desktop) | 3200    | Buffer size. Higher = finer stratification, smaller inter-particle pitch, more solid fill. GPU cost is trivial below ~5k. |
| `PARTICLE_COUNT_MOBILE`    | 1800    | Mobile budget. Same fillrate math, smaller buffer.                                                                        |
| `COVERAGE_AT_FULL_DENSITY` | 2.0     | Target coverage ratio at density 1.0. 2.0 = points overlap their pitch by √2 in each axis, so gaps close.                 |
| `COVERAGE_FALLOFF_EXP`     | 1.6     | How fast coverage drops as density drops. Higher = airier backdrop. Lower = denser-looking backdrop.                      |
| `POINT_SIZE_MIN_PX`        | 1.6     | Floor for tiny rects (rail). Prevents sub-pixel disappearance.                                                            |
| `POINT_SIZE_MAX_PX`        | 6       | Ceiling for huge rects (backdrop). Prevents blocky chunks.                                                                |

When the design pattern changes (e.g. you want the backdrop airier, or
a new dock at an unusual size), tune `COVERAGE_AT_FULL_DENSITY` and
`COVERAGE_FALLOFF_EXP` first; only touch the floor / ceiling if a
single specific dock size is misbehaving.

---

## Performance budget

- **Particles per station:** 2000 (desktop) / 1000 (mobile, viewport ≤
  960 px). One shared buffer per `(shapeKey, count)` via `sampleShape`'s
  memoisation — five stations of the same shape share one
  `Float32Array`.
- **Per-frame work:** five `useFrame` callbacks reading
  `getState().stations[kind]` (a single object lookup) and writing six
  uniforms. No allocations in the hot path.
- **Mobile fallback:** density tier 0.22 paints ≈ 440 visible particles
  (1000 × 0.22 on mobile / 2000 × 0.22 on desktop). Mobile fallback when
  WebGL fails or `prefers-reduced-motion: reduce` is set keeps the
  existing SVG actor + portal'd glyphs as the painter — zero GPU cost,
  same visual hierarchy as ADR-010 v3.
- **HMR / Fast Refresh:** the choreography hook re-creates the journey
  closure on every Fast Refresh; `sampleShape`'s cache survives so the
  sampled cloud stays stable. If you ever see particle positions
  shuffle after a hot reload, you've broken the seeded PRNG (or
  introduced an unseeded `Math.random()` into the sampling path).

---

## Runtime debugging

### Quick gate inspection

```js
// In DevTools console while on the v7 landing.
const root = document.documentElement;
const actor = document.querySelector(".tf-brandmark-actor");
const canvas = document.querySelector(".tf-brandmark-particle-canvas");
console.table({
  mode: root.getAttribute("data-brandmark-mode"),
  backdrop: root.getAttribute("data-brand-particle-backdrop"),
  brandOnMissing: root.getAttribute("data-brand-on-missing"),
  brandOnRail: root.getAttribute("data-brand-on-rail"),
  actorOpacity: getComputedStyle(actor).opacity,
  canvasOpacity: getComputedStyle(canvas).opacity,
});
```

In **particle** mode at any painted scroll position:

- `mode = "particle"`
- `backdrop = "true"`
- `actorOpacity = "0"` (CSS gate; the actor's inline opacity is
  whatever the choreography lerped, but the gate's `!important` wins)
- `canvasOpacity = "1"` (after the 240 ms CSS fade-in completes)

In **svg** mode at any painted scroll position:

- `mode = "svg"`
- `backdrop = "false"`
- `actorOpacity = "0.08"` (backdrop) or `"1"` (transit / orbit)
- `canvasOpacity = "0"` (component returns null; element absent)

### Playwright sample-and-jump recipe (extends `brandmark-choreography`)

Use the v3 recipe but additionally assert the canvas opacity at each
stop. Heuristics:

```
At scrollY = 0 (hero):                canvasOpacity = "0"  particleBackdrop = "false"
At #definition top - 100:             canvasOpacity = "0"
At sigil center:                      canvasOpacity = "1"  particleBackdrop = "true"
At miss center:                       canvasOpacity = "1"  brandOnMissing  = "parked"
At asking-gap center:                 canvasOpacity = "1"  particleBackdrop = "true"
At continuum center:                  canvasOpacity = "1"  brandOnRail     = "parked"
At practice orbit center:             canvasOpacity = "1"  orbitDocked     = "true"
At post-practice fade-out completion: canvasOpacity = "0"  particleBackdrop = "false"
```

A **sudden** canvas opacity drop in the middle of a parked window
usually means a stale snapshot write — verify the choreography hook's
`writeStationSnapshot` is still being called every scroll frame for that
station's branch.

---

## When you add a new shape (future)

Use `lib/brandmark/shapes.ts` (when it exists; today this is forward-looking):

```ts
import type { ShapeRegistryEntry } from "@/lib/brandmark/shapes";

export const compass: ShapeRegistryEntry = {
  key: "compass",
  paths: [
    /* path strings */
  ],
  viewBox: { x: 0, y: 0, width: 400, height: 400 },
};
```

Then either:

- Update `BrandmarkParticleStation` to accept a `shape` prop (passing
  through to `sampleShape`), OR
- Extend `StationSnapshot` with an optional `shape: ShapeKey` field and
  have each station's mesh re-create its buffer when the shape changes.

Either way, the engine doesn't need to change — sampling, shaders, and
gating are shape-agnostic by construction.

---

## When you touch CSS too

- The canvas wrapper has **inline** positioning (`position: fixed; inset:
0; pointer-events: none; z-index: 23`) plus a CSS class for the gated
  opacity fade. Inline keeps the wrapper rendering correctly on routes
  that don't import `landing.css` (e.g. the dev preview at
  `/test/brandmark-particle`).
- The `<style>` block inside
  [`BrandmarkParticleCanvas.tsx`](../../../components/brand/BrandmarkParticleField/BrandmarkParticleCanvas.tsx)
  forces `pointer-events: none` on the R3F inner wrapper AND the
  `<canvas>` element. R3F's default is `pointer-events: auto` (for its
  raycaster); the particle field has no pointer interactions, so the
  override is required to keep the full-viewport canvas from eating
  clicks meant for buttons / links beneath it.
- The four legacy gates from ADR-010 v3 (`data-brand-on-missing`,
  `data-brand-on-rail`, `data-orbit-docked`, and the
  `[data-quote-active="true"]` override during the practice quote-cover
  state) must keep their existing rules. The new
  `[data-brandmark-mode="particle"]` rules **compose** with them — they
  add an extra `opacity: 0 !important` for the native glyphs at parked
  states. Don't replace the legacy rules; they own the svg-mode path.
