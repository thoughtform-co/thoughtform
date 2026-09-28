# ADR-133: The configuration travels, and the return is drawn

- **Status:** Proposed (2026-09-28, owner). Built, guarded and captured. Flips
  to Accepted once the owner has read the page live.
- **Surface:** `/arcs/pandora-proposal`.
  - **New:** `components/arcs/circuit/**`: `circuitLayout.ts` (pure),
    `CircuitDrawing.tsx`, `CircuitScene.tsx` (the client island),
    `circuitGlyphData.ts` and `crewLayout.ts` (pure). Also
    `components/arcs/ArcCircuit.tsx`, `components/arcs/ArcCrew.tsx` and
    `tests/lib/arc-circuit-fit.test.ts`.
  - **Edited:** `lib/arcs/types.ts` (two union members and their types),
    `components/arcs/chrome.tsx` (`KIND_DESIG`),
    `components/arcs/ArcSectionRenderer.tsx`, `components/arcs/arcs.css` (the
    circuit block and one light override), `lib/arcs/content/pandora-proposal.ts`,
    `tests/lib/arcs-registry.test.ts` (two pins) and
    `tests/lib/arc-terminal-markup.test.tsx` (the masthead count).
- **Supersedes:** on Pandora only, the `board` beat (`today`) and the
  `measures` cards. The `board` kind itself is untouched and still drawn on the
  Trinny page.
- **Related:**
  - [ADR-100](100-the-configuration-is-a-board-in-two-states.md): the ledger
    and board law this keeps.
  - [ADR-102](102-one-pinned-scene-the-configuration-becomes-the-plates.md):
    the pinned-scene traps.
  - [ADR-128](128-the-pandora-proposal-and-two-kinds.md): the page.
  - [ADR-130](130-the-workshop-frames-the-loop.md): the six questions.
  - [ADR-089](089-casefile-is-one-housing.md) U4: a fill among outlines.

## The problem

Rob read the proposal and named two gaps.

**The impact.** The marketing director will ask what it pays back, and Kristin
asked for the same thing on the call ("the business case behind it … cost
savings on headcount or freelancers"). The page had a fee and four empty
measures.

**Defyner.** Rob's partner for enterprise-scale transformation builds a
machine-readable brand code first and brings the stakeholders in after. We
start with the people who have to steer the system. The two are complementary,
and the page did not say so.

The owner's brief:

- **Two beats after the studio today:** how the configuration lets the existing
  team do more (less dependency on freelancers and agencies, Kristin's specific
  ask), and how it plugs into the larger machine.
- **One configuration drawing that travels through all three**, redesigned as
  "an elevated yet simple version", drawing on the Cyberpunk inventory board
  without copying it. The board it replaced was five plain boxes and four
  bundles ("very simple and very boring").

## The decision

**1. The `circuit` kind, ADR-052's twelfth enumerated exception.** One
section, one id (`today`, its chapter link kept), three beats. The drawing is
ONE SVG whose every part carries its three poses as custom properties
(`translate · scale · opacity`, and a centre-out aperture on the ledger and
the layer). The sheet picks one pose set by `data-cir-state`, so a state change
is ONE attribute write and the travel plays on the compositor.

The three states:

- **a · the studio today, and configured.** A ruled LEDGER (seven facts,
  connected to nothing) beside ONE piece of work, the review recap Kristin
  named on the call, with its six questions wired around it:
  - context, owner and evals above it;
  - model, reach and interface below;
  - item rails on the flanks for Moira's rules · examples · sources and
    cases · checks · gates.

  The core is the one FILLED object (gold, `--gold-contrast` type) among
  outlines. The chips carry a pixel glyph, a key, the question and the answer
  on a framed value plate. Eight-wire ribbons, pin combs, a ghost die and a
  dot bed are the Cyberpunk board's vocabulary in the house's law.

- **b · what the team gets back.** The ledger closes on its aperture and the
  six chips fold into the work. The work SHRINKS into the configuration it is
  (its plate morphs on CSS `d`, one `housing()` command structure at every
  state; its name rides a uniform scale to the cartridges' rung). Its siblings
  peel off it into the columns of the four teams they give time back to:
  - the seat (green), how the team runs its configurations ("Press the
    button", "Sign off the batch"), the configurations (gold) on a bus, and
    what the team gets more time for;
  - a configuration two adjacent teams share sits between their buses.
- **c · the studio's AI capability.** The cartridges line up on one shared
  LAYER ("Written once · Owned by the team · Outlives the model") that the
  teams steer through green runs in the row's gaps. The layer plugs into what
  runs around the studio: the DAM, the projects, the adaptation agency, the
  rest of marketing, and a brand system for all of marketing, drawn dashed
  because it does not exist yet.

That last socket is the Defyner argument, **generic by owner ruling**: the page
speaks to Pandora. The complementary claim is in the head's sentence: we start
with the people, because they steer it.

**2. The scene arms itself, and only where it can run.** `CircuitScene` sets
`data-circuit-scene` on a desktop frame with motion allowed.

- **The runway:** a sticky 100svh stage, two markers at 125svh and 205svh,
  and ONE IntersectionObserver on a band at the frame's midline.
- **No scroll listener.** The page's one writer stays `useArcScroll`.
- **The head decodes in place:** the eyebrow and title scramble through
  `captionScramble` and the paragraph un-types and types, each box held open
  by ghosts of all three beats' words.
- **Anywhere else, the FLOW reads:** the three beats as ordinary frames, each
  drawn at rest by the same component, and on a phone as three ruled lists (a
  1400-unit drawing at 390px paints its type at 4px). This covers no script,
  reduced motion, ≤960px and print, and is the ADR-102 fail-open.

**3. The `crew` kind, the thirteenth: the business case DRAWN, never a
calculator.** The owner's ruling, verbatim in spirit: not exact numbers, not a
promise, a visual they can see, reasoned from Loop's team shape.

- **Left, Loop's RECORD, each output drawn as the quantity it is:**
  - seven hundred pads for about 700 assets from two designers and a
    copywriter;
  - a dozen pre-filled lines converging on one copy editor;
  - ten reviews of which a person takes one;
  - a month of four weeks with one handed back.
- **Right, the same shape in the studio:** its configurations dashed and its
  four readouts framed and EMPTY, counted from week one.
- **The only digits on the drawing are the record's**, and the registry pins
  the field's count to the number its value states.

**4. "AI capability" names the whole now.** It is the studio's configurations
on one layer, and the centre of the drawing is one piece of work (the house
grammar of the Moira workshop, Plopsa and the Dublin keynote). "What you keep"
is re-worded to the drawing's parts: the owner, the context, the evals, where
it runs and the layer.

## Findings worth keeping

- ⚠ **A SCALED NAME'S MEASURE IS WHERE IT LANDS, divided by the scale.** The
  core's name wrapped in its home state because its measure was the cartridge's
  in the wrong units; it is `(CART.w − 32) × 24 / 16.6` now.
- ⚠ **A TRAVELLER PAINTS LAST.** Mid-flight the work passed under its own
  siblings and read as a layering fault; the core's three parts sort last.
- ⚠ **CSS `font-weight` BEATS THE SVG ATTRIBUTE**, so the lit weight is a class
  (`arc-cir__lit`), as the board's `data-board-role` rule already knew.
- ⚠ **THE PIXEL PERSON WITH ITS ARMS OUT READ AS A GAME SPRITE** at 3 units a
  pixel. It is the house pictogram now, a head block over a shoulder block.
- ⚠ **THE FIT GUARD EARNED ITS KEEP ON ITS FIRST RUN**: "OUTLIVES THE MODEL"
  ran 3 units past its chip, which the still showed only as "tight".
- ⚠ **`aria-live` ON A TYPED PARAGRAPH ANNOUNCES EVERY KEYSTROKE.** The live
  head carries none; the title's `aria-label` follows the state.

## Left open

- The owner's live read, at his viewport, of the scene's pacing (the two
  markers) and of the drawing's density.
- The `/arcs` dossier cannot draw a circuit (ADR-128 left-open, one kind
  later).
- `ArcQuestions` (Plopsa, the house workshop) could adopt the circuit's
  material; not done, because both pages are live and read.
- The deck (v02 in Drive) still carries the old spine.
- **Pre-existing and not this pass's:** `arc-marks.test.ts` fails on Pandora at
  HEAD. Its last menu item, `next-steps`, is a chapter, so the arc has no exit
  mark.
