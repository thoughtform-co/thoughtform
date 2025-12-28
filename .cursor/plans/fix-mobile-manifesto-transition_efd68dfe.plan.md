---
name: fix-mobile-manifesto-transition
overview: Synchronize the manifesto terminal to services card transition on mobile by smoothly interpolating the bridge frame's dimensions and styles instead of using abrupt CSS class toggles and fades.
todos:
  - id: interpolate-mobile-frame-dims-pos-js
    content: Interpolate bridge-frame dimensions and position on mobile in index.tsx
    status: pending
  - id: fix-mobile-bg-border-logic-js
    content: Fix mobile background/border transition logic in index.tsx
    status: pending
  - id: clean-up-mobile-services-css-overrides
    content: Remove !important overrides in navigation.css for mobile services state
    status: pending
  - id: adjust-mobile-content-cross-fade-timing
    content: Adjust cross-fade timing between manifesto and services content on mobile
    status: pending
---

1.  **Analyze and refine mobile style interpolation** in `components/hud/NavigationCockpitV2/index.tsx`:
    - Update the mobile `top`, `width`, and `height` calculations to smoothly interpolate from manifesto terminal dimensions to services card dimensions (340x420px) using `tServicesCards`.
    - Fix the background, border, and backdrop-filter logic to transition to the `ServiceCard` aesthetic (rgba(10, 9, 8, 0.85), 12px blur) instead of fading to zero.
    - Delay the application of the `mobile-services-active` class until the transition is significantly advanced to prevent layout jumps.

2.  **Clean up CSS overrides** in `app/styles/navigation.css`:
    - Remove `!important` from size, position, and background properties in `.bridge-frame.mobile-services-active` to allow JS-driven interpolation via inline styles.
    - Ensure the transition between `.manifesto-active` and `.mobile-services-active` is seamless.

3.  **Coordinate content cross-fade**:
