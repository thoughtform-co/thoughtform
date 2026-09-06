# ADR-092: The type ramps are tokens by role, and the site sits on them

**Status: Proposed** (2026-09-06) — stage 0 landed: the tokens are declared, the
ratchet guard and the gate's new stages are live, the render is byte-identical.
Accepted when stage 1 (the casefile family) lands.

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
- `cases-registry`'s 27-character claim cap was derived from `.045em` tracking and
  is re-derived from `scripts/measure-casefile-type.mjs` at `.08em`; two claims are
  exactly 27 today and may need an editorial trim.
- Display line-heights sized for caps (`.contact__title` .9, `.fl-brief__title` 1,
  `.fl-mobile-head__title` .98 under a pin with no slack) need ≥ ~1.05 for
  descenders once the sans goes sentence case.
- The mechanical gate's "large text" relaxation (`≥ 18.66px AND bold`) stops
  firing under the ceiling; text at 18.66–24px now needs 4.5:1.
- The kit's bridge shrinks knob by knob as production absorbs each, and the six
  committed control stills are re-shot: **the bridge reaching zero is the
  definition of done.**

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
