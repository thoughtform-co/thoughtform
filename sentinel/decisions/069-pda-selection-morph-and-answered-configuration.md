# ADR-069: The selection is the persistent object, and the configuration answers

- **Status:** Accepted
- **Date:** 2026-08-08
- **Owner call:** yes (the reference boards + the two scope answers, this date)
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
