# ChamferedFrame Migration Analysis

## Overview

This document analyzes the compatibility between the existing `.inspector-frame` CSS implementation and the new `ChamferedFrame` component from `@thoughtform/ui`.

## Geometry Verification ✅

| Property           | Current CSS                | ChamferedFrame                | Match |
| ------------------ | -------------------------- | ----------------------------- | ----- |
| Notch Width        | `--survey-notch-w: 220px`  | `notchWidthPx: 220`           | ✅    |
| Notch Height       | `--survey-notch-h: 32px`   | `notchHeightPx: 32`           | ✅    |
| Content Clip Top   | `calc(32px + 14px) = 46px` | `notchHeightPx + 14 = 46px`   | ✅    |
| Scroll Padding Top | `calc(32px + 16px) = 48px` | `notchHeightPx + 16px = 48px` | ✅    |
| Fill Color         | `rgba(10, 9, 8, 0.4)`      | `chamferColors.fill`          | ✅    |
| Stroke Color       | `rgba(202, 165, 84, 0.3)`  | `chamferColors.stroke`        | ✅    |

## CSS Rules Categorization

### Rules Replaced by ChamferedFrame (safe to deprecate)

- `.inspector-frame` - Base container (flex layout)
- `.inspector-frame::before` - Polygon background via clip-path
- `.inspector-frame__border` - SVG container
- `.inspector-frame__border svg` - SVG sizing
- `.inspector-frame__border polygon` - Stroke styling
- `.inspector-frame__title-row` - Title positioning
- `.inspector-frame__toolbar` - Toolbar positioning
- `.inspector-frame__content` - Content clip-path
- `.inspector-frame__scrollable` - Scroll container

### Rules Still Needed (content styling)

- `.inspector-frame__title` - Title text font/color
- `.inspector-frame__subtitle` - Subtitle font/color
- `.inspector-frame__title-input` - Editable title input styling
- `.inspector-frame__title-input::placeholder` - Placeholder color
- `.inspector-frame__title-input:focus` - Focus state
- `.inspector-frame--empty .inspector-frame__scrollable` - Empty state padding

## Structural Comparison

### Current HTML Structure

```html
<div class="inspector-frame">
  <div class="inspector-frame__border">
    <svg viewBox="0 0 340 734" preserveAspectRatio="none">
      <polygon points="0,32 188,32 220,0 340,0 340,734 0,734" />
    </svg>
  </div>
  <div class="inspector-frame__title-row">
    <span class="inspector-frame__title">TITLE</span>
  </div>
  <div class="inspector-frame__toolbar">...</div>
  <div class="inspector-frame__content">
    <div class="inspector-frame__scrollable">...</div>
  </div>
</div>
```

### New ChamferedFrame Structure

```html
<div class="tf-chamfered-frame">
  <svg class="tf-chamfered-frame__svg">
    <polygon fill="rgba(10, 9, 8, 0.4)" />
    <polygon fill="none" stroke="rgba(202, 165, 84, 0.3)" />
  </svg>
  <div class="tf-chamfered-frame__title">
    {titleSlot → <span class="inspector-frame__title">TITLE</span>}
  </div>
  <div class="tf-chamfered-frame__toolbar">{toolbarSlot}</div>
  <div class="tf-chamfered-frame__content">
    <div class="tf-chamfered-frame__scrollable">{children}</div>
  </div>
</div>
```

## Key Differences

### Improvement: Dynamic Geometry

- **Old**: SVG viewBox hardcoded to `340x734`, polygon points static
- **New**: ResizeObserver calculates points from actual container size
- **Impact**: ✅ Better responsive behavior, no visual change at same size

### Improvement: Single SVG Layer

- **Old**: CSS clip-path for fill, separate SVG for stroke
- **New**: Single SVG with both fill polygon and stroke polygon
- **Impact**: ✅ Simpler DOM, same visual result

### Change: CSS Custom Properties

- **Old**: Sets `--survey-notch-w`, `--survey-notch-h` on `.inspector-frame`
- **New**: Sets `--tf-notch-w`, `--tf-notch-h`, `--tf-title-w`, `--tf-clip-top`
- **Impact**: ⚠️ Different variable names (can add both for compat)

### Change: Class Names

- **Old**: `.inspector-frame__*`
- **New**: `.tf-chamfered-frame__*`
- **Impact**: ⚠️ Content styling CSS still targets old class names

## Migration Strategy (Safe)

### Step 1: Keep Content Styling CSS

The CSS rules for `.inspector-frame__title`, `.inspector-frame__title-input`, etc. should remain because:

1. Content elements inside slots keep their class names
2. Allows gradual migration with zero visual change

### Step 2: Add Backward-Compat CSS Variables

In ChamferedFrame, also set the old variable names:

```tsx
'--survey-notch-w': `${notchWidthPx}px`,
'--survey-notch-h': `${notchHeightPx}px`,
```

### Step 3: Handle Empty State

Pass className for empty state:

```tsx
<ChamferedFrame className={!item ? "inspector-frame--empty" : ""}>
```

### Step 4: Migrate One Panel First

Start with `SpecPanel.tsx` (simplest - no toolbar, no editable title).

## Risk Assessment

| Risk                    | Likelihood | Mitigation                              |
| ----------------------- | ---------- | --------------------------------------- |
| Visual regression       | Low        | Geometry verified to match exactly      |
| Content styling breaks  | Low        | Keep CSS, elements keep class names     |
| Scroll behavior changes | Low        | Same overflow/clip-path logic           |
| Empty state padding     | Low        | Pass className="inspector-frame--empty" |

## Rollback Plan

If issues arise:

1. CSS remains unchanged
2. Simply revert component changes
3. No database/API changes involved
