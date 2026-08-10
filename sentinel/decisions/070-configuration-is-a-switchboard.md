# ADR-070: The configuration is a switchboard

- **Status:** Accepted
- **Date:** 2026-08-09
- **Owner call:** yes — "implement this on our home page", after the lab pick
- **Supersedes:** ADR-069's DRAWING for reading 02 (its morph, its answers and
  its readout all survive; only the picture changed)
- **Surface:** `components/landing/home-v2/services/casefile/map/pda/**`, the
  casefile's lead row on the landing

## Context

ADR-069 gave reading 02 the selection morph and, for the first time, the
record's own answers. The owner's verdict was that the motion was right and
the drawing was not: it still read as **four modules plus a core**, which is
what it had been before the answers arrived.

`/test/intelligence-config-lab` was built to answer that (proof.md §The
CONFIGURATION lab) with four archetypes beside the shipped reading — a
motherboard die, a signal chain, a cutaway, a schematic. The owner's read on
that set was harder than the first: **all four were safe iterations of the
drawing they were meant to challenge.** The diagnosis, recorded because it is
the transferable part:

1. Every variant kept the shipped reading's SKELETON — question-headers
   arranged around a centred core, a tidy substrate strip along the bottom —
   so they were reskins by construction.
2. The reference boards were mined as a PARTS CATALOG (chips, gold fingers,
   pin fringes) instead of for their COMPOSITION. In the reference, roughly
   two-thirds of the ink is **wiring**; in all four variants the connections
   were single polite hairlines carrying about 5 %.
3. The fit guards were allowed to drive layout. Symmetric grids are easy to
   prove collision-free, so the drawings optimised for passing rather than for
   the picture. **Guards police a drawing; they must never compose it.**

A fifth variant — the SWITCHBOARD — was built wire-first from the reference's
composition. The owner picked it, asked for two reductions, and then for it on
the landing.

## Decision

**Reading 02 is the switchboard.** `PdaConfiguration.tsx` replaces the old
`ViewConfiguration`, which is deleted rather than flagged.

- **The wiring is the picture.** Multi-conductor ribbons (`ribbon.ts` — pure
  offset-polyline geometry holding pitch through 45° bends, unit-pinned) carry
  most of the ink. Every run **lands on a pin** of the chip's nib rows.
- **ONE frame, ONE bright object.** The chip IS the reading-01 cartridge grown
  to `CORE_K` — the lit plate is painted on the cartridge's own notched
  silhouette, the nibs hang off its edges, and there is no carrier housing
  around it. Hierarchy is carried by VALUE: the chip is lit and the periphery
  recedes through amber line work to ghosted ornament.
- **A different silhouette per part.** Six packages, each with a drawn glyph
  and a tiny function tag rather than a question header: SKILL (lattice) and
  LANE (oscillator) marry at a junction block and enter as one trunk; CONTEXT
  (stacked trays) and GRAPH (dashed node, the adjacent-domain hand) turn up
  into the pin row; SYSTEM (port) and SURFACE (aperture) take the output.
- **The gate is an aperture the output passes through**, with the bar lettered
  on it and the seat that answers for it beneath.
- **The substrate row draws only what the record connects** — one labelled bus
  bar per shape the stream taps, inline on its own trunk, carrying that
  shape's own Skill count.
- **ADR-069's contracts are unchanged.** The flight still docks the cartridge
  (`CORE_RECT` is the chip now); the readout is still ONE reactive line that
  rests on why-this-lane and swaps to a hovered part's note, and hovering
  either half of a pair lights both, because they are one answer.

### What the owner removed, and why it is contract

- **The 47 skill-mark cells.** The bar keeps its shape's count, so the
  substrate's depth survives without the terminal banks.
- **The ghosted loom of untapped shapes.** Reading 03 owns the estate; this
  reading is about one record. Slots are therefore authored PER COUNT (1–3)
  rather than per shape key — a fixed home per shape put all three of a
  record's bars in one corner and left the other half empty.
- **The off-board continuation above the system chip.** A system a stream acts
  on is a terminus on this reading, not a transit.

### The crop is tight, and that is the type

`CONFIG_VIEWBOX` is `56 20 910 740` — the drawing's own content box, not its
1000×760 authoring space. At the binding field (603×493, the real console at
1280×720) that buys the whole reading 10 % of rendered type: **4.97 px on the
smallest rung**, measured on the landing, against the smoke's 4.3 px floor and
the 4.5 px the untightened crop gave. The ghost ribbons run off all four edges
deliberately; a wire that leaves the board is the point.

## Consequences

- `pda-viewbox` measures the drawing's OWN fit declaration
  (`configurationLettering` — every string with the measure it must fit) for
  all 27 streams, instead of re-deriving the record. A guard that re-derives
  its inputs cannot notice the drawing pointing at the wrong field.
- The lab's `shipped` variant now mounts this module from production and its
  local copy is deleted. Two drawings claiming to be the same one is how a lab
  goes stale (the `/test/field-log-lab` precedent).
- `Module`'s answers mode and the `MODULE_TYPE` / `moduleAnswer*` /
  `MONO_LINE_BOX` helpers went with the old drawing. `Module` itself stays —
  reading 03 draws its shape modules with it.
- `PdaEntry` moved to its own module: reading 02 now supplies reading 01's
  crop, and one shared type is what keeps that from becoming an import cycle.

## Traps

- ⚠ **RIBBON-VERSUS-BOX IS HAND-CHECKED.** The fit guard and the smoke both
  measure TEXT; neither can see a conductor crossing a package. The first cut
  ran the inherit ribbons horizontally ALONG the nib tips, and five conductors
  crossing a pin row at 45° read as a hatch patch rather than a connection.
- ⚠ **THE CAPTION COUNTS SHAPES, NEVER SKILLS.** Three bars reading 12, 9 and
  14 sum to 35, so `47 SKILLS` beside them would publish two totals a reader
  can subtract. `DRAWS ON n OF 5 SHAPES`, both numbers derived; the reservoir
  belongs to reading 03. Pinned.
- ⚠ **A FOURTH TAP WOULD SILENTLY LOSE A BAR** — slots are per count.
  `CONFIG_MAX_BARS` is asserted against the record.
- ⚠ **SCROLL IS THE ROW SELECTOR when verifying.** The browse band's first
  quarter is the map; 0.35 of the dwell lands on the Studio row's sheets, and
  a capture script looking for `.fl-pda__svg` there finds nothing.
  `scripts/capture-map-readings.mjs` defaults to `--at 0.09` for that reason
  and must run HEADED (the corridor is WebGL).
- ⚠ **The dock is still not gated on `still`** (ADR-069) and `PDA_FLIGHT_MS`
  is still duplicated in `pda.css`. Both unchanged, both still load-bearing.

## Verification

- `pda-viewbox` (20), `pda-flight` (16 — the two rects are now EXACTLY similar,
  176×136 × 1.6, so the morph holds proportion), `pda-wheel` (16),
  `cases-registry` (34), `config-lab-fit` (4). `npm run verify`: 618 tests.
- `tests/visual/services-ring-smoke.spec.ts`: 21 passed / 31 skipped, which
  includes readPda across six viewports (0 clipped, 0 overlaps, minPx floor),
  the cartridge-click case, the wheel's capture-and-release, the light-theme
  contrast walk and the PRM unwrap.
- On the landing at 1280×720, measured: field 603×493, meet 0.662, 31 labels,
  minPx 4.97, 0 clipped, no page errors. Stills in `docs/design/map-readings/`
  including the morph sampled at 150 ms and 300 ms.
- The lab matrix re-captured: 55 samples, both themes, gates green.

## Left open

- Readings 01 and 03 are unchanged and still letter at ~4.5–5.5 px against the
  8.5 px chrome floor (ADR-063 §Outstanding). Reading 02 is now the BEST-set
  reading on this surface rather than the worst, which sharpens rather than
  answers that gap.
- The four lab archetypes stay on the route as the alternatives beside the
  shipped drawing. They are look-dev, not dead code — but if a second
  direction ever wins, delete the losers rather than keeping five.

---

## Update 1 — the simplified board: radial runs, shaped parts, legible tags (2026-08-10, owner)

Owner review of the shipped switchboard against a new reference screenshot
(the CP2077 character screen — the central chip with trace bundles fanning
out radially) and their own `thoughtform-intelligence-map-v19.html` mockup,
with the instruction that v19 is a source of ELEMENTS, never a verbatim
install. Three complaints, quoted: _"there's too much going on"_; the skill
and lane parts are _"just simple squares… with the simplified version we
have more real estate, so we can make it a bit more unique"_; the function
tags are _"gray font… too small, which is completely and utterly
unacceptable."_

### What the reference actually has that the first cut did not

The promotion pass took the reference's RIBBONS but not its ORDER. The
shipped board wired the chip from all four sides — a junction block west, a
doubled SYSTEM connection (top pins AND the gate fan), ghost bundles
crossing the whole field — so the reading had the reference's ink without
its radial calm. The simplification is compositional, not cosmetic:

- **EVERY RUN IS CENTRE-OUT.** Six part bundles, one per part, each leaving
  a chip pin row for its own housing. The two junction blocks are deleted —
  the Skill and its lane still read as the interdependent pair by landing on
  ADJACENT pin bands (286/324) and lighting together on hover.
- **ONE OUTPUT, ONE GATE.** The doubled SYSTEM wiring is deleted: a single
  8-conductor trunk leaves the right pin row, passes THROUGH the gate
  aperture, and forks at x 926 — up into the SYSTEM port's plug, down onto
  the SURFACE aperture. Everything the stream reaches passes the bar, which
  is now drawn as well as claimed.
- **THE GHOST RIBBONS ARE DELETED**, and the ornament is trimmed (16 → 10
  vias, 3 → 2 pad clusters; the six vias that went sat inside the owner
  plate, the graph block, the bar band or a live channel).
- **THE OWNER DOCKS ON A FACING PIN SEAM** (v19's device): plate directly
  above the chip, five pins down, the chip's own nibs up, never touching.
  The long arrowed wire is gone, and DECIDES ALONE · {autonomy} shares one
  baseline beside the seam.

### A part is a housing, not a square

The six 120×86 rects with 16×16 corner glyphs become six drawn silhouettes,
176 wide (the cartridge's own width — the family rhyme), the glyph
vocabulary scaled up to BE the block; the corner glyphs are deleted with
the room they no longer earn:

| part    | silhouette                                       |
| ------- | ------------------------------------------------ |
| SKILL   | notched plate (TL cut) + the encoded hatch band  |
| LANE    | chevron bar, point feeding the chip              |
| CONTEXT | housing with offset sheet echoes above it        |
| GRAPH   | dashed hand + dashed inset (the adjacent domain) |
| SYSTEM  | port with a pinned plug on the board-facing edge |
| SURFACE | two open brackets — a frame people look through  |

Person-led keeps every silhouette (shape carries role even unbound) and
goes dashed `--pda-txt3`; the negative space stays a reading.

### The type, derived not chosen

Probed against the record's own worst strings (2026-08-10):

- **Tags 7.5 → 10, `--pda-txt3` → `--pda-txt2`** — the "utterly
  unacceptable" fix. One ink across all six so the tags read as a system;
  hot still overrides on hover. Worst tag `SURFACE` = 57.4u of 70.
- **Values 8 → 10**, wrapping to two lines in the 150-unit housing measure
  (worst: `COMPONENT + SUPPLIER FACTS`, 26 chars). The zero-measure third
  line stays the loud-failure guard.
- **The bar 8 → 10, WRAPPED in the gate channel.** The 46-char worst
  (`CONSISTENT EVIDENCE / NO UNSUPPORTED INFERENCE`) cannot letter at 10 on
  one line anywhere right of the chip — 313u against the 230u channel — and
  shrinking it back to 8 was the type complaint in miniature. It wraps like
  a package value; `BAR_MEASURE`/`BAR_CHARS` derive from the channel.
- **The readout 10 → 11** — forced by the `pda-viewbox` guard that the
  readout outranks every value it explains; the 96-char worst why letters
  718u of 760.

### Two collisions the guards cannot see, caught on capture

Both are conductor-versus-content, and both reaffirm the ADR's hand-check
law (the fit guard and the smoke measure TEXT):

1. **The first fork rose at x 750 and sliced through the bar and the
   seat.** Any riser between x 700 and 924 crosses a 33-char bar line, so
   the fork moved past the whole text channel: risers at 936/940, and the
   bar's measure is derived from that clearance (700–930).
2. **The skill bundle's landing band grazed the lane chevron's diagonal.**
   Landing on nib 305 put the band's lower conductors within a unit of the
   chevron's top-right cut; it lands on 286 now, 4.25 units clear.

The substrate drops moved with the new bottom band: every drop is ≥ 549
since the GRAPH housing owns x 360–536, and `BAR_SLOTS` is retuned so no
lane crosses a housing (lanes 644–690, all below the graph's 624 bottom).

### Verification

- `npm run verify` clean — 618 tests, including `pda-viewbox`'s fit walk of
  all 27 streams at the new sizes and `pda-flight` (CORE_RECT untouched, so
  the ADR-069 morph is byte-identical).
- The three casefile smoke cases green (fit, clip, light-contrast — the
  latter carries the label-on-label overlap comparisons).
- Headed captures at 1280×720 + 1440×800, dark and light: 31 labels, 0
  clipped, minPx 4.97 at the binding field — now the CHROME's floor; the
  tags render ~6.6px, up from 5.0. Hover lights the SKILL+LANE pair and
  swaps the readout. The morph stills at 150/300 ms dock as before.

### Still true

ONE frame, one bright object; only what the record connects; the caption
counts shapes; nothing leaves the system chip upward; slots per count with
`CONFIG_MAX_BARS` pinned; no question headers — the tags are function
names, not questions. The v19 mockup's question-headed nodes were
deliberately NOT taken: the tag-as-header answers the legibility complaint
without reopening the header skeleton this ADR closed.

---

## Update 2 — the owner's unit board replaces the switchboard's composition (2026-08-10, owner)

**U1 misread the ask, and the owner's verdict is the record**: _"Did you
deliberately ignore my instructions? … what you've created is just
nothing."_ The instruction had been to rebuild reading 02 to the owner's
`configuration-unit-mockup.html` — "not verbatim but simplified" meant
ADAPT THE MOCKUP to the record and the guards, not keep this ADR's own
composition and borrow its parts. U1 did the latter: it kept the
switchboard skeleton (chip + six part housings + ribbons + gate +
substrate bars) and decluttered it. The correction, one pass later, is the
mockup's composition installed whole:

- **ONE lit card** — the ADR-069 cartridge, now carrying **THE BAR on its
  own face** (new optional `bar` prop on the primitive; reading 01 renders
  byte-identical). The gate aperture is deleted — the bar no longer needs
  a separate device, and the card's bar block is the `gat` hover.
- **The owner above, joined by a MEASURED DIMENSION** — DECIDES ALONE is
  a measurement between authority and machine (ticks, arrowheads), not a
  wire. The autonomy letters on the dimension; the seat is not data.
- **THREE QUESTION NODES** — WHAT RUNS IT · WHAT IT CAN REACH · WHAT IT
  INHERITS. The question headers RETURN by the owner's own hand (this
  ADR's "no question headers" is superseded by the mockup that reinstates
  them). Rows carry the mockup's material grounds: encoded green hatch,
  plain, and the graph's dashed BLUE inset — new `--pda-gph`/`--pda-gph-line`
  tokens in pda.css with light overrides in theme.css (the city's
  adjacent-domain blue, now on the console; text ≥4.5:1 in light).
- **Thin gutter traces with endpoint squares** west/east and a spreading
  fan south — the mockup's connection grammar. The multi-conductor
  ribbons, pin nibs, junction-free trunk and fork are all gone from this
  reading (`ribbon.ts` survives — reading 03 and the geometry kit are
  untouched).
- **The substrate bars are DELETED.** The caption alone carries
  `DRAWS ON n OF m SHAPES`. `CONFIG_MAX_BARS` survives as the record's
  tap-ceiling pin (the caption's range and the bounds guard rest on it);
  the per-tap bar assertion in `pda-viewbox` is rewritten to bounds-only.
- **Quiet ornament** — pad clusters, registration crosses, corner
  brackets, per the mockup.

### The adaptation arithmetic (why not verbatim)

- **The nodes' rows STACK instead of sitting side-by-side as halves.** The
  mockup's half is ~96u of measure; the record's 26-char worst
  (`COMPONENT + SUPPLIER FACTS`, `CONTEXT HELD BY THE PERSON`) wraps onto
  THREE lines there at any legible size. Stacked full-width rows letter
  every value ON ONE LINE at fs 11 — 194.5u against the node's 196u
  measure, ceiling-tight and guard-pinned for all 27 streams.
- **The owner letters at .08em, not the mockup's .16em** — the 24-char
  person-led seat is 200.6u at .16 against the node's 188.
- **MODEL and CONNECTORS are the k-labels** (the owner's words, mockup and
  dictation both); GRAPH FACTS likewise. Values stay the record's own.
- **The readout is 11.5** — values at 11 force it up (the outranking
  guard), and 11.5 is the ceiling: the 96-char worst why letters 750.7u
  of 760.
- **THE BAR wraps on the card** (46-char worst; 240u measure, zero-measure
  third line).
- The rail keeps WORK · CONFIGURATION · SUBSTRATE with no ordinals — the
  mockup's tab strip is standalone; the landing's rail is ADR-066 shared
  chrome across four plates.

### The lesson, for the next pass

**When the owner supplies their own mockup, the mockup IS the
composition.** "Not verbatim" licenses adapting strings, measures, guards
and shared chrome — never substituting a different drawing. U1's radial
switchboard was a competent decluttering of the wrong thing; it cost a
full extra pass and the owner's trust in the instruction being followed.

### Verification

- `npm run verify` clean (618 — `pda-viewbox` walks all 27 streams at the
  one-line node measures; `pda-flight` untouched, `CORE_RECT`
  byte-identical so the ADR-069 morph is unchanged).
- The three casefile smoke cases green, including the light contrast walk
  now measuring the blue.
- Headed captures at 1280×720 + 1440×800, dark and light: 30 labels, 0
  clipped, minPx 4.97 at the binding field (the chrome's floor; node
  values paint ~7.3px). The hatch band sits BELOW the value's line box —
  the first cut ran its legs through the descenders, caught on capture.

---

## Update 3 — thick bundles back, the readout deleted, the drawing docks to the rail (2026-08-10, owner)

Three corrections on the U2 board, same day: _"restore the thick lines
connecting the different panels to campaign copy"_, _"remove the text at the
bottom — its eating up real estate"_, _"why do we have so much space above
WHO OWNS IT."_

- **The bundles are the connection grammar after all.** The mockup's thin
  gutter traces lasted one pass — the ribbon weight from the switchboard
  reads, the hairlines do not. One 8-conductor bundle per side node, two
  5-conductor bundles into the inherits node, 45° jogs, drawn-on, lifted
  whole on hover. The endpoint squares left with the thin traces.
- **The readout is DELETED — ADR-069's one-reactive-line contract is
  overruled by the owner.** The four notes and the why stay in the RECORD;
  the drawing letters none of them, `pda-viewbox` asserts no `readout.`
  slot exists, and the smoke's old "readout ≥ 40 chars" assertion is
  INVERTED: prose above 40 chars on this drawing is now the readout
  drifting back. The derived caption survives alone, bottom-right, with a
  presence assertion of its own. Hover's whole meaning is the cross-light.
- **The void above WHO OWNS IT was the `YMid` anchor, and the fix is a
  PAIR.** At tall consoles the field outgrows the crop's 1.23 aspect and
  `xMidYMid` split the slack into a floating band ABOVE the drawing.
  `preserveAspectRatio` goes to **`xMidYMin`** — the drawing docks to the
  rail, the slack collects below as ground — and ⚠ `fitCrop` in
  `pdaFlight.ts` HARDCODES the same anchor (`oy: 0`): the attribute and
  the arithmetic move together or the flight lands wrong by half the
  letterbox at every tall viewport. The owner node also nests up 4 units
  (84). At the binding 1280×720 field nothing changes — there is no
  vertical slack to anchor.

Verified: 616 units green (the readout describe replaced by its absence
guard), the three casefile smoke cases green after the inversion, headed
captures at 1440×800 + 1680×1250 (the tall case that motivated the anchor)

- light. All three readings share the svg, so readings 01/03 top-anchor
  too — consistent, and their content already filled their crops.

---

## Update 4 — the crop goes PORTRAIT, and the pairs stack (2026-08-10, owner)

_"Why is it centered in the top right corner? … you're just fucking not
using the space at the bottom."_ Then, on the rebuild: _"what it inherits is
too big … the text is so small. Let's make it more proportionate. Skill and
model … let's stack them vertically. Same with connectors and surfaces."_

### The dead panel was the CROP, not the layout — and U3 fixed the wrong half

⚠ **THE ASPECT IS THE CONTRACT.** The console's field is PORTRAIT where this
is read — 839×958 (0.876) at the owner's window — and this drawing was
cropped LANDSCAPE (910×740, 1.23). `meet` scales by the MINIMUM ratio, so a
landscape crop in a portrait field is WIDTH-bound: it rendered 839×675 into
958 and left **~283px of dead panel**. No element move can reach that space
— the letterbox is OUTSIDE the drawing.

U3 read the symptom as alignment and switched the anchor to `xMidYMin`,
which only moved the void from above the drawing to below it. The real fix
is the crop: **828×912 (0.908)**. Measured after: meet **1.013**, the
drawing fills the panel, and the smallest type renders **10.13px** — up from
5.55. `preserveAspectRatio` stays `xMidYMin` with `fitCrop`'s `oy: 0` (U3's
pair still holds); it is simply no longer load-bearing.

⚠ **THE TRADE, NAMED:** a portrait crop in the SHORT-wide fields (603×493 at
1280×720) letterboxes HORIZONTALLY instead, and meet drops to 0.541. One
`viewBox` cannot fill both aspects. The tall window is where this is read,
so it wins — and the drawing's own floor rose **7.5 → 10** to keep the
smallest rung above the smoke's 4.3px there (7.5 would render 3.89 and fail
outright).

### The pairs stack, and one sub-card size makes the board proportionate

The side nodes seat their pair VERTICALLY at full node width; the wide base
node seats its pair side by side — and the two arrangements are sized so
**all six sub-cards are the same 242×130 card with the same 222-unit measure
and the same type**. That is what answers "what it inherits is too big": its
old 640-wide node held 316-wide cards with one short line in them, while the
side nodes' halves were 112 wide and forced three-line wraps at fs 10.
Stacked, every value in the record letters on ONE line at **fs 12**.

### The guard found a defect the same hour it was written

⚠ **THE BINDING NUMBER IS A WORD, NOT A STRING.** `wrapLines` breaks on
spaces only, so the longest WORD sets a sub-card's minimum measure however
well the value wraps — and every per-line assertion still passes while it
overflows, because each LINE is short. Sizing against `INTELLIGENCE` (12)
was wrong: **`RECONCILIATION` (14)** is the record's longest and would have
run through the wall. `pda-viewbox` now walks WORDS, not just lines, and it
caught this on its first run.

### Deleted, all owner-named

The DRAW PER RUN meter with NEVER A PRICE, the DRAWS ON n OF m caption
(with `substrateReach` / `drawnShapes` / `CONFIG_MAX_BARS`), the corner
brackets, the pad clusters, the vias and the registration crosses, and —
from U3 — the arrowed dimension rule with its pin ticks. The unit guard and
the smoke both assert the absences; the smoke's caption-presence assertion
from U3 is INVERTED rather than dropped, so nothing drifts back.

Node headers letter WHITE, the nodes are much taller than the card, and the
card keeps the hierarchy by VALUE (it is the one lit object) rather than by
footprint.

### Verification

- `npm run verify` 615 green; the three casefile smoke cases green.
- Headed captures at 1780×1270 (the owner's window) dark + light, and at
  1280×720: 27 labels, 0 clipped, meet 1.013 / minPx 10.13 at the tall
  window and 0.541 / 5.41 at the short one.

---

## Update 5 — the seat gets its own connector, and its own right column (2026-08-10, owner)

_"Who owns it needs to be connected to the middle card as well, but not with
the lines like we do with the rest, but with other lines — and the texts
between it (decides alone, wide) should also be gone, it's clutter. Let's
integrate it a bit more subtly."_

- **The seat's connector is ONE DASHED HAIRLINE**, not a bundle. This ADR's
  own law is why it reads right: the seat is AUTHORITY, not data, so its
  relation to the card is _answerable-to_ rather than _feeds-into_ — and
  eight solid conductors would say the opposite of that. The three question
  nodes keep their thick bundles; the contrast between the two grammars is
  the point, and it is now drawn rather than merely asserted by the plate's
  colour.
- **`DECIDES ALONE · WIDE` moves ONTO the plate**, right-aligned, as its
  second column. Nothing floats between the plate and the card any more.
  The plate widens to 400 (wider than the card) to hold two columns —
  authority spanning the machine it answers for. Worst case is the
  person-led seat (24 chars at fs 13 = 212u) beside `DECIDES ALONE`
  (106.6u) inside the plate's 360-unit measure, so the two columns cannot
  meet; both are declared in `configurationLettering` and walked for all 27
  streams.

### Verification

`npm run verify` 615 green, the three casefile smoke cases green, headed
captures at 1780×1270 dark + light (meet 1.013, 27 labels, minPx 10.13, 0
clipped).

---

## Update 6 — the board gets a margin, and the seat's line gets its weight (2026-08-10, owner)

Two defects on the U5 board: _"WHAT RUNS IT and WHAT IT CAN REACH is too
close to the border of the frame"_ and _"why does WHO OWNS IT not have a
connector to the CAMPAIGN COPY node?"_

- **The side nodes sat ON the crop's wall.** `LEFT_X` was 36 and the crop
  starts at x 36 — zero margin, on both sides. The board is inset **24**
  each side now and the 828 crop reads as one width chain:
  `24 | 234 | 24 | 264 | 24 | 234 | 24`. ⚠ The chain has to move together —
  `CHIP.x` IS `LEFT_X + NODE_W + GUTTER`, and a node width or margin changed
  without it puts the nodes straight back on the wall. The card gives up the
  width (CORE_K 1.6 → 1.5) because the margin is not negotiable and the
  sub-card measure is fixed by the record's longest word.
- **The connector existed and could not be seen.** It was drawn in
  `--pda-dim` at 0.75 opacity — technically present, read as absent. That is
  the whole lesson: **a line quiet enough to be missed is not a subtle
  connection, it is a missing one.** The DASH is what distinguishes the
  seat's grammar from the nodes' bundles; the VALUE never had to carry that
  distinction too. It now takes the plate's own green at full weight, with a
  contact tick where it meets the card, so the connection is drawn rather
  than implied. Person-led keeps the dashed `--pda-txt3` hand.
- Values letter at **11.5** (from 12) — the narrower sub-card measure (212)
  against the 26-char worst, still one line for every value in the record.

### Verification

`npm run verify` 615 green, the three casefile smoke cases green, headed
captures at 1780×1270 dark + light (meet 1.013, 27 labels, minPx 10.13, 0
clipped).
