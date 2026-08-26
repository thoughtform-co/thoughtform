---
paths:
  - "components/landing/home-v2/voidwalker/**"
  - "components/landing/home-v2/hooks/useVoidwalkerScroll.ts"
  - "components/landing/home-v2/hooks/useVoidwalkerTravelScroll.ts"
  - "components/landing/home-v2/hooks/useCharacterStageScroll.ts"
  - "components/landing/home-v2/hooks/useCharacterStagePortalReceiver.ts"
  - "components/landing/home-v2/DepthGatewayScene/VoidwalkerTimeTunnel.tsx"
  - "lib/voidwalker/**"
  - "lib/home-v2/vwTravelRef.ts"
  - "scripts/capture-voidwalker.mjs"
  - "scripts/capture-voidwalker-travel.mjs"
  - "scripts/probe-voidwalker-models.mjs"
  - "app/(internal)/test/voidwalker-flight-lab/**"
  - "app/(internal)/test/voidwalker-avatar-lab/**"
  - "components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx"
  - "tests/visual/landing-corridor-smoke.spec.ts"
---

# Rule: The through-line (`#voidwalker`)

The career timeline after the bio — nine beats on one gold spine, six of
them with a drawn wireframe plate — and the OPAQUE COVER that ends the
corridor ambient hold. "Voidwalker" is the station's title by owner
decision (2026-08-23); `.voidwalker*` is the `#about` bio's CSS block and is
never written here — this section is `.vw*` / `.vw-wire*` (or `.ch*` when
the character stage is on — see below).

⚠ **ADR-082 (2026-08-26): the station's INTERIOR is a character-selection
stage when `VOIDWALKER_CHARACTER_STAGE` is on.** The station shell, the
rail manifest row, the section readout, the nav drawer entry and the
ADR-030 §6 cover-lockstep are UNCHANGED — the flag toggles ONLY the
inside of the station. When on:

- `VoidwalkerStation` renders `<CharacterStage />` (in `voidwalker/character/`)
  instead of the vertical timeline / travel — every timeline hook stays
  inert (no `data-vw-mode`, no `data-vw-ready`, no `--vw-b`);
- the CSS namespace becomes `.ch*` (`voidwalker-character.css`), which
  DOES NOT overlap `.vw*` — one file, one namespace, no cross-cascade;
- the era registry is `lib/voidwalker/characterEras.ts` (six eras, each
  pointing at a `VOIDWALKER_BEATS` entry by id — the record is one, the
  presentation is two);
- the About runway's exit clock has TWO transform targets: the ADR-047
  slide-right (`--about-exit`) and the ADR-082 portal-to-centre
  (`--about-portal`), gated by the flag; the receiver bus is
  `characterStagePortalRef.ts`.

⚠ **The rest of this rule still binds** — the record is still the
record, the wireframes are still on disk (fallback path), the cover
lockstep is still the ADR-030 §6 seam bug. The `.claude/skills/
voidwalker-avatar/` skill is the offline pipeline that produces the era
character sheets and Meshy GLBs — `public/models/voidwalker/<era>.glb`,
`public/images/voidwalker/era-<era>.jpg`, ≤ 4 MB per GLB
(`scripts/probe-voidwalker-models.mjs`).

⚠ **SINCE ADR-081 THIS SECTION HAS TWO PRESENTATION MODES, ONE CONTENT
TREE**, and **[ADR-081 U2](../sentinel/decisions/081-voidwalker-time-tunnel.md)
is the live pass** — one damped clock for the field and the camera, a
flight path authored in screen fractions, slim-in-flight/full-on-park,
and the HUD's own left rail as the time axis. See §One clock below.

On desktop with motion allowed it is the TIME TUNNEL: the reader
falls into the parked brandmark past `#about`, a wormhole opens, and the
beats fly at them on the Z axis while the years count backwards on a
graduated axis. Everything below describes the VERTICAL mode, which is
still the whole record and is now the FALLBACK (flag-off · mobile ·
tablet · reduced-motion · no-WebGL · a JS failure). Both modes render the
same DOM.

**Read first**

- [ADR-081: The through-line travels the Z axis](../sentinel/decisions/081-voidwalker-time-tunnel.md) — the live composition; see §The time tunnel below
- [ADR-074: The through-line](../sentinel/decisions/074-voidwalker-through-line.md) — the record, the drawings, and the vertical mode
- [ADR-047](../sentinel/decisions/047-about-deck-flip-stage.md) (the station before it, whose exit relies on this one's top) · [ADR-056](../sentinel/decisions/056-services-proof-casefile.md) (the cover role's previous holder) · [ADR-068](../sentinel/decisions/068-casefile-glyphed-index-and-tool-dossier.md) (the wireframe grammar this forks) · [ADR-059](../sentinel/decisions/059-rail-instruments.md) (the journey mark, and the telemetry the right guard clears)

## The time tunnel (ADR-081, live)

- **No second WebGL context.** The corridor canvas already survives
  `#about` as the ambient hold; the travel EXTENDS it. The beats are real
  DOM on CSS 3D over it — the film is a live button into a CSP-pinned
  player, the press bars are real links, and the record's guards walk
  rendered text.
- ⚠ **THE PERSPECTIVE IS DERIVED FROM THE SCENE CAMERA'S FOV**
  (`travelPerspectivePx` = `(H/2)/tan(θ/2)`). It is the one number that
  makes the DOM field and the WebGL tunnel one space. `sceneGeom` pulls
  THREE so the clock MIRRORS `CAMERA_FOV` — the unit test pins them equal,
  and without that guard the two layers silently stop sharing a projection.
- ⚠ **`VW_TRAVEL_SPAN` MUST EXCEED 2, AND "> 1" IS THE TRAP.** A neighbour
  is 1.0 stop away and the flight only starts outside the park, so the
  reach is `SPAN/2 − PARK/2`. Under 2 the next beat is pinned invisible the
  moment the current one parks and the field is a slideshow.
- ⚠ **DEPTH ON A FLAT LAYER IS CARRIED BY FOCUS, NOT OPACITY.** A receding
  beat at 24 % and half scale stays legible under a pixel of blur and reads
  as overlapping text. The blur saturates by |t| 0.55.
- ⚠ **`data-vw-ready` GATES THE WHOLE MOTION BLOCK**, including the
  masthead's decode ghost. The travel hook writes it too, or every `--vw-b`
  is inert and the ghost paints over the field.
- ⚠ **A camera-relative wrap must wrap the point's OWN phase.** Offsetting
  it by `uCamZ` first resolves back to `uCamZ + p.z` — the tunnel comes out
  geometrically perfect and completely FROZEN.
- ⚠ **The year rings' spacing is DERIVED** from the camera's cruise
  distance over the record's span, or the rings slide against the walls.
- **The runway is MODE-GATED CSS** (the ADR-047 `#about[data-about-mode]`
  precedent, not the `#services` pre-hydration one) paired with
  `VW_TRAVEL_RUNWAY_SVH`; the unit test reads the sheet. No failing path
  may inherit fourteen viewports of dead scroll.
- **Two writers, one boolean and its negation.** `useVoidwalkerTravelScroll`
  and `useVoidwalkerScroll` take `enabled` from ONE capability decision, so
  `--vw-b` can never have two writers.
- ⚠ **`colorScheme` DOES NOT FLIP THIS SITE** — the theme is a pre-paint
  attribute from `?theme=`. A context-level colour scheme captures dark
  twice and reports a light pass that never happened.

## One clock, and the rail is the axis (ADR-081 U2, live)

- ⚠ **ONE DAMPED VALUE, AND THE HOOK OWNS IT.** `travelChase`
  (`VW_TRAVEL_TAU_S` 0.18s) is written by `useVoidwalkerTravelScroll`
  into `vwTravelRef.flight`, and the DOM beats, the camera and the tunnel
  all read THAT. The motion follower's `voidTravel` channel is DELETED,
  deliberately: before this, the camera flew a damped value while the
  beats were written from raw scroll in a different rAF — one projection,
  two clocks, so the cards snapped with the wheel while the walls glided.
  A dead damped channel that still looks authoritative is how the second
  clock comes back.
- ⚠ **SPATIAL CHANNELS DAMP; LETTERED CHANNELS DO NOT.** Depth, the path,
  the camera, the ring cadence take `flight`. The active stop, the
  rolling year and the rail's car take RAW `p` — a readout that lags
  reads as broken.
- ⚠ **THE CHASE OUTLIVES THE SCROLL EVENT.** Scroll events stop when the
  finger does and the field is still gliding; the tick re-requests itself
  until the chase settles, or the beats freeze part-way while the tunnel
  (pumped by the corridor's own loop) keeps moving.
- ⚠ **THE FLIGHT PATH IS AUTHORED IN SCREEN FRACTIONS**
  (`beatScreenXFrac` / `beatScreenYFrac` / `beatRotDeg`) and un-projected
  per frame through each beat's own depth (`beatDepthUnproject`). A flat
  CSS offset does NOT survive projection: `±7%` of a 680px box is 48px,
  which at `VW_Z_FAR` arrives on screen as FIFTEEN — every beat flew at
  the reader dead centre and the alternation only appeared once it had
  parked. Author where it is read.
- ⚠ **THE BEAT LEAVING IS NOT THE BEAT ARRIVING.** `FOG_OUT` (0.32) and
  `BLUR_REACH_OUT` (0.30) are roughly a third of their IN counterparts,
  and flattening either back to symmetry puts two beats of identical
  weight over each other at the midpoint between stops. The reader is
  looking at what is COMING.
- **Slim in flight, full on park.** `--vw-d` (`beatDetail`) PEAKS at the
  park and drives the panels' `--ci`; `--vw-b` still lights the beat's
  own chrome and holds. ⚠ Re-source the ladder, never re-author it — one
  `--ci` declaration carries the whole stagger. `.vw-wire` takes
  `content-visibility: hidden` in flight; ⚠ NOT `.vw-plate__frame`,
  whose height IS its content and would pop the card as it lights.
- ⚠ **`filter` IS IN `will-change` AND THE BLUR IS QUANTISED** to half a
  pixel. An unhinted radius that changes every frame re-rasterises the
  whole card, three at a time, exactly during the fastest motion. And
  `data-vw-far` is `content-visibility` + `visibility`, never
  `display: none`, which re-ran layout at every stop transition.
- ⚠ **THE LEFT RAIL IS THE TIME AXIS** (owner) — `.vw-axis` is deleted.
  The rail's thirteen ticks are twelve intervals and the record spans
  twelve years, so every record year seats on an INTEGER RUNG; nothing is
  added to the ladder (ADR-031's guardrail) and the twelve-year span is
  pinned. The `RailDates` host is `position: absolute` inside
  `.hud__rail--l` (the rail is a FLEX COLUMN — a static child leaves the
  ticks' percentage box), and ⚠ **the handoff is POSITIONAL**, scoped by
  `:has` to a rail holding a running car: keyed on `data-vw-mode` it
  would letter years for the whole document, which is U1's defect again.
  ⚠ The lit rung IS the readout — no second year travels with the car.
- ⚠ **`wholeYears` FLOORS AT THE SOURCE.** Fractional `sortYear`s exist
  only to order beats inside a year they share; rounded, the axis
  lettered 2019 and 2017 — years no chip prints — and seated the marker
  between its own rungs.
- ⚠ **THE CAMERA HANDOFF IS AN IDENTITY IN BOTH HALVES.** The comment and
  the ADR claimed it for four days with no test while the GAZE snapped
  ~16°. Do not weaken the guard to the position alone; that is the half
  that was already true.
- ⚠ **THE MASTHEAD'S EXIT IS A POSITION, NOT A DURATION.** A time-based
  scramble and a scroll-based runway always desync, and when they do the
  masthead letters across the first PARKED beat. It disarms at the dive's
  own end, un-types unstaggered, and is force-settled past
  `ENTRY_FRAC × 1.26`.
- ⚠ **THE DECODE GHOST MUST PAINT NOTHING IN BOTH THEMES.** It is the
  layer that survives the un-type. `html[data-theme="light"]
.vw-head__lede em` (0,2,2) outranks `.vw-decode__ghost em` (0,2,1),
  so light painted the masthead's leitmotif line across the field with
  the live layer reading empty and every geometry gate green. theme.css
  re-asserts transparency at matched specificity, later in the cascade.
- **The tunnel warms its shaders** on `vwTravel.near`, two viewports out:
  three never compiles a material for an object it has not drawn, so the
  dive's first frame was also compiling two point shaders. Nothing else
  is deferred — ~1,500 points cost nothing while invisible.

## The flight-grammar lab and the structural shed (ADR-081 U4)

- ⚠ **THE TUNABLE CLOCK IS OVERRIDABLE AT RUNTIME**, through
  [`lib/voidwalker/voidwalkerFlightConfig.ts`](../../lib/voidwalker/voidwalkerFlightConfig.ts).
  Every knob (`span`, `tauSeconds`, `runwaySvh`, path anchors,
  `pathVariant`, `wallDensityMul`, `entryReactionStrength`,
  `velocityStrength`, etc.) has a default that MIRRORS the shipped
  constant byte-for-byte, and functions in the clock resolve them at
  call time. Production never mutates the config, so the resolved
  values equal the constants byte-identically — the unit tests pin
  the equality directly.
- ⚠ **THE LAB ROUTE IS `/test/voidwalker-flight-lab`**, an
  `(internal)` route blocked in production by `proxy.ts`. It renders
  `LandingPage` verbatim with a `FlightLabPanel` overlay that writes
  the config + syncs URL query params. Presets in
  `FlightLabPanel.tsx` (`V1-default`, `V2-noomo-swing`, `V3-housed`,
  `populated-field`, `slow-cinema`, `entry-burst`) mirror
  `PRESET_URLS` in `scripts/capture-voidwalker-travel.mjs`. Add a
  preset to both or `--all-variants` will not see it.
- ⚠ **NEW PATH VARIANTS ARE NEW CURVES, NOT NEW OFFSETS.** `curved`
  bows through `smoothBell(t) = sin(π·|t|)` (0 at 0 and ±1, peaks at
  ±0.5) so the parked composition is unchanged from `linear`; the
  bow is additive on the lerp. `housed` shares `curved`'s path and
  gates the drawn housing frame's opacity on `beatDetail`. The
  variants sit on ONE clock — the config resolves per-call, so
  reverse-scroll off a housed variant is byte-identical to `linear`
  on the SAME frame.
- ⚠ **THE STRUCTURAL SHED HIDES FOUR CORRIDOR PAINTERS DURING
  INTERIOR TRAVEL**: `InterGateCorridor`, `GatewayThroat`,
  `LatentFieldTunnel`, `LatentWormholeWalls`. All read
  `vwTravelInterior()` in `useFrame` and early-return with
  `visible = false` when it is true. The gate is a PURE FUNCTION of
  `vwTravelRef.current` (`engaged && flight > 0.15 && flight < 0.9`)
  — no latch, no cooldown. ⚠ **ADD A PAINTER TO THE SHED IS ADD IT
  TO THE SMOKE.** The `ADR-081 U4: the structural shed restores
every painter on reverse scroll` smoke walks Arc → mid-travel →
  Arc-after-reverse and pins the frame weight; a new painter that is
  hidden but never restored fails there rather than in the wild.
- ⚠ **THE STARFIELD STAYS ON DURING TRAVEL.** The tunnel walls are
  additive point clouds — stars are visible THROUGH the gaps.
  Hiding the starfield would leave a black void around the tunnel.
  Same for the brandmark accretion shell + physics core: reverse
  scroll passes back through them at close range, and the recovery
  has to be already-painted.
- ⚠ **THE MASTHEAD LEAD-IN BAND (`VW_TRAVEL_LEAD_IN = 0.06`) SHIFTS
  `stopHome` AND `activeStop`'s BASE**. Missing the update on
  `activeStop` would seat the rail marker one year early on the
  lead-in band. Unit-pinned: the first beat's opacity at the
  masthead's disarm point (`ENTRY_FRAC`) is < 1 % opacity, and at
  the force-clear point (`ENTRY_FRAC × 1.26`) < 35 %.
- ⚠ **SETTER DEDUP IS LOAD-BEARING.** `setVwFlightOverrides` and
  `resetVwFlightConfig` NO-OP when nothing changes. Without dedup
  the panel's first-effect config write fires a `vw-flight-config`
  event, the tunnel's `configEpoch` bumps, and the point-cloud
  buffer rebuilds INSIDE the corridor's own `createRoot` commit —
  which React reports as "sync unmount while rendering". Pin the
  dedup with the same test that already covers it.

## The fly-through and the rails (ADR-081 U5)

- ⚠ **THE PARKED BRANDMARK IS A BILLBOARD WELDED TO THE LENS AT
  `recT = 1`** — `BrandmarkPhysicsCoreActor` replaces its world
  position with a point `CENTER_DISTANCE` in front of the LIVE camera
  and slerps onto the camera's orientation. The services ambient hold
  is the state the whole voidwalker runway runs in, so before U5 the
  dive moved the camera and the mark rode along at constant apparent
  size (measured: ~200px in a 1440px frame at `entry` 0, 0.19, 0.86
  and 0.999). **Anything that wants to REACH that mark must unwind the
  weld**, and four things unwind together or none do: the position
  lerp, the billboard slerp, the camera-forward `EXIT_RECEDE_DIST`
  push, and the pointer-look.
- ⚠ **`markFlyThroughRelease(entry, engaged)` IS AN IDENTITY AT
  `entry = 0` AT EVERY KNOB VALUE.** That is the contract that keeps
  the ambient hold, the dock, the corridor and every reading beat
  byte-identical — the same construction
  `getVoidwalkerTravelCameraPose` uses at its own engage edge, and the
  reason `markFlyThrough` SCALES the channel rather than replacing it.
- ⚠ **THE MARK'S SHED IS GATED ON THE RELEASE, NOT ON THE TRAVEL.** At
  `markFlyThrough = 0` the mark is still welded in front of the
  camera, where hiding it is a visible hole rather than a saving.
- ⚠ **VOLUME AND DIRECTION ARE TWO LAYERS.** The wall rings twist by
  `r * 0.19` SPECIFICALLY so consecutive rings do not line up into a
  cage — correct for dots, and exactly why the dot shell can never
  carry direction. Longitudinal cues go in the rails
  (`lib/voidwalker/voidwalkerRailLayout.ts`, three-free per the
  `landing-performance` doctrine); do not answer a direction complaint
  by removing the twist.
- ⚠ **BOTH ENDS OF A RAIL DASH WRAP ON A SHARED ANCHOR.** Wrapping
  each vertex on its own z drops the modulo boundary between a dash's
  two ends once per rail per cycle, and that dash then spans the whole
  tunnel. A dash carries `aAnchorZ` (wraps) and `aOffsetZ` (applied
  after); `railDashesFitSlots` is the guard, because a contact sheet
  will miss a one-frame-per-cycle streak and a reader will not.
- ⚠ **THE RAILS FOG OUT BY ~0.6 OF THE SPAN AND CLIP MUCH SHALLOWER
  THAN THE DOTS.** Carried to the shell's far plane they converge on
  one pixel dead centre — a sunburst, drawn through the beat copy that
  parks there. And a wall point passing the lens must die early or it
  explodes across the frame, where a 1px rail streaking past the frame
  EDGE is the strongest speed cue the tunnel has: copying the dots'
  `0.5 → 3.4` near ramp threw the peripheral read away.
- `railDensity` and `markFlyThrough` are the ONLY `VwFlightConfig`
  entries whose default is not an identity against a shipped constant.
  Their **zero** is the restore path, and the lab's `u5-before` preset
  sets both.

## Capture / contact sheet

- ⚠ **A CORRIDOR SMOKE MAY NOT NAVIGATE BY PIXELS — OR BY FRAMES.**
  The stage is sized in viewport units (measured 6921–9676 across the
  four projects), so a hardcoded `y` lands at a different FRACTION of
  the corridor on every one; and the `navigate` band itself sits at
  0.40–0.50 on the phones against 0.30–0.40 on tablet and desktop, so
  no single fraction is safe either. Use `walkToArc` in
  `landing-corridor-smoke.spec.ts`, which searches and returns where
  it parked. ⚠ **AND SETTLING COSTS REAL MILLISECONDS, NOT FRAMES** —
  `data-corridor-phase` is written from the frameloop off the SMOOTHED
  scroll value, and a walk that settles on `requestAnimationFrame`
  alone measured NO `navigate` band at all on any project. The search
  must be a Playwright-side loop with a timeout per probe;
  `scripts/probe-corridor-phase.mjs` prints both readings.
- `scripts/probe-vw-rails.mjs` counts GL draw calls **by primitive
  mode** — the rail layer's first capture looked empty and the LINES
  tally is what proved it was drawing and merely too faint, rather
  than not wired.
- Capture one preset: `node scripts/capture-voidwalker-travel.mjs
--variant V2-noomo-swing --headless --vp 1440x800`.
- Capture all presets: `node scripts/capture-voidwalker-travel.mjs
--all-variants --headless` (spawns one subprocess per preset,
  writes to `docs/design/voidwalker-flight-lab/<preset>/…`).
- The preset table lives in TWO places (panel + CLI); the README at
  `docs/design/voidwalker-flight-lab/README.md` explains the layout,
  the invariants, and what each preset is doing.
- ⚠ **A CAPTURE MADE ONLY OF PARKS CANNOT SHOW THE FLIGHT.** Every mark
  used to land on a home, where a beat is centred and flat by
  construction; the mid-flight marks, the `before` mark (the only one
  that can prove a positional gate), the damping probe and the
  equal-weight overlap gate are what found four of the defects above.

## Contracts

- **The cover lockstep.** `useCorridorExitScroll`'s `nextStation` query and
  `home-v2.css`'s `html[data-corridor-exit="true"] #…` rule name the SAME
  station; the ambient bottom gate and the fade envelope read the SAME rect
  (ADR-030 §6, recorded FIVE times now). ⚠ **ADR-081 MOVED IT**: with the
  tunnel on, `#voidwalker` is itself a pinned TRANSPARENT stage the ambient
  must survive, so the cover is `#practice`. The `#voidwalker` rule stays
  for every non-travel path — the travel-mode transparency and its
  fail-opaque `--vw-bg-in` shield are gated on the mode attribute, so the
  two can never both apply. In the vertical mode the station is plain flow,
  opaque, with NO negative `margin-top` — `#about`'s slide-out exit lands
  on its top edge either way.
- **Three parse-option copies move together**: `app/(marketing)/page.tsx`
  (`CORRIDOR_RELOCATED_STATIONS`, `[voidwalker, about, services]`),
  `tests/lib/rail-manifest.test.ts` and `tests/lib/v7-parse.test.ts`. The
  drift guard is the alarm. `data-station` = `id` = manifest `targetId`.
- **The record is zero-import** (`lib/voidwalker/voidwalkerData.ts`) and its
  facts are at LOCK — `tests/lib/voidwalker-data.test.ts` pins the sourced
  phrasings and bans rounding, currency and model families. A copy change
  is a record edit plus that test. `#practice` is an EMPTY station in
  production; the foot may not point there.
- **A drawing declares what it letters** (`voidwalkerWireLabels.ts`) and
  `voidwalker-wire-markup` walks the rendered text against it: ≤8 labels,
  no digit, no currency, no `<img>`, exactly one `[data-gold]`, ≤50
  elements. Adding a label means adding it to the table in the same commit.
- **The `--w-*` token block on `.vw-wire__in` is the casefile's VERBATIM**,
  and theme.css re-derives both hosts from ONE light rule
  (`voidwalker-wire-tokens`). A new token lands in `casefile.css`,
  `voidwalker-wire.css` and `theme.css` in one commit — or in none.
- **One writer.** `useVoidwalkerScroll` owns `data-vw-ready`, `data-vw-beat`,
  `--vw-p`, per-beat `--vw-b` and the masthead's decode runs. No `<html>`
  writes, no store writes, no per-frame layout reads (the offset chain is
  cached; a `ResizeObserver` on the section AND on `document.body` refreshes
  it). Per-beat channels are hosted on the beat, never the root.
- **The rest state is the finished page.** The motion block is gated on
  `.vw[data-vw-ready]`; absent = every panel lit, the spine drawn, the
  diamonds filled. The hook's only gate is `prefers-reduced-motion:
no-preference` — ⚠ if a width gate is ever added, the CSS rest block in
  `voidwalker.css` takes the SAME pair.
- **The masthead never moves or fades** — it types in and un-types out, in
  place (the caption kernel; each lede run its own target so the gold `em`
  survives). Panels power on through the `--ci-off` ladder; the title's
  words brighten on `--vw-w`; all reversible.
- **The beats ALTERNATE around a centred spine at ≥1280** (ADR-074 U1):
  left beats right-aligned with the plate seated at the lane, right beats
  mirrored. Below 1280 the rules are reset and every beat reads off a
  left-hand spine — keep that reset when touching either block.
  ⚠ **THE SIDE AND THE ORDINAL ARE DATA, NOT `:nth-child`** (U2). The film
  interlude is a row in the same list, so a parity selector flips every beat
  beneath it. Both are computed in the renderer over a count that SKIPS
  interludes; CSS selects `[data-side]`.
- **The marker is a framed CHIP on the rail** (U2) — node, ordinal and year
  on one line, on an opaque ground that BREAKS the spine. ⚠ The rail used to
  be drawn straight through the labels on all nine beats: the diamond
  knocked it out, the type under it did not. Anything added to the chip
  keeps that ground. ⚠ It may be wider than the lane — the gutters are
  empty — but it must clear the content columns by ≥16px at 1280 (measured
  19 / 21 / 29), which is why `--vw-lane` is a CLAMP: at a flat 64px the
  clearance got WORSE as the viewport grew. The widest chip is the range
  (`//09 2014–17`) and it is what the gap, padding and tracking are tuned
  against. Square corners — chrome sits at 0 on ADR-065's depth ladder.
- **The run is REVERSE-chronological** (U2), opening on the Intelligence
  Architect seat dated by the SEAT (2026), not the 2024 joining date, or a
  rail read downward prints 2024 above Thoughtform's 2025.
- **The film interlude is NOT a beat.** No chip, no ordinal, no side — and it
  is skipped by `useVoidwalkerScroll`'s marker walk and by the capture
  script: a `.vw-beat` query without `:not(.vw-beat--interlude)` hands the
  clock a phantom stop. It carries an opaque ground so the spine stops at it.
  ⚠ **The player is the ONE third-party frame on this site.**
  `lib/security/headers.mjs` names `youtube-nocookie.com` in `frame-src`
  (absent before U2, so it fell back to `default-src 'self'`), and
  `security-headers.test.ts` pins `frame-src`, `media-src` and the ABSENCE of
  the cookie-setting host. The iframe is built only inside `MediaLightbox`
  after a click — its `embed` branch is ADDITIVE and the `src` path stays
  byte-identical for the films and walkthroughs that share it. A new origin
  is a decision: measure it with `enforceCsp: true` before adding it.
- ⚠ **Grid rows are EXPLICIT** on the spine (2/4), the beats list (2) and
  the foot (3): auto-placement slid the list under the spine's span and the
  spine measured 0px. ⚠ **The right guard** (`--vw-guard`, 32px below
  1600px) keeps a full paragraph off the right-rail telemetry; the band's
  edge sits 10–22px inside the readouts at the laptop widths.
- ⚠ **On the phone band the FRAME carries the plate's aspect, not the
  plate** — a wrapped headline in the bar otherwise eats the drawing.

## Verifying

`npx vitest run tests/lib/voidwalker-*.test.ts` for the record, the clock,
the drawings and the tokens; `node scripts/capture-voidwalker.mjs --vp
1440x800 [--theme light]` (headed) for the seam, the masthead, every beat at
its reading line, the reversal and the six plates measured; the ring smoke's
"ambient hold survives" case for the cover.
