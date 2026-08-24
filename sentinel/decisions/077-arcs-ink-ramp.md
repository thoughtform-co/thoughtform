# ADR-077: The arcs get an ink ramp, so the light theme can reach them

- **Status:** Accepted (2026-08-24)
- **Surface:** every `/arcs/*` page · `components/arcs/arcs.css` (the ramp + its light override) · `tests/visual/arc-portfolio-smoke.spec.ts` (the parity walk)
- **Prior art:** ADR-058 (the light theme, and the `--dawn-rgb`/`--void-rgb` swap) · ADR-063 U2 (an alpha inverts its own meaning across the flip; gold split by role) · ADR-064 (`--con-*`, the pattern this copies) · ADR-072/075/076 (the arc surface)
- **Rules:** [`.claude/rules/arcs.md`](../../.claude/rules/arcs.md)

## Context

The owner sent a screenshot of `/arcs/portfolio` in LIGHT: the overview's
three cards painting a **near-black ground on parchment**, with the copy
inverted on top of it. "fix".

The cause is one line of CSS repeated forty-four times. `arcs.css` wrote
every colour as a RAW LITERAL:

```css
border: 1px solid rgba(235, 227, 214, 0.08);
background: linear-gradient(…), rgba(8, 7, 6, 0.55);
```

`rgba(235, 227, 214, α)` is cream-on-black **spelled out**. ADR-058 flips
the theme by swapping `--dawn-rgb` and `--void-rgb` wholesale, so a
literal is precisely the thing that swap cannot reach. Measured before
this pass at `?theme=light`: the tokens had flipped correctly
(`--void` = `#ece3d6`, `--dawn` = `#110f09`) while the card's computed
background was still `rgba(8, 7, 6, 0.55)`.

This is the "arcs' light theme is partial and pre-existing" note that
ADR-072 left open, found by the owner rather than by a guard — because
nothing on this surface had ever measured colour.

## Decision

### 1. A ramp on `.arc-root`, redeclared in light

The house pattern already exists: `console.css` declares `--con-*` and
`theme.css` re-derives them for the light ground. The arcs get the same —
`--arc-ink-90 … --arc-ink-22` for copy, `--arc-edge` / `--arc-rule` /
`--arc-rule-dash` for structure, `--arc-grid*` for the dot-matrix lifts,
`--arc-plate` / `--arc-sheen` for a plate's ground, `--arc-chip*` for the
dossier's mode chip.

**Dark is byte-identical by construction**, with one deliberate
exception (§3): `--dawn-rgb` IS `235, 227, 214`, so every converted rung
composites to the literal it replaces. The plate ground is the same
trick one level down — `rgba(var(--void-deep-rgb), 0.55)` is `(5,4,3)`
at .55 over the section's `(10,9,8)`, which composites to `(8,7,6)`: the
literal, exactly.

### 2. The alphas are RE-DERIVED in light, never inherited

ADR-063 U2's finding, and `console.css`'s `--con-edge` note verbatim: an
alpha **inverts its own meaning** across the flip — `rgba(ink, .08)`
recedes toward BLACK on void and toward PARCHMENT on light, the same
number, and quiet becomes invisible. Dark-on-light also reads weaker
than light-on-dark at equal alpha. So the light block lifts every rung
(0.08 → 0.16 for an edge, 0.4 → 0.68 for a quiet label, and so on).

⚠ **The plate goes to FULL opacity in light.** `--void-deep-rgb` is a
_deeper parchment_ (228, 218, 201) only eight values from the ground, so
at .55 the recess would vanish. Measured luminance step from the section
it sits on: **0.0008 dark** (the card is defined by its border and its
gold tick there, which is the existing design) against **0.068 light**.

### 3. What is NOT byte-identical in dark, and why

`--arc-ink-40` goes **0.40 → 0.55**. Its 10px meta labels
("WORKSHOPS RUN") measured **3.19:1** on void — real text, under the
4.5:1 standard, on both client decks as well as the portfolio. This
surface has already ruled on exactly this (ADR-070 U6): _a label nobody
can read is not a quiet label, it is an absent one._ It measures 5.14:1
now.

`--arc-ink-42` is **deleted**, merged into `--arc-ink-40`. Once both
needed the same lift they were one rung wearing two names.

### 4. Two things stay literal, deliberately

`.arc-card__scrim` (the overview cards' photo scrim) and the hero's own
top band. Both sit over an IMAGE, and ADR-058's kept-dark-imagery rule
holds: flipping them washes parchment across a photo — which is the
exact defect ADR-075 had to fix on the hero, one surface earlier.

## Consequences

- **The keynote and workshop arcs are fixed too**, for free — same sheet.
  The recorded symptom ("the keynote's eyebrows and prose vanish on
  parchment") is measured gone: its designation reads 6.03:1 in light.
- **The guard is the durable half.** `arc-portfolio-smoke` gains a
  parity walk over both arcs × both themes.
  ⚠ **It COMPOSITES before measuring** — reading `color` alone reports
  the two themes identical and passes on a page nobody can read, because
  every rung is an alpha and an alpha means nothing until it lands.
  ⚠ It asserts **the ground actually flipped**, or the whole walk could
  run twice on the dark theme and pass.
  ⚠ It measures the plate as a **luminance step from its own section**,
  so it cannot be satisfied by a ground that merely differs.

| rung        | dark before | dark after | light before | light after |
| ----------- | ----------- | ---------- | ------------ | ----------- |
| card body   | 7.82        | 7.82       | —            | **7.98**    |
| card title  | 15.62       | 15.62      | —            | **13.84**   |
| meta label  | **3.19**    | **5.14**   | —            | **5.80**    |
| designation | 3.41        | 3.41       | —            | **4.64**    |
| dossier key | **3.41**    | **5.14**   | —            | **6.24**    |

("light before" is unmeasurable as a ratio — the cards were painting the
dark ground on parchment, which is not a contrast defect but a different
design.)

## Verification

`npm run verify` (1014) · `arc-portfolio-smoke` + `arc-terminal-smoke`
desktop, 20/20 · the new parity case across `/arcs/portfolio` and
`/arcs/ai-keynote` in both themes · looked at: the overview, a dossier
and the architecture beat in light and dark at 1440×900.

⚠ Still open, and now the only known light-theme gap on this surface: the
**arc hero's own copy on an own-plate arc** reads 2.0–2.5:1 in DARK over
its near-white key visual (ADR-075's recorded finding — that is the
photo's contrast, not a token's, and it wants the scrim retuned rather
than a ramp rung).
