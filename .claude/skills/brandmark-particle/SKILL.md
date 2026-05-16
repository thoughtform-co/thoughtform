---
name: brandmark-particle
description: >
  Single-painter shader model for the v7 brandmark (ADR-013). One
  `BrandmarkParticleStation` instance inside the global
  `BrandmarkParticleCanvas` paints the brandmark cloud continuously
  throughout the journey, reading the `BrandmarkTransform` from
  `brandmarkJourneyStore`. Activates on edits to
  `components/brand/BrandmarkParticleField/**`,
  `lib/brandmark/sampleShape.ts`, the brandmark shader
  (`uRotationY` / 2D squash math), or anything that changes how the
  brandmark cloud is rendered (vs. how it is choreographed, which is
  the `brandmark-choreography` skill).
---

# Brandmark particle painter (single shader, single instance)

The brandmark cloud is rendered by ONE `BrandmarkParticleStation` mesh inside the global `BrandmarkParticleCanvas` (fixed full-viewport, z:23). Every frame the painter reads the `BrandmarkTransform` from `brandmarkJourneyStore` and writes the per-frame uniforms onto its `ShaderMaterial`:

| Transform field  | Uniform         | What it does                                               |
| ---------------- | --------------- | ---------------------------------------------------------- |
| `rect.center`    | `uCenter`       | Where in viewport pixels the cloud is centred              |
| `rect.halfSize`  | `uHalfSize`     | Half-extent of the rect (cloud size)                       |
| `opacity`        | `uOpacity`      | Per-particle alpha — 0 only at hero / orbit bookends       |
| `density`        | `uVisibleCount` | Rank-clip threshold (rank > visibleCount → off-screen)     |
| `dispersion`     | `uDispersion`   | Particle wander amplitude (`* uHalfSize` in the shader)    |
| `rotationY`      | `uRotationY`    | 2D squash + perspective shear (approximates 3D Y rotation) |
| `density` (auto) | `uPointSize`    | Auto-scaled per-frame from `density × rectW × rectH`       |

Mode flag in the store:

- `mode === "particle"`: canvas mounts; painter renders.
- `mode === "svg"`: canvas returns `null`; SVG actor + native dock SVGs paint via the journey hook's SVG-mode side effects.

**Canonical record:** [ADR-013](../../../sentinel/decisions/013-brandmark-journey-refactor.md).
**Related (state machine):** [`brandmark-choreography`](../brandmark-choreography/SKILL.md).

---

## The shader contract

[`components/brand/BrandmarkParticleField/shaders.ts`](../../../components/brand/BrandmarkParticleField/shaders.ts) defines the vertex + fragment shaders. The vertex shader does four things:

1. **Rank clip.** `if (aRank > uVisibleCount) gl_PointSize = 0` — density dial without rebuilding the buffer.
2. **Wander.** Two-frequency sinusoidal drift on `aSeed`, scaled by `uDispersion * uHalfSize`.
3. **Squash-rotation (ADR-013).** `aHome.x *= cos(uRotationY)` plus a perspective shear `aHome.y * sin(uRotationY) * SHEAR_SCALE`. At `uRotationY = 0` this is identity (axis-aligned); at peak tilt the brandmark squashes to a vertical strip — visually equivalent to the 3D rotation read of the surrounding R3F rings.
4. **Pixel → NDC.** Direct conversion via `uViewport` — no camera matrix needed. The painter is pixel-native; rect lerps in `getBoundingClientRect()` space, no projection math required.

The fragment shader paints a solid square — no antialiasing, no radial falloff — so dense clouds read as a filled silhouette and sparse clouds read as discrete pixels.

`SHEAR_SCALE = 0.18` is tuned visually so subtle tilt at low `rotationY` barely registers but peak tilt reads as real 3D foreshortening. Bump it up to exaggerate the tip-back; reduce it for a flatter squash.

---

## Point sampling (sampleShape)

`lib/brandmark/sampleShape.ts` uses **stratified sampling** with intra-cell jitter (one sample per grid cell, no rejection clumping). At `density = 1.0` the brandmark reads as a filled mark; at `density = 0.22` the cloud reads as atmospheric grain. The auto-scaled point size in the painter's `useFrame` keeps coverage solid at any rect size — the formula is:

```
coverage = COVERAGE_AT_FULL_DENSITY (2.0) × density ^ COVERAGE_FALLOFF_EXP (1.6)
pointSize = sqrt(coverage × rectW × rectH × fillRatio / visibleCount)
pointSize clamped to [POINT_SIZE_MIN_PX (1.6), POINT_SIZE_MAX_PX (6)]
```

Tune in `/test/brandmark-particle` (the dev preview page); copy any changed constants into this skill alongside ADR-013.

---

## When to change what

| Want to change                            | File                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Point count / mobile budget               | `BrandmarkParticleStation.tsx` (`PARTICLE_COUNT` / `PARTICLE_COUNT_MOBILE`)         |
| Coverage / point-size formula             | same file (`COVERAGE_AT_FULL_DENSITY`, `COVERAGE_FALLOFF_EXP`, point-size clamps)   |
| 2D squash / perspective shear strength    | `shaders.ts` (`SHEAR_SCALE` constant)                                               |
| Brandmark tint                            | `lib/stores/brandmarkJourneyStore.ts` (`DEFAULT_TINT`)                              |
| Sampling strategy (uniform vs stratified) | `lib/brandmark/sampleShape.ts`                                                      |
| Add a new uniform / shader feature        | `shaders.ts` + `BrandmarkParticleStation.tsx` (uniforms object + `useFrame` writer) |

---

## Don't reintroduce

- **Per-station snapshots.** There is ONE transform, not five. Mounting more than one `BrandmarkParticleStation` instance is forbidden — the painter is a singleton.
- **`brandmarkParticles.ts` / R3F-local brandmark `<points>`.** The intelligence-layer R3F scene is rings-only. The global painter draws the brandmark cloud inside that section too.
- **`data-brand-svg-dock` / `data-brand-particle-backdrop` gates.** The painter's visibility is controlled by `uOpacity` (per-frame from the journey transform). The wrapper opacity stays at 1 in particle mode.
- **Two particle implementations.** There is one shader. Any new brandmark visual that needs particles MUST go through the journey transform + the existing painter.

---

## Pre-merge checklist (rendering invariants)

- [ ] **One painter mesh** — `BrandmarkParticleCanvas` mounts exactly one `BrandmarkParticleStation` (it takes no `stations` prop).
- [ ] **Cloud opacity (`uOpacity`)** stays at 1 anywhere between hero exit and post-orbit fade. Only the bookends ramp opacity (Principle 2).
- [ ] **Rect lerp is geometric** — `uCenter` + `uHalfSize` change continuously each scroll frame; no opacity crossfade replaces a geometric morph.
- [ ] **Dispersion bump** appears only in the sigil → miss leg (the default `sin(πt)*0.45`). All other arrivals (`substrate`, `rail`, `orbit`) have `dispersionBump: null` — no scatter on growing / shrinking transits.
- [ ] **Rotation** is 0 outside the substrate window. Inside the window it follows `splitRotation(ringProgress)` ramping smoothly from 0 → peak → 0.
- [ ] **In SVG mode** the canvas returns `null`; no painter mesh exists; the actor + native dock SVGs handle visibility via the journey hook's SVG-mode side effects.
- [ ] **HMR / Fast Refresh** — the journey hook resets the store to `HIDDEN_TRANSFORM`; the painter hides on its next `useFrame` and disposes its GPU buffers on unmount.
