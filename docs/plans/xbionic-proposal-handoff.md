# X-Bionic proposal: handoff (2026-10-10)

Written 2026-10-10 for the owner's move to his Windows computer. Everything a session on another machine needs to carry on the X-Bionic proposal is here or at the paths named. The goal, in the owner's words: "this is a proposal. It should really form a cohesive narrative", and the page becomes the template every later proposal is cut from.

- Page: `http://localhost:3003/arcs/x-bionic/proposal` (read the port off the running server)
- Content: `lib/arcs/content/x-bionic-proposal.ts`
- This branch: `claude/xbionic-proposal-narrative-arr3om`, draft PR #21 (https://github.com/thoughtform-co/thoughtform/pull/21). Ask the owner before merging it.
- Design-system doc: [`docs/design/xbionic-proposal/proposal-design-system.md`](../design/xbionic-proposal/proposal-design-system.md)

## ⚠ Read this first: two lines of work, and they conflict

The same brief of 10 October was worked twice, in two places.

**Line A, this branch (PR #21).** Built in the project thread, each piece shown to the owner on stills:

| Commit    | What it is                                                                                                                         | Owner's word                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `614ba19` | ADR-153 U4: the four job cards read brief, proof, return on a Tensor Gold band, one workstream glyph on the right                  | built to the brief                                   |
| `49f49de` | ADR-153 U5: "What it returned at Loop" is a job card too (`LOOP_RETURN`, `layout: "case"`), one lane per workstream                | "Keep it" (16:01Z, on "What runs now")               |
| `fd01658` | ADR-153 U6, ADR-154 U5: "The plugin, in your Claude Enterprise." The engine beat draws the layer opened (`face` on the instrument) | picked "Layer opened" (16:01Z), "Continue." (19:16Z) |

**Line B, `main`, pushed by the owner's own sessions the same day:**

- `7cd7964`: [ADR-155](../../sentinel/decisions/155-the-proposal-as-a-system.md), the proposal as a system. A look-dev lab, `http://localhost:3003/test/proposal-system`, with nine directions (`PA` production, `PZ` the whole brief): a mark head on the jobs (`job.top`), Loop's return as a ledger of four returns (`crew.layout: "returns"`), the engine pinned as nine steps on a view timeline (`instrument.pin`), the approach as the WRITTEN layer stack. Two things went straight to production: the first person swept off both proposals (`PROPOSAL_VOICE_BANS`), and the leverage's stack drawn by one geometry (`components/arcs/stack/**`).
- `e6e35fd`: the adoption-flow lab, `http://localhost:3003/test/adoption-flow-lab`. Adoption to automation as four holographic options (A Axis, B Exploded stack, C Field, D Dish), on Loop's record.

ADR-155's lab was built on `main`, which does not have Line A. Its `PA` control is the page without the job cards, the Loop return card or the plugin layer.

**Where they collide.** `git merge origin/main` into this branch conflicts in ten files: `.claude/rules/arcs.md`, `components/arcs/{ArcCrew,ArcInstrument,ArcJob}.tsx`, `components/arcs/leverage.css`, `lib/arcs/content/shared/{jobs,loopProof}.ts`, `lib/arcs/content/x-bionic-proposal.ts`, `lib/arcs/types.ts`, `tests/lib/arcs-registry.test.ts`. Most are both sides adding to the same place (both added a crew `layout`: `"case"` here, `"returns"` there), so a merge can keep both as options. Which one the page uses is the owner's call, per beat:

| Beat                                  | Line A (this branch)                                  | Line B (main)                                                                                |
| ------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| The jobs                              | brief, proof, return on the gold band (U4)            | the mark head (`job.top: "mark"`), still a lab direction                                     |
| What it returned at Loop              | the case card, a lane per workstream (U5)             | the ledger of four returns, still a lab direction                                            |
| The engine                            | the layer opened (U6), live                           | pinned, nine steps (`instrument.pin`), still a lab direction                                 |
| The approach (the configuration beat) | the eight-step outline below, approved, not drawn yet | the WRITTEN stack (`PF` against `PG`), and the adoption-flow lab's four options, none picked |
| First person                          | swept, own wording                                    | swept, and banned by `PROPOSAL_VOICE_BANS`; keep both sweeps and the ban                     |

Nothing has been merged either way. Do not resolve this by picking a side in a conflict hunk: that is how one session's ruling undoes another's.

## The section order on this branch

`about` · `vision` (leverage, "How intelligence should take part in the work.") · `adoption` (handoff, "How adoption and automation connect.") · `proof-loop` (interstitial, the AI-first quote alone) · the four Loop cards (`practice-*`) · `return` · `proof-brands` (interstitial) · the four jobs (`job-production`, `job-ops`, `job-review`, `job-strategy`) · `offer` (interstitial) · `engine` (the plugin) · `phases` ("The two weeks.") · `how-we-work` ("Who takes part.") · `pricing` ("The fee.") · `close`.

The four workstreams, everywhere on the page: **Creative production, Creative ops, Creative review, Creative strategy.**

## The configuration section: approved, not drawn

The owner approved this outline on 2026-10-10 ("Draw it", 19:36Z). It replaces what the `adoption` beat draws today. Verbatim:

1. It opens on the same "Your layer" from the vision section, so the reader recognises it, with the four workstreams on it: Creative production, Creative ops, Creative review and Creative strategy.
2. It then follows one workstream down. Creative production holds jobs, and ads design is the one worked through, because the first phase starts there.
3. Ads design takes its inputs (the product renders, the tone of voice and the brief) and makes the asset, the finished ad.
4. Adoption: the team makes those ads with Claude on its own work, with a person checking every step.
5. Encoding: what works is written down once for everyone, as a skill (how an X-Bionic ad is made, in its voice and with its product facts) and as evals (what a good ad looks like, in checks the copy editor and the product designer write).
6. Automation: an agent then runs ads design from the inputs to the finished ad, checks its own work against the evals, and stops to ask the workstream's owner before anything goes out.
7. A second drawing right after it holds your two lines: a tool you operate, where a person checks every step, and an agent with context and evals, which runs much longer before it asks.
8. Moving upstream: with the making handed over, the team's time goes a level higher, to the briefs and the campaigns, and the same loop starts again there.

What the owner has said about drawing it (2026-10-10):

- The leitmotif is the particle-system diagrams. No flat or stock-looking icons ("an utter regression").
- Creative production is the overarching workflow; ads design sits within it. Inputs and workstreams are never mixed in one hub ("1A hub … doesn't make sense").
- The long-horizon drawing is two lines, not three ("1B … two lines instead of three"). "Many strands, one line" is a maybe.
- Agree the structure in words first (done: the outline above), then build two or three options on the live page with its own components, and check every still at 1280x720 and 1470x830.
- Its likely starting points are already on `main`: the adoption-flow lab and ADR-155's WRITTEN stack. Read both before drawing a fourth version.

## The owner's rules for this page

- Never the first person. Clients may be named; their people by role only, never by name.
- Copy through the `thoughtform-tov` voice. No em dashes, no "X, not Y", no slogans; titles are names.
- The other clients' cards (Suri, Samako) carry no run costs and no names of the clients' own internal tools from their records. The fee section's day rate is the page's only money.
- `LOOP_RETURN` is shared with the Pandora proposal, which was sent to the client on 2026-09-29. Pandora's render must not change; check it after any edit to `lib/arcs/content/shared/**`.
- Time figures on the jobs are the owner's estimates and keep saying "Estimated". Loop's return says "What runs now", never a time.
- Sections must not all look the same ("a glorified PowerPoint"). Derive one design system from the references; never Frankenstein them.
- When a later note seems to conflict with an explicit brief, ask the owner before acting on it.

## Open items

- At 1280x720, `vision` runs 21px and `pricing` 22px past one screen by content bottom. Every other beat fits; `engine` fits at both laptop sizes and on the phone. Measure with `node scripts/measure-arc-beats.mjs --vp 1280x720` (and `--vp 1470x830`, `--theme light`).
- ADR-153 U5 and U6 list what they leave open, among them the ops lane drawing Loop's one copy editor.
- `npm run lint` on `main` was already at 338 warnings against a 337 cap on 2026-10-10. That red is not from this branch.

## Stills

The stills from this work are in the Claude project's files, under `xbionic-proposal/` (`job-cards/`, `loop-return/`, `engine/live/`, `explorations/`). They open from the project in the Claude app; they are not in the repo.

## Picking it up on another machine

```bash
git fetch origin
git switch claude/xbionic-proposal-narrative-arr3om
npm install
npm run dev
# then http://localhost:3003/arcs/x-bionic/proposal
```

Verifying:

```bash
npx vitest run tests/lib/arc-plugin-layer.test.ts tests/lib/arcs-registry.test.ts tests/lib/instrument-record.test.ts
npm run verify
node scripts/measure-arc-beats.mjs --vp 1280x720
node scripts/measure-arc-beats.mjs --path /arcs/pandora/proposal   # must not move
```
