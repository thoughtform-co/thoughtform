# ADR-013: Brandmark Journey Refactor

**Date:** 2026-05-16
**Status:** Accepted — supersedes the per-station snapshot + multi-painter architecture of ADR-010 / ADR-011 / ADR-012.
**Partially superseded by:** [ADR-015 — Vector-first brandmark + celestial-editor linework](015-brandmark-vector-first.md) (2026-05-17). The continuous-transform model, journey hook, store, keyframe schema, and substrate-window math are RETAINED VERBATIM. What changed is the rendering surface: the brandmark shape is now painted by `BrandmarkVectorActor` (inline SVG) instead of by the particle shader, and the particle field is repurposed as an atmosphere painter. The "one painter end-to-end" invariant becomes "one vector painter + one atmosphere painter, both reading the same transform".

**Related (superseded):**
[ADR-010 — Brandmark choreography](010-brandmark-choreography.md),
[ADR-011 — Brandmark particle artifact](011-brandmark-particle-artifact.md),
[ADR-012 — Intelligence layer artifact](012-intelligence-layer-artifact.md).

**Related (composes with):**
[ADR-008 — Landing v7 background layers](008-landing-v7-background-layers.md),
[ADR-017 — Orbit journey + substrate-sphere morph](017-orbit-journey-and-substrate-morph.md) (adds the `substrateMorph` channel to `BrandmarkTransform` and uses an instant visibility cut on the vector actor in place of the legacy `vectorOpacity` HANDOFF ramp during the substrate window — the renderer swap is invisible because the substrate-sphere morph mesh covers the same silhouette at the same screen position).

---

## Context

By v5 the brandmark journey had accumulated four concurrent painters (five portal SVG dock glyphs, the fixed `BrandmarkActor`, the global `BrandmarkParticleCanvas`, and a separate R3F brandmark cloud inside the intelligence-layer Canvas) mediated by six CSS attribute gates (`data-brand-on-missing`, `data-brand-on-rail`, `data-brand-particle-backdrop`, `data-brandmark-mode`, `data-brand-svg-dock`, `data-brand-anchor`) plus inline JS opacity overrides for the substrate dock. A 1165-line scroll-driven state machine (`useSigilChoreography`) wrote per-station snapshots into a Zustand store; another store carried the substrate-window range; HARD SWAPs between painters at the substrate boundary tried to read as visual continuity but were fragile against rect timing.

Two visible regressions surfaced:

1. **Intelligence-layer pop-in.** The R3F scene appeared as a single binary flip (`parent.visible = handoffActive`). At the engage instant the encode ring, sub-orbits, halo dots, and brandmark cloud all appeared at full presence; only the navigate/build rings + ticks/diamonds used `splitExtrude` (which is 0 at progress=0). The user perceived "the brandmark just appears" rather than "the brandmark evolves into the section."

2. **Dispersion bump scattered the brandmark mid-morph.** The standard `transit()` helper applied a `sin(π·t) × 0.45` dispersion bell-curve to every inter-station leg. For same-size atmospheric transits (sigil → miss) this was the intended visual story; for size-changing legs (miss → substrate ≈ 144 px → 280 px+; substrate → rail ≈ 280 px → 56 px) the cloud was unrecognisable mid-transit — particles wandered up to 45 % of the rect's half-extent away from their home positions while the rect was also scaling, reading as "exploding outward" rather than "settling into the next dock".

Both regressions were symptoms of the same underlying architecture: the brandmark was modeled as a sequence of discrete states (parked / transit) instead of a single evolving artifact. Patching each regression individually would re-encode the same fragility.

---

## Decision

Replace the per-station-snapshot + multi-painter architecture with a single continuous transform pipeline:

```
scrollY  →  computeBrandmarkTransform()  →  BrandmarkTransform  →  one painter
```

The brandmark cloud is a single point cloud whose position, scale, rotation, opacity, density, and dispersion are continuous functions of `scrollY`. One painter (`BrandmarkParticleStation` inside the global `BrandmarkParticleCanvas`) reads the transform every frame and renders. The R3F intelligence-layer scene becomes rings-only — no brandmark cloud — and reads the same transform for its rotation, ring extrude, and decoration emerge envelopes. There are no HARD SWAPs anywhere.

### Five design principles (load-bearing)

Every change to the brandmark journey is reviewed against these. Any deviation is a regression.

1. **The brandmark is a single continuous artifact that EVOLVES through the page.** Position, scale, rotation, density, dispersion are continuous functions of scrollY. The brandmark transforms — it does not appear, disappear, or crossfade mid-journey.

2. **No opacity fades for the brandmark cloud anywhere between hero exit and post-orbit fade.** Every mid-journey transition is geometric: rect lerp, density lerp, dispersion lerp, rotation lerp. If a transition reads wrong, fix the GEOMETRY (rect lerp, scale envelope, dispersion suppression), never patch it with an opacity ramp.

3. **No crossfades between painters.** One painter owns the brandmark from sigil entry to post-orbit fade. Boundary swaps between painters are forbidden by construction — there are no boundaries to swap at.

4. **Decorations EMERGE geometrically, not via opacity.** Encode ring, sub-orbits, halo dots, navigate/build rings, ticks, diamonds, flow arcs — every ringfield decoration grows out of the brandmark's centre via `group.scale.setScalar(emerge)`. Material opacities stay at their constant values; the SCALE envelope is what reveals.

5. **Hero entrance and post-orbit exit are the only bookends.** Hero entry: opacity ramps 0 → 1 across the FADE_IN_FRAC window. Post-orbit exit: opacity ramps 1 → 0 across the FADE_OUT_FRAC window. These are bookends, not mid-journey transitions; they bracket the continuous evolution between them.

### Architecture

```mermaid
flowchart TB
    subgraph hook [useBrandmarkJourney]
        scroll["window.scroll<br/>(rAF)"] --> compute["computeBrandmarkTransform<br/>(pure function)"]
    end
    subgraph keyframes [lib/brandmark/journey.ts]
        kf["KEYFRAMES: sigil, miss, substrate, rail, orbit<br/>resolveRect + parked + transitIn"]
        kf -.read by.-> compute
    end
    compute --> store["brandmarkJourneyStore<br/>transform: BrandmarkTransform"]
    store -->|"uniforms"| painter["BrandmarkParticleStation<br/>(SINGLE instance, global canvas, shader)"]
    store -->|"rotationY + ringsActive + ringProgress"| rings["BrandmarkRingfield<br/>(R3F, rings only)"]
    store -.|"actor pin + dock attrs (SVG mode only)"|.-> svgPath["BrandmarkActor + native dock SVGs"]
    painter --> canvas[("Global GL canvas (z:23)")]
    rings --> r3f[("R3F canvas inside #intelligence-layer")]
```

### Keyframe schema

```ts
type BrandmarkKeyframe = {
  id: "sigil" | "miss" | "substrate" | "rail" | "orbit";
  resolveRect: (ctx: JourneyContext) => DOMRect | null;
  parkFracIn?: number; // default 0.32
  parkFracOut?: number; // default 0.32
  parked: { density; dispersion; ringsActive? };
  transitIn?: {
    dispersionBump?: ((t: number) => number) | null; // null = no bump
    easing?: (t: number) => number;
  };
};
```

Keyframe configuration in `lib/brandmark/journey.ts`:

| Keyframe  | Parked density | Parked dispersion | Rings | `transitIn.dispersionBump` |
| --------- | -------------- | ----------------- | ----- | -------------------------- |
| sigil     | 1.0            | 0                 | off   | (no inbound segment)       |
| miss      | 1.0            | 0                 | off   | default `sin(πt)*0.45`     |
| substrate | 1.0            | 0                 | on    | **`null`** (no bump)       |
| rail      | 1.0            | 0                 | off   | **`null`** (no bump)       |
| orbit     | 1.0            | 0                 | off   | **`null`** (no bump)       |

The `null` overrides on substrate, rail, and orbit arrivals are the direct fix for the Tier 1 dispersion-scatter regression — every size-changing transit keeps the cloud coherent. The miss arrival keeps the default bump because sigil → miss is roughly same-size and dispersion IS the visual story at that scale.

### Substrate rotation: 2D squash in the shader (ADR-013 Q1)

The R3F scene used to rotate the brandmark cloud as a 3D `<points>` mesh on its parent's Y axis. With the single-painter model the global canvas (pixel-space shader) owns the brandmark cloud throughout the section. To preserve the 3D-tilt read at peak rotation:

- Shader gets a `uRotationY` uniform.
- Vertex shader applies `aHome.x *= cos(uRotationY)` plus a perspective shear `aHome.y * sin(uRotationY) * SHEAR_SCALE` (where `SHEAR_SCALE = 0.18`) BEFORE adding the wander.
- At `uRotationY = 0` the transform is identity (axis-aligned).
- At peak tilt (~70° inside the substrate window) the brandmark squashes to a vertical strip — geometrically equivalent to the 3D-rotation edge-on view.
- The R3F scene keeps owning the rings (which still need TRUE 3D extrusion via `splitExtrude`). The parent group's `rotation.y` reads from the SAME `transform.rotationY` channel that the global painter reads, so rings and brandmark cloud stay perfectly coupled.

### Decoration EMERGE — geometric scale (Principle 4)

A new `splitEmerge(progress) = smoothstep(0, 0.08, progress) * (1 - smoothstep(0.92, 1.0, progress))` envelope drives `group.scale.setScalar(emerge)` on:

- the encode ring group
- the navigate ring group
- the build ring group
- the sub-orbits + halo dots root group

At progress 0 / 1 (the substrate window's bookends), every decoration is at scale 0 — geometrically absent. Across the first 8 % of the window, decorations grow from a point at the brandmark's centre to their full size; across the last 8 %, they retract back to 0. NO `material.opacity` writes for decoration appearance — Principle 4.

### Continuous painter — SVG fallback retained

In particle mode the global canvas is the sole painter and the journey hook writes ONE attribute at init (`data-brandmark-mode="particle"`) which a single CSS rule reads to hide every native dock SVG + the fixed actor. No per-frame attribute writes.

In SVG fallback mode (reduced motion or no WebGL) the journey hook drives the existing `data-brand-on-missing/rail="parked"` + `data-orbit-docked="true"` attributes based on the transform's `parkedAt` field, and pins the `BrandmarkActor` to the transform's rect during transit and at the orbit station (which has no native dock). This is the only place per-frame attribute writes survive — and they're scoped to SVG mode users (a small accessibility-focused fallback).

---

## Files touched

### New (5)

- `lib/brandmark/journey.ts` — keyframe schema, `KEYFRAMES` table builder, `computeBrandmarkTransform` pure function (~430 LOC).
- `lib/stores/brandmarkJourneyStore.ts` — single Zustand store with `transform: BrandmarkTransform` channel + `mode: "particle" | "svg"` flag (~70 LOC).
- `components/landing/v7/hooks/useBrandmarkJourney.ts` — scroll-driven journey hook with optional `actorRef` for SVG mode (~230 LOC).
- `components/landing/v7/hooks/useSigilEntranceScrub.ts` — extracted section-02 diagram entrance animation, now a separate concern from the brandmark journey (~100 LOC).
- `lib/webgl/probe.ts` — consolidated WebGL feasibility probe (~35 LOC).

### Modified (10)

- `components/brand/BrandmarkParticleField/shaders.ts` — added `uRotationY` uniform + 2D squash + perspective shear math.
- `components/brand/BrandmarkParticleField/BrandmarkParticleStation.tsx` — single-instance painter that reads `transform` from journey store.
- `components/brand/BrandmarkParticleField/BrandmarkParticleCanvas.tsx` — drops `stations` prop; renders exactly one painter.
- `components/landing/v7/intelligence-layer/BrandmarkRingfield.tsx` — rings only; reads `rotationY` + `ringsActive` + `ringProgress` from journey store; geometric `splitEmerge` (scale) on encode ring + sub-orbits + halo dots.
- `components/landing/v7/intelligence-layer/intelligenceLayerGeom.ts` — added `splitEmerge(progress)` envelope.
- `components/landing/v7/intelligence-layer/IntelligenceLayerPortal.tsx` — removed `applyR3FDockMask` block + MutationObserver.
- `components/landing/v7/intelligence-layer/useIlayerProgress.ts` — simplified to a thin store subscriber that mirrors `ringProgress` into the `--ilayer-progress` CSS variable for the floating label fade-ins. Retired `sizeAnchor`, `EncodeRectReporter`, `setSubstrateRange`, `setHandoffActive`.
- `components/landing/v7/BrandmarkSystem.tsx` — JSDoc updated; canvas mounts without `stations` prop.
- `components/landing/v7/BrandmarkActor.tsx` — removed `morphRects` dead API + debug telemetry POST + `debugBrandmarkActor` helper.
- `components/landing/v7/landing.css` — deleted ~280 LOC of brandmark gate fabric (`data-brand-svg-dock`, `data-brand-particle-backdrop`, per-station `[data-brandmark-mode="particle"][data-brand-on-X="parked"]` hide overrides). Kept SVG-fallback dock rules. New single rule: `[data-brandmark-mode="particle"]` hides all dock SVGs + the actor.
- `components/landing/v7/LandingPage.tsx` — swapped `useSigilChoreography` for `useBrandmarkJourney(rootRef, brandmarkActorRef)` + `useSigilEntranceScrub(rootRef)`.

### Deleted (3)

- `components/landing/v7/hooks/useSigilChoreography.ts` (1165 LOC superseded).
- `lib/stores/brandmarkParticleStore.ts` (superseded by `brandmarkJourneyStore`).
- `components/landing/v7/intelligence-layer/brandmarkParticles.ts` (R3F-local `THREE.PointsMaterial` brandmark cloud superseded by the shared shader painter).

---

## Pre-merge checklist

Verify each item visually + via the dev parity log (`[brandmarkJourney]` console.debug every 30 frames). Match each line to the principle it enforces.

- [ ] **Hero (scrollY < 4)** — brandmark hidden (`transform.visible === false`). No CSS dock SVGs visible. Sigil entrance scrub has not started yet.
- [ ] **Section 02 entrance (`#definition` enter)** — sigil diagram (orbits, halo, mark, cap, legend, tri-left) reveals via the entrance scrub. In particle mode the brandmark cloud also reveals here as the journey's hero bookend (Principle 5 — opacity ramp allowed at the bookend); in SVG mode the native `.sigil__mark img` paints from the entrance scrub.
- [ ] **Sigil parked** — `transform.parkedAt === "sigil"`; `rect` matches the sigil dock; rotation 0; density 1; dispersion 0; rings off. Particle mode: cloud renders at sigil position. SVG mode: native sigil glyph paints.
- [ ] **Sigil → miss transit** — `transform.parkedAt === null`; rect lerps continuously between sigil rect and miss rect; **dispersion bumps up to ~0.45 at midpoint then returns to 0** (atmospheric — the intended visual story for same-size legs); rotation 0; rings off.
- [ ] **Miss parked** — `transform.parkedAt === "miss"`; rect matches the centre of the 4-card grid; rotation 0; density 1; dispersion 0; rings off.
- [ ] **Miss → substrate transit (CRITICAL)** — `transform.parkedAt === null`; rect lerps from miss rect (~144 px) toward substrate rect (~280 px+); **dispersion stays at 0 throughout** (no bump — Principle 1 / Tier 1 Change 1 subsumed); rotation 0; cloud reads as a continuous grow + translate, never as scatter.
- [ ] **Substrate parked** — `transform.parkedAt === "substrate"`; `ringsActive === true`; `ringProgress` ramps 0 → 1 across the parked window. At progress 0 / 1 the cloud is axis-aligned (`rotationY === 0`); peak rotation is `splitRotation(0.4-ish)` ≈ -70°. The encode ring + sub-orbits + halo dots emerge geometrically (scale 0 → 1 across `ringProgress ∈ [0, 0.08]`); navigate / build rings extrude in Z across `[0.30, 0.55]`; ticks + diamonds + flow arcs grow with the extrude.
- [ ] **Substrate → rail transit (CRITICAL)** — same principles as miss → substrate. Rect lerps from substrate rect (~280 px+) toward rail rect (~56 px); dispersion stays at 0; cloud shrinks coherently.
- [ ] **Rail parked** — `transform.parkedAt === "rail"`; rect matches the centre of the continuum rail.
- [ ] **Rail → orbit transit** — handled by the practice-sticky special case in `computeBrandmarkTransform`. While practice straddles viewport top, the transform reports `parkedAt === "orbit"`.
- [ ] **Orbit parked** — particle mode: cloud renders at the orbit dock. SVG mode: actor paints (no native orbit dock).
- [ ] **Post-orbit fade-out** — opacity ramps 1 → 0 across FADE_OUT_FRAC window. This is the post-orbit bookend (Principle 5).
- [ ] **No `data-brand-svg-dock` attribute anywhere** in dev tools (retired in Phase 4).
- [ ] **No `data-brand-particle-backdrop` attribute anywhere** in dev tools (retired in Phase 4).
- [ ] **`data-brandmark-mode="particle"`** is set on `document.documentElement` at init (and removed on hook cleanup / HMR).
- [ ] **In particle mode, the `BrandmarkActor` has `display: none`** (no longer rendered).
- [ ] **`BrandmarkRingfield` parent group `visible === ringsActive`** — true only when parked at substrate. Outside the substrate window the R3F scene is invisible; the global painter continues to paint the brandmark cloud.
- [ ] **Singleton check** (`brandmarkSingletonCheck.ts`) reports at most one visible painter at any scroll position. No "multi-instance" warnings.
- [ ] **Reduced-motion / no-WebGL** — journey hook resolves to SVG mode; particle canvas does not mount; native dock SVGs paint at parked positions via `data-brand-on-*="parked"` attributes; actor paints transit + orbit.
- [ ] **HMR / Fast Refresh** — store reset to `HIDDEN_TRANSFORM` on cleanup; mode attribute removed; subsequent mount resolves fresh.
