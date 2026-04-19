---
name: thoughtform-design
description: Canonical Thoughtform design + brand system for any Thoughtform product (Thoughtform.co, Astrolabe, Atlas, Sigil). Portable brand system — navigation metaphor, HUD grammar, tokens, color tiers, typography, motion, voice, format archetypes (slides, landing pages, proposals, responsive web shells, 9:16 static artifacts), HUD adaptation matrix, cross-format omission rules, Figma extraction, data viz, particles. Delegates UX/IA/responsive-component decisions to `/frontend-design`. Use when building or reviewing UI, CSS, layouts, components, decks, charts, screenshots, Figma, brand, identity, palette, or Thoughtform visual output.
---

# Thoughtform Design System

> **Fork note:** this copy of the skill was forked from the Astrolabe repo and now evolves independently in the Thoughtform.co (v5) repo. The two copies share universal rules (tokens, shape law, color tiers, navigation grammar) but may diverge on product appendices. When a universal rule changes, migrate the edit to both repos manually.

Everything Thoughtform makes is an **instrument for navigating intelligence**. Interfaces are viewports into latent space: **precision, retrofuturism, tactical restraint** (research station, not carnival). Meaning has geometry; interfaces are navigable meaning-space.

This skill is structured in three layers. Start at Layer 1 for any Thoughtform output; descend into Layers 2 and 3 only when the task demands their specificity. For any format decision, consult the **format adaptation matrix** (`references/format-adaptation-matrix.md`) first — it routes you to the right Layer 3 archetype and tells you which HUD elements are present, omitted, or density-scaled on that surface.

---

## Layer 1 — Universal Foundations (all formats)

These rules apply to every Thoughtform artifact: slides, landing pages, A4 proposals, app shells, social posts. They are format-agnostic.

### Metaphor

Layout = orientation and waypoints. Color = signal strength (gold = "you are here"). Type = readouts and bearings. Motion = mechanical feedback. Copy = precise and guiding.

### Identity

Brandmark (gateway + compass), wordmark (vector lockup, code-generated SVG paths), vectors as north stars. **Shape law:** zero border-radius; diamonds (45-deg squares) not circles; corner brackets/chamfers for frames. Full rules: `references/identity-system.md`.

### Color (three tiers, no overlap)

**Dawn/Ink** (~90%) = environment and structure. **Gold** (~7%) = wayfinding and active nav. **Atreides green** (~3%) = provenance ("you made this"). Gold and green never swap jobs. `references/color-system.md`.

```css
--void: #050403;
--surface-0: #0a0908;
--surface-1: #0f0e0c;
--dawn: #ece3d6;
--dawn-08: rgba(236, 227, 214, 0.08);
--gold: #caa554;
--gold-15: rgba(202, 165, 84, 0.15);
--atreides-mid: #3d4b33;
--atreides-light: #5b7a4e;
```

### Typography

```css
--font-pt-mono: "PT Mono", monospace; /* headings, HUD labels, data readouts */
--font-pp-neue-montreal: "PP Neue Montreal", sans-serif; /* body, descriptions, long-form */
```

Font sizes are divisible by 5 at the reference scale (100, 50, 30, 25, 20). The type scale adapts via `--tf-scale` (see Layer 2). PP Mondwest is retired; the wordmark is inline SVG. Full spec: `references/typography-system.md`.

### Motion

No spring/bounce. **80-150ms** for UI state changes. Easing: `cubic-bezier(0.16, 1, 0.3, 1)`. `references/motion-system.md`.

### Voice

Precise, not cold; technical but accessible; instrument language, not marketing. `references/voice-and-tone.md`.

### Layout grid

Every Thoughtform canvas uses the same structural logic regardless of size:

1. **Margin** = 5% of the shortest canvas edge, applied equally on all four sides.
2. **Content grid** = the margin-inset rectangle divided into **9 rows x 17 columns** (gap 0).
3. **Scale factor** = `min(canvasW, canvasH) / 1080`. All proportional values (type, spacing, stroke widths, icon sizes) derive from this.

This means an A4 portrait, a 16:9 slide, and a 1:1 square all share the same margin logic, the same grid subdivision, and the same scale factor. The grid is the skeleton; content placement is archetype-specific (see Layer 3).

Full token tables: `references/tokens.md`. Philosophy: `references/brand-philosophy.md`.

---

## Layer 2 — Scalable Shell Grammar (navigation chrome)

The Thoughtform navigation shell wraps content in instrument-grade chrome. Its elements scale proportionally; they are not hardcoded per viewport.

**For precise implementation in code, load `references/hud-frame-implementation.md`.** That doc has exact Figma-derived coordinates for the 1920x1080 reference specimen. For universal design guidance, read this section first.

### Shell anatomy

| Element                 | Role                                        | Scales with                                                                       |
| ----------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| **Left + right rails**  | Vertical guide line + tick marks            | Rail height = content-box height; tick positions are percentages (0-100%)         |
| **Top-left anchor**     | Client logo lockup OR grid L-bracket        | Fixed proportional size                                                           |
| **Top-right anchor**    | Chapter/section label + 30px rule           | Fixed proportional size                                                           |
| **Bottom-left anchor**  | Brandmark (40px at ref) + terminator tick   | Scales with `--tf-scale` on fixed canvases; uses `clamp()` in responsive contexts |
| **Bottom-right anchor** | Pagination number + 30px rule               | Fixed proportional size                                                           |
| **Compass waypoint**    | Diamond + 50px horizontal line on left rail | Sits at the 8.33% tick-grid slot                                                  |

### Rail scaling rules

Rails use a **13-position equal-spacing tick grid** across the full rail height. Tick positions are percentages (`100/12 * n`), so they are inherently format-agnostic. Left rail has 12 ticks (skips index 1 for the compass slot); right rail has 13. Majors at indices 4 and 8 (33.33% / 66.67%). Minor ticks = 7px equivalent; major ticks = 21px equivalent (at reference scale).

The rail guide, tick widths, and chrome anchor sizes scale by `--tf-scale`. Margins, rail-aside widths, and guide insets use `clamp()` in responsive contexts or fixed values in fixed-canvas contexts.

Full scaling formulas: `references/cross-format-shell.md`.

### Shell variants by format

The HUD is a **family**, not a single rendering. The `Ticks` column names a variant — 13-pos bearing grid (waypoint semantics) or 21-pos depth gauge (scroll semantics). See `references/hud-frame-implementation.md` §3b for the family definition and `references/format-adaptation-matrix.md` for selection rules.

| Format                         | Rails                | Ticks                     | Chevron behavior       | Chrome anchors                                                 | Notes                                                                                                    |
| ------------------------------ | -------------------- | ------------------------- | ---------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **16:9 slide (content)**       | Both                 | 13 (bearing)              | Waypoint at 8.33%      | All four                                                       | Standard deck shell (Text+Image, definition, quote)                                                      |
| **16:9 slide (title/chapter)** | None                 | —                         | —                      | Corners only (4 L-brackets + brandmark + chapter + pagination) | Corners-only shell per Brand Guidelines Phase 2                                                          |
| **9:16 static portrait**       | Both (shorter)       | 13 (bearing)              | Waypoint at 8.33%      | All four                                                       | Static artifact — stories, exports, social, PDF proposal pages. Rails on short dimension                 |
| **1:1 square**                 | Both                 | 13 (bearing)              | Waypoint at 8.33%      | All four                                                       | Compact but complete                                                                                     |
| **A4 portrait**                | Both (tall)          | 13 (bearing)              | Waypoint at 8.33%      | All four                                                       | Proposal / one-pager                                                                                     |
| **XL portrait**                | Both (very tall)     | 13 (bearing)              | Waypoint at 8.33%      | All four                                                       | Lotus-style proposal                                                                                     |
| **Web — desktop (>1100px)**    | Both                 | 21 (depth gauge)          | Scroll-driven (0–100%) | Brandmark BL only; coord readout + instruction band optional   | No pagination, no client logo. Navbar holds section links only. See `references/web-format-patterns.md`. |
| **Web — ≤768px**               | Both (narrow, 32px)  | 21 (depth gauge)          | Scroll-driven          | Brandmark BL; section indicator top-left                       | Tick labels hidden; coord readout hidden. See `references/mobile-format-patterns.md` §1.                 |
| **Web — ≤480px**               | Both (thinner, 28px) | 21 (depth gauge)          | Scroll-driven          | Brandmark BL; section indicator top-left                       | Minimal chrome; corner brackets may hide.                                                                |
| **App shell**                  | Both (responsive)    | 21 or 13 (product choice) | App-state driven       | Subset (no pagination)                                         | `HudFrame` component                                                                                     |

### Brandmark vs title-system icon

The **HUD brandmark anchor** (bottom-left, 40px at reference) is the Thoughtform gateway+compass glyph. It appears in the navigation shell on every format at a small, optically fixed size.

The **title-system heading icon** (crosshair + diagonal motif) is a separate, larger element used only on chapter/title slides. It anchors to the horizontal baseline at ~85% canvas height and scales with the canvas. These are two distinct elements; never substitute one for the other. See `references/title-system.md` for heading-icon geometry and placement.

**Pure-code boundary (mixed):** all title-system chrome (baseline, diagonal, heading icon, date chip, starfield, technical drafting overlay, corner brackets, brandmark, pagination) must be generated from code primitives. Only the textured atmosphere/background may be a manual asset. See `references/title-system.md` for the implementation path and exact asset boundary.

### Navigation grammar

`references/navigation-grammar.md` covers the 11 conceptual primitives (viewport frame, telemetry rails, compass anchor, waypoints, heading indicator, data readouts, course lines, depth layers, signal strength, bearing labels, particle glyphs). It does **not** override placement rules from the shell implementation doc.

---

## Layer 3 — Format Archetypes (recipes per medium)

Each archetype inherits Layer 1 foundations and Layer 2 shell grammar, then adds format-specific composition rules.

| Archetype                                          | Reference                               | Tier   |
| -------------------------------------------------- | --------------------------------------- | ------ |
| **Title / chapter slides**                         | `references/title-system.md`            | MEDIUM |
| **Content slides (text, text+image, quote, data)** | `references/presentation-patterns.md`   | MEDIUM |
| **Portrait proposals (A4, XL)**                    | `references/proposal-patterns.md`       | MEDIUM |
| **Web / landing pages**                            | `references/products/thoughtform-co.md` | MEDIUM |
| **App shells (Astrolabe, Atlas, Sigil)**           | `references/products/*.md`              | MEDIUM |

### Choosing an archetype

Match intent to archetype. Every archetype uses the same margin, grid, type scale, color, and shell grammar. They differ only in content placement, density preset, and which shell elements are visible.

---

## Implementation (Astrolabe runtime)

When building Thoughtform compositions in the Astrolabe codebase, use the primitive system:

1. **Brand atoms** (`components/brand/`) — `Brandmark`, `Wordmark`, `Diamond`, `StarGlitch`, `StarBurst`.
2. **HUD primitives** (`components/hud/`) — `HudGuideLine`, `HudTick`, `HudRail`, `HudRule`, `HudInnerGrid`, `HudUnionCorner`, `HudCornerBracket`.
3. **HUD anchors** (`components/hud/`) — `HudLogoSlot`, `HudTopLeftIcon`, `HudChapterAnchor`, `HudBrandmarkAnchor`, `HudPaginationAnchor`.
4. **Responsive composition** — `components/hud/HudFrame.tsx` for app shells and responsive pages.
5. **Pixel-accurate specimen composition** — `app/brand-system/_shared/SpecimenFrame.tsx` for 1920x1080 Figma parity only.

**Hard rules:**

- Never inline rail markup, tick math, or chrome anchor positioning in a page component.
- Never guess a glyph shape. `exportAsync` the SVG from Figma first.
- Never copy-paste variants. Extract shared helpers. See `figma-to-code-playbook.md` §8.

API surface: `references/primitives-api.md`. Figma node IDs: `references/figma-codex-map.md`. Porting workflow: `references/figma-to-code-playbook.md`.

---

## Workflows

| Intent                                                      | Steps                                                                                                                                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Screenshot / Figma**                                      | Decompose, map to tokens + grammar, contrast, propose. Use `references/figma-codex-map.md` for node IDs.                                                                    |
| **New component**                                           | Map to grammar primitives; use BEM + tokens; zero radius; motion from `motion-system.md`. Consult `/frontend-design` for component-level structure and state.               |
| **Any format decision**                                     | Start at `references/format-adaptation-matrix.md`. Pick format row, confirm tick variant and omissions, then load the format-specific doc.                                  |
| **Slide / deck**                                            | Choose archetype from Layer 3. Apply shell from Layer 2 (13-pos bearing grid). Content per `references/presentation-patterns.md`.                                           |
| **Title / chapter slide**                                   | Load `references/title-system.md`. Heading icon + diagonal + baseline.                                                                                                      |
| **Proposal (A4 / portrait)**                                | Load `references/proposal-patterns.md`. Same shell, vertical content flow, 13-pos bearing grid.                                                                             |
| **Responsive web page (scroll-driven)**                     | Load `references/web-format-patterns.md`. Viewport-as-canvas, 21-pos depth gauge, scroll chevron, brandmark bottom-left. Delegate component behavior to `/frontend-design`. |
| **Mobile responsive web**                                   | Load `references/mobile-format-patterns.md` §1. Same 21-pos depth gauge with label-hiding and width-scaling. Touch targets and component patterns: `/frontend-design`.      |
| **Static 9:16 portrait artifact** (story, social, PDF page) | Load `references/mobile-format-patterns.md` §2. Fixed canvas, 13-pos bearing grid. Not responsive.                                                                          |
| **App shell (Astrolabe, Atlas, Sigil)**                     | Load the product appendix. Responsive shell via `HudFrame`.                                                                                                                 |
| **Data viz**                                                | 1px hairlines, diamond markers, semantic Gold/Green/Alert. `references/data-visualization.md`.                                                                              |
| **Particles / icons**                                       | `references/particle-icon-grammar.md`.                                                                                                                                      |

---

## When to consult `/frontend-design`

`thoughtform-design` owns: brand identity, shape law, color tiers, tokens, HUD grammar, format adaptation rules, tick-density variants, shell presence/omission. Load it **first** for any Thoughtform artifact.

`/frontend-design` owns: component structure inside the shell, responsive breakpoint math below the shell level, touch-target sizing, component-level accessibility, performance patterns, non-HUD interaction design for Thoughtform.co specifically.

**Handoff sequence on any web or mobile task:**

1. `thoughtform-design` → pick format, apply shell, confirm tokens, resolve omission rules via `references/format-adaptation-matrix.md`.
2. `/frontend-design` → choose component patterns, responsive behavior inside the shell, accessibility, performance.

Brand rules (shape law, color tiers, type stack, HUD presence, always-on anchors) are non-negotiable and take precedence if the two skills conflict. Component choices below the shell are deferred to `/frontend-design`.

---

## Product appendices (repo-specific)

Prefer **live CSS and contracts in the repo you are editing** over prose here.

| Product        | Appendix                                |
| -------------- | --------------------------------------- |
| Thoughtform.co | `references/products/thoughtform-co.md` |
| Astrolabe      | `references/products/astrolabe.md`      |
| Atlas          | `references/products/atlas.md`          |
| Sigil          | `references/products/sigil.md`          |

---

## Freedom tiers

- **LOW (exact, non-negotiable):** color tokens, fonts (PT Mono + PP Neue Montreal), zero border-radius, shape law (diamonds not circles), margin = 5% of short edge, 9x17 grid, identity system, Figma extraction workflow, the two canonical tick variants (13-pos bearing grid, 21-pos depth gauge) — the values within each variant are invariant.
- **MEDIUM (principles + presets):** shell chrome layout, tick variant selection per format, omission rules from the format adaptation matrix, spacing rhythm presets (`--tf-rhythm-*`), motion timing (80-150ms), format archetypes, title-system composition.
- **HIGH (examples, not rules):** content copy, placeholder media, client brand adaptations, novel compositions layering on existing primitives.

**The tick variant family is capped at two canonicals.** A third tick count requires a skill-level change with justification — do not invent per-format counts.

---

## Reference map

| Concern                                                   | File                                     | Tier   |
| --------------------------------------------------------- | ---------------------------------------- | ------ |
| **Format adaptation matrix (first-stop router)**          | `references/format-adaptation-matrix.md` | MEDIUM |
| **Web format patterns (scroll-driven shell)**             | `references/web-format-patterns.md`      | MEDIUM |
| **Mobile format patterns (responsive web + static 9:16)** | `references/mobile-format-patterns.md`   | MEDIUM |
| Cross-format shell (scaling rules)                        | `references/cross-format-shell.md`       | MEDIUM |
| Title system (heading icon, diagonal, baseline)           | `references/title-system.md`             | MEDIUM |
| Proposal / editorial patterns                             | `references/proposal-patterns.md`        | MEDIUM |
| HUD implementation (Figma parity + tick variants)         | `references/hud-frame-implementation.md` | LOW    |
| Primitive API surface                                     | `references/primitives-api.md`           | LOW    |
| Specimen recipes (content + layout)                       | `references/specimen-recipes.md`         | MEDIUM |
| Figma-to-code workflow                                    | `references/figma-to-code-playbook.md`   | LOW    |
| Figma node IDs                                            | `references/figma-codex-map.md`          | LOW    |
| Navigation grammar (conceptual)                           | `references/navigation-grammar.md`       | MEDIUM |
| Tokens (semantic)                                         | `references/tokens.md`                   | LOW    |
| Color theory + tiers                                      | `references/color-system.md`             | LOW    |
| Identity, logo, vectors                                   | `references/identity-system.md`          | LOW    |
| Typography                                                | `references/typography-system.md`        | LOW    |
| Spatial / grid / density                                  | `references/spatial-system.md`           | MEDIUM |
| Motion                                                    | `references/motion-system.md`            | LOW    |
| Voice / UX copy                                           | `references/voice-and-tone.md`           | MEDIUM |
| Presentations / slides (16:9 only)                        | `references/presentation-patterns.md`    | MEDIUM |
| Data visualization                                        | `references/data-visualization.md`       | MEDIUM |
| Particle icons                                            | `references/particle-icon-grammar.md`    | LOW    |
| Philosophy                                                | `references/brand-philosophy.md`         | HIGH   |

---

## Anti-patterns (never)

Purple gradients, rounded corners, system fonts, box shadows for depth, pure #000/#FFF, accent soup, circular indicators (use diamonds), green as nav or gold as provenance, background-fill-only active states, standalone L-corner brackets where the canonical design does not use them, HUD ticks at reduced opacity by default when solid guides are needed, using the HUD brandmark anchor where the title-system heading icon belongs.

## Always

CSS variables for values; sharp corners; gold for active navigation; monospace for data; diamonds not circles; `requestAnimationFrame` for animation (not `setInterval`); margin from the short edge; scale factor from `min(w,h)/1080`.
