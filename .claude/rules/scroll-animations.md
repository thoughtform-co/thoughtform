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

**Home-v2 corridor-exit invariant (ADR-021):** the production seam after the corridor epilogue is a **zoom-dissipate** — the docked R3F canvas plays a fly-into-sphere arc + particle scatter while the brandmark RIDES the sphere off-screen and then re-centres into the (now empty) Services section. `useCorridorExitScroll` owns the dissipate clock: raw progress is stretched over ~2 viewports (post 2026-06-16, ADR-021 follow-up; was 1.58), then eased into `--corridor-dissipate` / `dockProgress`. The hook ALSO writes a `data-services-brandmark` gate (`"hold"` then `"fade"`) + `--services-brandmark` (0..1) opacity var once the dock releases — `ProjectedBrandmarkActor` reads the gate to release the brandmark to CSS, which holds it fixed-centred in `#services` then fades it as `#continuum.top` crosses the `0.5 → 0.1 vh` band. The per-element reveal channels (`--services-header-in`, `--services-grid-in`, `--services-cta-in`) are GONE — `#services` was stripped of its header/cards/CTA in the same revision; restore those channels only if those elements come back. Keep the dock channel (`docked` / `dockProgress`) writes scoped to one hook; do not write `epilogueProgress` / `paintProgress` from the exit hook. The retired cover-plane sweep recipe (lower opaque plane covers a held canvas, first-read copy lives inside the cover) is preserved in `components/landing/home-v2/handoff-lab/` + `/test/handoff-a|b|c` and documented in ADR-021 — reuse that recipe verbatim if a later section needs an Active Theory / Hashgraph-class cover sweep; do not rebuild it.

**Hero → Thoughtform seam invariant (ADR-022 v8):** the hero → corridor seam is a **ToyFight curtain reveal** — the **hero is the moving layer** (`.hero`, `position: relative; z-index: 4`) that scrolls up and off the first viewport, uncovering the corridor's parked `ThoughtformCompassGate` frame held **frozen** behind it (`.home-corridor-host` z:3). NOT the inverse (v7's mistake: a held hero with the corridor rising to cover it), and NEVER a proxy/copy of the second section (v6's mistake). The freeze: `useLandingScroll` toggles `html[data-corridor-entry]` while the corridor stage top is below the viewport top, and `home-v2.css` makes `.home-v2-stage__sticky` `position: fixed; inset: 0` under that flag. At the handoff the flag clears and native sticky resumes at the same `top: 0`, with no transform on the sticky cell and never on `.home-v2-stage`. The hero may receive only a tiny capped inertial `translateY` correction for ToyFight-like smoothness; document scroll, corridor `progress` / `paintProgress` / `epilogueProgress` / `dockProgress`, and the hero video opacity remain untouched. Hero video stays opaque, never scaled/faded (ADR-008 Rule 3, gateway shield). ADR-022 history documents every superseded approach (v6 proxy sweep, v7 held-hero parallax/counter-translate) and its artifact.
