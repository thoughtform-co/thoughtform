# ADR-046: Services cartridge dock (cards seat into a bottom-right console)

**Date:** 2026-07-16
**Status:** Accepted
**Flag:** `SERVICES_CARTRIDGE_DOCK` (`components/landing/home-v2/unifiedServicesInstrument.ts`)
**Scope:** `lib/services-ring/dockMath.ts` + `dockSeatRef.ts` +
`beatScrollTarget.ts` (new), `services/hologram/ServicesCardRing.tsx` (exit
branch), `services/ServicesCartridgeDock.tsx` + `services.css` SVC-DOCK block
(new), `DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx` (pointer-look damp),
`components/landing/v7/LandingPage.tsx` (mount), `ServicesStage.tsx`
(beat-target extraction), ADR-008 paint-stack table (row 5a).
Amends ADR-030 Update 1 (the radial decommission). Owner-directed.

## Context

Across the runway's final (decommission) beat the four WebGL ring cards flew
OUT radially and faded (ADR-030), leaving nothing behind. The owner asked for
a diegetic persistence beat instead: _"the services cards transform into
small cartridges and move to the bottom-right corner, like they're plugged
into some sort of console."_ The dock persists for the rest of the page and
each cartridge is clickable (glides the page back to that service's beat).

### Relationship to the ADR-030/031 rejections (why this is not the pills)

Two recorded rejections are adjacent, and this design is structured around
what actually failed there:

- **`ServicesExitPills` (ADR-030 U1, deleted):** NEW DOM chips spawned at
  latched card rects and FLIP-flew across the viewport to the rail while the
  real cards separately flew out — two objects, divergent motions,
  "detached ornament". **Here the card ITSELF travels, in-world** (in-world
  card travel is existing grammar: entrance slides, radial exit — this
  changes the destination, not the category). **The DOM never flies**: the
  DOM cartridge crossfades in AT THE SEAT over the last ~12% of each card's
  window. **No latched rects**: the seat is re-derived from live matrices
  every frame.
- **ADR-031 U4/U5 (bottom-right loadout considered; rail foot bay retired
  as "double work" beside the rolodex):** the dock is not journey state —
  it is the persistent SERVICES INVENTORY, a third instrument family
  (left rail = journey, right rail = section registers, bottom-right =
  seated services). ADR-031's "the manifest never flies anything across
  the viewport" stands — for DOM chrome.

## Decision

1. **One clock, N consumers.** Everything derives from the existing
   `exitProgressForRunway(p)` read off `servicesRingProgressRef` — the same
   clock the ring fade, orbit dim, and brandmark recede already consume. No
   new scroll writer anywhere; the dock controller and the ring are READERS.
   Per-card stagger reuses `RING_EXIT_WINDOWS` (front card seats last; the
   [0.9, 1] tail shows the receding mark alone, all four seated).

2. **The travel** (`dockTravelEnvelope`, pure, unit-pinned): eject (sin
   radius bump `DOCK_EJECT_BUMP`, glow dies, face ink dims to
   `DOCK_FACE_DIM`, veil re-engages) → flatten (pitch/hover ease out; yaw
   unwinds to `dockFlatYaw(i)` — the settled exit pose rounded to a full
   turn, tie-broken toward the orbit direction, so the unwind can never
   flip on spring wobble) → bowed flight to the seat (perp lift, drops into
   the socket) → seat swap (WebGL opacity × (1 − seatT), DOM cartridge
   × seatT at the identical rect, `steps(2)` gold flash on the flip).
   **Identity pin:** the envelope returns EXACT identity at exit 0, and the
   dock branch only executes while exit > 0 — flag-on pre-exit frames are
   byte-identical by construction (tests pin this).

3. **Seat targeting is viewport-first, per frame** (BEST-PRACTICES; the
   ADR-034 terrace precedent): DOM slot rect (module ref `dockSeatRectsRef`,
   writer = the dock on mount/resize/media flips) → NDC → camera space at
   the card's live ring-pose depth → world → ring-local via ONE shared
   inverse parent matrix. Seat scale makes the projected card height equal
   the slot height (also equalizing the four cartridges in flight). The
   brandmark recede, pointer-look residue, resize, and DPR steps are all
   compensated automatically; never a fixed world offset. The pointer-look
   - per-service pose additionally damp out with `(1 − exitT)` (flag-gated,
     `BrandmarkPhysicsCoreActor`) so the parent is still by seat time.

4. **Persistence is free — never add a latch.** Past the runway,
   `useServicesStageScroll` clamps progress at 1, so seated state is a pure
   function of scroll position for the rest of the page. No latch, no
   release guard; reverse scroll replays everything backward (cartridges
   unseat, cards fly home — a cartridge click from below runs this as the
   return showpiece via `servicesBeatScrollTarget` + `startRingScrollTween`;
   never `scrollTo({behavior:"smooth"})`, the documented ADR-029 trap).

5. **Safety gates while cards are opaque in flight:** hit-rect/CTA anchors
   retire at exit ≥ `DOCK_ANCHORS_OFF_EXIT` (0.05) — the old `opacity > 0.1`
   gate alone would leave a live CTA riding the flight; content `depthWrite`
   forces OFF past exit 0.02 (an opaque card crossing the mark must not
   punch holes in the depthWrite:false particle pass); hover is disabled
   for the whole dock travel.

6. **The dock fixture** (`ServicesCartridgeDock` + `.svc-dock`): fixed at
   `bottom: --hud-margin`, immediately left of the `.hud__corner--br`
   bracket (which reads as the console's corner cap), z-index 48 (ADR-008
   row 5a). Microlabel `SVC · 04`, four ≥44px bay buttons with dashed
   sockets, 27×44 cartridges (void slab, gold lip, the bake's chamfer
   corners, PT Mono index), hover/focus title chip (the detent-diamond
   name-on-demand recipe — anti-clutter). Labels are ARRAY-INDEX based from
   `SERVICES[i]` (the slot-id remap trap). Mounted at HUD level in
   `LandingPage` (never inside a station — containment rebases fixed
   descendants, the ADR-030 pill lesson), zero store subscriptions.
   Dormant = `visibility: hidden` + `inert` (NEVER `display:none` on the
   capable path — the ring measures the seat rects before the first flight
   frame); `data-ready` gates the flash so deep-link reloads paint seated
   silently. No CSS transitions on the scroll-driven channels — the CSS
   vars are per-frame mirrors; the flash is the only time-based garnish.

7. **Gate parity:** JS activates only on the ring's media gate (≥961px +
   `no-preference`) and never on `data-fallback="true"` stages; CSS
   belt-hides below the gate (the `.svc-ring-hits` precedent). Mobile /
   reduced-motion / WebGL-fallback have no origin object and get no dock —
   a static console would be exactly the dead chrome ADR-031 keeps
   rejecting.

8. **Flag off** restores the ADR-030 radial fade-out exit byte-identically
   (the dock branch never runs, the component returns null).

## Consequences

- The decommission beat now reads: fixture draws on → cards eject, dim,
  and fly to the console one by one → the mark recedes alone over a seated
  rack that stays for the rest of the page. About/continuum/practice/
  contact gain a persistent, clickable services affordance in the one HUD
  corner that was vacant page-wide.
- The right-rail "About carries no register yet" vacancy (ADR-031 U8 note)
  is partially answered by the dock rather than a new register.
- New invariants for future edits: dock state must stay a pure function of
  runway progress (no seated latch); the DOM never flies; anchors retire at
  exit ≥ 0.05; the seat is derived viewport-first per frame (never a stored
  world offset); `SERVICES[i]` by index only.
- Rollback: flip `SERVICES_CARTRIDGE_DOCK = false` (one line).
