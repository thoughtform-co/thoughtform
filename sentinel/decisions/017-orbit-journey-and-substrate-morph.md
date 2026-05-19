# ADR-017: Orbit journey + substrate-sphere morph

**Status:** Accepted
**Date:** 2026-05-19
**Builds on:** [ADR-013 — Brandmark journey refactor](013-brandmark-journey-refactor.md), [ADR-015 — Brandmark vector-first](015-brandmark-vector-first.md), [ADR-016 — Intelligence layer celestial triad](016-intelligence-layer-celestial-triad.md)
**Applies to:** Home (`/`) and `/claude-workshop`

## Context

The v7 landing handed off two visual stories with crossfades that the user explicitly does not want:

1. **Definition (`#definition`) → Diagnostic (`#missing-layer`)**. Two separate SVG trees: `.sigil__orbits` rings deformed in `#definition`, while `.miss__orbits` ellipses faded in via `--miss-orbit-emerge` in `#missing-layer`. Lands on the diagnostic and the orbits are "already there".
2. **Diagnostic brandmark → Encoded substrate sphere**. `BrandmarkVectorActor` ramps `vectorOpacity` `1 → 0` across the substrate HANDOFF window while the R3F substrate `CelestialBody` Fibonacci sphere emerges in parallel via `orbitEmerge(progress)`. The user reads it as an opacity crossfade, not a transformation.

User intent: "no fade-outs — code-driven transformation, geometric morph end-to-end".

## Decision

### A. Persistent traveling orbits

A new `<TravelingOrbits>` SVG painter is the SOLE source of orbit visuals across the sigil → miss leg in particle mode. The painter:

- Is fixed-positioned, full-viewport overlay at `z-index: 22` (between `.gateway` and the brandmark canvas).
- Renders four rings whose `(cx, cy)` lerps between the sigil anchor's screen centre and the miss anchor's screen centre via the same `c[sigil] → c[miss]` window the brandmark uses (matching `parkViewportFrac` so they travel in lock-step with the brandmark).
- Each ring's `(scaleX, scaleY, rotateDeg)` lerps from identity (concentric circle) to the canonical `MISS_ORBITS` ellipse via `SIGIL_RING_MORPHS` (re-exported as `ORBIT_RINGS`).
- Stroke / dash / weight interpolated by `--orbit-style-morph` (eased to lag the geometry by `smoothstep(0.15, 0.95)` so the rings reshape first and settle into the diagnostic stroke identity afterward — same eased curve as the legacy CSS used).
- No mid-journey opacity ramp. Hero entrance opacity matches `transform.opacity` (which is the brandmark's bookend channel); past miss the rings stay docked at miss and exit naturally as the section scrolls off-screen. Painter forces `display: none` past `parkedAt === "rail" | "orbit"` for cheap occlusion culling.
- The legacy `.sigil__ring` and `.miss__orbit` markup is hidden in particle mode by a `[data-brandmark-mode="particle"]` CSS gate. Bearing ticks, halo dots, miss orbit particles, anchors, and label pills remain visible — they belong to the section's instrument and are owned by the prototype DOM.

Files: [components/landing/v7/orbits/TravelingOrbits.tsx](../../components/landing/v7/orbits/TravelingOrbits.tsx), [components/landing/v7/orbits/orbitsJourney.ts](../../components/landing/v7/orbits/orbitsJourney.ts), `landing.css` (`.tf-traveling-orbits` + per-ring stroke endpoints).

### B. Unified brandmark → substrate sphere R3F mesh

A new `<SubstrateMorphPoints>` R3F component owns the substrate body's particle cloud. It mounts inside `TriadScene` (sibling to the substrate `CelestialBody`, both inside the rotation group). The substrate `CelestialBody` is given a new `renderCloud={false}` prop so its built-in Fibonacci `<points>` is skipped; rings, diamonds, atmosphere, and ambient lighting still render.

The morph mesh has 1900 points (matching the legacy `BODY_CLOUD_COUNT.substrate`) with three position-related attributes:

- `aHomeBrandmark: vec2` — sampled from `BRANDMARK_FULL_PATHS` via `lib/brandmark/sampleShape.ts`, in the brandmark's `[-0.5, 0.5]` normalised space (SVG y-down).
- `aHomeSphere: vec3` — Fibonacci sphere on the unit shell from `buildSphereCloudGeometry(0.46, 1900)`.
- `aSphereNormal: vec3` — surface normal (rim-glow shader uses this).

A new `substrateMorphVertex` shader composes both targets in WORLD space:

```
brandmarkTarget = uBrandmarkCenter + (aHomeBrandmark.xy * uBrandmarkSize) on z = uBrandmarkZ
sphereTarget    = uSphereCenter + aHomeSphere * uSphereRadius (+ breath × uSubstrateMorph)
worldPos        = mix(brandmarkTarget, sphereTarget, uSubstrateMorph)
```

Per frame, `useFrame` reads `transform.substrateMorph` from `brandmarkJourneyStore`, finds the substrate brandmark anchor (`#intelligence-layer .ilayer__brandmark-anchor`), and un-projects three viewport pixels (centre + right edge + bottom edge) onto the sphere's z plane via `THREE.Raycaster` + `THREE.Plane`. The result is the brandmark target centre + half-extent in the rotation-group's local frame.

Outcome: at `substrateMorph = 0` the cloud paints the brandmark shape exactly over the substrate dock; at `substrateMorph = 1` it paints the canonical Fibonacci sphere at the substrate body's centre. The lerp is geometric and continuous across scroll.

Files: [components/landing/v7/intelligence-layer/SubstrateMorphPoints.tsx](../../components/landing/v7/intelligence-layer/SubstrateMorphPoints.tsx), [components/landing/v7/intelligence-layer/shaders/substrateMorph.ts](../../components/landing/v7/intelligence-layer/shaders/substrateMorph.ts), [TriadScene.tsx](../../components/landing/v7/intelligence-layer/TriadScene.tsx) (wires the morph mesh), [CelestialBody.tsx](../../components/landing/v7/intelligence-layer/CelestialBody.tsx) (`renderCloud` prop).

### C. New `substrateMorph` channel on the journey transform

`BrandmarkTransform` gains a new `substrateMorph: number` field, computed inside the substrate scroll window via `substrateMorphProgress(ringProgress)` — a symmetric trapezoid envelope (`MORPH_EASE`) with `SUBSTRATE_MORPH_FRAC = 0.35`:

- Ramps `0 → 1` across the first 35% of the substrate window (cloud morphs from brandmark shape to sphere as the user enters the read beat).
- Holds at `1` through the centre of the window (sphere is the stable artefact while the substrate caption is read).
- Ramps `1 → 0` across the last 35% so the cloud collapses back into the brandmark shape exactly as the substrate window exits and the brandmark vector resumes ownership of the mark and travels toward the rail dock.

`HIDDEN_TRANSFORM` and all `parkedRectTransform` / `transitTransform` builders set this channel to `0`.

File: [lib/brandmark/journey.ts](../../lib/brandmark/journey.ts).

### D. Vector actor + dock-glyph cut

Both the fixed `BrandmarkVectorActor` shell and the portal'd substrate dock glyphs (`.tf-brandmark--substrate-full` / `.tf-brandmark--substrate-ring`) are visibility-cut OFF the moment the morph mesh begins painting:

- `BrandmarkVectorActor` reads `transform.substrateMorph > 0.001` and toggles `display: none` (instant, bypasses the shell's 120ms opacity transition). The particles cover the same silhouette at the same screen position so the swap is invisible.
- A new `--brandmark-substrate-cut` CSS variable (binary 0/1, written by `useBrandmarkJourney.applyParticleMode`) multiplies the substrate dock glyph opacities by `(1 - cut)`. Same instant cut.

The legacy `vectorOpacity` HANDOFF ramp (`vectorRingOpacity(progress)`) still computes its 1 → 0 curve inside the substrate window, but is now a no-op for the actor's visibility (the morph cut takes precedence). Kept for the substrate dock glyph crossfade between full + ring topologies inside the morph window — fully under cover of the morph particles, so any ramp it produces is invisible.

Files: [BrandmarkVectorActor.tsx](../../components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx), [useBrandmarkJourney.ts](../../components/landing/v7/hooks/useBrandmarkJourney.ts), `landing.css` (substrate dock-glyph rules).

### E. Reduced-motion / SVG-mode fallback

- `<TravelingOrbits>` returns null when `mode === "svg"`. The legacy `.sigil__orbits` + `.miss__orbits` markup is NOT hidden in svg mode (the CSS gate is `[data-brandmark-mode="particle"] …`), so the legacy two-tree handoff (CSS transform morph + `--miss-orbit-emerge` reveal) survives unchanged.
- `<SubstrateMorphPoints>` lives inside `IntelligenceLayerStack`, which is mounted only when the existing `IntelligenceLayerPortal` gate resolves to `r3f` mode (i.e., desktop + non-reduced-motion + WebGL). In `static` mode the `.ilayer__triad__fallback` SVG paints unchanged.
- `--brandmark-substrate-cut` is only written by `applyParticleMode` (gated by `particleModeOK`), so SVG mode never receives the cut and the substrate dock glyphs render normally.

## Consequences

- **Single source of truth for orbits**: `lib/celestial/orbits.ts` (`MISS_ORBITS` + `SIGIL_RING_MORPHS`) drives both the painter geometry AND the SVG-mode legacy CSS, so the morph endpoint is identical in both render paths.
- **Three rendering surfaces, one journey**: the brandmark vector (CSS-fixed SVG), the brandmark atmosphere (global R3F painter — atmosphere-only per ADR-015), and the substrate sphere morph (intelligence-layer R3F mesh) all read the same `BrandmarkTransform`. The morph mesh is the FOURTH painter (a substrate-scoped one) — its responsibility is bounded to the substrate scroll window.
- **No new opacity fades mid-journey**. Principle 2 of ADR-013 holds: every transition is geometric. The traveling orbits exit by scrolling (no opacity), the morph mesh transitions by position lerp (no opacity), and the visibility cuts on the vector actor / dock glyphs are instant under particle cover.
- **ADR-015 invariant survives**: the global brandmark canvas (`BrandmarkParticleStation`) remains atmosphere-only. The substrate-mesh particles paint the brandmark shape only inside the substrate window, only inside the intelligence-layer canvas — they belong to the substrate body, not the global brandmark canvas.

## Verification

- **Both `/` and `/claude-workshop`**:
  - Definition rings travel + deform into miss orbits as user scrolls. No fade between sections.
  - Brandmark vector remains crisp at miss; on entering substrate window, particles emerge in same shape; particles morph into sphere; sphere reads identical to legacy fibonacci sphere at `substrateMorph = 1`; cloud collapses back into brandmark shape as user exits intelligence layer; vector actor resumes for substrate → rail transit.
- **No mid-journey opacity writes**: dev parity log (`[brandmarkJourney]`) shows continuous `density`, `dispersion`, and `substrateMorph` channels. The `vectorOpacity` ramp inside substrate window is a no-op visually (covered by morph particles).
- **SVG mode**: legacy crossfade behaviour identical to pre-ADR-017.
- **Static mode** (mobile / reduced-motion): static `.ilayer__triad__fallback` paints; no R3F canvas; brandmark journey continues to drive `--miss-orbit-emerge` etc. for the legacy reveal.
