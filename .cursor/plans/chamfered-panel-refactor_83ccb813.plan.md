---
name: chamfered-panel-refactor
overview: Create a reusable, design-token-driven chamfered/notched frame system for Astrogation right panels (and future asymmetrical panels) by moving geometry + rendering into @thoughtform/ui, eliminating CSS/SVG drift, and codifying best practices in Cursor + Claude design skills.
todos:
  - id: ui-chamfer-hook
    content: Add ResizeObserver-based sizing hook in @thoughtform/ui for frame geometry
    status: pending
  - id: ui-chamfer-tokens
    content: Add chamfer/notch types + presets (including inspectorTicket preset matching current right panels)
    status: pending
    dependencies:
      - ui-chamfer-hook
  - id: ui-chamfer-geometry
    content: Implement polygon/path generator utilities for the initial notch shape, designed to extend to asymmetrical variants
    status: pending
    dependencies:
      - ui-chamfer-tokens
  - id: ui-chamfered-frame
    content: Implement @thoughtform/ui ChamferedFrame (single SVG fill+stroke, slots for title/toolbar/content/decorations)
    status: pending
    dependencies:
      - ui-chamfer-geometry
  - id: migrate-right-panels
    content: Migrate SurveyInspectorPanel, SpecPanel, and DialsPanel to ChamferedFrame without visual regression; deprecate .inspector-frame styling
    status: pending
    dependencies:
      - ui-chamfered-frame
  - id: design-system-demo
    content: Add ChamferedFrame section to app/test/design-system/page.tsx to showcase current + asymmetrical presets
    status: pending
    dependencies:
      - ui-chamfered-frame
  - id: docs-and-rules
    content: Codify chamfer/polygon frame best practices in .cursorrules, Claude frontend-design patterns, and Sentinel docs (ADR-007 + BEST-PRACTICES)
    status: pending
    dependencies:
      - migrate-right-panels
      - design-system-demo
---

# Refactoring Plan: Right Panel Chamfered Frame System

## Goals

- **Make right-panel frames structural, reusable, and extensible** so we can explore asymmetrical chamfers without “duct tape” CSS.
- **Eliminate geometry drift** between CSS `clip-path` and inline SVG `polygon points`.
- **Follow the 9-slice mental model** in a responsive web context: corners/notches are defined in fixed units, edges stretch.
- **Separate structure from decoration**: the frame (background + border) is resizable; greebles are pinned overlays.
- **Keep SVG as the source of truth** for non-rect shapes, and generate glows with CSS (no baked effects).
- **Migrate without breaking the current look** of Astrogation right panels.

## Current State (What We’re Refactoring)

- **Right panels (Astrogation)** live in:
  - [app/astrogation/\_components/SurveyInspectorPanel.tsx](app/astrogation/_components/SurveyInspectorPanel.tsx)
  - [app/astrogation/\_components/SpecPanel.tsx](app/astrogation/_components/SpecPanel.tsx)
  - [app/astrogation/\_components/DialsPanel.tsx](app/astrogation/_components/DialsPanel.tsx)
- **Frame styling is implemented as `.inspector-frame`** in:
  - [app/astrogation/astrogation.css](app/astrogation/astrogation.css)
- **Core issue**: geometry is duplicated:
  - CSS background uses `clip-path: polygon(...)` with `--survey-notch-w/--survey-notch-h`
  - JSX hardcodes `<polygon points="0,32 188,32 220,0 340,0 340,734 0,734" />`
- **Decision record exists**:
  - [sentinel/decisions/007-chamfered-card-polygon-design.md](sentinel/decisions/007-chamfered-card-polygon-design.md)

## Best-Practice Baselines (from Context7)

- **Next.js App Router CSS**: reserve global CSS for truly global styles; use CSS Modules for scoped styles when possible, and import global CSS in the root layout.
  - Source: Context7 `/vercel/next.js` “CSS” docs.
- **Tailwind + CSS vars**: use arbitrary values with **type hints** when CSS var meaning is ambiguous.
  - Example: `text-[color:var(--gold)]` vs `text-[length:var(--type-xs)]`
  - Source: Context7 `/websites/v3_tailwindcss`.
- **Motion / Framer Motion SVG draw**: prefer `pathLength` on SVG shapes (including `polygon`) for border draw-in animations.
  - Source: Context7 `/websites/motion-dev-docs`.

## Target Architecture

### Core component: `@thoughtform/ui` `ChamferedFrame`

Implement a **client** molecule that renders a single SVG for **both** fill and border, driven by typed geometry presets.

- **Where**:
  - New: [packages/ui/src/molecules/ChamferedFrame.tsx](packages/ui/src/molecules/ChamferedFrame.tsx)
- **How it works**:
  - Measure container `width/height` with `ResizeObserver` (9-slice mental model via fixed notch sizes).
  - Generate a polygon from a `ChamferConfig` (single source of truth).
  - Render:
    - `<polygon fill=... />` (background)
    - `<polygon fill="none" stroke=... vector-effect="non-scaling-stroke" />` (border)
  - Keep content behavior from ADR-007:
    - **Content clipping is functional** and stays `inset(...)` at a horizontal line.
    - Title + toolbar remain absolutely positioned in the step-down zone.

### Typed geometry + presets

- **Where**:
  - New: [packages/ui/src/tokens/chamfers.ts](packages/ui/src/tokens/chamfers.ts)
  - New: [packages/ui/src/utils/chamferGeometry.ts](packages/ui/src/utils/chamferGeometry.ts)
- **API shape (initial)**:
  - `preset: "inspectorTicket"` matching today’s notch (220/32)
  - `config` override for future asymmetry:
    - `notchWidthPx`, `notchHeightPx`
    - (future) multiple notches / corner cuts / custom point generators

### Slot-based composition (structure vs decoration)

`ChamferedFrame` provides dedicated slots:

- `titleSlot` (top-left step-down zone)
- `toolbarSlot` (top-right)
- `children` (scrollable content)
- `decorationsSlot` (pinned greebles; not affected by content scroll)

### Motion-ready borders (optional)

Keep `@thoughtform/ui` free of hard dependency on Motion initially.

- **Phase option A (simple)**: CSS keyframes (stroke-dasharray/dashoffset) on the border polygon.
- **Phase option B (best)**: app-level wrapper using Motion `pathLength` on the `<polygon>`.

## Implementation Phases (Safe Migration)

### Phase 0 — Baseline + guardrails (no behavior changes)

- Document the current geometry + constraints in code comments near `.inspector-frame` and in ADR.
- Add a “do-not-regress” checklist for:
  - title width
  - toolbar placement
  - content clip line
  - scroll behavior

### Phase 1 — Build `ChamferedFrame` in `@thoughtform/ui`

1. Add `useElementSize` hook (ResizeObserver)
   - New: `packages/ui/src/hooks/useElementSize.ts`
2. Add geometry types + presets
   - New: `packages/ui/src/tokens/chamfers.ts`
3. Add polygon generator
   - New: `packages/ui/src/utils/chamferGeometry.ts`
4. Implement `ChamferedFrame`
   - New: `packages/ui/src/molecules/ChamferedFrame.tsx`
5. Export from `@thoughtform/ui`
   - Update:
     - `packages/ui/src/molecules/index.ts`
     - `packages/ui/src/index.ts`

### Phase 2 — Migrate Astrogation right panels (no visual regression)

Replace the repeated `.inspector-frame` markup in:

- [app/astrogation/\_components/SurveyInspectorPanel.tsx](app/astrogation/_components/SurveyInspectorPanel.tsx)
- [app/astrogation/\_components/SpecPanel.tsx](app/astrogation/_components/SpecPanel.tsx)
- [app/astrogation/\_components/DialsPanel.tsx](app/astrogation/_components/DialsPanel.tsx)

…with:

- `<ChamferedFrame preset="inspectorTicket" titleSlot=... toolbarSlot=...>`

Keep the existing internal content classes/styles to avoid churn.

Then, in [app/astrogation/astrogation.css](app/astrogation/astrogation.css):

- Mark `.inspector-frame` as **deprecated** (comment + pointer to `ChamferedFrame`)
- Remove only the now-unused background/border layers once migration is complete (not before)

### Phase 3 — Design system demo + regression harness

Update the existing design system page:

- [app/test/design-system/page.tsx](app/test/design-system/page.tsx)

Add a “ChamferedFrame” section that renders:

- current inspector preset
- 2–3 asymmetry experiments (different notch widths/heights)
- light/danger variants (border color + glow via CSS)

### Phase 4 — Codify best practices (Cursor rules + Claude design skill)

#### Update Cursor rules

- Update: [.cursorrules](.cursorrules)
- Add a dedicated section: “Chamfered / Polygon Frames”
  - Use `@thoughtform/ui` `ChamferedFrame` for non-rect frames
  - Geometry must come from typed config/presets (no hardcoded points)
  - Decorations pinned separately
  - SVG only; no baked glows
  - Tailwind CSS-var best practice: type-hinted arbitrary values (`text-[color:var(--gold)]`, `text-[length:var(--type-xs)]`)

#### Update Claude frontend-design skill docs

- Update:
  - [.claude/skills/frontend-design/DESIGN_PATTERNS.md](.claude/skills/frontend-design/DESIGN_PATTERNS.md)
  - (optional) [.claude/skills/frontend-design/SKILL.md](.claude/skills/frontend-design/SKILL.md)
- Add:
  - “9-slice mental model for responsive frames”
  - “Structure vs decoration (greeble slots)”
  - “SVG border + CSS glow”
  - “Motion draw-in (pathLength) guidance”

#### Update Sentinel docs

- Update:
  - [sentinel/decisions/007-chamfered-card-polygon-design.md](sentinel/decisions/007-chamfered-card-polygon-design.md)
  - [sentinel/BEST-PRACTICES.md](sentinel/BEST-PRACTICES.md)
- Add the new rule: **never duplicate polygon math**; use `ChamferedFrame`.

## Acceptance Criteria

- **No visible change** to the three Astrogation right panels after migration:
  - Survey inspector (empty + filled)
  - Vault (SpecPanel)
  - Foundry (DialsPanel)
- **Scroll behavior remains correct**: content never renders in the title/toolbar zone.
- **Single source of truth** for geometry (no CSS/SVG drift).
- **Ready for asymmetry**: at least 2 alternate presets render correctly in the design-system test page.

## Rollback Plan

- Migration is reversible per-panel:
  - Keep `.inspector-frame` CSS until all panels are migrated and validated.
  - If a regression is found, switch that panel back to the old markup while iterating on `ChamferedFrame`.
