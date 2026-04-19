# Primitives API

Flat reference for every `components/brand/*` and `components/hud/*`
component. The TSX files themselves are the source of truth; this doc
keeps the props and CSS variable contract visible without opening 20
separate files.

**Freedom tier: LOW.** The API surface (prop names, types, defaults)
and the CSS variable contract are fixed. Composition and content
inside primitives are medium-freedom.

---

## Directory layout

```
components/
  brand/
    Brandmark.tsx       — gateway + compass SVG glyph
    Wordmark.tsx        — THOUGHTFORM lockup SVG
    Diamond.tsx         — rotated-45 square marker
    StarGlitch.tsx      — plus-cross bullet glyph
    StarBurst.tsx       — 8-point eyebrow glyph
    index.ts
  hud/
    HudGuideLine.tsx    — 1px vertical hairline
    HudTick.tsx         — single horizontal tick
    HudRail.tsx         — guide + tick composition
    HudRule.tsx         — 30px horizontal/vertical rule
    HudInnerGrid.tsx    — 9-row decorative grid
    HudCornerBracket.tsx — re-export of HudStraightBracket (opt-in)
    HudUnionCorner.tsx  — decorative L chamfer for images
    HudCrossMark.tsx    — two-stroke crosshair ornament (legacy)
    HudLogoSlot.tsx     — top-left client logo anchor
    HudTopLeftIcon.tsx  — top-left grid-mode crosshair
    HudChapterAnchor.tsx   — top-right rule + label
    HudBrandmarkAnchor.tsx — bottom-left brandmark + compass cluster
    HudPaginationAnchor.tsx — bottom-right text + rule
    HudFrame.tsx        — composition entry point
    README.md
    index.ts
```

---

## Layer 1 — brand atoms (`components/brand/`)

### `<Brandmark />`

Thoughtform gateway + compass glyph. 5 inline `<path>` elements from
`Thoughtform_Brandmark.svg` (viewBox `0 0 430.99 436`). Inherits
`currentColor` so Tailwind `text-*` utilities recolor it.

```tsx
<Brandmark
  size?: "sm" | "md" | "lg" | "xl" | number   // default "md" (40)
  color?: string                                // default "currentColor"
  title?: string                                // a11y label
  className?: string
/>
```

### `<Wordmark />`

THOUGHTFORM lockup, 22 inline `<path>` elements from
`Thoughtform_Wordmark_Lockup-Vertical.svg` (viewBox `0 0 1178.18 494.93`).
**Not a font dependency** — the letterform geometry is baked into the
SVG paths. Ships in vertical lockup only (horizontal pending).

```tsx
<Wordmark
  size?: "sm" | "md" | "lg" | "xl" | number   // height in px; width auto
  color?: string
  title?: string
/>
```

### `<Diamond />`

Universal waypoint marker — rotated-45° square. Replaces all circles.

```tsx
<Diamond
  size?: "xs" | "sm" | "md" | "lg" | number   // 4/6/8/12 presets
  tone?: "gold" | "dawn" | "dawn-30" | "alert" | "atreides"
  color?: string                               // override fill
  outline?: boolean                            // 1px bordered, transparent fill
/>
```

### `<StarGlitch />`

20×20 plus-cross star glyph. Path data extracted from Figma node
`1802:5979` via `use_figma`. Used as bullet markers in body copy and
decorative clusters.

```tsx
<StarGlitch
  size?: "xs" | "sm" | "md" | "lg" | number   // 12/16/20/28 presets
  color?: string
  title?: string
/>
```

### `<StarBurst />`

29×29 8-point star burst. Path data extracted from Figma node
`1802:5971` via `use_figma`. Used as eyebrow / category markers in text
blocks (see DEFINITION in the Understanding AI specimen).

```tsx
<StarBurst
  size?: "sm" | "md" | "lg" | number   // 18/29/48 presets
  color?: string
  title?: string
/>
```

---

## Layer 2 — HUD primitives (`components/hud/`)

### `<HudGuideLine />`

1px vertical hairline — the "spine" of a rail aside. Defaults to a
solid color (canonical); `fade` opts into a gradient fade variant.

```tsx
<HudGuideLine
  color?: string                   // default "var(--gold)"
  inset?: string | number          // top/bottom offset; default "var(--hud-corner-zone)", pass 0 for full rail span
  fade?: boolean                   // default false
  className?: string
  style?: CSSProperties
/>
```

### `<HudTick />`

Single horizontal tick mark. Extends outward from the guide line (left
rail ticks go left, right rail go right).

```tsx
<HudTick
  side: "left" | "right"
  variant?: "minor" | "major"      // maps to 7px / 21px
  label?: string                   // optional bearing label
  color?: string                   // default "var(--gold)"
  labelColor?: string
  guideInset?: string | number     // default "var(--hud-rail-guide-inset)"
  style?: CSSProperties            // for vertical positioning (top: X%)
/>
```

### `<HudRail />`

Full rail aside. Composes `HudGuideLine` + `HudTick` × 12 (left) or 13
(right) from `HUD_TICK_MARKS` / `HUD_TICK_MARKS_RIGHT`. Tick container
spans the full rail via `inset-0`.

```tsx
<HudRail
  side: "left" | "right"
  showGuide?: boolean              // default true
  showTicks?: boolean              // default true
  labeled?: boolean                // undefined → true on left, false on right
  color?: string                   // default "var(--gold)"
  labelColor?: string
  className?: string
  style?: CSSProperties
/>
```

### `<HudRule />`

30px hairline (or custom length) used by the four chrome anchor groups.

```tsx
<HudRule
  orientation?: "horizontal" | "vertical"   // default "horizontal"
  length?: number                           // default 30 (HEADER_RULE_LENGTH)
  thickness?: number                        // default 1
  color?: string                            // default "currentColor"
/>
```

### `<HudInnerGrid />`

9 horizontal hairlines at canonical percentages (15.45% → 93.96%), the
decorative "draughting paper" grid for the GridShell variant of
`HudFrame`.

```tsx
<HudInnerGrid
  inset?: string | number          // default "var(--hud-margin)"
  color?: string                   // default "var(--dawn-08)"
/>
```

### `<HudCornerBracket />`

Re-export of `HudStraightBracket`. Clean-vertex L-bracket from the rail
guide inset. **Opt-in only** — the canonical canvas does NOT use
standalone corner brackets. Kept for Astrolabe shell back-compat.

### `<HudUnionCorner />`

Decorative L-bracket with notched interior corner, 128×128 by default.
Path extracted from Figma node `1802:5964`. Four variants (tl/tr/bl/br)
produced by CSS transforms on a single base path. Used as image corner
chamfers.

```tsx
<HudUnionCorner
  variant: "tl" | "tr" | "bl" | "br"
  size?: number                    // default 128
  color?: string                   // default "currentColor"
/>
```

### `<HudCrossMark />`

Two-stroke crosshair ornament — 33×33 default, intersection positioned
per variant. **Legacy primitive** — the current Brand Codex does NOT
use this on chapter / pagination anchors (those ornaments were removed
in the late-2026 refactor). Retained for potential new decorative uses.

```tsx
<HudCrossMark
  variant: "tl" | "tr" | "bl" | "br"
  size?: number                    // default 33
  color?: string                   // default "currentColor"
  strokeWidth?: number             // default 1
/>
```

---

## Layer 3 — HUD anchors (`components/hud/`)

### `<HudLogoSlot />`

Top-left client logo slot. `<img>` with `object-fit: contain` + trailing
30px rule. Positions at
`top: calc(var(--hud-rail-top) + 4px); left: calc(var(--hud-margin) + var(--hud-rail-guide-inset))`.

```tsx
<HudLogoSlot
  src: string
  alt?: string                     // default ""
  scale?: number                   // default 1; optical scale for heavy marks
  maxWidth?: number                // default 120
  maxHeight?: number               // default 48
  ruleColor?: string               // default "var(--gold)"
/>
```

### `<HudTopLeftIcon />`

Top-left crosshair glyph — GridShell mode alternative to `HudLogoSlot`.

```tsx
<HudTopLeftIcon
  size?: number                    // default 30
  color?: string                   // default "var(--gold)"
/>
```

### `<HudChapterAnchor />`

Top-right: leading 30px rule + chapter label. Right-anchored; label in
uppercase PT Mono Regular.

```tsx
<HudChapterAnchor
  label: string
  color?: string                   // default "var(--gold)"
  opacity?: number                 // default 0.6
/>
```

### `<HudBrandmarkAnchor />`

Two clusters rendered as Fragment children (positioned absolutely):

1. Top-of-rail compass mark (outline diamond + 50px horizontal)
2. Bottom-left brandmark + 30px horizontal terminator tick

```tsx
<HudBrandmarkAnchor
  showBrandmark?: boolean          // default true
  showCompassMark?: boolean        // default true
  brandmarkSize?: number           // default 40
  color?: string                   // default "var(--gold)"
  title?: string                   // a11y label on the brandmark
/>
```

### `<HudPaginationAnchor />`

Bottom-right: pagination text (zero-padded) + trailing 30px rule.
Formats `index+1` as `01` or `01 / 12` if `total` is provided.

```tsx
<HudPaginationAnchor
  index: number                    // zero-based
  total?: number
  color?: string                   // default "var(--gold)"
/>
```

---

## Layer 4 — composition (`components/hud/HudFrame.tsx`)

### `<HudFrame />`

The canonical drop-in HUD container. Works in both responsive shell
mode (app chrome) and pixel-accurate specimen mode (scoped CSS variable
overrides).

```tsx
<HudFrame
  variant?: "full" | "minimal"     // default "full" — minimal hides rails
  shell?: "grid" | "client"        // default "grid" — client shows logo slot instead of crosshair icon

  // Chrome content
  logoSrc?: string
  logoAlt?: string
  logoScale?: number
  chapter?: string
  pagination?: { index: number; total?: number }

  // Toggles (default to canon)
  showBrandmark?: boolean          // default true
  showCompassMark?: boolean        // default true
  showInnerGrid?: boolean          // default true — only in grid shell
  showCornerBrackets?: boolean     // default false — OPT-IN back-compat

  // Container behavior
  fullScreen?: boolean             // default false — true = position: fixed inset-0 z-30
  contentPadded?: boolean          // default true — auto-pads children to safe zone

  // Styling
  className?: string
  style?: CSSProperties
  contentClassName?: string
  contentStyle?: CSSProperties
  children?: ReactNode
/>
```

**Responsive usage** (app shell): wrap a page in
`<HudFrame fullScreen variant="full" shell="grid" chapter="CANON" />`
and let the global CSS variables drive the layout.

**Specimen usage** (pixel-accurate): use `SpecimenFrame` from Layer 5
below — it already handles the fixed canvas, JS scale transform, and
scoped CSS variable overrides.

---

## Layer 5 — pixel-accurate specimen composition (`app/brand-system/_shared/`)

An **Astrolabe-side** composition layer that stacks on top of Layers 1–4
to produce pixel-accurate recreations of Brand Codex frames. These are
not general-purpose primitives — they live in the `app/` tree, not in
`components/`, because they hard-code specimen geometry (1920×1080
canvas, slide-reference CSS variables) and assume content will be
positioned in absolute Figma coordinates.

Think of Layer 5 as "Layer 4 in absolute mode" — a future Phase 2 of
the roadmap may merge it into `HudFrame` as a `geometry="absolute"`
prop. Until then, it lives separately to keep the responsive `HudFrame`
simple.

### `<SpecimenFrame />`

**File:** `app/brand-system/_shared/SpecimenFrame.tsx`
**Freedom tier:** LOW — canvas dimensions, rail geometry, chrome anchor
positions, and the top-left shell-mode split are all non-negotiable
Figma coordinates.

Bundles the 1920×1080 canvas, JS-computed scale transform (fits the
slide to any viewport), scoped `SLIDE_HUD_VARS` CSS variable override
(pins `--hud-rail-top: 111px` etc. at the container level), and every
invariant chrome anchor from the Text+Image family: left+right rails
(`<HudRail />`), compass waypoint, brandmark + terminator, chapter
label, pagination label, optional 9-row inner grid, and the top-left
treatment (logo lockup OR L-bracket, picked by whether `clientLogo`
is provided).

```tsx
type SpecimenFrameProps = {
  /** 9-row inner content grid hairlines. Default true. */
  showInnerGrid?: boolean;
  /** When provided → ClientShell (logo + terminator rule). Omit → GridShell (30x30 L-bracket). */
  clientLogo?: { src: string; alt: string };
  /** Top-right chapter label. Default "Chapter 01". */
  chapter?: string;
  /** Bottom-right pagination. Rendered as zero-padded "01". */
  paginationIndex?: number;
  /** Absolute-positioned content inside the 1920×1080 canvas. */
  children: React.ReactNode;
};
```

**Named exports:**

| Export                | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `SpecimenFrame`       | Main composition component                        |
| `SLIDE_W` / `SLIDE_H` | `1920` / `1080` literal constants                 |
| `SLIDE_HUD_VARS`      | Scoped CSS variable object for the canvas wrapper |

**Usage:**

```tsx
import { SpecimenFrame } from "../_shared/SpecimenFrame";

export default function MySpecimenPage() {
  return (
    <SpecimenFrame
      clientLogo={{ src: "/logos/Lotus-Semantic Dawn.png", alt: "Lotus" }}
      chapter="Chapter 01"
      paginationIndex={1}
    >
      {/* Your variant-specific absolute-positioned content */}
    </SpecimenFrame>
  );
}
```

### `<TextImgUnderstandingImage />` and `<TextImgUnderstandingText />`

**File:** `app/brand-system/_shared/TextImgContent.tsx`
**Freedom tier:** LOW — image bounds, text block bounds, union
wrapper positions, and content strings are verbatim from the canonical
Figma source (`1802:5717` + its LogoOff / diagonal siblings).

The shared content used by every Text+Image specimen (1a, 1b, 2a, 2b,
3a, 3b). A single file holds the image block + corner union map + the
"Understanding AI as a System of Meaning" Definition text block so
that adding a new variant page is purely configuration.

```tsx
export type TextImgUnion = "tl" | "tr" | "bl" | "br";

export function TextImgUnderstandingImage({
  unions,
}: {
  unions: readonly TextImgUnion[];
}): JSX.Element;

export function TextImgUnderstandingText(): JSX.Element;

export function TextImgLoading(): JSX.Element; // shared auth-loading shell
```

Internally declares the 4 union anchor positions once:

```tsx
const UNION_POSITIONS = {
  tl: { x: 893.73, y: 141.71 },
  tr: { x: 1649.46, y: 141.71 },
  bl: { x: 893.66, y: 811.27 },
  br: { x: 1649.46, y: 811.27 },
} as const;
```

Each variant page passes a `unions` subset:

| Variant                  | `unions` prop              |
| ------------------------ | -------------------------- |
| 1a / 1b (all 4)          | `["tl", "tr", "bl", "br"]` |
| 2a / 2b (TR+BL diagonal) | `["tr", "bl"]`             |
| 3a / 3b (TL+BR diagonal) | `["tl", "br"]`             |

### Example specimen page (the whole file)

```tsx
"use client";

import { useRequireAuth } from "@/lib/auth/hooks";
import { SpecimenFrame } from "../_shared/SpecimenFrame";
import {
  TextImgLoading,
  TextImgUnderstandingImage,
  TextImgUnderstandingText,
} from "../_shared/TextImgContent";

export default function TextImg2aPage() {
  const { loading } = useRequireAuth();
  if (loading) return <TextImgLoading />;

  return (
    <SpecimenFrame chapter="Chapter 01" paginationIndex={1}>
      <TextImgUnderstandingImage unions={["tr", "bl"]} />
      <TextImgUnderstandingText />
    </SpecimenFrame>
  );
}
```

That is the entire page file. ~30 lines. Adding variant N+1 means
picking a `unions` subset and optionally a `clientLogo`. Anything more
complex than that is a signal that the content primitive needs
extending (or the variant doesn't belong to the Text+Image family).

### Hard rule for Layer 5

**Never duplicate `SpecimenFrame`'s scaffolding inside a page file.**
If a page starts growing past ~50 lines with anything that looks like
rail positioning, compass math, chrome anchor geometry, or scale
transforms, the abstraction has leaked. Fold the repetition back into
`SpecimenFrame` or a new `_shared/` helper before adding the next
variant.

The current family (6 variants) is ~180 lines total of page code. A
regression here looks like "per-page file exceeding 100 lines".

---

## CSS variable contract (read by all primitives)

All primitives resolve positions via these custom properties. Override
at a container level to scope geometry changes without touching
`app/globals.css`.

| Var                                                         | Role                                              |
| ----------------------------------------------------------- | ------------------------------------------------- |
| `--hud-margin`                                              | Outer inset from viewport edge for chrome anchors |
| `--hud-rail-top`                                            | Rail aside top offset                             |
| `--hud-rail-bottom`                                         | Rail aside bottom offset                          |
| `--hud-rail-width`                                          | Rail aside width                                  |
| `--hud-rail-guide-inset`                                    | Guide line offset from rail aside's outer edge    |
| `--hud-corner-zone`                                         | Anchor-group vertical clearance (NOT tick insets) |
| `--gold`, `--dawn`, `--dawn-08`, `--void`, `--surface-0..2` | Color tokens                                      |

Specimen values for the 1920×1080 reference frame are documented in
`hud-frame-implementation.md` §6.

---

## Hard rule (LOW freedom)

**Never inline rail markup, tick math, or chrome anchor positioning in
a page component.** Always compose from the primitives above. If a new
visual need can't be expressed through the existing primitive surface,
**add a new primitive to `components/hud/`** (or `components/brand/`
for brand atoms) rather than inlining ad-hoc code in a page.

When you add a new primitive:

1. Follow the existing naming convention (`Hud*` or brand-atom name).
2. Read any SVG path data from the Figma source via `use_figma` and
   inline it (see `figma-to-code-playbook.md`).
3. Use `currentColor` as the default fill so Tailwind `text-*`
   utilities can recolor.
4. Export the component from the barrel (`components/hud/index.ts` or
   `components/brand/index.ts`) and add an entry to this document.
5. If the primitive consumes a new CSS variable, add it to
   `hud-frame-implementation.md` §6.
