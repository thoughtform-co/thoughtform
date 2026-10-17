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
