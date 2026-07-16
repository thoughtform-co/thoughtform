# ADR-044: Services masthead + smaller, lower parked instrument

**Date:** 2026-07-16
**Status:** Accepted
**Scope:** `components/landing/home-v2/services/` (`ServicesMasthead.tsx` new,
`ServicesStage.tsx` mount, `serviceData.ts` copy, `services.css` block),
`components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx`
(park geometry), `components/landing/v7/LandingPage.tsx` (register mount
removed). Origin lab: `app/(internal)/test/services-wordmark/`.
Builds on ADR-043 (wordmark bottom-left freed the top band).

## Context

With the wordmark moved to the bottom-left (ADR-043), `#services` gets the
Linear-style editorial register validated in the lab: **full-caps title on
the left, intro paragraph on the right**, in the section's upper band —
the "handover from the Arc into the next sections" (owner, 2026-07-16).
The parked WebGL instrument (particle brandmark + armillary + card ring)
centered dead-middle at scale 1.15 put the front card's top edge ~16-18vh
from the viewport top — inside the masthead band — so the instrument also
becomes **smaller and lower**.

## Decision

1. **`ServicesMasthead`** — a pure presentational component (no state /
   effects / refs / subscriptions), first child of `.services-stage__items`,
   gated on `SERVICES_CARD_RING`. Copy lives in `serviceData.ts`
   (`SERVICES_MASTHEAD`): eyebrow `Services · 04`, title `ONE LOOP.` /
   `THREE DEPTHS.` (em line gold), the loop intro paragraph.
   - **ADR-029 relationship:** this is the sanctioned SECTION-level DOM
     text. It carries no per-card copy, never reads `data-active-step`,
     and is `pointer-events: none` — the "card is ONE object / no DOM text
     console beside the ring" guardrail stands untouched.
   - Rides the existing envelopes only: `opacity: --svc-content-in ×
(1 − --svc-exit)` + the 18px content-in rise. No new scroll writer.
   - Band geometry (lab-validated): columns `--hud-margin + 8vw` inboard
     of the rail guides; top `--hud-rail-y-start + clamp(24px,6vh,72px)`;
     intro `+34px` for first-line alignment. ≤960px / reduced-motion: the
     masthead is static in flow above the plate accordion (it is the
     section's real `<h2>` heading — an a11y gain).

2. **Parked instrument geometry** (`BrandmarkPhysicsCoreActor.tsx`):
   - `CENTER_TARGET_SCALE` 1.15 → **1.0** (~13% smaller; mark + orbits +
     ring scale as ONE group; `recT = 0` through the corridor so pre-dock
     frames are byte-identical).
   - New **`CENTER_Y_OFFSET = 0.1`** wu: the park target drops along
     camera-DOWN before the `recT` lerp. Derivation: viewport height at the
     park plane = `2 × 3.2 × tan(19°)` = 2.204 wu → 0.1 wu ≈ 4.5vh (the
     nearer front card shifts ~6.3vh). Shipped at 0.2, halved on owner
     review the same day once the masthead band anchored to the corner
     zone (see below) — the instrument re-balances toward center while
     the front card keeps ~5vh clearance under the title band. Never
     retune ring math to solve clearance; this constant is the lever.
   - Decoupled from the ~0.14 matched-pixel SVG handoff (screen-rect
     driven, `recT = 0` there). Mark stays frontal (no rotation touched).
     Ring tunables are instrument-local and inherit; hit areas +
     designation anchors re-project per frame — nothing else changed.

3. **The SOURCE BUS · 04 right-rail register is retired** (owner decision):
   the masthead's intro paragraph is the services right-side text now.
   `ServicesRailRegisterPortal` is unmounted from `LandingPage`;
   `ServicesRailRegister.tsx` + its CSS + the `[data-tools-rail-root]`
   prototype shell stay on disk for rollback. **This deliberately amends
   ADR-031 Updates 7-8 rail uniformity** ("each pillar: name left,
   sub-items right"): during services the right rail is empty; the Arc's
   `CorridorProgressRail` register is unchanged.

## Consequences

- The Arc → Services transition now reads as a register change (centered
  cinematic corridor → editorial split station) — the two-register model
  the owner chose for post-corridor sections.
- Copy tension, owner-accepted: "THREE DEPTHS." predates the fourth
  service (Strategic Advisory, 2026-07-09). Data-only change if revisited.
  **Revisited 2026-07-16 (same-day copy sweep):** masthead is now
  `ONE PRACTICE.` / `FOUR WAYS IN.` with a concrete intro, and the card
  titles/ledes moved to Vince's first-person voice (`SERVICE_PLATES` +
  the vestigial `SERVICES` fields in lockstep). Data-only, as predicted.
  The masthead inset also consumes the shared `--rail-inset` token since
  ADR-045 (about rail parity) — same computed value, calc kept as fallback.
- Rollback of the register = remount `ServicesRailRegisterPortal` in
  `LandingPage` (one line) — but reconcile with the masthead paragraph
  first (both on the right would compete).
- The flag-off (`SERVICES_CARD_RING = false`) rack path renders no
  masthead — that fallback surface is unchanged.
