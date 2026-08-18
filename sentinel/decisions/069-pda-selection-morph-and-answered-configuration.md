# ADR-069: The selection is the persistent object, and the configuration answers

- **Status:** Accepted — ⚠ **see [Update 1](#update-1--the-object-the-flight-carried-was-two-drawings-2026-08-13-owner)
  (2026-08-13): the persistent object was TWO DRAWINGS, and the card's interior
  is now guarded as one at both scales**
- **Date:** 2026-08-08 (U1 2026-08-13)
- **Owner call:** yes (the reference boards + the two scope answers, this date;
  U1's harmonisation + the drop-autonomy scope answer, 2026-08-13)
- **Surface:** `components/landing/home-v2/services/casefile/map/pda/**`
- **Builds on:** [ADR-063](063-map-reading-rail-and-wheel.md) (the three readings,
  the rail, the wheel — all unchanged), [ADR-064](064-casefile-console-frame.md)
  (the console frame this draws inside), [ADR-062](062-intelligence-map-city.md)
  (the content model and the confidentiality envelope, both binding),
  [ADR-061](061-intelligence-map-work-configurations.md) (the bound on measurement
  this obeys — "at most the two one-shot rect reads for a click-driven morph"),
  [ADR-067](067-casefile-type-and-clutter.md) (the type-by-role law)
- **Rules:** [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

The owner's ask, with two Cyberpunk 2077 reference boards (the inventory board
and the character sheet): _"When you click on a workstream it should elegantly
morph into this kind of configuration."_ Plus a scope answer on each of the two
questions that ask: **the return flies too**, and the configuration gets
**answers plus a readout**, not motion alone.

Two things were true of reading 02 before this pass, and both were invisible
from inside it:

**It said nothing about the stream it was showing.** The four modules printed
`WHAT RUNS IT` · `WHAT IT CAN REACH` · `WHAT IT INHERITS` ·
`WHAT IT IS HELD TO` — four questions, identical for all twenty-seven streams.
Meanwhile every configured work in the record carries nine authored, already
confidentiality-cleared pairs (`CaseMapConfiguration`: the Skill, the lane, the
context, the graph node, the systems, the surfaces, the gate owner, why this
lane) and `PdaWork` dropped all of them but `p[0]`. So a reader could open any
of twenty records and get the same drawing back. The reading was a diagram of a
configuration rather than a configuration.

**The transition was a cut.** Reading 02's core IS the clicked cartridge at
`CORE_K` — the same glyph, the same record, 1.42× — and the switch threw the
first away and mounted the second, with the scan sweep as the only bridge. The
one object that genuinely exists in both readings was the one thing that did not
survive the change.

## Decision

### 1. The selected work is the persistent object, and it FLIES

**Reading 01 draws it as a cartridge in the grid; reading 02 draws it as the
core. A change between those two readings does not replace it — it moves.**
Everything else re-rasters around it on the existing sweep and the existing
staggered entrances.

This is what lets the readings stay what the owner ruled them to be —
**terminal display-switching, not zoom.** The field never scales and no
`viewBox` is tweened (it is not CSS-transitionable in any case). One object
travels across a display that changed what it shows.

`entry` is which gesture the selection takes on the transition just committed:

| from → to                                                  | gesture                                      | why                                                                     |
| ---------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| 1 ↔ 2, any trigger — click, rail, `1`/`2`, wheel, `Escape` | **flight**                                   | the record has a home in both                                           |
| 3 → 2                                                      | bloom                                        | ADR-063's existing gesture; the substrate has no per-work home to leave |
| 3 → 1                                                      | bloom on the selected cartridge, once opened | so the reader can find where they were                                  |
| interrupted, or a collapsed box                            | raster                                       | see §4                                                                  |
| anything → 3                                               | raster                                       | the substrate counts the estate, not one stream                         |

The default selection flies too. Entering reading 02 from the rail or the wheel
carries `shown[0]`, which is what teaches the mechanic to a reader who has not
clicked anything yet.

### 2. The flight is arithmetic, not measurement

`pdaFlight.ts` is pure, unit-pinned, and takes the ONE rect the caller reads:

```
meet = min(box.w / crop.w, box.h / crop.h)          // xMidYMid meet
screen = offset + (unit − crop.origin) × meet       // forward, source crop
unit   = crop.origin + (screen − offset) / meet     // inverted, target crop
dk = source.w × meet₁ / (target.w × meet₂)
```

Two properties make it robust against everything the casefile does to this
subtree while it arrives, and both are asserted:

- **the box's x/y never enter the arithmetic**, so the proof ladder's translate
  is invisible to it;
- **a uniform ancestor scale multiplies both meets equally**, so it cancels out
  of the deltas and out of `dk`.

Centres, not corners, because `flPdaDock` shares `fl-pda-bloom`'s frame
(`transform-box: fill-box`, a centred origin) — one convention for both.

`tests/lib/pda-flight.test.ts` checks the thing that actually matters: that the
object does not move on screen at the instant the crop changes. It resolves the
start pose back to screen pixels and compares it to where the source was, for
all twenty slots, both directions, at four field sizes. That is an equality
between two projections; it does not need a browser, and the smoke could not
tell you which term was wrong.

### 3. The core cartridge is the only child of the docking group

The flight measures its origin from the group's own fill box. The Cartridge's
body path touches all four extremes of `(x, y, w, h)` and every text sits
inside it, so the box is the rect — deterministically, with no measurement.
**A child that reached past the path would move the origin under the flight.**
The core's pad fringe is therefore a sibling, arriving after the dock lands.

### 4. Three guards, and all three are cheap

- **The dock is NOT gated on `still`**, unlike every other class on this sheet.
  An element arriving under a stationary pointer fires `mouseenter` on the next
  move, and a hover that stripped the class mid-flight would snap the object
  across the panel. `entry` is state, decided once per transition, so hover
  repaints keep it and nothing replays.
- **An interrupt declines to fly.** A 1 ↔ 2 transition arriving within
  `PDA_FLIGHT_GUARD_MS` of the last flight rasters instead: its start pose would
  be computed from a rect the object has not reached. Reading the painted pose
  would cost a `getComputedStyle` ADR-061 does not permit here. The wheel
  cannot interrupt a wheel-driven flight at all — the 470 ms lockout outlasts
  the 420 ms travel, which is luck rather than design, but it is checked.
- **A collapsed box bails.** Below the desktop gate the console is
  `display: none` and `getBoundingClientRect` reports zeros.

No rAF, no wall-clock, no post-hoc measurement. One rect read per transition,
taken before the state changes, while the outgoing crop is still in the
attribute.

### 5. The four questions get four answers, and the readout carries the note

The drawing letters the NAME and the readout carries the SENTENCE — the same
division ADR-062 settled for the city, where provenance rides the material
language and is never also written down.

| module             | line a           | line b          | readout on hover                                   |
| ------------------ | ---------------- | --------------- | -------------------------------------------------- |
| WHAT RUNS IT       | the Skill        | its lane        | what the Skill is composed of — what the lane does |
| WHAT IT CAN REACH  | the first system | where it is met | every system, joined, and the surface              |
| WHAT IT INHERITS   | the context      | the graph node  | what each carries                                  |
| WHAT IT IS HELD TO | the bar, wrapped |                 | who answers for the gate — how it is checked       |

Rest state: **why this lane and not a lighter one.** One line, size 10, the
only copy on this drawing that answers to the pointer.

⚠ **`WHAT IT IS HELD TO` ANSWERS WITH THE BAR, and `evals` cannot sit in a
module.** `evals` runs to 41 characters ("BRIEFS THAT SHIPPED + BRIEFS THAT
STALLED") against a 151-unit measure — 142 %, unletterable at any size that
clears the floor. Its first `+`-clause misses too, at 29 characters. So the bar
is the honest answer to the question and `evals` goes to the note, where 41
characters is 38 % of the room. Same reasoning for the systems: `k` joined runs
to 35 characters (121 %), so the module letters `k[0]` and the readout takes the
whole join. **Nothing is lost; it moves to the hover.**

⚠ **NO PAIR MARK between the Skill and its lane.** They are an interdependent
pair — the owner's 2026-08-05 ruling — but this surface has NO LEGEND by law,
and a glyph a reader cannot resolve is worse than two lines standing together
inside one module. It would also have been a `⇄` in a face whose coverage is
not guaranteed, which breaks the advance the whole fit table is built on.
Considered and rejected.

### 6. The type is derived from the module, and the module is the tight box

Answer measure = `w − h − 11 − 6` = **151** at 224×56: the divider sits a full
`h` from the inboard edge (the gauge needs it), the text is inset 11 past it,
and the cartridge title's own 6-unit wall clearance applies.

```
role      longest live string           chars  of 151 at size 8
graph     COMPONENT + SUPPLIER FACTS     26      93.6 %   ← the ceiling
skill     BRIEFING INTELLIGENCE          21      75.7 %
surface   CHAT + PLANNING BOARD          21      75.7 %
system    CODE + TEST RUNNER             18      64.9 %
context   STRUCTURAL LIBRARY             18      64.9 %
lane      EVERYDAY LANE                  13      46.9 %
```

**8 is the largest size with room left.** 8.5 puts the graph node at 99.5 % of
its measure — one authored character from the wall — and 9 is over it. The
header keeps the module label's `.14em` (advance 0.74, a DIFFERENT measure) at
7.5, smaller than its answer, because the question is chrome and repeats on
every stream while the answer is the record.

⚠ **The vertical clearance is measured against the LINE BOX, not the font
size** — ~1.3 em for this face. Two answers 20 units apart clear each other by
8; the 12 a naive reading suggests leaves under 2, which is inside the smoke's
own noise. This is the same mistake the DECIDES ALONE pair paid for at
ADR-063's 13 units, one size down. `MONO_LINE_BOX` and the two baseline
functions are exported so the guard re-checks the arithmetic rather than
trusting the browser to notice.

### 7. Person-led work answers all four questions

`cfg: null` prints what is NOT bound rather than emptying out — the same copy
the city's unit sheet uses, so the two surfaces cannot drift into describing
one absence two ways. "CONTEXT HELD BY THE PERSON" is 26 characters, i.e. it
lands on exactly the same ceiling as the graph node, which is why the size is
derived from both. An empty module would read as a drawing that failed to load,
and the negative space is the reading leadership takes.

Its readout rests on the **bar**: no lane was chosen, so there is no "why this
lane" to print, and the bar is what the person is holding themselves to.

### 8. The open record is marked, and only once it has been opened

The selected cartridge lights its own CUT EDGE. The notch is where a cartridge
is keyed, so the selection reads as latched rather than as a fifth state of the
gauge, and it needs no legend because the reader is looking at the record they
just opened. Nothing is marked until reading 02 has been shown at all —
`shown[0]` is the rest state, and lighting a record the reader never asked for
claims they left it open.

It also gives the return flight somewhere legible to land.

## Incident: three of twenty could not be clicked, and no guard could see it

**A person-led cartridge's body is `fill: none`** — the record, not an omission
— and an unfilled SVG path hit-tests on its STROKE alone. So clicking the
middle of the card, which is where a reader clicks, reached the bare `<svg>`
and did nothing. `document.elementFromPoint` named all three person-led streams
at once: CONCEPT IDEATION, BOARD NARRATIVE, SUPPLIER TERMS.

This predates this pass. It survived because the keyboard path was unaffected
(`Enter` on a focused cartridge worked), and because the smoke's cartridge case
clicks `.fl-pda-hit` **first**, which is configured and filled. A surface whose
whole argument is that the negative space is a reading had lost the control on
exactly the three records that carry it.

The fix is a transparent hit rect matching the path's extremes — so the group's
fill box, which the flight measures its origin from, does not move. The guard
is new and mechanical: **hit-test every cartridge at its own centre**, which is
the check that would have caught it.

## What did not change

`pdaWheel.ts` and its sixteen cases; the 470/620 lockout–sweep pair; the rail;
the crops; `CONTENT[2]`'s extents; readings 01 and 03 apart from the selection
mark; `lib/cases/**` — every string this draws was already inside the registry's
confidentiality walk. `types.ts` keeps zero imports.

## Verification

- `tests/lib/pda-flight.test.ts` — 16 cases: the round trip, four field sizes ×
  twenty slots × both directions, ancestor-scale invariance, the direction of
  `dk`, the reciprocal, the degenerate bails, the guard outlasting the travel.
- `tests/lib/pda-viewbox.test.ts` — 21 cases: every answer line on all
  twenty-seven streams against the 151-unit measure, the bar rejoining
  losslessly at 27 characters (a slice that truncated would pass every width
  assertion), the header at its own tracking, the line-box clearances, the
  readout's rest state and all four notes, the person-led fallbacks, and the
  two rank orders (answer > question, readout ≥ answer).
- The smoke's casefile case — the reading opens on the stream that was clicked
  (by name, read from the record), it prints that stream's lane, the readout is
  present (the one string over 40 characters), the open record stays marked, and
  **every cartridge takes a click at its centre**. All six reference viewports,
  three readings: 0 overlaps, 0 clipped, no field scroll, rendered type ≥ 4.3 px.
- Measured at 1280×720 on a 603×493 field: reading 02 renders 24 texts, worst
  type **5.65 px**, 0 overlaps. Light theme worst text **4.79:1** on the
  parchment ground.

## Left open

- **The question headers join the `--pda-txt3` cohort at 2.93:1 in DARK.** That
  is ADR-063 U2's named open item (~0.52 alpha would fix it, owner's call), not
  a new defect — the same token already carries `THE CONFIGURATION`,
  `DECIDES ALONE`, and every cartridge's team code. Light is guarded and passes.
- **The core's interior is unbalanced at 1.42×.** The gauge and vents cluster
  top-left and the lower middle is empty. It is the cartridge's own proportion
  scaled up, and filling it means inventing a claim, so it waits for content
  that already exists.
- **The reverse flight paints in document order**, so a returning record can
  cross cartridges drawn after it. The non-selected stagger carries a 90 ms
  lead to keep the travel legible; the DOM is deliberately not reordered,
  because that would reorder the tab sequence with it.
- **`MONO_ADVANCE` is still PT Mono's advance while the SVG renders in
  `--font-mono` (IBM Plex)** — ADR-067's open item, untouched here. Every fit
  number above uses 0.68 consistently and the smoke re-measures real glyph
  boxes, so the guard is honest either way; the fix moves every label on all
  three readings and is its own pass.

---

## Update 1 — the object the flight carried was two drawings (2026-08-13, owner)

> _"So in the work tab in our proof section, when you click on intelligence map,
> if you go to work the styling of the work cards should match the ones in
> configuration. In configuration, at the center, you will see that the workflow
> or work title is a bit higher. It looks a bit different, so please harmonize
> the ones in work so it matches the middle campaign copy."_

**This ADR's central claim was false in the one way nothing could see.** §1 says
the selected work is a persistent object that MOVES rather than being replaced,
and the flight arithmetic delivers exactly that — the rect travels, the scale is
uniform, `pda-flight` pins it across twenty slots × two directions × four field
sizes. But between 2026-08-10 and 2026-08-12, ADR-070 U2 → U13 redrew reading
02's card five times on the owner's mockup and then on the R4 handoff, and
reading 01's `Cartridge` kept v18's interior throughout. So the object arrived
at its destination having changed:

|            | reading 01 (before)                     | reading 02                           |
| ---------- | --------------------------------------- | ------------------------------------ |
| silhouette | notch, TOP-LEFT                         | chamfers, TR + BL                    |
| state      | a 22-unit CIRCLE gauge, in its own band | R4's squared mark, in the header row |
| configured | **green**                               | **gold**                             |
| title      | 68 % down                               | 28 % down                            |
| foot       | lane · autonomy, a pinned pair          | the four-cell lane meter             |

**Why every guard stayed green.** `pda-flight` measures the two RECTS. A rect is
a silhouette; it says nothing about what is drawn inside it. And each drawing's
interior was measured only against ITSELF — `pda-viewbox` walked the cartridge
against hardcoded `w - 19` / `w - 25` measures, and `configurationLettering`
declared the seat's strings against R4's. **Two complete, passing guards, and
nothing in between them.** The defect lived in the relationship, which is the
one place a per-object test cannot look.

### The decision: `CARD` is `SEAT` ÷ `CORE_K`, and a test holds the pair

`pdaGlyphs` owns `CORE_K` and a new `CARD` block whose every value is the seat
card's own divided by `CORE_K`; `PdaConfiguration` keeps `SEAT` in R4's authored
integers. **Neither derives from the other at runtime** — R4's are integers and
the grid's are 1/1.7 of them, so whichever way a multiply runs it lands one
drawing on 17 significant digits for nothing. `tests/lib/pda-card.test.ts`
asserts the RELATIONSHIP, rung by rung, plus one guard the pairwise walk cannot
give: **a rung present on one card and absent on the other fails**, which is the
form this drift actually took. `StateMark` and `LaneMeter` are single shared
components for the same reason.

### The title is the one measure that is deliberately NOT shared

The owner named the title, and it is the one rung where parity is the wrong
answer. The seat hangs its title 28 % down and fills everything beneath it with
THE BAR. The owner's scope answer was **styling, not content** — no bar copy on
the grid card — so seat parity would pool **80 units, 59 % of the card, into one
hole**. This surface already has a rule for that and it is `configLayout`'s:
**split the slack, don't pool it.** The header row and the foot sit at seat
parity, the title takes the middle with equal air either side — baseline 71.75,
so the title lifts from 68 % to **53 %** down. A card that DOES letter a bar
takes `CARD.titleSeated` and gets seat parity, because then the space is not
slack.

**Proportional type parity is not available at 59 % of the size.** The seat's
22-unit title ÷ `CORE_K` is 12.9 and `CART_TYPE.title` is capped at 11.5 so that
none of the twenty titles wraps. Geometry scales; type is derived from each box's
own measured slack. That gap is ADR-063 §Outstanding and it stays.

### Two rulings that are not styling

- **The corner is ADR-065's, not v18's.** A single notch IS lawful for a uniform
  set inside a chamfered housing (ADR-065 U1) — but only "on the lawful
  diagonal", and top-left never was one. The chamfer pair is what reading 02 has
  carried since ADR-070 U13 put it back on the canonical diagonal. ⚠ The
  selection now lights **both** diagonals: lighting one of a symmetric pair reads
  as a rendering fault rather than as a latch.
- **`cfg` went green → gold, and it is a ROLE fix.** R4's law is gold =
  wayfinding, green = the human and nothing else (ADR-070 U11), and the seat
  plate is the green object on this instrument. v18 painted _configured_ green,
  so the same stream was green in one reading and gold in the other and **the
  flight changed the object's colour in mid-air**. What green was carrying
  survives twice over: solid gold against a dim DASHED body, and a squared mark
  against a crossed one.

### What came off the card

The three vents (material language the seat does not speak), the divider (R4
makes the gold key the separator), the circle gauge's whole band — **and
`autonomy`**, on the owner's "drop it" answer. Reading 02 letters autonomy on the
OWNER PLATE, which is where a person's latitude belongs; printed in both places
it is this surface's said-twice defect. ⚠ **The foot is no longer a PAIR** — it
is one left-anchored run, so what it can overflow is the far wall rather than a
neighbour in the middle, and the guard's question changed with it rather than
being deleted.

### Fixed in passing

**`Cartridge`'s `bar` hardcoded `fontSize="10"`, unscaled** — the recorded reason
every config-lab variant's minPx stuck at 5.4px however large its card was
(ADR-070 U8's open item, and the reason `seated` drew its own bar). It scales
with `k` now. Production passes no bar, so the fix only reaches the labs, which
is where the defect was measured; their quoted numbers are now a record rather
than a render. **`cartTitleChars` was also missing `k`** — the measure scaled
with the box while the divisor did not, so a card mounted at k 2 allowed 42
characters where 21 fit.

### Verification

- `tests/lib/pda-card.test.ts` — 18 cases: ten rungs at 1/`CORE_K`, the title's
  named divergence, the no-unpaired-rung walk, every live title on one line, wrap
  capacity invariant under scale, the rank order, the header pair against the
  mark's new left anchor, the foot's single run against the far wall, and the two
  homes agreeing on the lane for all twenty-seven streams.
- `tests/lib/pda-viewbox.test.ts` — the cartridge block MOVED OUT (its two
  hardcoded measures were half the original problem); 25 cases still green.
- `tests/lib/pda-flight.test.ts` — 18 cases unchanged, which is the point: the
  silhouette did not move.
- Measured on the live landing at the casefile beat, both readings, 1280×720 and
  1920×1080 — fields 603×493 and 850×760, the numbers this ADR and ADR-070 cite.

### Left open

- **The card's interior is still unbalanced, and now differently.** §"Left open"
  above recorded the 1.42× core as top-left-heavy with an empty lower middle;
  that is fixed on the seat (the bar fills it) and traded on the grid (the title
  is centred in slack rather than seated under the header). A reader comparing
  the two side by side sees a title 25 points lower on the small card. Closing it
  means content, and the owner's answer was that the grid card letters none.
- **`--pda-void` under the wash means no state is `fill: none` any more**, so the
  three-of-twenty click incident above can no longer happen the way it did. The
  hit rect and its guard both stay: the invariant is what matters, not the two
  ways it currently happens to hold.

## Update 2 — the persistent object gets a THIRD home (2026-08-17, owner)

⚠ **THE CLAIM'S SCOPE GREW.** U1 said the selected work is a persistent object
that flies between reading 01's grid and reading 02's core seat. ADR-070 U25
promotes `SECTION` to reading 03 (see there for the full drawing story), and
SECTION puts twenty ghost cartridge FOOTPRINTS at the top of the substrate.
The selected footprint takes the same lit-edge grammar the grid card does — so
the persistent object has three homes, not two.

### One kernel, no changes; one caller factored

`pdaFlight` was never coupled to a specific pair of readings — it takes two
crops and two rects and computes the pose. The old `entryFor` in `PdaConsole`
hard-coded the pair as `(from === 1 && to === 2) || (from === 2 && to === 1)`
and handled 03→01 as a bloom. The new `entryFor` factors that into a small
pure helper:

```
const rectFor = (view, id) => match(view) {
  1: { crop: layout1.crop, rect: gridRect(i, layout1) }
  2: { crop: layout2.crop, rect: layout2.core }
  3: { crop: layout3.crop, rect: estateFootprint(shown, id, PAD, PAD, W) }
}
```

`entryFor` walks it for any (from, to) with `from !== to`; the flight
computes; `bloom` remains the graceful fallback when a source rect is
unavailable (a stream not on the board, or one of the two views being 03
without an open selection). The 01↔02 case is byte-identical to U1 — the
pair of `pdaFlight` calls collapses to one call through `rectFor` — so the
existing `pda-flight` cases still pass unchanged.

### The footprint is a SIMPLIFIED silhouette, at 40 × 30

⚠ **THE FOOTPRINT IS NOT A `CARD` AT `k_foot`, and this is a trade rather
than a mistake.** A full `Cartridge` at 40u wide would letter its title at
~2.6px and its team code at ~2.5px, both well under the 4.6px floor
`pda-viewbox` asserts on the elastic crops. So the footprint is silhouette
ONLY (a cartridge outline with the same TR+BL diagonals and a proportional
4u chamfer) and letters nothing.

⚠ **THE ASPECT IS 40/30 = 1.333, THE CARTRIDGE'S IS 176/136 = 1.294** — a
3 % divergence, which `pdaFlight`'s uniform `dk` cannot fully carry. In
flight the object arrives 3 % skewed on one axis for a frame; measured, and
below the frame-rate threshold at which a shape read as re-proportioned.
`pda-flight` asserts the aspect delta stays under 5 %; a wider tolerance
would let the two homes diverge into different silhouettes over time.

### What the fit / measurement guards check now

- `pda-flight`'s twelve new cases: 1↔3 and 2↔3 round trips at the binding
  and the owner's tall viewport, plus the footprint-aspect parity
  (<5 %), the null-fallback contracts (ghost id, no selection), and the
  every-configured-stream-has-a-footprint sweep.
- `pda-substrate-fit`'s section suite: the estate band's slots tile the
  row and stay inside the plate; the same `estateSlots` arithmetic runs
  in the flight (`estateFootprint`), so a slot moved by a cluster comma
  cannot leave the flight landing on empty space.

### Left open

- **The person-led case.** Person-led footprints draw a DASHED outline and
  still fly on click — they open reading 02 the way any other stream does.
  If the owner later rules that person-led work should not open a
  configuration reading (the record has nothing to configure), the fix is
  a click gate on the footprint's `onOpen`, not on the flight kernel.
- **The footprint scale as an ADR-069 rung.** `pda-card` walks the CARD
  and SEAT parity rung-for-rung; the footprint is not part of that walk
  because it is a silhouette, not a full card interior. The aspect parity
  is asserted in `pda-flight`, which is the surface the divergence would
  actually cost.
