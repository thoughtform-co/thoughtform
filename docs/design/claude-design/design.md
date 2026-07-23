# Thoughtform.co — Claude Design Brief

> Master context file for designing a **new landing-page section** in Claude Design.
> Everything here is extracted from the live production code on 2026-07-18 — it is
> self-contained; no repo access is needed. Detailed specs live in `references/`.
>
> **How to use:** create a Claude Design project, paste this file as the project brief /
> instructions, and add the four reference files as project knowledge. Design against a
> **1440×900 desktop artboard** first (all reference tables resolve that size), then check
> 1280×800, 1920×1080, and 390w mobile.

---

## What this site is

Thoughtform.co is a scroll-driven **instrument panel for navigating machine intelligence**: a dark
"void" page framed by fixed HUD chrome (corner brackets, left/right rails), where sections read as
calm editorial surfaces over precise, astrolabe-like instruments. Voice: precise, curious,
confident — a research station, not a carnival. Two typefaces carry two voices: **PT Mono** for the
instrument (labels, readouts, captions) and **PP Neue Montreal** for the editorial (titles, prose).

**Page journey (production order):**
`hero → corridor (thesis / navigate / encode / build — WebGL depth corridor) → services → about → continuum → practice → contact`

Existing surfaces for reference: **services** = transparent stage over a WebGL card-ring instrument
with a two-column masthead; **about** = deck-flip portrait stage; **continuum** = transparent stage,
brandmark + tool↔collaborator spectrum axis; **practice / contact** = classic opaque stations.
A new section slots into this journey as a "station."

## The five laws (absolute — everything else is guidance)

1. **Opaque void.** A full-bleed section paints `background: #0a0908` (`--void`), optionally with
   the starfield + faint corner radial washes (alpha ≤ 0.05). The page has a fixed gold gradient
   and a sticky video _behind_ sections — a transparent or wrapper-faded section leaks them.
   Reveals animate inner content only, never the section wrapper.
2. **Two fonts, no italics, ever.** PT Mono (instrument) + PP Neue Montreal (editorial).
   Emphasis = **upright gold text, weight 500** — or the gold-wash highlight
   (`rgba(202,165,84,0.16)` background) at caption level. Nothing slants.
3. **Gold discipline.** One accent: `#caa554` for wayfinding, active states, emphasis (~7% of the
   page). Dawn ink `#ebe3d6` via alpha ladders does all hierarchy (~90%). Atreides green `#3d4b33`
   is provenance-only (~3%). No other hues; no pure black/white.
4. **Hard geometry.** `border-radius: 0`. Corner brackets, 1px alpha-ladder borders, 45°-rotated
   **diamond** markers (never circles). Hover = `translateY(-2px)` + gold border. Motion is fast
   (80–150ms UI, ~880ms reveals), eased `cubic-bezier(0.16, 1, 0.3, 1)`, transform/opacity only,
   no springs — and **never motion behind readable copy**.
5. **One editorial band.** All section text sits on the shared frame: horizontal inset =
   `max(HUD content inset, (100vw − 1200px)/2)` — 145px @1440, 360px @1920 — and section titles
   cap at ≈**11.5svh**. Titles: PP Neue Montreal 400 UPPERCASE, `clamp(26px, 3vw, 44px)`,
   0.04em tracking, gold-glow text-shadow. Details + rationale: Reference 03.

## The frame you're designing inside (1440×900)

- Fixed HUD chrome: corner brackets in each corner; **rails** at x≈40.5px from each edge — 2px
  hairline `rgba(235,227,214,0.55)`, 13-tick ladder, gold journey diamond on the left, optional
  per-section "register" on the right. Full geometry + register recipe: Reference 02.
- Content column: **x 145 → 1295** (`--hud-content-inset` each side). Text on the editorial band.
- Sections are `min-height: 100vh`, flex-centered, padded `140px 0 220px` so titles read high.
- ≤1100px instruments degrade to static; **≤960px rails disappear** and layouts stack single-column
  (content inset `clamp(24px, 6vw, 40px)`); ≤640px phone tuning. Reduced-motion = static everything.

## Reference files

| File                                     | Contents                                                                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `references/01-tokens-and-typography.md` | Full token tables, type hierarchy, breakpoints, shape law, compositing law, do/don't                                                                  |
| `references/02-rails.md`                 | Left/right rail anatomy with exact geometry, register recipe, responsive gates, mock-drawing guide                                                    |
| `references/03-section-headers.md`       | The section-header recipe: title face, editorial band (H+V), two-column masthead, continuum grid variant, mobile behavior, the seven-pass lessons     |
| `references/04-diagram-system.md`        | The celestial diagram language: canvas law, primitive vocabulary, stroke/dash/opacity ladders, figure captions, two canonical recipes, connector band |

## Deliverable format (so the design is buildable)

- Desktop-first HTML/CSS mock (or Claude Design frames) using the **token names** from Reference 01
  (`--void`, `--dawn-XX`, `--gold-XX`) rather than raw hex where possible.
- Include the ≤960px stacked variant — that's the real mobile surface (no rails, static backdrop).
- Diagrams as plain SVG per Reference 04 §8 (`viewBox="-120 -120 240 240"`, gold + dawn only).
- Name the section's **station id**, its 1–2-line UPPERCASE title (mark the gold emphasis line),
  its intro paragraph (≤42ch column), and — if it has sub-items — up to 4 register row names
  (short, e.g. `NAVIGATE`) for the right rail.
- What the code side wires afterward (not your job to draw): the rail manifest entry, the register
  mount, scroll-reveal clocks, and any diagram slot.

## Provenance

Extracted from: `app/styles/variables.css`, `components/landing/v7/landing.css`,
`components/landing/home-v2/**` (services/continuum/home-v2 CSS), `lib/rail-manifest/entries.ts`,
`components/landing/v7/CelestialConnector/**`, ADR-006/007/008/029/031/044/048/049.
⚠️ Ignore the older `design/thoughtform_redesign/` docs for anything font- or token-exact
(they predate the v7 landing: PP Mondwest / IBM Plex are **not** the live landing fonts).
