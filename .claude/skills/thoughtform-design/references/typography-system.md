# Thoughtform Typography System

Fluid type scale, font roles, weights, and letter-spacing. All type uses CSS variables; no system font fallbacks for brand surfaces.

---

## Font Stacks

Two faces, two roles. PT Mono covers everything that wants to read like an instrument readout (titles, HUD labels, data, eyebrows, captions). PP Neue Montreal covers everything that wants to read like a sentence (paragraphs, descriptions, long-form copy).

| Role         | Stack                                      | CSS Variable              | Tailwind class | Usage                                                                                              |
| ------------ | ------------------------------------------ | ------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| Title / mono | `var(--font-pt-mono), monospace`           | `--font-pt-mono`          | `font-mono`    | Headings, HUD labels, eyebrows, data readouts, timestamps, coordinates, pagination, chapter labels |
| Body / sans  | `var(--font-pp-neue-montreal), sans-serif` | `--font-pp-neue-montreal` | `font-sans`    | Paragraphs, descriptions, long-form copy, CTAs reading as sentences                                |

Both faces are loaded via `next/font/local` in `app/layout.tsx` (files in `public/fonts/`). PP Mondwest, IBM Plex Sans, and IBM Plex Mono have been retired from this system. The Thoughtform wordmark is preserved as inline SVG geometry in `components/brand/Wordmark.tsx` — it does NOT depend on any font.

Tailwind's `font-display` token is kept as a deprecated alias mapping to PT Mono so legacy class names keep working; prefer `font-mono` in new code.

---

## Fluid Type Scale

All sizes use `clamp()` for fluid scaling. Map to CSS variables; do not hardcode px in components.

| Token   | Value                                | CSS Variable     | Usage                                                 |
| ------- | ------------------------------------ | ---------------- | ----------------------------------------------------- |
| xs      | `clamp(9px, 0.5rem + 0.1vw, 10px)`   | `--type-xs`      | Tiny labels, captions                                 |
| sm      | `clamp(10px, 0.6rem + 0.15vw, 12px)` | `--type-sm`      | Small labels, metadata                                |
| base    | `clamp(13px, 0.75rem + 0.2vw, 15px)` | `--type-base`    | Base body text                                        |
| md      | `clamp(14px, 0.8rem + 0.25vw, 16px)` | `--type-md`      | Slightly larger body                                  |
| lg      | `clamp(16px, 0.9rem + 0.4vw, 20px)`  | `--type-lg`      | Large text                                            |
| xl      | `clamp(18px, 1rem + 0.6vw, 26px)`    | `--type-xl`      | Section titles                                        |
| 2xl     | `clamp(22px, 1.2rem + 1vw, 32px)`    | `--type-2xl`     | Large headlines                                       |
| display | `clamp(28px, 1.5rem + 2vw, 48px)`    | `--type-display` | Display headlines (PT Mono uppercase, tracking-tight) |

---

## Weights

| Token            | Value | Usage                                                  |
| ---------------- | ----- | ------------------------------------------------------ |
| `--weight-light` | 300   | Ledes only                                             |
| `--weight-text`  | 400   | Rest state, both faces                                 |
| `--weight-lit`   | 500   | THE CEILING: sans display and every lit / active state |

Nothing above 500 anywhere in content (ADR-092). PT Mono ships 400 + 700 only, so
`--weight-lit` on mono resolves to 400 by design — emphasis on mono is ink, never
weight, and a mono 700 is DELETED rather than set to 500 (a 500 that renders 400 is
a lie in the source). The Bold faces retire in ADR-092 stage 4.

---

## Letter Spacing (Tracking)

| Token             | Value     | Usage                                                       |
| ----------------- | --------- | ----------------------------------------------------------- |
| `--track-copy`    | `0`       | Sans prose                                                  |
| `--track-display` | `-0.02em` | Sans display, sentence case                                 |
| `--track-label`   | `0.08em`  | THE BASE RUNG: every mono chrome label, row, key, tab, meta |
| `--track-eyebrow` | `0.15em`  | The one departure: eyebrows, designations, kickers, counts  |

Four rungs by ROLE, not five by magnitude (ADR-092). `.08em` is the HUD frame's own
rung and `MONO_ADVANCE`'s (0.6 + .08), so the frame and the map share the base with
no projection change — the kit proposed `.06`, and a second base one level up
would have been ADR-091's defect in a new place. The magnitude aliases
(`--track-tight … --track-widest`) are stage-0 aliases and retire in stage 4.

**HUD/Data:** `--track-label` + uppercase for readouts and telemetry; `--track-eyebrow`
only where the label is an eyebrow, a designation or a count.

---

## Line Heights

| Token   | Value | Usage                    |
| ------- | ----- | ------------------------ |
| tight   | 1.2   | Display, large headlines |
| snug    | 1.4   | Section headers          |
| normal  | 1.5   | Default body             |
| relaxed | 1.6   | Long form                |
| loose   | 1.7   | Body text preset         |

---

## Presets

**HUD Label:** `--font-pt-mono`, `--type-xs`, `--weight-text`, `--track-label`, `text-transform: uppercase`  
**Section Header:** `--font-pp-neue-montreal`, `--type-display` or `--type-2xl`, `--weight-lit` (500) up to ~24px and `--weight-text` from 36px, `--track-display`, sentence case — the hero's own PT Mono headline is the one mono display and keeps its caps at 400  
**Body Text:** `--font-pp-neue-montreal`, `--type-base`, weight 400, loose line-height (1.5–1.6)  
**Data Readout:** `--font-pt-mono`, 9–11px, `--track-label`, uppercase, `--dawn-30` or `--dawn-70` for value

---

## Hierarchy Rules

- One display (PT Mono, large + uppercase + tight tracking) headline per viewport when used; do not stack multiple display headings in one block.
- PT Mono is the system's working voice — titles, HUD labels, data, timestamps. Reserve PP Neue Montreal for prose: paragraph descriptions, body copy, long-form sentences.
- If you need another size, use the nearest scale step; do not invent intermediate values.

---

## What Never Appears

- System font stacks (Arial, Helvetica, sans-serif as primary)
- Rounded or playful typefaces
- PP Mondwest, IBM Plex Sans, or IBM Plex Mono — all three have been retired
- More than one display face per screen
- Body / paragraph copy in PT Mono — reserve PT Mono for titles, HUD labels, and data readouts
