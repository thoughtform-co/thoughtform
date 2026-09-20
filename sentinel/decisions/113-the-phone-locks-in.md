# ADR-113 — The phone locks in

- **Status:** Proposed (2026-09-20) — shipped and guarded; the device read is
  the gate (§Device checklist). Chromium can prove the snap and the source of
  every clock; it cannot see a viewport unit.
- **Surface:** the landing on the phone rung (≤960) — every station's seat, the
  scroll writers' clock, and `#voidwalker`'s era band.
- **Supersedes:** [ADR-082 U26](082-voidwalker-character-stage.md)'s live
  reserve (`--vwd-chrome-clear`), reversed by U30. Nothing else moves.
- **Related:** [ADR-107](107-the-proof-card-is-two-sheets-on-a-phone.md) /
  [ADR-108](108-the-ring-on-phones.md) / [ADR-109](109-the-services-beat-on-a-phone.md)
  (the two `#services` beats whose sticky runways live INSIDE the new snap
  areas), [ADR-082 U23–U29](082-voidwalker-character-stage.md) (the instrument
  the seat is on), [ADR-005](005-scroll-captured-content-reveal.md) (which
  rejected scroll-snap for a character-by-character desktop reveal — a
  different question, not binding here).
- **Rules:** [`.claude/rules/mobile-sections.md`](../../.claude/rules/mobile-sections.md)
  §3, §5, §8, §10.

## The ask

Owner, 2026-09-20, from his iPhone (iOS Safari), with six stills:

> When I enter a section, the components or the section itself take a bit to
> settle into the right position. Before it does, it's either too high or too
> low. I'm sure there's a frontend or mobile responsiveness best practice
> where, when you scroll to the section, the components lock in. You should
> be able to smoothly scroll into the next section. When you're inside a
> section, I've noticed that you can move the section and its elements around
> a bit, and that's super annoying. Please take a full sweep and fix it.

Asked which way the section moves: **up and down**, not sideways.

| still           | Safari chrome     | what the still shows                                                                                                          |
| --------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Eras (Bad)      | toolbar SHOWN     | `#voidwalker`: the title sits ON the top-left HUD bracket — the instrument ~50px too HIGH (scrolled past its top)             |
| Eras (Bad-2)    | toolbar COLLAPSED | the same instrument: ~150px of air above the title and the era stops printing THROUGH the settings icon — ~100px too LOW      |
| Services (Good) | toolbar SHOWN     | the sticky band: readout, title, cards, paragraph all clear                                                                   |
| Services (Bad)  | toolbar COLLAPSED | the band's title 27 CSS px higher than the fixed readout expects; the readout and the TL bracket at the same screen y as Good |

Every phone ruling through ADR-082 U29 (2026-09-19) had deployed ~64 minutes
before the first still. This is what the shipped page did.

## What it was

Three defects with one symptom, all found in source.

1. **The one-screen instrument had nothing locking it.** `#voidwalker`'s pin
   and its 260svh runway are gated on `(min-width: 1101px)`
   (`useVoidwalkerHologramScroll.ts`, `voidwalker.css`'s
   `[data-vw-mode="hologram"]` rules); on a phone `.vwd` is a `100svh`,
   `overflow: hidden` block in normal flow inside a station that keeps
   `padding-block: clamp(56px, 9svh, 96px)`. Where it sat was wherever the
   scroll stopped. That is BOTH Eras stills — the same box, ~50px high in
   one and ~100px low in the other — and it is the "move the section and its
   elements around" complaint: any small scroll moved the whole instrument.
2. **A live `dvh` term inside the instrument.** U26 made
   `--vwd-chrome-clear` `max(0px, calc(var(--mobile-chrome-bottom) - (100dvh -
100svh)))` so the era band's reserve was not paid twice once the toolbar
   collapsed. `100dvh − 100svh` is the toolbar's height; it changes on every
   frame of the bar's animation, and the band, the stage's floor and the
   figure's slot reflowed with it. A box that moves while the bar animates is
   the "settling" he named.
3. **Every scroll writer divided svh geometry by the dynamic viewport.**
   `window.innerHeight` follows the toolbar on iOS (+~99px on an iPhone 14 as
   it collapses); `100svh` — every runway, band and card height on this site
   — holds. `useServicesStageScroll`'s phone clock is `bandTravel = 300svh −
vh` (the ring rotated ~4.6 % of its runway with the thumb still);
   `useStackedCardsScroll`'s `enter = (vh − top)/(vh − pinTop)` drives
   `--pc-depth`, which scales and dims every pinned card; `useDepthScroll`'s
   `scrubHeight = 820svh − vh` moved the corridor camera; `useCorridorExitScroll`
   stepped the dock, the veil and the ring's `proofPresence` on the same
   frame; `MobileEpilogueSignal` lifted a fixed element by `−dissipate ×
innerHeight`; `HudNav`'s wordmark dock could toggle on a toolbar change
   alone. `visualViewport` is used nowhere; `useWorldDomTracker` had already
   recorded the failure class and solved it locally.

And one thing that is NOT a defect this pass can fix: the services band's
27px. The fixed chrome is laid out against the layout viewport, which WebKit
updates with hysteresis during the bar animation, while the sticky band rides
the visual viewport. A transient. See §Deferred.

## The decision

### 1 · The stations are snap stops, and the instrument seats itself

`scroll-snap-type: y proximity` on the root at ≤960 (landing.css's last
block); `scroll-snap-align: start` on `#services`, `#about`, `#contact`
(landing.css) and on **`.vwd`** (voidwalker.css's ≤960 block).

- **The seat is the INSTRUMENT, never the station.** `#voidwalker` keeps ~67px
  of padding on the phone; a station-top seat puts the 100svh box 67px down
  and its era stops below the fold — `probe-voidwalker-phone.mjs`'s own seat
  law, written into the sheet. `.vwd` is one snapport tall (or shorter, with
  the toolbar collapsed), so a stop on EITHER side of it snaps to it: both
  stills land.
- **The tall stations lock on arrival only.** Under the covering rule a snap
  area taller than the snapport is a valid position wherever it covers it, so
  a stop short of `#services`, `#about` or `#contact` glides onto the top and a
  stop past it stays — right for a section you read down.
- **Not the hero.** A stop at 0 would drag a half-lifted curtain back on the
  first flick.
- **Not the corridor host.** `.home-v2-stage` is 820svh with no snap area, so
  proximity cannot fire inside it; its one reachable stop is `#services`' seat
  at its end, which is the lock-in wanted there.
- **No sticky child.** The ring band and the proof slots seat on their own
  runways; a sticky element creates no snap position.
- **No `scroll-padding-top`.** The stations reserve `--mobile-chrome-top` in
  their own padding (the floor) and `.vwd` clears the chrome from inside; a
  scroll-padding would pay the top band twice — U26's bottom-band defect on
  the other edge.
- **Not gated on reduced motion.** Snap is UA scrolling, not an authored
  animation, and a reduced-motion reader has the same chrome to collide with.
- **`scroll-snap-stop: always` on `.vwd` is the one dial**, held until the
  device shows a fling from `#about` overshooting the instrument.
- **A sticky runway for `#voidwalker` was considered and rejected**: it needs
  more than 100svh to pin at all, and on the phone the era selector is a tap,
  so every extra pixel is a band in which nothing changes — the round-3
  dead-scroll ruling.

### 2 · One viewport clock

`lib/viewport/layoutViewportHeight.ts` (three-free, DOM-only):

```ts
export function layoutViewportHeight(): number {
  return document.documentElement.clientHeight || window.innerHeight || 1;
}
```

Adopted by `useServicesStageScroll` (both branches), `useStackedCardsScroll`,
`useCorridorExitScroll`, `useDepthScroll`, `MobileEpilogueSignal`, `HudNav`,
and `lib/services-ring/beatScrollTarget.ts` (which had spelled the same
fallback by hand — one definition now).

- **`--hero-lift` stays on `innerHeight`, deliberately.** The hero is `100dvh`
  (landing.css §hero, "DELIBERATELY NO 100lvh FLOOR") so that lift = 1 ⇔ the
  curtain has cleared on every device; the pair is self-consistent and the
  ratchet pins it at exactly one read.
- **Desktop is byte-identical by arithmetic.** `clientHeight` excludes only a
  HORIZONTAL scrollbar, and this site never renders one (`base.css`'s
  `overflow-x: hidden`, the ≤960 root clip). The HUD snapshots passed without
  `--update-snapshots`.
- **jsdom reports `clientHeight` 0**, so the fallback keeps every test that
  stubs `innerHeight` where it was.
- **The other `innerHeight` reads stay, by name in the ratchet's comment**:
  `ringScrollTween` (`scrollHeight − innerHeight` IS the real max scroll), the
  ≥1101 writers (`useAboutStageScroll`, the three voidwalker hooks),
  `useRevealMotion`, `resolveActiveIdx`, `useJourneyMarks`, `HeroThemeGlitch`,
  `CorridorStationHeaders` (hidden ≤760).

### 3 · No live `dvh` inside phone content

- `--vwd-chrome-clear: var(--mobile-chrome-bottom, 56px)` again. The 56px of
  figure column it costs in the collapsed state — where the svh box already
  ends ~99px above the floor — buys a box that does not move while the bar
  animates. U26's canvas backdrop (`100dvh; min-height: 100lvh`) is untouched:
  nothing is laid out inside a backdrop, which is the whole distinction.
- `.station { min-height: 100dvh }` is KEPT. It binds only on `#contact`, the
  footer, whose grid is `auto 1fr auto` with the slot stretched: the growth
  goes into the middle row and the legal bar hugs the real floor with the
  settings cluster — the one station that should follow the toolbar.
- Checked and unchanged: `--pc-top-base: clamp(64px, 7vh, 88px)` (`vh` is
  `lvh` on iOS, constant, and it floors at 64), the mobile signal's
  `top: clamp(56px, 12vh, 108px)`, `.hero__flywheel` (moves only with the
  hero's own `100dvh`), the prototype's parse-stripped `.ilayer` /
  `.build-quote-runway` / `.station--cover` blocks, `body.density-*`.

### 4 · The horizontal audit

Insurance, since ADR-082 U28's device read is still open and his first report
was sideways: at every rest the seams spec asserts `scrollWidth ≤
clientWidth`, `scrollX` still 0 after a `scrollTo(400, y)`, and no visible box
past the viewport's right edge (fixed chrome and anything under an
`overflow: clip|hidden` ancestor skipped — the era reel's five-cell track
behind its three-cell window is wider on purpose).

## Measured (Chromium, the phone projects and the lock-in probe)

`scripts/probe-mobile-lockin.mjs`, dark and light, 2026-09-20. The radius is
the largest short-stop (in 40px steps) that a programmatic scroll lands on the
seat — Blink's proximity range is a third of the snapport (281 / 311 / 248),
so 280 / 280 / 240 is exactly that. Wheel notches from 600px out are the
harness's own gesture model, not a device's, and are not read as a radius.

| shape (CSS px)               | radius | `#services` −40 / +60 | `#about` −40 / +60   | `.vwd` −40 / +60             | `#contact` −40 / +60 | `.vwd` seated: stops ↔ settings, title ↔ bracket                          |
| ---------------------------- | ------ | --------------------- | -------------------- | ---------------------------- | -------------------- | ------------------------------------------------------------------------- |
| 390×844 (iPhone 14 project)  | 280px  | 0.2 / −60.2 (stays)   | 0.4 / −60.4 (stays)  | 0.4 / **0.4** (snaps back)   | 0.4 / −59.6 (stays)  | stops 788.4 above the row at 800; ink 54.4 under the bracket's foot at 44 |
| 430×932 (Pro Max project)    | 280px  | 0.4 / −59.6 (stays)   | 0.2 / −59.8 (stays)  | −0.4 / **−0.4** (snaps back) | −0.5 / −60.5 (stays) | 875.6 above 888; 53.6 under 44                                            |
| 390×745 (iOS svh, synthetic) | 240px  | 0 / −60 (stays)       | −0.3 / −60.3 (stays) | −0.4 / **−0.4** (snaps back) | −0.3 / −60.3 (stays) | 688.6 above 701; 53.6 under 44                                            |

Identical in light. Every glide landed on `scrollend` in 200–1300ms (the
approach to `#services` and `#about` runs a viewport of smooth scroll first).
What the snap leaves alone, measured at the same shapes: the hero (`scrollTo`
150 → 150, 300 → 300 — no spring back); the pile's slots at their pins with
`--pc-enter` ≈ 1 and `--pc-depth` 0; the ring band pinned (`bandTop` 0) at
0.40 / 0.55 / 0.80 of its runway on steps 1 / 2 / 3, its last beat resting
1002 / 1100 / 891px above `#about`'s stop against a 280 / 280 / 240px radius;
the side tap's tween landing on its beat with the band still pinned. The
resize twin (`setViewportSize(+99)`) unpins the band and resets the step —
which is CHROMIUM re-laying every `svh` runway above it, so the same scrollY
is a viewport earlier: it proves the writers re-solve on resize and nothing
about iOS, where `svh` does not move. The seams spec's own `snap-landings`
attachment agrees to the pixel on both phone projects.

## What the guards had to learn

- **A programmatic scroll is a snap candidate.** Chromium re-snaps after a
  `scrollTo` as after a flick, so a harness seat inside the proximity radius
  lands on the seat and a seek that insists on its own number never settles.
  The seams spec's rests moved to the SEATS, plus two reads past the radius on
  stations taller than ~1.6 viewports — NEAR at `top + 340` (the old rest,
  `top + 300`, was within 11px of Blink's 311 at 430×932) and MID at half the
  height — so a long station's copy is still read under the chrome where a
  reader can actually hold; `seekTo` accepts a landing within 1.5px of a seat;
  `rollTo` waits on `scrollend` or twelve still frames, because the snap
  starts a few frames after the smooth scroll stops.
- **`scroll-snap-type: y proximity` computes to `"y"`** — proximity is the
  default strictness and the serialisation drops it. The first run of the new
  case failed on exactly that.
- **The chrome-over-copy ledger is EMPTY, by measurement.** Its six entries
  were read at the old single rest (`top + 300`); at the seat, the near read
  and the mid read the register printed `(none)` on every station at both
  phone shapes, so the map is `{}` and the entries stay in its comment as the
  record of what to look for. The policy is unchanged: any collision on any
  station fails outright.
- **The seated instrument's floor is the STOPS' ink, not the band's box.**
  `.vwd__band` is `bottom: 0` inside `.vwd` and its padding IS the chrome
  reserve, so its box reaches the floor by design; the first cut of the seated
  check compared that box against the settings row and failed a layout that
  was right. The chips' union is what `probe-voidwalker-phone.mjs` measures,
  and both new checks measure it now (788 above the row at 800; 876 above 888;
  689 above 701).
- **Chromium cannot see a viewport unit.** Every Playwright project resolves
  `svh`, `dvh`, `lvh`, `clientHeight` and `innerHeight` to one number, and a
  `setViewportSize` moves all of them together — so a resize proves that the
  writers re-solve, never which viewport they read. The units are proven by
  SOURCE: `layout-viewport-height.test.ts` (the helper under a modelled
  745/844 pair; every adopter imports it and carries no `window.innerHeight`;
  `useLandingScroll` exactly one) and `phone-viewport-units.test.ts` (every
  `dvh`/`lvh` in the landing's sheets is a named exception BY SELECTOR, each
  sheet's count pinned, `voidwalker-datum.css` at zero). The walker they share
  is lifted out of `type-material-tokens` into `tests/lib/helpers/cssBlocks.ts`.
- **`probe-voidwalker-phone.mjs` is byte-identical before and after** — the
  term it cannot see was 0 in Chromium all along.
- **The desktop ring smoke's `#contact does not fill the viewport at the kill
edge` is pre-existing**: it reproduces with the old `innerHeight` read, and
  it is the footer's sub-pixel `bottom >= vh` the landing rule already
  records.

## Deferred, gated on the device

**The fixed-vs-sticky transient.** iOS lays out `position: fixed` against the
layout viewport, which WebKit updates with hysteresis during the bar
animation, while sticky content rides the visual viewport — so for the length
of the collapse the band's title runs ~27px under where the readout expects
it. A whole-document sticky HUD (`position: sticky; top: 0; height: 0`, first
in the scroll container) would put chrome and content in one scrollport, but
it seats the bottom row at `100svh` — ~99px above the real floor when the
toolbar is collapsed, mobile-sections.md §8's law inverted and the strip U26
just closed — and touches three roots, the `--hero-lift` clip arithmetic and
the HUD snapshots. The read: screen-record a collapse on the services band
and frame-step the title against the readout. If it settles within ~300ms the
item closes as accepted; if not, the sticky-frame ADR opens with the floor
cost stated up front.

## Device checklist

His iPhone, Safari, both toolbar states, dark and light; one still per fail.

1. **Hero → first short flick.** No spring back to the hero.
2. **Corridor → `#services`.** A stop ~150px short glides on; the mark's
   dissipate finishes without a jump.
3. **The pile, a card pinned, toolbar toggled.** The pinned card, its band and
   the next card's peek do not move. They move → a writer still reads
   `innerHeight`, or a `dvh` term survived.
4. **The ring band at beat 2, toolbar toggled.** The front card does not flip
   a step (→ the band clock). A title drifting under the readout ONLY while
   the bar animates is the deferred transient.
5. **`#voidwalker`, slow approach**, stopping ~50px above and ~100px short:
   the title clears the TL bracket and the stops sit above the settings row in
   both states. Title on the bracket → snap did not fire on iOS. Seated but
   stops below the fold → the seat is the station, not `.vwd`.
6. **Era stops while the bar animates.** Still. They move → a `dvh` term
   survived.
7. **A hard fling from `#about`** overshooting `.vwd` → the
   `scroll-snap-stop: always` dial.
8. **Sideways pan** at every rest (ADR-082 U28's open read).

## Guards

- `tests/lib/layout-viewport-height.test.ts` — 12 tests: the helper, the
  adopters by source, the one exception, three-free.
- `tests/lib/phone-viewport-units.test.ts` — 20 tests: the units ratchet over
  18 landing sheets, the era band's constant.
- `tests/visual/mobile-section-seams.spec.ts` — eight cases: the five that
  were (rests at the seats + mid, the horizontal audit inside case 2), the
  snap declarations, the landings (short glides on; `.vwd` snaps back from
  past; the seated instrument's stops above the settings row and its title
  clear of the readout and the bracket), the desktop's `none`.
- `proof-stack-mobile-smoke` (10) and `services-ring-mobile-smoke` (18) —
  unchanged and green with snap on: the sticky runways and the side-tap tween
  are not fought.
- `scripts/probe-mobile-lockin.mjs` — headed: the radius per stop (scrollTo
  and wheel), the ±40/+60 landings with stills, the seated instrument, the
  hero's flick, the pile's pins, the band's clock, the side tap, the resize
  twin (labelled for what it cannot prove).

## Verifying

```bash
npx vitest run tests/lib/layout-viewport-height.test.ts tests/lib/phone-viewport-units.test.ts tests/lib/type-material-tokens.test.ts
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop      # unchanged, no --update-snapshots
npx playwright test tests/visual/mobile-section-seams.spec.ts tests/visual/proof-stack-mobile-smoke.spec.ts tests/visual/services-ring-mobile-smoke.spec.ts --workers=1 --project=iphone-14-chromium --project=iphone-14-pro-max-chromium
node scripts/probe-mobile-lockin.mjs --theme dark && node scripts/probe-mobile-lockin.mjs --theme light
node scripts/probe-voidwalker-phone.mjs      # byte-identical
```

## Left open

- The device read (the checklist above) — the only proof of the iOS half.
- `scroll-snap-stop: always` on `.vwd`, if a fling overshoots.
- The sticky-frame follow-up, if the transient does not settle.
- `#contact`'s `100dvh` floor on a device: the legal bar should hug the real
  floor and nothing above it should move while the bar animates.
