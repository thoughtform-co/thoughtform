# ADR-150: The Home sessions page is its own composition

- **Status:** Proposed (2026-10-07, owner). Built, guarded and shot; pending the owner's live read.
  Flips to Accepted on that read.
- **Surface:** `app/(marketing)/home-sessions/page.tsx` (rewritten), `components/sessions/**`
  (new: the shell, the hero, four sections, the field, the plan, `sessions.css`),
  `lib/sessions/{page,dial,field,plan}.ts` (new), `lib/sessions/registry.ts` (comment only),
  `lib/theme/heroPreload.ts` (`HERO_ROUTES` row), `components/landing/v7/theme.css` (BLOCK 4i),
  `scripts/capture-sessions.mjs` (new), `tests/lib/sessions-{page,geometry}.test.ts` (new),
  `tests/visual/sessions-smoke.spec.ts` (new); RETIRED: `lib/sheet/home-sessions.ts` and its
  guard rows (see §Guards).
- **Related:** [ADR-114](114-the-sheet.md) (the sheet ladder this retires for one page),
  [ADR-149](149-the-lattice.md) (the tokens and the frame mechanism it is built on),
  [ADR-075](075-arc-hero-curtain.md) (the hero recipe), [ADR-106](106-the-outcomes-are-one-dial-read-three-ways.md)
  (the dial register, copied), [ADR-118](118-the-arcs-overview-is-an-instrument.md) U3 (the
  travel-data readout), [ADR-127](127-the-sheet-ends-on-the-site-footer.md) (every page ends on
  the footer), [ADR-067](067-casefile-type-and-clutter.md) (declare the face; never inherit
  IBM Plex Mono), [ADR-070 U35](070-configuration-is-a-switchboard.md) (the losing drawing goes
  with its guards).

## The ask

The owner, 2026-10-07, on `/home-sessions?k=SM` (ADR-149 Phase 3): "the most basic-ass website
section", then: "what are these dividers? Our homepage looks amazing … in other sections there
isn't really any cohesion … it feels like a glorified PowerPoint … that home sessions page, it's
fucking ugly. It's unacceptable." He asked for one subpage built from scratch on front-end best
practice first, then finished with the references he shared — Prime Intellect's pinned figure
beside numbered steps, Hex / Tensorlake's console diagrams, Blunarova's ASCII numerals, the
Valorant store's tall tiles, Evangelion's numbered modules — and the house's own instruments: the
rails, the Arc's key visual, the colours, the notched frames, the dials.

## The diagnosis

A grid is invisible until something is designed on it. ADR-149 gave the sheet better tokens and
left its ladder (split · timeline · steps · cells · row · close): six generic arrangements in
turn, each a ruled text block, which reads as slides. The page has one subject, a calendar of
four mornings, and one job, a reserved seat. And the sheet could not carry what the page needed:
`SheetShell` has no hero slot, docks the wordmark from the first frame, requires a split first,
and every smoke is pinned to `.sh-*`. So the fix is not a fourth sheet knob; it is the page as
its own composition.

## The decision

**A fourth composition, not a fourth grammar.** The lattice's TOKENS and its frame MECHANISM
(`.lat-frame`, the TR + BL pair, the evenodd lip, the washed head band) are shared; the page's
skin is its own sheet, `sessions.css`, prefixed `hs-`, token-only. The shell copies `ArcShell`'s
mechanism (as `SheetShell` did): the parsed HUD injected once, `ArcHudNav` over four chapters,
`ArcRailInstruments`, `useArcScroll` in its DETAIL variant (the page has a hero, so the rails
uncover with the hero's bottom edge, the landing's curtain), `useHeroBoot`, `HeroThemeGlitch`
after the corners, and `useArcReveal` on `.hs-reveal`.

**The page, top to bottom:**

1. **The hero** — the landing's own `.hero__*` recipe on the Thought + Form plate (ArcHero's
   `<picture>` copied: portrait first, AVIF over WebP, the dark `<img>` lazy so light never
   fetches it), the service's eyebrow, title and body, a live readout of the next morning, and
   two calls to action (the next morning's mailto; the dates).
2. **01 · The morning** — a pinned figure beside four numbered steps. The figure is a DIAL: a
   clock face of the three-hour morning in the About drawing's ring register, the four movements
   as annular sectors whose sweep IS their time. `MorningDial` (a leaf, one IntersectionObserver
   at the midline, no scroll listener) writes the section's `data-step`; CSS turns the lit sector,
   its hand, its label, the hub's ordinal and the step itself.
3. **02 · The dates** — one notched housing on the instrument band: a dated axis (the next
   morning lit, a NOW cursor), then the mornings as tall tiles (a corner label, the day as the
   big figure, a chip row, the way in at the foot). Each tile is one link to its own mailto; a
   held morning is not a link.
4. **The field** — each morning's day drawn as an ASCII numeral in a seeded field of dots, the
   next one gold; server SVG, one `<text>` per row pinned by `textLength`, no digit characters.
5. **03 · The table** — the photograph in a notched frame lettered at its corners, the table
   drawn from above (eight seats, the host at the head, one seat the reader's, in gold), and the
   practical readout as filled keys framed beside their values.
6. **04 · Reserve** — the ask as one lit housing: the display line, the next morning in words,
   the one filled button (a notched `.lat-frame`), the address. Then `SiteFooter`.

**No open dividers.** The owner's verdict on the sheet was about lines that divide nothing. On
this page a line closes a box or rules inside one; sections are divided by air on a faint dot
field, and the heads carry no underline.

**Gold is spent on state:** the lit tile and its button, the dial's lit sector, the housings'
lips and bands, the reader's seat, the next numeral. The NOW cursor was gold in the first cut and
the gate counted it; it is dawn now.

## One record, by reference

Every string is read from the service's record (`serviceData.ts` / `servicePlateData.ts`, id
`guided-build`), the mornings (`registry.ts`) and the address (`socials.ts`), composed in
`lib/sessions/page.ts`. The one authored block is `MOVEMENTS`: four movements whose minutes
(15 · 60 · 75 · 30, summing to the record's three hours) are ⚠ OWNER-TO-CONFIRM like the dates.
They are drawn, never lettered. Three of the four step sentences are the sheet's own from
ADR-114; the fourth is the record's breakdown line.

## Guards

- **New:** `sessions-page.test.ts` (the record by reference; the services and proposal copy
  bans and the money regex over every lettered string; a digit only in a date, an ordinal,
  `NAV-04` or `Fig. n`; exactly the next morning lit on the tiles, the axis and the field; every
  open tile mails its own morning; held mornings are not links; the axis oldest first; the
  route's sheet order; the plate; no record in a client file); `sessions-geometry.test.ts` (the
  dial divides 360° from twelve o'clock in the morning's proportions, every mark in the crop;
  the field is deterministic, digit-free, one text node per row, under 40 kB; the plan seats
  eight, one host, one reader, clear of the table, on the half pixel);
  `sessions-smoke.spec.ts` (the stamp; the lit tile is the readout's; the dial reads 0 → 3 as
  each step crosses the midline and the hub paints only the lit ordinal; nothing sideways and
  every block inside its band at three viewports; both themes ≥ 4.5:1 on prose and chrome; the
  phone in one column with the dial static above its steps; reduced motion shows every block
  and keeps no transition; each theme fetches only its own plate and no three or Supabase).
- **Ratchets, at zero the hour it was written:** `lattice-ratchet`, `type-material-tokens`,
  `theme-css-sweep`, `phone-viewport-units`.
- **Extended:** `arcs-import-doctrine` (GUARDED gains `components/sessions` and `lib/sessions`;
  the two client leaves are named and may import no record); `landing-import-doctrine` (the
  route is walked; its graph is ~60 modules with NO server Supabase read, so its expectations
  are per entry); `hero-preload` (`/home-sessions` in `HERO_ROUTES`).
- **Retired with the ladder:** the HS rows in `sheet-close`, `sheet-composition` (its money walk
  moved here), `sheet-split-survey`, `subpages-smoke` (its HS case; the phone, `?k=SD`,
  both-themes and no-survey cases re-pointed to `/musings` and `/arcs/loop`), `lattice-parity`
  and `lattice-alias-readout` (rows, snapshots, fixture keys), HS in the SD / SE / SM `types` of
  `lib/sheet/directions.json`. The turnstone ship keeps `[types.HS]` (its types list is pinned
  exact) re-pointed at this page; `capture-subpages.mjs` skips it, as it skips the lattice lab.
- ⚠ **`/arcs` LEFT `lattice-parity`**: the instrument reads today and every filing, so its
  stills changed by a date with no CSS moving (measured 2026-10-07: the TODAY readout, the NOW
  cursor and a section count from a new Suri filing). Its parity was read on 2026-10-06 and is
  recorded in ADR-149.

## Verification (2026-10-07)

- The mechanical gate (`--scope ".hs-root"`, the frame and the close excluded) PASSES in dark
  and light at 1280×720, 1920×1247 and 390×844. It found three things on the first run, all
  fixed: the root inherited IBM Plex Mono (the face is declared on `.hs-root` now), the NOW
  cursor spent gold, and landing.css's hero letters at literal trackings and raw gold (this
  page puts its hero on the role tokens and the ink rung; the homepage keeps its own).
- `capture-sessions.mjs` at 1280×720 and 1920×1247 in both themes and 390×844: the stamp is
  `3|7|rail`, the dial reads 0 → 3, nothing scrolls sideways, no page errors.
- Awwwards, scored by hand on the stills (the jury's API key has no credit, ADR-149): round 1
  Design 7.0 · Usability 8.0 · Creativity 7.5 · Content 7.0 (the dial small at 1920 beside a
  sparse step column; two sentences said twice); round 2 Design 7.5 · Usability 8.0 · Creativity
  7.5 · Content 7.5 after the dial took its column and the repeats were cut. What still holds
  Design back: the reserve band is the plainest object on the page, and the steps column is
  sparse while the dial is pinned. MANUAL until the jury can run.

## U1 — every section fits one viewport (2026-10-07, owner)

"Can you make sure that all elements fit within the section / viewport?" On his window (about
2000 × 1000) the table's 4:5 photograph, sized from its column's WIDTH, ran past the floor; the
dates instrument did the same at 1280 × 720 and 1440 × 800. On a desktop at least 681px tall
(`(min-width: 961px) and (min-height: 681px)`) the dates and the table are now ONE VIEWPORT
each, their content seated between the rails' two ends (`--lat-rail-top` / `--lat-rail-bot`,
the arcs instrument's rule), and everything inside sizes from the room LEFT OVER: the photograph
is the body's height and 4:5 inside it (`container-type: size` on the body, `min(80cqh,
50cqw)`), the plan sits in a well that keeps the drawing's aspect (`min(100cqw, 100cqh × 320 /
224)`) so its labels' fractions stay true, and each tile sizes its day from its own height
(`30cqh`). The morning's figure pins on the same rail end and the dial is never taller than the
rail. On a short desktop (681–760) the axis gives its height to the tiles and a tile keeps one
chip; below 681 the page flows. The tiles lost the language chip, which repeated the housing's
head and the table's readout. ⚠ **A reveal rests 24px low until it is seen**, so any fit
measurement walks the page first; the first cut of the guard reported a 23px overrun that was
the animation, not the layout. Guarded in `sessions-smoke` at five viewports (1280 × 720,
1440 × 800, 1470 × 830, 2000 × 1000, 1920 × 1247): each frame one viewport tall, its content
inside the rails, nothing spilling out of a tile, a readout row or the plan.

## Left open

- The movements' minutes and the four dates are the owner's to confirm.
- The reserve band could carry a figure of its own (a dial echo, the next tile); not taken.
- The page takes no footer rise (ADR-127's weld is the sheet's); its close is a plain station.
- The homepage hero's literal trackings and raw-gold arrow are recorded, not swept.

## Consequences

### Positive

- The subpage the owner rejected is replaced by a page in the homepage's own register, on the
  lattice's tokens, with every string read from the record and every claim guarded.
- The house now has a fourth composition pattern for a page with one subject: a shell copied
  from `ArcShell`, a skin on `--lat-*`, pure geometry for each drawing, one observer leaf.

### Negative

- One more shell and one more page sheet to keep in step with the arcs' header and corners.
- The page is not graded by the sheet's turnstone knobs; its own capture script is the still.
