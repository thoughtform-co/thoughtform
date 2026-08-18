# Maintenance — recurrence engine

> **When to open this:** at the start of any non-trivial change, and at the **end** of any conversation that modified code.  
> It connects **bugs** and **new features** to the same durable surfaces: `sentinel/`, `.claude/rules/`, `.claude/skills/`, and [LANGUAGE.md](../LANGUAGE.md).

---

## Cycle A: post-incident capture checklist

Run after **any** code change, before merge/push. If **any** question is _yes_, do the _then_ line before the work is “done”.

| #   | Question                                                                                                                 | If yes, then…                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1   | Did the fix take **more than two iterations**?                                                                           | Open or extend an ADR in `sentinel/decisions/`.                                                      |
| 2   | Did we **revert** a previous fix or go in circles?                                                                       | Open an ADR; link the prior attempt and what failed.                                                 |
| 3   | Did we discover a **class of bug** (sticky + fixed overlay, scale-edge drift, stale `onEnter`, fast-scroll scrub, etc.)? | Add a **pattern** to [BEST-PRACTICES.md](BEST-PRACTICES.md) with a short title and “why it matters.” |
| 4   | Must **two or more files** change together for the fix to hold?                                                          | Add or extend a **path-scoped** rule in `.claude/rules/` and mirror in `.cursor/rules/*.mdc`.        |
| 5   | Would a **runtime check** (Playwright, manual scroll script, console assert) have caught it earlier?                     | Add steps to the relevant `SKILL.md` debugging recipe, or to this repo’s test notes.                 |
| 6   | Does the fix **change an architectural assumption** (auth, scroll, layers, public API of a feature)?                     | Update or create an **ADR**; don’t only patch code.                                                  |

“Non-trivial” is the OR of the above — not a vibe check.

---

## Cycle B: new-feature scaffolding (before you build)

Use when adding **new surface area** (section, dashboard, public API, major hook), not for one-liners.

1. **Scan** `sentinel/decisions/`, `.claude/rules/`, and `.claude/skills/` for **prior art** in the same domain. Cite it in the ADR you open next.
2. **Open** `sentinel/decisions/NNN-short-name.md` with **Status: Proposed**. Document the **shape**, **alternatives rejected**, and **links** to related ADRs (e.g. 008/010 for anything touching landing v7 + brandmark).
3. **Build.** If a **recurring workflow** appears (debug steps, checklists, compositing invariants), add a `.claude/skills/<topic>/SKILL.md`.
4. **Wire paths:** add `.claude/rules/<area>.md` and `.cursor/rules/<area>.mdc` with `paths` / `globs` and pointers back to the ADR + skill.
5. When shipped: set ADR to **Accepted**; keep rules/skills in sync with reality.

If the feature would **contradict** an existing ADR (e.g. compositing, auth), the contradiction must be **resolved in the ADR** before merge — not as a drive-by.

---

## When to NOT capture

Skip Sentinel updates for **trivial** work so the ledger stays signal-rich:

- Typos, copy-only, comments-only
- Dependency bumps with no API migration
- Generated files (e.g. committed migration outputs) where the _intent_ is already in a prior ADR
- Formatting-only rewrites with no behavior change

If unsure, use **one** of the questions in [Cycle A](#cycle-a-post-incident-capture-checklist) as the bar: a single _yes_ means capture.

---

## Ledger

Chronological record of repo-wide maintenance passes (distinct from the Cycle
A/B capture rules above). Newest first.

### 2026-08-18 (latest) — The Carrier ships, and the hub is the flight's third home (ADR-070 U33)

Owner asked to wire the latest substrate drawing to the landing page. That is
one import in principle; the promotion turned up four things the lab could not
see, three of which were green in every guard. Cycle A rows 1, 3, 4, 5 and 6.

- **The drawing had nowhere for the flying object to land, and nothing would
  have thrown.** The Carrier has no cartridge on it, so `rectFor(3, id)` returns
  `null` — no throw, no failed render, no failed guard, and ADR-069's persistent
  object silently stops existing on a third of the surface. The HUB is the third
  home now, seating the shared `Cartridge` at a DERIVED `HUB_K`
  (`LABEL_FS / CART_TYPE.title` = 1.1304), whose box carries the cartridge's
  aspect exactly, so the flight's uniform `dk` needs no distortion term.
- **A crop must be elastic on whichever axis is SLACK.** U32's height-fixed crop
  was true at the three lab presets and false on a tall desktop window — 132px
  of dead panel at 845 × 950, within 5px of the 265px that forced the same
  generalisation on this same reading in U15. Third time shipped, third time
  green, because `minPx` measures a drawing against its own crop.
- **`CARD_BOX` is the card silhouette's one source** — `176 × 136` had been
  declared in three files, which is ADR-069 U1's finding one level out.
- **The smoke's overlap guard cannot be asked about arc-set type.** 22 reported
  collisions with nothing touching: `getBBox` is an ink proxy only for
  HORIZONTAL type. `readPda` splits flat labels (box test) from `textPath`
  labels (per-glyph origins), and pins the arc-label count, since a `textPath`
  that stopped resolving would empty the list rather than fail it.
- **The lab is a window onto production, not a copy** — `VariantCarrier`
  re-exports `PdaCarrier`, so `substrate-lab-fit` walks the shipped module.
  Lab → production only; `app/(internal)` is proxy-blocked in production.
- `SUBSTRATE_SECTION` (`pda/flags.ts`) restores U25's SECTION drawing untouched
  and gates every reading-03 branch in `PdaConsole`, including `rectFor`. It is
  a comparison lever, not a permanent seam — when the owner has read both live,
  the losing drawing and its guards should go.

Verified: 967 unit tests across 49 files; typecheck and lint clean. Measured
live on all three fields: 0px dead panel on both axes, `meet` 0.6339 / 0.9767 /
0.7495, `minPx` 7.17 / 11.04 / 8.47. Casefile fit smoke passes with the Carrier
live at 1280×720, 1920×1080 and 2560×1330; light-palette smoke passes. Flight
verified per card on a true 1 → 3 with `dk` constant at 0.8690.

### 2026-08-17 — Skill facet candidate: a straight pie made of 47 Skills (ADR-070 U26, proposed)

Owner rejected SECTION as the final visual direction and corrected the lab's
`21 · Wheel`: keep a pie chart's part-to-whole read, reject the circle, and
make the figure itself out of the Skills. Cycle B; no production promotion.

- Added `37 · Skill facet`: one dodecagonal annulus made from 47 interactive
  shards, five contiguous substrate runs, one equal angular step per Skill.
- Existing `26 · Facet` supplied the straight-edge geometry lesson but not the
  payload — it drew five large wedges and reduced Skills to rim ticks. The new
  direction reverses that relationship.
- Second owner correction: remove external labels and long copy. Each group
  seats only NAME + COUNT inside its own shard run; the five leaders,
  callouts and `meaning` paragraphs are deleted. Hover/focus turns the central
  dodecagonal hub into the selected Skill's short name, substrate, team and
  status. Five flagship outer chords carry green provenance.
- The dodecagonal perimeter's 3.41% radial modulation is named and guarded; the
  compared quantity remains exact as shard count / angular sweep.

Verified: 928 unit tests across 49 files; typecheck and lint clean; browser fit
readout at p1280 dark/light and p1920 dark reports 0 collisions, 0 clipping,
0 overflow, minPx 7.76 / 10.94. SECTION remains the live reading until owner
verdict on this candidate.

### 2026-08-17 (later) — Reading 03 answers the click; the persistent object gets a third home (ADR-070 U25, ADR-069 U2)

Owner: _"when you click on a work it becomes a configuration, and when you
click configuration you go to substrate — but the substrate feels completely
random. Reading 01 and 02 share the click, and 03 throws it away."_ Eight
rounds of substrate-alone drawings had kept trying to fix a proportion
problem that was never the problem: the record already carried the join
(`PdaWork.taps`) and the site's brief promised the drawing out loud
(_"below grade runs the shared substrate — encoded once for one team, tapped
by the next"_). Cycle B (round nine as a proper capture cycle), then Cycle A
rows 1, 2, 3, 5 and 6.

- **The reported defect was random-feeling.** The actual defect was that
  reading 03 SHARED NOTHING with the two above it — no click's context on
  the surface, no persistent object across the transition, and the fit
  guards measured every drawing against its own crop rather than against
  the readings beside it.
- **Round nine ran three candidates in the lab:** `34 · Section` (recommended,
  estate band + gallery + strata + shaft), `35 · Manifold` (the
  round-eight vessel rig with the estate band above), `36 · Control`
  (U24's own partition with the estate band above, no conductors).
  Captured at both themes and both presets; every gate green. Owner
  verdict on the contact sheet: SECTION.
- **Promotion:** `PdaSubstrate.tsx` rewritten as the SECTION drawing.
  `estateBand.tsx` extracted as a shared production module (twenty ghost
  cartridge footprints, five gallery lane markers). `sectionRig` /
  `estateBand` in the lab folder deleted — the config lab's own precedent
  (two copies of a measured drawing is how the lab starts passing what
  production would fail).
- **The proportional claim moved from AREA to BODY.** U24's `area is the
count` was honest when the whole region was bed; SECTION's head is
  fixed chrome (a fs 20 name with a two-line fs 13 paragraph beside it),
  so `bodyPerSkill = (strataH − 5 × headH) / totalSkills` is the shared
  unit — asserted at five field shapes. Every ext still goes to bodies.
- **`entryFor` factored into `rectFor`.** The old code hard-coded 01↔02 as
  the only flying pair and handled 03→01 as a bloom; the new code walks
  any pair through a `rectFor` helper that returns the source or
  destination rect for any reading. `pdaFlight` itself is unchanged.
  `pda-flight` gained 12 tests covering 1↔3 and 2↔3 round trips at the
  binding and tall viewports.
- **Cycle A rows 1, 2, 3, 5, 6 fired.** Row 1: more than two iterations
  (round nine's three-way capture is the honest tally, plus one coordinate
  bug caught by the fit readout on the first take). Row 2: reverses U24's
  reading-03 composition entirely (roster kept, partition replaced). Row 3:
  a class of bug — SVG plate coordinates being strata-block-relative but
  rendered as crop-space, invisible to per-string fit assertions because
  the strings still fit their own measures. Row 5: `plateAt` now returns
  crop-space coordinates and `pda-substrate-fit` walks the invariant. Row
  6: reading 03's whole architectural assumption changed (it now depends
  on the selected work through the estate band, without violating U17's
  clause that the subject at rest is still the layer).

Verified: 916 unit tests across 49 files (up from 892), Playwright capture
gates green on shipped + manifold in both themes at p1280/p1920, lint and
typecheck clean.

Loose ends kept honest, both in ADR-070 U25 §Left open and here:

- The bed's rest opacity is a lever; the owner may want to see the
  selection's bed-lift on the real landing before we tune it.
- The lab's default `--v` is still round one's seven, unchanged from U23.

### 2026-08-17 — The Skills come back to reading 03; U23's second half reversed (ADR-070 U24)

The owner's read one day after U23 shipped: 01 and 02 "feel super elegant", 03
"feels off" — the Skills are missing, the size difference does not read, the
boxes are not "fully optimized", the padding is tight, the title sits high.

⚠ **U23 MADE TWO CHANGES AND ONLY ONE WAS RIGHT.** The divided plate fixed the
composition. Deleting the 47 named Skill plates for a tick graduation did not:
**the count survived, the DENSITY did not.** 01 is a field of cartridges and 02
a board of modules, both thick with named parts; 03 became three strings over
texture. A tick is countable, a plate is countable AND readable.

The plates return in two columns per region, the graduation goes (its 26 units
are what make the lightest region's arithmetic close), the count letters at the
title's size, `GROUT` 4 → 10, title baseline 22 → 32. Lettering 20 → 67.

⚠ **The run is SEATED AT THE FLOOR** — top-anchored shipped in the first capture
and was wrong on sight: the head is a fixed cost against a count-proportional
area, so the heaviest regions carried bare field UNDER their plates and it read
as a hole. ⚠ **The lightest region is the binding case** (2.7u spare at rest)
and **a third paragraph line overflows it** while every per-string assertion
still passes — the guard walks the actual wrap.

Verified: 892 unit tests, `pda-substrate-fit` re-pointed at the plate grid (17
cases), 21 services-ring smoke cases with 67 labels through the pairwise overlap
walk, and captures on the real landing at 1280×720, 1920×1247 and in light.

### 2026-08-16 — Reading 03 ships `33 · inlay`; the record learns to speak in sentences (ADR-070 U23)

Production's reading 03 is one plate divided into five regions of material —
area is the Skill count, no gutters, one outer cut — each lettering its name,
its count and ONE PARAGRAPH, over its own physics field, with a graduation of
one tick per encoded Skill at its base. It supersedes U16's pattern cards; the
lab's local copy is deleted and `shipped` mounts production.

`CaseMapShape.meaning` is a new record field (≤96 chars, measured) and the only
one the projection does not uppercase — the map's first prose, scanned by
`cases-registry`. The 47 named Skill plates went with the card stack; lettering
fell ~71 → 20 strings.

⚠ **Promotion was a copy of the drawing and a RE-FIT of the box.** The lab's
crop (aspect 0.8176) is height-bound at the narrowest measured field (1440×800,
0.8071) by four thousandths, which an elastic crop cannot afford — `fitExt` has
no lever there when `maxW: 0`. `BOX_H0` is 696. **The ceiling on a width-bound
elastic crop is the narrowest field's aspect**, which generalises to any future
`pdaFit` reading.

Verified: 891 unit tests, `pda-substrate-fit` rewritten for the new geometry,
21 services-ring smoke cases, and captures on the REAL landing at 1280×720 and
at the owner's 1920×1247 (no dead panel, minPx 10.94).

### 2026-08-16 — A pass-through default hung four substrate drawings; round nine (`33 · inlay`)

`roundSix`'s `Field` wrapper defaulted its `p` to **0** and forwarded it
explicitly. `p` is `validation`'s lattice PITCH and a **loop step** in that
painter (`x += p`), and a destructuring default only fires on `undefined` — so
`mosaic` · `grade` · `tanks` · `stack` spun during render and never mounted.
Production was never affected: `PdaSubstrate` passes `p={14}`. Fixed at both
ends — the painter clamps a non-positive pitch, the pass-through has no default.

Two guard gaps it exposed, both captured in
[BEST-PRACTICES.md](BEST-PRACTICES.md) (§Content Guards): `substrate-lab-fit`
was 217 green tests throughout because it walks declared `lettering()` and never
mounts a component; and `capture-substrate-lab`'s default `--v` list is still
**round one's seven**, so later directions are only gated when named. Making
that harness default to the registry is the durable half and is **not yet done**.

Then round nine: `33 · inlay` — the owner picked 22 `mosaic`, asked for the
texture of 8 `gallery` / 11 `cards`, then cut the copy to a title plus one
paragraph. Partition IMPORTED from mosaic; density per unit area; the internal
hairlines replaced by a grout channel (a 1-unit rule paints 0.65 device px at
this meet). Contracts in [`.claude/rules/proof.md`](../.claude/rules/proof.md).
No ADR — the lab precedent is that a direction earns one when it wins.

### 2026-08-15 — The cartridge frame means WORKSTREAM; six new cluster-body directions (ADR-070 U17 rejected, U18 opened)

Round four (2026-08-14) built three selected-work-aware substrate directions
(`backplane` · `bus` · `cutaway`), promoted `backplane` to production, and
rebuilt reading 03 around the R4 cartridge at `layout.core` with an identity
flight between 02 ↔ 03. Owner's verdict the next morning: the cartridge
frame means WORKSTREAM on this surface (reading 02 uses it for the seat
card), so anchoring reading 03 on it made the substrate tab about the
workstream again. Reading 03's subject is the shared layer beneath every
workstream and its drawing may not depend on a selected work. Cycle A
row 2 fired (revert of a shipped fix) plus row 6 (an architectural
assumption changed).

- **Production reverted cleanly to U16.** Four production-side files
  (`PdaSubstrate.tsx`, `PdaConsole.tsx`, `tests/lib/pda-substrate-fit.test.ts`,
  `tests/lib/pda-viewbox.test.ts`) rolled back to committed HEAD; the lab
  shell's shipped branch re-points to U16's `ViewSubstrate` signature. The
  three round-four variants stay in the lab as recorded losers, guarded by
  `substrate-lab-fit` on their own.
- **Round five explores six new estate-scoped directions**, sharing one
  principle drawn from the CP2077 reference boards: a cluster is a PHYSICAL
  BODY OF LIKE OBJECTS whose depth IS the count. `hand` (fanned deck),
  `piles` (offset stacks), `constellation` (five nodes ring a total, wire
  trunks braid), `loom` (5 chips × N wires each → one SUBSTRATE chip),
  `leaves` (fore-edge combs), `roots` (five trunks on one bus).
- **New mechanical guard: `MARK_COUNT_VARIANTS`.** Every round-five
  variant exports `<name>MarkCount(record, key)`; the guard walks it and
  asserts marks per cluster equals `record.shapes[k].skills`. A fan that
  silently dropped a plate would fail the guard before it shipped — the
  numeral could still say 07. This is the mechanical answer to the risk
  that a MASS drawing lets its mass drift from its count.
- **THREE FIT DEFECTS caught in-lab the hour they were written**, all filed
  in ADR-070 U18 as generalisable: (1) a text-anchored-middle label's
  measure is its label column, NOT the mass silhouette it labels; (2) an
  edge-adjacent flagship label collides with the identity strip's count
  column — push cluster spread inward; (3) a rightmost-column flagship
  label extends past the crop's right edge — force the flagship side to
  face the crop's centre.
- ⚠ **CLASS OF LESSON WORTH KEEPING**: on this surface, chrome
  silhouettes carry semantic weight. The cartridge is WORKSTREAM; a
  module is A THING THAT RUNS; a diamond is a hub. A reading that borrows
  a silhouette from a neighbouring reading borrows its meaning too —
  which is what the round-four rejection reveals in one direction and
  what round five's brand-new geometries (fans, piles, combs, roots) are
  built to avoid.

Verified: `npm run verify` — **781 unit tests green** across 49 files;
`substrate-lab-fit` walks 110 checks including the six new mark-count
assertions; `scripts/capture-substrate-lab.mjs --v hand,piles,constellation,loom,leaves,roots`
produces 24 stills (dark/light × p1280/p1920) with 0 collisions, 0
clipped, 0 overflow, `minPx ≥ 7.8`; a production reading 03 capture at
1280×720 dark confirms the shipped U16 five-pattern-cards drawing is
unchanged (28 texts, `minPx 7.76`, 0 clipped).

### 2026-08-14 — A seated set takes its housing's diagonal (ADR-065 U5)

One owner ask, one selector: _"Proof > 02_Software-for-few — make sure that the
notch is in the bottom right corner not the bottom left."_ The tools plate's
four capability blocks (`.fl-detail__plate`) now notch **BR**.

- **It reverses a rule that named this exact set.** ADR-065 U1 wrote _"the
  dossier's plates take BL"_, and the CSS carried a comment justifying it. So
  this could not ship as a value change; it needed the law to say which diagonal
  a NESTED set answers to. It answers to **its housing's** — and this housing is
  the console, the law's one enumerated TL+BR object (U2). Sitewide TR+BL is
  untouched; the new clause can only reach a set inside that one housing.
- **U1's correction was right and incomplete.** It flipped the mockup's TL notch
  because TL is unlawful, then reached for the SITEWIDE lower end without asking
  whether a seated object inherits the diagonal of the box it sits in. ADR-070
  U13 had already met the same question from the other side and paid the opposed
  lean as a known cost — defensible for a full drawing on its own stage, not for
  13px plates sitting ~13px from the console's own BR chamfer, where the eye
  reads the two cuts as one relationship.
- ⚠ **The guard verified the wrong thing, and it is the U4 shape again.** It
  asserted `squareBL === false` — which confirms the notch is BL, not that it is
  on the right corner. Now pinned from BOTH ENDS (BR notched _and_ BL square),
  which is what fails on a drift back and on a two-notch polygon; the one-sided
  check passed both. Dry-run against the live DOM plus those two counterfactuals
  before trusting it, since a corner assertion that can only be satisfied one way
  is indistinguishable from a vacuous one until you feed it the failure.
- **Clipped CDP captures come back blank in the IDE webview** (`Page.captureScreenshot`
  with a `clip`, `fromSurface` either way). To read a 13px corner, clone the node
  into a fixed host at `transform: scale(3)` with `--dt-notch` pinned to its
  computed px and shoot the full viewport — container-query units do not survive
  the clone, which is why the depth has to be pinned and why this is only good for
  reading POSITION.

### 2026-08-14 — The session mark IS the session (ADR-059 U5)

One owner ask, filed as a QOL change: _"as a logged in user I see vince active
in the top right corner; this functionality should be folded into the icon LEFT
of the light and dark mode icon in the bottom right corner."_ Cycle A rows 1
and 3.

- ⚠ **A "SMALL QOL CHANGE" NAMED A COMPONENT NOBODY HAD RECONCILED WITH THE
  FRAME.** `components/auth/UserStatus` was a `fixed top-5 right-…; z-[1000]`
  overlay mounted from `Providers`, i.e. on every route — a second, unrelated
  instrument in the corner ADR-059 Update 1 had assigned to the nav, on a
  hard-coded offset tuned against neither. It survived four updates of that ADR
  because it never visibly collided. **An overlay outside the layout system
  does not get audited by anything that audits the layout system.**
- ⚠ **THE SLOT ALREADY EXISTED, AND FINDING IT WAS THE WHOLE DESIGN.** Update 3
  had seated a session mark exactly where the owner pointed — it named the
  session and then said nothing about it, with the email hidden in a `title`.
  The fold is that mark growing a panel, not a new control. Read the corner's
  own ADR before drawing anything for it.
- ⚠ **THE GLYPH STAYS BARE AT REST, AND THAT IS A MEASUREMENT.** Lettering the
  name beside the icon is the arrangement Update 2 §2 rejected on the numbers
  (~36px of labelled row against a ~26px strip). The panel exists because
  identity is worth a press and is not wayfinding.
- ⚠ **A SECOND PRESS-TO-OPEN PANEL MUST BE THE FIRST ONE, TURNED.** The frame
  has exactly two working corners; `.rin-session__panel` takes
  `.hud__nav__list`'s ground, hairline, blur, ease, dashed head and `>`
  chevron, and changes only its direction. Two panels that read differently are
  two instruments rather than one HUD.
- ⚠ **THE PANEL'S RIGHT EDGE IS UPDATE 4's ARITHMETIC ONE LEVEL UP.** Aligning
  to the control GROUP puts it 17px outboard of the track — because U4 centred
  the control ON the track, so the group's box necessarily overhangs by half a
  control. It lands 4px inside the major ticks, the identical clearance U4
  computed. Aligning to the track instead would cut the panel through the
  middle of the theme switch.
- ⚠ **DELETING A GLOBAL OVERLAY DELETES IT EVERYWHERE, INCLUDING WHERE NOBODY
  ASKED.** `/astrogation` and `/orrery` had no log-out of their own; they
  inherited this one. Named and accepted rather than discovered later — both
  route back through `/admin`, which has `SessionActiveShell`.
- The deferred `import("@/lib/auth")` moved WITH the button. The
  landing-performance skill named `UserStatus` by path for that invariant, so
  the skill was repointed in the same pass rather than left pointing at a
  deleted file.

### 2026-08-13 — The substrate is five stacks of named Skills (ADR-070 U16)

One owner ask, twice: _"what I mainly want to convey is the patterns across the
different skills"_, then _"(skills cut by 07, which is meaningless text) — just
a one-sentence explanation of what each substrate means, and then the overview
of the skills; I don't want a boring ass text list."_ Cycle B, then Cycle A rows
1, 2, 3 and 6.

- ⚠ **A CORRECT DRAWING CAN STILL BE THE WRONG DRAWING.** The pin grid (U15,
  one day old) was right in every measurable way — every mark resolved against
  `crossing()` — and it was replaced because it answered a question about
  DEPARTMENTS on a surface whose subject is the SUBSTRATE. The question a reader
  brings to this tab, _"what is in Judgment?"_, was the one thing it would not
  say. **No guard can catch this class; only the owner can.**
- ⚠ **THE 5 × 8 CROSSING LEAVES THE SITE, AND THAT WAS PUT TO THE OWNER
  EXPLICITLY RATHER THAN ABSORBED.** A redraw that silently drops the only
  rendering of a fact is a deletion in disguise. The record keeps it
  (`crossing()`, still guarded); if it returns it needs its own reading.
- ⚠ **THE SAME ARITHMETIC BIT TWICE IN ONE DRAWING: A 1-UNIT RULE PAINTS UNDER A
  DEVICE PIXEL AT THIS MEET.** The first cut's explicit Skill bus rendered as a
  bulleted list — the exact thing the owner had rejected — and the foot's
  separator was invisible while the head's identical rule read fine (the head
  has a band above it doing the work). U11's alpha ceiling, in a new costume.
  Weight, not opacity, is the fix.
- ⚠ **A HIGHLIGHT CAN RENDER AS DE-EMPHASIS.** Lettering the pattern's first
  encode in `--pda-grn-ink` against siblings at `--pda-txt` made the one plate
  the drawing points at the DIMMEST thing in the stack. The accent carries it;
  one signal per object.
- ⚠ **A BAN WIDE ENOUGH TO FAIL ON CORRECT CONTENT IS A BAN THAT GETS DELETED.**
  `/\bteams?\b/i` was written for `8 TEAMS` and was catching `People-team`, a
  client proper noun already shipping in the registry. Narrowed to the
  digit-adjacent form it was written for, rather than waived.
- ⚠ **A MACHINE-GENERATED LABEL IS CONTENT NOBODY AUTHORED.** The promotion
  script clipped `name` to 14 and produced `Cost / Feas` and `GL Recon` on a
  client page. `short` is authored, and `pda-substrate-fit` fails a `short` that
  clips its `name` mid-word.
- ⚠ **THE LAB WAS PREVIEWING A DRAWING THE SITE NEVER SERVES.** Its `shipped`
  baseline mounted at rest while production mounts elastic — at p1280 a
  430-unit card in a 763-unit crop. A look-dev route that does not mount what
  production mounts is a second source of truth.
- ⚠ **A DOM-ONLY CHECK PASSES AGAINST A PANEL THAT PAINTS NOTHING.** The
  console's reveal is scroll-driven; `scrollIntoView` leaves
  `.fl-con__console` at `opacity: 0` with the SVG fully measurable, hit-testable
  and green on every assertion. Scroll in incrementally before you shoot.

### 2026-08-13 — The persistent object was two drawings (ADR-069 U1, ADR-065 U4)

One owner ask: the work cards should match the configuration's, _"the workflow or
work title is a bit higher."_ Cycle A rows 1, 2, 3 and 6.

- **The reported defect was the title's height. The actual defect was that
  ADR-069's central claim had quietly become false.** That ADR says the selected
  work is a PERSISTENT OBJECT that flies between readings 01 and 02 rather than
  being replaced. Between 08-10 and 08-12, ADR-070 U2→U13 redrew reading 02's
  card five times and reading 01's `Cartridge` kept v18's interior, so the object
  arrived having changed its corners, its state glyph, its colour and its title's
  height. The title was the symptom the owner could see; the circle gauge's own
  band is what pinned it at 68 % down.
- ⚠ **CLASS OF MISS: TWO COMPLETE, PASSING GUARDS AND NOTHING BETWEEN THEM.**
  `pda-flight` pins the two RECTS across 20 slots × 2 directions × 4 field sizes
  — but a rect is a SILHOUETTE and says nothing about the interior. `pda-viewbox`
  walked the cartridge against hardcoded `w - 19` / `w - 25`, and
  `configurationLettering` declared the seat's strings against R4's. Each drawing
  was measured only against ITSELF, so the defect lived in the RELATIONSHIP,
  which is the one place a per-object test cannot look. **Where a claim is that
  two things are the same thing, something has to assert the pair.**
  `tests/lib/pda-card.test.ts` does, rung for rung, and it includes the guard the
  pairwise walk cannot give — **a rung present on one card and absent on the
  other fails**, which is the form the drift actually took.
- ⚠ **A DUPLICATED MEASURE IS THE SAME BUG AS A DUPLICATED DRAWING.** The
  cartridge's guard had its own copy of the card's insets while the component
  derived them from `CARD.pad`; both were "right" and neither would notice the
  other moving. That block moved out of `pda-viewbox` entirely rather than being
  re-typed with new numbers.
- ⚠ **"ON THE LAWFUL DIAGONAL" WAS THE OPERATIVE CLAUSE, AND UNIFORMITY HID IT**
  (ADR-065 U4). The twenty cartridges satisfied every clause of the notched-set
  exception except that one, with a TOP-LEFT notch — and an internally consistent
  set is exactly what the eye passes and what reading a rule's first clause
  passes. It surfaced from the flight, not from a corner review.
- ⚠ **A COLOUR CAN BE A ROLE VIOLATION RATHER THAN A PREFERENCE.** `cfg` was
  green in the grid and gold on the seat; R4's law is green = the human and
  nothing else, so the same stream was two colours and the flight was recolouring
  its own cargo mid-air. What green was carrying survives twice over (dashed body,
  crossed mark), which is why it could go.
- Fixed in passing, both recorded-but-unfixed items: `Cartridge`'s bar was
  `fontSize="10"` unscaled (the reason every config-lab variant's minPx stuck at
  5.4px), and `cartTitleChars` was missing `k` (42 characters allowed where 21
  fit). ⚠ Both were **written down in the labs as known** — a note is not a fix,
  and the lab comments asserting them are now a record rather than a render.

### 2026-08-12 — The pin grid, three elastic crops, one notch (ADR-070 U15, ADR-067 U2)

Three owner asks in one session. Cycle A rows 1, 2, 3, 4 and 6.

- **Reading 03 is the owner's PIN GRID.** Its `Module` cards cut `h × 0.34` on
  BOTH left corners — 68 % of a 148×50 card's left edge — beside `Plate`'s flat
  8 and `Cartridge`'s `14k`. ⚠ **Class of miss: the owner reported a corner and
  the defect was a glyph vocabulary.** Three glyphs in one drawing carried
  three corner grammars, two of them proportional to different things; nothing
  guards a silhouette, so it took an owner's eye. The mockup he supplied turned
  out to be the live record already drawn (30 taps, 5 cut, 10 empty), so the
  promotion was a coordinate port.
- ⚠ **A STRING COMPOSED AT RENDER TIME IS OUTSIDE EVERY CONTENT SCANNER.** The
  old drawing printed **`8 TEAMS`** on the public page — the exact phrase
  `cases-registry` bans — because that guard walks `CASES` with
  `JSON.stringify` and the string was built in a component. Reading 03 had no
  arithmetic guard at all; it has `substrateLettering` + `pda-substrate-fit`
  now. The same blind spot bit ADR-070 U10 (the card's three strings lettered
  by a shared glyph) and the substrate lab flagged this instance in writing
  before it was fixed.
- ⚠ **A FIX APPLIED TO THE READING THAT WAS COMPLAINED ABOUT IS NOT A FIX
  APPLIED TO THE SURFACE.** U12/U14 made reading 02's crop elastic on
  2026-08-11; readings 01 and 03 carried the identical dead-panel defect with
  every assertion green — 117px horizontal on 01, **265px on 03 at the owner's
  own viewport**, within 5px of the 270px that forced U12 the day before.
  `pdaFit.ts` is the mechanism generalised.
- ⚠ **DELETING A GUARD THAT FIGHTS A FIX IS HOW THE DEFECT RETURNS.**
  `pda-viewbox`'s ≤40-unit waste rule was a static-crop assertion; it is
  REPLACED by a both-axis centring contract plus a seven-field fill suite, not
  dropped. And `pda-flight` walked a static `VIEW_BOX[1]` in eight places —
  against an elastic reading 01 that goes **vacuous rather than red**, which is
  worse than failing.
- **The station notch is the leading plate's alone** (ADR-067 U2). WORK's cut
  renders zero pixels — the console's chamfer subsumes it by ≥8px at every
  clamp rung — so a universal rule was delivering exactly one visible thing: a
  floating diagonal on every other tab. ⚠ Its corner had **no test in either
  direction**, and ADR-067 U1's own text said so; it is pinned both ways now.

Verified: `npm run verify` (lint, typecheck, 669 units), the desktop smoke
(12 passed / 1 skipped — six-viewport map walk, box-clipping sweep, light
contrast walk on all three readings), captures at 1280×720 and 1920×1247 in
both themes (0 clipped, 0 label-on-label, minPx 7.76 / 10.94), and the
substrate lab's four gates.

### 2026-08-10 (eighth pass) — The top-left chrome goes (ADR-070 U8)

Owner: remove THE CONFIGURATION and W-017 so the owner plate can breathe and
move up. Both restated something already on the panel — the lit rail station
above it, and the id the cartridge prints on its own face (still visible
there). Plate 170 → 72.

⚠ **Lifting one anchor opened a ~250-unit dead band**: the base is pinned to
the crop floor and the plate to its ceiling, so the middle stretched. Closed
by dropping the card to 335 and raising `SUB_H` 130 → 158 — sub-card height
is the board's vertical ballast. Waste guard re-checked (39 of 40 spare).
Cycle A rows 3 and 4.

Verified: 615 units, three casefile smokes, captures both themes (26 labels,
0 clipped).

### 2026-08-10 (seventh pass) — The seat says what it owns (ADR-070 U7)

Owner: "the who owns it should have multiple lines". `CaseMapConfiguration.p`
is documented as a PAIR — "Owner role + what that seat actually owns" — and
every drawing since the projection was written took `p[0]` and dropped
`p[1]`. Added as `PdaWork.ownerNote` (`string | null`; person-led has no
configured seat to gloss), lettering one step down in neutral ink under the
seat; plate 106 → 124 to hold the row.

⚠ **Class of miss worth remembering: a content type that documents a field
as a PAIR wants BOTH halves checked when a drawing is authored.** `p[1]`
was invisible for four updates because nothing on the surface and no guard
ever asked where it went. Cycle A rows 3 and 6.

Verified: 615 units, three casefile smokes, captures both themes (28
labels, 0 clipped).

### 2026-08-10 (sixth pass) — The board gets a margin; the seat's line gets its weight (ADR-070 U6)

Two owner defects on the U5 board. Cycle A rows 3 and 4.

- **The side nodes sat ON the crop's wall** (`LEFT_X` 36, crop x 36 — zero
  margin). Inset 24 each side; the 828 crop is now one width chain
  `24|234|24|264|24|234|24` and ⚠ `CHIP.x` IS `LEFT_X + NODE_W + GUTTER`,
  so the chain moves together or the nodes return to the wall. The card
  pays the width (CORE_K 1.6 → 1.5); the sub-card measure is fixed by the
  record's longest word and the margin is not negotiable.
- **The seat connector existed and could not be seen** — `--pda-dim` at
  0.75, read as absent. **Class of lesson: a line quiet enough to be missed
  is not a subtle connection, it is a missing one.** The DASH already
  carried the grammar distinction from the nodes' bundles; the VALUE did
  not have to as well. It takes the plate's green at full weight with a
  contact tick at the card.
- Verified: 615 units, three casefile smokes, captures both themes.

### 2026-08-10 (fifth pass) — The seat's own connector and column (ADR-070 U5)

Owner: connect WHO OWNS IT to the card, but not with the nodes' bundles,
and drop the floating DECIDES ALONE line as clutter. One dashed hairline
(the seat is authority, not data — answerable-to, not feeds-into), and the
autonomy becomes the plate's right column, plate widened to 400 to hold the
pair without the columns meeting. Verified: 615 units, three smokes,
captures both themes.

### 2026-08-10 (fourth pass) — The crop goes portrait; the pairs stack (ADR-070 U4)

The owner's "you're just not using the space at the bottom". Cycle A rows
1, 2, 3, 6.

- **The dead panel was the CROP's ASPECT, and U3 fixed the wrong half.** A
  landscape crop (1.23) in a portrait field (0.876) is width-bound under
  `meet`, so it left ~283px of letterbox OUTSIDE the drawing — unreachable
  by moving elements. U3 read it as alignment and only moved the void from
  top to bottom. Portrait crop (828×912): meet 1.013, minPx 5.55 → 10.13.
  **Class of bug: when a drawing will not fill its box, check the two
  ASPECTS before moving anything inside it.**
- **One sub-card size across all six** — side nodes stack their pair
  vertically, the wide base seats its in a row, sized to match. Answers
  "what it inherits is too big" and lifts every value to one line at fs 12.
- ⚠ **The fit guard now walks WORDS, not just lines, and found a real
  defect the hour it was written**: `RECONCILIATION` (14) is longer than
  the `INTELLIGENCE` (12) the sizing assumed, and `wrapLines` cannot break
  it — every per-line assertion passed while it overflowed.
- Deleted (all owner-named, absence guarded in unit AND smoke): draw meter
  - NEVER A PRICE, DRAWS ON caption, corner brackets, pad clusters, vias,
    crosses, the arrowed dimension and its ticks.
- Verified: 615 units, three casefile smokes, captures at 1780×1270 dark +
  light and 1280×720.

### 2026-08-10 (third pass) — Thick bundles, no readout, the drawing docks to the rail (ADR-070 U3)

Owner corrections on the U2 board, same day. Cycle A rows 4 and 6.

- The mockup's thin gutter traces lasted one pass — the switchboard's
  multi-conductor ribbon weight is the connection grammar (8-wire per side
  node, two 5-wire south).
- **The reactive readout is deleted** — ADR-069's one-line contract
  overruled by the owner ("its eating up real estate"). The notes stay in
  the record and letter nowhere; unit + smoke both assert the ABSENCE (the
  smoke's old ≥40-char assertion inverted to <40 — prose returning IS the
  readout drifting back).
- **The "space above WHO OWNS IT" was the `YMid` anchor**: at tall consoles
  the field outgrows the crop's aspect and the slack floated ABOVE the
  drawing. `preserveAspectRatio` → `xMidYMin` WITH `fitCrop`'s `oy: 0` in
  the same commit — ⚠ the attribute and the flight arithmetic are one
  pair; a drift misplaces the flight by half the letterbox.
- Verified: 616 units, three smoke cases, captures at 1440×800 + 1680×1250
  (the tall case) + light.

### 2026-08-10 (later) — The owner's unit board replaces the switchboard's composition (ADR-070 U2)

**U1 misread the ask and lasted one day.** The owner had supplied their own
unit mockup; U1 kept the switchboard's skeleton and decluttered it, and the
owner's verdict ("what you've created is just nothing") forced the real
pass hours later. Cycle A rows 1, 2, 6 — ADR-070 gains Update 2 with the
reversal on record; proof.md's section is rewritten as §The unit board;
CLAUDE.md follows.

- **The mockup's composition installed whole**: one lit card carrying THE
  BAR (new optional `bar` prop on the Cartridge primitive), the owner
  joined by a measured DECIDES ALONE dimension, three question-headed
  nodes (the "no question headers" ruling superseded by the owner's own
  mockup), gutter traces + fan, quiet ornament. Gate, nibs, six housings,
  multi-conductor ribbons and the substrate bars all deleted from this
  reading; the caption alone counts shapes.
- **The adaptation, not the transcription, is the work**: stacked rows
  where the mockup's halves cannot hold the record's 26-char worst,
  tracking cut where the person-led seat overruns, the readout forced to
  11.5 by the outranking guard, the bar wrapped on the card, MODEL and
  CONNECTORS as the owner's k-labels, new `--pda-gph*` blue in both theme
  files.
- **The durable lesson (also in memory): when the owner supplies a mockup,
  the mockup IS the composition.** "Not verbatim" licenses adapting
  strings, measures, guards and shared chrome — never substituting a
  different drawing.
- Verified: 618 units green (fit walk of all 27 at the one-line measures;
  `CORE_RECT` byte-identical), three smoke cases incl. the light walk
  measuring the new blue, headed captures both viewports both themes.
  Two more capture-only catches: the hatch band through the value's
  descenders, and nothing else — the emptier board leaves fewer places to
  collide.

### 2026-08-10 — The switchboard simplified: radial runs, shaped parts, legible tags (ADR-070 U1)

Owner review of the shipped reading-02 drawing against the CP2077 reference
and their own v19 mockup (elements, never verbatim). Cycle A rows 1, 4, 6 —
ADR-070 gains Update 1; proof.md's switchboard section and CLAUDE.md's map
entry carry the new contracts.

- **The promotion pass took the reference's RIBBONS but not its ORDER.** The
  fix is compositional: every run centre-out, junction boxes deleted, the
  doubled SYSTEM wiring collapsed into one trunk through one gate forking at
  x 926, ghost ribbons deleted, ornament trimmed.
- **A part is a housing, not a square** — six drawn silhouettes at 176 wide
  replace the 120×86 rects; corner glyphs deleted with the room they no
  longer earn.
- **The type is derived, not chosen**: tags 7.5 → 10 in `--pda-txt2` (the
  owner's "utterly unacceptable" fix), values 8 → 10 wrapped, the 46-char
  bar WRAPS in the gate channel instead of shrinking, readout 10 → 11
  (forced by the outranking guard).
- **Two conductor-versus-content collisions caught on capture, zero by
  guards**: a riser through the bar text (fork moved past the whole 700–930
  text channel) and a landing band grazing the lane chevron (nib 305 → 286).
  The hand-check law is the durable lesson — re-read it before rewiring.
- Verified: `npm run verify` 618 green (fit walk of all 27 streams at the
  new sizes; the ADR-069 flight untouched), three casefile smoke cases,
  headed captures at 1280×720 + 1440×800 in both themes, hover pair + readout
  swap confirmed.

### 2026-08-10 — Vesper station: brackets off, composition up, ENHANCE de-plated (ADR-068 U7)

Three owner notes on the live IMAGE & VIDEO station. Cycle A rows 4 and 6 —
ADR-068 gains Update 7; `.claude/rules/proof.md` and CLAUDE.md carry the new
literals.

- **The bay's four gold corner brackets deleted** (`.fl-bay__br*`, its spans
  in `ToolGallery.tsx`, its light override). The box is already framed and
  gold buys one thing per drawing. ADR-065's bracket grammar is intact — this
  object stopped qualifying as "framed but not a device".
- **The scale pass, and the lesson worth keeping.** The first cut raised the
  tile's `cqw` cap and MEASURED AS A NO-OP: in `min(N·cqh, M·cqw)` the cap
  binds only below W/H = N/M (1.26), and the real bays run 2.3–2.9. The size
  is the `cqh` coefficient, and it is paid for out of `.fl-wire__main`'s bias
  padding — one budget. Same class of error on the dock, where the binding
  term was a 52px HARD CAP, not a ratio. **Read which term binds before
  retuning any `min()` on this surface.**
- **ENHANCE PROMPT lost its border and wash.** The light walk was unaffected
  by arithmetic, not luck: `bedOf()` only counts an ancestor at α ≥ .85 and
  the green wash is α .14/.16, so it was never the label's bed.
- ⚠ **1280×720 is down to 2.3px of slack** (from 4.5) and is recorded as such
  at the rule. The next height addition has to come back out of that padding.
- Verified: the three casefile smoke cases green, typecheck clean, lint 0
  errors, plus direct measurement at six viewports (real scrolls, row pinned
  by click) and captures in both themes.

### 2026-08-09 — Reading 02 is a switchboard, on the landing (ADR-070)

The owner picked the config lab's fifth archetype and asked for it in
production. Cycle B — ADR-070 opened; `.claude/rules/proof.md` gains §The
switchboard and its lab section is re-pointed; CLAUDE.md's map entry updated.

- **The lesson worth keeping** is why the first four archetypes failed: each
  kept the shipped reading's skeleton, mined the reference as a PARTS CATALOG
  rather than for its COMPOSITION, and let the fit guards drive layout
  (symmetric grids are easy to prove collision-free). Guards police a drawing;
  they never compose it.
- `PdaConfiguration.tsx` + `ribbon.ts` are production now; the old
  `ViewConfiguration`, `Module`'s answers mode and the `MODULE_TYPE` /
  `moduleAnswer*` helpers are DELETED. `PdaEntry` moved to its own module
  (reading 02 supplies reading 01's crop — one shared type, no cycle).
- ADR-069's morph, answers and readout all survive; `CORE_RECT` is the chip and
  the two rects are now EXACTLY similar (176×136 × 1.6).
- Measured on the landing at 1280×720: meet 0.662, 31 labels, minPx **4.97**,
  0 clipped. The tight crop (`56 20 910 740`, the content box rather than the
  authoring space) is what bought that. Smoke 21/31, verify 618.
- ⚠ New verification trap: the browse band's first quarter is the map row, so
  0.35 of the dwell lands on the Studio SHEETS — `capture-map-readings.mjs`
  defaults to `--at 0.09` and runs headed.

### 2026-08-08 — The CONFIGURATION lab: four archetypes beside the shipped reading

Owner verdict on ADR-069: the morph is right, the drawing still reads as
four-modules-plus-core — "go crazy". New look-dev route
`/test/intelligence-config-lab` (BOARD-archetype precedent: live record, real
console chrome, measured not reviewed, NO ADR until a direction wins; nothing
on the landing changed). `.claude/rules/proof.md` gains §The CONFIGURATION lab.

- Five variants: `shipped` (the real `ViewConfiguration`) beside `die`
  (motherboard; the 47 `skillSymbol` marks' first render, clustered per shape
  on the ground plane), `chain` (signal path with a physical gate aperture +
  MAP_CHAINS neighbours), `section` (cutaway; shapes as strata below grade),
  `schematic` (symbol-per-part nets + power rails). Every variant keeps a
  socketed cartridge home so the ADR-069 flight survives promotion.
- `tests/lib/config-lab-fit.test.ts` (fit + envelope over ALL 27 works × 4
  variants — the lab page is outside the registry scanner's reach) and
  `scripts/capture-config-lab.mjs` (55-sample matrix, dark+light, gates:
  0 collisions / 0 clipped / minPx ≥ 4.3; `--measure` pins the housing from
  production). Two real ceilings caught same-day: `bar` runs to 46 chars
  (W-052), and fs 7 renders 4.22px at the binding meet — under the floor.

### 2026-08-08 — Map console: the selection morph + the answered configuration (ADR-069)

Owner ask off two Cyberpunk 2077 reference boards: clicking a workstream should
MORPH into its configuration, and the configuration should say something about
the stream it is showing. Cycle B — ADR-069 opened with the flight's arithmetic,
the flavour table, the fit table and the rejected pair mark; `.claude/rules/proof.md`
gains §The selection morph; CLAUDE.md's map entry rewritten.

- **The system rule:** the selected work is the PERSISTENT OBJECT. Reading 01
  draws it as a cartridge, reading 02 as the core (the same glyph at `CORE_K`),
  so 1 ↔ 2 MOVES it while everything else re-rasters. That is what let the
  readings stay terminal display-switching rather than becoming the zoom ladder
  ADR-062 closed — the field never scales, no `viewBox` is tweened.
- **New pure module `pdaFlight.ts`** + 16 cases, off ONE rect read per
  transition. Both invariants asserted: the box's x/y never enter the
  arithmetic, and a uniform ancestor scale cancels out.
- **Reading 02 prints the record.** Nine authored pairs per configuration were
  being dropped by the projection; four now letter as answers and the rest ride
  a reactive readout. `evals` (142 % of measure) and joined `k` (121 %) are
  arithmetically unletterable in a module, which is why the gate answers with
  the bar. 21 fit cases over all 27 streams.
- **Cycle A rows 3, 5 and 6 fired.** Row 3: an unfilled SVG shape is only
  clickable on its STROKE — all three person-led cartridges could not be opened
  by clicking their centre, which no existing guard could see (the keyboard path
  worked and the smoke clicked the filled first one). Pattern added to
  BEST-PRACTICES; the smoke now hit-tests all twenty with `elementFromPoint`.

### 2026-08-07 — Casefile: glyphed index register + tool dossier + Vesper wireframe (ADR-068)

Owner redesign from `proof-page-blocks-left.html` (canonical; `thoughtform-
proof-panel-v2.html` superseded). Cycle B: ADR-068 opened with the shape,
prior art (056/059/063/064/065/066/067) and the mockup→law override table;
ADR-065 Update 1 (notched seated sets) and ADR-066 Update 1 (diamond back
under short handles; one-column layout superseded) resolve the contradictions
in their owning ADRs; `.claude/rules/proof.md` register + tools sections
rewritten.

- **The IA ruling:** left column = the PROGRAM's achievements (uniform
  glyph+claim+sentence index on all four rows, non-interactive); right panel
  = the TOOL (dossier field: header → route → bay → detail 2×2 → foot). The
  Software register's tool-describing blocks became program claims; the
  per-tool content moved to `ProjectCase.tab/route/detail`.
- **Measured, not ported:** tall register rung at 1070h (a DIRECTORY
  constraint — the plan's 1000h clipped it 36px; the old 931h rung had the
  same latent defect); rungs must TILE (999/1070 printed sentences into a
  128px box); route viewBox 560×66 with 1440×800 binding (SVG height rides
  field WIDTH); capture floor `clamp(70px, 9svh, 180px)`; `data-n=4` diamond
  restored (handles 68–106px vs 122.9 available — the input changed, not the
  math); green ramp extension measured composited in light (own 4.80, gold
  4.91, NOW stroke 4.90; step outline lifted to α .5 = 3.33:1).
- **The contact-sheet check fired before anything rendered:** `ownership`
  read as `gap`'s sibling in one visible set (the ADR-059 failure mode);
  redrawn as an open vessel. Glyph anti-patterns mechanized in
  `tests/lib/proof-glyphs.test.ts`.
- **Fixed in passing (pre-existing):** desktop-width PRM collapsed the
  console to HEIGHT 0 on every plate — console.css's unwrap gate keyed on
  width alone while casefile.css's static-flow gate includes PRM; the gates
  are now the same pair, with a PRM smoke assertion.
- **Factual corrections:** babylon/heimdall `year` 2025 → 2026 (repo first
  commits).
- Verification per commit: `npm run verify` green (589), services-ring smoke
  green (12) with new assertions (glyphs, sr-only rung, route type floor +
  PT Mono, BL-notch clip-path signature, per-tool filter split, PRM console
  height, light-theme green samples); measured walks at 5 desktop viewports
  - mobile; ring suite untouched and green.
- **Open, recorded in ADR-068:** the mobile route wants a different DRAWING
  (arithmetic: ~335px of glyphs vs ~312px column); mímir/babylon/heimdall
  wireframes; `--pda-grnh` → `var(--atreides-ink)` re-point candidate; the
  aether keynote's tools-count inconsistency (outside this repo); desktop
  PRM renders the whole casefile in a ~271px column (pre-existing — the
  unwrap fix made the console visible there, the column width is its own
  pass).

### 2026-07-17 (latest 3) — Services ring: arrival remap so it turns at the park (ADR-029 update)

Owner, third pass on the same seam: entering #services still had a trailing
~0.24vh where the section had settled (cards parked) but the ring stood
still on Advisory before it began rotating. Cycle A:

- **ADR-029 update.** Replaced the uniform 5-beat ring grid with an arrival
  remap: `RING_ARRIVAL_FRAC` (0.14 ≈ the dissipate settle) holds Advisory
  through the short arrival, then three quarter-turns pack across the reading
  zone, then the exit-hold. `RING_EXIT_START` keeps the exit band at the last
  1/RING_STEP_COUNT so `exitProgressForRunway` (+ the #about −100svh sweep)
  is byte-identical. `data-active-step` = the front-card index
  (`activeServiceForProgress = round(ringIndex)`), exact ring↔step lockstep.
  `beatScrollTarget` + `ServicesCardRing` call updated; `travel` clamped ≤1
  (FP monotonicity). Tunable via `RING_ARRIVAL_FRAC`.
- Verification: `npm run verify` green (297); desktop ring smoke re-pinned
  (front-card indices, exit step 4→3); entry map + screenshot confirm the
  ring begins turning right at the park (p≈0.14) — Advisory sliding out,
  Embedded rotating to front — instead of a beat later.

### 2026-07-17 (latest 2) — Tab-return desync: corridor scroll writers re-sync on visibilitychange

Owner report: switching tabs and back sometimes left the #services masthead
copy gone and the brandmark stuck as scattered particles instead of the
settled wireframe. Root cause (a bug CLASS — new BEST-PRACTICES pattern):
the corridor's rAF-throttled scroll writers (`useDepthScroll`,
`useCorridorExitScroll`, `useServicesStageScroll`) + the masthead reveal
controller are driven by `scroll`/`resize` only. The tab-hide freezes rAF +
the demand frameloop; on return no scroll/resize reliably fires, so a stale
pre-hide value can stick (masthead opacity = `--svc-content-in * (1−exit)`;
brandmark reads `paintProgress`/`servicesAmbient`). Cycle A:

- Added a `visibilitychange` resume handler to all three writers (force a
  synchronous re-sync from the live scroll rect) + the masthead controller
  (force the resolved full-text state when settled). `useServicesStageScroll`
  busts its write-dedupe caches first so the heal can't be skipped.
- Verification: `npm run verify` green (297); desktop ring smoke 7/7; a
  Playwright repro corrupts the masthead to the "gone" state, dispatches
  `visibilitychange`, and confirms opacity + copy return (title/intro
  fully restored). BEST-PRACTICES pattern "rAF-throttled DOM/store writers
  must re-sync on tab-return" added (sits with the demand-loop + dt-clamp
  frameloop-resume family).

### 2026-07-17 (latest) — Services message pass: headline, de-framed intro, decluttered card (ADR-044/029 update)

Owner: #services is where a visitor must know what he does immediately, and
the copy/chrome was fighting it. Cycle A:

- **Headline** "ONE LOOP. / THREE DEPTHS." → "AI YOUR TEAM / CAN RUN." (the
  capability-handover positioning; picked from three offered directions).
- **Intro** de-framed (dashed plate + glass `::before` + gold corner
  crosses + aperture clip-path all removed; bare text on the band, padding 0) and tightened to match. Cross spans stay in JSX, `display:none`.
- **Card face** (baked): service-label chip 24→30px; the `<CODE> · OPEN`
  status and the `FEED 0X · …`/STANDBY caption removed (HUD filler); body
  31→35px + dawn 0.7→0.92 (bigger, less gray). `.svc-plate__lede` mobile
  parity moved 15.5→17.5px / dawn-70→dawn-90.
- Verification: `npm run verify` green; desktop ring smoke re-pinned
  (`ONE LOOP.` → `AI YOUR TEAM`); four baked faces screenshot-checked at
  1440×900.

### 2026-07-17 (later) — Services runway: drop the vestigial lead-in beat (ADR-029/030 update)

Owner report: entering #services cost one dead scroll viewport (stars /
sphere remnants drifting, cards not rotating) before the ring engaged.
Root cause: two beats held card 0 before rotation — a `ServicesPlateCluster`
accordion-era "collapsed lead-in" beat (meaningless in the card-ring model)
plus service 0's own read beat. Cycle A:

- **ADR-029 update.** `RING_STEP_COUNT` 6 → 5, runway 600 → 500svh; beat
  `i` now owns service `i` (card 0 front on arrival, first scroll rotates
  to card 1). The four lead-in offsets moved in lockstep
  (`ringIndexForProgress` `k<=1`/`k-2` → `k<1`/`k-1`,
  `activeServiceForProgress`/`setActiveByStep` `step-1` → `step`,
  `servicesBeatScrollTarget` `+1.5` → `+0.5`). Exit-hold beat + ADR-047
  #about sweep preserved (exitProgressForRunway is a pure function of the
  count). ADR-030's stale "== 6" invariants annotated.
- Verification: unit suite re-pinned (46 pass); ring smoke active-service
  progress values remapped; `npm run verify` green; browser-checked the
  first scroll after arrival now rotates.

### 2026-07-17 — Editorial band: shared horizontal frame for section text (ADR-048)

Owner compared the services masthead against linear.app: margins felt
arbitrary/inconsistent across widths. Root cause: the two-layer inset
(station `--hud-content-inset` + `--rail-inset: --hud-margin + 8vw`) was
uncapped and viewport-proportional — effective side inset drifted
218→451px across 1024→2560 with no stable proportion. Cycle B:

- **ADR-048.** New `:root` band tokens (`--band-max` 1200px /
  `--band-pull` 0px / `--band-margin`); `--rail-inset` re-derived as the
  band remainder — below the ~1503px crossover the text edges sit ON the
  hero headline edge (one shared content edge, owner's pick), above it
  the band pins centered at `--band-max`. All three consumers (services
  masthead, both about grids) moved in lockstep with zero consumer-site
  edits. Band-relative masthead lead cap; Arc split cap consolidated onto
  the token (zero visual change). ADR-044/045 addenda; landing-v7 rule
  updated.
- Verification: `npm run verify` green; ring smoke unchanged; browser
  rect-probe at 1280/1440/1680/1920/2560 matched the ADR-048 table ±1px
  (services lead + about grid + hero edge in lockstep below the
  crossover). Found in passing: the landing-page `toHaveScreenshot`
  suite has NO committed baselines (never in git; first local run writes
  actuals and exits 1) — noted in ADR-048, no action taken.
- **Same-day follow-up (ADR-044 update):** the "Services · 04" masthead
  eyebrow retired (the journey's last station-index eyebrow);
  `--masthead-top` re-derived −20px → +9px so the title cap stays on the
  big-title line; decode targets are now the two title lines only.
- **Same-day follow-up 2 (ADR-048 update):** the vertical axis joined
  the band — owner reference pass (hematogenix / varex / srg / flshfrm /
  rebooot: editorial headers at 13–17% of viewport height vs our 7.5%
  corridor title-card line). `--band-top` = `--station-title-top` +
  `--band-air` (clamp(28px, 4.7svh, 52px)); the masthead title + intro
  drop to ~11.5svh (front-card clearance caps us below the references'
  13–17%). Corridor heads untouched; retuning --station-title-top still
  moves every surface together.

### 2026-07-16 (evening) — Services surface polish: seam perf, retina DPR, morph crispness, layout + card scale

Four owner complaints, one pass (Cycle A per workstream; 8 commits, each
independently revertible):

- **Seam perf (ADR-047 Update 5).** Corridor→#services scroll janked.
  Draw gates extended to all remaining painters (walls/tunnel/topography/
  streaks/motes/photons/starfield, same-frame-as-opacity discipline), ticker
  display-gate + SIGNAL_OUT arc freeze, caption glass visibility gate +
  backdrop-filter transition removal, root-style + armillary anchor publish
  delta gates. Headed-Chromium trace 1280×800: p50 21–25ms → **16.7ms
  (vsync)**, p95 50–58 → 37–42ms, >50ms frames 9–22 → 0–4, long tasks
  798ms/run → ~0. Governor constants untouched (not needed post-fix).
- **Retina brandmark (ADR-038 update).** `BrandmarkPhysicsCore.uPixelRatio`
  read raw `devicePixelRatio` instead of the governed buffer DPR → fat
  chunky dots after a governor step-down on MacBook. Per-frame
  `state.viewport.dpr` sync; consumer contract documented. Post-deploy check
  for Vince: scroll the seam on the MacBook — the parked wireframe should
  stay crisp, and briefly-soft states should recover within ~5s of idling.
- **Terminal-crisp morph (ADR-023 addendum).** The 2D→3D flight window read
  "painted". `FLIGHT_CRISP_FLOOR` 0.7 + point-size sin-dip 0.9 + recede
  atten 0.12 — identity-default knobs, endpoints screenshot-verified
  pixel-equivalent, choreography untouched. `brandmark.md` updated.
- **Layout + card scale (ADR-044 update).** Corner-LINE masthead rule (both
  text blocks top-anchored on the bracket line, vertical-only change) +
  `parkedInstrumentScale` viewport boost (1.15× on MacBook-class, 1.0 wide/
  tall, recT-target-only so the corridor is byte-identical; new unit suite).
  Deck-flip portrait landing verified at 1280×800 and 1920×1080.

### 2026-07-16 (later) — About deck-flip stage (ADR-047; supersedes the ADR-046 dock, same day)

Owner redesign of the services→about transition: the cartridge dock was
"gimmicky and doesn't solve the transition." Cycle B (new surface) + the
full dock removal.

- **Deck stack + flip (WebGL).** Across the services exit clock the four
  ring cards STACK via an azimuth sweep (`aboutDeckMath.ts` — per-card
  nearest-full-turn φ targets, deck-depth radius correction, spring-settle;
  exact identity at exit 0, unit-pinned). The pinned `#about` stage then
  FLIPS the deck π on X to a shared gold-tone portrait back face
  (`bakePortraitBack`, mirrored chamfer chrome; back planes at
  `rotation.x = π` so Rx(π)∘Rx(π) = identity — upright, verified live)
  and the deck lands on the DOM portrait slot (viewport-first per frame).
- **Pinned transparent #about (DOM).** 300svh runway + sticky transparent
  stage (`AboutStagePortal`/`AboutStage`/`useAboutStageScroll`,
  `[data-about-root]` prototype shell); orbit cluster reuses the
  `.voidwalker__orbit*` grammar; copy via `aboutStageData.ts` (lockstep
  with the fallback markup); scrubbed `--ci-off` reveals (not
  useRevealMotion — portal nodes unobserved, one-shot `.is-in`).
- **Ambient kill retargeted #about → #continuum** with the gate keyed to
  the same rect as the fade envelope (the ADR-030 seam-cut bug, avoided);
  `#about` gets the transparent treatment + a FAIL-OPAQUE `::before`
  shield (`--about-bg-in`, default 1); `#continuum` takes the opaque-cover
  role. Verified bidirectionally in-browser: ambient survives the whole
  about band both directions, dies/re-engages exactly at continuum.
- **Found live:** the media-flip null-render stranded `data-about-mode`
  (empty about on mobile) — the hook now disengages when its stage ref
  goes null (fail-static hardening).
- **Dock removal:** component/CSS/flag/math/tests deleted; kept
  `viewportSeat.ts` (extracted seat projection), `beatScrollTarget.ts`
  (ServicesStage uses it), and the BEST-PRACTICES disabled-button lesson.
  ADR-046 → Superseded; ADR-045's desktop emerge → superseded note
  (fallback surfaces unchanged); ADR-008 paint-stack rows 4b–4e rewritten;
  landing-v7 + scroll-animations rules updated.

### 2026-07-16 — Services copy sweep · About emerge + rail parity (ADR-045) · Cartridge dock (ADR-046)

Owner-directed triple pass. Cycle B for the two new surfaces; the copy
sweep is data-only.

- **Services copy sweep.** All four card titles/ledes + the masthead moved
  to Vince's concrete first-person voice ("I move in with your team.");
  the stale "ONE LOOP. THREE DEPTHS." (predated the fourth service) became
  "ONE PRACTICE. FOUR WAYS IN.". `servicePlateData` (production) +
  `serviceData` vestigial fields in lockstep; `/test/services-wordmark`
  lab defaults mirrored; ADR-044 consequence note updated. Verified: all
  four baked WebGL faces re-bake without overflow; mobile plates share
  the strings by construction.
- **About rework (ADR-045).** The `.voidwalker__orbit` parallax +
  whole-cluster JS instrument tag retired for an authored emerge sequence
  (portrait clip-wipes first, rings/halo/readouts stagger around it);
  portrait centering moved off the transform channel (inset/margin);
  `--rail-inset` promoted to `:root` and consumed by both the services
  masthead and the about grid — measured 0px text-edge delta at 1968w.
  Two pre-existing defects fixed in passing: the 12-dot particle halo was
  invisible since authoring (span-relative translateY %), and the
  standalone prototype's reveal JS stranded every clip-path-hidden
  element (Chrome clips IO geometry by the target's own clip-path — 44
  stuck elements including every title; production's scroll fallback is
  the load-bearing reveal there, prototype gained the same fallback).
- **Cartridge dock (ADR-046, flag `SERVICES_CARTRIDGE_DOCK`).** The exit
  beat's cards now eject, flatten, and fly in-world to a bottom-right DOM
  console; DOM cartridges crossfade in AT the seat, persist page-long
  (pure function of clamped runway progress — no latch), and glide back
  on click via the shared `servicesBeatScrollTarget`. New pure-math module
  `dockMath` (13 unit tests incl. the identity pin), seat-rect bridge,
  ring exit branch, pointer-look exit damp, ADR-008 paint-stack row 5a,
  landing-v7 rule note, smoke probes (+ fixed the stale ADR-044 SOURCE BUS
  assertion). Two bugs found live: rAF-order staleness on teleport jumps
  (fixed with a trailing sync tick) and **React dropping clicks on a
  props-disabled button whose DOM `disabled` was flipped imperatively**
  (fixed by keeping `disabled` out of JSX — captured in BEST-PRACTICES).

### 2026-07-15 — Mobile Landing Quality Pass, Round 3 (ADR-018 Revision 3)

Owner visual-tuning follow-up to Round 2. Cycle A. All gated mobile →
desktop byte-identical.

- **Thesis gateway visible at rest + rise-to-centre.**
  `getThoughtformMobilePhase` holds `diagramFactor` at the exit fade (was
  a scroll-in ramp) so the compass reads as already-there on arrival; new
  `getThoughtformMobileRiseOffset` seats the brandmark + compass below
  centre at rest and rises them to centre by the SVG→particle handoff
  (offset 0 there → morph/fly byte-identical). Applied in
  `getBrandmarkWorldPosition` + `ThoughtformCompassGate`.
- **Arc caption pull-up.** Support straddles −2.0 / −1.7 / −1.45 → −1.8 /
  −1.5 / −1.35 (less bottom-heavy; the Build case cards now fit fully).
- **Type scale.** Mobile arc meta unified onto 9px (badge / coord /
  tagline); clean 16 / 12 / 11 / 9 mono scale.

Three code files (`sceneGeom.ts`, `ThoughtformCompassGate.tsx`,
`home-v2.css`) + docs. lint / typecheck green; verified in-browser at
390×844.

### 2026-07-15 — Mobile Landing Quality Pass, Round 2 (ADR-018 Revision 2)

Follow-up to the same-day Round 1 below. Round 1 landed 7 of its 9
workstreams cleanly but its "styling parity" workstream never actually
removed the title chrome or reframed the support copy (only the kicker +
case cards shipped), and its new mobile epilogue introduced a font
regression. Four user-visible items + a broadened alignment sweep. Cycle
A (multiple linked fixes on a shared surface). All gated on
`@media (max-width: 760px)` / `isMobileComposition()` / mobile-only
classes → desktop byte-identical (spot-checked at 1280×800).

- **Bare Arc titles.** The gold `.home-v2-readout__corner` L-brackets
  were only hidden on desktop (`--twocol`); mobile leaked them. Hidden
  on mobile → matches the bare desktop title grammar (bare since
  2026-07-03).
- **Compact caption reticle.** Mobile support dropped
  `.home-v2-copy-body` (which was overriding PT-Mono → sans) and is now
  wrapped in a new `.home-v2-readout__caption*` reticle (dashed frame +
  gold corner crosses + coord tag) echoing the desktop `CaptionCard`,
  minus the arm/aperture choreography / glass / meta / rail / pips.
- **Copy spread + sphere enlarged.** Six `mobileStraddleY` offsets
  widened to use the empty portrait bands; new `mobileGyroSphereScale()`
  (1.1 mobile / 1 desktop) enlarges the gyro sphere, applied in the two
  synced places (`BrandmarkAccretionShell` group `setScalar` +
  `getBrandmarkSphereMatchHalfExtent`) so the brandmark keeps filling the
  sphere (ADR-023).
- **Epilogue font.** `.home-v2-mobile-signal__title` was using the
  undefined `--font-source-serif` token (→ Georgia serif + italic);
  repointed to PP Neue Montreal, uppercase, `0.04em`, upright gold `em`
  — matching desktop and the no-italics rule.
- **Alignment sweep ("center everything").** `#about` bio + `#continuum`
  head centred on mobile; `#practice` approach-phase rules centred
  (inert on the current placeholder markup, defensive); `#services`
  cards + `#continuum` spectrum rail kept left (component grammar).

Reverses two explicit Round-1 non-goals (kept L-corners; kept `#about`
left) per owner feedback — noted in the ADR-018 Revision-2 header. Six
touched files: `home-v2.css`, `StationTitle.tsx`, `sceneGeom.ts`,
`BrandmarkAccretionShell.tsx`, `landing.css`, plus the ADR/ledger docs.
lint / typecheck / vitest all green.

### 2026-07-15 — Mobile Landing Quality Pass (ADR-018 addendum)

Owner-driven quality pass to raise the mobile landing to parity with
desktop (Cycle A — multiple linked fixes on a shared surface). Nine
workstreams, all gated on `isMobileComposition()` (~760px) or an
equivalent media query so desktop is byte-identical:

- **Two bug fixes that were the biggest visible issues.** (1) A CSS
  cascade order bug hid the mobile stack-item hide behind the base
  `display: flex` rules, so the SOURCES/SURFACES rails and chips
  rendered on phones and overlapped the BUILD title (visible in every
  Build-park mobile screenshot). Relocated the hide to the late-cascade
  block; joined the Encode cardinal callouts. (2) `StaticStarfield` +
  the two BrandmarkParticleField painters set `uPixelRatio` once at
  mount from raw `window.devicePixelRatio` (~3 on iPhone) while the
  canvas caps at DPR 1.4 / 1.75 — every point rasterised 20–115%
  oversized on mobile, the "thicker starfield competing with the
  compass" complaint. Fixed with a per-frame sync to `state.viewport.dpr`.
- **Missing mobile epilogue.** The whole desktop signal layer
  (`CorridorStationHeaders`) is `display: none` at ≤760px, and the
  world-anchored mobile Build title had no epilogue crossfade — so
  "BUILD ON THE LAYER." persisted through the whole epilogue and mobile
  visitors never saw "EVERYONE IS RACING…" or the "WE HELP YOU BUILD
  YOURS" CTA. Fix: a new `MobileEpilogueSignal` component (fixed layer
  driven by the same `TITLE_IN` / `SIGNAL_OUT` bands) mounted from the
  mobile branch of `CopyAnchors`, paired with a new `gateMobileBuildTitle`
  `onPaint` handler on `intelligence.title` / `intelligence.support`
  that multiplies visibility by `1 - epilogueBand(ep, "BUILD_OUT")` on
  mobile (desktop no-op).
- **Composed Thoughtform layout replaces the two-moment sequence.**
  The retired two-moment beat (copy fades out in Moment 1, brandmark +
  diagram slide in from below in Moment 2) required a full extra
  viewport of scroll before the diagram appeared and left the
  composition disjoint. Now copy sits in the upper third
  (`MOBILE_COPY_ANCHOR_Y = 1.35` on `thoughtform.leftCopy`), brandmark
  - `ThoughtformCompassGate` stay at the gate centre for the whole
    dwell (retired `MOBILE_BRANDMARK_SLIDE_FROM`; `slideY` in
    `ThoughtformMobilePhase` deprecated to always 0), and the diagram
    fades in briefly as an entrance effect then holds. Phase labels
    spread wider (`MOBILE_PHASE_SCALE` 0.7 → 0.92) so NAVIGATE/ENCODE/BUILD
    sit outside the outer ring. `COMPASS_MOBILE_ALPHA_BOOST = 1.5` lifts
    every compass line's final alpha on portrait so the diagram matches
    its desktop presence (previously invisible at portrait FOV + DPR 1.4).
- **Scroll runway.** Mobile corridor stage raised `620svh → 820svh`
  (matching desktop's `EPILOGUE_START = 620/820` split);
  `MOBILE_THOUGHTFORM_END` retuned `0.38 → 0.30` so the Thoughtform
  dwell stays ~2 viewports and the reclaimed ~130svh flows into the
  Navigate→Encode→Build fly. Resolves the "too fast on mobile" scroll.
- **Corridor presence on mobile.** `LatentWormholeWalls` `innerWidth >= 760`
  hard block retired — the walls are the ONLY layer that makes the fly
  read as a corridor, and the tier-governed `STREAK_COUNT_MOBILE = 240`
  was already defined for this path. `SubstrateTopography` stays
  desktop-only pending device perf verification.
- **Starfield spread + local cluster.** `StaticStarfield` spawn volume
  widened from ±25/±15 to ±30/±22 so the field covers the widest
  portrait frustum instead of leaving empty top/bottom edges. Local
  `ThoughtformAtmosphere` cluster dropped mobile point size (6 → 3.4)
  and count (200 → 130) so it reads as depth backdrop over
  `StaticStarfield` rather than a dominant second field. Chevron scroll
  cue removed (nothing to cue toward with copy + diagram sharing the
  frame).
- **Styling parity.** Mobile kicker chip row simplified from
  `sector // callsign · code · metric [status]` to
  `sector // callsign [status]` — the dropped chips were literal
  duplicates that overflowed the mobile container. Mobile Build-park
  case chips upgraded to a 2×2 grid of mini-cards (codename + tagline)
  matching the desktop `ArcCasesCard` grammar; still non-interactive
  per the ADR-033 gate parity rule.

Every change documented in a single ADR-018 addendum at the top of
[sentinel/decisions/018-home-v2-depth-corridor.md](decisions/018-home-v2-depth-corridor.md).
Nine touched files: `home-v2.css`, `sceneGeom.ts`,
`ThoughtformCompassGate.tsx`, `CopyAnchors.tsx`, `StationTitle.tsx`,
`MobileEpilogueSignal.tsx` (new), `StaticStarfield.tsx`,
`ThoughtformAtmosphere.tsx`, `LatentWormholeWalls.tsx`, plus BrandmarkParticleStation / BrandmarkSilhouettePoints DPR fix. Lint clean, TypeScript clean.

### 2026-07-14 — Arc Cases: phased reveal + front-pole sigil (ADR-041)

Owner-driven feature pass on the Build-park cases reveal (Cycle B — new
surface + two superseded ADR-036 sections). Three changes:

- **Phased reveal.** The single damped arm level now drives TWO ordered
  phases: the node fold on `arcFoldInput(level)` (done at `ARC_FOLD_DONE`
  0.62) and the card on `arcCardPresence(level)` (`smootherstep(0.62, 1)`,
  published as `cardPresence` on `arcCasesLevelRef` by the same single
  writer). The card previously read the level LINEARLY while the fold rode a
  smootherstep, so the screen visibly led the nodes it hangs from. Now:
  labels fade → nodes fold and latch → card materializes into the frame they
  made. Strict ordering invariant (`arcCardPresence === 0` while
  `arcFoldInput < 1`) is unit-pinned; the live arm trace shows cardPresence
  exactly 0 for the first ~384 ms while the labels fade 0.66 → 0.
- **The trigger is a cue under the Build title, not a sphere sigil (ADR-042
  supersedes ADR-041 §2).** `ArcCasesTerminalCta` (chip) and `ArcCasesSigil`
  (sphere marker) are BOTH deleted; `ArcCasesCue` is a DOM dotted-leader +
  label docked under the Build station title (the sphere sigil "felt out of
  place"). Its `intelligence.sigil` anchor, `gateSigil`, and `SIGIL_Z` are
  gone. It arms on the SAME settle gate (`sigilSettle`, window **measured
  live** — a first pass at [0.72, 0.96] left the trigger unreachable) and
  keeps the aria/inert/auto-disarm contracts. Because it sits clear of the
  centred card it stays visible + interactive while armed (a 2nd click /
  Escape closes; the stepper ✕ CLOSE also stays), so the ADR-041
  fade-to-0/pointer-events-drop guard is gone.
- **Card face** gains the four capability rows from the retired horizontal
  console card, as a MEASURED fit (full → title-only → skipped) into the
  ~320 px dead band; Heimdall (longest copy) verified collision-free.
- **Deliberately NOT done:** retuning `ARC_BAND_IN` (its "tracks the stack"
  comment is stale drift — the stack moved 0.81/0.93 → 0.875/0.95 and the
  band didn't follow), because the Build park (0.9225) sits BELOW the
  accretion peak (0.95): raising the band would gate the card off entirely.
  Sequencing is enforced on the trigger instead. Recorded in ADR-041.
- **New gotcha (in the ADR + rules):** Playwright `locator.click()` can never
  pass actionability on the sigil — it is re-projected every frame and the
  gyro carries an idle drift, so its box never repeats ("element is not
  stable"). Use `page.mouse.click` at the projected centre (still hit-tested).
- Gate: typecheck clean, ESLint **0 errors / 300 warnings** (baseline
  unchanged), **256 unit tests**, prod build clean, `arc-cases-card-smoke`
  rewritten against the sigil (10 pass), `landing-corridor` + `services-ring`
  52 pass. Driven live at the Build park at 1600×1000.
- **Left for the owner's eye:** sigil size + pulse cadence, the exact
  `ARC_FOLD_DONE` split (how long the nodes hang on an empty frame), and the
  CAP-row type scale.

### 2026-07-14 — Phase 5, round 1 (structural: deletions, CI, math)

- **Deletions** (`fd9abb9`, `21cb068`): the repo's single react-doctor P0
  (`legacy/canvas/ThreeBackground.tsx`, archived `new Function()`) and
  `lib/queries.ts` (legacy page-editor tables, ADR-037) — both
  legacy-only consumers, Phase-1 precedent. Then the NavigationCockpitV2
  cluster: the old scroll-HUD homepage (25 files), its
  `/archive/current-home` route + the `/test` index that mounted it, and
  the orphaned `lib/particle-config-server.ts`; barrel + stale comments +
  CLAUDE.md references fixed. **ESLint 327 → 300 warnings.**
- **CI hardening** (`414f856`): `verify.yml` gains a corridor-smokes job
  (landing-corridor + device-matrix, every PR/push, chromium ×4 viewport
  projects, failure artifacts) and a PR-only react-doctor job scoped to
  NEW issues (`--scope changed`, fetch-depth 0). ADR-040 records the
  deliberately-accepted finding classes (v7-parse html sink,
  long-documented-component style, impure-updater misfires, legacy/
  registry scan-scope caveat) so CI + future audits don't re-litigate.
- **Math consolidation** (`85a96df`, Opus subagent + orchestrator seam
  review): 58 scattered clamp01/clamp/lerp/smoothstep/smootherstep
  definitions → ONE canonical import-free `lib/math.ts`; exporting homes
  re-export (import paths preserved: corridorMap, ringMath,
  particle-geometry, utils, depthGatewayStore, journeyScalars,
  artifactGeom); 15 files' identical local copies swapped to imports;
  **13 behavioral variants deliberately left** (degenerate-edge guards,
  NaN/Infinity-to-0 clamps incl. the test-asserted seamPixelize,
  arg-order and clamped-t variants) — consolidating them would change
  behavior. The journeyScalars three-free seam holds (`lib/math` imports
  nothing).
- **A11y batch** (`5028eea`, Opus subagent + orchestrator diff review):
  react-doctor's mechanical cluster on app/(admin) + components/admin —
  176× `type="button"` (form-submit trap checked per button: the two
  in-scope forms have no bare submit buttons), 38× `aria-label` on
  icon-only controls, 2× keyboard triads on trivial clickable divs.
  Deliberately left: modal backdrops with interactive children,
  drag/canvas surfaces, hover menus, labels needing `useId`
  restructuring, visible-text buttons (aria-label would override).
- Gate per commit: typecheck, ESLint 0 errors, 246 unit tests, prod /
  analyze build (First Load JS unchanged at 72.8 kB gzip), corridor
  36/36; + ring 16/16 + arc-cases 8/8 on the math commit.
- **Still on the Phase-5 board (each wants a fresh, focused session):**
  frame-orchestration pass (rAF read/write phasing + per-layer painter
  dispatch — the remaining perf lever; eyeball-gated), hooks-warning
  burndown (300, semantic not mechanical), anchor change-signal redesign
  (per-frame store contract), card-face mipmaps (eyeball-gated).

### 2026-07-14 — Phase 4 (WebGL/device hardening + the mobile-LCP lever)

- **Quality governor** (`6796253`, ADR-038): the corridor's missing adaptive
  layer. One-shot `WEBGL_debug_renderer_info` probe
  (`lib/webgl/rendererClass.ts`) — software rasterizers route to the static
  fallback via `corridorCapable()`; weak-but-real GPUs open two rungs down.
  Runtime frame governor (`lib/hooks/useQualityTier.ts`): monotonic ladder,
  DPR 1.75→1.25→1.0 then count multiplier 1.0→0.6→0.35, stepping only on
  sustained >24 ms over 1200 ms (1500 ms cooldowns), sampled in
  MotionFollowerDriver's priority −10 useFrame. Heavy painters read counts via
  `useCorridorCount` — byte-identical at multiplier 1. Under automation
  (`navigator.webdriver`) the mount gate keeps 3D and the governor is a no-op,
  so headless SwiftShader smokes stay deterministic. +4 ladder unit tests.
- **Tablet band** (`aad7ed0`): 760–1280 px COARSE-POINTER devices (iPads) now
  get the mobile GPU profile (antialias off, DPR ≤1.4) instead of the desktop
  one; a tablet-width desktop window keeps the desktop profile.
- **Fixed counts tier-gated** (`2d8c50d`): ThoughtformAtmosphere STAR_COUNT
  420 and LatentWormholeWalls STREAK_COUNT 520 were full-count on every tier;
  now per-tier + governor-scaled (desktop unchanged).
- **Per-frame hygiene** (`90c105a`): ThoughtformAtmosphere / GatewayThroat /
  ThoughtformCompassGate drove twinkle/breath/spins off absolute
  `clock.elapsedTime`, which jumps on demand→always re-engage (visible pop on
  scroll re-entry) — each now accumulates a clamped-dt phase advanced only
  while painting. HologramOrbits' per-orbit per-frame `Vector3.clone()`
  replaced with a reused projection scratch.
- **Device-matrix probe** (`5894e73`,
  `tests/visual/corridor-device-matrix-smoke.spec.ts`): report-only FPS + the
  GPU profile actually granted to the canvas across all four viewport
  projects, plus hard assertions that no-WebGL and reduced-motion resolve to
  the static fallback. Confirms the tablet fix live (iPad project: antialias
  false, effective DPR 1.4). 12/12.
- **Mobile-LCP lever** (`8c9aaab`, `ef7e0ad`, ADR-039 — PROTOTYPE, flag OFF):
  CSS first-paint hero reveal behind `html[data-hero-css-reveal]`
  (`?heroReveal=css` / `NEXT_PUBLIC_HERO_CSS_REVEAL`). Opaque first paint +
  transform-only rise (measured: clip/filter can't beat hydration; fades add
  nothing the lab credits). **Premise correction:** real Chrome records the
  H1's LCP entry at first paint even at opacity:0 (292 ms flag-off), so
  "mobile LCP 7.9 s pinned by the [data-m] reveal" was a lantern attribution
  artifact — lantern chains the JS bundle into text-LCP and reports ~9.5 s in
  BOTH flag states. The USER-VISIBLE gate is real (headline missing at 700 ms
  under 4× throttle without the flag, painted with it) — A/B screenshots in
  `assets-staging/hero-reveal-ab/` await Vince's brand-motion call.
- **Deferred → moved to Phase 5 (owner decision, 2026-07-14):** P4 is
  code-complete; the remaining code items are micro-optimizations, not
  adaptivity gaps, and were formally re-scoped to Phase 5:
  - rAF-loop consolidation — the DOM loops carry one-writer ordering
    contracts (e.g. `brandmarkScreenRectRef` write/read ordering between
    the SVG actor and the physics core). Merge with the "~25 useFrame
    painters dispatch regardless of per-layer visibility" lever into ONE
    Phase-5 "frame orchestration" pass (same files, one verification
    cycle).
  - Anchor-array hoists — a fresh array per frame IS the Zustand
    change-detection signal; reuse would freeze connectors. Needs a
    redesigned change signal (version counter), not a mechanical hoist.
  - `generateMipmaps=false` on card faces — desktop-only ~15 MB GPU win;
    orbiting cards minify at depth, so shimmer risk wants an owner eyeball.
  - Services wheel listener: CLOSED without change (verified already
    correctly scoped — preventDefault unreachable unless the ring is
    captured).
- **P4 sign-off still owed (owner, not Phase 5):** real-device pass (iOS
  Safari / Android Chrome / one older Android — the governor shipped on
  SwiftShader evidence); eyeball the scroll re-entry pop removal; decide
  ADR-039 (`?heroReveal=css` entrance — flip default or drop). ADR-037's
  two owner actions remain open independently of any phase.
- Gate per commit: typecheck, ESLint 0 errors / 327 warnings, 246 unit tests,
  `NEXT_DIST_DIR` prod build (First Load JS unchanged at 72.8 kB gzip),
  corridor 36/36 + services-ring 16/16 + arc-cases 8/8 + device-matrix 12/12
  (workers=2). Desktop full-quality path byte-identical throughout; the
  re-entry-pop removal and the flagged hero entrance want owner eyeballs.

### 2026-07-14 — Phase 3b (performance: assets, auth path, payloads)

- **Case screenshots** (`22f5e60`): the four Build-park PNGs
  (2000–2263 px, 3.07 MB) → 1000 px webp q82 (**133 kB, −96%**); dims
  updated in `toolCardData`; HTTP cache warmed at corridor mount so the
  first-arm bake isn't a cold burst. Baked card eyeballed at DPR 1.75 —
  identical (LUT + dot veil dominate).
- **Fonts** (`4bec129`): six brand faces → woff2 (**789 → 321 kB, −59%**),
  woff2-only src (universal since ~2016; OTF/TTF deleted, mondwest stays on
  next/font). The three bake-critical faces are preloaded — kills the
  `waitForCardFonts` 1500 ms bake-with-fallback race.
- **Hero** (`566467d`): explicit dims + `fetchpriority=high` +
  page-level preload for `Gateway_v1b.webp`. The 835 kB asset is NOT
  swapped — candidates for owner review in `assets-staging/hero-candidates/`
  (webp re-encode barely helps; **AVIF q45 = 190 kB**, 2048px webp = 143 kB).
- **Supabase off the anonymous path** (`566cc02`): AuthProvider lazy-inits
  gated on persisted `sb-*` token / URL auth params / a same-tab sign-in
  bridge; UserStatus defers signOut to click. **First Load JS 106.8 →
  72.8 kB gzip** (449.8 at origin, **−84% cumulative**). Verified: anonymous
  → zero supabase chunks/calls (dev + prod build); token → lazy init opens;
  /admin terminal renders; prod /astrogation still walls.
- **Prototype HTML trim** (`74ad0a1`): 107 annotation comments stripped at
  the parse-pipeline tail (source file untouched) — the served landing
  document drops **133.5 → 111.0 kB** (comments shipped twice: SSR + RSC).
- **Deploy hygiene** (`eb508e3`): `.vercelignore` drops ~33 MB of
  lab-only/unreferenced assets (gateway-hero, studio.hdr, showcase/,
  Vince-4.jpg). Kept: `videos/` (the PUBLIC /claude-workshop route ships
  the key visual — caught in verification) and `images/gateway/` (admin
  orrery). Labs verified serving in dev.
- **Mobile chunk defer** (`7d6acc0`): the corridor WebGL chunk gates on
  first scroll/input/idle (2.5 s cap) on ≤960 px viewports — the parse
  burst leaves the hydration window; mount machinery untouched.
- Gate: typecheck, ESLint 0 errors / 327 warnings, 242 unit tests,
  prod build, corridor 36/36 (+ring/arc-cases green; single-project runs
  need bounded workers — WebGL starvation), landing + card + fonts
  eyeballed. Local-lab Lighthouse (noisy machine): desktop 79 / LCP 1.6 s;
  mobile 59 / LCP 7.9 s — mobile LCP remains hydration+reveal-gated
  ([data-m]), the explicit Phase-4 decision item.

### 2026-07-14 — Phase 3 (performance: landing First Load JS)

- **The WebGL stack is out of the landing's initial bundle**: First Load JS
  **449.8 → 106.8 kB gzip (−76%)**, parsed 1553.7 → 330.7 kB. Four seams,
  each its own commit:
  - `98e48cf` — HomeCorridor lazy inside `useCorridorMount`'s nested root
    (React.lazy + Suspense; the sync `.home-corridor-host` wrapper keeps the
    `hasContent` recovery guard satisfied).
  - `da410e8` — BrandmarkParticleCanvas via `next/dynamic` ssr:false (the
    vector actor + dock glyphs are the mark; the canvas is atmosphere).
  - `b3c5681` — journey scalars extracted to the three-free
    `journeyScalars.ts` (intelligenceLayerGeom re-exports; bodies
    byte-identical).
  - `3443801` — `RING_CARD_CTA_BOX` + bake dims to the three-free
    `hologram/ringCtaBox.ts` (one layout constant was dragging
    three/fiber/drei in via ServicesRingHitAreas).
  - `e653950` — services-ring smoke measures the runway AFTER the corridor
    inflates (the lazy chunk widened a pre-existing post-hydration
    inflation window; below-the-fold, no CLS change).
- **Lab mobile (same-day)**: FCP 2.0→1.5 s, Speed Index 5.0→3.0 s,
  LCP 8.2→7.1 s, TTI 12.1→10.8 s (before = prod www / old bundle; after =
  localhost prod build). Remaining initial: supabase-js 34 kB gz,
  gsap 19.2 kB gz, landing DOM.
- **Newly exposed follow-ups (not this phase):** mobile LCP is the hero
  PARAGRAPH at 93% render-delay — the `[data-m]` reveal only fires `.is-in`
  after hydration, so LCP ≈ hydration; a CSS-only first-viewport reveal
  would collapse LCP toward FCP (ADR-scale, touches reveal choreography).
  `Gateway_v1b.webp` is 835 kB (hero visual) — recompress. TBT burst from
  the async three chunk parse — consider idle/first-scroll deferral on the
  mobile tier.
- Gate: typecheck, ESLint 0 errors / 327 warnings, 242 unit tests, prod
  build, corridor 36/36 + ring 16/16 + arc-cases 8/8 smokes, landing
  eyeballed at 6 depths incl. an early-load frame (hero composed at 700 ms,
  no brandmark flash).

### 2026-07-14 — Phase 2 (security + correctness)

- **Interlude (post-Phase-1, Vince-directed):** no-unused-vars zeroed out via
  rule options + underscore aliases (`b077fbf`, 346 → 327 warnings), the two
  remaining showcase dupes dropped (`ebbe433`), and the corridor smoke suite
  made **fully green (36/36)** — the three stale Services tests retired in
  favor of `services-ring-smoke` coverage and the `:102` engagement contract
  reformulated as ON/OFF legs after empirically mapping the band across
  viewports (`c06fef1`, `1d2f967`); the file is serialized against WebGL
  context starvation.
- **BYPASS_AUTH closed** (`885c5fa`): astrogation's hardcoded `true` is now
  `NODE_ENV === "development"` (compile-time-inlined). Verified both ways
  with a Playwright drive: the `.next-verify` production build served on
  :3013 redirects sessionless `/astrogation` to the `/admin` Credential
  Terminal with zero tool nodes mounted; dev keeps the bypass branch.
- **RLS review** (`a7c2718`): ADR-037 documents the trust boundary —
  public reads on landing content are intentional; every
  "any-authenticated-can-write" policy is a gap-if-signups-open;
  `brandmark_presets` anon INSERT is a constrained lab feature; the
  `useTemplates` client write is RLS-safe (`auth.uid() = user_id`).
  Staged (NOT applied): `DRAFT-20260714_tighten_admin_write_policies.sql`
  with an `is_admin()` JWT-email check. Two owner actions pending.
- **Effect cleanup** (`b991a2c`, `3f2a3f4`): CelestialConnector's reveal
  observer now disconnects via React 19 ref cleanup (real leak); the four
  `onCreated` webglcontext listener pairs documented as element-lifetime
  (intentional); useBrandmarkJourney/useRevealMotion verified false
  positives.
- **SSR guards** (`e66c0a7`): ServicesCardRing veil/glow texture bakes
  guard `document`; NavigationCockpitV2 confirmed internal-only (Phase-5
  deletion candidate).
- **Impure state updaters** (`e4f3bd0`): ParticleConfigContext's ten
  update callbacks now schedule the debounced autosave AFTER commit
  instead of inside `setConfig` updaters. The seven flagged production
  components (ServicesStage, HudNav, TerminalReveal, Tree,
  ServicesPlateCluster, IntelligenceArtifactScene, AuthProvider) were
  read individually: none contains a `setState(fn)`-nested side effect —
  the rule's callback-shape heuristic misfires on sibling setStates in
  ordinary event/subscription handlers. Left as-is by design.
- **no-eval P0**: `new Function(code)` in `legacy/canvas/ThreeBackground`
  — archived, unimported, build-excluded; Phase-5 deletion candidate.
- Gate: typecheck, ESLint 0 errors (327 warnings), 242 unit tests,
  production build, corridor smokes 36/36, landing eyeballed at 10 scroll
  depths, bundle unchanged at 449.8 kB gzip.

### 2026-07-14 — Phase 1 (zero-risk hygiene: delete-only + trivial)

- **Orphans deleted** (all verified zero-reference; owner decision: delete
  outright, git history is the archive): the v7 landing twins
  (`LandingV7`/`V7Landing`/`prototypeRuntime`), the traveling-orbits cluster,
  DepthGatewayScene leftovers (`AstrogationField`, `brandmarkCloud`,
  `CorridorSeamPixelField`, `ServicesCardStack`), lib leftovers
  (`useOrbitDrift`, `ParticleSceneContext`, `useScrollMetrics`),
  `LatentTopographyContours` (+ stale docstring fixed), `HandoffOrbitEmbed`,
  `orbitStyles`, `LoginModal` (auth-checked: no dynamic/string imports),
  `constants/` + the legacy-only constants re-export in `lib/types.ts`, and
  `intelligence-layer/_legacy/` (ADR-014, superseded by ADR-016).
- **Dead deps removed:** 3× `@dnd-kit/*`, 5× `@tiptap/*` (only consumer was
  build-excluded `legacy/`); `@types/sharp` moved to devDependencies.
- **Logging:** the 9 API/hook `console.log` sites now route through
  `lib/logger`; stale "terrace" comment fixed (ADR-036); dead
  `buildDepthTicksHtml` alias deleted.
- **Hygiene:** duplicated showcase assets dropped (sha256-identical to
  `public/project-cards/`); 316 untracked root dev screenshots (~116 MB)
  purged from disk (already ignored by the root `/*.png` pattern).
- **Lint:** `@typescript-eslint/no-unused-vars` burned down 128 → 19 across
  59 files; total warnings 470 → 346. The 19 that remain are deliberate
  (rest-sibling prop stripping, uniform fn-family params, exported no-op API)
  and need rule options the config doesn't enable — see the burn-down commit.
- **Gate:** typecheck, ESLint (0 errors), 242 unit tests, production build
  green; corridor smokes byte-identical to the Phase 0 known-red baseline
  (no new reds); landing First Load JS unchanged at 449.8 kB gzip (≤ baseline).
- Commits: `a2ae117`, `f8b8f79`, `206c560`, `c47fb6b` (orphan clusters),
  `d5a23c6` (needs-verification), `7ce66e4` (deps), `aca6f2c` (logging),
  `7ae7474` (hygiene), `c6d79a8` (lint), plus this ledger entry.

### 2026-07-14 — Phase 0 (cleanup plan kickoff)

- **Worktrees pruned:** 6 in-repo + 1 external git worktree removed (~2.6 GB
  freed); 3 merged branches deleted.
- **Guardrail added:** env-gated `NEXT_DIST_DIR` in `next.config.mjs` so
  verification/analyze builds can target `.next-verify` without clobbering a
  running dev server's `.next`. `.next-verify` / `.next-build` added to
  `.gitignore`; matching generated-type globs added to `tsconfig.json` so an
  alternate-distDir build does not auto-rewrite tsconfig. Default behavior is
  byte-identical when the env var is unset; nothing product-visible changed.
- **Baselines captured** in [`baselines/2026-07-14-phase0/`](baselines/2026-07-14-phase0/):
  bundle (landing First Load JS 449.8 kB gzip; three.js core 166.5 kB gzip),
  ESLint (0 errors / 470 warnings), react-doctor 0.7.7 (true post-prune score
  **30/100**, up from the worktree-polluted 13), Playwright smokes (87 pass /
  13 fail / 32 skip), Lighthouse (desktop 99 / mobile 73; mobile LCP 8.2 s).
- **Known-red baseline widened after warm-server verification:** the corridor
  suite reproduces the identical 13 failures against a freshly started,
  pre-warmed dev server, so the reds are not a cold-server artifact. The
  known-red set is the Services-hologram cluster (`:176`/`:203`/`:233` — stale
  tests asserting markup retired by the ADR-029/030/033 Services reworks) plus
  a deterministic iphone-14-only red at `:102`. See
  [`baselines/2026-07-14-phase0/playwright-smokes.md`](baselines/2026-07-14-phase0/playwright-smokes.md).
- Commits: `cca26d7` (guardrail), `489a842` (baselines), and this ledger entry.

---

## Quick links

- Patterns: [BEST-PRACTICES.md](BEST-PRACTICES.md)
- Decisions: [decisions/README.md](decisions/README.md)
- Vocabulary: [LANGUAGE.md](../LANGUAGE.md)
- Root project memory: [CLAUDE.md](../CLAUDE.md)
