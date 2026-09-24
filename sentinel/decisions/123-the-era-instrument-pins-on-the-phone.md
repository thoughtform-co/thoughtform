# ADR-123: The era instrument pins on the phone, and the pile's reload is bisected on the device

- **Status:** Proposed (2026-09-24). Part 2 shipped and guarded on `diag/phone-pile`;
  Part 1 is four preview builds the owner reads on his iPhone; the survivors land on
  `main` as one commit after his read. Not on `main`.
- **Surface:** the landing on a phone (≤700 for the era stage, ≤960 for the pile), on
  iOS Safari and iOS Chrome — both WebKit.
- **Reverses:** [ADR-113](113-the-phone-locks-in.md) §1's "a sticky runway for
  `#voidwalker` was considered and rejected" and §2's `--hero-lift` exemption, and
  turns its held dial (`scroll-snap-stop: always`) — all three on the owner's word.
  Corrects [ADR-115 U1](115-the-phones-deck-flip.md)'s "the clock drifts with the
  bars" (the hero was the term doing the drifting). Answers
  [ADR-082 U28 §5](082-voidwalker-character-stage.md)'s open question about a
  Low Power Mode reload, through the bisect.
- **Related:** [ADR-107](107-the-proof-card-is-two-sheets-on-a-phone.md) (the pile is
  eight sheets), [ADR-108](108-the-ring-on-phones.md) (the ring's fixed canvas and
  its ship-with-fail answer), [ADR-038](038-corridor-quality-governor.md) (the
  governor whose floor unmounts the ring), [ADR-018](018-home-v2-depth-corridor.md)
  (the corridor's nested root and its ≤960 import gate), [ADR-002](002-scroll-animation-architecture.md)
  / [ADR-021](021-corridor-scroll-writer.md) (one writer per station, which the
  phone branch keeps).

## The ask

Owner, 2026-09-24, from his iPhone (Safari, then Chrome):

> In the proof section, it reloads when I scroll. I think we need to fix that.
> In the Voidwalker section, when I enter it, the components or just that section
> scroll weirdly. It's not locking into place, which makes it difficult to
> navigate. Of course, you want to be able to smoothly scroll to the next section.
> Once you hit a section, the section inside it, with all the components, should
> not be able to move as awkwardly as it does now. Please do a very thorough check
> to fix it.

The reload "varies, not every time". His three calls when asked: pin the era
instrument with the eras riding the scroll; the hero in `svh`; the bisect as
preview deploys on one temporary branch, landing on `main` as one commit.

## Diagnosis

### The era stage does not lock in, and it is geometry

`#services` and `#about` are PINNED bands on the phone — a sticky one-screen box
inside a taller station, so a scroll advances a clock while the band stays put
(ADR-108, ADR-115). `.vwd` was the journey's one UNPINNED stop: a one-screen box
in normal flow, held only by a `proximity` snap that fires after the finger
lifts and only inside its radius (~281px in Blink at 390×844; WebKit's is
undocumented). Between `#about`'s reading seat and `.vwd`'s seat nothing pulled
for **807px** (890 at 430×932), and for 358px past the seat — so a flick from the
bio landed on a half-scrolled instrument more often than on it.

And the hero was the page's one in-flow `100dvh` box, so every iOS toolbar
collapse re-laid it and shifted EVERY flowing box below by ~99px under the
thumb; WebKit has no scroll anchoring. The pinned bands absorb that in their
clocks (they measure their travel), the instrument visibly jumped. ⚠ ADR-115 U1
recorded "a few percent of clock drift with the bars, in the scroll's direction"
as the band's own arithmetic; the term that moved was the HERO's, one station
up, rewinding every runway below it.

### The reload is a memory kill, and nothing on this machine can measure it

No `location.reload`, service worker or meta refresh is reachable on `/`. What
is left is WebKit ending the tab's content process for memory and reloading it
with no console, no error, no event ("varies" is the shape of a budget, not a
code path; ADR-082 U28 §5 recorded a suspected Low Power Mode reload as open).
What is resident and running while the reader is in the pile on a phone,
verified in source:

- the corridor scene redraws EVERY frame under the whole pile —
  `FrameInvalidator` pumps while `servicesAmbient` (`DepthGatewayScene/index.tsx`);
- a SECOND full-screen WebGL context, `BrandmarkParticleCanvas`, mounts when the
  dock releases at the pile's head at DPR up to 1.75 and redraws once per scroll
  frame — and on `/` it can never paint a pixel: all five of its journey anchors
  sit in stations the route strips, and the journey hides itself under two live
  keyframes (`useBrandmarkJourney.ts`);
- the ring's four face bakes (~13.7 MB of GPU texture with mips plus ~10 MB of
  source canvases at `BAKE_SCALE_MOBILE` 0.75) are baked at mount and held
  through the pile though the cards are off-stage;
- eight sticky sheets keep painting their glass, band, rim and wash when
  covered (only `.pf-card__body` hides), each an animated
  `translate`/`scale`/`opacity` with a `clip-path`;
- the quality governor, sampling under the ambient, unmounts the ring at its
  floor and REBAKES on recovery.

Two things make a kill read worse than it is: there is no
`history.scrollRestoration` on the route, and on ≤960 the corridor chunk waits
for the first scroll, so the browser's own restore clamps a deep position
against a short document — "it lands at the bottom"; and the nested services
root (`ServicesPortal.tsx`) has no error boundary, so an uncaught error there
empties the pile and clamps the scroll, which also reads as "reloaded and landed
elsewhere".

There is no Mac for Web Inspector, iOS has no JS memory API, every device read on
record was against a Vercel deploy. So the reload is BISECTED with preview builds
the owner opens on the phone, each carrying a diagnostic strip that survives the
kill, and the era stage is fixed by construction.

## Part 2 · The era instrument pins on the phone

Every build carries this as its base.

### The mechanism

- **Flag + media** (`unifiedServicesInstrument.ts`): `VOIDWALKER_PHONE_RUNWAY`
  (off ⇒ today's phone page byte for byte) and `VOIDWALKER_PHONE_RUNWAY_MEDIA =
"(max-width: 700px) and (min-height: 681px) and (prefers-reduced-motion:
no-preference)"` — ≤700 is the instrument's own one-screen rung; 701–960 is
  content-height and keeps today's flow.
- **The station is the runway and the stop** (`voidwalker.css`, a new block
  after the ≤960 one): `#voidwalker[data-vw-phone="runway"].station` takes
  `padding-block: 0` (its top IS the pin frame — `.vwd__sheet`/`.vwd__band`
  reserve both chrome bands from inside), `min-height: calc(100svh +
var(--vw-phone-dwell))` with `--vw-phone-dwell: 120svh` as the one dial
  (ADR-122 U1's reason for 120 over 60), `scroll-snap-align: start` (`#services`'
  idiom: the runway station is the stop) and `scroll-snap-stop: always`
  (ADR-113's held dial, turned — the device showed the overshoot).
- **The instrument pins inside it**: `.vw--hologram > .vwd { position: sticky;
top: 0; height: 100dvh; scroll-snap-align: none }` — `100dvh` is ADR-115 U1's
  law for a pinned band (it seats against the fixed chrome, which lives in the
  dynamic viewport); the recorded fallback if the figure's ~15 % breathing on a
  bar transition reads wrong is one declaration, `height: 100svh`.
- **Two release targets**, both `100dvh`, absolute, full-width, `start`,
  `pointer-events: none`: `.vw-phone-snap` on the runway's foot (an
  `aria-hidden` sibling after `<VoidwalkerHologram/>`) and `.voidwalker__snap-out`
  on the about band's foot (its third target, beside ADR-115's two; markup in the
  prototype). A rest in the last radius of a band pulls forward to its handover
  frame, a rest just past it pulls back — never a half-scrolled band.
- **The writer** is a second branch of the SAME hook (`useVoidwalkerHologramScroll`:
  same listener, same rAF — one writer). Not capable and the phone media matches
  ⇒ `writePhone()`: stamps `data-vw-phone="runway"` once; `travel = runway rect −
.vwd rect` (MEASURED, ADR-115 U1); `p = clamp01(−top / travel)` with the `-0`
  trap; writes `--vwh-p` delta-gated; returns while off-screen (never glitch the
  figure unseen); honours a tap's glide (`voidwalkerEraPickRef`, landed on
  `scrollend` or a 900 ms cap); derives the era with
  `voidwalkerEraFromProgress(p, count, current, VOIDWALKER_PHONE_ERA_BAND)` and
  calls the existing era scrub ref. It never writes `data-vw-mode`,
  `data-vwh-ready`, `data-vw-handoff` or the hologram progress ref — the desktop
  choreography, the weld and the title decode stay off. `data-vw-surface` is set
  once, not per frame; `disengage()` runs only on the transition.
- **The clock** (`voidwalkerHologramClock.ts`): `VOIDWALKER_PHONE_ERA_BAND =
[0, 1]` — the pin frame IS era 0, the release IS era 4, slices of 24svh;
  `voidwalkerEraFromProgress` / `voidwalkerProgressForEra` take an optional
  `band` defaulting to the desktop's, identity for every desktop caller
  (unit-pinned over 101 × 5 × 5 points).
- **The tap** (`VoidwalkerHologram.tsx`, `pick`): on the runway rung `travel =
runway.offsetHeight − .vwd.offsetHeight`, the pick ref is set, and the page
  scrolls to `voidwalkerProgressForEra(i, n, band) · travel`; the reel warms every
  era's poster once the station is near, because a fling can cross four eras.
- **The hero in `svh`** (`landing.css`, the three curtain clips there and the
  three in `rail-instruments.css`; `useLandingScroll` reads
  `layoutViewportHeight()`): the identity `lift = 1 ⇔ cleared` holds on the
  small viewport, and the document below the hero no longer reflows on a bar
  transition. What it looks like: at scroll 0 iOS shows the bars, so the hero
  fills exactly; as the toolbar collapses during the lift, a ~99px strip of the
  corridor's frozen first frame shows under the hero's edge — the reveal the
  curtain performs anyway, 99px earlier.
- **Programmatic paths land on seats**: `HudNav` scrolls the first
  `[data-station-seat]` inside its target (stamped on `.voidwalker__snap` by
  `useAboutBandScroll`, on `.vwd` by the hologram) and `settleInitialAnchor`
  resolves the same way — a drawer tap lands on the reading state and the pin
  frame, never on a station's padding.

### Geometry (390×844, from `#about`'s top)

| beat                        | y                         | pulled by                      |
| --------------------------- | ------------------------- | ------------------------------ |
| the flip's end              | +307                      | `.voidwalker__snap-in` (`end`) |
| the reading seat            | +733                      | `.voidwalker__snap` (`start`)  |
| the about band's release    | +1182                     | `.voidwalker__snap-out` (new)  |
| `#voidwalker`'s seat        | +2026                     | the station (padding 0)        |
| the pinned dwell, five eras | +2026 → +3039, 203px each | the covering rule              |
| the runway's release        | +3039                     | `.vw-phone-snap` (new)         |
| `#musings`                  | +3883                     | the station                    |

Un-pulled stretches: 807 + 358 → 282 + 282, each one radius, each bounded by a
named pair. The seams spec's sweep walks every 40px from the reading seat to the
writing and attaches the landings.

### What is left as is, recorded

- The figure column's per-era `translate` (the head line, no transition) and the
  reel's 420 ms slide are unchanged.
- `#musings` is NOT welded over `.vwd` — the era stops would be covered first
  (the owner's dial, cost named: the runway's release is a plain seam).
- `env(safe-area-inset-bottom)` inside `--vwd-chrome-clear`: verify on the device
  whether it changes with the bar; if the stops and `.rin-settings` diverge,
  freeze the instrument's reserve.

### Guards

`tests/lib/voidwalker-phone-runway.test.ts` (the media literal === the constant;
the dwell declared once; sticky/dvh/none and start/always/padding-0 by selector;
both release targets and their resting `display: none`; the band `[0, 1]`;
progress strictly increasing; desktop identity with and without the argument; no
negative `margin-top` in the phone block; the writer's phone branch writes none
of the desktop's attributes). `phone-viewport-units`: the `.hero` and clip ALLOWs
deleted (landing.css 12 → 8, rail-instruments 3 → 0), voidwalker.css 0 → 2 with an
ALLOW for `.vwd` / `.vw-phone-snap`, about-band.css 4 → 5.
`layout-viewport-height`: `useLandingScroll` and the hologram hook join the
adopters; the DELIBERATE case becomes "no exception remains". `mobile-section-seams`:
`SNAP_STOPS` gains `.voidwalker__snap-out`, `#voidwalker`, `.vw-phone-snap` and loses
`.vwd`; `NOT_SNAP_AREAS` gains `.vwd`; `stationRests("voidwalker")` = pin, mid,
release; three new cases — the geometry (every seat ±1px), the stillness (seat,
then half the dwell: `.vwd`, its band and its title's seat within 0.5px, the
selection on era 2, a tap on a visible neighbour landing its era with the
instrument unmoved), the sweep (every rest lands on a seat or a pin; ≤2 stretch
runs each ≤ a third of the screen + 80). `probe-mobile-lockin.mjs`: the new stops
and the radius sweep on `#voidwalker`.

## Part 1 · The reload — one branch, four preview builds

Branch `diag/phone-pile`, four commits, each its own Vercel preview URL; a DRAFT
PR for CI; both deleted after the read. Every build carries Part 2, so only the
pile levers vary along the ladder. All of it is ≤960 / phone-profile scoped;
desktop is byte-identical and the HUD snapshots prove it.

### Commit A · see, and land where you were

1. **The diagnostic**, off the anonymous path. `lib/landing/blackBox.ts`
   (three-free): `record()` merges into `sessionStorage["tf-blackbox"]` at ≤4 Hz,
   flushed on `pagehide` / hidden; `readPrev()`; `bumpSession()`.
   `components/landing/v7/diag/DiagGate.tsx` (beside `<HudNav>`): one effect; on
   `?diag=phone` (or `sessionStorage["tf-diag"]`, set on first match so it
   survives a reload; `?diag=off` clears it) `import("./DiagPanel")` — a dynamic
   edge, which `landing-import-doctrine` skips by design. The gate registers
   `pageshow` and capture-phase `webglcontextlost` / `restored` counters at
   mount. `DiagPanel.tsx` is a fixed 10px PT Mono strip under the TR readout with
   a 44px COPY chit, re-read at 4 Hz and on scroll; it stamps NOW and PREV: `nav`
   (the navigation entry's `type`), `persisted`, `session` + `prevAt`, `vh`
   (`innerHeight` · `clientHeight` · `visualViewport.height/scale` · `dpr`),
   `y`/`docH`, `pile` (the active slot's `--pc-enter`/`--pc-depth`/state, the
   split, the covered count), `gov` (`dprCeiling`, `countMultiplier`, `probed`,
   `classifyRenderer()` only if probed), `gl` (every `<canvas>`: host, drawing
   buffer, css box, `position`), the `<html>` `data-*` (incl. `data-pile-hold` /
   `data-ring-near` from B and C), `lost`/`restored`, `frames` (a
   `<FrameCounter/>` `useFrame` in each Canvas writing three-free
   `lib/home-v2/frameCounterRef.ts`; the strip shows the delta per second;
   `window.__tfFrames` only under `navigator.webdriver`, the governor's own
   carve-out), `mem` (`n/a` on WebKit, printed so the report names the browser),
   `err` (the boundary's last error or the page's), `build` (`DIAG_VARIANT`).
2. **Scroll restoration.** `components/landing/v7/ScrollRestoration.tsx` + three-free
   `lib/landing/scrollMemory.ts` (`tf-scroll:${pathname}` → `{ y, docH, vw, vh, t }`,
   saved ≤4 Hz and on `pagehide`; `vh` through `layoutViewportHeight()`). At
   mount `history.scrollRestoration = "manual"` (landing only, restored on
   unmount); skip on `location.hash`, on a bfcache restore, with no record, on a
   rotation (`|vw − innerWidth| > 40`) or a record older than 30 min; otherwise
   restore for `reload`, `back_forward` AND `navigate` (a jetsam reload may
   report `navigate` — the stamp will say). Then `releaseCorridorImportGate()`
   (an exported opener for the ≤960 first-scroll gate; the valves untouched),
   wait for `.home-v2-stage` and, on the split rung, `.pf-stack--split`, then
   until `scrollHeight` is still for 3 frames and `scrollHeight − vh ≥ y` (cap
   4 s), then `scrollTo({ top: y, behavior: "instant" })`, re-applied once at
   +500 ms if the document moved > 2px. Every downstream state is a function of
   rects, so it reconstructs on the next frame.
3. **The services boundary.** `ServicesPortal` renders
   `<ServicesBoundary fallback={<ServicesFallbackPile …/>}><ServicesStage/></ServicesBoundary>`:
   `componentDidCatch` logs `[services-boundary]` and writes `{ err, stack, y }` to
   the black box; the fallback is the pile alone (most of the station's height,
   so the document does not collapse), `null` if the pile threw.

### Commit B · stop the per-frame work the pile hides

- **(a) No pump while the pile owns the frame.** `ProofStack`, split mode only:
  two `IntersectionObserver`s on `.pf-stack__runway` (rootMargins `0 0 -92% 0`
  and `-92% 0 0 0`: runway top ≤ 0.08·vh AND bottom ≥ 0.92·vh ⇒ `hold`), written
  to three-free `lib/home-v2/pileHoldRef.ts` and stamped `data-pile-hold="1"` on
  `<html>`. A separate ref, not a store field — ADR-021's single writer on
  `servicesAmbient` stands. `FrameInvalidator`'s gate becomes `t.active ||
t.armed || t.docked || (t.servicesAmbient && !pileHoldRef.value) ||
vwTravelRef.current.engaged`; while held, a passive `scroll` listener calls
  `invalidate()` once per event so the bed in the gutters still moves, and at
  rest nothing draws. The DPR half (`effectiveDprCeiling(profile, hold ?
min(ceiling, 1) : ceiling)`) is measured first. Cost: the haze's twinkle
  freezes in the gutters between scroll events. Not installed on desktop (the
  pile is seated over a pinned stage there).
- **(b) No particle canvas on a host with no anchors.** `BrandmarkSystem` renders
  `<BrandmarkParticleCanvas/>` only with ≥2 anchors (the journey needs two live
  keyframes to ever set `visible`); on `/` that is 0. Its DPR is capped `[1,
1.4]` on a coarse pointer for hosts that do mount it. Unit pin: the parsed `/`
  body has no `data-brand-anchor`.
- **(c) A covered FIELD sheet stops painting.** In the split block:
  `.pf-slot--field[data-pc-state="covered"] .pf-card { visibility: hidden;
clip-path: none }` — on the CARD, never the slot (the hook reads the slot's
  rect). The RECORD keeps its band by construction (ADR-107 §4). Covered ⇔ cover
  ≥ .999, so nothing visible changes at the flip. No `contain: paint` (a rising
  card sits `--pc-rise` below its slot during arrival), no `will-change`.

### Commit C · release the bakes until the band is near

`ServicesStage` (phone ring only): an `IntersectionObserver` on
`.svc-ring-runway` AND `#about` (the deck needs the faces through the band),
`rootMargin: 150% 0 150% 0` → `data-ring-near` on `<html>`. The ring's bake
effect gains `bakeWanted` (a `MutationObserver` on `<html>`; desktop always
`true`, byte-identical): on the mobile profile `!bakeWanted ⇒ setTextures(null)` —
the existing `[textures]` cleanup disposes the GPU copies and dropping the state
drops the canvases; the same gate on the portrait and the back cache. In the
warm-up drain, after `gl.initTexture`, `texture.image` becomes a 1×1 canvas on
the phone profile (never `null`; a lost context rebakes from scratch). Cost: a
fling from the pile into the band faster than the re-bake shows the cards a beat
late — `bakeMs` is stamped in the diag; the margin widens if the phone bakes
slower than 1.5 vh of fling.

### Commit D · the documented last resort

`SERVICES_CARD_RING_MOBILE = false` — ADR-108's ship-with-fail answer: no dock,
no ambient hold, no fixed canvas, no band, no deck (ADR-115 goes with it).

### The protocol he runs

Per build, per browser (Safari then Chrome): kill the tab; open
`<preview-url>/?diag=phone` cold; dark; Low Power Mode off; scroll the pile top to
bottom at reading pace, back up through the drawer, three times; once more with
Low Power Mode on. After any reload: COPY on the strip, paste. Plus device, iOS
version, and whether Safari said "A problem repeatedly occurred". Reading the
ladder: reload in A not B → the per-frame levers suffice; in B not C → the
bakes; in C not D → the fixed canvas itself; in all four → the cost is beyond
`#services` and the next bisect is per field kind inside the pile. The surviving
levers land on `main` as ONE commit; the diag, the boundary and the restoration
ship regardless (off the anonymous path, or a plain correctness fix).

### Not done, and why

`content-visibility: auto` on ≤960 (ADR-113 §4 measured the reflow under the
thumb; the DOM is not the suspect); `mandatory` snap; lazy-mounting the consoles
(a mount that changes the pile's height moves the runway under the reader);
`contain: paint` / `will-change`; killing the ambient early (the deck and the
about handover need the canvas); dropping `BAKE_SCALE_MOBILE`; retuning the
governor's ladder; touching the corridor mount's valves beyond the gate's
opener; `scrollRestoration` in `app/layout.tsx`.

## Measured (Chromium, the phone projects — `probe-mobile-lockin.mjs`, dark)

Every stop lands within 0.5px of its seat from 40px short; every station taller
than the screen holds a stop 60px past its seat (the covering rule); the two
one-screen targets snap back from 60px past.

| what                                                             | 390×844     | 430×932    | 390×745     |
| ---------------------------------------------------------------- | ----------- | ---------- | ----------- |
| `#voidwalker` seated: `.vwd`'s top                               | −0.1        | 0.0        | −0.2        |
| the era stops' bottom / the settings row's top                   | 787.9 / 800 | 876 / 888  | 688.8 / 701 |
| the title's ink / the TL bracket's foot                          | 53.9 / 44   | 54 / 44    | 53.8 / 44   |
| the runway (station − `.vwd`), i.e. the dwell                    | 1013        | 1118       | 894         |
| `#voidwalker`'s proximity radius (largest short stop that lands) | ≥ 280       | ≥ 280      | ≥ 240       |
| `.voidwalker__snap-out` / `.vw-phone-snap` seat −40              | 0.1 / −0.1  | −0.3 / 0.1 | −0.2 / −0.2 |

The seams spec's sweep (every 40px from the reading seat to the writing, both
iPhone projects) attaches its landings as `rest-sweep`: no rest lands on
nothing, and the stretch runs are two, each under a third of the screen.

## The device checklist, in his words

1. Flick from your bio into the eras. The section should arrive and stop dead —
   title under the top-left bracket, era stops above the settings icon — and the
   next flick should change the ERA, not move the section. If it creeps under
   your thumb, the pin did not take; if it stops with half the bio showing,
   Safari's snap reach is shorter than Chrome's and that stretch is the next dial.
2. With an era on screen, nudge the toolbar in and out. The stops and the
   settings icon should move together and nothing should jump; the figure may
   grow a little with the bigger frame — say if that bothers you. Tap another
   era: the page glides, the section stays put.
3. Keep scrolling: five eras, then the writing. A short stop just past the last
   era springs back to it. In every section the page should no longer jump when
   the toolbar collapses.

## Left open

- The device read, for both parts.
- WebKit's proximity radius against the two 282px stretches.
- `height: 100svh` on `.vwd` if the figure's breathing reads wrong.
- Vercel builds a preview per branch commit on this project (verified against
  the `claude/morning-0wg116` ladder of 2026-09-16), and **Deployment
  Protection is ON for every URL but the custom domains** (`ssoProtection:
  all_except_custom_domains`) — the owner signs in to Vercel once, per phone
  browser, before the first preview opens.
