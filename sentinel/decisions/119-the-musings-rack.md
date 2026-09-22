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
