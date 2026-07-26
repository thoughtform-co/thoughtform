# ADR-050: Services card face — tight rest state, expand-to-spec open plate

**Date:** 2026-07-26
**Status:** Proposed (lab built, variant not yet promoted to production)
**Scope:** `components/landing/home-v2/services/hologram/ServicesCardRing.tsx`
(`bakeCardFace` + `faceVariant`),
`components/landing/home-v2/services/ServiceOpenPlate.tsx` (new),
`components/landing/home-v2/services/ServicesRingHitAreas.tsx` (`onOpenFront`),
`components/landing/home-v2/services/servicePlateData.ts` (`ServiceSpec`,
`breakdown`), `components/landing/home-v2/services/services.css`
(`.svc-open` block), `app/(internal)/test/services-card-face-lab/`.

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

2. **The open state is DOM, and the plate IS the card — one entity.** ADR-029
   carries a red-alert guardrail from 2026-07-10 — never a photo plane plus a
   separate text console. The first cut dimmed the whole canvas behind the
   plate and the owner correctly read it as two overlapping entities
   (2026-07-26: "this is one entity... it should pop open, not introduce a
   new component"). The shipped mechanics: `ServiceOpenPlate` seats on the
   front card's published `ringAnchors` rect and grows outward
   (`EXPAND_W_MUL` 2.08, same centre and height), while `ServicesCardRing`
   damps THAT card's materials to zero (`openPlateRef`, the cross-root
   module-ref bridge; `PLATE_HIDE_DAMP_RATE` 9 ≈ the plate's grow) — **while
   the hidden card keeps projecting and publishing its screen rect**. The
   rest of the instrument (mark, orbits, side cards) stays at full strength;
   the depthWrite gate keys on the effective (× shown) opacity so the
   invisible card never occludes the particle pass as a phantom rectangle.
   Close re-derives the collapse target from the card's LIVE rect and the
   card damps back in — a visible hand-back, not an unmount (rendering by
   `lastIdRef` through the close is what lets the collapse play at all).

   DOM rather than a second bake because baked canvas text cannot reflow and
   is not selectable, linkable, or reachable by a screen reader — which is
   already why the front card needs a fake `<a>` shimmed over
   `RING_CARD_CTA_BOX`. A spec grid plus CTA would have needed several more
   such shims.

3. **The plate is a device slab, not a panel.** Matching the ring card's
   material is load-bearing for the handoff to read as the same object:
   extruded thickness (offset chamfer-clipped layer with a gold lip), a 9px
   bezel of glass around the content, the photo as a **dot-matrix feed** (soft
   ghost + the same image through the 4px mask — never dark dots over a clean
   photo), a 225° shell gradient so the brightest gold lands on both chamfer
   cuts, and an edge glint. Division of labour: the photo band is the
   **screen** (dense, dark ground under the feed layers), the copy column is
   the **glass** (see-through, local scrim for contrast only).

4. **Content follows the proposal grammar**, minus `03 / WHO` (that is
   `#about`): `01 / WHAT` = lede + `breakdown[]`; `02 / HOW` = `ServiceSpec`
   (duration, participants, format, language, leavesWith). **No price field**
   (owner, 2026-07-25): duration and group size filter enough for a first
   conversation; money stays in the proposal.

5. **Dismissal is close-on-scroll** (plus `×` and Escape). Scroll owns which
   card is front across the 500svh runway, so a surviving plate would sit
   still while the ring rotated behind it. This keeps `useServicesStageScroll`
   the single scroll writer instead of scroll-locking a scroll-driven
   corridor. The seat is **frozen at open time** and the anchors are read
   imperatively via `getState()` — subscribing to `ringAnchors` re-renders at
   frame rate and makes the plate jitter with the ADR-021 sway.

6. **The plate inherits the rig's motion by RIDING the hidden card's live
   rect** (owner, 2026-07-26 — it "should inherit the behaviour of the closed
   card in terms of how it's orbiting / aligned with the brandmark"). Once
   the grow completes the plate switches to `data-tracking` (geometry
   transitions off — a transition would drag every frame-write out over the
   grow duration) and a rAF loop follows the live published rect each frame
   with a light damp (`delta · 10`; the source is already rig-damped, this
   only smooths publish quantisation). Because the rect is the card's real
   projection, the plate carries the rig's pointer-look, the bounded ADR-021
   sway, and the facing-width breathing — measured ≈98px of sweep between
   pointer corners at 1600×1000 — rather than mirroring an approximation.
   A small rotation tilt rides on top (the rect cannot carry rotation):
   the rig's own formula (`yaw = nx · amp`, `pitch = −ny · amp · 0.6`,
   `delta · 4` damp) at `LOOK_AMP` 0.045 rad vs the rig's 0.12 — the plate
   is a far larger object, an equal angle would smear a spec sheet.
   Everything is written straight onto the element (styles + custom props),
   never through React state — a setState would re-render the whole spec
   sheet at frame rate. Still no wall-clock term anywhere: ADR-021 holds.

7. **Lab:** `/test/services-card-face-lab` (`?v=v0|v1|v2`, `?p=`), forked from
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
- **A second wide bake instead of a DOM plate.** Rejected: no reflow, no
  selectable text, and every interactive element needs a projected shim.

## Open questions (why this is Proposed)

- Which variant is promoted: `v1` (tight face only) or `v2` (tight + plate).
- The plate is face-on and flat; the ring cards get part of their depth from
  real perspective. A slight `rotateY` would close the gap at the cost of text
  crispness — untried.
- **Downstream:** the same four cards become the `#about` deck (ADR-047, plus
  a fifth `bakePortraitBack` face). A tight face changes what the deck looks
  like as it flips — verified as still reading, but it is a deliberate
  consequence to accept, not a side effect to ignore.
- `serviceData.ts` (`SERVICES`) and `servicePlateData.ts` (`SERVICE_PLATES`)
  still duplicate title/tagline/cta under a hand-maintained "keep in lockstep"
  comment. Deliberately **not** merged here — `SERVICES` has 20+ consumers
  including `CorridorSectionMenu` and `BrandmarkPhysicsCoreActor`, so the
  merge is its own pass with corridor-wide blast radius.

## Verification

- `npm run verify` green (350 unit tests). `ringMath` untouched, so
  `services-ring-math` (21) and `about-deck-math` stand as regression fences.
- Headed real-GPU capture of `?v=v0|v1|v2` at 1600×1000 (the calibration
  size); worst-case copy lengths (Keynote, Workshop) captured cropped.
- Production re-verified after every pass: front card still carries the CTA
  `<a href="#contact">`, no `.svc-open` layer mounted at all, `#about` still
  `data-about-mode="stage"`, zero console errors.
- Canvas-boundary check: `WEBGL_lose_context` forced on the lab canvas leaves
  the masthead, console and hit targets alive (see the BEST-PRACTICES note —
  `ssr: false` alone does not deliver this).

## Guardrails

- **The card stays ONE object.** The plate replaces the card at its own rect;
  it must never sit beside a readable card (ADR-029, red alert 2026-07-10).
- Add no wall-clock motion (ADR-021). At park the only motion is pointer-look
  and the bounded decaying spring.
- Never composite dark dots over a clean photo — the feed is the photo seen
  _through_ the mask, plus a ghost.
- **Nothing may establish a new BACKDROP ROOT above the glass body**, or
  `backdrop-filter` keeps reporting `blur(16px)` in computed style while
  rendering nothing — the transparency read dies silently. `filter:
drop-shadow` on an ancestor does exactly that, which is why the halo is an
  unclipped layer behind the plate instead. The pointer-look's 3D transform
  was measured and does **not** break it (crop A/B with
  `backdrop-filter: none`: 38.7KB blurred vs 63.5KB unblurred). Re-run that
  A/B before adding any `filter`, `mask`, or `opacity < 1` to the plate or its
  ancestors — computed style will not warn you.
- `--svc-open-dur` and `GROW_MS` must stay equal — the component clears its
  seat on that timing.
- Keep the ring mount gate and the services DOM gate the SAME media query.

## References

- Related ADRs: [029](029-services-card-ring.md) (the ring + the one-object
  guardrail), [025](025-services-hologram-stage.md) (the oscillation history),
  [044](044-services-masthead.md) (section-level copy),
  [047](047-about-deck-flip-stage.md) (the deck the cards become),
  [021](021-corridor-exit-zoom-dissipate.md) (motion contract),
  [048](048-editorial-band.md) (band geometry).
- Lab: `app/(internal)/test/services-card-face-lab/`
