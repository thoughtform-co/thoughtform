# ADR-062: The work-to-intelligence map is a city in three sheets

**Status:** Accepted · 2026-08-05 (Update 1, same day, closes Outstanding 1–6)
**Surfaces:** `components/landing/home-v2/services/casefile/IntelligenceMapPlate.tsx`,
`components/landing/home-v2/services/casefile/map/**`,
`components/landing/home-v2/services/casefile/casefile.css`,
`components/landing/v7/theme.css`, `lib/cases/**`,
`tests/lib/cases-registry.test.ts`, `tests/visual/services-ring-smoke.spec.ts`
**Supersedes:** [ADR-061](061-intelligence-map-work-configurations.md) on the
atom, the drawing and the projection semantics. ADR-061's casefile placement,
its compact stage, its "no live telemetry" rule and its confidentiality
envelope all stand.
**Extends:** [ADR-056](056-services-proof-casefile.md) — the casefile, the
runway split and the browse band are unchanged.
**Source of truth:** `PRD-intelligence-map-proof-section.md` and
`thoughtform-intelligence-map-v13.html` (both 2026-08-05, owner). Where the
two disagree the PRD wins — it is the later document and closes defects v13
still carries.

## Context

ADR-061 shipped the Intelligence Map as a field of 47 Skill tiles morphing
between three projections. The owner rejected it on sight: chaotic and hard
to read. The `/test/intelligence-map-lab` and `/test/intelligence-map-diagrams`
look-dev routes built alongside it were rejected with it.

Thirteen prototypes had already converged on an answer. The PRD records the
path and closes it: a radial "intelligence field" (v1–v6) failed because a
ring treats every component as an equal peer, which is false; direct-access
tabs (v7–v8) were structurally right but drew the encoded layer as a wireframe
sphere, making proof read as a second Arc; a plan/section/field drawing set
fixed the "levels compete visually" problem but broke projection consistency.

## Decision

**The map is drawn as a city, in three sheets, all in one isometric.**

- **Sheet 01, the board.** Every work stream as a module on its team's
  district plate, all seated on one bus labelled `THE BUS / ONE STANDARD`.
  The bus is the encoding standard drawn as hardware.
- **Sheet 02, the unit.** One module exploded on a vertical assembly axis.
  Height is authority: the owner is above, and the split plates divide along
  the DEPTH axis so skill and model sit at the same altitude. How much it
  decides alone is a DIMENSION LINE, not a fifth plate — autonomy is a
  distance between the owner and the machine.
- **Sheet 03, below grade.** The same board ghosted above as context, with
  five mains beneath its spine and one riser per district tapping what its
  work uses. A square marker means the district paid to encode that shape; a
  round tap means it inherited one.

This resolves the "sheet 01 and sheet 03 compete" problem STRUCTURALLY rather
than stylistically: sheet 03 is not another arrangement of the same blocks,
it is what runs underneath them.

### Closed — do not re-open

| Decision                                          | Ruling                                                                                              |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| The sphere                                        | Never appears in the proof section. The Arc owns the cosmos.                                        |
| Zoom levels                                       | Rejected. Three sheets, direct access, any order — a ladder implies a lesson, and this is a record. |
| Radial configuration ring                         | Rejected. Altitude carries the relation, not radius.                                                |
| Legend                                            | Never. The drawing carries provenance; if a mark needs a key, the mark is wrong.                    |
| Projection                                        | ONE isometric across all three sheets. `iso(cx,cy,a,b) = [cx+a−b, cy+(a+b)·0.5]`                    |
| Sheet 03 as a closed loop                         | Rejected. It is a RATCHET — what changes is the cost of the next configuration.                     |
| Currency, vendors, model families, personal names | Never on the public surface.                                                                        |

### The atom, and the record

The persistent unit is a **work stream** with a drawn configuration, not
ADR-061's work-configuration tile with six categorical facets. Everything
renders from three arrays in `lib/cases/content/loop-earplugs.ts` —
`MAP_SHAPES` (5), `MAP_DISTRICTS` (8), `MAP_WORKS` (27, of which 24 configured
and 3 person-led).

Person-led work stays on every sheet. A map that only shows what was
configured shows what was built and hides what was not; the negative space is
what leadership reads.

**Every published total is DERIVED** (`map/mapProjection.ts`). The prototype
hard-coded three of them; `19 of 24` is now `configured.length − shapes.length`,
because each shape is trenched exactly once by its `first`.

**The five shapes already matched.** v13's Skill counts (judgment 12, voice 7,
validation 9, stakeholder 5, pattern 14 = 47) are exactly the live
`MAP_GROUPS` counts, so the track still shares `groups`/`rows` BY REFERENCE
with the ENCODE beat. The plate-sharing guard and the one-Skills-total guard
both pass unchanged.

### Two published counts changed

- **`14 teams using the layer` left the panel**, by owner ruling. It was the
  second of the two published team counts; 22 BRIEFED still prints on the
  ENCODE beat's rollout log, so the pair no longer appears together.
- **`8 districts` is a THIRD unit** — departments, not teams. A new guard in
  `cases-registry.test.ts` fails on any copy that publishes "8 teams".

## The measurement that shaped the panel

The casefile's viz box is **611×390 at 1280×720** and 688×444 at 1440×800.
v13 was authored for a ~950px console. Fitting the whole 1160×700 authoring
space into 611px rendered every label at **6.8px** — below even the 8.5px
chrome floor. It looked correct at 1920, which is the trap this surface has
fallen into repeatedly.

Three consequences, all forced by that measurement rather than chosen:

1. **Each sheet crops its own viewBox** (`SHEET_VIEWBOX`) and carries its own
   label size in authoring units, tuned so all three land at the same
   rendered size. Labels now render at 10.3–12.1px at 1280–1440.
2. **The parts index is not on sheet 01 at panel size.** 35 lines at a
   readable size need ~800 units of height in a crop that has 570. It
   survives in the hover card (which names any module), in the mobile
   fallback (which IS the index), and in the EXPAND overlay (Update 1).
3. **Back-row district plaques hang ABOVE their plate.** The rows leave ~18
   screen-units of gap and a plaque box is 40 deep; hung below, a back-row
   plaque lands on the front row's plate. Its WIDTH derives from the sheet's
   type size (Update 1) — the original hard-coded 9.4 units per character
   was a second, silent copy of `MONO_ADVANCE`.

`scripts/` has no permanent harness for this — measure with a headed
Playwright run against a real dev server, at 1280×720 first. Never author
this surface at 1920.

## Consequences

- Deleted: `IntelligenceMapField/Overlay/Detail.tsx`,
  `configurationFieldLayout.ts`, `usePersistentFieldMorph.ts`,
  `tests/lib/configuration-field-layout.test.ts`,
  `tests/lib/intelligence-map-interaction.test.tsx`, both `/test` lab routes
  (~5 MB of committed lab-archive PNGs with them), and ~1,980 lines of
  `fl-intel-map` CSS.
- `.fl-imap` is the **FIFTH** `pointer-events: auto` opt-in on the casefile
  host. Safe on the same argument as `.fl-skills` — the host is
  `visibility: hidden` until `data-proof-live` — and it must stay scoped to
  the map, never lifted to the host, which sits at z 6 over
  `.svc-ring-hits__hit` at z 4.
- Keys are bound on the PLATE, not `document`: the corridor has its own key
  handling, and React's synthetic events reach the plate from whatever
  descendant has focus.
- Arrival is gated on `data-proof-settled`, not `data-proof-live`. A drawing
  that stages itself while the casefile ladder is still travelling reads as a
  demo rather than a record.
- `useDialogShell` was extracted from `MediaLightbox` so the expanded map can
  reuse the measured Escape/scroll-lock/focus behaviour instead of becoming
  the second hand-written lightbox `rules/proof.md` forbids.
- `SkillsBrowserPlate` and `skillsFieldLayout` are now fully dormant — no
  track produces a `registry` visual with skills. They are kept as the
  second-client fallback; `tests/lib/skills-field-layout.test.ts` now
  synthesizes the tier/band half of its fixture, since that half no longer
  exists on any track.

## Update 1 — the sheets are fitted, and EXPAND is built (2026-08-05)

The first cut shipped on the owner's instruction to ship what works, with
six items recorded rather than deferred silently. All six are closed. The
resolution is the one agreed at the time: **reduced panel views plus an
EXPAND control opening the full authored drawing**.

### What was actually wrong

Not "a bit tight" — the sheets were arithmetically un-fittable as drawn, and
every defect was invisible at 1920:

| Sheet | Defect                                               | Cause                                                 |
| ----- | ---------------------------------------------------- | ----------------------------------------------------- |
| 02    | The four plates INTERSECTED, 34 units deep           | 108-unit stride under a 142-unit plate                |
| 02    | Three of four rail notes ran off the right edge      | 41 characters into a 30-character margin              |
| 02    | Both halves' values crossed the plate's centre line  | the values are wider than the plate                   |
| 02    | Title and module id overlapped in the header band    | two full-width lines on one row                       |
| 03    | ALL FIVE mains' labels collided                      | two stacked lines, 20 apart, on a 30 stride           |
| 03    | Risers were drawn through the annotation band        | band at y 590, risers reaching 615                    |
| 03    | The derived reuse sentence printed through the stamp | the stamp is chrome the drawing never accounted for   |
| 01    | The index header was lettered over the subtitle      | both hang at `x 40`                                   |
| 01    | The parts index rendered at 9.0px                    | a 0.78 type scale on a column that names every module |

### The three decisions that made them fit

1. **NOTHING IS LETTERED ON A UNIT PLATE.** The plate face is
   `2·(A + B)` = 228 units and a value like `Component + supplier facts` is
   335 at panel type — wider than the whole plate, nearly three times its
   half. The collision is arithmetic, so it survives any change of scale and
   is present at BOTH detail levels. The values moved to the LABEL RAIL, in
   the halves' own left-then-right order (`Skill · Brand voice` /
   `Model · Everyday lane`), and the plate now carries the MATERIAL language
   alone — which is what the sheet's own doc comment always asked for.
2. **A MAIN IS LABELLED AT BOTH ENDS.** The strata cannot be spread far
   enough to stack two lines per main without the deepest riser running into
   the annotation band, so the counts moved to the far end of their own
   main, where there is nothing but margin. One line per end; the stride
   only has to clear one line, and now does.
3. **THE PROVENANCE STAMP IS AN OBSTACLE, and a moving one.**
   `.fl-imap__stamp` is DOM chrome pinned bottom-right in SCREEN pixels over
   an SVG that scales, so its footprint in AUTHORING units GROWS as the
   console shrinks. It cannot move — the tab tail holds the projection note
   and the EXPAND control, all three sheets use their top-right for counts,
   and the foot is already two lines squeezed into 611px — so the drawing
   yields, and the yield is asserted against `stampBox()`.

### EXPAND buys room, not magnification

At 1280×720 the overlay canvas is 1216×584 against the panel's 611×376. That
is only ~1.4× of scale — nowhere near enough to make a suppressed sentence
readable by zooming. What it buys is **118 characters across the sheet
against the panel's 83**, so the `full` crops are WIDER in authoring units
and letter SMALLER (14 units against 19). A `full` crop that lettered larger
would have turned the overlay into the zoom ladder this ADR closed.

The panel and the overlay are ONE component (`map/MapSurface.tsx`) at two
`detail` levels over one sheet and selection. They are deliberately not two
components: the overlay exists _because_ the panel suppresses annotation,
and the moment they have separate markup the suppression stops being a
decision and becomes a drift. Expanding lands on the sheet you were reading;
closing hands back the sheet you left the overlay on.

What the panel drops: the rail's second line, the seat note, the entry title
and "why this lane" (sheet 02); the ratchet prose and the long subtitle
(sheet 03); the parts index (sheet 01). What it KEEPS is the draw meter's
`Never a price.` caption — a confidentiality line is not annotation to be
reduced away.

### Fit is asserted now, not reviewed

SVG `<text>` does not wrap, does not ellipsise and does not report overflow.
A label past its crop simply vanishes at the edge with nothing on screen to
say it happened, which is exactly how nine defects shipped past a visual
review. Two halves now cover it, and neither is sufficient alone:

- **`tests/lib/map-projection.test.ts`** (26 cases) places and wraps every
  annotation against `MONO_ADVANCE` — 0.68 em, PT Mono's advance plus the
  sheets' 0.08em tracking, **confirmed by measurement at 0.6795–0.68**. It
  pins the plate stride against the plate height, the main stride against a
  line of type, the first main against the ghosted board, the annotation
  band against both the deepest riser and the stamp, and the index against
  its own column. It fails with the constant to move, not a screenshot.
- **`tests/visual/services-ring-smoke.spec.ts`** walks all three sheets at
  BOTH detail levels, at 1280×720 / 1440×800 / 2017×1269, measuring real
  glyph boxes: nothing outside its crop, nothing under the stamp, no canvas
  scroll, type above the 8.5px chrome floor and controls above 10px. It also
  pins the chip → sheet-02 path, the portal escaping `.fl-case`, Escape,
  focus return, and that no ring anchor publishes during the dwell.

⚠ `preserveAspectRatio="xMidYMid meet"` scales by the MINIMUM of the two box
ratios. `box.width / viewBox.width` over-reports the board sheet by 16 % and
will tell you a 10.5px label is 12.5px — the first measurement pass believed
exactly that.

### Measured result

Every sheet, both detail levels, both themes, all three viewports: **no
label outside its crop, no label under the stamp, no text collision.** Type
renders at 10.2–17.2px, worst case at 1280×720 (panel 10.2–10.7px, expanded
10.6–11.4px). The mobile fallback renders its 8 groups and 27 rows at
10.5px with no clipping — its foot needed an explicit `order`, because the
shared `MapSurface` emits it before the plate's own fallback list.

### The other three

- **Light mode** (4) verified at 1280×720 on all three sheets at both detail
  levels; geometry is identical and the `theme.css` rows carry the palette.
- **The mobile fallback** (5) rendered and measured for the first time.
- **The rule's brief budget** (6) now states BOTH numbers and why they
  differ: `BRIEF_MAX` is 420 (a guardrail that does not force editorial
  truncation), the BOX at 1280×720 is ~330, and copy between them clips its
  tail at the binding viewport while the test passes.

## Verification

- `npx tsc --noEmit` and `npx vitest run` — 493 tests, all passing.
  ⚠ Node 20 required (`package.json` engines; `.nvmrc` says 20). On Node 18
  vitest cannot start at all — `ERR_REQUIRE_ESM` out of vite.
- `tests/lib/cases-registry.test.ts` carries the new guards: the map's record
  is complete and drawable, districts are never published as teams, and the
  configuration copy is anonymous and price-free.
- Visual: headed Playwright against `localhost:3003`, real scrolls, landing
  inside row one's browse quarter (~0.06 of the dwell). Sheet 01 verified in
  both themes at 1280×720, and dark at 1440×800 and 1920×1080.
- Update 1: `tests/lib/map-projection.test.ts` (26 cases) and the rewritten
  map coverage in `tests/visual/services-ring-smoke.spec.ts` — 12 smoke
  tests, 11 passed / 1 skipped on the `desktop` project. All three sheets,
  both detail levels, both themes, at 1280×720 / 1440×800 / 1920×1080, plus
  the 390×844 mobile fallback.
- ⚠ The Browser pane cannot composite this surface (it reports "not
  displayed" and rAF stalls, so scrolls never run). Measure with a headed
  Playwright run, as this ADR said from the start.
