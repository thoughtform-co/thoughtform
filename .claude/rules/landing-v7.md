---
paths:
  - "components/landing/v7/**"
  - "app/(marketing)/**"
  - "public/prototypes/v7/landing-v7-motion.html"
description: Landing v7 compositing, layers, and brandmark journey
---

# Rule: Landing v7

When editing files under `components/landing/v7/**` or `app/(marketing)/**`, you are in a **layered composite** (fixed gateway, sticky hero, opaque stations) — not a flat page.

**Read first**

- [ADR-008: Landing v7 background layers](../sentinel/decisions/008-landing-v7-background-layers.md)
- [ADR-010: Brandmark choreography](../sentinel/decisions/010-brandmark-choreography.md)
- [ADR-031: Rail Manifest](../sentinel/decisions/031-rail-manifest.md)
- [ADR-033: Arc Cases Orbit + funnel](../sentinel/decisions/033-arc-cases-orbit.md) (orbit superseded; funnel live)
- [ADR-034: Arc Cases Terrace](../sentinel/decisions/034-arc-cases-terrace.md) (superseded by ADR-035)
- [ADR-035: Arc Cases Terminal](../sentinel/decisions/035-arc-cases-terminal.md) (reveal surface superseded by ADR-036)
- [ADR-036: Arc Cases Card](../sentinel/decisions/036-arc-cases-card.md) (the live cases reveal; §3/§5 superseded by ADR-041)
- [ADR-041: Arc Cases Sigil + phased reveal](../sentinel/decisions/041-arc-cases-sigil.md) (the phased reveal + ordering; its §2 sphere-sigil trigger is superseded by ADR-042)
- [ADR-042: Arc Cases cue under the Build title](../sentinel/decisions/042-arc-cases-cue.md) (the live trigger — a DOM dotted-leader + label, off the sphere)
- Skill: `.claude/skills/landing-v7-compositing/SKILL.md`
- Skill: `.claude/skills/brandmark-choreography/SKILL.md`

**LandingPage must stay render-stable.** It owns the
`dangerouslySetInnerHTML` prototype body, and `ServicesPortal` /
`ServicesRailRegisterPortal` mount nested `createRoot`s into placeholder
nodes inside that markup. A LandingPage re-render that re-applies the
innerHTML orphans those nested roots (cards silently vanish, no error).
Do NOT add `useAuth` or other post-mount-updating subscriptions to
LandingPage — push them into leaf components (see `CelestialEditorGate`).
Ref: BEST-PRACTICES "Nested-root portals".

**The funnel is the ADR-033 order:** hero → corridor (thesis + the Arc)
→ services → about (bio) → continuum (philosophy) → practice → contact.
`#tools` and `#build` retired — the four production cases live ONLY on
the Arc's Build-park cases reveal (click-armed via the CUE — a dotted-leader

- label docked under the Build title, ADR-042; the node streams fold onto an
  in-canvas 3D tools card's slab edges and the card then materializes into the
  frame they made, NO camera move — see ADR-036 + ADR-041 + ADR-042). The order is owned by the parse arrays in
  `app/(marketing)/page.tsx` (`CORRIDOR_REPLACED_STATIONS` /
  `CORRIDOR_RELOCATED_STATIONS`) — never by prototype-HTML edits — in
  lockstep with `MANIFEST_ENTRIES` and the drift-guard tests
  (`tests/lib/rail-manifest.test.ts`, `tests/lib/v7-parse.test.ts`).
  `PROJECT_CASES` (`tools-cards/toolCardData.ts`) is the single canonical
  case module; `tools-cards/` otherwise survives only as the
  `/test/project-cards` lab's shared core (console skin, chrome, stack
  hook) — do not remount it on the landing.

**Arc Cases is an in-canvas 3D card — no camera channel (ADR-036, supersedes ADR-035).** The cases reveal is `ArcCasesCard`, ONE in-canvas portrait tools card mounted in the gyro assembly (a sibling of `ShellStack`) between the two Build-park stack columns, in front of the sphere; the accessible stepper row `ArcCasesStepper` (◂ 01 02 03 04 ▸ + CLOSE, region id `arc-cases-terminal`) is mounted in `HomeCorridor`. On arm the sources/surfaces DOM labels fade out on `arcCasesLevelRef` (single writer = the card's R3F `useFrame` at priority −5; readers = `gateStackLabel` label fade + the caption-card fade + the stepper's own rAF + `ShellStack`, which folds the source/surface node streams onto the card's actual left/right slab side walls so the screen reads as mounted on the nodes). The ref carries the card's slab edges (`cardEdges`, shell-local — the single source of truth for that mount geometry, direct math, NO viewport unprojection / `panelRect`). The corridor camera is a pure Z dolly through arm/disarm. Gate parity: the JS `ARC_CASES_MEDIA` gate == the CSS hide of BOTH the cue and the stepper. No scroll writer, no scroll lock, no backdrop; inert is reconciled every frame; DOM order = focus order. Do NOT re-introduce a camera channel, the DOM overlay panel, or the `panelRect` unprojection latch.

**The reveal is PHASED (ADR-041, supersedes ADR-036 §3/§5); the trigger is a CUE under the Build title (ADR-042, supersedes ADR-041 §2).** ONE damped arm level, TWO ordered phases: the node fold runs on `arcFoldInput(level)` (complete at `ARC_FOLD_DONE` 0.62 — feed `arcLatchEnvelope` the BARE clamped ratio; it supplies the easing, pre-easing double-eases) and the CARD reads `arcCardPresence(level)` (`smootherstep(0.62, 1)`), published as `cardPresence` on `arcCasesLevelRef` by the same single writer. So the beat is **labels fade → nodes fold and latch → card materializes into the frame they made**; close plays it backwards. The card's material opacities / visibility / scale-in / depth-write AND the stepper's opacity+inert all read `cardPresence`, never the raw `level` — the strict invariant (`arcCardPresence === 0` while `arcFoldInput < 1`) is unit-pinned. The sphere sigil is DELETED (ADR-042): the trigger is `ArcCasesCue`, a DOM dotted-leader + label docked UNDER the Build station title (mounted as the Build `StationBlock`'s `afterContent` in `CorridorStationHeaders`; it inherits the Build header's per-frame opacity, so it writes no scroll-coupled opacity of its own). Its world anchor (`intelligence.sigil`), `gateSigil`, and `SIGIL_Z` are gone. It keeps the ADR-041 contracts verbatim: `aria-controls="arc-cases-terminal"` + `aria-expanded`, every-frame `inert` reconciliation, stable callback ref, and the auto-disarm watcher. It arms only once the notes have SETTLED (`sigilSettle`, `ARC_SIGIL_SETTLE` [0.70, 0.84] on the smoothed stack — **measured against the live corridor; re-measure before retuning**); below the gate it is `inert` and CSS fades it out (`.is-armable`, toggled by its rAF). Because it sits at the TOP of the viewport, clear of the centred card, it **stays visible AND interactive while armed** (a second click / Escape closes it; Escape refocus falls out for free — it was never inert) — no phantom-click guard, no fade-to-0/pointer-events drop. The stepper ✕ CLOSE stays. Do NOT retune `ARC_BAND_IN` to "fix" its stale stack comment — the park (0.9225) sits below the accretion peak (0.95), so raising it would gate the card off entirely; sequencing is enforced on the trigger instead. In Playwright the cue rides the Build header's gyro parallax, so `locator.click()` can still flake ("element is not stable") — click at its box centre via `page.mouse.click`.

**#about is the pinned deck-flip stage (ADR-047; the ADR-046 cartridge
dock is REMOVED).** Across the services exit clock the four WebGL cards
STACK into a deck (azimuth sweep — never a Cartesian lerp; math in
`lib/services-ring/aboutDeckMath.ts`, exact identity at exit 0); the
pinned TRANSPARENT `#about` stage (300svh runway, `AboutStagePortal` →
`[data-about-root]`) then FLIPS the deck π on X to the shared portrait
back face (back planes carry `rotation.x = π` — Rx(π)∘Rx(π) = identity,
upright/unmirrored; the bake's chamfer chrome is MIRRORED to match the
flipped slab) and the deck lands on `.about-stage__slot`
(`aboutSlotRef`, viewport-first per frame). Beat 1 translates the cluster
right (the DOM owns the motion; the deck follows the rect) while the copy
reveals via scrubbed `--ci-off` stagger (never `useRevealMotion` — portal
nodes are unobserved and `.is-in` is one-shot). Two clamped clocks
(`exitProgressForRunway` + `aboutStageProgressRef`), single writer
`useAboutStageScroll`; the corridor ambient SURVIVES through #about and
dies at `#continuum` (retargeted kill; gate keyed to the SAME rect as the
fade envelope — the ADR-030 seam-cut bug). Fail-opaque shield
(`--about-bg-in`, default 1) + fail-static attribute
(`data-about-mode` absent ⇒ static `.voidwalker` + ADR-045 emerge —
mobile/PRM/fallback/flag-off). Flag: `ABOUT_DECK_STAGE`. Paint-stack rows
4c–4e in ADR-008. Every disengage path must clear `data-about-mode`
(including the media-flip null-render — the hook disengages when its
stage ref goes null).

**The left-rail manifest is parse-injected (ADR-031).** Its skeleton is
built at parse time (`lib/v7-parse/railManifest.ts`) into the authored
`<nav data-rail-manifest-root>` shell; `RailManifestController` mutates
it in place. Never `createRoot` into `[data-rail-manifest-root]` (it
clobbers the server skeleton); keep the shell markup in the prototype
HTML byte-exact (the parse regex + `tests/lib/rail-manifest.test.ts`
pin it); journey order lives in `lib/rail-manifest/entries.ts` under a
drift-guard test. The marker detent (Update 9 diamond) is a 350ms `top`
glide gated behind `data-ready`, and its position is a pure function of
`activeIdx` into a layout-computed detent table — never scroll-scrubbed,
no new scroll writers (recompute the table on resize/layout only). The
13-tick ladder always stays (ADR-031 Update 2).

**The left rail is a single detent diamond (ADR-031 Update 9, supersedes
the Update 3/6/7/8 rolodex).** The rail DISPLAYS one gold diamond (12px,
`.rail-manifest__diamond`, centred on the 2px rail track) that snaps to a
detent per journey entry — EVERY `MANIFEST_ENTRIES` row plus future
interstitials, at BEAT granularity in the corridor: hero → thesis →
**Navigate → Encode → Build** → services → about → continuum → practice
→ contact (the single "arc" entry is retired; the diamond follows the
corridor's structure, not just section boundaries). Do NOT re-add the
rolodex reel, the 3-pillar roster, per-row buttons, or the terminal
selection bar. Detent positions are scroll-PROPORTIONAL (each entry's
real scroll offset normalized 0..1 via `detentTable.ts` +
`scrollTargetForEntry` in `clickToNavigate.ts`; the corridor beats sit at
their parks — paintProgress × EPILOGUE_START → fractions 0.30/0.48/0.70),
recomputed on mount/resize/`ResizeObserver` only — the position write
(`--rail-diamond-top`) stays a pure function of the active index; do NOT
scroll-scrub it or add a per-frame scroll writer. The active corridor
beat comes from `data-corridor-phase`, which now publishes
`thesis|navigate|encode|build` (single writer: the CorridorStationHeaders
RAF, hand-offs `CORRIDOR_BEAT_ENTER` 0.2/0.48/0.78 — MIRRORS
CorridorProgressRail's STAGES band starts, keep in lockstep). The diamond
is visible from the hero (owner). On hover/focus it reveals the active
entry's title via a hidden `.rail-manifest__title` chip, gated on
`data-has-title`; `manifestTitle(entry)` (`entries.ts`) is `null` for
`hideActiveName` (hero) or a blank `name` (interstitials), so those
reveal nothing. `RAIL_ROWS`/`glyph` are REMOVED. A separate loadout bay
was tried and retired (Update 5) — do NOT reintroduce
`RailLoadout`/`data-rail-loadout-root`.

**Rail uniformity — each pillar: name on the left, sub-items on the
right (ADR-031 Updates 7–8).** During the Arc the right rail carries
Navigate/Encode/Build via `CorridorProgressRail` (a right-rail register
styled like `.tools-rail-register`, header `THE ARC · 03`), and
Services shows `SOURCE BUS · 04` via `ServicesRailRegister` (the
services half of the retired ToolsRailRegister — ADR-033; it mounts
into the legacy-named `[data-tools-rail-root]` slot, CSS in
`services.css`). About carries no register yet (follow-up candidate).
Do NOT move the Arc register back to a top-centre breadcrumb; pure read
of `paintProgress`, no new scroll writer. **Both registers share one
grid (Update 8):** they hang off mid-rail via
`calc(50% ± n·var(--rail-register-pitch))` (NOT the old
33.3/41.7/50/58.3%vh gauge), centred on the viewport midline
(`--rail-register-pitch` in `variables.css`). Keep the Arc and Services
registers on the SAME token — tighten/space them together, never one
alone. **Active signature = underline** (Update 8): the active row is
marked by a gold `text-decoration` underline (both registers), NOT a
filled diamond — the diamond markers stay passive outline ticks. (The
LEFT rail is now the Update 9 travelling detent diamond, not the terminal
rolodex — the two rails are still a deliberate pair, but the left's mark
is the single gold diamond, the right's is the register underline.)

**Process**

- Before non-trivial changes: [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) (Cycle B if adding a section; Cycle A after fixes).
- After any non-trivial fix: same file, Cycle A checklist.
