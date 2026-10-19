# /test/proposal-swarm-v2 — the case dossier

A copy of the swarm proposal (`/test/proposal-swarm`) in which the four job
panels (06–09) give way to a case template: each case told the way Prompt to
Loop told one ad, the chapters in the order the work happened, with the words
held on the left and one framed figure per chapter scrolling on the right.

```
http://localhost:3031/test/proposal-swarm-v2
```

`npx next dev --webpack -p 3031` from the worktree `C:\wtcase` (branch
`lab/proposal-swarm-v2`, off `origin/main` `cb95313c`). Read the port off the
running server.

# Round 01 (2026-10-17)

## Why

The owner, 2026-10-17: "What I like about the Loop Earplugs and how we got
there is that we have a sticky element on the left and something on the
right. I want to repurpose that to show my different cases … we now have
these standalone cards on the proposal swarm but I don't think it really
conveys the narrative that I want to tell. What I really liked about the Loop
prompter loop is that it really clearly shows the breakdowns and also how the
model thought … think about building a flexible template that we can use for
creative production, creative ops, etc."

His answers the same day: three cases (Prompt to Loop, the Samako autumn
films, the Suri asset library), Suri drawn in code only, a short cut of five
or six chapters a case with every chapter behind a switch, and all three cases
together after the second line, its sentence adjusted by one word in this lab.

## What it does

- **The page.** The swarm page as it is (hero, opening, steps, network, on the
  swarm's own canvas), then the record, with the four job panels replaced by
  the dossier. The second line reads "How we've made brands self-sufficient
  with AI." (was "other brands"; Loop is now among the cases) and the menu
  calls it "The cases", with one entry a case where the jobs were.
- **The dossier.** An index strip (a cell a case), then each case as its own
  run:
  - **left, held** (5 of 12 columns): the case head (client, workstream, the
    piece, one number, the date), then the chapter in the middle of the screen
    (`[04]`, kick, a two-line title, one sentence), **the model**: its trace at
    that step in two to four mono lines, drawn on as the chapter arrives, and
    **the call**: a green diamond, a role and their words, only where a person
    decided. A ladder at the foot, a tick a figure, the one in the middle at
    datum weight; a tick scrolls to its figure.
  - **right, scrolling** (7 of 12): the piece, then one figure a chapter, each
    in the house frame: straight corners with the TR + BL notch, the edge an
    evenodd ring, a second hairline 4px inside, the heading and the datum
    inside the frame, the `FIG. 0N` caption at the bottom left.
- **Eight figure kinds** cover every block both show-and-tell pages use:
  `film`, `plates` (references, keyframes, strips: cells sharing their edges),
  `pairs` (kept as a full plate, sent back as a small struck reference),
  `track` (time on one ruler: beats, scenes, cuts, a level, marks), `exchange`
  (the ask as Claude shows it), `ledger` (cost, before and now, a Tensor Gold
  result band), `field` (a collection as grains, grouped) and `flow`
  (stations down one plumb line). No `html` kind.
- **Switches:** `?cut=short|full` (short), `?case=loop|samako|suri`,
  `?still=1`, and the swarm's own `?fly ?n ?mark ?at`. The bar at the foot
  carries cut and case.

| Case                           | Short cut                                | Full cut adds                                      |
| ------------------------------ | ---------------------------------------- | -------------------------------------------------- |
| Prompt to Loop (Loop, 1 Oct)   | ask, look, idea, plan, check, cost       | setup, how it runs, ingredients, make, sound, next |
| Autumn films (Samako, 6 Oct)   | ask, idea, house, animate, cut, check    | look, product, make, next                          |
| Asset library (Suri, 7–13 Oct) | stall, read, grouped, joined, by meaning | (the same five)                                    |

## How it is built

- `app/(internal)/test/proposal-swarm-v2/`
  - `page.tsx` — the swarm route's composition; imports `SwarmAct`, the
    engine and the swarm's sheet from `../proposal-swarm/` (one engine, never
    a copy); the dossier's sheet is imported last.
  - `splice.ts` — pure: finds the job run, throws unless it is exactly the
    four panels between `proof-brands` and `offer`, returns the halves, their
    `indexOffset`s (so the sections after keep their numbers) and the menu.
  - `CaseBar.tsx` — the lab bar (it wears `.psw-bar`).
  - `dossier/` — the template, self-contained (the lab rule of 2026-10-12):
    no component from the arcs, the landing or the lattice; its only import
    from outside is the Suri map's data (`SURI_DRIVE_MAP`), read by name.
    - `types.ts` — a case: the show-and-tell shape plus `thought`, `call`,
      `short`, and the figure kinds.
    - `story.ts` — `assertCase` (kinds, pictures only from the published
      folders, at most 15 lettered elements a drawing, a short cut of 5–6),
      `cutCase`, `letteredCount`.
    - `CaseDossier.tsx` (server), `CaseRun.tsx` (client: one
      IntersectionObserver on a line across the middle, as the Loop story),
      `Frame.tsx`, `blocks/*`, `dossier.css` (own tokens on `.csd`, read from
      `--dawn-rgb`, `--void-rgb`, `--gold-ink`, so the light theme needs no
      second palette).
    - `cases/{loop,samako,suri}.json` — the three records.
- `tests/lib/proposal-swarm-v2.test.ts` — the splice and the menu; every case
  holds the template's checks; pictures exist and come only from
  `public/arcs/{prompt-to-loop,samako,suri}/`; people by role (a name list);
  no money for Samako; the dossier's imports; no type under 12px, no rounded
  corner, no `contain`, no vertical divider between the columns, the frame cut
  TR + BL only.
- `scripts/capture-proposal-swarm-v2.mjs` — a still per panel, scrolled to the
  middle; reports whether the held column fits and whether anything is wider
  than the page.

## Where the words come from

- **Prompt to Loop:** the breakdown's own words and numbers. The thinking and
  the calls are rebuilt from the note written by hand from the 1 Oct session
  the next morning (the port's harvest, 2026-10-02) and the session's
  treatment: the session ran remotely and its transcript is not on this
  machine.
- **Samako:** the autumn-02 show-and-tell record (`story.json`), names turned
  to roles (the brief's owner, the brand lead; the requester is Thoughtform).
  Its thinking is rebuilt from that record and the eval log: the 6 Oct
  production session ran on another machine. The brand lead's pick of A or B
  was still open, so it is not drawn as a call.
- **Suri:** the asset library's own docs and the studio's eval log (7–14 Oct),
  read for counts; the thinking from the same record and the Suri sessions.
  The time saved stays "estimated", as the job panel had it, and reads
  "mapped", not "read": by 9 October only each clip's first ten seconds had
  been read.

## Edits outside the lab

None. The record, the swarm, its engine and the arcs are untouched; the v2
imports from them.

## Checked

- `npx tsc --noEmit` clean; `npx vitest run tests/lib/proposal-swarm-v2.test.ts
tests/lib/proposal-swarm.test.ts` 81 of 81 (30 new, the swarm's 51);
  `npx eslint` on the lab, the test and the script: nothing.
- `curl` 200 on the page, `?cut=full`, `?case=suri`, `?case=samako&cut=full`.
- By eye in Chrome at the owner's window: the column holds while figures pass,
  the words, the thinking and the call change at the middle, the menu lights
  each case ("Motion ad · Loop" …), the full cut's extra kinds render.
- Stills in `round-01/`, one a panel, dark at 1920×1247, 1280×720 and
  390×844, light at 1920×1247 for four panels. The capture's report: at every
  size the held column fits the screen and nothing is wider than the page.
- Not run: `npm run build` (the dev server shares `.next` in this worktree).

## Decisions taken without asking

- The dossier sits on the instrument band (1440 at the cap), not the editorial
  one (1200): the figures are the point, and at 1200 the look figure crowded.
- Only pictures already published under `public/arcs/` are used (the repo is
  public on GitHub). Samako's chapters whose pictures are not published are
  drawn in words: references, round 1, the range, the engine. The statics are
  left out (unreleased).
- Samako shows no money (the jobs' rule); Loop's cost stays, as on its page.
- The figure's own thought line in the ask (Claude's UI) repeats the first
  line of the held trace; kept, because one is the interface and the other the
  reasoning.
- The ladder's lit tick is datum weight, not gold: the figure's lit object is
  the view's one gold thing.
- Chapter numbers are their place in the full cut, so the short cut shows
  gaps (`[01] [03] [04]` …) and a figure keeps its `FIG.` number in both cuts.
- The pairs sit side by side, a column each: stacked, at 1280×720 the kept
  takes shrank to thumbnails.
- The map's names may take two lines on a phone; the gap between them is set
  for that, so on a desktop they sit further apart than they need to.

## Known and not fixed

- The thinking for Loop and Samako is reconstructed from written records, not
  read from the transcripts; each case says so in its `source` field.
- Suri has five chapters: there is no measured cut-down run yet (the cut-down
  method is written, its numbers are not), so that chapter waits.
- The Samako check is drawn as a ledger, not as before and after pictures:
  the before/after stills are not published.
- Long: about six screens a case in the short cut. The full cut is longer.
- Light theme follows the brand tokens; judged on four stills only.
- Pushed to `origin/main` on 2026-10-17 on the owner's word (`bbfdc03d`).
- The swarm's `ResizeObserver` rebuilds its world on any height change below
  it; every figure has a fixed height on desktop, so the dossier does not move
  the page once laid out.

# Round 02 (2026-10-17): one block of words, the clients as a switch

## Why

The owner, on round 01: "I don't think we need two text blocks on the left. I
think we can have the client title and maybe use little labels, etc., so it's
super clear. We can use a divider … labels, maybe with little subtle icons
using our particle system, for the project title and the type of thing
(Creative Production, Creative Ops). Each text element that appears and
corresponds with the card should be super informative: not too small, not too
much, and not many conflicting things … I think we also need a toggle
somewhere, or a bar, that allows us to switch between clients. Really think
about it from an information architecture perspective."

## What it does

The held column is one block, read top to bottom, in two halves split by a
divider:

- **Above the divider, the case (held while it lasts).**
  - The clients: `[01] Loop Earplugs  [02] Samako  [03] Suri` in one row,
    the case in view in ink with a flat gold lip under it, the others dim.
    The row is the title and the switch at once.
  - Two labels, square chips with a particle icon each: the project
    ("Motion ad", "Autumn films", "Asset library") and the type of work
    ("Creative production", "Creative operations").
  - One quiet mono line: the date and the case's one number.
  - The divider, its first 32px at datum weight, as a ruler's zero.
- **Below the divider, the figure in the middle (crossfades with it).** The
  chapter (`[04]`, kick, two-line title, one sentence), the model's trace under
  a "The model" label with its own particle icon, the call under the green
  diamond. A step larger than round 01 (the trace 13–15px, the call to 18px).
- **The chapter index at the foot** replaces round 01's ticks: the chapters by
  number and name (`03 Ask  04 Look  05 Idea …`), the one in view in ink with a
  datum underline, each a link to its figure.

The switch:

- **One case at a time, switched in place.** The page is one case long; the
  reader picks the next from the client names, from **Next case** at the foot
  of each case (a framed way on, with the next case's labels), or on a phone
  from a bar of the client names held at the top of the dossier.
- A switch starts the case from its piece and writes the case into the address
  (`#case-samako`), so a link opens on it; `?case=` picks the first shown.
- The menu points at the dossier ("The cases", a chapter of the page) and no
  longer at each case; the second line keeps its sentence and hands its menu
  entry to the dossier.

## How it is built

- `dossier/Glyph.tsx` — the particle icons: a 7 × 7 field of square grains,
  each with a fixed small variance in tone; `play` (production), `flow`
  (operations), `film`, `pair`, `grid` (projects), `model` (the trace).
- `dossier/CaseSwitch.tsx` (client) — which case is shown: the reader's pick,
  else the address's hash (read as a store, so it never sets state in an
  effect), else `?case=`; renders the clients row, the phone's bar and the one
  `CaseRun`.
- `dossier/CaseRun.tsx` — the one-block held column, the chapter index, Next
  case (observed with the figures, so the last chapter's words stay as it
  passes the middle).
- `dossier/CaseDossier.tsx` — builds every case's run on the server and hands
  them to the switch; the index strip of round 01 is gone.
- Case records gain `project` and `glyph`; each chapter a one-to-three-word
  `nav` for the index.
- `splice.ts` — `DOSSIER_ENTRY` (`#cases`, "The cases", primary) in the jobs'
  place.
- `CaseBar` keeps the cut only (the case is the dossier's own switch).
- The capture opens each case by its address and shoots it in turn.

## Checked

- `npx tsc --noEmit` clean; `npx eslint` on the lab, the test and the script:
  nothing; `npx vitest run tests/lib/proposal-swarm-v2.test.ts
tests/lib/proposal-swarm.test.ts` 86 of 86.
- In Chrome: the switch shows Samako on one click and starts it at its piece,
  the address follows, the menu reads "The cases" inside the dossier, Next case
  reads at the foot.
- Stills in `round-02/` (dark, 1920×1247, 1280×720, 390×844).

## Decisions taken without asking

- One case at a time rather than three stacked: the switch is the reader's way
  between them, and the page stays one case long.
- The client row replaces a separate client title (the lit name is the title).
- The case's sentence and its big number left the head: the sentence is the
  piece's own title (`[00]`), the number sits in the quiet meta line.
- Chapter names in the index keep their full-cut numbers, as the figures do.
- The `.csd-bar` class was the cost bar's already; the phone's bar is
  `.csd-switchbar`.

## Known and not fixed

- The phone's bar is held at the top of the dossier; it is not yet judged
  against the site header on a real phone.
- More than four or five clients would wrap the row; then it wants a compact
  form (a menu), not decided.

# Round 03 (2026-10-17): the job panels' numbered cards

## Why

The owner, on round 02: "With the Loop Earplugs, etc., and Motion ads, the
items are at the top and the text is further down, which is confusing. I don't
know what to look at. It needs to be all integrated nicely, with the text on
the left side … there's too much text. This should be super clear. Use the
static cards we had on the former swarm page with the numbers. It needs to be a
super clear visual from an information architecture point of view."

## What it does

- **One group, in the middle of the screen.** The client names, the two
  labels, and right under them the case's cards, read as one thing; no space
  between the case and its words, no divider, no date line.
- **The cards are the job panels' numbered steps** (`01 · Navigate`,
  `02 · Encode` …, `components/arcs/ArcJob.tsx`, `job-stack.css`), redrawn in
  the lab: a hairline box with a double hairline, a tab in its top-left corner
  (`03 · Look first`), the chapter's two short sentences inside, a centre line
  to the next card. One card a figure, in order.
- **The card of the figure in the middle is lit:** gold tab, ink, its two
  sentences on two lines, and under a dashed rule one line of the model's
  thinking with the particle icon. The other cards stay dim on one line; each
  is a link to its figure. In the full cut (more than eight cards) the dim ones
  keep their tab only.
- **The numbers run 01, 02, 03 … in the cut shown**, and each figure's `FIG.`
  number is its card's, so a card and its picture pair at a glance.
- **Less text:** the big chapter title, its sentence, the four-line trace, the
  call, the chapter index and the date line are gone from the left. What a card
  says is its two sentences; what the model thought is one line.

## Decisions taken without asking

- Calls (where a person decided) are off the left this round; they stay in the
  case records for a later place (the figure, or the lit card).
- The lit card's model line is the chapter's first recorded thought.
- Numbering follows the cut shown, so a chapter's number differs between the
  short and the full cut (round 01 numbered by the full cut and left gaps).

## Known and not fixed

- The lit card grows by a line or two as it lights, so the cards under it move;
  quick, not animated.
- Pushed to `origin/main` with round 02 on 2026-10-17 on the owner's word
  (`e165efca`).

# Round 04 (2026-10-17): one step, and what it saved

## Why

The owner, on round 03: "the left side is too busy. Too much is happening and
I think it needs to be simple, with steps, what we've saved, etc. We don't have
to show everything. On the pin side, the left side needs to change depending on
the slide you're in but make it subtle … I like the right cards. I do think
they can use a golden accent … I don't like that it's all stacked."

## What it does

- **Three things on the left, no stack.**
  - The case: the client names (the one shown lit) and its two labels.
  - The step: a thin bar, a segment a figure (passed ones at datum weight, the
    one in view in gold, each a link to its figure), `02 of 07` beside it, and
    one card, the step of the figure in the middle, its gold tab and its two
    lines. Only this card changes as the figures pass: a 360ms fade with a 4px
    rise, the same card in place.
  - What it saved: the job panels' result drawn small, in a quiet card. The old
    way a long hatched bar, the new way a short gold one, the words under each;
    "Estimated" where the before is an estimate. It holds for the whole case.
- **Gone from the left:** the other cards, the model's line.
- **The right frames' golden accent:** a gold cross on each of the frame's two
  square corners (top left, bottom right), inside the hairlines, the brand's
  "gold crosses on a visual's corners".
- **Phone:** the case and what it saved open the case; each figure carries its
  step card above it. The film's frame no longer collapses there.

## Where the saved words come from

- Samako: the job panel's own result (`jobs.ts`, the production job), "Days
  of motion design for each ad" to "Two films from one brief, in a day",
  labelled "The return", as the panel had it.
- Suri: the job panel's result, "Weeks opening folders by hand" to "Two days
  to map the whole Drive" (round 01's correction of "read"), estimated.
- Loop: no job panel; the before is the motion-ad baseline the owner wrote for
  Samako's panel, the now is Loop's measured 1 h 51 min. Marked estimated.
  **To confirm with the owner.**

## Checked

- `npx tsc --noEmit`, `npx eslint`: clean; `npx vitest run
tests/lib/proposal-swarm-v2.test.ts tests/lib/proposal-swarm.test.ts` 89 of 89.
- The client tabs, clicked headlessly: each shows its case, starts it at its
  piece, writes `#case-…`; Next case moves on.
- Stills in `round-04/` (dark, 1920×1247, 1280×720, 390×844); the capture's
  report: the group sits on the screen, one card lit, nothing wider than the
  page, at every size.
- Pushed to `origin/main` on 2026-10-17 on the owner's word (`75eb310b`).

# Round 05 (2026-10-17): two anchors, no frames

## Why

The owner, on round 04: "I still think too much is happening on the left side,
and it feels confusing. Maybe we don't need frames, just a text element that we
nicely align … the time saved (the return) is an important one. Because it
looks the same as the card above, people will think it also needs to change …
I think we need to cluster things and make them more minimalistic … Think about
it from a frontend design perspective … How do we make sure that every element
has enough room to breathe?" With seventeen sites to study.

## The study

Four agents loaded each site at 1440×900, scrolled it, measured the pinned
columns in the DOM and read the screenshots (kept in the session scratchpad,
not committed). What all seventeen agree on, measured:

- **Pinned text is never framed.** Frames go on the visuals; hairlines and one
  shared left edge carry the text (Unsiloed, Griffin, Arrakis, Spade, Euclid,
  VoidZero; Augustus's one product chip is the only boxed label).
- **Two anchors and air between them.** The story at the top, the payoff at
  the bottom, 250–600px of a 900px screen left empty (Enerblock 468px, NoGood
  306px, Augustus's top chip and bottom dashes).
- **Progress in one quiet channel:** a 1px track with a lit segment (Cluster,
  Spade), a filling underline (Dispatch), opacity on a list (Unsiloed, Arrakis).
  Never a bar, a counter and a card together.
- **One step at a time,** swapped by a 0.2–0.3s fade, positions held.
- **A result is a different kind of thing from a step:** one large number with
  a small caption (sstr's "−48%" at 96px over a 12px "[ 27 → 14 kN·m ]",
  Rollups' "35%", Lighthouse's counters), still while the story moves.
- **Three type sizes, a 20/40/80px rhythm, 35–55 characters a line.** The
  counter-example, Prime Intellect: 59 text items, 8 sizes, 16 tones, 4px gaps.

## What it does

- **Top:** the clients as a plain index (`[01] Loop Earplugs  [02] Samako
[03] Suri`, 16–21px, the one shown in ink with an ink hairline under it); the
  case's kind in one 12px mono line with its two particle icons; 40–80px of air;
  a 1px track, a segment a figure, the one in view lit gold (it slides, 360ms;
  each segment a link to its figure); the step: `05 THE PLAN` in mono and the
  two-tone line ("Every beat on a frame." in ink, "Before anything moves." quieter),
  swapped with a 320ms fade.
- **Bottom:** what it saved, behind one hairline: `TIME SAVED · ESTIMATED`, the
  value in gold at 40–64px ("1 h 51 min", "1 day", "2 days"), one line under it
  ("From one prompt to a finished ad, down from days of motion design"). It
  never moves.
- **Gone:** every frame on the left, the step card and its tab, the counter,
  the segmented bar, the label chips, the before/now bars.
- **Gold on the left:** the track's segment, the step's number, the result's
  value. The client underline is ink now.

## Elorian

The owner added an `ELORIAN` key (Elorian, a visual-reasoning lab; model
`elorian-1-agent` at `https://api.elorian.ai/v1`, OpenAI-style chat
completions) to use its vision model on the sites. A first read-only call
listed the model; the next was refused by the session's permission classifier
(the key sent to an endpoint found by web search). Not used for this round;
waiting on the owner's confirmation of the endpoint.

## Checked

- `npx tsc --noEmit`, `npx eslint`: clean; vitest 89 of 89.
- Stills in `round-05/` at 1920×1247, 1280×720, 390×844: the top and the result
  both on the screen and never meeting, one step shown, nothing wider than the
  page.

# Round 06 (2026-10-17): back to the Loop story

## Why

The owner, on round 05: "I do not like what you've created. You've spread it
out all the way and that just confuses people. They're looking at a thing
moving on the right, and on the left side they have to look at three different
sections. I still think the one from Loop, that information architecture, is
the cleanest. Maybe I was overthinking it. We should do it like that."

## What it does

- **The held column is the Loop story's group** (`components/arcs/ArcProofStory.tsx`,
  `proof-story.css`, "The way there"), redrawn in the lab with its own sizes:
  one group in the middle of the screen, changing whole as each figure reaches
  the middle (420ms fade, 8px rise), nothing pinned to the top or the bottom.
  - the step's label in gold mono with the case's particle icon
    (`02 · THE ASK`), as the Loop story's workstream label;
  - the step's line, its two sentences (the second a shade quieter), at
    `min(--type-display, 5.4svh)`;
  - its one sentence, at `min(--type-lg, 2.5svh)`;
  - up to four claims between hairlines, a 44px icon column: what the model
    reasoned at that step (the particle burst), and where a person decided (the
    green diamond, "The studio lead: …"); on the piece, the case's facts: the
    time saved, what it came down from, the project, the type of work;
  - a dash a step under it, the one in view gold.
- **The clients** are one row above the case, outside the held column; on a
  phone the row is held at the top. A switch starts the case at that row.
- **Gone:** round 05's track, step slot, result block and kind line.

## Checked

- `npx tsc --noEmit`, `npx eslint`: clean; vitest 89 of 89.
- Stills in `round-06/` at 1920×1247, 1280×720, 390×844: the words and their
  dashes wholly on the screen, one group shown, nothing wider than the page.

# Round 07 (2026-10-17): the case held, the numbers in the header

## Why

The owner, on round 06 ("much better"): the title of what was made and the
department "should be sticky"; the numbers "only … in the first section before
you start scrolling because that's basically the header … the numbers and the
briefing"; the bullet points "a bit more concise"; "include the client logo,
nicely integrated"; and "slightly changed the background color using a
gradient particle system to match the client … so it doesn't feel like too
much of the same".

## What it does

- **The case is held** at the top of the column for the whole case: the
  client's logo, what was made ("Motion ad"), and the department with its
  particle icon ("Creative production"), over a hairline with a lit start.
  Under it the words change, step by step, as before.
- **The first step is the header**: its line, three numbers (the result first,
  in gold; the time saved says what it came down from), then the briefing as a
  quote with who gave it. No step after it repeats the numbers.
- **Shorter claims**: at most three model lines a step, each 36 characters or
  fewer, plus a call when a person decided (48 characters or fewer).
- **The logos**: Loop's mark (with the name beside it), Samako's wordmark,
  Suri's wordmark; each a white file masked to the ink, so it follows the
  theme. In the column, at the head of the phone's run, and on the next-case
  button.
- **The client's field**: behind each case, a held gradient and a dot field in
  the client's colour: Loop purple, Samako warm stone, Suri blue. It fades in
  on each switch and never changes the page's height.

## Where the logos come from

- Loop: `loop_aether/public/loop-logo.svg`, cropped to the mark.
- Samako: the wordmark used in the wave-12 renders on Drive
  (`20260904_Samako/…/wave-12-clean-detect-pro-v6/composited/_wordmark-used.svg`),
  its viewBox cut to the letters.
- Suri: lifted from the published end card
  (`public/arcs/suri/under-the-glass/end_logo.webp`) as a 96px-high PNG; a
  stand-in until the official file is in hand.

## Checked

- `npx tsc --noEmit`, `npx eslint`: clean; vitest 92 of 92 (the header's three
  numbers and briefing, the logo files on disk, the tint triples, the shorter
  claims).
- Stills in `round-07/` at 1920×1247, 1280×720, 390×844 (dark), and three at
  1280×720 light: the held column fits, nothing overlaps, nothing is wider
  than the page.

## Decisions taken without asking

- Samako's field is its palette's stone and cream (`#C2BBB0`, `#F9F1E4`),
  not its navy: a navy next to Suri's blue would read as the same colour twice.
- The phone puts the result on its own row, the other two numbers beside each
  other under it.
- Loop's three numbers: 1 h 51 min (est.), $27, 9 rounds of stills. Samako's:
  1 day, 54 min, 9 of 14 takes (no money). Suri's: 2 days (est.), 82,307
  items, 97 h of video.

## Known and not fixed

- The Suri wordmark is a lift from a photographed card, not the brand file.
- The logos live in `public/test/proposal-swarm-v2/logos/`, which the public
  repo will carry once pushed; all three marks are already public on the
  clients' own sites and ads.

# Round 08 (2026-10-17): one type rule for the case head, the copy in his voice

## Why

The owner, on round 07: "don't like the font inconsistencies between the brand
the project title and workstream; please give me different options and then
also run the thoughtform tov to rewrite everything so it's less AI slop and
really feels like a logical flow".

## What it does

- **Four case heads**, switchable with `?head=a|b|c|d` and the lab bar's Head
  set (default c):
  - a: one mono line, client / project / team, the figure heads' voice;
  - b: one sans line at one size, the team a shade quieter;
  - c: title-led: a mono row (logo, the client for a mark, the team) over the
    project as the only sans; sans for what was made, mono for who;
  - d: spec rows, mono keys CLIENT / PROJECT / TEAM, every value one sans size.
  Stills in `round-08/heads/`.
- **The copy, through the thoughtform-tov skill** (translate, then voice):
  every step is now one sentence that follows from the last, split where the
  quieter half starts; one longer line under it with its turn inside; claims
  that state a fact. Gone: the two-beat taglines ("Look. Fix. Look again.",
  "Generate a little. Never redraw the product.", "The claim, made audible."),
  the slogan repeated across title, claim and figure ("One shape, three
  jobs"), the candor frame ("Round 1, honestly"), the replacement contrasts
  ("Measured, not guessed.", "What is it for, never what's wrong"). Quotes,
  numbers and roles are unchanged.

## Checked

- tsc, eslint clean; vitest 41 of 41 in the lab suite.
- Stills in `round-08/` at 1920×1247, 1280×720, 390×844: the held column fits
  at all three (tight at 1280×720 on the longest Samako line).

## Known and not fixed

- The site's copy law fails any currency; Loop's $27 stays in the lab, as it
  shipped in the Loop breakdown. "Self-sufficient" in the interstitial line is
  the owner's own wording and stays.

# Round 09 (2026-10-17): one scroll through the three cases

## Why

The owner, on round 08: "I don't think we need that eyebrow with the
different clients here. We need another subtle way of doing it … when you
finish with Loop 1 client, you immediately scroll into the other one, where
the pattern and the gradient also change."

## What it does

- **No client row above the cases.** Loop, Samako and Suri follow each other
  in one scroll; each case's held column leaves with its last figure and the
  next case's arrives. "Next case" is gone with the switch.
- **The quiet index**: `01 02 03` at the far end of the step dashes, the case
  in view lit with a datum underline; each number is a link to its case.
- **Each case brings its own field**, sticky in the case's grid row (no
  height of its own) and faded at its top and bottom, so the seam is a dark
  band where the colour and the pattern change: Loop violet dots on two
  square lattices, Samako stone grains on a hex lattice, Suri blue points on a
  fine grid with a brighter point every fifth.
- `?case=` and `#case-…` open on a case further down.

## Checked

- tsc, eslint clean; vitest 41 of 41 in the lab suite.
- Stills in `round-09/` (every figure at 1920×1247, 1280×720, 390×844) and
  `round-09/scroll/` (the top of the run, the seams into Samako and Suri).

# Round 10 (2026-10-17): one thing said once, and Suri as what was built

## Why

The owner, on round 09: "We don't need to show the briefing twice … let's
make everything as clear as possible at a glance. Do a full sweep to make
sure we're only conveying information that's relevant. This should actually
convince clients." And on Suri: "we've actually built an interface … that
cluster map should maybe be the second or third slide because that's what we
did immediately. After that we built an interface … Please make it a bit more
visible because it's too abstract. This is really a sales page."

## What it does

- **The header is the result**: `01 · THE RESULT`, the title, three numbers.
  The brief quote is gone from it: Loop's lives in its Ask figure, Samako's
  in its Ask line, Suri's was the title again.
- **The sweep**: a line stays only if the title, the line under it and the
  figure do not already say it. Loop keeps three calls and three facts across
  twelve steps; Samako keeps the one call that changed the work. Stats labels
  say plainly what the number is.
- **Suri, rebuilt** from the DAM repo (suri-intelligence-architect/suri-dam):
  - opens on the library itself: a new figure kind, `screen`, draws the
    search screen from the app's own layout and labels (sidebar, the question
    "hands only close-up in the bathroom", Ask, filters, results with the
    best match lit at its matching moment); pictures are grain, never
    footage, as the repo requires;
  - 02 the stall, 03 the map (read and grouped: what was done first),
    04 how a search runs, 05 one clip open in review (scenes as the scrubber,
    a person's note pinned, status, what the model read), 06 twelve releases
    merged 13 to 16 October; Monday and Figma move to the full cut, the read
    ledger folds into the map.

## Checked

- tsc, eslint clean; vitest 92 of 92 with the swarm suite.
- Stills in `round-10/` at 1920×1247, 1280×720, 390×844.

## Known and not fixed

- Real screenshots of the DAM would sell harder than the drawn screens, but
  the repo forbids publishing its frames, map or judgments without Suri's
  clearance; the drawn screens stand in until then.
- The capture script frames each case's first figure late now that all three
  cases are on one page; the opening stills in `round-10/` show the second
  step's words.

# Round 11 (2026-10-19): one template, Suri as built, a page to send

## Why

The owner, on round 10: the network transition took "one or two" scrolls too
many ("the transformation of the text with the scanline effect and the frame
around it should be one smooth thing … almost instant and the next scroll
should be the zoom-out"); the FIG captions are slop; the result needs time
saved and what it allows; "where the money went" goes; the category is too
subtle; one text on the left, at a middle size; Suri must show the DAM as it
looks (from the Suri GitHub account), the chaos before, the real cluster map in
3D, the search in the DAM's own UI; "12 releases in 4 days" goes. And a page he
can send today, generic, as "an overview of what we've been doing".

## What it does

- **The transition (every swarm page, incl. the keynote and the UX meetup):**
  `BARS_BY` 0.25 → 0.125, `NetworkOrg`'s `T` retuned (turn [0.02, 0.11],
  frame [0.1, 0.15], zoom [0.19, 0.44], ribs from 0.45), `.xn.xno` 430 → 340svh.
  From the pin: the scan writes the bars by ~30svh, the frame and the name by
  ~45svh, and the view draws back straight after (was 132svh to the zoom).
- **The template:** no caption under a figure; one sentence a step (no lede,
  no claims, no call); the type of work a chip in the case's tint; the project
  a line that says what was asked (≤52); the result fixed: Before → Now
  ("Time saved · estimated"), What it now allows, three facts that are not the
  time. Loop's cost chapter is gone ($27 is a result fact).
- **Order:** Suri, Samako, Loop. Result first, the problem second where the
  record has one (Samako: round 1).
- **Suri, rebuilt:** the library, search by picture and the review sheet drawn
  in the app's own look (`blocks/SuriScreen.tsx`, `suri-screen.css`: its
  palette, Inter, radii, layout, read from suri-dam `library/app/src`; pictures
  are the app's own demo shapes, never its frames); the Drive before as a
  treemap of its folders with the duplicates lit (`sprawl`); the library's map
  in 3D (`cloud`, three.js by `import()` near the panel, paused offscreen, a
  still under reduced motion). Data from `scripts/arcs/prep-suri-case.mjs`:
  shapes and counts only, the map stripped to x, y, z and a group (owner,
  2026-10-19).
- **The page to send:** `/arcs/thoughtform/cases` (own route, house arc
  `thoughtform-cases`): the swarm's opening lettered for no client
  (`NetworkOrg org={null}`, `EmbedStack house`), the line, the dossier, a close.
  The dossier moved to `components/arcs/case-dossier/` so the lab and the page
  share one copy; the logos to `public/arcs/cases/logos/` (`/test/*` 404s in
  production, files included).
- **Critics:** a buyer's-eye pass and a voice pass, applied, then a second
  buyer pass (go, after its two fixes, applied).

## Checked

- tsc, eslint clean; vitest 196 files, 3,531 tests; production build.
- Stills at 1440×900, 1280×720, 390×844 (`--path /arcs/thoughtform/cases`).

## Known and not fixed

- Loop has no "problem" chapter in its record; it opens result → ask.
- Samako's film A carries a generated person.
- The three Suri counts (75,777 files in the Drive, 57,517 searchable assets,
  82,307 items on the map) are each as filed, and the page doesn't reconcile them.

# Round 12 (2026-10-19): the window, the panel before each case, the DAM as built

## Why

The owner, on round 11 and the case explorations canvas
(claude.ai/artifact/A6NmfqbQzd7EanVVqiSZaY): the workstream to the right; the
step text quieter than the title; an interstitial before each client; the
result as "before" and "what it now allows" only; the DAM mockup "one of the
ugliest … absolutely not what the DAM looks like"; then, from the canvas's
third round, frame H ("this looks beautiful … because we have a full-bleed
visual").

## What it does

- **The window (frame H)** round every figure: one hairline, the top-right
  notch with its diagonal in gold, a head row (`▸ client / what it is` and an
  optional state), a foot row (`Fig. NN` and the datum). No plate wash, no
  corner crosses. Screens, the map, the Drive, plates and the ask fill the
  window; their own outer lines go.
- **The panel before each case** (`intro`): case number, client, type of
  work, the challenge in one sentence (Loop's in the studio lead's words) and
  at most three facts as filed.
- **The result**: Before, What it now allows, then the numbers (time saved
  among them, marked estimated). No result title: the project line says it.
- **The step line** at min(23px, 3svh), light; the project title stays 28px.
- **The type of work** right-aligned on the client row.
- **The DAM, as built**: `SuriScreen.tsx` redrawn from suri-dam's components
  at app pixels (`--u` = window width / 1280), the live library's counts, and
  Suri's own published campaign stills (`public/arcs/suri/`) for pictures,
  never frames from the library.

## Checked

- tsc, eslint clean; vitest 196 files, 3,531 tests.
- Stills at 1440×900 and 390×844, the intros included (the capture now waits
  for hydration, which had framed Samako and Loop off-centre).

# Round 13 (2026-10-19): the Loop story's grammar on every step

The owner, on round 12: "the most elegant one is still the Loop one … one
title that explains the section, a bit of a paragraph, and then some bullet
points"; the project title must not stay big and fixed while the line that
changes is small; the project at the workstream's size, the workstream beside
it on the left.

- Each step: its label, a two-tone title at the display size (it changes with
  the step), a short paragraph (`sub`), at most three points (`points`, a
  person's decision on the green diamond). The result slide keeps Before,
  What it now allows and the numbers.
- The case head: the client's logo, then the project in mono at 12px and the
  type of work beside it, left.
- Titles at most 56 characters, paragraphs 240, points 40 (tested).

# Round 14 (2026-10-19): Samako's case becomes the briefing flow; Loop re-cut

The owner: Suri stays the DAM; Loop is Prompt to Loop, cut from the original
document (`~/Downloads/Prompt_to_Loop.html`); Samako becomes the briefing
flow built in samako-ai-studio (the ClickUp skills, the ad name, one
template, insights), "super clear and super visual".

- **Samako** (creative operations): intro (1,108 ads named by hand, every
  brief its own template) → result ("One template. Names built for you.",
  the ClickUp launch register) → the sheet before (its faults marked) → raw
  notes to the team's brief (a ClickUp task beside the strategist's message)
  → one insight with its source (`chain`) → the ad name taken apart
  (`anatomy`, 18 parts, two rules) → the launch queue. New figure kinds
  `sheet`, `anatomy`, `chain`, and the `clickup` skin (`ClickUpScreen.tsx`,
  `app-screens.css`). People are roles, codes placeholders (`CS`, `ED`);
  no claims, prices or ids from the source. No time saving is claimed: none
  was measured.
- **Loop**, short cut from the original: setup · ask · idea · check · next
  time ("Now it's a skill. Just ask."), so the case reads as a system the
  studio runs, not a one-off render.
