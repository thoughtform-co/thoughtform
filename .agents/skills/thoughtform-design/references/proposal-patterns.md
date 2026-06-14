# Proposal & Editorial Patterns

Composition rules for portrait-oriented documents: A4 proposals, one-pagers, vertical presentations, and editorial layouts. These formats use the same foundations (Layer 1) and shell grammar (Layer 2) as slides but adapt content flow for vertical reading.

**Freedom tier: MEDIUM.** The shell, grid, and type system are fixed. Content sectioning and density are adapted per document length and purpose.

**Source:** Brand Guidelines Phase 2 (Hartstikke, Apr 2026). Figma Codex node `1754:596` (Lotus Bakeries proposal, 4574x8131). A4 reference: 1240x1754.

---

## Canvas setup

Proposals use the same canvas engine as slides:

| Property     | Formula                                 | A4 example  | XL example      |
| ------------ | --------------------------------------- | ----------- | --------------- |
| Canvas size  | Set by format                           | 1240 x 1754 | 4574 x 8131     |
| Margin       | 5% of short edge                        | 62px        | 228.7px         |
| Content grid | 9 rows x 17 columns in margin-inset box | 1116 x 1630 | 4116.6 x 7673.6 |
| Scale factor | `min(w, h) / 1080`                      | 1.148       | 4.235           |
| Column width | content-w / 17                          | 65.6px      | 242.2px         |
| Row height   | content-h / 9                           | 181.1px     | 852.6px         |

---

## Shell adaptation for portrait

Portrait formats use the same navigation shell as landscape, but the tall aspect ratio changes visual weight:

- **Rails** run the full content-box height. Because the canvas is taller than wide, rails are much longer relative to width, giving the composition strong vertical framing.
- **Tick density** stays at 13 positions (percentage-based), so ticks are more widely spaced in absolute terms on tall canvases.
- **Chrome anchors** stay at their standard positions (top-left, top-right, bottom-left, bottom-right).
- **Brandmark** stays at 40px equivalent (scaled by `--tf-scale`), which on a tall portrait canvas will be proportionally smaller than on a 16:9 slide. This is correct: the brandmark is a navigation marker, not a hero element.

### Client logo in proposals

The top-left anchor switches to `client` shell mode: client logo in the logo slot + 30px terminator rule. The top-right anchor carries a contextual label (e.g. "PROPOSAL") instead of a chapter number.

---

## Content sections

A proposal page typically flows top-to-bottom through numbered sections. Each section occupies a horizontal band of the content grid.

### Section header

- **Number + title:** e.g. `01 / WHAT`. PT Mono, `--tf-h3` size, uppercase, `var(--dawn)`.
- **Container:** chamfered date-chip style or plain text, depending on density.
- **Position:** left-aligned within the content grid, at the start of the section's row band.

### Section body

- **Columns:** use 2-column layout within the 17-column grid for text-heavy sections (e.g. columns 2-8 and 10-16). Single column for focused content.
- **Typography:** body text in PP Neue Montreal, `--tf-body` size. Subheadings in PT Mono Bold, `--tf-h3` size. Emphasized text in bold gold.
- **Spacing:** `--tf-rhythm-default` (28px at reference) between paragraphs. `--tf-rhythm-lg` (70px at reference) between sections.
- **Lists:** bullet points use `StarGlitch` markers. List items use PT Mono at body size.

### Data blocks

- **Key-value pairs:** label in PT Mono Regular `--tf-h3`, value in PT Mono Bold or PP Neue Montreal at display size. Useful for pricing, duration, participants.
- **Layout:** arrange in 2-3 column sub-grids within the section band.

### Photo / media

- **Photo frames:** framed images use the same corner-union (`HudUnionCorner`) treatment as slides. Frame scales with content.
- **Full-bleed images:** may span the full content width. Navigation shell overlays on top.
- **Bio blocks:** photo + name + title + description, arranged in a 2-column layout within the section band.

---

## Bottom zone

The bottom 15-20% of a proposal page is reserved for:

1. **Wordmark lockup** — the Thoughtform vertical wordmark, positioned bottom-left within the content grid. Size: approximately 3-4 grid columns wide.
2. **Hero image** — optional large decorative image spanning the bottom portion, with the wordmark overlaid.
3. **Standard chrome** — brandmark anchor + pagination anchor remain at their fixed positions.

---

## Typography scale for proposals

At A4 scale (`--tf-scale ≈ 1.148`), the reference type sizes resolve to:

| Token            | Reference | A4 actual | Usage                       |
| ---------------- | --------- | --------- | --------------------------- |
| `--tf-h1`        | 100px     | ~115px    | Page title (if title slide) |
| `--tf-h2`        | 50px      | ~57px     | Section headings            |
| `--tf-h3`        | 25px      | ~29px     | Subheadings, labels, chips  |
| `--tf-body`      | 30px      | ~34px     | Body copy                   |
| `--tf-hud-micro` | 20px      | ~23px     | HUD labels, metadata        |

At XL scale (`--tf-scale ≈ 4.235`), these multiply accordingly. The type scale remains proportional because it derives from `--tf-scale`.

---

## Multi-page proposals

For multi-page documents, each page is a separate canvas instance with its own shell. Pagination in the bottom-right anchor tracks page number. Section numbering is continuous across pages.

Content flow across pages:

1. **Page 1:** title/hero section with heading icon (title-system), overview sections.
2. **Pages 2-N:** content sections, each starting at the top of the content grid.
3. **Final page:** closing section, optional CTA, full wordmark lockup.

---

## What makes proposals different from slides

| Aspect          | Slides                       | Proposals                        |
| --------------- | ---------------------------- | -------------------------------- |
| Orientation     | Landscape (16:9)             | Portrait (A4, custom)            |
| Content density | Sparse, one idea per slide   | Denser, multi-section per page   |
| Reading mode    | Projected/presented          | Read/printed                     |
| Rhythm preset   | `--tf-rhythm-relaxed` (45px) | `--tf-rhythm-default` (28px)     |
| Column usage    | Full-width or 2-column max   | 2-3 column layouts common        |
| Section flow    | One per slide                | Multiple per page, top-to-bottom |
| Typography      | Display-size headings        | Mix of heading and body sizes    |
