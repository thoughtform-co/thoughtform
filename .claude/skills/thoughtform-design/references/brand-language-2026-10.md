# The expanded brand language (October 2026)

Between 5 and 15 October the house language grew past rails and colours. The owner, 2026-10-16:
"I think we are finally landing on an expansion of our brand language. We have our rail and our
colours, but also the frames that we are building … The X-Bionic page and the proof cards …
I always liked our particle system for our logo, our sphere in the arc, and the fact that we
managed to expand it and make it part of our proposition with Navigate, Encode, Build."

This file holds the expansion as one system: six parts, each with its law, its owner quote and
the code that is the source. Values stay in the code and the tokens; this file is the judgment.

| Part | The law in one line | Source |
|---|---|---|
| 1 · Rails and tokens | Unchanged: the shell, the void, dawn, one gold, green for people | SKILL.md Layers 1–2, `tokens.md` |
| 2 · Frames | Straight corners, one notch, hairlines; rings are instruments, connectors are straight | `components/xb-proposal/kit/`, `components/lattice/` |
| 3 · Particles | The brandmark's dots are the material; one object travels between sections | `app/(internal)/test/proposal-swarm/engine/`, `lib/brandmark/` |
| 4 · Machined objects | When a thing must read as real, it is built from solids in the stage's camera | `components/arcs/figures/foundation/brainIso.ts`, `isoKit.ts` |
| 5 · Proof cards | Three registers and no fourth: claim, field, chrome | `components/landing/home-v2/services/proof-stack/ProofCard.tsx` |
| 6 · The method | Lab first, judged on stills; name the camera; use what the owner names | `docs/design/machine-brain/README.md` |

## 1 · Rails and tokens

Nothing here changed, and everything below sits inside it: the left and right rails, the
corner anchors, the void ground, dawn ink, gold, green. One clarification of roles, from the
kit's own header and settled across the proposal work:

- **Gold is the one lit thing**: the layer and what leaves it, the data, the part the reader
  should watch. It is wayfinding in the old sense ("you are here") because it marks where to
  look. Never a border on a card ("really not beautiful … just make it subtle like the other
  cards"); small labels with gold edges and text are fine.
- **Green is a person, and nothing else.** A seat, an owner, the people's side of a split.
- **Dawn is everything that only runs**: structure, hairlines, connectors.
- **A passed check is ink**, never green (ADR-100).

## 2 · Frames

The owner on the references (Unsiloed, Lighthouse, Griffin): "Note that they also use like
straight corners, they don't have like um rounded corners, which I love. And you could say like
hey we have like a notch, which is fine, but fundamentally we still use straight corners." And
on a four-notch frame: "it feels like a sort of post stamp".

- **Straight corners, one notch.** A frame is square with a single top-right notch (or the
  lattice's TR + BL pair, ADR-149). Never four, never rounded, never a doodle arrow.
- **Hairlines carry the hierarchy**: seam (`--xb-line-2`) divides a region from its neighbour,
  rule (`--xb-line`) rules within one. One device pixel at every size
  (`vector-effect: non-scaling-stroke`).
- **The double hairline** (`/test/card-skins` 6, after Hex's Tensorlake panels): a neutral
  hairline with a second one 4px inside it; no colour on the edges, no wash on the band
  (`components/arcs/job-stack.css`).
- **Gold crosses on a visual's corners** (3C) in place of corner ticks; **a result is a Tensor
  Gold band** (`--arc-gold-wash`), never a gold ring.
- **Rings are instruments, connectors are straight** (owner, 2026-10-12). A precise circle is
  a dial; everything that joins or holds is a level run, a plumb run, a 45° cut or a square
  corner. The one exception is a bearing, a straight line to a dial's centre at any angle.
  `kit/trace.ts` emits no curve and `tests/lib/proposal-kit.test.ts` holds that.
- **The kit** (`components/xb-proposal/kit/`): `kit-frame`, `kit-bracket`, `kit-cross`,
  `kit-diamond` (green for a person, open for a place), `kit-tap`, `kit-junction`, `kit-tag`,
  `kit-key`; one dash ladder, fine `1 5` · base `2 4` · wide `2 8`.
- **Headings live in frames, not over them** ("I find the font sizes of the headers too
  dominant. I really want them to be in frames").
- **No horizontal divider across the page**: it would cut the left and right rails.

## 3 · Particles

"our leitmotif is the particle system diagrams" (ADR-153). "I don't want boring-ass, just flat
icons. I would really want to leverage our diagrams, our particle system" (ADR-155). "I really
like the dots … This feels a bit more like particles, where one transitions to the other, like
nanobots" (the swarm brief).

- **The brandmark is the source.** Every field is sampled from it or lives on its lattice:
  `lib/brandmark/{sampleShape,sampleBrandmarkParticles,sampleBrandmarkPixels,brandmarkPaths}.ts`,
  the talk's ambient field (`TalkMarkField.tsx`), the services centrepiece.
- **The swarm** (`/test/proposal-swarm`, S4·E "clear", picked from five directions in
  `/test/stack-forms`): one dot pool on one sticky canvas over several sections; a dot is the
  same dot from the opening to the last team. The engine is plain arithmetic over typed arrays
  (`engine/`): only `measure.ts` reads the page and only `paint.ts` touches the canvas.
- **One object travels.** The stack is the artifact; between sections it leaves plate by plate,
  re-seats, turns and gathers. Nothing new is invented per section.
- **The mark on the layer is engraved**, not stitched ("It looks like something a child made,
  like some crocheting … It should look engraved"): `engine/mark.ts`, `?mark=engrave`.
- **Motion**: vertical, never warped or spun ("I don't want it to look flat and 2D or to
  rotate, morph, or warp too much"); in a talk, nothing slides in, statements glitch in where
  they stand (ADR-156 U3).
- **Counts are drawn, not lettered.** In a return, gold grain is what runs and a green
  diamond is a person (`components/arcs/crewParticles.ts`); a field draws exactly its count.
- **Not a decoration**: S4 read "a bit too much like a Christmas decoration" until the field
  behind it, the leaders and the counts were removed. Less, on the same pixels.

## 4 · Machined objects (the anatomy method)

When an object must read as a real thing (the model, an engine, a layer you plug in), it is
built from solids, not drawn as an outline. The method is the anatomy skill
(`~/.claude/skills/anatomy`), whose kit is vendored as
`components/arcs/figures/foundation/isoKit.ts`. The worked example is the machine brain
(`docs/design/machine-brain/README.md`).

- **One camera per stage.** Draw the object in the stage's projection. The stack of cards
  (`scene.ts`) and the swarm are a true isometric (30° axes); the kit at azimuth 45° and
  elevation 35.264° is exactly that camera. Square the object to the stage's world axes, not
  to the viewer: squared to the viewer it reads flat even in a perfect camera.
- **A renderer is not depth.** A face-on three.js glass brain read flat twice; the same object
  as kit solids in the stage's camera read as real at once.
- **Solids, not wireframes**: every part filled, four side tones and a lighter top, painted
  back to front and bottom to top. One lit part (gold); everything else ink.
- **Organic form out of machined parts**: a soft shape is a stack of extruded contour plates
  (the brain's terraces fold like gyri because each plate's outline drifts with height).
- **No ornament that is not a part.** Lens rings in two pods read as googly eyes and went; a
  mask came back as a faceplate with thickness, rim, rivets and slots.
- **The geometry module owns the anchors.** It exports ports, flanks and its box; every cord
  and leader reads them, so moving the object moves everything tied to it.
- **Into a page through the existing canvas**: rasterise the kit's SVG once per pose and theme
  (tokens resolved into its `<style>`) and paint it where the old drawing was, so the overlays
  keep their order.

## 5 · Proof cards

`ProofCard.tsx`: three registers and no fourth. **Claim** (the arc's line, in the display face),
**field** (the record's own visual, bleeding to the right and bottom edges), **chrome** (the
head strip: the client and the file this card is of; the peek band that still reads when a
later card covers it). The stack card on the proposal adds the double hairline, the gold
crosses and the result band (part 2). Rules: `.claude/rules/proof.md`.

## 6 · The method

- **Lab first** (CLAUDE.md, ruled 2026-10-12): a new composition starts from the brief and the
  references in a self-contained lab under `app/(internal)/test/<name>/`; this skill is the
  vocabulary used to encode the pick, not a template to start from.
- **Several directions, the owner picks**; judged on stills at his viewport (1440 × 820 and
  1920 × 1080), both themes, before anything is ported.
- **Name the camera before drawing**, and keep it for the whole stage.
- **When the owner names a skill or a reference, that is the brief.** The brain cost a round
  because the anatomy skill was named and not used.
- **The references are a North Star, never a template**: "a brand system … should be able to
  encode, um, like whatever source of inspiration". Unsiloed is the North Star for composition
  (the sticky diagram while the copy scrolls); decodes in `inspiration-extractions.md`.

## Open (not yet settled in code)

- Three isometric bases are live: true isometric (`scene.ts`, `xb-proposal/iso.ts`, the swarm,
  `brainIso.ts`), `ISO_BASIS_STAGE` at 22° (ADR-130 framing beats, the ADR-155 stack, the holo
  stage) and the cabinet oblique fallback. New stage work takes the true isometric; see
  `isometric-wireframe-grammar.md`.
- `.xb-frame`'s inner leg is 0.42px where ADR-149 makes 0.586 the one constant; the kit's
  tokens (five mono trackings, two chamfer recipes, a hard-coded green) await the consolidation
  `docs/design/proposal-kit/README.md` asked for.
