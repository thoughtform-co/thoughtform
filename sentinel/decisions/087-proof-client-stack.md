# ADR-087: The casefile is a client stack

- **Status:** **Accepted** for the MECHANISM (Phase B, live and byte-identical
  at one client) · **Proposed** for the CHOREOGRAPHY (seam length, the ±18px
  travel bias, decode replay) pending the owner's read of
  `/test/client-stack-lab`
- **Date:** 2026-09-01
- **Owner call:** the rulings recorded below (no ghost Archive stop; the tab
  strip stays a jump control; the housing persists through a swap; seam budget
  0.5svh as the default under judgement)
- **Surfaces:** `components/landing/home-v2/services/casefile/**`,
  `components/landing/home-v2/hooks/useServicesStageScroll.ts`,
  `components/landing/home-v2/unifiedServicesInstrument.ts`,
  `app/(internal)/test/client-stack-lab/**`,
  `scripts/capture-client-stack.mjs`
- **Supersedes:** ADR-056 U13 on the browse band's ARITHMETIC only — its
  quarter-band-per-row map is now the N = 1 case of a segment table, and every
  other clause of U13 (the dwell's split, click-pins-scroll, the hysteresis,
  the dead-scroll ruling, the freeze past `--svc-proof-out` 0.02) stands
  unchanged.
- **Builds on:** [ADR-056](056-services-proof-casefile.md) (the casefile and
  its runway split) · [ADR-044](044-services-masthead.md) (the reveal protocol
  the decode replay extends) · [ADR-068](068-casefile-glyphed-index-and-tool-dossier.md)
  (the register the seam carries) · [ADR-083](083-mobile-evidence-instruments.md)
  (the phone IA the client step seats into) ·
  [ADR-070 U35](070-configuration-is-a-switchboard.md) (a flag is a comparison
  lever, not a permanent seam — why nothing here is flagged)
- **Rules:** [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

The casefile has always been a client STACK in its grammar and a single client
in its data. The tab strip is derived from `CASES`, the dim `+ Archive` marks
the format as a series, and `.claude/rules/proof.md` has said "adding a second
case lights up a second tab with no component change" since ADR-056.

That sentence was true about the TABS and false about everything under them.
Two numbers were literals — `SERVICES_PROOF_RUNWAY_VH = 3.2` and
`SERVICES_PROOF_BROWSE_FRAC = 0.625` — and a literal is a promise that `CASES`
will never grow. The browse channel mapped `[0, 1]` onto one client's rows by
`Math.floor(browse × rowCount)`, so a second `CaseDef` would have changed what
a browse quarter MEANT while both constants sat still: eight rows sharing four
quarters, two of them unreachable.

Phase B (commit f8dde2c2) closed that. Phase C, recorded here, makes the result
JUDGEABLE — because byte-identity at one client is simultaneously the
mechanism's acceptance proof and the reason nobody has ever seen the
choreography run.

## Decision

### 1 · The dwell is a RESULT, and the segment table is its shape

Three knobs, in `unifiedServicesInstrument.ts`:

| constant                        | value | what it is                                      |
| ------------------------------- | ----- | ----------------------------------------------- |
| `SERVICES_PROOF_ROW_VH`         | 0.5   | one directory row's share of the browse band    |
| `SERVICES_PROOF_CLIENT_SEAM_VH` | 0.5   | the band BETWEEN two clients, charged N−1 times |
| `SERVICES_PROOF_RELEASE_VH`     | 1.2   | the 2026-07-29 handoff, unchanged               |

Everything else is derived over `CASES`:

```
PROOF_BROWSE_VH            = Σ rows × ROW_VH + (N−1) × SEAM_VH
SERVICES_PROOF_RUNWAY_VH   = PROOF_BROWSE_VH + RELEASE_VH
SERVICES_PROOF_BROWSE_FRAC = PROOF_BROWSE_VH / RUNWAY_VH
SERVICES_PROOF_SEGMENTS    = browseSegments(rowCounts, ROW_VH, SEAM_VH)
```

**At N = 1 the derivation collapses to the shipped literals EXACTLY**, and the
unit test asserts it with `===` rather than a tolerance: `4 × 0.5 = 2.0`,
`2.0 + 1.2` is the nearest double to 3.2 (the tie rounds to even, which IS
3.2's representation), and `2.0 ÷ 3.2` rounds to 0.625. Nothing about the
shipped surface moves by one bit.

The table at N = 1 is a single band `[0, 1]`, so every function in
`browseMap.ts` degenerates to the arithmetic it replaced: `browseTargetFor`
returns `(rowIdx + 0.5) / rows`, which IS `selectTrack`'s click-pins-scroll
formula, and `browseState` runs `rowFromBrowse` on the raw value, which IS the
U13 spy. `start + x × (end − start)` is `0 + x × 1`, and both operations are
exact.

The table at **N = 2 with the lab's fixture** (Loop's four rows, the fixture's
three) is the shape the mechanism was written for:

```
browse 4.0vh · runway 5.2vh · browse frac 0.76923…
client 0  [0,      0.5  ]  4 rows, bands of 0.125, centres .0625 .1875 .3125 .4375
seam      [0.5,    0.625]
client 1  [0.625,  1.0  ]  3 rows, bands of 0.125, centres .6875 .8125 .9375
```

⚠ **THE ROW BANDS COME OUT EQUAL ACROSS BOTH CLIENTS, AND THAT IS THE POINT OF
SIZING A BAND BY ITS OWN ROW COUNT.** A client with fewer rows gets a shorter
band, not wider rows — so one browse quarter costs the same scroll on every
tab, whatever the tab holds.

### 2 · The seam is a crossfade with an identity swap at its blind midpoint

`browseSeamClocks` returns two numbers, positional rather than directional, so
scrolling back up runs the same two ramps in reverse:

```
t < 0.5 :  clientOut = smootherstep(t / 0.5)      clientIn  = 1
t ≥ 0.5 :  clientIn  = smootherstep((t − 0.5)/0.5) clientOut = 0
```

The identity swap is held around the midpoint by `SEAM_SWAP_HYSTERESIS` 0.06,
i.e. the window `[0.44, 0.56]`, so a reader parked on the midpoint cannot
flicker between two clients. **The window has to sit entirely inside the
stretch where the panels paint nothing — a held identity is only free while the
thing carrying it is invisible.** Now measured rather than asserted
(`capture-client-stack.mjs`, 15 midpoint frames across three viewports × two
themes × bias off/on):

| seam t               | outgoing record | incoming record | housing   |
| -------------------- | --------------- | --------------- | --------- |
| 0.44 (window opens)  | 0.021 opacity   | 0               | 1.000     |
| 0.50 (swap)          | **0.000**       | **0.000**       | **1.000** |
| 0.56 (window closes) | 0               | 0.000           | 1.000     |

⚠ **THE TWO EDGES ARE NOT SYMMETRIC, AND THE ASYMMETRY IS ARITHMETIC.** The
fold's clearance comes from `--co-off` (0.12–0.32 across the four panels), so
at t = 0.44 the brief still reads 2.1 %; the arrival's comes from `--ci-off`
(0.24–0.44), which is a much deeper deadband, so the incoming side is exactly 0
at t = 0.56. Both are inside the header's `< 0.05` claim; only one of them is
comfortably so.

### 3 · The channels compose on FOUR panels; the housing is unmarked

`setProof` writes `--svc-client-in` / `--svc-client-out` on `.fl-case` behind
the same write deadband as the two proof clocks — and **removes them at one
client**, so today's inline style is byte-what it was. That is not a flag
(ADR-070 U35): it is the segment table answering a question about itself, and
it flips on the day a second `CaseDef` lands.

casefile.css composes them into the arrival and departure inputs on
`[data-fl-panel][data-fl-client-panel]` only:

```
--ci  =  (--svc-proof-in × --svc-client-in − --ci-off) / (1 − --ci-off)
--co  =  (max(--svc-proof-out, --svc-client-out) − --co-off) / (1 − --co-off)
```

A PRODUCT for the reveal, because both conditions must hold before a panel may
paint; a MAX for the fold, because either one leaving is enough.

⚠ **ONLY `--ci` AND `--co` ARE RESTATED.** `--g1`/`--g2`/`--g3`, the opacity
expression, the 2.5px strike tear and the directional travel all read those two
through `var()`, and a custom property resolves at computed-value time against
the element's own cascade — so overriding the two inputs re-runs the whole
strike → dropout → settle ladder and the LIFO fold on the composed clock, with
the curve untouched. Restating a downstream declaration would fork the ladder
into two copies that drift.

⚠ **THE HOUSING IS NOT MARKED, AND THAT IS THE WHOLE READ.** The marks are on
the brief, the proof register, the directory and the panel's visual — the four
surfaces that say something about ONE client. The tabs wrapper, `.fl-split`,
the reticles, the whole-plane iris and every other `--svc-proof-out` consumer
are the FRAME the record is swapped inside. **A frame that crossfades with its
own contents is a page turn**, which is the read this mechanism exists to
avoid. Measured across every seam frame: the housing sits at 1.000 while the
record goes to 0.000.

⚠ The visual's mark goes on `.fl-panel__viz`, not `.fl-panel` — the tabpanel
shell carries no `data-fl-panel`, so a mark there would select nothing.

The LIFO fold's order among the marked four, measured at seam t 0.15 / 0.35:
**visual → directory → register → brief** (co_off 0.12 / 0.22 / 0.26 / 0.32),
i.e. the exact reverse of the arrival's reading order, with the housing
excluded from both.

### 4 · Byte-identity at N = 1 IS the acceptance proof

No flag, no variant, no second code path: ADR-070 U35's ruling is that a flag
is a comparison lever and once the owner has read both live the losing drawing
goes — so a permanent `PROOF_CLIENT_STACK` boolean would be a seam with nothing
on the other side of it.

What stands in for it is measurement. **63 (opacity, transform) pairs plus 9
iris values are identical across the arrival ladder and the fold with the
channels absent**, and `--svc-client-in`/`-out` are not written at all rather
than written as "1"/"0" — the same pixels and a different DOM, which is the one
thing this proof does not allow. **The smoke passing unchanged IS the
comparison.**

Two new mechanical guards:

- `tests/lib/casefile-browse-map.test.ts` — 19 cases over the pure module,
  including the N = 1 identities with `===` and the swap window's containment.
- `tests/lib/services-proof-runway-lockstep.test.ts` — the CSS literal must
  equal the derived constant. `--svc-proof-runway` is HAND-WRITTEN because it
  has to exist pre-hydration, and Phase B is exactly the change that makes
  silent divergence possible for the first time. `.claude/rules/proof.md` has
  said "must move together" since ADR-056; this is that sentence with teeth.

### 5 · `PROOF_SETTLED_AT` stays a FRACTION, and the pixel arithmetic is recorded

`data-proof-settled` gates the plates' `backdrop-filter` — an effect too
expensive to run on a moving element (measured: +2.4 to +3.7ms avg on the
dissipate approach, >33ms frames from 3 % to 13–16 %). The constant is 0.025 of
`proofP`, whose domain is the WHOLE runway.

Re-expressing the intent as `80 / (RUNWAY_VH × vh)` was offered and measured:
**80px is true only where `vh` is exactly 1000.**

| viewport height | 0.025 of 3.2vh | a literal 80px |
| --------------- | -------------- | -------------- |
| 720             | 57.6px         | 80px           |
| 800             | 64px           | 80px           |
| 900             | 72px           | 80px           |
| 1080            | 86.4px         | 80px           |

Those are real crossings a reader can see, not rounding, so the honest note is
that the constant records a fraction whose PIXEL intent is viewport-dependent.
⚠ **AND THE RUNWAY IS DERIVED NOW, SO THE GATE MOVES WITH `CASES`**: at N = 2
the runway is 5.2vh and 0.025 of it is 104px at 800h against today's 64px — the
blur's onset slides ~40px later the day a second client lands. A pixel
re-derivation is a separate, measured change to make when someone is prepared
to re-judge the blur at all four heights; it belongs on the Phase D list, not
in the same commit as the table.

### 6 · What was REJECTED: the ghost Archive stop

The obvious way to let a reader feel the series is a browse stop for
`+ Archive` — a fifth band showing an empty template. **Rejected on two
standing rulings, both of which it violates on its own:**

1. **The round-3 DEAD-SCROLL ruling.** The browse band is lawful because every
   quarter changes the panel; "browse runway beyond the rows' needs is the dead
   scroll coming back" (`.claude/rules/proof.md`). A ghost stop is by
   definition a band in which nothing changes.
2. **The PLACEHOLDER-CLIENT ruling.** "Do not ship placeholder clients on the
   public page — the dim `+ Archive` is what marks it as a series." A ghost
   stop is a placeholder client that also costs scroll.

`+ Archive` stays what it is: not a tab, not a stop, and deliberately outside
the roving tabindex, because a disabled tab in the tablist would break the
roving index for no gain.

### 7 · `ClientTabs` is a JUMP control, and it pins the scroll

The tab strip is not the browse selector — while the stage is pinned, SCROLL
is. So `selectClient` does what `selectTrack` has done since U13: it moves the
scroll to `browseTargetFor(segments, idx, 0)`, the incoming client's first
row's band centre, and the spy then derives the same target. **Without the pin
the tab lights and snaps back one frame later**, which is the identical symptom
a row click had before U13. Never remove one side of that contract without the
other.

Static contexts keep the plain state write: mobile / reduced motion (no browse
channel), a not-yet-pinned stage (teleporting the page under a reader who
clicked early is worse than a transient override), and the flag-off rollback.

### 8 · The mobile client step

At ≤ 960px `.fl-case` is a single-column grid with `align-content: start`, and
the tab strip is FIRST in source order — so the client step sits **above** the
`BRIEF / PROOF / ARTIFACT` mode switch, which is the ADR-083 IA's own
hierarchy: identity, then mode, then the one bounded seat. Each tab carries
`min-height: 44px`, meeting ADR-083's control floor. **Inert until N ≥ 2** (a
one-row tablist), and `flex-wrap: nowrap` means a THIRD client forces a
horizontal-scroll decision on the narrowest rung — noted, not solved.

## Phase C — the lab, and what it found

`/test/client-stack-lab` mounts the SHIPPED `ServicesCasefile` with
`cases={[LOOP_EARPLUGS_CASE, CLIENT_STACK_FIXTURE]}` and drives the five
channels the pinned dwell writes. The spy, the hysteresis, the identity swap,
the click-pins contract and the panel composition are all real code paths; the
lab owns one number.

- **The fixture lives beside the route, never in `lib/cases/`.** The
  confidentiality envelope and the registry guard both key on `CASES`, so a
  fixture in the content module would light a second tab on the public page the
  moment anything imported the registry. Being outside the guard's scan is a
  reason to be stricter: `SPECIMEN INDUSTRIES`, three tracks, letters where a
  real record has dates, no figure anywhere, and the brief says on the surface
  that it is synthetic.
- **THREE tracks against Loop's four, deliberately** — equal row counts are the
  one shape in which an error in the table's normalization cannot show.
- ⚠ **THE CHANNELS MUST BE WRITTEN ON `.fl-case`, NOT ON THE STAGE.**
  `driveBrowse` reads `root.style.getPropertyValue(...)` inside a
  `MutationObserver` on `.fl-case`'s own `style` attribute — inline style, on
  that element. Stage-hosted writes make the CSS resolve correctly (custom
  properties inherit) and drive NOTHING, because the component never reads a
  computed value. The casefile-type-lab's `STAGE_STYLE` pattern is therefore
  the wrong host for a lab that needs the component to think.
- ⚠ **ONE SEGMENT TABLE, WHICH IS WHY `seamVh` IS A PROP.** A lab-local table
  with its own seam length puts the identity swap outside the invisible stretch
  and reports a defect the mechanism does not have (worked through: at seam 0.3
  the swap would land at ~0.87 clientOut, i.e. 13 % opacity). `seamVh` defaults
  to `SERVICES_PROOF_CLIENT_SEAM_VH`, the same "default argument, not a flag"
  idiom `cases` already uses.

### Findings, in the order they matter

**F1 · THE DECODE REPLAY'S PREMISE FAILS AT N = 2, and this is the pass's
principal finding.** The mechanism is right and the target set is wrong. The
reveal's only `[data-fl-text]` node is `.fl-tabs__name` — per-client, which is
exactly the granularity the effect caches at. With ONE client that name IS the
client's copy and decoding it on arrival is the surface's own arrival language.
With TWO tabs the strip is a persistent INDEX: on a swap **neither** name
changes, so `begin()` blanks and re-scrambles both, and because it blanks by
setting `textContent = ""` the strip REFLOWS. Measured on
`.fl-tabs__archive`'s left edge across the crossing at 1440×800: **453.1px at
rest → 259.1px at its worst → 453.1px settled, a 194px lateral jump** in the
one element on this surface whose whole job is to sit still and say "series".
The reader sees an empty stage under two garbled labels sliding left, which is
the precise opposite of "the housing stands".

Everything that actually changes on a swap — the brief's title, its
classification and body, the register, the directory rows, the panel — is
deliberately NOT a decode target, because the cache is per-client and those are
per-TRACK (a track-reactive decode target strands stale copy on the first row
switch). So there is nothing for the replay to decode.

Recorded, not fixed: the choreography is Proposed and this is what the owner's
read has to settle. Three candidate closes, cheapest first:

1. **Replay OFF** (`decodeReplay={false}`). The still comparison is decisive —
   with it off the strip is steady, the underline moves, both names stay
   legible.
2. **Don't pre-blank on a replay.** `queueScramble` already no-ops when
   `from === to`; `begin()` defeats that guard by clearing the node first.
   Skipping the clear on the replay path would leave an unchanged name alone —
   but on this target set that makes the replay a no-op, i.e. option 1 with
   extra code.
3. **Re-target the decode** to something per-client that genuinely changes.
   Nothing on the surface qualifies today, so this is a content-model change,
   not a tuning one.

**F2 · THE BLANK STRETCH IS 21 % OF THE SEAM.** Swept at 0.01 granularity, the
four marked panels read under 0.005 from seam t **0.47 to 0.67** — the fold
saturates exactly at the midpoint (`--co` reaches 1 when `--svc-client-out`
does) while the arrival cannot begin until the composed clock clears the
smallest `--ci-off`, 0.24, which `smootherstep` reaches at t ≈ 0.677. At the
0.5svh default that is **84px of scroll at 1440×800** (76px at 720h, 113px at
1080h) in which the housing stands over nothing. It is not a bug — it is what
buys the invisible swap — but it is the number the seam budget should be judged
against, and it is why a shorter seam is the honest lever rather than a faster
curve.

**F3 · SEAM LENGTH IS NOT A VISUAL PROPERTY AT A FIXED SEAM-LOCAL POSITION.**
The comparison row's stills at 0.3 / 0.5 / 0.8 are **byte-identical** at seam t
0.15, 0.35 and 0.50 (SHA-1 verified; the 0.65 / 0.85 frames differ only in the
random scramble glyphs F1 puts in the tab names). Both clocks are functions of
the seam-local fraction, so the length changes only what a unit of crossfade
COSTS in pixels. Consequence for the owner's read: the seam length can only be
judged by SCRUBBING, never from a contact sheet — and the thing being judged is
rate, i.e. 240px vs 400px vs 640px of scroll for one client change at 800h.

**F4 · The ±18px bias reads, and it reads as an exit rather than a dissolve.**
Measured 15.1px of lift on all four marked panels at seam t 0.35
(18 × clientOut 0.837), with the tabs, the split and the reticles stationary.
Composed onto the shipped ladder through the `translate` PROPERTY, never by
restating `transform` — the individual transform properties compose with
`transform` by construction, so the arrival travel, the strike tear and the
LIFO drift are untouched, and the term is exactly 0 at rest on both sides
(`--svc-client-in` rests at 1, `--svc-client-out` at 0, and the `var()`
fallbacks make it zero when the channels are absent). It lives in the lab's own
stylesheet; casefile.css does not move.

⚠ Its incoming half is partly spent inside F2's blank stretch: the brief is
13.7px low when it starts painting and still 5.6px low when it saturates,
settling to 0 only at the seam's end. If the bias is taken, that tail is what
to look at.

**F5 · No defect in the table, the clocks, the composition or the pins.** 101
frames, 0 page errors, every rest state resolved on the right client and row,
the seam's "frozen at its last row / lands on its first" behaviour correct in
both directions, and the housing at 1.000 in every frame.

## Phase D — adding client #2, verbatim from f8dde2c2

> Adding client #2 later: content module + registry entry + hand-bump the
> runway literal (the lockstep test prints the number) + registry pins +
> a seam smoke case + handoff re-measure.

Expanded, in order, because each item has a way of being forgotten:

1. **Content module** in `lib/cases/content/`, zero imports, inside the
   confidentiality envelope.
2. **Registry entry** in `lib/cases/registry.ts` — `CASES` order is tab order.
3. **Hand-bump the `320svh` literal** in `services.css`.
   `services-proof-runway-lockstep` prints the number it wants; the CSS has to
   exist pre-hydration, so it cannot be generated.
4. **Registry pins** — the new case's meta and classification arrays, glyph
   keys, budgets, and the file↔project name correspondence.
5. **A seam smoke case** in `services-ring-smoke` — band centres off
   `SERVICES_PROOF_SEGMENTS`, never hand-computed fractions.
6. **Handoff re-measure at three viewports** (1280×720 / 1440×800 /
   1920×1080): the release's absolute pixel budget is unchanged by
   construction, but `PROOF_SETTLED_AT`'s pixel position is not (§5), and
   `PROOF_OUT` 0.13/0.66, `REVEAL_AT`, `REARM_BELOW` and `PROOF_OWNS_BELOW`
   are all placed BY VALUE on the release ramp and must be sampled again.
7. **First live exercise of the CSS composition** — the day `CASES` holds two
   entries, `.fl-case [data-fl-panel][data-fl-client-panel]` stops being an
   identity for the first time in production. Everything in Phase C above was
   measured through a lab fixture; re-read it on the landing.

## Verifying

- `node scripts/capture-client-stack.mjs` → `docs/design/client-stack/` (101
  frames plus the measurement table, the midpoint assertion, the blank-stretch
  sweep and the replay probe).
- `npx vitest run tests/lib/casefile-browse-map.test.ts tests/lib/services-proof-runway-lockstep.test.ts tests/lib/cases-registry.test.ts tests/lib/services-static-proof-browse.test.tsx`
- `npx playwright test tests/visual/services-ring-smoke.spec.ts` — the whole
  spec is the byte-identity comparison; two failures are PRE-EXISTING (the
  Voidwalker masthead's era text; `--pda-txt3` at 2.38:1 in the light walk).
- The lab: `http://localhost:3003/test/client-stack-lab`

## Left open

- **F1's close** — the owner's read decides between replay off, no-pre-blank,
  and a re-targeted decode.
- **The seam budget** — 0.5svh is the default under judgement, and F3 means it
  has to be scrubbed rather than compared.
- **The ±18px bias** — offered, with F4's tail as the known cost.
- **`PROOF_SETTLED_AT`'s pixel re-derivation** (§5), which is a Phase D item
  rather than a Phase C one.
- **A third client's tab strip on the narrowest phone rung** (§8).
