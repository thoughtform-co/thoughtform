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

**Hover tilt (same session):** the hovered card leans with the pointer
(`RING_HOVER_TILT_YAW 0.16` toward the pointer's side, `RING_HOVER_TILT_PITCH
0.09` away from its height, damped at the veil rate, zero off-hover) so the
slab's extruded walls and gold lip present themselves — the "see the 3D
shape" affordance. Pointer-driven, bounded, decaying: ADR-021 intact. The
tilt offsets compose onto `cardFacingYaw`; keep amplitudes well clear of
edge-on.

## Update 5 (2026-07-11): the snap rides its own tween — real speed ramp

Vince: rotation "very abrupt, very harsh… I want a smooth speed ramp", plus
intermittent dead gestures ("often have to refresh for it to work"). Root
causes, in order of weight:

1. The wheel-snap and card-click paths rode the browser's native
   `window.scrollTo({ behavior: "smooth" })` — engine-owned easing: short,
   front-loaded, platform-dependent, and occasionally DROPPED by Chrome
   when a previous smooth scroll was still in flight (the dead-gesture
   read). Since scroll owns the rotation, that easing WAS the ring's
   perceived motion.
2. `RESUME_IDLE_GAP_MS 200` snapped the spring on ANY >200 ms frame gap —
   an ordinary hitch (GC, texture upload, dev overhead) mid-quarter-turn
   teleported the ring.

**The fix — `lib/services-ring/ringScrollTween.ts`:** `selectService` in
ring mode drives an explicit rAF scroll tween — `smootherstep` easing (C2,
zero velocity at both ends) over a distance-scaled duration
(`ringSnapDurationMs`: 620–1500 ms, ~950 ms for a one-beat hop). The tween
is a SCROLL DRIVER, not a second rotation writer: it writes only the
window scroll position, so ADR-029 §2's single-owner contract holds.
Writes use explicit `behavior: "instant"` — the landing page sets
`html { scroll-behavior: smooth }`, and an "auto" write per frame would
spawn a browser animation per frame (mush). Any genuine user scroll intent
cancels the tween instantly: an unconsumed wheel event (checked DEFERRED
via setTimeout(0) — listener order vs the wheel hook is unstable), a
scrollbar grab, touch, or a scroll key. Flag-off keeps the old browser
smooth scroll byte-identically.

**Wheel hook:** the fixed 650 ms cooldown (tuned to the browser's opaque
duration) is replaced by the tween's own progress — deltas are discarded
until the glide is 60% home (`CHAIN_AT_TWEEN_PROGRESS`), then a fresh
gesture chains the next beat from the current position (the spring bridges
the small velocity dip). `SNAP_REARM_MS 250` guards the degenerate
zero-travel case.

**Spring retune** (the spring's remaining job is smoothing NATIVE scroll —
scrollbar drags and stepped wheel ticks below the band): `RING_SPRING_OMEGA
4.2 → 3.4`, `RING_SPRING_ZETA 0.9 → 0.93`, `RING_SWAY_CAP_RAD 0.38 → 0.55`
(≈32°, still well under the quarter turn, still hard-bounded + decaying —
ADR-021 intact).

**Conditional resume-snap:** `RESUME_IDLE_GAP_MS 200 → 500`, and the hard
snap now fires only when the pose is genuinely stale (`|target − pos| >
swayCap` — the user scrolled far while the frameloop slept); a resume with
the target nearby just zeroes the stale velocity and glides in.

Verified: ring-math suite (31), ring smoke suite (15 passed), plus a
wheel-gesture probe measuring the ramp — 720 px beat in ~740 ms with
per-quarter velocity 66/217/289/147 px (ease-in/out), step advancing 1→2→3
across chained gestures.

Guardrails: the tween must never write rotation (scroll position only);
tween writes stay `behavior: "instant"` (the CSS smooth trap above); the
unconsumed-wheel cancel check stays deferred; never restore an
unconditional resume snap — the conditional form is what keeps frame
hitches from teleporting the ring.

## Update 6 (2026-07-11): parked front card holds a 3/4 pose

The front card parked DEAD-FLAT to the camera, so the Update-1 device slab
(extruded depth, gold-lipped side walls, edge glint) was invisible exactly
when a card was THE in-view card — only the side cards read 3D. The owner's
reference is the Atlas constellation tablet: a card that never sits
perfectly flat.

**Pose bias** (`lib/services-ring/ringMath.ts`): `frontPoseBias(nz)` —
constant angles `RING_FRONT_BIAS_YAW 0.13` (≈7.4°) / `RING_FRONT_BIAS_PITCH
−0.04`, scaled by a `smootherstep` ramp over the halo's own front window
`RING_FRONT_BIAS_WINDOW [0.35, 0.95]` of parametric depth `nz`, so side
cards (already 3/4 via `RING_FACING_BLEND`) take none. Applied in
`ServicesCardRing` at the single pose write, as a constant term AFTER
`cardFacingYaw` + hover tilt. This is NOT a revival of the `getServicePose`
yaw (the Update-1 pitfall — that double-rotated cards per service); it is
scroll-owned (nz) + pointer-damped only — no time clock, ADR-021 intact.

**Edge legibility retune:** `RING_SLAB_DEPTH 0.03 → 0.045` and
`RING_GLASS_EDGE_OPACITY 0.34 → 0.44` so the held angle shows a legible
gold side wall (~2–3px at park scale). **Hover tilt raised**
`RING_HOVER_TILT_PITCH 0.09 → 0.11`, `RING_HOVER_TILT_YAW 0.16 → 0.20` so
the pointer response reads over the held pose.

Safe by construction: hit-areas/designation anchors project from the posed
`matrixWorld` (they follow the bias); occlusion is index-based; the
exit/entrance envelopes touch only radius+opacity. Unit-pinned in
`tests/lib/services-ring-math.test.ts` (zero outside the window, full
constants at the front, monotone ramp, bounded well clear of edge-on).

## Update (2026-07-17) — the vestigial lead-in beat is removed (6 → 5 beats)

Owner report: entering `#services` you had to scroll one dead viewport —
stars / sphere remnants drifting, nothing rotating — before the cards
began to turn. Root cause: the runway held card 0 for TWO beats before
any rotation. Beat 0 was a "collapsed lead-in" (a `ServicesPlateCluster`
accordion-era holdover meaning "no plate open yet"), and beat 1 was
service 0's own read beat — both pinned the ring on card 0. In the CARD
RING model there is no "nothing open" state (the cards are always present,
card 0 simply front), so the lead-in beat was pure dead scroll AFTER the
corridor-exit dissipate had already settled the section (~1.3 viewports of
it).

Fix: remove the lead-in so **beat `i` owns service `i`** — card 0 is front
on the arrival beat (beat 0, which overlaps the tail of the dissipate) and
the FIRST scroll movement after settling (beat 1) already rotates toward
card 1. `RING_STEP_COUNT` 6 → 5; runway `500svh` (ADR-029's guardrail
already named 500svh — ADR-030's 6-beat bump had left it stale, so this
restores the match). The four lead-in-offset encodings move together to
preserve the ring↔step lockstep guardrail:

- `ringIndexForProgress`: guard `k <= 1` → `k < 1`, travel base `k − 2` →
  `k − 1` (beat 0 holds, beats 1..N-2 travel, final beat is the exit hold
  via the unchanged `RING_COUNT − 1` cap).
- `activeServiceForProgress` + `ServicesStage.setActiveByStep`: `step − 1`
  → `step` (and `setActiveByStep` no longer emits the `null` lead-in open
  state — beat 0 opens service 0).
- `servicesBeatScrollTarget`: `(index + 1.5)` → `(index + 0.5)` (service i
  centred on beat i).

The exit-hold beat, the ADR-030 decommission clock, and the ADR-047 #about
deck-flip sweep are all preserved by construction: `exitProgressForRunway`
is a pure function of the (now 5-beat) `RING_STEP_COUNT`, so the exit is
still exactly the final viewport of the runway and the -100svh #about sweep
still overlaps it. Unit + smoke suites re-pinned to the 5-beat mapping.

## Update (2026-07-17) — card face decluttered ("know what I do immediately")

Owner review of the baked card face (`bakeCardFace` in `ServicesCardRing`):
this is the surface where a visitor must grasp the offering at a glance, and
the sci-fi HUD chrome was competing with the message. Changes (bake only —
`servicePlateData` copy untouched; the removed fields stay in the data for
the mobile plate):

- **Service-label chip enlarged** — font 24 → 30px, chip height 54 → 66. The
  top-left service name is the "what is this" read and was too small.
- **Status code removed** — the right-side `<CODE> · OPEN` (e.g. "ADV-01 ·
  OPEN") was decorative filler crowding the label; deleted.
- **Feed caption removed** — the "FEED 0X · …" + STANDBY/LIVE row above the
  title was HUD filler; deleting it opens breathing room between the photo
  and the headline. The title is now the top of the copy stack (`titleTop`
  no longer computed).
- **Lede bigger + brighter** — body font 31 → 35px, colour dawn 0.7 → 0.92.
  The body is where "what is this service" actually lands, so it reads
  first now. `.svc-plate__lede` (mobile) moved in lockstep (15.5 → 17.5px,
  dawn-70 → dawn-90) to hold the 2× bake/DOM parity contract.

The bottom-anchored stack means removing the top rows just frees space above
the title — the CTA / includes / lede stay put. Verified across the four
baked faces at 1440×900.

## Update (2026-07-17, later 2) — arrival remap: the ring turns right at the park

Owner, third pass on the same seam: "when you enter the services section you
should be able to scroll through the cards immediately" — after the
(2026-07-17) lead-in removal there was STILL a trailing beat where the
corridor→services dissipate had settled (cards parked) but the ring stood
still on Advisory (~0.24vh) before beat 1 turned it. That "settled but not
rotating" scroll is the dead zone.

Fix: replace the uniform 5-beat step grid for the RING with an **arrival
remap** (the runway height + the exit clock are UNCHANGED):

- `RING_ARRIVAL_FRAC` (0.14 ≈ the dissipate settle point): the ring holds
  Advisory front only through the short arrival, so it begins turning the
  instant the section parks (`servicesAmbient` engages ~p0.14) instead of a
  beat later.
- The three quarter-turns are packed across `[RING_ARRIVAL_FRAC,
RING_EXIT_START]`; each brings the next card front over `RING_TRAVEL_FRAC`
  then dwells.
- `RING_EXIT_START = (RING_STEP_COUNT − 1) / RING_STEP_COUNT` — the exit-hold
  band is KEPT at the last 1/RING_STEP_COUNT so `exitProgressForRunway`
  (brandmark recede, orbit dim, card exit, #about deck stack, the −100svh
  sweep) is byte-identical and that seam is untouched.
- `activeServiceForProgress = round(ringIndexForProgress)` — `data-active-step`
  is now the FRONT-CARD INDEX (0..RING_COUNT−1), so the step clock tracks the
  ring EXACTLY (round of the same continuous index the ring uses); the
  lockstep is exact by construction, no `floor(p·stepCount)` offset.
  `useServicesStageScroll`, `ServicesStage.setActiveByStep`, and
  `servicesBeatScrollTarget` (service i parks on the dwell of its rotation)
  move with it.

`ringIndexForProgress` / `ringRotationForProgress` drop the `stepCount`
param (they use the module constants now); `ServicesCardRing`'s call updated.
`RING_STEP_COUNT` stays 5 as the runway height (svh-hundreds) + exit-band
derivation. Tuning: lower `RING_ARRIVAL_FRAC` toward the fly-in completion
(~0.08) for a more aggressive immediate-turn (the ring then turns during the
dissipate tail); raise it for a longer Advisory dwell. Unit + smoke re-pinned
(front-card indices; exit step 4→3). One FP fix: `travel` is clamped to ≤1
(smootherstep can round to 1+1e-15 near t=1 — dense sampling exposed a latent
monotonicity break).
