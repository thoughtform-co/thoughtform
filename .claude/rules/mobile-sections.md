---
paths:
  - "components/landing/v7/landing.css"
  - "components/landing/v7/rail-instruments/**"
  - "components/landing/home-v2/home-v2.css"
  - "components/landing/home-v2/MobileEpilogueSignal.tsx"
  - "components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css"
  - "components/landing/home-v2/voidwalker/voidwalker.css"
  - "components/landing/home-v2/hooks/useServicesStageScroll.ts"
  - "components/landing/home-v2/hooks/useCorridorExitScroll.ts"
  - "components/landing/home-v2/hooks/useDepthScroll.ts"
  - "components/landing/v7/tools-cards/useStackedCardsScroll.ts"
  - "components/landing/v7/HudNav.tsx"
  - "lib/viewport/**"
  - "lib/services-ring/beatScrollTarget.ts"
  - "tests/visual/mobile-section-seams.spec.ts"
  - "scripts/probe-mobile-lockin.mjs"
  - "components/landing/home-v2/about/about-band.css"
  - "components/landing/home-v2/about/useAboutBandScroll.ts"
  - "lib/services-ring/aboutBandMath.ts"
  - "scripts/probe-mobile-deck.mjs"
description: Each section stands on its own on a phone — the two chrome bands, the kill condition every fixed painter owes, the snap seats, the layout-viewport clock, the one sanctioned weld (the deck flip), and the guard
---

# Rule: Each section stands on its own on mobile

At `≤960px` the HUD stands most of itself down — the rail, the journey
diamond and (since 2026-09-01) the wordmark are all `display: none` — but the
frame does not go away. **Four things stay FIXED over a flowing document**:
the TR readout / drawer trigger (`.hud-nav-overlay` → `.hud__nav__btn`, z 60),
the BR settings cluster (`.rin-settings`, z 60), the two corner brackets, and
— through the corridor's epilogue — `.home-v2-mobile-signal`.

None of them can see the document. Every one of them prints over whatever is
underneath. So on a phone the composition is not "the desktop layout, narrower":
it is **a flowing document under a fixed frame**, and the laws below are what
keep the two apart. (They are numbered, not counted — the intro said "five"
through §6, §7, §8 and §9.)

**Read first**

- [ADR-018](../sentinel/decisions/018-home-v2-depth-corridor.md) — the corridor
  and its mobile branch; `MobileEpilogueSignal` exists because the desktop
  signal layer is `display: none` at ≤760.
- [ADR-059](../sentinel/decisions/059-rail-instruments.md) — the four-corner
  scheme these bands are derived from.
- [ADR-083](../sentinel/decisions/083-mobile-evidence-instruments.md) — the
  phone IA for the casefile, which is where most of the open debt sits.
- [ADR-082](../sentinel/decisions/082-voidwalker-character-stage.md) —
  `#voidwalker`'s interior, the one-screen instrument law 3 is about.

## 1 · Every flowing station reserves the two chrome bands

Two tokens, declared once in landing.css's `≤960` `:root` block and spent by
the padding floor at the **foot of the same file**:

```css
--mobile-chrome-top: calc(var(--hud-margin) + var(--hud-corner-zone) + 12px);
--mobile-chrome-bottom: calc(
  max(var(--hud-margin), var(--safe-bottom, 0px)) + var(--hud-corner-zone) + 12px
);
```

Measured **56px / 56px** at both 390×844 and 430×932 (`--hud-margin` floors at
16, `--hud-corner-zone` at 28). The bottom band takes `max(--hud-margin,
--safe-bottom)` because that is what `.rin-settings` and `.hud__corner--br`
actually sit on — a notch inset wins over the margin on a device that has one.

- ⚠ **THEY ARE DERIVED FROM THE CHROME'S OWN TOKENS, NEVER FROM A LITERAL.**
  **New fixed chrome re-derives them in the same commit or it does not ship.**
  A painter that moves to a new offset and leaves the band where it was has
  silently un-reserved its own strip, and nothing on screen says so.
- ⚠ **IT IS A FLOOR, NOT A PADDING.** `max(station's own, band)`, so a station
  that already clears the chrome is byte-identical. Measured: #about 120/120,
  #practice 80/64 and #contact 140/220 do not move; **#services is the only
  station the floor actually changes** (`.station--services` zeroes its bottom
  padding so the runway ends flush, 0 → 56).
- ⚠ **A STATION THAT DECLARES `padding-top`/`padding-bottom` AT ID SPECIFICITY
  OPTS OUT, WITH NO PIXEL CHANGE TO SAY SO.** `#about.station` is (1,1,0) and
  beats any class-level floor outright. So the contract runs the other way: a
  station declares **`--station-pad-top` / `--station-pad-bottom`** and the
  floor block re-states them through `max()`, tying on specificity and winning
  on source order. That is also why the floor is the LAST rule in landing.css —
  move it earlier and the id rules below it start winning again.
- The named exceptions, and only these: **`.hero`** (a full-bleed curtain, and
  the one station the chrome is choreographed to be revealed FROM),
  **`.station--cover`** (a sticky fixed-height interstitial — padding there
  eats the interior instead of clearing chrome), **`#voidwalker`** (law 3), and
  the corridor host `.home-v2-stage`, which is not a `.station` at all.
- ⚠ **THE FLOOR REACHES A STATION'S ENDS, NOT ITS MIDDLE.** A phone station
  runs 1.2–2.7 viewports; copy in the middle of one scrolls under the chrome
  and no padding can reach it. That is what the TR scrim
  (`.hud-nav-overlay::before`) is for — and a scrim buys **legibility**, never
  permission to collide. The open collisions are pinned in
  `KNOWN_CHROME_COLLISIONS` in the guard spec.

## 2 · Every mobile fixed painter names its kill condition against an OBSERVABLE

A `position: fixed` block's exit is a claim about the **whole document**, not
about the beat that spawned it. So the condition that ends it may not be a
value that only the beat's own machinery writes.

⚠ **THE COUNTER-EXAMPLE IS `MobileEpilogueSignal`'s
`readCorridorDissipate(0)`, AND IT SHIPPED.** Every input to the signal's
opacity was a corridor channel, and the one that fades it out defaults to
**`0` — "the exit has not started"** — when the module ref is absent. That
default is correct on the corridor and catastrophic after it: a phone whose
exit clock never armed holds `titleOut` at 0 for the rest of the page.

Measured 2026-09-01 at 390×844, with the fail-safe disabled: at #services'
top **25.2 %** of the viewport — the offer's masthead on screen — the epilogue
title was at **opacity 1, not inert**, printing "EVERYONE IS RACING TO BUILD
THIS CAPABILITY." over the offer. ⚠ And **`data-corridor-exit` is never
written anywhere on the mobile path** (`null` at every stop of a full-page
walk), so the CSS belt keyed on it is a belt for a state this surface does not
reach — real insurance for the desktop-ish widths, zero cover here. **A
module-ref default is not a kill condition.**

The live kill is an `IntersectionObserver` on `#services` with rootMargin
`0px 0px -55% 0px` — the band is `[0, 0.45·vh]`, so `isIntersecting` is
exactly "#services' top has crossed 45 % of the viewport". Rules for any
painter that follows:

- **The observable is a rect the reader can see**, not a module ref, not a
  store flag, not a clock. If the corridor is wrong about itself, the observer
  is still right.
- **Reversible in BOTH directions.** Measured: opacity 1 at 47.4 %, 0 + `inert`
  at 23.7 %, and 1 again on the way back up at 71.1 %. A latch that only fires
  one way strands the epilogue for anyone who scrolls back.
- **No per-frame layout read.** The observer reports from the compositor; a
  `getBoundingClientRect` in the rAF loop is a forced reflow at 60 Hz on the
  phone the corridor is already taxing.
- **`inert` is checked against the kill flag, not inferred from opacity** — the
  attribute is what the guard asserts, and it must not wait on an opacity write
  clearing its own delta threshold.

⚠ **AND WHERE THE PILE IS SPLIT, THE SIGNAL'S EXIT IS THE FIRST CARD'S
([ADR-116](../sentinel/decisions/116-the-phone-hands-the-top-to-the-card.md),
2026-09-21, owner: it "disappears a bit too quickly, resulting in a bit of a
void on top").** On `PROOF_STACK_SPLIT_MEDIA` the block HOLDS its seat (no
lift, no `SIGNAL_OUT`) and UN-TYPES in place on slot 0's own `--pc-enter`,
inverted to the card's top (`lib/home-v2/signalHandoff.ts`) — whole until the
card has risen into view, gone as its top reaches 16px under the block. Two
consequences for this law:

- ⚠ **THE CSS BELT IS KEYED ON `data-services-ambient`, NOT
  `data-corridor-exit`.** ADR-108 made the dock live on phones, and
  `data-corridor-exit` is written at DOCK ENGAGE — measured with `#services`'
  top still 1.25 viewports below the fold — so the belt was what emptied the
  top of the screen before the first card had started to rise. Ambient is
  written once the dissipate has finished, the moment the belt always claimed.
- **The split rung's kill is the CARD's rect** crossing 15 % of the viewport,
  observed — the observable the reader can see, per this law. ⚠ Its observer
  carries a **100000px top margin**, so "intersecting" means "the card's top is
  above the line" even once the pile has left the viewport upward; without it a
  jump from past the pile back to the corridor crosses no edge and the epilogue
  stays dead on the reader's return. The 45 % observer below still serves the
  corridor path (no split pile, or its hook has not written: NaN).

⚠ **SINCE ADR-108 THE CORRIDOR CANVAS IS A FIXED PAINTER ON PHONES TOO** (on
the ring rung — `SERVICES_RING_MOBILE_MEDIA`, flag `SERVICES_CARD_RING_MOBILE`).
`useCorridorExitScroll` no longer treats that rung as `mobile`, so the dock and
the ambient hold engage: the canvas goes `position: fixed` behind `#services`
from the dissipate to the kill. Its kill condition is the one the hook already
names against an observable — **`#voidwalker`'s rect** (ADR-074, the first
opaque station below the corridor; `data-corridor-kill` first if a route
stamps one) — and `services-ring-mobile-smoke` asserts the canvas is no longer
fixed past it. With the dock live, `data-corridor-exit` IS written on this
path now — at DOCK ENGAGE, which is why the epilogue signal's CSS belt moved
to `data-services-ambient` (ADR-116, above: keyed on the exit attribute it
killed the signal a viewport early); the observed kills stay the primary,
because the flag can be off.

## 3 · A one-screen instrument manages its own interior clearance

`#voidwalker` at `≤700` is the exception to law 1 and it is the exception on
purpose: `.vwd` is a `100svh` instrument that scrolls **inside itself**, not a
flowing station. An outer padding band would push its interior off its own
screen. Its own `#voidwalker.station` rule (id specificity) is therefore left
to win, and `#voidwalker` is deliberately absent from the floor's id list.

What it owes in exchange:

- **It clears the chrome from INSIDE** — top and bottom — with its own
  measurements, and it **clears the BR band explicitly** (the settings row and
  the corner bracket are the last 56px, and an instrument that fills the screen
  has no margin to fall back on).
- Its interior is `voidwalker-datum.css`'s business; this rule only records
  that the outer band was withheld deliberately so nobody "fixes" the
  exception back into the floor. It is clean at both phone shapes today —
  the guard's collision walk finds nothing on it.
- ⚠ **AND SINCE ADR-082 U23 IT FITS RATHER THAN SCROLLS.** Its stage is
  `overflow: clip`, which supersedes ADR-083's inner-scroll release FOR THIS
  STATION (owner: no scrollbars on the phone): an instrument the outer floor is
  waived for cannot hand its reading back to a page that passes the whole
  station in one flick. Its own guard is `scripts/probe-voidwalker-phone.mjs`.
  ⚠ **THE ERA STOPS NOW SIT ON THE FIGURE AND ARE NEW INK IN THE BR BAND** —
  they clear `.rin-settings` through `--mobile-chrome-bottom` from inside, as
  §3 requires, and the probe measures the chips' UNION against the instrument's
  own floor rather than trusting the padding.
  ⚠ **A PROBE THAT SEATS `#voidwalker` MEASURES THE WRONG FRAME.** The station
  keeps its own `padding-block` here, so aligning the STATION's top to the
  viewport puts the 100svh instrument 76px down and its last 76px — where the
  stops live — below the fold. Every rect compared against FIXED chrome is
  scroll-dependent; seat `.vwd`.
- ⚠ **AND SINCE ADR-113 THE ENGINE SEATS IT TOO: `.vwd` IS THE STATION'S SNAP
  STOP** (`scroll-snap-align: start` in `voidwalker.css`'s ≤960 block, on the
  instrument and never on `#voidwalker` — the probe's seat law, written into
  the sheet). Until then nothing locked the instrument to the viewport at all:
  it sat wherever the scroll happened to stop, ~50px high in one of the
  owner's stills (the title on the TL bracket) and ~100px low in the other
  (the era stops under the settings icon). §10 has the law.
- ⚠ **ITS CHROME RESERVE IS A CONSTANT AGAIN.** ADR-082 U26 made
  `--vwd-chrome-clear` a live term (`--mobile-chrome-bottom − (100dvh −
100svh)`) so the strip was not paid twice once the toolbar collapsed, and
  ADR-113 took it back out the next day: the term made the band, the stage's
  floor and the figure's slot reflow for every frame of the bar animation,
  which the owner read as the section "settling". 56px of figure column in the
  collapsed state is the price of stillness. `phone-viewport-units.test.ts`
  pins the sheet at zero `dvh`/`lvh` terms.

## 4 · `content-visibility: auto` is a desktop optimisation and ≤960 opts out

`.station:not(.hero)` pairs `content-visibility: auto` with
`contain-intrinsic-size: auto 100vh` — a **one-viewport guess**. On a phone the
flowing stations run 1.2–2.7 viewports, so the guess is wrong by hundreds of
pixels and the browser corrects it the moment the station enters the rendering
window: the document reflows under the reader and the scroll anchor gets a new
target mid-gesture.

Measured at 390×844: **#contact reserved 1204px for a box that is really
844px** — a 360px lie, which is most of the "it jumps while I scroll" report.
`#services` 2313px, `#about` 1317px against the same 844px guess. Removing the
skip took the document from 13925px to 13621px (−360 from #contact, +56 from
the #services floor).

So at ≤960: `content-visibility: visible; contain-intrinsic-size: none`.
Desktop is untouched — there the guess is wrong by the same ratio, but the
sections are shorter than the window is wide and the correction lands
off-screen. **A station that wants the optimisation back has to say what its
real height is**, and on a scroll-driven surface it cannot.

## 5 · `mobile-section-seams.spec.ts` is the guard, and it extends in the same commit

`tests/visual/mobile-section-seams.spec.ts`, phone projects only. Eight cases:
station-to-station seams · chrome-over-copy at every station's rest, and no
sideways overflow there (ADR-113) · the signal dead over #services · every
chrome rect inside a band · the floor and the opt-out live on computed style ·
the stations are snap stops and nothing inside them is (ADR-113) · a stop
short of a station glides onto its seat and the one-screen instrument seats
itself from either side (ADR-113) · the desktop declares no snap.

⚠ **A STATION'S REST IS ITS SEAT, PLUS A MID READ ON THE TALL ONES (ADR-113).**
The old single rest, `top + min(0.35h, 300)`, sat within 11px of Blink's
proximity radius at 430×932 (a third of the snapport, 311; measured 280 in
40px steps) — one layout shift from being pulled onto the seat with the seek
reporting a miss. `stationRests()` returns the seat (the station's top; `.vwd`'s
top for #voidwalker) and, for a station taller than ~1.6 viewports, two more
reads: NEAR at `top + 340`, the first position a reader can hold past the
seat, where the ledger's collisions were measured; and MID at half its height,
for a long station's middle. Copy is read under the chrome at all three.

**A new station, or new fixed chrome, extends this spec in the same commit.**
Add the station id to `STATION_IDS`, the painter to `CHROME_SELECTORS`; a
painter absent from that list is a painter nothing measures. A new snap stop
goes in `SNAP_STOPS`; anything that must NOT snap in `NOT_SNAP_AREAS`.

Three things the spec had to learn, all of them measured, all of them the kind
of thing that makes a green run meaningless:

- ⚠ **A BOUNDING RECT IS NOT AN INK RECT.** A `.fl-brief` container is 200px
  tall around a 39px line of type, so an element-rect test reports a collision
  for a headline 90px clear of the corner. The walk uses **Range client rects**
  — the real glyph runs.
- ⚠ **A RECT IS NOT A PAINTED RECT EITHER.** The HUD frame is revealed by a
  `clip-path` that tracks `--hero-lift`, so behind the curtain the brackets
  report a full 28×28 box while computing `inset(828px …)` on a 28px element —
  they paint nothing. `visibleChrome()` applies the computed inset; without it
  every hero headline reads as copy under chrome that is not on screen.
- ⚠ **`elementsFromPoint` CANNOT DO THIS JOB.** It skips `pointer-events: none`
  — which is every piece of chrome on this surface — and it answers about a
  POINT where the question is about an AREA.

And two on driving the page:

- ⚠ **NEVER NAVIGATE BY A HARDCODED PIXEL COUNT** (landing-corridor-smoke's own
  law), and **one `scrollTo` is not enough**: the corridor's lazy content moves
  the document height under the scroll, and a single pass was measured landing
  ~1200px short on the #services approach. Every position is sought in a
  Playwright-side loop with a timeout.
- ⚠ **THE BANDS ARE A `calc()` AND MUST BE RESOLVED BY THE ENGINE.**
  `getPropertyValue("--mobile-chrome-top")` returns the authored expression,
  not a length; the spec spends them as padding on a throwaway element so
  computed style reports pixels.
- ⚠ **A PROGRAMMATIC SCROLL IS A SNAP CANDIDATE (ADR-113).** Chromium re-snaps
  after a `scrollTo` exactly as after a flick, so a harness target inside the
  radius of a seat LANDS ON THE SEAT and a seek that insists on its own number
  never settles. `seekTo` accepts a landing within 1.5px of a seat as settled
  (`snapSeats()`), and `rollTo` waits on `settleSnap` — `scrollend`, or twelve
  still frames, capped — because the snap animation starts a few frames after
  the smooth scroll stops and a three-frame still can resolve in the gap.
  ⚠ `scroll-snap-type: y proximity` COMPUTES TO `"y"`: proximity is the
  default strictness and the serialisation drops it.

## 6 · A sticky pile in flow is not a fixed painter (ADR-107)

`#services` opens on the proof stack, and on the phone rung
(`PROOF_STACK_SPLIT_MEDIA`) its eight panels are `position: sticky` in normal
flow. Sticky is bounded by its containing block, so it owes no kill condition
(law 2 is about `fixed`); it reserves the chrome bands through the station's
floor like any flowing content (law 1); and it is under law 4's
`content-visibility` opt-out with everything else — a pile that skipped
rendering would reflow under the reader's thumb exactly as #contact did.
Its guard is its own: `proof-stack-mobile-smoke.spec.ts`.

## 7 · The ring's band is a sticky band in flow, and it is the beat (ADR-108, ADR-109)

On the ring rung `#services` carries `.svc-ring-runway` (300svh) with a
sticky, 100svh `.svc-ring-band` — the ring's seat and clock, and since
ADR-109 the whole beat's composition: the masthead's title (row 1), an empty
`.svc-ring-seat` the ring fills (row 2), the paragraph (row 3), inside the
band's own padding of `56px + 8px` / `56px + 16px` so both texts clear the
HUD's chrome bands (§1). No plate accordion follows on this rung. Like the
pile (§6) the band is sticky in flow and owes no kill condition of its own;
the ring it seats draws in the FIXED corridor canvas, whose kill is §2's.
One interactive thing lives on it: the hit layer (`.svc-ring-hits__hit`,
≥44px, z 4). Since ADR-110 a front tap TURNS THE CARD OVER in the canvas —
nothing DOM rises (ADR-109's sheet lasted a day), so §2 has nothing new to
kill; the back's ✕ and CTA are shims inside the card's own rect (the ✕ grown
to the 44px floor in CSS). Its guard is `services-ring-mobile-smoke.spec.ts`;
its lockstep with the ring is `services-ring-mobile-gate.test.ts`.

## 8 · A backdrop is sized in `lvh`; the chrome is pinned to the real floor (ADR-082 U26)

On iOS Safari the three viewport units are three different numbers: `svh` is the
SMALL viewport (toolbar shown), `lvh` the LARGE (toolbar collapsed), `dvh` the
live one. **Every piece of fixed chrome on this surface is pinned to the real
floor** — `.rin-settings` at `bottom: max(--hud-margin, --safe-bottom)`,
`.hud__corner--br` at `bottom: --hud-margin` — while backdrops were sized in
`svh`. The gap between them is ~99 CSS px on an iPhone 14 (844 − 745), and what
shows in it is whatever the backdrop was covering.

That is the defect the owner read as _"a pane at the bottom that consumes a lot
of real estate"_: `.home-v2-stage__canvas` was `inset: 0` PLUS `height: 100svh`
— over-constrained, so `bottom` is dropped — and the gateway radial, the grain
and the corridor-exit veil painted through below it.

- ⚠ **A BACKDROP TAKES `height: 100dvh; min-height: 100lvh`.** Growing one is
  free _because nothing is laid out inside it_: a fixed pane with no content
  cannot jitter a line of type when the toolbar collapses. The idiom already
  ships at `landing.css`'s pinned-beat rung.
- ⚠ **CONTENT STAYS IN `svh`.** A sticky band or a one-screen instrument sized
  in `dvh` grows mid-scroll and moves the reading under the thumb — law 4's
  defect in a new place. `.vwd` and `.svc-ring-band` keep `100svh` deliberately.
- ⚠ **A `svh` BOX RESERVES THE CONSTANT CHROME BAND, AND PAYS IT TWICE ON
  PURPOSE (ADR-113, reversing this bullet's first cut).** U26 reserved
  `max(0px, calc(var(--mobile-chrome-bottom) - (100dvh - 100svh)))` on
  `.vwd__band` — `100dvh − 100svh` being the live toolbar height — so the
  strip was not paid once the toolbar collapsed. That term is a `dvh` INSIDE
  CONTENT, and it reflowed the band, the stage's floor and the figure's slot
  for every frame of the bar animation: the owner's "the components take a bit
  to settle". The reserve is `var(--mobile-chrome-bottom)` again; the 56px it
  costs in the collapsed state buys a box that does not move. **No live unit
  inside content, ever** — `tests/lib/phone-viewport-units.test.ts` walks the
  landing's sheets and allows `dvh`/`lvh` by SELECTOR only (the canvas
  backdrop, the hero, the curtain clips, `.station`'s floor on `#contact`).
- ⚠ **NO PROJECT IN THIS REPO CAN REPRODUCE ANY OF IT.** Every phone project is
  Chromium (ADR-107 U1), where all three units collapse to one number — so
  these rules are byte-identical in CI and a green run proves nothing about
  them. `services-ring-mobile-smoke` records all three and says so in its own
  failure message. **The proof is a device**: compare `innerHeight` with
  `.home-v2-stage__canvas`'s `getBoundingClientRect().bottom`.
- ⚠ **THIRD TIME FOR THIS UNIT CLASS.** ADR-018's projector bug mapped NDC into
  an `lvh` box and wrote it into an `svh` cell; `landing.css`'s pinned beat had
  a strip of the next section show through; this is the same arithmetic one
  layer down. When a phone report says "a band", "a strip" or "it jumps", check
  the units before looking for a painter.

## 9 · The root clips horizontal overflow, and `body` clips with it (ADR-082 U28)

`base.css` puts `overflow-x: hidden` on `body` and nothing on `html`. Every
Chromium honours that through the viewport; iOS Safari does not — it reads the
root, and pans the visual viewport toward anything wider than it. The page WAS
wider: 31px of `100vw` overflow that two records had called harmless, that the
owner's phone panned toward ("the section seems to be scrollable left and
right"), and that **Chromium's mobile emulation was reproducing the whole
time** by zooming out to fit — the "421px wide, `innerHeight` 912 on an 844
window" ADR-107 left open. At ≤960 the root clips now:

```css
html,
body {
  overflow-x: clip;
}
```

- ⚠ **`clip`, NEVER `hidden`, AND `body` GOES WITH `html`.** The viewport
  takes `body`'s overflow only while `html`'s is `visible`; clip the root alone
  and `body`'s own `hidden` stays on `body`, which makes it a scroll container
  that never scrolls — and every `position: sticky` on the phone (the ring's
  band, the proof pile) seats against THAT scrollport and never sticks.
  Measured on the first cut: band top −681px at 40 % of its runway, nothing
  erroring. `clip` clips without making a scrollport.
- ⚠ **THE HARNESS LAYS OUT AT THE DEVICE'S SIZE FROM THIS COMMIT.** The iPhone
  14 project measures 390×664 where it measured 421×717 — every phone number
  recorded before 2026-09-19 is ~8 % wide and 53px tall, and a guard that was
  green by that margin can go red on the same code. The seams ledger's
  `#voidwalker · .hud__corner--br` entry is the one that did.
- A horizontal gesture inside a clipped reel is the other half:
  `.vwd__band { touch-action: pan-y }` hands nothing horizontal to the page.
- ⚠ **Chromium can reproduce the OVERFLOW; only a device can confirm the
  pan stops.** Same standing as §8. Since ADR-113 the seams spec measures it
  at every rest — `scrollWidth ≤ clientWidth`, `scrollX` still 0 after a
  `scrollTo(400, y)`, and no visible box past the viewport's right edge.

## 10 · The stations are snap stops, and the writers read the layout viewport (ADR-113)

Owner, 2026-09-20, from his phone: _"when I enter a section, the components or
the section itself take a bit to settle into the right position … it's either
too high or too low … when you scroll to the section, the components lock in
… you can move the section and its elements around a bit."_ Two defects with
one symptom, and two laws.

**The seats.** On the phone rung the root is `scroll-snap-type: y proximity`
(landing.css's last block) and `#services`, `#about`, `#contact` and `.vwd`
are `scroll-snap-align: start`. A stop short of a seat glides onto it; a stop
past a station TALLER than the screen stays where the reader stopped (the
covering rule — right for a section you read down); the one-screen instrument
snaps from either side.

- ⚠ **THE SEAT IS THE INSTRUMENT, NEVER THE STATION** — §3's probe law,
  written into the sheet. A `#voidwalker` stop would seat `.vwd` ~67px down
  and its era stops below the fold.
- ⚠ **NOT the hero** (a stop at 0 drags the half-lifted curtain back), **NOT
  the corridor host** (820svh, no snap area, so proximity cannot fire inside
  it — its one reachable stop is `#services`' seat at its end), **no sticky
  child** (the ring band, the proof slots — they seat on their own runways).
- ⚠ **NO `scroll-padding-top`.** The stations reserve `--mobile-chrome-top` in
  their own padding and `.vwd` clears from inside; a scroll-padding pays the
  band twice.
- ⚠ **NOT gated on reduced motion** — snap is UA scrolling, not an authored
  animation, and a reduced-motion reader has the same chrome to collide with.
- `scroll-snap-stop: always` on `.vwd` is the one dial, held until the device
  shows a fling from #about overshooting the instrument.
- The ring's side-tap tween (`ringScrollTween`, per-frame instant `scrollTo`)
  ends far outside any proximity radius of #about's stop; the seams spec's
  "snap-landings" attachment records the measured landings, and
  `scripts/probe-mobile-lockin.mjs` prints the radius per stop.

**The clock.** On iOS `window.innerHeight` follows the toolbar (+~99px on an
iPhone 14) while every runway on this site is authored in `svh`, which holds
— so a clock that divided one by the other moved while the thumb was still:
the ring rotated a fraction of a beat, the pile's `--pc-depth` stepped its
scale and opacity, the corridor camera drifted, the epilogue signal jumped.
`lib/viewport/layoutViewportHeight()` — `documentElement.clientHeight ||
innerHeight`, the initial containing block — is what the writers read now:
`useServicesStageScroll`, `useStackedCardsScroll`, `useCorridorExitScroll`,
`useDepthScroll`, `MobileEpilogueSignal`, `HudNav`, `beatScrollTarget`.

- ⚠ **THE ONE EXCEPTION IS `--hero-lift`** (`useLandingScroll`): it divides by
  `innerHeight` BECAUSE the hero is `100dvh` — lift = 1 ⇔ the curtain has
  cleared, on every device. `layout-viewport-height.test.ts` pins the
  adopters by source and pins that exception at exactly one read.
- ⚠ **DESKTOP IS BYTE-IDENTICAL BY ARITHMETIC**: `clientHeight` excludes only
  a horizontal scrollbar and this site never renders one. The HUD snapshots
  are the proof.
- ⚠ **CHROMIUM CANNOT SEE WHICH VIEWPORT A WRITER READS** — `svh`, `dvh`,
  `lvh`, `clientHeight` and `innerHeight` are one number there, and a
  `setViewportSize` moves all of them. The source pin and the device are the
  two proofs.

**What is deferred, and why.** The 27px by which the services band's title
sat under the fixed readout in the collapsed-toolbar still is iOS laying out
`position: fixed` against the layout viewport, which WebKit updates with
hysteresis during the bar animation, while the sticky band rides the visual
viewport. No unit fixes a transient. A whole-document sticky HUD would put
chrome and content in one scrollport at the cost of seating the bottom row at
`100svh` — ~99px above the real floor when the toolbar is collapsed, this
rule's §8 inverted. It waits on his screen recording of a collapse.

## 11 · The deck flip: one sanctioned weld, and two seats inside one runway (ADR-115)

Owner, 2026-09-20, from his phone: _"when you scroll past the 'AI capability
your team owns' section, all the text should disappear with a glitch effect.
The cards should then stack on top of each other, rotate them as we have on
desktop, and then reveal my profile picture."_ On the ring rung `#about` is a
BAND now — name · role · the portrait's seat · the first paragraph · a chevron
for the rest — and the ring's four WebGL cards stack on the services band's
exit, flip to the portrait on the about band's clock, and hand over to a DOM
image of the same bake before the band unpins. Behind
`SERVICES_ABOUT_DECK_MOBILE`; off, ADR-110's phone page and ADR-113's stops.

- **The weld is the ONE overlap §5's guard sanctions.** `#about.station` takes
  `margin-top: -100svh` and zero padding, and `#services` zeroes its bottom
  paddings on the rung: the about runway begins where the services band's
  pinned travel ends (exit 1 ⇔ about p 0, measured at −0.5px both), and the
  services band scrolls away UNDER the pinned about band, blank — its copy
  un-typed over the first 70 % of the exit (`[data-untype]` on the masthead:
  `live` → `gone`). The overlap case measures BOTH positions: mid-seam the
  about band may paint nothing (every run `visibility: hidden` by its stamps,
  the portrait by `data-about-deck="live"`) while the services copy is
  mid-un-type; at the weld frame the copy must be `gone`. ⚠ A padding left on
  either side is a fraction of the exit the stack is still running when the
  band pins — the first cut left the station's 56px floor and pinned at 0.89.
  §1's guard reads the BAND's padding where a station is a sticky band
  (`.svc-ring-band`, `#about > .voidwalker`): the band reserves the chrome,
  the station's own paddings are 0.
- ⚠ **A SEAT INSIDE THE WELD IS THE SERVICES SEAT, FROZEN.** The phone ring is
  posed on `.svc-ring-seat`'s rect every frame; as the services band leaves
  under the about band that rect rides up and would drag the stacked deck off
  the top of the screen. From exit 1 the last live seat is HELD and the flip's
  own `posBlend` glide carries the pivot onto the about band's slot — one
  motion owner, the desktop's.
- ⚠ **THE PINNED BANDS ARE `100dvh` (ADR-115 U1, owner's device read: the
  section "moves up and leaves so much white space at the bottom").** Their
  rows seat against the fixed chrome, and the chrome is laid out in the
  dynamic viewport, so a `100svh` band ended ~100px above the settings row
  once Safari's bars had collapsed. The runway, the station and the weld
  stay in `svh` (an in-flow `dvh` box reflows the document on every bar
  transition — §8's law, which was always about in-flow boxes); the writers
  MEASURE the pinned travel (`runway − band`, `station − band`) and the about
  band's two snap targets are written in `dvh` to match. The weld is loose by
  the bar height while the bars are collapsed, by choice (the costed
  alternatives are in the ADR). `phone-viewport-units` names the two bands.
- **The about band is §7's shape one station down**: the STATION is the runway
  (`--about-band-runway` 240svh), `.voidwalker` the sticky 100svh band on the
  services band's own chrome padding, the seat row a SIZE container whose
  portrait box is ADR-109's fill law in CSS (`min(260px, 66vw, 82cqh × 420/680)`
  at `420/680`, so the DOM slot and the card agree by construction). The
  orbit cluster and its emerge are `display: none` on EVERY ≤960 rung. The
  writer (`useAboutBandScroll`) reads the layout viewport (§10) and writes the
  desktop's own `aboutStageProgressRef` and `aboutSlotRef`; the stamps are
  `data-about-band` · `data-about-deck` · `data-vw-name` / `data-vw-copy` ·
  `data-about-slot` · `data-bio-open`.
- ⚠ **TWO SNAP TARGETS INSIDE ONE RUNWAY, AND THE STATION IS NOT A STOP** —
  which amends §10's list for `#about`. A band with decode windows cannot rest
  on its top (cards stacked, band blank) or mid-window; it rests at THE FLIP'S
  END (`.voidwalker__snap-in`, `end`-aligned, `100svh + 0.26 × travel` tall
  from the station's top — the one position it names is its bottom on the
  fold) and at THE READING STATE (`.voidwalker__snap`, `start`, one screen at
  0.62). Both full-width, absolute, `pointer-events: none`;
  `stationRests("about")` returns the band's three holdable STATES — the reading seat, the flip's end and the release frame (p = 1) — never NEAR/MID, which the two radii pull.
  ⚠ **MEASURED IN BLINK (two scratch walks, 390×844): an aligned position
  pulls every stop within ~280px either way, and a covering area never
  overrides one** — the spec's "any position where the area covers the
  snapport is valid" holds only where no aligned position is in range. A
  `start` cover at the weld pulled every stop inside the flip BACK to the
  weld (the band could not be scrolled into its first 111px); no cover at all
  let `#services`' own covering edge do the same. The `end`-aligned target is
  what makes a stop inside the flip COMPLETE it.
  ⚠ **And ADR-113's covering rule needs a box that still covers the
  snapport past its seat**: a `start` station taller than the screen holds a
  stop 60px past it; an `end` target's box ends on the fold at its seat, so
  60px past it the aligned position pulls the stop back — the glide case
  asserts the rule by ALIGNMENT, not by height alone.
- **The handover** (ADR-115 §4): the WebGL deck is killed at 0.999 and the DOM
  portrait shows from 0.995 — a few frames of both, never neither, and the two
  are ONE picture because the `<img>` is a blob of the same `portraitBakeFor`
  canvas the ring textures (measured mean |Δ| 3.6/255 on the seat's rect).
  After the runway the portrait rides the band up as a document — a rAF writer
  posing a WebGL object against a compositor scroll would lag a step every
  step (ADR-102's measurement), so nothing in the canvas may follow an
  unpinned band.
- **The chevron** toggles `data-bio-open`; `.voidwalker__rest` grows `0fr →
1fr` (420ms) and the seat row gives up its height — under
  `ABOUT_BAND_SLOT_MIN_PX` (140) the slot is invalidated, the DOM image hides
  AND the deck is killed (never the desktop's centre-screen fallback seat). The
  writer runs every frame of the transition because no scroll fires.
- **Parallax is off on phones** (`useLandingScroll`'s `[data-parallax]` loop
  gated `> 960`): a per-frame rect read and a main-thread follower of a
  compositor scroll, the class §2 exists to keep off the phone.
- ⚠ **The ring band's runway grew 30svh for the stack** (`RING_MOBILE_RUNWAY_SVH`
  3.3, `--svc-ring-mobile-runway` 330svh, the gate test's lockstep), and
  `#services`' MID rest slid into the proof pile where a field sheet's sentence
  passes under the settings cluster — the §1 class no floor can reach, ledgered
  in `KNOWN_CHROME_COLLISIONS.services`, not tolerated: the seat and NEAR read
  `(none)`.
- **The guards**: `about-band-math.test.ts` (the ladder, the sheet lockstep,
  the decode's monotonicity), `services-ring-mobile-gate.test.ts` (the clock
  with the deck on and off, the runway pair), the ring smoke's three ADR-115
  cases (the un-type, the band + handover in both themes, the chevron),
  `mobile-section-seams` (the weld, the two targets), and
  `scripts/probe-mobile-deck.mjs` — headed, real scrolls, the exit in stops,
  the about band in stops with each landing's pull reported, the handover
  diff with `sharp`, the chevron, frame deltas. **The device is the gate**
  (ADR-115 §Device checklist).

## Verifying

```bash
npx vitest run tests/lib/layout-viewport-height.test.ts tests/lib/phone-viewport-units.test.ts
node scripts/probe-mobile-lockin.mjs --theme dark   # headed; the radius sweep, ±40/+60 landings, stills
node scripts/probe-mobile-deck.mjs --theme dark      # headed; the exit, the about band, the handover diff, the chevron (ADR-115)
node scripts/probe-voidwalker-phone.mjs             # byte-identical to before ADR-113 — Chromium cannot see the unit
npx playwright test tests/visual/about-voidwalker-handoff-boundaries.spec.ts
# ⚠ The phone projects are `-chromium` (ADR-107 U1 deleted the WebKit ones,
# which could never reach an HTTP dev server). The suffix now just means
# "the phone" and is kept because every recorded recipe names it.
npx playwright test tests/visual/mobile-section-seams.spec.ts \
  tests/visual/proof-stack-mobile-smoke.spec.ts \
  tests/visual/services-ring-mobile-smoke.spec.ts \
  --project=iphone-14-chromium --project=iphone-14-pro-max-chromium
```

⚠ **THE WEBKIT PROJECTS ARE DELETED, AND LEAVING THEM IN PLACE COST DAYS OF RED
CI (ADR-107 U1).** `devices["iPhone 14*"]` and `devices["iPad Mini"]` carry
`defaultBrowserType: "webkit"`, and WebKit honours the dev server's
`upgrade-insecure-requests` CSP (`lib/security/headers.mjs:115`) on `localhost`,
which Chromium exempts. Every sub-resource is then requested over
`https://localhost:3003`, the HTTP dev server cannot answer, and the page
renders with no CSS and no React — so `.home-v2-stage` never appears and the
corridor specs hang until the 30s timeout.
⚠ **THAT IS NOT A FLAKE AND NO RETRY CAN HELP IT** — the browser is asking for
a URL that does not exist. ADR-107 diagnosed it and added `-chromium` COPIES of
the two phones, but left the WebKit originals in the project list, so they kept
running and kept failing; `tablet` never got a copy at all. All three are
Chromium now. CI installs **chromium only** — installing WebKit made the
browsers LAUNCH, which was never the problem.
⚠ The `-chromium` suffix stays on the two phones even though nothing is WebKit
any more: the rules and several ADRs name those projects in their recipes, and
renaming for tidiness would break every recorded command.

Captures: a headed Playwright script with real scrolls, dark + light, at
390×844 and 430×932, at hero / mid-corridor / epilogue / services / voidwalker
/ contact. Screenshot the corridor headed — headless leaves the WebGL canvas
dead.
