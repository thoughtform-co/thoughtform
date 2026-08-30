---
name: thoughtform-design
description: The canonical Thoughtform design and brand system for every Thoughtform product (Thoughtform.co, Astrolabe, Atlas, Sigil). Navigation metaphor, HUD grammar, tokens, colour tiers, typography, motion, voice, the corner law, semantic anchors, format archetypes (slides, landing pages, proposals, scroll-driven sites), Figma extraction, data viz, particles, and the compiled reference corpus. Use when building or reviewing any Thoughtform UI, CSS, layout, component, deck, chart, diagram, screenshot, Figma file, palette or visual output.
---

# Thoughtform Design System

Everything Thoughtform makes is an **instrument for navigating intelligence**. Interfaces
are viewports into latent space: **precision, retrofuturism, tactical restraint** — research
station, not carnival.

This skill is the **judgment layer**: what the laws are and why. Its companion is the
**design MCP** (`/api/design/mcp`, this repo), the **retrieval layer**: live token values,
exact law text, and 53 distilled design references with two vector spaces over them. The
rule that keeps them apart is in §Querying the corpus, and it is load-bearing — never put
judgment behind a tool call, and never put a searchable corpus in a skill file.

Three layers. Start at Layer 1 for any Thoughtform output; descend only when the task
demands the specificity.

> **Canonical location.** This tree, in the thoughtform.co repo, is THE skill — it sits
> beside the ADRs, the tokens and the CSS it governs, so it can be corrected in the same
> commit as the code. Copies at `~/.cursor/skills/`, in the Claude plugin cache and in the
> `.thoughtform-brandworld` repo are **pointer stubs**; if one of them disagrees with this
> file, this file is right.

---

## Layer 1 — Universal foundations (all formats)

Format-agnostic: slides, landing pages, A4 proposals, app shells, social posts.

### Metaphor

Layout = orientation and waypoints. Colour = signal strength (gold = "you are here").
Type = readouts and bearings. Motion = mechanical feedback. Copy = precise and guiding.

### Identity

Brandmark (gateway + compass), wordmark (vector lockup, code-generated SVG paths), vectors
as north stars. Full rules: `references/identity-system.md`.

### The corner law (ADR-065) — LOW freedom

The shape law's specific half, and it is one of the two most-broken rules in the system.
Canonical text: [ADR-065](../../../sentinel/decisions/065-corner-law.md), summarised in
[DESIGN.md](../../../DESIGN.md#the-corner-law-adr-065).

- **Chamfer** = a machined housing · **Notch** (one corner) = oriented or connected ·
  **Bracket** (additive L) = framed but not a device.
- **One grammar per object.** An object that is chamfered is not also bracketed.
- **The diagonal is TR + BL.** TL+BR only as the mirrored back of a flipped object, or
  inside the one enumerated housing that overrides it (the casefile console).
- Depth ladder: seed `16px` · plate `26px` · chrome `0`.
- **The children of a chamfered box are square** — variation is hierarchy, not a second
  decorative style. Two exceptions, both narrow: a uniform SET of device cards may carry a
  single notch **on the lawful diagonal** (same corner on every card, one nesting level);
  and a set SEATED inside a housing takes **that housing's** diagonal, not the sitewide one.
  A lone notched child stays banned.
- **Asymmetry is earned.** A single notch points at what the object connects to, or marks
  the edge the mechanism does not use. Twenty identical cards in a grid are neither oriented
  nor connected, so they do not qualify.

⚠ Pin a corner from **both ends** in any guard: asserting "the notch is not bottom-left"
verifies it is BL rather than that it is on the right corner. That exact one-sided
assertion passed while the corner was wrong.

### Shape law (the rest)

Zero border-radius, anywhere. Diamonds (45° squares), never circles. Hairline strokes. No
drop shadows, no glows for depth — depth is surface progression, not blur.

### Colour — three tiers, no overlap

**Dawn/Ink** (~90%) = environment and structure. **Gold** (~7%) = wayfinding and active
navigation. **Atreides green** (~3%) = provenance, "you made this". **Gold and green never
swap jobs.** `references/color-system.md`.

⚠ **Never hardcode a value — call `design_tokens`.** The live source is
`app/styles/variables.css`; `DESIGN.md`'s frontmatter is the brand documentation, and the
two currently disagree (the void ladder is shifted one rung, and `--dawn` differs by a unit
in the red channel). The MCP reports that as `drift[]` rather than picking a winner. Until
the owner rules, **the CSS is what renders** — write tokens, not literals, and the question
does not arise.

⚠ **Gold is split by ROLE across the theme flip.** Hue is the brand, lightness is the role:
`--gold` (a MARK) → `--gold-line` (3:1, line work) → `--gold-ink` (4.5:1, TEXT). A saturated
gold as small text measures ~1.7:1 on parchment and may not be used there. Never re-darken
`--gold` itself; that breaks every ink-on-gold fill.

⚠ **An alpha inverts its own meaning across the flip.** `rgba(ink, .38)` recedes toward
black in dark and toward parchment in light — same number, "quiet" becomes "invisible".
Re-derive per theme; never inherit.

### Typography — two families, by ROLE

```css
--font-pt-mono: "PT Mono", monospace; /* chrome: headings, HUD labels, readouts */
--font-pp-neue-montreal: "PP Neue Montreal", sans-serif; /* prose: body, descriptions, long-form */
```

PT Mono owns instrument chrome; PP Neue Montreal owns titles and prose. Sizes divisible by
5 at reference scale. PP Mondwest is retired; the wordmark is inline SVG, not a font.
`references/typography-system.md`.

⚠ **Anything whose content is a sentence must DECLARE its family explicitly.** Inheriting is
how a third face gets in: `--font-mono` is IBM Plex Mono, not the casefile's PT Mono, and
`--font-sans` is declared nowhere in the app at all — both have shipped as "the font feels
different" bugs. And guard per **role**, not per family: a sentence set in mono passes any
"no third family" count.

**No italics, ever.** Emphasis is upright gold, or a gold-wash marker.

### Motion

No spring, no bounce. **80–150ms** for UI state changes. Easing
`cubic-bezier(0.16, 1, 0.3, 1)`. `requestAnimationFrame`, never `setInterval`. No
wall-clock motion on scroll surfaces — scroll clocks, click-driven slides and bounded
springs only. `references/motion-system.md`.

### Voice

Precise, not cold. Technical but accessible. Instrument language, not marketing.
`references/voice-and-tone.md`.

### Layout grid

1. **Margin** = 5% of the shortest canvas edge, all four sides.
2. **Content grid** = the margin-inset rectangle divided **9 rows × 17 columns**, gap 0.
3. **Scale factor** = `min(canvasW, canvasH) / 1080`. Every proportional value derives from it.

An A4 portrait, a 16:9 slide and a 1:1 square share the same margin logic, subdivision and
scale factor. The grid is the skeleton; placement is archetype-specific (Layer 3).

Tokens: `references/tokens.md`. Philosophy: `references/brand-philosophy.md`.

### Semantic anchors — what the system MEANS

Six conceptual anchors sit under the visual rules and are what lets the system interpret a
reference rather than merely permit or forbid it: **NAVIGATION · THRESHOLD · INSTRUMENT ·
LIVING GEOMETRY · GRADIENT · SIGNAL**. Use them when judging whether something unfamiliar
belongs, when translating a reference from another medium, or when a brief has no visual
precedent. `references/semantic-anchors.md`, method in `references/semantic-methodology.md`.

---

## Layer 2 — Scalable shell grammar (navigation chrome)

The shell wraps content in instrument-grade chrome. Elements scale proportionally; they are
never hardcoded per viewport.

**For exact implementation, load `references/hud-frame-implementation.md`** (Figma-derived
coordinates for the 1920×1080 reference specimen). For design guidance, read this first.

### Shell anatomy

| Element                 | Role                                 | Scales with                                      |
| ----------------------- | ------------------------------------ | ------------------------------------------------ |
| **Left + right rails**  | Vertical guide line + tick marks     | Rail height = content-box height; ticks are %    |
| **Top-left anchor**     | Client logo lockup OR grid L-bracket | Fixed proportional size                          |
| **Top-right anchor**    | Chapter/section label + 30px rule    | Fixed proportional size                          |
| **Bottom-left anchor**  | Brandmark (40px at ref) + terminator | `--tf-scale` on fixed canvases; `clamp()` on web |
| **Bottom-right anchor** | Pagination number + 30px rule        | Fixed proportional size                          |
| **Compass waypoint**    | Diamond + 50px line on left rail     | Sits at the 8.33% tick slot                      |

### Rail scaling

A **13-position equal-spacing tick grid** across the full rail height; positions are
percentages (`100/12 × n`), so they are format-agnostic. Left rail 12 ticks (skips index 1
for the compass slot), right rail 13. Majors at indices 4 and 8 (33.33% / 66.67%). Minor
ticks 7px, major 21px at reference scale. Formulas: `references/cross-format-shell.md`.

⚠ **Scroll surfaces use a 21-position DEPTH GAUGE instead** — a different variant, not a
retune. `references/web-format-patterns.md` owns its canonical values.

### Shell variants by format

| Format                     | Rails             | Ticks              | Chrome anchors        | Notes                              |
| -------------------------- | ----------------- | ------------------ | --------------------- | ---------------------------------- |
| 16:9 slide (content)       | Both              | Full 13-grid       | All four              | Standard deck shell                |
| 16:9 slide (title/chapter) | None              | None               | Corners only          | 4 L-brackets + mark + chapter      |
| 9:16 story                 | Both (shorter)    | Full 13-grid       | All four              | Rails on short dimension           |
| 1:1 square                 | Both              | Full 13-grid       | All four              | Compact but complete               |
| A4 / XL portrait           | Both (tall)       | Full 13-grid       | All four              | Proposal / one-pager               |
| Web / landing              | Optional          | Optional           | Subset                | Rails may hide when narrow         |
| Web — scroll-driven >960   | Both              | 21-pos depth gauge | BL mark only          | `references/web-hud-adaptation.md` |
| Web — compact ≤960         | None              | None               | None                  | Padding-only; rails hidden         |
| App shell                  | Both (responsive) | Full via `clamp()` | Subset, no pagination | `HudFrame`                         |

### Brandmark vs title-system icon

The **HUD brandmark anchor** (bottom-left, 40px at reference) is the gateway+compass glyph
in the navigation shell on every format. The **title-system heading icon** (crosshair +
diagonal, ~270px) appears only on chapter/title slides, anchored at ~85% canvas height.
**Two distinct elements; never substitute one for the other.** `references/title-system.md`.

**Pure-code boundary:** all chrome is generated from code primitives. Only textured
atmosphere may be a manual asset.

### Navigation grammar

`references/navigation-grammar.md` — the **12 primitives**: Viewport Frame · Telemetry Rails
· Compass Anchor · Waypoints · Heading Indicator · Data Readouts · Course Lines · Depth
Layers · Signal Strength · Bearing Labels · Particle Glyphs · Nav Spine. Each carries a
per-product intensity dial. This is also the vocabulary the reference corpus maps every
pattern onto, so it is the shared language between this skill and the MCP.

`references/celestial-diagram-grammar.md` — the parametric diagram system.

---

## Layer 3 — Format archetypes

Each inherits Layers 1 and 2, then adds composition rules. They differ only in content
placement, density and which shell elements show.

| Archetype                   | Reference                                | Tier   |
| --------------------------- | ---------------------------------------- | ------ |
| Title / chapter slides      | `references/title-system.md`             | MEDIUM |
| Content slides              | `references/presentation-patterns.md`    | MEDIUM |
| Portrait proposals (A4, XL) | `references/proposal-patterns.md`        | MEDIUM |
| Web / landing               | `references/web-format-patterns.md`      | MEDIUM |
| Scroll-driven website       | `references/web-hud-adaptation.md`       | MEDIUM |
| Mobile                      | `references/mobile-format-patterns.md`   | MEDIUM |
| **Cards, panels, plates**   | **`references/ui-composition.md`**       | MEDIUM |
| App shells                  | `references/products/*.md`               | MEDIUM |
| Format selection            | `references/format-adaptation-matrix.md` | MEDIUM |

---

## Querying the corpus — the two-layer rule

**Query, don't ask.** Before improvising a treatment or asking Vince to upload screenshots,
search the compiled reference pool. 53 references from his own library are already read and
written up, and the surveyor keeps adding.

Two doors onto the same corpus:

- **`/api/design/mcp`** (this repo, deployed with the site) — `design_refs` (semantic search,
  filterable by the 17 style axes), `design_visual` (**similarity over the PIXELS**, which
  finds matches nobody wrote down), `design_read`, `design_facets`, plus `design_tokens` and
  `design_law` for live values and exact law text.
- **`substrate-vault`** (the Astrolabe's local MCP) — `vault_search { rack: "design" }` over
  the same notes, plus the rest of the vault.

**The rule that divides them from this file:** _embeddings find what's near, the LLM explains
why — never make the LLM guess what embeddings could look up, and never make a tool call to
learn something this skill already states._ Reach for the MCP for **values, exact wording and
references**. Reach for this skill for **judgment**.

**What the pool is for.** It holds _distillations_ — what a reference teaches, which grammar
element a pattern maps onto, which of its moves fight the system. Retrieving a reference is
not permission to reproduce it: **colours arrive as roles projected onto tokens (gold on
void), never as hex to lift.** A design traceable back to one reference has misused the pool.
When the pixels genuinely are the answer, `design_read` carries the `original` path.

**The promotion path.** A pattern found through the corpus and used two or three times has
earned a line in this skill. That is how retrieval hardens into doctrine, and it is the only
sanctioned way this file grows.

---

## Implementation (Astrolabe runtime)

1. **Brand atoms** (`components/brand/`) — `Brandmark`, `Wordmark`, `Diamond`, `StarGlitch`.
2. **HUD primitives** (`components/hud/`) — `HudGuideLine`, `HudTick`, `HudRail`, `HudRule`,
   `HudInnerGrid`, `HudUnionCorner`, `HudCornerBracket`.
3. **HUD anchors** — `HudLogoSlot`, `HudTopLeftIcon`, `HudChapterAnchor`,
   `HudBrandmarkAnchor`, `HudPaginationAnchor`.
4. **Responsive composition** — `HudFrame.tsx`.
5. **Pixel-accurate specimen** — `SpecimenFrame.tsx`, for 1920×1080 Figma parity only.

**Hard rules:** never inline rail markup, tick math or anchor positioning in a page
component. Never guess a glyph shape — `exportAsync` from Figma first. Never copy-paste
variants; extract shared helpers.

API: `references/primitives-api.md`. Figma nodes: `references/figma-codex-map.md`. Porting:
`references/figma-to-code-playbook.md`.

---

## Workflows

| Intent                       | Steps                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| **Any new surface**          | `design_refs` for precedent → this skill for the law → compose → eval (below)                  |
| **Card / panel / plate**     | `references/ui-composition.md` for the archetype, then the corner law                          |
| **New component**            | Map to grammar primitives; BEM + tokens; zero radius; motion from `motion-system.md`           |
| **Screenshot / Figma**       | Decompose, map to tokens + grammar, check contrast, propose                                    |
| **Slide / deck**             | Archetype from Layer 3, shell from Layer 2, content per `presentation-patterns.md`             |
| **Proposal (A4 / portrait)** | `references/proposal-patterns.md` — same shell, vertical flow                                  |
| **Scroll-driven site**       | `references/web-hud-adaptation.md` — fluid `clamp()` tokens, brandmark handoff                 |
| **Data viz**                 | 1px hairlines, diamond markers, semantic gold/green/alert. `references/data-visualization.md`  |
| **Particles / icons**        | `references/particle-icon-grammar.md`                                                          |
| **Diagram / connector**      | `references/celestial-diagram-grammar.md`                                                      |
| **Interpreting a reference** | `references/semantic-methodology.md` — anchor scores, translation distance, preserve/transform |
| **Judging a candidate**      | `eval/rubric.md` — mechanical checks first, then the vision judge                              |

---

## Product appendices

Prefer **live CSS and contracts in the repo you are editing** over prose here.

| Product        | Appendix                                |
| -------------- | --------------------------------------- |
| Thoughtform.co | `references/products/thoughtform-co.md` |
| Astrolabe      | `references/products/astrolabe.md`      |
| Atlas          | `references/products/atlas.md`          |
| Sigil          | `references/products/sigil.md`          |

### Thoughtform.co specifics

- Dev server on **port 3003** (`autoPort` may take another — read the running server, never
  assume). Always quote a full clickable URL, origin and all.
- The v7 landing uses the **21-position depth gauge**, not the deck's 13-position bearing grid.
- Hero titles are PT Mono Bold uppercase; the wordmark is inline SVG.
- The page is a layered composite: fixed gateway glow (z:0), sticky hero (z:1), opaque shield
  sections (z:2) inside `.stations` (z:10). **Full-bleed elements at z≥2 must declare
  `background: var(--void)`.**
- Corridor invariants before editing `components/landing/home-v2/`:
  `references/depth-corridor-grammar.md`.
- CSS and choreography sources of truth: `components/landing/v7/landing.css`,
  `lib/brandmark/journey.ts` (the ADR-013 continuous transform — **not** the deleted
  `useSigilChoreography.ts`), `components/landing/v7/BrandmarkActor.tsx`,
  `public/prototypes/v7/landing-v7-motion.html`.
- Both themes ship together (ADR-058) — a new element is styled AND verified in dark and
  light, compositing alphas before measuring contrast.

---

## Freedom tiers

- **LOW (exact, non-negotiable):** colour tokens, the two fonts, zero border-radius, the
  corner law, diamonds not circles, margin = 5% of short edge, the 9×17 grid, the identity
  system, the Figma extraction workflow, the two tick variants.
- **MEDIUM (principles + presets):** shell chrome layout, tick percentages, spacing rhythm,
  motion timing, format archetypes, title-system composition, card archetypes.
- **HIGH (examples, not rules):** copy, placeholder media, client adaptations, novel
  compositions layered on existing primitives.

---

## Anti-patterns (never)

Purple or blue gradients · rounded corners · system fonts · box shadows for depth · pure
`#000`/`#FFF` · accent soup · circular indicators (use diamonds) · green as navigation or
gold as provenance · background-fill-only active states · italics · a second full-width
gold CTA beside an existing one · cool-tinted grounds · CRT scanlines as decoration ·
standalone L-brackets where the canonical design has none · HUD ticks at reduced opacity
when solid guides are wanted · the HUD brandmark where the title-system icon belongs.

## Always

CSS variables, never literals · sharp corners · gold for active navigation · monospace for
data · diamonds not circles · `requestAnimationFrame` · margin from the short edge · scale
factor from `min(w,h)/1080` · both themes verified.

---

## Reference map

| Concern                            | File                                      | Tier   |
| ---------------------------------- | ----------------------------------------- | ------ |
| **Card / panel composition**       | `references/ui-composition.md`            | MEDIUM |
| **Semantic anchors**               | `references/semantic-anchors.md`          | LOW    |
| **Semantic method (translation)**  | `references/semantic-methodology.md`      | MEDIUM |
| Cross-format shell (fixed canvas)  | `references/cross-format-shell.md`        | MEDIUM |
| Web HUD adaptation (scroll-driven) | `references/web-hud-adaptation.md`        | MEDIUM |
| Web format patterns                | `references/web-format-patterns.md`       | MEDIUM |
| Mobile format patterns             | `references/mobile-format-patterns.md`    | MEDIUM |
| Format adaptation matrix           | `references/format-adaptation-matrix.md`  | MEDIUM |
| Title system                       | `references/title-system.md`              | MEDIUM |
| Proposal / editorial patterns      | `references/proposal-patterns.md`         | MEDIUM |
| HUD implementation (Figma parity)  | `references/hud-frame-implementation.md`  | LOW    |
| Primitive API surface              | `references/primitives-api.md`            | LOW    |
| Specimen recipes                   | `references/specimen-recipes.md`          | MEDIUM |
| Figma-to-code workflow             | `references/figma-to-code-playbook.md`    | LOW    |
| Figma node IDs                     | `references/figma-codex-map.md`           | LOW    |
| Navigation grammar (12 primitives) | `references/navigation-grammar.md`        | MEDIUM |
| Navigation tree / grid             | `references/navigation-tree-grid.md`      | MEDIUM |
| Tokens (semantic)                  | `references/tokens.md`                    | LOW    |
| Colour theory + tiers              | `references/color-system.md`              | LOW    |
| Identity, logo, vectors            | `references/identity-system.md`           | LOW    |
| Typography                         | `references/typography-system.md`         | LOW    |
| Spatial / grid / density           | `references/spatial-system.md`            | MEDIUM |
| Motion                             | `references/motion-system.md`             | LOW    |
| Voice / UX copy                    | `references/voice-and-tone.md`            | MEDIUM |
| Components                         | `references/components.md`                | MEDIUM |
| Presentations / slides             | `references/presentation-patterns.md`     | MEDIUM |
| Data visualization                 | `references/data-visualization.md`        | MEDIUM |
| Particle icons                     | `references/particle-icon-grammar.md`     | LOW    |
| Celestial diagram grammar          | `references/celestial-diagram-grammar.md` | MEDIUM |
| Depth corridor (home-v2)           | `references/depth-corridor-grammar.md`    | LOW    |
| Promoted inspiration extractions   | `references/inspiration-extractions.md`   | HIGH   |
| Philosophy                         | `references/brand-philosophy.md`          | HIGH   |
| **Design eval rubric**             | `eval/rubric.md`                          | LOW    |
