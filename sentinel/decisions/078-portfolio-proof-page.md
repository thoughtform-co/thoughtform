# ADR-078: The portfolio is the casefile, expanded into a page

- **Status:** Accepted (2026-08-24)
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

### The page, in order

`about` → `beyond` → `overview` (the flywheel) → _bridge_ → `studio` →
`studio-films` → _bridge_ → `tools` → the four dossiers → `rollout` →
_bridge_ → `intelligence` → `close`. Sixteen beats; the chapter row is
About · Program · Studio · Tools · Architecture (the cap is five, and it is
full).

**The studio precedes the tools, and that ordering is the argument.** The
tools are what the studio's own bottlenecks produced; a reader who meets
them first meets four side projects. `arcs-registry.test.ts` pins it.

**The rollout beat is new, and it is the one the page was missing.**
Without it the four dossiers read as side projects rather than as the
output of a program that reached twenty-two teams. Its rows are
copy-with-parity against the casefile's own `ROLLOUT_ROWS` (`lib/arcs`
keeps no `lib/cases` import — the `LOOP_FIGURES` precedent), pinned to
agree. It renders a LOG through the `anatomy` kind, so its row rhythm is
scoped by id rather than loosening `.arc-anatomy` for every deck that uses
it for three-row specs — untightened it measured 1090px against an 800px
viewport.

**The bridges carry the case shape's own connective tissue.** The canonical
case is friction → navigated → encoded → built → what changed → _what it
revealed next_, and that last clause is what makes a portfolio argue rather
than list. Three `interstitial` beats say it in the page's voice.

### The flywheel

The thesis beat was three text cards on a page with five drawn consoles on
it. It is the one beat that ARGUES, which is why it was the one that most
needed to be an instrument.

**It is a RATCHET, not a wheel** — the doctrine's own word (_"not a loop
that closes, a ratchet"_), so there is no circle on it. A flat green
people-rail across the top; a staircase that only ever rises, one square
per tool taking its place; teeth falling from the rail to each riser (the
first is the longest — the work that trenches a shape pays the whole
depth); and dashed lifts climbing back to the rail landing one tread AHEAD
of where they dropped. **That forward displacement is the flywheel told
honestly**: a helix flattened, not an arrow chasing its own tail.

- **It letters no digits of its own.** The six registers read `LOOP_FIGURES`
  in the renderer, the same contract `dossier` has with `PROJECT_CASES`; the
  content module carries a head, a route and a footnote. The registry test
  fails a route caption whose number is neither a year nor a canon value.
- **The route strip is the page's own chart** — six waypoints deep-linking
  into the chapters, terminating in the seat plate, which is the drawing's
  ONE gold object. Every target is pinned to resolve: a dead anchor on a
  forwarded page is what a stranger finds first.
- **DOM, not an SVG canvas.** The host runs w/h ≈ 3.3 → 2.1 across the three
  reference viewports and no authored viewBox survives that spread — the
  measured reason the tool wireframes are DOM. Connectors are 1px divs; only
  closed shapes are inline SVG (a stroked single-axis path reports a
  zero-height rect and disappears from the collapse guard).
- **Motion is spent once, on the reveal**, as transition-delays off the
  beat's own `is-in`. The pre-states are scoped inside a no-preference query
  and the base rules ARE the final state, so no-JS and reduced-motion both
  get the drawn panel rather than a stranded `scaleX(0)`.

⚠ **Two things the measurements corrected, and both generalise:**

1. **The panel carried an aspect cap copied from the console beats, and it
   did not belong.** `.arc-intel` and `.arc-films` cap width against height
   because an SVG `viewBox` fits by `meet` — the smaller of the two ratios —
   so a box wider than the crop letterboxes. Nothing on the flywheel is
   scaled. The cap was discarding **340px of the instrument band at
   1440×800** and squeezing the waypoints into each other. _A constraint
   inherited from a neighbouring object needs its own reason, not its
   neighbour's._
2. **The route ran the panel's full width, which put the terminus under the
   REGISTER stack** — 325px from the exit column at 1280×720, measured —
   where it read as a caption beside the numbers rather than as what the
   mechanism produced. It sits in the field's own column now and the
   registers span both rows. _The composition's one hard requirement was
   stated in a comment before it was true; the guard that would have caught
   it is the one that now pins the seat under the drop._

### Rejected on the drawing

Circular arrows and closed loops; a literal flywheel disc or gears (and a
second radial instrument would compete with the substrate dial the page
already ends on); mascot pictograms — the human is a green line here as
everywhere on this estate; a `ConsoleFrame` around it (four dossiers and the
architecture beat already carry that chrome); gauges attached to figures,
which imply a measurement this case does not publish (ADR-068's
satellite-meter deletion); numbered waypoints or invented serials, which are
ordinals in costume; and any perpetual ambient animation — every drawn
instrument here is static once it has arrived.

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

## Verification

- `npm run verify` — **1018 unit tests green**, including the new registry pins
  (the studio beats' key sets, the flywheel's route resolution and canon-only
  figures, the rollout's parity with `ROLLOUT_ROWS`) and the two `toBe`
  reference pins in `cases-registry`.
- `arc-portfolio-smoke` — **13 passed, 1 skipped**, at 1280×720 / 1440×800 /
  1920×1080 in both themes: the sixteen-beat order, the sheets and films
  consoles (settled gate declared, wheel gate NOT armed, both axes and the
  aspect, the rail switching what the panel displays), the flywheel's pinned
  label set in PT Mono at ≥8.5px with zero collapsed marks and the seat under
  the exit column, a waypoint navigating, and the drawing fully drawn under
  reduced motion.
- `arc-terminal-smoke` — **10 passed**: the `-v2` client decks are untouched by
  the chassis edits.
- `services-ring-smoke` — **12 passed, 1 skipped** on the records seam: the
  casefile renders unchanged with the plates now exported and `stillSizes`
  defaulted.
- `scripts/capture-arc-portfolio.mjs` — one shot per beat, both themes. It
  sweeps forward first because the reveal is one-shot, and reports any beat
  over 1.15 viewports, anything left unrevealed, and horizontal overflow.

## Open

- **Two beats run long**: `beyond` (917px) and `rollout` (849px) against an
  800px viewport. Both are legible and neither strands its reveal (the observed
  element is the whole grid), but the page's rhythm is one-beat-one-viewport
  elsewhere. Trim on the next pass if the owner reads them as long.
- The SKU/ROAS receipts left with the ad cards. The head's sub already claims
  every cut beat its return target; if the ratios should return, the `sheets`
  kind takes an optional `footnote`.
- In The Pocket is a slot on the origin beat until the owner supplies the facts;
  its card says "on record · detail on request" rather than inventing any.
- The architecture beat's `sub` could be enriched from the Intelligence Architect
  charter prose that exists in the Aether repo and nowhere on this site.
- The keynote deck and the landing are untouched by design. If the flywheel
  earns its place in a room, promoting it to the keynote is a content edit plus
  a second `flywheel` section — the kind is not portfolio-specific.

---

## Update 1 — the slop, the diagram, and the throat-clearing (2026-08-24, owner)

The cut above shipped and the owner rejected it. The criticism was specific
and correct on every count; this records it and what answered it.

### What was wrong

1. **The hero and the bio did not belong.** This page is an extension of the
   proof panel, and it opened on the Thoughtform Gateway plate followed by a
   portrait and a biography — so a reader met the operator before meeting any
   work, on a page about the work.
2. **The flywheel "doesn't work at all".** It drew adoption and automation as
   a ratchet — two strands, teeth, return lifts. Internally coherent, and it
   said nothing.
3. **The copy register was generated-sounding**, in the owner's words
   _"disgusts me… people will hate me for it"_ — on the one page whose reader
   is a stranger being asked to take the work seriously.
4. **One claim was false.** A bridge asked _"so what is actually underneath
   this?"_ over the whole page, which said the 47 Skills underlie the ATL
   films. They do not; that is separate work.
5. **The setup took four sections** before a reader reached anything Loop
   shipped.

### The diagnosis on the drawing

**It was a diagram of a METAPHOR, in a house where every instrument draws a
RECORD.** The dossiers draw real tool interfaces, the map draws 47 real
Skills, the sheets draw real ads, the films are real films. The flywheel drew
an abstract mechanism that had to be explained before it meant anything —
and a reader who has to be taught a notation before they can read a chart is
a reader who stops.

That generalises past this surface: **on this estate a drawing earns its
place by plotting something that happened.** If the only thing a drawing
knows is an argument, the argument is better as a sentence.

### The program board

`kind: "flywheel"` → `kind: "program"`. The engagement plotted as a course
across a dated time field, 2024 → now: a graticule with year majors, an
adoption curve as a step ladder (the rollout's own shape, plateaus included),
the five things that shipped plotted at their real dates as anchors into
their own chapters, six framed registers, and the seat where curve and course
both arrive.

**The gaps are the reading.** Four tools inside eight months is a cluster on
the right; the curve climbing under them is the "and the teams came with it"
clause. Nobody is told that adoption and automation drive each other — the
two lines share an axis and arrive at the same place. ⚠ Spacing the waypoints
evenly would delete the only thing the chart knows that a list does not, so
`at` is authored from the record and the registry test pins it sorted.

It absorbs the bio, the origin cards, the thesis and the studio bridge:
**sixteen beats to eleven**, and the origin survives as a dim run-in labelled
at the axis rather than three prose cards.

### The copy law (mechanised)

A title is a NAME, not an aphorism. Three shapes are banned as display
titles and `arcs-registry.test.ts` walks every `head.title` for them:

- the counting pair — _"Twenty-two teams, forty-five minutes each."_
- the reversal epigram — _"The method is the durable centre. The tools are
  its proof."_
- the spelled-out-number opener — _"Forty-seven Skills, five shapes of work."_

Where the owner already has a phrase for a thing, **that phrase is the
title**: "Software for few", "the Intelligence Map", "Adoption that works is
automation", "97% of briefings involve AI". Subs are one or two sentences.

⚠ **TITLES ONLY.** A dated log ROW may state a count in the same words — a
record is not a claim — which is why the guard walks `head.title` and nothing
else, and why the rollout's own log keeps "Twenty-two teams briefed".

### The hero, and the coupling it exposed

The hero takes a Loop key visual (`dj-neighbour.jpg`; the reel's default view
stays Smug Owl so no frame repeats on a default scroll) with one CTA.

⚠ **THE CURTAIN WAS GATED ON THE PLATE, AND THEY ARE NOT THE SAME QUESTION.**
`data-arc-curtain` read `plate === "gateway"`, so giving this page its own
image would have silently taken the ADR-076 seam with it — a choreography
coupled to an image, with one assertion in another test the only thing that
would have said so. A hero declares `curtain: true` now.

Three more consequences of the own plate, each mechanical:

- `HERO_ROUTES` drops its portfolio row. That list is **hand-written, not
  derived**, so a route that changes its plate has to be removed by hand.
- The route's static `<link rel="preload">` returns automatically.
- ⚠ **The own-plate top scrim becomes a dark LITERAL.** It used
  `--void-deep-rgb`, which theme.css re-pins to the page colour on any
  `.hero__video__overlay` — in light that washed parchment across a key
  visual. ADR-077's stays-literal clause exactly: it sits over a photo.

### Consequences

- The `portrait`, `cards` and `interstitial` kinds stay live (the keynote
  uses all three); `VINCE_PORTRAIT` / `VINCE_BIO_LEAD` stay keynote-used.
  Nothing became dead code.
- Chapters: Program · Studio · Tools · Rollout · Architecture. The bio's slot
  went to the rollout, which is one of the five things the page argues.
- The ink walk gained the board's own rungs. It had been measuring the
  portfolio's CARDS — deleted here — and would have fallen to three rungs
  with only a count guard noticing.
- ⚠ **The board is the first section now, so the curtain holds it**: over one
  viewport at 1280×720 and `data-arc-tall` disarms the seam. The smoke
  asserts the fit and the absence of that attribute together.

### Verification

1019 unit tests; `arc-portfolio-smoke` 13 passed at 1280×720 / 1440×800 /
1920×1080 in both themes — the board's pinned label set, the curve rising,
zero collapsed marks, the seat clear of every waypoint, the section fitting
one viewport, PRM drawn; `arc-terminal-smoke` 10 passed.

---

## Update 2 — the hero is not a frame out of the films (2026-08-24, owner)

U1 put the DJ Neighbour master behind the hero, reasoning that a page about
Loop should open on a Loop image. The owner's answer was immediate and is
right: **a poster frame is EVIDENCE, and this page already shows that
evidence properly** — two beats down, in a console with its own rail, at the
size a reel deserves. Lifted out and blown up to 100vh it is the work used as
wallpaper, which cheapens the thing the reel exists to sell.

**The plate is the house key visual again; the Loop-specific part of the hero
is what it SAYS.** The repo holds no Loop image at hero grade — the only
candidates were the two film posters (rejected here), the 4:5 studio ads and
four tool screenshots. If a client-supplied hero image arrives it belongs
here; a still lifted out of a beat below does not, and the smoke pins that
(`no poster frame in the hero`, both themes).

⚠ **U1's real finding survives the revert**: the curtain no longer rides the
plate. `hero.curtain` is declared alongside `plate: "gateway"` even though the
plate would imply it, precisely so the next image swap cannot silently take
the ADR-076 seam with it. `HERO_ROUTES` gets its portfolio row back — that
list is hand-written, so it moves by hand in both directions.
