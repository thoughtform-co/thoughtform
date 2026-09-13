# ADR-096 — The proof beat is the card stack

**Status:** Proposed (shipped and guarded, 2026-09-12; pending the owner's live read)
**Supersedes on PLACEMENT:** [ADR-056](056-services-proof-casefile.md) — the casefile's
content model, its plates and its confidentiality envelope are untouched
**Shares, verbatim:** [ADR-094](094-trinny-proof-stack-and-proposal.md) — the card, the
pile and their skin
**Related:** [ADR-030](030-tools-section-cover-stack.md) (the stack mechanic) ·
[ADR-029](029-services-card-ring.md) (the offer the beat hands to) ·
[ADR-089](089-casefile-is-one-housing.md) · [ADR-058](058-light-mode-theme.md)

---

## The ask

Owner, 2026-09-12, on reading `/trinny-london`:

> The updated cards we implemented in Trinny London: I really like that. I want
> you to implement that as well on our homepage. As you know, in the proof
> section on our homepage, we now have different cards, but I want you to use
> the ones from Trinny London. Also, we need dark mode for those on our
> homepage.

The same four Loop projects were on both surfaces already, drawn two ways: a
pinned **casefile** on `/` (one panel, a client tab, a brief, four claims, a
directory whose rows scroll-select, and one evidence panel that swaps) and a
scroll-stacked **pile of cards** on the pitch page. The ruling is that the pile
is the beat.

## The decision

`#services` opens with the proof STACK. `SERVICES_PROOF_CASEFILE` goes off and
`SERVICES_PROOF_STACK` on; the casefile's component tree, its sheet and its
guards stay on disk until the owner has read the new beat live — ADR-070 U35's
ruling that a flag is a comparison lever, and that **the losing drawing goes
WITH its guards, not before them**.

⚠ **THE FOUR EVIDENCE PLATES ARE NOT PART OF THE TRADE.** `SheetsPlate`,
`FilmsPlate`, the wireframes and `IntelligenceMapPlate` are what the CARDS
mount, at card scale, through `ProofField`. `casefile/**` is therefore not dead
code and may not be swept as such — what changed is the housing around the
evidence, never the evidence.

## Two mechanics, and why the pile could not simply move in

They are different MECHANICS, not two skins:

- the casefile is **pinned** and browsed — scroll IS the row selector across a
  3.2-viewport dwell;
- the pile is four `position: sticky` slots — and a sticky slot needs real
  scroll to stick against.

Inside a stage that is itself pinned at `top: 0` there is none. So the pile is
a **SIBLING of `.services-stage`, seated ABSOLUTELY over the front of the
runway** (`services.css`). That keeps both halves of what the beat needs:

- out of flow, so `.services-stage` still pins from the runway's very top and
  the proof → offer handoff keeps the shape it has today — the masthead, the
  plate cluster and the ring fade up in a frame that never moved. Putting the
  pile in FLOW ahead of the stage would push the stage's pin down the runway,
  so the offer would arrive by _sliding up after the last card_;
- and the pile still scrolls, because an absolutely positioned ancestor
  scrolls with the document; its sticky children pin to the viewport and
  release at its bottom edge.

⚠ **BELOW THE INERT RUNG THE PILE GOES BACK INTO FLOW**, first in DOM, so the
proof reads above the offer accordion exactly where the casefile sat. The
`position: static` rung in `services.css` restates `proof-stack.css`'s own
query and must keep restating it: a pile that parks its slots while its box is
still out of flow lands on top of the accordion.

## The runway is MEASURED, not declared

`splitServicesRunway` still takes a proof share and hands the ring the rest
over a domain that is byte-identical to the pre-casefile 500svh. What changed
is where the proof share comes from.

⚠ **THE PILE'S LENGTH IS NOT A CLEAN MULTIPLE OF THE VIEWPORT.** It is
`n × (100svh − pinTop + peek + dwell)` plus the last card and its tail, and the
px terms in it — the 64–88px pin, the 52px peek, the 24px safe band — do not
scale: measured **489svh at 1280×720, 491 at 1440×900, 483 at 1920×1247**. A
single literal can only ever be right at one viewport.

So `useServicesStageScroll` reads `.pf-stack`'s own box, adds
`SERVICES_PROOF_RELEASE_VH`, and **writes the total back onto
`--svc-proof-runway` in pixels** — one write per resize, change-guarded, and it
converges in a single frame because writing it changes the RUNWAY's height and
never the pile's (the pile is out of flow). `SERVICES_PROOF_RUNWAY_VH` (6.1) is
the **pre-hydration reservation** and the fallback, not the measurement; it is
deliberately the ceiling of the measured range, because reserving too little
would let the ring's domain start inside the pile for one frame.

Measured live at 1440×900: pile 4416px, written runway 5496px, ring domain
3600px against the 3600 it must be. The browse fraction is derived the same
way (`pileH / proofPx`), so the release band starts exactly where the pile
ends at every viewport.

⚠ **AND THE SAME ARITHMETIC CARRIES THE IN-FLOW RUNG FOR FREE.** When the pile
is static it is the runway's first child, so the stage pins at `pileH` — which
is the number the hook already measured. Nothing branches.

## Dark mode was free, and that is a property of the sheet

The card's sheet is TOKENS only: every colour is a ramp step off `--dawn-rgb` /
`--void-deep-rgb` / `--gold-rgb`, which ADR-058 SWAPS between themes. So the
same declarations paint cream on near-black here and ink on parchment on the
light-locked pitch page, with no `[data-theme]` branch anywhere in the file.
Measured: `--pf-plate` resolves `rgb(5, 4, 3)` in dark and `rgb(228, 218, 201)`
in light, on the same rule.

⚠ **THAT IS WHY THE SHEET MOVED RATHER THAN BEING COPIED.** A route-local copy
of the dark values is ADR-058's own trap one surface later, and the four plates
inside the card already rely on the console bringing both themes with it
(ADR-094 U3). Two copies of a measurement is how one surface starts passing
what the other would fail.

## The promotion, and the one thing it renamed

`app/(marketing)/trinny-london/proof/**` became
`components/landing/home-v2/services/proof-stack/**`:
`ProofStack` · `ProofCard` · `ProofField` · `proofTabs` · `proofOrder` ·
`proof-stack.css`. The route keeps three thin shims under its own names so
`trinny-proof-order.test.ts` and `trinny-proof-tabs.test.ts` are untouched, and
`ProofStack` there is a default export because `TrinnyPortals` mounts it
through `lazy()`.

⚠ **THE ROUTE SCOPE `.tl-root .tl-*` BECAME `.pf-stack .pf-*`, AND THE SCOPE IS
LOAD-BEARING.** Those selectors override `console.css` and `casefile.css` at
(0,3,0); flattened to `.pf-card__tabs .fl-con__stn` they would lose to rules
they were measured against. The component therefore renders its own `.pf-stack`
wrapper and every rule is scoped by it, which keeps the specificity of the
whole sheet exactly as it shipped.

`tracks` is a PROP: content is by reference and ORDER is by route. Both
surfaces show the record's own arc order today — `01` the frontier · `02`
self-sufficiency · `03` the tools · `04` the company — and a second casefile
would not have to. ⚠ The pile's order and `arc.step` can disagree with nothing
failing; `trinny-proof-order.test.ts` pins them arithmetically and the new
smoke pins them on the rendered page.

## Alternatives rejected

- **Keep the casefile and add the pile after it.** Eight viewports of proof
  before the offer, and the same four projects said twice.
- **Keep the pin, restyle the panel as a card.** Cheapest, and not the thing
  the owner liked: the pile IS the mechanic.
- **Drive the pile from `--svc-proof-browse` inside the pinned stage.** A
  re-implementation of ADR-030's hook against a channel it was not written
  for, on a surface whose rule is that the mechanic is shared and the skin is
  local.
- **Copy the sheet instead of moving it.** See dark mode above.

## What moved, and what did not

| moved                               | stayed                                               |
| ----------------------------------- | ---------------------------------------------------- |
| the casefile's MOUNT (flag off)     | `lib/cases/**`, the envelope, every plate            |
| the proof share's source (measured) | `splitServicesRunway`, the ring's 500svh domain      |
| the card's module + sheet           | the corridor dissipate, the dock, the ambient hold   |
| the smoke's proof half              | `proofRelease` / `proofPresence` and their consumers |

## Guards

- `tests/visual/services-ring-smoke.spec.ts` gains
  **"desktop: the proof stack holds the stage before the ring arrives"** (the
  seating, the measured split, the pile holding `--svc-content-in` under 0.05
  with zero published ring anchors, four cards on the record's arc, the rail's
  flat-and-square stations switching the field, the card's clipped-ring
  chamfer with a square console inside it, and no box clipping on any card)
  and **"light: the stack's instruments carry their contrast"** (ADR-063 U2 and
  ADR-068's colour laws, re-walked on the new surface).
- ⚠ **EVERY READ IN THOSE TESTS IS SCOPED TO THE SEATED CARD.** The pile mounts
  FOUR consoles at once, so `document.querySelector(".fl-con__console")`
  answers with the sheets card whatever is on screen. That is the one thing a
  single-panel surface never had to say, and it is why the casefile's own light
  walk could not simply be re-pointed — it navigates by `.fl-row` and reads one
  console per row.
- ⚠ **`seatProofCard` REWINDS ABOVE THE PILE BEFORE IT SOLVES.** `offsetTop` on
  a sticky element that is currently STUCK reports its stuck position, not its
  flow offset, so solving a seat while standing further down the pile reads a
  lie and converges on wherever it already is. And it converges on
  `data-pc-state` — the hook's own published value — never on a rect, because
  the corridor's lazy mount grows the document under the first scroll.
- `scripts/capture-proof-stack.mjs` prints the geometry, the split, each card's
  rail and plate, and shoots the four seats plus the handoff.
- Five casefile tests are `test.skip`-gated on `SERVICES_PROOF_CASEFILE` with
  the reason written in.
- `tests/lib/casefile-browse-map.test.ts` derives the casefile's own dwell from
  the three knobs instead of reading `SERVICES_PROOF_RUNWAY_VH` /
  `SERVICES_PROOF_BROWSE_FRAC` — those exports are the STACK's now, and reading
  them made a claim about `browseMap.ts`'s arithmetic depend on which beat the
  page happens to mount.

## Update 1 — the offer opens while the last card is still leaving (2026-09-13, owner)

⚠ **SUPERSEDED BY U3 (same day, same ask read again).** This update measured
`--svc-content-in` — the DOM ladder — and the owner was looking at the ring's
CARDS, which ride the same release through a window ending at 0.88 and were
still a viewport late with this guard green. The overlap constant below is
DELETED; the ramp is solved from the last card's own exit now. What survives
is the diagnosis (one fraction was answering two questions) and the invariant
(nothing may open while the card is parked). Read U3 before citing any number
here.

> There's a bit of a gap between when you scroll away from the proof section
> into the services section. It takes two or three scrolls, even before the
> elements of that services section show up. That needs to happen a bit
> smoother and a bit faster.

**This is the "Left open" item below, read live.** It was recorded as _"the
last card's dwell is long before the release … one constant if the owner reads
it as slow"_, and that is what this update is.

**Measured first, at 1440×900.** The last card unsticks at scrollY 11566 and
its bottom clears the viewport at **12442**; the release did not open until
**12836** — `--svc-content-in` sat at exactly 0 for those 394px — and did not
reach 4 % until 13030 or 15 % until 13150. So ~**800px, three trackpad swipes,
in which the pile was gone, the offer was at zero and the brandmark was still
dimmed behind both.** The same walk at 1920×1247 and 1280×720 showed the same
shape.

**The cause is that ONE fraction was answering TWO questions.** The hook split
the proof share at `pileH / proofPx` — the pile's own box — and used that one
number both for "when do the directory's rows stop stepping" (`browseP`) and
"when does the offer start arriving" (`releaseP`). On the casefile those were
one answer. Under the pile they are not: the browse channel is inert (the pile
is its own selector) and the pile's BOX outlasts its last card by that card's
whole exit. The release was therefore pinned to the end of a box whose contents
had left.

**So they are two fractions now.** `browseFrac` is unchanged; `releaseFrac` is
`(pileH − SERVICES_PROOF_HANDOFF_OVERLAP_VH × vh) / proofPx`, and the overlap is
**1.0** — the last card's own exit, which measures 876px at 1440×900, 696 at
1280×720 and 1223 at 1920×1247, i.e. 0.97–0.98vh everywhere. The offer now
assembles out of the motion that carries the card away.

**Measured after**, same three viewports — the dead band is gone and is now an
OVERLAP (the offer paints before the card clears):

|                                          | 1280×720       | 1440×900              | 1920×1247 |
| ---------------------------------------- | -------------- | --------------------- | --------- |
| offer's first paint vs the card clearing | −120px         | −240px                | −360px    |
| `--svc-content-in` when the card clears  | —              | **0.127** (was 0.000) | —         |
| offer at 50 %                            | −360px earlier | 13030 (was 13390)     | —         |

⚠ **THE PAGE DOES NOT GET LONGER, AND THAT IS THE POINT OF PUTTING IT HERE.**
`proofPx` is untouched, so `--svc-proof-runway`, the runway's reserved height,
the ring's 500svh domain and `services-proof-runway-lockstep` are all
byte-identical. Only the ramp's OPENING moves inside it — which also hands the
same `smootherstep` ~1980px to run over instead of ~1080, so it does less per
pixel. That is the second half of the ask: faster to begin, gentler once begun.
It is also why the fix belongs in `proofP` space and not in
`RING_ENTRANCE_WINDOWS`, which ride the raw dissipate and saturated long before
this beat (the hook's own standing note).

⚠ **IT MAY NEVER OPEN WHILE THE LAST CARD IS STILL PARKED.** That card's hold
is only the tail's height — 216px at 900h, because sticky is bounded by the
containing block MINUS the element's own margin and the last slot keeps a 394px
one — so an overlap past `exit + hold` would start the offer under a card the
reader is still reading, which is a crossfade, not a handoff. At 1.0 the release
opens ~42 % into the exit at all three viewports.

⚠ **THE GUARD IS PINNED FROM BOTH ENDS AND WAS CALIBRATED, NOT MERELY GREENED.**
Either half alone is satisfiable by the wrong thing, so the smoke asserts
`--svc-content-in ≤ 0.01` while the last card is PINNED **and** `> 0` at the
scroll where its bottom clears the viewport (solved by scrolling by the measured
bottom — once unstuck the card moves 1:1 with the page, so it converges in one
pass). Setting the overlap back to 0 fails the second with `Received: 0`, which
is the old behaviour exactly.

⚠ **AND `.pf-slot:last-of-type { margin-bottom: 0 }` HAS NEVER MATCHED.**
`:last-of-type` counts by ELEMENT TYPE, and `.pf-stack__tail` is a `div` after
the slots, so no `.pf-slot` is ever the last of its type and the last slot
keeps its 394px margin. ⚠ **THIS UPDATE FIRST CLAIMED THAT WAS WHAT SHORTENED
THE CARD'S HOLD, AND THAT WAS WRONG — SEE U2.** The margin is inside the
sticky containing block on BOTH sides of the range (`block height − (element
flow bottom + its own margin)`), so removing it shortens the runway by exactly
what it removes from the element's own bound and the range is unchanged: 216px
either way. What the margin actually is, is the runway AFTER the last card has
cleared, over which U1's release runs — so zeroing it would pull the release's
opening in front of the card's unstick and break this update's own invariant.
The rule is dead, its intent does not apply to this layout, and the hold is the
TAIL.

## Update 2 — the last card is held as long as the one before it (2026-09-13, owner)

> Fix the last card's hold too.

U1 closed the gap AFTER the pile; this is the card the gap was in front of.
Every other card is held by the card that covers it — the last has nothing
above it, so what keeps it parked is the runway left under its own margin box,
which is the TAIL.

**Measured parked spans** — the scroll over which a card is arrived, uncovered
and still, which is the span in which it is a readable object rather than one
in motion:

| viewport  | cards 1 · 2 · 3 | last card | tail |
| --------- | --------------- | --------- | ---- |
| 1280×720  | 200 / 240 / 280 | **200**   | 173  |
| 1440×800  | 200 / 240 / 320 | **320**¹  | 320¹ |
| 1440×900  | 240 / 280 / 360 | **240**   | 216  |
| 1920×1247 | 280 / 360 / 400 | **280**   | 280  |

¹ after this update; the others are the before.

The pile ACCELERATES — each card is held longer than the last — and then the
final card got the shortest hold of the four. It arrived and left.

**The tail goes `clamp(160px, 24svh, 280px)` → `clamp(280px, 40svh, 400px)`**,
derived rather than picked: the target is the hold of the card immediately
before it (280 / 360 / 400 at the three reference viewports), because that is
the rhythm the reader has just been taught. The clamp lands 288 / 360 / 400.
Measured after: the last card holds 320 / 360 / 400, matching or just over its
predecessor at every viewport.

⚠ **THE HOLD IS THE TAIL, AND THE MARGIN CANCELS.** `position: sticky` is
bounded by the containing block MINUS the element's own margins, and the last
slot's 394px margin sits inside that block — so it is subtracted from both
terms and the range is the tail alone, to the pixel. That is why U1's note
about `.pf-slot:last-of-type` was wrong on its consequence and is corrected
above: zeroing that margin changes no hold at all, it removes release runway.

⚠ **GROWING THE TAIL MOVES THE HANDOFF WITH IT, WHICH IS WHY U1 SURVIVES
UNTOUCHED.** The card's unstick point and the pile's box shift by the same
amount and `releaseFrac` is derived from the box, so the release still opens
~42 % into the card's exit. Measured after: the offer still paints 240px
BEFORE the card clears at both 1440×900 and 1280×720 (it was −240 / −120).

⚠ **THREE NUMBERS MOVE TOGETHER OR THE RING'S DOMAIN DRIFTS.** A longer tail is
a longer PILE — 505 / 507 / 493svh, from 489 / 491 / 483 — so
`SERVICES_PROOF_PILE_VH` (the pre-hydration reservation, deliberately the
CEILING of the measured range) goes 4.9 → **5.1**, and with it
`SERVICES_PROOF_RUNWAY_VH` 6.1 → 6.3 and the hand-written `--svc-proof-runway`
literal 610svh → **630svh**. `services-proof-runway-lockstep.test.ts` is the
alarm on that pair and it is why the bump is one commit.

⚠ **THE GUARD IS BEHAVIOURAL, AND THE ARITHMETIC ONE FAILED FIRST.** The first
cut derived the sticky range as `runway.offsetHeight − (slot.offsetTop +
slot.offsetHeight + margin)` and read **125px against a 320px tail** — because
`offsetTop` on a STUCK sticky element reports its stuck position, which is
`seatProofCard`'s own documented finding one block up in the same file. So the
smoke walks the card instead: parked at its pin, still parked 80px before the
tail is spent, off its line 120px after. Calibrated both ways — reverting the
clamp fails with `Received: 192`.

⚠ **AND THE SAME TRAP BIT A SECOND TIME, ONE LINE EARLIER, AS A FLAKE.** The
walk rewinds above the pile first so the offsets it reads are FLOW offsets —
but the rewind was a single `scrollTo` + `settleScroll`, and `<html>` scrolls
smoothly while `settleScroll` returns at a 1600ms cap. From deep in the pile
that is a ~3000px animation, so under load it came back still travelling, with
a slot still stuck and its `offsetTop` still reporting the stuck position: the
pin moved and the hold checks measured from the wrong place. It passed alone
and failed in the pair, which is the signature. ⚠ **AND THE FIRST FIX HID IT**
— converging only the RETURN scroll made the walk land correctly and the
failure became deterministic, which is how the real cause surfaced. Both
scrolls go through one `scrollExactly` helper that converges on `scrollY`
now; three consecutive pair runs green.

## Update 3 — the ring parks as the last card clears (2026-09-13, owner)

> The cards from the services section should appear the moment the last card
> from the proof section has disappeared. Right now, it takes a few scrolls
> still before the cards from the services section come into view.

**This is U1's ask, read again — and U1 answered the wrong half of it.** U1
measured `--svc-content-in` and pinned it `> 0` at the clearing; that channel
is the DOM LADDER (masthead, plate cluster, designations, orbit draw-on). The
"cards from the services section" are the **WebGL ring**, and they were still
arriving a viewport later. The guard was green the whole time because it was
asking about a different object.

**Where the cards actually are.** `ringEntranceClock` (`CorridorArmillary`) is
`smoothedDissipate × proofRelease`, and the three VISIBLE cards fly in over
`RING_ENTRANCE_WINDOWS` `[0.58, 0.88]` — one window, all three, by ADR-029's
own design. Past the dwell the dissipate has saturated, so that clock IS the
release: the cards start at `proofRelease` 0.58 and are parked, with their hit
anchors published, at **0.88**. Under U1's ramp (`pileH − 1.0vh` →
`pileH + 1.2vh`) that landed 0.6–1.1 viewports after the card was gone.

**Measured before, at 1440×900** — the last card's bottom crosses the viewport
top at runway-relative scroll 4166:

| at the clearing                 | before (U1) | after (U3)      |
| ------------------------------- | ----------- | --------------- |
| `--svc-content-in`              | **0.121**   | **0.880**       |
| published `.svc-ring-hits__hit` | **0**       | 3 (within 24px) |

**THE SHARE IS SOLVED FROM THE CARD, NOT FROM A CONSTANT.** Two measured
positions, both runway-relative, both read off the LAST slot:

```
exit = pinTop + slotH      876px at 1440×900 — the card's own travel: its
                           bottom sits exactly this far below the viewport
                           top while parked, and moves 1:1 once released
gone = pileH − margin      4166 — where that bottom crosses zero
proofPx     = gone + (1 / PROOF_RELEASE_PARK − 1) × exit
releaseFrac = (gone − exit) / proofPx
```

The ramp OPENS at the card's release (`gone − exit`) and is stretched so
`PROOF_RELEASE_PARK` — `smootherstepInverse(RING_ENTRANCE_WINDOWS[0][1])` =
**0.734969**, new in `ringMath` — falls exactly on `gone`. Verified live: at
100 % of the exit the clock reads **0.880** against a derived 0.88.

⚠ **`exit` IS THE LAST SLOT'S PIN, WHICH IS `top-base + i·peek` = 220, NOT 64.**
That is where U1's own recorded 876px came from, and deriving it from the
constants without the peek term gives 720 — which is why this update MEASURED
it instead. `scripts/capture-proof-stack.mjs --handoff` prints the walk.

⚠ **THE OVERLAP CONSTANT IS DELETED.** `SERVICES_PROOF_HANDOFF_OVERLAP_VH`
(1.0vh) was a viewport literal answering a question about a card, and it could
only ever be right about the ladder. Its replacement is a derivation of the
ring's own windows, so **retiming an entrance window retimes the handoff with
it** — which is the one coupling that must not drift, because those windows
ride the raw dissipate everywhere else and nothing else would notice.

⚠ **U1's INVARIANT SURVIVES AND IS STRONGER.** "It may never open while the
last card is still parked" was a bound on how far the overlap could reach;
here the ramp's own zero IS the release point, so the whole of the card's hold
reads exactly 0.000 rather than nearly 0. The smoke still pins it at the pin.

⚠ **THE PAGE GETS ~1.6vh SHORTER, AND U1's "IT DOES NOT GET LONGER" IS
SUPERSEDED.** That sentence was a constraint U1 imposed on itself to leave the
runway's reserved height byte-identical; it is exactly what kept the cards
late. The share now ENDS SHORT of the pile's box — 78px at 1440×900, ~13–170px
across the reference viewports — because it stops inside the trailing margin
the last card has already vacated. Three numbers move in this commit:
`SERVICES_PROOF_RUNWAY_VH` 6.3 → **5.1** (the stack path is
`SERVICES_PROOF_PILE_VH` alone), the hand-written `--svc-proof-runway` literal
630svh → **510svh**, and `SERVICES_PROOF_RELEASE_VH` becomes the CASEFILE's
alone (unchanged at 1.2; `casefile-browse-map` still pins `2 + 1.2 = 3.2`).
The ring's domain is untouched by construction — the runway is
`--svc-proof-runway + 500svh` and the hook writes the measured share into it,
so `runwayH − writtenPx` is 5vh at every viewport, as it was.

⚠ **THE LOCKSTEP GUARD HAD A LATENT FLOAT BUG AND 6.3 DODGED IT.**
`6.3 * 100` is exactly 630 in doubles; `5.1 * 100` is **509.99999999999994**,
so the alarm failed on a correct pair and its own message instructed the reader
to write `509.99999999999994svh` into a stylesheet. Both sides round to six
decimals now — ~1e-4 of a viewport pixel, against a drift it exists to catch of
whole viewports. Calibrated: reverting the CSS literal alone fails with
_"services.css declares 630svh but SERVICES_PROOF_RUNWAY_VH derives 5.1
(510svh)"_.

⚠ **THE FLY-IN GETS A REAL SPAN, AND THAT IS WHY THE RAMP OPENS AT THE RELEASE
RATHER THAN AT THE PIN.** The visible cards occupy `PARK − start` = 0.192 of
the release, so they fly in over the last ~26 % of the card's exit — 229px at
1440×900, ~142 at 1280×720, ~281 at 1920×1247. Opening at the card's PIN
instead would have bought a longer fly-in and cost 28 % of the ladder painting
under a parked card, through glass, which is U1's crossfade in a new place;
opening at the clearing would have compressed the fly-in to ~80px, which is one
wheel notch and reads as a pop. Both were computed before this was chosen.

⚠ **THE EXIT GEOMETRY IS READ ONCE PER LAYOUT, AND NEVER FROM `offsetTop`.**
`proofExit` caches on the pile's height AND the viewport; it takes the computed
`top` and `margin-bottom` and `offsetHeight`, all layout-stable under scroll.
`offsetTop` on a STUCK sticky element reports its stuck position — the finding
`seatProofCard` and U2 both paid for. And ⚠ **not `:last-of-type`**: the dead
rule U1 found in the sheet is dead because `.pf-stack__tail` is a later `div`,
so the slots are selected by `[data-pc-slot]` and indexed.

**The guards.** `services-ring-math.test.ts` pins the inverse against the
forward function over the whole domain, its monotonicity, its clamping, and
that `PROOF_RELEASE_PARK` IS the visible cards' shared window end rather than a
literal beside it (plus that those three cards still share one window at all).
⚠ `smootherstepInverse` returns its endpoints rather than searching for them:
the quintic's first two derivatives vanish at 0 and 1, so `smootherstep` rounds
to exactly 0 and 1 across a neighbourhood and a bisection stalls ~2e-6 short.
The smoke pins the written share as the ARITHMETIC (never a number), that it is
shorter than the pile's box, `contentIn ≤ 0.01` at the pin, a ramp reading
`0.15 < x < 0.85` with zero anchors halfway through the exit, `contentIn ≥
0.88 − 0.03` at the clearing, and anchors published 120px past it. **Calibrated
against U1's own code**: the halfway ramp check fails with `Received: 0`.

**Left open:** the masthead's decode (`REVEAL_AT` 0.5 on the release) now fires
while the last card is still on screen, so it types under the card's glass
rather than onto an empty frame. Read live before deciding whether it is a
defect or the beat working.

## Left open

- **The casefile and its guards are still on disk.** One decision, after the
  owner's live read; `browseMap.ts`, `ClientTabs`, `Directory`,
  `TrackProofRegister`, `TrackPanel` and ~2,000 lines of `casefile.css` go with
  it, and the four plates do not.
- **`/claude-workshop` inherits the beat**, because it mounts the same
  `ServicesStage`. That is consistent with how it inherited the casefile, and
  it has not been read.
- ⚠ **A "PRE-EXISTING STATION OVERFLOW" WAS RECORDED HERE AND WAS NOT REAL.**
  Mid-pass the instrument band appeared to clip ~150px on the right at
  1440×900 — `.station:not(.hero)` measuring 1730px, its content box running
  145 → 1585 against a 1434px client width — and an A/B with the casefile
  restored showed the same clip, which is what made it read as the site's own.
  The cause was `touch tailwind.config.js postcss.config.js` used to bust a
  cache: the repo has `.ts` and `.mjs`, so `touch` CREATED empty `.js`
  siblings, PostCSS resolved the empty one, and **the whole Tailwind preflight
  disappeared** — `body` back to its 8px UA margin and everything to
  `box-sizing: content-box`, which is what turns `width: 100vw` plus two 145px
  paddings into 1730. On a clean build `#services` is 1440 and the pile runs
  145 → 1295, inside the frame.
  ⚠ **THE LESSON IS THE DURABLE HALF, AND THE A/B DID NOT CATCH IT**: both
  sides of a comparison run on the same broken stylesheet, so an A/B can only
  ever say "not caused by this change" — never "this is how the site is".
  Check `getComputedStyle(document.body).margin === "0px"` before believing any
  width finding on this repo.

- ~~**The last card's dwell is long** (its own margin plus the tail, ~71svh)
  before the release.~~ **CLOSED at U1** (2026-09-13) — he read it as slow, and
  it was one constant: `SERVICES_PROOF_HANDOFF_OVERLAP_VH`.
- ~~**The last card's own HOLD is short** — 216px, the tail.~~ **CLOSED at U2**
  (2026-09-13, same read) — the tail is now sized to the hold of the card
  before it.
