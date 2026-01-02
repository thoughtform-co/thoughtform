---
name: "Refactoring Plan: Chamfered Shape System (Design System-wide)"
overview: Build a reusable SVG-driven chamfer/notch frame system in @thoughtform/ui that works everywhere; Astrogation is the first sandbox + migration target.
todos: []
---

# Refactoring Plan: Chamfered Shape System (Design System-wide)

## Overview

Build a **design-system-level** frame/shape system that supports asymmetrical chamfers and notched edges across the whole site/app. Astrogation remains the **first proving ground** (because it’s where we iterate fastest), but the output lives in `@thoughtform/ui` so we can “play everywhere” without copy/paste CSS.

**Chosen core strategy:** **Unified SVG + ResizeObserver** — render a single SVG layer (fill + stroke) behind content and compute polygon geometry from measured container size. This eliminates CSS/SVG duplication and keeps border thickness stable via `vector-effect="non-scaling-stroke"`.

## Current State Analysis (Initial Target + Wider Scope)

**Existing Implementation (initial pain-point):**

- Astrogation inspector “ticket stub” frame via `.inspector-frame` in `app/astrogation/astrogation.css` (lines 628-790)
- Hardcoded SVG polygon points in JSX (`SurveyInspectorPanel.tsx`, `SpecPanel.tsx`, `DialsPanel.tsx`)
- CSS variables scoped to `.inspector-frame` only (`--survey-notch-w`, `--survey-notch-h`)
- Single chamfer type: top-right corner only
- Background via `::before` pseudo-element with `clip-path: polygon()`
- Border via inline SVG with `vector-effect="non-scaling-stroke"` (good practice)
- Content clipping via `clip-path: inset()` (horizontal line, not polygon)

**Design system context (where this should ultimately live):**

- `@thoughtform/ui` has a strong frame primitive already:
  - `Frame` molecule (`packages/ui/src/molecules/Frame.tsx`) = rect surface + optional corner brackets.
  - `Card` organism (`packages/ui/src/organisms/Card.tsx`) composes `Frame`.
  - `Panel` organism (`packages/ui/src/organisms/Panel.tsx`) is currently a simple bordered shell (doesn’t yet use `Frame`).

**Issues (what blocks reuse everywhere):**

- SVG polygon points duplicated in CSS and JSX (must stay in sync manually)
- No reusable **design-system** component for chamfered/notched frames (Astrogation-only)
- Limited to one chamfer configuration; no extensible “shape taxonomy” for future asymmetry
- Geometry tokens are not centrally owned (scoped to a single CSS class in a global stylesheet)
- Not integrated with existing `@thoughtform/ui` primitives (`Frame`, `Card`, `Panel`) and their composition patterns
- No TypeScript types/presets for shape configurations, and no shared geometry utilities
- Component-specific global CSS in Next.js can accumulate and persist across routes; we should reserve global CSS for truly global styles and move structure into reusable components where possible

## Architecture

### Component Hierarchy

```text
ChamferedFrame (molecule, @thoughtform/ui)
├── useElementSize() (hook) - ResizeObserver sizing (9-slice-friendly)
├── chamferGeometry (util) - generates polygon points + derived layout metrics
├── SVG frame layer - single SVG (fill + stroke) with vector-effect=non-scaling-stroke
└── Slots - title / toolbar / decorations / content (structure vs greebles separation)
```

### Design Token System

**Primary source of truth moves into `@thoughtform/ui`** as typed presets + utilities, with optional CSS custom properties for theme-level overrides.

- **Typed presets** (design-system-level): `packages/ui/src/tokens/chamfers.ts`
- **Optional CSS variables** (website-level defaults/overrides): `app/styles/variables.css`

If we do use Tailwind utilities with CSS vars, use Tailwind’s **type-hinted arbitrary values** when ambiguous (Context7 Tailwind v3 best practice):

- `text-[color:var(--gold)]` (color)
- `text-[length:var(--type-xs)]` (font-size)

```css
/* Chamfer Geometry Tokens */
--chamfer-notch-width: 220px; /* Horizontal position of chamfer start */
--chamfer-notch-height: 32px; /* Vertical depth of chamfer */
--chamfer-angle: 45deg; /* Angle of chamfer (for future use) */
--chamfer-title-area-height: 32px; /* Height reserved for title/header */
```

### Chamfer Configuration Types

Create TypeScript types for a **shape taxonomy** that starts with the existing “ticket notch” and grows into more asymmetrical variants over time.

```typescript
type Corner = "tl" | "tr" | "bl" | "br";

type FrameShape =
  | {
      kind: "ticketNotch";
      corner: Corner;
      notchWidthPx: number;
      notchHeightPx: number;
    }
  | {
      kind: "cutCorners";
      cutsPx: Partial<Record<Corner, number>>; // per-corner cut size
    };

type ShapePreset = "inspectorTicket" | "inspectorTicketCompact" | "cutCornersSm";
```

## Implementation Steps (Design System-wide)

### Phase 0: Freeze current behavior (no regressions)

- Treat the current Astrogation inspector frame as the **reference implementation** (see `ADR-007`): title zone, toolbar placement, horizontal content clip, 1px border.
- Define a **compatibility preset** (`inspectorTicket`) that matches today’s geometry (`notchWidthPx=220`, `notchHeightPx=32`) and default colors (`rgba(10,9,8,0.4)` fill + `--gold-30` stroke).

### Phase 1: Build the shape engine in `@thoughtform/ui`

**1.1 Add a ResizeObserver sizing hook**

- **File**: `packages/ui/src/hooks/useElementSize.ts`
- **Purpose**: Read live `width/height` for any frame container (required for 9-slice-style constant notch sizes).

**1.2 Add shape tokens + presets**

- **File**: `packages/ui/src/tokens/chamfers.ts`
- **Exports**:
  - `FrameShape` union (starts with `ticketNotch`, extends to `cutCorners`, etc.)
  - `ShapePreset` values (`inspectorTicket`, plus 1–2 small/compact variants)

**1.3 Add geometry utilities**

- **File**: `packages/ui/src/utils/chamferGeometry.ts`
- **Purpose**: Generate:
  - SVG polygon `points` string
  - Derived layout metrics (e.g., `titleWidthPx`, `contentClipTopPx`)
  - Guardrails: clamp notch sizes so the shape never self-intersects on small containers

### Phase 2: Create `ChamferedFrame` molecule (single SVG fill + stroke)

- **File**: `packages/ui/src/molecules/ChamferedFrame.tsx`
- **Core idea**: one SVG layer renders both structure pieces:
  - `<polygon fill=... />` (background)
  - `<polygon fill=\"none\" stroke=... vector-effect=\"non-scaling-stroke\" />` (border)
- **Slots (structure vs decoration)**:
  - `titleSlot` (step-down zone)
  - `toolbarSlot` (top-right corner)
  - `decorationsSlot` (pinned greebles; non-scaling; non-scroll)
  - `children` (scrollable content)
- **Functional scroll clipping**:
  - Preserve the ADR-007 rule: clip content at a **horizontal line** (inset), not the decorative polygon.
- **Token bridge**:
  - Set CSS vars (px) on the wrapper (e.g., `--tf-notch-w`, `--tf-notch-h`, `--tf-title-w`, `--tf-clip-top`) so downstream layouts can align without hardcoding.

**2.1 Optional: Motion draw-in examples (app-level, not baked into `@thoughtform/ui`)**

- Use Motion’s SVG `pathLength` to animate polygon border draw-in (Context7 Motion docs).

### Phase 3: Add “playgrounds” (Astrogation + design-system test page)

- **Design-system page**: add a section to `app/test/design-system/page.tsx` that renders:
  - `inspectorTicket` (baseline)
  - 2–3 asymmetry variants (different notch sizes, different corners, cut-corners preset)
  - “danger” border color variant (no baked glow; use CSS `drop-shadow()`/`box-shadow` if desired)

### Phase 4: Migrate Astrogation panels (first consumer, zero visual regression)

- Replace the repeated `.inspector-frame` markup in:
  - `app/astrogation/_components/SurveyInspectorPanel.tsx`
  - `app/astrogation/_components/SpecPanel.tsx`
  - `app/astrogation/_components/DialsPanel.tsx`
- Remove hardcoded SVG `polygon points` from these panels.
- Keep `.inspector-frame` CSS temporarily for rollback; mark as **deprecated** and remove only after verification.

### Phase 5: Expand design-system adoption (usable everywhere)

- Add **non-breaking integration paths** for common consumers:
  - New `ChamferedPanel` organism (header + scroll + `ChamferedFrame`) for dashboards/sidebars.
  - Optional `Card`/`Panel` variants that accept `shape?: ShapePreset` (default stays rectangular).
- Document how to combine with Tailwind/Shadcn conventions:
  - `forwardRef`, `className`-first APIs, and CSS-var tokens for theme consistency.

### Phase 6: Codify best practices (Cursor rules + Claude skill + Sentinel docs)

- Update `.cursorrules` with an evergreen “Chamfered Frames” section:
  - Use `@thoughtform/ui` `ChamferedFrame` (no hardcoded polygon points).
  - SVG only for non-rect shapes; border thickness via `vector-effect`.
  - Structure vs greebles separation.
  - No baked glows; use CSS shadows/filters.
  - Tailwind CSS-var type hints (`text-[color:...]`, `text-[length:...]`) when ambiguous.
- Update:
  - `.claude/skills/frontend-design/DESIGN_PATTERNS.md`
  - `sentinel/BEST-PRACTICES.md`
  - `sentinel/decisions/007-chamfered-card-polygon-design.md` to point to the new canonical component

## Technical Specifications

### Polygon Generation Algorithm

For a top-right chamfer:

```javascript
Points: [
  (0, notchHeight), // Bottom-left of step-down
  (notchWidth - notchHeight, notchHeight), // Bottom-right of step-down
  (notchWidth, 0), // Top-right of chamfer
  (width, 0), // Top-right corner
  (width, height), // Bottom-right corner
  (0, height), // Bottom-left corner
];
```

### CSS Variable Strategy

Use CSS custom properties as the **bridge** between typed presets and styling/layout needs:

```css
.chamfered-frame {
  /* wrapper */
  /* Written by the component (px values) */
  --tf-notch-w: 220px;
  --tf-notch-h: 32px;
  --tf-title-w: 188px;
  --tf-clip-top: 46px; /* notchH + safety margin */
}
```

### Responsive Considerations

- Notch sizes should be treated as **fixed-size “corner assets”** (9-slice mental model). Start with px-based presets and clamp for small containers.
- SVG uses `preserveAspectRatio="none"` so edges stretch while stroke stays 1px via `vector-effect`.
- Provide compact presets for smaller components rather than forcing `clamp()` into SVG geometry.

### Performance Optimizations

- SVG border uses `pointer-events: none` to avoid interaction overhead
- Single SVG layer (fill + stroke) reduces DOM/CSS complexity and avoids CSS/SVG drift
- ResizeObserver is localized to the frame; memoize geometry computations per size/config

## Migration Strategy

- **Step 1**: Create new `@thoughtform/ui` shape primitives alongside existing code (no breaking changes)
- **Step 2**: Migrate one panel at a time (SurveyInspectorPanel first)
- **Step 3**: Verify scroll clipping + title/toolbar zones with real content
- **Step 4**: Migrate remaining panels
- **Step 5**: Remove deprecated `.inspector-frame` code after all consumers are migrated
- **Step 6**: Update docs + rules (Cursor + Claude + Sentinel)

## Testing Checklist

- [ ] All chamfer positions render correctly (tr, tl, br, bl)
- [ ] SVG border scales correctly with container resize
- [ ] Content clips properly at horizontal line (not polygon)
- [ ] Title area positions correctly in step-down zone
- [ ] Toolbar positions correctly in corner area
- [ ] Scroll behavior works correctly
- [ ] _(Optional)_ Motion draw-in example (SVG `pathLength`) plays correctly without layout shift
- [ ] Responsive behavior works on mobile/tablet
- [ ] Design tokens override correctly
- [ ] Backward compatibility maintained during migration

## Future Enhancements

- Support for multiple chamfers (e.g., top-right + bottom-left)
- Non-45-degree chamfer angles
- Curved chamfers (using SVG paths instead of polygons)
- Animated chamfer transitions (morphing between configurations)
- Integration with interface editor for visual chamfer configuration

## Files to Create/Modify (Design System-wide)

**New Files:**

- `packages/ui/src/hooks/useElementSize.ts`
- `packages/ui/src/utils/chamferGeometry.ts`
- `packages/ui/src/tokens/chamfers.ts`
- `packages/ui/src/molecules/ChamferedFrame.tsx`
- _(optional)_ `packages/ui/src/organisms/ChamferedPanel.tsx`

**Modified Files:**

- `app/styles/variables.css` - (optional) mirror default chamfer tokens for theming
- `app/astrogation/_components/SurveyInspectorPanel.tsx` - Migrate to new component
- `app/astrogation/_components/SpecPanel.tsx` - Migrate to new component
- `app/astrogation/_components/DialsPanel.tsx` - Migrate to new component
- `app/astrogation/astrogation.css` - Mark deprecated styles, add migration comments
- `packages/ui/src/index.ts` + `packages/ui/src/molecules/index.ts` - Export new molecule
- `app/test/design-system/page.tsx` - Add ChamferedFrame showcase + asymmetry variants
- `.claude/skills/frontend-design/DESIGN_PATTERNS.md` - Add chamfered frame patterns
- `sentinel/decisions/007-chamfered-card-polygon-design.md` - Update with component reference
- `sentinel/BEST-PRACTICES.md` - Codify polygon frame best practice
- `.cursorrules` - Add evergreen chamfer frame rules

## Success Criteria

1. ✅ Astrogation right panels render and behave identically after migration (scroll clip, title zone, toolbar zone, 1px border)
2. ✅ `@thoughtform/ui` exports `ChamferedFrame` + presets and it’s usable outside Astrogation
3. ✅ No hardcoded SVG polygon points remain in app-level components (single geometry source)
4. ✅ At least 2 additional asymmetry presets render correctly in the design-system test page
5. ✅ Best practices are codified in `.cursorrules`, Claude’s frontend-design patterns, and Sentinel docs
