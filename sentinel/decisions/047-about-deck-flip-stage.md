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
- Beat windows change in `aboutDeckMath.ts` only; runway height (240svh
  since Update 2; was 300svh) is the pacing knob.
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

## Update 1 (2026-07-16) — rev 2: Y-axis flip + deck depth writer

Two owner reports the day the stage shipped, both verified in code:

1. **The flip axis was wrong.** The owner's brief _"flip on the x-axis"_
   named the left↔right travel DIRECTION; the implementation took it
   literally as `Rx(θ)`, which reads as a top-over-bottom tumble. The deck
   now flips about its pivot's **Y axis** (`position = pivot + Ry(θ)·offset`,
   `rotation.set(0, deckPhiTarget + θ, 0)` — φ is a full turn, so the yaw
   slot composes to exactly `Ry(θ)`). The back-face gotcha inverts with it:
   the portrait plane now carries `rotation.y = π` (Ry(π)∘Ry(π) = identity —
   an `x = π` plane would land upside-down under the Y flip). The
   `bakePortraitBack` mirrored chamfer trace is UNCHANGED: a π flip about
   either in-plane axis maps the slab's physical TR/BL chamfer diagonal onto
   the screen TL/BR one, so the TL/BR cut set stays correct. The θ = π/2
   renderOrder swap (`flipped`) is axis-agnostic.
2. **The mark's points painted OVER the deck.** The rev-1 depthWrite
   force-OFF left the deck with NO depth writer, so the renderOrder-1
   brandmark point pass (transparent, depthTest, drawn after every card
   layer) composited straight over the card faces — the "background
   presence" read as foreground residue on the cards. The ring's
   single-writer contract is now restored for the deck life instead of
   suspended: past `DECK_DEPTH_WRITE_OFF_EXIT` the writer is picked
   EXPLICITLY as the nearest deck slot (`deckOrder` top — the same θ = π/2
   swap the renderOrder rebase uses), never the plain nz gate (which would
   have switched four near-coplanar writers ON — the rev-1 fear, still
   valid). Post-midpoint that slot's FrontSide content plane culls away and
   the shared portrait `backMaterial` takes over as the writer (enabled
   beside its opacity write; inert pre-midpoint — every back plane is
   FrontSide-culled, no fragments). The `EXIT_DIM` partial dim and the
   flip-window `aboutFlipFade` stage-clearing kill are unchanged — the mark
   is now additionally OCCLUDED wherever the deck actually covers it, which
   is what "background presence" was supposed to mean.

## Update 2 (2026-07-16) — pacing + zero-opacity draw gates

Owner: the flip "takes a bit too many scrolls," and the band should stay
smooth. Two levers:

1. **Pacing.** Runway 300svh → **240svh** and the beats pulled tighter:
   flip `[0.04, 0.26]` (was `[0.04, 0.3]`), shift `[0.32, 0.56]`, copy
   `[0.4, 0.66]`; the tail stays `[0.92, 1]`. The flip now completes in
   ~31svh of scrolling (was ~52svh). The unit tests pin beat ORDERING,
   not values — retimes stay free.
2. **Perf.** The stage keeps the corridor canvas alive through a band the
   pre-047 opaque #about used to cover, and three actors kept drawing at
   opacity 0 through it. All are now draw-gated (`visible = opacity >
0.002`, written in the same frame as the fade so reverse scroll is
   seamless; labs and flag-off paths hold opacity > 0 so their gates never
   close): the mark's point pass (`BrandmarkPhysicsCore` — also skips the
   SVG-rest and #continuum-approach transparent states; the sim keeps
   stepping so every state stays warm), the armillary + card-track lines
   and orbit nodes (`HologramOrbits`). Additionally `useAboutStageScroll`
   measures the slot rect ONLY while the runway intersects the viewport —
   it previously forced a synchronous layout on every page scroll
   (write-vars-then-read-gBCR) from engage onward, i.e. everywhere on the
   landing page.

## Update 3 (2026-07-16) — the sweep: stack→flip as one movement

Owner: _"the cards stacking and the card flipping … should be one smooth
movement whereas right now I still need to scroll three times or smth to
get it to flip."_ A live probe of the CSS mirrors showed why: the stack
completed (`--svc-exit` = 1) a full ~100svh before the about runway
pinned (`--about-flip` > 0) — a dead viewport of scroll between the two
clocks. Root cause: the services runway's final EXIT-HOLD beat exists so
the NEXT station can sweep up over the still-pinned stack (`margin-top:
-100svh`, the ADR-030 grammar). Pre-047 the opaque #about carried that
margin; the transparent stage dropped it, and nothing swept — the hold
beat became dead scroll.

Fix, two coupled pieces:

1. **The sweep restored** (`about-stage.css`): `#about.station[data-about-
mode="stage"] { margin-top: -100svh }` — gated on the stage attribute
   (set once at engage, stable), NOT the transient `data-corridor-exit`
   band flag (geometry must not inflate mid-scroll). The about runway now
   pins while the stack settles, and the flip window's `[0 → 0.04]`
   pre-roll (~50px) lands exactly on the exit clock's settle tail
   (`DECK_SETTLE_WINDOW` end): the deck stacks and flips as ONE gesture.
   Fallback paths (attribute absent) keep normal flow — fail-static.
2. **The flip branch yields until its window opens** (`ServicesCardRing`):
   with the clocks overlapping, `aboutP > 0` no longer implies the stack
   is done, so the flip engages only at `posBlend = aboutFlipT > 0`
   (past `ABOUT_FLIP_WINDOW[0]`). Below that the STACK branch owns the
   settle; the two poses meet byte-identically at the boundary (settle
   end = `DECK_PLACEMENTS` constants = the flip's identity at θ = 0).

The "disjoint by page order" wording in the original Decision is
superseded: the clocks now OVERLAP by ~100svh, and the seam guarantee is
carried by the window gate + the shared constant pose at the boundary
instead of by page separation.

## Update 4 (2026-07-16) — the flip speed ramp

Owner: _"can the card flip be a bit smoother — really look at a smooth
speed ramp; almost there."_ Two compounding causes, two fixes
(`aboutDeckMath.ts` + the ring's useFrame):

1. **Velocity profile.** θ rode `aboutFlipT` (smootherstep), whose peak
   velocity is 1.875× the window average — over the short flip window the
   rotation read as near-still → whip → near-still. θ (and posBlend) now
   run `flipRamp`, a motion-control S-curve: smoothstep-shaped velocity
   ramps (`FLIP_RAMP_D` = 0.28 each side) around a CONSTANT-velocity
   cruise, peak 1/(1 − D) ≈ 1.39× average. C2 at both ends (starts and
   ends at rest — seam-continuous with the settled stack and the welded
   hold). Exact 0/1 at the window edges, symmetric (θ = π/2 still lands
   mid-window, so the `flipped` renderOrder swap stays edge-on). The
   smootherstep `aboutFlipT` REMAINS for the opacity consumers (orbit
   cluster reveal, mark/track fades, the DOM `--about-flip` mirror).
2. **Wheel quantization.** θ followed raw scroll, so every wheel tick
   (~100px) landed as a discrete rotation jump at the cruise. The ring's
   useFrame now damps the ramp t through an exponential follower
   (`DECK_FLIP_DAMP_RATE` 12/s ≈ 90% in 190ms) with the ring-spring
   discipline: hard deviation cap (`DECK_FLIP_DAMP_CAP` 0.35 — a flick
   never drags the pose > ~63° behind scroll truth), snap epsilon
   (`DECK_FLIP_SNAP_EPS` — byte-exact 0/1 at rest, so the stack-seam
   identity and the welded shift-tracking hold exactly), snap-on-engage
   (deep links / idle resumes pose instantly), and the delta clamp
   covers hidden-tab resumes. Reverse scroll is symmetric. The DOM
   channels stay RAW scrubbed vars (the ADR grammar); a ~100ms
   rotation-vs-opacity offset is imperceptible.

`deckFlip(aboutP)` still exists (= `deckFlipFromT(flipRamp(
aboutFlipLinearT(p)))`) for tests and any future undamped consumer; the
ring poses from `deckFlipFromT(dampedT)` so the rendered pose, the
renderOrder swap, the portrait-back opacity gate, and the depth writer
all read the SAME damped clock.

## Update 5 (2026-07-16) — seam perf pass: full draw-gate inventory + DOM-layer gates

The epilogue→#services seam janked (baseline 1280×800, full budget: p50
21–25ms, p95 50–58ms, ~45% of frames over 24ms, long tasks up to 798ms/run).
Update 2's insight — the stage keeps the corridor canvas alive through bands
an opaque section used to cover, so invisible work is real work — is now
applied across the whole surface. Post-change: p50 16.7ms (vsync), p95
37–42ms, >50ms frames ≈ 0, long tasks eliminated. Discipline throughout is
Update 2's: **the `visible` flag is written beside its opacity, in the same
frame**, so reverse scroll restores every layer frame-exact.

1. **Draw gates extended to the remaining painters** (Update 2 gated the
   mark/orbits/gates/shell): `LatentWormholeWalls` (walls + streaks + exit
   glow — heaviest ungated painter, pinned at 0 through the whole epilogue by
   its buildFade), `LatentFieldTunnel` (points/vectors/tokens; the CPU flow
   loop — three per-frame buffer re-uploads — now also skips while the whole
   field is invisible), `SubstrateTopography` main terrain points,
   `ScrollStreaks` (velocity-gated → closes at every idle beat corridor-wide),
   `CelestialMotes`, `CorridorPhotons`, `StaticStarfield` (stays open through
   ambient by design; its gate only closes if the envelope reaches 0).
2. **Ticker display gate + arc freeze** (`CorridorStationHeaders`): the fixed
   full-viewport ticker SVG ran a SMIL text-on-path relayout every frame under
   two viewport-sized drop-shadow filters — at opacity 0. The single-writer
   headers rAF stamps `data-signal-live` on `<html>` (crossing-gated); CSS
   `display:none`s the SVG outside the window and the ticker rAF skips its
   projection work. Once the docked dissipate passes SIGNAL_OUT.start (0.86)
   the arc FREEZES (exit is pure translation + fade), killing the per-frame
   textPath `d` rewrite exactly across the seam; skip epsilon 0.5 → 1.5px.
3. **Caption glass**: `visibility: hidden` written in the same opacity delta
   branch (engines don't reliably skip backdrop-filter at opacity 0 over a
   live canvas), and the `backdrop-filter` TRANSITION on
   `.home-v2-reticle__glass` is removed (blur is a static 14px at every
   station now; the Build weight rides on `background` alone).
4. **Root-style writes delta-gated**: the four per-frame
   `documentElement.style.setProperty` calls (`--signal-exit-lift/scale`,
   `--ticker-exit-lift`, `--signal-opacity`) fire only on meaningful change,
   as one group.
5. **Armillary anchor publishes delta-gated** (`CorridorArmillary`): while
   parked idle the identical projected anchor arrays republished to
   `hologramConnectorStore` every frame, re-rendering the DOM subscribers at
   60fps. Publishes now skip within a 0.25px/1e-3-depth deadband (ids +
   visibility compared; both sets together so they can never desync).

Not touched: the frameloop/FrameInvalidator contract (ADR-018/021/this ADR),
the ambient retarget, and the governor constants (see the ADR-038 2026-07-16
update for the paired `uPixelRatio` fix and the post-change numbers).

## Update 6 (2026-07-16, owner round 2) — one-scroll flip, rtl copy emergence, persistent mark

1. **One continuous movement.** `ABOUT_FLIP_WINDOW` [0.04, 0.26] → **[0,
   0.22]**. The #about pin coincides with services exit = 1 (the −100svh
   margin weld), so the 0.04 pre-roll (~5.6svh of held scroll) was the only
   dead travel between stack-complete and flip-start — it read as "two
   scrolls". The exit = 1 pose is pure constants, so flipping straight out of
   it is exact. Window ordering + endpoint pins hold (they reference the
   constants).
2. **Copy emerges right-to-left from the center.** The per-child scrubbed
   reveal swaps `translateY(14px)` for `translateX(32px → 0)` + a left-inset
   clip wipe (each line lands center-first, reveals outward to the left
   margin) — the owner read the upward rise as "cringy". Additionally the
   the NAME + ROLE eyebrow **scramble-decode** via the
   shared caption kernel, armed off the copy clock (`aboutCopyT ≥ 0.05` via
   `aboutStageProgressRef`, re-arm below 0.02, targets = line spans since the
   kernel owns `textContent`). Component-local rAF, single writer for those
   text nodes. (Superseded by Update 7: the middle `// Voidwalker.` em target
   was dropped — decode is now the TWO targets NAME + ROLE, not three.)
3. **The receded mark persists.** `ABOUT_FLIP_MARK_DIM = 0.45` replaces the
   full flip clear on the mark's opacity (`BrandmarkPhysicsCoreActor`) —
   ~0.30 of parked ink survives as a subtle centre presence behind the
   flipped portrait ("the wireframe should persist and just stay at the
   center"). The orbits/tracks keep their FULL clear (the armillary getter
   is untouched); the ambient envelope still kills the mark at #continuum.
   Screenshot-verified: the persisted dots read as ambient instrument
   around the portrait (the cluster shifts right, the mark holds centre).

## Update 7 (2026-07-17, owner) — two-target decode: "just my name in caps"

The identity **scramble-decode** dropped from THREE targets to TWO. The
middle `// Voidwalker.` em alias line was removed entirely (owner: "just my
name in caps") — the name now renders UPPERCASE via CSS on `.voidwalker__name`
instead of carrying a separate `<em>` handle/alias underneath it. The decode
kernel (`AboutStage.tsx`) therefore drives exactly two nodes now:

1. **NAME** (the `.voidwalker__name` inner span), `at: 0`.
2. **ROLE** eyebrow (`.voidwalker__role`), `at: SCRAMBLE_STAGGER_S` (0.14s).

Net: name at t0, role one stagger step later — no third (2×-stagger) em beat.
`SCRAMBLE_STAGGER_S` is now a single step between the two, not the base of a
three-step ladder. Nothing else in the beat/emergence contract changes (the
copy clock arm at 0.05, re-arm floor at 0.02, and the RTL emergence wipe all
hold). This is the mandated post-incident ADR sync for the decode-target set.
