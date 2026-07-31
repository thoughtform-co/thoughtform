# ADR-056: The proof casefile at the top of #services

**Date:** 2026-07-28
**Status:** Accepted
**Surfaces:** `components/landing/home-v2/services/casefile/**`, `lib/cases/**`, `useServicesStageScroll`, `lib/services-ring/{ringMath,ringProgressRef}.ts`, `ServicesCardRing`, `CorridorArmillary`, `services.css`, `app/(marketing)/page.tsx`, `lib/rail-manifest/entries.ts`
**Supersedes:** ADR-054 on PLACEMENT — its content model (`lib/cases/`) and confidentiality envelope survive unchanged; its station, its parse-time generator and its reveal controller do not.
**Related:** ADR-029/050 (the card ring this now waits behind), ADR-044 (the masthead whose reveal protocol and beat it borrows), ADR-047 (the `#about` deck seam this must not disturb), ADR-030 §6 (the ambient gate/envelope coincidence), ADR-048 (editorial band), ADR-008 (compositing)

## Context

The corridor's epilogue makes a claim — **"EVERYONE IS RACING TO BUILD
THIS CAPABILITY."** (`CorridorStationHeaders.tsx`) — and then handed
straight to the offer. The evidence for it sat at `#proof`, four stations
later, after `#about`. The reader met the price before the proof.

ADR-054 put the case in the right form and the wrong place. It was also a
500svh scroll essay telling one client's story in the same three verbs the
corridor had just spent four viewports on, with no room for a second
client and no way to show that Loop is _several_ bodies of work rather
than one narrative.

`/test/field-log-lab` (built and judged 2026-07-28) is the answer: one
viewport, a client tab strip, a terminal directory whose rows swap an
evidence panel. Owner's call — it moves to the **top of `#services`**,
over the parked brandmark, and the card ring waits until it has been
scrolled past.

**The binding constraint:** the corridor → services scroll choreography
does not change. The dissipate clock, the dock, the sphere handoff, the
ambient and the brandmark shrink stay byte-identical. What changes is only
_what lights up_ when you land, and _when_.

## Decision

### The funnel

```
hero → corridor (thesis + the Arc) → services → about → practice → contact
                                     └ casefile ┘└ ring ┘
```

`#proof` is removed via `CORRIDOR_REPLACED_STATIONS`, which also strips
every `href="#proof"` anchor — so the hero and intelligence-layer CTAs
were retargeted to `#services` **first**, or the parse would have deleted
the hero's primary button.

### The runway split — the load-bearing idea

Two clocks drive `#services` and they are not interchangeable:

| clock                              | keyed to                   | saturates         |
| ---------------------------------- | -------------------------- | ----------------- |
| `--corridor-dissipate`             | `#services.top` over 1.6vh | ≈ runway `p 0.14` |
| `servicesRingProgressRef.progress` | the runway rect            | `p 1.0`           |

**The card ring's visibility is entirely on the first clock**
(`entranceEnvelope(dissipate, i)` → `env.opacity` → `master` →
`cardGroup.visible`), which is done ~14 % into the runway. Retuning
`RING_ENTRANCE_WINDOWS` can therefore buy at most 0.14 of runway and
cannot express "scroll past a panel". The delay has to come from the
runway rect.

So the runway GROWS by the casefile's dwell (`--svc-proof-runway`,
240svh) and `splitServicesRunway` (`ringMath.ts`) re-derives the ring's
progress over what is left:

```
proofP = scrolled / proofPx
ringP  = (scrolled − proofPx) / (travel − proofPx)
```

`ringP` therefore spans **exactly the travel it spanned before**, so
`RING_ARRIVAL_FRAC`, `RING_EXIT_START`, `exitProgressForRunway`,
`ringIndexForProgress` and the ADR-047 `#about` deck seam are untouched.
Widening the dwell lengthens the page; it can never re-time a card. With
the flag off the function is the identity — that identity is the assertion
in `tests/lib/services-ring-math.test.ts`.

### Two new channels, one existing channel gated

`useServicesStageScroll` gains `--svc-proof-in` and `--svc-proof-out`.

Arrival rides the DISSIPATE — the brandmark's own centering clock — on its
own `PROOF_GATE_*` band (not `CONTENT_IN_*`, which also times the services
copy). The panels assemble WITH the mark as it moves to centre, each
travelling in from its own dimension. Owner supersession, 2026-07-28: an
earlier cut delayed arrival onto runway travel because a static fade-up
overlapped the epilogue signal's exit (`SIGNAL_OUT` = [0.86, 0.99], the
same clock) and read as the two fighting; with directional travel the
overlap IS the choreography — the elements arrive out of the same motion
that carries the previous centre away — so the runway-travel arrival factor
was removed again. Departure and the release ramp ride `proofP`.

The release multiplies `--svc-content-in`, which delays the masthead, the
plate cluster, the designation layer, the orbit draw-on and the scan
interface **together**, with no new consumer and no new listener.

The same release is published on `servicesRingProgressRef.proofRelease`
and consumed in two places: a term in `CorridorArmillary`'s
`orbitExitGetter` (the structural rings fade), and — for the CARDS — the
ENTRANCE CLOCK: `ringEntranceClock` = smoothed dissipate × release, fed as
the ring's `dissipateGetter`. A first cut multiplied the release into a
`masterOpacityGetter` instead, which lit the cards in their parked pose — a
crossfade; gating the clock holds the entrance envelope at its start (cards
off-stage, full travel offsets) through the dwell and then replays the
ADR-029 directional fly-in across the release ramp (owner, 2026-07-28:
"moving instead of a crossfade"). The anchor park gate and the hit-area
publish gate read the same clock, so no click targets can publish over the
casefile — with no separate opacity gate to keep in sync.

### The surface

`components/landing/home-v2/services/casefile/`, mounted FIRST in
`.services-stage__items` (ahead of the masthead, so the mobile accordion
flow puts the proof above the offer there too). Seated exactly as
`.svc-dossier` is: `position: absolute; inset: 0; z-index: 6;
pointer-events: none`, with only the tabs and the directory rows opting
back in. That last rule is not stylistic — `.svc-ring-hits__hit` sits at
z 4, so a `pointer-events: auto` full-bleed host at z 6 would silently
swallow every card click once the ring arrives.

Its geometry hangs off the LIVE HUD rail box, so the two section rules
land on the rail's own 13-tick ladder (tick 2 and the bearing-5 major).
The connection grammar is the corridor caption card's reticle vocabulary
(`.home-v2-reticle__cross`) — dotted crosses on one diagonal, dashed runs
instead of solid hairlines — so the casefile reads as the same instrument
as the corridor it follows. Judged as variant E at `/test/field-log-lab`,
which stays on disk as the look-dev harness.

Reveal is the ADR-044 protocol verbatim: the `--svc-proof-in` clock read
through a MutationObserver, AND a park gate, because the clock alone
crosses its threshold while the sticky stage is still travelling. The
decode is destructive, so it is also gated on `document.visibilityState`
and force-settles on hide — rAF stops in a hidden document, and an
un-gated decode strands every line blank.

### Arrival is per-panel (TERMINAL POWER-ON)

The casefile does not fade in as a block. Each panel strikes on separately,
in the reading order the owner named — chrome and registration frame first
so the instrument exists before content fills it, then title + paragraph,
the folder structure, the visualization, the numbers.

The recipe is `#about`'s live copy reveal (`about-stage.css`) applied to
panels instead of lines: three piecewise `clamp()` ramps off
`--svc-proof-in`, net curve `0 → 0.62 → 0.12 → 1` — it hits, drops out,
settles. Each panel carries an inline `--ci-off` and `--ci` renormalizes
past it, which is what staggers them. Plain scrubbed math, so it is
reversible, adds no writer and no keyframes.

Each panel also TRAVELS in from its own dimension (`--fl-dx`/`--fl-dy` —
left column from the left, visualization from the right, numbers from
below, chrome from above), the ring's `RING_ENTRANCE_DIRECTIONS` idea in
DOM form; the travel term is `× (1 − --ci)` so it is exactly 0 at rest. On
top of it rides a 2.5px lateral tear carried by `(g1 − g2)`, which
is exactly 0 once the dropout catches up — the flicker must never become
travel, because these zones are absolutely positioned against the rail's
tick ladder. The hairline rules and the split take the flicker without the
tear, where a lateral shift would read as a break rather than a glitch.

DEPARTURE stays a whole-plane fade on `--svc-proof-out`: the casefile
assembles like an instrument and leaves like a page being turned.
**Superseded by Update 1 — the casefile now folds shut.**

### The corner readout names the beat

Printing "SERVICES" while someone reads the proof names a section they have
not reached. `READOUT_SECTIONS` gains a `proof` row seated immediately
before `services`, and `sectionReadout(idx, proofOwns)` picks between them.

The row is deliberately NOT a `MANIFEST_ENTRIES` entry: the casefile shares
one DOM section and one rail detent with the offer, so an entry would break
the drift guard that pins station entries 1:1 against the parsed DOM. And
`proofOwns` is a PARAMETER, not a read inside the module, so `sectionReadout`
stays pure and index-addressable — every other caller keeps the
single-argument form and gets the offer's row.

`useActiveSection` supplies the flag from `proofRelease` (< 0.5), not
`proofPresence`: the release is "who owns this beat", where presence is a
painted-opacity envelope that would make the corner flicker with the panel's
own fade. Its resting value is 1, so an unwritten ref, flag-off, mobile and
reduced motion all fall through to "SERVICES" with no branch. The readout
turns over across the deliberately empty stage between the casefile leaving
and the offer arriving — nothing on screen contradicts it. The journey is
06 rows again.

### Content

`CaseCasefile` on `CaseDef`. `lib/cases/types.ts` keeps ZERO imports, so
the tool strip stores ids and the renderer resolves them against
`PROJECT_CASES`. The beats and the casefile share their plates through
hoisted consts in the content module rather than restating them — a
registry test asserts the row arrays are reference-equal, which is what
stops the two surfaces drifting.

One case ships. The tab strip is derived from `CASES`, so adding a second
lights up a second tab with no component change; a dim `+ Archive` marks
it as a series. No placeholder clients on a public page.

## Consequences

- The ambient kill retargets to `#practice`, which occupies the SAME
  scroll position `#proof` did — the gate and the envelope still read one
  rect, so the ADR-030 §6 coincidence holds by construction.
- The corner readout renumbers 06 → 05.
- `lib/v7-parse/proofStation.ts` and `ProofRevealController` are DELETED
  (git history is the archive). `ParseOptions.fillSlots` survives as a
  general parse capability with no caller.
- The `.proof__*` block in `landing.css` is kept: `/test/proof-highlight-lab`
  still renders those classes.
- The page grows ~240svh. `#proof` was ~500svh, so it is net shorter.

## Verification

`splitServicesRunway`'s flag-off identity and its handover are unit-pinned.
`tests/visual/services-ring-smoke.spec.ts` gains a case asserting the
casefile holds, the directory rows work while pinned, and NO hit anchors
publish during the dwell — then that the ring takes over after it.

The "scroll movements did not change" guarantee was measured, not
asserted: a scripted scroll pass captured `--corridor-dissipate` and
`--svc-arrive` as a function of the `#services` rect BEFORE the change and
compared after. Comparing at equal scroll `y` is the wrong test —
`window.scrollTo` lands within ~0.2vh on this page, in the baseline too —
so the invariant is that the curve is the same function of that rect.

## Pitfalls

- **Do not delay the ring with `RING_ENTRANCE_WINDOWS`.** It rides a clock
  that has already saturated. The runway split is the only seam that works.
- **Do not give the casefile host `pointer-events: auto`.** See above.
- **Do not add `--hud-content-inset` to the casefile's band offset.** The
  stage box is already inset by it; `--rail-inset` alone is the band.
- **Keep the ambient cover selector (`home-v2.css`) and
  `useCorridorExitScroll`'s `nextStation` on the SAME station.** Splitting
  them hard-cuts the canvas at that station's top edge — recorded three
  times now.

---

## Update 1 — the casefile FOLDS, and the offer answers it (2026-07-29, owner)

Supersedes "DEPARTURE stays a whole-plane fade" above, and reverses this
ADR's decision to keep the departure and the release strictly sequential.

**The complaint.** Scrolling from the proof into the offer, the services
elements "start appearing out of nowhere — there's no nice transition
between the two sections". Both halves were at fault and both were the
same mistake in opposite directions: the casefile left as ONE object (a
single `opacity: calc(1 - var(--svc-proof-out))` on the plane) and the
offer arrived as ONE object (every `--svc-content-in` consumer a flat
simultaneous opacity multiply), with a deliberate dead beat between them.
Two blocks switching over cannot read as a transition no matter how they
are timed. The ask named the fix by analogy: the corridor caption card's
centre-out aperture unfold (`.home-v2-reticle`, home-v2.css), run backwards.

**The casefile folds inward.** Two channels, both scrubbed `clamp()` off
`--svc-proof-out` — no keyframes, no writer, reversible, and the same
grammar as the arrival it undoes:

- _Per-panel, LIFO._ `--co-off` is derived in CSS as `0.56 − --ci-off`,
  the mirror of the arrival ladder, so the numbers and the telemetry line
  leave first and the chrome and the registration frame leave last — the
  instrument outlives its content exactly as it preceded it. No panel
  gains a second inline var.
- _Travel continues past rest._ Subtracting `--fl-dx × --co × 0.6` sends
  each panel on INWARD along the dimension it arrived from: left column
  drifts right, panel column left, chrome sinks, numbers rise. 13–29px on
  the 22–48px arrival offsets. Both travel terms are 0 at rest, so the
  tick-ladder alignment law of the arrival extends to the departure
  unchanged.
- _The plane irises shut._ `clip-path: inset(-30px calc(--fl-iris * 50.5%)
…)` closes left and right toward a centre vertical slit — the exact
  reverse of the caption card's aperture, scrubbed rather than
  transitioned (the hero curtain is the precedent for a scrubbed clip).
  Opacity is demoted to a tail that dims the last sliver.

The iris TRAILS the panels: it opens at `--svc-proof-out` 0.5, not 0.35.
At 0.35 the crop reached still-legible copy and sliced the left column
mid-word at 86 % opacity, which reads as a clipping bug rather than a
fold. Measured, both times.

**The offer assembles on a ladder.** `--sc` is `--svc-content-in`
renormalized past a per-element `--sc-off` — the arrival's `--ci` idiom
applied to the far side of the seam. Rungs: orbit draw-on (0) → dotted
ring / nodes / cartography (0.10) → cards (0.20) → plate cluster (0.28) →
`.svc-stack` (0.30) → scan interface (0.35) → designations (0.45). The
frame arrives first and the callouts last, answering the casefile's chrome
leaving last. No new channel, no second gate: everything still hangs off
the one release ramp. Consumers registered to the WebGL mark take a rung
but no travel — their connectors anchor to projected rects and would
visibly de-register if they drifted. The masthead is not on the ladder at
all; its copy stays decode-only (2026-07-27), and the decode firing while
the casefile is still folding IS the sync.

The WebGL rings get the same treatment through `orbitReleaseLead()` —
`proofRelease` renormalized over its first 55 % and smootherstepped, so
the armature is fully drawn just before the earliest card entrance window
(0.58) opens and the cards fly INTO a frame that already exists.

**The release owns the whole dwell, and the dwell is short.**
`PROOF_RELEASE` [0, 1] with `PROOF_OUT` 0.13 → 0.66 inside it, on a dwell
cut 2.8 → **1.2** viewports.

This is the third and load-bearing retune (owner: "when you're in the proof
section and you scroll, the transition should immediately start — right
now, if you scroll, nothing really happens"). Measurement settled it:
`--svc-proof-in` is at 0.944 AT the runway top and 0.998 eighty pixels
past it, because the panels assemble on the DISSIPATE during the approach.
The casefile is fully built before the stage even pins. Everything the
runway held ahead of the release was therefore dead scroll — 1550px, 1.7
viewports of nothing, on the previous tuning.

The dwell was never a reading window and did not need to be one: the stage
is PINNED, so a reader who wants to read simply stops scrolling. Scroll
distance buys choreography, not patience. Cutting the runway to 1.2 and
letting the release span all of it gives the ramp MORE scroll in absolute
pixels (~1080 at a 900px viewport, against ~958) on a runway less than half
as long — the page loses ~1440px and the first scroll gets an answer.

`smootherstep`'s flat first third IS the settle hold: measured, the fold
opens ~200px past the pin, about two wheel notches. Do not add an explicit
hold in front of the release — that is the dead zone returning.

⚠ **Two thresholds are READINGS ON THE RELEASE RAMP** and must be re-checked
against its shape, or they silently name a different scroll moment: the
corner readout's `PROOF_OWNS_BELOW` (0.75) and the masthead's `REVEAL_AT`
(0.5). Both survived this reshape unchanged, and not by luck — the fold's
new edges were CHOSEN as the proofP where the release reads ≈0.016 and
≈0.78, the two crossings the previous tuning had been validated at. Place
the fold by value on the ramp and the derived thresholds come along; place
it by eye and they do not.

⚠ **Judge this band by the VALUES at the crossing, never by the edges.**
The first attempt used 0.60/0.82 against 0.70/1.0 — the windows overlapped
on paper, but `smootherstep` is nearly flat across its first third, so at
the fold's end the release had contributed 0.06. Overlapping edges prove
nothing. The smoke spec samples the crossing for this reason.

Second-order effects, all checked: the ring's visible fly-in stretches
from ~52px of scroll to ~185px (the release span is its entrance clock);
`splitServicesRunway` keeps every ring constant and the ADR-047 `#about`
seam byte-identical — `ringTravel` is `500svh − vh` whatever the dwell is —
so resizing the dwell only resizes the page.

---

## Update 2 — the surface decluttered, and the iris regression (2026-07-29, owner)

Four changes in one pass:

**The header chrome trio is gone.** `.fl-case__label` / `__sys` / `__code`
("FLG / Field log · 00" / "TF // Field log — /expeditions/" /
"Log TF-24 · On record") are deleted — the band above the tab strip stays
clean and the tab row is the instrument's first line. The tabs wrapper is
now the arrival ladder's first rung (`--ci-off` 0.07, so also the LAST to
leave on the departure LIFO); the `0.56` mirror constant comes from the
foot and is unaffected. The decode target list drops 5 → 2 (brief title +
class line). `logCode`/`state` stay consumed by the foot's telemetry —
no orphaned data. `.fl-desig` and `.fl-diamond` survive (other users).

**The `Log.001 >` operator quote is gone**, from the JSX, the sheet, and
the content model (`CaseCasefile.logEntry` removed from `types.ts` and
`loop-earplugs.ts`). The quote grammar survives on the BEATS
(`CaseBeat.quote`) — a different field, still pinned by the registry test.

**The iris was amputating the corner crosses — a regression from
Update 1's fold.** The reticles centre on the band edges via a −9.5px
margin, so half of each paints OUTSIDE `.fl-case`'s border box, and
`inset(… 0%)` at rest cut exactly that half. The law that emerged: **every
inset of the iris must rest NEGATIVE, because the registration marks
overhang the reference box.** The horizontal insets now rest at −12px
(half-arm + AA) and travel `calc(var(--fl-iris) * (50.5% + 12px) - 12px)`
— same 50.5 % full close, same smoke-spec parse (the serialized
`calc(K% + Mpx)` still leads with `K = iris × 50.5`).

**Measured type pass.** `--fl-copy` factor 0.82 → 0.9 (brief ≈14.9px at
1440, ≈13.5 at 1280, ≈16.2 at 1680 — re-measured against the tick-bound
brief height at all three, zero clipping with the log line gone);
directory rows 9.5 → 10.5px; every sub-8.5px UI label lifted to the house
8.5px small-mono floor (tabs ix, dir head, row meta, readout keys, source,
plate foot, reg tags, tool tag/state). Excluded on purpose: the signal
chart's SVG-internal stamps (drawn-artifact internals, not UI copy) and
everything already at or above the floor.

---

## Update 3 — the reverse handoff: the re-arm floor mirrors the strike (2026-07-29, owner)

The complaint: "when you scroll back from the services section to the proof
section, the services title remains on the screen for a bit too long."
Measured at a 900px viewport: the title struck (forward) at y 8980 and did
not blank (reverse) until y 8581 — 399px, more than a third of the dwell,
with the resolved title printed over a casefile already 90 %+ reassembled
beneath it.

**The root cause is that this ADR split the reverse path in two and only
one half had an owner.** The masthead's re-arm had two triggers, built
pre-056: the unpark observer (blank the moment the stage unpins upward)
and a `REARM_BELOW` clock floor at a flat 0.05 — sized for the lab replay
path, with the park observer assumed to fire first in production. The
casefile's dwell broke that assumption: the stage stays PINNED across the
entire dwell, so backing out of the offer into the casefile never unparks,
the observer never fires, and the 0.05 floor silently became the governing
production threshold — 0.45 clock units (≈400px on the release ramp's
midband slope) below the strike.

**The fix is a derived floor:** `REARM_BELOW = REVEAL_AT −
REARM_HYSTERESIS` with the hysteresis at 0.08 — ~46px of scroll at the
ramp's peak slope, wide enough that a momentum overshoot cannot re-trigger
the ~0.9s decode, tight enough that the band reads as switching off where
it switched on. Re-measured: blank at y 8900, one 40px probe step after
the strike point, against 399px before. The forward path is byte-identical
(the floor only matters with `state !== "armed"`, which forward traversal
never combines with a sub-threshold clock).

The law, and why the constant is an expression rather than a number:
**a floor that exists to mirror a strike threshold must be DERIVED from
it.** An absolute floor near a derived threshold (`REVEAL_AT` is a reading
on the release ramp — see Update 1's warning) stops mirroring silently on
the next ramp retune. The smoke spec now drives the reverse crossing —
back from ring territory into dwell 0.40, where the clock reads ≈0.32 —
and asserts the masthead is re-armed (blanked) while the casefile is
live again, so the next regression fails a test instead of a scroll-feel
review.

## Update 4 — the transition window pays for itself (2026-07-29, perf pass)

The owner's report: the corridor-exit → casefile transition "lags a lot",
localhost and Vercel alike. Measured (Playwright + CDP, M2, DPR 2, real
scroll drive): the dissipate window ran **89.5ms/frame average, p95
236ms, 72% of wall time in long tasks** against ~57ms mid-corridor —
main thread saturated by style recalc (~6 recalcs/frame at 8–9ms:
whole-tree invalidation) plus per-frame forced layouts, GPU loaded by
additive overdraw. After the pass: **39.4ms avg, p95 48.5ms, max 52ms,
9% long-task share** (prod build; dwell 75.7 → 24.0ms, corridor-mid
56.7 → 19.9ms). No frame in the journey now exceeds 52ms — the p95
spikes (236–632ms) are gone entirely. Zero visual change, verified by
screenshot parity forward and reverse plus the smoke suite at its known
baseline.

What this update pins for THIS surface (the corridor-side halves live in
their own files' comments — the gyro's object-scale scatter, the
`corridorDissipateRef` transport, the ticker's geometric gate):

- **The proof channels live on the casefile host.** `--svc-proof-in/-out`
  are written on `.fl-case` itself, never the stage: their only
  consumers are this sheet and the casefile controller, and stage-hosted
  writes invalidated the stage's ~350-node computed-style tree every
  scroll frame of the dwell. `data-proof-live` STAYS on the stage (CSS
  selectors + the smoke key off it there). The controller reads and
  observes its own root — which also stops its observer waking on
  `--svc-content-in`/`--svc-arrive` writes, and the masthead's on proof
  writes.
- **The panels are composited for the beat.** A `data-proof-live`-scoped
  `will-change: transform, opacity` on `[data-fl-panel]` (+ `clip-path,
opacity` on `.fl-case` for the iris) makes the gradient reticles,
  text-shadow title and the 31-node signal SVG raster once per state
  instead of once per frame — the single largest paint win of the pass.
  The layers exist exactly while the attribute does; the mobile/PRM
  blocks reset to `auto`. Do not "clean up" the promotion into an
  unscoped rule, and do not add `contain: paint` (the reticles overhang
  the border box — the Update 2 amputation).
- **The park gate is a cached boolean, not a rect read.** Both reveal
  controllers' `isParked()` now return the state their own park
  IntersectionObserver maintains; the `getBoundingClientRect()` survives
  only as the pre-first-delivery fallback. The old per-call read ran
  inside the style MutationObserver — a forced layout against dirty
  styles on every frame of the armed window (= the entire transition).
- **The ring seam is warmed and delta-gated.** The baked card textures
  (~24MB) upload one-per-rAF during corridor idle and the programs link
  once via `compileAsync` — nothing becomes visible, `ringEntranceClock`
  is untouched, the off-stage contract holds; the entrance hitch (first
  upload + first link in one frame, ~60px after dissipate saturation)
  is gone. `setRingAnchors` carries the `CorridorArmillary` epsilon
  gate it was missing, and both anchor subscribers rebase against a
  cached origin instead of rect-reading during render.
- **The write deadband is 0.0025** on `--svc-content-in` and the proof
  channels (<0.3% of an opacity ramp, <0.15px of travel — invisible;
  the CSS clamps saturate before the vars' terminal values, so the
  zero-at-rest law holds structurally). `--svc-exit` keeps 0.001.
- **ADR-038 cannot govern this window, by design.** The governor's EMA
  (α 0.1) + 1200ms sustain + 1500ms cooldown need seconds of sustained
  jank; the dwell is 1.2 viewports and frames >200ms are discarded from
  the EMA. The fast path HAS to carry the transition — which is why the
  fixes above are structural rather than adaptive. (Recorded in ADR-038
  as an addendum; wiring the gyro counts into the ladder remains a
  wave-2 option for pre-degraded devices only.)

## Update 5 — the casefile shows the work (2026-07-30, owner)

Every one of the seven directory rows resolved to a TEXT plate: a chart, two
logs, a registry, a register, a readout block, one tool strip. The case
_asserted_ the work. Two rows now **show** it — the paid-social studio as
three ads, the above-the-line films as two players — and the brief column
finally names which project you are looking at.

### Two plate kinds, not a rebuild

`CaseTrackVisual` gains `stills` (`readonly CaseImage[]`) and `films`
(`readonly CaseFilm[]`, a new zero-import interface). This is the extension
point the surface was already built around: `TrackVisual`'s `never`
exhaustiveness check makes a new kind a **compile error until a branch
exists**, and `TrackPanel`'s `key={slug}-{trackId}` guarantees a fresh
subtree, so no plate kind ever reconciles into another. Nothing about the
clocks, the arrival ladder, the fold or the iris was touched.

**Stills fit by HEIGHT, in natural colour.** The plate rect is short and wide
(690 × 240 at 1440×800) and the ads are 4:5, so cover-cropping would cut the
composition the ad was built around. `aspect-ratio: 4/5; height: 100%` with a
centred row shows them whole. The `tools` plate's duotone
(`grayscale(1) sepia(.35)…`) is deliberately NOT applied — that recipe is for
dark UI captures sitting on a photo bar; this is the creative itself. Same
split `.claude/rules/arcs.md` already states: content media renders in
natural colour, the gold is chrome.

**Films are poster-first: no `<video>` element exists until a click.** This is
stricter than `ArcMediaSection` (which mounts the element with
`preload="none"`) and deliberately so — a mounted media element costs a
compositor layer and a decoder inside a beat whose layer budget Update 4
counted at ~14, for a row most visitors never open. The tile is a
`next/image` poster in a `<button>`; the click is the play intent, so the
element arrives already playing. It carries **no `poster` attribute** —
measured, that re-fetched the raw 93 kB JPEG the optimizer had already served
as the tile.

**The element is torn down when the plane folds.** A `MutationObserver` on
`.services-stage`'s `data-proof-live` — the same attribute the sheet gates its
`will-change` on — drops it. Without this a film keeps decoding audio and
video behind a closed iris. Do NOT poll `--svc-proof-out` in rAF: Update 4
removed the per-frame reads on purpose.

**`.fl-film` is the THIRD and last pointer-events opt-in**, after
`.fl-tabs__tab` and `.fl-row`. Safe only because `.fl-case` is
`visibility: hidden` until `data-proof-live` and hidden subtrees do not
hit-test — that is what keeps the departed casefile from swallowing ring-card
clicks (smoke test D).

### Measured, on the prod build

|                              | bytes                                                   |
| ---------------------------- | ------------------------------------------------------- |
| open `01_AI-FLUENCY-STUDIO/` | **23.6 kB** — three 256w WebP off 432 kB of source JPEG |
| open `02_AI-ABOVE-THE-LINE/` | **19.1 kB** — two posters, **0 video requests**         |
| click play                   | 12.5 MB, the mp4, and only then                         |
| after the fold               | `.fl-film__video` count **0**                           |

No prefetch, by design: `TrackPanel` mounts only the selected track's plate
and `report` is the default, so a visitor who never opens these rows pays
nothing. The corridor-entry budget is already spent on ~130 kB of case-card
WebP.

### The directory geometry — a live bug, found while measuring

`.fl-dir` spans one third of the rail height. At 1440×800 that is 190px, and
seven rows needed 204 — **`METRICS.DAT` was already being clipped by 14.3px
on the most common laptop viewport there is.** Eight rows needed 231.

The brief/directory seam therefore moves **t7 → t6** (a tick, not a nudge —
`.fl-rule--brief`, `.fl-brief`'s height and `.fl-dir`'s top all read the same
var, so the seam stays one line), row padding tightens to
`clamp(3px, 0.45svh, 7px)`, and the head's `padding-bottom` goes 8 → 6. The
owner's 10.5px row type from Update 2 is untouched — density came out of the
padding, never the type.

That reclaims 50px on the directory side and costs it on the brief side, so
the brief body was trimmed from five lines to three. Verified clip-free at
**1280×720, 1440×800 and 1920×1080**.

### The retired row, stated plainly

`03_AI-VIDEO/` is gone. Its dubbing/localization pipeline and **"30+ markets"
reach leave the site with this change** — nothing else on the landing carries
that claim. Its `01 world-first AI film` readout is also gone, which is the
right outcome: it would have contradicted `2 FILMS` two rows above, and the
owner's new copy already softens the claim to "one of the first brands to air
them". Re-add as a row when there is a plate worth giving it.

> **Corrected 2026-07-31 (see Update 9).** "30+ markets" is BACK on the page.
> The tool gallery renders Babylon's capabilities, and its first tile is
> literally `30+ markets`. That is a better home for the claim than the
> retired log — it now sits on the tool that does the localisation — but the
> paragraph above stood for a day reading as settled fact. It was not.

### Row order

`01_AI-FLUENCY-STUDIO/` · `02_AI-ABOVE-THE-LINE/` · `03_SOFTWARE-FOR-FEW/` ·
`04_WORKSHOP-ROLLOUT/` · `05_SKILL-LAYER/` · `GOVERNANCE.MD` · `METRICS.DAT` ·
`00_MISSION-REPORT.LOG`. (Renamed 2026-07-31 — see the correspondence rule
in Update 9's fourth pass.)

**Track `id`s did not change** — only `file`, `meta` and array position. The
registry test pins plate reference-equality to `t.id === "transformation"`,
and `Directory` builds DOM ids from them.

### Also

- `CaseTrack.project` — the human name, shown under the client name where
  `Brief — expedition NN` used to be (it named the format, not the work).
  Deliberately NOT a `[data-fl-text]` decode target: the reveal effect caches
  those nodes once per client (dep `[def.slug]`), so a track-reactive target
  would go stale on the first row switch. Pinned ≤24 chars — the brief column
  is height-boxed and a wrap reflows everything under it.
- `CaseTrack.stamp` — the foot telemetry becomes per-row
  (`◆ 01 · Build · BLD-01 · On record`), falling back to the standing
  `00 · Field log · TF-24` line when absent.
- **The registry test's asset-path allowlist now walks `casefile.tracks`, not
  just `beats`** — track media was entirely unguarded before this.
- The three stills and the Smug Owl film are the SAME files
  `/arcs/ai-keynote` serves, with the same alt text. What does not come across
  is the arc's per-ad spend / order value / ROAS: that page is a client deck,
  this is the public landing, and the envelope bans currency outright. The
  second film (DJ Neighbour) was encoded from the master with
  `npm run video:optimize --keep-audio` (11.4 MB) — audio matters when the
  copy says "CD through sound".
- Frame probe after the change, prod build: corridor-mid 16.9 ·
  dissipate-approach 24.4 (p95 33.6) · casefile-dwell 20.0 · ring-zone 17.0.
  No segment regressed. Note the probe never opens a media row, so it
  measures the structural change only — the media cost is the table above.

## Update 6 — the work leads, the bed recedes (2026-07-30, owner)

Three owner calls on the surface Update 5 shipped.

### 1. The studio is row one; the report closes the file

Order is the directory, and **the first row is what the casefile opens on** —
so the default panel is now the strongest single piece of evidence rather
than a summary of it. `00_MISSION-REPORT.LOG` moves to the bottom, where a
summary belongs; its `00_` keeps it reading as the master log rather than a
sixth project.

Cost, measured: the three studio stills (23.6 kB) now load at PAGE LOAD
instead of on approach, because the default plate mounts with the casefile.
That is ~6 % of what the five service photos already cost on the same page,
and it means the panel is ready when the visitor arrives instead of popping.
Accepted deliberately. The films still cost nothing until their row is
opened, and the mp4s nothing until a click.

### 2. Frosted glass on the plates — gated on SETTLED, not LIVE

The plates float over a live WebGL bed and the 0.4 scrim was not enough
separation once they carried photography. They now take a `backdrop-filter`.
An opaque cover is still forbidden — the iris exists to reveal that bed.

**The gate is the whole story.** `backdrop-filter` re-snapshots its backdrop
every frame the element moves, and `.fl-panel__viz` is a `[data-fl-panel]`:
it TRANSLATES through the entire arrival, which happens inside
dissipate-approach — already the GPU-bound outlier. Measured on the prod
build, `dissipate-approach` avg / share of frames over 33 ms:

|                                                 | avg         | >33 ms  |
| ----------------------------------------------- | ----------- | ------- |
| no frost                                        | 22.2 ms     | 3 %     |
| frost, `[data-proof-live]`, blur 9px + saturate | 24.6 ms     | 13 %    |
| frost, `[data-proof-live]`, blur 6px            | 25.9 ms     | 16 %    |
| **frost, `[data-proof-settled]`, blur 7px**     | **21.8 ms** | **4 %** |

Two things that reads: **radius is not the driver, the snapshot is** (6px
measured worse than 9px — that spread is the noise floor of "a blur is
running at all"), and gating it correctly is worth more than tuning it.

So the hook publishes a second attribute, `data-proof-settled`, at
`PROOF_SETTLED_AT = 0.06` of the dwell — ~80 px in, past the travel
(`--svc-proof-in` is 0.944 at the runway top and 0.998 eighty pixels later)
and still inside `smootherstep`'s flat first third, the settle hold, where
nothing else is moving and switching a backdrop on cannot read as a jump.
The blur is then paid in `casefile-dwell` (18.2 vs 17.3 ms), which has the
headroom. `data-proof-live` is unchanged and still owns `visibility`,
`will-change` and the smoke's assertions — **do not merge the two gates**,
they exist at different times on purpose.

### 3. The surface bed was never dimmed

Owner: _"our wireframe brandmark needs to be a bit more dimmed in this
section and then increase back again when you scroll to the services
section."_ The mechanism already existed and rested on `proofPresence` — but
only for two of the three layers. `PROOF_MARK_DIM` dimmed the mark and
`PROOF_INTERIOR_DIM` the interior haze, while the SURFACE bed (dotted shell,
globe dots, equator — the sparse layer that fills the frame from inside the
sphere for the whole services section) ran at its full ambient floor. The
loudest layer behind the copy was the one nothing touched.

- `PROOF_MARK_DIM` 0.45 → **0.62**
- `PROOF_INTERIOR_DIM` 0.55 → **0.70**
- `PROOF_SURFACE_DIM` **0.55, new** — `surfaceMul` now takes the same
  `proofPresence` factor as the other two.

All three are identity at `proofPresence` 0, so the corridor, the offer, the
inert path and flag-off are byte-identical, and the bed comes back to full
strength exactly as the offer arrives — which is the second half of what was
asked for, and was already free once the factor existed.

Second-order benefit: with the bed at 45 % behind the plate there is much
less left to blur, which is part of why 7px reads as enough.

## Update 7 — the client is named once (2026-07-30, owner)

The brief's display heading said `LOOP EARPLUGS.` while the tab strip
directly above it also said `LOOP EARPLUGS` — the biggest slot in the left
column spent on something already on screen. Owner: make the tab carry the
client at display size, and give the heading to the project.

- **`.fl-tabs__tab` 10px → `clamp(12px, 1.05vw, 15px)`**, tracking 0.2em →
  0.1em (0.2 was set for chrome and reads as a gap at 15px). The strip's
  height moves 34 → 44px through a new `--fl-tabs-h`, which `top` also
  reads, so the active tab's underline stays seated on tick 2 where
  `.fl-rule--section` runs. `.fl-tabs__ix` goes 8.5 → 9.5px — it must rise
  with the name but NOT 1:1, or the ordinal and the label read as one string.
- **`.fl-brief__title` now renders `track.project`** + the gold full stop.
  `.fl-brief__project` (the 10.5px gold line Update 5 added) is deleted — one
  slot, not two.
- **`CaseCasefile.title` is REMOVED.** It existed only to feed that heading;
  `tab` is the last client label and there is no dead field left behind.
- **The decode moved to the tab name.** It is per-CLIENT, which is exactly
  the granularity the reveal effect caches at (dep `[def.slug]`), so unlike
  the heading it can never go stale on a row switch — which is why the
  heading itself is deliberately NOT a `[data-fl-text]` target. Two targets
  still: tab name + class line.
- **`project` is pinned ≤20 chars** (was 24) and the heading is `nowrap`.
  At the 24px cap, 20 chars is ~290px against a ~340px column; the brief is
  height-boxed against tick 6, so a wrap would reflow everything under it.

Verified at 1280×720 / 1440×800 / 1920×1080: all eight headings swap on row
click, zero brief clip, zero title overflow, zero row clip, tab strip does
not overflow its band.

### A measurement caveat, recorded honestly

The frame probe was NOT conclusive for this change and should be re-run on a
cool machine before anyone quotes it. Across this session the rig degraded
monotonically — `corridor-mid`, which the casefile cannot touch, climbed
16.8 → 19.1 ms while builds and headless browsers ran back to back. A
same-session A/B measured `dissipate-approach` at 25.9 ms (HEAD) vs 28.2 and
27.6 ms (this change) against a control that moved +0.7 to +1.7 ms over the
same window, so roughly 1.5 ms is unattributed.

What argues against a real regression: **style recalc/s (0.74 vs 0.75) and
layout counts (190 vs 191) are identical between the two builds** — the
change adds no style or layout work, and it removes a DOM node. Everything
remains far inside the 39.4 ms wave-1 baseline. If a clean re-measure ever
does show a regression here, the first thing to look at is the decode target
moving into the tab strip (`--ci-off` 0.07, the earliest rung), since that is
the only behavioural addition in this update.

## Update 8 — the films open in a lightbox (2026-07-30, owner)

Owner: _"when you click on a video, it just shows a pop-up that shows the full
aspect ratio."_ Two problems, one root cause — the plate rect is a fixed short
band off the HUD rail, so two 16:9 films side by side land at ~310px. That is
a thumbnail, and the height constraint was also fighting the tile's own
aspect ratio and cropping the poster.

### The tile was cropped by a flex rule, not by `object-fit`

`.fl-filmcell__frame` carried `aspect-ratio: 16/9` AND `flex: 1 1 auto`
inside a height-constrained column. Growing to fill the column wins over the
ratio, so the box stopped being 16:9 and `cover` cut the frame. Now
`flex: 0 0 auto` — the ratio governs and the cell top-aligns. Measured:
310 x 174, ratio **1.778**, exactly 16:9, and it still fits the plate.

The separate `__frame` wrapper is gone: **the tile IS the button.** `.fl-film`
carries the box, the border, the backdrop and the pointer opt-in. (Removing
the wrapper without moving its rules left the button `position: absolute`
with nothing to position against — caught by the layout probe, not by eye.)

### The overlay MUST portal to `document.body`

`.fl-case` carries the iris `clip-path`, a translating arrival ladder, and an
`overflow: hidden` plate. An overlay inside that subtree is clipped by all
three, and `position: fixed` does not rescue it — a clipped or transformed
ancestor becomes the containing block. `createPortal(…, document.body)` is
the only thing that works here; it is not a style preference. Verified:
`parentElement === document.body`, `closest('.fl-case') === null`, and
`elementFromPoint` at the video's centre returns the video.

Grammar is ADR-006's focus overlay at landing scope — dashed border, the
mandated three-part shadow, radius 0, `modalFocusIn` on the CONTENT not the
backdrop. The vars and keyframes are re-declared in `casefile.css` because
the originals live in `.astrogation`, which the marketing route never loads.

### `overflow: hidden` is NOT a scroll lock — measured

The obvious lock failed the test: with `document.documentElement.style
.overflow = "hidden"` the page still scrolled **739px**. It suppresses the
scrollbar, not scrolling. What actually holds it is non-passive `wheel` and
`touchmove` listeners that `preventDefault`, live only while the dialog is
open. Keys are deliberately left alone — focus is inside the dialog, where
space and arrows belong to the video's controls. `scrollY` is never
reassigned (no position:fixed swap), so every corridor clock resumes exactly
where it was.

The `data-proof-live` observer stays as the safety net: if anything scrolls
the stage out from under an open film, the lightbox goes with it rather than
leaving a film playing over a departed surface.

### Focus restore lost a race

`close()` focused the trigger synchronously, and React tore the portal down
on the following commit — removing the focused node hands focus to `<body>`,
undoing the restore. Measured as `activeElement.className === ""`. The
restore now runs in a `requestAnimationFrame`, after the unmount.

### Verified

Lightbox 1120 x 630 (ratio 1.778) and playing; wheel of 900px moves `scrollY`
0px and leaves it open; backdrop click and Escape both close, both restore
focus to the correct tile (`aria-label "Play DJ Neighbour · Loop ATL"`), both
clear the lock, and scroll resumes from the same position. Zero `<video>`
elements left in the document after close. verify 383/383,
services-ring-smoke 18 passed, no page errors.

## Update 9 — the tools row becomes a gallery (2026-07-31, owner)

`03_TOOLING/` was the last row still rendering as a list: four ~100x46
thumbnails with a name and a status word, too small to read, showing none of
the four capabilities that make each tool interesting — under a foot that
showed track-level numbers (`04 / 42 / Days → min`) saying nothing about any
particular tool. Owner: make it a gallery, give it a walkthrough button, and
make the bottom of the panel follow the tool in view.

Heading is now **“Software for few.”**, matching the Build beat's own
`title: { pre: "Software for", em: "few." }`. The row keeps its `03_TOOLING/`
filename — the row is a filename, the heading is the project.

### The selection is owned by `TrackPanel`

The structural change. The foot has to follow the tool, so the state lives at
the lowest node that sees both the plate and the foot: `TrackPanel` owns
`toolIdx`, `TrackVisual` forwards it to `ToolGallery` as a controlled prop,
and the foot derives its rows from `PROJECT_CASES[toolIdx]` rather than the
track. `TrackVisual` keeps its `never` guard — `tools` is simply its one
controlled branch. Reset is free: the panel is keyed `${slug}-${track.id}`
upstream, so a row change remounts on tool 01.

Per tool the foot now reads: the four **capabilities** as title + clamped
description, context rows `Mode / Team / Status`, and the tool's `shift`
sentence as the provenance line. Capability tiles are a separate list from
`.fl-readout` — a title and a line is not a figure and a label, and the
`data-wide` sizing exists for numbers.

**`Team` prints the DEPARTMENT only.** The full strings run to 38 chars
("Performance · Localization & Expansion"), three times what the register's
dotted leader can hold without wrapping. The discipline after the "·" is
already implied by the tagline in the gallery above.

### The lightbox is now shared

`MediaLightbox` is extracted from `FilmsPlate` and consumed by both. Its
portal-to-body, its scroll lock and its focus restore each took a measurement
to get right (Update 8), and a second hand-written copy would have
re-introduced both bugs. `useCloseOnCasefileFold` moved with it, taking a ref
inside the casefile rather than querying the document, because the overlay
itself is portalled out of that subtree.

### Assets

Four walkthroughs ported from the shards `/ai-operator` case set to
`public/videos/tools/`, with posters extracted (shards has none).

**crf 26 was the wrong encode.** It bought **3–5 %** — the sources were
already well compressed, so it was paying a generation of loss for nothing.
crf 30 buys **36 %** (22.2 MB → 13.9 MB) and holds up at 2× zoom on UI text,
which is the bar that matters for screen recordings. Checked before encoding
that the sources carry no audio — they don't, so unlike the ATL films there
was nothing for the script's default `-an` to strip.

No new screenshots: the committed `/project-cards/*.webp` are 1000px against
a ~509px render slot, and reusing them keeps each tool identical here and on
the WebGL card.

### The foot did not fit, and the fix is responsive

Measured, not guessed. At **1280×720** the four tiles ran **27px past** the
foot band and a 24-char title overran its ~140px column by **16px**.

- **Short viewports drop the DESCRIPTIONS, not the tiles**
  (`@media (max-height: 780px)`). Four capability titles still name what the
  tool does; a one-line clamp would have shown ~20 characters of a
  60-character sentence and read as a truncation bug.
- **Narrow viewports drop the title to the 8.5px floor with tighter
  tracking** (`@media (max-width: 1360px)`) — a width problem, not a height
  one.
- The tile title is `nowrap` + ellipsis and **pinned ≤24 chars**: a wrap
  pushes that tile's description a line below its three neighbours', which
  reads as a broken grid. Its tracking is 0.08em rather than the house
  0.14em — tightening type was the lever, because the alternative was
  trimming client copy to fit a column.

One title did have to give: `Briefing split orchestrator` (27) →
`Briefing splits`. Every sibling title is ≤20 and the description carries the
meaning. Verified clip-free at 1280×720 / 1440×800 / 1920×1080.

`.fl-tool` is the **fourth** pointer-events opt-in, after `.fl-tabs__tab`,
`.fl-row` and `.fl-film`.

### Test hardening

`PROJECT_CASES` renders client copy on the public landing but sits outside
`lib/cases/`, so the confidentiality scan never saw it. It is now scanned for
the same banned patterns, its asset paths go through the repo-rooted
allowlist, every tool is pinned to having a walkthrough, and the capability
copy is pinned to what the foot tiles hold.

### Measured, on a cool machine

corridor-mid **16.9** · dissipate-approach **22.1** (p95 31.5, 3 % >33 ms) ·
casefile-dwell **17.7** · ring-zone **16.8**. The control is at its
session best, so this is a trustworthy reading — and it retires the
uncertainty Update 7 recorded: `dissipate-approach` is exactly where the
un-frosted baseline was (22.2, 3 %). verify 385/385, services-ring-smoke 18
passed.

### Second pass, same day — legibility (owner)

_"The text in the bottom right panel is WAY too small… let's harmonise and
make sure everything is legible enough."_

**The type scale is the finding.** This sheet has two sizes and they mean
different things: **8.5px is the CHROME floor** (designations, leader keys,
meta) and **10.5px is the READING size** the owner set for the directory rows
on 2026-07-29. The first pass put capability copy — actual content — at 8.5.
That is the rule this scale now states out loud at the top of the tool-gallery
block, so the next person does not repeat it.

Now: tool tabs **11.5px**, plate brief **11.5px**, capability titles and
descriptions **10.5px**, chrome unchanged at 8.5–9px.

**The switcher went horizontal**, which is what paid for it. As a vertical
list it occupied the column that now carries the tool's own description; as a
tab row it costs ~37px of plate height and frees ~230px of width. The tabs
are deliberately not the client tabs above them — those are left-packed,
larger and underlined; these distribute across the full width, carry an
`01–04` ordinal, and mark the active one with a gold rule.

**The provenance line is gone for this row.** It held the tool's `shift`
sentence at chrome size, three zones below the tool it described. That
sentence now reads inside the plate beside the screenshot at 11.5px, and
dropping the duplicate is what buys the capability tiles their room.

**FOUR COLUMNS ONLY EVER WORKED AT CHROME SIZE.** Measured at reading size:
titles overran their ~140px column by **29px** at 1280 and a description lost
**15px** to its clamp at 1440. Two columns give ~330px, which holds both.
Below 820px viewport height the descriptions drop and the four titles stand
alone — never the type size, since shrinking it is the exact regression this
pass undoes, and the plate's brief already carries the tool's sentence.

Verified at 1280×720 / 1440×800 / 1920×1080: zero foot overflow, zero title
overflow, zero description clipping, zero brief clipping. All four tabs swap
tagline, brief, shot, tiles and context together; the walkthrough opens,
plays and restores focus. verify 385/385, services-ring-smoke 18 passed.

### Third pass, same day — the redesign (owner: "take a step back")

The second pass fixed sizes without fixing the design. Owner: the panel text
was still too small, the codenames alone were meaningless labels, the watch
button was "ugly", the thumbnail "plastered on", and the foot did not align
with the plate. All five had one root: the panel was assembled, not designed.

**The panel is ONE grid now.** The plate body splits 50/50 with no gap; the
tab row is quarters of the same rail; the foot's capability tiles sit on the
same 50% split, odd tiles on the identity column's text rail (`--fl-plate-px`

- the box border), even tiles on the watch bar's (`--fl-shot-px`). Measured:
  identity text 25.1 / odd caps 25.0; bar text 398.3 / even caps 398.2.

**The functional name is the label.** Tabs are two lines — `01 · MÍMIR` as
chrome over `BRIEFING AGENT` as the label — because a visitor cannot be
expected to know the codenames (owner: "don't just use the internal
naming"). Tracking, not size, was the tab-overflow lever: 22 chars at 11px
+0.05em ran 11px past a 146px quarter; 10.5px +0.02em fits with 3px spare.

**Content reads at `--fl-copy`** — the brief column's own body size (~16px at
1600), which is the owner's evident reference for "legible". The identity
column carries tagline kicker → subline lead (~17px) → the `shift` sentence →
a `codename · mode · dept · year` meta line. Chrome (ordinals, kicker, meta,
bar) stays at 8.5–10px mono. The foot is the four capabilities and NOTHING
else — the context row and provenance line duplicated words the plate now
carries, and dropping them bought the tiles reading size.

**The shot is architecture.** It BLEEDS to the viz box edges (cover,
top-anchored — a letterboxed `contain` was the "plastered on" read), its left
border is the body's seam, and the walkthrough affordance is a full-width bar
FUSED to its bottom edge with the duration on the right ("1:20", read off the
encodes into `walkthrough.duration`). The whole frame is one button — a
~430×280 target instead of a floating 130×26 pill. Focus ring on the frame,
roving arrow-key tabs, same grammar as the client strip.

**The responsive ladder is measured against the WORST tool** (Heimdall: a
2-line lead over a 179-char shift), and it never drops below the 10.5px
directory reading size:

- ≤930h — kicker hidden, copy 15/14px (full size ran 25px past the column at
  1600×900);
- ≤800h — copy 13.5/13px; cap descriptions KEEP two lines (measured: they fit
  with 16px spare — the second pass clamped them a step too early);
- ≤760h — text column widens to 58/42 so the 185-char shift holds inside its
  clamp (the shot narrows rather than the sentence truncating), cap
  descriptions to one line.

Verified clip-free at 1280×720 / 1440×800 / 1600×900 / 1920×1080 across all
four tools (the one remaining "clip" is 720p's designed one-line ellipsis).
All four tabs swap lead, shift, shot, tiles and meta together; the frame
opens the lightbox and restores focus; the films path is unregressed. Frame
probe on a cool control: corridor-mid 16.9 / dissipate-approach 21.7 /
casefile-dwell 16.9 / ring-zone 16.7 — baseline. verify 385/385, smoke 18
passed.

### Fourth pass — the row and its heading name the same thing (2026-07-31, owner)

`01_STUDIO/` becomes **`01_AI-FLUENCY-STUDIO/`**, and with it a rule: _the
project title corresponds to the folder title._ Five of eight rows were
divergent — `01_STUDIO/` headed "AI Adoption Studio", `03_TOOLING/` headed
"Software for few", `04_AI-TRANSFORMATION/` headed "The Workshop Rollout" —
which read as two competing taxonomies for one directory.

Where the owner had deliberately chosen a title, the FOLDER was renamed to
match rather than the title reverted:

| file                    | project           |
| ----------------------- | ----------------- |
| `01_AI-FLUENCY-STUDIO/` | AI Fluency Studio |
| `02_AI-ABOVE-THE-LINE/` | AI Above-the-Line |
| `03_SOFTWARE-FOR-FEW/`  | Software for few  |
| `04_WORKSHOP-ROLLOUT/`  | Workshop Rollout  |
| `05_SKILL-LAYER/`       | Skill Layer       |
| `GOVERNANCE.MD`         | Governance        |
| `METRICS.DAT`           | Metrics           |
| `00_MISSION-REPORT.LOG` | Mission Report    |

Articles are dropped from the titles ("The Skill Layer" → "Skill Layer") so
the correspondence is literal and checkable at a glance rather than
approximate.

**Pinned mechanically.** `cases-registry.test.ts` normalises the filename —
drops the ordinal prefix, the trailing slash and any extension, hyphens to
spaces — and requires it to equal the project case-insensitively. Renaming
one without the other now fails the suite, which is the only way this stays
true.

Track `id`s are untouched (`studio`, `atl-films`, `tooling`, `transformation`
…) — they are DOM ids and the plate-sharing test keys on them; only the
display strings moved. `preview` strings follow the filenames.
