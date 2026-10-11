# ADR-155: The proposal as a system — one argument, one object, one return

- **Status:** Proposed (2026-10-10, owner). Built as a look-dev lab, `/test/proposal-system`,
  that renders the X-Bionic record through the real arc shell with seven knobs and nine
  directions, `PA` the control (production) and `PZ` the owner's whole brief; flips to Accepted
  when the owner has read the stills and picked, and the losing branches are deleted with their
  guards (ADR-070 U35). Two things landed on production in the same pass, by the brief's own
  word: the first person is swept off both proposals and the copy law bans it, and the leverage's
  stack is drawn by the one geometry (§3), with its chip clear of its label.
- **Surface:** `app/(internal)/test/proposal-system/**`, `lib/proposal-system/**`,
  `scripts/capture-proposal-system.mjs`, `tests/lib/proposal-system.test.ts`;
  `lib/arcs/content/shared/disciplines.ts` (new), `shared/loopProof.ts` (`result` on the crew's
  rows), `lib/arcs/content/x-bionic-proposal.ts` and `pandora-proposal.ts` (the first-person
  sweep), `lib/arcs/copyLaw.ts` (`PROPOSAL_VOICE_BANS`, read on the registered proposals alone: the general law is also the musings' and the sheets', where the first person is the voice), `lib/arcs/types.ts` (`job.top`, `crew.layout`,
  `CrewRow.result`, `handoff.time?` and `handoff.figure`, `instrument.pin`,
  `ArcLeverageUse.label` ≤ 20); `components/arcs/{ArcReturn,ArcJob,ArcCrew,ArcHandoff,
ArcLeverage,ArcInstrument,ArcHoloStageMount}.tsx`, `components/arcs/stack/**` (new),
  `components/holo-stage/stackGeom.ts` (new), `components/instrument/{Instrument,Slab}.tsx`,
  `lib/instrument/steps.ts` (new), `leverage.css`, `stack.css` (new route sheet); tests
  `arc-stack`, `instrument-steps`, the registry's chapter floor, job and crew guards, the
  doctrine allow-list (`stackGeom`).
- **Related:** [ADR-152](152-the-x-bionic-proposal.md), [ADR-153](153-the-leverage-and-the-handoff.md)
  (U1 §1's chapter index is reversed; `job.top`, `handoff.figure` amend it),
  [ADR-154](154-the-instrument.md) (U4's exploded stack takes the pin), [ADR-133](133-the-configuration-travels.md)
  (U5's crew gains a layout), [ADR-128](128-the-pandora-proposal-and-two-kinds.md) (the fill
  rhythm), [ADR-130](130-the-workshop-frames-the-loop.md) and [ADR-140](140-the-workshops-three-figures-are-holograms.md)
  (the stage the stack lives on), [ADR-105](105-the-page-ends-on-a-bold-footer.md) (U4: a
  scroll follower is a view timeline), [ADR-098](098-arcs-clients-and-the-proposal.md) (the copy
  law), [ADR-149](149-the-lattice.md) (the lab pattern).

## The call

The owner, 2026-10-10, on the X-Bionic proposal as it shipped: "this is a proposal. It should
really form a cohesive narrative"; "we should NEVER talk in the first person"; the adoption beat
"doesn't look good visually at all … three blocks … break the flow"; "I don't want boring-ass,
just flat icons. I would really want to leverage our diagrams, our particle system"; Loop's return
and the client jobs must be "part of the same visual language"; the jobs' heads shrink and take the
Loop cards' Tensor gold; the "In 2024, Loop decided to go AI-first." band is "only that quote"; the
engine drawing is "trash"; and all of it must become the template every later proposal is cut
from. Five references, read individually and together (`.claude/plans`, the session's record):
Unsiloed, Arrakis, iCOMAT, Rollups and Tensorlake share one flow — a statement, one claim as one
sentence, proof as neutral numbers in ruled cells, ONE product object read in steps with callouts
that light one at a time, sequence lettered in mono, and no two adjacent sections in one
arrangement.

## The decision

**1. A proposal is one argument in three parts, told with one object.** Five registers, one per
beat type: STATEMENT (a chapter band carrying the line alone, the part ruler kept), INSTRUMENT
(one object, one lit thing, side callouts on DOM leaders, the static render whole), RECORD (a Loop
card, a client job: the frame carries everything, the head band is the gold wash, the gold is the
data), LEDGER (a return per row: a value, a line, a tally where it is a count), INDEX (mono rows).
Three laws: no two adjacent beats share a register or an arrangement; the stack appears in three
states and nowhere else draws a slab; every number is as filed and lettered neutral.

**2. The owner's order, as a knob.** About · the vision (`spectrum`, the shared
`TOOL_AND_COLLABORATOR` record, its lattice-to-cloud field live) · the approach · where it plugs
in (the leverage, retitled) · "In 2024, Loop decided to go AI-first." · the four Loop cards · what
it returned · "The same configuration, built with two more teams since." · the four jobs ·
"And this is how we set it up at X-Bionic." · the engine · the two weeks · who takes part · the
fee · the close. The four disciplines are ONE record (`shared/disciplines.ts`: production, ops,
review, strategy, each with a short and a long name) and the 2×2, the jobs and the engine's tiles
read it.

**3. The layer stack is the proposal's one object** (`components/arcs/stack/stackLayout.ts`,
pure): the organisation's slab, the layer the team writes above it, the workstream tiles on
that, in the stage's own parallel projection (`ISO_BASIS_STAGE`), the crop derived by
`frameAround`, every word a DOM span seated beside its plate on a 1px DOM leader, the SVG
lettering nothing. `components/instrument/Slab.tsx` reads `SLAB_PATHS` from it, so the leverage
and the engine draw the same plate. Three states: WRITTEN (the approach, `handoff.figure`: a mono
rail of the three steps, `StackSteps` on `ArcCurveSteps`' law, the layer dim at step 0, written at
step 1, Claude's run along its front edge at step 2 — live on the holo stage through
`stackGeom.ts`, the mount's fourth scene, with the equilibrium's flow of beads and the team's
tacit knowledge as a cloud above the deck; the canvas mounts over the SVG's own box, never the
figure's, because a canvas over the figure painted the page's ground across the words), PLACED
(the leverage: three plates, the words in flow beside them, the plate gap widened to 3.4 so the
words clear each other), CONFIGURED (the engine at the org altitude, `instrument.pin`: a runway
of nine steps on a CSS view timeline — the organisation's slab and its three parts, the layer
and its two, the workstreams, the owner — each lighting and staying, derived by
`lib/instrument/steps.ts`, the resting render whole; no second scroll writer, nothing idles).
The equilibrium was refused as the medium: its three anchors are fixed points on a thought-mass,
a collar and a ring stack, a third sanctioned `next/dynamic` seam would widen the doctrine, and it
drags.

**4. A return is one type.** `ArcReturn` is the job's result block lifted out; the crew's rows
carry `result` and `layout: "returns"` draws Loop's return as four returns on the person's green
seat, so Loop and the client jobs letter a return in one vocabulary. The job's `top: "mark"` is
one lit discipline (its glyph, its long name), the title one size down, who · where · when as one
mono line, on the proof cards' gold band.

**5. Never the first person.** `PROPOSAL_VOICE_BANS` fails "I", "my", "me" and their apostrophe
forms on every proposal; X-Bionic's eleven strings and Pandora's two are rewritten. The About's
bio is third person and stays.

**6. The chapter band may carry the line alone.** ADR-153 U1 §1's index is kept where present
and no longer required: the registry asks that X-Bionic's three bands exist and count 1..3.

## What the stills found

At 1470 × 830 (the owner's MacBook Air), every beat of `PZ` is one screen by content bottom. The
stack's first cut drew the slab at the band's width (a container unit on the container itself
resolves against its ancestor: the figure is the size container and the grid is its child now),
seated the leverage's three callouts 40px apart (hence the gap dial and the flow layout), and lost
every word under the hologram (hence the plot box). The capture shoots a pinned beat three times,
start, middle and end, with the scroll-driven animations left running; `animations: "disabled"`
jumps a view timeline to its end.

At 1440 × 790 (the smaller Air, ADR-153's tightest shape) the leverage's console is the binding
beat: the stack is taller than the three plates it replaced (259px against 180), so it is capped
at `--stk-h-max: clamp(170px, 26svh, 400px)`, and the callout label takes the label rung rather
than the eyebrow's so its chip stays on the label's row (the wrapped chip alone ran the console
5px past the fold). Measured after: the console ends 11px inside the fold. The capture gates on
the lab's own stamp, never on `networkidle`: the hologram keeps a connection busy and the page
never goes idle.

## Left open

- The owner's read: the quote band, the mark head, the ledger, the pinned engine. One visual or
  two for the approach is answered: one run, read whole, with the two lines after it (U1).
- The jobs' copy and evidence (the Suri briefing skill, Samako's Film B) are the next pass,
  through the voice skill, every number as filed.
- The lab is deleted once this is Accepted; it is a one-page look-dev, not a standing lab.

## Update 1 (2026-10-11, owner): the approach is one run, read whole, and the two lines follow it

On 2026-10-10 the owner approved an eight-step outline for the approach ("Draw it"): the layer and
its four workstreams, creative production opened onto its jobs, ads design worked through from its
inputs to the finished ad, adoption with a person checking, encoding as a skill and its evals,
automation asking the workstream's owner once, the two lines, and the move upstream. It was drawn
as one run and offered three ways: whole on one screen, lit part by part on a pinned runway, and
stepped by the handoff's rail over the run. He picked "Whole" (2026-10-11): the run read in one
look, on one screen at both laptop sizes.

1. **The approach is `handoff.run`** (`ArcHandoffRun`; `components/arcs/ArcConfigRun.tsx`, the
   geometry pure in `configRun.ts`, the sheet `config-run.css`, imported by the arcs' leaf route
   and the lab): one drawing in six parts, the SVG lettering nothing and every word a DOM span
   seated by `--ax`/`--at`. Its layer and four workstreams are the vision's own words, read from
   one const (`WORKSTREAMS`) by both beats; one workstream and one job are lit; the three run
   lines are at most 76 characters (a line that runs over is shortened, never the cap). With a
   run, the plates, the time bars and the figure are not drawn; on the phone (≤ 960) a three-row
   legend carries the three lines. Under the fill rhythm the figure is a size container and the
   stage is the largest box of the crop's aspect it holds.
2. **The two lines follow it** (the outline's steps 7 and 8) as `upstream`, a `horizon` titled
   "Longer tasks for Claude, upstream time for your team." that spreads `THE_HORIZON_RECORD` by
   reference: the workshop's two lines, one record, with this page's own head.
3. **The other two readings are deleted** with their CSS and their guards, the runway (`pinned`)
   and the rail over the run (`states`), so the run has no mode. The stack (`approach=stack`, §3's
   WRITTEN state) and the plates as they shipped before (`approach=plates`, ADR-153) stay as lab
   values, and the lab's `upstream` knob is `lines · off · horizon`. `PA` is still production by
   reference.

Measured headless at 1280 × 720 and 1470 × 830, both themes: the approach ends at 678 of 720 and
780 of 830, its smallest word 11.52px and 11.8px, no two words touching; the two lines end at 662
of 720 and 764 of 830. At 390 × 844 the legend carries the run. Pandora's sent page renders the
same DOM as before (nothing under `shared/**` moved). The whole unit suite passes.
**Guard**: `proposal-system` (the run is production's by reference, the vision's layer and
workstreams in order, one lit lane and one lit job, the jobs, inputs and output ≤ 18 and the run
lines ≤ 76, every lettered string digit-free; the two lines are `THE_HORIZON_RECORD`'s by
reference; the leaf route imports the sheet); `config-run.css` at zero in `lattice-ratchet` and
`type-material-tokens`.

**Left open, for the owner**: the two lines' title takes three lines at 1280 × 720 (a proposal
title's budget is two; it is copy, so his word); the run's other two jobs ("Product imagery",
"Motion") are placeholders until the jobs' pass names them; within the run, the copy editor and
the product designer who write the checks are named in its alt text only.
