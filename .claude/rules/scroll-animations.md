---
paths:
  - "lib/hooks/useScroll*"
  - "components/hud/NavigationCockpitV2/hooks/**"
  - "components/landing/home-v2/handoff-lab/**"
  - "components/landing/home-v2/home-v2.css"
  - "components/landing/home-v2/hooks/useDepthScroll.ts"
description: Scroll metrics, cockpit integration, and home-v2 handoff compositing
---

# Rule: Scroll animations & cockpit hooks

These paths feed **scroll progress**, **section indices**, **cockpit** behavior, and the home-v2 post-corridor handoff. Changes ripple into Lenis, GSAP, HUD morphing, and the depth-corridor cover transition.

**Read first**

- [ADR-002: Scroll animation architecture](../sentinel/decisions/002-scroll-animation-architecture.md)
- [ADR-005: Scroll-captured content reveal](../sentinel/decisions/005-scroll-captured-content-reveal.md)
- [ADR-018: Home V2 Depth Corridor](../sentinel/decisions/018-home-v2-depth-corridor.md)

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) - if you change shared progress contracts, document in an ADR or extend the relevant decision.

**Home-v2 handoff invariant:** the post-corridor swipe is an opaque incoming cover plane over a held corridor canvas. Keep the first-read services copy inside the 100svh cover, keep the docked canvas opacity at `1`, and let the cover plane do the replacement. Do not re-create this as a transparent parallax section plus a canvas fade.
