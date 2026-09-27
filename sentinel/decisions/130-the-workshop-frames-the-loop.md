# ADR-130: The workshop frames the loop before it shows it, and four kinds draw the frame

- **Status:** Proposed (2026-09-27, owner). Built, guarded and captured the day
  before the room (Plopsa workshop III, Monday 28 September 2026). Flips to
  Accepted once the owner has read the page live.
- **Surface:** `/arcs/plopsa-workshop` — `lib/arcs/content/plopsa-workshop.ts`
  (re-cut, thirteen beats); `lib/arcs/types.ts` (the `readout` layout, the
  `stages` · `curve` · `horizon` · `questions` kinds, `ArcStage`,
  `ArcHorizonGate`, `ArcQuestion`); `components/arcs/{ArcStages,ArcCurve,
ArcHorizon,ArcQuestions}.tsx`, `components/arcs/framing/*Layout.ts` (pure
  geometry), the `ArcReadout` branch of `ArcListGroups.tsx`, `ArcSectionRenderer`,
  `KIND_DESIG`; one block in `arcs.css` ("THE WORKSHOP'S FRAMING") and its light
  wells; `tests/lib/arcs-registry.test.ts` (the framing pins),
  `tests/lib/arc-terminal-markup.test.tsx` (the arc joins the walk),
  `tests/lib/sheet-config-fit.test.ts` (Plopsa leaves the configuration list).
- **Supersedes:** on this page only, the `configuration` picker beat (ADR-098)
  and the `krea-of-setup` beat. Nothing house-wide.
- **Related:** [ADR-052](052-client-arcs.md) (the enumerated exceptions to
  "content-only": seven before this, eleven after it),
  [ADR-078 U1](078-portfolio-proof-page.md) (draw the record, not the metaphor —
  see the workshop clause below), [ADR-100](100-the-configuration-is-a-board-in-two-states.md)
  (gold is the built thing, green is the human), [ADR-106](106-the-outcomes-are-one-dial-read-three-ways.md)
  (grammar from another repo is copied, never imported; a filled node is a
  person's hand), [ADR-076](076-portfolio-flows-and-the-architecture-beat.md)
  (the curtain holds the first beat), Moira's ADR-050 ("the second session is
  the arc", `loop-moira/docs/decisions/050-…`).

## The ask

The owner, 2026-09-27, on the Plopsa workshop page: it is "missing a bit of
context". The second and third beats (three recap cards, a quote) should fold
into "two super clean panels: this is what we covered and this is what we'll
do", not "simple boring-ass frames that look like a glorified PowerPoint". Then
the framing from Loop's Moira workshop (`from-prompt-to-agent`), because "they
are actually the same workshop" and he wants it harmonised and "first really
brought into the Thoughtform brand world": a prompt, a tool, an agent, each
running longer without you; intelligence as a resource and the curve (the more
capable the model, the longer the task); the question whether a workflow is for
a person or an agent; the horizon (without context and evals an agent cannot
know what good is, and review grows with the volume); one piece of work with six
questions around it, re-laid as the model · the context · the evaluations on the
left and the data · the interface · the owner on the right; and "this is where
you have the most leverage". The Moira caption about "the studio's own line of
work" is dropped. Plopsa's own examples throughout.

## Decision

1. **The page opens on the frame.** Thirteen beats: the two panels
   (`vandaag`), the stages, the curve, the question (an interstitial, no new
   code), the horizon, the six questions, the rules as the leverage beat
   (existing plates, re-headed), then the template, the loop, Live, the hands-on
   hour, IT and the close. Five chapters: Vandaag · Drie manieren · De
   configuratie · De template · Live.
2. **The two panels are a LAYOUT, not a kind** (`list-groups` `layout:
"readout"`). Two of the house's notched plates, the gap as the divider (no
   vertical rule), each the plate's own head band, then READOUT ROWS — the key
   framed and filled, the value framed on the shared edge and set right (the
   /arcs dossier's Starfield row, owner 2026-09-21) — and the foot seated at the
   floor. The right plate's rows are in-page links, so it is the day's index
   (the tool index's grammar, ADR-079), never a description of it. No prose
   inside a panel: the head's sub carries the sentence. That is the answer to
   "glorified PowerPoint": what a slide does is a title over bullets in a box;
   this is a dated record beside the page's own navigation, in the machined
   material every other plate beat on the surface uses.
3. **Four new kinds, ADR-052's eighth to eleventh enumerated exceptions**, each
   one leaf, server-only, no state, no listener, no script, `data-<kind>-*` only,
   every colour an alias of the ADR-077 ramp, and no `transform` on any SVG node:
   - `stages` — three R4 housings (the corner pair, a head band ruled at its
     floor, a rule that stops at the cut) on a graticule over the dot matrix;
     width is how long each runs without you, height how much of the work it
     holds; the agent's is the one gold object; beside it, three rows in the
     plates' head-band material, the lit one filled and the other two ring-only
     (ADR-089 U4). The owner chose this over re-skinning Moira's isometric
     plinth floor.
   - `curve` — the program board's step ladder (ADR-078 U1) on a dated axis: a
     riser every seven months (METR's doubling), seven treads, the seat at NOW
     the one gold mark, a dashed reference at the length of the work the room is
     there to hand over. No vendors, prices or lanes: those were Loop's.
   - `horizon` — Moira's two tracks, copied by hand (`geometry.ts` §horizon),
     with the dial's law for every mark: a FILLED node is a person's hand, an
     OPEN one the model. Nine filled nodes above, two open gates below, one gold
     run.
   - `questions` — Moira's board on house material: the work at the centre on the
     plate's top-right notch (a single notch means connected), six plates on the
     lawful TR + BL pair, eight-wire ribbons (R4). Gold is what the team writes
     (the context, the evaluations), green is the human (the owner). **Not a
     third mode of `board`**: `arc-board-fit` pins that kind's two-state tuple on
     every registered board, and a third mode would branch every assertion in it.
     The plates are DOM (the answers wrap, SVG text cannot); the SVG carries only
     the ribbons, which end at a plate's edge, never under it (a plate is 0.55
     alpha in dark).
4. **The workshop clause on ADR-078 U1.** "A drawing plots something that
   happened; if all it knows is an argument, the argument is better as a
   sentence" stays the law for proposals and portfolios. A WORKSHOP teaches a
   frame before it shows the work, so a framing figure may draw an argument,
   provided it names its source or its own record in its words: the stages name
   Plopsa's own three steps (July, the tool, the loop), the curve carries its
   source and "een beeld van die vaststelling, geen meting per model", the
   horizon's note says the three gates are the loop's real ones. A figure that
   can say neither is still a sentence.
5. **The six-question board replaces the configuration picker on this page.**
   Two configuration instruments on one page is the house's said-twice defect.
   Consequence, recorded and not fixed tomorrow: `lib/sheet/arcs.ts`
   `arcConfiguration()` reads only `configuration`, so the owner's `/arcs`
   dossier draws no configuration chips for Plopsa until a
   `configurationFromQuestions` reader lands (the `STACK` regexes already match
   the answers' `Claude` and model words).
6. **The Krea question folds into one tip** on the IT beat (owner's pick): keep
   Krea as a tab if they like; the difference is where the judgment lands and
   the price per call on their own key.

## How it is budgeted (the traps it met)

- **Every beat pays for its instrument out of its own air, never the format's.**
  `data-arc-format="workshop"` is shared with the Claude workshop and the Suri
  kickoff; a format selector would retune two pages nobody measured.
- **The first beat is seated on `--arc-stage-pad`, not `--arc-sec-pad`**: the
  curtain holds its band fixed and the flow box must be the same box (ADR-076).
  The readout tightens the STAGE token on its own section, so both read it and
  the beat stays exactly one viewport (`data-arc-tall` off).
- **A centred beat moves its head by half the height it loses.** At 1280×720 a
  full head margin seated five eyebrows through the client mark's hairline
  (y ≈ 44px, `.arc-hud-client::after`) in exactly the frame the handout shoots.
  The framing heads take `clamp(28px, 18vh − 100px, 112px)` (the house's 112 by
  1247h) and each figure is capped in `svh`; measured, every framing head sits
  at ≥ 104px at 720 and every framing beat is exactly one viewport at
  1280×720, 1440×800, 1920×1080 and 1920×1247.
- **`arc-stage` is a banned substring in reveal markup** (the terminal grammar's
  class); the stages figure's classes are `arc-floor*` for that reason.
- **A module's cut is R4's (≤14px), not the plate rung**: at 26px the BL chamfer
  bites the answer's last line (ADR-098 U5: a cut is free only where nothing is
  set against it).
- **Labels scale with the viewport above their laptop floors**, so 1280×720
  renders as measured and the owner's 1920×1247 does not read as a laptop drawing
  blown up.

## Guards

`arcs-registry` ("the workshop's framing kinds hold their records"): the
readout's two plates, a foot on each, a key on every row, no prose, every link
in-page and resolving; the stages' one lit stage and it is the last, label
budgets; the curve's four consecutive years and its note; the horizon's gate
order `check, retry, ask`, sorted inside the run, six to ten checks; the board's
six unique questions, the lit pair adjacent on the left, one owner, answers ≤ 60,
the work's image on disk; and NO DIGIT on any instrument's lettering (the curve's
years excepted). `arc-terminal-markup` walks the whole arc in both motions.

## Left open

- The `/arcs` dossier reader for `questions` (Decision 5).
- The owner's live read, at the room's own screen.
- Loop's copy of the same workshop is still Moira's; harmonising it onto these
  kinds is the next step he named, not this one.
