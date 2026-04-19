# Thoughtform Spatial System

Grid, layout density, negative space, and structural dividers. All spacing uses the 8px base unit and layout tokens.

---

## Base Unit & Grid

- **Base unit:** 8px. All spacing and key dimensions are multiples of 8 (exception: 4px for xs when needed for tight UI).
- **Grid:** 12-column. Use for page and section layout; components may use flex with gap from the spacing scale.
- **Gap:** Prefer `--grid-gap` (24px) or `--space-*` tokens between sections.

---

## Spacing Scale

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

---

## Frame vs Content Token Boundary

The system splits into two token families with different scaling rules:

- **Frame tokens** (`--hud-*`): viewport-aware values using `clamp()` with `vw`/`vmin`. They define the instrument shell (margins, rails, corners, guide insets). They grow with the viewport until they hit min/max bounds.
- **Content rhythm tokens** (`--tf-rhythm-*`): fixed semantic values chosen per component or layout variant. They define how content breathes inside the frame. They do **not** scale with the viewport.

**Rule:** ultra-wide screens expand the shell and content container, not the interior gap. Never derive an interior content gap from `vw` or container width; pick a named content rhythm preset instead.

---

## Layout Tokens

| Token                       | Value                                     | CSS Variable                       | Usage                                                                      |
| --------------------------- | ----------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| hudMargin                   | `clamp(16px, min(2.8125vw, 5vmin), 54px)` | `--hud-margin`                     | Outer inset — Figma `120:968` ref (Sigil-aligned); aliases `--hud-padding` |
| hudRailWidth                | `clamp(48px, 4.27vw, 82px)`               | `--hud-rail-width`                 | Telemetry **rail aside** (contains guide + outward ticks)                  |
| hudRailGuideInset           | `clamp(5px, 0.47vw, 9px)`                 | `--hud-rail-guide-inset`           | Guide hairline offset from rail aside edge                                 |
| hudCornerZone               | `clamp(28px, 4.17vmin, 45px)`             | `--hud-corner-zone`                | Vertical skip at rail ends (below corner stubs)                            |
| hudRailTop                  | `clamp(32px, …, 50px)`                    | `--hud-rail-top`                   | Rail aside vertical offset from viewport top/bottom                        |
| astrolabeShellContentOffset | `railWidth + 8px gap`                     | `--astrolabe-shell-content-offset` | Content clears fixed rails on app shell pages                              |
| contentMaxWidth             | 1200px                                    | `--content-max-width`              | Max content width                                                          |
| cornerArm (L-bracket)       | 24px at ref                               | —                                  | Horizontal leg from guide; stub 23px (Figma `120:415`)                     |
| gridGap                     | 24px                                      | `--grid-gap`                       | Grid gap                                                                   |
| contentInset                | 40px                                      | `--content-inset`                  | Horizontal inset for content                                               |

### HUD Frame Anatomy (Figma TF + Sigil implementation)

**Figma:** `120:968` (shell ref), `120:415` (straight corners), `120:1191–1209` / `120:1201` / `120:1196` (tick geometry).

- **Corners:** **Straight L** — arm 24px, stub 23px (ref), anchored from **guide inset** (not viewport corner). Strokes must **not overlap at the vertex**: offset the vertical leg by the stroke thickness (`top`/`bottom: 1px` for 1px CSS; `2px` for 2px slide brackets) and shorten the leg by the same amount so the joint reads as one clean 90° — not a **+**. Full rule + porting checklist: [hud-frame-implementation.md](hud-frame-implementation.md).
- **Rails:** Fixed asides; **guide** is a vertical 1px hairline; **ticks** extend **outward** from the guide (left rail → left, right rail → right).
- **Tick rhythm:** Canonical list `HUD_TICK_MARKS` (percent of guide-zone height) in `lib/navigation/rail-contract.ts` — matches Sigil `grid-constants.ts`. Left-rail labels **2**, **5**, **7** map to majors + a low bearing (see `leftRailTickLabel()`).
- **Viewport shell (e.g. Astrolabe `/arcs`, `/canon`):** Straight corners + rails only (no bottom-left compass anchor); **no** top-right chapter / bottom-right pagination on the app chrome.
- **Arc / deck slides:** Same rail geometry; **optional** top-right **section** line + bottom-right **pagination** via overlay `frameLabels` (from footer text elements or presenter synthesis). Bottom band remains editable slide text (chapter / client / active / pagination).

**Breakpoints (viewport shell):** `@media (max-width: 1280px)` tightens clamps; `@media (max-width: 1100px)` hides rail asides (`.tf-hud-rail-tick`); `@media (max-width: 600px)` shortens corner arms.

**Legacy:** Equal 25-tick spacing (`SIGIL_TICK_COUNT = 24`, majors 6/12/18) — retain for older references; new HUD work uses `HUD_TICK_MARKS`.

---

## Content Rhythm Tokens (semantic density)

Interior content gaps use fixed semantic presets, not viewport-derived scaling. The shell scales fluidly; content rhythm stays optically calm.

| Token         | Value | CSS Variable          | Use case                                        |
| ------------- | ----- | --------------------- | ----------------------------------------------- |
| inline        | 15px  | `--tf-rhythm-inline`  | Eyebrow icon-to-text, inline element gaps       |
| compact       | 20px  | `--tf-rhythm-compact` | Dense telemetry UI, tight data blocks           |
| default       | 28px  | `--tf-rhythm-default` | Web/editorial content blocks, definition stacks |
| large         | 36px  | `--tf-rhythm-large`   | Spacious web layouts, larger viewports          |
| relaxed       | 45px  | `--tf-rhythm-relaxed` | Presentation/keynote layouts, hero sections     |
| panel-padding | 53px  | `--tf-panel-padding`  | Presentation content panel inset                |

**Origin:** `28px` is the base rhythm from Brand Codex definition block (`1:732`). `36px` is the 1.3x proportional scale. `45px` is the manually tuned "calm" presentation rhythm from the 2496x1404 deck (`1:177`).

**Rule:** Choose a density preset per component or layout variant, not per viewport width. Ultra-wide screens expand the shell and content container, not the interior gap.

---

## Density Modes

**Telemetry / HUD (dense):**

- Rails, readouts, multiple data layers. Use `--tf-rhythm-compact` (20px) or `--tf-rhythm-inline` (15px). Use in Atlas, dashboards, research-station UIs.

**Editorial (sparse):**

- Marketing, landing, long-form. Use `--tf-rhythm-default` (28px) to `--tf-rhythm-large` (36px). One idea per block. Use on thoughtform.co, pitch decks, key screens.

**Presentation (relaxed):**

- Keynotes, hero slides, branded decks. Use `--tf-rhythm-relaxed` (45px) with `--tf-panel-padding` (53px). Use for Thoughtform Presentations and Forge deck output.

**Product (restrained):**

- Tools like Synod. Balanced: `--tf-rhythm-default` (28px) for lists and panels, no rails, clear hierarchy without clutter.

**Rule:** Never mix dense and sparse in the same view without a clear structural break (e.g. a full-width divider or new section).

---

## Depth Layers (Surfaces)

Progression from void to surface-2 = proximity to user. See [color-system.md](color-system.md) for values.

- **void** — Page/chrome background
- **surface-0** — Sidebars, primary panels
- **surface-1** — Dropdowns, popovers
- **surface-2** — Modals, tooltips

**Rule:** Never skip layers. A modal on void should sit on surface-1 or surface-2, not surface-0.

---

## Structural Dividers

- **Default:** 1px solid `var(--dawn-08)` (course lines). Use for list rows, card separators, section boundaries.
- **Hover / stronger:** `var(--dawn-15)`.
- **Active / selected:** `var(--gold-15)` or gold border.
- **Rule:** Do not use box shadows for depth. Use border + surface color only.

---

## Ultra-Wide Content Cap

On wide and ultra-wide screens, the HUD shell keeps growing (until clamp maxima), but **content regions** use stepped `--layout-content-*` max-widths so interior rhythm stays calm.

| Viewport  | `--layout-content-sm` | `--layout-content-md` | `--layout-content-lg` |
| --------- | --------------------- | --------------------- | --------------------- |
| default   | 960px                 | 1200px                | 1400px                |
| >= 1536px | 1100px                | 1400px                | 1600px                |
| >= 1920px | 1280px                | 1600px                | 1800px                |
| >= 2560px | 1600px                | 1920px                | 2200px                |

**Rule:** Extra viewport width on ultra-wide screens should live in the shell (between HUD rails and content edge), not inside the text stack. Content containers should use `max-width: var(--layout-content-lg)` (or `-md` / `-sm` depending on layout) with `margin-inline: auto` so reading rhythm stays proportional without inflating gaps.

---

## Safe Zones & Negative Space

- **Minimum touch target:** 44px (or 40px where space is critical).
- **Text blocks:** Max line length ~65–75 characters for body; use contentMaxWidth or column constraints.
- **Viewport edges:** Respect contentInset or hudPadding so content does not touch viewport edges without intent (e.g. full-bleed hero).

---

## Frame Sizing (Cards, Modals, Panels)

| Token    | Value                    | CSS Variable                                     |
| -------- | ------------------------ | ------------------------------------------------ |
| maxWidth | `min(90vw, 560px)`       | `--frame-max-w`                                  |
| paddingX | `clamp(16px, 4vw, 32px)` | `--frame-pad-x`                                  |
| paddingY | `clamp(16px, 3vw, 24px)` | `--frame-pad-y`                                  |
| corner   | 16px                     | `--frame-corner` (for corner bracket arm length) |

---

## Figma Auto-Layout Authoring Rules

When building or maintaining content patterns in Figma, use auto-layout principles instead of manual nudging:

1. **Use vertical/horizontal auto-layout** for content stacks. Set `direction`, `spacing`, and `padding` instead of positioning children by coordinates.
2. **Use hug-contents** as the default sizing model for both width and height.
3. **Use fill-parent** when a child should stretch to its container width (e.g. a text block inside a content panel).
4. **Use min/max widths** to preserve reading rhythm. Content frames should have a `maxWidth` so they do not expand indefinitely on wide screens.
5. **Reserve absolute positioning** only for HUD chrome (rails, corners, chapter/pagination overlays) and decorative elements that must break the content flow.
6. **Use the content rhythm tokens** (`--tf-rhythm-*`) as the `spacing` value in auto-layout frames, not arbitrary pixel gaps.
7. **Use the panel padding token** (`--tf-panel-padding`) for presentation content panel insets.

### Principles extracted from Heimdall auto-layout patterns

The following structural principles are adapted from the Heimdall Figma plugin's `createAutoLayoutTemplate()` and 6-phase `normalizeLayout()` flow. They are applied as manual authoring discipline, not as plugin automation.

1. **Column / row nesting:** Build page-level structures as horizontal auto-layout rows containing vertical auto-layout columns. This is the same pattern Heimdall uses for its briefing board: a horizontal `Columns` row wrapping vertical `Briefing`, `Copy`, and `Design` columns.
2. **Semantic spacing via `itemSpacing`:** Set `itemSpacing` on the auto-layout frame to the content rhythm token value (e.g. 28px for default, 45px for relaxed). Do not manually position children with `y` offsets.
3. **Padding as panel inset:** Set `padding` on content containers rather than adding invisible spacer frames. Use `--tf-panel-padding` (53px) for presentation panels.
4. **Hug-then-stretch:** Start with hug-contents sizing, then switch children to fill-parent only when they need to span the container (e.g. a text block that should fill the content column width).
5. **Min/max width preservation:** Use `minWidth` and `maxWidth` on content frames to keep reading rhythm bounded. This prevents text blocks from collapsing to zero or expanding to full-bleed on wide containers.
6. **Skip auto-layout for HUD chrome:** HUD rails, corners, chapter/pagination overlays, and decorative elements should stay outside the auto-layout flow (absolute positioning or separate overlay frames). Only interior content stacks should be auto-layout-driven.

**Reference:** [Figma AutoLayout API](https://developers.figma.com/docs/widgets/api/component-AutoLayout/) | [Heimdall syncBriefings.ts](../../../Manifold%20Delta/Artifacts/11_Heimdall/packages/figma-plugin/src/commands/syncBriefings.ts) (read-only reference)

---

## What Never Appears

- Spacing that is not on the 8px scale (except 4px xs and the content rhythm presets 15/20/28/36/45/53)
- Box shadows for structural depth
- Content flush to viewport without a defined inset
- Skipped depth layers (e.g. modal directly on void)
- Interior content gaps derived from `vw` or container width (use named rhythm presets instead)
