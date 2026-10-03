# ADR-143: The workshop's third house cut

- **Status:** Proposed (2026-10-03, owner). Built and guarded; flips to Accepted once
  the owner has read the page live. It is the template his next presentations are cut
  from, first for Suri in London.
- **Surface:** `/arcs/thoughtform/workshop-v3`, a static route folder
  `app/(marketing)/arcs/thoughtform/workshop-v3/` (`page.tsx`, `journey.ts`,
  `WorkshopPortals.tsx`, `WorkshopTail.tsx`, `runs.ts`);
  `lib/arcs/content/thoughtform-workshop-v3.ts`; three new shared records
  (`shared/threeWaysLoop.ts`, `shared/workshopFraming.ts`, `shared/whatFollows.ts`);
  Prompt to Loop hoisted to `components/arcs/prompt-to-loop/` with its media at
  `public/arcs/prompt-to-loop/`; `lib/arcs/registry.ts` (one row); `[slug]/[leaf]`'s
  `OWN_ROUTE_SLUGS`; `HERO_ROUTES`; `tests/lib/thoughtform-workshop-v3.test.ts` (new);
  rows in `arcs-registry`, `hero-preload`, `ap-hogeschool`; `REAL_TODAY` in
  `sheet-instrument` and `sheet-composition`.
- **Does NOT supersede ADR-139 or ADR-141.** v1, v2 and the AP lecture render as
  before; what they gained is that four of their beats are now shared records.
- **Related:** [ADR-141](141-the-ap-hogeschool-lecture.md) (the spine this cut is built
  on, and Prompt to Loop, its U3), [ADR-139](139-the-workshop-second-cut.md) (the share
  rule: fork the prototype, sheet and root class together or not at all; the close),
  [ADR-131](131-the-workshop-archetype.md) (one idea per viewport, one screen at
  1280×720), [ADR-142](142-arcs-nest-under-their-group.md) (the address).

## The call

The owner, 2026-10-03: a V3 of the Thoughtform workshop page, "a very important
template for my future presentations". Build on the AP lecture, "a good structure",
but skip Tom on the Moon and the nine-sector wall and "start from one prompt to a
10-second ad". Add the pricing context. His reasoning is the Wispr note "Thoughtform Arc
structure" (2026-10-03): the narrative runs from prompts to tools to agents, then the
nature of AI ("are you building workflows for people or for agents?"), then the proof
(the breakdown, the evals, the setup), then the practical side. And after the bill, the
question everyone has: is it just about the money?

Asked, he chose: **cut the student tail** and end on v2's client close; **the economics
directly after the cost slide**; **cut the six-question board** (it was Tom on the
Moon's); **Laura's reaction from her Slack message, made concise**.

## The decision

**A fourth own route on ADR-139's share rule.** The intro (hero, About, the eras, the
corridor, the Loop proof pile) is v1's prototype, sheet and root class by import, as on
v2 and the AP lecture. The owner means to change the intro next; the day this cut's
corridor copy diverges, the three fork together.

**Eleven sections, four chapters, and the breakdown split around the economics.**

|       |                                                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01    | `the-workshop`: "Hand it to an agent. Trust what comes back." (shared)                                                                                        |
| 02–05 | three ways (v2's, Loop's own) · the curve · hard to steer · the real question (shared)                                                                        |
| —     | Prompt to Loop, `ptl-top` to `ptl-cost` (twelve slides, shared)                                                                                               |
| 06    | `the-money`: "About $27 and an evening. Is it just about the money?"                                                                                          |
| 07    | `the-economics`: creative variety under Meta's Andromeda, ads tested small, a week of craft that does not pay back, headcount                                 |
| 08    | `volume-and-taste`: "AI solves the volume. Who keeps the taste current?"                                                                                      |
| 09    | `the-team`: "Agents run on the team's taste." The layer, the everyday, upstream, the pace                                                                     |
| —     | Prompt to Loop, `ptl-next`: "Now it's a skill. Just ask."                                                                                                     |
| 10    | `in-other-hands`: Laura's comparison as a ledger (June by hand · September by hand · the hardest variant by hand · the same variant by Vesper, the total row) |
| 11    | `close`: "Then it runs without me." (v2's, shared body)                                                                                                       |

**The economics are his note, not a model of it.** Every claim on those four beats is a
sentence from the note: creative variety, ads tested on €50 or a few hundred and scaled
if they work, a stop-motion that takes a week making no economic sense even where craft
is loved, output growing faster than any studio can hire; slop at scale, taste that
cannot stay encoded (the Ghibli week), the creative team more important than ever; the
team writing the layer the agents run inside, supervised rather than babysat, at a pace
agreed with the business. The $27 is the breakdown's own bill; his "€24" is the same
bill converted, and the page keeps one figure.

**Laura's beat is her own record.** First name and role only; the two colleagues her
thread names are not on the page; the tip is her sentence. The screenshot itself is not
in the repo.

**The kinds are the existing ones.** No new section kind: an `interstitial` question,
two `cards` grids, an `interstitial` callout, and `cards` with `ledger` (ADR-098 U2's fee
table, here a time table whose last row is the total on purpose). ⚠ **Four cards per
grid, never three** (`.arc-cards` is two columns at 1280px), and **no kicker, a
two-line title and two-line bodies**: at 1280×720 the format's own air is 100px a side,
and the first cut (three-line bodies, four-line titles) ran the two grids to 856 and
790px. Cut, they are 720 on the nose.

## One section, one record

The owner's rule of 2026-10-02 (CLAUDE.md): content shown by more than one page lives in
one record, read by reference. Building this page hoisted five records:

- **Prompt to Loop** moved from AP's route folder to `components/arcs/prompt-to-loop/`
  (component, generated slides, generated sheet) and its media to
  `public/arcs/prompt-to-loop/`, so a house page does not load from a client's folder.
  `PromptToLoop` takes an optional `slides` run; omitted, the whole breakdown renders, so
  AP is unchanged. `port-prompt-to-loop.py` writes to the new homes (its `ROUTE` already
  pointed at a folder ADR-142 had moved).
- **`THREE_WAYS_LOOP`** (the stages with Loop's own examples) is read by v1, v2 and v3.
- **`THE_CURVE_BEAT`, `HARD_TO_STEER_BEAT`** are read by v1, AP and v3;
  **`REAL_QUESTION_BEAT`** by AP and v3.
- **`whatFollows(eyebrow)`** builds the close from one title, sub and set of actions;
  v2 and v3 each pass their own number.

⚠ **The guard found two copies nobody had listed.** `arcs-registry` now fails any
section that is a word-for-word copy of a shared beat without being the shared object.
On its first run it failed v1's stages, curve and spectrum, which were byte-identical to
the records being hoisted. They read the records now. A guard that compares SERIALISED
sections catches the copy the reviewer did not know about; a guard that names readers
catches only the ones that were already known.

## Verified

- `npm run verify`'s three halves: lint 0 errors, 336 warnings against the 337 ceiling;
  typecheck clean; 158 test files, 2,737 tests.
- Dev server restarted with `.next/dev` cleared (`generateStaticParams` is cached);
  `/arcs/thoughtform/workshop-v3`, `/arcs/ap-hogeschool/lecture`, v1 and v2 all 200 with
  their own titles; the moved media serve from `/arcs/prompt-to-loop/`.
- A headless capture of the tail at 1280×720 and 1920×1247, dark and light: every beat
  one screen, no horizontal overflow, no box spilling its section, every reveal fired,
  no page errors. The run order on the page is the record's: the situation, twelve
  slides, the economics, "Now it's a skill", Laura, the close.
- AP re-captured: the same order, thirteen slides, the film playing from the new folder.

## Next: the restructure the owner asked for (not built)

His note names four movements. The proposal, for his read before the next pass:

1. **The intro, lighter, the Arc as a stance.** One line per corridor caption on this
   route (Navigate, Encode, Build as philosophy, not a framework), and the proof pile in
   his own proof order: push the frontier (films) → write the expertise down (the
   layer) → the team self-sufficient (studio) → layers agents can run (tools). The cost
   is the ADR-139 fork: prototype, sheet and root class together.
2. **The theory, shorter, ending on his question.** Keep three ways and the curve.
   Replace `between` and `real-question` with v2's `person-or-agent` ("Is the workflow
   for a person, or for an agent?"), the line his evals workshop crystallised; "a tool
   and a collaborator at once" undercuts "not human, not a collaborator". Then
   `the-horizon` ("it can only work for hours when it has the context and the evals"),
   which is where Encode lands: the models prompt better than we do; what they need is
   context.
3. **The proof, compressed.** Thirteen slides to about eight (setup with how it runs,
   look with the idea, plan with ingredients and making), and the evals strip ("15 of 15
   runs pass with the skill, +0.71 over Claude without it") lifted into a beat of its
   own: it is the evidence the theory promised. Then the economics and Laura.
4. **The practical side**, from v2, one example (the motion plugin), no switch:
   `made-real`, `when-wrong` (`/skill-feedback`), `get-started`, and one interstitial for
   "build has changed": the configuration is yours and the interface is built on the fly
   (the four questions Claude asked in "The ask" are the example).
5. **The close:** what follows, and for a client fork, the offer.

Cut candidates across the lineage: `ground`, `resource`, `signal`, `the-family`,
`leverage` and the five switched beats; the breakdown now shows what they told.

## Update 1: the configuration before the proof, the practice after it (2026-10-03, owner)

The owner, on reading v3: the page jumps from "how should intelligence take part in
the work?" straight to the breakdown, and "what we're currently missing is really how
intelligence should take part, because of an intelligence configuration". He pointed at
the evals deck's configuration (_Making your agents reliable_, chapter 5) and asked for
the skill as "one piece of work, written down", its evals, and, after the breakdown,
the two-timeline horizon, the plugin and the marketplace, and how to pick a skill.
Asked, he chose **the motion ad end to end** (with tabs for other workstreams, creative
operations first, later), **v2's evals beat**, and **"When it's wrong" and "Get started"
too**.

- **Before the breakdown, three beats on the motion ad:**
  - `configuration-motion` (`questions`): "Answer it per piece of work, in six parts."
  - `the-skill-motion` (`skill-file`): `motion-design / SKILL.md` in Loop AI Studio
    Motion, quoted from the real file.
  - `its-evals-motion` (`list-groups` readout): the plugin's first five cases with the
    skill and without it, 15 of 15 against 4 of 15. This is the same run the
    breakdown's "15 of 15" reads.
- **After Laura, six beats:**
  - `the-horizon` and `get-started` are v2's, hoisted with `FEEDBACK_STEPS` into
    `shared/workshopPractice.ts`. Each page passes its own number; v2's JSON is
    identical before and after.
  - `made-real-motion` (`plugin-board`), `the-plugin-motion` (readout),
    `using-it-motion` (chat, ask) and `when-wrong-motion` (chat, feedback) are the
    motion plugin's own.
- **Twenty sections, five chapters:** The workshop · Three ways · The configuration ·
  The economics · The horizon. Laura's beat left the chapter row; the cap is five.
- ⚠ **THE EVALS BEAT IS A READOUT, NOT A BENCH.** The owner picked "v2's evals beat", and
  its bench draws a draft and a rewrite marked against four checks. For the motion
  skill no real draft-and-rewrite is on file. Inventing a reply for the "without" arm
  is the failure ADR-139 refused for the switch. So the beat draws the record that
  exists: the eval log's run, request by request, with the skill and without it.
- ⚠ **THE SKILL LIVES IN ANOTHER REPOSITORY.** `motion-design` is kept in
  `tensalir/loop-ai-studio` (0.2.0, renamed from `studio-ai-motion` on 2026-10-03; the
  breakdown's ported slides still carry the old name). `skill-file-fidelity` resolves
  it from `LOOP_AI_STUDIO_DIR` or a sibling `../loop-ai-studio` checkout, and skips it
  where neither exists.
  - Run against the file read on 2026-10-03, every drawn line scores 0.71 to 1.00
    against a floor of 0.5. An invented control line scores 0.
- ⚠ **THE PLUGIN BOARD'S CENTRE IS NOT THE MOTHER.** The motion plugin has none; its
  eval log names that gap. The chip is what the skill carries instead: the scripts
  that render, mix and measure the cut.
- **The workstream seam is in the ids.** Every example-specific beat is suffixed
  `-motion`. The day a second workstream is authored, each becomes the first panel of
  a `worked` group (ADR-139's switch), with no other change.
- **Verified:**
  - Lint 0 errors, typecheck clean, every unit test green.
  - The new beats were captured at 1280×720 (dark) and 1920×1247 (light): no page
    errors, no horizontal overflow, every reveal fired.
  - At 1280×720, "When it is wrong" runs 11px past one screen and "Get started" runs
    30px past it (v2's three-card grid lands two and one). Both are v2's own heights.

## Update 2: why the two you write matter, before the breakdown (2026-10-03, owner)

The owner, after U1: what is missing after "Answer it per piece of work, in six parts"
is _why_ the skills and evals are so important, "so 'From one prompt to a 10-second ad'
has a bit more setup". It replaces "A skill is one piece of work, written down" there.
He took three slides from the Moira second session (_From a prompt to an agent you can
trust_): the leverage slide, the horizon and the labs betting billions.

- **The setup now reads:**
  1. configuration
  2. **`leverage-motion`**: "Two of the six nobody can write for you." The board's two
     lit plates opened up. Each card's line is the board's own answer for the ad; the
     rows are the deck's (rules, examples, sources; cases, checks, gates).
  3. **`the-horizon`**, moved up from the end. Not a chapter here.
  4. **`signal`**, "The labs just bet billions…"
  5. its evals
  6. then the breakdown

  ⚠ The deck's title says "the most leverage". The page keeps v1's and v2's "Two of the
  six nobody can write for you": "leverage" is on the voice skill's post-2022 list. The
  sub says it instead: "that is where a team steers the intelligence most".

- **The skill file moved, it was not deleted**: `the-skill-motion` now sits between
  "Made real" and the plugin, so the readout's "the skill you just read" still holds.
  "Made real" takes the horizon's chapter slot: The workshop · Three ways · The
  configuration · The economics · Made real.
- **Twenty-two sections.** The breakdown's thirteen slides render around them.
- ⚠ **ONE RECORD, AND THE GUARD FOUND A FOURTH READER.** The four clippings were typed
  identically in v1 and v2. They are `shared/marketSignal.ts` now, read by v1, v2, v3
  and the class-one deck. The class-one copy was found by the new registry pin on its
  first run. Each page authors its own head and caption. v1, v2, the class deck and
  AP serialise identically before and after.
- **Verified:** lint 0 errors (336 warnings, ceiling 337); typecheck clean; 2,764 tests
  green; the setup beats one screen each at 1280×720 (dark) and 1920×1247 (light), no
  page errors.
