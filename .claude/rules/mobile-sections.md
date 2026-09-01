---
paths:
  - "components/landing/v7/landing.css"
  - "components/landing/v7/rail-instruments/**"
  - "components/landing/home-v2/home-v2.css"
  - "components/landing/home-v2/MobileEpilogueSignal.tsx"
  - "components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css"
  - "tests/visual/mobile-section-seams.spec.ts"
description: Each section stands on its own on a phone — the two chrome bands, the kill condition every fixed painter owes, and the guard
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
it is **a flowing document under a fixed frame**, and the five laws below are
what keep the two apart.

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

`tests/visual/mobile-section-seams.spec.ts`, phone projects only. Five cases:
station-to-station seams · chrome-over-copy at every station's rest ·
the signal dead over #services · every chrome rect inside a band · the floor
and the opt-out live on computed style.

**A new station, or new fixed chrome, extends this spec in the same commit.**
Add the station id to `STATION_IDS`, the painter to `CHROME_SELECTORS`; a
painter absent from that list is a painter nothing measures.

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

## Verifying

```bash
npx playwright test tests/visual/mobile-section-seams.spec.ts \
  --project=iphone-14 --project=iphone-14-pro-max
npx playwright test tests/visual/about-voidwalker-handoff-boundaries.spec.ts
```

⚠ **THE TWO PHONE PROJECTS CANNOT RUN AGAINST THE LOCAL DEV SERVER TODAY, AND
IT IS NOT THIS SPEC'S FAULT.** `devices["iPhone 14*"]` carries
`defaultBrowserType: "webkit"`, and WebKit honours the dev server's
`upgrade-insecure-requests` CSP (`lib/security/headers.mjs:115`) on
`localhost`, which Chromium exempts. Every sub-resource is then requested over
`https://localhost:3003` and fails with `SSL connect error`: the page renders
completely unstyled and `.home-v2-stage` never appears. **`landing-corridor-smoke`
fails identically on those two projects** — confirm by running it before
blaming a change. Verified green on both phone shapes by running the same file
through a Chromium-backed copy of the two projects.

Captures: a headed Playwright script with real scrolls, dark + light, at
390×844 and 430×932, at hero / mid-corridor / epilogue / services / voidwalker
/ contact. Screenshot the corridor headed — headless leaves the WebGL canvas
dead.
