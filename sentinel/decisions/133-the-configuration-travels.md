# ADR-133: The configuration travels, and the return sits with the proof

- **Status:** Proposed (2026-09-28, owner). Built, guarded and captured; the
  first cut was pushed, rejected on his read the same evening and reverted
  (`4bea9946`), and this is the second cut, held local until he has read it.
- **Surface:** `/arcs/pandora-proposal`.
  - **New:** `components/arcs/circuit/**` (`circuitLayout.ts` pure,
    `CircuitDrawing.tsx`, `CircuitScene.tsx` the one client island,
    `circuitGlyphData.ts`, `crewLayout.ts` pure), `components/arcs/ArcCircuit.tsx`,
    `components/arcs/ArcCrew.tsx`, `tests/lib/arc-circuit-fit.test.ts`.
  - **Edited:** `lib/arcs/types.ts` (two union members), `components/arcs/chrome.tsx`
    (`KIND_DESIG`), `components/arcs/ArcSectionRenderer.tsx`,
    `components/arcs/arcs.css` (the circuit block, one light override),
    `lib/arcs/content/pandora-proposal.ts`, `tests/lib/arcs-registry.test.ts`
    (two pins), `tests/lib/arc-terminal-markup.test.tsx` (the masthead count).
- **Supersedes:** on Pandora only, the `board` beat (`today`). The `board`
  kind is untouched and still draws Trinny. The `measures` cards stay.
- **Related:** [ADR-100](100-the-configuration-is-a-board-in-two-states.md)
  (a before and an after are two kinds of object),
  [ADR-102](102-one-pinned-scene-the-configuration-becomes-the-plates.md) (the
  pinned scene's traps), [ADR-128](128-the-pandora-proposal-and-two-kinds.md)
  (the page), [ADR-130](130-the-workshop-frames-the-loop.md) (the six
  questions), [ADR-089](089-casefile-is-one-housing.md) U4 (a fill among
  outlines).

## The problem

Rob read the proposal and named two gaps: the impact the marketing director
will ask about, and how our work sits beside Defyner's (a machine-readable
brand code, built first, the stakeholders brought in after; we start with the
people who steer it, and the layer we write is what such a system reads).

The owner's brief: two beats after the studio today (the team does more; the
larger machine), ONE configuration drawing that travels through all three, and
the return as something the reader can see, reasoned from Loop's team shape,
never a calculator and never an estimate.

**The first cut was rejected.** It carried three grammars in one scene and
about forty lettered things in its first state; its "today" column listed the
studio's gaps; the return sat after the fee. His read: "too convoluted … making
me depressed … how am I supposed to send this to the client if I don't
understand any of these three sections". The rulings that came with it:

- The Moira workshop's board is the model ("I like the simplicity of this"):
  one piece of work, six questions around it; the model, the context and the
  evaluations on the left "is clean"; placement otherwise matters less than
  that all six are there and it is simple.
- The comparison between now and configured stays; the visual is redone.
- The team beat says: the existing teams are empowered, through the
  workshops, to do what they could not before; highlight WHO OWNS IT and let
  the rest recede, as an evolution.
- The larger-whole beat shows how the configurations fit into a wider network
  of circuits, redesigned completely.
- The centre card is the leitmotif and travels through both.
- The proof card's CONFIGURATION reading (the R4 board) is "super clear".
- The return goes after the proof. The goal is kept in place and rewritten as
  the approach.
- Written for a CMO who does not know AI and does not know him.

## The decision

**1. The `circuit` kind (ADR-052's twelfth enumerated exception): Moira's
board in the R4 material, one drawing posed three ways.**

- **a · Today, and configured.** Left, the review recap alone on a plain
  plate: "Typed up after every review by whoever ran it, from their notes".
  Right, the same work at the centre of a board: the owner above it on a green
  drop; the model, the context and the evaluations on its left; what it can
  reach and where you meet it on its right. The two plates the team writes are
  gold, inside one dashed frame tagged WRITTEN BY THE TEAM (Moira's frame).
  Each plate is a name, a question and one answer in plain words. Ten objects.
- **b · Your team owns it.** The lone plate closes. The owner comes down to
  head the left column with the two written plates under it, joined by one
  green bus; the model, the reach and the interface recede to the right at a
  third of their ink. The arrival is the evolution he asked for: the owner
  lights, the bus draws, the written plates light, their runs draw, the work
  lights. Nine objects.
- **c · One layer, every workflow.** The work shrinks to a chip (its plate
  morphs on CSS `d`, one `housing()` structure at every state; its name rides
  a uniform scale) and takes its place in a ring of six workflows around two
  shared plates, THE CONTEXT and THE EVALUATIONS, every chip wired into the
  pair; one dashed socket below, LATER · a brand system for all marketing,
  which is the Defyner argument drawn generic. Nine objects.

**2. The scene arms itself, and only where it can run.** `data-circuit-scene`
on a desktop frame with motion allowed: a sticky 100svh stage, two runway
markers read by ONE IntersectionObserver at the frame's midline, never a
scroll listener; the head decoding in place over ghosts of all three beats'
words. Everywhere else the three beats FLOW at rest, and on a phone they are
ruled lists. A state change is one attribute write; every part carries its
three poses as custom properties and the compositor plays the travel.

**3. The `crew` kind (the thirteenth): the business case drawn, and placed
with its proof.** Loop's record on the left, each output drawn as the quantity
it is (seven hundred pads for about 700 assets; a dozen lines converging on
one copy editor; ten reviews of which a person takes one; a month with a week
handed back); the same shape in the studio on the right, its four readouts
framed and EMPTY, counted from week one. It sits after the four proof cards
and before the turn to Pandora. The only digits on the drawing are the
record's.

**4. The goal is kept and rewritten** as the approach in a CMO's words: the
team sets the goal and the checks once, the work runs for hours, a person
looks at the result; that is where the time comes back, and it only works once
the team trusts it, which is why the checks come first.

## Findings worth keeping

- ⚠ **A PLAN APPROVAL IS NOT A DESIGN APPROVAL.** The first cut matched its
  approved plan line by line and was unreadable; one still of the first beat,
  shown before the rest is built, is what this kind's second cut owed him.
- ⚠ **A "TODAY" IS NEVER A COLUMN OF THE CLIENT'S GAPS.** One neutral line on
  the work itself carries the comparison; the absence being drawn is
  connection, not order (ADR-100's law, which the first cut broke in copy).
- ⚠ **A FRAME THAT HOLDS PLATES PAINTS UNDER THEM.** Drawn after them with an
  opaque fill it hid both written plates; every gate was green because the
  gates measure geometry, and the still is what showed it.
- ⚠ **A SCALED NAME'S MEASURE IS WHERE IT LANDS, ÷ the scale.** ⚠ **A
  traveller paints last.** ⚠ **CSS `font-weight` beats the SVG attribute**, so
  lit is a class. ⚠ **A path box is walked command by command** (an `H` or `V`
  carries one number), or every morphing plate reports a box that is not its own.
- ⚠ The fit guard now pins the OBJECT COUNT per state (≤ 12) beside the
  measures, the floor, the crop and the overlaps.

## Left open

- The owner's live read: the two runway markers' pacing, and whether the
  receded right column in beat b reads as "into the background" or as broken.
- The `/arcs` dossier cannot draw a circuit (ADR-128 left-open, one kind later).
- `ArcQuestions` (Plopsa, the house workshop) could adopt the circuit's
  material; not done, both pages being live and read.
- The deck (v02 in Drive) still carries the old spine.
- Pre-existing, not this pass's: `arc-marks.test.ts` fails on Pandora at HEAD
  (its last menu item, `next-steps`, is a chapter, so the arc has no exit mark).
