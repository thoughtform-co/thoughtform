---
paths:
  - "components/landing/home-v2/services/**"
  - "components/landing/home-v2/unifiedServicesInstrument.ts"
  - "components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx"
  - "lib/services-ring/**"
description: Services card ring — the corridor↔DOM split, and what must move together
---

# Rule: Services card ring

`#services` is the corridor's conversion beat, and it is split across **two
React roots**: the cards are WebGL planes orbiting inside the corridor canvas
(`CorridorArmillary` → `ServicesCardRing`), while every interactive and
readable surface is DOM in `ServicesStage`. Nothing about it is a single
component you can edit in isolation.

**Read first**

- [ADR-029: Services card ring](../sentinel/decisions/029-services-card-ring.md) — the ring, and the ONE-OBJECT guardrail
- [ADR-050: Card face + in-canvas drawer](../sentinel/decisions/050-services-card-face.md) — the tight face, the drawer, the promotion
- [ADR-025: Services hologram stage](../sentinel/decisions/025-services-hologram-stage.md) — the oscillation history; read before redesigning this surface again
- [ADR-044: Services masthead](../sentinel/decisions/044-services-masthead.md) · [ADR-047: About deck flip](../sentinel/decisions/047-about-deck-flip-stage.md) — the beat before and the beat after

## The card is ONE object

The 2026-07-10 red alert stands: never split a card into a photo plane plus a
separate text console, and never hide the card to show something else in its
place. All copy is BAKED onto the face. The open state is the card's own
in-canvas **drawer**, not a DOM plate — three DOM revisions were rejected
because a flat DOM rect cannot be a projected, tilted, bloomed slab, so the
silhouette changes shape at the handoff however well the pixels match.

Consequence: anything interactive or screen-readable about a baked surface
lives in `ServicesRingHitAreas`, shimmed over a **projected rect** the canvas
publishes to `hologramConnectorStore`. A surface with its own yaw needs its own
rect — the drawer is not a linear extension of the card's.

## What must move together

Changing the card's shape or state model touches **six** files in lockstep.
Change one alone and the surface is incoherent, not merely imperfect:

| File                            | Owns                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `unifiedServicesInstrument.ts`  | the flag (`SERVICES_CARD_RING`, `SERVICES_CARD_DRAWER`)                                |
| `CorridorArmillary.tsx`         | mounts the ring; passes `faceVariant` / `openDrawer`                                   |
| `ServicesStage.tsx`             | owns open state; the production `openPlateRef` writer                                  |
| `ServicesRingHitAreas.tsx`      | every hit target + the sr-only copy of baked text                                      |
| `ServicesDesignationLayer.tsx`  | callout occlusion against each published card rect                                     |
| `BrandmarkPhysicsCoreActor.tsx` | publishes `rigPointerYawRef` — the rig yaw the open pair cancels (ADR-050, 2026-07-27) |
| `casefile/ServicesCasefile.tsx` | the proof casefile that holds the front of the runway (ADR-056)                        |

`openPlateRef` has a **single-writer contract**: `ServicesStage` in production,
`CardFaceLabShell` on the lab route. Never add a third.

## Traps specific to this surface

- **Renumbering the deck.** `DECK_INTRA_ORDERS` is positional over
  `cardGroup.children`. Mount children with their FLAG, never gated on a lazily
  loaded texture — a mid-session child insert renumbers the ADR-047 deck's
  slots while its rebase is running.
- **Drawer renderOrder stays POSITIVE** and nested inside the card's range;
  orbit tracks render at 0, so a negative slot puts gold track dashes over the
  drawer's text.
- **Growing the card's footprint** invalidates the DOM overlays that dodge it —
  feed the new rect to `ServicesDesignationLayer`'s existing filter rather than
  inventing a second suppression path. The symptom mimics a texture
  bleed-through; see BEST-PRACTICES.
- **The open pair's edges are a YAW problem, not a bake problem.** The tray
  is offset a card-width along card-local +x, so any residual yaw — the
  card's, the rig's — swings it deeper and perspective draws it smaller,
  splitting the top/bottom borders. Nudging bake insets to compensate chases
  a moving target: the error tracks the cursor. Zero the yaw (and the
  drawer's content depth) instead; spend liveliness on PITCH, which moves
  both slabs identically. The RIG's yaw counts too — cancel it ON THE CARD
  (`openPairYaw` × `rigPointerYawRef`), never by damping the rig, which
  freezes the mark and orbits while a card is open. ADR-050 "Flush seam".
  **…and PITCH is DAMPED, not free (2026-08-02).** "Spend liveliness on
  pitch" met its limit: rig pointer pitch + hover pitch reach ~0.3 rad at a
  screen corner, and at that lean the pair's EXTRUDED frames (glass walls,
  chamfer cut, double silhouettes, the tray's open glint) stop agreeing
  with the flat bakes — the owner's "Escher-esque". `openPairPitch` ×
  `rigPointerPitchRef` scales the open pair's WORLD pitch to
  `OPEN_PAIR_PITCH_KEEP` (0.22 ≈ 4° max) on the same drawer clock; closed
  ring and deck are byte-identical (t = 0 identity, unit-pinned). The tray
  glint also dropped its BACK-face outline — an open bracket cannot afford
  two silhouettes (front U + floating back U = an impossible object under
  any tilt); the leading depth edges alone carry the thickness read.
- **The DRAWER bake is THEMED; the card faces are not (2026-08-02).**
  `bakeDrawerFace` takes a `DrawerPalette` — dark is the shipped ADR-050
  literals verbatim, light is Semantic Dawn ground / Latent Night ink /
  light-role gold (#caa554 — Tensor in BOTH modes since 2026-08-02;
  ADR-058's one-day #9a7a2e darkening is reversed), and the tray's slab caps, walls and glint
  follow via the same `drawerTheme` state (re-baked on a store flip; the
  old set disposes through the `[drawerTextures]` cleanup). The CARD faces
  keep their photo-dark treatment in BOTH themes — kept-dark imagery is an
  ADR-058 Lane-0 decision, and the parchment tray against the dark device
  is what sells "spec sheet pulled out of the machine". ⚠ A raw
  `data-theme` attribute write does NOT re-bake (only the store notifies);
  both real paths — the toggle and the `?theme=` bootstrap — go through
  the store/attribute pair correctly.
- **Dismissal keys on ring PROGRESS, not the step clock** — `data-active-step`
  only changes at beat boundaries, which lets a card rotate a half-slot with
  its drawer still out (`drawerDismissedByScroll`, unit-pinned in `ringMath`).
- **`ringMath` and `openPlateRef` are THREE-FREE on purpose.** The DOM side
  imports them; a `three` import there drags the WebGL stack into the landing's
  First Load JS.
- **Keep the ring mount gate and the services DOM gate the SAME media query.**
  Mobile / reduced motion keep the plate accordion regardless of any flag.
- **No wall-clock motion** (ADR-021) — only scroll clocks, click-driven slides,
  pointer-look, and the bounded spring.
- **The ring no longer owns the front of its runway (ADR-056).** The proof
  casefile does, and `splitServicesRunway` re-derives the ring's progress
  over what is left so every ring constant is unchanged. Two consequences:
  a runway FRACTION is not a ring progress any more (the smoke helper
  converts — do not hand-roll offsets), and the release gates the ring's
  ENTRANCE CLOCK (`ringEntranceClock` in `CorridorArmillary` — smoothed
  dissipate × `proofRelease`, fed as `dissipateGetter`), which holds the
  cards OFF-STAGE for the dwell and then replays the ADR-029 directional
  fly-in. Never swap that back to a `masterOpacityGetter` fade: a master
  fade lights the cards in their PARKED pose, i.e. a crossfade — the exact
  read the owner rejected (2026-07-28). The anchors follow for free (the
  park gate and the publish gate read the same clock). Delaying the ring by
  retuning `RING_ENTRANCE_WINDOWS` does not work either: they ride the raw
  dissipate, which has already saturated by then.

## Verifying

The corridor is scroll-driven WebGL: drive a REAL scroll (`window.scrollTo(0, y)`),
never an instant teleport, which skips the engagement band and leaves the canvas
dead. `tests/visual/services-ring-smoke.spec.ts` is the harness. Expect
run-to-run pose variance at the same nominal progress — confirm a suspected
composition bug across several runs before chasing it.

**Process**

- Before non-trivial changes: [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) (Cycle B if adding a section; Cycle A after fixes).
- After any non-trivial fix: same file, Cycle A checklist.
