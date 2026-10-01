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

## Round two and round three (2026-10-01, same day)

⚠ **THE DECISION ABOVE IS ROUND ONE, AND THE OWNER REJECTED IT** the same
morning: _"what I'm seeing is just glorified. You used the visuals we had …
and you added some particle effects to it. My explicit specific ask was to go
back to the fucking drawing board, use particle systems, draw inspiration from
the images I shared, and really build them up from first principles."_ He was
right, and the guard above proved it against itself: §2's identity test asserts
the hologram EQUALS the SVG to the unit — a test that the drawing did not
change. Round one stays wired on the page until a pick lands (commit
`5649df62`, revertable alone); §1–§9 stand as the engine's record.

**Round two** (the lab, `/test/workshop-holo-lab`, six directions) redrew the
compositions from his references — a wire planet with a tilted orbit, a
geodesic sphere discharging into a grid, a terrain relief on a stacked slab, a
Smith-chart trace, a graduated gauge, two poles — each at its own vantage. He
rejected those too: _"it feels very boring. It doesn't have any of that
isometric, cool particle system that we use, for example, for our arc sphere.
The perspective is also super weird."_ Two findings, both mine to own:

1. **The material was wire.** Instanced hairlines with a few motes sprinkled
   on, when the house's own hologram is the brandmark core — six thousand
   luminous motes assembling out of dust under curl flow and a return-to-home
   force, with a sprite library (dot · dither · voxel · glyph · dash · cell ·
   bracket · scan). I had dismissed that core as "the wrong base for a
   lightweight kit". The references he gave are all POPULATED: a figure of
   nodes and dust between two platens, coil-ball instruments on a wire planet,
   a dot-matrix horse coming apart, an armillary in a sparkle field.
2. **A free camera reads as a wrong perspective.** `{ az 30, el 36 }` is a
   vantage nobody on the site has seen; the stage basis (az 45 / el 22,
   `ISO_BASIS_STAGE`) is the one every isometric drawing in the house shares.
   "Try different vantage points" was an invitation to explore, not a
   licence to ship one.

**Round three** is the pass the brief asked for, and it adds one layer to the
engine rather than a second renderer:

- **`stageParticles.ts`** (pure, three-free): a figure is POPULATIONS of
  particles — home positions, a role (the colour rung), a sprite shape, a
  size, an alpha, a reveal window, `order` (1 seats on its home, 0 rides the
  sim), `drift`, `twinkle`, `sizeVar`, `lit` — and deterministic samplers
  (`dotsAlong`, `lattice`, `wallLattice`, `ringDots`, `sphereRings`,
  `motesIn`, `motesAround`, `ribbon`, `tendrilDots`, `ticksAlongA`,
  `slabLayers`). `HoloStageSpec.particles` carries them.
- **`HoloParticles.tsx`**: ONE `<points>` per figure fed by the corridor
  core's own `GPGPUParticleSimulation` (curl flow + return + turbulence), the
  forces lerped from DISPERSED to SEATED over the first 62 % of the intro —
  so every figure assembles out of a scattered shell of dust exactly as the
  Arc sphere does (measured: a loose cloud at 700 ms, the figure at 1300 ms
  with the gold front crossing it). Ordered populations then seat exactly;
  clouds keep the sim's faint physics and their own slow wander.
- **`stageParticleShader.ts`**: the core's sprites, copied; the stage's
  clocks per particle (intro, groups, the sweep front with a flash behind
  it); premultiplied, additive on dark, ink on paper. ⚠ **Six attributes,
  not sixteen** — fifteen scalars failed to link on the first shoot ("Too
  many attributes") against the GPU's 16 locations; they are packed into
  three `vec4`s and the home rides `position`.
- **Three directions on the stage basis**, in `directions/`:
  **Graph** (the curve as a plotted graph — ruled graph paper of beads with
  cells at the crossings on a five-layer stacked slab, a graticule on the
  back and side walls, a beaded vertical axis with its levels, a time ruler,
  the frontier as a RIBBON of gold with a halo of sparkle — the one lit
  object — a ring node per lane with a dotted drop to the floor and a cross at
  its foot, the other vendor as a dawn trace, the step a lit patch under the
  rise, and the effort surface as a MEMBRANE of motes with isolines and risers
  on the `effort` group); **Sphere** (the stages — a floor lattice of cells on
  a slab with the three footprints lit, YOU a green node, the prompt one
  bright node with a drop, the tool a standing ring with a second ring turned
  through it, the agent the Arc sphere itself: twenty-four latitude rings of
  gold motes with a tilted orbit, hovering clear of the floor and discharging
  six tendrils into the cells it covers, reporting back to the hand once);
  **Dissolve** (the spectrum — one field over a long slab, a lattice of cells
  at the tool's end coming apart cell by cell into a drifting plume of motes at
  the collaborator's, the gold node where AI sits with its own strike down to
  the rail).

⚠ **Two shader defects the first shoots caught, both silent**: the sweep
gate was inverted (`passed` was 1 AHEAD of the front, so the whole figure was
hidden at rest and only motes that drifted past the end showed), and a
backtick in a GLSL comment closed the template literal (a 500 on the whole
chunk). Both are the kind of thing a geometry test cannot see; the lab shoot is
the guard.

**Open:** the owner's pick per figure. Then the pick takes an SVG fallback
drawn in the same beaded grammar, DOM labels with leaders, the `arc-iso`
label walk, and replaces the kind's renderer on every page; round one's page
wiring comes out; this ADR is rewritten for what ships. Left open from round
three itself: a slow travel of motes along the globe's rings (the particles
orbiting while the globe stays put — motion the framing stage's no-breathing
law may or may not allow), and the budget on a tablet tier (one 128-square
texture per figure, three figures on one page).

## Round four (2026-10-01, evening): the instrument plates

The owner's read of round three, the same evening: the graph is a graph now,
but all three "look too boring", and nothing here yet looks like the Arc
sphere or the brandmark core. Measured against his references (the ZERO slab,
the teleportation chamber, the CRT map, the sixteen Evangelion plates), round
three was a small object in a large void with nothing drawn around it, at a
quarter of the Arc sphere's density, under a bloom tuned to show almost
nothing, and frozen after arrival. The compositions carried the readings and
were not rejected; what changed is the FRAME, the MATERIAL, the LIGHT and the
LIFE. Three decisions with him: build in this engine and judge in the lab (no
standalone renderer); Monday's room runs on round one, so the page is
byte-identical until a pick; two generation waves and six clips at a cap of
USD 50 (wave 06 spent 15.6).

- **The frame is the instrument** (`directions/instrument.ts`). Every plate
  stands on a BED: a dotted graticule past the figure's floor to the crop's
  edges, beaded rules every three units, ruler ticks on the bed's two front
  edges, the slab's stacked outlines below, the front edges a step brighter.
  Readouts are DOM plates (`DirLabel.kind: "readout"`, a framed KEY over a
  value, the arcs overview's Starfield grammar, TR + BL cut), seated in the
  bed's margin and STACKED IN SCREEN PX from one anchor — a world-z step of
  0.6 was 23 px at 1920 and the first cut's three plates overprinted. Figure
  plus bed spans more than 70 % of the crop's width on every plate (guarded).
- **The Arc sphere's density.** The agent's globe is the gyro's own
  cos-latitude dotted shell (`sphereShell`, copied from `buildDottedShell`,
  never imported), an additive Fresnel ATMOSPHERE (`StageShell`, the gyro's
  shader, dark only), an equator and a meridian of beads, an orbit that
  circulates. Sprites at the core's size (dot 4–4.8, cell 4.6–5.2, a new
  hard-edged `disc` for the lane nodes); the frontier ribbon at pitch 0.012
  under a 300-per-unit halo. ⚠ 3000 shell dots fused into a solid ball at
  this scale: 2000 keeps the rows that make it read as a globe. ⚠ The
  spectrum's lattice at 0.22 with seven layers fused into vertical bars in
  the parallel view (grammar §7.5 again): four layers at 0.26. The lit object
  is at least a quarter of the frame's shorter side on the stages and the
  curve; the spectrum's gold is a LOCATOR on the rail and takes a twelfth.
- **The light** (`HoloPost.ts`): the P(doom) chain ported from the motion
  study — a thresholded prefilter, a 13-tap pyramid through seven mips, a
  9-tap tent up, a warm-gold halation tap fed only by what passes the
  threshold (0.85 dark, 0.97 above the paper in light), the tone shoulder,
  the raster at 0.10, the vignette — as one `postprocessing` `Pass` before
  the composer's `Noise` (which keeps the grain and does the encoding). The
  donor writes at 3.2× linear. The two-Bloom chain stays behind
  `post="bloom"`, and ⚠ IS THE PAGE'S DEFAULT until a pick, as is the 0.08
  raster.
- **Life** (`stageParticleShader.ts`, a seventh attribute `aFlow`): a seated
  bead with a tangent TRAVELS — `run` slides it one step per period and wraps
  (a conveyor: the ribbon flows toward the frontier, the orbit circulates,
  the tendrils pulse into their cells, the rail flows software → intelligence),
  `wander` swings the shell's dots on a sine; clouds keep a CONSTANT curl
  (seated turbulence 0.018 → 0.046 at life 1); a RE-SCAN front crosses the
  plate at the end of every 9 s at a quarter of the arrival's brightness
  (⚠ the first cut fired it on the arrival's heels — a double sweep). The
  object never rotates or breathes. ⚠ The atmosphere arrives WITH the globe
  (reveal 0.34–0.66): the first clip had it at full strength at 0.8 s as a
  brown ring around dots still gathering. Measured on the rendered clip,
  whole-frame mean |Δ| per 255: arrival 1.0–1.5, hold at life 0 = 0.029
  (grain + twinkle), at life 0.6 = 0.234; the house film's hold is 0.04–0.15
  (grammar §5), so the default is 0.5. Veo clips on a populated first frame
  were measured too (wave 06): 2–6 per 255 and an invented object on five of
  six — the life is built in code, never recorded.
- **A frozen clock** (`clock` on the canvas, `?t=` in the lab, `__holoClock`
  for the capture): the sim steps at a fixed 1/60 from its seed, so a frame
  is f(t). `capture-workshop-holo.mjs --video` renders a clip frame by frame
  through it and `--sheet` tiles one; 120 frames in 12 s. ⚠ Pass `--out` as
  a Windows path: Node reads `/c/Users/…` as `C:\c\Users\…`.
- **Light theme**: the ink drawing on paper, the pyramid at the paper
  threshold, no halation, no raster, no vignette, no atmosphere shell
  (additive cannot ink); verified on all three plates.
- **Measured on the stills** (1920 x 1080, the lab's stage element): the
  light canvas ground is (234, 227, 215) against the page's (235, 227, 214),
  within a unit on all three plates; the stages donor's core clips to white
  with a 10 %-halo of 31 px (the 20-40 target); the curve's and the
  spectrum's donors are a line and a ring, so a row through the brightest
  pixel measures the object (231 / 128 px), not the halo. The dark corners
  read (8, 8, 7) against the page's (10, 9, 8): the vignette, by design in
  the lab's full-bleed glass, and a thing the port has to decide (0 on the
  page, or the beat's ground matched), or the canvas shows its edge.
- **Guards**: `tests/lib/holo-stage-instrument.test.ts` — homes in the crop,
  ≤ 128², denser than round three, fill ≥ 70 %, lit share per figure, one
  tangent per flowing bead with a period, every readout keyed, at most one
  gold shell, determinism, the stage view, and a negative case. `tsc` clean,
  the touched files lint at zero.

**Wave 06 on the prion ship** (grammar §8, rubric 0.2, block v0.5, 18 nano
draws + 6 Veo clips, USD 15.6): the BED framing drew what the owner asked for
on six of six from words alone (`B-stagesv3__nano_02` the frame: the globe in
rows, the orbit, the discharge, a countable graticule, five empty readout
frames, no lettering, no bezel); the PANEL framing reads as an instrument but
leaves the figure at 55 % of its housing; DENSE lost the parallel projection
on four of six when the margin went. Gallery:
`Arcs_Thoughtform-Holograms/delivery/review-wave-06-populated.html`.

**Open:** the owner's read of the three plates at
`http://localhost:3003/test/workshop-holo-lab` and of the clips in
`Hologram Grammar\02_Creation\round-04\`; then the port (the bed becomes the
beat's figure host, a new SVG fallback in the beaded grammar, DOM readouts
with leaders, `arc-iso` rows for the curve and the spectrum, round one's
wiring out, `stageParticles` onto `HOLO_FREE`, this ADR rewritten for what
ships). Left open from the build: the readout plates' DECODE on arrival (the
page's own idiom, not yet in the lab); the tablet budget (one 128² sim and a
seven-mip pyramid per plate, three on a page); `HOLO_LIGHT.dustScale` is
shared with the trajectory beat and was left at 0.45 (the layer lifts it
×1.5 on paper itself).
