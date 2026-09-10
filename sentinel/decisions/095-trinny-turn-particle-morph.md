# ADR-095: The turn — the parked mark morphs into the client's

**Date:** 2026-09-09 (U1 the same day)
**Status:** Proposed — shipped and guarded, pending the owner's live read
**Surfaces:** `app/(marketing)/trinny-london/**` (`TrinnyPortals.tsx`, `mark/**`, `turn/**`, `trinny-london.css`), `public/prototypes/v7/landing-trinny-london.html`, `public/trinny-london/trinny-london-mark.svg`, `lib/brandmark/morphTargetRef.ts` (new), `components/brand/BrandmarkPhysicsCore/{shaders.ts,BrandmarkPhysicsCore.tsx}`, `components/landing/home-v2/DepthGatewayScene/{BrandmarkPhysicsCoreActor,CorridorArmillary}.tsx`
**Related:** ADR-044 (the masthead decode this reuses), ADR-094 (the page this turns), ADR-023 (the physics core whose attribute this mixes), ADR-021 (the corridor exit; no wall-clock motion behind readable content), ADR-030 §6 (the seam bug the kill edge answers), ADR-082 (the `-120svh` overlap precedent), ADR-065 (corners — the mark's monogram is square), ADR-092 (the type tokens the sheet stays pinned to)

## Context

ADR-094 gave `/trinny-london` its proof stack and, after it, the interstitial
that turns the page to the client. The owner's read: the parked Thoughtform
mark that stays behind the stack is the best thing on the beat, and the turn
should happen TO it — as the reader scrolls out of the last card, the mark's
particles should re-form as Trinny London's logo, a real particle transition
and explicitly not a cross-dissolve, with the four product cutouts sweeping in
around the new mark, and the interstitial copy after that. Also asked for: a
vector SVG of the logo and a 3D wireframe-ish particle version of it.

Four decisions he took at the design step: the mark settles on Trinny coral
(`#F06850`, the route's `--tl-brand-rgb`); the two structural orbit rings
FADE OUT with the morph; `#trinny` stays as its own coral copy slab below the
beat, without the products; and the products SWEEP IN on a scroll-driven arc
then hold — a continuous rotation behind readable content is banned on the
landing (ADR-021's 2026-07-05 addendum, the motion-sickness ruling).

Three facts shaped the mechanism. The parked mark is `THREE.Points` whose drawn
position at rest is literally its `aTarget3D` attribute (every drift term is
×0 at the park). The corridor is prop-less from `LandingPage` down, so the
only route seam is a module ref or an `<html>` attribute read at mount. And
there was no scroll channel from the proof stack into the frame loop — the
stack writes only inline slot vars.

## Decision

### 1 · A registry, three-free — `lib/brandmark/morphTargetRef.ts`

A route registers `{ spec, progress }`: the spec names a lazy builder
(`load: () => import(...)`), the settle colours and the flight lift; `progress`
is the eased 0→1 clock. `readBrandmarkMorph()` is **0 whenever no spec is
registered**, and every consumer is an exact identity at 0 — which is what
keeps `/` and `/claude-workshop` pixel-identical without a flag. `TrinnyPortals`
sets it in the SAME layout effect as `data-services-ring` (layout effects run
in tree order in one commit, so the ref is visible before anything in the lazy
corridor chunk mounts) and ONLY when the capable rung matches — mobile and
reduced motion would otherwise build a target nothing drives. ONE writer of
`progress`: the route's turn writer.

### 2 · The shader gains a second home, always declared

`aMorphTarget` (vec3, a COPY of `aTarget3D` until a target is written in), `uMorph`,
`uMorphLift` (vertex-only), `uMorphColor`/`uMorphAccent` (fragment-only) and a
`vMorphT` varying. After the corridor's wind block:

```glsl
float mT = smoothstep(0, 1, clamp((uMorph − stagger·0.35) / 0.65, 0, 1));
pos = mix(pos, aMorphTarget, mT) + morphDir · sin(mT·π) · uMorphLift;
```

with a per-particle stagger hashed differently from the corridor's own, and a
hashed flight direction with real Z so the swarm passes through depth. The
colour crosses as a VARYING so `uMorph` stays vertex-only and the shared-
uniform precision trap (`shaders.ts` L92-104) never applies. A mid-flight size
lift and the depth dim's return on the morphed target ride the same clock.

**Not a `defines` toggle.** The material memo has `[]` deps: a define decided
when the async target arrives would need `needsUpdate` (a mid-page recompile),
and one decided at mount yields a second program no lab exercises. Always-
declared is identity by IEEE arithmetic (`mix(x, y, 0.0)` is `x`; the bulge is
scaled by `sin(0)`), and no test pins the GLSL string — the HUD snapshots and
the corridor smokes on `/` are the proof, and they pass unchanged.

⚠ **The flight direction is NEVER `normalize()`d.** A hashed vector can be zero,
`normalize` of zero is NaN, and `NaN · sin(0)` is NaN — it would corrupt the
PARKED mark at `uMorph` 0, on every route.

### 3 · The target arrives late and is written INTO the attribute

`BrandmarkPhysicsCoreWithGLB` reads the spec once at mount (the `ringOff`
idiom), `load()`s the builder and hands it the mark's OWN normalised homes
(`targetHomes`, ±0.5 half-extent) and the slot count. The result is `.set()`
into the existing `aMorphTarget` attribute by an effect — never a geometry
rebuild, which would dispose and re-upload every attribute while the corridor
is painting. A rejected load leaves the mark ours, silently.

### 4 · The client's mark: measured, not traced

No tracer exists in the repo (`sharp` only), and none was needed: the source
PNG (1271², flat colour on alpha) was MEASURED — the ring's two radii off the
centre row and column, each glyph's rectangles off its connected component
(`trinnyMark.ts`: ring 635.5/564.5; T = `(412,459)(677,459)(677,554)(503,554)
(503,1051)(412,1051)`; L = `(740,228)(831,228)(831,820)(566,820)(566,725)
(740,725)`; squares `(239,459,120×95)`, `(884,725,120×95)`; ink `#56565A`).
Three copies derive from those numbers and `tests/lib/trinny-mark.test.ts` pins
them together: the SVG asset (`trinnyMarkSvg()` verbatim), the inline fallback
in the prototype, and the 3D target. ⚠ Each glyph is ONE outline — two
overlapping rectangles would put a sampled seam through the junction.

`buildTrinnyTarget.ts` extrudes the outlines (`THREE.Shape` → `ExtrudeGeometry`,
depth DERIVED from the base's own `max|z|` so the two wireframes are one
material) and edge-samples them with the SAME sampler the corridor uses
(`sampleBrandmark3D`: cap outlines, corner edges, and an explicit strut budget
so the ring reads as a drum). ⚠ Sampled ONCE with all five geometries — the
sampler re-centres and re-fits per call, and two calls would blow the monogram
up to the ring's extent. Oversampled 1.6× so every class has more target
points than slots.

### 5 · The pairing is a sort, not a search — `pairByPolarRank.ts`

Every prior pairing in the repo is `i % n`, which only works for shapes that
nest. These two share a topology — a RING around BARS: Thoughtform's ink is
54 % at r ≥ 0.8·R, Trinny's ring sits at r ≥ 0.89·R with its monogram under
0.71·R — so one radius split (0.42 in the 0.5 space) classifies both, and
within a class slots and targets are sorted by polar angle and paired by RANK.
Ring flows to ring with the least rotation; the bars flow radially into the
monogram. Deterministic, O(n log n), class-preserving (the test asserts it).
The rank map takes a uniform subset when the target outnumbers the slots.

### 6 · The beat — `#turn`, between `#services` and `#trinny`

A TRANSPARENT station the canvas lives through: `100svh` of pin + a `120svh`
runway + `100svh` the interstitial slides over, with a sticky full-viewport
stage holding the four products and the inline fallback SVG. The cover form is
`#services`'s (transparent, `content-visibility: visible`) keyed on the same
exit attribute as the kill — ⚠ **but the child rule sets `z-index` ONLY**:
`home-v2.css`'s `position: relative` on `#services > *` would un-stick the
stage. `#trinny` keeps `data-corridor-kill` (the parse guard still counts one),
the grade and the copy; its products moved up. `data-station="proposition"` on
`#turn` turns the journey there with no mark of its own (the roster stays five
rows).

**The overlap.** The stage would unpin at `#trinny.top = 100svh` while the
mark fades over `#trinny.top` 0.6vh → 0 — a viewport of products sliding up
past a fixed mark. `#trinny { margin-top: -100svh }` on the capable rung keeps
the stage pinned until `#trinny.top = 0`, exactly the fade's end: the coral slab
wipes mark and products together, the site's own station-over-canvas handoff.
⚠ Keyed on the MEDIA rung, never on `data-corridor-exit` — a margin on a
transient attribute would shift the document by a viewport when it clears.

**The products** carry NO `data-parallax` (that channel derives from the
element's live rect, constant inside a pinned stage, and writes `translate`)
and NO `data-m` (a second opacity owner). They are placed from five vars the
writer sets per frame, through the `translate`/`rotate`/`scale` properties.

**The fallback mark** is hidden under `html[data-services-ambient="true"]` —
whenever the WebGL mark is parked on stage — and shows on the paths the morph
cannot run on (mobile, reduced motion, a GPU the governor refused).

### 7 · The clock — `turnClock.ts` + `useTurnScroll.ts`

`p = clamp01((vh − top) / (vh + runway))`, `runway = height − vh`: 0 when
`#turn`'s top reaches the viewport bottom (the last card starts to leave), 1
when the runway is spent. ⚠ **The windows below are U1's, not this section's
first draft's** — `turnClock.ts` is the source and this text had drifted from
it (found 2026-09-10). The particle morph runs `TURN_MORPH_START` 0.20 →
`TURN_MORPH_END` 0.56: card 4 is an opaque plate over the mark until it has
scrolled ~0.7vh, so the first flight must be visible. Products enter over
`0.30 + 0.05k` with a 0.24 span, each on an arc about the mark's centre
(`0.5 + CENTER_Y_OFFSET / (2·CENTER_DISTANCE·tan(FOV/2))` = 0.545 of the stage
height — the test re-derives it from the actor's and `sceneGeom`'s sources),
sweeping 50° in alternating directions from 0.3·stageH further out, then a
6px scroll-linked drift. Everything is a pure function of the station's rect:
reverse scroll unwinds it exactly, nothing rides a clock. The writer is
passive, rAF-coalesced, delta-gated, and parks whenever the capable rung does
not match or the stage does not compute `sticky`.

### 8 · The orbits

`orbitExitGetter` gains `× (1 − readBrandmarkMorph())`: the two structural
rings — the armature of OUR mark — dissolve on the same eased clock. Identity
on `/`.

## What the stills caught, with every gate green

- **`align-content` aligns BLOCK content too (Chrome 123+).** The station's base
  rule is `display: grid; align-content: center`; the capable rung set
  `display: block` and the stage was still CENTRED in the 320svh station — it
  stuck at p ≈ 0.95 instead of 0.45, and the first thing seen of a product was
  a sliver crossing the stage's edge. The probe measured `stage.top` 973px at
  p 0.6. `align-content: start` in the rung.
- **A product start 0.45·stageH out crossed the stage's top edge** on entry;
  0.3 keeps the sweep on stage, faded out, reading as rotating into place.

## Update 1 — the ground changes, and nothing slides over it

**Owner, on the first cut's ending:** the interstitial slab rising over the
pinned stage is _"an ugly paint that just floats over it"_. What he asked for
instead, in his own order: as the turn leaves, **the background subtly
changes** — a shader, not a panel; **the text appears over it at the centre**,
like a call to action; it appears **"like it doesn't move, but with glitch
text"**, the way another page on this site already does it; and then, scrolling
on, **the title glitches away and the next sections appear**.

### The interstitial is deleted, not restyled

`#trinny` is gone as a station. Its copy moved into the turn's own pinned
stage — the only place a line can appear WITHOUT moving, because the stage is
already held still — and `data-corridor-kill` moved with it to `#proposition`,
which is the first opaque station below the corridor now. That was an attribute
move and nothing else: both sides of the seam are keyed on the same attribute,
which is exactly why ADR-094 keyed them that way. The station is `100svh +
runway` (no overlap viewport), so the stage releases in the frame its own
progress reaches 1.

### The ground: a fragment shader, scroll-driven, no clock

`turn/turnWash.ts` — a raw-WebGL quad on a canvas in the stage. It warms
Trinny's coral into the FIELD and leaves the centre nearly clean, so the mark
keeps its bed and the line that follows has one; it swells with the copy and
**resolves back to parchment as the copy leaves**, which is what removes the
seam rather than moving it. ⚠ **No `uTime`, no loop** — `draw()` is called from
the writer's own rAF when the scroll moved (ADR-021's addendum; a shader that
idles would also burn a GPU on a parked page). ⚠ The colour is read from
`--tl-brand-rgb` rather than restated. ⚠ **It is a shader for a reason**: a
wide, low-contrast ramp on parchment BANDS as a CSS gradient, and the ordered
dither of one 255th is what stops it reading as printed-on. WebGL refused ⇒ the
writer stamps `data-tl-wash="css"` and the same element paints a gradient.

⚠ **THE WASH STOPS SHORT OF THE HUD.** At full bleed it ran under the right
rail and swallowed its telemetry — gold values on coral, `BEARING` and `LOCAL`
both gone at 1920×1247 and legible again the instant the wash resolved. The
frame is the site's chrome and has to stay readable, so the field is masked out
of the outer 7.5 % / 5.5 %. The honest reading anyway: the HUD is not part of
the page the client's colour is taking over.

### The line: the house decode, scrubbed

`turn/turnDecode.ts` reuses **`lib/home-v2/captionScramble.ts`** — the site's
one decode kernel — rather than inventing a second. `scrambleFrame` is pure in
elapsed `t` and holds no latch, so a scroll-derived `t` is reversible for free;
the Voidwalker hologram found that first and this is the same idiom with a
second window added, so the line types IN over `[0.62, 0.78]`, holds lit, and
un-types OUT over `[0.90, 1.0]` — at a fixed position, both directions, which
is the masthead law. ⚠ **`advanceScrambles` may not be used here**: it drops
finished jobs, and a dropped job is a latch scrolling back up would find
nothing to unwind.

⚠ **THE REFLOW TRAP, AND WHY THE MARKUP IS TWO LAYERS.** The kernel keeps the
string's LENGTH (unstarted characters emit a space), but its glyphs are mono
caps and the copy is set in a proportional sans — so a decoding line is wider
than its resting self and would re-wrap. Every line is therefore a **ghost plus
a live layer**: the ghost is in flow, transparent, carries the true text for
the accessibility tree and HOLDS THE BOX; the live layer is absolute over it
and is the only thing the writer touches. Both halves are needed — the kernel
keeps the count, the ghost keeps the geometry — and the smoke asserts the
ghost's box is identical before and after the whole decode. ⚠ The live layer is
a LEAF (the kernel writes `textContent` and would destroy markup inside it),
and ⚠ **no `data-m` anywhere on this copy**: that is the move-and-fade reveal
system, the exact thing the masthead law forbids and this replaces.

### The mark makes room

`brandmarkMorphRef.veil` (0 → 1, multiplied into the actor's opacity, identity
at 0 without a spec) puts the mark back to 28 % as the copy takes the centre —
a ghost behind the line rather than a competitor for it, and never all the way
out.

### The beat, end to end

`0.20–0.56` the particles re-form · `0.30–0.69` the products sweep in ·
`0.36–0.68` the ground warms · `0.56–0.72` the mark veils back ·
`0.62–0.78` the line decodes in · `0.78–0.90` it holds ·
`0.90–1.00` it decodes out and the ground resolves.

### What the stills caught this time

- **The wash swallowing the rail's telemetry** (above) — invisible to every
  gate, obvious in one frame.
- ⚠ **A HARNESS THAT SOLVES ONE `y` LANDS AT THE WRONG BEAT.** The document
  grows under the scroll as the lazy chunks mount, so a scroll position solved
  before the roll arrived at **p 0.64 when 0.84 was asked** — the difference
  between the line lit and the line still mid-decode, which is what the first
  still actually showed. Both the capture and the smoke now **converge on the
  clock the writer PUBLISHES** (`data-tl-turn`) instead of trusting one
  solution. Any harness that targets a scroll-driven beat on this page wants
  the same loop.

## Update 2 — the wash fills the frame (2026-09-10)

**Owner:** _"the gradient that you have, that shader, should fill the full
viewport. Right now it stops at the left and right reel, but it should steadily
fill the entire viewport."_ Asked whether the right rail's telemetry should be
protected: _"I don't want you to change the reel. Just extend that gradient,
that shader, because the color doesn't really clash with our reel, so we can
easily extend."_

**One term.** U1's shader multiplied its field by a `frame` mask — four
`smoothstep`s holding the ground out of the outer 7.5 % / 5.5 % (144px of
left/right ramp at 1920, against a right rail whose box ends 136px in). That
multiplier is deleted. Nothing else in the pipeline clipped the field: the
canvas is `inset: 0` in a 100vw sticky stage, and both CSS fallbacks were
always full-bleed.

**What it trades, kept as the record rather than deleted with the mask.** U1
put the mask there off a measurement, not a preference: at full bleed the
ground runs under the rail's telemetry — gold values on coral — and on the
still `BEARING` and `LOCAL` were both gone at 1920×1247, legible again only
once the wash resolved. **That is still true and it is visible on the new
still.** The owner has read it and ruled the other way: the page's colour takes
the frame with it, and the rail is not touched. The comment above the shader
carries the ruling and the measurement together, because the two only make
sense as a pair.

⚠ **THE PEAK IS THE ONE DIAL LEFT.** `× 0.66` at the end of the fragment is now
the only thing standing between the coral and the readouts, and **nothing
anywhere measures this shader's contrast** — the `arcs` walk is DOM-only, the
light walk reads `backgroundColor`, and a WebGL field is invisible to both.
Raising it re-opens exactly the question the mask used to answer, with no gate
to catch it. Re-shoot `15-turn-mark` / `16-turn-line` at 1920×1247 first.

**No test changed.** Nothing asserted the mask, the insets or the ceiling —
`trinny-mark.test.ts` pins `washOf`'s CLOCK and the smoke reads `--tl-wash` off
the stage, both of which are unmoved. The regression this could cause is only
visible in a capture, which is what ADR-095 already says about this beat.

## Update 3 — the copy sits around the mark, and the button is theirs (2026-09-10)

**Owner:** _"the title and the text overlap with the logo. I think maybe we put
the title above the brand mark, and then the call to action and the paragraph
below it … And then the button should be yellow with a fill from the Trinny
website. They have — Trinny, she claimed that yellow, and that's amazing."_

### The split

U1 centred the whole block ON the mark's weld point, on the argument that the
line should land exactly where the mark had been. It does — and **the mark is
still there**, because the beat's whole subject is that it re-formed as theirs.
The two occupied one space. The copy is two blocks now: the eyebrow and the
title above, the paragraph and the button below.

⚠ **BOTH ARE SEATED OFF ONE PAIR OF TOKENS, AND THE PAIR IS THE MARK'S OWN
GEOMETRY** — `--tl-mark-cy` is the weld point (`0.5 + CENTER_Y_OFFSET /
(2·CENTER_DISTANCE·tan(FOV/2))`, the same 54.5 % `turnClock.ts` swings the
product arcs about) and `--tl-mark-r` is the ring's on-screen radius. Move the
mark and both blocks follow.

⚠ **AND THE RADIUS IS THE FALLBACK MARK'S OWN EXPRESSION, NOT A PERCENTAGE.**
`min(25svh, 24vw)`, because the WebGL mark is a BILLBOARD welded in front of
the camera: its screen size follows the viewport's HEIGHT on a landscape window
and its WIDTH on a phone, which is exactly what `.tl-turn__mark` already says
(`min(45svh, 45vw)`). A flat `26%` is right at the owner's shape and half again
too large at 390×844, where it would push the blocks apart around a mark a
third of that size. Measured 25 % of the height at 1920×1247 and 1280×720, 11 %
at 390×844.

### What the split cost, and what it moved

The four product rests were placed against a copy block CENTRED on the mark,
which left both top corners free. With the title up in that band they were in
its lane: at 1280×720 `London.` ran under the Naked Ambition tube. They hug the
stage's edges now, so the centre column belongs to the mark and the copy at
every width.

⚠ **AND THE TITLE TAKES TWO LINES WHERE THE LANE CANNOT HOLD ONE.** Between the
phone rung and ~1500px the stage is not wide enough for a thirty-character
display line AND a product column either side: at 1280×720 the single line
measures ~590px against ~635px of clear centre, so it touches the tube however
far outboard the tube goes. **Narrowing the BLOCK is what wraps it** — the type
ladder is untouched, because shrinking a display size to fit is the thing this
surface does not do.

### The button is the client's

Their hero CTAs are a flat `#feff04` field with `--brand-grey-1` ink, square,
uppercase and lightly tracked — which is already the house grammar in another
colour, so only the fill and the ink are borrowed. Both are read off
trinnylondon.com's own tokens and stored as `--tl-yellow-rgb` /
`--tl-yellow-ink`, a second route-local brand literal beside the coral and for
the same reason: **it is the CLIENT's value, so deriving it from this site's
ramp would be inventing a colour they did not choose.** The outline the button
carried is deleted with it — a filled plate does not need a rim, and the border
was what made it read as chrome rather than as the one thing to press. Ink on
fill measures 7.6:1.

### ⚠ And the phone had no turn at all

`#turn`'s base rule is `display: grid` with an AUTO column, and **every child of
the stage is absolutely positioned** — the mark, the products, the wash and both
copy blocks. So the track measured 0, the stage measured 0 × 844, the copy's
`min(860px, 84%)` resolved to zero and its text overflowed into the stage's own
`overflow: hidden`. Only the mark survived, because it is the one child with an
absolute width, and it sat half off the left edge.

**The capable rung escapes it by switching to `display: block`, which is why
every desktop still looked correct.** ADR-095 listed phones as "not looked at";
this is what was there. `grid-template-columns: minmax(0, 1fr)` is the fix, and
the products were then re-placed into the two bands the copy leaves — at the old
22vw the lower pair stood exactly where the paragraph now lands.

⚠ **THIRD TIME IN TWO PASSES THAT A SHRINK-TO-FIT TRACK MET AN
ABSOLUTELY-POSITIONED CHILD** (ADR-094 U1's bay, its phone rung, and this). The
rule is one line: **a box whose only children are out of flow has no content
width, so any track that sizes to content collapses and every percentage inside
it resolves to zero.**

### The proposal's head

⚠ **NO EYEBROW.** It read `The proposal` directly over a heading that names the
thing, on a page whose journey rail already says Proposal — the same word three
times in one band. A heading on the left and a paragraph on the right is the
whole head, and the paragraph lost its middle sentence: the adoption-and-
automation loop is what the drawing underneath it draws, so saying it in prose
first was the caption explaining the instrument.

### Guards

The parse test sliced from `class="tl-turn__copy"`, which now matches neither
block (both carry a modifier) and would have silently sliced from zero onto the
hero. It slices `#turn` and pins the split itself — two blocks, the title in the
upper, the button in the lower — plus the absence of the proposal's eyebrow.
The smoke asserts the BAND: the title ends above the ring's top and the
paragraph begins below its bottom, as fractions of the stage. ⚠ Those two
literals restate the intent rather than reading the tokens back; a guard
computed from `--tl-mark-cy` and `--tl-mark-r` would agree with the CSS by
construction and catch nothing.

## Update 4 — the ground stays, and the proposal carries it (2026-09-10)

**Owner:** _"it's also important that the gradient doesn't change colour. When
you enter the Trinny section, that gradient can stay that shader."_

This answers the dial ADR-095 left open — _whether the coral should persist into
the proposal rather than resolve_. It persists.

### What changed

`washOf` loses its out-ramp: the wash swells to the copy's beat and then holds
through the rest of the turn. U1 ran it back to parchment over 0.90–1.00 so the
proposal met the page's own ground and no edge was drawn — **the answer to that
edge is now the proposal carrying the SAME field, not the field going away
before it.** `#proposition` gets a ground of its own: the same shader, the same
`--tl-brand-rgb`, on a second canvas behind the record.

### ⚠ One field, two canvases — the shader resolves in VIEWPORT space

A vignette computed against each canvas's own box puts two differently-placed
fields either side of the seam. `uOrigin` / `uView` move the whole calculation
into viewport coordinates, so the two are **one field by construction** rather
than two that match. The turn's canvas passes an origin of (0, 0) when it is
pinned and full-bleed, which is byte-identical to the canvas-space version it
replaces.

### ⚠ The ground ENDS by feathering, not by a clock

A scroll-driven resolve for the proposal was built first and measured wrong in
both directions on a station only 1.29 viewports tall: wide enough to keep the
record on coral and it left a step against `#contact`; narrow enough to clear
that seam and the colour went while the drawing was still on screen (measured
at 0.001 with the drawing mid-viewport). `TURN_PROP_FADE` fades the field along
the canvas's own bottom edge instead — the end is in one place however the
reader arrives, it reverses for free, and there is no channel to unwind.

### Three defects between "it should work" and it working, all found by measuring

Each was invisible in the code and obvious in a pixel sample across the seam.

1. ⚠ **THE TURN'S CANVAS STOPPED BEING REDRAWN.** `frame()` returns early when
   the turn's `p` has not moved — and `p` saturates at 1 the moment `#turn`
   leaves, which is **exactly when its stage releases and its canvas starts
   travelling**. The field is viewport-locked, so a canvas that MOVES must be
   repainted even when its amount has not changed: gated, the turn's ground
   froze at the origin it held when `p` reached 1 and then scrolled away
   carrying that stale image. Both grounds are painted before the gate now.
2. ⚠ **THE GROUND TOOK ITS STATION'S RECT, NOT ITS CANVAS'S.** The grounds are
   absolutely positioned and their stations carry padding, so the boxes differ
   on both axes. Each wash is handed its own canvas's rect.
3. ⚠ **THE DRAWING BUFFER WENT STALE.** `resize()` ran on mount and on window
   `resize` only, so a canvas whose CSS box changes with its own station's
   layout kept a stale buffer — measured 2304×1607 behind an element 2304×1247,
   which squashes the field AND puts `uOrigin` out by the difference. A
   `ResizeObserver` on the canvas now drives it.

And one correction to an instinct: the ground is `inset: 0`, **not** a negative
inset breaking the station's `--hud-content-inset`. An absolutely positioned
child does resolve against its containing block's padding box, but this
station's padding box is already the full 100vw its `.station` breakout gives
it, so the "correction" over-extended the ground by 192px a side.

### The fallback path holds the same law

The no-WebGL and inert rungs paint the gradient on both stations with
`background-attachment: fixed` and a viewport-sized `background-size`, so the
two align there for the same reason the shader's `uOrigin` aligns them on the
WebGL path: **paint one field, not two that match.** Without it the phone
showed a step exactly where the shader's used to be.

### Guards

The clock test asserted `washOf(1) === 0`; it asserts the hold and the
monotone swell now, and that the feather is a fraction rather than a clock
value. The smoke asserted `--tl-wash < 0.05` at the end of the runway; it
asserts `> 0.95` and the presence of the proposal's canvas. ⚠ Neither can see
the seam — that is a pixel sample across the boundary, and it is what found all
three defects above.

## Consequences

- `/` and `/claude-workshop` carry three new attributes/uniforms and one new
  varying in the shared program, all identity at 0. The HUD snapshot spec
  passes without `--update-snapshots`; the corridor smoke passes.
- The interstitial station is DELETED (U1); its copy is the turn's centred
  line and `#proposition` is the kill edge. The parse guard pins: the order
  without `trinny`, four `tl-turn__product` in `#turn` with `data-tm` 0-3 and
  no `data-parallax`/`data-m`, the kill on `#proposition` alone, `#turn`
  without it, and every decoded line's ghost and live layer carrying the same
  string.
- The smoke's stack case gained the turn: stage `sticky`, `data-services-ambient`
  and `data-corridor-exit` live mid-turn, `data-tl-turn` in range, the fallback
  hidden, the Proposal lit, the products painted and settled, then the kill at
  `#trinny`'s top. The capture gained stops 14–17 solved for `p`.

## Left open

- The mid-flight density (the swarm is diffuse at p 0.6 — `uMorphLift` 0.12 and
  the 0.35 stagger are the dials) and the settle colour's accent, after the
  owner's read.
- A `/test/trinny-mark` lab (the standalone 3D wireframe particle logo with
  sliders) is designed and not built; tuning today is by capture.
- The mark's 0.6vh fade now runs against `#proposition`'s top, in the open,
  with no slab over it — worth a look on the still before it is called done.
- ~~Phones show the static composition; it has not been looked at.~~ **Looked
  at in U3 (2026-09-10): there was no composition there at all** — the stage
  measured zero wide. Fixed, and the products re-placed into the bands the
  split copy leaves.

## Verification

```bash
npx vitest run tests/lib/trinny-mark.test.ts tests/lib/trinny-london-parse.test.ts tests/lib/trinny-london-journey.test.tsx tests/lib/brandmark-3d-sampler.test.ts tests/lib/landing-import-doctrine.test.ts tests/lib/type-material-tokens.test.ts
npx playwright test tests/visual/trinny-london-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop          # / byte-identical, UNCHANGED
npx playwright test tests/visual/landing-corridor-smoke.spec.ts --project=desktop
node scripts/capture-trinny-london.mjs --vp 1920x1247 --port <port> --out .cursor/trinny-shots/1920   # headed — LOOK at 14–17
node scripts/capture-trinny-london.mjs --vp 1280x720 --port <port> --out .cursor/trinny-shots/1280
```
