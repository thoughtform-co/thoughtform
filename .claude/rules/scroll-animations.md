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

These paths feed **scroll progress**, **section indices**, **cockpit** behavior, and the home-v2 corridor→Services seam. Changes ripple into Lenis, GSAP, HUD morphing, and the docked R3F backdrop.

**Read first**

- [ADR-002: Scroll animation architecture](../sentinel/decisions/002-scroll-animation-architecture.md)
- [ADR-005: Scroll-captured content reveal](../sentinel/decisions/005-scroll-captured-content-reveal.md)
- [ADR-018: Home V2 Depth Corridor](../sentinel/decisions/018-home-v2-depth-corridor.md)
- [ADR-021: Corridor exit zoom-dissipate](../sentinel/decisions/021-corridor-exit-zoom-dissipate.md)

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) - if you change shared progress contracts, document in an ADR or extend the relevant decision.

**Home-v2 corridor-exit invariant (ADR-021):** the production seam after the corridor epilogue is a **zoom-dissipate** — the docked R3F canvas plays a fly-into-sphere arc + particle scatter, and the destination section's own dark surface re-shields within the first viewport. Keep the dock channel (`docked` / `dockProgress`) writes scoped to one hook; do not write `epilogueProgress` / `paintProgress` from the exit hook. The retired cover-plane sweep recipe (lower opaque plane covers a held canvas, first-read copy lives inside the cover) is preserved in `components/landing/home-v2/handoff-lab/` + `/test/handoff-a|b|c` and documented in ADR-021 — reuse that recipe verbatim if a later section needs an Active Theory / Hashgraph-class cover sweep; do not rebuild it.

**Hero → Thoughtform seam invariant (ADR-022 v6.3):** the hero → corridor seam is a **cover-plane swipe** — an opaque plane (`.hero-handoff-cover` → `.hero-handoff-plane`, `HeroHandoffCover` portalled into `main.stations`) carrying the Thoughtform copy + a compass-gate proxy clip-swipes up over the held hero, then hands to the live corridor at `cover = 1`. KEEP the sweep — do not remove it (an interim "direct reveal / edge chrome" pass deleted it; reverted). The proxy diagram MUST mirror the live `ThoughtformCompassGate` (concentric AXIS-ALIGNED dashed squares + compass + NAVIGATE/ENCODE/BUILD labels), NOT a rotated diamond — the diamond was the boundary-jump cause. `useLandingScroll` writes eased `--hero-cover` on `#hero` + `<html>` (the portalled plane inherits via the `<html>` mirror), toggles `data-hero-handoff` mid-band (hero → z:5), and hides the hero at eased `>= 0.98` to match the `--deck-clear` hairline (else the fade reveals the held hero — the "hero flash"). Never scale the hero down (exposes the gateway, ADR-008). Reduced-motion / ≤960px: plane `display: none`, legacy `.hero__video` scale+fade, corridor rises over it. ADR-022 history documents every superseded approach and its artifact.
