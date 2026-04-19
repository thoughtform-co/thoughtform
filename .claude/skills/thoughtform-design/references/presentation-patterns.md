# Presentation Patterns (Slide Archetypes)

Content slide archetypes for landscape decks — **1920×1080, 16:9**. This is one format archetype within the Thoughtform design system. For any format decision, start at `format-adaptation-matrix.md` first.

**What this doc covers:** content slides (Text, Text+Image, Definition, Quote, Data) for a landscape deck. Uses the **13-position bearing-grid** tick variant (see `hud-frame-implementation.md` §3b).

**What this doc does NOT cover:**

- Title / chapter slides → `title-system.md`.
- Portrait proposals (A4, XL) → `proposal-patterns.md`.
- Responsive web pages (scroll-driven) → `web-format-patterns.md`.
- Mobile web → `mobile-format-patterns.md` §1.
- Static 9:16 portrait artifacts → `mobile-format-patterns.md` §2.

References to "the tick grid" in this doc mean the **13-position bearing-grid variant**. The depth-gauge (21-position) variant applies to web, not slides.

**Freedom tier: MEDIUM.** Archetype structures are fixed; content adapts per use case.

---

## Grid & Layout

All slides use the universal Thoughtform layout grid (see SKILL.md Layer 1):

- **Margin:** 5% of short edge (54px at 1920x1080).
- **Content grid:** 9 rows x 17 columns within the margin-inset box.
- **Scale factor:** `min(w, h) / 1080` (= 1.0 at 1920x1080).

Content rhythm tokens for interior gaps:

- `--tf-rhythm-default` (28px) for standard 1920x1080 decks.
- `--tf-rhythm-large` (36px) for proportionally scaled decks.
- `--tf-rhythm-relaxed` (45px) for presentation/keynote with intentionally calm rhythm.
- `--tf-panel-padding` (53px) for content panel insets.
- Choose the preset per layout variant, not per viewport size.

---

## Slide Archetypes

### Title Slide

- **Background:** void or void-deep. Optional subtle corner brackets (viewport frame).
- **Title:** PT Mono Bold uppercase, display or 2xl size, dawn, tight tracking (`-0.01em` / `-0.02em`). One line when possible.
- **Subtitle / tagline:** PP Neue Montreal, lg or xl, dawn-70. Optional: "Navigate intelligence" or approved tagline.
- **Brandmark:** Bottom-left or bottom-right with clear space. No wordmark required on every title slide if the deck is clearly branded elsewhere.

### Section / Divider

- **Content:** Section number (01, 02, 03) in mono, dawn-30, bearing-label style. Section title in display or 2xl, dawn.
- **Structure:** Minimal. Optional 1px course line (dawn-08) above or below. No decorative imagery unless from Brand Codex.

### Content Slide (Text)

- **Title:** Section heading, PT Mono Bold uppercase, display or xl/2xl, dawn. Consistent with section slide.
- **Body:** PP Neue Montreal, base or md, dawn-70/dawn-80. Loose line-height (1.5–1.6) for readability. Bullets: use diamond waypoints (not circles). Max 5–7 bullets; use two columns or follow-up slides if more.
- **Layout:** Single column or two-column on wide slides. Respect contentMaxWidth or equivalent so line length stays readable.

### Content Slide (Text + Image)

Four branded variations — see `hud-frame-implementation.md` section 12 for full details.

- **Layout:** Text-left (x~157, w~647) / image-right. Variations differ in media treatment (inset with corner unions vs full-bleed right half).
- **Shell states:** `GridShell` (no client logo, inner grid visible) and `ClientShell` (client logo at TL, cleaner surface).
- **Text block:** Eyebrow (gold icon + label), heading (PT Mono Bold 50px), body (PT Mono Regular 20px with gold spans), optional bullet list.
- **Spacing:** 28px gap between text stack items (`--tf-rhythm-default`).
- **Chrome:** Same four anchors as all deck slides (chapter TR, brandmark BL, pagination BR, optional logo TL).

### Data / Chart Slide

- **Chart:** Follow [data-visualization.md](data-visualization.md): 1px lines, diamond markers, semantic color (gold, atreides, alert). Mono for axis labels.
- **Title:** Short caption above or beside chart. dawn, md or lg.
- **Source / footnote:** dawn-30, xs, mono. Bottom of slide.

### Quote / Statement

- **Quote:** Display or 2xl, dawn. One sentence or short phrase. Centered or left-aligned in safe zone.
- **Attribution:** dawn-50, sm or base. Below quote. No quotation marks unless part of brand lockup.

### Closing / CTA

- **Message:** One line, display or 2xl, dawn. E.g. "Navigate intelligence."
- **Optional:** Brandmark, link, or next step in dawn-70. Restraint over clutter.

---

## Typography Summary

- **Titles:** PT Mono Bold uppercase, display / 2xl / xl. Dawn. Tight tracking (`-0.01em` / `-0.02em`) at display sizes.
- **Body:** PP Neue Montreal, base / md. Dawn-70 / Dawn-80.
- **Labels / coordinates:** PT Mono, xs/sm. Dawn-30 / Dawn-40. Uppercase and wide tracking (`0.08em` – `0.12em`) for HUD-style labels.
- **Numbers / data:** PT Mono. Dawn or dawn-70 depending on hierarchy.

---

## Color

- **Backgrounds:** void, void-deep, or surface-0. No gradients unless from Brand Codex.
- **Text:** dawn hierarchy (dawn, dawn-70, dawn-50, dawn-30). Gold for single accent (e.g. key number, CTA). Atreides only when semantics require (success, authorship).
- **Borders / lines:** dawn-08, dawn-15. Gold for active or key divider.

---

## What Never Appears

- Rounded corners on shapes or frames
- System fonts
- More than 2–3 accent colors per slide
- Dense text blocks (break into multiple slides)
- Decorative clip art or off-brand imagery
