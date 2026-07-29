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

Arrival is a PRODUCT: a dissipate band as a pre-gate (the casefile can
never appear before the corridor has resolved into the parked mark) times a
`proofP` band as the actual timing. The pre-gate carries its OWN edges
rather than reusing `CONTENT_IN_*` — sharing them made it the binding
constraint at the front, so pulling the `proofP` band earlier stopped moving
anything, and `CONTENT_IN_*` cannot be widened to fix that without re-timing
the services copy, which is a different beat. Keying the timing to
runway travel rather than to the dissipate is not incidental — the
epilogue signal exits on `DISSIPATE_BANDS.SIGNAL_OUT` = [0.86, 0.99], so a
dissipate-band arrival OVERLAPS the beat it is answering. The first cut
did exactly that and read as the two fighting; waiting on travel past the
park lets the claim leave before the evidence lands, and makes "later" a
distance rather than a curve reshape. Departure and the release ramp ride
the same `proofP`.

The release multiplies `--svc-content-in`, which delays the masthead, the
plate cluster, the designation layer, the orbit draw-on and the scan
interface **together**, with no new consumer and no new listener.

The same release is published on `servicesRingProgressRef.proofRelease`
and consumed by a new `masterOpacityGetter` on `ServicesCardRing`
(mirroring `HologramOrbits`' existing prop) plus a term in
`CorridorArmillary`'s `orbitExitGetter`. Because it lands in `master`, and
the hit-anchor publish gate reads the resulting `opacity`, a 0 there also
stops the ring publishing click targets — the cards can never be
invisibly clickable over the casefile.

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

The only displacement is a 2.5px lateral tear carried by `(g1 − g2)`, which
is exactly 0 once the dropout catches up — the flicker must never become
travel, because these zones are absolutely positioned against the rail's
tick ladder. The hairline rules and the split take the flicker without the
tear, where a lateral shift would read as a break rather than a glitch.

DEPARTURE stays a whole-plane fade on `--svc-proof-out`: the casefile
assembles like an instrument and leaves like a page being turned.

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
