# ADR-078: The portfolio is the casefile, expanded into a page

- **Status:** Proposed (2026-08-24)
- **Owner:** Vince
- **Supersedes:** nothing. Extends ADR-072 (the portfolio arc and the `dossier`
  kind), ADR-076 (the portfolio flows; the architecture beat) and ADR-077 (the
  ink ramp).
- **Surface:** `/arcs/portfolio`, `components/arcs/**`, `lib/arcs/content/portfolio.ts`,
  two exported records in `lib/cases/content/loop-earplugs.ts`.

## Context

The portfolio is an unlisted page written for one reader — Loop's former VP of
Marketing — who forwards it to his own network. It shipped in ADR-072, lost its
two text walls in ADR-076, and the owner's read after living with it was that it
still felt "discombobulated": a lesser version of the homepage rather than its
own thing, with the second beat — three cards headed _Adoption that works IS
automation_ — named as the weakest object on the page.

The diagnosis is not decoration, it is **inconsistency of instrument**. The page
has five drawn consoles on it (four tool dossiers and the architecture beat) and
three sections that are flat content beside them: the overview's three text
plates, the studio's three ad cards, and a single-film `media` beat that carried
no `menuLabel` at all. A reader meets a machine, then a brochure, then a machine.

The homepage's proof casefile is the object the owner wants the page to grow out
of — one instrument that changes what it displays, four directory rows deep. Two
of its four plates were already ported (`ToolField` in ADR-072, the map console
in ADR-076). **The two that were not are exactly the two sections that read as
flat**, which is not a coincidence: they are the rows whose evidence never made
it out of the panel.

## Decision

**Port the remaining two casefile plates, and let the page carry the same
narrative the casework does.** Concretely, four moves:

1. **`sheets` and `films` become section kinds**, on the `intelligence` kind's
   contract: `{ head }` and nothing else, the record resolved by the renderer
   from a shared export. The studio beat mounts `SheetsPlate` (THE ADS · THE
   LINE · THE RED LINE) and the reel beat mounts `FilmsPlate` (both films).
2. **The records get a second home.** `STUDIO_SHEETS` and `ATL_FILMS` become
   `LOOP_STUDIO_SHEETS` and `LOOP_ATL_FILMS`, referenced by the casefile row and
   pinned `toBe` — the `LOOP_INTELLIGENCE_MAP` precedent.
3. **The page is re-cut chronologically**, with the narrative's own connective
   tissue: the origin work, the thesis, the studio, the tools, the rollout, the
   architecture. The bridges are `interstitial` beats carrying the case shape's
   _what it revealed next_.
4. **The thesis beat becomes a drawn instrument** — the flywheel (its own
   section below).

### What the studio beat gains, and why it is the argument

The ad cards showed what the studio SHIPPED: three stills and their ratios. Half
the engagement was the policy underneath — when AI may make an image
(_illustrative_) and when it may not (_representative_), and the four ways a
synthetic creator costs more than it saves. **That half is the half a stranger
has to trust**, and it existed in the record, on the landing, and nowhere on the
page a stranger was being sent. The 97 % masthead still opens the beat; the
console now answers _how do you decide_ instead of repeating _look what we made_.

The reel beat gains the second film for the same class of reason: one world-first
reads as a fluke, two masters at one craft bar read as a capability. The rail
makes the second one reachable without spending a second viewport on it — and it
gains a name in the readout and a row in the drawer, which the `media` beat never
had.

## Consequences

- The sanctioned-import list in `.claude/rules/arcs.md` extends by three:
  `SheetsPlate`, `FilmsPlate`, `console/ConsoleRail`. Verified per plate — react,
  `next/image`, `lib/cases` types and the console pair; no three, no supabase, no
  stores, transitively.
- **`SheetsPlate` gains `stillSizes`** and it is the only thing the two surfaces
  do not share. A `sizes` hint is a statement about the BOX: the casefile's tiles
  are panel-fitted at 200px, the arc's are half again as wide, and inheriting the
  default serves an upscaled candidate. The default keeps the casefile
  byte-identical. **Every other edit to either plate is a two-surface change** —
  `services-ring-smoke` AND `arc-portfolio-smoke`.
- **`useCloseOnCasefileFold` no-ops on an arc**, by construction rather than by
  luck: it looks for `.services-stage[data-proof-live]`, which no arc writes, so
  it returns without observing. The lightbox's Escape, backdrop and scroll lock
  are what close it — the set the dossier walkthrough has used since ADR-072. A
  `films` beat under TERMINAL motion would need `useCloseOnArcBeatFold` instead;
  none exists today.
- **The aspect cap is the contract on both hosts** (`× 1.7`). ADR-076 recorded it
  for the map; the films plate learned the same thing on its own surface in
  August, when two 16:9 posters in a tall panel resolved to floating stamps the
  owner read as cropped. A height-only fill guard reports green on exactly that
  defect, so the smoke asserts both axes.
- `data-proof-settled` is declared on neither host, and the reason is unchanged:
  it is half of `PdaConsole`'s wheel gate, and arming it anywhere on a flowing
  page is how a scroll trap gets in.

## Rejected

- **An arc-native studio console** reusing `ConsoleFrame` + `ConsoleRail` with
  the ads as stations. It would re-type the sheets' three bodies — the plate's
  own comment says it "adds almost nothing" over the shared grammars — and a
  re-typed policy is one that drifts the first time either surface is edited.
- **Restyled cards.** Cards are the page's grammar, not the panel's; the brief
  was that each section should feel like it grew out of the casefile.
- **Reordering the dossiers to the story's order** (Vesper first). `ProjectCase.index`
  is a stored string lettered on each dossier's eyebrow, so the page would print
  02 01 03 04, and reordering `PROJECT_CASES` itself renumbers the landing deck —
  a landing-wide blast radius for a portfolio nicety. **The flywheel's route strip
  carries the chronology instead**, and deep-links `#tool-vesper` directly. The
  contained path, if it is ever wanted: derive the eyebrow ordinal from page
  position, relax the registry's order pin, reorder the smoke arrays.

## Open

- The SKU/ROAS receipts left with the ad cards. The head's sub already claims
  every cut beat its return target; if the ratios should return, the `sheets`
  kind takes an optional `footnote`.
- In The Pocket is a slot on the origin beat until the owner supplies the facts.
- The architecture beat's `sub` could be enriched from the Intelligence Architect
  charter prose that exists in the Aether repo and nowhere on this site.
