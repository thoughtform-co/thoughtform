# Thoughtform Identity System

Logo, wordmark, brandmark, vectors, and iconography. These elements are immutable; do not distort, recolor outside the palette, or add unapproved effects.

---

## Brandmark (Gateway + Compass)

The Thoughtform brandmark is literally a **navigation instrument**: a gateway combined with a celestial compass. It orients the user and signals "you are in Thoughtform space."

- **Usage:** Hero, loading states, empty states, favicon, app icon.
- **Do not:** Stretch, rotate (except 90° increments for layout), add drop shadows, gradients, or outlines not in the Brand Codex.
- **Colors:** Single-color (dawn, gold, or void) or approved two-color lockups. See [color-system.md](color-system.md).

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
