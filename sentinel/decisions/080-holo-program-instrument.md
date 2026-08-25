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
