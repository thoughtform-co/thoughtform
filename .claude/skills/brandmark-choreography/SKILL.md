---
name: brandmark-choreography
description: >
  Scroll-driven journey for the v7 brandmark (continuous transform model,
  ADR-013). The brandmark is a single evolving point cloud whose position,
  scale, rotation, density, and dispersion are continuous functions of
  scrollY. One painter end-to-end. Activates on edits to
  `lib/brandmark/journey.ts`, `lib/stores/brandmarkJourneyStore.ts`,
  `components/landing/v7/hooks/useBrandmarkJourney.ts`, the keyframe
  table, the substrate-window math, the journey transform schema, or any
  change that touches the brandmark's per-frame state.
---

# Brandmark journey (continuous transform model)

The v7 brandmark journey is a **single continuous transform** computed every scroll frame:

```
scrollY  →  computeBrandmarkTransform(scrollY, keyframes, ctx)  →  BrandmarkTransform
```

**Four painters** read the transform every frame, all subscribing imperatively to the same store:

- **`BrandmarkVectorActor`** (ADR-015) paints the BRANDMARK SHAPE as crisp inline SVG at **sigil (Thoughtform) rest only**. Two stacked glyphs (full + ring) crossfade via `transform.shapeBlend`. Rotation is honest CSS `perspective() rotateY()`. Fades out geometrically as `silhouetteMorph` ramps (ADR-019).
- **`BrandmarkSilhouettePoints`** (ADR-019) paints the brandmark as a silhouette point cloud from the sigil → miss transit onward, and stays at every park from Diagnostic through Orbit. Gated by `transform.silhouetteMorph`; suppressed inside the substrate window.
- **`SubstrateMorphPoints`** (ADR-017) paints the brandmark → sphere morph inside the substrate window. Lives in the intelligence-layer R3F canvas, not the global one.
- **`BrandmarkParticleStation`** (atmosphere field) paints luminous gold dust around the active mark painter. Damped while `silhouetteMorph > 0` so the silhouette reads cleanly.

The R3F intelligence-layer scene (`OrbitField`) reads the same transform for its side-orbit emerge envelopes; the new [`CelestialLinework`](../../../components/landing/v7/intelligence-layer/CelestialLinework.tsx) overlay adds hairline guide ring + bearing ticks + cardinal diamonds driven by `--ilayer-progress`. In SVG-fallback mode (reduced motion or no WebGL), `useBrandmarkJourney` pins the legacy `BrandmarkActor` to the transform's rect and writes `data-brand-on-*="parked"` attributes so native dock SVGs paint via CSS gates.

**Canonical records:**

- [ADR-015](../../../sentinel/decisions/015-brandmark-vector-first.md) — vector-first split (current default for sigil).
- [ADR-017](../../../sentinel/decisions/017-orbit-journey-and-substrate-morph.md) — `substrateMorph` channel + substrate-sphere morph mesh.
- [ADR-018](../../../sentinel/decisions/018-home-v2-depth-corridor.md) — depth corridor + brandmark accretion shell (shell-into-corridor: inside-out reconstruction of the intelligence-layer `shell` artifact around the travelling mark).
- [ADR-019](../../../sentinel/decisions/019-brandmark-silhouette-morph.md) — `silhouetteMorph` channel + global silhouette point cloud (Diagnostic onward).

**Predecessor (journey contract retained):** [ADR-013](../../../sentinel/decisions/013-brandmark-journey-refactor.md).
**Related (rendering):** [`brandmark-particle`](../brandmark-particle/SKILL.md).
**Related (compositing):** [ADR-008](../../../sentinel/decisions/008-landing-v7-background-layers.md), `landing-v7-compositing` skill.

---

## Five design principles (load-bearing — every change is reviewed against these)

1. **The brandmark is a single CONTINUOUS artifact that EVOLVES.** Position, scale, rotation, density, dispersion are continuous functions of scrollY.
2. **No opacity fades for the brandmark cloud mid-journey.** Every transition is geometric. Hero entry + post-orbit exit are the only opacity bookends.
3. **No crossfades between painters.** One painter end-to-end. Boundary swaps are forbidden by construction. **(ADR-017 corollary:** when a renderer swap is unavoidable — vector → particle morph at substrate engage — it is an INSTANT visibility cut under matching particle cover, never an opacity ramp. The particles must already paint the same silhouette at the same screen position the moment the cut fires.**)**
4. **Decorations EMERGE geometrically, not via opacity.** Encode ring, sub-orbits, halo dots all use `group.scale.setScalar(splitEmerge(progress))` — material opacity stays constant.
5. **Hero entrance and post-orbit exit are the only bookends.** They may use opacity ramps because there is nothing to evolve from / into.

If a fix tempts you to add an opacity fade mid-journey, an attribute swap, or a separate painter for a special case — re-read the principles and find a geometric solution instead.

---

## Keyframe schema

Five keyframes, declared in [`lib/brandmark/journey.ts`](../../../lib/brandmark/journey.ts):

```
sigil → miss → substrate → rail → orbit
```

Each keyframe:

| Field         | Purpose                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- | ------ | ----------- | ------ | --------- |
| `id`          | Stable identifier (`"sigil"                                                               | "miss" | "substrate" | "rail" | "orbit"`) |
| `resolveRect` | Closure that returns the live `DOMRect` for this keyframe's anchor (re-read every frame)  |
| `parkFracIn`  | Fraction of the inbound segment that counts as "parked at this keyframe" (default `0.32`) |
| `parkFracOut` | Fraction of the outbound segment that counts as "still parked here" (default `0.32`)      |
| `parked`      | `{ density, dispersion, ringsActive? }` — what the painter reads while parked             |
| `transitIn`   | Per-arrival override for `dispersionBump` (`null` = no bump) and `easing`                 |

**Keyframe configuration today (ADR-015 — atmosphere-field tuning + ADR-017 — substrate morph):**

| Keyframe  | Parked density | Parked dispersion | Rings | `substrateMorph` | `transitIn.dispersionBump`                       | `transitIn.easing` |
| --------- | -------------- | ----------------- | ----- | ---------------- | ------------------------------------------------ | ------------------ |
| sigil     | 0              | 0                 | off   | 0                | (no inbound segment — first keyframe)            | —                  |
| miss      | 0              | 0                 | off   | 0                | default `sin(πt) * 0.45` (atmospheric same-size) | `TRAVEL_EASE`      |
| substrate | 0.15           | 0.35              | on    | 0 → 1 → 0 (sym.) | `sin(πt) * 0.35` exhaust                         | `MORPH_EASE`       |
| rail      | 0              | 0                 | off   | 0                | `sin(πt) * 0.35` exhaust                         | `MORPH_EASE`       |
| orbit     | 0              | 0                 | off   | 0                | `sin(πt) * 0.20` exhaust                         | `TRAVEL_EASE`      |

`substrateMorph` (ADR-017) is the symmetric trapezoid envelope (`MORPH_EASE`, `SUBSTRATE_MORPH_FRAC = 0.35`) that drives the substrate-sphere R3F point cloud's morph from brandmark shape → Fibonacci sphere → brandmark shape across the substrate scroll window. The vector actor + portal'd substrate dock glyphs are visibility-cut OFF whenever `substrateMorph > 0.001` (instant — particles cover the same silhouette).

The vector actor owns the brandmark shape at every keyframe — these densities tune the ATMOSPHERE FIELD around it. Full-mark stations (sigil / miss / rail / orbit) get density 0 so the vector mark sits alone, crisp, no halo. The substrate hold beat gets ambient dust + cardinal diamonds + hairline guide ring (via `CelestialLinework`) for the celestial-editor read. Transit dispersion bumps are RESTORED on every leg as exhaust around the moving vector — this is the visual story now, no longer a coherence threat as it was under ADR-013.

**Easing semantics:** `TRAVEL_EASE` is `smoothstep(t)` — a gentle S-curve with brisk mid-range velocity, so the brandmark visibly leaves each dock instead of hanging on the flat tail of `power3.inOut`. `MORPH_EASE` is `smootherstep(t)` — even gentler ends, used on size-changing arrivals so the rect grow / shrink reads as an elegant settle. Same-size translations (sigil → miss, rail → orbit) get `TRAVEL_EASE`; size-changing arrivals (miss → substrate, substrate → rail) get `MORPH_EASE`.

**Per-leg travel windows:** `sigil → miss` is gated on `#definition`'s reading-zone exit (the brandmark stays section-locked while the visitor is reading the Thoughtform definition). All other legs use centre-to-centre + parkFrac. The `rail → orbit` leg further re-bases its span on `practice.top` for the sticky special case. Helper: `resolveLegTravelWindow` in [`lib/brandmark/journey.ts`](../../../lib/brandmark/journey.ts).

**Substrate shape-blend:** `SHAPE_BLEND_FRAC = 0.30` (was `0.18` before the speed-ramp pass) so the full → ring morph spans the first 30% of the substrate window, holds through the read beat, and retracts in the last 30%. The blend curve uses `MORPH_EASE` so the morph reads as a continuous evolve rather than a linear flip.

---

## The journey transform

```ts
interface BrandmarkTransform {
  rect: { left: number; top: number; width: number; height: number };
  opacity: number; // 0 only at hero / post-orbit bookends (Principle 2)
  density: number; // continuous
  dispersion: number; // continuous (+ per-arrival bump if defined)
  rotationY: number; // radians — non-zero only inside substrate window
  ringsActive: boolean; // true only while parked at substrate
  ringProgress: number; // 0..1 inside substrate window; drives R3F envelopes
  shapeBlend: number; // 0..1 — full → ring topology blend (substrate window)
  vectorOpacity: number; // 0..1 — legacy HANDOFF ramp (under particle cover post-ADR-017)
  substrateMorph: number; // 0..1 (ADR-017) — substrate-sphere point cloud morph
  visible: boolean; // false only at hero / post-orbit-fade-end
  parkedAt: KeyframeId | null; // current parked station; null in transit
}
```

`opacity` is the contract that enforces Principle 2: in the painter it's the `uOpacity` uniform; in any code reviewing this skill, an `opacity` change at any value of `scrollY` between `c[sigil] + 0` and `c[orbit] - 0` is a regression. The painter MUST keep the brandmark cloud at full opacity throughout.

---

## Substrate window — single source of truth for R3F

The substrate-parked scroll window is computed by `computeSubstrateRange(keyframes, centres)`:

```
engageY = c[miss] + (1 - parkFracIn-substrate) * (c[substrate] - c[miss])
exitY   = c[substrate] + parkFracOut-substrate * (c[rail] - c[substrate])
```

Inside `[engageY, exitY]`:

- `transform.ringsActive = true`
- `transform.ringProgress = (scrollY - engageY) / (exitY - engageY)`
- `transform.rotationY = splitRotation(ringProgress)` — drives BOTH the global painter's 2D squash AND the R3F parent group's true 3D `rotation.y`

At `ringProgress = 0` and `ringProgress = 1` the rotation is 0 (axis-aligned). Decorations are at scale 0 (geometrically absent). Both endpoints are clean visual swaps from the surrounding transit beats.

---

## Pre-merge checklist (regression invariants)

Match each item to the principle it enforces. Run the dev parity log (`[brandmarkJourney]` console.debug every 30 frames) and scroll through the page.

- [ ] **Hero (scrollY < 4)** — `transform.visible === false`. No painter renders.
- [ ] **Sigil entrance** — opacity ramps 0 → 1 across `FADE_IN_FRAC * vh`. Hero bookend; only opacity write outside the orbit fade-out (Principle 5).
- [ ] **Sigil parked** — `parkedAt === "sigil"`; rect matches sigil dock; no rotation; no rings.
- [ ] **Sigil → miss transit** — `parkedAt === null`; rect lerps; dispersion ramps up (default bump = atmosphere — sigil → miss is same-size and the bump IS the visual story).
- [ ] **Miss parked** — `parkedAt === "miss"`; rect matches the centre of the 4-card grid.
- [ ] **Miss → substrate transit (CRITICAL)** — rect lerps from ~144 px to ~280 px+; **dispersion stays at 0 throughout** (Principle 2: cloud must stay coherent through growth). NEVER allow a dispersion bump on this leg.
- [ ] **Substrate parked** — `parkedAt === "substrate"`; `ringsActive === true`; `ringProgress` ramps 0 → 1 over the parked scroll window. Rotation envelope plays per `splitRotation`. Decorations (encode ring, sub-orbits, halo) emerge via geometric scale 0 → 1 across `ringProgress ∈ [0, 0.08]` (Principle 4 — NEVER opacity).
- [ ] **Substrate → rail transit (CRITICAL)** — rect lerps from ~280 px+ down to ~56 px; dispersion stays at 0. Same coherence requirement as miss → substrate.
- [ ] **Rail parked** — `parkedAt === "rail"`; rect matches the rail dock.
- [ ] **Rail → orbit transit** — uses the `practice.top` non-sticky reference inside `computeBaseTransform` to handle sticky-orbit math.
- [ ] **Orbit parked** — `parkedAt === "orbit"`; rect matches the orbit dock.
- [ ] **Post-orbit fade-out** — opacity ramps 1 → 0 across `FADE_OUT_FRAC * vh`. Post-orbit bookend; only opacity write outside the sigil entrance (Principle 5).
- [ ] **Singleton check** — `brandmarkSingletonCheck` reports at most one painter visible at any scroll position.

---

## Common edits and where they live

| Want to change                              | File                                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Add a new keyframe / station                | `lib/brandmark/journey.ts` (`buildKeyframes`) + the painter's CSS dock anchor (if SVG fallback) |
| Tune park dwell on a keyframe               | `lib/brandmark/journey.ts` (`parkFracIn` / `parkFracOut` on that keyframe)                      |
| Tune dispersion bump on an arrival          | `lib/brandmark/journey.ts` (`transitIn.dispersionBump` on the destination keyframe)             |
| Tune substrate rotation envelope            | `components/landing/v7/intelligence-layer/intelligenceLayerGeom.ts` (`splitRotation`)           |
| Tune ring extrude envelope                  | same file (`splitExtrude`)                                                                      |
| Tune decoration emerge envelope             | same file (`splitEmerge`) — geometric scale 0 → 1, NOT opacity                                  |
| Tune entrance / fade-out band widths        | `lib/brandmark/journey.ts` (`FADE_IN_FRAC` / `FADE_OUT_FRAC`)                                   |
| Change the 2D squash math (shader rotation) | `components/brand/BrandmarkParticleField/shaders.ts` (`uRotationY` block, `SHEAR_SCALE`)        |
| Add per-frame side effects (CSS gates etc.) | `components/landing/v7/hooks/useBrandmarkJourney.ts` — SVG-mode block (particle mode is silent) |

### Home-v2 corridor (ADR-018) — accretion shell

The depth corridor's brandmark accretes the intelligence-layer `shell` artifact around it inside-out as it travels Navigate → Encode → Build. The shell lives in `components/landing/home-v2/DepthGatewayScene/shell/` and is composed by `BrandmarkAccretionShell` (which tracks `getBrandmarkWorldPosition(paintProgress)` per frame so the whole shell follows the mark).

**Lab-match composition (2026-06-05):** the substrate cage is a clean gold geodesic icosphere (`buildGeodesicEdges(SUBSTRATE_CAGE_RADIUS, 1)` = 80 fine triangular faces) + a fainter dawn inner geodesic, matching the standalone `NestedShellSphere`'s outer + inner shells exactly. It emerges as ONE CLEAN BODY via `splitEmerge(reveal)` (no per-face petals — they would have read busy at the corridor's parked viewing distance). The previous dodecahedron + per-face petal decomposition was removed.

**Current production substrate (2026-06-07, ADR-018):** the Navigate substrate is the migrated Thoughtform compass — 4 concentric rings (gold/dawn + dash) sized to the opening-beat compass, bearing crosshair + ticks, cardinal markers, and atmosphere orbit dots. The whole compass is flat / camera-facing with a slow Z breath. It deploys via an **organic staggered unfold** (per-part `foldEmerge` + `petalStagger`, outer ring → inner → reticle) at full opacity, not an opacity fade. The earlier eight-ball horizon / gimbal-tilt attitude read was removed (the tilting ellipses competed with the flat compass). The gold geodesic icosphere (2026-06-06) is retired. Opening beat (`ThoughtformCompassGate`) now renders nested **square portal loops** instead of circles — same flythrough behaviour.

**Gyroscope exploration (2026-06-08, lab-only):** a particle-SUGGESTED 3D gimbal revival of the eight-ball idea lives at `/test/navigate-gyroscope` (`ShellSubstrateGyro` — flat compass face kept readable, wrapped by a sparse Fibonacci-sphere point cloud + 1-2 faint particle orbital rings + optional horizon band; gentle pitch/roll float + ring precession + pointer parallax; tilt/opacity damp as Encode emerges). It is GATED OFF by default via `gyroLabStore.enabled` — `BrandmarkAccretionShell` renders the unchanged flat `ShellSubstrate` everywhere except that route, so production home + `/test/home-v2` are byte-identical. The particle haze is a substrate-layer decoration (not a brandmark silhouette painter; does not count against the `brandmark-particle` cap). Constants: `SUBSTRATE_GYRO_*` in `shell/shellGeom.ts`; tuning panel `home-v2/lab/GyroLabPanel.tsx`. Not yet promoted to production — no ADR until it graduates.

**Trim-path draw-on (2026-06-09):** the substrate gimbal sphere now reveals via per-element `geometry.setDrawRange` sweeps inside `ShellSubstrateGyro`, not via material opacity (Principle 4: decorations emerge geometrically). Closed circles use `<line>` (LINE_STRIP) instead of `<lineLoop>` so the trim shows; the geometries already have first-vertex == last-vertex so the visual closure at full draw is identical. Each ring rides its `gyroRingUnfold(reveal, idx).tiltT` so the line draws on as it tilts open; meridians + parallels each ride their own `petalStagger` (overlap 0.7) for cascade; per-ring graduations and tick stripes ride the same per-ring stagger; pivot diamonds geometric-scale-in over the last 30% of their ring's tiltT. `gyroAssemblyUnfold(...).presence` was shrunk from 0.4 → 0.08 of the reveal — opacity is anti-pop only; the trim does the storytelling.

**Corridor entry-fly gate on pointer bank (2026-06-09):** `BrandmarkAccretionShell` multiplies pointer / drift / static-tilt all by `smoothstep(DOLLY_HOLD_END, DOLLY_HOLD_END + 0.06, paintProgress)` before writing `gyroTilt`. The brandmark and the canvas assembly both stay axis-aligned at the parked Thoughtform read (section 2) and only acquire mouse/idle bank once the camera is actually flying through the 3D corridor. Stacks compose with the existing `mouseCalm` (Encode floor) and `planetCalm` (epilogue APPROACH).

**Previous substrate (2026-06-06):** one outer gold geodesic icosphere (`buildGeodesicEdges(SUBSTRATE_CAGE_RADIUS, 1)`) and NO inner dawn shell. Low-poly brain remains lab-only.

**Lab-only brain exploration (2026-06-06):** `lib/brandmark/sampleBrain.ts` exports `buildLowPolyBrain` for `/test/intelligence-artifact` variants. Do not treat it as the production home substrate unless a later ADR explicitly ports it back.

**Stack dock (2026-06-07):** at Build the layer (substrate + orbits) docks into the full **stack** via `ShellStack` — green trusted-source lanes from the left, dawn surface fan to the right (ported from the lab FUNNEL variant). The outer geodesic cage at Build is retired. Accretion keys: `{ substrate, orbits, stack }`. Encode orbits are **judgment**, not sources.

**Judgment cardinal primitives (Encode):** four labeled compass axes in `ShellEncode` — Judgment (N), Taste (E), Way of working (S), Voice (W) — plus ~6 asymmetric captured notes that slide in and compare against a primitive. Staggered via `petalStagger`; framed DOM labels via `encode.primitive.*` anchors; persists through Build.

**Per-station camera framing (`parkDistance`):** each station can override how far the camera sits in front of it when parked (`StationNode.parkDistance`, defaults to `GATE_PARK_DISTANCE` 4.5). The three shell parks (Navigate / Encode / Build) use 6.2 so the assembled layer + stack read with oversight.

| Want to change in the corridor accretion shell           | File                                                                                                                                           |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Tune which corridor progress each shell layer DEPLOYS at | `components/landing/home-v2/DepthGatewayScene/sceneGeom.ts` — `CORRIDOR_TIMELINE.accretion` (`substrate` / `orbits` / `stack` start + peakAt). |
| Tune plug cascade overlap                                | `shell/ShellEncode.tsx` — `PRIMITIVE_OVERLAP` / `NOTE_OVERLAP` in `petalStagger`.                                                              |
| Tune stack funnel extents / lane counts                  | `shell/shellGeom.ts` — `STACK_SOURCES_X`, `STACK_SURFACES_X`, `STACK_LANE_COUNT`, `STACK_FAN_COUNT`, etc.                                      |
| Tune shell layer radii (substrate / primitive table)     | `shell/shellGeom.ts` — `SUBSTRATE_CAGE_RADIUS` (0.42), `PLUG_INNER_R`, `PRIMITIVE_NODE_R`, `SHELL_PRIMITIVES`, `SHELL_NOTES`.                  |
| Tune shell-park camera oversight                         | `lib/home-v2/corridorMap.ts` — `StationNode.parkDistance` (Navigate / Encode / Build use 6.2).                                                 |
| Add / re-tune a judgment primitive or note               | `SHELL_PRIMITIVES` / `SHELL_NOTES` in `shell/shellGeom.ts`                                                                                     |
| Change layer composition (mount order, group rotation)   | `BrandmarkAccretionShell.tsx` — mount order: `ShellSubstrate` → `ShellEncode` → `ShellStack`.                                                  |
| Change a single layer's geometry / materials             | `shell/ShellSubstrate.tsx`, `shell/ShellEncode.tsx`, `shell/ShellStack.tsx`                                                                    |
| Stack tier DOM labels (Sources / Surfaces)               | `sceneGeom.ts` `COPY_ANCHORS` + `CopyAnchors.tsx` + `home-v2.css`                                                                              |

The substrate geodesic emerges via `shellWrapEmerge(reveal)`. Judgment primitives + notes and stack funnel emerge geometrically (trim + slide / `foldEmerge` + `petalStagger`). All three layers persist at the Build landing around the persistent DOM brandmark.

**`splitEmerge(reveal)` is the alias of `petalEmerge(reveal).scale`** — used by the substrate cage (uniform body) and the outer surfaces geodesic where per-element petals would have read busy.

---

## When you touch CSS too

- **Particle mode** — there is a SINGLE rule that hides every native dock SVG + the fixed actor: `[data-brandmark-mode="particle"] [data-brand-anchor=...] :where(img, svg) { opacity: 0; visibility: hidden; }` and `[data-brandmark-mode="particle"] .tf-brandmark-actor { display: none; }`. Do not reintroduce per-station `data-brand-svg-dock` or `data-brand-particle-backdrop` attribute gates.
- **SVG fallback** — the `[data-brand-on-missing="parked"]` and `[data-brand-on-rail="parked"]` rules make the native dock SVGs visible at their parked positions. These survived the refactor. Keep them — they're the SVG-mode display story.
- **The brandmark cloud's opacity is owned by the shader uniform**, not by CSS. Do not add `opacity: 0 → 1` transitions to `.tf-brandmark-particle-canvas` — the canvas wrapper stays at opacity 1; the painter inside controls visibility via `uOpacity`.

---

## Don't reintroduce

- **`useSigilChoreography`** — replaced by `useBrandmarkJourney`. The old per-station snapshot model is gone; do not bring it back as a parallel hook.
- **`brandmarkParticleStore`** — replaced by `brandmarkJourneyStore`. The single transform is the only state.
- **`data-brand-svg-dock` / `data-brand-particle-backdrop`** — retired. The single `data-brandmark-mode` attribute (set once at init) is the entire CSS gate.
- **`applyR3FDockMask` / `MutationObserver` in IntelligenceLayerPortal** — retired. The CSS `[data-brandmark-mode="particle"]` rule hides the substrate SVG dock declaratively.
- **`BrandmarkActor.morphRects`** — dead API, deleted. The actor uses `pinToRect` only.
- **`buildBrandmarkParticles` / R3F `<points>` inside `BrandmarkRingfield`** — retired. The R3F scene is rings-only; the brandmark cloud is the global painter's job, even inside the intelligence-layer section.

---

## Debugging tip — the dev parity log

In development, `useBrandmarkJourney` writes a `console.debug` line every 30 frames:

```
[brandmarkJourney] scrollY=4321 parked=miss rect=842,521 144x144 density=1.00 disp=0.00 rotY=0.0deg rings=off ringP=0.00
```

Scan it as you scroll:

- `density` should stay at 1.00 throughout (Principle 1 — continuous);
- `disp` should be 0 at parks and during miss → substrate / substrate → rail / rail → orbit transits (Principle 2); only sigil → miss should show a bell-curve bump up to ~0.45.
- `rotY` should be 0 outside the substrate window and ramp via `splitRotation` inside it.
- `rings=on` should ONLY appear during the substrate window.
- `parked` should match the current dock or report `transit` between them.
