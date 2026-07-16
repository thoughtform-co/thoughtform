# ADR-047: About deck-flip stage (cards stack → flip to portrait → About reveals)

**Date:** 2026-07-16
**Status:** Accepted
**Flag:** `ABOUT_DECK_STAGE` (`components/landing/home-v2/unifiedServicesInstrument.ts`,
replaces `SERVICES_CARTRIDGE_DOCK`)
**Supersedes:** ADR-046 (cartridge dock, removed) in full; ADR-045's DESKTOP
emerge sequence (the mobile emerge, particle-halo fix, rail parity, and the
`portrait` data-m role remain live on the fallback path).
**Scope:** `lib/services-ring/` (`aboutDeckMath.ts`, `aboutStageProgressRef.ts`,
`aboutSlotRef.ts`, `viewportSeat.ts` new; `dockMath.ts`/`dockSeatRef.ts`
deleted), `services/hologram/ServicesCardRing.tsx` (deck branch + portrait
back faces), `DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx` +
`CorridorArmillary.tsx` (flip-window fades, deck stillness),
`hooks/useCorridorExitScroll.ts` (ambient kill retarget),
`home-v2.css` (compositing), `components/landing/home-v2/about/` (the stage:
portal, component, data, hook, CSS), the prototype `#about` block
(`[data-about-root]` shell), `scripts/services-photos/prepare.mjs` (`vince`
crop), the services-orbit lab, and the reworked seam smoke.

## Context

The ADR-046 cartridge dock was judged gimmicky by the owner one day after
shipping — it decorated the services exit without solving the actual
services→about transition, and `#about` still read as "a parallax scroll-over"
(an opaque DOM sheet sliding over the live 3D world). The owner's replacement
design reuses the cards themselves: _"the cards all stack behind each other
and then flip on the x-axis … the back side includes my profile picture …
the flipped cards move a bit to the right; on the left my name and the
paragraph text are revealed."_ Locked choices: gold-tone card treatment on
the portrait; ONE rigid deck flip (no per-card stagger); dock fully removed.

## Decision — the sequence

Two clocks, disjoint by page order, both clamped outside their ranges (the
seam between them is a byte-stable hold; no latch, no release guard —
the ADR-046 lesson):

1. **STACK (services exit clock, `exitProgressForRunway` 0→1).** Each card's
   azimuth SWEEPS along its own orbit to its nearest-full-turn front:
   `deckPhiTarget(i) = TAU·round(settledPhi/TAU − 1e-9)` → [−2π, −2π, 0, 0]
   (card 1's half-turn tie breaks toward the orbit direction — the dock's
   nearest-full-turn technique applied to φ). A sweep, never a Cartesian
   lerp: position/yaw-unwind/depth-opacity-lift/scale-equalize all fall out
   of `placeCardOnOrbit` as nz → 1, card 1 arcs around the mark on its drawn
   track instead of crossing it, and nested radii cannot interpenetrate
   mid-sweep. A radius correction (`DECK_RADIUS_MUL`) seats the converged
   cards on evenly-pitched deck depths (`DECK_FRONT_Z 1.35`, `DECK_Z_PITCH
0.085` — the raw radius·ecc products would interpenetrate cards 1–2).
   Stagger reuses `RING_EXIT_WINDOWS`; the spring residual is absorbed over
   `DECK_SETTLE_WINDOW [0.85, 1]` so the exitP = 1 pose is pure constants
   (`DECK_PLACEMENTS`/`DECK_PIVOT_LOCAL`/`DECK_OFFSETS`, precomputed at
   module scope and unit-pinned). Exact identity at exit 0.
2. **FLIP (about stage clock, beat 0 = `ABOUT_FLIP_WINDOW [0.04, 0.3]`).**
   The deck rotates π about its pivot's X axis AS ONE RIGID SLAB
   (`position = pivot + Rx(θ)·offset`, `rotation.set(θ, deckPhiTarget, 0)`)
   while the pivot glides onto the DOM portrait slot (the flip masks the
   correction). **Back-face orientation (the worked-out gotcha):** the
   portrait plane carries `rotation.x = π` at `z = −(slabDepth/2 + lift)`;
   Rx(π)∘Rx(π) = identity, so at full flip it reads exactly like an
   unrotated front plane — upright, unmirrored (a `y = π` plane would land
   upside-down). The flipped slab's TR/BL chamfers land at screen BR/TL, so
   `bakePortraitBack` draws its void corners + shell stroke MIRRORED
   (canvas TL/BR). All four cards share ONE portrait bake/material
   (`/images/services/vince.jpg`, the same gold-tone LUT as the faces);
   at θ = π card 0 (deck rear) is nearest the camera and owns the view.
3. **TRACK + SHIFT (beats 1–2).** posBlend = 1: the pivot IS the live slot
   rect every frame (per-frame `getBoundingClientRect` → `aboutSlotRef` →
   viewport-first seat math, the ADR-046 machinery on `viewportSeat.ts`),
   so the DOM cluster's `--about-shift` translate carries the deck with
   zero extra code — one motion owner. The copy column reveals over
   `ABOUT_COPY_WINDOW` via scrubbed per-child `--ci-off` stagger (NOT
   `useRevealMotion`: portal nodes are never observed and `.is-in` is
   one-shot; the stage needs reversible reveals).
4. **TAIL (`ABOUT_BG_IN_WINDOW [0.92, 1]`).** The station's fail-opaque
   shield restores and the deck (`deckBgKill`) + DOM cluster (grid
   `opacity: 1 − --about-bg-in`) die with it; `#continuum` covers an
   already-shielded station.

## Decision — lifecycle + compositing

- **Ambient kill retarget** (`useCorridorExitScroll`): `nextStation` =
  `#continuum` (flag-gated; `#practice` defensive fallback). The ambient
  bottom gate is keyed to the SAME `nextStationTopVh` the fade envelope
  reads — a rect-boundary conjunction hard-cuts the canvas at exactly the
  next station's top because adjacent rects share that edge (the ADR-030
  Update 1 §6 seam bug, now recorded twice). Verified live: ambient holds
  through the whole about band in both scroll directions and dies exactly
  as `#continuum` covers.
- **Compositing** (`home-v2.css`): the opaque-cover role moves from
  `#about` to `#continuum`. `#about` gets the `#services` transparent
  treatment (bg transparent, z6, children z7, `content-visibility:
visible`) and its authored `::before` radial wash is overridden into a
  **fail-opaque shield** (`opacity: var(--about-bg-in, 1)`, void + stars —
  the ADR-030 `--tools-bg-in` recipe with the fade channel + lockstep
  ordering restored). Unwritten ⇒ opaque: JS failure, flag-off, and every
  non-engaged path read as a normal station.
- **Ordering invariant:** the shield completes at the stage's unpin
  (`continuum.top ≥ 1vh`) > ambient fade start (0.6vh) > ambient death
  (0.0vh) — the station is shielded BEFORE the canvas dies.
- **The stage** (`components/landing/home-v2/about/`): `AboutStagePortal`
  (ServicesPortal recipe) mounts `AboutStage` into the authored
  `[data-about-root]` shell. `useAboutStageScroll` is the single writer of
  `data-about-mode="stage"`, `--about-bg-in` (on `#about`),
  `--about-flip/--about-shift/--about-copy-in/data-about-step` (on the
  stage), `--about-center-dx` (offset-chain measure, mount/resize),
  `aboutStageProgressRef`, and `aboutSlotRef`. Beat windows live ONLY in
  `aboutDeckMath.ts` — the CSS vars are mirrors (the `--svc-exit` pattern).
  The cluster reuses the fallback's `.voidwalker__orbit*` class grammar
  (no visual drift possible); copy strings duplicate the fallback markup
  via `aboutStageData.ts` with lockstep comments on both sides.
- **Gate parity + fail-static:** the stage engages only on the ring's media
  gate + not `data-fallback` + the flag; EVERY disengage path (including
  the media flip that null-renders the stage — found live: the hook must
  disengage when its stage ref goes null, or `data-about-mode` strands and
  mobile gets an empty section) removes the attribute, so mobile / PRM /
  fallback / no-JS keep the static `.voidwalker` + ADR-045 emerge
  byte-untouched.
- **Stage-clearing fades:** the receded mark (`BrandmarkPhysicsCoreActor`)
  and the orbit tracks (`CorridorArmillary` + the ring's own track getter)
  clear fully across the flip window (`1 − aboutFlipT`), so the portrait
  gets a clean stage. The pointer-look/pose damp (`deckStill`) extends
  through the whole deck life.
- **Deck rendering discipline:** content depthWrite forces OFF for the
  whole deck life (all nz → 1 — four coplanar writers otherwise); explicit
  per-deck-slot renderOrder takes over at `DECK_RENDER_REBASE_EXIT 0.9`
  (before that the cards are angularly spread and three's same-order depth
  sort is correct), swapping order at θ = π/2 where the deck is edge-on;
  the front content planes went `DoubleSide → FrontSide` (the only pose
  that ever showed a bake's reverse was the hidden occluded back card — a
  mirrored text ghost; strict improvement); hit anchors/CTA retire at
  exit ≥ 0.05 and stay dead through the stage.

## Invariants (for future edits)

- One clock per phase, N consumers; `useAboutStageScroll` is the ONLY
  writer of its channels; the ring/mark/armillary are READERS.
- Both envelopes are EXACT identity at their zeros (unit-pinned) — the
  deck branch never runs pre-exit; reverse scroll reconstructs everything.
- The seat is derived viewport-first per frame — never a stored world
  offset. The DOM cluster owns the shift motion; the deck follows the rect.
- Beat windows change in `aboutDeckMath.ts` only; runway height (300svh)
  is the pacing knob.
- The fail-opaque shield's default (unwritten ⇒ 1) and the fail-static
  attribute default (absent ⇒ static voidwalker) must never be inverted.
- The two "docks" remain distinct: the corridor zoom-dissipate dock
  (`data-corridor-docked`, ADR-021) is load-bearing infrastructure and
  untouched; only the ADR-046 cartridge dock was removed.

## Consequences

- The services→about seam is now one continuous instrument story: cards
  stack → the deck flips to the maker's portrait → the bio composes around
  it — no opaque sheet sliding over the 3D world anywhere between the
  corridor and #continuum.
- The ADR-031-U8 "About carries no register yet" note stays open (the
  deck partially fills the vacancy diegetically).
- `#about`'s manifest detent targets the section top = the flip's start
  (acceptable; a beat-level detent would need a corridor-style
  `scrollFraction` entry).
- Deep links below #about load with the stations above collapsed to
  content-visibility placeholders (pre-existing); the stage re-engages on
  approach and scroll anchoring compensates the inflation.
- Rollback: flip `ABOUT_DECK_STAGE = false` (one line) — ADR-030 radial
  exit + opaque #about cover restore; the fallback surfaces never changed.
