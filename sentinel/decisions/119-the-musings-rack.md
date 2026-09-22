# ADR-119: The writing is a rack you flip through, and the footer becomes a bed

- **Status:** Proposed (2026-09-22) — shipped and guarded, pending the owner's live read.
- **Surface:** the homepage's ending — `#voidwalker` → **`#musings`** → `#contact`
- **Supersedes:** ADR-105 on the corridor's cover only (`#contact` gives the role up;
  its composition and geometry are untouched). Carries **ADR-105 Update 3**.
- **Rules:** [`.claude/rules/musings.md`](../../.claude/rules/musings.md),
  [`.claude/rules/landing-v7.md`](../../.claude/rules/landing-v7.md)

## The ask

Owner, 2026-09-22, two asks in one breath:

> I want to build a new section after the era section … an amusing section where I
> want to showcase the different blog posts I made. And I want the card at the
> centre to be like the blog post in view … I want the other blog posts to be like
> a carousel, a sort of jukebox-type thing where the other articles are actually
> rotated along the x-axis. That way we see the sides and it really feels like
> you're scrolling through a digital folder. The card for the blog post in view
> should be super clean and nice — a thumbnail, a title, and a summary — and I want
> this to come into view when you scroll away from the era section.

> After that section, we have the contact section. Right now the effect isn't
> exactly what I want. I want the footer, like the general intelligence company's
> footer, to be visible and parallaxed. That needs to be fixed, and the musings
> section needs to scroll over it.

He supplied the Cyberpunk 4ST store panel as the reference for the CARD and said
in the same message that its motion is **not** the reference, and
generalintelligencecompany.com for the footer.

**Three rulings taken in session:** the posts live on-site as MDX and the cards
point at `/musings/<slug>`; the thumbnails are **drawn in code** (no photography,
no image-API spend); the station **pins** and each scroll step advances one card.

## The decision

One new station, `#musings`, between the era stage and the footer: a masthead on
the editorial band, a five-deep CSS-3D rack of post cards, one way out. And
`#contact` stops being the corridor's opaque cover so it can be **held at the
frame's floor and uncovered** as the rack scrolls over it.

**The two asks are one change.** The footer could not be held while it was the
cover — `home-v2.css` gives the cover `position: relative; z-index: 6` during the
exit band, and a cover cannot also be the thing being uncovered. The rack is the
first opaque station below the corridor now, so it takes that role by POSITION
rather than by choice, and taking it is what frees the footer.

## Why it is built this way

### ⚠ THE RACK IS A LIFT FROM ARCHIVED PROTOTYPE CODE, AND THREE THINGS CHANGED

`components/landing/latent-cases/CaseOrbitStage.tsx` already solved this exact
composition in CSS 3D — `DepthGatewayScene/index.tsx:261` calls it "the _archived_
latent-cases topology" and its only consumer is `/test/latent-cases`. The slot
table, the wrap, the stacked plane the rack assembles out of, the per-card entry
stagger and the arrival blur all transfer. What did not:

1. **It is DATA, not a render.** `useLatentCaseScroll` calls `setState` inside a
   rAF on every scroll event — a React re-render across every card, every frame,
   on a page running a WebGL corridor two stations up. ADR-002's law is one writer
   publishing CSS custom properties, so `lib/musings/rackMath.ts` is pure and
   three-free and `useMusingsScroll` assigns poses to elements. The only React
   state is the front index, which changes **at a detent** — three times across
   the whole station.
2. **The rack is five cards deep, not three.** The lift handles `d ∈ {0, ±1}` and
   parks everything else at opacity 0 — a triptych. `|d| = 2` is what makes it a
   pile you are flipping through, which is the whole of the ask.
3. **Reduced motion degrades to a LIST, not to one card.** The lift shows the
   active card and hides the rest; that is right for a case showcase and wrong for
   a reading surface.

### ⚠ CSS 3D, NEVER WEBGL

The corridor's canvas is alive at `#voidwalker` but dies at the cover, which is
exactly where this station begins. A second canvas is barred by the
landing-performance doctrine, and `ringMath.ts` is hard-wired to `RING_COUNT = 4`
and load-bearing for `#services`.

### ⚠ THE PERSPECTIVE IS ON THE RIG AND THE IDLE YAW ON THE RACK

One level apart. `perspective` resolves against the element that DECLARES it, so
a yaw on the same box swings every card's vanishing point with it and the beat
reads as leaning rather than as a rack turning.

### ⚠ THE COVER LOCKSTEP MOVES IN ONE COMMIT (ADR-030 §6, a fifth time)

`home-v2.css`'s `~ #contact` rule, `useCorridorExitScroll`'s next-station query
and the handoff spec's cover case all name `#musings` now. Splitting them
hard-cuts the canvas at one of their edges.

⚠ **AND THERE WAS A THIRD COPY.** `services-ring-smoke`'s ambient-hold case
carries its own `getElementById` — twice, once to solve the waypoint and once to
assert on it. That spec's own comment records the same list being stale once
before ("the read further down still named `#practice` DIRECTLY"). Four readers
of one fact.

⚠ **THE `?? contactEl` FALLBACK IS LOAD-BEARING, NOT DEFENSIVE.**
`/claude-workshop` and the Trinny proposal mount this hook from their OWN
prototypes, neither of which has a `#musings`. On those routes the answer is
still `#contact`, and a bare `musingsEl` would leave both with no cover and no
error.

### ⚠ THE STATION SATISFIES THE COVER CONTRACT BY INHERITANCE

The handoff guard asserts the cover has `alpha === 1` **and** a background image.
`.station:not(.hero)` already paints `var(--void)` plus the stars, so nothing had
to be added — and nothing may be taken away. Measured at the kill edge:
`rgb(10, 9, 8)` with `url(/v7-stars.svg)`, ambient and exit both false.

### ⚠ IT GIVES UP `content-visibility`, AND FOR TWO REASONS

`.station:not(.hero)` pairs `content-visibility: auto` with a ONE-VIEWPORT
intrinsic guess and this station is three to four. The browser corrects that the
moment the station enters the rendering window, reflowing the document under the
reader; and the cover keys on this station's RECT, so a 100vh placeholder for a
four-viewport box puts the kill edge where the reader is not — ADR-105's own
reason, one station along.

## ADR-105 Update 3 — the footer is a bed

```css
html[data-ft-reveal] #contact.station {
  position: sticky;
  bottom: 0;
  z-index: 0;
}
#musings.station {
  position: relative;
} /* activates its inherited z-index: 2 */
```

**That is the whole mechanism.** Every term of ADR-105's geometry is untouched:
`--ft-pad-*`, the plate's negation of exactly those, the band's 54vw, the
three-layer scrim, the two plates' `display` swap. At the document's end a
sticky-bottom box sits at its natural seat, so sticky is a **no-op** there and
`plateIsStation` still measures the rect it always did.

### ⚠ A DOCUMENT-WIDE STICKY IS FATAL, AND IT WAS THE FIRST IDEA

Ungated, `position: sticky; bottom: 0` with `.stations` as the containing block
pulls the footer up to the frame's floor **from scroll 0** — and `#voidwalker` on
the capable path is a pinned TRANSPARENT stage, so the footer would paint straight
through the era stage over the live corridor. The gate is not a refinement; it is
the mechanism.

`useMusingsScroll` writes `data-ft-reveal` on `<html>` only while `#musings`' top
has passed the frame's top — i.e. while that opaque station fills the screen and
the snap is invisible behind it. It clears on the way back up, on unmount, and on
the inert rung. **An armed stamp with no writer is the one failure this rule
cannot survive**, which is why three exits clear it and a source ratchet counts
them.

### ⚠ IT IS PINNED, NOT TRANSFORMED

A main-thread `translateY` off a scroll variable lags the compositor by exactly
one wheel step, every step (measured on the proposal route's hero hold: 227.2 /
243.2 / 243.2 repeating) — "which is why the homepage holds its corridor with
`position: fixed` rather than a transform". The GIC reference does not move
either: it is uncovered. No transform, no opacity fade, no z-swap (ADR-031 U16
records the last two as failures on this exact problem).

### ⚠ NOT ON THE PHONE, AND THAT IS A PROPERTY OF THE STAMP

Not a media query: the writer parks on the inert rung and removes the attribute.
`#contact` is a snap stop at ≤960 and its bottom padding is solved against fixed
chrome in the DYNAMIC viewport, so a held footer there would seat the legal bar
against a floor that moves with the toolbar.

## The card

Drawn cover, then a mono kicker, then the title, then the summary — the Cyberpunk
reference's own order. **ONE NOTCH, TOP-RIGHT**: his corner every time (ADR-097's
proof card, ADR-098 U5's plates, ADR-082 U37's record cards). ⚠ A clip CUTS a
border and never strokes one, so the fill is clipped and the edge is a closed
two-contour `evenodd` RING on `::before`, inner leg `ch − 0.586px` — insetting a
45° cut by `d` shortens its leg by `d(2 − √2)`.

⚠ **NO `backdrop-filter`.** The proof card can afford one because it is ONE card;
five overlapping planes inside a `preserve-3d` context, on a page already running
the corridor's canvas, is five backdrop SNAPSHOTS a frame — and ADR-056's
measurement of that cost is why the casefile's blur waits for `data-proof-settled`.

### The cover draws the record

Three readings, all off the post: **which beat of the Arc it belongs to**, from
its own `tags`; **where in its year it was filed**, as a lit mark on a baseline
(the arcs instrument's idiom); and a substrate whose pitch is seeded off the slug.

⚠ **THE BEAT GLYPH IS A PROPER NOUN, WHICH IS WHY REUSING IT IS RIGHT HERE AND
WAS REFUSED ELSEWHERE.** ADR-106 declined to mount `PhaseGlyphSvg` on the outcomes
dial because "those glyphs MEAN Navigate / Encode / Build, and a silhouette here
is a proper noun" — the dial was not about those three things. This cover IS about
which of the three a post belongs to. The GRAMMAR is copied, not imported (24-unit
box, `fill: none`, `stroke: currentColor`, 1.5 stroke): the rail authors at 16px,
this draws at ~5×, and a station importing the frame's chrome is a dependency in
the wrong direction.

⚠ **A POST WITH NO ARC TAG DRAWS NO GLYPH.** The house diamond is not
substituted — a mark meaning "we had nothing to say here" is worse than an honest
empty field.

⚠ **NEITHER THE DATE MARK NOR THE KICKER GOES THROUGH `new Date()`.** An ISO date
with no zone parses as UTC and renders a day earlier for anyone west of
Greenwich — which moves the plotted mark by a day and, across a year boundary, by
the whole width of the plot. Both read the string. `lib/musings/registry.ts`
records the same trap from the other end (gray-matter hands back a `Date`).

## What the guards found that a still did not

- ⚠ **THE PHONE'S CHROME FLOOR WAS SILENTLY OPTED OUT OF.** `#musings.station`
  declared `padding-top: 0` at id specificity, which TIES with the ≤960 floor
  (also `#musings.station`, also (1,1,0)) and wins on source order because
  `musings.css` is imported after `landing.css`. The eyebrow printed under the TL
  corner bracket at the station's seat. `mobile-sections.md` §1 names this exact
  trap in so many words; the raw zeroing lives on the desktop rung now and the
  tokens stay unconditional so the floor's `max()` has its input.
- ⚠ **`snapSeats()` KEEPS A SECOND HAND-WRITTEN STOP LIST**, and it is NOT the
  same question as `SNAP_STOPS` (that one is "what must be a stop", this is "every
  aligned position the page might declare", filtered by computed
  `scrollSnapAlign` — which is why `#about` is in one and not the other). They
  cannot be merged, so the stops are now walked against the candidates: a stop
  missing from the list makes the engine snap to a position the harness does not
  recognise and every seek near it runs out its 30s timeout with nothing to say.
  Measured: `seek never settled on 20871, last read 20911` — 40px, the glide it
  was asking for.
- ⚠ **THIRTEEN `fonts` VIOLATIONS ON BOXES WITH NO TEXT IN THEM.** ADR-067's
  standing trap, and the mechanical gate found it here exactly as it found it on
  the footer: the ambient `--font-mono` is IBM Plex Mono, not this surface's
  `--font-pt-mono`, so every wrapper hands a THIRD face to whatever is added under
  it later. `.mu` declares the prose face now.
- **The kicker's separator dot measured 4.41:1 at 10.37px**, under the 4.5 floor.
  It inherits the kicker's own ink now: a mid-dot separates by SHAPE and needs no
  value of its own.
- ⚠ **AND THE CAPTURE'S OWN REVEAL READING WAS A MODEL OF THE DRAWING.** It
  intersected `#contact`'s rect with the viewport — but a sticky-bottom box is
  PINNED to the frame's floor for the whole reveal, so it reported the full
  viewport height at every stop and passed a footer that had not uncovered at all
  (1247 → 1247 at 1920×1247). What the reader can see is the strip the opaque
  station above has left, so it is measured off the RACK's bottom edge. Measured
  after: 0 → 561 → 1247.
- ⚠ **AND THE NOTCH PROBE READ A CARD THAT WAS TWO VIEWPORTS OFF SCREEN.**
  `elementFromPoint` works in the visual viewport, so run after the footer walk it
  reported a square card as notched on three sides. It is read with the rack
  seated, and the corner is pinned from BOTH ENDS — "the TR is cut" tells you
  nothing if the other three are cut too (ADR-065 U5's own lesson).

## What the composition pass changed

⚠ **THE RACK ROW WAS A `1fr` AND THAT POOLED EVERY PIXEL OF SLACK.** The frame is
1247px at the owner's viewport and the content is 613, so the middle row absorbed
all 634px and centred the rack inside it — **205px between the masthead's baseline
and the top card**, and the same again above the button. Three disconnected
objects with two holes between them, read off the still. Three content-height rows
centred as one group put the surplus above the head and below the foot, where it
is the frame. Air around a composition is room; air inside one is a mis-seat.
(ADR-070 U14, ADR-069 U1 and ADR-088 are the same finding on three other surfaces.)

## Guards

- `tests/lib/musings-rack.test.ts` — **new**, 37 cases: the slot table's symmetry
  and monotonic recession, the wrap's even-count tie, both clocks' continuity and
  clamping, the detent, the cover's beat/seed/date arithmetic, plus four SOURCE
  ratchets (the rung mirrored between the writer and the sheet, every 3D rule
  gated on both the rung and the stamp, three exits clearing `data-ft-reveal`, and
  no per-frame React state in the writer).
- `scripts/capture-musings-rack.mjs` — **new**, and it is the one that matters:
  headed, real scrolls, and it measures the cover's ground, every card's assigned
  pose, the front card's ink against the cards above it, the detent's advance, the
  footer's uncovering and the corner, hit-tested. PASS at 1920×1247 and 1280×720
  dark, 1920×1247 light, 390×844.
- The drift lockstep, all re-pointed and all of them hand-written copies that
  fired exactly as designed: `rail-manifest` (9 → 10, plus the DOM↔manifest regex
  guard and the duplicated parse options), `v7-parse`, `section-label` (06/06 →
  07/07), `rail-instrument-marks` (the fixed-length states array),
  `detentTable`, `footer-nav`, `socials`.
- `type-material-tokens` + `theme-css-sweep` + `phone-viewport-units` —
  `musings.css` registered in all three at **zero**, the hour it was written,
  which is the only way a sheet enters those maps (`proof-stack.css` sat in
  neither for a week while its own header claimed both).
- `about-voidwalker-handoff-boundaries` 8/8 · `services-ring-smoke` 11/11 ·
  `mobile-section-seams` 14/14 on both phones · `landing-corridor-smoke` +
  `arc-terminal-smoke` 20/20 · `services-ring-mobile-smoke` +
  `proof-stack-mobile-smoke` 19/19 · `landing-page -g "HUD"` **without**
  `--update-snapshots`, the byte-identity proof · 2068 unit tests.
- `mechanical.mjs --scope ".mu" --prm` — PASS in dark and light at 1440×900 and
  on the phone at 390×844.

## Left open

- **The rack wants five posts and has three.** It draws the front card plus two
  either side, so at five every seat is a different post; at three it is a
  triptych. The owner's LinkedIn posts are the input — ⚠ **LinkedIn refuses
  machine reads (`HTTP 999`)**, so they have to be pasted, not fetched.
- **The card's plate in LIGHT is close to the station's ground.**
  `rgba(--void-deep-rgb, .62)` resolves to parchment-over-parchment, so the cards
  separate on their edge rather than their fill. Legible and measured (the
  mechanical gate passes), but it is a read for the owner, not a number to tune
  blind.
- **The seam below the rack.** Past the pin there is ~285px between the
  `ALL MUSINGS` button and the footer's top edge at 1920×1247 — the stage's own
  bottom air, visible only in the transitional frame. Named rather than tuned.
- **`--mu-step` 42svh is the one dial**, and it costs page length: five posts is
  ~3.2 viewports, seven is ~4.0.
- **The eyebrow says MUSINGS and so does the nav corner's readout**, on the same
  screen. Every station has that pair; worth a look on the phone, where they are
  16px apart vertically.
- `landing-page.spec.ts`'s percentage-scroll snapshots want re-shooting — the
  document grew by a station. A deliberate `--update-snapshots` pass, and
  `-g "HUD"` must pass untouched before it.

---

## Update 1 — the shelf, the stage and the services masthead (2026-09-22, owner)

He read the rack live and gave three corrections, all in one message.

> _"The placement of the hero one and the paragraphs is completely different
> from the services section. The services section has the type of typography,
> font size, etc., that we want, so I'm not sure what went wrong here."_
>
> _"The background of the musings section scrolls parallax-style over the era
> section. That should not happen. Instead, as the components of the era
> section disappear, the components of the musings section should appear with a
> glitch effect. The text should appear with a glitch effect, and then the cards
> should come into view."_
>
> _"I do not want a copy of the services flow where we have cards rotating
> around it. I only want the scroll to happen horizontally, but the blog posts
> that are not in view should be rotated 90° so we see the side. It's like
> putting LPs or CDs in a closet or on a shelf, where you see the back instead
> of the front, or the side instead of the front."_

Plus a constraint named twice: keep the footer's reveal, and _"it's important
that we don't break anything on our site so please scope this out."_

Three rulings taken in the session that scoped it: the card is a **solid plate**
over the corridor; the **corridor stays alive** through the whole beat, dying
only on the last viewport; and the readout defect in §5 is fixed in this pass,
after verifying it live.

### 1 · It was never parallax, and that is why it had to change shape

An opaque station in normal flow can only arrive by TRAVELLING, and
`#voidwalker` on the capable path is a PINNED transparent stage that does not
move. One moving box over one held box IS the read he named. Measured: the
musings ground entered the fold at era progress **0.375**, with every era
element still seated (their exit opens at 0.74). It is the same complaint that
deleted `#practice` (ADR-105).

So on the capable rung `#musings` is the `#voidwalker` recipe exactly —
transparent, promoted, the corridor alive behind it for the whole beat — and
its opaque end is one 100svh full-bleed `.mu__band` at the foot of its runway,
which is both the corridor's kill edge and the edge the footer's bed arms on.
Three rungs, and the lower two are byte-identical:

| rung                                       | `data-mu-mode` | station              | cover       | footer bed          |
| ------------------------------------------ | -------------- | -------------------- | ----------- | ------------------- |
| ≥1101, motion, live corridor, hologram era | `stage`        | transparent, z 6     | `.mu__band` | armed on the band   |
| 961–1100 (shelf, no stage)                 | —              | opaque               | `#musings`  | armed on the runway |
| ≤960 / PRM / no JS                         | —              | opaque, flowing rail | `#musings`  | never armed         |

- ⚠ **THE WRITER HAD NO HANDLE ON THE STATION AT ALL.** `stationRef` is the
  portal's `.mu` root, one level inside the authored slot, so every rule written
  against `#musings[data-mu-mode]` would have matched NOTHING — silently, with
  the page reading as before. Resolved by climbing (`closest("#musings")`).
- ⚠ **TRANSPARENCY AND PROMOTION ARE ORTHOGONAL.** The docked canvas composites
  at its host's z 3 (`fixed` changes a containing block, never paint order, and
  the host is `isolation: isolate`); `#musings` carries an inherited z 2. An
  un-promoted transparent stage paints its head and cards BEHIND the corridor —
  invisible, every geometry gate green. z 6 while transparent is what
  `#services`, `#about` and `#voidwalker` all already do, so the `~ #musings`
  cover rule is REPLACED, never deleted.
- ⚠ **NOT `data-corridor-kill`.** It is consulted before the whole chain, so a
  stamp on the band would also win at 961–1100, under PRM and on the fallback,
  where `#musings` is opaque again — ADR-030 §6 a sixth time. And `killEl` is
  cached against `isConnected` and never re-queries when an attribute is
  removed. The mode-gated term in `useCorridorExitScroll` keeps every fallback
  byte-identical, and `?? contactEl` stays load-bearing for `/claude-workshop`
  and the Trinny proposal.
- ⚠ **NO WELD.** The about→voidwalker `-120svh` overlap exists because a WebGL
  deck is handed across that seam; nothing crosses here. The era's exit
  saturates at 0.96 with **6.4svh** of pinned, empty, transparent frame to
  spare, then releases as `#musings` pins — and both boxes being transparent,
  the reader sees only the corridor across the whole seam. That gap IS the beat.
- Both cover guards moved in the same commit and both needed the same
  correction: the band is EXACTLY 100svh, so a walk 0.3 viewports into it covers
  `vh − 1` and the coverage assertion fails. Every earlier cover was three
  viewports tall and absorbed the walk. The property is asserted at the edge it
  is claimed on — the band's own top — and what shows one pixel past it is the
  held footer beginning to be revealed, which is the reveal working rather than
  a cover failing.

### 2 · The rack becomes a SHELF

Not Cover Flow with a bigger angle. A rack FANS: every card at its own angle,
five covers at five attitudes. A shelf has exactly **two states** — facing out,
or turned a full 90° showing a spine — and the reader pulls one out.

- ⚠ **A SINGLE PLANE TURNED 90° PROJECTS TO A LINE**, whichever edge it is
  hinged on. So the object is the real one: a slab with a FACE and a SPINE, a
  quarter turn apart about one hinge. `.mu-card` is the pivot
  (`rotateY(0)` open / `rotateY(90deg)` closed, `transform-origin: left center`),
  `.mu-card__front` the face, `.mu-card__spine` a `--mu-spine` strip pre-rotated
  `rotateY(-90deg)` about the same edge. At the pivot's 90° the two compose to
  the identity on the spine — it faces the reader occupying exactly its own
  width — while the face is edge-on; at 0° the other way round. One angle drives
  both and nothing cross-fades.
- ⚠ **THE PIVOT TURNS AWAY FROM THE READER** (`+90`, which maps the face's +x to
  −z). At −90 the face swings toward the frame and, under the rig's perspective,
  reaches over its neighbour on the way across.
- ⚠ **AND THE PIVOT MAY CARRY A TRANSFORM AND NOTHING ELSE.** `overflow` other
  than `visible`, `clip-path` other than `none`, an `opacity` under 1 and a
  `filter` other than `none` are each GROUPING properties: they force
  `transform-style: flat` on the element that declares them, whatever it also
  says about `preserve-3d` (CSS Transforms 2 §3). This card declared **all
  four**, so the spine would have rendered as a zero-width strip — transform
  applied, element measurable, every geometry gate green. The face takes the
  clip and the overflow; the other two are DELETED with the fan, because on a
  shelf a closed slab is not a dimmed slab, it is a slab seen edge-on.
- ⚠ **THE SHELF STANDS STILL AND THE OPEN SLAB WALKS ALONG IT.** The first cut
  centred the open slab on the rig, which at three posts put a 420px card in the
  middle of a 1200px band under a head banded across the whole of it — one
  object floating in the centre of a composition whose every other element is on
  the band's left edge. Left-anchored, the head, the shelf and the way out are
  one column, and it is also what a row of records does. The travel is bounded
  by construction: at `MUSINGS_RACK_MAX` (7) the furthest seat is **336px**,
  inside the band at every viewport this rung opens at.
- `rackMath.ts` → `shelfMath.ts`. The five-deep slot table, the wrap, the fly-in
  from a stacked plane and the arrival blur are gone; the track is cumulative
  widths (the open slab takes its face, every other one a spine) and the detent
  and the reading band are unchanged. The yaw is CONSTANT once the beat has
  arrived — a drift tracking the reading position swings the whole shelf every
  time a slab turns, which is two motions on one gesture.
- The plate goes to **0.94** (the solid-plate ruling; 0.62 was tuned against an
  opaque station, and nothing mechanical can read a translucent plate over a
  live canvas — the gate composites against a background COLOUR).
- **The phone keeps the flat rail.** A spine is a desktop object.

### 3 · The head is the services masthead, COPIED

`ServicesMasthead` could not have been imported if it were wanted: zero props,
`closest(".services-stage")`, every clock a `--svc-*` channel no hook writes
here, and ABSOLUTE inside a pinned stage where this head is in flow. The
canonical in-flow copy is `ArcSectionHead` + `arcs.css`, and this is its third
instance. What arrives: the two-column split sharing one top line, the
designations hung above each block, the one gold state chip, the coordinate
stamps under each block's foot, the two registration crosses, the masked
dot-grid lifts, and the ladder — PP Neue Montreal at `clamp(26px, 3vw, 44px)` /
0.04em / 1.1 with the gold-washed shadow, the em line gold at `--weight-lit`,
PT Mono 9.5px at the eyebrow rung and 8px at the coord rung.

- ⚠ **THE TYPE RATCHET'S PIN GOES `A: 0 → 1`, WITH ITS REASON.** No role token
  carries `0.04em` and the nearest (`--track-display`, −0.02em) is visibly
  tighter at 44px, which would make this a different object from the one he
  pointed at. ONE rule, and the pin only goes down from here — raising it is a
  design change and it is recorded as one.
- ⚠ **THE STRINGS ARE AUTHORED UPPERCASE AND THE SHEET TRANSFORMS NOTHING**
  (ADR-092's own recipe). `--mu-display` retires with the line it sized.
- ⚠ **THE RIGHT-HAND SURVEY CHROME YIELDS TO THE FRAME BELOW 1700px.** The close
  cross hangs 24px outboard of an end-justified brief, and as the viewport
  narrows the band's right edge walks toward the right rail, whose BEARING /
  SECTOR / LOCAL readouts are right-aligned to it and reach ~100px inboard.
  Measured at 1280×720: the band ends at x 1148, `BEARING` begins at 1133, and
  the cross lands on its line. The brief's TEXT never collides (42ch stops
  short); only the marks do. The LEFT pair stays — the left rail letters nothing.

**The decode is SCRUBBED, not queued.** `--mu-head` is one scalar rising over
`[.08, .24]` and falling over `[.84, .94]`, and `scrambleFrame` is PURE in its
`t` — so the head un-types on the way out with no second job, no latch and
nothing to get wrong scrolling back. ⚠ `advanceScrambles` may NOT be used: it
DROPS finished jobs, and a dropped job is a latch nothing can unwind (ADR-095's
finding on the turn's own title). Two registers, the masthead's own: the chrome
and the title SCRAMBLE, the paragraph TYPES. Every channel's absent value is the
FINISHED page. The heading carries an `aria-label`, because a reader arriving
mid-decode would otherwise be handed the shuffle.

### 4 · The cards come into view on an aperture

⚠ **THE GLITCH HE MEANS IS NOT A FLASH.** He asked for one on the proof card,
read it live and pulled it the same day as a photosensitivity risk — countable,
at ~4 dark↔light alternations a second against WCAG 2.3.1's three-per-second
general-flash threshold (ADR-097 U12). The house's object arrival since is the
corridor caption card's centre-out APERTURE: pure motion, zero fades. This is
its **third host**, and the three now carry ONE pair of numbers — 720ms in,
420ms out, `cubic-bezier(0.65, 0, 0.35, 1)` — pinned in lockstep by source.

- ⚠ **ON THE CARD'S FACE, NEVER THE RACK** (§2's grouping-property law).
- ⚠ **AND THE SPINE ARRIVES WITH THE FACE.** The first cut put the aperture on
  the face alone, so the shelf "before it arrives" painted two lettered strips
  standing in an empty frame under a half-decoded head. Seen on the still, on no
  gate. A slab is ONE object and both of its planes open on one clock. ⚠ The
  hiding may not move up to the pivot however obvious that looks — `opacity`
  there is the same grouping property.
- ⚠ **A BOUNDED BURST ON A HYSTERESIS** (ADR-021's one sanctioned exception): a
  burst has a DIRECTION and a progress value does not. `shelfArrive` is
  `turnClock.ts`'s `arriveNext` copied — a landing component importing a route
  module is a dependency in the wrong direction; lifting it to `lib/` is the
  named follow-up. NaN leaves the state alone, a deep reload seeds `in`, and
  `await` is NOT `out`.
- ⚠ **IT CLOSES AT 0.97, PAST THE READING BAND'S OWN END (0.94).** A shelf that
  shut while the last slab was still being read would take the reading away to
  play an animation.

### 5 · A live defect the footer's bed already shipped

`useLandingScroll` picks the active station from the PAINTED rect, last wins,
`#contact` last. Since ADR-105 U3 `#contact` is `position: sticky; bottom: 0`
while the bed is armed, so its painted top is `≤ 0` at every scroll position —
the corner readout said **CONTACT for the entire musings beat** and the
`musings` row never lit. Measured at 1024×760: `contact` from p 0.14 onward.

⚠ **AND THE OBVIOUS FIX DOES NOT WORK, WHICH IS THE DURABLE HALF.** `offsetTop`
was supposed to be the layout answer — `clickToNavigate.ts` says "which sticky
does not move" — and it reports the STUCK position too. Probed live inside the
beat: `#contact.offsetTop` = **17174** against `#musings`'s **17217**, a station
beginning 43px BEFORE the one above it, which cannot happen in flow. That
comment predates this surface having a sticky station.

So the truth for a stuck station is the bottom edge of the one ABOVE it, which
is in normal flow: `position === "sticky" ? max(ownTop, prevBottom) : ownTop`.
⚠ Narrowed to `sticky` deliberately — a blanket `max` would break the phone's
`#about`, which takes a `-100svh` weld (ADR-115) and legitimately begins above
its predecessor's bottom.

### What the guards found that the stills did not, and the reverse

- ⚠ **A BOUNDING RECT IS NOT THE SHAPE, AND UNDER A 3D YAW IT IS NOT EVEN THE
  RIGHT QUADRILATERAL.** The shelf stands at a few degrees about Y under the
  rig's perspective, so a card projects to a TRAPEZOID and
  `getBoundingClientRect` returns its axis-aligned bound — a box whose four
  corners are all OUTSIDE the shape. Probed there, a card with one lawful notch
  reported three unlawful ones. The points are resolved through markers laid out
  in the face's OWN space, which is this house's custom-property law applied to
  geometry.
- ⚠ **`elementFromPoint` AND `elementsFromPoint()[0]` DISAGREE INSIDE A 3D
  RENDERING CONTEXT, AND THE SINGULAR ONE IS WRONG.** Measured on the same six
  points at 1920×1247: the plural form returns `span.mu-cover__field` /
  `a.mu-card`, the singular form returns `div.mu__rig` / `div.mu__rack` — the
  `preserve-3d` ANCESTORS, at points the card demonstrably paints. ADR-098 U5
  chose a hit test over a regex because a computed `clip-path` measures its own
  serialisation; this is the next layer of the same lesson.
- ⚠ **A PROBE AT `ch × 0.5` LANDS EXACTLY ON THE CHAMFER'S DIAGONAL.** The
  `onCut` gate read FALSE at 1920×1247 and TRUE at 390×844 on one unchanged
  card, resolving by rounding. It is deleted: `tr` already probes 30 % along the
  cut, well inside the removed triangle, which is the question. **A gate whose
  answer depends on which side of a pixel a device lands is not a gate.**
- ⚠ **AND THE NOTCH IS ASKED OF THE FACE NOW**, because the pivot still occupies
  its full unclipped box and `card.contains(el)` is true inside the chamfer.

### Guards added

`musings-rack.test.ts` → `musings-shelf.test.ts` (55): the track, the two
angles, the rotate-last order, the shelf standing still, the travel inside the
band, the detent, the clock, the head clock's three states and its rise-and-fall
ONCE (a head that un-typed and re-typed inside one beat is a flicker), the
arrival's hysteresis and its five states, `typedCount`, the masthead's anatomy /
authored case / digit ban / `coordStamp` pinned against `components/arcs/
chrome`'s original, the sheet's spine and gap px against `shelfMath`'s, the
three-host aperture lockstep, that NO rule ending on `.mu-card` carries a
grouping property on any rung, and that the writer publishes no per-card
`opacity` or `filter`. The capture gains the spine's own box and ink per closed
slab, the band as the cover, the stage-mode branch on the corridor gate, and
`data-active-station` at every stop.

### Left open

- **Three posts is a sparse shelf.** 420 + 2 × 56 = 532px of a 1200px band
  however it is anchored; the record already says the rack wants five.
- **`arriveNext` is copied, not lifted.** The third copy of a pure seven-line
  hysteresis; `lib/` is where it belongs.
- **The head's designation passes under the TL bracket mid-scroll on a phone** —
  the §1 class `mobile-sections.md` names, which no padding can reach and the
  seams spec measures only at rests.
- **`clickToNavigate.ts` still says sticky does not move `offsetTop`.** Its own
  behaviour is unaffected today (the bed only arms inside this beat), but the
  comment is wrong and the next reader will believe it.

## Update 2 — the row, and a head that decodes in place (2026-09-22, owner)

He read U1 live and gave three notes in one message:

> _"The texts, like the H1 and the paragraph, shouldn't move into view. It should
> just appear with a glitch effect, just like we have in the services section."_
>
> _"The entire stack of Musings should be centered. Now it's aligned to the left
> for some reason."_
>
> _"We want some sort of jukebox carousel rolodex effect where we see the other
> cards rotated on the x-axis, but now it looks really bad. I think the cards
> need to have some sort of 3D effect, like we have with the services cards. I
> don't want an exact copy, but I think that's a good design primitive."_

Two answers taken in session, both his: _"I don't want a physical shelf or
whatever. It's more about the effect where the cards that are not in view are
rotated on the x-axis. I don't want any skeuomorphism"_ — and, shown three forms
of a rotation about X, **"Row, others tipped back"**: the card being read upright
in the centre, the others tipped back about their horizontal axis, the row
sliding sideways.

### 1 · The head was pinned all along. What moved was text that was never blank

U1 scrubbed the decode off the scroll position and blanked it by asking the
kernel for its frame at `t = 0`. `scrambleFrame` opens each character's shuffle
window `SCRAMBLE_SHUFFLE_S` BEFORE it resolves, so at `t = 0` the first three or
four characters of every run are random glyphs — `F-ZO` / `TSJ` on U1's own
`p 0.02` still, `GZHI` / `VAB` on his. The head was never empty: those glyphs rode
the stage up the frame on the approach and again on the release, and re-rolled
on every scroll frame. **The services masthead is blank until parked, then
decodes on its own clock.** So:

- `lib/musings/headDecode.ts` (pure): `headFrame(run, level, span)` is `""` at
  level 0 for every run — the regression the test exists for — and the writer
  may not call `scrambleFrame` itself. Services' numbers: lines 0.18s apart, the
  paragraph typing at 220 chars/s behind 0.12s; the span is ~0.7s.
- ⚠ **TIME DRIVES THE LEVEL, SCROLL DECIDES THE TARGET.** `headTarget(prev, p,
pinned)` answers 0 or 1 — reveal at p ≥ 0.02, leave at ≥ 0.965 or < 0.01, a
  hysteresis band at each end — and a bounded rAF burst walks the level there (up
  over the span, down twice as fast). A scrubbed decode resolves at the speed of
  the reader's thumb and stands half-shuffled when it stops, which is not the
  effect he pointed at. ⚠ The level is still ONE scalar, so the un-type is the
  decode played backwards in each character's own cell and there is nothing to
  latch — `advanceScrambles` stays banned.
- ⚠ **NEVER SHOWN ON A MOVING STAGE.** `pinned` is the runway covering the frame;
  unparked, the level snaps to 0 at once (the masthead motion law's
  force-blank). A deep reload parked in the band shows the head whole with no
  replay; a hidden tab settles the burst on return.
- Services parity: the CRT cursor (`.mu__cursor`, number for number) on the line
  decoding and the paragraph while it types; the paragraph a GHOST/TYPED pair so
  typing never reflows the head (U1's `min-height: 4.5em` was a guess).
- **The cards wait for the head.** `data-mu-arrive="in"` holds until the level is
  1 — "the text should appear with a glitch effect, and then the cards" — and
  the row now closes at 0.95, before the head leaves at 0.965, so the exit is the
  entry backwards.

### 2 · The row: centred, tipped about X, flat

`lib/musings/shelfMath.ts` → `lib/musings/rowMath.ts`. The card being read is
upright on the rig's centre; the others sit symmetrically either side, tipped
back `ROW_TILT` (60°, top away) and set back in depth, spreading and receding
with their distance from it. 60° on stills: 65° made each neighbour a squat
sliver, 45° let its copy compete. No spine, no slab, no lit edge, no shading —
the depth is the rotation and the perspective. The detent and its 720ms glide
are unchanged; `--mu-drift` (the shelf's yaw) is deleted, the row being
symmetric. `.mu__foot` centres under it.

- ⚠ **AN ANCESTOR `perspective` PAINTED ~140px OFF ITS OWN MEASURED RECT.** The
  first cut kept U1's structure — `perspective` on `.mu__rig` over a
  `preserve-3d` rack — and inside this sticky, promoted stage the compositor
  resolved that perspective somewhere other than `getBoundingClientRect` did: a
  tipped neighbour's cover glyph painted ~125px right and ~140px below its
  reported rect, the whole card a 30px sliver under the mid-line. **Every rect
  matched the arithmetic and every gate built on the rects passed; only the
  still disagreed.** Removing the window's mask changed nothing; flattening the
  rig changed nothing. The cure is structural: `rowPose` opens on
  `perspective(ROW_PERSPECTIVE px)`, every card is seated on the rig's centre
  (`inset: 0; margin: auto`) so its own transform-origin is the one eye, and the
  cards share no 3D context — paint order is plain z-index.
- ⚠ **A TIPPED CARD'S NEAR EDGE STAYS BEHIND THE UPRIGHT ONE.** Tipping swings the
  bottom edge toward the reader by `(h/2)·sin(tilt)`; the first neighbour's depth
  is floored on the face's HEIGHT (`rowNearDepth`) so a covered card can never
  stand in front of the card covering it.
- ⚠ **THE FADE IS ON `.mu__window` AND ENDS 3 % INSIDE IT.** Cards past ±1 reach
  beyond the band; at 1280×720 the band's right edge runs 15px past the rail's
  BEARING readout, so the fade finishes before the edge. A mask is a grouping
  property — never on the rig, the rack or a card — and hides everything outside
  its box, so the window pads 8px for the front card's focus ring.

### Guards

`musings-shelf.test.ts` → `musings-row.test.ts` (60): the pose (upright centre,
X-only tilt on every card at every open index, symmetry, monotonic recession,
the near-edge floor at four face shapes, one function list with the perspective
first and the rotation last, z-order, clamping), the detent and reading band,
the arrival (closing before the head leaves), `headFrame` (EMPTY at level 0,
whole at 1, monotonic typing, the stagger, the span inside services' window,
the cursor), `headTarget` (never unparked, both hysteresis bands, the deep
reload, NaN), and the source ratchets — no spine or yaw anywhere, the seat on
the rig's centre, no ancestor `perspective` or `preserve-3d` in the sheet, the
fade on the window, no grouping property on the pivot, the aperture's lockstep,
the writer never calling `scrambleFrame`. `capture-musings-rack` gains the
computed-matrix pure-X gate, the centring gate (±2px), the head EMPTY at every
unparked stop (−0.3 and 1.15 were added for exactly that) and whole through the
reading band, and the fade ending before the readouts; its arrival probe waits on
the stamp and a finished animation, because re-entering from below replays the
order (~1.4s). PASS at 1920×1247 dark and light, 1280×720 and 390×844.

### Left open

- **Three posts.** The row wants five: at three the first and last detents show
  neighbours on one side only.
- **A side card is a link nobody can see as one.** Tipped cards stay
  `tabIndex={-1}` / `aria-hidden` but keep their `href`, so a click on one opens
  that post. Rolling the row to it instead (the era band's side-tap idiom) is the
  obvious follow-up; not taken without his read.
