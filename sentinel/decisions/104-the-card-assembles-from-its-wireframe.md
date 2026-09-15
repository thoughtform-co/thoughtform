# ADR-104: The proof card assembles from its wireframe

- **Status:** Proposed (2026-09-15) — shipped and guarded, pending the owner's live read
- **Surface:** `#services`' evidence beat, proof card 0 only
- **Supersedes:** nothing. It EXTENDS [ADR-097 U11/U12](097-proof-card-is-a-folder.md);
  every number and every law of the aperture itself is untouched.
- **Rules:** [`.claude/rules/proof-stack.md`](../../.claude/rules/proof-stack.md) §The folder

## The ask

Owner, 2026-09-15:

> Looking at the homepage, we have that cool effect where the first card of the proof
> slides open. I think, to make it a bit cooler, I would like it to first show a
> wireframe of all the elements when it slides open, kind of like what we have with the
> software for few. We build the tools and the wireframes needed for the layout of the
> card. Once it's fully open, all the content is actually revealed, because the
> slide-in opening with the thumbnail of the ATL doesn't really work.

Card 0 is `atl-films` (`proofOrder.ts` — the pile is the record's own arc order, and the
frontier work opens it). So what ADR-097 U12's aperture sweeps open onto is a 4:5 film
poster at three-quarters of the card's height: the beat reads as a PICTURE arriving,
which is the one thing this surface does not do anywhere else. Every other instrument on
the site draws a record.

## The decision

The aperture reveals the card's own layout, DRAWN; the card holds it for a beat; and a
second sweep of the same scan fills it with the real content.

```
PASS 1  the card opens        720ms  — UNCHANGED, `.pf-card`'s own aperture
        ├─ the head band is REAL and sweeps in with the housing
        ├─ the skeleton is whole, below the band
        └─ `.pf-card__body` alone is held at a centre slit
HOLD                          200ms  — the skeleton registers as a STATE
PASS 2  the content fills     720ms  — one travelling edge pair
        ├─ the body's clip window grows centre-out to full
        └─ the skeleton's two halves retract to their own walls
REST                                 — the cascade: body unclipped, skeleton gone
```

`ProofCardWire.tsx`, `.pf-cardwire*` in `proof-stack.css`, one `wire` prop threaded
`ProofStack` → `ProofCard`. **Card 0 alone**, because the aperture is card 0's alone and
a skeleton on a card with no aperture is a layer that never paints.
`/arcs/trinny-london/proposal` passes no `arrival`, renders no skeleton, and is
byte-identical.

## Why it is drawn this way

### ⚠ PASS 2's 720ms IS DERIVED, NOT CHOSEN

Its edges travel the same ~575px per side as pass 1's, on the same object, so they take
the same time — same edge speed, same `cubic-bezier(0.65, 0, 0.35, 1)`. This is ADR-097
U12's own lesson read forward: **copy a reference for what it DOES and re-solve its
timing for the size of the object — and when the object is the same size, the timing is
the same.** A quicker second pass would have been a taste call with nothing behind it,
and it would have undone the owner's own ruling on pass 1 (_"a bit more subtle … a bit
too fast … easy in, easy out"_). The 200ms hold is the one dial.

### ⚠ THE HEAD BAND IS NOT SKELETAL, AND THAT IS A RULING

The band is the card's own MATERIAL — the client's gradient over the TR+BL housing
(ADR-097 U1) — not its content, and it is the one strip a covered card shows. Blanking
`LOOP EARPLUGS · NAVIGATE` for 900ms would cost the folder its identity and buy nothing.
**The folder arrives real and its CONTENTS are drawn.** The skeleton insets by
`--pc-peek`, not by `0`, and pass 2 clips one element instead of two.

### ⚠ PURE MOTION, ZERO FADES — ADR-097 U12'S LAW, UNCHANGED

Pass 2 is `clip-path` only. No opacity curve, no tear, no `filter`. The retired
`pf-glitch-strike` was three large-area luminance transitions inside 378ms (~4 dark↔light
alternations a second, against WCAG 2.3.1's three-per-second general-flash threshold) and
the owner pulled it as a seizure risk. **A crossfade between skeleton and content would
be that defect in a new costume** — which is why the handoff is a seam, not a dissolve.

### ⚠ THE COMPLEMENT NEEDS TWO HALVES, AND THAT IS ARITHMETIC

At fill progress `t` the content occupies `[50 − 50t, 50 + 50t]` and the skeleton must
occupy the two OUTER bands — a disjoint shape **one `clip-path` polygon cannot
describe**. So `ProofCardWire` renders the drawing TWICE, once per half, each clipped
with an `inset()` retracting to its own wall. The duplication is a rendering technique
rather than a content fact, so it lives inside the component and the call site sees one
element. Measured at every frame: body `46.46%` / skeleton `53.54%`, body `25%` /
skeleton `75%`, body `3.54%` / skeleton `96.46%` — complementary to the last digit.

`inset()` and not `polygon()`, because **the children of a chamfered box are square**
(ADR-065 rule 4): no chamfer is interpolated here, so the simpler function is also the
correct one.

### ⚠ CLIP THE CHILDREN, NEVER `.pf-card`

`backdrop-filter` is declared on `.pf-card` alone (`proof-stack.css:345-348`) and **no
descendant carries one** (verified by sweeping the sheet), so clipping `.pf-card__body`
cannot blind the glass — where a clip on the card or on the slot would. That is the trap
ADR-097 U12 already records for pass 1, and it is why pass 2 could be built at all.

### ⚠ `backwards`, NEVER `forwards`

Pass 2 carries a 920ms delay (pass 1 plus the hold). `backwards` holds each animation's
`from` frame through that delay — the slit, and the two halves — and then the animation
falls to the CASCADE: no clip on the body, fully retracted on the halves, which is each
element's own resting declaration. A `forwards` fill would pin an `inset()` on the body
for the rest of the card's life. ADR-101's own ruling, and the reason `fill-mode` is
`none` on pass 1.

**The close needs no mirror.** On `out` the card runs the existing 420ms
`pf-aperture-close` and the `out` cascade is `opacity: 0; visibility: hidden`, so the
interior's state is unobservable through it; re-arming lands on `await`, whose rules
already say "body at the slit, skeleton whole". One keyframe trio, not two.

### ⚠ IT IS THE CARD'S OWN LAYOUT, MEASURED FROM THE CARD'S OWN TOKENS

Every box mirrors a real one — `.pf-card__body`'s `2fr 3fr` grid, the record's
`auto auto 1fr` rows and its `--pf-card-py` / `--pf-card-px` padding, the register's
`minmax(0, 1fr)` bands and **both** of its rule weights, the field's `--pf-field-px`
inset and `--pf-frame-gap` air, the rail's `--pf-rail-hang` + `--pf-rail-h` row, the
frame's 1px border, the film's height-bound `100cqh` width expression.

**That registration IS the effect.** The content has to look like it FILLED the
wireframe; a bar that is not where its line of type will be turns the handoff into a cut.

### ⚠ A BAR IS A LINE, AND ITS ROW IS THAT LINE'S BOX — THE FIRST CUT GOT THIS WRONG

Drawn as one bar for the title and two for the lede, the register sat **111px high**
(claims at y232 against the real y343) and the left column read as a different card while
every other measure was correct. The title wraps to TWO display lines and the lede sets
FOUR, so each block is a grid whose `grid-auto-rows` is `font-size × line-height` off the
same two tokens the real type uses (`--pf-display × 1.1`, `--pf-copy × 1.45`). Measured
after: lede, claims, claim 0, the rail row and the bay all at **dy 0**; the film within
2px.

⚠ **The line COUNTS are card 0's own.** That is what "authored against card 0" costs, and
a copy edit long enough to add a line moves this with it.

⚠ **The caption is two lines because the film is CENTRED in its frame** — the caption's
height is what seats the plate, and a one-line stand-in put the plate 14px low.

### ⚠ IT IS DRAWN IN THE CARD'S OWN TOKENS, NOT IN `--w-*`

The casefile's wireframe kit (`casefile.css`'s `.fl-wire__in` block) is the grammar the
owner named, and its values are `rgba(dawn, .15)` hairlines over `rgba(dawn, .13)` fills
— within a hair of this card's own `--pf-rule` (.18) and `--pf-rule-soft` (.12). Using
the CARD's tokens gets the same look AND **makes the handoff seamless, because the lines
that survive into the filled card — the frame, the rail boxes, the register's two rule
weights — are then literally the same colour they were in the skeleton.** Shelling in
`.fl-wire` would also have imported `container-type: size` and a flex column the drawing
immediately overrides, and a third copy of the `--w-*` block was the alternative.

One new value: `--pf-wire-fill: rgba(var(--dawn-rgb), 0.1)`, a ramp step off `--dawn-rgb`
like every other colour in the sheet, so ADR-058's flip paints it on parchment with no
branch. Verified in light: the skeleton re-derives, no `[data-theme]` rule.

### ⚠ IT LETTERS NOTHING

Bars, boxes and hairlines only. `--fl-mono` resolves only inside `.fl-case` / `.arc-*`
and this card is neither, so a label would inherit a third face (ADR-067's standing
trap); and a drawing with no strings is outside the confidentiality scanner by
construction. The smoke pins `innerText === ""`.

### ⚠ TWO HARNESSES WERE MEASURING THE WRONG THING, THE SAME WAY

`Element.getAnimations()` returns only animations targeting THAT element. Pass 2 runs on
`.pf-card__body` and the two halves, which are DESCENDANTS — so:

- `capture-proof-stack.mjs --glitch` cancelled, paused and seeked only pass 1, and would
  have shot a strip with pass 2 running free;
- `services-ring-smoke`'s `settleArrival` returned at **720ms** instead of 1640ms, handing
  every plate reading after it a half-filled card — **the exact flake that helper was
  written to remove, one pass later.**

Both take `{ subtree: true }` now, and the helper's cap rose 3000 → 5000ms (the beat is
1640ms and 3000 would have clipped it under load). **A guard that walks an element cannot
see the work you moved into its children** — the third time this shape of blindness has
cost this surface a pass (ADR-069 U1's per-object measurement, ADR-085 U2's compat alias).

## Guards

- `services-ring-smoke` — the existing aperture block gains: both halves present, ZERO on
  card 1, the body back on `clip-path: none` when settled, both halves fully retracted,
  and the skeleton lettering nothing. The running-animation count is subtree-aware.
- `trinny-proof-order.test.ts` — **card 0's visual kind must be `films`.** The skeleton
  follows POSITION and the drawing is authored against a field: put the tools card first
  and it still renders, still registers against nothing, and still fills. It would simply
  be a picture of the wrong card, and this is the one assertion that fails on it.
- `type-material-tokens` and `theme-css-sweep` — green; the sheet stays token-only.
- `trinny-london-smoke` is the byte-identity proof. ⚠ At the time of writing one case on
  that route fails for an unrelated reason (a null element in the ADR-101/103 scene,
  another session's in-flight work); the failure predates this change and names none of
  these selectors.

## Verifying

```bash
node scripts/capture-proof-stack.mjs --vp 1440x900  --theme dark  --glitch 0,360,720,920,1100,1280,1460,1640
node scripts/capture-proof-stack.mjs --vp 1440x900  --theme light --glitch 920
node scripts/capture-proof-stack.mjs --vp 1920x1247 --theme dark  --glitch 920,1280   # the owner's window
npx playwright test tests/visual/services-ring-smoke.spec.ts --project=desktop
npx vitest run tests/lib/trinny-proof-order.test.ts
```

⚠ **Cancel the animations before restarting a replay** — toggling the attribute alone
ADDS a CSS animation the WAAPI has paused rather than replacing it.

## Left open

- **The fill is ONE sweep.** A per-region staggered assemble — each region on its own
  centre-out aperture, ADR-103's stage grammar — is the available elaboration and is
  deliberately not in the first cut. _Simple means the minimal first cut._
- **`--pf-wire-fill` at .1 is the dial** if the skeleton reads too quiet. It sits below
  the card's own `--pf-rule` on purpose, so structure is louder than placeholder content.
- **The skeleton's DOM exists below the inert rung**, hidden and inert, rather than being
  conditionally rendered. ~40 absolutely-positioned divs; named rather than optimised.
