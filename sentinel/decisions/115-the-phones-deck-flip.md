# ADR-115 — The phone's deck flip: the copy un-types, the cards stack, the deck becomes the portrait, and `#about` is a band

- **Status:** Proposed (2026-09-20) — shipped behind `SERVICES_ABOUT_DECK_MOBILE`
  and guarded; deployed; **U1 (same day) answers the first device read** —
  the pinned bands take the dynamic viewport and the card grows; the second
  device read is the gate (§Device checklist). Chromium proves
  the clocks, the stamps, the weld, the handover's pixels and the frame deltas;
  it cannot say what a phone's GPU makes of a fifth back plane.
- **Surface:** the landing on the ring rung (`SERVICES_RING_MOBILE_MEDIA`) —
  the services band's exit and everything `#about` is on a phone.
- **Supersedes:** [ADR-110](110-the-card-turns-over.md)'s exit (the cards
  faded with their band; they stack now) · [ADR-045](045-about-emerge-rail-parity.md)'s
  phone surface (the orbit cluster and its emerge are gone on every ≤960 rung)
  · [ADR-113](113-the-phone-locks-in.md)'s `#about` stop (the station's top;
  two targets inside its runway now). Desktop is byte-identical.
- **Related:** [ADR-047](047-about-deck-flip-stage.md) (the deck the phone
  takes — the stack on the exit clock, the flip on the about clock, the portrait
  back, the slot the deck lands on), [ADR-108](108-the-ring-on-phones.md) /
  [ADR-109](109-the-services-beat-on-a-phone.md) (the band, the seat law, the
  phone profile), [ADR-103](103-the-head-decodes-in-place-and-the-plates-become-the-deliverables.md)
  (the per-line decode idiom lifted here), [ADR-097 U12](097-proof-card-is-a-folder.md)
  (no luminance flicker, anywhere), [ADR-112](112-the-portrait-raster-and-the-four-services.md)
  (the phone's 342 kB of portraits — unchanged; this pass adds 61 kB and takes
  183 away).
- **Rules:** [`.claude/rules/mobile-sections.md`](../../.claude/rules/mobile-sections.md)
  §11, [`.claude/rules/services-ring.md`](../../.claude/rules/services-ring.md)
  §The ring on phones, [`.claude/rules/landing-v7.md`](../../.claude/rules/landing-v7.md)
  §about.

## The ask

Owner, 2026-09-20, after ADR-113 deployed, from his iPhone:

> When you scroll past the "AI capability your team owns" section, all the text
> should disappear with a glitch effect. The cards should then stack on top of
> each other, rotate them as we have on desktop, and then reveal my profile
> picture. Let's see whether, in terms of performance, this is the best route.
>
> I think it would be nice to have my name at the top, similar to "AI capability
> your team owns." That's where my name, Vince Buyssens, would end up. Below it
> would be the first paragraph of my bio text … The rest of it is revealed with a
> small chevron. If you click on it, the text moves upward and the rest is
> revealed downward.
>
> It's a different behavior than desktop but I think it's fine. It's just
> important that when you scroll down, the cards collapse and are replaced,
> rotate, or transform into that profile picture of myself. This also means
> that the parallax section from the About section should disappear. Also, as a
> best practice, remove those.
>
> I know it's quite some work and to really look at performance but I think
> this is the best route.

## What the phone did before

- The services beat was one 330svh… no: one **300svh** sticky band (title ·
  seat · paragraph, ADR-109) whose scroll was the ring's clock. At the band's
  release the cards **faded** (`ringMobileClock`'s `hold`) — the ring's
  progress was capped `× 0.999` below `RING_EXIT_START`, so ADR-047's stack
  beat was never entered on a phone and `--svc-exit` was pinned 0. The
  masthead's decode is gated `min-width: 961px`: the phone's copy was static
  text that scrolled away resolved.
- ADR-047's deck lived in the same `ServicesCardRing`, gated on
  `ABOUT_DECK_STAGE && (exitP > 0 || aboutP > 0)`; `aboutP` is 0 on a phone
  because `useAboutStageScroll` bails below 961, and the phone profile skipped
  the portrait bake.
- `#about` on a phone was the parsed prototype block: name · role · three
  paragraphs · meta · links, and the orbit cluster (portrait + rings svg +
  particle halo + four corner readouts) with ADR-045's staggered emerge. No
  scroll parallax touched `#about` (retired 2026-07-16); the only live
  `[data-parallax]` on a phone was the hero plate at 0.03. The "parallax
  section" he means is that cluster and its emerge.

## The performance answer

**Reusing the WebGL cards is the cheap route, and the only one that can look
like the desktop.** The faces are bakes, not files (ADR-112's raster is a glyph
grid drawn into a texture); a DOM stack would need a second copy of four faces
the DOM cannot draw, plus four 3D-transformed layers over a live canvas. The
canvas is already `position: fixed` and painting every frame on this rung
through `#services` AND `#about` (the ambient hold's kill is `#voidwalker`), so
the deck costs **pose math on four existing groups** in the beats and, during
the flip only, the four portrait back planes (`visible` only while a flip is
live). One-off: one 2D bake at `BAKE_SCALE_MOBILE_BACK` (2.6 MB flat, no
mips), asked for lazily when the band first pins; and the portrait fetch —
`/images/services/vince.jpg`, **61 kB** — while deleting the cluster takes
the 183 kB `vince-portrait.jpg`, twelve halo spans and an animated svg off the
phone page. Rejected: a second canvas (ADR-108: the one cost no bake ratio
recovers), DOM clones, and a deck that rides an unpinned band (a rAF writer
posing a WebGL object against a compositor scroll lands one step behind every
step — ADR-102's measurement; hence §4).

Measured in Chromium at 390×844 (a proxy; the device is the reading): frame
deltas over the exit and the flip, 24px a frame — **p50 4.2ms, p95 17–24ms,
max ≤ 28ms** (`scripts/probe-mobile-deck.mjs`).

## The decision (five changes, in page order)

### 1 · The services band's exit: the copy un-types, the cards stack

- `ringMobileClock(p, deck)` (`ringMath.ts`): with the deck on, the four beats
  keep `[0, LEAVE_START]` and the leave runs progress `RING_EXIT_START → 1`
  linearly, so `exitProgressForRunway` runs 0 → 1 across it (the stack) and
  `hold` stays 1 (the deck dies on the about clock instead). Off, ADR-110's
  clock verbatim. `RING_MOBILE_RUNWAY_SVH` 3 → **3.3** and
  `RING_MOBILE_LEAVE_START` 0.84 → **0.73**: the beats' scroll is unchanged
  (0.84 × 200 = 0.73 × 230 svh) and the stack gets **62svh ≈ 520px** at 844h,
  the exit's one pacing dial. `services.css`'s `--svc-ring-mobile-runway`
  moves with it; the gate test pins them.
- `--svc-exit` goes live on the phone. `ServicesStage` closes a turned card on
  its first frame (`--svc-exit > 0`), and the ring snaps `flipLevelRef` shut
  on `deckEngaged` — ADR-110's back plane paints at renderOrder 0.115, OVER
  the portrait back at 0.11, and a flick can reach the stack inside the
  damped turn's 450ms.
- `ServicesMasthead` gains a PHONE branch: it observes the stage's inline
  `--svc-exit` (the same style observer the desktop uses, no new scroll
  listener) and scrubs the copy OUT over `MOBILE_UNTYPE_WINDOW` `[0, 0.7]` of
  the exit — the title lines through the house kernel run backwards
  (`scrambleLinesOut`), the paragraph un-typed from its tail. Reversible in
  either direction (`scrambleFrame` is pure in `t`; `advanceScrambles`, which
  latches, is never used). No opacity, no fade: the un-type IS the glitch.
- ⚠ **A run that leaves must keep its cells.** `{ from: text, to: "" }`
  resolves every landed character to NOTHING, so the string shrinks from its
  head and the survivors crawl left on a left-anchored leaf — a title leaving
  that way reads as a scroll. `scrambleLinesOut` is the incoming decode with
  its time reversed: every character keeps its cell (`" "` before its window),
  the block empties from the right of each line and the last line first.
- ⚠ **Both texts are CENTRED, so the real text is hidden and LEAVES decode
  over it.** A decoding run is wider than its resting self (mono caps against
  a proportional face) and a centred line would re-centre every frame.
  `decodeLayer.ts` (ADR-103's head carrier, generalised) holds one absolutely
  posed leaf per RENDERED LINE, `white-space: nowrap`, dressed in the run's
  computed face, over the real text which `[data-untype]` hides by
  `visibility`; `lib/home-v2/lineLeaves.ts` (lifted out of the Trinny route)
  walks the lines with a `Range`. Measured lazily on the first live frame and
  on resize.
- `CorridorArmillary`'s phone mount passes `deckFlip={SERVICES_ABOUT_DECK_MOBILE}`
  (a new `ServicesCardRing` prop, default `ABOUT_DECK_STAGE`, so the desktop
  mount is untouched). The stack runs `deckStackEnvelope` unchanged; the
  `DECK_*` placements are in orbit units and scale with the phone's
  `orbitBase` (0.7×).

### 2 · The weld, and the seat that freezes

- `#about.station` on the rung takes `margin-top: -100svh` and zero vertical
  padding (ADR-047 U3's sweep, the same arithmetic), and the services side
  zeroes its two bottom paddings (`#services.station:has(…)` and the stage):
  the about band's runway begins where the services band's pinned travel
  ends, so the band pins on the frame the stack completes (exit = 1 ⇔ about
  p = 0) and the services band scrolls away UNDERNEATH it, blank.
  **Measured: the travel end and `#about`'s top at −0.5px, together.** A
  padding on the services side is a fraction of the exit the stack would still
  be running when the band pins (the first cut left the station's 56px floor
  and the band pinned at exit 0.89).
- ⚠ **The phone ring group is seated on the SERVICES seat rect every frame**
  (ADR-109's `ringMobileSeatY`); as the services band leaves under the pinned
  about band that rect rides up and would drag the stacked deck off the top of
  the screen. From `exitP ≥ 1` (or the about clock's first frame) the last
  live seat is HELD (`mobileSeatHoldRef`), and the flip's own `posBlend`
  glide carries the pivot onto the about band's seat — the desktop's one
  motion owner. Released when both clocks are back at rest.
- `useAboutStageScroll`'s `disengage` was already idempotent, so the phone
  writer owns the same `aboutStageProgressRef` the desktop stage writes — and
  the mark's flip-window dim (`BrandmarkPhysicsCoreActor`, `orbitExitGetter`)
  comes for free, exactly as on desktop.

### 3 · `#about` is a band: name · portrait · first paragraph · chevron

- **Markup** (`landing-v7-motion.html`, parsed at build): a `<button
class="voidwalker__more">` after ¶1 (the house 7px border-box chevron,
  turned down, up when open; a 44px target), a `.voidwalker__rest` /
  `__rest__in` pair wrapping ¶2, ¶3 and the meta (`display: contents` off the
  rung — desktop PRM/fallback byte-identical), the portrait's `<img>` inside a
  `<picture>` whose `(max-width: 960px)` source is `/images/services/vince.jpg`
  (the bake's own photo — one photo on the phone), and two snap targets. No
  angle-bracket syntax in the comments (the relocate walkers regex-scan the
  raw HTML).
- **Layout** (`about-band.css`, keyed on `#about[data-about-band="on"]`, the
  writer's stamp, inside the rung — ADR-108's attribute precedent: no JS, the
  flag off, reduced motion or a short window keep the static about): the
  STATION is the runway (`--about-band-runway` **240svh**), `.voidwalker` the
  sticky band (`top: 0; height: 100svh`, grid `auto auto minmax(0,1fr) auto
auto auto` = name · role · SEAT · ¶1 · the rest · the chevron, the services
  band's own chrome padding; `.voidwalker__copy { display: contents }`). The
  seat row is a SIZE container and the portrait box inside it is `min(260px,
66vw, 82cqh × 420/680)` at `420/680` — ADR-109's fill law in CSS, so the DOM
  slot and the WebGL card agree by construction (measured 222.4 × 360 at
  390×844, against the ring's 222 × 360). The station is transparent (the
  deck is in the canvas behind it), its radial washes off. The orbit svg, the
  halo and the readouts are `display: none` on EVERY ≤960 rung (his "remove the
  parallax section"); the emerge is neutralised on the band (`[data-m]` at
  (1,1,1) over `.is-in`'s (0,3,0)).
- **The meta rows and the socials leave the phone band** (the eras carry the
  base and the years, the footer the socials since ADR-105) — with them in the
  disclosure the expanded copy ran 418px and left the portrait 17px at 844h.
  With ¶2 and ¶3 alone: rest 204px, the portrait keeps **193px** at 844h.
- **The writer** (`useAboutBandScroll`, mounted by `AboutStage` as `AboutBand`
  in the same nested root): `p = clamp01(−top / (height − layoutViewportHeight()))`
  (`-0` guarded — ADR-102's trap), written to `aboutStageProgressRef` (the
  ring's flip clock) and the slot's rect to `aboutSlotRef` per frame while the
  runway intersects (ADR-047 U2's gate); the stamps `data-about-band`,
  `data-about-deck` (`live` / `done`), `data-vw-name` / `data-vw-copy`
  (`pending` → `decode` → `1`, ADR-103's `headState`: the real text hidden
  before its window and shown after it, the leaves painting only between),
  `data-about-slot="hidden"` under the portrait floor (`ABOUT_BAND_SLOT_MIN_PX`
  140), `--about-band-p` for the guards.
- **Windows** (`lib/services-ring/aboutBandMath.ts`, unit-pinned): FLIP =
  ADR-047's `[0, 0.22]` (shared with the ring); NAME + ROLE scramble in
  `[0.30, 0.42]`; ¶1 TYPES in `[0.42, 0.60]`; READ **0.62**; the deck squares
  up over `[0.62, 0.9]`; DONE 0.995; KILL 0.999. The name's window opens a hair
  AFTER the flip's-end seat (0.26) — measured: a window opening ON the seat
  rested on three leaves of glyph noise. READ sits a hair past the copy's
  landing for the same reason: a seat is solved to a pixel and may never rest
  on `decode`.
- **The chevron** toggles `data-bio-open` on the band and `aria-expanded`;
  `.voidwalker__rest` grows `grid-template-rows: 0fr → 1fr` over 420ms (the
  house idiom, always in the DOM); the seat row is `1fr`, so the copy rising
  takes its height from the portrait — "the text moves upward and the rest is
  revealed downward". The writer runs every frame of the transition (no scroll
  fires) so the deck follows the slot, and re-measures the lines. Under the
  floor the slot is invalidated: the DOM image hides AND the deck is killed —
  never the desktop's centre-screen fallback seat, which the first cut showed
  as a 360px portrait floating over the copy. Measured at 844h: slot 360 → 193
  → 360, rest 0 → 204 → 0.

### 4 · The handover: the deck dies as the band unpins, the DOM portrait takes over

- After the runway the band must scroll as a DOCUMENT (a deck riding an
  unpinned band would lag the compositor a wheel step, every step). So the
  WebGL deck is killed on one frame at `ABOUT_BAND_KILL` 0.999 and the DOM
  image shows from `ABOUT_BAND_DONE` 0.995: a few frames of both, never
  neither, and nothing fades while looked at.
- ⚠ **The DOM image IS the bake.** `bakePortraitBack` and its palette lift out
  of the ring into `lib/services-ring/portraitBake.ts` (three-free, so the
  landing's First Load JS may reach it — `landing-import-doctrine` walks the
  graph) with a `scale` argument and a per-theme memo, `portraitBakeFor`: the
  ring's phone profile turns that canvas into its texture, the writer turns
  the same canvas into a blob URL on the picture's phone source. One bake,
  one fetch, two readers. A CSS twin of the LUT would not have matched.
- ⚠ **Three things had to move for the frame to be one picture** (measured
  with `sharp` on the seat's rect at p 0.99 against 1.0): mean |Δ| **18.7/255,
  12.5 % of samples over 40** → **9.4 / 6.7 %** → **3.6 / 1.7 %**.
  1. THE DECK SQUARES UP (`ABOUT_BAND_SQUARE_WINDOW`, phone only): ADR-047's
     hand-stacked x/y jitter runs to zero, so the three rear cards' edges and
     their portraits (showing through the 0.9-alpha front) vanish behind the
     front card. Pure motion.
  2. THE NEAREST CARD SITS ON THE PIVOT'S DEPTH: the seat scale is solved at
     the pivot, but after the π flip the deck-rear card (index 0) is a z-pitch
     nearer the camera — ~3 % larger than the twin, its chamfer stroke off the
     slot's edge. The square-up shifts the deck by card 0's offset.
  3. NO MIPS ON THE PORTRAIT TEXTURE (`LinearFilter`): the twin is the same
     630×1020 canvas the browser downsamples once; a trilinear blend at ~0.7×
     read softer than it. 2.6 MB flat instead of 3.4.
     The DOM image is opaque; four back planes at 0.9 exactly behind one another
     composite to opaque.
- Fail-static ladder: no JS → the phone `<picture>` source under the plate
  treatment's CSS twin (the `.svc-plate__pbg` chain) in the band's slot; ring
  off (the governor's floor, a dead canvas — `data-card-ring-live` absent on
  `<html>`, stamped by the phone mount) → the same, shown at once; reduced
  motion or under 681h → not on the rung, the static about minus the cluster.

### 5 · Parallax off on the phone

`useLandingScroll`'s `[data-parallax]` loop is skipped at ≤960: the hero
plate's 0.03 drift and its `will-change: translate` layer go on phones — a
per-frame rect read and a main-thread follower of a compositor scroll, the
class of motion `mobile-sections.md` exists to keep off the phone. Desktop
keeps it.

## The snap seats, measured in Blink

ADR-113 made `#about.station` a `start` stop. With the weld that top is
"cards stacked, band blank", and a band with windows needs its OWN seats:

- A scratch walk of six designs (`scrollTo` stops from −250 to +1100px around
  the weld, 390×844) found Blink's law: **an aligned position attracts every
  stop within ~280px in either direction, and a covering area never overrides
  one** — the spec's "any position where the area covers the snapport is a
  valid snap position" only holds where no aligned position is in range.
  A `start`-aligned cover at the weld pulled every stop inside the flip BACK
  to the weld (the first cut: the band could not be scrolled into its first
  111px); no cover at all let `#services`' own covering edge do the same.
- So: `.voidwalker__snap-in`, `end`-aligned, `100svh + 0.26 × travel` tall
  from the station's top — the one position it names is its bottom on the
  fold, THE FLIP'S END (portrait landed, no text yet); `.voidwalker__snap`,
  `start`-aligned, one screen, at READ; the station itself `none`. Both full
  width and `pointer-events: none`. Resting states: the WELD (the exit's last
  ~250px are pulled forward — the stack completes), the FLIP'S END (a stop in
  the flip completes it, a stop in the name's window comes back to it), the
  READING SEAT (a stop in the copy's window or within ~280px past the seat
  lands on it), and free scroll beyond. **Nothing rests on a half-decoded
  line** — the probe fails on a landing inside either window.

| asked (p)                 | lands    | state                                       |
| ------------------------- | -------- | ------------------------------------------- |
| 0.02                      | 0.02     | inside the flip, held by `#services`' cover |
| 0.11 · 0.22 · 0.30 · 0.36 | **0.26** | the flip's end — portrait alone             |
| 0.45 · 0.55 · 0.80        | **0.62** | the reading seat                            |
| 0.62 · 0.99 · 1.0         | as asked | the seat; the handover                      |

## Measured (Chromium, 390×844, dark)

| stop                    | reading                                                             |
| ----------------------- | ------------------------------------------------------------------- | --- | ------------------------ |
| band f 0.73 (the leave) | exit 0.000, step 3, 3 targets, copy resolved                        |
| f 0.825                 | exit 0.350, `[data-untype="live"]`, 7 leaves / 84 glyphs, 0 targets |
| f 0.919                 | exit 0.699, 7 leaves / 4 glyphs                                     |
| f 0.99                  | exit 0.963, `gone`, 0 glyphs                                        |
| f 1.0                   | the travel ends at −0.5 and `#about`'s top is at −0.5 — the weld    |
| about p 0.02            | deck live, name/copy pending, slot 222.4 × 360 at y 205             |
| p 0.30 → 0.36           | name `decode`, 3 leaves, 19 → 52 glyphs                             |
| p 0.62                  | name 1, copy 1, no leaf, deck live, DOM hidden                      |
| p 0.99 → 1.0            | deck live → done, DOM hidden → visible (blob), bake stamped         |
| handover                | mean                                                                | Δ   | 3.63/255, 1.67 % over 40 |
| chevron                 | slot 360 → 192.8 → 360; rest 0 → 204 → 0                            |
| snap −40                | lands at p 0.620                                                    |
| frames                  | p50 4.2ms · p95 17–24ms · max ≤ 28ms                                |

## What the guards learned

- ⚠ **A fixed band fraction is a bet on the beats' geometry.** The smoke's
  `seatBand(0.4)` landed mid-turn once the leave moved (two cards facing the
  reader, not three) and its 0.55 → 0.8 step-change read inside the exit. Each
  beat is `ringMobileBandFraction(i)` now — the clock's inverse, never a
  literal.
- ⚠ **A station's MID rest is an arbitrary position in a multi-viewport
  station.** The ring band's runway grew 30svh and `#services`' mid slid into
  the proof pile, where a field sheet's sentence passes under the settings
  cluster — the §1 class no floor can reach. Ledgered, not tolerated: the seat
  and NEAR read `(none)`.
- ⚠ **A station's rests are its STATES, and a band with targets has three.**
  ADR-113's NEAR (`top + 340`) and MID (half the height) were pulled by the
  two targets — 33px back onto the flip's end at 390×844, 309px onto the
  reading seat at 430×932 — and the seek reported a miss on a page doing
  exactly what it should. `stationRests("about")` returns the reading seat,
  the flip's end and the release frame (p = 1, past both radii).
- ⚠ **The covering rule is a rule about a BOX, and an `end` target's box ends
  on the fold.** ADR-113's glide case held that a stop 60px past a station
  taller than the screen STAYS; 60px past the flip's-end target the bottom
  of the screen is uncovered and the aligned position pulls the stop back —
  by design (a stop inside the name's window returns to the portrait alone).
  The case reads the alignment before applying the rule.
- ⚠ **A harness that insists on its own number reads a snap as a miss.** The
  probe's seats return their LANDING and print `pulled`; the smoke's
  `seatAboutBand` likewise. What is asserted is the page's state at the
  landing, and that no landing is inside a decode window.
- ⚠ **The dev server reloads the page under a long scripted walk** (the HMR
  socket dropped mid-run and the document collapsed to its pre-mount height);
  the scratch walks capture `pageerror` and print the document's height with
  every trial.
- ⚠ **`lib/musings/copyLaw.ts` fails `tsc` in this tree** — the other
  session's in-progress edit, outside this pass.

## Files

`components/landing/home-v2/unifiedServicesInstrument.ts` (`SERVICES_ABOUT_DECK_MOBILE`)
· `lib/services-ring/ringMath.ts` · `lib/services-ring/aboutBandMath.ts` (new)
· `lib/services-ring/portraitBake.ts` (new) · `lib/home-v2/lineLeaves.ts`
(new) · `lib/home-v2/scrubbedDecode.ts` (new) ·
`components/landing/home-v2/decodeLayer.ts` (new) ·
`components/landing/home-v2/services/hologram/ServicesCardRing.tsx` ·
`components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx` ·
`components/landing/home-v2/hooks/useServicesStageScroll.ts` ·
`components/landing/home-v2/services/ServicesStage.tsx` ·
`components/landing/home-v2/services/ServicesMasthead.tsx` ·
`components/landing/home-v2/services/services.css` ·
`components/landing/home-v2/about/{AboutStage.tsx, AboutBand.tsx,
useAboutBandScroll.ts, about-band.css}` · `app/(marketing)/page.tsx` ·
`public/prototypes/v7/landing-v7-motion.html` ·
`components/landing/v7/hooks/useLandingScroll.ts` ·
`app/(marketing)/arcs/trinny-london/proposal/turn/headCarrier.ts` (imports the
lifted walker) · `tests/lib/{about-band-math, services-ring-mobile-gate,
phone-viewport-units, layout-viewport-height}.test.ts` ·
`tests/visual/{services-ring-mobile-smoke, mobile-section-seams}.spec.ts` ·
`scripts/probe-mobile-deck.mjs` (new).

## Verifying

```bash
npx vitest run tests/lib/about-band-math.test.ts tests/lib/services-ring-mobile-gate.test.ts tests/lib/phone-viewport-units.test.ts tests/lib/layout-viewport-height.test.ts tests/lib/landing-import-doctrine.test.ts tests/lib/trinny-seam.test.ts
npx playwright test tests/visual/services-ring-mobile-smoke.spec.ts tests/visual/proof-stack-mobile-smoke.spec.ts tests/visual/mobile-section-seams.spec.ts --workers=1 --project=iphone-14-chromium --project=iphone-14-pro-max-chromium
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop      # unchanged, no --update-snapshots
npx playwright test tests/visual/services-ring-smoke.spec.ts tests/visual/trinny-london-smoke.spec.ts tests/visual/about-voidwalker-handoff-boundaries.spec.ts --project=desktop
node scripts/probe-mobile-deck.mjs --theme dark && node scripts/probe-mobile-deck.mjs --theme light   # headed; stills in .cursor/mobile-deck/
```

## Device checklist (the gate)

His phone, both toolbar states, dark and light, one still per fail:

1. Scroll past the fourth service card: the title and the paragraph glitch out
   while the four cards collapse into one stack; nothing flickers; scroll back
   and it all unwinds. A stop inside the last stretch completes the stack.
2. Keep scrolling: the stack turns over into the portrait, then the name and
   the role decode in above it, then the first paragraph types in below. A stop
   inside the flip completes it; a stop anywhere near the reading state lands
   on it. Nothing rests half-decoded.
3. The chevron: the paragraph rises, the two paragraphs unfold, the portrait
   shrinks with it (and hides on a short phone); close restores.
4. Scroll on: the portrait rides the band up as an ordinary page (no swim, no
   lag, one picture at the seam), the eras snap in.
5. Frame feel and thermal over the exit + flip, twice through. Any fail ⇒
   ship with `SERVICES_ABOUT_DECK_MOBILE = false` and nothing else moves.

## Update 1 (2026-09-20, owner) — the pinned bands take the dynamic viewport; the card grows

The device read, an hour after the deploy, three stills from Safari:

> when you scroll into, for example, the services section and scroll further,
> the action we have there is that you rotate the cards. At the same time,
> the entire section also moves up a bit. I think there are different scroll
> movements competing with each other so harmonize that … The same applies
> to the next section. It's really annoying because it moves all the elements
> up and leaves so much white space at the bottom … I also feel that in the
> services section, the text on the cards is too small. Maybe we can move the
> bottom paragraph a bit down, or … increase the size of the cards. I don't
> mind if they may overlap a bit behind the text, but right now the text is
> barely legible … the hero, the paragraph, and the cards are all nicely
> positioned. When I scroll, however, you just see that it all moves up.
> Really, let's fix this once and for all because it's annoying

**What the stills show.** In "services (good)" Safari's toolbars are
expanded; the band fills the frame and the paragraph sits just above the
settings row. In "services (bad)" and "About (bad)" the bars have collapsed
(the minimal URL bar, no bottom bar): the visible frame is ~100 css px
taller, the fixed chrome has followed it down to the real floor, and the
band — `100svh`, one small-viewport tall — ends where it did, so the
composition sits high with a hole under it. Nothing moved up; the frame grew
down and the band did not. The "competing movements" are two boxes sized
against two viewports: the chrome against the dynamic one (`position:
fixed`), the band against the small one.

### The decision

- **A pinned band is the ONE content box sized in `dvh`.** `.svc-ring-band`
  and `#about > .voidwalker` are `height: 100dvh`: they end where the fixed
  chrome ends in either bar state, so the paragraph and the chevron seat
  against the settings row as in the still he named good, and a bar
  transition moves the band's floor and the chrome's floor TOGETHER — one
  motion, not two.
- **The runway, the station and the weld stay in `svh`.** A scroll distance
  never moves, and an in-flow box in `dvh` would reflow everything below it
  on every bar transition (a reader in the eras scrolling up would watch the
  page jump ~100px as the bars re-expand). A sticky box's height changes
  nothing in flow.
- **The clocks MEASURE the pinned travel** (`runway − band`, `station −
band`) instead of assuming `runway − svh`. The travel is ~100px shorter
  while the bars are collapsed, and a bar transition advances or rewinds the
  clock a few percent — in the reader's own direction (the bars collapse on a
  downward scroll and expand on an upward one), so it reads as a slightly
  faster scrub, never a jump against the motion. The about band's two snap
  targets are written in the same `dvh` so they agree with the measured
  travel in either state.
- **The weld is loose by the bar height while the bars are collapsed**: the
  services band releases at `330svh − 100dvh`, the about station starts at
  `330svh − 100svh`. In between the un-typed band scrolls away under the
  stacked deck, which is on its frozen seat; nothing moves but the bed. The
  alternative (`margin-top: -100dvh`) is the in-flow reflow above.
- **The three options, costed**, because the choice is not free:
  1. dvh band, svh station, measured travel (taken): a few percent of clock
     drift with the bars, in the scroll's direction; the weld ~100px loose
     when collapsed; the document never reflows.
  2. dvh band, constant travel from svh: the band unpins ~9 % before p = 1
     when collapsed, so the handover never fires and the WebGL deck rides an
     unpinned band — exactly the lag §4 exists to prevent. Rejected.
  3. station `140svh + 100dvh` (constant travel): the document below reflows
     by the bar height on every transition — ADR-113's "settling", one
     station down. Rejected.
- **The card grows** (`ringMath`): `RING_MOBILE_FRONT_VW` 0.66 → **0.8**,
  `RING_MOBILE_FRONT_MAX_PX` 260 → **330**, `RING_MOBILE_SEAT_FILL` 0.82 →
  **1.25** — the card may overlap the band's title and paragraph by an eighth
  of the seat each side (his own allowance); the band's row gaps absorb most
  of it and the card's edges there are chrome and its dark foot, not copy.
  At 390 wide the front card is **312 css px** where it was 209, its baked
  lede **13 css px** where it was 8.7. The about band's DOM slot takes the
  same width law at fill 1.0 (there the name and the paragraph are the
  reading matter), and the deck's flight lands on it as before.
- **The phone face bakes at 0.75** (`BAKE_SCALE_MOBILE`, was 0.5), the
  back's own ratio since ADR-110: a 420px raster magnified 2.2× on a DPR 3
  screen was the blur half of "barely legible". Four faces ≈ 13.7 MB with
  mips (was ≈ 6).

### What this reverses, and what it does not

ADR-113 retired the live `dvh` term inside the era stage because a box that
changes height during the bar animation reflows the page under the reader.
That law stands for in-flow boxes; it never covered a STICKY band, whose
height changes nothing outside itself. `phone-viewport-units` names the two
bands as the one content exception and pins their counts (1 and 4). The era
stage (`.vwd`, one `100svh` screen in flow, a snap stop) is untouched: below
it the next station shows, not a hole, and it was not in the read.

### Measured (Chromium, where dvh = svh)

Byte-identical clocks and stamps to the tables above; the front card at
390×844 is width-bound at 312 css px on the reading frame. The dynamic-
viewport half is provable only on the device — Chromium resolves both units
to one number — which is what the second device read is for.
Probe at 390×844 dark after U1: the about slot 271 × 439 (was 222 × 360),
the handover mean |Δ| 4.31/255 with 2.44 % of samples over 40 (the bigger
twin, the same picture), the chevron 439 → 235 → 439, frames p50 4.3ms · p95
15.6ms · max 18.2ms — unchanged by the larger bake.

### Left open after U1

- The lede's own size on the phone bake (`TIGHT_LEDE_PX` 35 in the 840
  space): if 13 css px is still small on the device, the next lever is a
  phone-specific lede rung inside the bake, not a bigger card.
- The clock drift with the bars is arithmetic (~9 % of the travel at the
  collapsed extreme); if he feels it, the runway is the dial that dilutes it.

## Left open

- The device read.
- `scroll-snap-stop: always` on `.voidwalker__snap`, if a fling overshoots the
  reading state on WebKit (whose proximity radius is undocumented).
- The exit's 62svh and the about runway's 240svh — pacing dials, his read.
- The flip's-end and reading seats on WebKit: the radius arithmetic above is
  Blink's; a smaller radius widens the dead zone between the two (a stop there
  goes back to the flip's end), a larger one narrows it. Either way no stop
  rests mid-decode.
- The 342 kB of ADR-112 portraits on the phone, unchanged.

## Note (2026-09-24) — the third target, and the drift's real term (ADR-123)

- `#about` carries a THIRD snap target since ADR-123: `.voidwalker__snap-out`,
  `100dvh` on the band's last pinned frame (`start`), so a rest in the last
  radius of the hold pulls forward to the handover and a rest just past it pulls
  back. `.voidwalker__snap` is stamped `data-station-seat`, which is what the
  drawer's About link now lands on.
- U1's "a few percent of clock drift with the bars, in the scroll's direction"
  was measured with the HERO still `100dvh` — an in-flow box whose reflow on
  every bar transition rewound every runway below it. With the hero on the small
  viewport (ADR-123) the band's own clock is the measured-travel arithmetic U1
  chose and nothing else; the ~9 % figure in "Left open" is the hero's, retired.

## Update 2 (2026-09-25, owner) — the rest unfolds on the clock; the card fits its seat

Two asks from the same device read.

### A · The About band's rest unfolds on the band's own clock

Owner: the chevron's expansion _"should be activated automatically"_ while
scrolling — the portrait shrinks, the full text shows — and then the scroll
continues to the next section.

- `aboutBandMath.ts`: `ABOUT_BAND_OPEN_IN = 0.65` (after ¶1 has typed at
  0.60), `ABOUT_BAND_OPEN_OUT = 0.61` (47px of hysteresis at 844),
  `ABOUT_BAND_READ` 0.62 → **0.70** — the reading seat IS the expanded state —
  and `ABOUT_BAND_SQUARE_WINDOW` follows it; COVER, DONE, KILL unchanged.
  ⚠ **`READ × (RUNWAY − 1) < 1` IS A HARD BOUND, FOUND BY THE SMOKES**: the
  first cut set READ 0.72, and the ring band's RELEASE — the weld frame —
  seated 6.5px down at 844 (7.1 at 932) on both phones, with every rest
  within ±60px of it pulled onto that phantom. Measured with `--about-band-
read` overridden: 0.62, 0.70 and 0.71 are clean, 0.715 puts the phantom ON
  the weld, 0.72 puts it 6.5px past. The reading seat is a `start` area one
  screen tall at `READ × travel` from the station's top; once its top sits a
  whole viewport below the weld (READ × 1.4vh ≥ vh ⇔ READ ≥ 0.714), Blink
  treats the seat's first-visible position (`top − vh`) as a snap position
  inside the flip's-end target's covering range. The unit test pins the
  product under 0.99; a longer runway TIGHTENS the bound.
  Chosen over a scrubbed height (which needs the rest in px, scrubs ¶1 under
  the thumb while it is read, and makes a mid-window rest a half-open rest):
  this reuses the approved 420ms gesture, keeps ONE owner of `data-bio-open`,
  reverses on scroll-up, and the deck already follows the shrinking slot
  through the pulse.
- `useAboutBandScroll.ts`: inside `write()`, `want = open ? p > OPEN_OUT : p ≥
OPEN_IN`; on change the attribute, `measured = false` and a `REST_PULSE_MS`
  (520) pulse; the measure gate becomes `(nameLive || copyLive) && (!measured
|| now < pulseUntil)` so a fast scroll-up that un-types ¶1 while the rest
  folds keeps the leaves on the moving line. The first synchronous `write()`
  lands the attribute with `data-about-band`, so a deep reload paints open.
- **The chevron is deleted** — the `<button class="voidwalker__more">` and
  `id="about-rest"` in the prototype, its two CSS blocks; the rows become
  `auto auto minmax(0,1fr) auto auto` (name · role · seat · ¶1 · rest). The
  rest stays `visibility: hidden` before its window as the name and ¶1 are;
  no-JS / PRM keep the whole static bio.
- Seats and the hold at 844 (travel 1.4×vh): OUT→IN 47px, IN→READ 59px, hold
  after READ 354px (the unit test's 300 floor holds). The runway does NOT grow;
  the named dials are `ABOUT_BAND_RUNWAY_SVH` 2.4 → 2.6 or `always` on
  `.voidwalker__snap`. Short phones: with the chevron's row gone the open seat
  is ≈149px at 681h — over `ABOUT_BAND_SLOT_MIN_PX` 140 by 9px; the floor is
  kept and the smoke's 681 case asserts it.
- **Guards:** `about-band-math.test.ts` (OUT ≥ the copy's end, IN past OUT by
  ≥24px of travel, READ past IN by ≥48px, READ − IN < 0.1, the sheet's
  `--about-band-read` 0.72 in lockstep); `services-ring-mobile-smoke` — the
  theme case asserts the flip's end FOLDED and the reading seat OPEN with no
  chevron in the DOM, "the rest of the bio unfolds on the clock, and folds
  again on the way back" replaces the chevron case, and "the expanded seat
  stays over the portrait's floor on the shortest band phone" runs at 390×681;
  `probe-mobile-deck` reads COVER / READ / COVER.

### B · The services card fits its seat, and its type grows inside the bake

Owner: _"scale them down a bit on mobile so they don't overlap with the text …
Maybe we need to slightly redesign the cards and the text size on mobile."_

Two corrections found while designing. The ring rung is `(min-height: 681px)`,
so **390×676 cannot mount the ring in Chromium** — on iOS the media query
resolves on the LARGE viewport while the `100dvh` band is 664–676 with the
toolbars showing, which is why his device shows a band shorter than the
rung's own floor; **390×681 is the CI proxy**. And `--hud-content-inset` is
24px at ≤960 (band inner width 342 at 390).

- **The fit** (`ringMath.ts`): `RING_MOBILE_SEAT_FILL` 1.25 → **0.94**, a new
  `RING_MOBILE_POSE_SLACK = 1.06` (the smoke's tilt literal, promoted) with the
  invariant `FILL × SLACK ≤ 1` — the projected rect can never leave the seat,
  so the row gaps are pure clearance. U1's 1.25 let the card run 47–79px into
  the title and the paragraph on every frame under 844: a collision, not an
  allowance. `RING_MOBILE_FRONT_VW` 0.8 / `MAX_PX` 330 stay.
- **The band funds the seat on the small frame** (`services.css` ≤960 ring
  block): the intro at `14px / 1.45 / 42ch` (three lines probable, four worst,
  was four at 15/1.5/38ch), the row gap `clamp(18px, 3svh, 32px)` (was
  20/3.4/36). Seat → card at 390 wide, before → after: 676 → 347 (201×326) vs
  **381 (221×358)**; 745 → 411 vs 446 (259×419); 844 → 503 vs 539 (312×505,
  width-bound again); 430×932 → 330 (the cap).
- **The type grows INSIDE the bake** — the phone rung U1 itself named:
  `ringType.ts` gains `FaceRung` and `FACE_PHONE_RUNGS = { name: 74, nameLh:
88, nameCap: 52, lede: 50, ledeLh: 68 }` (the name takes the BLED
  treatment's own rungs; the lede is the smallest that clears 12 css px on a
  210px card — 46/48 fail at 11.5/12.0). `bakeCardFace(…, opts?.rung)`: the
  phone mount passes `{ rung: "phone" }`, the desktop passes nothing and every
  branch falls to its literal (source pins on `TIGHT_LEDE_PX = 35` and the
  display style's 62/74/44). On screen (bake × cardW/840): 676 → lede **12.5**,
  name **18.5**; 745 → 15.4 / 22.8; 844 → 18.6 / 27.5 (was 13.0); 932 → 19.6 /
  29.1. If 18.6 reads loud at 844, the dial is one number.
- **The raster follows the type**: `RASTER_PX_PHONE = 24` beside `RASTER_PX`
  18 (`cardViz.ts`; at a 210–221px card over a ≤1.4× canvas an 18px cell is
  6.6×4 canvas px and reads as halftone — 24 is the smallest at which `@ % # *`
  resolve; the portrait keeps 58×57 cells, coarser than the reveal's coarsest
  mosaic), and `reveal.ts` gains `RASTER_QUIET_HEAD_PHONE = 320` /
  `RASTER_QUIET_FOOT_PHONE = 928` with `rasterQuietAt(y, head, foot)` —
  `rasterQuiet(y)` is that function with the desktop's bands bound, so the
  shader and every desktop bake are byte-identical (the reveal test walks
  every px of it).
- **The back's 34 floor is left** (8.9–12.6 css px on the phone card):
  `backFaceLayout` has no slack above `BACK_CONTENT_LIMIT`, so a lift cuts copy
  on every record. The alternatives are shorter `breakdown` / spec strings, or
  ADR-109's DOM sheet.
- **Guards:** `services-ring-mobile-gate.test.ts` (fill ≤ 1, `FILL × SLACK ≤
1`, the three frames' widths, the about band's width law read against the
  constants, the phone rungs ≥ 12 / ≥ 18 css px on the rung's smallest card,
  the phone bands against a two-line name and a five-line lede, the source
  pins); `services-ring-reveal.test.ts` (the phone block; `rasterQuiet ===
rasterQuietAt(·, 300, 1060)` at every px); `services-ring-mobile-smoke` —
  the U1 `over` allowance is gone (title bottom + 8 ≤ card top, card bottom
  - 8 ≤ intro top, card height ≤ seat), the tilt literal reads `POSE_SLACK`,
    and "the card sits between the two texts on the rung's shortest frame, its
    lede readable" runs at 390×681. `type-material-tokens`' 18/6 pins on the
    ring hold (no new `letterSpacing`, no new bold literal).

### Device checklist (U2)

5. About: scroll past the first paragraph — the rest unfolds and the portrait
   shrinks on its own; scroll up — it folds; the next flick leaves for the
   eras.
6. Services: the card sits between the title and the paragraph, touching
   neither; the paragraph on the card is readable with the toolbars showing.

## Update 3 (2026-09-25, owner) — the unfold follows the thumb

Owner, on the device, of U2's unfold: _"the transition from the full photo to
the smaller photo with the full paragraph seems to have a step in between … we
can make it a bit smoother."_

**The step, diagnosed.** Everything in the band was scrubbed on its scroll
progress `p` (the flip, the name decode, ¶1 typing) EXCEPT U2's unfold: a
boolean stamped at p 0.65 that started a 420ms `grid-template-rows 0fr → 1fr`
on `cubic-bezier(0.16, 1, 0.3, 1)` — about 56 % of the motion in its first
50ms, then a ~300ms creep — on the clock, after the scroll had stopped.
Nothing read `p` in [0.60, 0.70], so the reader saw ¶1 finish, a hold, then a
jolt and a creep. Two aggravators: the canvas posed the card ONE FRAME LATE
(R3F's `useFrame` runs before the writer's rAF and read last frame's slot —
47 / 38 / 29px too tall on the transition's steep first frames, its foot under
the rising ¶1), and on the toolbar-shown frame the open seat sat at or under
the 140px floor, so the portrait could hide mid-unfold.

- **The window** (`aboutBandMath.ts`): `ABOUT_BAND_OPEN_IN` / `_OUT` are
  deleted. `ABOUT_BAND_NAME_WINDOW` [0.30, 0.41], `ABOUT_BAND_COPY_WINDOW`
  [0.41, 0.58], and a new `ABOUT_BAND_REST_WINDOW = [COPY end, READ]` =
  [0.58, 0.70] with `aboutBandRestT(p)` a `smoothstep` over it — peak slope
  1.5×; smootherstep's 1.875× would move ¶1 at up to ~4× the finger. READ 0.70,
  the runway and U2's Blink bound are unchanged.
- **The writer** (`useAboutBandScroll.ts`): a `ResizeObserver` on
  `.voidwalker__rest__in` writes `--about-rest-h` in px (width, font swap and
  toolbar reflows all land); every `write()` sets `--about-rest-t`
  (delta-gated, the exact 0 and 1 always land), `data-bio-open` while t > 0 and
  `data-rest-full` at t ≥ 0.999. `REST_PULSE_MS` and the pulse are deleted — no
  timed motion is left in the band. ⚠ **The scroll and resize listeners call
  `write()` SYNCHRONOUSLY**: both events dispatch before rAF callbacks, so the
  canvas's `useFrame` reads THIS frame's slot. ⚠ **The floor has a
  hysteresis**: the slot hides under 140 and shows again from
  `ABOUT_BAND_SLOT_SHOW_PX` 150, so a drag across the floor cannot flicker the
  portrait.
- **The sheet** (`about-band.css`): `.voidwalker__rest` is `height:
calc(var(--about-rest-t) * var(--about-rest-h))`, `overflow: hidden` — a
  clip reveal, pure motion — and `height: auto` at `[data-rest-full]`, so the
  reading seat never depends on a stale measure. Both `grid-template-rows`
  transitions are gone. ⚠ **Short frames are paid in `svh`, never a height
  query** (iOS resolves height media on the LARGE viewport): the band's
  `row-gap` is `clamp(10px, calc(5svh − 24px), 22px)` and the rest's
  paragraph margin 12 → 8px.
- **Why U2's ruling reverses.** U2 chose the clock because a scrubbed height
  needs the rest in px (the observer measures it), scrubs ¶1 under the thumb
  while it is read (bounded now: the unit test pins ¶1's peak at ≤ 2.5× the
  finger at 844) and makes a mid-window rest a half-open rest (the reading
  seat is a snap target; a lift mid-window settles on it, which is now on the
  device checklist). The owner's read is that the clock was the step.

**Measured** (Chromium 390×844 against a production build, the window swept
in 12 steps with snap off): the rest 0 → 5.2 → 21.3 → 46.6 → 75.2 → 106.5 →
134.2 → 157.6 → 170.9 → 173.5px while the slot falls 534 → 402, both
monotonic, ¶1 never over the seat. Headed, the deck probe is green at 844,
932 and 745; headless SwiftShader fails only its p95 frame-time proxy
(53–60ms, software GL), as it did before this change.

**Guards:** `about-band-math.test.ts` (REST[0] ≥ COPY[1], REST[1] = READ, the
ends and monotonicity of `aboutBandRestT`, ¶1's peak speed ≤ 2.5× the finger,
the slot hysteresis ≥ 8px); `services-ring-mobile-smoke` — the unfold case is
U3's: COVER folded, a MID read with `scroll-snap-type: none` asserting the
rest and the slot strictly between their ends, READ open, back to COVER
folded; the 390×681 case asserts the open seat ≥ 157px; `probe-mobile-deck`
prints the 12-step sweep and checks it.

### Device checklist (U3)

7. About: scroll slowly past ¶1 — the portrait shrinks and the rest unfolds
   under the thumb, with no pause before it; lift the finger mid-unfold — it
   settles onto the open reading seat; scroll back — it folds the same way.
