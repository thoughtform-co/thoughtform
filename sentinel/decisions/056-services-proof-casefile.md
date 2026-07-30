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

|                      | bytes                                                   |
| -------------------- | ------------------------------------------------------- |
| open `01_STUDIO/`    | **23.6 kB** — three 256w WebP off 432 kB of source JPEG |
| open `02_ATL-FILMS/` | **19.1 kB** — two posters, **0 video requests**         |
| click play           | 12.5 MB, the mp4, and only then                         |
| after the fold       | `.fl-film__video` count **0**                           |

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

### Row order

`00_MISSION-REPORT.LOG` · `01_STUDIO/` · `02_ATL-FILMS/` · `03_TOOLING/` ·
`04_AI-TRANSFORMATION/` · `05_SKILL-LAYER/` · `GOVERNANCE.MD` · `METRICS.DAT`.

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
