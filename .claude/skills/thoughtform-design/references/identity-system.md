# Thoughtform Identity System

Logo, wordmark, brandmark, vectors, and iconography. These elements are immutable; do not distort, recolor outside the palette, or add unapproved effects.

---

## Brandmark (Gateway + Compass)

The Thoughtform brandmark is literally a **navigation instrument**: a gateway combined with a celestial compass. It orients the user and signals "you are in Thoughtform space."

- **Usage:** Hero, loading states, empty states, favicon, app icon.
- **Do not:** Stretch, rotate (except 90° increments for layout), add drop shadows, gradients, or outlines not in the Brand Codex.
- **Colors:** Single-color (dawn, gold, or void) or approved two-color lockups. See [color-system.md](color-system.md).

### Brandmark as a morphable particle artifact

When mediums collapse — the strategic story behind Thoughtform — the brandmark
collapses with them. The mark stops being a finished asset and becomes a
**runtime substrate**: a deterministic point cloud sampled from the
canonical SVG paths and projected by whatever the moment needs.

This is the canonical brandmark behavior on `thoughtform.co` (v7 landing,
ADR-011) and the recommended pattern for any new Thoughtform product
where the brandmark needs to choreograph in space, dissolve into
atmosphere, or recompose mid-journey.

**Density tiers (load-bearing — keep in sync with `PARTICLE_STATION_DEFAULTS` in
[`useSigilChoreography.ts`](../../../components/landing/v7/hooks/useSigilChoreography.ts)):**

| Tier           | Density | Dispersion | Reads as                                                                                                                                                                                              |
| -------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Full**       | 1.00    | 0.00       | Solid filled mark. Pixel-comparable to the canonical SVG at any dock size.                                                                                                                            |
| **Diagnostic** | 0.22    | 0.42       | Sparse atmospheric cloud. The brandmark dissolves into space — used for interstitials, quote backdrops, the "hidden work" moment.                                                                     |
| **Transit**    | lerped  | bump       | Mid-flight scatter. Density / dispersion interpolate between adjacent tiers and a `sin(πt) * 0.45` bell curve adds dispersion at the midpoint so the mark scatters and re-coheres at the destination. |

**Implementation:**

- One canonical shape source: `BRANDMARK_FILLED_PATHS` + `BRANDMARK_VIEWBOX`
  in [`components/landing/v7/BrandmarkGlyph.tsx`](../../../components/landing/v7/BrandmarkGlyph.tsx).
- One sampling utility: [`lib/brandmark/sampleShape.ts`](../../../lib/brandmark/sampleShape.ts).
  Rejection-samples via `Path2D + ctx.isPointInPath()`; seeded PRNG keeps
  the cloud stable across mounts.
- One shared GL canvas: [`components/brand/BrandmarkParticleField`](../../../components/brand/BrandmarkParticleField/).
  R3F `<Canvas>` with a custom shader that rank-clips invisible
  particles (the density dial), applies sinusoidal wander scaled by
  `uDispersion`, and projects pixel coordinates to NDC directly.

**Falls back to the SVG actor + portal'd glyphs** when WebGL is
unavailable or `prefers-reduced-motion: reduce` is set. Both paths
preserve the [ADR-010 v3](../../../sentinel/decisions/010-brandmark-choreography.md)
state machine.

**Strategic framing:** in the Navigate → Encode → Build flywheel, the
brandmark substrate is the artifact the design system _encodes_. Every
new shape you might want — compass, lotus, key visual, future identities
— is a new entry in a shape registry that the engine treats identically.
Mediums collapse: vector, particle, and (future) 3D become one substrate
dialled differently.

See [ADR-011](../../../sentinel/decisions/011-brandmark-particle-artifact.md)
for the full record and the [`brandmark-particle` skill](../../brandmark-particle/SKILL.md)
for the operational how-to.

---

## Wordmark

- **Spelling:** THOUGHTFORM (all caps in display contexts).
- **Form:** Vector lockup. The letterforms are baked into inline SVG paths in `components/brand/Wordmark.tsx` and do not depend on any font being loaded. The original geometry was drawn from PP Mondwest letterforms but PP Mondwest is no longer part of the type system — the wordmark is now a static brand asset.
- **Pairing:** Wordmark may sit beside the brandmark; maintain clear space (min 1x height of the "T" between mark and word).

---

## Vectors ("Mathematical North Stars")

Decorative or wayfinding vectors in the system are designed as **mathematical north stars** — they suggest direction, charting, and precision. Use them for:

- Section dividers
- Corner accents (in addition to corner brackets)
- Wayfinding in empty states or onboarding

**Rule:** Use as wayfinding, not decoration. If a vector doesn’t guide the eye or reinforce orientation, remove it.

---

## Iconography Rules

- **Radius:** 0px. All icon shapes are built from straight lines and sharp corners.
- **Stroke:** 1.5px default. Hairlines (1px) only for dense HUD/telemetry.
- **Shape:** Diamonds (45° rotated squares) replace circles for markers, bullets, and indicators. No rounded caps or joins unless specified in the asset.
- **Construction:** Geometric, grid-aligned. Icons should feel like readouts, not illustration.

### Icon Token Summary

| Token                | Value | Usage                 |
| -------------------- | ----- | --------------------- |
| icon-stroke          | 1.5px | Default icon stroke   |
| icon-stroke-hairline | 1px   | Dense readouts, rails |
| icon-size-sm         | 16px  | Inline with body text |
| icon-size-md         | 24px  | Buttons, nav          |
| icon-size-lg         | 32px  | Empty states, hero    |

---

## Clear Space & Minimum Size

- **Minimum size:** Brandmark no smaller than 24px height in digital UI. For print, follow Brand Codex minimums.
- **Clear space:** Maintain a band of empty space around the logo equal to the height of the "T" in the wordmark (or the height of the brandmark when used alone).

---

## File Formats & Export

- **Vector:** Prefer SVG. Preserve strokes as strokes, not expanded fills, when possible.
- **Raster:** Only when necessary (e.g. app icon); use 1x, 2x, 3x and documented DPI.

---

## What Never Appears

- Rounded corners on any logo or icon
- Recoloring outside the Brand Codex palette
- Wordmark in a non–PP Mondwest typeface
- Circular indicators or radio buttons in UI (use diamonds)
- Decorative use of vectors with no wayfinding purpose
