---
paths:
  - "lib/hooks/useScroll*"
  - "components/hud/NavigationCockpitV2/hooks/**"
description: Scroll metrics and cockpit scroll integration
---

# Rule: Scroll animations & cockpit hooks

These paths feed **scroll progress**, **section indices**, and **cockpit** behavior. Changes ripple into Lenis, GSAP, and HUD morphing.

**Read first**

- [ADR-002: Scroll animation architecture](../sentinel/decisions/002-scroll-animation-architecture.md)
- [ADR-005: Scroll-captured content reveal](../sentinel/decisions/005-scroll-captured-content-reveal.md)

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) — if you change shared progress contracts, document in an ADR or extend the relevant decision.
