# ADR-121: The musings row opens on hover

- **Status:** Proposed (2026-09-23) — shipped and guarded, pending the owner's live read.
- **Surface:** `#musings` — the homepage's writing station, between the era stage
  and the footer.
- **Supersedes:** [ADR-119](119-the-musings-rack.md) **on the form** — U0's rack,
  U1's shelf and U2's tipped 3D row with a scroll detent are all retired. Everything
  else in that record stands: the station and its transparent stage (U1 §1), the
  cover lockstep, the footer's bed (ADR-105 U3), the head's decode (U2 §1), the
  aperture (U1 §4), the notch, the cover record, the type fixes (U3).
- **Rules:** [`.claude/rules/musings.md`](../../.claude/rules/musings.md),
  [`.claude/rules/landing-v7.md`](../../.claude/rules/landing-v7.md)

## The ask

Owner, 2026-09-23, on ADR-119 U2 read live:

> What we currently have looks ugly, so I want to remove the jukebox carousel thing
> because it's not working. I just want to do something simpler. [Lighthouse HQ's]
> cards collapse open when you hover over them … repurpose them and make them fit
> for our design language. This means that they should have that sort of
> glass-like effect, a notch, etc. … properly scope it, and then remove any dead
> code. I still want that glitch effect on the texts.

And in session: at rest the **newest post is open**, and there is **no timer**.

## The decision

The row is a flex row. Every card is a strip (`flex: 0 0 --mu-closed`); the one
under the pointer — or under keyboard focus — takes the band's free width
(`flex-grow: 1`, transitioned); the rest stay strips. The newest post is open at
rest and the writer moves ONE attribute, `data-mu-open`, on `pointerover` /
`focusin`, putting it back on `pointerleave`. The card is the proof card's folder
skin at card scale: glass at .62 with a blur on the stage rung, the flat gold lip
rising to the whole line on the open card, the scanline under the copy, a bloom
stated in pixels, one top-right notch on the evenodd ring. The head still decodes
in place on the services masthead's clock and the cards still arrive on the
centre-out aperture after it. The runway is one dwell. Nothing 3D survives.

## The reference, measured

Lighthouse HQ's customer row, read off its live DOM:

```
.customer-carousel      display:flex; gap:10px
.customer-card          flex: 0 0 120px; height 445px; overflow:hidden; border-radius 5px;
                        transition: flex-grow 1.1s cubic-bezier(0.19, 1, 0.22, 1)
.customer-card--active  flex-grow: 100        (JS moves the class on pointer + a timer)
inactive media          filter: brightness(.82) saturate(.82)
.customer-card__tag     the pill, visible on the active card only (keyframe in 360ms)
≤900px                  the row becomes a horizontal scroll-snap rail
```

The mechanic is ONE property. Everything the house adds — the glass, the notch,
the lip, the fixed cover band, the un-reflowing body — is material and
composition; the motion is the reference's, re-solved.

## Why it is built this way

### ⚠ ONE TRANSITIONED PROPERTY, AND THE DIAL IS THE REFERENCE'S CURVE RE-SOLVED

`.mu-card { flex: 0 0 var(--mu-closed); transition: flex-grow var(--mu-grow) }`,
`.mu-card[data-mu-open] { flex-grow: 1 }`. Mid-grow the two cards' grows sum to
one, so the free width is always fully distributed and no gap opens. Nothing is
posed, nothing is measured, nothing is written per frame.

`--mu-grow` is `900ms cubic-bezier(0.19, 1, 0.22, 1)` — the reference's expo-out
(1.1s there) for ~350px of edge travel here. ⚠ **THE APERTURE'S CURVE WAS
DELIBERATELY NOT COPIED.** ADR-097 U12's 720ms ease-in-out is right for an arrival
the reader did not cause: it is half-travelled at 360ms and readable end to end. A
pointer response wants an immediate start — the expo-out moves 84 % of the way in
its first sixth and settles over the rest, so the row answers the hand at once and
comes to rest without a snap. The house pair is the alternative for the owner's
read, and it is one token.

### ⚠ THE TEXT NEVER REFLOWS DURING THE GROW

The row is an inline-size container and publishes
`--mu-open-w: calc(100cqw − (n − 1) × (--mu-closed + --mu-gap))` — the width the
open card WILL have. Every card's body is laid out at that width once; the face's
`overflow: hidden` clips it while the card is a strip, and the grow UNCOVERS it.
Pure motion, no opacity, no reflow — the caption card's own law, and the
reference's own read: the strips show the head of each line. The capture proves
it the direct way: a Range's client rects are the LAYOUT, not the clip, so the
same title reports the same width from inside a strip and from an open card
(263.64px both ways at 1920×1247).

⚠ `cqw` resolves on the element that USES the value against its nearest query
container; a face or a card made a container would silently re-base it.

### ⚠ THE COVER IS A FIXED-HEIGHT BAND, AND THE GLYPH IS A FIXED SIZE

> ⚠ **Superseded by Update 1**: the BODY is the fixed, derived box now and the
> cover takes the rest; `--mu-cover-h` is retired, and the strip (so the glyph)
> may yield where the row cannot afford `--mu-closed`.

`--mu-cover-h` is 46 % of the card on every card, so five covers end on one datum
and all five kickers share a baseline across the row. The beat glyph is
`--mu-glyph` (52–80px), whole inside the narrowest strip with air either side; a
percentage would resize it through the grow. The date axis spans whatever width
the card has with the lit mark at its year fraction — the reference's own
behaviour, where the image re-centres as the card grows.

### ⚠ THE OPEN CARD IS ONE ATTRIBUTE, RENDERED BY REACT AND MOVED BY THE WRITER

React renders `data-mu-open` on index 0, so SSR, a page with no script and a
reduced-motion reader all show the finished row with the newest post open.
`useMusingsScroll` delegates `pointerover` / `focusin` on the row and moves the
attribute to the card under them; `pointerleave`, and a `focusout` that leaves the
row, put it back on card 0. One attribute write on an event, no `setState` — the
hook returns nothing now, because ADR-119's one piece of React state (the detented
front index) had nothing left to be. ⚠ The holder is QUERIED, never cached: the lab
re-keys the row when its count changes and a cached card is a detached one. ⚠ React
does not touch a DOM attribute whose prop has not changed, so the writer's move
survives every re-render this component will ever see. ⚠ The handlers are gated on
the rung, so the rail is byte-identical to what ADR-119 shipped.

### ⚠ EVERY CARD IS A REAL LINK AND EVERY CARD IS FOCUSABLE

ADR-119 gave cards 1..n `tabIndex={-1}` + `aria-hidden` so four invisible 3D planes
would not sit in the tab order — and on every parked rung the rail SHOWED those
cards while hiding them from the keyboard, an a11y bug from the first commit. There
is nothing invisible in a flex row: Tab from card 0 opens card 1 exactly as hover
does (measured), and a click on a strip navigates.

### ⚠ THE GLASS IS MEASURED, NOT ASSUMED — AND IT COSTS NOTHING MEASURABLE

ADR-119 banned `backdrop-filter` on this station for five OVERLAPPING 3D planes in
a `preserve-3d` context, each a backdrop snapshot a frame. A flat row of five
non-overlapping cards is one proof card's area of glass. So the material is the
proof card's: `--mu-plate` `rgba(--void-deep-rgb, .62)`, `blur(14px)` under
`@supports`, the flat lip `color-mix(in srgb, var(--gold-line) 30%, transparent)`
rising to `--gold-line` on the open card, the 1px/3px gold scanline under the copy,
and the bloom stated in PIXELS re-solved for a card that is 120px shut and ~650px
open (`260px 180px at calc(100% − 60px) −30px`; the proof card's `460px 300px`
lit a whole strip).

⚠ **ON THE STAGE RUNG ONLY** (`#musings[data-mu-mode="stage"]`): at 961–1100 the
station is opaque and a blur would re-snapshot every frame to frost its own stars.
⚠ **LIGHT DROPS THE FROST** (`theme.css` BLOCK 4g, BLOCK 4c's reasoning — the bed
is faded there), with a selector that mirrors the sheet's own, because the dark
rule is (1,4,0) and a lighter light selector loses on specificity whatever the
source order. ⚠ **AND LIGHT'S PANE GOES TO .9**, BLOCK 4d's reasoning one surface
over: on the light still the unfrosted .62 plate let the corridor's wireframe print
straight through the copy; parchment over parchment loses nothing at .9 and the card
reads by its lip, as the proof card does.

**Measured** (`capture-musings-row.mjs --perf`, a rAF-delta sampler while parked
and while the pointer sweeps every card twice, headed, over the live corridor at
1920×1247 dark, three cards): idle **0 % long frames** (319 frames, mean 4.7ms,
p95 8.3ms, max 12.5ms); hovering **0 %** (493 frames, mean 5.4ms, p95 8.4ms, max
16.7ms). The lab at five cards over its static bed: 0 % both, mean 4.2ms. The bar
was the proof card's recorded 15 %; the recorded fallback — the blur on the OPEN
card alone with the strips at .94 — was not needed and is not applied.

### ⚠ THE STATE IS THE RING AND THE KICKER, NEVER A FILTER

The reference dims its inactive cards with `brightness(.82)`. A large-area
brightness change on every hover is the class of motion ADR-097 U12 retired, so
the open card is told by its lip rising to the whole line and its kicker taking
the gold; the strips' kickers sit on `--mu-ink-3`. The row carries ONE gold line of
chrome.

### ⚠ THE RUNWAY IS ONE DWELL

`height: calc(100svh + var(--mu-dwell))`, `--mu-dwell: 60svh`. ADR-119 pinned the
stage for one step per card (42svh each plus a tail) because a detent needs scroll;
a hover row does not. The head's thresholds on `p` are unchanged; the arrival's
hysteresis moved to `lib/musings/arrive.ts` (the `arriveNext` lift ADR-119 U1
named as the follow-up) with `ROW_ARRIVE_IN` re-solved to 0.10 for the short dwell
(0.26 of 60svh would have held the cards shut for 16svh after the head had
resolved) and the close still at 0.95, before the head leaves at 0.965. On the
stage rung the station is ~1.6 viewports plus its 100svh band; ADR-119 U2 was
~3.2 at five posts.

### ⚠ THE PLACEHOLDER COPY LIVES IN A LAB, AND THE LAB IS A WINDOW

The row is designed for five and the landing has three, and the site is live: a
`draft: false` file in `content/musings/` publishes a page and a sitemap row. So
`/test/musings-row` mounts the PRODUCTION station — nothing re-drawn — inside the
real HUD frame with seven placeholder records (`placeholders.ts`, house-register
titles that are names, tags across the three Arc beats, dates across the year),
`?n=3|5|7`, `?theme=light`. The lab supplies the DOM the writer reads (a hidden
`#voidwalker[data-vw-mode="hologram"]` marker and `data-corridor-exit` on
`<html>`), so the station goes transparent under `home-v2.css`'s own promotion rule
and the glass has the lab's BED to blur — a fixed stand-in for the corridor's light.
The substrate lab's law: a window onto production, not a copy.

## What the guards found that a still did not, and the reverse

- ⚠ **A DEFINITE-WIDTH GRID ITEM GROWS AN `auto` COLUMN TO ITSELF, AND EVERY
  SIBLING IN THAT COLUMN STRETCHES WITH IT.** The body's `width: --mu-open-w`
  (~930px) set the face's implicit `auto` column's base size — an item whose
  preferred size is definite contributes its min-content size, and `min-width: 0`
  does not reach that — so the COVER, in the same column, was 930px wide inside a
  120px strip and its centred glyph sat 464px in: clipped, on every strip, with
  every other gate green. The capture's glyph-in-strip gate caught it on the first
  run; the face's column is `minmax(0, 1fr)` now (sized from the face's free space,
  the body overflowing it, which is the point), and the capture asks the direct
  question too: every cover is its card's width.
- ⚠ **`elementFromPoint` AND `elementsFromPoint()[0]` AGREE ON EVERY PROBE POINT
  NOW.** ADR-119 found them disagreeing inside the 3D context (the singular form
  returned the `preserve-3d` ancestors). With no 3D context left the capture reads
  both on all five points and reports agreement: `tl tr bl br mid` all `y`, at
  every viewport. The plural form stays the one the gate uses.
- ⚠ **THE MECHANICAL GATE ON THE LAB WITHOUT `--prm` IS A VOID.** The gate does
  not scroll; the lab's station begins a viewport down and its head is blank until
  the stage parks, so `--scope ".mu"` yields no text and the gate says so
  (`MECHANICAL VOID`). Under `--prm` the writer parks, the rail shows and the head
  is whole: that is the reading.
- ⚠ **A SOURCE RATCHET READS COMMENTS.** The new test's "no `tabIndex`" assertion
  failed on the card's own header, which quotes the bug it fixed. The ratchet
  strips comments before it matches, as `theme-css-sweep`'s prose trap already
  taught one sheet over.
- **The still at 1920×1247** reads as one column — the head, the row, the way out
  on the band's left edge — with the open card at 928px beside two 120px strips
  showing "7 SEP 2026 ·", the glyph, the lit mark and the head of each line. The
  light still, before the pane went to .9, showed the corridor's wireframe through
  the copy; after, the card reads by its lip.

## Deleted

`lib/musings/rowMath.ts` (the pose, the seat, the tilt, the detent, the reading
band, the near-edge floor, `ROW_*`); the writer's pose loop, its per-card
`transform` / `z-index` / `data-mu-tilt` writes, its `front` state and `frontRef`,
its return value; `MusingCard`'s `isFront`, `tabIndex`, `aria-hidden`,
`data-mu-card`, `--mu-i`, `cardRef`; the station's `setCard` / `cardsRef` and the
`.mu__window > .mu__rig > .mu__rack` wrappers; the sheet's 3D rung (the window
mask, the rig, the rack seat, the transform transition, the centred foot),
`--mu-step`, `--mu-tail` and its off-stage restore; `MUSINGS_RACK_MAX` →
`MUSINGS_ROW_MAX` and two stale comments (`MUSINGS_STEP_SVH`, `RACK_DEPTH` never
existed; `musings-shelf.test.ts`); `scripts/capture-musings-rack.mjs` →
`capture-musings-row.mjs` with the pose / tilt / centring / detent / fade gates
gone. Every remaining reference (`rowMath`, `rowPose`, `mu__rack`, `mu__rig`,
`mu__window`, `muTilt`, `data-mu-front`, `MUSINGS_RACK`) was grepped across the
repo and fixed; the seams spec's `NOT_SNAP_AREAS` names `.mu__row`.

## Guards

- `tests/lib/musings-row.test.ts` — rewritten, 51 cases: the arrival's hysteresis
  (re-solved, closing at 0.95 before the head leaves), the head's clock and the
  cover's arithmetic (unchanged), and the source ratchets — the rung mirrored, the
  mechanic ONE transitioned `flex-grow`, nothing 3D anywhere (no `perspective`,
  `rotate*`, `translateZ`, `preserve-3d`, the only `mask-image` the masthead's
  own), `data-mu-open` on index 0 and every card a real link, `--mu-open-w` solved
  from the same tokens the strip and the gap use, the writer moving one attribute
  on four events with no `useState`, the glass on the stage rung only with light's
  BLOCK 4g out-ranking it, the state a ring and never a filter, one flex row with
  the cards as direct children, the runway one dwell, the aperture's three-host
  lockstep, every row rule gated on the stamp AND the rung, three clears of
  `data-ft-reveal`.
- `scripts/capture-musings-row.mjs` — headed, real scrolls: PASS at 1920×1247 dark
  (with `--perf`) and light, 1280×720 dark, 390×844 dark, and `--lab --n 5` at
  1920×1247 in both themes. Gates: the band's opaque ground; the head blank off
  the pin and whole through the dwell; the arrival in at 0.45 and out at 0.99; rest
  = card 0 open at ≥ 3× a strip; hover card 2 opens it inside the grow and
  collapses card 0; leaving restores card 0; Tab opens card 1; the title's laid-out
  width equal open and closed; every cover one height and its card's width, every
  glyph whole in its strip; glass on every face on the stage rung in dark, none in
  light, none under reduced motion (a second context); the TR-only notch
  hit-tested from both ends with the singular/plural agreement reported; the bed
  armed on the band and the readout MUSINGS at every stop; the footer uncovering
  (561 → 1247); the type floor; `--perf`.
- `about-voidwalker-handoff-boundaries` 8/8 (`--workers=1`) ·
  `services-ring-smoke` 11/11 on desktop · `mobile-section-seams` 14/14 on both
  iPhone projects · `landing-page -g "HUD"` 2/2 **without** `--update-snapshots` ·
  `capture-site-footer` at 1920×1247 dark: `plateIsStation true`, band left 357,
  G3 pass — the bed did not move · `mechanical.mjs --scope ".mu" --prm` on the
  landing: the SIX known findings in dark and in light (the title glow ×5, the
  coord stamp at 1.43 / 1.40:1) and no seventh, and the same six on the lab
  under `--prm` (without it the gate is a VOID — it does not scroll) · the eight vitest suites the plan
  names, 214/214 · `tsc` clean · `npm run lint` 337/337 (at the ratchet, no new
  warning).
- The four cover-lockstep readers all still name `.mu__band` and none moved.

## Left open

- **Three posts.** The row reads best at five; at three the open card is 928px of
  the 1200px band and the two strips read as afterthoughts. The writing track
  produces the real notes; the lab shows the row at five and seven meanwhile.
- **Touch on a ≥961 device.** A tap fires `pointerover` and the click together, so
  it opens and navigates in one gesture. A first-tap-opens rule is a decision for
  the owner's read, not taken.
- ~~**The open card's lower air.** The card is `clamp(336px, 52svh, 464px)` tall and
  a one-sentence summary at 56ch fills ~100px of the ~250px body, so at the
  owner's viewport ~150px of plate sits under the lede. The fixed height is what
  keeps the strips one height; a shorter card or a longer summary are both dials.~~
  → **Resolved by Update 1**: the slack is the cover's now.
- **The grow's curve.** The reference's expo-out at 900ms is what shipped; the
  house's 720ms ease-in-out pair is one token away for his read.
- **The light pane at .9** is a read, not a number to tune blind.
- **The `.mu` gate's six known findings** (the glow, the coords) stand as ADR-119
  U3 recorded them.
- **The bloom on the strips**: every card carries it at its top-right, so each
  strip's top catches a little light. Uniform material by intent; the open card
  alone is the alternative.

---

## Update 1 — the body seats its copy, and the band yields to the telemetry (2026-09-23)

Two composition defects on the committed row, both read off ADR-121's own
stills by the coordinating session the same morning, both fixed here.

### 1 · The open card pooled its slack in the body

The cover was a fixed 46 % band and the body took the other 54 % of a
`clamp(336px, 52svh, 464px)` card, so a two-line lede sat over a hole: this
station's recorded mis-seat (ADR-119 §composition — air around a composition is
room, air inside one is a mis-seat; ADR-070 U24 — bare field under the content
reads as a hole). The slack belongs to the COVER, which is material.

- **The body is a derived box.** On the row the face's rows are
  `minmax(0, 1fr) var(--mu-body-h)`, and `--mu-body-h` is the body's rule, its
  padding, ONE kicker line, ONE title line and `--mu-lede-lines` (3) of lede,
  each at the line-height its own rule declares. The cover takes everything
  else. Every body is the same box, so every cover ends on one datum and every
  kicker starts on one line across the row — by construction, where the fixed
  cover band had it by coincidence.
- **The tokens ARE the declarations.** `.mu-card__body`'s padding, gap and rule
  and the three text rules' line-heights read `--mu-body-*` / `--mu-*-lh`, so
  the calc and the rules cannot drift; the kicker's line-height is declared
  (`1.3`) because `normal` is a font metric no calc can read.
  `musings-row.test.ts` pins both halves.
- **Three lines is the budget, not a guess.** `musings-registry` caps a summary
  at 220 characters, ~98em of PP Neue Montreal (mean advance 0.446em, measured
  on the live copy), and three lines of the 34em measure hold 102em. The lede's
  clamp is `var(--mu-lede-lines)` — a belt at exactly the reserved capacity that
  no shipping copy can reach, and the capture reads every lede UNCLAMPED (a
  clone, the casefile's method) to prove it.
- **The measure is held, so a lede's line count is a property of the copy.** The
  title and lede sit in `--mu-measure` (34em of the lede's face ≈ the 56ch they
  had, stated through `--mu-copy` because `ch` would resolve against whichever
  element substituted it), and the open card may never drop under
  `--mu-open-min` = the measure plus the body's inset. At seven posts, or on the
  961–1100 rung, a fixed strip would squeeze it: so the strip is now
  `--mu-strip = clamp(2 × inset, (100cqw − open-min) / (n − 1) − gap,
--mu-closed)` — `--mu-closed` wherever the row affords it, narrowing where it
  cannot. It depends on the row and the count, never on which card is open, so
  it is constant through the grow and `flex-grow` stays the one transitioned
  property. The glyph yields only with it: `min(--mu-glyph, strip − inset)`.

| viewport · host     | body (px) before → after | bare plate under the lede (px)     | pooled beyond padding + reserved lines |
| ------------------- | ------------------------ | ---------------------------------- | -------------------------------------- |
| 1920×1247 · lab ×5  | 250.6 → 172.5            | 123.6 → 47.9                       | 67.1 → 0                               |
| 1920×1247 · landing | 250.6 → 172.5            | 123.6 → 47.9                       | 67.1 → 0                               |
| 1440×800 · lab ×5   | 224.6 → 135.3            | 123.5 → 36.3                       | 79.9 → 0                               |
| 1280×720 · landing  | 202.2 → 128.9            | 106.2 → 34.9 (Encode: 87.8 → 16.5) | 64.5 → 0                               |

The cover grows by what the body gave up (213.4 → 291.5px at 1920×1247). The
47.9px left under a two-line lede is its 22.5px of padding plus the one line it
reserves and does not use; the three-line Encode lede fills its capacity to the
padding. Kickers on one line at every viewport, before and after.

**The narrowest open card** (lab, seven cards): at 1280×720 the strips yield
96 → 71.2px so the open card holds 477.9px against a 477.8px floor, every lede
at two lines and every title at one; at 1920×1247 they yield 120 → 86px. ⚠ **The
envelope's edge is seven posts at the 961px rung**: 28px strips (the floor) and
a 14px glyph — legible, and degenerate, because the measure is held first and
the strips pay. Fixed strips there would push the longest live lede (Encode,
168 characters) past the three lines its body reserves. At n ≤ 5 from 1280px
nothing yields at all.

### 2 · The last card ran under the right rail's telemetry

ADR-119's tipped row had an edge FADE ending 3 % inside its window precisely so
no plate lay under the right rail's readouts; the flat row deleted the fade and,
silently, the job it was doing. Measured: the last card's right edge ran
**25.4px under SECTOR ··· 06/07 at 1280×720 and 13.7px at 1440×800**.

- **The band's end is derived from the frame's own geometry.** The readouts
  (`rail-instruments.css` `.rin-tele`) hang `--hud-rail-guide-inset + 8px` in
  from the right rail's outer edge, which sits `--hud-margin` in from the frame,
  and read inboard; their type is fixed-size, so their width is a constant of
  the frame — SECTOR is 6 × 6.4 + 34 + 5 × 7 = 107.4px (measured 107.41 at 1280,
  1440 and 1920). `--mu-band-end = max(0px, --mu-tele-reach + --mu-body-pad-x −
--band-margin)` goes on the HEAD's and the ROW's inline-end margin, so the
  composition keeps one right edge; it is ZERO from ~1560px up (the owner's 1920) and gated on `html[data-rail-instruments]`, the stamp the readouts'
  component writes. The test re-derives the 107.4px from the frame's own
  declarations, so a readout that grows fails the unit suite before the capture.
- ⚠ **The last 3px are the scrollbar's.** Every station is 100vw, centred
  across the page's 6px scrollbar; the rail is fixed to the visible frame. So
  the band sits half a scrollbar nearer the readouts than `--band-margin` says.
  Without the term the capture measured **11px** at 961×720 against its 12px;
  with it the air is exactly one card inset. (BEST-PRACTICES records the class.)
- The head yielding with the row changes no wrap: the brief's 42ch box is
  narrower than its column at every rung (checked on the 1440 still, three
  lines before and after).

| viewport · host    | the last card's clearance to the leftmost readout (px) |
| ------------------ | ------------------------------------------------------ |
| 1280×720 · landing | −25.4 → **+17.9**                                      |
| 1440×800 · lab ×5  | −13.7 → **+20.1**                                      |
| 1920×1247 · both   | +187.6 → +187.6 (no inset)                             |
| 961×720 · lab ×7   | → **+14.0** (11.0 before the scrollbar term)           |

Held at rest, on hover and on Tab (the last card's right edge is the row's in
every state).

### What the guards found

- **The new gates failed on the committed CSS first**, on exactly these two
  defects and nowhere else, which is what makes their passing mean something:
  pooled slack on every card at 1920, 1440 and 1280, and the clearance at 1280
  and 1440. The capture prints both numbers now — "bare under the lede" and
  "clearance".
- **The rung floor found the scrollbar.** A gate that compares two token
  expressions would never see it; the capture compares painted rects.
- **A test's own lookup was wrong once**: it destructured a regex's full match
  where it meant the selector group, and failed — correctly — on a rule that was
  there. Fixed in the test, not the sheet.

### Guards

- `musings-row.test.ts` 51 → 55: the strip yields (the clamp, the floor, the
  glyph, the measure); the body is a derived box (the calc, both halves of the
  token/declaration pair, the face's rows, the cover carrying no height, the
  belt at the capacity, `--mu-cover-h` gone); the capacity holds the registry's
  budget (read from `musings-registry.test.ts`); the band's end is derived (the
  readout's width re-derived from `rail-instruments.css`, the scrollbar from
  `landing.css`, the `max(0px, …)`, the head-and-row rule under
  `data-rail-instruments` on the rung).
- `capture-musings-row.mjs` gains: no plate pooled under any lede beyond its
  padding and reserved lines, every kicker on one line, every lede within its
  reserved lines UNCLAMPED, every title on one line, the open card at its
  measure or wider, and every card ≥ 12px clear of the leftmost readout at
  rest, on hover and on Tab.

### Left open

- **Seven posts on the 961–1100 rung** is the envelope's degenerate corner
  (above). Capping the visible count per rung is the alternative, not taken
  without the owner's read.
- **The PRM rail at desktop widths** still takes ADR-119's composition: its
  cover keeps the 16/10 aspect (so a little body slack remains there) and its
  scroller is not on the band, so it keeps its own relationship to the
  readouts. Neither was in scope; both are one rule away.

---

## Update 2 — the head hangs from the services line (2026-09-23)

Owner, on the row read live:

> The placement of the hero one, the H1, and the paragraph is off. The reference
> is the services section, where you see "AI capability your team owns" and then,
> on the right side, you have the paragraph. It's more like it's on top, whereas
> with Musings it's more down.

### The defect

ADR-119 copied the services masthead's TYPE and its survey chrome, rung for rung,
and never copied its SEAT. `.services-masthead__lead` and `__intro` both hang from
`top: var(--masthead-top)`, which is `--band-top` plus a 0px trim: a fixed line at
~11.5svh (136px at 1920×1247, 82.8px at 1280×720). The musings stage instead
centred its three rows as ONE group (`align-content: center`, ADR-119's
composition pass — the fix for a `1fr` middle row that pooled 205px between the
masthead and the cards). Centring answered that defect and created this one: the
head sat wherever the cards below it left room.

| viewport  | title top, before | `--band-top` | title top, after |
| --------- | ----------------- | ------------ | ---------------- |
| 1920×1247 | ~287px            | 136          | **136**          |
| 1280×720  | ~89px             | 82.8         | **82.8**         |
| 961×720   | ~89px             | 82.8         | **82.8**         |

It also drifted with the frame's height: the card caps at 464px and the frame
does not, so the taller the window the lower the head. The brief carried a stray
`padding-top: 6px` besides — inherited from `.arc-head__intro`, the in-flow copy
this head was taken from; services has none.

### The ruling

- **On the pinned rung the stage hangs from `--band-top`.**
  `.mu[data-mu-ready] .mu__stage { align-content: start; padding-block-start:
var(--band-top) }`, inside the row rung's media block. `.proof__report` is the
  in-flow precedent (`padding-block: var(--band-top) …; align-content: start`).
- ⚠ **KEYED ON THE STAMP, NOT ON `data-mu-mode="stage"`.** The pinned stage exists
  from 961px (`data-mu-ready`), and the services masthead sits on this line across
  961–1100 too; keyed on the transparent mode, the head would take two seats
  depending on whether the corridor is alive.
- **The base rule is untouched.** It still centres three `auto` rows, which is
  right for the flowing rail (≤960, reduced motion, no script), where the stage is
  as tall as its content and centring does nothing. ADR-119's no-`1fr` law
  survives: the surplus pools BELOW the way out, where it is frame.
- **The brief's 6px is deleted**, with the ≤900 block's `padding-top: 0` that
  existed only to undo it. The brief's box now starts on the title's (measured
  equal to the 0.1px at 1920×1247, 1280×720 and 961×720). The phone was already
  at 0; only the 901–960 rail moves, 6px up, onto the services seat.

### Guards

- `musings-row.test.ts` 55 → 56: the rung's stage is `start` on `var(--band-top)`;
  the base rows stay `auto auto auto` with no `1fr`; the brief carries no
  `padding-top`; and **the services half of the link** — `.services-masthead`
  still derives `--masthead-top` from `--band-top` with a `0px` trim, because a
  trim there would split the one shared line in silence.
- `capture-musings-row.mjs` resolves `--band-top` through a probe box (a custom
  property is a string until something lays it out) and gates, on every rung
  above the phone: the title's top is `--band-top` below the stage's (±0.5px),
  the brief starts on the title's line above 900px, and the way out ends inside
  the frame. It prints the designation's y against the TL bracket and the nav
  corner, which the raised head now sits beside (1280×720: designation 48.8,
  bracket bottom 66, nav bottom 68 — beside, not under; the chrome hangs at
  x 126 and the bracket ends at x 66).

### Left open

- **The floor.** With the head raised, ~435px of frame pools under the way out at
  1920×1247 (way out bottom 812 of 1247), ~100px at 1280×720. That is the room
  the gallery below the head is being redesigned to use —
  `/test/musings-gallery`, the directions lab — not something to solve here by
  stretching the card.
- **Three type differences from the services masthead are recorded, not
  changed** (he asked about placement): the brief's ink is `--mu-ink-2` (.74)
  where services runs full `--dawn`; services caps its paragraph at
  `min(42ch, 34vw)` where this is `min(42ch, 100%)`; and the survey chrome's
  tracking is on the role tokens (0.15em / 0.08em) where services carries its
  older literals (0.18em / 0.2em / 0.1em).
