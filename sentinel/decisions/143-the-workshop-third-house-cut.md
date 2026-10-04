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

## Update 3: the intro leads into the workshop (2026-10-03, owner)

Built from `docs/plans/workshop-v3-intro.md`. V3's intro (About → eras → corridor →
proof pile) still talked like the homepage. It reads as a story now: I am an
intelligence architect; this is how I work, the Arc; this is how I did it at Loop; now
we go in depth.

- **V3 only.** V1, V2, the AP lecture and the homepage keep today's intro, checked as
  DOM text on `/` and `/arcs/thoughtform/workshop-v2`.
- **ONE RECORD**: `lib/arcs/content/shared/workshopIntro.ts` exports `WORKSHOP_INTRO`
  (`about`, `stations`, `signal`, `proof`, `opening`), pure data, so the
  Suri cut and later cuts read it by reference. The Arc keeps its own words (Navigate /
  Encode / Build, "intelligence configuration"), overriding the Suri sprint plan's list
  for this page.
- **Four seams, each the identity when nothing is passed:**
  1. **About**: `workshop-v3/about.ts` `replaceAboutBio` rewrites the bio paragraphs
     at parse time, keeping the first one's attributes; it THROWS on a miss so the old
     About can never ship silently. The role line is unchanged (the eras name the
     present).
  2. **Thesis**: none. The plan's thesis ("My material sits between tool and
     collaborator") was built and taken back the same day (owner, on the page:
     "restore the copy from the home page"); V3 reads `extractV7Text()` unchanged.
  3. **Captions and signal**: `V7CorridorText.copy?` → `lib/home-v2/corridorCopy.ts`
     (pure, `resolveCorridorCopy`) → `CorridorCopyContext`, provided once by
     `HomeCorridor`. Its five readers (`CorridorStationHeaders`, `CopyAnchors` →
     `StationTitle`, `MobileEpilogueSignal`, the no-WebGL fallback) read the context
     instead of `stationById` and the constants. With no override it hands back the
     corridor map's own `content` objects BY REFERENCE and `DEFAULT_SIGNAL_COPY`
     (which now holds the signal title's whole history, moved from
     `CorridorStationHeaders`). The phone title derives from the desktop string
     (`phoneSignalTitleHtml`, `<br>` → space), so the two can no longer drift. The
     ticker is a switch; V3 hides it (beat 09 shows the same news). V3's own
     signal line ("WE DID IT FIRST AT LOOP EARPLUGS…") was built and taken back
     the same day (owner: it read as AI slop); it keeps the homepage's title and
     button, so `signal` is `{ ticker: false }`.
  4. **Proof**: `workshop-v3/WorkshopProof.tsx` maps `proofStackTracks()` and replaces
     `card.lede` only (`ArcProofCard`'s record-spread precedent). V3's portals import it
     in place of V1's.
  5. **Opening**: `WORKSHOP_INTRO.opening` spreads `HAND_IT_TO_AN_AGENT` with a new sub
     only; the registry's readers list is v2 and AP now.
- **Concise claims and the lit card** are rules in V1's route sheet (§5), scoped to
  `.tw-root[data-tw-cut="v3"]`, winning on specificity (ADR-141 U1). The claim sentence
  is sr-only at every height. The last card (`WORKSHOP_INTRO.proof.lit`) takes the lip
  at full `--gold-line`, `--pf-bloom-a` .24, the corridor title's phosphor on its name,
  and the station mark's glow, in DARK ONLY (`:root:not([data-theme="light"])`); no
  animation, no `filter`. ⚠ `--con-mark-glow` is declared on `.fl-con`, which the card's
  tab rail sits outside, so the value rides as the `var()` fallback. ⚠ The claim
  glyphs take NO halo: they are pixel drawings, a box-shadow squares them off and a
  drop-shadow is a filter.
- **Guards**: `workshop-intro.test.ts` (copy law, lede bound, one `<br>` per caption,
  the opening changes only its sub, the About rewrite on the real prototype and its
  throw, the pile replaces only ledes, the lit selector matches the record),
  `corridor-copy.test.ts` (the homepage identity by reference, the merge).
- **Verified**: lint, typecheck, 2,775 tests green. DOM text on V3 (every intro string,
  no ticker, ledes), `/` and V2 unchanged; computed styles for the claims and the lit
  card in dark and light. ⚠ The beat-by-beat screenshot walk (1920×1247, 1280×720,
  390×844, both themes) was NOT run here: the browser pane was hidden, which freezes
  rAF and transitions (memory: corridor visual verification); shoot it headed.

## Update 4: the copy hands from beat to beat (2026-10-03, owner)

The owner asked how the copy should flow from "Hand it to an agent." onward. Each
beat read fine alone; the breaks were at the seams. Copy only, V3 only (owner: "v3
only"), no structure change.

- **03 → 04**: the curve ended on price and the next beat opened on steering. 03 is
  now "Each release finishes longer work _on its own._" (the price moves into its
  sub; the money's own beat is 11), and 04 turns on that word: "The longer it runs,
  _the harder it is to steer._", its sub naming the tool and the collaborator.
  Both are forks in `WORKSHOP_INTRO` (`curve`, `steer`): the shared records with a new
  head, the figures by reference. V1 and the AP lecture keep the shared heads;
  `arcs-registry`'s readers of `the-curve` and `between` are v1 and AP now.
- **06 → 07**: 07's sub repeated 06's "set up once, for everyone"; it now opens on the
  two parts the team writes and names them the context and the evals, so 08's title
  lands, and ends "Written down, what it knows becomes a skill."
- **10** says "This ad's skill comes with its own tests" (a skill was used before it
  was defined). **12** opens "That is the real change." so it answers 11's question.
  **16** ends by handing to 17 ("Here is the first of them, the skill."). **17**
  said "the ad that follows" while it sits after the ad since U2; it says "the ad you
  just saw".
- **01** (same day, owner): the opening's title is "How to work with _a new kind of
  intelligence._"; the agent line moves into the sub ("One you can hand work to, and
  trust what comes back."), so 02 still follows. V2 and the AP lecture keep "Hand it
  to an agent." (`WORKSHOP_INTRO.opening` forks title and sub now).
- **01** loses its sub (owner: "don't think we need the paragraph"); the title alone
  opens the day. And the arcs' display ramp grows slower (owner, on a MacBook Air):
  every arc's titles land on their old caps at 2560 and run about a quarter smaller
  at 1470 (`arcs.css`, `.claude/rules/arcs.md`).
- **05** loses its subline on V3 (owner): the question stands alone
  (`WORKSHOP_INTRO.question`); the AP lecture keeps the shared beat whole.

## Update 5: the era title becomes the thesis title (2026-10-04, owner)

The owner: "I want the titles from the era section (eg the intelligence architect)
to glitch morph and move into 'AI sits somewhere between tool and collaborator'
from the next section." V3 only; v1, v2 and the AP lecture call the same hook
without the option and are unchanged.

- **One leaf per line, one writer.** `useWorkshopFlow({ titleMorph: true })` (the
  v3 portal) stamps `data-tw-title` on `.tw-root` while the era's `p` is in the
  seam, and `flow/seamTitleCarrier.ts` carries the title on a fixed layer appended
  to `.stations` (z 6: above the era at 4 and the corridor at 3, under the grain
  and the HUD). Each leaf starts on the era title's rendered line (`textRuns` on
  the decode's live span, so the glyphs are the title's own), travels to the
  thesis title's line, and its face eases from the era's (display caps, 0.04em,
  the gold glow) to the thesis's. The house decode (`captionScramble`, scrubbed,
  so scrolling back un-morphs it) turns one string into the other, lines on a
  cascade; a line pairs by index, so the era's one line becomes the thesis's
  first and the second decodes in from blank. The thesis title's `em` words are
  MARKS on the leaf: gold ink and weight from the start, the wash rising as each
  word is spelled (`segmentResolved`), so the landing frame is the real title's.
- **The clock** (`flowClock.ts`): `TITLE_GLIDE` [0.74, 0.96] eased, starting with
  the exit and the mark's TRAVEL; `TITLE_DECODE` [0.74, 0.93] linear, so the line
  is settled for the last stretch. The leaf holds the seat from 0.96 to `p` 1
  while the square finishes opening round it, and the real title takes over when
  the flow is done.
- **The sheet** (v1's rule 1b, keyed on the stamp): the mast holds its seat (its
  exit translate would move the box the leaf was measured off; its one child is
  hidden), and both real titles hide by `visibility`, which keeps their boxes
  for the measure. The thesis title is therefore no longer revealed by the
  square: the leaf lands on it outside the copy layer's mask.
- **Measured** (headed, real scrolls): the landing hand-over is within 0.01px on
  every character at 1920×1247, 1440×900 and 1280×720, in both themes; on the
  next frames the corridor's fixed → sticky swap moves the real title 0.47–0.66px,
  the drift ADR-138 records. The start lands on the era title's line with the
  same face; the first frame already shuffles the line's first characters, whose
  widths differ, so the rest of the line shifts by up to 8px as the glitch begins.
- ⚠ **On a straight scroll the title at the exit is the LAST era's** ("The street
  organiser", 2016): the band runs 2026 → 2016, so "The Intelligence Architect"
  morphs only for a reader who picked it. The morph takes whatever title is
  showing, and re-measures if an era is picked during the exit.
- **Guards**: `workshop-flow.test.ts` (the windows' order against TRAVEL and OPEN;
  each line says its outgoing text before its window and its incoming text at 1;
  a scrambling line keeps its cells; the segment split; the wash's ramp; the
  computed colour and shadow parsing).

## Update 6: the intro builds up to the workshop (2026-10-04, owner)

The owner on the intro: hero, About and the eras work, but the thesis and the Arc
still talk like the landing page. "Navigate · Encode · Build" is perfect; the text
around it sells, gives away what the workshop builds up to, and draws Build as it
was first devised (building interfaces), where Build is now building for agents.
"We embed in your team until it runs without us" is a pitch on this page. And the
proof cards' "LOOP EARPLUGS · BUILD" maps the proof onto one phase of the Arc,
which is a philosophy applied organically, as a loop, not a funnel the projects
were filed into. V3 only; every seam is the identity elsewhere.

- **The rulings** (picked from drafts): the signal is "EMBEDDED IN THE WORK /
  UNTIL THE TEAM IS SELF-SUFFICIENT." (the practice, said as what the work is,
  never "we … your team"); the Build column is the agents the layer runs; the
  thesis paragraphs, the glyphs' words and the hero are reworded too; "· BUILD"
  comes off the cards on V3 only.
- **The copy** (all in `WORKSHOP_INTRO`):
  - Hero: "A new kind / of intelligence." over "A workshop on how it behaves, what
    it needs from your team, and how to hand it real work." 01 answers it.
  - Thesis (title kept, the era title morphs into it): "Working with it well takes
    practice, and it can be learned." / "I do it in three moves, and make them
    again for every piece of work." The second is the one place the loop is hinted.
    The old first paragraph asked beat 05's question early; the second was the pitch.
  - Glyph words: See · Crystallize · Ship → Learn · Write down · Hand over.
  - Captions point at the day's three parts without naming skills, evals or the
    configuration (06 reveals that term, which the U3 Build caption gave away, and
    the "Part one / two / three" lines contradicted the page's order since U1).
  - Build column: "03 / Agents / what runs on the layer", one agent per piece of
    work on the left, row for row, none lit: Pricing · Review · Copy · Support ·
    Reports. The homepage's column (Memory · API · Model · CLI · Agent, Model
    lit) read as "output: model".
  - Card 3's lede is evidence now ("Three months after the films, every designer
    in the studio was making their own ads with AI."), because the signal and the
    card's title already say the team runs it alone.
- **Two seams added to the corridor copy** (`CorridorCopyOverride`):
  `phaseSubs` (merged over `DEFAULT_PHASE_SUBS`, See / Crystallize / Ship) and
  `stack` (the right column's head, five labels and the lit index, passed through
  and ABSENT by default, so `CopyAnchors` keeps the scene's labels and `corridorCopy`
  never imports the scene). The item ids, and so the world anchors, never change.
  The thesis paragraphs need no seam: V3's page spreads them over
  `extractV7Text().thoughtform`. The hero is a parse-time rewrite,
  `workshop-v3/hero.ts` `replaceHeroCopy`, which throws on a miss like `about.ts`.
- **The cards**: `ProofCard` letters the client alone when the phase is EMPTY
  (one string, `kicker`); V3's `workshopV3Tracks()` empties `stamp.phase`. Every
  record carries "Build", so the homepage, Trinny and Pandora print what they did.
- ⚠ **ONE SHORT WORD A CHIP, AND THE COLUMN IS TIGHT ON EVERY ROUTE.** "Pricing
  agent" ran the fan's lowest chip onto the right rail at 1920×1247. Measured over
  the Build window (headed, real scrolls): at 1280×720 and 1470×956 the homepage's
  own chips cross the rail in motion (its "Agent" by 79px) and sit on the SECTOR
  and LOCAL readouts at rest at 1470×956. V3's labels stay within two characters of
  the homepage's at each row ("Reports", not "Reporting", which reached the rail
  line at 1470×956). The clamp in `getStackColumnLocalX` is the open item: its
  "~130px chip never reaches the rail" does not hold at laptop sizes for either page.
- **Guards**: `workshop-intro.test.ts` (the copy law over every new string, the
  hero inside `HERO_MEASURE`, the signal's one break and one accent and its phone
  label, five unique unlit chips, the hero rewrite on the real prototype and its
  three throws, the pile changes only the lede and the phase),
  `corridor-copy.test.ts` (the defaults by reference, no column unless passed, the
  merge).
- **Verified** headed with real scrolls: every beat at 1920×1247 dark and light,
  1470×956 and 1280×720 dark, 390×844; `/` keeps See / Crystallize / Ship,
  "Intelligence / what you rent" with Model lit, and the homepage's signal.
