# ADR-033: Arc Cases Orbit — the four cases orbit the Build sphere on demand; #tools/#build retire

**Date:** 2026-07-13
**Status:** Accepted
**Scope:** `lib/arc-cases/**`, `lib/stores/arcCasesStore.ts`,
`components/landing/home-v2/arc-cases/**`,
`components/landing/home-v2/arcCasesOrbit.ts` (flag),
`components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx` (ring mount),
`components/landing/home-v2/DepthGatewayScene/shell/ShellStack.tsx` + `sceneGeom.ts` (armed dims),
`components/landing/home-v2/CorridorStationHeaders.tsx` (CTA dock),
`components/landing/home-v2/services/ServicesRailRegister.tsx` (register split),
`app/(marketing)/page.tsx` (funnel arrays),
`components/landing/home-v2/hooks/useCorridorExitScroll.ts` (services→about seam),
`lib/rail-manifest/entries.ts` (pillars),
`app/(internal)/test/arc-cases-orbit` (lab),
`tests/visual/arc-cases-orbit-smoke.spec.ts`.

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

## Decision

**Flag:** `ARC_CASES_ORBIT` in `arcCasesOrbit.ts` (ON). Off restores the
pre-ADR-033 corridor byte-identically — every per-frame hook multiplies
by a literal constant and every mount is conditional. Gate
`ARC_CASES_MEDIA` = `(min-width: 1101px) and (min-height: 760px) and
(prefers-reduced-motion: no-preference)`: **ring mount gate == CTA host
gate** (`CorridorStationHeaders` hides at ≤1100px/≤759px) — a ring
without its arming CTA is dead weight. Deliberately narrower than the
services ring's 961px gate.

### 1. Click-owned orbit, scroll-gated

`arcCasesStore` (zustand) holds `armed` + a CUMULATIVE `caseIndex`
(front slot = mod 4; `stepToCase` adds `shortestCaseDelta` so the ring
always takes the short way). A damped ARM LEVEL (`dampLevel`, rate 2.2)
is the orbit's only clock: one reversible entrance envelope
(`armEnvelope`, staggered `ARC_ENTRANCE_WINDOWS`) plays in on arm and
backwards on disarm — no exit table. Rotation targets
`rotationForCaseIndex` through the shipped `stepRingSpring` (ω/ζ/cap
unchanged; conditional idle-resume snap per ADR-029 U5). Scroll GATES
rather than drives: `arcBandFactor(paintProgress, epilogueProgress)` —
Build-band rise `[0.845, 0.9]` × epilogue kill `[0, 0.1]` — multiplies
everything, assembled at the mount with the dissipate guard. **ADR-032
guardrails carried:** reads `paintProgress`/store only, no new scroll
writers, no scroll lock, no backdrop/modal (the sphere keeps primacy);
**ADR-021:** no wall-clock motion — spring settle + pointer only.
Pure math in `lib/arc-cases/orbitMath.ts`, pinned by
`tests/lib/arc-cases-orbit.test.ts`; `lib/services-ring/ringMath.ts` is
imported UNCHANGED (its vitest pin stayed byte-identical).

### 2. One rig, second ring

`ArcCasesGate` mounts `ArcCasesRing` (scale 0.62) beside
`CorridorArmillary` inside the actor's `pointerLookRef` group — the
Build-park transform (on-axis camera, parkDistance 6.2, recT = 0 ⇒
identity pointer-look) frames it at the services ring's apparent size.
`ArcCasesRing` is a copy-adjusted SIBLING of `ServicesCardRing` (same
device-slab anatomy, renderOrder < 1, depth-write hysteresis on the
front content plane only, NormalBlending, opaque-void chamfers, hover
veil-resolve + tilt). Its bake (`bakeCaseCardFace`) letterboxes the
LANDSCAPE case screenshots into a framed 840×470 window (never
portrait-cropped), with codename chip, index/status, mode + tagline +
headline metric caption, title segments (em → upright gold), subline
lede, stack chips — and **no CTA box** (repos are private; the front
card is a showcase, not a link). Bake is DEFERRED until the Build band
first opens or the store first arms.

### 3. Exclusivity contract (two rings, one canvas)

Cases ring visibility = armLevel × `arcBandFactor` × `(1 −
smoothstep(0, 0.15, dissipate))` — requires the intelligence beat and
`epilogueProgress < 0.1`. The services ring's entrance rides the
dissipate clock (windows start 0.6), and dissipate cannot rise before
`epilogueProgress ≥ 0.72` (dock gate). **The two windows are provably
disjoint; the rings can never co-render.** Pinned in
`tests/lib/arc-cases-orbit.test.ts` ("exclusivity") and exercised by
the smoke.

### 4. CTA + armed dims + hit layer

`ArcCasesCta` docks under the persistent caption card (the ADR-032 v1
chip position), driven by the headers' single rAF: opacity =
`bandOpacity(p, BUILD_FADE_IN) × buildOut × (docked ? 0 : 1)`, inert
below the arrive threshold. Rest label `VIEW THE CASES`; armed `CLOSE ·
NN / 04` in terminal inverse video. Auto-disarm watcher (depth-store
subscribe, no re-render): `beat !== "intelligence" || epilogue > 0.02 ||
docked || !active`. While armed the caption irises back (×
`1 − 0.8·level`), the SURFACES fan sinks hard (`ARC_SURFACE_DIM 0.85`)
and the SOURCES lanes sink soft (`ARC_SOURCE_DIM 0.35`) — ShellStack
materials + `gateStackLabel` DOM chips on the ring's own damped level
via `arcCasesLevelRef` (single writer: the ring's useFrame).
Clicks: **DOM hit rects** (`ArcCasesHitAreas`, `arcRingAnchors` store
channel) — side/back cards step; the front card exposes no target.

### 5. Funnel restructure (parse arrays only — no prototype edits)

`CORRIDOR_REPLACED_STATIONS` += `build`, `tools`;
`CORRIDOR_RELOCATED_STATIONS` = `[{about}, {services, drop
practice-to-about}]` ⇒ **hero → mount → services → about → continuum →
practice → contact.** The services→about exit seam: `nextStation =
#about ?? #continuum`, the `--tools-bg-in` channel DELETED, ambient
fade retuned `START 0.6 / END 0.0` (the receded mark + ambient bed die
exactly as the opaque bio top reaches the viewport top — About IS the
cover), `#about` gets the veil z-lift (z6) + content-visibility escape.
The services decommission beat (card fly-out + brandmark recede) stays
— it is now the send-off into the void before the bio. Rolodex pillars:
**Arc / Services / About** (8-entry manifest; `ManifestEntryId` lost
tools/build). HudNav: Services / About / Vision. `ToolsRailRegister`
split: `ServicesRailRegister` ("SOURCE BUS · 04", scroll-owned wipe, no
handover machinery) mounts into the SAME authored
`[data-tools-rail-root]` slot (legacy name kept — renaming needs a
prototype edit); its CSS moved to `services.css`.

### 6. Decommission inventory

DELETED (git is the archive — the ADR-032 revert precedent; `legacy/`
is for whole-era archives per ADR-004): `components/landing/v7/
build-cases/` (all), `tools-cards/ToolsPortal.tsx`, `ToolsCardStack.tsx`,
`ToolsTitleTypewriter.tsx`, `ToolsRailRegister.tsx`,
`tests/visual/tools-cards-smoke.spec.ts`, the `#tools` station block in
`tools-cards.css`. SURVIVES: `toolCardData.ts` (**PROJECT_CASES is the
single canonical case module** — headline `metric` folded in from
BUILD_CASES; private repoUrls dropped), `ToolCardConsole.tsx` +
`chrome.tsx` + `NotchOutline.tsx` + `useStackedCardsScroll.ts` + the
`pcl-*` CSS core (the `/test/project-cards` lab imports them; the
console skin is the orbit bake's visual reference). INERT LEFTOVERS
(deliberate): the `#build` cadence selectors in `landing.css` shared
lists follow the `#definition` precedent (removed stations keep their
authored-sheet rules for sliced lab routes); the authored prototype
keeps the #tools/#build sections + comments (design archive — the parse
arrays own production).

Mobile/PRM story: capable phones run the corridor but never mount the
orbit (gate parity) — the Build stage's mobile straddle carries a
static four-chip case index (`.home-v2-case-chips` in `StationTitle`);
the PRM/no-WebGL `FallbackCorridor` renders the four codenames as one
plain text line. No CTA anywhere off-desktop.

## Alternatives rejected

- Generalizing `ServicesCardRing` into a shared component now (1,200
  lines, shipped 3 days ago; look-dev churn belongs in a sibling —
  **a shared device-slab card primitive is a candidate extraction once
  the cases orbit design settles**).
- Canvas raycast opt-in (`data-corridor-epilogue` pattern) for card
  clicks — would raycast the whole viewport for the entire Build band
  and steal HUD hover; DOM hit rects (`ServicesRingHitAreas` precedent)
  give real buttons/focus/aria with zero `useDepthScroll` edits.
- Keeping `#tools` as a standalone station ("too much", breaks the
  services→bio flow — the restructure's whole point).
- A scroll-owned orbit (the services model) — the Build window
  `[0.845, 1]` has no runway to spare, and re-tiling `CORRIDOR_MAP` for
  an interaction the user may never open inverts the opt-in premise.

## Verification

Lab `/test/arc-cases-orbit` (real store + spring + dims preview).
`tests/lib/arc-cases-orbit.test.ts` (14) pins rotation/step/envelope/
band/exclusivity; `services-ring-math` untouched-green.
`tests/visual/arc-cases-orbit-smoke.spec.ts` (9 structural tests): CTA
band arrival/inert, arm → 2 side hit buttons + caption/surfaces/sources
dims at contract values, stepping, close drains, scroll-out
auto-disarm + clean reverse, PRM mounts nothing, mobile hidden.
Ring smoke extended: SOURCE BUS register (4 rows, 1 active) +
services→about seam (ambient + exit attributes clear under the bio
cover). rail-manifest + v7-parse pinned to the new arrays.
Known-red backlog: the 13 pre-existing scan-notes smoke failures
(landing-corridor-smoke) predate this ADR — see the spun-off fix task.

## Recovery

ADR-032 code: v1 `6a6bd98`, v2 `c346586`, revert `1100200`.
`#tools`/`#build` full implementations: last alive at `55afc8a^`
(Phase C parent); deletions landed in the Phase D commit.

## Updates

(none)
