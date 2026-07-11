# ADR-030: Tools section — viewscreen handover + calibrated edge-bus deck

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

## Update 1 (2026-07-11, same day): "the viewscreen changes modes" —

## the cover is REJECTED; the seam becomes an in-place mode switch

Vince, reviewing the shipped cover: the site is a navigational
interface — the visitor dives into the Ark's sphere at #services and
sits inside a 3D world. A flat panel sliding over that world is "two
abrupt, completely different types of UX." Governing metaphor: the Star
Trek bridge viewscreen — one screen that shows SPACE and can transform
into a DATA READOUT. The transition must happen IN PLACE. Confirmed
calls: pills regional; rail label site-wide; text reveals restrained;
mark persists through the tools lead-in only.

### What replaced the cover

1. **The exit-hold beat becomes the DECOMMISSION beat.** A canonical
   scroll-owned EXIT CLOCK — `exitProgressForRunway(p)` (ringMath, pure,
   unit-pinned): 0 through every reading beat, 0..1 across the runway's
   final beat. Every consumer derives it from the SAME runway progress
   ref — no new scroll writers, reversible by construction.
   `useServicesStageScroll` mirrors it as `--svc-exit` (CSS/tests only).
2. **Cards fly OUT + fade** (`exitEnvelope`, `RING_EXIT_WINDOWS`
   [[0,.5],[.12,.62],[.24,.74],[.36,.9]], `RING_EXIT_RADIUS_TO 1.15`) —
   the entrance reversed, staggered index-ascending so the front card
   leaves last; EXACT identity at exit = 0 (pre-exit frames
   byte-identical, unit-pinned). Composes into ServicesCardRing's
   per-card radiusMul + master; fading cards self-retire their
   hover/hit anchors.
3. **Verb pills FLIP to the right rail** (`ServicesExitPills`, mounted
   by LandingPage as a fixed overlay at z48 — NEVER inside a station:
   content-visibility containment would rebase fixed descendants). On
   the exit clock's rising edge the card screen rects are LATCHED from
   `ringAnchors` (they stop updating below opacity 0.1); pills lay out
   AT the mid-rail dock and transform-interpolate from the captured
   chip corner (windows [[.1,.72],[.2,.8],[.3,.88],[.4,.96]], spawn
   scale 1.5). No capture → fade-in at dock. Dock fades out on
   `--tools-bg-in` (regional per Vince; persistence later = one
   constant). aria-hidden, pointer-events none.
4. **The mark RECEDES** (BrandmarkPhysicsCoreActor: EXIT_RECEDE_SCALE
   0.9, EXIT_RECEDE_DIST 0.55 along camera-forward, EXIT_DIM 0.45 —
   gated by recT × SERVICES_CARD_RING, Invariant-11 discipline) and the
   armillary dims with it (HologramOrbits gains `masterOpacityGetter`,
   default 1 = labs byte-identical; CorridorArmillary + the card tracks
   pass `1 − 0.85·exitP`).
5. **#tools transparent lead-in** replaces the -100svh overlap (REMOVED:
   margin/z8/isolation). Under `html[data-corridor-exit]`: #tools z6,
   background transparent, children z7, and a `::before` void+stars
   backdrop at `opacity: var(--tools-bg-in, 1)` (default = fail-opaque;
   the canvas element itself is never opacity-faded). The dimmed receded
   mark stays alive behind the header viewport and dies as the first
   stack card arrives.
6. **useCorridorExitScroll retunes:** `NEXT_STATION_FADE_END_VH 0.1 →
−0.7` (formula monotone through negative tops) and — the trap — the
   ambient gate SPLITS: `servicesAmbient` now uses `sectionNearAmbient`
   (`services.bottom > vh·FADE_END`) because in normal flow
   services.bottom == tools.top and the old `bottom > 0` gate HARD-CUT
   the canvas at exactly tools.top = 0. `docked` keeps the old gate.
   New `--tools-bg-in` writer (START 0.15vh → END −0.55vh).
7. **Wheel:** the last-card HOLD is retired — wheel-down at the last
   card passes through to native scroll (mirror of the first-card
   reverse), because the decommission is real scroll content. The 2vh
   release gate survives re-derived (≙ p > 0.8 under normal flow).
8. **Header + rail identity:** #tools header is a Linear split (title
   left · lede right, min-height 78svh — the header owns the lead-in
   viewport). TERMINAL TEXT CANON (revised 2026-07-11, owner request):
   the mono eyebrow ("08A · Tools", scramble-decoded by the now-deleted
   ToolsHeaderDecode) was REMOVED — the header opens straight on the
   display title. #tools is now the ONE typewriter exception: the display
   title runs a terminal type-on (ToolsTitleTypewriter — per-char opacity
   reveal + a block caret riding the head; capable-desktop-gated, reduced-
   motion/mobile keep the authored copy + clip-wipe), SUPERSEDING the
   prior "display titles keep the data-m clip-wipe / no typewriter on
   display faces" rule for this header. The lede keeps the clip-wipe;
   elsewhere the canon still stands (mono meta scramble-decode, display
   faces clip-wipe). NEW site-wide `RailStationLabel`
   (portal into the authored `#railStation` shell in `.hud__rail--l`):
   the active station's `data-screen-label` (previously unused) emerges
   from the left rail at 50% (the 8.33% compass slot stays reserved),
   scramble-decoding on change, driven by `data-active-station` on
   <html> (written delta-gated by useLandingScroll — single writer) and
   gated closed by `data-corridor-engaged`.

### Revised lockstep set

- KEPT: STEP_COUNT == RING_STEP_COUNT == 6 == runway/100svh; both
  active-service clamps; stack breakpoint 960; Lenis-free; mobile/PRM
  plain flow (pills + lead-in + label choreography all desktop-gated).
- DEAD: the -100svh margin leg and the "2vh ⇔ tools.top < vh" reading
  of the wheel gate (the constant survives as "p > 0.8").
- NEW: `exitEnvelope(0, i)` is EXACT identity (unit-pinned);
  `TOOLS_BG_IN_END_VH (−0.55) > NEXT_STATION_FADE_END_VH (−0.7)` — the
  station must be opaque BEFORE the ambient canvas dies; the
  `servicesAmbient` bottom gate expires WITH the fade envelope
  (`vh·FADE_END`), never at 0; pill windows close ≤ 0.96 (flight done
  before unpin); RING_EXIT_WINDOWS tail [0.9, 1] stays clear.

### Verification

services-ring-math 41 (exit clock + envelope pins); tools smoke
rewritten (normal-flow seam, transparent lead-in w/ WebGL-fallback
guard, wheel pass-through both directions, pill dock + reverse retire,
stack, mobile/PRM); headed screenshots at decommission mid-flight /
transparent lead-in / opaque arrival / rail label on two stations.

## Update 2 (2026-07-11, same day): calibrated edge-bus rebuild

The in-place viewscreen transition remains the governing seam. The
floating-pill and 78svh scrolling-header presentation did not make the HUD
feel load-bearing: context entered as ordinary page content, and the card
stack introduced a second progress rail inside the viewscreen. This update
retains the reversible R3F decommission, `exitProgressForRunway`, the FLIP
windows, the transparent Tools lead-in, `--tools-bg-in`, and the
opaque-before-canvas-dies ordering. It changes only the DOM instrumentation
and the Tools deck downstream of those clocks.

### Edge-bus ownership

- The enhanced capability is one exact contract:
  `(min-width: 1101px) and (min-height: 760px) and
(prefers-reduced-motion: no-preference)`. Every other viewport uses
  ordinary document flow.
- The authored Tools header becomes a fixed, rail-to-rail mode datum while
  `data-active-station="tools"`. Its eyebrow interrupts the datum; title and
  lede hang from the left and right content fields. It reveals in place by
  line draw, scramble, clip, and opacity only. The generic left-rail station
  label closes during this richer mode. The header has no structural
  background; `#tools::before` remains the only fadeable opaque shield.
- `ServicesExitPills` is retired. `ToolsRailRegisterPortal` mounts a nested
  React root into `[data-tools-rail-root]` inside the authored right HUD rail.
  The four service verbs FLIP into canonical rail slots under
  `SOURCE BUS · 04`, using outline diamonds centred on the real guide and
  continuous inward leaders. As the first tool reaches its CSS-owned sticky
  dock, those same slots reset to `TOOL UNITS · 04`; only the current tool's
  identifier receives a filled selection state. Reverse scroll reconstructs
  the service register from the same scroll clocks and latched source rects.
- The stack-local `.pcl-rail` is deleted. The fixed right rail is the sole
  progress/state bus. `LandingPage` remains render-stable: neither stack nor
  register state is subscribed at page level.

### CSS-owned compact deck

Desktop geometry lives exclusively in `tools-cards.css`: shared rail start,
`clamp(88px, 9.5svh, 104px)` header, `clamp(16px, 2svh, 24px)` gap,
`clamp(32px, 3.4svh, 36px)` peek, HUD-aware bottom clearance, and a card
height capped at 680px after subtracting header, all peeks, and clearance.
The first slot reaches its sticky top exactly when the station reaches the
viewport top. `useStackedCardsScroll` no longer exports pixel geometry; it
reads each slot's resolved `position` and `top`, so CSS is the single
capability and geometry source.

Cards use a 24px chamfer, opaque fill, and one silhouette outline. Their
36–40px tape carries codename, function, and unit index. The body is a 35/65
outcome-to-screenshot partition with one rule-separated metadata line, four
terse capability rows, and micro footer telemetry. The challenge copy stays
in the data model but is not painted. Covered-card optimization hides only
the heavy screenshot; each labelled article and its unique `h3` remain in the
accessibility tree. Mobile and reduced motion retain all four articles in
natural flow without horizontal overflow.

### Superseded Update 1 contracts

The following Update 1 details are historical, not current: floating
`ServicesExitPills`, the header's 78svh lead viewport, the 960px stack gate,
the exported `STACK` constant, the 40px production chamfer, and the local
`.pcl-rail`. The decommission/ambient compositing contracts listed above
remain current.

## Update 3 (2026-07-11, same day): continuous rail identity + whole-section register

Owner request: the rails' identity channels must be CONTINUOUS — the left
station label present across every stretch of the page (including the Arc
corridor), and the services register present for the WHOLE `#services`
section, not just the exit beat. Two Update-1/2 details are superseded.

### Left rail — the label rides the Arc

- `RailStationLabel` no longer closes while `data-corridor-engaged`; it
  REDIRECTS. `CorridorStationHeaders`' rAF (the corridor's single text
  writer) publishes a delta-gated `data-arc-stage="navigate|encode|build"`
  on `<html>`; boundaries are DERIVED from its own fade bands
  (`ARC_ENCODE_AT = ENCODE_FADE_IN[0]` 0.54, `ARC_BUILD_AT =
BUILD_FADE_IN[0]` 0.84) so the rail can never drift from the headline
  beats. The armed pre-pin stretch reads "navigate"; the epilogue holds
  "build" until disengagement hands back to the authored
  `data-screen-label`s. The label maps stages to "02 Navigate" /
  "03 Encode" / "04 Build" (owner-picked numbering; the visible sequence
  is 01 → 02–04 → 08 → 08A → 09 → 10 — renumbering the authored labels is
  an optional follow-up). WebGL fallback: no Arc writer → label closed
  during the corridor (pre-Update-3 behavior, acceptable fail-safe).
- The enhanced-desktop Tools suppression of `.hud__rail__station` is
  REMOVED (supersedes Update 2's "the generic left-rail station label
  closes during this richer mode"): the Tools eyebrow was retired the same
  day, so the rail label is now the section-identity channel on `#tools`
  too ("08A Tools").

### Right rail — register seated for the whole section

- `serviceAlive` is now `(data-active-station === "services" ||
data-services-ambient) && arriveClock > 0.001`, where `arriveClock` =
  `--svc-content-in` read from `.services-stage` (fail-open to 1 under the
  ambient hold). The register resolves WITH the services copy on arrival —
  never during the corridor dissipate — and stays seated through the
  runway, exit beat, and the unchanged `--tools-bg-in` handover.
- The exit-beat FLIP is RETIRED (supersedes Update 2's FLIP + latched
  source rects): rows are already home, so each wipes in right-guide-inward
  (JS-owned `clip-path`, scroll-scrubbed/reversible) on a staggered window
  over the arrival clock. `SERVICE_WINDOWS`, the `SRC_*` constants, and the
  `useHologramConnectors` latch are deleted.
- The "continuous inward leaders" and heading tick are RETIRED (supersedes
  Update 2): `.tools-rail-register__marker::before` and
  `__heading::after` are gone; only the outline diamond marks the guide.
- Type scale lifted for legibility: root 9→11px, heading 8→9.5px, index
  8→9px, `__name` min-width 8.5→9.5ch.
- ACTIVE service row: the row whose service is open carries `data-active`
  (gold + filled diamond, mirroring the tool rows). Selection is
  ARRAY-INDEX-based via `activeServiceForProgress` — never id/verb-based:
  the verb remap (id `keynote` → verb ADVISORY, etc.) makes id lookups a
  trap. The ringMath clamp keeps WORKSHOP active through the exit beat.
- Test deltas (`tools-cards-smoke.spec.ts`): leader assertions inverted
  (`::before` content must be "none"); mid-runway probe added (p≈0.45 →
  all four rows visible, exactly one `data-active`, row id "workshop").

The ring-side companion (parked front card holds a bounded 3/4 pose so the
slab reads 3D in view) is documented in ADR-029's addendum.
