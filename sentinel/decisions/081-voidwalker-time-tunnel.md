# ADR-081: The through-line travels the Z axis

**Status:** Accepted (2026-08-25)
**Supersedes:** ADR-074 **on composition only** — its record, its content
laws, its drawings and its cover-role reasoning all still bind, and its
vertical timeline is now the FALLBACK rather than the surface.
**Flag:** `VOIDWALKER_TIME_TUNNEL` (`unifiedServicesInstrument.ts`)

## The complaint

The career through-line was a 2D vertical scroll: nine beats alternating
around a centred gold spine, ~4.4k px of document after the pinned `#about`
deck. The owner's reading, in his own words: a vertical scroll _"doesn't
really fit our design language"_ on a site that travels the Z axis
everywhere else — the corridor, the Arc, the exit dive. And the date
placement on the spine chip was _"really ugly"_.

Two problems, one answer. The site already knows how to fly.

## The decision

**Past `#about` the reader falls into the brandmark parked at the end of
the corridor, a wormhole opens, and the nine beats fly at them
newest-first while the years count backwards on a graduated axis.**

Three things make it a record rather than an effect:

1. **The date grammar is A4 — the graduated axis** (the owner's pick from
   the look-dev sheet). One tick per year between the newest beat and the
   oldest, majors where the record lands, and a marker measured **in
   years, not in scroll**. The gaps between beats become elapsed time you
   can see. This is ADR-078's _"a record plots, it does not list"_, one
   surface later.
2. **The tunnel IS that axis.** One gold ring per year flies past the
   camera, on the same measure the DOM axis draws. The graduation is
   drawn twice, from one source, so the two cannot disagree.
3. **The ordinal is deleted.** On a graduated axis the year IS the
   position, so `//03` restated it — the ruling ADR-066 took for the
   casefile, arriving here.

## Architecture: an extension, not a new canvas

**There is no second WebGL context.** The corridor's R3F canvas already
survives `#about` as a fixed full-viewport backdrop (the services ambient
hold), and `#voidwalker` was the station that KILLED it. The travel
extends that hold and moves the kill one station down to `#practice`.

The beats stay **real DOM on CSS 3D** over that canvas. The alternative —
baking nine typographic plates into WebGL — was rejected because the film
interlude is a live `<button>` into a CSP-pinned player, three press bars
are real links, and every record guard walks rendered DOM text. One
content tree in two presentation modes; the wrappers are
`display: contents` until the mode flips.

### The one number that makes it one space

`travelPerspectivePx(vh, aspect)` derives the CSS `perspective` from the
SCENE CAMERA'S OWN FOV: `P = (H/2) / tan(θ/2)`. A DOM plane at
`translateZ` then projects exactly as the same geometry would in the
canvas behind it. Two layers with different projections read as a sticker
over a video; this is what prevents it.

⚠ `sceneGeom.ts` imports THREE, so the clock cannot import it — the FOV is
MIRRORED in the three-free clock and **pinned equal by the unit test**.

## What the measurements corrected

- **`VW_TRAVEL_SPAN` must exceed 2, and "> 1" is the trap.** A neighbour
  sits 1.0 stop away and the flight only begins outside the park, so the
  reach is `SPAN/2 − PARK/2`. At 1.72 the next beat was pinned at −1
  (invisible) the moment the current one parked — the field was a
  slideshow of one card at a time. 3.8 puts a neighbour at t ≈ −0.46.
- **The foot is sized by the flight, not by eye.** Below ~0.11 the last
  beat was still on screen at `p = 1`, stranded at a couple of percent
  opacity over the foot.
- **Depth on a flat layer is carried by FOCUS, not opacity.** Measured on
  the first live capture: a receding beat at 24 % and half scale stayed
  legible under a pixel of blur, so it read as two paragraphs printed over
  each other. The blur ramp now saturates by |t| 0.55.
- **The subgrid had to be torn down, not re-placed.** `.vw-beat` is
  `grid-template-columns: subgrid`; with `.vw` no longer a grid it
  collapsed to one column, and children still asking for `grid-column: 3`
  CREATED two implicit columns — silently squeezing every plate to a third
  of its width.
- **`data-vw-ready` gates the whole motion block.** The travel hook did not
  write it, so every `--vw-b` it wrote was inert AND the masthead's decode
  ghost stayed painted over the field. Caught by the light-theme capture.
- ⚠ **The wall shader's wrap pinned the tunnel to the camera.** Adding
  `uCamZ` to the point's own phase before wrapping resolves straight back
  to `uCamZ + p.z`: geometrically perfect, and completely frozen. The
  reader flew twenty-six units and the walls never moved.
- **The year rings' spacing is DERIVED** (`26 / 12 ≈ 2.2`), or the rings
  slide against the walls like a separate object.
- ⚠ **`colorScheme` does not flip this site.** The theme is an explicit
  pre-paint attribute from `?theme=`, so a context-level colour scheme
  captures dark twice and reports a light pass that never happened.

## The seam, and its lockstep

`useCorridorExitScroll`'s `nextStation` and `home-v2.css`'s cover rule name
the SAME station under the SAME flag — the ADR-030 §6 bug, recorded a
fifth time. `#voidwalker` keeps its opaque cover rule for every path where
the tunnel does not engage; the travel-mode transparency and its
fail-opaque `--vw-bg-in` shield are gated on the mode attribute, so the two
can never both apply.

## Fallback

Flag-off · mobile · tablet · reduced-motion · no-WebGL · a JS failure
mid-travel — all land on the ADR-074 vertical timeline, fully lit, on an
opaque station, **with zero runway height** (the runway is mode-gated, so
no path inherits fourteen viewports of dead scroll). Verified at 390, 900
and 1440-with-PRM.

The two writers are the same boolean and its negation, so `--vw-b` can
never have two writers.

## Verification

- `tests/lib/voidwalker-travel-clock.test.ts` — 27 cases: monotonicity,
  park coverage, ≤3 stops painting, the FOV mirror, the perspective
  identity, and the CSS↔constant runway pairing read off the sheet.
- `scripts/capture-voidwalker-travel.mjs` — the real landing, real
  scrolls, every stop at its park. Gates: mode engaged · runway inflated ·
  **ambient alive at every stop** · a parked beat that fits the viewport ·
  ≤3 painting · perspective present · no page errors. PASS at 1280×720,
  1440×800, 1920×1080-class and the owner's 1920×1247, dark and light.
- `services-ring-smoke`'s ambient case retargeted: it now asserts the
  canvas SURVIVES the travel and dies under `#practice`.
- Full `npm run verify` green (1064 unit tests), production build clean.

## Update 1 (2026-08-25, owner red alert) — the camera claim is POSITIONAL

The corridor lost its brandmark, its substrate sphere and the Arc's
notation the moment this shipped. Reported as "the sphere in our arc is
gone, and also the diagrams around our brand mark".

`useVoidwalkerTravelScroll` set `vwTravelRef.engaged = true` on every tick
as soon as the path was CAPABLE, rather than when the reader was inside
the runway — so it was true from the first paint. `FlyingCameraRig` takes
an early return on that flag and parks the camera at the tunnel mouth, so
for the whole page the corridor ran its own DOM beats (station titles,
caption cards, the HUD) while everything the camera was supposed to be
looking at sat off-frame.

⚠ **`p` CANNOT CARRY THIS.** It clamps to 0 both before the runway and at
its first pixel, so "parked at the mouth" and "a whole page above it" are
the same number. The gate is the rect: `r.top <= 0 && r.bottom > 0`. Every
consumer wanted the positional reading anyway — the camera, the quality
governor's engagement sample, the frame pump and the tunnel painter all
mean "is the reader flying right now".

⚠ **THE ENTIRE SUITE STAYED GREEN**, because nothing threw, no asset
404'd and the scene graph was intact — it simply was not being looked at.
Structural assertions cannot see this. The guard added with the fix is
therefore the SYMPTOM: `landing-corridor-smoke` walks to the Arc and
asserts the viewport is painting something substantial (frame weight —
measured 77 kB with the bug against 292 kB without). It was verified to
FAIL against the bug before being kept.

⚠ Two smoke tests were already failing when this update was written —
`landing-corridor-smoke`'s "dock attribute releases on reverse scroll" and
`services-ring-smoke`'s "the ambient dies under the next opaque station".
Both were confirmed failing at the ADR-081 commit itself, independent of
this fix, and are NOT addressed here.

## Update 2 (2026-08-25, owner) — one clock, a real path, and the rail is the axis

The owner's read on the shipped tunnel: it _"still hasn't been
implemented the way I wanted"_ — not buttery, the cards do not fly in
alternating the way the reference does (`showcase.noomoagency.com`), and
the bespoke year axis _"doesn't make sense"_ beside a rail the frame
already has. He also asked what a second 3D scene would cost.

**A second WebGL context is the wrong tool, and not for performance
reasons.** The gesture is a continuous camera move THROUGH an object
that lives in the corridor's scene, so a second canvas cannot show it and
the entry degrades into a crossfade between two canvases — the "sticker
over a video" problem one level up. There is also no bundle saving:
three arrives with the corridor long before this beat. §Architecture
stands unamended.

### The cards and the tunnel were on different clocks

`FlyingCameraRig` flew the motion follower's damped `voidTravel` channel
while `useVoidwalkerTravelScroll` wrote every beat's depth from RAW
scroll in its own rAF. The two layers shared a PROJECTION — U1's whole
`travelPerspectivePx` derivation — and did not share a CLOCK, so on any
real scroll the cards snapped with the wheel while the walls glided
behind them. Both halves were individually correct and no guard could
see it.

The hook owns one damped value now (`travelChase`, the follower's own
0.18 s constant) and the DOM, the camera and the tunnel all read it.
⚠ **The follower's channel is DELETED rather than pinned equal to it.**
A time constant needs no cross-THREE copy the way `CAMERA_FOV` does, and
a dead damped channel that still looks authoritative is how the second
clock comes back. ⚠ The chase also outlives the scroll EVENT, or the
field freezes part-way while the tunnel keeps moving.

### The alternation was arithmetically invisible in flight

A beat was offset a flat `±7%` of its own 680px box — about 48px — and
then projected. At `VW_Z_FAR` the projected scale is ~0.31, so those
48px arrived on screen as **fifteen**: every beat flew at the reader dead
centre and its side only appeared once it had already parked.

**The path is authored in SCREEN FRACTIONS and un-projected through each
beat's own depth** (`beatScreenXFrac` / `beatScreenYFrac` /
`beatRotDeg`, `beatDepthUnproject`), so what is written is what lands, at
every viewport. Beats enter from their own side wall, cross on the
vertical, converge flat at the reading plane and are thrown wide as they
pass. ⚠ The side is still the record's `data-side`, read by the hook —
never a `:nth-child` parity, because the film interlude sits in the same
list. The interlude has no side and flies straight down the axis.

### Slim in flight, full on park (owner)

What flies is the year, the title and the housing. The paragraph, the
drawing and the press bar power on as the beat settles and go as it
leaves. ⚠ **The ladder is re-sourced, not re-authored**: the panels keep
their `--ci-off` rungs and the same three ramps, and only `--ci` is
renormalised past a new `--vw-d` that PEAKS at the park instead of
`--vw-b`, which holds once lit. Custom properties resolve at
computed-value time, so one declaration carries it and the internal
stagger survives. `.vw-wire` goes `content-visibility: hidden` in flight
— free of layout because it is `position: absolute; inset: 0`, which is
also why the gate is not on `.vw-plate__frame`, whose height IS its
content.

### Two mechanical costs, both measurable

- **`filter` was not in `will-change` while the blur radius changed every
  frame** — so a 680px card carrying an SVG re-rasterised each frame,
  three at a time, exactly during the fastest motion. The radius is
  quantised to half-pixel steps (invisible at flight speed) and `filter`
  is named.
- **`data-vw-far` was `display: none`**, which re-ran layout at every
  stop transition. `content-visibility` + `visibility` drop the same work
  and keep the box.

### The left rail is the time axis

The owner: _"we have a lift rail, so this is a nice opportunity to use it
to map the actual dates."_ U1's `.vw-axis` — a second graduated axis in
the gutter — is DELETED.

⚠ **AND THE LADDER ALREADY IS THIS RECORD'S AXIS, EXACTLY.** The rail's
thirteen ticks are twelve intervals and 2026 → 2014 is twelve years, so
every year the record lands on seats on an INTEGER RUNG: 2025 on tick 1,
2022 on 4, 2020 on 6, 2018 on 8, 2016 on 10, 2014 on the terminus.
Nothing is added to the ladder and nothing taken from it (ADR-031's
guardrail holds by arithmetic rather than by care). It is a coincidence
OF THE RECORD, not a law, and the unit test pins the twelve-year span so
a beat outside it fails loudly instead of sliding every label off the
rungs; the placement itself stays proportional.

The journey diamond and the bearing numerals hand over while the reader
is flying — one gold mark on the rail at a time. ⚠ **The gate is
POSITIONAL**, scoped with `:has` to a rail holding a running car:
`data-vw-mode` is set as soon as the path is CAPABLE, so a rail keyed on
the mode would letter years for the whole document and fade the diamond
on the hero. That is U1's defect, and it is this easy to write twice.

⚠ **The rung the car is on goes gold; there is no second readout.** A
year lettered beside the car printed the same year a few pixels from the
rail's own label for it, overlapping at every rung. On a graduated axis
the year IS the position.

### Four defects the measurements found

- ⚠ **THE CAMERA HANDOFF WAS NOT AN IDENTITY.** The source comment and
  this ADR both claimed the tunnel takes the camera with no pop, and
  **no such test existed**. The POSITION matched; the GAZE did not,
  jumping 5.2 world units — a **~16° pitch snap** at the exact frame the
  reader crosses into the runway. The gaze is blended on the entry dive
  now, so the dive is the camera levelling out as it passes through the
  mark. Both halves are pinned.
- ⚠ **THE AXIS LETTERED YEARS THE RECORD NEVER PRINTS.** Two beats carry
  fractional `sortYear`s purely to order them inside a year they SHARE
  (2018.9, 2016.8); rounded, the readout lettered **2019** and **2017**
  beside parked cards reading 2018 and 2016, and seated the marker
  between its own rungs. `wholeYears` floors at the source, so the
  readout, the marker, the labels and the ring cadence are handed the
  same numbers.
- ⚠ **THE BEAT LEAVING WAS THE SAME WEIGHT AS THE BEAT ARRIVING.** At the
  midpoint between two stops the departing beat sat at 0.92 opacity under
  0.84px of blur while the arriving one sat at 0.91 and 0.84 — this ADR's
  own "two paragraphs printed over each other", fixed on the far side and
  never measured at small `|t|`, because every capture mark landed on a
  PARK where a beat is centred and flat by construction. Both ramps are
  asymmetric now (`FOG_OUT` 0.72 → 0.32; `BLUR_REACH` splits IN 0.55 /
  OUT 0.30): 0.46 and 3.0px against 0.91 and 0.84. The reader is looking
  at what is COMING.
- ⚠ **THE MASTHEAD PRINTED ACROSS THE FIRST PARKED BEAT, IN LIGHT ONLY.**
  Two causes, stacked. It disarmed at `1.24 × ENTRY` — after the first
  beat parks — so the un-type was still running over it; that is now the
  dive's own end, the un-type is unstaggered (a clear, not a reveal), and
  **the exit is a POSITION, not a duration**: past the dive the jobs are
  force-settled, because a time-based scramble and a scroll-based runway
  can always desync. And `html[data-theme="light"] .vw-head__lede em` at
  (0,2,2) outranks `.vw-decode__ghost em` at (0,2,1), so the GHOST — the
  layer that survives the un-type, and which must paint nothing — was
  painted gold. theme.css re-asserts transparency at matched specificity,
  later in the cascade.

### The tunnel warms its shaders

three never compiles a material for an object it has not drawn, and the
tunnel's group is invisible for the whole page before the travel — so the
first frame of the dive was also compiling two point shaders, at the
moment the camera moves fastest. `vwTravel.near` (a rect reading, two
viewports out) draws it once at zero alpha. Nothing else is deferred: the
geometry is ~1,500 points and costs nothing while invisible, so a
mount/unmount lifecycle would have been ceremony.

### Verification

- `tests/lib/voidwalker-travel-clock.test.ts` — **27 → 52 cases**: the
  chase (convergence, the one-tau property accumulated over real frames
  since a single delta is clamped, the teleport snap, the long-frame
  clamp), the flight path (the un-projection round trip, a REGRESSION PIN
  on the old flat offset, convergence to the park, the crossed axes,
  monotonicity), the detail gate (including _the record never outshines
  the card carrying it_), the asymmetry, the camera identity, and the
  ladder seating.
- `scripts/capture-voidwalker-travel.mjs` — a `before` mark ABOVE the
  runway (the only one that can prove a positional gate), two MID-FLIGHT
  marks (a run made only of parks cannot show the flight), a live
  **damping probe** that fails if depth is final on the scroll frame, an
  **equal-weight overlap** gate over every intersecting pair of painting
  beats, the masthead's character count, the ghost's computed ink, and
  the rail's car/rung/diamond.
- PASS at 1280×720, 1440×800 and the owner's 1920×1247, dark and light.
  1128 unit tests green.

⚠ **Still open:** the masthead and the first beat share the centre for
about half a viewport of runway while the beat is still arriving and
blurred. Closing that is a COMPOSITION change (the stops would need a
lead-in band of their own), and it belongs with the flight-grammar lab
rather than here.

## Left open

- The press artifacts and the scanline treatment are still the look-dev
  sheet's open questions (T1–T4 + the theme call) — deliberately not
  bundled into this pass.
- The journey glyph still draws a vertical spine. It is honest for the
  fallback and cosmetic for the travel; a redraw is its own small pass.
- The FLIGHT GRAMMAR itself is a look-dev pass, not a tuning job: how far
  a card swings, whether it flies inside a drawn housing, whether the
  field reads as populated rather than one card at a time. U2 fixed what
  was broken; what it should LOOK like is the owner's pick off a lab.
- The tunnel's wall density is tuned against software rendering in
  capture. Worth a look on a real GPU before it is called final.
