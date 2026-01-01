# ADR-006: Focus Overlay System & Reusable UI Patterns

**Date:** 2026-01  
**Status:** Accepted

---

## Context

While building the Astrogation interface (Vault, Foundry, Survey tabs), we implemented similar "focus overlay" patterns multiple times:

- Clicking an item in **Vectors/Wordmarks** preview opens a focused overlay
- Clicking an item in **Survey View** opens an inspection overlay
- The **Upload Modal** uses the same visual language

Each implementation was slightly different, leading to:

- Inconsistent animations (Survey initially had no animation)
- Duplicated CSS with hardcoded values
- Different padding, sizing, and behavior across contexts

This violates DRY principles and makes future tabs/features prone to the same inconsistencies.

---

## Decision

### 1. Establish a Focus Overlay Design System

All focus overlays (modals, detail views, inspections) MUST use these shared primitives:

#### CSS Variables (already defined in `.astrogation`)

```css
/* Focus overlay appearance */
--focus-overlay-bg: rgba(10, 9, 8, 0.2);
--focus-overlay-blur: 12px;
--focus-overlay-border: rgba(235, 227, 214, 0.3);

/* Background dim when focused */
--focus-bg-opacity: 0.7;
--focus-bg-blur: 4px;

/* Global UI dim when focused */
--focus-global-opacity: 0.6;
--focus-global-blur: 4px;

/* Backdrop overlay */
--focus-backdrop-bg: rgba(10, 9, 8, 0.3);
```

#### Shared Animations (keyframes)

**For absolutely positioned overlays** (using `top: 50%; left: 50%`):

```css
@keyframes assetFocusIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
```

**For flexbox-centered content** (parent uses `display: flex; align-items: center; justify-content: center`):

```css
@keyframes modalFocusIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

**IMPORTANT**:

- Use `assetFocusIn` when the focused element is absolutely positioned with `top: 50%; left: 50%`
- Use `modalFocusIn` when the focused element is centered via flexbox
- Never apply the animation to the backdrop/container—only to the content element

#### Shared Box Shadow

```css
box-shadow:
  0 0 0 1px rgba(235, 227, 214, 0.05),
  0 0 60px rgba(202, 165, 84, 0.1),
  0 30px 80px rgba(0, 0, 0, 0.6);
```

### 2. Focus Overlay Component Structure

Every focus overlay MUST follow this DOM structure:

```
[overlay-container]           (fixed, centers content)
  └── [backdrop]              (click to close, uses --focus-backdrop-bg)
  └── [focused-overlay]       (positioned center, has animation)
      └── [focused-content]   (dashed border, backdrop blur, padding)
          └── [label]         (positioned top: -10px, centered)
          └── [content]       (actual content: image, component, etc.)
```

### 3. Size Variants

| Variant  | Max Width    | Max Height   | Padding   | Use Case               |
| -------- | ------------ | ------------ | --------- | ---------------------- |
| `small`  | 400px / 50vw | 300px / 50vh | 48px 64px | Small assets, icons    |
| `medium` | 600px / 60vw | 400px / 50vh | 64px 80px | Standard components    |
| `large`  | 900px / 75vw | 700px / 75vh | 48px 64px | Images, detailed views |

### 4. Label Badge Pattern

All focused content with identifiable items MUST display a label:

```css
.focused-label {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 16px;
  background: rgba(10, 9, 8, 0.95);
  border: 1px solid rgba(235, 227, 214, 0.2);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: rgba(235, 227, 214, 0.8);
  white-space: nowrap;
  text-transform: uppercase;
}
```

---

## Implementation Checklist

When building a new focus overlay:

- [ ] Use `--focus-backdrop-bg` for backdrop
- [ ] Apply `animation: assetFocusIn 0.3s ease-out` to focused-overlay
- [ ] Use `--focus-overlay-bg`, `--focus-overlay-blur`, `--focus-overlay-border` for content
- [ ] Apply the standard box-shadow
- [ ] Include a label if the content has a name/title
- [ ] Choose appropriate size variant (small/medium/large)
- [ ] Ensure ESC key closes the overlay
- [ ] Ensure clicking backdrop closes the overlay

---

## Future: CSS Utility Classes (Recommended)

Consider creating reusable utility classes:

```css
/* Base classes for any focus overlay */
.tf-overlay {
  /* fixed container */
}
.tf-overlay__backdrop {
  /* click-to-close backdrop */
}
.tf-overlay__focused {
  /* centered, animated */
}
.tf-overlay__content {
  /* dashed border frame */
}
.tf-overlay__content--small {
  /* size variant */
}
.tf-overlay__content--medium {
  /* size variant */
}
.tf-overlay__content--large {
  /* size variant */
}
.tf-overlay__label {
  /* top label badge */
}
```

This would allow new overlays to be built with:

```tsx
<div className="tf-overlay">
  <div className="tf-overlay__backdrop" onClick={onClose} />
  <div className="tf-overlay__focused">
    <div className="tf-overlay__content tf-overlay__content--large">
      <span className="tf-overlay__label">{title}</span>
      {children}
    </div>
  </div>
</div>
```

---

## Consequences

### Positive

- **Consistency**: All focus overlays look and animate the same
- **Maintainability**: Changes to overlay styling only need to happen once
- **Velocity**: New features can reuse established patterns
- **Predictability**: Users experience consistent interactions

### Negative

- **Migration**: Existing implementations need refactoring to use shared classes
- **Flexibility**: Edge cases may require variant rules

### Neutral

- CSS file size slightly increases with utility classes
- Developers must learn the pattern vocabulary

---

## Related Patterns to Encode

### Panel Layout System

```css
/* Both panels use identical dimensions */
--panel-width: 340px;
--panel-margin-top: 40px;
--panel-height: calc(100vh - var(--hud-padding, 32px) * 2 - 120px);
```

### Flow/Pipeline Pattern (Inspector vertical lines)

```css
/* Consistent flow node positioning */
--flow-node-size: 6px;
--flow-node-left: -3px;
--flow-connector-left: 0px;
--flow-item-padding-left: 16px;
```

### Grid Item Hover States

All clickable grid items should use:

- `transform: translateY(-2px)` on hover
- `border-color: var(--gold-30)` on hover
- `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4)` on hover

---

## References

- Related files:
  - `app/astrogation/astrogation.css` (lines 2552-2640, 5878-5985)
  - `app/astrogation/_components/SurveyView.tsx`
  - `app/astrogation/_components/previews/ComponentPreview.tsx`
- Related ADRs: None
