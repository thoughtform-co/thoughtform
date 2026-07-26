# ADR-050: Services card face — tight rest state, expand-to-spec open plate

**Date:** 2026-07-26 (rev 3)
**Status:** Proposed (lab built, variant not yet promoted to production)
**Scope:** `components/landing/home-v2/services/hologram/ServicesCardRing.tsx`
(`bakeCardFace` + `faceVariant`, `bakeDrawerFace` + `openDrawer`, the drawer
children + frame-loop channel), `lib/services-ring/ringMath.ts` (drawer math +
renderOrder slots), `lib/services-ring/openPlateRef.ts`,
`components/landing/home-v2/services/hologram/ringCtaBox.ts` (drawer boxes),
`components/landing/home-v2/services/ServicesRingHitAreas.tsx` (drawer shims),
`components/landing/home-v2/services/servicePlateData.ts` (`ServiceSpec`,
`breakdown`), `lib/stores/hologramConnectorStore.ts` (`RingCardAnchor.drawer`),
`app/(internal)/test/services-card-face-lab/`.

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

## Decision (proposed)

**Nothing is switched.** `faceVariant` defaults to `"full"` and `onOpenFront`
is undefined in production, so the shipped surface, the smoke tests, and the
ADR-047 deck are byte-identical until the default is deliberately flipped.

1. **`faceVariant: "full" | "tight"` on `ServicesCardRing`**, threaded into
   `bakeCardFace` (which re-bakes when it changes). `tight` keeps the chip, the
   title and the lede, drops the includes row and the CTA slab, and corrects
   the hierarchy: title **40px**, lede **30px**. Built bottom-up from a small
   outlined `OPEN` chit so long copy grows upward into the photo instead of
   pushing the affordance off the card (worst case verified: Keynote at a
   two-line title over a three-line lede).

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

   **Rev 3.** Each card group gains a DRAWER — a card-sized slab sharing the
   card's own `slabGeometry` / `glintGeometry` — that slides out along
   card-local **+x**. Because it lives in card-local space it inherits the
   rig, the facing yaw, the pointer-look and the bounded sway _for free_: the
   pair is one entity by construction rather than by synchronisation. No
   swap, no replica, no DOM plate. `ServiceOpenPlate` and the entire
   `.svc-open` CSS block are DELETED, and with them the rev-2 `plateHideRef`
   channel — **nothing hides the card any more; that hide WAS the crossfade.**

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

## Open questions (why this is Proposed)

- Which variant is promoted: `v1` (tight face only) or `v2` (tight + drawer).
- **Promotion checklist**, none of it done: flip `faceVariant` to `"tight"` and
  pass `openDrawer` in `CorridorArmillary`; wire `onOpenFront` /
  `onCloseDrawer` in `ServicesStage` with real scroll dismissal; rewrite the
  smoke spec's front-card CTA assertion (it asserts the narrow `<a>` that the
  tight face no longer bakes); decide EAGER vs LAZY drawer bakes (eager costs
  ~18 MB of texture for four faces most visitors never open).
- The card face keeps its baked `OPEN →` chit while the drawer is out. It is
  baked, so hiding it needs a second face bake — currently it reads as a state
  label, which is tolerable but not intentional.
- The drawer's spec ink sits slightly dimmer than the card's copy. Untuned.
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
  loops are length-bounded — append children, and extend it in lockstep.
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
