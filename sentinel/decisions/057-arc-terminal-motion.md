# ADR-057: Terminal motion — pinned-beat choreography for arc pages

- **Status:** Accepted (2026-08-01)
- **Surface:** `/arcs/claude-workshop-v2`, `/arcs/ai-keynote-v2`
- **Supersedes:** nothing. ADR-052's reveal grammar stays live on the v1 pages.
- **Rules:** [`.claude/rules/arcs.md`](../../.claude/rules/arcs.md)

## Context

The ported deck pages (ADR-052) reveal like a normal website: one
one-shot IntersectionObserver adds `.is-in` to every `.arc-reveal`, which
plays a 14px rise + 650ms fade (`arcs.css:195-207`). There is no exit, no
pin, and no `@keyframes` in the whole sheet — a section arrives and then
simply scrolls away.

The owner asked for the home page's presentation grammar instead, in
three specific parts (2026-08-01):

1. **Mastheads must not fly upward.** They sit pinned at their position
   and come in with a glitch/decode, "the same way the mastheads are
   pinned on our home page".
2. **Content panels open like a retro-futuristic terminal** — the
   reference is the corridor caption card that powers on when you scroll
   into the Navigate station.
3. **Sections must leave deliberately** — "fade out, but maybe not with
   an opacity, or shrink" — rather than merely scrolling off.

And: one uniform system across every section kind, with per-content
variations allowed; shipped as V2 pages so the client-facing v1 URLs
keep working.

## Decision

A new choreography system, **terminal motion**, selected per arc by
`ArcDef.motion`. Absent or `"reveal"` is the ADR-052 system; `"terminal"`
is this one. Both v1 arcs stay on `"reveal"`, so their markup and
behaviour are unchanged — and that is asserted, not assumed
(`tests/lib/arc-terminal-markup.test.tsx`).

### 1. The beat: a sticky-bottom stage plus a tail

```
<section data-arc-beat style="--beat-tail: 70svh">
  <div class="arc-stage">     ← sticky bottom:0, min-height:100svh, OPAQUE VOID
    <div class="arc-plane">   ← transparent; the iris and the tail live here
      <div class="arc-band">…panels…</div>
  <i class="arc-beat__tail">  ← the scroll the fold plays across
```

- **approach** — the stage rides up with the page; the panel ladder
  scrubs in on `--sec-in`, saturating ~0.12vh before the section's top
  reaches the viewport top, so the last rung has landed before the stop.
- **park** — the stage pins when its BOTTOM meets the viewport bottom.
  The masthead decodes here and only here.
- **fold** — the plane folds LIFO on `--sec-out` across the tail and
  irises shut, saturating at 0.97 of it.
- **release** — the plane is already empty, so what scrolls away is
  opaque void.

**The pin is `sticky; top: vh − stageH` (Update 1), and the offset is
the design.** Measured before it was chosen: with a plain `top: 0` pin,
only **15 of 23** sections fit at 1440×900 and **7 of 23** at 1280×720 —
this content is simply taller than a laptop viewport, and a plain top
pin would trap a tall stage's below-fold content behind the tail. The
negative offset (0 for a fitting stage) lets a tall stage read through
its overflow FIRST and then pin on its last, fully visible viewport —
the only frame of it that is safe to fold. Every beat gets the same
exit. The writer measures `--arc-stage-pin` with the same numbers
`beatOut` parks on, so the CSS pin and the clock cannot disagree.

⚠ **Never `bottom: 0`.** The first cut shipped sticky-bottom on the
reasoning "pins when its bottom meets the viewport bottom" — but
sticky-bottom only restrains exit through the BOTTOM edge, so past the
park it never engages and the whole fold played on a moving stage. The
reverse-scroll smoke caught the head sliding 48px mid-un-type; the
sticky-top offset is the mechanism that actually delivers that sentence.

After the switch (and the padding trim below), 19 of 23 beats fit the
viewport exactly at 1440×900 and every beat folds.

**Padding is not air here.** In flow, section padding was the breath
between sections; pinned, the transition IS that breath, and padding only
steals height from content that has to fit. Terminal stages use
`clamp(32px, 5vh, 72px)` (v1 flow uses up to 200px) and the head breath
drops to `clamp(28px, 5.5vh, 72px)`. This does not violate ADR-052 U1's
"do not re-tighten section rhythm": the beat still shows one idea per
viewport — that ruling was about not cramming MORE per screen.

### 2. The masthead law (owner, twice — and Update 1 finished the job)

**The masthead NEVER moves and NEVER fades, in either scroll direction.
It comes into view only by TYPING and leaves only by UN-TYPING, and
either can play only while the head is screen-stationary.** The first cut
applied the law to the entrance only and kept an exit fade
(`opacity: calc(1 − --co)`) plus a hard blank on reverse scroll — the
owner rejected exactly that on 2026-08-01 ("the reverse of the text
effect should occur; the masthead should stay fixed in its position"),
the same correction the services masthead needed in July.

`data-arc-still` therefore carries NO clock factor at all: `opacity: 1;
transform: none`. Visibility lives entirely in the text content, driven
by a four-phase machine in `useArcTerminalMotion`:

    armed ─(pinned ∧ in dwell ∧ [down ∨ 180ms still])─▶ typing ─▶ done
    typing/done ─(tail past 0.12 raw ∨ 6px upward intent)─▶ untyping ─▶ armed

- **Down-exit:** un-type begins at smoothed out **0.30**. The masthead
  is the TOP of the LIFO ladder (`--ci-off` 0.06 ⇒ `--co-off` 0.50), so
  it holds while the numbers, receipts and cards fold and leaves LAST,
  finishing before the iris (0.56) could crop it. ⚠ The first cut keyed
  this to the RAW ramp at 0.12 — ~107px into an 888px tail, inside the
  settle hold where the smoothed channel still reads ~0.001 and NOTHING
  else has moved. The masthead vanished off a parked, fully-legible
  section (owner, screenshots at `--sec-out` 0.0014 and 0.0994). Read
  masthead thresholds on the SMOOTHED channel so they mean what they
  look like; the ordering `RETYPE < UNTYPE < FORCE_BLANK < iris` is the
  contract and is unit-pinned.
- **Up-exit:** the first ~6px of upward travel while pinned reads as
  leaving and starts the reverse effect in place; the stage holds
  through the tail, so a normal upward scroll watches it un-type
  stationary.
- **Two force-blank guards** truncate a flick: any moment resolved text
  would travel (unpin) or the iris could reach it (smoothed out ≥ 0.5),
  it blanks instantly. Never a slide, never a crop.
- **Re-type on return** needs 180 ms of stillness in the dwell
  (`STRIKE_SETTLE_MS`) so a flick up THROUGH a beat never flashes;
  downward arrivals strike immediately. `RETYPE_OUT` is DERIVED
  (`UNTYPE_OUT / 2`) — the ADR-056 U3 mirrored-thresholds law.
  ⚠ That settle must WAKE ITSELF (`scheduleSettleCheck`). `onFrame`
  runs off the scroll writer's rAF, which stops the instant the reader
  does — the first cut evaluated the settle only on the next scroll
  frame, so scrolling up into a beat and stopping left the masthead
  blank permanently (reproduced live: 3.5 s in the dwell, `--sec-out` 0,
  still armed). Any time-based condition in this frame needs the same
  treatment.

Title segments and designations are leaf `data-arc-decode` spans
scrambling through `lib/home-v2/captionScramble`; body copy and QUOTE
interstitial lines are `data-arc-type` typewriter targets (a quote is
someone else's voice — it types rather than scrambles, but the law is
absolute, so it types rather than merely appearing). Un-typing plays the
scramble to `""` (glyph dissolve) and backspaces the typewriter at
`UNTYPE_CPS` 340. Survey chrome fades only off `data-reveal` state
changes, at a stationary head.

⚠ **The ghost/live decode boxes MUST keep the live layer ABSOLUTE**
(`.arc-tdec__live { position: absolute; inset: 0 }` over the in-flow
hidden ghost — the ServicesMasthead recipe exactly). A grid-stacked live
layer contributes height, so typing changes layout; with a beat above
the viewport mid-un-type, scroll anchoring compensates by nudging
scrollY, the controller reads the nudges as upward intent, and the beat
churns type ↔ un-type forever (found by stack-trapping `data-reveal` at
720p with two adjacent tall beats).

### 3. The exit: LIFO fold, inward travel, iris

Panels carry an inline `--ci-off` (arrival rung) and their own
`--dx`/`--dy`. The departure offset is DERIVED as `0.56 − --ci-off`, so
the ladder plays backwards — whatever arrived last leaves first and the
instrument outlives its content. Travel continues each panel's own axis
INWARD (× 0.6), converging on the slit the iris closes on. Opacity is
demoted to a tail; the iris owns removal.

The iris opens at out **0.56**, trailing the last panel (the masthead, at
co-off 0.50). ADR-056 measured twice that cropping legible copy at high
opacity reads as a clipping bug, not a fold. Every inset rests NEGATIVE
(−14px horizontal, −30px vertical): survey marks overhang their border
box, and `inset(… 0)` amputates exactly that overhang.

**Zero at rest is structural, not tuned.** Arrival travel carries
`(1 − --ci)`, departure travel carries `--co`, the lateral tear carries
`(--g1 − --g2)` — every term is exactly 0 at the park.

### 4. Media apertures

`media` and `portrait` frames take `.arc-ap` instead of the stutter: the
frame unfolds from a zero-width centre slit toward both edges and its
corner brackets ride the opening edges — the caption card's motion,
scrubbed off the panel's own rung rather than transitioned off a class.
"The unfold is PURE MOTION, zero fades"; a sweep and a flicker fight each
other, so an aperture takes neither stutter nor travel.

### 5. One writer, one gate

`useArcTerminalMotion` owns the beat registry, the clocks and the decode,
but adds **no scroll listener**: it returns an `onFrame` that
`useArcScroll` calls as the tail of its existing rAF (ADR-002). Per frame
it reads one value — the `scrollY` its caller already sampled — and does
arithmetic against offsets cached at mount, resize and ResizeObserver
settle. No per-frame `getBoundingClientRect`; the cost is flat at 23 beats
or 230. Its own rAF advances in-flight decodes only and stops when the
last job resolves.

`ARC_TERMINAL_MEDIA` (`min-width: 961px` + no-preference) is **the single
gate**, shared by the hook, the ArcShell reveal split and — mirrored — the
CSS release at `max-width: 960px`. ⚠ The v1 reveal block releases at
900px; borrowing that number would leave 901–960px with sticky beats and
no clock writing to them.

**The two systems are disjoint by gate, not by discipline.** A terminal
page above the tier never gets `is-arc-js` (so v1 CSS is inert); a reveal
page never gets `data-motion` (so terminal CSS is inert). Below the tier a
terminal page falls back to the v1 reveal path rather than to a dead
static page. Because the class and the observer are added or skipped
together, "hidden but never revealed" is unreachable.

### 6. V2 identity

`claude-workshop-v2` and `ai-keynote-v2` spread their v1 def and override
identity only — `sections` and `hero` are shared **by reference**, pinned
by the registry test. A copy edit lands on both pages for the whole
dual-run, and promotion is a flag flip on the v1 def plus deleting the v2
module. `ArcDef.cardChip` disambiguates the overview chips.

## Alternatives rejected

- **In-flow choreography (no pin).** The masthead would still be moving
  while it decodes — the exact read the home surface rejected twice (the
  ServicesMasthead park gate exists because of it) — and the iris would
  close on a half-visible plane.
- **Top-pinned stages.** Measured: drops the fold on 8 of 23 sections at
  1440×900 and 16 of 23 at 1280×720.
- **Per-section client islands.** Six of eight kind components are server
  components and must stay so; islands would also mean up to 23 observers
  and 23 rAF loops.
- **A second CSS sheet or a forked component tree.** The arcs rule keeps
  page-scoped CSS in `arcs.css`; a fork doubles every future copy edit.
- **Motion metadata on `ArcSectionBase`.** Sections are shared by
  reference with v1, so authoring fields would leak motion into content.
  Everything derives from `kind`, the head fields and DOM order instead.

## Consequences

- Pages get longer by one tail per beat (70svh standard, 50svh
  interstitial). That is the price of the ask, and every pixel of it is
  visibly folding.
- Beats taller than the viewport sticky-pin their MASTHEAD at
  `--arc-head-pin` (void-backed, content reads through beneath it — the
  home-page masthead relation), so the head is stationary from the
  moment it strikes even though the stage is still travelling. The
  attribute (`data-arc-tall`) and the offset are written by the measure
  pass per viewport — a beat can be tall at 720p and fitting at 1080p.
- `close` gets no tail: nothing follows it, and a fold with nothing behind
  it reads as the page eating itself. It types once at the page foot and
  never churns — the one masthead allowed to scroll while resolved,
  because blanking the CTA band on a bottom-bounce would be worse.
- No `backdrop-filter` anywhere on arcs — the stages sit on opaque void,
  which deletes the ADR-056 `data-proof-settled` problem class outright.

## Verifying

- `tests/lib/arc-motion.test.ts` — clock math, the saturation invariants,
  the 0.56 LIFO mirror, gate/CSS parity.
- `tests/lib/arc-terminal-markup.test.tsx` — the decode conventions AND
  v1 byte-identity (reveal mode emits zero terminal markup).
- `tests/visual/arc-terminal-smoke.spec.ts` — decode at rest with identity
  transform, the fold + iris, re-arm blanks on reverse, media apertures,
  reduced motion, v1 unchanged, and **no box clips on any beat at
  1280×720 and 1440×800**. The project default of 1440×900 hides every
  clipping bug this content has; author against the smaller two.
- Drive REAL stepped scrolls, never a teleport, and disable
  `scroll-behavior: smooth` in the harness or the drive lands short.

## Process

[sentinel/MAINTENANCE.md](../MAINTENANCE.md) — Cycle B (new feature
surface). Cycle A after fixes.
