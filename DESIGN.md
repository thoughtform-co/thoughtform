---
name: Thoughtform
description: Instrument-grade interfaces for navigating intelligence.
colors:
  void: "#050403"
  surface-0: "#0A0908"
  surface-1: "#0F0E0C"
  dawn: "#ECE3D6"
  dawn-70: "rgba(236,227,214,0.7)"
  dawn-50: "rgba(236,227,214,0.5)"
  dawn-30: "rgba(236,227,214,0.3)"
  dawn-15: "rgba(236,227,214,0.15)"
  dawn-08: "rgba(236,227,214,0.08)"
  dawn-04: "rgba(236,227,214,0.04)"
  gold: "#CAA554"
  gold-30: "rgba(202,165,84,0.3)"
  gold-15: "rgba(202,165,84,0.15)"
  gold-05: "rgba(202,165,84,0.05)"
  atreides-mid: "#3D4B33"
  atreides-light: "#5B7A4E"
  atreides-30: "rgba(61,75,51,0.3)"
  atreides-15: "rgba(61,75,51,0.15)"
typography:
  heading:
    fontFamily: "PT Mono"
    fontWeight: 700
    fontSize: "clamp(28px, 3.6vw, 52px)"
    letterSpacing: "-0.02em"
    lineHeight: 1.08
  body:
    fontFamily: "PP Neue Montreal"
    fontSize: "1rem"
    lineHeight: 1.55
    letterSpacing: "0"
  data:
    fontFamily: "PT Mono"
    fontSize: "0.625rem"
    letterSpacing: "0.15em"
    lineHeight: 1.35
  eyebrow:
    fontFamily: "PT Mono"
    fontSize: "0.5625rem"
    letterSpacing: "0.15em"
    lineHeight: 1.2
rounded:
  all: 0px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  2xl: 72px
  3xl: 120px
components:
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.gold}"
    rounded: "{rounded.all}"
    padding: "12px 24px"
  button-ghost-hover:
    backgroundColor: "{colors.gold-05}"
    textColor: "{colors.gold}"
  button-solid:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.void}"
    rounded: "{rounded.all}"
    padding: "12px 24px"
  button-solid-hover:
    backgroundColor: "{colors.dawn}"
    textColor: "{colors.void}"
  card:
    backgroundColor: "rgba(10,9,8,0.55)"
    textColor: "{colors.dawn}"
    rounded: "{rounded.all}"
    padding: "clamp(32px, 3vw, 44px) clamp(28px, 2.6vw, 38px)"
  card-hover:
    backgroundColor: "rgba(10,9,8,0.85)"
  hud-corner:
    textColor: "{colors.dawn-30}"
    size: "clamp(28px, 4.17vmin, 45px)"
  hud-rail:
    textColor: "{colors.gold}"
    width: "clamp(48px, 4.27vw, 82px)"
---

## Overview

Precision, retrofuturism, tactical restraint — research station, not carnival.
Meaning has geometry; interfaces are navigable meaning-space.

The Thoughtform design system produces instrument-grade interfaces across
slides, proposals, scroll-driven websites, and app shells. Every surface
shares the same token foundation and HUD grammar; they differ only in which
shell elements are present and how content is placed within the grid.

## Colors

Three-tier palette with strict role separation:

- **Dawn/Ink** (~90%): environment, structure, text, borders. The void-to-dawn
  spectrum provides all the tonal range the UI needs.
- **Gold** (~7%): wayfinding, active navigation, signal. Gold marks "you are
  here" — nav highlights, active states, diamonds, bearing labels.
- **Atreides green** (~3%): provenance. "You made this." Used only for
  authorship markers and generation indicators.

Gold and green never swap roles. No additional accent colors.

## Typography

- **PT Mono** (Bold, uppercase, tight tracking): headings, HUD labels, section
  eyebrows, data readouts, navigation elements.
- **PP Neue Montreal** (Regular/Medium): body text, descriptions, long-form
  content, card copy.
- No display font in running UI. The brand wordmark is inline SVG, not a
  font dependency.

## Layout

Zero border-radius everywhere — this is shape law. Diamonds (45-degree rotated
squares) replace all circles. Corner brackets and chamfers provide framing.

### The corner law (ADR-065)

Three grammars, each answering a different question, and one rule each:

- **Chamfer** — subtractive, the silhouette follows the cut. Says _a machined
  housing you are looking into_. Consoles, plates, cards.
- **Notch** — ONE corner, asymmetric. Says _this object is oriented, or it
  plugs in_. A card in a set; anything connected.
- **Bracket** — additive L, the box stays rectangular. Says _framed and
  observed, but not itself a device_. HUD corners, portraits.

1. **One grammar per object** — never chamfer and bracket the same box.
2. **The diagonal is TOP-RIGHT + BOTTOM-LEFT.** TL+BR is legal only as the
   mirrored back of a physically flipped object.
3. **Depth is a ladder, by role:** seed `16px` (collapsed/small) · plate
   `26px` (a card or a console) · chrome `0` (tabs, rows, chips, tiles).
   Responsive expressions of the plate rung are fine —
   `clamp(14px, 2.6cqw, 22px)` is one.
4. **The children of a chamfered box are square.** Once the housing is
   machined, what sits inside it is flat stock. This is what keeps a surface
   from reading as a sheet of identical stickers: the variation is hierarchy,
   not a second decorative style.
5. **Asymmetry is earned.** A single notch appears only where the corner does
   work — it points at what the object connects to, or it marks the edge the
   mechanism does not use. Otherwise: the symmetric pair, or square.

Full record, including the inventory that produced it:
[ADR-065](sentinel/decisions/065-corner-law.md).

The spatial system uses an 8px grid. On fixed canvases (slides, proposals),
margin = 5% of the short edge and the content grid is 9 rows x 17 columns.
On scroll-driven surfaces, fluid `clamp()` tokens replace fixed margins and
content clears the HUD chrome via `--hud-content-inset`.

## Shapes

- **Diamond waypoint:** rotated-45 square, gold fill. Universal marker.
- **Corner brackets:** L-shaped borders at `--dawn-30`. Frame anchors.
- **Rails:** 1px gold hairline guides with outward-facing tick marks.
- **Course lines:** 1px gold strokes at 35% opacity connecting diagram nodes.

All shapes are hairline (1px) or thin-stroke (0.6-0.8px). No heavy borders,
no drop shadows, no glows except the brandmark's subtle gold `box-shadow`
on the travel clone during scroll handoff.

## Components

### Buttons

Ghost variant (gold border + gold text, transparent fill) for primary CTAs.
Solid variant (gold fill + void text) reserved for pressed/active states and
high-priority actions. Both use `rounded: 0` and PT Mono uppercase labels.

### Cards

Semi-transparent void background (`rgba(10,9,8,0.55)`) with `--dawn-08`
borders. On hover: darker background, `--dawn-15` border. Grid layout with
explicit row templates for consistent card heights.

### HUD Chrome

Corner brackets, rails, depth gauge ticks, brandmark anchor — all positioned
absolutely within a fixed `.hud` container. Responsive via `clamp()` tokens
that collapse gracefully through the breakpoint ladder (1100 > 960 > 700 > 640).

## Do's and Don'ts

**Do:**

- Use CSS variables for all color, spacing, and geometry values
- Sharp corners everywhere (zero border-radius)
- Gold for active navigation; diamonds not circles
- Monospace (PT Mono) for data readouts and HUD labels
- `requestAnimationFrame` for animation (not `setInterval`)
- Margin from the short edge; scale factor from `min(w,h)/1080`

**Don't:**

- Rounded corners, box shadows for depth, pure #000 or #FFF
- Spring/bounce animations; circular indicators; accent soup
- Background-fill-only active states (use edge/underline/text gold)
- Standalone L-corner brackets where the canonical design doesn't use them
- Green for navigation or gold for provenance (roles are fixed)
