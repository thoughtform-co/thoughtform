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
- Nothing is committed or pushed; the branch is local.
- The swarm's `ResizeObserver` rebuilds its world on any height change below
  it; every figure has a fixed height on desktop, so the dossier does not move
  the page once laid out.
