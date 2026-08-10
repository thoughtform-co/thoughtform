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
