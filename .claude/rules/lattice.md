# Rule: the lattice (ADR-149)

The brand system grid: the floor under the site's three grammars (the
corridor, the arcs decks, the sheet). Twelve columns in the band, thirteen
rungs read off the HUD rail's own tick ladder, one spacing scale named by
role, one chamfer ladder, one line law, one type ladder, ONE frame recipe,
and a section grammar with six named arrangements. A lab inside the real
frame, a ratchet, and an Awwwards jury whose usability score is capped by
measurement. The sheet (ADR-114) adopts first.

**Paths:** `app/styles/lattice.css` (tokens, `:root` only) ·
`components/lattice/**` (the recipes and three server components) ·
`lib/lattice/**` (geometry, breakpoints, the directions registry, the specimen
copy, the measurement) · `app/(internal)/test/lattice/**` (the lab) ·
`scripts/capture-lattice.mjs` · `scripts/lattice-round.mjs` ·
`scripts/design-eval/awwwards.mjs` · `tests/lib/lattice-*.test.ts` ·
`tests/visual/lattice-*.spec.ts`

**Read first**

- [ADR-149](../../sentinel/decisions/149-the-lattice.md) — the ask, the law
  amendment, the tokens, the frame, the arrangements, the lab and the jury, the
  first adopter, what it supersedes in the skill, what is left open.
- [ADR-065](../../sentinel/decisions/065-corner-law.md) — the corner law the
  chamfer ladder encodes; [ADR-089](../../sentinel/decisions/089-casefile-is-one-housing.md)
  — a clip cuts a border and never strokes one.
- [ADR-091](../../sentinel/decisions/091-interface-kit.md) / [ADR-092](../../sentinel/decisions/092-type-material-tokens.md)
  — the line law and the ratchet pattern this one copies.
- [ADR-114](../../sentinel/decisions/114-the-sheet.md) — the twelve-column
  ruled band the lattice promotes; [`sheet.md`](sheet.md) for its contracts.

## Contracts

- ⚠ **TOKENS AND MECHANISMS ARE SHARED; SKINS STAY COPIED.** The amendment
  ADR-149 makes to `sheet.css`'s "grammars are copied, never imported": a
  `--lat-*` token, the `.lat-frame` ring and the `.lat-sec` seam are the tier
  under the grammars (what ADR-092 did for type and ADR-048 for the band). A
  surface's COLOUR, its type clamps and its motion stay its own, restated on its
  own prefix. A sheet that imports another surface's skin is still a shared
  sheet by another name.
- ⚠ **`--lat-*` LIVES ON `:root` AND NOWHERE ELSE** (`lattice-tokens` asserts
  it). A lattice token declared on a child resolves to nothing on its parent
  and silently zeroes every `calc()` that reads it. The light rows are on
  `html[data-theme="light"]`, colours only, alphas re-derived (ADR-058).
- ⚠ **LOADED FROM `app/globals.css`, NEVER FROM `landing.css`.** The HUD guard
  slices landing.css's first `:root` as the frame's datum; a lattice token in it
  is a sweep of the frame. globals.css loads on every route, so no sheet route's
  import index moves (ADR-127's `sheet-close` pins them).
- ⚠ **A RUNG IS A HEIGHT ON THE LADDER, NEVER A TYPE SIZE.** `--lat-rung-N` is
  casefile.css's `--fl-tN` formula COPIED (N/12 of the rail box; pinned to
  `hudTicks.ts`). The casefile keeps its own `--fl-t6` / `--fl-t11` until Phase
  4 (the rail-mirror smoke reads them) and `--fl-t0` keeps its name until it is
  renamed with every consumer (`--ik-t0`, `casefile-type-lab.css`). Rungs
  resolve ONLY against the real rail: on a route without landing.css every one
  is invalid at computed-value time. On the phone (≤960) the rail stands down
  and the rungs are re-declared as spacing values — never left unset.
- ⚠ **ONE INNER-LEG CONSTANT.** `--lat-ch-leg: 0.586px` is d(2 − √2) at d = 1:
  insetting a 45° cut by 1px moves its diagonal by √2. The four `*-ch-in`
  tokens that spelled it (sheet, instrument, arcs ×2) read it now; the 0.6 and
  0.414 spellings elsewhere are errors to fix on migration, never to copy.
- ⚠ **THE CHAMFER LADDER NAMES WHAT IS LIVE.** chrome 0 · seed 16 · card
  `clamp(14px, 1.3vw, 22px)` (= `--sh-card-ch` = `--pf-card-ch`, byte-equal,
  pinned) · plate 26 · plate-fluid `clamp(16px, 1.8vw, 26px)` (the arcs').
  `lib/lattice/geometry.ts` is the source; the sheet is pinned to it.
- ⚠ **THE FRAME RECIPE IS ONE RECIPE** (`components/lattice/lattice.css`,
  Phase 1): host `border: 0; clip-path: var(--lat-cut)`, ring on `::before`
  as a two-contour evenodd polygon with BOTH outlines closed (ADR-148 U2),
  corners as `data-cut="tr-bl|tr|bl|none"` — the house default is the TR + BL
  pair (owner, 2026-10-06); `tr` is for an oriented or connected set. **No
  `tl-br`** (the console's diagonal is a law violation ADR-089 retired). A
  box with something hanging outside it takes `data-overflow="visible"` (ring
  at `inset: -1px`, ground on `::after`) — a host clip would cut it off. A
  clipped host is a containing block for `fixed`; no `contain: paint`.
- ⚠ **THE POLYGON TEXT IS `geometry.ts`'S.** `cutPolygon(cut)` /
  `ringPolygon(cut)` build the strings; `lattice-tokens` compares the sheet's
  text to them. A polygon hand-edited in CSS fails the hour it is written.
- ⚠ **THE RATCHET ONLY GOES DOWN** (`lattice-ratchet`): per production sheet,
  P polygons · S off-scale spacing literals · F literal font sizes · M
  off-ladder `@media` thresholds, pinned 2026-10-06 at the real counts, slack
  ≤ 10. Frame sheets are not listed and frame blocks are skipped. A new
  production sheet enters at its real count the hour it is written
  (`LATTICE_PINS=print` prints the line). Raising a pin is a design change
  and gets an ADR line.
- ⚠ **THE BREAKPOINT LADDER IS CODE** (`lib/lattice/breakpoints.ts`): max is
  the even number, min is max + 1. 980, 981, 759, 759.98, 1099 are the same
  rungs declared a pixel apart, and the ratchet counts each as drift.
- **THE SPACING SCALE IS ONE SCALE.** `variables.css`'s `--space-*` is the
  magnitude ladder (4…96 on 8px); `--lat-pad-*` / `--lat-gap-*` /
  `--lat-sec-pad` are the ROLES. DESIGN.md's frontmatter is pinned equal to
  variables.css (it is served as brand truth by `/api/design/mcp`).
- **THE LAB IS `/test/lattice`, INSIDE THE REAL HUD FRAME** (Phase 1), with
  its own registry (`lib/lattice/directions.json`: letters-only ids, the first
  value of every knob is production, `LA` the control), its own stamp
  (`.lat-read[data-stamp]`, which carries IDENTITY and values only the page
  can produce — a wait a script can satisfy itself is no wait), a `?grid=1`
  overlay drawn FROM the tokens (a token that drifts from the live tick shows
  as a doubled line), and `window.__lattice.measure()` as the one measurement
  the lab prints and the capture asserts on.
- **ONLY THE CONTROL CAN FAIL THE CAPTURE.** A direction failing a gate is the
  finding. Corners are hit-tested from BOTH ends (`elementFromPoint`: the cut
  resolves past the frame AND the square corners resolve to it), never parsed
  off the serialised polygon; a custom property is a string until something
  lays it out, so every length is read through a probe element.
- **USABILITY IS CAPPED BY MEASUREMENT.** The Awwwards jury
  (`scripts/design-eval/awwwards.mjs`, rubric `eval/awwwards.md`) scores
  Design 40 · Usability 30 · Creativity 20 · Content 10, three runs, the median
  per cell; a hit box under 44px, an overlap, a contrast miss or no focus ring
  in the cell's measured report caps usability at 6.0 and overwrites the
  holding-back line. The threshold (every category ≥ 7.5) is per CELL, with
  1280×720 dark binding. The jury is SELF-TESTED both ways before a round is
  logged: the control must fail, the register strip must pass. Advisory, never
  CI; the owner's loop stop, never the page's.
- **A WAVE IS ONE CSS STATE.** A fix found mid-round re-shoots every cell.
- **THE SHEET ADOPTS FIRST**, by aliasing (Phase 2: `--sh-datum/seam/rule/lip`,
  `--sh-card-ch(-in)`, `--sh-sec-pad`, the band's margin → `--lat-*`,
  byte-identical, `lattice-parity` at zero pixels) and then behind the `lattice`
  knob (Phase 3: direction `SM`, read on `/home-sessions?k=SM` first). ⚠ **No
  `var(--lat-x, <old value>)` fallbacks** — a masking fallback is the ADR-085 U2
  alias trap. The losing value, its CSS, its direction, its lane and the parity
  spec go in one commit at the ruling (ADR-070 U35).

## Never touch

The HUD frame (ADR-092, pinned EXACT) · the services bake (the lattice may NAME
16 / 26; `ringType.ts` reads no CSS token) · the era stage's housing (ADR-089
§Not promoted, the glass gate) · the corridor beats · the musings "no housing"
(ADR-122 U3) · `--fl-t6/t11` and `--fl-rail-*` (the rail-mirror law) · the
console's TL+BR (an owner override, pinned from both ends) · the sheet's "rails
are the page's only verticals" (ADR-114 U1 — columns are cells with shared
edges, never drawn rules; the overlay is lab-only) · `/arcs`'s owner gate first.

## Verifying

```bash
npx vitest run tests/lib/lattice-tokens.test.ts tests/lib/lattice-ratchet.test.ts tests/lib/type-material-tokens.test.ts tests/lib/theme-css-sweep.test.ts tests/lib/phone-viewport-units.test.ts tests/lib/hud-brand-tokens.test.ts
LATTICE_PINS=print npx vitest run tests/lib/lattice-ratchet.test.ts   # the line to pin a new sheet
node scripts/capture-lattice.mjs --wave lattice-01-r01 --headed         # Phase 1: the control's gates, the stills
node scripts/design-eval/awwwards.mjs --self-test                         # before a round is logged: the control must fail, the register must pass
node scripts/design-eval/awwwards.mjs --wave lattice-01-r01 --runs 3 --log
node scripts/lattice-round.mjs --wave lattice-01-r02                    # capture → score → the holding-back line
npx playwright test tests/visual/lattice-parity.spec.ts --project=desktop   # Phase 2: zero pixels moved
```

Read live: `http://localhost:3003/test/lattice?board=page&grid=1` (the port off
the running server). The Browser pane cannot screenshot this lab (rAF stalls
hidden); the capture script is the still.
