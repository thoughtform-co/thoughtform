# Celestial Diagram Grammar

Parametric SVG diagrams used between landing-page sections and inside phase-glyph slots. Built from composable shape primitives, controlled by a typed config schema (`lib/celestial/schema.ts`), rendered by `DiagramSvg`. Distinct from the **particle icon grammar** (pixel-grid, 3-layer, GRID=3) — this grammar is vector, compass-centric, and parametric.

---

## Philosophy

Every diagram is an **instrument readout**, not decoration. Celestial navigation tools — compasses, astrolabes, sextants, star charts — are the formal vocabulary. Diagrams signal section transitions (connectors) or encode phase identity (glyphs). They share the brand's precision-plus-uncertainty duality: crisp geometry from the schema, subtle variation from seeded randomness.

---

## Inventory — Shape Primitives (LOW freedom)

These are the atomic building blocks. Names, files, and roles are exact.

| Primitive         | File                       | Role                                                               |
| ----------------- | -------------------------- | ------------------------------------------------------------------ |
| **Rings**         | `shapes/Rings.tsx`         | Concentric guide circles at computed radii; optional meridian line |
| **BearingTicks**  | `shapes/BearingTicks.tsx`  | N evenly-spaced tick marks around the outer ring                   |
| **MeridianAxis**  | `shapes/MeridianAxis.tsx`  | Vertical N-S axis line with optional labels                        |
| **RotatedSquare** | `shapes/RotatedSquare.tsx` | 45-degree rotated square (diamond); optional nesting               |
| **Reticle**       | `shapes/Reticle.tsx`       | Crosshair + center shape (dot / diamond / ring)                    |
| **OrbitalMarker** | `shapes/OrbitalMarker.tsx` | Single gold diamond marker at a given bearing angle                |
| **CompassRose**   | `shapes/CompassRose.tsx`   | 8-point star rose at a given radius                                |
| **RegisterMarks** | `shapes/RegisterMarks.tsx` | Corner registration marks (printing / technical drafting)          |
| **DiagramLabels** | `shapes/DiagramLabels.tsx` | Top-left + bottom-right text labels inside the diagram             |
| **Constellation** | `shapes/Constellation.tsx` | Seeded star field with nearest-neighbor asterism lines             |
| **EclipticArc**   | `shapes/EclipticArc.tsx`   | Tilted arc with phase markers along the ecliptic plane             |
| **PhaseDisk**     | `shapes/PhaseDisk.tsx`     | Radial coverage disk (moon-phase style)                            |
| **GlyphRing**     | `shapes/GlyphRing.tsx`     | 12 rune-like marks around a guide ring                             |
| **CrystalFacet**  | `shapes/CrystalFacet.tsx`  | Faceted N-gon crystal with inner frame and diamond vertex markers  |
| **Armature**      | `shapes/Armature.tsx`      | Structural scaffolding: crossbars + verticals + diamond joints     |

All primitives live in `components/landing/v7/CelestialConnector/shapes/`.

---

## Inventory — Presets (LOW freedom)

Presets are named compositions of primitives, selected by the `preset` field of `CelestialConfig`. Each one is a `case` in `DiagramSvg.tsx::renderPreset`.

| Preset          | Primitives Used                                                                        | Role                                        |
| --------------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| `meridian`      | Rings, BearingTicks, MeridianAxis, OrbitalMarker, Reticle, DiagramLabels               | Standard navigation instrument              |
| `squareCascade` | Rings, RotatedSquare, BearingTicks, CompassRose, OrbitalMarker, Reticle, DiagramLabels | Diamond-forward composition                 |
| `heroOrb`       | Rings, BearingTicks, CompassRose, OrbitalMarker, Reticle, DiagramLabels                | Large hero diagram                          |
| `reticle`       | Rings, BearingTicks, Reticle                                                           | Minimal targeting instrument                |
| `compassRose`   | Rings, BearingTicks, CompassRose, Reticle                                              | Classic 8-point compass                     |
| `orbital`       | Rings, BearingTicks, OrbitalMarker, Reticle                                            | Single waypoint on rings                    |
| `registerMarks` | Rings, RotatedSquare, RegisterMarks, BearingTicks, Reticle                             | Technical drafting style                    |
| `constellation` | Rings, Constellation, BearingTicks                                                     | Star chart with asterism lines              |
| `ecliptic`      | Rings, EclipticArc, MeridianAxis, Reticle, DiagramLabels                               | Orbital plane visualization                 |
| `phase`         | PhaseDisk, Rings, BearingTicks, OrbitalMarker                                          | Lunar-phase style disk                      |
| `sigil`         | GlyphRing, RotatedSquare, Reticle                                                      | Ritual sigil composition                    |
| `astrolabe`     | Rings, GlyphRing, EclipticArc, MeridianAxis, Reticle, DiagramLabels                    | Full astrolabe instrument                   |
| `crystallize`   | Rings, CrystalFacet, GlyphRing, Reticle                                                | Faceted crystal + glyph ring (Encode phase) |
| `armature`      | Rings, RotatedSquare, Armature, RegisterMarks, BearingTicks, Reticle                   | Structural scaffolding (Build phase)        |

---

## Composition Rules (MEDIUM freedom)

These are principles that apply to every diagram, whether preset or custom.

### Canvas

- **viewBox:** `-120 -120 240 240` — all diagrams use this coordinate space.
- **Outer element:** `<svg viewBox="-120 -120 240 240" fill="none">`.
- **Rotation wrapper:** `<g transform="rotate(N)">` at the root; `rotation` is 0 | 90 | 180 | 270.

### Stroke and Fill

- Stroke weights: 0.3 | 0.5 | 0.7 | 1 | 1.5 | 2 (schema-enforced).
- **Gold** (`--gold`) for active/signal elements: crosshairs, orbital markers, bearing ticks, diamond fills, crystal facets.
- **Dawn-30** (`--dawn-30`) for guide elements: rings, dashed circles, axis lines.
- **Dawn-08** (`--dawn-08`) for the faintest structural guides.
- Fills use `--gold-15` for translucent gold glints (e.g. crystal inner facet).

### Shape Law

- **Diamonds not circles** for point markers — rotated squares, never round dots.
- Zero border-radius on all rectangular forms.
- Reticle center shapes: `dot | diamond | ring` — prefer `diamond` for phase glyphs.

### Rings and Ticks

- Ring count: 1–5 (schema field).
- Tick densities: 0 | 4 | 8 | 12 | 16 | 24 | 48.
- Meridian axis is optional per-ring config.

### Determinism

- Seed-driven primitives (Constellation, GlyphRing, PhaseDisk, EclipticArc, CrystalFacet, Armature) use `seededRandom(seed)` for repeatability.
- Same seed always produces the same visual. Seeds are stored in the config.

---

## Named Recipes — Phase Glyphs (MEDIUM freedom)

Three canonical compositions for the Navigate / Encode / Build approach phases. Bespoke SVGs live in `components/landing/v7/PhaseGlyphSvg.tsx`, rendered via `PhaseGlyphPortals`.

### 01 · Navigate — `compassRose`

The compass: the literal navigation instrument. Concentric rings + 12 bearing ticks + 8-point rose + crosshair + gold orbital marker at NNE.

```ts
preset: "compassRose",
diagram: {
  rotation: 0,
  rings: { count: 3, tickDensity: 12, showMeridian: true, strokeWeight: 0.5 },
  reticle: { crosshair: true, centerShape: "diamond" },
  orbital: { angle: 42, size: "md" },
}
```

### 02 · Encode — `crystallize`

The crystal: fluency solidified into reusable skills. Faceted hex-diamond + glyph ring (the skill library) + diamond reticle.

```ts
preset: "crystallize",
diagram: {
  rotation: 0,
  rings: { count: 1, tickDensity: 0, showMeridian: false, strokeWeight: 0.4 },
  glyphRing: { seed: 7, radius: "lg" },
  crystal: { seed: 7, facets: 6, inset: 0.55 },
  reticle: { crosshair: false, centerShape: "diamond" },
}
```

### 03 · Build — `armature`

The scaffold: domain experts building structure. Nested rotated square (work envelope) + crossbar armature with diamond joints + register marks.

```ts
preset: "armature",
diagram: {
  rotation: 0,
  rings: { count: 1, tickDensity: 4, showMeridian: false, strokeWeight: 0.3 },
  square: { rotated: true, nested: true, registerMarks: true },
  armature: { seed: 3, crossbars: 3, diamondJoints: 4 },
  reticle: { crosshair: false, centerShape: "diamond" },
}
```

---

## Authoring New Presets and Shapes (HIGH freedom)

### When to compose vs. extend

1. **Compose first.** Try combining existing primitives in a new preset `case` in `DiagramSvg.tsx`. Most diagrams need only 3–5 primitives.
2. **Extend when a new concept demands a new visual form** — the existing primitives do not express it, and stretching them would misrepresent the concept. CrystalFacet exists because no existing primitive conveys "faceted artifact"; Armature exists because no existing primitive conveys "structural scaffold."
3. **Do not duplicate** existing primitives under new names for stylistic preference.

### Checklist for adding a new shape

1. **Schema** — add a `FooConfig` interface and an optional `diagram.foo?` field in `lib/celestial/schema.ts`. Add to `validateConfig`.
2. **Primitive** — create `shapes/Foo.tsx`. Use `seededRandom` if it needs deterministic variation. Stroke/fill must use CSS variables (`--gold`, `--dawn-30`, etc.), not hardcoded hex.
3. **Export** — add to `shapes/index.ts`.
4. **DiagramSvg** — import, add default fallback config, pass through `PresetParts`, add a new `case` in `renderPreset`.

### Checklist for adding a new preset (no new primitive)

1. Add the preset name to `PRESETS` in `lib/celestial/schema.ts`.
2. Add a `case` in `DiagramSvg.tsx::renderPreset`.
3. No schema changes needed beyond the preset name.

---

## Product-Specific Reuse

`PhaseGlyph` configs and the primitive set are portable across all Thoughtform products. `DiagramSvg` has no landing-page dependencies; it renders a pure SVG from a config object. Astrolabe, Atlas, and Sigil can import and use it directly.

The `PhaseGlyphPortals` component is landing-specific (HTML portal pattern). Other products using React can render `<DiagramSvg config={...} />` directly in JSX.
