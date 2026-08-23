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

---

## Update 7 — the seat says what it owns (2026-08-10, owner)

_"The who owns it should have multiple lines."_

The record has always carried the pair. `CaseMapConfiguration.p` is
`readonly [string, string]` — **"Owner role + what that seat actually
owns"** — and every drawing since the projection was written took `p[0]`
and dropped `p[1]` on the floor. So `Creative lead` printed and
`Sets the bar / owns final taste` did not, which is the half a reader
cannot infer from the role name.

- **`PdaWork.ownerNote`** carries `p[1]`, and it is `string | null`:
  person-led work has no configured seat to gloss, and its owner line
  ("THE PERSON DOES THE WORK") already states the absence in full. The
  spec is pushed conditionally so the "no blank string" guard stays
  meaningful rather than being taught to tolerate an empty one.
- It letters ONE STEP DOWN from the seat and in the neutral ink
  (`--pda-txt2` at fs 10, against the seat's green 13): the seat is the
  answer, this is what the answer is FOR. The plate grows 106 → 124 to
  hold the third row; the seat connector shortens to match.
- The measure is the plate's FULL inner width (360), not the left
  column's — the note sits on its own row with nothing to its right.
  Worst live note is 31 chars (`SETS THE BAR / OWNS FINAL TASTE`) =
  210.8u, walked for all 27 streams by `pda-viewbox`.

⚠ **The lesson is about the projection, not the drawing.** A field that a
content type documents as a PAIR should be checked for both halves when
the drawing is authored; `p[1]` was invisible for four updates because
nothing on the surface and nothing in the guards ever asked where it went.

### Verification

`npm run verify` 615 green, the three casefile smoke cases green, headed
captures at 1780×1270 dark + light (28 labels, meet 1.013, minPx 10.13, 0
clipped).

---

## Update 8 — the top-left chrome goes, and the board opens on the plate (2026-08-10, owner)

_"Remove THE CONFIGURATION and W-017 so the WHO OWNS IT panel has a bit
more breathing room and can move upward."_

Both were saying something the panel already said, which is the same
argument that took the console's head and foot in ADR-063 U1:

- **`THE CONFIGURATION`** restated the lit rail station sitting directly
  above the panel.
- **The designator** restated the stream id the cartridge prints on its own
  face — `W-017` is still on screen, in the card's top-right, where it
  belongs to the object it names.

Everything removed was HEIGHT, and height is the only currency this drawing
spends. The owner plate moves **170 → 72**, clearing the crop's top edge by
24 — the same margin the sides use since U6.

⚠ **THE CHAIN MOVES TOGETHER, VERTICALLY TOO.** Lifting the plate alone
opened a ~250-unit dead band between the card and the base, because the base
is pinned to the crop's floor and the plate to its ceiling. The card drops
to 335 and **`SUB_H` goes 130 → 158**: sub-card height is this board's
vertical ballast, and every 10 units there lifts the base 14 and the side
nodes 20. That is what closes the drop without moving either anchor — and it
keeps the ≤40-unit waste guard satisfied (content 72…945 against a 912 crop,
39 spare).

### Verification

`npm run verify` 615 green, the three casefile smoke cases green, headed
captures at 1780×1270 dark + light — 26 labels (from 28), meet 1.013, minPx
10.13, 0 clipped.

---

## Update 9 — the three questions are re-slotted (2026-08-11, owner)

_"WHAT IT CAN REACH — knowledge graph & connectors (MCP/API). WHERE IT RUNS
— Agent & Interface."_ Then, asked how the four should seat: _"WHAT RUNS IT
has Skill & Model. What it inherits we remove and replace with WHERE IT RUNS.
What it can reach gets adapted to Knowledge Graph & Connectors."_

**THE GEOMETRY DOES NOT MOVE.** Not one constant changed — same crop, same
inset chain, same `SUB_H`, same `CORE_RECT`, same bundles. Only what each
node ANSWERS:

| node              | seat | was                   | is                           |
| ----------------- | ---- | --------------------- | ---------------------------- |
| WHAT RUNS IT      | west | Skill / Model         | Skill / Model — unchanged    |
| WHAT IT CAN REACH | east | Connectors / Surfaces | Knowledge graph / Connectors |
| WHERE IT RUNS     | base | _WHAT IT INHERITS_    | Agent / Interface            |

### Two slots were wrong, and the drawing could not show it

This is not a restyle of three right answers — it is a correction of two:

- **A GRAPH IS REACHED, NOT INHERITED.** A knowledge graph is queried on
  request through an MCP/API connector. CONTEXT is what the stream carries
  in _before it asks anything_. Inheriting and reaching are different verbs,
  and the graph was filed under the wrong one.
- **AN INTERFACE IS WHERE A PERSON MEETS THE WORK**, not something the work
  reaches. `u` sat beside the systems the stream acts on, which put a human
  surface on the machine's side of the boundary.

Consequently the graph leads its node and the connector follows: the graph
is what the stream reaches FOR, the connector is the wire it reaches
THROUGH. Drawing them in the other order made the wire the subject.

### The agent had no source, and the fallback could not be a product

Nothing in `CaseMapConfiguration` answered "agent" — all 24 authored `u`
values are interfaces, so there was nothing to split. The field is new:
`a: string`, authored per stream.

⚠ **A SINGLE STRING, DELIBERATELY**, while every neighbour is a
`[name, note]` pair. U7 is what a spare half costs — `p[1]` went unlettered
on four consecutive drawings because nothing asked where it had gone. This
one letters its name with no readout behind it, so there is no second half
to strand.

⚠ **`CLAUDE APP` CANNOT SHIP, AND THAT IS A GUARD, NOT A PREFERENCE.** The
owner's chosen fallback was "Claude app"; `cases-registry`'s `MODEL_FAMILIES`
pattern includes `claude`, and the map's envelope is stricter than the
casefile's by design — the LANE (`m`) is the one place model class is
answered, generically. So the non-tool vocabulary is run MODE:
`Chat assistant` · `Scheduled agent` · `Editor plugin` · `Coding agent`.
Tool CODENAMES stay in scope (published precedent: `PROJECT_CASES`, row 02
of this same casefile), so Mímir and Vesper letter by name. The registry
test now scans `cfg.a` — it is the field most likely to name a vendor,
because the honest answer to "what runs it" often IS a product.

⚠ **THE MAPPING IS AUTHORED AND WANTS THE OWNER'S EYE.** The record does not
say which stream runs on which tool. Mímir on the two briefing streams is
definitional; **Vesper on `W-062` Ad variant sets is the inferred one**. And
**Babylon and Heimdall map to nothing** — the 27 streams contain no
localisation/dubbing work and no studio PM work, which is itself a reading
of the estate rather than a gap in the field.

### Context now letters nowhere, and that is named

CONTEXT is one of the owner's own five configuration fields. With the hover
readout already deleted (U3), removing WHAT IT INHERITS leaves it in the
record and off the drawing entirely. It stays on `PdaAnswers` because the
city's unit sheet and the config lab's four archetypes still draw it, and it
is called out in the header so it is a decision on the page rather than a
loss nobody notices — exactly the failure `p[1]` had for four updates.

**GREEN IS DOWN TO ONE BUNDLE.** The base's left conductor carried green
while it fed WHAT IT INHERITS, because inherited context is encoded material
Loop paid for. An agent and an interface are neither, so both base
conductors are amber and the Skill's run is the only green left — one
encoded thing on the board, and it is the judgment.

### Verification

`npx vitest run` 629 green across 46 files (the fit guard walks all 27
streams against the new lettering; `cases-registry` now scans the agent).
Typecheck clean. The three casefile smoke cases green. Headed captures at
1280×720 dark + light and 1920×1080 dark: 26 labels, 0 clipped, minPx 5.41
at the binding short-wide field and 8.33 at 1920.

---

## Update 10 — the seated board, promoted (2026-08-11, owner)

Reading 02's drawing is replaced by the `seated` variant, picked out of eight
refinements built at `/test/intelligence-config-lab` and put through three
rounds of owner notes. The lab's local copy is deleted and its `shipped`
entry mounts production, per the switchboard precedent — two drawings
claiming to be the same one is how a lab goes stale.

### What was actually wrong, in numbers

The brief was "the board reads cramped". It was not density:

- A U9 answer sub-card was **158 units tall around an ink band of 51** — a
  key baseline at +26 and one value line at +62. **68 % dead space, six times
  over**: ~640 of the crop's 912 vertical units spent on nothing, while the
  value lettered at 11.5.
- The ladder was **inverted**: the question header lettered at 14, LARGER
  than the answer it introduced — against ADR-069's own words, _"the question
  is chrome, the answer is the record"_.

### ⚠ The crop's aspect INVERTED, and it is a measured trade

U4 made the crop portrait because the console's field is portrait at a tall
window. That is true, and it is not the whole picture. The field is **capped
at 850px wide but grows with viewport height**, so it is LANDSCAPE on laptops
and PORTRAIT on tall screens. Measured on the live landing:

| viewport  | field    | aspect | 828×912 waste | 1000×912 waste |
| --------- | -------- | ------ | ------------- | -------------- |
| 1280×720  | 603×493  | 1.223  | 155 across    | 62 across      |
| 1440×800  | 679×548  | 1.239  | 181 across    | 78 across      |
| 1920×1080 | 850×760  | 1.118  | 160 across    | **17 across**  |
| 2560×1440 | 850×1120 | 0.759  | **184 down**  | 345 down       |
| 1280×1440 | 603×1177 | 0.512  | **513 down**  | 627 down       |

**One crop cannot fill both ends.** U4 chose portrait and paid on laptops;
the owner's call here is the other way — the laptop and the 1920 reference
win, at the NAMED cost of more vertical letterbox and ~17 % smaller type on
tall large monitors (meet 1.027 → 0.850 at 2560×1440).

⚠ `pda-viewbox`'s aspect assertion did not disappear, it **inverted** — the
crop must now be ≥ 1.05, and a second assertion bounds the cost at the tall
field so the crop cannot keep widening at its expense. An aspect contract
that is deleted rather than flipped is a contract nobody notices breaking.

### ⚠ Nothing letters under 12

U9's keys sat at 10, which is **5.4px at the binding preset and 8.3px at
1920** — under the 8.5px chrome floor ADR-063 already records as this
surface's standing defect. The owner's verdict on SKILL / MODEL / AGENT /
KNOWLEDGE GRAPH was "utterly illegible", and it is arithmetic rather than
taste. The contrast is bought the other way round now — the ANSWER came down
and the KEY came up: **question 13 · key 14 · value 15 · owner 16 · bar 14**,
with `FS_FLOOR = 12` asserted rather than intended.

**A label nobody can read is not a quiet label, it is an absent one** — the
same finding U6 made about the seat's dashed line, one type rung down.

### The seat is STRUCTURE, and U5's law is kept by material

U5 says the seat is AUTHORITY, not data, so it may never be one of the nodes'
multi-conductor bundles. A dashed hairline was only ONE way to say that, and
U6 had already had to take it from `--pda-dim` to full green because it read
as absent. The distinction moves from **weight to MATERIAL**: authority is
drawn as structure, data as conductors. Nothing flows down a pylon — it bears
load, which is why it survives being drawn thick.

⚠ Three sizes bracket the range: 110→170 over 60 units read as a small dark
tab (the hairline's failure in a new shape), 140→240 as a buttress that took
the eye off the card. **64→108 with a shallow splay** is the band between.

### ⚠ The card is drawn here now, not by `Cartridge`

`Cartridge`'s internal offsets are absolute multiples of `k`, so at k 2 its
title landed at `+184` and its bar block bottomed out **three units** off the
floor with a 60-unit void above it. That is the glyph's layout, not spacing —
and reading 01's grid of twenty still wants it, so fixing it in place would
re-lay-out the other reading. This reading lays out its own contents on the
same silhouette: header row (state mark, team, id), rule, title, bar, and
**41 units of margin** under the last descender.

⚠ **THE SILHOUETTE IS WHAT MAY NOT MOVE.** `CORE_RECT` stays exactly
`176×136 × k` with the same `14k` chamfer, because ADR-069's flight docks
into it, and the docking group still holds the card ALONE — `fill-box`
measures the transform against that group's own bbox. `CORE_K` 1.5 → 2 keeps
the two rects exactly similar, so the morph is still one uniform scale.

⚠ **AND THE CARD'S THREE STRINGS ARE DECLARED NOW.** While the card was
`Cartridge`, its team code, stream id and title were lettered by a shared
glyph and `configurationLettering` never saw them — the fit guard was walking
a drawing with three invisible labels in it. **Any reading that mounts a
production glyph inherits that blind spot.**

### One ink, gold keys, a divider, a bezel

- **One ink for every answer.** The Skill lettered green and the graph blue,
  carrying ADR-062's material grammar onto the type. On the CITY that grammar
  has a legend's worth of context and applies to SHAPES; here it lands on six
  words in a row with nothing to decode it, so it reads as emphasis rather
  than provenance.
- **Keys in Tensor gold** — `--pda-ink`, which is `--gold-ink`, the 4.5:1
  rung of ADR-063 U2's ramp. ⚠ NEVER `--gold` itself: that is the MARK rung
  and measures ~1.1:1 as small text on the light theme's parchment.
  `--pda-ink` was declared in pda.css and consumed by nothing until now.
- **The hatch band and the dashed inset are deleted**, replaced by a divider
  rule between the two cells. At this size the diagonal ticks read as a
  texture bug rather than as material.
- **The bezel** is the services cards' own device — `ServicesCardRing` bakes
  its slab with a clear bezel margin plus a hairline on the silhouette — as a
  second chamfered outline inset inside the first, on the card and one step
  quieter on every node. ⚠ The inner chamfer leg is NOT `leg − inset`: a 45°
  cut offset inward by `d` moves its diagonal by `d√2` along the axes, and the
  naive value leaves the diagonal visibly closer to the outer edge than the
  straight runs are.

### `MODEL` and `AGENT` answer in words a reader can picture

- **`MODEL` letters the verbs, not the lane.** Nothing on the surface explains
  "everyday lane" and nothing can — the lane is a generic capability tier
  because the envelope forbids naming a model family, so the tier cannot be
  made concrete by naming the model. `m[1]` is the concrete thing the record
  already holds. `PdaAnswers.laneVerbs` is additive; `laneRun` survives.
- **`AGENT` may not be a codename.** The field carried `Mímir` and `Vesper` —
  publishable, since the tools row of this same casefile prints them — but on
  the tools row a codename sits beside a screenshot and a walkthrough that
  explain it, and on the map it sits alone in a cell. **A codename is
  PROVENANCE; this field has to be an ANSWER.** The shipped tools' own public
  tab labels are what they are called here.

### The geometry

One width chain, `30 | 234 | 60 | 352 | 60 | 234 | 30` = 1000, and one
vertical chain, owner 136 + neck 62 + card 272 + drop 150 + base 164 = 784
against 873 of board, leaving 44.5 of margin top and bottom. `NODE_H` lands
on 272 as well, so **the card and both side nodes share one top edge and one
bottom edge** — that alignment is the balance. The gutters go 24 → **60**, so
the cables have room to be seen.

### Verification

- `npx vitest run` 630 green across 46 files. `pda-viewbox` (17) walks all 27
  streams against the new lettering including the card's three strings;
  `pda-flight` (16) confirms the rects stay exactly similar at `CORE_K` 2.
- `tests/visual/services-ring-smoke.spec.ts` green.
- The live landing captured at 1920×1080: crop 1000×912, meet 0.833, 26
  labels, 0 clipped, **minPx 10.83** — the first drawing on this surface to
  clear the 8.5px chrome floor (it was 8.33). Morph frames at 150 ms and
  300 ms confirm the dock.

### Left open

- Readings 01 and 03 still letter at ~4.5–5.5px and are untouched by this
  pass. Reading 02 is now decisively the best-set reading on the surface,
  which sharpens rather than answers that gap — and the two of them now use
  different crops, so 01's own aspect deserves the same measurement U10 did.
- The tall-monitor cost is accepted, not solved. If it ever needs solving,
  the mechanism is a crop chosen from the field's measured aspect rather than
  a constant — two layouts to maintain, which is why it was not done here.

## Update 11 — the R4 substrate field (2026-08-11, owner)

The owner delivered `design_handoff_intel_config_r4` — a **design handoff**,
not a sketch: a README with a module position table, a chrome grammar, a
token list and a data-binding map, plus `r4-substrate-field.html` as a
pixel-exact prototype of one state (W-017). Its own words: _"High-fidelity.
Colors, typography, spacing and geometry are final. Recreate pixel-perfectly;
only the data varies per work unit."_ The brief with it: _"much cleaner, much
more minimalistic … analyze it. Don't just implement it verbatim, but get it
as close as possible."_

So U10's seated board lasted one day. That is not churn — the seated board
answered a question about INFORMATION ARCHITECTURE (how the six answers should
be seated), and it settled it. R4 re-skins the same architecture: same five
modules, same slotting, same seat above, same card at centre. What changed is
the chrome, and it changed because the owner drew it.

### What R4 is

A dense motherboard. A faint live PCB bed — ghost die, meander traces, passive
pairs, vias — under **opaque** modules with **two opposed 45° corner cuts**, a
**2px top rule** each, and **8-wire hatched ribbon lanes** on all five docks.
One role law: **gold is wayfinding, green is the human, and green is used
nowhere else.** Zero border-radius; diamonds, never circles.

### ⚠ The type is the one thing that could not be recreated verbatim

The prototype is authored at 1:1 in a 960-wide frame. This console's field is
**603 × 493** at 1280×720 and **850 × 760** at 1920×1080, so `meet` scales the
whole drawing to 0.65–0.91. Verbatim, R4's rungs land at:

| R4 rung            | authored | at 1280×720 | verdict                                                           |
| ------------------ | -------- | ----------- | ----------------------------------------------------------------- |
| core title         | 30       | 19.4px      | fine                                                              |
| field value        | 11       | 7.1px       | under U10's floor                                                 |
| field label        | 8.5      | 5.5px       | **the size the owner called "utterly illegible" one day earlier** |
| header meta        | 7        | 4.5px       | at the smoke's own 4.3px floor                                    |
| stamp / lane tag   | 6.5      | 4.2px       | **under it**                                                      |
| passive designator | 6        | 3.9px       | under it                                                          |

**A handoff authored at 1:1 cannot carry its type into a box that scales.**
That is not a criticism of the handoff — it is the one fact a 1:1 prototype
cannot encode. So R4's type **RANKING** is kept exactly (title much greater
than value, then question, then label, then chrome — which is also ADR-069's
own principle that the question is chrome and the answer is the record) and
its bottom rungs are lifted to this surface's floor. The ladder's range
narrows from 5x to 1.8x; that is the cost, and it is paid in **alpha instead
of size**, the one hierarchy lever that does not shrink with `meet`.

### The aspect paid for the lift, before a single font size moved

`meet` takes the minimum of the two box ratios, so the crop's aspect decides
which axis letterboxes. Measured field aspects: **1.223** (1280×720), 1.239
(1440×800), **1.118** (1920×1080). R4's stage is **1.194** — almost exactly
the panel it has to fill.

| crop                  | aspect    | meet @1280 | meet @1920 |
| --------------------- | --------- | ---------- | ---------- |
| `828 x 912` (U4)      | 0.908     | 0.541      | 0.833      |
| `1000 x 912` (U10)    | 1.096     | 0.541      | 0.833      |
| **`932 x 751` (U11)** | **1.241** | **0.647**  | **0.912**  |

**+20 % / +9 % of rendered type from the aspect alone.** Every rung is larger
than what shipped yesterday: the floor 7.0 → 7.8px, the value 8.1 → 9.1px, the
title 12.4 → 14.2px at the binding preset.

### ⚠ The crop is the reference's FRAME, not its stage — and that cost a round

The first cut cropped to R4's 888 × 744 **stage** and measured beautifully:
meet 0.679, minPx 8.14. It also put the side modules **2.7px** off the console
wall, which reads as clipped. R4 draws a 960 × 880 frame and insets its stage
36px inside it, so its modules sit 40px off the wall — 4.2 % of the width —
and **cropping to the stage silently deleted that margin.**

ADR-064's _"the frame is a bezel the content bleeds into, never a letterbox"_
is about a CAPTURE filling its bay. **A technical drawing whose outermost rule
touches the wall has not bled, it has lost its margin.** The crop is now a
uniform **26-unit inset** around content running `4…884 x 20…719`, which is
where the two axes come out within one percent of each other at the binding
preset — as close to no letterbox as a single crop gets. It costs 6 % of the
type the flush crop had, and it is worth it.

⚠ **`pda-viewbox`'s waste guard had to change its QUESTION, not relax.** It
asserted vertical tightness because the drawing was HEIGHT-bound; reading 02
is WIDTH-bound now, so height slack is free and asserting it would be
measuring the wrong axis. Reading 02 asserts the INSET instead — all four
margins equal, inside `[18, 34]`. Readings 01 and 03 keep the height rule.

### ⚠ What R4 letters that this drawing does not

Six removals, each forced by arithmetic or by a standing law. They are named
here so putting any back is a decision rather than a rediscovery:

| dropped              | why                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| side stamps (5)      | invented designators (`S-03 · M-01 / REV C`) — ordinals in costume, which this surface has removed twice (ADR-066's no-ordinal law; ADR-068's bay-scoped `T-\d` scan) |
| passive labels (6)   | same, and at 6 they render **3.9px**. The MARKS stay — the bed's texture never depended on the letters                                                                |
| header metas (3)     | `RUNS` beside `WHAT RUNS IT` is the question said twice, and at a legible size the pair does not fit a 204-unit module (163.5 + 44.4 against 180)                     |
| ribbon tags (4)      | `LANE 01–08` collides with the model LANE, a live record field; and a bundle is named by the module it enters                                                         |
| satellite meters (2) | a 4-bar gauge beside a client's named Skill implies a measurement this case does not publish and R4 did not author                                                    |
| `DRAW —` prefix      | on this record `draw` is WORKLOAD (`PdaWork.draw`), not capability. Using the word here would publish a wrong one                                                     |

**Sub-floor decorative text is not texture on a surface that scales down; it
is illegible text.** That is the owner's own U10 finding applied consistently,
one layer quieter.

### The one deleted thing that came back, re-pointed

R4 restores a 4-cell meter, and U4 deleted one. **They measure different
quantities.** U4's meter was DRAW PER RUN — workload — and needed a `NEVER A
PRICE` caption to stay honest; that field still letters nowhere. This meter is
the capability **LANE**: generic by law, already published, and with exactly
four values (`Fast · Everyday · Deep · Frontier`), so the gauge **is** the
record rather than a rating of it.

It also closes U10's own loose end. The owner's _"model — everyday lane? What
does everyday lane mean?"_ retired `laneRun` from the MODEL cell, and nothing
replaced the tier anywhere. Four cells with two lit is the scale the bare word
never had; the verbs stay in the module. `pda-viewbox` pins the label to the
record's four lanes plus the honest absence, bans `DRAW` on it, requires
person-led to read `NO LANE`, and asserts the record still spans all four
rungs — **a ladder whose top rung nothing reaches is a scale the reader cannot
calibrate.**

### ⚠ The card keeps its silhouette, and R4's core is not similar to it

R4's core is 300 × 224 (1.339); the cartridge is 176 × 136 (1.294). A uniform
`dk` cannot carry a shape that changes proportion, so `CORE_RECT` stays
`176 × 136 × CORE_K` — `CORE_K` **1.7**, centred on R4's own core centre
(444, 300). It lands within a unit of the position table horizontally and 3.6
units vertically. The card's corner cut also stays PROPORTIONAL (`14 × CORE_K`)
where the satellites take R4's flat 12, so the object the flight carries keeps
its silhouette the whole way across.

### ⚠ TL+BR is ADR-065's mirrored case, and it is the owner's for the second time

R4 cuts every module top-left **and** bottom-right. ADR-065's diagonal is
TR+BL. The console frame these plates sit in already took the same override
(ADR-065 U2), so the drawing and its housing now cut the same way — which is
the argument the first override did not have.

### Two things the render caught that no guard did

- **Hairlines go sub-pixel.** At meet 0.647 a 1-unit rule paints 0.65 device px
  and the browser pays the difference in alpha, so R4's ~.14 bed arrived at
  ~.09 and vanished. The bed's group opacity is 0.85 for that reason: **an
  alpha ceiling has to be set against the RENDERED drawing, not the
  reference's 1:1 canvas.**
- **The card had a 55-unit hole.** R4 pins its meter to the card floor and lets
  the slack land where it may; at this size that put a void through the middle
  of the one bright object. The bar block seats at +120, which splits it 39/39.

### Verification

- `npx vitest run` 631 green across 46 files. `pda-viewbox` (18) walks all 27
  streams against the new lettering — fit, the WORD walk, the sliced-tail cap,
  the floor, the inset and the new lane-ladder contract; `pda-flight` (16)
  confirms the rects stay exactly similar at `CORE_K` 1.7.
- `npx tsc --noEmit` and `eslint` clean.
- `tests/visual/services-ring-smoke.spec.ts` — **21 passed / 31 skipped**,
  unchanged. That covers the three-reading clip / label-on-label /
  rendered-floor sweep, the two-stream answer comparison, the no-prose and
  deleted-chrome checks, and the light-theme 4.5:1 walk over every glyph.
- The live landing, dark and light: **1280×720** crop 932×751, meet 0.647, 28
  labels, 0 clipped, **minPx 7.76**; **1920×1080** meet 0.912, **minPx 10.94**.
  Morph frames at 150 ms and 300 ms confirm the dock.

### Left open

- The 1920×1080 field is 1.118 against this crop's 1.241, so ~75px collects
  below the drawing as ground clearance. `xMidYMin` is what makes that read as
  clearance rather than as a floating band (U3), and the bed runs into it — but
  it is real slack, and it is the mirror of the horizontal slack U10 spent a
  whole update removing. A crop chosen from the field's measured aspect is
  still the only mechanism that solves both ends, and still two layouts.
- Readings 01 and 03 are untouched and still letter at ~4.5–5.5px. Reading 02
  is now decisively the best-set reading on the surface, and it is the third
  crop on the panel — 01's own aspect has been owed the same measurement since
  U10.
- The seven refinements at `/test/intelligence-config-lab` now draw in a crop
  production has left twice. They are the record of a finished round; the
  route's own header says so.

## Update 12 — the board is height-elastic (2026-08-11, owner)

The owner opened U11 on his own monitor and found a third of the console
empty under the board: _"What's up with all that space at the bottom? Why are
you cramming everything so much? You keep doing this."_

He is right about the pattern, and it is worth naming precisely because it has
now happened three updates in a row:

| update | crop                 | chosen for  | letterboxed                          |
| ------ | -------------------- | ----------- | ------------------------------------ |
| U4     | `828 × 912` portrait | tall fields | **155–181px across** on every laptop |
| U10    | `1000 × 912`         | laptops     | vertically on tall monitors          |
| U11    | `932 × 751`          | laptops     | **270px down** at 845 × 950          |

Each pass measured the drawing against ITS OWN CROP — clipping, overlap,
rendered floor — and every one of those assertions was green while a third of
the panel was blank. **Nothing on this surface measured the drawing against
the PANEL.** That is the defect, and it is a guard defect rather than a taste
one.

### Why one crop can never do it

The console's field is capped at 850px wide but grows with the viewport's
height, so its aspect is not a constant — measured on the live landing:

| viewport    | field      | w/h       |
| ----------- | ---------- | --------- |
| 1280×720    | 603 × 493  | 1.223     |
| 1440×800    | 679 × 548  | 1.239     |
| 1920×1080   | 850 × 760  | 1.118     |
| the owner's | 845 × 950  | **0.889** |
| 2560×1440   | 850 × 1120 | 0.759     |

`meet` fits by the SMALLER ratio. A landscape crop in a portrait field is
width-bound and wastes height; a portrait crop in a landscape field is
height-bound and wastes width. **There is no static crop that fills both
ends** — the previous three updates were arguing about which end to lose.

### The mechanism, and why it is free

The crop's WIDTH is the reference's frame and never moves, so the fit is
width-bound and `meet` is `field.w / 932` **at every height**. That is the
whole trick: growing the crop's height to exactly `932 × field.aspect` costs
**nothing** in rendered type and removes the letterbox instead. Measured, and
the numbers are identical to U11's on every rung:

| field      | crop       | meet  | minPx | slack             |
| ---------- | ---------- | ----- | ----- | ----------------- |
| 603 × 493  | 932 × 763  | 0.646 | 7.76  | 0                 |
| 679 × 548  | 932 × 751  | 0.728 | 8.74  | 1px               |
| 850 × 760  | 932 × 833  | 0.912 | 10.94 | 0                 |
| 850 × 927  | 932 × 1016 | 0.912 | 10.94 | **0** (was 270px) |
| 850 × 1120 | 932 × 1228 | 0.912 | 10.94 | **0** (was 438px) |

### Where the height goes, and why there

The board is WIDTH-limited — the crop's width is the field's, so nothing can
be drawn bigger. The only currency a tall panel offers is vertical
distribution, and there are two honest places for it:

- **the cables**, which are the reference's own grammar (modules joined by
  ribbon lanes, so a taller board is a longer run), taking 78 % across the
  three gaps in R4's own ratio; and
- **the cells**, 22 %, as air around the answers rather than a pool of it
  under the last module.

⚠ **THE CARD IS NOT IN THAT LIST.** Its box is ADR-069's flight destination
and its proportion is fixed to the cartridge's; it re-centres in the band
instead. ⚠ **AND THE ADDED CELL AIR IS SPLIT, NOT POOLED** — R4's cells are
top-aligned and carry their slack at the bottom, so that bias is kept at rest
and half of each cell's new height goes ABOVE its content as the board grows.
That is the difference between a taller module and a module with a hole under
it.

### The clamp, and the one shape that still letterboxes

`CONFIG_EXT_MAX` is **620**, set from the tallest field this console takes on
a desktop: 2560×1440 wants 477 and fills exactly. The only measured shape that
reaches the clamp is a PORTRAIT desktop window (1280×1440 wants 1068), and
there the board letterboxes on purpose — **a 590-unit bus run is not a cable,
it is a gap with wires in it.** The guard names that case rather than hiding
it, and holds the clamp to buying more than half the trade (691px of slack
becomes 290px).

### ⚠ The measurement, and why it cannot feed back

One `ResizeObserver` on the SVG, publishing an aspect. It is safe
STRUCTURALLY rather than by luck: the SVG is absolutely positioned to fill the
plate, so its box is set by CSS and a `viewBox` change cannot move it. The
3-unit quantiser is belt and braces against sub-pixel resize noise, not the
thing that makes it safe. A translate is invisible to an aspect and a uniform
scale cancels — the same two invariants ADR-069's flight already rests on,
which is what makes this legal on a subtree the proof ladder moves as it
arrives.

⚠ **THE FLIGHT USES THE LIVE BOARD, NOT THE ONE AT REST.** Reading 02's crop
and its card both move with the field's height, so a flight computed against
`CONFIG_LAYOUT_0` would land the card where the laptop board would have put
it. `PdaConsole` derives both from one `configLayout(ext)` and hands the same
object to the attribute and to `pdaFlight`, so the two cannot drift.

### The guard that was missing

`the configuration board fills the panel it is given` walks seven measured
field shapes and asserts, at each: the crop grows by exactly the height the
chain absorbs; the vertical order never inverts and the band stays co-centred;
a module always holds its own header and cells; the frame inset stays uniform
at 26; **the fit stays width-bound, so the type never pays**; and the panel is
filled to within 2px, or the clamp is reached and named. `configLayout` is
pure for exactly this reason.

### Verification

- `npx vitest run` 635 green across 46 files (4 new).
- `npx tsc --noEmit` clean; `eslint` 0 errors (the two `react-hooks/refs`
  warnings on `PdaConsole` are byte-identical on `HEAD`).
- `tests/visual/services-ring-smoke.spec.ts` — **21 passed / 31 skipped**,
  unchanged.
- Live captures at 1280×720, 1440×800, 1920×1080, 1920×1247 and 1920×1440,
  dark and light: 0 clipped, 0 slack, and `minPx` identical to U11's at every
  shape — 7.76 / 8.74 / 10.94.

### Left open

- The console's own height is what makes this necessary: it grows with the
  viewport while all four evidence plates hold landscape-ish content. Capping
  its aspect would solve this for the map AND the other three at once, but it
  is `ConsoleFrame`'s geometry and belongs to its own pass.
- Readings 01 and 03 are still static crops with the same latent defect, and
  still letter at ~4.5–5.5px. They are the next place this bites.

## Update 13 — the notches flip to TR+BL (2026-08-11, owner)

_"Can you switch the notches to top right and bottom left?"_

R4 cuts every module top-left and bottom-right, and U11 reproduced it —
arguing that it matched the `ConsoleFrame` these plates sit in, which took the
same TL+BR override in ADR-065 U2. **The owner has overruled that**, and the
drawing is now on ADR-065's CANONICAL diagonal.

This is the one place the reference is overruled by a standing rule rather
than by arithmetic. Worth recording as a precedent in both directions: the
handoff's composition, geometry and role law all still bind — only the
diagonal moved, and only because the corner law says so and the owner asked.

⚠ **THE PLATE AND ITS HOUSING NOW LEAN OPPOSITE WAYS.** `ConsoleFrame` keeps
its U2 TL+BR override, so the console cuts one way and the drawing inside it
cuts the other. That mismatch was the entire argument for U11's TL+BR. If the
frame should follow, it is `console.css` and its own pass — it is shared with
the other three evidence plates, so it is not a change to make in passing.

### Two things the flip drags with it

- **The 2px top rule stops at the cut.** It ran `x + CUT → x + w` for a
  top-LEFT notch; with the notch top-right it runs `x → x + w − CUT`, or it
  overshoots into the diagonal. Three call sites: the satellites, the card
  (at `CORE_CUT`, which is proportional) and the seat.
- **The header band needed its own path.** It was drawn with the full
  `housing`, which was survivable while the second cut was bottom-RIGHT and
  landed on the module's own edge; with the diagonal flipped it puts a 45°
  nick at the band's bottom-LEFT, in the middle of the module where no edge
  exists. `band()` shares the top corners and squares off at the bottom.

### ⚠ A typecheck error shipped in U12, and this is how it surfaced

`ConfigLabShell` mounts production's `ViewConfiguration` for its `shipped`
variant, and U12 gave that component a required `layout` prop without updating
the lab. It was reported as "typecheck clean" and was not: `.next/dev/types/
routes.d.ts`, regenerated by the running dev server, carries syntax errors
(TS1005/TS1128), and the habit of filtering them out of `tsc` output —
`| grep -v routes.d.ts` — hid a real error in the same pass. **Delete
`.next/dev/types` before trusting a typecheck while the dev server is up**,
rather than filtering its noise. The lab now passes `CONFIG_LAYOUT_0`, which
is what its own `vb` already resolves to, so the crop and the board agree by
construction.

### Verification

- `npx tsc --noEmit` — **0 errors, no filter**.
- `npx vitest run` 635 green across 46 files; `eslint` 0 errors.
- `tests/visual/services-ring-smoke.spec.ts` — 21 passed / 31 skipped.
- Captured at 1920×1247 dark and 1280×720 light: crop and `minPx` unchanged
  (10.94 / 7.76), 0 clipped. The cut is geometry, not layout — no measure,
  crop or type size moves with it.

## Update 14 — the module block is centred, not tailed (2026-08-11, owner)

_"Can you move the nodes components a bit down so everything is nicely
centered?"_

U12 made the board height-elastic and gave the leftover height three shares:
the cables, the cells, and a **tail** below the base module. The tail was the
mistake. It is bed — decorative, sub-.14 alpha, effectively invisible — so
every unit of it read as emptiness rather than as board. At the owner's shape
that meant **26 units of air above the seat against 135 below the base**, and
the whole block sat high in a panel with a hole under it.

### The margin is derived and split, not shared

The fix removes the tail share entirely and inverts the arithmetic. The crop's
height is still the field's (`CROP_H0 + ext`). The MODULE BLOCK — seat, gap,
band, gap, base — takes what the cables and cells claim. **Whatever is left is
halved above and below it.**

```
blockH  = OWNER.h + gap1 + bandH + gap2 + baseH
margin  = (cropH − blockH) / 2
cropY   = OWNER.y − margin
```

That centres the board **by construction**, at every height, with no share
left to mistune. At rest the margin is 55.5 units top and bottom, against
U12's 26 / 85 — so even the laptop board moved down and gained air under the
seat. The block grows by ~0.93 of `ext` against a crop that grows by 1.0, so
the margin widens slowly (55.5 → 72.6 at the owner's shape) and can never go
negative; the guard asserts it stays over 20.

### ⚠ The bed spans the CROP now, not the block

The tail existed because the bed had to live somewhere. R4 scatters its bed
across its own 744-unit stage, so every bed `y` is a fraction of that mapped
onto the crop — which puts texture ABOVE the seat and below the base at every
height instead of leaving the head bare. Marks that land under a module are
simply hidden; R4's own note that the bed is _"scattered clear of modules"_ is
about where it READS, not about where it exists.

⚠ **`CONFIG_INSET` IS HORIZONTAL-ONLY NOW.** The width chain never moves, so
the side margins stay the fixed 26-unit frame inset U11 restored; the vertical
margin is derived. Two different contracts on two axes, and `pda-viewbox`
asserts them separately — the side inset by equality with 26, the vertical by
`top === bottom`. Collapsing them back into one "uniform inset" test is how
the tail would return unnoticed.

### Verification

- `npx tsc --noEmit` 0 errors; `eslint` 0 errors, 4 pre-existing warnings
  (`CROP_Y` died with the fixed top and was removed).
- `npx vitest run` 635 green. The centring is asserted at six `ext` values and
  at every one of the seven measured field shapes.
- `tests/visual/services-ring-smoke.spec.ts` — 21 passed / 31 skipped.
- Captured at 1920×1247 and 1280×720, dark and light: crop and `minPx`
  unchanged (10.94 / 7.76), 0 clipped. Like U13, this moves no measure — it
  only decides where the leftover air goes.

## Update 15 — the substrate is a pin grid, and every reading fills its panel (2026-08-12, owner)

Owner, on reading 03: _"the shape of the cards (especially the bottom ones
with the really weird notch) isn't nice to look at… the entire purpose of this
Substrate tab is to show the shared substrates between the different skills."_
And on all three: _"make sure that the visualization of each tab is nicely
centered like in Configuration instead of having that ridiculous white space
in Substrate and even in Work."_

Two changes, and they are one change: the new drawing is authored into the new
crop.

### The pin grid

The composition is the owner's `Substrate Archetypes (Standalone).html`, frame
**S3 — PIN GRID** (_"forms × teams in one socket · the whole substrate at a
glance"_) — five patterns down, eight departments across, one mark per
crossing.

⚠ **THE MOCKUP IS THE LIVE RECORD ALREADY DRAWN.** Every mark in it resolves
against `crossing()`: 30 taps, 5 cut, 10 empty sockets, rows of 3 · 7 · 7 · 5 ·
8, columns in `MAP_DISTRICTS` order. So this is a coordinate port rather than a
re-derivation, and the owner had already answered the hardest question — what
the drawing is FOR — by drawing it from the data.

**What it replaces had three defects, and the owner named all three in one
sentence about a corner:**

- **`Module`'s cut is `h × 0.34` on BOTH left corners.** On a 148 × 50 card
  that is 17 units twice — **68 % of the left edge**, leaving a 16-unit stub,
  plus a 19-unit bullseye and a divider hairline. Beside it sat `Plate`'s
  single flat-8 cut and `Cartridge`'s `14k`: three glyphs, three corner
  grammars, two of them proportional to different things. The wedge was the
  visible end of an inconsistency.
- **A pattern was drawn as a `Module`**, which on this surface is the
  silhouette of A THING THAT RUNS. The substrate lab's founding diagnosis,
  finally acted on.
- **Answering "who draws on Judgment?" meant tracing a bezier** through 29
  others — the same failure that retired ADR-062's isometric city. A cell is
  read by position.

⚠ **AND IT CARRIED A LIVE CONFIDENTIALITY DEFECT.** `{n} SKILLS · {n} TEAMS`
rendered **8 TEAMS** for PATTERN — 8 is the DEPARTMENT count, while 22 briefed
and 14 running the layer are different units AND different sets.
`cases-registry` bans that exact phrase and never saw it: it walks content
objects with `JSON.stringify`, and this was composed at render time inside a
component. **The pin grid does not need the phrase at all** — a row's marks are
its department count, countable in place.

**Adaptations, each forced by a standing law or by arithmetic:**

| In the mockup                       | Ships as                         | Why                                                                                                                                                                                                        |
| ----------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SB-01`…`SB-05`                     | deleted                          | Ordinals in costume — ADR-066 removed every ordinal here, and U11 removed R4's own passive designators for the same reason                                                                                 |
| the `TAPS / TRENCHED BY` legend     | deleted                          | NO LEGEND by law (ADR-062): the drawing carries provenance. Each row letters `CUT BY {ab}`, which decodes its own green mark in place                                                                      |
| nothing for the `gloss`             | **added**, the row's second line | It lettered nowhere in production, and it is what makes a pattern mean something rather than a word with a count. At 38 chars it also SETS the identity gutter: 336 units of a 374 measure, the house 90 % |
| the row counts                      | `{n} SKILLS` alone               | See the defect above                                                                                                                                                                                       |
| socket = rect + gold corner diamond | a chamfered `housing`            | A socket is a machined housing (ADR-065), on the canonical TR+BL U13 settled; the diamond is R4's registration-mark family, deleted in U11                                                                 |

The 47 is **not** lettered as a headline: the five row counts sum to it in
plain sight and the proof register beside the panel already claims it. The lab
keeps that rung for its own two drawings.

### Every reading fills its panel

U12 and U14 solved this for reading 02 alone. Readings 01 and 03 were carrying
the identical defect the whole time, with every assertion green:

| field                       | 01 waste             | 03 waste                 |
| --------------------------- | -------------------- | ------------------------ |
| 603 × 493 (1280×720)        | **117px horizontal** | 4px                      |
| 850 × 760 (1920×1080)       | 102px horizontal     | 71px below               |
| **845 × 950 (the owner's)** | **92px below**       | **265px below — 27.9 %** |
| 850 × 1120 (2560×1440)      | 257px below          | 431px below              |

265px is within 5px of the 270px that forced U12 in the first place. ⚠ **THE
GENERAL LESSON IS THE ONE U12 ALREADY STATED, AND THIS UPDATE IS THE PROOF:** a
fix applied to the reading that was complained about is not a fix applied to
the surface. Nothing measured a drawing against the PANEL, so the same defect
sat two tabs away for a day.

`pdaFit.ts` is the mechanism, generalised and pure: make the crop's aspect
EQUAL the field's and `meet` is unchanged, so growing a crop costs no type.
`cropAround` is U14's split-margin law on both axes — and reading 02's "fixed
26-unit side inset" turns out to be exactly what that split produces, so it is
one rule rather than a special case. `configLayout` is refactored onto it,
byte-identical at rest.

Where each reading spends the extension:

- **01** — the grid's gutters, on whichever axis the field offers, **capped**
  at 56/62 (about a third of a card) so twenty cartridges stay a grid rather
  than twenty aligned objects. The cards may not absorb it: `CARD_W/H` is
  ADR-069's flight destination and the morph asserts similarity to 0.005.
  ⚠ Width caps at the gutters' own ceiling and not a unit further, because
  `xMidYMin` already centres a horizontal letterbox; HEIGHT keeps growing,
  because a vertical one is anchored at the top.
- **03** — its five bands, capped at 190. ⚠ Its clamp is **1200**, not 620:
  reading 02 spends its extension on CONTENT (cable runs) so it must clamp
  early, while here the row cap already protects the drawing and everything
  past it is margin, which `cropAround` splits. Measured at 603 × 1177,
  clamping at 620 puts the drawing 91px from the top and 426px from the bottom;
  unclamped it is 258px from each. Same emptiness, and one of them looks like a
  mistake.

⚠ **THE BAND RULES ARE WHAT KEEP A TALL PANEL FROM READING AS EMPTY.** At the
owner's shape a row runs 185 units against 64 units of ink, and without a
boundary that air reads as a hole between two rows rather than as the height of
one. Four internal hairlines for five bands — the socket's own walls close the
set. At rest they are 112 apart and nearly invisible; they earn their ink
exactly where the drawing stretches.

⚠ **`gridRect` TAKES THE LIVE LAYOUT, AND IT IS NOT DEFAULTED.** A default
argument is precisely how "the flight computed against the resting board" gets
written. `PdaConsole` holds ONE aspect in state and derives three layouts from
it; the flight uses both live boards.

### Guards

- **`pda-viewbox`'s ≤40-unit waste rule is gone**, and its replacement is
  stricter rather than looser. That rule asked whether a crop was much taller
  than its content, which was right while 01 and 03 were static — and which
  would have FOUGHT this fix. It becomes a centring contract on both axes (the
  margins are equal, and they are real), plus a new **`every reading fills the
panel it is given`** suite over the seven measured fields, asserting no dead
  panel on either axis and that elasticity never shrinks the drawing.
  ⚠ Deleting a rule without replacing it is how U14's tail returned unnoticed;
  this is the same trap one level up.
- **`pda-flight` walked the static `VIEW_BOX[1]` in eight places.** Against an
  elastic reading 01 that goes **vacuous rather than red** — still green, no
  longer guarding the string production renders. It derives both boards per
  field now, at five shapes including the owner's tall one.
- **`pda-substrate-fit` is new, and reading 03 had no arithmetic guard at
  all.** That is how an unpublishable string lived in it for months. Every
  lettered string is declared through `substrateLettering`, walked for fit, for
  the longest WORD, for the fs floor, and against the envelope — including
  `/\bteams?\b/i`, which is what stops `8 TEAMS` returning.
- The smoke's six-viewport map walk already covers the redraw's real risk
  (`overlaps`, `clipped`, `minPx`), and its light walk covers the new marks.

### Where the kit lives

`Tap`, `DeptHead`, `housing`, the type ladder and the spec emitters moved from
`app/(internal)/test/intelligence-substrate-lab/substrateKit` into
`map/pda/substrateKit`, and the lab re-exports them. The lab authored them at
reading 02's crop width precisely so a promoted winner would be a copy rather
than a re-fit; production may not import from an internal route, and two copies
of a measured drawing is how a lab starts passing what production would fail.
`adv` / `specWidth` / `LetterSpec` moved the same way, into `map/pda/pdaLetters`
— PT Mono's advance is a property of the font, not of a route, and a fit model
only a lab can reach is a model production ships without.

### Verification

- `npm run verify` — lint, typecheck, **669 unit tests green**.
- `tests/visual/services-ring-smoke.spec.ts --project=desktop` — 12 passed, 1
  skipped, including the six-viewport map walk, the box-clipping sweep and the
  light-theme contrast walk on all three readings.
- `scripts/capture-map-readings.mjs` at **1280×720** and **1920×1247** (the
  owner's own window), dark and light: 0 clipped, 0 label-on-label, `minPx`
  7.76 / 10.94, and all three readings filling the panel top to bottom.
- `scripts/capture-substrate-lab.mjs --v shipped` — 4 samples, gates passed, 36
  labels at 7.8 / 10.9px against the old drawing's 5.8 / 6.1.

### Left open

- Reading 01's rendered type is still the standing density question ADR-063
  §Outstanding records. Elasticity buys **zero** type by construction; it
  removes dead panel, which is all it claims.
- The substrate lab's three losing directions (strata · crossing table ·
  containment) are still mounted beside a `shipped` baseline that is now the
  pin grid. That comparison has served its purpose, and on the ADR-070
  precedent the losers are a candidate for deletion — an owner call.
- `Module`, `Pads` and the old crossing's `--l` dash constant left production's
  reading 03 with the drawing. ⚠ `Module` is still used by the city sheets, so
  check before deleting it from `pdaGlyphs`.

## Update 16 — the substrate is five stacks of named Skills (2026-08-13, owner)

Owner, on the pin grid: _"what I mainly want to convey is the patterns across
the different skills… I want a very clear visualization that evolves from Work
and Configuration."_ And on the foot it shipped with: _"(skills cut by 07,
which is meaningless text) — just a one-sentence explanation of what each
substrate means, and then the overview of the skills; I don't want a boring
ass text list."_

**Reading 03 is now five pattern CARDS, each a stack of its own encoded
Skills over the pattern's physics field, with the gloss in the foot.** One
card per pattern; one PLATE per Skill — a slab with an accent at its left
edge, `short` label, stacked from the header down; under the stack the raw
field fills whatever is left; the foot says what the substrate MEANS.

⚠ **THE READING IS EXTRACTION.** The plates are what has been encoded, the
field is the material they came out of. Which is why Stakeholder's five
showing more raw field than Pattern's fourteen is the drawing making its
point rather than a hole in it — and it is the answer to the "boring ass text
list": the list IS the mass, and the texture under it is the remainder.

### What U15 got right, and the one thing it could not do

The pin grid was correct and it stays correct — every mark in it resolved
against `crossing()`. It is replaced because **it answered a question about
DEPARTMENTS on a surface whose subject is the SUBSTRATE**, and the question a
reader actually brings to this tab — _"what is in Judgment?"_ — was the one
thing it would not say. A row of eight marks tells you the reach and never
the contents.

⚠ **THE 5 × 8 CROSSING IS GONE FROM THE SITE, AND THAT IS A DECISION, NOT AN
OVERSIGHT** (owner, put to him explicitly and taken). 30 taps · 5 cut · 10
empty appears nowhere else the landing renders; ADR-062's isometric city
still holds it in `map/**` and is still tested, but it is not what ships. It
cannot come back inside a card: eight department codes need ~196 units of
lettering against a card's 132-unit window, and marks without codes need a
legend, which this surface does not have by law. **If the crossing returns it
needs its own reading, not a corner of this one.** `crossing()` still
projects it and its arithmetic is still guarded, so the RECORD lost nothing —
only the drawing stopped showing it.

### Adaptations, each forced by a standing law or by arithmetic

| Piece     | Ships as                                                   | Why                                                                                                                                                                    |
| --------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the label | `short`, authored ≤14 chars — never `name`                 | 132-unit window at the fs floor. ⚠ Clipping is not an option: "Legal Risk Methodology" truncates to **"Legal Risk Met"**, which is a machine artifact on a client page |
| the count | a bare numeral beside the pattern name                     | `{n} SKILLS` was lawful, but a card of countable plates does not need the noun                                                                                         |
| the foot  | the `gloss`, wrapped and CENTRED                           | it replaced `{n} SKILLS · CUT BY {ab}` — two numbers and a code, true and unreadable as a claim                                                                        |
| `CUT BY`  | carried DOWN a level: the first encode's accent goes green | the green still points at the fact the pin grid pointed at, with a finer finger — at the Skill rather than at the row                                                  |
| the card  | reading 02's module — shared `housing` / `band`, TR+BL     | head · body · foot, ADR-065's canonical diagonal. It is the same object as a configuration module, which is the evolution the owner asked for                          |

The per-Skill OWNER does not travel. The source data carries client staff
names and `CaseSkillEntry` has refused that field since ADR-056; the label is
`short`, and the team is not lettered at all. ⚠ **The named Skills themselves
are publishable because they already ship** — the same case's REGISTRY row
renders all 47 by name in `SkillsBrowserPlate`, one casefile row away. This
letters no new fact; it letters the same roster in the drawing that explains
what groups it.

### Two traps, both about a line that is too thin to exist

- ⚠ **THE SPINE IS NOT DRAWN — IT IS THE STACK'S OWN LEFT EDGE.** The first
  cut ran an explicit 1-unit bus down each card with a node per Skill. At this
  surface's meet that paints under a device pixel, the browser pays the
  remainder in alpha (U11's ceiling), and what survived was a dash and a dot
  per row: **a bulleted list**, which is the exact thing the owner rejected.
  Fourteen accent bars at plate weight carry the same reading at a weight the
  meet cannot erase.
- ⚠ **THE FOOT IS A BAND, NOT A HAIRLINE**, for the same arithmetic. The head's
  identical 1-unit rule reads fine only because it has a band above it doing
  the work. The foot fill is CLIPPED TO THE HOUSING so the BL chamfer is
  inherited rather than re-derived by hand.

### The vertical chain, and where the extension goes

The width chain never moves: `SUB_CROP_W` is still **932**, five cards on a
`W / 5` pitch, so `meet` is `field.w / 932` at every height and growing the
crop is free (U12's law, unchanged). The elastic axis is height, and it is
**split between the plate pitch and the field**:

- all of it to the FIELD and the densest card is a short stack over a large
  texture — the plates stop being the subject;
- all of it to the PITCH and the labels stay the same size while the gaps grow,
  which is U12's hole one level down: **a taller plate is a plate with air
  under it**.

So the pitch takes a bounded share (18 → 26, spacing rather than a gap) and
the field takes the rest, because the field is the one element on the card
that is texture and can absorb any amount of room honestly. `CARD_H_MAX` 1000
is where the card is 1 : 6.4 and further extension buys only a taller
texture; past it the remainder is margin, which `cropAround` splits (U14).

Measured: 603×493 → card 710 · 850×760 → 781 · **845×950 (the owner's) → 996,
a full fill** · 603×1177 → capped with 88 units of air at each end.

### Two constants whose obvious value is wrong

- **`GLOSS_LINE_BOX` is 17, not 15.** A 12-unit label's `getBBox` is **15.47**
  units tall — the font's em box, ascender to descender, not its ink. At a
  15-unit pitch consecutive gloss lines overlap by 0.47 and the smoke's
  label-on-label gate fires above 0.5. ⚠ That is a 0.03-unit margin: not a
  pass, a coin flip on a font metric. At 17 they clear by 1.53.
- **`GLOSS_PER` is 16, not 15.** At fs 12 / .08 the advance is 8.16u, so 16
  characters measure 130.6 against the 132-unit window — the ceiling, not a
  round number. At 15 the Pattern gloss broke as `RECURRING / SHAPES / / …`,
  stranding a slash alone on a line.

⚠ **AND THE GLOSS IS CENTRED IN ITS BAND, NOT HUNG FROM THE TOP.** The five
glosses wrap to two, three or four lines; a fixed first baseline leaves the
two-line cards with a third of the foot empty under them — five feet at four
different fills, reading as four different components.

### One highlight, one signal

⚠ **THE LABEL DOES NOT TAKE THE GREEN, THE ACCENT DOES.** Lettering the first
encode in `--pda-grn-ink` (#7e9f66) against every sibling's `--pda-txt` (dawn
at .92) makes the one plate the drawing means to point at **the dimmest thing
in the stack** — the highlight rendering as de-emphasis. The accent carries
the state at full weight against the others' .55, which is one signal per
object rather than two saying it twice.

### The data, and the kit

- `CaseSkillEntry` gains **`short`** (authored, ≤14) and **`flagship?: true`**
  (exactly one per engine, five in total). Both are content, both are walked.
  Two shorts the promotion script produced were machine clips and were
  re-authored by hand: `Cost / Feas` → **`Feasibility`**, `GL Recon` →
  **`GL Reconcile`**.
- `particleForms.tsx` moved out of the lab into **`map/pda/substrateForms`**
  and the lab re-exports it — same rule as U15's kit move. Production may not
  import from an internal route, and two copies of a measured drawing is how a
  lab starts passing what production would fail.
- The skills reservoir is threaded `TrackVisual → IntelligenceMapPlate →
PdaConsole → ViewSubstrate`. ⚠ **`visual.skills` is GEOMETRY now, not
  evidence** — it used to feed a count.

### Guards

- `pda-substrate-fit`'s crossing assertions become skill assertions: **every
  card's numeral equals the plates under it**, **each pattern has exactly one
  first encode**, and **no Skill label is a machine truncation** (a `short`
  that clips its `name` mid-word fails; a whole-word shorthand passes).
- ⚠ **The `/\bteams?\b/i` envelope ban is narrowed to the digit-adjacent form
  it was written for** (`8 TEAMS`). It was catching `People-team`, a client's
  own proper noun that already ships in the registry — a ban wide enough to
  fail on correct content is a ban that gets deleted.
- `pda-viewbox`'s `CONTENT[3]` derives its bottom from
  `SUBSTRATE_LAYOUT_0.cardH` rather than the pin grid's constant.
- The substrate lab's `shipped` baseline mounts **elastic**, at whatever the
  preset's field asks for. It mounted at rest until this promotion, which at
  p1280 drew a 430-unit card into a 763-unit crop: **a preview of a drawing
  the site never serves**.

### Verification

- `npx vitest run` — 132 green across the two fit suites, full `tsc --noEmit`
  clean.
- On the live landing at 1280×720, reading 03, dark and light: crop
  `0 0 932 763`, 70 lettered strings, `minPx` **7.76**, **0 clipped, 0
  label-on-label at any overlap** (the gate fires above 0.5u; the worst
  measured is 0.00).
- ⚠ **The console's reveal is scroll-driven** — `scrollIntoView` leaves
  `.fl-con__console` at `opacity: 0` with the SVG fully measurable, so a
  DOM-only check passes against a panel that paints nothing. Scroll in
  incrementally until it lights before you shoot.

## Update 17 — REJECTED. The cartridge frame means WORKSTREAM (2026-08-14, owner, same day)

Built and rejected in one session. The direction was three selected-work-
aware lab variants (`backplane`, `bus`, `cutaway`) plus a promotion of
`backplane` to production: reading 03's card sat at `layout.core`, the
five substrate patterns fanned around it as bays, and `02 ↔ 03` was a
flight-identity so the card visibly stayed while the bays re-rastered.

**The owner's verdict was that this made reading 03 about the workstream
again**, not about the substrate. The cartridge frame is what reading 02
draws the SELECTED WORK in; putting one at the core of reading 03 anchors
the whole substrate reading on a single workstream, which is exactly the
context the reading is supposed to widen out from. The rebrand walked
back the same way U1's radial-switchboard did — a whole ADR update
reverted the day it landed.

⚠ **THE ROUND-FOUR LESSON, filed for the next attempt**: **on THIS surface
the cartridge silhouette is a proper noun that means WORKSTREAM.** Reading
02 uses it for the seat card; the flight in ADR-069 carries it between
readings 01 and 02 because both readings ARE about that one work. Reading
03 is scoped ONE step wider — the shared layer beneath every workstream —
and its drawing may not depend on a selected work. The three lab variants
survive as recorded losers (`backplane`, `bus`, `cutaway` in
[`app/(internal)/test/intelligence-substrate-lab/`](<../../app/(internal)/test/intelligence-substrate-lab/SubstrateLabShell.tsx>)),
guarded on their own, and the round-four directions are documented in
[`variants.ts`](<../../app/(internal)/test/intelligence-substrate-lab/variants.ts>)
so the reason each was tried and each was rejected is on the record.

**Production stayed on U16 (five pattern cards).** No production file kept
a U17 delta; the four production-side files (`PdaSubstrate.tsx`,
`PdaConsole.tsx`, `tests/lib/pda-substrate-fit.test.ts`,
`tests/lib/pda-viewbox.test.ts`) reverted cleanly to their U16 state.
The `substrateExt` / `substrateLayout` / `SUBSTRATE_LAYOUT_0` /
`SUBSTRATE_VIEWBOX` aliases and the `02 ↔ 03` flight branch are all rolled
back — they were the wrong shape for a reading that must not depend on a
selected work.

## Update 18 — round five: cluster physics, estate-scoped (2026-08-15, owner)

Six new directions built beside the round-one-through-four record: the
CLUSTER-AS-BODY family. Each direction draws a pattern as a physical body
of like objects whose depth IS the count — a fan, a pile, a braid, a
node's wire trunk, a comb of leaves, a trunk of branches — with one
exemplar pulled out and lettered while the rest stay silhouettes. All 47
skills are present as MARKS (one mark per skill, so 14 is visibly heavier
than 5); only two labels letter per cluster (the pattern's name and its
flagship encode). The gloss does not letter on any of the six — a 38-
character sentence does not fit a 176-unit column at a legible size, and
the cluster's SHAPE is the more direct answer to "what is a pattern" than
prose beside it.

### The six directions

| id              | label              | shape                                                       | reference                      |
| --------------- | ------------------ | ----------------------------------------------------------- | ------------------------------ |
| `hand`          | 15 · Hand          | fanned deck of plates from a root pivot                     | CP2077 attribute-of-the-kitsch |
| `piles`         | 16 · Piles         | offset-stacked slabs at the crop's floor                    | CP2077 quest-log stack         |
| `constellation` | 17 · Constellation | five nodes ring a central total, wire trunks braid          | CP2077 attribute wheel         |
| `loom`          | 18 · Loom          | five chips braid one wire per skill into one SUBSTRATE chip | CP2077 citizens-database       |
| `leaves`        | 19 · Leaves        | comb of hairline leaves on a fore-edge slab                 | CP2077 item cells              |
| `roots`         | 20 · Roots         | five trunks rise from one shared bus, branches per skill    | CP2077 industrial monitors     |

### Shared rules

- One mark per encoded Skill (fan plate, stacked slab, wire, ribbon,
  leaf, branch); the count is a numeral BUT the count is also DRAWN by
  the mass, so a hand-typed 07 that disagreed with a drawn seven would
  be caught by the `markCount` guard.
- Flagship encode takes green (accent bar or wire) and letters its
  `shortTitle` HORIZONTALLY — never rotated with the mass silhouettes.
  That is the discipline the isometric city broke on (`getBBox` cannot
  measure a rotated text at the tight tolerances the surface uses).
- No workstream cartridge. No selected work. No team names on the
  drawing.
- TR+BL chamfers on housings, per ADR-065.
- Every direction exports `<name>Lettering()` and `<name>MarkCount()`;
  the guards walk both.

### The lab is guarded, per direction

- `substrate-lab-fit` extends the `VARIANTS` table with the six new
  directions and their per-variant spec floors (15 – 18). Every
  string walks fit, longest-word, fs-floor, teams-unit and envelope.
- A new `MARK_COUNT_VARIANTS` table asserts that each cluster's marks
  equal `record.shapes[k].skills` — a fan that dropped one plate would
  fail here before it shipped.
- `scripts/capture-substrate-lab.mjs` produced 24 stills: 6 directions
  × 2 themes × 2 presets. Gates: 0 collisions, 0 clipped, 0 overflow,
  `minPx ≥ 7.8`.

### Caught in the guard the hour it was written

- `hand`'s flagship label ("Founder TOV", 11 chars at fs 12 / .08 =
  89.76u) ran past a naive PLATE_W + 20 = 68u measure. Fixed by
  measuring the flagship label against the plate's LABEL COLUMN (120u
  wide, since the label is text-anchored middle and extends past the
  plate on both sides).
- `leaves` collided its flagship label with the count numeral on the
  two patterns where the flagship is the FIRST skill (Judgment,
  Pattern) — the leftmost leaf at COMB_X + 8 put its label at ~x=306,
  running back into the count column ending at ~x=274. Fixed by
  moving the leaves' spread inset from 8 to 60 on each side, which
  keeps the leftmost label inside the comb.
- `roots`'s flagship label on the rightmost trunk clipped the crop's
  right edge (14 chars past a stub end at cx+70 runs to 1006, past
  R=906). Fixed by forcing the flagship's side to face the crop's
  centre: left half of trunks put flagship on the RIGHT, right half
  put flagship on the LEFT. Alternating branch stubs are unchanged
  for non-flagship branches.

### Left open

- Production reading 03 is unchanged (U16 pattern cards). Round five
  is a design surface with six candidates and no promotion; the owner
  picks the winner and promotion is its own pass.
- The `piles` direction's mass reads at its most subtle on the p1280
  preset — the offset-stack differential between n=5 and n=14 is
  70/56u, which is legible against a 22u slab but not dramatic. If
  `piles` wins, the promotion pass has to choose between (a) taller
  slabs (more visible mass, less identity-strip room) and (b) larger
  SLAB_STEP (more dramatic depth, wider footprint). The lab lets
  either be tried.

## Update 19 — round six: the definition leads, and the record names its eval method (2026-08-15, owner)

Twenty directions across five rounds and none had landed. The owner brought
the reference the whole reading has been trying to be — Aether's
`/claude-adoption` substrate donut, where 47 Skills cluster into five wedges
each carrying a **name, a count and a one-line definition** — with three
constraints: it may not look like the work tab, it need not letter all 47
Skills, and it lives in a **603 × 493 px panel**, not on a full page.

### The diagnosis, and it is mechanical rather than a matter of taste

Two faults, both visible in the captures and neither reachable by any guard
this surface had:

1. **THE INCUMBENT IS A ROW OF FIVE CARDS, WHICH IS READING 01's GRID AT
   n = 5.** U16 draws five `housing()` cards in a row with 20 units between
   them. The owner's standing constraint is broken by the PRIMITIVE, before a
   single string is placed — no amount of content tuning reaches it.
2. **THE DEFINITION IS THE FOOTNOTE WHILE BEING THE ANSWER.** Each card buries
   its gloss in a 78-unit foot at the type floor, under a large empty field,
   beneath fourteen Skill labels. The reference letters that same sentence at
   wedge scale, which is the whole reason it reads. The identical inverted
   ladder U10 found when a question lettered larger than its answer.

And round five (U18) over-corrected: mass became the entire subject and the
definitions dropped to a line or vanished, so `constellation` says LESS than
the drawing it was replacing while using ~40 % of the panel.

**THE LAW: the definition leads, mass modifies it, the Skills are texture.**
No card row; no fan, pile, comb or hub (round five owns those); every
direction fills the crop.

### The record gained a field, and it is the owner's own word

`CaseMapShape.evalMethod` (≤24 chars) — what "good" is tested against on that
shape. The gloss says what the shape MEANS; this says what it is CHECKED
against, which is what makes a substrate inheritable: a second team takes the
method without taking anyone's judgment. Derived from Aether's own
`content/intelligence-architect.ts`, which carries `evalMethod` for three of
the five and is rendered nowhere.

voice `Side-by-side review` · judgment `Rubric-graded cases` · validation
`Known-failure fixtures` · stakeholder `Reader sign-off` · pattern
`Reference outputs`.

⚠ **IT IS IN `cases-registry`'s SCANNED BLOB.** It is the field most likely to
reach for a tool or a threshold, because the honest answer to "how is this
checked" is often a product — and a record field outside that scan is exactly
how `8 TEAMS` reached the public page. Pinned: ≤24 measured (24 chars × 8.88u
at fs 12 / .14 = 213u, the widest key column any direction affords), non-blank,
five distinct, and **never equal to its own gloss** — a method that restates
the definition has quietly deleted one of them.

### The five, and what each argues

| #   | id       | the claim                                       | mass is |
| --- | -------- | ----------------------------------------------- | ------- |
| 21  | `wheel`  | proportion of one whole — the reference, ported | angle   |
| 22  | `mosaic` | one plate divided, not five cards collected     | area    |
| 23  | `gate`   | a substrate is the TEST work is checked against | marks   |
| 24  | `runs`   | ranked comparison, verifiable by counting       | length  |
| 25  | `grade`  | the ground the work stands on                   | depth   |

`roundSix.tsx` derives the five facts ONCE — name · count · gloss ·
evalMethod · flagship — and every direction letters the same set through
`patternSpecs`, so a direction cannot quietly become a content fork. Two of
`wheel`'s adaptations are forced rather than chosen: it drops the reference's
rim chips (47 names cannot letter at this meet, and the chips carry an OWNER
field the map's envelope has refused since ADR-056), and its BY TEAM axis
cannot exist here at all, since departments are not lettered on this map.

`mosaic`'s partition is **derived, never authored** — slice-and-dice over the
mass ranking, the heaviest filling the left column until the running sum
passes half the estate. Hardcoding "pattern and judgment go left" would
silently mis-draw the moment a Skill moves between shapes.

### A new guard, because three of the five have no marks to count

U18's `markCount` cannot reach an angle, an area or a depth. `MASS_VARIANTS`
divides each magnitude by the Skill count and asserts every pattern lands on
the same unit — strictly what a continuous encoding promises, and it fails
loudly the moment a floor, a clamp or a hand-tuned constant appears. Plus a
`round six letters the definition` suite: every pattern must letter its
definition AND its method, the definition may not letter smaller than the
chrome around it, and a gloss that wrapped past its cap declares its dropped
tail at measure 0 so the slice fails rather than vanishing.

⚠ **`mosaic` AND `grade` EXPORT NO `markCount`, DELIBERATELY.** Mosaic draws no
per-Skill mark at all, and grade's tick run is deliberately UNGROUPED — a
per-pattern count would assert a grouping neither drawing makes and pass by
measuring the fixture against itself.

### ⚠ THE CAPTURE HARNESS WAS GATING AGAINST THE WRONG DRAWING

Found on round six's first capture, and it predates round six.
`capture-substrate-lab` waited on `location.search` — **which the script itself
sets** — plus `data-minpx > 0`. Both are true from the first paint, before the
page adopts the `?v=` param, and the DEFAULT variant's own measurement
satisfies the numeric half. Fast drawings win the race; `mosaic` and `grade`
paint a particle field, lose it, and were gated against the shipped baseline's
**70 labels at another preset's scale** — reported green, at both presets.

The readout now publishes the identity it measured (`data-stamp`,
`variant|theme|preset`) in the same `setState` as the numbers, and the script
waits on THAT. `useConfigFitReadout`'s `stamp` argument is optional, so the
configuration lab is unaffected. **A wait condition a script can satisfy by
itself is not a wait condition.**

### Verification

824 unit tests across 49 files, lint and typecheck clean. 24 stills (6 × 2
themes × 2 presets, the baseline inside the gates): 0 collisions, 0 clipped,
0 overflow, 0 page errors, minPx 7.8 at p1280 and 10.9 at p1920 on every row.

Caught by the guards while writing them:

- `gate`'s criterion column was 316u against the 38-character voice gloss's
  335.9u and sliced the word `CONTEXT` — invisible on screen, since SVG text
  neither wraps nor reports overflow. The criterion is the LAST column, so
  every unit the approach and the plate take comes out of it; the run went
  186 → 140 and the plate 300 → 296, buying ~4 characters of headroom.
- The flagship mark landed **mid-run** in `runs`, `gate` and `wheel`, because
  the fixture's order is alphabetical by team. The drawing said "the fourth
  one is special" where the record says "this one came first and the rest
  followed" — `RoundSixPattern.ordered` puts the first encode first.
- `grade`'s depth was correctly proportional and **not visible**: two hairlines
  and a 5 % wash at this meet is a boundary the eye has to hunt for, so the
  2.8× between Pattern and Stakeholder simply did not read. A solid gauge
  column at the seams' shared left edge turns the same arithmetic into a
  comparison without adding a second encoding.
- `wheel`'s 4° gap is ~6 units of arc, under two device pixels at this meet,
  so a flat wash read as one grey annulus with nicks in it. Two steps of wash
  plus a lit outer arc per wedge separate them without a per-wedge colour,
  which this surface has no legend to explain.

### Left open

- Production reading 03 is unchanged (U16). Round six is five candidates and
  no promotion; the owner picks, and promotion is its own pass which must
  re-check U12's elastic-crop case — the lab's crop is static.
- The five `evalMethod` strings are authored from Aether's data and are
  content, not geometry. Expect rewording; re-run the fit guard after, since
  `gate` now has ~4 characters of slack in its criterion column.
- `grade` is round one's `strata` re-cut, and the lineage is named rather than
  hidden. If it wins, it wins as strata's second draft.

## Update 20 — `facet`: the wheel cut straight, lettered from the inside (2026-08-15, owner)

The owner's read on 21: **"I love the wheel, but I want the labels inside and
it to be less round, a bit asymmetrical."** Thoughtform draws no round shapes
but its brand marks, so the disc was always on borrowed time.

### ⚠ Angle-as-count and inside labels are arithmetically incompatible

The wheel carries the count as ANGLE, which makes the smallest pattern the
narrowest wedge — and Stakeholder is both the smallest (five Skills) and the
longest name. `STAKEHOLDER` measures 149.6u at fs 20; a 36° wedge only reaches
that width ~230 units out, where about 20 units of radial depth remain against
a block that needs ~105. **No radius this crop affords fixes it.** Inside
labels therefore force the encoding to move.

### The count SPLITS between how wide a wedge is and how far it reaches

`θ ∝ √n`, and the radius is then solved so the quad's own area —
`½·sin(θ)·(r² − R0²)` — is exactly the Skill count. Nothing is given up but
the disc: **area is what a reader actually reads in a pie**, angle alone never
was the compared quantity, and the wedge that must hold the most text now has
the most room.

⚠ **THE SPLIT IS WHAT MAKES IT A ROSETTE INSTEAD OF AN ASTERISK.** The first
cut put the WHOLE count in the radius (equal 68° angles, `r = √(R0² + c·n)`).
It seated every label and it was wrong on sight: small patterns became short
spikes and big ones long ones, five points around a hub reading as separate
objects rather than one thing divided, with the crop's bottom third empty.
`SPLIT = 0.5` gives 50°–84° angles and 312–440 radii on this record — plainly
irregular, and still closing into one figure. `SPLIT` is the one dial and the
area identity holds at every value of it.

⚠ **AND THE AREA FORMULA HAS TO BE THE QUAD'S, NOT THE SECTOR'S.** The probe
that chose the constants used `½·θ·r²`, which is right only for a wedge that
runs to a point; these run to a chord at `R0`, and the areas drifted ~1.5 %
apart. Guarding `r² − R0²` alone would likewise have been correct while the
angles were equal and silently wrong the moment they varied — the exact shape
of a guard that keeps passing after the thing it measures has changed.

### Seating is solved, and it is its own guard

A label block is an AXIS-ALIGNED rectangle; a wedge is a rotated quad. A
rectangle of width W and height H needs roughly `(W + H)/√2` of radial
thickness at 45°, far more than the `max(W, H)` it needs in a wedge aligned to
the screen — which is why the first attempts failed on whichever pattern
happened to land on a diagonal. `seatBlock` walks the wedge's bounding box and
returns the first position where the block's four corners are all inside it,
trying gloss wraps from widest to narrowest so a deep narrow wedge gets a deep
narrow block. It returns **null** rather than falling back, and
`substrate-lab-fit` asserts every wedge seats.

⚠ **NOTHING ELSE ON THIS SURFACE ASKS THAT QUESTION.** The fit guard checks a
string against a MEASURE; the capture checks glyph boxes against the crop and
against each other. A block that drifted through a rim chord or across a gap
into its neighbour would letter cleanly, collide with nothing, sit inside the
crop — and read as somebody else's label.

### Three defects the guards caught, all invisible to review

- **A 4-unit search stride stepped over Voice's feasible band**, which is a few
  units wide, and the solver reported "cannot seat" for a block that fits. A
  search granularity is part of the arithmetic here, not a performance knob.
- **`FIT_EPS` on the geometry cost Voice its seat.** The block's measure IS its
  widest line, so the longest name lands on it exactly and the guard's own
  recomputation lands 3e-14 the other side; the epsilon belongs on the DECLARED
  measure and nowhere near the seating width. Voice clears its wedge by under
  half a unit, so half a unit of imaginary width is the difference.
- ⚠ **A GROUP `transform` BROKE THE CLIP GATE — all 27 labels reported clipped
  on a drawing that clips none.** `getBBox()` reports a node's box in its OWN
  user space, so a `translate(...)` around the drawing leaves the readout
  comparing untranslated glyph boxes against the crop. The derived origin is
  baked into every drawn coordinate instead; geometry and seating stay in shape
  space with the hub at the origin, which is what lets the composition centre
  itself from its own bounding box (U14's law) rather than from a hand-set pair.

### Verification

834 unit tests across 49 files, lint and typecheck clean. `facet` letters 27
labels at 0 collisions / 0 clipped / 0 overflow, minPx 7.8 at p1280 and 10.9 at
p1920, dark and light. Bounding box 771 × 736 in a 932 × 762 crop — 80 % of the
panel, against the wheel's ~50 %.

### Left open

- ⚠ **`facet` LETTERS NO COUNT**, alone among round six: the wedge's size is
  the count and the rim ticks are there to be tallied, so a numeral would be
  this surface's said-twice defect. If the owner wants the number, it goes on
  the wedge and the ticks come off — not both.
- Voice's block clears its wedge by under half a unit. A reworded gloss or eval
  will fail the seating guard rather than letter through a chord, which is the
  intended failure, but it means this direction has no copy headroom at all.
- `wheel` is kept beside it deliberately. `facet` changes what the drawing
  encodes, so it is judged against 21, not against the other four.

## Update 21 — round seven: the fault was the REGISTER (2026-08-15, owner)

Twenty-six directions across six rounds, and the owner's verdict on round six
was that the substrate _"just feels completely out of place"_ beside the two
settled readings. Six rounds had treated that as a geometry problem. It is not.

### ⚠ READINGS 01 AND 02 ARE PARTS OF A DEVICE. EVERY SUBSTRATE ATTEMPT WAS A CHART.

Reading 01 is a field of **cartridges** — physical objects, seated, latched,
state-marked. Reading 02 is a **circuit board** — opaque modules on a PCB bed
with hatched ribbon lanes and a seat card. Both are panels from the Cyberpunk
industrial-monitor references, which is the hand this console is drawn in. It
is a PDA.

And the substrate has been drawn, every time, as a **chart pasted into that
machine**: a crossing table, a containment tree, seams, a pin grid, plate
stacks, fans, piles, a hub, a comb, roots, a donut, a mosaic, ranked bar rows,
strata, and a straight-edged donut. Chamfer a pie chart and it is still a pie
chart. **Proportion was never the problem, so no amount of adjusting it could
land** — which is exactly the shape of six rounds of near-misses.

⚠ **AND THE RECORD'S OWN WORDS SAID SO ALL ALONG.** Teams _draw on_ the
substrate; work is a _draw_; the shapes are a _reservoir_; the layer is _below
grade_; the reading is _extraction_. Supply-side vocabulary from end to end,
while the drawings kept reaching for statistics. When a surface's content model
and its pictures speak different languages, the pictures are wrong.

**THE LAW: draw the substrate as the machine's SUPPLY SIDE — the part of the
device the cartridges draw from.** Squint test: does it look like a panel off
the same instrument as 01 and 02? Round six's CONTENT law is untouched (the
definition leads, `evalMethod` is lettered, the flagship takes a green mark and
keeps its ink).

### ⚠ ONE NUMBER SHAPES EVERY LAYOUT ON THIS SURFACE

`KNOWN-FAILURE FIXTURES` measures **195.4u** at fs 12 / .14; a five-across
column of this crop is ~176. **The eval method does not fit a five-across
layout at any type size this surface allows.** That is what quietly drove round
six into corner blocks and full-width rows, and it is why two of round seven's
three call out to a ledger and the third abandons columns entirely. Worth
stating plainly because it will keep deciding layouts until the string changes.

### The three

| #   | id        | the object                           | mass is         |
| --- | --------- | ------------------------------------ | --------------- |
| 27  | `tanks`   | five vessels on one manifold         | fill height     |
| 28  | `pinbank` | ONE housing, five banks, 47 pins     | bank extent     |
| 29  | `stack`   | one housing, five layers, in section | layer thickness |

`pinbank` is the only direction in seven rounds where **the substrate is one
OBJECT**. Every predecessor drew five things and then had to argue they were
one layer; here the layer IS the component and the patterns are five banks of
its pins. Its reference — the relay-driver / TLM-decoder panel — is the closest
thing in the whole reference set to what this record is, and it sat unused for
six rounds. It letters no count anywhere: the pins are the number.

All three carry a **shared graduation pitch** (one mark per encoded Skill at
one unit across all five), which is what makes each a single instrument rather
than five differently-scaled pictures.

### ⚠ THE DIAMOND LATTICE WAS DESIGNED AND REJECTED ON ARITHMETIC

Planned as the third direction from the bio-monitor reference: five diamonds
sized by area, the NAME inside, the detail on an attached tab. The diamonds
fit — `STAKEHOLDER` inside the smallest needs a half-diagonal of 87.8, putting
a touching row of the three heaviest at **801 against 880 available**. The TAB
cannot be placed: **a lattice means edge-touching, and two touching diamonds
leave a clear gap of ZERO at their waist**, so every side tab overlaps a
neighbour. Tabs in a column make it a third marks-plus-ledger; tabs in a block
at the foot make it a card grid, which round seven exists to escape. The
direction could not deliver the one thing that distinguished it, so `stack`
replaced it. Recorded rather than quietly dropped, because the diamonds
themselves are viable and someone will propose them again.

### Caught after the first capture

- **`stack` perched its text at each layer's top**, so the heaviest layer —
  the one whose thickness is the entire point — carried ~130 units of empty
  field beneath four lines of type. ADR-070 U14's hole in a new place: a taller
  layer became a layer with a void under it. The block centres in its layer
  now (`inkOffset`), which the thinnest layer still clears.
- **`tanks`' vessels have headroom above the fill, and that is deliberate.**
  All five share one scale whose maximum is the heaviest pattern, so the empty
  part is the gauge, not a claim about unencoded capacity. Named here because
  it is the kind of thing that reads as an implied datum on a surface that
  bans them.

### Verification

190 fit-guard cases (from 163), lint and typecheck clean. 16 stills across
4 variants × 2 themes × 2 presets with the baseline inside the gates: 0
collisions, 0 clipped, 0 overflow, 0 page errors; minPx 7.8 at p1280 and 10.9
at p1920 on every row. `tanks` 26 labels, `pinbank` 23, `stack` 27.

### Left open

- Production reading 03 is unchanged (U16). Round seven is three candidates and
  no promotion; promotion re-checks U12's elastic-crop case, since the lab's
  crop is static.
- The picker now holds 29 directions across seven rounds. Grouping the list by
  round is lab chrome only and has not been done.

## Update 22 — round eight: the vessel rig, and a silhouette is a proper noun (2026-08-15, owner)

The owner kept `tanks` — the register was right — and gave it two notes.

### 1 · Make it as visual as the FIELD CARDS

Direction 6's whole argument was that **each pattern renders its own test**:
sine baselines for Voice, a threshold for Judgment, a lattice of present and
absent cases for Validation, reader nodes for Stakeholder, a repeating tiling
for Pattern. `tanks` had shrunk that to a faint texture inside a small fill
box, which threw away the one thing that made the substrate look like five
different materials rather than five different numbers. The field is the
CONTENTS now, clipped to the vessel's own outline at the field cards' weight.

### 2 · ⚠ THE SILHOUETTE MAY NOT BE THE WORK'S

> _"Skills are built on workflows, but they're different — that's why I can't
> have them be the same type of shape, like the square ones."_

**A chamfered rectangle on this surface IS A CARTRIDGE.** Reading 01 is twenty
of them; reading 02 seats one at its centre; ADR-069's flight carries one
between the two. A substrate drawn in that outline claims to be a workstream —
which is round four's rejection in a new place, and the general rule it implies
is worth stating once: **a silhouette on this console is a proper noun, not a
container.** Round eight's three outlines are straight-edged (no round shapes
but the brand marks) and not one is a rectangle: a **necked flask**, a
**waisted hexagon**, a **tapered vat**.

### ⚠ THE VESSEL IS FULL, AND ITS HEIGHT IS THE COUNT

`tanks` drew five equal vessels at different LEVELS, which reads as capacity —
a quantity this record does not publish. U21 named that and let it stand as a
shared gauge; sizing the vessel itself retires the question entirely **and**
hands the field the whole body to paint in, which is what note 1 asked for. One
store, wholly full, five sizes.

### ONE RIG, THREE OUTLINES

`vesselRig.tsx` is `FormCard`'s discipline one reading over: composition,
ledger, manifold, graduation and contents are identical across 30–32 and only
`vesselPath` changes, so the comparison is about the SHAPE and nothing else.
⚠ All three are still listed separately in every guard tuple — the tuple is
what makes a variant an entry, so a silhouette that grew its own strings later
would be walked rather than silently trusted.

### Caught after the first capture

⚠ **THE VESSEL'S WIDTH IS BOUGHT FROM THE LEDGER, and that is the trade.** The
first cut gave the stores 76 units across and the ledger 366 — enough for the
definition on one line, and far too little for a pattern's field to show any
character, which is the whole of note 1. A field card is ~120 wide for a
reason. Taking the ledger to 260 wraps every definition onto a second line and
buys 20 units per store; the field is the subject here and a wrapped sentence
costs the reading nothing.

### Verification

888 unit tests across 49 files (217 in the fit guard), lint and typecheck
clean. 12 stills across 3 variants × 2 themes × 2 presets: 0 collisions, 0
clipped, 0 overflow, 0 page errors; 30 labels each at minPx 7.8 (p1280) and
10.9 (p1920).

### Left open

- Production reading 03 is unchanged. Thirty-two directions now sit in the
  picker; promotion is still its own pass and re-checks U12's elastic crop.
- `vats` is in the set as the CONTROL — the plainest supply vessel, changing
  the least. If the neck and the hexagon both read as costume, it is what is
  left.

---

## Update 23 — reading 03 SHIPS: one plate divided, and the record learns to speak in sentences (2026-08-16, owner)

**Status: Accepted.** `33 · inlay` is production's reading 03. Thirty-two
directions across eight rounds preceded it; this is the first one promoted
since U16's pattern cards, and the picker's `shipped` baseline now mounts it.

### What the owner asked, in two notes

1. Against `22 · mosaic`: the composition is right, the surface is too thin —
   give it the texture of `8 · gallery` or `11 · cards`.
2. Against the result: make the copy **SUPER SIMPLE**. Keep the substrate's
   title, move it up, and put a paragraph under it that concisely explains what
   it means.

### The drawing

ONE PLATE, DIVIDED. The crop is partitioned with no gutters, area proportional
to the Skill count, one cut on the outer boundary alone — so Pattern's fourteen
occupies nearly three times Stakeholder's five and no numeral does that work.
Each region carries its name, its count, one sentence, and the pattern's own
physics field filling everything below. A graduation of one tick per encoded
Skill sits at each material's base, at one shared pitch across all five.

⚠ **A GUTTER IS A STATEMENT ABOUT HOW MANY THINGS THERE ARE.** Take the gutters
away and five rectangles stop being objects and become REGIONS of one surface,
which is the claim this reading makes: one intelligence layer, five recurring
shapes. That is why the partition is DERIVED (slice-and-dice over the mass
ranking — hardcoding "pattern and judgment go left" mis-draws silently the
moment a Skill moves between shapes) and why chamfering each region is banned.

### What it cost, named rather than buried

⚠ **THE 47 NAMED SKILL PLATES ARE GONE.** U16's stack lettered every Skill's
`short`; the graduation letters none of them — the ticks are countable, not
readable. The lettering total fell from ~71 strings to 20. Nothing is lost from
the RECORD (`SkillsBrowserPlate` renders all 47 by name one casefile row away)
and the drawing gains a sentence a reader can actually read. If the roster must
return it needs its own reading, not a corner of this one.

⚠ **`gloss` AND `evalMethod` LETTER NOWHERE ON THIS READING NOW.** `evalMethod`
is the field U19 added to the record one round earlier, so dropping it is a
deliberate reversal on this drawing and not an oversight — the round-six law
that every direction letters five facts is what the owner overruled, on the
grounds that five stacked fragments is not something anybody reads. Both fields
stay on the record and in the scan.

### `CaseMapShape.meaning` — the record learns prose

⚠ **IT COULD NOT HAVE BEEN `gloss` REPHRASED.** `gloss` is a definitional
FRAGMENT sized for a 148-unit module ("What good means under ambiguity"); it is
a label, and no rendering makes a label into an explanation. `meaning` is a new
field, ≤96 chars MEASURED (the narrowest region is 361u at fs 13 / .08 ≈ 40
characters a line, over three lines with the third reserved as a belt).

⚠ **IT IS THE ONLY FIELD THE PROJECTION DOES NOT UPPERCASE.** Every other
string on this console is chrome and shouts; this one is meant to be read, and
mono caps at 13 units is the least readable thing a paragraph can be.
`cases-registry` scans it — it is the map's only prose, so it is the one place
a sentence can casually name a team, a tool or a number while every
fragment-length field stays clean — and pins it distinct from its own gloss,
longer than it, and not uppercase.

### Two things that are arithmetic, not taste

⚠ **DENSITY IS PER UNIT AREA.** The particle painters emit a FIXED mark count
scaled by `k`; the lattice painters tile. At one shared `k` the largest field
(~123,000u) and the smallest (~15,000u) get the same 300 marks, so the SMALLEST
region reads as the densest material — the drawing would encode the count a
third time and do it backwards. `k` is the field's own area against a
reference, clamped at both ends.

⚠ **THE DIVISION IS A GROUT, AND THE INTERNAL HAIRLINES ARE DELETED.** The
owner could not tell where a block started; the rules were not faint, they were
SUB-PIXEL. A 1-unit rule paints 0.65 of a device pixel at this crop's meet and
the browser pays the rest in alpha — the same arithmetic that made U16's stack
spine and foot separator into bands. The regions paint on a rect inset by half
a 4-unit channel, so the PLATE shows between two materials. **A grout is not a
gutter**: a gutter is empty space between OBJECTS and is what makes five
regions read as five cards; a grout belongs to the plate. No rule goes back
inside the channel — a line in its own channel frames a card.

### ⚠ The promotion was a copy of the DRAWING and a RE-FIT of the BOX

The lab's crop is 932 × 762, aspect **0.8176**. The narrowest measured console
field is 1440×800 → 679 × 548, aspect **0.8071**. A static crop can afford that
four-thousandth overshoot; an elastic one cannot, because `fitExt` grows height
when the field is taller than the crop and this reading forbids width growth —
so at that one field the crop goes HEIGHT-bound and has no lever left. It cost
9px of dead panel and `pda-viewbox` caught it on the first run.

`BOX_H0` is **696** (crop 748), which clears the narrowest field with margin.
The 14 units come off the regions as material. **The ceiling on a width-bound
elastic crop is the narrowest field's aspect, not a round number** — that
generalises to any future reading built on `pdaFit` with `maxW: 0`.

The extension goes ENTIRELY to the regions, which is honest here where it would
not be elsewhere: reading 02 must split its extension because a taller module
with a fixed head is a module with a hole under it, and this plate has no hole
to make — every region's head is fixed and everything below it is MATERIAL,
which absorbs room without reading as air. The regions stay proportional, so
area-is-the-count survives at every height, and the thinnest region's material
— the tight case at rest — gains most.

### Verification

891 unit tests across 49 files, lint and typecheck clean. `pda-substrate-fit`
rewritten for the new geometry (16 cases): area-is-the-count at six field
shapes, every region keeps material, the graduation fits its region, the
regions tile with no painted overlap, the rest crop stays width-bound at the
narrowest field, and a per-region structural check that each letters a name, a
count and a paragraph with no sliced tail. `cases-registry` pins `meaning`.
Playwright: 21 services-ring smoke cases pass, including the light-theme
contrast walk and the casefile clipping sweep. Captured on the REAL landing at
1280×720 (meet 0.646, minPx 7.76, 0 clipped) and at the owner's 1920×1247
(field 850 × 927, crop 932 × 1016, meet 0.912, minPx 10.94, no dead panel).

### Left open

- **The lab's `--v` default is still round one's seven.** Four drawings shipped
  broken behind it (the `Field` pass-through hang, same day); making
  `capture-substrate-lab` default to the registry is the durable fix and is not
  done.
- **Light-theme material reads quieter than dark** — the fields are visible but
  fainter, which is ADR-063's alpha-inverts-across-the-flip. Tunable if the
  owner wants the light fields lifted.
- **The count numeral is kept** on each region's title line. Area and the
  graduation already carry the count; the numeral is the only exact figure. A
  one-line removal if it reads as saying it three times.

---

## Update 24 — the Skills come back, and the size difference gets three reads (2026-08-17, owner)

**Status: Accepted.** Reversal of U23's second half, one day later. The
composition, the partition, the paragraph and the elastic crop all stand; the
47 named Skill plates return and the tick graduation goes.

### The read

The owner's verdict on the shipped reading: 01 and 02 "feel super elegant",
03 "feels off". Five complaints, one cause — the Skills are missing, the size
difference between substrates does not read, the boxes are not "fully
optimized", the padding between boxes is too tight, the title sits too close to
the top.

⚠ **U23 MADE TWO CHANGES AND ONLY ONE OF THEM WAS RIGHT.** Replacing the card
row with a divided plate fixed the composition. Deleting the 47 named plates for
a tick graduation — on the argument that the roster ships one casefile row away
— did not. **The count survived that deletion; the DENSITY did not.** Readings
01 and 02 are a field of cartridges and a board of modules, both thick with
named parts. 03 became three strings over texture, which is exactly why it read
as a different machine standing next to them.

A tick is countable. A plate is countable AND readable, and it gives a region
something to be full of.

### What changed

- **Every encoded Skill is a named plate again**, in two columns inside its
  region: accent bar (green on the first encode, amber otherwise) + the record's
  authored `short`. Lettering goes 20 → 67 strings.
- **The graduation is deleted with their return.** Keeping both would encode the
  Skill count a third time in marks alone, beside a numeral that already states
  it. Its 26 units go to the body — which is what makes the lightest region's
  arithmetic close.
- **The count letters at the title's size** in gold. Size is now carried three
  ways, all derived from one number: the region's AREA is the gestalt, the plate
  run is the tally you can count, the numeral is the exact figure. Three reads
  of one fact is not saying it three times when that fact is the subject.
- **`GROUT` 4 → 10** and **the title's baseline 22 → 32**, both owner asks.
- **The bed spans the whole body** rather than owning a band under the copy.

### ⚠ The run is SEATED AT THE FLOOR, and the first cut was not

Top-anchoring the plates under the paragraph shipped in the first capture and
was wrong on sight: area is the count and the plate run is the count, but **the
head is a FIXED cost**, so the heaviest regions carried a band of bare field
beneath their plates (140 units under Pattern at rest) while the lightest was
packed. Top-anchored, that band reads as a hole. Seated at the floor it reads as
the material the plates settled out of, every region's plates land on one edge,
and the reading is EXTRACTION rather than a list that ran short. The band still
varies with region size, which is honest — more area is more of that substrate.

### ⚠ Two columns, and it is not a preference

Three columns fit the two wide regions and clip the three narrow ones: a
14-character `short` measures 114.2u and a third column leaves 117.1u before the
accent and its gap. A derived column count would therefore draw two different
objects on one plate. One number everywhere.

### ⚠ The lightest region is the binding case, by construction

Area IS the count, so the region with the fewest Skills is also the smallest —
while its head costs the same fixed 87 units as everyone else's. At rest
Stakeholder has **56.7 units of body against a 54-unit run: 2.7 to spare.** It
opens to 35.8 at 1920×1080 and 66.5 at the owner's own 1920×1247, so REST is the
case to guard.

⚠ **AND A THIRD PARAGRAPH LINE OVERFLOWS IT.** Every `meaning` wraps to two
lines today; a third costs 18 units of head and puts the run through the floor
— while every per-string assertion keeps passing, because each label still fits
its own column. `pda-substrate-fit` walks the ACTUAL wrap for exactly this.

### Verification

892 unit tests across 49 files, lint and typecheck clean. `pda-substrate-fit`
(17 cases) swaps U23's material and graduation assertions for: every region's
plate run fits its body at every field shape, every label fits its own column,
no two plates collide and the last column clears the wall, and every encoded
Skill is declared (47, and the per-region count matches its numeral).
Playwright: 21 services-ring smoke cases — the pairwise glyph-overlap walk now
carries 67 labels at 0.5u tolerance, and the light contrast walk holds because
the labels reuse `--pda-txt` on the plate's own opaque ground. Captured on the
REAL landing at 1280×720, at the owner's 1920×1247, and in light.

### ⚠ Addendum, same day — the plate is SQUARE, there is no outer cut

Owner: _"the blocks of substrate shouldn't have these notches, just normal
corners."_ The plate carried a TR+BL chamfer pair from U23. Two things were
wrong with it, and the second is the one a guard could have caught:

1. **It read as a defect rather than as a housing.** The regions tile the plate
   right up to its outer edge, so the cut landed INSIDE whichever two regions
   hold those corners — Validation top-right, Judgment bottom-left. Three blocks
   square and two notched is not a machined housing, it is an inconsistency, and
   the eye finds it before it finds the grammar.
2. ⚠ **IT TOOK AREA FROM EXACTLY TWO REGIONS, AND AREA IS THE COUNT.** Each
   26-unit chamfer removes 338u² from one region's painted face — 0.3 % of
   Validation. Small, but it fell on two named regions and on no others, which
   is the kind of quiet asymmetry the area claim exists to forbid:
   `substrateBlocks` computes full rects and the clip silently disagreed with
   them.

⚠ **AND ADR-065 ALREADY SAID SO: the children of a chamfered box are SQUARE.**
The console frame is the machined housing here (its own TL+BR override) and this
plate is its child. The cut was the exception all along, not the square corners.

The top rule also runs the full width now — it used to stop at `W − OUTER_CUT`
so it died into the diagonal, and against a square corner that leaves 26 units
of bare edge reading as a broken line.

### Left open

- **Fill fraction still varies across regions** (the head's fixed cost against a
  count-proportional area). Seating the run at the floor makes it read as
  material rather than as a hole, but the ratio itself is arithmetic and will
  not go away without breaking area-is-the-count.
- **The lab's `--v` default is still round one's seven** — unchanged from U23,
  and still the durable fix for the class of defect that hid four broken
  drawings.

## Update 25 — the reading answered the CLICK it arrived from (2026-08-17, owner)

⚠ **U24 KEPT THE ROSTER BUT THREW AWAY THE CLICK'S CONTEXT, AND THAT WAS THE
FAULT ALL ALONG.** Every substrate iteration from round one through the U24
addendum drew the substrate ALONE — as a taxonomy of the estate — and every one
was measured against its own crop. The owner's read on 2026-08-17 was that
readings 01 and 02 already share the selected work at their own scales, and 03
threw it away: _"when you click on a work it becomes a configuration; when you
click configuration you go to substrate, but the substrate feels completely
random."_ Eight rounds and thirty-two directions kept trying to fix a proportion
problem that was never the problem. **The record itself had carried the join the
whole time (`PdaWork.taps` — which of the five shapes each stream draws on), and
the site's own brief promised the drawing out loud (_"below grade runs the
shared substrate — encoded once for one team, tapped by the next"_).**

⚠ **PROMOTION: `34 · SECTION` REPLACES `33 · INLAY`.** Three round-nine
directions were captured against the shipped inlay; SECTION won.

### The drawing

- **Estate band** across the top (~30u tall): the twenty shown streams as
  ghost cartridge FOOTPRINTS. Silhouettes only at rest — labels at 40u wide
  land under 5px, which is the "utterly illegible" ADR-070 U10 already ruled
  on. Cluster commas (2u) between team codes; person-led footprints draw a
  DASHED outline.
- **Gallery band** (~20u tall): five diamond lane markers, one per shape,
  positioned so a conductor from any footprint to any stratum never crosses
  another conductor from another footprint to another stratum. `GALLERY_LANES`
  and `SECTION_ORDER` are literally the same array, asserted by
  `pda-substrate-fit`.
- **Riser shaft** (44u wide, left rail): five vertical lanes descending the
  full strata height, with horizontal STUBS into every stratum. At rest the
  shaft is skeleton — five lanes + five stubs, structural alpha.
- **Five strata**, lightest at top (Stakeholder 5) → heaviest at floor
  (Pattern 14). Each stratum's HEAD is `name (fs 20) · count · meaning
(fs 13, 2 lines)`, beside each other; its BODY is a physics field with the
  47 named plates seated at the stratum's own floor in 5 columns × 20u
  pitch.

⚠ **THE 47 PLATES SURVIVE VERBATIM.** Same `short` labels, same green flagship
accent, same extraction seating. Re-flowed from U24's two columns to five
columns to fit the wider strata (826u vs U24's split of ~410u per column).

### The proportional claim moved from AREA to BODY

⚠ **U24 SAID AREA IS THE COUNT; SECTION SAYS BODY IS THE COUNT.** Heads are
FIXED CHROME (a fs 20 name with a two-line fs 13 paragraph beside it — the head
CANNOT shrink proportionally without putting the paragraph under the smoke's
own floor), so `bodyPerSkill = (strataH − 5 × headH) / totalSkills` is the
shared unit. `pda-substrate-fit` walks it and every stratum lands on the same
unit within 1 %. This is a refinement of U24's arithmetic, not a retreat: the
same _"one shape divided by count"_ argument, one level down. Every ext still
goes to bodies; the ratio holds at every field shape.

### The selection lights one path, and only one

At REST the drawing letters and lights the same estate for every reader —
subject is still the layer (U17's clause holds). On SELECTION:

- The footprint above wears the CARTRIDGE'S OWN lit-edge grammar — TR+BL
  diagonals, the same signal reading 01's card carries when its record is
  open.
- A gold conductor drops from the footprint into the gallery, jogs to each
  tapped shape's lane, drops into the shaft, and STUBS into the tapped
  stratum with a small diamond mark. `PdaWork.taps` decides which strata
  light — the projection reading 02 already draws as tap bars, one level
  down.
- Every tapped stratum's TOP RULE lights gold.

⚠ **CONFIGURED STREAMS EMIT `taps.length` CONDUCTORS. PERSON-LED EMIT ZERO.**
The record has nothing to point at for person-led work, and drawing a stub
into every stratum would say the person's stream draws on all five — the
opposite of what the empty configuration means. `sectionConductorCount` is
pure and the fit test walks it.

### ADR-069's persistent object has THREE homes now

**The whole flight machinery accepted this without any change to `pdaFlight`
itself.** `PdaConsole.entryFor` was factored into a small `rectFor` helper that
returns the source or destination rect for any reading; the flight computes
between any two homes. Reading 03's home is `estateFootprint`, which walks the
same `estateSlots` arithmetic the drawing paints — one derivation, so the
flight lands on a real footprint rather than an interpolated one.

⚠ **`entryFor` GOT SIMPLER, NOT MORE COMPLEX.** The old code hard-coded 01↔02
as the only flying pair (`(from === 1 && to === 2) || (from === 2 && to === 1)`)
and handled 03→01 as a bloom. The new code walks every pair through `rectFor`;
`bloom` remains the graceful fallback when a source rect is unavailable.

### What the LAB kept

- **`34 · Section` and `36 · Control` are RETIRED.** SECTION lives in
  `PdaSubstrate.tsx` now, and mounting a second copy in the lab would be two
  copies of a measured drawing — the same trap ADR-070 U15 introduced the
  lab's shipped-mounts-production rule to prevent. CONTROL's thesis was "the
  shipped U24 partition with an estate band above" and cannot answer its own
  question once U24 is not shipped.
- **`35 · Manifold` survives** — the losing round-nine alternative, kept so
  the register trade stays reviewable. It regresses U24's density verdict
  (the vessels cannot seat 47 legible plates), which is exactly why it lost.

### Verification

- **916 unit tests across 49 files** — up from 892. `pda-substrate-fit`
  rewritten (24 cases) to walk the new geometry: body-proportional-to-count
  at five field shapes, plates fit their stratum's body, plate columns fit
  the stratum's width, shaft lanes inside the shaft, gallery and shaft share
  the section order, every configured stream has a lookup-able footprint, the
  paragraph never wants a line past its cap, `plateAt` returns crop-space
  coordinates (the round-nine capture's first defect).
- **`pda-flight` gained 12 tests** for the third home — 1↔3 and 2↔3 round
  trips at 1280×720 and the owner's own tall viewport, plus the footprint
  aspect parity (<5 % against the cartridge) and the null-fallback
  guarantees.
- **Capture gates**: 8 samples (shipped + manifold × dark/light × p1280/p1920),
  0 collisions on the promoted drawing, 0 clipping, minPx 7.8/10.9. Both
  themes verified.

### ⚠ What could not be verified in code, and stays owner-verdict

- **The reading's REGISTER against 01 and 02.** The whole promotion argument
  is that reading 03 now shares the click's context with the two above it,
  and that only reads on the real landing with a real click. Test coverage
  of the flight's arithmetic and the geometry's proportionality is complete;
  the "does this read as the same instrument" question is not.
- **The shaft's five-lane grammar at a taller field.** The strata bodies
  grow with the field, so at 1920×1247 the shaft is much taller and the
  stubs move further apart. `pda-substrate-fit` walks the arithmetic at
  five ext values, but "still reads as one instrument" is not measurable.

### Left open

- **Fill fraction still varies** across strata, exactly as U24's did — the
  same head-cost-against-count-proportional-body arithmetic. The plate stack
  seats at the stratum floor for the same reason: material rather than a
  hole.
- **The bed is drawn ONCE per stratum** (a `FormField` inside a clip). At
  rest each body's bed paints ~65% opacity; on a selected TAP the tapped
  stratum's bed lifts to 85 %. That is the ONLY visual state added by the
  selection — every other change is chrome. Whether the reader can find the
  bed's shift is TBD (owner: 2026-08-17); if not, the bed's rest opacity is
  the lever.

## Update 26 — proposed, not promoted: the Skills ARE the figure (2026-08-17, owner)

Owner, reviewing the lab's `21 · Wheel`: _"I want something like a pie chart,
but we don't really do round shapes — maybe a pie chart with straighter edges,
like a dodecahedron, but flat 2D. It should be made out of those Skills."_

⚠ **THIS IS A LAB CANDIDATE, NOT THE LIVE READING.** U25's SECTION remains
production while `37 · Skill facet` is reviewed at
`/test/intelligence-substrate-lab?v=skill-facet`.

### The object

- One flat **dodecagonal annulus** — twelve straight outer edges, twelve
  straight inner edges, no curve anywhere.
- Exactly **47 interactive shards**, one per `CaseSkillEntry`. Five contiguous
  runs are Pattern 14 · Judgment 12 · Validation 9 · Voice 7 · Stakeholder 5.
- After five equal 2° group clearances are removed, every Skill owns one equal
  angular step. A group's angular sweep is therefore exactly its Skill count.
- **Second owner correction:** the five shape names and counts sit INSIDE their
  own shard runs. The external leaders, callouts and all five `meaning`
  paragraphs are deleted — the object explains the proportion; prose only
  competes with it. Hover/focus on any shard turns the central dodecagonal hub
  into that Skill's `short`, substrate, team and status.
- The five flagship Skills mark only their outer chords in green — provenance,
  never navigation. Gold remains the active shard / active callout.

### Why 26 · Facet did not already answer this

`26 · Facet` solved the circle problem and kept the labels inside five large
wedges, but reduced the Skills themselves to rim ticks. The owner's correction
reverses that payload: **five compact internal marks are the annotation; 47
shards are the object.** The chart is no longer an empty figure with Skills
arranged around it.

### Named trade

The outer dodecagon modulates radial depth by `1 − cos(15°) = 3.41%` against a
circle. That is the explicit price of rejecting the round perimeter. Count
remains exact as one equal angular step per Skill; the reader can count shards,
and the guard asserts both per-group shard count and per-Skill angular unit.

### Verification

- 928 unit tests across 49 files. `substrate-lab-fit` now has 234 cases,
  including: exactly one shard per Skill, five contiguous groups in authored
  order, angular sweep proportional to count, twelve-sided perimeter (not a
  many-sided circle), 2–4% rim modulation, five unique flagship shards.
- Browser fit readout at p1280 in dark and light: 0 collisions, 0 clipping,
  0 overflow, minPx 7.76. At p1920 dark: minPx 10.94.
- Hover/focus verified against `Variance`: the hub resolves `Variance ·
PATTERN · Finance & Accounting · In use`.

### Left open — owner verdict

- Whether all 47 shards read as **Skills** without labels at rest. The
  accessibility names and central readout make every Skill recoverable, but
  the at-rest object deliberately prioritises the whole over 47 simultaneous
  names — lettering those names inside ~31u outer chords would land far below
  the established type floor.
- Whether the dodecagonal annulus replaces SECTION or becomes a fourth reading.
  No production decision is encoded until the lab candidate is accepted.

## Update 27 — proposed: the five parts are NOT each other's copy (2026-08-17, owner)

Owner's third note on the round-ten candidate: 37's dodecagonal annulus reads
right and its labels belong INSIDE — _"I don't think we need the labels outside.
I think we can add pattern, stakeholder, etc. inside the specific parts of that
pile. I don't think we need such long paragraph text either."_ — but the five
parts still want to be **shaped** differently, and the centre should explain what
the substrate IS rather than count it.

⚠ **THIS IS A LAB CANDIDATE, NOT THE LIVE READING.** U25's SECTION remains
production. `38 · Compound carrier` is reviewed at
`/test/intelligence-substrate-lab?v=carrier`, beside U26's `37 · Skill facet`.

### ⚠ WHY 37 COULD NOT DELIVER DIFFERENTIATION, AND THE PROOF IS ARITHMETIC

**SWEEP ∝ COUNT MAKES THE FIVE PARTS GEOMETRICALLY SIMILAR, AND NO ARRANGEMENT
OF EQUAL-AREA CELLS INSIDE THEM ESCAPES IT.** A cell's angular width is
`(sweep / cellsInCourse) × r̄`, and **both** terms are proportional to the
group's Skill count — so the count CANCELS and every part comes out a scaled
copy of every other. That is why 37's forty-seven shards read as one texture
wrapped round a ring: the arithmetic guarantees it, and no amount of tuning
inside that frame was ever going to produce five distinguishable parts.

Differentiation therefore cannot come from the count. It comes from the two
things the count does not reach:

1. **MATERIAL.** Each part is drawn over its own physics field — the field-card
   painters (`substrateForms`), the same five materials production's regions
   carry. Voice's baselines, Judgment's threshold, Validation's lattice.
2. **GRAIN — the COURSE LADDER.** A shape in double figures is laid in THREE
   courses, a shape under ten in TWO (`carrierCourses`). Cell AREA is untouched
   by that, so the ladder buys aspect and nothing else: Pattern's cells run wide
   and shallow, Stakeholder's tall and narrow. **Mass reads twice** — once as the
   part's sweep, once as how finely it is coursed — and the remainder rides
   OUTWARD, so a part whose count does not divide by its courses shows the odd
   cell out in the longest arc it has.

### The arithmetic that makes the equal-area claim honest

⚠ **ALL FORTY-SEVEN CELLS HAVE THE SAME AREA, AND IT FALLS OUT RATHER THAN
BEING TUNED.** The region between two concentric similar polygons over an
angular span is exactly `(r1² − r0²) × A₁(span)` — the polygon ring at
circumradius `r` is a uniform scaling of the one at 1 — so setting each course
boundary to `√(R_IN² + (cum/n)(R_OUT² − R_IN²))` gives every course an area
share equal to its cell share. The only residue is the dodecagon's own rim
modulation, `1 − cos(15°) = 3.41 %`. One cell IS one encoded Skill, at one size,
everywhere on the plate. A boundary hand-moved "to fit a nameplate" blows
straight through the guard.

### ⚠ A HORIZONTAL LABEL IN A RADIAL BAND ONLY FITS WHERE THE BAND RUNS HORIZONTALLY

The first cut put the five names in an engraved RIM BAND. That works at the top
and the floor of the plate and fails completely at the sides: Stakeholder's wedge
points LEFT, so its long direction is vertical while its radial depth is 70
units, and `STAKEHOLDER` needs 93. **The rim band is not badly tuned, it is
arithmetically impossible.**

The fix is that each plate sits on its part's MID-RAY at a shared `R_LAB`, and
`R_LAB` is **derived, not picked** — it is the only radius that clears both ends
at once. Both bounds move with the plate's own projected half-extents
(`κR_IN + pr` from the inside, `κR_OUT − pr` from the rim), so their midpoint is
`κ(R_IN + R_OUT) / 2` **for every orientation**. `carrierPlateFits` exports the
three clearances per part and the guard asserts all fifteen are positive — a
plate that grew a character fails before a capture.

⚠ **THE PROJECTION IS ONTO THE WALL'S NORMAL, NOT THE MID-RAY'S.** The two
differ by the half-sweep, and for Stakeholder — the narrowest part, whose plate
is nearly as wide as its wedge is deep — that difference is 32 units of the 23
that are actually spare.

### The core is a SQUARE, and it explains rather than counts

ADR-065: the children of a machined housing are square. The carrier is the
housing, so its one seated child is a square socket — no second corner grammar
to defend. At rest it letters the mechanism in the surface's own words
(`ENCODED FOR ONE TEAM` / `DRAWN ON BY THE NEXT`, which is `intelligence-architect`'s
own ratchet); on hover or on a pinned selection it becomes the identity of one of
the forty-seven. **Nothing else on the plate letters a Skill:** at ~5 300 square
units a cell is chunky enough to count and far too small to name.

⚠ The core's clearance is measured on the CORNER RAYS, not the apothem. A
square's corners point at ±45° and ±135°, which on this rotation are four of the
dodecagon's VERTICES — so the apothem understates the room by 6 %, and a
conservative version of that test fails a core that is comfortably seated.

### ⚠ A CHORD IS NOT AN EDGE ONCE A PART SPANS MORE THAN ONE OF THEM

Pattern sweeps 103.66°, which is three and a half of the dodecagon's twelve
edges; closing that with a single chord cuts 44 units inside the rim and takes
the part's area with it. 37 could ignore this because a 7.4° shard never contains
more than one vertex. `ringArc` emits every vertex inside the span.

### ⚠ THREE VISIBILITY DEFECTS, ONE ROOT: AN ALPHA AUTHORED AGAINST THE WRONG THING

All three passed every arithmetic guard, and all three are ADR-070 U11's law and
ADR-058's law arriving at the same place from different directions.

1. **The cells were spending a CHROME token on the FIGURE.** They took
   `--pda-hair` (gold .13) and then `--pda-hair2` (.24), and on the dark side the
   plate read as five empty regions while the same markup was perfectly
   countable on parchment. `pda.css`'s own token ladder says which rung a line
   that CARRIES THE DRAWING takes — `--pda-dim` (.42), which re-derives per
   theme — leaving `--pda-amb` (.78) at width 2 for the five structural seams so
   the step stays legible. At this meet a 1-unit line paints 0.65 device px and
   the browser takes another cut in alpha, which is why the shortfall compounded.
2. ⚠ **A CLIPPED FIELD LOSES ITS DENSITY, AND THE PAINTERS COUNT IN ABSOLUTES.**
   `substrateForms` paints `260·k` marks into a `w × h` BOX — its own head says
   the counts are absolute, not per-area — but a part is a WEDGE inside that box,
   so every mark outside the wedge is clipped away and the field arrives thinned
   by exactly the fraction the wedge does not cover. On this plate a part fills
   30–72 % of its own bounding box, **so the differentiation was being drawn and
   then thrown away by the clip.** `carrierFieldK` is the reciprocal coverage,
   capped at 3; the guard asserts every part is compensated AND that a wider
   wedge is compensated LESS, because a coverage term read upside down would
   still be a number greater than one.
3. **The lit cell was raw v18 gold.** `rgba(240, 200, 106, .22)` over parchment
   (228,218,201) is a four-value shift, so the hover was legible on the dark side
   and effectively unlit on the light one. It is `--gold-rgb` at .28 now; the
   resting wash was already `--dawn-rgb`, which inverts cream → ink across the
   flip for exactly this reason.

⚠ **AND THE INNER RING IS A CELL FLOOR, NOT A WALL.** The first cut filled the
polygon at `R_IN` with void and clipped each material to the cell band, which
left a dead collar between the socket and the cells — and a dead ring at the
centre of a figure reads as a mistake in the figure. The materials clip from
`R_MAT_IN` (54) so they run UNDER the socket, and the five seams start at the
socket's own wall, so the division reads as running through the material the
socket is seated on.

### Named trades

- **The dodecagon's 3.41 % rim modulation** against a circle — the explicit
  price of rejecting the round perimeter, carried over from U26.
- **Horizontal gutters.** `R_OUT` is 356 because HEIGHT is the binding dimension:
  a flat-top dodecagon's half-height is its apothem, and `κ·356 = 343.9` puts the
  rim 11 units inside the crop's 26-unit pad. The gutters that leaves are the
  price of a regular polygon in a landscape box, not slack that could have been
  spent.
- **The course ladder is AUTHORED**, and the file says why it has to be: the
  count cancels out of every cell-shape derivation, so a rule that reads the
  count is the only lever left on grain. It costs nothing in truth, because the
  boundaries are solved for area either way.
- **Stakeholder's nameplate obscures a real fraction of its own five cells.** The
  guard proves the plate is inside its part; it does not and cannot prove the
  part still reads as five.

### Verification

- **`substrate-lab-fit` at 251 cases** (up from 234), of which eleven walk the
  carrier: one cell per Skill in a WALKABLE order (contiguous per part, left to
  right within a course, climbing outward between them — not globally monotone
  in angle, which is what a first draft of that assertion wrongly demanded),
  five contiguous parts in authored order, sweep ∝ count, equal cell area inside
  the rim's own modulation, the course ladder and its outward remainder, fifteen
  nameplate clearances, `R_LAB`'s derivation, the square core's corner clearance,
  five flagships each in an outermost course, the clip's density payback, and 47
  unique screen-reader names.
- ⚠ **THE TWO RADII ARE PINNED FROM BOTH ENDS.** ADR-065 U5's lesson one level
  down: a guard that only checks a RELATIONSHIP passes when both sides move
  together, so `R_IN`/`R_OUT` are nailed to literals in one place and derived
  everywhere else. Three assertions had hard-coded the old 344 and failed loudly
  when the rim moved to 356 — which is the guard working, but they were re-pointed
  at the exported constants rather than re-typed.
- **Capture gates**: 4 samples (carrier × dark/light × p1280/p1920) — 0
  collisions, 0 clipping, 0 overflow, minPx 7.8 at p1280 and 10.9 at p1920, no
  page errors. Both themes verified for the resting plate AND for a lit cell.
- **Hover-to-socket correspondence probed on seven cells, one per part**:
  hovering cell _i_ letters cell _i_. ⚠ **DO NOT AIM A POINTER AT A WEDGE'S
  BOUNDING BOX** — a radial wedge's box centre is not reliably inside it and
  whatever paints later at that point takes the hover, which produced a still of
  Voice lit beside a printed Pattern label. The probe dispatches on the element.

### Left open — owner verdict

- **Whether five materials at texture alpha read as five materials.** The
  coverage payback is arithmetic; "can you tell Judgment from Validation at a
  glance" is not, and on the dark side the fields are much quieter than on
  parchment. The lever is the field group's own opacity, not the painters.
- **Whether the grain difference lands.** Pattern at three courses of 4/5/5
  against Stakeholder at two of 2/3 is a real aspect difference in the
  arithmetic; whether the eye reads it as _mass_ rather than as _inconsistency_
  is the whole differentiation claim and only the owner can settle it.
- **Whether this replaces SECTION, replaces 37, or joins neither.** No
  production decision is encoded. Reading 03's persistent-object home
  (`estateFootprint`, U25) is untouched, so promoting this drawing would require
  the flight's third home to be re-pointed at a cell.

---

## Update 28 — the centre is an APERTURE, and hover names while click commits (2026-08-18, owner)

Owner's read of U27's carrier: the drawing holds, the middle does not. Four
instructions, and each one removes something —

> _"the middle panel, I don't think it should be like a square. I don't know what
> it should be, to just give a brief explanation, just one text. Don't talk about
> 47 encoded skills… I like the tags over it, but remove the fucking number… when
> you hover over a specific part of the pie, the skill name should be then
> visible, and if you click on it then the text at the center changes."_

⚠ **STILL A LAB CANDIDATE.** U25's SECTION remains production, untouched.

### ⚠ THE ANSWER TO "WHAT SHAPE SHOULD IT BE" IS THAT IT IS NOT A SHAPE

U27 seated a square socket at the centre on ADR-065's children-of-a-machined-
housing clause. That law is right for a CHILD; the mistake was never asking
whether the centre had to be one. **The plate already has a twelve-sided hole in
it** — the inner ring is where the cells stop, and it is drawn whether or not
anything sits inside. So the square was a second outline inside the first, a
second corner grammar to defend, and a dead collar between the two, which U27
then had to paper over by running the material under the socket (`R_MAT_IN` 54).

`R_APERTURE = R_IN` and the socket is gone. The brief letters straight onto the
void the cells leave, bounded by the ring the drawing already carries. ⚠ The
`Aperture` component draws **NO rect, no bracket, no backing wash** — anything
added there is the square returning under another name. `R_MAT_IN` is deleted
with it: with no collar to fill, the material clips at `R_IN` and `matBox`
collapses back into `bbox`, one box instead of two.

**The aperture is also the wider box.** Its usable half-width is the inner
ring's own apothem, `κ·164 = 158.4`, against the socket's 108 — which is why a
four-line paragraph fits here at fs 14 when a count-plus-caption barely did.

### The copy is the surface's own, with the drawing's word removed

> The judgment this work keeps reusing — encoded once by the team that needed
> it, then drawn on by every team after.

The casefile brief already publishes _"below grade runs the shared substrate —
encoded once for one team, tapped by the next"_ and the city's sheet 03 subtitle
is _"what every district drops into"_. This is that claim with the spatial
framing dropped, because "below grade" is the SECTION drawing's word and there
is no grade on a plate. Sentence case, like `CaseMapShape.meaning` and for the
same reason — it is the one thing on this drawing meant to be READ.

⚠ **`wrapLines` TRUNCATES AT ITS CAP** (`out.slice(0, max)`), so a cap set to
the line count today's copy happens to need drops a word silently the moment the
copy grows. `BRIEF_MAX` is 6 against a wrap of 4 and `carrierBriefFits().whole`
asserts the wrap gave back every word.

⚠ **THE APERTURE'S HALF-WIDTH IS NOT CONSTANT DOWN THE BLOCK.** Inside
`|y| ≤ R_IN·sin 15° = 42.4` the wall is the vertical edge at `κR_IN`; past that
it chamfers in. A paragraph measured on the apothem alone passes at four lines
and clips at six, so `carrierBriefFits` checks the block's **outermost corner**,
not its middle. Measured: widest line 269.1 of 276, corner clearance 44.5.

### The count came off the nameplates, and nothing replaced it

`PLATE_H` 42 → 26; the plate is one line. **This drawing now prints no digit
anywhere, at rest or lit.** The proportional claim does not need one and never
did: a part's AREA _is_ its count and its cells are individually countable, so
"14" beside a region built out of fourteen cells was the surface saying the same
thing twice — exactly ADR-068's no-ordinal objection, one level down.

### ⚠ HOVER NAMES, CLICK COMMITS — AND U27 HAD COLLAPSED THEM

U27 drove the centre off `hot ?? pinned`, **which made the click a no-op in
every case a reader could see**: whatever the click was going to show, the hover
had already shown. The states are split and drive different things —

|          | drives                                             |
| -------- | -------------------------------------------------- |
| `hot`    | the lit cell, the part dimming, and the `HoverTag` |
| `pinned` | the aperture, and a persistent lit cell            |

so the pointer answers _what is this one_ without disturbing the reading, and
the click is what changes what the drawing SAYS. Escape and a second click
release.

⚠ **A TAG ON ITS CELL'S OWN CENTROID FALLS OFF THE RIM** — the outer course
reaches 356 and the tag's half-diagonal is 67. The tag rides its cell's ray with
the radius clamped into the band where the whole box fits.

⚠ **AND THE OUTER CLAMP IS PER EDGE, NOT ALONG THE TAG'S OWN RAY.** Backing the
half-diagonal off `polygonRayRadius(angle)` looks right and is not: that is the
wall on the ray through the tag's CENTRE, and a corner sits at a different angle
where the wall can be nearer. **It failed by 0.1 units** — precisely the miss a
ray-only check exists to let through. A box is inside a convex polygon iff it
clears every edge, which for an axis-aligned box is one linear test per edge:
`r·(n·u) ≤ κR − |nₓ|·hw − |n_y|·hh`, tightest of the twelve. The inner clamp
stays crude on purpose (`R_IN + halfDiag`) — the aperture is inside its own
circumcircle, so that is sufficient without being wasteful.

### ⚠ A GUARD BUILT ON THE WRONG INTUITION, AND THE ARITHMETIC CORRECTED IT

U27's density guard asserted an ORDERING: a wider wedge fills more of its own
bounding box, so it needs less paying back. **That is true of a pie slice and
false of an annular one** — widening the sweep grows the box around the
aperture's HOLE faster than it grows the part, so coverage FALLS with sweep.
With `R_MAT_IN` deleted the assertion inverted and failed. Pattern's 104° is the
_most_ compensated (1.72), not the least.

The replacement does not re-derive the sector area the way `carrierLayout` does,
because that asserts arithmetic equals itself. It **samples each part's bounding
box on a 200 × 200 grid and counts what falls inside the wedge**, so a wrong
radius or a dropped term in the layout surfaces here. Coverage measures 58–67 %.

### ⚠ THE CAPTURE GATE CAUGHT THE QUIET, AND WAS DECLARED RATHER THAN LOWERED

The resting drawing letters **9** strings where it lettered 19, which tripped
`texts <= 10` — a floor written to catch a drawing whose record failed to load
and which paints a handsome empty frame past every other gate. Lowering it to
admit the carrier would blind it for the other thirty-odd variants, so the
exception is declared in a `QUIET` map **as an EXACT PIN, not a lower floor**:
nine is what the composition allows, so a tenth string is as much a regression
as a ninth going missing — and adding is the direction a count actually rots in.

### Verification

- `substrate-lab-fit`: 254 pass; full suite 948 pass. New: the brief's fit and
  its no-figure envelope, the resting drawing's total absence of digits, the tag
  clamp walked over all 47 cells at four corners each, the hover/click slot
  split, and the sampled coverage cross-check.
- **Capture gates pass** — 0 collisions, 0 clipping, 0 overflow, minPx **8.1** at
  p1280 and **11.4** at p1920 (the shipped baseline's 7.8 / 10.9).
- Rest, hover and pinned captured in **both** themes.
- ⚠ **React derives `onMouseLeave` from a delegated `mouseout`**, so the capture
  script's synthetic `mouseleave` never reached the handler and the first pinned
  still carried a stale tag from the hover before it. A capture artifact, not a
  product defect — but it is the second time this session that dispatching at an
  SVG cell has needed the real event name rather than the intuitive one.

### Left open — owner verdict

- **Whether the aperture wants anything else in it.** At rest it is one
  paragraph in a large void, which is quiet by construction; whether it reads as
  composed or as empty is the owner's call and no arithmetic settles it.
  → **ANSWERED BY U29: it was empty.**
- **Whether a pinned reader can tell they can release.** Escape and a second
  click both work and neither is advertised. An affordance is chrome, and the
  instruction was _one text_ — so nothing was added.
- The three U27 questions (materials, grain, and whether this replaces SECTION)
  all stand unchanged.

## Update 29 — the aperture is a SCREEN, and the wrap is a BAND (2026-08-18, owner)

⚠ **U28'S OWN OPEN QUESTION CAME BACK ANSWERED**: _"at the center the text
floating in there feels a bit off… just the text without a frame, I don't like
it, but I don't want to have a rectangle thing in there either, so let's find an
elegant way of wrapping."_

Both halves of that are right, and together they rule out the two obvious
answers. **A paragraph alone in a void has nothing holding it** — U28 deleted the
square housing and put nothing in its place, which fixed the box and left the
text unseated. **And a frame around it is the square coming back** under another
name; corner brackets, a chamfered plate and a hairline outline are all the same
object with different amounts of it drawn.

What the reference vocabulary does instead — the retro-futuristic terminal this
console already speaks everywhere else — is give text a **SURFACE rather than a
border**. So the aperture stops being a hole and becomes a screen:

| piece          | what it is                                                         |
| -------------- | ------------------------------------------------------------------ |
| the band       | a lit strip across the aperture at `±WELL_DY` (62), one 3.5 % wash |
| the raster     | scanlines at `SCAN_PITCH` 5 inside the band                        |
| head and foot  | two rules at the band's edges, run **wall to wall**                |
| left and right | **not drawn.** They are the dodecagon                              |

⚠ **THAT LAST ROW IS THE WHOLE TRICK.** The readout is closed on four sides and
only two of them are lines, so it cannot become the rectangle it replaced. The
sides are the plate's own opening, which also means the wrap belongs to THIS
object rather than being a shape that would look the same anywhere.

### ⚠ THE FIRST CUT RASTERED THE WHOLE APERTURE, AND IT FAILED TWICE

The obvious build — scanline the entire opening, step a counterbore hairline
inside the wall, fence the text with two short rules — was drawn and rejected on
the capture:

- **A screen the full size of the hole is just a lighter hole.** The eye reads a
  flat grey field, not a display. The text was on a surface and still looked
  unplaced, because nothing distinguished the reader's line from the 200 units
  of empty screen around it.
- **The fence was invisible.** `--pda-hair` (.13) for the bore step and
  `--pda-hair2` (.24) for the rules both vanished. A 1-unit line paints ~0.65
  device px here and the browser pays the rest in alpha — the same arithmetic
  that killed R4's bed at U11 — so a hairline that measures fine on the 1:1
  canvas arrives at nothing.

Lighting **only the reader's own band** fixes both at once: the strip has an
inside and an outside, the rules have a job (they are the band's edge, not
decoration around text), and at `--pda-dim` (.42) — the rung the cell lines one
ring out already use — they arrive. **A fence nobody can see is not a subtle
fence, it is an absent one**, which is U9's finding about labels applying to
rules.

### ⚠ THE RASTER IS MEASURED TO THE WALL, NOT CLIPPED TO IT

Each scanline is drawn to the length the twelve-sided wall allows **at its own
height**, so the screen's edge IS the aperture's edge. A `clipPath` produces the
same picture with a shape that does not know why it stops there — and it would
have hidden the error the helper exists to prevent:

⚠ **`polygonRayRadius` CANNOT ANSWER THIS QUESTION.** It measures along a RAY
from the centre and a scanline is a **CHORD**; the two coincide only at `dy = 0`.
Reaching for the ray radius gives rows short of the wall by up to 6 % — a screen
with a soft, rounded-looking edge inside a hard twelve-sided one, which reads as
a rendering artefact rather than as a wrong function. `apertureHalfWidth(dy, R)`
solves each edge's half-plane for `x` at fixed `y` and takes the tightest. This
is the **third** time in two updates that a ray measurement has been reached for
where a different geometry was needed (U28's tag clamp was the second), and the
guard walks 51 rows against the polygon boundary at each row's own corner angle.

⚠ And the band's outline is **CLIPPED, NOT ENUMERATED** — it crosses four of the
dodecagon's vertices, and a shape drawn from the two chords alone cuts those
corners off and sits visibly inside the wall it is supposed to be closed by.
Sutherland–Hodgman against two half-planes survives a change to `WELL_DY` or the
radius, which hand-listing today's four vertices would not.

### ⚠ THE BAND IS FIXED FURNITURE AND THE CONTENT FINDS THE MIDDLE OF IT

The well does not resize per state — an aperture that breathed on every click
would read as the drawing being unsure of its own dimensions. Which puts the
burden on the content, and **the clicked block is not one height**: it grows 20
units for a flagship mark and 17 for each meta line the wrap adds. U28's hard
baselines were centred for exactly one Skill and low for the rest. Both readouts
measure cap-to-descender and halve now.

⚠ Two arithmetic traps paid for on the way:

- **Baseline-centred text sits high.** A line's ink is mostly ABOVE its
  baseline, so centring the BASELINES on `CY` centres the wrong thing. The brief
  carries a 3-unit `BRIEF_DROP` cap-height correction.
- **The binding measure is the band's NARROWEST point, not the aperture's
  widest.** The text sits in the straight-walled middle at 158 across; the rules
  that fence it sit out at ±62 where the chamfer has taken the chord to 147.
  Nothing clips when a line exceeds the rule above it — **it just reads as text
  escaping its own readout**, which no width-against-the-wall test would catch.
  The measure went 276 → 248 (fs 14 → 13, line height 21 → 19) to leave the
  rules 30 units proud on each side.

### ⚠ THE CARET IS A SHAPE, AND THAT IS WHY IT COULD BE ADDED AT ALL

U28's `QUIET` pin says the resting drawing letters **exactly nine** strings, and
a tenth is as much a regression as a ninth going missing. The one piece of
terminal vocabulary that unmistakably signs the object — the block cursor after
the last character — is a `rect`, so it costs no label and the pin holds
untouched. It draws on the brief only; a caret after a Skill's status would be
claiming the readout is live.

### Verification

- `substrate-lab-fit`: **256 pass**. New: the raster measured as chords against
  the polygon at 51 rows; the rules standing PROUD of the line they fence (a
  width-fits test passes while this fails); and the clicked block walked across
  all 47 Skills for both the band's rules and its chord, since the worst case is
  whichever Skill happens to be both flagship and long-named.
- Capture gates pass — 28 samples, 0 collisions / clipping / overflow, minPx
  **8.1** at p1280 and **11.4** at p1920, `QUIET` pin still 9.
- Rest, hover and pinned captured in **both** themes. ⚠ The band's wash and
  raster are one `--dawn-rgb` declaration doing both jobs: cream against void
  lifts the screen, ink against parchment settles it.

### Left open — owner verdict

- **Whether the band wants to be shorter.** → **MOOT: U30 deleted the band.**
- **Whether the raster should move.** → Moot for the same reason; the hub's
  grain is material, and material does not scroll.

## Update 30 — the centre is FILLED. It is a hub, not an aperture (2026-08-18, owner)

⚠ **THE WRAPPING QUESTION WAS RETIRED RATHER THAN ANSWERED** (owner: _"maybe we
can make the center also filled instead of now we have a gaping hole and then
place a text in there. The colour of the centre could be a bit like the Tensor
Golds, but softly."_).

U28 deleted the square housing and put nothing in its place. U29 read the
resulting complaint as _"the text needs wrapping"_ and spent a whole pass
looking for something to put AROUND it — a machined counterbore, then a lit
band fenced by two rules. **Both were treatments of a void that the text was
still, fundamentally, floating in.** Two cuts refining the frame around a hole,
when the defect was the hole.

**Fill the void and the text is not floating.** It is set on material, exactly
the way every label on this plate is set on the material of its own part, and
nothing has to wrap it because nothing is holding it up any more. One `path`
with a fill replaced the band, the raster, the two rules, the Sutherland–
Hodgman band clip and the caret — **the answer was smaller than either attempt
at the question.**

⚠ **AND IT SETTLES WHAT THE MIDDLE OF THIS DRAWING MEANS**, which is the part
that makes it more than a fix. An opening said the five parts surround an
ABSENCE. A filled hub says they are courses OF something — and the soft Tensor
gold is that something, the shared material the whole plate is cut from. That
is the reading this variant has been reaching for since U27: substrate is what
gets drawn ON, so the centre of a substrate drawing should be the stuff.

### ⚠ AN ALPHA IS NOT A COLOUR, AND THE GROUND IS WHAT INVERTS

`rgba(var(--gold-rgb), .13)` is a warm lift you can read against near-black and
a near-neutral cream against parchment — the SAME declaration, two different
results, because what flips is the ground under it. The first cut hard-coded it
in the TSX and the light capture came back with a hub that was filled but not
gold in any sense the owner asked for.

So the tint is a token, declared in **both** theme files:

| token             | dark             | light              |
| ----------------- | ---------------- | ------------------ |
| `--pda-hub`       | `gold-rgb / .13` | `138,107,32 / .15` |
| `--pda-hub-grain` | `gold-rgb / .06` | `138,107,32 / .08` |

Light takes a **darker bronze AND a higher alpha** — it is `--gold-line`, the
step the token system already carries for gold that must hold against
parchment, rather than a value invented at the call site.

⚠ **THE ROLE LAW STILL BINDS** (U11: gold is wayfinding). A permanently gold hub
is only lawful because it stays far under the live signal: **.13 against a lit
cell's .28**, verified on the pinned capture where the selected cell is
obviously brighter than the plate it sits on.

### ⚠ THREE SMALLER THINGS THE FILL CHANGED

- **The void goes down first.** A translucent gold laid straight onto the page
  takes whatever the console's bed is doing behind it, so the hub is opaque
  `--pda-void` plus the veil — the tint then means the same thing wherever the
  drawing is placed.
- **The inner edge moved.** It used to be stroked with the outer rim, before the
  centre had anything in it; a hairline left at that point in the order is now
  half-buried under the fill. The hub draws its own rim, after its material,
  at the rim's own weight — **two machined edges, one grammar**, and the five
  seams land on a line that reads as an edge rather than near one.
- **A flat fill would read as a hole plugged with paint.** Every other region on
  this plate carries a physics field, so the hub gets a grain — the quietest on
  the drawing, because this is the one region that is not a substrate shape and
  so may have texture without having a pattern.

### ⚠ WHAT SURVIVED U29, AND WHY IT WAS WORTH THE PASS

Two things outlived the band they were built for, and both are corrections to
measurements that had been wrong for longer than one update:

- **`hubHalfWidth`** — a scanline is a CHORD and `polygonRayRadius` measures a
  RAY; the two agree only on the horizontal axis. It draws the hub's grain now,
  guarded at 51 rows against the polygon at each row's own corner angle.
- **`boxClearance`** — a box is inside a convex polygon iff it clears every
  edge, one linear test per edge. Backing a half-diagonal off the ray through
  the box's CENTRE is the intuitive check and it reads the wall at an angle no
  corner occupies; that is precisely how U28's tag clamp failed by 0.1 units.
  Both readouts are checked with it now.

⚠ That is **three passes in a row** where a ray measurement was reached for and
a chord or a corner was needed. The pattern is worth naming: `polygonRayRadius`
answers _"how far to the wall along this bearing"_ and almost every real
question here is _"does this SHAPE fit"_, which is a different question.

⚠ **AND THE CENTRED BLOCK STILL HAS TO MEASURE ITSELF.** Baseline-centred text
sits high (a line's ink is mostly above its baseline — `BRIEF_DROP`), and the
clicked block grows 20 units for a flagship mark and 17 per meta line, so it
centres on its own cap-to-descender height rather than on fixed offsets. The
guard walks all 47 Skills, because the worst case is whichever one happens to
be both flagship and long-named — not the one anyone would think to open.

### Verification

- `substrate-lab-fit` **256 pass**, full suite **950 pass**, lint clean. The
  brief and the clicked block are both asserted to clear the hub's wall with
  AIR (>24 and >16 units) rather than merely to fit — a block that just clears
  reads as text that happens to be inside the gold, not as text placed on it.
- Capture gates pass, 28 samples, 0 collisions / clipping / overflow, minPx
  **8.1** / **11.4**. `QUIET` pin still 9 — the caret was a shape and the band
  was shapes, so nothing that came or went touched the label count.
- Rest, hover and pinned captured in **both** themes.
- ⚠ The dev server wedged mid-pass (>2 GB, port held, not serving). Unrelated to
  the change, but worth the line: a capture timeout on this surface is a server
  symptom about as often as it is a selector one.

### Left open — owner verdict

- **Whether the hub wants an inner course.** It is one flat plane of material at
  47 cells' worth of scale, and a single concentric step would give it depth —
  but ADR-065's ladder would then have to say what that step MEANS.
- **Whether the brief's measure should widen now.** 248 was cut to fit the
  band's rules, which no longer exist; the hub affords ~317. Four comfortable
  lines against three tight ones is a judgement, not arithmetic.

## Update 31 — every cell letters at rest, and the plate becomes a dial (2026-08-18, owner)

⚠ **THE DRAWING WAS UNREADABLE AS AN INSTRUMENT** (owner: _"we have to make sure
that the labels for each of these skills are visible because we already have a
lot of things going on. I'm not sure what the best way to do it is."_).

U28–U30 tuned the centre through three cuts and never touched the annulus. Its
cells were countable by area, distinguishable by material, and unlettered — a
Skill's identity lived on a hover tag that appeared and vanished. The record
publishes forty-seven Skills; the drawing named none of them at rest. Two
different objects called _"the substrate"_ on this reading: the one on the
plate, and the one the pointer had to conjure. A reader who wanted to know what
was there had to hover forty-seven times.

**So the dial letters everything at rest.** Every cell prints its own `short`
name along its own arc, and the five substrate names move off the plate they
were nested inside onto a **new band** carved between the hub and the cells.

### ⚠ FORTY-SEVEN HORIZONTAL LABELS ARE GEOMETRICALLY IMPOSSIBLE HERE, AND ONE ROTATED LABEL PER CELL IS THE ONLY WAY OUT

The annulus holds 299 520 square units, so each of 47 equal cells gets 6 373.
A 14-character name at fs 12 measures 108 units. For it to sit HORIZONTAL in a
cell **anywhere on the ring** the cell needs 108 units in BOTH directions —
because a cell at 3 o'clock is turned ninety degrees from one at 12 — which is
11 664 per cell. **That is 1.83× the area that exists.** Shrinking type to
close the gap drops through the surface's 12 floor and lands under 6 px
rendered.

So the rotation is not a stylistic choice; it is what makes the drawing letter
its whole roster at a legible size. Every other rotation on this site is 45°
on a shape (ADR-060, ADR-065). **This is the first rotated TYPE on the
surface**, and it is called out because the next pass looking for consistency
will reach for it. The exception is earned by the arithmetic and by no other
argument.

### The course ladder is derived from names now, not authored on the count

⚠ **U28's LADDER ARGUED THE COUNT CANCELS. IT DID — AND THE NAMES DO NOT.**
The old rule was `n >= 10 ? 3 : 2` because the count cancels out of every
cell-shape derivation, so an authored rule was the only lever left on grain.
That argument was right for a drawing whose cells were unlettered, and it is
over: `LABEL_MEASURE` does not cancel, because the name has to fit the cell's
ARC and inner arcs are shorter than outer ones.

The new rule enumerates compositions of `n` cells into 1…n courses, and picks
the one that clears `carrierArcTarget(longestChars)` on every course's inner
arc and `MIN_CELL_DEPTH` on every course's depth, minimising the max aspect.
Inner courses hold FEWER cells now — `[2,3,3,3,3]` for Pattern instead of
U28's `[4,5,5]`, `[1,2,2,2,2]` for Validation — because that is what stops the
innermost cells from choking on their part's longest name.

Cell AREA still falls out equal: the course boundaries are still solved for
area share, so the honesty claim is untouched. What moves is the ASPECT — a
name's target arc no longer cancels the count.

### The substrate name lives in a BAND now, not on a plate

⚠ **THE NAMEPLATE WAS INSIDE ITS PART, WHICH WAS THE RIGHT ANSWER FOR THE
WRONG PROBLEM.** U27's plate sat on the part's mid-ray at a shared `R_LAB`,
fifteen clearances proven — and the whole affair covered a cell it did not
name. With every cell now lettered at rest, a nameplate that sits ON TOP OF
(say) Pattern-c3 is two labels claiming that region: one big and general, one
small and specific. **Two claims per pixel, one claim too many.**

So the substrate name moves off the annulus. `R_HUB` stays at 164; a NEW EDGE
`R_CELL = 194` moves the cells 30 units outward, and the band fills the strip
between them. Each substrate letters at `BAND_R = 179` along its own arc, in
the same textPath grammar as the cells — **one drawing, one direction, one
law about which way type reads on this plate.**

Cell area drops from 6 373 to 5 687 units (~11 %), which the equal-area
arithmetic absorbs without touching. The boundaries are still solved for area
SHARE.

### `textPath` beats straight rotated text, and its bill was accounted for

Straight rotated text was the initial approach. It fails on Validation-c0: a
100-unit name at midR 200 has ends at √(200² + 50²) = 206, plus half the line
box outward gives a corner at 213 against a 218 outer boundary — a 5-unit
clearance that the cell's `--pda-dim` stroke would cross visibly. `textPath`
places every glyph on the arc exactly and buys the whole 5-unit budget back.

⚠ **BUT `getBBox` DOES NOT KNOW THAT** (`useFitReadout` lesson). The fit
readout compares axis-aligned bboxes; a curved label's bbox is the box of
every rotated glyph position, so two adjacent cells at 3 o'clock report a
collision even when their glyphs are visibly separate. The readout skips text
elements that contain a `<textPath>` child — the label still counts, its
smallest paint is still measured, but its collision test is retired for a
question the bbox cannot answer. Called out in one comment; ADR-070 U31 is
the reason to preserve it.

### What survived U30, and what came off with the tag

- **The hub stayed.** Filled, soft-gold, `--pda-hub` / `--pda-hub-grain`
  tokens unchanged. Still letters the brief at rest and the pinned Skill's
  identity when a cell commits. `carrierBriefFits` and `carrierPinnedFits`
  measure it against the same walls.
- **The hover tag is deleted.** A tag that names the cell under the pointer
  is redundant once the cell is always named. `carrierTagRect` and its 40
  lines of per-edge clearance go with it. Hover keeps the LIT cell and the
  dimming; click still commits the hub.
- **The nameplate is deleted with it.** `NamePlate`, `carrierPlateFits`,
  `R_LAB`, `PLATE_W/H/MEASURE/NAME_FS`, `TAG_W/H/MEASURE/FS`, the fifteen
  clearances — retired. The plate has ONE type direction now, not two.
- **The five material fields drop from 0.8 to 0.55 alpha.** U28 rested a
  texture that the labels had to fight; 0.55 lets the type read while still
  differentiating by kind. Dimmed step 0.32 → 0.22.

### The label count went from 9 to 56, and the QUIET pin moved with it

U28's `QUIET: { carrier: 9 }` was right for its drawing: one brief, five
nameplates, three hidden hub strings. It survived U29 (band readout, same
letters) and U30 (filled hub, same letters). U31 letters the roster and the
pin is 56 (4 brief + 5 band + 47 cells). Still an EXACT pin, not a floor —
the direction the count actually rots in is UP, and a 48th cell would show
up here as a 57th text without touching any other guard.

### ⚠ THE FIVE NEW EXPORTS AND WHAT THEY ARE FOR

| symbol                   | role                                                     |
| ------------------------ | -------------------------------------------------------- |
| `CARRIER_R_CELL`         | the cells' inner boundary (194), pinned in the guard     |
| `CARRIER_BAND_R`         | the label radius (179), derived midpoint of hub↔cell     |
| `CARRIER_LABEL_FS/TRACK` | the label rung the guard walks against                   |
| `carrierArcTarget`       | `nameChars → cell inner-arc target`, the ladder's input  |
| `carrierCellArcPath`     | one `textPath` arc per cell, reversed in the bottom half |
| `carrierBandArcPath`     | one `textPath` arc per group, same rotation grammar      |
| `carrierCellMeasure`     | cell's inner arc minus per-end pad — the fit measure     |
| `carrierBandMeasure`     | band arc at BAND_R minus per-end pad                     |
| `carrierLabelRotation`   | the tangent + upright-flip helper                        |
| `carrierChordSagitta`    | the straight-text fallback's arithmetic                  |

⚠ **`carrierChordSagitta` HAS NO CALLERS IN THE DRAWING.** It exists so the
straight-text fallback stays DEFENDABLE — if `textPath` ever fails on a
browser, the drawing can drop to rotated straight text without recutting the
ladder. The guard walks it against half the cell depth, which is what proves
the fallback is still lawful.

### Verification

- `substrate-lab-fit` **258 pass**, full suite pass, lint clean.
- Capture gates pass, 4 samples for `carrier` (dark/light × p1280/p1920),
  **0 collisions / 0 clipping / 0 overflow**, minPx **7.8 / 10.9**, texts
  **56** — matching the pin exactly.
- Rest, hover and pinned captured in **both** themes.
- `useFitReadout` skips `textPath` elements from the collision check, with a
  comment naming this ADR as the reason. Other lab variants unaffected.

### Left open — owner verdict

- **Whether the band's inner and outer rings want more or less weight.** They
  are `--pda-dim` at width 1 now, matching the cells' own hairlines so the
  band belongs to the same plate — but the band is a THREE-ring region (hub
  rim, band inner, cells' inner all sit near each other), and a subtler
  ladder inside it might read as three edges instead of two.
- **Whether the band should carry a Skill count.** Removed on the owner's
  instruction (U28 "remove the fucking number"), and every future pass
  wanting to "just say how many" will reach for it — this is the second time
  U28's clause has bound. The five parts' area is their count, and the cells
  count themselves.

---

## Update 32 — the dial was crammed by its CROP and by its BASELINE, not by its geometry (2026-08-18, owner)

⚠ **THE OWNER'S READING WAS THAT THE PLATE IS CRAMMED** (_"this doesn't look bad,
but it's very crammed … make sure every label fits inside the frame. If we have
to increase the height and reduce the center, that is all fine."_).

Every label already fitted. `substrate-lab-fit` walked 47 arcs and 5 band arcs
and found no overflow; the capture readout reported **0 clipped, 0 collisions, 0
overflow**. So this update is mostly a record of what "crammed" turned out to
mean when it was measured instead of guessed — and **two of the three causes were
in machinery no per-label check looks at.**

### ⚠ THE CROP WAS LETTERBOXING BOTH WAYS AND EVERY GUARD WAS GREEN

U31's crop was a static `932 × 762`, aspect **1.223**, against console field
aspects of **1.056 (p1920) … 1.148 (p1440)**. `meet` takes the SMALLER ratio, so
the fit was WIDTH-bound and the whole height ratio went unspent — and inside that
crop the plate left ~110 units of gutter per side as well. Compounded, a 12-unit
label painted **7.89px** while `minPx` reported it as clearing the map's 4.3 hard
floor.

**A fit gate that only knows a hard floor cannot see a drawing that is merely
half the size it could be.** That is the guard defect, and it is the same shape as
U12's on reading 02 — a drawing measured against its own crop and never against
the panel.

So the crop is elastic (`carrierCrop(fieldAspect)`), and it is the INVERSE of
U12's elasticity because the object is different: the R4 board is a wide drawing
in a field that runs narrow, so its crop fixes the WIDTH. **The carrier is a
regular dodecagon whose aspect is the constant `1/κ` = 1.035, and every field it
is read in is wider than that** — so the scarce dimension is the vertical at every
preset, with no crossover. Height fixed, width elastic.

⚠ **`floor`, NOT `round`, AND THE DIRECTION IS THE CONTRACT.** Rounding the width
up makes the crop wider than the field, which flips `meet` back to the width ratio
and re-opens the letterbox — by 0.014 % at p1280, invisible on screen and exactly
the kind of term that makes a contract "mostly" hold.

### ⚠ `CROP_PAD` 26 → 18 IS THE ONE LEVER ON THIS DRAWING THAT BUYS TYPE FOR FREE

Every other lever is a trade. A thicker annulus grows the crop; a bigger
`LABEL_FS` re-cuts the ladder; a smaller hub **shortens the innermost arc**. The
pad is different: the fit is height-bound, so `meet` is `field.h / CROP_H`, and
shrinking `CROP_H` scales all 52 strings at once without moving one radius.
`CROP_H` 794 → **778**, `meet` 0.6213 → **0.6337**, i.e. **+2.0 % on everything**.

⚠ It is a MARGIN, not slack, which is why it is not spent to zero — at the binding
preset a unit of pad paints 0.63px, so 18 leaves an **11.4px gap** between the
plate's outer machined rule and the console field's wall. ADR-064's bleed law is
about a CAPTURE filling its bay; a technical drawing whose outermost rule touches
the housing has lost its margin rather than bled. `CARRIER_CROP_PAD` is exported
with a floor of 16 asserted, because this is the lever a later pass will take to
zero.

### ⚠ THE HUB IS NOT WHAT THE CELLS WERE SHORT OF — AND THE OWNER'S OWN SUGGESTION IS THE ONE THING THAT WOULD HAVE MADE IT WORSE

"Reduce the center" is the intuitive reading of a crowded ring, and it is
backwards here. `R_CELL` is the radius the INNERMOST course letters at, and a
course's arc is `R_CELL × sweep / m` — **so pulling the cells inward shortens the
tightest measure on the plate.** Sweeping the whole (hub, cell, rim) space showed
air rising monotonically with `R_HUB`.

So the hub gave up 8 units to the **BAND** (30 → 36 deep, the one region genuinely
pinched at 8 units of clearance) and the cells were paid from the **RIM** instead:
`R_OUT` 356 → **384**, with `LABEL_FS` 12 → **13** in the same edit because a
bigger plate paints a unit-authored label smaller. Minimum cell depth 24 → **29**,
worst cell aspect 9.4 → **8.3**.

⚠ **`LABEL_FS` 14 DOES NOT FIT, AND IT IS A LADDER FACT.** Re-derived from
scratch this pass: `Tracker Check` on validation's 66.6° sweep forces courses of
1–2 cells, and a 1-cell course out past r≈332 is only 18 units deep because equal
area at a large radius means a shallow cell — under `MIN_CELL_DEPTH`. Dropping
`LABEL_PAD` 12 → 8 makes 14 feasible **by 0.1 units** on one course, which is a
collision waiting for a one-character content edit. **13 is the top of the range
this geometry supports.**

### ⚠ `textPath` PUTS THE BASELINE ON THE CURVE, AND A BASELINE IS NOT A CENTRE — SO EVERY LABEL ON THE PLATE HUGGED ONE WALL

This is the defect that actually produced the reading the owner called crammed,
and **no existing guard could see it, because every one of them measures a
LENGTH.** An advance against an arc, a depth against a line box, a sagitta against
half a cell — all of them pass wherever the label happens to SIT.

The arcs were cut at each cell's mid-depth, which centres the thing the renderer
is handed and not the thing the reader sees. Measured on the live face, a Skill's
ink runs `baseline − 0.769em … baseline + 0.231em`, so the ink block sat **0.269em
(3.5 units at fs 13) off centre** — in a 35-unit course, **11 units of air on one
wall against 18 on the other.**

⚠ **AND THE LEAN REVERSED AT THE HORIZON**, which is why no single-cell inspection
would have found it either. The bottom half's arc is traversed backwards so the
type is not upside down, and that also reverses the glyphs' up-vector — **the top
half leaned outward and the bottom half leaned inward, from one rule.** Nothing
collided; the plate simply read as unresolved, because the same law produced
opposite offsets on its two halves.

`carrierCellArcRadius` / `carrierBandArcRadius` cut the arc off-centre so the INK
lands centred, carrying the same `flip` term the arc's direction uses. Recovers
~3.5 units on whichever wall each label was nearest, at no cost anywhere, and
makes one grammar out of two.

⚠ **THE CENTRE OFFSET AND THE INK'S HALF-HEIGHT ARE DIFFERENT NUMBERS, AND
CONFLATING THEM IS A GUARD THAT REPORTS A LEAN ON A BLOCK SITTING STRAIGHT.** For
a sentence-case Skill the centre is 0.269em above the baseline (the
half-DIFFERENCE of ascent and descent) while the half-height is 0.500em (the
half-SUM). The first says where to cut the arc, the second how much wall the block
eats. They coincide only for a run with no descender — which is the band's
uppercase case, and is why `BAND_INK_MID === BAND_INK_HALF` while the Skill's two
differ. The first cut of the new guard used one for both and failed on a correctly
centred plate.

### ⚠ `BAND_FS` WAS SETTING THE PLATE'S FLOOR, AND `minPx` COULD NOT SAY SO

U32's first cut left the band one rung under a Skill and argued the register from
CAP HEIGHT — true as far as it goes, and it missed that **`BAND_FS` was the
smallest lettering on the plate.** At 12 the band painted **7.46px** while all 47
Skills cleared 8. The gate reported 7.46 and the thing it named was the five
REGION names, the most structural strings on the surface.

**A floor is not a family.** The capture readout reports one scalar, so it can say
the floor moved and never which lettering owns it. A per-family assertion is the
fix, and it names the map's 8px line rather than the 4.3 hard floor.

`BAND_FS` 12 → **13**, paid for out of the TRACK (0.08 → **0.05**), not the arc:
`STAKEHOLDER` is the binding name — the longest label on the narrowest part's 37°
sweep — and at 13/0.08 it needs 97u against 100u of arc (1.3u per end, which is
why the step was refused), while at 13/0.05 it needs 93u, i.e. **3.75u per end**.
The chrome grammar is DIRECTION (uppercase, tracked wider than a Skill's 0.02),
never a specific step. And the register still ranks correctly for the reason the
cap-height argument got right: **uppercase at 13 carries a 9.1u cap height against
sentence case's 6.5u x-height, so the band reads larger than the Skills it heads
at the same font size.**

### ⚠ TWO CONSTANTS WERE HELD AS LITERALS IN THE GUARD AND BOTH DRIFTED

`CY` carried inline as `- 381` in the material-coverage raster, and `CROP_PAD` as
`- 26` in the rim assertion. Both are consequences of a radius; **re-stating a
consequence beside the drawing is writing down a thing that can disagree with
it**, and in both cases the guard went on measuring a plate some units from where
the plate was. `CARRIER_CX`, `CARRIER_CY` and `CARRIER_CROP_PAD` are exported now,
and the rim assertion pins the CONTRACT (apothem inside the crop by the pad, and
by no more than a unit past it) rather than a number.

### What the measurement found that needed no fixing

⚠ Worth recording, because the obvious next pass will try to "fix" these:

- **Side air was never tight.** The rendered advance of every label against its
  own arc leaves **14.8px minimum per end** (`GL Reconcile`), and 23–76u across
  the plate. `LABEL_PAD` 14 → 12 was taken in the same pass and the achieved
  clearance still doubled the floor — the pad is a value the LADDER solves
  against, not the clearance the drawing ends up with, so raising it forces
  coarser courses and buys side air the labels did not need by spending radial
  air they did.
- **Cell depth was never tight.** 35–44 units against a 13-unit ink block.
- **The material fields were already quieted** to 0.55 alpha in U31 for exactly
  this reason.

⚠ **AND THE PROBE THAT MEASURES RADIAL AIR FROM THE RENDERED DOM IS A TRAP.**
Sampling a cell's own path and taking its extreme radii as `r0`/`r1` is wrong on
this drawing, because cells are bounded by POLYGONAL chords: a chord's closest
approach to the centre is its midpoint, so sampling under-reports the inner wall
by up to 4 units and the outer by a similar amount, and the errors do not cancel.
An earlier cut of `.cursor/isl-carrier3/air.js` did exactly that and **reported
the ink-centring correction as having made the lean worse when it had in fact
centred every label to within half a unit.** The authority for radial air is the
unit guard, which walks the exact `cell.r0` / `cell.r1` the layout derived.

### Verification

- `substrate-lab-fit` **262 pass** (three new: ink centring on all 47 cells, the
  band's uppercase metric, and the per-family 8px line), full suite **956 pass**,
  typecheck and lint clean.
- Capture gates **PASS at all three presets in both themes** — 0 clipped, 0
  collisions, 0 overflow, texts **56** matching the pin, and `minPx` **8.24 /
  9.16 / 12.70** against 7.46 / 8.28 / 11.48 before. **Every string on the plate
  is over 8px for the first time on this drawing.**
- Both themes captured and read at the binding preset per the theme-parity rule.

### Left open — owner verdict

- **Whether 8.24px at 1280×720 is enough.** It is the ceiling this form supports
  with all 47 Skills lettered: the levers are exhausted (13 is the ladder's top,
  the pad has an 11.4px margin floor, the hub is the wrong direction), so the
  only remaining currency is DENSITY — fewer lettered cells, or shorter `short`
  strings. This is ADR-063 §Outstanding's standing question, now with a measured
  ceiling attached to it.
- **Whether `LABEL_FS` 14 at `LABEL_PAD` 8 is worth its 0.1-unit margin.** It is
  feasible and it is fragile; recorded above rather than taken, so the trade is
  available on request instead of being rediscovered.

## Update 33 — the Carrier SHIPS, and the hub is the flight's third home (2026-08-18, owner)

The owner asked to wire the latest substrate drawing to the landing page. That is
one import in principle, and the promotion turned up **four things the lab could
not see, three of which were green in every guard.**

The Carrier (U28 → U32) is reading 03 in production now. `PdaCarrier.tsx` holds
the drawing; `SUBSTRATE_SECTION` in `pda/flags.ts` is `false` and mounts it, and
`true` restores U25's SECTION drawing untouched.

### ⚠ THE DRAWING HAD NOWHERE FOR THE FLYING OBJECT TO LAND, AND NOTHING WOULD HAVE THROWN

ADR-069's claim is that the selected work is a PERSISTENT OBJECT that flies
between the readings rather than being replaced. SECTION earned its third home in
U25 by putting twenty ghost footprints across its top. **The Carrier has no
cartridge anywhere on it.** Promoted as-drawn, `rectFor(3, id)` returns `null` —
which does not throw, does not fail a render and does not fail a guard. Every
1↔3 and 2↔3 transition silently degrades to a bloom or a raster, i.e. the ADR's
central mechanic quietly stops existing on a third of its surface.

**The hub is the third home.** It seats the shared `Cartridge` at `HUB_K`, so the
object has three homes and is still ONE DRAWING at three sizes. Considered and
rejected: an estate band above the plate, in SECTION's manner. It costs 62 units
of crop height, and because this crop is height-bound at the binding preset that
is `meet` 0.6337 → 0.586 — **every label on the plate back under 8px**, undoing
U32 entirely to buy a footprint the hub can hold for nothing.

⚠ **`HUB_K` IS DERIVED: `LABEL_FS / CART_TYPE.title` = 1.1304.** The rule stated
once — the work's name letters at the rung the 47 Skill names around it letter
at. A `k` chosen by eye is a `k` that drifts when either end moves, with nothing
failing. It also lands the card at `198.96 × 153.74`, whose aspect is the
cartridge's to the last representable digit, so the flight's single uniform `dk`
carries it with no distortion term at all — where SECTION's footprint needed a
3 % tolerance because it is a simplified silhouette rather than the card.

The hub shows the plain-language brief at rest, the seated work once the reader
has opened a stream (`hasOpened`, not merely `selected` — seating a default
record claims the reader left it open), and a tapped Skill's name while one is
pinned. The click is resumed the rest of the way by a **gold wash on the tapped
band segments**, at the same `rgba(240, 200, 106, 0.14)` SECTION's selected
footprint carried, so the two drawings mark a selection with one value.

### ⚠ U32'S ELASTIC CROP WAS THE DEFECT IT FIXED, POINTING THE OTHER WAY

U32 made the crop elastic in WIDTH and wrote down why the height could stay
fixed: the plate's aspect is `1/κ` = 1.035 and every console field it is read in
is wider than that. **True at the three lab presets and false on a tall desktop
window**, where the field runs 0.89, the fit goes WIDTH-bound, and the height
ratio is what goes unspent — **132px of dead panel at 845 × 950, the owner's own
monitor.** Within 5px of the 265px that forced U15's generalisation on this same
reading, and one drawing later.

⚠ **THE LESSON IS NOT "MAKE CROPS ELASTIC", IT IS THAT A CROP MUST BE ELASTIC ON
WHICHEVER AXIS IS SLACK.** Three passes have now shipped a crop that fills the
panel at the viewport it was authored at and letterboxes at the other end, and
each one was green, because `minPx` measures the drawing against its own crop.
`carrierCrop` grows one axis or the other around the hinge `W_MIN / CROP_H` =
1.033, both terms floored so each keeps the bound axis it had. The plate does not
move — `CX`/`CY` are constants and the CROP's offsets slide around them, which is
what keeps all 47 cells, both label rings and `CARRIER_SEAT_RECT` written against
constants.

Measured live, all three fields: **0px dead on both axes**, `meet` 0.6339 /
0.9767 / 0.7495, `minPx` 7.17 / 11.04 / 8.47. The 7.17 is the SEATED CARD's lane
rung (`CART_TYPE.lane × HUB_K` = 11.30 units), not a carrier label — the plate's
own 52 strings still paint 8.24px, and the grid card letters that same rung at
6.22px, so the third home is the least cramped place this card has ever been.

### ⚠ THE CARD'S INTERIOR WAS HARMONISED IN ADR-069 U1. ITS OUTLINE WAS NOT

`176 × 136` was declared independently in `PdaViews`, in `PdaConfiguration`, and
— as of this pass — in `PdaCarrier`. Three copies of one object's silhouette is
not a wrong value, it is a value that can become wrong in one place while every
per-home guard stays green, which is ADR-069 U1's finding exactly. `CARD_BOX` in
`pdaGlyphs` is the source now, beside the `CARD` interior table it measures
against, and `pda-card` walks all three homes' rects back to it through their own
scales.

### ⚠ THE LAB IS A WINDOW ONTO PRODUCTION NOW, NOT A COPY OF IT

`VariantCarrier.tsx` re-exports `PdaCarrier` wholesale and adapts the lab's
`IslRecord` onto its props. So `substrate-lab-fit`'s 263 assertions — the arc
metrics, the derived ladder, the ink centring, the equal-area proof — walk the
SHIPPED module by the same names they always did, and there is no second drawing
to diverge. The dependency runs lab → production and may not reverse:
`app/(internal)` is proxy-blocked in production.

### ⚠ THE SMOKE'S OVERLAP GUARD CANNOT BE ASKED ABOUT ARC-SET TYPE

The first live capture reported **22 colliding label pairs with nothing touching
on screen.** `readPda` compares `getBBox()` rectangles, which is a valid proxy for
ink only while the type is HORIZONTAL; a diagonal run's axis-aligned box is
mostly empty, so two labels in neighbouring cells separated by their own 12-unit
pad intersect as boxes.

⚠ **THE QUESTION WAS RIGHT AND THE INSTRUMENT WAS WRONG, SO THE INSTRUMENT
CHANGED.** Suppressing the reading, or loosening the tolerance until it went
quiet, would have left reading 03's 52 labels unguarded for collisions on the one
surface that can see a CSS change. `readPda` splits by how a label is SET: flat
labels keep the box test, and `textPath` labels are walked by per-glyph origins
from `getStartPositionOfChar`, against 3.9 units — half a glyph advance, where the
drawing's own clearances are an order above. ⚠ The pair is the guard: the flat
test going quiet on a reading is only safe because this one speaks there, so the
arc-label COUNT is pinned too (>40 on view 3) — a `textPath` that stopped
resolving would empty the list rather than fail it.

### Re-pointed guards

Three suites were green on code the landing page no longer runs, which is the
failure mode this ADR has recorded twice already (`pda-flight`'s static
`VIEW_BOX[1]`; U12's crop measured against itself):

- **`pda-flight`** — `boards()` and a new `thirdHome()` follow `SUBSTRATE_SECTION`
  rather than either drawing, so the round trips test whichever is mounted. Five
  new cases: exact cartridge similarity (12 digits, not a 5 % tolerance),
  `HUB_K`'s derivation, and the seat's clearance in the hub pinned at BOTH ends
  (26.1 units against a 1.3672 ceiling where the card touches the wall).
- **`pda-viewbox`** — reading 03's resting crop and `CONTENT[3]` follow the flag.
  The content extent is derived per axis from `polygonRayRadius`, not from one
  number: at this rotation both half-extents are `κ·R_OUT`, and asserting that as
  a single value would pass a rotation change that turned the plate vertex-up.
- **`substrate-lab-fit`** — U32's `expect(h).toBe(CROP_H)` "always" is now
  conditional on the field being wider than the plate, and a new case walks the
  tall regime: the growing axis, the plate staying centred, zero dead panel, and
  `meet` no worse than at rest.
- **`pda-card`** — five new assertions for the third size (above).

### Verification

- Typecheck clean; lint clean (the two `PdaConsole` ref warnings pre-date this
  pass); **967 unit tests pass**.
- `desktop: the harmonised casefile fits its reference viewports` **passes with
  the Carrier live** at 1280×720, 1920×1080 and 2560×1330 — 0 clipped, 0 flat
  collisions, 0 arc collisions, 0 overflow, `minPx` ≥ 4.3.
- `light: the map console's palette carries its contrast` passes.
- The flight verified live per card on a true 1 → 3: `dx` −341.85 / +341.85 /
  +113.95 / +341.85 for grid cards 0 / 3 / 6 / 11, mirror-symmetric about the
  grid's centre column, `dy` scaling by row, and `dk` constant at 0.8690 for all
  four — one card size, one seat size. 3 → 1 flies back. At rest with nothing
  opened the hub letters the brief and mounts no dock.
- Both themes captured at the binding preset and read
  (`docs/design/intelligence-substrate-lab/live03_carrier_{dark,light}.png`), plus
  the tall field where the second crop regime is active
  (`live03_carrier_tall_dark.png`).

### Left open

- **U32's density question stands unchanged** — 8.24px at 1280×720 is still the
  ceiling this form supports with all 47 Skills lettered, and the only remaining
  currency is fewer lettered cells or shorter `short` strings.
- **`SUBSTRATE_SECTION` is a comparison lever, not a permanent seam.** When the
  owner has read both on the live site, the losing drawing and its guards should
  go; leaving a flag in place is how a surface ends up maintaining two.

---

## Update 34 — the dodecagon is the HOUSING; the division inside it is concentric (2026-08-23, owner)

The owner's finishing pass on reading 03. He is ready to move on from the
direction given three fixes, and he named the cause of two of them himself:

> _"some text in some of the fields (eg Localization or Quality) fall outside
> their fields … the fact that stakeholder and patterns don't have a background
> like the rest do is also weird … the fact I didn't want a traditional,
> circular pie shape is kinda fucking me because it's intersecting weirdly with
> the text inside."_

### The spill was geometric, systematic, and invisible to every guard

Every ring on this plate was a twelve-sided polygon (`ringArc` →
`polygonRayPoint`); every label rode a **circle** (`carrierCellArcPath` emits a
single `A` at a concentric radius). A dodecagon's radius dips to `κ·R` — 96.59 %
— at each of its twelve edge midpoints, which at `R_OUT` is **13.1 units**. The
wall swung inward and the label did not follow.

**Nineteen of the forty-seven labels' ink crossed their cell's outer wall:**

| cell                        | past the wall |
| --------------------------- | ------------- |
| `stakeholder / Feedback`    | −5.0u         |
| `validation / Supplier QA`  | −3.3u         |
| `validation / Localization` | −3.3u         |
| `stakeholder / Survey`      | −3.1u         |
| `voice / Founder TOV`       | −2.9u         |
| 14 more                     | −0.2u … −1.7u |

⚠ **AND EVERY GUARD REPORTED 7–12 UNITS OF AIR ON BOTH SIDES.**
`substrate-lab-fit`'s clearance test measured `cell.r0` / `cell.r1` — the
NOMINAL partition radii — which are the wall only at the twelve vertices. This
is ADR-069 U1's finding one level down and in a new place: **the guard measured
a model of the drawing rather than the drawing.** U32's own ink-centring
correction is real and is 3.5 units; this was up to 13.1, in the same direction,
on the same labels, and it is what the owner was actually looking at.

### The ruling

ADR-065's law, one level up: **the housing carries the machined geometry and the
things seated inside it do not repeat it.** So the dodecagon stays where it is
read as a shape, and the division inside it becomes concentric.

| ring                                 | before          | after           |
| ------------------------------------ | --------------- | --------------- |
| plate silhouette (`R_OUT`)           | 12-sided        | 12-sided        |
| hub (`R_HUB`)                        | 12-sided        | 12-sided        |
| band's inner ring (`R_CELL`)         | 12-sided        | 12-sided        |
| outermost cells' outer edge          | 12-sided, flush | 12-sided, flush |
| **4 internal course seams per part** | 12-sided        | **concentric**  |

⚠ **THE SEAMS ARE SAMPLED POLYLINES AND MAY NEVER BECOME `A` COMMANDS.**
ADR-071's arrival morph interpolates the CSS `d` property between the config
chip's rectangle and `cell.d`, which needs ONE command structure on both ends —
`pda-flight` pins it, and a mismatch does not error, it snaps discrete with
nothing on screen to say why. `circleRing` samples at `SEAM_STEP` 3°, whose
chord sagitta is 0.10 units at r 300 — a sixteenth of a device pixel.

### One rule, and the asymmetry IS the finding

- a **circular** wall is exact — use `r`;
- a **polygonal INNER** wall is worst at its circumradius — use `r`;
- a **polygonal OUTER** wall is worst at its **apothem** — use `κ·r`.

`CarrierCell.outerWall` carries the third case (`R_APOTHEM` on the rim, `r1`
everywhere else) and `carrierCellArcRadius` centres on `[r0, outerWall]`. The
field exists because its absence is the defect.

⚠ **THE APOTHEM IS ALL BUT EXACT HERE, NOT CONSERVATIVE** — every outermost cell
comes within **0.081 units** of that wall inside its own sweep. ⚠ The sweep's
width is not a proof of this, and the first cut of the guard used one: a rim
cell narrower than the 30° facet pitch may still straddle an edge midpoint, so
`>= 30°` fails on `pattern`'s four 25.9° rim cells that clear it anyway. The
property is sampled. The threshold has teeth because the miss grows fast —
`R_OUT·(1/cos(15° − w/2) − 1)` is 0.25u at `w` 25.9° but **5.9u at `w` 10°**.

### The partition re-solves for the walls that bound it

`carrierPolygonShare(a0, a1)` is `√(P / C)` — the dodecagon's unit sector area
over the circle's. It measures **0.9758–0.9779**, and the cumulative-area solve
is exactly the old expression scaled by it. Part totals are unchanged, so the
equal-area claim still holds at part level by construction. `sectorTerm`
integrates each wall with its own constant, because a polygonal wall and a
circular one enclose different area at the same radius.

⚠ **A SEAM IS SHARED, SO IT CANNOT BE SOLVED PER CELL** — recorded because it is
the obvious next idea and it does not close. Zeroing the residue would mean
solving each polygon-bounded cell's FREE boundary, which is the neighbouring
course's wall; the two courses hold different cell counts, so their cells do not
align angularly and the correction cascades with a `COURSE_GAP` that then varies
by up to a unit. Measured trade: **0.42 % spread for 1.06u of seam wobble** —
0.67 device px of ragged seam bought with a sub-pixel gain in a clearance.
Rejected; the drawing stays perfectly regular.

⚠ **SO THE AREA GUARD PINS THE STRUCTURE, NOT AN ENVELOPE.** The blanket
tolerance goes 4 % → 4.5 % (measured 3.97 %, previously ~3.4 %) and a second
assertion carries the weight: cells bounded by two concentric seams are held to
**1 %** and the two housing-bounded courses to **2.5 %**. The residue is where
it has always been — the rim's own modulation — but it used to appear at BOTH
walls of every cell, where it partly cancelled in `r1² − r0²`, and now appears
at one wall of two courses. Measured worst: `pattern`'s four rim cells at
**+1.6 / −2.3 %** of the mean, a 25.9° cell against a 30° facet pitch.

### Two constants moved, and the ladder did not

| constant         | before | after  | why                                                                                                                                                                                                                                                                                            |
| ---------------- | ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LABEL_PAD`      | 12     | **10** | boundaries pull in by `polygonShare`, taking `validation`'s second course from a 128.9-unit inner arc to 125.9 against a 128.8 target. The pad is a floor the LADDER solves against, never the air the drawing ends up with — this ADR's third time saying so.                                 |
| `MIN_CELL_DEPTH` | 26     | **23** | the last course's depth ends at the apothem now, 13.1 units less than the `R_OUT − r0` the floor used to be handed. `stakeholder`'s outermost course measures 24.5 there, and its only alternative composition (`1,1,1,2`) puts a two-cell course on a 101-unit arc against a 112-unit target. |

Resulting ladders — `pattern 2,2,3,3,4` · `judgment 2,2,2,3,3` ·
`validation 1,2,2,2,2` · `voice 1,1,1,2,2` · `stakeholder 1,1,1,1,1` —
**byte-identical to what shipped.** The plate does not re-cut; the labels move
inside it.

### The band was never missing a background — it never had one

Pattern and Stakeholder are the two regions the open stream does **not** draw
on. `W-017 Campaign copy` carries `shapes: ["judgment","voice","validation"]`
and `TapWash` filled exactly those three at gold α.14. ⚠ **The band was the only
region on this plate with no material of its own** — the hub has void + veil +
grain, the cells their physics field — so a signal with no ground under it read
as a rendering fault. One recess wash on all five, and the tapped three read as
LIT on top of it.

⚠ **0.10, AND THE FIRST CUT AT 0.03 WAS A FIX THAT CHANGED NOTHING.** A wash is
judged against what it lands on, not against a neighbouring number. Measured:

|                     | before                  | at α 0.03               | at α 0.10               |
| ------------------- | ----------------------- | ----------------------- | ----------------------- |
| untapped band, dark | `rgb(11,10,9)` L 0.0031 | `rgb(11,10,9)` L 0.0031 | `rgb(27,25,23)` L 0.010 |
| tapped band, dark   | `rgb(45,37,20)` L 0.019 | L 0.019                 | `rgb(57,48,30)` L 0.031 |

At 0.03 the band sat inside a value of the plate ground it was supposed to be
distinguishable from, against a **6× luminance ratio** on the tapped three — the
reading the owner objected to was completely intact. At 0.10 it lands a hair
under the hub's own `rgb(35,28,14)`, so the core and the recess read as one
middle zone with the cells dark around them.

⚠ **FLAT, NOT GRAINED, AND THE DISTINCTION IS THE OBJECT.** The hub's own note
says a flat fill among fields reads as a hole plugged with paint — and answered
it with a grain, because the hub is the plate's CORE. This is a machined RECESS
between two rings, and a recess is a cut face.

⚠ **IT DARKENS IN LIGHT AND THAT IS THE POINT.** ADR-058 swaps `--dawn-rgb` with
`--void-rgb`, so one rule is a step AWAY from the ground in both themes — up out
of the void, down into the parchment.

### The guards, both halves

⚠ **THE REASON THIS SHIPPED IS THAT NO GUARD MEASURED THE DRAWN WALL.**

- **Arithmetic** (`substrate-lab-fit`): the clearance test samples each cell's
  own sweep at the radius the renderer paints — `polygonRayRadius` where the
  wall is the housing, the plain radius where it is a seam. U32's SYMMETRY
  question is kept (it was the right question asked of the wrong walls) and the
  `>5u` floor with it. A new case pins `outerWall` from BOTH ends: `κ·R_OUT` on
  the rim, `=== r1` on every concentric seam — collapsing them either way puts
  the outermost labels back through the edge or floats every other label off its
  own centre.
- **Live** (`services-ring-smoke`): the arc walk already collected per-glyph
  origins for pairwise overlap; it now also probes the ink's two extremes along
  the up-vector and asserts `isPointInFill` on the cell's own path. ⚠ Two labels
  not printing through EACH OTHER and a label not printing through its own CELL
  EDGE are different questions, and the second had no guard at all.
  ⚠ **THE INK BLOCK IS ASYMMETRIC ABOUT THE BASELINE** — ascender 0.769em above,
  descender 0.231em below — and swapping them reports every tight cell as a
  spill; the first cut of this probe named `Tracker Check` twelve times on a
  drawing with 5.5u of clearance.

### Verification

- 378 unit assertions pass across `substrate-lab-fit` · `pda-flight` ·
  `pda-viewbox` · `pda-card` · `cases-registry`.
- `capture-substrate-lab --v carrier`: GATES PASSED, 4 samples, 0 collisions /
  0 clipped / 0 overflow, minPx 8.2 (p1280) and 12.7 (p1920), both themes.
- `services-ring-smoke`: 21 desktop cases pass.
- **Live containment, in the browser's own hit geometry on the shipped module:
  0 spills over 479 glyph positions**, minimum air 5.5u inner (`Tracker Check`)
  / 6.0u outer (`PRG Status`) — matching the unit guard's 5.4 / 5.8 to within
  the probe step.
- ⚠ **The live probe is calibrated, not merely green.** Walking a synthetic
  displacement along the up-vector: 0 spills at +0, +3 and +5 → **1 at +6**
  (`PRG Status`, the measured 6.0u worst) → 3 at +7 → 27 at +12. It fires the
  moment a spill exists, with no dead zone.
- Landing captured at **1920×1247**, the owner's own shape (field 850×927, meet
  0.912, minPx 10.94, 0 clipped): every label inside its cell, all five band
  segments reading as one ring with the open stream's two lit.

### Left open

- **U32's density question stands unchanged** — 8.2px at 1280×720 is still the
  ceiling this form supports with all 47 Skills lettered.
- ⚠ **THE TAP'S SIGNAL IS WEAK IN LIGHT, AND IT IS PRE-EXISTING.** Measured on
  parchment the lit band reads L 0.561 against the recess's 0.578 — a 3 %
  luminance difference; the signal is carried by HUE (blue 170 against 183) and
  by the label going `--pda-hot`. This is ADR-063 U2's own finding — a saturated
  gold is inherently high-luminance and cannot signal by value against a light
  ground — and the honest fix is the ramp's INK rung, not a bigger alpha. Named
  here rather than quietly widened, and it is not a regression: the same 3 % gap
  existed before this pass, against raw parchment instead of a defined recess.

---

## Update 35 — the flag and the losing drawing are retired (2026-08-23, owner)

_"ok integrate in homepage."_ The carrier had been the homepage's reading 03
since U33, but it reached the page through `SUBSTRATE_SECTION` with U25's
SECTION drawing still on disk as the one-constant alternative. U33's own Left
open said what to do about that — **"leaving a flag in place is how a surface
ends up maintaining two"** — and the owner has now read both live.

### What went

|                                       |                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `map/pda/flags.ts`                    | deleted — the whole file was this one constant                                                                                             |
| `map/pda/PdaSubstrate.tsx`            | deleted (855 lines: the SECTION drawing, `substrateLayout` / `substrateExt` / `SUB_FIT`, `substrateLettering`, `estateFootprint`'s caller) |
| `tests/lib/pda-substrate-fit.test.ts` | deleted — 24 assertions, all of them about the deleted drawing                                                                             |
| `PdaConsole`                          | 6 branches → straight line; `section3` gone, `crop3` is `carrier3.crop`                                                                    |
| `pda-flight` / `pda-viewbox`          | 12 branches → straight line                                                                                                                |
| the lab's `shipped` variant           | deleted — see below                                                                                                                        |

Git history is the archive; the drawing is one `git show` away and its ADR
(U25) is unchanged above.

### What stayed, and one of them nearly did not

⚠ **`estateBand.tsx` STAYS.** It looks like SECTION's private helper — SECTION
was its only production consumer — but `VariantManifold` imports
`ESTATE_CELL_W/H` and `estateSlots` from it, and Manifold is the surviving
round-nine alternative that U25 explicitly kept. Deleting the drawing's helper
along with the drawing would have taken a live lab variant with it, silently,
because nothing in the production tree points at either. **A file's consumers
are not always in the tree you are cleaning.**

`pdaFit.ts` stays whole — `fitExt` / `cropAround` / `FitSpec` are shared with
readings 01 and 02. Only `SUB_FIT`, which was declared inside `PdaSubstrate`,
went.

### The lab's baseline is now a variant like any other

`shipped` was an entry OUTSIDE the `DRAWINGS` record — a `drawing === null`
branch mounting production's `ViewSubstrate` with bespoke props, plus its own
`liveLayout`, because the shipped drawing was not an `IslVariantProps` drawing.
`VariantCarrier` already re-exports the production module wholesale, so the
escape hatch had nothing left to reach:

- `IslVariantId` loses `"shipped"`; `DRAWINGS` is `Record<IslVariantId, …>`
  again rather than `Record<Exclude<IslVariantId, "shipped">, …>`, so the
  compiler is the guard for every id with no carve-out.
- The shell's default variant is `carrier`.
- ⚠ `capture-substrate-lab.mjs`'s default `--v` list said `shipped`; it says
  `carrier`. **The rest of that list is still round one's, which stays a known
  hole** — every direction added since is ungated unless named. The durable fix
  is defaulting to `ISL_VARIANTS`, which is a ~38 × 2 × 2 sweep and its own
  pass.

### And `VIEW_BOX[3]` stopped lying

`PdaViews`' shared crop record carried `SUBSTRATE_VIEWBOX` throughout U33 —
SECTION's crop, for a reading the landing page did not mount. `pda-viewbox`
worked around it by resolving reading 03 at its own boundary and said so in a
comment. Both are gone: the record carries `CARRIER_VIEWBOX` and the guard
reads it straight, so the shared constant and the guard cannot drift apart
again.

### Verification

- **941 unit assertions** across 48 files (was 965/49 — the 24 that left are
  `pda-substrate-fit`'s, all about the deleted drawing). `npm run verify`
  exit 0.
- `capture-substrate-lab --v carrier,manifold`: GATES PASSED, 8 samples, 0
  collisions / 0 clipped / 0 overflow, both themes, both presets. ⚠ `manifold`
  is in that run deliberately — it is the variant that shares `estateBand`, and
  a gate that skipped it would not have caught the deletion above.
- `services-ring-smoke`: 21 desktop cases.
- The lab loads on its new default with 47 cells and 56 lettered strings, no
  `Shipped` control, every other direction intact.
- The landing re-captured at 1920×1247: field 850×927, meet 0.912, minPx 10.94,
  0 clipped — byte-identical readings to the pre-retirement capture, which is
  the point: **the homepage did not change, only what it is possible for the
  homepage to be.**

---

## Update 36 — the hub answers for a substrate, not just for a Skill (2026-08-23, owner)

_"maybe when you click on for example pattern or voice the center shows what it
means."_

### The content was already there, and it lettered nowhere

`CaseMapShape.meaning` is the map's only prose — one sentence per shape, ≤96
characters, the single field the projection does not uppercase. U23 lettered it
on the divided plate; U25 carried it in a stratum head; the carrier had no room
for a paragraph anywhere on a dial of 47 arc labels. So a required,
envelope-scanned content field survived two redraws **as content the drawing
held and never said**, while the hub explained the reading in general terms.

The hub is where it fits, because the hub is the one region on this plate sized
for reading rather than scanning.

### What the band does now

Each of the five band segments is a `.fl-pda-hit` group shaped exactly like a
cell's — one transparent path over the recess, one `textPath` label. Clicking
one pins it; the hub prints the shape's NAME and its sentence.

- ⚠ **THE WHOLE SEGMENT IS THE TARGET, NOT THE WORD.** A `textPath` run is a
  thin ribbon on a curve, so hit-testing the glyphs would give the reader an
  eleven-character target bent around a corner. The recess is the object the
  name belongs to and it is 36 units deep for its whole sweep.
- ⚠ **`fill="transparent"`, NEVER `none`** — SVG events fire on
  `visiblePainted` and `none` reports no paint. Same trap ADR-069 recorded when
  three person-led cells stopped being clickable.
- **Pinning is mutually exclusive with a pinned cell, enforced at both
  setters.** One hub displays one thing; two independent pins would make the
  priority order in `Aperture` a silent tiebreak the reader can neither see nor
  undo. `litKey` follows a pinned shape, so clicking a name also lights that
  region's cells and dims the rest — the connection between the word and the
  material, for free.

### The count row came back, and a guard from the owner's own ruling killed it

The first cut put `14 SKILLS` between the title and the sentence, on the pinned
Skill readout's chrome rung. `substrate-lab-fit` failed it:
**"the nameplate's count row came back."**

That assertion exists because U28 removed exactly this row on the owner's
instruction — _"just give a brief explanation, just one text. Don't talk about
47 encoded skills"_ — and its comment names the failure mode precisely:
**every future pass that wants to say how much reaches for a digit first.**
This drawing counts by AREA. The guard caught the author of this update doing
it, which is the whole reason it was written as a guard rather than a note.

The count survives in the `aria-label` alone, where it is the accessible
equivalent of an area a screen reader cannot perceive.

### `SHAPE_PER` is 27, and it is the hub's geometry talking

The block carries a 17-unit title the brief does not, so it is ~37 units taller.
A dodecagon punishes height and width **together**: its worst edge normal sits
at 30°, where clearance is `apothem − 0.866·halfWidth − 0.5·halfHeight` — so a
wide block loses 0.866 of every unit it gains and a tall one only 0.5.

At the brief's 30 characters `pattern` cleared its wall by **17.7 units** —
inside the pinned-Skill threshold of 16, but by 1.7, and a guard sitting on its
value is one this ADR has retired three times. At 27 every meaning keeps its
line count and the worst corner clears by **35.2**. Squarer beats wider in a
round well, and it cost one wrap constant.

The guard is set at **24** — the brief's own standard, not the pinned Skill's 16.

### The focus ring was painting a rectangle around a wedge

⚠ **`outline` ON AN SVG GROUP IS DRAWN AROUND ITS BBOX**, and nothing on this
plate is a rectangle. A band segment's box measures **151 × 86** around a shape
filling maybe half of it, so Chromium's UA ring landed squarely on the
neighbouring cells and read as a stray white rectangle. It was doing this on the
47 cells already; a wedge four times the area is what made it visible.

⚠ **AND IT PAINTS ON A MOUSE CLICK.** Chromium exempts natively-clickable
controls from the ring after a pointer press; a `<g tabindex="0">` is not one.

⚠ **THE REPLACEMENT KEYS ON `:focus`, NOT `:focus-visible`.** Measured on the
live landing: `element.matches(':focus-visible')` returned **false on the very
group the UA was painting its ring around**. The pseudo-class is not reliable
for SVG groups in this engine, and suppressing the UA outline while gating the
replacement on an unreliable selector is how a keyboard user ends up with no
focus indicator at all. `.fl-pda-hit` now clears `outline` in every state and
strokes its FIRST path — the transparent hit shape — so the indicator traces the
target exactly. Fixes the cells too.

### Guards

- `carrierShapeFits` — per shape: the wrap is WHOLE (⚠ `wrapLines` SLICES at
  its cap and the tail vanishes from the drawing AND from the lettering
  declaration, so every per-line measure still passes — U20's finding on
  `gate`), every line inside `BRIEF_MEASURE`, and the block clears the hub's
  twelve edges by >24.
- The lettering declares `shape.{key}.title` and `shape.{key}.meaning.{i}`, so
  the fit walk sees them. ⚠ The band's name is declared twice on purpose — once
  as the arc label at `BAND_FS`, again at the hub's rung — because they are two
  strings on two measures and a guard walking one is blind to the other.
- ⚠ **The sentence is asserted to be the RECORD's**, not a copy authored in the
  component: `meaning` is scanned by `cases-registry` for the confidentiality
  envelope, and a drawing that paraphrased it into its own constant would put
  client prose on the public page outside every content scanner — precisely how
  `8 TEAMS` shipped (U15).
- ⚠ **The smoke's containment walk now covers the five band labels for free**,
  because a band group has a cell group's exact shape. Nothing checked whether
  a substrate name sat inside its own segment before.

### The name is said twice, and this surface normally bans that

A console head, a foot title and a designator were all deleted for exactly that
(ADR-063 U1, ADR-070 U8). The precedent that licenses it is one level down on
this same drawing: a pinned CELL letters its Skill's name in the hub while the
arc under the pointer letters it too. The band paints at ~8px and the hub at 17
— **a pinned readout MAGNIFIES what was clicked, which is how a reader knows the
click landed.** Restating a label the reader did not choose is the defect;
confirming the one they did is the affordance.

### Verification

- 942 unit assertions across 48 files; `npm run verify` exit 0.
- `capture-substrate-lab --v carrier`: GATES PASSED, 4 samples, both themes.
  ⚠ **The resting text count is unchanged at 56** — the readout exists only on
  click, so the drawing at rest is byte-identical.
- `services-ring-smoke`: 21 desktop cases. Live containment: **0 spills over 520
  glyph positions in 52 groups**, 41 of them the band labels now covered.
- All five shapes walked live: 3–4 lines each, hub clearance 27.7–41.9 measured;
  toggle-off returns the brief; clicking a cell releases a pinned shape and vice
  versa; `aria-pressed` tracks both.
- **Driven with a REAL mouse click on the real landing**, through the corridor's
  pointer-events maze, at 1920×1247 — the hub swaps from the brief to VOICE's
  meaning and the wedge outlines itself in gold.

### Left open

- `CaseMapShape.evalMethod` — what "good" is checked against — still letters
  nowhere on this console. It is the field that makes a substrate inheritable
  and it is the obvious third rung for this readout, but the owner asked for
  what a shape MEANS and adding a second answer to a two-line block is how a
  readout becomes a table. Named so the next pass decides it deliberately.
