# ADR-079: The portfolio is a trajectory, and every beat owns a screen

- **Status:** Accepted (owner, 2026-08-24)
- **Surface:** `/arcs/portfolio`
- **Supersedes:** ADR-078 U1 on the section list and the program board's shape
- **Builds on:** ADR-052 (arcs), ADR-072 (the dossier kind), ADR-076 (the page
  flows), ADR-077 (the ink ramp), ADR-078 (the portfolio IS the casefile)

## Context

ADR-078 U1 cut the page down to eleven sections and replaced a metaphor with a
dated chart. The owner's read after living with it: the direction is right, the
information architecture is not there yet. Three things, in his words —

- the homepage's **title on the left, paragraph on the right** section header is
  the house pattern (his reference: Linear, and the old OpenAI site) and the
  portfolio should keep it;
- **Loop Studio, Above-the-Line and Software for Few are separate sections**;
- the **rollout should be a timeline, combined with the program**, because both
  draw the same trajectory — "a timeline is also a good table of contents, and
  we need to map the different sections around that";
- **horizontal tabs are good but not everywhere**: the reference sites work
  because their IA is asymmetrical, and "if everything is in tabs, then it's not
  gonna work";
- information on the left **stays** on the left;
- and then, on the built result: **"make sure that every section fills its own
  viewport instead of overlapping"**.

The trajectory he wants the page to carry is his own: embedded in the AI team
spearheading adoption → into marketing to make Studio efficient → the tools
**for** the creative process → the tools **around** it → Studio self-sufficient
and adoption going company-wide → intelligence architecture.

A standalone HTML prototype was built first
(`public/prototypes/portfolio-prototype.html`, kept out of the deploy by
`.vercelignore`) and approved before any of this was ported.

## Decision

### 1. The rollout is absorbed. There is ONE chronology, and it is the contents

`rollout` — six dated log rows under its own masthead — is deleted. It plotted
the **same 2024 → now span** the program board plots, in a second grammar, at the
opposite end of the page: a reader met the chronology twice and had to work out
that the two were one thing.

The board becomes the trajectory: seven dated stations, each carrying a date, a
name and a one-line `note` saying what the move **was**, and (bar two) an anchor
into the chapter it opens. Where each rollout row went is recorded at the
deletion site in `portfolio.ts` so nothing is restored from memory.

⚠ **The gaps are still the reading** — `at` is authored from the record and
registry-pinned sorted.

⚠ **The stations alternate above and below the axis, and that is arithmetic.**
Seven stations across the band leave ~120px each against a 168px block;
alternating lanes doubles the pitch between same-side neighbours, which is what
buys each one a date, a name AND a note without colliding. `data-lane` is derived
from the index in the renderer, so content cannot author it out of step.

⚠ **The adoption curve is its own register at the foot**, not a line behind the
stations. Drawn under them it crossed every note — and a reading the eye has to
pick out of the text is not a reading.

⚠ **The year scale is deleted.** Every station prints its own date, so a row
repeating 2024 / 2025 / 2026 under the axis was the same fact twice — and it
collided with the lower lane. The priors run in at the head of the adoption band,
which is where they belong in time; floated in the station band they printed
through station one.

### 2. Every beat owns a screen — and the law was already written

`.arc-sec` has carried `min-height: 100svh; align-content: center` since ADR-052.
What broke it was its own **padding**: `clamp(96px, 14vh, 200px)` takes 201px out
of a 720px beat, so a dossier's record column (583px there) pushed its section to
786 and crowded the beat below. That is the overlap.

The fix is the budget, not a second min-height: `.arc-sec`'s padding becomes
`var(--arc-sec-pad, …)` and the portfolio lowers the token.

⚠ **Scoped to the FORMAT, not the motion.** `ArcShell` publishes
`data-arc-format`. The workshop v1 and the portfolio are BOTH reveal pages, and a
workshop runs past twenty sections — one screen each would triple it.

⚠ **A token, not a `padding-block` override.** A format selector outranks the
per-kind rules that set `padding-block: var(--arc-stage-pad)`, so overriding the
property directly would silently retune the beats that pay for their own air.

⚠ **The architecture beat lost its exemption.** ADR-076 licensed it to "run past
one" viewport; left alone it measured 1141px inside a 1080px beat. `--arc-intel-h`
now takes the beat's own budget as a second term. ⚠ **Its WIDTH rides that
height** (`max-width` is height × 1.2), so an over-tight cap failed the smoke on
width while the height still passed.

### 3. The tools head becomes a chapter index

Once every tool owns a viewport, a masthead with nothing under it spends a whole
screen being a divider. `tool-index` is the ninth-plus section kind: it carries
`{ head }` and NO data, and the renderer letters each record's own `codename`,
`subline` and `mode` out of `PROJECT_CASES` — the `dossier` contract exactly.

This is where the reference boards' shape is honoured: the CP2077 database puts an
**index** where the reader arrives and the record beside it. Tabs switch a VIEW;
the view itself is asymmetric. Rails stay inside consoles (map 3 · tools 4 ·
sheets 3 · films 2) and the page's own navigation is the trajectory.

### 4. Vesper leads

The dossiers run in the trajectory's order — the tool built FOR the creative
process before the three built AROUND it. That is the real sequence (Oct 2025 →
Feb 2026) and the distinction the chapter's own sub draws. `TOOL_ORDER` is one
constant, pinned against the section list: an index that points at beats in a
different order than it lists them is the defect that constant exists to prevent.

### 5. Films becomes a chapter

Retiring `rollout` freed the fifth inline slot. The reel had been a full viewport
of the page's most striking evidence with no link to reach it by.

## Consequences

- The chapter row is **Trajectory · Studio · Films · Tools · Architecture**.
- `.arc-sec` sections: eleven → ten, and the drawer renumbers.
- The old board's parts (`__field`, `__vr`, `__hr`, `__dot`, `__ladder`,
  `__prior*`, `__rung`, `__curve-lbl`, `__course`, `__wp*`, `__seat*`, `__br*`,
  `__yr`, `__body`) are deleted with their arrival choreography and the ≤900px
  unstack — which re-stacked a grid the board no longer has, and fired at 900
  while `.arc-head` stacks at 960, leaving 901–960px with a stacked masthead over
  a still-plotted chart. The board's own release is at 960 now.
- The registry's rollout copy-with-parity assertion goes with the section. The
  casefile keeps `ROLLOUT_ROWS`, untouched, as the canonical copy.

## What the measurements corrected

- ⚠ **`--gold` as text measured 1.68:1 on parchment.** The register figures went
  gold and the light walk failed them immediately. Gold that is READ takes
  `--gold-ink` (ADR-063 U2's by-role ramp); line work keeps the alpha token. The
  walk's target for that rung moved 7 → 4.5, which is the ramp's own definition
  rather than a relaxed guard — `--gold-ink` measures 5.26:1, and a 7 target
  would forbid gold as text anywhere on this surface.
- ⚠ **`width: 100%` plus `margin-inline` overflows by exactly one band margin.**
  In a flex column the band already stretches; the extra declaration pushed every
  section 129px wide at 1280.
- ⚠ **PowerShell's `Get-Content`/`Set-Content` round-trips this repo's CSS through
  cp1252 and adds a BOM**, mangling every box-drawing character and `⚠` in the
  comments. Line-splicing a source file is a Node job. (Caught by `file` on the
  result; reverted and redone.)
- ⚠ **The curtain makes the first beat's own band `position: fixed`**, so its rect
  is viewport-relative and any "does this element sit inside its section" check
  reports a false spill unless it walks the ancestor chain for a fixed parent.

## Verifying

`npx vitest run tests/lib/arcs-registry.test.ts` · `npx playwright test
tests/visual/arc-portfolio-smoke.spec.ts` — and **both** other suites, because
this pass touched the shared chassis: `arc-terminal-smoke` (proves the decks were
left alone) and `services-ring-smoke` (the casefile leaves the dossiers mount).
Measure at 1280×720 and 1440×800; the project's 1440×900 default hides every
clipping bug this content has.
