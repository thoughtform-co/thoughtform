# Maintenance — recurrence engine

> **When to open this:** at the start of any non-trivial change, and at the **end** of any conversation that modified code.  
> It connects **bugs** and **new features** to the same durable surfaces: `sentinel/`, `.claude/rules/`, `.claude/skills/`, and [LANGUAGE.md](../LANGUAGE.md).

---

## Cycle A: post-incident capture checklist

Run after **any** code change, before merge/push. If **any** question is _yes_, do the _then_ line before the work is “done”.

| #   | Question                                                                                                                 | If yes, then…                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1   | Did the fix take **more than two iterations**?                                                                           | Open or extend an ADR in `sentinel/decisions/`.                                                      |
| 2   | Did we **revert** a previous fix or go in circles?                                                                       | Open an ADR; link the prior attempt and what failed.                                                 |
| 3   | Did we discover a **class of bug** (sticky + fixed overlay, scale-edge drift, stale `onEnter`, fast-scroll scrub, etc.)? | Add a **pattern** to [BEST-PRACTICES.md](BEST-PRACTICES.md) with a short title and “why it matters.” |
| 4   | Must **two or more files** change together for the fix to hold?                                                          | Add or extend a **path-scoped** rule in `.claude/rules/` and mirror in `.cursor/rules/*.mdc`.        |
| 5   | Would a **runtime check** (Playwright, manual scroll script, console assert) have caught it earlier?                     | Add steps to the relevant `SKILL.md` debugging recipe, or to this repo’s test notes.                 |
| 6   | Does the fix **change an architectural assumption** (auth, scroll, layers, public API of a feature)?                     | Update or create an **ADR**; don’t only patch code.                                                  |

“Non-trivial” is the OR of the above — not a vibe check.

---

## Cycle B: new-feature scaffolding (before you build)

Use when adding **new surface area** (section, dashboard, public API, major hook), not for one-liners.

1. **Scan** `sentinel/decisions/`, `.claude/rules/`, and `.claude/skills/` for **prior art** in the same domain. Cite it in the ADR you open next.
2. **Open** `sentinel/decisions/NNN-short-name.md` with **Status: Proposed**. Document the **shape**, **alternatives rejected**, and **links** to related ADRs (e.g. 008/010 for anything touching landing v7 + brandmark).
3. **Build.** If a **recurring workflow** appears (debug steps, checklists, compositing invariants), add a `.claude/skills/<topic>/SKILL.md`.
4. **Wire paths:** add `.claude/rules/<area>.md` and `.cursor/rules/<area>.mdc` with `paths` / `globs` and pointers back to the ADR + skill.
5. When shipped: set ADR to **Accepted**; keep rules/skills in sync with reality.

If the feature would **contradict** an existing ADR (e.g. compositing, auth), the contradiction must be **resolved in the ADR** before merge — not as a drive-by.

---

## When to NOT capture

Skip Sentinel updates for **trivial** work so the ledger stays signal-rich:

- Typos, copy-only, comments-only
- Dependency bumps with no API migration
- Generated files (e.g. committed migration outputs) where the _intent_ is already in a prior ADR
- Formatting-only rewrites with no behavior change

If unsure, use **one** of the questions in [Cycle A](#cycle-a-post-incident-capture-checklist) as the bar: a single _yes_ means capture.

---

## Ledger

Chronological record of repo-wide maintenance passes (distinct from the Cycle
A/B capture rules above). Newest first.

### 2026-07-16 (evening) — Services surface polish: seam perf, retina DPR, morph crispness, layout + card scale

Four owner complaints, one pass (Cycle A per workstream; 8 commits, each
independently revertible):

- **Seam perf (ADR-047 Update 5).** Corridor→#services scroll janked.
  Draw gates extended to all remaining painters (walls/tunnel/topography/
  streaks/motes/photons/starfield, same-frame-as-opacity discipline), ticker
  display-gate + SIGNAL_OUT arc freeze, caption glass visibility gate +
  backdrop-filter transition removal, root-style + armillary anchor publish
  delta gates. Headed-Chromium trace 1280×800: p50 21–25ms → **16.7ms
  (vsync)**, p95 50–58 → 37–42ms, >50ms frames 9–22 → 0–4, long tasks
  798ms/run → ~0. Governor constants untouched (not needed post-fix).
- **Retina brandmark (ADR-038 update).** `BrandmarkPhysicsCore.uPixelRatio`
  read raw `devicePixelRatio` instead of the governed buffer DPR → fat
  chunky dots after a governor step-down on MacBook. Per-frame
  `state.viewport.dpr` sync; consumer contract documented. Post-deploy check
  for Vince: scroll the seam on the MacBook — the parked wireframe should
  stay crisp, and briefly-soft states should recover within ~5s of idling.
- **Terminal-crisp morph (ADR-023 addendum).** The 2D→3D flight window read
  "painted". `FLIGHT_CRISP_FLOOR` 0.7 + point-size sin-dip 0.9 + recede
  atten 0.12 — identity-default knobs, endpoints screenshot-verified
  pixel-equivalent, choreography untouched. `brandmark.md` updated.
- **Layout + card scale (ADR-044 update).** Corner-LINE masthead rule (both
  text blocks top-anchored on the bracket line, vertical-only change) +
  `parkedInstrumentScale` viewport boost (1.15× on MacBook-class, 1.0 wide/
  tall, recT-target-only so the corridor is byte-identical; new unit suite).
  Deck-flip portrait landing verified at 1280×800 and 1920×1080.

### 2026-07-16 (later) — About deck-flip stage (ADR-047; supersedes the ADR-046 dock, same day)

Owner redesign of the services→about transition: the cartridge dock was
"gimmicky and doesn't solve the transition." Cycle B (new surface) + the
full dock removal.

- **Deck stack + flip (WebGL).** Across the services exit clock the four
  ring cards STACK via an azimuth sweep (`aboutDeckMath.ts` — per-card
  nearest-full-turn φ targets, deck-depth radius correction, spring-settle;
  exact identity at exit 0, unit-pinned). The pinned `#about` stage then
  FLIPS the deck π on X to a shared gold-tone portrait back face
  (`bakePortraitBack`, mirrored chamfer chrome; back planes at
  `rotation.x = π` so Rx(π)∘Rx(π) = identity — upright, verified live)
  and the deck lands on the DOM portrait slot (viewport-first per frame).
- **Pinned transparent #about (DOM).** 300svh runway + sticky transparent
  stage (`AboutStagePortal`/`AboutStage`/`useAboutStageScroll`,
  `[data-about-root]` prototype shell); orbit cluster reuses the
  `.voidwalker__orbit*` grammar; copy via `aboutStageData.ts` (lockstep
  with the fallback markup); scrubbed `--ci-off` reveals (not
  useRevealMotion — portal nodes unobserved, one-shot `.is-in`).
- **Ambient kill retargeted #about → #continuum** with the gate keyed to
  the same rect as the fade envelope (the ADR-030 seam-cut bug, avoided);
  `#about` gets the transparent treatment + a FAIL-OPAQUE `::before`
  shield (`--about-bg-in`, default 1); `#continuum` takes the opaque-cover
  role. Verified bidirectionally in-browser: ambient survives the whole
  about band both directions, dies/re-engages exactly at continuum.
- **Found live:** the media-flip null-render stranded `data-about-mode`
  (empty about on mobile) — the hook now disengages when its stage ref
  goes null (fail-static hardening).
- **Dock removal:** component/CSS/flag/math/tests deleted; kept
  `viewportSeat.ts` (extracted seat projection), `beatScrollTarget.ts`
  (ServicesStage uses it), and the BEST-PRACTICES disabled-button lesson.
  ADR-046 → Superseded; ADR-045's desktop emerge → superseded note
  (fallback surfaces unchanged); ADR-008 paint-stack rows 4b–4e rewritten;
  landing-v7 + scroll-animations rules updated.

### 2026-07-16 — Services copy sweep · About emerge + rail parity (ADR-045) · Cartridge dock (ADR-046)

Owner-directed triple pass. Cycle B for the two new surfaces; the copy
sweep is data-only.

- **Services copy sweep.** All four card titles/ledes + the masthead moved
  to Vince's concrete first-person voice ("I move in with your team.");
  the stale "ONE LOOP. THREE DEPTHS." (predated the fourth service) became
  "ONE PRACTICE. FOUR WAYS IN.". `servicePlateData` (production) +
  `serviceData` vestigial fields in lockstep; `/test/services-wordmark`
  lab defaults mirrored; ADR-044 consequence note updated. Verified: all
  four baked WebGL faces re-bake without overflow; mobile plates share
  the strings by construction.
- **About rework (ADR-045).** The `.voidwalker__orbit` parallax +
  whole-cluster JS instrument tag retired for an authored emerge sequence
  (portrait clip-wipes first, rings/halo/readouts stagger around it);
  portrait centering moved off the transform channel (inset/margin);
  `--rail-inset` promoted to `:root` and consumed by both the services
  masthead and the about grid — measured 0px text-edge delta at 1968w.
  Two pre-existing defects fixed in passing: the 12-dot particle halo was
  invisible since authoring (span-relative translateY %), and the
  standalone prototype's reveal JS stranded every clip-path-hidden
  element (Chrome clips IO geometry by the target's own clip-path — 44
  stuck elements including every title; production's scroll fallback is
  the load-bearing reveal there, prototype gained the same fallback).
- **Cartridge dock (ADR-046, flag `SERVICES_CARTRIDGE_DOCK`).** The exit
  beat's cards now eject, flatten, and fly in-world to a bottom-right DOM
  console; DOM cartridges crossfade in AT the seat, persist page-long
  (pure function of clamped runway progress — no latch), and glide back
  on click via the shared `servicesBeatScrollTarget`. New pure-math module
  `dockMath` (13 unit tests incl. the identity pin), seat-rect bridge,
  ring exit branch, pointer-look exit damp, ADR-008 paint-stack row 5a,
  landing-v7 rule note, smoke probes (+ fixed the stale ADR-044 SOURCE BUS
  assertion). Two bugs found live: rAF-order staleness on teleport jumps
  (fixed with a trailing sync tick) and **React dropping clicks on a
  props-disabled button whose DOM `disabled` was flipped imperatively**
  (fixed by keeping `disabled` out of JSX — captured in BEST-PRACTICES).

### 2026-07-15 — Mobile Landing Quality Pass, Round 3 (ADR-018 Revision 3)

Owner visual-tuning follow-up to Round 2. Cycle A. All gated mobile →
desktop byte-identical.

- **Thesis gateway visible at rest + rise-to-centre.**
  `getThoughtformMobilePhase` holds `diagramFactor` at the exit fade (was
  a scroll-in ramp) so the compass reads as already-there on arrival; new
  `getThoughtformMobileRiseOffset` seats the brandmark + compass below
  centre at rest and rises them to centre by the SVG→particle handoff
  (offset 0 there → morph/fly byte-identical). Applied in
  `getBrandmarkWorldPosition` + `ThoughtformCompassGate`.
- **Arc caption pull-up.** Support straddles −2.0 / −1.7 / −1.45 → −1.8 /
  −1.5 / −1.35 (less bottom-heavy; the Build case cards now fit fully).
- **Type scale.** Mobile arc meta unified onto 9px (badge / coord /
  tagline); clean 16 / 12 / 11 / 9 mono scale.

Three code files (`sceneGeom.ts`, `ThoughtformCompassGate.tsx`,
`home-v2.css`) + docs. lint / typecheck green; verified in-browser at
390×844.

### 2026-07-15 — Mobile Landing Quality Pass, Round 2 (ADR-018 Revision 2)

Follow-up to the same-day Round 1 below. Round 1 landed 7 of its 9
workstreams cleanly but its "styling parity" workstream never actually
removed the title chrome or reframed the support copy (only the kicker +
case cards shipped), and its new mobile epilogue introduced a font
regression. Four user-visible items + a broadened alignment sweep. Cycle
A (multiple linked fixes on a shared surface). All gated on
`@media (max-width: 760px)` / `isMobileComposition()` / mobile-only
classes → desktop byte-identical (spot-checked at 1280×800).

- **Bare Arc titles.** The gold `.home-v2-readout__corner` L-brackets
  were only hidden on desktop (`--twocol`); mobile leaked them. Hidden
  on mobile → matches the bare desktop title grammar (bare since
  2026-07-03).
- **Compact caption reticle.** Mobile support dropped
  `.home-v2-copy-body` (which was overriding PT-Mono → sans) and is now
  wrapped in a new `.home-v2-readout__caption*` reticle (dashed frame +
  gold corner crosses + coord tag) echoing the desktop `CaptionCard`,
  minus the arm/aperture choreography / glass / meta / rail / pips.
- **Copy spread + sphere enlarged.** Six `mobileStraddleY` offsets
  widened to use the empty portrait bands; new `mobileGyroSphereScale()`
  (1.1 mobile / 1 desktop) enlarges the gyro sphere, applied in the two
  synced places (`BrandmarkAccretionShell` group `setScalar` +
  `getBrandmarkSphereMatchHalfExtent`) so the brandmark keeps filling the
  sphere (ADR-023).
- **Epilogue font.** `.home-v2-mobile-signal__title` was using the
  undefined `--font-source-serif` token (→ Georgia serif + italic);
  repointed to PP Neue Montreal, uppercase, `0.04em`, upright gold `em`
  — matching desktop and the no-italics rule.
- **Alignment sweep ("center everything").** `#about` bio + `#continuum`
  head centred on mobile; `#practice` approach-phase rules centred
  (inert on the current placeholder markup, defensive); `#services`
  cards + `#continuum` spectrum rail kept left (component grammar).

Reverses two explicit Round-1 non-goals (kept L-corners; kept `#about`
left) per owner feedback — noted in the ADR-018 Revision-2 header. Six
touched files: `home-v2.css`, `StationTitle.tsx`, `sceneGeom.ts`,
`BrandmarkAccretionShell.tsx`, `landing.css`, plus the ADR/ledger docs.
lint / typecheck / vitest all green.

### 2026-07-15 — Mobile Landing Quality Pass (ADR-018 addendum)

Owner-driven quality pass to raise the mobile landing to parity with
desktop (Cycle A — multiple linked fixes on a shared surface). Nine
workstreams, all gated on `isMobileComposition()` (~760px) or an
equivalent media query so desktop is byte-identical:

- **Two bug fixes that were the biggest visible issues.** (1) A CSS
  cascade order bug hid the mobile stack-item hide behind the base
  `display: flex` rules, so the SOURCES/SURFACES rails and chips
  rendered on phones and overlapped the BUILD title (visible in every
  Build-park mobile screenshot). Relocated the hide to the late-cascade
  block; joined the Encode cardinal callouts. (2) `StaticStarfield` +
  the two BrandmarkParticleField painters set `uPixelRatio` once at
  mount from raw `window.devicePixelRatio` (~3 on iPhone) while the
  canvas caps at DPR 1.4 / 1.75 — every point rasterised 20–115%
  oversized on mobile, the "thicker starfield competing with the
  compass" complaint. Fixed with a per-frame sync to `state.viewport.dpr`.
- **Missing mobile epilogue.** The whole desktop signal layer
  (`CorridorStationHeaders`) is `display: none` at ≤760px, and the
  world-anchored mobile Build title had no epilogue crossfade — so
  "BUILD ON THE LAYER." persisted through the whole epilogue and mobile
  visitors never saw "EVERYONE IS RACING…" or the "WE HELP YOU BUILD
  YOURS" CTA. Fix: a new `MobileEpilogueSignal` component (fixed layer
  driven by the same `TITLE_IN` / `SIGNAL_OUT` bands) mounted from the
  mobile branch of `CopyAnchors`, paired with a new `gateMobileBuildTitle`
  `onPaint` handler on `intelligence.title` / `intelligence.support`
  that multiplies visibility by `1 - epilogueBand(ep, "BUILD_OUT")` on
  mobile (desktop no-op).
- **Composed Thoughtform layout replaces the two-moment sequence.**
  The retired two-moment beat (copy fades out in Moment 1, brandmark +
  diagram slide in from below in Moment 2) required a full extra
  viewport of scroll before the diagram appeared and left the
  composition disjoint. Now copy sits in the upper third
  (`MOBILE_COPY_ANCHOR_Y = 1.35` on `thoughtform.leftCopy`), brandmark
  - `ThoughtformCompassGate` stay at the gate centre for the whole
    dwell (retired `MOBILE_BRANDMARK_SLIDE_FROM`; `slideY` in
    `ThoughtformMobilePhase` deprecated to always 0), and the diagram
    fades in briefly as an entrance effect then holds. Phase labels
    spread wider (`MOBILE_PHASE_SCALE` 0.7 → 0.92) so NAVIGATE/ENCODE/BUILD
    sit outside the outer ring. `COMPASS_MOBILE_ALPHA_BOOST = 1.5` lifts
    every compass line's final alpha on portrait so the diagram matches
    its desktop presence (previously invisible at portrait FOV + DPR 1.4).
- **Scroll runway.** Mobile corridor stage raised `620svh → 820svh`
  (matching desktop's `EPILOGUE_START = 620/820` split);
  `MOBILE_THOUGHTFORM_END` retuned `0.38 → 0.30` so the Thoughtform
  dwell stays ~2 viewports and the reclaimed ~130svh flows into the
  Navigate→Encode→Build fly. Resolves the "too fast on mobile" scroll.
- **Corridor presence on mobile.** `LatentWormholeWalls` `innerWidth >= 760`
  hard block retired — the walls are the ONLY layer that makes the fly
  read as a corridor, and the tier-governed `STREAK_COUNT_MOBILE = 240`
  was already defined for this path. `SubstrateTopography` stays
  desktop-only pending device perf verification.
- **Starfield spread + local cluster.** `StaticStarfield` spawn volume
  widened from ±25/±15 to ±30/±22 so the field covers the widest
  portrait frustum instead of leaving empty top/bottom edges. Local
  `ThoughtformAtmosphere` cluster dropped mobile point size (6 → 3.4)
  and count (200 → 130) so it reads as depth backdrop over
  `StaticStarfield` rather than a dominant second field. Chevron scroll
  cue removed (nothing to cue toward with copy + diagram sharing the
  frame).
- **Styling parity.** Mobile kicker chip row simplified from
  `sector // callsign · code · metric [status]` to
  `sector // callsign [status]` — the dropped chips were literal
  duplicates that overflowed the mobile container. Mobile Build-park
  case chips upgraded to a 2×2 grid of mini-cards (codename + tagline)
  matching the desktop `ArcCasesCard` grammar; still non-interactive
  per the ADR-033 gate parity rule.

Every change documented in a single ADR-018 addendum at the top of
[sentinel/decisions/018-home-v2-depth-corridor.md](decisions/018-home-v2-depth-corridor.md).
Nine touched files: `home-v2.css`, `sceneGeom.ts`,
`ThoughtformCompassGate.tsx`, `CopyAnchors.tsx`, `StationTitle.tsx`,
`MobileEpilogueSignal.tsx` (new), `StaticStarfield.tsx`,
`ThoughtformAtmosphere.tsx`, `LatentWormholeWalls.tsx`, plus BrandmarkParticleStation / BrandmarkSilhouettePoints DPR fix. Lint clean, TypeScript clean.

### 2026-07-14 — Arc Cases: phased reveal + front-pole sigil (ADR-041)

Owner-driven feature pass on the Build-park cases reveal (Cycle B — new
surface + two superseded ADR-036 sections). Three changes:

- **Phased reveal.** The single damped arm level now drives TWO ordered
  phases: the node fold on `arcFoldInput(level)` (done at `ARC_FOLD_DONE`
  0.62) and the card on `arcCardPresence(level)` (`smootherstep(0.62, 1)`,
  published as `cardPresence` on `arcCasesLevelRef` by the same single
  writer). The card previously read the level LINEARLY while the fold rode a
  smootherstep, so the screen visibly led the nodes it hangs from. Now:
  labels fade → nodes fold and latch → card materializes into the frame they
  made. Strict ordering invariant (`arcCardPresence === 0` while
  `arcFoldInput < 1`) is unit-pinned; the live arm trace shows cardPresence
  exactly 0 for the first ~384 ms while the labels fade 0.66 → 0.
- **The trigger is a cue under the Build title, not a sphere sigil (ADR-042
  supersedes ADR-041 §2).** `ArcCasesTerminalCta` (chip) and `ArcCasesSigil`
  (sphere marker) are BOTH deleted; `ArcCasesCue` is a DOM dotted-leader +
  label docked under the Build station title (the sphere sigil "felt out of
  place"). Its `intelligence.sigil` anchor, `gateSigil`, and `SIGIL_Z` are
  gone. It arms on the SAME settle gate (`sigilSettle`, window **measured
  live** — a first pass at [0.72, 0.96] left the trigger unreachable) and
  keeps the aria/inert/auto-disarm contracts. Because it sits clear of the
  centred card it stays visible + interactive while armed (a 2nd click /
  Escape closes; the stepper ✕ CLOSE also stays), so the ADR-041
  fade-to-0/pointer-events-drop guard is gone.
- **Card face** gains the four capability rows from the retired horizontal
  console card, as a MEASURED fit (full → title-only → skipped) into the
  ~320 px dead band; Heimdall (longest copy) verified collision-free.
- **Deliberately NOT done:** retuning `ARC_BAND_IN` (its "tracks the stack"
  comment is stale drift — the stack moved 0.81/0.93 → 0.875/0.95 and the
  band didn't follow), because the Build park (0.9225) sits BELOW the
  accretion peak (0.95): raising the band would gate the card off entirely.
  Sequencing is enforced on the trigger instead. Recorded in ADR-041.
- **New gotcha (in the ADR + rules):** Playwright `locator.click()` can never
  pass actionability on the sigil — it is re-projected every frame and the
  gyro carries an idle drift, so its box never repeats ("element is not
  stable"). Use `page.mouse.click` at the projected centre (still hit-tested).
- Gate: typecheck clean, ESLint **0 errors / 300 warnings** (baseline
  unchanged), **256 unit tests**, prod build clean, `arc-cases-card-smoke`
  rewritten against the sigil (10 pass), `landing-corridor` + `services-ring`
  52 pass. Driven live at the Build park at 1600×1000.
- **Left for the owner's eye:** sigil size + pulse cadence, the exact
  `ARC_FOLD_DONE` split (how long the nodes hang on an empty frame), and the
  CAP-row type scale.

### 2026-07-14 — Phase 5, round 1 (structural: deletions, CI, math)

- **Deletions** (`fd9abb9`, `21cb068`): the repo's single react-doctor P0
  (`legacy/canvas/ThreeBackground.tsx`, archived `new Function()`) and
  `lib/queries.ts` (legacy page-editor tables, ADR-037) — both
  legacy-only consumers, Phase-1 precedent. Then the NavigationCockpitV2
  cluster: the old scroll-HUD homepage (25 files), its
  `/archive/current-home` route + the `/test` index that mounted it, and
  the orphaned `lib/particle-config-server.ts`; barrel + stale comments +
  CLAUDE.md references fixed. **ESLint 327 → 300 warnings.**
- **CI hardening** (`414f856`): `verify.yml` gains a corridor-smokes job
  (landing-corridor + device-matrix, every PR/push, chromium ×4 viewport
  projects, failure artifacts) and a PR-only react-doctor job scoped to
  NEW issues (`--scope changed`, fetch-depth 0). ADR-040 records the
  deliberately-accepted finding classes (v7-parse html sink,
  long-documented-component style, impure-updater misfires, legacy/
  registry scan-scope caveat) so CI + future audits don't re-litigate.
- **Math consolidation** (`85a96df`, Opus subagent + orchestrator seam
  review): 58 scattered clamp01/clamp/lerp/smoothstep/smootherstep
  definitions → ONE canonical import-free `lib/math.ts`; exporting homes
  re-export (import paths preserved: corridorMap, ringMath,
  particle-geometry, utils, depthGatewayStore, journeyScalars,
  artifactGeom); 15 files' identical local copies swapped to imports;
  **13 behavioral variants deliberately left** (degenerate-edge guards,
  NaN/Infinity-to-0 clamps incl. the test-asserted seamPixelize,
  arg-order and clamped-t variants) — consolidating them would change
  behavior. The journeyScalars three-free seam holds (`lib/math` imports
  nothing).
- **A11y batch** (`5028eea`, Opus subagent + orchestrator diff review):
  react-doctor's mechanical cluster on app/(admin) + components/admin —
  176× `type="button"` (form-submit trap checked per button: the two
  in-scope forms have no bare submit buttons), 38× `aria-label` on
  icon-only controls, 2× keyboard triads on trivial clickable divs.
  Deliberately left: modal backdrops with interactive children,
  drag/canvas surfaces, hover menus, labels needing `useId`
  restructuring, visible-text buttons (aria-label would override).
- Gate per commit: typecheck, ESLint 0 errors, 246 unit tests, prod /
  analyze build (First Load JS unchanged at 72.8 kB gzip), corridor
  36/36; + ring 16/16 + arc-cases 8/8 on the math commit.
- **Still on the Phase-5 board (each wants a fresh, focused session):**
  frame-orchestration pass (rAF read/write phasing + per-layer painter
  dispatch — the remaining perf lever; eyeball-gated), hooks-warning
  burndown (300, semantic not mechanical), anchor change-signal redesign
  (per-frame store contract), card-face mipmaps (eyeball-gated).

### 2026-07-14 — Phase 4 (WebGL/device hardening + the mobile-LCP lever)

- **Quality governor** (`6796253`, ADR-038): the corridor's missing adaptive
  layer. One-shot `WEBGL_debug_renderer_info` probe
  (`lib/webgl/rendererClass.ts`) — software rasterizers route to the static
  fallback via `corridorCapable()`; weak-but-real GPUs open two rungs down.
  Runtime frame governor (`lib/hooks/useQualityTier.ts`): monotonic ladder,
  DPR 1.75→1.25→1.0 then count multiplier 1.0→0.6→0.35, stepping only on
  sustained >24 ms over 1200 ms (1500 ms cooldowns), sampled in
  MotionFollowerDriver's priority −10 useFrame. Heavy painters read counts via
  `useCorridorCount` — byte-identical at multiplier 1. Under automation
  (`navigator.webdriver`) the mount gate keeps 3D and the governor is a no-op,
  so headless SwiftShader smokes stay deterministic. +4 ladder unit tests.
- **Tablet band** (`aad7ed0`): 760–1280 px COARSE-POINTER devices (iPads) now
  get the mobile GPU profile (antialias off, DPR ≤1.4) instead of the desktop
  one; a tablet-width desktop window keeps the desktop profile.
- **Fixed counts tier-gated** (`2d8c50d`): ThoughtformAtmosphere STAR_COUNT
  420 and LatentWormholeWalls STREAK_COUNT 520 were full-count on every tier;
  now per-tier + governor-scaled (desktop unchanged).
- **Per-frame hygiene** (`90c105a`): ThoughtformAtmosphere / GatewayThroat /
  ThoughtformCompassGate drove twinkle/breath/spins off absolute
  `clock.elapsedTime`, which jumps on demand→always re-engage (visible pop on
  scroll re-entry) — each now accumulates a clamped-dt phase advanced only
  while painting. HologramOrbits' per-orbit per-frame `Vector3.clone()`
  replaced with a reused projection scratch.
- **Device-matrix probe** (`5894e73`,
  `tests/visual/corridor-device-matrix-smoke.spec.ts`): report-only FPS + the
  GPU profile actually granted to the canvas across all four viewport
  projects, plus hard assertions that no-WebGL and reduced-motion resolve to
  the static fallback. Confirms the tablet fix live (iPad project: antialias
  false, effective DPR 1.4). 12/12.
- **Mobile-LCP lever** (`8c9aaab`, `ef7e0ad`, ADR-039 — PROTOTYPE, flag OFF):
  CSS first-paint hero reveal behind `html[data-hero-css-reveal]`
  (`?heroReveal=css` / `NEXT_PUBLIC_HERO_CSS_REVEAL`). Opaque first paint +
  transform-only rise (measured: clip/filter can't beat hydration; fades add
  nothing the lab credits). **Premise correction:** real Chrome records the
  H1's LCP entry at first paint even at opacity:0 (292 ms flag-off), so
  "mobile LCP 7.9 s pinned by the [data-m] reveal" was a lantern attribution
  artifact — lantern chains the JS bundle into text-LCP and reports ~9.5 s in
  BOTH flag states. The USER-VISIBLE gate is real (headline missing at 700 ms
  under 4× throttle without the flag, painted with it) — A/B screenshots in
  `assets-staging/hero-reveal-ab/` await Vince's brand-motion call.
- **Deferred → moved to Phase 5 (owner decision, 2026-07-14):** P4 is
  code-complete; the remaining code items are micro-optimizations, not
  adaptivity gaps, and were formally re-scoped to Phase 5:
  - rAF-loop consolidation — the DOM loops carry one-writer ordering
    contracts (e.g. `brandmarkScreenRectRef` write/read ordering between
    the SVG actor and the physics core). Merge with the "~25 useFrame
    painters dispatch regardless of per-layer visibility" lever into ONE
    Phase-5 "frame orchestration" pass (same files, one verification
    cycle).
  - Anchor-array hoists — a fresh array per frame IS the Zustand
    change-detection signal; reuse would freeze connectors. Needs a
    redesigned change signal (version counter), not a mechanical hoist.
  - `generateMipmaps=false` on card faces — desktop-only ~15 MB GPU win;
    orbiting cards minify at depth, so shimmer risk wants an owner eyeball.
  - Services wheel listener: CLOSED without change (verified already
    correctly scoped — preventDefault unreachable unless the ring is
    captured).
- **P4 sign-off still owed (owner, not Phase 5):** real-device pass (iOS
  Safari / Android Chrome / one older Android — the governor shipped on
  SwiftShader evidence); eyeball the scroll re-entry pop removal; decide
  ADR-039 (`?heroReveal=css` entrance — flip default or drop). ADR-037's
  two owner actions remain open independently of any phase.
- Gate per commit: typecheck, ESLint 0 errors / 327 warnings, 246 unit tests,
  `NEXT_DIST_DIR` prod build (First Load JS unchanged at 72.8 kB gzip),
  corridor 36/36 + services-ring 16/16 + arc-cases 8/8 + device-matrix 12/12
  (workers=2). Desktop full-quality path byte-identical throughout; the
  re-entry-pop removal and the flagged hero entrance want owner eyeballs.

### 2026-07-14 — Phase 3b (performance: assets, auth path, payloads)

- **Case screenshots** (`22f5e60`): the four Build-park PNGs
  (2000–2263 px, 3.07 MB) → 1000 px webp q82 (**133 kB, −96%**); dims
  updated in `toolCardData`; HTTP cache warmed at corridor mount so the
  first-arm bake isn't a cold burst. Baked card eyeballed at DPR 1.75 —
  identical (LUT + dot veil dominate).
- **Fonts** (`4bec129`): six brand faces → woff2 (**789 → 321 kB, −59%**),
  woff2-only src (universal since ~2016; OTF/TTF deleted, mondwest stays on
  next/font). The three bake-critical faces are preloaded — kills the
  `waitForCardFonts` 1500 ms bake-with-fallback race.
- **Hero** (`566467d`): explicit dims + `fetchpriority=high` +
  page-level preload for `Gateway_v1b.webp`. The 835 kB asset is NOT
  swapped — candidates for owner review in `assets-staging/hero-candidates/`
  (webp re-encode barely helps; **AVIF q45 = 190 kB**, 2048px webp = 143 kB).
- **Supabase off the anonymous path** (`566cc02`): AuthProvider lazy-inits
  gated on persisted `sb-*` token / URL auth params / a same-tab sign-in
  bridge; UserStatus defers signOut to click. **First Load JS 106.8 →
  72.8 kB gzip** (449.8 at origin, **−84% cumulative**). Verified: anonymous
  → zero supabase chunks/calls (dev + prod build); token → lazy init opens;
  /admin terminal renders; prod /astrogation still walls.
- **Prototype HTML trim** (`74ad0a1`): 107 annotation comments stripped at
  the parse-pipeline tail (source file untouched) — the served landing
  document drops **133.5 → 111.0 kB** (comments shipped twice: SSR + RSC).
- **Deploy hygiene** (`eb508e3`): `.vercelignore` drops ~33 MB of
  lab-only/unreferenced assets (gateway-hero, studio.hdr, showcase/,
  Vince-4.jpg). Kept: `videos/` (the PUBLIC /claude-workshop route ships
  the key visual — caught in verification) and `images/gateway/` (admin
  orrery). Labs verified serving in dev.
- **Mobile chunk defer** (`7d6acc0`): the corridor WebGL chunk gates on
  first scroll/input/idle (2.5 s cap) on ≤960 px viewports — the parse
  burst leaves the hydration window; mount machinery untouched.
- Gate: typecheck, ESLint 0 errors / 327 warnings, 242 unit tests,
  prod build, corridor 36/36 (+ring/arc-cases green; single-project runs
  need bounded workers — WebGL starvation), landing + card + fonts
  eyeballed. Local-lab Lighthouse (noisy machine): desktop 79 / LCP 1.6 s;
  mobile 59 / LCP 7.9 s — mobile LCP remains hydration+reveal-gated
  ([data-m]), the explicit Phase-4 decision item.

### 2026-07-14 — Phase 3 (performance: landing First Load JS)

- **The WebGL stack is out of the landing's initial bundle**: First Load JS
  **449.8 → 106.8 kB gzip (−76%)**, parsed 1553.7 → 330.7 kB. Four seams,
  each its own commit:
  - `98e48cf` — HomeCorridor lazy inside `useCorridorMount`'s nested root
    (React.lazy + Suspense; the sync `.home-corridor-host` wrapper keeps the
    `hasContent` recovery guard satisfied).
  - `da410e8` — BrandmarkParticleCanvas via `next/dynamic` ssr:false (the
    vector actor + dock glyphs are the mark; the canvas is atmosphere).
  - `b3c5681` — journey scalars extracted to the three-free
    `journeyScalars.ts` (intelligenceLayerGeom re-exports; bodies
    byte-identical).
  - `3443801` — `RING_CARD_CTA_BOX` + bake dims to the three-free
    `hologram/ringCtaBox.ts` (one layout constant was dragging
    three/fiber/drei in via ServicesRingHitAreas).
  - `e653950` — services-ring smoke measures the runway AFTER the corridor
    inflates (the lazy chunk widened a pre-existing post-hydration
    inflation window; below-the-fold, no CLS change).
- **Lab mobile (same-day)**: FCP 2.0→1.5 s, Speed Index 5.0→3.0 s,
  LCP 8.2→7.1 s, TTI 12.1→10.8 s (before = prod www / old bundle; after =
  localhost prod build). Remaining initial: supabase-js 34 kB gz,
  gsap 19.2 kB gz, landing DOM.
- **Newly exposed follow-ups (not this phase):** mobile LCP is the hero
  PARAGRAPH at 93% render-delay — the `[data-m]` reveal only fires `.is-in`
  after hydration, so LCP ≈ hydration; a CSS-only first-viewport reveal
  would collapse LCP toward FCP (ADR-scale, touches reveal choreography).
  `Gateway_v1b.webp` is 835 kB (hero visual) — recompress. TBT burst from
  the async three chunk parse — consider idle/first-scroll deferral on the
  mobile tier.
- Gate: typecheck, ESLint 0 errors / 327 warnings, 242 unit tests, prod
  build, corridor 36/36 + ring 16/16 + arc-cases 8/8 smokes, landing
  eyeballed at 6 depths incl. an early-load frame (hero composed at 700 ms,
  no brandmark flash).

### 2026-07-14 — Phase 2 (security + correctness)

- **Interlude (post-Phase-1, Vince-directed):** no-unused-vars zeroed out via
  rule options + underscore aliases (`b077fbf`, 346 → 327 warnings), the two
  remaining showcase dupes dropped (`ebbe433`), and the corridor smoke suite
  made **fully green (36/36)** — the three stale Services tests retired in
  favor of `services-ring-smoke` coverage and the `:102` engagement contract
  reformulated as ON/OFF legs after empirically mapping the band across
  viewports (`c06fef1`, `1d2f967`); the file is serialized against WebGL
  context starvation.
- **BYPASS_AUTH closed** (`885c5fa`): astrogation's hardcoded `true` is now
  `NODE_ENV === "development"` (compile-time-inlined). Verified both ways
  with a Playwright drive: the `.next-verify` production build served on
  :3013 redirects sessionless `/astrogation` to the `/admin` Credential
  Terminal with zero tool nodes mounted; dev keeps the bypass branch.
- **RLS review** (`a7c2718`): ADR-037 documents the trust boundary —
  public reads on landing content are intentional; every
  "any-authenticated-can-write" policy is a gap-if-signups-open;
  `brandmark_presets` anon INSERT is a constrained lab feature; the
  `useTemplates` client write is RLS-safe (`auth.uid() = user_id`).
  Staged (NOT applied): `DRAFT-20260714_tighten_admin_write_policies.sql`
  with an `is_admin()` JWT-email check. Two owner actions pending.
- **Effect cleanup** (`b991a2c`, `3f2a3f4`): CelestialConnector's reveal
  observer now disconnects via React 19 ref cleanup (real leak); the four
  `onCreated` webglcontext listener pairs documented as element-lifetime
  (intentional); useBrandmarkJourney/useRevealMotion verified false
  positives.
- **SSR guards** (`e66c0a7`): ServicesCardRing veil/glow texture bakes
  guard `document`; NavigationCockpitV2 confirmed internal-only (Phase-5
  deletion candidate).
- **Impure state updaters** (`e4f3bd0`): ParticleConfigContext's ten
  update callbacks now schedule the debounced autosave AFTER commit
  instead of inside `setConfig` updaters. The seven flagged production
  components (ServicesStage, HudNav, TerminalReveal, Tree,
  ServicesPlateCluster, IntelligenceArtifactScene, AuthProvider) were
  read individually: none contains a `setState(fn)`-nested side effect —
  the rule's callback-shape heuristic misfires on sibling setStates in
  ordinary event/subscription handlers. Left as-is by design.
- **no-eval P0**: `new Function(code)` in `legacy/canvas/ThreeBackground`
  — archived, unimported, build-excluded; Phase-5 deletion candidate.
- Gate: typecheck, ESLint 0 errors (327 warnings), 242 unit tests,
  production build, corridor smokes 36/36, landing eyeballed at 10 scroll
  depths, bundle unchanged at 449.8 kB gzip.

### 2026-07-14 — Phase 1 (zero-risk hygiene: delete-only + trivial)

- **Orphans deleted** (all verified zero-reference; owner decision: delete
  outright, git history is the archive): the v7 landing twins
  (`LandingV7`/`V7Landing`/`prototypeRuntime`), the traveling-orbits cluster,
  DepthGatewayScene leftovers (`AstrogationField`, `brandmarkCloud`,
  `CorridorSeamPixelField`, `ServicesCardStack`), lib leftovers
  (`useOrbitDrift`, `ParticleSceneContext`, `useScrollMetrics`),
  `LatentTopographyContours` (+ stale docstring fixed), `HandoffOrbitEmbed`,
  `orbitStyles`, `LoginModal` (auth-checked: no dynamic/string imports),
  `constants/` + the legacy-only constants re-export in `lib/types.ts`, and
  `intelligence-layer/_legacy/` (ADR-014, superseded by ADR-016).
- **Dead deps removed:** 3× `@dnd-kit/*`, 5× `@tiptap/*` (only consumer was
  build-excluded `legacy/`); `@types/sharp` moved to devDependencies.
- **Logging:** the 9 API/hook `console.log` sites now route through
  `lib/logger`; stale "terrace" comment fixed (ADR-036); dead
  `buildDepthTicksHtml` alias deleted.
- **Hygiene:** duplicated showcase assets dropped (sha256-identical to
  `public/project-cards/`); 316 untracked root dev screenshots (~116 MB)
  purged from disk (already ignored by the root `/*.png` pattern).
- **Lint:** `@typescript-eslint/no-unused-vars` burned down 128 → 19 across
  59 files; total warnings 470 → 346. The 19 that remain are deliberate
  (rest-sibling prop stripping, uniform fn-family params, exported no-op API)
  and need rule options the config doesn't enable — see the burn-down commit.
- **Gate:** typecheck, ESLint (0 errors), 242 unit tests, production build
  green; corridor smokes byte-identical to the Phase 0 known-red baseline
  (no new reds); landing First Load JS unchanged at 449.8 kB gzip (≤ baseline).
- Commits: `a2ae117`, `f8b8f79`, `206c560`, `c47fb6b` (orphan clusters),
  `d5a23c6` (needs-verification), `7ce66e4` (deps), `aca6f2c` (logging),
  `7ae7474` (hygiene), `c6d79a8` (lint), plus this ledger entry.

### 2026-07-14 — Phase 0 (cleanup plan kickoff)

- **Worktrees pruned:** 6 in-repo + 1 external git worktree removed (~2.6 GB
  freed); 3 merged branches deleted.
- **Guardrail added:** env-gated `NEXT_DIST_DIR` in `next.config.mjs` so
  verification/analyze builds can target `.next-verify` without clobbering a
  running dev server's `.next`. `.next-verify` / `.next-build` added to
  `.gitignore`; matching generated-type globs added to `tsconfig.json` so an
  alternate-distDir build does not auto-rewrite tsconfig. Default behavior is
  byte-identical when the env var is unset; nothing product-visible changed.
- **Baselines captured** in [`baselines/2026-07-14-phase0/`](baselines/2026-07-14-phase0/):
  bundle (landing First Load JS 449.8 kB gzip; three.js core 166.5 kB gzip),
  ESLint (0 errors / 470 warnings), react-doctor 0.7.7 (true post-prune score
  **30/100**, up from the worktree-polluted 13), Playwright smokes (87 pass /
  13 fail / 32 skip), Lighthouse (desktop 99 / mobile 73; mobile LCP 8.2 s).
- **Known-red baseline widened after warm-server verification:** the corridor
  suite reproduces the identical 13 failures against a freshly started,
  pre-warmed dev server, so the reds are not a cold-server artifact. The
  known-red set is the Services-hologram cluster (`:176`/`:203`/`:233` — stale
  tests asserting markup retired by the ADR-029/030/033 Services reworks) plus
  a deterministic iphone-14-only red at `:102`. See
  [`baselines/2026-07-14-phase0/playwright-smokes.md`](baselines/2026-07-14-phase0/playwright-smokes.md).
- Commits: `cca26d7` (guardrail), `489a842` (baselines), and this ledger entry.

---

## Quick links

- Patterns: [BEST-PRACTICES.md](BEST-PRACTICES.md)
- Decisions: [decisions/README.md](decisions/README.md)
- Vocabulary: [LANGUAGE.md](../LANGUAGE.md)
- Root project memory: [CLAUDE.md](../CLAUDE.md)
