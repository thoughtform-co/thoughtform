# Thoughtform.co Design Patterns Reference

This document catalogs existing design patterns in the Thoughtform.co codebase to ensure consistency when creating or modifying components.

## Component Structure Patterns

### Frame-Based Components

Components use frame elements (borders, corner brackets) to create the HUD aesthetic:

```tsx
// Pattern: Frame with corner brackets
<div className="component-frame">
  <div className="component-frame__corner component-frame__corner--top-left" />
  <div className="component-frame__content">...</div>
  <div className="component-frame__corner component-frame__corner--bottom-right" />
</div>
```

**Examples:**

- `components/hud/HUDFrame.tsx`
- `components/ui/CardFrame.tsx`
- `components/ui/CornerBracket.tsx`

### Panel Components

Panels use subtle borders and transparent backgrounds:

```css
.panel {
  border: 1px solid var(--dawn-08, rgba(235, 227, 214, 0.08));
  background: transparent;
  padding: 16px;
}
```

**Examples:**

- `app/astrogation/astrogation.css` - `.astrogation-panel--left`
- Navigation panels in `components/hud/`

## Spacing Patterns

### Consistent Padding

- **Small**: 8px
- **Medium**: 12px, 16px
- **Large**: 24px, 32px
- **Extra Large**: 48px, 64px

### Component Internal Spacing

```css
/* Standard component padding */
.component {
  padding: 16px 24px;
}

/* Compact variant */
.component--compact {
  padding: 8px 12px;
}

/* Spacious variant */
.component--spacious {
  padding: 24px 32px;
}
```

## Border Patterns

### Border Opacity Levels

```css
/* Subtle (barely visible) */
border: 1px solid var(--dawn-08); /* 8% opacity */

/* Medium (visible but not prominent) */
border: 1px solid var(--dawn-15); /* 15% opacity */

/* Prominent (clearly visible) */
border: 1px solid var(--dawn-30); /* 30% opacity */

/* Gold accents */
border: 1px solid var(--gold-15); /* 15% gold */
border: 1px solid var(--gold-30); /* 30% gold */
border: 1px solid var(--gold); /* Full gold */
```

### Border Styles

- **Standard**: `1px solid` with opacity variants
- **Dashed**: Used for overlays and focus states
- **No rounded corners**: Maintains HUD aesthetic (except specific cases)

## Typography Patterns

### Font Families

```css
/* Technical/HUD elements */
font-family: var(--font-data, "PT Mono", monospace);

/* Body text */
font-family: var(--font-sans, system-ui, sans-serif);
```

### Font Sizes

- **Small**: 11px, 12px (labels, metadata)
- **Base**: 14px, 16px (body text)
- **Large**: 18px, 24px (headings)
- **Extra Large**: 32px, 48px (hero text)

### Font Weights

- **Normal**: 400 (default)
- **Medium**: 500 (emphasis)
- **Bold**: 700 (headings, important)

## Color Usage Patterns

### Background Colors

```css
/* Transparent (default) */
background: transparent;

/* Subtle overlay */
background: rgba(10, 9, 8, 0.4);

/* Gold fill (for emphasis) */
background: var(--gold, #caa554);
color: var(--void, #0a0908); /* Black text on gold */
```

### Text Colors

```css
/* Primary text */
color: var(--dawn, #ebe3d6);

/* Muted text */
color: var(--dawn-50, rgba(235, 227, 214, 0.5));
color: var(--dawn-30, rgba(235, 227, 214, 0.3));

/* Accent text */
color: var(--gold, #caa554);
```

## Interactive Element Patterns

### Buttons

```css
.button {
  padding: 8px 16px;
  border: 1px solid var(--dawn-15);
  background: transparent;
  color: var(--dawn);
  transition: all 0.15s ease;
}

.button:hover {
  border-color: var(--gold-30);
  color: var(--gold);
}

.button--primary {
  background: var(--gold);
  color: var(--void);
  border-color: var(--gold);
}
```

### Links

```css
.link {
  color: var(--dawn);
  text-decoration: none;
  transition: color 0.15s ease;
}

.link:hover {
  color: var(--gold);
}
```

## Layout Patterns

### Grid Systems

```css
/* Responsive grid */
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Flexbox Patterns

```css
/* Centered content */
.container {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Space between */
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Vertical stack */
.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

## Animation Patterns

### Transitions

```css
/* Standard transition */
transition: all 0.15s ease;

/* Specific properties */
transition:
  opacity 0.3s ease,
  transform 0.3s ease;

/* No transition (for static elements) */
transition: none;
```

### Hover States

```css
.element {
  opacity: 1;
  transition: opacity 0.15s ease;
}

.element:hover {
  opacity: 0.8;
}
```

### Focus States

```css
.element:focus {
  outline: 1px solid var(--gold);
  outline-offset: 2px;
}
```

## Responsive Breakpoints

```css
/* Mobile first approach */
.component {
  /* mobile styles */
}

/* Tablet */
@media (min-width: 768px) {
}

/* Desktop */
@media (min-width: 1024px) {
}

/* Large desktop */
@media (min-width: 1440px) {
}
```

## Component Naming Conventions

### BEM-like Structure

```css
.component-name {
}
.component-name__element {
}
.component-name__element--modifier {
}
.component-name--state {
}
```

### Examples from Codebase

- `.astrogation-panel`
- `.astrogation-panel--left`
- `.panel-header`
- `.panel-header--filled`
- `.tree-node-trigger`
- `.tree-node-trigger--selected`

## Z-Index Layers

```css
/* Base content */
z-index: 1;

/* UI elements */
z-index: 2;

/* Overlays */
z-index: 10;

/* Modals, dropdowns */
z-index: 100;

/* Tooltips, highest priority */
z-index: 1000;
```

## Accessibility Patterns

### Semantic HTML

```tsx
// ✅ Good: Semantic elements
<nav>
  <ul>
    <li><a href="...">Link</a></li>
  </ul>
</nav>

// ❌ Bad: Div soup
<div>
  <div>
    <div onClick={...}>Link</div>
  </div>
</div>
```

### ARIA Labels

```tsx
<button aria-label="Close menu">
  <span aria-hidden="true">×</span>
</button>
```

### Focus Management

- Visible focus indicators
- Keyboard navigation support
- Skip links for main content

## Performance Patterns

### CSS Optimization

```css
/* ✅ Good: GPU-accelerated properties */
transform: translateZ(0);
will-change: transform;

/* ❌ Bad: Triggers layout */
top: 10px;
left: 10px;
```

### React Optimization

```tsx
// Memoize expensive components
export const ExpensiveComponent = memo(Component);

// Memoize callbacks
const handleClick = useCallback(() => {}, [deps]);

// Memoize computed values
const expensiveValue = useMemo(() => compute(), [deps]);
```

## Common Anti-Patterns to Avoid

### ❌ Generic Card Design

```css
/* Don't do this */
.card {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 24px;
}
```

### ✅ Frame-Based Design

```css
/* Do this instead */
.card {
  border: 1px solid var(--dawn-08);
  padding: 16px;
  background: transparent;
}
```

### ❌ Hardcoded Colors

```css
/* Don't do this */
.element {
  color: #ebe3d6;
  border: 1px solid #caa554;
}
```

### ✅ Design Tokens

```css
/* Do this instead */
.element {
  color: var(--dawn);
  border: 1px solid var(--gold);
}
```

## Panel Template System

Astrogation uses a unified panel template structure inspired by Starfield and Alien Romulus UI patterns.

### Zone Structure

```
┌─────────────────────────────────────────┐
│ HEADER   │ Title Text │ [icon] [icon]  │ ← Toolbar zone (right-aligned)
├─────────────────────────────────────────┤
│                                         │
│ CONTENT                                 │ ← Scrollable, fills remaining space
│                                         │
├─────────────────────────────────────────┤
│ FOOTER (optional)                       │ ← Status/actions
└─────────────────────────────────────────┘
```

### CSS Classes

```css
.panel-template                    /* Container with zone tokens */
.panel-template__header            /* Header zone with title + toolbar */
.panel-template__title             /* Title text styling */
.panel-template__toolbar           /* Toolbar container */
.panel-template__toolbar-btn       /* Toolbar icon button */
.panel-template__toolbar-btn--primary  /* Primary action button */
.panel-template__toolbar-sep       /* Toolbar separator */
.panel-template__content           /* Scrollable content zone */
.panel-template__content--flush    /* No padding variant */
.panel-template__footer            /* Footer zone */
```

### Zone Tokens

```css
--panel-header-height: 38px;
--panel-toolbar-gap: 4px;
--panel-toolbar-btn-size: 28px;
--panel-content-padding: 12px;
--panel-footer-height: 40px;
```

### Variants

- `--compact`: Smaller header/buttons for dense UIs
- `--dense`: Reduced padding for data-heavy content
- `--notched`: Chamfered header matching inspector frames

### Implementation Example

```tsx
<aside className="panel-template">
  <div className="panel-template__header">
    <span className="panel-template__title">PANEL NAME</span>
    <div className="panel-template__toolbar">
      {/* Conditional toolbar buttons based on context */}
      {showAction && (
        <button className="panel-template__toolbar-btn">
          <Icon />
        </button>
      )}
    </div>
  </div>
  <div className="panel-template__content">{/* Panel content */}</div>
</aside>
```

### Design Rationale

This pattern is derived from Starfield's "SHIP SYSTEMS" panels and Alien Romulus industrial terminals:

- **Labeled zones**: Clear uppercase titles in header
- **Toolbar integration**: Actions live in the header, not floating
- **Industrial precision**: Every element has a designated slot
- **Contextual actions**: Toolbar buttons change based on active view

## Reference-Based Styling

The Foundry Assistant Dock supports applying styles from Survey references:

### Flow

1. Upload reference images to Survey tab
2. Run analysis pipeline (Claude vision analysis)
3. In Foundry, click reference icon to open reference panel
4. Select a reference and click "Apply Style"
5. System extracts tokens and patterns, applies to current component

### Extraction Utilities

- `extractDesignTokens(item)`: Parse Survey analysis → design tokens
- `tokensToDescription(tokens)`: Convert tokens to MCP query
- `tokensToComponentProps(tokens, componentId)`: Generate component props

### Token Categories

```typescript
interface ExtractedTokens {
  colors: { primary, accent, background, text, border, tokenMappings };
  typography: { family, weight, style, size, letterSpacing, casing };
  geometry: { borderRadius, chamferAngle, chamferCorners, borderWidth, hasNotch };
  patterns: { patterns: string[], confidence: Record<string, number> };
  mood: { primary, secondary[], warmth, density, animation };
}
```

## File Locations Reference

- **Component Styles**: `app/styles/components.css`
- **Design Tokens**: `app/styles/variables.css`
- **HUD Styles**: `app/styles/hud.css`
- **Grid System**: `app/styles/grid.css`
- **Base Styles**: `app/styles/base.css`
- **UI Components**: `components/ui/`
- **HUD Components**: `components/hud/`
- **Complex Examples**: `app/astrogation/`
- **Panel Template CSS**: `app/astrogation/astrogation.css` (search for "PANEL TEMPLATE SYSTEM")
- **Token Extraction**: `app/astrogation/_components/utils/extractDesignTokens.ts`
- **Reference Matching Hook**: `app/astrogation/_hooks/useReferenceMatch.ts`
