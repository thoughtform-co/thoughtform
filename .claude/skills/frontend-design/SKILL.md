---
name: frontend-design
description: Guides front-end design decisions for Thoughtform.co, focusing on component aesthetics, responsive design, and maintaining the existing HUD aesthetic while avoiding generic AI-generated patterns. Activates when optimizing front-end, designing components, or improving responsive behavior.
---

# Frontend Design Skill for Thoughtform.co

This skill helps maintain and enhance the Thoughtform.co design system while building on existing patterns. It focuses on thoughtful, context-aware design decisions that respect the established aesthetic.

## When to Use This Skill

Activate this skill when:

- Optimizing front-end performance or aesthetics
- Designing new components or modules
- Improving responsive design
- Refactoring UI components
- Making design decisions about spacing, typography, or layout
- User asks about "better design", "responsive", "mobile-first", or "component design"
- Working on visual consistency or design system improvements

## Design Philosophy

### Core Principles

1. **Build on Existing Patterns**: Always reference existing components and styles before creating new ones
2. **HUD Aesthetic**: Maintain the futuristic, technical HUD (Heads-Up Display) aesthetic with:
   - Corner brackets and frame elements
   - Subtle grid overlays
   - Monospace typography for technical elements
   - Gold/Dawn/Void color palette
3. **Avoid AI Slop**: Reject generic templates, over-designed components, or patterns that don't fit the brand
4. **Mobile-First**: Design for mobile, enhance for desktop
5. **Performance-Aware**: Consider rendering performance, especially with animations and 3D elements

## Design System Reference

### Color Palette

```css
--void: #0a0908 /* Primary dark background */ --dawn: #ebe3d6 /* Primary light text/accents */
  --gold: #caa554 /* Primary accent (Tensor Gold) */ --dawn-08: rgba(235, 227, 214, 0.08)
  /* Subtle borders */ --dawn-15: rgba(235, 227, 214, 0.15) /* Medium borders */
  --dawn-30: rgba(235, 227, 214, 0.3) /* Visible borders */ --gold-15: rgba(202, 165, 84, 0.15)
  /* Gold borders */ --gold-30: rgba(202, 165, 84, 0.3) /* Gold accents */;
```

### Typography

- **Monospace**: `var(--font-data, "PT Mono", monospace)` for technical/HUD elements
- **Sans-serif**: For body text and UI labels
- **Font sizes**: Use relative units, maintain hierarchy

### Spacing System

- Use consistent padding/margin values
- Reference existing components for spacing patterns
- Maintain breathing room (avoid cramped layouts)

### Component Patterns

**Existing Component Locations:**

- `components/ui/` - Reusable UI components
- `components/hud/` - HUD navigation system
- `app/styles/components.css` - Component styles
- `app/astrogation/` - Example of complex component system

## Design Guidelines

### Component Design

1. **Check Existing Components First**
   - Search `components/ui/` for similar components
   - Review `app/styles/components.css` for styling patterns
   - Reference Astrogation components for complex UI patterns

2. **Maintain Visual Consistency**
   - Use CSS variables for colors (never hardcode)
   - Follow existing border styles (1px solid with opacity variants)
   - Use consistent border-radius (typically 0 or minimal for HUD aesthetic)

3. **Component Structure**

   ```tsx
   // Good: Uses design tokens, follows patterns
   <div className="component-name">
     <div className="component-name__header">...</div>
     <div className="component-name__content">...</div>
   </div>
   ```

4. **Avoid Generic Patterns**
   - ❌ Don't use: Generic card designs, rounded corners everywhere, shadow-heavy designs
   - ✅ Do use: Frame-based designs, corner brackets, subtle borders, HUD aesthetic

### Responsive Design

1. **Mobile-First Approach**
   - Start with mobile layout
   - Use `min-width` media queries for desktop enhancements
   - Test at breakpoints: 320px, 768px, 1024px, 1440px

2. **Breakpoint Strategy**

   ```css
   /* Mobile first */
   .component {
     /* mobile styles */
   }

   @media (min-width: 768px) {
     /* tablet */
   }
   @media (min-width: 1024px) {
     /* desktop */
   }
   ```

3. **Touch Targets**
   - Minimum 44x44px for interactive elements
   - Adequate spacing between touch targets
   - Consider thumb zones on mobile

4. **Content Adaptation**
   - Hide non-essential elements on mobile
   - Stack vertically on mobile, horizontal on desktop
   - Adjust font sizes appropriately
   - Consider viewport units (vw, vh) carefully

### Performance Considerations

1. **Animation Performance**
   - Use `transform` and `opacity` for animations (GPU-accelerated)
   - Avoid animating `width`, `height`, `top`, `left`
   - Use `will-change` sparingly and remove after animation

2. **Rendering Optimization**
   - Use `React.memo` for expensive components
   - Lazy load heavy components (3D, large images)
   - Consider `useMemo` and `useCallback` for expensive computations

3. **CSS Performance**
   - Avoid deep nesting (max 3-4 levels)
   - Use CSS variables for theming
   - Minimize specificity conflicts

## Workflow

### When Designing a New Component

1. **Research Phase**
   - Check `components/ui/` for similar components
   - Review `app/styles/components.css` for styling patterns
   - Look at Astrogation components for complex patterns
   - Use Context7 skill if you need library-specific docs

2. **Design Phase**
   - Sketch component structure following existing patterns
   - Use design tokens (CSS variables)
   - Consider responsive behavior from the start
   - Plan for accessibility (semantic HTML, ARIA labels)

3. **Implementation Phase**
   - Create component in appropriate directory
   - Use TypeScript with proper types
   - Follow existing naming conventions
   - Add to barrel exports if in `components/ui/`

4. **Styling Phase**
   - Use CSS variables for colors
   - Follow existing spacing patterns
   - Add responsive styles
   - Test at multiple viewport sizes

5. **Review Phase**
   - Does it fit the HUD aesthetic?
   - Is it responsive?
   - Does it avoid generic patterns?
   - Does it build on existing patterns?

### When Optimizing Existing Components

1. **Analyze Current Implementation**
   - Read the component code
   - Check related styles
   - Understand the component's purpose

2. **Identify Issues**
   - Responsive problems
   - Performance bottlenecks
   - Visual inconsistencies
   - Accessibility issues

3. **Propose Improvements**
   - Maintain existing patterns where possible
   - Enhance, don't replace
   - Document breaking changes
   - Test thoroughly

## Common Patterns to Avoid (AI Slop)

❌ **Generic Card Designs**

- Over-rounded corners
- Heavy shadows
- Generic padding
- No brand identity

✅ **Frame-Based Designs**

- Corner brackets
- Subtle borders
- HUD aesthetic
- Brand-aligned

❌ **Over-Designed Components**

- Too many animations
- Unnecessary complexity
- Breaking established patterns

✅ **Purposeful Design**

- Animations serve a purpose
- Simple, clear structure
- Builds on existing patterns

❌ **Generic Color Schemes**

- Default Tailwind colors
- Hardcoded colors
- No design system

✅ **Design Token Usage**

- CSS variables
- Brand color palette
- Consistent theming

## Integration with Context7

This skill complements the Context7 documentation skill:

- **Context7**: Provides technical documentation for libraries (Next.js, React, Tailwind, etc.)
- **Frontend Design**: Provides design principles, patterns, and aesthetic guidelines

**When to use both:**

- "How do I create a responsive card component using Tailwind?" → Use Context7 for Tailwind docs, Frontend Design for design patterns
- "What's the best way to implement a modal?" → Use Context7 for React/Next.js patterns, Frontend Design for styling approach

## Examples

### Good Component Design

```tsx
// ✅ Good: Uses design tokens, follows patterns, responsive
export function ComponentName({ children }: ComponentNameProps) {
  return (
    <div className="component-name">
      <div className="component-name__frame">
        <div className="component-name__header">...</div>
        <div className="component-name__content">{children}</div>
      </div>
    </div>
  );
}
```

```css
/* ✅ Good: Uses CSS variables, responsive, follows patterns */
.component-name {
  border: 1px solid var(--dawn-08);
  padding: 16px;
  background: transparent;
}

@media (min-width: 768px) {
  .component-name {
    padding: 24px;
  }
}
```

### Responsive Pattern

```css
/* ✅ Good: Mobile-first, uses design tokens */
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

## Resources

- **Existing Components**: `components/ui/`, `components/hud/`
- **Styles**: `app/styles/` (variables.css, components.css, etc.)
- **Design System**: `app/astrogation/` for complex component examples
- **Context7**: Use for library-specific documentation when needed

## Notes

- Always prioritize existing patterns over new designs
- When in doubt, reference Astrogation components for complex UI patterns
- Test responsive behavior at multiple breakpoints
- Maintain the HUD aesthetic - it's core to the brand
- Performance matters - especially with animations and 3D elements
