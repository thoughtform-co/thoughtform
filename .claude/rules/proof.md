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
- **The DWELL IS THE HANDOFF — it is not a reading window.**
  `PROOF_RELEASE` [0, 1] with `PROOF_OUT` 0.13 → 0.66 inside it, on a
  1.2-vh dwell. `--svc-proof-in` is 0.94 AT the runway top and 0.998 80px
  past it (the panels assemble on the DISSIPATE, during the approach), so
  any runway ahead of the release is DEAD SCROLL — the 2.8-vh/0.62-start
  tuning hid 1550px of it and the owner called it: "if you scroll, nothing
  really happens". The stage is pinned; a reader who wants to read stops
  scrolling. Scroll distance buys choreography, never patience.
  `smootherstep`'s flat first third is the settle hold (~200px to the
  fold), so never add an explicit hold in front of the release.
- **Place the fold BY VALUE ON THE RELEASE RAMP, never by eye.** 0.13 and
  0.66 are where the release reads ≈0.016 and ≈0.78 — the crossings the
  choreography was validated at. Two derived thresholds ride that ramp and
  survive a reshape only if you do this: the corner readout's
  `PROOF_OWNS_BELOW` (`useActiveSection.ts`, 0.75 ⇒ flip as the plane
  finishes) and the masthead's `REVEAL_AT` (`ServicesMasthead.tsx`, 0.5 ⇒
  decode once the casefile's top-band chrome has sunk — it shares the
  masthead's band and leaves LAST on the LIFO ladder). Overlapping edges
  prove nothing on their own: sample the crossing, where the casefile
  reads ≈0.43 against `--svc-content-in` ≈0.52 (proofP 0.52). The smoke
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
- **The host is `pointer-events: none`.** Only the tabs and the directory
  rows opt back in. `.svc-ring-hits__hit` is at z 4 and the casefile at z 6,
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
  `--fl-t*`, derived from the live `.hud__rail` box; the two section rules
  land on tick 2 and the bearing-5 major. Two upstreams must stay in step:
  `.hud__rail` in `landing.css` and `lib/v7-parse/hudTicks.ts`. **That drift
  is the only way this design fails silently — check it first.**
- **The tools row is a CONTROLLED gallery on ONE grid (ADR-056 Update 9,
  third pass).** `TrackPanel` owns `toolIdx` — not the plate — because the
  panel FOOT follows the tool in view. The body splits 50/50 with no gap,
  the tabs are quarters of the same rail, and the foot's 2×2 capability
  tiles sit on the same split (`--fl-plate-px` / `--fl-shot-px` are the
  shared text rails — measured aligned to 0.1px). The FUNCTIONAL NAME is
  the tab label; the codename is chrome (a visitor cannot know "Mímir").
  While a tool is in view the foot is the capabilities and NOTHING else —
  mode/team/year live on the identity meta line, the `shift` sentence
  beside the shot, status in the panel head. Content reads at `--fl-copy`
  (the brief column's own size); 8.5–10px mono is CHROME ONLY. The
  responsive ladder (≤930h / ≤800h / ≤760h) is measured against the worst
  tool (Heimdall's 2-line lead over a 179-char shift) and never drops copy
  below the 10.5px directory reading size — at ≤760h the TEXT COLUMN WIDENS
  (58/42) instead of the sentence truncating. Tab-name overflow is a
  TRACKING problem, not a size problem (0.05em cost 12px on a 146px
  quarter). The shot BLEEDS to the viz box edges (cover, top-anchored;
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
  rAF. `.fl-film` is the THIRD and LAST pointer-events opt-in, safe only
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
  TRANSFORMATION leads and the mission report closes the file (owner,
  2026-07-31; the studio led until then, which presented an output as the
  engagement). Two consequences when reordering: the first row's plate
  mounts with the casefile, so a media row there puts its bytes on page load
  — that cost 23.6 kB while the studio led and a pure-DOM plate gives it
  back — and row one is what every reader judges the case on.
- **The directory holds EIGHT rows and no more without a tick move.** The
  brief/directory seam is `--fl-t6` (moved from t7 when the eighth row
  landed — it was already clipping `METRICS.DAT` by 14px at 1440×800 with
  seven). Adding a ninth means moving a tick and trimming the brief again,
  both sides together. Measure at 1280×720 / 1440×800 / 1920×1080; the
  10.5px row type is owner-set — take density out of padding, never type.
- **The beats and the casefile SHARE their plates.** Hoisted consts in the
  content module, asserted reference-equal by the registry test. Re-typing a
  plate inline is how the two surfaces drift.
- **Context values stay ≤20 characters.** The dotted leader needs a
  non-wrapping value, so a long one runs into the next column of the
  three-up register. Pinned by the registry test. ⚠ The guard bounds the
  VALUE only — `Unit of done` + a 20-char value still ran off the panel edge
  at 1440. Keep the KEY short too, and measure.
- **PLATE AND BRIEF BOXES CLIP SILENTLY, and only on short viewports.**
  `.fl-brief` is height-boxed against `--fl-t6` and the `registry` plate
  holds ~8 lines; both are `overflow: hidden` with no scrollbar and no test.
  Measured 2026-07-31: the brief takes ~195 chars at 1280×720 (a 246-char
  draft lost 23px there, 9px at 1440×800, and looked perfect at 1920), and
  the registry plate takes FIVE groups plus THREE rows. A fourth row has its
  tag sliced at 1440. Author at 1280×720 or you will not see the defect.
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
- Tool **codenames are in scope** for a case study (published precedent:
  `PROJECT_CASES`) but stay OUT of general service copy
  (`services/serviceDesignations.ts`).
- Where sources disagree on a number, print the **smaller, exec-facing**
  one and never show the other. Do not publish a second variant of a claim
  that already appears on another surface — check `lib/arcs/content/**`
  first. The `Thoughtform Prime` handoff's 15+ teams / 20+ Skills / 90 % of
  paid social are superseded and pinned OUT by the registry test.

## Verifying

`/test/field-log-lab` is the look-dev harness (all five connection
grammars; variant E is what ships). On the landing, the beat is covered by
`tests/visual/services-ring-smoke.spec.ts` — the casefile holds, the rows
work while pinned, no hit anchors publish during the dwell, the ring takes
over after. Drive REAL scrolls, never a teleport.

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) — Cycle B
when adding a case or a `CaseTrackVisual` kind; Cycle A after fixes.
