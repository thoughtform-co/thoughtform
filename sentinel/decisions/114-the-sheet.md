# ADR-114 — The sheet: a design system for subpages, and the ship that grades it

- **Status:** Proposed (2026-09-20) — shipped and guarded; the owner's read of
  the first wave's gallery is the gate, and five of the sheet's rulings are his
  (§Left open).
- **Surface:** `/home-sessions` (new, public), `/arcs` and `/arcs/<client>`
  (rebuilt, noindex), `/musings` and `/musings/<slug>` (new, public; the seed
  posts are drafts), `/test/subpage-kit` (internal), and the `turnstone` eval
  ship at `.claude/skills/thoughtform-design/eval/subpages/`.
- **Supersedes:** ADR-098's overview COMPONENTS — `ArcClientPage`,
  `ArcClientGroups`, `ArcCardGrid`, `ArcCard`, `ArcKindFilter` and their
  `.arc-index-*` / `.arc-card*` / `.arc-client*` / `.arc-filter*` sheets are
  deleted. ADR-098 §2's client model (`CLIENTS`, `pages`, the two disjoint slug
  sets, `arcsOf` / `houseArcs`) stands and is what the sheet draws from. The
  services card's `Reserve a seat` (ADR-112) lands on `/home-sessions` instead
  of `#contact`.
- **Related:** [ADR-091](091-interface-kit.md) / [ADR-092](092-type-material-tokens.md)
  (the kit's probe and the type tokens the sheet is built on),
  [ADR-096](096-proof-stack-on-the-homepage.md) / [ADR-097](097-proof-card-is-a-folder.md)
  (the stack MECHANISM the console imports and the folder SKIN it copies),
  [ADR-073](073-arc-header.md) (`ArcHudNav`, the header the sheet mounts),
  [ADR-065](065-corner-law.md) (TR+BL on the panel and the cards; square
  children), [ADR-058](058-light-mode-theme.md) (every alpha re-derived for
  light), [ADR-105](105-the-site-footer.md) (the close IS the footer),
  [ADR-112](112-the-portrait-raster-and-the-four-services.md) (the fourth
  service the sessions page is for), [ADR-070 U35](070-configuration-is-a-switchboard.md)
  (a flag is a comparison lever; the losing direction goes with its guards).
- **Rules:** [`.claude/rules/sheet.md`](../../.claude/rules/sheet.md). Docs:
  [`docs/design/subpages/README.md`](../../docs/design/subpages/README.md).
- ⚠ **Numbering:** commit `d2d5c916` ("… the ring takes a deckFlip prop
  (ADR-114 step 1)") belongs to the phone's deck flip, which is recorded as
  [ADR-115](115-the-phones-deck-flip.md); the number was taken by this record
  in the same hour by a concurrent session. Read that commit as ADR-115's.

## The ask

Owner, 2026-09-20, in one brief and two rounds of decisions:

> our current arcs look bad

> It's very important that there's some variety in how we build blocks like
> this … not every section has just three blocks.

> Lighthouse is a very good reference but also draws inspiration from the
> different retrofuturistic references.

Hermeus `/propulsion`'s second section for the sessions page ("text on the
right, paragraph below, then a timeline corresponding with the dates; no hero
visual; keep it simple"); the arcs "rebuilt from scratch" with a title-and-
paragraph head and one section per client, each with "a terminal interface
that provides some simple information about the client" and "live dashboards,
as in how many projects are running", a fixed left panel and portrait cards on
the right that hybridise the homepage proof stack with the services card;
"build a design grid"; and then the re-scope: "create your own eval pipeline to
create all of the landing pages … encode all these different references from
the artifacts' branding into our Astrolabe MCP while following semantic design
best practices … Don't skip any steps."

Decided with him the same day: session dates are a first draft; client readouts
derive from the registry; posts are MDX files in the repo; the routes are
`/home-sessions` and `/musings`; the negative pole is shot once and kept.

## The decision

### 1. The sheet is the third grammar on the site

The corridor has one grammar, the decks under `/arcs` another, and until now a
page that LISTS things had none: the old overview was a centred hero over a
gutter grid of chamfered posters. The sheet is a **ruled document**: content-
height sections on a twelve-column band between the frame's rails, seamed
between sections (U1: the rails are the page's only verticals), inside
the site's HUD frame and on its rails, with the corner readout naming the
section. Root `.sh-root`, one sheet `components/sheet/sheet.css` (token-only
from line one and pinned at zero literals in the type ratchet), its own ink
ramp (`--sh-ink-*`, `--sh-rule` .12, `--sh-seam` .28, `--sh-datum` .55 off
`--dawn-rgb`) re-derived for light in `theme.css`. Layout rides the existing
band tokens; type rides `--track-*` / `--weight-*`; fonts `--font-pt-mono` /
`--font-pp-neue-montreal`.

Five reference clusters became the sheet's laws and the rubric's blocks
(the decode is the ship's `DRIVE.md`): the ruled sheet (Lighthouse, Tensorlake,
Prime Intellect, Kindled, stripe.dev), the instrument panel (Vilimovský's
monitors, Rocket-001, Ledger, Astrolabe), the editorial split (Hermeus §2,
Graphic Hunters), timelines (Hermeus roadmap and detail, SkyLine), the article
index (stripe.dev, Astrolabe's canon index).

### 2. Ten arrangements

`lib/sheet/types.ts` is a discriminated union; every section renders as
`<section class="sh-sec sh-sec--<kind>" data-sh-arrangement="<kind>">` on the
band, and every section but the split and the close opens on a head band
(ordinal `01 /` per knob, a mono kicker, one hairline). The `switch` in
`SheetRenderer` is exhaustive at compile time.

| kind       | what it is                                                                                                                                                                                                                                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `split`    | the page head: name kicker + display title (PPNM 500, sentence case) left, paragraphs opposite, optional readout and station row. No hero image on any sheet page.                                                                                                                                                                            |
| `row`      | ruled rows: ordinal · title · mono tags · paragraph · figure, a hairline between rows                                                                                                                                                                                                                                                         |
| `cells`    | two, three or four regions of one surface sharing edges; kicker top, caption bottom; four is a two-by-two                                                                                                                                                                                                                                     |
| `console`  | a **sticky terminal panel** (TR+BL housing, `name · // Client` head bar, a five-row readout derived from the registry, the lede) beside **portrait flashcards** that stack on scroll (`useStackedCardsScroll`, imported; the skin copied from `proof-stack.css` as `--sh-*`) — a SET of consoles is one section, each console its own chapter |
| `timeline` | a dated axis with month ticks, items seated at their dates alternating above and below, exactly one lit; `timeline=rail` and the phone take the vertical rail                                                                                                                                                                                 |
| `steps`    | a date rail left, items right, the open one elaborated with the CTA                                                                                                                                                                                                                                                                           |
| `table`    | hairline rows, no vertical rules, a two-border tree glyph on every title, a station row of filters above                                                                                                                                                                                                                                      |
| `figure`   | one or two framed figures: `[ FIG. n ]` bar, the image in the duotone or the house's generative mark, a mono caption; two-up on a dashed divider                                                                                                                                                                                              |
| `prose`    | a post's body: sticky metadata column + compiled MDX at the copy measure                                                                                                                                                                                                                                                                      |
| `close`    | `SiteFooter`, mounted directly; the section declares its own `--ft-pad-*`                                                                                                                                                                                                                                                                     |

### 3. The variety law is code

`lib/sheet/composition.ts` — `compositionViolations(sections)`: `split` first
and `close` last, each once; no two consecutive sections share a kind; no kind
more than twice; at least three distinct kinds (the close counts: a client page
is split · console · close and that is the smallest lawful sheet); `cells` with
n = 3 at most once; a timeline lights exactly one item and a steps list opens
exactly one; ids unique; at most five `menuPrimary` chapters.
`tests/lib/sheet-composition.test.ts` walks every real ladder — the arcs
overview, every client page, the sessions page, the musings index and post
over fixture posts, the kit — and ten broken ladders. The rubric's block F asks
the same of a still; the test is the half a grader cannot coin-flip.

### 4. Five knobs, four directions, one negative pole

`lib/sheet/directions.json` is THE registry (the interface-kit pattern: the
page imports it, the capture reads it by path, the ship's `armada.toml` mirrors
it and both the capture and `tests/lib/sheet-directions.test.ts` assert the
mirror). Knobs travel as `data-sh-<knob>` on `.sh-root`; the server renders
the house values and `SheetQueryKnobs` overrides them from `?k=<ID>`; **the
first value of every knob is the house.**

| knob       | values            | what moves                                                                |
| ---------- | ----------------- | ------------------------------------------------------------------------- |
| `head`     | `split` · `stack` | title left / paragraphs right, or kicker left with the pair stacked right |
| `ordinal`  | `on` · `off`      | `01 /` numerals on the head bands, or the kicker alone                    |
| `card`     | `stack` · `grid`  | the pile stacks on scroll, or sits in a static two-column grid            |
| `timeline` | `axis` · `rail`   | the horizontal dated axis, or the vertical date rail                      |

Directions: `SA` the negative pole (today's old `/arcs`, no knobs), `SB` house, `SD` editorial (`head=stack ordinal=off`), `SE` grid
(`card=grid timeline=rail`). Each moves one axis against `SB` and no other.

### 5. The pages

- **`/home-sessions`** — the copy is the ADR-112 record (`guided-build`) read,
  never restated; the dates `lib/sessions/registry.ts` (four mornings, owner-
  to-confirm, status DERIVED from the date at request time, `revalidate`
  daily). split · timeline · steps · cells (2) · row · close. The seat is
  reserved by `mailto:` with a subject carrying the morning.
- **`/arcs`** — split (the kind filter as a station row that hides whole
  consoles) · one console per client in `CLIENTS` order · cells (2×2) for the
  house formats · close. `lib/sheet/arcs.ts` derives the readout — Engagements
  · Standing · Latest · Since · Kinds — from the registry and two new optional
  fields, `ArcDef.status` and `ClientDef.since`, required by the registry test
  on every client-bound arc and client. Every real console holds one card
  today; the stack is exercised on the kit's four-card fixture over
  `PROJECT_CASES`.
- **`/arcs/<client>`** — split · that client's console · close, in the
  `[slug]` route's client branch.
- **`/musings`** — split · figure two-up (the features) · table (every post
  under a tag station row) · close. Posts are `content/musings/*.mdx`
  (gray-matter frontmatter, `next-mdx-remote/rsc`), a `server-only` registry,
  `outputFileTracingIncludes` for both routes and the sitemap. Three seed posts
  drawn from the landing's published thesis lines, `draft: true` — reachable
  by URL and noindexed, listed in development, hidden in production; the
  footer's `Musings` row stays `href: null` until one is published.
- **`/test/subpage-kit`** — every arrangement and state on fixtures, the knob
  console, type `SK` on the ship.

### 6. The ship

An armada engagement (harness 0.8.3), callsign `turnstone`, at
`.claude/skills/thoughtform-design/eval/subpages/`. Nothing on it is drawn: a
candidate is a Playwright still from `scripts/capture-subpages.mjs`. The
harness's slots are re-read: **subjects are themes** (`void`, `parchment`)
whose identity is a REGISTER STRIP of three reference first screens (shot live
by `--register`, readings per site in `references/register/readings/`),
**types are pages** (`HS AR AC MU MP SK`, the route in `shot`), **lanes are
directions** (`sa sb sc sd se` plus `lawful` / `broken` for the site's fixture
panels), **draws are sections** (`_01` the first screen, `_0n` section n at
the pin), **settings are viewports** (`default` 1920×1247, `laptop` 1280×720
as a wave-folder suffix). Rubric 0.1 is reporting only: blocks A register
(gates), B sheet, C composition, D type, E instrument, F set level, K kit; its
first anchors are NEGATIVE — what the old overview should fail (C1 B1 B2 A5
C6) and still pass (A1 A3 A6 D2). The mechanical gate runs per cell before
capture. `qa.py`'s preamble calls image 2 an identity photograph; the rubric's
grading rules override it verbatim.

## What was found building it

1. **The house formats are CELLS, not cards.** ADR-098's two partitions draw
   two ways on the sheet — a client-bound arc is a `.sh-card` in its console,
   a house arc a `.sh-cell` in the formats section — and the moved smoke case
   first asserted `ARCS.length + pages` cards, which the old grid satisfied and
   the sheet cannot. The count is `ARCS.length − houseArcs().length + pages`,
   and the terminal cuts are told apart by their CELL kicker.
2. **The chapter cap is on the header's inline row.** Every section with a
   `menuLabel` is a drawer entry; the cap of five is on the `primary` ones
   (`SheetChapter.primary`, ADR-073's own number). The arcs overview has seven
   drawer rows and five primary chapters, which is lawful.
3. **The arcs' card copy answers to the arcs' law, not the proposal's.** A
   workshop lede says "—"; walking the arcs ladders through
   `PROPOSAL_COPY_BANS` failed on registry content the sheet only displays.
   The composition test walks the sessions and musings ladders in full and the
   arcs ladders for unrendered values only; the readouts the sheet COMPOSES
   are walked in `sheet-arcs`.
4. **`server-only` throws in vitest.** The registry reads the folder with
   `fs` and carries the marker; `app/sitemap.ts` imports it, so the footer
   test (which reads the sitemap) fell over with it. The real package is
   installed for Next; vitest aliases the marker to `tests/stubs/server-only.ts`.
5. **A declared image size can lie silently.** The table photograph was
   declared 1600×2000 and is 840×1360; `width`/`height` on an `<img>` only
   reserve an aspect, so nothing failed. Read the file (`sharp`'s metadata)
   before declaring.
6. **The mechanical gate counts the whole page and the frame inside the
   root.** The rail instruments' telemetry (`span.num` at 0.11em, 2.2:1) and
   the header's chapter row sit inside `.sh-root` but outside `.sh-hud-root`,
   and the shared footer is the close. The capture excludes
   `.hud-nav-overlay`, `.rin-host` and `.sh-sec--close` and sets the whole-
   page budget at 24 while the rubric's twelve is per still (the probe's
   `accentInView` on every manifest row).
7. **MSYS rewrites a child's `/route` argument.** From Git Bash, spawning the
   gate with `--url /home-sessions` navigated to
   `http://localhost:3003C:/Program Files/Git/home-sessions`. The child gets
   `MSYS_NO_PATHCONV=1`; PowerShell never had the problem.
8. **A reveal in the viewport's last tenth never lands.** `useArcReveal`'s
   root margin is −10 % at the bottom, so a capture that waits for every
   in-view reveal to be `.is-in` waits forever on the one in the last tenth —
   which is how the negative pole's first shoot timed out on all four cells.
   The wait uses 0.88 of the viewport, and a running animation is given four
   seconds, not a veto.
9. **The lit node's paint lands on a child.** `.is-lit .sh-tl__box` carries
   the gold outline; the accent stage reads the child's own selector, so the
   allow entry names `.sh-tl__box`, not the lit item.
10. **The readout label at 0.4 alpha measures 3.19:1** on the void, under the
    4.5:1 small-text floor the house holds everything else to — found by the
    gate on the first run, on the first page (and the 0.5 rung at 4.41:1,
    nine hundredths short). Dim TEXT now sits on its own rung, `--sh-ink-dim`
    (0.58 on the void, 0.64 on parchment, ~5.5:1), the 0.5 rung is 0.54, and
    0.4 is line work only. After the lift `/home-sessions` passes the gate in
    both themes with zero findings and 18 accent marks on the whole page.
11. **The flashcard's head was a `span` holding two `span`s**, so the kicker
    and the title ran on as one line ("PROPOSALHungry Minds · the proposal")
    and the kicker's bottom margin broke nothing, because a margin on an
    inline box is not a line break. The grader saw it first (D5 on every
    console still); the head is a grid now. **A wave is one CSS state**: the
    fix meant re-shooting all four directions, not patching one.
12. **A re-shoot must REPLACE a manifest row, never append it.** The first
    `flushManifests` appended, so a second run of the same cell would have
    graded every still twice and captioned each picture twice in the
    gallery; rows are keyed by file now.
13. **The grader is told what the frame and the close are.** Wave 01's first
    read failed the flashcards' gold lip as "a card outline drawn in gold"
    (it is the proof card's own folder device, ADR-097) and graded the close
    — the shared footer on its kept-dark plate — as a section (A4, B1, C1,
    C2, C5). Rubric 0.1.2 excepts the lip beside the console's and excludes
    the close, as 0.1.1 excluded the HUD frame.
14. **`qa.py` prints the type's name and question off the MANIFEST row**
    (`meta.type_name`, `meta.question`), which `wave.py` writes for a drawn
    wave and a capture has to write itself — the calibration wave's first dry
    run printed `AC - , answering the question ''`. The capture carries both
    now and the calibration rows were backfilled in place (the stills were
    not re-shot).

## Wave 00, graded

Eighteen stills — the negative pole in both themes and the two fixture panels —
three runs each, 110 seconds. The pole failed every check it was predicted to
fail (the centred hero, no page rules, the gutter grid, the scrims, the void
under the head); the lawful fixture passed clean and the broken one failed
block A. Of the four checks the pole was predicted to PASS, three failed, and
that is the calibration: D2 was a wrong prediction (the old title shouts), A6
failed on the HUD frame's round navigation button (which every still on this
site carries — the rubric had no sentence saying the frame is not graded), and
A1 failed on bold mono card titles read as the wrong face. Rubric 0.1.1 fixes
the two that were the instrument's fault and corrects the anchor row. Two of
eighteen verdicts were unstable across runs. The full read is the ship's
`evals/waves/wave-00-calibration.md`; nothing is a decision until the owner has
ticked a gallery.

## Wave 01, graded

Four directions shot in one pass at one CSS state (the first pass was thrown
away when the flashcard's head turned out to run its kicker into its title):
64 stills each at 1920 × 1247 in both themes, one per section, and the house
direction again at 1280 × 720. The mechanical gate reports zero findings on
every real page in both themes. Rubric 0.1.2, three runs each: keepable on the
42 real-page stills — house 21, seams 22, editorial 27, grid 23 — with a third
of every direction's verdicts unstable across runs on identical pixels, which
is the rubric's wording and not the page. What the grader fails consistently
splits two ways. Things the sheet does on purpose and the rubric does not yet
name (pending 0.1.3): the lit timeline node's gold box, a one-card pile, a
flashcard's figure with no FIG bar, a console still driven past its own head
band. And one thing only the owner can settle: on every console still the
fixed-ratio flashcard does not reach the band's rule, which is the
instrument-versus-sheet tension his brief set up. Nothing is promoted; the
galleries at `delivery/review-wave-01-<k>.html` are unread. The ship's
`evals/waves/wave-01.md` carries every still's verdict.

## Verification

```bash
npx vitest run tests/lib/sheet-composition.test.ts tests/lib/sheet-directions.test.ts tests/lib/sheet-arcs.test.ts tests/lib/sessions-registry.test.ts tests/lib/musings-registry.test.ts tests/lib/arcs-registry.test.ts tests/lib/type-material-tokens.test.ts tests/lib/theme-css-sweep.test.ts tests/lib/phone-viewport-units.test.ts tests/lib/arcs-import-doctrine.test.ts tests/lib/footer-nav.test.ts tests/lib/services-copy.test.ts tests/lib/arc-terminal-markup.test.tsx
npx playwright test tests/visual/subpages-smoke.spec.ts --project=desktop        # 8 passed, 2026-09-20
npx playwright test tests/visual/arc-terminal-smoke.spec.ts --project=desktop    # 10 passed, the moved overview case included
node scripts/capture-subpages.mjs --dry-run                                      # the mirror, and every route answering 200
```

Mechanical, from PowerShell (never Git Bash: trap 7):

```
node scripts/design-eval/mechanical.mjs --url /home-sessions --theme dark --scope ".sh-root" --exclude ".sh-hud-root, .hud-nav-overlay, .rin-host, .sh-sec--close" --vp 1920x1247 --budget 24 --port 3003
```

The pages, on the dev server that is running (3003 today):

```
http://localhost:3003/home-sessions
http://localhost:3003/arcs
http://localhost:3003/arcs/loop
http://localhost:3003/musings
http://localhost:3003/musings/navigate-the-intelligence
http://localhost:3003/test/subpage-kit
```

with `?k=SB|SD|SE&theme=dark|light` on any of them.

## Left open — the owner's rulings after wave 01

Split or stacked head · ordinals on or off · pile or grid · axis or rail
(full-height rules or seams: ruled, see U1) · whether the Loop console expands its four dossier
beats into flashcards · the twelve-gold budget · the four session dates and
each client's `since` year. The losing value of every knob goes with its CSS
and its guards once he has read both (ADR-070 U35).

Two more, from wave 01's grades: whether the pile's card should be seated on
a rule of its own (the grader fails B1 on every console still because a
fixed-ratio card cannot reach the band's rule), and whether the lit timeline
node keeps its gold box (the rail lights its node with a diamond and ink alone
and passes the same checks the axis fails).

Also open: the register strips prove the RULED grammar and not the corner law
— Lighthouse's own first screen carries thirteen rounded corners and
stripe.dev's sixteen (`references/register/readings/`), so a grader shown the
strip as "the register" must be told, as the rubric does, that A6 is the
house's law and not the references'.

## U1 — 2026-09-20, owner: the rails are the page's only verticals

Off the first screen of the wave-01 gallery (the arcs overview on the house
direction):

> Just a general note: those vertical borders, or vertical dividers, which you
> took from Lighthouse, I do not want those. We already have our rails so
> remove them across all our pages.

The two full-height hairlines at the band's edges — cluster A's "the page
draws its own rules", taken from Lighthouse, Tensorlake and Kindled — are
deleted from `sheet.css` on every page. The references draw those rules
because they have no frame; this site's HUD already draws two rails with ticks
at the viewport's edges, and a second pair inside them read as clutter. A
sheet page divides itself with seams between sections, the head band's rule
and cells that share edges, and nothing vertical of its own.

What went with it, per ADR-070 U35: the `rules` knob (`sheet` · `seams`) and
direction SC, from `directions.json`, `directions.ts`, the ship's lane and
lanes table, and their tests; B1 is rewritten to the seams alone with a
fails-when for a vertical rule of the page's own; the smoke asserts, as paint
and not as a knob, that no box between the rails on any route is a hairline
as tall as its section; the gallery's first screen becomes the sheet's first
negative anchor. Wave 02 re-shoots the three remaining directions at the new
state; wave 01 stays as the record of what he ruled on. Not ruled on and left
in place: the two-up figure's short dashed divider, which is stripe.dev's and
not a rail's length.

The lesson for the next reference decode: read the frame before copying a
reference's chrome. The first thing the owner ruled on was the one thing the
references gave the page that the site already had.
