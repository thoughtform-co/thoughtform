# Services figures — four services, four rounds (2026-09-19)

The `#services` cards' visuals, explored in four lab rounds in one day on the
re-cut four services. ⚠ **ROUND FOUR WON AND IS LIVE** — the portrait raster
(`?v=portrait`) is the homepage's face and the re-cut four are production's
record since [ADR-112](../../../sentinel/decisions/112-the-portrait-raster-and-the-four-services.md)
(owner: "ok love it deploy this to our homepage"). The earlier rounds stay in
the lab as the comparison; every row now bakes production's copy (the lab's
`serviceRecut` module dissolved into `servicePlateData` / `serviceData`).

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

## Round two: the raster's shape families (owner, same day)

On reading the first sheet: "make some variants of the raster … find
different shapes … like volumetric shape, so no lines as in workshop." Three
more rows ride one new renderer, `rasterVolume` in `cardViz.ts`: a ray march
per cell over an implicit body in the band's unit space, one light from the
upper left, an ambient floor and a rim term (the first cut lit by Lambert
alone and every unlit half vanished; a sphere read as a crescent), depth
fade, then a nine-step glyph ramp `· : - = + * # % @`. No line anywhere;
every card is a solid that reads through its shading.

```
http://localhost:3003/test/services-card-face-lab?v=bodies
http://localhost:3003/test/services-card-face-lab?v=solids
http://localhost:3003/test/services-card-face-lab?v=knots
```

| row         | the four bodies                                                                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2 · Bodies | the record as fused volumes (metaballs): the radiant's source a large ball with its room as small ones; the route a worm of fused balls along the walk; the mesh's reached nodes one lumpy body with the person-led nodes as small balls touching nothing; the table eight balls fused into a ring. The marks are the record's own |
| R3 · Solids | a sphere under one light (keynote) · a torus (workshop) · the house's chamfered slab, TR + BL, three-quarters on (embedded) · eight spheres fused into a ring (home session)                                                                                                                                                       |
| R4 · Knots  | torus knots (1,3) · (2,3) · (3,4) · (2,7) as one thick tube; the loop is the house's canon, the crossings the variable                                                                                                                                                                                                             |

The family's sheet is `stills/1600x1000/contact-raster-dark.png` (the first
raster on top for reference). Coverage of the band runs 0.10–0.25 across the
twelve, against 0.04–0.10 for the line figures.

## Round three: the lattice families (owner, same day)

On reading the raster's bodies: "continue a bit with volume, where they
protrude a bit … use a bit of the raster and have them protrude … not from
the back of the card, only from the front, like some sort of hologram … the
original holograms folder … Dendrite is also quite interesting … try
different shapes and also try a bit with our Tensor Gold color."

One material, `buildLatticeGeometry` in `cardFigureVolume.ts`: a body from
`lib/services-ring/figureFields.ts` (the shape library the 2D raster now
reads too, so one body renders in either material) voxelised on the raster's
own cell grid, the surface shell kept, each cell a glyph sprite off the
shaded ramp, sorted far to near and composited without a depth write. The
body's back is seated on the face plane and all of it protrudes toward the
viewer; nothing goes through the card. Head-on it is the raster; the ring's
turn and the rig's pointer-look open the depth. The rows default to Tensor
Gold (`#b08b42`, the mark's own; `#caa554` on parchment) and the console's
INK chips flip any of them to the face's dawn.

```
http://localhost:3003/test/services-card-face-lab?v=lattice
http://localhost:3003/test/services-card-face-lab?v=dendrite3d
http://localhost:3003/test/services-card-face-lab?v=relief
http://localhost:3003/test/services-card-face-lab?v=knots3d
```

| row           | the four bodies                                                                                                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V2 · Lattice  | the raster's solids in relief: the sphere, the torus, the chamfered slab, the ring of eight                                                                                                                                                                                    |
| V3 · Dendrite | V5's growth rule grown OUT of the card: every root on the face, every branch leaning toward the viewer, the tips in gold. Keynote fans six primaries; workshop is one vine with side buds (thin by rule); embedded eight primaries, dense; home session eight shrubs on a ring |
| V4 · Relief   | a heightfield on the card, the terrain reference: one peak with radial ridges · a winding ridge rising toward its exit · a plateau with three mounds where the seats sit · a crater rim around a flat floor                                                                    |
| V5 · Knots    | the raster's torus knots as lattices, the row that most needs the depth                                                                                                                                                                                                        |

Sheets: `stills/1600x1000/contact-lattice-{dark,light}.png` and the same at
`1920x1247`. The lattice costs a bake-time march over an 46³ grid per card
(the knot and the dendrite fields are the slow ones, a few hundred
milliseconds each on the main thread, once); nothing per frame.

## Round four: the portrait raster, and the hover that resolves it (owner, same day)

On reading the lattice: "I don't think I want the extrusion effect. What I
actually want is a variant of raster that fills in most of the card but
doesn't make the title and the bottom paragraph illegible … The cool thing is
that when you hover over it, it reveals the photos. In v0 shipped, we had
photos of myself. Maybe we can restore that, but only have them revealed when
you hover over it, with some sort of pixelated effect." Asked what the rest
raster is made of, he chose **the photograph itself, as glyphs**.

```
http://localhost:3003/test/services-card-face-lab?v=portrait
```

Hover the front card. ⚠ **This row re-opens ADR-086's photo removal**, on one
lab row, by his word; the defence is the reference board's own second move
(V3 Halftone's reading — the person stays as MATERIAL, the photograph proper
only under the hand). Desktop only: the phone has no hover and keeps the rest
bake.

**The rest face** (`raster-photo`, `cardViz.applyGlyphRaster`). The whole
card is the raster's own character matrix lettering the portrait — 78 × 76 PT
Mono cells on the 18px pitch, each a glyph off the shaded ramp by the toned
plate's mean luminance under it, every third row losing light. Luminance is
NORMALISED to the plate's own 5th–98th percentile before the ramp (the gold
plate crushes the blacks, the parchment print lifts them to 30; one gamma
cannot serve both), cells under 0.06 letter nothing, and the two TYPE BANDS
hold the glyphs at a quarter of their alpha (`RASTER_QUIET_HEAD` 300 /
`RASTER_QUIET_FOOT` 1060, eased 40px into the field) with the `full` band's
scrims stacked on top — ≈ 13 % at the title's baseline, ≈ 4 % under the
paragraph. ⚠ **A PRINT INVERTS.** The first light still lettered a NEGATIVE
(the figure a void inside a lettered background) because the parchment LUT
puts the paper at the top of the range; `FacePalette.print` is the flag, and
the raster letters ink where the photograph is dark on parchment and light
where it is bright on the plate.

**The reveal** (`hologram/cardReveal.ts`, on the ring's existing VEIL PLANE).
The veil plane already IS the ring's "hover resolves the photograph" (ADR-050
U3); this row keeps that contract in its verb and inverts its mechanism — the
face is the screen, the plane carries the photograph: the same composition
baked WITHOUT the glyph pass (`bakeCardFace`'s `photoOnly`, an option and never
a phantom variant), so the title and the paragraph land on the same pixels in
both textures and never move. A ShaderMaterial: cells of a FIXED 42 × 68 grid
pop in as a damped level rises (`REVEAL_DAMP_RATE` 4.5 — ≈ 0.49 at 150ms,
≈ 0.98 at 900ms; the veil's own class of motion under ADR-021), the mosaic
under them refining from 24 × 39 to full resolution, the type bands
cross-fading crisp on the same clock. ⚠ The mosaic samples with
`texture2DGradEXT` and the ORIGINAL uv's derivatives — a `floor`'s derivatives
are zero inside a cell and enormous at its edges, and under mips + anisotropy
the GPU draws a blurred hairline on every cell border otherwise. Every number
is in `lib/services-ring/reveal.ts` (three-free), pinned by
`tests/lib/services-ring-reveal.test.ts`; the shader mirrors its two ramps
literally (GLSL's `smoothstep`, NOT `ringMath.smootherstep`).

Sheets: `stills/{1600x1000,1920x1247}/contact-portrait-{dark,light}.png` —
states down (rest · hover-mid · hover), cards across; the capture's `--hover`.
The home session takes the `strategic` asset (the one shot at a table) as the
lab's stand-in.

Dials, if the read wants them: the rest raster's base alpha (`0.3 + 0.7·L` —
the dark face reads dim at 15–41 % band coverage, the scan cadence prominent
on a portrait), the scan cadence itself (every third row × 0.55, the raster's
law), and the ink (the house's reading ink; the cell's toned colour is one
line away and makes the reveal continuous in hue).

## The seams that keep production byte-identical

- `ServicesCardRing` gained two additive props: `plates` (default
  `SERVICE_PLATES`) and `figure` (default `"off"`).
- Round four's paths are all keyed on `faceVariant === "raster-photo"`: the
  bake branch, the reveal bake (no setState otherwise), the veil-material swap
  (a stable `null` dep in production), the frame loop's write (through a ref,
  keyed on the variant — `.opacity` on a ShaderMaterial is a silent no-op).
  `bakeCardFace`'s `drawn` is `!faceUsesPhoto(variant)` now, the same truth
  table for every shipped face; as the two-term expansion it was, a third
  photographed viz would have baked the constellation under nothing.
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
6. The portrait raster: is the person back on the card (ADR-086 reversed on
   the desktop), and at what density at rest — dim and processed as shot, or
   louder?

## Promoted (ADR-112, same day)

The re-cut copy is in `servicePlateData.ts` / `serviceData.ts` with the
designations, the scan note, the rail verb and the smoke's role-name pins
moved with it; the home session carries the slot's own `strategic`
photograph; both `CorridorArmillary` mounts pass `raster-photo`. Still open:
the strategy skill's own record of the fold (another repo), the phone's face
on a device (it takes the rest bake and fetches the four portraits), and the
dials above.
