---
name: brandmark-particle
description: >
  Atmosphere-field shader model for the v7 brandmark (ADR-015 supersedes
  ADR-013's rendering surface). One `BrandmarkParticleStation` instance
  (aliased as `BrandmarkAtmosphere`) inside the global canvas paints
  luminous gold dust around the vector brandmark — NOT the brandmark
  shape itself. The crisp mark is rendered by `BrandmarkVectorActor`
  (inline SVG). Activates on edits to
  `components/brand/BrandmarkParticleField/**`,
  `lib/brandmark/sampleShape.ts`, the atmosphere shader (soft radial
  dots + additive blending), or anything that changes how the
  atmosphere field is rendered (vs. how the brandmark is choreographed,
  which is the `brandmark-choreography` skill).
---

# Brandmark atmosphere painter (soft radial dots, additive blending)

The brandmark **shape** is rendered by [`BrandmarkVectorActor`](../../components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx) — crisp inline SVG, pinned to the journey transform's rect via rAF. See ADR-015.

The **atmosphere field** is rendered by ONE `BrandmarkParticleStation` mesh inside the global `BrandmarkParticleCanvas` (fixed full-viewport, z:23). It paints luminous gold dust around the vector mark — sparse at transit, modestly dense during the substrate window, fully off at full-mark parked states (sigil / miss / rail / orbit). Every frame the painter reads the `BrandmarkTransform` from `brandmarkJourneyStore` and writes the per-frame uniforms onto its `ShaderMaterial`:

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

**Canonical record:** [ADR-015](../../../sentinel/decisions/015-brandmark-vector-first.md) (current — vector-first split).
**Predecessor:** [ADR-013](../../../sentinel/decisions/013-brandmark-journey-refactor.md) (journey contract retained verbatim; only the rendering surface changed).
**Related (state machine):** [`brandmark-choreography`](../brandmark-choreography/SKILL.md).

---

## The shader contract

[`components/brand/BrandmarkParticleField/shaders.ts`](../../../components/brand/BrandmarkParticleField/shaders.ts) defines the vertex + fragment shaders. The vertex shader does four things:

1. **Rank clip.** `if (aRank > uVisibleCount) gl_PointSize = 0` — density dial without rebuilding the buffer.
2. **Wander.** Two-frequency sinusoidal drift on `aSeed`, scaled by `uDispersion * uHalfSize`.
3. **Squash-rotation (ADR-013).** `aHome.x *= cos(uRotationY)` plus a perspective shear `aHome.y * sin(uRotationY) * SHEAR_SCALE`. At `uRotationY = 0` this is identity (axis-aligned); at peak tilt the brandmark squashes to a vertical strip — visually equivalent to the 3D rotation read of the surrounding R3F rings.
4. **Pixel → NDC.** Direct conversion via `uViewport` — no camera matrix needed. The painter is pixel-native; rect lerps in `getBoundingClientRect()` space, no projection math required.

The fragment shader paints a **soft radial dot** (`1.0 - smoothstep(0.35, 0.5, length(gl_PointCoord - 0.5))`) with `THREE.AdditiveBlending` on the material. Each point reads as a luminous gold speck; overlapping points brighten as a halo. The previous solid-square aesthetic (ADR-011 / ADR-013) is retired — at substrate scale it produced a papercraft / mosaic look that clashed with the celestial-editor design language.

`SHEAR_SCALE = 0.18` is now mostly redundant — the vector actor handles brandmark rotation honestly via CSS `perspective(...) rotateY(...)`. The shader's 2D squash on `uRotationY` is kept so the atmosphere tilts in sympathy with the vector mark during the substrate window (a small visual touch — the dust drifts with the rotation rather than staying axis-aligned). Set `uRotationY = 0` to disable; the journey transform already keeps it 0 outside the substrate window.

---

## Point sampling (sampleShape)

`lib/brandmark/sampleShape.ts` uses **stratified sampling** with intra-cell jitter (one sample per grid cell, no rejection clumping). The atmosphere is intentionally sparse: at typical densities (substrate 0.15, transit 0–0.5 with the dispersion bump) only a fraction of the 800 desktop / 500 mobile points are visible at any frame, and each is rendered large enough to glow as a luminous speck rather than overlap as a filled silhouette. The auto-scaled point size in the painter's `useFrame` keeps coverage proportional to the rect — the formula is:

```
coverage = COVERAGE_AT_FULL_DENSITY (0.35) × density ^ COVERAGE_FALLOFF_EXP (1.6)
pointSize = sqrt(coverage × rectW × rectH × fillRatio / visibleCount)
pointSize clamped to [POINT_SIZE_MIN_PX (6), POINT_SIZE_MAX_PX (18)]
```

Tune in `/test/brandmark-vector` (the new dev preview page that mounts both the vector actor and the atmosphere). The retired `/test/brandmark-particle` preview is kept for back-compat but no longer matches the production model. Copy any changed constants into this skill alongside ADR-015.

---

## When to change what

| Want to change                            | File                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Brandmark shape itself                    | `BrandmarkVectorActor.tsx` (not here — vector actor owns the mark)                  |
| Point count / mobile budget               | `BrandmarkParticleStation.tsx` (`PARTICLE_COUNT` / `PARTICLE_COUNT_MOBILE`)         |
| Coverage / point-size formula             | same file (`COVERAGE_AT_FULL_DENSITY`, `COVERAGE_FALLOFF_EXP`, point-size clamps)   |
| Soft-dot core radius / falloff edge       | `shaders.ts` (`smoothstep(0.35, 0.5, ...)` in fragment shader)                      |
| Per-station atmosphere density            | `lib/brandmark/journey.ts` (`parked.density` per keyframe)                          |
| Transit exhaust amplitude                 | `lib/brandmark/journey.ts` (`transitIn.dispersionBump` per keyframe)                |
| Brandmark tint                            | `lib/stores/brandmarkJourneyStore.ts` (`DEFAULT_TINT`)                              |
| Sampling strategy (uniform vs stratified) | `lib/brandmark/sampleShape.ts`                                                      |
| Add a new uniform / shader feature        | `shaders.ts` + `BrandmarkParticleStation.tsx` (uniforms object + `useFrame` writer) |

---

## Don't reintroduce

- **Solid-square fragment shader.** `gl_FragColor = vec4(uTint, vAlpha)` was the papercraft tile aesthetic that ADR-015 retired. Soft radial dots + additive blending are the contract.
- **The brandmark shape painted by particles.** The atmosphere field never paints the brandmark silhouette — that's `BrandmarkVectorActor`'s job. `parked.density` at full-mark stations (sigil / miss / rail / orbit) stays at 0.
- **Per-station snapshots.** There is ONE transform, not five. Mounting more than one `BrandmarkParticleStation` instance is forbidden — the painter is a singleton.
- **`brandmarkParticles.ts` / R3F-local brandmark `<points>`.** The intelligence-layer R3F scene is orbits + pips only. The global painter draws the atmosphere inside that section.
- **`data-brand-svg-dock` / `data-brand-particle-backdrop` gates.** The painter's visibility is controlled by `uOpacity` (per-frame from the journey transform). The wrapper opacity stays at 1 in particle mode.
- **Two particle implementations.** There is one shader. Any new atmospheric visual that needs particles MUST go through the journey transform + the existing painter.

---

## Pre-merge checklist (rendering invariants)

- [ ] **One painter mesh** — `BrandmarkParticleCanvas` mounts exactly one `BrandmarkParticleStation` (it takes no `stations` prop).
- [ ] **Cloud opacity (`uOpacity`)** stays at 1 anywhere between hero exit and post-orbit fade. Only the bookends ramp opacity (Principle 2).
- [ ] **Rect lerp is geometric** — `uCenter` + `uHalfSize` change continuously each scroll frame; no opacity crossfade replaces a geometric morph.
- [ ] **Dispersion bump** appears only in the sigil → miss leg (the default `sin(πt)*0.45`). All other arrivals (`substrate`, `rail`, `orbit`) have `dispersionBump: null` — no scatter on growing / shrinking transits.
- [ ] **Rotation** is 0 outside the substrate window. Inside the window it follows `splitRotation(ringProgress)` ramping smoothly from 0 → peak → 0.
- [ ] **In SVG mode** the canvas returns `null`; no painter mesh exists; the actor + native dock SVGs handle visibility via the journey hook's SVG-mode side effects.
- [ ] **HMR / Fast Refresh** — the journey hook resets the store to `HIDDEN_TRANSFORM`; the painter hides on its next `useFrame` and disposes its GPU buffers on unmount.
