# ADR-118 — The arcs overview is an instrument: a monitor, then a log

- **Status:** Proposed (2026-09-21) — **BUILT, awaiting the owner's read.**
  Everything below has landed (see §As built); wave 03 is shot, graded and in
  ten galleries behind one index (`delivery/review-wave-03.html` in the ship).
  The owner's tick on those galleries is the acceptance; until then every
  section below is a proposal. ⚠ **[U1](#u1-2026-09-21-owner--the-log-is-blocks-a-gutter-from-the-dossier)
  (same day, his live read) redraws the LOG** as blocks a gutter from the
  dossier; wave 03's log stills are superseded, its monitor stills stand.
- **Surface:** `/arcs` — the owner's page since [ADR-117](117-the-owners-pass.md)
  — and only it. The sheet ([ADR-114](114-the-sheet.md)) stays the grammar of
  `/home-sessions`, `/musings`, every client page and the kit.
- **Supersedes, in part:** ADR-114 on the overview (a ruled DOCUMENT gives way
  to an INSTRUMENT there; its open rulings that only concerned the overview —
  pile or grid, the pile's seat, Loop's dossier beats — lapse);
  [ADR-098](098-arcs-clients-and-the-proposal.md) §1's "no `date` field" and
  U2's "pages lead" (§5).
- **Related:** [ADR-089 U4](089-casefile-is-one-housing.md) (selection is fill
  among outlines), [ADR-065](065-corner-law.md) (TR+BL; square children),
  [ADR-078 U1](078-portfolio-proof-page.md) (draw the record, never a metaphor),
  [ADR-097 U12](097-proof-card-is-a-folder.md) (no flashing — the centre-out
  aperture), ADR-114 U1 (the rails are the page's only verticals), ADR-059 (the
  frame's four corners are already ours).
- **Rules:** [`.claude/rules/sheet.md`](../../.claude/rules/sheet.md),
  [`.claude/rules/arcs.md`](../../.claude/rules/arcs.md).

## The ask

Owner, 2026-09-21 (verbatim in the ship's `brief/VOCABULARY.md`):

> For the first section, the hero section, it should be full viewport, and it
> should look like a sort of grid timeline, like the fourth screenshot that
> indicates the different projects mapped onto it. … In the next section, which
> should be like a new viewport — it should not overlap with the hero section —
> on the left side we have a minimalistic list of the different Arcs, the
> different clients. Maybe we can have subsections per client, so they really
> feel like quests from a video game. When you click on them, on the right side,
> a card should then appear … with all the information of that specific Arc.

Four references: a game's codex (list + detail), its vehicle detail card, its
quest journal, and a designer's concept displays with gridded charts. Their
decode — regions, rules, selection, row anatomy, label:value ratio, where the
micro-labels sit — is counted in the ship's `DRIVE.md` (2026-09-21). What is
taken is the ROLE of each device, never its chrome: the frame's rails, corner
readouts and bottom-right cluster are already ours (ADR-114 U1's lesson: read
the frame before copying a reference's).

## Decision

### 1 · Two arrangements, one screen each

The overview's ladder becomes exactly two new arrangements, `monitor` then
`log`, on the 1440 instrument band. The monitor is EXACTLY one screen; the log
starts where it ends (never overlapping it) and is at least one screen. Each
device is as tall as the rails — their extents are its datum and its terminus —
so it ends above the fixed wordmark at the frame's bottom-left. No head bands,
no ordinals, no public footer on a private tool.

### 2 · The monitor plots the record

One chamfered housing (TR+BL, square children), so every horizontal inside it
terminates on its own edge — the answer to wave 02's finding that a seam with
nothing to land on reads as a fault. A datum strip; four unequal readout cells;
a plot on a DOM graticule (lanes, one per client, then the house formats; a
day-linear axis over whole weeks; the dates along its foot); a terminus strip.
One diamond per engagement at the date it was filed — open is a proposal out,
filled is delivered — and exactly one gold mark: the selection's. A gold NOW
cursor. Nine marks is what the record holds; nothing is invented to fill the
plot (commit activity was measured as a denser signal and dropped: forty
commits on one pitch, one to three everywhere else).

### 3 · The log opens it

⚠ **THE LIST BELOW IS SUPERSEDED BY [U1](#u1-2026-09-21-owner--the-log-is-blocks-a-gutter-from-the-dossier)**
— no group heads, no chips, no zero gutter: one block per engagement, a gutter
between the panels, one floor. The dossier, the selection law and the no-registry
rule below still bind.

Left, five of twelve: a `<nav>` of real links — kind-filter stations, then one
group head per client over one-line rows (`diamond · chip · title … [date]`),
newest first; exactly one row FILLED. Right, seven of twelve and zero gutter:
the DOSSIER, one sticky chamfered housing whose image takes the remainder
(never a clamp), with a readout of checkable facts, the arc's chapters and one
CTA. Plain click selects, ↑/↓ rove, Enter opens; the newest engagement is
selected on the server; `#arc=` deep-links. The one client file imports no
registry — a client component importing `lib/arcs` would ship the client list
in a public chunk.

### 4 · Motion

No fades and no flicker: the house's centre-out clip aperture, observed once
per device root; the swap opens the incoming dossier in 180ms and settles on a
written `data-dos-id`. Reduced motion and no-JS render everything at rest.

### 5 · An engagement carries its date — LANDED

`date: "YYYY-MM-DD"` on `ArcDef` and on `ClientPageDef` (not `at`, which is
already the program board's 0..1 axis fraction), seeded from each page's git
first commit and marked OWNER-TO-CONFIRM, like `since`. The label the page
letters is **Filed**, because that is what the seed is.

⚠ **THIS REVERSES ADR-098 §1 ON ITS OWN TERMS.** That ruling refused a date
"that only ever feeds a sort" as a second place for one fact to be wrong. This
one feeds a PLOT — the monitor places a mark by it — and the order it could
contradict is guarded against it: `arcs-registry` requires each client's
registry sequence to agree with its dates, so the two cannot tell two stories.
It also retires ADR-098 U2's "pages lead": a client's page and its arcs sort
together by date.

Guards (`tests/lib/arcs-registry.test.ts`): a real calendar day; not in the
future; a year no earlier than the client's `since`; non-increasing within a
client; a `-v2` cut dated no earlier than its v1 AND authoring its own `date:`
line (the spread that shares its sections would otherwise inherit v1's).

⚠ **THE SCAFFOLD WAS FAILING THE REGISTRY ON DAY ONE, AND NOW IS NOT.**
`scripts/new-arc.mjs` wrote no `status` (the client console requires one on
every client-bound arc) and a new client with no `since`. It writes both now,
plus the `date` — taken as `--date`, defaulting to today in local time, and
passed INTO the template, which throws without one: a template that read the
clock would make its own test depend on the day it runs.

### 6 · The directions the wave puts in front of him

First value = the house; each direction moves one knob; the instrument's four
knobs are scoped to the overview and its kit (`types: ["AR","AK"]`), the
document directions SD/SE to the document pages.

| id  | knob           | asks                                                            |
| --- | -------------- | --------------------------------------------------------------- |
| SB  | —              | does it read as one device?                                     |
| SG  | `span=full`    | 2023 → now, linear: more honest, or nine marks in the last 5 %? |
| SH  | `rows=boxed`   | the references' literal rows, against the list's seat           |
| SJ  | `dossier=pair` | an image plate over a text plate, against one housing           |
| SL  | `frame=rails`  | the monitor's strips run out to the rails — wave 02's question  |
| SF  | pole           | yesterday's overview, promoted from wave 02, never re-shot      |

`SL` is the one direction near the frame. If its strips cannot land on rail
ticks and clear the rails' labels it is recorded and dropped — never a
workaround that moves a rail.

### 7 · The ship judges it before it exists — LANDED

Rubric **0.2.0** adds block M (the monitor) and block L (the log), eight
critical rows, each carrying its own scope sentence, and attaches a second
register as image 3 on the overview's stills — composed LOCALLY from the four
references and never committed, because they are third-party art and the
repository is public. The second negative pole, **SF**, is the sheet overview
itself, promoted byte-identical from wave 02. Calibrated the same day
(`evals/waves/wave-03-calibration.md`): all eight rows fail the pole for their
stated reasons, unanimously; the one wrong failure was the rubric's own — a gold
bullet written as a list repealed A2's list — and **0.2.1** makes it additive.

## As built (2026-09-21)

Five commits, then two fixes wave 03 found: `7cf859b4` (the ship: rubric
0.2.1, pole SF, the calibration wave), `bb9bea23` (the date), `d26d5bf3` (the
two arrangements, the law, the renderers, the controller, `instrument.css`,
the kit), `53d5cda8` (the page swap and every test that bound the sheet),
`b4d40601` (the previews); then `25edb81a` (a dossier settles on its
picture, finding 7) and `ccd56876` (the docked wordmark, finding 11).

- **The data** — `lib/sheet/types.ts` (`monitor`, `log`,
  `INSTRUMENT_ARRANGEMENTS`, `SheetSpan<T>` carrying an ACTIVE and a FULL
  value, `SheetDossier`); `lib/sheet/axis.ts` (whole weeks with a division of
  lead-in while the record fits in sixteen, months while it fits in
  twenty-four, then quarters; a date sits at the MIDDLE of its day);
  `lib/sheet/dates.ts` (day arithmetic, and `todayIn(timeZone)`, which only
  the page calls); `lib/sheet/arcs.ts` (`arcsInstrumentSections(today)` —
  every reading derived, `arcsSheetSections` deleted).
- **The law** — `instrumentViolations` (`lib/sheet/composition.ts`), which
  `compositionViolations` routes to the moment a ladder holds either kind:
  monitor then log; marks unique, on real lanes, oldest first, every lane
  holding one; both windows contain every date and NOW, and each `at` is the
  axis's own arithmetic to 1e-9; no mark filed after NOW; the terminus's
  `Marks` reading is the mark count; ONE id set across marks, rows and
  dossiers; the lit mark is the selected row; each group newest first; every
  row's kind is one the filter offers. `ordinalOf` letters neither kind.
- **The drawing** — `SheetMonitor`, `SheetLog`, `SheetInstrumentController`
  (the one client file, importing no registry) and `instrument.css`
  (token-only, pinned at zero in the type, theme and phone-unit ratchets).
  The readout cells are `5fr 2fr 2fr 3fr`, not the plan's 5/3/2/2: at 1280 the
  LATEST cell (`Hungry Minds · 13 Sep 2026`) wrapped under its own label, and
  two twelfths hold each tally (`Proposal out 4`, `Productions 5`).
- **The kit** — `/test/arcs-instrument-kit` (type `AK`), NOW pinned to
  2026-09-21: a three-engagement client with one running, a same-day pair on
  one lane, a relationship older than the window, a filterable row, and
  `?fake=even|fills` for the two fakes M3 and L2 are written against.
- **The previews** — `scripts/capture-arc-previews.mjs` shoots each
  engagement's first screen through the owner's pass, 1280×800 WebP q80,
  into `public/arcs/previews/` and `lib/arcs/previews.json`, sorted, sizes
  read off the files (a test re-reads every header). The two v2 cuts share
  their v1's first screen byte for byte, which is true, and says so.

### What the build found that the plan did not

1. **A dotted division a few pixels off the NOW cursor read as a doubled
   cursor.** The division that holds today gives NOW its label AND its line;
   its own boundary is not drawn.
2. **The section dots, four high under a mark, reached the plot's title row
   on the top lane.** Three rows, seated ABOVE the vertex.
3. **The lit mark is an OUTLINE when the engagement is a proposal**, and raw
   `--gold` as line work sits under the 3:1 rung line work must clear on
   parchment: its 2px outline takes `--gold-line` (ADR-063 U2's ramp) in both
   standings, and the fill of a delivered mark stays `--gold`.
4. **The running run was a `box-shadow`**, which no guard can measure and
   the gate cannot tell from a glow; it is a span now.
5. **The mechanical gate read the NOW drop as a gold structural rule** (one
   long side). `ACCENT_ALLOW` names the four instrument accents that are
   marks by construction: the lit mark, NOW, the filled row, the dossier's
   lip.
6. **The capture shot a CLOSED aperture** — the monitor mid-arrival. Its
   `stillLife` waits on `.sh-ap-root` as on a reveal.
7. ⚠ **THE OBSERVABLE FIRED BEFORE THE THING IT NAMES.** `data-dos-id` was
   written on the swap aperture's timer, and the pictures were
   `loading="lazy"` inside `hidden` dossiers — so a picture only began to
   load when a swap unhid it and streamed in top-down under an attribute that
   already said "settled". Wave 03's first shoot put **seventeen of twenty**
   second-pick overview stills in front of the grader with a blank or
   half-painted plate (measured: a run of perfectly flat rows up to 593px tall
   inside the dossier's column, where a loaded preview has grain and type),
   with every gate green; the first grades were thrown away and the whole
   wave re-shot. Settled is now the aperture open AND `img.decode()` resolved
   (bounded at 2.5s, so a failed picture cannot hold the page), the pictures
   are EAGER at `fetchpriority="low"` (the monitor holds no image, so nothing
   on the first screen waits), the capture's `stillLife` decodes every
   picture in view, and the smoke reads each settled dossier's load state —
   run against the old code first, it failed on `perfect-ted-proposal`.
8. **Local `next start` on Windows answers 404 for a public file whose name
   holds encoded parentheses** (the wordmark), which the live site and
   `next dev` serve; the previews script routes `public/` from disk.
9. **Four `subpages-smoke` cases had been red since ADR-114**, each asking
   for something no code produces (empty cells and consoles fed to a law that
   rejects them; `data-theme="dark"`, which nothing writes; ordinals counted
   in the DOM where the knob only hides them; a rail height on a viewport
   with no rails). They assert what the page does now — BEST-PRACTICES.
10. **`verify-owner-gate`'s fifth tell was not the overview's own** (a lede
    that also renders on a public page); it is the overview's sentence now,
    31/31 on a production build.
11. ⚠ **THE FRAME'S HERO LOCKUP SAT UNDER THE MONITOR'S CORNER, AND A GUARD
    SAID IT WAS FINE.** Until half a screen of scroll `.hud__brand` is the
    hero lockup, aligned to the content column — directly under the
    monitor's bottom-left corner, which ends on the rails' last tick: its top
    7px below the monitor's rule at 1280×720 and 15px at 1920×1247, 102–122px
    inside the device's column, on every monitor still. The rails never had
    to clear it (a rail runs down the gutter; the lockup sits inboard of
    it), and a device as wide as the instrument band is the first thing on
    the site to span both. The smoke asserted "the wordmark sits under the
    device" — true at 7px — and passed. Found by reading the rails
    direction's still for chrome near a mark, not by any gate. The fix is
    the frame's OWN docked state (`.hud__brand.is-collapsed`: the rail's
    corner, 0.68) from the first frame on the instrument profile, so the
    monitor keeps its datum on both rail ends and nothing new is drawn; the
    class stays the scroll writers'. The smoke asserts the clearance now
    (beside the column by the floor of the frame's gap, or under it by the
    whole gap), fails at all three viewports without the rule, and the wave
    was shot a third time.

### Verification

- **Unit:** `sheet-instrument` (11), `sheet-arcs` (every reading recomputed
  a second way; the previews manifest against the files' own headers),
  `sheet-composition`, `sheet-directions`, `arcs-registry`,
  `owner-gate-doctrine`, `arcs-import-doctrine`, the three CSS ratchets at
  zero for `instrument.css`, and `tsc`.
- **Playwright:** `arcs-instrument-smoke` 10/10 on `next dev` (two screens
  that never overlap, the device between the rails and the wordmark clear of
  it at 1280×720, 1440×800 and 1920×1247; the plot is the record; every row
  opens its own dossier with its picture loaded; keys and filter; a mark and
  a deep link; reduced motion; the kit; 4.5:1 in both themes). Both guards
  added in this pass were run against the code they replace and failed
  there first. On a production build with a
  signed pass in the storage state: `arcs-instrument-smoke`, `subpages-smoke`
  and `arc-terminal-smoke` 33 passed, 1 skipped (the kit, proxy-blocked
  there).
- **The gate:** `verify-owner-gate` 31/31 on a production build — no
  prerendered `arcs.html`/`.rsc`/segment, every anonymous transport a 404
  with no client name in its body, no static chunk holding a client lede.
- **The mechanical gate** on `/arcs` and the kit, both themes, 1920×1247 and
  1280×720: pass, zero contrast findings.

### Wave 03 (the turnstone ship, rubric 0.2.1, three runs)

The house and four directions on the overview and its kit, both themes, at
1920×1247 and 1280×720 — ten folders, 120 stills, the gate clean on every
cell — shot THREE times: findings 7 and 11 each threw a whole shoot away
(`evals/waves/wave-03.md`).

| direction         | 1920×1247             | 1280×720                  |
| ----------------- | --------------------- | ------------------------- |
| SB house          | 12/12                 | 12/12                     |
| SG `span=full`    | 9/12 (M3 ×3)          | 10/12 (M3 ×2, M4)         |
| SH `rows=boxed`   | 12/12, none unstable  | 12/12, none unstable      |
| SJ `dossier=pair` | 11/12 (A6, a misread) | 12/12                     |
| SL `frame=rails`  | 12/12                 | 11/12 (B2, L3, a misread) |

- **The rubric separates exactly one direction, for the reason it exists**:
  on SG's 2023-to-now axis the two same-lane format pairs merge into one
  diamond each and the grader counts 7 against `Marks 9`. The pick between
  the house, SH, SJ and SL is the owner's eye.
- **The grader's own noise is measured**: the log stills are byte-identical
  in SB, SG and SL, and 7 of 8 triples got one verdict; the flip is L3 reading
  a gutter that is not there.
- **The stranger reads the monitor as a "client engagement timeline
  dashboard" and the log as an archive, never a quest journal** — see below.
- The eye found what no check reads: SH's nine plates run ~37px past the
  rails' end at 720 high, and SL's strips touch the rails' end ticks (clear
  of every label and mark, by its stated condition).

## U1 (2026-09-21, owner) — the log is blocks, a gutter from the dossier

**The read**, of the built log, live: _"good foundation but it looks messy. It
needs more breathing room between the two panels. And each section on the left
side needs to feel more like blocks instead of glorified word document. So
let's simplify the arc subpage."_ His reference: the codex list — a column of
bordered PLATES, a wide gap, one panel.

**What the still held, counted.** The left column was an OUTLINE: 43 lettered
strings and 15 hairlines in six heading-rule-line runs, five of the six heads
over ONE row. Every chip restated its own title (`PROPOSAL` / "The proposal",
nine of nine), and the chips' four widths started the titles at four x
positions. The chosen row butted into the dossier's lip — the zero gutter was
§3's own design. And the two panels shared a top and nothing else: the list
ended ~100px above the dossier's floor at his window (279px on the kit).

**Decision.**

- **One BLOCK per engagement** — a bordered square box (the filter stations'
  grammar at row scale, ADR-089 U3/U4): a mono line (the standing diamond, the
  client, the bracketed date at the right end) over the sans title; one gap
  between blocks; the chosen block FILLED `--gold` on `--gold-contrast`, every
  other outlined on `--sh-plate`. The DOM reads client, title, date; the grid
  seats the date on the first line.
- **The heads, the counts and the chips go.** The client is each block's own
  first line; a client with several engagements reads as a RUN of blocks under
  one name (the kit's Northwind). `SheetLogRow.chip` stays in the record,
  lettered nowhere — the copy law still walks it, one line brings it back.
- **A gutter**: `--log-gutter: clamp(48px, 6vw, 112px)` — 76.8px at 1280, 112 at
  1920 (SH had 40).
- **One datum, one floor.** The filter is a head strip exactly `--mon-strip-h`
  tall, level with the dossier's band at both edges; the blocks DIVIDE the
  device's height: `--log-block-h: clamp(44px, (mon-h − strip − n·gap) / n,
9svh)`, `n` written inline by the server as `--log-n`. ⚠ **The token is
  declared ON THE LIST**, beside `--log-n`: a custom property resolves where it
  is declared, so on the root it would compute against a missing `n`, go
  invalid, and every block would fall back to its content with nothing
  erroring. ⚠ **The ceiling is 9svh, not 8**: at 8 the kit's eight blocks hit
  the clamp at 1920 × 1247 and ended 61px short — the one-floor claim failing on
  the fixture that exists to be harder than the record. `n` counts every row,
  so a filter never resizes a block; the list just ends sooner.
- **The runs are ordered by their NEWEST FILING, the house formats last** (law
  7 of `instrumentViolations`, two break-cases, and a reversed-registry proof on
  the kit). Registry order put Trinny (09·09) over Suri (09·12), a sorting bug
  once no head explained it. **The monitor's lanes keep registry order** — a
  lane that moved every time something was filed would be a worse monitor —
  and the lit mark is what ties the frames.
- **The `rows` knob and direction `SH` are DELETED**: he read the ruled value
  and the house went past the boxed one. `SG`, `SJ`, `SL` stay open.
- **The narrow desktop rung (961–1100)**: the four stations are ~343px on one
  line and a strip level with a band may not wrap; at 5/12 the list is 309px at
  1024 wide (measured 34px over), so the list takes half and the stations
  tighten to 8px. **On a phone** the strip may wrap and the blocks are a fixed
  56px.

**Measured** (`arcs-instrument-smoke`, 15/15): 50.5px blocks at 1280 × 720,
56.5 at 1440 × 800, 94.2 at 1920 × 1247 and 107.4 on the kit there; the list
within 0.14px of the dossier's floor at every shape; the strip level with the
band to 0px; the stations one line with 33.5px spare at 961 and 31.6 on a 375
phone. The gutter, block and floor guards were run against the OLD geometry
(injected) and fail it: gutter 0, nine blocks off the token, the floor 119.5px
short.

**Findings.**

1. **A token that needs a value from lower in the tree is declared THERE.**
   `--log-n` lives on the list; a `--log-block-h` on the root is guaranteed-
   invalid and every block falls back to `auto` with no error — the house's "a
   custom property is a string until something lays it out", one level up.
2. **The mechanical gate had a DEAD allow-list entry.** `.sh-stn.is-on` never
   matched, because `describe()` names an element by its first class; the
   picked station passed only by being under 32px. Stretched to the 36px strip
   at 1920 it surfaced as a structural gold violation. The gate now counts
   `[aria-pressed="true"]` as state, beside `aria-current` and
   `aria-selected` — a pressed toggle is state by definition, and the rubric
   already named the picked station as one.
3. **A fixture that is harder than the record is what catches a ceiling.** The
   real nine never touch 9svh; the kit's eight would have hit 8svh at 1920.
4. **Five readers find a block by its strings** — `.sh-log__row`, `.is-on`,
   `data-id`, `data-status`, `aria-current`, `data-sh-filter` on the `<li>`
   (the controller, the station row, the capture's second pick, the preview
   capture, the kit's fills fake) — and none of them fails loudly. All kept.
5. **The tenth engagement is a cliff at 1280 × 720.** Ten blocks land exactly
   on the 44px floor there (44.8); the eleventh runs the list ~42px past the
   rails, flowing in the page under the sticky dossier.

**Not graded yet.** A wave is one CSS state, and the gutter and the fill are
his to tune on the first still; wave 04 (rubric 0.3.0: L1 blocks, L2 one filled
block, L3 a gutter and one floor; wave 03's house log stills promoted as a third
negative pole, `SR`) waits for his word. Wave 03's MONITOR stills are unchanged
by this update.

## Left open

- **Since U1, his to rule on the first still:** the gutter's width (one
  token); the filled block's weight — a solid slab about 1.55× the area of the
  row he saw filled, where the dial if it reads heavy is the FILL (a gold wash
  with a gold outline), never the box; whether the chip should come back as a
  second right-hand reading; and the dossier's `Client` and `Kind` rows, which
  its own band already letters.
- **A pre-existing red, not this ADR's:** `subpages-smoke`'s "the kit's pile
  stacks under a panel that sticks" fails on `/test/subpage-kit` — its starting
  scroll (`top − 96`) leaves the panel at y 217 against a 64px sticky seat, so
  it measures the panel before it has stuck (153px). The page loads none of
  U1's files.
- **The dates are seeds.** Git says when a page was made, not when the
  engagement happened. One line each to correct.
- **The plot's dotted divisions are verticals inside an object.** The rubric
  tells the grader they are a scale, and the smoke names and bounds the
  exemption (`.sh-mon__grid`); whether they sit right with "the rails are the
  only verticals" is his to rule on the first still. `SL` shows the other
  reading.
- **The section dots** over each mark are honest (one per section of the
  arc's page, countable against the dossier) and low-stakes; one rule hides
  them.
- **The log reads as an ARCHIVE to a stranger, never a quest journal.** L1–L4
  pass, so it is the grammar the references share; a stranger names it by its
  content, nine real engagements, rather than by its genre. Whether "they
  really feel like quests" wants it dressed more like a game's menu is his
  call; nothing was changed to move a word. ⚠ His own read agreed with the
  stranger's before the galleries did — "a glorified word document" — and U1 is
  the answer; wave 04's stranger's read is where it gets measured again.
- **The docked wordmark on a first screen is new to him.** Everywhere else
  on the site the first screen carries the hero lockup; on the instrument it
  sits docked in the rail's corner from the start (finding 11). It is in
  every monitor still of wave 03, so he rules on it with the rest.
- **The phone is a functional fallback**, not a design: the lanes stack and
  the dossier unsticks under the list. A phone pass follows his desktop pick.
- **The pictures load eagerly**, nine of them, ~770 kB at low priority. At
  thirty engagements that wants warming on intent instead.
- **The lawful fixture was never lawful on parchment** (the calibration wave):
  it paints the void ground under the light theme.
