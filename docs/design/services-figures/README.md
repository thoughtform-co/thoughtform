# Services figures — four services, three materials (lab pass, 2026-09-19)

The `#services` cards' visuals, explored as three holographic materials on ONE
figure record, on the re-cut four services. Lab only: nothing on `/` moves
until the owner has read this live. No ADR yet; one follows the winning
direction (the BOARD-archetype / config-lab precedent).

```
http://localhost:3003/test/services-card-face-lab?v=raster
http://localhost:3003/test/services-card-face-lab?v=volume
http://localhost:3003/test/services-card-face-lab?v=wire
```

`?svc=N` parks card N front and settled; `?t=` crosses the title treatment
(pinned to `display` on these rows, so the chips do not reach them).

## The two rulings (owner, before anything was built)

- **The merged offer is EMBEDDED.** Strategy + Embedded fold into one card
  named by the doctrine's own flagship word, which already spans both
  altitudes (the team, and a standing session with leadership). The title
  "An intelligence configuration you own." stays, so the object is named once
  and the mode once.
- **The subject stays the estate.** ADR-086's one cloud and four edge rules,
  re-solved for the new four; the MATERIAL is the only variable across the
  three directions.

## The four services (`serviceRecut.ts`, lab-only until read)

| slot           | service      | what changed                                                                                                                                           |
| -------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `keynote`      | Keynote      | verbatim                                                                                                                                               |
| `workshop`     | Workshop     | verbatim                                                                                                                                               |
| `embedded`     | Embedded     | ADR-111's record; chip `Embedded`; the leadership altitude enters through the third bullet and the includes                                            |
| `guided-build` | Home session | NEW on the site — six to eight people, one morning, Antwerp, individually registered, the argument then the skill by hand; no price, no digit (tested) |

Every string is a draft for the owner's read. What is not a draft: the fit
(`tests/lib/services-recut.test.ts` walks every record through the phone
back's `backFaceLayout`: title ≤ 2 lines, content above the CTA) and the copy
law (`lib/services-ring/servicesCopyLaw.ts`, ADR-111's open guard closed — it
walks production's copy too).

## The four figures (`lib/services-ring/serviceFigures.ts`)

Node positions identical on all four (one client estate, the constellation's
own Fibonacci sphere and tilt). The structure varies:

| slot         | figure      | the claim                                                                                                                                                                                                      |
| ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| keynote      | THE RADIANT | one source, rays to a room, no edges between receivers                                                                                                                                                         |
| workshop     | THE ROUTE   | one path walked end to end, both ends marked                                                                                                                                                                   |
| embedded     | THE MESH    | triangulation, three seats in order and growing (ADR-111), and a handful of front nodes deliberately joined to nothing — the person-led work, absorbed from the SURVEY so the advisory claim survives the fold |
| guided-build | THE TABLE   | eight seats around the front pole, every pair joined; the inverse of the radiant                                                                                                                               |

One vocabulary across all four (square nodes, straight chords, diamond
signals, depth by fade). The record is pure, canvas-handed (`y` down, `z`
toward the viewer), deterministic without a PRNG; the table's seats are chosen
by farthest-point selection on bearing, because a nearest-to-target greedy
left a sector empty.

## The three materials

**R · Raster** (canvas-2D, `cardViz.ts` language `raster`). The figure drawn
FAT into an offscreen coverage field, then every cell of a PT Mono grid
(18 bake px, 0.6 em wide) letters one glyph off the ramp `· - + = # @` by its
mean luminance, alpha by the same, every third row losing light as a scan
cadence (baked as removed light — the voidwalker mask's law). Marks stay
diamonds. Static bake, zero per-frame cost; the phone takes it unchanged.
Reference: HORSE 2026, the ASCII portraits on the design rack.

**V · Volume** (three.js, `cardFigureVolume.ts`, `figure="volume"` on the
ring). The same figure given its third dimension back: PT Mono glyph sprites
at their own depth over the poster band, chords as hairlines, the near
hemisphere protruding 0.55 R in front of the face. Static geometry inside the
card's group — it moves with the card and with nothing else (ADR-021's
card-content clause), so the ring's turn and the rig's pointer-look give it
real parallax. The face bakes the type alone. The ring's FIRST ShaderMaterial:
`#include <colorspace_fragment>` or the gold goes muddy; opacity held at 0
until the atlas is mapped (an unbound sampler reads opaque). Not mounted on
the phone profile or under the governor's floor.
Reference: the particle body on its platform, the wireframe orbits.

**W · Wire** (SVG, `lib/services-ring/serviceWire.ts`, `cardViz.ts` language
`wire`). The figure as line work on the house ring register (the About
drawing's rings on their dash ladder, the rim graduated every 15° off the
cardinals, four stubs — copied by hand from ADR-106's dial, never imported),
emitted once as absolute path data and rendered twice: through `Path2D` into
the bake, and as the inline SVG strip in the lab console (the future mobile
plate). Reference: the wireframe device; ADR-025 U4's "technical illustrated
line object".

## The seams that keep production byte-identical

- `ServicesCardRing` gained two additive props: `plates` (default
  `SERVICE_PLATES`) and `figure` (default `"off"`).
- `DECK_INTRA_ORDERS` has a second table, `DECK_INTRA_ORDERS_VOLUME`,
  selected by `volumeOn` — a static positional table over a conditional child
  would renumber the drawer during the #about deck flip.
- `RING_CARD_RENDER_ORDERS.figure` = 0.105, inside the card's span (the
  ring-math test's nesting assertion holds).
- `ServicesRingHitAreas` gained `plates` so the lab's accessible names follow
  the card the ring is baking.
- Both production smokes (`services-ring-smoke`, `services-ring-mobile-smoke`)
  must pass UNTOUCHED; that is the proof.

## What the capture found

`node scripts/capture-services-figures.mjs` — one still per card per material
per theme at 1600×1000 and the owner's 1920×1247, a contact sheet per theme,
and `stills/report.json` with each figure's ink coverage of the poster band.

⚠ **The lab's own park math never settled.** `(i + 1.5) / 5` was documented as
"the centre of beat i"; with `RING_TRAVEL_FRAC` at 0.85 those values sit
0.68–0.95 of the way through a quarter-turn, and every still this lab shot was
a card still turning — `activeServiceForProgress` rounds, so the readout
agreed. `ringParkProgress(i)` in `ringMath.ts` is the settled park now
(`tests/lib/ring-park.test.ts`), and the shell, its chips and the capture's
`?svc=` all read it.

## Questions for the owner's read

1. Which material — and is the answer the same on all four cards, or does one
   card want a different one? (A set is one material.)
2. The raster letters in dawn ink with gold marks (ADR-086's law); an all-gold
   raster is one palette call away. Same question for the volume, which now
   follows the same law.
3. The volume's depth (`VOLUME_DEPTH` 0.55 of R) is its one dial: a full
   sphere protrudes further and reads more as an object in front of the card.
4. The home session's copy, and whether "Home session" is the chip.
5. The mesh's open nodes: is the person-led claim worth carrying on this card
   now that Advisory is inside it, or does the mesh close?

## Not in this pass

Promotion of the re-cut copy into `servicePlateData.ts` / `serviceData.ts`
(and with it the a11y-name pins, designations, scan notes, the rail verb),
the strategy skill's own record of the fold, the mobile plate's photo for the
home session (none exists; the schematic fallback renders), a hover "resolve"
for the raster on the existing damped veil channel.
