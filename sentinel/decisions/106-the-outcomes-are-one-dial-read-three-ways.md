# ADR-106: The outcomes are one dial, read three ways

**Status:** Proposed (2026-09-15) — built and guarded, pending the owner's live read.
**Surface:** `#outcomes` on `/arcs/trinny-london/proposal`; the `steps` kind's stage visual on the arcs surface.
**Extends:** ADR-103 §B (the `steps` kind — the rows, the clock, the runway and every window are untouched; only what a stage DRAWS changes).
**Related:** ADR-077 (the arcs' ink ramp), ADR-100 (the board's copied-grammar precedent), ADR-065 (the corner law — and why a silhouette here is a proper noun), ADR-097 U12 (pure motion, zero fades), ADR-068 U6 (1px div leaders).

## The ask

Owner, 2026-09-15, on the beat ADR-103 shipped that morning:

> I kind of like the visual, but I asked specifically to use the diagrams, the
> circular things on our homepage. If you go to the second section, we have
> these nice diagrams behind our brand mark, which represent the gateway. Also
> in the About section, we have some diagrams. That's what I want to use for
> all three cards, and we currently don't have that. It's now just an image
> plastered on top of a frame. I think we can do better. I also want you to
> design some simple visualizations for the other two parts — a team that runs
> itself; no long-term dependency, something that's super clear. Right now
> they're empty.

## The diagnosis

Two separate defects, and ADR-103 named the second in its own §Left open.

1. **Stage 1 was housed wrong, not drawn wrong.** `ArcScanVisual` framed the
   packshot in a rectangle — two dashed hairline runs and four registration
   crosses. Every gate passed it; what it reads as is a picture on a box. The
   ask in ADR-103 had already named the house's *diagram language* and the
   frame was never it.
2. **Stages 2 and 3 were literally empty.** `visual.kind === "field"` drew the
   same rectangle with one centred node and a mono designation — the documented
   "awaiting its record" placeholder.

## The reference, decoded

The vocabulary is the About section's orbit drawing (`AboutStage.tsx`, the
richest ring register in the repo) and the concentric armature behind the
brandmark in the corridor's second beat. Read off both and off the two live
stills:

- six concentric rings on an alternating dash ladder, dawn and gold
- a graduated rim: a tick every 15° off the cardinals, and a longer, heavier
  stub ON each cardinal
- four radial spokes, on the diagonals
- mono designations in the corners the circle leaves empty
- **the subject sits OVER the inner rings**, which pass behind it — which is
  exactly how a packshot gets seated in an instrument rather than on a frame

## The decision

**One instrument, read three ways.** A machined DIAL carries all three stages;
what changes is what is seated in it.

| Stage | Deliverable | The record it plots |
| --- | --- | --- |
| 1 · The setup | A creative tech setup | The generated packshot at the dial's centre, read by a machine: the gold edge sweeps the whole instrument and the four checks the studio's grading gates are called out as it passes their anchor. |
| 2 · The team | A team that runs it themselves | **THE RUN** — the production run the team does itself: four stations on one lit run, BRIEF · MAKE · GRADE · SHIP. A filled node is the team's hand, an open one the model. |
| 3 · The system | No long-term dependency | **THE ARC THAT ENDS** — the setup is a closed inner circle that keeps running; the engagement is a short arc on the outer track that terminates at a capped node, the track past it left bare. |

⚠ **`by` IS THE WHOLE READING ON STAGE 2**, and it is the deliverable's own body
drawn: *"they know what it is good at and where it gets things wrong"*. A run
where every station is the team, or every station the model, has stopped saying
it; the registry pins at least one of each and the smoke pins the fill from
BOTH ends (ADR-065 U4's law — a one-sided assertion verifies a mark exists,
never that it is the right one).

⚠ **THE BARE REMAINDER OF STAGE 3'S TRACK IS DRAWN**, at the faintest rung, and
the arc terminates on a radial CAP. An arc that simply stops in empty space
reads as a rendering fault; one that stops on a track that continues reads as
the deliberate end it is.

### Copy the grammar, import only the pure math

The `ArcBoard` precedent verbatim (ADR-100: *"the proof's R4 grammar copied by
hand … NO `--pda-*` token — every colour is an `--arc-board-*` alias"*).

- ⚠ **`CelestialConnector`, `DiagramSvg` and `shapes/**` are NOT imported.**
  They are not on the arcs' sanctioned cross-tree import list, they letter in
  `--dawn-*` and raw `--gold` rather than the ADR-077 ramp, and they bake their
  coordinates into a ±120 space with a `transform` attribute on every tick.
- ⚠ **`@/lib/celestial` is never imported** — the barrel re-exports `queries.ts`
  and drags Supabase and `next/cache` onto the route. `@/lib/celestial/orbits`
  alone is pure; this pass did not need it.
- ⚠ **`PhaseGlyphSvg` is NOT reused**, although it is a ready-made set of three.
  Those glyphs MEAN Navigate / Encode / Build. A silhouette on this site is a
  proper noun (ADR-070 U22's finding, on the cartridge).

### The SVG letters nothing

`dialLayout.ts` is pure — no React, no DOM — and emits rings, ticks, stubs,
spokes, two arc paths and the label SEATS as fractions of the crop. Every
string on the figure is a **DOM label on its own opaque bed**, seated by the
`--ax` / `--at` idiom `.arc-scan__callout` already shipped.

⚠ **So ADR-100's declared-`measure` ladder does not apply and is deliberately
absent.** That discipline exists because SVG `<text>` neither wraps, ellipsises
nor reports overflow. There is no SVG text here, and inventing a measure table
for line work would be a guard measuring a model of the drawing rather than the
drawing (ADR-070 U34's own finding). What replaces it is containment plus the
smoke's overlap walk.

### Motion, on the one clock

`--scan-s` (0 → 1, **finished by default**) stays the single input per stage;
`--tl-step` feeds it and `turnClock.ts`, `SCENE_STEP_SPAN` and the 605svh
runway are untouched. The scan's sweep is unchanged and still parks as the
verdict's rule; the run and the two arcs DRAW ON.

⚠ **THE DRAW-ON RUNS MAY NOT TAKE `vector-effect: non-scaling-stroke`** — the
browser then ignores `pathLength` and the draw breaks into partial arcs. The
STATIC line work does take it, so a hairline is one device pixel at every stage
size (a 1-unit rule in this 240-unit crop paints ~1.1px at the laptop and ~2px
at the owner's viewport, and the browser pays the difference in alpha — the
arithmetic that has cost this house a hairline three times).
⚠ **A dotted path cannot draw on** (its dasharray IS the dot pattern) and this
beat may not fade, so every dashed ring is revealed by a clip.
⚠ **The closed circle is an explicit two-arc path starting at twelve o'clock**,
never a `<circle>`: a circle's draw-on starts at three o'clock and the only way
to move it is a `rotate()`, which this drawing may not carry.
⚠ **No spin.** The About drawing rotates three orbit groups on `@keyframes
rotate`; an idle animation is what this beat's law and the photosensitivity
ruling (ADR-097 U12) both forbid.

## Traps this pass met

1. **A LABEL'S BOX WAS BOUNDED BY THE DIAL, NOT THE FIGURE.** The callouts were
   nested inside the dial's square box, so `right: 0` resolved against the
   drawing and every label's tail ran off the end of it — clipped by a box no
   gate measures. They are siblings of the field now, the row spans node →
   figure's right edge, and **the leader takes the slack** rather than being a
   hand computation off the dial's width.
2. **A CENTRED WORD IN A FULL-WIDTH BOX OCCUPIES ITS WHOLE ROW.** The hub was
   `left: 0; width: var(--dial-d); text-align: center`, and the two side
   stations sit on exactly that row — the overlap walk read `MAKE` as printing
   through `THE STUDIO` while nothing on screen touched. **A box is what a
   guard measures, so the box has to be the word.** Found by the guard written
   in the same pass, on its first real run.
3. **THE DISC IS LOAD-BEARING, NOT DECORATION.** The scene sits on the coral
   wash, which no contrast walk can see; line work with no bed is line work
   over nothing measurable. It is also what makes the drawing read as a
   machined dial rather than as rules floating on a ground.
4. **A CONCURRENT SESSION ON ONE TREE MAKES A SCROLL SMOKE LOOK FLAKY.** Three
   different cases failed on three consecutive runs and every one passed in
   isolation: the other session was editing `proof-stack/**`, which this route
   mounts, so each save fast-refreshed the page mid-drive. Re-run a scroll
   spec on a warm, quiet server before believing a failure.

## Measured

At 1920×1247 and 1280×720, headless, real scrolls, zero page errors: three
dials mount, each with six rings, twenty-four graduation marks and four spokes
over one opaque disc; every mono label ≥ 8px, inside the figure's box on both
edges, and zero label-on-label overlaps on any stage; the run's four nodes
filled `team · model · team · team`; at the settled end every `stroke-dashoffset`
is 0 and the engagement's cap is drawn; the scan's image clip, its edge parking
on the foot, its ghost opacity and its 1px div leaders are unchanged from
ADR-103. The full fifteen-case Trinny smoke is green.

## Guards

**Unit** — `tests/lib/arc-steps-dial.test.ts` (13 cases): the square crop and
the descending ring ladder with no repeated dash; the rim graduated off the
cardinals and stubbed ON them, a stub longer than a tick; the spokes on the
diagonals and clear of every stub; every emitted point inside the crop; the
circle closed at twelve o'clock in two arcs with no transform anywhere in the
geometry; the compass convention; the four stations evenly seated on the track
with their labels in the annulus and their clock in the run's order; the
engagement's node exactly on the end of its own arc, its cap straddling the
track, and the bare remainder the larger part of the ring.
`trinny-offer.test.ts` and `arcs-registry.test.ts` walk the record (three visual
kinds, the station roster and its `by` split, the copy caps, the dial's diagonal
pair on every figure, no digit on any drawing).

**Smoke** — the scene walk gained the dial: the three stages' kinds in order,
the ring / graduation / spoke / disc counts, no `vector-effect` on a draw-on
run, the type floor, containment on both edges, the pairwise overlap walk, the
stations' fill pinned from both ends, and at the settled end every run drawn to
0 and the terminus capped.

## Left open

- **The copy** — his rewrite; `TRINNY_OUTCOMES`' station names, hub and
  designations are authored from each item's own body.
- **The generated still** for the scan (ADR-103's own open item): a 4:5 export
  of one of the eight calibration packshots, with the four anchors re-authored.
- **Label decoding on the scan**, and the fifth (human) check.
- **Dark** — defined by the ramp, unverified; every proposal route is
  light-locked.

## Files

`components/arcs/steps/{dialLayout.ts, DialGlyphs.tsx}` (new) ·
`components/arcs/ArcScanVisual.tsx` · `lib/arcs/types.ts` ·
`components/arcs/arcs.css` (`.arc-dial*`, `.arc-scan*`, the light block) ·
`app/(marketing)/arcs/trinny-london/proposal/{offer/offerSections.ts,
trinny-london.css}` · `tests/lib/{arc-steps-dial, trinny-offer,
arcs-registry}` · `tests/visual/trinny-london-smoke.spec.ts` ·
`scripts/capture-trinny-london.mjs` · `.claude/rules/{arcs, trinny-london}.md`.
