# ADR-154: The instrument — one record of the intelligence configuration, at five altitudes

- **Status:** Proposed (2026-10-08, owner). Phase 0 (the record, the adapters, the geometry, the
  registry, the measure, the guards) and Phase 1 (the drawing, the lab, the capture) built and
  guarded; the first live mounts wait on the owner's read of `/test/instrument-lab`. Flips to
  Accepted on that read, with the motion engine ruled.
- **Surface:** `lib/instrument/{types,adapt,layout,directions.json,variants,measure}.ts`,
  `lib/instrument/records/suri.ts`; `components/instrument/{Instrument,InstrumentPicker}.tsx`,
  `instrument.css`; `components/arcs/ArcInstrument.tsx` and the `instrument` kind
  (`lib/arcs/types.ts`, `ArcSectionRenderer`, `chrome.tsx` `INS`);
  `app/(internal)/test/instrument-lab/` (four boards); `scripts/capture-instrument.mjs`;
  `.claude/skills/thoughtform-design/references/instrument-grammar.md`; tests
  `instrument-record`, `instrument-layout`, `instrument-directions`, `no-idle-motion`;
  `arcs-import-doctrine` guards `components/instrument` and `lib/instrument` and bans static
  `gsap` and `animejs`; `animejs` enters as a dev dependency for the lab's third engine. (The
  one idle animation under the figure trees, `leverage.css`'s pulse, is ADR-153's and goes with
  that branch; `no-idle-motion` will catch it when the two meet.)
- **Related:** [ADR-052](052-arc-pages.md) (new kinds are enumerated exceptions),
  [ADR-065](065-corner-law.md), [ADR-070](070-configuration-is-a-switchboard.md) (U11 the R4
  grammar; U35 delete, never flag), [ADR-080](080-holo-program-instrument.md) (arrival-only),
  [ADR-100](100-the-board.md) (green is the person), [ADR-130](130-the-workshop-frames-the-loop.md)
  (the six questions), [ADR-148](148-the-suri-setup-page-and-the-workshop-frame.md) (the run),
  [ADR-149](149-the-lattice.md) (the housing, the lab pattern), [ADR-151](151-the-setup-guides.md)
  (the panel), [ADR-153](153-the-leverage-and-the-handoff.md) (one lit thing for a board).

## The call

The owner, 2026-10-08, after a week of pages: "all of these things feel discombobulated. Either
there's too much text going on, or it's too simple. It looks like a glorified PowerPoint." The
ask: one modular system in the register of head-up displays, radar screens, NASA and military
technical manuals, Tensor Lake and Linear's enterprise diagram, "where we can zoom in, zoom out,
and everything feels connected … when people look at the mother and the father they should
immediately see it's a zoomed-out version of an intelligence configuration … when we change it
from creative production to creative ops, the contents change and things reshuffle, but you
still feel like you're looking at the same thing … you select a node and go into the interaction
flow and see how it creates feedback."

The inventory confirmed the diagnosis. The configuration was drawn through three question sets
(`questions` six, `configuration` five, `board` five facts) and nine figure kinds, each with its
own housing, line technique and guard. The reader was shown one object through nine lenses and
nothing said it was one object.

Three rulings, same day: **the six are canon** (model, context, evaluations, data, interface,
owner; the five and the five facts migrate through adapters); **try all three motion engines in
the lab** (CSS, GSAP Flip, anime.js) and rule on the read; **the lab, the ADR and the skill
reference first**, then the Suri configuration page and X-Bionic.

## The decision

**1. One record.** `InstrumentRecord` (`lib/instrument/types.ts`): the six parts in the owner's
order, the work, and optionally the run, the checks, the plugin and the organisation. The law
(`recordFaults`, pinned): lit ⊆ {context, evals}, the owner is the one human, one skill reads the
others, every offered altitude has its alt. `altitudesOf` offers only what the record carries, so
no housing is ever drawn empty. `adapt.ts` reads the three old shapes without a word retyped.

**2. One drawing, five altitudes.** `Instrument` renders ONE DOM: the six panels, the chip, the
nodes and the frames once, placed by `[data-altitude]` in CSS (`org` a 3-column grid with the OS
chip at its centre; `plugin` the folders around the mother; `work` the crop of `questions`, plates
by percentage over eight-wire ribbons; `run` the five stations on one rail; `check` station 4
opened, with the dashed return to the owner). What is the housing at one altitude is the chip at
the next. The picker is the one island and writes one attribute.

**3. One grammar** (`instrument-grammar.md`): the housing is the lattice's `.lat-frame` (TR+BL,
lip-lit on the altitude you are at); its children are square; the panel is the guide's header
strip inside a whole frame (owner, ADR-151 U5: no label cuts a frame); the chip is the R4 band
(TR notch, 2px rule stopping at the cut, gold wash), the one filled object; nodes are diamonds,
filled green = a person, open = the model; gold is what the team writes and the chip, green the
owner and nothing else; one chip per figure; no idle motion.

**4. The thirtieth enumerated exception**, `kind: "instrument"`, and the one that retires
`questions`, `plugin-board`, `repository`, `skill-run`, `guide.system` and `circuit` as their pages
move, each with its guard (ADR-070 U35). `board`, `leverage`, `handoff`, `bench`, `skill-file`,
`chat`, `breakdown`, `prompt-to-loop`, `curve`, `ground`, `horizon`, `stages`, `program` and the
guide's `tools`/`matrix`/`pipeline` stay: they are arguments or records of another kind.

**5. Motion, three engines on one knob** (`zoom`: css · flip · anime), loaded by `import()` on
the first pick only; under reduced motion every engine is the cut; without JS the authored
altitude renders whole. The engine is ruled on the lab read; the losers are deleted with their
guards. Whatever wins, ADR-080 holds: a transition plays once per pick, the drawing is then still.
`no-idle-motion` keeps the figure trees free of `infinite`; the one offender on the X-Bionic
branch (`leverage.css`'s pulse) is removed there.

**6. The lab** (`/test/instrument-lab`, the lattice lab's shell): `altitudes` (the Suri record at
all five), `zoom` (the picker on the chosen engine), `surfaces` (a proposal beat, the configuration
page, a guide, an explainer, each mounted as it would be; the jury's board), `phone` (375-wide
columns). `window.__instrument.measure()` is the gate: collisions, overflow, text under 10px.

## Order of work

0 ✓ the record, the adapters, the geometry, the registry, the measure, the guards.
1 ✓ the drawing, the lab, the capture → the owner's read → the engine ruled → Accepted.
2 ✓ Suri configuration: `questions` → `instrument[work]` with the picker; `skill-run` → `[run]` (U1).
3 ✓ X-Bionic: `circuit` → `instrument[org]`, static, one lit workstream (U2).
4 Workshop-v2 and the Armada companion: `plugin-board`, `repository` → `[plugin]`.
5 The setup guides: `guide.system` → `[org]`.
6 The three `configuration` proposals: teams become records on the picker.
7 The explainers: "Making your agents reliable" as an arc; Prompt to Loop's run as `[run]`.

## Left open

- The 360ms transition exceeds the motion system's 150ms UI ceiling; the owner's call on the
  read, between the law and the explainer feel.
- The work altitude keeps the `questions` crop (1200×600) inside a housing: ~52px of chamfer and
  padding around it. The lab's measure is the gate at 1280×720.
- Flip against the chip's `clip-path`: `scale: false`; a stretched ring is a wrong 1px.
- `animejs` is a dev dependency for the lab only; it leaves with its direction if not chosen.

## Updates

- **U1 (2026-10-09): the Suri configuration page takes the instrument.** `/arcs/suri/configuration`
  draws its `04 · The configuration` beat as the instrument at the work altitude, on
  `SURI_INSTRUMENT`, with the picker `plugin · work · run · check`; its three `08 · In practice`
  workstreams are the same instrument at the run altitude, each record cut from `SURI_RUNS` by
  `suriWorkstreamInstrument` (`lib/instrument/records/suri.ts`), opening into its checks. The
  `skill-run` kind is deleted with its guard (`ArcSkillRun.tsx`, its sheet block, the workshop
  frame's rules for it; `RunBody` stands on its own in `suriWork.ts`, read by the services ring
  too). ⚠ **THE CHECK ROWS ARE THE EVAL LOG'S**: a case is a row with its result as filed
  ("3 of 3, 0 of 3 without"; not run says so), the rubric's rows pass only when every case that
  ran held in full, go to review when one missed, and have not run when none has; the log's one
  line sits under the rows (`checksNote`). ⚠ A passed check is filled ink, not green: green
  stays the human's (ADR-100). Both arc routes import `lattice.css` and `instrument.css` after
  `guide.css`; the beat takes the `questions` beat's air (`.arc-sec--instrument`), and at the work
  altitude the figure's width follows the viewport's height so the 2:1 crop and its housing fit
  one screen at 1470×830 (1080px there; the band whole from 1920×1247). The arcs overview reads
  the instrument at the work or organisation altitude as the page's configuration
  (`configurationFromInstrument`, `instrumentIsConfiguration`; ADR-118 U2), never its runs. At
  the run altitude the station words wrap and the "you write this" chip stands down, so the
  five read whole in a fifth of the band. The `questions` kind stays until its seven other
  pages move (step 4 onward). Measured headless: every state of both beats clean at 1470×830
  (one screen each), 1920×1247 and 375 wide; at 1280×720 the run beats run to 797px, the
  figure itself clean.
- **U2 (2026-10-09): X-Bionic takes the instrument (step 3).** `/arcs/x-bionic/proposal`'s
  "what plugs into Claude Enterprise" beat draws `X_BIONIC_INSTRUMENT`
  (`lib/instrument/records/x-bionic.ts`) at the organisation altitude, static, no picker: the
  model, the data and the interface shared along the top, the creative engine as the one chip,
  three workstreams with the product voice lit as the one phase one starts with, the context and
  the evaluations the team writes, the owner by role, the socket into X-Bionic's Claude
  Enterprise. ⚠ IT IS A PROPOSAL, NOT A BUILD: every answer is what phase one sets up, from the
  8 October call; no plugin altitude until the plugin has a name. The `circuit` kind has no other
  page left on X-Bionic; Pandora still draws it. The overview reads the instrument as the page's
  configuration (`sheet-config-fit` pins it).
- **U3 (2026-10-09): the organisation altitude fits one screen.** The owner: every beat whole in
  one screen on a MacBook Air. At 1470 × 830 the org frame ran 46px past the fold. Its three
  steps follow the viewport's height at that altitude only (`--ins-2` 8→16px, `--ins-3` 12→24px,
  `--ins-4` 16→40px, full from about 1100px tall), and the chip's workstreams read as one row
  (the chip 640px wide, wrapping on the phone). Measured: whole at 1440 × 790, 1470 × 800,
  1470 × 830 and 1710 × 980; the work and run altitudes are untouched.
- **U4 (2026-10-09): the organisation altitude is an exploded stack.** The owner: the offer
  ("one plugin, in the Claude you run") read as a regression from the vision's console, panels of
  12px sentences on nothing. The altitude is redrawn as the leverage's stack (amends §2's `org`
  and the grammar's org row): the workstreams as tiles on top, one per discipline (the bucket in
  mono, the name in sans, the owner by role on a `line`); under them the layer the team writes,
  one isometric slab, owned (hatched, gold) when the context or the evaluations is lit; under
  that the organisation's slab, the socket's name on it. The six parts are callouts either side,
  no frame and no fill, their answers sans at `--type-base`; the owner's label carries the
  person's green diamond. Retired: the chip's workstream list (the tiles are the one place they
  are drawn), the org's dashed frame and the socket node. `InstrumentWorkstream.bucket` (≤12,
  optional) carries the discipline; X-Bionic's record has four (strategy, production, ops,
  review), production lit as the one phase one starts with. The slab is one drawing,
  `components/instrument/Slab.tsx`, shared with the leverage, its hatch pattern's id per
  instance. The measure's `BOX_SELECTOR` gains `.ins-tile`. Suri's record keeps three
  workstreams and no buckets, so the lab keeps a bed without them. Measured headless: the lab's
  twelve cells clean; the engine whole at 1440 × 790 and 1470 × 830 in both themes; a list on
  the phone.
