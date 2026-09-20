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
band whose own rules the page draws, inside the HUD frame. It is the site's
THIRD grammar — the corridor and the decks under `/arcs` are the other two —
and the first for a page that lists things.

**Read first**

- [ADR-114](../../sentinel/decisions/114-the-sheet.md) — the grammar, the ten
  arrangements, the variety law, the knobs, the pages, the ship, and ten traps.
- [`docs/design/subpages/README.md`](../../docs/design/subpages/README.md) —
  the URLs, the knobs, the rulings the owner is being asked, verifying.
- [ADR-092](../../sentinel/decisions/092-type-material-tokens.md) — the type
  tokens every rule in `sheet.css` reads.

## Contracts

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
- **The house formats are CELLS; the client-bound arcs are CARDS.** On the
  overview `.sh-card` counts `ARCS.length − houseArcs().length + Σ pages`
  and `a.sh-cell` counts the house formats. The terminal smoke's overview
  case reads the kicker off whichever the href lands on.
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
- **A wave without `ledger.py tick --handback` never happened.**

## Verifying

```bash
npx vitest run tests/lib/sheet-composition.test.ts tests/lib/sheet-directions.test.ts tests/lib/sheet-arcs.test.ts tests/lib/sessions-registry.test.ts tests/lib/musings-registry.test.ts
npx playwright test tests/visual/subpages-smoke.spec.ts --project=desktop
npx playwright test tests/visual/arc-terminal-smoke.spec.ts --project=desktop   # the arcs stay byte-identical
node scripts/capture-subpages.mjs --dry-run
```

then, from PowerShell, the mechanical gate per route × theme × viewport as ADR-114
§Verification prints it, and a wave: `node scripts/capture-subpages.mjs --wave
wave-01-sb --k SB --port 3003`.
