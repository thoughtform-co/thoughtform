# Reference 01 — Tokens, Typography, Shape Law, Compositing

> The base design system of the LIVE thoughtform.co landing. Source of truth:
> `app/styles/variables.css` + `components/landing/v7/landing.css` (+ ADR-006/007/008,
> thoughtform-design skill). Extracted 2026-07-18.
>
> ⚠️ **Stale-doc warning:** older briefs (including `design/thoughtform_redesign/BRAND.md`) list
> PP Mondwest + IBM Plex as the fonts. Those belong to retired prototypes / the admin shell.
> **The live landing uses exactly two families: PT Mono and PP Neue Montreal.** Use this file.

---

## 1. Fonts

| Family               | Stack                                       | Weights            | Role                                                                                                                   |
| -------------------- | ------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **PT Mono**          | `"PT Mono", ui-monospace, Menlo, monospace` | 400, 700           | Hero title, HUD labels, kickers/eyebrows, rail text, data readouts, CTAs, figure captions — all the "instrument" voice |
| **PP Neue Montreal** | `"PP Neue Montreal", system-ui, sans-serif` | 300, 400, 500, 700 | Section titles, body, lede/support copy — the "editorial" voice                                                        |

There is **no italic face, on purpose**. Never slant anything (see §4).

## 2. Color tokens

| Token                                 | Value                  | Role                                                                   |
| ------------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `--void`                              | `#0a0908`              | THE background. Every opaque section shield is this                    |
| `--void-deep`                         | `#050504`              | Deepest layers (rare)                                                  |
| `--dawn`                              | `#ebe3d6`              | Primary ink (headings, body base)                                      |
| `--dawn-90…-04`                       | `rgba(235,227,214, α)` | α ∈ .9 .8 .7 .6 .5 .4 .35 .3 .25 .2 .15 .1 .08 .04                     |
| `--gold`                              | `#caa554`              | THE accent: wayfinding, active states, emphasis, CTA                   |
| `--gold-70…-05`                       | `rgba(202,165,84, α)`  | α ∈ .7 .6 .5 .4 .3 .2 .15 .1 .08 .05                                   |
| `--atreides-mid` / `--atreides-light` | `#3d4b33` / `#5b7a4e`  | Provenance green ("you made this") — ~3% of the page, never navigation |
| `--alert`                             | `#ff6b35`              | Errors only                                                            |

Useful literals: gold hover-bright `#e0bd6a`; text-on-gold `#110f09`; ghost-button hover fill
`rgba(202,165,84,0.08)`; title glow `rgba(202,165,84,0.18)`; caption highlight `rgba(202,165,84,0.16)`.

**Color law — three tiers that never swap jobs:** Dawn/ink ≈ 90% (structure + text), Gold ≈ 7%
(wayfinding + active + emphasis), Atreides green ≈ 3% (provenance marks only). Hierarchy comes
from the **alpha ladders**, not new hues. Never pure `#000`/`#fff`, never purple, never a third accent.

## 3. Type hierarchy (live landing)

| Role                                       | Font / weight        | Size                                       | LH   | Tracking | Case    | Color                                        |
| ------------------------------------------ | -------------------- | ------------------------------------------ | ---- | -------- | ------- | -------------------------------------------- |
| Hero title                                 | PT Mono 400          | `clamp(2.2rem, 1.4rem + 2.6vw, 3.75rem)`   | 1.06 | 0.005em  | UPPER   | dawn                                         |
| Hero description                           | PT Mono 400          | `clamp(0.95rem, 0.78rem + 0.7vw, 1.33rem)` | 1.5  | 0.01em   | UPPER   | dawn tiers                                   |
| **Section title** (the one big-title face) | PP Neue Montreal 400 | `clamp(26px, 3vw, 44px)`                   | 1.1  | 0.04em   | UPPER   | dawn + glow `0 0 22px rgba(202,165,84,0.18)` |
| Section title emphasis                     | PPNM **500**         | inherit                                    | —    | —        | upright | **gold**                                     |
| Section support/lede                       | PPNM 400             | `clamp(17px, 1.45vw, 21px)`                | 1.5  | 0.005em  | none    | `rgba(235,227,214,0.82)`                     |
| Secondary lede (continuum)                 | PPNM 400             | `clamp(14px, 1.05vw, 17px)`                | 1.55 | −0.005em | none    | dawn-70                                      |
| Cartouche kicker                           | PT Mono 500          | 11px                                       | —    | 0.18em   | UPPER   | `rgba(202,165,84,0.78)`                      |
| Eyebrow / station index                    | PT Mono 400          | 10px                                       | —    | 0.15em   | UPPER   | gold                                         |
| HUD micro-labels                           | PT Mono 400          | `clamp(10px, 0.85vw, 12px)`                | —    | 0.1em    | UPPER   | dawn-50 / gold tiers                         |
| CTA button                                 | PT Mono              | `clamp(0.7rem, 0.62rem + 0.2vw, 0.82rem)`  | —    | 0.08em   | UPPER   | gold / on-gold `#110f09`                     |

Tracking tokens: `--track-tight 0.02em · normal 0.04em · wide 0.08em · wider 0.1em · widest 0.15em`.

## 4. The no-italics rule (hard rule)

- Emphasis inside titles/body = **upright gold text, PPNM weight 500**. Never `font-style: italic`.
- Caption-level emphasis (corridor captions) = the **gold-wash marker**: gold text on
  `rgba(202,165,84,0.16)` background, sharp corners, `padding: 0.14em 0.16em`,
  `box-decoration-break: clone`. A highlighter, not a slant.
- Terminal/CRT accents: gold with layered glow
  `text-shadow: 0 0 2px rgba(202,165,84,0.8), 0 0 4px rgba(202,165,84,0.4), 0 0 8px rgba(202,165,84,0.2)`.

## 5. Breakpoints

Canonical ladder: **1100 / 960 / 700 / 640** px (max-width), plus fine tuning at 1280/1440/1920.

| Break         | What changes                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≤1100px       | WebGL corridor/instruments degrade to static fallbacks; rail diamond + registers hide; grids narrow                                               |
| ≤960px        | **The big one**: rails removed entirely, two-column layouts stack, content inset collapses to `clamp(24px, 6vw, 40px)`, station side padding 32px |
| ≤759px height | Same static-fallback trigger as ≤1100px width (short laptops)                                                                                     |
| ≤700/720px    | Tri-column diagrams/case grids go single column                                                                                                   |
| ≤640px        | Phone: hero repadded `104px 28px 96px`, titles `clamp(32px, 9vw, 48px)`                                                                           |

`prefers-reduced-motion` ⇒ all animation clamped to ~0ms + the same static fallbacks as ≤1100px.

## 6. Shape law / HUD grammar

- **Corners: hard. `border-radius: 0` everywhere.** `50%` radius exists only for particle dots.
- Markers/waypoints = **45°-rotated square diamonds** (e.g. 5px gold), never circles or dots-with-radius.
- **Corner brackets**: L-shaped strokes at panel corners, usually `--gold-30`; arm lengths 10/16/20/24/40px, thickness 1–3px (preset "card" = 16px arms × 2px, "hud" = 40px × 2px).
- Borders: `1px solid` at `--dawn-08` (subtle) / `--dawn-15` (medium) / `--dawn-30` (visible) / `--gold-30` (accent). **Dashed = subtle separators only.**
- Chamfered "ticket-stub" cards: fill via `::before` + `clip-path` polygon, stroke via an inline SVG `<polygon>` (`stroke: var(--gold-30)`, `vector-effect: non-scaling-stroke`) — never clip-path a bordered box (it eats the border).
- Grid-item hover: `translateY(-2px)` + `border-color: var(--gold-30)` + `box-shadow: 0 8px 24px rgba(0,0,0,0.4)`.
- Focus overlays (modals/detail views): fixed backdrop `rgba(10,9,8,0.3)` → content with **dashed border** `rgba(235,227,214,0.3)`, blur 12px, shadow `0 0 0 1px rgba(235,227,214,0.05), 0 0 60px rgba(202,165,84,0.1), 0 30px 80px rgba(0,0,0,0.6)`, label badge on top (PT Mono 10px, 0.12em, bg `rgba(10,9,8,0.95)`), scale 0.8→1 in 0.3s ease-out on the content only.

## 7. Compositing law for a NEW section (ADR-008 — the one that bites)

The page is a layered composite: a **fixed gold-radial "gateway"** (z0) and a **sticky hero video**
(z1) sit behind everything; sections are opaque shields stacked above (z2); HUD chrome floats at z50.

1. A new full-bleed section **must paint `background: var(--void)`** (opaque) — plus optionally the
   `/v7-stars.svg` starfield and its own faint corner radial washes (gold + green, alpha 0.025–0.05).
   Transparency is a documented exception (services/about/continuum overlay the live WebGL canvas)
   and needs explicit justification.
2. Full-bleed = `width: 100vw; margin-inline: calc(50% − 50vw)` then **re-pad with
   `padding-inline: var(--hud-content-inset)`** (129px @1280 / 145px @1440 / 192px @1920).
3. **Never animate the section wrapper's opacity/transform/scale/filter** — fading or scaling the
   shield reveals the gold gateway underneath (edge strips at `scale(0.97)`). Reveals ride INNER
   content only.
4. Reveal convention: inner elements start `opacity: 0`, come in with opacity + `translateY(~8–18px)`
   over ~880ms `cubic-bezier(0.16, 1, 0.3, 1)` when the section enters the viewport.
5. UI-state motion: 80–150ms, same ease, `transform`/`opacity` only, **no springs/bounce**.
6. **No rotation/motion behind readable copy** (motion-sickness rule): backdrops behind editorial
   text are static; anything rotating dies before copy arrives. Ship a static reduced-motion state.
7. Sections are `min-height: 100vh`, flex column, `justify-content: center`, asymmetric padding
   `140px 0 220px` so titles read high.

## 8. Do / Don't (quick sheet for a native-looking section)

**DO** — void background + z2 shield · PPNM uppercase titles with the exact clamp + gold-glow ·
PT Mono uppercase micro-labels with wide tracking · upright gold emphasis (weight 500) ·
hard corners, corner brackets, diamond markers · 1px alpha-ladder borders ·
`translateY(-2px)` + gold-border hover · text aligned to the shared editorial band (Reference 03) ·
reveals on inner content with a static fallback · gold as the only wayfinding accent.

**DON'T** — italics (ever) · transparent full-bleed wrappers · wrapper-level fade/scale reveals ·
rounded corners, circular markers, decorative box-shadows · purple, pure black/white, third accents ·
motion behind readable copy · new fonts · hardcoded colors instead of tokens.
