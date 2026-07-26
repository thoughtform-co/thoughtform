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

## Open questions

- ~~The card face keeps its baked `OPEN →` chit while the drawer is out.~~
  **Largely resolved by the expand icon (2026-07-26).** The chit is still baked
  and so still visible while open, but it no longer reads as a stale state
  label: sharing size, inset and optical height with the drawer's ✕, the two
  read as an open/close pair sitting side by side. Hiding it outright would
  still need a second face bake, and is not worth it for this.
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
