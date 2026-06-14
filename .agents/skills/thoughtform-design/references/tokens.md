# Thoughtform Design Tokens

**Repo-specific sources of truth** (prefer live CSS/tokens in the product you are editing): Thoughtform.co `app/styles/variables.css`; Astrolabe `app/globals.css` + `lib/navigation/rail-contract.ts`; Atlas `thoughtform-brand/tokens/tokens.css` + `src/app/globals.css`; Sigil `app/globals.css` / design tokens as defined in-repo. The tables below are the **shared semantic map** — if a repo’s file disagrees, trust the repo.

Historical monorepo path (when present): `packages/ui/src/tokens/`. All values map to CSS custom properties.

---

## Colors

### Void (Backgrounds)

| Token     | Value     | CSS Variable  |
| --------- | --------- | ------------- |
| void      | `#050403` | `--void`      |
| void-deep | `#050403` | `--void-deep` |

### Surface (Elevated backgrounds — dark mode)

| Token     | Value     | CSS Variable  |
| --------- | --------- | ------------- |
| surface-0 | `#0A0908` | `--surface-0` |
| surface-1 | `#0F0E0C` | `--surface-1` |
| surface-2 | `#141311` | `--surface-2` |

### Dawn (Text & particles — dark mode)

| Token   | Value                       | CSS Variable |
| ------- | --------------------------- | ------------ |
| dawn    | `#ECE3D6`                   | `--dawn`     |
| dawn-80 | `rgba(236, 227, 214, 0.80)` | `--dawn-80`  |
| dawn-70 | `rgba(236, 227, 214, 0.70)` | `--dawn-70`  |
| dawn-50 | `rgba(236, 227, 214, 0.50)` | `--dawn-50`  |
| dawn-40 | `rgba(236, 227, 214, 0.40)` | `--dawn-40`  |
| dawn-30 | `rgba(236, 227, 214, 0.30)` | `--dawn-30`  |
| dawn-15 | `rgba(236, 227, 214, 0.15)` | `--dawn-15`  |
| dawn-08 | `rgba(236, 227, 214, 0.08)` | `--dawn-08`  |
| dawn-04 | `rgba(236, 227, 214, 0.04)` | `--dawn-04`  |

### Gold (Accent — navigation & wayfinding)

| Token   | Value                      | CSS Variable         |
| ------- | -------------------------- | -------------------- |
| gold    | `#CAA554`                  | `--gold` (dark mode) |
| gold-40 | `rgba(202, 165, 84, 0.40)` | `--gold-40`          |
| gold-15 | `rgba(202, 165, 84, 0.15)` | `--gold-15`          |
| gold-10 | `rgba(202, 165, 84, 0.10)` | `--gold-10`          |
| gold-05 | `rgba(202, 165, 84, 0.05)` | `--gold-05`          |

### Atreides (Provenance — authorship, composition)

| Token          | Value                    | CSS Variable       |
| -------------- | ------------------------ | ------------------ |
| atreides-mid   | `#3D4B33`                | `--atreides-mid`   |
| atreides-light | `#5B7A4E`                | `--atreides-light` |
| atreides-glow  | `#7A9E6A`                | `--atreides-glow`  |
| atreides-30    | `rgba(61, 75, 51, 0.30)` | `--atreides-30`    |
| atreides-15    | `rgba(61, 75, 51, 0.15)` | `--atreides-15`    |

### Light mode (Ink & surfaces)

| Token                                                          | Value                             | CSS Variable                |
| -------------------------------------------------------------- | --------------------------------- | --------------------------- |
| ink                                                            | `#110F09`                         | `--ink`                     |
| ink-80, ink-70, ink-50, ink-40, ink-30, ink-15, ink-08, ink-04 | Latent Night same % as Dawn scale | `--ink-*`                   |
| surface-0                                                      | `#E4DAC9`                         | `--surface-0`               |
| surface-1                                                      | `#DDD2C0`                         | `--surface-1`               |
| surface-2                                                      | `#F2EAE0`                         | `--surface-2`               |
| gold                                                           | `#9A7A2E`                         | `--gold` (light mode value) |
| gold-hover                                                     | `#B8922F`                         | `--gold-hover` (light)      |

### Alert & Verde

| Token | Value     | CSS Variable |
| ----- | --------- | ------------ |
| alert | `#ff6b35` | `--alert`    |
| verde | `#39ff14` | `--verde`    |

### Semantic Aliases

| Alias       | Maps To                                        |
| ----------- | ---------------------------------------------- |
| background  | void                                           |
| text        | dawn                                           |
| textMuted   | dawn-70                                        |
| textSubtle  | dawn-50                                        |
| accent      | gold                                           |
| border      | dawn-08                                        |
| borderHover | dawn-15                                        |
| authored    | atreides-mid, atreides-light (borders, labels) |
| provenance  | atreides-mid, atreides-light                   |

---

## Typography

### Font Stacks

Two faces. PT Mono = titles + HUD labels + data. PP Neue Montreal = paragraphs + descriptions. PP Mondwest, IBM Plex Sans, and IBM Plex Mono have been retired.

| Token          | Stack                                      | CSS Variable              | Tailwind class                              | Usage                                                             |
| -------------- | ------------------------------------------ | ------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| mono / display | `var(--font-pt-mono), monospace`           | `--font-pt-mono`          | `font-mono` (and deprecated `font-display`) | Titles, headings, HUD labels, eyebrows, data readouts, timestamps |
| sans / body    | `var(--font-pp-neue-montreal), sans-serif` | `--font-pp-neue-montreal` | `font-sans`                                 | Paragraphs, descriptions, long-form copy                          |

### Fluid Size Scale

| Token   | Value                                | CSS Variable     | Usage                  |
| ------- | ------------------------------------ | ---------------- | ---------------------- |
| xs      | `clamp(9px, 0.5rem + 0.1vw, 10px)`   | `--type-xs`      | Tiny labels            |
| sm      | `clamp(10px, 0.6rem + 0.15vw, 12px)` | `--type-sm`      | Small labels, metadata |
| base    | `clamp(13px, 0.75rem + 0.2vw, 15px)` | `--type-base`    | Base body text         |
| md      | `clamp(14px, 0.8rem + 0.25vw, 16px)` | `--type-md`      | Slightly larger body   |
| lg      | `clamp(16px, 0.9rem + 0.4vw, 20px)`  | `--type-lg`      | Large text             |
| xl      | `clamp(18px, 1rem + 0.6vw, 26px)`    | `--type-xl`      | Section titles         |
| 2xl     | `clamp(22px, 1.2rem + 1vw, 32px)`    | `--type-2xl`     | Large headlines        |
| display | `clamp(28px, 1.5rem + 2vw, 48px)`    | `--type-display` | Display headlines      |

### Weights

| Token  | Value |
| ------ | ----- |
| light  | 300   |
| normal | 400   |
| medium | 500   |

### Letter Spacing

| Token  | Value    | Usage           |
| ------ | -------- | --------------- |
| tight  | `0.02em` | Body text       |
| normal | `0.04em` | Default         |
| wide   | `0.08em` | HUD labels      |
| wider  | `0.1em`  | Bearing labels  |
| widest | `0.15em` | Emphasis labels |

### Line Heights

| Token   | Value |
| ------- | ----- |
| tight   | 1.2   |
| snug    | 1.4   |
| normal  | 1.5   |
| relaxed | 1.6   |
| loose   | 1.7   |

### Presets

**HUD Label**: PT Mono (`font-mono`), xs, normal weight, wide tracking, uppercase
**Section Header**: PT Mono (`font-mono`), display size, bold weight, tight tracking (`-0.01em`), uppercase
**Body Text**: PP Neue Montreal (`font-sans`), base size, regular weight, loose line-height

---

## Spacing

8px base grid.

| Token | Value | CSS Variable  |
| ----- | ----- | ------------- |
| xs    | 4px   | `--space-xs`  |
| sm    | 8px   | `--space-sm`  |
| md    | 16px  | `--space-md`  |
| lg    | 24px  | `--space-lg`  |
| xl    | 32px  | `--space-xl`  |
| 2xl   | 48px  | `--space-2xl` |
| 3xl   | 64px  | `--space-3xl` |
| 4xl   | 96px  | `--space-4xl` |

### Layout Tokens (HUD)

**For exact HUD geometry (rail y bounds, tick grid, chrome anchors), see `hud-frame-implementation.md` — these values take precedence over anything below.** This table summarizes the CSS variables that HUD primitives read; the specimen values and clamp expressions are in `hud-frame-implementation.md` §6.

| Token           | Specimen value (1920×1080) | Responsive clamp                            | CSS Variable             |
| --------------- | -------------------------- | ------------------------------------------- | ------------------------ |
| hudMargin       | `48px`                     | `clamp(16px, min(2.8125vw, 5vmin), 54px)`   | `--hud-margin`           |
| railTop         | `111px`                    | `clamp(32px, min(2.604vw, 4.63vmin), 50px)` | `--hud-rail-top`         |
| railBottom      | `119px`                    | (mirror of railTop)                         | `--hud-rail-bottom`      |
| railWidth       | `82px`                     | `clamp(48px, 4.27vw, 82px)`                 | `--hud-rail-width`       |
| railGuideInset  | `9px`                      | `clamp(5px, 0.47vw, 9px)`                   | `--hud-rail-guide-inset` |
| cornerZone      | `45px` (anchor clearance)  | `clamp(28px, 4.17vmin, 45px)`               | `--hud-corner-zone`      |
| contentMaxWidth | `1200px`                   | —                                           | `--content-max-width`    |
| gridGap         | `24px`                     | —                                           | `--grid-gap`             |

Note: `--hud-corner-zone` is used ONLY for anchor-group vertical clearance, **not** for insetting the tick container. The `HudRail` tick container spans the full rail aside via `inset-0`. Earlier versions of this table listed `railWidth: 60px` and `cornerSize: 40px` as if they were independent tokens — those values were out of sync with the actual runtime and have been removed.

### Frame Sizing

| Token    | Value                    | CSS Variable     |
| -------- | ------------------------ | ---------------- |
| maxWidth | `min(90vw, 560px)`       | `--frame-max-w`  |
| paddingX | `clamp(16px, 4vw, 32px)` | `--frame-pad-x`  |
| paddingY | `clamp(16px, 3vw, 24px)` | `--frame-pad-y`  |
| corner   | 16px                     | `--frame-corner` |

---

## Corner Brackets

### Arm Lengths

| Preset | Arm  | Thickness      | Usage                       |
| ------ | ---- | -------------- | --------------------------- |
| subtle | 10px | 1px (hairline) | Small labels, subtle frames |
| card   | 16px | 2px (default)  | Content cards, panels       |
| frame  | 20px | 2px (default)  | Bridge frame, terminals     |
| panel  | 24px | 1.5px (thin)   | Editor panels, modals       |
| hud    | 40px | 2px (default)  | Viewport corner brackets    |

### Position Tokens

`four` | `tr-bl` | `tl-br` | `none` | single corners | adjacent pairs | three corners

---

## Chamfers

### Presets

| Preset                 | Kind        | Config                              |
| ---------------------- | ----------- | ----------------------------------- |
| inspectorTicket        | ticketNotch | tr corner, 220px width, 32px height |
| inspectorTicketCompact | ticketNotch | tr corner, 160px width, 24px height |
| cutCornersSm           | cutCorners  | all 4 corners, 8px                  |
| cutCornersMd           | cutCorners  | all 4 corners, 16px                 |
| cutCornersTopRight     | cutCorners  | tr only, 24px                       |

### Chamfer Colors

| Token        | Value                       |
| ------------ | --------------------------- |
| fill         | `rgba(10, 9, 8, 0.4)`       |
| stroke       | `rgba(202, 165, 84, 0.3)`   |
| strokeDanger | `rgba(255, 107, 53, 0.5)`   |
| strokeMuted  | `rgba(235, 227, 214, 0.15)` |

---

## Animation

| Token           | Value                           |
| --------------- | ------------------------------- |
| ease-out        | `cubic-bezier(0.16, 1, 0.3, 1)` |
| duration-fast   | `0.15s`                         |
| duration-normal | `0.3s`                          |
