---
name: Mobile Manifesto-to-Services Morph
overview: Refactor the mobile services transition so the bridge-frame morphs directly into the Strategies card (same as desktop), with Keynotes and Workshops appearing as stacked cards behind it—achieving true frame continuity instead of a cross-fade.
todos:
  - id: refactor-services-stack-mobile
    content: "Refactor ServicesStackMobile: front card content in bridge-frame, back cards separate"
    status: pending
  - id: interpolate-mobile-frame-dimensions
    content: Interpolate bridge-frame dimensions/position via inline styles (remove CSS class approach)
    status: pending
  - id: wire-strategies-content-into-bridge-frame
    content: Render Strategies card content (title, body, sigil) inside bridge-frame during transition
    status: pending
  - id: add-back-cards-emergence
    content: Add Keynotes/Workshops cards emerging behind bridge-frame with offsets
    status: pending
  - id: clean-up-mobile-services-css
    content: Remove conflicting !important CSS overrides for mobile-services-active
    status: pending
  - id: swipe-after-morph-complete
    content: Only enable swipe interaction after tServicesCards >= 0.95
    status: pending
---

# Mobile Manifesto-to-Services Frame Morph

## Problem

On mobile, the manifesto terminal "fades out" and then `ServicesStackMobile` "pops in" as a separate overlay with 3 complete cards. This creates a disconnected feel rather than the smooth frame morph we have on desktop.

## Goal

The `bridge-frame` should morph into the **Strategies** service card (same as desktop). Cards 1 (Keynotes) and 2 (Workshops) appear **behind** it as a swipeable stack.

---

## Architecture Changes

### 1. Refactor ServicesStackMobile

Current: Renders 3 complete `ServiceCard` components (each with their own frames) as an overlay.

New structure:

- **Front card (Strategies)**: Content only (title, body, sigil) renders directly inside `bridge-frame`—the bridge-frame IS the card frame
- **Back cards (Keynotes, Workshops)**: Full `ServiceCard` components positioned behind bridge-frame with stack offsets

File: [`components/hud/NavigationCockpitV2/ServicesStackMobile.tsx`](components/hud/NavigationCockpitV2/ServicesStackMobile.tsx)

### 2. Mobile Bridge-Frame Dimension Interpolation

Instead of CSS class toggles (`mobile-services-active`), interpolate all properties via inline styles:

```
Manifesto state → Services state
─────────────────────────────────
width:    var(--frame-max-w) → 340px
height:   auto/max-height   → 420px
top:      current           → 50% (centered)
transform: translate(-50%, calc(-50% * t))
```

File: [`components/hud/NavigationCockpitV2/index.tsx`](components/hud/NavigationCockpitV2/index.tsx) (mobile style block, lines ~887-966)

### 3. Content Transition Inside Bridge-Frame

- Manifesto content (question + typed paragraphs) fades out as `tServicesCards` increases
- Strategies card content (title, body, sigil) fades in inside the same frame
- The terminal header "THOUGHTFORM@MANIFESTO:~" stays visible throughout (already exists on both layouts)

### 4. Back Cards Emergence

- Keynotes and Workshops cards slide in from behind (y-offset + scale) starting at `tServicesCards > 0.2`
- These are full `ServiceCard` components with their own frames
- Positioned absolutely behind the bridge-frame

### 5. Clean Up CSS

Remove `!important` overrides from `.bridge-frame.mobile-services-active` that conflict with JS interpolation. Keep minimal CSS for the final resting state.

File: [`app/styles/navigation.css`](app/styles/navigation.css) (lines ~1143-1177)

### 6. Swipe Interaction

Only enable swipe-to-cycle after morph is complete (`tServicesCards >= 0.95`). When swiping:

- Bring tapped back card to front
- Current front card animates to back position
- Update which content renders in bridge-frame vs. which renders as back cards

---

## Key Principle

**One persistent frame, content swaps.** The bridge-frame has been the user's visual anchor since the hero section. It should never disappear—only transform.
