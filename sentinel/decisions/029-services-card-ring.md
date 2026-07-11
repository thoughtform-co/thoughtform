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

## Update 1 (2026-07-10 evening): still instrument, device slabs, per-card orbits

Same-day review (Vince): "cards kind of float — should only move when the
mouse moves"; "depth like we have on Atlas… a futuristic, a bit transparent,
portable display" (refs: engraved acrylic terminal, Expanse hand terminal);
"other cards too far away… an orbit around the brandmark for each card, each
a bit different (dotted / thick), really have them connected." Locked calls:
device-bezel transparency (content stays readable), each card RIDES its own
orbit, navigation affordance = composition only.

**Drift retired (SUPERSEDES §3's "Pointer-look and the Lissajous drift
stay").** The parked instrument's wall-clock Lissajous nod
(`CENTER_DRIFT_*`, applied to the outer group in `BrandmarkPhysicsCoreActor`)
is now gated `if (!SERVICES_CARD_RING)` at the drift multiply — with the ring
on, the parked instrument is FULLY STILL; pointer-look and the scroll-owned
spring sway are the only motion (stronger ADR-021 posture). recT ≈ 0 made the
corridor identical either way; flag-off restores the nod byte-identically.
Verified: projected card rects pixel-identical across 4 s at park.

**Device slab anatomy.** Each card is a per-card group with EXPLICIT
intra-card renderOrder (distance-sorting near-coplanar transparents
flickers):

| child   | renderOrder | what                                                                                                                                                                                                                                                                         |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| glow    | −0.1        | soft gold radial halo plane behind the slab, front-weighted (`smootherstep(0.35, 0.95, nz)`)                                                                                                                                                                                 |
| slab    | 0           | shared chamfered `ExtrudeGeometry` (depth `RING_SLAB_DEPTH`, bezel `RING_SLAB_BEZEL` beyond the content, chamfer `RING_SLAB_CHAMFER_FRAC`); material array = smoked caps `#14110c` @ `RING_GLASS_OPACITY` + gold side walls @ `RING_GLASS_EDGE_OPACITY` (the Atlas gold lip) |
| glint   | 0.05        | shared `EdgesGeometry` hairline @ `RING_EDGE_GLINT_OPACITY`                                                                                                                                                                                                                  |
| content | 0.1         | the baked plate face, floated `slabDepth/2 + RING_CONTENT_LIFT`; keeps the depthWrite hysteresis                                                                                                                                                                             |

All card sub-objects stay **renderOrder < 1** (the mark's point pass) so the
"cards draw before points, front card writes depth" contract is untouched;
glass/glint/glow NEVER write depth (§5 trap). Bake unchanged — opaque void
chamfer corners read as the device's dark display corners on glass. Anchors
still project the CONTENT plane corners → `RING_CARD_CTA_BOX` and the DOM
hit layer unchanged. One geometry of each is shared across the four cards.

**Per-card orbits.** `placeCardOnOrbit` (ringMath, pure, unit-pinned) rides
each card on its own ellipse using HologramOrbits' parametrization —
**a = π/2 − φ**, point(a) = Rx(tiltX)·Rz(tiltZ)·(cos a·r, sin a·r·ecc, 0)
(THREE `'XYZ'` = Rx·Ry·Rz, Rz applied first) — so the drawn track and the
riding card agree exactly. Geometries from `buildCardOrbitGeometries(base
1.30, spread 0.12, tiltAmp 0.06)`: radii 1.18/1.26/1.34/1.42, tiltX π/2 ∓
deviations, ecc 0.985/1.0/0.965/0.95. **nz stays PARAMETRIC (`cos φ`)** —
physical z/r would shave the front card's scale/opacity and make the
depth-write gate orbit-dependent; the tilts live only in the visible wobble.
Tracks are drawn by a nested `<HologramOrbits orbits={buildCardTrackOrbits(…)}>`
(new `cardTrackOrbits.ts`): dotted 1.0 / thin 0.85 / thick 2.2 / solid 1.4,
SERVICES_GOLD / TENSOR_ACCENT alternating, opacities 0.22–0.38, `node:false`,
`phase0 π/2` (draw-on emanates from the front), reveal windows leading the
card entrance windows by `RING_TRACK_REVEAL_LEAD 0.06`. Track ids are NOT
ServiceIds (activeServiceId highlight stays inert).

**Composition defaults** (side cards closer/clearer): orbit base 1.30
(vs flat 1.55), `RING_FACING_BLEND 0.32 → 0.45`, `RING_SCALE_RANGE` floor
0.62 → 0.72, `RING_OPACITY_RANGE` floor 0.08 → 0.16, new
`RING_OPACITY_WINDOW [−0.55, 0.6]` (depthOpacity's third param — lifts the
sides, back card pinned at the floor), `RING_CARD_HEIGHT 1.3 → 1.42`
(front card parks farther at the tighter base). Accepted character: ±~4%
front-card size variance per beat from the staggered radii (spread slider
→ 0 kills it).

**Hit-rect fix found by the stillness probe:** the card directly OPPOSITE
the front one projects a rect entirely INSIDE the front card's face; with
the lifted opacity floor it passed the `> 0.1` visibility gate, so clicking
the front card's photo would surprise-rotate to the hidden card. The
publisher now marks the opposite-of-front anchor `visible: false`.

**New guardrails**

- The glass slab, glint, and glow NEVER write depth; only the front card's
  CONTENT material does (hysteresis).
- Card sub-objects keep renderOrder < 1 (the mark's point pass) and keep
  their explicit intra-card order.
- Never publish a hit anchor for the opposite-of-front card.
- The drift gate stays at the multiply (flag-off byte-identical); do not
  zero the `CENTER_DRIFT_*` constants instead.

## Update 2 (2026-07-10, same evening): hologram feed photos + wheel-owned ring

**Dot-matrix photo treatment restored.** The clean baked photos lost the
plate's signature feed read (Vince: "we had this cool effect on the
photos"). `bakeCardFace` now rebuilds the C3 layering exactly: the
gold-toned photo composites as a faint full ghost (`PHOTO_SOFT_ALPHA 0.3`,
the `--soft` layer) under the same photo punched through the 4px dot mask
(`PHOTO_DOTS_ALPHA 0.62`, pitch 8 / r 2.15 at bake scale — the `--dots`
mask). Values sit between the plate's rest (.34/.08) and hover-resolved
(.16/.48) states: the ring card IS the open showcase. The old "dark dots
over a clean photo" whisper overlay is gone (it was the inverse of the
real effect).

**Wheel over the instrument rotates the ring** (`useServicesRingWheel`,
mounted by `ServicesStage` in ring mode only). While the stage is pinned
AND the instrument parked (dissipate ≥ 0.9): pointer above
`INSTRUMENT_BAND_BOTTOM` (0.78 vh) + wheel = one beat per gesture
(threshold 80, cooldown 650 ms), implemented THROUGH the existing
`selectService` smooth scroll — the runway scroll position remains the
single rotation owner; no second writer. Wheel DOWN at the last card is
consumed and HELD (moving the pointer below the band is the way onward);
wheel UP at the first card / lead-in passes through (natural exit up);
pointer below the band = untouched native scroll. The landing route has no
Lenis, so a non-passive window listener owns the gesture cleanly. Probe-
verified: snap chain 1→4, hold at 4, below-band exit, reverse snap.
Keyboard scrolling (PgDn/space) is never intercepted.

Guardrails: the wheel hook must never write rotation directly (only
`selectService`); the band constant and the hold-at-end are the designed
affordance — do not "fix" the hold by auto-advancing; the photo effect's
dot layer multiplies the photo THROUGH the mask (destination-in), never
dark dots OVER the photo.

## Update 3 (2026-07-10, late): glide the turn, resolve on hover

**Smoother rotation.** At `RING_SWAY_CAP_RAD 0.12` the spring rode its
clamp through every quarter-turn — the perceived motion was the browser's
scroll easing, not the spring. Update: `RING_SWAY_CAP_RAD 0.12 → 0.38`
(≈22°, still hard-bounded + decaying, ADR-021 intact), `RING_SPRING_OMEGA
6.0 → 4.2`, `RING_SPRING_ZETA 0.82 → 0.9` (glide over wobble),
`RING_TRAVEL_FRAC 0.45 → 0.55` (a snapped beat spreads its turn wider).
The ring now visibly eases into each beat instead of snapping.

**Hover-resolve (the plate's `:hover` behavior).** The dot-matrix moved
OFF the baked face onto a per-card VEIL plane (renderOrder 0.12, above the
content): the face bakes CLEAN again, and the veil — one shared 8px-wide
tiled strip texture — carries the void tint punched with the dot mask.
Alpha math makes rest-state pixel-equivalent to Update 2's baked
composite (between dots 1−SOFT, in dots 1−SOFT−DOTS). Hovering a card
(window pointermove tested against the frame loop's projected rects; the
occluded-by-front rect can't steal hover) damps its veil to
`RING_VEIL_HOVER_LEVEL 0.18` — the photo resolves with a whisper of dots
left, exactly the plate's dots .34→.16 / soft .08→.48 read. The veil's
vertical profile is CLEAR over the chip row (the DOM plate drew chip and
status above the mask) and fades out above the copy stack, so chrome and
copy never sit under it. Corner projection now runs whenever parked (the
store publish stays gated on `publishAnchors`), so the lab gets hover for
free. Texture memory returns to the 4 clean bakes + one tiny strip.

Guardrails: the veil is the ONLY dynamic photo treatment — never re-bake
dots into the face (kills the resolve) and never veil the chip row or the
copy stack; hover must key off the same projected rects the hit layer
uses (one geometry truth).

## Update 4 (2026-07-10): translucent panes

`RING_OPACITY_RANGE` ceiling 1.0 → 0.9 (Vince: "make the cards slightly
transparent") — the front face reads as a translucent device pane with the
tracks, halo, and starfield ghosting through it. The ceiling must stay
above the 0.55 depth-write gate, or the front card stops occluding the
mark's point pass. Lab gains an `opacity max` slider.
