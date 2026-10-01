# The hologram stage

The live half of the isometric register: when a drawing on this estate stops
being a drawing and becomes an object the reader can turn. Its static half is
[isometric-wireframe-grammar.md](isometric-wireframe-grammar.md), and the two
are **one picture** — that is the first law below, not a nicety.

Source of truth: ADR-080 (the trajectory instrument), ADR-130 U2 (the
workshop's four framing beats). Code: `components/holo-program/**` and
`components/holo-stage/**`.

## When a drawing goes live

Reach for this only when all four are true:

1. **There are three quantities.** Two fit a plane; a third is what a camera
   buys. A prism whose width and height both mean something, standing on a
   floor, is three. A proportion, a cycle or a dial is not — that is the ring
   register (ADR-106).
2. **There is a floor.** The depth axis has to land on something, or the object
   floats and the pose reads as an accident.
3. **The record is worth turning.** A reader who drags it should learn
   something the rest pose withheld. If not, the SVG is finished work.
4. **The page can fall back.** No WebGL, reduced motion, a phone, a print — all
   of them must get the flat drawing, whole.

> A holographic object that looks impressive while encoding nothing is a lava
> lamp with a legend.

## ⚠ SUPERSEDED FOR THE FRAMING BEATS BY ADR-130 U4

The workshop's framing beats use a fixed ORTHOGRAPHIC camera that projects
exactly the SVG's parallel basis (`ISO_BASIS_STAGE`, both floor edges at 22
degrees from the front corner) and frames the SVG's own crop: no lens solve,
no drag, no breathing, the fallback's DOM words kept over the canvas, opaque
shaded faces. The perspective pose below describes U2 and the trajectory beat.

## The fallback is the drawing, and the live pose reproduces it

⚠ **THE TWO VERSIONS ARE ONE PICTURE.** The SVG is what a headless shoot, a
handout, a phone and a reduced-motion reader get; it is not a lesser path, it
is a second implementation of the same encoding. So the CAMERA is chosen to
reproduce the static basis rather than for its own sake. Against the cabinet
oblique (`a` right, `b` back at 30° foreshortened ~0.5, `z` up), azimuth 30°
and elevation 24° project

    a → ( 0.866, −0.203)     b → ( 0.500, +0.352)     z → ( 0, +0.914)

— the same object from the same corner, with a real horizon. ⚠ **Close, not
identical**: cabinet's depth runs at a screen ratio of 1.73 and this camera's
at 1.42. Say so; a guard asserting an identity that is not there is a fiction.

⚠ **DEPTH MAPS TO THREE'S −z AT A POSITIVE AZIMUTH.** +z comes toward the
camera, so mapping depth onto it draws the record back to front — valid
geometry, no error, the wrong picture.

⚠ **THE TRI-STATE IS ON THE SECTION, AND `"live"` IS WRITTEN FROM THE FIRST
COMMITTED FRAME.** Absent = server-rendered. `"static"` = the gate refused.
A class set before there are pixels is what makes a flat-to-canvas swap pop.

## The drawing is data, not a component

A scene is a **spec** — world-space polylines, translucent faces, seeded motes
and label anchors — and ONE renderer paints it. ⚠ A component per object is how
ADR-080's lab and page drifted into two compositions with every guard green,
twice. A fifth drawing should be a builder, never a second renderer.

Build the spec from the SVG layout's own world constants, imported. A copied
constant is a second place for the record's geometry to be wrong.

## Line, face and colour

- **Five weights, one rung apart**: grid 0.85 · hidden 0.9 · tie 1 · edge 1.5 ·
  run 1.9. A donor run goes to ~2.6.
- **Decorative runs at a THIRD of structural.** The graticule at 0.08. This is
  what makes a dense set read as depth rather than as hatching.
- **Few long dashes, not many short ones.** Dashes are drawn as SEGMENTS —
  `LineDashedMaterial` renders nothing without computed line distances and
  cannot be revealed by a draw range.
- **Faces are translucent and there are THREE of them per box** — top, near,
  far side. The material is unlit with `depthWrite: false`, so six quads stack
  into a solid slab, which is the opposite of a wireframe machine.
- **Three roles, and gold buys ONE thing per drawing**: gold is the record's
  lit object and the only bloom donor, the dawn/ink ramp is every structure,
  green is the human and nothing else.
- **ALL TWELVE EDGES ARE DRAWN.** The flat drawing dashes the three hidden ones
  because it has no other way to say "far side"; here the pose does that work,
  and omitting them leaves a wireframe with holes in it when turned.
- **Density is per unit VOLUME.** A fixed mote count per object makes the
  smallest one read as the densest material — the encoded quantity again,
  backwards.
- **Seeded motes** (`mulberry32`, the drawing's own seed), never `Math.random`.

## Light is a different drawing, not a token swap

Additive blending can only lighten, so an additive accent on parchment is
invisible; dawn on parchment is one step from the ground; bloom has nothing to
lift; raw gold is ~1.2:1. Dark is a hologram, light is an ink drawing on paper.
The canvas paints THE PAGE'S OWN GROUND in both — a canvas that paints anything
else draws a rectangle across the beat.

⚠ **TEST LIGHT THROUGH THE SWITCH, NEVER BY STAMPING `data-theme`.** The GL
painters read the STORE (ADR-093), so the attribute flips the DOM and leaves
the canvas in the other palette: a black plate on parchment, which is a defect
in the harness and not on the page.

## The words are DOM, on a channel, and they drop

⚠ **NOTHING IS EVER LETTERED ON THE OBJECT** — the register's one hard law, and
the reason is measured (the Intelligence Map city, 10–13 collisions a sheet
with every containment guard green).

- Anchors are published per frame with a **stand-off direction derived from a
  second world point**, or a leader stops pointing at anything the moment the
  reader turns the object.
- ⚠ **THE CHANNEL IS PER CANVAS.** A module-scope ref is correct while one
  canvas publishes; two silently overwrite each other every frame.
- ⚠ **THE SOLVER AND THE STYLESHEET MUST SIZE ONE BOX.** Write the block's
  width from the solver's own metric. A CSS literal mirroring the clamp is a
  second place for one number to be wrong, and the failure is a lane that
  reports clean while two sentences overlap.
- ⚠ **THE DROP PASS MEASURES THE RENDERED BOX.** A nominal block height is not
  the height of a label that wraps to three lines. Measuring a model of the
  drawing rather than the drawing is this estate's most repeated defect.
- **A full board DROPS by priority; it never prints through.** Order the
  priorities by what the beat ARGUES, not by reading order — and nothing is
  lost from the page, because every string is also in the beat's own copy.
- ⚠ **A TAG LEANS OFF A FACE'S FAR EDGE**, not its centre: an object as tall as
  the label is far will otherwise wear its own name.

## Fitting, and the beat's budget

- **Solve the LENS, never the distance.** Perspective strength is
  `distance / object-depth`; at a fixed distance a fov change is a pure crop,
  and the distance is also OrbitControls' min and max.
- **Fit by the binding axis, inside gutters the chrome occupies**, and shift
  the FRUSTUM for their asymmetry so the published anchors follow for free.
- ⚠ **THE ANCHORS ARE IN THE BOUNDS.** An anchor outside them is a leader the
  lens never promised to keep on screen.
- ⚠ **THE FIGURE GROWS ONLY UNTIL THE HEAD WOULD LOSE ITS SEAT.** A band filled
  to one viewport gives the drawing the most room and is right for a beat that
  owns the screen alone (ADR-080 U3) — but under `align-content: center` it
  leaves centring no slack and the head lands on the section's padding, under
  the nav. Size the figure from the SLACK, and re-measure the HEAD, not the
  canvas.
- **Memoise the camera prop.** R3F re-applies changed camera props and will
  clobber a solved fov.

## Motion, and what it may not do

Arrival and drag only. The object may breathe, flicker and twinkle on a wall
clock (an owner ruling against ADR-021's static-instrument law) — scoped to the
object, only on screen, only while the document is visible. **No autorotate**:
a held instrument does not turn itself. **No wheel capture**: zoom off means no
wheel listener is bound, so the page scrolls over it. **Clamp both angles**,
and keep the azimuth band off the axis so the record can never be turned into a
pose it cannot be read in.

## The material since ADR-140 (2026-10-01)

Three figures live on the one stage now — the stages, the curve, the
spectrum — and the renderer grew four data-driven things. All of it is in
`components/holo-stage/`; a fourth drawing is still a BUILDER.

- **The BATCH** (`stageBatch.ts`, the Evangelion / P(doom) engine's `lines.ts`
  copied by hand, MIT): every `batch: true` line in a spec is one instanced
  draw — a capsule segment per instance, AA in physical px, widths in CSS px
  like drei's — and the shader does the draw-on from each segment's own
  reveal window. Dense structure goes here; the one or two lit DONOR runs keep
  drei's `Line`. ⚠ Depth-tested, or the dark blocks' hidden edges print
  through their opaque faces — U2's X-ray back through a material flag.
- **The SWEEP** (`StageSweep`): one gold front crossing the object along one
  world axis in a window of the intro. Batched segments and motes ahead of it
  are not drawn; at the front they glow; behind it they are there. `step`, not
  `mix` — no fade. Faces and donors seat their reveal from `sweepReaches` of
  their own position. Grouped elements are never swept.
- **Reveal GROUPS**: a line, face, strip or dust set with a `group` rides that
  group's clock, which the canvas is handed as `groups` and eases toward
  (1100 ms). The curve's second dial draws on when its button is pressed and
  folds back when pressed again. `spec.groups` names every group (≤ 4) and
  the guard fails one used and unnamed.
- **STRIPS** (`StageStrip`): a ribbon between two rails of equal length as
  one triangle strip — a sheet of the surface, the wall under a curve.
- **The FLAT view** (`view: "flat"`): for a figure whose fallback has no
  projection (the spectrum's rail). Camera on +z, world units the box's own
  px, `toFlat(x, y)`. It is not a second projection; it is the absence of one,
  and an isometric strip under a horizontal rail would be two pictures.
- **Two dust materials in one shader** (`stageDustShader.ts`): `order` 0 is
  a lattice mote (a crisp square frozen on its home), 1 a cloud mote (the soft
  dot, drifting on a seeded phase). The spectrum's one argument — software is
  deterministic, intelligence is probabilistic — is that attribute.
- **A scanline pass** (`HoloScanline.ts`): three-px lines multiplied over the
  frame at ≤ 0.12 on dark, ZERO on paper, kept mounted in both themes.
- ⚠ **Light, three findings, all one-unit rectangles**: the bloom threshold
  must sit ABOVE the paper's luminance (0.97; at 0.62 the whole ground
  bloomed by a unit), the vignette is zero on paper (0.22 darkened the edge a
  unit), and the canvas paints the PAGE's ground read at runtime from the
  host's first opaque ancestor, never only the palette's constant. Measure
  patch MEANS inside and outside the canvas; a single pixel under grain lies.
- **The spectrum's field is MEASURED off the DOM** (the band boxes, on
  resize), so the CSS that lays the rail out stays the one source.

## Verifying

Headed, with real GL — headless falls back to SwiftShader or no GL at all and
the failure mode is not an error, it is a beat that quietly renders the flat
drawing while the shoot looks fine. For the workshop's figures:
`node scripts/capture-workshop-holo.mjs --vp 1920x1080 --theme dark` (and
`--theme light`, `--vp 1280x720`, `--flat` for the handout's drawing).

At every reference shape and in both themes: the tri-state reads `"live"`, the
beat is one viewport, horizontal overflow is zero, **label collisions are
zero** (measured on rendered rects, and report WHICH pair), and the ground is
identical above, inside and below the canvas. Then disable GL and confirm the
flat drawing comes back whole.
