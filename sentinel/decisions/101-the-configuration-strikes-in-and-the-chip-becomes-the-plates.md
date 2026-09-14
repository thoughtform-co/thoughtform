# ADR-101: The configuration strikes in, and the chip becomes the plates

**Status:** §A Proposed (2026-09-14) — shipped and guarded, pending the owner's live read. §B is not built yet.
**Surface:** `#proposition` and `#offer` on `/arcs/trinny-london/proposal` (ADR-093 → ADR-094 → ADR-099 → ADR-100).
**Supersedes on this page:** ADR-095 U6's half-viewport lead (the lead is a WHOLE viewport now, §A.1) and the arcs' IO rise on these two beats alone (§A.4).
**Related:** ADR-097 U11 (the proof card's strike-in, which this copies), ADR-021 (the motion law and its one sanctioned exception), ADR-060 (the hero's slice-tear, which this is NOT), ADR-100 U4 (the board the strike lands on), ADR-098 U5 (the plates the chip becomes, §B).

## The ask

Owner, 2026-09-14, reading the four-surface pass live, in one message of seven asks. Three of them are this record:

> 1. When you scroll from the "And now we bring this to Trinny London" section to the next section, the elements of the next section, where the studio stands, don't have to fly in. They don't have to have a movement. They need to have a glitch effect like we have on our homepage. Let's make sure it only happens when all the elements from the "And now we bring this to Trinny London" section have faded out.
> 2. Once you're done with the studio today and configured, and you scroll to the next section, we also want the elements from the next section to glitch into view. This is super important, so use the proper sub-agents to scope this.
> 3. The AI capability card at the center moves into the center of the screen, and then it copies itself left and right. That becomes the cards from the "We propose a modular approach" section … I don't want fucking cross-dissolves. This really needs to be an elegant transformation of the element.

§A is asks 1 and 2. §B is ask 3, with the plates' material (ask 4) — not built yet.

## §A · Both beats strike in

### A.0 · Which glitch, and why it is not the other one

Two effects on this site answer to "the homepage's glitch", and only one of them can be pointed at a live beat.

**The hero's** (ADR-060, `lib/key-visual/themeGlitch.ts`) is a CANVAS: it samples the painted page, tears it into slices and rebuilds it. That is exactly right for swapping one whole image for another, and it cannot be aimed at a DOM beat holding two `<svg>` drawings and a decoding head — there is nothing to sample until the thing is already visible, which is the frame the effect exists to replace.

**The proof card's** (ADR-097 U11) is CSS on the object itself: a band comb on its own `clip-path`, the `#about` power-on curve with a self-cancelling 2.5px tear, and the hologram's chromatic resolve. It materialises a COMPOSED thing in place. That is the ask, so that is what is copied — keyframes and values unchanged, renamed `tl-glitch-*` in the route's own sheet. ⚠ **Copied, never imported:** a route sheet reaching into a landing sheet is a dependency in the wrong direction, and the arcs already say so of `pda.css` one object over.

### A.1 · The lead is a whole viewport, so the two clocks saturate together

A strike has two preconditions the reader can see: the frame before it must be EMPTY, and the thing struck must already be COMPOSED and seated. Under ADR-095 U6's 50svh lead neither held at one scroll position — the record was half arrived and still rising at the turn's `p = 1`, which was the right answer while it arrived by travelling and the wrong one now.

`--tl-prop-lead` 50svh → **100svh**. `#turn` is a 100svh pin plus a 120svh runway, so

```
q(p) = (p × 220 − 220 + lead) / 100
```

and at lead 100 that is `q = 1 ⟺ p = 1`: the products are gone (`TURN_PRODUCT_GONE`), the line is un-typed (`TURN_CTA_GONE`) and the head is on its datum, on one frame. Measured at 1920×1247: the turn's release and `#proposition`'s top are the SAME document y (20500), and the smoke pins that to ±2px.

⚠ **Two derived constants moved with it and both had to.** `TURN_PROP_VEIL_IN` was 0 and is **0.384** — the q at which `veilOf` saturates, `(0.72 × 220 − 120)/100` — and `TURN_PROP_VEIL_FULL` was 0.5 and is **1**. At the old lead `q` opened PAST the first ramp's end, so a 0 start was merely safe; at this lead it opens in the middle of it, and 0 would have the turn and the arrival both moving the one channel that has exactly one owner by contract. The test derives both from the lead it reads out of the sheet rather than restating them.

⚠ **The named cost is 13px of scroll at 1247h.** From the strike's threshold to `q = 1` the frame carries the coral ground and the mark's ghost and nothing else. That is the owner's own ordering, stated as a price rather than hidden.

### A.2 · The trigger is a hysteresis, because a burst has a direction

Everything else on this route is a pure function of scroll and reverses exactly. A burst cannot be — it is ADR-021's one sanctioned exception: a bounded burst on a hysteresis trigger. `arriveNext(prev, v, inAt, outAt)` is that trigger, pure and unit-pinned: `await` → `in` at the in-threshold, `in` → `out` below the out-threshold, `out` → `in` again. ⚠ `await` and `out` paint identically and are NOT the same state — `out` plays the 260ms reverse, `await` has never been seen, and collapsing them strikes the record out on the way in.

⚠ **NaN leaves the state alone** (a rect read during a relayout must not fire a burst), and ⚠ **a deep reload seeds `in`** (landing mid-page plays the strike once and ends on the cascade, where seeding `await` would leave the beat hidden until the reader scrolled back and forward again).

**The thresholds, and one of them is not the obvious number.**

| stamp                   | host           | in         | out        |
| ----------------------- | -------------- | ---------- | ---------- |
| `data-tl-prop-arrive`   | `#proposition` | `q ≥ 0.99` | `q ≤ 0.96` |
| `data-tl-phases-arrive` | `#offer`       | `t ≥ 0.8`  | `t ≤ 0.7`  |

⚠ **`PROP_ARRIVE_IN` IS 0.99, NOT 1, AND THE DIFFERENCE IS MEASURED.** `propArrival` is a `clamp01`, so `q === 1` is reachable only where the station's top is at or above zero EXACTLY — and every converging roller on this surface (the capture's, the smoke's) lands at top **0.22px**, i.e. q 0.99983, with the record still hidden, every stamp correct and nothing failing. A threshold no measurement can rest on is a threshold that fires by luck. What the owner asked for is that the frame be EMPTY, not that a number be 1, so that is what is asserted: at q 0.99 the turn's p is 0.9955, where `ctaInkOf` is **0.0009** and the loudest product's opacity is **0.0054**. ⚠ The guard walks ALL FOUR products, because the exit stagger runs BACKWARDS and a spot check on k = 3 reads seven times low.

### A.3 · The seam is `#offer`'s own clock, and the phases hang on it

`t` runs 0 → 1 from the frame `#phases`' top reaches the viewport's bottom — which IS the configuration seated, since `#proposition` is exactly one viewport — to the frame its plates row is whole in view. `seamLanding(vh, rowBottom) = max(0, vh − rowBottom)`; ⚠ **the floor binds at 1280×720**, where the row overflows its own beat by 23px (pre-existing), and a negative target would run the ramp past 1 and invert its end.

⚠ **`t` JOINS THE DELTA GATE, AND THAT IS NOT OPTIONAL.** `p` and `q` both saturate the moment the record lands and agree forever after — which is the whole of `#offer`'s scroll. A gate on those two alone returns before the seam is ever read and the phases' strike simply never fires.

⚠ **AND `#phases` IS NOT THERE WHEN THE WRITER MOUNTS.** `#offer` is a nested root that mounts on approach; a `querySelector` taken in the effect body returns null forever, which reads as a seam pinned at 0 and a beat that never strikes, with nothing throwing. Found by looking at a still, not by a gate. The element is resolved in `measure()` and re-resolved from a `ResizeObserver` on `[data-tl-config-root]` and `[data-tl-offer-root]` — the one signal that says _the thing you could not find is here now_, and it covers a font swap and an image settling for free.

### A.4 · Nothing rises, and the resting paint has to come back with the animations

`ArcShell`'s IntersectionObserver still runs and still stamps `.is-in`; what it drives is neutralised route-wide on these two beats, at ID specificity, which is the board wrapper's own precedent in `arcs.css`. A beat that struck AND rose would be two entrances at once.

⚠ **TAKING AN ANIMATION AWAY TAKES WHAT IT WAS HOLDING UP.** ADR-100's ladder rests `.arc-board__in` and `.arc-board__bloom` at `opacity: 0` and relies on `arcBdIn`'s `forwards` fill to hold them lit; it rests every ribbon at a full `stroke-dashoffset`, i.e. UNDRAWN, and only `arcBdWire` ever put them back. With the ladder replaced and the strike ending on the cascade, the board would have struck in and then vanished on its own last frame. Both resting states are restored explicitly on this route.

### A.5 · The delays ride a custom property, which is ADR-100 U3's lesson taken properly

U3's ladder lost every `animation-delay` to the four-class `animation:` shorthand that started it — silently, because a delay that does not apply errors nothing, logs nothing, leaves the still identical and reads as a taste decision. Its fix was to out-specify the shorthand, which works and can be lost again.

Here the delay is declared INSIDE the shorthand as `var(--tl-gl-d, 0ms)` and the per-rung rules set a PROPERTY, not a longhand. A shorthand cannot reset what it is reading. There is no specificity race left to lose.

⚠ **`animation-fill-mode` IS `backwards`, NEVER `forwards`.** Every last frame here IS the cascade's own identity, so ending on the cascade cannot pop — but a rung with a delay would otherwise sit fully lit for the length of that delay and then snap to zero, which is the ladder playing backwards.

### A.6 · The combs, and the two of them

**`tl-glitch-bands`** is OVERSCANNED by `--tl-gl-o: 48px` on every side, with an identity frame LARGER than the box it cuts. The head hangs its designation, its origin cross, two coord stamps and its close cross outside its own border box; a comb running 0 → 100% guillotines all four for 420ms and the head reads as losing its chrome rather than as arriving.

**`tl-glitch-bands-plate`** carries the plate's silhouette instead: band 0 holds the top-right cut, and the last frame is STRING-EQUAL to `.arc-plate`'s own `clip-path`, so the animation and the cascade end on one polygon and removing the animation is a no-op on the pixels. No overscan there — the plate's box IS its edge, and an overscanned frame would cut the notch off for the length of the burst.

Both are ONE polygon with the bands bridged down the left edge, non-zero winding, never `evenodd` (which would cancel the bridges).

⚠ **THE CHROMA RIDES THE ROWS AND THE FOOT, NEVER AN OPAQUE PLATE.** `filter` applies to an element's whole rendered output and the plate's `clip-path` is applied AFTER it, so a split on the plate is a split of one opaque slab and then clipped away. On the rows there is an alpha edge to split.

⚠ **ON PARCHMENT THE BRIGHTNESS GREYS THE INK FOR ~70ms.** This route is light-locked, so unlike the proof card's home the 1.16 lift works against the ground rather than with it; the drop-shadow split is what carries the effect. It is the one dial.

### A.7 · What the hide has to do besides hiding

⚠ **`visibility: hidden`, not merely `opacity: 0`, and the station takes `pointer-events: none` while it waits.** The stations overlap by a WHOLE viewport now, so for the turn's last screen `#proposition` is laid out directly over the turn's own button — and a transparent box swallows the one link that beat offers. The smoke asks it from the LINK's side (`elementFromPoint` at the CTA's centre), because that is the failure a reader meets.

⚠ **THE PLATES TAKE `visibility` ALONE.** Their head band is what the chip becomes in §B, and the carrier has to be able to re-declare that band visible under this hide while the body stays away.

⚠ **AND AN ABSENT STAMP MEANS SHOWN.** The writer parks — removing every stamp — wherever the beat cannot run: a phone, a short window, reduced motion. That is this route's own polarity law one station over (ADR-099's ground). If it ever meant HIDDEN, the readers who cannot see the burst would be the readers who cannot see the record either, and nothing on any other path would fail. Pinned by its own case.

### A.8 · The ladders

The board still ASSEMBLES outward from its chip and the ledger is still five rows READ IN ORDER, slower — ADR-100 U3's ruling survives the change of mechanism. Strike 640ms on the board (card 80 · seat 160 · lane seat 240 · lane layer 300 · layer 360 · lane tools 360 · tools 440 · lane reach 480 · reach 560), **960ms** on the ledger (seat 80 · layer 220 · card 360 · tools 500 · reach 640), last rung at 1.60s against the board's 1.20s. The phases: head 0, plates 160 · 300 · 440.

### Files

`app/(marketing)/arcs/trinny-london/proposal/turn/{turnClock.ts, useTurnScroll.ts}` · §10 of `app/(marketing)/arcs/trinny-london/proposal/trinny-london.css` (plus the lead, §9) · `tests/lib/trinny-mark.test.ts` · `tests/visual/trinny-london-smoke.spec.ts` · `scripts/capture-trinny-london.mjs`. ⚠ **Nothing in `components/arcs/` and nothing in `arcs.css`** — every rule is `#proposition`- or `#offer`-scoped, so `/arcs/suri-proposal`, `/arcs/perfect-ted-proposal` and the portfolio are byte-identical.

### Guards

**Unit** — `arriveNext`'s whole transition table including the NaN and deep-reload cases, the two threshold windows ordered and apart, the seam's endpoints and monotonicity and its floor at 720h, and the lead read OUT OF THE SHEET with the veil's two keys derived from it (a literal copy keeps passing against the value it was written for, which is the one failure a clock test exists to catch).

**Smoke** — three cases. `both beats STRIKE in, seated, and nothing rises` walks await → in → settled → out → in, pins the `animationName` on the head, both svgs and all ten role groups, asserts the CTA is reachable from the link's side while the station waits, and then asserts the phases on the seam. ⚠ `animationName` is the DECLARATION, not the state — "did it finish" is asked of `getAnimations()`, and `settleStrike` waits on `.finished` with a `catch` (an animation cancelled mid-flight REJECTS) rather than on a fixed timeout, because a strike's length is a LADDER and not a duration. `under reduced motion nothing strikes, and nothing is hidden` is the fail-open case. `the approach is spent` replaces ADR-095 U6's "halved" pin with ±2px of zero.

**Capture** — `19-turn-empties` (the frame handed over), `20-config-strike` at +260ms (inside the strike's own dead band, where the comb is still cutting), `20b-config-struck` at +1.66s (past the ledger's last rung), and `21a-phases-strike` before the settled `21-offer-phases`.

## §B · The chip becomes the plates

Not built. Scoped: the chip detaches, travels to the frame's centre, copies itself left and right and lands as each plate's HEAD BAND with the body unfolding beneath, on a carrier layer driven by the same seam clock `t`; the plates' DELIVERABLE foot takes the chip's gold wash. The design calls are recorded in the plan; this section is written when it ships.

## Left open

- **The brightness on parchment** (A.6). 1.16 is the proof card's value on a dark ground; it greys the ink here for about 70ms. One number, owner's read.
- **A fast flick** lands the phases' head band inside the plates' comb for a frame or two (0.8 → 1.0 in under 420ms), and a continuous scroll through the configuration's threshold has the board still striking while the seam has already opened. Both are the nature of a burst on a scroll trigger; both are named rather than fixed.
- **The beats below `#phases`** keep the plain rise. The owner asked for "the next section"; a consistency pass over the flow, the fee and the close is CSS only and is not taken.
