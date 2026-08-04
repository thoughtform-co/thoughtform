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
- [ADR-061: Intelligence Map work configurations](../sentinel/decisions/061-intelligence-map-work-configurations.md) — proposed harmonization contract for the map atom, projections, evidence and privacy; do not mark accepted before its verification gates pass
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
- **The host is `pointer-events: none`.** Exactly FOUR opt-ins: the tabs,
  the directory rows, `.fl-film` and `.fl-skills` (the U13 browser).
  `.svc-ring-hits__hit` is at z 4 and the casefile at z 6,
  so an `auto` host silently swallows every card click once the ring lands.
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
- **The registry plate is the INTELLIGENCE MAP: ONE PERSISTENT WORK-
  CONFIGURATION FIELD, THREE PROJECTIONS (ADR-061).** The exact
  tabs are CONFIGURATION · TEAM · ALLOCATION. SUBSTRATE is no longer a
  projection: the canonical 47 Skills are a FIXED RESERVOIR referenced by
  the work configurations. U16's STACK view stays deleted.
  - **THE MOVING ATOM IS A WORK CONFIGURATION, NEVER A SKILL.** It is a
    repeatable kind of work plus its public configuration: outcome, functional
    team, referenced Skills, artifact category, generic tool/connector
    categories, generic capability lane and aggregate evidence state. A Skill
    may support several configurations; a configuration may reference several
    Skills. Do not relabel the 47-Skill lattice and call that the redesign.
  - **CONFIGURATION explains composition.** TEAM regroups the SAME work
    nodes by public functional team. ALLOCATION regroups those SAME nodes by
    Fast · Everyday · Deep · Frontier. Projection changes placement and
    emphasis, never the underlying fact.
  - **THE RESERVOIR DOES NOT MORPH.** Desktop renders one bus labelled
    `ENCODED SUBSTRATE · 47 SKILLS / 5 SHAPES` with all 47 stable pips in five
    unlabelled runs. Selection may highlight referenced Skills and compact
    layouts may summarize it, but the Skills remain a stable source set. Its
    `47+` count is a Skills count and may never be used as the
    work-configuration total. The five shape labels appear once, as the
    Configuration view's vertical anchors; a labelled bottom repetition is a
    duplicate taxonomy.
  - **Stable identity is an id, not copy.** Work nodes are flat children of
    one stable parent, keyed by a non-display id and kept in invariant order.
    Nesting them in projection-specific containers remounts them and turns the
    morph into a crossfade. Legacy `SkillsBrowserPlate` / `skillsFieldLayout`
    names do not preserve the old conceptual model.
  - **Placement is PURE DETERMINISTIC MATH**, never measured placement. The
    layout's declared tracks and the CSS `repeat()` counts move together, and
    keyboard `navRows` come from that same result. An implicit grid track is a
    layout bug, not graceful overflow.
- ⚠ **THE MORPH'S LAWS (ADR-056 U17 + ADR-061).** ADR-031 still rejects
  viewport-crossing shared-element flights; this is the same work artifacts
  reconfiguring inside one bounded field.
  - **Two one-shot measurements, both click-driven.** Old rects come from the
    click handler; destination rects come from a layout effect before paint.
  - **Rects are relative to the FIELD.** The casefile's own arrival transform
    must cancel out rather than leak into a viewport-space measurement.
  - **`data-morph` is imperative** and `will-change` exists only during the
    flight. A re-render may not clobber the marker or permanently promote all
    nodes.
  - **Zero at rest by construction.** The transition ends on computed `none`;
    interrupted projection changes begin from the currently painted rect.
  - Projection chrome may crossfade; work nodes may not. The Skill reservoir
    may highlight links, but it does not join the FLIP.
  - Selection survives every projection change and overlay expansion. A tab
    click changes placement, not identity or detail state.
  - Click-driven only. No scroll-driven regrouping, ambient pulse, random
    jitter, force simulation or spring overshoot. Reduced motion swaps the
    deterministic layout immediately.
- **THE PLATE IS NEVER NAMELESS.** A compact node cannot carry its full
  anatomy, so the head register names the selected WORK CONFIGURATION and
  defaults to configuration 01 on arrival. The work label wins truncation
  priority over legend or status chrome.
- **Compact node, reserved detail console.** The node carries a stable mark,
  short work identity and at most one projection signal. A non-overlapping
  lower console reserves its height even before selection, so detail never
  covers the field or introduces an internal scrollbar. Compact mode shows
  work/function/lifecycle/summary, six facet STATES, human checkpoint,
  allocation basis, broad owner and linked Skill names. The shared expanded
  detail component adds the facet PROSE inside the lazy ADR-006 body portal,
  with focus trap, scroll lock, Escape/backdrop dismissal and focus return.
- **Relationships are state, not geometry.** Linked pips light and the detail
  names the Skills. Do not restore an SVG, `ResizeObserver`, node-to-pip rect
  reads or a post-morph measurement loop.
- ⚠ **ALLOCATION IS AGGREGATE EVIDENCE, NOT PER-SKILL TOKEN TELEMETRY.**
  - Lifecycle and draw are separate semantics. “Shipped” never means “high
    consumption.”
  - A work configuration may carry a qualitative draw band. Numeric reach or
    draw is shown only at the honest lane/team/snapshot aggregation level.
  - No Skill tile, label, tooltip, ARIA string or hidden prop receives tokens,
    cost, share of spend or a causal usage claim.
  - Figures are rounded from a dated snapshot and may be mass, density, band,
    share or ratio — never live telemetry. Absence is not automatically zero.
  - **Two bars per tier head, never one** when the reach/draw argument is
    shown; one bar degrades it into an unexplained usage chart.
- **The map is FLAT instrument grammar.** Configuration and Team may encode
  lifecycle/evidence and Allocation may encode an aggregate draw band, but
  the treatment is solid fill, border, tick or categorical mark with an
  explicit legend. Map nodes, states, console and reservoir use no CSS
  gradients or hatch fills; computed `background-image` must remain `none` in
  both themes.
- **Compact-height and mobile layouts DEGRADE DELIBERATELY; they do not clip.**
  Below the desktop fit envelope, use grouped compact rows/cards, a summarized
  fixed reservoir and in-flow/full-width detail. Keep all three projections
  available but skip FLIP. Do not squeeze the desktop heat field into a phone.
- ⚠ **FIT TRAPS ON THIS PLATE, every one shipped in a first cut** (U15–U17).
  Measure; do not eyeball:
  - **A grid row is as tall as its TALLEST item, and that was the COUNT.** A
    default line box on 10px mono is 15px against a 9px tile, which put the
    team lattice 46px over its stage at 1440×800 and 121px at 2017×1269.
    `line-height: 1` on every mono label sharing a row with a sized element
    is load-bearing, not tidiness.
  - **`.fl-plate` measures 0 while an inner grid overflows** — the plate's
    own `overflow: hidden` swallows it. The field, substrate bus and reserved
    detail console are all in the measured set, and the smoke walks EVERY
    PROJECTION. A guard that only sees the default state is not a guard.
  - **MEASURE ONLY AFTER THE MORPH SETTLES.** A rect read mid-flight is a
    transformed box, not a laid-out one. Await the absence of
    `.fl-intel-map__field[data-morph]`, never a bare timeout — and wait for
    the field to EXIST before stamping or measuring it, or the harness
    blames the feature for its own earliness.
  - **A budget looser than the box ships silent truncation.** A 24-char
    tier note truncated at 20; the fix was tracking down (the U9 lever) AND
    the guard tightened to the real ceiling.
  - **Chips beside a `1fr` track lose and get sliced mid-word.** Half a
    label is a defect, not a compromise — give them their own line.
  - **The box is not one size.** The right visual now owns the whole panel,
    but the 1280×720 casefile remains the binding composition while 2017×1269
    exposes over-expansion and weak hierarchy. Per-projection `clamp()`
    metrics need both ends; never tune only the tall reference.
  - The exemplar `rows` stay in the data unrendered (the beat draws them;
    the sharing guard asserts them shared). Skill names belong in selected
    detail, not as a second line under each pip run; that would recreate the
    duplicate taxonomy and overflow the bus.
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
  references. The brief content ceiling is 420 characters; the proof register
  must retain all four values and labels; the directory keeps four readable
  rows; the right visual fills its panel without covering or internally
  scrolling its map console. A 1920×1080-only pass proves none of this.
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
