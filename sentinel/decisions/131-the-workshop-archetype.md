# ADR-131: The workshop is a house arc, and the client pages are cuts of it

- **Status:** Proposed (2026-09-28, owner). Built, guarded and measured. Flips
  to Accepted once the owner has read the page live.
- **Surface:** `/arcs/thoughtform-workshop` —
  `lib/arcs/content/thoughtform-workshop.ts` (new, fifteen beats, the one new
  file); `lib/arcs/registry.ts` (one row, leading the house block);
  `lib/theme/heroPreload.ts` + `tests/lib/hero-preload.test.ts` (the gateway
  plate's route, both halves); `tests/lib/arc-terminal-markup.test.tsx` (the arc
  joins the walk); `tests/lib/arc-iso.test.ts` (the label walk generalised off
  Plopsa); `tests/lib/sheet-instrument.test.ts` +
  `tests/lib/sheet-composition.test.ts` (`REAL_TODAY` bumped to the newest
  filing, which is what both comments instruct).
- **Supersedes:** nothing. Every existing arc is byte-identical.
- **Related:** [ADR-130](130-the-workshop-frames-the-loop.md) (the four framing
  kinds, ported here unchanged), [ADR-128](128-the-pandora-proposal-and-two-kinds.md)
  (`proof-card` and `bench`), [ADR-052](052-client-arcs.md) (`client` absent ⇒ a
  Thoughtform format), [ADR-118](118-the-arcs-overview-is-an-instrument.md)
  (`date` is a plot, and `REAL_TODAY` moves with it).

## The problem

Three workshops have shipped and none of them is reusable. `/arcs/claude-workshop`
is a 2026-07 shape. `/arcs/plopsa-workshop` was cut before the thinking had
settled and skips the introduction by design — that room had already met the
practice. `/arcs/suri-workshop` is a kickoff. Every new client so far has meant
a page written from a blank file, and the argument has been re-derived each time.

The owner's note of 2026-09-28 is the argument, finished, and it ends on an
instruction: use it to build the skeleton the workshops are cut from.

## The decision

**`/arcs/thoughtform-workshop` is a HOUSE arc** — no `client`, which ADR-052's
own reading of that field already means: a shape the practice sells rather than
a piece of work done for one company. It leads the house block in the registry,
because the client workshops are cuts of it and it is the page to read first.

**Five chapters, fifteen beats, the house arc with an introduction in front of
it.** Today · the proof · navigate · encode · build. Five `menuPrimary` is the
registry cap exactly, and that is a stated cost, not an accident: the first fork
that wants a sixth chapter fails loudly.

**⚠ THE LAW IS THE PRACTICE'S OWN, AND IT IS ALREADY PUBLISHED.** The evals
workshop shell in `thoughtform-co/practice-snapshot` states it: one idea per
section, exactly ONE picture per section, a "beat" is a section with no picture,
each section fills one screen at 1280×720 and never scrolls, seven to sixteen
sections. And the sentence that settles every argument about width — **a
sentence that does not fit is a sentence to CUT, never a column to widen.** That
is what "keep the copy light, do not stack conflicting visuals" means as a
number rather than a preference, and it is why this page reaches for the
scissors where an earlier instinct would reach for CSS.

**⚠ SELF-SUFFICIENCY IS THE CHAPTER'S CLAIM, NOT A CARD'S** (owner). The
homepage's four Loop cards are the four MOVES that got a team there. On this
page the outcome is stated once, on the `head` beat above them, and the `studio`
card is retitled to what its own pictures show — the ads, and the line. **The
record is untouched**: `proof-card`'s `title` override (ADR-128, the same day)
exists for exactly this, so the homepage keeps saying the four lines in the
present tense as the offer while this page says them in the past.

**⚠ FOUR FIGURES, EACH IN ITS OWN BEAT, NONE OF THEM NEW.** `stages` (a prompt,
a tool, an agent — the note's own opening argument, and the one live WebGL
beat), `curve` (capability climbs, price climbs with it), `horizon` (the
operated track against the agent's), `bench` (Run · Skill · Evals). No
`questions` board: a picker or a board, never both, and this page carries
neither, so `sheet-config-fit`'s pinned list does not move.

**⚠ THE BENCH'S EXAMPLE IS TEXT, NOT A PICTURE, AND THAT IS THE ARCHETYPE'S
PROBLEM RATHER THAN A PREFERENCE.** The image branch wants two or three pictures
with marked regions; the only ones on disk belong to a client, and **the base
every fork starts from may not carry another client's evidence**. The text
branch needs no asset at all, and writing is the one craft every room in the
building shares — the example reads for a studio, a finance team and an
engineering team alike. It is the practice's own writing Skill, running.

## What the measurement found, and it is the finding

**Every shipped workshop already overflows one screen at 1280×720**, and nothing
on this surface measures it. Measured, all beats, dark, at the room's projector
size:

| page | beats over 720px | worst |
| --- | --- | --- |
| `claude-workshop` | 16 | +1075 |
| `plopsa-workshop` | 6 | +225 |
| `suri-workshop` | 1 | +26 |
| **`thoughtform-workshop`** | **3** | **+65** |

⚠ **THE OVERFLOW IS THE FORMAT'S SHARED AIR, NOT THE COPY.** The flat kinds
(`cards`, `list-groups`) carry `--arc-sec-pad` at **100.8px per side** at 720h —
**28 % of the viewport on padding alone** — while the framing kinds override it
to 28.8–48px out of their own beat class. Three passes of copy cutting moved
`delegate-down` 854 → 726 and `the-bench` 777 → 761, and then stopped moving:
what is left is padding and the bench module's own chrome.

⚠ **AND THAT IS WHY NO CSS RULE WAS WRITTEN.** `cards` and `list-groups` have no
beat class; inventing one, or retuning `--arc-sec-pad` on
`[data-arc-format="workshop"]`, reaches three pages that must stay
byte-identical and ~40 beats nobody measured. `--arc-bench-h` was the one
sanctioned lever and **it does not bind** — the floor is 470px and the module's
content measures 561, so lowering the token buys nothing. **A lever that is not
the binding constraint is not a fix**, and reaching for it would have been a
change that looked like one.

**Left open, for the owner:** whether the workshop format's flat-kind padding
should come down. It is a one-line change to a shared token with a four-page
blast radius, so it is a decision, not a cleanup.

## The traps this page paid for

- ⚠ **THE MARKS MAY NOT NEST.** Both bench inputs shipped a `voice` mark whose
  span CONTAINED the `hype` mark's span, so one phrase carried two highlights.
  Every guard was green — the registry checks only that a span occurs in the
  text, not that two spans are disjoint. Found by looking at the still. Marks
  are `≤ 4`, not exactly four, and the check still reports in its own column.
- ⚠ **`REAL_TODAY` IS A DATED PIN AND A NEW FILING MOVES IT.** Two suites read
  the real overview on a fixed day (`sheet-instrument`, `sheet-composition`); a
  monitor read on a day BEFORE a filing reports that engagement as "filed after
  now" — a real violation on a fake day. Both comments say to bump it; both were
  bumped together.
- ⚠ **THE DEV SERVER CACHES `generateStaticParams`.** `dynamicParams = false`
  plus a cached params list returns a **404 on a route that is correctly
  registered**, with nothing in the log but `generate-params: 11µs`. Restart
  before concluding the registry row is wrong.
- ⚠ **`arc-iso`'s LABEL WALK WAS PLOPSA'S ALONE.** The figure's geometry is
  fixed, but a label's BOX is its TEXT — the Dutch stages words and the English
  ones are different string sets at the same seats, so a collision walk over one
  says nothing about the other. `section()` takes an arc now and the file walks
  both. **A guard that walks one page's strings does not cover a second page
  that mounts the same drawing.**

## Known red, and it is not this change

`tests/lib/arc-marks.test.ts` fails on `pandora-proposal` ("takes its exit from
the arc's terminal section") — its `close` carries no `menuLabel`. Confirmed red
on a clean tree before this work. Not fixed here: it is the Pandora arc's
content and may be deliberate.

## U1 (2026-09-28, owner): the practicals are the build

**The Plopsa morning validated the shape.** A three-hour session on 28 September
ran the story first and then handed the room its own files, inside Claude
Cowork with the studio plugin (a `mother` skill, a `brand` skill, evals) and an
`.env` of image and video keys. Within the hour the team was making stop-motion
spots, cutting edits from rushes and building layered photo files. The owner's
reading: the practical half is where people see it, so it is the proof of the
product, and it needs a structure to build on rather than more theory.

**The Build chapter is now the practicals.** A `readout` beat (`#practicals`)
sets up once — the app, the plugin, the keys, and IT allowing network egress —
and indexes a ladder of five `anatomy` rungs: one image, a brief, formats and
layers, motion, make it a skill. It starts small on purpose ("instead of trying
to use eval for everything, let's first start with an image and then create a
brief") and ends on the eval idea without opening on it.

⚠ **EVERY RUNG IS THE SAME FOUR ROWS, IN THE SAME ORDER** — Drop in · Ask · You
get · The check. The room learns the shape once, and a client fork swaps the
words and never the structure. No new kind: `anatomy` already draws labelled
rows under a badge.

⚠ **THE EGRESS ROW IS WHAT THE MORNING PAID FOR.** The video keys failed until
IT enabled network egress in Claude's admin settings, mid-session. It is on the
page as a setup row and the plate's foot, so the next room asks a week ahead.

⚠ **THE CHAPTER CAP HELD BY FOLDING, NOT GROWING.** `what-you-build` lost its
`menuPrimary` and rides under Encode with `delegate-down`; the freed slot is
named Build, so the house arc — navigate, encode, build — stays whole, with the
theory's build talk closing Encode and Build being where the room makes things.

⚠ **THE SESSION LENGTH IS GONE FROM THE COPY.** "Fifty minutes" was true of the
session the note described and false of the morning that validated it. The
card, the Today title and its row now say "the story first, then hands on".
Owner may want a number back per fork.

**Measured at 1280x720 and 1920x1247: all six new beats fit one screen.** The
three theory beats already over (the bench, what you build, delegate down) are
unchanged.

⚠ **THE PAGE IS TWENTY-TWO SECTIONS AND THE SHELL SAYS SIXTEEN.** That ceiling
was written for one short session; this is two halves of a morning, and each
half sits inside it (the story sixteen with its close, the practicals six).
Recorded rather than forced.

**Left for later:** a practicals plugin kit in `thoughtform-plugins` — a starter
prompt and sample files per rung — so a team repeats the ladder without Vince;
and the split-screen ad skill and motion reference, waiting on files from the
client.
