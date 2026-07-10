# ADR-029: Services Card Ring — service cards orbit the brandmark instrument

**Date:** 2026-07-10
**Status:** Accepted
**Scope:** `lib/services-ring/**`,
`components/landing/home-v2/services/hologram/ServicesCardRing.tsx`,
`components/landing/home-v2/services/ServicesRingHitAreas.tsx`,
`components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx` (ring mount),
`components/landing/home-v2/hooks/useServicesStageScroll.ts` (progress bridge),
`app/(internal)/test/services-orbit`, `scripts/services-photos/prepare.mjs`.

## Context

The ADR-025 Update-9 presentation docked the four service signal plates in
two CSS-tilted console racks flanking the brandmark armillary, scroll
opening one plate per beat. Vince asked for the activetheory.net/work
treatment instead: the cards orbit the mark IN 3D, rotating with scroll,
every card always in its full open photo form — "we can really rotate
around it and really showcase our different cases." Locked design calls
(2026-07-10): **front-center overlap** (the active card faces the camera
and partially overlaps the mark), **bounded decaying sway** when idle
(never continuous revolution — the ADR-021 motion-sickness contract), and
**exactly 4 monumental cards** at quarter positions.

New source photos (`*-2.*`) shipped with the request; repointing the
`scripts/services-photos/prepare.mjs` pipeline at them also fixed a live
regression — `embedded.webp` / `workshop.webp` had been deleted from disk
while still referenced through the plate CSS `image-set()`, silently
blanking two plate photos — and gave Strategic Advisory a photo for the
first time (`strategic` asset id; the `photo()` helper's id arg widened to
`ServicePlateId | "strategic"`).

## Decision

**Flag:** `SERVICES_CARD_RING` in `unifiedServicesInstrument.ts` (same
module + rationale as `UNIFIED_SERVICES_ARMILLARY`). Off restores the
Update-9 racks byte-identically: every DOM change keys off
`data-card-ring` on `.services-stage`, the corridor mount off the flag.
The asset regeneration deliberately persists across rollback.

1. **The ring is part of the unified corridor instrument.**
   `ServicesCardRing` (canvas-agnostic R3F group) is mounted by
   `CorridorArmillary` next to `HologramOrbits`, inside the actor's
   `pointerLookRef` — mark, orbits, and cards tilt as ONE instrument.
   Mount gate is the same media query as the services DOM gate
   (`min-width: 961px` + `prefers-reduced-motion: no-preference`), so
   phones never fetch the card textures. **Mobile / reduced motion keeps
   the ADR-025 plate accordion untouched regardless of the flag.**

2. **Scroll owns the rotation; the spring only shapes the last degrees.**
   `useServicesStageScroll` (single writer) publishes the continuous
   runway progress into `lib/services-ring/ringProgressRef.ts` — a
   module-level ref crossing the nested-root seam (the
   `brandmarkScanAnchorsRef` precedent; the services portal tree and the
   corridor canvas are separate React roots). `lib/services-ring/ringMath.ts`
   (pure, vitest-pinned in `tests/lib/services-ring-math.test.ts`) maps
   progress → rotation as a **smooth staircase**: beats 0–1 hold card 0,
   each later beat travels a quarter turn with `smootherstep` over the
   first `RING_TRAVEL_FRAC` (0.45) then dwells, so the front card is
   settled whenever the step clock is mid-beat
   (`frontCardIndex(rot(p)) === activeServiceForProgress(p)` is unit-pinned
   — the ring and the detail copy can never desync).

3. **ADR-021 compliance — bounded decaying sway.** The rotation follows
   its scroll target through a semi-implicit underdamped spring
   (`ω 6.0, ζ 0.82`) with a **hard cap** `RING_SWAY_CAP_RAD` (0.12 rad ≈ 7°)
   on |pos − target|, velocity zeroed at the clamp, dt clamped to 1/30,
   and a 200 ms wall-clock idle-resume snap (mirrors `motionFollower`).
   There is **no wall-clock term anywhere**: at rest the only motion is
   the spring's decaying settle, bounded by the cap. The per-service rig
   pose (`getServicePose`) is **retired under the flag** — the ring's
   quarter-turns ARE the per-service turn; a rig yaw on top double-rotates
   the cards off front-center (`BrandmarkPhysicsCoreActor` parks the pose
   target at frontal; it still eases to 0 off-park, ADR-023 Invariant 11
   untouched). Pointer-look and the Lissajous drift stay.

4. **Card faces are single CanvasTexture bakes** (840×1360, the photo
   pipeline's native 2× card size): generated JPG + the plate photo
   treatment as a luminance LUT (the `.svc-plate__pbg` filter chain —
   grayscale/sepia/saturate/brightness/contrast — without relying on
   `ctx.filter` support), a whisper of the 4px hologram dot pitch, C3
   scrims, the chamfered gold shell stroke (top-right + bottom-left 26px
   cuts), filled gold chip + status code in PT Mono (fallback IBM Plex
   Mono; `document.fonts.load` awaited with a 1.5 s bake timeout) — plus
   the FULL open-plate copy stack: feed caption, title, lede (upright-gold
   `{ em }` spans, no-italics rule; PP Neue Montreal), includes row, and
   the outlined CTA at a FIXED normalized rect (`RING_CARD_CTA_BOX`).
   **One plate, exactly the open C3 card — never a photo plane plus a
   separate text console** (the first pass split them into a WebGL photo
   card + a DOM "detail rack"; Vince red-alerted it the same day and the
   rack was deleted). **Chamfer corners are painted OPAQUE VOID `#050403`,
   never transparent** — a transparent texel multiplies with
   `material.opacity` and re-opens the alphaTest-vs-fade trap.

5. **Depth strategy vs the GPGPU mark** (points `depthWrite:false,
renderOrder:1`; orbit lines `depthWrite:false, renderOrder:0`): cards
   stay `renderOrder 0` (distance-sorted transparents), `NormalBlending`
   - `toneMapped:false` + `SRGBColorSpace` textures (ADR-023: never
     additive), and **only the near-front card writes depth** via an nz
     hysteresis gate (`on > 0.37, off < 0.33`, plus opacity > 0.55) — the
     particle pass is genuinely occluded behind the ≈opaque front card
     while translucent side/back cards never punch card-shaped holes in
     the mark. Back cards dim to `RING_OPACITY_RANGE[0]` (0.08), standing
     in for real occlusion behind the mark. Cards angle toward the camera
     via `cardFacingYaw(phi, RING_FACING_BLEND 0.32)` =
     `phi − blend·(π/2)·sin(phi)` — smooth, 2π-periodic, symmetric — so
     BOTH side cards read as ¾ front-face photos while the orbit read
     survives. (A naive `phi × (1 − blend)` scales the absolute azimuth
     and flips the 270° card onto its mirrored back face — shipped
     briefly on 2026-07-10, caught by the asymmetric hit-rect probe.)

6. **Entrance rides the dissipate clock**: per-card staggered windows
   (`RING_ENTRANCE_WINDOWS`, 0.60→1.0) after the orbit wrap-on begins;
   cards fly in from 1.18× radius while fading (verified: nothing shows
   mid-dive at dissipate 0.36; cards + copy arrive once parked). Card
   screen rects publish to `hologramConnectorStore.ringAnchors` behind
   the same `≥ 0.88` parked gate + clear-once semantics as the scan
   anchors. Publisher: `ServicesCardRing` only; progress writer:
   `useServicesStageScroll` only.

7. **DOM (desktop, flag on):** racks + `PlateConnectorOverlay` leader
   lines hide (`data-card-ring="on"` CSS; cluster stays mounted for the
   mobile path). `ServicesRingHitAreas` overlays the ONLY interactive DOM:
   invisible buttons on the published side/back card rects (click →
   `selectService` → the runway scrolls to that beat; min 44px touch
   width so thin ¾ slivers stay clickable) and a real `<a>` mapped onto
   the front card's baked CTA box via `RING_CARD_CTA_BOX`.
   `ServicesDesignationLayer` suppresses callouts whose survey point,
   landing point, or text run falls inside the front card's rect —
   otherwise the cutaway annotations read as labeling the photograph.
   `ServicesStationReadout` unchanged.

8. **Look-dev lab:** `/test/services-orbit` — standalone canvas twin
   (camera z 3.2 ≈ production `CENTER_DISTANCE`, instrument scale 0.62 ×
   parked 1.15), every ring tunable on sliders, simulate-scroll +
   simulate-dissipate (writes the real `--corridor-dissipate` var),
   `?p=` deep link, and a VALUES block that prints the constants to
   promote into `ringMath.ts`. `ServicesHologramScene` gained `children`
   (rig passengers) and `servicePoseAmp` (0 = ring mode) for this.

## Verification

- `tests/lib/services-ring-math.test.ts` — staircase boundaries/dwell/
  monotonicity, ring↔step agreement at every beat, spring cap/decay/NaN/
  snap, depth curves, hysteresis, entrance clamps (21 tests).
- `tests/visual/services-ring-smoke.spec.ts` — desktop ring mode
  (racks `display:none`, front-card CTA link swapping with the step
  clock across two scroll depths), photo 404 regression (all five assets 200), orbit lab canvas
  sized, mobile/tablet + reduced-motion accordion with zero ring overlays.
- Manual: lab composition at `?p=` beats; landing entrance / settled /
  travel screenshots (2026-07-10).

## Guardrails

- **Never add a wall-clock rotation term to the ring** (idle spin was
  explicitly considered and rejected for ADR-021's motion-sickness
  contract; the escape hatch is the bounded decaying spring, nothing
  more).
- The ring mount gate and the services DOM gate must stay the SAME media
  query — if they drift, tablets can end up with no cards at all (ring
  unmounted, racks hidden).
- Keep `STEP_COUNT` (scroll hook), `RING_STEP_COUNT` (ringMath), and the
  500svh runway in lockstep; the unit suite pins the first two.
- Chamfer texels stay opaque; front-card depthWrite stays hysteresis-gated;
  blending stays normal (ADR-023).
- Card facing must stay symmetric and periodic (`cardFacingYaw`, unit-
  pinned): any formula that scales the ABSOLUTE azimuth re-introduces the
  mirrored-back-face bug on the 270° card.
- **The card is ONE object.** All plate copy lives on the baked face;
  the DOM layer only places hit targets. Do not reintroduce a separate
  text console beside the ring (rejected 2026-07-10, red alert).

## Known corridor quirk (pre-existing, found via the smoke 2026-07-10)

A PROGRAMMATIC instant teleport into the runway
(`window.scrollTo({ behavior: "instant" })` from page top) can skip the
corridor's engagement band: the canvas frameloop never wakes and the whole
instrument (mark + orbits + ring) renders nothing until the next real
scroll input — one wheel tick revives it (verified). No organic path
(wheel, scrollbar drag, smooth anchor nav) reproduces it, so it is a
test-ergonomics hazard, not a user-facing bug. Tests must ride the smooth
two-arg `scrollTo(0, y)` — see the smoke helper's comment. The engagement
latch itself is corridor infrastructure (predates the ring) and is
tracked separately.
