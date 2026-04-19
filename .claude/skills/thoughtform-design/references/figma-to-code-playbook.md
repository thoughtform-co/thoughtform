# Figma to Code Playbook

Workflow for porting a Brand Codex frame to pixel-accurate React code
using the `components/brand/*` and `components/hud/*` primitive system.
Captures the traps that burned earlier iterations so they don't recur.

**Freedom tier: LOW.** The steps, ordering, and verification points
below are a checklist, not suggestions. Skipping any of them has
historically led to multi-iteration debugging.

---

## Phase 1 — Reconnaissance (before writing any code)

### 1.1 Screenshot the target frame

```
mcp__figma__get_screenshot(fileKey, nodeId)
```

Keep the image visible alongside your editor. This is your single
visual reference. Don't rely on memory of the frame from a previous
session — the file changes.

### 1.2 Screenshot every relevant sub-region

Don't just screenshot the full frame. For the Understanding AI
specimen, the useful sub-screenshots are:

| Node ID     | Name                        | What to look at                                |
| ----------- | --------------------------- | ---------------------------------------------- |
| `1802:5920` | Left Border Container       | Rail + brandmark + compass cluster as one unit |
| `1802:5944` | Top-left client logo lockup | Lockup bounds + terminator rule                |
| `1853:488`  | Right Sidebar Icon          | Rail + chapter + pagination as one unit        |
| `1802:5962` | Image block + Union corners | The 4 decorative corner chamfers               |
| `1802:5969` | Definition Container        | Eyebrow + heading + body + bullets             |

Shooting sub-regions makes it trivial to spot visual details (tick
orientations, hairline positions) that disappear at full-frame scale.

### 1.3 Exhaustively walk the node tree via `use_figma`

For any group you're about to replicate, walk ALL of its descendants
and return metadata as a thrown error (see §3.1 for why thrown):

```js
const frame = await figma.getNodeByIdAsync("1802:5717");
const frameY = frame.absoluteBoundingBox.y;
const target = await figma.getNodeByIdAsync("1802:5921"); // the group in question
const leaves = [];
function walk(node) {
  const b = node.absoluteBoundingBox;
  if (b) {
    leaves.push({
      id: node.id,
      name: node.name,
      type: node.type,
      localY: +(b.y - frameY).toFixed(2),
      localX: +b.x.toFixed(2),
      w: +b.width.toFixed(2),
      h: +b.height.toFixed(2),
    });
  }
  if ("children" in node && node.children) {
    for (const c of node.children) walk(c);
  }
}
walk(target);
throw new Error("NODES=" + JSON.stringify(leaves));
```

**Always walk with a type-agnostic filter first**, then narrow. If your
filter is too narrow (e.g. only `RECTANGLE`), compound `VECTOR` nodes
will be skipped and you'll miss visual elements hiding inside them.

### 1.4 Walker skip-list for Brand Codex frames

The `Grid (New)` canvas frames contain a LOT of decorative grid noise
(ellipse-intersection dots, 6 ellipse containers with 15+ ellipses
each, background-element rectangles, numbered line segments) that will
blow past the 20kb plugin-output budget if you dump everything. For
variant-specific recon, use this skip-list regex to filter out known
decoration and only return the unfamiliar content:

```js
const NAME_SKIP =
  /ellipse|background element|tenth|ninth|eighth|seventh|sixth|fifth|fourth|third|second|top ellipse|bottom ellipse|line 3|line 4|line 5|left border container|lines container|vector 4|main container|background wrapper|group 10124462/i;

const NAME_MATCH =
  /union|image|text|content|heading|title|paragraph|body|bullet|star|eyebrow|definition|chapter|logo|pagination|sidebar|rectangle 9 \(stroke\)|brandmark/i;
```

Combine with a targeted walk that only records a node if `NAME_MATCH`
matches AND `NAME_SKIP` does NOT. For most variant recon, this cuts
output to ~5kb. If a walker still truncates at 20kb, split the work
across multiple `use_figma` calls — one frame or one region per call.

---

## Phase 2 — The Vector 4 trap (compound path detection)

Compound vector paths can hide multiple visual elements inside a single
`<path>`. The canonical example is `Vector 4 (Stroke)` on both rails
(`1802:5932` and `1853:501`), whose single filled polygon traces three
separate regions:

- A 7px horizontal bar at y=0 (**top edge tick**)
- A thin 1px vertical column from y=1 to y=849 (**guide line**)
- A 7px horizontal bar at y=849 (**bottom edge tick**)

If you walk the rail group looking for top/bottom ticks as separate
nodes, you won't find them. They live inside the compound path.

### 2.1 Always export mystery VECTOR nodes as SVG_STRING

```js
const node = await figma.getNodeByIdAsync("1802:5932");
const svg = await node.exportAsync({ format: "SVG_STRING" });
throw new Error("SVG=" + svg);
```

**Hard rule (LOW freedom):** Never guess a glyph's shape from its name,
dimensions, or position in a design. Always `exportAsync` the SVG and
read the actual path data. "Icon", "marker", "crosshair", "star" are
all lies if you haven't seen the path. This rule exists because guessing
wastes iteration cycles and breeds subtle visual drift.

**Case study — Rectangle 55 (`1767:2551`).** A 30×30 VECTOR at the
top-left of every LogoOff variant, named vaguely. Early
`components/hud/HudTopLeftIcon.tsx` guessed this as a crosshair + 4px
rotated diamond + 30px rule — three wrong elements. The actual SVG
export is a single path:

```svg
<path d="M30.5 0.5H0.5V30.5" stroke="#CAA554"/>
```

Literally the top edge + left edge of a 30×30 square. A 1px `border-top`
and `border-left` on a div produce it pixel-for-pixel. No crosshair,
no diamond, no rule. A 5-second export would have saved three commits
of re-guessing.

**When to export, without exception:**

- Any `VECTOR` node you have not personally seen the path data for
- Any group named "Icon", "Glyph", "Marker", or similar
- Any element where the design intent is unclear from the screenshot
- Any element that doesn't map cleanly to a known primitive shape

### 2.2 Read the path data

Parse the returned `<path d="...">` manually. If the path contains
multiple `M` starts OR uses `H`/`V` segments that span non-contiguous
regions, the node is compound and you must decompose it before
modeling the elements in code.

**Heuristic:** if a node named `Vector #` has a bounding box that's
substantially different from what a single primitive shape would need
(e.g. 7px wide × 850px tall for something called "guide line"), treat
it as compound and export to verify.

**Render strategy by path shape:**

| Path pattern                                      | Render with                                  |
| ------------------------------------------------- | -------------------------------------------- |
| Single `M...L...Z` closed polygon                 | Inline `<svg>` with `<path>`                 |
| L-shape (top + left or any 2 perpendicular edges) | `<div>` with 1 or 2 `border-*` sides         |
| Single horizontal/vertical line                   | `<div>` with `width`/`height` + `background` |
| Rotated primitive (via `transform`)               | Wrapper div + `transform: rotate(N deg)`     |
| Compound multi-region path                        | Decompose into separate divs/svgs per region |

CSS borders are often the cheapest way to render 1px stroke paths
because they avoid the SVG-rendering subpixel weirdness and scale
identically to the parent under `transform: scale()`.

---

## Phase 3 — Extracting glyph path data

For any brand vector (stars, icons, compound corners), extract the path
data from Figma and inline it as a React SVG component. **Never use
the `<img src="https://www.figma.com/api/mcp/asset/...">` URLs** that
`get_design_context` returns — those are MCP cache assets that expire
in 7 days.

### 3.1 The throw-as-return-channel

`use_figma` captures thrown errors but does NOT capture `console.log`
output. To return data from a plugin script, throw it:

```js
const node = await figma.getNodeByIdAsync("1802:5971");
const svg = await node.exportAsync({ format: "SVG_STRING" });
throw new Error("SVG_1802_5971=" + svg);
```

Use a unique prefix (e.g. `SVG_<nodeId>=`) so you can grep the error
message for the payload.

### 3.2 Batching multiple exports

```js
const ids = ["1802:5971", "1802:5979", "1802:5964"];
const out = {};
for (const id of ids) {
  const node = await figma.getNodeByIdAsync(id);
  out[id] = await node.exportAsync({ format: "SVG_STRING" });
}
throw new Error("BATCH=" + JSON.stringify(out));
```

Large batches can exceed the error message size limit. If the payload
gets truncated, split into smaller batches (3–4 at a time) and stitch
the results together.

### 3.3 Inline the path in a React component

```tsx
import { type SVGProps } from "react";

export function StarBurst({
  size = 29,
  color,
  title,
  className,
  ...rest
}: {
  size?: number;
  color?: string;
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, "color" | "width" | "height">) {
  const fill = color ?? "currentColor";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 29 29"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d="M29 27.5372L18.7149 17.2519..." fill={fill} />
    </svg>
  );
}
```

**Replace hardcoded `fill="#CAA554"` with `fill={color ?? "currentColor"}`**
so the component inherits Tailwind `text-*` utilities. This is what
makes `<Brandmark className="text-tensorGold" />` work.

---

## Phase 4 — The rotation trap (MCP code emit)

The Figma MCP wraps rotated shapes in a three-div sandwich:

```html
<div class="absolute flex h-px items-center justify-center left-[X] top-[Y] w-[30px]">
  <div class="-rotate-90 flex-none">
    <div class="h-[30px] relative w-px"><img src="..." /></div>
  </div>
</div>
```

**The outer div is the bounding box AND the real visual.** The inner
div's layout dimensions (`h-[30px] w-px` = 1 wide × 30 tall) are
misleading — the `-rotate-90` transform on the middle div rotates the
inner shape so its visual orientation matches the outer box
(`h-px w-[30px]` = 30 wide × 1 tall = horizontal).

**Rule of thumb:** when the Figma emit wraps a shape in a rotated
container, trust the OUTER box dimensions, not the INNER element's
layout size.

### 4.1 How this burned us

The brandmark terminator tick at `(86.71, 1012.57)` and the top-left
lockup terminator at `(158.15, 58.67)` were both initially rendered as
1×30 vertical sticks. The Figma file wraps them in `-rotate-90`
containers and the inner divs have intrinsic dimensions of 1×30 —
which look vertical at first glance. But the OUTER divs are
`h-px w-[30px]` (1 tall × 30 wide = horizontal), and that's what the
viewer actually sees. Two separate session turns were spent fixing
this.

### 4.2 When in doubt

Screenshot the individual Figma sub-node and look at it. If the visual
doesn't match your reading of the MCP code emit, you've hit the
rotation trap.

---

## Phase 5 — Positioning

### 5.1 Pixel-accurate specimen mode

For a 1:1 Figma recreation at the 1920×1080 reference frame:

```tsx
"use client";

import { type CSSProperties, useEffect, useState } from "react";

const SLIDE_HUD_VARS: Record<string, string> = {
  "--hud-margin": "48px",
  "--hud-rail-width": "82px",
  "--hud-rail-guide-inset": "9px",
  "--hud-corner-zone": "45px",
  "--hud-rail-top": "111px",
  "--hud-rail-bottom": "119px",
};

function SlideCanvas({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const sx = (window.innerWidth - 32) / 1920;
      const sy = (window.innerHeight - 32) / 1080;
      setScale(Math.min(sx, sy));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        position: "relative",
        background: "var(--void)",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        overflow: "hidden",
        color: "var(--gold)",
        ...(SLIDE_HUD_VARS as CSSProperties),
      }}
    >
      {children}
    </div>
  );
}
```

- The `transform: scale(...)` preserves pixel positions at any viewport
- CSS variable overrides scope the slide-reference geometry to the
  slide container only, without touching `app/globals.css`
- Position child elements via absolute Figma coordinates
  (`left: 156.51, top: 171`) read directly from `absoluteBoundingBox`,
  NOT via flexbox layout math

### 5.2 Responsive shell mode

For an app-shell page using `HudFrame`:

```tsx
<HudFrame
  fullScreen
  variant="full"
  shell="grid"
  chapter="CANON"
  pagination={{ index: 0, total: 12 }}
>
  <PageContent />
</HudFrame>
```

- Uses the responsive CSS variables from `app/globals.css` (`clamp()`)
- Rails auto-hide at viewport ≤ 1100px
- Do NOT override `--hud-*` vars at the page level — let the globals
  drive the layout

### 5.3 CSS `transform: scale(min(...))` pitfall

Don't use CSS `transform: scale(min(calc(...), calc(...)))` — some
browsers silently drop this and your transform ends up `none`, leaving
the canvas at full 1920×1080 with everything clipped. Compute the
scale in JavaScript via `useEffect` + `useState` and apply it as a
plain number.

---

## Phase 6 — Verification

The `preview_screenshot` tool hangs on large scaled canvases frequently
enough that you should not rely on it. Use these alternatives:

### 6.1 DOM measurements via `preview_eval`

```js
(() => {
  const slide = document.querySelector('[style*="1920"]');
  const rails = slide.querySelectorAll("aside.tf-hud-rail-tick");
  return {
    leftTicks: rails[0].children[1].children.length, // expect 12
    rightTicks: rails[1].children[1].children.length, // expect 13
    cssVars: {
      railTop: getComputedStyle(slide).getPropertyValue("--hud-rail-top"),
      railBottom: getComputedStyle(slide).getPropertyValue("--hud-rail-bottom"),
      margin: getComputedStyle(slide).getPropertyValue("--hud-margin"),
    },
    topPcts: Array.from(rails[0].children[1].children).map((r) => r.style.top),
  };
})();
```

### 6.2 Cross-check with `use_figma`

```js
const node = await figma.getNodeByIdAsync("1802:5934");
const b = node.absoluteBoundingBox;
const frameY = 1548;
throw new Error(JSON.stringify({ localY: b.y - frameY, w: b.width }));
```

Compare the DOM measurement to the Figma `absoluteBoundingBox`. If they
diverge, investigate which one is wrong — don't guess.

### 6.3 Common drifts to check before commit

- [ ] Left rail has exactly **12 ticks**, right rail has exactly **13
      ticks**
- [ ] Tick percentages are at multiples of `100/12 = 8.33%`
- [ ] `--hud-rail-top = 111px`, `--hud-rail-bottom = 119px` (specimen)
- [ ] Rail height = 850, guide line spans full rail (not inset)
- [ ] Top-right has `rule + chapter label` only — no cross-mark
      ornament (removed in post-refactor Figma)
- [ ] Bottom-right has `pagination text + rule` only — no cross-mark
      ornament (removed)
- [ ] Brandmark at `(36.67, 992.63)` — not `(36.7, 996.5)`
- [ ] Compass line at `(49.85, 181.66)` occupies the 8.33% grid slot
      on the left rail
- [ ] All terminator ticks are HORIZONTAL (30×1), not vertical (1×30)
      — the Figma wraps them in `-rotate-90` containers but the outer
      box dimensions are always `w-[30px] h-px`
- [ ] Client logo slot uses `<img src>` with `object-fit: contain`,
      max 102×48, vertically centered on the rule at y=58.67
- [ ] No `<img src="https://www.figma.com/api/mcp/asset/...">` anywhere
      in committed code — those URLs are 7-day MCP cache references

### 6.4 The "it's a percentage if it's equal spacing" smell test

If the tick percentages in your implementation are NOT all multiples of
`100/12` (or your chosen denominator), you almost certainly have wrong
values. The canonical Brand Codex uses perfectly equal spacing. Any
drift from that pattern means the yPct values were derived from an
incorrect inner-zone model.

---

## Phase 7 — Committing

Commit messages for Figma-derived work should reference the specific
Figma node IDs used and the verification method:

```
fix(hud): realign tick rhythm to Figma ground truth (1802:5921)

Measured every tick on both rails via use_figma:

  Left rail (1802:5921): 10 ticks at y=[252, 323, 394*, 465, 535,
                                        606, 677*, 748, 818, 889]
  Right rail (1853:488): 11 ticks at y=[181, 252, 323, 394*, 465,
                                        535, 606, 677*, 748, 818, 889]

...
```

Include enough detail that a future session can re-verify the numbers
without re-walking the node tree.

---

## Phase 8 — Variant family: shared content with per-variant chrome

When you are porting **multiple Figma frames** that look like variations
on a theme — same composition, small chrome differences — resist the
urge to copy-paste page files. Extract the shared parts and make each
variant page a thin configuration file.

This is the difference between "N copies of a 400-line file" and "1
shared helper + N 30-line configurations". The second pattern is what
makes the primitive system a system — the first is what burns you when
a shared detail needs to change across every variant.

### 8.1 When to apply

A variant family is worth extracting the moment you have **2 or more**
frames that share at least 60% of their content and only differ on a
small number of enumerable axes. The Text+Image family is the canonical
example — 6 variants, 2 axes (shell mode × union subset), otherwise
identical.

Signs you have a family in front of you:

- Multiple Figma frames with nearly identical screenshots at preview
  resolution. You have to zoom in to spot differences.
- Node walker output shows the same structural groups (Definition
  Container, Image Frame, etc.) at the same coordinates across frames.
- The variance is enumerable: "this one has a logo, that one doesn't",
  "variant A has 4 corners, B has 2", not "this one has a totally
  different layout".

### 8.2 The extraction recipe

1. **Recon all variants first.** Walk every frame in the family and
   diff the outputs. Identify the stable content (image rect, text
   blocks, chrome positions) vs the variable axes (which elements
   appear, what shell mode, etc.). Do NOT start with one variant and
   generalize later — you will under-estimate the shared surface.

2. **Build the shared scaffold once.** Create a `_shared/` folder under
   the route tree (e.g. `app/brand-system/_shared/`). Put the canvas
   wrapper, scale transform, scoped CSS variables, and every invariant
   chrome anchor here. See `SpecimenFrame.tsx` in the Astrolabe repo
   for the reference implementation.

3. **Build the shared content helper.** Create a sibling file
   (e.g. `TextImgContent.tsx`) with typed exports for the content
   block(s) that all variants share. Parameterize the variable axes
   via props with **typed literal unions**:

   ```tsx
   export type TextImgUnion = "tl" | "tr" | "bl" | "br";

   export function TextImgUnderstandingImage({
     unions,
   }: {
     unions: readonly TextImgUnion[];
   }): JSX.Element;
   ```

4. **Each variant page is a thin config file.** Target ~30 lines
   per page. The page imports the scaffold + content helpers and
   supplies the axis values. If a page starts exceeding ~50 lines, the
   shared helper is missing a parameter — fold it back before adding
   the next variant.

5. **Route naming matches the Figma variant naming**, not the content.
   `/text-img-1b` rather than `/some-content-slug`. The content lives
   in the shared helper — the route is structural metadata about which
   variant it is.

6. **Index the family.** Add a registry array in the parent canvas page
   that lists every variant with its Figma node, shell mode, axis
   values, and href. This doubles as documentation and as the UI links.
   See `TEXT_IMG_SPECIMENS` in `app/brand-system/page.tsx`.

### 8.3 Worked example: Text+Image family (6 variants)

Stable shared content:

- Image rect `(965.97, 214.04)` 738×652
- Definition Container `(156.51, 171)` 647×453.54
- Chapter "CHAPTER 01" / pagination "01"
- Rails, compass, brandmark, 4 union wrapper positions

Variable axes:

- **Shell:** `client` (logo lockup + 30px terminator) | `grid`
  (30×30 L-bracket)
- **Union subset:** `["tl","tr","bl","br"]` | `["tr","bl"]` | `["tl","br"]`

Result: 6 page files × ~30 lines each ≈ 180 lines of page code total.
Compare to a copy-paste approach: 6 × 200-line files ≈ 1200 lines, any
change replicated 6 times. The shared scaffold absorbs the repetition
without losing fidelity.

### 8.4 Anti-pattern: dynamic route with a `[variant]` param

It is tempting to collapse the N pages into one
`/text-img/[variant]/page.tsx` file that switches on the URL param.
**Don't.** The variants will diverge over time — a per-variant content
tweak, a different logo, a unique eyebrow — and a single switch
statement becomes an unreadable mess. N thin files is cleaner and
each is trivially debuggable.

### 8.5 The "variant fidelity test"

Before shipping a family, load every variant side-by-side in the
preview and compare to the Figma screenshots. Differences between
sibling variants should only be the enumerated axes. If you spot a
difference that isn't in your axis list, one of these is true:

- Your axis list is incomplete (add the axis)
- The shared content has drift (fix in the helper)
- The variants aren't actually a family (re-evaluate scope)

---

## Where to look when stuck

| Problem                            | File                                                           |
| ---------------------------------- | -------------------------------------------------------------- |
| Primitive API details (Layers 1–4) | `primitives-api.md`                                            |
| Specimen composition API (Layer 5) | `primitives-api.md` §5                                         |
| Canonical HUD geometry             | `hud-frame-implementation.md`                                  |
| Text+Image variant matrix          | `hud-frame-implementation.md` §11                              |
| Node IDs for a specific element    | `figma-codex-map.md`                                           |
| Astrolabe specimen route map       | `figma-codex-map.md` "Astrolabe specimen routes"               |
| The specimen scaffold source       | `app/brand-system/_shared/SpecimenFrame.tsx`                   |
| The specimen content helpers       | `app/brand-system/_shared/TextImgContent.tsx`                  |
| An existing specimen as reference  | `app/brand-system/text-img-1b/page.tsx` (30 lines, grid shell) |
| The rail contract constants        | `lib/navigation/rail-contract.ts`                              |
| Responsive shell example           | `components/navigation/NavigationGrid.tsx`                     |
