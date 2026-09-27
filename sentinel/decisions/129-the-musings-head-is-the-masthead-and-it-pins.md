# ADR-129: The musings head is the masthead's — survey chrome, a pinned band, one word in the corner

- **Status:** Proposed (2026-09-27, owner) — shipped and guarded; flips to
  Accepted once the owner has read it live.
- **Surface:** `/musings` and `/musings/<slug>`, on the sheet grammar:
  `lib/sheet/types.ts` (`survey`, `pin` on the split), `lib/sheet/musings.ts`
  (both heads, `MUSINGS_CORNER`), `components/sheet/chrome.ts`
  (`surveyDesig`, `coordStamp`), `SheetSplit.tsx`, `SheetRenderer.tsx` (the
  head drawn before the body, on every sheet), `SheetShell.tsx` (`corner`, the
  head's measured height), `components/arcs/ArcHudNav.tsx` (`label`),
  `components/sheet/sheet.css` (§0 tokens, §1 the padding floor and the sibling
  seam, §4a the chrome, §4b the pin, §14b the head's veil, §15 the phone),
  `theme.css` (three light rows), `scripts/capture-subpages.mjs` (the seat).
- **Supersedes:** [ADR-127 §4](127-the-sheet-ends-on-the-site-footer.md)'s
  "every section but the close renders inside `.sh-body`" — the head is the
  body's sibling now, for the reason that section itself gives.
- **Related:** [ADR-044](044-services-masthead.md) (the masthead's survey plate),
  [ADR-119 U2](119-the-musings-rack.md) (the `#musings` station's head, the copy
  source), [ADR-114](114-the-sheet.md) (the sheet; chrome is lettered by
  renderers), [ADR-055](055-corner-section-readout.md) (the corner readout),
  [ADR-057](057-arc-terminal-motion.md) (the tall-beat head: "the head holds, the
  work moves"), [ADR-090](090-dossier-is-one-housing.md) (a reveal wrapper is a
  containing block).

## The ask

Owner, 2026-09-27:

> I want you to add the little eyebrow elements we also have on our homepage to
> the musings page and the overview page. When you open a specific musing and a
> specific article, add those elements. If you go to our homepage, in the proof
> section we have the little crosses and a bit of "Data reached out" above the H1
> and a paragraph. I also want it here. I think on the musings homepage, in the
> top-right corner, it now says "Featured all posts." We just need "Musings."
> And then I think the H1 and the paragraph should be sticky both on the Musings
> overview page and when you open an individual article.

"Data reached out" is the data READOUT — the mono designations hung over the
title and the brief. The proof casefile's own head is a bare rule since
2026-09-03; the elements he means are the services masthead's, one beat later in
the same pinned stage, which the `#musings` station copies.

"Sticky" had two readings, and he was asked: **a band pinned at the top** (the
head holds under the header while the sections scroll under it) was chosen over
a sticky left column.

## The decision

### 1. The survey chrome is data on the split, lettered by the renderer

`SheetSplit` gains `survey?: { code, state }`. The renderer letters
`${code} / TITLE · 01`, `${code} / BRIEF · 02` and `coordStamp(id, 1|2)`
(ADR-114: chrome strings are lettered by renderers, never authored in a record).
The index is `{ MUS, OPEN }` — the station's own code and state, and because the
index's id is `musings` its two stamps are the station's two stamps, pinned
against `MUSINGS_COORDS`. A post is `{ MUS, ON RECORD }`, the casefile's own
state word; `FILED` is not a house word. Home-sessions, the client pages and the
kit carry no `survey` and render byte-identically.

The elements, copied from `musings.css` onto the sheet's tokens: a designation
hung 34px over each block, the gold state chip at the brief's head-right, the
gold origin cross top-left of the title and the dawn close cross bottom-right of
the brief (one diagonal), a coord stamp under each block's foot, a masked
dot-grid lift under each. Every chrome string is `aria-hidden`. The inks are the
station's: the designation `--sh-ink-50` (.54, light .62 — the station's
`--mu-ink-3` pair exactly), the stamp .16, the close cross .5, the dot .07, with
three new `--sh-survey-*` tokens and their light rows.

- ⚠ **THE NAME KICKER GOES WHERE THE CHROME COMES IN.** The gold `MUSINGS` line
  above the title was the split's `name`; the designation is the eyebrow now, and
  the word moved to the corner. A split without `survey` keeps it.
- ⚠ **THE SHARED TOP LINE COMES WITH IT.** The base split seats the copy on the
  lead's FOOT (`align-self: end`), which would hang the two designations at
  different heights; a survey split seats both blocks on one line.
- ⚠ **BOTH BLOCKS ARE DECLARED CONTAINING BLOCKS** — `.sh-reveal` is a transform
  and contains an absolute child only until `is-in` (ADR-090), so the chrome
  would jump when the reveal landed.
- ⚠ **THE `head` KNOB IS INERT ON A SURVEY HEAD.** `head=stack` gives the lead
  `display: contents`, which deletes the box the chrome is positioned against;
  direction SD draws the house layout here.
- The title ladder stays the sheet's (sentence case, `--sh-display`). No `≤1700`
  hide of the close cross: the station hides it under the right rail's
  BEARING/SECTOR readouts, and a sheet's right rail carries none; the smoke pins
  the cross clear of the rail's box instead.

### 2. The head is pinned, and it is the body's sibling

`SheetSplit` gains `pin?: true` (both musings heads). The renderer draws the
split BEFORE `.sh-body` on every sheet — `{head}{body}{close}` — because a stuck
element inside the body slides 0.75× during the footer's rise (ADR-127 §4). DOM
order is unchanged, so the composition law and both DOM readers hold; the split
is skipped in the body's map, never filtered, so the ordinals are unchanged.

With `pin` the section sticks inside the exact complement of §15's inert rung
(`min-width: 961px and min-height: 681px and prefers-reduced-motion:
no-preference`), at z 1 over the body's context and under the close's z 2, which
covers it as the footer rises. Its containing block is `.sh-root`, whose box ends
on the close's last pixel, so it never releases. A 32px fade under it is what the
sections read through as they pass. During the rise it dims with the body: its
`::after` veil reads the body's own `--sh-run` timeline, lifted to the root with
`timeline-scope`, on the same range and keyframes.

- ⚠ **THE SEAT IS ARITHMETIC AGAINST THE HEADER'S ROW.** The row sits
  `--hud-margin` down and is one line box tall (base.css `body { line-height:
1.6 }` × the link size); then 8px of air; then the designation's 34px hang.
  `--sh-pin-head: calc(var(--hud-margin) + 1.6 * var(--sh-nav-link) + 42px)` —
  104.9 / 110.0 / 127.4 at 1280×720 / 1440×800 / 1920×1247. Measured: the stuck
  title lands at 104.9 and 127.4 and the designations clear the row's bottom by
  9.7px and 9.9px. The 1.6 is pinned from both ends.
- ⚠ **`--nav-link-size` IS DECLARED ON `.hud__nav`, NOT ON `:root`,** so the
  sheet cannot read it: a `var()` of it on `.sh-root` is invalid at computed
  time, and the seat's padding would have collapsed to ZERO with nothing
  erroring. The validation pass for this ADR missed it; `--sh-nav-link` mirrors
  the declaration and the test pins the copy to the original.
- ⚠ **THE OFFSET IS ≤ 0 BY CONSTRUCTION.** The sticky `top` is
  `seat − the head's top padding`, and the padding is floored at the seat
  (`max(rhythm, seat)`): on a wide-and-short window (1920×700) the rhythm
  padding falls under the seat and a positive offset would shove the head down
  at rest. −3 / −10 / −60px at the three reference viewports.
- ⚠ **WHAT STICKS UNDER THE HEAD SEATS BELOW IT.** A post's metadata column
  (date · author · reading · tags) is itself sticky at `--sh-pin-top`, inside the
  pinned band — it stuck BEHIND the head and vanished. The plan did not see it; a
  still did. Its seat is the head's stuck bottom, which depends on the head's own
  content, so `SheetShell` publishes the head's height as `--sh-head-h` through a
  ResizeObserver (never a scroll writer) and the column sticks at
  `offset + height + fade + gap`. Measured: 52px clear at 1280×720, 62 at
  1920×1247.
- ⚠ **THE FIRST SEAM IS DRAWN BY A SECOND RULE.** With the head outside the
  body, the body's first section has no `.sh-sec` before it and
  `.sh-sec + .sh-sec .sh-band::before` never reached it — every sheet lost its
  first seam. `.sh-sec--split + .sh-body .sh-sec:first-child .sh-band::before`
  draws it (no child or `:scope` combinator, per the renderer's own note).
- The cost is the frame: the stuck band is ~28 % of 1920×1247 and ~35 % of
  1280×720. At 1920×1247 the index's table is fully in view between the band and
  the floor when the footer's rise begins; the body's content is ≥ 1.25
  viewports on the shortest musings page, so the rise's range holds.

### 3. The corner prints one word

`ArcHudNav` gains `label?: { text, href }`. With it the inline row is one link
and the collapsed readout decodes the same word — a page with no subsections,
ADR-055's own rule. The drawer still lists every section and still marks the
active one; the screen-reader text says "current page". `SheetShell` threads
`corner`, and both musings routes pass `MUSINGS_CORNER` (`Musings` → `/musings`,
one constant so the index and a post cannot print two words). No arc passes it,
so every deck is byte-identical — `arc-portfolio-smoke` and `arc-terminal-smoke`
pass unchanged.

## Measured

Headless Chromium on the dev server, `reducedMotion: no-preference`.

| where                | stuck title top | designation − row bottom | metadata column − head bottom |
| -------------------- | --------------- | ------------------------ | ----------------------------- |
| `/musings` 1280×720  | 104.9           | 9.7                      | —                             |
| `/musings` 1920×1247 | 127.4           | 9.9                      | —                             |
| post 1280×720        | 104.9           | 9.7                      | 52.1                          |
| post 1920×1247       | 127.4           | 9.9                      | 61.7                          |

The state chip and the collapsed readout do not overlap at 1280×720 (chip right
edge 1151, readout left edge 1182). The readout decodes to `MUSINGS`. The right
rail's box starts 5.5px past the close cross at 1280×720; its painted ticks are
~50px further.

## Guards

- `tests/lib/sheet-split-survey.test.tsx` (new): both musings heads carry the
  survey and the pin and no other ladder does; the designations; the stamps
  equal the station's; the rendered markup (two designations, the chip, both
  crosses, both stamps, both grids, no name, every chrome string
  `aria-hidden`) and the inverse on a plain head; the head drawn before the
  body and skipped in the map; the corner on the two musings routes only and
  the readout lettered from `label`; the seat token, the mirror equal to
  `.hud__nav`'s declaration, base.css's `line-height: 1.6`, the padding floor;
  the pin only inside its gate at z 1 with its offset; the metadata column's
  seat and the shell's ResizeObserver; the head's veil on the body's timeline
  and range, `timeline-scope` on the root; the sibling seam; the chrome on
  tokens; the knob inert; the three light rows.
- `tests/visual/subpages-smoke.spec.ts` "the pinned survey head (ADR-129)" at
  1280×720 and 1920×1247: the chrome paints on the shared line, clear of the
  corner row by ≥ 7.5px, the close cross clear of the rail, the corner reads
  `Musings`, the wordmark's writer has not run; the head stays stuck at 1.2 and
  1.6 viewports with its offset ≤ 0 and paints over the body section under it;
  the readout decodes `MUSINGS`; the post's metadata column clears the head by
  ≥ 16px; `/home-sessions` keeps its name, its first seam and no pin. The phone
  case asserts the head flows with a static designation and no crosses.
- `scripts/capture-subpages.mjs` seats later sections under a pinned head
  (its stuck bottom + the fade + 24px) instead of `PIN = 96`.

## Left open

- **The mechanical gate reports two findings per theme on `/musings`**: the two
  8px coord stamps at 1.43:1. They are the survey grammar's own faint stamps,
  the same pair the homepage station carries as a known owner call
  (`.claude/rules/musings.md` §Verifying).
- **`ON RECORD`** as a post's state word is the casefile's; the owner may prefer
  another.
- **The stuck band's foot** keeps the section's rhythm padding under the
  paragraph; a tighter stuck band is a taste call not taken in this cut.
- **Pre-existing reds, not this ADR's:** `subpages-smoke`'s kit sticky-panel
  case (152.86px, ADR-127's finding), and six `arcs-instrument-smoke` cases that
  read the newest proposal's configuration board — the newest proposal is
  Pandora (ADR-128, filed 2026-09-26), which carries a `board` and no
  `configuration`, so the dossier the instrument opens on draws none.

## Verification

```bash
npx vitest run tests/lib/sheet-split-survey.test.tsx tests/lib/sheet-close.test.ts tests/lib/sheet-composition.test.ts tests/lib/musings-registry.test.ts tests/lib/sheet-directions.test.ts tests/lib/type-material-tokens.test.ts tests/lib/theme-css-sweep.test.ts tests/lib/phone-viewport-units.test.ts tests/lib/hud-brand-tokens.test.ts tests/lib/arcs-import-doctrine.test.ts
npx tsc --noEmit
npx playwright test tests/visual/subpages-smoke.spec.ts --project=desktop
npx playwright test tests/visual/arc-portfolio-smoke.spec.ts tests/visual/arc-terminal-smoke.spec.ts --project=desktop
```

From PowerShell: `node scripts/design-eval/mechanical.mjs --url /musings --theme dark --scope ".sh-root" --exclude ".sh-hud-root, .hud-nav-overlay, .rin-host, .sh-sec--close" --vp 1280x720 --prm` (and light) — two known findings, the stamps.

Then look at 1920×1247 and 1280×720 in both themes: the chrome at rest, the head
held on the overview while the featured cards and the table pass under its fade, the
corner reading MUSINGS before and after the collapse, the post's head scrolling
away with its metadata column at its own seat (U1), the footer rising over the
body with the head dimming.

## U1 - 2026-09-27, owner: the article does not pin

> On the individual musing page I don't want a sticky thing. It doesn't work.
> It's not having the effect I wanted because it's overlapping too much with
> the text and it breaks the flow. Technically it's working but it just doesn't
> work.

The post's split drops `pin`; it keeps its survey chrome (`MUS / TITLE · 01`,
`ON RECORD`, the crosses, the stamps) and the corner's MUSINGS, and its head
scrolls away with the page. The OVERVIEW keeps its pinned head: it is a page
that is browsed, and the band holds its title over cards and a table. An
article is read, and a band over a column of prose is a band over the reading.

What went with it: the metadata column's seat under the head (`--sh-head-h`,
the ResizeObserver in `SheetShell` and the `.sh-prose__meta` rule under
`[data-sh-pin]`). The column is sticky at its own `--sh-pin-top` again, as it
was before this ADR. The finding it answered stays on record in sheet.css: a
page with its own sticky column and a pinned head stack two pins, and the
column vanishes behind the band.

Guards moved with it: `sheet-split-survey` asserts the overview pins and the
article does not, and that nothing references `--sh-head-h`; the smoke's hold
test runs on the overview only, and its article test asserts the head moves
with the page (its top equals minus the scroll) and the metadata column sits
on its own seat. The chrome test now waits for the paragraph block's reveal to
land before measuring the shared line — it read 2.3px off mid-transition on one
run and 0 on the next, which is the kind of pass a timing lucks into.
