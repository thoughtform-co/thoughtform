# Isometric wireframe grammar

> **This is the STATIC half of the register.** When the drawing has three
> quantities, a floor and a record worth turning, it can also go live as a
> WebGL object — and the flat drawing below is then the fallback every reader
> without GL gets, including the printed handout. The two must read as ONE
> picture: [hologram-stage-grammar.md](hologram-stage-grammar.md).

The house's third drawing register, beside the celestial connector and the ring
dial. Reach for it when a record has **height, layers or depth** — something
stands on something, something is made of stacked parts, something runs longer
than something else. Born on the Plopsa workshop's framing beats
([ADR-130 U1](../../../../sentinel/decisions/130-the-workshop-frames-the-loop.md),
owner 2026-09-27: _"i want isometric, 3D visualizations, but true to the
retrofuturistic interfaces / holograms from our thoughtform brandworld"_).

The references are 1980s vector and CAD displays — an exploded MEP floorplan,
the CERN L3 event display — a Tron grid plane carrying wireframe machines, an
isometric terrain relief, a magenta orbit HUD. What they share: **line work
only, a stated datum, hidden edges drawn, and nothing lettered on a face.**

## When to reach for it

| the record has                                  | draw it                       |
| ----------------------------------------------- | ----------------------------- |
| height, layers, depth, an assembly, a relief    | **this**                      |
| a cycle, a proportion, a dial, a rim graduation | the ring register (ADR-106)   |
| a relation map, orbits, a constellation         | the celestial grammar         |
| a table of facts with no quantity               | a readout — no drawing at all |

A drawing that carries no third quantity does not need a third dimension; an
axonometric spent on two numbers is decoration, and the surface has deleted
consoles, feet and designators for exactly that.

## The projection

> ⚠ **ADR-130 U4 (2026-09-28): the framing beats use `ISO_BASIS_STAGE`**, the
> Moira workshop's symmetric parallel view: `a` up-right and `b` up-left, both
> at 22 degrees, the floor a rhombus centred on its front corner, a larger
> `a + b` FARTHER (paint descending), the hidden vertex the far-back-bottom
> one, faces opaque and shaded top lightest, no chamfer on a projected face.
> Crops are derived (`framing/floor.ts`), and an axis word may run ALONG its
> floor edge (rotated +/-22 degrees, a DOM span, tested as a rectangle). The
> cabinet oblique below is the U1 record.

**One basis per surface.** Mixing two is what broke the Intelligence Map
prototype: a drawing whose basis differs from its neighbour's reads as a
rendering fault, not as a second point of view.

- **CABINET OBLIQUE** (`ISO_BASIS_CABINET` — `a` = `[1, 0]`, `b` =
  `[0.433, −0.25]`, `z` = `[0, −1]`) is the default. `a` is a true horizontal
  and `z` a true vertical, so a time or a magnitude scale stays a readable
  baseline; depth is foreshortened to 0.5 at 30°.
- **2:1** (`ISO_BASIS_2TO1`, byte-equal to the map's own `iso()`) is for a
  COMPACT object that can pay for depth. ⚠ Under 2:1 a depth of `d` costs
  `0.5·d` of HEIGHT — on any beat capped in `svh` that is a third of the crop
  spent on nothing.

⚠ **COPY THE PROJECTION, NEVER IMPORT IT ACROSS A SURFACE** (ADR-106). It is
two lines of arithmetic; an import drags another surface's module graph onto
this route.

⚠ **EVERY POINT COMES BACK IN ABSOLUTE UNITS. NO `transform` ON ANY SVG NODE** —
every overlap walk in this house compares `getBBox`, which is blind to an
element's own transform.

## The line ladder

Quietest first. One ladder for every drawing on a surface, so a beat cannot
invent a fifth weight.

| rung                | what it is                           | recipe                                |
| ------------------- | ------------------------------------ | ------------------------------------- |
| datum               | the grid plane the machine stands on | dashed `2 4`, the `--*-rule` rung     |
| hidden              | the edges the solid is in front of   | dashed `3 4`, one rung under the edge |
| tie / leader / drop | the drawing's own wiring             | 1px solid, the quietest ink           |
| edge / face         | a silhouette                         | 1.4px, miter joins                    |
| run                 | the ONE line that draws on           | 1.6px, the lit colour                 |

⚠ **THE DATUM IS THE ORDINARY RULE RUNG, NOT THE DASH RUNG.** A dashed line
already loses half its ink to its gaps; at a dash-rung alpha the plane measures
as nothing and the drawing reads as boxes floating in void — the reference's
exact opposite.

⚠ **HIDDEN EDGES ARE DRAWN.** A box whose far edges are omitted is a flat
hexagon; the dashes are what make it a machine. They are exactly the three
edges meeting the far-bottom vertex — the one corner whose every adjoining face
points away. Arithmetic, never a heuristic.

## Colour: three roles, no more

- **gold** = the record, the lit object, the one thing the beat is about.
  **One per drawing.** A second gold rung to say "and this relates to that"
  breaks the law to say something a reader across a room will never see.
- **dawn / the ink ramp** = every structure: the datum, the edges, the ties.
- **green** = the human, and nothing else (ADR-100).

Every colour aliases a rung the theme's light foot already re-derives. ⚠ An
alpha inverts its own meaning across the flip (ADR-058), so a colour that is an
alpha of its own — a wash, a mixed gold — is re-derived by hand in light.

## Labels: DOM, on fractions, with leaders

⚠ **NOTHING IS EVER LETTERED ON A FACE.** This is the register's one hard law,
and it is written from a shipped defect: the Intelligence Map city printed its
district plaques **through their own plates 10–13 times per sheet, at every
viewport, in both themes, with every containment guard green**. A label on a 30°
face has no baseline, its seat depends on the whole scene, and depth eats the
width it needs.

The closure is three parts, and all three are needed:

1. **The SVG letters nothing.** Each layout emits a seat as a FRACTION of the
   crop; the renderer puts a DOM span there (`--ax` / `--at`), and a one-elbow
   leader joins the span to the thing it names. A span seated level with its
   anchor gets a single straight run.
2. **A pairwise collision walk is a build gate.** The layout declares what it
   names; the unit test walks every pair of boxes. ⚠ **Carry a NEGATIVE case** —
   two labels at one seat must fail it. A guard that has never failed is a guard
   nobody has checked, which is precisely how the city's walk stayed green.
3. **A live pixel walk at every reference viewport.** The unit arithmetic uses
   an honest ESTIMATE of the rendered type (the spans' size is a `clamp()`), so
   it catches a seating collision; only the browser catches a CSS change.
   Neither is sufficient alone.

⚠ **THE LABELS SIZE THE DRAWING, NOT THE OTHER WAY ROUND.** Solve the label
column first — a 33-character note needs ~165px at the rendered type — and give
the figure what is left. Sizing the figure first and squeezing the words after
is how the plaques happened.

⚠ **LETTER A REPEATED THING ONCE.** Eight identical captions along a lane is the
plaque defect in a new costume; the eight marks already say how often.

## Order, corners, motion

- **PAINT ORDER IS DEPTH ORDER.** SVG has no z-buffer: sort ascending on
  `a + b` and draw in that order, so the last thing drawn is in front.
- **A CHAMFER ON A PROJECTED FACE CUTS THE SCREEN'S DIAGONAL, NOT THE WORLD'S.**
  Under cabinet, screen x rises with BOTH axes while screen y falls with depth,
  so the reader's TR + BL pair (ADR-065) is `(a+w, b+d)` and `(a, b)`. Cutting
  the world's `(+a,−b)` / `(−a,+b)` pair puts the chamfers on the drawing's left
  and right extremes — the unlawful diagonal wearing world coordinates. Pin it
  from BOTH ends.
- **ONE LINE DRAWS ON, ONCE.** ⚠ Static line work takes `vector-effect:
non-scaling-stroke` so a hairline is one device pixel at every width; **a
  draw-on run may NOT** — under it the browser ignores `pathLength` and the draw
  breaks into partial arcs (ADR-106). ⚠ **A DASHED RUN CANNOT DRAW ON AT ALL**:
  its own dash array is the transition's channel. Exclude it in the SELECTOR,
  not by a later override — the draw-on block is usually declared last and ties
  on specificity.
- **NO SPIN, NO CAMERA MOVE.** The projection is fixed. What arrives, arrives
  by drawing itself.

## Determinism and the field

Motes over the plane are the particle system at drawing scale: a seeded PRNG
(`mulberry32`, one integer per surface), 1×1 squares, never `Math.random`. The
figure must be byte-identical on the server, in the browser and in a headless
print — a drawing that differs between the page and the handout is a drawing
nobody can check.

## The crop

⚠ **A WIDTH-BOUND DRAWING'S CROP HEIGHT IS PURE LETTERBOX.** If the stage is
`width: 100%`, trimming the crop's height deletes a dead band and does NOT
shrink the drawing; the only lever that makes it bigger is its share of the row.
Conversely a height-capped stage is width-elastic. Know which axis binds before
touching a number (ADR-070 U12's finding, three surfaces on).

⚠ **STRETCH ONE AXIS AGAINST THE OTHER WHEN THE RECORD IS LOPSIDED**, and state
the stretch once as a named constant. Seven doublings are three years wide and
three units tall; at one scale on a 2.5:1 crop the relief is a stub in the left
third. The marks' own spacing stays uniform, so the axis is still a dated axis
and nothing about the reading changes.

## Where it lives

`components/arcs/framing/iso.ts` — the projection, the primitives (`isoBox`,
`isoPlate`, `isoPlane`, `isoGrid`, `isoSteps`, `isoRail`, `isoGate`,
`isoLeader`, `isoDust`) and the label arithmetic. Pure, zero imports.
Guarded by `tests/lib/arc-iso.test.ts`.
