---
paths:
  - "components/landing/home-v2/musings/**"
  - "lib/musings/**"
  - "content/musings/**"
  - "scripts/capture-musings-rack.mjs"
description: The musings shelf (#musings), its transparent stage and the footer's held bed
---

# Rule: the musings shelf

`#musings` — the writing as a shelf you flip through: the services masthead's
grammar on the editorial band, a row of CSS-3D slabs of which one faces out and
the rest show their spines, one way out. It sits between the era stage and the
footer.

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
| 961–1100 (shelf, no stage)                 | —              | opaque               | `#musings`  | armed on the runway |
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

- **The geometry is PURE and lives in `lib/musings/shelfMath.ts`** — three-free,
  zero DOM, unit-pinned. `shelfHinges` · `shelfOffset` · `shelfPose` ·
  `shelfIndex` · `shelfClock` · `shelfArrive` · `typedCount`. The writer assigns
  what it returns; nothing else computes a pose.
- ⚠ **IT IS A SHELF, NOT A FAN, AND THE DIFFERENCE IS NOT A MATTER OF DEGREE**
  (owner: the posts not in view are _"rotated 90° so we see the side … like
  putting LPs or CDs in a closet or on a shelf"_). A rack has every card at its
  own angle; a shelf has **exactly two states** and the reader pulls one out.
  `shelfPose` emits only `0` and `SHELF_TURN`, and a test asserts the set has
  two members. The detent is what keeps them two — a scrubbed shelf has every
  slab at its own angle, which IS the fan.
- ⚠ **A SLAB IS A PIVOT, A FACE AND A SPINE**, the last two a quarter turn apart
  about one hinge (`transform-origin: left center`). A single plane turned 90°
  projects to a LINE whichever edge it hinges on, so the object is the real one;
  at the pivot's 90° the two transforms compose to the identity on the spine and
  the face is edge-on. ⚠ The pivot turns AWAY (`+90`) — at −90 the face swings
  toward the reader and reaches over its neighbour under the rig's perspective.
- ⚠ **THE PIVOT CARRIES A TRANSFORM AND NOTHING ELSE.** `overflow` ≠ visible,
  `clip-path` ≠ none, `opacity` < 1 and `filter` ≠ none are GROUPING properties:
  each forces `transform-style: flat` on the element that declares it, whatever
  it also says about `preserve-3d` (CSS Transforms 2 §3). This card declared all
  four, and a flattened pivot renders its spine as a zero-width strip —
  transform applied, element measurable, every geometry gate green. The FACE
  takes the clip and the overflow; the other two left with the fan, because a
  closed slab is not a dimmed slab but a slab seen edge-on. A source ratchet
  walks every rule whose selector ENDS on `.mu-card`.
- ⚠ **THE SHELF STANDS STILL AND THE OPEN SLAB WALKS ALONG IT.** Centring the
  open slab on the rig put one object in the middle of a band whose every other
  element is on its left edge; left-anchored, the head, the shelf and the way
  out are one column — and a row of records does not move when you pull one out.
  Bounded by construction: at `MUSINGS_RACK_MAX` the furthest seat is 336px.
- ⚠ **THE YAW IS CONSTANT once the beat has arrived.** A drift tracking the
  reading position swings the whole shelf every time a slab turns — two motions
  on one gesture, and the one the reader is following is the smaller.
- **The plate is SOLID** (0.94, the owner's ruling). 0.62 was tuned against an
  opaque station; the card sits over a live canvas now, and nothing mechanical
  can read a translucent plate there — the gate composites against a background
  COLOUR.
- ⚠ **ONE WRITER, AND IT RENDERS NOTHING PER FRAME.** `useMusingsScroll` reads
  one rect in a rAF and publishes `--mu-entry` / `--mu-drift` / `--mu-head`,
  `data-mu-ready` and `data-mu-arrive` on `.mu`, `data-mu-mode` on the STATION,
  `data-ft-reveal` on `<html>`, and a transform per card. The ONLY React state is the front index, which changes at a DETENT.
  A `setState` in the rAF is a re-render across every card, every frame, on a
  page running a WebGL corridor two stations up (ADR-002).
- ⚠ **AN ABSENT `data-mu-ready` MEANS SHOWN.** The rest state — no script, a
  reduced-motion reader, any phone — is a horizontal RAIL of the same cards,
  and it is the finished page rather than a fallback. Every 3D rule is gated on
  the stamp AND on the rung, so the two can never disagree about which layout
  is live; `musings-shelf.test.ts` asserts both halves off the source.
- ⚠ **THE RUNG IS MIRRORED BY HAND** between `MUSINGS_RACK_MEDIA` in the writer
  and `@media` in the sheet. A writer and a sheet that disagree is a shelf posed
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
- **The head's decode is SCRUBBED, never queued.** `--mu-head` is one scalar
  rising over `[.08, .24]` and falling over `[.84, .94]`; `scrambleFrame` is
  PURE in its `t`, so the head un-types on the way out with no second job and no
  latch. ⚠ `advanceScrambles` may NOT be used — it DROPS finished jobs, and a
  dropped job is a latch nothing can unwind. Two registers: chrome and title
  SCRAMBLE, the paragraph TYPES. ⚠ The heading carries an `aria-label`, or a
  reader arriving mid-decode is handed the shuffle.
- **The cards arrive on a centre-out APERTURE, after the head** (the owner's own
  order). ⚠ **The glitch he means is NOT a flash** — he pulled one from the
  proof card as a photosensitivity risk (ADR-097 U12), and the house's object
  arrival is pure motion with zero fades. ⚠ **This is the THIRD host of one pair
  of numbers** (720ms in / 420ms out, `cubic-bezier(0.65, 0, 0.35, 1)`, with
  `proof-stack.css` and the Trinny route) and a source ratchet pins all three.
  ⚠ On the card's FACE, never the rack; ⚠ **and the SPINE arrives with it** — the
  first cut left two lettered strips standing in an empty frame under a
  half-decoded head, seen on the still and on no gate. ⚠ The hiding may not move
  up to the pivot: `opacity` there is the same grouping property.
  ⚠ It is a BOUNDED BURST on a hysteresis (`shelfArrive`, `arriveNext` copied):
  NaN leaves the state alone, a deep reload seeds `in`, `await` is NOT `out`,
  and it closes at 0.97 — past the reading band's own end, because a shelf that
  shut while the last slab was being read would take the reading away.
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
- ⚠ **THE SHELF WANTS FIVE POSTS.** At three it is 532px of a 1200px band
  however it is anchored, and most of the beat is air. That is correct
  arithmetic and no guard can see it.
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

- ⚠ **A BOUNDING RECT IS NOT THE SHAPE, AND UNDER A 3D YAW IT IS NOT EVEN THE
  RIGHT QUADRILATERAL.** The shelf stands at a few degrees about Y under the
  rig's perspective, so a card projects to a TRAPEZOID and
  `getBoundingClientRect` returns its axis-aligned BOUND — a box whose four
  corners are all outside the shape. Probed there, a card with one lawful notch
  reported three unlawful ones. The capture resolves its probe points through
  markers laid out in the face's OWN space (this house's custom-property law,
  applied to geometry).
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
npx vitest run tests/lib/musings-shelf.test.ts tests/lib/rail-manifest.test.ts \
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
