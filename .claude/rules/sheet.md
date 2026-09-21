---
paths:
  - "components/sheet/**"
  - "lib/sheet/**"
  - "lib/sessions/**"
  - "lib/musings/**"
  - "content/musings/**"
  - "app/(marketing)/home-sessions/**"
  - "app/(marketing)/musings/**"
  - "app/(marketing)/arcs/page.tsx"
  - "app/(marketing)/arcs/[slug]/page.tsx"
  - "app/(internal)/test/subpage-kit/**"
  - "scripts/capture-subpages.mjs"
  - ".claude/skills/thoughtform-design/eval/subpages/**"
description: The sheet — the ruled-document grammar for overview subpages (the arcs index and client pages, Home sessions, the musings) and the turnstone ship that grades it
---

# Rule: the sheet

A subpage is a ruled document: content-height sections on a twelve-column
band between the frame's rails, seamed between sections, inside the HUD
frame (U1: the rails are the page's only verticals). It is the site's
THIRD grammar — the corridor and the decks under `/arcs` are the other two —
and the first for a page that lists things.

**Read first**

- [ADR-114](../../sentinel/decisions/114-the-sheet.md) — the grammar, the ten
  arrangements, the variety law, the knobs, the pages, the ship, and ten traps.
- [`docs/design/subpages/README.md`](../../docs/design/subpages/README.md) —
  the URLs, the knobs, the rulings the owner is being asked, verifying.
- [ADR-092](../../sentinel/decisions/092-type-material-tokens.md) — the type
  tokens every rule in `sheet.css` reads.
- [ADR-118](../../sentinel/decisions/118-the-arcs-overview-is-an-instrument.md)
  — the arcs overview as an INSTRUMENT (a monitor and a log), the `date` field,
  and rubric blocks M and L; §The arcs instrument below.

## Contracts

- ⚠ **`/arcs` IS THE OWNER'S PAGE (ADR-117).** `force-dynamic`, and
  `assertOwner()` is the first thing it does — anything added to the page
  renders AFTER that call, never before it, and the page may never become
  static again (`owner-gate-doctrine`). Under `next dev` the gate is open, so
  the capture and the smokes reach it; `OWNER_GATE=enforce` closes it locally.
  The client pages (`/arcs/<client>`) are public and are not gated.
- **A section is ONE arrangement from the vocabulary** (`SHEET_ARRANGEMENTS`),
  as data in `lib/sheet/types.ts`, drawn by `components/sheet/SheetRenderer`.
  A new kind is a union member, a renderer case (the switch is exhaustive) and
  a rubric row, in one commit. Chrome strings — the `// Client` designation,
  `[ FIG. n ]`, `01 /` — are lettered by RENDERERS, never authored in a record.
- **The variety law is code and every real page walks it.**
  `compositionViolations` in `lib/sheet/composition.ts`;
  `tests/lib/sheet-composition.test.ts` walks the arcs overview, every client
  page, the sessions page, the musings ladders and the kit. A page that needs
  a fourth of one kind wants a different kind.
- **The chapter cap is on the PRIMARY row.** Every section with `menuLabel`
  is a drawer entry; ≤5 `menuPrimary` ones join the header's inline row
  (`SheetChapter.primary`). A console SET contributes one chapter per console.
- **`sheet.css` is token-only and pinned at zero** in the type ratchet, the
  theme sweep and the phone-unit sweep; light re-derives every `--sh-*` alpha
  in `theme.css` under `html[data-theme="light"] .sh-root`. A literal in it
  fails a test the hour it is written.
- **No vertical rule of the page's own** (ADR-114 U1, owner 2026-09-20: "we
  already have our rails"). A section divides itself with seams and shared
  cell edges; the smoke asserts it as paint on every route.
- **The first value of every knob is the house.** `lib/sheet/directions.json`
  is THE registry; the page imports it, the capture reads it by path, the
  ship's `armada.toml` mirrors it (a lane per direction, a type per page) and
  `tests/lib/sheet-directions.test.ts` asserts the mirror. Knobs are
  `data-sh-<knob>` on `.sh-root`; `?k=<ID>` overrides after mount; a losing
  value goes with its CSS and its guards once the owner has read both.
- **Every readout is DERIVED.** The client console's five rows come from
  `CLIENTS`, `ARCS`, `ArcDef.status` and `ClientDef.since` — never authored
  in `lib/sheet/arcs.ts` — and `tests/lib/sheet-arcs.test.ts` recomputes
  them. A composed string is outside every content scanner (ADR-070 U15), so
  the readouts are walked through the copy law there.
- ⚠ **`/arcs` IS NOT A DOCUMENT SINCE ADR-118.** It is the owner's
  INSTRUMENT — a `monitor` then a `log` — and answers to its own law, not the
  variety law; see §The arcs instrument below. The client pages
  (`/arcs/<client>`) are still sheets, and each still draws its console.
- **The console imports the stack's MECHANISM and copies its SKIN.**
  `useStackedCardsScroll` drives `[data-pc-slot]` slots; the chamfer, the
  evenodd lip ring and the pile geometry are `--sh-*` tokens in `sheet.css`,
  never a selector reaching into `proof-stack.css`. `.sh-root` is
  `overflow-x: clip`, never `hidden` (a scroll container kills sticky). On the
  inert rung (≤960, ≤680 tall, reduced motion) every slot parks pinned.
- **`data-sh-ready` is the capture's observable.** `SheetShell` writes it
  only after the three faces have loaded, two frames have painted and the
  rail has a height, and it carries values the page computed. A script that
  waits on a number it set itself has no wait.
- **The sessions record derives its status.** `lib/sessions/registry.ts`
  authors four mornings (owner-to-confirm, digits allowed for dates and
  nothing else); `sessionStatus` / `nextSession` read the date at request
  time (`revalidate` daily). The CTA is a `mailto:` whose subject names the
  morning; the services card's `ctaHref` is `/home-sessions` on BOTH records
  (`services-copy` pins it).
- **A post is a file.** `content/musings/<slug>.mdx`; `lib/musings/registry`
  is `server-only` (vitest aliases the marker to `tests/stubs/server-only.ts`)
  and `next.config.mjs` traces the folder for both routes and the sitemap, or
  the pages work in dev and 500 on Vercel. A draft is reachable and noindexed;
  the footer's row stays `href: null` until a post is published (the footer
  test requires every footer path in the sitemap).
- **A declared image size is read off the file**, never typed: the table
  photograph is 840×1360 and was declared 1600×2000 for an hour with nothing
  failing.

## The arcs instrument (ADR-118)

The overview, the owner's page. Two screens: a MONITOR that plots every
engagement at the date it was filed, then a LOG divided by kind — one notched
block per engagement with its page's icon, one filled — a gutter from its
DOSSIER, read like a travel-data panel: a tinted band, a readout, the client's
intelligence configuration drawn in Tensor gold, one big button (ADR-118 U1,
U2, U3).

- **Two arrangements, exactly, in that order.** `monitor` and `log` are in
  `SHEET_ARRANGEMENTS`, but a ladder that holds either is judged by
  `instrumentViolations` (`lib/sheet/composition.ts`): every mark at its own
  date on BOTH windows, on a real lane, oldest first; NOW inside both windows
  and right of every mark; the terminus's `Marks` reading equal to the marks;
  ONE id set across marks, rows and dossiers; the lit mark IS the selected
  row; every row in its KIND's section, each section newest first and the
  sections by their NEWEST FILING (U2); a drawn configuration inside its
  ceilings (`configurationViolations`: 1–4 workstreams and one ghost, 1–8
  links, each named by at least one workstream). None of this is visible in a
  still, which is why it is code. Neither frame letters an ordinal.
- ⚠ **THE LOG IS THE REFERENCES' COMPOSITION, TAKEN LITERALLY (ADR-118 U2,
  owner: "a glorified PowerPoint … have you actually looked at these
  references?").** The kinds DIVIDE the list — a mono head per kind (name,
  count) on a seam, the first level with the dossier's band — where U1 had them
  as filter tabs; `log.filter` and the log's station row are deleted
  (`SheetStationRow` stays for `/musings` and the subpage kit). A block is the
  kind-of-page ICON (`LOG_GLYPHS`, ink never gold, outside the plate) then a
  PLATE notched bottom-left: the client as its title (sans, lit, one step up),
  over one mono line — the engagement bracketed by the renderer (`The <chip>`,
  or `House format · V2`) and the date. ⚠ **A bracket is never stored** (the
  copy law bans it in data). ⚠ **The notch is a CLOSED evenodd ring** on
  `::before`, and the fill is the plate's BACKGROUND (a painted pseudo is
  invisible to both contrast walks). The blocks divide the device's height
  (`--log-block-h` from `--log-n` AND `--log-heads`, written on the list — ⚠ the
  token is declared ON THE LIST, or it goes invalid silently) above a 50px
  floor; under it the list runs past the screen beside the sticky dossier (the
  owner allowed it) and a key step scrolls its row into view. ⚠ The monitor's
  LANES keep registry order while the log's sections run by filing: two orders
  on purpose. ⚠ Four readers find a block by its strings (`.sh-log__row`,
  `.is-on`, `data-id`, `data-status`, `aria-current`) and none fails loudly.
  Below 1100 wide the list takes half (the mono line clips at 5/12); on a phone
  the blocks are 60px.
- ⚠ **THE DOSSIER READS LIKE TRAVEL DATA (ADR-118 U3, owner, with Starfield's
  panel beside U2's still).** The BAND takes the proof card's folder tint
  (`.pf-card__head`: gold `--sh-band-from` .28 running to a quarter, light .22,
  one colour for every client) and stays `--mon-strip-h` tall — the log's
  first head is level with it. ⚠ **Both contrast walks are blind to a
  gradient**: the smoke composites the tint at each band word's own x. The
  brief's SENTENCE is gone (owner, asked: rows only) — the dossier's name is
  still its `aria-label`. The READOUT (`.sh-dos__readout`, `dossierStatus`) is
  Starfield's cell: each row a key FILLED (`--sh-well`) and framed in
  `--sh-seam`, its value framed beside it sharing the edge and set right, rows
  3px apart, the keys one column (40 %). ⚠ A fill on EVERY key is a column's
  material, not a state (ADR-082 U29's law is about one fill among outlines).
  The WAY IN is one full-width button (`.sh-dos__foot .sh-cta`, the proof
  card's `.pf-watch` — outlined at rest, filled on hover/focus), and the
  printed key hints are deleted; the keys still work. `--dos-row-h` and
  `--dos-read-pad` are sized so the readout and the button take no more
  height than the brief, its strip and the hints did — the board's floor at
  1280 × 720 has ~1.5px to spare.
- ⚠ **THE DOSSIER DRAWS THE CLIENT'S CONFIGURATION, AND ONLY A PROPOSAL HAS
  ONE (ADR-118 U2).** Band, readout, the BOARD, the way in; the picture, the
  chapters and the readout table are deleted. The board
  (`components/sheet/config/`, server-only) is one TENSOR-GOLD die (U3 — U2
  drew it in ink) of the proposal's workstreams with chips around it for what
  it runs on and inside, joined by multi-wire buses — the CP2077 circuit reference in
  the proof board's grammar, the pure helpers imported (`ribbon.ts`,
  `substrateKit`), the glyphs copied onto `--sh-*` (the PDA's glyph files are
  CLIENT files and would leak a registry type into a public chunk). ⚠ **Nothing
  is authored for it**: rows are `configuration.teams[]`, links are
  `lib/arcs/stack.ts`'s matchers run over each workstream's own `where`/`runs`
  sentence, pinned `toEqual` per proposal in `sheet-config-fit`; a bracketed
  `[Next team]` is the scaffold's placeholder and is dropped. Trinny's board is
  its own configured board's tools over its phases, read from
  `lib/arcs/content/trinny-london-offer.ts` (the route re-exports it). ⚠ **FOUR
  CROPS, A CONTAINER QUERY PICKS ONE** (`CROP_SWITCH`, mirrored by hand in
  `instrument.css` and pinned there): neighbouring crops differ by ≤ 1.23 in
  aspect so no desktop box is more than 10 % letterbox. ⚠ **Fit is declared**
  (`configGeom` emits every string with its measure) and the floor (names
  ≥ 11px, kickers ≥ 10px) is asserted against the MEASURED boxes
  (`BOARD_BOX_PX`, the smoke holds them to 2 %) — and since U3 on EVERY
  proposal's board, not the default one, at all three shapes. ⚠ The line
  steps clear the font's EM BOX, not its ink. ⚠ **THE CONFIGURATION IS TENSOR
  GOLD, THE BOARD IS NOT** (U3): the die `--gold` with its words on
  `--gold-contrast` (`--sh-knock*` — never the ground, which is parchment in
  light), its legs `--gold`, its wires `--sh-amb` (the homepage board's amber
  through `--gold-line`), the chips' kind codes `--gold-ink`; the chips'
  frames and top rules and the faint traces stay dawn. The portfolio and the
  house formats draw no board (owner: "keep the proposals for now"); their
  panel is as tall as what it says.
- **Every reading is derived** (`arcsInstrumentSections`, `lib/sheet/arcs.ts`)
  from `CLIENTS`, `ARCS`, `status`, `since` and `date`, and `sheet-arcs`
  recomputes each a second way. `today` is a PARAMETER: the page asks the
  practice's clock once (`todayIn(PRACTICE_TIME_ZONE)`), a test pins it,
  nothing in `lib/sheet` reads a clock.
- **The axis is `lib/sheet/axis.ts`**: whole weeks with one of lead-in while
  the record fits in sixteen, then months, then quarters; a date sits at the
  MIDDLE of its day. The division that holds today gives NOW its label AND its
  line — a dotted boundary a few pixels off the cursor read as a doubled one.
- ⚠ **BOTH WINDOWS ARE RENDERED.** `span` is a knob the client may flip after
  mount (`?k=SG`), so every positioned thing carries `--t-active` and
  `--t-full` and `.sh-t` picks one; the ticks and the scale carry
  `data-window`. A window chosen on the server makes a direction unshootable.
- **Each device is as tall as the rails**: padding is `--hud-rail-y-start` /
  `--hud-rail-y-end`, so the monitor hangs from the first tick, sits on the
  last, and ends above the fixed wordmark; the dossier sticks at the same two
  edges. The smoke asserts both, at three viewports.
- ⚠ **THE WORDMARK IS DOCKED FROM THE FIRST FRAME ON THE INSTRUMENT.** At
  scroll 0 `.hud__brand` is the HERO lockup, aligned to the content column,
  and a device as wide as the instrument band ends right over it (7px at
  1280×720). `instrument.css` styles it as the frame's own docked state
  (`.is-collapsed`: the rail's corner, 0.68) in both of its states; the
  class stays the scroll writers'. The smoke asserts CLEARANCE — beside the
  column by 16px or under it by the frame's gap — because "under the device"
  was true at 7px and passed.
- **The graticule is DOM, never an SVG `viewBox`** — a crop letterboxes one
  axis at every desktop shape. Its dotted divisions and NOW drop are the ONE
  named exemption to "the rails are the only verticals" (`.sh-mon__grid`).
- ⚠ **ONE CLIENT FILE, AND IT IMPORTS NO REGISTRY.**
  `SheetInstrumentController` reads everything off the DOM; a client chunk is
  public and the page is not (ADR-117). `arcs-import-doctrine` fails any
  client file under `components/sheet` that imports `lib/arcs`, `lib/cases`,
  `lib/sessions`, `lib/musings` or `lib/sheet/{arcs,home-sessions,musings}`.
- **The server chooses** — the newest engagement is filled, lit and shown
  before a line of script runs; every dossier is rendered and all but one are
  `hidden`. A plain click selects, a modified click and a KEYBOARD click
  (`detail === 0`, Enter on a focused row) keep the link's own behaviour;
  ↑/↓ walk every row ACROSS the kind sections and scroll the next into view;
  `#arc=<id>` deep-links.
- ⚠ **`data-dos-id` ON THE ROOT IS THE OBSERVABLE**: removed when a swap
  starts, written only when the incoming dossier has settled — its aperture
  open. The capture and the smoke wait on it, never on a timer. ⚠ Until U2 it
  also waited on the dossier's picture decoding (wave 03's first shoot put
  seventeen half-painted plates in front of the grader with every gate green);
  the picture is gone — the board is inline SVG, painted with the markup — and
  with it the wait. ⚠ **On arrival it is written at once, a deep link to the
  already-chosen row included**: `select()` does nothing for the current id,
  and the picture's promise was the only writer on that path (a smoke case
  holds it).
- **Motion is CLIPS**: a centre-out aperture on each device's arrival (armed
  only once the controller runs, under `no-preference`), a NOW drop, a 180ms
  dossier swap that rapid steps skip. One element holds one `clip-path`, so
  the dossier's aperture is the ARTICLE and its chamfer is `__in`.
  ⚠ The capture's `stillLife` waits on `.sh-ap-root` as on a reveal — shot
  before its `is-in`, a still is a closed aperture.
- **Gold is state, and since U3 the configuration**: the lit mark (an
  OUTLINE, so `--gold-line`), the NOW cursor, the filled block, the button and
  the dossier's lip, then — by the owner's ruling — the band's tint and the
  drawn configuration (die, legs, wires, kind codes). The monitor's ring is
  dawn and the icons are ink. ⚠ The gate reads neither an SVG fill nor a
  gradient, so its count (10 of 24) did not move; the ship's rubric, which
  counts gold per object, must count the configuration as ONE before wave 04.
  ⚠ The gate names an element by its FIRST
  class and never reads a background, so a two-class ACCENT_ALLOW entry
  (`.sh-stn.is-on`, `.sh-log__row.is-on`) never matches; the filled block is
  declared by `.sh-log__plate`, and state is read off `aria-current`,
  `aria-selected` and `aria-pressed`.
- **`/test/arcs-instrument-kit` (type `AK`)** draws what the record does not
  hold yet — a three-engagement client with one running, a same-day pair on
  one lane, a relationship older than the window, a house format's V2 cut, and
  a configuration AT ITS CEILING (four workstreams, a ghost, eight links) —
  with NOW pinned, and `?fake=even|fills` for the two fakes M3 and L2 are
  written against. It is proxy-blocked in production, so its smoke case skips
  there.
- **Verifying:** `tests/lib/sheet-instrument.test.ts`, `sheet-arcs`,
  `sheet-config-fit` (the board, every proposal on every crop, the rings'
  closure), `sheet-log-glyphs`, `tests/visual/arcs-instrument-smoke.spec.ts`
  (runs on `next dev`, where the gate is open, or on a build with a signed pass
  in the storage state — a hand-made `browser.newContext()` inherits none of
  it), and the mechanical gate on `/arcs` and the kit in both themes at
  1920×1247 and 1280×720, run as the capture runs it (`--scope ".sh-root"` and
  the frame excluded — scoped to `body` it fails on the HUD's own chrome).

## The ship

`.claude/skills/thoughtform-design/eval/subpages` — an armada engagement,
callsign `turnstone`. Its own `CLAUDE.md` carries the three traps. The
short form:

- **Subjects are themes** with register strips for identity; **types are
  pages**; **lanes are directions**; **draws are sections**; **settings are
  viewports**. `qa.py`'s preamble calls image 2 an identity photograph; the
  rubric's grading rules override it.
- **The capture is `scripts/capture-subpages.mjs`** in the site repo. It
  asserts the mirror, runs `mechanical.mjs` per cell first (whole-page budget
  24; the rubric's twelve is per still — `accentInView` on every manifest
  row), excludes the frame (`.sh-hud-root, .hud-nav-overlay, .rin-host,
.sh-sec--close`), waits on `data-sh-ready`, shoots one still per section, and
  drives a stacked console to its second slot's pin.
- ⚠ **RUN IT FROM POWERSHELL, OR WITH `MSYS_NO_PATHCONV`.** Git Bash rewrites
  a child's `/route` argument into a Windows path; the script sets the
  variable on the gate's child, but a hand-run `mechanical.mjs --url /x`
  from Bash still navigates to nonsense.
- ⚠ **A reveal in the viewport's last tenth never lands** (the observer's
  −10 % margin); the capture's wait uses 0.88 of the viewport and gives a
  running animation four seconds, not a veto.
- **The negative pole is shot once** from a worktree at the pre-change commit
  (`../01_thoughtform-negative`, `next dev --webpack -p 3004`) into
  `skill/assets/negative/`, and never re-shot.
- **A wave is one CSS state.** An edit to `sheet.css` between two directions'
  shoots makes F3 (each direction differs on its axis and no other) false by
  construction; a fix found mid-wave re-shoots every direction. The capture's
  manifest write replaces a re-shot file's row rather than appending it.
- **The grader is told what it may not grade.** The HUD frame (0.1.1) and the
  close (0.1.2) are excluded in the rubric's grading rules; a check that
  names something every still carries fails every still.
- **A wave without `ledger.py tick --handback` never happened.**

## Verifying

```bash
npx vitest run tests/lib/sheet-composition.test.ts tests/lib/sheet-directions.test.ts tests/lib/sheet-arcs.test.ts tests/lib/sessions-registry.test.ts tests/lib/musings-registry.test.ts
npx vitest run tests/lib/sheet-instrument.test.ts
npx playwright test tests/visual/subpages-smoke.spec.ts --project=desktop
npx playwright test tests/visual/arcs-instrument-smoke.spec.ts --project=desktop
npx playwright test tests/visual/arc-terminal-smoke.spec.ts --project=desktop   # the arcs stay byte-identical
node scripts/capture-subpages.mjs --dry-run
```

then, from PowerShell, the mechanical gate per route × theme × viewport as ADR-114
§Verification prints it, and a wave: `node scripts/capture-subpages.mjs --wave
wave-01-sb --k SB --port 3003`.
