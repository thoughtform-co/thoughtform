# ADR-138: The workshop reads About, the eras, then the Arc

- **Status:** Proposed (2026-09-30, owner). Built and measured; flips to
  Accepted once the owner has read the page live.
- **Surface:** `/arcs/thoughtform-workshop` — the prototype's `#voidwalker`
  shell, `journey.ts`, `page.tsx` (the five era sheets), `WorkshopPortals.tsx`,
  `thoughtform-workshop.css` rule 1b, and `flow/**` (`flowClock.ts`,
  `aboutFlowCarrier.ts`, `useWorkshopFlow.ts`). Shared, identity at rest:
  `lib/home-v2/corridorPreludeRef.ts`, `DepthGatewayScene/index.tsx`,
  `BrandmarkPhysicsCoreActor.tsx`, the core's `shaders.ts` +
  `BrandmarkPhysicsCore.tsx`, `gates/ThoughtformCompassGate.tsx`,
  `GatewayThroat.tsx`, and
  `voidwalker/hologram/HoloFigure.tsx` (the alpha verdict, below).
- **Supersedes:** [ADR-137](137-the-workshop-opens-on-the-corridor.md) U2 (the
  flip, the brandmark on the card's back, the thesis decoded from the bio, the
  CTA aperture, `TurnMark`) and U3 (the orbit morphed into the gate,
  `aboutTurnGate.ts`, `compassGateScreenRef`). U1 (the hero lifts over a held
  About) and U4 (the portrait is the deck's card) stand.
- **Related:** [ADR-082](082-voidwalker-character-stage.md) (the era stage,
  mounted here unchanged), [ADR-047](047-about-deck-flip-stage.md) and the
  About → era handoff on `/` (`lib/voidwalker/aboutVoidwalkerHandoff.ts`),
  [ADR-013](013-brandmark-journey-refactor.md) (the core's park and its
  dematerialise, which the seam runs backwards).

## The call

The owner, 2026-09-30: "we start with an introduction about myself. I do
think we need the era section after the About section. That way, I showcase
who I am, then what I've done before, and then we can dive into the arc … the
era section with the same type of transition we have on our homepage … we
have a pixel or particle system version of our brand mark there. It would be
amazing if, when you go from the era section into that section, the particle
system brand mark transforms into the actual brand mark … the rest of the
website can stay the same." Asked, he chose the minimal seam (the era's
ground opens onto the thesis frame as the particles converge; no reticle
morph) and the thesis copy revealed WITH the frame (no decode).

## The decision

**Three stages, one ground.**

1. **The era stage mounts itself.** `VoidwalkerPortal` runs on every route
   and mounts into any `[data-voidwalker-root]`, so the station is the
   homepage's shell verbatim between `#about` and the corridor, the five
   voidwalker sheets imported in `/`'s order, and one row in the journey, the
   roster and the menu. Its own hook drives it; nothing in it was edited.
2. **About → the eras is the homepage's handoff, in the DOM.** The era welds
   itself `-120svh` over the About (its own rule), so the two pin together for
   20svh and the era pins at the About's `u` 0.8. On the About's run: the copy
   leaves on per-line leaves (A_OUT), the orbit closes onto the card, the deck
   squares up, then the card flies to `aboutVoidwalkerHandoffRef.portraitSeat`
   on the individual `translate` / `scale` properties and the name's leaf
   glides onto the era title and scrambles into era 0's name. Both land by
   `u` 0.8; the card resolves into the figure on the era's own
   `--about-handoff-morph`, as `/`'s WebGL card does, and at `u` 0.94 the About
   hands over.
3. **The eras → the Arc is the corridor's PRELUDE.** On `/` the corridor is
   behind the reader by About and the eras, so its parked particle mark sits
   behind both. Here it is below them, so the route asks for that look
   through one three-free ref, `corridorPreludeRef` (`level`, `travel`,
   `fold`, `aperture`), which every reader treats as identity at `level` 0:
   - the scene counts it as engagement (the governor, the invalidator, the
     frameloop), so the canvas paints though nothing is armed;
   - the core takes its PARKED look (`recT`, `exitT` and the flip dim at
     `level · (1 − travel)`, the wireframe at `level · (1 − fold)`), and runs
     it backwards on the era's exit: TRAVEL [0.74, 0.88] walks the mark onto
     its thesis anchor, FOLD [0.8, 0.92] folds the wireframe onto a seed
     re-rasterised from the glyph at the fold's first frame (still at depth 1,
     so invisible), so it lands on the glyph's own pixels;
   - OPEN [0.9, 1] grows a square from the glyph's centre: the compass gate
     paints only INSIDE it (four clipping planes from the camera through the
     square's corners; half 0 hides it for the whole era), the core only
     OUTSIDE it (a fragment discard on a device-px rect), and the copy layer
     and the DOM glyph take the same square as `inset()` clips. The sweep of
     the opening over the converged mark IS the hand-over; nothing fades.
     The corridor mount is welded one viewport up under the era
     (`--tw-era-weld`), so the corridor pins on the frame the era unpins, and
     the stamp drops the prelude to 0 there.

The ground under About and the eras is the corridor's own frame, held `fixed`
on `--void` while the stamp is up, so neither stage paints a ground and
neither can move one.

## What the measurement found

- **The era's progress is written in ITS rAF, which can run after the
  writer's.** A scroll that stops left the flow on the previous frame's `p`:
  scrolling back up read "done" at p 0.986. Every scroll now buys a three-frame
  tail and a `p` that still moves keeps the loop alive.
- **An inset clamped at 0 cuts the glyph's GLOW** at its box edge into a dark
  tile (the void at 930px where the released frame reads its halo). The
  glyph's square may run negative (`squareInset(…, bleed)`).
- **`offset*` rounds to whole pixels.** The card landed ~1px wide of the
  seat; its rest box is now inverted from its painted one. The era publishes
  its title's seat the same way, so the name's glide end is re-seated on the
  title's LIVE box once the era has pinned: box equal, ink within 0.43px.
  The portrait seat is the homepage's own rounded contract and is kept.
- **The alpha verdict raced the figure's mount.** `HoloFigure` locks its codec
  at mount and treats undecided as the opaque floor; the probe starts when the
  figure's module loads. On `/` the station is far down and it never lost; here
  it lost 2 loads in 5, painting the floor's dark pane behind the figure (loud
  in light). A figure still out of range now takes the verdict when it lands,
  including one that settled between the render and the effect (which
  subscribed to nothing): 12 in 12 on real alpha, both routes. A figure already
  near keeps what it has, so the "never swap under a playing element" law
  stands.
- **The seam coincides by arithmetic.** At 1440×900 the era unpins at
  y 3510 and the mount's top reaches 0 at y 3510; the thesis title moves
  0.3px across the fixed → sticky swap (the corridor's own drift).
- **Fold fit:** the particle glyph folds within ~2px of the solid glyph.
- **The gate has a THROAT, and it is its own painter.** `GatewayThroat`'s six
  dotted square echoes behind the gate paint from the moment the corridor
  arms, which here is during the era's exit, so a faint dot lattice showed
  around the folding mark with the square still shut (loud in light; on `/`
  the same lattice is the first corridor frame, revealed by the hero). It
  takes the same square as the gate, as a fragment test that keeps only what
  is inside the opening, and hides at half 0.

## Update 1 (2026-09-30, owner): the square's edge is soft

The owner, on the live read: "there seems to be a frame going over the brand
mark as you transition into the third section … Can we make it a bit more
subtle?" The opening's hard edge crossed the mark while it was still half
particles, so the solid glyph and its halo showed as a square tile inside the
particle mark.

**The square is kept; its edge becomes a band.** `APERTURE_FEATHER_VH` (8 % of
the frame's height, ~40 % of the glyph's width at every shape) rides the
prelude as `aperture.feather`, never more than `half`. Across it every layer the
square touches ramps instead of cutting:

- the core fades OUT, over the band's outer 60 % (the particle mark is a hair
  fatter than the glyph it folded onto, and a full-width cross-fade drew it as a
  fringe round the glyph, loud in light where the field inks dark);
- the gate fades IN, through a fragment factor injected into its own materials
  (`onBeforeCompile`, exactly 1 while the prelude is off) in place of the four
  clipping planes, which can only cut and so drew a line of their own;
  `gl.localClippingEnabled` is gone with them;
- the throat fades in the same way;
- the copy layer and the glyph take feathered MASKS (two linear ramps,
  intersected) in place of `inset()`, and the glyph's goes on the shell's inner
  layer, under the shell's `drop-shadow`, so the halo follows the soft edge;
- the final square clears the corners by the band too, so nothing is still in
  the ramp at the hand-over.

Measured: no square at 1440×900 or 1920×1247 in dark; in light a faint dark
edge survives only on the glyph's outermost tips, for about 8px of scroll
(p 0.931 → 0.936). `/`'s HUD snapshots and corridor smokes are unchanged.

## Guards

- `tests/lib/workshop-flow.test.ts` — the four lengths pinned equal between
  the sheet and the clock (and the era's overlap against `voidwalker.css`),
  the welds keyed on the stamp, the windows' order (the card and the name by
  `u` 0.8, the handoff after the era's morph, TRAVEL ≤ FOLD ≤ OPEN ≤ 1), and
  the clock's functions.
- `tests/lib/corridor-prelude.test.ts` — inert defaults, the live-edge
  notification and its `<html>` mirror, three-free, and source pins that the
  scene, the core, the shader and the gate read it only through `level`.
- `tests/lib/thoughtform-workshop-parse.test.ts` — the order, the era shell's
  one empty root, the About slice ending at `#voidwalker`, one leaves layer,
  and no U2/U3 markup.

## Left open

- The About → era stand-ins are DOM (the leaves, the card), where `/`'s card
  is WebGL; the morph is the same clock, so the read is the same.
- On the capable rung the Arc starts 1.4 viewports later (the era's 260svh
  less its 120svh overlap and the 100svh mount weld); the
  workshop's own `menuPrimary` row now carries four chapters.
- ADR-137's left-open aperture tone step between the About and corridor
  grounds is gone with the About's own ground.
