# Reference 04 — The Diagram System (CelestialConnector)

> Self-contained spec for designing new diagrams in the Thoughtform "celestial instrument" language.
> Source of truth: `components/landing/v7/CelestialConnector/` + ADR-026. Extracted 2026-07-18.

Thoughtform diagrams are **parametric SVG instruments** — astrolabe/orrery-style figures made of
concentric rings, radial spokes, orbits, constellations, and reticles. They read as measurement
devices, not illustrations. Every diagram in a new section must follow the grammar below.

---

## 1. Canvas law

- One fixed coordinate frame for every diagram: `viewBox="-120 -120 240 240"`, origin (0,0) = center.
- Root `fill="none"`; the diagram sits on the void background `#0a0908`.
- Rotation, if any, is a whole-figure `rotate()` in steps of 90° only (0 / 90 / 180 / 270).
- Rendered size on the page: square box `width: clamp(120px, 14vw, 180px)`, `aspect-ratio: 1`
  (large/hero variant: `clamp(180px, 18vw, 240px)`; ≤700px: 110px).

## 2. Palette law (strict — two hues only)

| Ink  | Value                    | Role                                                                                                  |
| ---- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Gold | `#caa554`                | Primary stroke + fill for all instrument geometry                                                     |
| Dawn | `rgba(235, 227, 214, α)` | Secondary/structural strokes, captions                                                                |
| Void | `#0a0908`                | Background; also _fills_ (planet disc, reticle center, hollow nodes are void-filled with gold stroke) |

No other colors, ever. Hierarchy comes from **opacity**, not hue.

**Opacity ladder** (pick from these, don't invent): `0.12 · 0.15 · 0.18 · 0.22 · 0.25 · 0.3 · 0.35 · 0.4 · 0.5 · 0.6 · 0.7 · 0.85 · 0.9`
Dawn is used at fixed alphas: `0.5` (captions), `0.3` (ticks/labels), `0.2` (extension lines), `0.15` (outer ring), `0.08` (faintest guide rings).

## 3. Line law

- **Stroke widths** (SVG units, hairline aesthetic): `0.4 · 0.5 · 0.6 · 0.7 · 0.8`. Default is **0.6**. Nothing heavier than 0.8.
- **Dash vocabulary** (exact patterns in use): `1 3`, `1 5`, `1 6`, `1 8`, `2 4`, `2 5`, `2 6`, `2 7`, `3 5`, `4 3`, `4 4`. Dashes with long gaps (`1 5`…`1 8`) read as "faint guide"; tighter dashes (`4 3`, `4 4`) read as "active path".
- **Concentric ring radii table** (outer → inner): `110, 92, 74, 56, 38`, with canonical styles:
  - r110 — dawn-15, dash `1 5`
  - r92 — dawn-08, solid
  - r74 — gold @ 0.22, dash `2 6`
  - r56 — gold @ 0.35, solid
  - r38 — gold @ 0.15, dash `1 3`
- Node/pip radii: `2–4` (filled gold, or "hollow" = void fill + gold stroke 0.7). Constellation vertex dots `r=1`.
- Center reticle: circle `r=14` (void fill, gold stroke 0.6) containing a gold diamond `±7` (or dot `r=4`, or ring `r=7`).

## 4. Primitive vocabulary

Compose diagrams from these named parts (3–6 per figure — that's the house density):

| Primitive         | What it draws                                                                                                      | Key params / geometry                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Rings**         | 1–5 concentric circles from the radii table                                                                        | `count`, `strokeWeight` (default 0.6)                          |
| **BearingTicks**  | N radial ticks at r=110, length 8, dawn-30 @ 0.5w                                                                  | `density` (8 / 12 / 48…)                                       |
| **MeridianAxis**  | Vertical gold axis r=74 with "N"/"S" mono labels (size 8, tracking 2)                                              | `showLabels`                                                   |
| **RadialSpokes**  | N spokes from inner radius outward, optional chevron arrow tips                                                    | `count, inner, length, dash, arrow, rotate, opacity`           |
| **OrbitalNodes**  | Tilted ellipse orbits carrying evenly spaced node pips                                                             | per orbit: `rx, ry, tilt, nodes, nodeR, dash, hollow, opacity` |
| **PlanetBody**    | Saturn: void disc r=16, gold ring ellipses (outer rx=2.15r/ry=0.62r, inner rx=1.7r/ry=0.49r), crescent fill @ 0.12 | `radius, ringTilt, ring, crescent`                             |
| **Constellation** | Seeded star scatter, nearest-neighbor asterism lines @ 0.18, 4-point starbursts                                    | `seed, points (5/7/9/11), density`                             |
| **EclipticArc**   | Dashed tilted ellipse arc with diamond/circle phase markers                                                        | `seed, tilt, phaseCount`                                       |
| **PhaseDisk**     | Moon-phase disc r=32, crescent via mask, gold fill @ 0.15                                                          | `seed, coverage 0.05–0.95`                                     |
| **GlyphRing**     | 12 rune glyphs (arrows/brackets/dots/asterisks…) on a guide ring                                                   | `seed, radius sm60/md78/lg96`                                  |
| **CrystalFacet**  | Outer N-gon + rotated inner N-gon + facet lines, gold-15 inner fill                                                | `seed, facets 4/6/8, inset`                                    |
| **Armature**      | Vertical dawn rails at x=±38 + gold crossbars + diamond joints (8×8 rotated squares)                               | `seed, crossbars, diamondJoints`                               |
| **RotatedSquare** | 124×124 base square; optional 45°-rotated 168×168 outer + nested circle r=32                                       | `rotated, nested, registerMarks`                               |
| **Reticle**       | Crosshair gap-segments + center circle r=14 + diamond/dot/ring                                                     | `crosshair, centerShape`                                       |
| **CompassRose**   | 3 spokes at −60/60/180 with "A/E/B" mono letters                                                                   | `radius`                                                       |
| **RegisterMarks** | 4 corner crop-marks at ±62                                                                                         | `radius`                                                       |
| **OrbitalMarker** | Single animated node on ring sm56/md74/lg92 + dawn counter-orbit dot                                               | `angle, size`                                                  |
| **DiagramLabels** | The two-corner figure caption (see §5)                                                                             | `topLeft, bottomRight`                                         |

## 5. Figure captions — the "fig · E" convention

Every diagram carries a two-corner mono caption **inside** the SVG:

- Font: `PT Mono` (stack: `"PT Mono", ui-monospace, Menlo, monospace`)
- Size `6` SVG units, `letter-spacing 1.5`, fill `rgba(235,227,214,0.5)` (dawn-50)
- Top-left at (−108, −106): a NAME, uppercase (`"ASTRA"`, `"ASTROLABE"`, `"N · 180"`)
- Bottom-right at (108, 112), text-anchor end: a figure index (`"fig · A"`, `"fig · E"`, `"∂ · 001"`, `"DESC"`)
- Interpunct `·` with spaces is the house separator. Decorative non-Latin labels are allowed (e.g. Arabic `القوة`).

## 6. Two canonical recipes (copy these moods)

**astralEmblem** — symmetric talisman:
Rings(count 3) + RadialSpokes(8, inner 16, len 92, @0.4) + RadialSpokes(4, inner 14, len 104, 0.7w @0.55) + BearingTicks(48) + OrbitalNodes[ {rx74 ry74, 8 nodes r2, dash `1 6`, @0.6}, {rx100 ry100, 4 hollow nodes r2.6, dash `1 8`} ] + Constellation(sparse) + Reticle(no crosshair, diamond) + Labels("ASTRA" / "fig · A")

**orrerySigil** — Saturn field chart:
RadialSpokes(16, inner 26, len 78, dash `3 5`, arrows, @0.4) + OrbitalNodes[ {rx96 ry40 tilt−12, 3 nodes r3, dash `4 4`, @0.8}, {rx70 ry30 tilt−12, 2 hollow r2.2, dash `3 5`}, {rx116 ry50 tilt−12, 1 node r2.4, dash `2 7`, @0.5} ] + Constellation(5 pts, sparse) + PlanetBody(r16, tilt−12) + Labels("القوة" / "fig · E")

Other presets for range: `meridian` (rings + ticks + axis + orbital marker + reticle), `astrolabe` (rings 3 + glyph ring lg + ecliptic + axis + reticle — densest), `phase` (single ring + PhaseDisk), `sigil` (glyph ring + nested rotated square + diamond reticle), `armature` (rotated square + armature + register marks).

## 7. The connector band (how diagrams sit between sections)

Diagrams live centered in a **full-bleed opaque band**:

- `width: 100vw`, background `var(--void)` — **opaque is load-bearing** (it masks the fixed gold gateway gradient and sticky hero video behind the page; see Reference 01 §compositing).
- CSS grid, 3 rows: `clamp(32px,4vw,56px) / auto / clamp(32px,4vw,56px)` (hero variant `clamp(40px,5vw,72px)`); content track `min(100%, clamp(560px, 68vw, 960px))`.
- Above and below the diagram: **transit lines** — a separate stretched SVG `viewBox="0 0 1200 120"` with patterns `v-converge / v-diverge / parallel-3 / single`; gold @ 0.35, 0.8w, center hinge at x=600, endpoint dots r=3, plus dawn-15 dashed guides (`0.4w`, dash `1 4`).
- Four **DOM corner labels** around the band: `PT Mono 9px` (8px ≤700px), uppercase, `letter-spacing 0.15em`, color dawn-30, with a gold emphasis span — e.g. **`Transit`**` · 02 → 03`, **`δ`**` 0.34 · Meridian`, `N · 180 · LOCK`, **`Fig`**` · 02b / Descent`.
- ≤700px: track → 100%, rows → `24px auto 24px`, diagram → 110px, labels → 8px.
- Idle motion: the whole SVG slowly floats opacity `0.95 ↔ 0.72` over 9s. Reveal-in: opacity 0→1 + `translateY(8px) scale(0.97)` + `blur(2px)` clearing, 880ms, ease `cubic-bezier(0.16,1,0.3,1)` — applied to the diagram, never to the opaque band wrapper.

## 8. Recipe for designing a NEW diagram (external tool, no repo)

Emit a plain SVG, `viewBox="-120 -120 240 240"`, `fill="none"`, previewed on `#0a0908`, using ONLY:

1. Strokes `#caa554` and `rgba(235,227,214,α)` at ladder alphas (§2)
2. Stroke widths from `{0.4, 0.5, 0.6, 0.7, 0.8}` (§3)
3. Dashes from the vocabulary (§3)
4. Concentric radii from `{110, 92, 74, 56, 38}`; node pips r 2–4; center reticle r14 + diamond ±7
5. Optional 48-tick bearing ring at r=110
6. Two-corner PT Mono caption: NAME top-left, `fig · X` bottom-right (§5)
7. 3–6 primitives total — restraint is the style; `astrolabe` is the maximum density ever used

## 9. Wiring note (for the build handoff, not for design)

The system is live but currently **dormant on the home page** (the last `data-celestial-slot`
placeholder is stripped at the corridor-exit seam). A new section re-activates it by declaring its
own slot: placeholder `<div data-celestial-slot="my-slot">` + a `celestial_slots` row (Supabase) +
a design assigned via the on-page admin editor, or a hardcoded preset in `DiagramSvg.tsx`.
Slots/designs: `celestial_slots` → `celestial_designs.config` (jsonb), cached 300s, seed fallback
in `lib/celestial/seed-data.ts`. Look-dev lab: `/test/celestial-emblems`.
