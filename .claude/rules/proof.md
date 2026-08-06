# Rule: Proof casefile / client cases

The client casefile is the corridor's **evidence beat** — one client's
engagement as an interactive viewport at the TOP of `#services`, over the
parked brandmark, answering the epilogue's claim before the offer arrives.
A "case" is content in `lib/cases/`; it is NOT an "arc page"
(`/arcs/[slug]`, a ported deck) and NOT `arc-cases/` (the corridor's
four-tool card, which belongs to the Arc). See LANGUAGE.md.

⚠ **There is no `#proof` station.** ADR-054's station, its parse-time
generator (`lib/v7-parse/proofStation.ts`) and its reveal controller were
deleted by ADR-056. If you are here from an old comment expecting a station
between `#about` and `#practice`, that funnel slot is gone and `#practice`
inherited its ambient-cover role.

**Read first**

- [ADR-056: Proof casefile at the top of #services](../sentinel/decisions/056-services-proof-casefile.md)
- [ADR-063: The map's reading rail and its wheel](../sentinel/decisions/063-map-reading-rail-and-wheel.md) — the rail is HORIZONTAL across the top of the console, and the console OWNS THE WHEEL while the pointer is on it (releasing at both ends). See §The reading rail below
- ⚠ [ADR-062: The map is a city in three sheets](../sentinel/decisions/062-intelligence-map-city.md) — **STALE ON THE DRAWING.** Commit 0965318 replaced the isometric city with the PDA console (`map/pda/**`) in the casefile's right panel and shipped without an ADR. ADR-062's placement, evidence semantics and confidentiality envelope still bind; its atom, sheets, crops and EXPAND overlay describe `map/MapSurface.tsx`, which is still on disk and still passes its projection test but is **NOT what the landing renders**
- **`/test/intelligence-map-lab`** — look-dev for an ORTHOGRAPHIC alternative to
  the city, beside the city. Nothing on the landing changed; the lab mounts
  the shipped `MapSurface` as its `city` variant so the comparison is against
  the real thing. See §The BOARD archetype below
- [ADR-061](../sentinel/decisions/061-intelligence-map-work-configurations.md) — SUPERSEDED by ADR-062 on the atom, the drawing and the projections; its placement, evidence semantics and privacy envelope still stand
- [ADR-054](../sentinel/decisions/054-proof-station-client-cases.md) — superseded on placement; its content model and confidentiality envelope are still live
- [ADR-029](../sentinel/decisions/029-services-card-ring.md) / [ADR-050](../sentinel/decisions/050-services-card-face.md) — the ring the casefile now holds back
- [ADR-044](../sentinel/decisions/044-services-masthead.md) — the reveal protocol and the type standard
- [ADR-008](../sentinel/decisions/008-landing-v7-background-layers.md) — the compositing rules it obeys

## Contracts

- **The runway split is the whole mechanism.** The ring's visibility rides
  `--corridor-dissipate`, which saturates ~14 % into the runway — it can
  never express "scroll past a panel". `splitServicesRunway` (`ringMath.ts`)
  gives the casefile the FRONT of the runway and re-derives the ring's
  progress over the rest, so `RING_ARRIVAL_FRAC`, `RING_EXIT_START` and the
  ADR-047 `#about` seam stay byte-identical. **Never delay the ring by
  retuning `RING_ENTRANCE_WINDOWS`** — wrong clock. Widening the dwell is
  safe by construction, but `SERVICES_PROOF_RUNWAY_VH` and
  `--svc-proof-runway` must move together; the CSS is the one that has to
  exist pre-hydration.
- **The dwell is BROWSE then HANDOFF (ADR-056 U13).** The 3.2-vh dwell
  splits at `SERVICES_PROOF_BROWSE_FRAC` (0.625): the front 2.0 viewports
  are the BROWSE BAND — scroll IS the row selector, one quarter per
  directory row, published as `--svc-proof-browse` on the casefile host
  and consumed by the casefile's own style observer (hysteresis 0.04; the
  spy freezes once `--svc-proof-out` > 0.02). A row CLICK PINS THE SCROLL
  to its band's centre — that contract is what stops the spy overriding
  the click one frame later; never remove one side of it without the
  other. The back 1.2 viewports are the 07-29 handoff, byte-identical in
  pixels: `PROOF_RELEASE` [0, 1] with `PROOF_OUT` 0.13 → 0.66 ride
  `releaseP`, proofP RE-DERIVED past the browse fraction. The round-3
  dead-scroll ruling still binds — the browse band is legal because every
  quarter changes the panel; browse runway beyond the rows' needs is the
  dead scroll coming back. `--svc-proof-in` is 0.94 AT the runway top and
  0.998 80px past it (the panels assemble on the DISSIPATE, during the
  approach). The stage is pinned; a reader who wants to read stops
  scrolling. Scroll distance buys choreography, never patience.
- **Place the fold BY VALUE ON THE RELEASE RAMP, never by eye.** 0.13 and
  0.66 are where the release reads ≈0.016 and ≈0.78 — the crossings the
  choreography was validated at. Two derived thresholds ride that ramp and
  survive a reshape only if you do this: the corner readout's
  `PROOF_OWNS_BELOW` (`useActiveSection.ts`, 0.75 ⇒ flip as the plane
  finishes) and the masthead's `REVEAL_AT` (`ServicesMasthead.tsx`, 0.5 ⇒
  decode once the casefile's top-band chrome has sunk — it shares the
  masthead's band and leaves LAST on the LIFO ladder). Overlapping edges
  prove nothing on their own: sample the crossing, where the casefile
  reads ≈0.43 against `--svc-content-in` ≈0.52 (releaseP 0.52 — total
  runway 0.82 since U13's split; the smoke converts). The smoke
  spec pins exactly that. The masthead's `REARM_BELOW` is the REVERSE of
  the same reading and stays DERIVED (`REVEAL_AT − REARM_HYSTERESIS`,
  ADR-056 U3): the stage never unparks inside the dwell, so this floor —
  not the unpark observer — is what blanks the title on the offer →
  casefile path; the pre-056 absolute floor (0.05) held it on screen for
  a third of the dwell.
- **One release ramp gates everything.** `proofRelease` is multiplied into
  `--svc-content-in` (which carries the masthead, plates, designations,
  orbit draw-on and scan interface), into the orbits' `masterOpacityGetter`,
  and into the ring's ENTRANCE CLOCK (`ringEntranceClock`,
  `CorridorArmillary`) so the cards ARRIVE MOVING on their ADR-029 fly-in —
  never as a master-opacity crossfade. Do not add a second gate — add a
  factor to one of these.
- **The host is `pointer-events: none`.** Exactly FIVE opt-ins: the tabs,
  the directory rows, `.fl-film`, `.fl-skills` (the U13 browser) and
  `.fl-imap` (the ADR-062 map). `.svc-ring-hits__hit` is at z 4 and the
  casefile at z 6, so an `auto` host silently swallows every card click once
  the ring lands. Each opt-in is safe only because the host is
  `visibility: hidden` until `data-proof-live` — keep them scoped to the
  element, never lifted.
- **The band offset is `--instrument-inset` ALONE** (ADR-048 addendum,
  owner 2026-07-29 — the casefile sits on the INSTRUMENT band, the 1440px
  breakout tier, no longer on the 1200px text band). The stage box is
  already inset by `--hud-content-inset`; adding it again double-insets
  (visible at 1440 as a 290px left edge instead of 145). Below the tier's
  ~1800px crossover the inset is 0 and the casefile shares the masthead's
  edge exactly as before; above it the casefile deliberately runs 120px
  wider per side than the offer — symmetric, so the seam reads as
  hierarchy. Do not "fix" that divergence back to `--rail-inset`.
- **The reveal needs BOTH the clock and the park gate.** `--svc-proof-in`
  alone crosses its threshold while the sticky stage is still travelling
  (measured on the masthead, twice). And the decode is DESTRUCTIVE — it
  blanks each line before queueing — so it must also be gated on
  `document.visibilityState` and force-settle on hide, or a tab switch
  mid-decode strands blank copy. rAF stops in a hidden document.
- **The proof channels are HOSTED ON `.fl-case`, and the promotion is
  scoped (ADR-056 U4, perf pass).** `setProof` writes `--svc-proof-in/-out`
  on the casefile host — their consumers all live in that subtree, and
  stage-hosted writes invalidated ~350 nodes per scroll frame.
  `data-proof-live` stays on the stage. The `data-proof-live`-scoped
  `will-change` block in casefile.css is what keeps the panels'
  gradients/shadows/SVG rastering once per state instead of once per
  frame — do not unscope it, and `contain: paint` stays banned (the
  reticle overhang, U2). Both reveal controllers' `isParked()` read a
  boolean their park IO maintains; never reintroduce a per-call rect
  read inside the style MutationObserver.
- **Geometry snaps to the HUD rail's 13-tick ladder.** Everything hangs off
  `--fl-t*`, derived from the live `.hud__rail` box; since ADR-056 U11 the two
  section rules land on **tick 1 (8.33 %) and tick 7 (58.33 %)** — the viz
  rule LEFT the labelled bearing-5 major, deliberately, to buy the clipping
  foot ~50px. Two upstreams must stay in step: `.hud__rail` in `landing.css`
  and `lib/v7-parse/hudTicks.ts`. **That drift is the only way this design
  fails silently — check it first**; the smoke now measures both rules against
  live `.hud__rail__tick` rects, so it fails a test rather than a reading.
  ⚠ `--fl-sec`'s `max()` floor carries **no clearance term** and must not
  grow one: the raw tick clears the rail top by only 6.1px at 1440×800, so
  even `+10px` beats the tick and puts the section rule 4–9px off the ladder
  at every laptop viewport (U11 — it nearly shipped that way). `--fl-tabs-h`
  lives on `.fl-case` for the same floor; scoped to `.fl-tabs` it resolves to
  nothing there and collapses every zone to `top: 0`.
- **THE TYPE LAW IS SURFACE-WIDE, not a tools-row rule.** Decorative ordinal
  and pip metadata may use 9px. Tabs, decoder and anchors start at 10px;
  directory rows and work-node identities start at 11px; readable compact
  copy starts at 12px. A selected work title starts at 17px; expanded detail
  starts at 24px title / 14px body. PT Mono owns instrument chrome and PP Neue
  Montreal owns titles and prose. When a box will not take the size, spend
  padding, leading or content density — never shrink important labels or swap
  in a serif display face.
- **A track can carry its OWN brief (`CaseTrack.brief`, U11).** Optional, with
  `track.brief ?? file.brief` in the renderer; the casefile-level brief has to
  serve all four rows, so it can only ever describe the engagement. Optional
  `CaseTrack.classification` follows the same fallback law, but both reactive
  fields render immediately and never carry `data-fl-text`: the destructive
  decoder caches targets once per client and would strand stale metadata after
  the first directory switch.
- **The tools row is a CONTROLLED gallery on ONE grid (ADR-056 Update 9,
  third pass).** `TrackPanel` owns `toolIdx` and the right panel gives the
  gallery its full height; no capability foot follows the selected tool.
  Track-level proof lives in the shared left register. The gallery body splits
  50/50 with no gap and the tabs are quarters of the same rail. The FUNCTIONAL
  NAME is the tab label; the codename is chrome (a visitor cannot know
  "Mímir"). Mode/team/year live on the identity meta line, the `shift`
  sentence beside the shot, status in the panel head. At ≤760h the TEXT COLUMN
  WIDENS instead of the sentence truncating. The shot BLEEDS to the viz box
  edges (cover, top-anchored;
  `contain`'s letterbox was the "plastered on" read) and the whole frame is
  the walkthrough button, with the bar fused to its bottom edge and the
  duration printed from `walkthrough.duration`.
- **One lightbox, `MediaLightbox`, shared by the films and the walkthroughs.**
  Do not hand-write a second — its portal, scroll lock and focus restore each
  cost a measurement to get right (Update 8).
- **`PROJECT_CASES` is inside the confidentiality envelope now.** It renders
  client copy on the public landing but lives outside `lib/cases/`, so the
  registry test scans it too. Adding a tool means adding a walkthrough.
- **Content = `lib/cases/` only.** `types.ts` keeps ZERO imports; nothing
  under `lib/cases/` may import react, three or supabase. The tool strip
  stores IDs and the renderer resolves them against `PROJECT_CASES`, which
  stays canonical for the four tools. A copy change is a content-module edit
  plus `npx vitest run tests/lib/cases-registry.test.ts`.
- **The film lightbox PORTALS to `document.body` (ADR-056 Update 8).** Not a
  style preference: `.fl-case` carries the iris `clip-path`, a translating
  arrival ladder and an `overflow: hidden` plate, and a clipped or
  transformed ancestor becomes the containing block even for
  `position: fixed`. Anything that must escape this surface portals out.
  Two traps proven by measurement, not eye: **`overflow: hidden` on `<html>`
  is not a scroll lock** (the page still scrolled 739px — non-passive
  `wheel`/`touchmove` `preventDefault` is what holds it), and **focus restore
  must wait a frame** (focusing the trigger synchronously loses to React's
  portal unmount, which hands focus to `<body>`).
- **Media plates are poster-first and self-hosted (ADR-056 Update 5).**
  `stills` shows work WHOLE — tiles fit by height, `aspect-ratio: 4/5`, and
  in NATURAL COLOUR; the `tools` duotone is a UI-capture recipe, never a
  content one. `films` mounts NO `<video>` until a click (stricter than
  `ArcMediaSection`: a mounted element costs a layer inside a ~14-layer
  budget) and NO `poster` attribute on it (measured: re-fetches the raw JPEG
  the optimizer already served). A `MutationObserver` on `data-proof-live`
  tears the element down as the plane folds — never poll `--svc-proof-out` in
  rAF. `.fl-film` is the THIRD pointer-events opt-in and `.fl-skills` (the
  U13 browser plate) the FOURTH AND LAST, both safe only
  because the host is `visibility: hidden` until `data-proof-live`. CSP is
  `media-src 'self' blob:`, so video can never move to a bucket.
- **`data-proof-live` and `data-proof-settled` are DIFFERENT gates — never
  merge them.** `live` turns on during the APPROACH, while the ladder is
  still travelling, and owns `visibility`, `will-change` and the smoke's
  assertions. `settled` turns on ~80px into the dwell (`PROOF_SETTLED_AT`)
  and exists for effects too expensive to run on a moving element — today
  the plates' `backdrop-filter`. Measured: blurring through the arrival cost
  +2.4 to +3.7ms avg on dissipate-approach and took >33ms frames from 3% to
  13–16%; radius barely moved it, because the per-frame backdrop SNAPSHOT is
  the cost, not the blur. Anything new that samples its backdrop goes behind
  `settled`.
- **The casefile dims THREE layers, not two.** `PROOF_MARK_DIM` (the mark),
  `PROOF_INTERIOR_DIM` (the haze) and `PROOF_SURFACE_DIM` (the dotted-shell
  bed — added 2026-07-30; it was the loudest layer behind the copy and the
  only one nothing dimmed). All ride `proofPresence` and are identity at 0,
  so the offer gets its bed back for free. Deepen them together.
- **A row's FILENAME and its PROJECT TITLE name the same thing** (owner,
  2026-07-31). `01_AI-FLUENCY-STUDIO/` heads "AI Fluency Studio"; articles
  are dropped from titles so the match is literal. Rename BOTH or the
  registry test's normalise-and-compare guard fails. Track `id`s are DOM ids
  and should not churn with a rename — but they are no longer load-bearing
  for the plate-sharing guard, which keys on PLATE KIND since 2026-07-31
  (`transformation` → `workshop-rollout` proved that a string-keyed guard
  does not fail on a rename, it silently stops guarding).
- **Row order IS the directory, and row one is the DEFAULT PANEL.** The
  INTELLIGENCE MAP leads and the mission report closes the file (owner,
  2026-07-31, renamed from "AI Transformation" 2026-08-02; the studio led
  until then, which presented an output as the engagement). Two consequences when reordering: the first row's plate
  mounts with the casefile, so a media row there puts its bytes on page load
  — that cost 23.6 kB while the studio led and a pure-DOM plate gives it
  back — and row one is what every reader judges the case on.
- **The directory holds FOUR rows (owner, 2026-08-02) — the projects,
  one browse-band quarter each.** The rollout/governance/metrics/report
  rows were trimmed in U13; where each one's content still lives is
  documented at the trim site in `loop-earplugs.ts`, so nothing gets restored
  from muscle memory. The lower-left band now contains the proof register
  first and the directory beneath it; the four rows do not reclaim that proof
  space. ⚠ Adding a row still RESHAPES THE BROWSE BAND — the spy
  divides it per row, so a fifth row changes every band edge and the
  smoke's band-fraction targets. Measure at 1280×720 / 1440×800 /
  1920×1080; the 10.5px row type is owner-set — take density out of
  padding, never type.
- **Proof is ONE LEFT-COLUMN 2×2 REGISTER.** New tracks carry exactly four
  `CaseBlock` records shaped `{ value, title, desc }`; `value` is required and
  textual, so a count, ratio, format or operating property has the same
  hierarchy. Budgets are value ≤16, title ≤40 and description ≤95. Legacy
  `readouts` remain a compatibility input normalized into this register, and a
  track carries one model or the other, never both. On compact-height desktop
  the value and label remain visible while description density may reduce;
  taller desktop and full-flow mobile expose the supporting sentence. The
  right panel has no generic foot: its visual owns the full panel beneath the
  designation rail.
- **The `01_INTELLIGENCE-MAP/` row is THE CITY (ADR-062).** Three sheets —
  **board · unit · below grade** — in ONE isometric, drawn from `MAP_SHAPES`
  (5), `MAP_DISTRICTS` (8) and `MAP_WORKS` (27; 24 configured, 3 person-led)
  in `lib/cases/content/loop-earplugs.ts`. ADR-061's morphing
  work-configuration field, its six facets and its CONFIGURATION · TEAM ·
  ALLOCATION projections are DELETED — if you are here from an old comment
  expecting a tile field, a persistent-node FLIP or a reach/draw ladder,
  none of it exists.
  - **Closed, do not re-open:** no sphere (the Arc owns the cosmos), no zoom
    ladder (a ladder implies a lesson; this is a record), no radial ring
    (altitude carries the relation, not radius), NO LEGEND (the drawing
    carries provenance — hatched green is Loop's own, open cream is rented,
    blue-grey dashed is the adjacent domain, gold is wayfinding), and ONE
    projection across all three sheets.
  - **Person-led work stays on every sheet.** A map that only shows what was
    configured shows what was built and hides what was not.
  - **EVERY TOTAL IS DERIVED** (`map/mapProjection.ts`), never authored. The
    prototype hard-coded three; `19 of 24` is
    `configured.length − shapes.length`, because each shape is trenched
    exactly once by its `first`.
  - **`MAP_SHAPES`' Skill counts must equal `MAP_GROUPS`' counts.** One
    portfolio described by two arrays is how a surface ends up publishing two
    totals a reader can subtract. Guarded.
  - ⚠ **DISTRICTS ARE DEPARTMENTS** — a THIRD unit alongside 22 teams
    BRIEFED and 14 teams USING THE LAYER. Never write copy that lets a
    district count read as a team count; a guard fails on "8 teams".
- ⚠ **AUTHOR THIS SURFACE AT 1280×720.** The viz box is **611×390** there
  (688×444 at 1440×800) against the ~950px console the drawing was designed
  for. Fitting the full 1160×700 authoring space in rendered every label at
  **6.8px** — below the 8.5px chrome floor — while looking correct at 1920.
  Three consequences, all measured:
  - **Each sheet crops its own viewBox** (`SHEET_VIEWBOX`) and carries its
    own label size in AUTHORING UNITS, tuned so all three land at the same
    rendered size. Changing a crop changes that sheet's rendered type —
    re-measure with a headed Playwright run, never by eye.
  - **The parts index is NOT on sheet 01 at panel size.** 35 lines need ~800
    units of height in a crop that has 570. It lives in the hover card, the
    mobile fallback, and the EXPAND overlay — which is what that control is
    for. It letters at the SHEET'S OWN TYPE: the first cut scaled it to 0.78
    and rendered the rows at 9.0px, under the reading floor, on a column
    whose whole job is to name every module. Spend height, never type.
  - **Back-row district plaques hang ABOVE their plate.** The rows leave ~18
    screen-units of gap; a plaque needs 40. Their width DERIVES from the
    sheet's type size — a hard-coded plaque hangs off its name the moment a
    crop is re-tuned.
- **Keys bind on the PLATE, not `document`** — the corridor has its own key
  handling, and React's synthetic events reach the plate from whatever
  descendant has focus. Arrival gates on `data-proof-settled`, not
  `data-proof-live`: a drawing that stages itself while the ladder is still
  travelling reads as a demo rather than a record.
- **TWO DETAIL LEVELS, ONE STATE, ONE COMPONENT (ADR-062 U1).** The casefile
  panel and the EXPAND overlay both render `MapSurface` at
  `detail: "panel" | "full"` over ONE sheet and selection. Never fork them:
  the overlay exists _because_ the panel suppresses annotation, and the
  moment they have separate markup the suppression stops being a decision
  and becomes a drift. Expanding lands on the sheet you were reading, and
  closing hands back the sheet you left the overlay on.
  - **EXPAND buys ROOM, not magnification.** At 1280×720 it is worth ~1.4×
    of scale — nowhere near enough to make a suppressed sentence readable by
    zooming. What it buys is 118 characters across the sheet against the
    panel's 83, so the reduction is a question of WHAT IS DRAWN. The `full`
    crops are therefore WIDER in authoring units and letter SMALLER; a
    `full` crop that letters larger has turned the overlay into the zoom
    ladder ADR-062 closed.
  - **What the panel drops, and only this:** the rail's second line, the
    seat note, the entry title and "why this lane" on sheet 02; the ratchet
    prose and the long subtitle on sheet 03; the parts index on sheet 01.
    The draw meter's `Never a price.` caption STAYS on the panel — a
    confidentiality line is not annotation to be reduced away.
  - **It PORTALS to `document.body` and reuses `useDialogShell`** — the same
    two reasons `MediaLightbox` documents (a clipped ancestor becomes the
    containing block even for `fixed`; `overflow: hidden` on `<html>` is not
    a scroll lock). Focus returns to the EXPAND control ONE FRAME LATE.
  - ⚠ Its inner root keeps the `.fl-imap` class (every colour routes through
    a custom property declared there, and the light rows select on it), and
    `.fl-imap--full .fl-imap__svg` must force `opacity: 1` — the arrival
    gate is `[data-proof-settled]` on the services stage, which the portal
    is outside of.
- ⚠ **NOTHING IS LETTERED ON A UNIT PLATE, and that is arithmetic.** A plate
  face is `2·(A + B)` units wide and a value like `Component + supplier
facts` is wider than the whole plate — so the values live on the LABEL
  RAIL, in the halves' own left-then-right order, and the plate carries the
  material language alone. The first cut lettered them and they crossed the
  centre line on every module, at both detail levels, because the collision
  is arithmetic and not a matter of scale.
- ⚠ **THE PROVENANCE STAMP IS AN OBSTACLE IN THE DRAWING, and a moving one.**
  `.fl-imap__stamp` is DOM chrome pinned bottom-right in SCREEN pixels over
  an SVG that scales, so its bite out of the sheet GROWS as the console
  shrinks — 1280×720 is the binding case and 1920 hides it entirely. Sheet
  03's annotation band is budgeted against `stampBox()`, not placed by eye;
  the first cut printed the derived reuse sentence, the sheet's whole
  argument, straight through the words "illustrative record". The stamp
  cannot simply move: the tab tail holds the projection note and the EXPAND
  control, all three sheets use their top-right for counts, and the foot is
  already two lines squeezed into 611px.
- **FIT IS ASSERTED, NOT REVIEWED.** SVG `<text>` does not wrap, does not
  ellipsise and does not report overflow — a label past its crop simply
  vanishes with nothing on screen to say so. So every annotation is placed
  and wrapped against `MONO_ADVANCE` (0.68 em — PT Mono's advance plus the
  0.08em tracking, confirmed by measurement), `tests/lib/map-projection.test.ts`
  re-checks those placements arithmetically, and the smoke walks all three
  sheets at BOTH detail levels measuring real glyph boxes. Neither half is
  sufficient: the arithmetic cannot see a CSS change, and the smoke cannot
  tell you which constant to move.
  - ⚠ `preserveAspectRatio="xMidYMid meet"` scales by the MINIMUM of the two
    box ratios. `box.width / viewBox.width` over-reports the board sheet by
    16 % and will tell you a 10.5px label is 12.5px.
- **The beats and the casefile SHARE their plates.** Hoisted consts in the
  content module, asserted reference-equal by the registry test. Re-typing a
  plate inline is how the two surfaces drift.
- **Context values stay ≤20 characters.** The dotted leader needs a
  non-wrapping value, so a long one runs into the next column of the
  three-up register. Pinned by the registry test. ⚠ The guard bounds the
  VALUE only — `Unit of done` + a 20-char value still ran off the panel edge
  at 1440. Keep the KEY short too, and measure.
- **BRIEF, PROOF REGISTER, DIRECTORY AND VISUAL CAN STILL CLIP SILENTLY on
  short viewports.** Walk all four tracks at 1280×720 as well as taller
  references. The proof register must retain all four values and labels; the
  directory keeps four readable rows; the right visual fills its panel
  without covering or internally scrolling its map console. A 1920×1080-only
  pass proves none of this.
  ⚠ **THE BRIEF HAS TWO NUMBERS AND BOTH ARE TRUE.** `BRIEF_MAX` in
  `cases-registry.test.ts` is **420** — a guardrail set where it does not
  force editorial truncation on the longest approved summary. The BOX at
  1280×720 is about **330** (ADR-056 U11, measured). So the test passing is
  not proof that the copy fits: anything between 330 and 420 clips its tail
  at the binding viewport, silently, because `.fl-brief` is boxed against the
  `--fl-t6` seam with `overflow: hidden` and NO scrollbar. Between those two
  numbers, measure — do not cite the guard.
- **No italics.** Emphasis is `CaseTitle.em` (upright gold) or a
  `CaseSegment` `{ em }` (the gold-wash marker). Markup smuggled into copy
  strings fails the registry test.
- **Arrival is PER-PANEL and DIRECTIONAL; so is the departure, in
  reverse.** Every panel carries `data-fl-panel`, an inline `--ci-off`, and
  its own `--fl-dx`/`--fl-dy` dimension (left column from the left,
  visualization from the right, numbers from below, chrome from above); the
  sheet's TERMINAL POWER-ON block runs the `#about` stutter + the travel off
  `--svc-proof-in`, which rides the DISSIPATE — the panels assemble WITH the
  brandmark's centering (owner, 2026-07-28). Scrubbed `clamp()` math on
  purpose — reversible, no keyframes, no writer. Travel AND tear must be
  exactly 0 at rest: these zones are absolutely positioned against the
  rail's tick ladder, so a residual shift is a drift bug, not a flourish.
- **The departure FOLDS (ADR-056 Update 1, owner 2026-07-29).** `--co-off`
  is derived in CSS as `0.56 − --ci-off` — the LIFO mirror of the arrival
  ladder, so the numbers leave first and the chrome leaves last — and the
  travel term continues each panel's own dimension INWARD past rest. The
  plane then irises shut on a scrubbed `clip-path` toward a centre vertical
  slit (the corridor caption card's aperture, run backwards), with opacity
  demoted to a tail. Two laws: the iris must TRAIL the panels (it opens at
  out 0.5 — at 0.35 it sliced legible copy mid-word at 86 % opacity), and
  the zero-at-rest rule above covers the collapsed end state too, so
  scrolling back must leave no residual transform.
- **The offer answers on a LADDER, not a switch.** `--sc` renormalizes
  `--svc-content-in` past a per-element `--sc-off` (services.css): orbit
  draw-on 0 → dotted/nodes/cartography 0.10 → cards 0.20 → plate cluster
  0.28 → svc-stack 0.30 → scan interface 0.35 → designations 0.45. Frame
  first, callouts last. Anything anchored to a projected WebGL rect takes a
  rung but NO travel. The masthead stays off the ladder — decode-only
  (2026-07-27). The rings get the same lead in WebGL via `orbitReleaseLead`.
- **The corner readout has its own `proof` row** (`sectionLabel.ts`), seated
  before `services` and selected by `sectionReadout(idx, proofOwns)`. It is
  NOT a manifest entry — the casefile shares `#services`' DOM section and
  rail detent, and an entry would break the 1:1 drift guard. The flag comes
  from `proofRelease` (not `proofPresence`, which would flicker with the
  panel fade) and rests at 1 ⇒ "SERVICES".
- **The tab strip is derived from `CASES`.** Adding a second case lights up
  a second tab with no component change. Do not ship placeholder clients on
  the public page — the dim `+ Archive` is what marks it as a series.

## The reading rail, and the wheel (ADR-063, live)

The right panel is the PDA console (`map/pda/**`), three readings:
**01 THE WORK · 02 THE CONFIGURATION · 03 THE SUBSTRATE**.

- **The rail is HORIZONTAL, across the top of the console** (owner,
  2026-08-06), three equal stations under the head. Still not a web tab
  strip: diamonds, ordinals, mono caps and a hairline spine, with ONE lit
  segment that TRAVELS along that spine to the reading it opened (keyed off
  `data-view` in CSS — do not give each station its own marker).
- ⚠ **THE RAIL'S HEIGHT IS THE DRAWING'S HEIGHT.** The field binds on
  HEIGHT at every desktop viewport: the drawings are authored `780×850`
  PORTRAIT into a landscape field, and `xMidYMid meet` scales by the
  minimum ratio — so ~200px of width letterboxes at 1280×720 while every
  pixel of height scales the type. The rail's 27px cost the drawing 7.3 %
  of its scale and returned width that was already surplus. Do not grow it
  without re-measuring rendered SVG type.
- ⚠ **THE DRAWING'S TYPE IS BELOW THE 8.5px FLOOR AND NO GUARD CATCHES
  IT.** Measured 2.92–5.25px at 1280×720, 4.76–8.56px at 1920×1080. The
  smoke asserts glyph CONTAINMENT and the rail's DOM font size — neither is
  rendered SVG type size. The headroom is in the drawing's ASPECT (a ~1.5:1
  authoring space roughly doubles the meet scale for free), never in
  shaving this strip. Open follow-up, deliberately not folded into ADR-063.
- **THE CONSOLE OWNS THE WHEEL, AND THE RELEASE IS THE WHOLE SAFETY
  ARGUMENT.** Over the plate, scroll changes the READING instead of the
  directory row. At the last reading in the direction of travel the wheel
  is handed straight back — no capture, no `preventDefault`. `#services` is
  pinned across a 3.2-viewport dwell, so a console that kept the wheel
  would be a trap on the whole document. Both directions are smoke-asserted
  at three viewports; never weaken one without the other.
  - The decision is `map/pda/pdaWheel.ts` — PURE, unit-pinned
    (`tests/lib/pda-wheel.test.ts`). Keep it that way: a gesture reducer
    written inline is a gesture reducer nobody can check.
  - **A NATIVE, NON-PASSIVE listener.** React registers `wheel` as passive
    on its root container, so an `onWheel` prop cannot `preventDefault` —
    the page scrolls anyway AND the reading changes.
  - **Two gates, re-read PER EVENT**: `SERVICES_SCROLL_OWNED_MEDIA` (below
    it the casefile is static flow content with no browse channel, and
    swallowing a wheel there breaks ordinary page scrolling) and
    `data-proof-settled` (during the arrival the reader is scrolling INTO
    the beat). The media constant lives in `unifiedServicesInstrument.ts`
    so this and the row scrollspy answer the same question from one string.
  - One step per GESTURE: 90px threshold, 470ms lockout (under the 620ms
    sweep) during which the wheel stays captured but changes nothing.
  - ⚠ This narrows, but does not overturn, the **2026-07-15 ruling** that
    retired the ring's wheel-snap hijack on this same stage. The ring's
    "wheel scrolls natively" smoke case must keep passing.
- **The active label is INK, not gold, and that is a THEME decision.**
  `--pda-hot` (#f0c86a) is the dark end of the gold ramp; ADR-058's flip
  makes the console's ground parchment, where gold-as-TEXT measures
  ~1.1:1 — measured, invisible. The lit signal rides the MARKS (diamond
  fill, wash, travelling spine) and the label just goes to full strength.
  One rule, both themes, no `[data-theme]` override. ⚠ The foot title and
  the drawing itself still fail this way in light — pre-existing, unfixed.

## The BOARD archetype (look-dev, `/test/intelligence-map-lab`)

An ORTHOGRAPHIC alternative to ADR-062's isometric, built beside it after the
owner's read that the city is too chaotic to carry this offering. **Nothing on
the landing moved** — `MapSurface`, the three city sheets and
`IntelligenceMapPlate` are untouched, and their 26 projection cases and 12
smoke cases pass unchanged. No ADR yet; one follows if a direction wins.

- **THE MEASUREMENT THAT SETTLES IT: LABEL-ON-LABEL OVERLAP, which nothing
  else on this surface checks.** `map-projection.test.ts` and the smoke assert
  crop containment and stamp clearance — the city passes both — while its
  district plaques letter through the plates and through each other **10–13
  times per sheet at every viewport, in both themes**. That is the owner's
  complaint, and it was invisible to every existing guard. The lab's readout
  compares every pair of glyph boxes; the board measures **0**.
- **Why the isometric is the cost centre, and it is arithmetic.** No label has
  a baseline (every plate edge runs at ±30°, so a label floats or skews); a
  label's position depends on the WHOLE SCENE rather than its own object
  (which is why the plaques had to hang ABOVE their plates); and depth eats
  width — a plate of face-width W occupies W + depth in a 611px console.
- **ADR-062 chose one isometric because a plan/section/services set "broke
  projection consistency". The CHROME carries that instead** — one bezel, one
  type ladder, one mark vocabulary, one colour law — which costs nothing in
  drawing space. The board's three sheets share ONE authoring space, ONE crop
  and ONE type size, so the city's per-sheet type tuning cannot drift.
- **Sheets are told apart by their OPERATION, not their vocabulary:** 01
  PLACEMENT locates and crosses, 02 ELEVATION dissects, 03 PLANE tabulates.
  That is what lets all three share the box-and-run primitive without a reader
  confusing them, and it is the answer to "if level 2 uses nodes, level 1
  cannot".
- **Measured at the binding viewport:** type renders at **11.0px** (the type
  law's identity floor; the city sits at 10.2–10.7), sheet 01 names **73**
  labels in the panel against the city's 21 — the estate is readable without
  EXPAND — and every sheet is 0 clipped / 0 under-stamp / 0 collisions /
  0 scroll at 1280×720, 1440×800, 1920×1080 and expanded, dark and light, plus
  all 27 subjects on sheet 02 at both detail levels.
- **`CaseMapChain` is new content** (`MAP_CHAINS`, optional on the
  `intelligence-map` visual). Sheet 01 draws the runs; the city ignores them.
  A chain may pass THROUGH person-led work — that is the handoff the person is
  carrying, drawn, not a gap.
- **Fit is asserted in `tests/lib/board-projection.test.ts`** (29 cases), on the
  same constants the sheets draw from. Four defects it caught that a visual
  review would not have: `Gate · ` in front of the longest gate is 555 units
  against a 540-unit rule; the longest rail value is 26 characters, which sets
  where the tier stack sits; `bar` runs to 46 characters and WRAPS TO THREE
  LINES; and a 22-unit header spacing against a 23.4-unit line box is a real
  overlap.
- ⚠ **The lab pins the CANVAS, not the viz box** — `MAP_REFERENCE_BOX` names
  the canvas and `stampBox()` converts against it; the chrome takes 78px.
- ⚠ **No light-mode override in the lab's own CSS.** ADR-058's flip SWAPS
  `--dawn-rgb` and `--void-rgb`, so in light `--void-rgb` IS the paper — one
  rule is correct in both themes, and the override this file first carried
  inverted it back to ink-on-black with sheet 03's open marks gone.
- ⚠ **The in-app Browser pane cannot screenshot it** (the pane must be
  displayed to composite, and rAF stalls when it is not — the readout's own
  hook never fires). Drive the controls and measure via `javascript_tool`,
  and shoot with a headless Playwright script. Unlike the landing, real
  scrolls are not needed: the lab is static DOM/SVG with no corridor.

## Confidentiality envelope

This is client work on a public page. `tests/lib/cases-registry.test.ts`
enforces it mechanically — treat a failure as a real incident, never as a
test to relax:

- **No money.** No currency symbols or codes, no amounts with thousands
  separators. No spend, commit, contract value, or per-seat pricing.
- **No internal links.** No board links, no repo links, no private repo
  names.
- **First names only** for client staff, in quotes and anywhere else.
- **The Intelligence Map is stricter: NO personal names or identifying
  initials at all.** No person-level ownership may travel in visible copy,
  hidden props, `data-*`, ARIA text, analytics or browser-delivered data.
  Vendors and model families are generic capability lanes; tools and
  connectors are public categories. Currency, exact per-Skill/person/workflow
  tokens and internal board/doc/repo identifiers are equally out of scope.
- Tool **codenames are in scope** for a case study (published precedent:
  `PROJECT_CASES`) but stay OUT of general service copy
  (`services/serviceDesignations.ts`).
- Where sources disagree on a number, resolve which source is authoritative
  and publish one figure everywhere. The latest Studio evidence makes **97%**
  canonical in Proof and the AI keynote; 90% and 95% are superseded, and a
  parity test must fail if either returns. Check `lib/arcs/content/**` before
  changing a case figure. The `Thoughtform Prime` handoff's 15+ teams / 20+
  Skills are also superseded and pinned OUT by the registry test, as are
  **42 / "forty-two" Skills** (superseded by 47+, 2026-08-02) and the label
  **"teams mapped"**, which claimed the 14-set's meaning with the 22-set's
  value. `lib/arcs/**` has its OWN copy of the 42 pins in
  `arcs-registry.test.ts` — the casefile's scanner walks `CASES` and
  `PROJECT_CASES` only, so an unlisted deck page is where a superseded claim
  survives unnoticed. Sweep both, in one commit.
- **Tool lifecycle is one contract.** The four Software for Few proof labels
  remain `LIVE` while all four canonical `PROJECT_CASES` records remain
  Production. If a capability lifecycle changes, update both sources and the
  parity guard in the same change; never let a proof label become a second
  status registry.
- **Two team counts are published and they are DIFFERENT SETS.** 22 =
  teams BRIEFED (rollout log, governance row). 14 = teams USING THE LAYER
  (the Intelligence Map proof register). The wording is the only thing keeping them
  apart; do not harmonise it, and never write a phrasing that lends one
  number the other's meaning.
- **The Intelligence Map's fixed reservoir and moving field count DIFFERENT
  UNITS.** The reservoir's Skills total remains arithmetic a reader can check;
  the work-configuration total must be labelled separately and may never
  borrow the `47+` claim. Guards enforce agreement within each unit across
  stats, readouts, blocks and the map without harmonising the two.

## Verifying

`/test/field-log-lab` is the look-dev harness (all five connection
grammars; variant E is what ships) — but it is a STALE FORK on the pre-U11
geometry, so never read its `--fl-t*` block as the contract. On the landing,
the beat is covered by `tests/visual/services-ring-smoke.spec.ts` — the
casefile holds, the rows work while pinned, no hit anchors publish during the
dwell, the ring takes over after, and (U11) **no box clips on any of the four
rows at 1440×800, with both section rules on a live rail tick**. That case
sets its own viewport: the project default is 1440×900, which hides every
clipping bug this surface has ever had. Drive REAL scrolls, never a teleport.

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) — Cycle B
when adding a case or a `CaseTrackVisual` kind; Cycle A after fixes.
