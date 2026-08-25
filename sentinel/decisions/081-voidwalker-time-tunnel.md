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

## Update 4 (2026-08-25, owner) — the flight-grammar lab and the structural shed

Two pieces of work that U2 named as leftovers, closed together.

### The flight-grammar lab

The look-dev harness U2's §Left open asked for. Lives at
`/test/voidwalker-flight-lab` (blocked in production by `proxy.ts`),
mounts the production `LandingPage` verbatim, and overlays a lever
panel that mutates a new `voidwalkerFlightConfig.ts` module. Every
tunable value in the clock — `span`, `tauSeconds`, `runwaySvh`, the
`xPark`/`xFar`/`xNear` swing anchors, `yFar`/`yNear`, `rotMax`,
`rollMax`, `curveBend`, `blurMax`, `fogIn`/`fogOut`, the blur reaches,
the detail gates, `wallDensityMul`, `entryReactionStrength`,
`velocityStrength`, and the `pathVariant` — resolves through
`getVwFlightConfig()` at call time. Production never mutates the
config, so the resolved values equal the shipped constants
byte-for-byte and a same-viewport capture of `/` matches a
`V1-default` capture of the lab.

⚠ **The lab is a WINDOW ONTO PRODUCTION, not a copy.** It renders the
same `LandingPage`, imports the same CSS chain, calls the same
`getV7Content` / `extractV7Text` / `getCelestialSlotsCached` the
marketing page does. If the two ever diverge at defaults, that IS the
bug — the substrate lab's own ruling one surface later.

### Three path variants (`VwPathVariant`)

- `linear` — the ADR-081 U2 straight-lerp swing (production).
- `curved` — a smooth bow through the anchors + bank on entry, the
  Noomo/`showcase.noomoagency.com` reference the owner named. New
  `beatRollDeg` and a `smoothBell(t) = sin(π·|t|)` (0 at 0 and ±1,
  peaks at ±0.5) additive term on `beatScreenXFrac`.
- `housed` — same swing as `curved` plus a drawn housing frame that
  powers on with `beatDetail` (`beatHousingOpacity`), so the frame
  arrives dim and lands on the same event the paragraph does.

### The scroll-velocity channel

The hook computes an EMA-smoothed derivative of `flight` (τ = 0.24 s)
and publishes it as `vwTravelRef.current.velocity` scaled by the lab's
`velocityStrength` (default 0). The tunnel wall shader consumes it
through a new `uVelocity` uniform: velocity brightens the point
spread (up to +50 %) and elongates the points (up to +35 %) as
scroll speed rises. Both cues cost one uniform each; the visible
speed cue the Codrops/mesh3d survey found is the cheapest depth
signal — velocity effects beat DOF on cost, and this ships them.

### The entry burst

A new `uEntryBurst` uniform on the year-ring material, sized by the
lab's `entryReactionStrength` × `sin(π·entry)` (peaks at half-dive,
zero at both ends), makes the nearest ring bloom as the camera passes
through the parked brandmark. Production's default is 0, so the
uniform is dead.

### The masthead's lead-in band

⚠ **THE ADR-081 U2 LEFTOVER, CLOSED IN PRODUCTION.** The shipped stop
schedule seated stop 0 at `home = 0.139`, its beat became visible
via `FOG_IN` at ~0.048, and the masthead was still lettering 124
chars at ~0.10 (measured on the V1-default capture, invisible to
every geometry gate). A new `VW_TRAVEL_LEAD_IN = 0.06` band sits
between the entry dive and the first stop, moving stop 0's home to
~0.20 and its visible start to ~0.115 — past the disarm at 0.106,
inside the un-type's own force-clear tail at 0.126. Residual
overlap ≤ ~1.5 % of runway, down from ~8 %. The remaining sliver is
covered by the un-type animation fading the ghost, not printed ink.
`activeStop` was updated to use the same `ENTRY + LEAD_IN` base or
the rail marker would seat one year early on the lead-in band.

### The structural shed

⚠ **CONDITIONAL ON THE PHASE 0 TRACE, WHICH PROVED THE COST.** A
headless-SwiftShader trace at 1920×1247 with CPU ×4 throttling
measured 90–200 ms/frame at mid-tunnel while the corridor scene graph
kept painting behind the camera. Four painters that sit definitively
behind the camera during interior travel — `InterGateCorridor`,
`GatewayThroat`, `LatentFieldTunnel`, `LatentWormholeWalls` — early-
return in `useFrame` and hide their geometry when
`vwTravelInterior()` returns true. Measured post-shed on the same
CPU ×4 pass: mid-tunnel drops from 121 → 80 ms, foot from 94 → 60 ms.
On CPU ×1 (unthrottled) the change is inside SwiftShader's noise.

⚠ **THE GATE IS A PURE FUNCTION OF LIVE STATE**:
`t.engaged && t.flight > 0.15 && t.flight < 0.9`. No latch, no
cooldown, no history. Reverse scroll restores by construction — the
ADR-081 U1 whole lesson at this seam, "the camera claim is
POSITIONAL, not modal", carried into the painters' gates. Guarded
by a new smoke, "the structural shed restores every painter on
reverse scroll": walk to the Arc (baseline weight), walk deep into
travel (mid weight), reverse-scroll back to the Arc, prove the
restored weight comes back within 80 % of baseline. Verified to
FAIL against a modal shed before being kept — this morning's
regression class is now smoke-covered.

⚠ **THE SET IS DELIBERATELY CONSERVATIVE.** The starfield stays on:
the tunnel walls are additive point clouds, so stars are visible
THROUGH the gaps — hiding the starfield would leave a black void
around the tunnel. The brandmark accretion shell + physics core
stay on: reverse scroll from mid-tunnel back to the parked
brandmark passes through them at close range, and the recovery has
to be already-painted rather than starting a re-mount.

### The theme parity check

Both `V1-default` (production) captures at 1440×800 in dark AND light
themes produce the expected result: dark reads the ADR-081 U2
composition byte-for-byte, light re-derives through the `--dawn-rgb`
swap and the scene palette pair. Verified against
`docs/design/voidwalker-flight-lab/light/…` and
`docs/design/voidwalker-flight-lab/1440x800_dark_V1-default_*.png`.

### Verification

- `tests/lib/voidwalker-travel-clock.test.ts` — **52 → 60 cases**:
  the config module's byte-identical defaults, `beatRollDeg`'s three
  zeros (park + both extremes), the `curved` bow arithmetic, the
  `housed` opacity gate, the config's dedup + `resetVwFlightConfig`
  round-trip, and the masthead-clear-before-first-beat property.
- `tests/visual/landing-corridor-smoke.spec.ts` — new
  reversible-shed smoke (desktop-only, mobile/tablet skip the
  gated case).
- `services-ring-smoke` and `landing-corridor-smoke` — both
  previously-red cases from ADR-081's Update 2 note now green after
  a scroll-settle helper and a rect-based navigation fix.
- `npm run verify` — **58 test files, 1136 tests, 0 lint errors**.
- Contact-sheet layout: `docs/design/voidwalker-flight-lab/` (README
  documents the presets, the lab route, and the capture CLI).

## Left open

- The press artifacts and the scanline treatment are still the look-dev
  sheet's open questions (T1–T4 + the theme call) — deliberately not
  bundled into this pass.
- The journey glyph still draws a vertical spine. It is honest for the
  fallback and cosmetic for the travel; a redraw is its own small pass.
- The FLIGHT GRAMMAR PICK. U4 shipped the harness and three variants;
  the owner's actual selection among `linear` / `curved` / `housed`
  and a `populated-field` overlay is a subsequent commit, filed when
  the contact sheets are read.
- The tunnel's wall density is tuned against software rendering in
  capture. Worth a look on a real GPU before it is called final.
- `BrandmarkPhysicsCore`'s own reaction to the entry dive (dispersion,
  parting) is Phase 1's most speculative lever — the lab exposes
  `entryReactionStrength` but only wires it to the tunnel's ring bloom.
  Extending it into the physics core is out of scope for this pass.

---

## Update 5 (2026-08-25, owner) — the mark was UNREACHABLE, and the bore had no direction

Owner, on the shipped U4 surface: _"what's not happening is that I want to
fly through the brand mark in the wireframe brand mark … that's not really
happening right now. And the corridor, it's not just like dots. Can we
also have some sort of lines, maybe on the z-axis."_

Both halves were true, and both had a specific cause.

### 1. THE PARKED BRANDMARK IS A BILLBOARD WELDED TO THE LENS

⚠ **THE CAMERA COULD NEVER REACH THE MARK, AND NOTHING MEASURED THAT.**
`BrandmarkPhysicsCoreActor` does not merely re-centre the parked mark: at
`recT = 1` it **replaces its world position** with a point
`CENTER_DISTANCE` dead ahead of the _live_ camera and slerps its
orientation onto the camera's. During the services ambient hold — which
is the state the whole voidwalker runway runs in — the mark is a
billboard pinned at a fixed distance in front of the lens.

So the entry dive moved the camera and the mark rode along at **constant
apparent size**. A probe across the dive caught it exactly: at
`entry = 0`, `0.19`, `0.86` and `0.999` the mark measured the _same
~200px_ in a 1440px frame. There was no approach, no growth, and nothing
to pass through. `VOID_ENTRY_OVERSHOOT`'s own comment ("it has to clear
the mark's own particle radius or the reader ends up parked inside a
cloud rather than having flown through it") was describing a gesture the
weld had already made impossible — and the weld predates it.

⚠ **EVERY GUARD WAS GREEN.** The camera-pose identity was pinned at both
ends, the entry channel was pinned, the mark's own park was pinned. The
defect lived in the RELATIONSHIP between two correctly-behaving objects,
which is where no per-object test looks — ADR-069 U1's finding, again,
one surface over.

**The fix** is `markFlyThroughRelease(entry, engaged)` in
`voidwalkerTravelClock.ts`: the entry channel UNWINDS the weld, so as the
dive runs the mark hands itself back to its world anchor
(`BRANDMARK_ANCHOR_INTELLIGENCE`, which is precisely the point the dive is
aimed through) and drops the billboard, presenting its real volumetric
wireframe instead of a plate turned to face us. The camera then closes on
a stationary object and punches through it. Measured on the same probe:
the mark grows past the frame edges and the wireframe fills the viewport
at `entry ≈ 0.47`, which is where the pose arithmetic says the crossing
is.

⚠ **THE RELEASE IS AN IDENTITY AT `entry = 0` AT EVERY KNOB VALUE**, and
that is the contract — the ambient hold, the dock, the corridor and every
reading beat stay byte-identical. Same construction contract
`getVoidwalkerTravelCameraPose` carries at its own engage edge, and the
reason `markFlyThrough` scales the channel instead of replacing it.

Four things unwind together, because each is the same trap wearing a
different hat: the position lerp, the billboard slerp, the
**camera-forward** `EXIT_RECEDE_DIST` push (a camera-forward shove keeps
the mark out of reach for the whole dive), and the pointer-look (which
would otherwise drag the thing we are flying at sideways under the
cursor). The ink lifts with them — every dim on that mark is an
about-deck/proof envelope leaving it near **0.30 ink**, correct where it
was authored and far too faint to read as a structure passing the lens;
`handoffFade` lifts too, since `servicesAmbientLevel` is on its way to
zero at `#voidwalker` and would fade the mark out during the one gesture
that needs it.

The actor joins the ADR-081 U4 structural shed once the release has
completed and the camera is interior. ⚠ Gated on the release having
actually happened, not on the travel alone — at `markFlyThrough = 0` the
mark is still welded in front of the camera, where hiding it is a visible
hole rather than a saving, and that knob has to restore the pre-U5 read
exactly.

### 2. THE DOT SHELL CANNOT CARRY DIRECTION, AND WAS NEVER MEANT TO

The tunnel's wall rings twist by `r * 0.19` **specifically so consecutive
rings do not line up into stripes** — the right call for the dots
(aligned rings read as a cage) and precisely why the tunnel had volume
but no direction. At rest it was concentric ovals: a target painted on a
wall, not a bore. Volume and direction are two jobs and they get two
layers.

`lib/voidwalker/voidwalkerRailLayout.ts` (three-free, per the
`landing-performance` doctrine) builds **longitudinal rails** — drawn
`lineSegments`, camera-relative and wrapped like everything else here,
converging toward the optical axis with depth. The grammar is
`LatentWormholeWalls`' from the corridor next door, whose own note is the
argument: rails converging on the optical axis are _"the single strongest
cue that the user is flying through a tunnel and not past a flat
picture"_. Same additive dawn ink as that layer, so it inherits the same
both-theme treatment (verified live in dark and light).

Three things are load-bearing and each was found by looking:

- ⚠ **BOTH ENDS OF A DASH WRAP ON A SHARED ANCHOR.** Wrapping each vertex
  on its own z lets the modulo boundary fall between the two ends of one
  dash per rail per cycle, and that dash then stretches the entire length
  of the tunnel — once per wrap, forever. A dash carries its start as
  `aAnchorZ` (the value that wraps) and its extent as `aOffsetZ` (applied
  after). `railDashesFitSlots` is the guard, and it exists because **a
  contact sheet will miss a one-frame-per-cycle streak and a reader will
  not**.
- ⚠ **THE RAILS FOG OUT BY ~0.6 OF THE SPAN, WELL BEFORE THE VANISHING
  POINT.** Carried to the dot shell's own far plane they all converge on
  one pixel dead centre — which is a **sunburst**, drawn straight through
  the beat copy that parks there. First capture showed exactly that.
  Killing them early leaves the reading plane clear and leaves the
  near/mid streaks, which is both the legible answer and the honest one:
  you do not see the far wall of a tunnel, you see the near wall going
  past.
- ⚠ **THE NEAR CLIP IS MUCH SHALLOWER THAN THE DOT SHELL'S.** A wall
  point passing the lens must be killed early or it explodes across the
  frame; a rail is a 1px line and does the opposite — the dashes
  streaking past the frame EDGE are the strongest speed cue the tunnel
  has, and copying the dots' `0.5 → 3.4` ramp threw the whole peripheral
  read away.

Partial rails (every third, 55 % length) pay the cage debt the twist was
paying, without giving up the alignment that makes a rail a rail.

### The two knobs default to the NEW behaviour

`railDensity` and `markFlyThrough` are the only entries in
`VwFlightConfig` whose default is not an identity against a pre-existing
constant — they ARE this change. Their **zero** is the documented restore
path, and the lab ships a `u5-before` preset that sets both to 0 so the
old read is one click away for comparison.

### 3. A CORRIDOR SMOKE MAY NOT NAVIGATE BY PIXELS — OR BY FRAMES

Two corridor smokes reached the Arc by scrolling to a hardcoded
`y = 2800`. That has been wrong the whole time and this pass is only when
it started failing: **the stage is sized in viewport units**, so measured
stage heights run 6921 (iphone-14) to 9676 (tablet) and the same `y`
lands at a different FRACTION of the corridor on every project — 0.40 on
one phone, 0.37 on the other. The `navigate` band itself sits at
0.40–0.50 on the two phones and 0.30–0.40 on tablet and desktop, so
**no single fraction is safe either**; `walkToArc` searches for the band
and returns where it parked, and the reverse-scroll test returns to that
same value rather than to a second literal.

⚠ **AND SETTLING COSTS REAL MILLISECONDS, NOT FRAMES.**
`data-corridor-phase` is written from the WebGL frameloop off the
SMOOTHED scroll value, so it lags `window.scrollY` by far more than a
frame. The first repair walked the stage reading the attribute after two
`requestAnimationFrame`s per step and found **no `navigate` band at all**
on any of the four projects — it reported `thesis` from the top of the
stage to the bottom. The search has to be a Playwright-side loop with a
timeout per probe; a fast pass inside one `page.evaluate` cannot see this
attribute change. `scripts/probe-corridor-phase.mjs` is the instrument
and prints both the per-shape band and the per-step phases.

### Verification

- `tests/lib/voidwalker-flythrough.test.ts` — 17 pins: the release
  identity at `entry = 0` across four knob values, monotonicity, the
  disengaged zero, the knob-0 restore, and the rail layout's shared
  anchor, slot fit, partial-rail count, on-shell seating and determinism.
- Full `npm run verify` green (59 files / 1153 tests), corridor smokes
  green.
- Live probes at 1440×800 in **both themes**: `scripts/probe-vw-brandmark.mjs`
  walks the dive at fine resolution (the coarse walk was stepping over
  the pass-through entirely), `scripts/probe-vw-rails.mjs` counts GL draw
  calls **by primitive mode** — the rail layer's first capture looked
  empty and the LINES tally is what proved it was drawing and merely too
  faint, rather than not wired.

### Left open

- The rails are **not velocity-gated beyond a brightness boost term**; a
  length-stretch on fast scroll is the obvious next lever and is not
  wired.
- The tunnel's materials are still hardcoded ink with no theme branch —
  matching `LatentWormholeWalls`, and correct in both themes today, but
  the parity is inherited rather than declared.
- The mark's own particle field does not react to being flown through
  (U4's `entryReactionStrength` still only drives the ring bloom). Now
  that the camera actually reaches it, a dispersion/parting reaction has
  somewhere to land.
