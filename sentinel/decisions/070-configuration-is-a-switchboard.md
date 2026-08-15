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
