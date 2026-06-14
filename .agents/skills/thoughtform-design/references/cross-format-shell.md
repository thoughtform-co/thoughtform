# Cross-Format Shell Rules

Evergreen scaling formulas for the Thoughtform navigation shell across all formats. These rules make the shell work on any canvas size without per-format hardcoding.

**Freedom tier: MEDIUM.** The formulas and relationships are fixed. The numeric outputs adapt to the canvas.

**Source:** Brand Guidelines Phase 2 (Hartstikke, Apr 2026), pages 5-14. Phase-2 HTML prototype. Runtime: `app/globals.css`, `lib/navigation/rail-contract.ts`.

---

## Core formulas

Every Thoughtform canvas derives its shell geometry from three inputs:

```
canvasW  = width of the canvas in px
canvasH  = height of the canvas in px
shortEdge = min(canvasW, canvasH)
```

### 1. Margin

```
margin = shortEdge * 0.05
```

Applied equally on all four sides. This is the single most important rule: it ensures consistent breathing room regardless of aspect ratio.

| Format      | Canvas      | Short edge | Margin  |
| ----------- | ----------- | ---------- | ------- |
| 16:9 slide  | 1920 x 1080 | 1080       | 54px    |
| 9:16 story  | 1080 x 1920 | 1080       | 54px    |
| 1:1 square  | 1080 x 1080 | 1080       | 54px    |
| A4 portrait | 1240 x 1754 | 1240       | 62px    |
| XL portrait | 4574 x 8131 | 4574       | 228.7px |

### 2. Content box

```
contentW = canvasW - 2 * margin
contentH = canvasH - 2 * margin
```

The content box is the margin-inset rectangle. The 9x17 grid lives inside it.

### 3. Scale factor

```
scale = shortEdge / 1080
```

All proportional values (type sizes, spacing tokens, stroke widths, icon sizes, tick lengths) multiply by this factor. At 1920x1080, scale = 1.0. At A4, scale ≈ 1.148. At XL portrait, scale ≈ 4.235.

### 4. Grid

```
col = contentW / 17
row = contentH / 9
```

The 9x17 grid is the skeleton for content placement. Grid lines are implicit guides, not rendered (unless debug overlay is enabled).

---

## Rail geometry

Rails are vertical navigation markers on the left and right edges of the canvas.

### Rail dimensions

```
railWidth      = 21px * scale      (the strip that contains guide + ticks)
railAsideWidth = 82px * scale      (the full aside zone including spacing)
guideInsetX    = 13.83px * scale   (guide position from outer edge of rail)
```

In responsive web contexts (not fixed canvases), these use `clamp()` instead:

```css
--hud-rail-width: clamp(48px, 4.27vw, 82px);
--hud-rail-guide-inset: clamp(5px, 0.47vw, 9px);
```

### Rail position

```
railTop    = margin                (rail starts at top of content box)
railBottom = margin                (rail ends at bottom of content box)
railHeight = contentH              (full content-box height)
```

The rails span the entire content box. They are NOT inset further by a corner zone.

### Rail guide line

A single 1px vertical hairline at `guideInsetX` from the rail's outer edge. Color: `var(--gold)`. Runs the full rail height.

---

## Tick grid

The tick grid exists in **two canonical variants**. This section describes the **13-position bearing grid** used on fixed-canvas static artifacts (slides, proposals, 9:16 static portraits, 1:1 squares). The 21-position depth-gauge variant applies to scroll-driven responsive surfaces — see `hud-frame-implementation.md` §3b for the variant family and `web-format-patterns.md` §2 for the depth-gauge spec. Selection: `format-adaptation-matrix.md`.

The bearing-grid variant divides the rail into 13 equal positions (12 intervals). Tick positions are **percentages of rail height**, making them inherently agnostic to the specific fixed-canvas format.

### Tick positions

```
tickPositions = [0, 8.33, 16.67, 25, 33.33, 41.67, 50, 58.33, 66.67, 75, 83.33, 91.67, 100]
```

These are multiples of `100/12 ≈ 8.33%`.

### Left rail: 12 ticks

The left rail skips index 1 (8.33%) because that slot is occupied by the compass waypoint (diamond + 50px horizontal line). All other 12 positions get ticks.

### Right rail: 13 ticks

The right rail fills all 13 positions, including index 1.

### Tick sizing

```
minorTickWidth = 7px * scale
majorTickWidth = 21px * scale
```

Major ticks at indices 4 (33.33%) and 8 (66.67%). All others are minor. Ticks extend **outward** from the guide line (left rail ticks go left, right rail ticks go right).

### Tick adaptation by rail height

Because ticks are percentage-based, they automatically adapt to any rail height. On a tall portrait canvas, ticks are more widely spaced in absolute terms. On a small square canvas, they are tighter. The visual result is always a consistent rhythmic division of the rail.

---

## Chrome anchors

Four anchor groups at fixed positions relative to the content box.

### Top-left (two modes)

- **Client shell:** logo slot (max 120x48 at reference, scaled) + 30px terminator rule.
- **Grid shell:** 30x30 L-bracket (top + left border only).

Position: `(margin + guideInset, margin + 4px * scale)`.

### Top-right

30px horizontal rule + chapter/section label. PT Mono, ~18px at reference, gold at 60% opacity, uppercase. Right-anchored: `right: margin + guideInset`.

### Bottom-left

Brandmark (40px at reference) + 30px horizontal terminator tick. On fixed canvases, the brandmark scales with `--tf-scale` (`40px * scale`) so it remains proportional to the composition. In responsive web contexts, it stays at a fixed pixel size via `clamp()`. Either way, it is a small navigation marker, not a hero element — that role belongs to the title-system heading icon (see `title-system.md`).

Position: `(margin, canvasH - margin - brandmarkHeight)`.

### Bottom-right

Pagination number (PT Mono, ~14px at reference) + 30px horizontal rule. Right-anchored: `right: margin + guideInset`.

---

## Compass waypoint

Diamond (8.5px rotated 45deg) + 50px horizontal hairline on the left rail at the 8.33% tick-grid position. The diamond has a 3px dark border for contrast against the gold guide.

Position: relative to the left rail guide, at `railTop + railHeight * 0.0833`.

---

## Format-specific overrides

The formulas above produce correct geometry for any canvas. However, a few behaviors adapt at format boundaries:

### Responsive web (`clamp()` mode)

For app shells and landing pages where the canvas IS the viewport:

- Margin, rail width, guide inset, corner zone use `clamp()` with `vw`/`vmin` units — `--tf-scale` does not apply.
- The **21-position depth-gauge tick variant** applies (not the bearing grid). Ticks represent scroll depth, not waypoint location.
- **Chevron is scroll-driven** (`top: scrollProgress * 100%`), not a fixed compass waypoint. See `web-format-patterns.md` §3.
- Brandmark bottom-left only; navbar (if present) holds nav links with no logo.
- Rails stay visible at all breakpoints. Tick labels hide below 900px; rail widths reduce at 768px and 480px (see `web-format-patterns.md` §6 for the breakpoint table).
- Corner bracket arms and strokes shorten below 900px.
- Omissions: no pagination, no client logo, no 8.33% compass waypoint (replaced by the scroll chevron).

### Responsive web (scroll-driven surfaces)

Web surfaces using the depth-gauge variant follow a different contract from fixed-canvas:

- `--tf-scale` does not apply. All proportional values are defined in `px` / `rem` with `clamp()` where responsive.
- The 9×17 content grid still structures content, but cells are fluid (percent) rather than pixel-multiples of `scale`.
- Format-specific anchors (coord readout, instruction band, section markers on right rail) are available here and nowhere else — see `web-format-patterns.md` §7–9.

### Fixed canvas (specimen / export mode)

For slides, proposals, and exported artifacts where the canvas is a fixed rectangle:

- All values resolve to exact pixel values via the formulas above.
- The canvas is scaled to fit the viewport via `transform: scale(min(vw/canvasW, vh/canvasH))`.

---

## CSS custom property contract

When implementing the shell in CSS, these custom properties drive all primitives:

| Property        | Fixed canvas       | Responsive                       |
| --------------- | ------------------ | -------------------------------- |
| `--tf-canvas-w` | e.g. `1920px`      | viewport width                   |
| `--tf-canvas-h` | e.g. `1080px`      | viewport height                  |
| `--tf-margin`   | `shortEdge * 0.05` | `min(5cqw, 5cqh)`                |
| `--tf-scale`    | `shortEdge / 1080` | `min(100cqw, 100cqh) / 1080`     |
| `--tf-col`      | `contentW / 17`    | `calc(var(--tf-content-w) / 17)` |
| `--tf-row`      | `contentH / 9`     | `calc(var(--tf-content-h) / 9)`  |

The `--hud-*` properties in `app/globals.css` are the Astrolabe-specific responsive implementation of this contract.

---

## Implementation checklist

When building a Thoughtform composition on any new canvas size:

1. Set canvas dimensions.
2. Compute margin from short edge.
3. Compute scale factor from short edge.
4. Draw the content grid (9x17) inside the margin-inset box.
5. Place rails at left and right edges of the content box.
6. Draw tick grid at percentage positions along each rail.
7. Place chrome anchors at their fixed positions.
8. Place content using grid columns and rows per the relevant archetype.
9. Apply type scale and spacing tokens multiplied by the scale factor.

The same checklist works for every format.
