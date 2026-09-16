# ADR-109: The services beat on a phone — h1 · the cards · the paragraph, and the sheet

**Status:** Proposed (2026-09-16) — shipped on ADR-108's rung and flag
(`SERVICES_CARD_RING_MOBILE`), guarded, pending the owner's read on a real
device. ADR-108's device checklist is this record's gate too.
**Amends:** ADR-108 (U1 — the band is the composition, the plates retire on
the ring rung, a tap no longer scrolls to a plate) · ADR-086 (the phone ring
rung carries no photographs).
**Related:** ADR-050 (the desktop drawer, and why it is not ported) · ADR-044
(the masthead) · ADR-107 (the phone rung's glass ruling) · ADR-097 U12 (pure
motion, zero fades) · ADR-065 (the corner law) · ADR-021 (bounded gestures).

## Context

The owner, reading the ADR-108 build on his iPhone (2026-09-16), on the
services beat:

> Then in the services section we have these weird blocks. We don't need those
> because we have the rotating cards. And I think, just like with the second
> section, we need the h1 above the cards and then the paragraph below it.
> Let's scope properly because we might need to resize the services cards
> here but let's not fuck up our design.

What ADR-108 shipped: the masthead flowed ABOVE the band and scrolled away, the
band was a bare sticky `100svh` holding the ring centred on the mark
(`centre − 4.5vh`, the front card 257 × 417 — 49 % of an 844 frame), and the
ADR-083 plate accordion followed as the readable offer, every card's one
affordance being "scroll me to my plate". Two things were wrong with it as a
read: the title and the paragraph were never on screen WITH the cards, and the
plates said the same four things again, in blocks, under a carousel that had
just said them.

Asked what a tap should do once the plates go, the owner first chose the
desktop's in-canvas drawer, then: **"let's also take the time to redesign it
for mobile instead of copying the desktop behaviour"**, and chose **a sheet
rising from the bottom**.

## Decision

**The band is the composition — title · seat · paragraph in one screen, the
ring fitted to the seat — and the open state on a phone is a SHEET, the
phone's own idiom, carrying the drawer's copy as DOM type. The plate accordion
does not render on the ring rung.**

### 1. The band is the composition (ADR-108 U1)

- `ServicesMasthead` renders INSIDE `.svc-ring-band` on the ring rung (and not
  above the runway). The band is `display: grid; grid-template-rows: auto
minmax(0, 1fr) auto` with `padding: calc(56px + 8px) var(--hud-content-inset)
calc(56px + 16px)` — the runway is full-bleed, so the band takes the inset
  back for its two texts, and the two 56px bands are the HUD's own chrome
  (`mobile-sections.md` §1). The masthead is `display: contents`, so its lead
  is row 1, a new empty **`.svc-ring-seat`** is row 2, and its intro row 3
  (`max-width: 38ch`, the phone's 15px/1.5).
- ⚠ **`display: contents` dissolves the masthead's box**, which is also why
  the desktop's `[data-plate-open] .services-masthead { --svc-plate-dim }`
  opacity cannot reach here (no box, no opacity) — the phone's dim lands on
  the lead (.35) and the intro (.1 — it sits UNDER the sheet's glass, and at
  .35 it printed through the spec grid) directly.
- **The seat is measured, not declared.** `useServicesStageScroll`'s phone
  branch reads `.svc-ring-seat`'s rect once per frame on this rung only and
  writes `servicesRingProgressRef.current.seat = { cy, h, w }` — an OPTIONAL
  field, absent on desktop and in every lab, so the ring there is byte-identical.
- **The fill law.** `ringMobileFrontWidthPx(vw, seatH)` =
  `min(260, 0.66·vw, seatH · RING_MOBILE_SEAT_FILL · RING_CARD_ASPECT)`,
  `RING_MOBILE_SEAT_FILL = 0.82`: the card's HEIGHT may take 82 % of the free
  band. The aspect and the bake never change; only the on-screen size does.
  At 390×844 the seat is 538 tall → 441 of height → 272 of width, so the card
  stays width-bound at **257 × 417** (ADR-108's own number — it barely moved,
  it just seats between the two texts). At 430×932: 649 → **260 × 421**. On a
  700h phone the seat is ~393 → **199 × 322**: the law does the resizing and
  nothing else moves.
- **The seat solve.** `ringMobileSeatY({seatCy, viewportH, parentCamY,
camDepth, halfFovTan, parentScale, ringScale, yOffset, radius})` returns the
  ring group's `position.y` in the rig's space that lands the FRONT CARD's
  centre on `seatCy` — at the card's own depth (`camDepth − radius·ringScale·
parentScale`, ADR-108's implicit-solve lesson), with `RING_Y_OFFSET` still
  applied. Delta-gated like the scale. The gate test re-projects it by hand.
- **The plates do not render** on the ring rung
  (`!cardRingMobileActive && <ServicesPlateCluster/>`): desktop keeps mounting
  them (DOM-pinned, racks `display: none`), PRM and ≤680h phones keep the
  ADR-083 accordion. `scrollToPlate` is deleted. ⚠ The four plate photographs
  (334 kB) are no longer fetched on this rung — ADR-086's "mobile still
  carries the photographs" narrows to the PRM / short-phone accordion.

### 2. The sheet — `ServicesSpecSheet`

- **Why not the drawer.** At any width where the drawer's open pair (card +
  slab, `DRAWER_OPEN_SCALE` 1.18 over two card widths) fits a 390px frame, its
  largest baked glyph renders under **8 css px** and its close chit ~12px. A
  spec sheet nobody can read is not a smaller spec sheet; and the drawer bake
  is the one texture the phone cannot afford (ADR-108 §4). The desktop drawer
  is untouched (`openDrawer={false}` on the phone profile stays).
- **One state, two responses.** The desktop's `openServiceId` /
  `openPlateRef` single writer / Escape effect extend to the phone under
  `sheetActive = cardRingMobileActive`; `drawerActive` stays desktop-only.
  `data-plate-open` is written on the phone too. The ring reads the same ref.
- **Content**, from `SERVICE_PLATES[id]`, exactly what the drawer carries and
  nothing the drawer does not: the `chip` as a mono eyebrow (11px,
  `--track-eyebrow`, `--gold-ink`) with a 44×44 ✕ · the `title` in PP Neue
  Montreal 22px/1.15 `--weight-lit` · `01 / What` + the `breakdown` lines
  (14px/1.4, 5px gold diamonds) · `02 / How` + the five `spec` cells as a
  2-column `dl` (dt mono 10px `--track-label`, dd sans 13.5px) · the filled
  gold `ctaLabel →` link (44px, `#contact`). No price (ADR-050's ruling).
- **Skin.** The ring's slab grammar in DOM: `rgba(var(--void-deep-rgb), .84)`
  glass with **no `backdrop-filter`** (ADR-107's phone ruling — a live canvas
  is under it), a clipped gold lip RING on `::before` (`evenodd`, `--gold-line`
  at 34 % through `color-mix` — a clip cuts a border and never strokes one),
  **TR notch only** (a single notch means connected — to the card above it,
  the reading ADR-107 gave the field panel), children square (ADR-065 rule 4).
  Every colour is a ramp step off the three `-rgb` tokens or a `--gold-*`
  role, so light re-derives with no branch; verified in light.
- **Where.** Absolute inside the sticky band, `left/right: 12px`, `bottom:
calc(56px + 12px)` (clear of the BR settings cluster, law 1), `z-index: 6`
  over the hit layer's 4; `pointer-events: auto` on the sheet alone (the band
  stays `none`). Never `position: fixed` — a fixed painter needs a kill edge of
  its own (`mobile-sections.md` §2); a band-seated one leaves with the band.
  `role="dialog"` (not modal: the page still scrolls), `aria-labelledby` the
  title, `inert` + `aria-hidden` while shut; focus to the ✕ on open and back
  to the front button one frame late on close (the `MediaLightbox` lesson),
  only if focus was inside the sheet.
- **Motion.** Pure motion, zero fades (ADR-097 U12): `translateY(100% + foot)
→ 0`, 420ms in / 320ms out on `cubic-bezier(.65, 0, .35, 1)`; `visibility`
  flips AFTER the close, and the sheet holds its LAST record while closing
  (state adjusted during render, never a ref read in render), so the copy
  never blanks under a sheet still in flight. Click-driven and bounded
  (ADR-021). The rung already requires `no-preference`.
- **The room law, and the ring's response.** ⚠ The plan's first cut lifted
  the ring so the card's bottom cleared the sheet's top by 12px — and at
  390×844 a 429px sheet leaves 214px of room above it for a 417px card, so
  the card lifted to **y −194**, off the top of the phone. Two constants
  settle it, both in `ringMath`, both read by the ring AND the sheet:
  `RING_MOBILE_SHEET_ROOM = 0.42` — the sheet may rise no higher than 42 % of
  the seat above the seat's top (the sheet bounds its own `max-height` to
  `bandBottom − foot − (seatTop + ROOM·seatH)` and scrolls inside it) — and
  `ringMobileSheetFit({seatCy, seatH, cardHpx, sheetTop, sheetT})` → `{cy, k}`:
  the front card FITS the room `[seatTop, sheetTop − CLEAR]`, shrinking
  (`k < 1`, aspect kept, centred in the room) if it must, lifting just clear
  if it fits, never above the seat's top; identity with no sheet or at
  `sheetT` 0. Per-card `sheetLevel` damped at `DRAWER_DAMP_RATE` →
  `sheetT` drives both terms and the side cards' opacity
  (`× (1 − RING_MOBILE_SHEET_SIDE_DIM·sheetT)`, 0.6); the open card's face is
  untouched. Measured at 390×844: sheet top 347, height 429; the front card
  133 × 220 at y 113–333, its bottom 14px clear of the sheet.
- **Dismissal keys on the STEP, not on scroll px.** The desktop's
  `drawerDismissedByScroll` (35px of ring progress) is wrong for a thumb that
  scrolls in whole beats: on the phone the sheet closes when
  `activeServiceForProgress(progress)` no longer names the open service —
  the ring has turned and the sheet is about the wrong card. Plus ✕, Escape
  and a tap on the scrim (the band above the sheet takes the pointer only
  while the sheet is out).
- **A side-card tap rolls the band to that card's beat.** `selectService`'s
  phone branch closes any sheet and tweens the page (`startRingScrollTween`)
  to `servicesMobileBeatScrollTarget(index, runway)` =
  `runwayTop + ringMobileBandFraction(index) · (runwayH − vh)`, where
  `ringMobileBandFraction` is the inverse of `ringMobileClock`'s progress map
  (`frontProgress / (RING_EXIT_START·0.999) · RING_MOBILE_LEAVE_START`,
  floored at `RING_MOBILE_ARRIVE` so the first card never lands mid fly-in).
  Pure; round-tripped through the clock and `activeServiceForProgress` for
  all four cards. Side buttons carry `data-service` now.

## Measured (Chromium phone emulation, SwiftShader)

| viewport | title      | seat (h)        | front card at rest | sheet (top · h) | front card, sheet open |
| -------- | ---------- | --------------- | ------------------ | --------------- | ---------------------- |
| 390×844  | y 64, h 57 | 121 → 660 (538) | 250–270 × 428–446  | 347 · 429       | 133 × 220, y 113–333   |
| 430×932  | y 64, h 57 | 121 → 770 (649) | 254–271 × 432–448  | 498 · 470       | 163 × 267, y 113–379   |

The intro's bottom sits at 772 / 860 against frames of 844 / 932 — inside the
bottom 56px band by 16px both. The projected front rect carries the front
pose's tilt, which is why it runs up to ~6 % over `0.82 · seat`; the bake
width is what the law caps. Zero `.svc-plate` on the rung; the band's
`data-plate-open` follows the sheet. Dark and light captured
(`scripts/capture-services-mobile.mjs`).

## Guards

- `tests/lib/services-ring-mobile-gate.test.ts` — the seat is optional on the
  record (absent ⇒ ADR-108's width law byte for byte); the fill law at the
  tall and the short phone; `ringMobileSeatY` re-projected by hand; the fit
  (shrink / lift / identity / the blend at `sheetT` .5); the beat inverse
  round-tripped for all four cards; the sheet's CSS block pinned absolute,
  blur-free, opacity-free, and reading `RING_MOBILE_SHEET_ROOM` from the one
  module.
- `tests/visual/services-ring-mobile-smoke.spec.ts` (both Chromium phone
  projects) — the composition (title above the front card above the
  paragraph, all inside the chrome bands, the paragraph resolved text, the
  card on the seat's centre, zero plates, the sheet shut and inert); tap →
  `[role=dialog]` open with chip/title/3+ lines/5 cells/the `#contact` CTA,
  the ✕ ≥ 44px, no backdrop blur, the sheet inside the frame and no higher
  than the room law, the front card fitted above it; ✕ closes with the step
  untouched and the card back at size; Escape, the scrim and a beat of scroll
  close it while a 60px nudge does not; a side tap rolls the band to that
  card's beat with the band still pinned; dark + light.
- `tests/visual/services-ring-smoke.spec.ts` "the plate accordion is untouched
  by ring mode" gates on the RUNG: ring rung ⇒ 0 plates, the band, one hit
  layer, the sheet; inert rung ⇒ 4 plates, 0 hit layers.

## Alternatives rejected

- **Porting the drawer** — the arithmetic above; and a bake the phone cannot
  afford.
- **A DOM plate under the ring (the accordion, kept)** — the owner's call:
  "we don't need those because we have the rotating cards".
- **A modal sheet (scroll-locked, fixed)** — the page IS the ring's clock; a
  lock would freeze the beat the sheet is about, and a fixed painter owes a
  kill condition the band already pays.
- **Lifting the ring without the room law** — built, measured, off the frame.
- **Dismissing on scroll distance** — the desktop's rule, one flick from
  closing on every phone.

## Left open

- The device read (ADR-108's checklist, plus: the sheet's rise, its type,
  the card fitted above it, the side dim, ✕ / scroll-a-beat closing, light).
- The sheet at 62 % is the ceiling only where the room law does not bind; on
  short phones the sheet is shorter and its copy scrolls — a 4-line breakdown
  at 700h scrolls twice. A shorter `breakdown` would be a content call.
- `(pointer: coarse)` tilt, as in ADR-108.
- ⚠ **`#contact`'s title passes under the BR settings cluster by 2px.** The
  seams spec's `#voidwalker` rest (its top + 300) puts `#contact`'s top at
  ~696 on a 390×844 emulation, so "Navigate intelligence" (a 293px run from
  x 32) crosses the cluster's column (x 323–367) at y 868–896 — a 2px
  x-overlap that the emulator's viewport-height jitter (912 / 942
  `innerHeight` on an 844 window, ADR-107's finding) hid on the longer
  page and exposed on this one. Pre-existing geometry, not this pass's:
  the honest fix is the footer title's measure on phones, recorded in the
  seams spec's known list for `#voidwalker` until it is taken.

## Files

`components/landing/home-v2/services/ServicesStage.tsx` ·
`components/landing/home-v2/services/ServicesSpecSheet.tsx` (new) ·
`components/landing/home-v2/services/ServicesRingHitAreas.tsx` ·
`components/landing/home-v2/services/services.css` ·
`components/landing/home-v2/services/hologram/ServicesCardRing.tsx` ·
`components/landing/home-v2/hooks/useServicesStageScroll.ts` ·
`lib/services-ring/ringMath.ts` · `lib/services-ring/ringProgressRef.ts` ·
`lib/services-ring/beatScrollTarget.ts` ·
`tests/lib/services-ring-mobile-gate.test.ts` ·
`tests/visual/services-ring-mobile-smoke.spec.ts` ·
`tests/visual/services-ring-smoke.spec.ts` ·
`scripts/capture-services-mobile.mjs` (new) ·
`.claude/rules/services-ring.md` · `.claude/rules/mobile-sections.md` ·
`.claude/skills/landing-performance/SKILL.md`.
