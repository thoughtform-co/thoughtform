# ADR-033: Arc Cases Orbit — the four cases orbit the Build sphere on demand; #tools/#build retire

**Date:** 2026-07-13
**Status:** Proposed
**Scope:** `lib/arc-cases/**`, `lib/stores/arcCasesStore.ts`,
`components/landing/home-v2/arc-cases/**`,
`components/landing/home-v2/arcCasesOrbit.ts` (flag),
`components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx` (ring mount),
`components/landing/home-v2/CorridorStationHeaders.tsx` (CTA dock),
`app/(marketing)/page.tsx` (funnel arrays),
`components/landing/home-v2/hooks/useCorridorExitScroll.ts` (services→about seam),
`lib/rail-manifest/entries.ts` (pillars),
`app/(internal)/test/arc-cases-orbit`.

## Context

The landing funnel read hero → corridor (thesis + the Arc) → services →
tools → continuum → practice → build → about → contact. The four
production cases (Mímir / Vesper / Babylon / Heimdall) rendered TWICE —
the `#tools` V2-console stack (ADR-030) and the `#build` editorial
slides — and the tools stack sat between Services and the bio, breaking
the funnel Vince wants: positioning → the Arc → services → bio →
philosophy → proof → contact ("if I put them after the services and
then talk about my bio, it just breaks the flow").

The cases are the most tangible proof of the Build pillar, so they move
INTO the Arc: at the corridor's Build park ("BUILD ON THE LAYER" —
sources feed the sphere, surfaces fan out), a call-to-action arms an
orbit of the four case cards around the accretion sphere. **The user
chooses to see the cases** — nothing is forced over the artifact.

Prior art and the two rejections this design answers:

- **ADR-029** (services card ring, live): cards orbiting the corridor
  brandmark instrument in the shared canvas — the machinery this reuses.
- **ADR-032 v1** (`6a6bd98`, reveal consoles incl. `BuildToolTiles.tsx`):
  rejected on sight — a fixed drawer competed with the artifact. The
  bottom-docked chip position was NOT the objection; the drawer was.
- **ADR-032 v2** (`c346586`, diegetic overlays + rail DETAIL toggle):
  reverted with v1 at `1100200` "to rethink later."
  Click-armed orbit answers both: diegetic (rides the instrument, no
  panel), and opt-in (the CTA is the only new chrome).

## Decision (shape — to be fleshed out at ship)

**Flag:** `ARC_CASES_ORBIT` in `arcCasesOrbit.ts`; off = corridor
byte-identical. Gate `ARC_CASES_MEDIA` = `(min-width: 1101px) and
(min-height: 760px) and (prefers-reduced-motion: no-preference)` —
ring mount gate == CTA host gate (`CorridorStationHeaders` hides at
≤1100px/≤759px); a ring without its arming CTA is dead weight.

1. Click-owned, not scroll-owned: `arcCasesStore` (`armed`, cumulative
   `caseIndex`) + damped arm level; rotation targets
   `rotationForCaseIndex` through the shipped `stepRingSpring`. No new
   scroll writers, no scroll lock, no backdrop (ADR-032 guardrails);
   no wall-clock motion (ADR-021).
2. The ring is a second child of the actor's `pointerLookRef` group
   (sibling of `CorridorArmillary`) — the Build-park transform frames it
   at the services ring's apparent size at `scale 0.62`.
3. **Exclusivity contract:** cases ring visibility requires the Build
   beat AND `epilogueProgress < 0.1`, × `(1 − smoothstep(0, 0.15,
dissipate))`; the services ring's entrance requires dissipate ≥ 0.6,
   which requires `epilogueProgress ≥ 0.72`. The two rings share the
   canvas and can never co-render.
4. Funnel restructure rides the parse arrays only (no prototype edits):
   remove `build` + `tools`, relocate `[about, services]` ⇒
   hero → mount → services → about → continuum → practice → contact.
   Rolodex pillars become **Arc / Services / About**.
5. `PROJECT_CASES` (`tools-cards/toolCardData.ts`) becomes the single
   canonical case-data module (+ headline `metric` folded from
   `BUILD_CASES`); `build-cases/` deletes whole.

## Alternatives rejected

- Generalizing `ServicesCardRing` into a shared component now (1,200
  lines, shipped 3 days ago; look-dev churn belongs in a sibling —
  a shared device-slab card primitive is a candidate extraction once
  the cases orbit settles).
- Canvas raycast opt-in (`data-corridor-epilogue` pattern) for card
  clicks — would raycast the whole viewport for the entire Build band
  and steal HUD hover; DOM hit rects (`ServicesRingHitAreas` precedent)
  give real buttons/focus/aria.
- Keeping `#tools` as a standalone station ("too much", breaks the
  services→bio flow — the restructure's whole point).

## Recovery

ADR-032 code: v1 `6a6bd98`, v2 `c346586`, revert `1100200`.
`#tools`/`#build` sections + portals: recoverable at the Phase C/D
commits recorded here at ship time.

## Updates

(none yet — Proposed)
