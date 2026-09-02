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
between `#about` and `#practice`, that funnel slot is gone; `#practice`
inherited its ambient-cover role under ADR-056, and **`#voidwalker` — the
career through-line, ADR-074 — holds it now** (`#practice` is an empty
breather).

**Read first**

- ⚠ [ADR-088: The left column's type splits by face, and its slack is split too](../sentinel/decisions/088-casefile-left-column-ladder-and-rhythm.md) — **PROPOSED (2026-09-02), shipped and guarded, pending the owner's live read.** `--lc` is DELETED: one token drove four roles across TWO FACES and its `svh` term flipped their ranking with viewport height (at 1920×1080 the sans sentence outranked the mono claim it explains). The split is by FACE now — the register claim and the directory row are PEERS at `--fl-chrome-lg`, the meta at `--fl-chrome-md`, the sentence at `--fl-copy / --fl-ratio`. And the record column is ONE GRID (`.fl-left`, housing, unmarked): the directory's last row sits ON tick 11 and the surplus splits 1:2 between the two seams instead of pooling under the rows (137px at the owner's viewport before). ⚠ Shrinking `--fl-proof-h` to widen the seams further was built and REJECTED. See §The left column's ladder and its rhythm below
- ⚠ [ADR-087: The casefile is a client stack](../sentinel/decisions/087-proof-client-stack.md) — **ACCEPTED on the mechanism, PROPOSED on the choreography.** The dwell is DERIVED over `CASES` now (row 0.5vh × tracks + seam 0.5vh between clients + release 1.2vh) and the flat `[0,1]`→row map is a SEGMENT TABLE (`browseMap.ts`, pure, zero imports). Byte-identical at one client to the last bit — that identity IS the acceptance proof, and there is NO flag (ADR-070 U35). Look-dev at **`/test/client-stack-lab`**, which is the first time the client channels ever write; its findings (the decode replay's target set fails at N ≥ 2, the seam's 21 % blank stretch, seam length being invisible at a fixed seam-local position) are recorded there. See §The tab strip and the client stack below
- [ADR-070: The configuration is a switchboard](../sentinel/decisions/070-configuration-is-a-switchboard.md) — reading 02's DRAWING, promoted out of the config lab 2026-08-09. The wiring is the picture; ONE frame, ONE bright object; only what the record connects is drawn. See §The switchboard below.
  ⚠ **U34 (2026-08-23, owner) is the latest pass on reading 03's carrier** —
  the dodecagon is the HOUSING and the division inside it is CONCENTRIC. See
  §The carrier's walls below.
  ⚠ **U36 (same day) made the BAND CLICKABLE: the hub answers with the shape's
  own sentence** (`CaseMapShape.meaning`, which lettered nowhere for two
  redraws). See §The carrier's walls below.
  ⚠ **U35 (same day) retired `SUBSTRATE_SECTION` and U25's SECTION drawing** —
  the carrier is reading 03 unconditionally; `flags.ts`, `PdaSubstrate.tsx`
  and `pda-substrate-fit.test.ts` are deleted, and the lab's `shipped` variant
  went with them (`carrier` is the baseline). ⚠ **`estateBand.tsx` STAYS** —
  `VariantManifold` imports it, so it outlived the drawing it was written for
- [ADR-068: The glyphed index, the tool dossier, and authored wireframes](../sentinel/decisions/068-casefile-glyphed-index-and-tool-dossier.md) — the LIVE register + tools-plate contract; see §The glyphed index and §The tool dossier below
- [ADR-069: The selection morph and the answered configuration](../sentinel/decisions/069-pda-selection-morph-and-answered-configuration.md) — the selected work is the PERSISTENT OBJECT and FLIES between its two homes (1 ↔ 2); reading 02 prints the record's own answers with one reactive readout. See §The selection morph below
- [ADR-084: The panel fills its housing, and the console lets the corridor through](../sentinel/decisions/084-casefile-panel-fills-its-housing.md) — the LIVE composition of the Studio and ATL rows: six ads on a height-gated second row, the films' seated production block, the console's `--con-ground` transparency and the register's retuned claim + sentence. ⚠ **U1 (2026-08-29, owner) GAVE THE THREE SHEETS ONE TEMPLATE** — every sheet ends on a VERDICT BAND (`CaseSheet.verdict`, `.fl-verdict`), and THE RED LINE finally says UGC. See §The sheet template below
- [ADR-085: Proof design pass — one modular scale, the studio's two pictures (⚠ its ledger + hero is REVERSED)](../sentinel/decisions/085-proof-design-pass.md) — ⚠ **U2 (2026-08-29, owner) IS THE LIVE STATE OF THE MAP, AND IT UNDOES PASS ONE'S READING 01.** The **4×5 CARTRIDGE GRID IS BACK** (all twenty workstreams together, cartridges at k=1, the flight's source is the CLICKED card's own slot) and the LEDGER + HERO is deleted with `HERO_K`, `heroRect`, the `gridRect` compat alias, `totalWorks`, `.fl-pda-roll` and `.fl-pda-rolodex`. ⚠ **NO FLAG** — ADR-070 U35's ruling (a flag is a comparison lever; once the owner has read both live, the losing drawing and its guards go). The LEDGER answered a real defect (~5–7px effective type at 1280×720, ADR-063 §Outstanding) **by showing nineteen fewer cartridges** — and this reading's subject is the ESTATE, which you cannot draw one card at a time. ⚠ **THE ALIAS IS WHY NOTHING FAILED**: `gridRect(_i, layout)` returned the hero rect for every `i`, so `pda-flight`'s eleven per-slot loops walked twenty identical rects and stayed green — **a compatibility alias keeps the call sites compiling and quietly empties what they test** (ADR-069 U1's finding one level down). The flight's `dk < 1` direction assertion (widened to `0.3 < dk < 3` for one day, because `HERO_K` 1.85 > `CORE_K` 1.7 inverted it) is restored — _a bound that admits either direction cannot catch the sign error it was written for_. ⚠ **U2 ALSO PUT THE HUB IN IBM PLEX SANS** — see §The hub speaks below. What still stands from pass one + U1: **FOUR unrelated type ladders collapsed into ONE MODULAR SCALE** on `.fl-case` (`--fl-ratio: 1.2` × `--fl-t0`; every chrome role a named step, `--sh` retired, `--fl-display` shared with `.fl-brief__title` so a sheet's category NAME never outranks the project NAME again — was 33.7px @1920); `MAP_BACKPLANE` OFF (the compound carrier is reading 03, the Backplane drawing unreferenced on disk); **the studio's two policy pictures** from `ai-in-studio-final.pptx` slide 9 on THE LINE sheet (444×484 / 444×444 → WebP q82, `public/arcs/studio-line/*.webp`, optional `image?: CaseImage` on `CaseCompareColumn`, 1:1 cover box in `.fl-cmp__middle`); light-theme `--pda-amb` re-derived through the same line-work step `--con-dim` takes (`rgba(138,107,32,0.88)` → 3.02:1, delivering on ADR-063 U2's promise); the directory row's air (min-height 24→26, padding 3→4, `--fl-directory-gap` compact floor 8→12, funded from `--fl-proof-h`'s coefficient drop); and the `--font-mono`→`--fl-mono` SVG leak fix. Mobile keeps its ADR-083 IA. See §The hub speaks, §The modular scale, and §The LINE sheet's pictures below
- [ADR-056: Proof casefile at the top of #services](../sentinel/decisions/056-services-proof-casefile.md)
- [ADR-083: Mobile evidence instruments](../sentinel/decisions/083-mobile-evidence-instruments.md) — proposed phone IA: one stable case seat, explicit BRIEF/PROOF/ARTIFACT modes and a direct four-stop rail
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

- **Phones retune ONE case instrument (ADR-083, proposed).** At `<=960px`,
  client/case identity stays fixed above `BRIEF / PROOF / ARTIFACT`; exactly one
  bounded seat is visible and a four-stop rail owns track selection. Keep the
  desktop Directory mounted and in state parity, but do not mount a second
  `TrackVisual`. Controls are at least 44px, the narrowest rung drops redundant
  previous/next arrows, and inner artifact scroll releases to the page at its
  bounds. Desktop PRM still uses the complete static document; this phone
  state must not enter the capable runway/scrollspy path.
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
  ⚠ **THAT SENTENCE HAS TEETH NOW — `tests/lib/services-proof-runway-lockstep.test.ts`**
  (ADR-087). The TS side is DERIVED over `CASES` and the CSS literal is still
  HAND-WRITTEN, which is exactly what makes silent divergence possible for the
  first time: a second `CaseDef` moves the constant by itself and leaves
  `320svh` behind, and the symptom is the last client's rows compressed into
  whatever runway was left with nothing failing. The test prints the number to
  bump. The tuning knobs are `SERVICES_PROOF_ROW_VH`,
  `SERVICES_PROOF_CLIENT_SEAM_VH` and `SERVICES_PROOF_RELEASE_VH`;
  `SERVICES_PROOF_RUNWAY_VH` is a RESULT, and assigning to it is assigning to
  a measurement.
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
  work-node identities start at 11px; **the left column's four MONO roles ride
  the chrome scale (ADR-088)** — the directory row and the register claim are
  PEERS at `--fl-chrome-lg` (13.2 at 1280/1440, 14.4 at 1920) with the row's
  meta and the directory head one step under at `--fl-chrome-md`. ⚠ This
  RE-READS ADR-067 U3's "rows one step ABOVE the claims" by that rule's own
  reason: what may not outrank a project's identity is the SENTENCE about it,
  which is sans at `--fl-copy / --fl-ratio`, a full ratio step below both.
  ⚠ The row's 13px floor still binds and its `line-height: 1.15` is what PAYS
  for the size — 1280×720 has 4px of slack in its band and single-line
  uppercase rows never needed paragraph leading; restore `normal` and the band
  clips silently. Readable compact copy starts at 12px. A selected work title starts at 17px; expanded detail
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
  cost a measurement to get right (Update 8). Its open/close + focus-return
  state is `useWalkthrough` (ADR-072), beside it.
- **THE TOOLS PLATE'S BODY IS `ToolField`, AND IT HAS A SECOND HOME
  (ADR-072).** `ToolGallery` is the casefile's COMPOSITION — console, rail,
  fold-close, lightbox — and `ToolField` (`ToolBay` + `CapabilityBlocks`,
  lifted verbatim with their comments) is the bay and the blocks, which
  the portfolio arc (`/arcs/portfolio`, `components/arcs/ArcDossier*`)
  mounts at page scale, one tool per beat. `tests/lib/tool-gallery-markup.test.tsx`
  pins the landing's rendered markup byte-for-byte (snapshot + the ring
  smoke's strings). ⚠ A bay change is a TWO-surface change: run
  `services-ring-smoke` AND `arc-portfolio-smoke`; the bay reader, the
  per-tool label pins and `expectWireframeBay` live in
  `tests/visual/helpers/toolBay.ts` (`readToolBay(root)` — the landing
  mounts one bay, the portfolio four). ⚠ casefile.css's ≤960 `.fl-wire`
  rung is no longer dormant — the portfolio's small-screen path renders it
  and the portfolio smoke pins it.
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
  1920×1080; the row type is owner-set and now CLAMPED (ADR-067 U3, above)
  — take density out of padding and LEADING, never out of the type.
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
    ⚠ **AND IT SHIPPED ANYWAY, FOR MONTHS** (fixed 2026-08-12, ADR-070 U15).
    Reading 03 composed `${s.skills} SKILLS · ${s.teams} TEAMS` in a
    component, which rendered **8 TEAMS** for PATTERN on the public page. The
    registry guard walks `CASES` with `JSON.stringify` and never reached it.
    **A string composed at render time is outside every content scanner** —
    which is why a drawing declares what it letters (`substrateLettering` +
    `pda-substrate-fit`, whose `/\bteams?\b/i` ban is the mechanical half).
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
  exactly 0 at rest: these zones are seated against the rail's tick ladder, so
  a residual shift is a drift bug, not a flourish. ⚠ **The LEFT column's three
  zones are grid items in `.fl-left` since ADR-088, not absolutes** — they keep
  their own `[data-fl-panel]` transforms and this rule is unchanged for them,
  but the wrapper itself carries NO panel mark, because `will-change: transform`
  would make it a containing block for everything seated against `.fl-case`.
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

## The tab strip and the client stack (ADR-087)

The mechanism under that bullet, and what it costs to add a client. ⚠ **All of
it is INERT at one client and none of it is flagged** — the derivation answers
a question about `CASES`, so it turns on by itself.

- **THE BROWSE DOMAIN IS A SEGMENT TABLE, NOT A DIVISION.**
  `[client 0 · rows × ROW_VH][seam · SEAM_VH][client 1 · rows × ROW_VH]…`
  normalized onto `[0, 1]` — the domain `--svc-proof-browse` already
  publishes. A client's band is sized by ITS OWN row count, so one browse
  quarter costs the same scroll on every tab whatever the tab holds. The
  arithmetic is `browseMap.ts`: PURE, zero imports, three readers (the
  casefile's style observer, the stage's scroll hook, the smoke's band
  targeting) — which is exactly the shape that drifts when it is written
  inline. ⚠ **At N = 1 every function degenerates to the ADR-056 U13
  arithmetic to the last bit** (`browseTargetFor` IS `(idx + 0.5) / rows`;
  `browseState` IS the U13 spy), and the unit test asserts it with `===`.
  Never re-derive the table at a call site — import it.
- **THE SEAM IS A CROSSFADE WITH THE IDENTITY SWAP AT ITS BLIND MIDPOINT.**
  `browseSeamClocks` runs `--svc-client-out` off through the first half and
  `--svc-client-in` on through the second, positional rather than directional
  so scrolling back up is the same two ramps reversed. The swap is held around
  the midpoint by `SEAM_SWAP_HYSTERESIS` 0.06. ⚠ **THE WINDOW MUST SIT INSIDE
  THE STRETCH WHERE THE PANELS PAINT NOTHING** — a held identity is only free
  while the thing carrying it is invisible. Measured at the swap: marked panels
  0.000, housing 1.000, at three viewports × two themes. The two edges are NOT
  symmetric (2.1 % at the fold's edge, exactly 0 at the arrival's — `--co-off`
  is a shallower deadband than `--ci-off`), so a curve change re-opens the
  question.
- **THE CHANNELS ARE ABSENT, NOT NEUTRAL, AT ONE CLIENT.** `setProof` REMOVES
  `--svc-client-in`/`-out` while `CASES` holds one case; casefile.css reads
  them with identity defaults (`var(--svc-client-in, 1)`,
  `var(--svc-client-out, 0)`). Writing "1"/"0" would be the same pixels and a
  different DOM, which is the one thing the byte-identity proof does not allow.
- **FOUR PANELS COMPOSE THE CLIENT CLOCKS; THE HOUSING DOES NOT.**
  `data-fl-client-panel` marks the brief, the proof register, the directory and
  `.fl-panel__viz` — the four surfaces that say something about ONE client. The
  tabs wrapper, `.fl-split`, the reticles and the whole-plane iris are the
  FRAME the record is swapped inside: **a frame that crossfades with its own
  contents is a page turn**, which is the read this mechanism exists to avoid.
  ⚠ Only `--ci` and `--co` are restated (`--svc-proof-in × --svc-client-in`
  and `max(--svc-proof-out, --svc-client-out)`) — a product for the reveal
  because both conditions must hold, a max for the fold because either leaving
  is enough. Restating a downstream declaration forks the strike/dropout/settle
  ladder into two copies that drift. ⚠ The visual's mark goes on
  `.fl-panel__viz`, never `.fl-panel`, which carries no `data-fl-panel` at all.
- **A TAB CLICK PINS THE SCROLL, exactly as a row click does.** The strip is a
  JUMP control, not the selector — while the stage is pinned SCROLL is — so
  `selectClient` moves the scroll to `browseTargetFor(segments, idx, 0)` and
  the spy then derives the same target. Without the pin the tab lights and
  snaps back one frame later, the identical symptom a row click had before U13.
  Never remove one side of that contract without the other.
- **NO GHOST `+ Archive` STOP** (owner). It violates both standing rulings on
  its own: the round-3 DEAD-SCROLL ruling (a band in which nothing changes the
  panel) and the placeholder-client ruling. `+ Archive` stays outside the
  roving tabindex too — a disabled tab breaks the roving index for no gain.
- **The MOBILE client step is the tab strip above the mode switch** — first in
  source order inside the ≤960px grid, so the IA is identity → mode → the one
  bounded seat (ADR-083). 44px stops. Inert until N ≥ 2, and `flex-wrap:
nowrap` means a THIRD client forces a horizontal-scroll decision on the
  narrowest rung.
- ⚠ **THE DECODE REPLAY'S TARGET SET FAILS AT N ≥ 2, AND IT IS UNRESOLVED.**
  A later slug change re-arms and re-runs the reveal's decode
  (`mountedSlugRef` in `ServicesCasefile`; inert at one client, since the slug
  cannot change). But the only `[data-fl-text]` node is `.fl-tabs__name`, and
  with two tabs NEITHER name changes on a swap — so `begin()` blanks and
  re-scrambles both, and blanking by `textContent = ""` REFLOWS the strip
  (`+ Archive`'s left edge measured 453.1 → 259.1 → 453.1px at 1440×800, a
  **194px lateral jump** in the one element whose job is to sit
  still). Everything that does
  change is deliberately not a decode target, because the cache is per-CLIENT
  and those fields are per-TRACK. See ADR-087 §F1 for the three candidate
  closes; until the owner reads the lab, prefer `decodeReplay={false}` over
  inventing a fourth.
- **Verifying a client change:** `node scripts/capture-client-stack.mjs` (the
  lab, at two clients — 101 frames, the swap-midpoint assertion, the
  blank-stretch sweep, the replay probe) plus the whole `services-ring-smoke`
  spec, which IS the byte-identity comparison. The Phase D checklist for
  actually adding client #2 is in ADR-087.

## The left column's ladder and its rhythm (ADR-088, live)

The tab strip, the brief, the proof register and the directory — their type and
their vertical seating.

- ⚠ **TWO LADDERS, SPLIT BY FACE, BOTH AT `--fl-ratio` 1.2.** MONO: the register
  claim and the directory row are PEERS at `--fl-chrome-lg`, the row's meta and
  the directory head at `--fl-chrome-md`, the brief's class and the tab ordinal
  at `--fl-chrome-sm`. SANS: the brief's body at `--fl-copy`, the register's
  sentence one step under at `max(11.5px, --fl-copy / --fl-ratio)`. Six sizes
  at 1920 — 10 · 12 · 13.5 · 14.4 · 16.2 · 24 — each with one role.
  ⚠ **The ordering a ladder guarantees is the one inside its OWN face**: 13.34px
  of bold mono caps reads louder than 14.04px of 0.78-alpha sans, which is how
  `--lc` had the arithmetic and the optics running opposite ways at a reference
  viewport with every guard green.
- ⚠ **THE CLAIM AND THE ROW BEING PEERS RE-READS ADR-067 U3, IT DOES NOT
  OVERTURN IT.** What may not read smaller than a project's identity is the
  SENTENCE about it, and that is sans a full ratio step below both. The row's
  13px floor, its `1.15` leading and its `.05em` tracking all still bind.
  ⚠ 1440×800 and 1920×800 take the row 14 → 13.2 — `--fl-t0`'s `svh` term is
  under its floor below 991h, so chrome-lg is flat there.
- ⚠ **THE COMPACT REGISTER HAS 1.0px OF SLACK AND EVERY TERM IN IT IS
  LOAD-BEARING.** At 1280×720 the box is 76.32px; a row is the claim's 15.58px
  line box + 1px padding each side + a 1px hairline = 18.58, and four plus the
  closing hairline are 75.3. Anything that raises the claim's size, its
  leading, the item's padding or the mark's box at that rung overflows it —
  and the mark no longer sets the row's height, because at 13.2 the claim's
  line box is the taller of the two. The tall rung keeps `4px 0`.
- ⚠ **THE SENTENCE FLOORS AT 11.5, NOT 12.** The rung opens at 1200px where the
  column is narrowest (~296px): the 95-char worst case is ~1.85 lines at 11.5
  and ~1.93 at 12, one copy edit from a third line under a clamp that truncates
  in silence.
- **THE RECORD COLUMN IS ONE GRID** — `.fl-left`, `--fl-body-top` to tick 11:
  `brief | seam A (1fr) | register | seam B (2fr) | directory`. The last row
  sits ON tick 11 and the surplus splits **1:2**, because the GROUPING is 2:1
  (the brief and its four proofs are one object; the directory is the index of
  the rest of the file). `--fl-proof-top-gap` and `--fl-directory-gap` are
  FLOORS now, and seam A's floor is `--fl-brief-clear + --fl-proof-top-gap` —
  the air above the register has always been the sum of both.
  Measured: 18.1/13.5 at 1280×720 · 20/20.9 at 1440×800 · 25.9/38.8 at
  1920×1080 · 58.8/117.6 at 1920×1247, last row on t11 at every one.
- ⚠ **`.fl-left` IS HOUSING: no `data-fl-panel`, no client mark, no
  `overflow: hidden`.** ADR-087's frame law, plus the mechanical reason (a
  promoted wrapper becomes a containing block) — and the missing clip is what
  lets the zones strike in from `--fl-dx` and makes an over-long directory
  overrun LOUDLY instead of clipping its last row in silence.
  ⚠ Every zone declares `grid-row` (1 / 3 / 5); auto-placement fills rows 1–3
  and leaves both seams empty. ⚠ The ≤960/PRM block resets `display: contents`
  AND `grid-row: auto`, or the brief seats over the tabs on a phone.
- ⚠ **THE DIRECTORY HEAD'S 6px OVER ITS LIST IS DECLARED AFTER THE BASE RULE.**
  Inside the tall-rung block it loses to `.fl-dir__list`'s own `margin: 0` on
  source order at equal specificity and does nothing — measured at 0px on both
  tall viewports on the first cut, with every other number correct.
- ⚠ **AN EXACT BOUND AGAINST A TRANSFORMED RECT IS A FLAKE GENERATOR.** The
  smoke's mark ladder gained a 0.5px epsilon: a 21px mark measured
  21.000015258789062 (21 + 2⁻¹⁶) on one run sampled mid-strike and passed twice
  more at the same progress. The register rides `translate3d`, so its
  descendants' rects come back through a float matrix.
- ⚠ **`summaryGap < 80` IS DELETED, NOT RETUNED** — it read from the brief's
  paragraph (row-dependent) and its literal assumed a column that pooled its
  surplus. `gapA ≤ gapB` plus the t11 seating law replace it, at every viewport
  rather than only the tall ones.
- **Verifying:** `node scripts/capture-casefile-rows.mjs --vp 1920x1247 --rows
0,1,2,3 --stage` prints the two seams, the directory's height and the t11
  delta beside the type. ⚠ The photo-resolution smoke case fails on the mobile
  projects when the run is parallel and the dev server is shared (status `0`, a
  thrown fetch) while all four assets serve 200 to `curl` — environmental.

## The panel fills its housing (ADR-084, live)

The Studio and ATL rows' composition, and the console's paint.

- ⚠ **THE ADS AND THE FILM ARE WIDTH-BOUND, so no height lever reaches their
  surplus.** `.fl-stills` is `repeat(3, minmax(0, 1fr))` with `aspect-ratio:
4/5` tiles: three across the field's ~793px is ~254×317 **whatever the
  console's height**. `.fl-plate--films` caps `--fl-film-h` at 470 and
  `.fl-filmframe` converts that to a max-width through 16/9, so at 850px of
  field the frame is 802×484. Both were composed against LANDSCAPE fields
  (611×390, 688×444) and the owner's console is **850×927, portrait** — the
  ADR-070 U12/U14/U32 defect in two new places. ⚠ `.fl-stills`' comment
  claimed "tiles fit by HEIGHT" and was FALSE; it is corrected, and the
  correction is the durable half.
- ⚠ **SIX ADS, AND THE SECOND ROW IS HEIGHT-GATED.** Two rows are ~666px
  against the 444px field at 1440×800, so the rung is `(min-width: 1200px) and
(min-height: 1070px)` — the register's own. Below it the plate is
  byte-identical to what shipped.
- ⚠ **THE GATE IS SCOPED TO `.fl-case`, AND A MEDIA QUERY CANNOT REPLACE THE
  SCOPE.** `.arc-sheets` is `max-width: calc(h * 1.7)` — LANDSCAPE by
  construction, ~1100×600 at 1920×1080 — and no viewport fits a 3×2 grid
  there. `.fl-con` is `container-type: inline-size`, so `@container` can ask
  about width but NEVER height; a viewport-height rung fires on the arc at a
  tall viewport. A fit divergence, not a content one — the array stays one
  record, which is what ADR-078's `toBe` protects.
- ⚠ **ONE ASSET IS A CROP** (`experience-concerts.jpg`, a 1440×2560 story cut
  windowed to rows 380–2180 against the subject). Owner's call as the art
  director; the shown-WHOLE rule is otherwise intact. Do not re-crop by centre.
- **`CaseFilmProduction` hangs on the `films` VISUAL, not on `CaseFilm`** —
  both films came off one pipeline, so per-film it is the same record twice
  with a rail pretending it changed. ⚠ **Model names ARE in scope on this row**
  (owner, 2026-08-28); the map's stricter envelope is untouched.
  ⚠ **THE CREW ROW IS DELETED** (owner, the day it shipped): five departments
  with no names attached read as filler, and this surface has removed a console
  head, a foot and a designator for less. The CHAIN stays — it is a record a
  reader can check against the drawing. If a crew ever returns it needs a
  reason beyond filling height, and the roles-only rule comes back with it.
- ⚠ **THE ARC DOES NOT GET THE BLOCK** — `.arc-films` is landscape and the 16:9
  frame already fills it, so `ArcStudioFilms` passes `films` alone and the prop
  is optional for that reason. ⚠ **But the FLOW rung does**: below 980px and
  under PRM at any width there is no ceiling, so hiding it would cost the
  record and buy nothing. Chain halves to two columns there.
- ⚠ **THE CONSOLE'S TRANSPARENCY OVERRIDES `--con-ground`, NEVER `--con-void`.**
  `--con-void` is the OPAQUE BED for the station diamond, the lit station's
  fill, `.fl-detail__in` and **`--pda-void` — the map's entire drawing floor**.
  Softening it makes the panel look right while every instrument inside it
  loses its floor. `--con-ground` is new, defaults to `--con-void`, and only
  `.fl-con__console` paints it. ⚠ **No guard catches either half**: the light
  walk takes `.fl-con__console`'s `backgroundColor` luminance from the raw RGB,
  so an alpha here moves no ratio it reports. 0.86 was set BY EYE, composited,
  in both themes. The blur stays gated on `data-proof-settled`.
- ⚠ **`--lc` IS RETIRED (ADR-088, 2026-09-02), AND THIS BULLET TAUGHT IT AS LAW
  — THE SECOND HEIGHT-ELASTIC CONTENT TOKEN ON THIS SURFACE TO GO.** It was
  `clamp(11.5px, min(0.95vw, 1.3svh), 16.5px)` on `.fl-case`, driving the
  register claim (×0.95), its sentence (×1), the directory row (×1.02) and the
  meta (×0.75) — four roles across TWO FACES. **One token cannot hold a ranking
  across two faces**: its `svh` term made the order flip with viewport height,
  so at 1920×1080 the sans SENTENCE (14.04) outranked the mono CLAIM (13.34) it
  explains, and at the owner's 1920×1247 four roles sat inside 1.1px with the
  directory row the largest text after the title. The split is by FACE now —
  mono on `--fl-chrome-lg`/`-md`, sans at `--fl-copy / --fl-ratio` — and one
  consumer lived OUTSIDE this column (`pda.css`'s `.fl-pda__list-row`), where a
  stale `var()` would have fallen to its fallback in silence rather than
  failing. The `min(vw, svh)` observation below is still true of `--fl-copy`
  and is why the SENTENCE cannot simply grow; it was never a reason for the
  other three.
  ⚠ **`--sh` IS RETIRED (ADR-085 U1) AND THIS BULLET TAUGHT IT AS LAW FOR A
  DAY.** It was `clamp(12px, min(1.35vw, 2.15svh), 25px)` on
  `.fl-plate--sheets`, driving both sheet bodies by ratio — and it is declared
  NOWHERE in `components/` now (it let a sheet's category NAME render 33.7px at
  1920, outranking the project name). **The live ladder is `--fl-t0` ×
  `--fl-ratio` (1.2) → `--fl-chrome-sm/md/lg`, plus `--fl-display` and
  `--fl-copy`** (casefile.css:249–292). The height-elastic story `--sh` carried
  is genuinely gone; a tall desktop caps the category name at the surface's
  display size and the IMAGES fill the slack. Do not hang a new sheet ladder
  off a ratio token that no longer exists.
  ⚠ **The 14.1px wrap point is still the SENTENCE's wall** (459px of a 462px
  column at 14px — 99.3 % of the line), which is why it sits at 13.5px on the
  ratio and floors at 11.5 rather than 12 at the 1200px corner.
- ⚠ **THE REGISTER BOX IS THE WALL, NOT THE WIDTH.** `--fl-proof-h` is 246px at
  1920×1080 (the clamp's floor) with four `1fr` rows, so the box — not the
  column — is what bounds the claim and its sentence there. ⚠ Its 282px ceiling
  was set by a directory that needed ~144px in a fixed band; since ADR-088 the
  directory takes only what its rows need and is seated on tick 11, so **that
  ceiling is now a spare lever rather than a wall** (ADR-088 §Left open names
  it as the answer if the seams read too large on a tall window). Shrinking the
  box to widen the seams was built and REJECTED — see the same section.
- ⚠ **`space-between` MADE THE LINE WORSE, AND THAT IS THE FINDING.** Distributing
  all four blocks evenly put ~200px between each and turned a column into four
  disconnected fragments. **Even distribution only improves a column with enough
  content to distribute.** It is a grid with THREE anchors now — category at the
  head, `.fl-cmp__read` (claim + description, which may not drift apart) centred
  in the body, exemplars at the floor.
- ⚠ **THE RED LINE IS FOUR BANDS — A 2×2 CANNOT FILL A TALL PANEL.** Four risk
  statements are ~90px of ink against an 880px field, so `align-content: center`
  left ~350px of void and no type size closes that. `grid-auto-rows: 1fr` on one
  column divides the height whatever the height is, each band centring its own
  content, claim on a left rail with its evidence beside it — the proof index's
  own grammar one scale up. ⚠ It suits the arc's LANDSCAPE box for free (~150px
  bands at 1100×600), which the 2×2 needed tuning for.
- **The register's size is paid out of the LEADING.** ⚠ The SIZES below are
  superseded by ADR-088 (claim `--fl-chrome-lg`, sentence
  `max(11.5px, --fl-copy / --fl-ratio)`, α **.78**); the LEADINGS and the law
  are what still bind — claim / 1.18, sentence / 1.3. ⚠ At the compact rung the
  claim's size is paid out of the ITEM'S PADDING instead (`2px 0` → `1px 0`):
  at 13.2 its line box is 15.58px and exceeds the 14px mark, so four rows at
  2px would measure 83.3 in a 76.32 box. 13.5 × 1.18 < 13 × 1.25, so
  the type grows and the row shrinks — the box has ~4px of slack at 1920×1080
  and a naive bump overflows a reference viewport. ⚠ **THE CEILING RISES, THE
  FLOOR DOES NOT**: wrap is size ÷ COLUMN WIDTH and the rung opens at 1200px
  where the column is narrowest, so the slopes reach their ceilings near
  1875/1918 and the narrow corner is byte-identical.
- ⚠ **THE "95 chars wraps to exactly two lines" NOTE IS STALE.** Measured
  against an UNCLAMPED CLONE (a `-webkit-box` clips rather than overflows, so
  the clamped box cannot report its own truncation), all four descriptions are
  ONE line at 14px from 1920×1080 up, two at the 1200px corner, never three.
- **Verifying:** `node scripts/capture-casefile-rows.mjs --vp 1920x1247
--theme dark --rows 0,1,2,3` — headed, real scrolls, rows chosen by CLICK.
  It reports every box, the tile count, the register's rendered sizes and the
  unclamped line counts. ⚠ Two `services-ring-smoke` failures are PRE-EXISTING
  (the Voidwalker masthead's era text; `--pda-txt3` at 2.38:1 in the light
  walk) — confirm by stashing before blaming a change.
- **Still open:** THE LINE and THE RED LINE still centre their content
  (`.fl-cmp__ex`'s `margin: auto 0 0`, `.fl-caps--sheet`'s `align-content:
center`); seated verdict bands and a fourth `THE PROCESS` sheet were offered
  and not taken.

## The sheet template (ADR-084 U1, live)

The three Studio sheets shared a rail and nothing else — a grid of images, a
bespoke two-column comparison, a borrowed four-band list (owner, 2026-08-29:
_"each of them looks completely different"_). The band is the shared member.

- **EVERY SHEET ENDS ON ITS VERDICT.** `CaseSheet.verdict: { kicker, copy }` —
  a mono designation and one sentence, rendered as `.fl-verdict`. It is the
  SOURCE DECK'S own grammar: slides 3, 9 and 10 of `ai-in-studio-final.pptx`
  each close on one band under `PRINCIPLE` / `POSITION`. The body is the
  evidence; the band is what the evidence means.
- ⚠ **IT IS NOT `.fl-con__foot`, AND THE SMOKE STILL BANS THAT.** ADR-068 U2
  stands: no plate prints a console foot, because that slot is ROW chrome
  saying one thing under whatever the rail shows. This is SHEET content — it
  switches with the rail — and it rides `.fl-filmprod`'s seat: a
  `flex: 0 0 auto` SIBLING of the body inside `.fl-con__field`, the body
  keeping `flex: 1 1 auto`, a `--con-hair` top seam, kicker on
  `--fl-chrome-sm`/.2em, sentence in PP Neue Montreal on `--fl-copy`.
- ⚠ **ALWAYS ON**, where `.fl-filmprod` is tall-gated. That block is
  supplementary record about a row; this is each sheet's punchline, and on THE
  RED LINE it is the only place the surface says UGC. A verdict that hides at
  1280×720 is a sheet that stopped arguing at the binding viewport.
- ⚠ **REQUIRED BY THE REGISTRY, OPTIONAL IN THE TYPE** — so the template cannot
  erode one sheet at a time. Kicker ≤16, copy ≤160 (two lines at the narrowest
  field). `.fl-caps--sheet + .fl-verdict` drops the top border: the red line's
  grid already ends on its own hairline and two seams a pixel apart read as a
  glitch.
- **`CaseFact.tag` IS THE DECK'S RISK CATEGORY** (BRAND · REPUTATION ·
  FINANCIAL · PARTNERSHIP RISK) — what turns four sentences into one ranked
  argument, because the reader takes the AXIS before the claim. ⚠ ALL-OR-NONE
  per sheet, registry-enforced: a tag on some bands emphasises those, and these
  four are of equal rank. ⚠ Placed at grid **row 1 / column 1 explicitly** — a
  third auto-placed child breaks the claim↔evidence baseline pair; absent, the
  auto row collapses to 0 and an untagged sheet renders byte-identically.
- ⚠ **THE FIGURE IS SIZED FROM ITS HEIGHT AND IT SHRINKS.** `.fl-cmp__figure`
  is THE LINE's squeeze absorber (middle `1fr` row, every sibling `auto`) and
  every term sizing it was a WIDTH — so it absorbed nothing when the band took
  ~83px of HEIGHT, and at 1280×720 the middle wanted **301px in a 259.6px
  row**. `.fl-cmp__middle` STRETCHES to its row now (a definite box) and the
  figure is `flex: 0 1 auto; min-height: 0` with its size on `height`: the
  layout does the arithmetic, and the clamp is a CEILING for tall viewports
  rather than a size. ⚠ **A fixed `svh` cap was the first fix and it is the
  wrong shape** — the overflow depends on the row's height AND the
  description's wrap, so one coefficient lands at 720h and misses at 800h.
- ⚠ **A SYMMETRIC OVERFLOW REPORTS ZERO, AND THAT IS HOW THIS SHIPPED BROKEN
  FOR AN HOUR.** `align-self: center` spills content equally through the head
  above and the exemplars below, so `scrollHeight === clientHeight` and
  `capture-casefile-rows` printed `OK` on the frame it had just broken. This
  file already named the failure mode one plate over. **It was found by LOOKING
  at the station.** The landing's clip sweep now walks EVERY station of a
  sheets row (it read each row on its DEFAULT station only, so THE LINE and THE
  RED LINE were never measured on the landing) and asserts the head is not
  clipped above its box and the middle does not print through the exemplars.
- ⚠ **THE ARC GAINED A QUESTION RATHER THAN LOSING ONE.** The band takes 64–83px
  of that console, so `fillH` was expected to fall through its 0.7 pin — it does
  not (measured 0.774 → 0.83; the box is landscape and the tiles are one row),
  **so the pin stays rather than being "retuned" to a number the change did not
  require.** New: `fillUnion` (tiles' top → band's bottom vs the console,
  measured 0.922–0.939, pinned > 0.85), the band on every station, and the four
  tags rendering. Two-surface change — run BOTH smokes.

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
  equalising the two rows to the tallest plate. **Single BR notch** (ADR-065
  U5, owner 2026-08-14 — a seated set takes ITS HOUSING's diagonal, and this
  housing is the enumerated TL+BR console; supersedes U1's BL for this set
  only). ⚠ Pinned from BOTH ENDS in the smoke — BR notched _and_ BL square;
  the old one-sided `squareBL === false` verified the corner was BL rather
  than that it was right. ⚠ The inner layer is OPAQUE ground —
  translucent-over-edge floods the plate with the edge colour. Wraps 1×4
  under 480px.
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
- **A STATION IS A PLATE, AND ONLY THE LEADING ONE IS NOTCHED** (ADR-067 U2,
  owner 2026-08-12 — _"only the work tab should have that"_; supersedes U1's
  universal cut, keeps its TOP-LEFT direction). ⚠ **WORK's notch paints
  nothing**: the console removes `x + y < --con-ch` (15.9–22px), a station
  removes `x + y < --stn-ch + 2` (10.6–13px), so the leading cut is SUBSUMED
  by ≥8px at every clamp rung and what reads as WORK's notch is the housing's.
  The rule was therefore delivering exactly one visible thing — a diagonal
  185–581px along the rail on each OTHER plate, with no edge to explain it.
  `clip-path` is on `:first-of-type`; every trailing plate is square, on
  **every** rail (map 3 · tools 4 · films 2 · sheets 3 · both labs).
  ⚠ **The seam's shoulder is DECLARED now** — U1 got it free from the owning
  plate's clip, so `.fl-con__stn + .fl-con__stn::before` carries
  `top: var(--stn-ch)` explicitly; identical pixels, and the read it protects
  (seated keys, not a divided bar) never came from the notch. ⚠ **Pinned in
  BOTH directions** by the smoke's rail sweep (leading plate keeps a polygon ·
  every trailing plate computes `none` · seam inset non-zero) — U1 shipped
  unpinned and its own text says so, which is how a universal cut flipped
  direction and went unremarked. The
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
- ⚠ **READING 03 HAS NO SECTION RULES**, and the ruling outlived the drawing.
  `THE TEAMS THAT RUN THE WORK` and `THE SHAPES THEY ALL DRAW ON` were a
  matched PAIR naming the two rows of the CROSSING drawing, which ADR-070 U15
  replaced with the pin grid — but the reason they went still binds: **a label
  that explains a drawing competes with it for the same currency**, and
  labelling half a symmetric drawing is worse than labelling neither. Deleting
  them bought that crop 718 → 632 units; the pin grid letters no section head
  either, and its `gloss` is content rather than a caption on the drawing.
  (⚠ Its numbers are superseded — 03 renders 7.76px at 1280×720 now, not
  5.06–5.63.)
- **Light contrast is guarded on ALL FOUR ROWS.** Putting the plates on the
  map's parchment ground turned ADR-058's accepted "gold as small text is
  1.8:1" into a visible defect — measured 1.25:1 on a tab ordinal beside a map
  at 4.79:1. Fixed with the ADR-063 U2 ramp on those two plates only; the
  other sites ADR-058 named are still a sweep. ⚠ Dim states go to INK, not to
  a dimmer gold: no alpha of a light hue reaches the floor.

## The selection morph, and the answered configuration (ADR-069, live)

- ⚠ **THE CARD IS ONE DRAWING AT TWO SIZES, AND UNTIL 2026-08-13 IT WAS TWO**
  (owner: _"the styling of the work cards should match the ones in
  configuration"_). Reading 02 was redrawn on the R4 handoff (U11–U13) while
  reading 01 kept v18's cartridge, so the object the flight claims to CARRY
  changed its corners, its state mark, its colour and its title's height at the
  instant of the swap. **Every guard was green**, because `pda-flight` measures
  the two RECTS — a silhouette — and each interior was only ever measured
  against itself. `CARD` (pdaGlyphs) is now `SEAT`'s own values ÷ `CORE_K`, rung
  for rung, and **`tests/lib/pda-card.test.ts` holds the pair** — including a
  guard that FAILS on a rung added to one card and not the other, which is the
  form the drift actually took. What moved, and why each:
  - the TL notch → **the TR + BL chamfer pair**. A single notch IS lawful for a
    uniform set inside a chamfered housing (ADR-065 U1) but only "on the lawful
    diagonal", and top-left never was one. ⚠ **The selection now lights BOTH
    diagonals**: lighting one of a symmetric pair reads as a rendering fault
    rather than as a latch.
  - the circle gauge → R4's squared **`StateMark`, moved UP INTO THE HEADER
    ROW**. The gauge floated in a band of its own that spent 37 % of the card on
    one 22-unit circle, and **that band is what pinned the title at 68 % down** —
    which is the thing the owner could see.
  - the vents, and the divider → nothing. Material language the seat card does
    not speak, and a rule between two blocks R4 separates with a gold key.
  - the lane · autonomy pair → the shared **`LaneMeter`**, and **`autonomy` came
    off the card with it** (owner). Reading 02 letters it on the OWNER PLATE,
    where a person's latitude belongs; printed in both places it is this
    surface's said-twice defect. ⚠ **The foot is no longer a PAIR** — it is one
    left-anchored run, so what it can overflow is the far wall, not a neighbour
    in the middle, and the guard's question changed with it.
  - green `cfg` → **gold**. A ROLE fix, not a restyle: R4's law is gold =
    wayfinding, green = the human and nothing else, and the seat plate is the
    green object here. The same stream was green in the grid and gold in the
    configuration, so **the flight changed its colour in mid-air**. What green
    was carrying survives twice over — solid gold on a dim DASHED body, and a
    squared mark against a crossed one.
- ⚠ **THE TITLE'S BASELINE IS THE ONE MEASURE THE TWO DO NOT SHARE, and it is
  arithmetic.** The seat hangs its title 28 % down and fills everything under it
  with THE BAR; the grid letters no bar (owner — match the styling, not the
  content), so seat parity would pool **80 units, 59 % of the card, into one
  hole**. `configLayout`'s own rule applies: **SPLIT THE SLACK, DON'T POOL IT** —
  header and foot stay at seat parity, the title takes the middle with equal air
  either side (baseline 71.75, i.e. 68 % → **53 %** down). ⚠ **A card that DOES
  letter a bar takes `CARD.titleSeated`** instead, because the space stops being
  slack.
- ⚠ **PROPORTIONAL TYPE PARITY IS NOT AVAILABLE AT 59 % OF THE SIZE.** The
  seat's 22-unit title ÷ `CORE_K` is 12.9 and `CART_TYPE.title` is capped at 11.5
  so that none of the twenty titles wraps. The geometry scales; the type is
  derived from each box's own measured slack. That gap is ADR-063 §Outstanding
  and it stays.
- ⚠ **`Cartridge`'s BAR SCALES WITH `k` NOW.** It was `fontSize="10"`, hardcoded,
  which is the recorded reason every config-lab variant's minPx stuck at 5.4px
  however large its card was. Production passes no bar, so the fix only reaches
  the labs — which is exactly where the defect was measured, and their quoted
  numbers are now a RECORD rather than a render.
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
- **The open record lights its own CUT EDGES**, and only once reading 02 has been
  shown. The chamfers are where a cartridge is keyed, so it reads as latched
  rather than as a fourth state of the MARK, and it gives the return flight
  somewhere to land. Nothing is marked at rest: `shown[0]` is a default, not a
  choice the reader made. ⚠ **BOTH diagonals since the harmonisation** — the
  silhouette has two, and lighting one of a symmetric pair reads as a bug.
- ⚠ **EVERY CARTRIDGE MUST TAKE A CLICK AT ITS CENTRE, and this was broken.**
  A person-led body is `fill: none` and an unfilled SVG path hit-tests on its
  STROKE alone, so all three person-led streams reached the bare `<svg>` and did
  nothing — on a surface whose whole argument is that the negative space is a
  reading. It survived because the keyboard path worked and the smoke clicked
  `.fl-pda-hit` FIRST, which is configured and filled. The fix is a transparent
  hit rect matching the path's extremes (so the flight's origin does not move);
  the guard hit-tests all twenty with `elementFromPoint`. **A new glyph state
  with no fill re-arms this.** ⚠ Since the harmonisation the card also paints an
  opaque `--pda-void` base under its wash, so no state is `fill: none` any more
  and the ORIGINAL cause is gone — but the rect stays and the guard stays: it is
  the invariant that matters, not the two ways it currently happens to hold.

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
- ⚠ **READING 01 STILL MISSES THE 8.5px FLOOR, AND NO CROP LEVER REMAINS.**
  01 renders 6.22–7.16px at 1280×720 (9.60–11.03 at 1920). ⚠ **03 IS FIXED —
  7.76px, and 10.94 at 1920** — but by its REDRAW (ADR-070 U15), not by the
  crop: elasticity buys zero type by construction. The smoke holds a floor
  under RENDERED type (4.3px), not the authored unit. 01's remaining gap is
  **density**: 20 cartridges 4-across need ~136px each for an 8.5px title,
  which fits the width but makes the grid ~1.5× the field's height, and no
  crop or font constant closes that. ADR-063 §Outstanding lists the four
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

## The hub speaks (ADR-085 U2, live)

Reading 03's centre — the resting brief, a pinned substrate's `meaning`, a
pinned Skill's card — is the ONE sans-serif instrument on this surface.

- ⚠ **THE HUB IS IBM PLEX SANS; EVERYTHING ELSE ON ALL THREE READINGS IS PT
  MONO.** `.fl-pda-hub-copy` on `Aperture`'s group is the hook, the family is
  declared in pda.css. The owner's read (2026-08-29) was that the centre _"feels
  like a mono type, but we need something else"_ — the hub is where this drawing
  writes PROSE rather than labels, and ADR-085 pass one had just made the whole
  map one mono (fixing the `--font-mono` leak), which is what made the sentence
  look like a label.
- ⚠ **IT RESOLVES `--font-ibm-plex`, next/font's variable on `<html>`, NOT a
  `.fl-case` token.** Deliberate: `--fl-mono` resolves only inside
  `.fl-case`/`.arc-*`, and the map's EXPANDED overlay portals to `document.body`,
  outside both — a scoped token would letter the hub correctly in the panel and
  fall back to a system face in the overlay.
- ⚠ **IBM PLEX SANS WAS LOADED ON EVERY ROUTE AND USED NOWHERE** before this.
  `app/layout.tsx` has instantiated it since the retired design system with
  `--font-ibm-plex` referenced by no rule in the app. The hub is its one
  consumer, and the weights are cut to the hub's own two — **400 and 700**
  (was 300/400/500). The pinned titles have always asked for `fontWeight={700}`,
  which that instance did not load: they were SYNTHESISED, and any advance
  measured off them was a fiction.
- ⚠ **THE FIT ARITHMETIC IS A SEPARATE, MEASURED MODEL — `hubAdv`, NOT `adv`.**
  `adv(fs, track) = fs × (0.6 + track)` is PT Mono's fixed cell; against a
  proportional face it is a guard measuring a MODEL of the drawing rather than
  the drawing (ADR-070 U34's finding). `hubAdv` carries measured worst-case
  advances and feeds `carrierBriefFits` / `carrierShapeFits` /
  `carrierPinnedFits` ONLY. Everything else stays on `adv`.
- ⚠ **THE TWO RUNGS MOVE IN OPPOSITE DIRECTIONS, WHICH IS WHY ONE CONSTANT WILL
  NOT DO.** Measured in the browser that renders them (`document.fonts.ready` +
  real `getComputedTextLength`, never a canvas estimate) over the drawing's OWN
  copy: body 13/.02em/400 is **0.5385 em** against the mono model's 0.62
  (−13 %), meta 12/.08em/400 is 0.5682 against 0.68 (−16 %), but **caps
  17/.04em/700 is 0.7154 against 0.64 (+12 %)**. Plex's prose is narrower — every
  body budget gains slack for free — while its bold caps are WIDER, so the pinned
  title is the one string that got tighter and it is exactly what the
  `wall > 16` guard measures. An averaged constant would hide that under the
  body's surplus. Stored `HUB_ADV_BODY` 0.53 / `HUB_ADV_CAPS` 0.69, tracking
  removed so the `+ track` term stays where the surface keeps it.
- ⚠ **THE BUDGETS DID NOT MOVE, DELIBERATELY.** `BRIEF_PER` 30 could go to 34 on
  the narrower face. It stays: the characters buy nothing, the shorter measure
  sits further inside the chamfered chord, and **re-wrapping settled copy to fill
  a new budget is how a line count changes under a guard that only checks the
  words all survived.** The slack is banked, not spent.
- Measured clearances after the change: brief **43.3** against `> 24`, the five
  shapes **43.6–52.9**, pinned **55.2** against `> 16` (worst "VSME Reporting").
  The wider caps are absorbed because the block's HEIGHT dominates
  `boxClearance` at the 30° normal.
- ⚠ **THE SVG'S FAMILIES ARE PINNED NOW, BOTH HALVES.** The smoke's HTML type
  sweep skips SVG by design (_"the map's SVG is its own pass"_), which is how
  this surface shipped a wrong face TWICE — the Plex Mono leak, and the missing 700. `readPda` returns `hubFonts` + `labelFonts`; the reading-03 gate asserts
  the hub matches `/IBM Plex Sans/` **and** every other label matches `/PT
Mono/`. Asserting only the hub would let the mono half rot exactly as before.

## The carrier's walls (ADR-070 U34, live)

Reading 03's plate. What the drawing IS lives in ADR-070 U33; this is the rule
about where its walls are, which is what nineteen labels got wrong.

- ⚠ **THE DODECAGON IS THE HOUSING; THE DIVISION INSIDE IT IS CONCENTRIC.** The
  silhouette (`R_OUT`), the hub (`R_HUB`), the band's inner ring (`R_CELL`) and
  the outermost cells' outer edge are twelve-sided. The four internal course
  seams per part are circles. ADR-065's law one level up: the housing carries
  the machined geometry and what is seated inside it does not repeat it.
- ⚠ **THE WALL A LABEL CLEARS IS NOT ALWAYS THE WALL'S RADIUS**, and this is
  the whole finding. A CIRCULAR wall is exact; a POLYGONAL INNER wall is worst
  at its circumradius (so `R_CELL` is its own bound); a POLYGONAL OUTER wall is
  worst at its **apothem**, `κ·R` — which at `R_OUT` is **13.1 units** nearer
  than the radius. `CarrierCell.outerWall` carries that third case and
  `carrierCellArcRadius` centres on `[r0, outerWall]`.
  **Nineteen of forty-seven labels printed through their own cell edge** while
  every guard reported 7–12 units of air on both sides, because they read
  `cell.r0`/`cell.r1` — the nominal radii, which are the wall only at the
  twelve vertices.
- ⚠ **MEASURE AGAINST THE DRAWN WALL, NOT THE PARTITION.** `substrate-lab-fit`
  samples each cell's own sweep with `polygonRayRadius` where the wall is the
  housing and the plain radius where it is a seam. A guard that cannot tell
  those apart is one this drawing has already got wrong once — ADR-069 U1's
  finding, one level down.
- ⚠ **AND THE LIVE HALF IS THE ONE THAT CANNOT DRIFT.** The smoke probes each
  glyph's ink extremes along the up-vector and asserts `isPointInFill` on the
  cell's own path. Two labels not printing through EACH OTHER (the arc-collision
  walk) and a label not printing through its own CELL EDGE are different
  questions; only the first had a guard.
  ⚠ **The ink block is ASYMMETRIC about the baseline** — ascender **0.769em
  above**, descender **0.231em below** (which is why `LABEL_INK_MID` is 0.269,
  the half-difference, and `LABEL_INK_HALF` 0.500, the half-sum). Swapping them
  reports every tight cell as a spill.
- ⚠ **THE SEAMS ARE SAMPLED POLYLINES AND MAY NEVER BECOME `A` COMMANDS.**
  ADR-071's arrival morph interpolates CSS `d` between the chip's rectangle and
  `cell.d`, which needs ONE command structure on both ends; a mismatch does not
  error, it snaps discrete. `SEAM_STEP` is 3° — 0.10 units of sagitta at r 300.
- **The partition takes `carrierPolygonShare`** = `√(P/C)`, the dodecagon's unit
  sector area over the circle's (0.9758–0.9779), and `sectorTerm` integrates
  each wall with its own constant. ⚠ **A SEAM IS SHARED, SO IT CANNOT BE SOLVED
  PER CELL** — the free boundary is the neighbouring course's wall, the two
  courses hold different cell counts, and the correction cascades into a
  `COURSE_GAP` that varies by up to a unit. Measured and rejected: 0.42 % area
  spread bought with 1.06u of ragged seam.
  ⚠ **So the area guard pins the STRUCTURE, not an envelope** — concentric-
  bounded cells to 1 %, the two housing-bounded courses to 2.5 %, blanket 4.5 %.
- **`LABEL_PAD` is 10 and `MIN_CELL_DEPTH` is 23**, and both moved because the
  MEASUREMENT changed, not the standard: boundaries pull in by `polygonShare`,
  and the last course's depth ends at the apothem. All five ladders are
  byte-identical to the pre-U34 drawing — the plate does not re-cut, the labels
  move inside it. ⚠ The pad is a floor the LADDER solves against, never the air
  the drawing ends up with; the achieved clearance is 5.4u at the worst cell.
- ⚠ **THE BAND HAS ITS OWN GROUND ON ALL FIVE SEGMENTS.** Pattern and
  Stakeholder were never missing a background — they are the two regions the
  open stream does not draw on, and `TapWash` filled the other three. The band
  was the only region on the plate with no material of its own (the hub has
  void + veil + grain, the cells their physics field), so a signal with no
  ground under it read as a rendering fault.
  ⚠ **α 0.10, and 0.03 was a fix that changed nothing** — a wash is judged
  against what it lands on, and at 0.03 the band measured `rgb(11,10,9)`
  against the plate ground's `rgb(11,9,5)` while the tapped three sat at a 6×
  luminance ratio. FLAT, not grained: the hub is a CORE and answers the
  hole-plugged-with-paint problem with a grain; this is a machined RECESS, and
  a recess is a cut face. It darkens in light (ADR-058 swaps `--dawn-rgb`), so
  one rule is a step away from the ground in both themes.
- ⚠ **STILL OPEN: the tap's signal is weak in LIGHT** — L 0.561 lit against
  0.578 recessed, a 3 % luminance difference carried by hue and by the label
  going `--pda-hot`. Pre-existing, not a regression, and it is ADR-063 U2's own
  finding: a saturated gold cannot signal by value against a light ground. The
  honest fix is the ramp's INK rung, not a bigger alpha.
- ⚠ **THE BAND IS INTERACTIVE (U36): CLICK A SUBSTRATE, THE HUB SAYS WHAT IT
  MEANS.** Each segment is a `.fl-pda-hit` group shaped like a cell's — one
  transparent path over the recess, one `textPath` label — and the WHOLE
  segment is the target, never the word (a `textPath` run is a thin ribbon on a
  curve). ⚠ `fill="transparent"`, never `none`. Pinning a shape and pinning a
  cell are MUTUALLY EXCLUSIVE, enforced at both setters: one hub displays one
  thing, and two pins make `Aperture`'s order a silent tiebreak.
  ⚠ **THE HUB LETTERS NO COUNT** — the first cut added `14 SKILLS` and
  `substrate-lab-fit` failed it with _"the nameplate's count row came back"_, a
  guard written from the owner's own U28 ruling. This drawing counts by AREA;
  the count lives in the `aria-label` alone, where it is the accessible
  equivalent of an area a screen reader cannot perceive.
  ⚠ **`SHAPE_PER` IS 27, NOT THE BRIEF'S 30**, and the hub's geometry is why: its
  worst edge normal is at 30°, where clearance is
  `apothem − 0.866·halfWidth − 0.5·halfHeight`, so WIDTH costs 1.7× what height
  does. At 30 the worst block cleared by 17.7; at 27 it clears by 35.2 with the
  same line counts.
- ⚠ **`outline` ON AN SVG GROUP IS DRAWN AROUND ITS BBOX**, and nothing on this
  plate is a rectangle — the UA focus ring was painting a 151×86 box over the
  neighbouring cells. `.fl-pda-hit` clears `outline` in every state and strokes
  its FIRST path instead, so the indicator traces the target. ⚠ It keys on
  `:focus`, NOT `:focus-visible`: measured live, `matches(':focus-visible')`
  returned FALSE on the very group the UA was ringing, so gating the replacement
  on it would leave keyboard users with no indicator at all.
- **Verifying:** `npx vitest run tests/lib/substrate-lab-fit.test.ts` for the
  arithmetic, `node scripts/capture-substrate-lab.mjs --v carrier` for the
  gates (⚠ the script's default `--v` is round one's seven — name `carrier` or
  the pass is ungated), and `node scripts/capture-map-readings.mjs --at 0.09
--vp 1920x1247` for the landing at the owner's own shape.

## Reading 03's drawing, and the crop every reading shares (ADR-070 U16 / U15)

⚠ **ADR-070 U24 (2026-08-17) IS THE LIVE DRAWING: ONE PLATE DIVIDED INTO FIVE
REGIONS OF MATERIAL, EACH HOLDING ITS OWN NAMED SKILLS** (`PdaSubstrate.tsx`).
U23 shipped the divided plate; U24 reverses its second half. `33 · inlay` won
the substrate lab after thirty-two directions across eight rounds; its local
copy is DELETED and the lab's `shipped` mounts production.

- ⚠ **THE 47 NAMED SKILL PLATES ARE BACK AND THE GRADUATION IS GONE** (owner:
  01 and 02 "feel super elegant", 03 "feels off"). U23 deleted them for a tick
  run on the argument that the roster ships one casefile row away — **the count
  survived that trade, the DENSITY did not.** 01 is a field of cartridges and 02
  a board of modules, both thick with named parts; 03 became three strings over
  texture. A tick is countable; a plate is countable AND readable.
- **Four lettered things per region** — name, count, paragraph, one label per
  Skill (`short`, authored ≤14, never `name` clipped). Lettering 20 → 67.
- ⚠ **THE RUN IS SEATED AT THE REGION'S FLOOR.** Area is the count and the run
  is the count, but the head is a FIXED cost — top-anchored, the heaviest
  regions carry a band of bare field UNDER their plates (140u under Pattern)
  while the lightest is packed, and that band reads as a hole. Seated, it reads
  as the material the plates settled out of.
- ⚠ **TWO COLUMNS, NOT A DERIVED COUNT.** Three fit the two wide regions and
  clip the three narrow ones (a 14-char `short` is 114.2u; a third column leaves
  117.1u before the accent), so a derived count draws two objects on one plate.
- ⚠ **THE LIGHTEST REGION IS THE BINDING CASE, BY CONSTRUCTION** — area is the
  count, so the fewest-Skills region is the smallest while its head costs the
  same fixed 87u. Stakeholder has **2.7u of spare at rest** (66.5 at the owner's
  viewport), and **a third paragraph line overflows it** while every per-string
  assertion still passes. The guard walks the ACTUAL wrap.
- **The count letters at the TITLE's size**, in gold: area is the gestalt, the
  plate run the tally, the numeral the exact figure — three reads of one number,
  which is the subject of this reading.
- **`GROUT` is 10, the title's baseline 32** (both owner asks: the boxes sat too
  close, the title too high).
- ⚠ **EVERY CORNER IS SQUARE — THERE IS NO OUTER CUT** (owner, same day). The
  plate's TR+BL chamfer landed INSIDE the two regions holding those corners
  (Validation TR, Judgment BL), so three blocks read square and two notched;
  and it removed 338u² from those two alone, which is **area, and area is the
  count**. ⚠ ADR-065 already covered it: **the children of a chamfered box are
  square**, and the console frame is the housing this plate is a child of. The
  top rule runs the FULL width now — stopping short of a square corner leaves
  26 units of bare edge that reads as a broken line.

- **The partition is DERIVED, area is the Skill count, and there are NO
  GUTTERS.** Slice-and-dice over the mass ranking, one cut on the outer
  boundary alone. ⚠ **A gutter is a statement about how many things there
  are** — take them away and five rectangles become REGIONS of one surface,
  which is the claim. Chamfering a region is banned: five machined housings
  put the work tab back.
- ⚠ **SUPERSEDED BY U24 ABOVE** — U23 lettered three things per region (name,
  count, paragraph) and dropped the 47 Skill plates for a tick graduation. The
  plates are back. `gloss` and `evalMethod` still letter NOWHERE on this
  reading; the paragraph replaced them and that half stands.
- ⚠ **`CaseMapShape.meaning` IS NEW, ≤96 chars MEASURED, and the ONLY field the
  projection does not uppercase.** `gloss` is a fragment sized for a 148-unit
  module; a label cannot be rendered into an explanation. It is the map's only
  prose, so `cases-registry` scans it and pins it distinct from its gloss,
  longer than it, and not uppercase.
- ⚠ **THE FLAGSHIP TAKES THE ACCENT, NOT THE INK** — its plate's bar goes green
  at full weight against its siblings' amber at .55. Lettering it in
  `--pda-grn-ink` would make the one plate the drawing points at the DIMMEST
  thing in the run. One signal per object. (U23 had it as a longer tick; the
  ticks are gone.)
- ⚠ **DENSITY IS PER UNIT AREA.** Particle painters emit a fixed count scaled
  by `k`, so at one shared `k` the SMALLEST region reads as the densest
  material — the count encoded a third time, backwards. `k` is the field's own
  area against a reference, clamped.
- ⚠ **THE DIVISION IS A GROUT AND THERE ARE NO INTERNAL RULES.** A 1-unit rule
  paints 0.65 device px at this meet (U16's spine/separator arithmetic), which
  is why the owner could not find a block's edge. Regions paint on a rect inset
  by half a 4-unit channel so the PLATE shows between materials. **A grout is
  not a gutter**; no rule goes back inside the channel.
- ⚠ **`BOX_H0` IS 696 (crop 748), NOT THE LAB'S 710/762.** The elastic crop
  must stay WIDTH-bound at the NARROWEST measured field (1440×800, aspect
  0.807); the lab's 0.8176 is height-bound there by four thousandths and cost
  9px of dead panel. **The ceiling on a width-bound elastic crop is the
  narrowest field's aspect** — that generalises to any `pdaFit` reading with
  `maxW: 0`. The extension goes ENTIRELY to the regions (all material, no hole
  to make), and they stay proportional so area-is-the-count holds at every
  height.

**THE PATTERN CARDS IT REPLACED (U16, for the record):** five cards, each a
stack of its named Skills over the pattern's physics, gloss in the foot. It was
`housing()` five times in a row — reading 01's grid at n = 5 — which broke the
owner's standing "it may not look like the work tab" before a string was
placed. Its `short`-label rule, its no-owner rule and its band-not-hairline
findings all still bind.

⚠ **THE 5 × 8 CROSSING IS STILL NOT DRAWN ANYWHERE ON THE SITE** by owner
ruling — `crossing()` still projects it and its arithmetic is still guarded,
and it cannot return inside a region (eight department codes need ~196u, and
marks without codes need a legend this surface bans).

**THE SUPERSEDED U16 RECORD FOLLOWS.**

⚠ **ADR-070 U16 (2026-08-13) WAS THE LIVE DRAWING: FIVE PATTERN CARDS, each a
stack of its own named Skills over the pattern's physics field, gloss in the
foot** (`map/pda/PdaSubstrate.tsx`). It supersedes U15's pin grid. What binds
from U15 is the ELASTIC CROP machinery below, the lettering-declaration rule,
and the envelope.

- **One card per pattern, one PLATE per Skill** — a slab with an accent at its
  left edge and the `short` label. Under the stack the raw field fills what is
  left; the foot is the `gloss`. ⚠ **THE READING IS EXTRACTION**: the plates
  are what has been encoded, the field is the material they came out of, so
  Stakeholder's five showing more raw field than Pattern's fourteen is the
  point rather than a hole.
- ⚠ **THE 5 × 8 CROSSING IS NOT DRAWN ANYWHERE ON THE SITE NOW** (owner
  ruling, taken explicitly). `crossing()` still projects it and its arithmetic
  is still guarded; ADR-062's city still holds it in `map/**` but is not what
  the landing renders. It cannot return inside a card — eight department codes
  need ~196 units against a 132-unit window, and marks without codes need a
  legend, which this surface bans. **If it returns it needs its own reading.**
- ⚠ **THE LABEL IS `short`, AUTHORED ≤14 CHARS, NEVER `name` TRUNCATED.**
  Clipping "Legal Risk Methodology" gives "Legal Risk Met" on a client page.
  `pda-substrate-fit` fails a `short` that clips its `name` mid-word.
- ⚠ **NO OWNER TRAVELS.** The source carries client staff names;
  `CaseSkillEntry` has refused that field since ADR-056, and the team is not
  lettered at all. The Skill NAMES are fine — `SkillsBrowserPlate` already
  renders all 47 one casefile row away.
- ⚠ **THE SPINE IS THE STACK'S LEFT EDGE, NOT A DRAWN LINE**, and **THE FOOT
  SEPARATOR IS A BAND, NOT A HAIRLINE.** Same arithmetic both times: a 1-unit
  rule paints under a device pixel at this meet and the browser pays the rest
  in alpha. An explicit bus with a node per Skill rendered as a bulleted list.
- ⚠ **THE FIRST ENCODE'S ACCENT GOES GREEN — ITS LABEL DOES NOT.**
  `--pda-grn-ink` against siblings at `--pda-txt` makes the highlighted plate
  the dimmest thing in the stack. One signal per object.
- **`GLOSS_LINE_BOX` 17 and `GLOSS_PER` 16 are both load-bearing** — a
  12-unit label's `getBBox` is 15.47 (em box, not ink), so a 15-unit pitch
  overlaps by 0.47 against a 0.5 gate; and 16 chars measure 130.6 of the
  132-unit window, which is the ceiling. The gloss is CENTRED in its band.
- **Height is split between the plate pitch (18 → 26, bounded) and the
  field.** All to the field and the plates stop being the subject; all to the
  pitch and a taller plate is a plate with air under it.
- **Declare anything new in `substrateLettering`.** `pda-substrate-fit` walks
  it for fit, for the longest WORD, for the fs floor and for the envelope. A
  lettered string missing from that list is a defect in the drawing. It also
  asserts every card's numeral equals its plates and that each pattern has
  exactly ONE first encode.
- ⚠ **THE `teams` BAN IS THE DIGIT-ADJACENT FORM ONLY** (`8 TEAMS`). It was
  catching `People-team`, a client proper noun that already ships — a ban wide
  enough to fail on correct content is a ban that gets deleted.
- **`substrateForms` lives in production** (`map/pda/substrateForms`), the lab
  re-exports it. Same rule as the kit move: production may not import from an
  internal route.
- ⚠ **THE CONSOLE'S REVEAL IS SCROLL-DRIVEN.** `scrollIntoView` leaves
  `.fl-con__console` at `opacity: 0` with the SVG fully measurable — a
  DOM-only check passes against a panel that paints nothing. Scroll in
  incrementally until it lights before you shoot.

**THE PIN GRID IT REPLACED (U15, for the record):** the owner's `Substrate
Archetypes` frame S3 — five patterns down, eight departments across, one mark
per crossing (30 taps, 5 cut, 10 empty, rows of 3 · 7 · 7 · 5 · 8 in
`MAP_DISTRICTS` order). It was correct; it went because it answered a question
about DEPARTMENTS on a surface whose subject is the SUBSTRATE, and would not
say what is IN a pattern. ⚠ Its own predecessor's lesson still binds: a
pattern drawn as a `Module` claims to be A THING THAT RUNS, and `8 TEAMS`
shipped from a string composed at render time, outside every content scanner.

**ALL THREE CROPS ARE ELASTIC** (`map/pda/pdaFit.ts`), which generalises U12
and U14 from reading 02 to the surface. ⚠ **Readings 01 and 03 were carrying
the identical defect while U12 was green** — 117px of dead width on 01 at
1280×720, **265px of dead panel** on 03 at the owner's 845 × 950, within 5px of
the 270px that forced U12. Nothing measured a drawing against the PANEL.

- **The trick:** make the crop's aspect EQUAL the field's and `meet` is the
  bound-axis ratio it already was, so **growing a crop is free**. ⚠ It buys
  ZERO type — it removes dead panel and nothing else.
- **`cropAround` is U14's split-margin law on both axes.** Reading 02's "fixed
  26-unit side inset" is exactly what the split produces, so it is one rule.
- **Where the extension goes, per reading:** 01 into its grid gutters (capped
  56/62 — past that the grid stops being a grid), 03 into its five bands
  (capped 190). ⚠ 03's clamp is **1200**, not 620: reading 02 spends its
  extension on CONTENT and must clamp early, while everything past 03's row cap
  is margin, which is split rather than pooled.
- ⚠ **`gridRect` TAKES THE LIVE LAYOUT AND IS NOT DEFAULTED** — a default is
  how "the flight computed against the resting board" gets written.
  `PdaConsole` holds ONE aspect and derives three layouts; the flight uses both
  live boards.
- ⚠ **THE ≤40-UNIT WASTE GUARD IS GONE, REPLACED NOT DELETED.** It asserted a
  static crop and would have fought this. `pda-viewbox` asserts centring on
  both axes plus `every reading fills the panel it is given` over seven
  measured fields. And `pda-flight` derives both boards per field: it walked
  the static `VIEW_BOX[1]` in eight places, which against an elastic 01 goes
  **vacuous rather than red**.
- **The kit lives in production now** — `map/pda/substrateKit` (`Tap`,
  `DeptHead`, `housing`, `FS`, the spec emitters) and `map/pda/pdaLetters`
  (`adv` / `specWidth` / `LetterSpec`). The substrate lab re-exports both.

## Reading 02's drawing — SEE U11 FIRST

⚠ **ADR-070 U11 (2026-08-11) IS THE LIVE DRAWING: the R4 SUBSTRATE FIELD,
built from the owner's `design_handoff_intel_config_r4`. It supersedes U10's
geometry, type and materials, which superseded U2–U9's.** What binds from
every earlier update is the CONTENT — the three questions, the six answers,
the seat, the bar, person-led answering all of them — and the flight
contract. The U10 and U2–U9 records below are kept for their RULINGS and
their traps; do not read their numbers as current.

- **The composition is the handoff's module table, verbatim**, in its own 888
  × 744 stage coordinates: owner `232,20,424×108` · left `4,192,204×218` ·
  right `680,192,204×218` · base `244,532,400×128`, card centred on
  `(444,300)`. Opaque modules on a faint PCB bed, **two opposed 45° corner
  cuts (**TR+BL** since U13, 12 deep — R4 draws TL+BR and the owner put the
  drawing back on ADR-065's CANONICAL diagonal, the one place the reference is
  overruled by a standing rule rather than by arithmetic; ⚠ `ConsoleFrame`
  keeps its U2 TL+BR override, so the plate and its housing now lean OPPOSITE
  ways — that mismatch was the whole argument for U11's cut, and if the frame
  should follow it is `console.css` and its own pass. ⚠ Two things ride the
  diagonal: the 2px top rule STOPS at the cut, and the header band needs its
  own `band()` path or it gets a 45° nick mid-module where no edge exists)**,
  a 2px top rule each, and **8-wire hatched ribbon
  lanes** on all five docks. Gold is wayfinding; **green is the human and
  nothing else**.
- ⚠ **THE BOARD IS HEIGHT-ELASTIC (U12), AND ONE STATIC CROP CANNOT SERVE
  THIS PANEL.** The console's field is capped at 850px wide but grows with
  the viewport's height, so its aspect runs 1.24 (laptop) → 0.76 (2560×1440).
  `meet` fits by the SMALLER ratio, so a landscape crop wastes height in a
  portrait field and vice versa — **U4, U10 and U11 each picked one end and
  letterboxed the other**, and U11 cost 270px of dead panel on the owner's own
  monitor while every assertion stayed green. That is a GUARD defect: nothing
  measured the drawing against the PANEL, only against its own crop.
  `configLayout(configExt(fieldAspect))` is the fix — the crop's WIDTH never
  moves, so the fit is width-bound and `meet` is `field.w / 932` at every
  height, which means **growing the crop's height is free** and `minPx` is
  byte-identical at every shape (7.76 / 8.74 / 10.94). The height goes to the
  CABLES (R4's own grammar — a taller board is a longer run) and the CELLS
  (air around the answers); ⚠ **the card is not in that list** — its box is
  the flight's destination, so it re-centres in the band instead, and ⚠ **the
  added cell air is SPLIT, not pooled**, or a taller module is just a module
  with a hole under it.
  ⚠ **AND THERE IS NO TAIL SHARE (U14, owner).** U12 hung the remainder off
  the bottom as bed, which is invisible — 26 units of air above the seat
  against 135 below the base at the owner's shape, so the block sat high in a
  panel with a hole under it. **The margin is DERIVED and SPLIT**: the module
  block takes what the cables and cells claim and the rest is halved above and
  below it, so the board is centred by construction at every height (55.5
  units each side at rest, 72.6 at the owner's). The BED spans the CROP now
  rather than trailing the block — R4's own 744-unit stage mapped onto it — so
  there is texture above the seat as well as below the base. ⚠ **`CONFIG_INSET`
  IS HORIZONTAL-ONLY**: the side margins are the fixed frame inset, the
  vertical is derived, and `pda-viewbox` asserts them SEPARATELY (side by
  equality with 26, vertical by top === bottom). Collapsing them back into one
  "uniform inset" test is how the tail returns unnoticed.
  `CONFIG_EXT_MAX` 620 fills every desktop
  shape; only a PORTRAIT desktop window reaches it, and there it letterboxes
  on purpose because a 590-unit bus run is a gap with wires in it.
  ⚠ **THE FLIGHT USES THE LIVE BOARD**, not `CONFIG_LAYOUT_0` — `PdaConsole`
  hands one `configLayout` object to the attribute AND to `pdaFlight`.
  ⚠ The `ResizeObserver` cannot feed back STRUCTURALLY: the SVG is absolutely
  positioned, so CSS sets its box and a `viewBox` change cannot move it.
- ⚠ **THE CROP'S WIDTH IS THE REFERENCE'S FRAME, NOT ITS STAGE.** At rest
  `-22 -35.5 932 751` (⚠ the recorded `-22 -6` was the PRE-U14 value, when the
  vertical margin was a hardcoded 26 rather than the derived split) — a uniform
  **26-unit SIDE inset** around content running
  `4…884 × 20…719`.
  Cropping to the stage measured better (meet 0.679 vs 0.647) and put the
  side modules **2.7px off the console wall**, which reads as clipped.
  ADR-064's bleed law is about a CAPTURE filling its bay; **a technical
  drawing whose outermost rule touches the wall has lost its margin, not
  bled**. The aspect (1.241 against measured field aspects 1.118–1.239) is
  what buys the type: meet 0.541 → **0.647** at 1280×720 and 0.833 →
  **0.912** at 1920×1080, i.e. **+20 % / +9 % before a font size moved**.
- ⚠ **A 1:1 PROTOTYPE CANNOT CARRY ITS TYPE INTO A BOX THAT SCALES.** R4's
  8.5 field label renders **5.5px** here — the size the owner called
  "utterly illegible" one day earlier — and its 6.5 chrome renders 4.2px,
  under the smoke's own 4.3 floor. So R4's **ranking** is kept and its bottom
  rungs are lifted to the floor: title 22 · value 14 · owner 14 · question 13
  · key 12.5 · chrome 12, floor **12**. The lost range is bought back in
  **ALPHA, which does not shrink with `meet`**.
- ⚠ **`pda-viewbox`'S WASTE GUARD CHANGED ITS QUESTION, NOT ITS STRICTNESS.**
  It asserted vertical tightness because the drawing was HEIGHT-bound;
  reading 02 is WIDTH-bound now, so height slack is free and asserting it
  measures the wrong axis. Reading 02 asserts the INSET instead — four equal
  margins inside `[18, 34]`. Readings 01 and 03 keep the height rule.
- ⚠ **SIX LETTERED THINGS IN R4 ARE DELIBERATELY ABSENT**, each forced by
  arithmetic or a standing law — the side stamps and passive designators
  (invented ordinals in costume, and 3.9px), the header metas (`RUNS` beside
  `WHAT RUNS IT`, and it does not fit at a legible size), the ribbon tags
  (`LANE` collides with the model lane), the satellite meters (a gauge beside
  a client's named Skill implies data this case does not publish) and the
  `DRAW —` prefix (on this record `draw` is WORKLOAD). **The bed's MARKS
  stay** — its texture never depended on the letters. Putting any back is a
  decision; the ADR's table is the list.
- **THE LANE LADDER IS THE ONE DELETED THING THAT RETURNED**, re-pointed. U4
  deleted the DRAW PER RUN meter, which measured WORKLOAD and needed a NEVER
  A PRICE caption; `PdaWork.draw` still letters nowhere. This meter is the
  capability LANE — generic by law, already published, exactly four values —
  so the gauge IS the record. It also answers U10's own loose end (_"what
  does everyday lane mean?"_): four cells with two lit is the scale the bare
  word never had. Guarded: the label must be one of the record's four lanes
  or `NO LANE`, may not contain `DRAW`, must read `NO LANE` for person-led,
  and the record must still span all four rungs.
- ⚠ **`CORE_K` IS 1.7 AND R4's CORE IS NOT SIMILAR TO THE CARTRIDGE.** 300 ×
  224 is 1.339, the cartridge is 1.294, and a uniform `dk` cannot carry a
  shape that changes proportion — so `CORE_RECT` stays `176 × 136 × CORE_K`
  centred on R4's own core centre. The card's cut stays PROPORTIONAL
  (`14 × CORE_K`) where the satellites take R4's flat 12.
- ⚠ **AN ALPHA CEILING IS SET AGAINST THE RENDERED DRAWING, NOT THE 1:1
  CANVAS.** At meet 0.647 a 1-unit hairline paints 0.65 device px and the
  browser pays the rest in alpha, so R4's ~.14 bed arrived at ~.09 and
  vanished. The bed's group opacity is 0.85 for that reason.

The U10 record follows. Read it for the rulings; its numbers are superseded.

## The seated board (ADR-070 U10 — SUPERSEDED ON GEOMETRY BY U11)

⚠ **U10 PROMOTED THE `seated` BOARD, AND IT SUPERSEDED
THE GEOMETRY, THE TYPE AND THE MATERIALS BELOW.** What still binds from U2–U9
is the CONTENT — the three questions, the six answers, the seat, the bar,
person-led answering all of them — and the flight contract. What changed:

- **The crop is `0 48 1000 912`, LANDSCAPE**, and `pda-viewbox`'s aspect
  assertion INVERTED with it (≥ 1.05, plus a bound on the tall field's type).
  The console's field is capped at 850px wide but grows with viewport height,
  so it is landscape on laptops (1.12–1.24) and portrait on tall screens
  (0.42–0.81). One crop cannot fill both: U4 chose portrait and paid 155–181px
  of horizontal letterbox on every laptop; U10 is the owner's call the other
  way, at the named cost of more vertical letterbox and ~17 % smaller type at
  2560×1440. ⚠ **An aspect contract that is deleted rather than flipped is a
  contract nobody notices breaking.**
- **Nothing letters under 12.** U9's keys at 10 rendered 5.4px / 8.3px, under
  the 8.5px chrome floor; the owner ruled them illegible. Ladder: question 13
  · key 14 · value 15 · owner 16 · bar 14. **A label nobody can read is not a
  quiet label, it is an absent one.**
- **The seat's dashed line is a PYLON.** U5's law is kept — the seat is
  AUTHORITY, not data, so never a bundle — but the distinction moves from
  WEIGHT to MATERIAL: authority is structure, data is conductors. Nothing
  flows down a pylon; it bears load, so it survives being drawn thick.
- ⚠ **The card is drawn by `SeatCard` in `PdaConfiguration`, NOT by
  `Cartridge`.** `Cartridge`'s offsets are absolute multiples of `k`, so at
  k 2 its title landed at +184 and its bar bottomed out THREE units off the
  floor; reading 01's grid still wants that glyph, so fixing it in place would
  re-lay-out the other reading. **The SILHOUETTE is what may not move** —
  `CORE_RECT` stays `176×136 × k` (now k 2) with the same `14k` chamfer,
  because ADR-069's flight docks into it and the dock group holds the card
  alone. ⚠ **AND ITS THREE STRINGS ARE DECLARED NOW**: while the card was
  `Cartridge`, its team code, id and title were lettered by a shared glyph and
  `configurationLettering` never saw them — the guard was walking a drawing
  with three invisible labels in it. **Any reading that mounts a production
  glyph inherits that blind spot.**
- **One ink for every answer, keys in Tensor gold (`--pda-ink`), the hatch and
  the dashed inset replaced by a divider rule, and a bezel** (the services
  cards' device) on the card and every node. ⚠ The bezel's inner chamfer leg
  is NOT `leg − inset`: a 45° cut offset inward by `d` moves its diagonal by
  `d√2`.
- **`MODEL` letters the verbs (`m[1]`), not the lane** — the tier is generic
  by law and cannot be made concrete by naming the model. **`AGENT` may not be
  a codename**: on the tools row a codename sits beside a screenshot that
  explains it; on the map it sits alone in a cell. A codename is provenance,
  this field is an answer.

Everything below is the U2–U9 record. Read it for the CONTENT rulings and the
traps; do not read its numbers as current.

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
- **THREE QUESTION NODES — RE-SLOTTED IN U9 (owner, 2026-08-11), GEOMETRY
  UNTOUCHED.** WHAT RUNS IT west (SKILL/MODEL) · WHAT IT CAN REACH east
  (**KNOWLEDGE GRAPH/CONNECTORS**) · **WHERE IT RUNS** south
  (**AGENT/INTERFACE**), which REPLACES WHAT IT INHERITS. Not one constant
  moved — same crop, inset chain, `SUB_H` and `CORE_RECT`; only what each
  node answers. The question headers are BACK by the owner's own mockup (U2
  supersedes this ADR's "no question headers"); k-labels at fs 10
  `--pda-txt2`; material grounds: encoded green hatch on the SKILL card
  (BELOW the value's line box — the first cut ran it through the
  descenders), the graph's dashed BLUE inset now on the KNOWLEDGE GRAPH card
  (`--pda-gph`/`--pda-gph-line`, light overrides in theme.css — the city's
  adjacent-domain blue), everything else plain.
  ⚠ **TWO SLOTS WERE WRONG, and this is a correction rather than a restyle:**
  a graph is QUERIED through a connector on request (reached, not
  inherited), and an interface is where a PERSON MEETS the work (not
  something the work reaches). The graph LEADS its node and the connector
  follows — the graph is what the stream reaches FOR, the connector the wire
  it reaches THROUGH.
  ⚠ **CONTEXT NOW LETTERS NOWHERE ON THIS READING.** It is one of the
  owner's own five configuration fields; with the readout deleted (U3),
  dropping WHAT IT INHERITS leaves it in the record and off the drawing. It
  stays on `PdaAnswers` because the city's unit sheet and the config lab's
  four archetypes still draw it. Named on purpose, so it is a decision
  rather than a loss nobody notices.
  ⚠ **GREEN IS DOWN TO ONE BUNDLE** — the Skill's. Both base conductors went
  amber with the re-slot: an agent and an interface are not encoded material,
  so green there would claim provenance for a runtime.
- ⚠ **`CaseMapConfiguration.a` IS THE AGENT, A SINGLE STRING** (U9), while
  every neighbour is a `[name, note]` pair — U7 is what a spare half costs.
  ⚠ **THE FALLBACK MAY NOT BE A PRODUCT.** `cases-registry`'s
  `MODEL_FAMILIES` includes `claude`, and the map's envelope is stricter
  than the casefile's by design: the LANE (`m`) is the one place model class
  is answered, generically. So the non-tool vocabulary is run MODE —
  `Chat assistant` · `Scheduled agent` · `Editor plugin` · `Coding agent`.
  ⚠ **AND IT MAY NOT BE A CODENAME EITHER (owner, 2026-08-11).** The field
  briefly carried `Mímir` and `Vesper` — publishable, since the tools row of
  this same casefile prints them — and the verdict on seeing them on the MAP
  was that _"no external-facing party knows what Mímir is"_. That is the
  distinction: on the tools row a codename sits beside a screenshot and a
  walkthrough that explain it; on the map it sits alone in a cell. **A
  codename is PROVENANCE; this field has to be an ANSWER.** The shipped
  tools' own public tab labels are what they are called here —
  `Briefing agent` · `Image + video suite`. The registry test scans `cfg.a`:
  it is the field most likely to name a vendor, because the honest answer to
  "what runs it" often IS a product. ⚠ The mapping is still AUTHORED and
  unverified by the record, and **the two remaining tools map to no stream at
  all** (there is no localisation or studio-PM work among the 27).
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
  substrate bars (U2); the readout sentence (U3); in U4 the DRAW PER RUN
  meter with NEVER A PRICE, the `DRAWS ON n OF m` caption (with
  `substrateReach` / `drawnShapes` / `CONFIG_MAX_BARS`), the corner brackets,
  the pad clusters, the vias, the registration crosses, and the arrowed
  DECIDES-ALONE dimension with its pin ticks; and in U8 the top-left
  `THE CONFIGURATION` + designator (the rail station and the cartridge's own
  id, said twice). The board opens on the OWNER PLATE at y 72.
- ⚠ **THE VERTICAL CHAIN MOVES TOGETHER TOO (U8).** The base is pinned to
  the crop's floor and the plate to its ceiling, so lifting the plate alone
  opens a dead band in the middle. `SUB_H` is the board's BALLAST — every 10
  units there lifts the base 14 and the side nodes 20 — and the card's `y`
  is the third term. Re-check the ≤40-unit waste guard after moving any of
  the three. `pda-viewbox` asserts no such
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

**Seven quality-of-life refinements of READING 02, beside the shipped board**
— the EIGHTH, `seated`, WON and is on the landing (ADR-070 U10), so its local
copy is deleted and `shipped` mounts production. ⚠ The seven draw in the
PRE-U10 crop and at the round-one floor of 10: they are the record of a
finished round, not live candidates.
(owner, 2026-08-11): the board reads cramped, the panels can be smaller, the
type must be bigger, WHO OWNS IT belongs to the centrepiece, and the cable
stays. Contents and panels are settled — this is an INFORMATION-ARCHITECTURE
question, not a content one. **Nothing on the landing changed**; no ADR until
a direction wins (the BOARD-archetype precedent).

⚠ **THE FOUR ARCHETYPES ARE RETIRED** (die · chain · section · schematic).
They answered a different question — what SHAPE the drawing should be — and
the switchboard won it on 2026-08-09; ADR-070's own Left-open note said to
delete the losers rather than keep five. Their `variants.ts` helpers
(`hvh`/`vhv`/`bundleOffsets`/`hatchTicks`, `shapeSkills`/`shapeSymbols`/
`substrateCaption`/`chainNeighbours`/`neighbourLine`/`taps`) went with them.
Git history is the archive.

- ⚠ **THE COMPLAINT IS ARITHMETIC, AND IT IS NOT DENSITY.** A shipped answer
  sub-card is `SUB_H = 158` units holding an ink band of **51** — a key
  baseline at +26 and one value line at +62. That is **68 % dead space**, six
  times over: ~640 of the crop's 912 vertical units spent on nothing while the
  value letters at 11.5. "Cramped" is small type in oversized boxes.
- ⚠ **AND THE LADDER IS INVERTED.** The shipped question header letters at 14,
  LARGER than the answer at 11.5 — against ADR-069's own words, _"the question
  is chrome, the answer is the record"_. Every variant demotes the question
  and promotes the answer; that swap alone is most of the fix.
- ⚠ **BUT NOTHING LETTERS UNDER 12, AND 10 WAS THE MISTAKE (owner,
  2026-08-11).** The first round put the keys at 10 on the CP2077 tooltip's
  ~3× label:value ratio (`p2-045`'s `950` beside a tiny `ARMOR`). The ratio is
  real, but it was read off a panel rendered 1:1 — here 10 authoring units is
  **5.4px** at the binding preset and **8.3px** at 1920, under the 8.5px
  chrome floor ADR-063 already records as this surface's standing defect. The
  verdict on SKILL / MODEL / AGENT / KNOWLEDGE GRAPH was "utterly illegible",
  and it is arithmetic rather than taste. So the contrast is bought the other
  way round — the ANSWER comes down and the KEY comes up: **question 13 · key
  13 · value 15 (18 where a row is wide, 22 where it is alone) · owner 16**,
  with `FS_FLOOR = 12` asserted by `config-lab-fit`, not merely intended.
  **A label nobody can read is not a quiet label, it is an absent one** — the
  same finding ADR-070 U6 made about the seat's dashed line, one rung down.
  ⚠ Raising the key rung widens `DECIDES ALONE` to 138.6u, so every owner
  plate's right column went 118 → 145 and its left 300 → 280; the rail's
  outboard key column went 145 → 180 or `KNOWLEDGE GRAPH` ran off the board.
- ⚠ **`Cartridge` HARDCODES ITS BAR AT `fontSize="10"`, UNSCALED — `k` NEVER
  REACHES IT.** That single block is what holds every variant's minPx at 5.4
  no matter how big its card is; `seated` is the only one that escapes,
  because it passes an EMPTY `bar` (which is what suppresses the cartridge's
  native lane/autonomy row — omitting the prop prints `WIDE` twice, the defect
  that cost `fused` its third step) and draws its own block at 12. Result:
  **seated reads 6.5px / 10.0px against every other variant's 5.4 / 8.3**, and
  is the first drawing on this surface to clear the 8.5px floor. On promotion
  this wants a `barFs` prop on `Cartridge`; production passes nothing today,
  so adding one is additive.
- **The eight** (`variants.ts` + one file each): `shipped` mounts production;
  **tight** (the control — same seats and cables, only cell height and type
  move), **fused** (the seat welded to the card as one stepped object, the
  dashed authority line deleted), **bands** (three full-width rows, measure
  212 → 336 so every value letters on ONE line at 18, the cable a backplane
  down the gutter), **rail** (keys on an outboard rail, the answer alone at
  fs 22), **satellite** (no housings at all, a k 1.8 card and doglegged
  cables), **ledger** (one right-hand column of rows, spine doubling as the
  column rule), **grid** (2 × 3 modular, hairlines only, the centre rule IS
  the cable).
- ⚠ **THE WASTED MARGINS ARE A LETTERBOX, NOT PADDING — AND THE WIDTH IS
  FREE (owner, 2026-08-11: "we're not utilizing a lot of the real estate").**
  `meet` scales by the MINIMUM of the two box ratios; the production crop is
  PORTRAIT (828×912 = 0.908) and **every measured console field is LANDSCAPE**
  — 603×493 (1.223), 679×548 (1.239), 850×760 (1.118). So the fit is
  height-bound at all three and the drawing is letterboxed HORIZONTALLY by
  **26 % / 27 % / 19 %** of the field. Widening the crop costs NOTHING while
  it stays height-bound (the ceiling is 1020 at p1920, 1115 at p1280), so the
  meet — and every rendered type size — is unchanged. `seated` takes 828 →
  **1000** and spends the 172 free units on GUTTERS (26 → 60, so the cables
  are visible) and on the card. ⚠ This is a LAB crop: ADR-070 U4 made
  production portrait for a tall-window field of 839×958, which is not the
  shape of any of the three measured desktop consoles — **promotion has to
  re-check U4's case rather than assume it.**
- ⚠ **ONE INK, GOLD KEYS, NO MATERIAL TINTS (owner, same pass).** The first
  round tinted the Skill green and the graph blue (ADR-062's material
  grammar) and hatched/dash-inset their grounds. On the CITY that grammar had
  a legend's worth of context and applied to SHAPES; on six words in a row it
  reads as emphasis, and the diagonal ticks read as a texture bug. All
  answers now take one ink; the keys take **Tensor gold `--pda-ink`** — the
  4.5:1 rung of ADR-063 U2's ramp, NEVER `--gold` itself (the MARK rung,
  ~1.1:1 as small text on parchment). `--pda-ink` was declared in pda.css and
  consumed by nothing until now. The separation the hatch was making badly is
  a divider rule between the two cells.
- ⚠ **`MODEL` ANSWERS WITH THE VERBS, NOT THE LANE.** _"Model — everyday
  lane? What does everyday lane mean?"_ Nothing on the surface answers it,
  and nothing can: the lane is a GENERIC capability tier because the
  envelope forbids naming a model family, so the tier cannot be made concrete
  by naming the model. `m[1]` (`Generate / critique / revise`) is the
  concrete thing the record already holds. `PdaAnswers.laneVerbs` is
  additive — production's reading 02 still letters `laneRun`.
- ⚠ **`seated` DRAWS ITS OWN CARD (`SeatCard`) RATHER THAN MOUNTING
  `Cartridge`** (owner, 2026-08-11: the centre card is "very sloppy … the
  text at the bottom is hugging the bottom border"). `Cartridge` is
  PRODUCTION's glyph, shared with reading 01's grid of twenty, and its
  internal offsets are absolute multiples of `k`: at k 2 the title lands at
  `+184` and its bar block bottoms out **3 units** off the floor with a
  60-unit void above it. Fixing that inside `Cartridge` re-lays-out the other
  reading, so the lab draws its own. ⚠ **THE SILHOUETTE IS WHAT MUST NOT
  MOVE** — ADR-069's flight docks into this rect, so `SeatCard` keeps the box
  exactly `176×136 × k` with the same `14k` top-left chamfer; only the
  contents change. The state mark moves INTO the header row (it was floating
  in a band of its own), the vents are dropped, and every baseline is derived
  from the card's own top.
  ⚠ **AND THE CARD'S THREE STRINGS ARE DECLARED NOW.** While the card was
  `Cartridge`, its team code, stream id and title were lettered by a
  production glyph and the lab's `lettering()` never saw them — the fit guard
  was walking a drawing with three invisible labels in it. Any variant that
  mounts a production glyph inherits that blind spot.
- **THE BEZEL IS THE SERVICES CARDS' DEVICE, BROUGHT OVER** (owner: "a soft
  touch, like in our services cards, subtle extra borders around the frame").
  `ServicesCardRing` bakes its slab with a clear bezel margin plus a hairline
  on the silhouette; here it is a second chamfered outline inset inside the
  first, on the card and one step quieter on every node. ⚠ **THE INNER
  CHAMFER LEG IS NOT `leg − inset`** — a 45° cut offset inward by `d` moves
  its diagonal by `d√2` along the axes, so the naive value leaves the
  diagonal visibly closer to the outer edge than the straight runs are, which
  reads as a mistake rather than as a bezel.
- ⚠ **`seated` IS ROUND TWO, NOT A PEER OF THE FIRST SEVEN.** The owner picked
  `tight` and gave three notes on it (2026-08-11): the card should be the
  biggest object, WHERE IT RUNS should come closer, and the dashed authority
  hairline is "annoying" — the seat should read as integral. `seated` is
  `tight` with those applied: k 1.5 → **1.875** with the width chain
  re-derived (`24 | 199 | 26 | 330 | 26 | 199 | 24`), the base drop 264 → 130
  with margins derived rather than eyeballed, and the hairline replaced by a
  splayed chamfered **PYLON** drawn UNDER the cartridge. Judge it against
  `tight`, not against the spread.
  ⚠ **THE PYLON KEEPS ADR-070 U5's LAW RATHER THAN BREAKING IT.** The seat is
  AUTHORITY, not data, and may never be one of the nodes' bundles — but a
  dashed hairline was only ONE way to say that, and U6 already had to take it
  from `--pda-dim` to full green because it read as absent. So the
  distinction moves from WEIGHT to MATERIAL: **authority is structure, data
  is conductors.** Nothing flows down a pylon; it bears load, which is why it
  survives being drawn thick. ⚠ Mass is the point — the first cut (110→170
  over 60 units) rendered as a small dark tab, i.e. the hairline's failure in
  a new shape.
  ⚠ Two departures it documents rather than hides: the side cells take
  **pad 10, not 12** (a bigger subject leaves them 197 wide, and at pad 12
  `BUDGET + COMMITMENT FACTS` wraps to a sliced third line — padding is the
  cheapest of the three ways out, against shrinking the card or dropping the
  answer to fs 15), and the base cells are **232 against the sides' 197**,
  a deliberate exception to ADR-070 U4's one-size law: that law guards
  against a 640-wide base holding one short line, and this is the opposite
  case — matching 197 cost `CHAT + BRIEF TOOL` a wrap on a row with 340
  units of unused board either side.
- **ALL SEVEN USE THE PRODUCTION CROP** `36 48 828 912`, not the archetypes'
  1000×760 — the comparison is only worth making in the same box, and
  promotion is then a copy rather than a re-fit. ⚠ That RAISES THE FLOOR to
  **fs 10**: the binding preset's meet is 0.540, so the archetypes' 7.5 would
  render 4.05px against the capture gate's 4.3. `config-lab-fit` asserts 10.
- **`configKit.tsx` holds what all seven share** — the type ladder (`FS`),
  `groupsOf()` (the three questions and six answers, ONE source: a variant
  that re-types them has become a content fork), `Cell`/`Field`/`OwnerPlate`/
  `BarBlock`/`QLabel`, the spec emitters, and `Wire`. ⚠ `Ribbon` is
  module-private to `PdaConfiguration.tsx`, so the ribbon wrapper is the ~30
  lines every variant would otherwise re-write.
- ⚠ **THE BASELINE STEP IS 1.7 em, NOT THE 1.3 em LINE BOX**, and the capture
  gate is what proved it. `lineBox` is what a line OCCUPIES; stepping
  consecutive baselines by it makes the glyph boxes abut, and `getBBox`
  reports taller than 1.3 em — so the overlap walk flagged real collisions
  between the two wrapped lines of one value and of THE BAR. 1.7 is the house
  number: the shipped drawing steps values 20 at fs 11.5 (1.74×) and its bar
  17 at fs 10 (1.70×). Clearance math keeps `lineBox`; anything stacking
  baselines uses `step`.
- ⚠ **ONE REGISTRY MAP, NOT TWO TERNARY CHAINS.** The crop and the mount were
  separate hand-written chains each ending in a bare `else`, so an id
  registered but not added to both silently rendered the LAST variant.
  Survivable at five entries, a guaranteed mis-mount at eight — it is a
  `Record` keyed on `IclVariantId` now, so the compiler is the guard.
- ⚠ **THE PRESET VARS LIVE ON `.icl-stage`, NOT ON `.icl-arrival`.**
  `.icl-stage` is `width: var(--icl-w, 612px)` and the vars were declared on
  its CHILD, so the stage always resolved to the 612px fallback and the
  housing overflowed at p1440 (690) and p1920 (864) — **every still at those
  presets was cropped**, which is invisible to all six capture gates because
  they measure inside the console.
- ⚠ **A VARIANT MAY NOT REINTRODUCE A SAID-TWICE.** Withholding `Cartridge`'s
  `bar` prop un-hides its native lane/autonomy row, so `fused`'s first cut
  printed `WIDE` twice — once labelled `DECIDES ALONE` on the collar and once
  bare on the card. This surface has removed a console head, a foot and a
  designator for exactly that (ADR-063 U1, ADR-070 U8). Caught by eye on a
  capture, not by a gate.
- ⚠ **`Cartridge`'s `bar` block hardcodes `fontSize="10"` UNSCALED** — `k`
  never reaches it. A variant that wants the bar larger must draw it itself.
- ⚠ **THE LAB PAGE IS MECHANICALLY UNGUARDED** — the registry test walks
  `CASES`/`PROJECT_CASES` objects, never component code. So every variant
  declares everything it letters via a pure `lettering()`, and
  `tests/lib/config-lab-fit.test.ts` walks those declarations for ALL 27
  works × 7 variants: fit vs measure, the WORD walk (`wrapLines` breaks on
  spaces only, so the longest word binds however well the value wraps), the
  cap walk (a line past the cap is declared at measure 0 so a sliced tail
  fails loudly), the fs floor, and the registry's own envelope regexes.
  ⚠ **A VARIANT ABSENT FROM THE TEST'S `VARIANTS` TUPLE IS UNGUARDED ON BOTH
  HALVES.** The guard earned its keep on its first run: `BUDGET + COMMITMENT
FACTS` (W-049) wrapped to three lines in Satellite's 170-wide pod and the
  third was being sliced silently — the pods went to 200 and the card to
  k 1.8, so the answers kept their size.
- **`scripts/capture-config-lab.mjs`** runs the matrix (8 variants × 5
  subjects × 2 themes at p1280 + a p1920 sweep), waits on the readout's
  `data-*` mirror (never a sleep), and gates on 0 collisions / 0 clipped /
  minPx ≥ 4.3 / no overflow / no page errors. ⚠ `reducedMotion` must stay
  `"no-preference"` — PRM trips the console unwrap pair and hides the
  console entirely. `--measure` scrolls the REAL landing into the dwell
  (`.home-v2-stage` first — the corridor is lazy and inflates layout late)
  and prints the production `.fl-con` boxes; the console frame is shared
  chrome, so whichever row the browse band selected, the box is the same.
- **Person-led stays honest on every variant**: `led = !pda.configured` drives
  the fallback answers and the crossed gauge — the negative space is a
  reading. Capture `W-040` in every run; a re-seated layout breaks there
  first.
- ⚠ **TWO THINGS NO GATE CAN SEE**, both hand-checked on capture:
  **cable-versus-box** collisions (every guard measures TEXT) and whether the
  owner reads as part of the centrepiece, which is the brief.

## The SUBSTRATE lab (look-dev, `/test/intelligence-substrate-lab`)

**Three higher-level hierarchy drawings for READING 03, beside the shipped
crossing** (2026-08-11, owner: the five shapes at the bottom _"don't have to
look like the configuration cards — this is really more of a pattern"_).
Nothing on the landing changed; no ADR until a direction wins (the
BOARD-archetype and config-lab precedent).

- ⚠ **THE DIAGNOSIS IS THAT A PATTERN IS DRAWN AS A MODULE.** Production
  letters its five shapes with `Module` — the same notched-plate glyph as the
  department `Plate` above it and the same family as reading 02's cards. On
  this surface that silhouette means A THING THAT RUNS. Same shape reads as
  same kind, and these are not the same kind.
- ⚠ **AND NOTHING ABOUT THE HIERARCHY IS STRUCTURAL.** All five shapes are the
  same 148×50 box while they hold 5 → 14 Skills and are drawn on by 3 → 8
  departments; the magnitude exists only as a 9px text line. The thirty
  crossing beziers are the rest of it — a reader has to TRACE A CURVE to
  answer "who draws on Judgment?", the same failure that retired the
  isometric city. The hierarchy on record is **Skill → pattern → reuse**, and
  two of those three are currently text.
- **The three** (`variants.ts` + one file each): **strata** (a pattern is a
  SEAM — thickness is mass, eight department buses run straight down through
  the stack, a tap is a cell where a bus crosses a seam; the brief's own
  "below grade runs the shared substrate" taken literally), **table** (stop
  drawing the relation and tabulate it; the mass survives as a bar in the row
  header), **tree** (containment — one substrate frame around five patterns,
  departments REPEATED as codes inside each instead of wired as edges).
- ⚠ **`tree` IS AT ROUND TWO, and the owner picked it** (2026-08-11). Round
  one drew a trunk with five branches; three things were wrong and all three
  are worth remembering because they generalise:
  - **The branches carried no information.** Every node hung off the same
    single root, and there is no case where a pattern is NOT in the
    substrate — so five lines said nothing five times. **Nesting is the same
    statement with no ink.**
  - **The node bodies were empty.** Height was proportional to Skills and the
    space under the gloss was blank hatch — the exact hole ADR-070 U14 had
    just removed from reading 02. The height is now EXACTLY its contents: a
    core sample of ONE PIP PER SKILL down the block's left edge, and the
    block is `28 + skills × 8.9` tall because that is how tall its pips are.
    A proportion you can also count.
  - **The left third was dead**, holding a floating trunk plate and a spine.
    The total is a header now and the blocks take the full width, which is
    what gives the 38-character gloss 528 units instead of 352.
- ⚠ **THE LAB'S CROP IS STATIC**, so at p1920 the drawing letterboxes ~65px
  vertically. That is not a defect in the drawing — it is exactly what
  ADR-070 U12 fixed for reading 02, and sharing 02's crop WIDTH is what makes
  inheriting `configLayout`/`configExt` a copy rather than a re-fit.
- ⚠ **`gloss` LETTERS NOWHERE IN PRODUCTION**, and all three directions give
  it a home — the same class of orphan as `cfg.p[1]` before ADR-070 U7. A
  148-wide module could never hold "HOW THE ORGANISATION SOUNDS IN CONTEXT"
  (38 chars = 336u at the floor); a full-width seam or row header holds it on
  one line.
- **One crop for all three, and it is reading 02's WIDTH** (`932 × 762`). The
  comparison is only worth making in the same box, and sharing 932 means a
  promoted winner inherits ADR-070 U12's elastic treatment unchanged — the
  crop's width never moves, so `meet` is `field.w / 932` and the height can be
  measured from the field for free. Same `meet`, so the type ladder is
  reading 02's and the floor is the same **12**.
- **The harness is the CONFIGURATION lab's, imported not copied** —
  `useFitReadout` and the `.icl*` chrome. Two copies of a measurement is how
  one lab starts passing what the other would fail. Only the drawings and the
  record slice are new. ⚠ The shell must pass `selectWorks(...)` into
  `crossing(...)`: with `[]` every department reports **zero** streams, which
  the config lab can afford because its drawing never asks and this one
  letters on every head.
- **`scripts/capture-substrate-lab.mjs`** runs 4 variants × 2 themes × 2
  presets and gates on 0 collisions / 0 clipped / minPx ≥ 4.3 / no overflow /
  no page errors. ⚠ `shipped` is INSIDE the gates on purpose — a lab whose
  gates skip the baseline cannot tell you whether a direction is better or
  merely differently broken.
- Measured at p1280 / p1920: shipped 31 labels at **7.0 / 9.8px**; all three
  directions **7.8 / 10.9px** while carrying MORE (strata 37, table 38, tree
  52 labels).

⚠ **AND THE LAB FOUND A LIVE DEFECT IN PRODUCTION'S READING 03.**
`ViewSubstrate` letters `${s.skills} SKILLS · ${s.teams} TEAMS`, and for
PATTERN — which all eight departments draw on — that renders **`8 TEAMS`**.
That is the exact phrase `cases-registry`'s district guard names as its
failure mode: 8 is the DEPARTMENT count, while 22 teams BRIEFED and 14 teams
USING THE LAYER are different units and different sets. **It survives only
because that guard does `JSON.stringify` over the CONTENT objects and this
string is composed at render time in a component**, where no scanner reaches
it — the same blind spot ADR-070 U10 found when the card's three strings were
lettered by a shared glyph. No lab variant letters the word at all (the tap
marks carry the count, which is the hierarchy argument anyway) and
`substrate-lab-fit` fails on `/\bteams?\b/i`. (Superseded 2026-08-13 by
U16's pattern cards, which letter the gloss instead of teams.)

⚠ **ROUND FOUR IS REJECTED (2026-08-14), and the record survives as a
warning.** The three variants `backplane` / `bus` / `cutaway` anchored
reading 03 on the R4 CARTRIDGE at `layout.core` — the selected work stays,
five substrate bays fan around it, `02 ↔ 03` becomes a flight-identity.
Built and shot cleanly through the lab's gates; promoted to production;
rolled back the same day. **On THIS surface the cartridge silhouette is
a proper noun that means WORKSTREAM.** Reading 02 uses it for the seat
card; the ADR-069 flight carries it between 01 and 02 because those two
readings ARE about that one work. Reading 03 is scoped one step wider —
the shared layer beneath every workstream — and its drawing may not
depend on a selected work. See ADR-070 U17.

⚠ **ROUND FIVE IS THE CLUSTER-AS-BODY FAMILY** (2026-08-15). Six
estate-scoped directions where each pattern is a physical body of like
objects whose depth IS the count, with one exemplar lettered:

- `hand` — fanned deck of plates from a root pivot
- `piles` — offset-stacked slabs at the crop's floor
- `constellation` — five nodes ring a central total, wire trunks braid
- `loom` — five chips braid one wire per skill into one SUBSTRATE chip
- `leaves` — comb of hairline leaves on a fore-edge slab
- `roots` — five trunks rise from one shared bus, branches per skill

Shared rules: one mark per encoded Skill; flagship = green accent and
lettered `shortTitle`; labels HORIZONTAL (never rotated); no cartridge,
no selected work, no team names on the drawing; TR+BL chamfers. Every
direction exports `<name>Lettering()` AND `<name>MarkCount()`, and
`substrate-lab-fit` walks both — a fan that dropped a plate would fail
the mark-count guard before it shipped. See ADR-070 U18.

⚠ **ROUND SIX IS THE DEFINITION-LEADS FAMILY** (2026-08-15, owner). Five
directions built on the owner's own reference — Aether's `/claude-adoption`
substrate donut, where each wedge carries a **name, a count and a one-line
definition**:

- `wheel` — the reference ported; angle is the count, rim ticks are the
  Skills, five label blocks in the corners the circle leaves
- `mosaic` — the crop tiled with NO gutters, area is the count
- `gate` — marks arrive at a chamfered threshold plate lettering the method
- `runs` — five ranked rows, a run of cells across each
- `grade` — the estate unsorted above a grade line, five strata by depth below
- `facet` — the wheel cut straight, labels INSIDE the wedges (ADR-070 U20)

⚠ **`facet` CHANGES WHAT THE DRAWING ENCODES, and judge it against `wheel`
alone.** The owner's notes on 21 were: labels inside, less round, a bit
asymmetrical. **Angle-as-count and inside labels are arithmetically
incompatible** — `STAKEHOLDER` is 149.6u at fs 20 and its 36° wedge only
reaches that width where ~20 units of depth remain against a block needing
~105. So the count SPLITS: `θ ∝ √n`, radius solved so the quad's area
`½·sin(θ)·(r² − R0²)` is exactly the count.

- ⚠ **THE SPLIT IS WHAT MAKES IT A ROSETTE INSTEAD OF AN ASTERISK.** All the
  count in the radius seated every label and read as five spikes round a hub —
  separate points, not one thing divided, with the crop's bottom empty. Half in
  each term gives 50°–84° angles and 312–440 radii: irregular, and still one
  figure. `SPLIT` is the one dial; the area identity holds at every value.
- ⚠ **THE AREA IS THE QUAD'S, NEVER THE SECTOR'S.** `½·θ·r²` is right only for
  a wedge running to a point; these run to a chord at `R0`, and the sector
  formula drifted the areas ~1.5 % apart. Guarding `r² − R0²` alone was
  likewise correct while angles were equal and silently wrong once they varied.
- ⚠ **SEATING IS SOLVED AND SEPARATELY GUARDED.** An axis-aligned block in a
  rotated quad needs ~`(W+H)/√2` of radial thickness, so diagonal wedges fail
  where screen-aligned ones do not. `seatBlock` walks the wedge's bbox trying
  gloss wraps widest-to-narrowest and returns **null** rather than falling
  back; `facetSeats` asserts all five. Nothing else asks this — a block drifted
  through a rim chord letters cleanly, collides with nothing and sits inside
  the crop.
- ⚠ **A GROUP `transform` BREAKS THE CLIP GATE.** `getBBox()` reports a node's
  box in its OWN user space, so a `translate(...)` around the drawing made all
  27 labels report clipped on a drawing that clips none. The derived origin is
  BAKED into every drawn coordinate; geometry and seating stay in shape space
  with the hub at the origin, which is what lets the composition centre itself
  from its own bbox (U14's law).
- ⚠ Two traps worth carrying: a **4-unit search stride** stepped clean over
  Voice's few-unit feasible band and reported "cannot seat" for a block that
  fits — granularity is arithmetic here, not a perf knob; and **`FIT_EPS`
  belongs on the DECLARED measure, never the seating width** (the block's
  measure IS its widest line, so the guard's own recomputation lands 3e-14 the
  other side — and Voice clears its wedge by under half a unit).
- ⚠ **`facet` LETTERS NO COUNT**, alone in round six: the wedge's size is the
  count and the rim ticks are there to be tallied. If the numeral returns, the
  ticks come off — not both.

⚠ **THE DIAGNOSIS IS MECHANICAL, AND IT INDICTS THE INCUMBENT'S PRIMITIVE.**
Production's reading 03 is **five `housing()` cards in a row, which is reading
01's grid at n = 5** — the owner's standing "it may not look like the work tab"
is broken before a string is placed. And its gloss, which is the ANSWER to what
a substrate is, sits in a 78-unit foot at the type floor under an empty field
and fourteen Skill labels. Round five then over-corrected: mass became the
whole subject and the definitions vanished, so `constellation` says LESS than
the drawing it replaced while using ~40 % of the panel.
**THE LAW: the definition leads, mass modifies it, the Skills are texture** —
no card row, no fan/pile/comb/hub, every direction fills the crop.

- ⚠ **THE RECORD NAMES ITS EVAL METHOD NOW.** `CaseMapShape.evalMethod`
  (≤24 chars, MEASURED — 24 × 8.88u at fs 12 / .14 = 213u, the widest key
  column any direction affords). The gloss says what the shape MEANS, this says
  what "good" is CHECKED against — the owner's own word for a substrate, and
  the thing that makes one inheritable. ⚠ **It is inside `cases-registry`'s
  scanned blob**, because the honest answer to "how is this checked" is often a
  product; and it is pinned **never equal to its own gloss**, since a method
  that restates the definition has deleted one of the two.
- **`roundSix.tsx` derives the five facts ONCE** — name · count · gloss ·
  evalMethod · flagship — and every direction letters the same set through
  `patternSpecs(record, measures)`. `measures` may be a FUNCTION, because
  mosaic's blocks and grade's bands give each pattern a different column, and
  one shared measure would check the narrowest against the widest budget.
- ⚠ **THREE DIRECTIONS ENCODE MASS CONTINUOUSLY and `markCount` cannot reach
  them.** `MASS_VARIANTS` divides angle / area / depth by the Skill count and
  asserts one shared unit — it fails the moment a floor, a clamp or a
  hand-tuned constant appears. ⚠ `mosaic` and `grade` export NO `markCount`
  deliberately: mosaic draws no per-Skill mark, and grade's tick run is
  UNGROUPED, so a per-pattern count would assert a grouping neither makes.
- ⚠ **A GLOSS THAT WRAPPED PAST ITS CAP DECLARES ITS DROPPED TAIL AT MEASURE 0.** `wrapLines` slices quietly, so the tail vanishes from the drawing AND
  from the spec list and every per-line assertion still passes. This is what
  caught `gate` slicing `CONTEXT` off Voice's definition.
- ⚠ **THE FLAGSHIP LEADS ITS RUN (`RoundSixPattern.ordered`).** The fixture's
  order is alphabetical by team, so left alone the green mark lands wherever
  the first encode happens to sit — the drawing then says "the fourth one is
  special" where the record says "this one came first and the rest followed".
- ⚠ **THE FLAGSHIP TAKES A GREEN MARK AND KEEPS ITS INK.** Lettering it in
  `--pda-grn-ink` against siblings at `--pda-txt` makes the one thing the
  drawing points at the DIMMEST thing on it — production learned this on the
  plate stack and three round-five directions re-introduced it.

⚠ **AND THE CAPTURE HARNESS WAS GATING AGAINST THE WRONG DRAWING**
(fixed 2026-08-15; it predates round six). `capture-substrate-lab` waited on
`location.search` — **which the script itself sets** — plus `data-minpx > 0`,
and both are true from the first paint, before the page adopts `?v=`, with the
DEFAULT variant's own measurement satisfying the numeric half. Fast drawings
win that race; `mosaic` and `grade` paint a particle field, lose it, and were
gated against the shipped baseline's **70 labels at another preset's scale**,
reported green. The readout stamps the identity it measured (`data-stamp` =
`variant|theme|preset`) in the same `setState` as the numbers and the script
waits on THAT. `useConfigFitReadout`'s `stamp` argument is optional, so the
config lab is untouched. **A wait condition a script can satisfy by itself is
not a wait condition** — and the same shape of hole is worth checking in any
other capture gate that waits on a number rather than on an identity.

⚠ **ROUND SEVEN IS THE INSTRUMENT REGISTER, AND IT DIAGNOSES ALL SIX ROUNDS
BEFORE IT** (2026-08-15, owner: the substrate _"just feels completely out of
place"_). **Readings 01 and 02 are drawn as PARTS OF A DEVICE** — 01 a field of
cartridges, 02 a circuit board with hatched ribbon lanes, both panels from the
Cyberpunk industrial-monitor references. **Every substrate direction through
round six is a CHART pasted into that machine** — table, tree, seams, pin grid,
fans, piles, hub, comb, roots, donut, mosaic, ranked rows, strata, straight-edged
donut. Chamfer a pie chart and it is still a pie chart: **proportion was never
the problem**, which is why adjusting it never landed. ⚠ **And the record's own
words say what the substrate is in a machine** — teams DRAW ON it, work is a
DRAW, the shapes are a RESERVOIR, the layer is BELOW GRADE, the reading is
EXTRACTION. **THE LAW: draw the substrate as the machine's SUPPLY SIDE.** Squint
test: does it look like a panel off the same instrument as 01 and 02?

- `tanks` — five vessels on one manifold; fill height is the count
- `pinbank` — ONE housing, five banks, 47 pins; bank extent is the count
- `stack` — one housing, five layers in section; thickness is the count

- ⚠ **ONE NUMBER SHAPES EVERY LAYOUT HERE.** `KNOWN-FAILURE FIXTURES` measures
  195.4u at fs 12 / .14 and a five-across column of this crop is ~176 — **the
  eval method does not fit a five-across layout at any size this surface
  allows.** That is what drove round six into corner blocks and full-width
  rows; two of round seven call out to a ledger and the third abandons columns.
- ⚠ **`pinbank` IS THE ONLY DIRECTION IN SEVEN ROUNDS WHERE THE SUBSTRATE IS
  ONE OBJECT.** Every predecessor drew five things then argued they were one
  layer. It letters no count: the pins are the number.
- **All three share ONE graduation pitch** (one mark per encoded Skill at one
  unit across all five) — what makes each a single instrument rather than five
  differently-scaled pictures.
- ⚠ **THE DIAMOND LATTICE WAS DESIGNED AND REJECTED ON ARITHMETIC.** Five
  diamonds sized by area with the name INSIDE fit (`STAKEHOLDER` needs a
  half-diagonal of 87.8 → a touching row of the three heaviest is 801 against
  880). The attached TAB cannot be placed: a lattice means edge-touching, and
  two touching diamonds leave a clear gap of **ZERO** at their waist. Tabs in a
  column make it a third marks-plus-ledger; tabs at the foot make it a card
  grid. `stack` replaced it — recorded because the diamonds themselves are
  viable and will be proposed again.
- ⚠ **A LAYER'S TEXT CENTRES IN ITS LAYER.** Top-anchored, `stack`'s heaviest
  layer — the one whose thickness is the point — carried ~130 units of void
  under four lines: ADR-070 U14's hole in a new place.
- ⚠ **`tanks`' HEADROOM IS THE GAUGE, NOT A CLAIM.** All five vessels share one
  scale whose maximum is the heaviest pattern; the empty part is the axis, not
  unencoded capacity. Named because an implied datum is exactly what this
  surface bans.

⚠ **ROUND EIGHT IS THE VESSEL RIG — ONE COMPOSITION, THREE SILHOUETTES**
(`vesselRig.tsx`; `flasks` · `cells` · `vats`). The owner kept `tanks` and gave
it two notes:

- **Make it as visual as the FIELD CARDS.** Direction 6's argument was that
  each pattern renders its OWN TEST; `tanks` had shrunk that to a faint texture
  in a small fill box. The field is the CONTENTS now — clipped to the vessel's
  own outline, at the field cards' weight.
- ⚠ **THE SILHOUETTE MAY NOT BE THE WORK'S.** _"Skills are built on workflows,
  but they're different — that's why I can't have them be the same type of
  shape, like the square ones."_ **A chamfered rectangle on this surface IS A
  CARTRIDGE** (reading 01 is twenty; reading 02 seats one), so a substrate in
  that outline claims to be a workstream — round four's error in a new place.
  **A silhouette here is a proper noun.** All three outlines are straight-edged
  and none is a rectangle: necked flask · waisted hexagon · tapered vat.

- ⚠ **THE VESSEL IS FULL AND ITS HEIGHT IS THE COUNT.** `tanks` drew five equal
  vessels at different LEVELS, which reads as capacity — a quantity this record
  does not publish (U21 named it and let it stand as a shared gauge). Sizing
  the vessel removes the implication AND gives the field the whole body.
- ⚠ **THE VESSEL'S WIDTH IS BOUGHT FROM THE LEDGER.** At 76 wide the fields had
  no character (a field card is ~120); taking the ledger 366 → 260 wraps every
  definition to two lines and buys 20 units per store. The field is the subject
  and a wrapped sentence costs the reading nothing.
- ⚠ **NO TEXT INSIDE A TRANSLATED GROUP.** Each vessel draws in its own local
  space so one path serves as outline, ground AND clip; `getBBox` reports in
  that space, so a label there would defeat the capture's clip gate (the
  `facet` lesson). Every string is absolute, in the ledger.
- **One rig, three outlines** is `FormCard`'s discipline (density vs field):
  composition, ledger, manifold, graduation and contents are identical and only
  `vesselPath` changes, so the comparison is about the shape and nothing else.
  ⚠ All three are still listed separately in every guard tuple — a silhouette
  that grows its own strings later must be walked, not silently trusted.

⚠ **ROUND NINE IS `33 · inlay` — THE OWNER'S PICK, GIVEN ITS MATERIAL AND ITS
COPY CUT** (2026-08-16, two notes on 22 `mosaic`: give it the texture of 8
`gallery` or 11 `cards`; then make the copy SUPER SIMPLE — title up, one
concise paragraph beneath).

- ⚠ **THE PARTITION IS IMPORTED FROM `VariantMosaic`, NOT RE-TYPED**
  (`mosaicBlocks`), so the two directions cannot drift into publishing
  different areas for one record. **`VariantInlay`'s `BOX` must stay equal to
  mosaic's** — the blocks come from there, and a frame that disagrees offsets
  every region from its own ground. The two files move together.
- **It letters THREE facts, not round six's five**, and it letters its OWN
  specs rather than `patternSpecs`: `gloss`, `evalMethod` and the flagship's
  NAME are no longer drawn. Calling the shared five-fact emitter would declare
  two strings the drawing does not paint — a guard walking absent text, which
  passes. Floor is 20 in `substrate-lab-fit`, not 25. ⚠ Dropping `evalMethod`
  reverses ADR-070 U19 **on this drawing only**; the record keeps the field.
- ⚠ **THE PARAGRAPHS ARE LAB COPY, and promotion has a cost.** `CaseMapShape`'s
  `gloss` is a definitional FRAGMENT sized for a 148-unit module, not a
  sentence. If this wins, the paragraphs become a record field exactly as
  `evalMethod` did — and enter `cases-registry`'s scan with it.
- ⚠ **THE FLAGSHIP SURVIVES AS A MARK, NOT A NAME** — its tick runs longer and
  takes green. Round six's rule (the accent carries the signal, the label stays
  at full ink) is satisfied by dropping the label, never by dimming it.
- ⚠ **DENSITY IS PER UNIT AREA.** The particle painters emit a FIXED count
  scaled by `k`, so at one shared `k` the largest field (~123,000u) and the
  smallest (~15,000u) get the same 300 marks and the SMALLEST region reads as
  the densest material — encoding the count a third time, backwards. `k` is the
  field's own area against a reference, clamped.
- ⚠ **THE DIVISION IS A GROUT, AND THE HAIRLINES ARE DELETED.** A 1-unit
  internal rule paints 0.65 device px at the binding meet and the browser pays
  the rest in alpha — the same arithmetic as U16's stack spine and foot
  separator, and the reason the owner could not find a block's edges. The
  regions paint on a rect inset by half a 4-unit channel, so the PLATE shows
  between two materials. ⚠ **A grout is not a gutter**: a gutter is empty space
  between OBJECTS and is what makes five regions read as five cards (mosaic
  bans it at 20u and this inherits the ban); a grout belongs to the plate. **No
  rule goes back inside the channel** — a line in its own channel frames a card.

⚠ **AND A `Field` PASS-THROUGH ONCE HUNG FOUR DRAWINGS** (fixed 2026-08-16).
`roundSix`'s `Field` defaulted its `p` to **0** and forwarded it explicitly;
`p` is `validation`'s lattice PITCH and a **loop step** in that painter, and a
destructuring default only fires on `undefined`. `mosaic` · `grade` · `tanks` ·
`stack` never mounted — the hang is in render, so React never commits and there
is nothing on screen to say so, and the shell's own `?v=` means a refresh
re-enters it. Production was never affected (`PdaSubstrate` passes `p={14}`).
`validation` clamps a non-positive pitch now; the pass-through has no default.
⚠ **`substrate-lab-fit` was green throughout** — it walks declarations and never
mounts anything — and `capture-substrate-lab`'s default `--v` list is still
**round one's seven**, so later directions are ungated unless named explicitly.

⚠ **THREE FIT DEFECTS CAUGHT THE HOUR ROUND FIVE WAS WRITTEN**, all worth
carrying:

- `hand`'s flagship label ("Founder TOV", 11 chars) ran past a naive
  `PLATE_W + 20` measure. The label is text-anchored MIDDLE at the fan's
  centre column, so it extends past the 48u plate on both sides — its
  measure is the LABEL COLUMN (120u), not the plate.
- `leaves` collided its flagship label with the count numeral where the
  flagship is the FIRST skill in the pattern (Judgment, Pattern). The
  leftmost leaf's label ran back into the count column. Fixed by inset
  60u each side of the comb (was 8u), which keeps the leftmost label
  inside the comb.
- `roots`'s flagship label on rightmost trunks clipped the crop's right
  edge. Fixed by forcing the flagship's side to face the crop's centre:
  left half → flagship RIGHT, right half → flagship LEFT. Non-flagship
  branches still alternate.

## The HUD panel lab (look-dev, `/test/hud-panel-lab`)

**Six directions on the casefile and the era stage, judged inside the REAL
frame** (2026-09-02, owner: the panels "just seem to be floating … they don't
really feel integrated as part of a HUD or interface"). Nothing on the landing
changed; no ADR until a direction wins (the BOARD-archetype / config-lab
precedent). Full read, the reference distillations and the owner questions:
[`docs/design/hud-panel-lab/README.md`](../../docs/design/hud-panel-lab/README.md).

- ⚠ **THE DIAGNOSIS IS A LINE LADDER, AND IT IS MEASURABLE.** The control
  paints **8 gold structure lines** on this surface — the register's five
  hairlines at gold .12/.24, the directory's row rule at gold .13 dotted, the
  column split at dawn-alt .24 dotted — against a frame whose own track is
  **2px at dawn .55**. A hue swap AND a 4x alpha gap between a panel and the
  thing it is meant to belong to. `console.css`'s ruling already says which
  way it goes ("the panel's own edge is dawn, not gold … the rail's dividers
  keep the gold hairlines, because those are marks ON the machine rather than
  its outline"); this surface never got it. Every direction past `v0` paints 0
  and the capture prints the count.
- ⚠ **THE LAB MOUNTS PRODUCTION LEAVES, AND `v0` IS `ServicesCasefile`
  ITSELF.** The directions re-seat `ClientTabs`, `TrackProofRegister`,
  `Directory` and `TrackPanel` on the SAME `.fl-case` root — every token they
  read (the rail-box mirror, `--fl-t6`/`--fl-t11`, the modular scale, the
  reticle gradients) is declared on that class, so a new root would mean
  re-declaring thirty of them to change nothing.
- ⚠ **A BAND-WIDTH HOUSING CANNOT CLEAR THE RIGHT RAIL'S TELEMETRY.** SECTOR
  reaches x 1129 at 1280x720 against a band edge of 1150.9, so a slab with a
  GROUND paints under it. The band is symmetric by law (ADR-048), so the
  clearance comes off both sides and the whole direction moves in 28px a
  side — the housing's real cost, stated, rather than a right edge quietly
  tucked in. Production's own console already overlaps there with line work,
  which is why the gate fails a painted GROUND and reports a border.
- ⚠ **THE HOUSING IS THE SERVICES PLATE'S MATERIAL, AND A PADDED GRADIENT
  SHELL NEEDS AN OPAQUE BODY.** `v2` carries the plate's 168deg
  gold → dawn → gold lip over its glass (dawn wash, gold corner bloom,
  scanline, blur) at `rgba(void-deep, 0.42)` — half `--con-ground`, so a tint
  rather than a pane (owner, 2026-09-02). ⚠ `.svc-plate__sh` gets away with
  `padding: 1px` + a gradient behind an inset body ONLY because that body is
  72–58% opaque; at 0.42 the shell read straight through and lit the panel
  warm-grey (30,25,17 against the void's 10,9,8). **The giveaway was that
  `?mat=line`, which paints no ground at all, produced the SAME lightening** —
  so the ground was never the cause. The lip is a clipped RING now (outer
  chamfered contour clockwise, inner counter-clockwise; nonzero winding makes
  the middle a hole), which also puts back the edge a `clip-path` had removed:
  **a clip cuts a border, it never strokes one**, so the earlier flat-border
  housing had no line on either diagonal.
- ⚠ **TWO OF THE PLATE'S VALUES DO NOT SURVIVE THE CHANGE OF SHAPE.** Its
  bloom is `radial-gradient(130% 70% at 84% -8%)` — percentages of a 420x680
  CARD, ~550px, a corner catching light; the same fractions on an 1150x600
  housing are 1495px and light the whole quadrant, so the bloom is stated in
  PIXELS. And `brightness(1.08)` belongs to the plate's OPEN state, tuned for a
  small card over a bright WebGL bed; over a band of void it turns the ground
  grey. The seed body's plain `blur()` is the one that generalises.
- ⚠ **THE GOLD LIP CONTRADICTS `console.css`'s "the panel's own edge is DAWN,
  not gold", deliberately.** The services card's own edge IS gold, so the house
  has two precedents pointing opposite ways; the difference is that a console
  is a SCREEN you look into and a card is a machined SLAB you look at, and this
  is the device the screen is set into. Owner instruction; the README asks for
  the scope. ⚠ The structure INSIDE stays dawn either way and the ledger still
  asserts zero gold on the register's rules, the directory's rule, the column
  seam and the era heads.
- ⚠ **A HEADER ROW MAY NOT HAVE A CENTRE HERE.** The tab strip seats flush on
  the rail's top line and IS that band's left run; a centre slot printed
  straight through the client's own name. The header stops at the column split
  besides, because `ConsoleRail` occupies the same band on the right and is
  the FIELD's header. Same class of collision put the field's corner labels
  through WORK / CONFIGURATION / SUBSTRATE — **two labels overlapping is the
  check containment never makes**, and both were found by looking at a still
  with every geometry gate green.
- ⚠ **THE REGISTER AND THE DIRECTORY HAVE ~4px OF SLACK**, so neither grows a
  head row at the binding viewport. The brief's head sits in the
  `clamp(16px, 2.6svh, 38px)` of air that already exists above
  `--fl-body-top`; the register's appears only above 1070h, out of the
  `--fl-proof-top-gap` that is pure air there.
  ⚠ **THE LAB'S REGISTER HEAD AND DIRECTORY SEAM ARE GRID ITEMS NOW
  (ADR-088).** Both were absolutes seated on `.fl-case` at
  `--fl-left-seam + --fl-proof-top-gap [+ --fl-proof-h …]` — an expression that
  named the register's top only while the zones were three top-anchored
  absolutes. Under `.fl-left` the register floats between the brief and a
  directory seated on tick 11, so no `calc()` on `.fl-case` can reach either
  line: the head rides seam track A (`align-self: end`) and the seam rides
  track B (centred). ⚠ The lab's hand composition mounts `.fl-left` too — the
  v0 control gets it from production, v1–v5 do not, and without it the three
  zones lose their grid.
- ⚠ **`will-change: transform` ON A LADDER WRAPPER MAKES IT A CONTAINING
  BLOCK.** `.services-stage[data-proof-live] .fl-case [data-fl-panel]` carries
  it, so chrome wrapped in a ladder div resolved `bottom` against a
  zero-height box and landed 800px off screen. Every piece carries
  `data-fl-panel` on ITSELF now, as `.fl-split` and `.fl-ret` do, and
  everything is seated from the TOP. This is a production rule, not a lab one.
- ⚠ **THE TOP-RIGHT RETICLE IS AN OWNER DELETION BEING RE-ASKED.**
  `.fl-ret--tr` is fully styled at `casefile.css` and has not rendered since
  commit `e3b33867` (the 2026-08-07 declutter, which took it with the route
  diagram and the three dotted rules). Every direction past `v0` draws it; the
  README asks for the ruling.
- **Verifying:** `node scripts/capture-hud-panel-lab.mjs` — 138 cells, gates on
  ink-measured clipping, frame containment, wide ink, ladder crossing, tick
  seating, the line ledger, the type floors and the ordinal ban.
  ⚠ Its subjects are READ OFF THE PAGE: three of four track ids were guessed
  wrong on the first run and `parseHplQuery` fell back to row one, so four
  "different" rows shot one still with every gate green.

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
