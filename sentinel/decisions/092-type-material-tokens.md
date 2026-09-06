# ADR-092: The type ramps are tokens by role, and the site sits on them

**Status: Proposed** (2026-09-06) — **stages 0 and 1 have landed.** Stage 0
declared the tokens and put the ratchet guard and the gate's new stages in with a
byte-identical render; stage 1 put the casefile family, the map's SVG and the kit
on them (see §Stage 1, measured, below). Four stages remain — the landing
surfaces, the arcs, the Bold faces and the docs ledger — so this stays Proposed
until the sweep is done rather than being Accepted on the surface that happens to
have gone first. ADR-091 is Accepted as of stage 1: its composite is what
`mount=shipped` mounts.

**Supersedes** DESIGN.md's `typography.heading.fontWeight: 700` and its "PT Mono
(Bold, uppercase, tight tracking)" line; `typography-system.md`'s Weights and
Letter Spacing tables; `tokens.md`'s "Section Header … bold weight" preset.
**Promotes** ADR-091's composite direction (`KJ`) from a lab knob set to the
site's system. **Retires** ADR-089's glass on the casefile housing (the housing
goes flat; the lip stays).

## Context

ADR-091 measured the proof casefile against two admired interfaces and found the
difference was never the values. It was the COUNTS: gold on 200 objects against
15–112; 27 % of text above weight 500 against ~2 %; eleven tracking rungs with
the largest carrying a fifth of the text against 50–98 % on one rung; 20
structure lines in two hues against ~150 in one. A wave of sixty stills graded
the eight rules it derived, and the owner approved the composite — then asked for
the system to be BUILT as tokens and IMPLEMENTED across every content surface.

The site-wide census confirmed the panel's pattern is the site's. 466
`letter-spacing` declarations on **36 distinct rungs**, the largest carrying 16 %.
72 text rules at weight ≥ 600 — **28 %** of all weight declarations. **Zero**
weight tokens anywhere. Five tracking tokens, scoped to one route sheet's `:root`,
two never used, and **17 sites carrying fallbacks that disagreed with the token
they could not reach** (`var(--track-widest, 0.18em)` against a real `0.15em`).
~282 gold-bordered objects. 41 box-shadows, ~35 of them gold glows.

And the house's own law disagreed with itself: `typography-system.md` says "avoid
600+ on UI" while DESIGN.md's frontmatter declares `fontWeight: 700` for headings
and its prose calls HUD labels "PT Mono (Bold …)" — which the code had already
stopped doing (`.hero__headline` is 400; the live section titles are PP Neue
Montreal, not PT Mono).

## Decision

### 1. Seven tokens, named by role, in the first `:root` of `variables.css`

| token             | value     | role                                                                 |
| ----------------- | --------- | -------------------------------------------------------------------- |
| `--track-copy`    | `0`       | sans prose                                                           |
| `--track-display` | `-0.02em` | sans display, sentence case (DESIGN.md's own heading value)          |
| `--track-label`   | `0.08em`  | **the base rung**: every mono chrome label                           |
| `--track-eyebrow` | `0.15em`  | the one departure: eyebrows, bracketed designations, kickers, counts |
| `--weight-light`  | `300`     | ledes only                                                           |
| `--weight-text`   | `400`     | rest state, both faces                                               |
| `--weight-lit`    | `500`     | **the ceiling**: sans display and every lit/active state             |

Named by ROLE as the gold ramp is (`--gold` / `--gold-line` / `--gold-ink`): a
designer picking one answers what the element DOES, not how wide it should be.
The magnitude names (`--track-wide`, `--track-wider` …) are kept as byte-identical
aliases beside them until stage 4, so the 100 existing consumers cannot move.

**Why `.08em` and not the kit's `.06em`.** The HUD frame is the datum the content
is seated into and is not swept, and its own labels run `.08em`. A content base of
`.06` would give the screen two bases — the exact defect ADR-091 found one level
down. The map's `MONO_ADVANCE` (0.68em) is 0.6 + **0.08**, so the map's main rung
joins the base with no projection change. Sixty existing `.08em` sites stay
byte-identical, so every pixel that moves in the sweep is a rung COLLAPSING. And
0.02em at 13px is 0.26px per advance — under what the graded stills could resolve;
what the wave proved was concentration (11 → 7 rungs), which `.08` delivers
identically.

**Mono has no 500.** PT Mono ships 400 + 700; `--weight-lit` on mono resolves to
400 by CSS font matching, and that is the design: emphasis on mono is ink, never
weight. A mono 700 is DELETED, not set to 500 — a 500 that renders 400 is a lie in
the source. PP Neue Montreal has 400/500/700 loaded; sans display takes 500.

### 2. Enforcement first, then the sweep

- **`tests/lib/type-material-tokens.test.ts`** counts, per production sheet, the
  `letter-spacing` literals, the weights ≥ 600 (including the `font:` shorthand,
  which a weight regex alone misses), and the blocks that uppercase the sans —
  and pins each count. **The pins are a ratchet.** A content sheet's count may
  only go down; frame sheets and frame blocks (`.hud*`, `.rail-manifest*`,
  `.rin-*`, the mobile signal) are pinned EXACT because the frame is never swept.
  It also guards the tokens' presence in the FIRST `:root` (the design MCP
  parses from the first occurrence), the aliases' all-or-none presence, and,
  self-arming at stage 4, the absence of any legacy name.
- **`scripts/design-eval/mechanical.mjs`** gains `weight`, `tracking`, `case`,
  `text-shadow` and `accent` stages, walks pseudo-elements, classifies a zero-blur
  shadow as a line rather than depth, and takes `--exclude` and `--prm`. The
  tracking stage PRINTS the rung count and the top rung's share — ADR-091's two
  numbers as a standing readout.
- The design MCP's typography group matches `track|weight`, and `design_tokens`
  reports drift when DESIGN.md declares a heading weight above the live ceiling —
  the row that would have surfaced the 700 weeks ago.

### 3. Six stages to `main`, each verified, no flags

0. Tokens declared; the guard pins today's counts; the gate grows — **byte-identical**.
1. The casefile family on the ramps, the map SVG's second accent token and weights,
   the housing flat, the grid seat, the six control stills re-shot, the kit's
   absorbed knobs deleted; ADR-091 → Accepted; the docs corrected.
2. The live landing surfaces, one commit each: hero + contact + about, the
   corridor, services (with its content edit), voidwalker's two live sheets, the
   three baked canvases via `lib/services-ring/ringType.ts`; the eleven content
   PNGs re-baselined once, the two HUD PNGs unchanged.
3. The arcs, and `console.css`'s base by selector.
4. The Bold faces and the magnitude aliases retired — **byte-identical**.
5. This ADR → Accepted; the ledger row.

Dead CSS (most of `landing.css`; three of the five voidwalker sheets) is tokenised
mechanically so the ratchet reaches zero, and is NOT deleted here: `/claude-workshop`
parses a second prototype against the same sheet, and deletion waits on its map.

### 4. What is decided that the lab did not settle

- **The casefile housing goes flat.** The KJ still the owner approved had no glass
  blur, no bloom and no scanline; ADR-089's glass is retired on this surface. The
  lip stays — a clipped ring, not a blur. This also removes the hazard of the grid
  seat painting under a 14px blur.
- **The brief's `em` marker keeps gold** — ADR-058 U1's ruling stands and it is a
  mark that points at something. The one deliberate departure from the KJ still.
- **Mono display stays uppercase** (`.hero__headline`, the arc card titles): the
  case ruling is about the SANS display, and mono is chrome-register.
- **The map keeps three tracking rungs of its own** (`.02`, `.04`, `.05`): its
  labels are placed by arithmetic, `BAND_TRACK > LABEL_TRACK` carries a register
  the guards pin, and a change re-cuts the carrier's rings. Documented as where
  the rule stops, in `.claude/rules/interface-kit.md`.
- **The hologram's emitter glow and base circles are sanctioned by name**, as the
  brandmark's glow is: the one lit object in its station.

## Alternatives rejected

- **`.06em` as the base** (the kit's value): two bases on one screen; the map's
  rung stays foreign forever; indistinguishable from `.08` in the graded stills.
- **Magnitude names** (`--track-wide`): the house's own gold ramp shows why role
  names survive and lightness names drift.
- **A feature flag**: ADR-070 U35 — a flag is a comparison lever, and the lab is
  that lever. Once the owner has read both, the loser goes.
- **Sweeping the HUD frame too**: it is the datum; retuning the datum while
  seating things to it is two moving parts. Its own contrast misses are logged.
- **Keeping 700 for mono emphasis**: the face has no 500, and emphasis on a
  monospaced chrome face is ink, not weight — which is what both references do.
- **Deleting dead CSS in this pass**: a second consumer of the sheet exists.

## Consequences

- The Bold faces (`PTMono-Bold.woff2`, `PPNeueMontreal-Bold.woff2`) leave the
  bundle and the preload at stage 4 — after the three canvases that bake `700 …
"PT Mono"` move to 400, or the textures bake a synthesised faux-bold.
- `cases-registry`'s 27-character claim cap was derived from `.045em` tracking
  against a ~234px half-column, and the move to `.08em` — a WIDER rung — is what
  should have broken it. **Measured, it did not, and no editorial trim was
  needed:** ADR-088 had already widened the register's measure, so at `.08em` the
  two 27-character claims set 242px into 312 available at 1280×720, 242/357 at
  1440×800 and 264/449 at 1920×1080, wrapping only above a **17px** font size
  against a 13.2px render. The wall is the SIZE ladder now, not the character
  count. The cap is KEPT at 27 as a ratchet — a cap that admits more characters is
  a looser guard — and its comment carries the measurement instead of the stale
  advance.
- Display line-heights sized for caps (`.contact__title` .9, `.fl-brief__title` 1,
  `.fl-mobile-head__title` .98 under a pin with no slack) need ≥ ~1.05 for
  descenders once the sans goes sentence case.
- The mechanical gate's "large text" relaxation (`≥ 18.66px AND bold`) stops
  firing under the ceiling; text at 18.66–24px now needs 4.5:1.
- The kit's bridge shrinks knob by knob as production absorbs each, and the six
  committed control stills are re-shot: **the bridge reaching zero is the
  definition of done.**

## Stage 1, measured

What the gate reads on the shipped casefile (`mechanical.mjs --url / --scope
".fl-case" --exclude ".fl-pda"`), against ADR-091's numbers for the same panel:

|                          | before    | after                                |
| ------------------------ | --------- | ------------------------------------ |
| gold objects             | 200       | **8–9 marks, 0 structure**           |
| text nodes above 500     | 30 (27 %) | **0**                                |
| tracking rungs (content) | 11        | **4, with 50 % on the `.08em` base** |
| structure hues           | 2         | **1**                                |

⚠ **TWO SCOPES, TWO TRUE RUNG COUNTS.** The kit's own probe reads **8** rungs on
the same panel because it includes the map's SVG lettering, which is placed by
arithmetic against `MONO_ADVANCE` and keeps three rungs of its own by ruling
(§4C — stage 1b, decided on stills). Quoting either number for the other is the
mis-measurement this ADR exists to stop.

Clean at the two paths nothing else guards: `--prm` at 1280×720 and 390×844 both
read 0 weight / 0 tracking / 0 case / 0 text-shadow / **0 accent-structure**, so
the ≤960 + reduced-motion restore block no longer puts gold structure, the two
station gradients and the glow back on every phone.

**What was NOT caused by this stage, confirmed by stashing** (the repo's own
method — the alternative is blaming a change for a failure it did not make):

- `services-ring-smoke` desktop: 14 passed, 1 skipped. The one failure this stage
  DID cause was a stale GUARD, not a render — the smoke asked for the open
  cartridge's mark by `--pda-hot`, the token §4A split. It asserts `--pda-sel` now
  **and** bans `--pda-hot` on the latch, so the two cannot silently re-merge.
- `mobile-section-seams` (2) and the arc smokes (5 per phone/tablet project) fail
  identically at HEAD with this stage stashed: `.home-v2-stage` never becomes
  visible on the WebKit phone projects. Pre-existing, environmental, and unrelated
  — every desktop case passes.
- The seven phone contrast misses the gate reports are byte-identical at HEAD.
  They are ANALYSIS defect 9's family on the mobile IA, newly VISIBLE because the
  gate is new, not newly caused.

## U1 (2026-09-06, owner) — the housing had no side edges, and a clip was eating them

The owner, reading the shipped panel: the frame's borders _"especially the left
and right sides, are not very legible"_, and the column split is _"fucking
ugly … what a regression"_. Both were stage 1's. Three things, in the order they
were found, because the first two answers were wrong about the cause.

**1. The split went solid and full-height, and the sweep's own rule said not
to.** R1 reads _"structure → 1px dawn at R2's rung, KEEPING THE LINE STYLE
(dotted/dashed)"_. It was a dotted dawn-alt .24 reticle guide over the record
column; stage 1 made it a solid `--fl-hz-seam` over the rail's whole height —
about six times the ink per unit length over 1.6× the length, with the last
~100px running past the directory's last row beside nothing. **Length is part of
weight**: the register's hairlines are .12 over ~460px, and a .28 line over
1030px is a different object. Dotted again, over `--fl-body-top` → `--fl-t11`.
The grid seat keeps its stubs and stops claiming the split as its second half.

**2. The lip fades through its middle, and the middle is where the long runs
are.** The ring was the services plate's 168° four-stop ramp — gold .34 → dawn
.1 at 45% → gold .1 at 70% → gold .3 — which is raking light across a 680px CARD
and a fade-out across a 1030px HOUSING. Flat now, one value; top and bottom are
unchanged and only the sides move. ADR-089 U2's own finding, applied to the last
piece of plate atmosphere on the surface.

**3. ⚠ AND THE REAL CAUSE WAS NEITHER — THE IRIS WAS AMPUTATING THE SIDES.**
Fix 2 was necessary and did not work, so the lip was painted **pure red** and
captured: only two rows rendered, y=131 and y=1115, 1410px each, and **no
vertical column existed anywhere on the plate.** `.fl-case` clips to
`inset(-30px calc(0% - 12px))` — 30px of vertical bleed, **12px** of horizontal —
while ADR-089 hangs the housing `--fl-hz-pad` (**18px**) outboard of that same
box. The panel's outer 6px per side, the gold lip included, was clipped away.
The −12px is ADR-056's own number and was correct for what it was written for:
half the reticle cross's 19px arm plus an AA margin. **ADR-089 seated something
further out and nobody re-read the clip.**

⚠ **THE GLASS IS WHY IT SURVIVED A MONTH.** A 14px backdrop blur draws a soft
boundary wherever it is cut, so the truncation read as the housing's own edge.
Stage 1 flattened the housing, took the blur, and left a hard unlined cut — the
owner's complaint is the same defect made visible, not a new one.
**A clip that amputates a border is undetectable while something else is drawing
a boundary in the same place.**

`--fl-iris-bleed: calc(var(--fl-hz-pad) + 2px)` — DERIVED, so the two cannot
drift again; the iris still closes to the same 50.5 % slit, so the fold is
unchanged. Measured after: left edge 947 lip pixels at x=237, right 948 at
x=1676, joining top 1396 and bottom 1414, at `rgb(66,55,30)` against the top's
`rgb(68,56,31)`. Light: all four at `rgb(206,190,159)` on parchment.

### Three guards, because none of these had one

- **The iris must bleed past the housing.** The smoke asserts
  `irisBleed ≥ --fl-hz-pad + 1` — the arithmetic that was missing between two
  rules in two files.
- **The split's guard had gone vacuous.** It read `backgroundColor`, which a
  background-IMAGE leaves at `rgba(0,0,0,0)`, so it would have passed forever
  once the split became a gradient. It reads the image too, and pins the STYLE
  (dotted) and the height (< 92 % of the band).
- ⚠ **THE MECHANICAL GATE WAS REPORTING PASS ON A SCOPE IT NEVER MEASURED.**
  It loads a URL, waits 2.5s and reads — it does not scroll — and on the landing
  the casefile is `visibility: hidden` until the dwell publishes
  `data-proof-live`. So every desktop, non-PRM run against `.fl-case` measured
  **zero text nodes** and printed PASS on all fifteen stages. It reports
  `MECHANICAL VOID` and exits 2 now. **A scope with no text in it is a failed
  run, not a clean surface** — the real reading paths are `--prm` and any width
  ≤ 960, where the casefile is static flow, and `capture-casefile-rows.mjs` for
  the scrolled state. The rule file's own recipe prescribed the void run and is
  corrected.

**The pattern, stated once:** stage 1's gates cleared this panel on counts — 0
bold, 0 gold structure, 4 tracking rungs — while two of its most visible lines
were wrong and a third was not being drawn at all. Every count was true. **A
count cannot see a line that is missing**, and the owner found all three by
looking. That is the fourth time on this surface that a still has beaten every
green gate.

## Left open

- The map's lettering residue (three rungs of its own).
- ANALYSIS.md defect 9: five chrome labels at 3.19–3.41:1 in dark, lifted by
  `--fl-hz-ink` .52 → .62 in light and measured by the new dark walk.
- The frame's own contrast misses (rail labels 4.41:1 at 9px, instruments 2.27:1
  at 8px): logged, not this pass.
- Gold structure baked into the ring's card texture (`pal.goldA(0.55)`): invisible
  to every gate; debt.
- Deletion of the dead landing and timeline sheets, gated on the
  `/claude-workshop` prototype map.

## Related

ADR-091 (the measurement and the kit) · ADR-089 (the housing; its glass retired
here) · ADR-088 (the left column's two ladders — the size scale this leaves
untouched) · ADR-067 (two faces by role) · ADR-063 U2 (gold split by role, the
model for role-named ramps) · ADR-058 (theme parity: an alpha inverts its meaning
across the flip) · ADR-070 U35 (no flags) · `docs/design/interface-kit/ANALYSIS.md`
· `.claude/rules/type-material.md`
