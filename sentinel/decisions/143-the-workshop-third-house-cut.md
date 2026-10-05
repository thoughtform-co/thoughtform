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

## Update 7: the Thoughtform equilibrium opens the day, the Arc ends on its own grammar (2026-10-04, owner)

The owner's Wispr note "Thoughtform workshop V3" (2026-10-04) and three asks: the
signal line "needs to follow the same flow" as the stations so it ends the Arc; a
new section after the hero, "super clean, super visual", for the Thoughtform
equilibrium (instant ideas are no longer the edge; agents run the DOWNSTREAM,
people go further UPSTREAM, what works upstream is encoded and becomes
downstream); and a Pensieve GIF where the page talks about skills and evals.
V3 only.

- **The signal** is his line, in the stations' grammar (`NAVIGATE THE
INTELLIGENCE.` · `ENCODE THE CONTEXT.` · `BUILD ON THE LAYER.`):
  `<em>EMBED</em> IN THE WORK<br>TO MAKE THE TEAMS SELF-SUFFICIENT.` The verb takes
  the gold, so `workshop-intro.test.ts`'s accent rule changed from "the whole second
  line" to "the verb that opens the line".
- **The opener is a station spliced in at parse time**
  (`workshop-v3/equilibrium.ts` `insertEquilibriumStation`, after `#hero`; it
  THROWS on no hero, a hero not followed by `#about`, or a second insert). ⚠ **An
  exception to ADR-139's share rule, recorded**: one station before the About is the
  whole divergence, so v1, v2 and the AP lecture read the prototype untouched and
  every rule is `.tw-root[data-tw-cut="v3"]` in the route's own sheet
  (`equilibrium.css`), winning on specificity. The fork is still the answer the day
  the corridor diverges.
- **A curtain chain, on view timelines.** Rule 1a held the About on
  `animation-range: 0 100dvh` of the ROOT scroll, which only holds while the About
  starts one viewport down. Now the hero (z 6) lifts off a held opener (z 5, 150svh,
  a 50svh dwell), which lifts off a held About; both holds ride their OWN station's
  `view-timeline` on `entry 0% entry 100%` (the musings and footer precedent), so no
  arithmetic follows a station's position. Measured headed at 1920×1247, 1470×956 and
  1280×720: each held stage sits at 0 (±0.5px) through the travel that reveals it.
- ⚠ **THE FIRST CUT WAS REFUSED: "I want actual three js 3D object like holo."** It
  drew a binary star on the workshop's orthographic stage (`holo-stage`, the
  isometric technical drawing) because that engine took the least new code; his
  pointer was ADR-080's perspective object. **The object is ADR-080's family**:
  `components/holo-program/equilibriumGeom.ts` (pure, three-free: the contour-sliced
  core, UPSTREAM above tilted up and open, DOWNSTREAM below tilted down and tight,
  graduated bands, one bright gold arc gliding round each system, gold motes running
  evenly and fast round the downstream rings and unevenly and slow round the
  upstream one, motes falling down the axis from one to the other, a faint level and
  floor), `HoloEquilibriumScene.tsx` (drei `Line` drawn on by `instanceCount`,
  `LineSegments` by `drawRange`, the dust shader for every mote) and
  `HoloEquilibriumCanvas.tsx` (`HoloProgramCanvas`'s shell: a real perspective camera
  at one rest pose, OrbitControls with zoom and pan off and the drag clamped to a
  readable band, bloom, grain), reached through `workshop-v3/EquilibriumMount.tsx`
  by `next/dynamic` only.
  - ⚠ **The fallback IS the hologram at rest**: the server projects the same
    geometry through `eqProject`, and a test pins `eqProject` against a real
    `THREE.PerspectiveCamera` at the rest pose to three decimals. The words are
    seated from that projection and, once live, follow the object through an anchor
    channel (`--ax`/`--at` written on the same DOM words; a word hides when its point
    turns out of view).
  - ⚠ **Nothing flickers**: ADR-080's per-ring dropout and breathing are not in this
    scene (the guard reads the code, not its comments), no chromatic aberration
    (ADR-080 measured it as confetti on fine line work).
  - ⚠ **No grain on paper**: the Noise pass blends by SCREEN, which only lightens, so
    on parchment it lifted the canvas ~0.8 of a unit over the page and its box read
    as a rectangle (measured; 0.05 after). The canvas slot's edge is also feathered by
    a mask. Light is the ink drawing (`HOLO_LIGHT`); every baked shade fades toward
    the GROUND, never toward black, on paper.
  - The dust takes the structure's tone: on dark the machine rung is a gold, and
    gold dust competed with the gold flow.
- **The holo-stage scenes now idle off screen.** Both stage scenes invalidated every
  frame whenever they were not `still`, so the canvas pump's on-screen gate never
  stopped anything and every stage figure on a page rendered for as long as the page
  was open (v3's tail has two). The scene keeps itself drawing only through the
  arrival or a group's travel; continuous life is the on-screen pump. Pixels are
  unchanged.
- **The Pensieve is a slot.** `interstitial` gains an optional `clip` (`ArcClip`:
  `src`, `poster`, `alt`), drawn by `ArcClipLoop`: muted, looping, played only in
  view, never under reduced motion (the poster stands) — an exception to arcs.md's
  "never autoplay", recorded there. `arcs-registry` requires a set clip under
  `/arcs/`, on disk, a video, with an alt. V3's `08 · pensieve` ("Out of their
  heads, and into a skill.") follows "The two you write" with NO clip, by his choice:
  it is film footage he supplies, cut to a silent loop and checked for flashes when
  it lands. Every later beat renumbers; the close is 23.
- **Guards**: `workshop-v3-equilibrium.test.tsx` (the seam and its throws, the
  station's copy and slots, the rest projection against three's camera, the two
  systems right-handed and tilted opposite ways on screen, the encoded difference,
  gold on the flow alone, everything but the fading floor inside the frame, no
  flicker path, no grain on paper, the dynamic reach, the copy law, the sheet's
  scoping, both view timelines, the Pensieve with and without a clip); the v3 test's
  journey order, setup run and close number; `arcs-registry`'s clip rule.
- **Verified**: `npm run verify` (lint 336 warnings against 337, typecheck, 2,811
  tests). Headed captures at 1920×1247, 1470×956 and 1280×720, dark and light; the
  phone (390×844) and WebGL-off desktop show the static object with the words as a
  list; the signal renders with its gold verb. ⚠ **Not measured**: the corridor's
  quality governor with a second live canvas on the owner's MacBook Air; if its
  resolution drops after the opener, a v3 option can write the prelude's level 0
  while `#equilibrium` covers the frame.
- **Left for him**: the opener's copy (eyebrow, sub, the three words) is a draft to
  pick from; 01's title toward the client and client-specific examples (the note's
  item 1) are the next pass.

## Update 8 — the opener's object is one instrument on one axis (2026-10-04, owner)

His read of U7 on a phone: "I want you now to create shapes that are closer to the
holo and the one we had already created a while back. I don't want the sphere and
orbit you built for this section … push yourself creatively." The U7 object was a
contour sphere between two tilted ring systems: an atom, the one shape neither
reference draws. **The object is redrawn in the two references' own vocabulary, on
one axis, read left to right**; the station, the copy, the curtains, the words, the
fallback pipeline and the canvas shell are untouched.

- **THOUGHT** is holo.ui8's crumpled contour mass: fourteen slices of a lumpy body,
  each a closed outline facing the axis (`thoughtSlices`), three small inner loops
  (`thoughtIslands`, the reference's kinks), held in a graduated CRADLE (two partial
  arcs with tick bands in a plane leaning across the slices', one bright dawn arc,
  the reference's highlight) and tracked by a RETICLE, where the Upstream word sits.
  Its girth narrows and its crumple calms toward the gate (`thoughtGirth`,
  `thoughtWobble`), and live, its outline DRIFTS: the wave phases advance with time,
  written in place every frame (`fillThoughtSegments`, no allocation). The thought
  is the only thing on the object whose shape moves.
- **ENCODE** is ADR-080's plated collar, in gold: a gold inner ring with a gold
  highlight gliding round it, a ring of fourteen plates, an outer ring, a toothed
  fringe, a horizon line across it broken where the axis passes, holo's triangle
  marker above it (the Encode word), and under it holo's bar with its lit segment
  centred and a FULCRUM standing on it, pointing up at the gate. The balance is
  drawn: the whole instrument rests on that point.
- **FORM** is ADR-080's coaxial stack: seven identical rings at one pitch along the
  axis, every other one toothed and the rest carrying a dashed inner ring, two rails
  tying them into one body, a ruler under them (a tick at every ring, three
  between), and a drop to the floor at the far end, where the Downstream word sits
  clear of the rings.
- **The flow**: twenty gold motes drift slowly through the thought, wandering off
  the axis, find it as the mass calms, pass the gate and run down the stack at one
  pace (`flowPoint`: the slow upstream leg is what crowds them there and spaces them
  evenly downstream; a per-mote fade so nothing pops at the axis's two ends).
- **The camera** looks down the axis from the front left (azimuth −46°, elevation
  12°, a 22° lens at 12.4): the thought near and large, its slices nesting like the
  reference's contours, the stack running off into depth (ADR-080's own negative
  yaw). A first try from −33° read as a cabbage beside a spring, because the slices
  were seen almost edge-on and the rings crowded; the drag stays inside ±18° of
  rest, never past the axis.
- **Gold buys one thing, the encode**: the gate's ring, its gliding arc, the axis
  and the motes (`eqPolylines`' gold role is `axis` · `gate-arc` · `gate-ring`,
  pinned). The cradle's highlight, the marker, the bar's lit segment and the fulcrum
  are a BRIGHT role in dawn (×1.7 on void so bloom takes them; full ink on paper).
- **Still no flicker**: every motion is travel (the drift, the two glides, the
  flow). Measured headed at 1470×956 over six seconds: the figure's mean luminance
  moves 18.57 → 18.41 while about 4 % of its pixels change. On paper the far
  shade's floor is 0.44 (0.28 on void), since dark ink on parchment reads weaker
  at equal alpha (ADR-063 U2).
- **Guards** (`workshop-v3-equilibrium.test.tsx`): the rest projection against
  three's camera on points of all three parts; one axis read left to right (thought
  before the gate before the stack; every stack ring a true circle on the axis; the
  words in reading order on screen); the encoded difference (the thought crumpled at
  its tip and calm at the gate, its slices not circles, the stack at one pitch); the
  live drift written from the same numbers as the static drawing and moving; the
  flow crowded upstream, evenly spaced and on the axis downstream; gold on the
  encode alone; everything but the floor inside the frame.
- **Verified** headed at 1920×1247 and 1280×720 dark and 1470×956 light; the phone
  (390×844) and the WebGL-off desktop show the same object, static, with the words
  as a list.

## Update 9 — a second figure: the river of data, in the lab (2026-10-04, owner)

His read of U8 ("this looks much better"), then: "I wanted to create like a new
variant … to visualize the upstream and the downstream, I'm thinking of like a
river of data, like a sort of a diorama isolated, super clean, a bit tilted,
where you really see the upstream and the downstream, like a digital
artifact." **A second figure behind the same station, judged in a lab; the live
page still shows U8's instrument.**

- **The river** (`components/holo-program/equilibriumRiverGeom.ts`, pure;
  `HoloRiverScene.tsx`): one block of terrain, cut clean, floating over its
  dashed shadow, seen from the front right and above (azimuth 30°, elevation
  27°) so its long side runs across the frame and its top is open to the eye.
  UPSTREAM is contoured high ground at the back left (marching squares over a
  ridged heightfield and one massif), three tributaries branching out of it
  into one river that winds down a valley; ENCODE is a gate across the river
  where the valley opens, ADR-080's collar as an arch (plates, teeth), the sill
  gold, a marker on a stalk above it; DOWNSTREAM is a plain ruled into even
  plots, where the river splits into four straight channels that run out
  through the cut face. The block's faces carry strata and a graduated plinth;
  its two cut corners sit on the house diagonal, the right end's upper corner
  and the left end's lower one (ADR-065).
- **The water is the data and the one gold thing**: four routes (the source and
  each tributary, down the river, out along one channel each), ten motes a
  route, slow to the gate and fast after it, so they crowd on the meanders and
  run at one pace down the channels.
- ⚠ **Every river only falls, by construction**: the relief stands up only
  upstream and is held flat along every watercourse, so each valley floor is
  the base slope, which falls with `x`, and every course's `x` only grows. The
  test walks every sample of the river and the tributaries.
- ⚠ **Contours stop at the gate**: a plane's contours are only the channels'
  grooves (little loops along each channel, which read as noise); past the gate
  the plain is the plots.
- **One station, two figures.** `equilibriumFigures.ts` (pure) is the record
  each reader takes a figure from: the station's markup (`equilibriumStationHtml(copy,
variant)`, which stamps `data-eq-variant`), the mount (which reads the stamp)
  and the canvas (its camera, drag band and scene). The two figures share
  `eqCamera.ts`, the rest camera written out, pinned against a real
  `THREE.PerspectiveCamera` for both. `EQ_FIGURE_LIVE` is `"instrument"`:
  promoting the river is that one constant.
- **The lab**: `/test/equilibrium-lab?v=river` (and `?v=instrument`, `&theme=light`)
  renders the real station markup with the real mount, armed at once. ⚠ The lab
  hydrates the theme store itself: on the page the theme switch does it, and
  without it the canvas painted the dark palette on parchment. The switch is a
  full load, since the canvas is a nested root in the station's slot.
- The shared mote shader moved to `holoDustShader.ts`; the instrument's pixels
  are unchanged.
- **Guards** (`workshop-v3-equilibrium.test.tsx`): the river's rest projection
  against three's camera; every river and tributary only falls, the source well
  above the gate, the gate above the mouth; contours inside the footprint and
  short of the gate; the two cut corners on the diagonal; gold on the water
  alone; each route crowded upstream, one pace downstream, leaving through the
  cut face on its own channel; everything inside the frame; the words in
  reading order; the static drawing under 72 KB; the station stamping its
  figure, and the live page on the instrument.
- **Verified** headed at 1920×1247 and 1280×720 dark and 1470×956 light in the
  lab; the phone (390×844) shows the static diorama with the words as a list;
  the live v3 page still renders the instrument.

## Update 10 — the mark in the gate, a full turn, holo's trackers (2026-10-04, owner)

On the instrument (still the live figure): "put the brandmark inside the gold gate
… I like how the upstream visual resembles a brain, which is correct … make sure
we can rotate it 360°, and let's use the same type of labeling as holo.ui8.dev,
and a bit of a bokeh / bloom effect like holo." The brain is untouched.

- **ENCODE is the mark.** The corridor's volumetric brandmark (ADR-080's centre,
  `VolumetricBrandmarkArtifact`, `entrance="off"`) seated in the gold gate, turned
  a quarter so its face looks upstream, at `EQ_MARK.half` (0.74 world units, inside
  the 1.02 gold ring; the artifact fits its larger side to 1.74 at scale 1). On its
  own its particles read as a cloud of dashes, so its crisp OUTLINE is drawn too,
  gold, the same lines the static drawing projects (`markLines`). The horizon
  across the gate is gone (the mark fills it) and the axis breaks round the mark
  (`EQ_AXIS.gap`); the motes still pass through it. The paths are ONE record now,
  `lib/brandmark/brandmarkPaths.ts`, byte-equal to `public/logos/Thoughtform_Brandmark.svg`
  and read by `ThoughtformSigil` as well (it held its own copy).
- **A full turn.** `EQ_DRAG.azimuthDeg` is infinite (OrbitControls unclamped in
  azimuth, a quicker hand so a full turn is one drag); the tilt stays a band.
  ⚠ **Depth is FOG now, never baked.** The near/far shade was baked at the rest
  pose, which a half turn inverts; linear fog toward the ground fades whatever is
  far from the eye at that moment. ⚠ drei's fat lines carry fog's shader code but
  leave `material.fog` off; every `Line` passes `fog`.
- **holo's labelling.** Each word is a TRACKER: four corner brackets on a point ON
  the object (the brain's crown, the gate's marker, the far ring's top; the
  reticle and the floor drop are gone), and above them the meaning over the
  readout line, `UPSTREAM · X0.31 Y0.27 · LOCK` (the reference's own grammar; the
  numbers are where the point is on the frame, written live as it turns, through
  one formatter, `trackerReadout`, on the server and in the mount). One callout
  reads the bearing, `AZ 314.0° / EL 12.0°`, on a leader. A ground halo (the
  page's own `--void-rgb`) keeps the words legible over line work in both themes.
  ⚠ **Turned, readouts collide**: the mount places each tag on its own side, then
  the left, then lifts it on a hairline, keeping clear of every other tag AND
  every other tracker's brackets (the first cut only checked tags against tags,
  and Upstream's line ran through Encode's marker at 1470×956).
- **Bloom and bokeh.** The instrument's bloom is its own (`EqFigure.bloom`:
  intensity 1.05, radius 0.86, threshold 0.56 on void; paper keeps 0.97). Twelve
  soft out-of-focus discs (a body and a faint rim, never a hard disc: the first
  cut read as moons and sat on the canvas edge) part as the object turns; the dust
  is denser (900). Nothing pulses: the flicker guard now bans a scale on the clock
  rather than any scale, since the mark's one arrival settles by scale.
- **Guards**: the paths equal the asset's; the mark inside the gold ring in the
  gate's plane; the free turn, fog on, fat lines fogged; the trackers on the
  object; the readout and bearing formats; the station's trackers and bearing at
  rest. Shot headed at 1920×1247 (rest and turned 140°, 327°, dark and light),
  1470×956 and 1280×720 on the live page.

## Update 11 — the opener bare, the homepage's thesis, the two plates opened up (2026-10-05, owner)

Five notes on v3, and the four that apply carried to the Suri lunch-and-learn
(it reads the same record; it has no opener and no Pensieve).

- **The opener sits bare on the page** ("remove the background and grid; i want
  this to blend as elegantly as possible with the rest of the site. don't think
  we need the text either"). The station letters no head: the eyebrow and the
  sub leave the record, the title stays as the station's `aria-label`. What read
  as a background was the CANVAS, not the station (whose colour is the page's
  own): its painted ground, grain and vignette in a box, the floor grid, its own
  dust and bokeh. `HoloEquilibriumCanvas` takes `bare` (the live instrument
  only; the lab's river keeps its ground): `alpha: true`, no `<color>`, grain
  and vignette at zero, and `HoloEquilibriumScene` draws no floor, dust or
  bokeh. The static drawing drops the grid with it, so the swap still moves
  nothing. ⚠ **The bloom drew the box back**: at the figure's radius 0.86 the
  widest mips lifted the whole slot ~1.6 levels even 100px off any line
  (measured canvas shown against hidden), so `BARE_BLOOM_RADIUS` is 0.5 and the
  edge feather widens to the drawing's own pads (15 % across, 18 % / 11 % down);
  off the lines the canvas now adds 0.0. ⚠ **THE STATION STAYS OPAQUE.** A
  transparent station was built and measured first: the corridor's parked mark
  (the flow's prelude, raised on/off as the era stage engages) switched on behind
  the leaving object, a second brandmark in frame. The opaque void is the page's
  colour, so it shows no edge, and it keeps the curtain chain as built.
- **The thesis is the homepage's again** ("restore copy from homepage"): the
  record carries no `thesis`, the two cuts stop spreading one over
  `extractV7Text().thoughtform`. The glyph words stay this cut's own (Learn ·
  Write down · Hand over).
- **The signal keeps each authored line whole** ("make sure self-sufficient is
  on the same line"): its second line runs 838px at the 42px cap against an
  820px block, so it broke after the hyphen. PP Neue Montreal has no U+2011, so
  the fix is the box: v1's sheet §6, `[data-tw-cut="v3"]`, the block at
  `min(90vw, 960px)` and the title `nowrap`. The phone already keeps the word.
- **The two you write are the board's plates, opened up** ("should match the
  design of those cards in the section before, but … an expanded version";
  "The Context and The Evaluations titles are too small"): `cards` takes
  `plates: { tag }` (`ArcCardPlate`): the board's TR + BL pair cut, gold wash,
  gold ring, rule stopping at the cut and `You write this`; the part's name is
  the heading (24 to 38px, sans, `--weight-lit`), its question a dim line under
  it, then the answer and each row as a mono key beside a sentence. The board's
  plate tokens are declared once for both (`.arc-q, .arc-cards--plates`). v2's
  beat is untouched.
- **"Out of their heads, and into a skill." is gone**, and the beats after it
  renumber (08 · Why it needs checks … 22 · What follows). The `interstitial`'s
  `clip` slot stays, tested on a probe.
