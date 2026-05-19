# ADR-015: Vector-First Brandmark + Celestial-Editor Linework

**Date:** 2026-05-17
**Status:** Accepted — supersedes the "brandmark cloud paints the brandmark shape" model of ADR-011 / ADR-013, and refines the I-Layer triad of ADR-014.

**Related (superseded):**
[ADR-011 — Brandmark particle artifact](011-brandmark-particle-artifact.md),
[ADR-013 — Brandmark journey refactor](013-brandmark-journey-refactor.md) (rendering surface only — the continuous-transform model + journey hook are retained verbatim).

**Related (refines):**
[ADR-014 — Intelligence layer orbital triad](014-intelligence-layer-orbital-triad.md).

**Related (composes with):**
[ADR-008 — Landing v7 background layers](008-landing-v7-background-layers.md),
[ADR-010 — Brandmark choreography](010-brandmark-choreography.md) (state machine),
[ADR-017 — Orbit journey + substrate-sphere morph](017-orbit-journey-and-substrate-morph.md). The "atmosphere painter is atmosphere-only" invariant survives ADR-017: the new substrate-sphere morph mesh paints the brandmark shape ONLY inside the substrate scroll window, ONLY inside the intelligence-layer R3F canvas, and is bound to the substrate body — not the global brandmark canvas. `BrandmarkParticleStation` continues to paint atmospheric grain + transit exhaust everywhere else in the journey.

---

## Context

ADR-011 / ADR-013 modelled the brandmark as a **single point cloud sampled from `BRANDMARK_FULL_PATHS`** and rendered end-to-end by a custom `<points>` shader. The shader painted **solid axis-aligned squares** (`gl_FragColor = vec4(uTint, vAlpha); gl_PointSize = clamp(autoSize, 1.6, 6)`) to mimic the Canvas-2D `fillRect()` aesthetic of `ParticleWordmarkMorph` / `ThoughtformSigil`.

At small rects (sigil ~232 px, miss ~144 px, rail ~56 px) the dense sampling overlapped well enough to read as a filled mark. At **the substrate state in the Intelligence Layer (~280–460 px rect)** the geometry broke down: 3200 × 6 px solid squares cannot tile a 280–460 px region smoothly. The brandmark read as **papercraft tiles** — a mosaic of gold squares — which clashed with the celestial-editor design language (hairline strokes, dashed rings, cardinal diamonds, drawn-in `stroke-dashoffset` animations) used elsewhere on the page (`components/landing/v7/CelestialConnector/`).

User feedback (2026-05-17): _"the way the particle effect is making it look like a mosaic or a collage a child made in art class with paper; so not really aligned with the slick, retrofuturistic vibe we're looking for."_

The journey architecture from ADR-013 is sound — one transform, one painter, continuous evolution. The papercraft aesthetic is a property of the **fragment shader**, not the architecture. This ADR retunes the rendering surface without touching the journey contract.

---

## Decision

Split the brandmark's rendering responsibilities along the line that the shader was trying to do both at once:

```
                       ┌── BrandmarkVectorActor ── crisp SVG, owns the mark shape
scrollY → transform ───┤
                       └── BrandmarkAtmosphere   ── soft glowing dots, ambient grain
                                                    + transit exhaust only
```

Both painters read the **same `BrandmarkTransform`** from `brandmarkJourneyStore`. The journey hook, keyframe table, substrate-window math, and `BrandmarkTransform` schema are unchanged. What changes is **what each painter does with the transform.**

### 1. Vector-first brandmark (`BrandmarkVectorActor`)

[`components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx`](../../components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx) renders the canonical brandmark as **inline SVG end-to-end**:

- Fixed-position `<div>` shell pinned to `transform.rect.{left, top, width, height}` every rAF tick via `style.cssText` writes (no React re-renders).
- Two stacked SVG glyphs inside the shell:
  - `BrandmarkGlyph` (full mark — `BRANDMARK_FULL_PATHS`).
  - [`BrandmarkRingGlyph`](../../components/brand/BrandmarkVectorActor/BrandmarkRingGlyph.tsx) (outer C-arc only — `BRANDMARK_RING_PATHS`).
- Shape morph (`transform.shapeBlend ∈ [0, 1]`) is a single opacity crossfade between the two glyphs. `0` = full mark, `1` = ring only.
- `transform.rotationY` is applied honestly via CSS `perspective(900px) rotateY(<rad>rad)` on an inner wrapper — actual 3D rotation, no shader squash approximation needed.
- `transform.opacity` ramps the shell opacity at hero / post-orbit bookends (per Principle 5 of ADR-013).
- `filter: drop-shadow(0 0 18px rgba(202, 165, 84, 0.32))` gives the retrofuturistic glow without rasterising.

At every parked state (sigil, miss, substrate, rail, orbit) the brandmark is the canonical SVG — vector-crisp at any size. Morphs are smooth because the transform is continuous and CSS handles the lerp.

### 2. Atmosphere field (`BrandmarkAtmosphere` — same module, new role)

[`components/brand/BrandmarkParticleField/`](../../components/brand/BrandmarkParticleField/) (exported as both `BrandmarkParticleCanvas` and the new alias `BrandmarkAtmosphereCanvas` for caller clarity). The R3F canvas, the single `<points>` station, and the journey-transform wiring are all unchanged. The **fragment shader is rewritten** and **density / point-size constants are retuned** so the field paints **luminous gold dust**, not the brandmark shape:

- Fragment shader (`components/brand/BrandmarkParticleField/shaders.ts`) now does `1.0 - smoothstep(0.35, 0.5, length(gl_PointCoord - 0.5))` for a tight bright core surrounded by a soft halo, with `if (alpha <= 0.001) discard`.
- Material switched from `THREE.NormalBlending` to `THREE.AdditiveBlending` — overlapping points brighten rather than blending, so dense regions glow as a halo and sparse regions read as discrete sparks.
- `PARTICLE_COUNT`: 3200 → **800** desktop; 1800 → **500** mobile.
- `POINT_SIZE_MIN_PX`: 1.6 → **6**, `POINT_SIZE_MAX_PX`: 6 → **18** — each grain is now a luminous speck.
- `COVERAGE_AT_FULL_DENSITY`: 2.0 → **0.35** — the atmosphere is intentionally sparse; it does not fill the brandmark's silhouette.

The atmosphere stays out of the brandmark's job description. Particles handle what particles do well: atmospheric grain and motion exhaust.

### 3. Journey keyframe retuning (`lib/brandmark/journey.ts`)

The `parked.density` value no longer means "how much of the brandmark do we paint with particles"; it means "how much atmospheric dust accompanies the vector mark at this station". Retuned to match the new role:

| Keyframe  | Old density | New density | Old dispersion | New dispersion | Inbound bump                 |
| --------- | ----------- | ----------- | -------------- | -------------- | ---------------------------- |
| sigil     | 1.0         | **0**       | 0              | 0              | (first keyframe)             |
| miss      | 1.0         | **0**       | 0              | 0              | default `sin(πt) * 0.45`     |
| substrate | 1.0         | **0.15**    | 0              | **0.35**       | **`sin(πt) * 0.35` exhaust** |
| rail      | 1.0         | **0**       | 0              | 0              | **`sin(πt) * 0.35` exhaust** |
| orbit     | 1.0         | **0**       | 0              | 0              | **`sin(πt) * 0.20` exhaust** |

Full-mark stations get density 0 — the vector mark sits alone, crisp, no halo. The substrate hold beat gets a modest density + dispersion so the intelligence-layer scene reads as a luminous field around the vector ring. The transit `dispersionBump` is **restored** on every size-changing leg (previously suppressed under ADR-013 because the cloud's coherence was the visual story) — now exhaust around a crisp moving vector is the visual story.

### 4. Celestial-editor linework in the I-Layer ([`CelestialLinework.tsx`](../../components/landing/v7/intelligence-layer/CelestialLinework.tsx))

A new SVG overlay portal'd into `.ilayer__brandmark-anchor` adds **celestial-editor enrichment around the brandmark vector ring** during the substrate window:

- **Outer guide ring** — hairline gold dashed circle at viewBox r=110, `stroke-dasharray: "2 6"`, `stroke-opacity: 0.45`. Drawn in via `stroke-dashoffset` driven by `--ilayer-progress`.
- **Bearing ticks** — 8 short radial marks at 30° intervals (skipping the cardinal angles), `stroke-opacity: 0.6`.
- **Cardinal diamonds** — 4 hairline diamond polygons at 0/90/180/270° on the guide ring's rim, `stroke-opacity: 0.85`, scaled 0 → 1 with `transform: scale(var(--tf-cl-progress))`.
- Entire overlay's progress is computed in pure CSS: `--tf-cl-progress: min(1, max(0, calc(var(--ilayer-progress, 0) * 12.5)))` — fully drawn in by the time the substrate-window ringProgress reaches 0.08.

The brandmark vector actor (in ring topology) is the **centre orbital body** of the triad. The `OrbitField` R3F scene continues to paint the left + right side orbits. The celestial linework is the decorative overlay that ties the brandmark visually to the celestial-editor design language.

### 5. CSS gates

[`components/landing/v7/landing.css`](../../components/landing/v7/landing.css) adds:

```css
[data-brandmark-mode="svg"] .tf-brandmark-vector-actor {
  display: none !important;
}
@media (prefers-reduced-motion: reduce) {
  .tf-brandmark-vector-actor {
    display: none !important;
  }
}
```

In SVG-fallback mode (reduced motion or no WebGL) the legacy `BrandmarkActor` paints transit and the native dock SVGs handle parked states — exactly as in ADR-013. The vector actor is suppressed.

---

## Consequences

### Positive

- **Mosaic / papercraft aesthetic is gone.** Every parked state at every size renders as crisp inline SVG. The substrate brandmark in the I-Layer reads as a clean gold C-arc, not as tiled squares.
- **The brandmark journey contract is preserved.** Same five keyframes, same continuous transform, same substrate window. Anyone who reads the journey hook can still reason about the brandmark's per-frame state without touching the renderer.
- **The brandmark remains pure code, morphable.** Two stacked SVG glyphs from the canonical path table; shape morph is a single opacity dial. Adding a new shape topology is one entry in `lib/brandmark/shapes.ts` + one new `BrandmarkXGlyph` component.
- **The atmosphere finally does its job.** Particles paint luminous dust and motion exhaust — what they're good at — without trying to also paint the mark itself.
- **The I-Layer is now native celestial-editor language.** Three hairline orbits + cardinal diamonds + drawn-in guide rings + bearing ticks. The substrate moment reads as an instrument panel, not as a particle cloud trying to be a ring.
- **Substantially less work per frame.** 800 particles (down from 3200) with a smaller, simpler vertex shader path. Plus no per-frame buffer re-sampling.
- **Internal preview surface stays useful.** `/test/brandmark-vector` mounts both painters with sliders for every channel + a synthetic scrubbable journey.

### Negative

- **Two painters where there was one.** ADR-013 sold "one painter end-to-end" as the simplification — we've split that into "one vector painter for the mark + one atmosphere painter for grain". They both read the same single transform; no choreography duplication. Mental model is "vector + atmosphere" rather than "the cloud IS the brandmark".
- **The "brandmark made of particles" strategic story changes.** The strategic framing moves from "the brand IS particles" to "the brand is a vector substrate that emits an atmosphere". Still substrate, still runtime, still morphable — just with the right material for each moment.
- **Path morphing is opacity crossfade, not interpolation.** The full→ring morph is two stacked SVGs blending via opacity. True path interpolation (Flubber, `svg-path-properties`) is a drop-in upgrade if a future moment needs it; the contract (read `shapeBlend ∈ [0, 1]` from the transform) is the same either way.

---

## Related artifacts

- Vector actor: [`components/brand/BrandmarkVectorActor/`](../../components/brand/BrandmarkVectorActor/)
- Ring glyph: [`components/brand/BrandmarkVectorActor/BrandmarkRingGlyph.tsx`](../../components/brand/BrandmarkVectorActor/BrandmarkRingGlyph.tsx)
- Atmosphere field (former particle field): [`components/brand/BrandmarkParticleField/`](../../components/brand/BrandmarkParticleField/)
- Celestial linework: [`components/landing/v7/intelligence-layer/CelestialLinework.tsx`](../../components/landing/v7/intelligence-layer/CelestialLinework.tsx)
- I-Layer portal (mounts linework): [`components/landing/v7/intelligence-layer/IntelligenceLayerPortal.tsx`](../../components/landing/v7/intelligence-layer/IntelligenceLayerPortal.tsx)
- Brandmark system (mounts vector actor): [`components/landing/v7/BrandmarkSystem.tsx`](../../components/landing/v7/BrandmarkSystem.tsx)
- Journey (keyframe retuning): [`lib/brandmark/journey.ts`](../../lib/brandmark/journey.ts)
- Internal preview: [`app/(internal)/test/brandmark-vector/page.tsx`](../../app/%28internal%29/test/brandmark-vector/page.tsx)

---

## Future work (deferred)

- **True SVG path interpolation** for full ↔ ring morph (Flubber). Today's opacity crossfade is fine because both shapes share the C-arc; a future morph between e.g. brandmark ↔ compass-rose would benefit from true path morphing.
- **Per-tick stagger** in the celestial linework's draw-in (clockwise wipe instead of a single opacity ramp). Trivial CSS work, deferred until needed.
- **Atmosphere "trail"** as particles lag behind the vector mark during fast transits. Today's `dispersionBump` reads as exhaust at mid-transit but doesn't TRAIL the motion direction. A motion-vector-aware shader could do this without rebuilding the field.
