# ADR-108: The ring on phones

**Status:** Proposed (2026-09-16) — shipped behind `SERVICES_CARD_RING_MOBILE`
and guarded, pending the owner's read on a real device. **The device read is
the acceptance gate**: the whole phone corridor exit changes under this flag,
and Chromium emulation has no GPU to say what a phone's does.
**Extends, on phones only:** ADR-029 (the ring) · ADR-050 / ADR-086 (the
face) · ADR-056 (the release-gated entrance clock) · ADR-030 §6 / ADR-074
(the corridor's kill chain).
**Related:** ADR-107 (the proof stack on the same rung) · ADR-083 (the phone
plate accordion, which stays) · ADR-038 (the quality governor) · ADR-046 (the
viewport-first seat law).

## Update 1 (2026-09-16) — the band is the composition; the plates retire on this rung

⚠ **SUPERSEDED IN PART BY [ADR-109](109-the-services-beat-on-a-phone.md)**
(owner, on the live phone read: the plates are "weird blocks … we don't need
those because we have the rotating cards", and "just like with the second
section, we need the h1 above the cards and then the paragraph below it").
What changes: the masthead renders INSIDE the band (title · an empty SEAT the
ring fills · the paragraph — a grid the hook measures and the ring fits to,
`RING_MOBILE_SEAT_FILL` 0.82), `ServicesPlateCluster` does not render on the
ring rung, and a tap on the front card TURNS IT OVER — its back face is the
spec ([ADR-110](110-the-card-turns-over.md); ADR-109's DOM sheet lasted a
day) instead of scrolling to a plate — `scrollToPlate` is deleted and a
side-card tap rolls the band to that card's beat. Everything
about the rung, the flag, the three readers, the ambient hold, the clock, the
bake and the scale solve stands; §5 below and "a tap goes to the plate" are
the superseded parts, and the device checklist is ADR-109's gate too.

## Context

The owner, walking the phone build ahead of launch (2026-09-16):

> In the services section on desktop, we have these cards rotating around our
> brand mark particle system. I also want the same thing on mobile, but we
> have to make sure that the mobile site's performance can handle it.

What the phone had: `#services` was the proof pile → a static masthead →
`ServicesPlateCluster`, the ADR-083 accordion. The corridor DOES mount on a
phone (the mobile GPU profile — `antialias: false`, DPR ≤ 1.4, low-power) but
`useCorridorExitScroll`'s `dockCapable = !reducedMotion && !mobile &&
!corridorFallback` with `mobile = (max-width: 960px)`, so the dock and the
ambient hold never engaged: the canvas never went fixed behind `#services`,
the parked mark was gone by the offer, and the ring's mount gate
(`(min-width: 961px) and (prefers-reduced-motion: no-preference)`) never
matched.

Agreed with the owner before building: **the ring is the visual and the DOM
plates stay the offer** — a tap on a card scrolls to that service's plate; no
drawer (unreadable at this size, and its bake is the one cost the phone
cannot afford).

## Decision

**The same ring, in the same canvas, on a phone-only rung — held behind the
station by the desktop's own ambient hold, seated on a sticky band the stage
renders between the masthead and the plates, and drawn at a phone profile.**

1. **One rung, one flag, three readers.** `SERVICES_CARD_RING_MOBILE = true`
   and `SERVICES_RING_MOBILE_MEDIA = PROOF_STACK_SPLIT_MEDIA` —
   `(max-width: 960px) and (min-height: 681px) and (prefers-reduced-motion: no-preference)`,
   the proof stack's own phone rung, so the two phone beats of `#services`
   turn on together. Read by `CorridorArmillary` (mounts the ring),
   `ServicesStage` (renders the band, the hit layer and
   `data-card-ring-mobile="on"`) and `useCorridorExitScroll` (the dock gate),
   all from the constant — pinned by source in
   `tests/lib/services-ring-mobile-gate.test.ts`, the
   `services-proof-runway-lockstep` idiom. Flag off, a short window or a
   reduced-motion reader ⇒ the old phone page, byte for byte.
2. **Architecture A: extend the ambient hold.** `useCorridorExitScroll`
   changes at ONE line — `mobile` is `(max-width: 960px) && !ringMobile`. The
   rest of the hook is width-agnostic: the kill chain resolves `#voidwalker`
   (static and opaque on phones) exactly as on desktop, the veil,
   `data-corridor-exit`, `data-services-ambient` and the fixed-canvas rules
   all simply become live. Two things that were dead on phones are live with
   it: the `MobileEpilogueSignal` CSS belt (`html[data-corridor-exit]`) and
   the `#services` transparent ground — which is what puts the parked mark
   behind the pile, the masthead and the plates. `corridorFallback` still
   wins (no canvas ⇒ no ring).
   **Rejected B**, a second R3F canvas in the mobile stage: ADR-083's "mobile
   introduces no new canvas", the landing-performance import doctrine, and a
   second GL context is the one cost no bake ratio recovers.
3. **The seat is a band, and its scroll is the clock.** The stage is unpinned
   on phones, so the ring gets its own runway: `.svc-ring-runway` (300svh,
   `RING_MOBILE_RUNWAY_SVH`, declared in the sheet and pinned equal by the
   gate test) holding `.svc-ring-band` (`sticky; top: 0; 100svh`, transparent
   — the ring draws in the fixed canvas behind it) with `ServicesRingHitAreas`
   inside. `useServicesStageScroll`'s inert branch grows a phone clock:
   `t = clamp01(−band.top / (band.height − vh))` → `ringMobileClock(t)`
   (`ringMath`, pure, unit-pinned) writes `progress` (the five-beat domain,
   stretched over `[0, RING_MOBILE_LEAVE_START]` and capped under
   `RING_EXIT_START` so the exit-stack beat is never entered),
   `proofRelease = smootherstep(0, RING_MOBILE_ARRIVE, t)` (the band's own
   arrival ramp — `ringEntranceClock = smoothedDissipate × proofRelease` is
   the ADR-056 clock unchanged, and the dissipate has saturated by the band,
   so this IS the fly-in), a new **`hold`** channel on `servicesRingProgressRef`
   (`1 − smootherstep(RING_MOBILE_LEAVE_START, 1, t)`, optional, read `?? 1`,
   fed as the phone mount's `masterOpacityGetter` and nowhere else, so the
   cards LEAVE with the band instead of parking behind the accordion for the
   rest of the ambient hold), `proofPresence` while the pile is on screen, the
   exit channel and `data-active-step` from the same maps the desktop uses.
4. **The phone profile** (`profile="mobile"` on `ServicesCardRing`):
   - **Bake at half** — `BAKE_SCALE_MOBILE = 0.5` and `bakeSize(scale)` in the
     three-free `ringCtaBox.ts`; the bake draws in bake px under
     `ctx.scale(s, s)`, so every coordinate stays in the 840×1360 space and
     `RING_CARD_CTA_BOX`'s fractions hold by construction. Four 420×680 faces
     ≈ 4.6 MB (+mips ≈ 6.1) against 24.4 (32.5) — a face is 2.3× the pixels a
     ~260px card at DPR ≤ 1.4 can show, and the per-face `getImageData`
     shrinks 4×.
   - **No drawer** (`openDrawer={false}` — no `bakeDrawerFace`, no open state),
     **no portrait back** (gated `ABOUT_DECK_STAGE && !mobileProfile`; the
     About deck never engages on phones), **no hover pick** (`!mobileProfile`
     on the per-frame pointer test), **anisotropy ≤ 4** (desktop 8).
   - **The scale is SOLVED, every frame, viewport-first.** The desktop world
     size was tuned by eye for a ~40° landscape frustum; a 70° portrait one
     projects the same units at a third of the size. `ringMobileGroupScale`
     (`ringMath`, three-free, unit-pinned) solves the ring group's scale so
     the front card (depth scale `scaleRange[1]` × `frontScaleEmphasis`)
     lands at `ringMobileFrontWidthPx(vw) = min(260, 0.66·vw)` css px — at the
     FRONT CARD's depth: it orbits `orbitBase` nearer the camera than the mark
     it circles, and that offset scales with the group, so the solve is
     implicit (`s = q·D / (P·(cardH·frontMul + q·radius))`). One matrix read
     of the parent (the mark's rig), delta-gated. `orbitBase` is
     `RING_ORBIT_BASE_RADIUS × RING_MOBILE_RADIUS_MUL` (0.7) so the side cards
     sit inside the portrait frustum.
   - **Governor floor**: the ring mounts only while
     `useQualityStore.countMultiplier > 0.35` — on the ADR-038 bottom rung
     there is no ring at all. All four cards or none.
5. **Interaction.** The whole front face is one button (the `card` face has
   no CTA box to shim) and the side cards are their `View …` buttons; every
   one calls `scrollToPlate(id)` — the inert `selectService` state, then
   `.svc-plate[data-service="…"]`.`scrollIntoView({ block: "start", behavior:
"smooth" })`. The front button now carries `data-service`. No
   `onCloseDrawer`, `openServiceId={null}`. The `.svc-ring-hits` rules live in
   the ≥961 block and are `display: none` at ≤960; a ≤960 block keyed on
   `.services-stage[data-card-ring-mobile="on"] .svc-ring-hits` restores them
   at z 4 inside the band.

## Measured (Chromium phone emulation, 390×844, SwiftShader)

- Band top at 16 248 doc px; at band fractions 0.3 / 0.55 / 0.8:
  `data-services-ambient="true"`, `data-corridor-exit="true"`, the corridor
  canvas `position: fixed`, the band `sticky` at top 0, `data-active-step`
  1 / 2 / 3, **three** hit targets per beat (front + two sides), the front
  card **255–270px** wide against the 257–260 ask, every target ≥ 44px both
  ways, the front rect inside the frame.
- At 0.05 and ≥ 0.95: zero targets — the ring is off-stage before the band
  and gone after it; the parked mark is visible behind the band from 0.05.
- ⚠ **The first cut solved the scale at the MARK's depth and the front card
  measured 383px** — the orbit offset is ~30 % of a phone's camera depth, and
  a card that much closer paints that much larger. The solve moved to the
  card's own depth (`ringMobileGroupScale`); the gate test re-projects it.
- ⚠ **`useQualityTier()` in `CorridorArmillary` crashed the canvas boundary**
  — it returns a fresh object per snapshot, so `useSyncExternalStore` looped
  ("getSnapshot should be cached" → "Maximum update depth exceeded") and the
  ring published nothing. The mount reads `useQualityStore((s) =>
s.countMultiplier)`, one primitive.
- `tests/visual/services-ring-mobile-smoke.spec.ts` (both Chromium phone
  projects, dark + light): the band pins under a fixed canvas and publishes
  the cards (3 targets, no CTA shim, no drawer, touch floor, front width
  within ±15 % of the ask and inside the frame, the epilogue signal inert);
  off-stage before the band and gone after it; a tap on the front card lands
  its plate's top in `[−0.02, 0.4]·vh`; `#voidwalker` still ends the ambient
  hold; reduced motion ⇒ no band, no dock, no targets.

## Alternatives rejected

- **A second canvas in the mobile stage** — see 2.
- **Retiming `RING_ENTRANCE_WINDOWS`** for the phone's arrival — they ride the
  raw dissipate, which has saturated by the band; the release is the clock.
- **A master-opacity fade for the ENTRANCE** — lights the cards in their
  parked pose (the ADR-056 crossfade ruling). The `hold` is a fade for the
  EXIT only, where the alternative was cards parked behind the accordion.
- **Keeping the drawer** — its bake is the one texture the phone cannot
  afford, and a spec sheet at 260px is a spec sheet nobody reads; the plate
  below IS the spec.

## Left open — the device checklist

Chromium emulation has no real GPU, so the following is the owner's read on
an iPhone, dark then light, and it is the gate for → Accepted:

- Frame feel through pile → masthead → ring band → plates; thermal after two
  full scrolls; memory in Web Inspector.
- The parked mark visible behind the pile (the phone core is a static render
  — `BrandmarkPhysicsCoreActor` — but park/shrink are uniforms on the same
  actor; if it does not park, the mobile mark needs its own park keyframe).
- The ring's entrance and exit; tap → plate; the corridor still engaging from
  the hero; scrolling back up through the exit.
- What `useJourneyMarks` / `useActiveSection` read during the pile (expected
  "Proof").

Any fail ⇒ ship with `SERVICES_CARD_RING_MOBILE = false`; the branch is still
complete. Also open: `(pointer: coarse)` tilt is not separately gated (the
hover pick is off, which is what drove it); the emulated iPhone's 421px
layout width (ADR-107's finding) makes every width ask ~8 % generous here.

## Files

`components/landing/home-v2/unifiedServicesInstrument.ts` ·
`components/landing/home-v2/hooks/useCorridorExitScroll.ts` ·
`components/landing/home-v2/hooks/useServicesStageScroll.ts` ·
`components/landing/home-v2/services/ServicesStage.tsx` ·
`components/landing/home-v2/services/ServicesRingHitAreas.tsx` ·
`components/landing/home-v2/services/services.css` ·
`components/landing/home-v2/services/hologram/ServicesCardRing.tsx` ·
`components/landing/home-v2/services/hologram/ringCtaBox.ts` ·
`components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx` ·
`lib/services-ring/ringMath.ts` · `lib/services-ring/ringProgressRef.ts` ·
`tests/lib/services-ring-mobile-gate.test.ts` ·
`tests/visual/services-ring-mobile-smoke.spec.ts` ·
`.claude/rules/services-ring.md` · `.claude/rules/mobile-sections.md` ·
`.claude/skills/landing-performance/SKILL.md`.

## Update (2026-09-20) — ADR-115

Behind `SERVICES_ABOUT_DECK_MOBILE` (off ⇒ this ADR byte-identical): the band's EXIT enters the stack (`ringMobileClock(p, deck)` runs `progress` past `RING_EXIT_START` and `hold` stays 1; `RING_MOBILE_RUNWAY_SVH` 3.3 / `RING_MOBILE_LEAVE_START` 0.73 keep the beats' scroll and give the stack 62svh), the phone profile bakes the portrait back lazily, and the seat FREEZES from exit 1. See [ADR-115](115-the-phones-deck-flip.md).
