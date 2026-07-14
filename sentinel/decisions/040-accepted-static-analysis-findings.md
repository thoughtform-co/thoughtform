# ADR-040: Accepted static-analysis findings — what react-doctor flags on purpose

**Status:** Accepted
**Date:** 2026-07-14
**Context:** Phase 5 of the 2026-07-14 sweep. react-doctor now runs in CI scoped
to NEW issues (`--scope changed`, `verify.yml`). This ADR records the finding
classes that are DELIBERATE in this codebase, so nobody "fixes" them and no
future audit re-litigates them from scratch.

## Accepted classes

### 1. `dangerous-html-sink` on the v7-parse pipeline (~22 prod hits)

The marketing landing renders the parsed v7 prototype HTML via
`dangerouslySetInnerHTML` (`app/(marketing)/page.tsx` → `LandingPage`). This is
the sanctioned ADR-018/ADR-022 architecture: a BUILD-TIME parse of OUR OWN
checked-in prototype file (`public/prototypes/v7/landing-v7-motion.html`), with
`<script>` blocks stripped upstream by `sanitizeBodyMarkup`
(`lib/v7-parse/parseBody.ts`) and zero user input anywhere in the chain.
**Accepted. Do not churn.** New `dangerouslySetInnerHTML` sinks OUTSIDE the
v7-parse pipeline are NOT covered by this acceptance and need their own review.

### 2. `no-giant-component` (~26 prod hits)

House style is long, heavily documented components (ShellStack,
ServicesCardRing, ArcCasesCard, CorridorStationHeaders, LandingPage, …): the
corridor's painters carry their choreography rationale inline, and splitting
them for line-count's sake scatters tightly coupled per-frame logic.
**Accepted as REVIEW-not-refactor** — split only when a seam is genuinely free
(cf. the Phase-3 `journeyScalars.ts` / `ringCtaBox.ts` extractions, which were
made for bundle reasons, not line count).

### 3. `no-impure-state-updater` heuristic misfires (sibling setStates)

Phase 2 read every flagged production component individually (ServicesStage,
HudNav, TerminalReveal, Tree, ServicesPlateCluster, IntelligenceArtifactScene,
AuthProvider): none contains a `setState(fn)`-nested side effect — the rule's
callback-shape heuristic misfires on sibling setStates in ordinary
event/subscription handlers. The one REAL instance (ParticleConfigContext's
autosave inside updaters) was fixed in `e4f3bd0`. **Remaining hits in those
files: accepted.**

### 4. Scan-scope caveats (affects the headline score, not the code)

- react-doctor scans `legacy/` + `registry/` (~25% of findings) — dead/generated
  code the product's ESLint/TS already exclude. The product-source score is
  materially higher than the headline 30/100.
- It scans build output if present: delete `.next-verify` and clear
  `node_modules/.cache/react-doctor` + `%TEMP%/react-doctor-cache-*` before any
  full scan (see `sentinel/baselines/2026-07-14-phase0/react-doctor.md`).

## What is NOT accepted

Everything else — in particular `effect-needs-cleanup` (real leaks were fixed in
Phase 2; new ones are bugs), `supabase-rls-policy-risk` (tracked by ADR-037,
pending owner actions), and any NEW finding CI surfaces via `--scope changed`.

## Consequences

- CI (`react-doctor` job, PR-only) fails only on newly introduced issues;
  the classes above stay green because they are pre-existing.
- A future full-scan audit should read this ADR first and subtract these
  classes before panicking about the raw count.
