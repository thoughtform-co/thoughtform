# ADR-112 — The portrait raster, and the four services

- **Status:** Accepted (2026-09-19, owner — on reading the lab row live:
  "ok love it deploy this to our homepage and then push to main"; asked
  whether "this" includes the re-cut four, he chose the row as seen).
- **Supersedes on the FACE:** [ADR-086](086-services-card-carries-the-work.md)
  — the card carries the photograph again, as glyphs at rest and as the
  photograph proper under the hand. ADR-086's title datum (measured off the
  chit), its `faceUsesPhoto` predicate and its finding that three things key
  off the photograph all still bind; its poster band does not (the face is a
  `full` band now).
- **Extends on COPY:** [ADR-111](111-the-embedded-card-carries-the-configuration.md)
  — the Embedded card keeps its title and its configuration; the leadership
  altitude (Strategic Advisory's standing read) enters it as the third
  workstream's own bullet, and the chip is EMBEDDED.
- **Related:** [ADR-029](029-services-card-ring.md) (the ring),
  [ADR-050](050-services-card-face.md) (the tight face; Update 3's veil is the
  plane the reveal rides), [ADR-108](108-the-ring-on-phones.md) /
  [ADR-110](110-the-card-turns-over.md) (the phone ring takes the rest bake),
  [ADR-021](021-motion-law.md) (the reveal is pointer-driven and damped, the
  veil resolve's own class of motion).

## What the owner asked, in order

Four lab rounds in one day at `/test/services-card-face-lab`, each answered
with a sheet and each answered by him with the next ask:

1. "Holographic ASCII … explore some different directions" — three materials
   (a character raster, a three.js cloud, an SVG wire) on ONE figure record,
   with two rulings taken first: the merged offer is named **EMBEDDED**, and
   the subject stays the estate.
2. "Variants of the raster … different shapes … volumetric, so no lines" —
   shaded bodies, ray-marched per cell.
3. "Continue with volume, where they protrude … only from the front, like a
   hologram … try our Tensor Gold" — the lattice, a body voxelised on the
   raster's grid and thrown up in front of the face.
4. "I don't think I want the extrusion effect. What I actually want is a
   variant of raster that fills in most of the card but doesn't make the title
   and the bottom paragraph illegible … when you hover over it, it reveals the
   photos. In v0 shipped, we had photos of myself. Maybe we can restore that,
   but only have them revealed when you hover over it, with some sort of
   pixelated effect." Asked what the rest raster is made of: **the
   photograph itself, as glyphs.**

He read round four's row live and promoted it. This record is that
promotion: the face, and the four services the row was baked on.

## The face: `raster-photo`

**At rest the whole card is the raster's own character matrix lettering the
portrait.** `cardViz.applyGlyphRaster` re-letters the toned plate (the
photograph after the gold-plate / parchment-print LUT) on the raster's
18px PT Mono grid, 78 × 76 cells: one glyph per cell off the shaded ramp
`· : - = + * # % @` by the cell's mean luminance, alpha by the same, every
third row losing light (the raster's scan cadence). Three things make it
read as a portrait and not a texture:

- **Luminance is NORMALISED to the plate's own range** (5th to 98th
  percentile of the cells) before the ramp. The gold plate crushes the blacks
  and the parchment print lifts them to 30; one fixed gamma cannot serve
  both, and without the normalisation the dark theme spent two rungs of the
  ramp on nothing.
- **A PRINT INVERTS.** The first light still lettered a NEGATIVE — the figure
  a void inside a lettered background — because the parchment LUT puts the
  paper at the top of the range. `FacePalette.print` is the flag: on
  parchment the raster letters ink where the photograph is dark, on the plate
  light where it is bright.
- **The two type bands are QUIET.** `RASTER_QUIET_HEAD` 300 / `RASTER_QUIET_FOOT`
  1060 (bake px), eased 40px into the field, hold the glyphs at a quarter of
  their alpha under the title (cap top 140, second line to 258) and the
  paragraph (four lines 1113 … 1296), with the `full` band's scrims stacked on
  top: ≈ 13 % at the title's baseline, ≈ 4 % under the paragraph. The type
  draws last, exactly as on every photographed face.

**On hover the photograph resolves out of it**, on the ring's existing VEIL
PLANE. ADR-050 Update 3 made that plane the ring's "hover resolves the
photograph" — a per-card plane 0.002 over the face whose level damps toward
a residue under the pointer. This keeps the contract in its verb and inverts
its mechanism: the FACE is the screen, and the plane carries the photograph.
Its material is a ShaderMaterial (`hologram/cardReveal.ts`) over the same
composition baked WITHOUT the glyph pass (`bakeCardFace`'s `photoOnly` — an
OPTION, never a phantom variant, which `isTightLayout`, `faceUsesPhoto`,
`slabGeometry`, `bakeCardBack` and `bakePortraitBack` would all have
accepted). Cells of a FIXED 42 × 68 grid pop in as a damped level rises
(`REVEAL_DAMP_RATE` 4.5/s — ≈ 0.49 at 150ms, ≈ 0.98 at 900ms; slower than the
veil's 7 so the mosaic is seen refining), the mosaic under them refining from
24 × 39 to full resolution, and the two type bands cross-fade crisp on the
same level — so the title and the paragraph, baked identically into both
textures, never move through the transition. One subject at two densities; a
resolve, not a swap. Pointer-driven and damped: the veil resolve's and the
hover tilt's own class under ADR-021, no wall clock.

Every number lives in `lib/services-ring/reveal.ts` (three-free), read by the
bake, the shader and `tests/lib/services-ring-reveal.test.ts`; the shader
mirrors the two ramps literally (GLSL's `smoothstep`, NOT `ringMath`'s
`smootherstep`, the Perlin quintic).

### Three traps, each found by a still or a gate

- ⚠ **`bakeCardFace`'s `drawn` predicate had to become `!faceUsesPhoto()`.**
  As the two-term expansion it was (`viz !== "photo" && viz !== "halftone"`),
  a third photographed viz was "drawn", and `drawCardViz` falls through
  `LANGUAGES[…] ?? constellation` — the constellation baked under nothing,
  silently. Same truth table for every shipped face.
- ⚠ **The mosaic samples with `texture2DGradEXT` and the ORIGINAL uv's
  derivatives.** A `floor`'s derivatives are zero inside a cell and enormous
  at its edges; under mips and anisotropy 8 the GPU picks a coarse mip along
  every cell border and draws a blurred hairline on the grid. (three r170
  defines `texture2DGradEXT` as `textureGrad` for every ShaderMaterial.)
- ⚠ **`.opacity` on a ShaderMaterial is a silent no-op**, so the frame loop's
  branch keys on the VARIANT (a `revealMaterialsRef` that is null elsewhere),
  never on the material's type, and writes `uReveal` / `uOpacity` through
  `driveRevealMaterial` in the material's own module — which is also what
  keeps the repo's lint budget at exactly 337: the compiler rule charges one
  warning per ref-derived local a property is written on.

### What is untouched

`DECK_INTRA_ORDERS`, the veil mesh, its renderOrder, z and child index, the
deck rebase, `flipBack`, every ring constant, and `CorridorArmillary`'s
mounts (one word each). The shipped v8 face was pixel-diffed before and after
the round-four code landed: under 0.8 % of pixels at a step of at most 12,
every one of them on the scroll-clocked backdrop (a diff mask showed the
orbit's ticks and the mark's shell, nothing on the card).

## The four services

The lab baked the row on the RE-CUT four, and the row is what he approved:

| slot           | service          | what changed                                                                                                                                                                                                                    |
| -------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `keynote`      | Keynote          | verbatim                                                                                                                                                                                                                        |
| `workshop`     | Workshop         | verbatim                                                                                                                                                                                                                        |
| `embedded`     | **Embedded**     | Strategic Advisory FOLDED IN: the chip is the doctrine's own flagship word, ADR-111's title stays, the leadership altitude enters through the third bullet ("a standing session with leadership") and the includes              |
| `guided-build` | **Home session** | NEW on the site: six to eight people at the owner's table in Antwerp for one morning, individually registered, the argument in full and then the skill by hand. `Reserve a seat`. Doctrine: thoughtform-strategy 05-engagements |

- ⚠ **THE IDS ARE FIXED SPATIAL SLOTS.** `guided-build` hosting the home
  session is the same documented misnomer that hosted Advisory; the rack
  position, the anchor pick, the designation set and the scan note all hang
  off the key. Labels travel with the service; spatial params stay slot-tuned.
- ⚠ **NO PRICE, NO DIGIT ON THE HOME SESSION.** It is the one service ops
  prices per seat and the card law is that money stays in the proposal;
  digits are banned on its copy outright (`tests/lib/services-copy.test.ts`)
  so a rate cannot creep in as "€450". The feed label's ordinal is the slot's
  mobile chrome and is the one string let through.
- **The fit was solved before the strings were written** and is asserted on
  production now: every record through `backFaceLayout` (title ≤ 2 lines,
  every line inside its measure, content above the CTA), every lede under
  `LEDE_MAX_CH`, the copy law on every string.
- **The photograph** on the fourth slot is the slot's own asset (`strategic`,
  the one shot at a table) with an alt that says what the picture shows.
- The designations become the table (AT THE TABLE · THE ARGUMENT · THE SKILL ·
  NAVIGATE), the scan note the session; the smoke's role-name pins moved
  with the chips. The lab's `serviceRecut` module DISSOLVED into the two
  production modules — no alias, because a compatibility alias keeps the
  call sites compiling and quietly empties what they test.

## The phone

Both mounts take the face (one prop, `CorridorArmillary`). The phone has no
hover, so it takes the REST BAKE alone — the ASCII portrait at the half-bake,
no reveal; the tap still turns the card over to its spec (ADR-110). Two
named costs, for the owner's device read: the phone ring FETCHES the four
portraits now (342 kB — ADR-109 had counted their absence as a virtue of the
band), and the phone face is unread on a device. Keeping the phone on `card`
was considered and refused: the constellation's `guided-build` drawing is the
SURVEY, which MEANS Advisory's person-led work, under a card that is now the
Home session.

⚠ **THE FIRST PHONE STILL FOUND TWO THINGS NO DESKTOP STILL COULD.** The
card's left third was the raster and the rest the photograph, split on a hard
line: `bakeCardFace`'s photo branch declared its cover fit as `scale`,
SHADOWING the function's own `scale` parameter (the phone's 0.5 bake), so the
raster received the cover fit (1.0), wiped and lettered the top-left QUARTER
of the half-size canvas and left the plate photograph on the rest. Months old
and consequence-free until a callee needed the parameter; renamed `fit`. And
with the reveal off, the veil plane fell back to the dot-matrix fog strip,
`visible` because the face is a photographed one — a second screen over the
glyphs; the fallback veil is hidden on `raster-photo` now, so the phone's face
IS the rest bake alone. **A bake that scales is verified at the scale it
ships at**; `scripts/capture-services-mobile.mjs --theme dark` is the still.

## Guards

`tests/lib/services-copy.test.ts` (the four records: ids, the fold, the
session, no digit, no trace of Advisory, the back's fit, the lede ceiling, the
copy law), `tests/lib/services-ring-reveal.test.ts` (the quiet zones clear the
type, the ramps, the bands in UV), `tests/lib/service-scan-notes.test.ts`,
`tests/lib/services-ring-mobile-gate.test.ts` (the back's fit, a second time),
`services-ring-smoke` (the role names, the ring's clock) and
`services-ring-mobile-smoke` — run serially: the two phone projects in
parallel against one dev server fail nine and pass nine on their own.

## Left open

- The rest raster's density in dark: 15 to 41 % band coverage, the scan
  cadence prominent on a portrait. Dials: the base alpha (`0.3 + 0.7·L`), the
  cadence (every third row × 0.55), the ink (the cell's toned colour is one
  line away and makes the reveal continuous in hue).
- The phone's face and its 342 kB, on a device.
- The strategy skill's own record of the fold (another repo).
- ADR-086's `poster` band, its constellation drawing and the `card` face stay
  in the lab as V8, one word away.
