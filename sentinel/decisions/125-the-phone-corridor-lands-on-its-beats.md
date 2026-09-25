# ADR-125: The phone corridor lands on its beats

- **Status:** Proposed (2026-09-25) — shipped and guarded on Chromium; the device
  read is the gate (§Device checklist). Chromium proves the clock, the seats and
  the composed frames; it cannot see WebKit's snap reach. ⚠ **U1 (same day,
  after his device read) SUPERSEDES §1–§3 ON THE CLOCK AND THE SEATS**: the
  plateaus become 24svh dwells, the passes cruise at 1.33× the desktop, the
  eight seats become four `normal` ones, and the beats are composed on the
  chrome bands by DERIVED straddles — see §Update 1 below before citing any
  number in the body.
- **Surface:** the landing's depth corridor on the mobile composition
  (`isMobileComposition()`, < 760), the ≤960 corridor host, and the rail's
  click-to-navigate. The desktop is byte-identical: the remap is gated behind
  `active && isMobileComposition()`, the seats render only on the mobile tier,
  and every CSS change sits in the ≤760 / ≤960 blocks.
- **Reverses:** [ADR-113](113-the-phone-locks-in.md) §1's "not the corridor
  host" for the phone rung (recorded as ADR-113 U3), on the owner's word. The
  stage and its sticky cell stay no snap area; what the stage gained is
  children.
- **Related:** [ADR-018](018-home-v2-depth-corridor.md) (the corridor, and
  Revision 3's mobile dwell this re-shapes), [ADR-123](123-the-era-instrument-pins-on-the-phone.md)
  (the era runway's seat idiom, copied here), [ADR-115](115-the-phones-deck-flip.md)
  (Blink's ~280px reach, measured), [ADR-021](021-corridor-exit-zoom-dissipate.md)
  (the epilogue the tail hands to), [ADR-097 U12](097-proof-card-is-a-folder.md)
  (easy in, easy out).
- **Rules:** [`.claude/rules/mobile-sections.md`](../../.claude/rules/mobile-sections.md)
  §10, §13; [`.claude/rules/scroll-animations.md`](../../.claude/rules/scroll-animations.md).

## The ask

Owner, 2026-09-24, from his iPhone, with a still of the Navigate beat composed
(the chrome row under the top bracket, the title, the sphere centred, the
dotted caption card at the bottom):

> The one thing I notice is that when you enter the second section on mobile
> and then scroll through the arcs, I wouldn't say it's jittery or laggy. It's
> just that sometimes, when you scroll, it shoots off or is a bit too far. …
> When you're scrolling to the arc section, it either scrolls too far, so the
> elements are too small, or it scrolls too far ahead, so some of the elements
> are out of view. I'm sure there's a clean way for it to land nicely when
> you're scrolling to a section of the arc. When you enter the section after
> the hero section, it also takes a while to scroll to the arc section and get
> into it. … I know we have a three.js WebGL type of thing, but when it comes
> to scrolling, etc., I'm sure we can really leverage frontend knowledge.

He named thedesignsociety.fr as the reference for a scroll that "came into
view". Read: Webflow, Lenis 1.3 and GSAP ScrollTrigger — and Lenis smooths the
WHEEL only; on touch the reference is native scroll over composed full-height
beats. That is the grammar taken here, not the library.

His three decisions, 2026-09-25: a beat holds **80svh** of scroll; **one flick
steps exactly one beat**; the thesis rest shortens **163 → 100svh**.

## The diagnosis is arithmetic

On the phone every beat of the Arc was composed at exactly ONE scroll position.
The camera never held: `cameraZDollyT` is one smoothstep from paint
`DOLLY_HOLD_END` (.109) to 1, the DOM title and caption scale by
`referenceDistance / distance` (`useWorldDomTracker.ts`), and at the Navigate
park the camera moves ~40 world units per unit of paint. So "the title's scale
within 2 % of 1" held for ±0.003 of paint — **±14px of scroll at 390×844**
(±13 at Encode, ±39 at Build). The frame he photographed existed for ~28px, and
the corridor had no snap area (ADR-113 §1 ruled it out), so every rest missed
it in one of the two directions he described.

The entry was two things. The thesis rest was 163svh of scroll (1378px at 844)
with the Navigate frame 288svh from the pin — 2429px, 3.9 screens from the top
of the page. And the corridor had ZERO height until its lazy chunk mounted: on
≤960 the import waits for the first scroll / touch / idle, so the page was
hero → `#services` until then, and the chunk's arrival inserted 6921px under
the thumb with no scroll anchoring on WebKit.

## The decision

### 1 · The phone paint clock holds plateaus

**`lib/home-v2/phoneCorridorClock.ts`** (three-free, DOM-free) owns the phone's
schedule as svh of scroll from the pin and derives everything else from it:

| leg           | svh             | from the pin | paint                                                                                    |
| ------------- | --------------- | ------------ | ---------------------------------------------------------------------------------------- |
| thesis-hold   | 40              | 0–40         | 0, held — the rest frame under the curtain                                               |
| thesis-rise   | 60              | 40–100       | 0 → `DOLLY_HOLD_END`, linear; the copy + diagram fade over the last `THESIS_EXIT_SVH` 32 |
| pass-navigate | 60              | 100–160      | → `BEAT_PARK_CENTRES.navigate` (.400), smoothstep                                        |
| **NAVIGATE**  | 80              | 160–240      | .400, held                                                                               |
| pass-encode   | 50              | 240–290      | → `BEAT_PARK_CENTRES.diagnostic` (.636), smoothstep                                      |
| **ENCODE**    | 80              | 290–370      | .636, held                                                                               |
| pass-build    | 50              | 370–420      | → `BEAT_PARK_CENTRES.intelligence` (.923), smoothstep                                    |
| **BUILD**     | 80              | 420–500      | .923, held                                                                               |
| tail          | 44.39 (derived) | 500–544.39   | → 1, linear                                                                              |

The corridor's span is `(STAGE_SVH − 100) × EPILOGUE_START` = 720 × 620/820 =
544.39svh; the tail is what is left after the last hold. `phonePaintProgress`
is monotonic, continuous, `f(0) = 0`, `f(1) = 1`. The parks are taken BY
REFERENCE from `corridorMap`, so a plateau is byte-identical to the desktop's
park by construction. The passes are smoothstep so the paint velocity is zero
at both edges of every plateau — a slow drag never "clicks" off a beat.
`MOBILE_THOUGHTFORM_END` is derived (100 / 544.39 = 0.1837; it was the literal
0.30 in `sceneGeom`), and the thesis copy's exit fade runs over the rise's last
32svh (`MOBILE_THESIS_EXIT_START`) — the fade's own length before this pass.

- `sceneGeom.ts` re-exports `getMobilePaintProgress` and the two constants;
  every consumer keeps its import. `useDepthScroll`'s remap line is untouched.
- ⚠ **The tail is not optional.** The epilogue's camera pose starts from paint 1
  (`CAMERA_END`); a clock that ended on the Build park would pop the camera on
  the epilogue's first frame. The unit test wants a quarter screen of it.
- ⚠ **A guard that reads a remapped clock trips on the remap.** The motion
  follower's teleport detector snaps every channel on a per-frame jump above
  `TELEPORT_PROGRESS_DELTA` (0.25) and read `paintProgress`; the phone's
  passes move that much PAINT in ~250px of scroll (216 at 745) — one stalled
  frame under a fling. It reads RAW `progress` now (`DepthGatewayScene/index.tsx`),
  which is desktop-identical because progress and paint are one number there
  in every engaged state (armed both 0, active equal, the exit hold both 1),
  and on the phone 0.25 of raw is more than a thousand px in one frame. The
  streaks' `velocity` takes the opposite side of the same rule on the phone —
  it is the PAINT's rate, so nothing streams past a held camera.

### 2 · Snap seats on the plateaus

**`components/landing/home-v2/CorridorPhoneSeats.tsx`**, mounted by
`HomeCorridor` behind `!fallback`, rendering `null` unless
`useDeviceTier() === "mobile"` — the same `< MOBILE_MAX_WIDTH` predicate as
`isMobileComposition()`, so a seat can never exist without the plateau under
it. Eight absolute, full-width, invisible children of `.home-v2-stage`, tiling
the corridor's span; `top` and `height` are written inline as
`calc(f * (100% − 100svh))` from `phoneCorridorSeats()` — for an absolute child
`100%` is the stage's own height, so `(100% − 100svh)` IS the scrub with no
`820` in the component:

| seat           | top (× scrub) | height | align / stop       |
| -------------- | ------------- | ------ | ------------------ |
| `thesis`       | 0             | .0556  | start / **always** |
| `thesis-out`   | .0556         | .1667  | start / normal     |
| `navigate`     | .2222         | .1111  | start / **always** |
| `navigate-out` | .3333         | .0694  | start / normal     |
| `encode`       | .4028         | .1111  | start / **always** |
| `encode-out`   | .5139         | .0694  | start / normal     |
| `build`        | .5833         | .1111  | start / **always** |
| `build-out`    | .6944         | .0617  | start / normal     |

- **`always` on the four plateau starts** is his one-flick-one-beat, up AND
  down (a flick up from Encode passes `navigate-out` and stops on `navigate`).
  Hero → thesis → Navigate is two flicks. The hero stays a non-stop (ADR-113):
  a rest in its last radius completes the curtain onto the composed thesis.
- **The `-out` twins are each plateau's LAST composed frame** (ADR-123's
  `.vw-phone-snap` idiom). Blink pulls a rest within ~a third of the snapport
  of an aligned position (ADR-115's measurement; WebKit unknown); the two Arc
  passes are 50svh, shorter than two radii, so no transit frame in them is
  un-pulled. Never `always` on an out: a flick from a plateau's start would
  otherwise stop 80svh later on the same picture.
- **The one long un-pulled stretch is the entry flight** — the rise and the
  pass into Navigate, ~450px at 844 between `thesis-out`'s reach and
  `navigate`'s. `always` on `navigate` lands every flick there anyway; a slow
  drag may rest mid-flight. Recorded, not fixed: shortening that pass steepens
  it further.
- ⚠ **A seat's BOX is capped at half a screen (`SEAT_BOX_MAX_SVH` 50), and the
  stretch it names lives in `span`.** A snap area taller than the scrollport
  is a COVERING area: every position where it covers the screen is a
  legitimate rest, and a rest just past it is pulled back to the area's END.
  The first cut gave `thesis-out` the whole rise + pass (120svh) as its box,
  and the sweep measured seven consecutive rests pulled BACK onto a
  mid-flight frame at its foot (document y 1350 at 844) — a seat that
  pulled the reader onto the one kind of frame it exists to avoid. A seat
  is a position; its box only has to exist.
- **The root stays `y proximity`** (never `mandatory`), the stage and its
  sticky cell stay no snap area, the seats paint nothing and take no pointer.
  `svh` only, so `phone-viewport-units` needs no exception.
- **Not the epilogue.** `build-out` (500svh) → `#services`' seat (720svh) is
  untouched; the epilogue was tuned by ADR-116 and he did not ask for it. A
  ninth seat on the "billions" title (`EPILOGUE_BANDS.TITLE_IN.end`) is the
  named dial.

### 3 · The entry

- **The host reserves the stage's height before the chunk.** `useCorridorMount`
  renders `.home-corridor-host` synchronously with a null Suspense fallback,
  so pre-chunk it is an empty element on the void. At ≤960 (the import gate's
  own rung): `.home-corridor-host:not(:has(.home-v2-stage)) { min-height: 820svh }`.
  The hero lifts over a void band instead of over the pile, the chunk's
  arrival is a paint rather than a layout shift, and ADR-123's scroll
  restoration sees a stable `scrollHeight` sooner. The literal is pinned equal
  to the stage's in the unit test. The gate's valves are untouched
  (`pointerdown` already fires on touch; a `modulepreload` is bundler-dependent
  and competes with hydration, the TBT reason the gate exists).
- **Navigate is 1.6 screens from the pin** (2.6 from the page top) instead of
  2.9 (3.9); the thesis rests 40svh held plus its rise instead of 163svh.

### 4 · Two corrections that ride along

- **The title scales about its anchored edge.** The tracker writes
  `translate3d(x, y) translate(origin%) scale(s)` with no `transform-origin`
  anywhere, so a `bottom-center` title scaled about its default centre drifted
  by `(s − 1)·h/2` off the point it is anchored to on approach. The ≤760 block
  sets the origin on the anchored edge for `bottom-center` and `top-center`;
  the translations commute with the scale and the edge lands exactly.
- **Programmatic paths land on seats** (ADR-123's law). `scrollTargetForEntry`
  uses `phoneSeatFraction(phase)` on the phone in place of the desktop's park
  fraction (which sits mid-pass on the phone's clock), and measures the runway
  with `layoutViewportHeight()` (joins that ratchet's adopters).

## Pixel budget (from the pin; 1svh = 8.44 / 7.45 / 9.32 px)

| shape   | NAVIGATE  | ENCODE    | BUILD     | Navigate from the page top |
| ------- | --------- | --------- | --------- | -------------------------- |
| 390×844 | 1350–2026 | 2448–3123 | 3545–4220 | 2194px = 2.6vh (was 3.9)   |
| 390×745 | 1192–1788 | 2161–2757 | 3129–3725 | 1937px                     |
| 430×932 | 1491–2237 | 2703–3448 | 3914–4660 | 2423px                     |

Cost, named: the passes run ~2× today's camera speed (a 50svh pass is 422px at
844); a flick crosses one in a fraction of a second and stops on the next beat.
Nothing lettered is on screen inside a pass. At the Navigate park the title's
opacity is 0.926 — the park's own value (`gateNavigateReadout` multiplies by
`smoothstep(0.30, 0.42, paint)`), kept rather than nudged, because the plateau
is the desktop's park by reference.

## Measured (Chromium, 390×844, the webpack dev server, 2026-09-25)

The seats land where the schedule puts them, to the pixel (stage top 844,
host 6921px = 820svh, root `y proximity`):

| seat         | top (px from the stage) | height |
| ------------ | ----------------------- | ------ |
| thesis       | 0                       | 338    |
| thesis-out   | 338                     | 1013   |
| navigate     | 1350                    | 675    |
| navigate-out | 2026                    | 422    |
| encode       | 2448                    | 675    |
| encode-out   | 3123                    | 422    |
| build        | 3545                    | 675    |
| build-out    | 4220                    | 375    |

And the frame on each plateau is composed and STILL — read at the plateau's
first frame, its middle and its last 2px, the title's and the caption's boxes
are byte-identical (chrome bands 56 / 56):

| beat     | title top → bottom | caption top → bottom | opacity | scale (title / caption) |
| -------- | ------------------ | -------------------- | ------- | ----------------------- |
| Navigate | 92.9 → 219.2       | 594.7 → 729.4        | 0.926   | 1.019 / 1.014           |
| Encode   | 149.5 → 253.8      | 565.8 → 681.9        | 0.997   | 1.004 / 1.002           |
| Build    | 159.3 → 264.7      | 561.0 → 696.2        | 1.000   | 1.014 / 1.018           |

Every title clears the top band (56) and every caption the bottom one (788);
the Navigate frame is the one he photographed, held for 675px of scroll where
it held for ~28. A rest 169px into the thesis hold was pulled onto the thesis's
last frame (both composed, paint 0); a rest 3px short of `navigate-out` was
pulled onto it.

**The seams sweep, against the production build (both iPhone projects):**
every 40px rest from the corridor's pin to the Build seat lands on a seat, a
plateau or the one named stretch — 390×844: 106 rests, 86 on a seat, 9 on a
plateau, 11 un-pulled, all eleven in the entry flight (one run, 400px =
0.47vh); 430×932: 117 rests, 96 / 9 / 12, one run of 440px (0.47vh). Not one
un-pulled rest in either Arc pass. The composed-beats case reads the same
frames the probe did on both shapes (Navigate 0.925 / 1.019, Encode 0.997 /
1.004, Build 1.0 / 1.014; every title under the top band, every caption over
the bottom one).

⚠ **The first cut's sweep failed, and the failure was the design's.** The
`thesis-out` seat's box spanned the whole rise + pass (120svh, taller than the
screen), which makes it a COVERING area: seven consecutive rests just past its
foot were pulled BACK to its end — document y 1350 at 844, a mid-flight frame.
Every seat's box is capped at half a screen now (`SEAT_BOX_MAX_SVH`), the range
a seat names lives in `span`, and the sweep classifies by the seats' tops.

## Guards

- **`tests/lib/phone-corridor-clock.test.ts`**: the schedule is the owner's
  numbers and tiles the corridor with a real tail; every park is held at
  `corridorMap`'s own value by reference (and the camera with it);
  `MOBILE_THOUGHTFORM_END` derived (no 0.30 literal survives in `sceneGeom`);
  `phonePaintProgress` monotonic, continuous, pinned at both ends, zero
  velocity at the plateau edges; the pixel table; the seats on the plateaus
  and nowhere else, tiling the scrub, `always` on exactly the four starts, no
  plateau taller than the cell; the two Arc passes inside two radii on every
  shape; `STAGE_SVH` equal to both stage declarations AND the reservation;
  the seats' sheet; the writer remaps only on the phone; the follower's
  detector reads RAW progress and the arithmetic that makes that safe; the
  seats mounted behind the fallback gate and the tier; the rail's
  click-to-navigate on the phone's seats.
- **`tests/visual/mobile-section-seams.spec.ts`**: the snap tables (both
  copies) carry the eight seats; the snap-stops case asserts `always` on the
  four starts and `normal` on the outs; **"the corridor's three beats seat,
  composed"** (seek each plateau's seat, settle, wait for the reveal follower,
  then title and caption at ≥ 0.90 / 0.95 opacity, scale within [0.97, 1.05],
  the title under the top chrome band, the caption over the bottom one, the
  title above the caption); **"every rest from the corridor's pin to the Build
  seat lands on a seat, a plateau or a named pass"** (the ADR-123 sweep in
  40px steps: no rest on nothing, the entry flight's un-pulled run ≤ 0.6vh,
  at most one un-pulled sample in either Arc pass).
- **`scripts/probe-mobile-lockin.mjs`** walks the eight seats and prints
  Blink's reach on `navigate`; `probe-thesis-mobile.mjs` sweeps the new dwell;
  `landing-corridor-smoke`'s `walkToArc` comment is re-derived (the phase band
  is 0.149–0.316 of the stage on every phone, shape-independent).
- **Desktop byte-identity**: `landing-page.spec.ts -g "HUD"` without
  `--update-snapshots`; `corridor-map.test.ts` untouched.

## Device checklist

1. Flick off the hero. The Thoughtform frame should stop dead with the curtain
   gone. Flick again: NAVIGATE arrives and STOPS — chrome row under the top
   bracket, sphere centred, caption card at the bottom — and it stays there
   while you nudge. Flick: ENCODE. Flick: BUILD. Never a half-frame.
2. Drag slowly out of a beat and lift mid-way: the page should settle back
   onto the beat or onto the next one, never rest between them. If Safari
   leaves it between them, that is WebKit's snap reach, and the `-out` seats
   are the dial.
3. On a beat, nudge the toolbar in and out: nothing should jump.
4. Scroll back up through the Arc: each flick up should land on a beat too.
5. Say whether the flight between beats is too quick (the passes are the
   knob), and whether hero → Thoughtform → Navigate should be one flick or two.

## Not done, and why

A smoothing library on touch (the reference smooths the wheel only; a JS
scroller on iOS re-implements what the OS does best); a `scrollend` glide (a
second motion owner — the 2026-07-15 ruling; `scrollend` is unreliable on
WebKit); `mandatory` snapping (root-wide, would change every station); a
shorter phone stage (`EPILOGUE_START` is shared with the desktop and ADR-116
tuned the epilogue on this length); an epilogue seat (not asked; the named
dial); a `modulepreload` of the corridor chunk.

## Left open

- WebKit's snap reach, and whether hero → Thoughtform → Navigate should be one
  flick (`always` off the thesis seat) — the device.
- The entry flight's ~450px un-pulled stretch, if a slow drag rests in it on
  the device: a shorter pass steepens the flight; a ninth seat mid-rise would
  seat a frame that is still moving.

## Update 1 (2026-09-25, owner) — the Arc travels again; the beats fill the frame

**His read, on the iPhone, with four stills of NAVIGATE / ENCODE / BUILD:**

> It looks better but … we lost a bit of the smooth scrolling … Now it just
> jumps from Navigate to Encode to Build without that smooth transition, which
> is the entire shtick of our website. Our brand is that we travel through the
> Latent Space and on desktop the scroll works very smoothly. … if you scroll
> from Build to "AI KPI Capability Your Team Owns," that's a smooth scroll. …
> we have so much unused space above and below … move that eyebrow above it a
> bit more toward the top and move the "Intelligence Becomes Capability" card
> down and slightly increase the size of the sphere … for all three parts of
> our arc.

**The decision (AskUserQuestion, same day): continuous travel, soft landings.**
The camera never stops; a SHORT dwell at each beat; the flight near the
desktop's pace; a flick glides through a pass; a rest near a beat settles onto
its composed frame; one-flick-one-beat comes off.

### The diagnosis, restated

The body above bought a landing with an 80svh HOLD and `always` seats, and the
price was the travel: each pass moved the whole park-to-park distance in
50svh — 2.57× the desktop's linear pace on the Encode pass (3.86× at the
smoothstep's peak), 3.12× / 4.68× on the Build pass — between seats that cut
every flick short. The epilogue, which ADR-125 left alone, is plain linear
scroll smoothed by the follower with no seat until `#services`: that is the
"smooth scroll" he pointed at, and it is the benchmark.

And the beats were composed at ONE frame height. The straddles were world
units tuned at 390×844 while the DOM clusters are fixed px, so on the frame he
photographs most (the toolbar-shown ≈390×676 — the cell is `100svh`, the SMALL
viewport) the Build title sat ~118px under the top and the caption ~96px above
the bottom, and at 844 the Build title 159px down.

### 1 · The clock: dwells, cruise passes, one speed

`PHONE_CORRIDOR_LEGS = { thesisHold: 40, thesisRise: 60, dwell: 24, tail: 40 }`.
The three passes are DERIVED: the remainder (544.39 − 100 − 72 − 40 =
332.39svh) is split in the desktop's own paint ratios (Δ .2909 / .2364 /
.2864), so every pass runs at ONE speed — `PHONE_PASS_SPEED` = 0.002448
paint/svh = **1.333× the desktop's linear pace** (pre-ADR-125 the phone flew
at 1.27× and nobody called it a jump).

| leg           | svh    | from the pin  | paint                | ease   |
| ------------- | ------ | ------------- | -------------------- | ------ |
| thesis-hold   | 40     | 0–40          | 0                    | hold   |
| thesis-rise   | 60     | 40–100        | 0 → `DOLLY_HOLD_END` | linear |
| pass-navigate | 118.84 | 100–218.84    | → `.navigate`        | cruise |
| **NAVIGATE**  | 24     | 218.84–242.84 | held                 | hold   |
| pass-encode   | 96.56  | 242.84–339.40 | → `.diagnostic`      | cruise |
| **ENCODE**    | 24     | 339.40–363.40 | held                 | hold   |
| pass-build    | 116.99 | 363.40–480.39 | → `.intelligence`    | cruise |
| **BUILD**     | 24     | 480.39–504.39 | held                 | hold   |
| tail          | 40     | 504.39–544.39 | → 1                  | linear |

- **`ease: "cruise"`** — a sine ramp in over `PASS_RAMP = 0.25` of the pass, a
  LINEAR middle, a sine ramp out; peak factor `k = 1/(1 − 2e + 4e/π) = 1.222`,
  so the peak is **1.63× desktop** (smoothstep would be 2.0×, smootherstep
  2.5×). Zero velocity at both dwell edges — a slow drag never clicks off a
  beat — and the middle half of every pass IS the desktop's linear grammar.
  `passPeakFactor(ease)` is exported for the test and the teleport arithmetic.
- **Why 24svh:** ≈200px at 844, a thumb nudge; **shorter than one Blink radius
  (~vh/3)**, so every rest inside a dwell is pulled onto its seat and no
  un-pulled dwell frame exists (the 80svh plateau had 115px of un-pulled
  middle); 3×24 is what the budget spares at 1.33×. The thesis 40+60 is kept.
- ⚠ **"Nothing lettered inside a pass" no longer holds, by design**: the title
  fades on the desktop's own `depthFade` windows — fully opaque from ≈28svh
  before the seat through the dwell to ≈26svh past it. A rest outside a seat's
  reach shows a mid-flight frame: that is TRAVEL, and a nudge lands the beat.

Pixel budget (seat = dwell start → end; 1svh = 8.44 / 6.76 / 9.32px):

| frame   | NAVIGATE  | ENCODE    | BUILD     | corridor | passes px         |
| ------- | --------- | --------- | --------- | -------- | ----------------- |
| 390×844 | 1847–2050 | 2865–3067 | 4055–4257 | 4595     | 1003 / 815 / 987  |
| 390×676 | 1479–1642 | 2294–2457 | 3247–3410 | 3680     | 803 / 653 / 791   |
| 430×932 | 2040–2263 | 3163–3387 | 4477–4701 | 5074     | 1108 / 900 / 1090 |

### 2 · The seats: four, `normal`, on the dwells

`CorridorPhoneSeats` renders FOUR — `thesis`, `navigate`, `encode`, `build` —
all `start`, all `normal`, at each dwell's START, the box the dwell itself
(thesis 40) under `SEAT_BOX_MAX_SVH`. The `-out` twins are deleted (a dwell's
last frame is inside its seat's radius, and a seat deeper in a 100svh pass
would seat a moving frame); `stop` comes off `PhoneCorridorSeat`, the
`data-corridor-stop` attribute and its `always` rule are deleted. **No
`always` anywhere on the corridor.** Hero → thesis: a medium flick lands in
the thesis seat's radius or its 40svh hold (paint 0 either way); a hard flick
can pass it — the desktop's own behaviour; `always` on the thesis seat alone
is the named dial if the device shows the opening skipped.

⚠ **THE RADIUS TEST INVERTS**: every pass is `> 2·vh/3` on every shape (a
mid-pass rest is travel) and every dwell `≤ vh/3` (every dwell rest is pulled
onto the composed frame). The seams sweep is re-cut as **"every rest within
reach of a park seat is pulled onto it; every other rest is travel"** — no
rest may land on nothing; the reach actually measured is attached as the
record for the device read.

### 3 · The composition: derived straddles, a solved sphere

The anchor declares a phone seat; the tracker derives a world-Y straddle per
resize; a three-free registry carries it; `stationHeaderPosition`'s mobile
branch reads it with the old literal as the fallback. Desktop byte-identical.

- New `lib/home-v2/phoneStraddle.ts`: `PHONE_SEAT_AIR_PX = 12`;
  `phoneStraddleWorldY({ edge, vh, seatLinePx, clusterPx, scale, centreY,
pxPerUnit })` — for `edge: "top"` (origin `bottom-center`) the anchored edge
  is `seatLinePx + clusterPx·scale`, for `"bottom"` (origin `top-center`) it is
  `vh − seatLinePx − clusterPx·scale`; the straddle is `(centreY − anchoredY) /
pxPerUnit`. `phoneSphereScale()` solves the sphere; `read/write*` is a `Map`
  with the literal as the fallback until the first derive.
- `useWorldDomTracker.ts`: `WorldAnchor.phoneSeat?: { edge; parkProgress;
base(t) }`. `derivePhoneSeats()` runs on resize (and when a seated element
  first mounts), gated `isMobileComposition()`: a SCRATCH camera synced to
  `parkProgress`, `base(park)` projected for `centreY`, `pxPerUnit` from the
  projection of `base + 1 unit`, the cluster's `offsetHeight`, and the seat
  line from two hidden probes (`.home-v2-copy-seat--top/--bottom`, height =
  the chrome band + `--corridor-seat-air`) — the seat stays derived from the
  chrome's own tokens. No per-tick layout read. The record is published as
  JSON on `.home-v2-copy-layer[data-phone-seats]` for the smoke.
  ⚠ Project the anchor's OWN pose, not `parkDistance − 0.1`:
  `diagnosticApproach` ends at .66, so at the Encode park the title still sits
  −0.085 deeper; the projection absorbs that and the lookAt bob.
- `sceneGeom.ts`: the six anchors read `readPhoneStraddle("navigate.title",
2.0)` etc. (fallbacks 2.0 / −1.8 · 1.7 / −1.5 · 1.65 / −1.35 — the old
  literals) and declare `phoneSeat`.
- **The sphere is SOLVED per frame, capped.** `mobileGyroSphereScale()` reads
  the registry: `clamp(1.1 × (tightestHalfBand − air) / ringPxAt1.1, 1.1,
MOBILE_GYRO_SPHERE_SCALE_MAX = 1.3)`, the tightest of the three beats' free
  bands between the title's bottom and the caption's top. A constant would be
  +5 % at 676 (which would not read as "slightly bigger") and +57 % at 844
  before a cap. The cap is the dial the still decides; `gyroAssemblyWorldPosition`
  folds the factor in so the weld is true.

**Measured (the seams' composed case, Chromium, both frames):**

| beat @ frame | title top / bottom | caption top / bottom | straddles (title / caption) | sphere y · ring px at 1.1 · fit |
| ------------ | ------------------ | -------------------- | --------------------------- | ------------------------------- |
| navigate@844 | 67.4 / 193.7       | 639.9 / 774.5        | +2.26 / −2.26               | 417.3 · 149.4 · 1.30            |
| encode@844   | 67.7 / 172.1       | 659.2 / 775.2        | +2.54 / −2.46               | 419.7 · 148.9 · 1.30            |
| build@844    | 69.0 / 174.3       | 641.8 / 777.3        | +2.57 / −2.16               | 427.4 · 148.6 · 1.30            |
| navigate@676 | 67.6 / 193.9       | 472.3 / 607.0        | +1.77 / −1.75               | 334.2 · 119.7 · 1.16            |

The title's top sits on the top band + 12 (68) and the caption's bottom on the
bottom band − 12 (vh − 68) within 4px on every beat and both frames; the
ring clears both clusters by the air; opacity ≥ 0.925, scale within 2 % of 1.

### 4 · Two things found on the way

- ⚠ **THE LANDING'S SCROLL MEMORY REPLAYED A RECORD FROM ANOTHER FRAME HEIGHT.**
  ADR-123's `scrollMemory.ts` stored `vh` from the first day and `shouldRestore`
  read only `vw`, so a rest at 390×844 replayed into a 390×676 boot ~2 s in
  and moved the page 1768px — onto the Build seat — under the seams test, which
  read it as a seek that "settled on the wrong seat". Both axes are checked
  now (`SCROLL_MEMORY_ROTATION_PX` on `vh` too; `layoutViewportHeight()` is
  the small viewport on iOS, so a toolbar transition is NOT a height change).
  Recorded at ADR-123 §Part 1 too.
- ⚠ **A SEEK THAT ACCEPTS ANY SEAT ACCEPTS THE WRONG ONE.** `seekTo` counted a
  landing on a seat 953px past the ask as settled; it takes only a seat within
  half a screen of the ask now.

### Guards

`phone-corridor-clock.test.ts` rewritten (17): the legs, one speed in
[1.2, 1.5] (record 1.333), the cruise's properties, monotonic + velocity-
continuous with the peak `k·Δ/L`, dwells that land softly, the pixel budget,
the 844 record, four seats with no `stop`, the inverted radius law, the CSS
pins (no `scroll-snap-stop`, no `data-corridor-stop`), the teleport pin. New
`phone-straddle.test.ts` (9). The seams spec: the snap tables lose the `-out`
entries, the sweep is re-cut, the composed case runs at 844 and 676 and
asserts the seat lines and the ring's clearance off the tracker's record.
`scroll-memory.test.ts` pins the height check.

### Device checklist (U1)

1. Flick off the hero: the Thoughtform frame stops; flick again and the
   corridor TRAVELS — the sphere flies, the title fades in as Navigate
   approaches, and the page settles onto the composed beat if the flick ends
   near it, or rests mid-flight if it does not (a nudge lands it). Same for
   Encode and Build. Say whether the flight reads as the desktop's pace.
2. On each beat: the eyebrow + title just under the top readout's row, the
   caption card just above the theme switch's row, the sphere larger — on both
   the toolbar-shown and toolbar-hidden frames.

### Left open after U1

- `always` on the thesis seat (the opening skipped by a hard flick — a dial).
- `MOBILE_GYRO_SPHERE_SCALE_MAX` 1.3 (the sphere reads too big or too small on
  the device — one number).
- The passes' 1.333× (too quick or too slow — `PHONE_CORRIDOR_LEGS.dwell` and
  the tail are the other two terms of the same budget).
