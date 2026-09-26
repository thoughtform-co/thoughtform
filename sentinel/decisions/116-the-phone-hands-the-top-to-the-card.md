# ADR-116 — On a phone the studio card's two ruling sheets fit their bay, and the epilogue hands the top of the screen to the first proof card

- **Status:** Proposed (2026-09-21), built and guarded; **the owner's device read
  is the gate**. Chromium proves the fit, the clock, the stamps and the kill; it
  cannot show iOS's toolbar.
- **Surface:** the landing at ≤960 — the proof pile's studio FIELD sheet
  (both proof hosts: `/` and `/arcs/trinny-london/proposal`), the red line's
  cross on every `SheetsPlate` host, and `MobileEpilogueSignal` on the split
  rung (`PROOF_STACK_SPLIT_MEDIA`). Desktop is byte-identical but for one
  label (§3).
- **Closes:** [ADR-107](107-the-proof-card-is-two-sheets-on-a-phone.md)'s
  left-open item — _"the sheets and map fields have not been read on a phone
  since ADR-097 U10's frames"_.
- **Amends:** [`mobile-sections.md`](../../.claude/rules/mobile-sections.md) §2
  (the belt's attribute; a second kill line, on the card).
- **Related:** [ADR-084 U1/U2](084-casefile-panel-fills-its-housing.md) (the
  sheet template, the red line's named centre), [ADR-108](108-the-ring-on-phones.md)
  (which made the dock live on phones — the cause of §2's void),
  [ADR-115](115-the-phones-deck-flip.md) (`decodeLayer`, the un-type idiom
  reused here), [ADR-097 U12](097-proof-card-is-a-folder.md) (no fades, no
  flicker — the centre-out close).

## The ask

Owner, 2026-09-21, three screenshots from his iPhone:

> I have noticed that, on mobile, the contents of "We made the creative team
> self-sufficient," the governance, and the red line were never optimized for
> mobile … make them more minimalistic so that they fit on the card. And then,
> at the end of the arc, we have "AI capability your team owns" and then "How we
> did it at Loop". But on mobile, when you scroll down, they disappear a bit too
> quickly, resulting in a bit of a void on top … They need to stay a bit longer
> and disappear in sync with the cards of the proof section. And then also
> change the copy of "How we did it at Loop" into "How it looks in practice".

Asked and answered before building: GOVERNANCE = **two tiles on one line**;
RED LINE = **four quadrants round the named centre**; the title's exit =
**un-type in place**, driven by the first card's arrival.

## 1 · The two ruling sheets fit their bay

**What was wrong, measured at 390×844.** `casefile.css`'s ≤960 block STACKS
the comparison, un-clamps every sentence and stacks the four quadrants — right
for the casefile and the portfolio arc, where `console.css`'s ≤980 unwrap puts
the console into ordinary flow and height is free. The proof card's bay is a
DEFINITE box (`.pf-card__bay { overflow: hidden; container-type: size }`,
294 × 375 here), so that flow was cut mid-line: **875px of comparison in a
375px bay** (the whole second column below the floor) and the red line's fourth
risk off the bottom. ADR-107 budgeted the RECORD sheet;
`proof-stack-mobile-smoke` measured nothing inside a field sheet, so CI never
saw it.

**The decision.** Each sheet keeps its desktop DRAWING and drops its SENTENCES,
which the foot frame's verdict already carries in one line (THE PRINCIPLE,
THE POSITION). `proof-stack.css`, inside the existing ≤960 block, `.pf-stack`-
scoped — so both proof hosts and neither the arc nor the casefile flow:

- **THE GOVERNANCE — two tiles, one line.** Kicker · name · the picture · the
  quoted claim, the hairline between them back as `border-left`. The two tiles
  SHARE their rows by `subgrid` — head · slack · picture · claim · slack — so
  both pictures are one size on one line and the claims start on one line
  under them (tiles sizing their own rows put them at 107 and 90px at 360×740,
  because the claims wrap differently and the picture is what absorbs). The
  picture's row is `minmax(0, calc(50cqw − 22px))`: the tile's inner width, so
  it stops at a square; the grid fills a capped track BEFORE the `fr` rows
  (measured), so a short bay shrinks the picture and a tall one splits its
  surplus above and below the picture-and-claim pair. Measured squares:
  125 · 102 · 145 · 125px at 390×844 · 360×740 · 430×932 · 390×700.
- **THE RED LINE — the 2×2 and its cross, in the bay.** Tag and claim per
  quadrant, `NO AI UGC` at the crossing, the claim at 12px so `RELATIONSHIPS`
  (116px at the sheet's 13.2) fits a 112px quadrant on a 360px phone.
- `.fl-cmp__desc`, `.fl-cmp__ex` and `.fl-cap__d` leave the PAINT, not the
  tree (the sr-only idiom `.pf-card__claim-desc` already uses).
- `100cqh` inside the sheet is the BAY — the unwrap takes the console's own
  container away — and `− 2px` is the console's border; THE WORK's ads and the
  unwrap chain are untouched.

**Three traps, each found by measuring:**

- ⚠ **A SUBGRID'S OWN GAP IS TAKEN OUT OF ITS ITEMS.** The base column's
  `row-gap: clamp(6px, 1.1svh, 16px)` against the parent's 0 took half the
  difference off each side of the picture: a 116px square in a 125px row at
  844h. The tile's gap must match the parent's.
- ⚠ **CENTRING THE PICTURE ALONE IN A `1fr` ROW READ AS THREE FLOATING
  THINGS** (the name, the picture, the claim, ~170px apart) — ADR-084's
  `space-between` finding one sheet over. The picture and its claim are one
  object; the slack goes round the pair.
- ⚠ **THE CROSS NEVER CAME OFF THE STACKED LIST — ON ANY HOST.** `casefile.css`'s
  phone reset `.fl-caps--sheet { background-image: none }` is (0,1,0); the
  cross is drawn by `.fl-caps-block--hub .fl-caps--sheet` at (0,2,0), so
  specificity beat source order and a 1px vertical rule ran through every
  quadrant's text — the owner's second screenshot, and the same on the Trinny
  card and on `/arcs/loop-earplugs` below 960. The cross is a custom property
  now (`--hub-cross`), painted by `background-image: var(--hub-cross)`; the
  phone reset matches the painting selector, and the proof card paints it
  back on its own 2×2.

## 2 · The epilogue hands the top of the screen to the first card

**What was wrong — two causes, measured at 390×844** (a scratch probe at every
stop: `#services`' top / vh, the attributes on `<html>`, the block's inline and
COMPUTED opacity, slot 0's `--pc-enter`):

| `#services` top | `data-corridor-exit` | inline / computed opacity | slot 0              |
| --------------: | -------------------- | ------------------------- | ------------------- |
|         1.40 vh | —                    | 0.998 / 0.998             | enter 0             |
|         1.25 vh | **true**             | 0.998 / **0**             | enter 0             |
|         0.50 vh | true                 | 0.998 / 0                 | enter 0.30, top 562 |
|         0.45 vh | true                 | 0 / 0 (the 45 % kill)     | enter 0.37          |

1. ⚠ **THE CSS BELT WAS KEYED ON THE WRONG ATTRIBUTE, AND ADR-108 IS WHAT MADE
   IT WRONG.** `html[data-corridor-exit="true"] .home-v2-mobile-signal
{ opacity: 0 !important; visibility: hidden }` claimed to mark "the moment
   the corridor hands the page back". Since the ring rung made the dock live
   on phones, that attribute is written at DOCK ENGAGE — with `#services`
   still 1.25 viewports below the fold — so the belt emptied the top of the
   screen a full viewport before the first card started to rise. That is his
   third screenshot exactly (readout still `BUILD // THE ARC`, the planet on
   screen, nothing above it). It is re-keyed to `data-services-ambient`,
   written once the dissipate has finished; a phone off the dock rung writes
   neither.
2. Without the belt the block still LIFTED off from the moment `#services`
   entered and was cut at 45 % by the IntersectionObserver — with the first
   card still in the lower half of the screen.

**The decision.** On the split rung the block's exit is the FIRST CARD'S:

- **The clock** is slot 0's own `--pc-enter`, which `useStackedCardsScroll`
  already publishes (`smoothstep((vh − top) / (vh − pinTop))`, a pure function
  of the slot's live rect). `lib/home-v2/signalHandoff.ts` (pure, zero imports)
  inverts it in closed form to the card's top — no layout read in the block's
  frame loop — and maps that to `u`: 0 while the card's top is more than
  `SIGNAL_HANDOFF_SPAN_VH` (0.32) of the viewport below the hand-off's end,
  1 when it is `SIGNAL_HANDOFF_GAP_PX` (16) under the block's bottom edge. One
  clock drives the card's rise and the text's exit: that is "in sync".
- **The motion** is the masthead law: the block HOLDS its seat (no lift, no
  `SIGNAL_OUT`) and UN-TYPES in place through `decodeLayer` (ADR-115) — the
  label on `[0, .5]`, the title on `[.15, 1]`, the button's frame closing
  CENTRE-OUT over what its label left on `[.4, 1]` (`--sig-frame`, a clip, no
  fade). Stamped `data-untype` absent · `live` · `gone`, reversible both ways.
  The one opacity step is at `u = 1`, where nothing is left to paint.
- **The kill** (§2 of the rule stands) is the CARD's rect crossing
  `SIGNAL_KILL_VH` (15 %), observed. ⚠ **The observer carries a 100000px top
  margin** so "intersecting" means "the card's top is above the line" even once
  the pile has scrolled away above the viewport — without it, a jump from past
  the pile back to the corridor crosses no edge, fires no callback, and the
  epilogue stays dead on the reader's return.
- NaN — no split pile, or its hook has not written — is the corridor path,
  unchanged (lift, `SIGNAL_OUT`, the 45 % kill).

**Measured after, 390×844, snap disabled in the probe only:** whole and unmoved
(box 101–215 at every stop) from 1.40 vh to 0.45 vh; un-typing as the card's
top travels 495 → 231; gone at card top 225; whole again scrolling back up.
The unit test DERIVES the window over 681–1000px heights and 88–140px blocks:
the un-type begins with the card on screen, ends with it still below the
block, and the kill line always follows the hand-off and precedes the pin.

## 3 · The label

`HOW WE DID IT AT LOOP` → **`HOW IT LOOKS IN PRACTICE`**, on both surfaces in
lockstep (`MobileEpilogueSignal`, `CorridorStationHeaders`), still
`href="#services"`. No test pinned the string.

## Guards

- `tests/lib/signal-handoff.test.ts` — the inversion, the window derived from
  the phone rung's geometry, the kill's order, the sub-windows.
- `proof-stack-mobile-smoke` — **the studio card's ruling sheets fit their
  bay**: every painted text run's Range rects inside the bay and inside its own
  tile or quadrant; two square pictures, one size, one line, ≥72px; the claims
  on one line; the sentences sr-only and present; a 2×2 with the cross on the
  card and the hub printing through no risk. (Before this pass the same ink
  walk reported 12 spilled runs on GOVERNANCE and 3 on RED LINE.)
- `mobile-section-seams` — the epilogue case branches on the split rung: whole
  and unmoved at the old 45 % line, `live` and unmoved at 38 %, `gone` + inert
  on `#services`' seat, whole again scrolling back. The 45 % kill stays
  asserted wherever the pile is not split.

Run and green (2026-09-21): the unit suite (1724), both phone projects on
all three phone specs, `trinny-london-smoke`, `landing-page` without a
re-baseline, and `arc-portfolio-smoke` on a fresh server (the shared one's
`/arcs/[slug]` worker was dead). Headed captures looked at: 390×844,
360×740, 430×932 and 390×700, dark and light, the homepage and the Trinny
card, and the arc's stacked red line at 390.

## Left open

- **The device read** — iOS lays `position: fixed` out against the layout
  viewport with hysteresis during the toolbar animation (ADR-113 §deferred);
  the block is fixed and the card is sticky, so a collapse mid-hand-off can
  offset the two by the bar's height for a frame. No unit fixes a transient.
- **`.fl-cmp__kicker`'s `color: var(--fl-ink-dim)` has no fallback**, and the
  proof card declares no `--fl-ink-dim` — so on EVERY proof card, desktop
  included, the comparison's kicker paints at full ink. Not touched: it changes
  a desktop card he has read.
- At 360px the three-station rail wraps THE RED LINE onto a second row
  (ADR-082 U27's arithmetic; pre-existing).

## U1 — the epilogue's title is the embedding goal (2026-09-26, ADR-126 §2)

The block's title reads `WE EMBED IN YOUR TEAM / UNTIL IT RUNS WITHOUT US.` on
both hosts — `CorridorStationHeaders` and `MobileEpilogueSignal`, in lockstep
— because the old line restated the services masthead's proposition one beat
before it. The ticker, the CTA `HOW IT LOOKS IN PRACTICE`, the seat hold and
the un-type on slot 0's `--pc-enter` are untouched. Record:
[ADR-126 §2](126-the-proof-reads-as-the-practice.md).
