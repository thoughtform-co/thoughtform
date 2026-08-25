# ADR-080: The trajectory is a held instrument

- **Status:** Accepted (2026-08-25)
- **Surface:** `/arcs/portfolio` → `#overview`, the `program` beat
- **Supersedes:** nothing. It EXTENDS ADR-078 U1 / ADR-079's board rather than
  replacing it — the flat drawing is still what most readers get, and is the
  fallback for every other reader.

## Context

ADR-078 U1 replaced the portfolio's `flywheel` with a dated board because
_"a drawing earns its place here by plotting something that HAPPENED"_. The
board is correct and it is also flat: a graticule, seven absolutely-positioned
stations and an SVG step ladder. The owner's read (2026-08-24) was that the
beat _"feels very boring"_, with a reference — `holo.ui8.dev` — and an explicit
brief: not a copy, the same PRINCIPLE, in this estate's own language.

The reference was inspected live rather than described. It is React +
`@react-three/fiber`, hand-built shaders, no library to adopt; its own
vocabulary (`trackName`, `discNumber`, `ringCount`, `tickRing`, `ringTilt`,
`leaderLines`, `gridSticks`) says the composition IS a timeline — coaxial
rings strung along one axis receding in depth, with the "rainbow" coming from
chromatic aberration smeared over a few very bright arcs, not from authored
colour.

## Decision

**The trajectory beat mounts a WebGL instrument behind its existing DOM
chrome.** Each dated waypoint is a coaxial ring on one time axis; a ring's
RADIUS is the adoption reach at its date, so the flat board's step ladder and
this drawing encode ONE curve. The seat is the single gold object. Nothing is
invented: every ring's position is the `at` the registry already pins, and
every radius is a tread the board already draws.

### What it is NOT

- **Not a metaphor.** ADR-078 rejected one here already. If the reader asks
  "what does the ring size mean", the answer is a number the page publishes.
- **Not perpetually animated.** It arrives once and is then a still drawing
  (ADR-021, ADR-078's rejected list). The demand frameloop stops at rest, and
  the film grain freezes with it because nothing resamples it.
- **Not a wheel trap, and not a second scroll writer.** `useArcScroll` stays
  the page's one writer (ADR-002); the mount's arming check is a passive
  listener that reads `scrollY`, writes nothing, and disconnects on arm.
- **Not a content change.** `lib/arcs/**` is untouched and
  `arcs-registry.test.ts` did not move.

### The seam

`.claude/rules/arcs.md` bans three.js under `components/arcs/**` and
`lib/arcs/**`. That ban is amended to bar **STATIC** imports, with exactly one
dynamic exception: `components/arcs/ArcHoloProgramMount.tsx` reaches
`components/holo-program/HoloProgramCanvas` through `next/dynamic({ssr:false})`.
`tests/lib/arcs-import-doctrine.test.ts` is the mechanical half — until now the
rule had no mechanism at all, so a stray `import * as THREE` would have passed
CI and inflated the route's First Load JS silently.

`data-holo` is a tri-state on the section: **absent** (server-rendered, no JS)
· **`"static"`** (gate refused — reduced motion, ≤960px, no WebGL, or the
canvas threw) · **`"live"`**. Only `"live"` hides the flat field, and it is
written from the scene's FIRST COMMITTED FRAME rather than from the gate
passing — a class set before there are pixels is what makes a flat→canvas swap
pop. Every failure path falls open to the drawing that shipped yesterday.

The chunk loads at IDLE, not on intersection: the beat is the first section and
is held under an opaque hero by the ADR-076 curtain, so it "intersects" from
frame one, and loading behind that curtain means the swap is invisible in a
typical session.

## What was measured, and what it corrected

- ⚠ **A RING PROJECTS TO A LINE WHERE THE CAMERA LIES IN ITS PLANE.** All seven
  ring planes are parallel, so the camera is inside exactly one of them and
  that ring renders as a bare vertical stroke. The plane sits at
  `camX·cos(yaw) − camZ·sin(yaw)`; the first cut's `camZ 7.2` put it at
  x ≈ −1.6, **mid-course**. Pulling the camera to 30 with a **4.96° lens** puts
  it at x ≈ +14.4 against a rightmost ring at 3.9. The long lens is doing three
  jobs at once — it flattens the stack into a drawing, it keeps perspective
  from outranking the radius encoding, and it is what moves that plane off the
  end of the course.
- ⚠ **THE YAW IS NEGATIVE SO NOW IS NEAREST.** `rotY` sends +x to −z, so the
  obvious positive yaw recedes the terminus and pulls 2024 forward — the record
  backing away as it reaches the present. At −0.5 the seat sits at depth 27.8
  against 2024's 32.3, and since the seat is also the widest ring, size and
  distance agree instead of fighting.
- ⚠ **POINTER AMPLITUDE IS A FRACTION OF THE FRAME, NOT AN ANGLE.** Rotating
  the rig by θ moves the picture by roughly θ/fov, so the corridor mark's
  0.05 rad — a tasteful nudge at fov 21 — swings this drawing by more than half
  its width at fov 5. Expressed as a fraction it survives a lens change.
- ⚠ **THE LAB'S STATIONS WERE NOT THE PAGE'S STATIONS, AND THAT COST A PASS.**
  The lab drew date + label; the real ones carry a NOTE. Measured on the page
  at 1280×720 the plot is 266px, the up lane runs 9 % → 38.7 % and the down
  lane 49.3 % → 74.1 %, leaving a clear middle of **10.6 % — 28 pixels**.
  Nothing that reads as a ring fits there. So the rings pass BEHIND the labels
  and the labels take the Arc caption cards' own over-WebGL `text-shadow`; a
  console can be opaque, a drawing cannot. **A harness whose chrome is simpler
  than production's is measuring a different composition.**
- ⚠ **THE CANVAS BELONGS IN `.arc-prog__plot`, NOT THE BAND.** Mounted on the
  band its ground plane ran out past the panel's own frame. The plot is the box
  whose material it replaces, the box the stations are positioned against, and
  its `overflow: hidden` is what houses the drawing for free.
- ⚠ **THE FLAT LADDER KEPT PAINTING UNDER THE 3D ONE.** The reveal ladder
  carries `.is-arc-js .arc-prog.is-in .arc-prog__curve { opacity: 1 }` at
  (0,4,0) and LATER in the sheet, so the obvious three-class hide lost the
  cascade and the beat shipped two adoption curves. The same specificity trap
  ADR-075 records for the curtain's release (0,6,1 against 0,7,1).
- ⚠ **`drawImage(webglCanvas)` RETURNS BLACK** once the frame is composited,
  without `preserveDrawingBuffer`. The obvious in-page "is anything painted"
  probe reported an empty instrument for a perfectly good drawing — and it is
  the exact failure a DOM assertion cannot see. Liveness is measured on the
  composited SCREENSHOT instead.
- **Chromatic aberration is 0.00012, not the lab's 0.0006.** The reference's
  rainbow is a faint fringe on a few very bright arcs; at lab strength, applied
  to a picture made almost entirely of hairlines, every line in the drawing
  separated into red/green/blue and the instrument read as broken.
- **A graticule's density is read against the BOX, not the world.** The grid
  that grounded the drawing in a 352px lab band compressed into hatching in the
  page's 266px field.
- ⚠ **HEADLESS CHROMIUM HAS WebGL (SwiftShader), so the smoke went LIVE on
  some runs and STATIC on others** — and the two modes have different beds for
  the contrast walk. The ink-ramp case failed once in a full parallel run and
  passed in isolation, which is the signature of a guard whose answer depends
  on a load finishing. `arc-portfolio-smoke` now disables GL for the whole
  file, pinning every case to the fallback board it was written to measure;
  the live path is gated headed by the capture script, because only a real GPU
  can tell a drawn instrument from a blank one.
- ⚠ **`.arc-band--instrument` MAY NOT TAKE `position: relative`.** An early cut
  put it there to host the canvas; the ADR-076 curtain asserts that this exact
  band returns to `position: static` when it releases, and the smoke caught it
  on both the release case and the held-still case. `.arc-prog__plot` is
  already relative and already clips, which is the other half of why the canvas
  belongs there.
- ⚠ **THE PLOT PAINTS THE INSTRUMENT'S GROUND, AND THAT IS WHAT MAKES THE
  CONTRAST WALK TRUE.** The walk resolves a bed by climbing to the first OPAQUE
  ancestor; with the plot transparent it found the PANEL's light plate and
  measured dawn ink against parchment — a pass on a pairing that does not exist
  on screen. ADR-070's finding one surface over: _the guard measured a model of
  the drawing rather than the drawing._ The ink literals are scoped to the PLOT
  and never to `.arc-prog`, because the registers and the platform foot share
  those tokens and sit outside the canvas.

## Consequences

- The arc route gains a lazily-loaded three chunk. First Load JS is unchanged
  by construction and guarded by the doctrine test.
- Reduced motion, ≤960px, no WebGL and a dead canvas all render the ADR-078
  board verbatim — so the existing smoke's chrome set, type-role split,
  station collisions, hrefs and contrast walk stay meaningful in that mode.
- **`data-arc-tall` stays absent**: the canvas is absolutely positioned, so it
  adds zero flow height and cannot disarm the ADR-076 curtain. Verified live.
- The plate is a kept-dark LITERAL in both themes (ADR-058 Lane 0, the film
  stills' own call), and the station inks under `[data-holo="live"]` are
  literals for the same reason — light-theme `--arc-ink-*` re-derives toward
  dark-on-parchment and would vanish on it.

## Update 2 (2026-08-25, owner) — the housing comes off, and U1 lands on the page

> "give the timeline 3D thing more breathing room; like the demo you made
> earlier really had a lot of breathing room, but AS I ASKED BEFORE I do not
> want the 3D object to be surrounded by a fucking frame it really needs to be
> free"

### What was actually wrong: U1 shipped in the lab only

ADR-080 U1's commit says the object is free, the reader turns it, and "the
labels track IT (holoAnchorsRef projects seven anchors per frame and the DOM
follows)". Its file list is `components/holo-program/**`,
`/test/holo-program-lab/**`, its capture script and its geom test —
**nothing under `components/arcs/**`or`arcs.css`.** So every claim in it was
true at `/test/holo-program-lab`and false on`/arcs/portfolio`, where the
beat still had round one's presentation:

- the flat board's **panel around the drawing** — a hairline border, a
  chamfered clip, a plate ground, a rule under the header, a rule over the
  platform track and six ruled register cells;
- a **1014 × 266 window** at 1280 × 720 (430 at 1920 × 1247), 37 % of a beat
  that owns a whole screen;
- `pointer-events: none` on the canvas host, so **no pointerdown ever reached
  `OrbitControls`** and the object could not be turned;
- and the ink literals U1 obsoleted, which is a defect it CAUSED: the plot was
  painted a kept-dark `#0d0b08` with dawn ink forced over it, correct while the
  drawing was kept-dark. U1 gave the object a real light drawing, and this beat
  then printed **cream station labels inside black halos over a light drawing
  on parchment.** Measured on the live page at 1920 × 1247.

⚠ **A CLAIM IN A COMMIT MESSAGE IS ABOUT THE FILES IN IT.** Nothing failed:
the lab captures were correct, the guards ran against the lab, and the page's
own smoke runs with WebGL OFF by design, so it measures the FALLBACK board and
could not see any of this.

### The decision

**In live mode the panel stops being a panel.** Every word of the chrome stays
— the header pair, the stations, the priors and adoption labels, the platform
track, the six registers — and the box drawn around it goes. That is the
reference boards' own grammar, the one this ADR cites: metadata anchored at a
field's corners and edges, framing nothing.

- `border-color: transparent`, `background: none`, `clip-path: none`, and the
  same on every internal rule and divider. ⚠ **Colours, not `border: 0`** —
  zeroing the widths moves every row a pixel per rule and re-flows the beat
  against its one-viewport budget.
- ⚠ **THE CLIP HAD TO GO WITH THE BORDER.** `clip-path` cuts descendants, so a
  surviving chamfer would re-cut the drawing's corners at the panel edge — a
  frame in the one place nothing declares a border.
- `.arc-prog__plot` stops clipping. Its `overflow: hidden` was "what houses the
  drawing instead of letting a ground plane run out past the panel's own
  frame", which was true while there WAS a frame. With none, a ground plane
  running off the page is what a free object looks like — it is what the lab's
  `full` preset shows, and that preset is the drawing the owner approved.
- The canvas **bleeds to the band's border box**, and the ruler is `display:
none` rather than `opacity: 0` (it is 7px of FLOW, and flow height is the one
  currency this beat spends).
- `--pg-h` goes from `clamp(250px, 37svh, 430px)` to `clamp(300px, 46svh,
660px)`: **266 → 331 at 1280 × 720, 296 → 368 at 1440 × 800, 430 → 574 at
  1920 × 1247.** ⚠ Capped by the CURTAIN, not by taste — the beat must stay
  under one viewport or `data-arc-tall` disarms the ADR-076 seam. At 1280 × 720
  it had 71px of slack plus the ruler's 7, and 46svh spends 65 of that 78.

### The ground was the other half of the frame

⚠ **A CANVAS THAT DOES NOT PAINT THE PAGE'S GROUND DRAWS A RECTANGLE.**
`HOLO_DARK.ground` was `#0d0c0a`, three steps off `.arc-section`'s `#0a0908` —
invisible as a colour, perfectly visible as an edge. It is `--void` now, and
the light column already made this call for its own reasons ("so the artifact
sits flush on the paper instead of as a panel pasted onto it").

⚠ **AND THE VIGNETTE WAS THE FRAME AFTER THAT.** At full strength the pass put
the canvas's corners at `rgb(5,4,4)` and its edge midpoints at `rgb(8,7,6)`
against a ground of `rgb(10,9,8)`. Inside a panel that reads as the edge of a
lit volume; with straight edges against the page itself it is a dark rectangle
the width of the beat. `vignetteScale` 1 → **0.3**, at which every sample above
and below the canvas's edge measures `10,9,8` exactly.

The plot's kept-dark bed and its ink literals are both DELETED. The contrast
walk climbs to `.arc-section`'s own ground and the canvas paints exactly that,
so the walk's answer and the screen agree by construction — ADR-070's standing
rule, and the reason `holo-program-geom.test.ts` now pins both grounds and
`HOLO_PLATE` against them.

### What was built, measured and rejected: tracked labels

U1's own grammar was ported to the page and then taken out again. Seven
coaxial rims seen near-axially project into **~500px**, and seven blocks of
140–172px carrying a date, a name AND a note need three times that: every
label printed through its neighbours at all three reference shapes, in both
themes. The lab gets away with it on **two-line** labels at 760px of height;
this beat has 331 at 1280 × 720 and may not drop the note, which is the
trajectory's connective tissue (ADR-079). The course stays a dated row. If
tracking returns it needs leader lines from a fixed row to the live rims — the
reference's own `leaderLines`, and its own pass.

### The drag, and the frame it brought back

`pointer-events` moves to `auto` on `.arc-holo[data-live]` only (an empty
transparent host at `opacity: 0` still hit-tests, and with the bleed that
would be a band-wide pointer sink), and `.arc-prog__stns` goes transparent to
the pointer with its own anchors taking it back. Verified live: a drag turns
the object, the wheel still scrolls the page 600px over it, and every station
still hit-tests to its own chapter link.

⚠ **AND A DRAG SELECTS THE COPY IT PASSES OVER.** Every station label came out
of a turn wearing a hard-edged `--gold-30` **selection plate**, exactly its own
text box — seven frames, arriving the moment the reader used the affordance
this pass added. Found by pixel-scanning a label row before and after a drag:
`rgba(202,165,84,.3)` over `#0a0908` is `rgb(68,56,31)` to the unit, which is
what named it. ⚠ Three compositing "cures" were tried first (`will-change:
opacity`, a `.999` opacity layer, a `translateZ(0)` on the station) and all
three measured **byte-identical** — a screenshot that looks like an
antialiasing artifact is worth one arithmetic identity before it is worth a
layer hint. `user-select: none`, scoped to the PLOT so the prose and figures
outside it stay copyable.

### Verified

All three reference shapes × both themes, headed: `data-holo="live"`,
`data-arc-tall` absent, **zero horizontal overflow** (⚠ the first bleed negated
`--band-margin` while the instrument tier's padding reads `--instrument-margin`
first — 120px wider per side at 1920, a 2152px canvas in a 1914px page), zero
station collisions, and the ground identical above, inside and below the
canvas. `npm run verify` green (1067 tests), `arc-portfolio-smoke` green
(22 passed — it runs with GL off and measures the fallback board, which is
byte-identical).

## Update 3 (2026-08-25, owner) — the artifact fills the beat, and the labels find their rings

> "That timeline visualization … is so condensed in the middle, since we have
> all that horizontal real estate. Really make those labels bigger. They're not
> even mapped onto the rings, probably because it's so cropped. Really make it
> bigger, and that 3D artifact of the timelines, make it bigger, make it wider."

### Why it was small, and it was one line of arithmetic

Three's `fov` is a **VERTICAL** field of view, and **nothing in
`components/holo-program/**`read the canvas** — the folder's only`viewport`use was`dustMat.uniforms.uPixelRatio`. So visible height at the target was a
constant `2·D·tan(fov/2)` and visible width was that times the aspect: at
1914 × 574 the record filled **23.9 % of the width and 40.6 % of the height**,
and every pixel of width ADR-080 U2 had just won was empty world **by
construction**. The seven DOM anchors spanned **377px of 1914**, which is the
whole of "they're not even mapped onto the rings" — a label row and a drawing
that never shared a coordinate.

### The beat, by remainder

The chrome — the header line, the priors/adoption pair, the platform track and
the six registers — leaves flow and floats on the drawing. `--pg-h` is deleted
in live mode; the plot is the **`1fr` remainder** of a box that is exactly one
viewport less its own padding.

⚠ **NOT A BIGGER CLAMP.** The old value was hand-sized against a budget with a
comment saying that raising it meant re-measuring three viewports — a guard
that lives in prose. A remainder cannot exceed a screen at any size, so
`data-arc-tall` cannot be tripped by a future edit, and it survives a head that
reflows. Measured: **331 → 528 at 1280 × 720, 368 → 598 at 1440 × 800,
574 → 941 at 1920 × 1247**, the last reclaiming ~169px the centred band was
leaving as air.

⚠ **AND THERE WAS A SPECIFICITY WAR, ON ONE PROPERTY.** `grid-template-rows` is
safe; `align-content` is not — the ADR-076 curtain's own base rule
`.arc-root[data-arc-curtain] .arc-hero + .arc-section` declares `center` at
**(0,4,0)** and outranks a plain `.arc-sec--prog[data-holo="live"]` at (0,2,0).
Measured: the band stayed 644px in a 1110px box and the drawing came out at 474
instead of 941. The stretch is declared twice, once inside the curtain's own
selector.

⚠ **`z-index: 2` ON THE FLOATED CHROME IS LOAD-BEARING.** DOM order is
hd → plot → ft → reg, and positioned elements at `z-index: auto` paint in DOM
order — an absolutely-positioned header would paint BEFORE the plot and the
canvas would cover it. ⚠ All of it is `pointer-events: none`, or the chrome
puts a dead band across the object the reader is turning. ⚠ `user-select`
widens from the plot to the whole panel, which **knowingly reverses U2's
scoping**: those figures no longer "sit outside" the drag surface, and
selection is a layout question that `pointer-events: none` does not touch. The
cost is that the six register figures stop being copyable.

### The lens is solved from the canvas

`solveHoloFit(w, h)` fits the record by its **binding axis** inside gutters
reserved for the chrome, and returns a frustum offset for their asymmetry (one
header row above, four rows below). ADR-070's elastic crop, one surface over.

⚠ **SOLVE THE LENS, NEVER THE DISTANCE.** Perspective strength is
`distance / object-depth`, not fov — at a fixed 15.6 against a 5.1-deep object
a fov change is a pure crop and the near/far size ratio is bit-identical. Every
word of `CAM_DISTANCE`'s own comment is a distance argument, and it is also
OrbitControls' `minDistance`/`maxDistance`.

⚠ **THE FIT INCLUDES THE MARK'S PLATED COLLAR** (world radius 2.043 against the
widest ring's 1.18), which costs ~40 % of the available size. Bought
deliberately: the collar is the one fully closed, unbroken ring in the object,
and cropping its top and bottom is cropping the centre of the drawing. The
record's half-tangent aspect is 1.396 because of it, not the rings' own 1.96.

⚠ **`REST_AZIMUTH` STAYS −54°.** Swinging to −70° buys 6 % of width and pays
42 % of ring openness (`|cos θ|·cos ε`: 0.556 → 0.323) — walking back toward
the pose this ADR rejected at 18°. The width came from the layout instead.

⚠ **THE `camera` PROP HAD TO BE MEMOISED.** R3F re-applies changed camera
props, so a fresh object literal on every render silently reverts the solved
fov to the constant.

### `frontness` had never worked

⚠ **ALL SEVEN ANCHORS RETURNED 0.25, ALWAYS.** With `near 0.1 / far 60` the
object lives in the last half-percent of the NDC depth range: `ndc.z` runs
0.9888 → 0.9914 at the anchors' depths, so `clamp01(1 − depthT·1.35)` was
exactly 0. The documented "a ring behind the core dims its own label" grammar
had not run once, and the lab's z-order was a constant 25 — for as long as the
lab has existed. `frontnessFromDepth` bands the REAL camera-space distance
against the object's own half-depth, which no clip-plane change can break, and
it is unit-pinned by a spread assertion rather than by a value.

### Tracked labels — the rejection is superseded by a changed premise

U2 built these and rejected them on arithmetic: seven three-line blocks against
a 377px spread. **Both terms moved.** The spread roughly tripled, and the
one-sentence `note` becomes a hover (`opacity: 0`, never `display: none` — it
stays in the a11y tree, in `textContent` and in a computed font, so a prose
walk still finds all eight), which makes a block two lines.

- `holoLabelLayout.ts` is pure and three-free, so the page, the lab and a unit
  test call one function.
- ⚠ **THE DECLUTTER IS A MECHANISM, NOT A SAFETY NET.** At 1280 × 720 the
  tightest same-lane pitch is ~155px against a 147px block and `anchorAngle`'s
  lean moves an anchor ±17px — two labels genuinely overlap at rest.
- ⚠ **THE ANCHOR PUBLISHES A RIM NORMAL** (`nx`/`ny`). Without it a tie-line
  stops pointing at anything the moment the object turns: the lab's is a fixed
  1px × 16px vertical stub, correct at the rest pose and meaningless at every
  other.
- ⚠ **THE WHOLE TRANSFORM IS WRITTEN IN JS, CENTRING INCLUDED.** The lab writes
  a translate on the same element whose CSS declares `translate3d(-50%,0,0)`,
  and the inline write REPLACES it — so every lab label hangs by its left edge
  and only the margin half of the offset survives.
- Type up: name `clamp(9.5px,.82vw,10.5px)` → `clamp(12.5px,1.1vw,17px)`
  (+34 % at 1280, +62 % at 1920); date to `clamp(10px,.86vw,13px)`.

### Rotation

Azimuth was **unbounded**, so a drag could reach both poses this file's own
constants were moved off. It is `REST_AZIMUTH ± 18°` = **[−72°, −36°]**, chosen
on ring openness (0.765 and 0.292 against 0.556 at rest) rather than on travel,
and strictly negative so the "dates run backwards" pose is unreachable rather
than merely avoided. ⚠ **The first cut at ±60° was wrong by arithmetic** — from
−54° that reaches **+6°**, past the axis into both failures at once.
`rotateSpeed` 0.55 → **0.22**: three's `rotateLeft` is
`2π·dx/clientHeight·rotateSpeed`, so at 0.55 on a ~530px canvas a 500px drag
sweeps 187° and the reader would hit the clamp in the first few pixels.

### Verified

All three reference shapes × both themes, headed: live, `data-arc-tall` absent,
zero horizontal overflow, zero label collisions. `npm run verify` green (1125
tests). `arc-portfolio-smoke` green — ⚠ and it **cannot see any of this**: it
runs with WebGL disabled and measures the fallback board, which is
byte-identical by construction because `ArcProgramCourse` renders the same JSX
in both modes.

### Left open from this pass

- **The lab still renders the wrong shape.** Its presets are 1440 × 760 /
  1160 × 560 / 1020 × 266; production is now ~1914 × 941. The framing law is
  aspect-driven, so a lab at the wrong aspect solves the wrong lens — the same
  class of error this ADR has recorded twice. It also still carries the
  transform collision above.
- **`tests/lib/arcs-import-doctrine.test.ts`'s `HOLO_FREE` branch is an
  `else if … continue` with no assertion**, so a static
  `import … from "@/components/holo-program/HoloProgramScene"` inside
  `components/arcs/**` would pass CI and drag three into the route's First
  Load JS. This pass added three-free imports there and did not harden it.

## Left open

- **The rings pass behind the station notes.** ADR-078 moved the flat adoption
  curve OUT from behind the stations because _"drawn under them it crossed
  every note"_. This is the same geometry with two differences — the line work
  is dim and BEHIND, and the type is lifted by the Arc's own text-shadow — but
  it is an owner call, not an arithmetic one, and it is named here rather than
  buried. The alternatives are smaller rings or shorter notes.
- The 1280×720 field is the tightest; 1440 and 1920 give the stack more air.
- The lab (`/test/holo-program-lab`) was corrected in this same pass — it now
  uses the measured PLOT boxes (1020×266 / 1149×296 / 1438×400) and renders the
  real three-line station, and its readout asks the question that can still go
  wrong silently (a rim clipped by `overflow: hidden` looks exactly like a
  smaller ring) rather than the one that cannot (station collisions, which are
  now by construction).
- `.arc-prog__stn-hit` remains a real anchor over the canvas; the capture
  script hit-tests all five with `elementFromPoint` on every run.

## Verifying

```bash
npx vitest run tests/lib/holo-program-geom.test.ts tests/lib/arcs-import-doctrine.test.ts
node scripts/capture-holo-program.mjs                      # the lab matrix, headed
node scripts/capture-arc-portfolio.mjs --holo --only overview --vp 1280x720
```

⚠ Both capture scripts run **HEADED**. Headless Chromium falls back to
SwiftShader or no GL at all, and the failure mode is not an error — it is a
beat that quietly falls back to the flat board and a shoot that looks fine.
