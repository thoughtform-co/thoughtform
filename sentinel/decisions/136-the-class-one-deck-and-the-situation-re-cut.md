# ADR-136: The class-one deck, and the workshop's situation re-cut on the Moira session

- **Status:** Proposed (2026-09-29, owner). Built, guarded and measured at
  1280×720; flips to Accepted once the owner has read both pages live.
- **Surface:** `lib/arcs/content/ai-storytelling-class-1.ts` (new, the
  class-one deck, `/arcs/ai-storytelling-class-1`);
  `lib/arcs/content/thoughtform-workshop.ts` (the situation re-cut);
  `lib/arcs/content/ai-storytelling.ts` (the class-one station links out, the
  worked example imported); `lib/arcs/content/shared/frontierCurve.ts` and
  `shared/tom-on-the-moon.ts` (new, the two shared records);
  `lib/arcs/types.ts` (three union members, `ArcStage.example`, `stages.own`,
  `ArcSyllabusClass.page`); `components/arcs/ArcSpectrum.tsx`, `ArcResource.tsx`,
  `ArcSignal.tsx` (new leaves), `ArcStages.tsx` (the example line),
  `ArcSyllabus.tsx` + `syllabus/syllabusLayout.ts` (the page link),
  `ArcSectionRenderer.tsx`, `chrome.tsx` (`KIND_DESIG`), `arcs.css` (blocks 07–09
  under the ADR-130 banner, the light foot, the phone and reduced-motion rules),
  `course.css`; `lib/arcs/registry.ts`, `lib/theme/heroPreload.ts`;
  `scripts/arcs/prep-ai-storytelling-assets.mjs` + one new frame under
  `public/arcs/ai-storytelling/`; tests: `arcs-registry` (three kinds, the
  stages' examples, the syllabus page link, the two shared records pinned
  `toBe`), `arc-terminal-markup` (both course pages join the walk), `arc-iso`
  (a third stages row), `sheet-config-fit` (two boards join the owner's page),
  `hero-preload`, `sheet-instrument` + `sheet-composition` (`REAL_TODAY`).
- **Supersedes:** nothing. [ADR-131](131-the-workshop-archetype.md)'s
  "No `questions` board, so `sheet-config-fit`'s pinned list does not move" is
  reversed by this record: the archetype carries a board now, and the list
  moved. [ADR-134](134-the-course-is-one-track.md) stands; its worked example
  is shared rather than owned by the course page.
- **Related:** [ADR-130](130-the-workshop-frames-the-loop.md) (the four framing
  kinds this extends), [ADR-128](128-the-pandora-proposal-and-two-kinds.md)
  (the bench), [ADR-106](106-the-outcomes-are-one-dial-read-three-ways.md)
  (grammar is copied, never imported), [ADR-052](052-client-arcs.md) (the
  enumerated exceptions: sixteen to eighteen now).

## The ask

Owner, 2026-09-29:

> We recently implemented our V2 workshop, from prompts to agents. I really like
> it and I want to use this structure for my Thomas More AI storytelling course
> as well. […] create a V2 of the first class where we really talk about the
> exact same flow […] we need to use the Thoughtform design language […] Let's
> really use the Tom on the Moon visuals and the approach we used for it,
> because that's actually what I want to tease: we're going to build a creative
> intelligence configuration around Tom on the Moon to build their brand worlds.
> […] the examples in the Moira workshop are more about creative review and
> checking errors. This is a bit different. This is really about building a
> consistent world […] While you're at it, also use this to update our new
> Thoughtform workshop. […] it has a section that talks about the proof. I think
> that's important. We can keep that, but when we talk about the situation, like
> from prompt to tool to agent, etc., that's outdated. We take that from the
> Moira one.

Decided with him in the session: the class-one deck is a NEW house arc linked
from the syllabus (the course page stays); English; the third world is In The
Pocket's AI-readiness set (nine sectors, one look) rather than the headshots;
on the workshop only the situation gives way — the proof, `what-you-build`,
`delegate-down`, the bench and the practicals stand.

## The source

The Loop Moira repo's second session, "From a prompt to an agent you can trust"
(`content/sessions/from-prompt-to-agent.ts`, its ADR-050/051/052, 2026-09-29):
sixteen sections — a prompt, a tool, an agent · the curve · hard to steer (the
spectrum) · a strange resource (the ledger) · the real question · the board ·
the leverage · person or agent · the horizon · the signal · the setup · the
bench · live · ambition · your turn · rewarded. Of those, ADR-130 had already
ported the stages, the curve, the horizon and the board (`questions`), and
ADR-128 the bench. Three were still hers alone, and the owner's "exact same
flow" needs them.

## The decision

### 1. Three more of her beats, ported by hand — the sixteenth to eighteenth exceptions

**`spectrum`** — one rail from tool to collaborator, a handle resting in the
overlap, two bands under it (software from the tool's end, intelligence from
the collaborator's), three columns under those. Her law travels with it: the
word frames a BAND, never the middle, because a collaborator is an
intelligence too. ⚠ **The handle moves once.** Hers drifts for ever on a
nine-second loop; the house allows arrival motion only (ADR-080), so it slides
into the overlap on `.is-in` over 1.4s and rests, and rests from the first
frame under reduced motion. It is a square on its point, the house's node
(ADR-106), never a radius.

**`resource`** — four resources and what each is counted in, on the house
plate. Three rows are ordinary on purpose so the fourth reads as the odd one
out; what its unit leaves out is the beat's one gold object. ⚠ **The kind is
`resource`, never `ledger`**: `.arc-ledger*` is the ADR-098 U2 fee table, and a
second object under that name is a fork by another spelling.

**`signal`** — two columns in the board's order (the context, the
evaluations), two dated clippings under each: a panel with the name set as a
wordmark and the figure in its corner, the headline, a dek with its figures in
weight, where and when it ran. Each card is the house plate at the module cut
(ADR-098 U5: a cut is free only where nothing is set against it) and links to
its source in a new tab. ⚠ **A signal may only follow a `questions` board on
its page** (her own rule: it reads the two plates the board lit; the registry
pins it). ⚠ **A clipping is a dated record**, so its corner, kicker, title, dek
and date may carry figures (ADR-078 U1: a dated log row may state a count)
while the column heads and the card's mark and tag may not — the digit ban is
split, and the split is pinned.

Every colour aliases the ADR-077 ramp; the three wells that are alphas of
their own (a band's ground, the table's head, a clipping's panel) are
re-derived in the light foot. `data-spectrum-*`, `data-resource-*`,
`data-signal-*`, never `data-arc-*`; `arc-spectrum` is safe (`arc-stage` is
the banned substring in reveal markup). Weight ceiling `--weight-lit` where she
used 600; tracking on the four role tokens.

### 2. The stages carry her examples, in the row

Her stages letter one of the client's own pieces of work under each plinth,
prefixed "Loop's own". `ArcStage.example?` and `stages.own?` carry that, drawn
as a fourth line in the ROW list under the body — **never on the plinth**:
`stagesLabels()` and the live stage are untouched, so `arc-iso`'s label walk
and `holo-stage-geom` need nothing, and a label on a slanted face is the
plaque defect ADR-130 U1 closed. Digit-free (the existing `noDigits` walk over
`stages` already reaches the field), ≤48, all three or none, `own` iff any.

### 3. The class-one deck

`/arcs/ai-storytelling-class-1`, a house arc in the workshop format,
`cardChip: "course"`, dated 2026-09-29, the gateway plate and the curtain.
Twenty-two sections in five chapters (the cap): **today** (the readout and
who is teaching, the homepage's About in its rings) · **the situation** (the
stages with Tom on the Moon's own three examples, the shared curve, the
spectrum, the resource, the real question, the board answered for Tom on the
Moon's world with the anchor frame as the work, the leverage as two cards) ·
**the loop** (person or agent, the horizon, the signal) · **the world** (the
Tom path, bench and wall by reference, then two more worlds beside them:
Thoughtform's, four waves in with no anchor yet, and In The Pocket's nine
sectors in one look) · **now you** (the setup readout — three accounts, two
folders, the keys never on a desktop, the Plopsa recap's own lesson — the
archetype's first rung in a student's words, the ambition beat, the homework
as four anatomy rows, the rewarded lesson as a callout, and the close back to
the course).

⚠ **THE CASES ARE ABOUT A WORLD, NOT ABOUT CHECKING ERRORS.** Her bench reads
a risk record, a product image and an invoice. This class reads how a world
was found and written down, and the tease is the course's own assignment:
this term the student builds one, and next for Tom on the Moon is a
configuration that draws their world for every brief.

⚠ **TWO MORE WORLDS, NOT THREE CARDS.** The card grid falls to two columns at
the room's own 1280px and a third card orphans there (ADR-131's measurement on
`delegate-down`), so the worlds beat is two cards beside the three Tom beats
above it, and Tom's card would have repeated them anyway.

⚠ **THE THOUGHTFORM ROW SAYS "NONE YET".** The home world ship (`skimmer`) is
four waves in with no approved frame, so its card carries the gateway key
visual (the identity truth) and says so. A world is found, not declared, and a
world in progress is a better lesson than a pretended anchor.

### 4. The archetype's situation, re-cut on her sequence

`/arcs/thoughtform-workshop` keeps `today`, the proof chapter, `what-you-build`,
`delegate-down`, the bench and the practicals byte for byte. Between the proof
and `what-you-build` it now runs her opening in her order: the stages (her copy,
"Loop's own" examples) · the curve (the shared record) · the spectrum · the
resource · the real question · the board · the leverage · person or agent
(replacing `tool-or-agent`'s copy) · the horizon (her copy) · the signal, which
replaces `the-hard-part` — a callout that said the signal's left column in
prose. Five chapters stand; the eyebrows renumber 03 → 22.

⚠ **THE BOARD'S WORK IS THE PRACTICE'S OWN**, like the bench's: the base every
fork starts from may not carry another client's evidence (ADR-131), so the six
questions are answered for the house's writing skill — a post in the founder's
voice — and a fork swaps the work. ⚠ **And it feeds the owner's page.** The
`/arcs` dossier draws a board from every `questions` beat
(`configurationFromQuestions`, ADR-130 U3), and its stack matcher reads the six
answers for tools it can chip: the first cut's interface answer, "In chat,
before it is posted", named nothing, and the owner's page reported _"a
configuration of 0 links (1–8)"_ through three suites. "In Claude, before it is
posted" is the one chip; `sheet-config-fit` pins it on both new boards.

### 5. Two shared records

`shared/frontierCurve.ts` holds the curve's data half (axes, step, key, prices,
effort, lanes, others, note), lifted verbatim from the archetype; the two
English pages spread it and author only the head, so a vendor repricing lands
on both at once (Plopsa keeps its Dutch copy). `shared/tom-on-the-moon.ts`
holds the path stages, the bench example, the wall and the anchor image; the
course page and the class deck import them by reference and the registry pins
the two pages `toBe` the same objects — the house pattern ("share the evidence,
author the frame").

### 6. The syllabus links out

`ArcSyllabusClass.page?: { label; href }`, a second link under the worked
example on the class's sheet, flagged "The class" in the gold ink. The registry
pins it to a registered arc's ROOT: a gated arc loads through `/unlock` and
drops a fragment (ADR-135's own open note), so a fragment here would be a link
to nowhere.

## What was measured

At 1280×720, dark, in the browser (the room's projector frame):

| page                      | beats | one screen | over                                                                                                          |
| ------------------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `ai-storytelling-class-1` | 22    | 20         | the bench, +36 (the module's own floor, as ADR-131 records it); the two-worlds cards, 846 (+126)              |
| `thoughtform-workshop`    | 26    | 23         | `what-you-build` +65, `delegate-down` +30, the bench +41 — the three ADR-131 already recorded over, untouched |

Every beat this record adds is exactly one screen on both pages, headed, in
dark and in light, and at the owner's 1920×1247. ⚠ **Three beats were not, on
the first cut, and the copy paid:** the leverage cards with her three chips
under them ran 915px (the class) and 938px (the archetype), the five-row
homework 790px, and the two-worlds cards 981px. The chips' three claims are the
head's last sentence now, the card bodies are one line, the homework is four
rows of one line (the anatomy's own measure), and the two-worlds cards carry
two rows on a 16:9 frame (the course page's own offer cards' measure), which
took the beat 981 → 925 → 846. **That last figure is the format's air, not the
copy** (ADR-131's finding: a flat kind carries `--arc-sec-pad` at 100.8px a
side at 720h), and it stands with the archetype's three rather than losing
the cards their check and their anchor. The curtain stays armed
(`data-arc-tall` absent) on both pages. No console errors. `data-holo` reads
`static` in the app's pane and `absent` in the headed capture (no GL either
side), which is the fallback the handout shoots.

⚠ **THE PANE'S PROBE AND THE HEADED CAPTURE DISAGREED ON THE IMAGE-CARD BEAT**
(720 against 981): a centred beat spills through both ends, and `offsetHeight`
on the section reports the box, not the content — the symmetric overflow the
proof rules already name. The headed capture's content height is the reading.

Unit: the whole suite, 148 files and 2530 tests green; `tsc` clean; eslint at
336 of the 337-warning ratchet, no new warning. `arcs-instrument-smoke` 26/26
against the worktree server once its `CONFIGURED` set learned the two new
boards (its first run failed the dossier assertion on both, and two `goto`s on
the cold webpack compile).

**The voice grader** (`thoughtform-tov`, `evals/mechanical.py`, longform, en)
over every string of the class deck and the archetype's new beats: **MECHANICAL
PASS on both, 0 gates failed**, after one hard ban — Moira's own word for her
seventh beat, _leverage_, is on the skill's post-2022 list, so the beat is "The
two plates only you can write" here and "…only your team can write" on the
archetype. Three minor flags stand, all on lines he approved on Moira: the
anaphoric run of the stages' sub ("Ask it… Have it… Give it…"), one negation
fragment and one crafted pair ("Both, at once"). The archetype's ladder reads
PASS_WITH_NOTES, the class's RETRY on those minors; both ship on the gates.

## The traps this pass paid for

- ⚠ **The shared 3003 dev server was another session's, and its static-paths
  worker was dead**: every `/arcs/<slug>` answered 500 with _"Jest worker
  encountered 2 child process exceptions"_ — an untouched arc too — while `/`
  and `/arcs` served, and its log had stopped on EPIPE. Not a regression; the
  2026-09-21 condition again. The pages were verified from a sibling worktree
  on 3012 (`next dev --webpack` over a junctioned `node_modules`), the recipe
  on record; the launcher lives in the session's scratchpad and the
  `thoughtform-wt` row in `.claude/launch.json` is session chrome, not to be
  committed.
- ⚠ **A board with no chip is a violation on a page nobody was looking at.**
  Three overview suites failed on the archetype's board before the board's
  own page had been opened once — the owner's instrument reads every
  `questions` beat, so an answer that names no tool is a hole in a drawing
  two routes away.
- ⚠ **The hidden browser pane cannot screenshot** (the render stalls); the
  headless capture script is the still, as `.claude/rules/proof.md` records
  for the map lab.

## Alternatives rejected

- **Composing the three beats out of existing kinds** (`cards` for the
  clippings, a `list-groups` layout for the table, an `interstitial` for the
  spectrum): the owner's ask is the exact flow, and the spectrum and the
  clippings are drawings, not lists. Only the leverage stayed on `cards`
  (its two plates with rows ARE a card grid).
- **Importing Moira's components across repos**: ADR-106's law; each has its
  own tokens, its own laws and its own tests.
- **Replacing the archetype's whole theory with hers**: the owner chose the
  situation only; the self-sufficiency pair is the practice's own argument
  and stays.
- **The ITP headshots as the third world**: the sector set reads as "a
  consistent world" directly; the headshots are the technique of a later
  class (the student photographed into the world).

## Left open

- The owner's live read of both pages, and of the `who` beat on the class
  deck (cut first if the deck needs trimming).
- Which Thoughtform-world frames join the two-worlds beat once a wave is
  approved; today the row says "none yet".
- The spectrum's one-shot settle against a still handle.
- The bench beat runs past 720 by its housing's floor on every page that
  mounts it (ADR-131, ADR-128 U1); a lever that binds is still to find.
- Light theme is defined by the ramp and read in the pane only; a headed
  light capture through the switch is the next pass's first shot.
