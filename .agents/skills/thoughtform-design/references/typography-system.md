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

| Token  | Value | Usage                  |
| ------ | ----- | ---------------------- |
| light  | 300   | Body text, long form   |
| normal | 400   | UI, labels, default    |
| medium | 500   | Emphasis, buttons, nav |

Avoid 600+ on UI; reserve for rare display emphasis.

---

## Letter Spacing (Tracking)

| Token  | Value    | Usage                           |
| ------ | -------- | ------------------------------- |
| tight  | `0.02em` | Body text                       |
| normal | `0.04em` | Default                         |
| wide   | `0.08em` | HUD labels, readouts            |
| wider  | `0.1em`  | Bearing labels, section markers |
| widest | `0.15em` | Emphasis labels, hero sublines  |

**HUD/Data:** Use wide or wider + uppercase for readouts and telemetry.

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

**HUD Label:** `--font-pt-mono`, `--type-xs`, weight 400, wide tracking, `text-transform: uppercase`  
**Section Header:** `--font-pt-mono`, `--type-display` or `--type-2xl`, weight 700, tight tracking (`-0.01em`), uppercase  
**Body Text:** `--font-pp-neue-montreal`, `--type-base`, weight 400, loose line-height (1.5–1.6)  
**Data Readout:** `--font-pt-mono`, 9–11px, wide tracking, uppercase, `--dawn-30` or `--dawn-70` for value

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
