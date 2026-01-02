# ADR-007: Chamfered Card Polygon Design (Survey Inspector)

**Date:** 2026-01  
**Status:** Accepted

---

## Context

The Survey Inspector panel needed a distinctive "ticket stub" or "index tab" card design inspired by game UI (e.g., MAGNUM 650 weapon card reference). Requirements:

- **Chamfered corner**: A 45° angled notch in the top-right that creates a step-down
- **Title in step-down**: The card title sits inside the step-down area (left side)
- **Icons in corner**: Action buttons positioned in the top-right corner above the step-down
- **Border traces polygon**: The card border must follow the chamfered shape, not wrap a rectangle
- **Scroll clipping**: Content must clip at a horizontal line, not overflow into title/icon area

Initial attempts using CSS `border` + `clip-path` failed because `clip-path` clips the border too, causing it to disappear on the chamfered edge.

---

## Decision

### 1. Use CSS Variables for Geometry Tokens

```css
.survey-panel-frame {
  --survey-notch-w: 220px; /* diagonal position from left */
  --survey-notch-h: 32px; /* height of the step-down (title area) */
  --survey-title-strip: 0px; /* title is inside the card */
}
```

**Why:** Single source of truth for all polygon calculations. Easy to tune dimensions.

---

### 2. Separate Background (clip-path) from Border (SVG)

**Background**: Use `::before` pseudo-element with `clip-path` for the filled polygon shape:

```css
.survey-panel-frame::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(10, 9, 8, 0.4);
  pointer-events: none;
  z-index: 0;
  clip-path: polygon(
    0% var(--survey-notch-h),
    calc(var(--survey-notch-w) - var(--survey-notch-h)) var(--survey-notch-h),
    var(--survey-notch-w) 0%,
    100% 0%,
    100% 100%,
    0% 100%
  );
}
```

**Border**: Use an inline SVG element to draw the polygon stroke:

```tsx
<div className="survey-panel-frame__border">
  <svg viewBox="0 0 340 734" preserveAspectRatio="none">
    <polygon points="0,32 188,32 220,0 340,0 340,734 0,734" />
  </svg>
</div>
```

```css
.survey-panel-frame__border polygon {
  fill: none;
  stroke: var(--gold-30, rgba(202, 165, 84, 0.3));
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
```

**Why:** CSS `clip-path` clips everything including borders. SVG gives precise control over stroke that follows the polygon path.

---

### 3. Clip Content at Horizontal Line (Not Polygon)

Content should clip at a **horizontal line** across the entire width, not follow the chamfered polygon:

```css
.survey-panel-frame__content {
  /* Content clips at horizontal line with safety margin */
  clip-path: inset(calc(var(--survey-notch-h) + 6px) 0 0 0);
}
```

**Why:** When scrolling, items should disappear below the title/icon row — not appear in the top-right corner above the step-down. The polygon shape is decorative; the scroll clip is functional.

---

### 4. Position Title and Icons Absolutely

```css
/* Title in step-down area (left side) */
.survey-panel-frame__title-row {
  position: absolute;
  top: 4px;
  left: 8px;
  width: calc(var(--survey-notch-w) - var(--survey-notch-h) - 16px);
  height: calc(var(--survey-notch-h) - 8px);
}

/* Icons in top-right corner */
.survey-panel-frame__toolbar {
  position: absolute;
  top: 6px;
  right: 8px;
}
```

**Why:** Both elements live in the step-down zone but don't participate in scroll. Absolute positioning keeps them fixed.

---

## Alternatives Considered

### Alternative 1: CSS `border-image` with SVG data URI

- **Pros:** Single CSS property, no extra DOM elements
- **Cons:** Complex to author, limited browser support for complex shapes, hard to maintain

### Alternative 2: Single `clip-path` with thick pseudo-element border

- **Pros:** Pure CSS solution
- **Cons:** Requires complex "donut" clip-path math, brittle to change

### Alternative 3: Canvas-drawn border

- **Pros:** Full control over rendering
- **Cons:** Over-engineered for a static border, performance overhead

---

## Polygon Geometry Reference

```
x=0                       x=188  x=220              x=340
y=0                              ╱─────────────────────●
                               ╱                       │
y=32  ●───────────────────────●                        │
      │                                                │
      │           CONTENT AREA                         │
      │                                                │
y=734 ●────────────────────────────────────────────────●
```

- **Step-down area** (title): `x=0` to `x=188` at `y=32`
- **Diagonal chamfer**: `(188, 32)` → `(220, 0)`
- **Icon corner**: `x=220` to `x=340` at `y=0`

---

## Consequences

### Positive

- **Distinctive design**: Matches game UI aesthetic, differentiates from standard panels
- **Maintainable**: CSS variables make tuning trivial
- **Proper scroll behavior**: Content clips cleanly at horizontal line
- **Flexible**: Pattern can be reused for other chamfered cards

### Negative

- **SVG duplication**: Polygon points hardcoded in both CSS and SVG (must stay in sync)
- **Complexity**: Three layers (background, border, content) instead of one element

### Neutral

- Requires understanding polygon coordinate math
- SVG viewBox dimensions should match expected container size

---

## Checklist for Future Chamfered Cards

- [ ] Define geometry tokens as CSS variables
- [ ] Use `::before` with `clip-path` for background fill
- [ ] Use inline SVG with `preserveAspectRatio="none"` for border stroke
- [ ] Use `clip-path: inset()` on content for scroll clipping (horizontal, not polygon)
- [ ] Position title/icons absolutely in step-down zone
- [ ] Test scroll behavior with enough content to overflow

---

## References

- Related files:
  - `app/astrogation/astrogation.css` (lines 621-790)
  - `app/astrogation/_components/SurveyInspectorPanel.tsx`
- Design reference: MAGNUM 650 weapon card (game UI)
- Related ADRs: [ADR-006: Focus Overlay System](006-focus-overlay-system.md)
