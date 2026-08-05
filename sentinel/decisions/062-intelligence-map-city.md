# ADR-062: The work-to-intelligence map is a city in three sheets

**Status:** Accepted (partial — see Outstanding) · 2026-08-05
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

| Decision | Ruling |
|---|---|
| The sphere | Never appears in the proof section. The Arc owns the cosmos. |
| Zoom levels | Rejected. Three sheets, direct access, any order — a ladder implies a lesson, and this is a record. |
| Radial configuration ring | Rejected. Altitude carries the relation, not radius. |
| Legend | Never. The drawing carries provenance; if a mark needs a key, the mark is wrong. |
| Projection | ONE isometric across all three sheets. `iso(cx,cy,a,b) = [cx+a−b, cy+(a+b)·0.5]` |
| Sheet 03 as a closed loop | Rejected. It is a RATCHET — what changes is the cost of the next configuration. |
| Currency, vendors, model families, personal names | Never on the public surface. |

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
2. **The parts index is not on sheet 01 at panel size.** 27 rows at a readable
   size need ~700 units of height in a crop that has 570. It survives in the
   hover card (which names any module), in the mobile fallback (which IS the
   index), and in the expanded view once that lands.
3. **Back-row district plaques hang ABOVE their plate.** The rows leave ~18
   screen-units of gap and a plaque needs 25; hung below, a back-row plaque
   lands on the front row's plate.

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

## Outstanding

Accepted as a first cut on the owner's instruction to ship what works. None
of these are blocking the beat, and all are recorded rather than deferred
silently:

1. **Sheets 02 and 03 are not yet fitted to the panel.** They carry more
   annotation than 611×390 holds at legible type: the unit's rail labels clip
   at the right edge and its plates collide; below grade's five main labels
   overlap. The agreed resolution (owner, 2026-08-05) is **reduced panel
   views plus an EXPAND control** opening the full authored drawing —
   including sheet 01's parts index — full-screen. This is what PRD §15.4
   anticipated: per-module labels and per-stream risers were "cut for
   legibility at panel size". `useDialogShell` is already extracted for it.
2. **The smoke spec has no three-sheet coverage.** The ADR-061 blocks were
   removed; the U11 clip guard still walks all four rows but its box list no
   longer names a map box, and the "three reference viewports" test still
   asserts `fl-intel-map` selectors that no longer exist. Both need
   rewriting against `.fl-imap` — including a no-clip pass at 1280×720,
   1440×800 and 1920×1080, and a check that no hit anchor publishes during
   the dwell.
3. **No `tests/lib/map-projection.test.ts` yet.** `mapProjection.ts` was
   built pure precisely so it can be unit-tested: `iso()` determinism, the
   painter sort, the derived totals, non-overlapping district plates, and the
   six-slot chip ceiling.
4. **Light mode is authored and shot at 1280×720 on sheet 01 only.** Sheets
   02 and 03 need the same pass once they are fitted.
5. **The mobile fallback is unverified.** It is authored (`.fl-imap__list`,
   the parts index as in-flow rows below 980px) but has not been rendered.
6. **`.claude/rules/proof.md` carries a stale brief budget** — it says the
   brief is pinned at 330 while the test's guardrail is 420. The real box is
   ~330 at 1280×720; both numbers are true and the rule should say so.

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
