# ADR-071: The skill is what flies to the substrate

- **Status:** Accepted
- **Date:** 2026-08-19
- **Owner call:** yes — "we need to tweak something ... the workflow card
  moves to the center but it doesn't make sense because the substrate tab is
  actually an overview of all the different skills. What should happen
  instead is that the skill cards on the left side ... find an elegant
  animation way where you go to the substrate map, and it shrinks and gets
  fitted inside the pie chart"
- **Supersedes:** ADR-070 U33's SEATED CARD on the carrier (its `CARRIER_SEAT_RECT`,
  `HUB_K`, `CARRIER_HUB_K`, `carrierSeatClearance`, and the `SeatedWork`
  branch of `Aperture` are deleted). U33's DRAWING — the compound carrier
  itself, the 47 arc-labelled cells, the five substrate names, the brief —
  is untouched. The change is which OBJECT the click sends over.
- **Surface:** `components/landing/home-v2/services/casefile/map/pda/**`, the
  casefile's lead row on the landing

## Context

U33 promoted the compound carrier and — because the carrier had no cartridge
on it — seated the selected work in the hub as the flight's third home. The
composition worked as a shape but read wrong as a reading:

> "Right now, when you go from the Configuration to the Substrate tab, the
> workflow button or card (Campaign Copy) moves to the center. But it
> doesn't make sense because the substrate tab, that overview, is actually
> an overview of all the different skills."

The carrier is an ESTATE-WIDE view. Landing a specific stream in its middle
claims the plate is about that stream; it is not. What the plate does claim
is the SUBSTRATE — the shared judgment each stream draws on — so what
should land there is the piece of substrate the stream runs on, and the
argument the stream makes for the plate is that its Skill is one of the
forty-seven.

The lab record for this is short: U33 shipped one day earlier, the reading
had been on the site for hours, and the click's terminal reading was
wrong.

## Decision

**The persistent object splits into two.** The work card is still a 1↔2
object; the SKILL is now the 2↔3 object.

- **Reading 02 hosts a SKILL CHIP** in its WHAT RUNS IT node, replacing the
  cell's value line. The chip is a distinct object with a distinct
  silhouette (square-cornered plate, `SKILL_CHIP_W × SKILL_CHIP_H` — ADR-065:
  children of a chamfered housing are square) so the reader cannot mistake
  it for a cartridge. Its material is the ENGINE'S PHYSICS FIELD at low
  alpha — the same field the carrier's cells for that substrate draw on —
  so the chip and its destination region wear the same skin BEFORE the
  flight fires.
- **Reading 03 lights the SEATED CELL.** The cell whose skill runs the
  opened stream (`selected.skillId → cell.skill.id`) stays lit like an
  `isActive` cell; it escapes the dimming rule so hovering another part
  never eclipses the seated one.
- **The hub returns to explaining the reading.** `Aperture` branches on
  pinned → brief; the seated card is gone. The brief the plate carried in
  U33 as a "when nothing has been opened" state now runs at rest AND when
  a stream is open, because the estate view is about the estate.
- **The flight is `translate + rotate + scale`.** `pdaFlight.ts`'s
  `FlightVars.dr` (optional, defaults 0) carries the destination cell's
  tangent rotation, signed by direction — negative on 2→3 so the source
  pose is unrotated at the config chip, positive on 3→2 so the source pose
  matches the tangent the reader is leaving behind. The CSS keyframe
  `flPdaDock` in `pda.css` gains a `rotate(var(--dr, 0deg))` term, and
  work-card flights (1↔2) pass no `--dr` — CSS fallback keeps them
  byte-identical to before.
- **The chip DISSOLVES on landing.** `.fl-pda-chip-dissolve` runs both the
  dock and a delayed `flPdaChipDissolve` opacity fade; the two clocks live
  on one element, cleanly separated by `animation-delay`. After 420 + 240ms
  the chip is gone and the cell's own arc label (which was underneath the
  chip all along, at the same text and the same rendered size) carries the
  identity forward.
- **`dk = CARRIER_LABEL_FS / CHIP_FS`**, and this is arithmetic. The chip's
  own text is at CHIP_FS 14 and the carrier's arc labels at LABEL_FS 13, so
  the flight's uniform scale (13/14 ≈ 0.929) lands the flown text at the
  size the 47 arc labels around it letter at. Continuity by construction.
- **The work card has NO home on the carrier now.** `workRectFor(3, id)`
  returns `null`, and the console's fallback grows to cover it: 3→1 blooms
  (existing), 3→2 blooms (new).

### Two objects, two homes each, ONE rect read per transition

```
                grid                     grid
                cartridge   1 ↔ 2   ←—→  core            (work card, unchanged)
                                          |
                                          | 2 ↔ 3
                                          v
                                    chip in module ←—→ cell arc midpoint
                                                                (skill chip, new)
```

`entryFor(from, to, workId, skillId)` computes BOTH gestures from the same
click's rect read, so a transition landing 420ms later still has the ONE
box the flight math was measured against. Both gestures share the interrupt
guard — a re-clicked transition rasters BOTH the work card and the chip,
never one of the two.

## The content join

Two years of maps had `cfg.s: [name, note]` as free-form authored text; the
name on reading 02 came from `s[0]` and had no join to the roster of 47
Skills. The chip's flight makes that gap load-bearing:

- If the flown text and the destination cell's text are different strings,
  the reader sees a chip say one thing while the cell says another — the
  cell that lit up under the flight is CLAIMED to be the skill the chip
  landed on, and the claim fails on read.
- If two configured streams point at "Brand voice" but neither joins the
  roster's `founder-tone-of-voice`, the reader has no way of asking "which
  Skill runs both?" from the estate view.

So `CaseMapConfiguration.skillId: string` was added, required for every
configured stream, with a registry guard in
`tests/lib/cases-registry.test.ts`:

> every configured stream's `skillId` resolves to a roster entry whose
> `engine` is among the stream's `shapes`.

The 24 mappings are authored in `lib/cases/content/loop-earplugs.ts`.
Twelve of them are exact matches or close-enough matches; the other twelve
are FLAGGED IN COMMENTS as best-available with the reasoning inline, so a
future author can see which ones the owner may want to revise:

- W-017 CAMPAIGN COPY → `loop-paid-social` (Paid Social, Voice) — chip
  letters PAID SOCIAL where reading 02 used to say BRAND VOICE
- W-021 CREATIVE BRIEFING → `asset-brief-generator` (Asset Briefs, Pattern)
- W-029 ASSET DECLINATION → `genai-prompting` (GenAI, Pattern)
- W-062 AD VARIANT SETS → `genai-prompting` (reused with W-029)
- W-068 ACCOUNT HEALTH → `fraud-detection` (Fraud, Validation)
- W-009 CONTRACT REDLINE → `legal-risk-methodology` (Legal Risk, Judgment)
- W-045 INVOICE MATCHING → `invoice-processor` (Invoices, Validation)
- W-049 SPEND FORECAST → `variance-commentary` (Variance, Pattern)
- W-016 DIELINE REVIEW → `loop-packaging-system` (reused with W-011)
- W-022 CMF SPEC CHECK → `cmf-file-generator` (CMF Files, Pattern)
- W-026 RELEASE AUDIT → `risk-management` (Risk Mgmt, Judgment)
- W-057 CAPACITY PLANNING → `risk-management` (reused with W-026, W-031)

Four streams needed a shape added to satisfy the engine ∈ shapes rule.
This was the honest resolution — a stream that draws on a Pattern skill IS
tapping the Pattern main by definition — rather than compromising on the
match: W-045 (+validation), W-049 (+pattern), W-022 (+pattern), W-052
(+stakeholder).

The `cfg.s` tuple stays as `[fallback, compositionNote]`. `s[0]` is now a
per-stream display fallback that the city and hover card still use (they
do not carry the roster); `s[1]` is the composition note, unchanged.

## What survived, and what didn't

Deleted:

- `CARRIER_SEAT_RECT`, `CARRIER_HUB_K`, `HUB_K` (private), `CART_W`/`CART_H`
  (private), `carrierSeatClearance`, `CarrierPlate.seat`
- `SeatedWork` component
- Aperture's `selected`, `still`, `entry` props

Kept:

- The compound carrier's geometry, its 47 cells, its five substrate names,
  its brief, its hub, its arc label rotation math, its physics fields
- `Aperture`'s pinned-cell readout (unchanged) and brief (now
  higher-priority — no seated card branch above it)
- `TapWash` — the band segments the stream's `taps` name still light up
- The whole SECTION drawing (`PdaSubstrate.tsx`) behind
  `SUBSTRATE_SECTION` — its estate footprint is still the WORK CARD's home
  under that flag, and its own arithmetic is untouched

Added:

- `SkillChip` glyph in `pdaGlyphs.tsx` (with `SKILL_CHIP_W`, `SKILL_CHIP_H`,
  `CHIP_FS`, `skillChipEntry` helpers)
- `configLayout.skillChip: FlightRect` — the chip's home on reading 02
- `carrierSkillDock(cell)`, `carrierChipRotation(cell)`, `CARRIER_CHIP_K`
  in `PdaCarrier.tsx`
- `ChipArrival` component — the chip's landing render on the carrier,
  wrapped in a rotate-to-tangent so `dr` cancels correctly
- `FlightVars.dr?: number` — optional rotation delta
- `.fl-pda-chip-dissolve` CSS class and `flPdaChipDissolve` keyframe

## Consequences

- **The pda-flight test's THIRD HOME suite is replaced.** The work-card
  third home is gone from the CARRIER branch (SECTION's footprint stays
  under the flag), so the tests walk the SKILL CHIP's homes instead.
  Reciprocal `dk` products, exact similarity between chip and dock, and
  `CARRIER_CHIP_K` as `LABEL_FS / CHIP_FS` are all pinned.
- **`pda-card.test.ts`'s "hub card is that same drawing at a third size"
  block is deleted.** The seat card is gone; the two-home parity between
  the grid card and the seat card remains. A short block replaces it,
  asserting `CARRIER_CHIP_K = CARRIER_LABEL_FS / CHIP_FS`.
- **`substrate-lab-fit.test.ts` gains a "landing cell for every configured
  stream" guard.** A configured stream whose `skillId` does not resolve to
  a cell would silently fall back to raster on 2→3.
- **The reading 02 fs floor of 12 still holds.** The chip's engine tag was
  authored at 10 units first (chrome elsewhere) and immediately failed
  `pda-viewbox`'s floor; 12 is the corrected rung. The tag reads
  STRUCTURAL against the skill (fs 14, `.04em`) through TRACKING and CASE
  rather than through size.
- **CSS animation-delay is what sequences the dissolve.** Chained via JS
  would cost a re-render mid-flight; the CSS shorthand carries both
  animations on one element cleanly.

## Loose ends

- **Twelve skill mappings are flagged for owner review** (see the FLAG
  comments in `loop-earplugs.ts`). The rendered SKILL name on reading 02
  changes from the authored `s[0]` to the roster's `short` — some pairs
  land clean (NDA Pre-Check → NDA Pre-Check), others require the owner to
  read the chip and confirm which Skill it should point at.
- **No hover chip on rest.** The chip renders in reading 02 whenever a
  configured stream is open; it does not appear anywhere else. A future
  pass could let the reader hover ANY cell on the carrier to preview its
  chip, but that is a different reading and not this decision.

---

## Update 1 (2026-08-19, owner) — the arrival is a SHAPE MORPH, not a dock

**The first cut shipped the same day and the owner called it within the
hour:** _"the transition is just bad cringe … Right now, we just see a frame
floating, and then it fades away, which is the last thing I want."_ He was
right, and the defect was structural, not a tuning miss: the chip flew as a
TRANSFORMED RECTANGLE (translate + rotate + scale) onto an ANNULAR WEDGE.
Two shapes that never agree make the closing fade the moment the trick is
visible — the "landing" was a rectangle hovering over a differently-shaped
cell, then evaporating.

### What replaced it

**The plate's journey is now the path itself.** CSS `d` is animatable when
both endpoints share one command structure, so:

- `CarrierCell` stores its drawn `outer` AND `inner` polylines, and its `d`
  is built from those same arrays — one source for the drawn cell, the
  flagship's provenance line, and the morph target.
- `carrierChipMorphIn(cell, vars)` emits a `{from, to}` path pair in the
  CARRIER's units: `from` is the chip's incoming rectangle (the flight pose,
  derived from `dx/dy/dk`) sampled to the cell ring's own point counts —
  top edge ↦ outer arc, bottom edge (walked back) ↦ inner arc, `flip` keeps
  the correspondence screen-aligned so the morph never crosses itself — and
  `to` IS the cell's own `d`, byte for byte.
- `carrierChipMorphOut(cell, vars, chipRect)` is the reverse, in the CONFIG
  board's units, the wedge projected across crops through the affine the
  flight already describes (`s = dk · chipW / dockW` — derived, never a
  second constant).
- The arrival render is three layers on one journey: an opaque GROUND
  morphing rect → wedge; a SKIN carrying the colour ramp (dawn-quiet
  annealing into the lit gold — reversed on the way home, via `--skin-*`
  vars); and the NAME on its own dock flight, computed on the name's own
  rects (`skillChipNameRect` / `carrierSkillNameRect`) because the name is
  left-anchored in the plate and centre-anchored on the arc.
- **The closing fade is invisible by construction:** every layer ends
  pixel-identical to the seated cell (or, on 3→2, to the real chip revealed
  beneath at touchdown — `.fl-pda-chip-reveal` holds it hidden until then,
  so the object never appears twice).
- **The seat lights ON TOUCHDOWN** (`.fl-pda-seat-arm`): a paint-hold
  animation keeps the destination cell at resting values for the morph's
  duration — a slot already lit at t=0 spends the arrival before it happens.

### The morph got its own clock, and that is measured

Sampled live, the dock's `cubic-bezier(0.22, 0.9, 0.3, 1)` at 420ms put the
morphing path **87 % of the way home inside the first 100ms** — the whole
shape change spent in under seven frames. The dock's curve exists for the
work card, an object that must feel snappy because it is the same drawing at
both ends; the morph is the one gesture whose entire point is being watched.
`PDA_MORPH_MS = 620` on `cubic-bezier(0.45, 0.05, 0.22, 1)` (ease-in-out,
deceleration-biased) keeps the rectangle-becoming-a-wedge on screen through
the MIDDLE of the travel. `PDA_FLIGHT_GUARD_MS` rose 450 → 650 — the guard
covers the LONGEST arrival gesture, or an interrupt inside the morph's
window computes its pose from a rect the object has not reached.

### What was verified, and how

- `pda-flight` pins the structure contract (equal command counts both
  directions for EVERY configured stream — a mismatch does not error, it
  snaps the interpolation discrete), `morph.to === cell.d` byte-equal, the
  entry rect equal to the flight pose, and the name box centred on the arc
  point.
- `scripts/capture-adr071-morph.mjs` samples the COMPUTED `d` mid-flight on
  the live page (the path's origin sweeps continuously — Chromium's `d`
  interpolation confirmed playing, both directions) and captures frames
  under a 12× slowed animation clock, because Playwright's click+screenshot
  roundtrips cost 400–900ms and every "140ms after click" frame is
  post-fade fiction otherwise.

### Superseded from the first cut

`ChipArrival` (the transformed-SkillChip dock), `.fl-pda-chip-dissolve`, and
the `SkillChip` mount flying on 3→2 are deleted. `carrierSkillDock` survives
as the flight's ARITHMETIC ANCHOR (the rect pair `pdaFlight` needs, and the
centre the name box shares) — what the reader watches land is the morphing
path, not that box.
