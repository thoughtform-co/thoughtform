# ADR-050: Services card face — tight rest state, expand-to-spec open plate

**Date:** 2026-07-26 (rev 3; **promoted** same day)
**Status:** Accepted — `v2` (tight face + drawer) is live in the corridor
behind `SERVICES_CARD_DRAWER`.
**Scope:** `components/landing/home-v2/services/hologram/ServicesCardRing.tsx`
(`bakeCardFace` + `faceVariant`, `bakeDrawerFace` + `openDrawer`, the drawer
children + frame-loop channel), `lib/services-ring/ringMath.ts` (drawer math +
renderOrder slots + scroll dismissal), `lib/services-ring/openPlateRef.ts`,
`components/landing/home-v2/services/hologram/ringCtaBox.ts` (drawer boxes),
`components/landing/home-v2/services/ServicesRingHitAreas.tsx` (drawer shims),
`components/landing/home-v2/services/servicePlateData.ts` (`ServiceSpec`,
`breakdown`), `lib/stores/hologramConnectorStore.ts` (`RingCardAnchor.drawer`),
`app/(internal)/test/services-card-face-lab/`.
**Promotion also touched:** `components/landing/home-v2/unifiedServicesInstrument.ts`
(the `SERVICES_CARD_DRAWER` flag), `components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx`
(passes `faceVariant` + `openDrawer`), `components/landing/home-v2/services/ServicesStage.tsx`
(owns the open state; the production `openPlateRef` writer),
`components/landing/home-v2/services/ServicesDesignationLayer.tsx`
(occlusion extended to the drawer rect).

**Rev history:** rev 1 crossfaded a DOM plate over the card; rev 2 dimmed the
canvas behind it; rev 2b buffer-swapped a pixel-parity DOM replica. All three
were rejected by the owner. Rev 3 moves the open state INTO the canvas and
deletes `ServiceOpenPlate.tsx` and the `.svc-open` CSS block entirely.

## Context

`#services` is the conversion beat of the corridor, and the owner reported
(2026-07-25) that it is the one section that does not read: "it feels
overwhelming… very difficult for potential clients to parse what they're
actually looking at, and I think it's hurting me."

Diagnosis — the ADR-029 face bakes **five** content elements over a full-bleed
photo: gold chip, includes/meta row, title, lede, and a full-width outlined
CTA. Three problems compound:

1. **Two headline-weight labels.** The chip names the product ("Strategic
   Advisory"); the title makes a benefit claim ("Know where to invest in AI.").
   Nothing tells a reader which is the thing.
2. **Poster and spec sheet in one object.** The owner's own proposals separate
   these (`01 / WHAT` vs `02 / HOW`); the card mashes them.
3. **The hierarchy was inverted.** The lede baked at 35px against a 34px title
   (both raised on 2026-07-17, independently), so the two competed at
   near-equal weight and neither read first.

Two further findings from the same pass:

- **The section publishes zero qualification data.** No duration, group size,
  or format anywhere, while every proposal leads with exactly that. Half of it
  already existed in `serviceData.ts`'s `meta` rows and rendered on mobile only.
- **This surface has oscillated four times** — scan-note column + always-open
  card (rejected as "two UI systems over the hologram"), distributed orbit
  labels with click-to-expand (ADR-025 Update 6), the signal-plate cluster
  (Update 8/9), then the full-copy ring (ADR-029). Every step increased visual
  presence and decreased legibility of the choice. This is the first pass that
  reverses that direction, which is precisely why it ships behind a variant
  rather than as a replacement.

## Decision

**As designed (rev 3), nothing was switched:** `faceVariant` defaults to
`"full"` and `onOpenFront` is undefined, so the surface, the smoke tests and
the ADR-047 deck stayed byte-identical while the variant was judged in the lab.
**Promoted the same day** — see [Promotion](#promotion-2026-07-26-owner-directed).
The defaults above are unchanged, so the flag remains a one-word revert.

1. **`faceVariant: "full" | "tight"` on `ServicesCardRing`**, threaded into
   `bakeCardFace` (which re-bakes when it changes). `tight` keeps the chip, the
   title and the lede, drops the includes row and the CTA slab, and corrects
   the hierarchy: title **40px**, lede **35px** (raised from 30 — see the
   readability note below). Copy is built bottom-up so long copy grows upward
   into the photo (worst case verified: Keynote at a two-line title over a
   three-line lede).

   **Readability pass (owner, 2026-07-26): the rev-3 sizes undershot on
   short viewports.** On a MacBook-Air-class window (~840–900px of viewport
   height) the parked card renders small enough that the 30px baked lede
   lands around 13px on screen. The lede went back to **35px** — the size the
   owner had already approved for the full face's lede — and the hierarchy
   still holds because rev 2's failure (35 lede vs 34 title, same-ish weight)
   had none of the compounding differences this face has: 40 vs 35 **plus**
   bold vs regular, mono vs sans, uppercase vs sentence case. The drawer's
   body copy rose in step (bullets and spec values **27 → 31px**, labels 17 →
   19 / 18 → 20) and its ink lifted to **0.9** — closing the "drawer ink
   slightly dimmer, untuned" note below. The drawer column has the vertical
   room: it still ends well above the pinned CTA at the worst case.

   ⚠ **SUPERSEDED BY ADDENDUM 4 (2026-08-29): the affordance is a labelled
   `SEE THE SPEC →` BUTTON at the foot, and the expand chit is deleted.** The
   rest of this update is the record of how it got there, and its objection to
   a bottom-left affordance no longer binds — that objection was "it competes
   with the title for the bottom-left reading position", and the title is in
   the HEADER band now, so the foot is free.

   **Update (owner, 2026-07-26): the affordance is an EXPAND ICON in the
   top-right, not the bottom-left `OPEN →` chit.** Rev 3 put a small outlined
   `OPEN →` chit at the bottom-left and bottom-anchored the copy stack above
   it. Two problems: it competed with the title for the bottom-left reading
   position — the strongest slot on the card, which the title should own
   outright — and it capped how far the copy could grow before pushing the
   affordance off the card.

   The replacement is a hairline square chit carrying the universal
   open-in-full glyph (two diagonal arrows striking opposite corners), drawn
   rather than typed because the card's mono face has no such glyph and a text
   arrow would sit on font baseline metrics instead of the chit's centre.
   Consequences:
   - It is **sized and inset from `DRAWER_CLOSE_SIZE` / `DRAWER_CLOSE_INSET`**,
     derived rather than duplicated. The control that opens the card and the
     control that closes it then occupy the same corner at the same scale, and
     with the drawer out the two sit at the same optical height — one control
     family across the open handoff rather than two unrelated marks.
   - It **balances the header band** against the filled gold chip top-left,
     instead of floating alone above the bottom edge.
   - The copy stack now bottom-anchors on `TIGHT_COPY_BOTTOM` (BAKE_H − 72,
     the full face's CTA rhythm) and runs to the bottom edge; the affordance
     no longer constrains its growth.
   - Ink is split: the box recedes at gold **0.55**, the glyph reads at
     **0.95**. Subtle chit, clear mark — the balance the owner asked for.

2. **The open state is IN CANVAS: a second slab of the same device.** Three
   DOM revisions each failed the same way, and the root cause was
   architectural, not cosmetic — the closed card is a WebGL slab and the open
   state was DOM:
   - rev 1 crossfaded the two;
   - rev 2 dimmed the whole canvas behind a DOM plate — the owner read it
     immediately as two entities ("this is one entity... it should pop open,
     not introduce a new component");
   - rev 2b synchronised a buffer swap behind a pixel-parity DOM replica and
     the owner still called it ("why can't you just transform the closed card
     into the full card without any cheating like cross fades"). He was
     right: a flat DOM rectangle cannot BE a perspective-projected,
     pointer-tilted, bloomed, dot-veiled slab, so the silhouette changes
     shape at the swap no matter how well the pixels are matched.

   **Rev 3.** Each card group gains a DRAWER — a card-sized slab that slides
   out along card-local **+x**. Because it lives in card-local space it
   inherits the rig, the facing yaw, the pointer-look and the bounded sway
   _for free_: the pair is one entity by construction rather than by
   synchronisation. No swap, no replica, no DOM plate. `ServiceOpenPlate` and
   the entire `.svc-open` CSS block are DELETED, and with them the rev-2
   `plateHideRef` channel — **nothing hides the card any more; that hide WAS
   the crossfade.**

   **Update (owner, 2026-07-26): the drawer is a TRAY, not a twin.** Rev 3
   gave the drawer the card's silhouette wholesale — shared chamfered
   `slabGeometry`/`glintGeometry`, plus the chamfer chrome baked verbatim
   ("two slabs of one device"). Seen in production the owner read the result
   as a SECOND CARD parked beside the first, not the first one unfolding —
   and the grammar bears him out: the chamfer is the device's identity mark,
   so repeating it declares "another device". The drawer is now deliberately
   subordinate:
   - **Own geometry** (`drawerSlabGeometry` / `drawerGlintGeometry`,
     flag-gated memos): a plain rectangular slab (same Extrude recipe, so the
     `[caps, walls]` material-group pairing is preserved) and a glint tracing
     top / right / bottom ONLY. The LEFT (seam) edge stays unlit — a gold
     line at the joint would re-assert exactly the separation the tray exists
     to dissolve.
   - **Open baked border** to match: the shell gradient runs top → right →
     bottom and never closes the seam side; the chamfer corner fills and cut
     ticks are gone.
   - **Seam shadow**: the tray darkens toward the joint (a 130px void
     gradient), the depth cue that sells "slides out from under" the
     overhanging card.

   Only the CARD carries the chamfered identity silhouette; the tray reads
   as the card's own surface unfolding.

   **Same-day follow-up (owner): the tight card drops its TOP-RIGHT chamfer
   too.** With the tray now a clean rectangle, the card's own TR notch became
   the last misalignment at the docking edge — a cut corner meeting the
   tray's straight top edge. The tight silhouette is now **bottom-left
   chamfer only**: the right edge is a full vertical line the tray docks
   against flush, while the BL cut keeps the device's asymmetric identity
   (it is the corner the tray never touches). Variant-threaded through all
   three silhouette owners so `full` stays byte-identical: `slabGeometry`
   (the physical cut), `bakeCardFace`'s chrome (fill + shell + tick via
   `traceChamferPath(…, cutTR)`), and `bakePortraitBack`'s mirrored chrome
   (the flip maps physical TR → screen TL, so the tight deck back drops its
   TL cut — `traceChamferPathMirrored(…, cutTL)`).

   **And the OPEN PAIR steps forward (owner: "bigger… really show the
   contents").** Two halves, one state:
   - `DRAWER_OPEN_SCALE` (1.18, ringMath) rides the drawer clock via
     `drawerOpenBoost(drawerT)` — eases in with the slide, reverses on
     close, identity at 0 (closed ring and deck byte-identical; the deck
     snaps drawerT to 0 on engage). The recenter folds the boost into its
     card-scale term so the enlarged pair stays centred on the mark.
   - The section masthead (title + intro) DIMS behind it: `ServicesStage`
     sets `data-plate-open="1"` while a drawer is out, and services.css
     keys `--svc-plate-dim` (1 → 0.18) off it — a third factor on the
     masthead's existing entrance × decommission opacity product, never a
     competing writer. The var is a REGISTERED `@property` so the state
     change transitions (0.35s) without putting a transition on the
     scroll-driven `opacity` itself.

   This works as real occlusion, not just a dim: the corridor canvas
   OUT-STACKS the station DOM (`.home-corridor-host` z:3 >
   `.station--services` z:2 inside `main.stations`), so the enlarged pair
   genuinely paints over the masthead. (Same fact from the other side: the
   promotion's designation "ghost" was DOM showing THROUGH the
   semi-transparent drawer from beneath the canvas.)

   **Seam pass (owner, 2026-07-26): no vertical rule between the panels.**
   Two inks drew a line down the card↔tray joint, each fixed at its source:
   - The tight face's baked shell no longer strokes its RIGHT edge (the
     stroke sits at the face's renderOrder, so it painted OVER the emerged
     tray as a splitting rule). The closed card loses nothing: the slab
     GLINT already draws the right silhouette just outboard of the face,
     and that glint renders UNDER the tray's content (0.05 < 0.07) — so the
     edge is present closed and self-cleans the moment the tray emerges.
     One ink, two states, no texture swap.
   - The front hit's dashed hover/focus outline is suppressed while
     `aria-expanded="true"` — its right edge landed exactly on the seam.
     The outline is a closed-state affordance cue; the open pair's own
     shims (CTA / ✕) keep their focus treatment.

   ⚠ Measurement note: under the pointer-look, the published drawer rect is
   legitimately smaller/offset vs the card's when the cursor is far from
   the pair (the rigid pair pivots about the CARD's centre, so the drawer
   swings deeper — full tilt at a parked corner cursor, e.g. Playwright's
   default (0,0)). Verified rect self-consistency instead: the drawer
   height derived from the close shim and the CTA shim agree to 0.1px. Do
   not chase edge flushness from a screenshot taken with the cursor parked
   off-pair.

   **Superseded by the flush-seam pass (owner, 2026-07-27) — the
   foreshortening was not a measurement artifact, it was the defect.** See
   [Flush seam](#flush-seam-2026-07-27-owner-directed): the drawer rect is
   now within ~1px of the card's at every cursor position, so an off-pair
   screenshot IS a valid read of edge flushness.

   This also restores ADR-029's original guardrail in full ("the card is ONE
   object; the DOM only places hit targets"). The DOM plate was the deviation.

   Choreography: the card **recenters** (eases left by half the drawer's
   extent, `drawerRecenterX`) so the open pair stays centred on the
   brandmark; the held 3/4 pose **flattens** as it opens (`biasKeep`), because
   card-local +x is the receding axis under that bias and a foreshortened
   spec grid stops reading — the device turning to face you. Pointer-look
   survives the flatten, so ADR-021 holds. Close plays it backwards; the deck
   force-closes.

   Text is BAKED, like every other card face (owner's call). Its
   interactivity therefore lives in `ServicesRingHitAreas`, off a **second
   published rect** — `RingCardAnchor.drawer`, projected from the drawer's own
   mesh, because the drawer carries its own yaw and foreshortening and is NOT
   a linear extension of the card's rect. Shims: a real `<a>` on
   `DRAWER_CTA_BOX`, a `<button>` on `DRAWER_CLOSE_BOX`, `aria-expanded` on
   the front-card hit, and an sr-only block carrying the baked copy.

3. **Anatomy + renderOrder.** Three children APPENDED after the veil so
   existing indices 0–5 stay stable (the deck's rebase is positional over
   `cardGroup.children`): drawer slab `0.06`, content `0.07`, glint `0.08`,
   with content at `cardContentZ − 0.02` so it emerges from _under_ the face.

   The slots are **positive on purpose**. three.js orders transparents
   strictly by renderOrder before depth, and the orbit track `Line`s render at
   0 — a negative-slot drawer gets gold track dashes painted over its text
   (drawing at 0.1 is precisely how the card face defends against that). At
   0.06–0.08 the drawer paints over glass and tracks but under the face, so
   the card covers it while housed. Slots are named constants
   (`DRAWER_RENDER_ORDERS`, `RING_CARD_RENDER_ORDERS`) in three-free
   `ringMath`, unit-pinned to nest inside the card's range and never collide.

   ⚠ Writing this test surfaced a **pre-existing** condition worth recording:
   the card's own span already exceeds `DECK_RENDER_PITCH` (glow −0.1 → veil
   0.12 = 0.22 > 0.16), so slot N's glow already interleaves with slot N−1's
   veil during the deck. It is invisible only because the glow is damped to
   ~0 there (`stack.glowMul`). Out of scope, but do not assume the pitch is
   respected today.

4. **The two anti-ghost guards** — both required, both invisible, and both
   easy to mistake for stray fades:
   - The card face never reaches alpha 1 (`RING_OPACITY_RANGE` tops at 0.9),
     so a housed drawer would bleed ~10% of its own text through every card.
     The face therefore firms **0.9 → 1.0** as `drawerT` rises — the same
     entity solidifying as it activates.
   - The drawer's own opacity ramps over `DRAWER_REVEAL_FRAC` (0.15) and its
     group is `visible = false` while shut. The ramp completes while the
     drawer is still entirely behind the face, so nothing is ever _seen_
     fading — unit-pinned to finish before the leading edge clears the card.

   ⚠ Deleting either guard reintroduces the ghost. They are the ONLY places
   the drawer touches opacity.

5. **Depth-write discipline.** The drawer content material takes the card's
   **elected** `write` boolean — never its own gate. Two independent gates
   could both elect on one card, and an un-elected near-opaque drawer writing
   depth would occlude the renderOrder-1 particle pass as an invisible
   rectangle. The drawer draws first (0.07) and is farther in z, so the face
   still passes LEQUAL behind it. Its glass/glint stay `depthWrite: false`
   like the card's.

6. **Deck safety.** `drawerLevelRef` is **snapped to 0** the frame
   `deckEngaged` goes true, not left to decay: the recenter term lives in the
   normal branch only, so a fast scroll reaching the stack branch with a
   still-damping level would hand off between a shifted and an unshifted pose
   — a positional snap. (The `flipDamp` engage-snap precedent.)

7. **Hover.** An open card is force-marked `hovered` at the pick site, since
   its drawer extends well outside the card's own rect. Without it the veil
   re-fogs _and_ the tilt slumps the instant the pointer moves onto the
   drawer — exactly while the user reaches for its CTA. Both channels read
   `hovered`, so one line fixes both.

8. **Content follows the proposal grammar**, minus `03 / WHO` (that is
   `#about`): `01 / WHAT` = the `breakdown[]`; `02 / HOW` = `ServiceSpec`
   (duration, participants, format, language, leavesWith). **No price field**
   (owner, 2026-07-25): duration and group size filter enough for a first
   conversation; money stays in the proposal. The lede stays on the CARD face
   (rev 3) rather than repeating in the drawer.

9. **Dismissal.** `openPlateRef`'s single writer is now `CardFaceLabShell`
   (the DOM plate that owned it is deleted). Escape and the baked `✕` shim
   close; the lab also closes on any ring-progress change. The lab
   deliberately adds **no scroll/wheel listener** — it dispatches a synthetic
   `scroll` on every slider move, which such a listener could not tell from a
   real user scroll. Runway-driven dismissal belongs in `ServicesStage` at
   promotion, where a real scroll owner exists.

10. **Lab:** `/test/services-card-face-lab` (`?v=v0|v1|v2`, `?p=`), forked from
    `/test/services-anchor-lab` and inheriting its camera **calibration against
    the live corridor's published hit rects** (`CAM_DIST 2.95`, `RIG_Y −0.21`,
    scale 0.62) — the reason lab card geometry matches production.

## Alternatives considered

- **Comparison manifest** (four services as rows on a shared datum, ring
  demoted to an arrival beat). Best answer to "which of these is me?", and
  the honest read is that a carousel is the worst geometry for a comparison
  task. Rejected for now as the largest departure from a surface the owner is
  otherwise happy with; kept on the table if the tight face does not land.
- **Reviving the brandmark node/hotspot model** (ADR-025 Update 6 — labels
  pinned to projected wireframe nodes, click expands inline). Still runnable
  at `/test/services-demo`. Rejected: it is a _discovery_ interaction, and
  this is a conversion beat where the choice must be visible, not hunted.
  Cost is also no longer one flag — `ABOUT_DECK_STAGE` and
  `CONTINUUM_RAIL_STAGE` are both built on the ring's exit.
- **Copy-only tightening** (delete the meta row, keep everything else).
  Cheapest, and partly what shipped inside `tight` — but it leaves the
  qualification gap unaddressed.
- **Keeping the open state in the DOM** (revs 1, 2, 2b). Rejected by the
  owner three times, and the reason is structural: a flat DOM rect cannot be
  a perspective-projected, tilted, bloomed slab, so however well the pixels
  are matched the silhouette changes shape at the handoff. Its one real
  advantage — selectable, reflowing text — was traded away deliberately
  (baked text + hit shims + sr-only copy) to buy "one entity".
- **Hinging the drawer** at its own yaw so it always faces the camera.
  Rejected: it would stop being rigid with the card, which is the whole
  point. The pose FLATTENS instead, so the pair turns to face you together.

## Promotion (2026-07-26, owner-directed)

`v2` — tight face **and** drawer — behind one flag, `SERVICES_CARD_DRAWER`.

The variant question answered itself once the bake was read closely: the tight
face bakes its `OPEN →` chit **unconditionally**, so `v1` alone would paint an
affordance leading nowhere while also dropping the full face's CTA slab — a
quieter conversion beat with nothing put in its place. The two halves are only
coherent together, so they share a flag rather than getting one each.

Checklist, now done:

- `CorridorArmillary` passes `faceVariant={... ? "tight" : "full"}` and
  `openDrawer`. Flag off restores ADR-029 byte-identically.
- `ServicesStage` owns `openServiceId` and is the production single writer of
  `openPlateRef` (the lab shell is the other, and only on its own route). It
  wires `onOpenFront` / `onCloseDrawer` / `openServiceId` into
  `ServicesRingHitAreas`, and dismisses on **Escape** and on **runway scroll**.
- Smoke spec rewritten: the front-card assertions moved from the CTA `<a>` the
  tight face no longer bakes to the full-rect OPEN button (named for the
  plate's chip), plus a new test covering the ghost fence → open → Escape →
  scroll-dismiss cycle.
- **LAZY** drawer bakes (owner's call). See below.

**Scroll dismissal is keyed to ring PROGRESS, not the step clock.** The drawer
is welded to its card and rotates away with it, while `data-active-step` only
changes at beat boundaries — which would leave a drawer hanging off a card
that has visibly swung off front-centre. `drawerDismissedByScroll` +
`DRAWER_DISMISS_PROGRESS` (0.02 — a tenth of a beat, ~9° of rotation) live in
three-free `ringMath` and are unit-pinned, rather than buried in a listener.
Reading the progress ref rather than `scrollY` also means the programmatic
`startRingScrollTween` from a side-card click dismisses too, and that mobile's
zero-travel runway never trips it.

**The bake is LAZY, latched from the frame loop.** Four drawer faces cost
~18 MB of texture and most visitors never open a card, so the bake waits for
the first open REQUEST. The frame loop is the only reader of `openPlateRef`,
so it is where the DOM's intent becomes visible to React: it latches
`drawerRequested` once (ref-guarded — otherwise it would queue a setState at
60 Hz), and a dedicated effect bakes all four. Two consequences worth keeping:

- `wantOpen` is gated on `drawerTextures` landing, so a drawer can never slide
  out blank during the await.
- The drawer children stay **mounted from flag-on**, with a null map until the
  bake lands — NOT gated on the textures. `DECK_INTRA_ORDERS` is positional
  over `cardGroup.children`, so letting a mid-session bake add a child would
  renumber the deck's slots underneath a running rebase.

A `glEpoch` context-loss remount resets the latch along with the rest of the
component's state, which is correct and self-healing: `openPlateRef` still
holds the id, so the frame loop re-requests on the next frame.

**One new collision, fixed in `ServicesDesignationLayer`.** The drawer extends
into the screen area the brandmark's designation callouts occupy, so
"AI STRATEGY / the standing read" landed on top of the spec grid. The layer
already suppresses callouts that would sit on the front card's photo (they
read as annotating the photograph, not the wireframe); that same filter now
tests the drawer's published rect as well. Same rule, one more rect.

## Flush seam (2026-07-27, owner-directed)

> "make sure that the borders of the right panel align perfectly with those
> of the left panel so it feels they're one-component"

Seen in production, the tray's top and bottom borders sat visibly inside the
card's. Measured against the live corridor at 1600×1000 with the cursor at
the viewport centre, the tray projected at **94.6%** of the card's height —
top edge ~20px low, bottom ~28px high. It read as two misaligned panels.

**Root cause: the pair is rigid, so the tray's SIZE is a function of the
pair's yaw.** The tray is offset along card-local +x, so any yaw of the
assembly rotates it deeper than the card, and perspective then draws it
smaller. Rev 3 already knew half of this — it flattens `bias` on open for
exactly this reason — but flattening only the bias leaves three other yaw
terms live, and the error is proportional to `sin(yaw) × offset`. There is
no partial setting that keeps the edges flush: **the open pair has to be
square to the camera.** Three fixes, each closing one term:

1. **The flatten is TOTAL ON YAW** (`ServicesCardRing`): `ringYaw` is now
   `(cardFacingYaw + tilt.yaw + bias.yaw) × biasKeep` rather than
   `cardFacingYaw + tilt.yaw + bias.yaw × biasKeep`. The bias term is
   algebraically unchanged, so this is a strict generalisation and drawerT=0
   stays byte-identical. 94.6% → **99.1%**.
2. **`drawerContentDepth(t)`** (three-free `ringMath`, unit-pinned): the
   drawer's content plane closes its `DRAWER_HOUSED_DEPTH` (0.02) gap behind
   the card's as it opens, reaching **exactly 0**. A constant depth offset is
   a constant perspective mismatch — ~0.7%, ≈3px at each edge. Coplanar
   z-fighting is unreachable because the depth only ever does work where the
   two planes OVERLAP, and that overlap shrinks to the `DRAWER_SEAM` sliver
   on exactly the same clock. 99.1% → **99.98%** at a centred cursor.
3. **Cancel the RIG's yaw on the card** (`openPairYaw` + `rigPointerYawRef`):
   the `pointerLookRef` group sits ABOVE the ring, so its own yaw re-opened
   the gap as the cursor travelled — a far-corner cursor still threw the tray
   4% tall. `BrandmarkPhysicsCoreActor` publishes the yaw it applies, and the
   card SUBTRACTS it on the drawer clock, so the open pair's WORLD yaw is
   zero while the rig keeps rotating.

   ⚠ **The first attempt stilled the rig itself** — its pointer yaw target
   eased to 0 while a drawer was open. That held the seam, but it froze the
   mark and the orbits along with it: the whole instrument went dead at the
   moment of most attention, to fix a defect in one object. Compensating on
   the card confines the correction to the pair that needs it, and the result
   reads better than either — a gimballed screen holding face-on while the
   instrument moves behind it. Do not re-solve this by damping the rig.

**PITCH survives all three, and that is what keeps pointer-look alive on the
pair.** Pitch rotates about the very axis the tray is offset ALONG, so it
moves both slabs identically and can never break the seam — the open pair
still leans with the cursor, it just no longer turns. ADR-021 is untouched
(this removes motion from one object, and adds no clock).

Residual at an extreme corner cursor: the pair picks up a ≈0.5° ROLL, because
the rig's pitch and yaw do not commute with the card's, so cancelling the yaw
alone cannot cancel the composition exactly. It is a rigid roll of the whole
pair — the two top edges stay on ONE line across the seam, verified in
capture, and the heights still agree to 0.02%. Left alone deliberately: it
reads as honest 3D, and removing it would mean cancelling the rig's pitch too,
which is the channel the liveliness now lives on.

⚠ This is the **sixth** file in a surface the rule documents as five —
`BrandmarkPhysicsCoreActor` is now a participant in the drawer's state, as the
single writer of `rigPointerYawRef`.

### Verification (2026-07-27)

- `npm run verify` green — **369** unit tests (9 new: `drawerContentDepth`
  identity/monotonicity/clamping plus the overlap-vs-depth pairing that is
  the z-fighting argument, and `openPairYaw` — EXACT identity closed for any
  rig yaw, and `rigYaw + openPairYaw(…, 1) === 0`, which asserts the
  world-square invariant rather than the arithmetic).
- `services-ring-smoke` on `desktop`: **8 passed, 1 skipped** — the
  documented baseline, unchanged.
- Headed real-GPU measurement at 1600×1000 against the PRODUCTION route,
  card + drawer rects recovered from the published shims, sampled at three
  cursor positions (viewport centre / on the pair / far corner):

  | cursor           | before | after card yaw | + depth | + rig cancel |
  | ---------------- | ------ | -------------- | ------- | ------------ |
  | viewport centre  | 0.946  | 0.991          | 0.9986  | **0.9986**   |
  | on the pair      | 0.953  | 0.998          | 1.0004  | **0.9986**   |
  | far corner (5,5) | 1.144  | 1.034          | 1.042   | **1.0024**   |

  (drawer height ÷ card height. Top/bottom edge deltas ≤ 1.2px at a centred
  cursor, from 20px/28px; at the far corner both edges shift TOGETHER by
  ≈7px — the rigid roll noted above, not a step at the seam.)

- The rig is provably still leaning after the change: the card's own x tracks
  the cursor across the same three samples (227 → 222 → 148) and its AABB
  aspect goes 0.621 → 0.687 as the pitch takes hold. Stilling the rig would
  have pinned all three.

## Open questions

- ~~The card face keeps its baked `OPEN →` chit while the drawer is out.~~
  **Resolved by the expand icon (2026-07-26), and Addendum 5 shows why the
  question was mis-framed.** The chit stays baked and visible while open, and
  that is fine: a small corner glyph reads as chrome belonging to the card,
  not as a stale command. Addendum 4 replaced it with a labelled foot button
  and the answer stopped holding within a day — a full-width `SEE THE SPEC →`
  beside the drawer's `BOOK A KEYNOTE →` read as two competing commands, not
  as a progression. **The size of the persistent affordance is what decides
  whether the open state tolerates it.**
- **The section masthead overlaps the card's header band when open**
  (Addendum 4). `--svc-plate-dim: 0.18` recedes it in contrast but not in
  presence, because the masthead's type is much larger than the card's. The
  collision band is pre-existing. Addendum 5's frame HELPS — a bounded box
  reads as an object over the masthead where loose gold type read as tangled
  with it — but the masthead's own words are still legible through the card.
  One-line fix if wanted: a lower floor while `data-plate-open="1"`.
- ~~The drawer's spec ink sits slightly dimmer than the card's copy.~~
  Tuned in the 2026-07-26 readability pass (body ink 0.82/0.86 → 0.9, sizes
  27 → 31px).
- **Downstream:** the same four cards become the `#about` deck (ADR-047, plus
  a fifth `bakePortraitBack` face). A tight face changes what the deck looks
  like as it flips — verified as still reading, but a deliberate consequence.
- `serviceData.ts` (`SERVICES`) and `servicePlateData.ts` (`SERVICE_PLATES`)
  still duplicate title/tagline/cta under a hand-maintained "keep in lockstep"
  comment. Deliberately **not** merged here — `SERVICES` has 20+ consumers
  including `CorridorSectionMenu` and `BrandmarkPhysicsCoreActor`, so the
  merge is its own pass with corridor-wide blast radius.

## Verification

- `npm run verify` green — **357** unit tests (7 new: drawer slide/recenter
  identities + monotonicity + clamping, the reveal-ramp-completes-under-cover
  invariant, and the renderOrder nesting/collision contract).
- Headed real-GPU acceptance at 1600×1000 (the calibration size):
  - **Zero drawer ghost** at all five parks — no drawer rect published, no
    sr-only block, `aria-expanded="false"`. This is the blocking-flaw fence.
  - Open: the drawer's rect grows out of the card's right edge; the card
    recenters ≈200px left; 5 hit targets live (card + drawer CTA + close +
    two side cards); sr-only copy present.
  - Pointer sweep: card and drawer move together as a rigid pair (they pivot
    about the CARD's centre, so the drawer swings rather than translating —
    correct rigid-body behaviour, not a tracking failure).
  - Close via Escape: drawer rect and sr-only block gone,
    `aria-expanded="false"`, card back at its closed rect.
  - Zero console errors throughout.
- Production re-verified: front card still carries the CTA `<a href="#contact">`,
  no drawer bake fetched, `#about` still `data-about-mode="stage"`, zero errors.
- Canvas-boundary check (rev 2, still valid): `WEBGL_lose_context` on the lab
  canvas leaves the masthead, console and hit targets alive — `ssr: false`
  alone does not deliver that (see the BEST-PRACTICES note).

### Promotion verification (2026-07-26)

- `npm run verify` green — **360** unit tests (3 further: the scroll-dismissal
  hold / symmetric-dismiss / closes-well-inside-one-beat contract). The
  exact-threshold case is deliberately unpinned: `0.4 + 0.02` is
  `0.42000000000000004`, so "exactly at the threshold" is not a state a caller
  can construct, and asserting it would encode a rounding artifact.
- `services-ring-smoke` on `desktop`: **8 passed, 1 skipped** (the mobile
  case), including the new open/dismiss test.
- Headed real-GPU capture at 1600×1000 against the PRODUCTION route (not the
  lab), three runs:
  - Closed: the tight face reads chip → title → lede → `OPEN` chit, with no
    meta row and no CTA slab.
  - Ghost fence holds on the production surface: `aria-expanded="false"`, zero
    `.svc-ring-hits__sr` blocks, no drawer CTA link.
  - Open: spec grid legible (`01 / WHAT`, `02 / HOW`, the five spec rows), the
    baked CTA and ✕ reachable, the pair centred on the mark.
  - Scroll one beat on: `aria-expanded="false"`, sr block gone.
  - Zero console errors (the CSP `upgrade-insecure-requests` report-only notice
    is the dev server's and predates this work).
- ⚠ Corridor pose varies run-to-run at the same nominal runway progress
  (page height settles differently as assets warm), so one capture in three
  landed the pair left of centre. Not a recenter defect — confirmed by
  re-running. Do not chase it from a single screenshot.
- ⚠ `npm run test:run` cannot run on Node 18 in this workspace: vite 7 requires
  Node 20+ and the config load dies with `ERR_REQUIRE_ESM` before any test file
  is read. Pre-existing and unrelated to this change; `.nvmrc` pins 20 and CI
  reads it. Use the pinned version locally.

## Guardrails

- **The card stays ONE object, and NOTHING may hide it.** The open state is
  its own drawer; the rev-2 `plateHideRef` channel is gone and must not
  return — that hide was the crossfade (ADR-029 red alert, 2026-07-10).
- Add no wall-clock motion (ADR-021). The only motions are the click-driven
  slide, the rig's pointer-look, and the bounded spring.
- **The two anti-ghost guards stay** (face 0.9→1.0, drawer ramp + visible
  gate). Both complete under cover; deleting either reintroduces the ghost.
- The drawer NEVER gets its own depthWrite gate — it takes the card's elected
  boolean, or two writers can elect on one card.
- Drawer renderOrder stays POSITIVE and nested inside the card's range; a
  negative slot puts orbit-track ink over the drawer's text.
- **The open pair stays square to the camera in YAW — all of it.** The card's
  own yaw, the RIG's yaw (cancelled via `openPairYaw`, not stilled) and the
  drawer's content depth all reach 0 at full open, and the seam is only flush
  because all three do. Restoring any one of them (a "livelier" open pair, a
  nonzero housed depth kept for the emerge read) re-splits the borders,
  because the error goes as `sin(yaw) × offset` and the tray is a card-width
  from the pivot. PITCH is the channel to spend liveliness on — it cannot
  break the seam.
- **Correct the CARD, never the instrument.** The rig's yaw is cancelled on
  the card that owns the open drawer; damping the rig itself also works
  geometrically and was tried first, but it stops the mark and the orbits
  dead while a card is open. Keep corrections scoped to the object with the
  defect.
- `DECK_INTRA_ORDERS` is positional over `cardGroup.children` and both rebase
  loops are length-bounded — append children, and extend it in lockstep. This
  is also why the drawer children mount with the FLAG, not with their textures:
  a lazily-added child would renumber the deck's slots mid-session.
- The lazy-bake latch is **one-way per mount** and ref-guarded. It is read from
  the frame loop, so dropping the guard queues a setState every frame.
- `ServicesStage` is the ONLY production writer of `openPlateRef`. Adding a
  second writer reintroduces the split-ownership bug the ref was built to
  avoid.
- Callout occlusion tests the drawer rect as well as the card's. Drop it and
  the designation labels land on the spec grid.
- Never composite dark dots over a clean photo — the feed is the photo seen
  _through_ the mask, plus a ghost.
- Keep the ring mount gate and the services DOM gate the SAME media query.

## References

- Related ADRs: [029](029-services-card-ring.md) (the ring + the one-object
  guardrail), [025](025-services-hologram-stage.md) (the oscillation history),
  [044](044-services-masthead.md) (section-level copy),
  [047](047-about-deck-flip-stage.md) (the deck the cards become),
  [021](021-corridor-exit-zoom-dissipate.md) (motion contract),
  [048](048-editorial-band.md) (band geometry).
- Lab: `app/(internal)/test/services-card-face-lab/`

## Addendum — the open pair squares up, and the tray learns the light theme (2026-08-02, owner)

Owner report, with screenshots: the open pair's 3D frame read "a bit
Escher-esque… both in light and dark mode", and the opened card should go
"semantic dawn with tensor gold and latent night accents".

**Diagnosis (scene-probed, not eyeballed).** The open pair's world matrix
showed yaw at exactly zero (the flush-seam cancel working as designed) and
PITCH at ~0.32 rad with the cursor at a screen corner — the rig's
pointer-look pitch plus the card's own hover pitch, both fully alive at
open. At that lean the extruded frames disagree with the flat bakes three
ways: the glass box shows its side walls and BOTH silhouettes (double
gold outlines the content planes don't echo), the chamfer's side wall
draws a stray diagonal, and the tray's open glint — front U + back U +
only two connecting depth edges, the seam edge deliberately unlit on both
— literally forms an impossible object. Frame and content stopped agreeing
about the projection; the eye calls that Escher.

**Fix, three parts:**

1. `openPairPitch` (`ringMath`) — `openPairYaw`'s sibling with a KEEP
   instead of a hard zero: the pair's WORLD pitch (rig + local, via the new
   `rigPointerPitchRef`, published on the same actor line as the yaw)
   scales to `OPEN_PAIR_PITCH_KEEP = 0.22` on the drawer clock. ~4° of
   pointer life survives; the walls sit effectively edge-on. t = 0 is
   identity (closed ring + deck byte-identical), unit-pinned at both ends.
   This QUALIFIES the 2026-07-27 "pitch survives untouched" ruling the
   same way that ruling qualified stilling the rig: confine the stillness
   to the pair, keep the instrument alive.
2. The tray glint drops its BACK-face outline — an open bracket cannot
   afford two silhouettes. Front U + the two leading depth edges carry the
   thickness read.
3. `bakeDrawerFace` takes a `DrawerPalette`: DARK is the shipped literals
   verbatim; LIGHT re-papers the spec sheet in Semantic Dawn (#ece3d6)
   with Latent Night ink (#110f09) and the light-role gold (#CAA554 —
   Tensor, unchanged across modes since 2026-08-02; this read #9A7A2E
   for one day, see ADR-058) for
   everything that points — desigs, diamonds, shell, spec highlights, CTA.
   Tray slab caps/walls/glint follow via `drawerTheme` (store-subscribed;
   a flip re-bakes and the old texture set disposes through the existing
   cleanup). The CARD faces stay photo-dark in both themes — ADR-058
   Lane-0 kept-dark imagery; the parchment tray against the dark device is
   the "spec sheet out of the machine" read.

Verified headed in both themes with the cursor parked at the old worst-case
corner; drawer/ring/scroll-clock smokes green; `services-ring-math` suite
green with the new endpoint pins.

## Addendum 2 — photography reads as print on parchment (2026-08-02, owner)

Owner, same day: "shouldn't we also have a light mode filter for our
pictures?" Yes — and the coherent end state is the one the dawn tray
already implied: in light mode the whole card device goes paper.

**One recipe, two renderers.** The dark faces' gold-tone treatment was
already a luminance LUT (`buildGoldToneLut`, the documented
sepia/saturate/brightness/contrast chain). Light adds its sibling,
`buildParchmentToneLut`: sepia(0.55) saturate(0.88) brightness(1.1)
contrast(0.9), then levels into [30, 246] — the floor lifts print blacks to
warm ink (a photo ON paper never reaches #000), the ceiling keeps
highlights off the page white. The DOM twin is the same chain as a CSS
filter (theme.css) on the mobile plate photos and the about portrait —
minus the levels floor, which CSS cannot express. Keep the two in
lockstep; they are one recipe.

**The `FacePalette` (the DrawerPalette pattern, one surface up).** Dark is
the shipped literals verbatim — byte-identical, as always. Light re-papers
the face end to end: parchment ground and chamfer corners, parchment
scrims with Latent Night copy over them, light-role gold chrome, the chip
kept as a gold stamp with parchment ink, dawn-glass slab caps, light-gold
walls and glints, parchment veil fog. `ringTheme` (né `drawerTheme` —
renamed, it governs the whole device now) re-bakes faces, veil, portrait
back and drawer on a store flip.

**The opacity ceiling lifts to 1 in light.** RING_OPACITY_RANGE's 0.9 top
reads solid over near-black and as UNPRINTED PAPER over parchment — the
front card looked washed at rest. Light lifts only the ceiling (floor and
depth falloff stay, side cards still recede), and an opaque face hides the
housed drawer outright — strictly safer than the anti-ghost firm-up, which
still runs and is simply a no-op in light.

**Deliberately untouched:** the casefile's stills and films (content shown
whole, natural colour — rules/proof.md), and the hero (a dark artifact,
ADR-058 §5). The photography recipe is for the SERVICE imagery — the
pictures that are part of the instrument, not the pictures that are the
evidence.

Verified headed: light ring at rest (printed faces, receding sides), light
open pair (paper device end to end), dark ring byte-identical; drawer /
ring / scroll-clock / photo-404 smokes green; theme sweep + palette + ring
math suites green.

## Addendum 3 — one headline, one device (2026-08-29, owner)

Owner report on the parked ring, with screenshots: the top-left gold chip
("KEYNOTE") and the bottom-baked outcome line ("A SHARED FRAME FOR AI.")
made the reader look TWICE to know what the card was, and the open pair
"awkwardly attached … the right panel emerges and it doesn't feel elegant"
— specifically the angles at the joint did not agree.

Two separate fixes on the same surface. The face is a copy/bake
re-layout; the open pair is four corrections, three of which are strict
fixes to half-finished earlier passes rather than new choices.

### The face — name at the bottom, chrome at the top

The tight bake's copy grammar is now:

- **Readout rail** at the top (`y = 80`, PAD_X-aligned, chrome scale):
  the service's `statusCode` in mono at 20 bake px + a hairline
  `pal.ink(0.14)` rule running right to the expand chit. Same grammar as
  the drawer's `01 / What` designation but half its size — instrument
  chrome, not content. `statusCode` already existed per service in
  servicePlateData (`NAV-01` / `ENC-02` / `BLD-03` / `ADV-04`), used
  previously by the mobile plate only.
- **`plate.title` is DROPPED from the bake** — the outcome line
  ("A shared frame for AI.") no longer paints. It stays in the type and
  still renders on the mobile accordion (ServicePlateCard.tsx:225); the
  lede below the name already carries the claim ("…a working first setup
  and a clear build path"), so no copy is destroyed.
- **`plate.chip` is promoted to the bottom headline** in the title's
  treatment: 700 40px PT Mono, letterSpacing 3px, uppercase, **`pal.gold`**
  (owner, 2026-08-29 — Tensor Gold, one continuous gold statement with
  the leading diamond in the card's strongest slot), bottom-anchored on
  `TIGHT_COPY_BOTTOM`. A gold diamond (14×14 rotated square, `pal.gold`)
  sits to its left as the leading glyph — the chip's diamond, kept as
  the mark of significance without the filled-block chip that used to
  compete with the title. `pal.gold` is #caa554 in BOTH themes
  (ADR-058 Update 2), so no per-theme override — bright on dark,
  inked gold on parchment.
- **The full-variant chip row stays intact.** It was in a shared block
  drawn before the tight branch returned; that block moved INSIDE the
  full path so the tight bake never runs it. The `SERVICES_CARD_DRAWER`
  flag off restores byte-identically.

⚠ **`ServicesRingHitAreas` aria-labels key on `plate.chip`, which still
exists** — the smoke's `Open Keynote details` locator continues to match
without a rewrite.

### The open pair — why it read as two panels

**B1 — Firm the tray to opaque (this was the root cause).** The face
firmed to alpha 1 on open (`lerp(depthO, 1, drawerT)`), but the tray
content stayed at `depthO`, which caps at `RING_OPACITY_RANGE[1] = 0.9`
in dark. So at full open the tray was 10 % transparent beside an opaque
card — a different material — and the card's own seam-side glint
(renderOrder 0.05) and slab walls printed through the joint as a faint
gold hairline. Addendum 1's claim that the tight face's baked shell
"self-cleans the moment the tray emerges" only holds for an OPAQUE tray;
the tray never reached full alpha. Light did not show it because
Addendum 2 already lifts the ceiling to 1 in light.

**Fix:** `openPairAlpha(depthO, drawerT) = lerp(depthO, 1, clamp01(t))`
in three-free ringMath, called at BOTH sites (face + tray content), so
the invariant is stated once. Closed byte-identical (t = 0 returns
depthO, which was the shipped face formula). At t = 1 both sites return

1. The tray still multiplies by `reveal` (housed-invisible gate; the
   same DRAWER_REVEAL_FRAC). Unit-pinned (7 new tests):
   `openPairAlpha`'s identity closed, ceiling open, monotone/clamped, sum
   invariant across face + tray at full open, and the shipped-face-formula
   recovery. The tray's glass caps, walls and glint stay at `depthO` —
   they ARE glass and meant to remain translucent; the invariant is about
   the printed material, not the material of the slab itself.

**B2 — Match the card's open glint to the tray's** (Escher pass, part 2
— Addendum 1's Escher fix removed the tray's back-U outline but left
the card's `EdgesGeometry` untouched). Under `OPEN_PAIR_PITCH_KEEP =
0.22` the card kept drawing its full closed silhouette (back cap, all
four depth connectors, both chamfer diagonals) while the tray drew a
single front bracket — two silhouettes at odds with each other on the
same object.

**Fix:** `cardOpenGlintGeometry` — a bracket geometry mirroring the
tray's:

- front outline minus the SEAM (right) edge,
- BL chamfer diagonal (the tight face's only cut),
- two depth connectors on the LEFT (outer) end only.

Cross-faded against the full closed `EdgesGeometry` on `drawerT` in the
frame loop, at the same renderOrder (0.05). Sum is 1 at every t, so the
total ink at the card's silhouette does not pulse. Closed
byte-identical (t = 0 → open material at 0, closed at full). At t = 1
the card and tray together form ONE open bracket enclosing the pair,
with no line at the joint.

**B3 — Give the open pair the lawful TR+BL diagonal.** Tight closed,
the card has BL only; the tray was a straight rectangle. On the open
pair — which reads as ONE object — that was a single BL notch against a
square TR, off ADR-065's canonical diagonal.

**Fix:** the drawer's `slabGeometry` gets a TR chamfer at the card's
same leg (`slabW * RING_SLAB_CHAMFER_FRAC`). The two halves now split
the diagonal (BL card + TR tray), preserving Addendum 1's ruling that
neither half owns a full diagonal alone. The cut lands entirely in the
tray's `RING_SLAB_BEZEL` glass margin — at the content plane's right
extent the diagonal sits at y ≈ 0.749 against a content top edge of
~0.710 (2.8 % of card height of clearance), so the drawer bake's
border + `✕` close chit at bake px (750–806, 34–90) are UNTOUCHED.
Unit-pinned: the drawer leg matches the card leg, and the
content-plane clearance is guarded from below at 1 % of card height so
a subpixel roundoff cannot clip. The drawer glint's top edge, right
edge and top-side depth connector move with the cut.

**B4 — Tighten the seam shadow, and fix the drawer bake's theme
literals.** Two clean-ups on the same function:

- The seam gradient was `130 bake px × pal.seamA(0.6)` — ~65 CSS px
  of dark band at the tray's left, which read as a gap. Now
  `60 bake px × pal.seamA(0.7)` — ~30 CSS px of overhang hairline.
  Wide-band was hiding the seam bleed B1 fixed; with the tray opaque
  the wide band stopped selling "there's a card on top" and started
  saying "there's an empty column here".
- The shell gradient's four stops and the CTA's stroke/fill were
  hardcoded `rgba(202, 165, 84, …)` and `rgba(${DAWN}, …)` — a
  light-theme parity bug (cream on parchment is invisible; the gold
  literal happens to match `pal.gold` but pinning it in the bake
  strands it silently on a future palette change). All five now go
  through `pal.*`.

`OPEN_PAIR_PITCH_KEEP` unchanged this pass — with B2 landed the pitch
may afford more life, but that is a separate judgement to make against
capture.

### Verification (2026-08-29)

- `npm run verify` green — **1210** unit tests, **91** in
  services-ring-math (7 new: `openPairAlpha` identity/ceiling/clamps/
  monotonicity/invariant/shipped-formula recovery, plus the drawer TR
  chamfer's shared-leg and content-plane clearance guards).
- `services-ring-smoke` on `desktop`: **4 passed** on the ring/drawer
  contracts (ring mode retires racks; front card opens/Escape/scroll-
  dismiss; scroll clock advances; wheel over instrument). 1 unrelated
  pre-existing failure ("ambient hold survives … Azeroth teacher") —
  Voidwalker-adjacent, out of scope this pass (user directed).
- Headed real-GPU capture at 1600×1000 and 1280×720, both themes,
  cursor at (2, 2):
  - **Closed:** the tight face reads readout rail (NAV-01, hairline
    rule, expand chit) → photo → `◆ KEYNOTE` name → lede. No competing
    top-left chip; no bottom outcome line. Both viewports both themes
    match.
  - **Open:** the pair reads as one continuous device — card left, tray
    right, TR chamfer on the tray + BL chamfer on the card together
    completing the ADR-065 diagonal, seam clean at every viewport,
    photography survives on the card's half. Light shows the parchment
    tray properly and the CTA renders in gold.
- Screenshots archived at `C:\Users\buyss\Downloads\services-card-*.png`
  (dark/light × 1600×1000/1280×720 × closed/open).

### Guardrails added

- **`openPairAlpha` is the SINGLE writer of the pair's open-alpha
  invariant.** Two call sites (face + tray content) must route through
  it. Duplicating the arithmetic re-invites the tray-ceiling drift that
  caused the seam bleed — the whole point of factoring it out is that
  the invariant is stated ONCE.
- **The two glint sets cross-fade sum-to-1 at the same renderOrder.**
  Closed glint × (1 − drawerT), open bracket × drawerT. Add or remove
  a term without adjusting the sibling and the silhouette pulses at
  each open/close, or leaves the seam-side edge lit through the tray.
- **The drawer TR chamfer clears the content plane by ≥ 1 % of card
  height** (guarded in ringMath tests). A larger cut would clip the
  bake's border stroke and the `✕` close chit — the bake would need to
  learn about the geometry, which is exactly the coupling the plate
  design has avoided since ADR-029.
- **The drawer bake's shell + seam + CTA go through `pal.*`, not raw
  literals.** Any new bake stroke that needs a gold or an ink alpha
  picks the palette member; hardcoding a colour that "happens to match"
  the token silently drifts on a palette change.
- **`plate.title` is not deleted from the type** — the mobile accordion
  still renders it. Only the WebGL tight face stops baking it. If a
  future variant wants a two-line bake it re-adds a `title` slot; the
  data is still there.

## Addendum 4 — the title goes back up, and the foot gets a button (2026-08-29, owner)

> ⚠ **The foot button is DELETED by Addendum 5, same day.** Addendum 4's
> ORDERING survives (title at the top, photo, lede at the foot) and is what
> ships. Its CTA, its readout rail and its scrim reshape do not. Read
> Addendum 5 for the live face; this section stands for the reasoning, which
> is still the reason the title is at the top.

Same day, same surface, against a reference card (Grafana's): **title at the
top, visual in the middle, paragraph at the foot, button under it.** Owner:
"it makes more sense to put the title above (and we had that with the previous
version). We keep the paragraph at the bottom, but maybe below, we can have a
call to action like this example here."

This **reverses Addendum 3's placement decision and keeps its content
decision.** Addendum 3 was right that the card may carry only ONE headline and
that the headline is the service NAME — `plate.title` stays out of the bake.
It was wrong that the name had to move to the bottom to get it: what made the
shipped card read twice was TWO headlines, not the chip's position. With the
outcome line gone, the header band was free and the name could simply take it.
So the ordering is the reference's and the copy is Addendum 3's.

### The face, final

Header is the fixed end and grows DOWN; the foot is fixed and grows UP. The
photo absorbs both, so neither end can push the other off the card:

- **Readout rail** — unchanged at `y = 80`, except the hairline rule now runs
  the FULL copy width. It used to stop short of the expand chit; with the chit
  gone, stopping early would have left an unexplained gap in the masthead.
- **Service NAME** — `plate.chip` at the title's weight (700 40px PT Mono,
  3px tracking, uppercase, `pal.gold`) with its leading gold diamond,
  top-anchored on `TIGHT_NAME_TOP = 168` and growing down. Everything
  Addendum 3 decided about its treatment holds; only the anchor moved.
- **Lede** — unchanged treatment, re-anchored to `TIGHT_COPY_BOTTOM =
CTA_Y0 − 60`, the same gap the full face keeps above this identical control.
- **CTA** — `SEE THE SPEC →` at `RING_CARD_CTA_BOX`, gold hairline box over a
  `pal.goldA(0.10)` wash.

**The expand chit is DELETED.** It was solving discovery with the smallest
mark on the card — a 56px corner glyph carrying the entire "this opens"
signal. A labelled button says it in words, in the slot the eye checks last,
and it frees the header band for the name. `TIGHT_EXPAND_SIZE` /
`TIGHT_EXPAND_INSET` are gone with it, along with the now-orphaned
`DRAWER_CLOSE_SIZE` / `DRAWER_CLOSE_INSET` imports.

### ⚠ The card's CTA is the OPEN affordance, not the booking link

`DRAWER_CTA_BOX === RING_CARD_CTA_BOX`, so the card's new button and the
drawer's existing one land on the SAME geometry and stand side by side in the
open pair. Had the card's carried `plate.ctaLabel` → `#contact` too, the open
pair would have shown **two identical gold BOOK A KEYNOTE buttons at the same
height** — which reads as a duplication bug, not a control family. Owner
call: the card's button opens, the drawer's books. Two different labels on one
geometry read as a progression across the pair (`SEE THE SPEC` → `BOOK A
KEYNOTE`), which is the funnel the drawer exists to create.

Consequences worth stating, because each is a trap:

- **`ServicesRingHitAreas` is UNCHANGED.** The whole face is already a
  full-rect `onOpenFront` button, so the baked CTA is visual only — exactly
  the status the expand chit had. This is the first time the tight face bakes
  pixels AT `RING_CARD_CTA_BOX` **without the DOM shimming a link onto it**:
  the box is shared for LAYOUT, not for hit-testing. The ADR-029 path (no
  `onOpenFront`) still shims its `<a>` and is untouched.
- **The closed card still has no booking link,** which is what the smoke's
  ghost fence asserts (`getByRole("link", { name: "Book a keynote" })`
  → count 0 while closed). Giving the card's CTA the booking href would have
  broken that fence — the fence is a real constraint here, not a formality.
- **Weight is carried by the box, not the label size.** The card's button has
  a faint gold BODY where the drawer's is a pure outline. A solid gold fill
  (the reference's treatment) was rejected: it would out-shout the conversion
  it exists to lead into.
- `SEE THE SPEC` is mildly redundant while the spec is open beside it.
  Accepted: it reads as labelling the half you came from, and the alternative
  is a second card-face bake for the open state.

### The CTA label size — 21 → 28 bake px, for BOTH buttons

Measured on the live ring rather than eyeballed, because a screenshot of a
scaled canvas understates it badly:

| viewport  | state  | card scale | 21px label | 28px label |
| --------- | ------ | ---------- | ---------- | ---------- |
| 1600×1000 | closed | 0.554      | 11.6px     | 15.5px     |
| 1600×1000 | open   | 0.642      | 13.5px     | 18.0px     |
| 1280×720  | closed | 0.366      | **7.7px**  | 10.2px     |
| 1280×720  | open   | 0.426      | 8.9px      | 11.9px     |

**7.7 CSS px is not a quiet label, it is an absent one** — and on the tight
face this label is now the affordance the card has to be discovered by, so it
is the one string that cannot be under the floor. `CTA_LABEL_PX = 28` /
`CTA_ARROW_PX = 34`, shared by the tight face AND the drawer.

⚠ **The drawer's had to move with it.** The two buttons stand adjacent in the
open pair; raising only the card's would have made the booking CTA visibly
smaller than the "see the spec" one, inverting the hierarchy in the one state
where both are on screen. One constant, two call sites, so they cannot drift.

⚠ **The `full` variant deliberately keeps its own 21/30 literals.** It exists
only as the ADR-029 comparison baseline in `/test/services-card-face-lab`;
re-typing it would make the comparison unfaithful to what shipped.

### The scrims had to move with the copy

Both are branched on `variant` now — the `full` face is byte-identical.

- **Top scrim 190 → 320 bake px**, held at 0.9 → 0.7 through the name band
  before releasing. The full face only ever put a chip's 30px caps at `y 80`;
  the name's ink runs to ~180 for one line and ~230 for two, and a gradient
  already at alpha 0 by 190 left the gold name sitting on bare photo.
- **Ground scrim ramps FASTER** (seated 0.86 by 42 % of the span, against the
  full face's 0.58 by 34 %). The copy stack rose ~116px when the lede
  re-anchored above the CTA, which put a FOUR-line lede's top line (Embedded,
  155ch — the longest) on ~0.70 coverage where it used to sit on ~0.90.
  ⚠ **Fixed by re-shaping the ramp, not by moving the origin** — dropping the
  origin would have eaten the photo, which is the middle third of the
  reference composition and the reason the card is a card and not a panel.

### Verification (2026-08-29)

- `npm run verify` green — lint, typecheck, **1210** unit tests. No test
  needed changing: nothing pinned the chit's pixels, and every DOM contract
  (`aria-expanded`, the ghost fence, the `Open Keynote details` locator) is
  untouched by a bake relayout.
- `services-ring-smoke` on `desktop`: the two ring/drawer contract tests pass
  ("ring mode retires the racks; cards expose their CTA", "the front card
  opens its spec drawer, and Escape / scroll dismiss it").
- Headed real-GPU capture, dark + light × 1600×1000 + 1280×720, closed +
  open (8 frames):
  - **Closed:** `NAV-01` + rule → `◆ KEYNOTE` → photo → lede →
    `SEE THE SPEC →`. The reference's order, and the name reads first.
  - **Open:** the two buttons form ONE control row across the pair, same
    height, same size, distinguished by body-vs-outline.
- ⚠ **Left open (owner call):** in the OPEN state the section masthead
  (`AI CAPABILITY / YOUR TEAM OWNS.`) overlaps the card's header band — the
  open pair scales up and slides under it, and the masthead's dim floor is
  `--svc-plate-dim: 0.18` (services.css, owner-set 2026-07-26). The collision
  band is pre-existing (the gold chip sat there too), but it is more visible
  now that the band holds a large gold NAME against the masthead's large gold
  second line. Not touched this pass because 0.18 is an owner value; the
  one-line fix if wanted is a lower floor while `data-plate-open="1"`.

## Addendum 5 — the name gets a frame, the chit comes back, the card loses its button (2026-08-29, owner)

**This is the live face.** Addendum 4 shipped in the morning and the owner
read the OPEN pair the same day:

> "with the open card, the two exact calls to action, I don't think they work,
> so let's remove the button in the collapsed card … add a frame around
> Keynote / Workshop, like the actual title, so it's clear. The button to open
> the card should be in the top-right corner. I also saw you added a masthead
> to the collapsed card in NAV-01 — remove that so the title of the card moves
> up."

Four edits, one direction: **the tight face carries three content elements
and one control, and the control is small and in a corner.** Addendum 4's
ORDERING survives untouched — title at the top, photo, lede at the foot. Its
three additions do not.

### What the open pair actually showed

Addendum 4 argued that `SEE THE SPEC →` and `BOOK A KEYNOTE →` at one height
would read as a PROGRESSION because the labels differ. On screen they read as
two competing commands. The argument was made about the labels and the eye
answers on the SILHOUETTE first: two full-width gold-outlined bars of
identical height, side by side, are one visual rhyme, and a reader resolves
"which of these do I press" before ever reading either.

⚠ **A distinction that only exists in the text is not a distinction.** The
body-vs-outline weight difference was real and measured and was not enough,
because it modulates within a shape the eye has already paired.

**The corollary is the useful part, and it corrects this ADR's oldest open
question** (which had run since the `OPEN →` chit): the problem was never
that the card keeps a visible affordance while open. It is that the
affordance's SIZE decides whether the open state tolerates it. A 56px corner
glyph is chrome belonging to the card. A full-width labelled bar is a command
addressed to the reader, and a second one of those is a fork.

### The face, final

- **Framed NAME** — `plate.chip` (700 40px PT Mono, 3px tracking, uppercase,
  `pal.gold`) with its leading gold diamond, inside a **hairline gold box**.
  This is the ADR-029 gold-stamp chip's descendant at the title's size and
  OUTLINED instead of filled: the filled block was exactly what made the old
  chip read as a tag beside a headline, where an outline at 40px reads as the
  headline's own housing. Stroke is `pal.goldA(0.55)` at 2px — **the expand
  chit's stroke, deliberately identical**, so the two objects bracketing the
  header band read as one chrome family rather than two unrelated marks.
- **Expand chit** — restored at `TIGHT_EXPAND_INSET` / `TIGHT_EXPAND_SIZE`,
  still derived from `DRAWER_CLOSE_*` so the control that opens the card and
  the one that closes it occupy the same corner at the same scale.
- **Photo** — the middle third, unchanged.
- **Lede** — unchanged treatment, re-anchored to `TIGHT_COPY_BOTTOM =
BAKE_H − 72`, which is where it sat before Addendum 4 lifted it over a CTA.
- **No readout rail. No CTA.**

### The frame is MEASURED, and centred on the chit

Two constraints that a fixed box would fail:

- **It wraps the text it actually holds.** The name wraps against
  `chitX0 − 20 − pad`, so a long service name can never run under the
  affordance; the frame then sizes to the widest line and grows in
  `TIGHT_TITLE_LH` steps. All four current names fit one line (the widest,
  `EMBEDDED AI PARTNER`, measures ~513px against ~600 available), but the
  wrap is the guard that keeps that from being a fact about today's copy.
- **`NAME_CAP_H = 28` is a measured constant, not `measureText`.** Canvas
  exposes no cap-height metric, and `actualBoundingBoxAscent` varies with the
  STRING — a name with no descender would size its frame differently from one
  with, so four services would carry four frame heights. A constant is what
  makes the frame the same height on every card.
- **Frame and chit share a CENTRE, not a top edge** (both on `y = 62`). The
  frame is taller; two boxes of different heights sharing a top edge read as
  misaligned, where sharing a centre reads as seated.

### The rail goes, and the title rises

`NAV-01` was Addendum 3's answer to a header band emptied by moving the name
to the foot. Addendum 4 put the name back in that band and kept the rail
anyway, which stacked two things in the slot and pushed the name down to
`y 168` — the owner's "remove that so the title moves up". With the rail gone
the frame seats at `y 24` and the name is the first thing on the card.

⚠ `plate.statusCode` is **not** deleted from the data — the mobile plate
still renders it. Only the WebGL tight face stops baking it.

### What moved back, and what did not

- **Ground scrim: un-branched.** It reverts to the shared ramp
  (0.34 → 0.58, 0.62 → 0.9). Addendum 4's faster ramp existed only because
  the lede had risen ~116px to clear a CTA box; with the lede back on the
  bottom margin, the shared ramp is the depth it was tuned for. **A branch
  added to compensate for a change must come out with the change** — left in,
  it would be an unexplained tight-face darkening that the next reader would
  have to disprove.
- **Top scrim: still branched, 320 → 260.** The tight header still needs more
  than the full face's 190 (the frame reaches `y 100`; the full face only put
  a chip's caps at `y 80`), but not the 320 that Addendum 4's `y 230`
  two-line name needed. Stops `0.9 → 0.72 at half → 0` puts ~0.76 under the
  frame's bottom edge.
- **`CTA_LABEL_PX` / `CTA_ARROW_PX` stay at 28 / 34** even though only the
  DRAWER uses them now. Addendum 4 raised them on a pairing argument that no
  longer applies, but the legibility measurement stands alone: at 1280×720
  the OPEN pair renders at scale 0.426, which put the booking CTA's 21px
  label on **8.9 CSS px**. Reverting would shrink the one real conversion
  control on the surface to fix nothing.

### Verification (2026-08-29)

- `npm run verify` green — lint, typecheck, **1210** unit tests. Again no
  test needed changing: nothing pins bake pixels, and every DOM contract
  (`aria-expanded`, the ghost fence, the `Open Keynote details` locator) is
  untouched by a relayout of the canvas.
- Headed real-GPU capture, dark + light × 1600×1000 + 1280×720, closed +
  open (8 frames):
  - **Closed:** `[◆ KEYNOTE]` framed top-left, expand chit top-right, photo,
    lede on the bottom margin. Nothing between the card's top edge and the
    name.
  - **Open:** exactly ONE command in the pair (`BOOK A KEYNOTE →`), and the
    framed name reads as an object over the masthead rather than tangling
    with it — the frame improves the known overlap without touching
    `--svc-plate-dim`.
