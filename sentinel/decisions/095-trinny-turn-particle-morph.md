# ADR-095: The turn — the parked mark morphs into the client's

**Date:** 2026-09-09
**Status:** Proposed — shipped and guarded, pending the owner's live read
**Surfaces:** `app/(marketing)/trinny-london/**` (`TrinnyPortals.tsx`, `mark/**`, `turn/**`, `trinny-london.css`), `public/prototypes/v7/landing-trinny-london.html`, `public/trinny-london/trinny-london-mark.svg`, `lib/brandmark/morphTargetRef.ts` (new), `components/brand/BrandmarkPhysicsCore/{shaders.ts,BrandmarkPhysicsCore.tsx}`, `components/landing/home-v2/DepthGatewayScene/{BrandmarkPhysicsCoreActor,CorridorArmillary}.tsx`
**Related:** ADR-094 (the page this turns), ADR-023 (the physics core whose attribute this mixes), ADR-021 (the corridor exit; no wall-clock motion behind readable content), ADR-030 §6 (the seam bug the kill edge answers), ADR-082 (the `-120svh` overlap precedent), ADR-065 (corners — the mark's monogram is square), ADR-092 (the type tokens the sheet stays pinned to)

## Context

ADR-094 gave `/trinny-london` its proof stack and, after it, the interstitial
that turns the page to the client. The owner's read: the parked Thoughtform
mark that stays behind the stack is the best thing on the beat, and the turn
should happen TO it — as the reader scrolls out of the last card, the mark's
particles should re-form as Trinny London's logo, a real particle transition
and explicitly not a cross-dissolve, with the four product cutouts sweeping in
around the new mark, and the interstitial copy after that. Also asked for: a
vector SVG of the logo and a 3D wireframe-ish particle version of it.

Four decisions he took at the design step: the mark settles on Trinny coral
(`#F06850`, the route's `--tl-brand-rgb`); the two structural orbit rings
FADE OUT with the morph; `#trinny` stays as its own coral copy slab below the
beat, without the products; and the products SWEEP IN on a scroll-driven arc
then hold — a continuous rotation behind readable content is banned on the
landing (ADR-021's 2026-07-05 addendum, the motion-sickness ruling).

Three facts shaped the mechanism. The parked mark is `THREE.Points` whose drawn
position at rest is literally its `aTarget3D` attribute (every drift term is
×0 at the park). The corridor is prop-less from `LandingPage` down, so the
only route seam is a module ref or an `<html>` attribute read at mount. And
there was no scroll channel from the proof stack into the frame loop — the
stack writes only inline slot vars.

## Decision

### 1 · A registry, three-free — `lib/brandmark/morphTargetRef.ts`

A route registers `{ spec, progress }`: the spec names a lazy builder
(`load: () => import(...)`), the settle colours and the flight lift; `progress`
is the eased 0→1 clock. `readBrandmarkMorph()` is **0 whenever no spec is
registered**, and every consumer is an exact identity at 0 — which is what
keeps `/` and `/claude-workshop` pixel-identical without a flag. `TrinnyPortals`
sets it in the SAME layout effect as `data-services-ring` (layout effects run
in tree order in one commit, so the ref is visible before anything in the lazy
corridor chunk mounts) and ONLY when the capable rung matches — mobile and
reduced motion would otherwise build a target nothing drives. ONE writer of
`progress`: the route's turn writer.

### 2 · The shader gains a second home, always declared

`aMorphTarget` (vec3, a COPY of `aTarget3D` until a target is written in), `uMorph`,
`uMorphLift` (vertex-only), `uMorphColor`/`uMorphAccent` (fragment-only) and a
`vMorphT` varying. After the corridor's wind block:

```glsl
float mT = smoothstep(0, 1, clamp((uMorph − stagger·0.35) / 0.65, 0, 1));
pos = mix(pos, aMorphTarget, mT) + morphDir · sin(mT·π) · uMorphLift;
```

with a per-particle stagger hashed differently from the corridor's own, and a
hashed flight direction with real Z so the swarm passes through depth. The
colour crosses as a VARYING so `uMorph` stays vertex-only and the shared-
uniform precision trap (`shaders.ts` L92-104) never applies. A mid-flight size
lift and the depth dim's return on the morphed target ride the same clock.

**Not a `defines` toggle.** The material memo has `[]` deps: a define decided
when the async target arrives would need `needsUpdate` (a mid-page recompile),
and one decided at mount yields a second program no lab exercises. Always-
declared is identity by IEEE arithmetic (`mix(x, y, 0.0)` is `x`; the bulge is
scaled by `sin(0)`), and no test pins the GLSL string — the HUD snapshots and
the corridor smokes on `/` are the proof, and they pass unchanged.

⚠ **The flight direction is NEVER `normalize()`d.** A hashed vector can be zero,
`normalize` of zero is NaN, and `NaN · sin(0)` is NaN — it would corrupt the
PARKED mark at `uMorph` 0, on every route.

### 3 · The target arrives late and is written INTO the attribute

`BrandmarkPhysicsCoreWithGLB` reads the spec once at mount (the `ringOff`
idiom), `load()`s the builder and hands it the mark's OWN normalised homes
(`targetHomes`, ±0.5 half-extent) and the slot count. The result is `.set()`
into the existing `aMorphTarget` attribute by an effect — never a geometry
rebuild, which would dispose and re-upload every attribute while the corridor
is painting. A rejected load leaves the mark ours, silently.

### 4 · The client's mark: measured, not traced

No tracer exists in the repo (`sharp` only), and none was needed: the source
PNG (1271², flat colour on alpha) was MEASURED — the ring's two radii off the
centre row and column, each glyph's rectangles off its connected component
(`trinnyMark.ts`: ring 635.5/564.5; T = `(412,459)(677,459)(677,554)(503,554)
(503,1051)(412,1051)`; L = `(740,228)(831,228)(831,820)(566,820)(566,725)
(740,725)`; squares `(239,459,120×95)`, `(884,725,120×95)`; ink `#56565A`).
Three copies derive from those numbers and `tests/lib/trinny-mark.test.ts` pins
them together: the SVG asset (`trinnyMarkSvg()` verbatim), the inline fallback
in the prototype, and the 3D target. ⚠ Each glyph is ONE outline — two
overlapping rectangles would put a sampled seam through the junction.

`buildTrinnyTarget.ts` extrudes the outlines (`THREE.Shape` → `ExtrudeGeometry`,
depth DERIVED from the base's own `max|z|` so the two wireframes are one
material) and edge-samples them with the SAME sampler the corridor uses
(`sampleBrandmark3D`: cap outlines, corner edges, and an explicit strut budget
so the ring reads as a drum). ⚠ Sampled ONCE with all five geometries — the
sampler re-centres and re-fits per call, and two calls would blow the monogram
up to the ring's extent. Oversampled 1.6× so every class has more target
points than slots.

### 5 · The pairing is a sort, not a search — `pairByPolarRank.ts`

Every prior pairing in the repo is `i % n`, which only works for shapes that
nest. These two share a topology — a RING around BARS: Thoughtform's ink is
54 % at r ≥ 0.8·R, Trinny's ring sits at r ≥ 0.89·R with its monogram under
0.71·R — so one radius split (0.42 in the 0.5 space) classifies both, and
within a class slots and targets are sorted by polar angle and paired by RANK.
Ring flows to ring with the least rotation; the bars flow radially into the
monogram. Deterministic, O(n log n), class-preserving (the test asserts it).
The rank map takes a uniform subset when the target outnumbers the slots.

### 6 · The beat — `#turn`, between `#services` and `#trinny`

A TRANSPARENT station the canvas lives through: `100svh` of pin + a `120svh`
runway + `100svh` the interstitial slides over, with a sticky full-viewport
stage holding the four products and the inline fallback SVG. The cover form is
`#services`'s (transparent, `content-visibility: visible`) keyed on the same
exit attribute as the kill — ⚠ **but the child rule sets `z-index` ONLY**:
`home-v2.css`'s `position: relative` on `#services > *` would un-stick the
stage. `#trinny` keeps `data-corridor-kill` (the parse guard still counts one),
the grade and the copy; its products moved up. `data-station="proposition"` on
`#turn` turns the journey there with no mark of its own (the roster stays five
rows).

**The overlap.** The stage would unpin at `#trinny.top = 100svh` while the
mark fades over `#trinny.top` 0.6vh → 0 — a viewport of products sliding up
past a fixed mark. `#trinny { margin-top: -100svh }` on the capable rung keeps
the stage pinned until `#trinny.top = 0`, exactly the fade's end: the coral slab
wipes mark and products together, the site's own station-over-canvas handoff.
⚠ Keyed on the MEDIA rung, never on `data-corridor-exit` — a margin on a
transient attribute would shift the document by a viewport when it clears.

**The products** carry NO `data-parallax` (that channel derives from the
element's live rect, constant inside a pinned stage, and writes `translate`)
and NO `data-m` (a second opacity owner). They are placed from five vars the
writer sets per frame, through the `translate`/`rotate`/`scale` properties.

**The fallback mark** is hidden under `html[data-services-ambient="true"]` —
whenever the WebGL mark is parked on stage — and shows on the paths the morph
cannot run on (mobile, reduced motion, a GPU the governor refused).

### 7 · The clock — `turnClock.ts` + `useTurnScroll.ts`

`p = clamp01((vh − top) / (vh + runway))`, `runway = height − 2·vh`: 0 when
`#turn`'s top reaches the viewport bottom (the last card starts to leave), 1
when the runway is spent. The particle morph is `smootherstep((p − 0.25) /
0.55)` — card 4 is an opaque plate over the mark until it has scrolled ~0.7vh,
so the first flight must be visible; settled by 0.80. Products enter over
0.42–0.97 (`0.42 + 0.07k`, span 0.34), each on an arc about the mark's centre
(`0.5 + CENTER_Y_OFFSET / (2·CENTER_DISTANCE·tan(FOV/2))` = 0.545 of the stage
height — the test re-derives it from the actor's and `sceneGeom`'s sources),
sweeping 50° in alternating directions from 0.3·stageH further out, then a
6px scroll-linked drift. Everything is a pure function of the station's rect:
reverse scroll unwinds it exactly, nothing rides a clock. The writer is
passive, rAF-coalesced, delta-gated, and parks whenever the capable rung does
not match or the stage does not compute `sticky`.

### 8 · The orbits

`orbitExitGetter` gains `× (1 − readBrandmarkMorph())`: the two structural
rings — the armature of OUR mark — dissolve on the same eased clock. Identity
on `/`.

## What the stills caught, with every gate green

- **`align-content` aligns BLOCK content too (Chrome 123+).** The station's base
  rule is `display: grid; align-content: center`; the capable rung set
  `display: block` and the stage was still CENTRED in the 320svh station — it
  stuck at p ≈ 0.95 instead of 0.45, and the first thing seen of a product was
  a sliver crossing the stage's edge. The probe measured `stage.top` 973px at
  p 0.6. `align-content: start` in the rung.
- **A product start 0.45·stageH out crossed the stage's top edge** on entry;
  0.3 keeps the sweep on stage, faded out, reading as rotating into place.

## Consequences

- `/` and `/claude-workshop` carry three new attributes/uniforms and one new
  varying in the shared program, all identity at 0. The HUD snapshot spec
  passes without `--update-snapshots`; the corridor smoke passes.
- The interstitial is a copy slab now; the products live in the turn. The
  parse guard pins: order with `turn`, four `tl-turn__product` in `#turn` with
  `data-tm` 0–3 and no `data-parallax`/`data-m`, none in `#trinny`, the kill
  still on `#trinny` alone, `#turn` without it.
- The smoke's stack case gained the turn: stage `sticky`, `data-services-ambient`
  and `data-corridor-exit` live mid-turn, `data-tl-turn` in range, the fallback
  hidden, the Proposal lit, the products painted and settled, then the kill at
  `#trinny`'s top. The capture gained stops 14–17 solved for `p`.

## Left open

- The mid-flight density (the swarm is diffuse at p 0.6 — `uMorphLift` 0.12 and
  the 0.35 stagger are the dials) and the settle colour's accent, after the
  owner's read.
- A `/test/trinny-mark` lab (the standalone 3D wireframe particle logo with
  sliders) is designed and not built; tuning today is by capture.
- The mark's 0.6vh fade against `#trinny` is mostly moot under the overlap —
  the slab wipes it first. If the wipe should be a dissolve instead, shorten
  the overlap rather than the fade.
- Phones show the static composition (the inline mark, products at the
  corners); it has not been looked at.

## Verification

```bash
npx vitest run tests/lib/trinny-mark.test.ts tests/lib/trinny-london-parse.test.ts tests/lib/trinny-london-journey.test.tsx tests/lib/brandmark-3d-sampler.test.ts tests/lib/landing-import-doctrine.test.ts tests/lib/type-material-tokens.test.ts
npx playwright test tests/visual/trinny-london-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop          # / byte-identical, UNCHANGED
npx playwright test tests/visual/landing-corridor-smoke.spec.ts --project=desktop
node scripts/capture-trinny-london.mjs --vp 1920x1247 --port <port> --out .cursor/trinny-shots/1920   # headed — LOOK at 14–17
node scripts/capture-trinny-london.mjs --vp 1280x720 --port <port> --out .cursor/trinny-shots/1280
```
