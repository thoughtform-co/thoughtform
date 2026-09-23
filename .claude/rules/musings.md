---
paths:
  - "components/landing/home-v2/musings/**"
  - "lib/musings/**"
  - "content/musings/**"
  - "app/(internal)/test/musings-row/**"
  - "scripts/capture-musings-row.mjs"
description: The musings row (#musings) — a row that opens on hover, its transparent stage and the footer's held bed
---

# Rule: the musings row

`#musings` — the writing as a row that OPENS ON HOVER: the services masthead's
grammar on the editorial band, decoding in place; a flex row of glass cards of
which the one under the pointer takes the band's free width and the rest
collapse to strips; one way out. It sits between the era stage and the footer.

⚠ **[ADR-121](../../sentinel/decisions/121-the-musings-row-opens-on-hover.md)
(2026-09-23, owner) IS THE LIVE FORM, AND IT RETIRES EVERY 3D READING OF THE
ASK.** ADR-119 tried a fan (U0), a shelf of spines (U1) and a row tipped back
about X with a scroll detent per card (U2); the owner read the last one live —
_"what we currently have looks ugly … remove the jukebox carousel thing
because it's not working. I just want to do something simpler."_ The reference
is Lighthouse HQ's customer row, measured off its live DOM: a flex row,
`flex: 0 0 <strip>` on every card, `flex-grow` transitioned on the active one,
nothing else. **Do not bring a perspective, a rotation, a detent or a per-card
pose back** — `musings-row.test.ts` refuses all four by source.

⚠ **SINCE [ADR-119 U1](../../sentinel/decisions/119-the-musings-rack.md)
(2026-09-22, owner) THE STATION IS NOT THE COVER — ITS LAST VIEWPORT IS.** On
the capable rung it is the `#voidwalker` recipe exactly: transparent, promoted,
the corridor alive behind the whole beat, because an opaque station in normal
flow can only arrive by TRAVELLING over a pinned stage that does not move —
which is the "parallax" he named, and the complaint that deleted `#practice`.
What kills the corridor and arms the footer's bed is one opaque 100svh
`.mu__band` at the foot of its runway. Three rungs, and the lower two are
byte-identical to what ADR-119 shipped:

| rung                                       | `data-mu-mode` | station              | cover       | footer bed          | glass |
| ------------------------------------------ | -------------- | -------------------- | ----------- | ------------------- | ----- |
| ≥1101, motion, live corridor, hologram era | `stage`        | transparent, z 6     | `.mu__band` | armed on the band   | blur  |
| 961–1100 (row, no stage)                   | —              | opaque               | `#musings`  | armed on the runway | none  |
| ≤960 / PRM / no JS                         | —              | opaque, flowing rail | `#musings`  | never armed         | none  |

⚠ The PAGE `/musings` is a different surface with a different grammar — the
SHEET (ADR-114), [`.claude/rules/sheet.md`](sheet.md). This station is a
landing STATION and answers to the corridor's grammar and the corner law, not
to the sheet's variety law. They share exactly one thing: the record.

**Read first**

- [ADR-121](../../sentinel/decisions/121-the-musings-row-opens-on-hover.md) —
  the reference measured, the grow dial, the glass ruling and its perf gate,
  the deletions, and what the guards found.
- [ADR-119](../../sentinel/decisions/119-the-musings-rack.md) — the station's
  birth: the cover lockstep, the footer's bed, the head's decode (U2), the
  aperture (U1 §4), and the three forms the owner retired.
- [ADR-105](../../sentinel/decisions/105-the-page-ends-on-a-bold-footer.md)
  **Update 3** — the footer's half, recorded on the ADR that owns that surface.
- [ADR-114](../../sentinel/decisions/114-the-sheet.md) — the content model
  (`MusingPost`, `content/musings/*.mdx`, the registry's two traps).
- [ADR-097](../../sentinel/decisions/097-proof-card-is-a-folder.md) — the
  folder skin this card is cut from (glass, the flat lip, the scanline, the
  bloom stated in pixels).
- [ADR-030 §6](../../sentinel/decisions/030-tools-section-cover-stack.md) — the
  cover lockstep this station sits at the centre of.

## Contracts

- **THE MECHANIC IS ONE PROPERTY, AS THE REFERENCE.** `.mu__row` is a flex row;
  every card is `flex: 0 0 var(--mu-closed)` and the open one is
  `flex-grow: 1`, transitioned on `--mu-grow` (900ms
  `cubic-bezier(0.19, 1, 0.22, 1)`, the reference's expo-out re-solved for
  ~350px of edge travel). Mid-grow the two grows sum to one, so the free width
  is always fully distributed and no gap opens. Nothing is posed, nothing is
  measured, nothing is written per frame. The dials sit on `.mu`:
  `--mu-closed` (88–120px, a strip wide enough for "14 SEP" and the glyph
  whole), `--mu-gap` (10–16px), `--mu-grow`, `--mu-cover-h` (46 % of the
  card), `--mu-glyph`, `--mu-dwell`.
  ⚠ **THE APERTURE'S CURVE IS DELIBERATELY NOT COPIED HERE.** An ease-in-out
  is right for an arrival the reader did not cause and wrong for a pointer
  response, which wants an immediate start; the expo-out answers the hand at
  once and settles without a snap. The house's 720ms ease-in-out pair is the
  alternative for the owner's read.
- **THE OPEN CARD IS ONE ATTRIBUTE, `data-mu-open`, RENDERED ON THE NEWEST
  POST AND MOVED BY THE WRITER.** The owner's rest state: the newest post is
  open, no timer, never a wall-clock rotation (ADR-021). React renders it on
  index 0 so SSR, no-JS and a reduced-motion reader all show the finished row;
  `useMusingsScroll` moves it on `pointerover` / `focusin` (delegated on the
  row) and puts it back on `pointerleave` / a `focusout` that leaves the row —
  one attribute write on an event, no `setState` (ADR-002). ⚠ The holder is
  QUERIED, never cached: the lab re-keys the row when its count changes and a
  cached card is a detached one. ⚠ React does not touch an attribute whose
  prop has not changed, so the writer's move survives every re-render.
  ⚠ The handlers are gated on the rung, so the rail is byte-identical to
  what ADR-119 shipped: card 0 lit, nothing moving.
- **THE TEXT NEVER REFLOWS DURING THE GROW.** The row is an inline-size
  container and publishes
  `--mu-open-w: calc(100cqw − (n − 1) × (--mu-closed + --mu-gap))` — the
  width the open card WILL have — and every card's body is laid out at that
  width once; the face's `overflow: hidden` clips it while the card is a strip
  and the grow UNCOVERS it. Pure motion: no opacity, no reflow (the caption
  card's own law, and the reference's read — the strips show the head of each
  line). The copy caps its measure at 56ch inside it. ⚠ `cqw` resolves on the
  element that USES the value against its nearest query container; a face or
  a card made a container would silently re-base it. ⚠ The station hands the
  row its count as `--mu-n`; the two files move together.
- **THE COVER IS A FIXED-HEIGHT BAND ON EVERY CARD** (`--mu-cover-h`), the
  beat glyph at a FIXED size centred in it (whole inside the narrowest strip),
  the date axis spanning whatever width the card has with the lit mark at its
  year fraction — so five covers end on one datum and all five kickers share a
  baseline across the row. The rail's cover keeps its 16/10 aspect; on the
  phone `--mu-card-h` is `auto` and the band is never consumed.
- **THE MATERIAL IS THE PROOF CARD'S FOLDER, RE-SOLVED FOR THIS SIZE
  (ADR-097).** `--mu-plate` is `rgba(--void-deep-rgb, .62)` (.9 on parchment,
  `theme.css` BLOCK 4g — unfrosted, the corridor printed through the copy);
  the lip is FLAT,
  `color-mix(in srgb, var(--gold-line) 30%, transparent)` at rest rising to
  `--gold-line` on the open card (a `background-color` on the ring, so it
  transitions); the plate's 1px/3px gold scanline sits UNDER the copy; the
  bloom is stated in PIXELS (`260px 180px` hung 60px in from the top-right —
  the proof card's `460px 300px` lit a whole strip). ⚠ NO `brightness()`.
  ⚠ **THE STATE IS THE RING AND THE KICKER'S INK, NEVER A FILTER**: the
  reference dims its inactive cards with `brightness(.82)`, and a large-area
  brightness change on every hover is the class of motion ADR-097 U12 retired.
  The strips' kickers sit on `--mu-ink-3`; the open card's is gold — the row
  carries ONE gold line of chrome.
- ⚠ **THE GLASS IS ON THE STAGE RUNG ONLY, AND IT IS MEASURED, NOT ASSUMED.**
  `backdrop-filter: blur(--mu-blur)` under `@supports`, on
  `#musings[data-mu-mode="stage"] .mu[data-mu-ready] .mu-card__front` — where
  there is a live corridor to blur. At 961–1100 the station is opaque and a
  blur would re-snapshot every frame to frost its own stars; light drops it in
  `theme.css` BLOCK 4g (the bed is faded there), with a selector that
  OUT-RANKS the sheet's (1,4,0) or it loses silently. ADR-119's ban was argued
  for five OVERLAPPING 3D planes; a flat row of five non-overlapping cards is
  one proof card's area of glass, and `capture-musings-row.mjs --perf` gates
  the long-frame share while the pointer sweeps the row against the proof
  card's recorded 15 %. **The number is in ADR-121; the recorded fallback if
  it ever fails is the blur on the OPEN card alone with the strips at .94.**
- **EVERY CARD IS A REAL LINK AND EVERY CARD IS FOCUSABLE.** ADR-119's
  `tabIndex={-1}` + `aria-hidden` on cards 1..n was an a11y bug on every parked
  rung, where the rail showed them. Keyboard focus opens a card exactly as
  hover does; `:focus-visible` rings the card 3px outboard, which is why the
  row is `overflow: visible` on its rung. Touch on a ≥961 device: a tap opens
  and navigates in one gesture (left open, ADR-121).
- **THE RUNWAY IS ONE DWELL** — `height: calc(100svh + var(--mu-dwell))`,
  `--mu-dwell: 60svh`, the one dial. ADR-119 pinned one step per card (42svh
  each) because a detent needs scroll; a hover row does not. The head's
  thresholds on `p` are unchanged; the arrival's hysteresis
  (`lib/musings/arrive.ts`, the lifted `arriveNext`) opens at `ROW_ARRIVE_IN`
  0.10 — re-solved for the short dwell — and closes at 0.95, before the head
  leaves at 0.965. On the stage rung the station is ~1.6 viewports plus its
  100svh band (ADR-119 U2 was ~3.2 at five posts).
- ⚠ **ONE WRITER, AND IT RENDERS NOTHING, EVER.** `useMusingsScroll` reads
  one rect in a rAF and publishes `--mu-head` (the head's level),
  `data-mu-ready` and `data-mu-arrive` on `.mu`, `data-mu-mode` on the
  STATION, `data-ft-reveal` on `<html>`, `data-mu-open` on one card, and
  `data-live` on the head's cursor hosts. It returns nothing and holds no
  React state — the last `setState` (ADR-119's detented front index) went
  with the detent. A `setState` in the rAF is a re-render across every card,
  every frame, on a page running a WebGL corridor two stations up.
- ⚠ **AN ABSENT `data-mu-ready` MEANS SHOWN.** The rest state — no script, a
  reduced-motion reader, any phone — is a horizontal RAIL of the same cards,
  and it is the finished page rather than a fallback. Every row rule (the
  grow, the open width, the glass, the container) is gated on the stamp AND
  on the rung, so the two can never disagree about which layout is live;
  `musings-row.test.ts` walks every such declaration.
- ⚠ **THE RUNG IS MIRRORED BY HAND** between `MUSINGS_ROW_MEDIA` in the writer
  and `@media` in the sheet. A writer and a sheet that disagree is a row of
  strips nothing will ever open, or a rail whose first card is three times the
  width of the rest — neither errors, and neither is visible in a still taken
  at the other rung. Pinned by source.
- ⚠ **THE COVER LOCKSTEP HAS FOUR READERS AND THEY MOVE IN ONE COMMIT**
  (ADR-030 §6, on record as hit six times): `home-v2.css`'s mode-gated promotion
  rule, `useCorridorExitScroll`'s next-station query,
  `about-voidwalker-handoff-boundaries`' cover case, and `services-ring-smoke`'s
  ambient-hold case — which reads it **twice**, once to solve the waypoint and
  once to assert on it. All four name **`.mu__band`** on the stage rung and
  ADR-121 moved none of them.
  ⚠ **NOT `data-corridor-kill`**: it is consulted BEFORE the whole chain, so a
  stamp on the band would also win at 961–1100, under PRM and on the fallback,
  where `#musings` is opaque again — and `killEl` is cached against
  `isConnected` and never re-queries when an attribute is removed from a
  connected element, so a writer-stamped version does not work either.
  ⚠ **AND THE BAND IS EXACTLY 100svh**, so a guard that walks 0.3 viewports into
  its top covers `vh − 1` and fails. The property is asserted at the edge it
  is claimed on — the band's own top — and what shows one pixel past it is the
  held footer beginning to be revealed, which is the reveal working.
  ⚠ **`?? contactEl` IS LOAD-BEARING**: `/claude-workshop` and the Trinny
  proposal mount the same hook from their own prototypes and have no
  `#musings`. On those routes the answer is still `#contact`.
- ⚠ **THE COVER SATISFIES ITS CONTRACT BY INHERITANCE, SO DO NOT TAKE ITS
  GROUND.** Off the stage rung `.station:not(.hero)` paints `var(--void)` plus
  the stars; on it the BAND paints the same pair full-bleed. The guard asserts
  `alpha === 1` AND a background image, and a surface whose only ground is its
  content fails both.
- ⚠ **THE WRITER HAS NO HANDLE ON THE STATION WITHOUT CLIMBING.** `stationRef`
  is the portal's `.mu` root, one level inside the authored slot, so every rule
  written against `#musings[data-mu-mode]` matches NOTHING — silently, with
  the page reading as before. `closest("#musings")`, re-resolved on `isConnected`.
- ⚠ **TRANSPARENCY AND PROMOTION ARE ORTHOGONAL.** The docked canvas composites
  at its host's z 3 (`fixed` changes a containing block, never paint order, and
  the host is `isolation: isolate`) and `#musings` carries an inherited z 2 — so
  an un-promoted transparent stage paints its head and cards BEHIND the
  corridor: invisible, every geometry gate green. z 6 while transparent is what
  `#services`, `#about` and `#voidwalker` all already do, which is why the cover
  rule is REPLACED and never deleted.
- ⚠ **`#musings.station`'s unconditional `position: relative` MAY NEVER BE
  FOLDED INTO A `data-corridor-exit`-GATED RULE.** It is what activates the
  inherited `z-index: 2` that keeps the whole subtree above the footer's z 0,
  long after the ambient has died.
- ⚠ **IT GIVES UP `content-visibility`, UNCONDITIONALLY.** The base pairs
  `auto` with a one-viewport intrinsic guess and this station is two and a half
  on the stage rung, so the correction reflows the document under the reader —
  and the cover keys on this station's RECT, which a 100vh placeholder puts
  where the reader is not (ADR-105's own reason, one station along).
- ⚠ **THE RAW PADDING IS ON THE DESKTOP RUNG ONLY.** `#musings.station` writing
  `padding-top` unconditionally TIES with the ≤960 chrome floor (also
  `#musings.station`, also (1,1,0)) and wins on source order, because
  `musings.css` is imported after `landing.css` — the floor silently resolves to
  0 and the eyebrow prints under the TL bracket. `mobile-sections.md` §1 names
  this trap; the station declares `--station-pad-top/-bottom` unconditionally so
  the floor's `max()` has its input, and zeroes the raw padding above 961px.
- **The head is the SERVICES MASTHEAD's grammar, COPIED** (`lib/musings/
mastheadData.ts` + `.mu__head*`): the two-column split sharing one top line,
  the designations hung above each block, the one gold state chip, the coord
  stamps under each block's foot, the two registration crosses, the dot-grid
  lifts, and the ladder — `clamp(26px, 3vw, 44px)` / 0.04em / 1.1 with the
  gold-washed shadow. ⚠ `ServicesMasthead` could not be imported if it were
  wanted (zero props, `closest(".services-stage")`, `--svc-*` channels no hook
  writes here, ABSOLUTE inside a pinned stage); `ArcSectionHead` is the
  canonical in-flow copy and this is its third instance.
  ⚠ **THE STRINGS ARE AUTHORED UPPERCASE AND THE SHEET TRANSFORMS NOTHING**
  (ADR-092), and `0.04em` is the sheet's ONE type literal — the ratchet's pin is
  `A: 1` with its reason recorded, and it only goes down from there.
  ⚠ **THE RIGHT-HAND SURVEY CHROME YIELDS TO THE FRAME BELOW 1700px**: the close
  cross hangs 24px outboard of an end-justified brief, and the right rail's
  BEARING / SECTOR / LOCAL readouts are right-aligned to the rail and reach
  ~100px inboard. Measured at 1280×720 — band ends at 1148, `BEARING` begins at 1133. The brief's TEXT never collides; only the marks do.
- ⚠ **THE HEAD DECODES IN PLACE, ON THE SERVICES MASTHEAD'S CLOCK (ADR-119 U2:
  "the texts … shouldn't move into view … just like we have in the services
  section").** U1 scrubbed it off the scroll position and asked the kernel for
  its frame at `t = 0` to blank it — but `scrambleFrame` opens a character's
  shuffle window BEFORE it resolves, so at `t = 0` the first 3–4 characters of
  every run were random glyphs (`F-ZO` / `TSJ`). **The head was never blank**,
  and those glyphs rode the stage in and out of the frame, re-rolling every
  scroll frame. Now:
  - **`headFrame` returns `""` at level 0**, for every run — the regression the
    test exists for — and the writer may not call `scrambleFrame` itself.
  - **TIME DRIVES THE LEVEL, SCROLL DECIDES THE TARGET.** `headTarget` picks 0
    or 1 (reveal at p ≥ 0.02, leave at ≥ 0.965 or < 0.01, a hysteresis band at
    each end); a bounded rAF burst walks the level there — up over the whole
    span (~0.7s: lines 0.18s apart, the paragraph typing at 220 chars/s behind
    0.12s, services' numbers), down twice as fast. ADR-021's sanctioned kind,
    the services masthead's own clock.
  - **NEVER SHOWN ON A MOVING STAGE**: unparked (the runway not covering the
    frame) the level snaps to 0 at once — the masthead motion law's
    force-blank. A deep reload parked inside the dwell shows the head whole,
    with no replay; a hidden tab settles the burst on return.
  - ⚠ The level is still ONE scalar, so the un-type is the decode played
    backwards in each character's own cell — no second job, nothing to latch.
    `advanceScrambles` stays banned for that reason.
  - The CRT cursor (`.mu__cursor`, copied from `.services-masthead__cursor`)
    rides the first title line still decoding and the paragraph while it types,
    lit by `data-live` on its `[data-mu-cursor]` host. ⚠ The decoded run is an
    INNER span — `textContent` would wipe a sibling cursor.
  - ⚠ The paragraph is a GHOST/TYPED pair (a hidden ghost holds the box, the
    typed layer is absolute): typing never reflows the head.
  - Two registers stay: chrome and title SCRAMBLE, the paragraph TYPES. ⚠ The
    heading carries an `aria-label`, or a reader arriving mid-decode is handed
    the shuffle. The survey chrome fades with `--mu-head`.
    ⚠ With a 60svh dwell `pinned` holds for 60svh of scroll: the head decodes on
    entry, the cards open after it, and the exit runs backwards
    (`data-mu-arrive="out"` at 0.95 before the head leaves at 0.965). The
    capture reads the head EMPTY at −0.3 and 1.15 and whole through 0.3–0.9.
- **The cards arrive on a centre-out APERTURE, AFTER THE HEAD HAS RESOLVED**
  (the owner's own order: "the text should appear with a glitch effect, and
  then the cards should come into view"). The writer holds `data-mu-arrive="in"`
  until the head's level is 1, and the burst's last frame asks for one more
  tick. ⚠ **The glitch he means is NOT a flash** — he pulled one from the proof
  card as a photosensitivity risk (ADR-097 U12). ⚠ **This is the THIRD host of
  one pair of numbers** (720ms in / 420ms out, `cubic-bezier(0.65, 0, 0.35, 1)`,
  with `proof-stack.css` and the Trinny route) and a source ratchet pins all
  three. ⚠ On the card's FACE, never the card (whose box `flex-grow` is
  transitioning — an animation on the same box would fight it) or the row (a
  clip there cuts every card at once); every face opens from its own centre,
  the wide one and the strips alike, on one clock. The way out (`.mu__all`)
  opens on its own rectangle slit on the same clock.
  ⚠ It is a BOUNDED BURST on a hysteresis (`rowArrive`, `lib/musings/arrive.ts`):
  NaN leaves the state alone, a deep reload seeds `in`, `await` is NOT `out`,
  and it closes at **0.95**, BEFORE the head leaves (0.965), so the exit is the
  entry backwards.
  ⚠ **Re-entering from below replays the order** (the head decodes, then the
  aperture opens: ~1.4s end to end), so a probe must WAIT on
  `data-mu-arrive="in"` and a face with no running animation — never sleep. The
  capture does.
- **The card takes ONE notch, TOP-RIGHT** — his corner every time (ADR-097's
  proof card, ADR-098 U5's plates, ADR-082 U37's record cards). ⚠ A clip CUTS a
  border and never strokes one, so the fill is clipped and the edge is a closed
  two-contour `evenodd` RING on `::before`, inner leg `ch − 0.586px`. ⚠ The
  corner is pinned from BOTH ENDS and it is HIT-TESTED, not parsed — a computed
  `clip-path` keeps its percentages and `calc()`s. ⚠ The face is a separate
  span because the clip, the ring, the glass and the aperture all live on it
  while the card's own box is what grows.
- **The cover draws the RECORD** (`lib/musings/cover.ts` + `MusingCover.tsx`):
  the post's Arc beat from its own tags, its filing date as a lit mark on a
  baseline, a substrate seeded off the slug. ⚠ The beat glyph's GRAMMAR is
  copied from `rail-instruments/sectionGlyphs.tsx`, never imported (ADR-106's
  precedent) — and reusing the drawing is right HERE because the cover is about
  which of the three a post is. ⚠ A post with no Arc tag draws NO glyph. ⚠ The
  cover letters nothing: the card's kicker prints the date.
- ⚠ **NO `new Date()` ANYWHERE IN THIS MODULE.** An ISO date with no zone parses
  as UTC and renders a day earlier west of Greenwich — a day on the kicker, and
  across a year boundary the whole width of the plot on the mark. Both read the
  string. The registry records the same trap from the other end.
- **`cardsFor()` is the one projection into the client tree**, and it exists to
  leave `body` — every post's whole MDX source — out of the landing's payload.
  ⚠ `next.config.mjs` must name `/` under `outputFileTracingIncludes` for
  `content/musings/**`: the tracer follows imports and this folder is opened by
  path, so a missing row works in dev and 500s on Vercel.
- ⚠ **THE ROW READS BEST AT FIVE, AND THE LANDING HAS THREE.** At three the
  open card is ~928px of a 1200px band and the two strips read as afterthoughts;
  at seven the open card is under 400px. `MUSINGS_ROW_MAX` is 7; a strip costs
  the open card its width, not the page its length.
- ⚠ **PLACEHOLDER COPY LIVES IN THE LAB AND NOWHERE ELSE.** The site is live: a
  `draft: false` file in `content/musings/` publishes a page and a sitemap row.
  `/test/musings-row` (`app/(internal)/test/musings-row/`) mounts the
  PRODUCTION station — nothing re-drawn — with seven placeholder records
  (`placeholders.ts`), `?n=3|5|7`, `?theme=light`, `?console=0`. It supplies the
  DOM the writer reads (a hidden `#voidwalker[data-vw-mode="hologram"]` marker
  and `data-corridor-exit` on `<html>`), so the station goes transparent and the
  glass has the lab's BED to blur. A window onto production, not a copy.

## The footer's bed (ADR-105 U3)

- **One rule, gated on one stamp.** `html[data-ft-reveal] #contact.station {
position: sticky; bottom: 0; z-index: 0 }`, with `#musings.station`
  `position: relative` activating its inherited `z-index: 2` above it.
- ⚠ **UNGATED IT IS FATAL.** Sticky-bottom pulls the footer to the frame's floor
  from scroll 0, and `#voidwalker` on the capable path is a pinned TRANSPARENT
  stage — the footer would paint through the era stage over the live corridor.
- ⚠ **THREE EXITS CLEAR THE STAMP** — the inert rung, unmount, and scrolling
  back above the row. An armed stamp with no writer is the one failure this
  cannot survive; a source ratchet counts the clears.
- ⚠ **PINNED, NEVER TRANSFORMED.** The reference does not move either; it is
  uncovered. A main-thread `translateY` off a scroll variable lags the
  compositor by one wheel step, every step.
- ⚠ **MEASURE THE REVEAL OFF THE STATION'S BOTTOM, NOT THE FOOTER'S RECT.** A
  sticky-bottom box is PINNED for the whole reveal, so intersecting it with the
  viewport reports the full viewport height at every stop — the capture's first
  cut passed a footer that had not uncovered at all (1247 → 1247).

## What a still shows and a gate does not, and the reverse

- ⚠ **A BOUNDING RECT CAN BE WRONG ABOUT WHERE A 3D ELEMENT PAINTS — NOT JUST
  LOOSE, WRONG (ADR-119 U2).** With an ANCESTOR `perspective` inside this
  sticky, promoted stage, `getBoundingClientRect` and the compositor disagreed
  by ~125px across and ~140px down on a tipped card: every gate built on the
  rects passed and the still showed a 30px sliver. There is no 3D context on
  this station now — and that finding is the standing reason there is not.
- ⚠ **`elementFromPoint` AND `elementsFromPoint()[0]` DISAGREED INSIDE THAT 3D
  CONTEXT, AND THE SINGULAR ONE WAS WRONG.** With the context gone, ADR-121's
  capture reads both on every probe point and reports whether they agree; the
  plural form stays the one the gate uses.
- ⚠ **A PROBE AT `ch × 0.5` LANDS EXACTLY ON THE CHAMFER'S DIAGONAL** and
  resolves by rounding. Deleted: the `tr` probe at 30 % along the cut is the
  question. **A gate whose answer depends on which side of a pixel a device
  lands is not a gate.** ⚠ And the notch is asked of the FACE, which carries
  the clip.
- ⚠ **A RANGE'S CLIENT RECTS ARE THE LAYOUT, NOT THE CLIP.** That is what lets
  the capture ask the no-reflow question: the same title reports the same
  width from inside a strip and from an open card, because `overflow: hidden`
  never shrank the line boxes. An element rect would have answered with the
  clip.
- ⚠ **THE HUD'S READOUT IS SOMETHING THE STICKY BED CAN SILENTLY TAKE AWAY.**
  `useLandingScroll` picked the active station from the PAINTED rect, last wins,
  `#contact` last — so once the bed armed the corner read CONTACT for the whole
  beat. ⚠ `offsetTop` does NOT rescue you: it reports the stuck position too
  (measured `#contact.offsetTop` 17174 against `#musings`'s 17217, a station
  beginning before the one above it). The truth for a stuck station is the
  BOTTOM of the one above it, narrowed to `position === "sticky"` because the
  phone's `#about` takes a `-100svh` weld. The capture asserts the readout at
  every stop.

## Verifying

```bash
npx vitest run tests/lib/musings-row.test.ts tests/lib/rail-manifest.test.ts \
  tests/lib/v7-parse.test.ts tests/lib/section-label.test.ts \
  tests/lib/rail-instrument-marks.test.ts tests/lib/detentTable.test.ts \
  tests/lib/footer-nav.test.ts tests/lib/socials.test.ts \
  tests/lib/musings-registry.test.ts tests/lib/theme-css-sweep.test.ts \
  tests/lib/type-material-tokens.test.ts tests/lib/phone-viewport-units.test.ts
npx playwright test tests/visual/about-voidwalker-handoff-boundaries.spec.ts --workers=1
npx playwright test tests/visual/services-ring-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop  # WITHOUT --update-snapshots
npx playwright test tests/visual/mobile-section-seams.spec.ts \
  --project=iphone-14-chromium --project=iphone-14-pro-max-chromium
node scripts/capture-musings-row.mjs --vp 1920x1247 --theme dark --perf   # and light, 1280x720, 390x844
node scripts/capture-musings-row.mjs --lab --n 5 --vp 1920x1247 --theme dark   # the placeholder host
# the capture gates: card 0 open at rest at ≥ 3× a strip; hover card 2 opens it
# inside --mu-grow and collapses card 0; leaving restores card 0; Tab opens as
# hover does; the title's laid-out width equal open and closed; glass on every
# face on the stage rung in dark and on none in light or under reduced motion;
# the head EMPTY off the pin and whole through the dwell; the TR-only notch
# hit-tested from both ends; the bed, the readout and the footer's reveal
node scripts/capture-site-footer.mjs  --vp 1920x1247 --theme dark   # the bed must not move
```

Then, **from PowerShell** (Git Bash rewrites a `/route` argument into a Windows
path):

```powershell
node scripts/design-eval/mechanical.mjs --url / --theme dark  --scope ".mu" --prm
node scripts/design-eval/mechanical.mjs --url / --theme light --scope ".mu" --prm
node scripts/design-eval/mechanical.mjs --url /test/musings-row --theme dark --scope ".mu"
```

⚠ **IT FAILS WITH SIX FINDINGS IN EACH THEME, AND THOSE SIX ARE KNOWN (ADR-119
U3, 2026-09-22).** They are the title's gold glow (×5, the house display recipe
the gate bans; the services masthead lists the same five) and the coord stamps
at 1.43 / 1.40:1 (faint by the survey grammar). Both are open owner calls. A
SEVENTH finding is a regression.

⚠ **Every `--mu-ink-*` rung is TEXT.** The third is .54 here and .62 on
parchment (`theme.css` BLOCK 4e). A drawing that wants a quieter ink takes
`--mu-draw`, never a text rung, or a contrast fix darkens the covers.

⚠ **AND LOOK AT THE STILLS.** Every defect this station has found that mattered
to the composition — the pooled slack that put 205px between the masthead and
the top card, the tipped card painting 140px off its rect — was invisible to
every green gate. ⚠ **RE-RUN A SCROLL SPEC ON A WARM, QUIET SERVER BEFORE
BELIEVING A FAILURE**: five `services-ring-mobile-smoke` cases failed while
this sheet was being edited between runs and all nineteen passed in one quiet
pass.

**Process:** [sentinel/MAINTENANCE.md](../../sentinel/MAINTENANCE.md) — Cycle B
for a new surface, Cycle A after fixes.
