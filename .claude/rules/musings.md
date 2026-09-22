---
paths:
  - "components/landing/home-v2/musings/**"
  - "lib/musings/**"
  - "content/musings/**"
  - "scripts/capture-musings-rack.mjs"
description: The musings row (#musings), its transparent stage and the footer's held bed
---

# Rule: the musings row

`#musings` — the writing as a row you scroll along: the services masthead's
grammar on the editorial band, decoding in place; a row of flat CSS-3D cards
of which the one being read stands upright and CENTRED and the rest lean back
about their horizontal axis; one way out. It sits between the era stage and
the footer.

⚠ **[ADR-119 U2](../../sentinel/decisions/119-the-musings-rack.md) (2026-09-22,
owner) IS THE LIVE FORM, AND IT IS THE THIRD READING OF ONE SENTENCE.** He has
said "rotated on the x-axis" since U0. U0 fanned the cards about Y (he read it
as a copy of the services ring), U1 turned them 90° about Y to show spines (he
read it as a "physical shelf … skeuomorphism"). Shown three forms side by side
he chose the ROW: `rotateX` and nothing else, flat panes, depth from rotation
and perspective only. **Do not bring a Y turn, a spine, a slab or a lit edge
back** — `musings-row.test.ts` and the capture's `pureX` gate both refuse it.

⚠ **SINCE [ADR-119 U1](../../sentinel/decisions/119-the-musings-rack.md)
(2026-09-22, owner) THE STATION IS NOT THE COVER — ITS LAST VIEWPORT IS.** On
the capable rung it is the `#voidwalker` recipe exactly: transparent, promoted,
the corridor alive behind the whole beat, because an opaque station in normal
flow can only arrive by TRAVELLING over a pinned stage that does not move —
which is the "parallax" he named, and the complaint that deleted `#practice`.
What kills the corridor and arms the footer's bed is one opaque 100svh
`.mu__band` at the foot of its runway. Three rungs, and the lower two are
byte-identical to what U0 shipped:

| rung                                       | `data-mu-mode` | station              | cover       | footer bed          |
| ------------------------------------------ | -------------- | -------------------- | ----------- | ------------------- |
| ≥1101, motion, live corridor, hologram era | `stage`        | transparent, z 6     | `.mu__band` | armed on the band   |
| 961–1100 (row, no stage)                   | —              | opaque               | `#musings`  | armed on the runway |
| ≤960 / PRM / no JS                         | —              | opaque, flowing rail | `#musings`  | never armed         |

⚠ The PAGE `/musings` is a different surface with a different grammar — the
SHEET (ADR-114), [`.claude/rules/sheet.md`](sheet.md). This station is a
landing STATION and answers to the corridor's grammar and the corner law, not
to the sheet's variety law. They share exactly one thing: the record.

**Read first**

- [ADR-119](../../sentinel/decisions/119-the-musings-rack.md) — the ask, the
  lift, the cover lockstep, the footer's bed, and what the guards found.
- [ADR-105](../../sentinel/decisions/105-the-page-ends-on-a-bold-footer.md)
  **Update 3** — the footer's half, recorded on the ADR that owns that surface.
- [ADR-114](../../sentinel/decisions/114-the-sheet.md) — the content model
  (`MusingPost`, `content/musings/*.mdx`, the registry's two traps).
- [ADR-030 §6](../../sentinel/decisions/030-tools-section-cover-stack.md) — the
  cover lockstep this station now sits at the centre of.

## Contracts

- **The geometry is PURE and lives in `lib/musings/rowMath.ts`** — three-free,
  zero DOM, unit-pinned: `rowGeom` · `rowNearDepth` · `rowSeat` · `rowPose` ·
  `rowIndex` · `rowReadIndex` · `rowArrive`. The head's decode is
  `lib/musings/headDecode.ts` (`headFrame` · `headTarget` · `headSpan`). The
  writer assigns what they return; nothing else computes a pose or a frame.
- ⚠ **THE ROW TURNS ABOUT X, AND ONLY ABOUT X.** The card being read is
  upright (`rotateX(0)`); every other card is tipped back `ROW_TILT` (60°, top
  away) and set back in depth, symmetrically either side, spreading and
  receding with its distance from the centre. 60° was chosen on stills: at 65°
  a neighbour is a squat sliver, at 45° its copy competes with the card being
  read. The detent stays (one scroll step per card, U0's ruling) and every card
  glides on one 720ms ease-in-out.
- ⚠ **THE ROW IS CENTRED ON THE CARD BEING READ** (U2: "the entire stack …
  should be centered"). U1 stood its shelf on the band's left edge by a session
  decision; that is reversed by the owner. The window keeps the band's box, so
  the centre it seats on is the page's, and `.mu__foot` centres under it.
- ⚠ **EACH CARD CARRIES ITS OWN `perspective()`; THE SHEET DECLARES NO
  `perspective` PROPERTY AND NO `preserve-3d`.** Measured: with the perspective
  on `.mu__rig` over a `preserve-3d` rack (U1's structure), the compositor inside
  this sticky, promoted stage resolved it somewhere other than
  `getBoundingClientRect` did — a tipped neighbour's cover glyph PAINTED ~125px
  right and ~140px below its own reported rect, the whole card a 30px sliver
  under the mid-line, **every geometry gate green**. `rowPose` opens on
  `perspective(ROW_PERSPECTIVE px)`; every card is seated on the rig's centre
  (`inset: 0; margin: auto`), so its transform-origin — the eye — is the same
  point for all of them. The cards share no 3D context, so paint order is plain
  z-index (the card being read over its neighbours, each step out under the
  last).
- ⚠ **A TIPPED CARD'S NEAR EDGE STAYS BEHIND THE UPRIGHT ONE, BY CONSTRUCTION.**
  Tipping swings the bottom edge toward the reader by `(h/2)·sin(tilt)`, so the
  first neighbour's depth is floored on the face's HEIGHT (`rowNearDepth`), not
  just scaled off its width — a neighbour whose edge stood in front of the card
  that covers it would be a drawing that contradicts itself. Unit-pinned at
  four face shapes, the 961px rung's narrow one included.
- ⚠ **THE EDGE FADE IS ON `.mu__window`, AND IT ENDS 3 % INSIDE IT.** Cards
  two and more steps out reach past the band; the fade dissolves them before
  the band's edge, and at 1280×720 the band's right edge runs 15px PAST the
  rail's BEARING readout, so a fade that ended on the edge would still lay a
  faint plate under live telemetry. The window carries `padding-block: 8px` —
  a mask hides everything outside its box, the front card's focus ring
  included.
- ⚠ **THE PIVOT CARRIES A TRANSFORM AND NOTHING ELSE.** `overflow` ≠ visible,
  `clip-path` ≠ none, `opacity` < 1 and `filter` ≠ none are GROUPING properties
  (CSS Transforms 2 §3). The row has no shared 3D context now, but the law stays
  so one can come back without a hunt: the FACE takes the clip and the
  overflow, and a source ratchet walks every rule whose selector ENDS on
  `.mu-card`.
- **The plate is SOLID** (0.94, the owner's ruling). 0.62 was tuned against an
  opaque station; the card sits over a live canvas now, and nothing mechanical
  can read a translucent plate there — the gate composites against a background
  COLOUR.
- ⚠ **ONE WRITER, AND IT RENDERS NOTHING PER FRAME.** `useMusingsScroll` reads
  one rect in a rAF and publishes `--mu-head` (the head's level), `data-mu-ready`
  and `data-mu-arrive` on `.mu`, `data-mu-mode` on the STATION, `data-ft-reveal`
  on `<html>`, a transform and `data-mu-tilt` per card, and `data-live` on the
  head's cursor hosts. The ONLY React state is the front index, which changes at
  a DETENT. A `setState` in the rAF is a re-render across every card, every
  frame, on a page running a WebGL corridor two stations up (ADR-002).
- ⚠ **AN ABSENT `data-mu-ready` MEANS SHOWN.** The rest state — no script, a
  reduced-motion reader, any phone — is a horizontal RAIL of the same cards,
  and it is the finished page rather than a fallback. Every row rule is gated on
  the stamp AND on the rung, so the two can never disagree about which layout
  is live; `musings-row.test.ts` asserts both halves off the source.
- ⚠ **THE RUNG IS MIRRORED BY HAND** between `MUSINGS_RACK_MEDIA` in the writer
  and `@media` in the sheet. A writer and a sheet that disagree is a row posed
  in 3D inside a box laid out as a flat rail — neither errors, and neither is
  visible in a still taken at the other rung. Pinned by source.
- ⚠ **THE COVER LOCKSTEP HAS FOUR READERS AND THEY MOVE IN ONE COMMIT**
  (ADR-030 §6, on record as hit six times): `home-v2.css`'s mode-gated promotion
  rule, `useCorridorExitScroll`'s next-station query,
  `about-voidwalker-handoff-boundaries`' cover case, and `services-ring-smoke`'s
  ambient-hold case — which reads it **twice**, once to solve the waypoint and
  once to assert on it. Since U1 all four name **`.mu__band`** on the stage rung.
  ⚠ **NOT `data-corridor-kill`**: it is consulted BEFORE the whole chain, so a
  stamp on the band would also win at 961–1100, under PRM and on the fallback,
  where `#musings` is opaque again — and `killEl` is cached against
  `isConnected` and never re-queries when an attribute is removed from a
  connected element, so a writer-stamped version does not work either.
  ⚠ **AND THE BAND IS EXACTLY 100svh**, so a guard that walks 0.3 viewports into
  its top covers `vh − 1` and fails. Every earlier cover was three viewports
  tall and absorbed the walk; the property is asserted at the edge it is claimed
  on — the band's own top — and what shows one pixel past it is the held footer
  beginning to be revealed, which is the reveal working.
  ⚠ **`?? contactEl` IS LOAD-BEARING**: `/claude-workshop` and the Trinny
  proposal mount the same hook from their own prototypes and have no
  `#musings`. On those routes the answer is still `#contact`.
- ⚠ **THE COVER SATISFIES ITS CONTRACT BY INHERITANCE, SO DO NOT TAKE ITS
  GROUND.** Off the stage rung `.station:not(.hero)` paints `var(--void)` plus
  the stars; on it the BAND paints the same pair full-bleed. The guard asserts
  `alpha === 1` AND a background image, and a surface whose only ground is its
  content fails both.
- ⚠ **THE WRITER HAS NO HANDLE ON THE STATION WITHOUT CLIMBING.** `stationRef`
  is the portal's `.mu` root, one level inside the authored slot, so every rule
  written against `#musings[data-mu-mode]` matches NOTHING — silently, with the
  page reading as before. `closest("#musings")`, re-resolved on `isConnected`.
- ⚠ **TRANSPARENCY AND PROMOTION ARE ORTHOGONAL.** The docked canvas composites
  at its host's z 3 (`fixed` changes a containing block, never paint order, and
  the host is `isolation: isolate`) and `#musings` carries an inherited z 2 — so
  an un-promoted transparent stage paints its head and cards BEHIND the
  corridor: invisible, every geometry gate green. z 6 while transparent is what
  `#services`, `#about` and `#voidwalker` all already do, which is why the cover
  rule is REPLACED and never deleted.
- ⚠ **`#musings.station`'s unconditional `position: relative` MAY NEVER BE
  FOLDED INTO A `data-corridor-exit`-GATED RULE.** It is what activates the
  inherited `z-index: 2` that keeps the whole subtree above the footer's z 0,
  long after the ambient has died.
- ⚠ **IT GIVES UP `content-visibility`, UNCONDITIONALLY.** The base pairs
  `auto` with a one-viewport intrinsic guess and this station is three to four,
  so the correction reflows the document under the reader — and the cover keys
  on this station's RECT, which a 100vh placeholder puts where the reader is
  not (ADR-105's own reason, one station along).
- ⚠ **THE RAW PADDING IS ON THE DESKTOP RUNG ONLY.** `#musings.station` writing
  `padding-top` unconditionally TIES with the ≤960 chrome floor (also
  `#musings.station`, also (1,1,0)) and wins on source order, because
  `musings.css` is imported after `landing.css` — the floor silently resolves to
  0 and the eyebrow prints under the TL bracket. `mobile-sections.md` §1 names
  this trap; the station declares `--station-pad-top/-bottom` unconditionally so
  the floor's `max()` has its input, and zeroes the raw padding above 961px.
- **The head is the SERVICES MASTHEAD's grammar, COPIED** (`lib/musings/
mastheadData.ts` + `.mu__head*`): the two-column split sharing one top line,
  the designations hung above each block, the one gold state chip, the coord
  stamps under each block's foot, the two registration crosses, the dot-grid
  lifts, and the ladder — `clamp(26px, 3vw, 44px)` / 0.04em / 1.1 with the
  gold-washed shadow. ⚠ `ServicesMasthead` could not be imported if it were
  wanted (zero props, `closest(".services-stage")`, `--svc-*` channels no hook
  writes here, ABSOLUTE inside a pinned stage); `ArcSectionHead` is the
  canonical in-flow copy and this is its third instance.
  ⚠ **THE STRINGS ARE AUTHORED UPPERCASE AND THE SHEET TRANSFORMS NOTHING**
  (ADR-092), and `0.04em` is the sheet's ONE type literal — the ratchet's pin is
  `A: 1` with its reason recorded, and it only goes down from there.
  ⚠ **THE RIGHT-HAND SURVEY CHROME YIELDS TO THE FRAME BELOW 1700px**: the close
  cross hangs 24px outboard of an end-justified brief, and the right rail's
  BEARING / SECTOR / LOCAL readouts are right-aligned to the rail and reach
  ~100px inboard. Measured at 1280×720 — band ends at 1148, `BEARING` begins at 1133. The brief's TEXT never collides; only the marks do.
- ⚠ **THE HEAD DECODES IN PLACE, ON THE SERVICES MASTHEAD'S CLOCK (U2: "the
  texts … shouldn't move into view … just like we have in the services
  section").** U1 scrubbed it off the scroll position and asked the kernel for
  its frame at `t = 0` to blank it — but `scrambleFrame` opens a character's
  shuffle window BEFORE it resolves, so at `t = 0` the first 3–4 characters of
  every run were random glyphs (`F-ZO` / `TSJ`). **The head was never blank**,
  and those glyphs rode the stage in and out of the frame, re-rolling every
  scroll frame. Now:
  - **`headFrame` returns `""` at level 0**, for every run — the regression the
    test exists for — and the writer may not call `scrambleFrame` itself.
  - **TIME DRIVES THE LEVEL, SCROLL DECIDES THE TARGET.** `headTarget` picks 0
    or 1 (reveal at p ≥ 0.02, leave at ≥ 0.965 or < 0.01, a hysteresis band at
    each end); a bounded rAF burst walks the level there — up over the whole
    span (~0.7s: lines 0.18s apart, the paragraph typing at 220 chars/s behind
    0.12s, services' numbers), down twice as fast. ADR-021's sanctioned kind,
    the services masthead's own clock.
  - **NEVER SHOWN ON A MOVING STAGE**: unparked (the runway not covering the
    frame) the level snaps to 0 at once — the masthead motion law's
    force-blank. A deep reload parked inside the band shows the head whole,
    with no replay; a hidden tab settles the burst on return.
  - ⚠ The level is still ONE scalar, so the un-type is the decode played
    backwards in each character's own cell — no second job, nothing to latch.
    `advanceScrambles` stays banned for that reason.
  - The CRT cursor (`.mu__cursor`, copied from `.services-masthead__cursor`)
    rides the first title line still decoding and the paragraph while it types,
    lit by `data-live` on its `[data-mu-cursor]` host. ⚠ The decoded run is an
    INNER span — `textContent` would wipe a sibling cursor.
  - ⚠ The paragraph is a GHOST/TYPED pair (a hidden ghost holds the box, the
    typed layer is absolute): typing never reflows the head. U1's
    `min-height: 4.5em` was a guess right at one measure.
  - Two registers stay: chrome and title SCRAMBLE, the paragraph TYPES. ⚠ The
    heading carries an `aria-label`, or a reader arriving mid-decode is handed
    the shuffle. The survey chrome fades with `--mu-head`.
- **The cards arrive on a centre-out APERTURE, AFTER THE HEAD HAS RESOLVED**
  (the owner's own order: "the text should appear with a glitch effect, and
  then the cards should come into view"). The writer holds `data-mu-arrive="in"`
  until the head's level is 1, and the burst's last frame asks for one more
  tick. ⚠ **The glitch he means is NOT a flash** — he pulled one from the proof
  card as a photosensitivity risk (ADR-097 U12). ⚠ **This is the THIRD host of
  one pair of numbers** (720ms in / 420ms out, `cubic-bezier(0.65, 0, 0.35, 1)`,
  with `proof-stack.css` and the Trinny route) and a source ratchet pins all
  three. ⚠ On the card's FACE, never the pivot or the rack; the way out
  (`.mu__all`) opens on its own rectangle slit on the same clock.
  ⚠ It is a BOUNDED BURST on a hysteresis (`rowArrive`, `arriveNext` copied):
  NaN leaves the state alone, a deep reload seeds `in`, `await` is NOT `out`,
  and it closes at **0.95** — past the reading band's own end (0.94), and BEFORE
  the head leaves (0.965), so the exit is the entry backwards.
  ⚠ **Re-entering from below replays the order** (the head decodes, then the
  aperture opens: ~1.4s end to end), so a probe must WAIT on
  `data-mu-arrive="in"` and a face with no running animation — never sleep for
  the detent alone. The capture does.
- **The card takes ONE notch, TOP-RIGHT** — his corner every time (ADR-097's
  proof card, ADR-098 U5's plates, ADR-082 U37's record cards). ⚠ A clip CUTS a
  border and never strokes one, so the fill is clipped and the edge is a closed
  two-contour `evenodd` RING on `::before`, inner leg `ch − 0.586px`. ⚠ The
  corner is pinned from BOTH ENDS and it is HIT-TESTED, not parsed — a computed
  `clip-path` keeps its percentages and `calc()`s.
- ⚠ **NO `backdrop-filter` ON THE CARD.** The proof card affords one because it
  is ONE card; five overlapping planes in a `preserve-3d` context is five
  backdrop SNAPSHOTS a frame, which is the cost ADR-056 measured.
- **The cover draws the RECORD** (`lib/musings/cover.ts` + `MusingCover.tsx`):
  the post's Arc beat from its own tags, its filing date as a lit mark on a
  baseline, a substrate seeded off the slug. ⚠ The beat glyph's GRAMMAR is
  copied from `rail-instruments/sectionGlyphs.tsx`, never imported (ADR-106's
  precedent) — and reusing the drawing is right HERE because the cover is about
  which of the three a post is. ⚠ A post with no Arc tag draws NO glyph. ⚠ The
  cover letters nothing: the card's kicker prints the date.
- ⚠ **NO `new Date()` ANYWHERE IN THIS MODULE.** An ISO date with no zone parses
  as UTC and renders a day earlier west of Greenwich — a day on the kicker, and
  across a year boundary the whole width of the plot on the mark. Both read the
  string. The registry records the same trap from the other end.
- **`cardsFor()` is the one projection into the client tree**, and it exists to
  leave `body` — every post's whole MDX source — out of the landing's payload.
  ⚠ `next.config.mjs` must name `/` under `outputFileTracingIncludes` for
  `content/musings/**`: the tracer follows imports and this folder is opened by
  path, so a missing row works in dev and 500s on Vercel.
- ⚠ **THE ROW WANTS FIVE POSTS.** At three it is a centre card with one
  neighbour each side at best (none on one side at either end); five fills the
  fade at both edges. Past ±2 the cards recede into the fade, so seven is fine.
- **`--mu-step` is the one dial and it costs page length** — every card adds it
  to the document. Five posts ≈ 3.2 viewports, seven ≈ 4.0.

## The footer's bed (ADR-105 U3)

- **One rule, gated on one stamp.** `html[data-ft-reveal] #contact.station {
position: sticky; bottom: 0; z-index: 0 }`, with `#musings.station`
  `position: relative` activating its inherited `z-index: 2` above it.
- ⚠ **UNGATED IT IS FATAL.** Sticky-bottom pulls the footer to the frame's floor
  from scroll 0, and `#voidwalker` on the capable path is a pinned TRANSPARENT
  stage — the footer would paint through the era stage over the live corridor.
- ⚠ **THREE EXITS CLEAR THE STAMP** — the inert rung, unmount, and scrolling
  back above the rack. An armed stamp with no writer is the one failure this
  cannot survive; a source ratchet counts the clears.
- ⚠ **PINNED, NEVER TRANSFORMED.** The reference does not move either; it is
  uncovered. A main-thread `translateY` off a scroll variable lags the
  compositor by one wheel step, every step.
- ⚠ **MEASURE THE REVEAL OFF THE RACK'S BOTTOM, NOT THE FOOTER'S RECT.** A
  sticky-bottom box is PINNED for the whole reveal, so intersecting it with the
  viewport reports the full viewport height at every stop — the capture's first
  cut passed a footer that had not uncovered at all (1247 → 1247).

## What a still shows and a gate does not, and the reverse

- ⚠ **A BOUNDING RECT CAN BE WRONG ABOUT WHERE A 3D ELEMENT PAINTS — NOT JUST
  LOOSE, WRONG (U2).** With an ANCESTOR `perspective` inside this sticky,
  promoted stage, `getBoundingClientRect` and the compositor disagreed by
  ~125px across and ~140px down on a tipped card: the rects were exactly what
  the arithmetic predicted, every gate built on them passed, and the still
  showed a 30px sliver. **Only a still — or an element-to-ink comparison —
  catches a projection the compositor resolved differently.** The cure is
  structural (a `perspective()` per card, above), and any future 3D pass on
  this station is read on stills before its numbers are believed.
- ⚠ **A BOUNDING RECT IS NOT THE SHAPE, AND UNDER A 3D POSE IT IS NOT EVEN THE
  RIGHT QUADRILATERAL.** U1's shelf stood at a few degrees about Y, so a card
  projected to a TRAPEZOID and `getBoundingClientRect` returned its axis-aligned
  BOUND — a box whose four corners are all outside the shape. Probed there, a
  card with one lawful notch reported three unlawful ones. The capture resolves
  its probe points through markers laid out in the face's OWN space (this
  house's custom-property law, applied to geometry).
- ⚠ **`elementFromPoint` AND `elementsFromPoint()[0]` DISAGREE INSIDE A 3D
  RENDERING CONTEXT, AND THE SINGULAR ONE IS WRONG.** Measured on the same six
  points at 1920×1247: the plural form returns the card's own descendants, the
  singular form returns `.mu__rig` / `.mu__rack` — the `preserve-3d` ANCESTORS,
  at points the card demonstrably paints. ADR-098 U5 chose a hit test over a
  regex because a computed `clip-path` measures its own serialisation; this is
  the next layer of the same lesson.
- ⚠ **A PROBE AT `ch × 0.5` LANDS EXACTLY ON THE CHAMFER'S DIAGONAL** and
  resolves by rounding — it read FALSE at 1920×1247 and TRUE at 390×844 on one
  unchanged card. Deleted: the `tr` probe at 30 % along the cut is the question.
  **A gate whose answer depends on which side of a pixel a device lands is not a
  gate.** ⚠ And the notch is asked of the FACE, because the pivot still occupies
  its full unclipped box.
- ⚠ **THE HUD'S READOUT IS SOMETHING THE STICKY BED CAN SILENTLY TAKE AWAY.**
  `useLandingScroll` picked the active station from the PAINTED rect, last wins,
  `#contact` last — so once the bed armed the corner read CONTACT for the whole
  beat. ⚠ `offsetTop` does NOT rescue you: it reports the stuck position too
  (measured `#contact.offsetTop` 17174 against `#musings`'s 17217, a station
  beginning before the one above it). The truth for a stuck station is the
  BOTTOM of the one above it, narrowed to `position === "sticky"` because the
  phone's `#about` takes a `-100svh` weld. The capture asserts the readout at
  every stop.

## Verifying

```bash
npx vitest run tests/lib/musings-row.test.ts tests/lib/rail-manifest.test.ts \
  tests/lib/v7-parse.test.ts tests/lib/section-label.test.ts \
  tests/lib/rail-instrument-marks.test.ts tests/lib/detentTable.test.ts \
  tests/lib/footer-nav.test.ts tests/lib/socials.test.ts \
  tests/lib/musings-registry.test.ts tests/lib/theme-css-sweep.test.ts \
  tests/lib/type-material-tokens.test.ts tests/lib/phone-viewport-units.test.ts
npx playwright test tests/visual/about-voidwalker-handoff-boundaries.spec.ts --workers=1
npx playwright test tests/visual/services-ring-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop  # WITHOUT --update-snapshots
npx playwright test tests/visual/mobile-section-seams.spec.ts \
  --project=iphone-14-chromium --project=iphone-14-pro-max-chromium
node scripts/capture-musings-rack.mjs --vp 1920x1247 --theme dark   # and light, 1280x720, 390x844
# the capture gates: pure-X tilt on every card's COMPUTED matrix, the card being read
# centred on the band (±2px), the head EMPTY at every unparked stop and whole in the
# reading band, and the fade ending before the right rail's readouts
node scripts/capture-site-footer.mjs  --vp 1920x1247 --theme dark   # U3 must not move it
```

Then, **from PowerShell** (Git Bash rewrites a `/route` argument into a Windows
path):

```powershell
node scripts/design-eval/mechanical.mjs --url / --theme dark  --scope ".mu" --prm
node scripts/design-eval/mechanical.mjs --url / --theme light --scope ".mu" --prm
```

⚠ **AND LOOK AT THE STILLS.** Every defect this pass found that mattered to the
composition — the pooled slack that put 205px between the masthead and the top
card — was invisible to every green gate. ⚠ **RE-RUN A SCROLL SPEC ON A WARM,
QUIET SERVER BEFORE BELIEVING A FAILURE**: five `services-ring-mobile-smoke`
cases failed while this sheet was being edited between runs and all nineteen
passed in one quiet pass.

**Process:** [sentinel/MAINTENANCE.md](../../sentinel/MAINTENANCE.md) — Cycle B
for a new surface, Cycle A after fixes.
