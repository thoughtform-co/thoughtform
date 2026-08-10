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

- [ADR-070: The configuration is a switchboard](../sentinel/decisions/070-configuration-is-a-switchboard.md) — reading 02's DRAWING, promoted out of the config lab 2026-08-09. The wiring is the picture; ONE frame, ONE bright object; only what the record connects is drawn. See §The switchboard below
- [ADR-068: The glyphed index, the tool dossier, and authored wireframes](../sentinel/decisions/068-casefile-glyphed-index-and-tool-dossier.md) — the LIVE register + tools-plate contract; see §The glyphed index and §The tool dossier below
- [ADR-069: The selection morph and the answered configuration](../sentinel/decisions/069-pda-selection-morph-and-answered-configuration.md) — the selected work is the PERSISTENT OBJECT and FLIES between its two homes (1 ↔ 2); reading 02 prints the record's own answers with one reactive readout. See §The selection morph below
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
- **The host is `pointer-events: none`.** The opt-ins are the tabs, the
  directory rows, `.fl-film`, `.fl-skills` (the U13 browser) and — since
  ADR-064 — **`.fl-con`, the console frame every evidence plate sits in**,
  which subsumes the old per-plate `.fl-pda` / `.fl-imap` island rather than
  adding three more. `.svc-ring-hits__hit` is at z 4 and the casefile at z 6,
  so an `auto` host silently swallows every card click once the ring lands.
  Each opt-in is safe only because the host is `visibility: hidden` until
  `data-proof-live` — keep them scoped to the PLATE, never lifted to the host.
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
- **The tools row is the DOSSIER FIELD (ADR-068 — supersedes ADR-056 U9's
  gallery grid and ADR-066's one-column layout):** route → bay → capability
  blocks 2×2, all inside ConsoleFrame — NO header line (it stuttered the
  active tab; ADR-068 U1) and NO foot (owner ruling, same update). The 2×2
  renders `ProjectCase.capabilities` since ADR-068 U2 (the Q&A `detail`
  field is deleted). `TrackPanel` still owns `toolIdx`. The RAIL navigates
  with SHORT HANDLES (`ProjectCase.tab`, ≤14 chars); `IN SERVICE {year} —`
  rides the bay's FEED line — the one home every height rung keeps. The
  codename is chrome (lightbox label only — a visitor cannot know "Mímir").
  The evidence still BLEEDS to its box edges and the whole frame is still
  the ONE walkthrough button with the simplified bar fused to its bottom
  edge (U3 — the RUN plate and the transport chevrons are deleted). See
  §The tool dossier below for the wireframe contracts.
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
- **Row order IS the directory, and row one is the DEFAULT PANEL.** Since
  2026-08-07 (owner) the order is map → **software** → studio → atl: the
  INTELLIGENCE MAP leads, `02_SOFTWARE-FOR-FEW/` follows it, the films close
  the file. Two consequences when reordering: the first row's plate mounts
  with the casefile, so a media row there puts its bytes on page load — that
  cost 23.6 kB while the studio led and a pure-DOM plate gives it back — and
  row one is what every reader judges the case on. The registry pins the
  meta AND classification arrays in order, and the smoke's row-click branches
  are index-addressed — all three move with any reorder, in one commit.
  `stamp.ref` does NOT renumber with position (a ref identifies the record);
  `stamp.ord` does.
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
- **Proof is ONE LEFT-COLUMN GLYPHED INDEX (ADR-068) — rows, not boxes.** New
  tracks carry exactly four `CaseBlock` records shaped `{ glyph?, title, desc }`
  — a pixel-glyph KEY, a CLAIM and its evidence. Budgets are title ≤27 and
  description ≤95 (see ADR-067 for why 27 is measured rather than round, and
  why the `value` figure was deleted). The register is NON-INTERACTIVE: the
  browse band owns row selection, the rail owns tool selection. Class names
  (`fl-proof-register__list/__item/__claim/__description/__glyph`) are
  load-bearing for four smoke assertions — rename any and the smoke fails.
  Below 1070h the CLAIM + glyph remain while the sentence goes sr-only; at
  ≥1070h both show (⚠ the two rungs must TILE — 1069.98/1070; an integer gap
  printed full sentences into a 128px box, 116px of silent clip). Legacy
  `readouts` remain a compatibility input normalized into the same markup.
  The right panel has no generic foot: its visual owns the full panel beneath
  the designation rail.
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

## The glyphed index and the tool dossier (ADR-068, live)

The register and the tools plate contracts, on top of the two bullets above.

- **GLYPHS ARE KEYS IN CONTENT, DRAWINGS IN THE RENDERER.** `CaseBlock.glyph`
  is a string into `PROOF_GLYPHS` (`casefile/proofGlyphData.ts`, import-free);
  `ProofGlyph.tsx` renders rect-only SVG (no text nodes — invisible to the
  smoke's font-family walk by design). The drawings follow the particle-icon
  grammar (`thoughtform-design/references/particle-icon-grammar.md`): skeleton
  dawn .85 + signal gold + drift dawn .28 displaced exactly ONE axis unit,
  ≤16 sk+sig pixels, 7×7 grid at INTEGER cell multiples (14px compact / 21px
  tall — never 24). `tests/lib/proof-glyphs.test.ts` mechanizes the
  anti-patterns; the registry pins key validity + per-track uniqueness.
  ⚠ **Adding a glyph means re-running the CONTACT SHEET** (all 16 in one
  screenshot, judged without labels) — it caught `ownership` reading as
  `gap`'s sibling inside one visible set, the exact failure ADR-059 retired
  an icon set for. Keys per track: tooling `gap collapse ownership substrate`
  · map `board encode reuse envelope` · studio `field threshold cadence
holdfast` · atl `masters level broadcast parallel`.
- **LEFT = THE PROGRAM, RIGHT = THE TOOL.** The Software register's four
  claims speak for the fleet (the gap · the collapse · the ownership · the
  shared substrate); the per-tool one-liners live on the detail plates. The
  registry pins the four titles literally — a rewording updates the pin in the
  same commit, and titles may not match `/skills?/i`, `/%/, or
`/(live|production|shipped|wip)/i` (three separate guards).
- ⚠ **THE ROUTE DIAGRAM IS DELETED** (the e3b3386 declutter, 2026-08-07; its
  orphan file and CSS removed 2026-08-08, ADR-068 U3). `ProjectCase.route`
  DATA and its registry pins stay — held for a future drawing (the mobile
  vertical chain ADR-068 named). If a route returns it is a NEW drawing
  against the current field, not a remount.
- **THE BAY IS CHROME AROUND THE UNTOUCHED WALKTHROUGH.** `.fl-shot` stays
  the one button; the top line prints `FEED · IN SERVICE {year} —` /
  `WALKTHROUGH · {duration}` — ⚠ NO `T-01` ids (ordinals in costume; a
  bay-scoped `/\bT-\d/` smoke scan enforces it, durations excluded).
  ⚠ **THE RUN PLATE AND THE TRANSPORT CHEVRONS ARE DELETED (owner,
  2026-08-08, ADR-068 U3)** — the fused bottom bar IS the one affordance
  (cue → "Watch walkthrough" → duration), smoke-pinned uncut on every
  station, and the frame's dead centre is authorable now.
  ⚠ **THE FOUR GOLD CORNER BRACKETS ARE DELETED TOO (owner, 2026-08-10,
  ADR-068 U7)** — `.fl-bay__br*`, its four spans and its light override.
  The bay is ALREADY framed (gold-15 border + FEED line + watch bar), and
  since U5 gold buys exactly ONE thing per drawing: the CTA. Four gold-40
  marks on that same box is the RUN-plate argument one object later.
  ADR-065's bracket grammar is not repealed — this box just stopped being
  "framed but not a device" when it grew a border and two chrome lines.
  ⚠ **CROPPING IS GUARDED GEOMETRICALLY, not by scrollHeight** (ADR-068 U1):
  the smoke asserts `.fl-detail` inside the field's VISIBLE box and all four
  plates ≥99% painted, at SIX viewports incl. the wide-short band (1920×800,
  2560×1330) — reported overflow missed both the one-sided crop (assertions
  never ran wide-and-short) and the centred column's SYMMETRIC overflow,
  which reports zero. ⚠ **THE BAY HAS NO CEILING (ADR-068 U4, owner
  2026-08-08 — the reference boards' law: content fills the housing).**
  `--tf-bay: none`; the evidence fills what the blocks leave at EVERY
  height and the panel's air is `--tf-gap` alone — a bitten cap pooled the
  surplus as void between the watch bar and the floor-seated blocks.
  ADR-066's order of sacrifice keeps its SHRINK half (the frame's
  `clamp(70px, 9svh, 180px)` floor); "stops growing first" is retired with
  the captures it protected against. Tall-bay safety lives in the DRAWINGS
  (vesper's row is cqw-capped at `min(100%, 42cqw)` — height-driven 4/5
  tiles overflow the row past that; mímir's brief column is carded so it
  reads as paper, not a hole).
- **DETAIL PLATES (ADR-068 U2, owner 2026-08-08):** the 2×2 renders
  `ProjectCase.capabilities` — title + one-sentence claim, the SAME
  canonical array the Arc card tiles print, so a copy edit lands on both
  surfaces at once. `ToolDetailFact` / `ProjectCase.detail` and the
  `own`/`gold` accents are DELETED with their guards; the capability guard
  is the shape pin now (exactly 4, title ≤24 — one mono line in the Arc
  tile, the tighter home — desc ≤95, ≤3 wrapped lines at the block's 12px
  floor). Markup is `.fl-detail__t` (nowrap mono caps, full `--dawn`) and
  `.fl-detail__d` (the sentence — declares PP Neue Montreal EXPLICITLY per
  ADR-067, WRAPS, never clamps; it is on the smoke's prose-role list). The
  grid is CONTENT-HEIGHT, seated at the field's floor (`margin-top: auto` —
  the evidence above absorbs the freed height), with `grid-auto-rows: 1fr`
  equalising the two rows to the tallest plate. Single BL notch (ADR-065
  Update 1). ⚠ The inner layer is OPAQUE ground — translucent-over-edge
  floods the plate with the edge colour. Wraps 1×4 under 480px.
  ⚠ **THE BLOCKS SEAT ONCE, ON ROW ARRIVAL (U3, owner 2026-08-08)** — the ul
  carries NO tool key and the plates are keyed BY POSITION, so a station
  switch swaps text in place with zero motion ("four frames that should
  already be there"); the seat's stagger is 120+55i ms (the old 780 was
  budgeted after the deleted route entrance). The WIREFRAME keeps its
  `key={active.id}` remount on purpose.
- **GREEN RIDES THE RAMP (ADR-063 discipline):** `--atreides-light` = line,
  `--atreides-ink` = text (dark `#7a9e6a`, light `#3f5a2e` — the PDA's own
  light green-mark value). The route's step outline carries α .5 (3.33:1)
  deliberately — line work the reader counts. (`--fl-own-wash` and the
  own/gold plate sampling left with the detail accents, ADR-068 U2.)
- **WIREFRAMES ARE AUTHORED EVIDENCE — ALL FOUR TOOLS ARE DRAWN, THREE
  REDRAWN LETTERED (ADR-064 U2 extended; ADR-068 U3 + U5 + U6, owner
  2026-08-09).** Every tool in `TOOL_WIREFRAMES` (`casefile/wireframes/`)
  renders its drawn UI abstraction: NO `<img>`, NO duotone. U5's grammar:
  **GREEN IS THE FLOW, GOLD IS THE MAKE** — each redrawn drawing letters
  its operational rail in `--w-green-ink` and carries exactly ONE solid
  gold `--w-cta` plate, whose text sits on an INNER `.fl-wire__lbl` span
  (⚠ the light walk's `bedOf()` starts at the PARENT — text on the plate
  span itself would be judged against the bay, not the gold). Per-tool
  contracts (U6): mímir = THREE lettered panels `INPUT | BRIEFING | AD`
  (8 labels: the headers, the four green source titles, the CTA; the
  brief's kicker-dot grammar is back NEUTRAL; ⚠ the rail floors at 150px
  for the CTA's 18-char fit and the AD panel carries the portrait read as
  a DEFINITE basis `clamp(130px, 26%, 220px)` — never an aspect-ratio),
  vesper = prompt card | image tile | one-row composer CENTRED AS ONE
  GROUP in the frame, biased high (the set: `PROMPT · ENHANCE PROMPT ·
GENERATE`, the lettered placeholder `Loop Switch, golden hour`, and
  the card-foot model tag `NANO BANANA` in the gold TEXT role —
  `--w-gold-ink`, `--gold` dark / `--gold-ink` light, because raw gold
  letters at 1.68:1 on parchment and may not; the dock sits IN FLOW
  under the row — the U5 float and the gal/dock lockstep pair are
  retired, ⚠ the tile's height is cqh-definite `min(61cqh, 52cqw)`
  because `100%` of a content-sized row resolves to nothing, ⚠ the dock
  is `min(18cqh, 7.1cqw, 58px)` with the px term as the wide-short
  overflow guard, ⚠ the dock's WIDTH is the row's width DERIVED —
  `max(68%, calc(44% + 1cqw + min(46.4cqh, 41.6cqw)))`, a triplet that
  moves with the card basis, the gal gap and the tile height, floored at
  68% so the binding bay never squeezes the input under the lettered
  placeholder — and ⚠ centring rides the CONTENT — gal
  `justify-content` and dock `align-self`, never `align-items: center`
  on the column, whose shrink-to-fit row would strand the card's 44%
  basis; the composer row is fully SQUARE — vesper's CTA dropped the
  chamfer with the enhance plate (mímir's and babylon's plates keep the
  house cut, and the punch-through z 1 is untouched); the DRAW meter,
  nav, PRODUCT LIBRARY and MODEL rows stay deleted, the meter clause
  dormant, the digit ban surviving;
  ⚠ **U7 (owner, 2026-08-10) — THE `cqh` TERM IS THE SIZE AND THE `cqw`
  CAP IS A GUARD.** The cap binds only below W/H ≈ 1.12 and the real bays
  run 2.3–2.9, so raising it is a measured no-op; the tile's size is the
  `cqh` coefficient, paid for out of `.fl-wire__main`'s bias padding
  (6cqh → 2.5cqh) — the two are ONE budget. The dock's binding term was
  the 52px HARD CAP, not a ratio. ⚠ 1280×720 is down to **2.3px of
  slack**: anything that adds height takes it back out of that padding
  in the same edit and is re-measured there.
  ⚠ **ENHANCE PROMPT IS NOT A PLATE (U7)** — wand + label, no border, no
  wash, `padding: 0`, the composer's `gap` doing the spacing. ONE framed
  object in the row; only GENERATE commits. The light walk is untouched
  BY ARITHMETIC: `bedOf()` takes the first ancestor at α ≥ .85 and
  `--w-green-soft` was α .14/.16, so this was never the label's bed —
  `.fl-wire__comp`'s opaque `--w-plate` was. `--w-green-soft` is now
  DORMANT, not deleted (both theme files keep it: it is the green half of
  the plate recipe a future drawing needs)), babylon = the PROMINENT
  green chain `TRANSCRIBE → TRANSLATE → DUB → APPROVE → [UPLOAD]` over
  the REAL segments table | portrait player — the flow letters at
  `clamp(10px, 1.55cqw, 13px)`, the surface's ONE size exception, the
  gold UPLOAD is WELDED to the chain's end, and the table's four EN → JA
  transcript rows are lettered verbatim (15 labels total; ⚠ every cell is
  a pinned smoke label, so lines are CHOSEN digit-free and currency-free;
  ⚠ the connectors are 1px DIVS, never svg lines — a stroked single-axis
  path reports a 0-height rect to the collapse guard; the portrait read
  still comes from the COLUMN's height-derived width), heimdall = plugin
  panel | canvas template (`BRIEFINGS · SYNC · TEMPLATE`, untouched on
  the D5 gold-only grammar). The smoke's `WIREFRAME_STATIONS` table pins
  each label set EXACTLY (sorted-array equality; the smoke counts EVERY
  text-bearing element) — ≤15 lettered elements (U6), PT Mono ≥8px, NO
  DIGITS, no currency, in dark and light (labels ≥4.5:1 composited on
  their own opaque bed incl. ink-on-gold ≈8.2:1; hairlines ≥1.5:1 with
  `--w-green` in the probe). Element rules are scoped `.fl-wire--{tool}`;
  only `.fl-wire`, `.fl-wire__in` (the size container + `--w-*` tokens),
  `.fl-wire__lbl` and the U5 grammar pair (`.fl-wire__cta` /
  `.fl-wire__lbl--grn`, grouped-but-scoped to the three redrawn tools) are
  cross-tool, and a new `--w-*` token lands in casefile.css AND theme.css
  in one commit. ⚠ The capture branch is DORMANT, not deleted: a fifth
  tool without a drawing renders its duotoned capture and the smoke's
  `kind` field re-arms that half of the filter law. ⚠ The one obstacle
  over a drawing is the halftone veil (the RUN plate is gone) — and since
  the U5 punch-through THE CTA RIDES ABOVE IT: the frame's veil
  `content: none`s itself via `:has` for the three redrawn tools, an
  identical veil paints on `.fl-wire__in::after` (two recipes + a hover
  pair, pinned in lockstep), and `.fl-wire__cta` carries z 1 — the
  drawings' ONE sanctioned z-index, forced by `.fl-wire__in`'s
  containment stacking context; ⚠ every ancestor between a CTA and the
  size container stays transform-, filter- and z-free (vesper's old
  `translateX(-50%)` dock trapped the CTA under the veil). Heimdall stays
  fully veiled; nothing else paints over the frame.
- **PRM UNWRAPS THE CONSOLE TOO — THREE GATES, ONE PAIR.** console.css's
  unwrap gate is `(max-width: 980px), (prefers-reduced-motion: reduce)` —
  the SAME pair as casefile.css's static-flow gate AND (since 2026-08-08)
  pda.css's map fallback gate. Width-only anywhere in that trio leaves
  desktop-PRM visitors a collapsed box: the plates measured HEIGHT 0 before
  ADR-068 U1, and the map's console measured 90px (rail alone, its drawing
  collapsed in the unwrapped field) once the U2 foot removal unmasked it.
  Never let the gates drift; the PRM smoke case asserts a visible plate with
  real height.
- `babylon.year` / `heimdall.year` are **2026** (first commits 2026-02);
  mimir/vesper 2025. The header prints them as `IN SERVICE {year} —`.

## One type ladder, four claims, tab plates (ADR-067, live)

- **TWO FAMILIES, BY ROLE.** PT Mono owns instrument chrome; PP Neue Montreal
  owns titles and prose. ⚠ **`--font-mono` IS IBM PLEX MONO**
  (`app/styles/variables.css`), NOT the casefile's `--fl-mono` (PT Mono) — the
  console carried it from the v18 port, so every descendant that declared no
  family inherited a THIRD face, including four lines of body copy in
  `.fl-cap__d`. Anything whose content is a sentence must declare
  `--font-pp-neue-montreal` **explicitly**; inheriting is how this recurs.
  Same class of bug as ADR-066's `--font-sans`, which was declared nowhere.
  ⚠ **The guard is per-ROLE, not per-family** — a sentence in mono passes any
  "no third family" count, so the smoke asserts both halves.
- **`.fl-con__foot p` reads `--fl-copy`**, the same token as `.fl-brief__body`
  (owner). One token, so the two columns cannot drift.
- **THE PROOF REGISTER IS FOUR CLAIMS — `CaseBlock` is `{ title, desc }`.**
  The display figure is deleted: across four rows its sixteen values carried
  NINE grammars, and row one's `27`/`47` restated the directory's own
  `27 → 47`. A row's headline count belongs on its directory `meta`.
  ⚠ `title` ≤**27** chars, MEASURED: at 1920×1080 the half-column is ~234px at
  13px mono / .045em ≈ 8.4px an advance, so 28 characters wrap — and a wrapped
  claim steals a line from its own sentence.
- ⚠ **BELOW 1070h THE ROW IS GLYPH + CLAIM ALONE, and it is arithmetic
  (ADR-068, retunes this ADR's 931h rung).** At 1280×720 the register box is
  86px and four index rows fit at ≈21.6px each; four TWO-LINE rows need
  259.5px and the directory needs 144, which the seam→tick-11 band only
  affords at 1070h (the plan's 1000h clipped the directory by 36px — and the
  old 931h rung had the same latent defect, ~21px at 960h). Tall rung:
  `--fl-proof-h: clamp(264px, 24svh, 300px)` (27svh clipped the directory by
  11px at 1920×1080). ⚠ `align-items: center` on the rows, never `baseline` —
  grid synthesizes a replaced element's baseline from its bottom edge and the
  glyph grows every row. The list is `grid-auto-rows: 1fr` so hairlines sit at
  the same heights on every file; `1fr` = `minmax(auto, 1fr)`, so a row still
  overflows loudly rather than truncating.
- **TOOL LIFECYCLE HAS ONE REGISTRY, and the proof register is not it.** The
  `· live` suffix left the tools claims; `PROJECT_CASES[].status` is canonical
  and the guard checks it there. A proof claim may not restate it.
- **A STATION IS A NOTCHED PLATE, cut TOP-LEFT** (ADR-067 U1, owner
  2026-08-08 — flipped from the 08-06 top-right so the plates share the
  console's own TL+BR override; the seam between plates starts below the
  notch for free, clipped by the owning station's own `clip-path`). The
  active plate is filled and **UNDERLINED, not welded**: the lit spine is
  back at `bottom: -1px` on the rail's border row, and the weld `::after`
  is DELETED — the two rules wanted the same pixel (this ADR's documented
  conflict) and the owner's underline resolved it by deletion. The spine
  carries no chamfer clip any more (the bottom edge is square); its width
  stays a full station pitch, so the `--rail-i` translate still lands.
- ⚠ **THE ORBIT ARCS ARE DELETED (ADR-068 U1, owner 2026-08-07)** — the
  console is the mockup's one-box panel now (single dawn-08 hairline, TL+BR
  chamfers by owner override of ADR-065, top glow, scanline; no ellipses, no
  outer bezel). The `ry < 525` / `rx ≥ 420` arithmetic this bullet carried
  survives as a record in console.css comments should ambient arcs ever
  return; the "two diagonal lines" incident it solved cannot recur on a
  surface with no arcs.
- **1920×1080 IS A REFERENCE VIEWPORT NOW**, and it is the worst case:
  `.fl-brief` hangs off the `--fl-t6` seam, which is NOT monotonic in viewport
  height — 199px at 1280×720, 221px at 1440×800, **202px** at 1920×1080 with
  `--band-copy` at its 18px ceiling.
- ⚠ **STILL OPEN: the map's SVG renders in `--font-mono` (IBM Plex)** while
  `MONO_ADVANCE` is documented as PT Mono's advance and every label placement
  derives from it. Either the constant or the font is wrong. Its own pass — the
  fix moves every label on all three readings.

## One rail, one foot, and the Studio's sheets (ADR-066, live)

- **EVERY PLATE SWITCHES ON `ConsoleRail`** (`casefile/console/ConsoleRail.tsx`)
  — ADR-063's reading rail generalised to N stations. Diamonds, mono caps, a
  hairline spine, ONE lit segment travelling off `--rail-i` / `--rail-n`. It is
  a `role="tablist"` with roving tabindex; _"not a web tab strip"_ was always
  about the LOOK, which is preserved.
- ⚠ **NO ORDINAL ANYWHERE ON THIS SURFACE.** The tools' `01 · MÍMIR`, the
  films' `01 / 02` and the map's `01 02 03` left together (owner, 2026-08-06) —
  the spine carries order positionally, and keeping the numeral on one rail
  would be the inconsistency in a new place. **The label is the FUNCTION
  alone.** Smoke-asserted per row. The codename survives as PROVENANCE on the
  tools foot, never as a label.
- ⚠ **THE `data-n="4"` DIAMOND IS BACK (ADR-068, supersedes the hide).** The
  hide was real arithmetic — 22-char labels needed 136px against 122.9
  available — but the OWNER renamed the rail to short handles
  (`ProjectCase.tab`: BRIEFING AGENT · IMAGE & VIDEO · UGC DUBBER · STUDIO PM,
  68–106px at 10px/.16em) and the full name moved to the plate header. The
  input changed, not the math; the arithmetic comment lives on in console.css
  beside the restored rule. The 10px control floor still binds.
- ⚠ **"THE FOOT IS WHERE CONTEXT GOES" IS AT ITS LIMIT CASE: NO PLATE PRINTS
  ONE (owner, 2026-08-08, ADR-068 U2).** The map's reading sentence and the
  Studio sheets' captions were the last two and both were removed; the tools
  row lost its in ADR-068 U1 and the films never had one. `CaseSheet.foot`
  is deleted; `footCopy` survives for the map's small-screen fallback list
  and the SVG's accessible name. The smoke's box-clipping sweep asserts the
  absence on EVERY row — that is what stops a foot drifting back one row at
  a time. `ConsoleFrame`'s optional slot and its CSS stay, as the context
  mechanism rather than an invitation.
- ⚠ **"ONE COLUMN — capture → facts → foot" IS SUPERSEDED (ADR-068).** The
  tools plate is the dossier field now (route → bay → capability blocks —
  the header line and the foot were BOTH removed in ADR-068 U1: the header
  stuttered the active tab, and the owner ruled this plate says nothing in
  the foot — this ADR's "a plate with nothing to say still omits it",
  finished). `IN SERVICE {year} —` lives on the bay's FEED line, the one home
  every height rung keeps. The blocks render `ProjectCase.capabilities`
  (ADR-068 U2 — one canonical array shared with the Arc card;
  `ProjectCase.detail` is deleted). What still binds: the deleted identity
  column stays deleted, `surfaces`/`tagline` stay deleted, and the ORDER OF
  SACRIFICE is unchanged in BOTH directions — the capture shrinks first
  (`clamp(70px, 9svh, 180px)` floor) and STOPS GROWING first (the ceiling is
  `.fl-bay`'s `max-height`; ⚠ never a definite flex-basis on the frame — it
  freezes the enclosing column's min-content and worsens the overrun,
  measured).
- ⚠ **`--font-sans` IS DECLARED NOWHERE IN THIS APP.** `.fl-con__foot p` asked
  for it and rendered in the browser's default sans — that was the owner's
  "the font feels a bit different from the rest". The token is
  `--font-pp-neue-montreal`. The foot now carries the Arc caption card's
  spacing, leading and alpha (`.008em` / 1.45 / `dawn .88`) one size step
  below it, and NO text-shadow (the Arc's lifts it off live WebGL; a console is
  opaque).
- **A ROW CAN CARRY SHEETS** (`CaseSheet`, `kind: "sheets"`). The Studio row is
  three: the output, the rule, the limit. It adds almost nothing — the rail,
  the foot, `.fl-stills` and `.fl-caps` all already existed; only the
  two-column comparison is new markup.
  ⚠ **A SHEET IS NOT A SECOND DIRECTORY.** Rows are bodies of work, sheets are
  facets of one. A sheet that reads as a separate project wants a ROW — and a
  row reshapes the browse band. Pinned: >1 sheet, exactly 2 compare columns,
  exactly 4 facts.
  ⚠ **The comparison's two columns are typographically identical on purpose** —
  two legitimate categories with one boundary, not a preferred option beside a
  fallback. A gold wash on the AI column turned a policy into a recommendation.
- ⚠ **A CLAMP IS A BELT AGAINST FUTURE COPY, NEVER A LAYOUT LEVER.** Two
  `-webkit-line-clamp` rungs in this pass truncated LIVE copy while their boxes
  had 68px and 150px of unspent height — and every overflow assertion stayed
  green, because a clamp truncating text IS its "fitting" behaviour. If today's
  copy hits the clamp, the clamp is wrong. Order of sacrifice on the tools
  plate: a screenshot loses pixels before a sentence loses meaning.
- ⚠ **TWO PRE-EXISTING LEFT-COLUMN CLIPS ARE OPEN** (ADR-066 §Left open):
  `.fl-brief` loses 19px on the Studio row at **1920×1080** (the box is
  _smaller_ there than at 1440×800 — it hangs off the non-monotonic `--fl-t6`
  seam, and the smoke's viewports are 1280/1440/**2017**, so 1920 is a gap),
  and `.fl-proof-register__label` clips 5–9px on every row at laptop heights.
  Adding 1920×1080 to the smoke's reference viewports is the durable half of
  either fix.

## One console frame, four plates (ADR-064, live)

Every evidence plate renders inside `ConsoleFrame` (`casefile/console/**`) —
since ADR-068 U1 the frame is the owner's mockup panel: ONE dawn-08 hairline,
chamfers TL+BR (owner override, ADR-065 U2), the gold glow off the top edge,
scanline, opaque ground; the orbit ring and outer bezel are deleted. The
panel is ONE instrument that changes what it displays, not four boxes sharing
a slot.

- **The frame is a BEZEL THE CONTENT BLEEDS INTO, never a letterbox.**
  ADR-056 U9's _"the shot BLEEDS to the viz box edges"_ still binds; the edge
  is now the CONSOLE's inner edge. A plate that centres its content with air
  on four sides has misread it. Measured: the tools shot still reaches the
  right wall (1px = the border) and the rail's underside.
- ⚠ **NO FILTER ON THE _AUTHORED_ EVIDENCE — the line is AUTHORED vs CAPTURED**
  (ADR-064 U2, owner, 2026-08-06). ADR-056 U5 stands unamended for the stills
  (Loop's ads) and the films (their commercials): intended colour, left alone.
  The four TOOL CAPTURES are arbitrary screenshot UI, which is exactly what the
  duotone was built to NORMALIZE — `.fl-shot__img` carries the services chain
  plus the halftone dot veil, in both themes. "Chrome vs evidence" was the
  earlier line and it put a UI capture on the same side as a commercial.
  ⚠ **The smoke asserts BOTH halves** — this image filtered, every other plate
  image not. A narrowed ban alone tests strictly less than the blanket one it
  replaces: it cannot tell a deliberate exception from a treatment that
  silently stopped applying.
  ⚠ One recipe, three renderers: `.svc-plate__pbg`, `.fl-shot__img` and
  `buildGoldToneLut`. Move them together.
- ⚠ **"THE RAILS ARE NOT UNIFIED" IS SUPERSEDED (ADR-066).** Its stated reason
  was the tools rail's two-line `01 · MÍMIR` / `BRIEFING AGENT`, and the owner
  deleted that line on 2026-08-06 — see §One rail above. What still binds:
  `rail` and `foot` are slots rendered as DIRECT flex children of the console,
  because the rail is `flex: 0 0 clamp(32px, 7%, 44px)` — a percentage of the
  console's height that any wrapper would resolve to zero.
- **The foot is OPTIONAL, and it is the CONTEXT slot** (ADR-066) — and since
  ADR-068 U2 (owner, 2026-08-08) NO plate passes one: the map's sentence and
  the sheets' captions were the last two. The slot and its CSS stay as the
  mechanism; the smoke asserts the absence on every row.
- ⚠ **BELOW 980px THE CONSOLE UNWRAPS, IT DOES NOT HIDE.** Hiding it takes the
  plate's CONTENT with it — three of the four have no substitute. Only the map
  hides its own console, because it has the stream index to put there.
- ⚠ **`clip-path` MAKES THE CONSOLE THE CONTAINING BLOCK FOR `fixed`
  DESCENDANTS.** `MediaLightbox` already portals to `document.body`; that is
  now load-bearing for three plates instead of one.
- **`.fl-plate--stills` is `padding: 0`** like films and tools. It was the one
  plate carrying the base padding AND its own; the frame's gap is the outer
  inset now.
- ⚠ **THE PANEL HEAD HAS ONE DESIGNATION, NOT TWO** (owner, 2026-08-06,
  ADR-064 U1). The right slot and `CaseTrack.vizLabel` are DELETED — they
  restated the masthead, the directory row and the brief on every row. The
  path on the left stays. If a panel seems to need a second designation, the
  question is what the first one failed to say.
- ⚠ **READING 03 HAS NO SECTION RULES.** `THE TEAMS THAT RUN THE WORK` and
  `THE SHAPES THEY ALL DRAW ON` are deleted — the foot says it in a sentence.
  They were a matched PAIR naming the two rows, so they left together;
  labelling half a symmetric drawing is worse than labelling neither. That
  bought the crop 718 → 632 units and the type 4.46–5.45 → **5.06–5.63px** at
  1280×720 (8.20–9.11 at 1920, where it clears the 8.5px floor for the first
  time). A label that explains a drawing competes with it for the same
  currency.
- **Light contrast is guarded on ALL FOUR ROWS.** Putting the plates on the
  map's parchment ground turned ADR-058's accepted "gold as small text is
  1.8:1" into a visible defect — measured 1.25:1 on a tab ordinal beside a map
  at 4.79:1. Fixed with the ADR-063 U2 ramp on those two plates only; the
  other sites ADR-058 named are still a sweep. ⚠ Dim states go to INK, not to
  a dimmer gold: no alpha of a light hue reaches the floor.

## The selection morph, and the answered configuration (ADR-069, live)

- **THE SELECTED WORK IS THE PERSISTENT OBJECT, AND IT FLIES.** Reading 01
  draws it as a cartridge in the grid, reading 02 as the core — the SAME glyph
  at `CORE_K` — so a 1 ↔ 2 change MOVES it rather than replacing it, while
  everything else re-rasters on the existing sweep. That is what keeps the
  readings **terminal display-switching, not zoom** (owner): the field never
  scales and no `viewBox` is tweened. Flavours: flight on 1 ↔ 2 by any trigger
  (including the default `shown[0]` from the rail or the wheel), bloom on
  3 → 2 and on 3 → 1 once a record has been opened, raster otherwise.
- **The math is `pdaFlight.ts` — PURE, unit-pinned** (`tests/lib/pda-flight.test.ts`).
  ONE `getBoundingClientRect` per transition, taken in `open()`/`go()` BEFORE
  the state changes, while the outgoing crop is still in the attribute. Two
  invariants are asserted because the casefile moves this subtree as it
  arrives: the box's x/y never enter the arithmetic (the proof ladder's
  translate is invisible), and a uniform ancestor scale cancels out of both the
  deltas and `dk`. The test resolves the start pose back to screen pixels and
  compares it with where the source WAS — twenty slots × both directions × four
  field sizes. No rAF, no wall-clock, no post-hoc measurement (ADR-061's bound).
- ⚠ **THE DOCK CLASS IS NOT GATED ON `still`**, unlike everything else on this
  sheet. An element arriving under a stationary pointer fires `mouseenter` on
  the next move, and a hover that stripped the class mid-flight would snap the
  object across the panel. `entry` is STATE, decided once per transition.
- ⚠ **THE DOCKING GROUP HOLDS THE CARTRIDGE ALONE.** `fill-box` + a centred
  origin means the flight measures itself against that group's own box; the
  Cartridge's path touches all four extremes so the box IS the rect, with no
  measurement. A child reaching past it moves the origin — which is why the
  core's pad fringe is a SIBLING.
- ⚠ **Three bails, all cheap:** an interrupt inside `PDA_FLIGHT_GUARD_MS`
  rasters (its start pose would come from a rect the object has not reached, and
  reading the painted pose costs a `getComputedStyle` this surface may not
  spend); a zero-size box rasters (the desktop gate leaves `display: none`); a
  degenerate rect rasters. The wheel cannot interrupt its own flight — the
  470 ms lockout outlasts the 420 ms travel, and `PDA_FLIGHT_MS` is duplicated
  in `pda.css`'s `flPdaDock`, so **move both**.
- **READING 02 ANSWERS NOW: the drawing letters the NAME, the readout carries
  the SENTENCE** — ADR-062's division, where provenance rides the material
  language and is never written down twice. runs = Skill / lane · rch =
  `k[0]` / surface · inh = context / graph · gat = **the bar, wrapped**. The
  readout rests on `why` and swaps to the hovered module's note.
  ⚠ **`evals` (41 chars = 142 % of measure) and `k` joined (35 = 121 %) CANNOT
  be lettered in a module** at any size that clears the floor — that is why gat
  answers with the bar and the module shows `k[0]`. Nothing is lost; it moves to
  the hover. ⚠ **NO PAIR MARK** between Skill and lane: they are an
  interdependent pair (owner, 2026-08-05) but this surface has NO LEGEND, and a
  `⇄` would also break the mono advance the whole fit table rests on.
  Considered and rejected.
- **The answer measure is `w − h − 11 − 6` = 151** at 224×56, and **size 8 is
  the largest with room left** — the graph node ("COMPONENT + SUPPLIER FACTS",
  26 chars) is at 93.6 %; 8.5 is at 99.5 % and 9 is over. The header keeps the
  module label's `.14em` (advance **0.74**, a different measure) at 7.5, SMALLER
  than its answer: the question is chrome, the answer is the record.
  ⚠ **Vertical clearance is measured against the LINE BOX (~1.3 em), never the
  font size** — 20 units of pitch clears by 8, the naive 12 clears by under 2.
  Same mistake the DECIDES ALONE pair paid for one size up. `MONO_LINE_BOX` and
  the baseline functions are exported so the guard checks the arithmetic.
- **PERSON-LED WORK ANSWERS ALL FOUR**, printing what is NOT bound — the city's
  unit-sheet copy, so one absence is never described two ways. Its readout rests
  on the **bar** (no lane was chosen, so there is no "why this lane").
  "CONTEXT HELD BY THE PERSON" is 26 chars, i.e. the same ceiling as the graph
  node.
- **The open record lights its own CUT EDGE**, and only once reading 02 has been
  shown. The notch is where a cartridge is keyed, so it reads as latched rather
  than as a fifth gauge state, and it gives the return flight somewhere to land.
  Nothing is marked at rest: `shown[0]` is a default, not a choice the reader made.
- ⚠ **EVERY CARTRIDGE MUST TAKE A CLICK AT ITS CENTRE, and this was broken.**
  A person-led body is `fill: none` and an unfilled SVG path hit-tests on its
  STROKE alone, so all three person-led streams reached the bare `<svg>` and did
  nothing — on a surface whose whole argument is that the negative space is a
  reading. It survived because the keyboard path worked and the smoke clicked
  `.fl-pda-hit` FIRST, which is configured and filled. The fix is a transparent
  hit rect matching the path's extremes (so the flight's origin does not move);
  the guard hit-tests all twenty with `elementFromPoint`. **A new glyph state
  with no fill re-arms this.**

## The reading rail, and the wheel (ADR-063, live)

The right panel is the PDA console (`map/pda/**`), three readings:
**THE WORK · THE CONFIGURATION · THE SUBSTRATE**.

- **The rail is HORIZONTAL, across the top of the console** (owner,
  2026-08-06), three equal stations. Still not a web tab strip: diamonds, mono
  caps and a hairline spine, with ONE lit segment that TRAVELS along that spine
  to the reading it opened — do not give each station its own marker.
- ⚠ **THE RAIL LEFT THIS FILE'S SURFACE (ADR-066).** It is `ConsoleRail` in
  `casefile/console/`, shared with all four plates, and it **lost its
  `01 02 03`** with every other ordinal on the surface. The reading's full
  title survives as the SVG's accessible name. The spine now keys off
  `--rail-i` / `--rail-n` rather than `data-view`, because one rail cannot
  count readings when the other plates count stations; `data-view` still rides
  the plate root as the map's own state, and the smoke reads it.
- ⚠ **THE CONSOLE HAS NO HEAD AND — since 2026-08-08 — NO FOOT AT ALL**
  (ADR-063 U1 took the head and the foot's title; ADR-068 U2 took the foot's
  sentence too, owner). The badge said "Intelligence map" beside a column
  headed INTELLIGENCE MAP; the meta said "Loop Earplugs" beside a tab, a path
  and a masthead that say it; the foot title said "01 · THE WORK" under a lit
  tab reading "01 WORK". **Everything removed was HEIGHT, and height is the
  only currency the drawing spends** — that is what paid for both the 10px
  tabs and the bigger drawing. Smoke-asserted absent. The reading's title
  lives on in the SVG's `aria-label`, and `footCopy`'s sentence survives on
  the small-screen fallback list alone. ⚠ The SNAPSHOT DATE went with the
  head and now appears nowhere; it was the one non-redundant piece.
- ⚠ **EVERY SIZE ON THIS SURFACE IS DERIVED FROM A MEASURE, and the measures
  differ within one box.** `CART_TYPE` (pdaGlyphs) and `T` (PdaViews) carry
  the tables. The cartridge title is anchored to the LEFT WALL ALONE (157
  units); its metadata rows are PAIRS pinned to opposite walls sharing 151
  BETWEEN THEM, so growing either closes the gap in the middle. `Module`'s
  label derives from its own height and is 03's ceiling. Never round one to
  match its neighbour — they are different measures.
- **Each reading CROPS ITS OWN VIEWBOX** (`VIEW_BOX`), because the field is
  landscape and the authoring space portrait, so the drawing is HEIGHT-BOUND
  and empty vertical margin is a direct tax on type. Measured waste was 82 /
  288 / 132 units. ⚠ 02's content runs to **x=797, past the 780 authoring
  width** — its crop is 800 wide and a 780 crop silently clips its right-hand
  modules.
- ⚠ **LABEL-ON-LABEL OVERLAP IS THE MEASUREMENT THAT CATCHES WHAT NOTHING
  ELSE DOES.** Every other guard asks whether a label is inside the CROP;
  none asked whether two labels were inside EACH OTHER. Growing the type
  produced two real collisions with every assertion green — a wrapped
  cartridge title onto its own second line and onto the lane rail, and 02's
  `DECIDES ALONE` onto its value (a line box is taller than its font size, so
  v18's 13-unit pitch became a collision at 10). `readPda` now compares every
  pair of glyph boxes at 3 viewports × 3 readings. Sizes are chosen so
  NOTHING WRAPS: a two-line title at ~5px is worse than one line at ~5px.
- ⚠ **THE DRAWINGS STILL MISS THE 8.5px FLOOR ON 01 AND 03, AND NO FURTHER
  TUNING LEVER EXISTS.** Now 4.49–5.16 (01), 6.07–9.91 (02), 4.46–5.45 (03)
  at 1280×720 — up from 3.14–5.64. The smoke holds a floor under RENDERED
  type (4.3px), not the authored unit. The remaining gap is **density**: 20
  cartridges 4-across need ~136px each for an 8.5px title, which fits the
  594px width but makes the grid ~540px tall against 355px of field — 1.5×,
  which no crop or font constant closes. ADR-063 §Outstanding lists the four
  options; all are owner design calls. Do not "fix" this by shrinking chrome.
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
  `--pda-hot` is the LIT step of the gold ramp; ADR-058's flip makes the
  console's ground parchment, where gold-as-TEXT measured ~1.1:1 — invisible.
  The lit signal rides the MARKS (diamond fill, wash, travelling spine) and
  the label just goes to full strength. One rule, both themes, no
  `[data-theme]` override.
- ⚠ **GOLD IS SPLIT BY ROLE, AND HUE IS THE BRAND WHILE LIGHTNESS IS THE
  ROLE (ADR-063 U2).** A saturated yellow is inherently HIGH-LUMINANCE, so
  one gold cannot serve marks, lines and text across a ground flip — the
  console measured 1.15:1 (gold as text), 1.24:1 (line work) and 2.38:1 for
  80 of 97 labels on reading 01. The ramp is `--gold` (MARK) → `--gold-line`
  (3:1) → `--gold-ink` (4.5:1) → `--gold-ink-lit`, all byte-equal to shipped
  values in DARK so adoption is a no-op there. ⚠ **NEVER re-darken `--gold`
  itself** — ADR-058 measured that and it breaks the FILLS (ink on gold
  8.2:1 → 4.7:1). ⚠ **The emphasis direction INVERTS with the ground**: on
  dark `-lit` is brighter, on parchment it is darker. "More contrast against
  this ground" is the invariant.
- ⚠ **AN ALPHA INVERTS ITS OWN MEANING ACROSS THE FLIP.** `rgba(ink, .38)`
  recedes toward BLACK in dark and toward PARCHMENT in light — same number,
  quiet becomes invisible. The console's neutral ramp is re-derived per theme
  in theme.css and lifted UNEQUALLY so the drawing keeps its hierarchy.
- **Colour is now GUARDED**, by a light-theme smoke case that composites every
  alpha before measuring and walks all three readings (4.5:1 glyphs, 3:1 line
  work). Nothing on this surface looked at colour before. ⚠ Still open:
  `--pda-txt3` is **2.93:1 in DARK** (the same 80 labels) — owner's call,
  ~0.52 alpha would fix it; and the sites ADR-058 named (`4 ITEMS`,
  `ON RECORD`, the contact email) are still on `--gold` at 1.8:1 — the ramp
  exists for them, adopting it is a sweep with its own verification.

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

## The unit board (ADR-070 U2, live — reading 02's drawing)

⚠ **THE COMPOSITION IS THE OWNER'S `configuration-unit-mockup.html`**
(2026-08-10), adapted — never re-imagined. U1's radial switchboard (six
part housings, ribbons, gate, substrate bars) lasted ONE DAY: it decluttered
this ADR's own skeleton instead of installing the owner's mockup, and the
owner's verdict ("what you've created is just nothing") is on record in U2.
**When the owner supplies a mockup, the mockup IS the composition** — "not
verbatim" licenses adapting strings, measures, guards and shared chrome,
never substituting a different drawing.

- **ONE lit card, centre** — the ADR-069 cartridge at `CORE_K`, carrying
  **THE BAR on its own face** (optional `bar` prop on the primitive;
  reading 01 renders byte-identical). No gate device, no pin nibs, no
  carrier housing. The card's bar block is the `gat` hover — its hit bed
  is a SIBLING of the dock group (the dock's `fill-box` origin stays the
  cartridge's own, and the entrance style must never re-evaluate
  mid-flight).
- **The owner above, on ONE DASHED LINE — never a bundle (U5).** The
  seat is AUTHORITY, not data, so its relation to the card is
  _answerable-to_ rather than _feeds-into_, and the contrast with the three
  nodes' thick bundles is the reading. ⚠ **IT TAKES THE PLATE'S GREEN AT
  FULL WEIGHT (U6)** — drawn in `--pda-dim` at 0.75 the owner read it as
  ABSENT ("why does WHO OWNS IT not have a connector?"). **A line quiet
  enough to be missed is not a subtle connection, it is a missing one**: the
  DASH carries the grammar distinction, the value never had to carry it too.
  ⚠ The arrowed dimension (U4) and the
  floating `DECIDES ALONE · WIDE` line (U5) are both DELETED — the autonomy
  is the plate's own RIGHT COLUMN now, which is why the plate is 400 wide
  (wider than the card): worst seat 212u beside `DECIDES ALONE` 106.6u in a
  360u measure, so the columns cannot meet.
- ⚠ **THE PLATE HAS THREE ROWS, AND `p[1]` IS THE THIRD (U7).**
  `CaseMapConfiguration.p` is documented as _"Owner role + what that seat
  actually owns"_ and every drawing took `p[0]` and dropped the other half —
  invisible for four updates because nothing on the surface and no guard
  ever asked where it went. `PdaWork.ownerNote` carries it, `string | null`
  (person-led has no seat to gloss and its owner line already states the
  absence), lettering one step down in the neutral ink — the seat is the
  answer, this is what the answer is FOR. Measure is the plate's FULL inner
  width (360): the row has nothing to its right. **A content type that
  documents a field as a PAIR wants both halves checked when a drawing is
  authored.**
- **THREE QUESTION NODES** — WHAT RUNS IT west · WHAT IT CAN REACH east ·
  WHAT IT INHERITS south. The question headers are BACK by the owner's own
  mockup (U2 supersedes this ADR's "no question headers"). k-labels are
  SKILL/MODEL · CONNECTORS/SURFACES · CONTEXT/GRAPH FACTS at fs 10
  `--pda-txt2`; material grounds per row: encoded green hatch (BELOW the
  value's line box — the first cut ran it through the descenders), plain,
  and the graph's dashed BLUE inset (`--pda-gph`/`--pda-gph-line`, light
  overrides in theme.css — the city's adjacent-domain blue on the console).
- ⚠ **THE ROWS STACK; THE MOCKUP'S HALVES CANNOT HOLD THE RECORD.** A
  96-unit half wraps the 26-char worst onto three lines at any legible
  size, so the two answers are full-width rows and every value letters ON
  ONE LINE at fs 11 — 194.5u of the node's 196u measure, ceiling-tight,
  walked for all 27 streams. The owner letters at .08em (the mockup's .16
  overruns on the person-led seat); the readout at 11.5 is the outranking
  guard's forced ceiling (750.7u of 760 on the worst why).
- **THICK multi-conductor bundles are the connectors (U3** — the mockup's
  thin gutter traces lasted one pass; owner: "restore the thick lines"):
  one 8-wire bundle per side node, two 5-wire into the inherits node, 45°
  jogs, lifted whole on hover. ⚠ **THE READOUT SENTENCE IS DELETED (U3,
  owner)** — ADR-069's one-reactive-line contract is overruled; the notes
  stay in the record, letter nowhere, and `pda-viewbox` + the smoke assert
  the absence (prose ≥40 chars on this drawing = the readout drifting
  back). The derived caption survives alone, bottom-right. ⚠ **THE SVG
  ANCHORS `xMidYMin` AND `fitCrop` HARDCODES IT** (`oy: 0`) — the pair
  moves together or the flight lands wrong by half the letterbox at tall
  consoles; `YMid` was the "space above WHO OWNS IT" complaint.
- ⚠ **WHAT THE OWNER DELETED STAYS DELETED, AND BOTH GUARDS SAY SO.** The
  substrate bars (U2); the readout sentence (U3); and in U4 the DRAW PER RUN
  meter with NEVER A PRICE, the `DRAWS ON n OF m` caption (with
  `substrateReach` / `drawnShapes` / `CONFIG_MAX_BARS`), the corner brackets,
  the pad clusters, the vias, the registration crosses, and the arrowed
  DECIDES-ALONE dimension with its pin ticks. `pda-viewbox` asserts no such
  slot is declared and the smoke asserts none renders — the smoke's U3
  caption-PRESENCE assertion was inverted rather than dropped.
- ⚠ **THE CROP'S ASPECT IS THE CONTRACT (U4) — IT IS WHY THE PANEL FILLS.**
  `CONFIG_VIEWBOX` is `36 48 828 912` (0.908), PORTRAIT. The console's field
  is portrait where this is read (839×958 = 0.876), and `meet` takes the
  MINIMUM ratio — so the old LANDSCAPE crop (910×740) was width-bound there
  and left **~283px of dead panel** that no element move could reach. Now
  meet is **1.013** and the smallest type paints **10.13px** (was 5.55).
  ⚠ The trade is named: short-wide fields (603×493 at 1280×720) letterbox
  HORIZONTALLY instead at meet 0.541, which is why the drawing's own floor
  is **10** — 7.5 renders 3.89px and fails the smoke's 4.3 outright.
- ⚠ **THE BOARD IS INSET 24 FROM THE CROP, AND THE WIDTHS ARE ONE CHAIN
  (U6).** The side nodes sat at x 36 against a crop starting at 36 — flush
  against the wall, no margin at all. The 828 crop reads
  `24 | 234 | 24 | 264 | 24 | 234 | 24`, and `CHIP.x` IS
  `LEFT_X + NODE_W + GUTTER`: change a node width or the margin without
  moving it and the nodes go straight back on the wall.
- **ONE SUB-CARD SIZE ACROSS ALL SIX (U4).** The side nodes stack their pair
  VERTICALLY at full node width; the wide base seats its pair side by side —
  sized so every sub-card is the same 232×130 with the same 212-unit measure
  and the same fs 11.5, every value on ONE line. That is what answers "what it
  inherits is too big": its 640-wide node held 316-wide cards with one short
  line while the side halves forced three-line wraps at fs 10.
- ⚠ **THE BINDING NUMBER IS A WORD, NOT A STRING.** `wrapLines` breaks on
  spaces only, so the longest WORD sets a sub-card's minimum measure however
  well the value wraps — and every per-line assertion passes while it
  overflows, because each LINE is short. `RECONCILIATION` (14) is the
  record's longest; sizing against `INTELLIGENCE` (12) put it through the
  wall. `pda-viewbox` walks WORDS now, and caught it on its first run.
- **ADR-069 SURVIVES INTACT**: the flight docks the cartridge (`CORE_RECT`
  byte-identical), the readout is ONE reactive line resting on
  why-this-lane, and a node is one answer — hovering it lights the pair.
- **The guard measures the DRAWING'S OWN declaration.** Every lettered
  string is in `configurationLettering` with the measure it must fit,
  walked for all 27 streams by `pda-viewbox`; the bar's third wrapped line
  is declared with a ZERO measure so a sliced tail fails loudly. A lettered
  string missing from that list is a defect in the drawing, not a gap in
  the guard. Conductor-versus-content stays HAND-CHECKED on capture — the
  guards measure text, and both U1 collisions (a riser through the bar, a
  hatch through the descenders) were invisible to every one of them.
- ⚠ **VERIFYING: SCROLL IS THE ROW SELECTOR.** The browse band's first quarter
  is the map; 0.35 of the dwell lands on the Studio row's SHEETS and a script
  waiting for `.fl-pda__svg` there finds nothing.
  `scripts/capture-map-readings.mjs` defaults to `--at 0.09` and runs HEADED
  (the corridor is WebGL; headless leaves the canvas dead).

## The CONFIGURATION lab (look-dev, `/test/intelligence-config-lab`)

Four archetypes for READING 02's drawing, beside the shipped ADR-069 reading,
after the owner's verdict that the morph is right while the drawing still
reads as four-modules-plus-core (2026-08-08, two CP2077 reference boards:
different SHAPES per configuration part, motherboards/nodes/retrofuturism,
substrate as skill clusters). **Nothing on the landing changed**; no ADR until
a direction wins (the BOARD-archetype precedent).

⚠ **THE SWITCHBOARD WON AND IS ON THE LANDING (ADR-070, 2026-08-09).** The
lab's local copy is DELETED and `shipped` mounts the production module, so the
four archetypes below are judged against the real thing. The lab's purpose is
served; keep it for the next question, not as a museum.

- **The five variants** (`app/(internal)/test/intelligence-config-lab/`):
  `shipped` mounts the real `ViewConfiguration` (the switchboard); `die` = the work docked in a
  pin-grid socket, parts as package types, the substrate as the ground plane
  below a grade rule — **with the 47 `skillSymbol` marks' first render
  anywhere**; `chain` = inherits IN → work + skill/lane twin → GATE aperture
  → surfaces OUT, patch-bay substrate, MAP_CHAINS neighbours lettered at the
  edges; `section` = vertical cutaway with the five shapes as literal strata
  below grade; `schematic` = symbol-per-part nets with five power rails;
  `switchboard` = **the wire-first one and the lab's default, built after
  the owner read the first four as safe iterations of the shipped layout** —
  it adopts the reference's COMPOSITION: multi-conductor ribbons carry most
  of the ink (`ribbon.ts`, pure offset-polyline geometry with 45° bends,
  unit-tested), ONE bright object (the work chip is ONE frame — the
  cartridge itself, no carrier housing), staggered placement, ghost routing
  behind, and NO question-header skeleton (the part chips carry tiny
  function tags instead). Person-led flips every ribbon to the dashed hand
  — the whole board hand-carried.
  ⚠ **THE SIMPLIFICATION PASS (owner, 2026-08-08) IS PART OF THE
  ARCHETYPE**, not a tweak: the 47 skill-mark banks are DELETED, the
  substrate row draws **only the shapes the work taps** (a ghosted loom of
  untapped shapes is reading 03's job), and nothing leaves the system chip
  upward — a system a stream acts on is a terminus here, not a transit.
  Bar slots are authored PER COUNT (1–3) so the row stays balanced instead
  of huddling wherever the tapped keys sat; `SWITCHBOARD_MAX_BARS` is
  guarded, because a fourth tap would silently lose a bar. The caption is
  `DRAWS ON n OF 5 SHAPES` — printing `47 SKILLS` beside three bars that sum
  to 35 would publish two totals a reader can subtract.
  ⚠ **EVERY RUN LANDS ON A PIN** (449 + 20k along the bottom edge). The
  first cut ran the inherit ribbons horizontally ALONG the nib tips, and
  five conductors crossing a pin row at 45° read as a hatch patch rather
  than a connection — ribbon-versus-box is checked in the geometry by hand,
  since the readout measures TEXT collisions only.
- **Every variant keeps a socketed, cartridge-shaped home for the work**
  (176×136 × k) — the ADR-069 flight docks the reading-01 cartridge, and a
  variant whose core cannot receive it breaks the loved morph on promotion.
- **The chrome is REAL**: `ConsoleFrame` + `ConsoleRail` + the `--pda-*`
  palette, mounted outside `.fl-case` (the expanded-overlay precedent,
  console.css). The lab supplies only a definite-height housing pinned to
  MEASURED production boxes (613×541 / 690×601 / 864×818 — re-pin with
  `node scripts/capture-config-lab.mjs --measure`) and the forced
  `data-proof-settled` arrival gate.
- ⚠ **THE LAB PAGE IS MECHANICALLY UNGUARDED** — the registry test walks
  `CASES`/`PROJECT_CASES` objects, never component code. So every variant
  declares everything it letters via a pure `lettering()`, and
  `tests/lib/config-lab-fit.test.ts` walks those declarations for ALL 27
  works × 4 variants: fit vs measure (advance = `0.6 + tracking`), the Die's
  cluster rows, and the registry's own envelope regexes. It caught the real
  ceiling on day one: the longest live `bar` is **46 characters** (W-052),
  not the 37 a sampled read suggested.
- ⚠ **Nothing letters under fs 7.5 in a 1000-wide crop** — the binding meet
  is 0.603 (field 603px at 1280×720), so fs 7 renders 4.22px, under the 4.3
  floor. Caught by the capture gates, not the eye.
- **`scripts/capture-config-lab.mjs`** runs the matrix (5 variants × 5
  subjects × 2 themes at p1280 + a p1920 sweep), waits on the readout's
  `data-*` mirror (never a sleep), gates on 0 collisions / 0 clipped /
  minPx ≥ 4.3 / no overflow, and writes the stills to
  `docs/design/intelligence-config-lab/`. ⚠ `reducedMotion` must stay
  `"no-preference"` — PRM trips the console unwrap pair and hides the
  console entirely. `--measure` scrolls the REAL landing into the dwell
  (`.home-v2-stage` first — the corridor is lazy and inflates layout late)
  and prints the production `.fl-con` boxes; the console frame is shared
  chrome, so whichever row the browse band selected, the box is the same.
- **Person-led stays honest on every variant**: fallback answers, crossed
  gauge, empty meter (with `Never a price.` wherever a meter appears), and
  the tapped shapes still lit — the negative space is a reading.

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
