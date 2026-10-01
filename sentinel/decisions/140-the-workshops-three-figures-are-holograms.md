# ADR-140: The workshop's three figures are holograms on one stage

**Status:** Proposed (2026-10-01, owner) — built, guarded and measured at
1920×1080 and 1280×720 in both themes; pending the owner's live read before
the Suri room (Monday 5 October).

**Surface:** `/arcs/thoughtform-workshop-v2` and every page that draws the
`stages`, `curve` or `spectrum` kind (`/arcs/thoughtform-workshop`,
`/arcs/plopsa-workshop`, `/arcs/ai-storytelling-class-1`).

**Supersedes on the live layer:** ADR-130 U5's "the live stage serves the
stages beat alone". **Stands on:** ADR-130 U4 (one parallel projection, the
camera frames the SVG's own crop, no drag, opaque shaded faces on the dark
blocks), ADR-080 (the dynamic seam, the tri-state, the palette), ADR-106
(copied, never imported), ADR-065 (gold buys one thing per drawing).

## The ask

The owner, 2026-10-01, with the Suri kickoff four days out: the second cut
"looks great" but its figures are Moira's flat charts recoloured. He wants
them in the brand world — "retro-futuristic, holographic particle system
visualizations" — _"that doesn't come at the expense of a clear
visualization. The curve section is super clear … isometric, which is nice. I
still think we can leverage our particle system holographic effect to make it
even better. The same goes for that spectrum between tool and collaborator …
Even for prompter, tool, and agent, those three blocks, there are much cooler
ways of doing that."_ He pointed at a reference: `evangelion-neon-overdrive`
(Luis Bizarro, MIT) — which is NOT a video but a deterministic three.js +
Canvas2D piece, every frame a function of song time, drawn with GPU line
batches, a bloom/halation/grain post chain and a CRT scan pass.

He had tried this once, for Plopsa (ADR-130 U2), and rejected it the morning
of the room: a perspective camera ("the vanishing point is on the right
side"), drag ("how … should people be able to discern what this
represents?"), translucent faces that read as X-ray, floating labels that
collided. U4 and U5 kept the stages live on one parallel projection and sent
the curve and the spectrum back to flat ports of Moira's own figures.

So the brief was precise: **keep every rule U4 won, and spend the particle
system and the hologram material on the three figures he named.**

## Decision

### 1. One renderer, three builders — the drawing stays data

`HoloStageScene` paints a `HoloStageSpec`; it is still the one component that
knows how (ADR-130 U2's law, kept because ADR-080's component-per-object let a
lab and a page drift with every guard green). The curve and the spectrum are
BUILDERS: `components/holo-stage/curveGeom.ts` and `spectrumGeom.ts`, pure and
three-free, beside `stageGeom.ts`. The mount (`ArcHoloStageMount`) gains a
scene union; the doctrine test's two sanctioned leaves do not grow, and the
new pure modules join its `HOLO_FREE` allow-list.

### 2. The curve is a LIFT, not a redraw

`framing/curveSurface.ts` was already three-dimensional: Moira's floor is the
stage's own 22° basis (`ISO_BASIS_STAGE` at `k = 1`) and `surface(t, v)`
lifts a floor point by the curve's height. `curveSurface` exports `world(t,
v, series)` — the floor coordinates and the height in viewbox px — and
`curveGeom` scales them by `STAGE_K` (40) into the stage's world, so one
camera distance serves both drawings. **The frame is the SVG's own 780 × 425
crop** (`CURVE_FRAME`), and `holo-stage-geom` asserts
`stageToCrop(curveWorld(t, v)) ≡ surface(t, v)` to the unit, both series.

Drawn: the floor and its hairlines, the vertical axis, the step band as a
gold-washed face with its two edges, the other vendor's run, the own curve on
the front edge as the ONE bloom donor, the lane points and the other vendor's
points as rings (the frontier's the thickest), the wall under the front edge
as a strip, motes over the floor per unit of area — and, in a REVEAL GROUP,
the second dial: six isolines, six risers, three lane risers, their tips, the
level marks and six sheets between the isolines.

### 3. The second dial rises on its button — reveal GROUPS

`ArcCurveSteps` already writes `data-step` 0 / 1 / 2 on the figure. The mount
reads it with a `MutationObserver` and hands the canvas
`groups: { effort: step >= 2 }`; the scene eases each named group's clock
toward its target over `GROUP_MS` (1100 ms), and every grouped line, face,
strip and dust set rides THAT clock rather than the intro's. So the surface
draws on out of the front edge when "Show the effort dial" is pressed and
folds back when it is pressed again — the SVG's `.arc-cv__depth` opacity, as
geometry. A group is seeded at its target on the first frame, so a canvas
that arrives with a group open does not replay its rise. `spec.groups` names
every group (≤ 4, a `vec4` in the batch) and the guard fails a group used
and not named.

### 4. The dense structure is ONE draw call — the batch

`stageBatch.ts` is the Evangelion engine's `lines.ts` copied by hand (MIT, the
P(doom) lineage): an instanced quad per segment, a capsule SDF anti-aliased
in physical px, widths in CSS px like drei's — re-cut so every segment carries
its own reveal window and group and the shader does the draw-on. Sixty
isolines, a graticule and a dozen rings cost what one drei `Line` costs. The
lit donor runs keep drei's fat `Line` (its draw-range reveal and bloom lift
already work). Additive (One, One) on dark, premultiplied normal on light.

⚠ **Depth-tested, like drei's runs.** The first cut set `depthTest: false`
and the two dark blocks' hidden edges printed through their opaque faces — the
X-ray the owner rejected in U2, back through a material flag.

### 5. Arrival = draw-on + ONE SWEEP

A `StageSweep` is a gold front crossing the object once along one world axis
over a window of the intro (`sweepAt`, `sweepReaches`). Batched segments and
motes ahead of it are not drawn; at the front they glow; behind it they are
there. No fade — `step`, not `mix` (the house's reveal law, ADR-097 U12's
centre-out aperture in three dimensions). Faces and donor runs seat their
own reveal windows from `sweepReaches` of their position, so a block's wire
draws on as the front reaches it and its solid resolves just behind the
wire. Grouped elements are never swept — they arrive on their button.

### 6. The spectrum is a FIELD, and it is FLAT

The spectrum's fallback is a horizontal rail with two bands (ADR-136). A rail
earns no third dimension (the hologram grammar's first law), and a 22° strip
under a horizontal rail would be two pictures — so the particle layer looks
straight at the plane: `view: "flat"` in `stageFit` (camera on +z, world
units the track's own px, `toFlat(x, y) = [x, −y, 0]`, frustum = the box).

What it draws is the one thing the figure has to say: **software is
deterministic, intelligence is probabilistic.** One field of motes under the
two bands; on the tool's side every mote is a LATTICE mote — a crisp square
frozen on a grid you can count (`aOrder` 0) — and across the overlap the
lattice dissolves: each mote's order rises to 1, its home is thrown off the
grid by a seeded jitter, and the dust shader lets it drift and softens it into
a cloud mote. A quiet ruler of twelve ticks under the rail. The HTML rail, the
bands, the gold box, the handle and the words stay — the DOM is the drawing's
words and its one gold object, so the field carries NO donor.

⚠ **The geometry is MEASURED, never mirrored.** The field is built from the
band boxes the mount reads off the track with `getBoundingClientRect`
(re-measured on resize), so the CSS that lays the bands out stays the one
source and no percentage is restated in TypeScript.

### 7. The stages are WIRE VOLUMES on U4's floor

Same positions, footprints, heights, pose and crop. The sweep crosses the
floor along time; each block's twelve edges draw on as the front reaches it
and its faces resolve just behind the wire. The two dark blocks keep U4's
opaque shaded faces. The agent's block — the drawing's one gold object,
standing at the back with nothing behind it — is a TRANSLUCENT gold volume
FILLED with a seeded point cloud, per unit of volume (`14 × w·d·h` motes):
a thing that runs on its own, drawn as what it is made of. Its top rim stays
the one donor. A time ruler on the front-right edge, a tick every unit and a
longer one on the grid — the axis the DOM words already name.

### 8. The material, and what light does to it

- **A scanline pass** (`HoloScanline.ts`, a `postprocessing` `Effect`
  mounted as a `<primitive>`): horizontal lines every three physical px,
  multiplied, strength `SCAN_STRENGTH` 0.08 on dark — a held instrument's
  screen, never texture over the words. **Zero on paper**, kept mounted (a
  composer whose child count changes between themes remounts every effect).
- **Halation**: a second, wider, fainter bloom tap off the brightest thing.
- ⚠ **THE BLOOM THRESHOLD SITS ABOVE THE PAPER IN LIGHT.** Parchment's
  luminance is ~0.79; at 0.62 the whole ground bloomed by a trace — the canvas
  measured `rgb(237,228,215)` on a `rgb(236,227,214)` page, one unit,
  invisible as a colour and a RECTANGLE the width of the beat (ADR-080 U2's
  finding, again). 0.97 in light leaves bloom with nothing to lift.
- ⚠ **THE VIGNETTE IS ZERO ON PAPER.** Even the palette's 0.22 trace darkened
  the canvas edge a unit against the page (patch means 235.1 against 236.0).
- ⚠ **THE CANVAS PAINTS THE PAGE'S OWN GROUND, READ AT RUNTIME.** The mount
  resolves the host's first opaque ancestor's `background-color` (a frame
  after a theme flip) and hands it to the canvas; the palette's constant was
  right by luck on this route and need not be on the next.
- **An ink multiplier for a field that IS the drawing**: `StageDust.inkScale`
  (1.7 on the spectrum) lifts `HOLO_LIGHT.dustScale`'s 0.45 back toward
  legible ink, light only.
- The light drawing stays an ink drawing on paper (`holoPalette`): normal
  blending, dark structure, `--gold-line` for the donor.

### 9. Reach

The live layer switches on wherever the kind renders — the stages'
precedent. The SVG fallback is byte-identical on every page (the handout,
reduced motion, ≤ 900px, no GL, a dead canvas), and the three pages that
share the kinds lose nothing. Owner's call, 2026-10-01.

## What was measured

Headed Chromium with real GL (`scripts/capture-workshop-holo.mjs`, new):

- `data-holo="live"` on all three beats at 1920×1080 and 1280×720, dark and
  light; canvases 704×357 (stages), 881×480 → 650×354 (curve), 1200×76 →
  1022×72 (spectrum); every beat exactly one viewport; `data-arc-tall`
  absent; zero page errors.
- The curve's three states, forward and back: step 0 the front edge and the
  nodes; step 1 the prices (DOM); step 2 the surface drawn on; step 1 again
  the surface folded back.
- Ground: dark canvas `rgb(10,9,8)` = page; light canvas within the grain's
  ±1 of `rgb(236,227,214)` after the threshold and vignette fixes.
- `holo-stage-geom` (26 tests): every point of all three specs inside its
  crop (the spectrum's with its drift as slack), the curve identity, the flat
  identity, one donor on the stages and the curve and none on the spectrum,
  every used group named, the sweep's arithmetic, the lattice dissolving
  exactly across the overlap, determinism. `arc-iso` gains the v2 row that
  was missing. `arcs-import-doctrine` green with the two new pure modules.
- `tsc` clean; the touched files lint at zero warnings (the ratchet has no
  headroom; per-frame writes go through refs, never through a memoised
  value).

## Left open

- **The owner's live read**, at `http://localhost:3003/arcs/thoughtform-workshop-v2`.
- **The dials** — sweep speed and width, scan strength, the agent cloud's
  density, the sheets' opacity, the lattice's brightness — are constants
  chosen on the stills; a look-dev lab (`/test/workshop-holo-lab`) is the
  next step, and Part C's style memo is what they get set against.
- **The spectrum's band words sit over the field** (`SOFTWARE`,
  `INTELLIGENCE`); legible on the stills, but a bed under them may be wanted.
- **The curve's DOM tags over the surface** at 1280×720 are the SVG's own
  seating and unchanged; the hologram made them no worse.
- **No bake of the hologram for the phone** — ≤ 900px stays the SVG by the
  gate, which is the law.
