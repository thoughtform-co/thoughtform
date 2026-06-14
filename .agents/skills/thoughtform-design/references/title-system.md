# Title System

Composition rules for chapter and title slides across all formats. The title system uses a heading icon, a diagonal stroke, and a horizontal baseline to anchor the title block on the canvas.

**Freedom tier: MEDIUM.** The structural elements (baseline, diagonal, heading icon) and their relationships are fixed. Content placement within the grid adapts per format and title length.

**Source:** Brand Guidelines Phase 2 (Hartstikke, Apr 2026), pages 30-39. Figma Codex node `1767:3745` (chapter slide). Phase-2 HTML prototype `thoughtform-phase2-chapter-title-inline.html`.

---

## Anatomy

A title composition has exactly these elements layered on top of the standard navigation shell (Layer 2):

| Element                 | Description                                                                                                                   | Anchor                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Horizontal baseline** | Full-bleed gold line at 85% of canvas height                                                                                  | Fixed at `top: 85%`                                           |
| **Diagonal stroke**     | Gold line at ~10.4 deg off vertical, passing through the heading-icon crosshair                                               | Dynamic SVG, through icon center                              |
| **Heading icon**        | The "title slide" crosshair glyph (~270x265 at reference)                                                                     | Crosshair center sits on the baseline at 85%                  |
| **Title block**         | Date chip + H1 heading + subtitle                                                                                             | Placed within the 9x17 content grid                           |
| **Navigation shell**    | Corners-only: 4 L-brackets, brandmark anchor, chapter anchor, pagination anchor. **No rails, no ticks, no compass waypoint.** | Per Brand Guidelines Phase 2 (pages 11-15, rails-off variant) |

### What the heading icon is NOT

The heading icon is a **large compositional element** (~270x265px at 1920x1080 reference). It is NOT the small 40px HUD brandmark anchor. The brandmark anchor remains at the bottom-left at its standard 40px size; the heading icon is an independent element anchored on the baseline.

---

## Structural lines

### Horizontal baseline

- Position: `top: 85%` of canvas height, full bleed (left: 0, right: 0). Centered on the 85% line via `transform: translateY(-50%)`.
- Stroke: `--tf-baseline-stroke` (6px). This is a **fixed** stroke width, not scaled by `--tf-scale`, so the baseline reads as a consistent weight across all canvas sizes.
- Color: `var(--gold-50)`.
- The baseline is the compositional anchor for both the heading icon and the title block.

### Diagonal stroke

- Passes through the heading-icon crosshair center.
- Angle: approximately 10.4 deg off vertical (`tan(angle) ≈ 0.184`).
- Extends from above the top edge to below the bottom edge for full-bleed effect.
- Stroke: `--tf-diagonal-stroke` (6px). **Fixed** width like the baseline — not scaled by `--tf-scale`.
- Color: `var(--gold-50)`.
- Implementation: use an SVG `<line>` element with dynamically computed endpoints based on canvas dimensions and icon position. Do not hardcode pixel coordinates.

---

## Heading icon

### SVG glyph

The heading icon is a filled compound path (not stroked). Inline SVG viewBox: `0 0 271 266`.

```svg
<path fill="var(--gold)" d="M244 150.149L241.417 158.851H150.145V158.876H145.054L143.837 165.594H134.697L115.822 266H104.174L120.938 174.147H116.567L118.107 165.619L107.875 165.594L109.141 158.851H17L19.5829 150.149H110.855V150.124H115.946L117.163 143.406H126.303L145.178 43H156.826L140.062 134.853H144.433L142.893 143.381L153.126 143.406L151.859 150.149H244Z"/>
```

### Sizing

- Reference size: `270px` wide, `265px` tall (at 1920x1080).
- Scales with `--tf-scale`: `width: calc(270px * var(--tf-scale))`, `height: calc(265px * var(--tf-scale))`.
- The crosshair center of the glyph is at approximately **56.4%** of its height (y = 150.149 / 266).

### Placement

The heading icon is positioned absolutely (not in the content grid) because its anchor is the baseline, not a grid cell.

1. **Horizontal:** roughly columns 2-4 of the 17-column grid. At reference: `left: calc(var(--tf-margin) + var(--tf-col) * 1.2)`.
2. **Vertical:** the crosshair center must sit on the baseline at `y = 85%`. Formula: `top: calc(85% - (iconHeight * 0.564))`.

The diagonal stroke passes through this crosshair center.

---

## Title block

The title block is placed within the 9x17 content grid. It contains (top to bottom):

1. **Date chip** — chamfered pill with `clip-path`, `var(--dawn-10)` background, `var(--dawn-50)` border. PT Mono, `--tf-h3` size, uppercase.
2. **H1 heading** — PT Mono Bold, `--tf-h1` size (100px at reference), uppercase, `var(--dawn)`, `line-height: 1`.
3. **Subtitle** — PT Mono Regular, `--tf-h3` size (25px at reference), uppercase, `var(--dawn)`. Pipe-separated segments.

### Placement by format

| Format                     | Grid columns | Grid rows | Notes                               |
| -------------------------- | ------------ | --------- | ----------------------------------- |
| **16:9 slide (hero)**      | 5 / 16       | 4 / 7     | `align-self: center`                |
| **A4 portrait (proposal)** | 3 / 17       | 3 / 8     | `align-self: start`, wider span     |
| **9:16 story**             | 3 / 16       | 2 / 5     | Title higher to clear taller canvas |
| **1:1 square**             | 4 / 16       | 3 / 6     | Balanced center                     |

These are starting presets. Adjust grid placement based on title length: longer titles may need more columns or rows.

### Spacing

Gap between title-block children: `--tf-rhythm-sm` (40px at reference scale).

---

## Shell variant: corners-only

Title/chapter slides use the **corners-only** navigation shell, not the full-rails shell used by content slides (Text+Image, definition, quote, data).

### What is present

- Top-left 30x30 L-bracket at `(56.33, 63.01)` — Figma `1767:3775`
- Top-right 30x30 L-bracket at `(1865.46, 63.01)` — Figma `1767:3776` (mirrored: `border-top + border-right`)
- Bottom-left brandmark cluster at `(36.71, 953.01)` 80x80 — Figma `1767:3757`
- Bottom-right pagination cluster at `(1816.66, 967.06)` — Figma `1767:3768`
- Top-right chapter label + 30px rule
- Bottom-right pagination number + 30px rule

### What is NOT present

- No left rail (no guide line, no ticks, no bearing labels)
- No right rail
- No compass waypoint (diamond + 50px line)

### Implementation

Pass `showRails={false}` and `showTopRightBracket={true}` to `SpecimenFrame`.

## Title system vs other slide types

The title system applies only to **chapter/title slides** and **section dividers** that use the heading-icon motif. Other slide types (content, definition, quote, data) do NOT use the heading icon, diagonal, or baseline. They use the full-rails navigation shell.

---

## Format adaptation

The title system adapts to different canvas sizes through the scale factor and grid, not through per-format hardcoding:

1. **Margin, grid, scale factor** come from Layer 1 foundations (5% short-edge margin, 9x17 grid, `min(w,h)/1080` scale).
2. **Heading icon size** scales with `--tf-scale`.
3. **Baseline position** stays at 85% of canvas height regardless of format.
4. **Diagonal angle** stays at ~10.4 deg off vertical; endpoints are recomputed dynamically per canvas size.
5. **Title-block grid placement** shifts per format preset (see table above).

This means the same composition logic works for 16:9, 9:16, 1:1, A4, and custom formats without format-specific CSS.

---

## Pure-code implementation (Astrolabe)

The title system is implemented as reusable code primitives. No Figma-exported SVG or localhost assets are needed for the chrome layer.

### Brand atom

`components/brand/HeadingIcon.tsx` provides the heading-icon glyph as a pure inline-SVG component with the extracted path data, crosshair ratios, and viewBox constants. Exported from the `components/brand/` barrel alongside `Brandmark`, `Wordmark`, etc.

### Shared composition

`app/brand-system/_shared/ChapterTitleFrame.tsx` composes on top of `SpecimenFrame` (which provides the full navigation shell) and adds the title-system layers:

- **Starfield** — CSS radial-gradient dots scattered across the canvas for particle density
- **Nebula glow** — subtle gold radial gradient near the heading-icon focal area
- **Technical drafting overlay** — inline SVG with structural lines, rectangles, tiny text, axis marks, and diamond waypoints in the bottom-right quadrant
- **Baseline**, **diagonal**, **heading icon** — the core title-system structural lines
- **Date chip**, **title block** — content layer

All positioning is derived from the constants and formulas documented above. The structural overlays use sub-10% opacity so they read as background instrumentation, not foreground content.

### Route-level usage

A chapter-title page is a thin composition layer:

```tsx
import { ChapterTitleFrame } from "../_shared/ChapterTitleFrame";

export default function ChapterTitlePage() {
  return (
    <ChapterTitleFrame
      date="September 12, 2025"
      title="Through the Gateway: Legal Decision-Making in the Age of AI"
      subtitle="Thoughtform x POPPINS | Strategic Workshop"
      chapter="CHAPTER 01"
      paginationIndex={1}
      backgroundSrc="/art/chapter-bg.png" // optional
    />
  );
}
```

### Asset boundary (mixed)

- **Manual art (optional):** textured atmosphere/background only (grain, noise, photographic overlays). Pass via `backgroundSrc`.
- **Pure code (required):** starfield dots, nebula glow, technical drafting overlay, structural lines, heading icon, date chip, title block, all navigation chrome. These must never be replaced with Figma-exported assets.
