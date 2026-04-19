# Navigation UI Grammar — 11 Primitives

Each primitive maps a navigational concept to a visual element. Products dial intensity up or down: Synod is restrained (productivity tool), Atlas is full HUD (research station), thoughtform.co is editorial.

---

## 1. Viewport Frame

Corner brackets at container edges. You're looking through an instrument.

```css
/* L-bracket via clip-path (top-left corner) */
.frame-corner--tl::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: var(--corner-arm, 20px);
  height: var(--corner-arm, 20px);
  border-top: var(--corner-thickness, 2px) solid var(--gold-30);
  border-left: var(--corner-thickness, 2px) solid var(--gold-30);
}
```

**Presets**: subtle (10px arm, 1px), card (16px, 2px), frame (20px, 2px), panel (24px, 1.5px), hud (40px, 2px)

**Clean vertex:** If the L is built as **two strokes** (horizontal bar + vertical bar), do **not** align both to the same inner corner pixel — the overlap reads as a **+**. Offset the vertical leg by the stroke thickness and shorten the leg accordingly (1px CSS: `top: 1px` / `bottom: 1px`; 2px bars: offset `2px`). Border-based corners (single box with two sides) avoid this by construction. Portable spec: [hud-frame-implementation.md](./hud-frame-implementation.md).

**Intensity**: Synod = rarely (maybe settings panels). Atlas = everywhere. thoughtform.co = viewport-level only.

---

## 2. Telemetry Rails

Measurement ticks along edges giving spatial orientation. Ruler-like scales, depth markers.

```css
.rail {
  position: fixed;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--dawn-30);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.rail--left {
  writing-mode: vertical-lr;
  transform: rotate(180deg);
}
```

**Tick cadence (canonical):** 13-position equal-spacing grid across the FULL rail height (multiples of `100/12 ≈ 8.33%`). Left rail has 12 ticks (`HUD_TICK_MARKS`, skips index 1 for the compass slot); right rail has 13 (`HUD_TICK_MARKS_RIGHT`). Majors at indices 4 and 8 (33.33% and 66.67%) with bearing labels `"2"` and `"5"` via `leftRailTickLabel()`. The legacy `"7"` label and the old Sigil-era 24-mark scale are retired. Ticks are 7px minor or 21px major, outward from the guide hairline. Rail aside width is fluid: `clamp(48px, 4.27vw, 82px)`. Full geometry + Vector 4 compound-path trap: `hud-frame-implementation.md` §3–4.

**Tick color:** Prefer **solid** stroke color (same as guide/bracket) for majors and minors; avoid reduced opacity as the default — use opacity only when fading is semantically intentional.

**Tick direction (Hartstikke Phase 2 V1):** Ticks point **outward** from the vertical guide line — left rail ticks extend left (away from content), right rail ticks extend right (away from content). This replaces the previous inward-pointing behavior.

**Right rail behavior:** The right rail doubles as a chapter/section progress indicator — more ticks become visible as you advance through content sections.

**Intensity**: Synod = none. Atlas = left + bottom rails. Astrolabe presentations = full or minimalistic (corner motifs only). thoughtform.co = full HUD rails.

---

## 3. Compass Anchor

A focal crosshair or brandmark element that orients the user in the interface. Can be literal (crosshair SVG) or implied (centered layout with radiating elements).

**Two distinct elements share the bottom-left zone but serve different purposes:**

| Element                       | Size (at ref) | Context                                | Scales with canvas?              |
| ----------------------------- | ------------- | -------------------------------------- | -------------------------------- |
| **HUD brandmark anchor**      | 40px          | Navigation shell chrome on all formats | Optically fixed (`40px * scale`) |
| **Title-system heading icon** | ~270x265px    | Chapter/title slides only              | Yes (`270px * scale`)            |

The HUD brandmark is the small Thoughtform gateway+compass glyph that appears in the navigation shell. The title-system heading icon is a large compositional crosshair+diagonal motif that anchors on the horizontal baseline at 85% canvas height. **These are separate elements. Never substitute one for the other.** See [title-system.md](./title-system.md) for heading-icon geometry.

**Hartstikke Phase 2 V1 (Sigil / select shells):** The **Omkadering (Framing) icon** — circled + crosshair at the **bottom-left** of the HUD frame, plus a short horizontal dash — is a **product-specific** treatment. **Astrolabe viewport shell** (`NavigationGrid`) uses **corners + rails only** — no default bottom-left compass; add one only when the product spec requires it. Cross-repo HUD rules: [hud-frame-implementation.md](./hud-frame-implementation.md).

```css
.compass-anchor {
  position: fixed;
  bottom: var(--hud-margin);
  left: var(--hud-margin);
  z-index: var(--z-nav);
}
```

**Intensity**: Synod = implied (centered empty states). Atlas = literal crosshair. thoughtform.co = brandmark. Sigil = may use bottom-left Omkadering when specified. Astrolabe app chrome = omit unless explicitly designed in.

---

## 4. Waypoints

Navigation targets styled as destinations to reach. Diamonds (rotated 45deg squares) replace circles as markers.

```css
.waypoint::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--gold);
  transform: rotate(45deg);
  margin-right: 8px;
}
```

**Usage**: Bullets in lists, active indicators in navigation, status dots, breadcrumb markers.

**Intensity**: Universal — all products use diamonds instead of circles.

---

## 5. Heading Indicator

Active states = directional commitment. "You are here." Gold is the signal.

```css
/* Horizontal tab — underline */
.heading--h {
  border-bottom: 2px solid var(--gold);
  color: var(--gold);
}

/* Vertical nav — left border */
.heading--v {
  border-left: 2px solid var(--gold);
  background: var(--gold-10);
  color: var(--gold);
}
```

**Rule**: Never use background-fill alone for active state. Always pair with a directional edge (underline or left-border).

**Intensity**: Universal.

---

## 6. Data Readouts

Metadata as instrument readings. Monospace, uppercase, wide tracking, tiny.

```css
.readout {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dawn-30);
}
.readout__value {
  color: var(--dawn-70);
}
```

**Usage**: Timestamps, coordinates, word counts, status labels, version numbers, file sizes.

**Intensity**: Synod = timestamps and dates. Atlas = dense telemetry. thoughtform.co = section coordinates.

---

## 7. Course Lines

1px borders tracing routes between content. Always straight, never curved. Routes, not decoration.

```css
.course-line {
  border-bottom: 1px solid var(--dawn-08);
}
.course-line:hover {
  border-color: var(--dawn-15);
}
.course-line--gold {
  border-color: var(--gold-15);
}
```

**Rule**: Use `dawn-08` for structural dividers, `dawn-15` for stronger separation, `gold-15` for active/selected regions.

**Intensity**: Universal.

---

## 8. Depth Layers

Surface progression = proximity to user. Deeper = further.

```
void (#050403)      — the infinite background
surface-0 (#0A0908) — primary elevated surfaces (sidebars, panels)
surface-1 (#0F0E0C) — nested containers (dropdowns, popovers)
surface-2 (#141210) — closest layer (modals, tooltips)
```

**Rule**: Never skip layers. A modal on void should be surface-1 or surface-2, not surface-0.

**Light mode**: Inverts. void = #FFFFFF, surfaces get progressively darker.

**Intensity**: Universal.

---

## 9. Signal Strength

Dawn opacity = information visibility. Hierarchy IS signal strength.

```
dawn       (#ECE3D6)  — full signal: primary text, headings
dawn-70                — strong: secondary text, descriptions
dawn-50                — moderate: tertiary text, placeholders
dawn-30                — faint: labels, metadata, inactive
dawn-15                — whisper: hover borders, subtle accents
dawn-08                — trace: default borders, dividers
dawn-04                — ghost: barely-there backgrounds
```

**Rule**: If you need a new opacity level, you're probably using the wrong one. Stick to the scale.

**Intensity**: Universal.

---

## 10. Bearing Labels

Section markers with systematic numbering. Suggests charted territory, not arbitrary grouping.

```css
.bearing {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--dawn-30);
  letter-spacing: 0.1em;
}
/* Format: 01, 02, 03 — always zero-padded */
```

**Usage**: Section numbering, service indexes, navigation rail markers, ordered lists with intent.

**Intensity**: Synod = sparingly. Atlas = section markers everywhere. thoughtform.co = section numbering on scroll.

---

## 11. Particle Glyphs

Pixel-art icons composed from `<rect>` SVG primitives on a grid. Each icon encodes three conceptual layers from the Thoughtform brand identity: human intent (skeleton), navigational emphasis (signal), and machine interpretation (drift/glitch).

```css
.particle-glyph {
  display: block;
  image-rendering: pixelated;
}
.particle-glyph rect {
  fill: currentColor;
}
```

**Three layers**:

| Layer    | Role                                              | Alpha    | Meaning                                                       |
| -------- | ------------------------------------------------- | -------- | ------------------------------------------------------------- |
| Skeleton | Human-readable form; structural pixels            | 0.85–1.0 | Intent: what the human decided to communicate                 |
| Signal   | 1–3 accent pixels at vertex, center, or tip       | 1.0      | "You are here" — maps to Heading Indicator (gold when active) |
| Drift    | 1–2 pixels displaced by 1 grid unit from skeleton | 0.4–0.55 | Machine interpretation; breaks perfect symmetry               |

**Construction rules**:

- Grid quantum: 3px (nav icons at 18px), 2px (inline icons at 12px), 3px (logo at 32px)
- Pixel size: `grid - 1` (leaves 1px gap — prevents bleed at small sizes)
- Color: `currentColor` for inheritance; explicit RGB for fixed-color contexts
- Opacity gradient for motion: `0.45 → 0.6 → 0.8 → 1.0` (trailing particles suggest direction)
- Sharp geometry only — no circular or curved constructions
- Drift pixels are deterministic (seeded from glyph shape), not random

**Glyph taxonomy**: arrow (trajectory), logo (anchor + vertices), settings (axis + frame), theme (radiate + anchor)

**Brand connection**: Maps directly to the VECTORS vs GLITCHED pairs in the TF brand file. The clean vector = skeleton + signal. The glitch = drift layer added.

**Intensity**: Sigil = navigation icons, card affordances, logo. Atlas = telemetry markers. thoughtform.co = brandmark pulse.

---

## 12. Nav Spine

A vertical tree structure fixed alongside the left HUD rail that encodes hierarchical position and, at workspace depth, available waypoints. Combines Telemetry Rails, Waypoints, Course Lines, and Heading Indicator into a single navigation axis.

Two orthogonal navigation axes:

- **Nav bar (horizontal)** — lateral movement between areas (journeys, analytics, bookmarks, docs)
- **Nav spine (vertical)** — depth movement through the hierarchy (route > mode > waypoints)

```
/routes/[id]/image:             /journeys/[id]/lessons/[lid]:

ROUTE                           JOURNEY NAME
 └ IMAGE                         └ LESSON TITLE
    ├ [waypoint thumb]  ← active
    ├ [waypoint thumb]
    └ [+]
```

```css
.nav-spine {
  position: fixed;
  z-index: 40;
  top: calc(var(--hud-padding) + 32px);
  left: calc(var(--hud-padding) + 46px); /* RAIL_WIDTH - 2 */
}

/* Tree connectors: SVG paths, not CSS borders */
.nav-spine svg path {
  stroke: var(--dawn-15);
  stroke-width: 1;
  stroke-linecap: square;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
}

/* Active target: HUD corner brackets */
.nav-spine__target-bracket {
  position: absolute;
  width: 4px;
  height: 4px;
  border: 1px solid var(--gold);
}

@media (max-width: 980px) {
  .nav-spine {
    display: none !important;
  }
}
```

**Anatomy**:

- Root segment (back link): `9px mono uppercase`, `dawn-30`, `gold` on hover
- Child segments: indented 12px with SVG L-connector
- Portal slot: accepts page-specific tree extensions (e.g. waypoint thumbnails via `NavSpineContext`)
- Waypoint thumbnails: 48×48, `dawn-08` border, `gold` border + corner brackets when active
- Create button: 48×40, `1px dashed dawn-15`, `gold` solid on hover

**Animation**: `spineTelemetryIn` — 250ms ease per node, 60ms stagger delay (telemetry feed boot-up).

**Semantics**: `<nav>` > `<ul>` > `<li>` with `aria-current="page"` on active node.

**Intensity**: Sigil = nested pages (route workspace, journey detail, lesson). Atlas = full hierarchy. Synod = none (top-level pages only).
