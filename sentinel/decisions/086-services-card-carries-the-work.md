# ADR-086: The services card carries the work, not the practitioner

- **Status:** Accepted
- **Date:** 2026-08-30
- **Supersedes:** ADR-050's `tight` face on the _content_ of the card centre only. Its drawer, its chit, its no-CTA ruling, its flush-seam and yaw-cancel arithmetic, and every other addendum are untouched.
- **Related:** [ADR-029](029-services-card-ring.md) (the ring; the card is ONE object) · [ADR-050](050-services-card-face.md) (the tight face + the in-canvas drawer) · [ADR-058](058-light-mode-theme.md) (the theme flip) · [ADR-065](065-corner-law.md) · [ADR-011](011-brandmark-particle-artifact.md) (the density ladder the sigil direction read)

## Context

The four services cards baked a photograph of the practitioner behind their
copy. The owner opened the question himself (2026-08-30): _"I'm not sure
whether I should use pictures of myself. It may feel a bit vain and
egotistical… Maybe I want to use a particle system symbol at the center."_

The Brand Codex's CARDS cluster answers it. Across ~40 collected reference
cards **not one carries the practitioner** — the centre of a card is where the
WORK goes. That reading is recorded in
[`docs/design/card-reference-analysis.md`](../../docs/design/card-reference-analysis.md)
and it is what `/test/services-card-face-lab` was built to test, not assume.

The lab ran a survey — thirteen compositions, each a different _kind_ of
drawing, crossed against six settings of the name — and it produced a winner.

## Decision

**The landing's card face is `card`: the CONSTELLATION drawing on the centred
arrangement, with the title pinned to display.** `CorridorArmillary` mounts
`faceVariant={SERVICES_CARD_DRAWER ? "card" : "full"}`.

Three components and no more, which is the owner's own constraint: a title, a
paragraph, a visualization.

### The drawing: one cloud, four edge rules

The node positions are IDENTICAL on all four cards — same Fibonacci sphere,
same tilt, same count — because they stand for the same thing: a client's
estate of work, which does not change with which engagement is bought. What
changes is the structure drawn over it, and that is exactly what a service
does.

| service      | figure      | the claim                                                  |
| ------------ | ----------- | ---------------------------------------------------------- |
| keynote      | THE RADIANT | one source, rays to a room, no edges between the receivers |
| workshop     | THE ROUTE   | one path walked end to end, both ends marked               |
| embedded     | THE MESH    | triangulation across the cloud, the marks seated inside it |
| guided-build | THE SURVEY  | five regions, a gold traverse, and nodes joined to nothing |

⚠ **ONE VOCABULARY ACROSS ALL FOUR** — square nodes, straight chords, diamond
signals, depth carried by fade. Varying the vocabulary as well gives four
unrelated pictures; varying only the edges is what makes a SET.

⚠ **THE SURVEY'S UNLINKED NODES ARE THE POINT.** The advisory read names what
should stay person-led, so the drawing has to be able to say it — the
Intelligence Map's own rule, one surface over: a map that shows only what was
configured shows what was built and hides what was not.

### The composition

- The title's cap-top datum is **measured off the expand chit**
  (`TIGHT_EXPAND_INSET + TIGHT_EXPAND_SIZE + 50`). A top-left title _shares_
  the chit's centre line so the two bracket one band; a CENTRED title cannot,
  so the answer is the opposite of alignment — clear the chit far enough to
  read as its own band. At the hand-set 120 it started 30px under the chit's
  bottom edge, which is near enough to look like a failed alignment and far
  enough not to be one.
- ⚠ **THE CHIT DOES NOT MOVE.** It is the open affordance, it shares a corner
  and a scale with the drawer's close chit so open and close are one object,
  and a control that follows the layout is a control that gets lost.
- The `poster` band is **solved, not picked**: centred in the space the type
  leaves AT ITS WORST CASE across all four services. Two display title lines
  end at 258; a four-line paragraph starts at 1113; 100 units of clearance at
  each end fixes the figure at 656. Measured live — worst case `embedded` at
  100 above / 99 below, no collision on any service.
- ⚠ **THE FIGURE IS HEIGHT-BOUND.** The box takes the copy's own margins
  because width is slack and matching them is free; a bigger circle collides
  with type, so ~328 is this composition's ceiling, full stop.
- `FaceComposition.pin` fixes the treatment to `display`. A survey row leaves
  the treatment as an axis; a proposal decides it, and a card that changes when
  you press a chip has not been decided.

## Consequences

### ⚠ Three things keyed off the photograph, and none of them errors without one

This is the finding worth carrying. The face bake is not the photo's only
consumer, and every other consumer degrades SILENTLY on a drawn face.
`faceUsesPhoto(variant)` is the one predicate all three now read.

1. **The fetch.** The ring loaded `plate.photo.jpg` for all four cards before
   baking. Without the gate the landing downloads **334 kB** of portraits and
   paints none of them. (The discipline already existed one function below:
   _"flag-off never fetches the asset"_ for the portrait back.)
2. **The veil.** The hologram dot-matrix is the PHOTO's treatment — "full over
   the photo-led zone", y 230–640, fading out by 820. That is straight through
   the poster band's figure, so it would mute the drawing's top half and leave
   its bottom half clear: a horizontal split across the figure with nothing to
   explain it. ⚠ It is silenced on its MATERIAL (`visible`), never by dropping
   the mesh — `DECK_INTRA_ORDERS` rebases renderOrder positionally over
   `cardGroup.children`, so removing a child renumbers the ADR-047 deck.
3. **The scrims.** A scrim holds copy over an image. On a drawn face they are
   wrong in one theme and pointless in the other: in DARK the ground ramp lays
   `5,4,3` at 0.96 over a `10,9,8` card and washes the lower half of the
   drawing toward black, while in LIGHT the scrim family IS the parchment
   ground and the same ramp paints nothing. ⚠ The test is the BAND, not the
   drawing — a `full`-band composition either carries a photo or bleeds its
   field under the type (nebula), and both need the ramp.

### What is unchanged

- `tight` and `full` are **byte-identical**. Both are `full`-band, so the scrim
  gate does not reach them; `TITLE_HEAD_CAP_TOP` is only read on a top-CENTRE
  head and `tight` is top-left. `tight` stays in the lab as V1.
- The drawer, the chit, the hit areas, the sr-only mirror, `ringCtaBox`, the
  designation occlusion, and the published rects. The card's rect did not move.
- ⚠ **MOBILE STILL CARRIES THE PHOTOGRAPHS.** `ServicePlateCard` — the
  mobile/PRM accordion — is a different surface with its own IA (ADR-083) built
  around a full-bleed photo window, and the four assets stay live for it. So
  the "not the practitioner" ruling is DESKTOP-ONLY today. Named rather than
  quietly half-done.

### Verification

- `tests/visual/services-ring-smoke.spec.ts`: 20 passed, 1 failed — the failure
  is `--pda-txt3` at 2.38:1 in the light walk, the map console's palette,
  documented pre-existing in CLAUDE.md with the same ratio and untouched by
  this change.
- Real scrolls into the services beat at 1440×900, dark and light, both
  screenshot; the network log shows the four card portraits gone and only the
  ABOUT deck's own portrait remaining.
- `npx vitest run` — 1210 passed.

### Left open

- **Mobile.** Whether the accordion follows desktop off the photographs is a
  separate design call on a separate surface.
- **The title treatment** is pinned to `display` on the owner's last read of
  it, not on a stated ruling. The lab still crosses all six.
- **The drawer's face** is untouched and still reads as a spec sheet pulled out
  of a device; nobody has looked at it beside a drawn front.
