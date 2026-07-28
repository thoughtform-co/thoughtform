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
- **One release ramp gates everything.** `proofRelease` is multiplied into
  `--svc-content-in` (which carries the masthead, plates, designations,
  orbit draw-on and scan interface) and published on
  `servicesRingProgressRef.proofRelease` for the ring's and the orbits'
  `masterOpacityGetter`. Do not add a second gate — add a factor to this one.
- **The host is `pointer-events: none`.** Only the tabs and the directory
  rows opt back in. `.svc-ring-hits__hit` is at z 4 and the casefile at z 6,
  so an `auto` host silently swallows every card click once the ring lands.
- **The band offset is `--rail-inset` ALONE.** The stage box is already
  inset by `--hud-content-inset`; adding it again double-insets (visible at
  1440 as a 290px left edge instead of 145). Same value `.services-masthead`
  takes — the two must agree or the proof and the offer sit on different
  left edges.
- **The reveal needs BOTH the clock and the park gate.** `--svc-proof-in`
  alone crosses its threshold while the sticky stage is still travelling
  (measured on the masthead, twice). And the decode is DESTRUCTIVE — it
  blanks each line before queueing — so it must also be gated on
  `document.visibilityState` and force-settle on hide, or a tab switch
  mid-decode strands blank copy. rAF stops in a hidden document.
- **Geometry snaps to the HUD rail's 13-tick ladder.** Everything hangs off
  `--fl-t*`, derived from the live `.hud__rail` box; the two section rules
  land on tick 2 and the bearing-5 major. Two upstreams must stay in step:
  `.hud__rail` in `landing.css` and `lib/v7-parse/hudTicks.ts`. **That drift
  is the only way this design fails silently — check it first.**
- **Content = `lib/cases/` only.** `types.ts` keeps ZERO imports; nothing
  under `lib/cases/` may import react, three or supabase. The tool strip
  stores IDs and the renderer resolves them against `PROJECT_CASES`, which
  stays canonical for the four tools. A copy change is a content-module edit
  plus `npx vitest run tests/lib/cases-registry.test.ts`.
- **The beats and the casefile SHARE their plates.** Hoisted consts in the
  content module, asserted reference-equal by the registry test. Re-typing a
  plate inline is how the two surfaces drift.
- **Context values stay ≤20 characters.** The dotted leader needs a
  non-wrapping value, so a long one runs into the next column of the
  three-up register. Pinned by the registry test.
- **No italics.** Emphasis is `CaseTitle.em` (upright gold) or a
  `CaseSegment` `{ em }` (the gold-wash marker). Markup smuggled into copy
  strings fails the registry test.
- **Arrival is PER-PANEL, departure is whole-plane.** Every panel carries
  `data-fl-panel` + an inline `--ci-off`; the sheet's TERMINAL POWER-ON block
  runs the `#about` stutter off `--svc-proof-in`. It is scrubbed `clamp()`
  math on purpose — reversible, no keyframes, no writer. The 2.5px tear must
  stay exactly 0 at rest: these zones are absolutely positioned against the
  rail's tick ladder, so a residual shift is a drift bug, not a flourish.
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
