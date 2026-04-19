# Specimen Recipes

Content + composition recipes for recreating Brand Codex specimens
from the skill alone — no Figma access required. Each recipe documents
the layout geometry, typography specs, color mappings, content strings,
and spacing rhythm that sit **between** the primitive API (Layer 5 in
`primitives-api.md`) and the variant matrix (§11 in
`hud-frame-implementation.md`).

**Freedom tier: MEDIUM.** Structure and geometry are fixed (LOW);
example content strings are HIGH — swap them for any specimen.

---

## 1. Canvas scaffold pattern

Every specimen page follows the same architectural recipe:

### 1.1 Fixed 1920x1080 canvas with JS scale transform

The canvas is a fixed-size `div` (1920 x 1080px) centered in the
viewport. A `useEffect` + `useState` hook computes a uniform scale
factor so the slide fits any screen:

```
scale = Math.min((viewportWidth - 32) / 1920, (viewportHeight - 32) / 1080)
```

The 32px subtraction provides an outer breathing margin. The scale is
applied via `transform: scale(${scale})` with `transform-origin: center center`.

### 1.2 Scoped CSS variable override (`SLIDE_HUD_VARS`)

The canvas wrapper sets scoped CSS variables that pin HUD primitives
to the Figma 1920x1080 reference geometry, overriding any responsive
clamp values from `globals.css`:

| Variable                 | Value   | Purpose                           |
| ------------------------ | ------- | --------------------------------- |
| `--hud-margin`           | `48px`  | Outer inset for chrome anchors    |
| `--hud-rail-width`       | `82px`  | Rail aside width                  |
| `--hud-rail-guide-inset` | `9px`   | Guide line offset from rail edge  |
| `--hud-corner-zone`      | `45px`  | Anchor group vertical clearance   |
| `--hud-rail-top`         | `111px` | Rail top offset (y=111)           |
| `--hud-rail-bottom`      | `119px` | Rail bottom offset (1080-961=119) |

### 1.3 Page file pattern

A specimen page is ~30 lines. It:

1. Imports `useRequireAuth` for auth gating
2. Imports `SpecimenFrame` from `../_shared/SpecimenFrame`
3. Imports content helpers from `../_shared/TextImgContent`
4. Returns a `<SpecimenFrame>` with variant-specific props and content children

```tsx
"use client";

import { useRequireAuth } from "@/lib/auth/hooks";
import { SpecimenFrame } from "../_shared/SpecimenFrame";
import {
  TextImgLoading,
  TextImgUnderstandingImage,
  TextImgUnderstandingText,
} from "../_shared/TextImgContent";

export default function MySpecimenPage() {
  const { loading } = useRequireAuth();
  if (loading) return <TextImgLoading />;

  return (
    <SpecimenFrame chapter="Chapter 01" paginationIndex={1}>
      <TextImgUnderstandingImage unions={["tl", "tr", "bl", "br"]} />
      <TextImgUnderstandingText />
    </SpecimenFrame>
  );
}
```

---

## 2. Text+Image family recipe

The Text+Image family places an **image block** on the right and a
**text block** on the left, inside the SpecimenFrame's 1920x1080 canvas.
All 6 variants share identical content — they differ only on the
top-left shell mode and which corner unions are rendered.

### 2.1 Image block

**Position and size (absolute, in canvas pixels):**

| Property | Value  |
| -------- | ------ |
| left     | 965.97 |
| top      | 214.04 |
| width    | 738    |
| height   | 652    |

**Treatment:** The image is rendered as a gradient placeholder (not a
raster asset) with a scanline overlay:

- **Base gradient:** `linear-gradient(135deg, color-mix(in srgb, var(--gold) 18%, var(--surface-1)) 0%, var(--surface-1) 35%, var(--void) 70%, var(--surface-0) 100%)`
- **Scanline overlay:** A repeating horizontal stripe pattern at 0.18 opacity:
  `repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(236,227,214,0.04) 3px, rgba(236,227,214,0.04) 4px)`

The scanline layer sits as a second absolutely-positioned `div` on top
of the gradient, with `pointer-events: none`.

### 2.2 Corner unions

Four union corners (128x128 bounding box each) frame the image block.
Anchor positions (top-left of each 128x128 wrapper):

| Corner | x       | y      |
| ------ | ------- | ------ |
| `tl`   | 893.73  | 141.71 |
| `tr`   | 1649.46 | 141.71 |
| `bl`   | 893.66  | 811.27 |
| `br`   | 1649.46 | 811.27 |

Each union is colored `var(--gold)`.

**CRITICAL — SVG path data (LOW freedom, never guess):**

The union is a **thin** L-bracket with a stepped notch at the inner
vertex — NOT a thick block. The TL base path (viewBox `0 0 128 128`):

```
M18.1836 12.6816H19.6182V14.0205H20.4502V14.9287H21.6338V16.3379H34.5312V16.3398H127.012V18.3398H21.6338V19.5811H20.4502V20.3906H19.6182V21.8271H18.2646V127.822H16.2646V21.8271H14.9111V20.3906H14.0762V19.5811H12.8955V18.1709H0V16.3379H12.8955V14.9287H14.0762V14.0205H14.9111V12.6816H16.3486V0H18.1836V12.6816Z
```

The other three variants are CSS transforms on this same path:

- `tl`: `transform: none`
- `tr`: `transform: scaleX(-1)`
- `bl`: `transform: scaleY(-1)`
- `br`: `transform: scale(-1, -1)`

In standalone HTML (no React), render each as:

```html
<div
  style="position:absolute; left:893.73px; top:141.71px; width:128px; height:128px; color:var(--gold)"
>
  <svg viewBox="0 0 128 128" width="128" height="128" style="transform:none">
    <path fill="currentColor" d="M18.1836 12.6816H19.6182V14.0205H...Z" />
  </svg>
</div>
```

### 2.3 Text block ("Definition Container")

**Position:** `left: 156.51, top: 171, width: 647`

The text block is a vertical flex column with `gap: 28px` containing
four zones:

#### Zone 1 — Eyebrow

A horizontal flex row (`gap: 15px`, `align-items: center`):

| Element    | Component       | Size | Color         | Style                              |
| ---------- | --------------- | ---- | ------------- | ---------------------------------- |
| Star glyph | `<StarBurst />` | 29px | `var(--gold)` | —                                  |
| Label      | `<span>`        | 25px | `var(--gold)` | PT Mono, uppercase, `leading-none` |

**Example label text:** `"Definition"`

#### Zone 2 — Heading

| Property    | Value         |
| ----------- | ------------- |
| Element     | `<h1>`        |
| Font        | PT Mono Bold  |
| Size        | 50px          |
| Color       | `var(--dawn)` |
| Transform   | uppercase     |
| Line-height | 1             |
| Margin      | 0             |

**Example heading text:** `"Understanding AI as a System of Meaning"`

#### Zone 3 — Body paragraph

| Property    | Value           |
| ----------- | --------------- |
| Element     | `<p>`           |
| Font        | PT Mono Regular |
| Size        | 20px            |
| Color       | `#f5f5f5`       |
| Transform   | uppercase       |
| Line-height | 1.1             |
| Margin      | 0               |

Body text contains **inline bold spans** colored `var(--gold)` for
emphasis. The gold spans highlight the key insight phrase.

**Example body text:**

> Artificial intelligence is not just a tool —
> **it's a language. As we step into systems that interpret, predict
> and evolve, our task isn't** only to train them, but to learn how
> to listen. Through thoughtful design and deep insight, we shape the
> context in which intelligence unfolds.

(Bold segments shown in `**` above render as
`<span class="font-bold" style="color: var(--gold)">`)

#### Zone 4 — Bullet list

Three rows with absolute vertical positioning inside a container
(`width: 647px, min-height: 108px`):

| Row | y-offset | Marker                     | Text                             |
| --- | -------- | -------------------------- | -------------------------------- |
| 1   | 0        | `<StarGlitch size={20} />` | "Artificial intelligence is not" |
| 2   | 44       | `<StarGlitch size={20} />` | "Lorem Ipsum Lorem"              |
| 3   | 87.54    | `<StarGlitch size={20} />` | "Not just a tool"                |

Each row is a horizontal flex with `gap: 12.22px`. Text is PT Mono
Bold 20px, `#f5f5f5`, uppercase, `leading-none`, `whitespace-nowrap`.

---

## 3. Variant wiring cheat sheet

All 6 variants share the same image block and text block. They differ
on exactly two axes:

| Variant | Shell mode          | `clientLogo` prop                                         | `unions` prop              |
| ------- | ------------------- | --------------------------------------------------------- | -------------------------- |
| **1a**  | Client (Lotus logo) | `{ src: "/logos/Lotus-Semantic Dawn.png", alt: "Lotus" }` | `["tl", "tr", "bl", "br"]` |
| **1b**  | Grid (L-bracket)    | _(omit)_                                                  | `["tl", "tr", "bl", "br"]` |
| **2a**  | Grid                | _(omit)_                                                  | `["tr", "bl"]`             |
| **2b**  | Client              | `{ src: "...", alt: "..." }`                              | `["tr", "bl"]`             |
| **3a**  | Grid                | _(omit)_                                                  | `["tl", "br"]`             |
| **3b**  | Client              | `{ src: "...", alt: "..." }`                              | `["tl", "br"]`             |

**Shell mode rule:** When `clientLogo` is provided, SpecimenFrame
renders a logo slot + 30px terminator rule at the top-left. When
omitted, it renders a 30x30 top-left corner L-bracket instead.

**Union subsets:**

- Variant 1 = all 4 corners
- Variant 2 = TR + BL (diagonal A)
- Variant 3 = TL + BR (diagonal B)

---

## 4. Content inventory (HIGH freedom)

The text strings below are the "Understanding AI" specimen content.
Replace with any content for new specimens — the structure, sizing,
and color mapping stay the same.

| Zone                  | Content                                         |
| --------------------- | ----------------------------------------------- |
| Eyebrow label         | `"Definition"`                                  |
| Heading               | `"Understanding AI as a System of Meaning"`     |
| Body                  | See §2.3 Zone 3 above                           |
| Bullet 1              | `"Artificial intelligence is not"`              |
| Bullet 2              | `"Lorem Ipsum Lorem"`                           |
| Bullet 3              | `"Not just a tool"`                             |
| Chapter label         | `"Chapter 01"`                                  |
| Pagination            | `1` (rendered as `"01"`)                        |
| Client logo (1a only) | `/logos/Lotus-Semantic Dawn.png`, alt `"Lotus"` |

---

## 5. SVG glyph reference (LOW freedom — never guess)

These are the exact SVG paths extracted from Figma via `exportAsync`.
A fresh agent MUST use these paths verbatim — guessing glyph shapes
produces visually wrong results (see `figma-to-code-playbook.md` §2.1).

### 5.1 StarBurst (eyebrow marker, 29x29)

Figma node `1802:5971`. An 8-point bearing star with stepped notches.
ViewBox `0 0 29 29`, fill with `var(--gold)`.

```
M29 27.5372L18.7149 17.2519L19.8393 16.127L18.8958 15.1836L19.6201 14.4589L18.9563 13.795L20.024 12.7273L18.8799 11.5831L29 1.46327L27.5367 0L17.417 10.1199L16.2708 8.97359L15.2031 10.0418L14.5372 9.37583L13.8125 10.1001L12.8707 9.15876L11.7463 10.2832L1.46325 0L0 1.46327L10.283 11.7465L9.15863 12.8709L10.1004 13.8127L9.4538 14.4589L10.1197 15.1248L8.97388 16.271L10.1201 17.4173L0 27.5372L1.46325 29L11.583 18.8801L12.7271 20.0243L13.8733 18.8785L14.5372 19.5423L15.1833 18.8957L16.1272 19.8396L17.2516 18.7147L27.5367 29L29 27.5372Z
```

### 5.2 StarGlitch (bullet marker, 20x20)

Figma node `1802:5979`. A plus-cross star with tapered arms.
ViewBox `0 0 20 20`, fill with `var(--gold)` (NOT white/#f5f5f5).

```
M12.0877 10.4988C12.221 10.4714,12.359 10.4571,12.5003 10.4571H18.5877V9.54451H12.5003C12.359 9.54451,12.221 9.53007,12.0877 9.50284V8.88858H11.8206C11.8973 8.77062,11.9871 8.65877,12.0905 8.55544L16.3949 4.25099L15.7495 3.60562L11.4451 7.91007C11.3453 8.00988,11.2377 8.09729,11.1242 8.1721V7.81451H10.4801C10.4643 7.7121,10.4558 7.60729,10.4558 7.50044V1.41284H9.54324V7.50025C9.54324 7.60710,9.5349 7.71192,9.51898 7.81432H8.8749V8.17192C8.76157 8.09710,8.65398 8.00970,8.55398 7.90988L4.24953 3.60543L3.60416 4.25081L7.90861 8.55525C8.01213 8.65858,8.10194 8.77044,8.17842 8.88840H7.91139V9.50266C7.77805 9.53007,7.64009 9.54432,7.49879 9.54432H1.41212V10.4569H7.49953C7.64083 10.4569,7.77879 10.4714,7.91213 10.4986V11.1128H8.17916C8.10250 11.2308,8.01268 11.3427,7.90935 11.4460L3.60490 15.7504L4.25027 16.3958L8.55472 12.0914C8.65453 11.9915,8.76213 11.9041,8.87564 11.8293V12.1869H9.51972C9.53546 12.2893,9.54398 12.3941,9.54398 12.5010V18.5884H10.4566V12.5010C10.4566 12.3941,10.4649 12.2893,10.4808 12.1869H11.1249V11.8293C11.2382 11.9041,11.3458 11.9915,11.4458 12.0914L15.7503 16.3958L16.3956 15.7504L12.0912 11.4460C11.9877 11.3425,11.8979 11.2308,11.8214 11.1128H12.0884V10.4986L12.0877 10.4988Z
```

### 5.3 Brandmark (gateway + compass, 40x40)

Figma node `1802:5935`. ViewBox `0 0 430.99 436`, rendered at
`width="40.13" height="40.5"`. Fill with `var(--gold)`.

The canonical source SVG (`Thoughtform_Brandmark.svg`) renders
perfectly as inline SVG. Use this exact markup — never approximate:

```html
<svg viewBox="0 0 430.99 436" width="40.13" height="40.5" fill="none">
  <path
    fill="var(--gold)"
    d="M336.78,99.43c18.82,18.93,33.41,41.16,43.78,66.63,5.03,12.35,8.81,24.86,11.42,37.57h19.62c-1.91-18.99-6.54-37.52-13.79-55.54-10.01-24.71-24.56-46.73-43.78-66.02-19.17-19.29-41.16-33.97-65.92-43.99-7.9-3.24-15.9-5.92-23.95-8.1l-1.36,7.49-.9,4.91-1.41,7.49c2.87,1.11,5.79,2.28,8.65,3.54,25.51,10.99,48.06,26.33,67.63,46.02h.01Z"
  />
  <path
    fill="var(--gold)"
    d="M383.13,314.65c-8.61,22.23-21.59,41.97-38.85,59.38-16.91,16.61-35.23,29.06-55,37.36-19.78,8.3-40.21,12.45-61.29,12.45-11.68,0-23.35-1.22-34.92-3.7-2.47-.46-4.93-1.01-7.4-1.67-2.42-.61-4.88-1.27-7.3-2.02-7.4-2.18-14.74-4.91-22.14-8.1-1.21-.51-2.47-1.06-3.67-1.62-1.16-.51-2.31-1.06-3.42-1.62-2.37-1.11-4.73-2.28-7.05-3.49-20.78-10.83-39.75-24.86-56.91-42.07-19.98-19.69-35.63-42.88-46.9-69.56-5.38-12.61-9.46-25.36-12.28-38.22-.6-2.53-1.11-5.06-1.56-7.59s-.85-5.06-1.21-7.59c-.81-5.87-1.41-11.85-1.71-17.77-.1-2.53-.2-5.06-.2-7.59-.05-.96-.05-1.92-.05-2.89,0-1.57,0-3.14.1-4.71.45-21.06,4.48-41.21,11.98-60.45,8.1-20.66,20.53-39.49,37.44-56.45,16.86-17.01,35.48-29.57,55.86-37.67,20.33-8.1,41.62-12.2,63.91-12.2,5.99,0,11.93.25,17.86.81l2.72-14.68c-26.82,0-53.19,5.32-79,15.95-25.92,10.63-49.06,26.12-69.39,46.63-20.73,20.81-36.38,43.99-46.95,69.51-6.59,15.85-11.12,32.05-13.59,48.55-.35,2.53-.7,5.06-.96,7.59-.3,2.53-.5,5.06-.7,7.59-.35,5.01-.55,10.02-.55,15.04,0,.91,0,1.82.05,2.73,0,2.53.1,5.06.25,7.59.1,2.53.25,5.06.5,7.59,1.76,19.9,6.49,39.24,14.14,57.97,9.96,24.3,24.56,46.12,43.78,65.41,19.93,19.74,42.57,34.78,67.93,45.21,3.72,1.52,7.5,2.99,11.27,4.25,2.42.86,4.83,1.67,7.25,2.38,2.42.76,4.88,1.47,7.3,2.13,7.5,2.03,15.1,3.59,22.74,4.71,2.52.35,5.03.71,7.55.96,2.52.3,5.03.51,7.55.66,4.88.41,9.76.56,14.64.56,26.87,0,52.84-5.11,78-15.34,25.16-10.23,47.71-25.41,67.68-45.51,20.33-20.81,35.78-44.2,46.35-70.07,7.1-17.42,11.78-35.18,14.09-53.31h-15.1c-.71,21.82-4.98,42.78-12.83,62.88h-.01Z"
  />
  <path fill="var(--gold)" d="M29.12,218.81l132.09-.05v.05H29.12h0Z" />
  <path fill="var(--gold)" d="M163.32,250.35l12.58.05h-12.58v-.05Z" />
  <path fill="var(--gold)" d="M179.17,408.81l30.34-158.46-29.79,158.61s-.35-.1-.55-.15h0Z" />
  <path
    fill="var(--gold)"
    d="M430.98,218.81l-5.23,17.77h-184.93l-10.32.05-2.47,13.72h-18.52l-30.34,158.46c-7.2-2.23-14.44-4.96-21.59-8.1l24.05-132.9h-8.86l3.12-17.42h-20.73l2.57-13.77H30.87c-.86-5.87-1.46-11.8-1.76-17.77h132.09l10.32-.05,2.47-13.72h18.52l29.54-157.85,1.36-7.49,1.41-7.44.2-1.21,1.41-7.49,1.36-7.44L230.76.06h23.6l-3.52,19.14-1.36,7.44-1.41,7.49-.65,3.44-1.36,7.49-1.41,7.54-23.9,129.71h.6l13.49.1-4.78,21.52h17.01l-.2,1.16-2.57,13.77h186.69v-.05h-.01Z"
  />
  <path fill="var(--gold)" d="M254.35,0l-33.01,182.26h-.6L254.35,0h0Z" />
</svg>
```

This is the complete, canonical SVG — 7 paths, no approximation needed.

### 5.4 Union corner (image bracket, 128x128)

See §2.2 above for the TL base path and CSS transform variants.

---

## 6. Inner content grid (LOW freedom)

The inner grid is **8 horizontal hairlines** (not 9) plus **2 short
rules** at the top and bottom of the content zone. Common mistake:
rendering percentage-based lines spanning full width — the actual
grid uses absolute pixel positions.

### 6.1 Main grid lines

8 lines, all at `left: 163px`, `width: 1593.082px`, `height: 1px`,
`background: var(--dawn-08)`:

| Line | y (px) |
| ---- | ------ |
| 1    | 166.87 |
| 2    | 272.87 |
| 3    | 378.87 |
| 4    | 484.87 |
| 5    | 590.87 |
| 6    | 696.87 |
| 7    | 802.87 |
| 8    | 908.87 |

### 6.2 Short rules

Two additional shorter hairlines at different positions:

| Rule   | left  | y         | width      |
| ------ | ----- | --------- | ---------- |
| Top    | 269px | 61px      | 1275.209px |
| Bottom | 269px | 1014.76px | 1487.077px |

Both are `height: 1px`, `background: var(--dawn-08)`.

---

## 7. Rail geometry (LOW freedom)

Rails are **82px-wide aside strips**, not narrow tick containers.
Each rail contains a 1px vertical guide line and 12-13 tick marks.

### 7.1 Rail structure

| Property    | Left rail           | Right rail          |
| ----------- | ------------------- | ------------------- |
| Top         | 111px               | 111px               |
| Height      | 850px (to y=961)    | 850px               |
| Aside width | 82px                | 82px                |
| Guide inset | 9px from inner edge | 9px from inner edge |
| Guide color | `var(--gold)`       | `var(--gold)`       |
| Guide width | 1px                 | 1px                 |
| Tick count  | 12 (skip index 1)   | 13 (all positions)  |

**CRITICAL — guide color:** The vertical guide line MUST be `var(--gold)`,
the same color as the ticks. Using `var(--dawn-08)` or any faint/muted
color makes the guide appear thinner than the ticks, creating a visual
inconsistency. Both guide and ticks are 1px at `var(--gold)`.

### 7.2 Tick positions

13 positions at equal spacing (`100/12 ≈ 8.33%` of rail height):

| Index | Position | Type             | Label                                             |
| ----- | -------- | ---------------- | ------------------------------------------------- |
| 0     | 0%       | minor            | —                                                 |
| 1     | 8.33%    | minor            | — (left rail skips this — compass fills the slot) |
| 2     | 16.67%   | minor            | —                                                 |
| 3     | 25%      | minor            | —                                                 |
| 4     | 33.33%   | **major** (21px) | "2" (left rail only)                              |
| 5     | 41.67%   | minor            | —                                                 |
| 6     | 50%      | minor            | —                                                 |
| 7     | 58.33%   | minor            | —                                                 |
| 8     | 66.67%   | **major** (21px) | "5" (left rail only)                              |
| 9     | 75%      | minor            | —                                                 |
| 10    | 83.33%   | minor            | —                                                 |
| 11    | 91.67%   | minor            | —                                                 |
| 12    | 100%     | minor            | —                                                 |

Minor ticks are 7px wide. Major ticks are 21px wide. Bearing labels
("2" and "5") are 10px PT Mono at 60% gold opacity. No "7" label.

### 7.3 Chrome anchors (exact positions)

| Anchor           | Position                          | Content                                                  |
| ---------------- | --------------------------------- | -------------------------------------------------------- |
| Compass diamond  | `(50.35, 175.67)` 11.977x11.977   | 8.469px gold diamond rotated 45deg, 3px `#1c1c1c` border |
| Compass rule     | `(49.85, 181.66)`                 | 50.205px horizontal gold hairline                        |
| Client logo slot | `(56, ~34.67)` 102x48             | `<img>` with `object-fit: contain` (NOT text)            |
| Logo terminator  | `(158.15, 58.67)`                 | 30px horizontal gold hairline                            |
| Grid-mode icon   | `(56.33, 63.01)` 30x30            | `border-top + border-left` (L-bracket, NOT a crosshair)  |
| Brandmark        | `(36.67, 992.63)` 40.13x40.5      | Brandmark SVG (see §5.3)                                 |
| Brandmark tick   | `(86.71, 1012.57)`                | 30px horizontal gold hairline                            |
| Chapter rule     | `(1713.84, 58.98)`                | 30px horizontal gold hairline                            |
| Chapter label    | `right: 54.29, top: 48.98`        | PT Mono 18.575px, gold at 60% opacity, uppercase         |
| Pagination text  | `(1866.19, 1007.4)` 19.073x13.032 | PT Mono 14px, gold, zero-padded "01", `translateX(-50%)` |
| Pagination rule  | `(1815.83, 1012.92)`              | 30px horizontal gold hairline                            |

---

## 8. Common mistakes to avoid

| Mistake                                           | Correct                                                                 |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| Union corners rendered as thick 16px blocks       | Thin L-bracket with stepped notch (use §2.2 path)                       |
| StarGlitch markers filled white (`#f5f5f5`)       | Fill with `var(--gold)`                                                 |
| Inner grid as 9 percentage-based full-width lines | 8 absolute lines at `left:163` + 2 short rules (§6)                     |
| Client logo rendered as text                      | Render as `<img>` with `object-fit: contain`                            |
| Rail guide colored `var(--dawn-08)` (too faint)   | Guide is `var(--gold)`, same as ticks                                   |
| Rails as narrow 21px strips                       | Full 82px aside with 9px guide inset                                    |
| Pagination at `bottom:50px; right:54px`           | Exact coords: text at `(1866.19, 1007.4)`, rule at `(1815.83, 1012.92)` |
| StarBurst as simple 8-point star                  | Use exact path from §5.1 (stepped notch geometry)                       |
| Brandmark as simplified 5-path approximation      | Use all 6 paths from `Brandmark.tsx` (§5.3)                             |

---

## 9. Creating a new specimen family

When porting a **new** Figma specimen family (not a Text+Image variant):

1. Create a new content helper in `app/brand-system/_shared/` (e.g.,
   `QuoteContent.tsx`) that declares the family's image/text/decoration
   blocks with absolute Figma coordinates.
2. Each variant page imports `SpecimenFrame` + the new content helper.
3. Add a new recipe section to this file documenting the layout
   geometry, typography specs, and content inventory.
4. Follow `figma-to-code-playbook.md` for extracting coordinates and
   glyph shapes from Figma.
