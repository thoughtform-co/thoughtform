# ADR-019: Silhouette Particle Brandmark from Diagnostic Onward

**Date:** 2026-05-23
**Status:** Accepted — amends ADR-015 (vector-first model) with a documented exemption for the sigil → miss leg and every keyframe after it.

**Related (amends):**
[ADR-015 — Vector-First Brandmark](015-brandmark-vector-first.md). The "atmosphere painter is atmosphere-only, vector owns the mark shape" invariant from ADR-015 was load-bearing — this ADR narrows it. The brandmark vector still owns the mark **at Thoughtform (sigil) rest only**. Everywhere else on the journey the mark is owned by a particle silhouette mesh (this ADR) or by the substrate-sphere morph mesh (ADR-017).

**Related (composes with):**
[ADR-013 — Brandmark journey refactor](013-brandmark-journey-refactor.md) (continuous-transform model, same five keyframes),
[ADR-017 — Orbit journey + substrate-sphere morph](017-orbit-journey-and-substrate-morph.md) (the substrate mesh hand-off uses the same instant-cut pattern under matching cover).

---

## Context

The original Thoughtform home gateway used a **particle brandmark** — a stippled gold point cloud that the user remembered as central to the brand's read. ADR-015 replaced that with a vector-first model after the substrate state degraded into "papercraft tiles": the global cloud could not paint a recognisable brandmark at the substrate's ~280–460 px rect without reading as a mosaic.

ADR-017 then re-introduced particles for the substrate moment specifically — the substrate-sphere morph mesh — under a documented exception: particles paint the brandmark **only inside the substrate scroll window, only inside the intelligence-layer R3F canvas**. Everywhere else the vector owned the mark.

User-stated intent (2026-05-23):

> _"Our original home page with the gateway had a particle version of our brandmark; I'd like to scope how our brandmark in the Thoughtform section subtly transforms into the particle brandmark the moment you travel through the diagrams from the Thoughtform section into the Diagnostic section."_

Two clarifications were locked before scoping:

1. The particle brandmark is a **silhouette point cloud** (revive the ADR-017 pattern), not an atmosphere bloom nor a dispersing trail.
2. The end state is **particles stay as the brandmark** from Diagnostic onward. Thoughtform is the only place the vector lives.

This frames the sigil → miss leg as a one-way handoff: the visitor leaves Thoughtform with a vector mark and arrives at Diagnostic (and every keyframe after) with a particle mark.

---

## Decision

Add a third painter to the brandmark journey, gated on a new transform channel:

```
                       ┌── BrandmarkVectorActor       ── crisp SVG; sigil rest only
                       │
scrollY → transform ───┼── BrandmarkSilhouettePoints  ── global silhouette point cloud
                       │                                  (sigil→miss transit + miss/rail/orbit)
                       │
                       └── BrandmarkParticleStation   ── soft glowing dust + transit exhaust
                                                          (unchanged role from ADR-015)
```

Plus the substrate-window special case from ADR-017 (`SubstrateMorphPoints` inside the intelligence-layer canvas — also unchanged).

All four painters read the **same `BrandmarkTransform`** from `brandmarkJourneyStore`. The journey hook, keyframe table, and existing channels (`density`, `dispersion`, `rotationY`, `shapeBlend`, `vectorOpacity`, `substrateMorph`) are unchanged. Only one new channel is added.

### 1. New transform channel — `silhouetteMorph`

[`lib/brandmark/journey.ts`](../../lib/brandmark/journey.ts) `BrandmarkTransform` gains:

```ts
silhouetteMorph: number; // [0, 1]
```

Envelope:

| Beat                              | `silhouetteMorph` | Visible painter            |
| --------------------------------- | ----------------- | -------------------------- |
| Hero pre-sigil                    | `0`               | nothing (opacity 0)        |
| Sigil parked (Thoughtform rest)   | `0`               | vector actor               |
| **Sigil → miss transit**          | ramps `0 → 1` over the first `SILHOUETTE_RAMP_FRAC = 0.3` of leg `t` (TRAVEL_EASE) | vector → silhouette crossfade |
| Miss / rail / orbit parked        | `1`               | silhouette point cloud     |
| Substrate parked                  | `1` (but suppressed by `substrateMorph > 0` → see ADR-017 handoff) | substrate-sphere morph mesh |
| Other transits (miss→substrate, substrate→rail, rail→orbit) | `1` | silhouette point cloud (rect lerps) |

The ramp completes well before the `--orbit-morph` midpoint, so the vector never ghosts over the morphing diagrams between Thoughtform and Diagnostic. The leg arms only after `sectionReadingZoneExitY(#definition)` clears (existing behaviour, unchanged) — the silhouette ramp inherits that gating because it is computed against the same leg `t`.

### 2. Silhouette painter — `BrandmarkSilhouettePoints`

[`components/brand/BrandmarkParticleField/BrandmarkSilhouettePoints.tsx`](../../components/brand/BrandmarkParticleField/BrandmarkSilhouettePoints.tsx). Mounts **once** inside the global `BrandmarkParticleCanvas`, alongside `BrandmarkParticleStation` (atmosphere). Pixel-space orthographic R3F mesh — same camera + viewport contract as the atmosphere station, so the silhouette tracks `transform.rect` directly without world-space projection math.

- Sampled from `BRANDMARK_FULL_PATHS` via `sampleShape` (same canonical source the substrate morph and atmosphere stations use). Point counts: **1900 desktop / 700 mobile** (substrate-tier density so the silhouette reads as a solid mark at small docks).
- Vertex shader: cover-in inflation from the rect centre, gated by `smoothstep(0, MORPH_FULL=0.6, uMorph)`. At `silhouetteMorph = 0` the mesh contributes zero pixels; at `silhouetteMorph ≥ 0.6` the geometry is identity at the transform rect.
- Fragment shader: soft radial dot (`1 - smoothstep(0.30, 0.5, d)`) + additive blending. Same visual language family as the atmosphere station; the slightly tighter core keeps the silhouette crisp.
- Suppression: `transform.substrateMorph > 0.001 → effectiveOpacity = 0`. The intelligence-layer canvas's `SubstrateMorphPoints` mesh owns the silhouette during the substrate window (ADR-017 handoff is preserved).

### 3. Vector cover-cut — `BrandmarkVectorActor`

[`components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx`](../../components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx) adds a geometric handoff branch alongside the existing substrate cut:

```ts
const SILHOUETTE_HANDOFF_END = 0.55;
const silhouetteFade = Math.max(0, 1 - transform.silhouetteMorph / SILHOUETTE_HANDOFF_END);
const effectiveOpacity = fullyParked ? 0 : opacity * vectorOpacity * silhouetteFade;
```

Principle 3 (instant cut under matching cover) is honoured **geometrically**: the silhouette inflates from the same rect centre the vector occupies, and the vector recedes in proportion to the cover-in. At every moment `vector + particles = full brandmark` — no hole, no crossfade against empty space. By `silhouetteMorph ≥ 0.55` the silhouette is at ~92% cover and the vector is fully out.

### 4. Dock-glyph CSS updates — `landing.css`

The portal'd dock glyphs at `.miss__brand-slot`, `.crail__brand`, `.approach__orbit__mark` would otherwise fade in via the existing particle-mode park-handoff rules. With the silhouette mesh now owning those parks, the glyphs are kept at `opacity 0` via a new `--brandmark-silhouette-cut` variable:

```css
[data-brandmark-mode="particle"][data-brand-parked-at="miss"] .miss__brand-slot > :where(img, svg),
[data-brandmark-mode="particle"][data-brand-parked-at="rail"] .crail--large .crail__brand > :where(img, svg),
[data-brandmark-mode="particle"][data-brand-parked-at="orbit"] .approach__orbit__mark > :where(img, svg) {
  opacity: calc(1 - var(--brandmark-silhouette-cut, 0));
}
```

`.sigil__mark` retains its original "reveal at sigil park" rule — Thoughtform is the only park where the vector dock glyph remains the visible painter.

### 5. Atmosphere damping — `BrandmarkParticleStation`

The atmosphere field still paints dust + transit exhaust, but its `dispersion` is scaled by `(1 - silhouetteMorph * 0.7)` so the silhouette reads cleanly. At sigil rest (`silhouetteMorph = 0`) the atmosphere is unaffected; at miss park and onward the bump is reduced to a soft halo around the silhouette.

### 6. CSS variables emitted by `useBrandmarkJourney`

- `--brand-silhouette-morph` — continuous `[0, 1]` mirror of `transform.silhouetteMorph`. Available for any downstream styling that needs to phase against the cover-in.
- `--brandmark-silhouette-cut` — binary `{0, 1}` at threshold `0.55`. Drives the dock-glyph CSS above.

---

## Consequences

### Positive

- **The original "brandmark as particles" identity is back.** From the Diagnostic dock onward the visible mark is a point cloud — what the user remembered from the gateway era. Thoughtform retains the crisp vector as a deliberate rest state.
- **Single transform channel, four painters, no choreography duplication.** Every painter reads from the same store. The handoff edges (sigil↔silhouette, silhouette↔substrate-sphere) are gated by continuous channels (`silhouetteMorph`, `substrateMorph`) so the journey hook owns the per-frame contract.
- **Principle 3 (no opacity crossfade between renderers) is preserved.** The vector recedes only inside the cover-in window, where the silhouette is inflating to match. The substrate handoff at `substrateMorph > 0` is a binary cut under matching screen-anchor particles.
- **Mobile budget kept.** Silhouette point count tiered to 700 on viewports ≤ 960px; the substrate morph mesh continues to suppress this global mesh inside the substrate window so the two never overlap.

### Negative

- **ADR-015's "atmosphere-only painter" invariant is amended.** A future agent reading ADR-015 alone will see the vector-first rule as absolute — this ADR is the documented exception. Both ADRs cross-reference each other in the front matter to keep the surface load-bearing.
- **Four painters now.** Vector (sigil), silhouette (transit + miss/rail/orbit), atmosphere (everywhere), substrate-sphere morph (substrate). Mental model is "vector at home, particles on the journey, sphere at substrate" — coherent but no longer one-painter-end-to-end.
- **SubstrateMorphPoints and BrandmarkSilhouettePoints both sample the brandmark.** The silhouette mesh suppresses itself when substrate engages, but both meshes carry their own GPU buffer for the brandmark sample. Acceptable cost — the substrate sample is bound to the intelligence-layer canvas's lifecycle and disposes with the page.

---

## Boundary behaviours

- **SVG fallback mode** (`reduced motion` or no WebGL): `BrandmarkParticleCanvas` returns `null`, so `BrandmarkSilhouettePoints` never mounts. The legacy SVG actor + dock glyphs paint the journey as before. The dock-glyph CSS gates ignore `--brandmark-silhouette-cut` (which is unset in this mode) and fall back to opacity 1 at the parked dock — same as the historical SVG mode.
- **Hero entrance fade-in** (sigil with `opacity < 1`): the vector ramps in from 0; `silhouetteMorph = 0` so the silhouette mesh stays invisible. The bookend opacity ramp belongs to the vector exclusively.
- **Reading-zone gating at `#definition`**: the existing `sectionReadingZoneExitY` lock keeps the brandmark parked at sigil until the visitor scrolls past the Thoughtform reading zone. The silhouette ramp inherits this — particles only begin emerging when the user is committed to leaving Thoughtform.

---

## Files

- New: [`components/brand/BrandmarkParticleField/BrandmarkSilhouettePoints.tsx`](../../components/brand/BrandmarkParticleField/BrandmarkSilhouettePoints.tsx)
- Shaders: [`components/brand/BrandmarkParticleField/shaders.ts`](../../components/brand/BrandmarkParticleField/shaders.ts) — adds `brandmarkSilhouetteVertexShader` / `brandmarkSilhouetteFragmentShader`.
- Canvas mount: [`components/brand/BrandmarkParticleField/BrandmarkParticleCanvas.tsx`](../../components/brand/BrandmarkParticleField/BrandmarkParticleCanvas.tsx)
- Transform channel: [`lib/brandmark/journey.ts`](../../lib/brandmark/journey.ts) — adds `silhouetteMorph` to `BrandmarkTransform` and `HIDDEN_TRANSFORM`; `parkedRectTransform` + `transitTransform` populate it.
- Vector handoff: [`components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx`](../../components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx)
- Atmosphere damping: [`components/brand/BrandmarkParticleField/BrandmarkParticleStation.tsx`](../../components/brand/BrandmarkParticleField/BrandmarkParticleStation.tsx)
- CSS vars + dock gates: [`components/landing/v7/hooks/useBrandmarkJourney.ts`](../../components/landing/v7/hooks/useBrandmarkJourney.ts) + [`components/landing/v7/landing.css`](../../components/landing/v7/landing.css)

---

## Future work (deferred)

- **Collapse the three particle samplers into one global mesh.** Today the atmosphere, silhouette, and substrate-sphere morph each sample the brandmark independently. A single shared buffer keyed off `shapeKey` + `count` would drop ~3700 vertex shader inputs to ~1900 at the cost of one extra uniform branch.
- **Silhouette-aware atmosphere palette.** The atmosphere tint could phase with the silhouette cover so dust reads as "lit by the silhouette" rather than as an independent glow.
- **Trail effect on long transits** (miss → substrate, substrate → rail, rail → orbit). The silhouette currently lerps its rect rigidly; a per-particle drag term keyed to `transform.rect` velocity would read as the particles flowing across the page.
