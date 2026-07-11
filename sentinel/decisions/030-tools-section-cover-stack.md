# ADR-030: Tools section — sticky-overlap cover + console-plate card stack

**Date:** 2026-07-11
**Status:** Accepted
**Scope:** `components/landing/v7/tools-cards/**`,
`app/(internal)/test/project-cards/**` (lab rewired to import the promoted
core), `public/prototypes/v7/landing-v7-motion.html` (#tools station shell),
`app/(marketing)/page.tsx` (relocation spec),
`components/landing/v7/LandingPage.tsx` (ToolsPortal),
`components/landing/v7/HudNav.tsx`,
`components/landing/home-v2/services/services.css` (600svh runway),
`components/landing/home-v2/hooks/useServicesStageScroll.ts`,
`components/landing/home-v2/hooks/useServicesRingWheel.ts`,
`components/landing/home-v2/hooks/useCorridorExitScroll.ts`,
`lib/services-ring/ringMath.ts`.

## Context

The landing flowed `#services` → `#continuum` with a plain document seam:
when the services runway ended, the parked card-ring instrument (ADR-029)
simply scrolled away. Vince (2026-07-11): the next section should be a
**Tools section** — the internal tools (Mímir, Vesper, Babylon, Heimdall)
from the `/test/project-cards` lab — in the lab's **V2 CONSOLE** skin,
and it should "scroll parallax over the Services section … a clean
handover from our 3D wireframe arc brandmark into the Tools", with the
cards then stacking on scroll "like we have it now" (the lab's
vorszk-style sticky-sibling stack). Confirmed calls: the cover leads with
a station header in v7 grammar (placeholder copy, vince-tov pass
pending); all four tools ship with the lab copy as-is.

## Decision

### 1. The cover is a STICKY-OVERLAP, not the ADR-021 clip-path plane

ADR-021's preserved cover-plane recipe exists to cover a FIXED canvas
whose sticky cell has already scrolled away — nothing moves in flow
there, so the cover must be sticky + clip-revealed. Here the covered
surface (`.services-stage`) is pinned BY ITS OWN RUNWAY, so an opaque
higher-z station scrolling up in normal flow IS the parallax cover; a
clip-path would be indistinguishable from the station simply sliding up.
Mechanism:

- The services runway gains one **exit-hold beat**: `500svh → 600svh`,
  `STEP_COUNT`/`RING_STEP_COUNT` `5 → 6`. Beat 5 is pure dwell — the
  staircase's `min(RING_COUNT−1, …)` cap pins the ring on card 3 for the
  whole beat (unit-pinned), so the instrument stands still under the
  rising cover. Card 4's travel completes at p ≈ 0.76; the cover edge
  enters at p = 0.8 — the last card's dwell stays clean.
- `#tools` overlaps exactly that beat: desktop-only
  `margin-top: -100svh; z-index: 8; isolation: isolate`
  (tools-cards.css). Geometry closes exactly because
  `.station--services { padding-bottom: 0 }` and the runway is its last
  child: `runway.bottom == vh ⇔ tools.top == 0` — the cover completes
  precisely when the stage would unpin. Reverse scroll is pure geometry
  (no clock, no writer, no release state).
- The corridor canvas is never opacity-faded (ADR-021/BEST-PRACTICES
  contract): the existing ambient fade in `useCorridorExitScroll` simply
  retargets from `#continuum` to the NEXT station
  (`#tools ?? #continuum`; constants renamed `NEXT_STATION_FADE_*`), so
  the interior bed + brandmark dim under the rising cover on the same
  envelope as before.
- `.station--tools` sets `content-visibility: visible` +
  `contain-intrinsic-size: auto` — `auto`'s placeholder misreports a
  ~6-viewport section and its paint containment clips sticky compositing
  (the exit-state `#services` trap, home-v2.css).

### 2. Step-clock clamps (the wrap-to-first bug)

Beat 5 makes `step − 1` index past the 4-service roster. Two mandatory
clamps: `activeServiceForProgress` clamps to `RING_COUNT − 1` (ringMath,
unit-pinned) and `setActiveByStep` clamps to `SERVICES.length − 1`
(ServicesStage — previously `SERVICES[4] ?? SERVICES[0]` would have
wrapped the readout back to Advisory on the exit beat).
`selectService`'s beat math becomes `(index + 1.5) / (SERVICES.length + 2)`.

### 3. Wheel-hold release under the cover

`useServicesRingWheel` releases wheel ownership once
`runway.bottom < 2·vh` (⇔ tools.top < vh by the −100svh geometry): from
there the wheel is native in BOTH directions — down rides the cover up
over the instrument, up slides it back off. Without this, the ADR-029
last-card HOLD would freeze the page for a pointer-over-instrument wheel
mid-cover. The designed hold still owns beats 1–4 (a snap to the last
card parks at `runway.bottom ≈ 2.25·vh`). No auto-advance — the ADR-029
guardrail stands.

### 4. Promoted module — `components/landing/v7/tools-cards/`

The lab's shared core moved to production (the `v7/build-cases`
precedent; plain DOM, not corridor-coupled — v7, not home-v2):
`useStackedCardsScroll` (+`STACK`), `NotchOutline` (ADR-007 chamfer),
`chrome` primitives, `toolCardData` (ex-projectCardsData; export names
keep the lab-era `ProjectCase`/`PROJECT_CASES` spelling to avoid churning
the five lab skins), `ToolCardConsole` (ex-CardV2 — the shipped skin),
plus new `ToolsCardStack` (V2 chrome hardcoded: bl corner, 40px notch,
solid stroke), `ToolsPortal` (ServicesPortal's root-reuse +
deferred-macrotask-unmount pattern, target `[data-tools-cards-root]`),
and `tools-cards.css` (station cover rules + header + stack mechanic +
shared interior + chrome + the V2 skin + fallbacks).

The lab keeps the five-variant registry and imports the shared pieces
back (V2 mounts the production `ToolCardConsole`, so look-dev never
drifts); `project-cards.css` keeps only the lab shell, switcher, and the
unshipped V1/V3/V4/V5 skins. The stack's inert breakpoint moved
**900 → 960** to align with the services 961 desktop gate (lab behavior
at 901–960px changes accordingly — accepted). The `pcl-` class prefix
travels with the shared components. The landing route gains NO Lenis
(the ADR-029 wheel hook owns gestures natively; the stack mechanic is
plain scroll listeners).

### 5. Section injection through v7-parse

The `#tools` shell is authored in the prototype HTML AFTER the
`practice-to-about` connector (NOT between `#services` and that
connector — the services spec's trailing-connector-drop regex anchors
there), with `station__idx` chrome, a `data-m-group` header (free
reveals), and the portal slot. `CORRIDOR_RELOCATED_STATIONS` becomes
`[{tools}, {services, dropTrailingConnectorSlot}]` — specs insert
immediately after the mount in ARRAY ORDER, so the LAST lands closest:
mount → `#services` → `#tools` → `#continuum`. `HudNav`'s Tools entry
repoints `#build → #tools` (it was a best-guess relabel).

## Verification

- `tests/lib/services-ring-math.test.ts` (33) — 6-beat staircase, the
  exit-hold pin on card 3, active-service clamps.
- `tests/lib/v7-parse.test.ts` (15) — relocation order incl. tools, the
  portal slot surviving, connector drop. (Drive-by: the stale
  `#contact` nav-anchor assertion — the prototype retired its markup
  nav for the React HudNav — now asserts `#continuum`.)
- `tests/visual/tools-cards-smoke.spec.ts` — mid-cover parallax (stage
  pinned while tools on screen), cover-completes-at-unpin geometry,
  wheel release mid-cover both directions, stack pin/cover/reverse
  reset, mobile + reduced-motion plain flow.
- `tests/visual/services-ring-smoke.spec.ts` — beat probes remapped to
  6 beats (0.6 → Keynote/step 3) + the p=0.95 anti-wrap probe
  (step 5, readout still WORKSHOP).
- `tests/visual/landing-corridor-smoke.spec.ts` — station order gains
  `tools`.

## Guardrails

- **Lockstep set (all six or none):** `STEP_COUNT` (aliases
  `RING_STEP_COUNT`) == `RING_STEP_COUNT` == 6 == runway
  `min-height`/100svh == |`#tools` margin-top|/100svh == the wheel
  release gate's `2·vh`. `.station--services { padding-bottom: 0 }` is
  the geometry anchor that makes cover-complete == unpin — do not pad
  the services station below the runway.
- Both active-service clamps (ringMath + ServicesStage) are mandatory;
  removing either wraps the exit beat's readout to the first service.
- The tools stack breakpoint (960) must stay in lockstep between
  `useStackedCardsScroll.isInert()` and the `@media (max-width: 960px)`
  blocks in BOTH tools-cards.css and the lab's project-cards.css.
- The cover overlap (negative margin, z-index) stays inside the
  `(min-width: 961px) and (prefers-reduced-motion: no-preference)`
  gate — mobile/PRM keep plain document flow.
- The station override selectors stay ID-qualified
  (`#tools.station--tools`): `.station:not(.hero)` (landing.css) is
  (0,2,0) and silently beats a lone class on `content-visibility` and
  `z-index` — shipped that way for one run; the off-screen section
  collapsed to its 100vh containment placeholder and every scroll
  target below it landed wrong.
- Never fade the corridor canvas with opacity for this seam; the
  next-station ambient envelope is the only dimmer.
- The landing route stays Lenis-free.
- The card is the lab's console plate verbatim — skin changes happen in
  `ToolCardConsole`/`tools-cards.css` and flow back to the lab's V2
  chip, never as a forked copy.
