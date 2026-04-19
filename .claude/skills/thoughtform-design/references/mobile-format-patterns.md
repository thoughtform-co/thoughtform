# Mobile Format Patterns

**Freedom tier:** MEDIUM for rules, LOW for breakpoint boundaries and the 9:16 fixed-canvas specs.

This doc covers **two distinct mobile contexts** that share the Thoughtform navigational leitmotif but differ in canvas model:

- **§1 Responsive mobile web** — the mobile branches of the web shell (`≤768px`, `≤480px`). Scroll-driven, viewport-as-canvas, 21-pos depth-gauge ticks. Read `web-format-patterns.md` first; this section only covers the mobile-specific adaptations.
- **§2 Static 9:16 portrait artifacts** — fixed-canvas exports: proposal PDF pages, Instagram stories, social tiles, printed portraits. Not responsive. 13-pos bearing-grid ticks.

If you're not sure which applies: scroll-driven browser view with layout that adapts to the user's screen → §1. Fixed 1080×1920 (or equivalent ratio) export that goes to a PDF, social platform, or static image → §2.

---

## §1 Responsive mobile web

### Relationship to the web shell

This is **the same shell** as described in `web-format-patterns.md`, just rendered at narrow viewport widths. It is **not a new tick variant**. The 21-pos depth gauge continues to apply — labels hide, widths reduce, but the count and the variant do not change.

This matters because it caps the tick family at two canonicals (13-pos bearing, 21-pos depth gauge). A "compact mobile" tick variant is not a third variant — it's the 21-pos depth gauge rendered with labels hidden and tick widths halved. Mental model: one canvas-type decision, then a viewport-level render decision.

### Breakpoint behaviors (from v5)

| Breakpoint          | Rail width | Tick label | Tick major | Tick minor | Corner size | Corner stroke | Padding |
| ------------------- | ---------- | ---------- | ---------- | ---------- | ----------- | ------------- | ------- |
| **≤768px (mobile)** | 32px       | hidden     | 12px       | 6px        | 20px        | 1.5px         | 8px     |
| **≤480px (micro)**  | 28px       | hidden     | 10px       | 5px        | 18px        | may hide      | 6px     |

Rails remain functional (not decorative). The chevron still tracks `scrollProgress * 100%`. The depth semantic holds: even without labels, the tick density + major cadence reads as "descent from 0 to 10."

### Touch targets

All interactive elements (nav items, CTAs, section markers, sigil buttons) must meet **44×44px minimum** per iOS HIG / WCAG AAA target size. This is a `/frontend-design` concern — when you are designing touch interactions inside the shell, consult `/frontend-design` for patterns. Shell anchors (brandmark, rails, section markers) are not themselves tap targets in the primary nav; they're indicators. If you need to make one tappable (e.g. brandmark → home), wrap it with a 44px invisible hit area.

### Safe-area insets

iOS notches, bottom home indicators, Android gesture bars. All HUD padding tokens incorporate safe-area insets:

```css
--hud-pad-top: max(var(--hud-padding), env(safe-area-inset-top, 0px));
--hud-pad-right: max(var(--hud-padding), env(safe-area-inset-right, 0px));
--hud-pad-bottom: max(var(--hud-padding), env(safe-area-inset-bottom, 0px));
--hud-pad-left: max(var(--hud-padding), env(safe-area-inset-left, 0px));
```

This means the rails and brandmark adjust automatically for notched devices without hard-coded device checks.

### Navigation metaphor on mobile

**The mobile shell is still an instrument, not an app chrome.**

- **Do not use a hamburger menu with a slide-out drawer.** That's a consumer-app pattern; it breaks the navigation-as-instrument metaphor.
- **Do use a top-right glyph** that opens a full-screen overlay constructed from the same HUD rails and ticks. The overlay is a "mission selector" screen, not a drawer.
- **Section indicator top-left** (per v5): a compact `"02 INTERFACE"` readout showing the current scroll section. Mono 10px, letter-spacing 0.08em.
- **No logo in the mobile top area.** Brandmark stays bottom-left per the cross-format rule. The section indicator replaces the desktop navbar on mobile.

### What stays vs. what hides on mobile web

| Element                      | ≤768px       | ≤480px               |
| ---------------------------- | ------------ | -------------------- |
| Left + right rails           | ✓ (narrower) | ✓ (thinner)          |
| 21-pos depth-gauge ticks     | ✓            | ✓                    |
| Scroll chevron               | ✓            | ✓                    |
| Brandmark bottom-left        | ✓ (clamped)  | ✓ (clamped, smaller) |
| Tick labels                  | hidden       | hidden               |
| HUD coord readout            | hidden       | hidden               |
| Instruction band             | centered     | optional             |
| Section markers (right rail) | compact      | minimal (dots only)  |
| Section indicator (top area) | ✓            | ✓                    |
| Desktop navbar               | hidden       | hidden               |
| Corner brackets              | 1.5px        | may hide             |

### Delegation to `/frontend-design`

Everything above is shell. For component patterns inside the shell — card stacks, mobile-optimized buttons, touch gestures, hydration, bottom-sheet interactions — consult `/frontend-design`.

---

## §2 Static 9:16 portrait artifacts

A completely different canvas model. These are **fixed-dimension exports** that render to PDF, social platforms (Instagram / TikTok / LinkedIn stories), or printed media. They are not responsive. They do not scroll. The user sees them at a single aspect ratio and size.

### Canvas

- **Standard dimensions: 1080×1920** (9:16 aspect). Other proportional sizes (540×960, 2160×3840) scale via `--tf-scale = min(w, h) / 1080`.
- **Fixed margin formula:** 5% of the short edge = 54px on a 1080-wide canvas.
- **9×17 content grid** inside the margin-inset box. The 17-row count is what makes 9:16 work cleanly — a cell is square (60×60 at reference).

### Tick variant — 13-pos bearing grid

**9:16 static artifacts use the 13-position bearing grid, not the 21-pos depth gauge.**

Rationale: the rail represents waypoint location on a static canvas (where this artifact sits in a narrative sequence, or just as framing for a single composition). There is no scroll, no descent. The bearing grid is the canonical for all static fixed-canvas artifacts in the Thoughtform family.

- 13 ticks along the rail, equal-spaced at `100/12 * n` percentages.
- Majors at indices 4 (33.33%) and 8 (66.67%).
- Bearing labels on majors: `"2"` and `"5"` (reading outward from the rail; left rail labels sit 24px inward into the canvas).
- Left rail has 12 ticks (index 1 slot reserved for the compass waypoint).
- Right rail has 13 ticks.

### Compass waypoint (at 8.33%)

Static 9:16 artifacts include the full compass waypoint — a diamond + 50px horizontal hairline at the 8.33% slot on the left rail. This is the fixed-position "you are here" indicator for a static artifact. Web shells replace this with the scroll chevron; static artifacts keep the compass waypoint.

### Chrome anchors on 9:16

| Anchor          | Position                                 | Content                                              |
| --------------- | ---------------------------------------- | ---------------------------------------------------- |
| Top-left        | L-bracket OR client logo slot            | Logo when presenting to clients; L-bracket otherwise |
| Top-right       | 30px rule + chapter label                | Section or chapter name, mono                        |
| Bottom-left     | Brandmark (40px @ ref) + terminator tick | Always present                                       |
| Bottom-right    | 30px rule + pagination number            | Page index ("03 / 12")                               |
| Left rail 8.33% | Compass waypoint (diamond + 50px line)   | Fixed                                                |

### Content rules on 9:16

- **Single-column text only.** No two-column layouts on portrait — reading flow is vertical.
- **Heading sizes reduce by `--tf-scale`.** A 100px heading at reference becomes `100 * --tf-scale` on smaller canvases.
- **Hero image** (if present) takes rows 2–5 of the 9×17 grid (full width of content area).
- **Body text** in PP Neue Montreal, 120% line-height, wraps within the margin-inset content box.

### What is NOT on 9:16 static

- No scroll chevron (no scroll).
- No 21-pos depth gauge.
- No coord readout, no instruction band (web-only).
- No section markers on the right rail (web and app-shell only).
- No navbar (no interactive nav — it's a static artifact).
- No title-system heading icon (unless it IS a chapter/title page — then use `title-system.md` rules).

### Rendering

- Export from Figma, a code-driven canvas (SVG, Canvas, WebGL), or a static HTML page with fixed dimensions.
- If rendering to PDF: embed fonts, keep vectors, use print-safe colours (the Thoughtform gold and dawn tokens are already print-safe).
- If rendering to social: target the platform's recommended resolution (IG story 1080×1920, TikTok 1080×1920, LinkedIn story same).

---

## §3 Omission rules that apply to both mobile contexts

- **No client logo on Thoughtform's own mobile web.** Same rule as desktop web — our own site, not presenting to anyone.
- **No pagination on mobile web.** Infinite scroll applies there too.
- **No two-column text on mobile.** Both contexts are narrow; reading flow stays vertical.
- **No long coord readouts on mobile web.** Hidden below 900px. If you need a telemetry indicator, use a short section indicator instead.
- **No hamburger + side-drawer pattern anywhere.** Mobile nav uses a full-screen overlay on the same rails.

---

## §4 Quick-start checklists

### Mobile responsive web

1. Start from `web-format-patterns.md` — apply the full web shell.
2. Confirm breakpoint tokens per the §1 table above.
3. Hide tick labels, coord readout.
4. Replace desktop navbar with section indicator top-left + full-screen overlay behind a top-right glyph.
5. Verify touch targets are 44×44px or wrapped with a hit area.
6. Verify safe-area insets apply to all HUD padding tokens.
7. Load `/frontend-design` for component patterns inside the shell.

### 9:16 static portrait artifact

1. Fix canvas at 1080×1920 (or proportional).
2. Apply 5% margin, 9×17 grid, `--tf-scale` for proportional values.
3. Apply the 13-pos bearing grid rails + compass waypoint at 8.33%.
4. Place the four chrome anchors (TL, TR, BL, BR) per the table above.
5. Fit content within the 9×17 grid, single-column.
6. For title/chapter pages, load `title-system.md` instead.
7. Export from Figma or a fixed-dimension render path; don't try to make it responsive.
