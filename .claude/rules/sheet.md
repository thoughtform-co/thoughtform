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
engagement at the date it was filed, then a LOG that lists them per client
with one filled row against its DOSSIER.

- **Two arrangements, exactly, in that order.** `monitor` and `log` are in
  `SHEET_ARRANGEMENTS`, but a ladder that holds either is judged by
  `instrumentViolations` (`lib/sheet/composition.ts`): every mark at its own
  date on BOTH windows, on a real lane, oldest first; NOW inside both windows
  and right of every mark; the terminus's `Marks` reading equal to the marks;
  ONE id set across marks, rows and dossiers; the lit mark IS the selected
  row; each group newest first. None of this is visible in a still, which is
  why it is code. Neither frame letters an ordinal or a head band.
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
  ↑/↓ walk the rows the filter leaves; `#arc=<id>` deep-links; a filter that
  hides the chosen row moves the choice to the first one shown.
- ⚠ **`data-dos-id` ON THE ROOT IS THE OBSERVABLE**: removed when a swap
  starts, written only when the incoming dossier has settled — its aperture
  open AND its picture decoded (bounded at 2.5s). The capture and the smoke
  wait on it, never on a timer. ⚠ **The first cut settled on the aperture's
  timer alone**, the pictures were `loading="lazy"` inside `hidden` dossiers,
  and wave 03's first shoot put seventeen half-painted plates in front of the
  grader with every gate green; the smoke now asserts each settled dossier's
  picture has loaded, and was run against the old code to prove it fails.
  The pictures are EAGER at `fetchpriority="low"` — the monitor holds no image,
  so nothing on the first screen waits for them.
- **Motion is CLIPS**: a centre-out aperture on each device's arrival (armed
  only once the controller runs, under `no-preference`), a NOW drop, a 180ms
  dossier swap that rapid steps skip. One element holds one `clip-path`, so
  the dossier's aperture is the ARTICLE and its chamfer is `__in`.
  ⚠ The capture's `stillLife` waits on `.sh-ap-root` as on a reveal — shot
  before its `is-in`, a still is a closed aperture.
- **Gold is state and nothing else**: the lit mark (an OUTLINE, so
  `--gold-line`), the NOW cursor, the filled row, the picked station, the CTA
  and the dossier's lip; `mechanical.mjs` names the four the one-long-side
  rule would misread. The monitor's own ring is dawn.
- **The dossier's picture is the engagement's first screen**
  (`scripts/capture-arc-previews.mjs` → `public/arcs/previews/` +
  `lib/arcs/previews.json`, sizes read off the files), OPTIONAL per
  engagement: a scaffolded arc falls back to its card at the card's size.
- **`/test/arcs-instrument-kit` (type `AK`)** draws what the record does not
  hold yet — a three-engagement client with one running, a same-day pair on
  one lane, a relationship older than the window, a filterable row — with NOW
  pinned, and `?fake=even|fills` for the two fakes M3 and L2 are written
  against. It is proxy-blocked in production, so its smoke case skips there.
- **Verifying:** `tests/lib/sheet-instrument.test.ts`, `sheet-arcs`,
  `tests/visual/arcs-instrument-smoke.spec.ts` (runs on `next dev`, where the
  gate is open, or on a build with a signed pass in the storage state — a
  hand-made `browser.newContext()` inherits none of it), and the mechanical
  gate on `/arcs` and the kit in both themes at 1920×1247 and 1280×720.

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
