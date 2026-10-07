# Thoughtform Spatial System

Grid, rhythm, negative space and structural dividers. All spacing is on the 8px base unit;
on a scroll document the grid is THE LATTICE (ADR-149); on a fixed canvas it is the 9×17
content grid. Every value below is read off `app/styles/lattice.css`,
`app/styles/variables.css` and `components/landing/v7/landing.css`; if a value here
disagrees with one of those files, the file is right.

---

## Base Unit & Grid

- **Base unit:** 8px (`--lat-u`). All spacing and key dimensions are multiples of 8
  (exception: 4px for `--space-xs` in tight UI).
- **Scroll documents (the site, the sheets, the arcs) take THE LATTICE.** Twelve columns
  inside the editorial band (`--lat-cols: 12`), gutter ZERO (`--lat-gutter: 0px`: cells
  share edges and divide themselves with seams), `--lat-air` (`clamp(20px, 2.4vw, 40px)`)
  as the air between two TEXT columns only, never a gutter between objects. The band is
  the ADR-048 tier by reference: `--lat-margin: var(--band-margin)`,
  `--lat-max: var(--band-max)`, `--lat-wide-margin: var(--instrument-margin)`,
  `--lat-wide-max: var(--instrument-max)`. `--lat-col` is one column's width inside the
  text band, for a rule that must land on a column edge in a box that is not a grid.
  Vertically, thirteen rungs read off the HUD rail's own tick ladder (§The rungs).
  Rule: `.claude/rules/lattice.md`. Tokens: `app/styles/lattice.css`, `:root` only.
- **Fixed canvases (slides, A4, 1:1) keep the 9×17 content grid**: margin 5 % of the
  shortest edge, the margin-inset rectangle divided 9 rows × 17 columns, gap 0, scale
  factor `min(w, h) / 1080`. Rows mean something on a canvas; they do not on a document
  that scrolls. Formulas: [cross-format-shell.md](cross-format-shell.md).
- ⚠ `app/styles/grid.css` (an 8-column with no consumer) and `--grid-gap` (24px, declared
  in variables.css) are legacy and are not the lattice. Do not seat new work on either.

---

## Spacing Scale

`variables.css`'s `--space-*` is the MAGNITUDE ladder. Keep it; 29 consumers read it.

| Token | Value | CSS Variable  | Usage                        |
| ----- | ----- | ------------- | ---------------------------- |
| xs    | 4px   | `--space-xs`  | Tight inline spacing         |
| sm    | 8px   | `--space-sm`  | Inline gaps, icon-text       |
| md    | 16px  | `--space-md`  | Component padding, list gaps |
| lg    | 24px  | `--space-lg`  | Section spacing              |
| xl    | 32px  | `--space-xl`  | Block spacing                |
| 2xl   | 48px  | `--space-2xl` | Major sections               |
| 3xl   | 64px  | `--space-3xl` | Hero / viewport margins      |
| 4xl   | 96px  | `--space-4xl` | Full-bleed section breaks    |

The lattice names ROLES on that ladder (ADR-149 §1; the move ADR-092 made for type, one
level over). A clamp's endpoints sit on the scale.

| Role            | Value                       | CSS Variable       | Use                                         |
| --------------- | --------------------------- | ------------------ | ------------------------------------------- |
| unit            | 8px                         | `--lat-u`          | The base unit, named                        |
| chrome padding  | `var(--space-sm)` (8px)     | `--lat-pad-chrome` | Inside a head strip, a status row, a tab    |
| cell padding    | `clamp(16px, 2vw, 32px)`    | `--lat-pad-cell`   | Inside a cell or a frame body               |
| stack gap       | `var(--space-md)` (16px)    | `--lat-gap-stack`  | Between items in one stack                  |
| block gap       | `var(--space-xl)` (32px)    | `--lat-gap-block`  | Between blocks; the head strip's column gap |
| section padding | `clamp(56px, 8svh, 120px)`  | `--lat-sec-pad`    | A section's block padding                   |
| head gap        | `clamp(24px, 2.4svh, 40px)` | `--lat-head-gap`   | Under a head strip, before its body         |

⚠ Pick a role, never a magnitude: `--lat-pad-cell`, not `--space-md`, inside a cell. The
magnitude is what the role resolves to today; the role is what survives a retune.

⚠ On the phone (≤960) `--lat-sec-pad` is `clamp(40px, 6svh, 64px)` and `--lat-head-gap`
is `var(--space-lg)`. `svh` only, never `dvh` (`phone-viewport-units` pins it).

---

## Frame vs Content Token Boundary

Two token families with different scaling rules:

- **Frame tokens** (`--hud-*`): viewport-aware `clamp()` on `vw` / `vmin`. They define the
  instrument shell (margins, rails, corners). They grow with the viewport until they hit
  their bounds. ⚠ The frame is the DATUM and is never swept (ADR-092).
- **Lattice tokens** (`--lat-*`): the floor under the content. Columns, rungs, spacing
  roles, the chamfer ladder, the line law, the type ladder. Declared once on `:root` in
  `app/styles/lattice.css`, loaded from `app/globals.css` after `variables.css`.

**Rule:** ultra-wide screens expand the shell and the band, not the interior gap. The band
pins at `--band-max` (1200px) and the instrument band at `--instrument-max` (1440px), both
centred, so past their crossovers the surplus goes to `--lat-margin` /
`--lat-wide-margin` and the column widths stop growing. Never derive an interior gap from
`vw` or container width; `--lat-air` is the one fluid gap and it is capped at 40px.

---

## Layout Tokens

The frame's tokens, read off `components/landing/v7/landing.css`.

| Token             | Value                                                                                                                   | CSS Variable             | Usage                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| hudMargin         | `clamp(16px, min(2.8125vw, 5vmin), 54px)`                                                                               | `--hud-margin`           | Outer inset (Figma `120:968` ref, Sigil-aligned); aliases `--hud-padding`  |
| hudRailWidth      | `clamp(48px, 4.27vw, 82px)`                                                                                             | `--hud-rail-width`       | Telemetry rail aside (contains guide + outward ticks)                      |
| hudRailGuideInset | `0px`                                                                                                                   | `--hud-rail-guide-inset` | Guide hairline offset from the rail aside's edge. ⚠ 0, not the Figma 5–9px |
| hudCornerZone     | `clamp(28px, 4.17vmin, 45px)`                                                                                           | `--hud-corner-zone`      | Vertical skip at rail ends (below corner stubs)                            |
| hudCornerFoot     | `calc(var(--hud-margin) + var(--hud-corner-zone))`                                                                      | `--hud-corner-foot`      | The TL bracket's foot, a drawn line                                        |
| hudRailYClear     | `clamp(16px, 1.8vw, 32px)`                                                                                              | `--hud-rail-y-clear`     | The air the track keeps off the corner chrome                              |
| hudRailYStart     | `calc(var(--hud-corner-foot) + var(--hud-rail-y-clear))`                                                                | `--hud-rail-y-start`     | The rail's top; rung 0                                                     |
| hudRailYEnd       | `max(calc(var(--hud-corner-foot) + var(--hud-rail-y-clear)), calc(var(--hud-margin) + clamp(44px, 3.6vw, 63px) + 8px))` | `--hud-rail-y-end`       | The rail's bottom clearance; rung 12 is `100svh` minus this                |
| hudContentInset   | `calc(var(--hud-margin) + var(--hud-rail-width) + clamp(24px, 3vw, 56px))`                                              | `--hud-content-inset`    | The station content box's inset from the viewport edge                     |
| bandMax           | `1200px`                                                                                                                | `--band-max`             | The editorial band's cap (ADR-048)                                         |
| bandMargin        | `max(var(--hud-content-inset), calc(var(--hud-content-inset) + var(--band-pull)), calc((100vw - var(--band-max)) / 2))` | `--band-margin`          | The band's inset; `--lat-margin` reads it                                  |
| railInset         | `calc(var(--band-margin) - var(--hud-content-inset))`                                                                   | `--rail-inset`           | How far the band sits inboard of the station content box                   |
| instrumentMax     | `1440px`                                                                                                                | `--instrument-max`       | The instrument band's cap (ADR-048 addendum)                               |
| instrumentMargin  | `max(var(--hud-content-inset), calc((100vw - var(--instrument-max)) / 2))`                                              | `--instrument-margin`    | The instrument band's inset; `--lat-wide-margin` reads it                  |
| instrumentInset   | `calc(var(--instrument-margin) - var(--hud-content-inset))`                                                             | `--instrument-inset`     | How far the instrument band sits inboard of the content box                |
| contentMaxWidth   | 1200px                                                                                                                  | `--content-max-width`    | Legacy cap in variables.css; equals `--band-max`                           |
| cornerArm         | 24px at ref                                                                                                             | `--corner-arm-*`         | Horizontal leg from the guide; stub 23px (Figma `120:415`)                 |

⚠ `--hud-rail-top` is declared nowhere; the live tokens are `--hud-rail-y-start` /
`--hud-rail-y-end`. ⚠ `--hud-content-inset` has been written with four different fallbacks
(22 / 48 / 64 / 161); write `var(--hud-content-inset)` with none.

### HUD Frame Anatomy (Figma TF + Sigil implementation)

**Figma:** `120:968` (shell ref), `120:415` (straight corners), `120:1191–1209` / `120:1201` / `120:1196` (tick geometry).

- **Corners:** **Straight L**: arm 24px, stub 23px (ref), anchored from the guide inset (not the viewport corner). Strokes must **not overlap at the vertex**: offset the vertical leg by the stroke thickness (`top`/`bottom: 1px` for 1px CSS; `2px` for 2px slide brackets) and shorten the leg by the same amount so the joint reads as one clean 90°, not a **+**. Full rule + porting checklist: [hud-frame-implementation.md](hud-frame-implementation.md).
- **Rails:** Fixed asides; the **guide** is a vertical 1px hairline; **ticks** extend **outward** from the guide (left rail → left, right rail → right).
- **Tick rhythm:** Canonical list `HUD_TICK_MARKS` (percent of guide-zone height) in `lib/navigation/rail-contract.ts`; matches Sigil `grid-constants.ts`. Left-rail labels **2**, **5**, **7** map to majors + a low bearing (see `leftRailTickLabel()`).
- **Viewport shell (e.g. Astrolabe `/arcs`, `/canon`):** Straight corners + rails only (no bottom-left compass anchor); **no** top-right chapter / bottom-right pagination on the app chrome.
- **Arc / deck slides:** Same rail geometry; **optional** top-right **section** line + bottom-right **pagination** via overlay `frameLabels` (from footer text elements or presenter synthesis). Bottom band remains editable slide text (chapter / client / active / pagination).

**Legacy:** Equal 25-tick spacing (`SIGIL_TICK_COUNT = 24`, majors 6/12/18): retain for older references; new HUD work uses `HUD_TICK_MARKS`.

---

## The rungs

The vertical grid is the HUD rail's own 13-tick ladder, as tokens (ADR-149 §1;
casefile.css's `--fl-tN` formula COPIED, pinned to `lib/v7-parse/hudTicks.ts`).

- `--lat-rail-top: var(--hud-rail-y-start)` · `--lat-rail-bot: var(--hud-rail-y-end)` ·
  `--lat-rail-h: calc(100svh - var(--lat-rail-top) - var(--lat-rail-bot))`.
- `--lat-rung-0 … --lat-rung-12`: `--lat-rail-top + --lat-rail-h × N / 12`. Rung 0 is the
  rail's top, rung 12 its bottom.
- Majors at 4 and 8, the bearings lettered "2" and "5": `--lat-major-a` = rung 4,
  `--lat-major-b` = rung 8.
- `--lat-pitch: calc(var(--lat-rail-h) / 12)`: the flowing-section unit. The rungs are
  viewport-absolute heights for a pinned stage or an instrument; a flowing section takes
  the pitch.
- `--lat-head-datum: clamp(48px, calc((100svh - var(--lat-composition)) / 2), 360px)`
  over `--lat-composition: 600px`: where a section's head sits when the section is a frame,
  solved from the frame's centre (ADR-099 U2). A format overrides `--lat-composition`.

⚠ **A rung is a HEIGHT on the ladder, never a type size.** casefile.css's `--fl-t0` is a
type size and `--fl-t6` a tick height under one prefix; that collision is why the lattice's
type rungs carry role names (`--lat-copy`, `--lat-h2`) and the ladder's rungs carry the
ladder's index.

⚠ **The rungs resolve only against the real rail.** `--hud-rail-y-start` / `-end` are
declared in landing.css; on a route without it every rung is invalid at computed-value
time and `top: var(--lat-rung-6)` falls to `initial`. The admin tools have no rail.

⚠ **On the phone (≤960) the rungs are spacing values.** The rail stands down, so
`--lat-rail-top` / `-bot` are `0px`, `--lat-rail-h` is `100svh`, `--lat-pitch` is
`var(--space-2xl)` and `--lat-cols` is 4. Never left unset: an unset custom property
invalidates every `calc()` that reads it, silently.

⚠ The casefile keeps its own `--fl-t6` / `--fl-t11` until Phase 4 (the rail-mirror smoke
reads them). Do not alias them yet.

---

## The chamfer ladder

ADR-065's depth ladder as tokens, with the two LIVE responsive rungs named rather than
re-solved. `lib/lattice/geometry.ts` is the source; `lattice-tokens` pins the CSS to it.

| Rung        | Value                      | CSS Variable           | Object                                                                               |
| ----------- | -------------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| chrome      | `0px`                      | `--lat-ch-chrome`      | A chrome-rung object is SQUARE (the children of a chamfered box are square, rule 4)  |
| seed        | `16px`                     | `--lat-ch-seed`        | A card at rest (the services plate, the dock)                                        |
| card        | `clamp(14px, 1.3vw, 22px)` | `--lat-ch-card`        | The sheet consoles and the proof card; byte-equal to `--sh-card-ch` / `--pf-card-ch` |
| plate       | `26px`                     | `--lat-ch-plate`       | A housing (the casefile slab, the open services plate)                               |
| plate-fluid | `clamp(16px, 1.8vw, 26px)` | `--lat-ch-plate-fluid` | The arcs' plates; the frame recipe's default                                         |
| leg         | `0.586px`                  | `--lat-ch-leg`         | The inner ring's leg correction                                                      |

- ⚠ **A clip CUTS a border and never strokes one** (ADR-089). A chamfered box with
  `border: 1px` has no line on either diagonal. The edge is a two-contour `evenodd` RING on
  `::before`: the outer outline, then the same outline 1px inside, the middle a hole.
- ⚠ **Both contours CLOSE** back on their first point (ADR-148 U2). An open ring's
  connecting edges cross along the left side and fade the 1px edge toward mid-height.
- ⚠ **One inner-leg constant.** Insetting a 45° cut by d moves its diagonal by d·√2 along
  each axis, so the inner leg is `ch − d(2 − √2)`: at d = 1px, `ch − 0.586px`, never
  `ch − 1px`. The site spelled this three ways (0.6 / 0.586 / 0.414); it is written once.
- **The house default is the TR + BL pair** (owner, 2026-10-06; ADR-065's housing
  diagonal). `tr` alone only for an oriented or connected set (a single notch MEANS
  oriented). `bl` alone is the mirrored back of a flipped object. **Never TL + BR**: the
  console's diagonal was an owner override ADR-089 retired.
- The recipe is `.lat-frame` in `components/lattice/lattice.css` (§Frame Sizing below and
  components.md §14). The polygon text is `geometry.ts`'s; a polygon hand-written in CSS
  fails `lattice-tokens` the hour it is written.

---

## Breakpoints

There is no `@custom-media` in this toolchain, so the ladder is code:
`lib/lattice/breakpoints.ts`, repeated as a comment table in `lattice.css`, enforced by
`lattice-ratchet` (every `@media` width or height outside the set counts as drift).

| Rung    | max    | min (max + 1) | What crosses it                                                     |
| ------- | ------ | ------------- | ------------------------------------------------------------------- |
| narrow  | 1100 w | 1101          | The rail labels hide                                                |
| phone   | 960 w  | 961           | The rails and the brandmark stand down; `--hud-content-inset` flips |
| stack   | 900 w  | 901           | The arcs' heads stack                                               |
| tight   | 700 w  | 701           | Connector and mobile overrides                                      |
| mini    | 640 w  | 641           | The title scale steps down                                          |
| short   | 680 h  | 681           | The frame's motion stops                                            |
| compact | 760 h  | 761           | The casefile compacts                                               |

⚠ **LAW: the max side is the even number, the min side is max + 1.** 960 / 980, 1100 /
1101 / 1099 and 759 / 759.98 / 760 are one rung declared three ways, and that is how two
surfaces split one pixel apart. ⚠ The old "`@media (max-width: 1280px)` tightens clamps"
note is not on the ladder; do not add a threshold to it without an ADR line.

---

## Density Modes

Density is a choice of ROLE tokens per surface, never a second scale.

**Telemetry / HUD (dense):** rails, readouts, several data layers. `--lat-pad-chrome` and
`--lat-gap-stack`. Atlas, dashboards, research-station UIs.

**Editorial (sparse):** marketing, landing, long-form. `--lat-pad-cell`,
`--lat-gap-block`, `--lat-sec-pad`. One idea per block. thoughtform.co, the sheets.

**Presentation (relaxed):** keynotes, hero slides, branded decks on a FIXED canvas. The
28 / 36 / 45 rhythm and the 53px panel inset live in
[presentation-patterns.md](presentation-patterns.md) and apply to fixed canvases only;
they are not CSS tokens in this repo.

**Product (restrained):** tools like Synod. `--lat-pad-cell` for lists and panels, no
rails, clear hierarchy without clutter.

**Rule:** never mix dense and sparse in one view without a structural break (a seam, or a
new section).

---

## Depth Layers (Surfaces)

Progression from void to surface-2 = proximity to the reader. See [color-system.md](color-system.md) for values.

- **void**: page / chrome background
- **surface-0**: sidebars, primary panels
- **surface-1**: dropdowns, popovers
- **surface-2**: modals, tooltips

On the lattice a ground is one of three: `--lat-plate` (`rgba(void-deep, .62)`, the
sheet's and the proof card's), `--lat-plate-thin` (`.42`, a housing over a live WebGL bed)
and `--lat-recess` (`rgba(dawn, .035)`, a cut face). Light re-derives them (plate opaque,
thin `.72`, recess `.05`), never inherits (ADR-058).

**Rule:** never skip layers. A modal on void sits on surface-1 or surface-2, not surface-0.

---

## Structural Dividers

The line law (ADR-091, promoted by ADR-149 §1): ONE weight (1px), ONE hue (dawn), three
alphas by ROLE.

| Role  | Dark  | Light | CSS Variable  | Draws                                                    |
| ----- | ----- | ----- | ------------- | -------------------------------------------------------- |
| datum | `.55` | `.55` | `--lat-datum` | The rail's own track (`--hud-rail-line`)                 |
| seam  | `.28` | `.42` | `--lat-seam`  | A divider between REGIONS; the hairline between sections |
| rule  | `.12` | `.22` | `--lat-rule`  | A rule WITHIN a region: rows, cells, a head strip's base |

- **Gold draws no structure.** The one sanctioned gold line is a housing's LIP, flat:
  `--lat-lip` (`color-mix(in srgb, var(--gold-line) 30%, transparent)`) and `--lat-lip-lit`
  (`70%`), through `--gold-line` so light re-derives it. Eight gold structure lines at
  .12–.24 against a frame running 2px of dawn at .55 was the measured defect (ADR-091).
- **Active / selected** is a mark (a diamond, a filled box among outlines), never a gold
  rule under a row.
- **Rule:** no box shadows for depth; border + surface only. A seam between two cells is
  the cells' shared edge, drawn once.

---

## Ultra-Wide Content Cap

On wide and ultra-wide screens the shell keeps growing until its clamps' maxima, and the
two bands pin: the text band at `--band-max` (1200px), the instrument band at
`--instrument-max` (1440px), both centred, so the margins grow symmetrically.

**Rule:** extra viewport width lives in the shell (between the HUD rails and the band's
edge), not inside the text stack. A content region sits on `.lat-band` (text band) or
`.lat-band[data-band="instrument"]`; it does not declare its own `max-width`. ⚠ The nine
hard-coded caps still on the site (1180, 1120, 1100, 920, 880, 720, 560 …) are Phase 4's
to tokenise; do not add a tenth.

---

## Safe Zones & Negative Space

- **Minimum hit target:** 44px (the jury caps usability at 6.0 under it).
- **Text blocks:** ~65–75 characters for body; the head strip's sub is `max-width: 56ch`.
- **Viewport edges:** content sits on the band (`--lat-margin`) or the instrument band
  (`--lat-wide-margin`); only a `data-band="bleed"` section reaches the viewport edge.

---

## Frame Sizing (Cards, Modals, Panels)

A new frame is `.lat-frame` (components.md §14; `components/lattice/lattice.css`): host
`position: relative; border: 0; background: var(--lat-frame-ground); clip-path:
var(--lat-cut)`, the ring on `::before`, parts `__head` / `__body` / `__foot`, every knob a
`data-*` attribute. Padding inside it is `--lat-pad-cell`; its chrome rows take
`--lat-pad-chrome`.

The `--frame-*` tokens below are the v5 set, still declared in `variables.css` and read by
`app/styles/components.css` and `app/styles/navigation.css` only. Do not seat new work on
them.

| Token    | Value                    | CSS Variable     |
| -------- | ------------------------ | ---------------- |
| maxWidth | `min(90vw, 560px)`       | `--frame-max-w`  |
| paddingX | `clamp(16px, 4vw, 32px)` | `--frame-pad-x`  |
| paddingY | `clamp(16px, 3vw, 24px)` | `--frame-pad-y`  |
| corner   | 16px                     | `--frame-corner` |

---

## Figma Auto-Layout Authoring Rules

When building or maintaining content patterns in Figma, use auto-layout principles instead of manual nudging:

1. **Use vertical/horizontal auto-layout** for content stacks. Set `direction`, `spacing`, and `padding` instead of positioning children by coordinates.
2. **Use hug-contents** as the default sizing model for both width and height.
3. **Use fill-parent** when a child should stretch to its container width (e.g. a text block inside a content panel).
4. **Use min/max widths** to preserve reading rhythm. Content frames should have a `maxWidth` so they do not expand indefinitely on wide screens.
5. **Reserve absolute positioning** only for HUD chrome (rails, corners, chapter/pagination overlays) and decorative elements that must break the content flow.
6. **Use the spacing roles** (`--lat-gap-stack`, `--lat-gap-block`) as the `spacing` value in auto-layout frames, not arbitrary pixel gaps.
7. **Use the cell padding role** (`--lat-pad-cell`) for content panel insets on web; the 53px presentation inset is a fixed-canvas value (presentation-patterns.md).

### Principles extracted from Heimdall auto-layout patterns

The following structural principles are adapted from the Heimdall Figma plugin's `createAutoLayoutTemplate()` and 6-phase `normalizeLayout()` flow. They are applied as manual authoring discipline, not as plugin automation.

1. **Column / row nesting:** Build page-level structures as horizontal auto-layout rows containing vertical auto-layout columns. This is the same pattern Heimdall uses for its briefing board: a horizontal `Columns` row wrapping vertical `Briefing`, `Copy`, and `Design` columns.
2. **Semantic spacing via `itemSpacing`:** Set `itemSpacing` on the auto-layout frame to a spacing role's value (16px for a stack, 32px for blocks). Do not manually position children with `y` offsets.
3. **Padding as panel inset:** Set `padding` on content containers rather than adding invisible spacer frames. Use the cell padding role on web and the 53px inset on presentation panels.
4. **Hug-then-stretch:** Start with hug-contents sizing, then switch children to fill-parent only when they need to span the container (e.g. a text block that should fill the content column width).
5. **Min/max width preservation:** Use `minWidth` and `maxWidth` on content frames to keep reading rhythm bounded. This prevents text blocks from collapsing to zero or expanding to full-bleed on wide containers.
6. **Skip auto-layout for HUD chrome:** HUD rails, corners, chapter/pagination overlays, and decorative elements should stay outside the auto-layout flow (absolute positioning or separate overlay frames). Only interior content stacks should be auto-layout-driven.

**Reference:** [Figma AutoLayout API](https://developers.figma.com/docs/widgets/api/component-AutoLayout/) | Heimdall's `packages/figma-plugin/src/commands/syncBriefings.ts`: read-only, and in a SEPARATE repo (`Manifold Delta/Artifacts/11_Heimdall`), so it is named rather than linked: a relative path out of this one resolves against whatever checkout happens to be alongside it.

---

## What Never Appears

- Spacing that is not on the 8px scale (except 4px xs, and the clamps whose endpoints sit on it)
- Box shadows for structural depth
- Content flush to viewport without a defined inset
- Skipped depth layers (e.g. modal directly on void)
- Interior content gaps derived from `vw` or container width (`--lat-air` is the one fluid gap, capped)
- A gold line that is not a housing's lip
- A corner polygon written by hand outside `components/lattice/lattice.css`
- A `@media` threshold off the ladder
- A `--lat-*` token declared below `:root`
- A gutter between cells (cells share edges; the air between two text columns is `--lat-air`)
