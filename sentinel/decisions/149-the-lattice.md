# ADR-149: The lattice — the brand system grid, its specimen page, and the jury that scores it

- **Status:** Proposed (2026-10-06, owner). Phase 0 (tokens, ratchet) and Phase 1 (the lab, the
  frame recipe, the arrangements, the jury) built and guarded; Phase 2 (the sheet aliased,
  byte-identical) built; Phase 3 (the first visible redesign behind the `lattice` knob) built
  for his read. Flips to Accepted at the Phase 3 ruling.
- **Surface:** `app/styles/lattice.css` (new, tokens on `:root`), `app/globals.css` (one import),
  `components/landing/v7/theme.css` (the light rows), `lib/lattice/{geometry,breakpoints}.ts`,
  `components/lattice/**` (the recipes, `Frame` / `Section` / `Grid` / `LatticeOverlay`),
  `app/(internal)/test/lattice/**`, `lib/lattice/{directions.json,specimen-copy.ts,measure.ts}`,
  `scripts/capture-lattice.mjs`, `scripts/lattice-round.mjs`, `scripts/design-eval/awwwards.mjs`
  (+ `_client.mjs`, `probe.mjs`), `.claude/skills/thoughtform-design/eval/awwwards.md`, the
  turnstone ship's `[types.LT]` and rubric block G, `tests/lib/lattice-{tokens,ratchet,directions}.test.ts`,
  `tests/visual/lattice-{parity,alias-readout}.spec.ts`; `components/sheet/sheet.css` and
  `instrument.css` (aliases; the `[data-sh-lattice]` scope), `lib/sheet/directions.json`
  (the knob and direction `SM`); the four `*-ch-in` tokens; DESIGN.md's spacing.
- **Related:** [ADR-048](048-editorial-band.md) (the band tiers the columns sit in),
  [ADR-065](065-corner-law.md) (the chamfer ladder), [ADR-089](089-casefile-is-one-housing.md)
  (a clip cuts a border and never strokes one; the ring), [ADR-091](091-interface-kit.md) (the
  line law, the measurement, the lab in the real frame), [ADR-092](092-type-material-tokens.md)
  (tokens by role on `:root`; the ratchet pattern; the frame is never swept),
  [ADR-099](099-proposal-nests-and-the-configuration-scrolls-in.md) (U2: the head datum solved
  from the frame's centre), [ADR-114](114-the-sheet.md) (the twelve-column ruled band),
  [ADR-118](118-the-arcs-overview-is-an-instrument.md), [ADR-127](127-the-sheet-ends-on-the-site-footer.md),
  [ADR-148](148-the-suri-setup-page-and-the-workshop-frame.md) (one frame on the workshop arcs;
  every evenodd ring closes both outlines).

## The ask

The owner, 2026-10-06: "our brand system has gone through a lot of iterations … our main
aesthetic is retrofuturistic inspired by navigational interface and terminal UIs. And while I'm
overall happy with the design of our website, I think the biggest area of improvement are our
frames and really building a grid system; Hex and Brasshands are good references, but I feel we
are not really reaching the level I want; Evangelion has also been a big inspiration. In terms of
aesthetic and vibe our branding is good; it's just that I don't feel I have a scaleable brand
system … I like the notches, what we're missing is a system following front end best practices,
but also understands GUI / FUI game interfaces." Then: "it's not just frames, it's also how
design sections and subpages." And the bar: "score yourself on the Awwwards scoring sheet.
Design 40%, usability 30%, creativity 20%, content 10%, each out of 10, as strictly as a real
jury would. After every round of changes, run the page and take a screenshot first, then score
while looking at it. Write down what's holding back the lowest category, and keep going until
every category is at 7.5 or higher."

## What the survey found

Three readings of the working tree at `e963e493`, the morning of ADR-148 U2.

1. **Three grids are documented and none is used.** The skill says 9×17 on a 5 % margin (fixed
   canvases); `references/spatial-system.md` says 12-column with `--tf-rhythm-*` and
   `--layout-content-*` tokens that exist nowhere in the repo; `app/styles/grid.css` is an
   8-column with no consumer. What the live site seats on is the rail's 13-tick ladder, and only
   the casefile reads it (`--fl-t6`, `--fl-t11`).
2. **ADR-114 already made a subpage "a ruled sheet on a twelve-column band, seams not gutters"**
   — the owner's Kindled + Kindred reference (`Grid System.jpg`) in one sentence. The
   twelve-column decision is settled by precedent; what is missing is that the grid lives in
   `sheet.css` and nothing else can seat on it.
3. **Eleven housings, four lip techniques** (a clipped evenodd ring; `border` + a single clip,
   which leaves the diagonals unstroked; the services plate's gradient shell; none), **nine
   chamfer sizes** in vw, cqw, svh and px, **six corner patterns** (TR+BL, TR, BL, the console's
   TL+BR, a folder-tab step, none), **~73 hand-written corner polygons** across 26 sheets, and the
   inner-leg constant spelled three ways (0.6, 0.586, 0.414). One factoring exists: ADR-148's
   `--arc-frame-clip` / `--arc-frame-ring`.
4. **Spacing has a scale nobody uses.** `--space-*` (4 … 96 on 8px) has 29 consumers in
   landing.css and zero in arcs, casefile, proof, services, musings, voidwalker, sheet. Forty-plus
   distinct px literals per area, under half on a 4px grid. DESIGN.md's frontmatter declared a
   different scale (xl 48 / 2xl 72 / 3xl 120), which matched nothing that paints and is served as
   brand truth by `/api/design/mcp`.
5. **Eight type ladders**; only the casefile and the proof card use a ratio (1.2), and even there
   the display rung is an independent clamp. The 44px station title is pasted as a literal four
   times. Copy sizes disagree across surfaces (13–19px).
6. **Three real width tiers** (the content box, the 1200 band, the 1440 instrument band) and nine
   hard-coded caps (1180 ×5, 1120 ×4, 1100, 1500 on a deleted station, 920 / 880 / 720 / 560);
   `var(--hud-content-inset, N)` written with four different fallbacks (22 / 48 / 64 / 161).
7. **About 23 width and 12 height thresholds**, several a pixel apart: 960 against 980 (the
   casefile goes static at 960, the console unwraps at 980), 1100 against 1101, 759 / 759.98 / 760.
8. **The infrastructure to fix it already exists**: `/test/interface-kit` mounts the real HUD
   frame with a readiness stamp and a knob registry (ADR-091); the sheet has a kit page, a
   directions registry and a ship (ADR-114); `mechanical.mjs` and `judge.mjs` gate and grade;
   `type-material-tokens` is the ratchet pattern; Figma's `UI Exploration` page carries
   `Frame/Housing`, `Frame/Bay`, `Frame/Cell` and a `Thoughtform/HUD` collection with
   `chamfer/plate 26` and `chamfer/seed 16`. There was no Awwwards-style scoring anywhere.

The reference grammar, read off his references: Evangelion's NERV screens number every panel,
head it with a notched tab, compose a wide-left / stacked-right field on a ruled grid and close
on a status ticker; Vilimovský's Cyberpunk panels have a datum strip and a terminus row, seams
not gutters, one material, corner labels, and a bay for the centrepiece; the Kindled + Kindred
sheet is one continuous ruled surface where every section is a cell of halves or thirds and the
hairlines run edge to edge. The two layers are the system: a ruled sheet, and the HUD grammar
seated on it.

## The decision

### 0. The law, amended

`sheet.css:34` states the house law: GRAMMARS ARE COPIED, NEVER IMPORTED. The lattice is not a
fourth grammar. It is the tier UNDER the three — what ADR-092 made for type (`--track-*` on
`variables.css`) and ADR-048 for the band (`--band-margin` on `landing.css`). So the law reads,
from this ADR: **tokens and MECHANISMS are shared; SKINS stay copied.** A `--lat-*` token, the
`.lat-frame` ring and the `.lat-sec` seam are shared by reference. A surface's colour, its type
clamps and its motion stay its own, restated on its own prefix.

### 1. The tokens — `app/styles/lattice.css`, on `:root`, loaded from `globals.css`

- **Columns.** `--lat-cols: 12`, `--lat-gutter: 0px` (seams, not gutters), `--lat-air` (the
  sheet's `--sh-gutter`, the air between two TEXT columns only), the band by reference
  (`--lat-margin: var(--band-margin)`, `--lat-wide-margin: var(--instrument-margin)`), and
  `--lat-col`, one column's width for a rule that must land on a column edge in a box that is
  not a grid. Twelve because a scroll document divides into the halves, thirds and quarters the
  references use; the skill's 9×17 stays for fixed canvases, where rows mean something.
- **Rungs.** `--lat-rung-0 … 12`, casefile.css:184–197's formula COPIED (N/12 of the rail box,
  `--hud-rail-y-start` to `--hud-rail-y-end`), pinned to `hudTicks.ts`'s thirteen positions and
  its two lettered majors (`--lat-major-a` = rung 4, `-b` = rung 8). `--lat-pitch` is the
  flowing-section unit. NAMING LAW: a rung is a height on the ladder, never a type size — the
  casefile's `--fl-t0` is a type size under the same prefix as its `--fl-t6` tick height, and
  that collision is why the lattice's type rungs carry role names.
- **The head datum.** ADR-099 U2's `clamp(48px, (100svh − C) / 2, 360px)` generalised:
  `--lat-head-datum` over `--lat-composition: 600px`, which a format overrides.
- **Spacing.** `variables.css`'s `--space-*` is the MAGNITUDE ladder (kept; 29 live
  consumers). The lattice names ROLES on it: `--lat-pad-chrome`, `--lat-pad-cell`,
  `--lat-gap-stack`, `--lat-gap-block`, `--lat-sec-pad`, `--lat-head-gap` — each a scale value
  or a clamp with scale endpoints, each the sheet's own number so Phase 2 moves no pixel.
  DESIGN.md's frontmatter is corrected to variables.css and pinned equal.
- **The chamfer ladder.** chrome 0 · seed 16 · card `clamp(14px, 1.3vw, 22px)` · plate 26 ·
  plate-fluid `clamp(16px, 1.8vw, 26px)`. The two responsive rungs are NAMED, not re-solved:
  `card` is byte-equal to `--sh-card-ch` and `--pf-card-ch` (pinned), `plate-fluid` to the arcs'
  three plate tokens. ⚠ **One inner-leg constant**, `--lat-ch-leg: 0.586px` — d(2 − √2) at
  d = 1: a 45° cut inset by 1px moves its diagonal by √2, so the ring's inner leg is `ch − 0.586`,
  never `ch − 1`. The four `*-ch-in` tokens read it now (sheet, instrument, arcs ×2); the
  casefile's 0.6 and the era cards' 0.414 are errors to fix on migration.
  `lib/lattice/geometry.ts` holds the numbers and builds the polygon strings; the sheet is
  pinned to it.
- **The line law.** ADR-091's, live in three sheets, promoted: `--lat-datum` is the rail's own
  track (.55), `--lat-seam` divides regions (.28), `--lat-rule` rules within one (.12); the one
  sanctioned gold line is a housing's lip, flat, a `color-mix` of `--gold-line` so light
  re-derives it. Grounds: `--lat-plate` (.62, the sheet's and the proof card's), `--lat-plate-thin`
  (.42, a housing over a live bed), `--lat-recess`.
- **The type ladder.** One modular scale, `--lat-copy: var(--band-copy)` × 1.2: lede, h3, h2;
  chrome-lg / -md / -sm by division with the house floors; `--lat-title` (the station title, pasted
  four times, named once) and `--lat-display` (the sheet's) kept as the two display rungs tuned
  by eye. Declared in Phase 0, consumed by nothing until Phase 3's knob.
- **Breakpoints.** No `@custom-media` (the toolchain has no preset-env), so
  `lib/lattice/breakpoints.ts` is the record — narrow 1100 · phone 960 · stack 900 · tight 700 ·
  mini 640 · short 680h · compact 760h; LAW: the max side is the even number, the min side is
  max + 1 — repeated as a comment table in the sheet and enforced by the ratchet.
- **The phone.** At ≤960 the rail stands down, so every rung's input is re-declared as a spacing
  value (an unset custom property invalidates every `calc()` that reads it, silently), the grid
  becomes four columns, the section rhythm is the sheet's phone value. `svh` only.
- **Light.** One `html[data-theme="light"]` block in theme.css: seam .42, rule .22, the plate
  opaque, recess .05. Alphas re-derived, never inherited (ADR-058).
- ⚠ **Where it loads.** From `app/globals.css` after variables.css, on every route — so no sheet
  route's import index moves (ADR-127 pins them) — and OUT of landing.css's first `:root`,
  which `hud-brand-tokens` slices as the frame's datum. It enters the three existing ratchets at
  zero the hour it is written (`type-material-tokens` tier tokens, `theme-css-sweep`,
  `phone-viewport-units`).

### 2. The frame recipe — `components/lattice/lattice.css`, `.lat-frame`

One chamfered housing, ADR-148's factoring generalised and ADR-089's ring: host `position:
relative; border: 0; background: var(--lat-frame-ground); clip-path: var(--lat-cut)`; `::before`
the two-contour evenodd ring with both outlines CLOSED (ADR-148 U2), inner leg
`var(--lat-ch) − var(--lat-ch-leg)`. Every knob an attribute so a still is traceable:
`data-cut="tr-bl | tr | bl | none"` — **the house default is the TR + BL pair** (owner,
2026-10-06; ADR-065's housing diagonal), `tr` for an oriented or connected set, and **no
`tl-br`** (the console's diagonal, an owner override ADR-089 retired); `data-ch="plate | seed |
card | plate-fluid | chrome"`; `data-line="seam | lip | lip-lit | rule"`; `data-ground="plate |
thin | none"`; `data-overflow="visible"` for a box with something hanging outside it (ring at
`inset: −1px`, ground on `::after`; a host clip would cut it off — ADR-148's chevrons). Parts:
`__head` (PT Mono chrome over a hairline; `data-head="wash"` adds the gold wash that stops at the
cut, as `.arc-plate__head`), `__body`, `__foot` (a status row over a rule). The polygon text is
`geometry.ts`'s, pinned. A clipped host is a containing block for `fixed`; no `contain: paint`.
Three server components (`Frame`, `Section`, `Grid`) emit the classes and the attributes and
paint nothing: the classes are the contract.

### 3. The section and its arrangements

`.lat-sec > .lat-band > (.lat-head | .lat-body | .lat-foot)` — the sheet's `.sh-sec` / `.sh-band`
/ `.sh-grid` / `.sh-head` structural rules, generalised: `data-band="band | instrument | bleed"`;
the seam as one hairline across the band between sections; `data-seat="flow | centre | datum"`
(content height; a 100svh centred beat; `align-content: start` + the head datum); `.lat-head`
the HEAD STRIP (an ordinal tab, a kicker, a title, a sub, one hairline under — Evangelion's
numbered module head, which `SheetHead` already draws); `.lat-foot` the status row (Cyberpunk's
terminus; nothing adopts it in session one). Six arrangements on `.lat-body[data-arrangement]`,
layout shapes only (content kinds stay in `lib/sheet/types.ts` and `lib/arcs/types.ts`):

| arrangement                   | grid                                | sheet kinds                    | arcs                               |
| ----------------------------- | ----------------------------------- | ------------------------------ | ---------------------------------- |
| `head-field`                  | the head over a twelve-column field | figure, prose, timeline, steps | flow, media, curve                 |
| `split` (`1-1`, `5-7`, `7-5`) | two text columns with `--lat-air`   | split                          | `.arc-head` (1-1 since ADR-148 U2) |
| `bay`                         | eight and four, the right stacked   | console                        | dossier, configuration             |
| `cells` (`2`, `3`, `4`)       | regions sharing edges, ruled        | cells                          | the plates grid                    |
| `instrument`                  | the instrument band, rails-tall     | monitor, log                   | prog                               |
| `ledger`                      | ruled rows                          | row, table                     | syllabus, repository               |

Vocabulary: LANGUAGE.md reserves **Module** (Pocock). The lattice says _section_, _head strip_,
_rung_, _seam_ (the grid's; distinct from the Pocock Seam), _cell_, _arrangement_.

### 4. The lab, the gates, the jury

- **`/test/lattice`**, a new route inside the REAL HUD frame (rungs resolve only against the real
  rail; the interface-kit shell's skeleton), with its own registry (`lib/lattice/directions.json`,
  letters-only ids, `LA` the control, the first value of every knob production), its own stamp
  (`.lat-read[data-stamp]` carrying identity and `ticks === 13 && rail !== 0`, values only the
  page can produce), five boards (`grid`, `frames`, `sections`, `page`, `type`), a `?grid=1`
  overlay drawn FROM the tokens (a token that drifts from the live tick shows as a doubled line),
  real copy from one shared record (never lorem — the jury's Content is unscorable on it), the
  site footer on the page board (ADR-127), and `window.__lattice.measure()` as ONE measurement the
  lab prints and the capture asserts on.
- **Three homes for the mechanical gates.** `scripts/capture-lattice.mjs` (headed Playwright, the
  real HUD; only the control can fail): rung and column mirrors within 1.5px / 1px, every edge on
  a rung or a column, chamfer sizes on the ladder, corners hit-tested from BOTH ends, the ring
  ink-measured, the line ledger (one hue, three alphas, gold structure = 0 with the lip declared),
  no text overlap, usability (hit boxes ≥ 44px, a visible focus ring, 4.5:1 composited), the
  carried gates (type ≥ 8.5px, two families, zero radius, no page errors). `mechanical.mjs` gains
  `spacing`, `typeLadder`, `chamfer` and a `--ready` stamp wait. `tests/lib/lattice-ratchet.test.ts`
  pins four counts per production sheet (polygons, off-scale spacing, literal font sizes,
  off-ladder breakpoints) at today's numbers, slack ≤ 10, only down.
- **The Awwwards jury**, `scripts/design-eval/awwwards.mjs`, rubric `eval/awwwards.md` read at
  runtime: Design 40 · Usability 30 · Creativity 20 · Content 10, each 1–10; the negative pole is
  the committed control still at the candidate's own viewport and theme, the positive register
  the turnstone ship's first-screen strips (**register strips only** — owner, 2026-10-06; no
  third-party stills in a public repo); `claude-opus-5-5` with structured output and high
  effort (no `temperature` on it — determinism is three runs and the median, design-praxis's
  majority rule), `claude-fable-5-1` on `--model` for a stricter read; the weighted total
  computed, never asked; **usability capped at 6.0 by the cell's measured report** (a hit box
  under 44px, an overlap, a contrast miss, no focus ring), which is what makes "≥ 7.5" not
  self-reported; the threshold per CELL with 1280×720 dark binding; **self-tested both ways**
  before a round is logged (the control must fail, the register strip must pass). Advisory,
  never CI. The round (`scripts/lattice-round.mjs`): ratchet → capture → print the binding
  still's path and pause → score → the holding-back line → edit. A wave is one CSS state.

### 5. The first adopter, and the lever

**The sheet (ADR-114).** Its guards are measurements, not PNGs; it already has the comparison
lever the house allows (`lib/sheet/directions.json` → `data-sh-*` → `?k=` → a turnstone lane);
it is token-only and pinned at zero; it is DOM-only; and it is the owner's named complaint. Not
the workshop arc (ADR-148 U2 landed the same morning and is under his read; `arcs.css` redeclares
`--arc-plate-ch` eleven times), not the proof stack (the most-ruled object on the site, inside
First Load), not lab-only (he rules on live pages).

- **Phase 2** aliases `--sh-datum / seam / rule / lip`, `--sh-card-ch(-in)`, `--sh-sec-pad` and
  the band's margin to `--lat-*`, CSS only, byte-identical — proven by `lattice-parity` (zero
  pixels, baselines at the pre-alias commit) and `lattice-alias-readout` (computed px before and
  after). ⚠ No `var(--lat-x, <old>)` fallbacks: a masking fallback is the ADR-085 U2 alias trap.
  The seven `--sh-*` type clamps stay — the ladder does not reproduce them, and moving them is a
  visible change.
- **Phase 3** is the knob: `lattice: ["sheet", "lattice"]` (the first value the house), direction
  `SM` on the document pages, a `.sh-root[data-sh-lattice="lattice"]` scope that puts the type
  clamps on the ladder, the head on the head strip (the `ordinal` knob inert under it; one of the
  two retires at the ruling), the consoles on `.lat-frame`, and the split / cells / console /
  timeline recut as arrangements. Read on `/home-sessions?k=SM` and the kit first, `/musings` last
  (ADR-129's pinned head is the most-ruled part). ADR-070 U35 applied: at the ruling the loser's
  scope, direction, lane and the parity spec go in one commit, and U1 records his words.
- **Phase 4** (later sessions, each an ADR line, each under the ratchet): the nine width caps →
  tokens; the 23 `--hud-content-inset` fallbacks; the re-derived insets; the console's TL+BR
  (his call); the arcs' copied `1fr 1fr` head → the split arrangement; the workshop frame's
  `--arc-frame-*` → `--lat-*`; `--fl-t6/t11` → the rungs and `--fl-t0` → `--fl-type-0` with every
  consumer; the Figma pass on `UI Exploration` (a `Lattice/Grid` layout style, `Frame/Housing`
  variants, `Section/*`, `grid/* space/* bp/*` variables in `Thoughtform/HUD`; Brand System page
  only; the Brandworld file `8eUA625Yelrk6KwVTTRD0x` node `52:2` — his declinations board, A1–A4
  heroes, B1–B5 card archetypes, C1–C3 graphic realism — is read-only prior art); the polygon
  count down sheet by sheet.

### 6. What it supersedes in the skill

`references/spatial-system.md`'s 12-column grid becomes real and its `--tf-rhythm-*` /
`--layout-content-*` tokens, which nothing in the repo ever read, are deleted in favour of
`--lat-*` over `--space-*`; `tokens.md`'s four-corner `cutCorners` presets and `components.md`
§14's four-corner `ChamferedPanel` are corrected to ADR-065 and the `.lat-frame` recipe;
`SKILL.md` §Layout grid says 9×17 for fixed canvases and the lattice for scroll documents.
`app/styles/grid.css` (no consumer) and the `--corner-preset-*` tokens (no consumer; the
`--corner-arm-*` and `-thickness-*` ones ARE read by components.css and stay) are left for a
later sweep.

## The first rounds (2026-10-06)

The capture ran on the control (`LA`, 1280×720, both themes) and failed its own page on
six real findings before anything was scored — which is the system working: the split
arrangement's air was a column GAP and put a frame 14px off its column (the air is padding
on the text now, never a gap); `--lat-col` and the measurement were `100vw`-based and the
last column landed a scrollbar's width past the band (the overlay and `measure.ts` use the
band's own box; the token stays with the trap named); dim text at .52 measured 3.61:1 on
parchment at 10px (three ink rungs on `:root`, .58 for dim text, lifted in light); a
control's outline was counted as gold structure (controls are marks, skipped); the site
footer's mail link was counted against the lab's hit boxes (the close is production chrome
with its own smoke); and the frames board scrolled inside a stage the corner and ring gates
could not reach (it flows).

⚠ **THE JURY COULD NOT RUN.** `awwwards.mjs --self-test` hit "credit balance is too low" on
the `ANTHROPIC_API_KEY` in `.env.local` and, as designed, logged nothing. Until the owner
tops up or swaps the key the rounds are MANUAL — a human's read of the still, scored on the
same sheet and marked so in `eval/subpages/evals/waves/lattice-01-rounds.md`, never written
to `EVAL_LOG.md` as a jury row. Round 1 read D 6.5 · U 7.5 · C 6.5 · K 7.0: the instrument
was an empty ruled field and the masthead was seated as a viewport frame on a flowing
document. Round 2 seats the masthead as flow and plots the four mornings on the field (D 7.5
· U 7.5 · C 7.0 · K 7.5). Round 3 ends every section on its terminus row and is the first
CLEAN CONTROL — every gate on all eight stills in both themes — and reads 7.5 in every
category on the manual sheet. ⚠ That is a read, not a verdict: the jury re-scores wave
`lattice-01-r03` the hour the key has credit, and the bar is cleared only by its medians.
The record is `eval/subpages/evals/waves/lattice-01-rounds.md`.

The guard matrix on a warm server: every lattice and sheet unit guard green (654 tests);
`lattice-parity` at zero pixels on the five public routes (the kit's four cells re-recorded
once for its own knob console, the diff read first); `lattice-alias-readout` 16/16; the two
HUD snapshots and the two arc-terminal motion cases green; `subpages-smoke` 25/26 with the
one case the sheet rule already records as red; `arcs-instrument-smoke` 24/26, the two
failures naming `thoughtform-armada` and the Suri configuration page, which are ADR-146 /
ADR-148's uncommitted work in the same tree, not the lattice's. `npm run verify` green but
for the two suites that read sibling repositories absent from this machine.

## Alternatives rejected

- **A view of `/test/interface-kit`.** Its stamp and registry know two knobs; the armada mirror
  exits on a type its rubric does not grade; the owner reads that lab as "the panel against the
  frame". A lab is one question.
- **Making the casefile read the rungs.** The rail-mirror smoke reads `--fl-t6` / `--fl-t11` to
  1.5px; the lattice COPIES the formula and the casefile aliases in Phase 4 with its consumers.
- **A `@property`-registered ladder** so JS could read px. Open: `services.css:565` records a
  per-node cost on a 350-node stage; the probe-element read is enough for now.
- **Deleting the `--corner-*` tokens.** The survey said zero uses; the grep said
  `components.css` reads five of them. Left alone.
- **The workshop arc or the proof stack first.** Above.
- **Evangelion / Brasshands stills as the jury's positive pole.** A film frame is a category
  mismatch for a web jury and the repository is public; the register strips are the pole.

## Consequences

- Every production sheet carries four numbers that can only fall. A housing migrated to
  `.lat-frame` takes its polygon with it; a width cap tokenised takes its literal.
- A new surface seats on the band and the rungs without re-deriving the rail (`--mu-tele-reach`
  rebuilt the rail from literals; nothing needs to again).
- The phone rungs are spacing values — a pinned stage on a phone does not seat on a ladder it
  does not have.
- The jury is advisory, costs a model call per cell per run, and is only as honest as its
  anchors; the self-test is the guard against a broken jury passing the page.

## Left open (the owner)

Two plate rungs (26 flat beside the card clamp) or one; the head strip superseding the
`ordinal` knob; the type clamps moving onto the ladder (under the knob, read side by side); the
phone column count (4); the breakpoint set (as listed; 901 / 980 / 1101 / 759 counted as drift);
a third ship against turnstone's `[types.LT]` (turnstone); the name ("lattice" until he names
it).
