---
name: brandmark-particle
description: >
  Particle painters for the v7 brandmark — atmosphere field (ADR-015),
  silhouette point cloud (ADR-019), and substrate-sphere morph
  (ADR-017). Three painters live inside the global
  `BrandmarkParticleCanvas`; the substrate-sphere mesh lives inside
  the intelligence-layer R3F canvas. All read the SAME journey
  transform. Activates on edits to
  `components/brand/BrandmarkParticleField/**`,
  `lib/brandmark/sampleShape.ts`, any shader in this folder, or
  anything that changes how a particle painter is rendered (vs. how
  the brandmark is choreographed, which is the `brandmark-choreography`
  skill).
---

# Brandmark particle painters (atmosphere + silhouette + substrate-sphere)

The brandmark shape painter changes along the journey:

- **Sigil (Thoughtform rest)** — crisp inline SVG via [`BrandmarkVectorActor`](../../components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx) (ADR-015).
- **Sigil → miss transit, miss / rail / orbit parks** — silhouette point cloud via `BrandmarkSilhouettePoints` (ADR-019).
- **Substrate window** — brandmark → sphere morph via `SubstrateMorphPoints` inside the intelligence-layer R3F canvas (ADR-017). The global silhouette mesh is suppressed during this window.
- **Everywhere** — atmosphere dust via `BrandmarkParticleStation` (ADR-015). Damped at miss park onward so the silhouette reads cleanly.

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

**Canonical records:**

- [ADR-015](../../../sentinel/decisions/015-brandmark-vector-first.md) — vector-first split (atmosphere does not paint the mark by default).
- [ADR-017](../../../sentinel/decisions/017-orbit-journey-and-substrate-morph.md) — substrate-sphere morph mesh exemption (intelligence-layer canvas).
- [ADR-019](../../../sentinel/decisions/019-brandmark-silhouette-morph.md) — silhouette particle mesh from Diagnostic onward (global canvas).

**Predecessor:** [ADR-013](../../../sentinel/decisions/013-brandmark-journey-refactor.md) (journey contract retained verbatim; only the rendering surface evolves).
**Related (state machine):** [`brandmark-choreography`](../brandmark-choreography/SKILL.md).

---

## The silhouette painter (ADR-019)

[`components/brand/BrandmarkParticleField/BrandmarkSilhouettePoints.tsx`](../../../components/brand/BrandmarkParticleField/BrandmarkSilhouettePoints.tsx) — global silhouette point cloud, mounted alongside the atmosphere station inside `BrandmarkParticleCanvas`. Reads:

| Transform field   | Uniform              | What it does                                                                   |
| ----------------- | -------------------- | ------------------------------------------------------------------------------ |
| `rect.center`     | `uCenter`            | Where the silhouette paints (same anchor the atmosphere uses)                  |
| `rect.halfSize`   | `uHalfSize`          | Silhouette size                                                                |
| `opacity`         | `uOpacity`           | Base alpha (hero/orbit bookend fades only)                                     |
| `silhouetteMorph` | `uMorph`             | Cover-in envelope. 0 = nothing painted, ≥0.6 = full silhouette at rect         |
| `substrateMorph`  | (binary suppression) | While > 0.001 the global mesh is hidden — substrate-sphere mesh owns the shape |

Density tier: **1900 desktop / 700 mobile** (substrate-tier so the silhouette reads as a solid mark). Soft radial dot fragment shader, additive blending — same family as the atmosphere but with a slightly tighter core (`smoothstep(0.30, 0.5, d)`) so the silhouette stays crisp.

The vector actor crossfades out across `silhouetteMorph ∈ [0, 0.55]` so the visible silhouette equals `vector + particles` at every frame (Principle 3 honoured geometrically, not via opacity crossfade against empty space).

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
- **The atmosphere field painting the brandmark silhouette.** ADR-015's split is still load-bearing for the atmosphere — that mesh paints dust + exhaust, never the mark. The silhouette mesh (ADR-019) is the documented exception; do not move silhouette responsibilities onto `BrandmarkParticleStation`.
- **Per-station snapshots.** There is ONE transform, not five. Mounting more than one `BrandmarkParticleStation` or `BrandmarkSilhouettePoints` instance is forbidden — both are singletons.
- **A fourth global particle mesh.** Three painters at most (atmosphere + silhouette globally, substrate-sphere inside the intelligence-layer canvas). Any new particle visual that PAINTS THE BRAND MARK SILHOUETTE must extend an existing painter or replace one — not add a fourth. (Substrate-layer artifacts of the accretion shell — e.g. the brain cloud in `ShellSubstrate.tsx`, ADR-018 Phase 5 — are NOT brandmark painters; they wrap the mark from outside and do not count against this cap.) **Exception (ADR-021 Phase 2): `CorridorSeamPixelField`** is an intentional ADR-015 exception — a 3px square gold/dawn 2D-canvas pixel field that paints the brandmark in `#services` only after the corridor releases. It lives OUTSIDE `BrandmarkParticleCanvas` (its own 2D canvas, its own rAF, gated by `data-services-pixelate`), is OUTSIDE the brandmark journey contract (it reads `seamMorph` from `depthGatewayStore`, not the journey transform), and does NOT count against the global cap. It samples the SAME `BRANDMARK_FULL_PATHS` (ADR-014) so the silhouette read matches the SVG glyph it replaces.
- **`data-brand-svg-dock` / `data-brand-particle-backdrop` gates.** Painter visibility is controlled by per-frame uniforms from the journey transform. The wrapper opacity stays at 1 in particle mode.
- **Opacity crossfades between renderers.** The vector → silhouette handoff is a geometric cover-in (silhouette inflates from rect centre; vector recedes in proportion). The silhouette → substrate-sphere handoff is a binary cut under matching screen-anchor particles. Both honour Principle 3.

---

## Pre-merge checklist (rendering invariants)

- [ ] **Two global meshes** — `BrandmarkParticleCanvas` mounts exactly one `BrandmarkParticleStation` (atmosphere) AND one `BrandmarkSilhouettePoints` (silhouette). Both are singletons; neither takes per-station props.
- [ ] **Cloud opacity (`uOpacity`)** stays at 1 anywhere between hero exit and post-orbit fade. Only the bookends ramp opacity (Principle 2).
- [ ] **Rect lerp is geometric** — `uCenter` + `uHalfSize` change continuously each scroll frame; no opacity crossfade replaces a geometric morph.
- [ ] **Dispersion bump** appears only in the sigil → miss leg (the default `sin(πt)*0.45`). All other arrivals (`substrate`, `rail`, `orbit`) have `dispersionBump: null` — no scatter on growing / shrinking transits.
- [ ] **Rotation** is 0 outside the substrate window. Inside the window it follows `splitRotation(ringProgress)` ramping smoothly from 0 → peak → 0.
- [ ] **In SVG mode** the canvas returns `null`; no painter mesh exists; the actor + native dock SVGs handle visibility via the journey hook's SVG-mode side effects.
- [ ] **HMR / Fast Refresh** — the journey hook resets the store to `HIDDEN_TRANSFORM`; the painter hides on its next `useFrame` and disposes its GPU buffers on unmount.
