---
paths:
  - "components/landing/home-v2/musings/**"
  - "lib/musings/**"
  - "content/musings/**"
  - "scripts/capture-musings-rack.mjs"
description: The musings rack (#musings) and the footer's held bed
---

# Rule: the musings rack

`#musings` — the writing as a folder you flip through: a masthead on the
editorial band, a five-deep CSS-3D rack of post cards, one way out. It sits
between the era stage and the footer, and it is **the corridor's opaque
cover**, which is what frees `#contact` to be a held bed.

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

- **The geometry is PURE and lives in `lib/musings/rackMath.ts`** — three-free,
  zero DOM, unit-pinned. `wrapDistance` · `rackSlot` · `rackPose` · `rackIndex`
  · `rackClock`. The writer assigns what it returns; nothing else computes a
  pose. ⚠ It is lifted from `components/landing/latent-cases/CaseOrbitStage.tsx`
  (archived prototype code, only consumer `/test/latent-cases`) and the
  provenance is in the module header — **do not "restore" the lift's own
  `setState`-per-frame drive, its three-card slot table or its reduced-motion
  branch.**
- ⚠ **ONE WRITER, AND IT RENDERS NOTHING PER FRAME.** `useMusingsScroll` reads
  one rect in a rAF and publishes `--mu-entry` / `--mu-fan` / `--mu-drift`,
  `data-mu-ready` on `.mu`, `data-ft-reveal` on `<html>`, and a transform per
  card. The ONLY React state is the front index, which changes at a DETENT.
  A `setState` in the rAF is a re-render across every card, every frame, on a
  page running a WebGL corridor two stations up (ADR-002).
- ⚠ **AN ABSENT `data-mu-ready` MEANS SHOWN.** The rest state — no script, a
  reduced-motion reader, any phone — is a horizontal RAIL of the same cards,
  and it is the finished page rather than a fallback. Every 3D rule is gated on
  the stamp AND on the rung, so the two can never disagree about which layout
  is live; `musings-rack.test.ts` asserts both halves off the source.
- ⚠ **THE RUNG IS MIRRORED BY HAND** between `MUSINGS_RACK_MEDIA` in the writer
  and `@media` in the sheet. A writer and a sheet that disagree is a rack posed
  in 3D inside a box laid out as a flat rail — neither errors, and neither is
  visible in a still taken at the other rung. Pinned by source.
- ⚠ **THE COVER LOCKSTEP HAS FOUR READERS AND THEY MOVE IN ONE COMMIT**
  (ADR-030 §6, on record as hit five times): `home-v2.css`'s
  `#voidwalker[data-vw-mode] ~ #musings` rule, `useCorridorExitScroll`'s
  next-station query, `about-voidwalker-handoff-boundaries`' cover case, and
  `services-ring-smoke`'s ambient-hold case — which reads it **twice**, once to
  solve the waypoint and once to assert on it.
  ⚠ **`?? contactEl` IS LOAD-BEARING**: `/claude-workshop` and the Trinny
  proposal mount the same hook from their own prototypes and have no
  `#musings`. On those routes the answer is still `#contact`.
- ⚠ **THE STATION SATISFIES THE COVER CONTRACT BY INHERITANCE, SO DO NOT TAKE
  ITS GROUND.** `.station:not(.hero)` paints `var(--void)` plus the stars; the
  guard asserts `alpha === 1` AND a background image, and a station whose only
  ground is its content fails both.
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
- ⚠ **THE RACK WANTS FIVE POSTS.** It draws the front card plus two either side,
  so at five every seat is a different post; at four the far seats repeat one and
  at three it is a triptych. That is correct arithmetic and no guard can see it.
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

## Verifying

```bash
npx vitest run tests/lib/musings-rack.test.ts tests/lib/rail-manifest.test.ts \
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
