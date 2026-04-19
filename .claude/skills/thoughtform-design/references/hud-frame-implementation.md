# HUD Frame Implementation

Canonical rules for the Thoughtform navigational HUD system. Every value
in this document is derived directly from the Brand Codex Grid (New)
canvas via the Figma MCP, verified by DOM measurement against the runtime.

**Figma source:** file `XO8yGN90SfxiG1hmYPGYXn`, node `1802:5717`
("TEXT+IMG 1a" / Understanding AI as a System of Meaning). Rail groups:
`1802:5921` (left), `1853:488` (right "Sidebar Icon").

**Runtime primitives:** `components/brand/*`, `components/hud/*`,
`lib/navigation/rail-contract.ts`. API reference: `primitives-api.md`.
Workflow for porting new Figma frames: `figma-to-code-playbook.md`.

**Freedom tier: LOW.** Every number in this document is an exact,
non-negotiable invariant. The only element subject to adaptation is
content inside the safe zone. Rails, anchors, rhythm, and geometry are
frozen.

---

## 1. Anatomy

The HUD frame is composed of exactly these elements. Nothing more,
nothing less.

### Shared primitives (present in every canonical specimen)

| Element                        | Position (1920×1080 ref)      | Size                                    | Figma node            | Runtime primitive                                    |
| ------------------------------ | ----------------------------- | --------------------------------------- | --------------------- | ---------------------------------------------------- |
| Left rail group                | x=35.85, y=111                | 21×850                                  | `1802:5921`           | `<HudRail side="left" />`                            |
| Right rail group               | x=1865.17, y=111              | 21×850                                  | `1853:488`            | `<HudRail side="right" />`                           |
| Top-left client logo slot      | x=56, y=47 bounding ~102×48   | variable                                | `1802:5944`           | `<HudLogoSlot />` or page-level `<img>`              |
| Top-left 30px terminator rule  | x=158.15, y=58.67             | 30×1                                    | `1802:5961`           | inline div in specimen                               |
| Compass diamond                | x=50.35, y=175.67             | 11.977×11.977 (8.469 inner rotated 45°) | `1802:5943`           | inline div (decorative)                              |
| Compass line (50px horizontal) | x=49.85, y=181.66             | 50.205×1                                | `1802:5934`           | inline div (fills 8.33% tick grid slot on LEFT rail) |
| Brandmark                      | x=36.67, y=992.63             | 40.13×40.5                              | `1802:5935`           | `<Brandmark />` or `<HudBrandmarkAnchor />`          |
| Brandmark terminator tick      | x=86.71, y=1012.57            | 30×1 (horizontal)                       | `1802:5933`           | inline div                                           |
| Top-right chapter label        | y=48.98, right edge x=1865.71 | PT Mono 18.575px gold @60% opacity      | `1853:504`            | `<HudChapterAnchor label="CHAPTER 01" />`            |
| Top-right 30px rule            | x=1713.84, y=58.98            | 30×1                                    | `1853:505`            | part of `HudChapterAnchor`                           |
| Bottom-right pagination text   | center x=1866.19, y=1007.4    | PT Mono 14px                            | `1853:510`/`1853:511` | `<HudPaginationAnchor />`                            |
| Bottom-right 30px rule         | x=1815.83, y=1012.92          | 30×1                                    | `1853:508`            | part of `HudPaginationAnchor`                        |

### What was REMOVED from the canonical file (late 2026 refactor)

Earlier versions of the file contained two crosshair ornaments (`Group
268` at `1802:5917` and `Group 269` at `1802:5910`) paired with the
chapter and pagination labels. **These were removed.** The current
canonical chrome is just `rule + text` at each of the top-right and
bottom-right anchors. Earlier iterations of this doc described those
ornaments; if you see them in older skills output or legacy
components, treat them as deprecated.

---

## 2. Rail geometry (hard invariant — LOW freedom)

At the 1920×1080 reference frame:

| Measurement                                               | Value   |
| --------------------------------------------------------- | ------- |
| Rail top y                                                | **111** |
| Rail bottom y                                             | **961** |
| Rail height                                               | **850** |
| Rail group width                                          | 21      |
| Rail aside `--hud-rail-width`                             | 82      |
| Rail aside margin from viewport edge `--hud-margin`       | 48      |
| Rail guide inset from aside edge `--hud-rail-guide-inset` | 9       |
| Guide line absolute x (left rail)                         | ~56     |
| Guide line absolute x (right rail)                        | ~1865   |

At other viewports, these values scale via CSS `clamp()` in the
responsive shell (see §8) or via scoped CSS variable overrides in a
specimen container (see §9).

---

## 3. Rail tick grid — 13-position bearing variant (hard invariant — LOW freedom)

**This section defines the canonical bearing-grid variant used on fixed-canvas static artifacts (slides, proposals, 9:16 portraits, 1:1 squares).** For scroll-driven web surfaces, see §3b — the depth-gauge variant is a different canonical, not a deviation from this one. Both variants are first-class LOW-freedom canonicals in a family of **exactly two**.

Both rails use an **equal-spacing grid of 13 positions** across the full
850px rail height. Intervals are exactly `850 / 12 ≈ 70.83px`, giving
percentages at multiples of `100/12 ≈ 8.33%`.

| idx | yPct      | abs y | role                                                                                                                                      |
| --- | --------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | 0.00      | 111   | **top edge tick** — 7px minor (baked into `Vector 4 (Stroke)` compound path, see §4)                                                      |
| 1   | 8.33      | 181   | **LEFT**: compass line at this grid slot — 50px sibling node `1802:5934`, NOT in the rail group. **RIGHT**: regular 7px minor `1853:496`. |
| 2   | 16.67     | 252   | minor                                                                                                                                     |
| 3   | 25.00     | 323   | minor                                                                                                                                     |
| 4   | **33.33** | 394   | **MAJOR (21px)** — bearing label "2"                                                                                                      |
| 5   | 41.67     | 465   | minor                                                                                                                                     |
| 6   | 50.00     | 535   | minor                                                                                                                                     |
| 7   | 58.33     | 606   | minor                                                                                                                                     |
| 8   | **66.67** | 677   | **MAJOR (21px)** — bearing label "5"                                                                                                      |
| 9   | 75.00     | 748   | minor                                                                                                                                     |
| 10  | 83.33     | 818   | minor                                                                                                                                     |
| 11  | 91.67     | 889   | minor                                                                                                                                     |
| 12  | 100.00    | 961   | **bottom edge tick** — 7px minor (baked into `Vector 4 (Stroke)`)                                                                         |

### Runtime tick arrays

```ts
// lib/navigation/rail-contract.ts

// LEFT rail: 12 ticks (skips index 1 because the compass line fills
// that slot as a sibling node, not a rail tick).
export const HUD_TICK_MARKS: readonly HudTickMark[] = [
  { yPct: 0, widthPx: 7, major: false },
  { yPct: 16.67, widthPx: 7, major: false },
  { yPct: 25, widthPx: 7, major: false },
  { yPct: 33.33, widthPx: 21, major: true },
  { yPct: 41.67, widthPx: 7, major: false },
  { yPct: 50, widthPx: 7, major: false },
  { yPct: 58.33, widthPx: 7, major: false },
  { yPct: 66.67, widthPx: 21, major: true },
  { yPct: 75, widthPx: 7, major: false },
  { yPct: 83.33, widthPx: 7, major: false },
  { yPct: 91.67, widthPx: 7, major: false },
  { yPct: 100, widthPx: 7, major: false },
];

// RIGHT rail: 13 ticks (includes 8.33% as a regular 7px minor since
// there's no compass line on the right — it's Figma node 1853:496).
export const HUD_TICK_MARKS_RIGHT: readonly HudTickMark[] = [
  { yPct: 0, widthPx: 7, major: false },
  { yPct: 8.33, widthPx: 7, major: false },
  { yPct: 16.67, widthPx: 7, major: false },
  { yPct: 25, widthPx: 7, major: false },
  { yPct: 33.33, widthPx: 21, major: true },
  { yPct: 41.67, widthPx: 7, major: false },
  { yPct: 50, widthPx: 7, major: false },
  { yPct: 58.33, widthPx: 7, major: false },
  { yPct: 66.67, widthPx: 21, major: true },
  { yPct: 75, widthPx: 7, major: false },
  { yPct: 83.33, widthPx: 7, major: false },
  { yPct: 91.67, widthPx: 7, major: false },
  { yPct: 100, widthPx: 7, major: false },
];
```

`HudRail` picks the right array based on the `side` prop. Tick widths
are 7px minor or 21px major — no other sizes. The compass line
(50.205px) is NOT a tick width; it's a distinct primitive rendered
outside `HudRail`.

### Tick container spans the FULL rail

The tick container inside `HudRail` is `inset-0` — no
`--hud-corner-zone` inset, no top/bottom padding. Ticks at yPct=0 land
exactly at rail top, yPct=100 at rail bottom. Earlier versions of this
spec used a corner-zone-inset inner zone; that is deprecated. Corner-zone
still exists as a CSS variable but is used ONLY for anchor group
vertical clearance, never for tick container sizing.

---

## 3b. Tick density variants — the family (LOW freedom)

The HUD tick grid exists in **exactly two canonical variants**. Both are frozen LOW-freedom canonicals; what's MEDIUM-freedom is _which one applies to a given format_. The family is capped — a third variant requires a skill-level change with explicit justification, not a per-format invention.

### Selection rule

Start with one question: **does the rail represent a static waypoint location, or a continuous depth/progress?**

- **Static waypoint** (where this artifact sits in a narrative or composition) → **bearing variant (13-pos)**. Slides, A4/XL proposals, 9:16 static portraits, 1:1 squares, any fixed-canvas export.
- **Continuous depth** (how far through a scrollable surface) → **depth-gauge variant (21-pos)**. Responsive web shells, scroll-driven app shells. The chevron's `top` position is driven by `scrollProgress`, so ticks must correspond to proportional depth.

If neither semantic applies cleanly, default to the bearing variant unless the format genuinely introduces a new scroll/progress dimension. When in doubt, ask rather than invent.

### Variant table

| Variant          | Positions         | Spacing        | Majors                               | Label scheme                   | Label values                       | Applies to                                                              |
| ---------------- | ----------------- | -------------- | ------------------------------------ | ------------------------------ | ---------------------------------- | ----------------------------------------------------------------------- |
| **Bearing grid** | 13 (indices 0–12) | 8.33% (100/12) | indices 4, 8 (33.33%, 66.67%)        | bearings on the two majors     | `"2"`, `"5"`                       | Slides, proposals (A4/XL), 9:16 static, 1:1, all fixed-canvas artifacts |
| **Depth gauge**  | 21 (indices 0–20) | 5% (100/20)    | every 5th (indices 0, 5, 10, 15, 20) | depth readings on all 5 majors | `"0"`, `"2"`, `"5"`, `"7"`, `"10"` | Responsive web (scroll-driven), app shells with scroll-state chevron    |

### Depth-gauge variant — formal spec

v5's HUDFrame canonicalizes this variant. Canonical values:

```ts
const tickCount = 20; // 21 ticks total (indices 0–20)
const tickLabels: Record<number, string> = {
  0: "0",
  5: "2",
  10: "5",
  15: "7",
  20: "10",
};
```

```css
.tick-minor {
  height: 1px;
  width: 10px;
  background: var(--gold-50);
}
.tick-major {
  height: 1px;
  width: 20px;
  background: var(--gold);
} /* every 5th */
```

Ticks are rendered inside the rail's tick container and distributed with `justify-content: space-between`, producing exact 5% intervals. Labels sit 24px inward from the rail (left rail: `left: 24px`; right rail: `right: 24px`), in mono 9px `var(--dawn-30)`.

The chevron on the depth-gauge variant is scroll-driven:

```tsx
<div className="scale-indicator" style={{ top: `${scrollProgress * 100}%` }} />
```

10×10 rotated diamond + 2px horizontal gold bar. See `web-format-patterns.md` §3 for the full contract.

### Why cap the family at two

Adding a third variant — a "compact mobile" count, a "proposal-only" count, a "social-only" count — would:

- Blur the LOW-freedom guarantee (you can no longer memorize a canonical; you always have to look it up).
- Open the door to "just pick a number that looks good for my format," which is exactly the drift the skill exists to prevent.
- Make the chevron / compass geometry inconsistent across formats, breaking the always-on anchor rule.

The two canonicals cover the two real semantics (static location, continuous descent). Mobile rendering of the depth gauge (label-hiding, width-reducing) is a **responsive behavior** within the depth-gauge variant, not a third variant. See §3c.

### Cross-reference

The format adaptation matrix (`format-adaptation-matrix.md`) tells you which variant each format uses. Format-specific docs (`web-format-patterns.md`, `mobile-format-patterns.md`, `presentation-patterns.md`, `proposal-patterns.md`) detail the chrome and rhythm rules that go with each.

---

## 3c. Responsive behavior across variants

Tick variant selection is determined by format semantics (§3b). Tick _rendering_ adapts to viewport size within the chosen variant.

### Bearing variant — responsive

The bearing variant applies on fixed-canvas artifacts. "Responsive" here means scale-factor adaptation, not breakpoint adaptation — all proportional values scale via `--tf-scale = min(w, h) / 1080`. Tick widths (7/21px at reference) scale with the canvas; the tick count does not change.

When a fixed-canvas artifact is viewed on a small screen (e.g. a slide deck exported to PDF and opened on a phone), the viewer is expected to zoom — there is no label-hiding behavior. The artifact is a fixed document.

### Depth-gauge variant — responsive

The depth-gauge variant applies on responsive web, where the viewport IS the canvas. Tick rendering steps with breakpoints:

| Viewport              | Tick minor width | Tick major width | Tick labels             |
| --------------------- | ---------------- | ---------------- | ----------------------- |
| **>1100px desktop**   | 10px             | 20px             | visible on all 5 majors |
| **900–1100px tablet** | 10px             | 20px             | hidden                  |
| **≤768px mobile**     | 6px              | 12px             | hidden                  |
| **≤480px micro**      | 5px              | 10px             | hidden                  |

The tick **count stays at 21** across every breakpoint. What changes is visual weight and label visibility. The depth semantic (continuous descent from 0 to 10) holds at every size — even without labels, the major cadence reads as "fifths" and the chevron's scroll-progress position is legible.

### Shell LOW, variant selection MEDIUM

The SHELL itself — rails, chevron, anchors, compass — is LOW freedom across both variants. You cannot omit an always-on anchor, invent a new chevron shape, or reposition the brandmark. What is MEDIUM is _which variant applies_ per format, chosen via the selection rule in §3b.

---

## 4. Vector 4 (Stroke) — compound path trap

The Figma node `1802:5932` (left rail) and `1853:501` (right rail),
named "Vector 4 (Stroke)", **is a compound filled path**, not a simple
guide line. Its single `<path>` polygon traces three separate visual
regions:

```svg
<path d="M0.0449 0 V1.00174 H6.16504 V848.972 H0 V849.974 H7.16504 V0 H0.0449 Z" fill="#CAA554"/>
```

Walking the polygon yields:

1. A **7px horizontal bar** at y=0–1 (→ **top edge tick** at rail y=111)
2. A **thin 1px vertical column** from y=1 to y=849 (→ **vertical guide line**)
3. A **7px horizontal bar** at y=849–850 (→ **bottom edge tick** at rail y=961)

If you walk the rail group looking for top/bottom ticks as separate
`VECTOR`/`RECTANGLE` nodes, you will not find them — they are part of
this compound path. Earlier iterations of this skill got the tick count
wrong because they treated Vector 4 as "the guide line" alone.

**The runtime `HUD_TICK_MARKS` array inlines both edge ticks at indices
0 and 12 so consumers never have to reason about the compound path.**
If you're porting a new Figma rail, always export any
`Vector #` node as `SVG_STRING` via `use_figma` and read the path data
before assuming it represents a single shape.

---

## 5. Chrome anchors (post-refactor, LOW freedom)

Four anchor groups at fixed positions, all composed from
`components/hud/*` primitives.

### 5.1 Top-left (two modes)

The top-left corner has two canonical treatments. Pick by shell mode
and do not mix them — client shell = logo + rule, grid shell = L-bracket
alone.

#### 5.1a Client shell — logo lockup

- **Slot bounding box:** `(56, 35, 102, 48)` — wide enough to admit any
  proportionally scaled client logo without overflowing the 30px rule
- **Content:** client logo via `<img src>` with `object-fit: contain`.
  Aspect ratio preserved, left-aligned inside the slot, vertically
  centered on the terminator rule at y=58.67.
- **Terminator rule:** 30px horizontal hairline at `(158.15, 58.67)` —
  Figma `1802:5961`
- **Figma source:** `1802:5944` is a Poppins client lockup in the file;
  parameterize via `CLIENT_LOGO_SRC` constant so the slot is reusable.
- **Used by variants:** 1a, 2b, 3b (`ClientShell` in the LogoOn pairs).

#### 5.1b Grid shell — L-bracket icon

- **30×30 top-left L-bracket** at `(56.33, 63.01)` — Figma `1767:2551`
  ("Rectangle 55")
- **Path data:** `M30.5 0.5H0.5V30.5` — literally the top edge + left
  edge of a 30×30 square at 1px stroke. Not a crosshair, not a diamond.
- **No terminator rule.** The grid shell has only the L-bracket; the
  client shell adds the (158.15, 58.67) rule. Do not render both.
- **Renders cleanly as CSS borders:** a div with
  `border-top: 1px solid var(--gold)` +
  `border-left: 1px solid var(--gold)` produces the visual pixel-for-pixel
  without an inline SVG.
- **Used by variants:** 1b, 2a, 3a (`GridShell` in the LogoOff pairs).
- **Known drift:** the responsive `components/hud/HudTopLeftIcon.tsx`
  primitive currently renders a guessed crosshair+diamond+rule glyph,
  not this L-bracket. Fix pending — until then, specimen pages use
  the inline `TopLeftGridIcon` sub-component inside `SpecimenFrame.tsx`.

### 5.2 Top-right: chapter label

- **30px horizontal rule** at `(1713.84, 58.98)` — Figma `1853:505`
- **"CHAPTER 01" text** at `y=48.98`, right-anchored so right edge lands
  at `x=1865.71`. PT Mono Regular, 18.575px, gold, opacity 0.6 —
  Figma `1853:504`
- **No ornament.** Old Group 268 crosshair was removed.

### 5.3 Bottom-left: brandmark + compass cluster

- **Brandmark** at `(36.67, 992.63, 40.13×40.5)` — Figma inset
  `[91.91% 96% 4.34% 1.91%]` resolves here on a 1080-tall frame. Earlier
  docs' y=996.5 was 4 pixels off.
- **Horizontal terminator tick** at `(86.71, 1012.57)` — 30×1 horizontal
  (wrapped in a `-rotate-90` container in the Figma code emit; the
  outer bounding box is the source of truth, see §7).
- **Compass waypoint at the top of the rail** (NOT at the bottom-left):
  - Gold-filled diamond `8.469×8.469` rotated 45° at `(50.35, 175.67)`,
    border `3px solid #1c1c1c` — Figma `1802:5943`
  - 50px horizontal compass line at `(49.85, 181.66)` — Figma `1802:5934`.
    This sits at the 8.33% grid slot that the left rail skips, acting
    as a "you are here" waypoint marker.

### 5.4 Bottom-right: pagination

- **"01" text** centered at `(1866.19, 1007.4)` — PT Mono Regular 14px
  gold — Figma `1853:510`/`1853:511`
- **30px horizontal rule** at `(1815.83, 1012.92)` — Figma `1853:508`
- **No ornament.** Old Group 269 crosshair was removed.

---

## 6. CSS variable contract

Every primitive resolves positions via these CSS custom properties.
Override at a container level to scope geometry changes (e.g. a
specimen page) without touching `app/globals.css`.

| Var                      | Specimen (1920×1080)           | Responsive (globals.css)                    |
| ------------------------ | ------------------------------ | ------------------------------------------- |
| `--hud-margin`           | `48px`                         | `clamp(16px, min(2.8125vw, 5vmin), 54px)`   |
| `--hud-rail-top`         | `111px`                        | `clamp(32px, min(2.604vw, 4.63vmin), 50px)` |
| `--hud-rail-bottom`      | `119px`                        | `clamp(32px, min(2.604vw, 4.63vmin), 50px)` |
| `--hud-rail-width`       | `82px`                         | `clamp(48px, 4.27vw, 82px)`                 |
| `--hud-rail-guide-inset` | `9px`                          | `clamp(5px, 0.47vw, 9px)`                   |
| `--hud-corner-zone`      | `45px` (anchor clearance only) | `clamp(28px, 4.17vmin, 45px)`               |

**Note:** `--hud-corner-zone` is used for anchor-group vertical clearance,
NOT for insetting the tick container. The tick container spans the full
rail via `inset-0`.

---

## 7. Hard rules (low freedom — do not deviate)

1. **Never inline rail markup or tick math in a page component.** Always
   compose from `HudRail`, `HudFrame`, and the atomic primitives in
   `components/brand/*` and `components/hud/*`. Custom ticks or rails
   outside the primitive layer will drift from the canonical grid.

2. **Two canonical tick variants, no intermediates.** Bearing grid (13 positions, 8.33% spacing, majors at indices 4+8) for fixed-canvas static artifacts. Depth gauge (21 positions, 5% spacing, majors every 5) for scroll-driven responsive surfaces. See §3b for the family and §3c for responsive behavior within each variant. Do not invent per-format tick counts.

3. **Tick container spans the full rail** (`inset-0`), no
   corner-zone inset. Top and bottom edge ticks (indices 0 and 12)
   land at rail top and rail bottom respectively.

4. **Rail y=111 → y=961** at 1920×1080 reference. Rail height = 850.
   Guide line is a single 1px vertical stroke running the full height,
   wrapped in `Vector 4 (Stroke)` compound path in the Figma source.

5. **Majors at indices 4 and 8** (33.33% and 66.67%). Labels "2" and
   "5" via `leftRailTickLabel`. No "7" — that was a Sigil-era artefact
   from the old equal-24 scale.

6. **Post-refactor chrome has no corner ornaments.** Top-right and
   bottom-right are just `rule + text`. Old Group 268 (`1802:5917`)
   and Group 269 (`1802:5910`) crosshair nodes were removed from the
   canonical file.

7. **The compass line sits at a tick-grid slot, not as a floating
   decoration.** It occupies the 8.33% grid position on the left rail,
   aligned exactly one equal-spacing step above the first mid tick
   (y=181 = first tick y=252 minus one step of ~71px).

8. **Brandmark y=992.63, not y=996.5.** Inset `[91.91% 96% 4.34% 1.91%]`
   resolves to `(36.67, 992.63, 40.13, 40.5)` on 1920×1080. The
   earlier `y=996.5` value was 4px off.

9. **No standalone L-corner brackets** at the four viewport corners.
   The canonical design uses rails + chrome anchors for visual framing.
   Standalone corners remain as an opt-in back-compat flag
   (`HudFrame.showCornerBrackets`) pending removal in the Astrolabe
   shell migration.

10. **All terminator ticks are HORIZONTAL (30×1), not vertical (1×30).**
    The Figma wraps them in a `-rotate-90` three-div sandwich but the
    outer bounding box dimensions (`h-px w-[30px]`) are always
    horizontal. See §8 for the MCP emit trap.

---

## 8. Reading MCP code emit (the rotation trap)

The Figma MCP returns rotated shapes as a three-div sandwich:

```html
<div class="absolute flex h-px items-center justify-center left-[X] top-[Y] w-[30px]">
  <div class="-rotate-90 flex-none">
    <div class="h-[30px] relative w-px"><img src="..." /></div>
  </div>
</div>
```

**The outer div is the bounding box and the real visual**. The inner
div's layout dimensions (`h-[30px] w-px` = 1×30) are misleading — the
`-rotate-90` transform on the middle div rotates the inner shape so its
visual orientation matches the outer box (`h-px w-[30px]` = 30×1
horizontal).

**Rule of thumb:** when the Figma emit wraps a shape in a rotated
container, trust the outer box dimensions, not the inner element's
layout size. This burned prior iterations of this spec — the bottom-left
brandmark tick and top-left lockup terminator were initially rendered
as 1×30 vertical sticks when they should be 30×1 horizontal dashes.

For an exhaustive extraction workflow that avoids this and other traps,
see `figma-to-code-playbook.md`.

---

## 9. Responsive shell vs pixel-accurate specimen

The same primitives work in both modes.

### 9.1 Responsive shell (`/canon`, `/arcs`, app chrome)

`NavigationGrid` wraps pages in `HudFrame` using the global CSS
variable values from `app/globals.css`. Rails scale via `clamp()` and
hide entirely at viewports ≤ 1100px via
`.tf-hud-rail-tick { display: none }`. Tick percentages stay constant
across viewport sizes — the inner rail height scales but the
proportional layout is preserved.

### 9.2 Pixel-accurate specimen (`/brand-system/understanding-ai`)

A fixed 1920×1080 canvas wrapped in a
`transform: scale(min(vw/1920, vh/1080))` container. Scoped CSS
variable overrides (`SLIDE_HUD_VARS`) set the slide-reference geometry
(`--hud-rail-top: 111px` etc.) at the container level without affecting
the app shell. Elements position via absolute Figma coordinates
(`left: 156.51, top: 171`) read directly from the canonical frame.

Both modes scale proportionally. The 13-position tick grid gives equal
visual spacing at any viewport size.

---

## 10. Content rhythm tokens (medium freedom)

Interior content gaps use semantic presets, not viewport-derived
scaling.

| Token                 | Value | Use case             |
| --------------------- | ----- | -------------------- |
| `--tf-rhythm-inline`  | 15px  | Eyebrow icon-to-text |
| `--tf-rhythm-compact` | 20px  | Dense telemetry      |
| `--tf-rhythm-default` | 28px  | Web/editorial        |
| `--tf-rhythm-large`   | 36px  | Spacious web         |
| `--tf-rhythm-relaxed` | 45px  | Presentation/keynote |
| `--tf-panel-padding`  | 53px  | Panel inset          |

Choose per layout intent, not per viewport size.

---

## 11. Text + Image composition family (LOW freedom for variant matrix)

Variations 1–3 of the text-left / image-right archetype. Each has a
LogoOff (GridShell) and LogoOn (ClientShell) pair, giving six total
canonical specimen frames. All six share the same image bounds, text
block, and chapter/pagination chrome — they differ on **only two axes**:

1. **Shell mode** — `grid` (30×30 L-bracket top-left) vs `client`
   (logo slot + 30px terminator rule top-left)
2. **Corner union subset** — all 4, TR+BL diagonal, or TL+BR diagonal

### 11.1 Variant matrix

| Variant | Figma       | Shell            | Unions                    |
| ------- | ----------- | ---------------- | ------------------------- |
| 1a      | `1802:5717` | client (logo)    | TL + TR + BL + BR (all 4) |
| 1b      | `1767:2327` | grid (L-bracket) | TL + TR + BL + BR (all 4) |
| 2a      | `1767:2841` | grid             | TR + BL (diagonal A)      |
| 2b      | `1802:6500` | client           | TR + BL (diagonal A)      |
| 3a      | `1767:3360` | grid             | TL + BR (diagonal B)      |
| 3b      | `1802:6767` | client           | TL + BR (diagonal B)      |

**Correction log (2026-04):** Variant 3 was previously described as
"4 corner unions (alt)". `use_figma` tree-walker confirms it is only
2 unions (TL+BR) — the complementary diagonal to variant 2's TR+BL.
The codex map and this section have been corrected.

### 11.2 Shared content (LOW freedom)

Every variant uses the same coordinates for everything except the
shell top-left:

- **Image rect:** `(965.97, 214.04)` 738×652
- **Definition Container (text block):** `(156.51, 171)` 647×453.54
- **Chapter / pagination labels:** `"CHAPTER 01"` / `"01"`
- **Union wrapper positions:** TL `(893.73, 141.71)`, TR `(1649.46, 141.71)`, BL `(893.66, 811.27)`, BR `(1649.46, 811.27)` — each 128×128. Pair with `HudUnionCorner` variant prop to handle per-corner flipping. These positions are the axis-aligned React wrapper boxes, NOT the raw Figma rotation coordinates — do not re-offset.

### 11.3 Typography invariants

Text block always at `(156.51, 171, 647)`. Heading PT Mono Bold 50px
dawn uppercase. Body 20px PT Mono with gold bold spans, leading 1.1.
Bullets use `StarGlitch` markers at 20px with 32.22px text inset and
44px row rhythm. Eyebrow uses `StarBurst` at 29px + 25px PT Mono label.

### 11.4 Astrolabe implementation

Each variant ships as a pixel-accurate code recreation at
`/brand-system/<slug>`. The 6 pages total ~180 lines of page code
between them — the shared `SpecimenFrame` + `TextImgContent` helpers
absorb the repetition. For file paths and the composition API, see
`primitives-api.md` §5.

### 11.5 Variation 4 (not yet ported)

**Variation 4:** Full-bleed right-half image, chrome repositioned to
the left-half midline. Figma pairs `1802:7379` / `1767:3622`. Not
currently implemented in the Astrolabe specimen family — requires a
new composition pattern because the shared `TextImgContent` layout
assumes inset media. Flag when the fourth variant is on the roadmap.

For the full list of canonical specimen node IDs and union positions,
see `figma-codex-map.md`.

---

## 12. Where to look when stuck

| Problem                             | File                                             |
| ----------------------------------- | ------------------------------------------------ |
| New HUD primitive needed            | `primitives-api.md`, then `components/hud/`      |
| Porting a Figma frame to code       | `figma-to-code-playbook.md`                      |
| Node ID for a specific element      | `figma-codex-map.md`                             |
| Token values (color, type, spacing) | `tokens.md`                                      |
| Conceptual navigation vocabulary    | `navigation-grammar.md`                          |
| Slide archetype guidance            | `presentation-patterns.md`                       |
| Why this document changed last      | `git log references/hud-frame-implementation.md` |
