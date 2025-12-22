---
name: Mobile Responsive Implementation
overview: Implement a mobile-responsive design for the Thoughtform website, restructuring the hero section to place content inside/around the gateway, converting the definition section to a vertically-stacked layout with tabbed module cards, and adapting the navigation HUD for mobile viewports while preserving all desktop functionality.
todos:
  - id: mobile-infrastructure
    content: Add useMediaQuery hook and mobile CSS variables/breakpoint foundation
    status: completed
  - id: navigation-mobile
    content: Implement mobile hamburger menu and simplified HUD frame
    status: completed
    dependencies:
      - mobile-infrastructure
  - id: hero-mobile
    content: Restructure hero section for mobile (wordmark above, text below gateway)
    status: completed
    dependencies:
      - mobile-infrastructure
  - id: definition-mobile
    content: Create MobileModuleTabs component and mobile definition layout
    status: completed
    dependencies:
      - mobile-infrastructure
  - id: content-sections
    content: Add mobile styles for manifesto, services, and contact sections
    status: completed
    dependencies:
      - mobile-infrastructure
  - id: performance-opts
    content: Optimize particle systems and Three.js for mobile performance
    status: completed
    dependencies:
      - hero-mobile
  - id: testing-refinement
    content: Test on mobile viewports and refine touch interactions/scroll behavior
    status: completed
---

# Mobile Responsive Implementation

## Current State Analysis

The website currently has:

- **HUD/Navigation**: Fixed corner brackets, side rails (depth scale left, section markers right), top navbar, bottom coordinates bar
- **Hero Section**: Fixed left column (wordmark, arrows, bridge frame with text) + centered Three.js gateway
- **Definition Section**: Fixed elements (wordmark slides from hero, sigil in center, 3 module cards on right)
- **Existing breakpoints**: 1100px (simplified padding), 900px (rails hidden), 600px (brand/coords hidden)

---

## Implementation Strategy

### Phase 1: Mobile Detection and CSS Infrastructure

Add mobile-first CSS variables and a React hook for responsive behavior:

- **File**: [`app/globals.css`](app/globals.css)
- Add mobile breakpoint variable (`--breakpoint-mobile: 768px`)
- Define mobile-specific spacing tokens
- Add `@media (max-width: 768px)` blocks for each component
- **New File**: `lib/hooks/useMediaQuery.ts`
- Simple hook to detect mobile viewport in React components
- Used for conditional rendering (not just CSS hiding)

---

### Phase 2: Navigation Bar Mobile Adaptation

- **File**: [`components/hud/NavigationBar.tsx`](components/hud/NavigationBar.tsx)
- Condense horizontal nav to hamburger menu on mobile
- Keep logo visible and centered
- Add slide-out or dropdown menu panel
- **File**: [`components/hud/HUDFrame.tsx`](components/hud/HUDFrame.tsx)
- Hide rails completely on mobile (already done at 900px)
- Hide corner brackets on mobile for cleaner look
- Simplify bottom bar (hide coords, keep instruction text)

---

### Phase 3: Hero Section Mobile Layout

**Goal**: On mobile, the gateway becomes the central hero element with text content positioned inside/around it.

- **File**: [`components/hud/NavigationCockpitV2/index.tsx`](components/hud/NavigationCockpitV2/index.tsx)
- Detect mobile viewport
- Conditionally render mobile-specific hero layout
- Move wordmark ABOVE gateway (centered)
- Position bridge frame text BELOW gateway (centered)
- Hide runway arrows on mobile (not relevant to single-column)
- **File**: [`components/hud/NavigationCockpitV2/styles.ts`](components/hud/NavigationCockpitV2/styles.ts)
- Add mobile-specific styles for hero elements:

```css
@media (max-width: 768px) {
  .hero-wordmark-container {
    left: 50%;
    transform: translateX(-50%);
    top: 20vh !important;
    width: 80vw;
    max-width: 300px;
  }

  .bridge-frame {
    left: 50%;
    transform: translateX(-50%);
    bottom: 15vh !important;
    width: 90vw;
    max-width: 400px;
  }

  .hero-runway-arrows {
    display: none;
  }
}
```

- **File**: [`components/hud/ThreeGateway.tsx`](components/hud/ThreeGateway.tsx)
- Adjust gateway position/scale for mobile (center it, possibly scale down slightly)

---

### Phase 4: Definition Section Mobile Layout

**Goal**: Vertically stack logo/frame above sigil, with tabbed module cards below.

- **New File**: `components/hud/NavigationCockpitV2/MobileModuleTabs.tsx`
- Tabbed interface wrapping the 3 module cards
- Tab headers: "Navigate", "Collaborate", "Build"
- Single visible panel at a time with swipe/tap navigation
- **File**: [`components/hud/NavigationCockpitV2/ModuleCards.tsx`](components/hud/NavigationCockpitV2/ModuleCards.tsx)
- Export card data for reuse in mobile tabs
- Add responsive styles to hide desktop layout on mobile
- **File**: [`components/hud/NavigationCockpitV2/SigilSection.tsx`](components/hud/NavigationCockpitV2/SigilSection.tsx)
- Adjust sigil positioning for mobile (centered, smaller scale)
- **File**: [`components/hud/NavigationCockpitV2/styles.ts`](components/hud/NavigationCockpitV2/styles.ts)

```css
@media (max-width: 768px) {
  .section-definition {
    flex-direction: column;
    padding: 60px 20px !important;
    gap: 40px;
  }

  .definition-modules {
    position: relative;
    right: unset;
    top: unset;
    transform: none;
    width: 100%;
  }

  .fixed-sigil-container {
    position: relative;
    transform: none;
    top: unset;
    left: unset;
  }
}
```

---

### Phase 5: Content Sections Mobile Adaptation

- **File**: [`app/globals.css`](app/globals.css)
- Update `.section` padding for mobile
- Update `.section-layout`, `.manifesto-layout-text` for full-width
- Stack `.services-grid` to single column
- Adjust typography scale for mobile

```css
@media (max-width: 768px) {
  .section {
    padding: 80px 24px !important;
  }

  .section-layout,
  .manifesto-layout-text {
    max-width: 100%;
  }

  .headline {
    font-size: clamp(24px, 6vw, 32px);
  }
}
```

---

### Phase 6: Touch and Scroll Optimization

- **File**: [`lib/hooks/useLenis.ts`](lib/hooks/useLenis.ts)
- Ensure Lenis smooth scroll works well on touch devices
- Add touch-specific scroll damping if needed
- **File**: [`components/hud/NavigationCockpitV2/index.tsx`](components/hud/NavigationCockpitV2/index.tsx)
- Simplify scroll-based animations for mobile performance
- Reduce particle counts on mobile for performance

---

## File Changes Summary

| File | Changes |

|------|---------|

| `app/globals.css` | Mobile breakpoints, section spacing, typography |

| `lib/hooks/useMediaQuery.ts` | **NEW** - Mobile detection hook |

| `components/hud/NavigationBar.tsx` | Hamburger menu, mobile layout |

| `components/hud/HUDFrame.tsx` | Hide corners/rails on mobile |

| `components/hud/NavigationCockpitV2/index.tsx` | Mobile hero layout, performance opts |

| `components/hud/NavigationCockpitV2/styles.ts` | All mobile-specific component styles |

| `components/hud/NavigationCockpitV2/ModuleCards.tsx` | Hide desktop version on mobile |

| `components/hud/NavigationCockpitV2/MobileModuleTabs.tsx` | **NEW** - Tabbed mobile cards |

| `components/hud/NavigationCockpitV2/SigilSection.tsx` | Mobile positioning/sizing |

| `components/hud/ThreeGateway.tsx` | Mobile gateway positioning |---

## Mobile UX Principles

1. **Smooth App Feel**: Use CSS transitions for all state changes, swipeable tabs
2. **Touch Targets**: Minimum 44px for all interactive elements
3. **Performance**: Reduce particle counts, simplify Three.js rendering on mobile
4. **Scroll Behavior**: Maintain smooth scrollytelling with appropriate mobile thresholds
